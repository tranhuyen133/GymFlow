package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.common.PageResponse;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.*;
import com.gymflow.security.AuthUser;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 29);

    @Mock MemberRepository memberRepository;
    @Mock TrainerRepository trainerRepository;
    @Mock MemberSubscriptionRepository subscriptionRepository;
    @Mock WorkoutPlanRepository workoutPlanRepository;
    @Mock WorkoutScheduleRepository scheduleRepository;
    @Mock WeightRecordRepository weightRepository;
    @Mock UserService userService;
    @Mock AccessService access;
    @Mock AuditService auditService;
    @Mock Mappers mappers;

    MemberService service;

    AuthUser adminUser;
    AuthUser trainerUser;
    AuthUser memberUser;
    Trainer trainer;
    Trainer inactiveTrainer;

    @BeforeEach
    void setUp() {
        service = new MemberService(memberRepository, trainerRepository, subscriptionRepository,
                workoutPlanRepository, scheduleRepository, weightRepository, userService, access, auditService, mappers);

        adminUser = new AuthUser(1L, "admin@gymflow.local", Role.ADMIN, "Admin");
        trainerUser = new AuthUser(2L, "trainer@gymflow.local", Role.TRAINER, "HLV Nam");
        memberUser = new AuthUser(3L, "member@gymflow.local", Role.MEMBER, "Hội viên Linh");

        User trainerAccount = new User();
        trainerAccount.setId(20L);
        trainerAccount.setFullName("HLV Nam");
        trainerAccount.setEmail("trainer@gymflow.local");

        trainer = new Trainer();
        trainer.setId(10L);
        trainer.setUser(trainerAccount);
        trainer.setActive(true);

        User inactiveTrainerAccount = new User();
        inactiveTrainerAccount.setId(21L);
        inactiveTrainerAccount.setFullName("HLV Nghỉ Việc");
        inactiveTrainerAccount.setEmail("inactive@gymflow.local");

        inactiveTrainer = new Trainer();
        inactiveTrainer.setId(15L);
        inactiveTrainer.setUser(inactiveTrainerAccount);
        inactiveTrainer.setActive(false);

        lenient().when(mappers.today()).thenReturn(TODAY);
        lenient().when(mappers.member(any(Member.class))).thenAnswer(inv -> {
            Member m = inv.getArgument(0);
            return dummyResponse(m);
        });
    }

    private MemberResponse dummyResponse(Member m) {
        return new MemberResponse(
                m.getId(),
                m.getUser() != null ? m.getUser().getId() : null,
                m.getCode(),
                m.getUser() != null ? m.getUser().getFullName() : null,
                m.getUser() != null ? m.getUser().getEmail() : null,
                m.getUser() != null ? m.getUser().getPhone() : null,
                m.getDateOfBirth(),
                m.getGender(),
                m.getHeightCm(),
                m.getGoal(),
                m.getAddress(),
                m.getStatus(),
                m.getUser() != null ? m.getUser().getStatus() : UserStatus.ACTIVE,
                m.getTrainer() != null ? m.getTrainer().getId() : null,
                m.getTrainer() != null && m.getTrainer().getUser() != null ? m.getTrainer().getUser().getFullName() : null,
                m.getJoinedAt(),
                m.getNote(),
                null,
                null,
                null,
                null
        );
    }

    // ==========================================
    // 1. Thêm hội viên sinh mã tăng dần (BR-16) và mật khẩu tạm tự sinh
    // ==========================================

    @Test
    @DisplayName("Thêm hội viên mới: sinh mã HV00001 khi maxId=0 và trả về mật khẩu tạm")
    void create_generatesHV00001_andReturnsTemporaryPassword() {
        User u = new User();
        u.setId(100L);
        u.setFullName("Nguyễn Văn A");
        u.setEmail("nva@gmail.com");

        when(memberRepository.maxId()).thenReturn(0L);
        when(memberRepository.existsByCode("HV00001")).thenReturn(false);
        when(userService.createAccount("nva@gmail.com", "Nguyễn Văn A", "0901234567", null, Role.MEMBER))
                .thenReturn(new UserService.Created(u, "Temp@9876"));

        MemberCreateRequest req = new MemberCreateRequest(
                "nva@gmail.com", "Nguyễn Văn A", "0901234567", null,
                LocalDate.of(1995, 5, 20), Gender.MALE, 175.0,
                "Tăng cơ", "Hà Nội", null, "Khách VIP"
        );

        MemberCreatedResponse res = service.create(req);

        assertThat(res.temporaryPassword()).isEqualTo("Temp@9876");
        assertThat(res.member().code()).isEqualTo("HV00001");
        assertThat(res.member().fullName()).isEqualTo("Nguyễn Văn A");

        ArgumentCaptor<Member> captor = ArgumentCaptor.forClass(Member.class);
        verify(memberRepository).save(captor.capture());
        Member saved = captor.getValue();
        assertThat(saved.getCode()).isEqualTo("HV00001");
        assertThat(saved.getStatus()).isEqualTo(MemberStatus.ACTIVE);
        assertThat(saved.getJoinedAt()).isEqualTo(TODAY);
        assertThat(saved.getUser()).isEqualTo(u);
        assertThat(saved.getTrainer()).isNull();

        verify(auditService).log(eq("MEMBER_CREATE"), eq("MEMBER"), any(), contains("HV00001"));
    }

    @Test
    @DisplayName("Thêm hội viên: sinh mã kế tiếp nếu mã đã tồn tại")
    void create_skipsExistingCode() {
        User u = new User();
        u.setId(101L);
        u.setFullName("Trần Thị B");
        u.setEmail("ttb@gmail.com");

        when(memberRepository.maxId()).thenReturn(5L);
        when(memberRepository.existsByCode("HV00006")).thenReturn(true);
        when(memberRepository.existsByCode("HV00007")).thenReturn(false);
        when(userService.createAccount(any(), any(), any(), any(), eq(Role.MEMBER)))
                .thenReturn(new UserService.Created(u, "Temp@1111"));

        MemberCreateRequest req = new MemberCreateRequest(
                "ttb@gmail.com", "Trần Thị B", "0912345678", null,
                LocalDate.of(2000, 1, 1), Gender.FEMALE, 160.0,
                "Giảm cân", "Đà Nẵng", null, null
        );

        MemberCreatedResponse res = service.create(req);
        assertThat(res.member().code()).isEqualTo("HV00007");
    }

    // ==========================================
    // 2. Tra cứu hội viên: q, lọc status, trainerId, phân trang, chặn size tối đa 200
    // ==========================================

    @Test
    @DisplayName("Tra cứu: Admin lọc q, status, trainerId và size bị giới hạn tối đa 200")
    void search_clampsSizeTo200_andAppliesFilters() {
        Page<Member> emptyPage = new PageImpl<>(Collections.emptyList());
        when(memberRepository.search(eq("Linh"), eq(MemberStatus.ACTIVE), eq(10L), any(PageRequest.class)))
                .thenReturn(emptyPage);

        PageResponse<MemberResponse> res = service.search(adminUser, "  Linh  ", MemberStatus.ACTIVE, 10L, 0, 500);

        assertThat(res).isNotNull();
        ArgumentCaptor<PageRequest> pageCaptor = ArgumentCaptor.forClass(PageRequest.class);
        verify(memberRepository).search(eq("Linh"), eq(MemberStatus.ACTIVE), eq(10L), pageCaptor.capture());
        PageRequest pr = pageCaptor.getValue();
        assertThat(pr.getPageSize()).isEqualTo(200);
        assertThat(pr.getPageNumber()).isEqualTo(0);
    }

    @Test
    @DisplayName("Tra cứu: size tối thiểu là 1, page tối thiểu là 0, q null trở thành chuỗi rỗng")
    void search_clampsMinPageAndSize_andHandlesNullQuery() {
        Page<Member> emptyPage = new PageImpl<>(Collections.emptyList());
        when(memberRepository.search(eq(""), isNull(), isNull(), any(PageRequest.class)))
                .thenReturn(emptyPage);

        service.search(adminUser, null, null, null, -5, -10);

        ArgumentCaptor<PageRequest> pageCaptor = ArgumentCaptor.forClass(PageRequest.class);
        verify(memberRepository).search(eq(""), isNull(), isNull(), pageCaptor.capture());
        PageRequest pr = pageCaptor.getValue();
        assertThat(pr.getPageSize()).isEqualTo(1);
        assertThat(pr.getPageNumber()).isEqualTo(0);
    }

    // ==========================================
    // 3. HLV chỉ tra cứu được hội viên do mình phụ trách (bị ép scope trainerId)
    // ==========================================

    @Test
    @DisplayName("Tra cứu: HLV bị ép scope trainerId của chính mình, bỏ qua trainerId gửi lên")
    void search_trainerRole_forcedToOwnTrainerId() {
        when(access.requireTrainerOf(trainerUser)).thenReturn(trainer); // id = 10L
        Page<Member> emptyPage = new PageImpl<>(Collections.emptyList());
        when(memberRepository.search(eq(""), isNull(), eq(10L), any(PageRequest.class)))
                .thenReturn(emptyPage);

        // Truyền trainerId = 999L nhưng phải bị ép về 10L
        service.search(trainerUser, "", null, 999L, 0, 20);

        verify(memberRepository).search(eq(""), isNull(), eq(10L), any(PageRequest.class));
    }

    // ==========================================
    // 4. Role MEMBER gọi tra cứu bị từ chối 403 (ApiException.forbidden)
    // ==========================================

    @Test
    @DisplayName("Tra cứu: Role MEMBER gọi search bị ném 403 Forbidden")
    void search_memberRole_throwsForbidden() {
        assertThatThrownBy(() -> service.search(memberUser, "", null, null, 0, 20))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        verifyNoInteractions(memberRepository);
    }

    // ==========================================
    // 5. Sửa hội viên: HLV hiện tại ngừng hoạt động nhưng không đổi HLV thì vẫn sửa được
    // ==========================================

    @Test
    @DisplayName("Sửa hội viên: HLV hiện tại không hoạt động nhưng không đổi HLV thì sửa thành công")
    void update_keepsInactiveTrainer_succeeds() {
        User user = new User();
        user.setId(50L);
        user.setFullName("Cũ");
        user.setPhone("0900000000");

        Member member = new Member();
        member.setId(1L);
        member.setCode("HV00001");
        member.setUser(user);
        member.setTrainer(inactiveTrainer); // HLV 15L đang inactive
        member.setHeightCm(170.0);
        member.setDateOfBirth(LocalDate.of(1990, 1, 1));

        when(access.loadMember(1L)).thenReturn(member);

        // Gửi cùng trainerId = 15L (không đổi HLV)
        MemberUpdateRequest req = new MemberUpdateRequest(
                "Mới", "0911111111", LocalDate.of(1992, 2, 2), Gender.FEMALE,
                168.0, "Mục tiêu mới", "Địa chỉ mới", 15L, "Ghi chú mới"
        );

        MemberResponse res = service.update(1L, req);

        assertThat(res).isNotNull();
        assertThat(user.getFullName()).isEqualTo("Mới");
        assertThat(user.getPhone()).isEqualTo("0911111111");
        assertThat(member.getHeightCm()).isEqualTo(168.0);
        assertThat(member.getGoal()).isEqualTo("Mục tiêu mới");
        assertThat(member.getTrainer()).isEqualTo(inactiveTrainer);

        // Không gọi resolveTrainer(15L) nên không gọi trainerRepository.findById(15L)
        verify(trainerRepository, never()).findById(15L);
        verify(auditService).log(eq("MEMBER_UPDATE"), eq("MEMBER"), eq(1L), eq("HV00001"));
    }

    // ==========================================
    // 6. Gán HLV ngừng hoạt động (trực tiếp hoặc qua sửa) bị từ chối 400
    // ==========================================

    @Test
    @DisplayName("Gán HLV trực tiếp: HLV ngừng hoạt động bị từ chối 400 Bad Request")
    void assignTrainer_inactiveTrainer_throwsBadRequest() {
        Member member = new Member();
        member.setId(1L);
        member.setCode("HV00001");

        when(access.loadMember(1L)).thenReturn(member);
        when(trainerRepository.findById(15L)).thenReturn(Optional.of(inactiveTrainer));

        assertThatThrownBy(() -> service.assignTrainer(1L, 15L))
                .isInstanceOf(ApiException.class)
                .hasMessage("Huấn luyện viên này đang ngừng nhận hội viên")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    @DisplayName("Sửa hội viên: đổi sang HLV ngừng hoạt động bị từ chối 400 Bad Request")
    void update_changingToInactiveTrainer_throwsBadRequest() {
        User user = new User();
        user.setId(50L);
        user.setFullName("Nguyễn Văn A");

        Member member = new Member();
        member.setId(1L);
        member.setCode("HV00001");
        member.setUser(user);
        member.setTrainer(null); // Hiện chưa có HLV

        when(access.loadMember(1L)).thenReturn(member);
        when(trainerRepository.findById(15L)).thenReturn(Optional.of(inactiveTrainer));

        MemberUpdateRequest req = new MemberUpdateRequest(
                "Nguyễn Văn A", null, null, null,
                null, null, null, 15L, null
        );

        assertThatThrownBy(() -> service.update(1L, req))
                .isInstanceOf(ApiException.class)
                .hasMessage("Huấn luyện viên này đang ngừng nhận hội viên");
    }

    // ==========================================
    // 7. Ràng buộc ngày sinh và chiều cao (MEM-02)
    // ==========================================

    @Test
    @DisplayName("Tạo hội viên: ngày sinh trước hoặc bằng 01/01/1900 bị từ chối 400")
    void create_dobBeforeOrEqual1900_throwsBadRequest() {
        MemberCreateRequest req = new MemberCreateRequest(
                "test@test.local", "Test", null, null,
                LocalDate.of(1900, 1, 1), Gender.MALE, 170.0,
                null, null, null, null
        );

        assertThatThrownBy(() -> service.create(req))
                .isInstanceOf(ApiException.class)
                .hasMessage("Ngày sinh phải sau ngày 01/01/1900");
    }

    @Test
    @DisplayName("Tạo hội viên: chiều cao ngoài khoảng 80-250 cm bị từ chối 400")
    void create_heightOutOfRange_throwsBadRequest() {
        MemberCreateRequest reqLow = new MemberCreateRequest(
                "test@test.local", "Test", null, null,
                LocalDate.of(1995, 1, 1), Gender.MALE, 79.9,
                null, null, null, null
        );
        assertThatThrownBy(() -> service.create(reqLow))
                .isInstanceOf(ApiException.class)
                .hasMessage("Chiều cao từ 80 đến 250 cm");

        MemberCreateRequest reqHigh = new MemberCreateRequest(
                "test@test.local", "Test", null, null,
                LocalDate.of(1995, 1, 1), Gender.MALE, 250.1,
                null, null, null, null
        );
        assertThatThrownBy(() -> service.create(reqHigh))
                .isInstanceOf(ApiException.class)
                .hasMessage("Chiều cao từ 80 đến 250 cm");
    }

    @Test
    @DisplayName("Sửa hội viên: ngày sinh trước hoặc bằng 01/01/1900 bị từ chối 400")
    void update_dobBeforeOrEqual1900_throwsBadRequest() {
        MemberUpdateRequest req = new MemberUpdateRequest(
                "Test", null, LocalDate.of(1899, 12, 31), Gender.MALE,
                170.0, null, null, null, null
        );

        assertThatThrownBy(() -> service.update(1L, req))
                .isInstanceOf(ApiException.class)
                .hasMessage("Ngày sinh phải sau ngày 01/01/1900");
    }

    @Test
    @DisplayName("Hội viên tự sửa: chiều cao ngoài khoảng 80-250 cm bị từ chối 400")
    void updateSelf_heightOutOfRange_throwsBadRequest() {
        MemberSelfUpdateRequest req = new MemberSelfUpdateRequest(
                null, LocalDate.of(1995, 1, 1), Gender.MALE, 70.0, null, null
        );

        assertThatThrownBy(() -> service.updateSelf(memberUser, req))
                .isInstanceOf(ApiException.class)
                .hasMessage("Chiều cao từ 80 đến 250 cm");
    }

    // ==========================================
    // 8. Trạng thái hội viên độc lập với trạng thái tài khoản (MEM-03)
    // ==========================================

    @Test
    @DisplayName("Đổi trạng thái hội viên: chỉ đổi Member.status, không đổi User.status")
    void setStatus_updatesMemberStatus_doesNotTouchUserStatus() {
        User user = new User();
        user.setId(50L);
        user.setStatus(UserStatus.ACTIVE);

        Member member = new Member();
        member.setId(1L);
        member.setCode("HV00001");
        member.setUser(user);
        member.setStatus(MemberStatus.ACTIVE);

        when(access.loadMember(1L)).thenReturn(member);

        MemberResponse res = service.setStatus(1L, MemberStatus.PAUSED);

        assertThat(member.getStatus()).isEqualTo(MemberStatus.PAUSED);
        assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
        verify(auditService).log(eq("MEMBER_STATUS"), eq("MEMBER"), eq(1L), contains("PAUSED"));
    }

    // ==========================================
    // 9. Chi tiết hội viên và hồ sơ cá nhân (MEM-06, MEM-07)
    // ==========================================

    @Test
    @DisplayName("Chi tiết hội viên (MEM-06): trả về hồ sơ, lịch sử gói, giáo án, cân nặng mới nhất, số buổi tập")
    void detail_returnsMemberDetailWithSubsPlansAndStats() {
        Member member = new Member();
        member.setId(1L);
        member.setCode("HV00001");

        when(access.requireView(adminUser, 1L)).thenReturn(member);
        when(subscriptionRepository.findByMemberIdOrderByStartDateDesc(1L)).thenReturn(Collections.emptyList());
        when(workoutPlanRepository.findByMemberIdOrderByStartDateDesc(1L)).thenReturn(Collections.emptyList());
        when(weightRepository.findFirstByMemberIdOrderByRecordedDateDesc(1L)).thenReturn(Optional.empty());
        when(scheduleRepository.countByMemberIdAndStatusNot(1L, ScheduleStatus.CANCELLED)).thenReturn(10L);
        when(scheduleRepository.countByMemberIdAndStatus(1L, ScheduleStatus.COMPLETED)).thenReturn(6L);

        MemberDetailResponse res = service.detail(adminUser, 1L);

        assertThat(res).isNotNull();
        assertThat(res.member().code()).isEqualTo("HV00001");
        assertThat(res.totalSessions()).isEqualTo(10L);
        assertThat(res.completedSessions()).isEqualTo(6L);
    }

    @Test
    @DisplayName("Hồ sơ của tôi (MEM-07): Member tự xem và sửa thông tin thể trạng, liên hệ")
    void me_and_updateSelf_succeeds() {
        User user = new User();
        user.setId(30L);
        user.setFullName("Linh");
        user.setPhone("0901112222");

        Member member = new Member();
        member.setId(2L);
        member.setCode("HV00002");
        member.setUser(user);
        member.setHeightCm(165.0);

        when(access.requireMemberOf(memberUser)).thenReturn(member);

        MemberResponse me = service.me(memberUser);
        assertThat(me.code()).isEqualTo("HV00002");

        MemberSelfUpdateRequest req = new MemberSelfUpdateRequest(
                "0988776655", LocalDate.of(1998, 8, 18), Gender.FEMALE,
                166.0, "Giữ dáng", "Hồ Chí Minh"
        );

        MemberResponse updated = service.updateSelf(memberUser, req);
        assertThat(user.getPhone()).isEqualTo("0988776655");
        assertThat(member.getHeightCm()).isEqualTo(166.0);
        assertThat(member.getGoal()).isEqualTo("Giữ dáng");
        assertThat(member.getAddress()).isEqualTo("Hồ Chí Minh");
        verify(auditService).log(eq("MEMBER_SELF_UPDATE"), eq("MEMBER"), eq(2L), isNull());
    }

    // ==========================================
    // 10. Bean Validation trên DTO (MEM-02)
    // ==========================================

    @Test
    @DisplayName("DTO Bean Validation: bắt lỗi ngày sinh <= 1900 và chiều cao ngoài 80-250")
    void dtoValidation_validatesDobAndHeight() {
        Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

        // MemberCreateRequest với dob <= 1900 và height < 80
        MemberCreateRequest invalidCreate = new MemberCreateRequest(
                "test@test.local", "Test User", "0901234567", null,
                LocalDate.of(1900, 1, 1), Gender.MALE, 75.0,
                null, null, null, null
        );
        var violationsCreate = validator.validate(invalidCreate);
        assertThat(violationsCreate).anyMatch(v -> v.getMessage().contains("Ngày sinh phải sau ngày 01/01/1900"));
        assertThat(violationsCreate).anyMatch(v -> v.getMessage().contains("Chiều cao từ 80 cm"));

        // MemberUpdateRequest với height > 250
        MemberUpdateRequest invalidUpdate = new MemberUpdateRequest(
                "Test User", "0901234567",
                LocalDate.of(1995, 1, 1), Gender.MALE, 255.0,
                null, null, null, null
        );
        var violationsUpdate = validator.validate(invalidUpdate);
        assertThat(violationsUpdate).anyMatch(v -> v.getMessage().contains("Chiều cao tối đa 250 cm"));

        // MemberSelfUpdateRequest hợp lệ
        MemberSelfUpdateRequest validSelf = new MemberSelfUpdateRequest(
                "0901234567", LocalDate.of(1995, 1, 1), Gender.FEMALE, 160.0,
                "Tập khỏe", "Hà Nội"
        );
        assertThat(validator.validate(validSelf)).isEmpty();
    }
}
