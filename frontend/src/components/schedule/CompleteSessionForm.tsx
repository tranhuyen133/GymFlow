import React from 'react';

/**
 * CHỦ FILE: Linh (Hồ Khánh Linh)
 * TASK: SCRUM-196 · HẠN: 06/11/2026
 * CẦN LÀM: Form hoàn thành buổi (LOG-01). Phương kèm.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

export interface CompleteSessionFormProps {
  scheduleId?: number;
  onSuccess?: () => void;
}

export function CompleteSessionForm({ scheduleId, onSuccess }: CompleteSessionFormProps) {
  // TODO(Linh): Form hoàn thành buổi tập (LOG-01). Phương kèm.
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSuccess?.(); }}>
      <h3>Hoàn thành buổi tập #{scheduleId}</h3>
      <button type="submit">Xác nhận hoàn thành</button>
    </form>
  );
}

export default CompleteSessionForm;
