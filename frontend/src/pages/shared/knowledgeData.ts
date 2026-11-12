import type { MuscleGroup } from '../../api/types';
import type { MuscleKey } from '../../lib/anatomy';

export interface MuscleDetailData {
  key: MuscleKey;
  nameVi: string;
  nameEn: string;
  group: MuscleGroup;
  view: 'front' | 'back' | 'both';
  locationAndFunction: string;
  primaryAndSecondary: string;
  commonEquipment: string[];
  keyExercises: string[];
  proTip: string;
}

export const ANATOMY_DETAILS: Record<MuscleKey, MuscleDetailData> = {
  chest: {
    key: 'chest',
    nameVi: 'Cơ ngực (Ngực lớn & ngực bé)',
    nameEn: 'Pectoralis Major & Minor',
    group: 'CHEST',
    view: 'front',
    locationAndFunction: 'Nằm ở thành trước lồng ngực. Có chức năng khép ngang cánh tay (adduction), đẩy cánh tay ra trước và xoay trong xương cánh tay.',
    primaryAndSecondary: 'Cơ chính khi đẩy ngực; cơ phụ liên đới gồm Vai trước (Front Delts) và Tay sau (Triceps).',
    commonEquipment: ['Thanh đòn (Barbell)', 'Tạ đơn (Dumbbell)', 'Máy ép ngực (Chest Press)', 'Máy kéo cáp (Cable Fly)'],
    keyExercises: ['Barbell Bench Press', 'Incline Dumbbell Press', 'Push-ups', 'Cable Crossover'],
    proTip: 'Hạ vai và ép chặt hai bả vai vào đệm khi đẩy để tối ưu kích hoạt cơ ngực và bảo vệ ổ khớp vai.',
  },
  'front-deltoids': {
    key: 'front-deltoids',
    nameVi: 'Cơ vai trước',
    nameEn: 'Anterior Deltoid',
    group: 'SHOULDERS',
    view: 'front',
    locationAndFunction: 'Nằm ở phần trước khớp vai. Chức năng đưa cánh tay ra trước và nâng qua đầu (flexion).',
    primaryAndSecondary: 'Cơ chính khi đẩy vai qua đầu; hỗ trợ đắc lực trong mọi bài đẩy ngực.',
    commonEquipment: ['Tạ đơn', 'Thanh đòn', 'Máy đẩy vai (Shoulder Press)'],
    keyExercises: ['Overhead Press', 'Dumbbell Shoulder Press', 'Front Raise'],
    proTip: 'Vai trước đã hoạt động rất nhiều trong các bài đẩy ngực, không nên tập quá nhiều bài cô lập tránh mất cân đối khớp vai.',
  },
  'back-deltoids': {
    key: 'back-deltoids',
    nameVi: 'Cơ vai sau',
    nameEn: 'Posterior Deltoid',
    group: 'SHOULDERS',
    view: 'back',
    locationAndFunction: 'Nằm ở mặt sau khớp vai. Chức năng kéo cánh tay ra sau theo mặt phẳng ngang và xoay ngoài khớp vai.',
    primaryAndSecondary: 'Cơ chính khi bay vai sau; cơ phụ hỗ trợ gồm Lưng trên, Cơ quả trám và Cơ thang.',
    commonEquipment: ['Máy kéo cáp', 'Tạ đơn', 'Dây kháng lực', 'Máy Pec Deck ngược'],
    keyExercises: ['Face Pull', 'Rear Delt Fly', 'Band Pull-apart'],
    proTip: 'Nên tập Face Pull đều đặn để kéo vai về tư thế chuẩn, khắc phục tật gù lưng và bo tròn vai.',
  },
  biceps: {
    key: 'biceps',
    nameVi: 'Cơ tay trước (Nhị đầu)',
    nameEn: 'Biceps Brachii',
    group: 'ARMS',
    view: 'front',
    locationAndFunction: 'Nằm ở mặt trước cánh tay gồm đầu dài và đầu ngắn. Chức năng gập khuỷu tay và ngửa cẳng tay (supination).',
    primaryAndSecondary: 'Cơ chính khi cuốn tạ; cơ phụ hỗ trợ trong mọi chuyển động kéo xô và hít xà.',
    commonEquipment: ['Tạ đơn', 'Đòn tạ EZ', 'Máy kéo cáp', 'Ghế dốc Preacher'],
    keyExercises: ['Dumbbell Bicep Curl', 'Hammer Curl', 'Preacher Curl', 'Chin-ups'],
    proTip: 'Khóa chặt khuỷu tay sát sườn, không đung đưa thân người để dồn toàn bộ lực căng vào cơ tay trước.',
  },
  triceps: {
    key: 'triceps',
    nameVi: 'Cơ tay sau (Tam đầu)',
    nameEn: 'Triceps Brachii',
    group: 'ARMS',
    view: 'both',
    locationAndFunction: 'Chiếm 60% thể tích cánh tay với 3 đầu cơ (đầu dài, đầu ngoài, đầu trong). Chức năng duỗi thẳng khớp khuỷu tay.',
    primaryAndSecondary: 'Cơ chính khi ép tay sau và chống xà kép; cơ phụ hỗ trợ khóa khớp trong bài đẩy ngực và vai.',
    commonEquipment: ['Máy cáp ròng rọc', 'Tạ đơn', 'Xà kép (Dip bars)', 'Ghế tập'],
    keyExercises: ['Triceps Pushdown', 'Skull Crusher', 'Dips', 'Overhead Extension'],
    proTip: 'Bài tập duỗi tay qua đầu (Overhead) kích hoạt tối đa đầu dài (Long head) – phần lớn nhất của cơ tay sau.',
  },
  forearm: {
    key: 'forearm',
    nameVi: 'Cơ cẳng tay',
    nameEn: 'Forearms',
    group: 'ARMS',
    view: 'both',
    locationAndFunction: 'Nằm từ khuỷu tay đến cổ tay. Chức năng gập, duỗi cổ tay và tạo lực bóp nắm ngón tay (Grip strength).',
    primaryAndSecondary: 'Cơ giữ ổn định trong các bài kéo nặng như Deadlift, Shrug, Hít xà.',
    commonEquipment: ['Thanh đòn', 'Bánh tạ (Weight Plates)', 'Kìm bóp tay', 'Tạ đơn'],
    keyExercises: ['Wrist Curl', 'Farmer Walk', 'Dead Hang', 'Plate Pinch'],
    proTip: 'Tập bài xách tạ đi bộ (Farmer Walk) giúp phát triển sức nắm cực nhanh và tăng độ săn chắc cho cẳng tay.',
  },
  abs: {
    key: 'abs',
    nameVi: 'Cơ bụng thẳng (Sáu múi)',
    nameEn: 'Rectus Abdominis',
    group: 'CORE',
    view: 'front',
    locationAndFunction: 'Chạy dọc từ xương ức xuống khớp mu. Chức năng gập cong cột sống, bảo vệ nội tạng và giữ áp lực ổ bụng.',
    primaryAndSecondary: 'Cơ lõi trung tâm; phối hợp nhịp nhàng cùng cơ liên sườn và cơ dựng sống lưng.',
    commonEquipment: ['Thảm tập', 'Con lăn Ab-Wheel', 'Xà đơn', 'Bóng tập'],
    keyExercises: ['Plank', 'Crunches', 'Hanging Leg Raise', 'Ab-Wheel Rollout'],
    proTip: 'Thở hết không khí ra khi cuộn bụng để cơ bụng co thắt tối đa biên độ chuyển động.',
  },
  obliques: {
    key: 'obliques',
    nameVi: 'Cơ liên sườn (Bụng chéo)',
    nameEn: 'Internal & External Obliques',
    group: 'CORE',
    view: 'front',
    locationAndFunction: 'Nằm ở hai bên mạn sườn. Chức năng xoay thân trên, nghiêng thân sang hai bên và chống xoay bảo vệ cột sống.',
    primaryAndSecondary: 'Phối hợp với cơ bụng thẳng và cơ lưng dưới tạo đai bảo vệ cột sống.',
    commonEquipment: ['Máy kéo cáp', 'Tạ đơn', 'Bóng tạ Medicine Ball'],
    keyExercises: ['Russian Twist', 'Side Plank', 'Cable Woodchopper', 'Pallof Press'],
    proTip: 'Ưu tiên các bài chống xoay (Anti-rotation) như Pallof Press hơn là các bài vặn xoay thân quá đà.',
  },
  trapezius: {
    key: 'trapezius',
    nameVi: 'Cơ hình thang (Cầu vai)',
    nameEn: 'Trapezius (Upper, Mid, Lower)',
    group: 'BACK',
    view: 'back',
    locationAndFunction: 'Trải dài từ đáy hộp sọ xuống giữa lưng. Nâng, hạ, xoay và khép xương bả vai.',
    primaryAndSecondary: 'Cơ chính khi nhún vai; hỗ trợ giữ vững bả vai trong Deadlift và Squat.',
    commonEquipment: ['Tạ đòn', 'Tạ đơn', 'Máy Smith', 'Máy kéo cáp'],
    keyExercises: ['Barbell Shrug', 'Dumbbell Shrug', 'Rack Pull', 'Face Pull'],
    proTip: 'Khi nhún vai, giữ thẳng cổ và nâng vai theo phương thẳng đứng, tránh xoay tròn vai gây mòn sụn khớp.',
  },
  'upper-back': {
    key: 'upper-back',
    nameVi: 'Cơ lưng trên & Xô',
    nameEn: 'Latissimus Dorsi & Rhomboids',
    group: 'BACK',
    view: 'back',
    locationAndFunction: 'Tạo nên hình chữ V của lưng. Chức năng kéo cánh tay từ trên xuống và từ trước ra sau.',
    primaryAndSecondary: 'Cơ chính trong chuyển động kéo; cơ phụ gồm Tay trước, Vai sau và Cẳng tay.',
    commonEquipment: ['Xà đơn', 'Máy kéo xô (Lat Pulldown)', 'Máy chèo thuyền (Cable Row)', 'Thanh đòn'],
    keyExercises: ['Pull-ups', 'Lat Pulldown', 'Barbell Bent-over Row', 'Seated Cable Row'],
    proTip: 'Tưởng tượng dùng cùi chỏ kéo tạ về phía hông thay vì dùng bàn tay kéo để cô lập cơ xô tốt nhất.',
  },
  'lower-back': {
    key: 'lower-back',
    nameVi: 'Cơ lưng dưới (Dựng sống)',
    nameEn: 'Erector Spinae',
    group: 'BACK',
    view: 'back',
    locationAndFunction: 'Dọc hai bên cột sống thắt lưng. Chức năng duỗi cột sống và giữ tư thế thẳng đứng cho cơ thể.',
    primaryAndSecondary: 'Cơ ổn định cốt lõi trong Deadlift, Squat và nâng vật nặng.',
    commonEquipment: ['Ghế dốc 45 độ (Hyperextension)', 'Thanh đòn', 'Thảm tập'],
    keyExercises: ['Back Extension', 'Deadlift', 'Good Morning', 'Bird Dog'],
    proTip: 'Luôn gồng chặt cơ bụng để khóa cứng khung xương chậu, tuyệt đối không ưỡn lưng quá mức (hyperextension).',
  },
  gluteal: {
    key: 'gluteal',
    nameVi: 'Cơ mông (Lớn, nhỡ, bé)',
    nameEn: 'Gluteus Maximus, Medius, Minimus',
    group: 'LEGS',
    view: 'back',
    locationAndFunction: 'Nhóm cơ đơn lẻ lớn nhất và phát lực mạnh nhất cơ thể. Chức năng duỗi hông, dạng hông và xoay ngoài đùi.',
    primaryAndSecondary: 'Cơ phát lực chính khi đứng dậy, chạy nước rút; phối hợp cùng Đùi sau và Đùi trước.',
    commonEquipment: ['Thanh đòn', 'Dây kháng lực Hip Band', 'Máy đẩy mông (Hip Thrust Machine)', 'Tạ ấm'],
    keyExercises: ['Barbell Hip Thrust', 'Romanian Deadlift', 'Bulgarian Split Squat', 'Glute Bridge'],
    proTip: 'Ở điểm cao nhất của bài Hip Thrust, siết chặt mông trong 1-2 giây và giữ cằm hướng nhẹ về ngực.',
  },
  quadriceps: {
    key: 'quadriceps',
    nameVi: 'Cơ đùi trước (Tứ đầu đùi)',
    nameEn: 'Quadriceps Femoris',
    group: 'LEGS',
    view: 'front',
    locationAndFunction: 'Bao gồm 4 đầu cơ ở mặt trước đùi. Chức năng duỗi thẳng khớp gối và hỗ trợ gập khớp hông.',
    primaryAndSecondary: 'Cơ chính khi đẩy chân, đứng lên; phối hợp cùng Cơ mông và Bắp chân.',
    commonEquipment: ['Máy đạp đùi (Leg Press)', 'Máy đá đùi (Leg Extension)', 'Thanh đòn (Squat rack)', 'Tạ đơn'],
    keyExercises: ['Barbell Back Squat', 'Leg Press', 'Goblet Squat', 'Leg Extension'],
    proTip: 'Đảm bảo đầu gối di chuyển cùng hướng với mũi chân trong suốt chuyển động gập gối để tránh vặn sụn chêm.',
  },
  hamstring: {
    key: 'hamstring',
    nameVi: 'Cơ đùi sau',
    nameEn: 'Hamstrings',
    group: 'LEGS',
    view: 'back',
    locationAndFunction: 'Gồm 3 cơ ở mặt sau đùi (nhị đầu đùi, bán gân, bán màng). Chức năng gập khớp gối và duỗi khớp hông.',
    primaryAndSecondary: 'Cơ chính khi gập chân và gập hông; phối hợp chặt chẽ cùng Cơ mông.',
    commonEquipment: ['Máy cuốn đùi nằm/ngồi (Leg Curl)', 'Thanh đòn', 'Tạ đơn'],
    keyExercises: ['Romanian Deadlift (RDL)', 'Lying Leg Curl', 'Seated Leg Curl', 'Nordic Curl'],
    proTip: 'Trong bài RDL, đẩy mông ra sau tối đa và giữ gối hơi chùng nhẹ, cảm nhận đùi sau căng dãn hoàn toàn.',
  },
  adductor: {
    key: 'adductor',
    nameVi: 'Cơ khép đùi (Đùi trong)',
    nameEn: 'Adductor Magnus & Longus',
    group: 'LEGS',
    view: 'back',
    locationAndFunction: 'Nằm ở mặt trong đùi. Chức năng khép đùi về phía trục giữa cơ thể và ổn định khớp háng.',
    primaryAndSecondary: 'Hỗ trợ đắc lực trong các bài Squat chân rộng (Sumo) và động tác đổi hướng.',
    commonEquipment: ['Máy ép đùi trong (Adductor Machine)', 'Dây kháng lực', 'Tạ ấm'],
    keyExercises: ['Sumo Squat', 'Seated Adductor Machine', 'Copenhagen Plank'],
    proTip: 'Cơ đùi trong khỏe giúp cân bằng khớp gối và phòng tránh chấn thương dây chằng chéo trước (ACL).',
  },
  abductors: {
    key: 'abductors',
    nameVi: 'Cơ dạng hông (Hông ngoài)',
    nameEn: 'Hip Abductors (TFL & Glute Medius)',
    group: 'LEGS',
    view: 'front',
    locationAndFunction: 'Nằm ở mặt ngoài khớp hông. Chức năng mở rộng chân sang hai bên và giữ thăng bằng khung chậu khi đi lại.',
    primaryAndSecondary: 'Giữ xương đùi không bị sụp vào trong khi Squat và tiếp đất.',
    commonEquipment: ['Máy mở đùi (Abductor Machine)', 'Dây thun kháng lực Mini Band', 'Cáp ròng rọc'],
    keyExercises: ['Seated Hip Abduction', 'Lateral Band Walk', 'Cable Hip Abduction'],
    proTip: 'Đeo dây thun quanh gối khi khởi động Squat giúp kích hoạt cơ mông nhỡ và ngăn ngừa gối chụm vào trong.',
  },
  calves: {
    key: 'calves',
    nameVi: 'Cơ bắp chân (Bụng chân & cơ dép)',
    nameEn: 'Gastrocnemius & Soleus',
    group: 'LEGS',
    view: 'both',
    locationAndFunction: 'Mặt sau cẳng chân. Chức năng duỗi cổ chân (nhón gót) và hỗ trợ gập nhẹ khớp gối.',
    primaryAndSecondary: 'Hấp thụ xung lực khi chạy nhảy; cơ chính khi nâng đỡ toàn bộ trọng lượng cơ thể bằng mũi chân.',
    commonEquipment: ['Máy nhón bắp chân đứng/ngồi', 'Bậc tam cấp', 'Tạ đơn'],
    keyExercises: ['Standing Calf Raise', 'Seated Calf Raise', 'Donkey Calf Raise'],
    proTip: 'Nhón chân đứng tác động cơ bụng chân (Gastrocnemius); nhón chân ngồi gập gối tác động cơ dép (Soleus).',
  },
  neck: {
    key: 'neck',
    nameVi: 'Cơ cổ & gáy',
    nameEn: 'Cervical Spine Muscles',
    group: 'SHOULDERS',
    view: 'front',
    locationAndFunction: 'Bao quanh các đốt sống cổ. Nâng đỡ đầu, xoay, gập và nghiêng đầu linh hoạt.',
    primaryAndSecondary: 'Ổn định cột sống cổ, chống rung lắc chấn thương não trong thể thao va chạm.',
    commonEquipment: ['Dây đai cổ tập tạ (Neck Harness)', 'Khăn mềm / Thảm'],
    keyExercises: ['Neck Flexion', 'Neck Extension', 'Neck Isometric Holds'],
    proTip: 'Khởi động xoay cổ nhẹ nhàng trước khi tập tạ nặng, luôn giữ cổ ở vị trí trung tính (neutral spine).',
  },
};

// -------------------------------------------------------------
// F. HƯỚNG DẪN TẬP LUYỆN: 8 CHỦ ĐỀ CHUẨN KHOA HỌC FITNESS
// -------------------------------------------------------------
export interface TrainingGuide {
  id: string;
  title: string;
  category: string;
  readTime: string;
  icon: string;
  summary: string;
  principles: string[];
  stepByStep: string[];
  mistakesAndFixes: { mistake: string; fix: string }[];
  safetyTips: string[];
  dos: string[];
  donts: string[];
}

export const TRAINING_GUIDES: TrainingGuide[] = [
  {
    id: 'form-and-technique',
    title: 'Kỹ thuật tập đúng & Tối ưu chuyển động',
    category: 'Kỹ thuật',
    readTime: '5 phút đọc',
    icon: 'activity',
    summary: 'Nền tảng của mọi bài tập là quỹ đạo chuyển động chuẩn, kiểm soát cơ bắp có ý thức và tránh dùng đà quán tính.',
    principles: [
      'Mind-Muscle Connection: Tập trung cảm nhận nhóm cơ mục tiêu đang co bóp và dãn ra.',
      'Kiểm soát pha âm bản (Eccentric): Hạ tạ chậm rãi trong 2-3 giây để kích thích sợi cơ tối đa.',
      'Biên độ chuyển động đầy đủ (Full Range of Motion): Chuyển động hết biên độ tự nhiên của khớp.',
      'Không khóa khớp gắt (No Hard Lockout): Giữ khớp gối hoặc khuỷu tay hơi chùng nhẹ ở đỉnh chuyển động.',
    ],
    stepByStep: [
      '1. Setup tư thế chuẩn: Đứng hoặc ngồi vững chãi, gồng chặt cơ lõi và hạ vai.',
      '2. Bắt đầu chuyển động với tốc độ có kiểm soát, dồn lực từ nhóm cơ chính.',
      '3. Giữ điểm co đỉnh (Peak Contraction) 1 giây để tăng thời gian chịu áp lực cơ.',
      '4. Hạ tạ từ từ về vị trí ban đầu theo đúng quỹ đạo đi lên.',
    ],
    mistakesAndFixes: [
      { mistake: 'Dùng đà quán tính giật người khi tạ quá nặng.', fix: 'Giảm 20% mức tạ và thực hiện chuyển động chậm rãi, chuẩn form.' },
      { mistake: 'Cắt ngắn biên độ chuyển động để nâng được nặng hơn.', fix: 'Tập đủ biên độ, chạm đáy an toàn trước khi đẩy lên.' },
    ],
    safetyTips: [
      'Không bao giờ hy sinh kỹ thuật chuẩn để chạy theo mức tạ nặng hơn năng lực.',
      'Nếu mất kiểm soát form ở những rep cuối, hãy dừng hiệp tập ngay.',
    ],
    dos: ['Khởi động làm nóng khớp trước khi vào bài nặng', 'Gồng chặt cơ bụng để khóa cứng sống lưng'],
    donts: ['Không cong lưng dưới khi nâng tạ khỏi sàn', 'Không lắc đầu hoặc nhìn sang hai bên khi đang nâng'],
  },
  {
    id: 'breathing-mastery',
    title: 'Nguyên tắc hít thở chuẩn khoa học trong Gym',
    category: 'Hơi thở',
    readTime: '4 phút đọc',
    icon: 'heart',
    summary: 'Hít thở đúng cách cung cấp oxy cho cơ bắp, ổn định huyết áp và tạo áp lực ổ bụng bảo vệ cột sống thắt lưng.',
    principles: [
      'Nguyên tắc vàng: HÍT VÀO khi dãn cơ (hạ tạ) – THỞ RA khi phát lực co cơ (đẩy/kéo tạ).',
      'Nghiệm pháp Valsalva: Hít sâu 80% dung tích phổi vào bụng và nén chặt trong các bài nâng nặng (Squat/Deadlift).',
      'Tuyệt đối không nín thở thụ động gây chóng mặt hoặc tăng vọt áp lực nội sọ.',
    ],
    stepByStep: [
      '1. Trước khi bắt đầu lần nâng: Hít sâu bằng mũi hoặc miệng phồng căng cơ bụng.',
      '2. Trong lúc hạ tạ (pha eccentric): Giữ hơi thở ổn định để bảo vệ cột sống.',
      '3. Khi vượt qua điểm khó nhất (Sticking Point): Thở mạnh ra từ từ bằng miệng.',
      '4. Lặp lại chu trình cho từng lần lặp một cách nhịp nhàng.',
    ],
    mistakesAndFixes: [
      { mistake: 'Nín thở suốt cả hiệp tập khiến mặt đỏ bừng và choáng váng.', fix: 'Tập thở có nhịp điệu: thở ra thành tiếng "xì" nhỏ khi phát lực.' },
      { mistake: 'Thở nông bằng ngực thay vì thở sâu bằng cơ hoành vào bụng.', fix: 'Đặt tay lên rốn, tập hít vào sao cho bàn tay bị đẩy ra ngoài.' },
    ],
    safetyTips: [
      'Người có tiền sử huyết áp cao không nên lạm dụng nghiệm pháp nén hơi Valsalva.',
      'Nếu cảm thấy hoa mắt chóng mặt, hãy ngồi xuống ghế nghỉ ngay lập tức.',
    ],
    dos: ['Hít thở đều đặn và có chủ đích', 'Thở ra mạnh khi đẩy tạ lên cao'],
    donts: ['Không nín thở ở các bài tập nhẹ hoặc cardio', 'Không thở gấp gáp mất kiểm soát'],
  },
  {
    id: 'machine-usage-guide',
    title: 'Cách sử dụng thiết bị & máy tập phòng Gym',
    category: 'Thiết bị',
    readTime: '6 phút đọc',
    icon: 'zap',
    summary: 'Máy tập khối tạ có quỹ đạo cố định rất an toàn cho người mới, nhưng cần chỉnh đúng khớp xoay để đạt hiệu quả cao.',
    principles: [
      'Căn chỉnh trục xoay (Axis of Rotation): Trục xoay của máy phải thẳng hàng với khớp chuyển động trên cơ thể bạn.',
      'Kiểm tra chốt an toàn: Luôn đảm bảo chốt cắm tạ và chốt chỉnh độ cao đã vào đúng rãnh và khớp chắc chắn.',
      'Tập không để tạ va đập: Kiểm soát tạ ở điểm cuối sao cho đĩa tạ không va mạnh vào nhau phát ra tiếng ồn.',
    ],
    stepByStep: [
      '1. Quan sát hình minh họa dán trên thân máy để nắm cơ mục tiêu và cách ngồi.',
      '2. Điều chỉnh đệm ngồi hoặc đệm tựa lưng sao cho tầm tay/chân ở vị trí thoải mái.',
      '3. Cắm chốt mức tạ thử nghiệm nhẹ (10-15kg) để kiểm tra biên độ trước.',
      '4. Thực hiện chuyển động mượt mà, lau sạch mồ hôi trên ghế sau khi dùng.',
    ],
    mistakesAndFixes: [
      { mistake: 'Ngồi quá cao hoặc quá thấp so với tay cầm của máy.', fix: 'Điều chỉnh ghế sao cho tay cầm ngang bằng tầm ngực giữa (bài đẩy ngực) hoặc ngang vai.' },
      { mistake: 'Cắm chốt tạ lơ lửng chưa ngập sâu vào thanh ray.', fix: 'Đẩy chốt vào hết nấc từ tính hoặc lẫy gạt an toàn.' },
    ],
    safetyTips: [
      'Luôn giữ tay chân tránh xa các rãnh trượt bánh răng và dây cáp ròng rọc.',
      'Không buông tay đột ngột khi tạ đang ở trên cao.',
    ],
    dos: ['Chỉnh máy vừa vặn cơ thể trước khi tập', 'Lau sạch máy sau khi tập xong'],
    donts: ['Không thả tạ rơi tự do kêu rầm rập', 'Không đứng lên máy khi dây cáp đang căng'],
  },
  {
    id: 'weight-selection-rir',
    title: 'Cách chọn mức tạ phù hợp & Quy tắc RIR',
    category: 'Mức tạ',
    readTime: '5 phút đọc',
    icon: 'scale',
    summary: 'Chọn mức tạ khoa học theo quy tắc RIR (Reps in Reserve) giúp kích thích cơ bắp tối đa mà không gây kiệt sức thần kinh.',
    principles: [
      'Khái niệm RIR (Reps in Reserve): Số lần bạn còn có thể nâng thêm trước khi chạm ngưỡng thất bại hoàn toàn.',
      'Vùng vàng phát triển cơ bắp: RIR 1 - 2 (dừng hiệp khi còn có thể nâng được 1 đến 2 lần nữa với form chuẩn).',
      'Tăng tiến tải trọng (Progressive Overload): Khi đạt được số lần lặp mục tiêu ở hiệp cuối, tăng 2.5% - 5% mức tạ ở buổi sau.',
    ],
    stepByStep: [
      '1. Hiệp khởi động: Nâng với thanh đòn không tạ hoặc 40% sức để làm nóng khớp.',
      '2. Hiệp chuẩn bị: Nâng 60-70% mức tạ mục tiêu trong 3-5 lần lặp.',
      '3. Vào hiệp chính: Chọn mức tạ khiến bạn đạt ngưỡng RIR 1-2 ở số rep đã định.',
      '4. Ghi chép nhật ký tập luyện vào GymFlow để theo dõi tiến độ qua từng tuần.',
    ],
    mistakesAndFixes: [
      { mistake: 'Tập quá nhẹ, hiệp nào cũng còn thừa 5-6 rep mà đã dừng.', fix: 'Tăng dần mức tạ cho đến khi 2 rep cuối cảm thấy nặng và phải nỗ lực thực sự.' },
      { mistake: 'Tập thất bại (RIR 0) ở tất cả các hiệp khiến cơ bắp kiệt quệ sớm.', fix: 'Chỉ nên chạm ngưỡng RIR 0 ở hiệp cuối cùng của bài tập cô lập.' },
    ],
    safetyTips: [
      'Khi tập mức tạ nặng từ 85% 1RM trở lên, luôn nhờ bạn tập hoặc HLV đỡ tạ (Spotter).',
      'Cài chốt chặn an toàn (Safety bars) của khung gánh tạ đúng tầm.',
    ],
    dos: ['Khởi động từ mức tạ nhẹ', 'Ghi chép số cân nâng được mỗi buổi'],
    donts: ['Không nâng mức tạ vượt quá khả năng giữ form chuẩn', 'Không bỏ qua hiệp khởi động'],
  },
  {
    id: 'sets-reps-formula',
    title: 'Thiết lập số hiệp & số lần lặp (Sets & Reps)',
    category: 'Giáo án',
    readTime: '5 phút đọc',
    icon: 'repeat',
    summary: 'Cấu trúc số hiệp và lần lặp tương ứng với mục tiêu tập luyện: Tăng sức mạnh, Tăng cơ bắp hay Tăng sức bền.',
    principles: [
      'Tăng sức mạnh tối đa (Strength): 3 - 5 hiệp x 3 - 6 lần lặp (Mức tạ nặng 80-90% 1RM, nghỉ 2-3 phút).',
      'Phát triển cơ bắp (Hypertrophy): 3 - 4 hiệp x 8 - 12 lần lặp (Mức tạ 65-75% 1RM, nghỉ 60-90 giây).',
      'Sức bền cơ bắp & Đốt mỡ (Endurance): 2 - 3 hiệp x 15 - 20 lần lặp (Mức tạ nhẹ 50-60% 1RM, nghỉ 30-45 giây).',
    ],
    stepByStep: [
      '1. Xác định mục tiêu của giai đoạn: Tăng cơ, Tăng sức mạnh hay Giảm mỡ săn chắc.',
      '2. Xếp các bài đa khớp (Compound) vào đầu buổi với mức tạ nặng và 6-8 reps.',
      '3. Xếp các bài cô lập (Isolation) vào giữa và cuối buổi với 10-15 reps.',
      '4. Tổng số hiệp cho một nhóm cơ trong một buổi nên từ 10 đến 18 hiệp hiệu quả.',
    ],
    mistakesAndFixes: [
      { mistake: 'Tập quá nhiều hiệp vô bổ (Junk Volume) trên 25 hiệp một buổi.', fix: 'Tập trung vào 3-4 bài chất lượng cao, mỗi bài 3 hiệp chuẩn chỉ.' },
      { mistake: 'Chỉ tập mãi một mức cân và số rep cố định quanh năm.', fix: 'Áp dụng chu kỳ hóa tập luyện (Periodization) sau mỗi 8-12 tuần.' },
    ],
    safetyTips: [
      'Lắng nghe cơ thể: Nếu cảm thấy mỏi khớp thay vì mỏi cơ, hãy giảm bớt hiệp tập.',
    ],
    dos: ['Bắt đầu bài nặng khi thể lực còn sung mãn', 'Đếm rep chính xác không ăn bớt'],
    donts: ['Không tập quá nhiều bài trùng chuyển động trong cùng một buổi'],
  },
  {
    id: 'rest-intervals',
    title: 'Thời gian nghỉ giữa các hiệp chuẩn khoa học',
    category: 'Nghỉ ngơi',
    readTime: '4 phút đọc',
    icon: 'clock',
    summary: 'Thời gian nghỉ phù hợp giúp hệ năng lượng ATP-CP tái tạo, đảm bảo duy trì lực phát cho các hiệp tiếp theo.',
    principles: [
      'Bài phức hợp nặng (Squat, Deadlift, Bench Press): Nghỉ 2 đến 3 phút để hệ thần kinh trung ương và ATP hồi phục.',
      'Bài cô lập cơ nhỏ (Biceps Curl, Lateral Raise, Triceps): Nghỉ 60 đến 90 giây.',
      'Bài tập Cardio cường độ cao / HIIT: Nghỉ ngắn từ 15 đến 30 giây giữa các đợt bùng nổ.',
    ],
    stepByStep: [
      '1. Kết thúc hiệp tập: Đặt tạ an toàn xuống giá đỡ.',
      '2. Bắt đầu bấm đồng hồ đếm ngược trên GymFlow hoặc điện thoại.',
      '3. Đi lại nhẹ nhàng, hít thở sâu bằng bụng để hạ nhịp tim, nhấp từng ngụm nước nhỏ.',
      '4. Khi chuông báo còn 10 giây: Chuẩn bị vào vị trí và bắt đầu hiệp kế tiếp.',
    ],
    mistakesAndFixes: [
      { mistake: 'Lướt mạng xã hội quên thời gian khiến nghỉ quá lâu làm nguội cơ.', fix: 'Cài đặt đồng hồ bấm giờ đếm ngược tự động báo rung.' },
      { mistake: 'Nghỉ quá ngắn khi vừa squat nặng khiến tim đập dồn dập, mất form.', fix: 'Đợi nhịp tim về mức ổn định và hơi thở đều đặn trước khi nâng tiếp.' },
    ],
    safetyTips: [
      'Không ngồi bệt xuống sàn ngay sau khi vừa kết thúc hiệp Deadlift hoặc Squat nặng.',
    ],
    dos: ['Đi lại nhẹ nhàng trong lúc nghỉ', 'Bấm giờ nghỉ chính xác'],
    donts: ['Không ngồi gù lưng xem điện thoại quá 5 phút giữa hiệp'],
  },
  {
    id: 'common-mistakes-prevention',
    title: 'Những lỗi thường gặp & Cách khắc phục chấn thương',
    category: 'An toàn',
    readTime: '6 phút đọc',
    icon: 'alert',
    summary: 'Phòng ngừa chấn thương luôn tốt hơn chữa trị. Nhận biết và sửa ngay 6 lỗi sai phổ biến nhất của người tập gym.',
    principles: [
      'Lỗi #1 - Bỏ qua khởi động: Làm tăng nguy cơ rách cơ và bong gân ổ khớp.',
      'Lỗi #2 - Cong lưng dưới (Butt Wink / Lumbar Rounding) khi nâng nặng: Gây thoát vị đĩa đệm.',
      'Lỗi #3 - Khớp gối chụm vào trong (Knee Valgus) khi Squat: Gây tổn thương sụn chêm và dây chằng.',
      'Lỗi #4 - Nâng vai rụt cổ khi tập ngực và vai: Gây chèn ép gân cơ trên gai (Impingement).',
    ],
    stepByStep: [
      '1. Luôn dành 5-8 phút khởi động động học (Dynamic Warmup) trước buổi tập.',
      '2. Tự quay video bản thân tập luyện từ góc nghiêng để tự kiểm tra tư thế cột sống.',
      '3. Dừng lại ngay lập tức nếu xuất hiện cơn đau nhói bất thường ở khớp (khác với cảm giác mỏi cơ).',
      '4. Chườm lạnh và nghỉ ngơi nếu có dấu hiệu viêm gân hoặc căng cơ quá mức.',
    ],
    mistakesAndFixes: [
      { mistake: 'Nhầm lẫn giữa đau mỏi cơ tự nhiên (DOMS) và đau chấn thương khớp.', fix: 'DOMS chỉ mỏi cơ sau 24-48h; đau nhói khớp trong khi tập là dấu hiệu chấn thương cần dừng ngay.' },
      { mistake: 'Cố tập tiếp khi đang bị chấn thương nhẹ khiến vết thương trở nặng.', fix: 'Thay thế bằng bài tập khác không tác động lên vùng bị đau và tham khảo ý kiến y tế.' },
    ],
    safetyTips: [
      'Khớp không có cơ bắp để chịu tải – chỉ cơ bắp mới là nơi chịu lực nâng.',
      'Luôn lắng nghe tín hiệu đau của cơ thể.',
    ],
    dos: ['Hạ vai siết bả vai trong mọi bài đẩy', 'Tập bài bổ trợ cho nhóm cơ yếu'],
    donts: ['Không bao giờ bỏ qua khởi động', 'Không tập khi khớp đang viêm sưng'],
  },
  {
    id: 'cooldown-and-recovery',
    title: 'Giãn cơ & Phục hồi toàn diện sau buổi tập',
    category: 'Phục hồi',
    readTime: '5 phút đọc',
    icon: 'heart',
    summary: 'Cơ bắp chỉ thực sự phát triển trong quá trình phục hồi sau buổi tập nhờ dinh dưỡng, giấc ngủ và giãn cơ đúng cách.',
    principles: [
      'Giãn cơ tĩnh (Static Stretching): Chỉ nên thực hiện SAU khi tập, giữ mỗi tư thế 20-30 giây.',
      'Hạ nhiệt nhịp tim (Cool-down): Đi bộ nhẹ nhàng 3-5 phút để đưa nhịp tim về trạng thái nghỉ.',
      'Dinh dưỡng vàng: Nạp 20-30g Protein cùng Carbohydrate trong vòng 1-2 tiếng sau buổi tập.',
      'Giấc ngủ: Ngủ sâu 7-8 tiếng mỗi đêm là chìa khóa tiết hormone tăng trưởng (GH) phục hồi cơ bắp.',
    ],
    stepByStep: [
      '1. Kết thúc bài tập cuối: Đi bộ thả lỏng trên máy chạy 3 phút ở tốc độ 4 km/h.',
      '2. Thực hiện 4-5 động tác giãn cơ tĩnh cho các nhóm cơ chính vừa tập luyện.',
      '3. Uống bù đủ nước và điện giải đã mất qua đường mồ hôi.',
      '4. Dùng con lăn Foam Roller massage giải phóng mạc cơ (Myofascial Release) vào buổi tối.',
    ],
    mistakesAndFixes: [
      { mistake: 'Tập xong vội vã ra về ngay mà không hạ nhiệt thả lỏng.', fix: 'Dành ra 5 phút cuối buổi để cơ thể chuyển từ trạng thái hưng phấn sang thư giãn.' },
      { mistake: 'Giãn cơ quá mạnh gây rách sợi cơ đang tổn thương.', fix: 'Chỉ kéo giãn đến ngưỡng cảm thấy căng dễ chịu, không kéo đến mức đau rát.' },
    ],
    safetyTips: [
      'Không bao giờ thực hiện giãn cơ tĩnh kéo dài TRƯỚC khi nâng tạ nặng vì làm giảm sức mạnh phát lực tức thời.',
    ],
    dos: ['Giãn cơ nhẹ nhàng sau tập', 'Uống đủ nước và ngủ đủ giấc'],
    donts: ['Không tắm nước quá lạnh ngay khi vừa tập xong đầm đìa mồ hôi'],
  },
  {
    id: 'home-workout-guide',
    title: 'Hướng dẫn tập luyện tại nhà hiệu quả',
    category: 'Tập tại nhà',
    readTime: '6 phút đọc',
    icon: 'home',
    summary: 'Tối ưu hóa thể hình và sức khỏe tại nhà với bài tập trọng lượng cơ thể (Calisthenics), dây kháng lực và không gian tối thiểu.',
    principles: [
      'Nguyên tắc chuyển động cơ bản: Đẩy (Push), Kéo (Pull), Chân (Legs) và Cơ lõi (Core) đều có thể tập hoàn hảo tại nhà.',
      'Tăng tiến độ khó khi không có tạ nặng (Overload via Mechanics): Thay đổi góc độ cơ thể (như hít đất dốc), tăng thời gian chịu áp lực (Tempo chậm) hoặc giảm thời gian nghỉ.',
      'Sử dụng phụ kiện thông minh: Dây mini-band, dây kháng lực dài (Loop band) và xà đơn gắn cửa là đủ cho một phòng tập thu nhỏ.',
    ],
    stepByStep: [
      '1. Chuẩn bị không gian: Dọn sạch khu vực tối thiểu 2x2m, trải thảm tập chống trơn trượt.',
      '2. Khởi động 5 phút: Xoay khớp cổ tay, vai, hông và đầu gối, thực hiện Jumping Jacks nhẹ.',
      '3. Thực hiện theo chuỗi Supersets: Kết hợp 1 bài thân trên (Hít đất) + 1 bài thân dưới (Squat/Lunge) để duy trì nhịp tim.',
      '4. Ghi chép số lần lặp đạt được vào ứng dụng GymFlow để theo dõi tiến độ.',
    ],
    mistakesAndFixes: [
      { mistake: 'Tập quá nhanh dùng quán tính khiến cơ bắp không đủ kích thích.', fix: 'Áp dụng nhịp tempo 3-1-1: 3 giây hạ người, 1 giây giữ đáy, 1 giây đẩy lên.' },
      { mistake: 'Bỏ qua các bài tập kéo (Pull) vì ở nhà không có tạ.', fix: 'Dùng xà đơn gắn cửa để hít xà hoặc neo dây kháng lực vào cửa để kéo xô (Band Row).' },
    ],
    safetyTips: [
      'Kiểm tra độ chắc chắn của xà đơn gắn cửa hoặc điểm neo dây kháng lực trước khi dồn toàn bộ trọng lượng.',
      'Tập chân đất hoặc mang giày thể thao trong nhà, không mang tất/vớ trơn trên sàn gạch.',
    ],
    dos: ['Khởi động kỹ dù tập tại nhà', 'Tận dụng dây kháng lực và bàn ghế chắc chắn'],
    donts: ['Không đứng lên ghế lung lay hoặc đồ nội thất không chịu lực'],
  },
  {
    id: 'gym-workout-etiquette',
    title: 'Hướng dẫn tập luyện tại phòng Gym & Quy tắc an toàn',
    category: 'Tại phòng Gym',
    readTime: '6 phút đọc',
    icon: 'dumbbell',
    summary: 'Quy trình chuẩn mực cho hội viên tại phòng Gym: từ chọn mức tạ, cách setup thiết bị đến văn hóa ứng xử chuyên nghiệp.',
    principles: [
      'An toàn là số 1: Luôn khóa kẹp bánh tạ (Collar clamp) trên thanh đòn và cài thanh chặn an toàn (Safety bar) trong rack.',
      'Nhờ người đỡ tạ (Spotting): Khi bench press hoặc squat nặng gần ngưỡng thất bại, luôn nhờ HLV hoặc bạn tập đỡ tạ.',
      'Văn hóa phòng Gym văn minh: Trả tạ về đúng giá sau khi tập, lau đệm mồ hôi và không chiếm giữ máy tập khi đang ngồi lướt điện thoại.',
    ],
    stepByStep: [
      '1. Bắt đầu buổi tập: Check-in, gửi đồ vào locker và mang theo khăn tập cùng bình nước cá nhân.',
      '2. Khởi động trên máy cardio (đi bộ dốc 3 phút) rồi đến khu tạ tự do.',
      '3. Khi sử dụng máy: Quan sát hình hướng dẫn, chỉnh chiều cao ghế sao cho khớp xoay máy trùng với khớp cơ thể.',
      '4. Giữa các hiệp tập: Đứng dậy đi lại thả lỏng, có thể chia sẻ máy (Work-in) nếu phòng tập đông người.',
      '5. Kết thúc: Tháo hết bánh tạ trả về giá và dùng khăn lau sạch đệm ngồi.',
    ],
    mistakesAndFixes: [
      { mistake: 'Để nguyên bánh tạ nặng trên thanh đòn sau khi tập xong bỏ đi.', fix: 'Tháo toàn bộ tạ và xếp gọn gàng theo đúng số kg trên giá để người tập sau có thể sử dụng.' },
      { mistake: 'Thả rơi tạ đơn tự do từ trên cao xuống sàn gây vỡ tạ và nguy hiểm cho người bên cạnh.', fix: 'Hạ tạ về đùi, dùng cơ đùi đỡ rồi đặt tạ xuống sàn một cách có kiểm soát.' },
    ],
    safetyTips: [
      'Không đứng quá gần phía sau hoặc trong tầm vung tạ của người đang nâng nặng.',
      'Nếu không chắc chắn về cách dùng máy mới, hãy nhờ sự hướng dẫn từ Huấn luyện viên GymFlow trực quầy.',
    ],
    dos: ['Mang khăn tập và lau sạch mồ hôi', 'Cất tạ về đúng vị trí sau khi tập'],
    donts: ['Không ngồi bấm điện thoại chiếm máy quá 5 phút', 'Không thả tạ ầm ĩ xuống sàn'],
  },
];

// -------------------------------------------------------------
// DANH MỤC PHÂN LOẠI CHO CÁC TAB
// -------------------------------------------------------------
export const EXERCISE_SUB_CATEGORIES = [
  { key: 'all', label: 'Tất cả nhóm cơ' },
  { key: 'chest', label: 'Ngực' },
  { key: 'back', label: 'Lưng' },
  { key: 'shoulders', label: 'Vai' },
  { key: 'biceps', label: 'Tay trước' },
  { key: 'triceps', label: 'Tay sau' },
  { key: 'abs', label: 'Bụng' },
  { key: 'legs', label: 'Chân' },
  { key: 'glutes', label: 'Mông' },
  { key: 'full_body', label: 'Toàn thân' },
];

export const WARMUP_SUB_CATEGORIES = [
  { key: 'all', label: 'Tất cả bài khởi động' },
  { key: 'full_body_warmup', label: 'Khởi động toàn thân' },
  { key: 'shoulder_warmup', label: 'Khởi động vai' },
  { key: 'hip_warmup', label: 'Khởi động hông' },
  { key: 'knee_warmup', label: 'Khởi động đầu gối' },
  { key: 'joint_mobility', label: 'Xoay khớp' },
  { key: 'dynamic_stretching', label: 'Dynamic Stretching' },
  { key: 'muscle_activation', label: 'Kích hoạt nhóm cơ' },
];

export const CARDIO_SUB_CATEGORIES = [
  { key: 'all', label: 'Tất cả Cardio' },
  { key: 'running', label: 'Chạy bộ' },
  { key: 'walking', label: 'Đi bộ' },
  { key: 'cycling', label: 'Đạp xe' },
  { key: 'jump_rope', label: 'Nhảy dây' },
  { key: 'rowing', label: 'Máy chèo thuyền' },
  { key: 'elliptical', label: 'Elliptical' },
  { key: 'stair_climber', label: 'Stair Climber' },
  { key: 'hiit', label: 'HIIT' },
];

export const EQUIPMENT_SUB_CATEGORIES = [
  { key: 'all', label: 'Tất cả dụng cụ' },
  { key: 'dumbbell', label: 'Tạ đơn' },
  { key: 'barbell', label: 'Tạ đòn & bánh tạ' },
  { key: 'kettlebell', label: 'Kettlebell (Tạ ấm)' },
  { key: 'cable', label: 'Máy kéo cáp' },
  { key: 'machine-chest', label: 'Máy tập ngực' },
  { key: 'machine-back', label: 'Máy tập lưng' },
  { key: 'machine-shoulder', label: 'Máy tập vai' },
  { key: 'machine-legs', label: 'Máy tập chân' },
  { key: 'treadmill', label: 'Máy chạy bộ' },
  { key: 'bike', label: 'Xe đạp tập' },
  { key: 'band', label: 'Dây kháng lực' },
  { key: 'bench', label: 'Ghế tập' },
  { key: 'other', label: 'Thiết bị hỗ trợ khác' },
];
