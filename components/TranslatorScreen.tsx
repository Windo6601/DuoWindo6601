import React, { useState, useEffect, useRef } from 'react';
import { 
  AVAILABLE_DICTIONARY_PACKS, 
  OfflineDictionaryPack, 
  getDownloadedDictionaries, 
  saveDownloadedDictionaries,
  translateOffline
} from '../services/offlineDictionaryService';
import { translateText } from '../services/geminiService';
import { VolumeIcon, BookIcon, CloseIcon } from './Icons';

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
}

export const TRANSLATION_LANGUAGES: LanguageCountryOption[] = [
  { code: 'ru', flagCode: 'ru', nameRu: 'Русский', nameEn: 'Russian', countryRu: 'Россия', countryEn: 'Russia' },
  { code: 'en', flagCode: 'gb', nameRu: 'English', nameEn: 'English', countryRu: 'Великобритания / США', countryEn: 'United Kingdom / USA' },
  { code: 'de', flagCode: 'de', nameRu: 'Deutsch', nameEn: 'German', countryRu: 'Германия', countryEn: 'Germany' },
  { code: 'fr', flagCode: 'fr', nameRu: 'Français', nameEn: 'French', countryRu: 'Франция', countryEn: 'France' },
  { code: 'es', flagCode: 'es', nameRu: 'Español', nameEn: 'Spanish', countryRu: 'Испания', countryEn: 'Spain' },
  { code: 'zh', flagCode: 'cn', nameRu: '中文', nameEn: 'Chinese', countryRu: 'Китай', countryEn: 'China', fontClass: 'font-chinese' },
  { code: 'ja', flagCode: 'jp', nameRu: '日本語', nameEn: 'Japanese', countryRu: 'Япония', countryEn: 'Japan', fontClass: 'font-japanese' },
  { code: 'ar', flagCode: 'sa', nameRu: 'العربية', nameEn: 'Arabic', countryRu: 'Саудовская Аравия', countryEn: 'Saudi Arabia', fontClass: 'font-arabic' },
  { code: 'kk', flagCode: 'kz', nameRu: 'Қазақша', nameEn: 'Kazakh', countryRu: 'Казахстан', countryEn: 'Kazakhstan' },
  { code: 'uz', flagCode: 'uz', nameRu: "O'zbek", nameEn: 'Uzbek', countryRu: 'Узбекистан', countryEn: 'Uzbekistan' },
  { code: 'it', flagCode: 'it', nameRu: 'Italiano', nameEn: 'Italian', countryRu: 'Италия', countryEn: 'Italy' },
  { code: 'tr', flagCode: 'tr', nameRu: 'Türkçe', nameEn: 'Turkish', countryRu: 'Турция', countryEn: 'Turkey' },
  { code: 'by', flagCode: 'by', nameRu: 'Белорусский', nameEn: 'Belarusian', countryRu: 'Беларусь', countryEn: 'Belarus' },
  { code: 'kg', flagCode: 'kg', nameRu: 'Кыргызский', nameEn: 'Kyrgyz', countryRu: 'Кыргызстан', countryEn: 'Kyrgyzstan' },
  { code: 'az', flagCode: 'az', nameRu: 'Азербайджанский', nameEn: 'Azerbaijani', countryRu: 'Азербайджан', countryEn: 'Azerbaijan' },
  { code: 'am', flagCode: 'am', nameRu: 'Армянский', nameEn: 'Armenian', countryRu: 'Армения', countryEn: 'Armenia' },
  { code: 'ge', flagCode: 'ge', nameRu: 'Грузинский', nameEn: 'Georgian', countryRu: 'Грузия', countryEn: 'Georgia' },
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
  const [forceOffline, setForceOffline] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [translationSourceInfo, setTranslationSourceInfo] = useState<string>('');

  // Quick switch assign mode: whether tapping top ribbon sets Target or Source
  const [ribbonAssignMode, setRibbonAssignMode] = useState<'target' | 'source'>('target');

  // Offline dictionaries state
  const [downloadedDicts, setDownloadedDicts] = useState<string[]>(() => getDownloadedDictionaries());
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [isDownloadingAll, setIsDownloadingAll] = useState<boolean>(false);

  // Search & filter states for offline dictionaries
  const [dictionarySearch, setDictionarySearch] = useState<string>('');
  const [dictionaryFilter, setDictionaryFilter] = useState<'all' | 'downloaded' | 'available'>('all');

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
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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

  // Perform translation (Online AI with auto-fallback to Offline Dictionary, or Forced Offline Dictionary)
  const handleTranslate = async (
    textToTranslate: string = inputText,
    overrideTarget: string = targetLang,
    overrideSource: string = sourceLang
  ) => {
    const cleanText = textToTranslate.trim();
    if (!cleanText) return;

    playSound('click');
    setIsLoading(true);

    const targetOpt = TRANSLATION_LANGUAGES.find(l => l.code === overrideTarget) || getTargetOption();
    const sourceOpt = TRANSLATION_LANGUAGES.find(l => l.code === overrideSource) || getSourceOption();
    const isTargetDownloaded = downloadedDicts.includes(overrideTarget);
    const shouldUseOffline = forceOffline || !isNetworkOnline;

    if (shouldUseOffline) {
      // Offline translation mode
      setTimeout(() => {
        if (!isTargetDownloaded) {
          setToast(
            isRu
              ? `⚠️ Офлайн-словарь для «${getLangName(overrideTarget)}» ещё не скачан! Скачайте его ниже в разделе «Словари без интернета».`
              : `⚠️ Offline dictionary for "${getLangName(overrideTarget)}" is not downloaded yet! Download it below.`
          );
        }

        const offlineRes = translateOffline(cleanText, overrideSource, overrideTarget);
        setOutputText(offlineRes.translation);
        setTranslationSourceInfo(
          isRu
            ? `💾 Офлайн-перевод (Словарь DuoWindo6601 • ${offlineRes.dictionaryUsed})`
            : `💾 Offline Translation (DuoWindo6601 Dictionary • ${offlineRes.dictionaryUsed})`
        );
        playSound('success');
        setIsLoading(false);
      }, 300);
      return;
    }

    // Online Gemini AI translation with graceful offline fallback
    try {
      const targetLangName = isRu ? targetOpt.nameRu : targetOpt.nameEn;
      const sourceLangName = isRu ? sourceOpt.nameRu : sourceOpt.nameEn;
      const res = await translateText(cleanText, targetLangName, sourceLangName);
      
      setOutputText(res);
      setTranslationSourceInfo(
        isRu 
          ? `🌐 Онлайн-перевод (DuoWindo6601 Gemini AI)`
          : `🌐 Online Translation (DuoWindo6601 Gemini AI)`
      );
      playSound('success');
    } catch (err) {
      console.warn('Gemini translate failed, using offline dictionary fallback:', err);
      const offlineRes = translateOffline(cleanText, overrideSource, overrideTarget);
      setOutputText(offlineRes.translation);
      setTranslationSourceInfo(
        isRu
          ? `💾 Офлайн-перевод (Резервный словарь без интернета)`
          : `💾 Offline Translation (Backup offline dictionary)`
      );
      playSound('success');
    } finally {
      setIsLoading(false);
    }
  };

  // Simulated live download of a dictionary pack with realistic progress bar
  const handleDownloadDictionary = (pack: OfflineDictionaryPack, andSwitchToTarget: boolean = false) => {
    if (downloadProgress[pack.id] !== undefined) return;

    playSound('click');
    setToast(
      isRu 
        ? `📥 Начало скачивания офлайн-словаря: ${pack.languageNameRu} (${pack.sizeMb} МБ)...` 
        : `📥 Downloading offline dictionary: ${pack.languageNameEn} (${pack.sizeMb} MB)...`
    );

    if (andSwitchToTarget) {
      setTargetLang(pack.id);
      topTranslatorRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    setDownloadProgress(prev => ({ ...prev, [pack.id]: 5 }));

    let current = 5;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 18) + 12;
      if (current >= 100) {
        clearInterval(interval);
        setDownloadProgress(prev => {
          const next = { ...prev };
          delete next[pack.id];
          return next;
        });
        setDownloadedDicts(prev => {
          const updated = Array.from(new Set([...prev, pack.id]));
          saveDownloadedDictionaries(updated);
          return updated;
        });
        playSound('streak_update');
        setToast(
          isRu 
            ? `✅ Словарь «${pack.languageNameRu}» (${pack.sizeMb} МБ) успешно сохранён в память устройства! Теперь доступен без интернета.` 
            : `✅ "${pack.languageNameEn}" dictionary (${pack.sizeMb} MB) saved! Ready for offline use.`
        );
      } else {
        setDownloadProgress(prev => ({ ...prev, [pack.id]: current }));
      }
    }, 160);
  };

  // Delete downloaded dictionary
  const handleDeleteDictionary = (pack: OfflineDictionaryPack) => {
    playSound('click');
    setDownloadedDicts(prev => {
      const updated = prev.filter(id => id !== pack.id);
      saveDownloadedDictionaries(updated);
      return updated;
    });
    setToast(
      isRu 
        ? `🗑️ Словарь «${pack.languageNameRu}» удален из памяти устройства` 
        : `🗑️ "${pack.languageNameEn}" dictionary removed from device storage`
    );
  };

  // Download all available dictionaries
  const handleDownloadAll = () => {
    const unDownloaded = AVAILABLE_DICTIONARY_PACKS.filter(p => !downloadedDicts.includes(p.id));
    if (unDownloaded.length === 0) {
      setToast(isRu ? 'Все словари уже скачаны на ваше устройство!' : 'All dictionaries are already downloaded!');
      return;
    }

    playSound('select');
    setIsDownloadingAll(true);
    setToast(
      isRu 
        ? `📥 Скачивание всех словарей (${unDownloaded.length} пакетов)...` 
        : `📥 Downloading all dictionaries (${unDownloaded.length} packs)...`
    );

    unDownloaded.forEach((p, index) => {
      setTimeout(() => {
        handleDownloadDictionary(p);
        if (index === unDownloaded.length - 1) {
          setIsDownloadingAll(false);
        }
      }, index * 350);
    });
  };

  // Clear all downloaded dictionaries
  const handleClearAllDictionaries = () => {
    playSound('click');
    const confirmed = window.confirm(
      isRu 
        ? 'Вы уверены, что хотите удалить все скачанные офлайн-словари из памяти устройства?' 
        : 'Are you sure you want to remove all offline dictionaries from device storage?'
    );
    if (!confirmed) return;

    // Reset to defaults
    const reset = ['ru', 'en'];
    setDownloadedDicts(reset);
    saveDownloadedDictionaries(reset);
    setToast(isRu ? '🗑️ Кэш словарей очищен. Оставлены базовые RU и EN.' : '🗑️ Cache cleared. Core RU and EN retained.');
  };

  // Calculate memory storage used
  const totalStorageUsedMb = AVAILABLE_DICTIONARY_PACKS
    .filter(p => downloadedDicts.includes(p.id))
    .reduce((sum, p) => sum + p.sizeMb, 0)
    .toFixed(1);

  // Filtered dictionary packs
  const filteredDictionaryPacks = AVAILABLE_DICTIONARY_PACKS.filter(pack => {
    const matchesSearch = 
      pack.languageNameRu.toLowerCase().includes(dictionarySearch.toLowerCase()) ||
      pack.languageNameEn.toLowerCase().includes(dictionarySearch.toLowerCase()) ||
      pack.countryNameRu.toLowerCase().includes(dictionarySearch.toLowerCase()) ||
      pack.countryNameEn.toLowerCase().includes(dictionarySearch.toLowerCase()) ||
      pack.nativeName.toLowerCase().includes(dictionarySearch.toLowerCase()) ||
      pack.id.toLowerCase().includes(dictionarySearch.toLowerCase());

    if (!matchesSearch) return false;

    if (dictionaryFilter === 'downloaded') {
      return downloadedDicts.includes(pack.id);
    }
    if (dictionaryFilter === 'available') {
      return !downloadedDicts.includes(pack.id);
    }
    return true;
  });

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
            {/* OFFLINE MODE TOGGLE */}
            <button
              onClick={() => {
                playSound('click');
                const nextState = !forceOffline;
                setForceOffline(nextState);
                setToast(
                  nextState
                    ? (isRu ? '💾 Офлайн-режим перевода включен! Перевод выполняется через локальные словари.' : '💾 Offline translation mode enabled! Using local dictionaries.')
                    : (isRu ? '🌐 Офлайн-режим выключен. Используется Gemini AI.' : '🌐 Offline mode disabled. Using Gemini AI.')
                );
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 border transition-all cursor-pointer ${
                forceOffline || !isNetworkOnline
                  ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 shadow-md'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750'
              }`}
              title={isRu ? 'Включить принудительный перевод через офлайн-словари' : 'Toggle offline dictionary translation'}
            >
              <span>{forceOffline || !isNetworkOnline ? '💾' : '🌐'}</span>
              <span>
                {!isNetworkOnline 
                  ? (isRu ? 'Нет сети (Офлайн)' : 'Offline (No network)') 
                  : forceOffline 
                    ? (isRu ? 'Режим: Офлайн-словари' : 'Mode: Offline Dicts') 
                    : (isRu ? 'Режим: Gemini AI' : 'Mode: Gemini AI')}
              </span>
            </button>
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
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {isRu ? 'Офлайн-словари 💾' : 'Offline Dictionaries 💾'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-300 font-bold mt-1">
                {isRu 
                  ? 'Приключайте языки стран перевода ⇄ и переводите без интернета с помощью скачанных словарей' 
                  : 'Switch country languages for translation ⇄ and translate offline using downloaded dictionaries'}
              </p>
            </div>
          </div>
          <div className="text-3xl hidden sm:block animate-bounce select-none">🦉</div>
        </div>

        {/* ============================================================== */}
        {/* FAST COUNTRY SWITCH RIBBON: "Быстро приключить язык стран перевода" */}
        {/* ============================================================== */}
        <div className="bg-gray-850 border-2 border-sky-500/40 rounded-3xl p-4 sm:p-5 mb-6 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-amber-400 text-lg">⚡</span>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                {isRu ? 'Быстро приключить язык стран перевода:' : 'Quick-Switch Country Language:'}
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

          {/* Horizontally scrollable country pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
            {TRANSLATION_LANGUAGES.map(lang => {
              const isSelectedTarget = targetLang === lang.code;
              const isSelectedSource = sourceLang === lang.code;
              const isDownloaded = downloadedDicts.includes(lang.code);

              let activeBorder = 'border-gray-700/80 hover:border-gray-500';
              let activeBg = 'bg-gray-800/90 text-gray-200';

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
                    <span className="text-xs font-black block leading-none">
                      {lang.code.toUpperCase()} • {isRu ? lang.nameRu : lang.nameEn}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold block truncate max-w-[110px] leading-tight">
                      {isRu ? lang.countryRu : lang.countryEn}
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center space-x-1 pl-1">
                    {isDownloaded && (
                      <span className="text-[10px]" title={isRu ? 'Офлайн-словарь скачан' : 'Offline dictionary downloaded'}>
                        💾
                      </span>
                    )}
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
              {isRu ? 'Нажмите на любую страну выше для мгновенного приключения языка!' : 'Tap any country above to instantly switch translation language!'}
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
              {downloadedDicts.includes(targetLang) ? (
                <span className="text-[11px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <span>💾</span>
                  <span>{isRu ? 'Офлайн-словарь активен' : 'Offline Dict Active'}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const pack = AVAILABLE_DICTIONARY_PACKS.find(p => p.id === targetLang);
                    if (pack) handleDownloadDictionary(pack);
                  }}
                  className="text-[11px] font-black text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 px-2 py-0.5 rounded-full transition-all cursor-pointer flex items-center space-x-1"
                >
                  <span>📥</span>
                  <span>{isRu ? 'Скачать для офлайна' : 'Download for offline'}</span>
                </button>
              )}
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

                    <div className="space-y-1">
                      {TRANSLATION_LANGUAGES
                        .filter(l => 
                          l.nameRu.toLowerCase().includes(selectorSearch.toLowerCase()) ||
                          l.nameEn.toLowerCase().includes(selectorSearch.toLowerCase()) ||
                          l.countryRu.toLowerCase().includes(selectorSearch.toLowerCase()) ||
                          l.countryEn.toLowerCase().includes(selectorSearch.toLowerCase())
                        )
                        .map(lang => (
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
                                <span className="text-xs font-bold block">{isRu ? lang.nameRu : lang.nameEn}</span>
                                <span className="text-[10px] text-gray-400 block">{isRu ? lang.countryRu : lang.countryEn}</span>
                              </div>
                            </div>
                            {sourceLang === lang.code && <span className="text-xs">✓</span>}
                          </button>
                        ))}
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
                      <span className="font-black text-sm text-white block truncate">
                        {isRu ? getTargetOption().nameRu : getTargetOption().nameEn}
                      </span>
                      <span className="text-[11px] text-gray-400 font-bold block truncate">
                        {isRu ? getTargetOption().countryRu : getTargetOption().countryEn}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    {downloadedDicts.includes(targetLang) && (
                      <span className="bg-emerald-950 text-emerald-400 text-[10px] font-black px-1.5 py-0.5 rounded border border-emerald-500/40">
                        {isRu ? 'Офлайн ✅' : 'Offline ✅'}
                      </span>
                    )}
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

                    <div className="space-y-1">
                      {TRANSLATION_LANGUAGES
                        .filter(l => 
                          l.nameRu.toLowerCase().includes(selectorSearch.toLowerCase()) ||
                          l.nameEn.toLowerCase().includes(selectorSearch.toLowerCase()) ||
                          l.countryRu.toLowerCase().includes(selectorSearch.toLowerCase()) ||
                          l.countryEn.toLowerCase().includes(selectorSearch.toLowerCase())
                        )
                        .map(lang => (
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
                                <span className="text-xs font-bold block">{isRu ? lang.nameRu : lang.nameEn}</span>
                                <span className="text-[10px] text-gray-400 block">{isRu ? lang.countryRu : lang.countryEn}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              {downloadedDicts.includes(lang.code) && (
                                <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-1.5 py-0.5 rounded">💾</span>
                              )}
                              {targetLang === lang.code && <span className="text-xs">✓</span>}
                            </div>
                          </button>
                        ))}
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
              placeholder={isRu ? "Введите текст или выберите быструю фразу для перевода..." : "Enter text to translate or tap a quick phrase..."}
              className="w-full h-36 bg-gray-800 border-2 border-gray-700 focus:border-sky-500 rounded-2xl p-4 text-base md:text-lg font-bold text-white focus:outline-none resize-none placeholder-gray-500 transition-colors shadow-inner"
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
              <p className={`text-xl sm:text-2xl font-black text-white leading-relaxed select-text ${getTargetOption().fontClass || ''}`}>
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

        {/* ============================================================== */}
        {/* MAJOR SECTION: «СЛОВАРИ ДЛЯ ПЕРЕВОДА БЕЗ ИНТЕРНЕТА» (OFFLINE DICTIONARIES) */}
        {/* ============================================================== */}
        <div className="bg-gradient-to-b from-gray-900 via-gray-850 to-gray-900 border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
            <div className="flex items-start space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl shadow-inner shrink-0">
                💾
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                    {isRu ? 'Словари для перевода без интернета' : 'Offline Translation Dictionaries'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    PWA Офлайн
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 font-bold mt-1">
                  {isRu 
                    ? 'Скачивайте словари стран на устройство и приключайте язык перевода для работы без интернета в поездках и при слабой связи.'
                    : 'Download country dictionaries to device and switch translation languages offline while traveling.'}
                </p>
              </div>
            </div>

            {/* BULK ACTION: DOWNLOAD ALL */}
            <div className="flex items-center space-x-2 shrink-0 self-start md:self-center">
              <button
                type="button"
                onClick={handleDownloadAll}
                disabled={isDownloadingAll}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all flex items-center space-x-2 shadow-lg cursor-pointer"
              >
                <span>📥</span>
                <span>{isRu ? 'Скачать все словари' : 'Download All Dictionaries'}</span>
              </button>
            </div>
          </div>

          {/* STORAGE STATS & CACHE MANAGEMENT BAR */}
          <div className="bg-black/50 border border-gray-800 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-gray-300">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-1.5">
                <span className="text-emerald-400">📦</span>
                <span>{isRu ? 'Скачано словарей:' : 'Downloaded:'}</span>
                <span className="text-white font-black">{downloadedDicts.length} / {AVAILABLE_DICTIONARY_PACKS.length}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-sky-400">💾</span>
                <span>{isRu ? 'Память устройства:' : 'Storage Used:'}</span>
                <span className="text-white font-black">{totalStorageUsedMb} МБ</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-[11px] text-gray-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{isRu ? 'Кэш PWA DuoWindo6601' : 'PWA Cache Ready'}</span>
              </div>
              <button
                type="button"
                onClick={handleClearAllDictionaries}
                className="text-[11px] text-gray-400 hover:text-rose-400 underline cursor-pointer"
              >
                {isRu ? 'Очистить кэш' : 'Clear cache'}
              </button>
            </div>
          </div>

          {/* SEARCH & FILTER CONTROLS */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                value={dictionarySearch}
                onChange={(e) => setDictionarySearch(e.target.value)}
                placeholder={isRu ? "🔍 Поиск словаря по стране или языку..." : "🔍 Search dictionary by country or language..."}
                className="w-full bg-gray-800 border-2 border-gray-700 focus:border-emerald-500 rounded-xl px-4 py-2 text-xs font-bold text-white placeholder-gray-500 focus:outline-none transition-colors"
              />
              {dictionarySearch && (
                <button
                  type="button"
                  onClick={() => setDictionarySearch('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter tabs */}
            <div className="flex items-center bg-gray-800 p-1 rounded-xl border border-gray-700 text-xs font-black shrink-0">
              <button
                type="button"
                onClick={() => setDictionaryFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  dictionaryFilter === 'all' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                {isRu ? 'Все словари' : 'All'} ({AVAILABLE_DICTIONARY_PACKS.length})
              </button>
              <button
                type="button"
                onClick={() => setDictionaryFilter('downloaded')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  dictionaryFilter === 'downloaded' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                {isRu ? 'Скачанные ✅' : 'Downloaded ✅'} ({downloadedDicts.length})
              </button>
              <button
                type="button"
                onClick={() => setDictionaryFilter('available')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  dictionaryFilter === 'available' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                {isRu ? 'Доступные 📥' : 'Available 📥'}
              </button>
            </div>
          </div>

          {/* GRID OF DICTIONARY PACKAGES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDictionaryPacks.map(pack => {
              const isDownloaded = downloadedDicts.includes(pack.id);
              const progress = downloadProgress[pack.id];
              const isCurrentlyDownloading = progress !== undefined;
              const isCurrentTarget = targetLang === pack.id;
              const isCurrentSource = sourceLang === pack.id;

              return (
                <div
                  key={pack.id}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3.5 relative overflow-hidden ${
                    isCurrentTarget
                      ? 'bg-gradient-to-br from-emerald-950/80 via-gray-850 to-gray-900 border-emerald-400 shadow-xl ring-2 ring-emerald-500/30'
                      : isDownloaded 
                        ? 'bg-gray-850/90 border-emerald-500/50 shadow-md' 
                        : 'bg-gray-850/50 border-gray-700/70 hover:border-gray-600'
                  }`}
                >
                  {/* Top card info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <img 
                        src={`https://flagcdn.com/w80/${pack.countryCode}.png`} 
                        alt="" 
                        className="w-11 h-7.5 object-cover rounded-md shadow-sm shrink-0" 
                      />
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-black text-sm sm:text-base text-white truncate">
                            {isRu ? pack.languageNameRu : pack.languageNameEn}
                          </h3>
                          <span className="text-[10px] bg-gray-700 text-gray-300 font-black px-1.5 py-0.5 rounded uppercase shrink-0">
                            {pack.sizeMb} МБ
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-bold truncate">
                          {isRu ? pack.countryNameRu : pack.countryNameEn} • {pack.nativeName}
                        </p>
                      </div>
                    </div>

                    {/* Status badge */}
                    {isDownloaded ? (
                      <span className="bg-emerald-950/80 text-emerald-300 text-[10px] font-black px-2 py-1 rounded-full border border-emerald-500/40 shrink-0 flex items-center space-x-1">
                        <span>✅</span>
                        <span>{isRu ? 'Скачано' : 'Downloaded'}</span>
                      </span>
                    ) : (
                      <span className="bg-gray-800 text-gray-400 text-[10px] font-black px-2 py-1 rounded-full border border-gray-700 shrink-0 flex items-center space-x-1">
                        <span>📥</span>
                        <span>{isRu ? 'Не скачано' : 'Not downloaded'}</span>
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-300 font-medium leading-relaxed">
                    {isRu ? pack.descriptionRu : pack.descriptionEn}
                  </p>

                  {/* Word count & vocabulary topics */}
                  <div className="text-[11px] text-gray-400 font-bold flex items-center justify-between border-t border-gray-800/80 pt-2">
                    <span>📚 {pack.wordCount}</span>
                    <span className="text-emerald-400 text-[10px] uppercase font-black tracking-wider">
                      {isDownloaded ? (isRu ? 'Офлайн активен' : 'Offline Ready') : (isRu ? 'Офлайн пакет' : 'Offline Pack')}
                    </span>
                  </div>

                  {/* DOWNLOAD PROGRESS BAR */}
                  {isCurrentlyDownloading && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[10px] font-black text-emerald-400">
                        <span>{isRu ? 'Скачивание офлайн-словаря...' : 'Downloading pack...'}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-emerald-500/30">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-200" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* ACTION BUTTONS: "Приключить язык перевода" */}
                  <div className="pt-2 border-t border-gray-800 flex flex-wrap items-center justify-between gap-2">
                    {isDownloaded ? (
                      <>
                        {/* 1. PRIMARY BUTTON: «ПРИКЛЮЧИТЬ ЭТОТ ЯЗЫК ПЕРЕВОДА ⇄» */}
                        <button
                          type="button"
                          onClick={() => {
                            playSound('select');
                            setTargetLang(pack.id);
                            setToast(
                              isRu 
                                ? `⇄ Язык страны перевода приключен: ${pack.languageNameRu} (${pack.countryNameRu})!` 
                                : `⇄ Translation language switched to: ${pack.languageNameEn} (${pack.countryNameEn})!`
                            );
                            topTranslatorRef.current?.scrollIntoView({ behavior: 'smooth' });
                            if (inputText.trim()) {
                              setTimeout(() => handleTranslate(inputText, pack.id), 200);
                            }
                          }}
                          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-md ${
                            isCurrentTarget
                              ? 'bg-emerald-600 text-white border-2 border-emerald-300'
                              : 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 hover:border-emerald-400'
                          }`}
                        >
                          <span>⇄</span>
                          <span>
                            {isCurrentTarget 
                              ? (isRu ? '✓ Приключен для перевода' : '✓ Active For Translation')
                              : (isRu ? 'Приключить этот язык перевода' : 'Switch To This Language')}
                          </span>
                        </button>

                        {/* 2. SECONDARY BUTTON: As source language */}
                        <button
                          type="button"
                          onClick={() => {
                            playSound('select');
                            setSourceLang(pack.id);
                            setToast(
                              isRu 
                                ? `📥 Исходный язык изменен на: ${pack.languageNameRu}!` 
                                : `📥 Source language set to: ${pack.languageNameEn}!`
                            );
                            topTranslatorRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                            isCurrentSource
                              ? 'bg-sky-600 text-white'
                              : 'bg-gray-800 hover:bg-gray-750 text-gray-300 border border-gray-700'
                          }`}
                          title={isRu ? 'Использовать как исходный язык (откуда)' : 'Use as source language'}
                        >
                          <span>{isCurrentSource ? '✓ Откуда' : '📥 Откуда'}</span>
                        </button>

                        {/* 3. DELETE BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleDeleteDictionary(pack)}
                          className="p-2.5 bg-gray-800 hover:bg-rose-950/60 text-gray-400 hover:text-rose-400 rounded-xl border border-gray-700 transition-all cursor-pointer"
                          title={isRu ? 'Удалить словарь из памяти' : 'Delete dictionary'}
                        >
                          🗑️
                        </button>
                      </>
                    ) : (
                      <>
                        {/* If NOT downloaded: DOWNLOAD BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleDownloadDictionary(pack)}
                          disabled={isCurrentlyDownloading}
                          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                            isCurrentlyDownloading
                              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                              : 'bg-sky-600 hover:bg-sky-500 text-white border-b-2 border-sky-800 shadow-md active:translate-y-0.5'
                          }`}
                        >
                          <span>📥</span>
                          <span>{isRu ? `Скачать словарь (${pack.sizeMb} МБ)` : `Download (${pack.sizeMb} MB)`}</span>
                        </button>

                        {/* Fast "Приключить и скачать" */}
                        <button
                          type="button"
                          onClick={() => handleDownloadDictionary(pack, true)}
                          disabled={isCurrentlyDownloading}
                          className="py-2.5 px-3 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/40 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                          title={isRu ? 'Приключить язык перевода и скачать офлайн-словарь' : 'Switch target language & download'}
                        >
                          <span>⇄ Приключить</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredDictionaryPacks.length === 0 && (
            <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-8 text-center space-y-2">
              <span className="text-3xl block">🔍</span>
              <p className="text-sm font-black text-gray-300">
                {isRu ? 'Словари по вашему запросу не найдены' : 'No dictionaries match your search'}
              </p>
              <button
                type="button"
                onClick={() => { setDictionarySearch(''); setDictionaryFilter('all'); }}
                className="text-xs text-emerald-400 font-bold hover:underline"
              >
                {isRu ? 'Сбросить поиск и фильтры' : 'Reset search and filters'}
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default TranslatorScreen;
