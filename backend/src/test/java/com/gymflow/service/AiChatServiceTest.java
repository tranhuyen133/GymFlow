package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.Exercise;
import com.gymflow.domain.Member;
import com.gymflow.domain.MemberSubscription;
import com.gymflow.domain.MembershipPlan;
import com.gymflow.domain.PlanStatus;
import com.gymflow.domain.Role;
import com.gymflow.domain.ScheduleStatus;
import com.gymflow.domain.Trainer;
import com.gymflow.domain.User;
import com.gymflow.domain.WeightRecord;
import com.gymflow.domain.WorkoutPlan;
import com.gymflow.domain.WorkoutPlanItem;
import com.gymflow.domain.WorkoutSchedule;
import com.gymflow.repository.MemberSubscriptionRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.repository.WeightRecordRepository;
import com.gymflow.repository.WorkoutPlanRepository;
import com.gymflow.repository.WorkoutScheduleRepository;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * CHỦ FILE: Huyền (Trần Thị Khánh Huyền)
 * CẦN LÀM: Test ngữ cảnh hội viên; GeminiClient được mock nên không gọi API thật.
 */
@ExtendWith(MockitoExtension.class)
class AiChatServiceTest {

    private static final Clock CLOCK =
            Clock.fixed(Instant.parse("2026-11-17T03:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 17);

    @Mock UserRepository userRepository;
    @Mock AccessService access;
    @Mock MemberSubscriptionRepository subscriptionRepository;
    @Mock WorkoutPlanRepository planRepository;
    @Mock WorkoutScheduleRepository scheduleRepository;
    @Mock WeightRecordRepository weightRepository;
    @Mock GeminiClient geminiClient;

    AiChatService service;
    User memberUser;
    Member member;

    @BeforeEach
    void setUp() {
        service = new AiChatService(userRepository, access, subscriptionRepository, planRepository,
                scheduleRepository, weightRepository, geminiClient, CLOCK);

        memberUser = new User();
        memberUser.setId(1L);
        memberUser.setRole(Role.MEMBER);
        memberUser.setEmail("a@example.test");
        memberUser.setFullName("Hội viên A");
        memberUser.setPhone("0901234567");
        memberUser.setPasswordHash("secret-hash");

        member = new Member();
        member.setId(10L);
        member.setCode("HV00010");
        member.setUser(memberUser);
    }

    private void stubMember() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(memberUser));
        when(access.requireMemberOf(any(AuthUser.class))).thenReturn(member);
    }

    @Test
    void chatSendsOnlyOwnDataAndCurrentQuestionToGemini() {
        stubMember();

        MembershipPlan plan = new MembershipPlan();
        plan.setName("Gói 3 tháng");
        MemberSubscription subscription = new MemberSubscription();
        subscription.setPlan(plan);
        subscription.setPlanNameSnapshot("Gói 3 tháng");
        subscription.setStartDate(TODAY.minusDays(20));
        subscription.setEndDate(TODAY.plusDays(10));
        when(subscriptionRepository
                .findFirstByMemberIdAndCancelledFalseAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByEndDateDesc(
                        eq(10L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Optional.of(subscription));

        WorkoutPlan workoutPlan = new WorkoutPlan();
        workoutPlan.setName("Tăng cơ");
        Exercise bench = new Exercise();
        bench.setName("Bench Press");
        WorkoutPlanItem item = new WorkoutPlanItem();
        item.setPlan(workoutPlan);
        item.setExercise(bench);
        item.setDayOfWeek(1);
        item.setSortOrder(1);
        item.setSets(4);
        item.setReps("8-10");
        workoutPlan.setItems(new ArrayList<>(List.of(item)));
        when(planRepository.findFirstByMemberIdAndStatusOrderByStartDateDesc(10L, PlanStatus.ACTIVE))
                .thenReturn(Optional.of(workoutPlan));

        Trainer trainer = new Trainer();
        User trainerUser = new User();
        trainerUser.setFullName("HLV Phúc");
        trainer.setUser(trainerUser);

        WorkoutSchedule upcoming = new WorkoutSchedule();
        upcoming.setMember(member);
        upcoming.setTrainer(trainer);
        upcoming.setTitle("Tập ngực");
        upcoming.setStartTime(TODAY.atTime(18, 0));
        upcoming.setEndTime(TODAY.atTime(19, 0));
        upcoming.setStatus(ScheduleStatus.SCHEDULED);
        when(scheduleRepository.findInRange(any(), any(), eq(10L), isNull()))
                .thenReturn(List.of(upcoming));

        WorkoutSchedule completed = new WorkoutSchedule();
        completed.setMember(member);
        completed.setStartTime(TODAY.minusDays(2).atTime(18, 0));
        completed.setEndTime(TODAY.minusDays(2).atTime(19, 0));
        completed.setStatus(ScheduleStatus.COMPLETED);
        WorkoutSchedule missed = new WorkoutSchedule();
        missed.setMember(member);
        missed.setStartTime(TODAY.minusDays(3).atTime(18, 0));
        missed.setEndTime(TODAY.minusDays(3).atTime(19, 0));
        missed.setStatus(ScheduleStatus.MISSED);
        when(scheduleRepository.findTop5ByMemberIdAndStatusInOrderByStartTimeDesc(eq(10L), anyList()))
                .thenReturn(List.of(completed, missed));

        WeightRecord weight = new WeightRecord();
        weight.setMember(member);
        weight.setRecordedDate(TODAY.minusDays(1));
        weight.setWeightKg(70.5);
        when(weightRepository.findTop3ByMemberIdOrderByRecordedDateDesc(10L)).thenReturn(List.of(weight));

        when(geminiClient.ask(anyString())).thenReturn("Câu trả lời từ Gemini");

        String reply = service.chat(1L, "Hôm nay mình tập gì?");

        assertThat(reply).isEqualTo("Câu trả lời từ Gemini");

        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        verify(geminiClient).ask(promptCaptor.capture());
        String prompt = promptCaptor.getValue();

        assertThat(prompt)
                .contains("Bạn là trợ lý tập luyện của phòng gym GymFlow")
                .contains("Gói tập: Gói 3 tháng")
                .contains("hết hạn 27/11/2026")
                .contains("còn 10 ngày")
                .contains("Giáo án: Tăng cơ")
                .contains("Thứ 2: Bench Press 4x8-10")
                .contains("17/11 18:00-19:00, HLV: HLV Phúc")
                .contains("15/11: hoàn thành")
                .contains("14/11: vắng")
                .contains("16/11: 70.5 kg")
                .contains("CÂU HỎI: Hôm nay mình tập gì?");

        // Không đưa PII hay mật khẩu vào prompt.
        assertThat(prompt).doesNotContain("a@example.test", "0901234567", "secret-hash");

        // Chỉ truy vấn hồ sơ của đúng tài khoản đang gọi.
        verify(access).requireMemberOf(argThat(auth -> auth.id().equals(1L)));
        verify(subscriptionRepository)
                .findFirstByMemberIdAndCancelledFalseAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByEndDateDesc(
                        eq(10L), any(LocalDate.class), any(LocalDate.class));
        verify(scheduleRepository).findTop5ByMemberIdAndStatusInOrderByStartTimeDesc(eq(10L), anyList());
    }

    @Test
    void trainerAndAdminCannotUseMemberAssistant() {
        User trainer = new User();
        trainer.setId(2L);
        trainer.setRole(Role.TRAINER);
        trainer.setEmail("trainer@example.test");
        trainer.setFullName("HLV");
        User admin = new User();
        admin.setId(3L);
        admin.setRole(Role.ADMIN);
        admin.setEmail("admin@example.test");
        admin.setFullName("Admin");

        when(userRepository.findById(2L)).thenReturn(Optional.of(trainer));
        when(userRepository.findById(3L)).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> service.chat(2L, "Hôm nay ai tập?"))
                .isInstanceOfSatisfying(ApiException.class,
                        error -> assertThat(error.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> service.chat(3L, "Hôm nay ai tập?"))
                .isInstanceOfSatisfying(ApiException.class,
                        error -> assertThat(error.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        verifyNoInteractions(geminiClient, access);
    }

    @Test
    void blankQuestionIsRejectedBeforeCallingGemini() {
        assertThatThrownBy(() -> service.chat(1L, "   "))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("nhập câu hỏi");

        verifyNoInteractions(userRepository, geminiClient);
    }

    @Test
    void geminiErrorsArePropagated() {
        stubMember();
        when(geminiClient.ask(anyString()))
                .thenThrow(new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Trợ lý đang bận, vui lòng thử lại sau ít phút"));

        assertThatThrownBy(() -> service.chat(1L, "Hôm nay mình tập gì?"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Trợ lý đang bận");
    }

    @Test
    void contextIsCappedAround1500Characters() {
        stubMember();

        WorkoutPlan longPlan = new WorkoutPlan();
        longPlan.setName("Giáo án rất dài");
        List<WorkoutPlanItem> items = new ArrayList<>();
        for (int day = 1; day <= 7; day++) {
            for (int i = 0; i < 8; i++) {
                Exercise exercise = new Exercise();
                exercise.setName("Bài tập siêu dài tên số " + day + "-" + i);
                WorkoutPlanItem item = new WorkoutPlanItem();
                item.setPlan(longPlan);
                item.setExercise(exercise);
                item.setDayOfWeek(day);
                item.setSortOrder(i);
                item.setSets(4);
                item.setReps("10-12");
                items.add(item);
            }
        }
        longPlan.setItems(items);
        when(planRepository.findFirstByMemberIdAndStatusOrderByStartDateDesc(10L, PlanStatus.ACTIVE))
                .thenReturn(Optional.of(longPlan));

        String context = service.buildContext(1L);

        assertThat(context.length()).isLessThanOrEqualTo(1500);
        assertThat(context).endsWith("…");
    }
}
