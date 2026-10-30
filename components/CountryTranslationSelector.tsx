import React, { useState } from 'react';
import { playSound } from '../services/audioService';
import { ALL_COUNTRIES } from '../services/countryTranslationService';

export interface TranslationCountryLanguage {
  id: string; // Language code, e.g., 'kk', 'en', 'eo', 'id'
  countryCode: string; // Flag code, e.g., 'kz', 'gb', 'un', 'id'
  countryNameRu: string;
  countryNameEn: string;
  langNameRu: string;
  langNameEn: string;
  localName: string;
  region: 'cis' | 'europe' | 'asia' | 'global' | 'americas';
  nativeGreeting: string;
  speakerCount: string;
}

export const TRANSLATION_COUNTRY_LANGUAGES: TranslationCountryLanguage[] = [
  // CIS Region
  { id: 'kk', countryCode: 'kz', countryNameRu: 'Казахстан', countryNameEn: 'Kazakhstan', langNameRu: 'Казахский язык', langNameEn: 'Kazakh Language', localName: 'Қазақ тілі', region: 'cis', nativeGreeting: 'Сәлем!', speakerCount: '18M+' },
  { id: 'uz', countryCode: 'uz', countryNameRu: 'Узбекистан', countryNameEn: 'Uzbekistan', langNameRu: 'Узбекский язык', langNameEn: 'Uzbek Language', localName: 'O‘zbek tili', region: 'cis', nativeGreeting: 'Salom!', speakerCount: '35M+' },
  { id: 'ky', countryCode: 'kg', countryNameRu: 'Кыргызстан', countryNameEn: 'Kyrgyzstan', langNameRu: 'Киргизский язык', langNameEn: 'Kyrgyz Language', localName: 'Кыргыз тили', region: 'cis', nativeGreeting: 'Салам!', speakerCount: '6M+' },
  { id: 'tg', countryCode: 'tj', countryNameRu: 'Таджикистан', countryNameEn: 'Tajikistan', langNameRu: 'Таджикский язык', langNameEn: 'Tajik Language', localName: 'Забони тоҷикӣ', region: 'cis', nativeGreeting: 'Салом!', speakerCount: '9M+' },
  { id: 'tk', countryCode: 'tm', countryNameRu: 'Туркменистан', countryNameEn: 'Turkmenistan', langNameRu: 'Туркменский язык', langNameEn: 'Turkmen Language', localName: 'Türkmen dili', region: 'cis', nativeGreeting: 'Salam!', speakerCount: '7M+' },
  { id: 'az', countryCode: 'az', countryNameRu: 'Азербайджан', countryNameEn: 'Azerbaijan', langNameRu: 'Азербайджанский язык', langNameEn: 'Azerbaijani Language', localName: 'Azərbaycan dili', region: 'cis', nativeGreeting: 'Salam!', speakerCount: '10M+' },
  { id: 'hy', countryCode: 'am', countryNameRu: 'Армения', countryNameEn: 'Armenia', langNameRu: 'Армянский язык', langNameEn: 'Armenian Language', localName: 'Հայերեն', region: 'cis', nativeGreeting: 'Բարև (Barev!)', speakerCount: '7M+' },
  { id: 'ka', countryCode: 'ge', countryNameRu: 'Грузия', countryNameEn: 'Georgia', langNameRu: 'Грузинский язык', langNameEn: 'Georgian Language', localName: 'ქართული', region: 'cis', nativeGreeting: 'გამარჯობა!', speakerCount: '4M+' },
  { id: 'be', countryCode: 'by', countryNameRu: 'Беларусь', countryNameEn: 'Belarus', langNameRu: 'Белорусский язык', langNameEn: 'Belarusian Language', localName: 'Беларуская мова', region: 'cis', nativeGreeting: 'Прывітанне!', speakerCount: '8M+' },
  { id: 'uk', countryCode: 'ua', countryNameRu: 'Украина', countryNameEn: 'Ukraine', langNameRu: 'Украинский язык', langNameEn: 'Ukrainian Language', localName: 'Українська мова', region: 'cis', nativeGreeting: 'Привіт!', speakerCount: '40M+' },
  { id: 'ru', countryCode: 'ru', countryNameRu: 'Россия', countryNameEn: 'Russia', langNameRu: 'Русский язык', langNameEn: 'Russian Language', localName: 'Русский язык', region: 'cis', nativeGreeting: 'Привет!', speakerCount: '250M+' },

  // Global & Esperanto & Indonesian
  { id: 'eo', countryCode: 'un', countryNameRu: 'Всемирный (Esperanto)', countryNameEn: 'Global (Esperanto)', langNameRu: 'Эсперанто', langNameEn: 'Esperanto', localName: 'Esperanto', region: 'global', nativeGreeting: 'Saluton!', speakerCount: '2M+' },
  { id: 'id', countryCode: 'id', countryNameRu: 'Индонезия', countryNameEn: 'Indonesia', langNameRu: 'Индонезийский язык', langNameEn: 'Indonesian Language', localName: 'Bahasa Indonesia', region: 'global', nativeGreeting: 'Halo / Apa kabar!', speakerCount: '200M+' },

  // Europe
  { id: 'en', countryCode: 'gb', countryNameRu: 'Великобритания / США', countryNameEn: 'UK / USA', langNameRu: 'Английский язык', langNameEn: 'English Language', localName: 'English', region: 'europe', nativeGreeting: 'Hello!', speakerCount: '1.5B+' },
  { id: 'de', countryCode: 'de', countryNameRu: 'Германия', countryNameEn: 'Germany', langNameRu: 'Немецкий язык', langNameEn: 'German Language', localName: 'Deutsch', region: 'europe', nativeGreeting: 'Hallo!', speakerCount: '130M+' },
  { id: 'fr', countryCode: 'fr', countryNameRu: 'Франция', countryNameEn: 'France', langNameRu: 'Французский язык', langNameEn: 'French Language', localName: 'Français', region: 'europe', nativeGreeting: 'Bonjour!', speakerCount: '280M+' },
  { id: 'es', countryCode: 'es', countryNameRu: 'Испания / Лат. Америка', countryNameEn: 'Spain / LatAm', langNameRu: 'Испанский язык', langNameEn: 'Spanish Language', localName: 'Español', region: 'europe', nativeGreeting: '¡Hola!', speakerCount: '500M+' },
  { id: 'it', countryCode: 'it', countryNameRu: 'Италия', countryNameEn: 'Italy', langNameRu: 'Итальянский язык', langNameEn: 'Italian Language', localName: 'Italiano', region: 'europe', nativeGreeting: 'Ciao!', speakerCount: '85M+' },
  { id: 'pl', countryCode: 'pl', countryNameRu: 'Польша', countryNameEn: 'Poland', langNameRu: 'Польский язык', langNameEn: 'Polish Language', localName: 'Język polski', region: 'europe', nativeGreeting: 'Cześć!', speakerCount: '45M+' },
  { id: 'tr', countryCode: 'tr', countryNameRu: 'Турция', countryNameEn: 'Turkey', langNameRu: 'Турецкий язык', langNameEn: 'Turkish Language', localName: 'Türkçe', region: 'europe', nativeGreeting: 'Merhaba!', speakerCount: '88M+' },

  // Asia & Middle East
  { id: 'ar', countryCode: 'sa', countryNameRu: 'Арабские страны', countryNameEn: 'Arab Countries', langNameRu: 'Арабский язык', langNameEn: 'Arabic Language', localName: 'العربية', region: 'asia', nativeGreeting: 'مرحبا (Marhaban!)', speakerCount: '370M+' },
  { id: 'zh', countryCode: 'cn', countryNameRu: 'Китай', countryNameEn: 'China', langNameRu: 'Китайский язык', langNameEn: 'Chinese Language', localName: '中文 (Zhōngwén)', region: 'asia', nativeGreeting: '你好 (Nǐ hǎo!)', speakerCount: '1.3B+' },
  { id: 'ja', countryCode: 'jp', countryNameRu: 'Япония', countryNameEn: 'Japan', langNameRu: 'Японский язык', langNameEn: 'Japanese Language', localName: '日本語', region: 'asia', nativeGreeting: 'こんにちは!', speakerCount: '125M+' },
  { id: 'ko', countryCode: 'kr', countryNameRu: 'Южная Корея', countryNameEn: 'South Korea', langNameRu: 'Корейский язык', langNameEn: 'Korean Language', localName: '한국어', region: 'asia', nativeGreeting: '안녕하세요!', speakerCount: '80M+' }
];

interface CountryTranslationSelectorProps {
  currentSourceLang?: string; // e.g. 'ru'
  currentTargetLang: string; // e.g. 'en' or 'eo' or 'id'
  userLanguage?: string;
  onSelectTargetLang: (langItem: TranslationCountryLanguage) => void;
  onSwapLanguages?: () => void;
}

export const CountryTranslationSelector: React.FC<CountryTranslationSelectorProps> = ({
  currentSourceLang = 'ru',
  currentTargetLang,
  userLanguage = 'ru',
  onSelectTargetLang,
  onSwapLanguages
}) => {
  const [activeRegion, setActiveRegion] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const activeTargetItem = TRANSLATION_COUNTRY_LANGUAGES.find(l => l.id === currentTargetLang) || TRANSLATION_COUNTRY_LANGUAGES.find(l => l.id === 'en')!;

  const filteredLanguages = TRANSLATION_COUNTRY_LANGUAGES.filter(item => {
    // Region match
    if (activeRegion !== 'all' && item.region !== activeRegion) return false;
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        item.countryNameRu.toLowerCase().includes(q) ||
        item.countryNameEn.toLowerCase().includes(q) ||
        item.langNameRu.toLowerCase().includes(q) ||
        item.langNameEn.toLowerCase().includes(q) ||
        item.localName.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-gray-800/90 border-2 border-duo-blue/40 rounded-3xl p-4 md:p-6 shadow-xl space-y-4 text-white">
      {/* DIRECTION SWAPPER HEADER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-900/90 p-3.5 rounded-2xl border border-gray-700">
        {/* Source Lang */}
        <div className="flex items-center space-x-3">
          <img
            src={`https://flagcdn.com/w40/ru.png`}
            className="w-7 h-5 rounded-md object-cover border border-white/20 shadow-sm"
            alt="Исходный язык"
          />
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">
              {userLanguage === 'ru' ? 'Исходный язык' : 'Source Language'}
            </span>
            <span className="font-black text-sm text-white">
              🇷🇺 Русский язык (Россия)
            </span>
          </div>
        </div>

        {/* Swap Button */}
        {onSwapLanguages && (
          <button
            onClick={() => {
              playSound('select');
              onSwapLanguages();
            }}
            className="p-2.5 bg-duo-blue hover:brightness-110 active:scale-90 text-white rounded-xl shadow-md border-b-2 border-duo-blueDark transition-all flex items-center space-x-1.5"
            title="Переключить направление перевода (⇄)"
          >
            <span className="text-lg">⇄</span>
            <span className="text-[11px] font-black uppercase tracking-wider hidden md:inline">
              {userLanguage === 'ru' ? 'Поменять местами' : 'Swap'}
            </span>
          </button>
        )}

        {/* Target Country Language */}
        <div className="flex items-center space-x-3">
          {activeTargetItem.countryCode === 'un' ? (
            <span className="text-2xl">🌐</span>
          ) : (
            <img
              src={`https://flagcdn.com/w40/${activeTargetItem.countryCode}.png`}
              className="w-7 h-5 rounded-md object-cover border border-white/20 shadow-sm"
              alt={activeTargetItem.countryNameRu}
            />
          )}
          <div>
            <span className="text-[10px] font-black uppercase text-duo-blue block tracking-wider">
              {userLanguage === 'ru' ? 'Язык страны перевода' : 'Target Country Language'}
            </span>
            <span className="font-black text-sm text-emerald-400 flex items-center space-x-1.5">
              <span>{activeTargetItem.langNameRu}</span>
              <span className="text-xs text-gray-400 font-normal">({activeTargetItem.countryNameRu})</span>
            </span>
          </div>
        </div>
      </div>

      {/* QUICK PRESET CHIPS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center space-x-1.5">
            <span>🌍</span>
            <span>{userLanguage === 'ru' ? 'Выберите язык страны перевода:' : 'Select Target Country Language:'}</span>
          </label>
          <button
            onClick={() => {
              playSound('click');
              setIsExpanded(!isExpanded);
            }}
            className="text-xs font-bold text-duo-blue hover:underline flex items-center space-x-1"
          >
            <span>{isExpanded ? 'Свернуть список' : 'Показать все страны (20+)'}</span>
            <span>{isExpanded ? '▲' : '▼'}</span>
          </button>
        </div>

        {/* Popular chips */}
        <div className="flex flex-wrap gap-2">
          {TRANSLATION_COUNTRY_LANGUAGES.slice(0, 10).map(item => {
            const isSelected = item.id === currentTargetLang;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playSound('select');
                  onSelectTargetLang(item);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-2 border-b-2 transition-all active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-duo-blue text-white border-duo-blueDark shadow-md scale-105'
                    : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {item.countryCode === 'un' ? (
                  <span className="text-sm">🌐</span>
                ) : (
                  <img
                    src={`https://flagcdn.com/w40/${item.countryCode}.png`}
                    className="w-4 h-3 rounded-sm object-cover"
                    alt={item.countryNameRu}
                  />
                )}
                <span>{item.langNameRu}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* EXPANDABLE COUNTRY SELECTOR PANEL */}
      {isExpanded && (
        <div className="bg-gray-900/90 border border-gray-700 rounded-2xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
          {/* SEARCH & REGION TABS */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
            {/* Region Tabs */}
            <div className="flex flex-wrap gap-1.5 bg-gray-800/80 p-1 rounded-xl border border-gray-700">
              {[
                { id: 'all', label: 'Все страны' },
                { id: 'cis', label: 'СНГ & Соседи' },
                { id: 'europe', label: 'Европа' },
                { id: 'asia', label: 'Азия & Восток' },
                { id: 'global', label: 'Всемирные' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    playSound('click');
                    setActiveRegion(tab.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                    activeRegion === tab.id
                      ? 'bg-duo-blue text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="w-full md:w-64 bg-gray-800 border border-gray-700 rounded-xl px-3 py-1.5 flex items-center space-x-2">
              <span className="text-xs text-gray-400">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск страны или языка..."
                className="w-full bg-transparent text-xs font-bold text-white focus:outline-none placeholder-gray-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* GRID OF COUNTRIES & LANGUAGES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
            {filteredLanguages.map(item => {
              const isSelected = item.id === currentTargetLang;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    playSound('select');
                    onSelectTargetLang(item);
                  }}
                  className={`p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between space-x-3 cursor-pointer ${
                    isSelected
                      ? 'bg-duo-blue/20 border-duo-blue text-white shadow-md'
                      : 'bg-gray-800/80 border-gray-700 hover:border-gray-600 hover:bg-gray-750'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {item.countryCode === 'un' ? (
                      <span className="text-2xl">🌐</span>
                    ) : (
                      <img
                        src={`https://flagcdn.com/w40/${item.countryCode}.png`}
                        className="w-7 h-5 rounded object-cover border border-white/20"
                        alt={item.countryNameRu}
                      />
                    )}
                    <div>
                      <h5 className="font-black text-xs text-white leading-tight">
                        {item.langNameRu}
                      </h5>
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                        {item.countryNameRu} • <span className="text-emerald-400">{item.nativeGreeting}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-black rounded-lg ${
                      isSelected
                        ? 'bg-duo-blue text-white'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {isSelected ? '✓ Выбран' : 'Выбрать'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
