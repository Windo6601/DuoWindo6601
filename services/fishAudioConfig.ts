import { SubscriptionTier, UserProgress } from '../types';

export type FishModelId = 's2.1-pro-free' | 'drama-3' | 's2.1-pro' | 's2-pro';

export interface FishModelSpec {
  id: FishModelId;
  label: string;
  icon: string;
  accessType: 'free' | 'paid';
  requiredPlans: SubscriptionTier[];
  accessBadgeRu: string;
  accessBadgeEn: string;
  accessFullRu: string;
  accessFullEn: string;
  descRu: string;
  descEn: string;
}

export const FISH_AUDIO_MODELS: FishModelSpec[] = [
  {
    id: 's2.1-pro-free',
    label: 'S2.1 Pro Free',
    icon: '🐋',
    accessType: 'free',
    requiredPlans: ['free', 'super', 'max'],
    accessBadgeRu: 'Доступ Бесплатно',
    accessBadgeEn: 'Free Access',
    accessFullRu: 'Доступ Бесплатно для всех пользователей DuoWindo6601',
    accessFullEn: 'Free Access for all DuoWindo6601 users',
    descRu: 'Стандартная нейронная озвучка речи Fish Audio S2.1 Pro Free — доступна бесплатно на любом тарифе.',
    descEn: 'Standard Fish Audio S2.1 Pro Free neural speech — free on every plan.',
  },
  {
    id: 'drama-3',
    label: 'Drama 3',
    icon: '🎭',
    accessType: 'paid',
    requiredPlans: ['super', 'max'],
    accessBadgeRu: 'Платно • Super / Max',
    accessBadgeEn: 'Paid • Super / Max',
    accessFullRu: 'Платно — доступ: DuoWindo6601 Super, DuoWindo6601 Max',
    accessFullEn: 'Paid — access: DuoWindo6601 Super, DuoWindo6601 Max',
    descRu: 'Выразительная эмоциональная модель Drama 3 для живых ролевых диалогов и аудио.',
    descEn: 'Expressive emotional Drama 3 voice model for immersive roleplays and audio.',
  },
  {
    id: 's2.1-pro',
    label: 'S2.1 Pro',
    icon: '✨',
    accessType: 'paid',
    requiredPlans: ['super', 'max'],
    accessBadgeRu: 'Платно • Super / Max',
    accessBadgeEn: 'Paid • Super / Max',
    accessFullRu: 'Платно — доступ: DuoWindo6601 Super, DuoWindo6601 Max',
    accessFullEn: 'Paid — access: DuoWindo6601 Super, DuoWindo6601 Max',
    descRu: 'Студийное HD-произношение S2.1 Pro с высокой детализацией интонации.',
    descEn: 'Studio HD pronunciation S2.1 Pro with rich intonation detail.',
  },
  {
    id: 's2-pro',
    label: 'S2 Pro',
    icon: '⚡',
    accessType: 'paid',
    requiredPlans: ['super', 'max'],
    accessBadgeRu: 'Платно • Super / Max',
    accessBadgeEn: 'Paid • Super / Max',
    accessFullRu: 'Платно — доступ: DuoWindo6601 Super, DuoWindo6601 Max',
    accessFullEn: 'Paid — access: DuoWindo6601 Super, DuoWindo6601 Max',
    descRu: 'Профессиональная быстрая модель S2 Pro для максимальной точности акцента.',
    descEn: 'Professional low-latency S2 Pro model for crisp accent precision.',
  },
];

export const DEFAULT_FISH_REFERENCE_ID = 'bf322df2096a46f18c579d0baa36f41d';
export const ADMIN_FISH_CONFIG_STORAGE = 'duowindo_admin_fish_config';

/**
 * Verified clean native narrator/educational Fish Audio voice reference IDs per language.
 * Keeps 'en' on DEFAULT_FISH_REFERENCE_ID ("Adrian") while giving every other supported
 * language its own native speaker so Fish Audio never defaults to an English voice.
 */
export const FISH_VOICE_BY_LANG: Record<string, string> = {
  en: DEFAULT_FISH_REFERENCE_ID,
  ru: '2a1036d645634680b3cc69aeeb60375b',
  es: '8d2c17a9b26d4d83888ea67a1ee565b2',
  de: '90042f762dbf49baa2e7776d011eee6b',
  fr: '5567200c7d8341738f0892bbacd3be3c',
  zh: '54a5170264694bfc8e9ad98df7bd89c3',
  ja: '46745543e52548238593a3962be77e3a',
  ko: '773c8796d726413bb9273821fdc1a5f9',
  ar: '79b0fd32e00645e2827b841629034be5',
  pt: '5661bf8cb97740fcb10d2f756abf7779',
  it: 'fa3d2a996c0f4d90920ef022584f2aeb',
  tr: 'b8c121ff4fca4940bf44657f1b0d5734',
  nl: 'add4d395494c4ed0ba2018e77b39ea54',
  pl: '4f63d293e42d4ec9adf3d9ab1ad2652c',
  sv: 'a1843c13ba504f589506a1df30ca39db',
  no: '32d4aeb41c3b421fb31da086e2c18fa0',
  uk: '3fef666f5cf44077bd00172095cd417b',
  he: 'b11e90d946c5439b92098ee5d1dc01f2',
  fi: 'f6046e0f4cbb4504b15722ab37548738',
  hu: '551a5c19580a44fa9fee8545744d3f44',
  id: 'ce4650d0df864e4195806b91065f30be',
  ro: 'eb4404091b7a488b8304517daec7818d',
  mo: 'eb4404091b7a488b8304517daec7818d',
  cs: '9b95ea0fa97e4ebfa3de5e00e9a5e868',
  el: '6f26667105a940c3af8a99af1ce42f19',
  hi: '0de8162a9e384545a0106046b57488a7',
  vi: '9ac6a11757ed4662aff7cb64bc33e868',
  th: 'a0fe0d1bea8b455abed879f84daae3e0',
};

export const FISH_NATIVE_LANGS = new Set(Object.keys(FISH_VOICE_BY_LANG));

export function getFishReferenceIdForLang(
  lang: string,
  configuredDefaultRef?: string,
  explicitRef?: string
): string | undefined {
  const baseLang = (lang || '').trim().toLowerCase().split(/[-_]/)[0];
  if (explicitRef && explicitRef.trim()) {
    if (baseLang && baseLang !== 'en' && explicitRef.trim() === DEFAULT_FISH_REFERENCE_ID) {
      return FISH_VOICE_BY_LANG[baseLang];
    }
    return explicitRef.trim();
  }
  if (baseLang === 'en') {
    return configuredDefaultRef?.trim() || DEFAULT_FISH_REFERENCE_ID;
  }
  if (configuredDefaultRef && configuredDefaultRef.trim() && configuredDefaultRef.trim() !== DEFAULT_FISH_REFERENCE_ID) {
    return configuredDefaultRef.trim();
  }
  return FISH_VOICE_BY_LANG[baseLang];
}

export interface AdminFishConfig {
  customApiKey: string;
  defaultReferenceId: string;
  adminDevBypassPaidGate: boolean;
  enabledModels: Record<FishModelId, boolean>;
  updatedAt?: string;
}

export const DEFAULT_ADMIN_FISH_CONFIG: AdminFishConfig = {
  customApiKey: '',
  defaultReferenceId: DEFAULT_FISH_REFERENCE_ID,
  adminDevBypassPaidGate: true,
  enabledModels: {
    's2.1-pro-free': true,
    'drama-3': true,
    's2.1-pro': true,
    's2-pro': true,
  },
};

export function getAdminFishConfig(): AdminFishConfig {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_ADMIN_FISH_CONFIG, enabledModels: { ...DEFAULT_ADMIN_FISH_CONFIG.enabledModels } };
  }
  try {
    const raw = localStorage.getItem(ADMIN_FISH_CONFIG_STORAGE);
    if (!raw) {
      return { ...DEFAULT_ADMIN_FISH_CONFIG, enabledModels: { ...DEFAULT_ADMIN_FISH_CONFIG.enabledModels } };
    }
    const parsed = JSON.parse(raw);
    return {
      customApiKey: typeof parsed.customApiKey === 'string' ? parsed.customApiKey.trim() : '',
      defaultReferenceId:
        typeof parsed.defaultReferenceId === 'string' && parsed.defaultReferenceId.trim()
          ? parsed.defaultReferenceId.trim()
          : DEFAULT_FISH_REFERENCE_ID,
      adminDevBypassPaidGate: parsed.adminDevBypassPaidGate !== false,
      enabledModels: {
        's2.1-pro-free': parsed.enabledModels?.['s2.1-pro-free'] !== false,
        'drama-3': parsed.enabledModels?.['drama-3'] !== false,
        's2.1-pro': parsed.enabledModels?.['s2.1-pro'] !== false,
        's2-pro': parsed.enabledModels?.['s2-pro'] !== false,
      },
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : undefined,
    };
  } catch {
    return { ...DEFAULT_ADMIN_FISH_CONFIG, enabledModels: { ...DEFAULT_ADMIN_FISH_CONFIG.enabledModels } };
  }
}

export function saveAdminFishConfig(config: AdminFishConfig): AdminFishConfig {
  const normalized: AdminFishConfig = {
    customApiKey: (config.customApiKey || '').trim(),
    defaultReferenceId: (config.defaultReferenceId || '').trim() || DEFAULT_FISH_REFERENCE_ID,
    adminDevBypassPaidGate: config.adminDevBypassPaidGate !== false,
    enabledModels: {
      's2.1-pro-free': config.enabledModels?.['s2.1-pro-free'] !== false,
      'drama-3': config.enabledModels?.['drama-3'] !== false,
      's2.1-pro': config.enabledModels?.['s2.1-pro'] !== false,
      's2-pro': config.enabledModels?.['s2-pro'] !== false,
    },
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ADMIN_FISH_CONFIG_STORAGE, JSON.stringify(normalized));
      window.dispatchEvent(new CustomEvent('duowindo_fish_config_changed'));
    } catch {}
  }
  return normalized;
}

export function resetAdminFishConfig(): AdminFishConfig {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(ADMIN_FISH_CONFIG_STORAGE);
      window.dispatchEvent(new CustomEvent('duowindo_fish_config_changed'));
    } catch {}
  }
  return { ...DEFAULT_ADMIN_FISH_CONFIG, enabledModels: { ...DEFAULT_ADMIN_FISH_CONFIG.enabledModels } };
}

export function isPrivilegedAdminOrDev(user?: Partial<UserProgress> | null): boolean {
  if (!user) return false;
  const role = String(user.role || '').toLowerCase();
  const email = String(user.email || user.username || '').toLowerCase();
  const isOwnerEmail =
    email.includes('abramovanatolij81@gmail.com') ||
    email.includes('va997217@gmail.com');
  return Boolean(
    user.isAdmin ||
    role === 'admin' ||
    role === 'owner' ||
    role === 'developer' ||
    isOwnerEmail
  );
}

export function canUserAccessFishModel(
  modelId: string,
  user?: Partial<UserProgress> | null
): { allowed: boolean; reasonRu: string; reasonEn: string } {
  const cfg = getAdminFishConfig();
  const cleanId = (modelId || 's2.1-pro-free') as FishModelId;
  const spec = FISH_AUDIO_MODELS.find((m) => m.id === cleanId);

  if (spec && cfg.enabledModels[spec.id] === false && cleanId !== 's2.1-pro-free') {
    return {
      allowed: false,
      reasonRu: `Модель ${spec.id} временно отключена в Панели Владельца — Admin Tool`,
      reasonEn: `Model ${spec.id} is disabled in Owner Dashboard — Admin Tool`,
    };
  }

  if (!spec || spec.accessType === 'free') {
    return {
      allowed: true,
      reasonRu: 'Доступ Бесплатно',
      reasonEn: 'Free Access',
    };
  }

  const tier: SubscriptionTier = user?.subscription || 'free';
  if (tier === 'super' || tier === 'max') {
    return {
      allowed: true,
      reasonRu: tier === 'max' ? 'Доступно по DuoWindo6601 Max' : 'Доступно по DuoWindo6601 Super',
      reasonEn: tier === 'max' ? 'Included in DuoWindo6601 Max' : 'Included in DuoWindo6601 Super',
    };
  }

  if (cfg.adminDevBypassPaidGate && isPrivilegedAdminOrDev(user)) {
    return {
      allowed: true,
      reasonRu: 'Доступ Администрации / Разработчика',
      reasonEn: 'Admin / Developer Access',
    };
  }

  return {
    allowed: false,
    reasonRu: `Модель ${spec.id} — Платно (требуется DuoWindo6601 Super или DuoWindo6601 Max)`,
    reasonEn: `Model ${spec.id} is Paid (DuoWindo6601 Super or DuoWindo6601 Max required)`,
  };
}

export function resolveAllowedFishModel(
  requestedModel: string | undefined,
  user?: Partial<UserProgress> | null
): FishModelId {
  const candidate = (requestedModel || 's2.1-pro-free').trim() as FishModelId;
  const isKnown = FISH_AUDIO_MODELS.some((m) => m.id === candidate);
  if (!isKnown) return 's2.1-pro-free';
  const check = canUserAccessFishModel(candidate, user);
  return check.allowed ? candidate : 's2.1-pro-free';
}
