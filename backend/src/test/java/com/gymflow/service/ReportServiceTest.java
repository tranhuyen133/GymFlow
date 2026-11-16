package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.MemberRepository;
import com.gymflow.repository.MemberSubscriptionRepository;
import com.gymflow.repository.PtSessionUsageRepository;
import com.gymflow.repository.WorkoutScheduleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.Mockito.*;

/** SCRUM-206 · RPT-01 báo cáo theo khoảng ngày, RPT-02 doanh thu theo tháng và theo gói (kèm chuyên cần RPT-03). */
@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock MemberSubscriptionRepository subscriptionRepository;
    @Mock WorkoutScheduleRepository scheduleRepository;
    @Mock MemberRepository memberRepository;
    @Mock PtSessionUsageRepository ptSessionUsageRepository;
    @Mock AccessService access;
    @Mock Mappers mappers;

    ReportService reports;

    static final LocalDate FROM = LocalDate.of(2026, 9, 1);
    static final LocalDate TO = LocalDate.of(2026, 11, 30);

    @BeforeEach
    void setUp() {
        reports = new ReportService(subscriptionRepository, scheduleRepository, memberRepository, ptSessionUsageRepository, access, mappers);
    }

    private static MemberSubscription sub(String planName, String snapshot, long price, LocalDateTime createdAt, boolean cancelled) {
        MembershipPlan plan = new MembershipPlan();
        plan.setName(planName);
        MemberSubscription s = new MemberSubscription();
        s.setPlan(plan);
        s.setPlanNameSnapshot(snapshot);
        s.setPricePaid(price);
        s.setCreatedAt(createdAt);
        s.setCancelled(cancelled);
        if (cancelled) s.setCancelledAt(createdAt.plusDays(1));
        return s;
    }

    private static Trainer trainer(long id, String name) {
        User u = new User();
        u.setFullName(name);
        Trainer t = new Trainer();
        t.setId(id);
        t.setUser(u);
        return t;
    }

    private static WorkoutSchedule session(Trainer trainer, ScheduleStatus status) {
        WorkoutSchedule s = new WorkoutSchedule();
        s.setTrainer(trainer);
        s.setStatus(status);
        s.setStartTime(LocalDateTime.of(2026, 10, 10, 18, 0));
        return s;
    }

    private static Member member(MemberStatus status, Gender gender, LocalDate joinedAt) {
        Member m = new Member();
        m.setStatus(status);
        m.setGender(gender);
        m.setJoinedAt(joinedAt);
        return m;
    }

    @Test
    void rejectsMissingOrReversedRange() {
        assertThatThrownBy(() -> reports.summary(null, TO))
                .isInstanceOf(ApiException.class)
                .extracting(x -> ((ApiException) x).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThatThrownBy(() -> reports.summary(TO, FROM))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Khoảng ngày không hợp lệ");
        verifyNoInteractions(subscriptionRepository, scheduleRepository, memberRepository);
    }

    @Test
    void rangeIsLimitedToOneYear() {
        assertThatThrownBy(() -> reports.summary(LocalDate.of(2025, 1, 1), LocalDate.of(2026, 1, 3)))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("tối đa 1 năm");

        // 366 ngày (năm nhuận 2024) vẫn được chấp nhận
        ReportResponse r = reports.summary(LocalDate.of(2024, 1, 1), LocalDate.of(2025, 1, 1));
        assertThat(r.revenueByMonth()).hasSize(13);
    }

    @Test
    void summarizesRevenueAttendanceAndMembersInRange() {
        when(subscriptionRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(
                sub("Gói 1 tháng", null, 500_000, LocalDateTime.of(2026, 9, 10, 9, 0), false),
                // gói đã đổi tên sau khi bán → báo cáo dùng tên lúc bán
                sub("Gói 3 tháng (mới)", "Gói 3 tháng", 1_200_000, LocalDateTime.of(2026, 11, 5, 10, 0), false),
                // đã huỷ → không tính
                sub("Gói 1 tháng", null, 900_000, LocalDateTime.of(2026, 10, 1, 8, 0), true),
                // ngoài khoảng (trước ngày bắt đầu)
                sub("Gói 1 tháng", null, 700_000, LocalDateTime.of(2026, 8, 31, 23, 0), false),
                // ngày cuối khoảng vẫn được tính
                sub("Gói 1 tháng", "Gói 1 tháng", 500_000, LocalDateTime.of(2026, 11, 30, 23, 59), false)));
        Trainer an = trainer(7, "HLV An");
        Trainer binh = trainer(8, "HLV Bình");
        when(scheduleRepository.findByStartTimeBetweenOrderByStartTimeAsc(FROM.atStartOfDay(), TO.plusDays(1).atStartOfDay()))
                .thenReturn(List.of(
                        session(an, ScheduleStatus.COMPLETED), session(an, ScheduleStatus.COMPLETED),
                        session(an, ScheduleStatus.MISSED), session(an, ScheduleStatus.CANCELLED),
                        session(binh, ScheduleStatus.COMPLETED),
                        session(null, ScheduleStatus.SCHEDULED)));
        when(memberRepository.findAll()).thenReturn(List.of(
                member(MemberStatus.ACTIVE, Gender.MALE, LocalDate.of(2026, 9, 15)),
                member(MemberStatus.PAUSED, Gender.FEMALE, LocalDate.of(2025, 1, 1)),
                member(MemberStatus.ACTIVE, null, TO)));

        ReportResponse r = reports.summary(FROM, TO);

        // RPT-01 / RPT-02 doanh thu
        assertThat(r.from()).isEqualTo(FROM);
        assertThat(r.to()).isEqualTo(TO);
        assertThat(r.revenueTotal()).isEqualTo(2_200_000);
        assertThat(r.subscriptionCount()).isEqualTo(3);
        assertThat(r.revenueByMonth()).extracting(LabelValue::label, LabelValue::value)
                .containsExactly(tuple("09/2026", 500_000L), tuple("10/2026", 0L), tuple("11/2026", 1_700_000L));
        assertThat(r.revenueByPlan()).extracting(LabelValue::label, LabelValue::value)
                .containsExactly(tuple("Gói 1 tháng", 1_000_000L), tuple("Gói 3 tháng", 1_200_000L));

        // RPT-03 chuyên cần: hoàn thành / (hoàn thành + vắng), buổi huỷ không tính
        assertThat(r.scheduled()).isEqualTo(5);
        assertThat(r.completed()).isEqualTo(3);
        assertThat(r.missed()).isEqualTo(1);
        assertThat(r.cancelled()).isEqualTo(1);
        assertThat(r.attendanceRate()).isEqualTo(75.0);
        assertThat(r.byTrainer()).extracting(TrainerAttendance::trainerName, TrainerAttendance::total,
                        TrainerAttendance::completed, TrainerAttendance::missed)
                .containsExactly(tuple("HLV An", 3L, 2L, 1L), tuple("HLV Bình", 1L, 1L, 0L));

        // hội viên
        assertThat(r.membersByStatus()).extracting(LabelValue::label, LabelValue::value)
                .containsExactly(tuple("ACTIVE", 2L), tuple("PAUSED", 1L), tuple("INACTIVE", 0L));
        assertThat(r.membersByGender()).extracting(LabelValue::label, LabelValue::value)
                .containsExactlyInAnyOrder(tuple("MALE", 1L), tuple("FEMALE", 1L), tuple("UNKNOWN", 1L));
        assertThat(r.newMembersByMonth()).extracting(LabelValue::label, LabelValue::value)
                .containsExactly(tuple("09/2026", 1L), tuple("10/2026", 0L), tuple("11/2026", 1L));
    }

    @Test
    void attendanceRateIsNullWhenNoSessionFinished() {
        when(scheduleRepository.findByStartTimeBetweenOrderByStartTimeAsc(any(), any()))
                .thenReturn(List.of(session(null, ScheduleStatus.SCHEDULED), session(null, ScheduleStatus.CANCELLED)));

        ReportResponse r = reports.summary(FROM, TO);

        assertThat(r.attendanceRate()).isNull();
        assertThat(r.scheduled()).isEqualTo(1);
        assertThat(r.revenueTotal()).isZero();
        assertThat(r.byTrainer()).isEmpty();
    }

    @Test
    void singleDayRangeCoversWholeDay() {
        LocalDate day = LocalDate.of(2026, 11, 14);
        when(subscriptionRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(
                sub("Gói 1 tháng", null, 500_000, day.atTime(0, 0), false),
                sub("Gói 1 tháng", null, 500_000, day.atTime(23, 59, 59), false),
                sub("Gói 1 tháng", null, 500_000, day.plusDays(1).atStartOfDay(), false)));

        ReportResponse r = reports.summary(day, day);

        assertThat(r.revenueTotal()).isEqualTo(1_000_000);
        assertThat(r.revenueByMonth()).extracting(LabelValue::label).containsExactly("11/2026");
        verify(scheduleRepository).findByStartTimeBetweenOrderByStartTimeAsc(day.atStartOfDay(), day.plusDays(1).atStartOfDay());
    }
}
