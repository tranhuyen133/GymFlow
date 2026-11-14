package com.gymflow.service;

import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.CalorieBackfillResponse;
import com.gymflow.dto.Dtos.CalorieSummaryResponse;
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

@SpringBootTest
@Testcontainers
class CalorieBackfillIntegrationTest {

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
    @Autowired CalorieBackfillService backfillService;
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
    @DisplayName("Backfill tính MET cho log lịch sử, giữ calo cũ và không ghi trùng")
    void backfillLegacyLogIsIdempotent() {
        Member member = createMember("backfill.one");
        Exercise exercise = createExercise("Bench Press Backfill");
        WorkoutSchedule schedule = createSchedule(member, exercise, 70.0, ScheduleStatus.COMPLETED);
        WorkoutLog log = createLegacyLog(member, schedule, 999);

        CalorieBackfillResponse first = backfillService.backfillLegacy();

        assertThat(first.processed()).isEqualTo(1);
        assertThat(first.estimated()).isEqualTo(1);
        WorkoutLog saved = logRepository.findById(log.getId()).orElseThrow();
        assertThat(saved.getCalories()).isNotNull().isPositive().isNotEqualTo(999);
        assertThat(saved.getLegacyCalories()).isEqualTo(999);
        assertThat(saved.getEstimateStatus()).isEqualTo(EstimateStatus.OK);
        assertThat(saved.getEstimateQuality()).isEqualTo(EstimateQuality.COARSE);
        assertThat(saved.isEstimated()).isTrue();
        assertThat(saved.getWeightKgUsed()).isEqualTo(70.0);
        assertThat(saved.getFormulaVersion()).isEqualTo(CalorieBackfillService.FORMULA_VERSION);

        List<WorkoutLogExercise> rows = logExerciseRepository.findByWorkoutLogIdOrderBySortOrderAsc(log.getId());
        assertThat(rows).hasSize(2);
        assertThat(rows.get(0).getMetValue()).isEqualTo(5.0);

        CalorieBackfillResponse second = backfillService.backfillLegacy();
        assertThat(second.processed()).isZero();
        assertThat(logExerciseRepository.findByWorkoutLogIdOrderBySortOrderAsc(log.getId())).hasSize(2);

        AuthUser user = auth(member);
        CalorieSummaryResponse summary = statsService.summary(user, member.getId(), "WEEK", LocalDate.now());
        assertThat(summary.totalSessions()).isEqualTo(1);
        assertThat(summary.estimatedSessions()).isEqualTo(1);
        assertThat(summary.totalCalories()).isEqualTo(saved.getCalories().longValue());
    }

    @Test
    @DisplayName("Backfill bỏ qua buổi đã huỷ")
    void cancelledScheduleIsSkipped() {
        Member member = createMember("backfill.cancel");
        Exercise exercise = createExercise("Squat Backfill");
        WorkoutSchedule schedule = createSchedule(member, exercise, 65.0, ScheduleStatus.CANCELLED);
        WorkoutLog log = createLegacyLog(member, schedule, 500);

        CalorieBackfillResponse result = backfillService.backfillLegacy();

        assertThat(result.processed()).isZero();
        assertThat(result.skipped()).isEqualTo(1);
        WorkoutLog saved = logRepository.findById(log.getId()).orElseThrow();
        assertThat(saved.getEstimateStatus()).isEqualTo(EstimateStatus.LEGACY);
        assertThat(saved.getCalories()).isEqualTo(500);
    }

    @Test
    @DisplayName("Backfill thiếu cân nặng để trống calo và không chạy lại tự động")
    void missingWeightIsNotInvented() {
        Member member = createMember("backfill.noweight");
        Exercise exercise = createExercise("Deadlift Backfill");
        WorkoutSchedule schedule = createSchedule(member, exercise, null, ScheduleStatus.COMPLETED);
        WorkoutLog log = createLegacyLog(member, schedule, 700);

        CalorieBackfillResponse result = backfillService.backfillLegacy();

        assertThat(result.missingWeight()).isEqualTo(1);
        WorkoutLog saved = logRepository.findById(log.getId()).orElseThrow();
        assertThat(saved.getCalories()).isNull();
        assertThat(saved.getEstimateStatus()).isEqualTo(EstimateStatus.MISSING_WEIGHT);
        assertThat(saved.isEstimated()).isFalse();
        assertThat(saved.getLegacyCalories()).isEqualTo(700);
        assertThat(saved.getCalculatedAt()).isNotNull();

        assertThat(backfillService.backfillLegacy().processed()).isZero();
    }

    @Test
    @DisplayName("Tính lại cho hội viên sau khi nhập cân nặng sẽ điền calo")
    void recomputeMemberAfterWeightIsAdded() {
        Member member = createMember("backfill.recompute");
        Exercise exercise = createExercise("Row Backfill");
        WorkoutSchedule schedule = createSchedule(member, exercise, null, ScheduleStatus.COMPLETED);
        WorkoutLog log = createLegacyLog(member, schedule, 400);
        backfillService.backfillLegacy();
        assertThat(logRepository.findById(log.getId()).orElseThrow().getCalories()).isNull();

        WeightRecord weight = new WeightRecord();
        weight.setMember(member);
        weight.setRecordedDate(LocalDate.now().minusDays(1));
        weight.setWeightKg(72.0);
        weightRepository.saveAndFlush(weight);

        CalorieBackfillResponse result = backfillService.recomputeMember(auth(member), member.getId());

        assertThat(result.estimated()).isEqualTo(1);
        WorkoutLog saved = logRepository.findById(log.getId()).orElseThrow();
        assertThat(saved.getCalories()).isNotNull().isPositive();
        assertThat(saved.getEstimateStatus()).isEqualTo(EstimateStatus.OK);
        assertThat(saved.getWeightKgUsed()).isEqualTo(72.0);
    }

    @Test
    @DisplayName("Log tính theo công thức v1 (quá thấp) được tính lại theo v2, giữ cường độ, chạy lại không đổi")
    void outdatedFormulaLogsAreRecomputed() {
        Member member = createMember("backfill.v1");
        Exercise exercise = createExercise("Press V1");
        WorkoutSchedule schedule = createSchedule(member, exercise, 70.0, ScheduleStatus.COMPLETED);
        WorkoutLog log = createLegacyLog(member, schedule, 9);
        log.setEstimateStatus(EstimateStatus.OK);
        log.setEstimated(true);
        log.setIntensity(ExerciseIntensity.MODERATE);
        log.setFormulaVersion("MET-COMPENDIUM-2011-v1");
        logRepository.saveAndFlush(log);

        CalorieBackfillResponse result = backfillService.recomputeOutdated();

        assertThat(result.processed()).isEqualTo(1);
        WorkoutLog saved = logRepository.findById(log.getId()).orElseThrow();
        assertThat(saved.getCalories()).isEqualTo(263);
        assertThat(saved.getActiveMinutes()).isEqualTo(60.0);
        assertThat(saved.getIntensity()).isEqualTo(ExerciseIntensity.MODERATE);
        assertThat(saved.getEstimateQuality()).isEqualTo(EstimateQuality.DETAILED);
        assertThat(saved.getFormulaVersion()).isEqualTo(CalorieEstimationService.FORMULA_VERSION);
        List<WorkoutLogExercise> rows = logExerciseRepository.findByWorkoutLogIdOrderBySortOrderAsc(log.getId());
        assertThat(rows).hasSize(2);
        assertThat(rows.get(0).getActiveMinutes()).isEqualTo(3.5);
        assertThat(rows.get(1).getExerciseName()).isEqualTo(CalorieEstimationService.TRANSITION_NAME);
        assertThat(rows.get(1).getMetValue()).isEqualTo(3.5);

        assertThat(backfillService.recomputeOutdated().processed()).isZero();
        assertThat(logRepository.findById(log.getId()).orElseThrow().getCalories()).isEqualTo(263);
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

    private WorkoutSchedule createSchedule(Member member, Exercise exercise, Double weightKg, ScheduleStatus status) {
        LocalDateTime start = LocalDateTime.now().minusHours(2);
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
        schedule.setStatus(status);
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

    private WorkoutLog createLegacyLog(Member member, WorkoutSchedule schedule, int fakeCalories) {
        WorkoutLog log = new WorkoutLog();
        log.setSchedule(schedule);
        log.setMember(member);
        log.setCompletedAt(LocalDateTime.now().minusHours(1));
        log.setDurationMinutes(60);
        log.setCalories(fakeCalories);
        log.setRating(4);
        log.setEstimateStatus(EstimateStatus.LEGACY);
        log.setEstimated(false);
        return logRepository.saveAndFlush(log);
    }
}
