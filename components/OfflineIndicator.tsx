import React, { useEffect, useState, useCallback } from 'react';
import { resolveApiUrl } from '../services/nativeBridge';
import { pingGeminiApi } from '../services/geminiService';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC<{ isRu?: boolean }> = ({ isRu = true }) => {
  const browserOnline = useOnlineStatus();
  const [checking, setChecking] = useState(false);
  const [manualOnline, setManualOnline] = useState<boolean>(browserOnline);

  useEffect(() => {
    setManualOnline(browserOnline);
  }, [browserOnline]);

  const handleRetryConnection = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch(resolveApiUrl(`/api/server-info?t=${Date.now()}`), {
        method: 'GET',
        cache: 'no-store',
      });
      if (res.ok) {
        setManualOnline(true);
        return;
      }
    } catch {
      // Fallback check via Gemini API ping if server-info is unreachable
    }
    try {
      const ping = await pingGeminiApi();
      setManualOnline(ping.ok || (typeof navigator !== 'undefined' ? navigator.onLine : false));
    } catch {
      setManualOnline(typeof navigator !== 'undefined' ? navigator.onLine : false);
    } finally {
      setChecking(false);
    }
  }, []);

  if (manualOnline) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-duo-card border-2 border-red-500/70 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl space-y-5 text-white">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center text-3xl shadow-inner">
          📡
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white">
            {isRu ? 'Нет подключения к интернету' : 'No Internet Connection'}
          </h2>
          <p className="text-sm font-bold text-gray-300 leading-relaxed">
            {isRu
              ? 'Для работы DuoWindo6601 нужен интернет. Включите Wi-Fi или мобильные данные и попробуйте снова'
              : 'DuoWindo6601 requires an internet connection. Turn on Wi-Fi or mobile data and try again.'}
          </p>
        </div>

        <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-2xl px-4 py-2.5 text-xs font-bold text-emerald-300">
          {isRu
            ? '🌐 Работает без VPN и использует VPN'
            : '🌐 Works without VPN and with VPN'}
        </div>

        <button
          type="button"
          onClick={() => void handleRetryConnection()}
          disabled={checking}
          className="w-full py-3.5 px-6 bg-duo-green hover:brightness-110 disabled:opacity-60 text-white font-black text-sm uppercase tracking-wider rounded-2xl border-b-4 border-duo-greenDark active:border-b-0 active:translate-y-0.5 transition-all shadow-lg cursor-pointer"
        >
          {checking
            ? (isRu ? 'Проверка подключения...' : 'Checking connection...')
            : (isRu ? 'Попробовать снова' : 'Try Again')}
        </button>
      </div>
    </div>
  );
};
