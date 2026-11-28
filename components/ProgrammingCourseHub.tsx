import React, { useState } from 'react';
import {
  APK_BUILD_PRESETS,
  LIFECYCLE_STEPS_DETAIL,
  PROGRAMMING_MODULES,
  ProgrammingModule,
  ProgrammingModuleId,
} from '../services/programmingCurriculum';
import { downloadDebugApk, APK_TROUBLESHOOTING_STEPS, isAppleDevice } from '../services/apkDownloadService';
import { CheckCircleIcon } from './Icons';
import { usePWAInstall } from './usePWAInstall';
import { isAppOnlineNow, useOnlineStatus } from './OfflineIndicator';
import { isRuntimeOnline, notifyNetworkOffline, OFFLINE_INTERNET_REQUIRED_MESSAGE } from '../services/geminiService';

interface ProgrammingCourseHubProps {
  language?: string;
  difficultyLevel?: 'easy' | 'hard';
  onChangeDifficulty?: (level: 'easy' | 'hard') => void;
  onStartLesson: (topicOverride: string) => void;
  playSound: (sound: string) => void;
  setToast: (msg: string | null) => void;
}

export const ProgrammingCourseHub: React.FC<ProgrammingCourseHubProps> = ({
  language = 'ru',
  difficultyLevel = 'easy',
  onChangeDifficulty,
  onStartLesson,
  playSound,
  setToast,
}) => {
  const isRu = language !== 'en';
  const isOnline = useOnlineStatus();
  const isApple = isAppleDevice();
  const { install: installPWA } = usePWAInstall();
  const [activeModuleId, setActiveModuleId] = useState<ProgrammingModuleId>('lua');
  const [selectedLifecycleStep, setSelectedLifecycleStep] = useState<string>('01');
  const [selectedApkPresetId, setSelectedApkPresetId] = useState<string>('debug');
  const [apkBuildStage, setApkBuildStage] = useState<'idle' | 'building' | 'done'>('idle');
  const [copiedCode, setCopiedCode] = useState(false);

  // Android Studio locate notification & folder modal state
  const [showStudioNotification, setShowStudioNotification] = useState(false);
  const [showLocateModal, setShowLocateModal] = useState(false);
  const [showTroubleshootModal, setShowTroubleshootModal] = useState(false);
  const [showAppleSafariModal, setShowAppleSafariModal] = useState(false);
  const [notificationTime, setNotificationTime] = useState<string>('10:55');

  const requireOnline = (): boolean => {
    if (!isOnline || !isAppOnlineNow()) {
      playSound('wrong');
      notifyNetworkOffline();
      setToast(OFFLINE_INTERNET_REQUIRED_MESSAGE);
      return false;
    }
    return true;
  };

  const activeModule: ProgrammingModule =
    PROGRAMMING_MODULES.find((m) => m.id === activeModuleId) || PROGRAMMING_MODULES[0];

  const activeItems = isRu ? activeModule.itemsRu : activeModule.itemsEn;
  const activeApkPreset =
    APK_BUILD_PRESETS.find((p) => p.id === selectedApkPresetId) || APK_BUILD_PRESETS[0];
  const activeLifecycle =
    LIFECYCLE_STEPS_DETAIL.find((s) => s.step === selectedLifecycleStep) || LIFECYCLE_STEPS_DETAIL[0];

  const handleSelectModule = (id: ProgrammingModuleId) => {
    if (!requireOnline()) return;
    playSound('click');
    setActiveModuleId(id);
    setApkBuildStage('idle');
    setCopiedCode(false);
  };

  const handleCopySnippet = async () => {
    playSound('click');
    try {
      await navigator.clipboard.writeText(activeModule.codeSnippet);
      setCopiedCode(true);
      setToast(isRu ? 'Код скопирован в буфер обмена' : 'Code copied to clipboard');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setToast(isRu ? 'Выделите и скопируйте фрагмент вручную' : 'Select and copy snippet manually');
    }
  };

  const handleSimulateApkBuild = () => {
    playSound('click');
    setApkBuildStage('building');
    setTimeout(() => {
      setApkBuildStage('done');
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setNotificationTime(timeStr);
      setShowStudioNotification(true);
      try {
        playSound('success');
      } catch {
        // Ignore if audio is blocked
      }
      setToast(
        isRu
          ? `Сборка завершена: ${activeApkPreset.outputFile}`
          : `Build complete: ${activeApkPreset.outputFile}`
      );
    }, 650);
  };

  const handleDownloadApkDirect = (filename: string = 'app-debug.apk') => {
    if (!requireOnline()) return;
    try {
      playSound('select');
    } catch {
      // Ignore
    }
    const meta = downloadDebugApk(filename);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setNotificationTime(timeStr);
    setShowStudioNotification(true);
    setToast(
      isRu
        ? `📥 Скачивание ${meta.filename} (для быстрого теста) началось!`
        : `📥 Downloading ${meta.filename} (for quick test)!`
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 pb-16 space-y-6 select-none relative">
      {/* Header Banner */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-medium">
              <span>{isRu ? 'Программирование (Курс не является языком • Навык/Игра)' : 'Programming (Non-language course • Skill/Game)'}</span>
              <span aria-hidden="true">·</span>
              <span>{isRu ? 'Lua, Swift, Kotlin, Java и C++' : 'Lua, Swift, Kotlin, Java & C++'}</span>
              <span aria-hidden="true">·</span>
              <span>{isRu ? 'iOS, macOS, Android и APK' : 'iOS, macOS, Android & APK'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight text-balance">
              {isRu
                ? 'Разработка игр и мобильных приложений'
                : 'Game Scripting & Mobile App Development'}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {isRu
                ? 'Изучите стек Apple (Swift, Xcode, SwiftUI, UIKit, AppKit), инструменты Android (Kotlin, Java, C++ NDK, Jetpack Compose, Flutter, React Native), скрипты Lua, 5 этапов создания приложения и сборку APK.'
                : 'Master Lua game scripting, Apple ecosystem (Swift, Xcode, SwiftUI, UIKit, AppKit), Android stack (Kotlin, Java, C++ NDK, Jetpack Compose, Flutter, React Native), app lifecycle stages, and APK builds.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            {/* Difficulty Switcher */}
            {onChangeDifficulty && (
              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    if (!requireOnline()) return;
                    playSound('click');
                    onChangeDifficulty('easy');
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    difficultyLevel === 'easy'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isRu ? 'Лёгкий уровень' : 'Easy Level'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!requireOnline()) return;
                    playSound('click');
                    onChangeDifficulty('hard');
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    difficultyLevel === 'hard'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isRu ? 'Сложный уровень' : 'Hard Level'}
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadApkDirect('app-debug.apk')}
                className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <span>📥</span>
                <span>{isRu ? 'Скачать APK (app-debug.apk)' : 'Download APK'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!requireOnline()) return;
                  playSound('select');
                  onStartLesson(activeModule.topicPrompt);
                }}
                className="px-4 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isRu ? 'Тренировка' : 'Practice'}
              </button>
            </div>
          </div>
        </div>

        {/* Module Navigation Tabs */}
        <nav
          className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-800 pt-4 no-scrollbar"
          aria-label={isRu ? 'Модули курса программирования' : 'Programming modules'}
        >
          {PROGRAMMING_MODULES.map((mod) => {
            const isActive = mod.id === activeModuleId;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => handleSelectModule(mod.id)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-950/70 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span className="font-mono tabular-nums opacity-80">{mod.order}</span>
                <span>{isRu ? mod.tabLabelRu : mod.tabLabelEn}</span>
              </button>
            );
          })}
        </nav>
      </section>

      {/* Main Two-Zone Educational Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Zone (7 cols): Core Concepts & Architecture Stack */}
        <section className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <div className="text-xs text-sky-400 font-medium">
              {isRu ? `Модуль ${activeModule.order} из 05` : `Module ${activeModule.order} of 05`}
              <span aria-hidden="true"> · </span>
              <span>{isRu ? activeModule.subtitleRu : activeModule.subtitleEn}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white text-balance">
              {isRu ? activeModule.titleRu : activeModule.titleEn}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isRu ? activeModule.overviewRu : activeModule.overviewEn}
            </p>
          </div>

          {/* Stack Breakdown Rows */}
          <div className="divide-y divide-slate-800">
            {activeItems.map((item, idx) => (
              <div key={item.name} className="py-4 first:pt-1 last:pb-1 space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-base font-semibold text-white">
                    <span className="font-mono tabular-nums text-sky-400 mr-2">
                      0{idx + 1}.
                    </span>
                    {item.name}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">{item.role}</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{item.details}</p>
              </div>
            ))}
          </div>

          {/* Special Interactive Walkthrough for Lifecycle Module */}
          {activeModuleId === 'lifecycle' && (
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">
                  {isRu
                    ? 'Интерактивная схема: 5 этапов создания приложения'
                    : 'Interactive Flow: 5 App Creation Stages'}
                </h3>
                <span className="text-xs font-mono tabular-nums text-slate-400">
                  {selectedLifecycleStep} / 05
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {LIFECYCLE_STEPS_DETAIL.map((st) => {
                  const selected = st.step === selectedLifecycleStep;
                  return (
                    <button
                      key={st.step}
                      type="button"
                      onClick={() => {
                        playSound('click');
                        setSelectedLifecycleStep(st.step);
                      }}
                      className={`py-2.5 px-2 rounded-xl text-xs font-mono tabular-nums font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        selected
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {st.step}
                    </button>
                  );
                })}
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white">
                    {activeLifecycle.step}. {isRu ? activeLifecycle.titleRu : activeLifecycle.titleEn}
                  </span>
                  <span className="text-xs font-mono text-emerald-400">
                    {activeLifecycle.artifact}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isRu ? activeLifecycle.descRu : activeLifecycle.descEn}
                </p>
              </div>
            </div>
          )}

          {/* Special Interactive APK Build Simulator on Module 05 */}
          {activeModuleId === 'apk' && (
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {isRu ? 'Симулятор сборки Android APK' : 'Android APK Build Simulator'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isRu
                      ? 'Сборка APK и уведомление в правом нижнем углу со ссылкой locate для быстрого теста'
                      : 'Build APK and get locate notification in bottom right corner for quick testing'}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  Android Studio · Gradle · Andromo
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {APK_BUILD_PRESETS.map((preset) => {
                  const active = preset.id === selectedApkPresetId;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        playSound('click');
                        setSelectedApkPresetId(preset.id);
                        setApkBuildStage('idle');
                      }}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer truncate ${
                        active
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                      }`}
                    >
                      {isRu ? preset.labelRu : preset.labelEn}
                    </button>
                  );
                })}
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">{activeApkPreset.configNote}</p>
                  <p className="text-xs font-mono text-sky-300 break-all">
                    {activeApkPreset.menuPath}
                  </p>
                </div>

                <ol className="space-y-1.5 text-xs text-slate-300">
                  {activeApkPreset.steps.map((stepText, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-mono tabular-nums text-slate-500 shrink-0">
                        0{idx + 1}.
                      </span>
                      <span>{stepText}</span>
                    </li>
                  ))}
                </ol>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSimulateApkBuild}
                      disabled={apkBuildStage === 'building'}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold text-xs rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-md"
                    >
                      {apkBuildStage === 'building'
                        ? (isRu ? 'Сборка пакета...' : 'Building APK...')
                        : (isRu ? 'Запустить сборку APK' : 'Run APK Build')}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadApkDirect(activeApkPreset.id === 'release' ? 'app-release.apk' : 'app-debug.apk')}
                      className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 shadow-md"
                    >
                      <span>📥</span>
                      <span>{isRu ? 'Скачать APK' : 'Download APK'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playSound('click');
                        setShowLocateModal(true);
                        setShowStudioNotification(false);
                      }}
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
                    >
                      <span>🔍</span>
                      <span>locate</span>
                    </button>
                  </div>

                  {apkBuildStage === 'done' && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                      <CheckCircleIcon className="w-4 h-4 shrink-0" />
                      <span className="font-mono">{activeApkPreset.outputFile}</span>
                    </div>
                  )}
                </div>

                {apkBuildStage === 'done' && (
                  <div className="text-xs text-slate-300 leading-relaxed bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1.5">
                    <p>{activeApkPreset.actionResult}</p>
                    <p className="text-[11px] text-amber-300 font-mono">
                      👉 {isRu ? 'Проверьте уведомление в правом нижнем углу или нажмите ссылку locate выше.' : 'Check the bottom right notification or click locate.'}
                    </p>
                  </div>
                )}

                {/* Apple / iOS Notice Banner: Apple or iOS не для APK */}
                <div className="bg-slate-950 border border-sky-500/40 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="text-xl shrink-0">🍎</span>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white">
                          {isRu ? 'Apple or iOS не для APK!' : 'Apple / iOS is not for APK!'}
                        </span>
                        {isApple && (
                          <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/40 px-1.5 py-0.2 rounded font-semibold">
                            {isRu ? 'У вас Apple' : 'Apple detected'}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        {isRu
                          ? 'Формат .apk предназначен ТОЛЬКО для Android. На iPhone, iPad и Mac файлы APK не поддерживаются (будет ошибка «пакет недействителен»). Для Apple используйте Safari: Поделиться ⎋ → «На экран «Домой»» (PWA) или сборку .ipa в Xcode.'
                          : 'APK format is exclusively for Android. iPhone, iPad, and Mac do not support APK (shows "package invalid"). For Apple, use Safari: Share ⎋ → "Add to Home Screen" (PWA) or build .ipa via Xcode.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      setShowAppleSafariModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-bold text-[11px] whitespace-nowrap cursor-pointer transition-all self-start sm:self-auto shrink-0 shadow"
                  >
                    {isRu ? 'Инструкция для Apple →' : 'Apple Guide →'}
                  </button>
                </div>

                {/* Android Invalid/Damaged Package & Parse Error Banner */}
                <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-200">
                    <span className="text-base shrink-0">⚠️</span>
                    <div>
                      <span className="font-bold block">
                        {isRu
                          ? '«Пакет недействителен (поврежден)» или «Не удалось обработать пакет»?'
                          : '"Package invalid (damaged)" or "Parse error"?'}
                      </span>
                      <span className="text-[11px] text-amber-300/80">
                        {isRu
                          ? 'Конфликт подписи старой версии или попытка открыть APK на iPhone'
                          : 'Signature conflict from prior install or attempting to open APK on Apple'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      setShowTroubleshootModal(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-[11px] whitespace-nowrap cursor-pointer transition-all shrink-0"
                  >
                    {isRu ? 'Решение проблемы →' : 'Troubleshoot →'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right Zone (5 cols): Code Reference & Practice Deck */}
        <aside className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="min-w-0">
              <span className="text-xs text-slate-400 block">
                {isRu ? 'Пример кода и конфигурации' : 'Code & Config Sample'}
              </span>
              <h3 className="text-sm font-mono font-semibold text-white truncate">
                {activeModule.codeTitle}
              </h3>
            </div>
            <button
              type="button"
              onClick={handleCopySnippet}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedCode ? (isRu ? 'Скопировано' : 'Copied') : (isRu ? 'Копировать' : 'Copy')}
            </button>
          </div>

          <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
            <code>{activeModule.codeSnippet}</code>
          </pre>

          {/* Quick APK Download Action Card on the Right Deck */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {isRu ? 'Файл app-debug.apk' : 'File app-debug.apk'}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {isRu ? 'Для быстрого теста' : 'Quick Test'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {isRu
                ? 'Скачайте готовый APK-файл приложения DuoWindo6601 для установки на Android-устройство или в эмулятор.'
                : 'Download the ready DuoWindo6601 APK package to test on Android devices or emulators.'}
            </p>

            <button
              type="button"
              onClick={() => handleDownloadApkDirect('app-debug.apk')}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow"
            >
              <span>📥</span>
              <span>{isRu ? 'Скачать app-debug.apk' : 'Download app-debug.apk'}</span>
            </button>
          </div>

          {/* Summary Comparison Table */}
          <div className="space-y-2.5 pt-1">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isRu ? 'Ключевые инструменты стека' : 'Key Stack Reference'}
            </h4>
            <div className="bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800 text-xs">
              <div className="flex items-center justify-between px-3.5 py-2.5 gap-2">
                <span className="text-slate-400">Lua</span>
                <span className="text-slate-200 font-medium text-right">
                  {isRu ? 'Игровые скрипты, лёгкий код' : 'Game scripts, lightweight'}
                </span>
              </div>
              <div className="flex items-center justify-between px-3.5 py-2.5 gap-2">
                <span className="text-slate-400">Apple (iOS / macOS)</span>
                <span className="text-slate-200 font-medium text-right">
                  Swift · Xcode (Mac) · SwiftUI / UIKit / AppKit
                </span>
              </div>
              <div className="flex items-center justify-between px-3.5 py-2.5 gap-2">
                <span className="text-slate-400">Android Native</span>
                <span className="text-slate-200 font-medium text-right">
                  Kotlin · Java · C++ (NDK) · Compose / XML
                </span>
              </div>
              <div className="flex items-center justify-between px-3.5 py-2.5 gap-2">
                <span className="text-slate-400">{isRu ? 'Кроссплатформа' : 'Cross-Platform'}</span>
                <span className="text-slate-200 font-medium text-right">
                  Flutter (Dart) · React Native (JS)
                </span>
              </div>
              <div className="flex items-center justify-between px-3.5 py-2.5 gap-2">
                <span className="text-slate-400">{isRu ? 'Релиз и сборка' : 'Release & Build'}</span>
                <span className="text-slate-200 font-mono text-right">
                  .aab · .apk · .jks · ./gradlew
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                if (!requireOnline()) return;
                playSound('select');
                onStartLesson(activeModule.topicPrompt);
              }}
              className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer"
            >
              {isRu
                ? `Пройти тест: ${activeModule.tabLabelRu} (+20 XP)`
                : `Start Quiz: ${activeModule.tabLabelEn} (+20 XP)`}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!requireOnline()) return;
                playSound('select');
                onStartLesson(
                  'Lua, Swift, Xcode, SwiftUI, UIKit, AppKit, Kotlin, Java, C++ Android NDK, Android Studio, Gradle, Jetpack Compose, Flutter, React Native, .aab, build.gradle.kts, KeyStore .jks, app-debug.apk, gradlew, Andromo'
                );
              }}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              {isRu ? 'Общий экзамен по всему стеку' : 'Full Stack Comprehensive Quiz'}
            </button>
          </div>
        </aside>
      </div>

      {/* ========================================================================= */}
      {/* AUTHENTIC ANDROID STUDIO NOTIFICATION IN BOTTOM RIGHT CORNER (LOCATE LINK)*/}
      {/* ========================================================================= */}
      {showStudioNotification && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[90] bg-[#2b2d30] text-[#dfe1e5] border border-[#4e5157] rounded-xl shadow-2xl p-4 max-w-sm w-full animate-in slide-in-from-bottom-4 duration-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="text-emerald-400 text-base mt-0.5 leading-none shrink-0">✓</span>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-white">Build APK(s)</span>
                  <span className="text-[10px] text-slate-400 font-mono">{notificationTime}</span>
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  APK(s) generated successfully for module &apos;app&apos; with 1 build variant:
                </p>
                <p className="text-xs text-slate-300">
                  Build APK(s) complete.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      setShowLocateModal(true);
                      setShowStudioNotification(false);
                    }}
                    className="text-sky-400 hover:text-sky-300 font-mono font-bold underline cursor-pointer inline-flex items-center gap-0.5"
                  >
                    locate
                  </button>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowStudioNotification(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer p-1 shrink-0"
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LOCATE FOLDER MODAL: OPENS FOLDER WITH app-debug.apk FOR QUICK TEST       */}
      {/* ========================================================================= */}
      {showLocateModal && (
        <div
          className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#1e1f22] text-[#dfe1e5] border border-[#4e5157] rounded-2xl max-w-lg w-full shadow-2xl p-5 sm:p-6 space-y-4">
            {/* Header & Path bar */}
            <div className="flex items-start justify-between gap-3 border-b border-[#393b40] pb-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📁</span>
                  <h3 className="font-bold text-sm sm:text-base text-white truncate">
                    {isRu
                      ? 'Папка с файлом app-debug.apk (для быстрого теста)'
                      : 'Output folder: app-debug.apk (Quick Test)'}
                  </h3>
                </div>
                <p className="font-mono text-xs text-sky-400 bg-black/50 px-2 py-1 rounded truncate">
                  app/build/outputs/apk/debug/
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLocateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 text-lg cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* APK File Item in Folder */}
            <div className="bg-[#2b2d30] border border-[#393b40] rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0">
                    🤖
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-emerald-400">app-debug.apk</span>
                      <span className="text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded">
                        {isRu ? 'Для быстрого теста' : 'For quick test'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      8.6 KB (RSA-2048 Signed) · v1.0.4 (Build 6601) · package: com.duowindo.app · minSdkVersion 21 (Android 5.0 - 15)
                    </p>
                  </div>
                </div>
              </div>

              {isApple && (
                <div className="bg-sky-950/50 border border-sky-500/40 rounded-xl p-3 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-sky-200">
                    <span className="text-lg shrink-0">🍎</span>
                    <span>{isRu ? 'Apple or iOS не для APK! На iPhone/iPad используйте PWA.' : 'Apple iOS is not for APK! Use Safari PWA.'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAppleSafariModal(true)}
                    className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-bold text-[11px] rounded-lg cursor-pointer whitespace-nowrap transition-all"
                  >
                    {isRu ? 'Safari PWA →' : 'Safari PWA →'}
                  </button>
                </div>
              )}

              <p className="text-xs text-slate-300 leading-relaxed">
                {isRu
                  ? 'Уведомление в правом нижнем углу со ссылкой locate открывает папку с app-debug.apk для быстрого теста. Файл полностью готов к установке на смартфон через USB-отладку или в эмулятор Android Studio.'
                  : 'The bottom right notification locate link opens the folder containing app-debug.apk for fast testing. Ready to install on device or emulator.'}
              </p>

              {/* Quick Alert for Parse/Invalid Error */}
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 flex items-center justify-between gap-2 text-xs">
                <span className="text-amber-200">
                  ⚠️ {isRu ? '«Пакет недействителен (поврежден)» или «Не удалось обработать пакет»?' : 'Seeing "Package invalid" or "Parse error"?'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowTroubleshootModal(true)}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-[11px] rounded-lg cursor-pointer whitespace-nowrap transition-all"
                >
                  {isRu ? 'Инструкция →' : 'Troubleshoot →'}
                </button>
              </div>

              <div className="bg-black/60 p-2.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between gap-2">
                <span className="truncate">adb install -r -d app-debug.apk</span>
                <button
                  type="button"
                  onClick={async () => {
                    playSound('click');
                    try {
                      await navigator.clipboard.writeText('adb install -r -d app-debug.apk');
                      setToast(isRu ? 'Команда ADB скопирована' : 'ADB command copied');
                    } catch {
                      setToast('adb install -r -d app-debug.apk');
                    }
                  }}
                  className="text-sky-400 hover:text-sky-300 underline font-semibold shrink-0 cursor-pointer"
                >
                  {isRu ? 'Копировать' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#393b40]">
              <button
                type="button"
                onClick={() => handleDownloadApkDirect('app-debug.apk')}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow"
              >
                <span>📥</span>
                <span>{isRu ? 'Скачать app-debug.apk' : 'Download app-debug.apk'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowTroubleshootModal(true)}
                className="py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <span>🛠️</span>
                <span>{isRu ? 'Решение ошибки' : 'Fix Parse Error'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLocateModal(false)}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer transition-all"
              >
                {isRu ? 'Закрыть папку' : 'Close Folder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ANDROID PARSE ERROR TROUBLESHOOTING MODAL                                 */}
      {/* ========================================================================= */}
      {showTroubleshootModal && (
        <div
          className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#1e1f22] text-[#dfe1e5] border border-amber-500/50 rounded-2xl max-w-xl w-full shadow-2xl p-5 sm:p-6 space-y-4 my-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#393b40] pb-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛠️</span>
                  <h3 className="font-bold text-base sm:text-lg text-white">
                    {isRu
                      ? 'Решение: «Не удалось обработать пакет» на Android'
                      : 'Fix: "There was a problem parsing the package"'}
                  </h3>
                </div>
                <p className="text-xs text-amber-300/90 font-medium">
                  {isRu
                    ? 'Синтаксическая ошибка пакета (Parse Error). Пошаговые решения:'
                    : 'Android Parse Error troubleshooting guide:'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTroubleshootModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 text-lg cursor-pointer shrink-0"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* List of Steps */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {APK_TROUBLESHOOTING_STEPS.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-[#2b2d30] border border-[#393b40] rounded-xl p-3.5 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{step.icon}</span>
                    <h4 className="font-bold text-xs sm:text-sm text-white">
                      {isRu ? step.titleRu : step.titleEn}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isRu ? step.descRu : step.descEn}
                  </p>

                  {/* Contextual Action Button */}
                  {step.actionType === 'apple-guide' && (
                    <button
                      type="button"
                      onClick={() => {
                        playSound('click');
                        setShowAppleSafariModal(true);
                      }}
                      className="mt-1 py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow"
                    >
                      <span>🍏</span>
                      <span>{isRu ? step.actionLabelRu : step.actionLabelEn}</span>
                    </button>
                  )}

                  {step.actionType === 'direct-download' && (
                    <button
                      type="button"
                      onClick={() => handleDownloadApkDirect('app-debug.apk')}
                      className="mt-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow"
                    >
                      <span>📥</span>
                      <span>{isRu ? step.actionLabelRu : step.actionLabelEn}</span>
                    </button>
                  )}

                  {step.actionType === 'copy-adb' && (
                    <div className="mt-1 flex items-center justify-between gap-2 bg-black/60 p-2 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
                      <span className="truncate">adb install -r -d app-debug.apk</span>
                      <button
                        type="button"
                        onClick={async () => {
                          playSound('click');
                          try {
                            await navigator.clipboard.writeText('adb install -r -d app-debug.apk');
                            setToast(isRu ? 'Команда ADB скопирована' : 'ADB command copied');
                          } catch {
                            setToast('adb install -r -d app-debug.apk');
                          }
                        }}
                        className="text-sky-400 hover:text-sky-300 underline font-semibold shrink-0 cursor-pointer"
                      >
                        {isRu ? 'Копировать' : 'Copy'}
                      </button>
                    </div>
                  )}

                  {step.actionType === 'pwa-install' && (
                    <button
                      type="button"
                      onClick={async () => {
                        playSound('click');
                        try {
                          await installPWA();
                          setToast(isRu ? 'Запуск установки DuoWindo6601...' : 'Starting installation...');
                        } catch {
                          setToast(isRu ? 'Используйте меню браузера: Добавить на главный экран' : 'Use browser menu: Add to Home Screen');
                        }
                      }}
                      className="mt-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow"
                    >
                      <span>📱</span>
                      <span>{isRu ? step.actionLabelRu : step.actionLabelEn}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#393b40]">
              <button
                type="button"
                onClick={() => handleDownloadApkDirect('app-debug.apk')}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow"
              >
                <span>📥</span>
                <span>{isRu ? 'Скачать подписанный APK' : 'Download Signed APK'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  setShowAppleSafariModal(true);
                }}
                className="py-3 px-4 bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <span>🍎</span>
                <span>{isRu ? 'Инструкция Apple' : 'Apple Guide'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowTroubleshootModal(false)}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer transition-all"
              >
                {isRu ? 'Закрыть' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* APPLE / iOS MODAL: Safari PWA Guide & IPA vs APK Explanation             */}
      {/* ========================================================================= */}
      {showAppleSafariModal && (
        <div
          className="fixed inset-0 z-[140] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#1c1c1e] text-[#f2f2f7] border border-sky-500/40 rounded-3xl max-w-lg w-full shadow-2xl p-5 sm:p-6 space-y-4 my-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🍎</span>
                  <h3 className="font-bold text-base sm:text-lg text-white">
                    {isRu
                      ? 'Apple or iOS не для APK!'
                      : 'Apple & iOS do not support APK!'}
                  </h3>
                </div>
                <p className="text-xs text-sky-400 font-medium">
                  {isRu
                    ? 'iPhone, iPad и Mac используют формат .ipa и PWA'
                    : 'iPhone, iPad & Mac use .ipa format and PWA'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAppleSafariModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 text-lg cursor-pointer shrink-0"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Why Apple is not for APK */}
            <div className="bg-sky-950/40 border border-sky-500/30 rounded-2xl p-4 space-y-2 text-xs">
              <span className="font-bold text-sky-300 block text-sm">
                {isRu ? '❓ Почему файлы APK не работают на Apple?' : '❓ Why do APK files fail on Apple?'}
              </span>
              <p className="text-slate-300 leading-relaxed">
                {isRu
                  ? 'Файлы APK (.apk) разработаны Google исключительно для операционной системы Android (Dalvik/ART). Устройства Apple (iOS, iPadOS, macOS) имеют совершенно другую архитектуру и блокируют открытие файлов APK с системной ошибкой «пакет недействителен или поврежден».'
                  : 'APK files are developed by Google strictly for Android OS. Apple devices block APK installation because iOS uses .ipa packages and the Apple Mach-O runtime.'}
              </p>
            </div>

            {/* 3-step Safari iOS installation guide */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isRu ? 'Официальная установка DuoWindo6601 на iPhone и iPad (PWA):' : 'Official DuoWindo6601 installation on iPhone & iPad (PWA):'}
              </h4>

              <div className="bg-[#2c2c2e] rounded-xl p-3 flex items-start gap-3 text-xs">
                <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                <div>
                  <span className="font-bold text-white block">{isRu ? 'Откройте в Safari' : 'Open in Safari'}</span>
                  <span className="text-slate-300">{isRu ? 'Зайдите на сайт DuoWindo6601 через браузер Safari на iPhone или iPad.' : 'Visit DuoWindo6601 in Safari on your iOS device.'}</span>
                </div>
              </div>

              <div className="bg-[#2c2c2e] rounded-xl p-3 flex items-start gap-3 text-xs">
                <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                <div>
                  <span className="font-bold text-white block">{isRu ? 'Нажмите кнопку «Поделиться» (Share)' : 'Tap Share button'}</span>
                  <span className="text-slate-300">{isRu ? 'В нижней панели Safari нажмите значок квадрата со стрелкой вверх (⎋).' : 'Tap the square icon with an upward arrow (⎋) at the bottom of Safari.'}</span>
                </div>
              </div>

              <div className="bg-[#2c2c2e] rounded-xl p-3 flex items-start gap-3 text-xs">
                <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                <div>
                  <span className="font-bold text-white block">{isRu ? '«На экран «Домой»» (Add to Home Screen)' : '"Add to Home Screen"'}</span>
                  <span className="text-slate-300">{isRu ? 'Прокрутите список действий вниз, выберите «На экран «Домой»» и нажмите «Добавить».' : 'Scroll down, tap "Add to Home Screen", then tap "Add".'}</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-200">
              ✨ {isRu
                ? 'Готово! DuoWindo6601 появится на рабочем столе iPhone/iPad как нативное приложение с полноэкранным режимом, кешем уроков и без синтаксических ошибок пакета.'
                : 'Done! DuoWindo6601 installs onto your iOS home screen as a standalone app.'}
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAppleSafariModal(false)}
                className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all text-center shadow"
              >
                {isRu ? 'Понятно, закрыть' : 'Got it, close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
