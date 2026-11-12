package com.gymflow.service;

import com.gymflow.common.ApiException;
import com.gymflow.common.PageResponse;
import com.gymflow.domain.*;
import com.gymflow.dto.Dtos.*;
import com.gymflow.dto.KnowledgeDtos;
import com.gymflow.repository.ContentSourceRepository;
import com.gymflow.repository.EquipmentRepository;
import com.gymflow.repository.ExerciseRepository;
import com.gymflow.repository.MemberFavoriteExerciseRepository;
import com.gymflow.repository.UserRepository;
import com.gymflow.repository.WorkoutPlanItemRepository;
import com.gymflow.security.AuthUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class ExerciseService {

    private final ExerciseRepository exerciseRepository;
    private final EquipmentRepository equipmentRepository;
    private final ContentSourceRepository sourceRepository;
    private final WorkoutPlanItemRepository planItemRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final Mappers mappers;
    private final MemberFavoriteExerciseRepository favoriteRepository;
    private final AccessService accessService;

    @Autowired
    public ExerciseService(ExerciseRepository exerciseRepository,
                           EquipmentRepository equipmentRepository,
                           ContentSourceRepository sourceRepository,
                           WorkoutPlanItemRepository planItemRepository,
                           UserRepository userRepository,
                           AuditService auditService,
                           Mappers mappers,
                           MemberFavoriteExerciseRepository favoriteRepository,
                           AccessService accessService) {
        this.exerciseRepository = exerciseRepository;
        this.equipmentRepository = equipmentRepository;
        this.sourceRepository = sourceRepository;
        this.planItemRepository = planItemRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.mappers = mappers;
        this.favoriteRepository = favoriteRepository;
        this.accessService = accessService;
    }

    public ExerciseService(ExerciseRepository exerciseRepository,
                           EquipmentRepository equipmentRepository,
                           ContentSourceRepository sourceRepository,
                           WorkoutPlanItemRepository planItemRepository,
                           UserRepository userRepository,
                           AuditService auditService,
                           Mappers mappers) {
        this(exerciseRepository, equipmentRepository, sourceRepository, planItemRepository, userRepository, auditService, mappers, null, null);
    }

    private static final Pattern YT_PATTERN = Pattern.compile(
            "^(?:https?:)?//(?:www\\.|m\\.)?(?:youtube\\.com/(?:watch\\?.*?v=|embed/)|youtu\\.be/|youtube-nocookie\\.com/embed/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$"
    );
    private static final Pattern VIMEO_PATTERN = Pattern.compile(
            "^(?:https?:)?//(?:www\\.)?(?:vimeo\\.com/|player\\.vimeo\\.com/video/)([0-9]+)(?:[?&].*)?$"
    );

    public static String sanitizeVideoUrl(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String s = raw.trim();
        var ytMatcher = YT_PATTERN.matcher(s);
        if (ytMatcher.find()) {
            return "https://www.youtube-nocookie.com/embed/" + ytMatcher.group(1);
        }
        var vimeoMatcher = VIMEO_PATTERN.matcher(s);
        if (vimeoMatcher.find()) {
            return "https://player.vimeo.com/video/" + vimeoMatcher.group(1);
        }
        throw ApiException.badRequest("Chỉ chấp nhận link video từ YouTube hoặc Vimeo");
    }

    public static String stripAccents(String s) {
        if (s == null) return "";
        String nfd = Normalizer.normalize(s, Normalizer.Form.NFD);
        return nfd.replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replace('đ', 'd')
                .replace('Đ', 'd')
                .toLowerCase(Locale.ROOT);
    }

    /** Bộ lọc danh sách; mọi trường đều tuỳ chọn. */
    public record Filter(
            String q,
            MuscleGroup group,
            String muscle,
            String equipment,
            Level level,
            ExerciseLocation location,
            ExerciseGoal goal,
            ReviewStatus reviewStatus,
            ExerciseType exerciseType,
            String subCategory,
            Boolean favoriteOnly,
            Boolean assignedOnly,
            boolean includeHidden
    ) {
        /** Giữ chữ ký cũ cho các bài test và controller cũ. */
        public Filter(String q, MuscleGroup group, String muscle, String equipment, Level level,
                      ExerciseLocation location, ExerciseGoal goal, ReviewStatus reviewStatus, boolean includeHidden) {
            this(q, group, muscle, equipment, level, location, goal, reviewStatus, null, null, null, null, includeHidden);
        }

        public Filter(String q, MuscleGroup group, Level level, ExerciseLocation location, ExerciseGoal goal,
                      ReviewStatus reviewStatus, boolean includeHidden) {
            this(q, group, null, null, level, location, goal, reviewStatus, null, null, null, null, includeHidden);
        }
    }

    /**
     * Hội viên không thấy bài đã ẩn; HLV/quản lý xem được khi bật includeHidden.
     * Bài chưa duyệt vẫn hiện cho mọi vai trò (giáo án cũ đang dùng) nhưng giao diện gắn nhãn "Chờ duyệt".
     */
    @Transactional(readOnly = true)
    public List<ExerciseResponse> list(AuthUser user, Filter f) {
        String needle = f.q() == null ? "" : stripAccents(f.q().trim());
        boolean showHidden = f.includeHidden() && (user == null || !user.isMember());

        Set<Long> favIds = Set.of();
        Set<Long> assignedIds = null;
        if (user != null && user.isMember() && accessService != null && favoriteRepository != null) {
            try {
                Member m = accessService.requireMemberOf(user);
                favIds = new HashSet<>(favoriteRepository.findExerciseIdsByMemberId(m.getId()));
                if (Boolean.TRUE.equals(f.assignedOnly())) {
                    assignedIds = new HashSet<>(planItemRepository.findActiveAssignedExerciseIdsByMemberId(m.getId()));
                }
            } catch (Exception ignored) {
                // Nếu chưa có hồ sơ hội viên hoặc mock thiếu thì bỏ qua
            }
        }

        final Set<Long> finalFavIds = favIds;
        final Set<Long> finalAssignedIds = assignedIds;

        return exerciseRepository.findAllByOrderByNameAsc().stream()
                .filter(e -> showHidden || !e.isHidden())
                .filter(e -> f.exerciseType() == null || e.getExerciseType() == f.exerciseType())
                .filter(e -> matchesSubCategory(e, f.subCategory()))
                .filter(e -> f.group() == null || e.getMuscleGroup() == f.group())
                .filter(e -> matchesMuscle(e, f.muscle()))
                .filter(e -> matchesEquipment(e, f.equipment()))
                .filter(e -> f.level() == null || e.getLevel() == f.level())
                .filter(e -> f.location() == null || e.getLocation() == f.location()
                        || (e.getLocation() == ExerciseLocation.ANY && f.location() != ExerciseLocation.ANY))
                .filter(e -> f.goal() == null || (e.getPrimaryGoal() != null && e.getPrimaryGoal() == f.goal())
                        || Mappers.parseGoals(e.getGoals()).contains(f.goal()))
                .filter(e -> f.reviewStatus() == null || e.getReviewStatus() == f.reviewStatus())
                .filter(e -> needle.isEmpty() || matches(e, needle))
                .filter(e -> !Boolean.TRUE.equals(f.favoriteOnly()) || finalFavIds.contains(e.getId()))
                .filter(e -> !Boolean.TRUE.equals(f.assignedOnly()) || (finalAssignedIds != null && finalAssignedIds.contains(e.getId())))
                .map(e -> {
                    boolean isFav = finalFavIds.contains(e.getId());
                    return isFav ? mappers.exercise(e, true) : mappers.exercise(e);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<ExerciseResponse> listPaged(AuthUser user, Filter f, int page, int size) {
        List<ExerciseResponse> all = list(user, f);
        int totalElements = all.size();
        int pageSize = size <= 0 ? 12 : size;
        int totalPages = (int) Math.ceil((double) totalElements / pageSize);
        int p = Math.max(0, page);
        int fromIndex = Math.min(p * pageSize, totalElements);
        int toIndex = Math.min(fromIndex + pageSize, totalElements);
        List<ExerciseResponse> content = all.subList(fromIndex, toIndex);
        return new PageResponse<>(content, p, pageSize, totalElements, totalPages);
    }

    private static final Map<String, String> SUBCAT_VI_TO_CODE = Map.ofEntries(
            // Strength
            Map.entry("nguc", "CHEST"),
            Map.entry("lung", "BACK"),
            Map.entry("vai", "SHOULDERS"),
            Map.entry("tay truoc", "BICEPS"),
            Map.entry("tay sau", "TRICEPS"),
            Map.entry("bung", "CORE"),
            Map.entry("co bung", "CORE"),
            Map.entry("co bung - loi", "CORE"),
            Map.entry("co bung loi", "CORE"),
            Map.entry("loi", "CORE"),
            Map.entry("chan", "LEGS"),
            Map.entry("mong", "GLUTES"),
            Map.entry("toan than", "FULL_BODY"),
            // Warmup
            Map.entry("khoi dong chung", "FULL_BODY_WARMUP"),
            Map.entry("kich hoat vai & nguc", "SHOULDER_WARMUP"),
            Map.entry("kich hoat vai va nguc", "SHOULDER_WARMUP"),
            Map.entry("kich hoat vai", "SHOULDER_WARMUP"),
            Map.entry("khoi dong vai", "SHOULDER_WARMUP"),
            Map.entry("kich hoat mong & hong", "HIP_WARMUP"),
            Map.entry("kich hoat mong va hong", "HIP_WARMUP"),
            Map.entry("kich hoat mong", "HIP_WARMUP"),
            Map.entry("khoi dong hong", "HIP_WARMUP"),
            Map.entry("khoi dong khop goi", "KNEE_WARMUP"),
            Map.entry("khoi dong goi", "KNEE_WARMUP"),
            Map.entry("xoay khop", "JOINT_ROTATION"),
            Map.entry("gian co dong", "DYNAMIC_STRETCH"),
            Map.entry("kich hoat co bap", "MUSCLE_ACTIVATION"),
            // Cardio
            Map.entry("chay bo", "RUNNING"),
            Map.entry("chay", "RUNNING"),
            Map.entry("di bo", "WALKING"),
            Map.entry("dap xe", "CYCLING"),
            Map.entry("nhay day", "JUMP_ROPE"),
            Map.entry("may cheo thuyen", "ROWING"),
            Map.entry("cheo thuyen", "ROWING"),
            Map.entry("leo cau thang", "STAIR_CLIMBER"),
            Map.entry("stair climber", "STAIR_CLIMBER"),
            Map.entry("leo bac", "STAIR_CLIMBER"),
            Map.entry("leo thang", "STAIR_CLIMBER"),
            Map.entry("hiit", "HIIT")
    );

    private static boolean matchesSubCategory(Exercise e, String subCategory) {
        if (subCategory == null || subCategory.isBlank()) return true;
        if (e.getSubCategory() == null) return false;
        String trimmed = subCategory.trim();
        String eSub = e.getSubCategory().trim();
        if (eSub.equalsIgnoreCase(trimmed)) return true;
        String normalizedTarget = stripAccents(eSub).toLowerCase();
        String normalizedQuery = stripAccents(trimmed).toLowerCase();
        if (normalizedTarget.equals(normalizedQuery)) return true;
        String mappedCode = SUBCAT_VI_TO_CODE.get(normalizedQuery);
        if (mappedCode != null && eSub.equalsIgnoreCase(mappedCode)) return true;
        return false;
    }

    private static boolean matchesMuscle(Exercise e, String muscle) {
        if (muscle == null || muscle.isBlank()) return true;
        String m = muscle.trim();
        if (e.getTargetMuscles() != null) {
            for (String k : e.getTargetMuscles().split(",")) {
                if (k.trim().equalsIgnoreCase(m)) return true;
            }
        }
        if (e.getSecondaryMuscleKeys() != null) {
            for (String k : e.getSecondaryMuscleKeys().split(",")) {
                if (k.trim().equalsIgnoreCase(m)) return true;
            }
        }
        return false;
    }

    private static boolean matchesEquipment(Exercise e, String equipment) {
        if (equipment == null || equipment.isBlank()) return true;
        String eq = equipment.trim();
        if (e.getEquipments() != null && e.getEquipments().stream().anyMatch(item -> item.getKey().equalsIgnoreCase(eq))) {
            return true;
        }
        if (e.getEquipmentKeys() != null) {
            for (String k : e.getEquipmentKeys().split(",")) {
                if (k.trim().equalsIgnoreCase(eq)) return true;
            }
        }
        return false;
    }

    private static boolean matches(Exercise e, String needle) {
        for (String field : new String[]{e.getName(), e.getNameEn(), e.getAliases(), e.getEquipment(), e.getSecondaryMuscles()}) {
            if (field != null && stripAccents(field).contains(needle)) return true;
        }
        return false;
    }

    @Transactional(readOnly = true)
    public ExerciseResponse get(AuthUser user, Long id) {
        Exercise e = load(id);
        if (e.isHidden() && user != null && user.isMember()) throw ApiException.notFound("bài tập");
        boolean isFav = false;
        if (user != null && user.isMember() && accessService != null && favoriteRepository != null) {
            try {
                Member m = accessService.requireMemberOf(user);
                isFav = favoriteRepository.existsByMemberIdAndExerciseId(m.getId(), id);
            } catch (Exception ignored) {}
        }
        return isFav ? mappers.exercise(e, true) : mappers.exercise(e);
    }

    @Transactional(readOnly = true)
    public List<ExerciseResponse> getFavorites(AuthUser user) {
        if (user == null || !user.isMember()) {
            throw ApiException.forbidden("Chỉ hội viên mới có danh sách yêu thích");
        }
        Member m = accessService.requireMemberOf(user);
        List<MemberFavoriteExercise> list = favoriteRepository.findByMemberIdOrderByCreatedAtDesc(m.getId());
        return list.stream()
                .map(MemberFavoriteExercise::getExercise)
                .filter(e -> !e.isHidden())
                .map(e -> mappers.exercise(e, true))
                .toList();
    }

    @Transactional
    public KnowledgeDtos.FavoriteToggleResponse toggleFavorite(AuthUser user, Long exerciseId) {
        if (user == null || !user.isMember()) {
            throw ApiException.forbidden("Chỉ hội viên mới có quyền thao tác yêu thích");
        }
        Member m = accessService.requireMemberOf(user);
        Exercise e = load(exerciseId);
        if (e.isHidden()) {
            throw ApiException.notFound("bài tập");
        }
        var existing = favoriteRepository.findByMemberIdAndExerciseId(m.getId(), exerciseId);
        boolean isFav;
        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
            isFav = false;
        } else {
            MemberFavoriteExercise mfe = new MemberFavoriteExercise(m, e);
            favoriteRepository.save(mfe);
            isFav = true;
        }
        long count = favoriteRepository.countByMemberId(m.getId());
        return new KnowledgeDtos.FavoriteToggleResponse(exerciseId, isFav, count);
    }

    @Transactional
    public KnowledgeDtos.FavoriteToggleResponse addFavorite(AuthUser user, Long exerciseId) {
        if (user == null || !user.isMember()) {
            throw ApiException.forbidden("Chỉ hội viên mới có quyền thao tác yêu thích");
        }
        Member m = accessService.requireMemberOf(user);
        Exercise e = load(exerciseId);
        if (e.isHidden()) {
            throw ApiException.notFound("bài tập");
        }
        if (!favoriteRepository.existsByMemberIdAndExerciseId(m.getId(), exerciseId)) {
            MemberFavoriteExercise mfe = new MemberFavoriteExercise(m, e);
            favoriteRepository.save(mfe);
        }
        long count = favoriteRepository.countByMemberId(m.getId());
        return new KnowledgeDtos.FavoriteToggleResponse(exerciseId, true, count);
    }

    @Transactional
    public KnowledgeDtos.FavoriteToggleResponse removeFavorite(AuthUser user, Long exerciseId) {
        if (user == null || !user.isMember()) {
            throw ApiException.forbidden("Chỉ hội viên mới có quyền thao tác yêu thích");
        }
        Member m = accessService.requireMemberOf(user);
        favoriteRepository.findByMemberIdAndExerciseId(m.getId(), exerciseId).ifPresent(favoriteRepository::delete);
        long count = favoriteRepository.countByMemberId(m.getId());
        return new KnowledgeDtos.FavoriteToggleResponse(exerciseId, false, count);
    }

    @Transactional(readOnly = true)
    public List<SourceResponse> sources() {
        return sourceRepository.findAllByOrderByPublisherAscTitleAsc().stream().map(mappers::source).toList();
    }

    @Transactional
    public ExerciseResponse create(AuthUser user, ExerciseRequest req) {
        if (user == null || user.isMember()) {
            throw ApiException.forbidden("Chỉ quản lý hoặc huấn luyện viên mới có quyền tạo bài tập");
        }
        if (exerciseRepository.existsByNameIgnoreCase(req.name().trim())) throw ApiException.conflict("Tên bài tập đã tồn tại");
        Exercise e = new Exercise();
        apply(e, req);
        e.setReviewStatus(ReviewStatus.PENDING);
        e.setCreatedBy(userRepository.getReferenceById(user.id()));
        exerciseRepository.save(e);
        auditService.log("EXERCISE_CREATE", "EXERCISE", e.getId(), e.getName());
        return mappers.exercise(e);
    }

    /** HLV sửa nội dung → bài quay về "Chờ duyệt"; quản lý sửa thì giữ nguyên trạng thái. */
    @Transactional
    public ExerciseResponse update(AuthUser user, Long id, ExerciseRequest req) {
        if (user == null || user.isMember()) {
            throw ApiException.forbidden("Chỉ quản lý hoặc huấn luyện viên mới có quyền sửa bài tập");
        }
        Exercise e = load(id);
        if (exerciseRepository.existsByNameIgnoreCaseAndIdNot(req.name().trim(), id)) throw ApiException.conflict("Tên bài tập đã tồn tại");
        apply(e, req);
        if (!user.isAdmin() && e.getReviewStatus() != ReviewStatus.PENDING) {
            e.setReviewStatus(ReviewStatus.PENDING);
            e.setReviewedBy(null);
            e.setReviewedAt(null);
        }
        auditService.log("EXERCISE_UPDATE", "EXERCISE", e.getId(), e.getName());
        return mappers.exercise(e);
    }

    @Transactional
    public ExerciseResponse review(AuthUser user, Long id, ReviewRequest req) {
        Exercise e = load(id);
        String note = Mappers.blankToNull(req.note());
        if (req.status() == ReviewStatus.APPROVED) {
            if (e.getSources().isEmpty()) throw ApiException.badRequest("Bài tập cần ít nhất một nguồn tham khảo trước khi duyệt");
            List<String> missing = ExerciseChecklist.missing(e);
            if (!missing.isEmpty()) throw ApiException.badRequest("Chưa đủ điều kiện duyệt: " + String.join("; ", missing));
        }
        if (req.status() == ReviewStatus.NEEDS_REVIEW && note == null) {
            throw ApiException.badRequest("Vui lòng ghi rõ nội dung cần chỉnh sửa");
        }
        markReviewed(user, e, req.status(), note);
        auditService.log("EXERCISE_REVIEW", "EXERCISE", e.getId(), e.getName() + " → " + req.status());
        return mappers.exercise(e);
    }

    /** Duyệt nhiều bài một lần; bài chưa đủ checklist hoặc đã duyệt thì bỏ qua và báo lý do. */
    @Transactional
    public BulkApproveResponse approveMany(AuthUser user, BulkApproveRequest req) {
        String note = Mappers.blankToNull(req.note());
        int approved = 0;
        List<String> skipped = new ArrayList<>();
        for (Long id : req.ids().stream().distinct().toList()) {
            Exercise e = exerciseRepository.findById(id).orElse(null);
            if (e == null) {
                skipped.add("#" + id + ": không tồn tại");
                continue;
            }
            if (e.getReviewStatus() == ReviewStatus.APPROVED) continue;
            List<String> missing = ExerciseChecklist.missing(e);
            if (!missing.isEmpty()) {
                skipped.add(e.getName() + ": " + String.join("; ", missing));
                continue;
            }
            markReviewed(user, e, ReviewStatus.APPROVED, note);
            approved++;
        }
        auditService.log("EXERCISE_REVIEW_BULK", "EXERCISE", null, approved + " bài được duyệt, bỏ qua " + skipped.size());
        return new BulkApproveResponse(approved, skipped);
    }

    private void markReviewed(AuthUser user, Exercise e, ReviewStatus status, String note) {
        e.setReviewStatus(status);
        e.setReviewNote(note);
        e.setReviewedBy(userRepository.getReferenceById(user.id()));
        e.setReviewedAt(LocalDateTime.now());
    }

    @Transactional
    public ExerciseResponse setHidden(Long id, boolean hidden) {
        Exercise e = load(id);
        e.setHidden(hidden);
        auditService.log(hidden ? "EXERCISE_HIDE" : "EXERCISE_SHOW", "EXERCISE", e.getId(), e.getName());
        return mappers.exercise(e);
    }

    /** Bài đã nằm trong giáo án chỉ được ẩn, không xoá (giữ nguyên giáo án cũ). */
    @Transactional
    public void delete(Long id) {
        Exercise e = load(id);
        if (planItemRepository.existsByExerciseId(id)) {
            throw ApiException.conflict("Bài tập đang được dùng trong giáo án, hãy ẩn thay vì xoá");
        }
        exerciseRepository.delete(e);
        auditService.log("EXERCISE_DELETE", "EXERCISE", id, e.getName());
    }

    private void apply(Exercise e, ExerciseRequest req) {
        e.setName(req.name().trim());
        e.setMuscleGroup(req.muscleGroup());
        e.setEquipment(Mappers.blankToNull(req.equipment()));
        e.setLevel(req.level());
        e.setDescription(Mappers.blankToNull(req.description()));
        e.setInstructions(Mappers.blankToNull(req.instructions()));
        e.setVideoUrl(sanitizeVideoUrl(req.videoUrl()));
        e.setSetupPosition(Mappers.blankToNull(req.setupPosition()));
        e.setSteps(Mappers.blankToNull(req.steps() != null ? req.steps() : req.instructions()));
        e.setSetsRepsHint(Mappers.blankToNull(req.setsRepsHint()));
        e.setPrimaryGoal(req.primaryGoal() != null ? req.primaryGoal() : (req.goals() != null && !req.goals().isEmpty() ? req.goals().get(0) : null));
        e.setNameEn(Mappers.blankToNull(req.nameEn()));
        e.setAliases(Mappers.blankToNull(req.aliases()));
        e.setSecondaryMuscles(Mappers.blankToNull(req.secondaryMuscles()));
        e.setLocation(req.location());
        e.setGoals(Mappers.joinGoals(req.goals()));
        e.setBreathing(Mappers.blankToNull(req.breathing()));
        e.setCommonMistakes(Mappers.blankToNull(req.commonMistakes()));
        e.setSafetyNotes(Mappers.blankToNull(req.safetyNotes()));
        e.setVariations(Mappers.blankToNull(req.variations()));
        e.setSuggestedDose(Mappers.blankToNull(req.suggestedDose()));
        if (req.contentOrigin() != null) e.setContentOrigin(req.contentOrigin());
        if (req.sourceIds() != null) e.setSources(resolveSources(sourceRepository, req.sourceIds()));
        if (req.targetMuscles() != null) e.setTargetMuscles(joinKeys(req.targetMuscles(), MUSCLE_KEYS, "vùng cơ"));
        if (req.secondaryMuscleKeys() != null) e.setSecondaryMuscleKeys(joinKeys(req.secondaryMuscleKeys(), MUSCLE_KEYS, "vùng cơ"));

        if (req.exerciseType() != null) {
            e.setExerciseType(req.exerciseType());
        } else if (e.getExerciseType() == null) {
            e.setExerciseType(ExerciseType.STRENGTH);
        }
        if (req.subCategory() != null) {
            e.setSubCategory(Mappers.blankToNull(req.subCategory()));
        }

        if (req.equipmentKeys() != null) {
            e.setEquipmentKeys(joinEquipmentKeys(req.equipmentKeys()));
            List<String> cleanKeys = req.equipmentKeys().stream()
                    .filter(Objects::nonNull).map(String::trim).filter(s -> !s.isEmpty()).distinct().toList();
            if (cleanKeys.isEmpty()) {
                e.setEquipments(new LinkedHashSet<>());
            } else {
                List<Equipment> eqList = equipmentRepository.findAllById(cleanKeys);
                e.setEquipments(new LinkedHashSet<>(eqList));
            }
        }

        if (req.imageKey() != null) e.setImageKey(Mappers.blankToNull(req.imageKey()));
        if (req.alternativeIds() != null) {
            List<Long> distinctIds = req.alternativeIds().stream()
                    .filter(Objects::nonNull)
                    .filter(altId -> e.getId() == null || !e.getId().equals(altId))
                    .distinct().toList();
            List<Exercise> alts = distinctIds.isEmpty() ? List.of() : exerciseRepository.findAllById(distinctIds);
            e.setAlternatives(new LinkedHashSet<>(alts));
        }
    }

    /** V13 & V18 · khớp lib/anatomy.ts ở frontend. */
    public static final Set<String> MUSCLE_KEYS = Set.of("chest", "front-deltoids", "back-deltoids", "biceps", "triceps", "forearm",
            "abs", "obliques", "trapezius", "upper-back", "lower-back", "gluteal", "quadriceps", "hamstring", "adductor",
            "abductors", "calves", "neck");

    public static String joinKeys(List<String> keys, Set<String> allowed, String what) {
        List<String> clean = keys.stream().filter(Objects::nonNull).map(String::trim).filter(s -> !s.isEmpty()).distinct().toList();
        for (String k : clean) if (!allowed.contains(k)) throw ApiException.badRequest("Mã " + what + " không hợp lệ: " + k);
        return clean.isEmpty() ? null : String.join(",", clean);
    }

    /**
     * Mã dụng cụ lấy trực tiếp từ bảng equipment, không dùng danh sách cứng.
     * Nhờ vậy dụng cụ mới thêm ở kho dụng cụ có thể gắn vào bài tập ngay mà không cần sửa code.
     */
    String joinEquipmentKeys(List<String> keys) {
        List<String> clean = keys.stream().filter(Objects::nonNull).map(String::trim)
                .filter(s -> !s.isEmpty()).distinct().toList();
        for (String k : clean) {
            if (!equipmentRepository.existsById(k)) {
                throw ApiException.badRequest("Mã dụng cụ không tồn tại trong kho dụng cụ: " + k);
            }
        }
        return clean.isEmpty() ? null : String.join(",", clean);
    }

    static LinkedHashSet<ContentSource> resolveSources(ContentSourceRepository repo, List<Long> ids) {
        List<Long> distinct = ids.stream().distinct().toList();
        List<ContentSource> found = repo.findAllById(distinct);
        if (found.size() != distinct.size()) throw ApiException.badRequest("Có nguồn tham khảo không tồn tại");
        return new LinkedHashSet<>(found);
    }

    Exercise load(Long id) {
        return exerciseRepository.findById(id).orElseThrow(() -> ApiException.notFound("bài tập"));
    }
}