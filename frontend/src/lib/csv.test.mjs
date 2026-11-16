// SCRUM-207 · RPT-04. Chạy: node --test src/lib/csv.test.mjs (trong frontend). Không thêm thư viện test.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('./csv.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
});
const C = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

const cols = [{ header: 'Họ tên', value: (r) => r.name }, { header: 'Giá trị', value: (r) => r.value }];

test('có BOM UTF-8, dòng CRLF, tiếng Việt giữ nguyên', () => {
  const out = C.toCsv([{ name: 'Nguyễn Thị Ánh', value: 1200000 }], cols);
  assert.ok(out.startsWith('\uFEFF'), 'BOM để Excel nhận UTF-8');
  assert.equal(out, '\uFEFFHọ tên,Giá trị\r\nNguyễn Thị Ánh,1200000\r\n');
});

test('bọc ngoặc kép khi có dấu phẩy, chấm phẩy, ngoặc kép, xuống dòng', () => {
  assert.equal(C.csvCell('Gói 3 tháng, có PT'), '"Gói 3 tháng, có PT"');
  assert.equal(C.csvCell('a;b'), '"a;b"');
  assert.equal(C.csvCell('Gói "VIP"'), '"Gói ""VIP"""');
  assert.equal(C.csvCell('dòng 1\ndòng 2'), '"dòng 1\ndòng 2"');
  assert.equal(C.csvCell('dòng 1\rdòng 2'), '"dòng 1\rdòng 2"');
  assert.equal(C.csvCell('bình thường'), 'bình thường');
});

test('chặn CSV injection: chuỗi bắt đầu bằng = + - @ không chạy như công thức', () => {
  assert.equal(C.csvCell('=HYPERLINK("http://x")'), `"'=HYPERLINK(""http://x"")"`);
  assert.equal(C.csvCell('+1+1'), "'+1+1");
  assert.equal(C.csvCell('-2+3'), "'-2+3");
  assert.equal(C.csvCell('@SUM(A1)'), "'@SUM(A1)");
  assert.equal(C.csvCell('\t=1'), "'\t=1");
});

test('số giữ nguyên (kể cả âm), null/undefined/NaN thành ô trống', () => {
  assert.equal(C.csvCell(-5), '-5');
  assert.equal(C.csvCell(0), '0');
  assert.equal(C.csvCell(75.5), '75.5');
  assert.equal(C.csvCell(null), '');
  assert.equal(C.csvCell(undefined), '');
  assert.equal(C.csvCell(Number.NaN), '');
});

test('csvText: nhãn tháng / phân số không bị Excel đổi thành ngày', () => {
  assert.equal(C.csvText('11/2026'), '11/2026\u200B');
  assert.equal(C.csvText('2026-11-14'), '2026-11-14\u200B');
  assert.equal(C.csvText('3/5'), '3/5\u200B');
  assert.equal(C.csvText('3/5 (vắng 1)'), '3/5 (vắng 1)', 'có chữ thì Excel đã giữ nguyên');
  assert.equal(C.csvText('HLV An'), 'HLV An');
  assert.equal(C.csvText(null), '');
});

test('tên file: luôn .csv, bỏ ký tự cấm', () => {
  assert.equal(C.csvFilename('bao-cao-2026-09-01-2026-11-30'), 'bao-cao-2026-09-01-2026-11-30.csv');
  assert.equal(C.csvFilename('hoi-vien.csv'), 'hoi-vien.csv');
  assert.equal(C.csvFilename('a/b:c*?.CSV'), 'a-b-c-.csv');
  assert.equal(C.csvFilename('   '), 'du-lieu.csv');
});

test('nhiều dòng, cột lấy theo thứ tự khai báo', () => {
  const out = C.toCsv([{ name: 'A', value: 1 }, { name: '=B', value: null }], cols);
  assert.equal(out.split('\r\n').length, 4, 'tiêu đề + 2 dòng + dòng trống cuối');
  assert.equal(out.split('\r\n')[2], "'=B,");
});
