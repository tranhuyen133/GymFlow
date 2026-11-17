/**
 * CHỦ FILE: Huyền (Trần Thị Khánh Huyền)
 * CẦN LÀM: Widget trợ lý AI nổi ở góc màn hình cho hội viên (thu nhỏ / phóng to / neo cạnh).
 */
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Icon } from './Icon';
import { Button } from './ui';
import { AiChatPanel } from './AiChatPanel';
import { t } from '../i18n';
import '../pages/member/AiChat.css';

type WidgetMode = 'corner' | 'expanded' | 'docked';

export function AiChatWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<WidgetMode>('corner');

  if (!user || user.role !== 'MEMBER' || location.pathname === '/member/ai-chat') return null;

  const toggleExpand = () => setMode((current) => (current === 'expanded' ? 'corner' : 'expanded'));
  const toggleDock = () => setMode((current) => (current === 'docked' ? 'corner' : 'docked'));

  return (
    <div className={`aiw ${mode} ${open ? 'open' : ''}`}>
      {open && (
        <section className="aiw-panel" aria-label={t('Trợ lý AI')}>
          <header className="aiw-head">
            <div className="aiw-title">
              <b>{t('Trợ lý AI')}</b>
              <span className="tiny faint">{t('Trả lời từ dữ liệu của bạn')}</span>
            </div>
            <div className="aiw-actions">
              <Button
                size="sm"
                variant="ghost"
                icon="grid"
                title={mode === 'expanded' ? t('Thu nhỏ') : t('Phóng to')}
                aria-label={mode === 'expanded' ? t('Thu nhỏ') : t('Phóng to')}
                onClick={toggleExpand}
              />
              <Button
                size="sm"
                variant="ghost"
                icon={mode === 'docked' ? 'chevronLeft' : 'chevronRight'}
                title={mode === 'docked' ? t('Bỏ neo cạnh') : t('Neo cạnh phải')}
                aria-label={mode === 'docked' ? t('Bỏ neo cạnh') : t('Neo cạnh phải')}
                onClick={toggleDock}
              />
              <Button
                size="sm"
                variant="ghost"
                icon="arrowRight"
                title={t('Mở trang đầy đủ')}
                aria-label={t('Mở trang đầy đủ')}
                onClick={() => { setOpen(false); navigate('/member/ai-chat'); }}
              />
              <Button
                size="sm"
                variant="ghost"
                icon="x"
                title={t('Đóng trợ lý')}
                aria-label={t('Đóng trợ lý')}
                onClick={() => setOpen(false)}
              />
            </div>
          </header>
          <div className="aiw-body">
            <AiChatPanel />
          </div>
        </section>
      )}

      {!(open && mode === 'docked') && (
        <button
          type="button"
          className="aiw-launcher"
          aria-expanded={open}
          aria-label={open ? t('Đóng trợ lý') : t('Mở trợ lý AI')}
          onClick={() => setOpen((value) => !value)}
        >
          <Icon name={open ? 'x' : 'sparkle'} />
          <span>{open ? t('Đóng') : t('Trợ lý AI')}</span>
        </button>
      )}
    </div>
  );
}
