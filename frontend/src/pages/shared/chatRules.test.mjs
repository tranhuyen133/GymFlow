// Chạy: node --test src/pages/shared/chatRules.test.mjs (trong frontend). Không thêm thư viện test.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('./chatRules.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
});
const R = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

const MB = 1024 * 1024;
const msg = (o = {}) => ({ id: 1, senderUserId: 10, body: 'chào', createdAt: '2026-11-14T10:00:00.123456', ...o });
const at = (s) => R.parseLocal(s);

test('kiểm tra tệp: loại hỗ trợ, đuôi hoa/thường, rỗng, không đuôi, đúng biên dung lượng', () => {
  assert.deepEqual(R.checkFile({ name: 'Anh.JPG', size: 100 }), { ok: true, kind: 'IMAGE' });
  assert.deepEqual(R.checkFile({ name: 'squat.mov', size: 25 * MB }), { ok: true, kind: 'VIDEO' });
  assert.deepEqual(R.checkFile({ name: 'giao-an.pdf', size: 10 * MB }), { ok: true, kind: 'FILE' });
  assert.equal(R.checkFile({ name: 'squat.mp4', size: 25 * MB + 1 }).error, 'Video tối đa {n} MB');
  assert.deepEqual(R.checkFile({ name: 'a.png', size: 10 * MB + 1 }).vars, { n: 10 });
  assert.equal(R.checkFile({ name: 'a.docx', size: 10 * MB + 1 }).error, 'Tệp tối đa {n} MB');
  assert.equal(R.checkFile({ name: 'virus.exe', size: 10 }).error, 'Định dạng tệp không được hỗ trợ');
  assert.equal(R.checkFile({ name: 'logo.svg', size: 10 }).error, 'Định dạng tệp không được hỗ trợ');
  assert.equal(R.checkFile({ name: 'khongduoi', size: 10 }).error, 'Định dạng tệp không được hỗ trợ');
  assert.equal(R.checkFile({ name: 'a.', size: 10 }).error, 'Định dạng tệp không được hỗ trợ');
  assert.equal(R.checkFile({ name: 'a.jpg', size: 0 }).error, 'Tệp rỗng, vui lòng chọn tệp khác');
  assert.equal(R.checkFile(null).error, 'Vui lòng chọn tệp cần gửi');
  assert.ok(R.ACCEPT.includes('.webm') && R.ACCEPT.includes('.xlsx') && !R.ACCEPT.includes('.exe'));
});

test('định dạng dung lượng', () => {
  assert.equal(R.formatBytes(512), '512 B');
  assert.equal(R.formatBytes(1536), '1.5 KB');
  assert.equal(R.formatBytes(10 * MB), '10 MB');
  assert.equal(R.formatBytes(null), '');
  assert.equal(R.formatBytes(-1), '');
});

test('thu hồi: chỉ tin của mình, trong 15 phút, chưa thu hồi; ngày giờ hỏng thì không cho', () => {
  const created = at('2026-11-14T10:00:00.123456');
  assert.equal(R.canRecall(msg(), 10, created + 14 * 60_000), true);
  assert.equal(R.recallLeftMs(msg(), 10, created + 14 * 60_000), 60_000);
  assert.equal(R.canRecall(msg(), 10, created + 15 * 60_000), false);
  assert.equal(R.canRecall(msg(), 20, created + 1000), false);
  assert.equal(R.canRecall(msg({ recalled: true }), 10, created + 1000), false);
  assert.equal(R.canRecall(msg({ createdAt: 'xx' }), 10, created), false);
  assert.ok(Number.isNaN(R.parseLocal('')));
  assert.equal(new Date(at('2026-11-14T10:05')).getMinutes(), 5);
});

test('xem trước hội thoại: chữ, ảnh có / không chú thích, tệp, thu hồi (mình / người kia), rỗng', () => {
  assert.deepEqual(R.previewOf(msg(), 10), { label: null, text: 'chào' });
  assert.deepEqual(R.previewOf(msg({ kind: 'IMAGE', body: '' }), 10), { label: '[Ảnh]', text: '' });
  assert.deepEqual(R.previewOf(msg({ kind: 'VIDEO', body: ' form squat ' }), 10), { label: '[Video]', text: 'form squat' });
  assert.deepEqual(R.previewOf(msg({ kind: 'FILE', body: '', attachmentName: 'giao-an.pdf' }), 10), { label: '[Tệp]', text: 'giao-an.pdf' });
  assert.equal(R.previewOf(msg({ recalled: true }), 10).label, 'Bạn đã thu hồi một tin nhắn');
  assert.equal(R.previewOf(msg({ recalled: true }), 20).label, 'Tin nhắn đã được thu hồi');
  assert.equal(R.previewOf(null, 10).label, 'Chưa có tin nhắn');
});

test('gộp tin mới: bỏ trùng, sắp theo id, không tạo mảng mới khi không đổi', () => {
  const a = [msg({ id: 1 }), msg({ id: 3 })];
  const merged = R.mergeMessages(a, [msg({ id: 2 }), msg({ id: 3 })]);
  assert.deepEqual(merged.map((m) => m.id), [1, 2, 3]);
  assert.equal(R.mergeMessages(a, []), a);
  assert.equal(R.mergeMessages(a, [a[0]]), a);
});

test('áp dụng thu hồi: xoá nội dung + tệp, giữ nguyên tin khác, không đổi mảng nếu không có gì', () => {
  const list = [msg({ id: 1, kind: 'IMAGE', attachmentName: 'a.jpg', attachmentType: 'image/jpeg' }), msg({ id: 2 })];
  const out = R.applyRecalled(list, [1, 99]);
  assert.equal(out[0].recalled, true);
  assert.equal(out[0].body, '');
  assert.equal(out[0].attachmentName, null);
  assert.equal(out[1], list[1]);
  assert.equal(R.applyRecalled(list, []), list);
  assert.equal(R.applyRecalled(out, [1]), out);
});
