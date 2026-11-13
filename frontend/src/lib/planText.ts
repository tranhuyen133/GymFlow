import { getLang, t } from '../i18n';

/** EN ưu tiên bản dịch đã nhập; nếu chưa có thì dịch theo từ điển hoặc giữ tiếng Việt. */
export function localizeText(en: string | null | undefined, vi: string | null | undefined): string {
  const english = en?.trim();
  if (getLang() === 'en' && english) return english;
  return vi ? t(vi) : '';
}

export function localizePlanName(p: { name: string; nameEn?: string | null } | null | undefined): string {
  return p ? localizeText(p.nameEn, p.name) : '';
}

export function localizePlanGoal(p: { goal?: string | null; goalEn?: string | null } | null | undefined): string {
  return p ? localizeText(p.goalEn, p.goal) : '';
}

export function localizeScheduleTitle(s: { title: string; titleEn?: string | null } | null | undefined): string {
  return s ? localizeText(s.titleEn, s.title) : '';
}

export function localizeScheduleNote(s: { note?: string | null; noteEn?: string | null } | null | undefined): string {
  return s ? localizeText(s.noteEn, s.note) : '';
}
