import React from 'react';
import { SystemCompatibilityResult } from '../services/systemCompatibilityService';

interface SystemCompatibilityBannerProps {
  systemInfo: SystemCompatibilityResult;
  onOpenDetails: () => void;
  onDismiss: () => void;
  lang?: string;
}

export const SystemCompatibilityBanner: React.FC<SystemCompatibilityBannerProps> = ({
  systemInfo,
  onOpenDetails,
  onDismiss,
  lang = 'ru'
}) => {
  if (systemInfo.warningType === 'none') {
    // Fully supported OS & modern browser: NO WARNING BANNER!
    return null;
  }

  const isCritical = systemInfo.warningType === 'windows_xp_vista' || systemInfo.warningType === 'old_android' || systemInfo.warningType === 'old_ios';
  const isAndroid = systemInfo.warningType === 'old_android';
  const isIOS = systemInfo.warningType === 'old_ios';
  const isMacLinux = systemInfo.warningType === 'old_mac_linux';
  const isXpOrVista = systemInfo.warningType === 'windows_xp_vista';

  return (
    <div className={`w-full relative z-40 px-3 py-3 sm:px-6 sm:py-4 transition-all duration-300 ${
      isCritical 
        ? 'bg-gradient-to-r from-red-950/95 via-rose-950/90 to-amber-950/95 border-b-2 border-red-500/60 shadow-lg text-red-100'
        : 'bg-gradient-to-r from-amber-950/95 via-orange-950/90 to-yellow-950/95 border-b-2 border-amber-500/60 shadow-lg text-amber-100'
    }`}>
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        
        {/* Left Icon & Content */}
        <div className="flex items-start space-x-3 flex-1">
          <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl font-bold shadow-md ${
            isCritical ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-500 text-black animate-bounce'
          }`}>
            {isCritical ? '🛑' : '⚠️'}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-sm sm:text-base tracking-wide uppercase flex items-center gap-1.5">
                {isXpOrVista ? (
                  lang === 'ru' ? 'DuoWindo6601: Прекращение поддержки Win XP / 2003, Mypal 78.0.3 XP & SAPI 4.0' : 'DuoWindo6601: Windows XP / 2003, Mypal & SAPI 4.0 Support Ended'
                ) : isIOS ? (
                  lang === 'ru' ? 'DuoWindo6601: Старая версия iOS / iPad (< 14.0) — Не получится обновить PWA' : 'DuoWindo6601: Legacy iOS / iPad (< 14.0) — PWA Update Unsupported'
                ) : isAndroid ? (
                  lang === 'ru' ? 'DuoWindo6601: Старая версия Android (4.x - 7.x) — Не получится обновить PWA' : 'DuoWindo6601: Legacy Android Version (4.x - 7.x)'
                ) : isMacLinux ? (
                  lang === 'ru' ? 'DuoWindo6601: Устаревшая версия macOS / Linux' : 'DuoWindo6601: Outdated macOS / Linux'
                ) : (
                  lang === 'ru' ? 'DuoWindo6601: Устаревший браузер — Обновление PWA не получится' : 'DuoWindo6601: Outdated Web Browser'
                )}
              </h3>
              
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isCritical ? 'bg-red-500/30 text-red-300 border border-red-500/50' : 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
              }`}>
                {systemInfo.osName} {systemInfo.osVersion ? `(${systemInfo.osVersion})` : ''}
              </span>
            </div>

            <p className="text-xs sm:text-sm opacity-90 leading-relaxed font-medium max-w-3xl">
              {systemInfo.detailsReason}
            </p>

            {/* Supported OS Badges */}
            {isXpOrVista && (
              <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="font-bold opacity-75">{lang === 'ru' ? 'Поддерживаются:' : 'Supported Windows:'}</span>
                {['Windows 7', 'Windows 8', 'Windows 8.1', 'Windows 10', 'Windows 11'].map((os) => (
                  <span key={os} className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md font-black">
                    ✓ {os}
                  </span>
                ))}
              </div>
            )}

            {isIOS && (
              <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="font-bold opacity-75">{lang === 'ru' ? 'Требуется для iOS / iPad:' : 'Required for iOS / iPad:'}</span>
                <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md font-black">
                  ✓ iOS / iPadOS 15.0+ (Safari 15+) — Новый Систем
                </span>
              </div>
            )}

            {isAndroid && (
              <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="font-bold opacity-75">{lang === 'ru' ? 'Рекомендация:' : 'Required Android:'}</span>
                <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md font-black">
                  ✓ Android 8.0+ / 9 / 10 / 11 / 12 / 13 / 14 / 15 + Chrome Mobile
                </span>
              </div>
            )}

            {isMacLinux && (
              <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="font-bold opacity-75">{lang === 'ru' ? 'Рекомендация:' : 'Required OS:'}</span>
                <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md font-black">
                  ✓ macOS 11+ / Modern Linux + Chrome 100+ / Firefox 100+ / Safari 14+
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end flex-shrink-0 pt-1 sm:pt-0">
          <button
            onClick={onOpenDetails}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center space-x-1 cursor-pointer ${
              isCritical 
                ? 'bg-red-600 hover:bg-red-500 text-white border border-red-400' 
                : 'bg-amber-500 hover:bg-amber-400 text-black border border-amber-300'
            }`}
          >
            <span>ℹ️</span>
            <span>{lang === 'ru' ? 'Подробнее' : 'Details'}</span>
          </button>

          <button
            onClick={onDismiss}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-all border border-white/10 cursor-pointer"
            title={lang === 'ru' ? 'Закрыть предупреждение' : 'Dismiss warning'}
          >
            ✕
          </button>
        </div>

      </div>
    </div>
  );
};
