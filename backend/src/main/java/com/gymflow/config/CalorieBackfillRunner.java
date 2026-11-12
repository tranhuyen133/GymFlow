package com.gymflow.config;

import com.gymflow.dto.Dtos.CalorieBackfillResponse;
import com.gymflow.service.CalorieBackfillService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Chạy sau {@link DataSeeder}: điền calo MET cho các buổi tập lịch sử chưa được ước tính.
 * Idempotent và chỉ xử lý log LEGACY chưa từng tính; có thể tắt bằng app.calorie-backfill.enabled=false.
 */
@Slf4j
@Component
@Order(3)
@RequiredArgsConstructor
public class CalorieBackfillRunner implements ApplicationRunner {

    private final CalorieBackfillService backfillService;

    @Value("${app.calorie-backfill.enabled:true}")
    private boolean enabled;

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) return;
        try {
            CalorieBackfillResponse result = backfillService.backfillLegacy();
            if (result.processed() > 0 || result.failed() > 0) {
                log.info("Đã backfill calo lịch sử: {} buổi (OK {}, thiếu cân nặng {}, lỗi {})",
                        result.processed(), result.estimated(), result.missingWeight(), result.failed());
            }
        } catch (RuntimeException e) {
            log.warn("Bỏ qua bước backfill calo lịch sử: {}", e.getMessage());
        }
    }
}
