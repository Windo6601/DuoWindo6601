import React, { useState, useEffect } from 'react';
import { CloseIcon } from './Icons';
import { 
  isLanguageSwitchLocked, 
  getLanguageLockedToastMessage,
  AVAILABLE_SWITCH_LANGUAGES,
  LOCKED_WORLD_LANGUAGES,
  LOCKED_CIS_LANGUAGES 
} from '../services/languageLockService';

export interface ChessAutoTranslatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLanguage?: string;
  initialTextToTranslate?: string;
  onLanguageChange?: (langCode: string) => void;
  onApplyTranslationToAll?: (targetLang: string) => void;
}

export const CHESS_TRANSLATOR_LANGUAGES = [
  { code: 'ru', name: 'Русский', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'Английский', nativeName: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Немецкий', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Французский', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Испанский', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'ja', name: 'Японский', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: 'Китайский', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Арабский', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'pt', name: 'Португальский', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'it', name: 'Итальянский', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'tr', name: 'Турецкий', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'ko', name: 'Корейский', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'hi', name: 'Хинди', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'pl', name: 'Польский', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'id', name: 'Индонезийский', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'bn', name: 'Бенгальский', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'th', name: 'Тайский', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Вьетнамский', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'kk', name: 'Казахстан (Қазақша)', nativeName: 'Қазақша', flag: '🇰🇿' },
  { code: 'uz', name: 'Узбекистан (Oʻzbekcha)', nativeName: 'Oʻzbekcha', flag: '🇺🇿' },
  { code: 'hy', name: 'Армения (Հայերեն)', nativeName: 'Հայերեն', flag: '🇦🇲' },
  { code: 'ka', name: 'Грузия (ქართული)', nativeName: 'ქართული', flag: '🇬🇪' },
  { code: 'az', name: 'Азербайджан (Azərbaycan)', nativeName: 'Azərbaycan', flag: '🇦🇿' },
];

// Offline translation dictionary for common chess analysis expressions
const CHESS_TRANSLATION_DICTIONARY: Record<string, Record<string, string>> = {
  en: {
    'АНАЛИЗИРОВАТЬ ПАРТИЮ ШАХМАТЫ': 'ANALYZE CHESS GAME',
    'Авто-Переводчик DuoWindo6601': 'DuoWindo6601 Auto-Translator',
    'Блестящий ход': 'Brilliant move',
    'Лучший ход': 'Best move',
    'Отличный ход': 'Excellent move',
    'Хороший ход': 'Good move',
    'Неточный ход': 'Inaccuracy',
    'Ошибка': 'Mistake',
    'Грубая ошибка': 'Blunder',
    'Теория / Дебют': 'Book move',
    'Белые': 'White',
    'Черные': 'Black',
    'Ничья': 'Draw',
    'Мат': 'Checkmate',
    'Победа': 'Victory',
    'Перевести комментарий ИИ': 'Translate AI Comment',
    'Язык стран перевода': 'Target Country Language',
    'Автоматический перевод отзывов, комментариев и анализа': 'Auto-translation of reviews, comments, and chess analysis',
    'Копировать перевод': 'Copy Translation',
    'Скопировано!': 'Copied!',
    'Применить для всей аналитики': 'Apply to All Analytics',
  },
  de: {
    'АНАЛИЗИРОВАТЬ ПАРТИЮ ШАХМАТЫ': 'SCHACHPARTIE ANALYSIEREN',
    'Авто-Переводчик DuoWindo6601': 'DuoWindo6601 Auto-Übersetzer',
    'Блестящий ход': 'Genialer Zug',
    'Лучший ход': 'Bester Zug',
    'Отличный ход': 'Ausgezeichneter Zug',
    'Хороший ход': 'Guter Zug',
    'Неточный ход': 'Ungenauigkeit',
    'Ошибка': 'Fehler',
    'Грубая ошибка': 'Patzer',
    'Теория / Дебют': 'Buchzug',
    'Белые': 'Weiß',
    'Черные': 'Schwarz',
    'Ничья': 'Remis',
    'Мат': 'Schachmatt',
    'Победа': 'Sieg',
    'Перевести комментарий ИИ': 'KI-Kommentar übersetzen',
    'Язык стран перевода': 'Zielsprache des Landes',
    'Автоматический перевод отзывов, комментариев и анализа': 'Automatische Übersetzung von Bewertungen, Kommentaren und Schachanalysen',
    'Копировать перевод': 'Übersetzung kopieren',
    'Скопировано!': 'Kopiert!',
    'Применить для всей аналитики': 'Auf alle Analysen anwenden',
  },
  fr: {
    'АНАЛИЗИРОВАТЬ ПАРТИЮ ШАХМАТЫ': 'ANALYSER LA PARTIE D\'ÉCHECS',
    'Авто-Переводчик DuoWindo6601': 'Auto-Traducteur DuoWindo6601',
    'Блестящий ход': 'Coup brillant',
    'Лучший ход': 'Meilleur coup',
    'Отличный ход': 'Excellent coup',
    'Хороший ход': 'Bon coup',
    'Неточный ход': 'Inexactitude',
    'Ошибка': 'Erreur',
    'Грубая ошибка': 'Gaffe',
    'Теория / Дебют': 'Coup теоретиique',
    'Белые': 'Blancs',
    'Черные': 'Noirs',
    'Ничья': 'Nulle',
    'Мат': 'Échec et mat',
    'Победа': 'Victoire',
    'Перевести комментарий ИИ': 'Traduire le commentaire IA',
    'Язык стран перевода': 'Langue du pays cible',
    'Автоматический перевод отзывов, комментариев и анализа': 'Traduction automatique des avis, commentaires et analyses d\'échecs',
    'Копировать перевод': 'Copier la traduction',
    'Скопировано!': 'Copié !',
    'Применить для всей аналитики': 'Appliquer à toute l\'analyse',
  },
  es: {
    'АНАЛИЗИРОВАТЬ ПАРТИЮ ШАХМАТЫ': 'ANALIZAR PARTIDA DE AJEDREZ',
    'Авто-Переводчик DuoWindo6601': 'Auto-Traductor DuoWindo6601',
    'Блестящий ход': 'Movimiento brillante',
    'Лучший ход': 'Mejor movimiento',
    'Отличный ход': 'Excelente movimiento',
    'Хороший ход': 'Buen movimiento',
    'Неточный ход': 'Inexactitud',
    'Ошибка': 'Error',
    'Грубая ошибка': 'Error grave',
    'Теория / Дебют': 'Movimiento de libro',
    'Белые': 'Blancas',
    'Черные': 'Negras',
    'Ничья': 'Tablas',
    'Мат': 'Jaque mate',
    'Победа': 'Victoria',
    'Перевести комментарий ИИ': 'Traducir comentario IA',
    'Язык стран перевода': 'Idioma del país de destino',
    'Автоматический перевод отзывов, комментариев и анализа': 'Traducción automática de reseñas, comentarios y análisis de ajedrez',
    'Копировать перевод': 'Copiar traducción',
    'Скопировано!': '¡Copiado!',
    'Применить для всей аналитики': 'Aplicar a todos los análisis',
  },
  kk: {
    'АНАЛИЗИРОВАТЬ ПАРТИЮ ШАХМАТЫ': 'ШАХМАТ ПАРТИЯСЫН ТАЛДАУ',
    'Авто-Переводчик DuoWindo6601': 'DuoWindo6601 Авто-Аудармашы',
    'Блестящий ход': 'Тамаша жүріс',
    'Лучший ход': 'Ең үздік жүріс',
    'Отличный ход': 'Өте жақсы жүріс',
    'Хороший ход': 'Жақсы жүріс',
    'Неточный ход': 'Дәл емес жүріс',
    'Ошибка': 'Қателік',
    'Грубая ошибка': 'Өрескел қателік',
    'Теория / Дебют': 'Дебюттік жүріс',
    'Белые': 'Ақтар',
    'Черные': 'Қаралар',
    'Ничья': 'Тең ойын',
    'Мат': 'Мат',
    'Победа': 'Жеңіс',
    'Перевести комментарий ИИ': 'ЖИ түсініктемесін аудару',
    'Язык стран перевода': 'Аударма елінің тілі',
    'Автоматический перевод отзывов, комментариев и анализа': 'Пікірлерді, комментарийлерді және шахмат талдауын автоматты аудару',
    'Копировать перевод': 'Аударманы көшіру',
    'Скопировано!': 'Көшірілді!',
    'Применить для всей аналитики': 'Барлық талдауға қолдану',
  },
  uz: {
    'АНАЛИЗИРОВАТЬ ПАРТИЮ ШАХМАТЫ': 'SHAXMAT PARTIYASINI TAHLIL QILISH',
    'Авто-Переводчик DuoWindo6601': 'DuoWindo6601 Avto-Tarjimon',
    'Блестящий ход': 'Ajoyib yurish',
    'Лучший ход': 'Eng yaxshi yurish',
    'Отличный ход': 'A\'lo yurish',
    'Хороший ход': 'Yaxshi yurish',
    'Неточный ход': 'Noaniq yurish',
    'Ошибка': 'Xato',
    'Грубая ошибка': 'Qpol xato',
    'Теория / Дебют': 'Nazariy yurish',
    'Белые': 'Oqlar',
    'Черные': 'Qoralar',
    'Ничья': 'Durang',
    'Мат': 'Mot',
    'Победа': 'G\'alaba',
    'Перевести комментарий ИИ': 'SIning sharhini tarjima qilish',
    'Язык стран перевода': 'Tarjima mamlakati tili',
    'Автоматический перевод отзывов, комментариев и анализа': 'Sharhlar, izohlar va shaxmat tahlilini avtomatik tarjima qilish',
    'Копировать перевод': 'Tarjimani nusxalash',
    'Скопировано!': 'Nusxalandi!',
    'Применить для всей аналитики': 'Barcha tahlillarga qo\'llash',
  }
};

export const ChessAutoTranslatorModal: React.FC<ChessAutoTranslatorModalProps> = ({
  isOpen,
  onClose,
  userLanguage = 'ru',
  initialTextToTranslate = '',
  onLanguageChange,
  onApplyTranslationToAll
}) => {
  const [selectedLang, setSelectedLang] = useState<string>(userLanguage || 'ru');
  const [inputText, setInputText] = useState<string>(initialTextToTranslate);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [autoTranslateMoveComments, setAutoTranslateMoveComments] = useState<boolean>(true);
  const [autoTranslateNamesAndReviews, setAutoTranslateNamesAndReviews] = useState<boolean>(true);

  useEffect(() => {
    if (initialTextToTranslate) {
      setInputText(initialTextToTranslate);
    }
  }, [initialTextToTranslate]);

  useEffect(() => {
    if (!inputText) {
      setTranslatedText('');
      return;
    }

    setIsTranslating(true);
    const timer = setTimeout(() => {
      let result = inputText;
      
      // Look up phrase direct translations
      const dict = CHESS_TRANSLATION_DICTIONARY[selectedLang];
      if (dict && dict[inputText]) {
        result = dict[inputText];
      } else {
        // Substitute known key phrases if contained
        if (dict) {
          Object.keys(dict).forEach(key => {
            if (result.includes(key)) {
              result = result.split(key).join(dict[key]);
            }
          });
        }

        if (selectedLang !== 'ru' && result === inputText) {
          const langObj = CHESS_TRANSLATOR_LANGUAGES.find(l => l.code === selectedLang);
          const langName = langObj ? langObj.name : selectedLang;
          result = `[Авто-Переводчик DuoWindo6601 → ${langName}]: ${inputText}`;
        }
      }

      setTranslatedText(result);
      setIsTranslating(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [inputText, selectedLang]);

  if (!isOpen) return null;

  const currentLangObj = CHESS_TRANSLATOR_LANGUAGES.find(l => l.code === selectedLang) || CHESS_TRANSLATOR_LANGUAGES[0];

  const handleSelectLanguage = (code: string) => {
    setSelectedLang(code);
    if (onLanguageChange) {
      onLanguageChange(code);
    }
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyToAll = () => {
    if (onApplyTranslationToAll) {
      onApplyTranslationToAll(selectedLang);
    }
    onClose();
  };

  const availableLangs = CHESS_TRANSLATOR_LANGUAGES.filter(l => AVAILABLE_SWITCH_LANGUAGES.some(a => a.code === l.code));
  const worldLockedLangs = CHESS_TRANSLATOR_LANGUAGES.filter(l => l.code in LOCKED_WORLD_LANGUAGES);
  const cisLockedLangs = CHESS_TRANSLATOR_LANGUAGES.filter(l => l.code in LOCKED_CIS_LANGUAGES);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full p-6 text-white shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">
              🌐
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide text-white flex items-center gap-2">
                Авто-Переводчик DuoWindo6601
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                  23 Языка
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Перевод отзывов, комментариев, категорий, авторов и раздела «АНАЛИЗИРОВАТЬ ПАРТИЮ ШАХМАТЫ»
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* Target Country Language Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
              🌍 Выберите язык страны перевода (23 Страны)
            </label>
            <select
              value={selectedLang}
              onChange={(e) => handleSelectLanguage(e.target.value)}
              className="w-full bg-slate-800/90 border border-indigo-500/40 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <optgroup label="✅ Доступные страны">
                {availableLangs.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </optgroup>
              <optgroup label="🔒 Страны мира (Заблокировано)">
                {worldLockedLangs.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.nativeName}) 🔒
                  </option>
                ))}
              </optgroup>
              <optgroup label="🔒 Страны СНГ (Заблокировано)">
                {cisLockedLangs.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.nativeName}) 🔒
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Toggle Settings */}
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/60 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>⚙️ Настройки авто-перевода</span>
              <span className="text-[10px] text-emerald-400 font-mono">Активно</span>
            </h4>
            <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
              <span>♟️ Переводить ходы и комментарии шахматного анализа</span>
              <input
                type="checkbox"
                checked={autoTranslateMoveComments}
                onChange={(e) => setAutoTranslateMoveComments(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
              <span>💬 Переводить отзывы, комментарии администрации и имена</span>
              <input
                type="checkbox"
                checked={autoTranslateNamesAndReviews}
                onChange={(e) => setAutoTranslateNamesAndReviews(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Translation Interactive Box */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                📝 Текст для перевода
              </span>
              <span className="text-xs text-indigo-400 font-medium">
                {currentLangObj.flag} {currentLangObj.name}
              </span>
            </div>

            {/* Input / Original Text */}
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Введите текст анализа, комментарий или отзыв..."
              className="w-full h-24 bg-slate-950/70 border border-slate-700/80 rounded-2xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all resize-none font-sans"
            />

            {/* Output / Translated Text */}
            <div className="relative">
              <div className="w-full min-h-[5rem] bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-3.5 text-sm text-indigo-100 font-medium leading-relaxed">
                {isTranslating ? (
                  <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                    Переводим на {currentLangObj.name}...
                  </div>
                ) : (
                  translatedText || <span className="text-slate-500 italic">Результат авто-перевода отобразится здесь...</span>
                )}
              </div>

              {translatedText && !isTranslating && (
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  {copied ? 'Скопировано! ✓' : 'Копировать'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all"
          >
            Закрыть
          </button>
          <button
            onClick={handleApplyToAll}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-95 flex items-center gap-2"
          >
            <span>✨</span>
            <span>Применить для раздела «АНАЛИЗИРОВАТЬ ПАРТИЮ»</span>
          </button>
        </div>
      </div>
    </div>
  );
};
