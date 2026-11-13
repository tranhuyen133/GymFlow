import type { Lang } from '../i18n';

export interface LocalizableExercise {
  name: string;
  nameEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
}

export interface LocalizedExercise {
  title: string;
  description: string | null;
  subtitle: string | null;
}

/**
 * Chọn nội dung bài tập theo ngôn ngữ đang xem.
 * - EN: ưu tiên tên/mô tả tiếng Anh, không hiện dòng phụ.
 * - VI: giữ nguyên nội dung tiếng Việt, chỉ hiện tên tiếng Anh làm dòng phụ khi thật sự khác tên chính.
 */
export function localizeExercise(ex: LocalizableExercise, lang: Lang): LocalizedExercise {
  if (lang === 'en') {
    const nameEn = ex.nameEn?.trim();
    const descriptionEn = ex.descriptionEn?.trim();
    return {
      title: nameEn || ex.name,
      description: descriptionEn || ex.description || null,
      subtitle: null,
    };
  }

  const nameEn = ex.nameEn?.trim();
  return {
    title: ex.name,
    description: ex.description ?? null,
    subtitle: nameEn && nameEn.toLowerCase() !== ex.name.trim().toLowerCase() ? nameEn : null,
  };
}
