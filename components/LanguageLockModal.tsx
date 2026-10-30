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
            <Mascot emotion="thinking" className="w-24 h-24" />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black font-black text-xs px-2.5 py-0.5 rounded-full border-2 border-slate-900 shadow-md">
              🔒 1 нояб.
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full">
              {isRu ? 'В разработке • Доступно 1 ноября 2026 г.' : 'Under Development • Available Nov 1, 2026'}
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 rounded-full">
              {isRu ? '15 языков • 🔒 1 нояб. 2026' : '15 Languages • 🔒 Nov 1, 2026'}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black mb-1.5 leading-snug">
            {isRu 
              ? 'Переключение на эти языки и раздел «Письмо» откроются 1 ноября 2026 года' 
              : 'Language switching and the "Letters" section will open November 1, 2026'}
          </h3>

          <p className={`text-xs sm:text-sm font-medium max-w-lg ${isLightMode ? 'text-gray-600' : 'text-gray-300'}`}>
            {isRu 
              ? 'Команда DuoWindo6601 готовит 15 языков, озвучку носителей речи, шрифты и упражнения прописей букв. До официального релиза осталось совсем немного!' 
              : '15 languages, native audio, custom fonts and writing exercises are actively being finalized for release!'}
          </p>
        </div>

        {/* Selected Language Alert if triggered by a specific click */}
        {currentLocked && (
          <div className="p-3.5 rounded-2xl bg-amber-950/50 border-2 border-amber-500/50 text-amber-200 mb-4 flex items-center justify-between text-left">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{currentLocked.flagEmoji}</span>
              <div>
                <div className="text-xs font-black text-amber-300 uppercase">
                  {currentLocked.nameRu} ({currentLocked.nativeName})
                </div>
                <div className="text-[11px] text-amber-200/90 font-medium">
                  {currentLocked.noteRu || 'Переключение на этот язык откроется 1 ноября 2026 года'}
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-amber-500 text-black font-black text-xs rounded-xl shrink-0">
              🔒 1 нояб.
            </span>
          </div>
        )}

        {/* Target Countdown Banner */}
        <div className={`p-3.5 sm:p-4 rounded-2xl border mb-5 flex items-center justify-between ${
          isLightMode 
            ? 'bg-amber-50 border-amber-300 text-amber-950' 
            : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
        }`}>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">⏳</span>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                {isRu ? 'Обратный отсчёт до открытия:' : 'Countdown to Unlock:'}
              </div>
              <div className="text-sm sm:text-base font-black text-white">
                {isRu 
                  ? `До 1 ноября 2026 г. осталось: ${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}` 
                  : `${daysLeft} days remaining until November 1, 2026`}
              </div>
            </div>
          </div>
          <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-amber-500 text-black shadow font-mono">
            01.11.2026
          </span>
        </div>

        {/* Section 1: 🌍 Языки мира (10): 🔒 1 нояб. 2026 */}
        <div className="mb-5 text-left space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span>🌍</span>
              <span>{isRu ? 'Языки мира (10):' : 'World Languages (10):'}</span>
            </h4>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
              🔒 1 нояб. 2026
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {worldLanguages.map(lang => (
              <div
                key={lang.code}
                className="p-2.5 rounded-2xl border border-amber-500/30 bg-amber-950/20 text-gray-300 flex flex-col justify-between space-y-1 hover:border-amber-400/60 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{lang.flagEmoji}</span>
                  <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                    🔒 1 нояб.
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

        {/* Section 2: 🏛️ Заблокированные языки мира (Раздел Письмо Будут доступ 1 ноября 2026 год) */}
        <div className="mb-6 text-left space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <span>🏛️</span>
              <span>{isRu ? 'Заблокированные языки мира (Раздел Письмо Будут доступ 1 ноября 2026 год):' : 'Locked Languages (Letters section until Nov 1, 2026):'}</span>
            </h4>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40">
              5 языков
            </span>
          </div>

          <div className="space-y-1.5">
            {cisLanguages.map(lang => (
              <div
                key={lang.code}
                className="p-3 rounded-2xl border border-rose-500/30 bg-rose-950/20 text-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-rose-400/60 transition-all"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="text-2xl shrink-0">{lang.flagEmoji}</span>
                  <div className="min-w-0">
                    <div className="font-black text-xs sm:text-sm text-white truncate">
                      🔒 {lang.fullLabelRu || lang.nameRu}
                    </div>
                    <div className="text-[11px] text-rose-300/90 font-bold">
                      {lang.noteRu || 'Раздел Письмо Будут доступ 1 ноября 2026 год'}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider shrink-0 self-start sm:self-center">
                  🔒 1 нояб.
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Currently Available Summary Bar */}
        <div className="p-3 rounded-2xl bg-gray-800/80 border border-gray-700/80 mb-5 text-left flex items-center justify-between text-xs font-bold text-gray-300">
          <div className="flex items-center space-x-2">
            <span>✨</span>
            <span>{isRu ? 'Сейчас доступны для переключения (8):' : 'Available now (8):'}</span>
            <span className="text-emerald-400 font-black">RU, EN, DE, FR, ES, JA, ZH, AR</span>
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
              className="w-full sm:w-1/2 py-3.5 bg-gray-800 hover:bg-gray-700 text-amber-300 font-bold rounded-2xl uppercase tracking-wider text-xs border border-amber-500/40 shadow transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-1.5"
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
            className={`w-full ${onOpenFeedback ? 'sm:w-1/2' : ''} py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl uppercase tracking-wider text-xs shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-2`}
          >
            <span>{isRu ? 'ПОНЯТНО (ЖДЁМ 1 НОЯБРЯ 2026 Г.)' : 'UNDERSTOOD (WAITING FOR NOV 1, 2026)'}</span>
            <span className="text-sm">🔒</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageLockModal;
