/**
 * CHỦ FILE: Linh (Hồ Khánh Linh)
 * TASK: SCRUM-150 · HẠN: 29/10/2026
 * CẦN LÀM: Màn hình hồ sơ cá nhân và đổi mật khẩu (UI-03, USR-04).
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { Gender, Me, Member, Shift, Trainer } from '../../api/types';
import { useAuth, useMe } from '../../auth/AuthContext';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { Alert, Avatar, Badge, Button, Card, ErrorState, Field, Input, LoadingBlock, PageHead, PasswordInput, Select, Textarea } from '../../components/ui';
import { t } from '../../i18n';
import { DAY_NAMES, fmtDateTime, genderLabel, roleLabel, todayIso } from '../../lib/format';
import { errMsg, fieldErrs, useAsync } from '../../lib/hooks';
import { checkDateOfBirth, checkFullName, checkHeight, checkPhone, HAS_DIGIT, NOT_NUMBER, NOT_PHONE, toNumber, useLiveErrors } from '../../lib/validation';

export default function Profile() {
  const me = useMe();
  return (
    <div className="page">
      <PageHead eyebrow={t('Tài khoản')} title={t('Hồ sơ cá nhân')} desc={t('Cập nhật thông tin liên hệ, đổi mật khẩu và các thông tin theo vai trò.')} />
      <div className="grid grid-main" style={{ alignItems: 'start' }}>
        <div className="stack" style={{ gap: 18 }}>
          <AccountCard />
          {me.role === 'MEMBER' && <MemberSelfCard />}
          {me.role === 'TRAINER' && me.trainerId && <TrainerSelfCard trainerId={me.trainerId} />}
        </div>
        <div className="stack" style={{ gap: 18 }}>
          <PasswordCard />
          <Card title={t('Phiên đăng nhập')} icon="shield">
            <dl className="kv small">
              <dt>{t('Vai trò')}</dt><dd><Badge tone="green">{roleLabel[me.role]}</Badge></dd>
              <dt>{t('Lần đăng nhập')}</dt><dd>{fmtDateTime(me.lastLoginAt)}</dd>
            </dl>
            <p className="tiny faint mt-16">{t('Tài khoản bị khoá sẽ mất quyền truy cập ngay cả khi đang đăng nhập.')}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AccountCard() {
  const me = useMe();
  const { refresh } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState(me.fullName);
  const [phone, setPhone] = useState(me.phone ?? '');
  const live = useLiveErrors({ fullName: checkFullName, phone: checkPhone }, { fullName: HAS_DIGIT, phone: NOT_PHONE });
  const errors = live.errors;
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!live.validateAll({ fullName, phone })) return;
    setBusy(true);
    try { await api.put<Me>('/auth/me', { fullName: fullName.trim().replace(/\s+/g, ' '), phone: phone.trim() }); await refresh(); toast.success(t('Đã lưu thông tin')); }
    catch (e) { toast.error(errMsg(e)); live.setErrors(fieldErrs(e)); } finally { setBusy(false); }
  };
  return (
    <Card title={t('Thông tin tài khoản')} icon="user" actions={<Button size="sm" variant="primary" loading={busy} disabled={Object.keys(errors).length > 0} onClick={submit}>{t('Lưu')}</Button>}>
      <div className="row" style={{ gap: 14, marginBottom: 18 }}>
        <Avatar name={me.fullName} size="lg" />
        <div><b style={{ fontSize: 18 }}>{me.fullName}</b><div className="small muted">{me.email}</div></div>
      </div>
      <div className="form-grid">
        <Field label={t('Họ và tên')} error={errors.fullName} required>
          <Input maxLength={100} autoComplete="name" value={fullName} invalid={!!errors.fullName}
            onChange={(e) => { setFullName(e.target.value); live.change('fullName', e.target.value); }} onBlur={(e) => live.blur('fullName', e.target.value)} />
        </Field>
        <Field label={t('Số điện thoại')} error={errors.phone}>
          <Input type="tel" inputMode="tel" autoComplete="tel" maxLength={13} value={phone} invalid={!!errors.phone} placeholder="0912345678"
            onChange={(e) => { setPhone(e.target.value); live.change('phone', e.target.value); }} onBlur={(e) => live.blur('phone', e.target.value)} />
        </Field>
        <Field label={t('Email đăng nhập')} hint={t('Liên hệ quản lý để đổi email')} className="span-2"><Input value={me.email} disabled /></Field>
      </div>
    </Card>
  );
}

function PasswordCard() {
  const toast = useToast();
  const [cur, setCur] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const strength = [/.{8,}/, /[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  const submit = async () => {
    const v: Record<string, string> = {};
    if (!cur) v.currentPassword = t('Nhập mật khẩu hiện tại');
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(pw)) v.newPassword = t('Tối thiểu 8 ký tự, gồm chữ và số');
    if (pw !== pw2) v.confirm = t('Không khớp');
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try { await api.post('/auth/change-password', { currentPassword: cur, newPassword: pw }); toast.success(t('Đã đổi mật khẩu')); setCur(''); setPw(''); setPw2(''); }
    catch (e) { toast.error(errMsg(e)); setErrors(fieldErrs(e)); } finally { setBusy(false); }
  };
  return (
    <Card title={t('Đổi mật khẩu')} icon="key">
      <div className="stack">
        <Field label={t('Mật khẩu hiện tại')} error={errors.currentPassword}><PasswordInput value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" /></Field>
        <Field label={t('Mật khẩu mới')} error={errors.newPassword}><PasswordInput value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></Field>
        {pw && (
          <div className="row" style={{ gap: 4 }}>
            {[1, 2, 3, 4, 5].map((i) => <i key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength ? (strength >= 4 ? 'var(--primary-bright)' : strength >= 3 ? 'var(--warning)' : 'var(--error)') : 'var(--surface)' }} />)}
            <span className="tiny faint" style={{ marginLeft: 6 }}>{strength >= 4 ? t('Mạnh') : strength >= 3 ? t('Khá') : t('Yếu')}</span>
          </div>
        )}
        <Field label={t('Nhập lại mật khẩu mới')} error={errors.confirm}><PasswordInput value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></Field>
        <Button variant="primary" loading={busy} onClick={submit}>{t('Đổi mật khẩu')}</Button>
      </div>
    </Card>
  );
}

function MemberSelfCard() {
  const me = useMe();
  const toast = useToast();
  const { data, error, reload } = useAsync(() => api.get<Member>('/members/me'), []);
  const [f, setF] = useState({ dateOfBirth: '', gender: '' as Gender | '', heightCm: '', goal: '', address: '' });
  useEffect(() => {
    if (data) setF({ dateOfBirth: data.dateOfBirth ?? '', gender: data.gender ?? '', heightCm: data.heightCm ? String(data.heightCm) : '', goal: data.goal ?? '', address: data.address ?? '' });
  }, [data]);
  const live = useLiveErrors({ dateOfBirth: checkDateOfBirth, heightCm: checkHeight }, { heightCm: NOT_NUMBER });
  const errors = live.errors;
  const [busy, setBusy] = useState(false);
  if (error) return <Card><ErrorState message={error} onRetry={reload} /></Card>;
  if (!data) return <Card><LoadingBlock /></Card>;
  const submit = async () => {
    if (!live.validateAll({ dateOfBirth: f.dateOfBirth, heightCm: f.heightCm })) return;
    setBusy(true);
    try {
      await api.put('/members/me', { phone: me.phone ?? '', dateOfBirth: f.dateOfBirth || null, gender: f.gender || null, heightCm: toNumber(f.heightCm), goal: f.goal.trim(), address: f.address.trim() });
      toast.success(t('Đã lưu hồ sơ tập luyện'));
      void reload();
    } catch (e) { toast.error(errMsg(e)); live.setErrors(fieldErrs(e)); } finally { setBusy(false); }
  };
  return (
    <Card title={t('Hồ sơ tập luyện · {code}', { code: data.code })} icon="heart" actions={<Button size="sm" variant="primary" loading={busy} disabled={Object.keys(errors).length > 0} onClick={submit}>{t('Lưu')}</Button>}>
      <div className="form-grid">
        <Field label={t('Ngày sinh')} error={errors.dateOfBirth}>
          <Input type="date" min="1900-01-02" max={todayIso()} autoComplete="bday" value={f.dateOfBirth} invalid={!!errors.dateOfBirth}
            onChange={(e) => { setF({ ...f, dateOfBirth: e.target.value }); live.blur('dateOfBirth', e.target.value); }} />
        </Field>
        <Field label={t('Giới tính')}>
          <Select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value as Gender | '' })}>
            <option value="">—</option>{(Object.keys(genderLabel) as Gender[]).map((g) => <option key={g} value={g}>{genderLabel[g]}</option>)}
          </Select>
        </Field>
        <Field htmlFor="profile-height" label={t('Chiều cao (cm)')} error={errors.heightCm} hint={t('Dùng để tính BMI')}>
          <div className="input-suffix" id="profile-height-wrap">
            <Input id="profile-height" inputMode="decimal" autoComplete="off" value={f.heightCm} invalid={!!errors.heightCm} placeholder="VD: 168"
              onChange={(e) => { setF({ ...f, heightCm: e.target.value }); live.change('heightCm', e.target.value); }} onBlur={(e) => live.blur('heightCm', e.target.value)} />
            <span className="unit">cm</span>
          </div>
        </Field>
        <Field label={t('Mục tiêu')}><Input maxLength={255} autoComplete="off" value={f.goal} placeholder={t('VD: giảm 5 kg trong 3 tháng')} onChange={(e) => setF({ ...f, goal: e.target.value })} /></Field>
        <Field label={t('Địa chỉ')} className="span-2"><Input maxLength={255} autoComplete="street-address" value={f.address} placeholder={t('Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành')} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
        <Field label={t('Huấn luyện viên')} className="span-2" hint={data.trainerName ? undefined : t('Quản lý phòng tập sẽ phân công huấn luyện viên cho bạn')}><Input disabled value={data.trainerName ?? t('Chưa được phân công huấn luyện viên')} /></Field>
      </div>
    </Card>
  );
}

function TrainerSelfCard({ trainerId }: { trainerId: number }) {
  const me = useMe();
  const toast = useToast();
  const { data, error, reload } = useAsync(() => api.get<Trainer>(`/trainers/${trainerId}`), [trainerId]);
  const [f, setF] = useState({ specialty: '', experienceYears: '0', certificates: '', bio: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setF({ specialty: data.specialty ?? '', experienceYears: String(data.experienceYears), certificates: data.certificates ?? '', bio: data.bio ?? '' }); }, [data]);
  if (error) return <Card><ErrorState message={error} onRetry={reload} /></Card>;
  if (!data) return <Card><LoadingBlock /></Card>;
  const submit = async () => {
    setBusy(true);
    try {
      await api.put(`/trainers/${trainerId}`, { fullName: me.fullName, phone: me.phone ?? '', specialty: f.specialty, experienceYears: Number(f.experienceYears) || 0, certificates: f.certificates, bio: f.bio });
      toast.success(t('Đã lưu hồ sơ chuyên môn'));
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <>
      <Card title={t('Hồ sơ chuyên môn')} icon="badge" actions={<Button size="sm" variant="primary" loading={busy} onClick={submit}>{t('Lưu')}</Button>}>
        <div className="form-grid">
          <Field label={t('Chuyên môn')}><Input maxLength={150} value={f.specialty} onChange={(e) => setF({ ...f, specialty: e.target.value })} /></Field>
          <Field label={t('Số năm kinh nghiệm')}><Input type="number" min={0} max={60} value={f.experienceYears} onChange={(e) => setF({ ...f, experienceYears: e.target.value })} /></Field>
          <Field label={t('Chứng chỉ')} className="span-2"><Input maxLength={255} value={f.certificates} onChange={(e) => setF({ ...f, certificates: e.target.value })} /></Field>
          <Field label={t('Giới thiệu')} className="span-2"><Textarea maxLength={1000} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></Field>
        </div>
      </Card>
      <ShiftEditor trainer={data} onSaved={reload} />
    </>
  );
}

/** Sửa ca làm theo tuần; dùng ở hồ sơ HLV và trang quản lý HLV. */
export function ShiftEditor({ trainer, onSaved }: { trainer: Trainer; onSaved: () => void }) {
  const toast = useToast();
  const [shifts, setShifts] = useState<Shift[]>(trainer.shifts);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setShifts(trainer.shifts), [trainer]);
  const hm = (t: string) => t.slice(0, 5);
  const save = async () => {
    setError(null);
    const bad = shifts.find((s) => hm(s.endTime) <= hm(s.startTime));
    if (bad) { setError(t('{day}: giờ kết thúc phải sau giờ bắt đầu', { day: DAY_NAMES[bad.dayOfWeek - 1] })); return; }
    setBusy(true);
    try {
      await api.put(`/trainers/${trainer.id}/shifts`, { shifts: shifts.map((s) => ({ dayOfWeek: s.dayOfWeek, startTime: hm(s.startTime), endTime: hm(s.endTime) })) });
      toast.success(t('Đã lưu ca làm việc')); onSaved();
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };
  const set = (i: number, patch: Partial<Shift>) => setShifts((xs) => xs.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  return (
    <Card title={t('Ca làm việc trong tuần')} icon="clock" actions={<Button size="sm" variant="primary" loading={busy} onClick={save}>{t('Lưu ca')}</Button>}>
      {error && <div style={{ marginBottom: 12 }}><Alert kind="error">{error}</Alert></div>}
      <div className="stack-sm">
        {[1, 2, 3, 4, 5, 6, 7].map((d) => {
          const list = shifts.map((s, i) => ({ s, i })).filter((x) => x.s.dayOfWeek === d);
          return (
            <div key={d} className="row row-wrap" style={{ padding: '8px 0', borderBottom: '1px solid var(--hairline-soft)' }}>
              <b style={{ width: 80 }} className="small">{DAY_NAMES[d - 1]}</b>
              <div className="row row-wrap grow" style={{ gap: 8 }}>
                {list.length === 0 && <span className="tiny faint">{t('Nghỉ')}</span>}
                {list.map(({ s, i }) => (
                  <div key={i} className="row" style={{ gap: 4, background: 'var(--rail)', borderRadius: 10, padding: 4 }}>
                    <input className="input" type="time" style={{ height: 30, width: 104 }} value={hm(s.startTime)} onChange={(e) => set(i, { startTime: e.target.value })} aria-label={t('Bắt đầu')} />
                    <span className="faint">–</span>
                    <input className="input" type="time" style={{ height: 30, width: 104 }} value={hm(s.endTime)} onChange={(e) => set(i, { endTime: e.target.value })} aria-label={t('Kết thúc')} />
                    <Button size="sm" variant="ghost" icon="x" aria-label={t('Bỏ ca')} onClick={() => setShifts((xs) => xs.filter((_, k) => k !== i))} />
                  </div>
                ))}
              </div>
              <Button size="sm" variant="ghost" icon="plus" aria-label={t('Thêm ca')} onClick={() => setShifts((xs) => [...xs, { dayOfWeek: d, startTime: list.length ? '16:00' : '06:00', endTime: list.length ? '21:00' : '11:00' }])} />
            </div>
          );
        })}
      </div>
      <p className="tiny faint mt-8"><Icon name="info" size={12} style={{ display: 'inline', verticalAlign: -2 }} /> {t('Ca trong cùng một ngày không được chồng giờ nhau.')}</p>
    </Card>
  );
}
