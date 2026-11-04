import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import type { Member, MemberDetail, MemberStatus, Page } from '../api/types';
import { Icon } from './Icon';
import { useDebounced } from '../lib/hooks';
import { t } from '../i18n';

export interface MemberSelectProps {
  id?: string;
  value?: string | number | null;
  onChange: (memberId: string, member?: Member) => void;
  status?: MemberStatus | '';
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  initialMemberName?: string;
  className?: string;
}

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

  const debouncedQuery = useDebounced(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tải chi tiết hội viên khi có value truyền vào từ ngoài mà chưa có đối tượng
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
          onChange(String(res.member.id), res.member);
        }
      })
      .catch(() => undefined);
    return () => { alive = false; };
  }, [value]);

  // Đóng dropdown khi bấm ra ngoài
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (selectedMember) {
          setIsSearching(false);
        }
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [selectedMember]);

  // Gọi API danh sách hội viên khi mở tìm kiếm
  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    setLoading(true);
    api.get<Page<Member>>('/members', {
      q: debouncedQuery.trim(),
      status: status || undefined,
      size: 20,
    })
      .then((res) => {
        if (alive) {
          setResults(res.content ?? []);
        }
      })
      .catch(() => {
        if (alive) setResults([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [debouncedQuery, status, isOpen]);

  const handleSelect = (m: Member) => {
    setSelectedMember(m);
    setIsSearching(false);
    setIsOpen(false);
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
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const startSearch = () => {
    if (disabled) return;
    setIsSearching(true);
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const hasSelection = !!selectedMember || (!!value && !!initialMemberName);

  if (hasSelection && !isSearching) {
    const displayName = selectedMember ? `${selectedMember.fullName} · ${selectedMember.code}` : (initialMemberName ?? String(value));
    const noPackage = selectedMember && (selectedMember.subscriptionState === 'EXPIRED' || !selectedMember.subscriptionState);
    return (
      <div
        id={id}
        className={`input ${invalid ? 'has-err' : ''} ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.75 : 1,
        }}
        onClick={startSearch}
      >
        <span className="ellipsis" style={{ fontWeight: 600 }}>
          {displayName}
          {noPackage && <span className="tiny faint" style={{ marginLeft: 6 }}>({t('không có gói')})</span>}
        </span>
        {!disabled && (
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon"
            style={{ width: 24, height: 24, padding: 0, marginLeft: 8 }}
            onClick={handleClear}
            aria-label={t('Đổi hội viên')}
            title={t('Đổi hội viên')}
          >
            <Icon name="x" size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="input-icon" style={{ position: 'relative' }}>
      <Icon name="search" />
      <input
        ref={inputRef}
        id={id}
        className={`input ${invalid ? 'has-err' : ''} ${className}`}
        value={query}
        disabled={disabled}
        placeholder={t(placeholder)}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />
      {isOpen && !disabled && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'var(--surface)',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--r-sm)',
            maxHeight: 240,
            overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          }}
        >
          {loading ? (
            <div className="small muted" style={{ padding: '10px 14px' }}>{t('Đang tìm…')}</div>
          ) : results.length === 0 ? (
            <div className="small muted" style={{ padding: '10px 14px' }}>{t('Không tìm thấy hội viên')}</div>
          ) : (
            results.map((m) => (
              <div
                key={m.id}
                role="option"
                tabIndex={0}
                style={{
                  padding: '9px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--hairline)',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--rail)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                onClick={() => handleSelect(m)}
              >
                <div>
                  <b>{m.fullName}</b> <span className="muted small">· {m.code}</span>
                  {m.phone && <div className="tiny faint">{m.phone}</div>}
                </div>
                {(m.subscriptionState === 'EXPIRED' || !m.subscriptionState) && (
                  <span className="tiny faint" style={{ marginLeft: 8 }}>({t('không có gói')})</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
