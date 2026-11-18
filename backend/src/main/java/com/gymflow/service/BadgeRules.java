package com.gymflow.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

/**
 * V55 · Luật huy hiệu và kỷ lục cá nhân – hàm thuần, không chạm CSDL để test được.
 * Dữ liệu vào: các buổi tập đã hoàn thành (workout_logs) và các lượt check-in tại quầy.
 * "Ngày có tập" = ngày có buổi hoàn thành hoặc có check-in. Tuần tính từ thứ Hai.
 * Mỗi huy hiệu có ngày đạt thật (ví dụ ngày của buổi thứ 10), nên khi mới triển khai, hội viên cũ
 * nhận huy hiệu với ngày trong quá khứ và không bị gửi email hàng loạt.
 */
public final class BadgeRules {

    private BadgeRules() {}

    public record Workout(LocalDateTime at, Integer minutes, Integer calories) {}

    public record Def(String code, String icon, String titleVi, String titleEn, String descVi, String descEn, int goal) {}

    public record Records(int totalWorkouts, int totalCheckins, long totalCalories, long totalMinutes,
                          int currentStreakWeeks, int longestStreakWeeks, int bestWeekWorkouts,
                          int maxSessionCalories, int longestSessionMinutes, int activeDays) {}

    /** earned: mã → thời điểm đạt; progress: mã → giá trị hiện tại (để hiện thanh tiến độ huy hiệu chưa đạt). */
    public record Result(Map<String, LocalDateTime> earned, Map<String, Integer> progress, Records records) {}

    public static final List<Def> CATALOG = List.of(
            new Def("FIRST_WORKOUT", "play", "Buổi tập đầu tiên", "First workout",
                    "Hoàn thành buổi tập đầu tiên trên GymFlow", "Complete your first workout on GymFlow", 1),
            new Def("WORKOUTS_10", "flame", "10 buổi tập", "10 workouts",
                    "Hoàn thành 10 buổi tập", "Complete 10 workouts", 10),
            new Def("WORKOUTS_25", "flame", "25 buổi tập", "25 workouts",
                    "Hoàn thành 25 buổi tập", "Complete 25 workouts", 25),
            new Def("WORKOUTS_50", "trophy", "50 buổi tập", "50 workouts",
                    "Hoàn thành 50 buổi tập", "Complete 50 workouts", 50),
            new Def("WORKOUTS_100", "trophy", "100 buổi tập", "100 workouts",
                    "Hoàn thành 100 buổi tập – bền bỉ thật sự", "Complete 100 workouts – true consistency", 100),
            new Def("CHECKINS_10", "checkCircle", "10 lần tới phòng", "10 gym visits",
                    "Check-in tại quầy 10 lần", "Check in at the front desk 10 times", 10),
            new Def("CHECKINS_50", "checkCircle", "50 lần tới phòng", "50 gym visits",
                    "Check-in tại quầy 50 lần", "Check in at the front desk 50 times", 50),
            new Def("STREAK_4", "zap", "Chuỗi 4 tuần", "4-week streak",
                    "Tập ít nhất 1 ngày mỗi tuần, 4 tuần liền", "Train at least once a week for 4 weeks in a row", 4),
            new Def("STREAK_8", "zap", "Chuỗi 8 tuần", "8-week streak",
                    "Tập ít nhất 1 ngày mỗi tuần, 8 tuần liền", "Train at least once a week for 8 weeks in a row", 8),
            new Def("STREAK_12", "star", "Chuỗi 12 tuần", "12-week streak",
                    "Tập ít nhất 1 ngày mỗi tuần, 12 tuần liền", "Train at least once a week for 12 weeks in a row", 12),
            new Def("EARLY_BIRD", "sun", "Chim sớm", "Early bird",
                    "Tập trước 7 giờ sáng 5 ngày", "Train before 7 am on 5 days", 5),
            new Def("NIGHT_OWL", "moon", "Cú đêm", "Night owl",
                    "Tập sau 8 giờ tối 5 ngày", "Train after 8 pm on 5 days", 5),
            new Def("CALORIES_5K", "flame", "5.000 kcal", "5,000 kcal",
                    "Đốt tổng cộng 5.000 kcal qua các buổi tập", "Burn 5,000 kcal in total across workouts", 5000),
            new Def("CALORIES_20K", "flame", "20.000 kcal", "20,000 kcal",
                    "Đốt tổng cộng 20.000 kcal qua các buổi tập", "Burn 20,000 kcal in total across workouts", 20000),
            new Def("MARATHON", "clock", "Buổi tập 90 phút", "90-minute session",
                    "Một buổi tập kéo dài từ 90 phút", "One workout lasting 90 minutes or more", 90)
    );

    private static final Map<String, Def> BY_CODE = new LinkedHashMap<>();
    static {
        for (Def d : CATALOG) BY_CODE.put(d.code(), d);
    }

    public static Def def(String code) {
        return BY_CODE.get(code);
    }

    public static Result compute(List<Workout> workouts, List<LocalDateTime> checkins, LocalDate today) {
        List<Workout> ws = workouts.stream().filter(w -> w.at() != null).sorted(Comparator.comparing(Workout::at)).toList();
        List<LocalDateTime> cs = checkins.stream().filter(Objects::nonNull).sorted().toList();
        Map<String, LocalDateTime> earned = new LinkedHashMap<>();
        Map<String, Integer> progress = new LinkedHashMap<>();

        // Số buổi tập
        int[] workoutGoals = {1, 10, 25, 50, 100};
        String[] workoutCodes = {"FIRST_WORKOUT", "WORKOUTS_10", "WORKOUTS_25", "WORKOUTS_50", "WORKOUTS_100"};
        for (int i = 0; i < workoutGoals.length; i++) {
            progress.put(workoutCodes[i], Math.min(ws.size(), workoutGoals[i]));
            if (ws.size() >= workoutGoals[i]) earned.put(workoutCodes[i], ws.get(workoutGoals[i] - 1).at());
        }
        // Số lần check-in
        int[] checkinGoals = {10, 50};
        String[] checkinCodes = {"CHECKINS_10", "CHECKINS_50"};
        for (int i = 0; i < checkinGoals.length; i++) {
            progress.put(checkinCodes[i], Math.min(cs.size(), checkinGoals[i]));
            if (cs.size() >= checkinGoals[i]) earned.put(checkinCodes[i], cs.get(checkinGoals[i] - 1));
        }

        // Ngày có tập (buổi hoàn thành hoặc check-in), giữ thời điểm sớm nhất và muộn nhất trong ngày
        TreeMap<LocalDate, LocalDateTime> firstOfDay = new TreeMap<>();
        TreeMap<LocalDate, LocalDateTime> lastOfDay = new TreeMap<>();
        List<LocalDateTime> all = new ArrayList<>(cs);
        ws.forEach(w -> all.add(w.at()));
        for (LocalDateTime t : all) {
            firstOfDay.merge(t.toLocalDate(), t, (a, b) -> a.isBefore(b) ? a : b);
            lastOfDay.merge(t.toLocalDate(), t, (a, b) -> a.isAfter(b) ? a : b);
        }

        // Chim sớm / Cú đêm: 5 ngày khác nhau
        LocalTime early = LocalTime.of(7, 0);
        LocalTime late = LocalTime.of(20, 0);
        List<LocalDateTime> earlyDays = firstOfDay.values().stream().filter(t -> t.toLocalTime().isBefore(early)).toList();
        List<LocalDateTime> lateDays = lastOfDay.values().stream().filter(t -> !t.toLocalTime().isBefore(late)).toList();
        progress.put("EARLY_BIRD", Math.min(earlyDays.size(), 5));
        progress.put("NIGHT_OWL", Math.min(lateDays.size(), 5));
        if (earlyDays.size() >= 5) earned.put("EARLY_BIRD", earlyDays.get(4));
        if (lateDays.size() >= 5) earned.put("NIGHT_OWL", lateDays.get(4));

        // Chuỗi tuần: các tuần liên tiếp đều có ít nhất 1 ngày tập
        TreeMap<LocalDate, LocalDateTime> weekLast = new TreeMap<>();
        for (Map.Entry<LocalDate, LocalDateTime> e : lastOfDay.entrySet()) {
            weekLast.merge(monday(e.getKey()), e.getValue(), (a, b) -> a.isAfter(b) ? a : b);
        }
        int run = 0;
        int longest = 0;
        LocalDate prev = null;
        int[] streakGoals = {4, 8, 12};
        String[] streakCodes = {"STREAK_4", "STREAK_8", "STREAK_12"};
        for (Map.Entry<LocalDate, LocalDateTime> e : weekLast.entrySet()) {
            run = prev != null && ChronoUnit.WEEKS.between(prev, e.getKey()) == 1 ? run + 1 : 1;
            prev = e.getKey();
            longest = Math.max(longest, run);
            for (int i = 0; i < streakGoals.length; i++) {
                if (run == streakGoals[i] && !earned.containsKey(streakCodes[i])) earned.put(streakCodes[i], e.getValue());
            }
        }
        // Chuỗi hiện tại: tính tới tuần này; tuần này chưa tập thì vẫn giữ chuỗi nếu tuần trước có tập
        int current = 0;
        LocalDate thisWeek = monday(today);
        LocalDate cursor = weekLast.containsKey(thisWeek) ? thisWeek : thisWeek.minusWeeks(1);
        while (weekLast.containsKey(cursor)) {
            current++;
            cursor = cursor.minusWeeks(1);
        }
        for (int i = 0; i < streakGoals.length; i++) progress.put(streakCodes[i], Math.min(Math.max(current, 0), streakGoals[i]));
        for (int i = 0; i < streakGoals.length; i++) if (earned.containsKey(streakCodes[i])) progress.put(streakCodes[i], streakGoals[i]);

        // Calo và thời lượng
        long totalCalories = 0;
        long totalMinutes = 0;
        int maxCalories = 0;
        int longestMinutes = 0;
        LocalDateTime marathonAt = null;
        int[] calorieGoals = {5000, 20000};
        String[] calorieCodes = {"CALORIES_5K", "CALORIES_20K"};
        for (Workout w : ws) {
            int cal = w.calories() == null ? 0 : Math.max(0, w.calories());
            int min = w.minutes() == null ? 0 : Math.max(0, w.minutes());
            totalCalories += cal;
            totalMinutes += min;
            maxCalories = Math.max(maxCalories, cal);
            longestMinutes = Math.max(longestMinutes, min);
            if (marathonAt == null && min >= 90) marathonAt = w.at();
            for (int i = 0; i < calorieGoals.length; i++) {
                if (totalCalories >= calorieGoals[i] && !earned.containsKey(calorieCodes[i])) earned.put(calorieCodes[i], w.at());
            }
        }
        for (int i = 0; i < calorieGoals.length; i++) progress.put(calorieCodes[i], (int) Math.min(totalCalories, calorieGoals[i]));
        progress.put("MARATHON", Math.min(longestMinutes, 90));
        if (marathonAt != null) earned.put("MARATHON", marathonAt);

        // Tuần nhiều buổi nhất
        Map<LocalDate, Integer> perWeek = new HashMap<>();
        for (Workout w : ws) perWeek.merge(monday(w.at().toLocalDate()), 1, Integer::sum);
        int bestWeek = perWeek.values().stream().mapToInt(Integer::intValue).max().orElse(0);

        // Giữ thứ tự theo CATALOG
        Map<String, LocalDateTime> ordered = new LinkedHashMap<>();
        for (Def d : CATALOG) if (earned.containsKey(d.code())) ordered.put(d.code(), earned.get(d.code()));

        Records records = new Records(ws.size(), cs.size(), totalCalories, totalMinutes, current, longest, bestWeek,
                maxCalories, longestMinutes, firstOfDay.size());
        return new Result(ordered, progress, records);
    }

    public static LocalDate monday(LocalDate d) {
        return d.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }
}
