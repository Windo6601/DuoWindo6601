import React, { useState } from 'react';
import {
  APK_BUILD_PRESETS,
  LIFECYCLE_STEPS_DETAIL,
  PROGRAMMING_MODULES,
  ProgrammingModule,
  ProgrammingModuleId,
} from '../services/programmingCurriculum';
import { CheckCircleIcon } from './Icons';

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
  const [activeModuleId, setActiveModuleId] = useState<ProgrammingModuleId>('lua');
  const [selectedLifecycleStep, setSelectedLifecycleStep] = useState<string>('01');
  const [selectedApkPresetId, setSelectedApkPresetId] = useState<string>('debug');
  const [apkBuildStage, setApkBuildStage] = useState<'idle' | 'building' | 'done'>('idle');
  const [copiedCode, setCopiedCode] = useState(false);

  const activeModule: ProgrammingModule =
    PROGRAMMING_MODULES.find((m) => m.id === activeModuleId) || PROGRAMMING_MODULES[0];

  const activeItems = isRu ? activeModule.itemsRu : activeModule.itemsEn;
  const activeApkPreset =
    APK_BUILD_PRESETS.find((p) => p.id === selectedApkPresetId) || APK_BUILD_PRESETS[0];
  const activeLifecycle =
    LIFECYCLE_STEPS_DETAIL.find((s) => s.step === selectedLifecycleStep) || LIFECYCLE_STEPS_DETAIL[0];

  const handleSelectModule = (id: ProgrammingModuleId) => {
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

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 pb-16 space-y-6 select-none">
      {/* Header Banner */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-medium">
              <span>{isRu ? 'Программирование' : 'Programming'}</span>
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

            <button
              type="button"
              onClick={() => {
                playSound('select');
                onStartLesson(activeModule.topicPrompt);
              }}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isRu ? 'Начать тренировку по модулю' : 'Start Module Practice'}
            </button>
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
                <h3 className="text-sm font-semibold text-white">
                  {isRu ? 'Симулятор сборки Android APK' : 'Android APK Build Simulator'}
                </h3>
                <span className="text-xs text-slate-400">
                  {isRu ? 'Android Studio · Gradle · Andromo' : 'Android Studio · Gradle · Andromo'}
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
                  <button
                    type="button"
                    onClick={handleSimulateApkBuild}
                    disabled={apkBuildStage === 'building'}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold text-xs rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {apkBuildStage === 'building'
                      ? (isRu ? 'Сборка пакета...' : 'Building APK...')
                      : (isRu ? 'Запустить сборку APK' : 'Run APK Build')}
                  </button>

                  {apkBuildStage === 'done' && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                      <CheckCircleIcon className="w-4 h-4 shrink-0" />
                      <span className="font-mono">{activeApkPreset.outputFile}</span>
                    </div>
                  )}
                </div>

                {apkBuildStage === 'done' && (
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 border border-slate-800 rounded-lg p-3">
                    {activeApkPreset.actionResult}
                  </p>
                )}
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
    </div>
  );
};
