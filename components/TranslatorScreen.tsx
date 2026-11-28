import React, { useState, useEffect, useRef } from 'react';
import { translateText, OFFLINE_INTERNET_REQUIRED_MESSAGE, isNetworkDisconnectError, notifyNetworkOffline } from '../services/geminiService';
import { VolumeIcon, CloseIcon } from './Icons';

interface TranslatorScreenProps {
  userLanguage: string;
  onBack: () => void;
  playSound: (type: any) => void;
  setToast: (msg: string) => void;
  speakText: (text: string, langCode: string, slow?: boolean, voice?: string, provider?: string) => void;
  preferredVoice?: string;
  voiceProvider?: string;
}

export interface LanguageCountryOption {
  code: string;
  flagCode: string;
  nameRu: string;
  nameEn: string;
  countryRu: string;
  countryEn: string;
  fontClass?: string;
  isBeta?: boolean;
  dir?: 'ltr' | 'rtl';
}

export const TRANSLATION_LANGUAGES: LanguageCountryOption[] = [
  { code: 'ru', flagCode: 'ru', nameRu: 'Русский', nameEn: 'Russian', countryRu: 'Россия', countryEn: 'Russia' },
  { code: 'en', flagCode: 'gb', nameRu: 'English', nameEn: 'English', countryRu: 'Великобритания / США', countryEn: 'United Kingdom / USA' },
  { code: 'de', flagCode: 'de', nameRu: 'Deutsch', nameEn: 'German', countryRu: 'Германия', countryEn: 'Germany' },
  { code: 'fr', flagCode: 'fr', nameRu: 'Français', nameEn: 'French', countryRu: 'Франция', countryEn: 'France' },
  { code: 'es', flagCode: 'es', nameRu: 'Español', nameEn: 'Spanish', countryRu: 'Испания', countryEn: 'Spain' },
  { code: 'zh', flagCode: 'cn', nameRu: '中文', nameEn: 'Chinese', countryRu: 'Китай', countryEn: 'China', fontClass: 'font-chinese' },
  { code: 'ja', flagCode: 'jp', nameRu: '日本語', nameEn: 'Japanese', countryRu: 'Япония', countryEn: 'Japan', fontClass: 'font-japanese' },
  { code: 'ar', flagCode: 'sa', nameRu: 'العربية', nameEn: 'Arabic', countryRu: 'Саудовская Аравия', countryEn: 'Saudi Arabia', fontClass: 'font-arabic', dir: 'rtl' },
  { code: 'kk', flagCode: 'kz', nameRu: 'Қазақша', nameEn: 'Kazakh', countryRu: 'Казахстан', countryEn: 'Kazakhstan' },
  { code: 'uz', flagCode: 'uz', nameRu: "O'zbek", nameEn: 'Uzbek', countryRu: 'Узбекистан', countryEn: 'Uzbekistan' },
  { code: 'it', flagCode: 'it', nameRu: 'Italiano', nameEn: 'Italian', countryRu: 'Италия', countryEn: 'Italy' },
  { code: 'tr', flagCode: 'tr', nameRu: 'Türkçe', nameEn: 'Turkish', countryRu: 'Турция', countryEn: 'Turkey' },
  { code: 'by', flagCode: 'by', nameRu: 'Белорусский', nameEn: 'Belarusian', countryRu: 'Беларусь', countryEn: 'Belarus' },
  { code: 'kg', flagCode: 'kg', nameRu: 'Кыргызский', nameEn: 'Kyrgyz', countryRu: 'Кыргызстан', countryEn: 'Kyrgyzstan' },
  { code: 'az', flagCode: 'az', nameRu: 'Азербайджанский', nameEn: 'Azerbaijani', countryRu: 'Азербайджан', countryEn: 'Azerbaijan' },
  { code: 'am', flagCode: 'am', nameRu: 'Армянский', nameEn: 'Armenian', countryRu: 'Армения', countryEn: 'Armenia' },
  { code: 'ge', flagCode: 'ge', nameRu: 'Грузинский', nameEn: 'Georgian', countryRu: 'Грузия', countryEn: 'Georgia' },
  // Курс язык (Бета)
  { code: 'eo', flagCode: 'eu', nameRu: 'Эсперанто (Esperanto)', nameEn: 'Esperanto', countryRu: 'Международный • Курс Бета', countryEn: 'International • Beta Course', isBeta: true },
  { code: 'la', flagCode: 'it', nameRu: 'Латынь (Lingua Latina)', nameEn: 'Latin (Lingua Latina)', countryRu: 'Классический • Курс Бета', countryEn: 'Classical • Beta Course', isBeta: true },
  { code: 'sv', flagCode: 'se', nameRu: 'Шведский (Svenska)', nameEn: 'Swedish (Svenska)', countryRu: 'Швеция • Курс Бета', countryEn: 'Sweden • Beta Course', isBeta: true },
  { code: 'no', flagCode: 'no', nameRu: 'Норвежский (Norsk)', nameEn: 'Norwegian (Norsk)', countryRu: 'Норвегия • Курс Бета', countryEn: 'Norway • Beta Course', isBeta: true },
  { code: 'hv', flagCode: 'gb', nameRu: 'Высокий валирийский (Valyrio)', nameEn: 'High Valyrian (Valyrio)', countryRu: 'Валирия • Шрифт Бета', countryEn: 'Valyria • Beta Font', fontClass: 'font-valyrian', isBeta: true },
  { code: 'tlh', flagCode: 'us', nameRu: 'Клингонский (tlhIngan Hol)', nameEn: 'Klingon (tlhIngan Hol)', countryRu: 'Клингон • Шрифт Бета', countryEn: 'Qo’noS • Beta Font', fontClass: 'font-klingon', isBeta: true },
  { code: 'yi', flagCode: 'il', nameRu: 'Идиш (ייִדיш)', nameEn: 'Yiddish (ייִדיш)', countryRu: 'Идиш • Курс Бета', countryEn: 'Yiddish • Beta Course', fontClass: 'font-hebrew', dir: 'rtl', isBeta: true },
];

export const TranslatorScreen: React.FC<TranslatorScreenProps> = ({
  userLanguage,
  onBack,
  playSound,
  setToast,
  speakText,
  preferredVoice,
  voiceProvider
}) => {
  const isRu = userLanguage === 'ru';
  const topTranslatorRef = useRef<HTMLDivElement>(null);

  // Translation state
  const [sourceLang, setSourceLang] = useState<string>('ru');
  const [targetLang, setTargetLang] = useState<string>('en');
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [translationSourceInfo, setTranslationSourceInfo] = useState<string>('');

  // Quick switch assign mode & separated translator category filter
  const [ribbonAssignMode, setRibbonAssignMode] = useState<'target' | 'source'>('target');
  const [languageCategory, setLanguageCategory] = useState<'all' | 'standard' | 'beta'>('all');

  // Selector modal states
  const [showSourceSelector, setShowSourceSelector] = useState<boolean>(false);
  const [showTargetSelector, setShowTargetSelector] = useState<boolean>(false);
  const [selectorSearch, setSelectorSearch] = useState<string>('');

  // Network state detection
  const [isNetworkOnline, setIsNetworkOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsNetworkOnline(true);
    const handleOffline = () => setIsNetworkOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('duowindo_network_online', handleOnline);
    window.addEventListener('duowindo_network_offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('duowindo_network_online', handleOnline);
      window.removeEventListener('duowindo_network_offline', handleOffline);
    };
  }, []);

  // Quick preset phrases
  const quickPhrases = isRu
    ? [
        'Привет, как твои дела?',
        'Спасибо большое за помощь!',
        'Сколько это стоит?',
        'Где находится аэропорт?',
        'Помогите, пожалуйста!',
        'Счет, пожалуйста'
      ]
    : [
        'Hello, how are you?',
        'Thank you very much for your help!',
        'How much does this cost?',
        'Where is the airport?',
        'Help me, please!',
        'The bill, please'
      ];

  const getLangName = (code: string): string => {
    const found = TRANSLATION_LANGUAGES.find(l => l.code === code);
    if (!found) return code.toUpperCase();
    return isRu ? `${found.nameRu} (${found.countryRu})` : `${found.nameEn} (${found.countryEn})`;
  };

  const getSourceOption = (): LanguageCountryOption => {
    return TRANSLATION_LANGUAGES.find(l => l.code === sourceLang) || TRANSLATION_LANGUAGES[0];
  };

  const getTargetOption = (): LanguageCountryOption => {
    return TRANSLATION_LANGUAGES.find(l => l.code === targetLang) || TRANSLATION_LANGUAGES[1];
  };

  // Language Swapping: "Приключить / поменять язык местами"
  const handleSwapLanguages = () => {
    playSound('select');
    setIsSwapping(true);
    setTimeout(() => setIsSwapping(false), 300);

    const prevSource = sourceLang;
    const prevTarget = targetLang;
    setSourceLang(prevTarget);
    setTargetLang(prevSource);

    // If there is already translated output, swap input and output text as well!
    if (outputText.trim()) {
      const prevInput = inputText;
      const prevOutput = outputText;
      setInputText(prevOutput);
      setOutputText(prevInput);
    }

    setToast(
      isRu 
        ? `⇄ Языки стран приключены местами: ${getLangName(prevTarget)} ➔ ${getLangName(prevSource)}`
        : `⇄ Languages swapped: ${getLangName(prevTarget)} ➔ ${getLangName(prevSource)}`
    );
  };

  // Direct 1-tap language switch helper
  const handleSwitchLanguage = (code: string, asTarget: boolean = true) => {
    playSound('select');
    if (asTarget) {
      if (sourceLang === code) {
        // If already source, swap
        setSourceLang(targetLang);
      }
      setTargetLang(code);
      setToast(
        isRu 
          ? `⇄ Целевой язык перевода приключен: ${getLangName(code)}!`
          : `⇄ Target country language switched to: ${getLangName(code)}!`
      );
      if (inputText.trim()) {
        setTimeout(() => handleTranslate(inputText, code), 100);
      }
    } else {
      if (targetLang === code) {
        // If already target, swap
        setTargetLang(sourceLang);
      }
      setSourceLang(code);
      setToast(
        isRu 
          ? `📥 Исходный язык перевода приключен: ${getLangName(code)}!`
          : `📥 Source language switched to: ${getLangName(code)}!`
      );
      if (inputText.trim()) {
        setTimeout(() => handleTranslate(inputText, targetLang, code), 100);
      }
    }
  };

  // Perform online Gemini AI translation (works without VPN and with VPN)
  const handleTranslate = async (
    textToTranslate: string = inputText,
    overrideTarget: string = targetLang,
    overrideSource: string = sourceLang
  ) => {
    const cleanText = textToTranslate.trim();
    if (!cleanText) return;

    if (!isNetworkOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      notifyNetworkOffline();
      setToast(
        isRu
          ? `📡 ${OFFLINE_INTERNET_REQUIRED_MESSAGE}`
          : '📡 No internet connection. DuoWindo6601 requires internet. Turn on Wi-Fi or mobile data and try again.'
      );
      playSound('wrong');
      return;
    }

    playSound('click');
    setIsLoading(true);

    const targetOpt = TRANSLATION_LANGUAGES.find(l => l.code === overrideTarget) || getTargetOption();
    const sourceOpt = TRANSLATION_LANGUAGES.find(l => l.code === overrideSource) || getSourceOption();

    try {
      const targetLangName = targetOpt.nameEn;
      const sourceLangName = sourceOpt.nameEn;
      const res = await translateText(cleanText, targetLangName, sourceLangName);

      setOutputText(res);
      setTranslationSourceInfo(
        isRu
          ? '🌐 Онлайн-перевод (DuoWindo6601 Gemini AI • Без VPN и с VPN)'
          : '🌐 Online Translation (DuoWindo6601 Gemini AI • With & Without VPN)'
      );
      playSound('success');
    } catch (err: any) {
      const offlineErr =
        isNetworkDisconnectError(err) ||
        String(err?.message || '').includes('Нет подключения к интернету');
      if (offlineErr) {
        notifyNetworkOffline();
        setToast(
          isRu
            ? `📡 ${OFFLINE_INTERNET_REQUIRED_MESSAGE}`
            : '📡 No internet connection. DuoWindo6601 requires internet. Turn on Wi-Fi or mobile data and try again.'
        );
      } else {
        setToast(
          err?.message ||
            (isRu ? '⚠️ Ошибка онлайн-перевода Gemini AI. Попробуйте снова.' : '⚠️ Online Gemini AI translation error. Please try again.')
        );
      }
      playSound('wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-duo-dark overflow-y-auto no-scrollbar font-din select-none pb-28">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 animate-in fade-in duration-200">
        
        {/* TOP BAR / BACK NAVIGATION */}
        <div className="flex items-center justify-between mb-5">
          <button 
            onClick={() => { playSound('click'); onBack(); }}
            className="flex items-center space-x-2 text-gray-400 hover:text-white px-3.5 py-2 rounded-2xl bg-gray-800/80 hover:bg-gray-750 transition-all border border-gray-700/60 shadow-md cursor-pointer"
          >
            <CloseIcon className="w-5 h-5"/>
            <span className="font-black text-xs uppercase tracking-wider">{isRu ? 'Назад в меню' : 'Back'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 border ${
                !isNetworkOnline
                  ? 'bg-red-950/80 border-red-500/60 text-red-300 shadow-md'
                  : 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
              }`}
            >
              <span>{!isNetworkOnline ? '📡' : '🌐'}</span>
              <span>
                {!isNetworkOnline
                  ? (isRu ? 'Нет подключения к интернету' : 'No Internet')
                  : (isRu ? 'Gemini AI Онлайн • Без VPN и с VPN' : 'Gemini AI Online • VPN & No-VPN')}
              </span>
            </div>
          </div>
        </div>

        {/* HEADER HERO */}
        <div ref={topTranslatorRef} className="bg-gradient-to-r from-sky-950/70 via-gray-900 to-indigo-950/70 border-2 border-sky-500/40 rounded-3xl p-5 sm:p-6 mb-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border-2 border-sky-400/40 flex items-center justify-center text-3xl shadow-inner shrink-0">
              📖
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  {isRu ? 'Переводчик DuoWindo6601' : 'DuoWindo6601 Translator'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  {isRu ? 'Gemini AI Онлайн 🌐' : 'Gemini AI Online 🌐'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-300 font-bold mt-1">
                {isRu 
                  ? 'Переключайте языки стран ⇄ и переводите через Gemini AI • Работает без VPN и использует VPN'
                  : 'Switch country languages ⇄ and translate via Gemini AI • Works without VPN and with VPN'}
              </p>
            </div>
          </div>
          <div className="text-3xl hidden sm:block animate-bounce select-none">🦉</div>
        </div>

        {/* ============================================================== */}
        {/* FAST COUNTRY SWITCH RIBBON: Separated Standard & Beta Languages */}
        {/* ============================================================== */}
        <div className="bg-gray-850 border-2 border-sky-500/40 rounded-3xl p-4 sm:p-5 mb-6 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-amber-400 text-lg">⚡</span>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                {isRu ? 'Разделение Переводчика — быстрый выбор языка:' : 'Separated Translator — Quick Language Switch:'}
              </h2>
            </div>

            {/* Switch mode: Target vs Source */}
            <div className="flex items-center bg-gray-900 p-1 rounded-xl border border-gray-700/80 text-[11px] font-black self-start sm:self-auto">
              <button
                type="button"
                onClick={() => { playSound('click'); setRibbonAssignMode('target'); }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  ribbonAssignMode === 'target' 
                    ? 'bg-emerald-600 text-white shadow' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🎯 {isRu ? 'Куда переводить' : 'Target (To)'}
              </button>
              <button
                type="button"
                onClick={() => { playSound('click'); setRibbonAssignMode('source'); }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  ribbonAssignMode === 'source' 
                    ? 'bg-sky-600 text-white shadow' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                📥 {isRu ? 'Откуда (Исходный)' : 'Source (From)'}
              </button>
            </div>
          </div>

          {/* Separated Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-900/90 p-1.5 rounded-2xl border border-gray-800">
            <button
              type="button"
              onClick={() => { playSound('click'); setLanguageCategory('all'); }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                languageCategory === 'all'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {isRu ? `Все (${TRANSLATION_LANGUAGES.length})` : `All (${TRANSLATION_LANGUAGES.length})`}
            </button>
            <button
              type="button"
              onClick={() => { playSound('click'); setLanguageCategory('standard'); }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                languageCategory === 'standard'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🌐 {isRu ? `Основные языки (${TRANSLATION_LANGUAGES.filter(l => !l.isBeta).length})` : `Main Languages (${TRANSLATION_LANGUAGES.filter(l => !l.isBeta).length})`}
            </button>
            <button
              type="button"
              onClick={() => { playSound('click'); setLanguageCategory('beta'); }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                languageCategory === 'beta'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🧪 {isRu ? `Курс язык (Бета) (${TRANSLATION_LANGUAGES.filter(l => l.isBeta).length})` : `Beta Language Courses (${TRANSLATION_LANGUAGES.filter(l => l.isBeta).length})`}
            </button>
          </div>

          {/* Horizontally scrollable country pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
            {TRANSLATION_LANGUAGES.filter(l =>
              languageCategory === 'all' ? true : languageCategory === 'beta' ? Boolean(l.isBeta) : !l.isBeta
            ).map(lang => {
              const isSelectedTarget = targetLang === lang.code;
              const isSelectedSource = sourceLang === lang.code;

              let activeBorder = lang.isBeta
                ? 'border-purple-500/40 hover:border-purple-400'
                : 'border-gray-700/80 hover:border-gray-500';
              let activeBg = lang.isBeta
                ? 'bg-purple-950/35 text-purple-100'
                : 'bg-gray-800/90 text-gray-200';

              if (ribbonAssignMode === 'target' && isSelectedTarget) {
                activeBorder = 'border-emerald-400 ring-2 ring-emerald-400/40';
                activeBg = 'bg-emerald-950/80 text-emerald-200';
              } else if (ribbonAssignMode === 'source' && isSelectedSource) {
                activeBorder = 'border-sky-400 ring-2 ring-sky-400/40';
                activeBg = 'bg-sky-950/80 text-sky-200';
              }

              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSwitchLanguage(lang.code, ribbonAssignMode === 'target')}
                  className={`shrink-0 flex items-center space-x-2 px-3 py-2 rounded-2xl border-2 transition-all cursor-pointer shadow-md ${activeBg} ${activeBorder}`}
                  title={`${isRu ? lang.nameRu : lang.nameEn} (${isRu ? lang.countryRu : lang.countryEn})`}
                >
                  <img 
                    src={`https://flagcdn.com/w40/${lang.flagCode}.png`} 
                    alt="" 
                    className="w-5 h-3.5 object-cover rounded-xs shadow-xs shrink-0" 
                  />
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-black leading-none ${lang.fontClass || ''}`}>
                        {lang.code.toUpperCase()} • {isRu ? lang.nameRu : lang.nameEn}
                      </span>
                      {lang.isBeta && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-500/30 border border-purple-400/50 text-[9px] font-black text-purple-200 uppercase">
                          BETA
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold block truncate max-w-[140px] leading-tight mt-0.5">
                      {isRu ? lang.countryRu : lang.countryEn}
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center space-x-1 pl-1">
                    {isSelectedTarget && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" title={isRu ? 'Текущий целевой язык' : 'Current target'}></span>
                    )}
                    {isSelectedSource && (
                      <span className="w-2 h-2 rounded-full bg-sky-400" title={isRu ? 'Текущий исходный язык' : 'Current source'}></span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold pt-1 border-t border-gray-800">
            <span>
              {isRu ? 'Основные языки и курсы языка Бета разделены — нажмите для мгновенного выбора!' : 'Main & Beta language courses are separated — tap to switch instantly!'}
            </span>
            <span className="text-sky-400">
              {ribbonAssignMode === 'target' 
                ? (isRu ? `Приключить ➔ Целевой (${targetLang.toUpperCase()})` : `Assigning ➔ Target (${targetLang.toUpperCase()})`)
                : (isRu ? `Приключить ➔ Исходный (${sourceLang.toUpperCase()})` : `Assigning ➔ Source (${sourceLang.toUpperCase()})`)}
            </span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MAIN TRANSLATOR CARD                                           */}
        {/* ============================================================== */}
        <div className="bg-duo-card border-2 border-gray-700 rounded-3xl p-4 sm:p-6 shadow-2xl mb-8 space-y-5">
          
          {/* DIRECTION PREVIEW BAR */}
          <div className="bg-black/40 border border-gray-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-xs font-black">
              <span className="text-gray-400">{isRu ? 'Направление:' : 'Route:'}</span>
              <span className="px-2.5 py-1 rounded-xl bg-sky-950/80 border border-sky-500/40 text-sky-300 flex items-center space-x-1.5">
                <img src={`https://flagcdn.com/w40/${getSourceOption().flagCode}.png`} className="w-4 h-3 rounded-xs" alt="" />
                <span>{isRu ? getSourceOption().nameRu : getSourceOption().nameEn}</span>
              </span>
              <span className="text-gray-400">➔</span>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center space-x-1.5">
                <img src={`https://flagcdn.com/w40/${getTargetOption().flagCode}.png`} className="w-4 h-3 rounded-xs" alt="" />
                <span>{isRu ? getTargetOption().nameRu : getTargetOption().nameEn}</span>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                <span>🌐</span>
                <span>{isRu ? 'Онлайн Gemini AI • Без VPN и с VPN' : 'Online Gemini AI • With & Without VPN'}</span>
              </span>
            </div>
          </div>

          {/* COUNTRY & LANGUAGE SELECTORS BAR */}
          <div className="bg-gray-800/90 border border-gray-700/80 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-inner">
            
            {/* SOURCE LANGUAGE / COUNTRY SELECTOR */}
            <div className="flex-1 flex flex-col space-y-1">
              <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 pl-1">
                {isRu ? 'Исходный язык страны:' : 'From country language:'}
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { 
                    playSound('click'); 
                    setShowSourceSelector(!showSourceSelector); 
                    setShowTargetSelector(false); 
                    setSelectorSearch('');
                  }}
                  className="w-full p-2.5 sm:p-3 bg-gray-900/90 hover:bg-gray-850 border-2 border-gray-700 hover:border-sky-500 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer shadow-md group"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <img 
                      src={`https://flagcdn.com/w40/${getSourceOption().flagCode}.png`} 
                      alt="" 
                      className="w-6 h-4 object-cover rounded-sm shadow-sm shrink-0" 
                    />
                    <div className="truncate">
                      <span className="font-black text-sm text-white block truncate">
                        {isRu ? getSourceOption().nameRu : getSourceOption().nameEn}
                      </span>
                      <span className="text-[11px] text-gray-400 font-bold block truncate">
                        {isRu ? getSourceOption().countryRu : getSourceOption().countryEn}
                      </span>
                    </div>
                  </div>
                  <span className="text-gray-400 group-hover:text-white transition-colors text-xs font-black">▼</span>
                </button>

                {/* Dropdown Drawer for Source Language */}
                {showSourceSelector && (
                  <div className="absolute top-full left-0 mt-2 w-full sm:w-80 bg-gray-900 border-2 border-sky-500/60 rounded-2xl p-3 z-50 shadow-2xl max-h-80 overflow-y-auto no-scrollbar space-y-2">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                      <p className="text-[10px] uppercase font-black text-sky-400 tracking-wider">
                        {isRu ? 'Приключить исходный язык' : 'Select Source Language'}
                      </p>
                      <button onClick={() => setShowSourceSelector(false)} className="text-gray-400 hover:text-white text-xs">✕</button>
                    </div>

                    <input 
                      type="text"
                      value={selectorSearch}
                      onChange={(e) => setSelectorSearch(e.target.value)}
                      placeholder={isRu ? 'Поиск страны или языка...' : 'Search country or language...'}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-sky-500"
                    />

                    <div className="space-y-3">
                      {[
                        {
                          title: isRu ? '🌐 Основные языки мира и СНГ' : '🌐 Main World & CIS Languages',
                          isBetaGroup: false,
                          items: TRANSLATION_LANGUAGES.filter(l => !l.isBeta)
                        },
                        {
                          title: isRu ? '🧪 Курсы языков (Бета)' : '🧪 Beta Language Courses',
                          isBetaGroup: true,
                          items: TRANSLATION_LANGUAGES.filter(l => Boolean(l.isBeta))
                        }
                      ].map(group => {
                        const q = selectorSearch.toLowerCase();
                        const filtered = group.items.filter(l =>
                          l.nameRu.toLowerCase().includes(q) ||
                          l.nameEn.toLowerCase().includes(q) ||
                          l.countryRu.toLowerCase().includes(q) ||
                          l.countryEn.toLowerCase().includes(q) ||
                          l.code.toLowerCase().includes(q)
                        );
                        if (filtered.length === 0) return null;
                        return (
                          <div key={group.title} className="space-y-1">
                            <p className={`text-[10px] font-black uppercase tracking-wider px-1 ${group.isBetaGroup ? 'text-purple-300' : 'text-sky-300'}`}>
                              {group.title}
                            </p>
                            {filtered.map(lang => (
                              <button
                                key={lang.code}
                                type="button"
                                onClick={() => {
                                  playSound('select');
                                  setSourceLang(lang.code);
                                  setShowSourceSelector(false);
                                }}
                                className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                                  sourceLang === lang.code ? 'bg-sky-600 text-white font-black' : 'hover:bg-gray-800 text-gray-200'
                                }`}
                              >
                                <div className="flex items-center space-x-2.5">
                                  <img src={`https://flagcdn.com/w40/${lang.flagCode}.png`} className="w-5 h-3.5 rounded-sm object-cover" alt="" />
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-xs font-bold block ${lang.fontClass || ''}`}>{isRu ? lang.nameRu : lang.nameEn}</span>
                                      {lang.isBeta && (
                                        <span className="px-1 py-0.2 rounded bg-purple-500/30 border border-purple-400/50 text-[8px] font-black text-purple-200 uppercase">BETA</span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 block">{isRu ? lang.countryRu : lang.countryEn}</span>
                                  </div>
                                </div>
                                {sourceLang === lang.code && <span className="text-xs">✓</span>}
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SWAP / SWITCH BUTTON: "Приключить / поменять язык местами" (⇄) */}
            <div className="flex flex-col items-center justify-center shrink-0 self-center">
              <button
                type="button"
                onClick={handleSwapLanguages}
                className={`w-12 h-12 rounded-2xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-black flex items-center justify-center border-b-4 border-sky-700 active:border-b-0 active:translate-y-1 transition-all shadow-lg cursor-pointer ${
                  isSwapping ? 'rotate-180 scale-110' : ''
                }`}
                title={isRu ? 'Приключить / поменять языки стран местами (⇄)' : 'Swap languages (⇄)'}
              >
                <span className="text-xl leading-none">⇄</span>
              </button>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">
                {isRu ? 'Приключить' : 'Swap'}
              </span>
            </div>

            {/* TARGET LANGUAGE / COUNTRY SELECTOR */}
            <div className="flex-1 flex flex-col space-y-1">
              <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 pl-1">
                {isRu ? 'Язык страны перевода (Куда):' : 'Target country language:'}
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { 
                    playSound('click'); 
                    setShowTargetSelector(!showTargetSelector); 
                    setShowSourceSelector(false); 
                    setSelectorSearch('');
                  }}
                  className="w-full p-2.5 sm:p-3 bg-gray-900/90 hover:bg-gray-850 border-2 border-gray-700 hover:border-emerald-500 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer shadow-md group"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <img 
                      src={`https://flagcdn.com/w40/${getTargetOption().flagCode}.png`} 
                      alt="" 
                      className="w-6 h-4 object-cover rounded-sm shadow-sm shrink-0" 
                    />
                    <div className="truncate">
                      <span className={`font-black text-sm text-white block truncate ${getTargetOption().fontClass || ''}`}>
                        {isRu ? getTargetOption().nameRu : getTargetOption().nameEn}
                      </span>
                      <span className="text-[11px] text-gray-400 font-bold block truncate">
                        {isRu ? getTargetOption().countryRu : getTargetOption().countryEn}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <span className="text-gray-400 group-hover:text-white transition-colors text-xs font-black">▼</span>
                  </div>
                </button>

                {/* Dropdown Drawer for Target Language */}
                {showTargetSelector && (
                  <div className="absolute top-full right-0 mt-2 w-full sm:w-80 bg-gray-900 border-2 border-emerald-500/60 rounded-2xl p-3 z-50 shadow-2xl max-h-80 overflow-y-auto no-scrollbar space-y-2">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                      <p className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">
                        {isRu ? 'Приключить язык перевода' : 'Translate To (Country Language)'}
                      </p>
                      <button onClick={() => setShowTargetSelector(false)} className="text-gray-400 hover:text-white text-xs">✕</button>
                    </div>

                    <input 
                      type="text"
                      value={selectorSearch}
                      onChange={(e) => setSelectorSearch(e.target.value)}
                      placeholder={isRu ? 'Поиск страны или языка...' : 'Search country or language...'}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />

                    <div className="space-y-3">
                      {[
                        {
                          title: isRu ? '🌐 Основные языки мира и СНГ' : '🌐 Main World & CIS Languages',
                          isBetaGroup: false,
                          items: TRANSLATION_LANGUAGES.filter(l => !l.isBeta)
                        },
                        {
                          title: isRu ? '🧪 Курсы языков (Бета)' : '🧪 Beta Language Courses',
                          isBetaGroup: true,
                          items: TRANSLATION_LANGUAGES.filter(l => Boolean(l.isBeta))
                        }
                      ].map(group => {
                        const q = selectorSearch.toLowerCase();
                        const filtered = group.items.filter(l =>
                          l.nameRu.toLowerCase().includes(q) ||
                          l.nameEn.toLowerCase().includes(q) ||
                          l.countryRu.toLowerCase().includes(q) ||
                          l.countryEn.toLowerCase().includes(q) ||
                          l.code.toLowerCase().includes(q)
                        );
                        if (filtered.length === 0) return null;
                        return (
                          <div key={group.title} className="space-y-1">
                            <p className={`text-[10px] font-black uppercase tracking-wider px-1 ${group.isBetaGroup ? 'text-purple-300' : 'text-emerald-300'}`}>
                              {group.title}
                            </p>
                            {filtered.map(lang => (
                              <button
                                key={lang.code}
                                type="button"
                                onClick={() => {
                                  playSound('select');
                                  setTargetLang(lang.code);
                                  setShowTargetSelector(false);
                                }}
                                className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                                  targetLang === lang.code ? 'bg-emerald-600 text-white font-black' : 'hover:bg-gray-800 text-gray-200'
                                }`}
                              >
                                <div className="flex items-center space-x-2.5">
                                  <img src={`https://flagcdn.com/w40/${lang.flagCode}.png`} className="w-5 h-3.5 rounded-sm object-cover" alt="" />
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-xs font-bold block ${lang.fontClass || ''}`}>{isRu ? lang.nameRu : lang.nameEn}</span>
                                      {lang.isBeta && (
                                        <span className="px-1 py-0.2 rounded bg-purple-500/30 border border-purple-400/50 text-[8px] font-black text-purple-200 uppercase">BETA</span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 block">{isRu ? lang.countryRu : lang.countryEn}</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1.5">
                                  {targetLang === lang.code && <span className="text-xs">✓</span>}
                                </div>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* INPUT TEXTAREA */}
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              dir={getSourceOption().dir || 'ltr'}
              placeholder={isRu ? "Введите текст или выберите быструю фразу для перевода..." : "Enter text to translate or tap a quick phrase..."}
              className={`w-full h-36 bg-gray-800 border-2 border-gray-700 focus:border-sky-500 rounded-2xl p-4 text-base md:text-lg font-bold text-white focus:outline-none resize-none placeholder-gray-500 transition-colors shadow-inner ${getSourceOption().fontClass || ''}`}
            />
            {inputText && (
              <button
                type="button"
                onClick={() => { playSound('click'); setInputText(''); }}
                className="absolute top-3 right-3 p-1.5 bg-gray-700/80 hover:bg-gray-600 rounded-lg text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                title={isRu ? 'Очистить текст' : 'Clear text'}
              >
                ✕
              </button>
            )}
            <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold px-1 mt-1">
              <span>{inputText.length} {isRu ? 'символов' : 'characters'}</span>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard?.readText();
                    if (text) {
                      setInputText(text);
                      playSound('success');
                      setToast(isRu ? 'Текст вставлен из буфера!' : 'Pasted from clipboard!');
                    }
                  } catch {
                    setToast(isRu ? 'Не удалось прочитать буфер обмена' : 'Clipboard access denied');
                  }
                }}
                className="hover:text-sky-400 transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <span>📋</span>
                <span>{isRu ? 'Вставить' : 'Paste'}</span>
              </button>
            </div>
          </div>

          {/* QUICK PHRASES PILLS */}
          <div>
            <p className="text-[11px] font-black uppercase text-gray-400 mb-2 tracking-wider">
              {isRu ? 'Быстрые фразы для перевода:' : 'Quick translation phrases:'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {quickPhrases.map((phrase, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setInputText(phrase);
                    handleTranslate(phrase);
                  }}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-sky-950/60 hover:text-sky-300 hover:border-sky-500/50 border border-gray-700 rounded-xl text-xs font-bold text-gray-300 transition-all cursor-pointer"
                >
                  "{phrase}"
                </button>
              ))}
            </div>
          </div>

          {/* TRANSLATE ACTION BUTTON */}
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={() => handleTranslate()}
              disabled={isLoading || !inputText.trim()}
              className={`w-full sm:w-auto px-12 py-4 rounded-2xl font-black text-white uppercase tracking-widest text-sm sm:text-base flex items-center justify-center space-x-3 transition-all shadow-xl cursor-pointer ${
                isLoading || !inputText.trim()
                  ? 'bg-gray-700 opacity-60 cursor-not-allowed border-gray-800'
                  : 'bg-duo-green hover:brightness-110 border-b-4 border-duo-greenDark active:border-b-0 active:translate-y-1'
              }`}
            >
              <span className="text-xl">{isLoading ? '⏳' : '⚡'}</span>
              <span>
                {isLoading 
                  ? (isRu ? 'Переводим...' : 'Translating...') 
                  : (isRu ? 'ПЕРЕВЕСТИ СЕЙЧАС' : 'TRANSLATE NOW')}
              </span>
            </button>
          </div>

          {/* TRANSLATION OUTPUT RESULT CARD */}
          {outputText && (
            <div className="bg-gradient-to-b from-gray-850 to-gray-900 border-2 border-sky-500/50 rounded-2xl p-5 relative animate-in fade-in slide-in-from-bottom-2 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-gray-700/60 pb-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center space-x-1.5">
                  <span>✨</span>
                  <span>{isRu ? 'Результат перевода' : 'Translation Result'}</span>
                  <span className="text-gray-400 text-[10px]">({getLangName(targetLang)})</span>
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(outputText);
                      playSound('success');
                      setToast(isRu ? 'Скопировано в буфер обмена! 📋' : 'Copied to clipboard! 📋');
                    }}
                    className="px-3 py-1.5 bg-gray-700/80 hover:bg-gray-600 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                    title={isRu ? 'Скопировать' : 'Copy'}
                  >
                    <span>📋</span>
                    <span>{isRu ? 'Копировать' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => speakText(outputText, targetLang, false, preferredVoice, voiceProvider)}
                    className="p-2 bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 rounded-xl transition-all cursor-pointer hover:scale-110 active:scale-95"
                    title={isRu ? 'Озвучить произношение' : 'Pronounce'}
                  >
                    <VolumeIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* TRANSLATED PHRASE */}
              <p
                dir={getTargetOption().dir || 'ltr'}
                className={`text-xl sm:text-2xl font-black text-white leading-relaxed select-text ${getTargetOption().fontClass || ''}`}
              >
                {outputText}
              </p>

              {/* SOURCE METADATA BADGE */}
              {translationSourceInfo && (
                <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
                  <span className="font-bold">{translationSourceInfo}</span>
                  <span className="text-emerald-400 font-black">✓ Готово</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SEPARATED ONLINE LANGUAGES DIRECTORY (STANDARD + BETA COURSES) */}
        <div className="space-y-5">
          {/* 1. Основные языки мира и СНГ */}
          <div className="bg-gray-900/80 border border-sky-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-tight">
                  {isRu ? '🌐 Основные языки онлайн-переводчика' : '🌐 Standard Online Translator Languages'}
                </h2>
                <p className="text-xs text-gray-400 font-bold">
                  {isRu
                    ? 'Для перевода требуется подключение к интернету. Работает без VPN и использует VPN.'
                    : 'Internet connection required for translation. Works without VPN and with VPN.'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {TRANSLATION_LANGUAGES.filter(l => !l.isBeta).map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSwitchLanguage(lang.code, ribbonAssignMode === 'target')}
                  className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
                    targetLang === lang.code
                      ? 'bg-emerald-950/70 border-emerald-400 text-emerald-200'
                      : 'bg-gray-850 border-gray-700/70 hover:border-sky-500/60 text-gray-200'
                  }`}
                >
                  <img src={`https://flagcdn.com/w40/${lang.flagCode}.png`} alt="" className="w-6 h-4 rounded-xs object-cover shrink-0" />
                  <div className="min-w-0">
                    <span className={`text-xs font-black block truncate ${lang.fontClass || ''}`}>{isRu ? lang.nameRu : lang.nameEn}</span>
                    <span className="text-[10px] text-gray-400 font-bold block truncate">{isRu ? lang.countryRu : lang.countryEn}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Курсы языков (Бета) */}
          <div className="bg-gradient-to-br from-purple-950/50 via-gray-900 to-indigo-950/50 border-2 border-purple-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-black text-purple-200 uppercase tracking-tight flex items-center gap-2">
                  <span>🧪</span>
                  <span>{isRu ? 'Курс язык (Бета) — Переводчик' : 'Beta Language Courses — Translator'}</span>
                </h2>
                <p className="text-xs text-purple-200/80 font-bold">
                  {isRu
                    ? 'Эсперанто (Esperanto), Латынь (Lingua Latina), Шведский, Норвежский (Norsk), Высокий валирийский (шрифт), Клингонский (шрифт), Идиш'
                    : 'Esperanto, Latin (Lingua Latina), Swedish, Norwegian (Norsk), High Valyrian (custom font), Klingon (custom font), Yiddish'}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/50 text-[10px] font-black text-purple-200 uppercase">
                BETA • ONLINE
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {TRANSLATION_LANGUAGES.filter(l => l.isBeta).map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSwitchLanguage(lang.code, ribbonAssignMode === 'target')}
                  className={`p-3.5 rounded-2xl border-2 text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    targetLang === lang.code
                      ? 'bg-emerald-950/75 border-emerald-400 text-emerald-200'
                      : 'bg-gray-900/90 border-purple-500/35 hover:border-purple-400 text-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <img src={`https://flagcdn.com/w40/${lang.flagCode}.png`} alt="" className="w-6 h-4 rounded-xs object-cover shrink-0" />
                    <div className="min-w-0">
                      <span className={`text-sm font-black block truncate ${lang.fontClass || ''}`}>
                        {isRu ? lang.nameRu : lang.nameEn}
                      </span>
                      <span className="text-[10px] text-purple-300/80 font-bold block truncate">
                        {isRu ? lang.countryRu : lang.countryEn}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-purple-600/30 border border-purple-400/50 text-[9px] font-black text-purple-200 uppercase shrink-0">
                    BETA
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TranslatorScreen;
