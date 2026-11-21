import { SubscriptionTier, UserProgress } from "../types";

export interface AiTierInfo {
  subscription: SubscriptionTier;
  dailyLimit: number;
  modelName: string;
  label: string;
  badgeColor: string;
  features: string[];
}

export const TIER_AI_CONFIG: Record<SubscriptionTier, AiTierInfo> = {
  free: {
    subscription: 'free',
    dailyLimit: 250,
    modelName: 'gemini-3-flash-preview',
    label: 'Бесплатный Тариф DuoWindo6601',
    badgeColor: 'bg-gray-700 text-gray-200 border-gray-600',
    features: [
      '250 ИИ-запросов в день (Gemini API Key)',
      'Базовая проверка упражнений и переводчик',
      'Fish Audio: model s2.1-pro-free (Доступ Бесплатно)'
    ]
  },
  super: {
    subscription: 'super',
    dailyLimit: 1000,
    modelName: 'gemini-3-flash-preview',
    label: 'Платно DuoWindo6601 Super',
    badgeColor: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400',
    features: [
      '1000 ИИ-запросов в день (Приоритетный Gemini API Key)',
      'Без рекламы & Бесконечная энергия',
      'Fish Audio (Платно): drama-3, s2.1-pro, s2-pro',
      'Интерактивный Ролевой ИИ-Чат'
    ]
  },
  max: {
    subscription: 'max',
    dailyLimit: 5000,
    modelName: 'gemini-3-pro-preview',
    label: 'Платно DuoWindo6601 Max',
    badgeColor: 'bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/20',
    features: [
      '5000 ИИ-запросов в день (Максимальный Gemini API Key Pro)',
      'Все функции Super + Углубленный ИИ-Разбор ответов',
      'Fish Audio (Платно): drama-3, s2.1-pro, s2-pro',
      'Грамматическая коррекция речи в реальном времени'
    ]
  }
};

export const CUSTOM_API_KEY_STORAGE = 'duowindo_custom_gemini_api_key';
export const CUSTOM_API_KEY_TYPE_STORAGE = 'duowindo_custom_gemini_api_key_type';

export const ADMIN_API_KEY_STORAGE = 'duowindo_admin_gemini_api_key';
export const ADMIN_API_KEY_TYPE_STORAGE = 'duowindo_admin_gemini_api_key_type';
export const ADMIN_API_KEY_ENABLED_STORAGE = 'duowindo_admin_gemini_api_key_enabled';

export const DEV_API_KEY_STORAGE = 'duowindo_dev_gemini_api_key';
export const DEV_API_KEY_TYPE_STORAGE = 'duowindo_dev_gemini_api_key_type';
export const DEV_API_KEY_ENABLED_STORAGE = 'duowindo_dev_gemini_api_key_enabled';

export const KEY_PRIORITY_STORAGE = 'duowindo_gemini_key_priority';

export interface CustomApiKeyDetails {
  key: string;
  type: 'free' | 'paid';
  isCustom: boolean;
  maskedKey: string;
}

export interface RoleApiKeyDetails {
  key: string;
  type: 'free' | 'paid';
  enabled: boolean;
  isSet: boolean;
  maskedKey: string;
}

export const DEFAULT_SYSTEM_GEMINI_KEY = '';

export function getAdminApiKeyDetails(): RoleApiKeyDetails {
  const defaultDetails: RoleApiKeyDetails = {
    key: '',
    type: 'free',
    enabled: false,
    isSet: false,
    maskedKey: 'Server Env Proxy'
  };

  if (typeof window === 'undefined') {
    return defaultDetails;
  }
  try {
    const rawKey = localStorage.getItem(ADMIN_API_KEY_STORAGE);
    const rawType = (localStorage.getItem(ADMIN_API_KEY_TYPE_STORAGE) || 'free') as 'free' | 'paid';
    const rawEnabled = localStorage.getItem(ADMIN_API_KEY_ENABLED_STORAGE);
    const enabled = rawEnabled !== 'false';
    if (rawKey !== null) {
      const trimmed = rawKey.trim();
      if (trimmed.length > 5) {
        const masked = trimmed.length > 8 
          ? `${trimmed.substring(0, 6)}••••${trimmed.substring(trimmed.length - 4)}` 
          : '••••••••';
        return {
          key: trimmed,
          type: rawType === 'paid' ? 'paid' : 'free',
          enabled,
          isSet: true,
          maskedKey: masked
        };
      }
    }
  } catch (e) {
    console.warn("getAdminApiKeyDetails error:", e);
  }
  return defaultDetails;
}

export function saveAdminApiKey(key: string, type: 'free' | 'paid', enabled: boolean = true): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(ADMIN_API_KEY_STORAGE, trimmed);
      localStorage.setItem(ADMIN_API_KEY_TYPE_STORAGE, type);
      localStorage.setItem(ADMIN_API_KEY_ENABLED_STORAGE, enabled ? 'true' : 'false');
    } else {
      localStorage.removeItem(ADMIN_API_KEY_STORAGE);
      localStorage.removeItem(ADMIN_API_KEY_TYPE_STORAGE);
      localStorage.removeItem(ADMIN_API_KEY_ENABLED_STORAGE);
    }
    window.dispatchEvent(new CustomEvent('duowindo_api_key_changed'));
  } catch (e) {
    console.warn("saveAdminApiKey error:", e);
  }
}

export function clearAdminApiKey(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ADMIN_API_KEY_STORAGE);
    localStorage.removeItem(ADMIN_API_KEY_TYPE_STORAGE);
    localStorage.removeItem(ADMIN_API_KEY_ENABLED_STORAGE);
    window.dispatchEvent(new CustomEvent('duowindo_api_key_changed'));
  } catch (e) {
    console.warn("clearAdminApiKey error:", e);
  }
}

export function getDevApiKeyDetails(): RoleApiKeyDetails {
  if (typeof window === 'undefined') {
    return { key: '', type: 'free', enabled: false, isSet: false, maskedKey: '' };
  }
  try {
    const rawKey = localStorage.getItem(DEV_API_KEY_STORAGE) || '';
    const rawType = (localStorage.getItem(DEV_API_KEY_TYPE_STORAGE) || 'free') as 'free' | 'paid';
    const rawEnabled = localStorage.getItem(DEV_API_KEY_ENABLED_STORAGE);
    const enabled = rawEnabled !== 'false';
    const trimmed = rawKey.trim();
    if (trimmed.length > 5) {
      const masked = trimmed.length > 8 
        ? `${trimmed.substring(0, 6)}••••${trimmed.substring(trimmed.length - 4)}` 
        : '••••••••';
      return {
        key: trimmed,
        type: rawType === 'paid' ? 'paid' : 'free',
        enabled,
        isSet: true,
        maskedKey: masked
      };
    }
  } catch (e) {
    console.warn("getDevApiKeyDetails error:", e);
  }
  return { key: '', type: 'free', enabled: false, isSet: false, maskedKey: '' };
}

export function saveDevApiKey(key: string, type: 'free' | 'paid', enabled: boolean = true): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(DEV_API_KEY_STORAGE, trimmed);
      localStorage.setItem(DEV_API_KEY_TYPE_STORAGE, type);
      localStorage.setItem(DEV_API_KEY_ENABLED_STORAGE, enabled ? 'true' : 'false');
    } else {
      localStorage.removeItem(DEV_API_KEY_STORAGE);
      localStorage.removeItem(DEV_API_KEY_TYPE_STORAGE);
      localStorage.removeItem(DEV_API_KEY_ENABLED_STORAGE);
    }
    window.dispatchEvent(new CustomEvent('duowindo_api_key_changed'));
  } catch (e) {
    console.warn("saveDevApiKey error:", e);
  }
}

export function clearDevApiKey(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DEV_API_KEY_STORAGE);
    localStorage.removeItem(DEV_API_KEY_TYPE_STORAGE);
    localStorage.removeItem(DEV_API_KEY_ENABLED_STORAGE);
    window.dispatchEvent(new CustomEvent('duowindo_api_key_changed'));
  } catch (e) {
    console.warn("clearDevApiKey error:", e);
  }
}

export function getGeminiKeyPriority(): 'auto' | 'admin' | 'dev' | 'custom' | 'system' {
  if (typeof window === 'undefined') return 'auto';
  try {
    return (localStorage.getItem(KEY_PRIORITY_STORAGE) as any) || 'auto';
  } catch {
    return 'auto';
  }
}

export function setGeminiKeyPriority(priority: 'auto' | 'admin' | 'dev' | 'custom' | 'system'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY_PRIORITY_STORAGE, priority);
    window.dispatchEvent(new CustomEvent('duowindo_api_key_changed'));
  } catch (e) {
    console.warn("setGeminiKeyPriority error:", e);
  }
}

export function getCustomApiKeyDetails(): CustomApiKeyDetails {
  if (typeof window === 'undefined') {
    return { key: '', type: 'free', isCustom: false, maskedKey: '' };
  }
  try {
    const rawKey = localStorage.getItem(CUSTOM_API_KEY_STORAGE) || '';
    const rawType = (localStorage.getItem(CUSTOM_API_KEY_TYPE_STORAGE) || 'free') as 'free' | 'paid';
    const trimmed = rawKey.trim();
    if (trimmed.length > 5) {
      const masked = trimmed.length > 8 
        ? `${trimmed.substring(0, 6)}••••${trimmed.substring(trimmed.length - 4)}` 
        : '••••••••';
      return {
        key: trimmed,
        type: rawType === 'paid' ? 'paid' : 'free',
        isCustom: true,
        maskedKey: masked
      };
    }
  } catch (e) {
    console.warn("getCustomApiKeyDetails error:", e);
  }
  return { key: '', type: 'free', isCustom: false, maskedKey: '' };
}

export function saveCustomApiKey(key: string, type: 'free' | 'paid'): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(CUSTOM_API_KEY_STORAGE, trimmed);
      localStorage.setItem(CUSTOM_API_KEY_TYPE_STORAGE, type);
    } else {
      localStorage.removeItem(CUSTOM_API_KEY_STORAGE);
      localStorage.removeItem(CUSTOM_API_KEY_TYPE_STORAGE);
    }
    window.dispatchEvent(new CustomEvent('duowindo_api_key_changed'));
  } catch (e) {
    console.warn("saveCustomApiKey error:", e);
  }
}

export function clearCustomApiKey(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CUSTOM_API_KEY_STORAGE);
    localStorage.removeItem(CUSTOM_API_KEY_TYPE_STORAGE);
    window.dispatchEvent(new CustomEvent('duowindo_api_key_changed'));
  } catch (e) {
    console.warn("clearCustomApiKey error:", e);
  }
}

const STORAGE_KEY = 'duowindo_ai_daily_usage_v2';
export const BONUS_AI_REQUESTS_STORAGE = 'duowindo_bonus_ai_requests';
export const FREE_DAILY_LIMIT_STORAGE = 'duowindo_free_daily_limit_date';
export const SKIP_CUSTOM_API_KEY_STORAGE = 'duowindo_skip_custom_api_key';

export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isCustomApiKeySkipped(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(SKIP_CUSTOM_API_KEY_STORAGE) === 'true';
  } catch {
    return false;
  }
}

export function setSkipCustomApiKey(skip: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (skip) {
      localStorage.setItem(SKIP_CUSTOM_API_KEY_STORAGE, 'true');
    } else {
      localStorage.removeItem(SKIP_CUSTOM_API_KEY_STORAGE);
    }
    window.dispatchEvent(new CustomEvent('duowindo_api_key_changed'));
    window.dispatchEvent(new CustomEvent('duowindo_ai_limit_changed'));
  } catch (e) {
    console.warn("setSkipCustomApiKey error:", e);
  }
}

export function canClaimFreeDailyLimit(): boolean {
  // Always allow claiming or replenishing free daily limit
  return true;
}

export function claimFreeDailyLimit(setUser?: UserSetter): { 
  success: boolean; 
  amount: number; 
  message: string; 
  alreadyClaimed?: boolean;
  newBonus: number;
} {
  const today = getTodayDateString();
  const amount = 50; // +50 bonus requests
  const newBonus = refillAiRequests(amount, setUser);

  // Also reset today's daily usage count so the user can immediately continue practicing
  resetAiDailyQuota(setUser);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(FREE_DAILY_LIMIT_STORAGE, today);
      window.dispatchEvent(new CustomEvent('duowindo_ai_limit_changed'));
    } catch (e) {
      console.warn("Failed to set free daily limit storage:", e);
    }
  }

  return {
    success: true,
    amount,
    message: `🎁 Получен бесплатный дневной лимит: +${amount} запросов Gemini API (квота обновлена)!`,
    newBonus
  };
}

export function getBonusAiRequests(user?: UserProgress): number {
  if (user && typeof user.bonusAiRequests === 'number') {
    return user.bonusAiRequests;
  }
  if (typeof window !== 'undefined') {
    try {
      const val = localStorage.getItem(BONUS_AI_REQUESTS_STORAGE);
      if (val) return parseInt(val, 10) || 0;
    } catch (e) {
      console.warn("Failed to read bonus AI requests from localStorage:", e);
    }
  }
  return 0;
}

export type UserSetter = (updater: (prev: UserProgress) => UserProgress) => void;

export function refillAiRequests(
  amount: number,
  setUser?: UserSetter
): number {
  let currentBonus = 0;
  if (typeof window !== 'undefined') {
    try {
      const val = localStorage.getItem(BONUS_AI_REQUESTS_STORAGE);
      if (val) currentBonus = parseInt(val, 10) || 0;
    } catch (e) {
      console.warn(e);
    }
  }
  const newBonus = currentBonus + amount;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(BONUS_AI_REQUESTS_STORAGE, String(newBonus));
      window.dispatchEvent(new CustomEvent('duowindo_ai_limit_changed'));
    } catch (e) {
      console.warn(e);
    }
  }
  if (setUser) {
    setUser(prev => ({
      ...prev,
      bonusAiRequests: (prev.bonusAiRequests || 0) + amount
    }));
  }
  return newBonus;
}

export function resetAiDailyQuota(
  setUser?: UserSetter
): void {
  const today = getTodayDateString();
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        date: today,
        used: 0
      }));
      window.dispatchEvent(new CustomEvent('duowindo_ai_limit_changed'));
    } catch (e) {
      console.warn(e);
    }
  }
  if (setUser) {
    setUser(prev => ({
      ...prev,
      dailyAiRequestsCount: 0,
      lastAiRequestDate: today
    }));
  }
}

export interface AiUsageStatus {
  used: number;
  limit: number;
  remaining: number;
  date: string;
  tier: SubscriptionTier;
  canUse: boolean;
  isCustomKey?: boolean;
  isSkippedKey?: boolean;
  customKeyType?: 'free' | 'paid';
  customKeyMasked?: string;
  bonusRequests?: number;
  baseLimit?: number;
  canClaimFreeBonus?: boolean;
}

export function getTodayAiUsage(user?: UserProgress): AiUsageStatus {
  const tier: SubscriptionTier = user?.subscription || 'free';
  const tierConfig = TIER_AI_CONFIG[tier] || TIER_AI_CONFIG.free;
  const today = getTodayDateString();
  const customKeyInfo = getCustomApiKeyDetails();
  const bonus = getBonusAiRequests(user);
  const isSkipped = isCustomApiKeySkipped();
  const canClaimFree = canClaimFreeDailyLimit();

  let localUsed = 0;
  // Always inspect localStorage first for current day's real-time count
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.date === today && typeof parsed.used === 'number') {
          localUsed = parsed.used;
        }
      }
    } catch (e) {
      console.warn("Failed to read AI usage from localStorage:", e);
    }
  }

  const userUsed = (user && user.lastAiRequestDate === today && typeof user.dailyAiRequestsCount === 'number')
    ? user.dailyAiRequestsCount
    : 0;

  // The actual count used today is the highest recorded between localStorage and user progress
  const used = Math.max(localUsed, userUsed);

  let baseLimit = tierConfig.dailyLimit;
  const adminDetails = getAdminApiKeyDetails();
  const devDetails = getDevApiKeyDetails();
  const isAdminOrDevKeyActive = (adminDetails.isSet && adminDetails.enabled) || (devDetails.isSet && devDetails.enabled);

  if (isSkipped || isAdminOrDevKeyActive) {
    baseLimit = 999999; // Free system traffic and admin/dev keys have unlimited requests
  } else if (customKeyInfo.isCustom) {
    if (customKeyInfo.type === 'paid') {
      baseLimit = 999999; // Unlimited for paid API key
    } else {
      baseLimit = 1500; // Google AI Studio Free tier standard quota (1500 RPD)
    }
  }

  const isUnlimited = isSkipped || isAdminOrDevKeyActive || (customKeyInfo.isCustom && customKeyInfo.type === 'paid') || tier === 'max' || tier === 'super';
  const limit = isUnlimited ? 999999 : baseLimit + bonus;
  const remaining = isUnlimited ? 999999 : Math.max(0, limit - used);
  const canUse = isUnlimited || remaining > 0;

  return {
    used,
    limit,
    remaining,
    date: today,
    tier,
    canUse,
    isCustomKey: customKeyInfo.isCustom && !isSkipped,
    isSkippedKey: isSkipped,
    customKeyType: customKeyInfo.type,
    customKeyMasked: customKeyInfo.maskedKey,
    bonusRequests: bonus,
    baseLimit,
    canClaimFreeBonus: canClaimFree
  };
}

export function recordAiUsage(
  user?: UserProgress, 
  setUser?: (fn: (prev: UserProgress) => UserProgress) => void
): AiUsageStatus {
  const status = getTodayAiUsage(user);
  const newUsed = status.used + 1;
  const today = status.date;

  // 1. Update localStorage safely and notify UI listeners instantly
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        date: today,
        used: newUsed
      }));
      window.dispatchEvent(new CustomEvent('duowindo_ai_limit_changed'));
    } catch (e) {
      console.warn("Failed to write AI usage to localStorage:", e);
    }
  }

  // 2. Safely sync to React state without throwing or breaking duowindo6601
  if (setUser) {
    try {
      setUser(prev => {
        if (!prev) return prev;
        if (prev.dailyAiRequestsCount === newUsed && prev.lastAiRequestDate === today) {
          return prev;
        }
        return {
          ...prev,
          dailyAiRequestsCount: newUsed,
          lastAiRequestDate: today
        };
      });
    } catch (e) {
      console.warn("Safely handled setUser in recordAiUsage:", e);
    }
  }

  return {
    ...status,
    used: newUsed,
    remaining: status.limit > 900000 ? 999999 : Math.max(0, status.limit - newUsed),
    canUse: status.canUse || (status.limit - newUsed > 0)
  };
}

export class GeminiLimitExceededError extends Error {
  public status: AiUsageStatus;
  constructor(status: AiUsageStatus) {
    super(`Daily Gemini API key limit reached (${status.used}/${status.limit} requests used on ${status.tier} plan).`);
    this.name = 'GeminiLimitExceededError';
    this.status = status;
  }
}

export function triggerAiLimitModal(status?: AiUsageStatus) {
  if (typeof window !== 'undefined') {
    // If user skipped custom API key (using DuoWindo6601 free traffic) or has Super/Max, NEVER trigger limit modal!
    if (isCustomApiKeySkipped()) {
      return;
    }
    const currentTier = status?.tier;
    if (currentTier === 'super' || currentTier === 'max') {
      return;
    }
    window.dispatchEvent(new CustomEvent('duowindo_ai_limit_reached', { detail: status }));
  }
}

export const MCP_ENABLED_STORAGE = 'duowindo_mcp_enabled';
export const RENDER_MCP_API_KEY_STORAGE = 'duowindo_render_mcp_api_key';
export const JULES_DEBUG_ENABLED_STORAGE = 'duowindo_jules_debug_enabled';
export const DEFAULT_RENDER_MCP_API_KEY = (
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_RENDER_MCP_API_KEY) ||
  'rnd_yJ0QbFmEPVzGFlD6OwWG4o8Rg6t8'
).trim();

export interface McpConfig {
  enabled: boolean;
  renderApiKey: string;
  julesDebugEnabled: boolean;
  maskedKey: string;
  mcpServerUrl: string;
}

export function getMcpConfig(): McpConfig {
  if (typeof window === 'undefined') {
    return {
      enabled: true,
      renderApiKey: DEFAULT_RENDER_MCP_API_KEY,
      julesDebugEnabled: true,
      maskedKey: 'rnd_yJ0Q••••6t8',
      mcpServerUrl: 'https://api.render.com/v1/mcp'
    };
  }
  try {
    const rawEnabled = localStorage.getItem(MCP_ENABLED_STORAGE);
    const enabled = rawEnabled !== 'false';
    const rawJules = localStorage.getItem(JULES_DEBUG_ENABLED_STORAGE);
    const julesDebugEnabled = rawJules !== 'false';
    const storedKey = localStorage.getItem(RENDER_MCP_API_KEY_STORAGE);
    const key = (storedKey && storedKey.trim()) ? storedKey.trim() : DEFAULT_RENDER_MCP_API_KEY;
    const masked = key.length > 8
      ? `${key.substring(0, 8)}••••${key.substring(key.length - 4)}`
      : '••••••••';
    return {
      enabled,
      renderApiKey: key,
      julesDebugEnabled,
      maskedKey: masked,
      mcpServerUrl: 'https://api.render.com/v1/mcp'
    };
  } catch (e) {
    console.warn("getMcpConfig error:", e);
    return {
      enabled: true,
      renderApiKey: DEFAULT_RENDER_MCP_API_KEY,
      julesDebugEnabled: true,
      maskedKey: 'rnd_yJ0Q••••6t8',
      mcpServerUrl: 'https://api.render.com/v1/mcp'
    };
  }
}

export function saveMcpConfig(enabled: boolean, renderApiKey: string, julesDebugEnabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MCP_ENABLED_STORAGE, enabled ? 'true' : 'false');
    localStorage.setItem(JULES_DEBUG_ENABLED_STORAGE, julesDebugEnabled ? 'true' : 'false');
    const trimmed = renderApiKey.trim();
    if (trimmed) {
      localStorage.setItem(RENDER_MCP_API_KEY_STORAGE, trimmed);
    } else {
      localStorage.removeItem(RENDER_MCP_API_KEY_STORAGE);
    }
    window.dispatchEvent(new Event('duowindo_mcp_config_changed'));
    window.dispatchEvent(new Event('duowindo_api_key_changed'));
  } catch (e) {
    console.warn("saveMcpConfig error:", e);
  }
}

