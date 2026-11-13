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

export interface LocalizedExerciseContent {
  instructions: string | null;
  steps: string | null;
  setupPosition: string | null;
  breathing: string | null;
  commonMistakes: string | null;
  safetyNotes: string | null;
  suggestedDose: string | null;
  setsRepsHint: string | null;
  variations: string | null;
}

/**
 * Nội dung chi tiết song ngữ. EN fallback về bản VI khi chưa có bản dịch,
 * để không bao giờ hiện section trống chỉ vì thiếu `_en`.
 */
export function localizeExerciseContent(ex: LocalizableExercise & {
  instructions?: string | null; instructionsEn?: string | null;
  steps?: string | null; stepsEn?: string | null;
  setupPosition?: string | null; setupPositionEn?: string | null;
  breathing?: string | null; breathingEn?: string | null;
  commonMistakes?: string | null; commonMistakesEn?: string | null;
  safetyNotes?: string | null; safetyNotesEn?: string | null;
  suggestedDose?: string | null; suggestedDoseEn?: string | null;
  setsRepsHint?: string | null; setsRepsHintEn?: string | null;
  variations?: string | null; variationsEn?: string | null;
}, lang: Lang): LocalizedExerciseContent {
  if (lang === 'en') {
    const pick = (en: string | null | undefined, vi: string | null | undefined) => en?.trim() || vi || null;
    return {
      instructions: pick(ex.instructionsEn, ex.instructions),
      steps: pick(ex.stepsEn, ex.steps),
      setupPosition: pick(ex.setupPositionEn, ex.setupPosition),
      breathing: pick(ex.breathingEn, ex.breathing),
      commonMistakes: pick(ex.commonMistakesEn, ex.commonMistakes),
      safetyNotes: pick(ex.safetyNotesEn, ex.safetyNotes),
      suggestedDose: pick(ex.suggestedDoseEn, ex.suggestedDose),
      setsRepsHint: pick(ex.setsRepsHintEn, ex.setsRepsHint),
      variations: pick(ex.variationsEn, ex.variations),
    };
  }
  return {
    instructions: ex.instructions ?? null,
    steps: ex.steps ?? null,
    setupPosition: ex.setupPosition ?? null,
    breathing: ex.breathing ?? null,
    commonMistakes: ex.commonMistakes ?? null,
    safetyNotes: ex.safetyNotes ?? null,
    suggestedDose: ex.suggestedDose ?? null,
    setsRepsHint: ex.setsRepsHint ?? null,
    variations: ex.variations ?? null,
  };
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
