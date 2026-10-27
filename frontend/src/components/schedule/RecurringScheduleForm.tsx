import React from 'react';

/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-189 · HẠN: 09/11/2026
 * CẦN LÀM: Form xếp lịch lặp, hiện các tuần bị bỏ (SCH-02).
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

export interface RecurringScheduleFormProps {
  onSubmit?: (values: unknown) => void;
}

export function RecurringScheduleForm({ onSubmit }: RecurringScheduleFormProps) {
  // TODO(Tùng): Form xếp lịch lặp tối đa 12 tuần, hiện các tuần bị bỏ do trùng lịch hoặc hết hạn gói (SCH-02)
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit?.({}); }}>
      <h3>Xếp lịch lặp lại</h3>
      <button type="submit">Lưu lịch</button>
    </form>
  );
}

export default RecurringScheduleForm;
