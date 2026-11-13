package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.domain.Exercise;
import com.gymflow.domain.MuscleGroup;
import com.gymflow.dto.Dtos.EquipmentResponse;
import com.gymflow.dto.Dtos.ExerciseResponse;
import com.gymflow.dto.KnowledgeDtos.MuscleDetailResponse;
import com.gymflow.dto.KnowledgeDtos.MuscleSummaryResponse;
import com.gymflow.repository.EquipmentRepository;
import com.gymflow.repository.ExerciseRepository;
import com.gymflow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class MuscleService {

    private final ExerciseRepository exerciseRepository;
    private final EquipmentRepository equipmentRepository;
    private final Mappers mappers;

    public record MuscleMeta(
            String key,
            String name,
            String nameEn,
            MuscleGroup group,
            String view,
            String hint,
            String description
    ) {}

    public static final List<MuscleMeta> MUSCLE_DEFINITIONS = List.of(
            new MuscleMeta("chest", "Ngực", "Chest", MuscleGroup.CHEST, "front",
                    "Đẩy ngực, ép ngực, hít đất",
                    "Cơ ngực (Pectoralis major & minor) nằm ở mặt trước lồng ngực, có chức năng khép cánh tay ngang, gập cánh tay và kéo vai về phía trước. Là nhóm cơ đẩy thân trên chủ đạo trong các bài Bench Press, Push-up, Dips."),

            new MuscleMeta("front-deltoids", "Vai trước", "Front delts", MuscleGroup.SHOULDERS, "front",
                    "Đẩy vai, nâng tạ trước mặt, dang tay",
                    "Cơ vai trước (Anterior Deltoid) nằm ở mặt trước khớp vai, hỗ trợ gập và nâng cánh tay ra phía trước. Tham gia tích cực trong các chuyển động đẩy ngực và đẩy vai qua đầu (Overhead Press)."),

            new MuscleMeta("side-deltoids", "Vai giữa", "Side delts", MuscleGroup.SHOULDERS, "front",
                    "Dang vai ngang, kéo tạ lên ngực",
                    "Cơ vai giữa (Lateral Deltoid) nằm ở mặt ngoài khớp vai, chịu trách nhiệm nâng cánh tay sang ngang (abduction). Là nhóm cơ chính trong các bài dang vai ngang (Lateral Raise) và kéo tạ lên ngực (Upright Row)."),

            new MuscleMeta("back-deltoids", "Vai sau", "Rear delts", MuscleGroup.SHOULDERS, "back",
                    "Bay vai sau, face pull",
                    "Cơ vai sau (Posterior Deltoid) nằm ở phía sau khớp vai, chịu trách nhiệm duỗi ngang cánh tay và xoay ngoài. Giúp cân bằng cấu trúc khớp vai, hạn chế cong gù lưng trên, phát triển qua Face Pull, Reverse Fly."),

            new MuscleMeta("biceps", "Tay trước", "Biceps", MuscleGroup.ARMS, "front",
                    "Cuốn tạ các kiểu",
                    "Cơ tay trước (Biceps Brachii) gồm đầu dài và đầu ngắn, nằm ở mặt trước cánh tay. Chức năng chính là gập khuỷu tay và ngửa cẳng tay, thường được tác động bằng các biến thể Cuốn tạ (Curls)."),

            new MuscleMeta("triceps", "Tay sau", "Triceps", MuscleGroup.ARMS, "both",
                    "Ép cáp, duỗi tay qua đầu, chống xà",
                    "Cơ tay sau (Triceps Brachii) chiếm khoảng 60% khối lượng cánh tay với 3 đầu cơ, có chức năng chính là duỗi thẳng khuỷu tay. Tác động mạnh qua Pushdown, Skull Crusher, Dips."),

            new MuscleMeta("forearm", "Cẳng tay", "Forearms", MuscleGroup.ARMS, "both",
                    "Cuốn cổ tay, xách tạ, sức nắm",
                    "Cơ cẳng tay bao gồm nhóm gập và duỗi cổ tay, quyết định lực cầm nắm (Grip Strength) và sự ổn định của cổ tay trong các bài kéo tạ và đẩy nặng."),

            new MuscleMeta("abs", "Bụng", "Abs", MuscleGroup.CORE, "front",
                    "Gập bụng, plank, nâng chân",
                    "Cơ thẳng bụng (Rectus Abdominis) và cơ bụng ngang (Transverse Abdominis) giữ ổn định cột sống, gập thân và bảo vệ nội tạng. Hoạt động qua Plank, Crunches, Leg Raises."),

            new MuscleMeta("obliques", "Liên sườn", "Obliques", MuscleGroup.CORE, "front",
                    "Xoay thân, plank nghiêng",
                    "Cơ liên sườn (Internal & External Obliques) nằm ở hai bên thành bụng, giúp xoay thân, nghiêng người và tạo sự ổn định xoắn khi di chuyển và nâng vật nặng."),

            new MuscleMeta("trapezius", "Cơ thang", "Traps", MuscleGroup.BACK, "back",
                    "Nhún vai, kéo cao",
                    "Cơ thang (Trapezius) trải dài từ đáy hộp sọ xuống lưng giữa, điều khiển chuyển động của xương bả vai (nâng vai, hạ vai, khép vai) và hỗ trợ nâng đỡ cổ."),

            new MuscleMeta("upper-back", "Lưng trên & xô", "Upper back & lats", MuscleGroup.BACK, "back",
                    "Hít xà, kéo xô, kéo cáp",
                    "Cơ lưng trên và cơ xô (Latissimus Dorsi, Rhomboids, Teres major) tạo nên dáng lưng chữ V và độ dày lưng. Chức năng kéo cánh tay về phía thân mình trong các bài Pull-up, Lat Pulldown, Rows."),

            new MuscleMeta("lower-back", "Lưng dưới", "Lower back", MuscleGroup.BACK, "back",
                    "Deadlift, ưỡn lưng",
                    "Cơ lưng dưới (Erector Spinae) chạy dọc cột sống thắt lưng, chịu trách nhiệm duỗi thẳng và bảo vệ cột sống thắt lưng trong Deadlift, Squat và tư thế đứng hàng ngày."),

            new MuscleMeta("gluteal", "Mông", "Glutes", MuscleGroup.LEGS, "back",
                    "Hip thrust, squat, chùng chân",
                    "Cơ mông (Gluteus Maximus, Medius, Minimus) là nhóm cơ phát lực mạnh nhất cơ thể, có nhiệm vụ duỗi hông, dạng đùi và ổn định khung chậu. Phát triển tối ưu qua Hip Thrust, Squat, Lunge."),

            new MuscleMeta("quadriceps", "Đùi trước", "Quads", MuscleGroup.LEGS, "front",
                    "Squat, đạp đùi, đá đùi",
                    "Cơ đùi trước (Quadriceps Femoris) gồm 4 đầu cơ lớn ở mặt trước đùi, chịu trách nhiệm duỗi khớp gối và hỗ trợ gập hông. Kích hoạt tối đa trong Squat, Leg Press, Leg Extension."),

            new MuscleMeta("hamstring", "Đùi sau", "Hamstrings", MuscleGroup.LEGS, "back",
                    "Romanian deadlift, cuốn đùi",
                    "Cơ đùi sau (Hamstrings) nằm ở mặt sau đùi, có chức năng gập đầu gối và duỗi khớp hông. Rất quan trọng cho sự cân bằng khớp gối và tốc độ chạy, phát triển qua RDL, Leg Curl."),

            new MuscleMeta("adductor", "Đùi trong", "Adductors", MuscleGroup.LEGS, "back",
                    "Khép đùi, squat chân rộng",
                    "Cơ khép đùi (Adductor magnus, longus, brevis) nằm ở mặt trong đùi, có chức năng khép chân về phía đường giữa và hỗ trợ ổn định khớp háng khi squat chân rộng hoặc chuyển hướng."),

            new MuscleMeta("abductors", "Hông ngoài", "Abductors", MuscleGroup.LEGS, "front",
                    "Dạng đùi, đi ngang",
                    "Cơ dạng hông (Gluteus Medius/Minimus, Tensor Fasciae Latae) nằm ở phía ngoài hông, giúp nâng chân sang bên và ngăn ngừa sụp đầu gối (knee valgus) khi squat hoặc chạy."),

            new MuscleMeta("calves", "Bắp chân", "Calves", MuscleGroup.LEGS, "both",
                    "Nhón gót",
                    "Cơ bắp chân (Gastrocnemius & Soleus) nằm ở cẳng chân sau, có chức năng nhón bàn chân (plantar flexion) và hỗ trợ gập gối, quan trọng cho bật nhảy và đi lại."),

            new MuscleMeta("neck", "Cổ", "Neck", MuscleGroup.SHOULDERS, "front",
                    "Giữ cổ tĩnh, giãn cổ",
                    "Cơ cổ (Sternocleidomastoid, Splenius) giúp xoay, gập và duỗi đầu, giữ ổn định đốt sống cổ và chống chấn thương trong sinh hoạt và thể thao.")
    );

    private static final Map<String, MuscleMeta> MUSCLE_MAP = new LinkedHashMap<>();

    static {
        for (MuscleMeta m : MUSCLE_DEFINITIONS) {
            MUSCLE_MAP.put(m.key(), m);
        }
    }

    @Transactional(readOnly = true)
    public List<MuscleSummaryResponse> listMuscles(AuthUser user) {
        boolean showHidden = user != null && !user.isMember();
        List<Exercise> exercises = exerciseRepository.findAllByOrderByNameAsc().stream()
                .filter(e -> showHidden || !e.isHidden())
                .toList();

        Map<String, Long> countMap = new HashMap<>();
        for (Exercise e : exercises) {
            Set<String> keys = new HashSet<>();
            if (e.getTargetMuscles() != null) {
                for (String k : e.getTargetMuscles().split(",")) {
                    if (!k.trim().isEmpty()) keys.add(k.trim().toLowerCase(Locale.ROOT));
                }
            }
            if (e.getSecondaryMuscleKeys() != null) {
                for (String k : e.getSecondaryMuscleKeys().split(",")) {
                    if (!k.trim().isEmpty()) keys.add(k.trim().toLowerCase(Locale.ROOT));
                }
            }
            for (String k : keys) {
                countMap.put(k, countMap.getOrDefault(k, 0L) + 1L);
            }
        }

        return MUSCLE_DEFINITIONS.stream()
                .map(m -> new MuscleSummaryResponse(
                        m.key(),
                        m.name(),
                        m.nameEn(),
                        m.group(),
                        m.view(),
                        m.hint(),
                        countMap.getOrDefault(m.key(), 0L)
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public MuscleDetailResponse getMuscleDetail(AuthUser user, String key) {
        if (key == null || !MUSCLE_MAP.containsKey(key.trim().toLowerCase(Locale.ROOT))) {
            throw ApiException.notFound("nhóm cơ");
        }
        MuscleMeta meta = MUSCLE_MAP.get(key.trim().toLowerCase(Locale.ROOT));

        boolean showHidden = user != null && !user.isMember();
        List<Exercise> allVisible = exerciseRepository.findAllByOrderByNameAsc().stream()
                .filter(e -> showHidden || !e.isHidden())
                .toList();

        List<Exercise> primary = new ArrayList<>();
        List<Exercise> secondary = new ArrayList<>();
        Set<String> collectedEquipmentKeys = new LinkedHashSet<>();

        for (Exercise e : allVisible) {
            boolean isPrimary = hasKey(e.getTargetMuscles(), meta.key());
            boolean isSecondary = hasKey(e.getSecondaryMuscleKeys(), meta.key());

            if (isPrimary) {
                primary.add(e);
                collectEquipmentKeys(e, collectedEquipmentKeys);
            } else if (isSecondary) {
                secondary.add(e);
                collectEquipmentKeys(e, collectedEquipmentKeys);
            }
        }

        long totalCount = primary.size() + secondary.size();

        // Equipment list: find equipment commonly used for this muscle
        List<EquipmentResponse> equipmentList = equipmentRepository.findByHiddenFalseOrderBySortOrderAscNameAsc().stream()
                .filter(eq -> collectedEquipmentKeys.contains(eq.getKey()) || hasKey(eq.getTargetMuscleKeys(), meta.key()))
                .map(eq -> mappers.equipmentResponse(eq, countExerciseWithEquipment(allVisible, eq.getKey())))
                .toList();

        List<ExerciseResponse> primaryResponses = primary.stream().map(mappers::exercise).toList();
        List<ExerciseResponse> secondaryResponses = secondary.stream().map(mappers::exercise).toList();

        return new MuscleDetailResponse(
                meta.key(),
                meta.name(),
                meta.nameEn(),
                meta.group(),
                meta.view(),
                meta.hint(),
                meta.description(),
                totalCount,
                primaryResponses,
                secondaryResponses,
                equipmentList
        );
    }

    private static boolean hasKey(String csv, String key) {
        if (csv == null || key == null) return false;
        for (String item : csv.split(",")) {
            if (item.trim().equalsIgnoreCase(key)) return true;
        }
        return false;
    }

    private static void collectEquipmentKeys(Exercise e, Set<String> target) {
        if (e.getEquipments() != null) {
            for (var eq : e.getEquipments()) {
                target.add(eq.getKey().toLowerCase(Locale.ROOT));
            }
        }
        if (e.getEquipmentKeys() != null) {
            for (String k : e.getEquipmentKeys().split(",")) {
                String clean = k.trim().toLowerCase(Locale.ROOT);
                if (!clean.isEmpty()) target.add(clean);
            }
        }
    }

    private static long countExerciseWithEquipment(List<Exercise> exercises, String eqKey) {
        return exercises.stream().filter(e -> {
            if (e.getEquipments() != null && e.getEquipments().stream().anyMatch(eq -> eq.getKey().equalsIgnoreCase(eqKey))) {
                return true;
            }
            return hasKey(e.getEquipmentKeys(), eqKey);
        }).count();
    }
}