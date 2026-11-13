import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { Conversation, TrainerPublic } from '../../api/types';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { Avatar, Button, ErrorState, LoadingBlock } from '../../components/ui';
import { DAY_NAMES, DAYS } from '../../lib/format';
import { errMsg, useAsync } from '../../lib/hooks';
import { t } from '../../i18n';
import { useAssignedTrainers } from './Coaches';
import { canMessage, certificateList, isoDay, shiftHours, shiftsByDay, splitSpecialties, todayShift, weeklyHours } from './coachRules';
import './coaches.css';

export default function CoachDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const validId = !!id && /^\d+$/.test(id);
  const { data: coach, error, loading, reload } = useAsync(
    () => (validId ? api.get<TrainerPublic>(`/trainers/public/${id}`) : Promise.reject(new Error(t('Không tìm thấy thông tin huấn luyện viên')))),
    [id],
  );
  const assigned = useAssignedTrainers();
  const [startingChat, setStartingChat] = useState(false);

  const back = <Link to="/coaches" className="cd-back"><Icon name="chevronLeft" size={16} />{t('Quay lại danh sách huấn luyện viên')}</Link>;

  if (loading) return <div className="page cd">{back}<LoadingBlock rows={6} /></div>;
  if (error || !coach) {
    return (
      <div className="page cd">
        {back}
        <ErrorState message={error ?? t('Không tìm thấy thông tin huấn luyện viên')} onRetry={validId ? reload : undefined} />
      </div>
    );
  }

  const startChat = async () => {
    if (startingChat) return;
    try {
      setStartingChat(true);
      const res = await api.post<Conversation>('/conversations', { trainerId: coach.id });
      navigate(`/messages/${res.id}`);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setStartingChat(false);
    }
  };

  const now = new Date();
  const today = isoDay(now);
  const shift = todayShift(coach.shifts, now);
  const specs = splitSpecialties(coach.specialty);
  const certs = certificateList(coach.certificates);
  const byDay = shiftsByDay(coach.shifts);
  const mine = assigned?.has(coach.id) ?? false;
  const chatOk = canMessage(coach.id, assigned);

  return (
    <div className="page cd">
      {back}

      <section className="cd-hero">
        <Avatar name={coach.fullName} src={coach.avatar} size="xl" />
        <div className="cd-info">
          <div className="cz-specs">
            {mine && <span className="cz-mine"><Icon name="checkCircle" size={13} />{t('HLV của bạn')}</span>}
            {(specs.length ? specs : [t('Huấn luyện thể hình')]).map((s) => <span key={s} className="cz-spec">{t(s)}</span>)}
          </div>
          <h1 className="cd-name">{coach.fullName}</h1>
          <div className="cd-facts">
            <span><Icon name="trophy" size={15} />{t('{n} năm kinh nghiệm', { n: coach.experienceYears })}</span>
            <span><Icon name="calendar" size={15} />{t('{n} ca/tuần · {h} giờ', { n: coach.shifts.length, h: weeklyHours(coach.shifts) })}</span>
            <span className={shift ? 'ok' : ''}><Icon name="clock" size={15} />
              {shift ? t('Có ca hôm nay {start}–{end}', { start: shift.startTime.slice(0, 5), end: shift.endTime.slice(0, 5) }) : t('Hôm nay nghỉ')}
            </span>
          </div>
        </div>
        <div className="cd-cta">
          {chatOk ? (
            <Button variant="primary" icon="message" loading={startingChat} onClick={startChat}>{t('Nhắn tin với HLV')}</Button>
          ) : (
            <Link to="/me/packages?tab=catalog" className="btn btn-primary"><Icon name="ticket" /><span>{t('Đăng ký gói có PT')}</span></Link>
          )}
          {chatOk && <Link to="/me/packages?tab=catalog" className="btn btn-secondary"><Icon name="ticket" /><span>{t('Xem bảng giá gói tập')}</span></Link>}
        </div>
      </section>

      <div className="cd-grid">
        <div className="cd-main">
          <section className="cd-section">
            <h3><span className="cd-ic"><Icon name="user" size={16} /></span>{t('Giới thiệu')}</h3>
            <p className="cd-text">{coach.bio || t('Huấn luyện viên chưa cập nhật phần giới thiệu.')}</p>
          </section>

          <section className="cd-section">
            <h3><span className="cd-ic"><Icon name="calendar" size={16} /></span>{t('Lịch làm việc trong tuần')}</h3>
            {coach.shifts.length === 0 ? (
              <p className="cd-text">{t('Huấn luyện viên chưa đăng ký ca cố định. Bạn có thể nhắn tin để trao đổi lịch hẹn cụ thể.')}</p>
            ) : (
              <>
                <div className="cd-days">
                  {byDay.map((list, i) => (
                    <div key={DAYS[i]} className={`cd-day ${today === i + 1 ? 'today' : ''}`} title={DAY_NAMES[i]}>
                      <b>{DAYS[i]}</b>
                      {list.length === 0 ? <span className="cd-off">{t('Nghỉ')}</span> : list.map((s, k) => (
                        <span key={s.id ?? k} className="cd-slot">{s.startTime.slice(0, 5)}<br />{s.endTime.slice(0, 5)}</span>
                      ))}
                    </div>
                  ))}
                </div>
                <p className="cd-note">{t('Tổng {h} giờ mỗi tuần. Khung giờ có thể thay đổi – nhắn HLV để xác nhận trước khi đến.', { h: weeklyHours(coach.shifts) })}</p>
              </>
            )}
          </section>
        </div>

        <aside className="cd-side">
          <section className="cd-section">
            <h3><span className="cd-ic"><Icon name="badge" size={16} /></span>{t('Bằng cấp & Chứng chỉ')}</h3>
            {certs.length ? (
              <div className="cd-certs">{certs.map((c) => <span key={c} className="cd-cert"><Icon name="checkCircle" size={14} />{c}</span>)}</div>
            ) : <p className="cd-text">{t('Chưa cập nhật chứng chỉ.')}</p>}
          </section>
          {shift && (
            <section className="cd-section">
              <h3><span className="cd-ic"><Icon name="clock" size={16} /></span>{t('Ca hôm nay')}</h3>
              <p className="cd-text">{t('{start}–{end} ({h} giờ)', { start: shift.startTime.slice(0, 5), end: shift.endTime.slice(0, 5), h: shiftHours(shift.startTime, shift.endTime) ?? '—' })}</p>
            </section>
          )}
          <section className="cd-section">
            <h3><span className="cd-ic"><Icon name="message" size={16} /></span>{chatOk ? t('Trao đổi với HLV') : t('Muốn tập cùng HLV này?')}</h3>
            <p className="cd-text">
              {chatOk
                ? t('Nhắn tin để hỏi về giáo án, kỹ thuật hoặc đổi lịch tập. Bạn có thể gửi kèm ảnh, video hoặc tệp.')
                : t('Bạn có thể nhắn tin trực tiếp với HLV đang phụ trách mình. Đăng ký gói có PT để được ghép HLV.')}
            </p>
            {chatOk
              ? <Button variant="primary" icon="message" block loading={startingChat} onClick={startChat}>{t('Nhắn tin ngay')}</Button>
              : <Link to="/me/packages?tab=catalog" className="btn btn-primary btn-block"><Icon name="ticket" /><span>{t('Xem gói có PT')}</span></Link>}
          </section>
        </aside>
      </div>
    </div>
  );
}
