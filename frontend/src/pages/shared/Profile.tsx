/**
 * CHỦ FILE: Linh (Hồ Khánh Linh)
 * TASK: SCRUM-150 · HẠN: 29/10/2026
 * CẦN LÀM: Màn hình hồ sơ cá nhân và đổi mật khẩu (UI-03, USR-04).
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { Gender, Me, Member, MemberTimeSlot, TimeSlot, Trainer } from '../../api/types';
import { useAuth, useMe } from '../../auth/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AvatarEditor, MyAvatar } from '../../components/AvatarEditor';
import { Icon, type IconName } from '../../components/Icon';
import { ProgressPanel } from '../../components/ProgressPanel';
import MyJourney from '../member/MyJourney';
import { useToast } from '../../components/Toast';
import { WeekSlots } from '../../components/WeekSlots';
import { Alert, Badge, Button, Card, Confirm, ErrorState, Field, Input, LoadingBlock, PasswordInput, Select, StatusBadge, Textarea } from '../../components/ui';
import { t } from '../../i18n';
import { DAY_NAMES, fmtDate, fmtDateTime, genderLabel, memberStatus, roleLabel, subState, todayIso } from '../../lib/format';
import { covered, GYM_CLOSE, GYM_OPEN, hm, mergeSlots, slotError, type WeekSlot } from '../../lib/hours';
import { errMsg, fieldErrs, useAsync } from '../../lib/hooks';
import { checkDateOfBirth, checkFullName, checkHeight, checkPhone, HAS_DIGIT, NOT_NUMBER, NOT_PHONE, toNumber, useLiveErrors } from '../../lib/validation';

type Section = 'info' | 'training' | 'progress' | 'journey' | 'security';

export default function Profile() {
  const me = useMe();
  const [params, setParams] = useSearchParams();
  const requestedTab = (params.get('tab') as Section) || 'info';

  const [editAvatar, setEditAvatar] = useState(false);
  const [askLogout, setAskLogout] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  // Hồ sơ hội viên tải 1 lần ở đây để dùng cho cả phần đầu trang (gói, ngày tham gia) lẫn thẻ hồ sơ tập luyện
  const member = useAsync<Member | null>(() => (me.role === 'MEMBER' ? api.get<Member>('/members/me') : Promise.resolve(null)), [me.role]);
  const sections: { id: Section; label: string; icon: IconName }[] = [
    { id: 'info', label: 'Thông tin cá nhân', icon: 'user' },
    ...(me.role === 'MEMBER' ? [
      { id: 'training' as Section, label: 'Thể trạng & Mục tiêu', icon: 'heart' as IconName },
      { id: 'progress' as Section, label: 'Tiến độ & Cân nặng', icon: 'chart' as IconName },
      { id: 'journey' as Section, label: 'Hành trình', icon: 'trophy' as IconName },
    ] : []),
    ...(me.role === 'TRAINER' && me.trainerId ? [{ id: 'training' as Section, label: 'Chuyên môn & ca làm', icon: 'badge' as IconName }] : []),
    { id: 'security', label: 'Bảo mật & Cài đặt', icon: 'shield' },
  ];

  const section = sections.some((s) => s.id === requestedTab) ? requestedTab : 'info';
  const setSection = (s: Section) => {
    params.set('tab', s);
    setParams(params);
  };
  const m = member.data;

  return (
    <div className="page">
      <section className="profile-hero">
        <div className="profile-hero-bg" aria-hidden />
        <button type="button" className="profile-avatar" onClick={() => setEditAvatar(true)} aria-label={t('Đổi ảnh đại diện')}>
          <MyAvatar size="xl" />
          <span className="profile-avatar-cam"><Icon name="camera" size={16} /></span>
        </button>
        <div className="profile-id">
          <div className="eyebrow-sm">{t('Hồ sơ cá nhân')}</div>
          <h1>{me.fullName}</h1>
          <div className="small muted ellipsis">{me.email}{me.phone && ` · ${me.phone}`}</div>
          <div className="row row-wrap mt-8" style={{ gap: 6 }}>
            <Badge tone="green">{roleLabel[me.role]}</Badge>
            {m && <StatusBadge map={memberStatus} value={m.status} />}
            {m?.code && <Badge tone="muted">{m.code}</Badge>}
          </div>
        </div>
        <dl className="profile-facts">
          {m && <div><dt>{t('Ngày tham gia')}</dt><dd>{fmtDate(m.joinedAt)}</dd></div>}
          {m && (
            <div>
              <dt>{t('Gói hiện tại')}</dt>
              <dd>{m.currentPlanName ? <>{t(m.currentPlanName)} <StatusBadge map={subState} value={m.subscriptionState} /></> : <span className="faint">{t('Chưa có gói')}</span>}</dd>
            </div>
          )}
          {m?.daysLeft != null && m.currentPlanName && <div><dt>{t('Còn lại')}</dt><dd>{t('{n} ngày', { n: m.daysLeft })}</dd></div>}
          <div><dt>{t('Lần đăng nhập')}</dt><dd>{fmtDateTime(me.lastLoginAt)}</dd></div>
        </dl>
      </section>

      <div className="profile-tabs" role="tablist" aria-label={t('Các mục hồ sơ')}>
        {sections.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={section === s.id} className={`profile-tab ${section === s.id ? 'on' : ''}`} onClick={() => setSection(s.id)}>
            <Icon name={s.icon} size={16} />{t(s.label)}
          </button>
        ))}
      </div>

      <div className="profile-panel" role="tabpanel">
        {section === 'info' && (
          <div className="grid grid-main" style={{ alignItems: 'start' }}>
            <AccountCard onAvatar={() => setEditAvatar(true)} />
            <Card title={t('Ảnh đại diện')} icon="user">
              <div className="row" style={{ gap: 14 }}>
                <MyAvatar size="lg" />
                <div className="grow">
                  <p className="small muted" style={{ margin: 0 }}>{me.avatarUpdatedAt ? t('Cập nhật lần cuối {d}', { d: fmtDateTime(me.avatarUpdatedAt) }) : t('Đang dùng ảnh mặc định (chữ viết tắt tên).')}</p>
                  <Button size="sm" icon="upload" className="mt-8" onClick={() => setEditAvatar(true)}>{me.avatarUpdatedAt ? t('Đổi ảnh') : t('Tải ảnh lên')}</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
        {section === 'training' && me.role === 'MEMBER' && (m ? <div className="stack" style={{ gap: 18 }}><MemberSelfCard data={m} onSaved={member.reload} /><TimePreferenceCard /></div> : member.error ? <Alert kind="error">{member.error}</Alert> : <Card><LoadingBlock /></Card>)}
        {section === 'training' && me.role === 'TRAINER' && me.trainerId && <div className="stack" style={{ gap: 18 }}><TrainerSelfCard trainerId={me.trainerId} /></div>}
        {section === 'progress' && me.role === 'MEMBER' && (
          <div>
            {me.memberId ? <ProgressPanel memberId={me.memberId} /> : <Alert kind="warning">{t('Tài khoản chưa có hồ sơ hội viên')}</Alert>}
          </div>
        )}
        {section === 'journey' && me.role === 'MEMBER' && (
          <div>
            <MyJourney embedded />
          </div>
        )}
        {section === 'security' && (
          <div className="grid grid-main" style={{ alignItems: 'start' }}>
            <PasswordCard />
            <Card title={t('Phiên đăng nhập')} icon="shield">
              <dl className="kv small">
                <dt>{t('Vai trò')}</dt><dd><Badge tone="green">{roleLabel[me.role]}</Badge></dd>
                <dt>{t('Lần đăng nhập')}</dt><dd>{fmtDateTime(me.lastLoginAt)}</dd>
              </dl>
              <p className="tiny faint mt-16">{t('Tài khoản bị khoá sẽ mất quyền truy cập ngay cả khi đang đăng nhập.')}</p>
              <Button variant="danger" icon="logout" block className="mt-16" onClick={() => setAskLogout(true)}>{t('Đăng xuất')}</Button>
            </Card>
          </div>
        )}
      </div>

      {editAvatar && <AvatarEditor onClose={() => setEditAvatar(false)} />}
      {askLogout && <Confirm title={t('Đăng xuất?')} message={t('Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng GymFlow.')} confirmText={t('Đăng xuất')}
        onClose={() => setAskLogout(false)} onConfirm={() => { logout(); navigate('/login'); }} />}
    </div>
  );
}

function AccountCard({ onAvatar }: { onAvatar: () => void }) {
  const me = useMe();
  const { refresh } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState(me.fullName);
  const [phone, setPhone] = useState(me.phone ?? '');
  const live = useLiveErrors({ fullName: checkFullName, phone: checkPhone }, { fullName: HAS_DIGIT, phone: NOT_PHONE });
  const errors = live.errors;
  const [busy, setBusy] = useState(false);
  const dirty = fullName !== me.fullName || phone !== (me.phone ?? '');
  const submit = async () => {
    if (!live.validateAll({ fullName, phone })) return;
    setBusy(true);
    try { await api.put<Me>('/auth/me', { fullName: fullName.trim().replace(/\s+/g, ' '), phone: phone.trim() }); await refresh(); toast.success(t('Đã lưu thông tin')); }
    catch (e) { toast.error(errMsg(e)); live.setErrors(fieldErrs(e)); } finally { setBusy(false); }
  };
  return (
    <Card title={t('Thông tin tài khoản')} icon="user" actions={<Button size="sm" variant="primary" loading={busy} disabled={!dirty || Object.keys(errors).length > 0} onClick={submit}>{t('Lưu')}</Button>}>
      <div className="row" style={{ gap: 14, marginBottom: 18 }}>
        <button type="button" className="avatar-btn" onClick={onAvatar} aria-label={t('Đổi ảnh đại diện')}><MyAvatar size="lg" /></button>
        <div style={{ minWidth: 0 }}><b style={{ fontSize: 18 }}>{me.fullName}</b><div className="small muted ellipsis">{me.email}</div></div>
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

function MemberSelfCard({ data, onSaved }: { data: Member; onSaved: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ dateOfBirth: '', gender: '' as Gender | '', heightCm: '', goal: '', address: '' });
  useEffect(() => {
    setF({ dateOfBirth: data.dateOfBirth ?? '', gender: data.gender ?? '', heightCm: data.heightCm ? String(data.heightCm) : '', goal: data.goal ?? '', address: data.address ?? '' });
  }, [data]);
  const live = useLiveErrors({ dateOfBirth: checkDateOfBirth, heightCm: checkHeight }, { heightCm: NOT_NUMBER });
  const errors = live.errors;
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!live.validateAll({ dateOfBirth: f.dateOfBirth, heightCm: f.heightCm })) return;
    setBusy(true);
    try {
      await api.put('/members/me', { phone: data.phone ?? '', dateOfBirth: f.dateOfBirth || null, gender: f.gender || null, heightCm: toNumber(f.heightCm), goal: f.goal.trim(), address: f.address.trim() });
      toast.success(t('Đã lưu hồ sơ tập luyện'));
      onSaved();
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

/** Sửa ca làm theo tuần; dùng ở hồ sơ HLV và trang quản lý HLV. HLV xếp ca theo giờ tập mong muốn của hội viên mình phụ trách. */
export function ShiftEditor({ trainer, onSaved }: { trainer: Trainer; onSaved: () => void }) {
  const toast = useToast();
  const [shifts, setShifts] = useState<WeekSlot[]>(trainer.shifts);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prefs = useAsync(() => api.get<MemberTimeSlot[]>(`/trainers/${trainer.id}/member-preferences`), [trainer.id]);
  useEffect(() => setShifts(trainer.shifts), [trainer]);
  const dirty = JSON.stringify(shifts.map((s) => [s.dayOfWeek, hm(s.startTime), hm(s.endTime)]).sort())
    !== JSON.stringify(trainer.shifts.map((s) => [s.dayOfWeek, hm(s.startTime), hm(s.endTime)]).sort());
  const wanted = prefs.data ?? [];
  const uncovered = wanted.filter((p) => !covered(shifts, p));
  const memberCount = new Set(wanted.map((p) => p.memberId)).size;

  const save = async () => {
    setError(null);
    const bad = slotError(shifts, (d) => DAY_NAMES[d - 1], 'Ca');
    if (bad) { setError(bad); return; }
    setBusy(true);
    try {
      await api.put(`/trainers/${trainer.id}/shifts`, { shifts: shifts.map((s) => ({ dayOfWeek: s.dayOfWeek, startTime: hm(s.startTime), endTime: hm(s.endTime) })) });
      toast.success(t('Đã lưu ca làm việc')); onSaved();
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };
  // Thêm ca phủ các khung giờ hội viên chưa có ca, gộp với ca đang có; HLV xem lại rồi bấm Lưu
  const fromMembers = () => {
    const next = mergeSlots([...shifts, ...uncovered]);
    const over = slotError(next, (d) => DAY_NAMES[d - 1], 'Ca');
    setShifts(next);
    toast.info(over ? t('Đã thêm ca theo giờ hội viên – còn lỗi cần sửa trước khi lưu') : t('Đã thêm ca theo giờ hội viên, kiểm tra rồi bấm Lưu ca'));
    if (over) setError(over); else setError(null);
  };

  return (
    <Card title={t('Ca làm việc trong tuần')} icon="clock" actions={<>
      {uncovered.length > 0 && <Button size="sm" icon="sparkle" onClick={fromMembers}>{t('Xếp ca theo giờ hội viên')}</Button>}
      <Button size="sm" variant="primary" loading={busy} disabled={!dirty} onClick={save}>{t('Lưu ca')}</Button>
    </>}>
      <div className="hours-note">
        <Icon name="info" size={15} />
        <span>{t('Phòng tập mở cửa {open}–{close}. Ca dài từ 30 phút, mỗi ngày tối đa 3 ca, không chồng giờ nhau.', { open: GYM_OPEN, close: GYM_CLOSE })}</span>
        {prefs.data && (memberCount > 0
          ? (uncovered.length === 0
            ? <Badge tone="green">{t('Đã phủ hết giờ tập của {n} hội viên', { n: memberCount })}</Badge>
            : <Badge tone="amber">{t('{n} khung giờ hội viên chưa có ca', { n: uncovered.length })}</Badge>)
          : <Badge tone="muted">{t('Hội viên phụ trách chưa khai giờ tập')}</Badge>)}
      </div>
      {error && <div className="mt-8"><Alert kind="error">{error}</Alert></div>}
      {prefs.error && <div className="mt-8"><Alert kind="warning">{t('Không tải được giờ tập của hội viên:')} {prefs.error}</Alert></div>}
      <div className="mt-8">
        <WeekSlots idPrefix={`shift-${trainer.id}`} slots={shifts} onChange={(x) => { setShifts(x); setError(null); }} defaultLength={240}
          extra={(d) => wanted.filter((p) => p.dayOfWeek === d).map((p, k) => {
            const ok = covered(shifts, p);
            return (
              <span key={`${p.memberId}-${k}`} className={`pref-chip ${ok ? 'ok' : 'miss'}`} title={ok ? t('Đã nằm trong ca') : t('Chưa có ca phủ khung giờ này')}>
                <Icon name={ok ? 'check' : 'alert'} size={12} />{p.memberName} · {hm(p.startTime)}–{hm(p.endTime)}
              </span>
            );
          })} />
      </div>
    </Card>
  );
}

/** Hội viên khai giờ muốn đến tập theo tuần để HLV xếp ca và lịch tập theo. */
function TimePreferenceCard() {
  const toast = useToast();
  const saved = useAsync(() => api.get<TimeSlot[]>('/members/me/time-preferences'), []);
  const [slots, setSlots] = useState<WeekSlot[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (saved.data) setSlots(saved.data); }, [saved.data]);
  const key = (xs: WeekSlot[]) => JSON.stringify(xs.map((s) => [s.dayOfWeek, hm(s.startTime), hm(s.endTime)]).sort());
  const dirty = !!saved.data && key(slots) !== key(saved.data);
  const save = async () => {
    setError(null);
    const bad = slotError(slots, (d) => DAY_NAMES[d - 1], 'Giờ tập');
    if (bad) { setError(bad); return; }
    setBusy(true);
    try {
      const res = await api.put<TimeSlot[]>('/members/me/time-preferences', { slots: slots.map((s) => ({ dayOfWeek: s.dayOfWeek, startTime: hm(s.startTime), endTime: hm(s.endTime) })) });
      toast.success(t('Đã lưu giờ tập – huấn luyện viên sẽ xếp lịch theo giờ này'));
      void saved.reload();
      setSlots(res);
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };
  if (saved.error) return <Card><ErrorState message={saved.error} onRetry={saved.reload} /></Card>;
  return (
    <Card title={t('Giờ tập mong muốn')} icon="clock" actions={<Button size="sm" variant="primary" loading={busy} disabled={!dirty} onClick={save}>{t('Lưu')}</Button>}>
      <div className="hours-note">
        <Icon name="info" size={15} />
        <span>{t('Chọn những khung giờ bạn thường đến được. Huấn luyện viên dựa vào đây để xếp ca và lịch tập. Phòng tập mở cửa {open}–{close}.', { open: GYM_OPEN, close: GYM_CLOSE })}</span>
      </div>
      {error && <div className="mt-8"><Alert kind="error">{error}</Alert></div>}
      <div className="mt-8">{saved.data ? <WeekSlots idPrefix="pref" slots={slots} onChange={(x) => { setSlots(x); setError(null); }} emptyLabel="Không tập" /> : <LoadingBlock />}</div>
    </Card>
  );
}
