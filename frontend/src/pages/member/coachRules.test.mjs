// Chạy: node --test src/pages/member/coachRules.test.mjs (trong frontend). Không thêm thư viện test.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('./coachRules.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
});
const R = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

const coach = (o = {}) => ({ fullName: 'Lê Hoàng Phúc', specialty: 'thể hình, giảm mỡ', bio: 'Chuyên giáo án giảm mỡ', certificates: 'NASM-CPT', ...o });

test('tách chuyên môn: viết hoa, bỏ khoảng trắng thừa, bỏ trùng, nhiều dấu ngăn cách', () => {
  assert.deepEqual(R.splitSpecialties('thể hình,  giảm   mỡ / Yoga; yoga • '), ['Thể hình', 'Giảm mỡ', 'Yoga']);
  assert.deepEqual(R.splitSpecialties(null), []);
  assert.deepEqual(R.splitSpecialties('  ,, / '), []);
});

test('bộ lọc chuyên môn gộp mọi HLV, không trùng, sắp xếp tiếng Việt', () => {
  const list = [{ specialty: 'Yoga, phục hồi chức năng' }, { specialty: 'sức mạnh, powerlifting' }, { specialty: 'yoga' }, { specialty: null }];
  assert.deepEqual(R.allSpecialties(list), ['Phục hồi chức năng', 'Powerlifting', 'Sức mạnh', 'Yoga']);
});

test('tìm kiếm không dấu, nhiều từ, theo tên / chuyên môn / chứng chỉ', () => {
  assert.equal(R.matchesCoach(coach(), 'giam mo', null), true);
  assert.equal(R.matchesCoach(coach(), 'PHUC nasm', null), true);
  assert.equal(R.matchesCoach(coach(), 'yoga', null), false);
  assert.equal(R.matchesCoach(coach(), '   ', null), true);
  assert.equal(R.matchesCoach(coach({ fullName: 'Đỗ Minh' }), 'do minh', null), true);
});

test('lọc chuyên môn khớp đúng cụm, không khớp một phần ("Thể hình" không khớp "Thể hình nữ")', () => {
  assert.equal(R.matchesCoach(coach(), '', 'Giảm mỡ'), true);
  assert.equal(R.matchesCoach(coach({ specialty: 'Thể hình nữ' }), '', 'Thể hình'), false);
  assert.equal(R.matchesCoach(coach({ specialty: null }), '', 'Yoga'), false);
});

test('giờ của ca: bình thường, qua nửa đêm, sai định dạng', () => {
  assert.equal(R.shiftHours('05:30:00', '11:30:00'), 6);
  assert.equal(R.shiftHours('17:00', '21:30'), 4.5);
  assert.equal(R.shiftHours('22:00', '02:00'), 4);
  assert.equal(R.shiftHours('xx', '10:00'), null);
  assert.equal(R.shiftHours('10:00', '10:00'), null);
  assert.equal(R.shiftHours('25:00', '10:00'), null);
});

test('ca hôm nay: Chủ nhật = 7, chọn ca sớm nhất', () => {
  const sunday = new Date(2026, 10, 15, 9, 0);
  const shifts = [{ dayOfWeek: 7, startTime: '17:00', endTime: '21:00' }, { dayOfWeek: 7, startTime: '06:00', endTime: '10:00' }, { dayOfWeek: 1, startTime: '06:00', endTime: '10:00' }];
  assert.equal(R.isoDay(sunday), 7);
  assert.equal(R.todayShift(shifts, sunday).startTime, '06:00');
  assert.equal(R.todayShift(shifts, new Date(2026, 10, 17)), null);
});

test('tổng giờ tuần và nhóm ca theo thứ (bỏ thứ ngoài 1..7)', () => {
  const shifts = [{ dayOfWeek: 1, startTime: '06:00', endTime: '10:00' }, { dayOfWeek: 1, startTime: '17:00', endTime: '19:30' }, { dayOfWeek: 9, startTime: '06:00', endTime: '08:00' }];
  assert.equal(R.weeklyHours(shifts), 8.5);
  const byDay = R.shiftsByDay(shifts);
  assert.equal(byDay.length, 7);
  assert.equal(byDay[0].length, 2);
  assert.equal(byDay[6].length, 0);
});

test('chứng chỉ và quyền nhắn tin khớp quy tắc máy chủ', () => {
  assert.deepEqual(R.certificateList('ISSA, VN Powerlifting L2;  '), ['ISSA', 'VN Powerlifting L2']);
  assert.deepEqual(R.certificateList(null), []);
  assert.equal(R.canMessage(3, new Set([3])), true);
  assert.equal(R.canMessage(4, new Set([3])), false);
  assert.equal(R.canMessage(4, new Set()), false);
  assert.equal(R.canMessage(4, null), true);
});
