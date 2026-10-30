import React from 'react';
import { SystemCompatibilityResult, SimulationMode } from '../services/systemCompatibilityService';

interface SystemInfoModalProps {
  systemInfo: SystemCompatibilityResult;
  simMode: SimulationMode;
  onSetSimMode: (mode: SimulationMode) => void;
  onClose: () => void;
  lang?: string;
}

export const SystemInfoModal: React.FC<SystemInfoModalProps> = ({
  systemInfo,
  simMode,
  onSetSimMode,
  onClose,
  lang = 'ru'
}) => {
  const isXpOrVista = systemInfo.warningType === 'windows_xp_vista';
  const isOldAndroid = systemInfo.warningType === 'old_android';
  const isOldIOS = systemInfo.warningType === 'old_ios';
  const isOldBrowser = systemInfo.warningType === 'old_browser';
  const isOldMacLinux = systemInfo.warningType === 'old_mac_linux';
  const isModern = systemInfo.pwaUpdateSupported && systemInfo.warningType === 'none';

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-duo-card border-2 border-gray-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative text-white space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-md ${
              isXpOrVista || isOldAndroid || isOldIOS
                ? 'bg-red-600 text-white' 
                : isOldBrowser || isOldMacLinux 
                  ? 'bg-amber-500 text-black' 
                  : 'bg-emerald-600 text-white'
            }`}>
              {isXpOrVista ? '🛑' : isOldIOS ? '📱' : isOldAndroid ? '🤖' : isOldBrowser ? '🌐' : '💻'}
            </div>
            <div>
              <h3 className="font-black text-xl tracking-wide uppercase">
                {lang === 'ru' ? 'Информация о системе' : 'System Compatibility Info'}
              </h3>
              <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                DuoWindo6601 System Checker
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center justify-center font-bold text-lg transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Status Card */}
        <div className={`p-4 rounded-2xl border-2 flex flex-col space-y-3 ${
          !isModern 
            ? 'bg-red-950/50 border-red-500/60 text-red-100' 
            : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-black uppercase tracking-wider opacity-80">
              {lang === 'ru' ? 'Текущий статус' : 'Current Status'}
            </span>
            <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
              isXpOrVista 
                ? 'bg-red-600 text-white' 
                : isOldIOS
                  ? 'bg-red-600 text-white'
                  : isOldAndroid
                    ? 'bg-red-600 text-white'
                    : isOldBrowser 
                      ? 'bg-amber-500 text-black' 
                      : 'bg-emerald-500 text-black'
            }`}>
              {isXpOrVista 
                ? (lang === 'ru' ? 'Снято с поддержки (XP / Vista)' : 'Support Terminated')
                : isOldIOS
                  ? (lang === 'ru' ? 'Старый iOS / iPad (< 14.0) — Не получится' : 'Legacy iOS / iPad (<14.0)')
                  : isOldAndroid
                    ? (lang === 'ru' ? 'Старый Android (4.4 - 7.1) — Не получится' : 'Legacy Android (< 8.0)')
                    : isOldBrowser
                      ? (lang === 'ru' ? 'Устаревший браузер' : 'Outdated Browser')
                      : isOldMacLinux
                        ? (lang === 'ru' ? 'Старый Mac / Linux' : 'Legacy Mac / Linux')
                        : (lang === 'ru' ? 'Новый Систем: Поддерживается' : 'Modern System: Fully Supported')}
            </span>
          </div>

          <p className="text-sm font-bold leading-relaxed">
            {systemInfo.detailsReason}
          </p>
        </div>

        {/* PWA UPDATE & SECURITY COMPATIBILITY CARD */}
        <div className={`p-4 rounded-2xl border-2 space-y-2 text-xs ${
          isModern 
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
            : 'bg-red-950/40 border-red-500/50 text-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <h4 className="font-black uppercase tracking-wider flex items-center gap-1.5 text-xs text-white">
              <span>{isModern ? '📲' : '🛑'}</span>
              <span>
                {lang === 'ru' 
                  ? 'Обновление PWA и Безопасность DuoWindo6601' 
                  : 'DuoWindo6601 PWA & Security Update Status'}
              </span>
            </h4>
            <span className={`font-black px-2 py-0.5 rounded text-[10px] uppercase ${
              isModern ? 'bg-emerald-500 text-black' : 'bg-red-600 text-white'
            }`}>
              {isModern 
                ? (lang === 'ru' ? '✅ Новый Систем: OK' : '✅ Modern System: OK') 
                : (lang === 'ru' ? '🛑 Старые Системы: Не получится' : '🛑 Old Systems: Unsupported')}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed font-semibold">
            {systemInfo.pwaStatusMessage}
          </p>
        </div>

        {/* System Specs Table */}
        <div className="bg-gray-800/60 border border-gray-700/80 rounded-2xl p-4 space-y-3 text-xs">
          <h4 className="font-black uppercase tracking-wider text-duo-blue text-xs">
            {lang === 'ru' ? 'Параметры окружения (DuoWindo6601 System Checker)' : 'Environment Details'}
          </h4>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-black/40 p-3 rounded-xl border border-gray-700">
              <span className="text-gray-400 block font-bold text-[10px] uppercase">
                {lang === 'ru' ? 'Операционная система:' : 'Operating System:'}
              </span>
              <span className={`font-black text-sm block truncate mt-0.5 ${
                isXpOrVista || isOldAndroid || isOldIOS ? 'text-red-400' : 'text-white'
              }`}>
                {systemInfo.osName} {systemInfo.osVersion && `(${systemInfo.osVersion})`}
              </span>
            </div>

            <div className="bg-black/40 p-3 rounded-xl border border-gray-700">
              <span className="text-gray-400 block font-bold text-[10px] uppercase">
                {lang === 'ru' ? 'Веб-браузер:' : 'Web Browser:'}
              </span>
              <span className={`font-black text-sm block truncate mt-0.5 ${isOldBrowser ? 'text-amber-400' : 'text-white'}`}>
                {systemInfo.browserName} {systemInfo.browserVersion > 0 && `v${systemInfo.browserVersion}`}
              </span>
            </div>
          </div>
        </div>

        {/* OS & Browser Support Matrix (Старые Системы и Новый Системы + iOS / iPad) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-xs uppercase tracking-wider text-gray-300">
              {lang === 'ru' 
                ? 'Матрица совместимости: Старые Системы и Новый Системы' 
                : 'Compatibility Matrix: Old vs Modern Systems'}
            </h4>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full font-bold uppercase">
              {lang === 'ru' ? 'Включая iOS / iPad' : 'Includes iOS / iPad'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Windows */}
            <div className="bg-gray-800/80 border border-gray-700 p-3 rounded-xl space-y-1">
              <span className="font-black text-gray-200 block">🪟 Windows OS</span>
              <p className="text-[11px] text-gray-400">
                <span className="text-red-400 font-bold">🛑 Старые (XP/Vista/2003):</span> Не получится<br/>
                <span className="text-emerald-400 font-bold">✅ Новый (Win 7/8/10/11):</span> Поддерживается
              </p>
            </div>

            {/* Apple iOS & iPad */}
            <div className="bg-gray-800/80 border border-gray-700 p-3 rounded-xl space-y-1">
              <span className="font-black text-sky-300 block">🍏📱 iOS & iPad (iPhone / iPad)</span>
              <p className="text-[11px] text-gray-400">
                <span className="text-red-400 font-bold">🛑 Старые (iOS/iPad &lt; 14):</span> Не получится<br/>
                <span className="text-emerald-400 font-bold">✅ Новый (iOS 15 - 18+):</span> Поддерживается
              </p>
            </div>

            {/* Android */}
            <div className="bg-gray-800/80 border border-gray-700 p-3 rounded-xl space-y-1">
              <span className="font-black text-gray-200 block">🤖 Android OS</span>
              <p className="text-[11px] text-gray-400">
                <span className="text-red-400 font-bold">🛑 Старые (4.4 - 7.1):</span> Не получится<br/>
                <span className="text-emerald-400 font-bold">✅ Новый (8.0 - 15.0+):</span> Поддерживается
              </p>
            </div>

            {/* macOS & Linux */}
            <div className="bg-gray-800/80 border border-gray-700 p-3 rounded-xl space-y-1">
              <span className="font-black text-gray-200 block">🍏 macOS & 🐧 Linux</span>
              <p className="text-[11px] text-gray-400">
                <span className="text-amber-400 font-bold">⚠️ Старые (OS X 10.9-10.12):</span> Ограничено<br/>
                <span className="text-emerald-400 font-bold">✅ Новый (macOS 11+ & Linux):</span> Поддерживается
              </p>
            </div>

            {/* Browsers */}
            <div className="bg-gray-800/80 border border-gray-700 p-3 rounded-xl space-y-1 sm:col-span-2">
              <span className="font-black text-gray-200 block">🌐 Веб-Браузеры (PWA & Безопасность)</span>
              <p className="text-[11px] text-gray-400">
                <span className="text-red-400 font-bold">🛑 Старые (IE11 / Mypal 78 XP / Safari &lt;14):</span> PWA обновления не получится<br/>
                <span className="text-emerald-400 font-bold">✅ Новый (Chrome / Edge / Safari 16+ / Firefox 100+):</span> Полная поддержка
              </p>
            </div>
          </div>
        </div>

        {/* Speech API & Browser Architecture Notice */}
        <div className="bg-gradient-to-r from-blue-950/60 to-purple-950/60 border border-blue-500/30 p-4 rounded-2xl space-y-2 text-xs">
          <h4 className="font-black uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
            <span>🗣️</span>
            <span>{lang === 'ru' ? 'Архитектура речевых движков и браузеров' : 'Speech Engine & Browser Architecture'}</span>
          </h4>
          <p className="text-gray-300 text-[11px] leading-relaxed">
            {lang === 'ru'
              ? 'Прекращена поддержка устаревшего Microsoft Speech API 4.0, а также браузера Mypal 78.0.3 XP, OneCore API и Windows XP / Windows Server 2003. Осуществлен переход на Microsoft Speech API (SAPI) 5.3 в сочетании с современными Windows AI APIs и Web Speech API на мобильных устройствах iOS, iPad и Android.'
              : 'Support ended for legacy Microsoft Speech API 4.0, Mypal 78.0.3 XP browser, OneCore API, and Windows XP / Windows Server 2003. Upgraded to Microsoft Speech API (SAPI) 5.3 alongside modern on-device Windows AI speech recognition APIs and Web Speech API on iOS, iPad and Android.'}
          </p>
        </div>

        {/* Simulation / Testing Controls */}
        <div className="bg-gray-900/90 border-2 border-duo-blue/40 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-xs uppercase tracking-wider text-duo-blue flex items-center gap-1.5">
              <span>🧪</span>
              <span>{lang === 'ru' ? 'Симулятор DuoWindo6601 System Checker' : 'Compatibility Simulation Tester'}</span>
            </h4>
            <span className="text-[10px] text-gray-400 font-bold">
              {simMode === 'real' ? (lang === 'ru' ? 'Реальное устройство' : 'Real device') : `Режим: ${simMode}`}
            </span>
          </div>

          <p className="text-xs text-gray-300 font-medium">
            {lang === 'ru'
              ? 'Проверьте реакцию DuoWindo6601 на Старые Системы (не получится) и Новый Систем (включая iOS / iPad):'
              : 'Test DuoWindo6601 reaction on Old Systems (unsupported) and Modern Systems (including iOS / iPad):'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold pt-1">
            {/* Windows XP/Vista (Старая система) */}
            <button
              onClick={() => onSetSimMode('xp')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 cursor-pointer ${
                simMode === 'xp' 
                  ? 'bg-red-600 text-white border-red-400 shadow-md ring-2 ring-red-400' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
              }`}
            >
              <span>🛑</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-black">Windows XP / Vista</span>
                <span className="text-[10px] opacity-75 block">{lang === 'ru' ? '🛑 Старая (Не получится)' : '🛑 Old OS'}</span>
              </div>
            </button>

            {/* Windows 7/8/10/11 (Новая система) */}
            <button
              onClick={() => onSetSimMode('win10_modern')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 cursor-pointer ${
                simMode === 'win10_modern' 
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
              }`}
            >
              <span>✅</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-black">Windows 7/8/10/11</span>
                <span className="text-[10px] opacity-75 block">{lang === 'ru' ? '✅ Новый Систем' : '✅ Modern Win'}</span>
              </div>
            </button>

            {/* Apple iOS or iPad Old (< 14) */}
            <button
              onClick={() => onSetSimMode('ios_old')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 cursor-pointer ${
                simMode === 'ios_old' 
                  ? 'bg-red-600 text-white border-red-400 shadow-md ring-2 ring-red-400' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
              }`}
            >
              <span>📱</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-black">{lang === 'ru' ? 'Старый iOS / iPad (<14)' : 'Old iOS / iPad (<14)'}</span>
                <span className="text-[10px] opacity-75 block">{lang === 'ru' ? '🛑 Старая (Не получится)' : '🛑 Legacy iOS / iPad'}</span>
              </div>
            </button>

            {/* Apple iOS or iPad New (15-18+) */}
            <button
              onClick={() => onSetSimMode('ios_new')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 cursor-pointer ${
                simMode === 'ios_new' 
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
              }`}
            >
              <span>🍏</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-black">{lang === 'ru' ? 'Новый iOS / iPad (15-18+)' : 'New iOS / iPad (15-18+)'}</span>
                <span className="text-[10px] opacity-75 block">{lang === 'ru' ? '✅ Новый Систем' : '✅ Modern iOS/iPad'}</span>
              </div>
            </button>

            {/* Android Old (Старая система) */}
            <button
              onClick={() => onSetSimMode('android_old')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 cursor-pointer ${
                simMode === 'android_old' 
                  ? 'bg-red-600 text-white border-red-400 shadow-md ring-2 ring-red-400' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
              }`}
            >
              <span>🤖</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-black">{lang === 'ru' ? 'Старый Android (4-7)' : 'Old Android (4-7)'}</span>
                <span className="text-[10px] opacity-75 block">{lang === 'ru' ? '🛑 Старая (Не получится)' : '🛑 Old Android'}</span>
              </div>
            </button>

            {/* Android New (Новая система) */}
            <button
              onClick={() => onSetSimMode('android_new')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 cursor-pointer ${
                simMode === 'android_new' 
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
              }`}
            >
              <span>📱</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-black">{lang === 'ru' ? 'Новый Android (8-15)' : 'New Android (8-15)'}</span>
                <span className="text-[10px] opacity-75 block">{lang === 'ru' ? '✅ Новый Систем' : '✅ Modern Android'}</span>
              </div>
            </button>

            {/* MacOS/Linux Old */}
            <button
              onClick={() => onSetSimMode('mac_linux_old')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 cursor-pointer ${
                simMode === 'mac_linux_old' 
                  ? 'bg-amber-600 text-white border-amber-400 shadow-md ring-2 ring-amber-400' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
              }`}
            >
              <span>💻</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-black">{lang === 'ru' ? 'Старый MacOS/Linux' : 'Old MacOS/Linux'}</span>
                <span className="text-[10px] opacity-75 block">{lang === 'ru' ? '⚠️ Старая система' : '⚠️ Old MacOS/Linux'}</span>
              </div>
            </button>

            {/* MacOS/Linux New */}
            <button
              onClick={() => onSetSimMode('mac_linux_new')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 cursor-pointer ${
                simMode === 'mac_linux_new' 
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
              }`}
            >
              <span>🍏</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-black">{lang === 'ru' ? 'Новый MacOS/Linux' : 'New MacOS/Linux'}</span>
                <span className="text-[10px] opacity-75 block">{lang === 'ru' ? '✅ Новый Систем' : '✅ Modern Mac/Linux'}</span>
              </div>
            </button>

            {/* Old Browser */}
            <button
              onClick={() => onSetSimMode('old_browser')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 cursor-pointer ${
                simMode === 'old_browser' 
                  ? 'bg-amber-600 text-white border-amber-400 shadow-md ring-2 ring-amber-400' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
              }`}
            >
              <span>🌐</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-black">{lang === 'ru' ? 'Старый Браузер (IE/Legacy)' : 'Old Browser (IE/Legacy)'}</span>
                <span className="text-[10px] opacity-75 block">{lang === 'ru' ? '🛑 Старая (Не получится)' : '🛑 Browser Check'}</span>
              </div>
            </button>

            {/* Real Device */}
            <button
              onClick={() => onSetSimMode('real')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 cursor-pointer ${
                simMode === 'real' 
                  ? 'bg-duo-blue text-white border-blue-400 shadow-md ring-2 ring-blue-400' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
              }`}
            >
              <span>🔄</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-black">{lang === 'ru' ? 'Реальное Устройство' : 'Real Device'}</span>
                <span className="text-[10px] opacity-75 block">{lang === 'ru' ? 'Автодетекция' : 'Auto Detect'}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Close button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-duo-blue hover:bg-duo-blue/90 text-white font-black text-sm uppercase tracking-wider shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            {lang === 'ru' ? 'Закрыть' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
