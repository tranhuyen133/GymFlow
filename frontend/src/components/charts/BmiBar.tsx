import React from 'react';

/**
 * CHỦ FILE: Phương (Bùi Văn Phương)
 * TASK: SCRUM-195 · HẠN: 10/11/2026
 * CẦN LÀM: Thanh BMI (PRG-04).
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

export interface BmiBarProps {
  bmi?: number;
}

export function BmiBar({ bmi = 0 }: BmiBarProps) {
  // TODO(Phương): Thanh hiển thị BMI chuẩn châu Á (PRG-04)
  return (
    <div>
      <span>Chỉ số BMI: {bmi}</span>
      <div style={{ height: 16, background: '#e0e0e0', borderRadius: 8 }}>
        {/* Thanh phân mức BMI */}
      </div>
    </div>
  );
}

export default BmiBar;
