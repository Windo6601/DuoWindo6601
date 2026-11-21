import React from 'react';
import { HeadphonesRadioIcon } from './Icons';

interface DuoWindo6601RadioButtonProps {
  onClick: () => void;
  language?: string;
  isLightMode?: boolean;
  completedCount?: number;
  totalCount?: number;
}

export const DuoWindo6601RadioButton: React.FC<DuoWindo6601RadioButtonProps> = ({
  onClick,
  language = 'ru',
  isLightMode = false,
  completedCount = 0,
  totalCount = 3
}) => {
  const isRu = language !== 'en';
  const hasCompletedAny = completedCount > 0;

  return (
    <div className="flex flex-col items-center relative group my-2">
      {/* Floating Duolingo-style Callout Bubble */}
      <div
        className={`mb-3 px-3.5 py-1.5 rounded-2xl text-[11px] font-black tracking-wide uppercase shadow-lg border transition-transform group-hover:-translate-y-0.5 flex items-center gap-1.5 ${
          isLightMode
            ? 'bg-white text-sky-700 border-sky-200'
            : 'bg-[#1a2c35] text-sky-300 border-sky-500/40'
        }`}
      >
        <span className="inline-block w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
        <span>DuoWindo6601Radio</span>
        {hasCompletedAny && (
          <span className="text-[10px] font-black text-emerald-400 ml-1">
            {completedCount}/{totalCount}
          </span>
        )}
        <span
          className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-r border-b ${
            isLightMode ? 'bg-white border-sky-200' : 'bg-[#1a2c35] border-sky-500/40'
          }`}
        />
      </div>

      {/* Glossy 3D Sky-Blue Cylindrical Duolingo Radio Node Button */}
      <button
        type="button"
        onClick={onClick}
        aria-label={isRu ? 'Открыть подкаст DuoWindo6601Radio' : 'Open DuoWindo6601Radio Podcast'}
        title={isRu ? 'DuoWindo6601Radio — урок на аудирование (подкаст)' : 'DuoWindo6601Radio — Podcast listening lesson'}
        className="relative w-28 h-28 rounded-full bg-gradient-to-b from-[#66DBFF] to-[#42C6FA] border-b-[10px] border-[#2C8EC7] active:translate-y-2 active:border-b-0 transition-all flex items-center justify-center shadow-[0_14px_30px_rgba(44,142,199,0.45)] hover:brightness-105 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300"
      >
        {/* Diagonal glossy sheen stripes matching the DuoRadio disc */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-6 -left-4 w-8 h-44 bg-white/25 rotate-[36deg] rounded-full"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-2 left-10 w-5 h-44 bg-white/18 rotate-[36deg] rounded-full"
        />

        {/* Headphones Icon */}
        <HeadphonesRadioIcon className="relative z-10 w-16 h-16 drop-shadow-[0_2px_4px_rgba(24,104,150,0.3)] group-hover:scale-110 transition-transform duration-200" />
      </button>

      {/* Clean sub-caption below button */}
      <span
        className={`mt-2.5 text-xs font-black tracking-wide ${
          isLightMode ? 'text-slate-600' : 'text-sky-200/90'
        }`}
      >
        {isRu ? 'Аудирование • Подкаст' : 'Listening • Podcast'}
      </span>
    </div>
  );
};
