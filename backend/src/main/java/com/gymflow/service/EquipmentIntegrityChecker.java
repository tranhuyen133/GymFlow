package com.gymflow.service;

import com.gymflow.domain.Equipment;
import com.gymflow.domain.Exercise;
import com.gymflow.repository.EquipmentRepository;
import com.gymflow.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

/**
 * Kiểm tra (không sửa dữ liệu) liên kết giữa bài tập và kho dụng cụ khi khởi động.
 * Mã dụng cụ nằm trong exercises.equipment_keys phải tồn tại ở bảng equipment; nếu thiếu,
 * log cảnh báo để bổ sung thay vì để link bài tập bị 404 khi thêm chức năng mới.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EquipmentIntegrityChecker {

    private final EquipmentRepository equipmentRepository;
    private final ExerciseRepository exerciseRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional(readOnly = true)
    public void check() {
        try {
            Set<String> known = equipmentRepository.findAll().stream()
                    .map(Equipment::getKey)
                    .collect(Collectors.toSet());
            Set<String> missing = new TreeSet<>();
            for (Exercise e : exerciseRepository.findAll()) {
                if (e.getEquipmentKeys() == null) continue;
                for (String raw : e.getEquipmentKeys().split(",")) {
                    String key = raw.trim().toLowerCase(Locale.ROOT);
                    if (!key.isEmpty() && !known.contains(key)) missing.add(key);
                }
            }
            if (missing.isEmpty()) {
                log.info("Kiểm tra toàn vẹn kho dụng cụ ↔ bài tập: OK");
            } else {
                log.warn("Có {} mã dụng cụ trong bài tập chưa tồn tại ở kho dụng cụ: {}",
                        missing.size(), String.join(", ", missing));
            }
        } catch (RuntimeException ex) {
            // Không để dữ liệu cũ/không hợp lệ làm ứng dụng không khởi động được.
            log.warn("Không kiểm tra được toàn vẹn kho dụng cụ ↔ bài tập: {}", ex.getMessage());
        }
    }
}
