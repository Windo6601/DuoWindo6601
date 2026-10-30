/**
 * Domain Migration & Access Restriction Service for DuoWindo6601
 * 
 * Policy:
 * 1 ноября 2026 года — прекращение работы адреса us-east1.run.app.
 * Начиная с 1 ноября 2026 года доступ по адресу us-east1.run.app полностью закрыт (Ограничение адреса).
 * Доступ доступен исключительно на ai.studio / duowindo6601.ai.studio.
 */

export const RUN_APP_CLOSURE_DATE_ISO = '2026-11-01T00:00:00Z';
export const NEW_OFFICIAL_DOMAIN = 'duowindo6601.ai.studio';
export const NEW_OFFICIAL_URL = 'https://duowindo6601.ai.studio';
export const AI_STUDIO_URL = 'https://ai.studio';
export const DOMAIN_SIM_STORAGE_KEY = 'duo_domain_sim_mode_6601';

export type DomainSimMode = 'auto' | 'sim_blocked' | 'sim_warning' | 'sim_official';

/**
 * Checks if the current host or provided hostname belongs to Cloud Run preview (us-east1.run.app)
 */
export const isRunAppHost = (hostname?: string): boolean => {
  if (typeof window === 'undefined' && !hostname) return false;
  const host = (hostname || window.location.hostname || '').toLowerCase();
  return host.includes('us-east1.run.app') || host.endsWith('.run.app');
};

/**
 * Checks if the host is already the new official domain
 */
export const isOfficialStudioHost = (hostname?: string): boolean => {
  if (typeof window === 'undefined' && !hostname) return false;
  const host = (hostname || window.location.hostname || '').toLowerCase();
  return host.includes('duowindo6601.ai.studio') || host.includes('ai.studio');
};

/**
 * Retrieves the currently saved simulation mode (for testing both states)
 */
export const getDomainSimMode = (): DomainSimMode => {
  if (typeof window === 'undefined') return 'auto';
  try {
    const saved = localStorage.getItem(DOMAIN_SIM_STORAGE_KEY) as DomainSimMode | null;
    if (saved && ['auto', 'sim_blocked', 'sim_warning', 'sim_official'].includes(saved)) {
      return saved;
    }
  } catch {}
  return 'auto';
};

/**
 * Sets simulation mode
 */
export const setDomainSimMode = (mode: DomainSimMode): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DOMAIN_SIM_STORAGE_KEY, mode);
  } catch {}
};

/**
 * Calculates time remaining until November 1, 2026
 */
export interface TimeRemaining {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export const getTimeUntilRunAppClosure = (referenceDate?: Date): TimeRemaining => {
  const target = new Date(RUN_APP_CLOSURE_DATE_ISO).getTime();
  const now = (referenceDate || new Date()).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return {
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: true,
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    totalMs: diff,
    days,
    hours,
    minutes,
    seconds,
    isPast: false,
  };
};

/**
 * Formatted countdown string for UI
 */
export const formatTimeUntilClosure = (remaining: TimeRemaining, isRu: boolean = true): string => {
  if (remaining.isPast) {
    return isRu ? 'Срок истёк (1 нояб. 2026)' : 'Expired (Nov 1, 2026)';
  }
  if (isRu) {
    return `${remaining.days} дн. ${remaining.hours} ч. ${remaining.minutes} мин.`;
  }
  return `${remaining.days}d ${remaining.hours}h ${remaining.minutes}m`;
};

/**
 * Determines whether access to us-east1.run.app is completely blocked.
 * If blocked: user must see the full-screen restriction page.
 */
export const isRunAppAccessBlocked = (simMode?: DomainSimMode): boolean => {
  const mode = simMode || getDomainSimMode();
  
  if (mode === 'sim_blocked') return true;
  if (mode === 'sim_warning' || mode === 'sim_official') return false;

  // Auto mode:
  // Check if we are on a run.app domain and past deadline
  const onRunApp = isRunAppHost();
  const pastDeadline = getTimeUntilRunAppClosure().isPast;

  return onRunApp && pastDeadline;
};

/**
 * Determines whether the pre-deadline warning banner should be displayed.
 */
export const isRunAppWarningActive = (simMode?: DomainSimMode): boolean => {
  const mode = simMode || getDomainSimMode();

  if (mode === 'sim_warning') return true;
  if (mode === 'sim_blocked' || mode === 'sim_official') return false;

  // Auto mode:
  const onRunApp = isRunAppHost();
  const pastDeadline = getTimeUntilRunAppClosure().isPast;

  return onRunApp && !pastDeadline;
};

/**
 * Redirects the browser / top window from us-east1.run.app to the official domain duowindo6601.ai.studio / ai.studio
 */
export const redirectToOfficialDomain = (): void => {
  if (typeof window === 'undefined') return;
  try {
    if (window.top && window.top !== window) {
      window.top.location.href = NEW_OFFICIAL_URL;
    } else {
      window.location.replace(NEW_OFFICIAL_URL);
    }
  } catch {
    window.location.href = NEW_OFFICIAL_URL;
  }
};
