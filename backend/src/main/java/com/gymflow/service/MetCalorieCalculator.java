package com.gymflow.service;

/**
 * Công thức MET thuần, không phụ thuộc Spring/DB để dễ kiểm thử.
 *
 * <p>Calories = MET × 3.5 × Weight(kg) / 200 × Duration(minutes)</p>
 *
 * <p>Với bài kháng lực, thời lượng của cả cụm bài = số hiệp × thời gian mỗi hiệp
 * + nghỉ giữa các hiệp (vì MET tập tạ của Compendium đo trên cả buổi, gồm nghỉ).
 * Mỗi lần lặp ước tính 3 giây (tempo tập luyện thông thường).</p>
 */
public final class MetCalorieCalculator {

    /** Giây ước tính cho một lần lặp (tempo vừa phải). */
    public static final int SECONDS_PER_REP = 3;

    private MetCalorieCalculator() {
    }

    /** Công thức gốc; trả null nếu thiếu dữ liệu không hợp lệ. */
    public static Double calories(Double met, Double weightKg, Double minutes) {
        if (met == null || weightKg == null || minutes == null) return null;
        if (met <= 0 || weightKg <= 0 || minutes <= 0) return null;
        return met * 3.5 * weightKg / 200.0 * minutes;
    }

    /** Làm tròn kcal về số nguyên gần nhất, không âm. */
    public static int roundKcal(double value) {
        if (value <= 0) return 0;
        return (int) Math.round(value);
    }

    /**
     * Đổi chuỗi reps của giáo án thành số giây vận động cho một hiệp.
     * Hỗ trợ "10", "8-12", "45s", "45 giây", "1 phút".
     * Với khoảng reps, lấy trung bình cộng hai đầu mút.
     */
    public static Integer workSecondsPerSet(String reps) {
        if (reps == null || reps.isBlank()) return null;
        String s = reps.trim().toLowerCase().replace(',', '.');

        if (s.endsWith("phút") || s.endsWith("phut") || s.endsWith("min")) {
            Double minutes = parseNumber(s.replaceAll("[^0-9.]", ""));
            return minutes == null ? null : (int) Math.round(minutes * 60);
        }
        if (s.endsWith("giây") || s.endsWith("giay")) {
            Double seconds = parseNumber(s.replaceAll("[^0-9.]", ""));
            return seconds == null ? null : (int) Math.round(seconds);
        }
        if (s.endsWith("s")) {
            Double seconds = parseNumber(s.substring(0, s.length() - 1).trim());
            return seconds == null ? null : (int) Math.round(seconds);
        }
        if (s.contains("-")) {
            String[] parts = s.split("-", 2);
            Double low = parseNumber(parts[0].trim());
            Double high = parseNumber(parts[1].trim());
            if (low == null || high == null) return null;
            double avgReps = (low + high) / 2.0;
            return (int) Math.round(avgReps * SECONDS_PER_REP);
        }
        Double repsCount = parseNumber(s);
        return repsCount == null ? null : (int) Math.round(repsCount * SECONDS_PER_REP);
    }

    /** Thời gian vận động (phút) của một bài kháng lực: sets × giây/hiệp / 60. */
    public static Double strengthActiveMinutes(Integer sets, String reps) {
        if (sets == null || sets <= 0) return null;
        Integer seconds = workSecondsPerSet(reps);
        if (seconds == null || seconds <= 0) return null;
        return sets * seconds / 60.0;
    }

    /** Nghỉ giữa hiệp khi giáo án chưa ghi (khuyến nghị phổ biến 60–120 giây cho tập tăng cơ). */
    public static final int DEFAULT_REST_SECONDS = 90;

    /**
     * Thời lượng cả cụm bài kháng lực (phút) = thời gian các hiệp + thời gian nghỉ giữa các hiệp.
     * MET tập tạ trong Compendium đo trên cả buổi tập (gồm nghỉ giữa hiệp), nên phải nhân với
     * thời lượng này chứ không chỉ vài phút thật sự nâng tạ (bản v1 chỉ tính 3 giây/lần → ra quá thấp).
     * restSeconds null → {@link #DEFAULT_REST_SECONDS}; âm hoặc quá 10 phút được chặn về 0..600.
     */
    public static Double strengthBlockMinutes(Integer sets, String reps, Integer restSeconds) {
        Double work = strengthActiveMinutes(sets, reps);
        if (work == null) return null;
        int rest = restSeconds == null ? DEFAULT_REST_SECONDS : Math.max(0, Math.min(restSeconds, 600));
        return work + (sets - 1) * rest / 60.0;
    }

    private static Double parseNumber(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Double.parseDouble(raw.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
