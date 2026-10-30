// Service managing language switching availability and countdown
// 15 languages and writing section locked until November 1, 2026
// 10 World languages (switching locked) + 5 CIS/World languages (Letters section locked)

export interface LockedLanguageInfo {
  code: string;
  nameRu: string;
  nameEn: string;
  nativeName: string;
  flagCode: string;
  flagEmoji: string;
  category: 'world' | 'cis';
  fullLabelRu?: string;
  noteRu?: string;
  noteEn?: string;
}

export const LOCKED_WORLD_LANGUAGES: Record<string, LockedLanguageInfo> = {
  pt: {
    code: 'pt',
    nameRu: 'Португальский',
    nameEn: 'Portuguese',
    nativeName: 'Português',
    flagCode: 'br',
    flagEmoji: '🇧🇷',
    category: 'world'
  },
  it: {
    code: 'it',
    nameRu: 'Итальянский',
    nameEn: 'Italian',
    nativeName: 'Italiano',
    flagCode: 'it',
    flagEmoji: '🇮🇹',
    category: 'world'
  },
  tr: {
    code: 'tr',
    nameRu: 'Турецкий',
    nameEn: 'Turkish',
    nativeName: 'Türkçe',
    flagCode: 'tr',
    flagEmoji: '🇹🇷',
    category: 'world'
  },
  ko: {
    code: 'ko',
    nameRu: 'Корейский',
    nameEn: 'Korean',
    nativeName: '한국어',
    flagCode: 'kr',
    flagEmoji: '🇰🇷',
    category: 'world'
  },
  hi: {
    code: 'hi',
    nameRu: 'Хинди (Индия)',
    nameEn: 'Hindi (India)',
    nativeName: 'हिन्दी',
    flagCode: 'in',
    flagEmoji: '🇮🇳',
    category: 'world'
  },
  pl: {
    code: 'pl',
    nameRu: 'Польский',
    nameEn: 'Polish',
    nativeName: 'Polski',
    flagCode: 'pl',
    flagEmoji: '🇵🇱',
    category: 'world'
  },
  id: {
    code: 'id',
    nameRu: 'Индонезийский (Bahasa Indonesia)',
    nameEn: 'Indonesian (Bahasa Indonesia)',
    nativeName: 'Bahasa Indonesia',
    flagCode: 'id',
    flagEmoji: '🇮🇩',
    category: 'world'
  },
  bn: {
    code: 'bn',
    nameRu: 'Бенгальский (বাংলা)',
    nameEn: 'Bengali (বাংলা)',
    nativeName: 'বাংলা',
    flagCode: 'bd',
    flagEmoji: '🇧🇩',
    category: 'world'
  },
  th: {
    code: 'th',
    nameRu: 'Тайский (ไทย)',
    nameEn: 'Thai (ไทย)',
    nativeName: 'ไทย',
    flagCode: 'th',
    flagEmoji: '🇹🇭',
    category: 'world'
  },
  vi: {
    code: 'vi',
    nameRu: 'Вьетнамский (Tiếng Việt)',
    nameEn: 'Vietnamese (Tiếng Việt)',
    nativeName: 'Tiếng Việt',
    flagCode: 'vn',
    flagEmoji: '🇻🇳',
    category: 'world'
  }
};

export const LOCKED_CIS_LANGUAGES: Record<string, LockedLanguageInfo> = {
  kk: {
    code: 'kk',
    nameRu: 'Казахстан (Қазақша)',
    nameEn: 'Kazakhstan (Kazakh)',
    nativeName: 'Қазақша',
    flagCode: 'kz',
    flagEmoji: '🇰🇿',
    category: 'cis',
    fullLabelRu: 'Казахстан (Қазақша) — Казахстан (казахский — выбран) 🇰🇿',
    noteRu: 'Раздел Письмо Будут доступ 1 ноября 2026 год',
    noteEn: 'Section "Letters" will be available November 1, 2026'
  },
  uz: {
    code: 'uz',
    nameRu: 'Узбекистан (Oʻzbekcha)',
    nameEn: 'Uzbekistan (Uzbek)',
    nativeName: 'Oʻzbekcha',
    flagCode: 'uz',
    flagEmoji: '🇺🇿',
    category: 'cis',
    fullLabelRu: 'Узбекистан (Oʻzbekcha) — Узбекистан (узбекский) 🇺🇿',
    noteRu: 'Раздел Письмо Будут доступ 1 ноября 2026 год',
    noteEn: 'Section "Letters" will be available November 1, 2026'
  },
  hy: {
    code: 'hy',
    nameRu: 'Армения (Հայերեն)',
    nameEn: 'Armenia (Armenian)',
    nativeName: 'Հայերեն',
    flagCode: 'am',
    flagEmoji: '🇦🇲',
    category: 'cis',
    fullLabelRu: 'Армения (Հայերեն) — Армения (армянский) 🇦🇲',
    noteRu: 'Раздел Письмо Будут доступ 1 ноября 2026 год',
    noteEn: 'Section "Letters" will be available November 1, 2026'
  },
  ka: {
    code: 'ka',
    nameRu: 'Грузия (ქართული)',
    nameEn: 'Georgia (Georgian)',
    nativeName: 'ქართული',
    flagCode: 'ge',
    flagEmoji: '🇬🇪',
    category: 'cis',
    fullLabelRu: 'Грузия (ქართული) — Грузия (грузинский) 🇬🇪',
    noteRu: 'Раздел Письмо Будут доступ 1 ноября 2026 год',
    noteEn: 'Section "Letters" will be available November 1, 2026'
  },
  az: {
    code: 'az',
    nameRu: 'Азербайджан (Azərbaycan)',
    nameEn: 'Azerbaijan (Azerbaijani)',
    nativeName: 'Azərbaycan',
    flagCode: 'az',
    flagEmoji: '🇦🇿',
    category: 'cis',
    fullLabelRu: 'Азербайджан (Azərbaycan) — Азербайджан (азербайджанский) 🇦🇿',
    noteRu: 'Раздел Письмо Будут доступ 1 ноября 2026 год',
    noteEn: 'Section "Letters" will be available November 1, 2026'
  }
};

export const LOCKED_SWITCH_LANGUAGES: Record<string, LockedLanguageInfo> = {
  ...LOCKED_WORLD_LANGUAGES,
  ...LOCKED_CIS_LANGUAGES
};

export const AVAILABLE_SWITCH_LANGUAGES = [
  { code: 'ru', label: '🇷🇺 Русский' },
  { code: 'en', label: '🇺🇸 English' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'ja', label: '🇯🇵 日本語' },
  { code: 'zh', label: '🇨🇳 中文' },
  { code: 'ar', label: '🇸🇦 العربية' }
];

// Target unlock date: November 1, 2026 (2026-11-01 00:00:00 UTC)
export const UNLOCK_DEADLINE_ISO = '2026-11-01T00:00:00Z';
export const UNLOCK_DEADLINE_DATE = new Date(UNLOCK_DEADLINE_ISO);

export const isLanguageSwitchLocked = (langCode: string | undefined | null): boolean => {
  if (!langCode) return false;
  const now = new Date();
  if (now >= UNLOCK_DEADLINE_DATE) return false;

  const clean = langCode.toLowerCase().trim();
  return Boolean(LOCKED_WORLD_LANGUAGES[clean] || LOCKED_CIS_LANGUAGES[clean]);
};

export const isWritingSectionLocked = (courseId: string | undefined | null): boolean => {
  if (!courseId) return false;
  const now = new Date();
  if (now >= UNLOCK_DEADLINE_DATE) return false;

  const clean = courseId.toLowerCase().trim();
  // Specifically the 5 CIS / world writing-locked languages:
  // kk (Kazakhstan), uz (Uzbekistan), hy (Armenia), ka (Georgia), az (Azerbaijan)
  return Boolean(LOCKED_CIS_LANGUAGES[clean]);
};

export const getLanguageLockInfo = (langCode: string): LockedLanguageInfo | undefined => {
  if (!langCode) return undefined;
  return LOCKED_SWITCH_LANGUAGES[langCode.toLowerCase().trim()];
};

export const getAllLockedLanguages = (): LockedLanguageInfo[] => {
  return Object.values(LOCKED_SWITCH_LANGUAGES);
};

export const getWorldLockedLanguages = (): LockedLanguageInfo[] => {
  return Object.values(LOCKED_WORLD_LANGUAGES);
};

export const getCisLockedLanguages = (): LockedLanguageInfo[] => {
  return Object.values(LOCKED_CIS_LANGUAGES);
};

export const getDaysRemainingUntilUnlock = (): number => {
  const now = new Date();
  const diff = UNLOCK_DEADLINE_DATE.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getLanguageLockedToastMessage = (langCode: string, userLang: string = 'ru'): string => {
  const info = getLanguageLockInfo(langCode);
  const isRu = userLang === 'ru';
  if (!info) {
    return isRu 
      ? '🔒 В разработке • Доступно 1 ноября 2026 г.' 
      : '🔒 Under development • Available November 1, 2026';
  }

  if (info.category === 'cis' || info.noteRu) {
    return isRu
      ? `🔒 ${info.fullLabelRu || info.nameRu}. Раздел Письмо Будут доступ 1 ноября 2026 год • 🔒 1 нояб.`
      : `🔒 ${info.nameEn}. Section "Letters" will be available November 1, 2026.`;
  }

  return isRu
    ? `🔒 ${info.nameRu} (${info.nativeName}) — в разработке. Доступно 1 ноября 2026 г. • 🔒 1 нояб.`
    : `🔒 ${info.nameEn} (${info.nativeName}) — under development. Available November 1, 2026.`;
};

// -----------------------------------------------------------------------------
// BETA COURSES WRITING SECTION RESTRICTION: Available from November 1, 2026
// -----------------------------------------------------------------------------

export interface BetaCourseLockInfo {
  id: string;
  name: string;
  localName: string;
  version: string;
  restrictionNotice: string;
  flagCode: string;
  hasSpecialFont?: boolean;
  specialFontName?: string;
  specialFontUrl?: string;
}

export const BETA_WRITING_RESTRICTED_COURSES: Record<string, BetaCourseLockInfo> = {
  kk: {
    id: 'kk',
    name: 'Kazakhstan (Kazakh)',
    localName: 'Казахстан (Қазақша)',
    version: 'Раздел Письмо',
    restrictionNotice: 'Раздел Письмо Будут доступ 1 ноября 2026 год • 🔒 1 нояб.',
    flagCode: 'kz'
  },
  uz: {
    id: 'uz',
    name: 'Uzbekistan (Uzbek)',
    localName: 'Узбекистан (Oʻzbekcha)',
    version: 'Раздел Письмо',
    restrictionNotice: 'Раздел Письмо Будут доступ 1 ноября 2026 год • 🔒 1 нояб.',
    flagCode: 'uz'
  },
  hy: {
    id: 'hy',
    name: 'Armenia (Armenian)',
    localName: 'Армения (Հայերեն)',
    version: 'Раздел Письмо',
    restrictionNotice: 'Раздел Письмо Будут доступ 1 ноября 2026 год • 🔒 1 нояб.',
    flagCode: 'am'
  },
  ka: {
    id: 'ka',
    name: 'Georgia (Georgian)',
    localName: 'Грузия (ქართული)',
    version: 'Раздел Письмо',
    restrictionNotice: 'Раздел Письмо Будут доступ 1 ноября 2026 год • 🔒 1 нояб.',
    flagCode: 'ge'
  },
  az: {
    id: 'az',
    name: 'Azerbaijan (Azerbaijani)',
    localName: 'Азербайджан (Azərbaycan)',
    version: 'Раздел Письмо',
    restrictionNotice: 'Раздел Письмо Будут доступ 1 ноября 2026 год • 🔒 1 нояб.',
    flagCode: 'az'
  },
  la: {
    id: 'la',
    name: 'Latin',
    localName: 'Латынь (Lingua Latina)',
    version: 'v0.8.2 Beta',
    restrictionNotice: 'В разработке • Доступно 1 ноября 2026 г.',
    flagCode: 'it'
  },
  sv: {
    id: 'sv',
    name: 'Swedish',
    localName: 'Шведский (Svenska)',
    version: 'v0.9.1 Beta',
    restrictionNotice: 'В разработке • Доступно 1 ноября 2026 г.',
    flagCode: 'se'
  },
  no: {
    id: 'no',
    name: 'Norwegian',
    localName: 'Норвежский (Norsk)',
    version: 'v0.9.0 Beta',
    restrictionNotice: 'В разработке • Доступно 1 ноября 2026 г.',
    flagCode: 'no'
  },
  tt: {
    id: 'tt',
    name: 'Tatar',
    localName: 'Татарский (Татар теле)',
    version: 'v0.9.5 Beta',
    restrictionNotice: 'В разработке • Доступно 1 ноября 2026 г.',
    flagCode: 'ru'
  },
  hv: {
    id: 'hv',
    name: 'High Valyrian',
    localName: 'Высокий валирийский (Valyrio)',
    version: 'v0.8.0 Beta',
    restrictionNotice: 'В разработке • Доступно 1 ноября 2026 г.',
    flagCode: 'gb'
  },
  tlh: {
    id: 'tlh',
    name: 'Klingon',
    localName: 'Клингонский (tlhIngan Hol)',
    version: 'v0.7.3 Beta',
    restrictionNotice: 'В разработке • Доступно 1 ноября 2026 г.',
    flagCode: 'us',
    hasSpecialFont: true,
    specialFontName: 'Klingon',
    specialFontUrl: 'https://fontomania.ru/17807-klingon.html'
  },
  yi: {
    id: 'yi',
    name: 'Yiddish',
    localName: 'Идиш (ייִдиш)',
    version: 'v0.9.2 Beta',
    restrictionNotice: 'В разработке • Доступно 1 ноября 2026 г.',
    flagCode: 'il'
  }
};

export const isBetaWritingRestricted = (courseId: string | undefined | null): boolean => {
  if (!courseId) return false;
  const now = new Date();
  if (now >= UNLOCK_DEADLINE_DATE) return false;

  const clean = courseId.toLowerCase().trim();
  if (isWritingSectionLocked(clean)) return true;
  return Boolean(BETA_WRITING_RESTRICTED_COURSES[clean]);
};

export const getBetaWritingRestrictedInfo = (courseId: string | undefined | null): BetaCourseLockInfo | undefined => {
  if (!courseId) return undefined;
  return BETA_WRITING_RESTRICTED_COURSES[courseId.toLowerCase().trim()];
};

export const getBetaWritingRestrictedCoursesList = (): BetaCourseLockInfo[] => {
  return Object.values(BETA_WRITING_RESTRICTED_COURSES);
};
