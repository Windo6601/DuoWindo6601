import React, { useState, useMemo } from 'react';
import { VolumeIcon, SparklesIcon, SearchIcon } from './Icons';
import { 
  getArabicNumberInfo, 
  ALL_ARABIC_NUMBERS_0_99, 
  ArabicNumberItem 
} from '../services/arabicNumeralsService';
import { playSound } from '../services/audioService';

interface ArabicNumeralsConverterProps {
  speakText: (text: string, lang?: string, isSlow?: boolean, voice?: string, provider?: string) => void;
  preferredVoice?: string;
  voiceProvider?: string;
}

export const ArabicNumeralsConverter: React.FC<ArabicNumeralsConverterProps> = ({
  speakText,
  preferredVoice,
  voiceProvider
}) => {
  const [activeTab, setActiveTab] = useState<'converter' | 'handbook'>('converter');
  
  // Converter State
  const [selectedNum, setSelectedNum] = useState<number>(25);
  const [customInput, setCustomInput] = useState<string>('25');

  // Handbook Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [handbookFilter, setHandbookFilter] = useState<'all' | 'units' | 'teens' | '20-49' | '50-99'>('all');

  // Current converted item
  const currentItem = useMemo(() => getArabicNumberInfo(selectedNum), [selectedNum]);

  const handleInputChange = (valStr: string) => {
    setCustomInput(valStr);
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(0, Math.min(99, parsed));
      setSelectedNum(clamped);
    }
  };

  const handleSliderChange = (val: number) => {
    setSelectedNum(val);
    setCustomInput(String(val));
  };

  const handlePlayAudio = (text: string) => {
    playSound('correct');
    try {
      speakText(text, 'ar', false, preferredVoice, voiceProvider);
    } catch (e) {
      console.warn("Audio playback error:", e);
    }
  };

  // Filter handbook items
  const filteredHandbookItems = useMemo(() => {
    return ALL_ARABIC_NUMBERS_0_99.filter(item => {
      // Category filter
      if (handbookFilter === 'units' && !(item.val >= 0 && item.val <= 9)) return false;
      if (handbookFilter === 'teens' && !(item.val >= 10 && item.val <= 19)) return false;
      if (handbookFilter === '20-49' && !(item.val >= 20 && item.val <= 49)) return false;
      if (handbookFilter === '50-99' && !(item.val >= 50 && item.val <= 99)) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          item.western.includes(q) ||
          item.eastern.includes(q) ||
          item.arabic.toLowerCase().includes(q) ||
          item.translit.toLowerCase().includes(q) ||
          item.ru.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [handbookFilter, searchQuery]);

  return (
    <div className="w-full max-w-4xl mx-auto my-6 bg-gray-900/90 border-2 border-emerald-500/40 rounded-3xl p-4 md:p-6 shadow-2xl backdrop-blur-xl animate-in fade-in">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-800">
        <div className="flex items-center space-x-3 text-left">
          <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-800 rounded-2xl shadow-lg border border-emerald-400/40 shrink-0">
            <span className="text-2xl font-black">🔢</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg md:text-xl font-black text-white flex items-center gap-2 flex-wrap">
              <span>Конвертер (0-99) и Справочник арабских цифр</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider font-extrabold">
                ЗАПАДНЫЕ 0-99 • ВОСТОЧНЫЕ ٠-٩٩
              </span>
            </h3>
            <p className="text-xs text-emerald-200/90 font-bold mt-0.5">
              Западные цифры слева (0-99) и восточно-арабские справа (٠-٩٩) • Интерактивный ползунок, озвучка и поиск
            </p>
            <div className="flex items-center space-x-2 mt-1.5 flex-wrap gap-1">
              <span className="text-[10px] font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-md">
                🇸🇦 Доступ: Только Курс Арабской
              </span>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-gray-950 p-1 rounded-2xl border border-gray-800 w-full sm:w-auto">
          <button
            onClick={() => { playSound('click'); setActiveTab('converter'); }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'converter' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>⚡</span>
            <span>Конвертер (0-99)</span>
          </button>
          <button
            onClick={() => { playSound('click'); setActiveTab('handbook'); }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'handbook' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>📖</span>
            <span>Справочник (0-99)</span>
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* TAB 1: INTERACTIVE CONVERTER (0 - 99) */}
      {/* ========================================== */}
      {activeTab === 'converter' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Main Display Box */}
          <div className="bg-gradient-to-b from-gray-950 to-gray-900 border-2 border-emerald-500/50 rounded-3xl p-6 text-center relative overflow-hidden shadow-2xl">
            {/* Corner Badge */}
            <div className="absolute top-3 right-3 text-[10px] font-black text-gray-400 bg-gray-800/80 px-2.5 py-1 rounded-full border border-gray-700">
              Западные / Восточно-арабские
            </div>

            {/* DUAL NUMERALS DISPLAY */}
            <div className="flex items-center justify-center space-x-4 my-3">
              {/* Western Digit (Left) */}
              <div className="flex flex-col items-center">
                <span className="text-4xl md:text-6xl font-black text-sky-400 tracking-tight">
                  {currentItem.western}
                </span>
                <span className="text-[10px] uppercase text-sky-300 font-extrabold mt-1">
                  Европейская (Западная)
                </span>
              </div>

              {/* Separator */}
              <div className="text-2xl md:text-4xl font-light text-gray-600">/</div>

              {/* Eastern Digit (Right) */}
              <div className="flex flex-col items-center">
                <span className="text-4xl md:text-6xl font-black text-emerald-400 font-arabic tracking-tight">
                  {currentItem.eastern}
                </span>
                <span className="text-[10px] uppercase text-emerald-300 font-extrabold mt-1">
                  Восточно-Арабская
                </span>
              </div>
            </div>

            {/* Vocalized Arabic & Audio */}
            <div className="mt-4 pt-4 border-t border-gray-800 flex flex-col items-center">
              <div className="flex items-center justify-center space-x-3">
                <h4 className="text-2xl md:text-3xl font-black text-white font-arabic" dir="rtl">
                  {currentItem.arabic}
                </h4>
                <button
                  onClick={() => handlePlayAudio(currentItem.arabic)}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl transition-transform active:scale-95 shadow-md cursor-pointer"
                  title="Озвучить на арабском"
                >
                  <VolumeIcon className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm md:text-base font-bold text-amber-300 mt-1">
                {currentItem.translit}
              </p>
              <p className="text-xs md:text-sm font-semibold text-gray-300 mt-0.5">
                {currentItem.ru}
              </p>
            </div>
          </div>

          {/* Controls: Slider & Quick Input */}
          <div className="bg-gray-950/80 border border-gray-800 p-5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
                <span>🎚️ Ползунок выбора числа (0 - 99)</span>
              </label>

              {/* Quick Direct Number Input */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400 font-bold">Число:</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={customInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="w-16 bg-gray-900 border-2 border-emerald-500/60 rounded-xl px-2 py-1 text-center font-black text-white text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Range Slider */}
            <input
              type="range"
              min="0"
              max="99"
              value={selectedNum}
              onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-gray-800 rounded-lg"
            />

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              <span className="text-[11px] text-gray-400 font-bold shrink-0 mr-1">Быстрый переход:</span>
              {[0, 1, 5, 10, 12, 15, 20, 25, 50, 75, 99].map(preset => (
                <button
                  key={preset}
                  onClick={() => handleSliderChange(preset)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                    selectedNum === preset 
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm' 
                      : 'bg-gray-900 text-gray-300 border-gray-700 hover:border-emerald-500/60'
                  }`}
                >
                  {preset} / {getArabicNumberInfo(preset).eastern}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: FULL HANDBOOK GRID (0 - 99) */}
      {/* ========================================== */}
      {activeTab === 'handbook' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-950 p-3 rounded-2xl border border-gray-800">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск (25, ٢٥, خمسة)..."
                className="w-full bg-gray-900 border border-gray-700 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 font-bold focus:outline-none"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
              {[
                { id: 'all', label: 'Все (0-99)' },
                { id: 'units', label: 'Единицы (0-9)' },
                { id: 'teens', label: '10-19' },
                { id: '20-49', label: '20-49' },
                { id: '50-99', label: '50-99' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => { playSound('click'); setHandbookFilter(f.id as any); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                    handbookFilter === f.id 
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm' 
                      : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Handbook Grid List */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
            {filteredHandbookItems.map((item) => (
              <div
                key={item.val}
                onClick={() => handlePlayAudio(item.arabic)}
                className="bg-gray-950 hover:bg-gray-850 border border-gray-800 hover:border-emerald-500/50 p-3.5 rounded-2xl flex flex-col justify-between transition-all cursor-pointer group shadow-sm hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5 font-black">
                    <span className="text-sky-300 text-base">{item.western}</span>
                    <span className="text-gray-600 text-xs">/</span>
                    <span className="text-emerald-300 font-arabic text-lg">{item.eastern}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayAudio(item.arabic);
                    }}
                    className="p-1 text-gray-500 group-hover:text-emerald-400 transition-colors"
                  >
                    <VolumeIcon className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <div className="text-sm font-black text-white font-arabic truncate" dir="rtl">
                    {item.arabic}
                  </div>
                  <div className="text-[11px] font-bold text-amber-300 truncate">
                    {item.translit}
                  </div>
                  <div className="text-[10px] font-semibold text-gray-400 truncate">
                    {item.ru}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredHandbookItems.length === 0 && (
            <div className="p-8 text-center bg-gray-950 rounded-2xl border border-gray-800 text-gray-400 font-bold text-xs">
              Число по запросу "{searchQuery}" не найдено в диапазоне 0-99.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
