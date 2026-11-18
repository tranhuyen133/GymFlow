package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.CheckinDtos.CheckinResult;
import com.gymflow.repository.GymCheckinRepository;
import com.gymflow.repository.MemberRepository;
import com.gymflow.repository.MemberSubscriptionRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.repository.WorkoutScheduleRepository;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.*;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CheckinServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 17, 7, 40);

    /** Đồng hồ chỉnh được để thử mã hết hạn. */
    static final class TestClock extends Clock {
        Instant now;

        TestClock(Instant now) {
            this.now = now;
        }

        @Override
        public ZoneId getZone() {
            return ZONE;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }

    @Mock GymCheckinRepository checkinRepository;
    @Mock MemberSubscriptionRepository subscriptionRepository;
    @Mock WorkoutScheduleRepository scheduleRepository;
    @Mock UserRepository userRepository;
    @Mock AccessService access;
    @Mock Mappers mappers;
    @Mock MemberRepository memberRepository;

    TestClock clock;
    CheckinCodes codes;
    CheckinService service;
    Member member;
    Member other;
    AuthUser memberUser = new AuthUser(9L, "hv@gymflow.vn", Role.MEMBER, "Hội viên");
    AuthUser otherUser = new AuthUser(10L, "hv2@gymflow.vn", Role.MEMBER, "Hội viên 2");

    @BeforeEach
    void setUp() {
        clock = new TestClock(NOW.atZone(ZONE).toInstant());
        codes = new CheckinCodes("test-secret-at-least-32-characters-long!!", "http://localhost", clock);
        service = new CheckinService(checkinRepository, subscriptionRepository, scheduleRepository, userRepository,
                access, codes, mappers, clock, memberRepository);
        member = member(1L, 9L, "HV00001", "Nguyễn Văn An");
        other = member(2L, 10L, "HV00002", "Trần Thị Bình");
        lenient().when(access.requireMemberOf(memberUser)).thenReturn(member);
        lenient().when(access.requireMemberOf(otherUser)).thenReturn(other);
        lenient().when(checkinRepository.save(any())).thenAnswer(inv -> {
            GymCheckin c = inv.getArgument(0);
            c.setId(77L);
            return c;
        });
        lenient().when(subscriptionRepository.findEffective(anyLong(), any())).thenReturn(List.of(new MemberSubscription()));
        lenient().when(checkinRepository.findFirstByMemberIdAndCheckedInAtGreaterThanEqualOrderByCheckedInAtDesc(anyLong(), any()))
                .thenReturn(Optional.empty());
    }

    private static Member member(long id, long userId, String code, String name) {
        User u = new User();
        u.setId(userId);
        u.setFullName(name);
        Member m = new Member();
        m.setId(id);
        m.setCode(code);
        m.setUser(u);
        m.setStatus(MemberStatus.ACTIVE);
        return m;
    }

    private String live() {
        return codes.currentLive().code();
    }

    @Test
    @DisplayName("Mã động trên màn hình quầy, có gói hiệu lực: ghi một lượt check-in QR lúc hiện tại")
    void checkinOk() {
        CheckinResult r = service.checkin(memberUser, live());
        assertThat(r.already()).isFalse();
        assertThat(r.checkin().id()).isEqualTo(77L);
        assertThat(r.checkin().checkedInAt()).isEqualTo(NOW);
        assertThat(r.checkin().method()).isEqualTo(CheckinMethod.QR);
        verify(checkinRepository).save(any());
    }

    @Test
    @DisplayName("Mỗi mã chỉ một người dùng: người thứ hai dùng lại mã bị từ chối, màn hình đã đổi sang mã mới")
    void liveCodeOneTime() {
        String code = live();
        service.checkin(memberUser, code);
        assertThatThrownBy(() -> service.checkin(otherUser, code))
                .isInstanceOf(ApiException.class).hasMessageContaining("một lần");
        assertThat(live()).isNotEqualTo(code);
        verify(checkinRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Chụp mã gửi về nhà: quá 30 giây + 15 giây chờ thì mã hết hạn")
    void liveCodeExpires() {
        String code = live();
        clock.now = clock.now.plus(CheckinCodes.LIVE_TTL).plus(CheckinCodes.LIVE_GRACE).plusSeconds(1);
        assertThatThrownBy(() -> service.checkin(memberUser, code))
                .isInstanceOf(ApiException.class).hasMessageContaining("hết hạn");
        verify(checkinRepository, never()).save(any());
    }

    @Test
    @DisplayName("Vừa đổi mã (trong 15 giây chờ) vẫn nhận mã cũ – mạng chậm không bị oan")
    void liveCodeGrace() {
        String code = live();
        clock.now = clock.now.plus(CheckinCodes.LIVE_TTL).plusSeconds(5);
        assertThat(live()).isNotEqualTo(code);
        assertThat(service.checkin(memberUser, code).already()).isFalse();
    }

    @Test
    @DisplayName("Mã in dán theo ngày mặc định không còn được nhận; bật cấu hình thì nhận lại")
    void dailyCodeDisabledByDefault() {
        assertThatThrownBy(() -> service.checkin(memberUser, codes.current()))
                .isInstanceOf(ApiException.class).hasMessageContaining("màn hình");
        ReflectionTestUtils.setField(service, "dailyCodeEnabled", true);
        assertThat(service.checkin(memberUser, codes.current()).already()).isFalse();
    }

    @Test
    @DisplayName("Mã động cho màn hình quầy: còn ≤ 30 giây, đường dẫn chứa mã")
    void liveCodeForKiosk() {
        var l = service.liveCode("https://gymflow.io.vn");
        assertThat(l.code()).matches("\\d{6}");
        assertThat(l.secondsLeft()).isBetween(1, 30);
        assertThat(l.url()).isEqualTo("https://gymflow.io.vn/checkin?c=" + l.code());
        assertThat(l.qr()).isNotEmpty();
    }

    @Test
    @DisplayName("Đã check-in trong 3 giờ qua: trả lại lượt cũ, không ghi thêm")
    void duplicate() {
        GymCheckin old = new GymCheckin();
        old.setId(5L);
        old.setMember(member);
        old.setCheckedInAt(NOW.minusMinutes(40));
        when(checkinRepository.findFirstByMemberIdAndCheckedInAtGreaterThanEqualOrderByCheckedInAtDesc(eq(1L), any()))
                .thenReturn(Optional.of(old));
        CheckinResult r = service.checkin(memberUser, live());
        assertThat(r.already()).isTrue();
        assertThat(r.checkin().id()).isEqualTo(5L);
        verify(checkinRepository, never()).save(any());
    }

    @Test
    @DisplayName("Không có gói còn hiệu lực hôm nay thì từ chối")
    void noSubscription() {
        when(subscriptionRepository.findEffective(eq(1L), any())).thenReturn(List.of());
        assertThatThrownBy(() -> service.checkin(memberUser, live()))
                .isInstanceOf(ApiException.class).hasMessageContaining("gói tập");
        verify(checkinRepository, never()).save(any());
    }

    @Test
    @DisplayName("Hội viên đang bảo lưu thì từ chối")
    void paused() {
        member.setStatus(MemberStatus.PAUSED);
        assertThatThrownBy(() -> service.checkin(memberUser, live()))
                .isInstanceOf(ApiException.class).hasMessageContaining("bảo lưu");
    }

    @Test
    @DisplayName("Nhập sai mã 5 lần thì khoá tạm, kể cả khi lần sau nhập đúng")
    void wrongCodeLimit() {
        String good = live();
        String wrong = good.equals("000000") ? "111111" : "000000";
        for (int i = 0; i < CheckinService.MAX_WRONG_CODES; i++) {
            assertThatThrownBy(() -> service.checkin(memberUser, wrong))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
        }
        assertThatThrownBy(() -> service.checkin(memberUser, good))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS));
        verify(checkinRepository, never()).save(any());
    }

    @Test
    @DisplayName("Quản lý check-in hộ: ghi lượt MANUAL kèm người bấm")
    void manual() {
        User admin = new User();
        admin.setId(2L);
        admin.setFullName("Quản lý GymFlow");
        when(access.loadMember(1L)).thenReturn(member);
        when(userRepository.findById(2L)).thenReturn(Optional.of(admin));
        CheckinResult r = service.manual(new AuthUser(2L, "admin@gymflow.vn", Role.ADMIN, "Quản lý"), 1L);
        assertThat(r.checkin().method()).isEqualTo(CheckinMethod.MANUAL);
        assertThat(r.checkin().createdByName()).isEqualTo("Quản lý GymFlow");
    }

    @Test
    @DisplayName("Lễ tân quét thẻ (mã HV) hoặc gõ số điện thoại: tìm đúng một hội viên rồi ghi lượt MANUAL")
    void deskByCodeOrPhone() {
        AuthUser admin = new AuthUser(2L, "admin@gymflow.vn", Role.ADMIN, "Quản lý");
        member.getUser().setPhone("0912345678");
        when(memberRepository.search(eq("HV00001"), isNull(), isNull(), any())).thenReturn(new PageImpl<>(List.of(member)));
        when(memberRepository.search(eq("912345678"), isNull(), isNull(), any())).thenReturn(new PageImpl<>(List.of(member)));

        assertThat(service.desk(admin, " HV00001 ").checkin().method()).isEqualTo(CheckinMethod.MANUAL);
        assertThat(service.desk(admin, "+84 912 345 678").checkin().memberCode()).isEqualTo("HV00001");
    }

    @Test
    @DisplayName("Lễ tân gõ mã không khớp hoặc số điện thoại trùng nhiều người thì báo rõ, không ghi lượt")
    void deskNotFoundOrAmbiguous() {
        AuthUser admin = new AuthUser(2L, "admin@gymflow.vn", Role.ADMIN, "Quản lý");
        when(memberRepository.search(eq("HV9"), isNull(), isNull(), any())).thenReturn(new PageImpl<>(List.of(member)));
        assertThatThrownBy(() -> service.desk(admin, "HV9")).isInstanceOf(ApiException.class).hasMessageContaining("Không tìm thấy");

        Member twin = member(3L, 11L, "HV00003", "Lê Văn C");
        twin.getUser().setPhone("0912345678");
        member.getUser().setPhone("0912345678");
        when(memberRepository.search(eq("912345678"), isNull(), isNull(), any())).thenReturn(new PageImpl<>(List.of(member, twin)));
        assertThatThrownBy(() -> service.desk(admin, "0912345678")).isInstanceOf(ApiException.class).hasMessageContaining("mã hội viên");
        verify(checkinRepository, never()).save(any());
    }

    @Test
    @DisplayName("Thẻ hội viên: QR chứa đúng mã hội viên")
    void card() {
        var c = service.card(memberUser);
        assertThat(c.memberCode()).isEqualTo("HV00001");
        assertThat(c.qr()).isNotEmpty();
    }
}
