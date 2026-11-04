import { useState } from 'react';
import { api } from '../api/client';
import type { Subscription } from '../api/types';
import { useToast } from './Toast';
import { Alert, Confirm, Textarea } from './ui';
import { fmtDate } from '../lib/format';
import { errMsg } from '../lib/hooks';
import { t, tn } from '../i18n';

export function CancelSubscriptionModal({ sub, onClose, onDone }: { sub: Subscription; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <Confirm
      danger
      title={t('Huỷ gói {name}?', { name: sub.planName })}
      confirmText="Huỷ gói"
      onClose={onClose}
      message={
        <div className="stack">
          <span>
            {tn('Gói của {name} ({from} → {to}) sẽ hết hiệu lực ngay. Thao tác được ghi vào nhật ký.', {
              name: <b>{sub.memberName}</b>,
              from: fmtDate(sub.startDate),
              to: fmtDate(sub.endDate),
            })}
          </span>
          <Textarea
            maxLength={200}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError(null);
            }}
            placeholder="Lý do huỷ (bắt buộc)"
          />
          {error && <Alert kind="error">{error}</Alert>}
        </div>
      }
      onConfirm={async () => {
        if (!reason.trim()) {
          setError(t('Vui lòng nhập lý do huỷ'));
          throw new Error('missing-reason');
        }
        try {
          await api.put(`/subscriptions/${sub.id}/cancel`, { reason: reason.trim() });
          toast.success(t('Đã huỷ gói'));
          onDone();
        } catch (e) {
          toast.error(errMsg(e));
          throw e;
        }
      }}
    />
  );
}
