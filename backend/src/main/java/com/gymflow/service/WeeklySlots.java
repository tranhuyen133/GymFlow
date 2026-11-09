package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.common.GymHours;
import com.gymflow.dto.Dtos.ShiftRequest;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/** Kiểm tra khung giờ theo tuần (ca làm HLV, giờ tập mong muốn của hội viên). */
final class WeeklySlots {
    static final int MIN_MINUTES = 30;
    static final int MAX_PER_DAY = 3;

    private WeeklySlots() {
    }

    /**
     * Trả về danh sách đã sắp theo ngày, giờ. Báo lỗi nếu khung giờ ngược, ngắn hơn 30 phút,
     * nằm ngoài giờ mở cửa, chồng nhau trong cùng ngày hoặc quá 3 khung một ngày.
     * label: "Ca" hoặc "Giờ tập" để thông báo lỗi nói đúng đối tượng.
     */
    static List<ShiftRequest> validate(List<ShiftRequest> slots, String label) {
        List<ShiftRequest> sorted = new ArrayList<>(slots);
        sorted.sort(Comparator.comparing(ShiftRequest::dayOfWeek).thenComparing(ShiftRequest::startTime));
        int sameDay = 0;
        for (int i = 0; i < sorted.size(); i++) {
            ShiftRequest s = sorted.get(i);
            String day = TrainerService.dayName(s.dayOfWeek());
            if (!s.endTime().isAfter(s.startTime())) {
                throw ApiException.badRequest(label + " " + day + ": giờ kết thúc phải sau giờ bắt đầu");
            }
            if (!GymHours.contains(s.startTime(), s.endTime())) {
                throw ApiException.badRequest(label + " " + day + " phải nằm trong giờ mở cửa " + GymHours.LABEL);
            }
            if (Duration.between(s.startTime(), s.endTime()).toMinutes() < MIN_MINUTES) {
                throw ApiException.badRequest(label + " " + day + " dài tối thiểu " + MIN_MINUTES + " phút");
            }
            ShiftRequest prev = i > 0 ? sorted.get(i - 1) : null;
            sameDay = prev != null && prev.dayOfWeek().equals(s.dayOfWeek()) ? sameDay + 1 : 1;
            if (sameDay > MAX_PER_DAY) {
                throw ApiException.badRequest(day + " tối đa " + MAX_PER_DAY + " khung giờ");
            }
            if (prev != null && prev.dayOfWeek().equals(s.dayOfWeek()) && s.startTime().isBefore(prev.endTime())) {
                throw ApiException.badRequest("Các khung giờ " + day + " bị chồng nhau");
            }
        }
        return sorted;
    }
}
