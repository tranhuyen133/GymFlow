import React from 'react';

/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-214 · HẠN: 13/11/2026
 * CẦN LÀM: Khung duyệt bài tập, gắn vào ExerciseLibrary của Phương.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

export interface ExerciseReviewPanelProps {
  exerciseId?: number;
  onApprove?: () => void;
  onReject?: () => void;
}

export function ExerciseReviewPanel({ exerciseId, onApprove, onReject }: ExerciseReviewPanelProps) {
  // TODO(Tùng): Khung duyệt bài tập, gắn vào ExerciseLibrary của Phương
  return (
    <div className="exercise-review-panel">
      <h4>Duyệt bài tập #{exerciseId}</h4>
      <button onClick={onApprove} type="button">Duyệt bài</button>
      <button onClick={onReject} type="button">Từ chối</button>
    </div>
  );
}

export default ExerciseReviewPanel;
