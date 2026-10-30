import React, { useState, useEffect } from 'react';
import { 
  getTimeUntilRunAppClosure, 
  formatTimeUntilClosure, 
  NEW_OFFICIAL_URL, 
  NEW_OFFICIAL_DOMAIN, 
  AI_STUDIO_URL,
  TimeRemaining
} from '../services/domainMigrationService';

interface DomainMigrationBannerProps {
  userLanguage?: string;
  onOpenDetails?: () => void;
  playSound?: (sound: any) => void;
}

export const DomainMigrationBanner: React.FC<DomainMigrationBannerProps> = ({
  userLanguage = 'ru',
  onOpenDetails,
  playSound,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() => getTimeUntilRunAppClosure());
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('duo_domain_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const isRu = userLanguage === 'ru';

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(getTimeUntilRunAppClosure());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDismiss = () => {
    if (playSound) playSound('click');
    setDismissed(true);
    try {
      sessionStorage.setItem('duo_domain_banner_dismissed', 'true');
    } catch {}
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(NEW_OFFICIAL_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (dismissed) {
    return (
      <div className="bg-amber-950/80 border-b border-amber-500/40 px-3 py-1 text-center flex items-center justify-center gap-2 text-[11px] text-amber-200">
        <span>⚠️</span>
        <span>
          {isRu 
            ? '1 нояб. 2026: адрес us-east1.run.app закроется ➔ Официальный адрес: duowindo6601.ai.studio'
            : 'Nov 1, 2026: us-east1.run.app will close ➔ Official address: duowindo6601.ai.studio'}
        </span>
        <button
          onClick={() => setShowDetailModal(true)}
          className="text-white underline font-bold hover:text-amber-300 ml-1 cursor-pointer"
        >
          {isRu ? 'Подробнее' : 'Details'}
        </button>
      </div>
    );
  }

  return (
    <>
      <aside aria-label="Предупреждение о миграции домена DuoWindo6601" className="w-full relative z-40 bg-gradient-to-r from-red-950 via-amber-950 to-orange-950 border-b-2 border-amber-500/60 shadow-lg px-3 py-2.5 sm:px-4 sm:py-3 text-white font-din">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
          
          {/* Left Info with Icon & Countdown */}
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-black flex items-center justify-center text-lg font-black shrink-0 shadow-md animate-bounce">
              ⚠️
            </div>

            <div className="text-left space-y-0.5 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-black text-amber-300 uppercase tracking-wide">
                  {isRu ? 'Прекращение адреса us-east1.run.app' : 'us-east1.run.app Deprecation'}
                </span>
                <span className="bg-red-500/30 text-red-200 border border-red-500/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  🔒 1 нояб. 2026
                </span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  ⏳ {formatTimeUntilClosure(timeRemaining, isRu)}
                </span>
              </div>

              <p className="text-[11px] sm:text-xs text-gray-200 leading-tight">
                {isRu ? (
                  <>
                    С 1 ноября 2026 года доступ по адресу <span className="font-mono text-amber-200">us-east1.run.app</span> будет закрыт.
                    Доступ открыт на <strong className="text-emerald-400 font-bold">{NEW_OFFICIAL_DOMAIN}</strong> (ai.studio).
                  </>
                ) : (
                  <>
                    Starting Nov 1, 2026, <span className="font-mono text-amber-200">us-east1.run.app</span> will be discontinued.
                    Official access is moving to <strong className="text-emerald-400 font-bold">{NEW_OFFICIAL_DOMAIN}</strong>.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 w-full md:w-auto shrink-0 justify-end flex-wrap">
            <a
              href={NEW_OFFICIAL_URL}
              target="_top"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl border-b-2 border-emerald-700 active:translate-y-0.5 transition-all flex items-center space-x-1.5 shadow"
            >
              <span>🚀</span>
              <span>{isRu ? 'Перейти на duowindo6601.ai.studio' : 'Go to duowindo6601.ai.studio'}</span>
            </a>

            <button
              type="button"
              onClick={() => {
                if (playSound) playSound('click');
                setShowDetailModal(true);
              }}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-amber-200 font-bold text-xs uppercase tracking-wider rounded-xl border border-gray-700 transition-all cursor-pointer"
            >
              {isRu ? 'Подробнее' : 'Details'}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title={isRu ? 'Свернуть' : 'Dismiss'}
              aria-label={isRu ? 'Свернуть предупреждение' : 'Dismiss warning'}
            >
              ✕
            </button>
          </div>

        </div>
      </aside>

      {/* DETAIL MODAL */}
      {showDetailModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#161824] border-2 border-amber-500/70 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative text-left">
            <button
              onClick={() => setShowDetailModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/50 flex items-center justify-center text-2xl font-bold">
                ⚠️
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  {isRu ? 'Миграция адреса DuoWindo6601' : 'DuoWindo6601 Domain Migration'}
                </h3>
                <p className="text-xs text-amber-300/80 font-bold">
                  {isRu ? 'Ограничение адреса us-east1.run.app с 1 ноября 2026 г.' : 'us-east1.run.app closure on Nov 1, 2026'}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-gray-300 leading-relaxed mb-6">
              <p>
                {isRu ? (
                  <>
                    В рамках планового обновления инфраструктуры и перехода на защищённую платформу <strong className="text-white">ai.studio</strong>, временный адрес Cloud Run <code className="bg-black/60 px-2 py-0.5 rounded text-red-300">us-east1.run.app</code> будет <strong className="text-red-400">полностью отключён 1 ноября 2026 года</strong>.
                  </>
                ) : (
                  <>
                    As part of planned infrastructure upgrade to the secure <strong className="text-white">ai.studio</strong> platform, the temporary Cloud Run host <code className="bg-black/60 px-2 py-0.5 rounded text-red-300">us-east1.run.app</code> will be <strong className="text-red-400">permanently shut down on November 1, 2026</strong>.
                  </>
                )}
              </p>

              <div className="bg-[#0f1018] p-4 rounded-2xl border border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-400">🔴 us-east1.run.app:</span>
                  <span className="text-red-400 font-bold uppercase text-[11px]">{isRu ? 'Прекращение 1 нояб. 2026' : 'Closes Nov 1, 2026'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-400">🟢 {NEW_OFFICIAL_DOMAIN}:</span>
                  <span className="text-emerald-400 font-bold uppercase text-[11px]">{isRu ? 'Основной официальный адрес' : 'Official Main Address'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-400">🌐 ai.studio:</span>
                  <span className="text-blue-400 font-bold uppercase text-[11px]">{isRu ? 'Платформа Google AI Studio' : 'Google AI Studio Platform'}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs">
                🛡️ <strong>{isRu ? 'Важно:' : 'Important:'}</strong> {isRu 
                  ? 'Все ваши данные (аккаунт, ударный режим, прогресс курсов и словари) сохраняются в Firebase Firestore и будут автоматически доступны на новом домене.' 
                  : 'All your user data (account, streak, XP, courses) is stored in Firebase Firestore and will be automatically available on the new domain.'}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <a
                href={NEW_OFFICIAL_URL}
                target="_top"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl border-b-2 border-emerald-700 active:translate-y-0.5 transition-all text-center flex items-center justify-center space-x-1"
              >
                <span>🚀</span>
                <span>{isRu ? 'Перейти на duowindo6601.ai.studio' : 'Go to duowindo6601.ai.studio'}</span>
              </a>

              <button
                type="button"
                onClick={handleCopy}
                className="py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-200 font-black text-xs uppercase tracking-wider rounded-xl border border-gray-700 transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>{copied ? '✅' : '📋'}</span>
                <span>{copied ? (isRu ? 'Скопировано!' : 'Copied!') : (isRu ? 'Копировать ссылку' : 'Copy Link')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
