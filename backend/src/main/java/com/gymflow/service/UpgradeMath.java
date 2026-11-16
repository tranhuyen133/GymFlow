package com.gymflow.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * V49 · Tính tiền khi nâng gói tự tập lên gói có PT.
 * Giá trị còn lại của gói cũ = số tiền đã trả × số ngày chưa dùng / tổng số ngày (tính từ ngày gói PT bắt đầu),
 * làm tròn XUỐNG tới 1.000đ và không vượt giá gói PT. Hội viên trả phần chênh lệch.
 */
public final class UpgradeMath {

    /** Làm tròn tiền bù trừ xuống bội số 1.000đ cho dễ thu tại quầy. */
    public static final long ROUND_TO = 1_000L;

    private UpgradeMath() {
    }

    /** Tổng số ngày của gói (tính cả ngày đầu và ngày cuối). */
    public static long totalDays(LocalDate start, LocalDate end) {
        return Math.max(1, ChronoUnit.DAYS.between(start, end) + 1);
    }

    /** Số ngày gói cũ chưa dùng nếu gói mới bắt đầu ngày upgradeStart (gói cũ dùng tới hôm trước). */
    public static long remainingDays(LocalDate start, LocalDate end, LocalDate upgradeStart) {
        LocalDate from = upgradeStart.isBefore(start) ? start : upgradeStart;
        if (from.isAfter(end)) return 0;
        return Math.min(totalDays(start, end), ChronoUnit.DAYS.between(from, end) + 1);
    }

    /** Giá trị còn lại của gói cũ, làm tròn xuống 1.000đ, không âm và không vượt cap (giá gói mới). */
    public static long credit(long pricePaid, LocalDate start, LocalDate end, LocalDate upgradeStart, long cap) {
        if (pricePaid <= 0 || cap <= 0) return 0;
        long total = totalDays(start, end);
        long remaining = remainingDays(start, end, upgradeStart);
        // pricePaid tối đa vài trăm triệu × ≤ 1095 ngày: không tràn long
        long raw = pricePaid * remaining / total;
        long rounded = raw / ROUND_TO * ROUND_TO;
        return Math.max(0, Math.min(rounded, cap));
    }
}
