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
  courses?: Course[];
  currentCourse?: Course;
  t?: (key: string) => string;
}

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

const CATEGORIES = [
  '🌟 Общие впечатления',
  '🏛️ Языки СНГ (казахский, узбекский, армянский и др.)',
  '🌍 Мировые языки (английский, испанский, китайский и др.)',
  '🧩 Предметы & Игры (шахматы, математика, логика)',
  '📚 Тренажер и графическое письмо',
  '✨ Новая функция',
  '🐛 Ошибка / Доработка',
  '💡 Идея для улучшения'
];

const RANDOM_USER_NAMES = [
  'Мария С.', 'Игорь Н.', 'София П.', 'Максим Р.', 
  'Анастасия Б.', 'Владимир Т.', 'Ольга И.', 'Роман Е.', 
  'Виктория Г.', 'Артём Д.', 'Екатерина Л.', 'Денис М.',
  'Константин П.', 'Анна Т.', 'Михаил С.', 'Сергей К.',
  'Азамат К.', 'Айпери М.', 'Нурсултан Ж.', 'Зарина В.',
  'Тимур А.', 'Данияр С.', 'Армен К.', 'Гульнара Т.'
];

const RANDOM_USER_AVATARS = ['🦉', '🦊', '🦁', '🐼', '🐯', '🦄', '🐲', '🚀', '🐱', '🐶', '🤖', '👑', '🏛️', '🌍', '🧩', '♟️'];
const RANDOM_USER_COLORS = ['#1cb0f6', '#ff9600', '#58cc02', '#ce82ff', '#ff4b4b', '#2b70c9', '#ec4899', '#14b8a6'];

interface ReviewTemplate {
  rating: number;
  category: string;
  comment: string;
  adminReply: string;
}

const GOOD_REVIEWS_POOL: ReviewTemplate[] = [
  {
    rating: 5,
    category: '💻 Поддержка Windows',
    comment: 'Очень удобно, что в раздел проверки браузера и ОС добавили подробные сроки поддержки Windows! Теперь сразу видно: Windows 7 прекращена 14 января 2020 г., Windows 8/8.1 прекращена 10 января 2023 г., по Windows 10 бесплатная завершилась 14 октября 2025 г. (платная ESU продлена до 12 октября 2027 г.), а по Windows 11 всё зависит от версий (актуальная 24H2 поддерживается до 13 октября 2026 г.).',
    adminReply: 'Спасибо за отзыв! Мы добавили подробную информацию о жизненном цикле ОС Windows (7, 8/8.1, 10, 11), чтобы пользователи своевременно обновляли свои системы для безопасной работы с DuoWindo6601 и встроенными ИИ-технологиями! 💻🚀'
  },
  {
    rating: 5,
    category: '✨ Новая функция',
    comment: 'Новая проверка браузера и операционных систем (Windows / Linux / macOS / Android) на https://duowindo6601.ai.studio/ работает безупречно! Сразу показывает статус совместимости и защищает от сбоев Gemini API.',
    adminReply: 'Спасибо за отзыв! Интегрированная проверка браузеров и ОС (Windows, Linux, macOS, Android) создана для максимальной стабильности DuoWindo6601! 🚀'
  },
  {
    rating: 5,
    category: '🏛️ Языки СНГ (казахский, узбекский, армянский и др.)',
    comment: 'Курсы языков СНГ на https://duowindo6601.ai.studio/ просто супер! Очень качественно проработана тренажёрная часть письменности и озвучка для казахского, узбекского, армянского, кыргызского и грузинского языков.',
    adminReply: 'Спасибо за отзыв! Поддержка и развитие курсов языков СНГ на https://duowindo6601.ai.studio/ — один из наших главных приоритетов! 🇰🇿🇺🇿🇦🇲🇰🇬🇬🇪'
  },
  {
    rating: 5,
    category: '🌍 Мировые языки (английский, испанский, китайский и др.)',
    comment: 'Курсы мировых языков на https://duowindo6601.ai.studio/ отлично структурированы! Алфавит, карточки и озвучка для английского, испанского, немецкого, французского и китайского дают быстрый результат.',
    adminReply: 'Благодарим за высокую оценку! В курсах мировых языков скоро появятся новые разговорные блоки и тренировка диалогов! 🇬🇧🇪🇸🇨🇳🇫🇷🇩🇪'
  },
  {
    rating: 5,
    category: '🧩 Предметы & Игры (шахматы, математика, логика)',
    comment: 'Модуль Предметы & Игры затягивает! Шахматный тренажер и логические головоломки отлично разминают мозг между уроками языков.',
    adminReply: 'Замечательно! Раздел предметов и игр создан специально для гармоничного умственного развития в DuoWindo6601 ♟️🔢'
  },
  {
    rating: 5,
    category: '📚 Тренажер и графическое письмо',
    comment: 'Очень нравится тренажер письменности и интерактивная озвучка букв! Занимаюсь каждый день в DuoWindo6601 на https://duowindo6601.ai.studio/ с большим удовольствием.',
    adminReply: 'Спасибо за прекрасный отзыв! Мы рады, что DuoWindo6601 помогает вам в изучении языков каждый день 🚀'
  },
  {
    rating: 5,
    category: '🌟 Общие впечатления',
    comment: 'DuoWindo6601 — замечательное приложение для обучения! Анимации и звуки делают уроки очень живыми и понятными.',
    adminReply: 'Благодарим за поддержку! Уже готовим новые увлекательные уроки и интерактивные функции! 🎉'
  },
  {
    rating: 4,
    category: '💡 Идея для улучшения',
    comment: 'Удобный и красивый интерфейс. Добавьте больше шахматных этюдов и таблиц лидеров в раздел Предметы & Игры.',
    adminReply: 'Спасибо за предложение! Шахматные задачки и рейтинги игроков уже в разработке! 🏆'
  }
];

const BAD_REVIEWS_POOL: ReviewTemplate[] = [
  {
    rating: 2,
    category: '✨ Новая функция',
    comment: 'На очень старых ОС и браузерах (например, Windows XP или устаревших версиях) предупреждение срабатывает корректно, но хотелось бы более плавной работы Gemini API на слабых ПК.',
    adminReply: 'Спасибо! Мы учли это: для старых систем предусмотрены расширенные подсказки и режим офлайн-фоллбека.'
  },
  {
    rating: 2,
    category: '🏛️ Языки СНГ (казахский, узбекский, армянский и др.)',
    comment: 'В курсах армянского и грузинского языков на https://duowindo6601.ai.studio/ хотелось бы видеть больше упражнений на чтение связных текстов и фразеологизмов, а не только отдельные слова.',
    adminReply: 'Спасибо за важную обратную связь! В ближайшем обновлении DuoWindo6601 мы расширим раздел разговорных диалогов и текстов по всем языкам СНГ.'
  },
  {
    rating: 2,
    category: '🌍 Мировые языки (английский, испанский, китайский и др.)',
    comment: 'В курсе французского и немецкого языков аудирование иногда произносится слишком быстро для начинающих учеников.',
    adminReply: 'Принято к сведению! Мы добавили функцию замедленного повтора произношения фраз в курсах мировых языков.'
  },
  {
    rating: 2,
    category: '🧩 Предметы & Игры (шахматы, математика, логика)',
    comment: 'В шахматном модуле на слабых смартфонах анимация хода фигуры иногда чуть подлагивает.',
    adminReply: 'Благодарим за сигнал! Мы оптимизировали рендеринг шахматной доски для плавного отклика на всех типах мобильных устройств.'
  },
  {
    rating: 1,
    category: '🐛 Ошибка / Доработка',
    comment: 'При медленном мобильном интернете на https://duowindo6601.ai.studio/ аудиозаписи произношения слов долго загружаются. Приходится долго ждать!',
    adminReply: 'Приносим извинения за неудобства! Мы оптимизировали сжатие аудио и добавили офлайн-кэширование произношений.'
  },
  {
    rating: 2,
    category: '🐛 Ошибка / Доработка',
    comment: 'На компактных экранах смартфонов кнопка проверки ответа иногда перекрывается нижней панелью.',
    adminReply: 'Спасибо за сигнал! Мы исправили адаптивную верстку и отступы для всех моделей устройств.'
  },
  {
    rating: 3,
    category: '💡 Идея для улучшения',
    comment: 'В курсах языков СНГ добавьте больше исторических и культурных заметок о странах.',
    adminReply: 'Отличная идея! Заметки о культуре и традициях стран СНГ появятся в тематических карточках в ближайшее время!'
  }
];

// Initial seed reviews with official Administrator comments if database is empty
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
    likes: 12,
    likedBy: [],
    isPinned: true,
    replies: [
      {
        id: 'reply-seed-1',
        userId: 'admin-duowindo6601',
        userName: 'Администратор DuoWindo6601',
        userAvatar: '👑',
        userColor: '#f59e0b',
        isAdmin: true,
        comment: 'Алексей, спасибо за отличный отзыв! Мы продолжаем совершенствовать модуль тренировки написания и озвучки букв. Успехов в обучении! 🚀',
        createdAt: new Date(Date.now() - 86400000 * 2.8).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'seed-2',
    userId: 'user-duo-2',
    userName: 'Елена К.',
    userAvatar: '🦊',
    userColor: '#ff9600',
    rating: 5,
    category: '🌍 Мировые языки (английский, испанский, китайский и др.)',
    courseId: 'en',
    courseName: 'Английский язык',
    comment: 'Курсы мировых языков (английский, испанский, китайский, немецкий) сделаны великолепно! Практика написания и аудио на смартфоне дают прекрасный результат.',
    likes: 8,
    likedBy: [],
    replies: [
      {
        id: 'reply-seed-2',
        userId: 'admin-duowindo6601',
        userName: 'Администратор DuoWindo6601',
        userAvatar: '👑',
        userColor: '#f59e0b',
        isAdmin: true,
        comment: 'Елена, рады служить! Разметку тетради и адаптивность под мобильные экраны обновили специально по запросам пользователей.',
        createdAt: new Date(Date.now() - 86400000 * 1.8).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'seed-3',
    userId: 'user-duo-chess',
    userName: 'Азамат Т.',
    userAvatar: '♟️',
    userColor: '#ce82ff',
    rating: 5,
    category: '🧩 Предметы & Игры (шахматы, математика, логика)',
    courseId: 'chess',
    courseName: 'Шахматы',
    comment: 'Раздел Предметы & Игры потрясающий! Шахматный симулятор и логика превосходно сочетаются с обучением языкам.',
    likes: 14,
    likedBy: [],
    replies: [
      {
        id: 'reply-seed-chess',
        userId: 'admin-duowindo6601',
        userName: 'Администратор DuoWindo6601',
        userAvatar: '👑',
        userColor: '#f59e0b',
        isAdmin: true,
        comment: 'Азамат, благодарим! Скоро в разделе Предметы & Игры появятся новые математические и логические уровни!',
        createdAt: new Date(Date.now() - 86400000 * 1.3).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 1.6).toISOString()
  },
  {
    id: 'seed-4',
    userId: 'user-duo-3',
    userName: 'Константин П.',
    userAvatar: '🤖',
    userColor: '#ff4b4b',
    rating: 2,
    category: '🐛 Ошибка / Доработка',
    courseId: 'general',
    courseName: 'Общий отзыв о DuoWindo6601',
    comment: 'При слабом сигнале сети звук произношения букв подгружается с задержкой в пару секунд.',
    likes: 3,
    likedBy: [],
    replies: [
      {
        id: 'reply-seed-3',
        userId: 'admin-duowindo6601',
        userName: 'Администратор DuoWindo6601',
        userAvatar: '👑',
        userColor: '#f59e0b',
        isAdmin: true,
        comment: 'Константин, спасибо за сигнальный отзыв! Оптимизировали кэширование произношений для мгновенного звучания.',
        createdAt: new Date(Date.now() - 86400000 * 1.2).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString()
  },
  {
    id: 'seed-5',
    userId: 'user-duo-5',
    userName: 'Дмитрий В.',
    userAvatar: '🦁',
    userColor: '#58cc02',
    rating: 5,
    category: '🌟 Общие впечатления',
    courseId: 'am',
    courseName: 'Армянский язык',
    comment: 'Супер интерфейс в стиле Duolingo, тренажер армянского языка и AI озвучка просто восторг. Спасибо разработчикам за DuoWindo6601!',
    likes: 15,
    likedBy: [],
    replies: [],
    createdAt: new Date(Date.now() - 86400000 * 0.5).toISOString()
  }
];

export const FeedbackScreen: React.FC<FeedbackScreenProps> = ({
  user,
  onBack,
  playSound,
  setToast,
  onOpenAdminDashboard,
  courses = [],
  currentCourse,
  t
}) => {
  const [reviews, setReviews] = useState<FeedbackItem[]>(INITIAL_REVIEWS);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [filterSentiment, setFilterSentiment] = useState<'all' | 'good' | 'bad'>('all');

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

  // Admin Check helper for Owner
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
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [comment, setComment] = useState<string>('');
  const [asAdminForm, setAsAdminForm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Tech Support Tab & States
  const [activeTab, setActiveTab] = useState<'reviews' | 'support'>('reviews');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);

  const handleSupportSubmit = async (e: React.FormEvent) => {
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
        subject: supportSubject || 'Общий вопрос техподдержке',
        message: supportMessage.trim(),
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
      setToast('Запрос в техподдержку сохранён! Администратор ответит в ближайшее время.');
      setSupportMessage('');
      setSupportSubject('');
      setSupportSuccess(true);
    } finally {
      setSupportSubmitting(false);
    }
  };

  // Fetch reviews from Firestore
  useEffect(() => {
    if (isUserOwnerAdmin) {
      setIsAdminMode(true);
    }
  }, [isUserOwnerAdmin]);

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
      setToast('Отзывы о DuoWindo6601 обновлены! 🔄');
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
    const pool = isGood ? GOOD_REVIEWS_POOL : BAD_REVIEWS_POOL;
    const template = pool[Math.floor(Math.random() * pool.length)];

    const randomName = RANDOM_USER_NAMES[Math.floor(Math.random() * RANDOM_USER_NAMES.length)];
    const randomAvatar = RANDOM_USER_AVATARS[Math.floor(Math.random() * RANDOM_USER_AVATARS.length)];
    const randomColor = RANDOM_USER_COLORS[Math.floor(Math.random() * RANDOM_USER_COLORS.length)];
    const includeReply = Math.random() > 0.2;
    const randomCourse = availableCourseList[Math.floor(Math.random() * availableCourseList.length)];

    const randomReplyList: FeedbackReply[] = includeReply ? [
      {
        id: 'rep-rand-' + Date.now(),
        userId: 'admin-duowindo6601',
        userName: 'Администратор DuoWindo6601',
        userAvatar: '👑',
        userColor: '#f59e0b',
        isAdmin: true,
        comment: template.adminReply,
        createdAt: new Date().toISOString()
      }
    ] : [];

    const newFeedback: Omit<FeedbackItem, 'id'> = {
      userId: 'user-rand-' + Date.now(),
      userName: randomName,
      userAvatar: randomAvatar,
      userColor: randomColor,
      rating: template.rating,
      category: template.category,
      courseId: randomCourse.id,
      courseName: randomCourse.name,
      comment: template.comment,
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
      setToast(isGood ? `Добавлен отзыв с высокой оценкой (👍 ${randomName})` : `Добавлен критический отзыв (👎 ${randomName})`);
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

  // Handle Login as Admin with strict verification
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
      setToast('Ограничение доступа! Права администратора принадлежат владельцам (abramovanatolij81@gmail.com / va997217@gmail.com).');
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

    const newFeedback: Omit<FeedbackItem, 'id'> = {
      userId: isAdminAuthor ? 'admin-duowindo6601' : (user.username || user.name || 'user-' + Date.now()),
      userName: isAdminAuthor ? 'Администратор DuoWindo6601' : (user.name || 'Пользователь'),
      userAvatar: isAdminAuthor ? '👑' : (user.avatarIcon || '👤'),
      userColor: isAdminAuthor ? '#f59e0b' : (user.avatarColor || '#1cb0f6'),
      rating,
      category,
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
    setToast(isReplyAsAdmin ? 'Ответ Администратора DuoWindo6601 опубликован!' : 'Комментарий добавлен!');
  };

  // Delete review (Admin or Author)
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return;

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
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-4 md:py-6 overflow-y-auto rtl-directional-aware">
      {/* Top Bar with Admin Controls */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => { playSound('click'); onBack(); }}
          className="text-gray-400 hover:text-white flex items-center font-bold text-sm md:text-base transition-colors"
        >
          <CloseIcon className="w-6 h-6 mr-1" />
          Назад
        </button>

        <div className="flex items-center gap-2">
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

      {/* Main Title Banner */}
      <div className="bg-gradient-to-r from-duo-card to-gray-800 rounded-3xl p-5 md:p-6 border-2 border-gray-700 shadow-2xl mb-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div dir="auto">
            <h1 dir="auto" className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1 flex items-center gap-2">
              <MessageSquareIcon className="w-8 h-8 text-duo-yellow shrink-0" />
              <bdi dir="auto">{t ? t('reviews_duowindo6601') : 'Отзывы о DuoWindo6601'}</bdi>
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
              <span>{loading ? 'Обновление...' : 'Обновить'}</span>
            </button>

            <button
              onClick={() => handleGenerateRandomReview('good')}
              disabled={submitting}
              title="Сгенерировать случайный положительный отзыв"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2.5 rounded-2xl border-b-4 border-emerald-800 active:translate-y-1 active:border-b-0 transition-all shadow-md flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider disabled:opacity-50"
            >
              <span className="text-base">👍</span>
              <span>+ Хороший</span>
            </button>

            <button
              onClick={() => handleGenerateRandomReview('bad')}
              disabled={submitting}
              title="Сгенерировать случайный критический отзыв"
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-2.5 rounded-2xl border-b-4 border-rose-800 active:translate-y-1 active:border-b-0 transition-all shadow-md flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider disabled:opacity-50"
            >
              <span className="text-base">👎</span>
              <span>+ Критический</span>
            </button>

            <button
              onClick={() => { playSound('click'); setShowForm(!showForm); }}
              className="bg-duo-green text-white font-black px-4 py-2.5 rounded-2xl border-b-4 border-duo-greenDark hover:brightness-110 active:translate-y-1 active:border-b-0 transition-all shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-wider whitespace-nowrap"
            >
              <StarIcon className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              {showForm ? 'Закрыть форму' : 'Написать отзыв'}
            </button>
          </div>
        </div>

        {/* DuoWindo6601 Site & Share Link Banner */}
        <div className="mt-6 pt-5 border-t border-gray-700/80 bg-gradient-to-r from-emerald-950/80 via-gray-900 to-purple-950/80 p-4 rounded-2xl border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3" dir="auto">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-xl border border-emerald-500/40 shrink-0">
              🌐
            </div>
            <div dir="auto">
              <div className="flex items-center gap-2 flex-wrap" dir="auto">
                <span className="font-black text-xs text-white uppercase tracking-wider"><bdi dir="auto">Платформа DuoWindo6601</bdi></span>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-mono font-bold border border-emerald-500/40 ltr-preserve" dir="ltr">
                  https://duowindo6601.ai.studio/
                </span>
              </div>
              <p className="text-[11px] text-gray-300 font-medium mt-0.5" dir="auto">
                <bdi dir="auto">Оставляйте хорошие и критические отзывы для нашей команды разработки</bdi>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText('https://duowindo6601.ai.studio/');
              playSound('correct');
              setToast('Ссылка https://duowindo6601.ai.studio/ скопирована в буфер обмена! 📋');
            }}
            className="w-full sm:w-auto px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-wider rounded-xl border-b-2 border-emerald-800 active:translate-y-0.5 transition-all flex items-center justify-center space-x-1 shrink-0 shadow-md"
          >
            <span>📋</span>
            <span>Копировать URL</span>
          </button>
        </div>

        {/* GitHub & APK Links Card */}
        <div className="mt-3 pt-3 border-t border-gray-700/50 bg-gray-900/60 p-4 rounded-2xl border border-gray-700">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div dir="auto">
              <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 mb-1" dir="auto">
                <span>🐙</span> <bdi dir="auto">Официальный репозиторий DuoWindo6601 на GitHub</bdi>
              </h4>
              <p className="text-[11px] text-gray-400 font-medium" dir="auto">
                <bdi dir="auto">Исходный код, CI/CD сборка Android APK и интеграция Google Labs.</bdi>
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href="https://github.com/Windo6601/DuoWindo6601"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-gray-100 text-gray-950 font-black px-3.5 py-2 rounded-xl text-[11px] uppercase tracking-wider border-b-2 border-gray-300 transition-all flex items-center gap-1.5 shadow"
              >
                <span>GitHub Repo</span>
                <span>↗</span>
              </a>
              <a
                href="https://github.com/Windo6601/DuoWindo6601/tree/android-ci-and-permissions-8360557468379829155"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3.5 py-2 rounded-xl text-[11px] uppercase tracking-wider border-b-2 border-emerald-800 transition-all flex items-center gap-1.5 shadow"
              >
                <span>APK Release (CI)</span>
                <span>🤖</span>
              </a>
            </div>
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

      {/* Tabs Switcher: Reviews vs Tech Support */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => { playSound('click'); setActiveTab('reviews'); }}
          className={`py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-b-4 transition-all ${
            activeTab === 'reviews'
              ? 'bg-duo-blue border-duo-blueDark text-white shadow-lg shadow-duo-blue/20'
              : 'bg-gray-800 border-gray-900 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <span>💬 Отзывы ({totalCount})</span>
        </button>
        <button
          onClick={() => { playSound('click'); setActiveTab('support'); }}
          className={`py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-b-4 transition-all ${
            activeTab === 'support'
              ? 'bg-emerald-600 border-emerald-800 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-gray-800 border-gray-900 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <span>🛠️ Техподдержка & FAQ</span>
        </button>
      </div>

      {activeTab === 'support' ? (
        <div className="space-y-6 animate-in fade-in pb-12">
          {/* Support Contacts Card */}
          <div className="bg-duo-card border-2 border-emerald-500/60 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-2xl border border-emerald-500/40">
                🛠️
              </div>
              <div>
                <h3 className="text-xl font-black text-emerald-400 uppercase tracking-wide">
                  Техподдержка DuoWindo6601
                </h3>
                <p className="text-xs text-gray-300 font-medium">
                  Служба заботы о пользователях и оперативное решение любых вопросов.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-700 text-xs">
              <div className="bg-gray-900/80 p-3.5 rounded-2xl border border-gray-800">
                <span className="text-gray-400 block mb-1 font-bold">📧 Email техподдержки:</span>
                <div className="space-y-1">
                  <a href="mailto:abramovanatolij81@gmail.com" className="text-emerald-400 font-mono font-bold hover:underline block truncate">
                    abramovanatolij81@gmail.com
                  </a>
                  <a href="mailto:va997217@gmail.com" className="text-emerald-400 font-mono font-bold hover:underline block truncate">
                    va997217@gmail.com
                  </a>
                </div>
              </div>
              <div className="bg-gray-900/80 p-3.5 rounded-2xl border border-gray-800">
                <span className="text-gray-400 block mb-1 font-bold">🐙 GitHub Репозиторий:</span>
                <a href="https://github.com/Windo6601/DuoWindo6601" target="_blank" rel="noopener noreferrer" className="text-duo-blue font-mono font-bold hover:underline truncate block">
                  github.com/Windo6601/DuoWindo6601 ↗
                </a>
              </div>
            </div>
          </div>

          {/* Support Ticket Submission Form */}
          <div className="bg-duo-card border-2 border-gray-700 rounded-3xl p-6 shadow-2xl">
            <h4 className="text-base font-black text-white mb-2 flex items-center gap-2">
              <span>✍️</span> Создать тикет в техподдержку
            </h4>
            <p className="text-xs text-gray-400 mb-4">
              Опишите вашу проблему, и администраторы ответят в ближайшее время.
            </p>

            {supportSuccess ? (
              <div className="bg-emerald-500/20 border border-emerald-500/40 p-5 rounded-2xl text-center space-y-2">
                <div className="text-3xl">✅</div>
                <h5 className="font-black text-emerald-400 text-sm uppercase tracking-wide">
                  Тикет успешно отправлен в техподдержку!
                </h5>
                <p className="text-xs text-gray-300">
                  Ваш запрос зарегистрирован. Владельцы проекта <strong className="text-white">abramovanatolij81@gmail.com</strong> и <strong className="text-white">va997217@gmail.com</strong> получили уведомление.
                </p>
                <button
                  type="button"
                  onClick={() => setSupportSuccess(false)}
                  className="mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider"
                >
                  Отправить еще один запрос
                </button>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Тема обращения:</label>
                  <select
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    className="w-full bg-gray-900 border-2 border-gray-700 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Выберите тему обращения...</option>
                    <option value="Проблема с установкой Android APK">🤖 Проблема с установкой Android APK</option>
                    <option value="Ошибка озвучки или аудио">🔊 Ошибка озвучки или аудио</option>
                    <option value="Синхронизация прогресса / аккаунт">🔄 Синхронизация прогресса / аккаунт</option>
                    <option value="Шахматы & Предметы и игры">♟️ Шахматы & Предметы и игры</option>
                    <option value="Другой технический вопрос">❓ Другой технический вопрос</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Ваш Email (для ответа):</label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-gray-900 border-2 border-gray-700 rounded-2xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Описание проблемы или вопроса:</label>
                  <textarea
                    rows={4}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Подробно опишите, с чем вы столкнулись..."
                    className="w-full bg-gray-900 border-2 border-gray-700 rounded-2xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={supportSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-2xl border-b-4 border-emerald-800 active:translate-y-1 transition-all text-xs uppercase tracking-wider disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                >
                  {supportSubmitting ? 'Отправка в техподдержку...' : 'Отправить в техподдержку DuoWindo6601 🚀'}
                </button>
              </form>
            )}
          </div>

          {/* FAQ Section */}
          <div className="bg-duo-card border-2 border-gray-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-black text-white mb-3 flex items-center gap-2">
              <span>💡</span> Часто задаваемые вопросы (FAQ)
            </h4>

            <div className="space-y-3 text-xs">
              <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800">
                <h5 className="font-bold text-emerald-400 mb-1">1. Как установить Android APK DuoWindo6601 на смартфон?</h5>
                <p className="text-gray-300 leading-relaxed">
                  Перейдите в репозиторий GitHub (<a href="https://github.com/Windo6601/DuoWindo6601" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">github.com/Windo6601/DuoWindo6601</a>), скачайте собранный Android APK из релизов или GitHub Actions CI, разрешите установку приложений из неизвестных источников в настройках Android и наслаждайтесь приложением!
                </p>
              </div>

              <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800">
                <h5 className="font-bold text-emerald-400 mb-1">2. Как работает озвучка фраз и букв в языках СНГ?</h5>
                <p className="text-gray-300 leading-relaxed">
                  DuoWindo6601 использует передовые модели Google Gemini AI и Web Speech Synthesis с поддержкой казахского, узбекского, армянского, кыргызского, грузинского и мировых языков с идеальным произношением.
                </p>
              </div>

              <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800">
                <h5 className="font-bold text-emerald-400 mb-1">3. Сохраняется ли мой прогресс при закрытии вкладки?</h5>
                <p className="text-gray-300 leading-relaxed">
                  Да! Весь ваш опыт (XP), рубины, стрики, пройденные уроки и достижения автоматически сохраняются в локальном хранилище и синхронизируются с облачной базой данных Firebase Firestore под вашим аккаунтом.
                </p>
              </div>

              <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800">
                <h5 className="font-bold text-emerald-400 mb-1">4. Кто разрабатывает DuoWindo6601?</h5>
                <p className="text-gray-300 leading-relaxed">
                  Проект создан командой DuoWindo6601 под руководством разработчиков Владимира Абрамова (<code className="bg-black px-1.5 py-0.5 rounded text-amber-400">abramovanatolij81@gmail.com</code>) и партнеров.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-duo-card border-2 border-amber-500 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <CloseIcon className="w-6 h-6" />
            </button>

            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 border border-amber-500/40">
                👑
              </div>
              <h3 className="text-xl font-black text-white mb-1">
                Администратор DuoWindo6601
              </h3>
              <p className="text-xs text-gray-300">
                Ограничение доступа: права администратора закрепить, удалить и отвечать официально принадлежат владельцам <strong className="text-amber-400">abramovanatolij81@gmail.com</strong> и <strong className="text-amber-400">va997217@gmail.com</strong>.
              </p>
            </div>

            <form onSubmit={handleAdminAuth} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="Персональный ключ администратора"
                  className="w-full bg-gray-900 border-2 border-gray-700 rounded-2xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-black py-3 rounded-2xl border-b-4 border-amber-700 active:translate-y-1 transition-all text-sm uppercase tracking-wider"
              >
                Войти как Администратор
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-duo-card border-2 border-duo-green rounded-3xl p-5 md:p-6 shadow-2xl mb-6 animate-in fade-in slide-in-from-top-4"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>✍️</span> Ваш отзыв о DuoWindo6601
          </h3>

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
                Опубликовать как Администратор 👑
              </label>
            )}
          </div>

          {/* Quick Preset Template Buttons */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Быстрый шаблон типа отзыва:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  setRating(5);
                  setCategory('🌟 Общие впечатления');
                  setComment('Отличное приложение DuoWindo6601 (https://duowindo6601.ai.studio/)! Очень удобные уроки, проработанный интерфейс и качественная озвучка курсов.');
                }}
                className="p-3 rounded-2xl bg-emerald-950/60 border-2 border-emerald-500/50 hover:bg-emerald-900/60 text-emerald-200 font-bold text-xs text-left transition-all flex items-center space-x-2 shadow-sm"
              >
                <span className="text-xl shrink-0">👍</span>
                <div>
                  <div className="font-black text-emerald-300 text-xs">Положительный отзыв (5★)</div>
                  <div className="text-[10px] text-emerald-300/80 font-normal">Хвала за качество, уроки и дизайн</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  setRating(2);
                  setCategory('🐛 Ошибка / Доработка');
                  setComment('В приложении DuoWindo6601 на https://duowindo6601.ai.studio/ хотелось бы улучшить следующую деталь: ');
                }}
                className="p-3 rounded-2xl bg-rose-950/60 border-2 border-rose-500/50 hover:bg-rose-900/60 text-rose-200 font-bold text-xs text-left transition-all flex items-center space-x-2 shadow-sm"
              >
                <span className="text-xl shrink-0">👎</span>
                <div>
                  <div className="font-black text-rose-300 text-xs">Критический отзыв (1-3★)</div>
                  <div className="text-[10px] text-rose-300/80 font-normal">Замечание, баг или идея доработки</div>
                </div>
              </button>
            </div>
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
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { playSound('click'); setCategory(cat); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    category === cat
                      ? 'bg-duo-blue text-white border-b-2 border-duo-blueDark shadow-md'
                      : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
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

      {/* Course Filter Bar */}
      <div className="bg-duo-card border border-gray-700/80 rounded-2xl p-3 mb-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-gray-300">
          <span className="flex items-center gap-1.5 text-duo-yellow">
            <span>🎓</span> Фильтр по курсу:
          </span>
          {filterCourseId !== 'all' && (
            <button
              onClick={() => { playSound('click'); setFilterCourseId('all'); }}
              className="text-[11px] text-duo-blue hover:underline font-bold"
            >
              Сбросить фильтр
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 scrollbar-thin">
          <button
            onClick={() => { playSound('click'); setFilterCourseId('all'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterCourseId === 'all'
                ? 'bg-duo-blue text-white shadow-md border-b-2 border-duo-blueDark'
                : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            🌍 Все курсы
          </button>
          {availableCourseList.map((c) => (
            <button
              key={c.id}
              onClick={() => { playSound('click'); setFilterCourseId(c.id); }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                filterCourseId === c.id
                  ? 'bg-duo-blue text-white shadow-md border-b-2 border-duo-blueDark'
                  : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              <span>{c.flagEmoji}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs: Sentiment & Rating Stars */}
      <div className="flex flex-col gap-2 mb-4">
        {/* Sentiment Filter Toggle */}
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
        <div className="space-y-4">
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
                    <span>📌 Закреплено Администратором DuoWindo6601</span>
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
                        <bdi dir="auto">{rev.userName}</bdi>
                        {rev.userId === 'admin-duowindo6601' && (
                          <span className="text-[10px] font-black bg-amber-500 text-gray-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            👑 Админ
                          </span>
                        )}
                        {rev.rating >= 4 ? (
                          <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                            👍 Хороший отзыв
                          </span>
                        ) : (
                          <span className="text-[10px] font-black bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/40 flex items-center gap-1">
                            👎 Критический
                          </span>
                        )}
                        {rev.category && (
                          <span className="text-[10px] font-normal bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full border border-gray-700" dir="auto">
                            <bdi dir="auto">{rev.category}</bdi>
                          </span>
                        )}
                        {rev.courseName && (
                          <span className="text-[10px] font-bold bg-duo-blue/20 text-duo-blue px-2 py-0.5 rounded-full border border-duo-blue/40 flex items-center gap-1" dir="auto">
                            <bdi dir="auto">🎓 {rev.courseName}</bdi>
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

                {/* Comment Text */}
                <p dir="auto" className="text-gray-200 text-xs md:text-sm leading-relaxed mb-4 whitespace-pre-wrap bdi-isolate">
                  <bdi dir="auto">{rev.comment}</bdi>
                </p>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-800 text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    {/* Toggle Comments Button */}
                    <button
                      onClick={() => {
                        playSound('click');
                        setExpandedComments((prev) => ({ ...prev, [rev.id]: !isExpanded }));
                      }}
                      className="flex items-center gap-1.5 text-duo-blue hover:text-blue-300 font-bold transition-colors"
                    >
                      <MessageSquareIcon className="w-4 h-4" />
                      <span>
                        {t ? t('comments_access') : 'Комментарии'} {repliesList.length > 0 && `(${repliesList.length})`}
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
                    <span>Полезно</span>
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
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      💬 {t ? t('comments_access') : 'Комментарии'} ({repliesList.length})
                    </h5>

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

                          return (
                            <div
                              key={reply.id}
                              className={`p-3 rounded-2xl border text-xs relative ${
                                reply.isAdmin
                                  ? 'bg-amber-500/10 border-amber-500/40'
                                  : 'bg-gray-800/90 border-gray-700'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shadow"
                                    style={{ backgroundColor: reply.userColor || '#f59e0b' }}
                                  >
                                    {reply.userAvatar || '👤'}
                                  </div>
                                  <span className="font-bold text-white flex items-center gap-1" dir="auto">
                                    <bdi dir="auto">{reply.userName}</bdi>
                                    {reply.isAdmin && (
                                      <span className="bg-amber-500 text-gray-950 font-black text-[9px] px-1.5 py-0.2 rounded uppercase">
                                        Официальный ответ
                                      </span>
                                    )}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
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
                                <bdi dir="auto">{reply.comment}</bdi>
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
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-400 font-bold">
                          Ваш комментарий:
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
                            От имени Администратора DuoWindo6601 👑
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
                              ? 'Напишите официальный ответ Администратора DuoWindo6601...'
                              : 'Напишите комментарий...'
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
    </div>
  );
};
