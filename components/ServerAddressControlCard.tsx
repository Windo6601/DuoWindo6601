import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import {
  ServerAddressMode,
  ServerEndpointConfig,
  getServerEndpointConfig,
  saveServerEndpointConfig,
  pingServerEndpoint,
  US_EAST1_RUN_DEV_URL,
  US_EAST1_RUN_PREVIEW_URL,
  AI_STUDIO_WEB_URL,
  AI_STUDIO_DIRECT_API,
  getCurrentOrigin,
  PingResult
} from '../services/serverAddressManager';

const AUTHORIZED_ADMIN_DEVELOPERS = [
  'abramovanatolij81@gmail.com',
  'va997217@gmail.com'
];

interface ServerAddressControlCardProps {
  compact?: boolean;
  playSound?: (type: string) => void;
  setToast?: (toast: any) => void;
  onEndpointChange?: (config: ServerEndpointConfig) => void;
  title?: string;
  showDeveloperTools?: boolean;
  currentUserEmail?: string;
  userRole?: string;
  isUnlocked?: boolean;
}

export const ServerAddressControlCard: React.FC<ServerAddressControlCardProps> = ({
  compact = false,
  playSound,
  setToast,
  onEndpointChange,
  title,
  showDeveloperTools = true,
  currentUserEmail,
  userRole,
  isUnlocked = true,
}) => {
  // Security & Access Control: ONLY for Administrator and Developer
  const activeEmail = (auth?.currentUser?.email || currentUserEmail || '').toLowerCase();
  const isAuthorizedEmail = AUTHORIZED_ADMIN_DEVELOPERS.some(email => activeEmail.includes(email.toLowerCase()));
  const isAuthorizedRole = userRole === 'admin' || userRole === 'owner' || userRole === 'developer';
  const isAuthorized = (isUnlocked !== false) && (isAuthorizedEmail || isAuthorizedRole);
  const [config, setConfig] = useState<ServerEndpointConfig>(() => getServerEndpointConfig());
  const [customInput, setCustomInput] = useState<string>(() => getServerEndpointConfig().customUrl);
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [isPingingAll, setIsPingingAll] = useState<boolean>(false);

  // Latency states
  const [pingResults, setPingResults] = useState<{
    'us-east1'?: PingResult;
    'ai-studio'?: PingResult;
    'auto'?: PingResult;
    'custom'?: PingResult;
  }>({});

  const currentOrigin = getCurrentOrigin();

  // Helper for toasts
  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (setToast) {
      setToast(msg);
    }
  };

  // Sync with storage events
  useEffect(() => {
    const handleSync = (e: any) => {
      const updated = e?.detail || getServerEndpointConfig();
      setConfig(updated);
      setCustomInput(updated.customUrl || '');
    };
    window.addEventListener('duowindo_server_endpoint_changed', handleSync);
    return () => {
      window.removeEventListener('duowindo_server_endpoint_changed', handleSync);
    };
  }, []);

  // Ping single target
  const handlePingTarget = async (mode: ServerAddressMode, targetUrl: string) => {
    playSound?.('click');
    setPingResults(prev => ({
      ...prev,
      [mode]: { ok: true, latencyMs: 0, message: 'Проверка связи...' }
    }));

    const result = await pingServerEndpoint(targetUrl, 4500);
    setPingResults(prev => ({ ...prev, [mode]: result }));

    if (result.ok) {
      playSound?.('lesson_complete');
      triggerToast(`🟢 ${mode.toUpperCase()} Онлайн: ${result.latencyMs} мс`, 'success');
    } else {
      playSound?.('wrong');
      triggerToast(`🔴 ${mode.toUpperCase()}: ${result.message}`, 'error');
    }
  };

  // Switch active mode
  const handleSelectMode = (newMode: ServerAddressMode, customUrlOverride?: string) => {
    playSound?.('click');
    const url = customUrlOverride !== undefined ? customUrlOverride : customInput;
    const updated = saveServerEndpointConfig(newMode, url, config.proxyEnabled);
    setConfig(updated);
    onEndpointChange?.(updated);

    const modeLabels: Record<ServerAddressMode, string> = {
      'us-east1': 'Cloud Run (us-east1.run.app)',
      'ai-studio': 'Google AI Studio (ai.studio)',
      'auto': 'Текущий адрес браузера',
      'custom': 'Пользовательский адрес'
    };

    triggerToast(`🌐 Активный адрес переключен: ${modeLabels[newMode]}`, 'success');
  };

  // Toggle US Cloud Proxy routing
  const handleToggleProxy = () => {
    playSound?.('click');
    const nextProxy = !config.proxyEnabled;
    const updated = saveServerEndpointConfig(config.mode, customInput, nextProxy);
    setConfig(updated);
    onEndpointChange?.(updated);
    triggerToast(
      nextProxy 
        ? '🛡️ US Cloud Proxy включен (Обход региональных ограничений)' 
        : '⚡ Прямые вызовы в AI Studio включены', 
      'info'
    );
  };

  // Ping all servers simultaneously
  const handlePingAll = async () => {
    playSound?.('click');
    setIsPingingAll(true);
    triggerToast('📡 Проверка пинга всех адресов...', 'info');

    try {
      const [pUs, pAi, pAuto] = await Promise.all([
        pingServerEndpoint(US_EAST1_RUN_DEV_URL, 4500),
        pingServerEndpoint(AI_STUDIO_DIRECT_API, 4500),
        pingServerEndpoint(currentOrigin, 3500)
      ]);

      setPingResults({
        'us-east1': pUs,
        'ai-studio': pAi,
        'auto': pAuto
      });

      playSound?.('lesson_complete');
      triggerToast(
        `✅ Пинг завершен: us-east1 (${pUs.ok ? pUs.latencyMs + 'мс' : 'ошибка'}), ai.studio (${pAi.ok ? pAi.latencyMs + 'мс' : 'ошибка'})`,
        'success'
      );
    } catch (e) {
      playSound?.('wrong');
      triggerToast('Ошибка при пакетной проверке адресов', 'error');
    } finally {
      setIsPingingAll(false);
    }
  };

  // Strict security check: If user is not authorized, block display completely
  if (!isAuthorized) {
    if (compact) {
      return null;
    }
    return (
      <div className="bg-gradient-to-br from-gray-900 via-rose-950/40 to-gray-900 border-2 border-rose-500/40 rounded-3xl p-6 md:p-8 text-center space-y-4 shadow-2xl animate-in fade-in">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/50 flex items-center justify-center text-3xl mx-auto shadow-inner">
          🔒
        </div>
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 bg-rose-500/20 border border-rose-500/40 px-3 py-0.5 rounded-full text-rose-300 text-[10px] font-black uppercase tracking-wider">
            <span>🚫 Недоступно пользователям</span>
          </div>
          <h3 className="text-lg font-black uppercase tracking-tight text-white">
            🌐 Адреса серверов (us-east1.run.app & ai.studio)
          </h3>
          <p className="text-xs text-amber-300 font-bold">
            Доступ Только Администратора и разработчик
          </p>
        </div>
        <p className="text-xs text-gray-400 max-w-lg mx-auto leading-relaxed">
          Функция переключения маршрутизации и пинга серверов (<b className="text-sky-300">us-east1.run.app</b> и <b className="text-purple-300">ai.studio</b>) заблокирована для обычных пользователей платформы. Доступ разрешен исключительно Администраторам и Разработчикам (<b className="text-amber-300">abramovanatolij81@gmail.com</b>, <b className="text-amber-300">va997217@gmail.com</b>).
        </p>
        <div className="inline-flex items-center gap-2 bg-rose-950/80 border border-rose-500/40 text-rose-300 px-4 py-2 rounded-xl text-xs font-bold">
          <span>🔒 Доступ ограничен: требуется авторизация Администратора или Разработчика</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border transition-all text-left overflow-hidden ${
      compact
        ? 'bg-gray-900/90 border-amber-500/30 p-4 shadow-lg'
        : 'bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900 border-2 border-amber-500/40 p-5 md:p-6 shadow-2xl'
    }`}>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4 mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-sky-500/20 border border-amber-500/40 flex items-center justify-center text-xl shadow-inner">
            🌐
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-wider">
                {title || 'Управление адресами серверов: us-east1.run.app и ai.studio'}
              </h3>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-500/40 uppercase flex items-center gap-1">
                👑 Только Администратор и разработчик
              </span>
              <span className="bg-rose-500/20 text-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-500/40 uppercase">
                🔒 Недоступно пользователям
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
              Конфиденциальное управление серверами для Администратора и Разработчика (<span className="text-amber-300 font-bold">abramovanatolij81@gmail.com</span>, <span className="text-amber-300 font-bold">va997217@gmail.com</span>). Пользователям платформы доступ полностью заблокирован.
            </p>
          </div>
        </div>

        {/* ACTIVE STATUS BADGE & PING ALL */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePingAll}
            disabled={isPingingAll}
            className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-amber-300 text-xs font-black uppercase tracking-wider border border-gray-700 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
            title="Проверить отклик всех серверов"
          >
            <span className={isPingingAll ? 'animate-spin' : ''}>📡</span>
            <span>{isPingingAll ? 'Пинг...' : 'Пинг всех'}</span>
          </button>
        </div>
      </div>

      {/* ACTIVE HOST BANNER */}
      <div className="mb-4 p-3 bg-gray-950/70 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-inner">
        <div className="flex items-center space-x-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-gray-400">Активный сервер:</span>
          <span className="font-mono font-bold text-amber-300 break-all">{config.label}</span>
        </div>
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="text-gray-400">Режим:</span>
          <span className={`px-2 py-0.5 rounded-lg font-mono font-bold text-[10px] uppercase border ${
            config.proxyEnabled 
              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40' 
              : 'bg-sky-950/70 text-sky-300 border-sky-500/40'
          }`}>
            {config.proxyEnabled ? '🛡️ US Cloud Proxy' : '⚡ Direct API'}
          </span>
        </div>
      </div>

      {/* SERVER SELECTION PRESET CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* 1. CLOUD RUN us-east1.run.app */}
        <div className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
          config.mode === 'us-east1'
            ? 'bg-amber-950/20 border-amber-500 shadow-lg shadow-amber-950/30'
            : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🚀</span>
                <span className="font-black text-xs text-white uppercase tracking-wider">
                  us-east1.run.app
                </span>
              </div>
              <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                US East Cloud Run
              </span>
            </div>
            <p className="text-[11px] text-gray-300 mb-2 leading-relaxed">
              Выделенный прокси в Северной Америке (us-east1). Предотвращает ошибку <em>User location is not supported</em> в России, Беларуси и СНГ.
            </p>
            <div className="text-[10px] font-mono text-gray-400 break-all bg-black/40 p-2 rounded-xl mb-3 border border-gray-800">
              {US_EAST1_RUN_DEV_URL}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-800/80">
            <button
              type="button"
              onClick={() => handleSelectMode('us-east1')}
              className={`flex-1 py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                config.mode === 'us-east1'
                  ? 'bg-amber-500 text-black shadow-md border-b-2 border-amber-700'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
              }`}
            >
              {config.mode === 'us-east1' ? '✓ Активен' : 'Выбрать us-east1'}
            </button>
            <button
              type="button"
              onClick={() => handlePingTarget('us-east1', US_EAST1_RUN_DEV_URL)}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-sky-300 rounded-xl text-xs font-mono font-bold border border-gray-700 transition-all cursor-pointer whitespace-nowrap"
            >
              {pingResults['us-east1'] ? pingResults['us-east1'].message : 'Пинг 📡'}
            </button>
          </div>
        </div>

        {/* 2. GOOGLE AI STUDIO (ai.studio) */}
        <div className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
          config.mode === 'ai-studio'
            ? 'bg-sky-950/20 border-sky-500 shadow-lg shadow-sky-950/30'
            : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🎨</span>
                <span className="font-black text-xs text-white uppercase tracking-wider">
                  ai.studio
                </span>
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                Google AI Studio Direct
              </span>
            </div>
            <p className="text-[11px] text-gray-300 mb-2 leading-relaxed">
              Официальный API Google AI Studio для разработчиков. Прямые вызовы к модели Gemini без промежуточных прокси.
            </p>
            <div className="text-[10px] font-mono text-gray-400 break-all bg-black/40 p-2 rounded-xl mb-3 border border-gray-800">
              {AI_STUDIO_DIRECT_API}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-800/80">
            <button
              type="button"
              onClick={() => handleSelectMode('ai-studio')}
              className={`flex-1 py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                config.mode === 'ai-studio'
                  ? 'bg-sky-500 text-black shadow-md border-b-2 border-sky-700'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
              }`}
            >
              {config.mode === 'ai-studio' ? '✓ Активен' : 'Выбрать ai.studio'}
            </button>
            <button
              type="button"
              onClick={() => handlePingTarget('ai-studio', AI_STUDIO_DIRECT_API)}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-emerald-300 rounded-xl text-xs font-mono font-bold border border-gray-700 transition-all cursor-pointer whitespace-nowrap"
            >
              {pingResults['ai-studio'] ? pingResults['ai-studio'].message : 'Пинг 📡'}
            </button>
          </div>
        </div>
      </div>

      {/* SECONDARY ROW: AUTO & CUSTOM ADDRESS CONTROLS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* AUTO DETECT ORIGIN */}
        <div className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
          config.mode === 'auto'
            ? 'bg-gray-800 border-amber-500/60'
            : 'bg-gray-900/60 border-gray-800'
        }`}>
          <div className="overflow-hidden mr-2">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>💻</span>
              <span>Авто-домен</span>
            </div>
            <div className="text-[10px] font-mono text-gray-400 truncate">
              {currentOrigin}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSelectMode('auto')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap cursor-pointer ${
              config.mode === 'auto'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
            }`}
          >
            {config.mode === 'auto' ? 'Активен' : 'Выбрать'}
          </button>
        </div>

        {/* CUSTOM HOST TOGGLE */}
        <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>⚙️</span>
              <span>Свой адрес разработчика</span>
            </div>
            <div className="text-[10px] text-gray-400">
              {showCustomInput ? 'Ввод пользовательского хоста' : 'Нажмите для ввода своего URL'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-amber-300 rounded-xl text-xs font-bold border border-gray-700 cursor-pointer"
          >
            {showCustomInput ? 'Скрыть' : 'Настроить'}
          </button>
        </div>
      </div>

      {/* CUSTOM URL INPUT BLOCK */}
      {showCustomInput && (
        <div className="p-4 bg-gray-950 border border-amber-500/40 rounded-2xl mb-4 space-y-3 animate-in fade-in">
          <label className="block text-xs font-bold text-gray-300 uppercase tracking-wide">
            Пользовательский URL сервера / прокси (HTTPS):
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="https://your-custom-proxy.example.com"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={() => handleSelectMode('custom', customInput)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow"
            >
              Сохранить и активировать
            </button>
          </div>
        </div>
      )}

      {/* DEVELOPER TOOLS & PROXY SWITCH */}
      {showDeveloperTools && (
        <div className="pt-3 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleToggleProxy}
              className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all border cursor-pointer ${
                config.proxyEnabled
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
              }`}
            >
              {config.proxyEnabled ? '🛡️ Прокси /api/gemini-proxy: ВКЛ' : '⚡ Прямой вызов: ВКЛ'}
            </button>
            <span className="text-[11px] text-gray-400">
              {config.proxyEnabled ? 'Запросы идут через US IP' : 'Запросы идут напрямую из браузера'}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-gray-400">
            <a
              href={US_EAST1_RUN_DEV_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>🔗</span>
              <span>Dev Cloud Run</span>
            </a>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>🔑</span>
              <span>Ключи AI Studio</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
