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
