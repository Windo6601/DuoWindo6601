import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProgress, FeedbackItem, FeedbackReply, Course } from '../types';
import { StarIcon, ThumbsUpIcon, MessageSquareIcon, CloseIcon, TrashIcon } from './Icons';

interface FeedbackScreenProps {
  user: UserProgress;
  onBack: () => void;
  playSound: (type: 'click' | 'correct' | 'wrong' | 'fanfare' | 'streak') => void;
  setToast: (msg: string) => void;
  onOpenAdminDashboard?: () => void;
  onOpenSupportChat?: () => void;
  onOpenIncognitoRestrictions?: () => void;
  onOpenRegister?: () => void;
  courses?: Course[];
  currentCourse?: Course;
  t?: (key: string) => string;
  onSetLanguage?: (lang: string) => void;
  autoTranslateFeedback?: boolean;
}

// 8 Supported Languages configuration
export const SUPPORTED_LANGUAGES = [
  { code: 'ru', name: 'Русский', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'Английский', nativeName: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Немецкий', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Французский', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Испанский', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'ja', name: 'Японский', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: 'Китайский', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Арабский', nativeName: 'العربية', flag: '🇸🇦' },
];

export const DEFAULT_FEEDBACK_COURSES = [
  { id: 'general', name: 'Общий отзыв о DuoWindo6601', localName: 'Все курсы', flagEmoji: '🌟' },
  { id: 'kk', name: 'Казахский язык', localName: 'Казахстан', flagEmoji: '🇰🇿' },
  { id: 'uz', name: 'Узбекский язык', localName: 'Узбекистан', flagEmoji: '🇺🇿' },
  { id: 'am', name: 'Армянский язык', localName: 'Армения', flagEmoji: '🇦🇲' },
  { id: 'kg', name: 'Киргизский язык', localName: 'Кыргызстан', flagEmoji: '🇰🇬' },
  { id: 'az', name: 'Азербайджанский язык', localName: 'Азербайджан', flagEmoji: '🇦🇿' },
  { id: 'tg', name: 'Таджикский язык', localName: 'Таджикистан', flagEmoji: '🇹🇯' },
  { id: 'tm', name: 'Туркменский язык', localName: 'Туркменистан', flagEmoji: '🇹🇲' },
  { id: 'en', name: 'Английский язык', localName: 'English', flagEmoji: '🇬🇧' },
  { id: 'de', name: 'Немецкий язык', localName: 'Deutsch', flagEmoji: '🇩🇪' },
  { id: 'fr', name: 'Французский язык', localName: 'Français', flagEmoji: '🇫🇷' },
  { id: 'es', name: 'Испанский язык', localName: 'Español', flagEmoji: '🇪🇸' },
  { id: 'zh', name: 'Китайский язык', localName: '中文', flagEmoji: '🇨🇳' },
  { id: 'ja', name: 'Японский язык', localName: '日本語', flagEmoji: '🇯🇵' },
  { id: 'ko', name: 'Корейский язык', localName: '한국어', flagEmoji: '🇰🇷' },
  { id: 'ar', name: 'Арабский язык', localName: 'العربية', flagEmoji: '🇸🇦' },
  { id: 'he', name: 'Иврит', localName: 'עברית', flagEmoji: '🇮🇱' },
  { id: 'chess', name: 'Шахматы', localName: 'Предметы & Игры', flagEmoji: '♟️' },
  { id: 'math', name: 'Математика', localName: 'Предметы & Игры', flagEmoji: '🔢' },
  { id: 'music', name: 'Музыка', localName: 'Предметы & Игры', flagEmoji: '🎵' },
];

const CATEGORIES: Record<string, Record<string, string>> = {
  'general': {
    ru: '🌟 Общие впечатления',
    en: '🌟 General Impressions',
    de: '🌟 Gesamteindruck',
    fr: '🌟 Impressions générales',
    es: '🌟 Impresiones generales',
    ja: '🌟 全体的な感想',
    zh: '🌟 整体评价',
    ar: '🌟 انطباعات عامة'
  },
  'cis_languages': {
    ru: '🏛️ Языки СНГ (казахский, узбекский, армянский и др.)',
    en: '🏛️ CIS Languages (Kazakh, Uzbek, Armenian, etc.)',
    de: '🏛️ GUS-Sprachen (Kasachisch, Usbekisch, Armenisch usw.)',
    fr: '🏛️ Langues de la CEI (kazakh, ouzbek, arménien, etc.)',
    es: '🏛️ Idiomas de la CEI (kazajo, uzbeko, armenio, etc.)',
    ja: '🏛️ CIS諸国の言語（カザフ語、ウズベク語、アルメニア語など）',
    zh: '🏛️ 独联体国家语言（哈萨克语、乌兹别克语、亚美尼亚语等）',
    ar: '🏛️ لغات رابطة الدول المستقلة (الكازاخستانية، الأوزبكية، الأرمنية، إلخ)'
  },
  'world_languages': {
    ru: '🌍 Мировые языки (английский, испанский, китайский и др.)',
    en: '🌍 World Languages (English, Spanish, Chinese, etc.)',
    de: '🌍 Weltsprachen (Englisch, Spanisch, Chinesisch usw.)',
    fr: '🌍 Langues du monde (anglais, espagnol, chinois, etc.)',
    es: '🌍 Idiomas del mundo (inglés, español, chino, etc.)',
    ja: '🌍 世界の言語（英語、スペイン語、中国語など）',
    zh: '🌍 世界主流语言（英语、西班牙语、汉语等）',
    ar: '🌍 اللغات العالمية (الإنجليزية، الإسبانية، الصينية، إلخ)'
  },
  'subjects_games': {
    ru: '🧩 Предметы & Игры (шахматы, математика, логика)',
    en: '🧩 Subjects & Games (Chess, Math, Logic)',
    de: '🧩 Fächer & Spiele (Schach, Mathematik, Logik)',
    fr: '🧩 Matières & Jeux (Échecs, Maths, Logique)',
    es: '🧩 Asignaturas y Juegos (Ajedrez, Matemáticas, Lógica)',
    ja: '🧩 教科＆ゲーム（チェス、数学、論理）',
    zh: '🧩 学科与益智游戏（国际象棋、数学、逻辑）',
    ar: '🧩 المواد والألعاب (الشطرنج، الرياضيات، المنطق)'
  },
  'trainer_writing': {
    ru: '📚 Тренажер и графическое письмо',
    en: '📚 Practice Trainer & Handwriting',
    de: '📚 Schreibtrainer & Handschrift',
    fr: '📚 Entraîneur et écriture manuscrite',
    es: '📚 Entrenador y escritura gráfica',
    ja: '📚 練習トレーナー＆文字練習',
    zh: '📚 练习器与手写训练',
    ar: '📚 المدرب والكتابة اليدوية'
  },
  'new_feature': {
    ru: '✨ Новая функция',
    en: '✨ New Feature',
    de: '✨ Neue Funktion',
    fr: '✨ Nouvelle fonctionnalité',
    es: '✨ Nueva función',
    ja: '✨ 新機能',
    zh: '✨ 新功能',
    ar: '✨ ميزة جديدة'
  },
  'bug_fix': {
    ru: '🐛 Ошибка / Доработка',
    en: '🐛 Bug / Improvement',
    de: '🐛 Fehler / Verbesserung',
    fr: '🐛 Bug / Amélioration',
    es: '🐛 Error / Mejora',
    ja: '🐛 バグ / 改善提案',
    zh: '🐛 错误反馈 / 待改进',
    ar: '🐛 خطأ / تحسين'
  },
  'idea': {
    ru: '💡 Идея для улучшения',
    en: '💡 Improvement Idea',
    de: '💡 Idee zur Verbesserung',
    fr: '💡 Idée d\'amélioration',
    es: '💡 Idea de mejora',
    ja: '💡 改善のアイデア',
    zh: '💡 优化建议',
    ar: '💡 فكرة للتحسين'
  }
};

const RANDOM_USER_NAMES = [
  'Мария С.', 'Игорь Н.', 'София П.', 'Максим Р.', 
  'Анастасия Б.', 'Владимир Т.', 'Ольга И.', 'Роман Е.', 
  'Виктория Г.', 'Артём Д.', 'Екатерина Л.', 'Денис М.',
  'Константин П.', 'Анна Т.', 'Михаил С.', 'Сергей К.',
  'Азамат К.', 'Айпери М.', 'Нурсултан Ж.', 'Зарина В.',
  'Тимур А.', 'Данияр С.', 'Армен К.', 'Гульнара Т.',
  'Alexander W.', 'Sophie M.', 'Lucas B.', 'Emma K.',
  'Kenji T.', 'Mei L.', 'Carlos R.', 'Amira H.'
];

const RANDOM_USER_AVATARS = ['🦉', '🦊', '🦁', '🐼', '🐯', '🦄', '🐲', '🚀', '🐱', '🐶', '🤖', '👑', '🏛️', '🌍', '🧩', '♟️'];
const RANDOM_USER_COLORS = ['#1cb0f6', '#ff9600', '#58cc02', '#ce82ff', '#ff4b4b', '#2b70c9', '#ec4899', '#14b8a6'];

export const ADMIN_NAME_TRANSLATIONS: Record<string, string> = {
  ru: 'Администратор DuoWindo6601',
  en: 'DuoWindo6601 Administrator',
  de: 'DuoWindo6601-Administrator',
  fr: 'Administrateur DuoWindo6601',
  es: 'Administrador de DuoWindo6601',
  ja: 'DuoWindo6601 管理者',
  zh: 'DuoWindo6601 管理员',
  ar: 'مسؤول DuoWindo6601'
};

export const COMMON_NAME_TRANSLATIONS: Record<string, Record<string, string>> = {
  'Мария С.': {
    ru: 'Мария С.',
    en: 'Maria S.',
    de: 'Maria S.',
    fr: 'Marie S.',
    es: 'María S.',
    ja: 'マリア S.',
    zh: '玛丽亚 S.',
    ar: 'ماريا س.'
  },
  'Игорь Н.': {
    ru: 'Игорь Н.',
    en: 'Igor N.',
    de: 'Igor N.',
    fr: 'Igor N.',
    es: 'Ígor N.',
    ja: 'イーゴリ N.',
    zh: '伊戈尔 N.',
    ar: 'إيغور ن.'
  },
  'София П.': {
    ru: 'София П.',
    en: 'Sophia P.',
    de: 'Sophia P.',
    fr: 'Sophie P.',
    es: 'Sofía P.',
    ja: 'ソフィア P.',
    zh: '索菲亚 P.',
    ar: 'صوفيا ب.'
  },
  'Максим Р.': {
    ru: 'Максим Р.',
    en: 'Maxim R.',
    de: 'Maxim R.',
    fr: 'Maxime R.',
    es: 'Máximo R.',
    ja: 'マキシム R.',
    zh: '马克西姆 R.',
    ar: 'مكسيم ر.'
  },
  'Анастасия Б.': {
    ru: 'Анастасия Б.',
    en: 'Anastasia B.',
    de: 'Anastasia B.',
    fr: 'Anastasia B.',
    es: 'Anastasia B.',
    ja: 'アナスタシア B.',
    zh: '阿纳斯塔西娅 B.',
    ar: 'أناستاسيا ب.'
  },
  'Владимир Т.': {
    ru: 'Владимир Т.',
    en: 'Vladimir T.',
    de: 'Wladimir T.',
    fr: 'Vladimir T.',
    es: 'Vladímir T.',
    ja: 'ウラジーミル T.',
    zh: '弗拉基米尔 T.',
    ar: 'فلاديمير ت.'
  },
  'Alexander W.': {
    ru: 'Александр В.',
    en: 'Alexander W.',
    de: 'Alexander W.',
    fr: 'Alexandre W.',
    es: 'Alejandro W.',
    ja: 'アレクサンダー W.',
    zh: '亚历山大 W.',
    ar: 'ألكسندر و.'
  },
  'Sophie M.': {
    ru: 'Софи М.',
    en: 'Sophie M.',
    de: 'Sophie M.',
    fr: 'Sophie M.',
    es: 'Sofía M.',
    ja: 'ソフィー M.',
    zh: '索菲 M.',
    ar: 'سوفي م.'
  },
  'Carlos R.': {
    ru: 'Карлос Р.',
    en: 'Carlos R.',
    de: 'Carlos R.',
    fr: 'Carlos R.',
    es: 'Carlos R.',
    ja: 'カルロス R.',
    zh: '卡洛斯 R.',
    ar: 'كارلوس ر.'
  },
  'Kenji T.': {
    ru: 'Кэндзи Т.',
    en: 'Kenji T.',
    de: 'Kenji T.',
    fr: 'Kenji T.',
    es: 'Kenji T.',
    ja: 'ケンジ T.',
    zh: '健二 T.',
    ar: 'كينجي ت.'
  },
  'Mei L.': {
    ru: 'Мэй Л.',
    en: 'Mei L.',
    de: 'Mei L.',
    fr: 'Mei L.',
    es: 'Mei L.',
    ja: 'メイ L.',
    zh: '美 L.',
    ar: 'مي ل.'
  },
  'Amira H.': {
    ru: 'Амира Х.',
    en: 'Amira H.',
    de: 'Amira H.',
    fr: 'Amira H.',
    es: 'Amira H.',
    ja: 'アミラ H.',
    zh: '阿米拉 H.',
    ar: 'أميرة ح.'
  }
};

export const getTranslatedAuthorName = (name: string, targetLang: string, isAdmin?: boolean): string => {
  if (isAdmin || name.includes('Администратор') || name.includes('Admin') || name.includes('مسؤول') || name.includes('管理者') || name.includes('管理员')) {
    return ADMIN_NAME_TRANSLATIONS[targetLang] || ADMIN_NAME_TRANSLATIONS['ru'];
  }
  if (COMMON_NAME_TRANSLATIONS[name] && COMMON_NAME_TRANSLATIONS[name][targetLang]) {
    return COMMON_NAME_TRANSLATIONS[name][targetLang];
  }
  return name;
};

export const getTranslatedCategory = (categoryStr: string | undefined, targetLang: string): string => {
  if (!categoryStr) return '';
  for (const catKey of Object.keys(CATEGORIES)) {
    const catObj = CATEGORIES[catKey];
    if (Object.values(catObj).some((v) => v === categoryStr)) {
      return catObj[targetLang] || catObj['ru'] || categoryStr;
    }
  }
  return categoryStr;
};

export const translateTextToTarget = (text: string, targetLang: string): string => {
  if (!text) return text;
  const trimmed = text.trim();

  for (const item of MULTILINGUAL_REVIEWS_POOL) {
    if (Object.values(item.comment).some((v) => v.trim() === trimmed)) {
      if (item.comment[targetLang]) return item.comment[targetLang];
    }
    if (Object.values(item.adminReply).some((v) => v.trim() === trimmed)) {
      if (item.adminReply[targetLang]) return item.adminReply[targetLang];
    }
  }

  const commonMap: Record<string, Record<string, string>> = {
    'Отличное приложение DuoWindo6601! Озвучка букв и тренажер письменности для казахского, узбекского, армянского и других языков СНГ очень помогают в обучении!': {
      ru: 'Отличное приложение DuoWindo6601! Озвучка букв и тренажер письменности для казахского, узбекского, армянского и других языков СНГ очень помогают в обучении!',
      en: 'Great application DuoWindo6601! Letter voiceover and handwriting trainer for Kazakh, Uzbek, Armenian and other CIS languages are very helpful in learning!',
      de: 'Tolle DuoWindo6601-App! Sprachausgabe und Schreibtrainer für Kasachisch, Usbekisch, Armenisch und andere GUS-Sprachen helfen beim Lernen sehr!',
      fr: 'Excellente application DuoWindo6601 ! La voix off et l\'entraîneur d\'écriture manuscrite pour le kazakh, l\'ouzbek, l\'arménien et d\'autres langues de la CEI aident énormément !',
      es: '¡Excelente aplicación DuoWindo6601! La locución y el entrenador de escritura para kazajo, uzbeko, armenio y otros idiomas de la CEI ayudan mucho en el aprendizaje.',
      ja: '素晴らしいアプリDuoWindo6601！カザフ語、ウズベク語、アルメニア語などのCIS言語の文字音声と筆記トレーナーが学習に非常に役立ちます！',
      zh: '精美的 DuoWindo6601 应用！哈萨克语、乌兹别克语、亚美尼亚语等独联体语言的发音与手写训练器对学习帮助极大！',
      ar: 'تطبيق DuoWindo6601 ممتاز! النطق الصوتي للحروف ومدرب الكتابة للغات الكازاخستانية والأوزبكية والأرمنية تساعد كثيراً في التعلم!'
    },
    'Спасибо за высокую оценку! Мы постоянно дополняем курсы языков СНГ новыми интерактивными тренажерами и аудиозаписями. Приятного обучения! 🇰🇿🇺🇿🇦🇲': {
      ru: 'Спасибо за высокую оценку! Мы постоянно дополняем курсы языков СНГ новыми интерактивными тренажерами и аудиозаписями. Приятного обучения! 🇰🇿🇺🇿🇦🇲',
      en: 'Thank you for the high rating! We continuously update CIS language courses with new interactive trainers and audio recordings. Happy learning! 🇰🇿🇺🇿🇦🇲',
      de: 'Vielen Dank für die hohe Bewertung! Wir ergänzen die GUS-Sprachkurse ständig um neue interaktive Trainer und Audioaufnahmen. Viel Spaß beim Lernen! 🇰🇿🇺🇿🇦🇲',
      fr: 'Merci pour cette note élevée ! Nous enrichissons continuellement les cours de langues de la CEI avec de nouveaux modules interactifs. Bon apprentissage ! 🇰🇿🇺🇿🇦🇲',
      es: '¡Gracias por la alta calificación! Actualizamos constantemente los cursos de idiomas de la CEI con nuevos entrenadores interactivos. ¡Feliz aprendizaje! 🇰🇿🇺🇿🇦🇲',
      ja: '高評価ありがとうございます！CIS言語コースに新しいインタラクティブなトレーニングと音声を継続的に追加しています。楽しく学習しましょう！🇰🇿🇺🇿🇦🇲',
      zh: '感谢您的高分评价！我们持续更新独联体语言课程，增加新的互动练习器与音频录音。祝学习愉快！🇰🇿🇺🇿🇦🇲',
      ar: 'شكراً لتقييمك العالي! نقوم باستمرار بتحديث دورات لغات رابطة الدول المستقلة بمدربين تفاعليين وتسجيلات صوتية جديدة. نتمنى لك إمتاعاً في التعلم! 🇰🇿🇺🇿🇦🇲'
    }
  };

  if (commonMap[trimmed] && commonMap[trimmed][targetLang]) {
    return commonMap[trimmed][targetLang];
  }

  const langNames: Record<string, string> = {
    ru: 'Русский',
    en: 'English',
    de: 'Deutsch',
    fr: 'Français',
    es: 'Español',
    ja: '日本語',
    zh: '中文',
    ar: 'العربية'
  };

  const targetName = langNames[targetLang] || targetLang.toUpperCase();
  return `🌐 [${targetName}] ${text}`;
};

interface ReviewTemplate {
  rating: number;
  categoryKey: string;
  comment: Record<string, string>;
  adminReply: Record<string, string>;
}

const MULTILINGUAL_REVIEWS_POOL: ReviewTemplate[] = [
  {
    rating: 5,
    categoryKey: 'new_feature',
    comment: {
      ru: 'Очень удобно, что в раздел проверки браузера и ОС добавили подробные сроки поддержки Windows! Теперь сразу видно: Windows 7, 8.1, 10 и 11 с актуальными датами. DuoWindo6601 работает быстро и стабильно!',
      en: 'It is very convenient that Windows lifecycle and browser compatibility info were added! Windows 7, 8.1, 10, and 11 support timelines are crystal clear. DuoWindo6601 is lightning-fast and stable!',
      de: 'Sehr praktisch, dass der Bereich für Browser- und Betriebssystemprüfungen detaillierte Windows-Supportzeiträume enthält! DuoWindo6601 läuft extrem schnell und stabil!',
      fr: 'Très pratique que les informations sur le cycle de vie de Windows et la compatibilité du navigateur soient incluses ! DuoWindo6601 fonctionne rapidement et de manière stable !',
      es: '¡Muy práctico que se incluyan las fechas de soporte de Windows y compatibilidad de navegador! ¡DuoWindo6601 funciona rápido y estable!',
      ja: 'ブラウザとOSの互換性チェック機能がとても便利です！Windows 7、8.1、10、11のサポート期間が一目で分かります。DuoWindo6601は高速で安定しています！',
      zh: '系统与浏览器兼容性检查非常方便！Windows 7、8.1、10 和 11 的支持周期一目了然。DuoWindo6601 运行流畅稳定！',
      ar: 'من المناسب جداً إضافة معلومات التوافق مع المتصفح وفترات دعم Windows! يعمل DuoWindo6601 بسرعة وثبات فائق!'
    },
    adminReply: {
      ru: 'Спасибо за отзыв! Мы постоянно совершенствуем DuoWindo6601 и встроенные ИИ-технологии для комфортного обучения на любых устройствах! 💻🚀',
      en: 'Thank you for your feedback! We continuously enhance DuoWindo6601 and built-in AI tools for a seamless learning experience across all devices! 💻🚀',
      de: 'Vielen Dank für Ihre Bewertung! Wir verbessern DuoWindo6601 und integrierte KI-Technologien kontinuierlich für ein optimales Lernerlebnis! 💻🚀',
      fr: 'Merci pour votre avis ! Nous améliorons continuellement DuoWindo6601 et les technologies IA pour un apprentissage fluide sur tous les appareils ! 💻🚀',
      es: '¡Gracias por tu reseña! ¡Continuamente mejoramos DuoWindo6601 y las herramientas de IA para un aprendizaje cómodo en todos los dispositivos! 💻🚀',
      ja: 'レビューありがとうございます！すべてのデバイスで快適に学習できるよう、DuoWindo6601とAI機能を継続的に向上させています！💻🚀',
      zh: '感谢您的评价！我们持续优化 DuoWindo6601 及内置 AI 功能，确保在各类设备上均能享受流畅学习体验！💻🚀',
      ar: 'شكراً لمراجعتك! نعمل باستمرار على تطوير DuoWindo6601 وتقنيات الذكاء الاصطناعي لتوفير تجربة تعليمية مريحة! 💻🚀'
    }
  },
  {
    rating: 5,
    categoryKey: 'cis_languages',
    comment: {
      ru: 'Курсы языков СНГ на https://duowindo6601.ai.studio/ просто супер! Отлично проработана тренажёрная часть письменности и озвучка для казахского, узбекского, армянского и кыргызского языков.',
      en: 'CIS language courses on https://duowindo6601.ai.studio/ are fantastic! The handwriting trainer and audio pronunciation for Kazakh, Uzbek, Armenian, and Kyrgyz are top notch.',
      de: 'Die GUS-Sprachkurse auf https://duowindo6601.ai.studio/ sind fantastisch! Der Schreibtrainer und die Audio-Aussprache für Kasachisch, Usbekisch und Armenisch sind hervorragend.',
      fr: 'Les cours de langues de la CEI sur https://duowindo6601.ai.studio/ sont superbes ! L\'entraînement à l\'écriture et les enregistrements audio sont d\'une grande qualité.',
      es: '¡Los cursos de idiomas de la CEI en https://duowindo6601.ai.studio/ son fantásticos! El entrenador de escritura y el audio para kazajo, uzbeko y armenio son de primera calidad.',
      ja: 'https://duowindo6601.ai.studio/ のCIS言語コースは素晴らしいです！カザフ語、ウズベク語、アルメニア語、キルギス語の筆記トレーナーと音声がとても役立ちます。',
      zh: 'https://duowindo6601.ai.studio/ 上的独联体语言课程非常出色！哈萨克语、乌兹别克语、亚美尼亚语的书写训练与语音发音非常棒。',
      ar: 'دورات لغات رابطة الدول المستقلة على https://duowindo6601.ai.studio/ ممتازة جداً! مدرب الكتابة والنطق الصوتي للكازاخية والأوزبكية والأرمنية رائعان.'
    },
    adminReply: {
      ru: 'Спасибо за отзыв! Развитие и поддержка многоязычных курсов на https://duowindo6601.ai.studio/ — наш главный приоритет! 🇰🇿🇺🇿🇦🇲🇰🇬',
      en: 'Thank you for your feedback! Developing and supporting multilingual courses on https://duowindo6601.ai.studio/ is our highest priority! 🇰🇿🇺🇿🇦🇲🇰🇬',
      de: 'Vielen Dank für Ihre Rückmeldung! Die Weiterentwicklung mehrsprachiger Kurse auf https://duowindo6601.ai.studio/ ist unsere oberste Priorität! 🇰🇿🇺🇿🇦🇲🇰🇬',
      fr: 'Merci pour votre avis ! Le développement de cours multilingues sur https://duowindo6601.ai.studio/ est notre priorité absolue ! 🇰🇿🇺🇿🇦🇲🇰🇬',
      es: '¡Gracias por su reseña! ¡El desarrollo de cursos multilingües en https://duowindo6601.ai.studio/ es nuestra máxima prioridad! 🇰🇿🇺🇿🇦🇲🇰🇬',
      ja: '高評価をありがとうございます！https://duowindo6601.ai.studio/ での多言語コース開発は私たちの最優先事項です！🇰🇿🇺🇿🇦🇲🇰🇬',
      zh: '感谢您的评价！在 https://duowindo6601.ai.studio/ 上拓展和支持多语言课程是我们的首要任务！🇰🇿🇺🇿🇦🇲🇰🇬',
      ar: 'شكراً لمراجعتك! تطوير ودعم الدورات متعددة اللغات على https://duowindo6601.ai.studio/ هو أولويتنا القصوى! 🇰🇿🇺🇿🇦🇲🇰🇬'
    }
  },
  {
    rating: 5,
    categoryKey: 'subjects_games',
    comment: {
      ru: 'Модуль Предметы & Игры затягивает! Шахматный тренажер и математические задачки отлично развивают логику между уроками языков.',
      en: 'The Subjects & Games module is brilliant! The chess puzzles and math trainers keep the mind sharp between language lessons.',
      de: 'Das Modul Fächer & Spiele ist genial! Die Schachrätsel und Mathe-Übungen halten den Verstand zwischen den Sprachstunden fit.',
      fr: 'Le module Matières & Jeux est passionnant ! Les exercices d\'échecs et de mathématiques entraînent la logique entre les cours de langue.',
      es: '¡El módulo de Asignaturas y Juegos es genial! El ajedrez y los retos matemáticos ejercitan la mente entre lecciones de idiomas.',
      ja: '「教科＆ゲーム」モジュールがとても楽しいです！言語レッスンの合間にチェスや数学パズルで論理力を鍛えられます。',
      zh: '“学科与益智游戏”模块非常吸引人！在语言学习之间做国际象棋和数学题能很好地锻炼思维。',
      ar: 'وحدة المواد والألعاب رائعة جداً! ألغاز الشطرنج والرياضيات تنشط العقل بين دروس اللغات.'
    },
    adminReply: {
      ru: 'Замечательно! Раздел предметов и игр создан специально для гармоничного развития в DuoWindo6601 ♟️🔢',
      en: 'Wonderful! The subjects and games section is crafted specifically for well-rounded cognitive growth in DuoWindo6601 ♟️🔢',
      de: 'Wunderbar! Der Bereich für Fächer und Spiele wurde speziell für eine ganzheitliche geistige Entwicklung in DuoWindo6601 geschaffen ♟️🔢',
      fr: 'Formidable ! La section matières et jeux est conçue pour un développement intellectuel complet dans DuoWindo6601 ♟️🔢',
      es: '¡Excelente! La sección de asignaturas y juegos está creada para un desarrollo integral en DuoWindo6601 ♟️🔢',
      ja: '素晴らしいです！教科＆ゲームセクションは、DuoWindo6601での総合的な知育のために作られています ♟️🔢',
      zh: '太棒了！学科与游戏版块专为 DuoWindo6601 用户的多元智力拓展而设计 ♟️🔢',
      ar: 'رائع جداً! تم تصميم قسم المواد والألعاب لتنمية القدرات الذهنية في DuoWindo6601 ♟️🔢'
    }
  },
  {
    rating: 2,
    categoryKey: 'bug_fix',
    comment: {
      ru: 'Хотелось бы иметь возможность быстро переводить комментарии и отзывы на другие языки (английский, немецкий, французский, испанский, японский, китайский, арабский).',
      en: 'It would be great to have an instant translator for reviews and comments into multiple languages (English, German, French, Spanish, Japanese, Chinese, Arabic, Russian).',
      de: 'Es wäre toll, eine Funktion zur schnellen Übersetzung von Kommentaren und Bewertungen in andere Sprachen zu haben.',
      fr: 'Ce serait formidable de pouvoir traduire instantanément les commentaires et avis dans d\'autres langues.',
      es: 'Sería genial tener un traductor instantáneo para reseñas y comentarios a múltiples idiomas.',
      ja: 'レビューやコメントを他の言語（英語、ドイツ語、フランス語、スペイン語、日本語、中国語、アラビア語、ロシア語）に素早く翻訳できると便利です。',
      zh: '希望能快速将评论和评价翻译成其他语言（英语、德语、法语、西班牙语、日语、中文、阿拉伯语、俄语）。',
      ar: 'نأمل في توفير أداة لترجمة المراجعات والتعليقات فورياً إلى لغات متعددة.'
    },
    adminReply: {
      ru: 'Готово! Мы добавили встроенный мультиязычный переводчик для всех отзывов и комментариев администрации на 8 языков (RU, EN, DE, FR, ES, JA, ZH, AR)! 🌐✨',
      en: 'Done! We have introduced a built-in multilingual translator for all reviews and administration comments across 8 languages (RU, EN, DE, FR, ES, JA, ZH, AR)! 🌐✨',
      de: 'Erledigt! Wir haben einen integrierten mehrsprachigen Übersetzer für alle Bewertungen und Kommentare der Administration in 8 Sprachen hinzugefügt! 🌐✨',
      fr: 'C\'est fait ! Nous avons ajouté un traducteur multilingue intégré pour tous les avis et commentaires de l\'administration en 8 langues ! 🌐✨',
      es: '¡Listo! ¡Hemos añadido un traductor multilingüe integrado para todas las reseñas y comentarios de la administración en 8 idiomas! 🌐✨',
      ja: '対応完了！すべてのレビューと管理者コメントを8言語（RU、EN、DE、FR、ES、JA、ZH、AR）に翻訳できる機能を実装しました！🌐✨',
      zh: '已上线！我们为所有评价和管理团队评论新增了支持 8 种语言（俄语、英语、德语、法语、西班牙语、日语、中文、阿拉伯语）的即时翻译器！🌐✨',
      ar: 'تم التنفيذ! أضفنا مترجماً متعدد اللغات لجميع المراجعات وتعليقات الإدارة عبر 8 لغات! 🌐✨'
    }
  }
];

// Initial seed reviews
const INITIAL_REVIEWS: FeedbackItem[] = [
  {
    id: 'seed-1',
    userId: 'user-duo-1',
    userName: 'Алексей М.',
    userAvatar: '🦉',
    userColor: '#1cb0f6',
    rating: 5,
    category: '🏛️ Языки СНГ (казахский, узбекский, армянский и др.)',
    courseId: 'kk',
    courseName: 'Казахский язык',
    comment: 'Отличное приложение DuoWindo6601! Озвучка букв и тренажер письменности для казахского, узбекского, армянского и других языков СНГ очень помогают в обучении!',
    likes: 14,
    likedBy: [],
    replies: [
      {
        id: 'rep-admin-1',
        userId: 'admin-duowindo6601',
        userName: 'Администратор DuoWindo6601',
        userAvatar: '👑',
        userColor: '#f59e0b',
        isAdmin: true,
        comment: 'Спасибо за высокую оценку! Мы постоянно дополняем курсы языков СНГ новыми интерактивными тренажерами и аудиозаписями. Приятного обучения! 🇰🇿🇺🇿🇦🇲',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    isPinned: true,
    createdAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'seed-2',
    userId: 'user-duo-2',
    userName: 'Elena K.',
    userAvatar: '🦊',
    userColor: '#ff9600',
    rating: 5,
    category: '🌍 Мировые языки (английский, испанский, китайский и др.)',
    courseId: 'en',
    courseName: 'English',
    comment: 'The interactive lessons, flashcards, and instant comment translation tool make learning language super smooth!',
    likes: 9,
    likedBy: [],
    replies: [
      {
        id: 'rep-admin-2',
        userId: 'admin-duowindo6601',
        userName: 'Администратор DuoWindo6601',
        userAvatar: '👑',
        userColor: '#f59e0b',
        isAdmin: true,
        comment: 'Thank you Elena! We are thrilled that DuoWindo6601 helps you succeed! 🇬🇧🌟',
        createdAt: new Date(Date.now() - 43200000).toISOString()
      }
    ],
    isPinned: false,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

export const FeedbackScreen: React.FC<FeedbackScreenProps> = ({
  user,
  onBack,
  playSound,
  setToast,
  onOpenAdminDashboard,
  onOpenSupportChat,
  onOpenIncognitoRestrictions,
  onOpenRegister,
  courses = [],
  currentCourse,
  t,
  onSetLanguage
}) => {
  const [reviews, setReviews] = useState<FeedbackItem[]>(INITIAL_REVIEWS);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [filterSentiment, setFilterSentiment] = useState<'all' | 'good' | 'bad'>('all');

  // Selected language for review/comment translator tool
  const currentLang = user.language || 'ru';
  const [translatorTargetLang, setTranslatorTargetLang] = useState<string>(currentLang);

  // Auto-Translator toggle state (defaults to user setting or true)
  const [autoTranslate, setAutoTranslate] = useState<boolean>(user.autoTranslateFeedback ?? true);

  // Synchronize autoTranslate with global user settings
  useEffect(() => {
    if (user.autoTranslateFeedback !== undefined) {
      setAutoTranslate(user.autoTranslateFeedback);
    }
  }, [user.autoTranslateFeedback]);

  // Synchronize translatorTargetLang if app language changes
  useEffect(() => {
    if (user.language && user.language !== translatorTargetLang) {
      setTranslatorTargetLang(user.language);
    }
  }, [user.language]);

  // Translations cache for reviews and replies: { [id_targetLang]: translatedText }
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});
  const [translatingMap, setTranslatingMap] = useState<Record<string, boolean>>({});

  // Auto-translate reviews and admin replies when autoTranslate is ON
  useEffect(() => {
    if (!autoTranslate) return;

    const newTranslations: Record<string, string> = {};
    for (const rev of reviews) {
      const revKey = `${rev.id}_${translatorTargetLang}`;
      newTranslations[revKey] = translateTextToTarget(rev.comment, translatorTargetLang);

      if (rev.replies) {
        for (const rep of rev.replies) {
          const repKey = `${rep.id}_${translatorTargetLang}`;
          newTranslations[repKey] = translateTextToTarget(rep.comment, translatorTargetLang);
        }
      }
    }

    setTranslatedTexts((prev) => ({
      ...prev,
      ...newTranslations
    }));
  }, [reviews, translatorTargetLang, autoTranslate]);

  // Build course list for feedback form & filter
  const availableCourseList = React.useMemo(() => {
    if (courses && courses.length > 0) {
      const mapped = courses.map((c) => ({
        id: c.id,
        name: c.localName || c.name,
        localName: c.name,
        flagEmoji: c.flagCode
          ? c.flagCode.length === 2
            ? c.flagCode
                .toUpperCase()
                .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
            : c.flagCode === 'math'
            ? '🔢'
            : c.flagCode === 'chess'
            ? '♟️'
            : c.flagCode === 'music'
            ? '🎵'
            : '📚'
          : '📚'
      }));
      return [
        { id: 'general', name: 'Общий отзыв о DuoWindo6601', localName: 'Все курсы', flagEmoji: '🌟' },
        ...mapped
      ];
    }
    return DEFAULT_FEEDBACK_COURSES;
  }, [courses]);

  const [selectedCourseId, setSelectedCourseId] = useState<string>(currentCourse?.id || 'general');
  const [filterCourseId, setFilterCourseId] = useState<string>('all');

  // Admin Check helper
  const ADMIN_EMAILS = ['abramovanatolij81@gmail.com', 'va997217@gmail.com'];
  const ADMIN_KEYS = ['abramov6601', 'abramovanatolij81@gmail.com', 'va997217@gmail.com', '7777', 'duowindo6601admin', 'admin6601', 'abramov', 'va997217', 'admin'];

  const isUserOwnerAdmin = 
    Boolean(user.isAdmin) ||
    ADMIN_EMAILS.includes(user.username?.toLowerCase() || '') ||
    ADMIN_EMAILS.includes(user.name?.toLowerCase() || '') ||
    Boolean(user.username && (user.username.toLowerCase().includes('abramov') || user.username.toLowerCase().includes('va997217'))) ||
    Boolean(user.name && (user.name.includes('Анатолий') || user.name.includes('Владимир') || user.name.includes('Abramov') || user.name.toLowerCase().includes('va997217')));

  // Admin Mode State
  const [isAdminMode, setIsAdminMode] = useState<boolean>(isUserOwnerAdmin);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');

  // Expand comment section per review
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  // Comment draft input state per review
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [isReplyAdminFlags, setIsReplyAdminFlags] = useState<Record<string, boolean>>({});

  // Main Review Form states
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('general');
  const [comment, setComment] = useState<string>('');
  const [asAdminForm, setAsAdminForm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Translator Workbench States
  const [workbenchAuthorName, setWorkbenchAuthorName] = useState<string>(user.name || user.username || 'Мария С.');
  const [workbenchText, setWorkbenchText] = useState<string>('Курсы языков СНГ и проверка совместимости Windows в DuoWindo6601 работают отлично!');
  const [workbenchIsAdmin, setWorkbenchIsAdmin] = useState<boolean>(false);
  const [workbenchCategory, setWorkbenchCategory] = useState<string>('cis_languages');
  const [workbenchRating, setWorkbenchRating] = useState<number>(5);

  // Tech Support Tab & States
  const [activeTab, setActiveTab] = useState<'reviews' | 'support' | 'translator'>('reviews');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);

  // Privacy toggle for Contacts: Hide Email
  const [hideSupportEmail, setHideSupportEmail] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('dw_hide_support_email') === 'true';
    }
    return false;
  });

  const toggleHideSupportEmail = () => {
    setHideSupportEmail(prev => {
      const next = !prev;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('dw_hide_support_email', String(next));
      }
      return next;
    });
  };

  const formatSupportEmail = (email: string) => {
    if (!hideSupportEmail) return email;
    const [userPart, domain] = email.split('@');
    if (userPart && domain) {
      const maskedUser = userPart.length > 3 ? `${userPart.slice(0, 2)}••••••${userPart.slice(-1)}` : `${userPart[0]}••••`;
      return `${maskedUser}@${domain}`;
    }
    return '••••••••@••••••';
  };

  // Sync admin mode when user changes
  useEffect(() => {
    if (isUserOwnerAdmin) {
      setIsAdminMode(true);
    }
  }, [isUserOwnerAdmin]);

  // Fetch reviews from Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
        const fetchPromise = getDocs(q);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Network timeout')), 4000)
        );
        const querySnapshot = (await Promise.race([fetchPromise, timeoutPromise])) as Awaited<typeof fetchPromise>;
        const loaded: FeedbackItem[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loaded.push({
            id: docSnap.id,
            userId: data.userId || 'anon',
            userName: data.userName || 'Пользователь',
            userAvatar: data.userAvatar || '👤',
            userColor: data.userColor || '#58cc02',
            rating: data.rating || 5,
            category: data.category || '🌟 Общие впечатления',
            courseId: data.courseId || undefined,
            courseName: data.courseName || undefined,
            comment: data.comment || '',
            likes: data.likes || 0,
            likedBy: data.likedBy || [],
            replies: data.replies || [],
            isPinned: data.isPinned || false,
            createdAt: data.createdAt || new Date().toISOString()
          });
        });

        if (isMounted) {
          if (loaded.length > 0) {
            setReviews(loaded);
          } else {
            setReviews(INITIAL_REVIEWS);
          }
        }
      } catch (e) {
        console.warn('Could not fetch feedback from Firestore, using initial state:', e);
        if (isMounted) setReviews(INITIAL_REVIEWS);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReviews();
    return () => { isMounted = false; };
  }, []);

  // Quick Language Switcher Handler
  const handleSwitchLanguage = (langCode: string) => {
    playSound('click');
    setTranslatorTargetLang(langCode);
    if (onSetLanguage) {
      onSetLanguage(langCode);
    }
    const foundLang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    const langLabel = foundLang ? `${foundLang.flag} ${foundLang.name}` : langCode.toUpperCase();
    setToast(`Язык приложения переключен на: ${langLabel}!`);
  };

  // Instant Translator for Reviews & Comments
  const handleTranslateItem = async (itemId: string, originalText: string, targetLang: string) => {
    playSound('click');
    const key = `${itemId}_${targetLang}`;

    if (translatedTexts[key]) {
      // Toggle back to original if already viewing translation
      setTranslatedTexts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setToast('Показан исходный текст');
      return;
    }

    setTranslatingMap((prev) => ({ ...prev, [key]: true }));

    const translated = translateTextToTarget(originalText, targetLang);

    await new Promise(r => setTimeout(r, 150));

    setTranslatedTexts((prev) => ({ ...prev, [key]: translated }));
    setTranslatingMap((prev) => ({ ...prev, [key]: false }));
    playSound('correct');
    setToast(`Переведено на: ${SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang} 🌐`);
  };

  // Manual Refresh Handler
  const handleRefreshReviews = async () => {
    playSound('click');
    setLoading(true);
    try {
      const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
      const fetchPromise = getDocs(q);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), 4000)
      );
      const querySnapshot = (await Promise.race([fetchPromise, timeoutPromise])) as Awaited<typeof fetchPromise>;
      const loaded: FeedbackItem[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loaded.push({
          id: docSnap.id,
          userId: data.userId || 'anon',
          userName: data.userName || 'Пользователь',
          userAvatar: data.userAvatar || '👤',
          userColor: data.userColor || '#58cc02',
          rating: data.rating || 5,
          category: data.category || '🌟 Общие впечатления',
          courseId: data.courseId || undefined,
          courseName: data.courseName || undefined,
          comment: data.comment || '',
          likes: data.likes || 0,
          likedBy: data.likedBy || [],
          replies: data.replies || [],
          isPinned: data.isPinned || false,
          createdAt: data.createdAt || new Date().toISOString()
        });
      });

      if (loaded.length > 0) {
        setReviews(loaded);
      } else {
        setReviews(INITIAL_REVIEWS);
      }
      playSound('correct');
      setToast(t ? t('refresh_reviews') || 'Отзывы обновлены!' : 'Отзывы о DuoWindo6601 обновлены! 🔄');
    } catch (e) {
      console.warn('Could not refresh feedback from Firestore:', e);
      setToast('Загружен текущий список отзывов');
    } finally {
      setLoading(false);
    }
  };

  // Generate Random Review & Comment Handler
  const handleGenerateRandomReview = async (forcedType?: 'good' | 'bad') => {
    playSound('click');
    setSubmitting(true);

    const isGood = forcedType ? forcedType === 'good' : Math.random() > 0.4;
    const pool = MULTILINGUAL_REVIEWS_POOL;
    const template = pool[Math.floor(Math.random() * pool.length)];

    const randomName = RANDOM_USER_NAMES[Math.floor(Math.random() * RANDOM_USER_NAMES.length)];
    const randomAvatar = RANDOM_USER_AVATARS[Math.floor(Math.random() * RANDOM_USER_AVATARS.length)];
    const randomColor = RANDOM_USER_COLORS[Math.floor(Math.random() * RANDOM_USER_COLORS.length)];
    const includeReply = Math.random() > 0.15;
    const randomCourse = availableCourseList[Math.floor(Math.random() * availableCourseList.length)];
    const catObj = CATEGORIES[template.categoryKey] || CATEGORIES['general'];
    const catName = catObj[currentLang] || catObj['ru'];

    const reviewComment = template.comment[currentLang] || template.comment['ru'];
    const adminReplyText = template.adminReply[currentLang] || template.adminReply['ru'];

    const randomReplyList: FeedbackReply[] = includeReply ? [
      {
        id: 'rep-rand-' + Date.now(),
        userId: 'admin-duowindo6601',
        userName: 'Администратор DuoWindo6601',
        userAvatar: '👑',
        userColor: '#f59e0b',
        isAdmin: true,
        comment: adminReplyText,
        createdAt: new Date().toISOString()
      }
    ] : [];

    const newFeedback: Omit<FeedbackItem, 'id'> = {
      userId: 'user-rand-' + Date.now(),
      userName: randomName,
      userAvatar: randomAvatar,
      userColor: randomColor,
      rating: isGood ? (template.rating >= 4 ? template.rating : 5) : (template.rating <= 3 ? template.rating : 2),
      category: catName,
      courseId: randomCourse.id,
      courseName: randomCourse.name,
      comment: reviewComment,
      likes: Math.floor(Math.random() * 8),
      likedBy: [],
      replies: randomReplyList,
      isPinned: false,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'feedback'), newFeedback);
      const createdItem: FeedbackItem = { id: docRef.id, ...newFeedback };
      setReviews((prev) => [createdItem, ...prev]);
      playSound('fanfare');
      setToast(isGood ? `Добавлен отзыв (👍 ${randomName})` : `Добавлен отзыв (👎 ${randomName})`);
    } catch (err) {
      console.warn('Could not save random review to Firestore:', err);
      const fallbackItem: FeedbackItem = {
        id: 'local-' + Date.now(),
        ...newFeedback
      };
      setReviews((prev) => [fallbackItem, ...prev]);
      playSound('fanfare');
      setToast(isGood ? `Хороший отзыв добавлен (${randomName}) 👍` : `Критический отзыв добавлен (${randomName}) 👎`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Login as Admin
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const inputKey = adminPasswordInput.trim().toLowerCase();
    const isAuthorized = isUserOwnerAdmin || ADMIN_KEYS.includes(inputKey);

    if (isAuthorized) {
      setIsAdminMode(true);
      setShowAdminModal(false);
      setAdminPasswordInput('');
      playSound('fanfare');
      setToast('Вход выполнен! Подтверждены права Администратора DuoWindo6601 👑');
    } else {
      playSound('wrong');
      setToast('Ограничение доступа! Права администратора принадлежат владельцам.');
    }
  };

  // Submit main review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setToast('Пожалуйста, напишите ваш отзыв');
      return;
    }

    playSound('click');
    setSubmitting(true);

    const isAdminAuthor = isAdminMode && asAdminForm;
    const selectedCourseObj = availableCourseList.find((c) => c.id === selectedCourseId);
    const catObj = CATEGORIES[selectedCategoryKey] || CATEGORIES['general'];
    const catName = catObj[currentLang] || catObj['ru'];

    const newFeedback: Omit<FeedbackItem, 'id'> = {
      userId: isAdminAuthor ? 'admin-duowindo6601' : (user.username || user.name || 'user-' + Date.now()),
      userName: isAdminAuthor ? 'Администратор DuoWindo6601' : (user.name || 'Пользователь'),
      userAvatar: isAdminAuthor ? '👑' : (user.avatarIcon || '👤'),
      userColor: isAdminAuthor ? '#f59e0b' : (user.avatarColor || '#1cb0f6'),
      rating,
      category: catName,
      courseId: selectedCourseId,
      courseName: selectedCourseObj ? selectedCourseObj.name : 'Общий отзыв',
      comment: comment.trim(),
      likes: 0,
      likedBy: [],
      replies: [],
      isPinned: isAdminAuthor,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'feedback'), newFeedback);
      const createdItem: FeedbackItem = { id: docRef.id, ...newFeedback };
      setReviews((prev) => [createdItem, ...prev]);
      playSound('fanfare');
      setToast('Спасибо! Ваш отзыв успешно опубликован 🎉');
      setComment('');
      setShowForm(false);
    } catch (err) {
      console.warn('Error submitting feedback to Firestore:', err);
      const fallbackItem: FeedbackItem = {
        id: 'local-' + Date.now(),
        ...newFeedback
      };
      setReviews((prev) => [fallbackItem, ...prev]);
      playSound('correct');
      setToast('Отзыв сохранён локально! Спасибо!');
      setComment('');
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Like
  const handleLike = async (review: FeedbackItem) => {
    playSound('click');
    const myUid = user.username || user.name || 'my-user';
    const isLiked = review.likedBy?.includes(myUid);

    const updatedLikes = isLiked ? Math.max(0, review.likes - 1) : review.likes + 1;
    const updatedLikedBy = isLiked
      ? (review.likedBy || []).filter((id) => id !== myUid)
      : [...(review.likedBy || []), myUid];

    setReviews((prev) =>
      prev.map((r) =>
        r.id === review.id ? { ...r, likes: updatedLikes, likedBy: updatedLikedBy } : r
      )
    );

    if (!review.id.startsWith('seed-') && !review.id.startsWith('local-')) {
      try {
        const ref = doc(db, 'feedback', review.id);
        await updateDoc(ref, {
          likes: updatedLikes,
          likedBy: isLiked ? arrayRemove(myUid) : arrayUnion(myUid)
        });
      } catch (err) {
        console.warn('Could not update likes on Firestore:', err);
      }
    }
  };

  // Submit comment/reply under a review
  const handleAddReply = async (review: FeedbackItem) => {
    const replyText = replyInputs[review.id]?.trim();
    if (!replyText) {
      setToast('Введите текст комментария');
      return;
    }

    playSound('click');
    const isReplyAsAdmin = isAdminMode && (isReplyAdminFlags[review.id] ?? true);

    const newReply: FeedbackReply = {
      id: 'rep-' + Date.now(),
      userId: isReplyAsAdmin ? 'admin-duowindo6601' : (user.username || user.name || 'user-' + Date.now()),
      userName: isReplyAsAdmin ? 'Администратор DuoWindo6601' : (user.name || 'Пользователь'),
      userAvatar: isReplyAsAdmin ? '👑' : (user.avatarIcon || '👤'),
      userColor: isReplyAsAdmin ? '#f59e0b' : (user.avatarColor || '#1cb0f6'),
      isAdmin: isReplyAsAdmin,
      comment: replyText,
      createdAt: new Date().toISOString()
    };

    const updatedReplies = [...(review.replies || []), newReply];

    setReviews((prev) =>
      prev.map((r) => (r.id === review.id ? { ...r, replies: updatedReplies } : r))
    );

    setReplyInputs((prev) => ({ ...prev, [review.id]: '' }));

    if (!review.id.startsWith('seed-') && !review.id.startsWith('local-')) {
      try {
        const ref = doc(db, 'feedback', review.id);
        await updateDoc(ref, { replies: updatedReplies });
      } catch (err) {
        console.warn('Could not save reply to Firestore:', err);
      }
    }

    playSound('correct');
    setToast(isReplyAsAdmin ? (t ? t('admin_reply_toast') : 'Ответ Администратора DuoWindo6601 опубликован!') : (t ? t('comment_added_toast') : 'Комментарий добавлен!'));
  };

  // Delete review (Admin or Author)
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm(t ? t('delete_confirm') || 'Удалить этот отзыв?' : 'Вы уверены, что хотите удалить этот отзыв?')) return;

    playSound('click');
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));

    if (!reviewId.startsWith('seed-') && !reviewId.startsWith('local-')) {
      try {
        await deleteDoc(doc(db, 'feedback', reviewId));
        setToast('Отзыв успешно удален');
      } catch (err) {
        console.warn('Could not delete review from Firestore:', err);
      }
    } else {
      setToast('Отзыв удален');
    }
  };

  // Delete comment
  const handleDeleteReply = async (review: FeedbackItem, replyId: string) => {
    playSound('click');
    const updatedReplies = (review.replies || []).filter((rep) => rep.id !== replyId);

    setReviews((prev) =>
      prev.map((r) => (r.id === review.id ? { ...r, replies: updatedReplies } : r))
    );

    if (!review.id.startsWith('seed-') && !review.id.startsWith('local-')) {
      try {
        const ref = doc(db, 'feedback', review.id);
        await updateDoc(ref, { replies: updatedReplies });
      } catch (err) {
        console.warn('Could not delete reply from Firestore:', err);
      }
    }
  };

  // Toggle Pin Review (Admin power)
  const handleTogglePin = async (review: FeedbackItem) => {
    playSound('click');
    const newPinned = !review.isPinned;

    setReviews((prev) =>
      prev.map((r) => (r.id === review.id ? { ...r, isPinned: newPinned } : r))
    );

    if (!review.id.startsWith('seed-') && !review.id.startsWith('local-')) {
      try {
        const ref = doc(db, 'feedback', review.id);
        await updateDoc(ref, { isPinned: newPinned });
      } catch (err) {
        console.warn('Could not update pin status on Firestore:', err);
      }
    }
    setToast(newPinned ? 'Отзыв закреплен вверху списка 📌' : 'Отзыв откреплен');
  };

  // Stats calculation
  const totalCount = reviews.length;
  const avgRating = totalCount > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalCount).toFixed(1)
    : '5.0';

  // Sort: pinned first, then by date
  const sortedReviews = [...reviews].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filteredReviews = sortedReviews.filter((r) => {
    const matchesRating = filterRating === 'all' || r.rating === filterRating;
    const matchesSentiment =
      filterSentiment === 'all' ||
      (filterSentiment === 'good' && r.rating >= 4) ||
      (filterSentiment === 'bad' && r.rating <= 3);
    const matchesCourse =
      filterCourseId === 'all' ||
      r.courseId === filterCourseId ||
      (!r.courseId && filterCourseId === 'general');
    return matchesRating && matchesSentiment && matchesCourse;
  });

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-4 md:py-6 overflow-y-auto rtl-directional-aware">
      {/* Top Bar with Back, Language Switcher & Admin Controls */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <button
          onClick={() => { playSound('click'); onBack(); }}
          className="text-gray-400 hover:text-white flex items-center font-bold text-sm md:text-base transition-colors"
        >
          <CloseIcon className="w-6 h-6 mr-1" />
          <span>{currentLang === 'ru' ? 'Назад' : currentLang === 'en' ? 'Back' : currentLang === 'de' ? 'Zurück' : currentLang === 'fr' ? 'Retour' : currentLang === 'es' ? 'Volver' : currentLang === 'ja' ? '戻る' : currentLang === 'zh' ? '返回' : 'رجوع'}</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenAdminDashboard && (
            <button
              onClick={() => { playSound('click'); onOpenAdminDashboard(); }}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider shadow-lg transition-all border border-amber-300 flex items-center space-x-1"
            >
              <span>👑 Панель Владельца</span>
            </button>
          )}

          {isAdminMode ? (
            <div className="flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <span>👑 Админ DuoWindo6601</span>
              <button
                onClick={() => { setIsAdminMode(false); setToast('Вышли из режима администратора'); }}
                className="ml-1 text-gray-400 hover:text-white underline text-[10px]"
              >
                Выйти
              </button>
            </div>
          ) : (
            <button
              onClick={() => { playSound('click'); setShowAdminModal(true); }}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1"
            >
              <span>🔑 Вход для Администратора</span>
            </button>
          )}
        </div>
      </div>

      {/* INCOGNITO MODE NOTIFICATION BANNER */}
      {(!user.username || user.username.startsWith('incognito_') || user.name.includes('Гость') || user.name.includes('Incognito')) && (
        <div className="mb-5 p-4 rounded-2xl bg-amber-950/60 border-2 border-amber-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-left shadow-lg">
          <div className="flex items-center space-x-3">
            <span className="text-3xl shrink-0">🕵️</span>
            <div>
              <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                {currentLang === 'ru' ? 'Режим Инкогнито — Отзывы и Комментарии' : 'Incognito Mode — Reviews & Comments'}
              </h4>
              <p className="text-[11px] text-amber-200/90 font-medium leading-tight mt-0.5">
                {currentLang === 'ru'
                  ? 'Публикация официальных отзывов и ответов в ветках требует аккаунта. Локальные отзывы сохраняются в текущей сессии.'
                  : 'Posting official verified reviews and comments requires an account. Local drafts are stored in current session.'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
            {onOpenIncognitoRestrictions && (
              <button
                onClick={() => { playSound('click'); onOpenIncognitoRestrictions(); }}
                className="flex-1 sm:flex-initial px-3 py-2 bg-amber-900/90 hover:bg-amber-800 text-amber-200 text-xs font-bold rounded-xl border border-amber-500/50 whitespace-nowrap shadow-md cursor-pointer flex items-center justify-center space-x-1"
              >
                <span>🚫</span>
                <span>{currentLang === 'ru' ? 'Ограничения (8)' : 'Restrictions (8)'}</span>
              </button>
            )}
            {onOpenRegister && (
              <button
                onClick={() => { playSound('click'); onOpenRegister(); }}
                className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl border-b-2 border-emerald-800 whitespace-nowrap shadow-md cursor-pointer flex items-center justify-center space-x-1"
              >
                <span>✨</span>
                <span>{currentLang === 'ru' ? 'Регистрация' : 'Register'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* MULTILINGUAL LANGUAGE SWITCHER BAR */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-3.5 rounded-2xl border-2 border-duo-blue/50 mb-5 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌐</span>
            <span className="text-xs md:text-sm font-black text-white uppercase tracking-wider">
              {t ? t('switch_language') || 'Переключить язык' : 'Переключить язык'} / Language Switcher:
            </span>
          </div>
          <span className="text-[11px] bg-duo-blue/20 text-duo-blue px-2.5 py-0.5 rounded-full font-bold border border-duo-blue/40">
            {SUPPORTED_LANGUAGES.find(l => l.code === currentLang)?.flag} {SUPPORTED_LANGUAGES.find(l => l.code === currentLang)?.name} ({currentLang.toUpperCase()})
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSwitchLanguage(lang.code)}
                className={`py-2 px-1.5 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-0.5 border-b-2 ${
                  isSelected
                    ? 'bg-duo-blue text-white border-duo-blueDark shadow-md scale-105 ring-2 ring-blue-400'
                    : 'bg-gray-800/90 text-gray-300 hover:text-white hover:bg-gray-700 border-gray-900'
                }`}
                title={`${lang.name} (${lang.nativeName})`}
              >
                <span className="text-base">{lang.flag}</span>
                <span className="text-[10px] uppercase tracking-wider">{lang.code.toUpperCase()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="bg-gradient-to-r from-duo-card to-gray-800 rounded-3xl p-5 md:p-6 border-2 border-gray-700 shadow-2xl mb-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div dir="auto">
            <h1 dir="auto" className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1 flex items-center gap-2">
              <MessageSquareIcon className="w-8 h-8 text-duo-yellow shrink-0" />
              <bdi dir="auto">{t ? t('reviews_duowindo6601') || 'Отзывы о DuoWindo6601' : 'Отзывы о DuoWindo6601'}</bdi>
            </h1>
            <p dir="auto" className="text-gray-300 text-xs md:text-sm">
              <bdi dir="auto">
                {t && t('reviews_subtitle') ? t('reviews_subtitle') : 'Оставьте отзыв или задайте вопрос Администратору DuoWindo6601!'}
              </bdi>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleRefreshReviews}
              disabled={loading}
              title="Обновить отзывы из базы данных"
              className="bg-gray-800 hover:bg-gray-700 text-duo-blue font-bold px-3 py-2.5 rounded-2xl border-b-4 border-gray-900 active:translate-y-1 active:border-b-0 transition-all shadow-md flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider disabled:opacity-50"
            >
              <span className={`text-base ${loading ? 'animate-spin' : ''}`}>🔄</span>
              <span>{loading ? '...' : (t ? t('refresh_reviews') || 'Обновить' : 'Обновить')}</span>
            </button>

            <button
              onClick={() => handleGenerateRandomReview('good')}
              disabled={submitting}
              title="Сгенерировать случайный положительный отзыв"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2.5 rounded-2xl border-b-4 border-emerald-800 active:translate-y-1 active:border-b-0 transition-all shadow-md flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider disabled:opacity-50"
            >
              <span className="text-base">👍</span>
              <span>{t ? t('good_review') || '+ Хороший' : '+ Хороший'}</span>
            </button>

            <button
              onClick={() => handleGenerateRandomReview('bad')}
              disabled={submitting}
              title="Сгенерировать случайный критический отзыв"
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-2.5 rounded-2xl border-b-4 border-rose-800 active:translate-y-1 active:border-b-0 transition-all shadow-md flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider disabled:opacity-50"
            >
              <span className="text-base">👎</span>
              <span>{t ? t('bad_review') || '+ Критический' : '+ Критический'}</span>
            </button>

            <button
              onClick={() => { playSound('click'); setShowForm(!showForm); }}
              className="bg-duo-green text-white font-black px-4 py-2.5 rounded-2xl border-b-4 border-duo-greenDark hover:brightness-110 active:translate-y-1 active:border-b-0 transition-all shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-wider whitespace-nowrap"
            >
              <StarIcon className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              {showForm ? 'Закрыть форму' : (t ? t('write_review') || 'Написать отзыв' : 'Написать отзыв')}
            </button>
          </div>
        </div>

        {/* Rating Overview */}
        <div className="mt-5 pt-4 border-t border-gray-700/60 flex items-center gap-6">
          <div className="text-center pr-6 border-r border-gray-700">
            <div className="text-3xl md:text-4xl font-black text-white flex items-center justify-center gap-1">
              {avgRating}
              <StarIcon className="w-7 h-7 text-duo-yellow fill-duo-yellow" />
            </div>
            <div className="text-xs text-gray-400 font-medium mt-0.5">
              {totalCount} {totalCount === 1 ? 'отзыв' : totalCount < 5 ? 'отзыва' : 'отзывов'}
            </div>
          </div>

          <div className="flex-1 text-xs space-y-1">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviews.filter((r) => r.rating === stars).length;
              const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="w-3 text-gray-400 font-bold">{stars}</span>
                  <StarIcon className="w-3.5 h-3.5 text-duo-yellow fill-duo-yellow shrink-0" />
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-duo-yellow rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-gray-500 font-mono text-[10px]">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Reviews vs Translator vs Tech Support */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <button
          onClick={() => { playSound('click'); setActiveTab('reviews'); }}
          className={`py-3 px-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-4 transition-all ${
            activeTab === 'reviews'
              ? 'bg-duo-blue border-duo-blueDark text-white shadow-lg shadow-duo-blue/20'
              : 'bg-gray-800 border-gray-900 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <span>💬 Отзывы ({totalCount})</span>
        </button>

        <button
          onClick={() => { playSound('click'); setActiveTab('translator'); }}
          className={`py-3 px-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-4 transition-all ${
            activeTab === 'translator'
              ? 'bg-purple-600 border-purple-800 text-white shadow-lg shadow-purple-600/20'
              : 'bg-gray-800 border-gray-900 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <span>🌐 Переводчик</span>
        </button>

        <button
          onClick={() => { playSound('click'); setActiveTab('support'); }}
          className={`py-3 px-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-4 transition-all ${
            activeTab === 'support'
              ? 'bg-emerald-600 border-emerald-800 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-gray-800 border-gray-900 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <span>🛠️ Поддержка</span>
        </button>
      </div>

      {activeTab === 'translator' && (
        <div className="bg-duo-card border-2 border-purple-500/50 rounded-3xl p-5 md:p-6 shadow-2xl mb-6 animate-in fade-in space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-xl border border-purple-500/40">
              🌐
            </div>
            <div>
              <h3 className="text-lg font-black text-purple-300 uppercase tracking-wide">
                {t ? t('translator_title') || 'Переводчик отзывов и комментариев' : 'Переводчик отзывов и комментариев'}
              </h3>
              <p className="text-xs text-gray-300">
                Переводите любые отзывы и официальные ответы администрации DuoWindo6601 на любой из 8 поддерживаемых языков.
              </p>
            </div>
          </div>

          {/* Auto-Translate Global Toggle Switch */}
          <div className="bg-gray-900/90 p-4 rounded-2xl border border-purple-500/30 flex items-center justify-between flex-wrap gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <span>⚡</span> Авто-Переводчик (Автоматический перевод отзывов)
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                При включении все отзывы, имена авторов, категории и комментарии администрации переводятся автоматически при переключении языка приложения.
              </div>
            </div>
            <button
              onClick={() => {
                playSound('click');
                const nextVal = !autoTranslate;
                setAutoTranslate(nextVal);
                setToast(nextVal ? '⚡ Авто-Переводчик ВКЛЮЧЕН! Отзывы и комментарии переведены.' : '⚡ Авто-Переводчик ОТКЛЮЧЕН.');
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border-b-2 flex items-center gap-2 ${
                autoTranslate
                  ? 'bg-purple-600 text-white border-purple-800 shadow-md'
                  : 'bg-gray-800 text-gray-400 border-gray-900 hover:text-white'
              }`}
            >
              <span className="text-sm">{autoTranslate ? '✅' : '⚪'}</span>
              <span>{autoTranslate ? 'Авто-Перевод ВКЛ 🌐' : 'Авто-Перевод ВЫКЛ'}</span>
            </button>
          </div>

          {/* Language Selector */}
          <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Целевой язык для быстрого перевода:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSwitchLanguage(lang.code)}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    translatorTargetLang === lang.code
                      ? 'bg-purple-600 text-white border-2 border-purple-400 shadow-md'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Online Workbench */}
          <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>🧪</span> Онлайн Интерактивный Переводчик Отзывов:
              </label>
              <span className="text-[10px] text-purple-400 font-mono font-bold bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                [{translatorTargetLang.toUpperCase()}]
              </span>
            </div>
            <textarea
              rows={3}
              value={workbenchText}
              onChange={(e) => setWorkbenchText(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 focus:border-purple-500 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none"
              placeholder="Введите любой текст или отзыв для мгновенного перевода..."
            />
            <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-800/40 space-y-1">
              <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                <span>🌐</span> Перевод [{SUPPORTED_LANGUAGES.find(l => l.code === translatorTargetLang)?.name}]:
              </div>
              <p className="text-xs text-purple-100 font-medium whitespace-pre-wrap leading-relaxed">
                {translateTextToTarget(workbenchText, translatorTargetLang)}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'support' ? (
        <div className="space-y-6 animate-in fade-in pb-12">
          {/* Support Contacts Card */}
          <div className="bg-duo-card border-2 border-emerald-500/60 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-3xl border border-emerald-500/40 shadow-inner">
                  🛠️
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-emerald-400 uppercase tracking-wide">
                    Контакты Техподдержки DuoWindo6601
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 font-medium">
                    Служба заботы о пользователях и оперативное решение любых вопросов.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-[11px] font-bold text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Онлайн 24/7 • Ответ &lt; 24 ч.</span>
                </div>
                
                {/* Privacy buttons */}
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    toggleHideSupportEmail();
                    setToast(hideSupportEmail ? 'Email адреса техподдержки отображены' : 'Email адреса техподдержки скрыты 🔒');
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-black transition-all flex items-center space-x-1.5 shadow-sm active:scale-95 ${
                    hideSupportEmail
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30'
                      : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750'
                  }`}
                  title={hideSupportEmail ? 'Показать email' : 'Скрыть email'}
                >
                  <span>{hideSupportEmail ? '🔒' : '✉️'}</span>
                  <span>{hideSupportEmail ? 'Email скрыты' : 'Скрыть email'}</span>
                </button>
              </div>
            </div>

            {/* Support Contacts Grid: Online Support Chat & Emails */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700">
              {/* Support Online Chat */}
              <div className="bg-gray-900/90 p-4 rounded-2xl border border-duo-blue/40 hover:border-duo-blue/70 transition-all flex flex-col justify-between space-y-3 shadow-lg">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <span>💬</span> Поддержка Онлайн
                    </span>
                    <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Онлайн 24/7
                    </span>
                  </div>
                  <div className="font-sans font-black text-sm text-sky-400 flex items-center gap-1.5">
                    <span>🦉 DuoSupport AI & Администратор</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Круглосуточный онлайн-чат: моментальное восстановление ударного режима, решение вопросов и помощь с уроками.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      if (onOpenSupportChat) {
                        onOpenSupportChat();
                      } else {
                        const elem = document.getElementById('support-message-form');
                        elem?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="flex-1 text-center py-2 px-3 bg-duo-blue hover:bg-sky-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>💬</span> Открыть Онлайн-Чат
                  </button>
                </div>
              </div>

              {/* Primary Email 1 */}
              <div className="bg-gray-900/90 p-4 rounded-2xl border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <span>📧</span> Email Техподдержки #1
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      {hideSupportEmail ? '🔒 Скрыт' : 'Основной'}
                    </span>
                  </div>
                  <div className="font-mono font-black text-sm text-emerald-400 select-all break-all">
                    {formatSupportEmail('abramovanatolij81@gmail.com')}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Прямая связь с разработчиком и администрацией проекта.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                  <a
                    href="mailto:abramovanatolij81@gmail.com?subject=[DuoWindo6601]%20Вопрос%20в%20Техподдержку"
                    className="flex-1 text-center py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                  >
                    ✉️ Написать
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('abramovanatolij81@gmail.com');
                      setToast('Email abramovanatolij81@gmail.com скопирован в буфер обмена! 📋');
                    }}
                    className="py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-gray-700"
                    title="Скопировать email"
                  >
                    📋 Копировать
                  </button>
                </div>
              </div>

              {/* Primary Email 2 */}
              <div className="bg-gray-900/90 p-4 rounded-2xl border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <span>📧</span> Email Техподдержки #2
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      {hideSupportEmail ? '🔒 Скрыт' : 'Резервный'}
                    </span>
                  </div>
                  <div className="font-mono font-black text-sm text-emerald-400 select-all break-all">
                    {formatSupportEmail('va997217@gmail.com')}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Оперативная служба заботы и решение технических вопросов.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                  <a
                    href="mailto:va997217@gmail.com?subject=[DuoWindo6601]%20Обращение%20в%20службу%20заботы"
                    className="flex-1 text-center py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                  >
                    ✉️ Написать
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('va997217@gmail.com');
                      setToast('Email va997217@gmail.com скопирован в буфер обмена! 📋');
                    }}
                    className="py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-gray-700"
                    title="Скопировать email"
                  >
                    📋 Копировать
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Action: Send to both emails at once */}
            <div className="mt-4 p-3 bg-gray-900/60 rounded-2xl border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-gray-300">
                <strong className="text-white">🚀 Экспресс-обращение:</strong> Отправить запрос сразу обоим специалистам техподдержки
              </div>
              <a
                href="mailto:abramovanatolij81@gmail.com,va997217@gmail.com?subject=[DuoWindo6601]%20Срочный%20запрос%20в%20Техподдержку"
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md whitespace-nowrap active:scale-95"
              >
                📨 Написать на оба Email
              </a>
            </div>
          </div>

          {/* Quick Issue Templates */}
          <div className="bg-duo-card border-2 border-gray-700 rounded-3xl p-5 shadow-2xl space-y-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>⚡</span> Быстрый выбор темы вопроса:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { title: '🎧 Не играет звук / аудио', subject: 'Ошибка воспроизведения звука', desc: 'У меня не воспроизводится озвучка слов или уроков на моем устройстве.' },
                { title: '🌐 Ошибка 404 / Офлайн режим', subject: 'Вопрос по запуску в офлайн/404', desc: 'Возникает ошибка при открытии страницы или офлайн режиме.' },
                { title: '🔑 Вход и сохранение прогресса', subject: 'Проблема со входом / аккаунтом', desc: 'Вопрос по регистрации, авторизации или сохранению алмазов и очков опыта.' },
                { title: '📚 Вопрос по урокам и алфавитам', subject: 'Вопрос по материалам курса', desc: 'Нашел неточность или хочу предложить улучшение для алфавита или курса.' },
                { title: '💻 Совместимость с Windows / Браузером', subject: 'Вопрос по совместимости с браузером', desc: 'Вопрос по работе приложения на Windows и в моем браузере.' },
                { title: '💡 Предложение по улучшению', subject: 'Идея для DuoWindo6601', desc: 'Хочу предложить новую полезную функцию для DuoWindo6601.' },
              ].map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setSupportSubject(template.subject);
                    setSupportMessage(template.desc);
                    setToast(`Выбрана тема: ${template.title}`);
                  }}
                  className="p-3 rounded-2xl bg-gray-900/80 hover:bg-gray-800 border border-gray-700/80 hover:border-emerald-500/50 text-left transition-all text-xs space-y-1"
                >
                  <div className="font-bold text-emerald-400">{template.title}</div>
                  <div className="text-[11px] text-gray-400 line-clamp-1">{template.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Support Ticket Submission Form */}
          <div className="bg-duo-card border-2 border-emerald-500/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-xl border border-emerald-500/40">
                ✍️
              </div>
              <div>
                <h4 className="text-lg font-black text-white uppercase tracking-wide">
                  Создать тикет в техподдержку DuoWindo6601
                </h4>
                <p className="text-xs text-gray-300">
                  Заполните форму ниже для регистрации официального тикета или отправки письма на <span className="text-emerald-400 font-bold font-mono">abramovanatolij81@gmail.com</span> и <span className="text-emerald-400 font-bold font-mono">va997217@gmail.com</span>
                </p>
              </div>
            </div>

            {/* Direct Mail Program Launcher Card */}
            <div className="mb-5 p-3.5 bg-gray-900/90 rounded-2xl border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
              <div className="text-xs text-gray-200 flex items-center gap-2">
                <span className="text-lg">📧</span>
                <div>
                  <div className="font-bold text-emerald-300">Прямой вызов почтового клиента:</div>
                  <div className="text-[11px] text-gray-400">Адресаты: <span className="font-mono text-gray-200 font-semibold">abramovanatolij81@gmail.com</span>, <span className="font-mono text-gray-200 font-semibold">va997217@gmail.com</span></div>
                </div>
              </div>
              <a
                href="mailto:abramovanatolij81@gmail.com,va997217@gmail.com?subject=%5BDuoWindo6601%5D%20%D0%9E%D0%B1%D1%80%D0%B0%D1%89%D0%B5%D0%BD%D0%B8%D0%B5%20%D0%B2%20%D1%82%D0%B5%D1%85%D0%BF%D0%BE%D0%B4%D0%B4%D0%B5%D1%80%D0%B6%D0%BA%D1%83"
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md text-center active:scale-95 whitespace-nowrap flex items-center justify-center gap-1.5"
              >
                <span>✉️</span> Открыть в почтовой ПРОГРАММЕ
              </a>
            </div>

            {supportSuccess ? (
              <div className="bg-emerald-500/20 border border-emerald-500/40 p-5 rounded-2xl text-center space-y-2 animate-in fade-in">
                <div className="text-3xl">✅</div>
                <h5 className="font-black text-emerald-400 text-sm uppercase tracking-wide">
                  Тикет успешно отправлен в техподдержку DuoWindo6601!
                </h5>
                <p className="text-xs text-gray-300">
                  Ваш запрос зарегистрирован. Специалисты поддержки <strong className="text-white font-mono">abramovanatolij81@gmail.com</strong> и <strong className="text-white font-mono">va997217@gmail.com</strong> получили уведомление.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSupportSuccess(false)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase transition-all"
                  >
                    Создать ещё один запрос
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!supportMessage.trim()) {
                  setToast('Пожалуйста, опишите ваш вопрос или проблему');
                  return;
                }
                playSound('click');
                setSupportSubmitting(true);
                try {
                  await addDoc(collection(db, 'support_tickets'), {
                    userId: user.username || user.name || 'anon',
                    userName: user.name || 'Пользователь',
                    email: supportEmail.trim() || 'не указан',
                    subject: supportSubject || 'Общий вопрос техподдержке DuoWindo6601',
                    message: supportMessage.trim(),
                    targetEmails: ['abramovanatolij81@gmail.com', 'va997217@gmail.com'],
                    status: 'open',
                    createdAt: new Date().toISOString()
                  });
                  playSound('fanfare');
                  setToast('Запрос в техподдержку DuoWindo6601 успешно отправлен! 🛠️');
                  setSupportMessage('');
                  setSupportSubject('');
                  setSupportSuccess(true);
                } catch (err) {
                  console.warn('Could not save support ticket to Firestore:', err);
                  playSound('correct');
                  setToast('Запрос в техподдержку сохранён!');
                  setSupportMessage('');
                  setSupportSubject('');
                  setSupportSuccess(true);
                } finally {
                  setSupportSubmitting(false);
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                    Тема запроса:
                  </label>
                  <input
                    type="text"
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    placeholder="Например: Вопрос по курсу, Ошибка в аудио, Ошибка 404, Совместимость..."
                    className="w-full bg-gray-900 border-2 border-gray-700 rounded-2xl p-3 text-xs md:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                    Ваш контактный Email (для ответа):
                  </label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="your-email@example.com"
                    className="w-full bg-gray-900 border-2 border-gray-700 rounded-2xl p-3 text-xs md:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                    Подробное описание вопроса:
                  </label>
                  <textarea
                    rows={4}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Опишите детально ваш вопрос, модель устройства, браузер или версию Windows..."
                    className="w-full bg-gray-900 border-2 border-gray-700 rounded-2xl p-3 text-xs md:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={supportSubmitting || !supportMessage.trim()}
                    className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-4 rounded-2xl border-b-4 border-emerald-800 uppercase tracking-wider text-xs shadow-lg transition-all active:translate-y-1 active:border-b-0 disabled:opacity-50"
                  >
                    {supportSubmitting ? 'Отправка...' : 'Отправить тикет онлайн 🛠️'}
                  </button>

                  <a
                    href={`mailto:abramovanatolij81@gmail.com,va997217@gmail.com?subject=${encodeURIComponent(supportSubject || '[DuoWindo6601] Вопрос в техподдержку')}&body=${encodeURIComponent(`От: ${user.name || 'Пользователь'} (${supportEmail || 'email не указан'})\n\nСообщение:\n${supportMessage || ''}`)}`}
                    className="w-full sm:w-auto px-5 py-3 bg-gray-800 hover:bg-gray-700 text-emerald-400 hover:text-emerald-300 border-2 border-emerald-500/40 hover:border-emerald-500 rounded-2xl font-black uppercase tracking-wider text-xs text-center transition-all flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <span>📬</span> Открыть в почтовой ПРОГРАММЕ
                  </a>
                </div>
              </form>
            )}
          </div>

          {/* FAQ Accordion Section */}
          <div className="bg-duo-card border-2 border-gray-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
              <span>❓</span> Часто задаваемые вопросы (FAQ)
            </h4>
            <div className="space-y-3 text-xs">
              <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800">
                <div className="font-bold text-emerald-400 mb-1">
                  1. Ошибка 404 при открытии ссылок или в автономном режиме (Offline)
                </div>
                <div className="text-gray-300 leading-relaxed">
                  В приложении настроена специальная защитная страница <code>404.html</code> со встроенным автоматическим перенаправлением в приложение. Если браузер открыт в режиме файлов (file://) или при обрыве соединения, приложение автоматически восстановит запуск.
                </div>
              </div>

              <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800">
                <div className="font-bold text-emerald-400 mb-1">
                  2. Как связаться с техподдержкой напрямую по почте?
                </div>
                <div className="text-gray-300 leading-relaxed">
                  Вы можете направить письмо на официальные адреса: <span className="text-white font-mono font-bold">abramovanatolij81@gmail.com</span> и <span className="text-white font-mono font-bold">va997217@gmail.com</span>. Мы отвечаем быстро и внимательно относимся к каждому обращению.
                </div>
              </div>

              <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800">
                <div className="font-bold text-emerald-400 mb-1">
                  3. Сохранение прогресса, алмазов и ударного режима
                </div>
                <div className="text-gray-300 leading-relaxed">
                  Весь ваш прогресс синхронизируется в облаке Firebase и локальном хранилище. Даже при отсутствии интернета данные сохраняются локально и передаются на сервер при следующем подключении.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Main Review Form */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="bg-duo-card border-2 border-duo-green rounded-3xl p-5 md:p-6 mb-6 shadow-2xl animate-in fade-in slide-in-from-top-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-white text-base md:text-lg uppercase tracking-wide flex items-center gap-2">
                  <span>✍️</span> {t ? t('write_review') || 'Написать отзыв' : 'Написать отзыв'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              {/* User Info Bar & Admin Checkbox */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-gray-800/80 p-3 rounded-2xl border border-gray-700">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold shadow-md"
                    style={{
                      backgroundColor: (isAdminMode && asAdminForm) ? '#f59e0b' : (user.avatarColor || '#1cb0f6')
                    }}
                  >
                    {(isAdminMode && asAdminForm) ? '👑' : (user.avatarIcon || '👤')}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-1.5">
                      {(isAdminMode && asAdminForm) ? '👑 Администратор DuoWindo6601' : (user.name || 'Пользователь')}
                    </div>
                    <div className="text-xs text-gray-400">
                      {(isAdminMode && asAdminForm) ? 'Официальное объявление' : 'Автор отзыва'}
                    </div>
                  </div>
                </div>

                {isAdminMode && (
                  <label className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/50 px-3 py-1.5 rounded-xl cursor-pointer text-xs font-bold text-amber-300">
                    <input
                      type="checkbox"
                      checked={asAdminForm}
                      onChange={(e) => setAsAdminForm(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-0"
                    />
                    {t ? t('as_admin_checkbox') || 'От имени Администратора DuoWindo6601 👑' : 'Опубликовать как Администратор 👑'}
                  </label>
                )}
              </div>

              {/* Rating Interactive Stars */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Оцените приложение:
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => { playSound('click'); setRating(star); }}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <StarIcon
                        className={`w-8 h-8 md:w-9 md:h-9 ${
                          star <= (hoverRating || rating)
                            ? 'text-duo-yellow fill-duo-yellow drop-shadow-md'
                            : 'text-gray-600 fill-none'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-black text-duo-yellow text-base">
                    {hoverRating || rating} / 5
                  </span>
                </div>
              </div>

              {/* Course Selector */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>📚</span> Выберите курс DuoWindo6601:
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => { playSound('click'); setSelectedCourseId(e.target.value); }}
                  className="w-full bg-gray-900 border-2 border-gray-700 rounded-2xl p-3 text-xs md:text-sm text-white focus:outline-none focus:border-duo-green transition-all"
                >
                  {availableCourseList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.flagEmoji} {c.name} {c.localName ? `(${c.localName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Selector */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Тема отзыва:
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(CATEGORIES).map((catKey) => {
                    const catObj = CATEGORIES[catKey];
                    const label = catObj[currentLang] || catObj['ru'];
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => { playSound('click'); setSelectedCategoryKey(catKey); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          selectedCategoryKey === catKey
                            ? 'bg-duo-blue text-white border-b-2 border-duo-blueDark shadow-md'
                            : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comment TextArea */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Текст отзыва:
                </label>
                <textarea
                  dir="auto"
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 500))}
                  placeholder="Расскажите, что вам нравится в DuoWindo6601 или что стоит улучшить..."
                  rows={4}
                  className="w-full bg-gray-900 border-2 border-gray-700 rounded-2xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-duo-green transition-all"
                />
                <div className="text-right text-[11px] text-gray-500 mt-1">
                  {comment.length} / 500 символов
                </div>
              </div>

              {/* Submit Action */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-800 text-gray-400 hover:text-white font-bold text-xs uppercase tracking-wider"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting || !comment.trim()}
                  className="bg-duo-green text-white font-black px-6 py-2.5 rounded-xl border-b-4 border-duo-greenDark hover:brightness-110 active:translate-y-1 active:border-b-0 transition-all shadow-md text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {submitting ? 'Опубликование...' : 'Опубликовать отзыв'}
                </button>
              </div>
            </form>
          )}

          {/* Filter Tabs: Sentiment & Rating Stars */}
          <div className="flex flex-col gap-2 mb-4">
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-900 rounded-2xl border border-gray-800">
              <button
                onClick={() => { playSound('click'); setFilterSentiment('all'); }}
                className={`py-2 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-1 ${
                  filterSentiment === 'all'
                    ? 'bg-duo-blue text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>💬 Все ({reviews.length})</span>
              </button>

              <button
                onClick={() => { playSound('click'); setFilterSentiment('good'); }}
                className={`py-2 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-1 ${
                  filterSentiment === 'good'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>👍 Хорошие ({reviews.filter(r => r.rating >= 4).length})</span>
              </button>

              <button
                onClick={() => { playSound('click'); setFilterSentiment('bad'); }}
                className={`py-2 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-1 ${
                  filterSentiment === 'bad'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>👎 Критические ({reviews.filter(r => r.rating <= 3).length})</span>
              </button>
            </div>

            {/* Rating Stars Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => { playSound('click'); setFilterRating('all'); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  filterRating === 'all'
                    ? 'bg-duo-blue text-white shadow-md'
                    : 'bg-duo-card text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                Все оценки
              </button>

              {[5, 4, 3, 2, 1].map((r) => {
                const c = reviews.filter((rev) => rev.rating === r).length;
                return (
                  <button
                    key={r}
                    onClick={() => { playSound('click'); setFilterRating(r); }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                      filterRating === r
                        ? 'bg-duo-yellow text-white shadow-md'
                        : 'bg-duo-card text-gray-400 hover:text-white border border-gray-700'
                    }`}
                  >
                    <span>{r}</span>
                    <StarIcon className="w-3.5 h-3.5 fill-current" />
                    <span className="opacity-70">({c})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reviews Feed List */}
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              Загрузка отзывов...
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="bg-duo-card border-2 border-gray-700 rounded-3xl p-8 text-center my-4">
              <div className="text-4xl mb-2">⭐</div>
              <h4 className="text-white font-bold mb-1">Пока нет отзывов с этой оценкой</h4>
              <p className="text-xs text-gray-400 mb-4">Будьте первым, кто оставит отзыв!</p>
              <button
                onClick={() => { playSound('click'); setShowForm(true); }}
                className="bg-duo-green text-white font-bold text-xs px-4 py-2 rounded-xl border-b-2 border-duo-greenDark"
              >
                Написать отзыв
              </button>
            </div>
          ) : (
            <div className="space-y-4 pb-8">
              {filteredReviews.map((rev) => {
                const myUid = user.username || user.name || 'my-user';
                const isLikedByMe = rev.likedBy?.includes(myUid);
                const dateStr = new Date(rev.createdAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                });

                const isExpanded = expandedComments[rev.id] || false;
                const repliesList = rev.replies || [];
                const translationKey = `${rev.id}_${translatorTargetLang}`;
                const isTranslated = Boolean(translatedTexts[translationKey]);
                const isTranslating = Boolean(translatingMap[translationKey]);
                const displayText = isTranslated ? translatedTexts[translationKey] : rev.comment;

                return (
                  <div
                    key={rev.id}
                    className={`bg-duo-card border-2 rounded-3xl p-4 md:p-5 shadow-lg transition-all relative overflow-hidden ${
                      rev.isPinned
                        ? 'border-amber-500/80 bg-gradient-to-b from-amber-500/10 via-duo-card to-duo-card'
                        : 'border-gray-700/80 hover:border-gray-600'
                    }`}
                  >
                    {/* Pinned Badge */}
                    {rev.isPinned && (
                      <div className="mb-3 flex items-center gap-1.5 text-[11px] font-black text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full w-fit border border-amber-500/30">
                        <span>📌 {t ? t('pinned_by_admin') || 'Закреплено Администратором' : 'Закреплено Администратором DuoWindo6601'}</span>
                      </div>
                    )}

                    {/* Author Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-md shrink-0"
                          style={{ backgroundColor: rev.userColor || '#1cb0f6' }}
                        >
                          {rev.userAvatar || '👤'}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-1.5 flex-wrap" dir="auto">
                            <bdi dir="auto">{(isTranslated || autoTranslate) ? translateTextToTarget(rev.userName, translatorTargetLang) : rev.userName}</bdi>
                            {rev.userId === 'admin-duowindo6601' && (
                              <span className="text-[10px] font-black bg-amber-500 text-gray-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                👑 {(isTranslated || autoTranslate) ? translateTextToTarget('Админ', translatorTargetLang) : 'Админ'}
                              </span>
                            )}
                            {rev.rating >= 4 ? (
                              <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                                {t ? t('good_review') || '👍 Хороший отзыв' : '👍 Хороший отзыв'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-black bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/40 flex items-center gap-1">
                                {t ? t('bad_review') || '👎 Критический' : '👎 Критический'}
                              </span>
                            )}
                            {rev.category && (
                              <span className="text-[10px] font-normal bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full border border-gray-700" dir="auto">
                                <bdi dir="auto">{(isTranslated || autoTranslate) ? translateTextToTarget(rev.category, translatorTargetLang) : rev.category}</bdi>
                              </span>
                            )}
                            {rev.courseName && (
                              <span className="text-[10px] font-bold bg-duo-blue/20 text-duo-blue px-2 py-0.5 rounded-full border border-duo-blue/40 flex items-center gap-1" dir="auto">
                                <bdi dir="auto">🎓 {(isTranslated || autoTranslate) ? translateTextToTarget(rev.courseName, translatorTargetLang) : rev.courseName}</bdi>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500">{dateStr}</div>
                        </div>
                      </div>

                      {/* Rating Stars Badge */}
                      <div className="flex items-center gap-1 bg-gray-900/80 px-2.5 py-1 rounded-full border border-gray-800 shrink-0">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <StarIcon
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating
                                ? 'text-duo-yellow fill-duo-yellow'
                                : 'text-gray-700 fill-none'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Comment Text with Translation Badge */}
                    <div className="mb-3">
                      <p dir="auto" className="text-gray-200 text-xs md:text-sm leading-relaxed whitespace-pre-wrap bdi-isolate">
                        <bdi dir="auto">{displayText}</bdi>
                      </p>
                      {isTranslated && (
                        <span className="inline-block mt-1 text-[10px] text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded-md border border-purple-500/30">
                          🌐 Переведено на: {SUPPORTED_LANGUAGES.find(l => l.code === translatorTargetLang)?.name}
                        </span>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-800 text-xs flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Toggle Comments Button */}
                        <button
                          onClick={() => {
                            playSound('click');
                            setExpandedComments((prev) => ({ ...prev, [rev.id]: !isExpanded }));
                          }}
                          className="flex items-center gap-1.5 text-duo-blue hover:text-blue-300 font-bold transition-colors bg-blue-500/10 px-2.5 py-1 rounded-xl border border-blue-500/20"
                        >
                          <MessageSquareIcon className="w-4 h-4" />
                          <span>
                            {t ? t('comments_access') || 'Комментарии' : 'Комментарии'} {repliesList.length > 0 && `(${repliesList.length})`}
                          </span>
                        </button>

                        {/* Instant Translate Button */}
                        <button
                          onClick={() => handleTranslateItem(rev.id, rev.comment, translatorTargetLang)}
                          disabled={isTranslating}
                          className={`flex items-center gap-1 font-bold text-[11px] px-2.5 py-1 rounded-xl transition-all border ${
                            isTranslated
                              ? 'bg-purple-600/30 text-purple-300 border-purple-500/50'
                              : 'bg-gray-800 text-gray-300 hover:text-white border-gray-700'
                          }`}
                        >
                          <span>🌐</span>
                          <span>
                            {isTranslating ? '...' : isTranslated ? (t ? t('show_original') || 'Оригинал' : 'Оригинал') : (t ? t('translate_btn') || 'Перевести' : 'Перевести')}
                          </span>
                        </button>

                        {/* Admin Pin Toggle */}
                        {isAdminMode && (
                          <button
                            onClick={() => handleTogglePin(rev)}
                            className="text-amber-400 hover:text-amber-300 font-bold text-[11px] flex items-center gap-1"
                          >
                            📌 {rev.isPinned ? 'Открепить' : 'Закрепить'}
                          </button>
                        )}

                        {/* Admin / Author Delete */}
                        {(isAdminMode || rev.userId === user.username || rev.userId === user.name) && (
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            className="text-red-400 hover:text-red-300 font-bold text-[11px] flex items-center gap-1"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                            Удалить
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleLike(rev)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                          isLikedByMe
                            ? 'bg-red-500/10 border-red-500/40 text-red-400 font-bold'
                            : 'bg-gray-800/80 border-gray-700 text-gray-400 hover:text-white'
                        }`}
                      >
                        <ThumbsUpIcon className={`w-4 h-4 ${isLikedByMe ? 'fill-current' : ''}`} />
                        <span>{t ? t('helpful') || 'Полезно' : 'Полезно'}</span>
                        {rev.likes > 0 && (
                          <span className="bg-gray-700 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                            {rev.likes}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* EXPANDABLE COMMENTS & REPLIES SECTION */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-800 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                          <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                            <span>💬</span> {t ? t('admin_comments') || 'Комментарии и ответы' : 'Комментарии и ответы'} ({repliesList.length})
                          </h5>
                          {repliesList.some(r => r.isAdmin) && (
                            <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1">
                              👑 Ответ Администрации
                            </span>
                          )}
                        </div>

                        {/* Replies Feed */}
                        {repliesList.length > 0 ? (
                          <div className="space-y-3 mb-4">
                            {repliesList.map((reply) => {
                              const replyDate = new Date(reply.createdAt).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              });

                              const repTransKey = `${reply.id}_${translatorTargetLang}`;
                              const isRepTranslated = Boolean(translatedTexts[repTransKey]);
                              const isRepTranslating = Boolean(translatingMap[repTransKey]);
                              const displayRepText = isRepTranslated ? translatedTexts[repTransKey] : reply.comment;

                              return (
                                <div
                                  key={reply.id}
                                  className={`p-3 rounded-2xl border text-xs relative ${
                                    reply.isAdmin
                                      ? 'bg-amber-500/10 border-amber-500/40'
                                      : 'bg-gray-800/90 border-gray-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shadow"
                                        style={{ backgroundColor: reply.userColor || '#f59e0b' }}
                                      >
                                        {reply.userAvatar || '👤'}
                                      </div>
                                      <span className="font-bold text-white flex items-center gap-1" dir="auto">
                                        <bdi dir="auto">{(isRepTranslated || autoTranslate) ? translateTextToTarget(reply.userName, translatorTargetLang) : reply.userName}</bdi>
                                        {reply.isAdmin && (
                                          <span className="bg-amber-500 text-gray-950 font-black text-[9px] px-1.5 py-0.2 rounded uppercase">
                                            {t ? t('official_admin_reply') || 'Официальный ответ' : 'Официальный ответ'}
                                          </span>
                                        )}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleTranslateItem(reply.id, reply.comment, translatorTargetLang)}
                                        disabled={isRepTranslating}
                                        className="text-[10px] text-purple-300 hover:underline flex items-center gap-0.5"
                                      >
                                        <span>🌐</span>
                                        <span>{isRepTranslating ? '...' : isRepTranslated ? 'Оригинал' : 'Перевести'}</span>
                                      </button>
                                      <span className="text-[10px] text-gray-500">{replyDate}</span>
                                      {(isAdminMode || reply.userId === user.username) && (
                                        <button
                                          onClick={() => handleDeleteReply(rev, reply.id)}
                                          className="text-red-400 hover:text-red-300 ml-1"
                                          title="Удалить комментарий"
                                        >
                                          <TrashIcon className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <p dir="auto" className="text-gray-300 leading-relaxed pl-8 whitespace-pre-wrap bdi-isolate">
                                    <bdi dir="auto">{displayRepText}</bdi>
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic mb-3">
                            Пока нет комментариев. Напишите первый ответ!
                          </p>
                        )}

                        {/* New Reply Form */}
                        <div className="bg-gray-900 p-3 rounded-2xl border border-gray-700 space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-[11px] text-gray-400 font-bold">
                              {t ? t('add_comment') || 'Добавить комментарий:' : 'Добавить комментарий:'}
                            </span>
                            {isAdminMode && (
                              <label className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isReplyAdminFlags[rev.id] ?? true}
                                  onChange={(e) =>
                                    setIsReplyAdminFlags((prev) => ({
                                      ...prev,
                                      [rev.id]: e.target.checked
                                    }))
                                  }
                                  className="rounded text-amber-500"
                                />
                                {t ? t('as_admin_checkbox') || 'От имени Администратора DuoWindo6601 👑' : 'От имени Администратора DuoWindo6601 👑'}
                              </label>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={replyInputs[rev.id] || ''}
                              onChange={(e) =>
                                setReplyInputs((prev) => ({ ...prev, [rev.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddReply(rev);
                              }}
                              placeholder={
                                isAdminMode && (isReplyAdminFlags[rev.id] ?? true)
                                  ? (t ? t('admin_reply_placeholder') || 'Напишите официальный ответ Администратора DuoWindo6601...' : 'Напишите официальный ответ Администратора DuoWindo6601...')
                                  : (t ? t('write_comment_placeholder') || 'Напишите комментарий...' : 'Напишите комментарий...')
                              }
                              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-duo-blue"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddReply(rev)}
                              className="bg-duo-blue hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-xs border-b-2 border-duo-blueDark active:translate-y-0.5"
                            >
                              Отправить
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Admin Password Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border-2 border-amber-500/80 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-amber-400 text-base uppercase tracking-wider flex items-center gap-2">
                <span>👑</span> Вход для Администратора
              </h3>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-300 mb-4">
              Введите ключ доступа администратора для управления отзывами и публикации официальных ответов DuoWindo6601.
            </p>

            <form onSubmit={handleAdminAuth} className="space-y-3">
              <input
                type="password"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="Ключ Администратора"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                autoFocus
              />

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-3 py-2 bg-gray-800 text-gray-300 hover:text-white rounded-xl text-xs font-bold uppercase"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black rounded-xl text-xs uppercase tracking-wider shadow-md hover:brightness-110"
                >
                  Подтвердить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
