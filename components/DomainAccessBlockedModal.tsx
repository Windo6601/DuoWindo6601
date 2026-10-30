import React, { useState } from 'react';
import { 
  NEW_OFFICIAL_URL, 
  NEW_OFFICIAL_DOMAIN, 
  AI_STUDIO_URL, 
  DomainSimMode,
  setDomainSimMode,
  redirectToOfficialDomain 
} from '../services/domainMigrationService';

interface DomainAccessBlockedModalProps {
  onSimModeChange?: (mode: DomainSimMode) => void;
  currentSimMode?: DomainSimMode;
  userLanguage?: string;
}

export const DomainAccessBlockedModal: React.FC<DomainAccessBlockedModalProps> = ({
  onSimModeChange,
  currentSimMode = 'auto',
  userLanguage = 'ru',
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(5);
  const [isRedirectCancelled, setIsRedirectCancelled] = useState<boolean>(false);
  const isRu = userLanguage === 'ru';

  React.useEffect(() => {
    if (isRedirectCancelled) return;
    if (redirectCountdown <= 0) {
      redirectToOfficialDomain();
      return;
    }
    const timer = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          redirectToOfficialDomain();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [redirectCountdown, isRedirectCancelled]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(NEW_OFFICIAL_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleSwitchSim = (mode: DomainSimMode) => {
    setDomainSimMode(mode);
    if (onSimModeChange) {
      onSimModeChange(mode);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-[#0c0d14] text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto font-din">
      {/* Background ambient red glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[600px] h-[340px] sm:h-[600px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full bg-[#161824] border-2 border-red-500/70 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl shadow-red-950/60 text-center my-auto">
        
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1.5 animate-pulse">
            <span>🛑</span>
            <span>ОГРАНИЧЕНИЕ АДРЕСА US-EAST1.RUN.APP</span>
          </span>
          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
            🔒 1 НОЯБРЯ 2026 ГОД
          </span>
        </div>

        {/* Big Stop Icon */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-4xl sm:text-5xl shadow-xl shadow-red-600/30 mb-6 border-2 border-red-400">
          🚫
        </div>

        {/* Main Headings */}
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase leading-tight mb-3">
          {isRu ? 'Нет доступа к адресу us-east1.run.app' : 'No Access to us-east1.run.app'}
        </h1>
        
        <p className="text-sm sm:text-base font-bold text-red-200/90 leading-relaxed mb-6 max-w-xl mx-auto">
          {isRu ? (
            <>
              <strong className="text-white">1 ноября 2026 год:</strong> прекращение работы адреса <code className="bg-red-950/80 px-2 py-0.5 rounded text-red-300 border border-red-500/40">us-east1.run.app</code>. 
              Адрес закрыт. Официальный доступ DuoWindo6601 открыт на <strong className="text-emerald-400 underline">{NEW_OFFICIAL_DOMAIN}</strong> (ai.studio).
            </>
          ) : (
            <>
              <strong className="text-white">November 1, 2026:</strong> discontinuation of <code className="bg-red-950/80 px-2 py-0.5 rounded text-red-300 border border-red-500/40">us-east1.run.app</code>. 
              Address is closed. Official access is now open on <strong className="text-emerald-400 underline">{NEW_OFFICIAL_DOMAIN}</strong> (ai.studio).
            </>
          )}
        </p>

        {/* Domains Comparison Box */}
        <div className="bg-[#0f1018] border border-gray-800 rounded-2xl p-4 sm:p-5 mb-6 text-left space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800 text-xs sm:text-sm">
            <div className="flex items-center space-x-2.5">
              <span className="text-lg">❌</span>
              <div>
                <p className="font-mono text-gray-400 line-through">*.us-east1.run.app</p>
                <p className="text-[11px] text-red-400 font-bold uppercase">
                  {isRu ? 'Закрыт с 1 ноября 2026 г. • Доступа нет' : 'Closed Nov 1, 2026 • Access terminated'}
                </p>
              </div>
            </div>
            <span className="bg-red-950 text-red-400 text-[10px] font-black px-2 py-1 rounded border border-red-500/30 uppercase">
              {isRu ? 'Прекращён' : 'Terminated'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs sm:text-sm">
            <div className="flex items-center space-x-2.5">
              <span className="text-lg">✅</span>
              <div>
                <p className="font-mono text-emerald-400 font-black">{NEW_OFFICIAL_DOMAIN}</p>
                <p className="text-[11px] text-emerald-300/80 font-bold uppercase">
                  {isRu ? 'Официальный домен DuoWindo6601 • Доступ открыт' : 'Official DuoWindo6601 Domain • Active'}
                </p>
              </div>
            </div>
            <span className="bg-emerald-950 text-emerald-300 text-[10px] font-black px-2 py-1 rounded border border-emerald-500/30 uppercase">
              {isRu ? 'Работает' : 'Online'}
            </span>
          </div>
        </div>

        {/* AUTO-REDIRECT BOX */}
        <div className="p-4 bg-emerald-950/40 border-2 border-emerald-500/50 rounded-2xl mb-6 text-center shadow-lg">
          <div className="flex items-center justify-center space-x-2 text-emerald-400 font-black text-sm mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>
              {isRu 
                ? (isRedirectCancelled 
                    ? 'Перенаправление приостановлено' 
                    : `Перенаправление на duowindo6601.ai.studio через ${redirectCountdown} сек...`)
                : (isRedirectCancelled 
                    ? 'Redirect paused' 
                    : `Redirecting to duowindo6601.ai.studio in ${redirectCountdown}s...`)}
            </span>
          </div>
          <p className="text-xs text-gray-300 font-bold mb-2.5">
            {isRu 
              ? 'После 1 ноября 2026 года адрес us-east1.run.app направляется на адрес duowindo6601.ai.studio (ai.studio)' 
              : 'After Nov 1, 2026, address us-east1.run.app is directed to duowindo6601.ai.studio (ai.studio)'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => redirectToOfficialDomain()}
              className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase rounded-lg shadow transition-all cursor-pointer"
            >
              🚀 {isRu ? 'Перейти немедленно' : 'Go now'}
            </button>
            {!isRedirectCancelled ? (
              <button
                type="button"
                onClick={() => setIsRedirectCancelled(true)}
                className="py-1.5 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg border border-gray-700 transition-all cursor-pointer"
              >
                ⏸ {isRu ? 'Остановить (для теста)' : 'Pause redirect'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setRedirectCountdown(5);
                  setIsRedirectCancelled(false);
                }}
                className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                ▶️ {isRu ? 'Возобновить перенаправление' : 'Resume redirect'}
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <a
            href={NEW_OFFICIAL_URL}
            target="_top"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm sm:text-base uppercase tracking-wider rounded-2xl border-b-4 border-emerald-700 active:translate-y-0.5 transition-all flex items-center justify-center space-x-2 shadow-xl shadow-emerald-500/20"
          >
            <span>🚀</span>
            <span>{isRu ? 'ПЕРЕЙТИ НА DUOWINDO6601.AI.STUDIO' : 'GO TO DUOWINDO6601.AI.STUDIO'}</span>
            <span>➔</span>
          </a>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href={AI_STUDIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-200 font-black text-xs uppercase tracking-wider rounded-xl border border-gray-700 flex items-center justify-center space-x-2 transition-all"
            >
              <span>🌐</span>
              <span>{isRu ? 'ОТКРЫТЬ AI.STUDIO' : 'OPEN AI.STUDIO'}</span>
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-200 font-black text-xs uppercase tracking-wider rounded-xl border border-gray-700 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <span>{copied ? '✅' : '📋'}</span>
              <span>{copied ? (isRu ? 'АДРЕС СКОПИРОВАН!' : 'COPIED!') : (isRu ? 'СКОПИРОВАТЬ ССЫЛКУ' : 'COPY URL')}</span>
            </button>
          </div>
        </div>

        {/* Data Persistence Guarantee Card */}
        <div className="p-3.5 bg-blue-950/30 border border-blue-500/30 rounded-2xl text-left flex items-start space-x-3 mb-5">
          <span className="text-xl shrink-0">🛡️</span>
          <div className="text-xs text-blue-200/90 leading-relaxed font-medium">
            <strong className="text-white block font-bold mb-0.5">
              {isRu ? 'Сохранность данных пользователя:' : 'User Data Safety:'}
            </strong>
            {isRu
              ? 'Ваш аккаунт, ударный режим, пройденные уроки и кристаллы синхронизированы в облачной базе Google Firebase Firestore и будут доступны при входе на duowindo6601.ai.studio.'
              : 'Your account, streak, XP, and gems are synchronized with Google Firebase Firestore and will be available on duowindo6601.ai.studio.'}
          </div>
        </div>

        {/* Developer / Testing Simulator Switcher */}
        <div className="pt-4 border-t border-gray-800/80">
          <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold mb-2">
            <span>⚙️ {isRu ? 'Режим симулятора для тестирования:' : 'Simulator Mode for Testing:'}</span>
            <span className="font-mono text-amber-400">{currentSimMode}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-black uppercase">
            <button
              type="button"
              onClick={() => handleSwitchSim('sim_blocked')}
              className={`py-1.5 px-2 rounded-lg border transition-all ${
                currentSimMode === 'sim_blocked'
                  ? 'bg-red-600 text-white border-red-400'
                  : 'bg-gray-800/80 text-gray-400 hover:text-white border-gray-700'
              }`}
            >
              {isRu ? 'Блок us-east1' : 'Block us-east1'}
            </button>

            <button
              type="button"
              onClick={() => handleSwitchSim('sim_warning')}
              className={`py-1.5 px-2 rounded-lg border transition-all ${
                currentSimMode === 'sim_warning'
                  ? 'bg-amber-600 text-white border-amber-400'
                  : 'bg-gray-800/80 text-gray-400 hover:text-white border-gray-700'
              }`}
            >
              {isRu ? 'Предупреждение' : 'Warning'}
            </button>

            <button
              type="button"
              onClick={() => handleSwitchSim('sim_official')}
              className={`py-1.5 px-2 rounded-lg border transition-all ${
                currentSimMode === 'sim_official'
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-gray-800/80 text-gray-400 hover:text-white border-gray-700'
              }`}
            >
              {isRu ? 'ai.studio' : 'ai.studio'}
            </button>

            <button
              type="button"
              onClick={() => handleSwitchSim('auto')}
              className={`py-1.5 px-2 rounded-lg border transition-all ${
                currentSimMode === 'auto'
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-gray-800/80 text-gray-400 hover:text-white border-gray-700'
              }`}
            >
              {isRu ? 'Авто (по дате)' : 'Auto'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
