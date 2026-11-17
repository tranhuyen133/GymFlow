// Mọi chuỗi tiếng Việt truyền vào t('…') phải có bản tiếng Anh trong i18n/en*.ts,
// để người dùng đổi sang English không còn sót tiếng Việt. Chạy: node --test src/i18n/coverage.check.mjs (v7-apply.sh chạy riêng và báo cảnh báo)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('..', import.meta.url));
const I18N = fileURLToPath(new URL('.', import.meta.url));
const VI = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.d\.ts$/.test(name)) out.push(p);
  }
  return out;
}

function dictKeys() {
  const keys = new Set();
  for (const name of readdirSync(I18N)) {
    if (!/^en.*\.ts$/.test(name)) continue;
    const text = readFileSync(join(I18N, name), 'utf8');
    for (const m of text.matchAll(/(?:^|[{,])\s*'((?:[^'\\\n]|\\.)*)'\s*:/gm)) keys.add(m[1]);
    for (const m of text.matchAll(/(?:^|[{,])\s*"((?:[^"\\\n]|\\.)*)"\s*:/gm)) keys.add(m[1]);
  }
  return keys;
}

test('mọi t(\'…\') tiếng Việt đều có bản tiếng Anh', () => {
  const keys = dictKeys();
  const missing = new Set();
  for (const file of walk(SRC)) {
    if (file.startsWith(I18N)) continue;
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/(?<![\w.$])t\('((?:[^'\\\n]|\\.)*)'/g)) {
      if (VI.test(m[1]) && !keys.has(m[1])) missing.add(`${file.slice(SRC.length)}: ${m[1]}`);
    }
  }
  assert.deepEqual([...missing], [], `Thiếu bản dịch tiếng Anh:\n${[...missing].join('\n')}`);
});

