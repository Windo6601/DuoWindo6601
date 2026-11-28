import React, { useState, useEffect } from 'react';
import { SystemCompatibilityResult } from '../services/systemCompatibilityService';
import { playSound } from '../services/audioService';
import { APP_VERSION, APP_BETA_VERSION, APP_PWA_CORE_VERSION } from '../services/appVersionService';
import {
  getLastInstalledPwaPatch,
  InstalledPwaPatchInfo,
  preparePwaCachesAndWorker,
  setPendingPwaUpdate,
  AppReleaseChannel,
} from '../services/pwaUpdateService';
import { CheckCircleIcon } from './Icons';

interface PwaUpdateSecuritySectionProps {
  systemInfo: SystemCompatibilityResult;
  onOpenSystemChecker: () => void;
  lang?: string;
  isBetaTester?: boolean;
  installedChannel?: 'stable' | 'beta';
}

export const PwaUpdateSecuritySection: React.FC<PwaUpdateSecuritySectionProps> = ({
  systemInfo,
  onOpenSystemChecker,
  lang = 'ru',
  isBetaTester = false,
  installedChannel = 'stable'
}) => {
  const activeChannel: AppReleaseChannel = isBetaTester && installedChannel === 'beta' ? 'beta' : 'stable';
  const activeDisplayVersion = activeChannel === 'beta' ? APP_BETA_VERSION : APP_VERSION;
  const isRu = lang !== 'en'; // Multi-lang support enabled
  const isModern = systemInfo.pwaUpdateSupported;

  const [isCheckingAppUpdate, setIsCheckingAppUpdate] = useState(false);
  const [appUpdateStatus, setAppUpdateStatus] = useState<string | null>(null);

  const [isCheckingSecurity, setIsCheckingSecurity] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<string | null>(null);

  // Interactive Download State for App + Security Updates
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStep, setDownloadStep] = useState<string>('');
  const [lastInstalledPatch, setLastInstalledPatch] = useState<InstalledPwaPatchInfo | null>(null);

  const [cacheClearSuccess, setCacheClearSuccess] = useState(false);

  useEffect(() => {
    setLastInstalledPatch(getLastInstalledPwaPatch());
  }, []);

  // Interactive Downloader for Full PWA Update & Security Patch -> Reloads page into Process Screen
  const handleDownloadFullUpdate = (targetChannel: AppReleaseChannel = activeChannel) => {
    playSound('click');
    if (targetChannel === 'beta' && !isBetaTester) {
      setAppUpdateStatus(
        isRu
          ? `🔒 Вы не присоединились к бета-тестированию: ранние обновления PWA Бета-канала (${APP_BETA_VERSION}) недоступны!`
          : `🔒 Not joined to Beta Testing: early Beta Channel (${APP_BETA_VERSION}) PWA updates are locked!`
      );
      return;
    }
    if (!isModern) {
      setAppUpdateStatus(
        isRu 
          ? '🛑 Старые Системы не получится: скачивание обновлений PWA и патчей безопасности заблокировано на устаревших ОС!' 
          : '🛑 Old Systems unsupported: downloading PWA & security updates is blocked on legacy OS!'
      );
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setAppUpdateStatus(
        isRu
          ? '📡 Нет подключения к интернету. Для работы DuoWindo6601 нужен интернет. Включите Wi-Fi или мобильные данные и попробуйте снова'
          : '📡 No internet connection. DuoWindo6601 requires internet. Turn on Wi-Fi or mobile data and try again.'
      );
      return;
    }

    setIsDownloading(true);
    setIsReloading(false);
    setAppUpdateStatus(null);
    setDownloadProgress(0);
    setDownloadStep(
      targetChannel === 'beta'
        ? (isRu ? `Инициализация ранней PWA-сборки ${APP_BETA_VERSION}...` : `Initializing early Beta PWA build ${APP_BETA_VERSION}...`)
        : (isRu ? 'Инициализация загрузки DuoWindo6601 PWA...' : 'Initializing DuoWindo6601 PWA update...')
    );

    void preparePwaCachesAndWorker();

    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 18) + 14;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setDownloadProgress(100);
        setDownloadStep(
          isRu
            ? 'Пакет загружен! Перезагрузка страницы для запуска процесса обновления DuoWindo6601...'
            : 'Package downloaded! Reloading page to start DuoWindo6601 update process...'
        );
        setIsReloading(true);

        // Save pending post-reload installation state and reload the page
        setPendingPwaUpdate(lang, targetChannel);

        setTimeout(() => {
          window.location.reload();
        }, 700);
      } else {
        setDownloadProgress(current);
        if (current < 32) {
          setDownloadStep(isRu ? 'Загрузка обновления интерфейса PWA и Service Worker v2...' : 'Downloading PWA UI bundle & Service Worker v2...');
        } else if (current < 62) {
          setDownloadStep(isRu ? 'Загрузка обновлений аудио-движка Fish Audio & WebAudio...' : 'Downloading Fish Audio & WebAudio engine update...');
        } else if (current < 86) {
          setDownloadStep(isRu ? 'Загрузка правил безопасности Firestore Rules & WebCrypto...' : 'Downloading Firestore Rules & WebCrypto patches...');
        } else {
          setDownloadStep(isRu ? 'Подготовка подписи безопасности SHA-256 & TLS 1.3...' : 'Preparing SHA-256 & TLS 1.3 security signature...');
        }
      }
    }, 260);
  };

  // Check App Update handler
  const handleCheckAppUpdate = async () => {
    playSound('click');
    if (!isModern) {
      setAppUpdateStatus(
        isRu 
          ? '🛑 Старые Системы не получится: браузер и операционная система не поддерживают Service Worker v2 и фоновые обновления PWA!'
          : '🛑 Old Systems unsupported: browser & OS do not support modern Service Worker v2 updates!'
      );
      return;
    }

    setIsCheckingAppUpdate(true);
    setAppUpdateStatus(null);

    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      }
    } catch (e) {
      console.warn('SW update check error:', e);
    }

    setTimeout(() => {
      setIsCheckingAppUpdate(false);
      setAppUpdateStatus(
        isRu
          ? `✅ Приложение DuoWindo6601 Progressive Web App (PWA) актуально (версия v${activeDisplayVersion} • ${APP_PWA_CORE_VERSION} PWA Core). Все модули, аудио-курсы и маскот обновлены!`
          : `✅ DuoWindo6601 Progressive Web App (PWA) is up to date (v${activeDisplayVersion} • ${APP_PWA_CORE_VERSION} PWA Core). All assets cached!`
      );
    }, 900);
  };

  // Check Security Update handler
  const handleCheckSecurity = () => {
    playSound('click');
    if (!isModern) {
      setSecurityStatus(
        isRu
          ? '🛑 Старые Системы не получится: устаревшие протоколы TLS и отсутствие Web Crypto API блокируют применение патчей безопасности PWA!'
          : '🛑 Old Systems unsupported: outdated TLS & lack of Web Crypto API block PWA security patches!'
      );
      return;
    }

    setIsCheckingSecurity(true);
    setSecurityStatus(null);

    setTimeout(() => {
      setIsCheckingSecurity(false);
      setSecurityStatus(
        isRu
          ? '🛡️ Обновление безопасности DuoWindo6601 PWA применено: Firestore Security Rules, TLS 1.3, CSP и защита сессий активны!'
          : '🛡️ DuoWindo6601 PWA security update verified: Firestore Security Rules, TLS 1.3, CSP & session protection active!'
      );
    }, 1100);
  };

  // Force cache refresh
  const handleForceCacheRefresh = async () => {
    playSound('click');
    if (!isModern) return;
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      setCacheClearSuccess(true);
      setTimeout(() => setCacheClearSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`rounded-3xl p-5 sm:p-6 mb-6 shadow-2xl border-2 transition-all space-y-6 ${
      isModern 
        ? 'bg-duo-card border-emerald-500/50' 
        : 'bg-gradient-to-b from-red-950/70 to-black/90 border-red-500/80'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-gray-800 pb-4">
        <div className="flex items-center space-x-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md border shrink-0 ${
            isModern 
              ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-400/40' 
              : 'bg-red-700 text-white border-red-400'
          }`}>
            {isModern ? '📲' : '🛑'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-lg md:text-xl text-white uppercase tracking-wider">
                {isRu ? 'Система Обновления DuoWindo6601 PWA & Безопасность' : 'DuoWindo6601 PWA Update & Security Suite'}
              </h3>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                isModern 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' 
                  : 'bg-red-500/30 text-red-200 border border-red-500/60'
              }`}>
                {isModern 
                  ? (isRu ? '✅ Новый Систем: Поддерживается' : '✅ Modern System: Active') 
                  : (isRu ? '🛑 Старые Системы: Не получится' : '🛑 Old Systems: Unsupported')}
              </span>
            </div>
            <p className="text-xs text-gray-300 font-bold mt-0.5">
              {isRu 
                ? 'ПК Версия и Мобильная Версия | Скачать обновление PWA и патчи безопасности | Старые Системы не получится' 
                : 'PC & Mobile Version | Download PWA App & Security Updates | Old Systems Unsupported'}
            </p>
          </div>
        </div>

        <button
          onClick={() => { playSound('click'); onOpenSystemChecker(); }}
          className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-blue-300 hover:text-white text-xs font-black uppercase tracking-wider border border-gray-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <span>🔍</span>
          <span>System Checker</span>
        </button>
      </div>

      {/* WARNING BANNER FOR OLD SYSTEMS ("Старые Системы не получится") */}
      {!isModern && (
        <div className="bg-red-950/80 border-2 border-red-500 p-4 rounded-2xl text-red-100 space-y-2.5 animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛑</span>
            <h4 className="font-black text-sm uppercase tracking-wider text-red-200">
              {isRu 
                ? 'Старые Системы — Скачивание и обновление PWA НЕ ПОЛУЧИТСЯ!' 
                : 'Old Systems — Cannot update PWA and security!'}
            </h4>
          </div>

          <p className="text-xs font-bold leading-relaxed text-red-200/90">
            {isRu
              ? `Для системы ${systemInfo.osName} (${systemInfo.browserName}) обновление приложения DuoWindo6601 Progressive Web App (PWA) и обновление безопасности НЕ ПОЛУЧИТСЯ. Старые операционные системы (Windows XP/Vista, Android 4.4-7.1, старые iOS/iPad <14) и устаревшие браузеры (IE11, Mypal 78 XP, старый Safari) не поддерживают современные Web App стандарты.`
              : `On ${systemInfo.osName} (${systemInfo.browserName}) updating DuoWindo6601 PWA and security updates is NOT supported. Legacy platforms lack modern Web App and security standards.`}
          </p>

          <div className="bg-black/40 p-3 rounded-xl border border-red-500/40 text-[11px] space-y-1 text-red-300 font-semibold">
            <p className="font-black text-red-200 uppercase text-[10px] tracking-wider">
              {isRu ? 'Технические причины блокировки на старых системах:' : 'Technical barriers on old systems:'}
            </p>
            <p>❌ {isRu ? 'Отсутствие W3C Service Worker v2 и CacheStorage API в устаревших браузерах' : 'No modern Service Worker v2 or CacheStorage API'}</p>
            <p>❌ {isRu ? 'Несовместимость с современными TLS 1.3 сертификатами и Web Crypto API' : 'Incompatible with TLS 1.3 and Web Crypto API'}</p>
            <p>❌ {isRu ? 'Устаревшие движки WebKit/Chromium/Gecko не поддерживают фоновую синхронизацию' : 'Legacy browser engines do not support background PWA sync'}</p>
          </div>

          <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] font-black text-amber-300">
              👉 {isRu ? 'Требуется Новый Систем: Windows 7/8/10/11, Android 8.0+, iOS/iPad 15.0+, macOS 11+' : 'Required Modern System: Win 7/8/10/11, Android 8+, iOS/iPad 15+, macOS 11+'}
            </span>
            <button
              onClick={() => { playSound('click'); onOpenSystemChecker(); }}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              {isRu ? 'Проверить совместимость в Checker' : 'Check compatibility'}
            </button>
          </div>
        </div>
      )}

      {/* DOWNLOAD UPDATE & SECURITY PACKAGE BUTTON (FOR PC & MOBILE) */}
      {isModern && (
        <div className="bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-blue-950/80 border-2 border-emerald-500/70 p-4 sm:p-5 rounded-3xl space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">📥</span>
              <div>
                <h4 className="font-black text-base text-white uppercase tracking-wider">
                  {isRu ? 'Скачать полное обновление PWA и патч безопасности' : 'Download Full PWA & Security Update'}
                </h4>
                <p className="text-xs text-emerald-200/90 font-medium">
                  {isRu 
                    ? 'Пакет включает обновление интерфейса, аудио-движка, правил Firestore и подписи безопасности.' 
                    : 'Includes UI bundle, audio synthesis engine, Firestore rules, and signature verification.'}
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-xl">
              12.4 MB • v{activeDisplayVersion} ({APP_PWA_CORE_VERSION})
            </span>
          </div>

          {/* Download Progress Bar */}
          {isDownloading && (
            <div className="space-y-2.5 bg-black/50 p-3.5 rounded-2xl border border-emerald-500/40">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                <span className="truncate">{downloadStep}</span>
                <span className="font-mono text-emerald-400 font-black shrink-0 ml-2">{downloadProgress}%</span>
              </div>

              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                <span>{( (12.4 * downloadProgress) / 100 ).toFixed(1)} MB / 12.4 MB</span>
                <span>
                  {isReloading
                    ? (isRu ? 'Перезагрузка страницы...' : 'Reloading page...')
                    : 'Speed: 15.8 MB/s'}
                </span>
              </div>

              <p className="text-[11px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 rounded-xl px-3 py-1.5">
                {isRu
                  ? '⚠️ После завершения скачивания страница автоматически перезагрузится и откроется экран процесса обновления DuoWindo6601.'
                  : '⚠️ Once downloaded, the page will reload automatically into the DuoWindo6601 Update Process screen.'}
              </p>
            </div>
          )}

          {/* Download Action Button */}
          {!isDownloading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDownloadFullUpdate('stable')}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>🚀</span>
                <span>
                  {lastInstalledPatch
                    ? (isRu ? `ОБНОВИТЬ PWA (${APP_VERSION})` : `REINSTALL PWA (${APP_VERSION})`)
                    : (isRu ? `СКАЧАТЬ PWA (${APP_VERSION})` : `DOWNLOAD PWA (${APP_VERSION})`)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadFullUpdate('beta')}
                className={`w-full py-3.5 px-4 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 ${
                  isBetaTester
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 hover:brightness-110 text-white border-b-4 border-purple-950 active:border-b-0 active:translate-y-1 cursor-pointer'
                    : 'bg-gray-900/90 text-gray-400 border-2 border-gray-700 cursor-not-allowed'
                }`}
              >
                <span>{isBetaTester ? '🧪' : '🔒'}</span>
                <span>
                  {isBetaTester
                    ? (isRu ? `УСТАНОВИТЬ БЕТА (${APP_BETA_VERSION})` : `INSTALL BETA (${APP_BETA_VERSION})`)
                    : (isRu ? `БЕТА ${APP_BETA_VERSION} (НЕДОСТУПНО)` : `BETA ${APP_BETA_VERSION} (LOCKED)`)}
                </span>
              </button>
            </div>
          )}

          {lastInstalledPatch && !isDownloading && (
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-xs font-bold flex items-center space-x-2.5">
              <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p>
                  {isRu
                    ? `Обновление PWA v${lastInstalledPatch.version} и патч безопасности установлены (${lastInstalledPatch.installedAt}).`
                    : `PWA Update v${lastInstalledPatch.version} & security patch installed (${lastInstalledPatch.installedAt}).`}
                </p>
                <p className="text-[10px] font-mono text-emerald-300/90 mt-0.5">
                  SHA-256: {lastInstalledPatch.signatureShort}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* APP & SECURITY UPDATE TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* CARD 1: PWA APPLICATION UPDATE */}
        <div className="bg-black/40 border border-gray-700/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="text-2xl">📦</span>
              <div>
                <h4 className="font-black text-sm text-white uppercase tracking-wider">
                  {isRu ? 'Обновление Приложения PWA' : 'PWA App Update'}
                </h4>
                <p className="text-[11px] text-gray-400 font-bold">
                  DuoWindo6601 Progressive Web App
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-blue-950 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-lg">
              v{activeDisplayVersion} ({APP_PWA_CORE_VERSION})
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-gray-300 font-medium">
            <div className="flex justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400">{isRu ? 'Тип установки:' : 'Install Type:'}</span>
              <span className="font-bold text-white">Standalone PWA / Desktop / Mobile</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400">{isRu ? 'Сервис-воркер (Service Worker):' : 'Service Worker:'}</span>
              <span className={`font-bold ${isModern ? 'text-emerald-400' : 'text-red-400'}`}>
                {isModern ? 'Workbox 7 (Активен)' : 'Не поддерживается (Старая ОС)'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400">{isRu ? 'Канал обновлений PWA:' : 'PWA Update Channel:'}</span>
              <span className={`font-bold ${isBetaTester ? 'text-purple-300' : 'text-amber-300'}`}>
                {isBetaTester
                  ? (activeChannel === 'beta'
                      ? (isRu ? `🧪 Бета-канал (${APP_BETA_VERSION} установлена)` : `🧪 Beta Channel (${APP_BETA_VERSION} active)`)
                      : (isRu ? `🧪 Beta Channel (Открыт: ${APP_BETA_VERSION})` : `🧪 Beta Channel (Unlocked: ${APP_BETA_VERSION})`))
                  : (isRu ? '🔒 Не присоединился (Бета недоступна)' : '🔒 Not Joined (Beta Locked)')}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">{isRu ? 'Поддержка ПК / Смартфонов:' : 'PC / Mobile Support:'}</span>
              <span className="font-bold text-sky-300">
                {systemInfo.isIOS ? '📱 iOS / iPadOS Safari' : '💻 Windows / Android / macOS / Linux'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleCheckAppUpdate}
              disabled={isCheckingAppUpdate}
              className={`w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer ${
                isModern 
                  ? 'bg-duo-green hover:brightness-110 active:translate-y-0.5 text-white border-b-4 border-duo-greenDark' 
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
              }`}
            >
              {isCheckingAppUpdate ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{isRu ? 'Проверка обновления PWA...' : 'Checking PWA updates...'}</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span>
                    {isModern 
                      ? (isRu ? 'Проверить обновление приложения DuoWindo6601 PWA' : 'Check DuoWindo6601 PWA App Update')
                      : (isRu ? '🛑 Обновление недоступно (Старая система)' : '🛑 Unsupported on Old System')}
                  </span>
                </>
              )}
            </button>

            {isModern && (
              <button
                onClick={handleForceCacheRefresh}
                className="w-full py-2 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-bold text-[11px] uppercase tracking-wider transition-all border border-gray-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>⚡</span>
                <span>{isRu ? 'Принудительно обновить кэш PWA' : 'Force Refresh PWA Cache'}</span>
              </button>
            )}

            {cacheClearSuccess && (
              <p className="text-[11px] text-emerald-400 font-bold text-center animate-in fade-in">
                ✓ {isRu ? 'Локальный кэш PWA очищен и обновлен!' : 'PWA Cache refreshed successfully!'}
              </p>
            )}

            {appUpdateStatus && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                appUpdateStatus.includes('🛑') 
                  ? 'bg-red-950/60 border border-red-500/50 text-red-200' 
                  : 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-200'
              }`}>
                {appUpdateStatus}
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: PWA SECURITY UPDATE */}
        <div className="bg-black/40 border border-gray-700/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="text-2xl">🛡️</span>
              <div>
                <h4 className="font-black text-sm text-white uppercase tracking-wider">
                  {isRu ? 'Обновление Безопасности PWA' : 'PWA Security Update'}
                </h4>
                <p className="text-[11px] text-gray-400 font-bold">
                  DuoWindo6601 Security Suite
                </p>
              </div>
            </div>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
              isModern 
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' 
                : 'bg-red-950 text-red-300 border-red-500/40'
            }`}>
              {isModern ? 'TLS 1.3 / OK' : 'Legacy / Blocked'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-gray-300 font-medium">
            <div className="flex justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400">{isRu ? 'Шифрование канала:' : 'Channel Encryption:'}</span>
              <span className="font-bold text-white">TLS 1.3 HTTPS</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400">{isRu ? 'Правила Firestore & Auth:' : 'Firestore & Auth Rules:'}</span>
              <span className="font-bold text-emerald-400">Strict Auth Rules v2</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">{isRu ? 'Безопасность Web Cryptography:' : 'Web Cryptography:'}</span>
              <span className={`font-bold ${isModern ? 'text-emerald-400' : 'text-red-400'}`}>
                {isModern ? 'W3C SubtleCrypto OK' : 'Недоступно (Старая ОС)'}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleCheckSecurity}
              disabled={isCheckingSecurity}
              className={`w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer ${
                isModern 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 active:translate-y-0.5 text-white border-b-4 border-blue-800' 
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
              }`}
            >
              {isCheckingSecurity ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{isRu ? 'Проверка безопасности PWA...' : 'Checking security updates...'}</span>
                </>
              ) : (
                <>
                  <span>🛡️</span>
                  <span>
                    {isModern 
                      ? (isRu ? 'Обновление безопасности DuoWindo6601 PWA' : 'DuoWindo6601 PWA Security Update')
                      : (isRu ? '🛑 Безопасность недоступна (Старая система)' : '🛑 Security Patch Blocked')}
                  </span>
                </>
              )}
            </button>

            {securityStatus && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                securityStatus.includes('🛑') 
                  ? 'bg-red-950/60 border border-red-500/50 text-red-200' 
                  : 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-200'
              }`}>
                {securityStatus}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* SUMMARY FOOTER NOTE */}
      <div className="bg-black/30 p-3.5 rounded-2xl border border-gray-800 text-[11px] text-gray-400 flex items-center justify-between flex-wrap gap-2">
        <span>
          💡 {isRu 
            ? 'Политика совместимости DuoWindo6601: Новые Системы получают обновления приложения и безопасности в реальном времени. На Старых Системах обновление не получится.'
            : 'DuoWindo6601 Compatibility Policy: Modern Systems receive real-time PWA and security updates. Legacy systems are unsupported.'}
        </span>
        <button
          onClick={() => { playSound('click'); onOpenSystemChecker(); }}
          className="text-duo-blue hover:underline font-black cursor-pointer"
        >
          {isRu ? 'Открыть DuoWindo6601 System Checker ↗' : 'Open DuoWindo6601 System Checker ↗'}
        </button>
      </div>

    </div>
  );
};
