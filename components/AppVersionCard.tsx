import React, { useState, useEffect, useCallback } from 'react';
import { UserProgress } from '../types';
import { SystemCompatibilityResult } from '../services/systemCompatibilityService';
import {
  APP_NAME,
  APP_VERSION,
  APP_PWA_CORE_VERSION,
  APP_BUILD_CODE,
  APP_RELEASE_DATE,
  APP_CODENAME,
  APP_RELEASE_NOTES,
  AppRuntimeDiagnostics,
  collectAppDiagnostics,
  formatDiagnosticsReport
} from '../services/appVersionService';
import { CheckCircleIcon, ShieldIcon, SparklesIcon } from './Icons';

interface AppVersionCardProps {
  user: UserProgress;
  systemInfo: SystemCompatibilityResult;
  isLightMode: boolean;
  playSound: (sound: string) => void;
  setToast: (msg: string | null) => void;
  onOpenSystemChecker: () => void;
  onOpenBetaCenter?: () => void;
}

export const AppVersionCard: React.FC<AppVersionCardProps> = ({
  user,
  systemInfo,
  isLightMode,
  playSound,
  setToast,
  onOpenSystemChecker,
  onOpenBetaCenter
}) => {
  const isRu = user.language !== 'en';
  const [activeTab, setActiveTab] = useState<'overview' | 'changelog' | 'diagnostics'>('overview');
  const [diagnostics, setDiagnostics] = useState<AppRuntimeDiagnostics | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const runDiagnostics = useCallback(
    async (withFeedback: boolean) => {
      if (withFeedback) {
        playSound('click');
        setIsVerifying(true);
      }
      try {
        const result = await collectAppDiagnostics(user, systemInfo);
        setDiagnostics(result);
        if (withFeedback) {
          playSound('correct');
          setToast(
            isRu
              ? `✅ ${APP_NAME} v${APP_VERSION}: целостность данных и среда проверены!`
              : `✅ ${APP_NAME} v${APP_VERSION}: profile data & runtime verified!`
          );
        }
      } finally {
        if (withFeedback) {
          setIsVerifying(false);
        }
      }
    },
    [user, systemInfo, playSound, setToast, isRu]
  );

  useEffect(() => {
    void runDiagnostics(false);
  }, [runDiagnostics]);

  const handleCopyReport = async () => {
    playSound('click');
    const current = diagnostics || (await collectAppDiagnostics(user, systemInfo));
    setDiagnostics(current);
    const text = formatDiagnosticsReport(current, user);
    try {
      await navigator.clipboard.writeText(text);
      setToast(
        isRu
          ? '📋 Отчёт о версии DuoWindo6601 скопирован в буфер обмена!'
          : '📋 DuoWindo6601 version report copied to clipboard!'
      );
    } catch {
      setToast(
        isRu
          ? `ℹ️ Версия: ${APP_NAME} v${APP_VERSION} (${APP_BUILD_CODE})`
          : `ℹ️ Version: ${APP_NAME} v${APP_VERSION} (${APP_BUILD_CODE})`
      );
    }
  };

  const cardSurface = isLightMode
    ? 'bg-white border-2 border-indigo-200 text-slate-900'
    : 'bg-duo-card border-2 border-indigo-500/50 text-white';
  const subSurface = isLightMode
    ? 'bg-slate-50 border border-slate-200 text-slate-700'
    : 'bg-black/40 border border-gray-800 text-gray-300';
  const mutedText = isLightMode ? 'text-slate-600' : 'text-gray-400';

  return (
    <div className={`${cardSurface} rounded-3xl p-5 sm:p-6 mb-6 shadow-xl space-y-5`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-700/30 pb-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-lg border border-indigo-400/50 shrink-0">
            <SparklesIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider">
                {isRu ? `Версия Приложения ${APP_NAME}` : `${APP_NAME} App Version`}
              </h3>
              <span className="text-[11px] font-mono font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                v{APP_VERSION} • {APP_PWA_CORE_VERSION}
              </span>
            </div>
            <p className={`text-xs font-bold mt-0.5 ${mutedText}`}>
              {isRu
                ? `Сборка ${APP_BUILD_CODE} («${APP_CODENAME}») • Релиз ${APP_RELEASE_DATE} • Прогресс полностью совместим`
                : `Build ${APP_BUILD_CODE} ("${APP_CODENAME}") • Released ${APP_RELEASE_DATE} • Progress fully compatible`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void runDiagnostics(true)}
          disabled={isVerifying}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-black text-xs uppercase tracking-wider border-b-4 border-indigo-900 active:border-b-0 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer shrink-0"
        >
          <ShieldIcon className="w-4 h-4" />
          <span>
            {isVerifying
              ? (isRu ? 'Проверка...' : 'Checking...')
              : (isRu ? 'Проверить целостность' : 'Verify Integrity')}
          </span>
        </button>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { id: 'overview' as const, labelRu: 'Обзор версии', labelEn: 'Overview' },
          { id: 'changelog' as const, labelRu: 'Что нового', labelEn: 'Changelog' },
          { id: 'diagnostics' as const, labelRu: 'Диагностика', labelEn: 'Diagnostics' }
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                playSound('click');
                setActiveTab(tab.id);
              }}
              className={`py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer border ${
                active
                  ? 'bg-duo-blue text-white border-sky-400 shadow-md'
                  : isLightMode
                    ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    : 'bg-gray-800/80 text-gray-400 border-gray-700 hover:text-white hover:bg-gray-800'
              }`}
            >
              {isRu ? tab.labelRu : tab.labelEn}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className={`${subSurface} p-3 rounded-2xl`}>
              <span className={`block text-[10px] font-bold uppercase ${mutedText}`}>
                {isRu ? 'Версия ядра' : 'Core Version'}
              </span>
              <span className="font-mono font-black text-sm text-emerald-400">v{APP_VERSION}</span>
            </div>
            <div className={`${subSurface} p-3 rounded-2xl`}>
              <span className={`block text-[10px] font-bold uppercase ${mutedText}`}>
                {isRu ? 'Кодовое имя' : 'Codename'}
              </span>
              <span className="font-black text-sm">{APP_CODENAME}</span>
            </div>
            <div className={`${subSurface} p-3 rounded-2xl`}>
              <span className={`block text-[10px] font-bold uppercase ${mutedText}`}>
                {isRu ? 'Режим запуска' : 'Runtime Mode'}
              </span>
              <span className="font-black text-sm text-sky-400">
                {diagnostics?.displayMode === 'standalone' ? 'PWA App' : 'Web Browser'}
              </span>
            </div>
            <div className={`${subSurface} p-3 rounded-2xl`}>
              <span className={`block text-[10px] font-bold uppercase ${mutedText}`}>
                {isRu ? 'База прогресса' : 'Profile Store'}
              </span>
              <span className="font-black text-sm text-amber-400">
                {diagnostics?.progressKeyFound ? `${diagnostics.progressSizeKb} KB` : 'Active'}
              </span>
            </div>
          </div>

          <div className={`${subSurface} p-3.5 rounded-2xl space-y-2`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                <span>{isRu ? `Что улучшено в v${APP_VERSION}` : `What's improved in v${APP_VERSION}`}</span>
              </span>
              <span className={`text-[10px] font-mono font-bold ${mutedText}`}>{APP_RELEASE_DATE}</span>
            </div>
            <ul className="space-y-1.5 text-xs font-medium leading-relaxed">
              {(isRu ? APP_RELEASE_NOTES[0].highlightsRu : APP_RELEASE_NOTES[0].highlightsEn).map((line, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-black shrink-0">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tab 2: Changelog */}
      {activeTab === 'changelog' && (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {APP_RELEASE_NOTES.map((rel) => (
            <div key={rel.version} className={`${subSurface} p-3.5 rounded-2xl space-y-2`}>
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-700/40 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-indigo-400">v{rel.version}</span>
                  <span className="text-xs font-black">— {rel.codename}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    {rel.pwaVersion}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {isRu ? rel.badgeRu : rel.badgeEn}
                  </span>
                  <span className={`text-[10px] font-mono ${mutedText}`}>{rel.date}</span>
                </div>
              </div>
              <ul className="space-y-1 text-xs font-medium leading-relaxed">
                {(isRu ? rel.highlightsRu : rel.highlightsEn).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-sky-400 font-bold shrink-0">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Runtime Diagnostics */}
      {activeTab === 'diagnostics' && (
        <div className={`${subSurface} p-4 rounded-2xl space-y-2 text-xs font-medium`}>
          <div className="flex justify-between py-1 border-b border-gray-700/40">
            <span className={mutedText}>{isRu ? 'ID сборки:' : 'Build ID:'}</span>
            <span className="font-mono font-bold">{APP_BUILD_CODE} ({APP_PWA_CORE_VERSION})</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-700/40">
            <span className={mutedText}>{isRu ? 'Совместимость ОС и браузера:' : 'OS & Browser:'}</span>
            <span className="font-bold">
              {diagnostics?.osLabel || systemInfo.osName} • {diagnostics?.browserLabel || systemInfo.browserName}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-700/40">
            <span className={mutedText}>Service Worker / CacheStorage:</span>
            <span className={`font-bold ${diagnostics?.serviceWorkerSupported ? 'text-emerald-400' : 'text-amber-400'}`}>
              {diagnostics?.serviceWorkerSupported
                ? (diagnostics.serviceWorkerActive
                    ? (isRu ? `Активен (${diagnostics.cacheBucketCount} кэшей)` : `Active (${diagnostics.cacheBucketCount} caches)`)
                    : (isRu ? `Готов (${diagnostics.cacheBucketCount} кэшей)` : `Ready (${diagnostics.cacheBucketCount} caches)`))
                : (isRu ? 'Недоступен' : 'Unavailable')}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-700/40">
            <span className={mutedText}>{isRu ? 'Ключ прогресса DuoWindo6601:' : 'DuoWindo6601 Progress Key:'}</span>
            <span className="font-mono font-bold text-emerald-400">
              {diagnostics?.progressKeyFound
                ? `OK (${diagnostics.progressSizeKb} KB)`
                : (diagnostics?.localStorageHealthy ? 'LocalStorage OK' : 'Memory')}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className={mutedText}>{isRu ? 'Активный курс / Тариф:' : 'Course / Subscription:'}</span>
            <span className="font-bold uppercase">
              {diagnostics?.activeCourseId || 'en'} • {user.subscription || 'free'}
            </span>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyReport}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border ${
              isLightMode
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
            }`}
          >
            📋 {isRu ? 'Скопировать отчёт' : 'Copy Report'}
          </button>
          <button
            type="button"
            onClick={() => {
              playSound('click');
              onOpenSystemChecker();
            }}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border ${
              isLightMode
                ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200'
                : 'bg-sky-950/50 hover:bg-sky-900/60 text-sky-300 border-sky-500/40'
            }`}
          >
            🔍 System Checker
          </button>
          {onOpenBetaCenter && (
            <button
              type="button"
              onClick={() => {
                playSound('click');
                onOpenBetaCenter();
              }}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border ${
                isLightMode
                  ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                  : 'bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border-purple-500/40'
              }`}
            >
              🧪 {isRu ? 'Бета-Центр' : 'Beta Center'}
            </button>
          )}
        </div>

        <span className={`text-[11px] font-bold ${mutedText}`}>
          {isRu
            ? '🛡️ Все профили и прогресс duowindo6601 сохранены'
            : '🛡️ All duowindo6601 profiles & progress preserved'}
        </span>
      </div>
    </div>
  );
};
