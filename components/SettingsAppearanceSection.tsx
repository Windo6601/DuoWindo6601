import React, { useState } from 'react';
import { UserProgress, TextSizeType, AppFontFamily, AppThemeType } from '../types';
import { StreakSaverCountdown } from './StreakSaverCountdown';
import { NotificationManager } from './NotificationManager';
import { LanguageLockModal } from './LanguageLockModal';
import { getLanguageLockedToastMessage } from '../services/languageLockService';
import { canUserAccessFishModel } from '../services/fishAudioConfig';
import { 
  getDomainSimMode, 
  setDomainSimMode, 
  DomainSimMode, 
  NEW_OFFICIAL_DOMAIN, 
  NEW_OFFICIAL_URL, 
  AI_STUDIO_URL, 
  getTimeUntilRunAppClosure, 
  formatTimeUntilClosure, 
  isRunAppHost,
  isRunAppContinuedRiskAccepted,
  setRunAppContinuedRiskAccepted
} from '../services/domainMigrationService';

interface SettingsAppearanceSectionProps {
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  setToast: (msg: string | null) => void;
  playSound: (sound: any) => void;
  isLightMode: boolean;
  STORAGE_KEY: string;
}

export const SettingsAppearanceSection: React.FC<SettingsAppearanceSectionProps> = ({
  user,
  setUser,
  setToast,
  playSound,
  isLightMode,
  STORAGE_KEY,
}) => {
  const [showLockModal, setShowLockModal] = useState<boolean>(false);
  const [lockedLang, setLockedLang] = useState<string | null>(null);
  const [simMode, setSimModeState] = useState<DomainSimMode>(() => getDomainSimMode());
  const [copiedDomain, setCopiedDomain] = useState<boolean>(false);
  const [continuedRisk, setContinuedRisk] = useState<boolean>(() => isRunAppContinuedRiskAccepted());

  const currentSize: TextSizeType = user.textSize || 'normal';
  const currentFont: AppFontFamily = user.fontFamily || 'din';
  const currentTheme: AppThemeType = user.theme || (user.nightMode === false ? 'light' : 'dark');

  const isRu = user.language !== 'en';

  const handleSetSize = (size: TextSizeType) => {
    playSound('click');
    const labelsRu: Record<TextSizeType, string> = {
      small: 'Уменьшенный (85%)',
      normal: 'Стандартный (100%)',
      large: 'Увеличенный (115%)',
      huge: 'Крупный (130%)',
    };
    const labelsEn: Record<TextSizeType, string> = {
      small: 'Compact (85%)',
      normal: 'Standard (100%)',
      large: 'Large (115%)',
      huge: 'Extra Large (130%)',
    };

    setUser(prev => {
      const updated: UserProgress = { ...prev, textSize: size };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    document.documentElement.setAttribute('data-text-size', size);
    setToast(isRu ? `📏 Размер текста: ${labelsRu[size]}` : `📏 Text size: ${labelsEn[size]}`);
  };

  const handleSetFont = (font: AppFontFamily) => {
    playSound('select');
    const fontNamesRu: Record<AppFontFamily, string> = {
      din: 'Duo Rounded (Фирменный)',
      sans: 'Modern Sans (Гротеск)',
      serif: 'Classic Serif (С засечками)',
      dyslexic: 'Легкочитаемый (Lexend)',
      mono: 'Моноширинный (Код)',
      playful: 'Игровой (Мультяшный)',
    };
    const fontNamesEn: Record<AppFontFamily, string> = {
      din: 'Duo Rounded (Default)',
      sans: 'Modern Sans (Clean)',
      serif: 'Classic Serif (Book)',
      dyslexic: 'Readable (Lexend)',
      mono: 'Monospace (Code)',
      playful: 'Playful (Comic)',
    };

    setUser(prev => {
      const updated: UserProgress = { ...prev, fontFamily: font };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    document.documentElement.setAttribute('data-font', font);
    document.body.setAttribute('data-font', font);
    setToast(isRu ? `🔤 Шрифт: ${fontNamesRu[font]}` : `🔤 Font: ${fontNamesEn[font]}`);
  };

  const handleSetTheme = (theme: AppThemeType) => {
    playSound('click');
    const themeNamesRu: Record<AppThemeType, string> = {
      light: '☀️ Светлая тема',
      dark: '🌙 Тёмная тема',
      midnight: '🌌 Полночь (AMOLED Black)',
      emerald: '🌿 Изумрудная Duo',
      system: '💻 Системная тема',
    };
    const themeNamesEn: Record<AppThemeType, string> = {
      light: '☀️ Light Theme',
      dark: '🌙 Dark Theme',
      midnight: '🌌 Midnight (AMOLED Black)',
      emerald: '🌿 Emerald Duo',
      system: '💻 System Theme',
    };

    const isNight = theme !== 'light';

    setUser(prev => {
      const updated: UserProgress = {
        ...prev,
        theme,
        nightMode: isNight,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setToast(isRu ? themeNamesRu[theme] : themeNamesEn[theme]);
  };

  const textSizes: { id: TextSizeType; labelRu: string; labelEn: string; icon: string; percent: string }[] = [
    { id: 'small', labelRu: 'Уменьшенный', labelEn: 'Compact', icon: 'A⁻', percent: '85%' },
    { id: 'normal', labelRu: 'Стандартный', labelEn: 'Standard', icon: 'A', percent: '100%' },
    { id: 'large', labelRu: 'Увеличенный', labelEn: 'Large', icon: 'A⁺', percent: '115%' },
    { id: 'huge', labelRu: 'Крупный', labelEn: 'Huge', icon: 'A⁺⁺', percent: '130%' },
  ];

  const themes: {
    id: AppThemeType;
    nameRu: string;
    nameEn: string;
    descRu: string;
    descEn: string;
    icon: string;
    bgPreview: string;
    cardPreview: string;
    accentPreview: string;
  }[] = [
    {
      id: 'light',
      nameRu: 'Светлая',
      nameEn: 'Light',
      descRu: 'Классический дневной режим с высокой контрастностью',
      descEn: 'Clean high-contrast daylight interface',
      icon: '☀️',
      bgPreview: 'bg-[#F0F2F5]',
      cardPreview: 'bg-white border-slate-300',
      accentPreview: 'bg-[#1CB0F6]',
    },
    {
      id: 'dark',
      nameRu: 'Тёмная',
      nameEn: 'Dark',
      descRu: 'Фирменный глубокий тёмный стиль DuoWindo6601',
      descEn: 'Signature deep night mode of DuoWindo6601',
      icon: '🌙',
      bgPreview: 'bg-[#131F24]',
      cardPreview: 'bg-[#202F36] border-gray-700',
      accentPreview: 'bg-[#58CC02]',
    },
    {
      id: 'midnight',
      nameRu: 'Полночь AMOLED',
      nameEn: 'Midnight AMOLED',
      descRu: 'Истинный глубокий черный (#000000) для экономии батареи',
      descEn: 'Pure black (#000000) for OLED panels & battery saver',
      icon: '🌌',
      bgPreview: 'bg-black',
      cardPreview: 'bg-[#080b0f] border-slate-800',
      accentPreview: 'bg-[#a855f7]',
    },
    {
      id: 'emerald',
      nameRu: 'Изумруд Duo',
      nameEn: 'Emerald Duo',
      descRu: 'Сочный лесной стиль с зелеными оттенками совёнка Duo',
      descEn: 'Vibrant Duo forest styling with lush green tones',
      icon: '🌿',
      bgPreview: 'bg-[#051e16]',
      cardPreview: 'bg-[#0a2d21] border-emerald-700',
      accentPreview: 'bg-[#58CC02]',
    },
    {
      id: 'system',
      nameRu: 'Системная',
      nameEn: 'System',
      descRu: 'Автоматическое переключение согласно настройкам устройства',
      descEn: 'Automatically syncs with OS & device preferences',
      icon: '💻',
      bgPreview: 'bg-gradient-to-r from-slate-200 to-slate-900',
      cardPreview: 'bg-slate-800 border-slate-600',
      accentPreview: 'bg-sky-400',
    },
  ];

  const fonts: {
    id: AppFontFamily;
    nameRu: string;
    nameEn: string;
    badgeRu: string;
    badgeEn: string;
    fontClass: string;
    previewAlphabet: string;
    descRu: string;
    descEn: string;
  }[] = [
    {
      id: 'din',
      nameRu: 'Duo Rounded',
      nameEn: 'Duo Rounded',
      badgeRu: 'Фирменный',
      badgeEn: 'Default',
      fontClass: 'font-pref-din',
      previewAlphabet: 'Aa Bb Cc Dd 123 • DuoWindo',
      descRu: 'Оригинальный дружелюбный округлый шрифт Duolingo (DIN Next / Nunito)',
      descEn: 'Signature friendly rounded typeface used across Duolingo',
    },
    {
      id: 'sans',
      nameRu: 'Modern Sans',
      nameEn: 'Modern Sans',
      badgeRu: 'Четкий',
      badgeEn: 'Clean',
      fontClass: 'font-pref-sans',
      previewAlphabet: 'Aa Bb Cc Dd 123 • Rubik & Alexandria',
      descRu: 'Современный гротеск с четкими линиями и идеальной геометрией (Rubik)',
      descEn: 'Modern clean grotesque with sharp legibility and balanced proportions',
    },
    {
      id: 'serif',
      nameRu: 'Classic Serif',
      nameEn: 'Classic Serif',
      badgeRu: 'Книжный',
      badgeEn: 'Book',
      fontClass: 'font-pref-serif',
      previewAlphabet: 'Aa Bb Cc Dd 123 • Noto Serif & Amiri',
      descRu: 'Элегантный литературный шрифт с засечками для любителей книг',
      descEn: 'Elegant editorial serif for literature lovers and traditional reading',
    },
    {
      id: 'dyslexic',
      nameRu: 'Легкочитаемый (Lexend)',
      nameEn: 'Readable (Lexend)',
      badgeRu: 'Доступность',
      badgeEn: 'Accessible',
      fontClass: 'font-pref-dyslexic',
      previewAlphabet: 'Aa Bb Cc Dd 123 • Lexend Readability',
      descRu: 'Специальный шрифт с расширенным трекингом для дислексии и быстрого чтения',
      descEn: 'Scientifically crafted font for dyslexia and increased reading speed',
    },
    {
      id: 'mono',
      nameRu: 'Моноширинный',
      nameEn: 'Monospace Code',
      badgeRu: 'Хакерский',
      badgeEn: 'Code',
      fontClass: 'font-pref-mono',
      previewAlphabet: 'Aa Bb Cc Dd 123 • const duo = true;',
      descRu: 'Фиксированная ширина символов для программистов и технических гиков',
      descEn: 'Fixed-width character grid inspired by code editors and terminals',
    },
    {
      id: 'playful',
      nameRu: 'Игровой / Playful',
      nameEn: 'Playful Comic',
      badgeRu: 'Мультяшный',
      badgeEn: 'Comic',
      fontClass: 'font-pref-playful',
      previewAlphabet: 'Aa Bb Cc Dd 123 • KuaiLe Fun',
      descRu: 'Яркий, задорный и энергичный стиль для веселого обучения (ZCOOL KuaiLe)',
      descEn: 'Fun, whimsical and energetic typeface for joyful casual learning',
    },
  ];

  return (
    <div className="space-y-6">
      {/* STREAK SAVER COUNTDOWN TIMER WIDGET */}
      <StreakSaverCountdown
        user={user}
        setUser={setUser}
        isLightMode={isLightMode}
        playSound={playSound}
        setToast={setToast}
      />

      {/* NOTIFICATIONS & REMINDERS MANAGER (PC & MOBILE) */}
      <NotificationManager
        user={user}
        setUser={setUser}
        isLightMode={isLightMode}
        playSound={playSound}
        setToast={setToast}
      />

      {/* 1. TEXT SIZE CONTROLS (РАЗМЕР ТЕКСТА) */}
      <div className="bg-duo-card border-2 border-indigo-500/50 rounded-3xl p-5 sm:p-6 shadow-xl text-left">
        <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl p-2.5 bg-indigo-950/60 rounded-2xl border border-indigo-500/40 text-indigo-300">
              📏
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white uppercase tracking-wider">
                  {isRu ? 'Размер текста интерфейса' : 'Interface Text Size'}
                </h3>
                <span className="bg-indigo-500/30 text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-indigo-500/50 uppercase">
                  Accessibility
                </span>
              </div>
              <p className="text-xs text-gray-300 font-medium mt-1">
                {isRu
                  ? 'Масштабирование шрифта приложения для комфортного чтения и доступности'
                  : 'Scale application font size for comfortable reading and accessibility'}
              </p>
            </div>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
            {textSizes.find(s => s.id === currentSize)?.percent || '100%'}
          </span>
        </div>

        {/* 4 SIZE BUTTONS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          {textSizes.map(item => {
            const isSelected = currentSize === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSetSize(item.id)}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg ring-2 ring-indigo-400/50'
                    : isLightMode
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                      : 'bg-black/40 hover:bg-black/60 border-gray-700 text-gray-300 hover:text-white'
                }`}
              >
                <div className="flex items-baseline space-x-1">
                  <span className={`font-black text-lg ${item.id === 'huge' ? 'scale-125' : item.id === 'large' ? 'scale-110' : item.id === 'small' ? 'scale-90' : ''}`}>
                    {item.icon}
                  </span>
                  <span className="text-[11px] font-bold opacity-75">({item.percent})</span>
                </div>
                <span className="text-xs font-bold truncate">
                  {isRu ? item.labelRu : item.labelEn}
                </span>
              </button>
            );
          })}
        </div>

        {/* LIVE TEXT PREVIEW BOX */}
        <div className="bg-black/30 border border-indigo-500/30 rounded-2xl p-4 transition-all">
          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300/80 uppercase tracking-wider mb-1.5">
            <span>👁️ {isRu ? 'Предпросмотр размера' : 'Size Live Preview'}</span>
            <span className="font-mono text-gray-400 font-normal">data-text-size="{currentSize}"</span>
          </div>
          <p className="text-white leading-relaxed font-medium">
            {isRu
              ? '🦉 DuoWindo6601: Учите языки каждый день, открывайте уроки, повторяйте грамматику и достигайте вершин!'
              : '🦉 DuoWindo6601: Practice languages every day, explore regional dialects, review grammar, and reach your goals!'}
          </p>
        </div>
      </div>

      {/* 1.5 BRUSH SIZE CONTROLS (ТОЛЩИНА КИСТИ ДЛЯ РАЗДЕЛА ПИСЬМА) */}
      <div className="bg-duo-card border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-6 shadow-xl text-left">
        <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl p-2.5 bg-emerald-950/60 rounded-2xl border border-emerald-500/40 text-emerald-300">
              🖌️
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white uppercase tracking-wider">
                  {isRu ? 'Размер кисти для раздела Письма' : 'Handwriting Brush Size'}
                </h3>
                <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-500/50 uppercase">
                  Writing
                </span>
              </div>
              <p className="text-xs text-gray-300 font-medium mt-1">
                {isRu
                  ? 'Настройка толщины линии пера/кисти для обводки букв, прописей и рисования (+ и -)'
                  : 'Adjust pen and brush thickness for tracing and drawing canvas (+ and - controls)'}
              </p>
            </div>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase font-mono">
            {user.handwritingBrushSize || 14} px
          </span>
        </div>

        {/* Plus / Minus Buttons with Live Visual Preview Circle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-emerald-500/30 mb-4">
          {/* Controls */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => {
                playSound('click');
                const newSize = Math.max(4, (user.handwritingBrushSize || 14) - 2);
                setUser(prev => {
                  const updated = { ...prev, handwritingBrushSize: newSize };
                  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
                  return updated;
                });
                setToast(isRu ? `🖌️ Толщина кисти: ${newSize}px` : `🖌️ Brush size: ${newSize}px`);
              }}
              className="w-12 h-12 rounded-2xl bg-gray-800 hover:bg-gray-700 text-white font-black text-2xl flex items-center justify-center border-b-4 border-gray-900 active:border-b-0 active:translate-y-1 transition-all cursor-pointer shadow-md"
              title="Уменьшить кисть (-)"
            >
              -
            </button>

            <div className="text-center px-4">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {user.handwritingBrushSize || 14} <span className="text-xs text-gray-400">px</span>
              </span>
              <span className="text-[10px] text-gray-400 block font-bold uppercase">
                {isRu ? 'Толщина пера' : 'Thickness'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                playSound('click');
                const newSize = Math.min(36, (user.handwritingBrushSize || 14) + 2);
                setUser(prev => {
                  const updated = { ...prev, handwritingBrushSize: newSize };
                  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
                  return updated;
                });
                setToast(isRu ? `🖌️ Толщина кисти: ${newSize}px` : `🖌️ Brush size: ${newSize}px`);
              }}
              className="w-12 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-2xl flex items-center justify-center border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all cursor-pointer shadow-md"
              title="Увеличить кисть (+)"
            >
              +
            </button>
          </div>

          {/* Live Brush Thickness Indicator Circle */}
          <div className="flex items-center space-x-3 bg-gray-900/90 px-4 py-3 rounded-2xl border border-gray-700">
            <span className="text-xs text-gray-400 font-bold uppercase">
              {isRu ? 'Предпросмотр кисти:' : 'Brush Preview:'}
            </span>
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-inner overflow-hidden">
              <div
                className="rounded-full bg-emerald-500 shadow-sm transition-all"
                style={{
                  width: `${user.handwritingBrushSize || 14}px`,
                  height: `${user.handwritingBrushSize || 14}px`
                }}
              />
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { size: 6, labelRu: 'Тонкая (6px)', labelEn: 'Fine (6px)', icon: '✏️' },
            { size: 12, labelRu: 'Стандартная (12px)', labelEn: 'Standard (12px)', icon: '🖊️' },
            { size: 18, labelRu: 'Толстая (18px)', labelEn: 'Thick (18px)', icon: '🖌️' },
            { size: 26, labelRu: 'Крупная (26px)', labelEn: 'Ultra (26px)', icon: '🖍️' }
          ].map(preset => {
            const isSelected = (user.handwritingBrushSize || 14) === preset.size;
            return (
              <button
                key={preset.size}
                type="button"
                onClick={() => {
                  playSound('select');
                  setUser(prev => {
                    const updated = { ...prev, handwritingBrushSize: preset.size };
                    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
                    return updated;
                  });
                  setToast(isRu ? `🖌️ Толщина кисти: ${preset.size}px` : `🖌️ Brush size: ${preset.size}px`);
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-1 ring-emerald-400'
                    : 'bg-black/40 text-gray-300 border-gray-700 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span>{preset.icon}</span>
                <span>{isRu ? preset.labelRu : preset.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. THEME SWITCHER (ТЕМА ОФОРМЛЕНИЯ) */}
      <div className="bg-duo-card border-2 border-indigo-500/50 rounded-3xl p-5 sm:p-6 shadow-xl text-left">
        <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl p-2.5 bg-indigo-950/60 rounded-2xl border border-indigo-500/40 text-indigo-300">
              🎨
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white uppercase tracking-wider">
                  {isRu ? 'Тема оформления' : 'Color Theme'}
                </h3>
                <span className="bg-indigo-500/30 text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-indigo-500/50 uppercase">
                  Palette
                </span>
              </div>
              <p className="text-xs text-gray-300 font-medium mt-1">
                {isRu
                  ? 'Выбор цветовой палитры: Светлая, Тёмная, Полночь (AMOLED Black), Изумруд Duo или Системная'
                  : 'Choose appearance mode: Light, Dark, Midnight AMOLED Black, Emerald Duo, or System'}
              </p>
            </div>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
            {themes.find(t => t.id === currentTheme)?.nameRu || 'Dark'}
          </span>
        </div>

        {/* QUICK 3-WAY THEME TOGGLE BAR */}
        <div className="bg-black/40 border border-indigo-500/30 p-2 rounded-2xl mb-4 flex items-center justify-between gap-2">
          {[
            { id: 'light' as const, labelRu: 'Светлая', labelEn: 'Light', icon: '☀️', colorClass: 'bg-amber-500 text-slate-900 border-amber-300' },
            { id: 'dark' as const, labelRu: 'Тёмная', labelEn: 'Dark', icon: '🌙', colorClass: 'bg-duo-green text-white border-green-400' },
            { id: 'midnight' as const, labelRu: 'Полночь', labelEn: 'Midnight', icon: '🌌', colorClass: 'bg-purple-600 text-white border-purple-400' },
          ].map((themeOption) => {
            const active = currentTheme === themeOption.id;
            return (
              <button
                key={themeOption.id}
                type="button"
                onClick={() => handleSetTheme(themeOption.id)}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95 ${
                  active
                    ? `${themeOption.colorClass} shadow-lg ring-2 ring-indigo-400/60 font-black`
                    : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-base sm:text-lg">{themeOption.icon}</span>
                <span>{isRu ? themeOption.labelRu : themeOption.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* 5 THEME CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {themes.map(item => {
            const isSelected = currentTheme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSetTheme(item.id)}
                className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between text-left cursor-pointer group active:scale-[0.98] ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-950/40 shadow-md ring-2 ring-indigo-400/50'
                    : isLightMode
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
                      : 'bg-black/40 hover:bg-black/60 border-gray-700 text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-black text-sm text-white group-hover:text-indigo-200 transition-colors">
                      {isRu ? item.nameRu : item.nameEn}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-500 text-white uppercase">
                      ✓ {isRu ? 'Активна' : 'Active'}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-gray-400 font-medium mb-3 line-clamp-2">
                  {isRu ? item.descRu : item.descEn}
                </p>

                {/* Color Swatch Preview */}
                <div className="flex items-center space-x-1.5 pt-1 border-t border-gray-700/50">
                  <div className={`w-5 h-5 rounded-full border border-gray-600 shadow-sm ${item.bgPreview}`} title="Background" />
                  <div className={`w-5 h-5 rounded-full border border-gray-600 shadow-sm ${item.cardPreview}`} title="Card" />
                  <div className={`w-5 h-5 rounded-full border border-gray-600 shadow-sm ${item.accentPreview}`} title="Accent" />
                  <span className="text-[10px] text-gray-400 font-mono ml-auto">
                    {item.id}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. FONT FAMILY SELECTOR (ШРИФТ ПРИЛОЖЕНИЯ) */}
      <div className="bg-duo-card border-2 border-indigo-500/50 rounded-3xl p-5 sm:p-6 shadow-xl text-left">
        <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl p-2.5 bg-indigo-950/60 rounded-2xl border border-indigo-500/40 text-indigo-300">
              🔤
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white uppercase tracking-wider">
                  {isRu ? 'Шрифт приложения' : 'App Font Family'}
                </h3>
                <span className="bg-indigo-500/30 text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-indigo-500/50 uppercase">
                  Typography
                </span>
              </div>
              <p className="text-xs text-gray-300 font-medium mt-1">
                {isRu
                  ? 'Выбор семейства шрифтов для интерфейса и уроков (включая легкочитаемый Lexend для дислексии)'
                  : 'Choose UI font family (including dyslexia-friendly Lexend, DIN Next, serif, and comic)'}
              </p>
            </div>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
            {fonts.find(f => f.id === currentFont)?.nameRu || 'Duo Rounded'}
          </span>
        </div>

        {/* 6 FONT OPTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {fonts.map(fontItem => {
            const isSelected = currentFont === fontItem.id;
            return (
              <button
                key={fontItem.id}
                type="button"
                onClick={() => handleSetFont(fontItem.id)}
                className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between text-left cursor-pointer group active:scale-[0.98] ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-950/40 shadow-md ring-2 ring-indigo-400/50'
                    : isLightMode
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
                      : 'bg-black/40 hover:bg-black/60 border-gray-700 text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-sm text-white group-hover:text-indigo-200">
                      {isRu ? fontItem.nameRu : fontItem.nameEn}
                    </span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                    isSelected
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}>
                    {isSelected ? (isRu ? '✓ Выбран' : '✓ Active') : (isRu ? fontItem.badgeRu : fontItem.badgeEn)}
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl bg-black/40 border border-gray-700/60 my-2 ${fontItem.fontClass}`}>
                  <div className="text-xs text-indigo-300 font-bold truncate">
                    {fontItem.previewAlphabet}
                  </div>
                  <div className="text-[11px] text-gray-300 mt-1 line-clamp-1">
                    {isRu ? 'Привет, Мир! Быстрая лиса прыгает.' : 'The quick brown fox jumps over the lazy dog.'}
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 font-medium">
                  {isRu ? fontItem.descRu : fontItem.descEn}
                </p>
              </button>
            );
          })}
        </div>

        {/* NATIVE SCRIPT FONTS CALLOUT */}
        <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-2xl p-3.5 flex items-start space-x-3 text-xs text-indigo-200/90 leading-relaxed">
          <span className="text-xl shrink-0">🌏</span>
          <div>
            <div className="font-extrabold text-white mb-0.5 uppercase tracking-wide text-[11px]">
              {isRu ? 'Поддержка шрифтов для Китайского, Японского и Арабского' : 'Native Chinese, Japanese & Arabic Script Support'}
            </div>
            <div>
              {isRu
                ? 'Для курсов и текстов на Китайском (Noto Sans SC, Ma Shan Zheng), Японском (Zen Maru Gothic, M PLUS Rounded 1c) и Арабском (Cairo, Noto Sans Arabic, Duo Rounded) языках подключаются профессиональные шрифты.'
                : 'Chinese (Noto Sans SC), Japanese (Zen Maru Gothic), and Arabic (Cairo, Noto Sans Arabic, Duo Rounded) render using high-fidelity typefaces.'}
          </div>
        </div>
      </div>
      </div>

      {/* VOICE PROVIDER SETTINGS SECTION (Fish Audio & Gemini AI Speech) */}
      <div className={`p-5 rounded-3xl border-2 transition-all text-left ${isLightMode ? 'bg-white border-slate-200 shadow-md' : 'bg-gray-850/80 border-gray-700/80 shadow-xl'}`}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <span className="text-2xl p-2.5 bg-cyan-950/60 rounded-2xl border border-cyan-500/40 text-cyan-300">
              🎙️
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white uppercase tracking-wider">
                  {isRu ? 'Озвучка и AI-Движок речи (TTS)' : 'Voice Provider & AI Speech (TTS)'}
                </h3>
                <span className="bg-cyan-500/30 text-cyan-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-cyan-500/50 uppercase">
                  Fish Audio + Gemini AI
                </span>
              </div>
              <p className="text-xs text-gray-300 font-medium mt-1">
                {isRu ? 'Выберите голосовой движок для синтеза речи и произношения слов' : 'Select TTS voice provider for speech synthesis and pronunciation'}
              </p>
            </div>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
            {user.voiceProvider === 'fish' || user.voiceProvider === 'fish-drama-3'
              ? `Fish Audio 🐋 (${
                  (user.fishModel === 'drama-3' || user.voiceProvider === 'fish-drama-3') ? 'Drama 3' :
                  user.fishModel === 's2.1-pro' ? 'S2.1 Pro' :
                  user.fishModel === 's2-pro' ? 'S2 Pro' :
                  'S2.1 Pro Free'
                })`
              : user.voiceProvider === 'google' ? 'Google'
              : user.voiceProvider === 'yandex' ? 'Yandex'
              : user.voiceProvider === 'system' ? 'System'
              : user.voiceProvider === 'sapi53' ? 'Microsoft SAPI 5.3'
              : 'Gemini AI 🤖'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Fish Audio (Default Free: S2.1 Pro Free) */}
          <button
            type="button"
            onClick={() => {
              playSound('select');
              setUser(prev => {
                const updated: UserProgress = {
                  ...prev,
                  voiceProvider: 'fish',
                  fishModel: prev.fishModel && prev.subscription !== 'free' ? prev.fishModel : 's2.1-pro-free',
                };
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
                return updated;
              });
              setToast(isRu ? '🐋 Голосовой провайдер: Fish Audio (S2.1 Pro Free — Бесплатно)' : '🐋 Voice Provider: Fish Audio (S2.1 Pro Free — Free)');
            }}
            className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer active:scale-95 ${
              user.voiceProvider === 'fish' || user.voiceProvider === 'fish-drama-3'
                ? 'bg-cyan-600/90 border-cyan-400 text-white shadow-lg ring-2 ring-cyan-400/50'
                : 'bg-black/40 hover:bg-black/60 border-gray-700 text-gray-200'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xl">🐋</span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                {isRu ? 'Бесплатно' : 'Free'}
              </span>
            </div>
            <div className="mt-2">
              <span className="font-extrabold text-xs block text-white">Fish Audio</span>
              <span className="text-[10px] text-cyan-200 block font-medium">S2.1 Pro Free</span>
            </div>
          </button>

          {/* Gemini AI Speech */}
          <button
            type="button"
            onClick={() => {
              playSound('select');
              setUser(prev => {
                const updated: UserProgress = { ...prev, voiceProvider: 'gemini' };
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
                return updated;
              });
              setToast(isRu ? '🤖 Голосовой провайдер: Gemini AI Speech' : '🤖 Voice Provider: Gemini AI Speech');
            }}
            className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer active:scale-95 ${
              user.voiceProvider === 'gemini' || !user.voiceProvider
                ? 'bg-purple-600/90 border-purple-400 text-white shadow-lg ring-2 ring-purple-400/50'
                : 'bg-black/40 hover:bg-black/60 border-gray-700 text-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🤖</span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40">Gemini</span>
            </div>
            <div className="mt-2">
              <span className="font-extrabold text-xs block text-white">Gemini AI Speech</span>
              <span className="text-[10px] text-purple-200 block font-medium">Google Generative AI</span>
            </div>
          </button>

          {/* Google Web Speech */}
          <button
            type="button"
            onClick={() => {
              playSound('select');
              setUser(prev => {
                const updated: UserProgress = { ...prev, voiceProvider: 'google' };
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
                return updated;
              });
              setToast(isRu ? '🌐 Голосовой провайдер: Google Speech' : '🌐 Voice Provider: Google Speech');
            }}
            className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer active:scale-95 ${
              user.voiceProvider === 'google'
                ? 'bg-blue-600/90 border-blue-400 text-white shadow-lg ring-2 ring-blue-400/50'
                : 'bg-black/40 hover:bg-black/60 border-gray-700 text-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🌐</span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/40">Web</span>
            </div>
            <div className="mt-2">
              <span className="font-extrabold text-xs block text-white">Google Speech</span>
              <span className="text-[10px] text-blue-200 block font-medium">Стандартный TTS</span>
            </div>
          </button>

          {/* Yandex Speech */}
          <button
            type="button"
            onClick={() => {
              playSound('select');
              setUser(prev => {
                const updated: UserProgress = { ...prev, voiceProvider: 'yandex' };
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
                return updated;
              });
              setToast(isRu ? '🔴 Голосовой провайдер: Yandex Speech' : '🔴 Voice Provider: Yandex Speech');
            }}
            className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer active:scale-95 ${
              user.voiceProvider === 'yandex'
                ? 'bg-red-600/90 border-red-400 text-white shadow-lg ring-2 ring-red-400/50'
                : 'bg-black/40 hover:bg-black/60 border-gray-700 text-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🔴</span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/40">Yandex</span>
            </div>
            <div className="mt-2">
              <span className="font-extrabold text-xs block text-white">Yandex Speech</span>
              <span className="text-[10px] text-red-200 block font-medium">Русский синтез</span>
            </div>
          </button>

          {/* System Speech */}
          <button
            type="button"
            onClick={() => {
              playSound('select');
              setUser(prev => {
                const updated: UserProgress = { ...prev, voiceProvider: 'system' };
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
                return updated;
              });
              setToast(isRu ? '🔊 Голосовой провайдер: Системный' : '🔊 Voice Provider: System');
            }}
            className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer active:scale-95 ${
              user.voiceProvider === 'system'
                ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-lg ring-2 ring-emerald-400/50'
                : 'bg-black/40 hover:bg-black/60 border-gray-700 text-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🔊</span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">Browser</span>
            </div>
            <div className="mt-2">
              <span className="font-extrabold text-xs block text-white">System Speech</span>
              <span className="text-[10px] text-emerald-200 block font-medium">Локальный движок</span>
            </div>
          </button>

          {/* Microsoft SAPI 5.3 + Windows AI */}
          <button
            type="button"
            onClick={() => {
              playSound('select');
              setUser(prev => {
                const updated: UserProgress = { ...prev, voiceProvider: 'sapi53' };
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
                return updated;
              });
              setToast(isRu ? '🪟 Microsoft SAPI 5.3 + Windows AI APIs' : '🪟 Microsoft SAPI 5.3 + Windows AI APIs');
            }}
            className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer active:scale-95 ${
              user.voiceProvider === 'sapi53'
                ? 'bg-blue-700/90 border-blue-400 text-white shadow-lg ring-2 ring-blue-400/50'
                : 'bg-black/40 hover:bg-black/60 border-gray-700 text-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🪟</span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/40">SAPI 5.3</span>
            </div>
            <div className="mt-2">
              <span className="font-extrabold text-xs block text-white">Microsoft SAPI 5.3</span>
              <span className="text-[10px] text-blue-200 block font-medium">+ Windows AI Speech</span>
            </div>
          </button>
        </div>

        {/* Fish Audio Model Selector (S2.1 Pro Free Бесплатно vs Drama 3 / S2.1 Pro / S2 Pro Платно) */}
        <div className="mt-4 pt-4 border-t border-gray-700/70">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-base">🐋</span>
              <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                {isRu ? 'Модели Fish Audio (SDK: fish-audio)' : 'Fish Audio Models (SDK: fish-audio)'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-300">
              {isRu ? 'Drama 3 → платно • S2.1 Pro Free → бесплатно' : 'Drama 3 → Paid • S2.1 Pro Free → Free'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 's2.1-pro-free', label: 'S2.1 Pro Free', icon: '🐋', paid: false, descRu: 'Бесплатная модель речи', descEn: 'Free neural speech' },
              { id: 'drama-3', label: 'Drama 3', icon: '🎭', paid: true, descRu: 'Выразительный голос (Платно)', descEn: 'Expressive Drama 3 (Paid)' },
              { id: 's2.1-pro', label: 'S2.1 Pro', icon: '✨', paid: true, descRu: 'Студийное качество (Платно)', descEn: 'Studio S2.1 Pro (Paid)' },
              { id: 's2-pro', label: 'S2 Pro', icon: '⚡', paid: true, descRu: 'Профессиональная S2 Pro (Платно)', descEn: 'Professional S2 Pro (Paid)' },
            ].map((m) => {
              const activeFishModel = user.voiceProvider === 'fish-drama-3' ? 'drama-3' : (user.fishModel || 's2.1-pro-free');
              const isSelected = (user.voiceProvider === 'fish' || user.voiceProvider === 'fish-drama-3') && activeFishModel === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    const access = canUserAccessFishModel(m.id, user);
                    if (!access.allowed) {
                      playSound('wrong');
                      setToast(
                        isRu
                          ? `💎 ${m.label} — платная модель Fish Audio (требуется подписка DuoWindo6601 Super или DuoWindo6601 Max). Бесплатно используйте S2.1 Pro Free!`
                          : `💎 ${m.label} is a paid Fish Audio model (DuoWindo6601 Super or DuoWindo6601 Max required). Use S2.1 Pro Free for free!`
                      );
                      return;
                    }
                    playSound('select');
                    setUser(prev => {
                      const updated: UserProgress = {
                        ...prev,
                        voiceProvider: 'fish',
                        fishModel: m.id,
                      };
                      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
                      return updated;
                    });
                    setToast(
                      isRu
                        ? `${m.icon} Fish Audio: выбрана модель ${m.label} (${m.paid ? 'Платно • Super/Max' : 'Бесплатно'})`
                        : `${m.icon} Fish Audio model: ${m.label} (${m.paid ? 'Paid' : 'Free'})`
                    );
                  }}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-cyan-700/80 border-cyan-400 text-white shadow-md ring-2 ring-cyan-400/40'
                      : m.paid && user.subscription === 'free'
                        ? 'bg-black/30 border-amber-500/30 text-gray-300 hover:bg-black/50'
                        : 'bg-black/40 border-gray-700 text-gray-200 hover:bg-black/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-lg">{m.icon}</span>
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                        m.paid
                          ? 'bg-amber-950/90 text-amber-300 border-amber-500/50'
                          : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                      }`}
                    >
                      {m.paid ? (isRu ? 'Платно' : 'Paid') : (isRu ? 'Бесплатно' : 'Free')}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <span className="font-extrabold text-xs block text-white">{m.label}</span>
                    <span className="text-[10px] text-gray-300 block font-medium leading-tight mt-0.5">
                      {isRu ? m.descRu : m.descEn}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. ARABIC COURSE FONT SWITCHER (Курс Арабского — Выбор шрифта) */}
      <div className="bg-duo-card border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-6 shadow-xl text-left">
        <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl p-2.5 bg-emerald-950/60 rounded-2xl border border-emerald-500/40 text-emerald-300">
              🇦🇪
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white uppercase tracking-wider">
                  {isRu ? 'Шрифт для курса Арабского языка' : 'Arabic Course Font'}
                </h3>
                <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-500/50 uppercase">
                  Google Fonts
                </span>
              </div>
              <p className="text-xs text-gray-300 font-medium mt-1">
                {isRu
                  ? 'Выбор гарнитуры для отображения арабского алфавита, уроков и текстов'
                  : 'Select typography style for Arabic script, lessons and alphabet'}
              </p>
            </div>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
            {user.arabicFontFamily === 'cairo' ? 'Cairo' : user.arabicFontFamily === 'noto' ? 'Noto Sans' : user.arabicFontFamily === 'alexandria' ? 'Alexandria' : 'Duo Rounded'}
          </span>
        </div>

        {/* 4 ARABIC FONT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              id: 'alexandria' as const,
              nameRu: 'Alexandria (Montserrat Twin)',
              nameEn: 'Alexandria (Montserrat Twin)',
              badgeRu: 'Google Font',
              badgeEn: 'Google Font',
              fontClass: 'font-arabic-alexandria',
              sample: 'مَرْحَبًا • Alexandria & Montserrat',
              descRu: 'Официальный арабский компаньон шрифта Montserrat в единой эстетике геометрического гротеска',
              descEn: 'Official geometric sans-serif Arabic twin companion font to Montserrat',
            },
            {
              id: 'duo' as const,
              nameRu: 'Duo Rounded',
              nameEn: 'Duo Rounded',
              badgeRu: 'Оригинал',
              badgeEn: 'Original',
              fontClass: 'font-arabic-duo',
              sample: 'مَرْحَبًا • Duo Rounded',
              descRu: 'Оригинальный дружелюбный округлый шрифт Duolingo (DIN Next / Nunito)',
              descEn: 'Original friendly rounded typeface of Duolingo (DIN Next / Nunito)',
            },
            {
              id: 'noto' as const,
              nameRu: 'Noto Sans Arabic',
              nameEn: 'Noto Sans Arabic',
              badgeRu: 'Google Font',
              badgeEn: 'Google Font',
              fontClass: 'font-arabic-noto',
              sample: 'مَرْحَبًا • Noto Sans Arabic',
              descRu: 'Современный и четкий каллиграфический шрифт от Google для цифровых экранов',
              descEn: 'Clean, highly accessible Arabic font created by Google',
            },
            {
              id: 'cairo' as const,
              nameRu: 'Cairo',
              nameEn: 'Cairo',
              badgeRu: 'Google Font',
              badgeEn: 'Google Font',
              fontClass: 'font-arabic-cairo',
              sample: 'مَرْحَبًا • Cairo Font',
              descRu: 'Популярный стильный геометрический арабский шрифт Cairo от Google',
              descEn: 'Expressive geometric Arabic font crafted for optimal reading',
            },
          ].map(arabicFontItem => {
            const isSelected = (user.arabicFontFamily || 'duo') === arabicFontItem.id;
            return (
              <button
                key={arabicFontItem.id}
                type="button"
                onClick={() => {
                  playSound('select');
                  const updatedUser = { ...user, arabicFontFamily: arabicFontItem.id };
                  setUser(updatedUser);
                  try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
                  } catch {}
                  document.documentElement.setAttribute('data-arabic-font', arabicFontItem.id);
                  document.body.setAttribute('data-arabic-font', arabicFontItem.id);
                  setToast(isRu ? `🇦🇪 Шрифт арабского: ${arabicFontItem.nameRu}` : `🇦🇪 Arabic Font: ${arabicFontItem.nameEn}`);
                }}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between text-left cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-950/60 border-emerald-400 text-white shadow-xl ring-2 ring-emerald-400/50'
                    : isLightMode
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                      : 'bg-black/40 hover:bg-black/60 border-gray-700 text-gray-300 hover:text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-white">
                      {isRu ? arabicFontItem.nameRu : arabicFontItem.nameEn}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-800 text-gray-400 border border-gray-700'
                    }`}>
                      {isSelected ? (isRu ? '✓ Выбран' : '✓ Active') : (isRu ? arabicFontItem.badgeRu : arabicFontItem.badgeEn)}
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl bg-black/50 border border-emerald-500/30 my-2 text-right ${arabicFontItem.fontClass}`}>
                    <div className="text-xl text-emerald-300 font-extrabold">
                      الْعَرَبِيَّة • مَرْحَبًا
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 font-sans text-left">
                      {arabicFontItem.sample}
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 font-medium mt-2">
                  {isRu ? arabicFontItem.descRu : arabicFontItem.descEn}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. COURSES FOR SPEAKERS OF (Курсы для тех, кто говорит по) */}
      <div className="bg-duo-card border-2 border-purple-500/50 rounded-3xl p-5 sm:p-6 shadow-xl text-left">
        <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl p-2.5 bg-purple-950/60 rounded-2xl border border-purple-500/40 text-purple-300">
              🗣️
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white uppercase tracking-wider">
                  {isRu ? 'Курсы для тех, кто говорит по...' : 'Courses for those who speak...'}
                </h3>
                <span className="bg-purple-500/30 text-purple-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-purple-500/50 uppercase">
                  Language
                </span>
              </div>
              <p className="text-xs text-gray-300 font-medium mt-1">
                {isRu
                  ? 'Выбор родного языка интерфейса, уроков, подсказок и разделов приложения'
                  : 'Select your native speaker language for lessons, interface, and explanations'}
              </p>
            </div>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
            {user.language?.toUpperCase() || 'RU'}
          </span>
        </div>

        {/* Available Switch Languages */}
        <div className="space-y-4">
          <div>
            <div className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>✨</span>
              <span>{isRu ? 'Сейчас доступны для переключения (8):' : 'Currently available for switching (8):'}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { code: 'ru', name: 'Русский', flag: '🇷🇺' },
                { code: 'en', name: 'English', flag: '🇺🇸' },
                { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
                { code: 'fr', name: 'Français', flag: '🇫🇷' },
                { code: 'es', name: 'Español', flag: '🇪🇸' },
                { code: 'ja', name: '日本語', flag: '🇯🇵' },
                { code: 'zh', name: '中文', flag: '🇨🇳' },
                { code: 'ar', name: 'العربية', flag: '🇸🇦' }
              ].map(avail => {
                const isSelected = (user.language || 'ru') === avail.code;
                return (
                  <button
                    key={avail.code}
                    type="button"
                    onClick={() => {
                      playSound('select');
                      const updatedUser = { ...user, language: avail.code as any };
                      setUser(updatedUser);
                      try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
                      } catch {}
                      setToast(isRu ? `🌐 Язык переключён: ${avail.name}` : `🌐 Language switched: ${avail.name}`);
                    }}
                    className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between text-left cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-purple-600 border-purple-400 text-white shadow-lg ring-2 ring-purple-400/50'
                        : isLightMode
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
                          : 'bg-black/40 hover:bg-black/60 border-gray-700 text-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{avail.flag}</span>
                      <span className="font-extrabold text-xs">{avail.name}</span>
                    </div>
                    {isSelected && <span className="text-[10px] font-black text-emerald-300">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unlocked World Languages */}
          <div>
            <div className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>🎉</span>
                <span>{isRu ? 'Языки мира (10) — Открыты с 1 ноября 2026:' : 'World languages (10) — Unlocked Nov 1, 2026:'}</span>
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ✅ Доступно с 1 нояб. 2026
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { code: 'pt', name: 'Português', flag: '🇧🇷' },
                { code: 'it', name: 'Italiano', flag: '🇮🇹' },
                { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
                { code: 'ko', name: '한국어', flag: '🇰🇷' },
                { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
                { code: 'pl', name: 'Polski', flag: '🇵🇱' },
                { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
                { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
                { code: 'th', name: 'ไทย', flag: '🇹🇭' },
                { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' }
              ].map(item => {
                const isSelected = user.language === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      playSound('select');
                      setUser({ ...user, language: item.code as any });
                      setToast(isRu ? `✅ Язык переключен: ${item.name}` : `Language switched: ${item.name}`);
                    }}
                    className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-950/60 text-white ring-2 ring-emerald-500/40 shadow-lg'
                        : 'border-emerald-500/30 bg-emerald-950/20 text-gray-300 hover:text-emerald-200 hover:border-emerald-500/60'
                    }`}
                    title={`${item.name} — ✅ Доступно с 1 ноября 2026 г.`}
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className="text-base">{item.flag}</span>
                      <span className="font-bold text-[11px] truncate">{item.name}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1 py-0.2 rounded font-black shrink-0">
                      {isSelected ? '✓' : '✅'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CIS / World Languages with Letters Section Unlocked */}
          <div>
            <div className="text-xs font-extrabold text-teal-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>🏛️</span>
                <span>{isRu ? 'Языки мира и стран СНГ (5) — Раздел «Письмо» открыт с 1 ноября 2026:' : 'World & CIS languages (5) — Letters section open Nov 1, 2026:'}</span>
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
                ✅ 5 языков открыты
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { code: 'kk', fullLabel: 'Казахстан (Қазақша) — Казахстан (казахский) 🇰🇿', flag: '🇰🇿' },
                { code: 'uz', fullLabel: 'Узбекистан (Oʻzbekcha) — Узбекистан (узбекский) 🇺🇿', flag: '🇺🇿' },
                { code: 'hy', fullLabel: 'Армения (Հայերեն) — Армения (армянский) 🇦🇲', flag: '🇦🇲' },
                { code: 'ka', fullLabel: 'Грузия (ქართული) — Грузия (грузинский) 🇬🇪', flag: '🇬🇪' },
                { code: 'az', fullLabel: 'Азербайджан (Azərbaycan) — Азербайджан (азербайджанский) 🇦🇿', flag: '🇦🇿' }
              ].map(cis => {
                const isSelected = user.language === cis.code;
                return (
                  <button
                    key={cis.code}
                    type="button"
                    onClick={() => {
                      playSound('select');
                      setUser({ ...user, language: cis.code as any });
                      setToast(isRu ? `✅ Язык переключен: ${cis.fullLabel}` : `Language switched: ${cis.code}`);
                    }}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer text-[11px] font-bold active:scale-95 ${
                      isSelected
                        ? 'border-teal-400 bg-teal-950/60 text-white ring-2 ring-teal-500/40 shadow-lg'
                        : 'border-teal-500/30 bg-teal-950/20 text-gray-200 hover:text-teal-200 hover:border-teal-500/60'
                    }`}
                    title={`${cis.fullLabel} — ✅ Раздел «Письмо» открыт 1 ноября 2026 год`}
                  >
                    <span className="truncate pr-1">{cis.fullLabel}</span>
                    <span className="shrink-0 text-[10px] bg-teal-500/30 text-teal-300 border border-teal-500/40 px-1.5 py-0.5 rounded font-black">
                      {isSelected ? '✓ АКТИВЕН' : '✅ Открыт'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* DOMAIN MIGRATION & US-EAST1.RUN.APP RESTRICTION SECTION */}
      <div className={`p-6 rounded-[2.5rem] border-2 shadow-xl ${
        isLightMode 
          ? 'bg-white border-slate-200' 
          : 'bg-duo-card border-gray-800'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-xl font-black">
              🌐
            </div>
            <div>
              <h3 className={`font-black text-base uppercase tracking-wider ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                {isRu ? 'Адреса и ограничение us-east1.run.app' : 'Domains & us-east1.run.app Restriction'}
              </h3>
              <p className="text-xs text-amber-400 font-bold">
                {isRu ? '1 ноября 2026 год: прекращение работы us-east1.run.app ➔ Переход на ai.studio' : 'Nov 1, 2026: us-east1.run.app shutdown ➔ Migrated to ai.studio'}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
            🔒 1 нояб. 2026
          </span>
        </div>

        {/* Current status display */}
        <div className="space-y-3 mb-5">
          <div className="p-4 rounded-2xl bg-[#0e1017] border border-gray-800 text-xs sm:text-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-400 flex items-center gap-1.5">
                <span>🛑</span>
                <span className="font-mono text-gray-300">us-east1.run.app</span>
              </span>
              <span className="text-red-400 font-black text-[11px] bg-red-950/80 px-2.5 py-0.5 rounded border border-red-500/30 uppercase">
                {isRu ? 'Прекращение 1 ноября 2026 г.' : 'Closed Nov 1, 2026'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-400 flex items-center gap-1.5">
                <span>🚀</span>
                <span className="font-mono text-emerald-400 font-black">{NEW_OFFICIAL_DOMAIN}</span>
              </span>
              <span className="text-emerald-300 font-black text-[11px] bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/30 uppercase">
                {isRu ? 'Официальный доступ' : 'Active Domain'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-400 flex items-center gap-1.5">
                <span>🌐</span>
                <span className="font-mono text-sky-400 font-black">ai.studio</span>
              </span>
              <span className="text-sky-300 font-black text-[11px] bg-sky-950/80 px-2.5 py-0.5 rounded border border-sky-500/30 uppercase">
                {isRu ? 'Платформа Google AI' : 'Google AI Platform'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-center justify-between">
            <span className="font-bold">
              ⏳ {isRu ? 'Обратный отсчёт до закрытия us-east1.run.app:' : 'Countdown to us-east1.run.app closure:'}
            </span>
            <span className="font-mono font-black text-amber-300">
              {formatTimeUntilClosure(getTimeUntilRunAppClosure(), isRu)}
            </span>
          </div>
        </div>

        {/* Quick Links & Copy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
          <a
            href={NEW_OFFICIAL_URL}
            target="_top"
            rel="noopener noreferrer"
            className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl border-b-2 border-emerald-800 active:translate-y-0.5 transition-all text-center flex items-center justify-center space-x-1.5 shadow"
          >
            <span>🚀</span>
            <span>{isRu ? 'Перейти на duowindo6601.ai.studio' : 'Open duowindo6601.ai.studio'}</span>
          </a>

          <button
            type="button"
            onClick={() => {
              playSound('click');
              navigator.clipboard?.writeText(NEW_OFFICIAL_URL).then(() => {
                setCopiedDomain(true);
                setToast(isRu ? '📋 Адрес duowindo6601.ai.studio скопирован!' : '📋 Copied!');
                setTimeout(() => setCopiedDomain(false), 2500);
              });
            }}
            className="py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-200 font-black text-xs uppercase tracking-wider rounded-xl border border-gray-700 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>{copiedDomain ? '✅' : '📋'}</span>
            <span>{copiedDomain ? (isRu ? 'Скопировано!' : 'Copied!') : (isRu ? 'Скопировать ссылку' : 'Copy Link')}</span>
          </button>
        </div>

        {/* CONTINUE USING US-EAST1.RUN.APP UNDER RISK */}
        <div className="p-4 bg-amber-950/30 border-2 border-amber-500/50 rounded-2xl space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/30 pb-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">⚠️</span>
              <div>
                <h4 className="font-black text-xs uppercase tracking-wide text-amber-300">
                  {isRu ? 'Продолжение использования: Нет доступа к us-east1.run.app' : 'Continue Using: No Access to us-east1.run.app'}
                </h4>
                <p className="text-[11px] text-amber-200/80 font-medium">
                  {isRu ? 'Риск: могут некорректно работать Gemini API, распознавание речи и функции' : 'Risk: features and Gemini API may not function correctly'}
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border self-start sm:self-auto ${
              continuedRisk 
                ? 'bg-amber-500/30 text-amber-300 border-amber-500/50' 
                : 'bg-red-500/30 text-red-300 border-red-500/50'
            }`}>
              {continuedRisk 
                ? (isRu ? '✓ Продолжение активно' : '✓ Active (Risk Accepted)') 
                : (isRu ? '🛑 Доступ заблокирован' : '🛑 Blocked')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                playSound('click');
                const next = !continuedRisk;
                setContinuedRisk(next);
                setRunAppContinuedRiskAccepted(next);
                setToast(
                  next 
                    ? (isRu ? '⚠️ Включено продолжение работы на us-east1.run.app (Риск: могут некорректно работать)' : '⚠️ Continuing on us-east1.run.app active under risk')
                    : (isRu ? '🛑 Восстановлена блокировка адреса us-east1.run.app' : '🛑 us-east1.run.app access restriction restored')
                );
              }}
              className={`py-2 px-3.5 rounded-xl font-bold text-xs uppercase transition-all cursor-pointer flex items-center space-x-1.5 ${
                continuedRisk
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                  : 'bg-gray-800 hover:bg-gray-700 text-amber-300 border border-amber-500/40'
              }`}
            >
              <span>{continuedRisk ? '✓' : '⚠️'}</span>
              <span>
                {continuedRisk
                  ? (isRu ? 'Продолжение использования включено' : 'Continue Using Enabled')
                  : (isRu ? 'Продолжить использование (Риск: могут некорректно работать)' : 'Continue Using (Risk: May Malfunction)')}
              </span>
            </button>

            {continuedRisk && (
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  setContinuedRisk(false);
                  setRunAppContinuedRiskAccepted(false);
                  setToast(isRu ? '🛑 Доступ к us-east1.run.app снова заблокирован' : '🛑 Access blocked');
                }}
                className="py-2 px-3 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40 text-xs font-bold transition-all cursor-pointer"
              >
                🛑 {isRu ? 'Сбросить (Заблокировать)' : 'Reset (Block)'}
              </button>
            )}
          </div>
        </div>

        {/* SIMULATOR SWITCHER FOR TESTING */}
        <div className="p-4 bg-black/40 border border-gray-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs mb-2.5">
            <span className="font-black text-gray-300 flex items-center gap-1.5">
              <span>🧪</span>
              <span>{isRu ? 'Симулятор режима домена (для проверки):' : 'Domain Simulator (for testing):'}</span>
            </span>
            <span className="font-mono text-[11px] text-amber-400 font-bold">
              {simMode}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-black uppercase">
            <button
              type="button"
              onClick={() => {
                playSound('click');
                setSimModeState('auto');
                setDomainSimMode('auto');
                setToast(isRu ? '⚙️ Режим: Авто (по текущей дате)' : '⚙️ Mode: Auto');
              }}
              className={`p-2.5 rounded-xl border transition-all text-center ${
                simMode === 'auto'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-gray-800/80 text-gray-400 hover:text-white border-gray-700'
              }`}
            >
              {isRu ? '1. Авто' : '1. Auto'}
            </button>

            <button
              type="button"
              onClick={() => {
                playSound('click');
                setSimModeState('sim_warning');
                setDomainSimMode('sim_warning');
                setToast(isRu ? '⚠️ Режим: Предупреждение (до 1 нояб.)' : '⚠️ Mode: Warning Banner');
              }}
              className={`p-2.5 rounded-xl border transition-all text-center ${
                simMode === 'sim_warning'
                  ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                  : 'bg-gray-800/80 text-gray-400 hover:text-white border-gray-700'
              }`}
            >
              {isRu ? '2. Предупреждение' : '2. Warning'}
            </button>

            <button
              type="button"
              onClick={() => {
                playSound('click');
                setSimModeState('sim_blocked');
                setDomainSimMode('sim_blocked');
                setToast(isRu ? '🛑 Режим: Блокировка us-east1 (после 1 нояб.)' : '🛑 Mode: Blocked Screen');
              }}
              className={`p-2.5 rounded-xl border transition-all text-center ${
                simMode === 'sim_blocked'
                  ? 'bg-red-600 text-white border-red-400 shadow-md'
                  : 'bg-gray-800/80 text-gray-400 hover:text-white border-gray-700'
              }`}
            >
              {isRu ? '3. Блок us-east1' : '3. Block us-east1'}
            </button>

            <button
              type="button"
              onClick={() => {
                playSound('click');
                setSimModeState('sim_official');
                setDomainSimMode('sim_official');
                setToast(isRu ? '✅ Режим: ai.studio (Официальный)' : '✅ Mode: Official Domain');
              }}
              className={`p-2.5 rounded-xl border transition-all text-center ${
                simMode === 'sim_official'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-gray-800/80 text-gray-400 hover:text-white border-gray-700'
              }`}
            >
              {isRu ? '4. ai.studio' : '4. ai.studio'}
            </button>
          </div>
        </div>
      </div>

      <LanguageLockModal
        isOpen={showLockModal}
        onClose={() => {
          setShowLockModal(false);
          setLockedLang(null);
        }}
        selectedLang={lockedLang}
        userLanguage={user.language}
        isLightMode={isLightMode}
      />
    </div>
  );
};
