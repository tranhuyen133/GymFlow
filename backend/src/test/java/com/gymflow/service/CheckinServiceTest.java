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

    @Mock GymCheckinRepository checkinRepository;
    @Mock MemberSubscriptionRepository subscriptionRepository;
    @Mock WorkoutScheduleRepository scheduleRepository;
    @Mock UserRepository userRepository;
    @Mock AccessService access;
    @Mock Mappers mappers;
    @Mock MemberRepository memberRepository;

    CheckinCodes codes;
    CheckinService service;
    Member member;
    AuthUser memberUser = new AuthUser(9L, "hv@gymflow.vn", Role.MEMBER, "Hội viên");

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(NOW.atZone(ZONE).toInstant(), ZONE);
        codes = new CheckinCodes("test-secret-at-least-32-characters-long!!", "http://localhost", clock);
        service = new CheckinService(checkinRepository, subscriptionRepository, scheduleRepository, userRepository,
                access, codes, mappers, clock, memberRepository);
        User u = new User();
        u.setId(9L);
        u.setFullName("Nguyễn Văn An");
        member = new Member();
        member.setId(1L);
        member.setCode("HV00001");
        member.setUser(u);
        member.setStatus(MemberStatus.ACTIVE);
        lenient().when(access.requireMemberOf(memberUser)).thenReturn(member);
        lenient().when(checkinRepository.save(any())).thenAnswer(inv -> {
            GymCheckin c = inv.getArgument(0);
            c.setId(77L);
            return c;
        });
        lenient().when(subscriptionRepository.findEffective(eq(1L), any())).thenReturn(List.of(new MemberSubscription()));
        lenient().when(checkinRepository.findFirstByMemberIdAndCheckedInAtGreaterThanEqualOrderByCheckedInAtDesc(eq(1L), any()))
                .thenReturn(Optional.empty());
    }

    @Test
    @DisplayName("Mã đúng, có gói hiệu lực: ghi một lượt check-in QR lúc hiện tại")
    void checkinOk() {
        CheckinResult r = service.checkin(memberUser, codes.current());
        assertThat(r.already()).isFalse();
        assertThat(r.checkin().id()).isEqualTo(77L);
        assertThat(r.checkin().checkedInAt()).isEqualTo(NOW);
        assertThat(r.checkin().method()).isEqualTo(CheckinMethod.QR);
        verify(checkinRepository).save(any());
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
        CheckinResult r = service.checkin(memberUser, codes.current());
        assertThat(r.already()).isTrue();
        assertThat(r.checkin().id()).isEqualTo(5L);
        verify(checkinRepository, never()).save(any());
    }

    @Test
    @DisplayName("Không có gói còn hiệu lực hôm nay thì từ chối")
    void noSubscription() {
        when(subscriptionRepository.findEffective(eq(1L), any())).thenReturn(List.of());
        assertThatThrownBy(() -> service.checkin(memberUser, codes.current()))
                .isInstanceOf(ApiException.class).hasMessageContaining("gói tập");
        verify(checkinRepository, never()).save(any());
    }

    @Test
    @DisplayName("Hội viên đang bảo lưu thì từ chối")
    void paused() {
        member.setStatus(MemberStatus.PAUSED);
        assertThatThrownBy(() -> service.checkin(memberUser, codes.current()))
                .isInstanceOf(ApiException.class).hasMessageContaining("bảo lưu");
    }

    @Test
    @DisplayName("Nhập sai mã 5 lần thì khoá tạm, kể cả khi lần sau nhập đúng")
    void wrongCodeLimit() {
        String wrong = codes.current().equals("000000") ? "111111" : "000000";
        for (int i = 0; i < CheckinService.MAX_WRONG_CODES; i++) {
            assertThatThrownBy(() -> service.checkin(memberUser, wrong))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
        }
        assertThatThrownBy(() -> service.checkin(memberUser, codes.current()))
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

        Member twin = new Member();
        twin.setId(2L);
        twin.setCode("HV00002");
        User u2 = new User();
        u2.setPhone("0912345678");
        twin.setUser(u2);
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
