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
  return host.includes('duowindo6601.ai.studio') || host.includes('ai.studio') || host.includes('aistudio.google.com');
};

/**
 * Checks if the app is running in hosted Cloud Run (us-east1.run.app) or AI Studio (ai.studio),
 * where offline mode and offline fallback banners must be disabled.
 */
export const isOnlineHostedEnvironment = (hostname?: string): boolean => {
  return isRunAppHost(hostname) || isOfficialStudioHost(hostname);
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

export const RUN_APP_CONTINUED_STORAGE_KEY = 'duo_runapp_continued_risk_accepted_6601';

/**
 * Checks if user chose to continue using the application on us-east1.run.app despite the restriction and risk.
 */
export const isRunAppContinuedRiskAccepted = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(RUN_APP_CONTINUED_STORAGE_KEY) === 'true' ||
           localStorage.getItem(RUN_APP_CONTINUED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

/**
 * Sets whether the user has accepted the risk to continue using on us-east1.run.app
 */
export const setRunAppContinuedRiskAccepted = (accepted: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    if (accepted) {
      sessionStorage.setItem(RUN_APP_CONTINUED_STORAGE_KEY, 'true');
      localStorage.setItem(RUN_APP_CONTINUED_STORAGE_KEY, 'true');
    } else {
      sessionStorage.removeItem(RUN_APP_CONTINUED_STORAGE_KEY);
      localStorage.removeItem(RUN_APP_CONTINUED_STORAGE_KEY);
    }
  } catch {}
};

/**
 * Determines whether access to us-east1.run.app is completely blocked.
 * If blocked: user must see the full-screen restriction page unless they choose to continue with risk.
 */
export const isRunAppAccessBlocked = (simMode?: DomainSimMode, checkRiskBypass: boolean = true): boolean => {
  const mode = simMode || getDomainSimMode();
  
  if (mode === 'sim_blocked') return true;
  // By default (including auto mode and AI Studio preview), access is active and unblocked. No warning/block banner.
  return false;
};

/**
 * Determines whether the user is continuing to use us-east1.run.app under risk warning.
 */
export const isRunAppRiskWarningActive = (simMode?: DomainSimMode): boolean => {
  const mode = simMode || getDomainSimMode();
  if (mode === 'sim_warning') return true;
  // No warning banner or risk popup in AI Studio or default mode
  return false;
};

/**
 * Determines whether the pre-deadline warning banner should be displayed.
 */
export const isRunAppWarningActive = (simMode?: DomainSimMode): boolean => {
  const mode = simMode || getDomainSimMode();

  if (mode === 'sim_warning') return true;
  // No warning banner in AI Studio or default mode
  return false;
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
