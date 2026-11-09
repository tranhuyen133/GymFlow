/**
 * V13: lịch tập mẫu phổ biến (kiểu chia buổi quen thuộc trong phòng gym), nhóm tự biên soạn.
 * Mỗi bài ghi theo TÊN trong thư viện; `ex` là danh sách ưu tiên – bài đầu tiên đã được duyệt sẽ được dùng,
 * không có bài nào thì bỏ qua và báo cho người soạn. Số hiệp / số lần là điểm khởi đầu phổ thông,
 * HLV cần chỉnh theo từng hội viên.
 */
import type { Level } from '../api/types';
import type { MuscleKey } from './anatomy';

export interface ProgramItem {
  ex: string[];
  sets: number;
  /** "8-10", "5", "30s"… – để trống khi đặt theo phút. */
  reps?: string;
  minutes?: number;
  rest?: number;
  note?: string;
}
export interface ProgramDay { dow: number; title: string; focus: MuscleKey[]; items: ProgramItem[] }
export interface Program {
  slug: string; name: string; short: string; level: Level; goal: string;
  who: string; weeks: number; days: ProgramDay[]; tips: string[];
}

const UPPER_A: ProgramItem[] = [
  { ex: ['Bench Press', 'Đẩy ngực tạ đơn'], sets: 4, reps: '6-8', rest: 120 },
  { ex: ['Gập người kéo thanh đòn', 'Seated Cable Row'], sets: 4, reps: '6-8', rest: 120 },
  { ex: ['Overhead Press', 'Đẩy vai tạ đơn ngồi'], sets: 3, reps: '8-10', rest: 90 },
  { ex: ['Lat Pulldown', 'Hít xà (Pull-up)'], sets: 3, reps: '8-10', rest: 90 },
  { ex: ['Barbell Curl', 'Cuốn tạ đơn'], sets: 2, reps: '10-12', rest: 60 },
  { ex: ['Triceps Pushdown', 'Ép tay sau dây thừng'], sets: 2, reps: '10-12', rest: 60 },
];
const LOWER_A: ProgramItem[] = [
  { ex: ['Back Squat', 'Goblet Squat'], sets: 4, reps: '6-8', rest: 150 },
  { ex: ['Romanian Deadlift', 'Deadlift chân thẳng tạ đơn'], sets: 3, reps: '8-10', rest: 120 },
  { ex: ['Leg Press', 'Hack Squat'], sets: 3, reps: '10-12', rest: 90 },
  { ex: ['Cuốn đùi sau máy', 'Cuốn đùi sau ngồi'], sets: 3, reps: '10-12', rest: 60 },
  { ex: ['Nhón gót đứng trên máy', 'Nhón gót'], sets: 3, reps: '12-15', rest: 45 },
  { ex: ['Plank', 'Dead Bug'], sets: 3, reps: '30-45s', rest: 45 },
];

export const PROGRAMS: Program[] = [
  {
    slug: 'full-body-3', name: 'Toàn thân 3 buổi/tuần', short: 'Full body · T2 – T4 – T6',
    level: 'BEGINNER', goal: 'Làm quen tạ, tăng sức mạnh nền', weeks: 8,
    who: 'Người mới hoặc người bận, tập 3 buổi cách ngày. Mỗi buổi tập đủ các nhóm cơ lớn.',
    tips: ['Ưu tiên kỹ thuật, dừng mỗi hiệp khi còn 2 – 3 lần nữa mới hết sức.', 'Tuần nào làm đủ số lần ở mọi hiệp thì tuần sau tăng nhẹ tạ (2,5 kg với thanh đòn).', 'Ngày nghỉ có thể đi bộ nhẹ 20 – 30 phút.'],
    days: [
      { dow: 1, title: 'Buổi A', focus: ['quadriceps', 'gluteal', 'chest', 'upper-back', 'front-deltoids', 'abs'], items: [
        { ex: ['Back Squat', 'Goblet Squat'], sets: 3, reps: '8-10', rest: 120 },
        { ex: ['Bench Press', 'Đẩy ngực tạ đơn'], sets: 3, reps: '8-10', rest: 90 },
        { ex: ['Seated Cable Row', 'Kéo tạ đơn một tay'], sets: 3, reps: '10-12', rest: 90 },
        { ex: ['Overhead Press', 'Đẩy vai tạ đơn ngồi'], sets: 2, reps: '8-10', rest: 90 },
        { ex: ['Plank'], sets: 3, reps: '30s', rest: 45 },
      ] },
      { dow: 3, title: 'Buổi B', focus: ['hamstring', 'gluteal', 'chest', 'upper-back', 'quadriceps', 'abs'], items: [
        { ex: ['Romanian Deadlift', 'Deadlift chân thẳng tạ đơn'], sets: 3, reps: '8-10', rest: 120 },
        { ex: ['Incline Dumbbell Press', 'Đẩy ngực máy'], sets: 3, reps: '10-12', rest: 90 },
        { ex: ['Lat Pulldown', 'Kéo xô tay hẹp'], sets: 3, reps: '10-12', rest: 90 },
        { ex: ['Walking Lunge', 'Chùng chân lùi tạ đơn'], sets: 2, reps: '10', note: 'Mỗi chân', rest: 90 },
        { ex: ['Dead Bug', 'Bird Dog'], sets: 3, reps: '10', note: 'Mỗi bên', rest: 45 },
      ] },
      { dow: 5, title: 'Buổi C', focus: ['quadriceps', 'gluteal', 'chest', 'upper-back', 'front-deltoids', 'abs'], items: [
        { ex: ['Leg Press', 'Goblet Squat'], sets: 3, reps: '10-12', rest: 90 },
        { ex: ['Đẩy ngực tạ đơn', 'Hít đất (Push-up)'], sets: 3, reps: '10-12', rest: 90 },
        { ex: ['Kéo tạ đơn một tay', 'Seated Cable Row'], sets: 3, reps: '10', note: 'Mỗi tay', rest: 60 },
        { ex: ['Lateral Raise'], sets: 2, reps: '12-15', rest: 60 },
        { ex: ['Hip Thrust', 'Nâng hông nằm'], sets: 3, reps: '10-12', rest: 90 },
        { ex: ['Hanging Leg Raise', 'Nâng chân nằm'], sets: 2, reps: '10-12', rest: 45 },
      ] },
    ],
  },
  {
    slug: 'upper-lower-4', name: 'Thân trên / thân dưới 4 buổi', short: 'Upper / Lower · T2 – T3 – T5 – T6',
    level: 'INTERMEDIATE', goal: 'Tăng cơ và sức mạnh cân bằng', weeks: 8,
    who: 'Đã tập đều 3 – 6 tháng. Mỗi nhóm cơ được tập 2 lần/tuần, buổi ngắn gọn khoảng 60 phút.',
    tips: ['Buổi 1 – 2 nặng (6 – 8 lần), buổi 3 – 4 nhẹ hơn, nhiều lần hơn (10 – 12 lần).', 'Nghỉ đủ giữa hiệp nặng (2 – 3 phút) để giữ kỹ thuật.'],
    days: [
      { dow: 1, title: 'Thân trên – nặng', focus: ['chest', 'upper-back', 'front-deltoids', 'biceps', 'triceps'], items: UPPER_A },
      { dow: 2, title: 'Thân dưới – nặng', focus: ['quadriceps', 'gluteal', 'hamstring', 'calves', 'abs'], items: LOWER_A },
      { dow: 4, title: 'Thân trên – khối lượng', focus: ['chest', 'upper-back', 'front-deltoids', 'back-deltoids', 'biceps', 'triceps'], items: [
        { ex: ['Incline Dumbbell Press', 'Đẩy ngực dốc thanh đòn'], sets: 3, reps: '10-12', rest: 90 },
        { ex: ['Seated Cable Row', 'Kéo lưng máy'], sets: 3, reps: '10-12', rest: 90 },
        { ex: ['Cable Fly', 'Ép ngực máy'], sets: 3, reps: '12-15', rest: 60 },
        { ex: ['Kéo xô tay hẹp', 'Lat Pulldown'], sets: 3, reps: '10-12', rest: 60 },
        { ex: ['Lateral Raise', 'Dang vai cáp một tay'], sets: 3, reps: '12-15', rest: 45 },
        { ex: ['Face Pull', 'Bay vai sau tạ đơn'], sets: 3, reps: '12-15', rest: 45 },
        { ex: ['Cuốn tạ búa', 'Cuốn tạ đơn'], sets: 2, reps: '12', rest: 45 },
        { ex: ['Duỗi tay sau qua đầu', 'Duỗi tay sau cáp qua đầu'], sets: 2, reps: '12', rest: 45 },
      ] },
      { dow: 5, title: 'Thân dưới – khối lượng', focus: ['quadriceps', 'gluteal', 'hamstring', 'calves', 'obliques'], items: [
        { ex: ['Bulgarian Split Squat', 'Walking Lunge'], sets: 3, reps: '10', note: 'Mỗi chân', rest: 90 },
        { ex: ['Hip Thrust', 'Nâng hông nằm'], sets: 3, reps: '10-12', rest: 90 },
        { ex: ['Đá đùi máy'], sets: 3, reps: '12-15', rest: 60 },
        { ex: ['Cuốn đùi sau ngồi', 'Cuốn đùi sau máy'], sets: 3, reps: '12-15', rest: 60 },
        { ex: ['Nhón gót ngồi', 'Nhón gót'], sets: 3, reps: '15', rest: 45 },
        { ex: ['Pallof Press', 'Plank nghiêng'], sets: 3, reps: '10', note: 'Mỗi bên', rest: 45 },
      ] },
    ],
  },
  {
    slug: 'ppl-6', name: 'Đẩy – Kéo – Chân 6 buổi', short: 'Push / Pull / Legs · lặp 2 vòng',
    level: 'ADVANCED', goal: 'Tăng cơ, khối lượng tập cao', weeks: 8,
    who: 'Đã tập ổn định trên 1 năm, ngủ và ăn đủ. Có thể rút còn 3 buổi (T2 – T4 – T6) nếu bận.',
    tips: ['Theo dõi mức tạ từng bài; tăng số lần trước rồi mới tăng tạ.', 'Thấy mệt kéo dài, giảm 1 hiệp mỗi bài trong 1 tuần.'],
    days: [1, 4].flatMap((d) => [
      { dow: d, title: 'Đẩy (ngực · vai · tay sau)', focus: ['chest', 'front-deltoids', 'triceps'] as MuscleKey[], items: [
        { ex: ['Bench Press', 'Đẩy ngực tạ đơn'], sets: 4, reps: '6-10', rest: 120 },
        { ex: ['Overhead Press', 'Arnold Press'], sets: 3, reps: '8-10', rest: 90 },
        { ex: ['Incline Dumbbell Press', 'Đẩy ngực dốc thanh đòn'], sets: 3, reps: '10-12', rest: 90 },
        { ex: ['Lateral Raise', 'Dang vai cáp một tay'], sets: 3, reps: '12-15', rest: 45 },
        { ex: ['Triceps Pushdown', 'Ép tay sau dây thừng'], sets: 3, reps: '10-12', rest: 60 },
        { ex: ['Chống xà kép', 'Chống tay sau ghế'], sets: 2, reps: '8-12', rest: 60 },
      ] },
      { dow: d + 1, title: 'Kéo (lưng · vai sau · tay trước)', focus: ['upper-back', 'back-deltoids', 'biceps', 'trapezius'] as MuscleKey[], items: [
        { ex: ['Deadlift', 'Gập người kéo thanh đòn'], sets: 3, reps: '5', rest: 180, note: d === 4 ? 'Buổi này có thể đổi Deadlift sang Gập người kéo thanh đòn' : undefined },
        { ex: ['Hít xà (Pull-up)', 'Lat Pulldown'], sets: 3, reps: '6-10', rest: 90 },
        { ex: ['Seated Cable Row', 'Kéo T-bar'], sets: 3, reps: '10-12', rest: 90 },
        { ex: ['Face Pull', 'Bay vai sau cáp'], sets: 3, reps: '12-15', rest: 45 },
        { ex: ['Barbell Curl', 'Cuốn thanh EZ'], sets: 3, reps: '10-12', rest: 60 },
        { ex: ['Cuốn tạ búa'], sets: 2, reps: '12', rest: 45 },
      ] },
      { dow: d + 2, title: 'Chân', focus: ['quadriceps', 'gluteal', 'hamstring', 'calves', 'abs'] as MuscleKey[], items: [
        { ex: ['Back Squat', 'Hack Squat'], sets: 4, reps: '6-10', rest: 150 },
        { ex: ['Romanian Deadlift'], sets: 3, reps: '8-10', rest: 120 },
        { ex: ['Leg Press', 'Squat máy Smith'], sets: 3, reps: '10-12', rest: 90 },
        { ex: ['Cuốn đùi sau máy', 'Cuốn đùi sau ngồi'], sets: 3, reps: '10-12', rest: 60 },
        { ex: ['Nhón gót đứng trên máy', 'Nhón gót'], sets: 4, reps: '10-15', rest: 45 },
        { ex: ['Hanging Leg Raise', 'Gập bụng cáp quỳ'], sets: 3, reps: '10-12', rest: 45 },
      ] },
    ]),
  },
  {
    slug: 'bro-split-5', name: 'Mỗi ngày một nhóm cơ (5 buổi)', short: 'Bro split · T2 → T6',
    level: 'INTERMEDIATE', goal: 'Tăng cơ, tập trung từng nhóm', weeks: 6,
    who: 'Thích tập dài cho một nhóm cơ mỗi buổi. Mỗi nhóm chỉ được tập 1 lần/tuần nên cần đủ khối lượng trong buổi.',
    tips: ['Giữ cuối tuần để nghỉ hẳn hoặc đi bộ, đạp xe nhẹ.', 'Không tập vai ngay sau ngày ngực nếu vai trước còn mỏi.'],
    days: [
      { dow: 1, title: 'Ngực', focus: ['chest', 'front-deltoids', 'triceps'], items: [
        { ex: ['Bench Press'], sets: 4, reps: '6-10', rest: 120 },
        { ex: ['Incline Dumbbell Press', 'Đẩy ngực dốc thanh đòn'], sets: 3, reps: '8-12', rest: 90 },
        { ex: ['Đẩy ngực dốc xuống', 'Chống xà kép'], sets: 3, reps: '8-12', rest: 90 },
        { ex: ['Cable Fly', 'Ép ngực tạ đơn'], sets: 3, reps: '12-15', rest: 60 },
        { ex: ['Ép ngực cáp từ dưới lên', 'Ép ngực máy'], sets: 2, reps: '12-15', rest: 60 },
      ] },
      { dow: 2, title: 'Lưng', focus: ['upper-back', 'lower-back', 'trapezius', 'biceps'], items: [
        { ex: ['Deadlift'], sets: 3, reps: '5', rest: 180 },
        { ex: ['Hít xà (Pull-up)', 'Lat Pulldown'], sets: 3, reps: '6-10', rest: 90 },
        { ex: ['Gập người kéo thanh đòn', 'Kéo T-bar'], sets: 3, reps: '8-10', rest: 90 },
        { ex: ['Kéo tạ đơn một tay', 'Kéo lưng máy'], sets: 3, reps: '10', note: 'Mỗi tay', rest: 60 },
        { ex: ['Kéo cáp tay thẳng'], sets: 2, reps: '12-15', rest: 45 },
        { ex: ['Nhún vai thanh đòn', 'Nhún vai tạ đơn'], sets: 3, reps: '10-12', rest: 60 },
      ] },
      { dow: 3, title: 'Vai', focus: ['front-deltoids', 'back-deltoids', 'trapezius'], items: [
        { ex: ['Overhead Press', 'Đẩy vai máy'], sets: 4, reps: '6-10', rest: 120 },
        { ex: ['Arnold Press', 'Đẩy vai tạ đơn ngồi'], sets: 3, reps: '10-12', rest: 90 },
        { ex: ['Lateral Raise'], sets: 4, reps: '12-15', rest: 45 },
        { ex: ['Nâng tạ trước mặt'], sets: 2, reps: '12', rest: 45 },
        { ex: ['Bay vai sau tạ đơn', 'Bay vai sau cáp'], sets: 3, reps: '12-15', rest: 45 },
        { ex: ['Face Pull'], sets: 2, reps: '15', rest: 45 },
      ] },
      { dow: 4, title: 'Chân', focus: ['quadriceps', 'gluteal', 'hamstring', 'adductor', 'calves'], items: [
        { ex: ['Back Squat', 'Front Squat'], sets: 4, reps: '6-10', rest: 150 },
        { ex: ['Leg Press'], sets: 3, reps: '10-12', rest: 90 },
        { ex: ['Romanian Deadlift', 'Deadlift chân rộng'], sets: 3, reps: '8-10', rest: 120 },
        { ex: ['Đá đùi máy'], sets: 3, reps: '12-15', rest: 60 },
        { ex: ['Cuốn đùi sau máy'], sets: 3, reps: '12-15', rest: 60 },
        { ex: ['Nhón gót đứng trên máy', 'Nhón gót trên máy đạp đùi'], sets: 4, reps: '12-15', rest: 45 },
      ] },
      { dow: 5, title: 'Tay + bụng', focus: ['biceps', 'triceps', 'forearm', 'abs', 'obliques'], items: [
        { ex: ['Barbell Curl', 'Cuốn thanh EZ'], sets: 3, reps: '8-12', rest: 60 },
        { ex: ['Skull Crusher', 'Duỗi tay sau qua đầu'], sets: 3, reps: '8-12', rest: 60 },
        { ex: ['Cuốn tạ ghế Scott', 'Cuốn tạ tập trung'], sets: 2, reps: '10-12', rest: 45 },
        { ex: ['Ép tay sau dây thừng', 'Triceps Pushdown'], sets: 2, reps: '12-15', rest: 45 },
        { ex: ['Cuốn ngược thanh đòn', 'Cuốn cổ tay ngửa'], sets: 2, reps: '12-15', rest: 45 },
        { ex: ['Gập bụng cáp quỳ', 'Gập bụng'], sets: 3, reps: '12-15', rest: 45 },
        { ex: ['Russian Twist', 'Gập bụng đạp xe'], sets: 2, reps: '12', note: 'Mỗi bên', rest: 45 },
      ] },
    ],
  },
  {
    slug: 'strength-5x5', name: 'Sức mạnh 5x5 (2 buổi A/B luân phiên)', short: '5×5 · T2 – T4 – T6',
    level: 'BEGINNER', goal: 'Tăng sức mạnh với bài thanh đòn', weeks: 12,
    who: 'Người mới muốn mạnh lên nhanh với 3 – 5 bài thanh đòn cơ bản. Tuần 1 tập A – B – A, tuần 2 tập B – A – B.',
    tips: ['Bắt đầu với mức tạ nhẹ (khoảng 50% sức), tăng 2,5 kg mỗi buổi khi làm đủ 5×5.', 'Trượt mức tạ 3 buổi liền: giảm 10% rồi tăng lại.', 'Bắt buộc có khung có thanh chặn hoặc người hỗ trợ khi squat và đẩy ngực nặng.'],
    days: [
      { dow: 1, title: 'Buổi A', focus: ['quadriceps', 'gluteal', 'chest', 'upper-back'], items: [
        { ex: ['Back Squat'], sets: 5, reps: '5', rest: 180 },
        { ex: ['Bench Press'], sets: 5, reps: '5', rest: 180 },
        { ex: ['Gập người kéo thanh đòn'], sets: 5, reps: '5', rest: 150 },
      ] },
      { dow: 3, title: 'Buổi B', focus: ['quadriceps', 'gluteal', 'front-deltoids', 'lower-back', 'hamstring'], items: [
        { ex: ['Back Squat'], sets: 5, reps: '5', rest: 180 },
        { ex: ['Overhead Press'], sets: 5, reps: '5', rest: 180 },
        { ex: ['Deadlift'], sets: 1, reps: '5', rest: 180, note: 'Khởi động kỹ trước hiệp chính' },
      ] },
      { dow: 5, title: 'Buổi A', focus: ['quadriceps', 'gluteal', 'chest', 'upper-back'], items: [
        { ex: ['Back Squat'], sets: 5, reps: '5', rest: 180 },
        { ex: ['Bench Press'], sets: 5, reps: '5', rest: 180 },
        { ex: ['Gập người kéo thanh đòn'], sets: 5, reps: '5', rest: 150 },
      ] },
    ],
  },
  {
    slug: 'power-hypertrophy-4', name: 'Sức mạnh + tăng cơ 4 buổi', short: 'Power / Hypertrophy Upper-Lower',
    level: 'INTERMEDIATE', goal: 'Vừa mạnh vừa to', weeks: 10,
    who: 'Kiểu chia 2 buổi nặng (3 – 5 lần) và 2 buổi khối lượng (8 – 12 lần) mỗi tuần, hợp người đã quen bài thanh đòn.',
    tips: ['Buổi nặng ưu tiên bài thanh đòn, nghỉ 3 phút giữa các hiệp chính.', 'Buổi khối lượng có thể dùng máy và cáp để đỡ mỏi khớp.'],
    days: [
      { dow: 1, title: 'Thân trên – sức mạnh', focus: ['chest', 'upper-back', 'front-deltoids', 'triceps', 'biceps'], items: [
        { ex: ['Bench Press'], sets: 4, reps: '3-5', rest: 180 },
        { ex: ['Gập người kéo thanh đòn'], sets: 4, reps: '3-5', rest: 180 },
        { ex: ['Overhead Press'], sets: 3, reps: '5-8', rest: 120 },
        { ex: ['Hít xà (Pull-up)', 'Lat Pulldown'], sets: 3, reps: '6-8', rest: 120 },
        { ex: ['Barbell Curl'], sets: 2, reps: '6-10', rest: 60 },
        { ex: ['Skull Crusher', 'Triceps Pushdown'], sets: 2, reps: '6-10', rest: 60 },
      ] },
      { dow: 2, title: 'Thân dưới – sức mạnh', focus: ['quadriceps', 'gluteal', 'hamstring', 'lower-back', 'calves'], items: [
        { ex: ['Back Squat'], sets: 4, reps: '3-5', rest: 180 },
        { ex: ['Deadlift'], sets: 3, reps: '3-5', rest: 180 },
        { ex: ['Leg Press'], sets: 3, reps: '8-10', rest: 120 },
        { ex: ['Cuốn đùi sau máy'], sets: 3, reps: '6-10', rest: 90 },
        { ex: ['Nhón gót đứng trên máy'], sets: 4, reps: '6-10', rest: 60 },
      ] },
      { dow: 4, title: 'Thân trên – tăng cơ', focus: ['chest', 'upper-back', 'front-deltoids', 'back-deltoids', 'biceps', 'triceps'], items: [
        { ex: ['Incline Dumbbell Press'], sets: 4, reps: '8-12', rest: 90 },
        { ex: ['Cable Fly', 'Ép ngực tạ đơn'], sets: 3, reps: '8-12', rest: 60 },
        { ex: ['Seated Cable Row'], sets: 4, reps: '8-12', rest: 90 },
        { ex: ['Kéo tạ đơn một tay'], sets: 3, reps: '8-12', rest: 60 },
        { ex: ['Lateral Raise'], sets: 3, reps: '8-12', rest: 45 },
        { ex: ['Cuốn tạ tập trung', 'Cuốn tạ đơn'], sets: 3, reps: '8-12', rest: 45 },
        { ex: ['Ép tay sau dây thừng', 'Triceps Pushdown'], sets: 3, reps: '8-12', rest: 45 },
      ] },
      { dow: 5, title: 'Thân dưới – tăng cơ', focus: ['quadriceps', 'gluteal', 'hamstring', 'calves'], items: [
        { ex: ['Front Squat', 'Hack Squat'], sets: 3, reps: '8-12', rest: 120 },
        { ex: ['Bulgarian Split Squat', 'Walking Lunge'], sets: 3, reps: '8-12', rest: 90 },
        { ex: ['Đá đùi máy'], sets: 3, reps: '10-15', rest: 60 },
        { ex: ['Cuốn đùi sau ngồi', 'Cuốn đùi sau máy'], sets: 3, reps: '10-15', rest: 60 },
        { ex: ['Nhón gót ngồi'], sets: 3, reps: '10-15', rest: 45 },
        { ex: ['Nhón gót trên máy đạp đùi', 'Nhón gót'], sets: 2, reps: '10-15', rest: 45 },
      ] },
    ],
  },
  {
    slug: 'fat-loss-5', name: 'Giảm mỡ: 3 sức mạnh + 2 cardio', short: 'Tạ toàn thân + tim mạch',
    level: 'BEGINNER', goal: 'Giảm mỡ, giữ cơ', weeks: 8,
    who: 'Muốn giảm cân mà vẫn giữ cơ. Kết hợp ăn thâm hụt vừa phải; cardio ở mức nói chuyện được hoặc hơi hụt hơi.',
    tips: ['NHS khuyến nghị người lớn có ít nhất 150 phút vận động vừa mỗi tuần và 2 ngày tập sức mạnh – lịch này vượt mức đó.', 'Không cắt giảm ăn quá mạnh; ngủ đủ để giữ sức tập.'],
    days: [
      { dow: 1, title: 'Tạ toàn thân A', focus: ['quadriceps', 'gluteal', 'chest', 'upper-back', 'abs'], items: [
        { ex: ['Goblet Squat', 'Back Squat'], sets: 3, reps: '10-12', rest: 75 },
        { ex: ['Đẩy ngực tạ đơn', 'Hít đất (Push-up)'], sets: 3, reps: '10-12', rest: 75 },
        { ex: ['Seated Cable Row', 'Kéo tạ đơn một tay'], sets: 3, reps: '10-12', rest: 75 },
        { ex: ['Kettlebell Swing', 'Nâng hông nằm'], sets: 3, reps: '15', rest: 60 },
        { ex: ['Leo núi tại chỗ', 'Plank'], sets: 3, reps: '30s', rest: 30 },
      ] },
      { dow: 2, title: 'Cardio vừa', focus: ['quadriceps', 'calves'], items: [
        { ex: ['Máy elip', 'Chạy bộ máy', 'Đạp xe tại chỗ'], sets: 1, minutes: 35, note: 'Mức vừa – vẫn nói chuyện được' },
      ] },
      { dow: 3, title: 'Tạ toàn thân B', focus: ['hamstring', 'gluteal', 'front-deltoids', 'upper-back', 'obliques'], items: [
        { ex: ['Romanian Deadlift', 'Deadlift chân thẳng tạ đơn'], sets: 3, reps: '10-12', rest: 75 },
        { ex: ['Đẩy vai tạ đơn ngồi', 'Overhead Press'], sets: 3, reps: '10-12', rest: 75 },
        { ex: ['Lat Pulldown'], sets: 3, reps: '10-12', rest: 75 },
        { ex: ['Bước lên bục tạ đơn', 'Walking Lunge'], sets: 3, reps: '10', note: 'Mỗi chân', rest: 60 },
        { ex: ['Plank nghiêng'], sets: 2, reps: '30s', note: 'Mỗi bên', rest: 30 },
      ] },
      { dow: 4, title: 'Cardio ngắt quãng', focus: ['quadriceps', 'gluteal', 'upper-back'], items: [
        { ex: ['Chèo thuyền máy', 'Đạp xe tại chỗ'], sets: 1, minutes: 20, note: '1 phút nhanh – 2 phút chậm, lặp lại' },
        { ex: ['Xách tạ đi bộ'], sets: 3, reps: '40s', note: 'Đi khoảng 40 m', rest: 60 },
      ] },
      { dow: 5, title: 'Tạ toàn thân C', focus: ['quadriceps', 'gluteal', 'chest', 'upper-back', 'abs'], items: [
        { ex: ['Leg Press'], sets: 3, reps: '12-15', rest: 75 },
        { ex: ['Incline Dumbbell Press'], sets: 3, reps: '10-12', rest: 75 },
        { ex: ['Kéo xà thấp', 'Kéo tạ đơn một tay'], sets: 3, reps: '10-12', rest: 75 },
        { ex: ['Hip Thrust', 'Nâng hông nằm'], sets: 3, reps: '12', rest: 60 },
        { ex: ['Dead Bug'], sets: 3, reps: '10', note: 'Mỗi bên', rest: 30 },
      ] },
    ],
  },
  {
    slug: 'home-bodyweight-3', name: 'Tập tại nhà không dụng cụ', short: 'Bodyweight · 3 buổi · ~30 phút',
    level: 'BEGINNER', goal: 'Duy trì vận động, săn chắc', weeks: 6,
    who: 'Không đến được phòng tập hoặc mới bắt đầu. Chỉ cần thảm và một chiếc ghế chắc.',
    tips: ['Tập theo vòng: làm lần lượt các bài, nghỉ 1 – 2 phút rồi lặp lại 3 vòng.', 'Dễ quá thì làm chậm nhịp xuống (3 giây) thay vì tăng số lần mãi.'],
    days: [1, 3, 5].map((d) => ({
      dow: d, title: 'Vòng toàn thân', focus: ['quadriceps', 'gluteal', 'chest', 'triceps', 'lower-back', 'abs'] as MuscleKey[], items: [
        { ex: ['Squat tay không', 'Ngồi xuống – đứng lên'], sets: 3, reps: '15', rest: 30 },
        { ex: ['Hít đất (Push-up)', 'Hít đất chống tay cao', 'Hít đất vào tường'], sets: 3, reps: '8-12', rest: 30 },
        { ex: ['Chùng chân tại chỗ'], sets: 3, reps: '10', note: 'Mỗi chân', rest: 30 },
        { ex: ['Superman', 'Bird Dog'], sets: 3, reps: '12', rest: 30 },
        { ex: ['Nâng hông nằm', 'Nâng hông một chân'], sets: 3, reps: '15', rest: 30 },
        { ex: ['Plank'], sets: 3, reps: '30s', rest: 30 },
        { ex: ['Leo núi tại chỗ', 'Nhảy dây'], sets: 3, reps: '30s', rest: 60 },
      ],
    })),
  },
];

export const PROGRAM_BY_SLUG = new Map(PROGRAMS.map((p) => [p.slug, p]));

/** Vùng cơ được tập bao nhiêu buổi trong tuần – để tô bản đồ cơ của lịch mẫu. */
export function programFocus(p: Program): Partial<Record<MuscleKey, number>> {
  const c: Partial<Record<MuscleKey, number>> = {};
  p.days.forEach((d) => d.focus.forEach((k) => { c[k] = (c[k] ?? 0) + 1; }));
  return c;
}

/** Tìm bài đầu tiên trong danh sách ưu tiên có trong thư viện (đã lọc sẵn: đã duyệt, đang hiện). */
export function resolveItem<T extends { name: string }>(it: ProgramItem, byName: Map<string, T>): T | undefined {
  for (const n of it.ex) { const e = byName.get(n.toLowerCase()); if (e) return e; }
  return undefined;
}
