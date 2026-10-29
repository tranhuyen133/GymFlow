/**
 * CHỦ FILE: Linh (Hồ Khánh Linh)
 * TASK: SCRUM-149 · HẠN: 29/10/2026
 * CẦN LÀM: Màn hình 403 Forbidden (UI-04). Phương kèm.
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

import { Forbidden as ForbiddenView } from '../Errors';

export default function Forbidden() {
  return <ForbiddenView />;
}
