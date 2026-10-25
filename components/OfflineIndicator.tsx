import React, { useEffect, useState } from 'react';

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
  const isOnline = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isOnline) {
      setDismissed(false);
    }
  }, [isOnline]);

  if (isOnline || dismissed) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 flex items-center gap-3 rounded-2xl bg-amber-500/95 backdrop-blur-md px-4 py-3 text-xs font-black text-white shadow-2xl animate-pulse">
      <span className="h-2.5 w-2.5 rounded-full bg-white ring-4 ring-white/30 shrink-0" />
      <span className="leading-tight">
        {isRu
          ? 'Офлайн-режим — используются кэшированные данные PWA'
          : 'Offline Mode — Cached PWA data is being used.'}
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="ml-1 bg-black/30 hover:bg-black/50 active:scale-95 text-white/90 hover:text-white px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0"
        title={isRu ? "Пропустить / Скрыть уведомление" : "Skip / Dismiss notification"}
      >
        {isRu ? 'Пропустить ✕' : 'Skip ✕'}
      </button>
    </div>
  );
};
