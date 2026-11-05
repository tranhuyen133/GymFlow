import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../api/client';
import type { Member, MemberDetail, MemberStatus, Page } from '../api/types';
import { Icon } from './Icon';
import { useDebounced } from '../lib/hooks';
import { t } from '../i18n';

export interface MemberSelectProps {
  id?: string;
  value?: string | number | null;
  /** initial = true khi chỉ là tải lại hội viên đã chọn sẵn (mở form sửa), không phải người dùng vừa chọn. */
  onChange: (memberId: string, member?: Member, initial?: boolean) => void;
  status?: MemberStatus | '';
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  initialMemberName?: string;
  className?: string;
}

type Box = { left: number; width: number; top?: number; bottom?: number; maxHeight: number };

const LIST_MAX = 280;

/**
 * Ô chọn hội viên có tìm kiếm (tên, mã, email, SĐT).
 * Danh sách gợi ý vẽ qua portal ra body với vị trí cố định: nằm trong hộp thoại (modal-body overflow: auto)
 * vẫn hiện đủ, không bị cắt. Hỗ trợ bàn phím ↑ ↓ Enter Esc; Esc chỉ đóng danh sách, không đóng hộp thoại.
 */
export function MemberSelect({
  id,
  value,
  onChange,
  status = 'ACTIVE',
  disabled,
  invalid,
  placeholder = 'Tìm tên, mã, SĐT hội viên…',
  initialMemberName,
  className = '',
}: MemberSelectProps) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(-1);
  const [box, setBox] = useState<Box | null>(null);

  const debouncedQuery = useDebounced(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const listId = useId();

  // Tải hội viên khi value được truyền sẵn (mở form sửa, ?memberId=…) mà chưa có đối tượng
  useEffect(() => {
    if (!value) {
      setSelectedMember(null);
      return;
    }
    const numId = Number(value);
    if (selectedMember && selectedMember.id === numId) return;
    let alive = true;
    api.get<MemberDetail>(`/members/${numId}`)
      .then((res) => {
        if (alive && res?.member) {
          setSelectedMember(res.member);
          onChangeRef.current(String(res.member.id), res.member, true);
        }
      })
      .catch(() => undefined);
    return () => { alive = false; };
  }, [value]);

  const close = () => {
    setIsOpen(false);
    setActive(-1);
    if (selectedMember) setIsSearching(false);
  };

  // Đóng khi bấm ra ngoài ô và ngoài danh sách (danh sách nằm ở portal nên phải kiểm tra cả hai)
  useEffect(() => {
    if (!isOpen) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target) || listRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [isOpen, selectedMember]);

  // Gọi API khi mở danh sách hoặc đổi từ khoá
  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    setLoading(true);
    setFailed(false);
    api.get<Page<Member>>('/members', { q: debouncedQuery.trim(), status: status || undefined, size: 20 })
      .then((res) => { if (alive) { setResults(res.content ?? []); setActive(-1); } })
      .catch(() => { if (alive) { setResults([]); setFailed(true); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [debouncedQuery, status, isOpen]);

  // Vị trí danh sách theo ô nhập; thiếu chỗ phía dưới thì mở lên trên. Cập nhật khi cuộn (kể cả cuộn trong hộp thoại) và đổi cỡ.
  useLayoutEffect(() => {
    if (!isOpen) return;
    const place = () => {
      const el = inputRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const below = window.innerHeight - r.bottom - 8;
      const above = r.top - 8;
      const up = below < 180 && above > below;
      setBox(up
        ? { left: r.left, width: r.width, bottom: window.innerHeight - r.top + 4, maxHeight: Math.min(LIST_MAX, above - 4) }
        : { left: r.left, width: r.width, top: r.bottom + 4, maxHeight: Math.min(LIST_MAX, below - 4) });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [isOpen, isSearching, selectedMember]);

  // Giữ mục đang chọn bằng bàn phím trong tầm nhìn
  useEffect(() => {
    if (active < 0) return;
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const handleSelect = (m: Member) => {
    setSelectedMember(m);
    setIsSearching(false);
    setIsOpen(false);
    setActive(-1);
    setQuery('');
    onChange(String(m.id), m);
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedMember(null);
    setIsSearching(true);
    setQuery('');
    setIsOpen(true);
    onChange('', undefined);
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const startSearch = () => {
    if (disabled) return;
    setIsSearching(true);
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) { setIsOpen(true); return; }
      setActive((i) => (results.length === 0 ? -1 : (i + 1) % results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (results.length === 0 ? -1 : (i <= 0 ? results.length - 1 : i - 1)));
    } else if (e.key === 'Enter') {
      // Không để Enter gửi form khi đang chọn trong danh sách
      if (isOpen && active >= 0 && results[active]) { e.preventDefault(); handleSelect(results[active]); }
      else if (isOpen) e.preventDefault();
    } else if (e.key === 'Escape') {
      if (isOpen) {
        // Hộp thoại nghe Esc ở document: chặn lại để chỉ đóng danh sách
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();
        e.stopPropagation();
        close();
      }
    } else if (e.key === 'Tab') {
      close();
    }
  };

  const hasSelection = !!selectedMember || (!!value && !!initialMemberName);

  if (hasSelection && !isSearching) {
    const displayName = selectedMember ? `${selectedMember.fullName} · ${selectedMember.code}` : (initialMemberName ?? String(value));
    const noPackage = selectedMember && (selectedMember.subscriptionState === 'EXPIRED' || !selectedMember.subscriptionState);
    return (
      <div
        id={id}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-label={t('Hội viên đã chọn: {name}. Bấm để đổi', { name: displayName })}
        className={`input member-select-value ${invalid ? 'has-err' : ''} ${className}`}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.75 : 1 }}
        onClick={startSearch}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startSearch(); } }}
      >
        <span className="ellipsis" style={{ fontWeight: 600, minWidth: 0 }}>
          {displayName}
          {noPackage && <span className="tiny faint" style={{ marginLeft: 6 }}>({t('không có gói')})</span>}
        </span>
        {!disabled && (
          <button type="button" className="btn btn-ghost btn-sm btn-icon" style={{ width: 24, height: 24, padding: 0, flex: 'none' }}
            onClick={handleClear} aria-label={t('Đổi hội viên')} title={t('Đổi hội viên')}>
            <Icon name="x" size={14} />
          </button>
        )}
      </div>
    );
  }

  const list = isOpen && !disabled && box && createPortal(
    <div
      ref={listRef}
      id={listId}
      role="listbox"
      className="member-select-list"
      style={{ position: 'fixed', left: box.left, width: box.width, top: box.top, bottom: box.bottom, maxHeight: box.maxHeight }}
    >
      {loading ? (
        <div className="small muted member-select-msg">{t('Đang tìm…')}</div>
      ) : failed ? (
        <div className="small member-select-msg" style={{ color: 'var(--error)' }}>{t('Không tải được danh sách hội viên, thử lại sau')}</div>
      ) : results.length === 0 ? (
        <div className="small muted member-select-msg">
          {debouncedQuery.trim() ? t('Không tìm thấy hội viên khớp “{q}”', { q: debouncedQuery.trim() }) : t('Chưa có hội viên nào')}
        </div>
      ) : (
        results.map((m, i) => (
          <div
            key={m.id}
            id={`${listId}-${i}`}
            data-idx={i}
            role="option"
            aria-selected={i === active}
            className={`member-select-opt${i === active ? ' active' : ''}`}
            onMouseEnter={() => setActive(i)}
            // mousedown để chọn trước khi ô nhập mất focus
            onMouseDown={(e) => { e.preventDefault(); handleSelect(m); }}
          >
            <div style={{ minWidth: 0 }}>
              <b className="ellipsis">{m.fullName}</b> <span className="muted small">· {m.code}</span>
              {(m.phone || m.email) && <div className="tiny faint ellipsis">{[m.phone, m.email].filter(Boolean).join(' · ')}</div>}
            </div>
            {(m.subscriptionState === 'EXPIRED' || !m.subscriptionState) && (
              <span className="tiny faint" style={{ marginLeft: 8, flex: 'none' }}>({t('không có gói')})</span>
            )}
          </div>
        ))
      )}
    </div>,
    document.body,
  );

  return (
    <div ref={containerRef} className="input-icon" style={{ position: 'relative' }}>
      <Icon name="search" />
      <input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        className={`input ${invalid ? 'has-err' : ''} ${className}`}
        value={query}
        disabled={disabled}
        placeholder={t(placeholder)}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={onKeyDown}
      />
      {list}
    </div>
  );
}
