import { APP_VERSION, APP_PWA_CORE_VERSION, APP_BUILD_CODE } from './appVersionService';

export const PENDING_PWA_UPDATE_KEY = 'duowindo_pending_pwa_update_v1';
export const LAST_PWA_PATCH_KEY = 'duowindo_last_pwa_patch_v1';

export interface PendingPwaUpdatePayload {
  startedAt: number;
  version: string;
  pwaCoreVersion: string;
  buildCode: string;
  lang: string;
  status: 'pending_post_reload' | 'installing';
}

export interface InstalledPwaPatchInfo {
  installedAt: string;
  timestamp: number;
  version: string;
  pwaCoreVersion: string;
  buildCode: string;
  signatureShort: string;
  modules: string[];
}

export function setPendingPwaUpdate(lang: string = 'ru'): PendingPwaUpdatePayload {
  const payload: PendingPwaUpdatePayload = {
    startedAt: Date.now(),
    version: APP_VERSION,
    pwaCoreVersion: APP_PWA_CORE_VERSION,
    buildCode: APP_BUILD_CODE,
    lang,
    status: 'pending_post_reload',
  };

  const serialized = JSON.stringify(payload);
  try {
    window.sessionStorage.setItem(PENDING_PWA_UPDATE_KEY, serialized);
  } catch {
    // Ignore sessionStorage restrictions
  }
  try {
    window.localStorage.setItem(PENDING_PWA_UPDATE_KEY, serialized);
  } catch {
    // Ignore localStorage restrictions
  }
  return payload;
}

export function readPendingPwaUpdate(): PendingPwaUpdatePayload | null {
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(PENDING_PWA_UPDATE_KEY);
  } catch {
    raw = null;
  }
  if (!raw) {
    try {
      raw = window.localStorage.getItem(PENDING_PWA_UPDATE_KEY);
    } catch {
      raw = null;
    }
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingPwaUpdatePayload;
    // Expire stale flags older than 10 minutes
    if (!parsed?.startedAt || Date.now() - parsed.startedAt > 10 * 60 * 1000) {
      clearPendingPwaUpdate();
      return null;
    }
    return parsed;
  } catch {
    clearPendingPwaUpdate();
    return null;
  }
}

export function clearPendingPwaUpdate(): void {
  try {
    window.sessionStorage.removeItem(PENDING_PWA_UPDATE_KEY);
  } catch {
    // Ignore
  }
  try {
    window.localStorage.removeItem(PENDING_PWA_UPDATE_KEY);
  } catch {
    // Ignore
  }
}

export function saveInstalledPwaPatch(signatureShort: string): InstalledPwaPatchInfo {
  const info: InstalledPwaPatchInfo = {
    installedAt: new Date().toLocaleString(),
    timestamp: Date.now(),
    version: APP_VERSION,
    pwaCoreVersion: APP_PWA_CORE_VERSION,
    buildCode: APP_BUILD_CODE,
    signatureShort,
    modules: [
      'UI & PWA Core',
      'Audio Engine (Fish Audio & WebAudio)',
      'Firestore Security Rules v2',
      'SHA-256 & TLS 1.3 Signature',
    ],
  };

  try {
    window.localStorage.setItem(LAST_PWA_PATCH_KEY, JSON.stringify(info));
  } catch {
    // Ignore
  }
  return info;
}

export function getLastInstalledPwaPatch(): InstalledPwaPatchInfo | null {
  try {
    const raw = window.localStorage.getItem(LAST_PWA_PATCH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as InstalledPwaPatchInfo;
  } catch {
    return null;
  }
}

export async function computePatchSha256Short(): Promise<string> {
  const seed = `DuoWindo6601:${APP_VERSION}:${APP_PWA_CORE_VERSION}:${APP_BUILD_CODE}:${new Date().toISOString().slice(0, 10)}`;
  try {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const encoded = new TextEncoder().encode(seed);
      const digest = await window.crypto.subtle.digest('SHA-256', encoded);
      const hex = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
      return `${hex.slice(0, 8)}-${hex.slice(8, 16)}`;
    }
  } catch {
    // Fallback digest below
  }
  return '6601A4F9-SEC2026B';
}

export async function preparePwaCachesAndWorker(): Promise<void> {
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((k) => window.caches.delete(k)));
    }
  } catch {
    // Ignore cache clear failure
  }

  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    }
  } catch {
    // Ignore service worker update failure
  }
}

export async function verifyServiceWorkerRegistration(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        return Boolean(reg.active || reg.waiting || reg.installing);
      }
    }
  } catch {
    // Ignore SW check error
  }
  return false;
}
