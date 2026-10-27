import React from 'react';

/**
 * CHỦ FILE: Phương (Bùi Văn Phương)
 * TASK: SCRUM-195 · HẠN: 10/11/2026
 * CẦN LÀM: Biểu đồ SVG cân nặng (PRG-03).
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

export interface WeightChartProps {
  data?: Array<{ date: string; weight: number }>;
}

export function WeightChart({ data = [] }: WeightChartProps) {
  // TODO(Phương): Biểu đồ SVG cân nặng theo thời gian (PRG-03)
  return (
    <div>
      <svg width="100%" height="200">
        <text x="50%" y="50%" textAnchor="middle">WeightChart (SVG)</text>
      </svg>
    </div>
  );
}

export default WeightChart;
