// Kiểu dữ liệu đối chiếu 1-1 với backend/src/main/java/com/gymflow/dto/Dtos.java
// LocalDate = 'YYYY-MM-DD' · LocalDateTime = 'YYYY-MM-DDTHH:mm:ss' (giờ Việt Nam, không kèm múi giờ) · LocalTime = 'HH:mm:ss'

export type Role = 'ADMIN' | 'TRAINER' | 'MEMBER';
export type UserStatus = 'ACTIVE' | 'LOCKED';
export type MemberStatus = 'ACTIVE' | 'PAUSED' | 'INACTIVE';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type SubscriptionState = 'UPCOMING' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'CANCELLED';
export type ScheduleStatus = 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
export type PlanStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type MuscleGroup = 'CHEST' | 'BACK' | 'LEGS' | 'SHOULDERS' | 'ARMS' | 'CORE' | 'CARDIO' | 'FULL_BODY';
export type Level = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface Page<T> { content: T[]; page: number; size: number; totalElements: number; totalPages: number }
export type PageResponse<T> = Page<T>;
export interface MessageResponse { message: string }
export interface LabelValue { label: string; value: number }

// ---------- Auth ----------
export interface Me {
  id: number; email: string; fullName: string; phone: string | null; role: Role;
  memberId: number | null; trainerId: number | null; lastLoginAt: string | null;
  /** null = chưa có ảnh đại diện; đổi giá trị mỗi lần đổi ảnh */
  avatarUpdatedAt: string | null;
}
export interface LoginResponse { token: string; expiresInMinutes: number; user: Me }
export interface ForgotPasswordResponse { message: string; validMinutes: number }
export interface AuthMessageResponse { message: string }
export interface RegisterRequest {
  fullName: string; email: string; phone: string; password: string; confirmPassword: string; acceptTerms: boolean;
}
export interface RegisterResponse { message: string; email: string }
export interface DemoAccount { label: string; role: Role; email: string; password: string }
export interface AuthOptions { registrationEnabled: boolean; demoAccounts: DemoAccount[] }

// ---------- Member ----------
export interface Member {
  id: number; userId: number; code: string; fullName: string; email: string; phone: string | null;
  dateOfBirth: string | null; gender: Gender | null; heightCm: number | null; goal: string | null; address: string | null;
  status: MemberStatus; accountStatus: UserStatus; trainerId: number | null; trainerName: string | null;
  joinedAt: string; note: string | null;
  currentPlanName: string | null; subscriptionState: SubscriptionState | null;
  subscriptionEndDate: string | null; daysLeft: number | null;
}
export interface MemberForm {
  email?: string; password?: string; fullName: string; phone: string; dateOfBirth: string | null; gender: Gender | null;
  heightCm: number | null; goal: string; address: string; trainerId: number | null; note: string;
}
export interface MemberCreated { member: Member; temporaryPassword: string | null }
export interface MemberDetail {
  member: Member; subscriptions: Subscription[]; plans: WorkoutPlanSummary[];
  latestWeight: Weight | null; totalSessions: number; completedSessions: number;
}

// ---------- Trainer ----------
export interface Shift { id?: number; dayOfWeek: number; startTime: string; endTime: string }
export interface TrainerPublic {
  id: number; fullName: string; avatar: string | null; specialty: string | null;
  experienceYears: number; certificates: string | null; bio: string | null; shifts: Shift[];
}
export interface Trainer {
  id: number; userId: number; fullName: string; email: string; phone: string | null; specialty: string | null;
  experienceYears: number; certificates: string | null; bio: string | null; active: boolean;
  accountStatus: UserStatus; memberCount: number; shifts: Shift[];
}
export interface TrainerCreated { trainer: Trainer; temporaryPassword: string | null }
/** Giờ tập mong muốn của hội viên theo tuần (1 = T2 … 7 = CN). */
export interface TimeSlot { dayOfWeek: number; startTime: string; endTime: string }
export interface MemberTimeSlot extends TimeSlot { memberId: number; memberName: string; memberCode: string }
export interface BulkApproveResult { approved: number; skipped: string[] }

// ---------- Plans & subscriptions ----------
export type PlanType = 'GYM' | 'GYM_PT';

export interface PlanServiceGrant {
  serviceId: number;
  serviceName?: string;
  quantity: number;
  validDays: number;
  conditions?: string | null;
}

export interface MembershipPlan {
  id: number; name: string; description: string | null; price: number; durationDays: number;
  benefits: string | null; active: boolean; currentSubscriptions: number;
  /** Gói có HLV kèm (PT): hội viên chọn HLV khi đăng ký. false = tự tập, tự soạn giáo án. Backend luôn trả về. */
  includesTrainer?: boolean;
  planType?: PlanType;
  ptSessions?: number | null;
  ptValidDays?: number | null;
  serviceGrants?: PlanServiceGrant[];
  /** V24 · null = chưa khai báo */
  code?: string | null;
  usageTerms?: string | null;
  ptSessionMinutes?: number | null;
  ptCancelNoticeHours?: number | null;
}
export interface Subscription {
  id: number; memberId: number; memberName: string; memberCode: string; planId: number; planName: string;
  startDate: string; endDate: string; pricePaid: number; state: SubscriptionState; daysLeft: number;
  cancelled: boolean; cancelledAt: string | null; note: string | null; createdAt: string; createdByName: string | null;
  ptSessionsTotal?: number | null;
  ptSessionsUsed?: number | null;
  ptSessionsRemaining?: number | null;
  ptValidUntil?: string | null;
  /** V24 · ảnh chụp lúc bán; gói bán trước V24 để null */
  planType?: PlanType | null;
  ptSessionMinutes?: number | null;
  ptCancelNoticeHours?: number | null;
  benefits?: string | null;
  usageTerms?: string | null;
  trainerName?: string | null;
}
/** V24 · GET /subscriptions/pt-overview. ptSessionsRemaining = null khi gói chưa khai báo số buổi. */
export interface PtOverviewRow {
  subscriptionId: number; memberId: number; memberCode: string; memberName: string;
  trainerId: number | null; trainerName: string | null; planName: string;
  startDate: string; endDate: string; ptValidUntil: string | null; state: SubscriptionState;
  ptSessionsTotal: number | null; ptSessionsUsed: number; ptSessionsScheduled: number;
  ptSessionsRemaining: number | null; ptSessionMinutes: number | null;
}
export interface PtSessionUsage {
  id: number;
  subscriptionId: number;
  scheduleId: number;
  scheduleTitle: string;
  startTime: string;
  endTime: string;
  trainerId?: number | null;
  trainerName?: string | null;
  usedAt: string;
  createdById?: number | null;
  createdByName?: string | null;
}
export interface SubscriptionPreview { startDate: string; endDate: string; price: number; chained: boolean }
export type PackageRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type PaymentMethod = 'COUNTER' | 'BANK_TRANSFER';
export interface PackageRequest {
  id: number; memberId: number; memberName: string; memberCode: string; memberPhone: string | null;
  planId: number; planName: string; price: number; durationDays: number; planStillOnSale: boolean;
  desiredStartDate: string | null; note: string | null; status: PackageRequestStatus; decisionNote: string | null;
  decidedByName: string | null; decidedAt: string | null; subscriptionId: number | null; createdAt: string;
  includesTrainer: boolean; trainerId: number | null; trainerName: string | null;
  /** paymentCode = nội dung chuyển khoản (GF000123); memberPaidAt = lúc hội viên bấm "Tôi đã chuyển khoản" */
  paymentMethod: PaymentMethod; paymentCode: string | null; memberPaidAt: string | null;
  promotionId?: number | null;
  promotionCode?: string | null;
  promotionName?: string | null;
  originalPrice?: number;
  discountAmount?: number;
  finalPrice?: number;
}
/** Thông tin nhận chuyển khoản; ảnh QR tải riêng bằng api.blob('/payment-settings/qr'). */
export interface PaymentSettings {
  onlineEnabled: boolean; bankName: string | null; accountNumber: string | null; accountName: string | null;
  hasQr: boolean; qrUpdatedAt: string | null; updatedAt: string;
}

// ---------- Services, Entitlements, Promotions ----------
export type ServiceCategory = 'RELAX' | 'RECOVERY' | 'AMENITY' | 'NUTRITION' | 'OTHER';
export type EntitlementSource = 'PLAN' | 'PURCHASE' | 'PROMOTION';
export type EntitlementStatus = 'ACTIVE' | 'CANCELLED';
export type DiscountType = 'PERCENT' | 'AMOUNT' | 'NONE';

export interface ServiceItem {
  id: number;
  name: string;
  category: ServiceCategory;
  description: string | null;
  unitPrice: number | null;
  requiresBooking: boolean;
  openingNote: string | null;
  active: boolean;
  createdAt: string;
}

export interface ServiceUsage {
  id: number;
  entitlementId: number;
  usedAt: string;
  confirmedById: number | null;
  confirmedByName: string | null;
  note: string | null;
}

export interface MemberServiceEntitlement {
  id: number;
  memberId: number;
  memberName: string;
  memberCode: string;
  serviceId: number;
  serviceName: string;
  source: EntitlementSource;
  subscriptionId: number | null;
  planName: string | null;
  packageRequestId: number | null;
  grantedQty: number;
  usedQty: number;
  remainingQty: number;
  validFrom: string;
  validUntil: string;
  conditions: string | null;
  status: EntitlementStatus;
  usable: boolean;
  createdAt: string;
  usages?: ServiceUsage[];
}

export interface PromotionGrant {
  serviceId: number;
  serviceName?: string;
  quantity: number;
  validDays: number;
  conditions?: string | null;
}

export interface Promotion {
  id: number;
  code: string | null;
  name: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  startsAt: string;
  endsAt: string;
  maxUses: number | null;
  usedCount: number;
  newMembersOnly: boolean;
  renewalOnly: boolean;
  stackable: boolean;
  active: boolean;
  createdAt: string;
  planIds?: number[];
  grants?: PromotionGrant[];
}

export interface PromotionValidationResponse {
  valid: boolean;
  reason: string | null;
  promotionId: number | null;
  promotionCode: string | null;
  promotionName: string | null;
  description: string | null;
  discountType: DiscountType | null;
  discountValue: number | null;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  gifts?: PromotionGrant[];
}

export interface ServiceRequest {
  id: number;
  memberId: number;
  memberName: string;
  memberCode: string;
  memberPhone: string | null;
  serviceId: number;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  paymentCode: string | null;
  memberPaidAt: string | null;
  memberNote: string | null;
  status: PackageRequestStatus;
  decisionNote: string | null;
  decidedByName: string | null;
  decidedAt: string | null;
  entitlementId: number | null;
  createdAt: string;
}

// ---------- Exercises & plans ----------
export type ReviewStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'NEEDS_REVIEW';
export type ContentOrigin = 'SELF_AUTHORED' | 'ADAPTED';
export type ExerciseLocation = 'GYM' | 'HOME' | 'ANY';
export type ExerciseGoal = 'STRENGTH' | 'ENDURANCE' | 'MOBILITY' | 'BALANCE' | 'FAT_LOSS' | 'HYPERTROPHY' | 'TONE';
export interface Source {
  id: number; code: string; publisher: string; title: string; url: string; license: string | null; licenseUrl: string | null;
  licenseVerified: boolean; attribution: string | null; publisherReviewed: string | null; accessedAt: string;
}
export interface ExerciseSummary {
  id: number; name: string; nameEn?: string | null; level: Level;
  targetMuscles?: string[]; imageKey?: string | null;
}

export type ExerciseType = 'STRENGTH' | 'WARMUP' | 'CARDIO';

export interface Exercise {
  id: number; name: string; muscleGroup: MuscleGroup; equipment: string | null; level: Level;
  description: string | null; descriptionEn?: string | null; instructions: string | null; videoUrl: string | null; hidden: boolean;
  usageCount: number; createdByName: string | null;
  nameEn: string | null; aliases: string | null; secondaryMuscles: string | null; location: ExerciseLocation | null;
  goals: ExerciseGoal[]; breathing: string | null; commonMistakes: string | null; safetyNotes: string | null;
  variations: string | null; suggestedDose: string | null; contentOrigin: ContentOrigin;
  reviewStatus: ReviewStatus; reviewNote: string | null; reviewedByName: string | null; reviewedAt: string | null;
  updatedAt: string | null; sources: Source[];
  /** V13 · khoá vùng cơ / dụng cụ (lib/anatomy.ts) và thư mục ảnh minh hoạ. */
  targetMuscles?: string[]; secondaryMuscleKeys?: string[]; equipmentKeys?: string[]; imageKey?: string | null;
  /** V18 · tư thế chuẩn bị, các bước đánh số, số hiệp/lần gợi ý, mục tiêu chính, bài thay thế. */
  setupPosition?: string | null; steps?: string | null; setsRepsHint?: string | null;
  primaryGoal?: ExerciseGoal | null; alternatives?: ExerciseSummary[];
  /** SCRUM-229: Phân loại bài tập, danh mục con, yêu thích của Member và quan hệ thiết bị */
  exerciseType?: ExerciseType;
  subCategory?: string | null;
  isFavorite?: boolean;
  equipments?: { key: string; name: string; category: EquipmentCategory; imageKey?: string | null }[];
}

export type EquipmentCategory = 'FREE_WEIGHT' | 'MACHINE' | 'CABLE' | 'BODYWEIGHT' | 'CARDIO' | 'ACCESSORY' | 'RECOVERY';

export interface Equipment {
  key: string;
  name: string;
  category: EquipmentCategory;
  shortDesc?: string | null;
  usageGuide?: string | null;
  adjustGuide?: string | null;
  commonMistakes?: string | null;
  safetyNotes?: string | null;
  targetMuscleKeys: string[];
  imageKey?: string | null;
  sortOrder: number;
  hidden: boolean;
  reviewStatus: ReviewStatus;
  origin: ContentOrigin;
  exerciseCount?: number;
  relatedExercises?: Exercise[];
}

// ---------- Knowledge base ----------
export type ArticleCategory = 'NUTRITION' | 'HYDRATION' | 'SLEEP' | 'ACTIVITY' | 'RECOVERY' | 'TRAINING_GUIDE';

export interface MuscleSummary {
  key: string;
  name: string;
  nameEn: string;
  group: MuscleGroup;
  view: 'front' | 'back' | 'both';
  hint: string;
  exerciseCount: number;
}

export interface MuscleDetail {
  key: string;
  name: string;
  nameEn: string;
  group: MuscleGroup;
  view: 'front' | 'back' | 'both';
  hint: string;
  description: string;
  exerciseCount: number;
  primaryExercises: Exercise[];
  secondaryExercises: Exercise[];
  commonEquipment: Equipment[];
}

export interface FavoriteToggleResult {
  exerciseId: number;
  isFavorite: boolean;
  favoriteCount: number;
  message: string;
}
export type ArticleStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'ARCHIVED';
export type ArticleAction = 'SUBMIT' | 'APPROVE' | 'REJECT' | 'ARCHIVE' | 'RESTORE';
export interface ArticleSummary { id: number; slug: string; title: string; category: ArticleCategory; summary: string; publishedAt: string | null }
export interface Article {
  id: number; slug: string; title: string; category: ArticleCategory; summary: string; body: string; contentOrigin: ContentOrigin;
  status: ArticleStatus; reviewNote: string | null; authorName: string | null; authorId: number | null; reviewedByName: string | null;
  reviewedAt: string | null; publishedAt: string | null; createdAt: string | null; updatedAt: string | null; sources: Source[];
}
export interface PlanItem {
  id?: number; exerciseId: number; exerciseName?: string; muscleGroup?: MuscleGroup; equipment?: string | null;
  dayOfWeek: number; sortOrder: number; sets: number; reps: string; weightKg: number | null;
  restSeconds: number | null; durationMinutes: number | null; note: string | null;
}
export interface WorkoutPlanSummary {
  id: number; memberId: number; memberName: string; trainerId: number | null; trainerName: string | null;
  name: string; goal: string | null; startDate: string; endDate: string; status: PlanStatus;
  itemCount: number; trainingDays: number; createdAt: string;
}
export interface WorkoutPlan { summary: WorkoutPlanSummary; note: string | null; items: PlanItem[] }
export interface WorkoutPlanHistory {
  id: number;
  memberId: number;
  oldPlanId: number | null;
  oldPlanName: string | null;
  newPlanId: number;
  newPlanName: string;
  appliedAt: string;
  endedAt: string | null;
  cancelledFutureSessions: number;
  note: string | null;
}

// ---------- Schedules ----------
export type ExerciseIntensity = 'LIGHT' | 'MODERATE' | 'VIGOROUS';
export type ActivityCategory = 'RESISTANCE' | 'CARDIO' | 'RUNNING' | 'WALKING' | 'CYCLING' | 'JUMP_ROPE' | 'HIIT' | 'OTHER';
export type EstimateStatus = 'OK' | 'MISSING_WEIGHT' | 'NO_EXERCISE_DATA' | 'LEGACY';
export type EstimateQuality = 'DETAILED' | 'COARSE';
export interface WorkoutLog {
  id: number; completedAt: string; durationMinutes: number | null; calories: number | null;
  weightKgUsed: number | null; activeMinutes: number | null; intensity: ExerciseIntensity | null;
  formulaVersion: string | null; estimateStatus: EstimateStatus; estimateQuality: EstimateQuality | null;
  estimated: boolean; rating: number | null; note: string | null;
}
export interface Schedule {
  id: number; memberId: number; memberName: string; trainerId: number | null; trainerName: string | null;
  planId: number | null; planName: string | null; title: string; startTime: string; endTime: string;
  status: ScheduleStatus; note: string | null; log: WorkoutLog | null;
}
export interface ScheduleCreated { created: Schedule[]; skipped: string[] }

// ---------- Calorie (MET) ----------
export interface CalorieExercise {
  exerciseId: number | null; exerciseName: string; activityCategory: ActivityCategory;
  intensity: ExerciseIntensity; metValue: number; metSourceCode: string | null; metSourceVersion: string | null;
  sets: number | null; reps: string | null; workSecondsPerSet: number | null; restSeconds: number | null;
  activeMinutes: number; calories: number | null; dataSource: 'PLAN' | 'FALLBACK';
}
export interface CaloriePreview {
  scheduleId: number; title: string; date: string; durationMinutes: number; weightKg: number | null;
  weightSource: string; intensity: ExerciseIntensity; exercises: CalorieExercise[]; totalCalories: number | null;
  activeMinutes: number; estimateStatus: EstimateStatus; estimateQuality: EstimateQuality | null; disclaimer: string;
}
export interface CalorieBucket { key: string; label: string; from: string; to: string; calories: number; sessions: number; activeMinutes: number }
export interface CaloriePeriodSummary { from: string; to: string; calories: number; sessions: number; activeMinutes: number; avgCaloriesPerSession: number | null; changePercent: number | null }
export interface CalorieTopDay { date: string; calories: number; sessions: number }
export interface CalorieSummary {
  period: 'DAY' | 'WEEK' | 'MONTH'; from: string; to: string; timezone: string; totalCalories: number;
  totalSessions: number; estimatedSessions: number; unestimatedSessions: number;
  totalActiveMinutes: number; avgCaloriesPerSession: number | null; buckets: CalorieBucket[];
  topDay: CalorieTopDay | null; previous: CaloriePeriodSummary; disclaimer: string;
}
export interface CalorieSession {
  logId: number; scheduleId: number | null; title: string; completedAt: string; durationMinutes: number | null;
  activeMinutes: number | null; calories: number | null; intensity: ExerciseIntensity | null;
  weightKgUsed: number | null; estimateStatus: EstimateStatus; estimateQuality: EstimateQuality | null;
  formulaVersion: string | null; exercises: CalorieExercise[];
}
export interface CalorieBackfillResult {
  processed: number; estimated: number; missingWeight: number; noExerciseData: number;
  skipped: number; failed: number; formulaVersion: string;
}

// ---------- Progress ----------
export interface Weight {
  id: number; recordedDate: string; weightKg: number; bodyFat: number | null;
  waistCm: number | null; chestCm: number | null; armCm: number | null; thighCm: number | null; note: string | null;
}
export interface WeekAttendance { weekStart: string; scheduled: number; completed: number; missed: number }
export interface Progress {
  memberId: number; heightCm: number | null; currentWeight: number | null; startWeight: number | null;
  weightChange: number | null; bodyFat: number | null; bmi: number | null; bmiCategory: string | null;
  weights: Weight[]; attendance: WeekAttendance[]; attendanceRate: number | null; streakWeeks: number;
  totalSessions: number; totalMinutes: number; totalCalories: number; avgRating: number | null;
}

// ---------- Dashboards ----------
export interface AdminDashboard {
  totalMembers: number; activeMembers: number; newMembersThisMonth: number; membersWithActivePackage: number;
  expiringSoon: number; revenueThisMonth: number; revenuePrevMonth: number; activeTrainers: number; sessionsToday: number;
  revenueByMonth: LabelValue[]; planDistribution: LabelValue[]; expiring: Subscription[]; recentActivity: AuditEntry[];
}
export interface TrainerDashboard {
  memberCount: number; sessionsToday: number; sessionsThisWeek: number; completedThisWeek: number; missedThisWeek: number;
  completionRate: number | null; activePlans: number; todaySessions: Schedule[]; expiringMembers: Subscription[]; weekLoad: LabelValue[];
  assignedMembers?: TrainerMemberProgress[];
}
export interface TrainerMemberProgress {
  memberId: number; code: string; fullName: string;
  attendanceThisWeek: number | null; streakWeeks: number; nextSession: Schedule | null;
}
export interface MemberDashboard {
  member: Member; currentSubscription: Subscription | null; nextSession: Schedule | null; weekSessions: Schedule[];
  completedThisMonth: number; streakWeeks: number; latestWeight: Weight | null; bmi: number | null; bmiCategory: string | null;
  currentPlan: WorkoutPlanSummary | null;
}

// ---------- Reports ----------
export interface TrainerAttendance { trainerId: number; trainerName: string; total: number; completed: number; missed: number }
export interface Report {
  from: string; to: string; revenueTotal: number; subscriptionCount: number;
  revenueByMonth: LabelValue[]; revenueByPlan: LabelValue[];
  scheduled: number; completed: number; missed: number; cancelled: number; attendanceRate: number | null;
  byTrainer: TrainerAttendance[]; membersByStatus: LabelValue[]; membersByGender: LabelValue[]; newMembersByMonth: LabelValue[];
}

// ---------- Users, audit, notifications ----------
export interface UserAccount { id: number; email: string; fullName: string; phone: string | null; role: Role; status: UserStatus; lastLoginAt: string | null; createdAt: string }
export interface AuditEntry { id: number; actorId: number | null; actorEmail: string | null; action: string; targetType: string | null; targetId: string | null; detail: string | null; success: boolean; ip: string | null; createdAt: string }
export interface Notification { id: string; level: 'info' | 'warning' | 'danger'; title: string; message: string; link: string | null; at: string }

export interface ApiErrorBody { status: number; message: string; fieldErrors?: Record<string, string> | null }

export interface UserCreated { user: UserAccount; temporaryPassword: string | null }

// ---------- Member - Trainer Conversations ----------
export type ConversationRelation = 'ASSIGNED' | 'CONSULTING';

export interface ChatMessageItem {
  id: number;
  conversationId: number;
  senderUserId: number;
  senderName: string;
  senderRole?: string | null;
  attachmentUrl?: string | null;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export interface Conversation {
  id: number;
  memberId: number;
  memberName: string;
  memberAvatar: string | null;
  trainerId: number;
  trainerName: string;
  trainerAvatar: string | null;
  createdAt: string;
  lastMessageAt: string | null;
  lastMessage: ChatMessageItem | null;
  unreadCount: number;
  relation: ConversationRelation;
}

export interface AdminConversationSummary {
  id: number;
  memberId: number;
  memberName: string;
  memberAvatar: string | null;
  trainerId: number;
  trainerName: string;
  trainerAvatar: string | null;
  lastMessageSnippet: string | null;
  lastMessageAt: string | null;
  messageCount: number;
  updatedAt: string;
  createdAt: string;
}

export interface UnreadCount {
  unreadCount: number;
}

// ---------- Onboarding & Tours ----------
export type OnboardingStepStatus = 'DONE' | 'IN_PROGRESS' | 'BLOCKED' | 'TODO';

export interface OnboardingStep {
  key: string;
  title: string;
  required: boolean;
  status: OnboardingStepStatus;
  updatedAt: string | null;
  reason: string;
  nextActionLabel: string | null;
  nextActionUrl: string | null;
}

export interface Entitlements {
  planName: string;
  startDate: string;
  endDate: string;
  daysLeft: number;
}

export interface OnboardingData {
  readyToTrain: boolean;
  currentStep: string;
  steps: OnboardingStep[];
  entitlements: Entitlements | null;
}

export interface TourProgress {
  tourKey: string;
  step: number;
  status: 'PAUSED' | 'DONE' | 'SKIPPED';
  updatedAt: string;
}
