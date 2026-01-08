/**
 * Learning module types for 词善佳
 *
 * Word-based modules (1-6):
 * - 1-3: MVP modules
 * - 4-6: Future expansion (后期)
 *
 * Sentence-based modules (7-13):
 * - 7-10: MVP modules
 * - 11-13: Future expansion (后期)
 */

export const ModuleType = {
  // Word-based modules
  SMART_RECOGNITION: 1,    // 智能认词: 形 → 义
  SMART_DICTATION: 2,      // 智能听写: 音 → 形
  SMART_WRITING: 3,        // 智能默写: 义 → 形
  SMART_LISTENING: 4,      // 智能听词: 音 → 义 (后期)
  SMART_READING: 5,        // 智能跟读: 形 → 音 (后期)
  SMART_SPEAKING: 6,       // 智能说词: 义 → 音 (后期)

  // Sentence-based modules
  SMART_WORD_USAGE: 7,     // 智能用词: 例句填空
  SENTENCE_LISTENING: 8,   // 例句听组: 听音排序
  SENTENCE_TRANSLATION: 9, // 例句翻译: 中译英排序
  SENTENCE_DICTATION: 10,  // 例句听写: 听音拼写
  SENTENCE_LISTENING_COMP: 11, // 例句听力: 听音选义 (后期)
  SENTENCE_ORAL: 12,       // 例句口语: 跟读例句 (后期)
  SENTENCE_WRITING: 13,    // 例句默写: 看中写英 (后期)
} as const;

export type ModuleTypeValue = typeof ModuleType[keyof typeof ModuleType];

export const MODULE_NAMES: Record<ModuleTypeValue, string> = {
  [ModuleType.SMART_RECOGNITION]: '智能认词',
  [ModuleType.SMART_DICTATION]: '智能听写',
  [ModuleType.SMART_WRITING]: '智能默写',
  [ModuleType.SMART_LISTENING]: '智能听词',
  [ModuleType.SMART_READING]: '智能跟读',
  [ModuleType.SMART_SPEAKING]: '智能说词',
  [ModuleType.SMART_WORD_USAGE]: '智能用词',
  [ModuleType.SENTENCE_LISTENING]: '例句听组',
  [ModuleType.SENTENCE_TRANSLATION]: '例句翻译',
  [ModuleType.SENTENCE_DICTATION]: '例句听写',
  [ModuleType.SENTENCE_LISTENING_COMP]: '例句听力',
  [ModuleType.SENTENCE_ORAL]: '例句口语',
  [ModuleType.SENTENCE_WRITING]: '例句默写',
};

export const MODULE_DIRECTIONS: Record<ModuleTypeValue, string> = {
  [ModuleType.SMART_RECOGNITION]: '形 → 义',
  [ModuleType.SMART_DICTATION]: '音 → 形',
  [ModuleType.SMART_WRITING]: '义 → 形',
  [ModuleType.SMART_LISTENING]: '音 → 义',
  [ModuleType.SMART_READING]: '形 → 音',
  [ModuleType.SMART_SPEAKING]: '义 → 音',
  [ModuleType.SMART_WORD_USAGE]: '例句填空',
  [ModuleType.SENTENCE_LISTENING]: '听音排序',
  [ModuleType.SENTENCE_TRANSLATION]: '中译英排序',
  [ModuleType.SENTENCE_DICTATION]: '听音拼写',
  [ModuleType.SENTENCE_LISTENING_COMP]: '听音选义',
  [ModuleType.SENTENCE_ORAL]: '跟读例句',
  [ModuleType.SENTENCE_WRITING]: '看中写英',
};

// MVP modules (Phase 1)
export const MVP_WORD_MODULES = [
  ModuleType.SMART_RECOGNITION,
  ModuleType.SMART_DICTATION,
  ModuleType.SMART_WRITING,
] as const;

export const MVP_SENTENCE_MODULES = [
  ModuleType.SMART_WORD_USAGE,
  ModuleType.SENTENCE_LISTENING,
  ModuleType.SENTENCE_TRANSLATION,
  ModuleType.SENTENCE_DICTATION,
] as const;

export const MVP_MODULES = [...MVP_WORD_MODULES, ...MVP_SENTENCE_MODULES] as const;

// Review order (module order for Smart Review)
export const REVIEW_MODULE_ORDER = [
  ModuleType.SMART_RECOGNITION,
  ModuleType.SMART_DICTATION,
  ModuleType.SMART_WRITING,
  ModuleType.SMART_WORD_USAGE,
  ModuleType.SENTENCE_LISTENING,
  ModuleType.SENTENCE_TRANSLATION,
  ModuleType.SENTENCE_DICTATION,
] as const;

// Helper functions
export function isWordModule(moduleType: ModuleTypeValue): boolean {
  return moduleType >= 1 && moduleType <= 6;
}

export function isSentenceModule(moduleType: ModuleTypeValue): boolean {
  return moduleType >= 7 && moduleType <= 13;
}

export function isMvpModule(moduleType: ModuleTypeValue): boolean {
  return MVP_MODULES.includes(moduleType as typeof MVP_MODULES[number]);
}
