// Chạy: node --test src/pages/forumRules.test.mjs (trong frontend). Không thêm thư viện test.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('./forumRules.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
});
const R = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

const topic = (o = {}) => ({ hidden: false, locked: false, canModerate: false, viewerSignedIn: true, ...o });

test('làm sạch: bỏ ký tự vô hình, khoảng trắng cuối dòng, gộp dòng trống, trim', () => {
  assert.equal(R.cleanText("  xin\u200B chào \r\n\r\n\r\n\r\nbạn  "), "xin chào\n\nbạn");
  assert.equal(R.cleanText(null), '');
  assert.equal(R.cleanLine('  Tập   chân\n\nmỗi   tuần '), 'Tập chân mỗi tuần');
  assert.equal(R.cleanText("Tie\u0301n"), "Ti\u00e9n", "NFC: e + dấu sắc ghép thành é");
});

test('tiêu đề: rỗng, toàn khoảng trắng, ngắn sau khi trim, dài, không có chữ', () => {
  assert.equal(R.validateTopic({ title: '', body: 'Nội dung đủ dài rồi' }).title, 'Vui lòng nhập tiêu đề');
  assert.equal(R.validateTopic({ title: '      ', body: 'Nội dung đủ dài rồi' }).title, 'Vui lòng nhập tiêu đề');
  assert.equal(R.validateTopic({ title: '   abc    ', body: 'Nội dung đủ dài rồi' }).title, 'Tiêu đề từ 5 đến 200 ký tự');
  assert.equal(R.validateTopic({ title: 'a'.repeat(201), body: 'Nội dung đủ dài rồi' }).title, 'Tiêu đề từ 5 đến 200 ký tự');
  assert.equal(R.validateTopic({ title: '!!!!!!!', body: 'Nội dung đủ dài rồi' }).title, 'Tiêu đề cần có chữ hoặc số');
  assert.equal(R.validateTopic({ title: "\u200B\u200B\u200B\u200B\u200B", body: "Nội dung đủ dài rồi" }).title, "Vui lòng nhập tiêu đề");
});

test('tiêu đề: biên 5 và 200 ký tự hợp lệ, emoji đếm 1 ký tự', () => {
  assert.deepEqual(R.validateTopic({ title: 'Squat', body: 'Nội dung đủ dài rồi' }), {});
  assert.deepEqual(R.validateTopic({ title: 'a'.repeat(200), body: 'Nội dung đủ dài rồi' }), {});
  assert.equal(R.charCount('💪💪💪'), 3);
  assert.equal(R.validateTopic({ title: '💪💪💪💪💪', body: 'Nội dung đủ dài rồi' }).title, 'Tiêu đề cần có chữ hoặc số');
});

test('nội dung chủ đề: 9 ký tự lỗi, 10 ký tự được, 10.001 lỗi, cả hai lỗi cùng lúc', () => {
  assert.equal(R.validateTopic({ title: 'Tiêu đề ổn', body: '123456789' }).body, 'Nội dung từ 10 đến 10.000 ký tự');
  assert.deepEqual(R.validateTopic({ title: 'Tiêu đề ổn', body: '1234567890' }), {});
  assert.equal(R.validateTopic({ title: 'Tiêu đề ổn', body: 'a'.repeat(10001) }).body, 'Nội dung từ 10 đến 10.000 ký tự');
  assert.deepEqual(Object.keys(R.validateTopic({ title: '', body: '' })).sort(), ['body', 'title']);
});

test('trả lời: rỗng, 1 ký tự, 2 ký tự, quá 5.000, chỉ dấu chấm', () => {
  assert.equal(R.validateReply('   '), 'Vui lòng nhập nội dung trả lời');
  assert.equal(R.validateReply(' a '), 'Trả lời từ 2 đến 5.000 ký tự');
  assert.equal(R.validateReply('ok'), null);
  assert.equal(R.validateReply('a'.repeat(5001)), 'Trả lời từ 2 đến 5.000 ký tự');
  assert.equal(R.validateReply('....'), 'Trả lời cần có chữ hoặc số');
  assert.equal(R.validateReply('👍 đúng rồi'), null);
});

test('lý do báo cáo / ẩn bài: 4 ký tự lỗi, 5 ký tự được, 256 lỗi', () => {
  assert.equal(R.validateReason('spam'), 'Lý do từ 5 đến 255 ký tự');
  assert.equal(R.validateReason('spam!'), null);
  assert.equal(R.validateReason('x'.repeat(256)), 'Lý do từ 5 đến 255 ký tự');
});

test('quyền trả lời: khách, phiên hết hạn, chủ đề ẩn, chủ đề khoá', () => {
  assert.equal(R.replyBlock(null, topic()), 'guest');
  assert.equal(R.replyBlock('MEMBER', topic({ viewerSignedIn: false })), 'expired');
  assert.equal(R.replyBlock('MEMBER', topic({ hidden: true })), 'hidden');
  assert.equal(R.replyBlock('ADMIN', topic({ hidden: true, canModerate: true })), 'hidden');
  assert.equal(R.replyBlock('MEMBER', topic({ locked: true })), 'locked');
  assert.equal(R.replyBlock('TRAINER', topic({ locked: true, canModerate: true })), null);
});

test('hội viên đã đăng nhập trả lời được chủ đề của quản lý khi chủ đề không khoá', () => {
  assert.equal(R.replyBlock('MEMBER', topic()), null);
  assert.equal(R.replyBlock('TRAINER', topic()), null);
});

test('kiểm duyệt: HLV không ẩn / khoá bài của quản lý; quản lý kiểm duyệt mọi bài; hội viên không', () => {
  assert.equal(R.canModerateAuthor('TRAINER', 'ADMIN'), false);
  assert.equal(R.canModerateAuthor('TRAINER', 'MEMBER'), true);
  assert.equal(R.canModerateAuthor('TRAINER', 'TRAINER'), true);
  assert.equal(R.canModerateAuthor('ADMIN', 'ADMIN'), true);
  assert.equal(R.canModerateAuthor('MEMBER', 'MEMBER'), false);
  assert.equal(R.canModerateAuthor(null, 'MEMBER'), false);
});

test('sửa trả lời: chỉ bài của mình, không khi bị ẩn hoặc chủ đề khoá (trừ nhân viên)', () => {
  const mine = { mine: true, hidden: false };
  assert.equal(R.canEditReply(mine, topic()), true);
  assert.equal(R.canEditReply({ mine: false, hidden: false }, topic()), false);
  assert.equal(R.canEditReply({ mine: true, hidden: true }, topic()), false);
  assert.equal(R.canEditReply(mine, topic({ hidden: true })), false);
  assert.equal(R.canEditReply(mine, topic({ locked: true })), false);
  assert.equal(R.canEditReply(mine, topic({ locked: true, canModerate: true })), true);
});
