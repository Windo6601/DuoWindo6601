import { UserProgress } from '../types';
import { SystemCompatibilityResult } from './systemCompatibilityService';

export const APP_NAME = 'DuoWindo6601';
export const APP_VERSION = '1.0.4';
export const APP_PWA_CORE_VERSION = 'v2026.11';
export const APP_BUILD_CODE = '6601.2026.11';
export const APP_RELEASE_DATE = '2026-11-13';
export const APP_CODENAME = 'Nova Max';
export const APP_CHANNEL = 'Release • PWA Core';
export const APP_BETA_VERSION = '1.0.5-beta.1';
export const APP_BETA_CHANNEL = 'Beta Channel • PWA Early Access';
export const APP_STORAGE_KEY_PROTECTED = 'duowindo6601_user_progress_v1';
export const APP_GITHUB_REPO_URL = 'https://github.com/Windo6601/DuoWindo6601';
export const APP_IS_OPEN_SOURCE = true;

export interface ReleaseNoteEntry {
  version: string;
  pwaVersion: string;
  date: string;
  codename: string;
  badgeRu: string;
  badgeEn: string;
  highlightsRu: string[];
  highlightsEn: string[];
}

export const APP_RELEASE_NOTES: ReleaseNoteEntry[] = [
  {
    version: '1.0.4',
    pwaVersion: 'v2026.11',
    date: '2026-11-13',
    codename: 'Nova Max',
    badgeRu: 'Текущая версия',
    badgeEn: 'Current Release',
    highlightsRu: [
      'Единый центр версии DuoWindo6601: журнал изменений, проверка целостности профиля и диагностика кэша без сброса прогресса',
      'Интеграция Stripe Checkout для подписок Super/Max и наборов алмазов (+20% и +35% бонус на крупные пакеты)',
      'Быстрая разблокировка ИИ-партнёра Max и видеозвонков прямо во время прохождения урока',
      'Полная синхронизация номера сборки в Настройках, окне входа, PWA-обновлениях и JSON-бэкапах'
    ],
    highlightsEn: [
      'Unified DuoWindo6601 Version Center: changelog, non-destructive profile integrity verification, and cache diagnostics',
      'Stripe Checkout integration for Super/Max plans and Gem top-up packs (+20% & +35% bonus on large packs)',
      'Instant in-lesson Max upgrade flow for Roleplays & AI Video Call',
      'Unified build metadata across Settings, Auth Modal, PWA Suite, and local JSON backups'
    ]
  },
  {
    version: '1.0.3',
    pwaVersion: 'v2026.10',
    date: '2026-11-01',
    codename: 'Global Unlock',
    badgeRu: 'Предыдущий релиз',
    badgeEn: 'Previous Release',
    highlightsRu: [
      'Открыто переключение 15 мировых и СНГ языков и раздел «Письмо» без ограничений',
      'Сняты ограничения с 8 бета-курсов (Эсперанто, Латынь, Татарский, Клингонский и др.)',
      'Улучшены шахматная арена, голосовой движок Fish Audio / SAPI 5.3 и тренажёр стихотворений'
    ],
    highlightsEn: [
      'Unlocked 15 World & CIS languages and interactive Letters writing section',
      'Removed beta restrictions across 8 specialized & constructed language courses',
      'Upgraded Chess Arena, Fish Audio / SAPI 5.3 voice providers, and Poetry Trainer'
    ]
  },
  {
    version: '1.0.2',
    pwaVersion: 'v2026.10',
    date: '2026-10-10',
    codename: 'Core Shield',
    badgeRu: 'Архив',
    badgeEn: 'Archive',
    highlightsRu: [
      'Запущен DuoWindo6601 System Checker (Windows, macOS, Linux, Android, iOS/iPadOS)',
      'PWA Update & Security Suite с проверкой Service Worker и автоочисткой кэша',
      'Экспорт прогресса Firestore & Auth и локальное резервное копирование'
    ],
    highlightsEn: [
      'Launched DuoWindo6601 System Checker (Windows, macOS, Linux, Android, iOS/iPadOS)',
      'PWA Update & Security Suite with Service Worker and cache management',
      'Firestore & Auth JSON export and local progress backup'
    ]
  }
];

export interface AppRuntimeDiagnostics {
  checkedAt: string;
  appVersion: string;
  pwaCoreVersion: string;
  buildCode: string;
  displayMode: 'standalone' | 'browser';
  isOnline: boolean;
  serviceWorkerSupported: boolean;
  serviceWorkerActive: boolean;
  cacheStorageSupported: boolean;
  cacheBucketCount: number;
  localStorageHealthy: boolean;
  progressKeyFound: boolean;
  progressSizeKb: string;
  osLabel: string;
  browserLabel: string;
  activeCourseId: string;
  subscriptionTier: string;
  isBetaTester: boolean;
}

/**
 * Safely collects read-only runtime diagnostics for DuoWindo6601 without
 * mutating any user progress or localStorage entries.
 */
export async function collectAppDiagnostics(
  user: UserProgress,
  systemInfo: SystemCompatibilityResult
): Promise<AppRuntimeDiagnostics> {
  let displayMode: 'standalone' | 'browser' = 'browser';
  try {
    const isStandaloneMedia = typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches;
    const isIosStandalone = typeof navigator !== 'undefined' && (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandaloneMedia || isIosStandalone) {
      displayMode = 'standalone';
    }
  } catch {
    displayMode = 'browser';
  }

  let localStorageHealthy = false;
  let progressKeyFound = false;
  let progressSizeKb = '0.0';
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorageHealthy = true;
      const raw = window.localStorage.getItem(APP_STORAGE_KEY_PROTECTED);
      if (raw !== null) {
        progressKeyFound = true;
        progressSizeKb = (new Blob([raw]).size / 1024).toFixed(1);
      }
    }
  } catch {
    localStorageHealthy = false;
  }

  const serviceWorkerSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  let serviceWorkerActive = false;
  if (serviceWorkerSupported) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      serviceWorkerActive = Boolean(reg?.active || reg?.waiting || reg?.installing);
    } catch {
      serviceWorkerActive = false;
    }
  }

  const cacheStorageSupported = typeof window !== 'undefined' && 'caches' in window;
  let cacheBucketCount = 0;
  if (cacheStorageSupported) {
    try {
      const keys = await window.caches.keys();
      cacheBucketCount = keys.length;
    } catch {
      cacheBucketCount = 0;
    }
  }

  let activeCourseId = 'en';
  try {
    activeCourseId = (typeof window !== 'undefined' && window.localStorage?.getItem('duo_course_id_6601')) || 'en';
  } catch {
    activeCourseId = 'en';
  }

  const isBetaBuildActive = Boolean(user.isBetaTester && user.installedAppChannel === 'beta');

  return {
    checkedAt: new Date().toLocaleTimeString(),
    appVersion: isBetaBuildActive ? APP_BETA_VERSION : APP_VERSION,
    pwaCoreVersion: APP_PWA_CORE_VERSION,
    buildCode: APP_BUILD_CODE,
    displayMode,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    serviceWorkerSupported,
    serviceWorkerActive,
    cacheStorageSupported,
    cacheBucketCount,
    localStorageHealthy,
    progressKeyFound,
    progressSizeKb,
    osLabel: `${systemInfo.osName}${systemInfo.osVersion ? ` (${systemInfo.osVersion})` : ''}`,
    browserLabel: `${systemInfo.browserName}${systemInfo.browserVersion > 0 ? ` v${systemInfo.browserVersion}` : ''}`,
    activeCourseId,
    subscriptionTier: user.subscription || 'free',
    isBetaTester: Boolean(user.isBetaTester)
  };
}

export function formatDiagnosticsReport(diag: AppRuntimeDiagnostics, user: UserProgress): string {
  return [
    `${APP_NAME} v${diag.appVersion} (${diag.pwaCoreVersion} • Build ${diag.buildCode} • ${APP_CODENAME})`,
    `Channel: ${diag.isBetaTester ? APP_BETA_CHANNEL : APP_CHANNEL}`,
    `Mode: ${diag.displayMode === 'standalone' ? 'PWA Standalone' : 'Web Browser'} | Network: ${diag.isOnline ? 'Online' : 'Offline'}`,
    `OS: ${diag.osLabel} | Browser: ${diag.browserLabel}`,
    `Service Worker: ${diag.serviceWorkerSupported ? (diag.serviceWorkerActive ? 'Active' : 'Registered/Idle') : 'Unsupported'} | Cache Buckets: ${diag.cacheBucketCount}`,
    `Profile Integrity (${APP_STORAGE_KEY_PROTECTED}): ${diag.progressKeyFound ? `OK (${diag.progressSizeKb} KB)` : 'Memory State'}`,
    `Account: @${user.username || 'learner'} | Tier: ${diag.subscriptionTier.toUpperCase()} | Beta: ${diag.isBetaTester ? 'Joined' : 'Not Joined'} | XP: ${user.xp || 0} | Course: ${diag.activeCourseId.toUpperCase()}`,
    `Open Source (GitHub): ${APP_GITHUB_REPO_URL}`,
    `Checked at: ${diag.checkedAt}`
  ].join('\n');
}
