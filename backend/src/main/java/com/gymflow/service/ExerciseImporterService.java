package com.gymflow.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gymflow.common.ApiException;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.ExerciseImportReport;
import com.gymflow.repository.ContentSourceRepository;
import com.gymflow.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExerciseImporterService {

    private final ExerciseRepository exerciseRepository;
    private final ContentSourceRepository sourceRepository;
    private final ObjectMapper objectMapper;

    public record RawExerciseItem(
            String id,
            String name,
            String bodyPart,
            String equipment,
            String target,
            List<String> secondaryMuscles,
            List<String> steps
    ) {}

    @Transactional
    public ExerciseImportReport importDataset(boolean dryRun, int limit) {
        List<RawExerciseItem> rawList = loadRawDataset();
        int totalRead = rawList.size();
        if (limit > 0 && limit < totalRead) {
            rawList = rawList.subList(0, limit);
        }

        ContentSource source = sourceRepository.findByCode("EXERCISES_DATASET").orElse(null);

        int validCount = 0;
        int createdCount = 0;
        int updatedCount = 0;
        int skippedCount = 0;
        int errorCount = 0;

        List<String> sampleCreated = new ArrayList<>();
        List<String> messages = new ArrayList<>();

        for (RawExerciseItem item : rawList) {
            try {
                if (item.name() == null || item.name().isBlank()) {
                    errorCount++;
                    continue;
                }
                validCount++;

                String externalId = item.id();
                String nameEn = toTitleCase(item.name());

                // Kiểm tra xem đã có bài tập tương ứng chưa (theo externalId hoặc nameEn)
                Optional<Exercise> existingOpt = Optional.empty();
                if (externalId != null && !externalId.isBlank()) {
                    existingOpt = exerciseRepository.findByExternalId(externalId);
                }
                if (existingOpt.isEmpty()) {
                    existingOpt = exerciseRepository.findFirstByNameEnIgnoreCase(nameEn);
                }

                if (existingOpt.isPresent()) {
                    Exercise existing = existingOpt.get();
                    boolean modified = false;

                    // Cập nhật externalId nếu chưa có
                    if (existing.getExternalId() == null && externalId != null) {
                        existing.setExternalId(externalId);
                        modified = true;
                    }

                    // Gắn nguồn nếu chưa có
                    if (source != null && !existing.getSources().contains(source)) {
                        existing.getSources().add(source);
                        modified = true;
                    }

                    // Bổ sung các bước hướng dẫn nếu bài cũ chưa có steps
                    if ((existing.getSteps() == null || existing.getSteps().isBlank()) && item.steps() != null && !item.steps().isEmpty()) {
                        existing.setSteps(formatSteps(item.steps()));
                        modified = true;
                    }

                    if (modified) {
                        if (!dryRun) {
                            exerciseRepository.save(existing);
                        }
                        updatedCount++;
                    } else {
                        skippedCount++;
                    }
                    continue;
                }

                // Tạo bài tập mới
                Exercise exercise = new Exercise();
                exercise.setExternalId(externalId);
                exercise.setNameEn(nameEn);

                String nameVi = generateVietnameseName(item, nameEn);
                // Đảm bảo tính duy nhất của tên tiếng Việt (UNIQUE constraint trong DB)
                if (exerciseRepository.existsByNameIgnoreCase(nameVi)) {
                    nameVi = nameVi + " #" + externalId;
                }
                exercise.setName(nameVi);

                MuscleGroup group = mapMuscleGroup(item.bodyPart());
                exercise.setMuscleGroup(group);

                String targetKey = mapTargetMuscle(item.target());
                exercise.setTargetMuscles(targetKey);

                if (item.secondaryMuscles() != null && !item.secondaryMuscles().isEmpty()) {
                    List<String> secKeys = item.secondaryMuscles().stream()
                            .map(ExerciseImporterService::mapTargetMuscle)
                            .filter(Objects::nonNull)
                            .distinct()
                            .toList();
                    if (!secKeys.isEmpty()) {
                        exercise.setSecondaryMuscleKeys(String.join(",", secKeys));
                        exercise.setSecondaryMuscles(String.join(", ", item.secondaryMuscles()));
                    }
                }

                String eqKey = mapEquipmentKey(item.equipment());
                exercise.setEquipmentKeys(eqKey);
                exercise.setEquipment(mapEquipmentLabel(eqKey));

                exercise.setLevel(Level.BEGINNER); // Mặc định Beginner, chờ HLV/Admin duyệt
                exercise.setLocation(eqKey.equals("bodyweight") || eqKey.equals("band") ? ExerciseLocation.ANY : ExerciseLocation.GYM);
                exercise.setPrimaryGoal(group == MuscleGroup.FULL_BODY ? ExerciseGoal.ENDURANCE : ExerciseGoal.STRENGTH);
                exercise.setGoals(exercise.getPrimaryGoal().name());

                if (item.steps() != null && !item.steps().isEmpty()) {
                    exercise.setSteps(formatSteps(item.steps()));
                    exercise.setInstructions(String.join(" ", item.steps()));
                } else {
                    exercise.setInstructions("Thực hiện theo kỹ thuật tiêu chuẩn của " + nameEn + ".");
                }

                exercise.setDescription("Bài tập " + mapTargetLabel(item.target()) + " sử dụng " + mapEquipmentLabel(eqKey).toLowerCase() + ", hỗ trợ phát triển thể lực và cơ bắp.");
                exercise.setAliases(generateAliases(nameVi, nameEn, item.target(), item.equipment()));

                exercise.setContentOrigin(ContentOrigin.ADAPTED);
                exercise.setReviewStatus(ReviewStatus.PENDING); // Bắt buộc PENDING
                exercise.setHidden(false);

                if (source != null) {
                    exercise.getSources().add(source);
                }

                if (!dryRun) {
                    exerciseRepository.save(exercise);
                }
                createdCount++;

                if (sampleCreated.size() < 10) {
                    sampleCreated.add("[" + externalId + "] " + nameVi + " (" + group + " / " + eqKey + ")");
                }

            } catch (Exception e) {
                errorCount++;
                log.warn("Lỗi khi xử lý bài tập [{}]: {}", item.id(), e.getMessage());
            }
        }

        messages.add(String.format("Tổng số đọc: %d. Hợp lệ: %d. Tạo mới: %d. Cập nhật: %d. Bỏ qua (đã có): %d. Lỗi: %d. Chế độ: %s",
                totalRead, validCount, createdCount, updatedCount, skippedCount, errorCount, dryRun ? "DRY-RUN (Không ghi DB)" : "THỰC THI (Đã ghi DB)"));

        return new ExerciseImportReport(totalRead, validCount, createdCount, updatedCount, skippedCount, errorCount, dryRun, sampleCreated, messages);
    }

    private List<RawExerciseItem> loadRawDataset() {
        try (InputStream is = getClass().getResourceAsStream("/seed/exercises-dataset.json")) {
            if (is == null) {
                throw ApiException.badRequest("Không tìm thấy file seed/exercises-dataset.json trong classpath");
            }
            return objectMapper.readValue(is, new TypeReference<List<RawExerciseItem>>() {});
        } catch (Exception e) {
            log.error("Không thể đọc file dataset", e);
            throw new ApiException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi đọc file seed/exercises-dataset.json: " + e.getMessage());
        }
    }

    private static String formatSteps(List<String> steps) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < steps.size(); i++) {
            if (i > 0) sb.append("\n");
            sb.append(i + 1).append(". ").append(steps.get(i));
        }
        return sb.toString();
    }

    private static String toTitleCase(String input) {
        if (input == null || input.isBlank()) return "";
        String[] words = input.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (w.isEmpty()) continue;
            if (!sb.isEmpty()) sb.append(" ");
            if (w.length() == 1) {
                sb.append(w.toUpperCase());
            } else {
                sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1).toLowerCase());
            }
        }
        return sb.toString();
    }

    private static String generateVietnameseName(RawExerciseItem item, String nameEn) {
        String baseName = translateExerciseTitle(item.name());
        String finalName = baseName + " (" + nameEn + ")";
        if (finalName.length() > 120) {
            return finalName.substring(0, 119);
        }
        return finalName;
    }

    private static String translateExerciseTitle(String rawName) {
        String s = rawName.toLowerCase();
        if (s.contains("squat")) return "Ngồi xổm Squat";
        if (s.contains("deadlift")) return "Kéo tạ Deadlift";
        if (s.contains("bench press")) return "Nằm đẩy tạ Bench Press";
        if (s.contains("overhead press") || s.contains("shoulder press") || s.contains("military press")) return "Đẩy vai qua đầu";
        if (s.contains("push-up") || s.contains("pushup")) return "Chống đẩy";
        if (s.contains("pull-up") || s.contains("pullup")) return "Hít xà đơn";
        if (s.contains("chin-up") || s.contains("chinup")) return "Hít xà tay ngửa";
        if (s.contains("dip")) return "Chống xà kép Dips";
        if (s.contains("lunge")) return "Chùng chân Lunge";
        if (s.contains("curl")) return "Cuốn tạ tay trước";
        if (s.contains("triceps extension") || s.contains("pushdown")) return "Duỗi cơ tay sau";
        if (s.contains("crunch") || s.contains("sit-up")) return "Gập bụng";
        if (s.contains("plank")) return "Giữ người Plank";
        if (s.contains("row")) return "Kéo lưng xô Row";
        if (s.contains("fly")) return "Banh ngực Fly";
        if (s.contains("lateral raise")) return "Dang tạ sang bên";
        if (s.contains("calf raise")) return "Nhón bắp chân";
        if (s.contains("leg press")) return "Đạp đùi Leg Press";
        if (s.contains("leg extension")) return "Đá đùi trước";
        if (s.contains("leg curl")) return "Cuốn đùi sau";
        if (s.contains("hip thrust")) return "Đẩy hông Hip Thrust";
        if (s.contains("shrug")) return "Nhún cầu vai Shrug";
        return toTitleCase(rawName);
    }

    private static MuscleGroup mapMuscleGroup(String bodyPart) {
        if (bodyPart == null) return MuscleGroup.FULL_BODY;
        return switch (bodyPart.trim().toLowerCase()) {
            case "chest" -> MuscleGroup.CHEST;
            case "back" -> MuscleGroup.BACK;
            case "waist" -> MuscleGroup.CORE;
            case "upper arms", "lower arms" -> MuscleGroup.ARMS;
            case "upper legs", "lower legs" -> MuscleGroup.LEGS;
            case "shoulders", "neck" -> MuscleGroup.SHOULDERS;
            case "cardio" -> MuscleGroup.FULL_BODY;
            default -> MuscleGroup.FULL_BODY;
        };
    }

    public static String mapTargetMuscle(String target) {
        if (target == null) return "chest";
        return switch (target.trim().toLowerCase()) {
            case "abs" -> "abs";
            case "abductors" -> "abductors";
            case "adductors" -> "adductor";
            case "biceps" -> "biceps";
            case "calves" -> "calves";
            case "cardiovascular system" -> "quadriceps,calves";
            case "delts" -> "front-deltoids,back-deltoids";
            case "forearms" -> "forearm";
            case "glutes" -> "gluteal";
            case "hamstrings" -> "hamstring";
            case "lats" -> "upper-back";
            case "levator scapulae" -> "trapezius";
            case "pectorals" -> "chest";
            case "quads" -> "quadriceps";
            case "serratus anterior" -> "obliques";
            case "spine" -> "lower-back";
            case "traps" -> "trapezius";
            case "triceps" -> "triceps";
            case "upper back" -> "upper-back";
            default -> "chest";
        };
    }

    private static String mapTargetLabel(String target) {
        if (target == null) return "cơ bắp";
        return switch (target.trim().toLowerCase()) {
            case "abs" -> "cơ bụng";
            case "abductors" -> "cơ hông ngoài";
            case "adductors" -> "cơ đùi trong";
            case "biceps" -> "cơ tay trước";
            case "calves" -> "cơ bắp chân";
            case "cardiovascular system" -> "tim mạch và sức bền";
            case "delts" -> "cơ vai";
            case "forearms" -> "cơ cẳng tay";
            case "glutes" -> "cơ mông";
            case "hamstrings" -> "cơ đùi sau";
            case "lats" -> "cơ xô";
            case "pectorals" -> "cơ ngực";
            case "quads" -> "cơ đùi trước";
            case "traps" -> "cơ cầu vai";
            case "triceps" -> "cơ tay sau";
            default -> "cơ " + target;
        };
    }

    public static String mapEquipmentKey(String equipment) {
        if (equipment == null) return "bodyweight";
        String s = equipment.trim().toLowerCase();
        if (s.contains("body weight") || s.contains("assisted")) return "bodyweight";
        if (s.contains("dumbbell")) return "dumbbell";
        if (s.contains("ez barbell") || s.contains("ez bar")) return "ez-bar";
        if (s.contains("barbell") || s.contains("trap bar")) return "barbell";
        if (s.contains("cable")) return "cable";
        if (s.contains("kettlebell")) return "kettlebell";
        if (s.contains("smith")) return "smith-machine";
        if (s.contains("machine") || s.contains("leverage")) return "machine";
        if (s.contains("plate") || s.contains("weighted")) return "plate";
        if (s.contains("band")) return "band";
        if (s.contains("ball") || s.contains("bosu")) return "ball";
        if (s.contains("roller")) return "foam-roller";
        if (s.contains("pull-up") || s.contains("pullup")) return "pullup-bar";
        if (s.contains("dip")) return "dip-bars";
        if (s.contains("bike") || s.contains("treadmill") || s.contains("rower") || s.contains("elliptical")) return "cardio-machine";
        if (s.contains("bench")) return "bench";
        return "other";
    }

    public static String mapEquipmentLabel(String key) {
        return switch (key) {
            case "bodyweight" -> "Trọng lượng cơ thể (Không dụng cụ)";
            case "dumbbell" -> "Tạ đơn (Dumbbell)";
            case "barbell" -> "Thanh đòn (Barbell)";
            case "cable" -> "Máy kéo cáp (Cable)";
            case "kettlebell" -> "Tạ ấm (Kettlebell)";
            case "machine" -> "Máy tập khối tạ";
            case "smith-machine" -> "Máy Smith";
            case "ez-bar" -> "Thanh đòn ziczac EZ";
            case "plate" -> "Bánh tạ (Weight Plate)";
            case "band" -> "Dây kháng lực (Bands)";
            case "ball" -> "Bóng tập (Exercise Ball)";
            case "foam-roller" -> "Con lăn bọt (Foam Roller)";
            case "pullup-bar" -> "Xà đơn (Pull-up Bar)";
            case "dip-bars" -> "Xà kép (Dip Station)";
            case "cardio-machine" -> "Máy tập Cardio";
            case "bench" -> "Ghế tập thể hình (Bench)";
            default -> "Dụng cụ khác";
        };
    }

    private static String generateAliases(String nameVi, String nameEn, String target, String equipment) {
        Set<String> set = new LinkedHashSet<>();
        if (nameEn != null) set.add(nameEn.toLowerCase());
        if (target != null) set.add(target.toLowerCase());
        if (equipment != null) set.add(equipment.toLowerCase());
        return String.join(", ", set);
    }
}
