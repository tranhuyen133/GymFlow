import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { AdminConversationSummary, PageResponse, Trainer } from '../../api/types';
import { Card, Empty, ErrorState, LoadingBlock, PageHead, Pager, Person, SearchInput, Select, Table } from '../../components/ui';
import { ConversationHistoryModal } from '../../components/ConversationHistoryModal';
import { relativeTime } from '../../lib/format';
import { errMsg } from '../../lib/hooks';
import { t } from '../../i18n';

export default function AdminConversations() {
  const [q, setQ] = useState('');
  const [trainerId, setTrainerId] = useState<string>('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const [data, setData] = useState<PageResponse<AdminConversationSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedConv, setSelectedConv] = useState<AdminConversationSummary | null>(null);

  // Load trainers for filter
  useEffect(() => {
    api
      .get<Trainer[]>('/trainers')
      .then(setTrainers)
      .catch(() => {});
  }, []);

  // Fetch paginated admin conversations
  const loadConversations = () => {
    setLoading(true);
    api
      .get<PageResponse<AdminConversationSummary>>('/conversations/admin', {
        q: q.trim() || undefined,
        trainerId: trainerId ? Number(trainerId) : undefined,
        page,
        size,
      })
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadConversations();
  }, [q, trainerId, page, size]);

  const items = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="page">
      <PageHead
        eyebrow={t('Huấn luyện')}
        title={t('Tin nhắn')}
        desc={t('Quản lý và giám sát các cuộc trò chuyện giữa Huấn luyện viên và Hội viên.')}
      />

      <div className="toolbar">
        <SearchInput
          value={q}
          onChange={(val) => {
            setQ(val);
            setPage(0);
          }}
          placeholder={t('Tìm theo tên hội viên, HLV…')}
        />
        <div className="spacer" />
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <Select
            value={trainerId}
            onChange={(e) => {
              setTrainerId(e.target.value);
              setPage(0);
            }}
          >
            <option value="">{t('Tất cả HLV')}</option>
            {trainers.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.fullName}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Card flush>
        {error ? (
          <div style={{ padding: 20 }}>
            <ErrorState message={error} onRetry={loadConversations} />
          </div>
        ) : loading ? (
          <div style={{ padding: 20 }}>
            <LoadingBlock rows={6} />
          </div>
        ) : items.length === 0 ? (
          <Empty
            icon="message"
            title={t('Không có cuộc hội thoại nào')}
            desc={
              q || trainerId
                ? t('Không tìm thấy cuộc trò chuyện nào phù hợp với bộ lọc.')
                : t('Chưa có hội viên và huấn luyện viên nào nhắn tin trong hệ thống.')
            }
          />
        ) : (
          <Table caption={t('Danh sách cuộc hội thoại')}>
            <thead>
              <tr>
                <th>{t('Hội viên')}</th>
                <th>{t('HLV')}</th>
                <th>{t('Tin nhắn cuối')}</th>
                <th className="num">{t('Số tin')}</th>
                <th>{t('Cập nhật lúc')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c: AdminConversationSummary) => (
                <tr
                  key={c.id}
                  className="clickable"
                  onClick={() => setSelectedConv(c)}
                  title={t('Bấm để xem lịch sử chat')}
                >
                  <td>
                    <Person name={c.memberName} src={c.memberAvatar} size="sm" />
                  </td>
                  <td>
                    <Person name={c.trainerName} src={c.trainerAvatar} size="sm" />
                  </td>
                  <td>
                    <div className="ellipsis" style={{ maxWidth: 360 }}>
                      {c.lastMessageSnippet ? (
                        <span>{c.lastMessageSnippet}</span>
                      ) : (
                        <span className="tiny faint">{t('Chưa có tin nhắn')}</span>
                      )}
                    </div>
                  </td>
                  <td className="num">
                    <b>{c.messageCount}</b>
                  </td>
                  <td className="small nowrap muted">
                    {relativeTime(c.lastMessageAt ?? c.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {totalElements > 0 && (
          <Pager
            page={page}
            totalPages={totalPages}
            total={totalElements}
            onPage={setPage}
            size={size}
            sizes={[10, 20, 50]}
            onSize={(s) => {
              setSize(s);
              setPage(0);
            }}
          />
        )}
      </Card>

      {selectedConv && (
        <ConversationHistoryModal
          conversationId={selectedConv.id}
          memberName={selectedConv.memberName}
          trainerName={selectedConv.trainerName}
          memberAvatar={selectedConv.memberAvatar}
          trainerAvatar={selectedConv.trainerAvatar}
          onClose={() => {
            setSelectedConv(null);
            loadConversations();
          }}
        />
      )}
    </div>
  );
}
