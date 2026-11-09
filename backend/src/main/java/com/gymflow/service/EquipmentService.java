package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.repository.EquipmentRepository;
import com.gymflow.repository.ExerciseRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final ExerciseRepository exerciseRepository;
    private final AuditService auditService;
    private final Mappers mappers;

    @Transactional(readOnly = true)
    public List<EquipmentResponse> list(AuthUser user, boolean includeHidden) {
        boolean showAll = includeHidden && user != null && !user.isMember();
        List<Equipment> items = showAll
                ? equipmentRepository.findAllByOrderBySortOrderAscNameAsc()
                : equipmentRepository.findByHiddenFalseAndReviewStatusOrderBySortOrderAscNameAsc(ReviewStatus.APPROVED);

        Map<String, Long> countMap = computeExerciseCounts();

        return items.stream()
                .map(eq -> mappers.equipmentResponse(eq, countMap.getOrDefault(eq.getKey(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public EquipmentDetailResponse get(AuthUser user, String key) {
        Equipment eq = equipmentRepository.findById(key)
                .orElseThrow(() -> ApiException.notFound("dụng cụ"));

        boolean isStaff = user != null && !user.isMember();
        if (!isStaff && (eq.isHidden() || eq.getReviewStatus() != ReviewStatus.APPROVED)) {
            throw ApiException.notFound("dụng cụ");
        }

        List<Exercise> relatedExercises = exerciseRepository.findAllByOrderByNameAsc().stream()
                .filter(e -> !e.isHidden() && e.getReviewStatus() == ReviewStatus.APPROVED)
                .filter(e -> hasEquipmentKey(e, eq.getKey()))
                .toList();

        List<ExerciseResponse> exerciseResponses = relatedExercises.stream()
                .map(mappers::exercise)
                .toList();

        long count = exerciseResponses.size();
        return mappers.equipmentDetail(eq, count, exerciseResponses);
    }

    @Transactional
    public EquipmentResponse create(AuthUser user, EquipmentRequest req) {
        if (user == null || user.isMember()) {
            throw ApiException.forbidden("Chỉ quản lý hoặc huấn luyện viên mới có quyền thêm dụng cụ");
        }
        String key = req.key().trim().toLowerCase(Locale.ROOT);
        if (equipmentRepository.existsById(key)) {
            throw ApiException.conflict("Mã dụng cụ đã tồn tại: " + key);
        }

        Equipment eq = new Equipment();
        eq.setKey(key);
        apply(eq, req);
        eq.setReviewStatus(ReviewStatus.PENDING);
        eq.setOrigin(ContentOrigin.SELF_AUTHORED);
        equipmentRepository.save(eq);

        auditService.log("EQUIPMENT_CREATE", "EQUIPMENT", null, eq.getKey() + ": " + eq.getName());
        return mappers.equipmentResponse(eq, 0L);
    }

    @Transactional
    public EquipmentResponse update(AuthUser user, String key, EquipmentRequest req) {
        if (user == null || user.isMember()) {
            throw ApiException.forbidden("Chỉ quản lý hoặc huấn luyện viên mới có quyền cập nhật dụng cụ");
        }
        Equipment eq = equipmentRepository.findById(key)
                .orElseThrow(() -> ApiException.notFound("dụng cụ"));

        apply(eq, req);
        if (!user.isAdmin() && eq.getReviewStatus() == ReviewStatus.APPROVED) {
            eq.setReviewStatus(ReviewStatus.PENDING);
        }

        auditService.log("EQUIPMENT_UPDATE", "EQUIPMENT", null, eq.getKey() + ": " + eq.getName());
        long count = countApprovedExercises(eq.getKey());
        return mappers.equipmentResponse(eq, count);
    }

    @Transactional
    public EquipmentResponse setHidden(AuthUser user, String key, boolean hidden) {
        if (user == null || user.isMember()) {
            throw ApiException.forbidden("Chỉ quản lý hoặc huấn luyện viên mới có quyền ẩn/hiện dụng cụ");
        }
        Equipment eq = equipmentRepository.findById(key)
                .orElseThrow(() -> ApiException.notFound("dụng cụ"));

        eq.setHidden(hidden);
        auditService.log(hidden ? "EQUIPMENT_HIDE" : "EQUIPMENT_SHOW", "EQUIPMENT", null, eq.getKey() + ": " + eq.getName());
        long count = countApprovedExercises(eq.getKey());
        return mappers.equipmentResponse(eq, count);
    }

    @Transactional
    public EquipmentResponse review(AuthUser user, String key, ReviewRequest req) {
        if (user == null || !user.isAdmin()) {
            throw ApiException.forbidden("Chỉ quản lý mới có quyền duyệt dụng cụ");
        }
        Equipment eq = equipmentRepository.findById(key)
                .orElseThrow(() -> ApiException.notFound("dụng cụ"));

        eq.setReviewStatus(req.status());
        auditService.log("EQUIPMENT_REVIEW", "EQUIPMENT", null, eq.getKey() + " → " + req.status());
        long count = countApprovedExercises(eq.getKey());
        return mappers.equipmentResponse(eq, count);
    }

    private void apply(Equipment eq, EquipmentRequest req) {
        eq.setName(req.name().trim());
        eq.setCategory(req.category());
        eq.setShortDesc(Mappers.blankToNull(req.shortDesc()));
        eq.setUsageGuide(Mappers.blankToNull(req.usageGuide()));
        eq.setSafetyNotes(Mappers.blankToNull(req.safetyNotes()));
        if (req.targetMuscleKeys() != null) {
            eq.setTargetMuscleKeys(ExerciseService.joinKeys(req.targetMuscleKeys(), ExerciseService.MUSCLE_KEYS, "vùng cơ"));
        }
        if (req.imageKey() != null) {
            eq.setImageKey(Mappers.blankToNull(req.imageKey()));
        }
        if (req.sortOrder() != null) {
            eq.setSortOrder(req.sortOrder());
        }
        if (req.hidden() != null) {
            eq.setHidden(req.hidden());
        }
    }

    private Map<String, Long> computeExerciseCounts() {
        Map<String, Long> map = new HashMap<>();
        List<Exercise> approved = exerciseRepository.findAllByOrderByNameAsc().stream()
                .filter(e -> !e.isHidden() && e.getReviewStatus() == ReviewStatus.APPROVED)
                .toList();

        for (Exercise e : approved) {
            if (e.getEquipmentKeys() != null) {
                for (String k : e.getEquipmentKeys().split(",")) {
                    String cleanKey = k.trim().toLowerCase(Locale.ROOT);
                    if (!cleanKey.isEmpty()) {
                        map.put(cleanKey, map.getOrDefault(cleanKey, 0L) + 1L);
                    }
                }
            }
        }
        return map;
    }

    private long countApprovedExercises(String key) {
        return exerciseRepository.findAllByOrderByNameAsc().stream()
                .filter(e -> !e.isHidden() && e.getReviewStatus() == ReviewStatus.APPROVED)
                .filter(e -> hasEquipmentKey(e, key))
                .count();
    }

    private static boolean hasEquipmentKey(Exercise e, String key) {
        if (e.getEquipmentKeys() == null || key == null) return false;
        for (String k : e.getEquipmentKeys().split(",")) {
            if (k.trim().equalsIgnoreCase(key)) return true;
        }
        return false;
    }
}
