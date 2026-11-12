package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.CalorieSummaryResponse;
import com.gymflow.dto.Dtos.CompleteRequest;
import com.gymflow.repository.*;
import com.gymflow.security.AuthUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Testcontainers
class CalorieCompletionIntegrationTest {

    @Container
    @ServiceConnection
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.4")
            .withDatabaseName("gymflow")
            .withUsername("gymflow")
            .withPassword("gymflow_dev_password");

    @Autowired UserRepository userRepository;
    @Autowired MemberRepository memberRepository;
    @Autowired ExerciseRepository exerciseRepository;
    @Autowired WorkoutPlanRepository planRepository;
    @Autowired WorkoutScheduleRepository scheduleRepository;
    @Autowired WeightRecordRepository weightRepository;
    @Autowired WorkoutLogRepository logRepository;
    @Autowired WorkoutLogExerciseRepository logExerciseRepository;
    @Autowired ScheduleService scheduleService;
    @Autowired CalorieStatsService statsService;
    @Autowired JdbcTemplate jdbcTemplate;

    @AfterEach
    void tearDown() {
        jdbcTemplate.update("DELETE FROM audit_logs");
        jdbcTemplate.update("DELETE FROM workout_log_exercises");
        jdbcTemplate.update("DELETE FROM workout_logs");
        jdbcTemplate.update("DELETE FROM workout_schedules");
        jdbcTemplate.update("DELETE FROM workout_plan_items");
        jdbcTemplate.update("DELETE FROM workout_plans");
        jdbcTemplate.update("DELETE FROM weight_records");
        jdbcTemplate.update("DELETE FROM members");
        jdbcTemplate.update("DELETE FROM users");
    }

    @Test
    @DisplayName("Hoàn thành buổi tập ghi đúng calo MET, chi tiết bài và chống ghi lặp")
    void completePersistsMetEstimateAndIsIdempotent() {
        Member member = createMember("calorie.one");
        Exercise exercise = createExercise("Bench Press IT");
        WorkoutSchedule schedule = createSchedule(member, exercise, LocalDateTime.now().minusHours(2), 70.0);

        AuthUser user = auth(member);
        scheduleService.complete(user, schedule.getId(), new CompleteRequest(60, ExerciseIntensity.MODERATE, 5, "OK"));

        WorkoutLog log = logRepository.findByScheduleId(schedule.getId()).orElseThrow();
        assertThat(log.getCalories()).isNotNull().isPositive();
        assertThat(log.getEstimateStatus()).isEqualTo(EstimateStatus.OK);
        assertThat(log.getEstimateQuality()).isEqualTo(EstimateQuality.DETAILED);
        assertThat(log.isEstimated()).isTrue();
        assertThat(log.getWeightKgUsed()).isEqualTo(70.0);
        assertThat(log.getFormulaVersion()).isEqualTo(CalorieEstimationService.FORMULA_VERSION);

        List<WorkoutLogExercise> rows = logExerciseRepository.findByWorkoutLogIdOrderBySortOrderAsc(log.getId());
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).getActivityCategory()).isEqualTo(ActivityCategory.RESISTANCE);
        assertThat(rows.get(0).getMetValue()).isEqualTo(5.0);
        assertThat(rows.get(0).getActiveMinutes()).isEqualTo(1.5);
        assertThat(rows.get(0).getCalories()).isNotNull();

        assertThatThrownBy(() -> scheduleService.complete(user, schedule.getId(),
                new CompleteRequest(60, ExerciseIntensity.MODERATE, 5, "Lặp")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("đã được ghi nhận hoàn thành");
        assertThat(logRepository.findByScheduleId(schedule.getId())).isPresent();

        CalorieSummaryResponse summary = statsService.summary(user, member.getId(), "WEEK", LocalDate.now());
        assertThat(summary.totalCalories()).isEqualTo(log.getCalories().longValue());
        assertThat(summary.totalSessions()).isEqualTo(1);
    }

    @Test
    @DisplayName("Thiếu cân nặng: hoàn thành vẫn lưu nhưng calo null và không cộng vào thống kê")
    void missingWeightCompletesWithoutCalories() {
        Member member = createMember("calorie.two");
        Exercise exercise = createExercise("Squat IT");
        WorkoutSchedule schedule = createSchedule(member, exercise, LocalDateTime.now().minusHours(2), null);

        AuthUser user = auth(member);
        scheduleService.complete(user, schedule.getId(), new CompleteRequest(60, ExerciseIntensity.MODERATE, 4, null));

        WorkoutLog log = logRepository.findByScheduleId(schedule.getId()).orElseThrow();
        assertThat(log.getCalories()).isNull();
        assertThat(log.getEstimateStatus()).isEqualTo(EstimateStatus.MISSING_WEIGHT);
        assertThat(log.isEstimated()).isFalse();

        CalorieSummaryResponse summary = statsService.summary(user, member.getId(), "WEEK", LocalDate.now());
        assertThat(summary.totalCalories()).isZero();
        assertThat(summary.totalSessions()).isZero();
    }

    @Test
    @DisplayName("Buổi đã huỷ không được ghi nhận calo")
    void cancelledSessionIsRejected() {
        Member member = createMember("calorie.three");
        Exercise exercise = createExercise("Deadlift IT");
        WorkoutSchedule schedule = createSchedule(member, exercise, LocalDateTime.now().minusHours(2), 80.0);
        schedule.setStatus(ScheduleStatus.CANCELLED);
        scheduleRepository.saveAndFlush(schedule);

        AuthUser user = auth(member);
        assertThatThrownBy(() -> scheduleService.complete(user, schedule.getId(),
                new CompleteRequest(60, ExerciseIntensity.MODERATE, 3, null)))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("đã bị huỷ");
        assertThat(logRepository.findByScheduleId(schedule.getId())).isEmpty();
    }

    private AuthUser auth(Member member) {
        return new AuthUser(member.getUser().getId(), member.getUser().getEmail(), Role.MEMBER,
                member.getUser().getFullName());
    }

    private Member createMember(String prefix) {
        String suffix = String.valueOf(System.nanoTime());
        User user = new User();
        user.setEmail(prefix + "." + suffix + "@gymflow.test");
        user.setPasswordHash("$2a$10$abcdefghijklmnopqrstuv");
        user.setFullName("Hội Viên Test");
        user.setRole(Role.MEMBER);
        userRepository.saveAndFlush(user);

        Member member = new Member();
        member.setUser(user);
        member.setCode("HV" + suffix.substring(Math.max(0, suffix.length() - 8)));
        member.setStatus(MemberStatus.ACTIVE);
        member.setJoinedAt(LocalDate.now().minusDays(30));
        return memberRepository.saveAndFlush(member);
    }

    private Exercise createExercise(String name) {
        Exercise e = new Exercise();
        e.setName(name + " " + System.nanoTime());
        e.setMuscleGroup(MuscleGroup.CHEST);
        return exerciseRepository.saveAndFlush(e);
    }

    private WorkoutSchedule createSchedule(Member member, Exercise exercise, LocalDateTime start, Double weightKg) {
        WorkoutPlan plan = new WorkoutPlan();
        plan.setMember(member);
        plan.setName("Giáo án test");
        plan.setStartDate(start.toLocalDate().minusDays(1));
        plan.setEndDate(start.toLocalDate().plusDays(30));
        plan.setStatus(PlanStatus.ACTIVE);

        WorkoutPlanItem item = new WorkoutPlanItem();
        item.setPlan(plan);
        item.setExercise(exercise);
        item.setDayOfWeek(start.getDayOfWeek().getValue());
        item.setSortOrder(0);
        item.setSets(3);
        item.setReps("10");
        item.setRestSeconds(60);
        plan.getItems().add(item);
        planRepository.saveAndFlush(plan);

        WorkoutSchedule schedule = new WorkoutSchedule();
        schedule.setMember(member);
        schedule.setPlan(plan);
        schedule.setTitle("Buổi tập test");
        schedule.setStartTime(start);
        schedule.setEndTime(start.plusMinutes(60));
        schedule.setStatus(ScheduleStatus.SCHEDULED);
        schedule = scheduleRepository.saveAndFlush(schedule);

        if (weightKg != null) {
            WeightRecord w = new WeightRecord();
            w.setMember(member);
            w.setRecordedDate(start.toLocalDate().minusDays(1));
            w.setWeightKg(weightKg);
            weightRepository.saveAndFlush(w);
        }
        return schedule;
    }
}
