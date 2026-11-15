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
    <div className="fixed inset-0 z-[260] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-2xl rounded-3xl p-5 sm:p-6 shadow-2xl border-2 flex flex-col relative animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto no-scrollbar ${
          isLightMode 
            ? 'bg-white border-amber-400 text-slate-800' 
            : 'bg-[#182329] border-amber-500/60 text-white'
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
              : 'bg-gray-800 hover:bg-gray-750 text-gray-300 hover:text-white'
          }`}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Mascot & Header */}
        <div className="flex flex-col items-center text-center mt-2 mb-4">
          <div className="relative mb-3">
            <Mascot emotion="happy" className="w-24 h-24" />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black font-black text-xs px-2.5 py-0.5 rounded-full border-2 border-slate-900 shadow-md">
              ✅ 1 нояб.
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
              {isRu ? '✅ Открыто 1 ноября 2026 г.' : '✅ Unlocked Nov 1, 2026'}
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-teal-300 bg-teal-500/15 border border-teal-500/30 px-2.5 py-1 rounded-full">
              {isRu ? '15 языков • Доступно' : '15 Languages • Unlocked'}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black mb-1.5 leading-snug text-emerald-300">
            {isRu 
              ? '🎉 Переключение на эти языки и раздел «Письмо» открыты!' 
              : '🎉 Language switching and the "Letters" section are now open!'}
          </h3>

          <p className={`text-xs sm:text-sm font-medium max-w-lg ${isLightMode ? 'text-gray-600' : 'text-gray-300'}`}>
            {isRu 
              ? 'Сегодня 1 ноября 2026 года! Все 15 языков, озвучка носителей речи, шрифты и раздел «Письмо» теперь официально открыты для всех пользователей DuoWindo6601.' 
              : 'Today is November 1, 2026! All 15 languages, audio, fonts and "Letters" section are officially open for everyone.'}
          </p>
        </div>

        {/* Selected Language Alert if triggered by a specific click */}
        {currentLocked && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/50 border-2 border-emerald-500/50 text-emerald-200 mb-4 flex items-center justify-between text-left">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{currentLocked.flagEmoji}</span>
              <div>
                <div className="text-xs font-black text-emerald-300 uppercase">
                  {currentLocked.nameRu} ({currentLocked.nativeName})
                </div>
                <div className="text-[11px] text-emerald-200/90 font-medium">
                  {isRu ? '✅ Язык и раздел «Письмо» открыты с 1 ноября 2026 года!' : '✅ Language and Letters section unlocked as of Nov 1, 2026!'}
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500 text-black font-black text-xs rounded-xl shrink-0">
              ✅ Открыт
            </span>
          </div>
        )}

        {/* Target Countdown Banner */}
        <div className={`p-3.5 sm:p-4 rounded-2xl border mb-5 flex items-center justify-between ${
          isLightMode 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
            : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
        }`}>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🎉</span>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                {isRu ? 'Статус открытия:' : 'Unlock Status:'}
              </div>
              <div className="text-sm sm:text-base font-black text-white">
                {isRu 
                  ? '1 ноября 2026 г. наступило! Доступ разблокирован' 
                  : 'November 1, 2026 arrived! Access unlocked'}
              </div>
            </div>
          </div>
          <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-emerald-500 text-black shadow font-mono">
            01.11.2026 ✅
          </span>
        </div>

        {/* Section 1: 🌍 Языки мира (10) */}
        <div className="mb-5 text-left space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span>🌍</span>
              <span>{isRu ? 'Языки мира (10) — Открыты с 1 ноября 2026:' : 'World Languages (10) — Open Nov 1, 2026:'}</span>
            </h4>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              ✅ 1 нояб. 2026
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {worldLanguages.map(lang => (
              <div
                key={lang.code}
                className="p-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 text-gray-300 flex flex-col justify-between space-y-1 hover:border-emerald-400/60 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{lang.flagEmoji}</span>
                  <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                    ✅ Открыт
                  </span>
                </div>
                <div>
                  <div className="font-extrabold text-xs text-white truncate">{lang.nameRu}</div>
                  <div className="text-[10px] text-gray-400 truncate">{lang.nativeName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: 🏛️ Языки мира и стран СНГ */}
        <div className="mb-6 text-left space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <span>🏛️</span>
              <span>{isRu ? 'Языки мира и стран СНГ (Раздел «Письмо» открыт 1 ноября 2026 год):' : 'World & CIS Languages (Letters section open Nov 1, 2026):'}</span>
            </h4>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/40">
              5 языков
            </span>
          </div>

          <div className="space-y-1.5">
            {cisLanguages.map(lang => (
              <div
                key={lang.code}
                className="p-3 rounded-2xl border border-teal-500/30 bg-teal-950/20 text-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-teal-400/60 transition-all"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="text-2xl shrink-0">{lang.flagEmoji}</span>
                  <div className="min-w-0">
                    <div className="font-black text-xs sm:text-sm text-white truncate">
                      ✨ {lang.fullLabelRu || lang.nameRu}
                    </div>
                    <div className="text-[11px] text-teal-300/90 font-bold">
                      {isRu ? '✅ Раздел «Письмо» открыт 1 ноября 2026 год' : '✅ Section "Letters" is open as of Nov 1, 2026'}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-black uppercase tracking-wider shrink-0 self-start sm:self-center">
                  ✅ 1 нояб.
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Currently Available Summary Bar */}
        <div className="p-3 rounded-2xl bg-gray-800/80 border border-gray-700/80 mb-5 text-left flex items-center justify-between text-xs font-bold text-gray-300">
          <div className="flex items-center space-x-2">
            <span>✨</span>
            <span>{isRu ? 'Все 23+ языка доступны для мгновенного переключения и изучения!' : 'All 23+ languages available for switching and learning!'}</span>
          </div>
          <span className="text-emerald-400 font-black">✓ Открыты</span>
        </div>

        {/* Action Buttons: Feedback + ПОНЯТНО */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {onOpenFeedback && (
            <button
              type="button"
              onClick={() => {
                playSound('click');
                onClose();
                onOpenFeedback();
              }}
              className="w-full sm:w-1/2 py-3.5 bg-gray-800 hover:bg-gray-700 text-emerald-300 font-bold rounded-2xl uppercase tracking-wider text-xs border border-emerald-500/40 shadow transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-1.5"
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
            className={`w-full ${onOpenFeedback ? 'sm:w-1/2' : ''} py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl uppercase tracking-wider text-xs shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-2`}
          >
            <span>{isRu ? 'ОТЛИЧНО • ИЗУЧАТЬ И ПЕРЕКЛЮЧАТЬ 🎉' : 'EXCELLENT • LEARN & SWITCH 🎉'}</span>
            <span className="text-sm">✨</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageLockModal;
