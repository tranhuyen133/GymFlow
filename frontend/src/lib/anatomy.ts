/**
 * V13: nhóm cơ chi tiết (19 vùng trên bản đồ cơ thể) và danh mục dụng cụ.
 * Khoá dùng chung với cột exercises.target_muscles / equipment_keys (chuỗi cách nhau bởi dấu phẩy).
 * Mỗi vùng cơ thuộc một nhóm thô MuscleGroup để các bộ lọc cũ vẫn chạy.
 */
import type { MuscleGroup } from '../api/types';

export type MuscleKey =
  | 'chest' | 'front-deltoids' | 'side-deltoids' | 'back-deltoids' | 'biceps' | 'triceps' | 'forearm'
  | 'abs' | 'obliques' | 'trapezius' | 'upper-back' | 'lower-back'
  | 'gluteal' | 'quadriceps' | 'hamstring' | 'adductor' | 'abductors' | 'calves' | 'neck';

export interface MuscleInfo {
  key: MuscleKey; label: string; labelEn: string; group: MuscleGroup;
  /** Mặt nhìn thấy rõ nhất trên bản đồ; 'both' = có ở cả hai mặt. */
  view: 'front' | 'back' | 'both';
  hint: string;
}

export const MUSCLES: MuscleInfo[] = [
  { key: 'chest', label: 'Ngực', labelEn: 'Chest', group: 'CHEST', view: 'front', hint: 'Đẩy ngực, ép ngực, hít đất' },
  { key: 'front-deltoids', label: 'Vai trước', labelEn: 'Front delts', group: 'SHOULDERS', view: 'front', hint: 'Đẩy vai, nâng tạ trước mặt, dang tay' },
  { key: 'side-deltoids', label: 'Vai giữa', labelEn: 'Side delts', group: 'SHOULDERS', view: 'front', hint: 'Dang vai ngang, kéo tạ lên ngực' },
  { key: 'back-deltoids', label: 'Vai sau', labelEn: 'Rear delts', group: 'SHOULDERS', view: 'back', hint: 'Bay vai sau, face pull' },
  { key: 'biceps', label: 'Tay trước', labelEn: 'Biceps', group: 'ARMS', view: 'front', hint: 'Cuốn tạ các kiểu' },
  { key: 'triceps', label: 'Tay sau', labelEn: 'Triceps', group: 'ARMS', view: 'both', hint: 'Ép cáp, duỗi tay qua đầu, chống xà' },
  { key: 'forearm', label: 'Cẳng tay', labelEn: 'Forearms', group: 'ARMS', view: 'both', hint: 'Cuốn cổ tay, xách tạ, sức nắm' },
  { key: 'abs', label: 'Bụng', labelEn: 'Abs', group: 'CORE', view: 'front', hint: 'Gập bụng, plank, nâng chân' },
  { key: 'obliques', label: 'Liên sườn', labelEn: 'Obliques', group: 'CORE', view: 'front', hint: 'Xoay thân, plank nghiêng' },
  { key: 'trapezius', label: 'Cơ thang', labelEn: 'Traps', group: 'BACK', view: 'back', hint: 'Nhún vai, kéo cao' },
  { key: 'upper-back', label: 'Lưng trên & xô', labelEn: 'Upper back & lats', group: 'BACK', view: 'back', hint: 'Hít xà, kéo xô, kéo cáp' },
  { key: 'lower-back', label: 'Lưng dưới', labelEn: 'Lower back', group: 'BACK', view: 'back', hint: 'Deadlift, ưỡn lưng' },
  { key: 'gluteal', label: 'Mông', labelEn: 'Glutes', group: 'LEGS', view: 'back', hint: 'Hip thrust, squat, chùng chân' },
  { key: 'quadriceps', label: 'Đùi trước', labelEn: 'Quads', group: 'LEGS', view: 'front', hint: 'Squat, đạp đùi, đá đùi' },
  { key: 'hamstring', label: 'Đùi sau', labelEn: 'Hamstrings', group: 'LEGS', view: 'back', hint: 'Romanian deadlift, cuốn đùi' },
  { key: 'adductor', label: 'Đùi trong', labelEn: 'Adductors', group: 'LEGS', view: 'back', hint: 'Khép đùi, squat chân rộng' },
  { key: 'abductors', label: 'Hông ngoài', labelEn: 'Abductors', group: 'LEGS', view: 'front', hint: 'Dạng đùi, đi ngang' },
  { key: 'calves', label: 'Bắp chân', labelEn: 'Calves', group: 'LEGS', view: 'both', hint: 'Nhón gót' },
  { key: 'neck', label: 'Cổ', labelEn: 'Neck', group: 'SHOULDERS', view: 'front', hint: 'Giữ cổ tĩnh, giãn cổ' },
];

export const MUSCLE_BY_KEY = new Map(MUSCLES.map((m) => [m.key, m]));
export const isMuscleKey = (k: string): k is MuscleKey => MUSCLE_BY_KEY.has(k as MuscleKey);
export const parseMuscles = (csv: string | null | undefined): MuscleKey[] =>
  (csv ?? '').split(',').map((s) => s.trim()).filter(isMuscleKey);

export type EquipmentKey =
  | 'barbell' | 'dumbbell' | 'kettlebell' | 'machine' | 'cable' | 'bench'
  | 'pullup-bar' | 'bodyweight' | 'band' | 'ball' | 'cardio-machine' | 'other'
  | 'dip-bars' | 'ez-bar' | 'plate' | 'smith-machine' | 'foam-roller';

export interface EquipmentInfo {
  key: EquipmentKey; label: string; labelEn: string; desc: string;
  /** Bài minh hoạ (mã ảnh) dùng làm ảnh bìa thẻ dụng cụ. */
  cover: string;
  tips: string[];
}

export const EQUIPMENT: EquipmentInfo[] = [
  { key: 'barbell', label: 'Thanh đòn & giá', labelEn: 'Barbell & rack', cover: 'Barbell_Squat',
    desc: 'Thanh dài 20 kg (loại tiêu chuẩn) lắp bánh tạ hai đầu, dùng cho các bài đa khớp nặng như squat, deadlift, đẩy ngực.',
    tips: ['Luôn khoá bánh tạ bằng kẹp hai đầu.', 'Tập nặng trong khung có thanh chặn an toàn hoặc có người hỗ trợ.', 'Cầm thanh đối xứng, dùng vạch khía trên thanh để căn tay.'] },
  { key: 'dumbbell', label: 'Tạ đơn', labelEn: 'Dumbbells', cover: 'Dumbbell_Bench_Press',
    desc: 'Tạ cầm một tay, mỗi bên chạy độc lập nên dễ phát hiện bên yếu và có biên độ tự do hơn thanh đòn.',
    tips: ['Nhấc và đặt tạ bằng cách gập gối, không cúi lưng.', 'Kết thúc bài nằm bằng cách đưa tạ về đùi rồi ngồi dậy.', 'Trả tạ về giá đúng mức cân.'] },
  { key: 'kettlebell', label: 'Tạ ấm', labelEn: 'Kettlebell', cover: 'Goblet_Squat',
    desc: 'Tạ hình quả cầu có quai, trọng tâm nằm dưới tay cầm; hợp các bài vung, squat ôm tạ và xách tạ.',
    tips: ['Học kỹ thuật gập hông trước khi tập vung tạ.', 'Giữ cổ tay thẳng khi tạ nằm trên cẳng tay.'] },
  { key: 'ez-bar', label: 'Thanh đòn ziczac EZ', labelEn: 'EZ curl bar', cover: 'EZ-Bar_Curl',
    desc: 'Thanh đòn uốn lượn hình chữ W, giảm áp lực lên cổ tay khi tập tay trước hoặc tay sau.',
    tips: ['Nắm vào đoạn uốn cong phù hợp góc cổ tay.', 'Kẹp khoá tạ cẩn thận hai đầu thanh.'] },
  { key: 'plate', label: 'Bánh tạ', labelEn: 'Weight plates', cover: 'Plate_Pinch',
    desc: 'Bánh tạ tròn ngoài lắp vào đòn còn dùng tập kẹp ngón tay cẳng tay, ôm gập bụng và xoay thân.',
    tips: ['Cầm chắc mép bánh tạ hoặc lỗ tay cầm.', 'Cẩn thận tránh kẹp ngón tay khi xếp tạ vào giá.'] },
  { key: 'machine', label: 'Máy tập', labelEn: 'Machines', cover: 'Leg_Press',
    desc: 'Máy có quỹ đạo cố định và chốt chỉnh mức tạ, dễ kiểm soát, hợp người mới hoặc khi cần tập cô lập một nhóm cơ.',
    tips: ['Chỉnh ghế để khớp đang tập thẳng hàng với trục xoay của máy.', 'Không để khối tạ đập vào nhau giữa các lần.', 'Lau đệm sau khi tập.'] },
  { key: 'smith-machine', label: 'Máy Smith', labelEn: 'Smith machine', cover: 'Smith_Machine_Squat',
    desc: 'Khung thanh đòn trượt cố định trên ray thẳng đứng có móc khoá an toàn ở mọi độ cao.',
    tips: ['Xoay cổ tay để mở và khoá móc tạ.', 'Cài chốt chặn an toàn phụ trước khi tập nặng.'] },
  { key: 'cable', label: 'Máy cáp', labelEn: 'Cable station', cover: 'Seated_Cable_Rows',
    desc: 'Hệ ròng rọc tạo lực căng liên tục, đổi được độ cao và tay cầm (thanh, dây thừng, tay đơn) để tập nhiều góc.',
    tips: ['Kiểm tra chốt mức tạ đã cắm hết vào khối tạ.', 'Đứng vững trước khi kéo, tránh để dây giật người.'] },
  { key: 'bench', label: 'Ghế tập', labelEn: 'Bench', cover: 'Incline_Dumbbell_Press',
    desc: 'Ghế phẳng hoặc chỉnh dốc lên / dốc xuống, dùng cho các bài đẩy, kéo một tay, chống tay sau.',
    tips: ['Kiểm tra chốt chỉnh độ dốc đã khoá.', 'Đặt ghế ổn định, không kê trên vật trơn.'] },
  { key: 'pullup-bar', label: 'Xà đơn', labelEn: 'Pull-up bar', cover: 'Pullups',
    desc: 'Thanh xà treo người để hít xà, treo nâng chân tập bụng bằng trọng lượng cơ thể.',
    tips: ['Kiểm tra xà chắc chắn trước khi treo người.', 'Người mới dùng máy hỗ trợ hoặc dây kháng lực.'] },
  { key: 'dip-bars', label: 'Xà kép', labelEn: 'Dip station', cover: 'Bench_Dips',
    desc: 'Hai thanh xà song song dùng chống đẩy thân người trên cao, phát triển cơ ngực dưới và cơ tay sau.',
    tips: ['Không hạ người quá sâu làm căng giãn khớp vai.', 'Giữ bả vai siết chặt và thân người ổn định.'] },
  { key: 'bodyweight', label: 'Không dụng cụ', labelEn: 'Bodyweight', cover: 'Pushups',
    desc: 'Tập bằng trọng lượng cơ thể, chỉ cần thảm; tập được ở nhà, ngoài trời hoặc khi phòng tập đông.',
    tips: ['Ưu tiên kỹ thuật chuẩn trước khi tăng số lần.', 'Tăng độ khó bằng cách đổi tư thế hoặc làm chậm.'] },
  { key: 'band', label: 'Dây kháng lực', labelEn: 'Resistance band', cover: 'Face_Pull',
    desc: 'Dây đàn hồi nhiều mức nặng, nhẹ và rẻ; dùng khởi động, hỗ trợ hít xà hoặc tập phục hồi.',
    tips: ['Kiểm tra dây không nứt trước khi tập.', 'Neo dây chắc vào vật cố định.'] },
  { key: 'ball', label: 'Bóng tập', labelEn: 'Exercise & medicine ball', cover: 'Weighted_Crunches',
    desc: 'Bóng tạ (medicine ball) để ném, xoay thân; bóng lớn (Swiss ball) để tập thăng bằng và cơ lõi.',
    tips: ['Ném bóng tạ vào tường chắc hoặc xuống sàn, không ném về phía người khác.'] },
  { key: 'cardio-machine', label: 'Máy tim mạch', labelEn: 'Cardio machines', cover: 'Rowing_Stationary',
    desc: 'Máy chạy, xe đạp tập, máy chèo thuyền, máy elip… để tập sức bền tim mạch và khởi động.',
    tips: ['Khởi động vài phút ở mức nhẹ, tăng dần.', 'Kẹp dây dừng khẩn cấp của máy chạy vào áo.'] },
  { key: 'foam-roller', label: 'Con lăn bọt giãn cơ', labelEn: 'Foam roller', cover: 'Hamstring-SMR',
    desc: 'Ống lăn bọt xốp dùng để tự giải phóng mạc cơ (SMR), thư giãn điểm căng cứng và đẩy nhanh phục hồi sau tập.',
    tips: ['Lăn chậm rãi 30–60 giây mỗi nhóm cơ.', 'Không lăn đè trực tiếp lên đốt sống thắt lưng trần hoặc khớp xương.'] },
  { key: 'other', label: 'Khác', labelEn: 'Other', cover: 'Farmers_Walk',
    desc: 'Dụng cụ khác như con lăn bụng, thảm tập, xe trượt đẩy (sled), dây thừng chiến đấu, dây nhảy.',
    tips: ['Hỏi HLV nếu chưa từng dùng dụng cụ.'] },
];

export const EQUIPMENT_BY_KEY = new Map(EQUIPMENT.map((e) => [e.key, e]));
export const parseEquipment = (csv: string | null | undefined): EquipmentKey[] =>
  (csv ?? '').split(',').map((s) => s.trim()).filter((k): k is EquipmentKey => EQUIPMENT_BY_KEY.has(k as EquipmentKey));

/** Mã ảnh gv-<id>: ảnh 180×180 + GIF từ exercises-dataset (media © Gym visual), V30. */
export const isGifKey = (key: string | null | undefined): key is string => !!key && key.startsWith('gv-');

/**
 * Ảnh minh hoạ bài tập. Mã thường (Free Exercise DB): frame 0 = tư thế đầu, 1 = tư thế cuối.
 * Mã gv-<id>: frame 0 = ảnh tĩnh .jpg, frame 1 = ảnh động .gif.
 */
export const exerciseImage = (key: string, frame: 0 | 1 = 0) =>
  isGifKey(key) ? `/exercise-gif/${key.slice(3)}.${frame === 1 ? 'gif' : 'jpg'}` : `/exercise-img/${key}/${frame}.jpg`;
