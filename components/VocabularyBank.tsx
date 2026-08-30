import React, { useState, useMemo } from 'react';
import { Course, UserProgress } from '../types';
import { VolumeIcon, TurtleIcon, CloseIcon, NewWordIcon, SearchIcon, BookIcon, StarIcon, CheckCircleIcon } from './Icons';
import { Mascot } from './Mascot';

export interface VocabularyWord {
  id: string;
  word: string;
  translation: string;
  courseId: string;
  courseName: string;
  flagCode: string;
  phonetic?: string;
  category?: 'basics' | 'phrases' | 'verbs' | 'nouns' | 'adjectives' | 'culture' | 'food';
  example?: string;
  exampleTranslation?: string;
  masteryLevel?: 'mastered' | 'practicing' | 'new';
  dateAdded?: string;
}

// Built-in starter vocabulary database covering world and regional courses
export const DEFAULT_COURSE_VOCABULARY: VocabularyWord[] = [
  // English (en)
  { id: 'en-1', word: 'Hello', translation: 'Привет / Здравствуйте', courseId: 'en', courseName: 'English', flagCode: '🇬🇧', phonetic: '[həˈləʊ]', category: 'basics', example: 'Hello, my friend!', exampleTranslation: 'Привет, мой друг!', masteryLevel: 'mastered' },
  { id: 'en-2', word: 'Knowledge', translation: 'Знания', courseId: 'en', courseName: 'English', flagCode: '🇬🇧', phonetic: '[ˈnɒlɪdʒ]', category: 'nouns', example: 'Knowledge is power.', exampleTranslation: 'Знание — сила.', masteryLevel: 'mastered' },
  { id: 'en-3', word: 'Journey', translation: 'Путешествие / Путь', courseId: 'en', courseName: 'English', flagCode: '🇬🇧', phonetic: '[ˈdʒɜːni]', category: 'nouns', example: 'A long journey begins with one step.', exampleTranslation: 'Долгий путь начинается с одного шага.', masteryLevel: 'practicing' },
  { id: 'en-4', word: 'Achieve', translation: 'Достигать / Добиваться', courseId: 'en', courseName: 'English', flagCode: '🇬🇧', phonetic: '[əˈtʃiːv]', category: 'verbs', example: 'You will achieve your goals.', exampleTranslation: 'Ты достигнешь своих целей.', masteryLevel: 'practicing' },
  { id: 'en-5', word: 'Wonderful', translation: 'Замечательный / Чудесный', courseId: 'en', courseName: 'English', flagCode: '🇬🇧', phonetic: '[ˈwʌndəfl]', category: 'adjectives', example: 'Have a wonderful day!', exampleTranslation: 'Прекрасного дня!', masteryLevel: 'mastered' },

  // Spanish (es)
  { id: 'es-1', word: 'Hola', translation: 'Привет', courseId: 'es', courseName: 'Spanish', flagCode: '🇪🇸', phonetic: '[ˈola]', category: 'basics', example: '¡Hola! ¿Cómo estás?', exampleTranslation: 'Привет! Как дела?', masteryLevel: 'mastered' },
  { id: 'es-2', word: 'Amigo', translation: 'Друг', courseId: 'es', courseName: 'Spanish', flagCode: '🇪🇸', phonetic: '[aˈmiɣo]', category: 'nouns', example: 'Él es mi mejor amigo.', exampleTranslation: 'Он мой лучший друг.', masteryLevel: 'mastered' },
  { id: 'es-3', word: 'Aprender', translation: 'Учить / Изучать', courseId: 'es', courseName: 'Spanish', flagCode: '🇪🇸', phonetic: '[apɾenˈdeɾ]', category: 'verbs', example: 'Me gusta aprender idiomas.', exampleTranslation: 'Мне нравится учить языки.', masteryLevel: 'practicing' },
  { id: 'es-4', word: 'Hermoso', translation: 'Красивый / Прекрасный', courseId: 'es', courseName: 'Spanish', flagCode: '🇪🇸', phonetic: '[eɾˈmoso]', category: 'adjectives', example: 'El cielo es hermoso.', exampleTranslation: 'Небо прекрасное.', masteryLevel: 'mastered' },

  // German (de)
  { id: 'de-1', word: 'Guten Tag', translation: 'Добрый день', courseId: 'de', courseName: 'German', flagCode: '🇩🇪', phonetic: '[ˈɡuːtn̩ ˈtaːk]', category: 'phrases', example: 'Guten Tag, wie geht es Ihnen?', exampleTranslation: 'Добрый день, как ваши дела?', masteryLevel: 'mastered' },
  { id: 'de-2', word: 'Freiheit', translation: 'Свобода', courseId: 'de', courseName: 'German', flagCode: '🇩🇪', phonetic: '[ˈfʁaɪ̯haɪ̯t]', category: 'nouns', example: 'Freiheit ist wichtig.', exampleTranslation: 'Свобода важна.', masteryLevel: 'practicing' },
  { id: 'de-3', word: 'Verstehen', translation: 'Понимать', courseId: 'de', courseName: 'German', flagCode: '🇩🇪', phonetic: '[fɛɐ̯ˈʃteːən]', category: 'verbs', example: 'Ich verstehe alles.', exampleTranslation: 'Я всё понимаю.', masteryLevel: 'mastered' },

  // French (fr)
  { id: 'fr-1', word: 'Bonjour', translation: 'Здравствуйте / Добрый день', courseId: 'fr', courseName: 'French', flagCode: '🇫🇷', phonetic: '[bɔ̃ʒuʁ]', category: 'basics', example: 'Bonjour tout le monde!', exampleTranslation: 'Всем добрый день!', masteryLevel: 'mastered' },
  { id: 'fr-2', word: 'Merci', translation: 'Спасибо', courseId: 'fr', courseName: 'French', flagCode: '🇫🇷', phonetic: '[mɛʁsi]', category: 'phrases', example: 'Merci beaucoup pour votre aide.', exampleTranslation: 'Большое спасибо за вашу помощь.', masteryLevel: 'mastered' },
  { id: 'fr-3', word: 'Espoir', translation: 'Надежда', courseId: 'fr', courseName: 'French', flagCode: '🇫🇷', phonetic: '[ɛspwaʁ]', category: 'nouns', example: 'Garder l\'espoir toujours.', exampleTranslation: 'Всегда сохранять надежду.', masteryLevel: 'practicing' },

  // Chinese (zh)
  { id: 'zh-1', word: '你好 (Nǐ hǎo)', translation: 'Привет / Здравствуй', courseId: 'zh', courseName: 'Chinese', flagCode: '🇨🇳', phonetic: '[ni˨˩˦ xaw˨˩˦]', category: 'basics', example: '你好，很高兴认识你！', exampleTranslation: 'Привет, очень приятно познакомиться!', masteryLevel: 'mastered' },
  { id: 'zh-2', word: '朋友 (Péngyou)', translation: 'Друг / Товарищ', courseId: 'zh', courseName: 'Chinese', flagCode: '🇨🇳', phonetic: '[pʰəŋ˧˥ jou]', category: 'nouns', example: '我们是好朋友。', exampleTranslation: 'Мы хорошие друзья.', masteryLevel: 'mastered' },
  { id: 'zh-3', word: '学习 (Xuéxí)', translation: 'Учиться / Изучать', courseId: 'zh', courseName: 'Chinese', flagCode: '🇨🇳', phonetic: '[ɕɥɛ˧˥ ɕi˧˥]', category: 'verbs', example: '每天努力学习。', exampleTranslation: 'Усердно учиться каждый день.', masteryLevel: 'practicing' },

  // Japanese (ja)
  { id: 'ja-1', word: 'こんにちは (Konnichiwa)', translation: 'Добрый день / Привет', courseId: 'ja', courseName: 'Japanese', flagCode: '🇯🇵', phonetic: '[koɲɲitɕiwa]', category: 'basics', example: '皆さん、こんにちは！', exampleTranslation: 'Всем добрый день!', masteryLevel: 'mastered' },
  { id: 'ja-2', word: '友達 (Tomodachi)', translation: 'Друг / Друзья', courseId: 'ja', courseName: 'Japanese', flagCode: '🇯🇵', phonetic: '[tomodatɕi]', category: 'nouns', example: '友達と一緒に勉強する。', exampleTranslation: 'Учиться вместе с другом.', masteryLevel: 'mastered' },
  { id: 'ja-3', word: '夢 (Yume)', translation: 'Мечта', courseId: 'ja', courseName: 'Japanese', flagCode: '🇯🇵', phonetic: '[jɯme]', category: 'nouns', example: '夢を追いかける。', exampleTranslation: 'Следовать за мечтой.', masteryLevel: 'practicing' },

  // Russian (ru)
  { id: 'ru-1', word: 'Спасибо', translation: 'Thank you / Danke', courseId: 'ru', courseName: 'Russian', flagCode: '🇷🇺', phonetic: '[spɐˈsʲibə]', category: 'basics', example: 'Большое спасибо за урок!', exampleTranslation: 'Thank you very much for the lesson!', masteryLevel: 'mastered' },
  { id: 'ru-2', word: 'Успех', translation: 'Success / Erfolg', courseId: 'ru', courseName: 'Russian', flagCode: '🇷🇺', phonetic: '[ʊˈspʲex]', category: 'nouns', example: 'Желаю больших успехов в учебе.', exampleTranslation: 'I wish you great success in your studies.', masteryLevel: 'mastered' },

  // Kazakh (cis_kz)
  { id: 'kz-1', word: 'Сәлеметсіз бе (Sälemetsiz be)', translation: 'Здравствуйте', courseId: 'cis_kz', courseName: 'Kazakh', flagCode: '🇰🇿', phonetic: '[sælemetsɪz be]', category: 'basics', example: 'Сәлеметсіз бе, қалыңыз қалай?', exampleTranslation: 'Здравствуйте, как ваши дела?', masteryLevel: 'mastered' },
  { id: 'kz-2', word: 'Рақмет (Rakhmet)', translation: 'Спасибо / Благодарность', courseId: 'cis_kz', courseName: 'Kazakh', flagCode: '🇰🇿', phonetic: '[rɑqmet]', category: 'phrases', example: 'Көмегіңізге көп рақмет!', exampleTranslation: 'Большое спасибо за помощь!', masteryLevel: 'mastered' },
  { id: 'kz-3', word: 'Достық (Dostyq)', translation: 'Дружба', courseId: 'cis_kz', courseName: 'Kazakh', flagCode: '🇰🇿', phonetic: '[dostɯq]', category: 'nouns', example: 'Достық — баға жетпес байлық.', exampleTranslation: 'Дружба — бесценное богатство.', masteryLevel: 'practicing' },

  // Armenian (cis_am)
  { id: 'am-1', word: 'Բարև (Barev)', translation: 'Привет / Здравствуйте', courseId: 'cis_am', courseName: 'Armenian', flagCode: '🇦🇲', phonetic: '[baˈɾɛv]', category: 'basics', example: 'Բարև, ինչպե՞ս ես:', exampleTranslation: 'Привет, как ты?', masteryLevel: 'mastered' },
  { id: 'am-2', word: 'Շնորհակալություն (Shnorhakalutyun)', translation: 'Спасибо', courseId: 'cis_am', courseName: 'Armenian', flagCode: '🇦🇲', phonetic: '[ʃnɔɾhakaˈlutjun]', category: 'phrases', example: 'Շատ շնորհակալություն:', exampleTranslation: 'Большое спасибо!', masteryLevel: 'practicing' },

  // Georgian (cis_ge)
  { id: 'ge-1', word: 'გამარჯობა (Gamarjoba)', translation: 'Здравствуйте / Привет', courseId: 'cis_ge', courseName: 'Georgian', flagCode: '🇬🇪', phonetic: '[ɡamaɾdʒɔba]', category: 'basics', example: 'გამარჯობა, როგორ ხარ?', exampleTranslation: 'Привет, как поживаешь?', masteryLevel: 'mastered' },
  { id: 'ge-2', word: 'მადლობა (Madloba)', translation: 'Спасибо', courseId: 'cis_ge', courseName: 'Georgian', flagCode: '🇬🇪', phonetic: '[madlɔba]', category: 'phrases', example: 'დიდი მადლობა!', exampleTranslation: 'Большое спасибо!', masteryLevel: 'mastered' },

  // Tatar (rep_tatarstan)
  { id: 'tat-1', word: 'Исәнмесез (Isänmesez)', translation: 'Здравствуйте', courseId: 'rep_tatarstan', courseName: 'Татар теле (Tatar)', flagCode: '🟢', phonetic: '[isænmesɪz]', category: 'basics', example: 'Исәнмесез, дуслар!', exampleTranslation: 'Здравствуйте, друзья!', masteryLevel: 'mastered' },
  { id: 'tat-2', word: 'Рәхмәт (Räkhmät)', translation: 'Спасибо', courseId: 'rep_tatarstan', courseName: 'Татар теле (Tatar)', flagCode: '🟢', phonetic: '[ræxmæt]', category: 'phrases', example: 'Ярдәмегез өчен зур рәхмәт!', exampleTranslation: 'Большое спасибо за помощь!', masteryLevel: 'mastered' },

  // Bashkir (rep_bashkortostan)
  { id: 'bash-1', word: 'Һаумыһығыҙ (Haumyhygyz)', translation: 'Здравствуйте', courseId: 'rep_bashkortostan', courseName: 'Башҡорт теле (Bashkir)', flagCode: '🟡', phonetic: '[haʊmɯhɯɣɯð]', category: 'basics', example: 'Һаумыһығыҙ, хөрмәтле дуҫтар!', exampleTranslation: 'Здравствуйте, уважаемые друзья!', masteryLevel: 'mastered' },
  { id: 'bash-2', word: 'Рәхмәт (Räkhmät)', translation: 'Спасибо', courseId: 'rep_bashkortostan', courseName: 'Башҡорт теле (Bashkir)', flagCode: '🟡', phonetic: '[ræxmæt]', category: 'phrases', example: 'Ҙур рәхмәт һеҙгә!', exampleTranslation: 'Большое спасибо вам!', masteryLevel: 'mastered' }
];

interface VocabularyBankProps {
  user: UserProgress;
  courses: Course[];
  currentCourse: Course;
  onBack: () => void;
  onSpeak: (text: string, courseId: string, slow?: boolean) => void;
}

export const VocabularyBank: React.FC<VocabularyBankProps> = ({
  user,
  courses,
  currentCourse,
  onBack,
  onSpeak
}) => {
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<'normal' | 'slow'>('normal');

  const isRu = user.language === 'ru';

  // Merge default vocabulary with any extra words stored in user progress or local cache
  const allWords: VocabularyWord[] = useMemo(() => {
    const wordMap = new Map<string, VocabularyWord>();

    // Load defaults
    DEFAULT_COURSE_VOCABULARY.forEach(w => {
      wordMap.set(`${w.courseId}:${w.word.toLowerCase()}`, w);
    });

    // Check user.learnedWords
    if (user.learnedWords && Array.isArray(user.learnedWords)) {
      user.learnedWords.forEach((wordItem, idx) => {
        if (typeof wordItem === 'string' && wordItem.trim()) {
          const key = `${currentCourse.id}:${wordItem.toLowerCase()}`;
          if (!wordMap.has(key)) {
            wordMap.set(key, {
              id: `user-word-${idx}`,
              word: wordItem,
              translation: isRu ? 'Изучено в уроке' : 'Learned in lesson',
              courseId: currentCourse.id,
              courseName: currentCourse.name,
              flagCode: currentCourse.flagCode || '🌐',
              category: 'basics',
              masteryLevel: 'mastered',
              dateAdded: new Date().toISOString().split('T')[0]
            });
          }
        }
      });
    }

    // Check localStorage custom words
    try {
      const stored = localStorage.getItem('duo_custom_words_6601');
      if (stored) {
        const parsed: VocabularyWord[] = JSON.parse(stored);
        parsed.forEach(w => {
          wordMap.set(`${w.courseId}:${w.word.toLowerCase()}`, w);
        });
      }
    } catch {
      // ignore
    }

    return Array.from(wordMap.values());
  }, [user.learnedWords, currentCourse, isRu]);

  // Unique list of courses present in vocabulary
  const availableCourseOptions = useMemo(() => {
    const courseIds = new Set(allWords.map(w => w.courseId));
    return courses.filter(c => courseIds.has(c.id));
  }, [allWords, courses]);

  // Filter words
  const filteredWords = useMemo(() => {
    return allWords.filter(item => {
      // Course filter
      if (selectedCourseFilter !== 'all' && item.courseId !== selectedCourseFilter) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchWord = item.word.toLowerCase().includes(q);
        const matchTranslation = item.translation.toLowerCase().includes(q);
        const matchPhonetic = item.phonetic?.toLowerCase().includes(q);
        const matchExample = item.example?.toLowerCase().includes(q);
        if (!matchWord && !matchTranslation && !matchPhonetic && !matchExample) {
          return false;
        }
      }
      return true;
    });
  }, [allWords, selectedCourseFilter, selectedCategory, searchQuery]);

  const handlePronounce = (word: VocabularyWord, forceSlow?: boolean) => {
    const isSlow = forceSlow !== undefined ? forceSlow : playbackSpeed === 'slow';
    const playKey = `${word.id}-${isSlow ? 'slow' : 'normal'}`;
    setPlayingWordId(playKey);
    onSpeak(word.word, word.courseId, isSlow);
    setTimeout(() => {
      setPlayingWordId(prev => (prev === playKey ? null : prev));
    }, isSlow ? 2000 : 1200);
  };

  const categories = [
    { id: 'all', label: isRu ? 'Все категории' : 'All Categories' },
    { id: 'basics', label: isRu ? 'Базовые' : 'Basics' },
    { id: 'phrases', label: isRu ? 'Фразы' : 'Phrases' },
    { id: 'nouns', label: isRu ? 'Существительные' : 'Nouns' },
    { id: 'verbs', label: isRu ? 'Глаголы' : 'Verbs' },
    { id: 'adjectives', label: isRu ? 'Прилагательные' : 'Adjectives' }
  ];

  return (
    <div className="py-6 md:py-10 animate-in fade-in max-w-5xl mx-auto w-full px-4 font-din">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white flex items-center font-bold transition-colors group px-3 py-2 rounded-2xl bg-duo-card border border-gray-700/80 shadow-md"
        >
          <CloseIcon className="w-6 h-6 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span>{isRu ? 'Назад' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* SPEED SELECTOR */}
          <div className="flex items-center bg-duo-card border border-gray-700/80 rounded-2xl p-1 shadow-md">
            <span className="text-[11px] font-black uppercase text-gray-400 px-2 flex items-center gap-1">
              <span>⚡</span>
              <span className="hidden sm:inline">{isRu ? 'Скорость:' : 'Speed:'}</span>
            </span>
            <button
              onClick={() => setPlaybackSpeed('normal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                playbackSpeed === 'normal'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
              title={isRu ? 'Обычная скорость произношения (1.0x)' : 'Normal speed (1.0x)'}
            >
              1.0x {isRu ? 'Обычная' : 'Normal'}
            </button>
            <button
              onClick={() => setPlaybackSpeed('slow')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                playbackSpeed === 'slow'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
              title={isRu ? 'Замедленная скорость для изучения (0.7x)' : 'Slow speed (0.7x)'}
            >
              <TurtleIcon className="w-3.5 h-3.5" />
              <span>0.7x {isRu ? 'Медленно' : 'Slow'}</span>
            </button>
          </div>

          <span className="text-xs bg-duo-blue/20 text-duo-blue font-black px-3 py-1.5 rounded-xl border border-duo-blue/40 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <BookIcon className="w-4 h-4" />
            <span>{isRu ? 'Словарь' : 'Lexicon'}</span>
          </span>
        </div>
      </div>

      {/* HERO BANNER */}
      <div className="bg-gradient-to-r from-teal-900/80 via-emerald-900/60 to-blue-900/80 border-2 border-emerald-500/50 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left z-10">
          <div className="flex items-center justify-center md:justify-start space-x-2">
            <span className="text-3xl">📖</span>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight font-feather">
              {isRu ? 'Банк Слов' : 'Vocabulary Bank'}
            </h2>
          </div>
          <p className="text-sm md:text-base text-emerald-200 font-bold max-w-xl leading-relaxed">
            {isRu
              ? 'Все изученные слова по всем курсам языков мира и народов СНГ с озвучкой, транскрипцией и примерами.'
              : 'All learned words across all language courses with audio pronunciation, phonetics, and contextual examples.'}
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <span className="bg-black/40 text-yellow-300 border border-yellow-500/40 text-xs font-black px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-md">
              <span>✨</span>
              <span>{isRu ? `Всего слов: ${allWords.length}` : `Total Words: ${allWords.length}`}</span>
            </span>
            <span className="bg-black/40 text-emerald-300 border border-emerald-500/40 text-xs font-black px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-md">
              <span>🌍</span>
              <span>{isRu ? `Курсов: ${availableCourseOptions.length}` : `Courses: ${availableCourseOptions.length}`}</span>
            </span>
          </div>
        </div>

        <div className="shrink-0 z-10">
          <Mascot emotion="happy" className="w-24 h-24 md:w-32 md:h-32" variant={currentCourse.mascotVariant} />
        </div>

        {/* Subtle background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-duo-card border-2 border-gray-800 rounded-3xl p-5 md:p-6 mb-8 shadow-xl space-y-4">
        {/* SEARCH BAR */}
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
            <SearchIcon className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isRu ? 'Поиск слова, перевода или транскрипции...' : 'Search word, translation, or phonetics...'}
            className="w-full bg-duo-dark border-2 border-gray-700 rounded-2xl pl-12 pr-4 py-3.5 text-white font-bold placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-all shadow-inner text-sm md:text-base"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* COURSE SELECTOR PILLS */}
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
            <span>🌐</span>
            <span>{isRu ? 'Фильтр по курсу:' : 'Filter by Course:'}</span>
          </label>
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedCourseFilter('all')}
              className={`px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border flex items-center space-x-1.5 ${
                selectedCourseFilter === 'all'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg scale-105'
                  : 'bg-duo-dark text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'
              }`}
            >
              <span>🌍</span>
              <span>{isRu ? 'Все курсы' : 'All Courses'} ({allWords.length})</span>
            </button>

            {availableCourseOptions.map(course => {
              const count = allWords.filter(w => w.courseId === course.id).length;
              const isSelected = selectedCourseFilter === course.id;
              return (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourseFilter(course.id)}
                  className={`px-3.5 py-2 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-duo-blue text-white border-duo-blue shadow-lg scale-105'
                      : 'bg-duo-dark text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  <span>{course.flagCode}</span>
                  <span>{course.name}</span>
                  <span className="text-[10px] opacity-70 bg-black/40 px-1.5 py-0.5 rounded-md">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CATEGORY PILLS */}
        <div className="pt-2 border-t border-gray-800 flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                selectedCategory === cat.id
                  ? 'bg-gray-700 text-white border border-gray-500 shadow'
                  : 'bg-duo-dark/80 text-gray-400 hover:text-gray-200 border border-transparent'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* RESULTS COUNT & STATUS */}
      <div className="flex items-center justify-between mb-4 px-2">
        <p className="text-xs text-gray-400 font-bold">
          {isRu
            ? `Показано слов: ${filteredWords.length} из ${allWords.length}`
            : `Showing words: ${filteredWords.length} of ${allWords.length}`}
        </p>
        <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
          <span>🔊</span>
          <span>{isRu ? 'Нажмите на карточку для озвучки' : 'Click card to listen'}</span>
        </span>
      </div>

      {/* WORD GRID */}
      {filteredWords.length === 0 ? (
        <div className="bg-duo-card border-2 border-gray-800 rounded-3xl p-12 text-center space-y-4 shadow-xl">
          <div className="text-5xl">🔍</div>
          <h3 className="text-xl font-black text-white">
            {isRu ? 'Слова не найдены' : 'No Words Found'}
          </h3>
          <p className="text-sm text-gray-400 font-bold max-w-md mx-auto">
            {isRu
              ? 'Попробуйте изменить поисковый запрос или выбрать другой курс в фильтре выше.'
              : 'Try changing your search query or selecting a different course in the filter above.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCourseFilter('all');
              setSelectedCategory('all');
            }}
            className="px-6 py-2.5 bg-duo-blue hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-2xl border-b-4 border-duo-blueDark active:border-b-0 active:translate-y-1 transition-all shadow-md"
          >
            {isRu ? 'Сбросить фильтры' : 'Reset Filters'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWords.map(word => {
            const isPlayingNormal = playingWordId === `${word.id}-normal`;
            const isPlayingSlow = playingWordId === `${word.id}-slow`;
            const isPlayingAny = isPlayingNormal || isPlayingSlow;

            return (
              <div
                key={word.id}
                onClick={() => handlePronounce(word)}
                className={`bg-duo-card border-2 ${
                  isPlayingAny
                    ? isPlayingSlow
                      ? 'border-amber-500 shadow-amber-900/40 shadow-xl scale-[1.02]'
                      : 'border-emerald-500 shadow-emerald-900/40 shadow-xl scale-[1.02]'
                    : 'border-gray-800 hover:border-gray-600'
                } rounded-3xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between group relative overflow-hidden shadow-lg`}
              >
                {/* TOP ROW: COURSE & PRONUNCIATION BUTTONS */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-gray-400 bg-duo-dark px-2.5 py-1 rounded-xl border border-gray-800 flex items-center space-x-1.5">
                    <span>{word.flagCode}</span>
                    <span>{word.courseName}</span>
                  </span>

                  <div className="flex items-center space-x-1.5" onClick={e => e.stopPropagation()}>
                    {/* SLOW PRONUNCIATION (TURTLE) */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handlePronounce(word, true);
                      }}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                        isPlayingSlow
                          ? 'bg-amber-500 text-white scale-110 animate-pulse shadow-md'
                          : 'bg-duo-dark text-amber-400/90 hover:bg-amber-500 hover:text-white border border-gray-700'
                      }`}
                      title={isRu ? 'Медленное произношение (0.7x)' : 'Slow pronunciation (0.7x)'}
                    >
                      <TurtleIcon className="w-4 h-4" />
                    </button>

                    {/* NORMAL PRONUNCIATION */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handlePronounce(word, false);
                      }}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                        isPlayingNormal
                          ? 'bg-emerald-500 text-white scale-110 animate-pulse shadow-md'
                          : 'bg-duo-dark text-emerald-400 hover:bg-emerald-600 hover:text-white border border-gray-700'
                      }`}
                      title={isRu ? 'Обычное произношение (1.0x)' : 'Normal pronunciation (1.0x)'}
                    >
                      <VolumeIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* WORD & TRANSLATION */}
                <div className="space-y-1.5 my-2">
                  <div className="flex items-baseline space-x-2">
                    <h4 className="text-2xl font-black text-white group-hover:text-emerald-300 transition-colors font-feather">
                      {word.word}
                    </h4>
                    {word.phonetic && (
                      <span className="text-xs text-gray-400 font-mono italic">
                        {word.phonetic}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-300 leading-snug">
                    {word.translation}
                  </p>
                </div>

                {/* EXAMPLE CONTEXT */}
                {word.example && (
                  <div className="mt-3 pt-3 border-t border-gray-800/80 text-xs space-y-1">
                    <p className="text-emerald-300 font-medium italic">
                      "{word.example}"
                    </p>
                    {word.exampleTranslation && (
                      <p className="text-gray-400 text-[11px]">
                        {word.exampleTranslation}
                      </p>
                    )}
                  </div>
                )}

                {/* BOTTOM FOOTER */}
                <div className="mt-4 pt-2 flex items-center justify-between text-[10px] font-bold text-gray-400">
                  <span className="capitalize bg-black/40 px-2 py-0.5 rounded-md border border-gray-800">
                    {word.category || 'Vocabulary'}
                  </span>
                  <span className="flex items-center space-x-1 text-emerald-400">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                    <span>{isRu ? 'Изучено' : 'Learned'}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
