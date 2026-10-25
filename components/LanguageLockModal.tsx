import React from 'react';
import { Mascot } from './Mascot';
import { 
  getWorldLockedLanguages,
  getCisLockedLanguages,
  getAllLockedLanguages,
  AVAILABLE_SWITCH_LANGUAGES,
  getDaysRemainingUntilUnlock, 
  LockedLanguageInfo 
} from '../services/languageLockService';
import { playSound } from '../services/audioService';

interface LanguageLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLang?: string | null;
  userLanguage?: string;
  isLightMode?: boolean;
  onOpenFeedback?: () => void;
}

export const LanguageLockModal: React.FC<LanguageLockModalProps> = ({
  isOpen,
  onClose,
  selectedLang,
  userLanguage = 'ru',
  isLightMode = false,
  onOpenFeedback,
}) => {
  if (!isOpen) return null;

  const isRu = userLanguage === 'ru';
  const worldLanguages = getWorldLockedLanguages();
  const cisLanguages = getCisLockedLanguages();
  const allLocked = getAllLockedLanguages();
  const daysLeft = getDaysRemainingUntilUnlock();
  const currentLocked = selectedLang ? allLocked.find(l => l.code === selectedLang) : null;

  return (
    <div className="fixed inset-0 z-[260] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-xl rounded-3xl p-5 sm:p-6 shadow-2xl border-2 flex flex-col relative animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto no-scrollbar ${
          isLightMode 
            ? 'bg-white border-amber-300 text-slate-800' 
            : 'bg-[#182329] border-amber-500/50 text-white'
        }`}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => {
            playSound('click');
            onClose();
          }}
          className={`absolute top-4 right-4 w-9 h-9 rounded-2xl flex items-center justify-center font-black transition-all cursor-pointer z-10 ${
            isLightMode 
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-500' 
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Mascot & Header */}
        <div className="flex flex-col items-center text-center mt-2 mb-4">
          <div className="relative mb-3">
            <Mascot emotion="thinking" className="w-24 h-24" />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black font-black text-xs px-2.5 py-0.5 rounded-full border-2 border-slate-900 shadow-md">
              🔒 2026
            </div>
          </div>

          <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full mb-2">
            {isRu ? 'В разработке • Релиз 1 ноября 2026 года' : 'In Development • Release November 1, 2026'}
          </span>

          <h3 className="text-xl sm:text-2xl font-black mb-1.5 leading-snug">
            {currentLocked ? (
              <>
                {isRu 
                  ? `Язык «${currentLocked.fullLabelRu || currentLocked.nameRu}» заблокирован` 
                  : `"${currentLocked.nameEn}" is currently locked`}
              </>
            ) : (
              <>
                {isRu ? 'Переключение языка недоступно' : 'Language switching locked'}
              </>
            )}
          </h3>

          <p className={`text-xs sm:text-sm font-medium max-w-md ${isLightMode ? 'text-gray-600' : 'text-gray-300'}`}>
            {isRu 
              ? 'Переключение на эти языки и раздел «Письмо» станут доступны 1 ноября 2026 года.' 
              : 'Switching to these languages and the "Letters" section will be available November 1, 2026.'}
          </p>
        </div>

        {/* Target Date Card */}
        <div className={`p-3.5 sm:p-4 rounded-2xl border mb-4 flex items-center justify-between ${
          isLightMode 
            ? 'bg-amber-50 border-amber-200 text-amber-950' 
            : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
        }`}>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🗓️</span>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                {isRu ? 'Дата открытия доступа:' : 'Unlock Date:'}
              </div>
              <div className="text-sm font-black">
                {isRu ? '1 ноября 2026 год' : 'November 1, 2026'}
              </div>
            </div>
          </div>
          {daysLeft > 0 && (
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-amber-500 text-black shadow">
              {isRu ? `~${daysLeft} дн.` : `~${daysLeft} days`}
            </span>
          )}
        </div>

        {/* Section 1: 10 World Languages */}
        <div className="mb-4">
          <div className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span>🌍</span>
              <span>{isRu ? 'Заблокированные языки (10):' : 'Locked World Languages (10):'}</span>
            </span>
            <span className="text-amber-400 font-bold lowercase text-[10px]">🔒 {isRu ? 'до 1 ноября 2026' : 'until Nov 1, 2026'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {worldLanguages.map(item => {
              const isTarget = selectedLang === item.code;
              return (
                <div
                  key={item.code}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    isTarget 
                      ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/40' 
                      : isLightMode 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-gray-800/80 border-gray-700/80'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="text-lg select-none shrink-0">{item.flagEmoji}</span>
                    <div className="min-w-0 text-left">
                      <div className="text-xs font-black truncate text-white">
                        {isRu ? item.nameRu : item.nameEn}
                      </div>
                      <div className="text-[10px] text-amber-300 font-medium truncate">
                        {item.nativeName}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm shrink-0 ml-2">🔒</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: CIS Countries & Letters Section */}
        <div className="mb-4 p-3.5 rounded-2xl border bg-gradient-to-br from-amber-950/20 via-black/30 to-purple-950/20 border-amber-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5 pb-2 border-b border-amber-500/20">
            <div className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <span>🌍</span>
              <span>{isRu ? 'Заблокированные языки мира' : 'Locked World Languages'}</span>
            </div>
            <div className="text-[11px] font-black text-amber-400 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-lg inline-block">
              Раздел Письмо Будут доступ 1 ноября 2026 год
            </div>
          </div>

          <div className="space-y-2">
            {cisLanguages.map(item => {
              const isTarget = selectedLang === item.code;
              return (
                <div
                  key={item.code}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    isTarget 
                      ? 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400/50' 
                      : isLightMode 
                        ? 'bg-white border-amber-200 shadow-sm' 
                        : 'bg-black/40 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="text-lg select-none shrink-0">{item.flagEmoji}</span>
                    <div className="min-w-0 text-left">
                      <div className="text-xs font-black text-amber-100 truncate">
                        🔒 {item.fullLabelRu || `${item.nameRu} — (${item.nativeName})`}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium">
                        {isRu ? 'Раздел Письмо Будут доступ 1 ноября 2026 год' : 'Section "Letters" available Nov 1, 2026'}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm shrink-0 ml-2">🔒</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Available Languages Reminder */}
        <div className={`p-3.5 rounded-2xl border text-xs font-medium mb-4 ${
          isLightMode ? 'bg-sky-50 border-sky-200 text-sky-900' : 'bg-sky-950/30 border-sky-500/30 text-sky-200'
        }`}>
          <span className="font-black text-sky-400 uppercase tracking-wider block mb-1.5 text-[11px]">
            ✨ {isRu ? 'Сейчас доступны для переключения:' : 'Currently available to switch:'}
          </span>
          <div className="flex flex-wrap gap-1.5 font-bold">
            {AVAILABLE_SWITCH_LANGUAGES.map(lang => (
              <span 
                key={lang.code}
                className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px]"
              >
                {lang.label}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons: Feedback + ПОНЯТНО 🔒 */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {onOpenFeedback && (
            <button
              type="button"
              onClick={() => {
                playSound('click');
                onClose();
                onOpenFeedback();
              }}
              className="w-full sm:w-1/2 py-3 bg-gray-800 hover:bg-gray-700 text-amber-300 font-bold rounded-2xl uppercase tracking-wider text-xs border border-amber-500/40 shadow transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <span>💬</span>
              <span>{isRu ? 'Отзывы о языках' : 'Language Reviews'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className={`w-full ${onOpenFeedback ? 'sm:w-1/2' : ''} py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black rounded-2xl uppercase tracking-wider text-xs shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-2`}
          >
            <span>{isRu ? 'ПОНЯТНО' : 'GOT IT'}</span>
            <span className="text-sm">🔒</span>
          </button>
        </div>
      </div>
    </div>
  );
};
