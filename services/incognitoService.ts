import { UserProgress } from '../types';

/**
 * Official closure date for "Режим Инкогнито (Без аккаунта)":
 * 10 октября 2026 года (2026-10-10T00:00:00).
 */
export const INCOGNITO_CLOSURE_DATE = new Date('2026-10-10T00:00:00');

/**
 * Key for simulated closure testing (can be used for previewing on/after Oct 10 2026)
 */
export const INCOGNITO_SIMULATE_CLOSED_KEY = 'duowindo_simulate_incognito_closed_2026';

/**
 * Checks whether entry into Incognito Mode is closed.
 * Automatically true on or after October 10, 2026.
 */
export function isIncognitoLoginClosed(): boolean {
  try {
    const simulated = sessionStorage.getItem(INCOGNITO_SIMULATE_CLOSED_KEY);
    if (simulated === 'true') return true;
    if (simulated === 'false') return false;
  } catch {
    // ignore sessionStorage errors
  }
  return new Date() >= INCOGNITO_CLOSURE_DATE;
}

/**
 * Calculates remaining days until October 10, 2026 closure.
 * Returns negative or 0 if already closed.
 */
export function getDaysUntilIncognitoClosure(): number {
  const now = new Date();
  const diffMs = INCOGNITO_CLOSURE_DATE.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formatted closure date string for display.
 */
export function getFormattedClosureDate(language: string = 'ru'): string {
  if (language === 'ru') return '10 октября 2026 года';
  if (language === 'de') return '10. Oktober 2026';
  if (language === 'fr') return '10 octobre 2026';
  if (language === 'es') return '10 de octubre de 2026';
  if (language === 'ja') return '2026年10月10日';
  if (language === 'zh') return '2026年10月10日';
  if (language === 'ar') return '10 أكتوبر 2026';
  return 'October 10, 2026';
}

/**
 * Official warning notice:
 * "После 10 октября 2026 год недоступна Инкогнито и ее нельзя будет восстановить в DuoWindo6601. Если вы хотите сохранить какой-либо контент, мы рекомендуем заранее экспортировать данные Firebase Firestore & Auth через Раздел «Профиль» и Раздел «Настройки»."
 */
export function getIncognitoPermanentClosureWarning(language: string = 'ru'): string {
  if (language === 'ru') {
    return 'После 10 октября 2026 года Режим Инкогнито будет недоступен, и его нельзя будет восстановить в DuoWindo6601. Если вы хотите сохранить какой-либо контент, мы рекомендуем заранее экспортировать данные Firebase Firestore & Auth через Раздел «Профиль» и Раздел «Настройки».';
  }
  return 'After October 10, 2026, Incognito Mode will be unavailable and cannot be restored in DuoWindo6601. If you want to save any content, we recommend exporting your Firebase Firestore & Auth data in advance via the Profile and Settings sections.';
}

/**
 * Check if the user is considered an Incognito / Guest user.
 */
export function isIncognitoUser(user: UserProgress, firebaseUser: any = null): boolean {
  if (firebaseUser) return false;
  return Boolean(
    !user.username ||
    user.username.startsWith('incognito_') ||
    user.name?.includes('Гость') ||
    user.name?.includes('Incognito') ||
    user.authProvider === 'guest'
  );
}

export interface IncognitoExportPayload {
  version: '1.0';
  app: 'DuoWindo6601';
  exportedAt: string;
  source: 'Режим Инкогнито (Без аккаунта)';
  closureDate: '2026-10-10';
  closureNotice: string;
  summary: {
    username: string;
    displayName: string;
    xp: number;
    gems: number;
    streak: number;
    maxStreak: number;
    hearts: number;
    energy: number;
    language: string;
    country: string;
    subscription: string;
    completedLessonsCount: number;
    learnedWordsCount: number;
    mistakesCount: number;
    chessGamesCount: number;
    chessWinsCount: number;
    chessElo: number;
  };
  userData: UserProgress;
}

/**
 * Generates the complete JSON data export structure for Incognito mode.
 */
export function generateIncognitoExportData(user: UserProgress, language: string = 'ru'): IncognitoExportPayload {
  const isRu = language === 'ru';
  return {
    version: '1.0',
    app: 'DuoWindo6601',
    exportedAt: new Date().toISOString(),
    source: 'Режим Инкогнито (Без аккаунта)',
    closureDate: '2026-10-10',
    closureNotice: getIncognitoPermanentClosureWarning(language),
    summary: {
      username: user.username || 'incognito_guest',
      displayName: user.name || 'Гость (Инкогнито)',
      xp: user.xp || 0,
      gems: user.gems || 0,
      streak: user.streak || 0,
      maxStreak: user.maxStreak || user.streak || 0,
      hearts: user.hearts ?? 5,
      energy: user.energy ?? 100,
      language: user.language || 'ru',
      country: user.country || 'RU',
      subscription: user.subscription || 'free',
      completedLessonsCount: user.completedLessons?.length || 0,
      learnedWordsCount: user.learnedWords?.length || 0,
      mistakesCount: user.mistakes?.length || 0,
      chessGamesCount: user.chessStats?.games || 0,
      chessWinsCount: user.chessStats?.wins || 0,
      chessElo: user.chessStats?.elo || 1200,
    },
    userData: {
      ...user,
      // sanitize any sensitive runtime handles if needed
    },
  };
}

/**
 * Downloads the exported Incognito data as a formatted .json file.
 */
export function downloadIncognitoDataFile(user: UserProgress, language: string = 'ru'): string {
  const exportObj = generateIncognitoExportData(user, language);
  const jsonStr = JSON.stringify(exportObj, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const dateStr = new Date().toISOString().split('T')[0];
  const cleanUsername = (user.username || 'incognito').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `duowindo6601_incognito_backup_${cleanUsername}_${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Copies the exported JSON data directly to the user's clipboard.
 */
export async function copyIncognitoDataToClipboard(user: UserProgress, language: string = 'ru'): Promise<boolean> {
  const exportObj = generateIncognitoExportData(user, language);
  const jsonStr = JSON.stringify(exportObj, null, 2);

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(jsonStr);
      return true;
    }
  } catch {
    // fallback
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = jsonStr;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}
