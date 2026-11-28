import React, { useEffect, useState, useCallback } from 'react';
import {
  getSharedServerOnline,
  isAppOnlineNow,
  setAppOnlineState,
  setSharedServerOnline,
  subscribeOnlineStatus,
} from '../services/networkState';

export { isAppOnlineNow, setAppOnlineState };

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => isAppOnlineNow());

  useEffect(() => {
    const unsubscribe = subscribeOnlineStatus((next: boolean) => {
      setIsOnline(next);
    });

    const handleBrowserOnline = () => {
      setAppOnlineState(true, false);
      setIsOnline(true);
    };
    const handleBrowserOffline = () => {
      setAppOnlineState(false, false);
      setIsOnline(false);
    };
    const handleCustomOnline = () => {
      setSharedServerOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
      setIsOnline(isAppOnlineNow());
    };
    const handleCustomOffline = () => {
      setSharedServerOnline(false);
      setIsOnline(false);
    };

    window.addEventListener('online', handleBrowserOnline);
    window.addEventListener('offline', handleBrowserOffline);
    window.addEventListener('duowindo_network_online', handleCustomOnline);
    window.addEventListener('duowindo_network_offline', handleCustomOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleBrowserOnline);
      window.removeEventListener('offline', handleBrowserOffline);
      window.removeEventListener('duowindo_network_online', handleCustomOnline);
      window.removeEventListener('duowindo_network_offline', handleCustomOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC<{ isRu?: boolean }> = ({ isRu = true }) => {
  const browserOnline = useOnlineStatus();
  const [checking, setChecking] = useState(false);
  const [manualOnline, setManualOnline] = useState<boolean>(() => isAppOnlineNow());

  const verifyServerConnectivity = useCallback(async (timeoutMs: number = 3000): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`/api/server-info?t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!res.ok) return false;
      const data = await res.json().catch(() => null);
      return Boolean(data?.ok !== false);
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }, []);

  const runConnectivityCheck = useCallback(async (isCancelled?: () => boolean) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setManualOnline(false);
      setAppOnlineState(false, true);
      return;
    }
    const ok = await verifyServerConnectivity(2500);
    if (isCancelled?.()) return;
    if (ok) {
      setManualOnline(true);
      if (!getSharedServerOnline()) {
        setAppOnlineState(true, true);
      }
      return;
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setManualOnline(false);
      setAppOnlineState(false, true);
      return;
    }
    await new Promise((r) => setTimeout(r, 400));
    if (isCancelled?.()) return;
    const retryOk = await verifyServerConnectivity(2500);
    if (isCancelled?.()) return;
    if (!retryOk) {
      setManualOnline(false);
      setAppOnlineState(false, true);
    } else {
      setManualOnline(true);
      if (!getSharedServerOnline()) {
        setAppOnlineState(true, true);
      }
    }
  }, [verifyServerConnectivity]);

  useEffect(() => {
    if (!browserOnline) {
      setManualOnline(false);
      return;
    }
    let cancelled = false;
    setManualOnline(true);
    void runConnectivityCheck(() => cancelled);

    const onFocusOrVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void runConnectivityCheck(() => cancelled);
    };

    const interval = setInterval(() => {
      void runConnectivityCheck(() => cancelled);
    }, 10000);

    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [browserOnline, runConnectivityCheck]);

  useEffect(() => {
    const handleNetworkOffline = () => {
      setSharedServerOnline(false);
      setManualOnline(false);
    };
    const handleNetworkOnline = () => {
      if (typeof navigator === 'undefined' || navigator.onLine) {
        setSharedServerOnline(true);
        setManualOnline(true);
      }
    };
    window.addEventListener('duowindo_network_offline', handleNetworkOffline);
    window.addEventListener('duowindo_network_online', handleNetworkOnline);
    return () => {
      window.removeEventListener('duowindo_network_offline', handleNetworkOffline);
      window.removeEventListener('duowindo_network_online', handleNetworkOnline);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    if (!manualOnline) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
    return undefined;
  }, [manualOnline]);

  const handleRetryConnection = useCallback(async () => {
    setChecking(true);
    try {
      const ok = await verifyServerConnectivity(4500);
      setManualOnline(ok);
      setAppOnlineState(ok, true);
    } finally {
      setChecking(false);
    }
  }, [verifyServerConnectivity]);

  if (browserOnline && manualOnline && (typeof navigator === 'undefined' || navigator.onLine)) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
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
