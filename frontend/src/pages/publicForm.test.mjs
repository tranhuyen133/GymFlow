// Chạy: node --test src/pages/publicForm.test.mjs (trong frontend).
// TypeScript đã là dependency của repo; không thêm test framework/package-lock.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('./publicForm.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
});
const { publicPlanAction, validateReset, focusFormError } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);

let valSource = readFileSync(new URL('../lib/validation.ts', import.meta.url), 'utf8');
valSource = valSource.replace("import { useEffect, useRef, useState } from 'react';", '');
valSource = valSource.replace("import { EMAIL_RE, todayIso } from './format';", "const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$/; const todayIso = () => '2026-11-05';");
const { outputText: valOutput } = ts.transpileModule(valSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
});
const { checkEmail, checkEmailLive, EMAIL_INVALID_MSG } = await import(
  `data:text/javascript;base64,${Buffer.from(valOutput).toString('base64')}`
);

test('SCRUM-144: khách chọn gói đi tới đăng ký; hội viên đi tới gói của mình', () => {
  assert.equal(publicPlanAction().to, '/register');
  assert.equal(publicPlanAction('MEMBER').to, '/me/packages');
});

test('SCRUM-144: quản lý và HLV không bị đưa tới route dành riêng hội viên', () => {
  for (const role of ['ADMIN', 'TRAINER']) assert.equal(publicPlanAction(role).to, '/dashboard');
});

test('SCRUM-145: focus theo thứ tự form, bỏ lỗi API lạ và trường disabled', () => {
  const previous = globalThis.HTMLElement;
  const focused = [];
  class Control {
    constructor(name, disabled = false) { this.name = name; this.disabled = disabled; }
    getAttribute(name) { return name === 'name' ? this.name : null; }
    hasAttribute(name) { return name === 'disabled' && this.disabled; }
    focus() { focused.push(this.name); }
  }
  globalThis.HTMLElement = Control;
  try {
    const form = { elements: [new Control('fullName', true), new Control('email'), new Control('password')] };
    focusFormError(form, { unknown: 'Lỗi', password: 'Lỗi', fullName: 'Lỗi', email: 'Lỗi' });
    assert.deepEqual(focused, ['email']);
    focusFormError(form, { unknown: 'Lỗi' });
    focusFormError(null, { email: 'Lỗi' });
    assert.deepEqual(focused, ['email']);
  } finally {
    if (previous === undefined) delete globalThis.HTMLElement;
    else globalThis.HTMLElement = previous;
  }
});

test('SCRUM-146: yêu cầu mã đủ 8 ký tự, bỏ khoảng trắng ở hai đầu', () => {
  for (const token of ['', '1234567', '123456789']) assert.ok(validateReset(token, 'Password1', 'Password1').token);
  assert.deepEqual(validateReset(' AB12CD34 ', 'Password1', 'Password1'), {});
});

test('SCRUM-146: kiểm tra mật khẩu 8–72 ký tự, có chữ và số', () => {
  for (const password of ['Abc1234', 'abcdefgh', '12345678', 'a'.repeat(72) + '1']) {
    assert.ok(validateReset('AB12CD34', password, password).newPassword);
  }
  for (const password of ['Abc12345', 'a'.repeat(71) + '1']) {
    assert.deepEqual(validateReset('AB12CD34', password, password), {});
  }
});

test('SCRUM-146: không chấp nhận mật khẩu xác nhận rỗng hoặc không khớp', () => {
  assert.ok(validateReset('AB12CD34', 'Password1', '').confirm);
  assert.ok(validateReset('AB12CD34', 'Password1', 'Password2').confirm);
});

test('SCRUM-218: checkEmailLive phát hiện ngay chữ có dấu hoặc khoảng trắng khi đang gõ', () => {
  assert.equal(checkEmailLive('huyền'), EMAIL_INVALID_MSG);
  assert.equal(checkEmailLive('huyền@gmail.com'), EMAIL_INVALID_MSG);
  assert.equal(checkEmailLive('huyen tran@gmail.com'), EMAIL_INVALID_MSG);
  assert.equal(checkEmailLive('trần@domain.vn'), EMAIL_INVALID_MSG);
  assert.equal(checkEmailLive('huyen'), undefined);
  assert.equal(checkEmailLive('huyen@gmail.com'), undefined);
});

test('SCRUM-218: checkEmail kiểm tra toàn diện định dạng email và từ chối chữ có dấu', () => {
  assert.equal(checkEmail(''), 'Vui lòng nhập email');
  assert.equal(checkEmail('   '), 'Vui lòng nhập email');
  assert.equal(checkEmail('huyền@gmail.com'), EMAIL_INVALID_MSG);
  assert.equal(checkEmail('a b@gmail.com'), EMAIL_INVALID_MSG);
  assert.equal(checkEmail('abc@gmail'), EMAIL_INVALID_MSG);
  assert.equal(checkEmail('huyen.tran+gym@gmail.com'), undefined);
  assert.equal(checkEmail('member@gymflow.vn'), undefined);
});
