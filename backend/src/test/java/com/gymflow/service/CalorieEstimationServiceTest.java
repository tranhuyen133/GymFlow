package com.gymflow.service;

import com.gymflow.domain.*;
import com.gymflow.repository.MetReferenceRepository;
import com.gymflow.repository.WeightRecordRepository;
import com.gymflow.repository.WorkoutLogExerciseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CalorieEstimationServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDateTime SESSION_START = LocalDateTime.of(2026, 11, 9, 18, 0); // Thứ 2

    @Mock WeightRecordRepository weightRepository;
    @Mock MetReferenceRepository metReferenceRepository;
    @Mock WorkoutLogExerciseRepository logExerciseRepository;

    CalorieEstimationService service;
    Member member;
    WorkoutSchedule schedule;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(SESSION_START.atZone(ZONE).toInstant(), ZONE);
        service = new CalorieEstimationService(weightRepository,
                new MetReferenceService(metReferenceRepository), logExerciseRepository, clock);
        when(metReferenceRepository.findAll()).thenReturn(List.of());

        member = new Member();
        member.setId(1L);

        schedule = new WorkoutSchedule();
        schedule.setId(10L);
        schedule.setMember(member);
        schedule.setTitle("Buổi tập ngực");
        schedule.setStartTime(SESSION_START);
        schedule.setEndTime(SESSION_START.plusMinutes(60));

        WorkoutPlan plan = new WorkoutPlan();
        plan.setMember(member);
        plan.setName("Giáo án");
        plan.setStartDate(SESSION_START.toLocalDate());
        plan.setEndDate(SESSION_START.toLocalDate().plusDays(30));
        plan.setItems(new ArrayList<>());
        schedule.setPlan(plan);
    }

    private WorkoutPlanItem addItem(String name, MuscleGroup group, int sets, String reps, Integer restSeconds) {
        Exercise exercise = new Exercise();
        exercise.setName(name);
        exercise.setMuscleGroup(group);
        WorkoutPlanItem item = new WorkoutPlanItem();
        item.setPlan(schedule.getPlan());
        item.setExercise(exercise);
        item.setDayOfWeek(1);
        item.setSortOrder(schedule.getPlan().getItems().size());
        item.setSets(sets);
        item.setReps(reps);
        item.setRestSeconds(restSeconds);
        schedule.getPlan().getItems().add(item);
        return item;
    }

    private void weight(double kg, LocalDate date) {
        WeightRecord w = new WeightRecord();
        w.setMember(member);
        w.setRecordedDate(date);
        w.setWeightKg(kg);
        when(weightRepository.findFirstByMemberIdAndRecordedDateLessThanEqualOrderByRecordedDateDesc(1L, SESSION_START.toLocalDate()))
                .thenReturn(Optional.of(w));
    }

    @Test
    @DisplayName("Tập tạ: chỉ tính thời gian vận động, không cộng thời gian nghỉ")
    void strengthExcludesRest() {
        weight(70.0, SESSION_START.toLocalDate().minusDays(1));
        addItem("Bench Press", MuscleGroup.CHEST, 3, "10", 60);

        CalorieEstimate estimate = service.estimate(schedule, 60, ExerciseIntensity.MODERATE);

        assertThat(estimate.status()).isEqualTo(EstimateStatus.OK);
        assertThat(estimate.quality()).isEqualTo(EstimateQuality.DETAILED);
        assertThat(estimate.weightKg()).isEqualTo(70.0);
        assertThat(estimate.activeMinutes()).isEqualTo(1.5);
        assertThat(estimate.exercises()).hasSize(1);
        assertThat(estimate.exercises().get(0).activeMinutes()).isEqualTo(1.5);
        assertThat(estimate.exercises().get(0).restSeconds()).isEqualTo(60);
        assertThat(estimate.totalCalories()).isEqualTo(9);
    }

    @Test
    @DisplayName("Thiếu cân nặng: vẫn trả chi tiết nhưng calo null")
    void missingWeightReturnsNullCalories() {
        when(weightRepository.findFirstByMemberIdAndRecordedDateLessThanEqualOrderByRecordedDateDesc(any(), any()))
                .thenReturn(Optional.empty());
        addItem("Bench Press", MuscleGroup.CHEST, 3, "10", null);

        CalorieEstimate estimate = service.estimate(schedule, 60, ExerciseIntensity.MODERATE);

        assertThat(estimate.status()).isEqualTo(EstimateStatus.MISSING_WEIGHT);
        assertThat(estimate.totalCalories()).isNull();
        assertThat(estimate.exercises()).hasSize(1);
        assertThat(estimate.exercises().get(0).calories()).isNull();
    }

    @Test
    @DisplayName("Không có giáo án: fallback ước tính thô toàn buổi, đánh dấu COARSE")
    void noPlanUsesCoarseFallback() {
        weight(70.0, SESSION_START.toLocalDate());
        schedule.setPlan(null);

        CalorieEstimate estimate = service.estimate(schedule, 60, ExerciseIntensity.VIGOROUS);

        assertThat(estimate.status()).isEqualTo(EstimateStatus.OK);
        assertThat(estimate.quality()).isEqualTo(EstimateQuality.COARSE);
        assertThat(estimate.intensity()).isEqualTo(ExerciseIntensity.VIGOROUS);
        assertThat(estimate.exercises()).hasSize(1);
        assertThat(estimate.exercises().get(0).dataSource()).isEqualTo("FALLBACK");
        assertThat(estimate.exercises().get(0).activityCategory()).isEqualTo(ActivityCategory.OTHER);
        assertThat(estimate.totalCalories()).isEqualTo(368);
    }

    @Test
    @DisplayName("Tổng thời gian vận động không vượt thời lượng buổi tập")
    void capsActiveMinutesToSessionDuration() {
        weight(70.0, SESSION_START.toLocalDate());
        addItem("Bench Press", MuscleGroup.CHEST, 3, "10", null);
        addItem("Squat", MuscleGroup.LEGS, 3, "10", null);

        CalorieEstimate estimate = service.estimate(schedule, 2, ExerciseIntensity.MODERATE);

        assertThat(estimate.activeMinutes()).isEqualTo(2.0);
        assertThat(estimate.exercises()).hasSize(2);
        assertThat(estimate.exercises()).allSatisfy(e -> assertThat(e.activeMinutes()).isEqualTo(1.0));
    }
}
