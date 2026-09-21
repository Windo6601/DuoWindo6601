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
  const isOldBrowser = systemInfo.warningType === 'old_browser';
  const isModern = systemInfo.warningType === 'none';

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-duo-card border-2 border-gray-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative text-white space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-md ${
              isXpOrVista ? 'bg-red-600 text-white' : isOldBrowser ? 'bg-amber-500 text-black' : 'bg-duo-green text-white'
            }`}>
              {isXpOrVista ? '🛑' : isOldBrowser ? '🌐' : '💻'}
            </div>
            <div>
              <h3 className="font-black text-xl tracking-wide uppercase">
                {lang === 'ru' ? 'Информация о системе' : 'System Compatibility Info'}
              </h3>
              <p className="text-xs text-gray-400 font-bold">DuoWindo6601 System Checker</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center justify-center font-bold text-lg transition-all"
          >
            ✕
          </button>
        </div>

        {/* Status Card */}
        <div className={`p-4 rounded-2xl border-2 flex flex-col space-y-3 ${
          isXpOrVista 
            ? 'bg-red-950/40 border-red-500/50 text-red-100' 
            : isOldBrowser 
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-100' 
              : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider opacity-80">
              {lang === 'ru' ? 'Текущий статус' : 'Current Status'}
            </span>
            <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
              isXpOrVista 
                ? 'bg-red-600 text-white' 
                : isOldBrowser 
                  ? 'bg-amber-500 text-black' 
                  : 'bg-emerald-500 text-black'
            }`}>
              {isXpOrVista 
                ? (lang === 'ru' ? 'Снято с поддержки (XP / Vista)' : 'Support Terminated')
                : isOldBrowser
                  ? (lang === 'ru' ? 'Устаревший браузер' : 'Outdated Browser')
                  : (lang === 'ru' ? 'Поддерживается (Без предупреждений)' : 'Fully Supported')}
            </span>
          </div>

          <p className="text-sm font-bold leading-relaxed">
            {systemInfo.detailsReason}
          </p>
        </div>

        {/* System Specs Table */}
        <div className="bg-gray-800/60 border border-gray-700/80 rounded-2xl p-4 space-y-3 text-xs">
          <h4 className="font-black uppercase tracking-wider text-duo-blue text-xs">
            {lang === 'ru' ? 'Параметры окружения' : 'Environment Details'}
          </h4>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-black/40 p-3 rounded-xl border border-gray-700">
              <span className="text-gray-400 block font-bold text-[10px] uppercase">
                {lang === 'ru' ? 'Операционная система:' : 'Operating System:'}
              </span>
              <span className={`font-black text-sm block truncate mt-0.5 ${isXpOrVista ? 'text-red-400' : 'text-white'}`}>
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

        {/* OS & Browser Support Matrix */}
        <div className="space-y-3">
          <h4 className="font-black text-xs uppercase tracking-wider text-gray-300">
            {lang === 'ru' ? 'Матрица совместимости ОС и Браузеров' : 'OS & Browser Compatibility Policy'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Windows */}
            <div className="bg-gray-800/80 border border-gray-700 p-3 rounded-xl space-y-1">
              <span className="font-black text-gray-200 block">🪟 Windows OS</span>
              <p className="text-[11px] text-gray-400">
                <span className="text-red-400 font-bold">🛑 XP / Vista:</span> Не поддерживаются<br/>
                <span className="text-emerald-400 font-bold">✅ Win 7 / 8 / 8.1 / 10 / 11:</span> Поддерживаются
              </p>
            </div>

            {/* Android */}
            <div className="bg-gray-800/80 border border-gray-700 p-3 rounded-xl space-y-1">
              <span className="font-black text-gray-200 block">🤖 Android OS</span>
              <p className="text-[11px] text-gray-400">
                <span className="text-red-400 font-bold">🛑 Android 4.4 - 7.1:</span> Прекращено<br/>
                <span className="text-emerald-400 font-bold">✅ Android 8.0 - 15.0+:</span> Поддерживается
              </p>
            </div>

            {/* macOS & Linux */}
            <div className="bg-gray-800/80 border border-gray-700 p-3 rounded-xl space-y-1">
              <span className="font-black text-gray-200 block">🍏 macOS & 🐧 Linux</span>
              <p className="text-[11px] text-gray-400">
                <span className="text-amber-400 font-bold">⚠️ OS X 10.9-10.12:</span> Ограничено<br/>
                <span className="text-emerald-400 font-bold">✅ macOS 11+ & Linux:</span> Поддерживается
              </p>
            </div>

            {/* Browsers */}
            <div className="bg-gray-800/80 border border-gray-700 p-3 rounded-xl space-y-1">
              <span className="font-black text-gray-200 block">🌐 Веб-Браузеры</span>
              <p className="text-[11px] text-gray-400">
                <span className="text-amber-400 font-bold">⚠️ IE11 / Safari &lt;13:</span> Предупреждение<br/>
                <span className="text-emerald-400 font-bold">✅ Chrome/Firefox/Edge 100+:</span> OK
              </p>
            </div>
          </div>
        </div>

        {/* Simulation / Testing Controls */}
        <div className="bg-gray-900/90 border-2 border-duo-blue/40 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-xs uppercase tracking-wider text-duo-blue flex items-center gap-1.5">
              <span>🧪</span>
              <span>{lang === 'ru' ? 'Симулятор Проверки Совместимости' : 'Compatibility Simulation Tester'}</span>
            </h4>
            <span className="text-[10px] text-gray-400 font-bold">
              {simMode === 'real' ? (lang === 'ru' ? 'Реальное устройство' : 'Real device') : `Режим: ${simMode}`}
            </span>
          </div>

          <p className="text-xs text-gray-300 font-medium">
            {lang === 'ru'
              ? 'Выберите вариант платформы для мгновенной проверки реакции приложения:'
              : 'Select a platform option below to instantly test app compatibility logic:'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold pt-1">
            {/* Windows XP/Vista */}
            <button
              onClick={() => onSetSimMode('xp')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 ${
                simMode === 'xp' 
                  ? 'bg-red-600 text-white border-red-400 shadow-md ring-2 ring-red-400' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
              }`}
            >
              <span>🛑</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-black">Windows XP / Vista</span>
                <span className="text-[10px] opacity-75 block">{lang === 'ru' ? '🛑 Старая ОС (Снято)' : '🛑 Outdated OS'}</span>
              </div>
            </button>

            {/* Windows 7/8/10/11 */}
            <button
              onClick={() => onSetSimMode('win10_modern')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 ${
                simMode === 'win10_modern' 
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
              }`}
            >
              <span>✅</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-black">Windows 7/8/10/11</span>
                <span className="text-[10px] opacity-75 block">{lang === 'ru' ? '✅ Новый Windows' : '✅ Modern Win'}</span>
              </div>
            </button>

            {/* Android Old */}
            <button
              onClick={() => onSetSimMode('android_old')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 ${
                simMode === 'android_old' 
                  ? 'bg-red-600 text-white border-red-400 shadow-md ring-2 ring-red-400' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
              }`}
            >
              <span>🤖</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-black">{lang === 'ru' ? 'Старый Android (4-7)' : 'Old Android (4-7)'}</span>
                <span className="text-[10px] opacity-75 block">{lang === 'ru' ? '🛑 Старый Android' : '🛑 Old Android'}</span>
              </div>
            </button>

            {/* Android New */}
            <button
              onClick={() => onSetSimMode('android_new')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 ${
                simMode === 'android_new' 
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
              }`}
            >
              <span>📱</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-black">{lang === 'ru' ? 'Новый Android (8-15)' : 'New Android (8-15)'}</span>
                <span className="text-[10px] opacity-75 block">{lang === 'ru' ? '✅ Новый Android' : '✅ Modern Android'}</span>
              </div>
            </button>

            {/* MacOS/Linux Old */}
            <button
              onClick={() => onSetSimMode('mac_linux_old')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 ${
                simMode === 'mac_linux_old' 
                  ? 'bg-amber-600 text-white border-amber-400 shadow-md ring-2 ring-amber-400' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
              }`}
            >
              <span>💻</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-black">{lang === 'ru' ? 'Старый MacOS/Linux' : 'Old MacOS/Linux'}</span>
                <span className="text-[10px] opacity-75 block">{lang === 'ru' ? '⚠️ Старый MacOS/Linux' : '⚠️ Old MacOS/Linux'}</span>
              </div>
            </button>

            {/* MacOS/Linux New */}
            <button
              onClick={() => onSetSimMode('mac_linux_new')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 ${
                simMode === 'mac_linux_new' 
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
              }`}
            >
              <span>🍏</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-black">{lang === 'ru' ? 'Новый MacOS/Linux' : 'New MacOS/Linux'}</span>
                <span className="text-[10px] opacity-75 block">{lang === 'ru' ? '✅ Новый MacOS/Linux' : '✅ Modern Mac/Linux'}</span>
              </div>
            </button>

            {/* Old Browser */}
            <button
              onClick={() => onSetSimMode('old_browser')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 ${
                simMode === 'old_browser' 
                  ? 'bg-amber-600 text-white border-amber-400 shadow-md ring-2 ring-amber-400' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
              }`}
            >
              <span>🌐</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-black">{lang === 'ru' ? 'Старый Браузер (IE/Legacy)' : 'Old Browser (IE/Legacy)'}</span>
                <span className="text-[10px] opacity-75 block">{lang === 'ru' ? '🌐 Проверка Браузера' : '🌐 Browser Check'}</span>
              </div>
            </button>

            {/* Real Device */}
            <button
              onClick={() => onSetSimMode('real')}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 ${
                simMode === 'real' 
                  ? 'bg-duo-blue text-white border-blue-400 shadow-md ring-2 ring-blue-400' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
              }`}
            >
              <span>🔄</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-black">{lang === 'ru' ? 'Реальное Устройство' : 'Real Device'}</span>
                <span className="text-[10px] opacity-75 block">{lang === 'ru' ? 'Детекция Браузера' : 'Auto Detect'}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Close button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-duo-blue hover:bg-duo-blue/90 text-white font-black text-sm uppercase tracking-wider shadow-lg transition-all active:scale-95"
          >
            {lang === 'ru' ? 'Закрыть' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
