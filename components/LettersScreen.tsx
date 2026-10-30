import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  VolumeIcon, 
  CloseIcon, 
  PenIcon, 
  LightningIcon, 
  InfiniteHeartIcon, 
  DumbbellIcon, 
  SparklesIcon,
  TrashIcon,
  AlphabetIcon
} from './Icons';
import { Course, UserProgress } from '../types';
import { CIS_ALPHABET_DATA, AlphabetItem, AlphabetCategory } from '../services/alphabetData';
import { playSound, triggerHapticFeedback } from '../services/audioService';
import { ArabicNumeralsConverter } from './ArabicNumeralsConverter';
import { 
  isBetaWritingRestricted, 
  getBetaWritingRestrictedInfo, 
  getDaysRemainingUntilUnlock,
  isWritingSectionLocked
} from '../services/languageLockService';
import { LanguageLockModal } from './LanguageLockModal';

interface LettersScreenProps {
  currentCourse: Course;
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  onSaveProgress?: (updatedUser: UserProgress) => void;
  speakText: (text: string, lang?: string, isSlow?: boolean, voice?: string, provider?: string) => void;
  isLightMode?: boolean;
  onBackToPath?: () => void;
  onSwitchCourse?: (course: Course) => void;
  allCourses?: Course[];
}

type LetterExerciseType = 'trace' | 'select_sound' | 'listen_choice' | 'match_pairs' | 'hard_word';

interface LetterExercise {
  id: string;
  type: LetterExerciseType;
  title: string;
  subtitle?: string;
  isHard?: boolean;
  targetChar?: string;
  targetSound?: string;
  targetWord?: string;
  targetTranslation?: string;
  options?: { id: string; text: string; sound?: string; isCorrect: boolean }[];
  pairs?: { id: string; target: string; roman: string }[];
}

export const LettersScreen: React.FC<LettersScreenProps> = ({
  currentCourse,
  user,
  setUser,
  onSaveProgress,
  speakText,
  isLightMode = false,
  onBackToPath,
  onSwitchCourse,
  allCourses = []
}) => {
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState<number>(0);
  const [selectedLetter, setSelectedLetter] = useState<AlphabetItem | null>(null);
  const [activeLesson, setActiveLesson] = useState<boolean>(false);
  const [lessonQueue, setLessonQueue] = useState<LetterExercise[]>([]);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [hasTraced, setHasTraced] = useState<boolean>(false);
  const [showCoursePickerModal, setShowCoursePickerModal] = useState<boolean>(false);
  const [showBetaLockModal, setShowBetaLockModal] = useState<boolean>(false);
  const [courseCategoryTab, setCourseCategoryTab] = useState<'cis' | 'russia' | 'world' | 'easiest' | 'hardest' | 'beta'>('cis');

  const isWritingLocked = isWritingSectionLocked(currentCourse.id);
  const isBetaRestricted = isWritingLocked || isBetaWritingRestricted(currentCourse.id);
  const betaLockInfo = getBetaWritingRestrictedInfo(currentCourse.id);
  const daysUntilUnlock = getDaysRemainingUntilUnlock();
  
  // Matching Pairs State
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [selectedPairLeft, setSelectedPairLeft] = useState<string | null>(null);
  const [selectedPairRight, setSelectedPairRight] = useState<string | null>(null);
  const [pairMismatch, setPairMismatch] = useState<boolean>(false);

  // Trace Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawnPointsCount, setDrawnPointsCount] = useState<number>(0);
  const [brushSize, setBrushSize] = useState<number>(user.handwritingBrushSize || 14);

  useEffect(() => {
    if (user.handwritingBrushSize) {
      setBrushSize(user.handwritingBrushSize);
    }
  }, [user.handwritingBrushSize]);

  // When course changes, automatically reset category index and selected letter
  useEffect(() => {
    setSelectedCategoryIdx(0);
    setSelectedLetter(null);
    setActiveLesson(false);
  }, [currentCourse.id]);

  // Localized Course Name Helper
  const getCourseDisplayName = (c: Course) => {
    if (!c) return '';
    const lang = user.language || 'ru';
    const cisCourseNames: Record<string, Record<string, string>> = {
      ru: { ru: 'Русский', en: 'Russian', de: 'Russisch', fr: 'Russe', es: 'Ruso', ja: 'ロシア語', zh: '俄语' },
      be: { ru: 'Белорусский', en: 'Belarusian', de: 'Weißrussisch', fr: 'Biélorusse', es: 'Bielorruso', ja: 'ベラルーシ語', zh: '白俄罗斯语' },
      uk: { ru: 'Украинский', en: 'Ukrainian', de: 'Ukrainisch', fr: 'Ukrainien', es: 'Ucraniano', ja: 'ウクライナ語', zh: '乌克兰语' },
      kk: { ru: 'Казахский', en: 'Kazakh', de: 'Kasachisch', fr: 'Kazakh', es: 'Kazajo', ja: 'カザフ語', zh: '哈萨克语' },
      uz: { ru: 'Узбекский', en: 'Uzbek', de: 'Usbekisch', fr: 'Ouzbek', es: 'Uzbeko', ja: 'ウズベク語', zh: '乌兹别克语' },
      ky: { ru: 'Кыргызский', en: 'Kyrgyz', de: 'Kirgisisch', fr: 'Kirghize', es: 'Kirguís', ja: 'キルギス語', zh: '吉尔吉斯语' },
      tg: { ru: 'Таджикский', en: 'Tajik', de: 'Tadschikisch', fr: 'Tadjik', es: 'Tayiko', ja: 'タジク語', zh: '塔吉克语' },
      tk: { ru: 'Туркменский', en: 'Turkmen', de: 'Turkmenisch', fr: 'Turkmène', es: 'Turcomano', ja: 'トルクメン語', zh: '土库曼语' },
      hy: { ru: 'Армянский', en: 'Armenian', de: 'Armenisch', fr: 'Arménien', es: 'Armenio', ja: 'アルメニア語', zh: '亚美尼亚语' },
      ka: { ru: 'Грузинский', en: 'Georgian', de: 'Georgisch', fr: 'Géorgien', es: 'Georgiano', ja: 'グルジア語', zh: '格鲁吉亚语' },
      az: { ru: 'Азербайджанский', en: 'Azerbaijani', de: 'Aserbaidschanisch', fr: 'Azerbaïdjanais', es: 'Azerbaiyano', ja: 'アゼルバイジャン語', zh: '阿塞拜疆语' },
      mo: { ru: 'Молдавский', en: 'Moldavian', de: 'Moldauisch', fr: 'Moldave', es: 'Moldavo', ja: 'モルドバ語', zh: '摩尔多瓦语' },
      lt: { ru: 'Литовский', en: 'Lithuanian', de: 'Litauisch', fr: 'Lituanien', es: 'Lituano', ja: 'リトアニア語', zh: '立陶宛语' },
      lv: { ru: 'Латышский', en: 'Latvian', de: 'Lettisch', fr: 'Letton', es: 'Letón', ja: 'ラトビア語', zh: '拉脱维亚语' },
      et: { ru: 'Эстонский', en: 'Estonian', de: 'Estnisch', fr: 'Estonien', es: 'Estonio', ja: 'エストニア語', zh: '爱沙尼亚语' },
      eo: { ru: 'Эсперанто', en: 'Esperanto', de: 'Esperanto', fr: 'Espéranto', es: 'Esperanto', ja: 'エスペラント語', zh: '世界语' },
      id: { ru: 'Индонезийский', en: 'Indonesian', de: 'Indonesisch', fr: 'Indonésien', es: 'Indonesio', ja: 'インドネシア語', zh: '印度尼西亚语' },
      it: { ru: 'Итальянский', en: 'Italian', de: 'Italienisch', fr: 'Italien', es: 'Italiano', ja: 'イタリア語', zh: '意大利语' },
      en: { ru: 'Английский', en: 'English', de: 'Englisch', fr: 'Anglais', es: 'Inglés', ja: '英語', zh: '英语' },
      de: { ru: 'Немецкий', en: 'German', de: 'Deutsch', fr: 'Allemand', es: 'Alemán', ja: 'ドイツ語', zh: '德语' },
      fr: { ru: 'Французский', en: 'French', de: 'Französisch', fr: 'Français', es: 'Francés', ja: 'フランス語', zh: '法语' },
      es: { ru: 'Испанский', en: 'Spanish', de: 'Spanisch', fr: 'Espagnol', es: 'Español', ja: 'スペイン語', zh: '西班牙语' },
      ja: { ru: 'Японский', en: 'Japanese', de: 'Japanisch', fr: 'Japonais', es: 'Japonés', ja: '日本語', zh: '日语' },
      ko: { ru: 'Корейский', en: 'Korean', de: 'Koreanisch', fr: 'Coréen', es: 'Coreano', ja: '韓国語', zh: '韩语' },
      zh: { ru: 'Китайский', en: 'Chinese', de: 'Chinesisch', fr: 'Chinois', es: 'Chino', ja: '中国語', zh: '中文' },
      ar: { ru: 'Арабский', en: 'Arabic', de: 'Arabisch', fr: 'Arabe', es: 'Árabe', ja: 'アラビア語', zh: '阿拉伯语' },
      he: { ru: 'Иврит', en: 'Hebrew', de: 'Hebräisch', fr: 'Hébreu', es: 'Hebreo', ja: 'ヘブライ語', zh: '希伯来语' },
      el: { ru: 'Греческий', en: 'Greek', de: 'Griechisch', fr: 'Grec', es: 'Griego', ja: 'ギリシャ語', zh: '希腊语' }
    };
    if (cisCourseNames[c.id]?.[lang]) {
      return cisCourseNames[c.id][lang];
    }
    return c.localName || c.name;
  };

  // Get Alphabet list for current course
  const alphabetCategories: AlphabetCategory[] = useMemo(() => {
    let rawCats: AlphabetCategory[] = [];
    if (CIS_ALPHABET_DATA[currentCourse.id]) {
      rawCats = CIS_ALPHABET_DATA[currentCourse.id];
    } else {
      // Fallback for languages with standard Latin or generic alphabet
      const defaultChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
      rawCats = [{
        title: 'Alphabet',
        description: `${currentCourse.name} writing system`,
        script: 'latin',
        items: defaultChars.map(c => ({
          char: c,
          name: c.toLowerCase(),
          sound: `[${c.toLowerCase()}]`,
          word: c + '...',
          translation: ''
        }))
      }];
    }

    // Prepend a unified "🌟 Все символы и особенности" category at index 0 if multiple categories exist
    if (rawCats.length > 1) {
      const allItemsMap = new Map<string, AlphabetItem | string>();
      rawCats.forEach(cat => {
        cat.items.forEach(item => {
          const key = typeof item === 'string' ? item : item.char;
          if (!allItemsMap.has(key)) {
            allItemsMap.set(key, item);
          }
        });
      });
      const unifiedCategory: AlphabetCategory = {
        title: user.language === 'ru' ? '🌟 Все символы и особенности' : '🌟 All Symbols & Features',
        description: user.language === 'ru' ? `Полный набор букв, диакритики и знаков (${allItemsMap.size})` : `Full character set & features (${allItemsMap.size})`,
        script: rawCats[0]?.script || 'latin',
        items: Array.from(allItemsMap.values())
      };
      return [unifiedCategory, ...rawCats];
    }

    return rawCats;
  }, [currentCourse.id, currentCourse.name, user.language]);

  const currentCategory = alphabetCategories[selectedCategoryIdx] || alphabetCategories[0];
  
  // Normalise items to AlphabetItem[]
  const currentLetters: AlphabetItem[] = useMemo(() => {
    if (!currentCategory || !currentCategory.items) return [];
    return currentCategory.items.map((item) => {
      if (typeof item === 'string') {
        return {
          char: item,
          name: item.toLowerCase(),
          sound: `[${item.toLowerCase()}]`,
          word: '',
          translation: ''
        };
      }
      return item;
    });
  }, [currentCategory]);

  // Read / write mastery
  const getLetterMastery = (char: string): number => {
    const key = `${currentCourse.id}_${char}`;
    if (user.letterMastery && user.letterMastery[key] !== undefined) {
      return user.letterMastery[key];
    }
    const charCode = char.charCodeAt(0);
    const hash = (charCode * 17) % 100;
    return hash > 60 ? 100 : hash > 30 ? 60 : 25;
  };

  const updateLetterMastery = (char: string, increment: number = 25) => {
    const key = `${currentCourse.id}_${char}`;
    const current = user.letterMastery?.[key] ?? 30;
    const updated = Math.min(100, current + increment);
    const newMastery = { ...(user.letterMastery || {}), [key]: updated };
    
    const updatedUser = {
      ...user,
      letterMastery: newMastery,
      xp: user.xp + 15
    };
    setUser(updatedUser);
    if (onSaveProgress) onSaveProgress(updatedUser);
  };

  // Play letter pronunciation
  const handlePlayLetterAudio = (char: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playSound('click');
    speakText(char, currentCourse.id, false, user.preferredVoice, user.voiceProvider);
  };

  // Build Interactive Letters Lesson Exercises
  const startLetterLesson = (specificChar?: string) => {
    if (isBetaRestricted) {
      playSound('wrong');
      triggerHapticFeedback('warning');
      setShowBetaLockModal(true);
      return;
    }

    playSound('select');
    triggerHapticFeedback('medium');

    const sourcePool = specificChar 
      ? currentLetters.filter(l => l.char === specificChar || Math.random() > 0.4)
      : currentLetters;
    
    const pool = sourcePool.length > 0 ? sourcePool : currentLetters;
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const targetCharItem = specificChar ? pool.find(l => l.char === specificChar) || pool[0] : shuffled[0];

    const exercises: LetterExercise[] = [];

    const currentLang = user.language || 'ru';

    const locTrace: Record<string, string> = {
      ru: 'Обведите символ',
      en: 'Trace the character',
      de: 'Zeichne das Zeichen nach',
      fr: 'Tracez le caractère',
      es: 'Traza el carácter',
      ja: '文字をなぞってください',
      zh: '描摹该字符',
      ar: 'تتبع الحرف'
    };

    const locSelectSound: Record<string, string> = {
      ru: 'Выберите правильный символ для',
      en: 'Select the correct character for',
      de: 'Wähle das richtige Zeichen für',
      fr: 'Sélectionnez le bon caractère pour',
      es: 'Selecciona el carácter correcto para',
      ja: '正解の文字を選択してください：',
      zh: '为以下发音选择正确的字符：',
      ar: 'اختر الحرف الصحيح لـ'
    };

    const locWhatHear: Record<string, string> = {
      ru: 'Что вы слышите?',
      en: 'What do you hear?',
      de: 'Was hörst du?',
      fr: 'Qu’entendez-vous ?',
      es: '¿Qué escuchas?',
      ja: '何が聞こえますか？',
      zh: '你听到了什么？',
      ar: 'ماذا تسمع؟'
    };

    const locMatchPairs: Record<string, string> = {
      ru: 'Нажмите соответствующие пары',
      en: 'Tap the matching pairs',
      de: 'Tippe auf die passenden Paare',
      fr: 'Associez les paires',
      es: 'Toca las parejas correspondientes',
      ja: 'ペアをタップしてください',
      zh: '点击匹配配对',
      ar: 'اضغط على الأزواج المتطابقة'
    };

    const locHardWords: Record<string, string> = {
      ru: 'Выберите правильные буквы для',
      en: 'Select the correct characters for',
      de: 'Wähle die richtigen Zeichen für',
      fr: 'Sélectionnez les bons caractères pour',
      es: 'Selecciona los caracteres correctos para',
      ja: '正解の文字を選んでください：',
      zh: '选择正确的字符：',
      ar: 'اختر الأحرف الصحيحة لـ'
    };

    // 1. Trace the Character
    exercises.push({
      id: 'ex_trace_1',
      type: 'trace',
      title: locTrace[currentLang] || locTrace['ru'],
      subtitle: targetCharItem.sound || targetCharItem.translit || targetCharItem.name,
      targetChar: targetCharItem.char,
      targetSound: targetCharItem.sound || targetCharItem.translit || targetCharItem.name,
      targetWord: targetCharItem.word,
      targetTranslation: targetCharItem.translation
    });

    // 2. Select the correct character for sound
    const soundItem = shuffled[1 % shuffled.length] || targetCharItem;
    const soundDistractors = currentLetters.filter(l => l.char !== soundItem.char).slice(0, 3);
    const soundOptions = [
      { id: 'opt_s_1', text: soundItem.char, sound: soundItem.sound, isCorrect: true },
      ...soundDistractors.map((d, i) => ({ id: `opt_s_dist_${i}`, text: d.char, sound: d.sound, isCorrect: false }))
    ].sort(() => 0.5 - Math.random());

    exercises.push({
      id: 'ex_sound_2',
      type: 'select_sound',
      title: `${locSelectSound[currentLang] || locSelectSound['ru']} "${soundItem.translit || soundItem.sound || soundItem.name || soundItem.char}"`,
      targetChar: soundItem.char,
      targetSound: soundItem.sound || soundItem.translit || soundItem.name,
      options: soundOptions
    });

    // 3. What do you hear?
    const listenItem = shuffled[2 % shuffled.length] || targetCharItem;
    const listenDistractors = currentLetters.filter(l => l.char !== listenItem.char).slice(0, 3);
    const listenOptions = [
      { id: 'opt_l_1', text: listenItem.char, isCorrect: true },
      ...listenDistractors.map((d, i) => ({ id: `opt_l_dist_${i}`, text: d.char, isCorrect: false }))
    ].sort(() => 0.5 - Math.random());

    exercises.push({
      id: 'ex_listen_3',
      type: 'listen_choice',
      title: locWhatHear[currentLang] || locWhatHear['ru'],
      targetChar: listenItem.char,
      targetSound: listenItem.sound || listenItem.translit || listenItem.name,
      options: listenOptions
    });

    // 4. Tap the matching pairs
    const pairItems = shuffled.slice(0, 4);
    if (pairItems.length >= 2) {
      exercises.push({
        id: 'ex_pairs_4',
        type: 'match_pairs',
        title: locMatchPairs[currentLang] || locMatchPairs['ru'],
        pairs: pairItems.map(p => ({
          id: p.char,
          target: p.char,
          roman: p.sound || p.translit || p.name
        }))
      });
    }

    // 5. HARD EXERCISE
    const hardItem = shuffled[3 % shuffled.length] || targetCharItem;
    const testWord = hardItem.word ? hardItem.word.split(' ')[0] : (hardItem.char + (currentLetters[1]?.char || ''));
    const testTranslit = hardItem.translit 
      ? hardItem.translit.toLowerCase() 
      : (hardItem.sound || hardItem.name || hardItem.char);
    
    const genVariations = (word: string) => {
      const otherLetters = currentLetters
        .filter(l => l.char !== word[0] && l.char.length === 1)
        .map(l => l.char);
      const rest = word.slice(1);
      
      if (otherLetters.length >= 3) {
        const alts = [...otherLetters].sort(() => 0.5 - Math.random()).slice(0, 3);
        return alts.map(alt => `${alt}${rest}`);
      }
      return [word + '·', '·' + word, word + '°'];
    };
    
    const variations = genVariations(testWord);
    const hardOptions = [
      { id: 'opt_h_1', text: testWord, isCorrect: true },
      ...variations.map((v, i) => ({ id: `opt_h_dist_${i}`, text: v, isCorrect: false }))
    ].sort(() => 0.5 - Math.random());

    exercises.push({
      id: 'ex_hard_5',
      type: 'hard_word',
      isHard: true,
      title: `${locHardWords[currentLang] || locHardWords['ru']} "${testTranslit}"`,
      targetChar: testWord,
      targetSound: testTranslit,
      options: hardOptions
    });

    setLessonQueue(exercises);
    setCurrentExerciseIdx(0);
    setSelectedOptionId(null);
    setFeedbackStatus('idle');
    setHasTraced(false);
    setMatchedPairIds([]);
    setSelectedPairLeft(null);
    setSelectedPairRight(null);
    setActiveLesson(true);
  };

  const currentExercise = lessonQueue[currentExerciseIdx];

  // Auto speak on exercise start
  useEffect(() => {
    if (!activeLesson || !currentExercise) return;
    setSelectedOptionId(null);
    setFeedbackStatus('idle');
    setHasTraced(false);
    setMatchedPairIds([]);
    setSelectedPairLeft(null);
    setSelectedPairRight(null);
    setDrawnPointsCount(0);

    if (currentExercise.type === 'listen_choice' && currentExercise.targetChar) {
      setTimeout(() => {
        speakText(currentExercise.targetChar!, currentCourse.id, false, user.preferredVoice, user.voiceProvider);
      }, 300);
    }
  }, [currentExerciseIdx, activeLesson]);

  // Trace Canvas Setup
  useEffect(() => {
    if (!activeLesson || currentExercise?.type !== 'trace') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.clearRect(0, 0, rect.width, rect.height);
  }, [activeLesson, currentExercise?.type, currentExercise?.targetChar]);

  // Canvas Drawing Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#1CB0F6';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    triggerHapticFeedback('light');
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();

    setDrawnPointsCount(prev => {
      const next = prev + 1;
      if (next > 15 && !hasTraced) {
        setHasTraced(true);
        triggerHapticFeedback('medium');
      }
      return next;
    });
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    playSound('click');
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setDrawnPointsCount(0);
    setHasTraced(false);
  };

  // Pair Matching Logic
  const handleSelectLeftPair = (id: string) => {
    if (matchedPairIds.includes(id)) return;
    playSound('click');
    setSelectedPairLeft(id);

    if (selectedPairRight) {
      checkPairMatch(id, selectedPairRight);
    }
  };

  const handleSelectRightPair = (id: string) => {
    if (matchedPairIds.includes(id)) return;
    playSound('click');
    setSelectedPairRight(id);

    if (selectedPairLeft) {
      checkPairMatch(selectedPairLeft, id);
    }
  };

  const checkPairMatch = (leftId: string, rightId: string) => {
    if (leftId === rightId) {
      playSound('correct');
      triggerHapticFeedback('correct');
      const newMatched = [...matchedPairIds, leftId];
      setMatchedPairIds(newMatched);
      setSelectedPairLeft(null);
      setSelectedPairRight(null);

      if (currentExercise?.pairs && newMatched.length === currentExercise.pairs.length) {
        setFeedbackStatus('correct');
      }
    } else {
      playSound('wrong');
      triggerHapticFeedback('wrong');
      setPairMismatch(true);
      setTimeout(() => {
        setPairMismatch(false);
        setSelectedPairLeft(null);
        setSelectedPairRight(null);
      }, 500);
    }
  };

  // Check Answer Handler
  const handleCheckAnswer = () => {
    if (!currentExercise) return;

    if (currentExercise.type === 'trace') {
      playSound('correct');
      triggerHapticFeedback('correct');
      setFeedbackStatus('correct');
      if (currentExercise.targetChar) {
        updateLetterMastery(currentExercise.targetChar, 35);
      }
      return;
    }

    if (currentExercise.type === 'match_pairs') {
      playSound('correct');
      triggerHapticFeedback('correct');
      setFeedbackStatus('correct');
      return;
    }

    const selectedOpt = currentExercise.options?.find(o => o.id === selectedOptionId);
    if (selectedOpt?.isCorrect) {
      playSound('correct');
      triggerHapticFeedback('correct');
      setFeedbackStatus('correct');
      if (currentExercise.targetChar) {
        updateLetterMastery(currentExercise.targetChar, 25);
      }
    } else {
      playSound('wrong');
      triggerHapticFeedback('wrong');
      setFeedbackStatus('wrong');
    }
  };

  // Next / Continue Exercise
  const handleContinueExercise = () => {
    playSound('click');
    if (currentExerciseIdx + 1 < lessonQueue.length) {
      setCurrentExerciseIdx(prev => prev + 1);
    } else {
      // Lesson Complete!
      playSound('success');
      triggerHapticFeedback('success');
      setActiveLesson(false);
      setSelectedLetter(null);
    }
  };

  // Skip Exercise
  const handleSkipExercise = () => {
    playSound('click');
    triggerHapticFeedback('light');
    handleContinueExercise();
  };

  // Format Dual Case for card (e.g. "А а", "Б б", or standard for non-cased scripts)
  const formatLetterDisplay = (char: string) => {
    if (char.length === 1 && char.toUpperCase() !== char.toLowerCase()) {
      return `${char.toUpperCase()} ${char.toLowerCase()}`;
    }
    return char;
  };

  // Dedicated font typography classes for Chinese, Japanese, Arabic, and Klingon
  const getScriptFontClass = (courseId: string) => {
    if (courseId === 'zh') return 'font-chinese';
    if (courseId === 'ja') return 'font-japanese';
    if (courseId === 'ar') return 'font-arabic';
    if (courseId === 'tlh') return 'font-klingon';
    return '';
  };

  // Categorized course lists
  const cisCoursesList = useMemo(() => {
    const cisIds = ['be', 'uk', 'kk', 'uz', 'ky', 'tg', 'tk', 'hy', 'ka', 'az', 'mo', 'lt', 'lv', 'et'];
    return allCourses.filter(c => cisIds.includes(c.id));
  }, [allCourses]);

  const russiaCoursesList = useMemo(() => {
    return allCourses.filter(c => 
      c.id === 'ru' || 
      c.id === 'tab' || 
      c.id.startsWith('rep_') || 
      c.id.startsWith('krai_') || 
      c.id.startsWith('obl_') || 
      (c.flagCode === 'ru' && c.id !== 'tab')
    );
  }, [allCourses]);

  const worldCoursesList = useMemo(() => {
    const nonLanguageIds = ['chess', 'math', 'music'];
    const cisIds = ['be', 'uk', 'kk', 'uz', 'ky', 'tg', 'tk', 'hy', 'ka', 'az', 'mo', 'lt', 'lv', 'et'];
    return allCourses.filter(c => 
      !nonLanguageIds.includes(c.id) && 
      !cisIds.includes(c.id) && 
      c.id !== 'ru' && 
      c.id !== 'tab' && 
      !c.id.startsWith('rep_') && 
      !c.id.startsWith('krai_') && 
      !c.id.startsWith('obl_')
    );
  }, [allCourses]);

  const easiestCoursesList = useMemo(() => {
    const easyIds = ['eo', 'id', 'es', 'it'];
    return allCourses.filter(c => easyIds.includes(c.id));
  }, [allCourses]);

  const hardestCoursesList = useMemo(() => {
    const hardIds = ['tab', 'hu', 'eu', 'fi', 'nv', 'is', 'pl', 'ja', 'zh', 'ar', 'ko'];
    return allCourses.filter(c => hardIds.includes(c.id));
  }, [allCourses]);

  const betaCoursesList = useMemo(() => {
    return allCourses.filter(c => c.isBeta || ['eo', 'la', 'sv', 'no', 'tt', 'hv', 'tlh', 'yi'].includes(c.id));
  }, [allCourses]);

  const isNonLanguage = currentCourse.id === 'chess' || currentCourse.id === 'math' || currentCourse.id === 'music' || currentCourse.flagCode === 'chess' || currentCourse.flagCode === 'math' || currentCourse.flagCode === 'music';

  if (isNonLanguage) {
    return (
      <div className={`min-h-screen w-full ${isLightMode ? 'bg-[#F7F9FA] text-slate-900' : 'bg-[#131F24] text-white'} flex flex-col items-center justify-center p-4 sm:p-6 font-din relative`}>
        <div className={`max-w-md w-full rounded-3xl p-6 sm:p-8 border-2 shadow-2xl text-center space-y-5 ${isLightMode ? 'bg-white border-slate-300' : 'bg-[#182329] border-gray-700'}`}>
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-4xl shadow-inner">
            🔒
          </div>
          
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {user.language === 'ru' ? 'Раздел недоступен' : 'Section unavailable'}
            </span>
            <h2 className="text-2xl font-black mt-3">
              {user.language === 'ru' ? 'Раздел «Письма» доступен только для языковых курсов' : 'Letters section is only available for language courses'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-medium mt-2 leading-relaxed">
              {user.language === 'ru'
                ? `Курс «${currentCourse.localName || currentCourse.name}» относится к разделу «Предметы & Игры» (не языковой курс). В данном предмете нет алфавита или букв.`
                : `The course "${currentCourse.name}" is a special subject/game (non-language). Letters and alphabets are only available for language courses.`}
            </p>
          </div>

          <div className="flex flex-col space-y-2.5 pt-2">
            <button
              onClick={() => {
                playSound('click');
                setShowCoursePickerModal(true);
              }}
              className="w-full py-3.5 px-4 bg-duo-green hover:bg-duo-greenDark text-white font-black text-xs uppercase tracking-wider rounded-2xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all shadow-lg cursor-pointer"
            >
              🌍 {user.language === 'ru' ? 'Выбрать языковой курс' : 'Choose a language course'}
            </button>
            {onBackToPath && (
              <button
                onClick={() => {
                  playSound('click');
                  onBackToPath();
                }}
                className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs uppercase tracking-wider rounded-2xl border border-gray-700 transition-all cursor-pointer"
              >
                ← {user.language === 'ru' ? 'Вернуться к урокам курса' : 'Back to course lessons'}
              </button>
            )}
          </div>
        </div>

        {/* Modal Course Picker */}
        {showCoursePickerModal && (
          <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#182329] border-2 border-gray-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <AlphabetIcon className="w-6 h-6 text-duo-blue" />
                  <h3 className="text-xl font-black text-white">
                    {user.language === 'ru' ? 'Выберите язык курса' : 'Choose Course Language'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowCoursePickerModal(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 cursor-pointer"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs: CIS vs Russia Regions vs World vs Easiest vs Hardest vs Beta */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 rounded-2xl bg-gray-800/80 p-1 mb-4">
                <button
                  onClick={() => {
                    playSound('click');
                    setCourseCategoryTab('cis');
                  }}
                  className={`py-2 px-1 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer text-center ${
                    courseCategoryTab === 'cis' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🏛️ {user.language === 'ru' ? 'СНГ' : 'CIS'}
                </button>
                <button
                  onClick={() => {
                    playSound('click');
                    setCourseCategoryTab('russia');
                  }}
                  className={`py-2 px-1 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer text-center ${
                    courseCategoryTab === 'russia' ? 'bg-rose-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🇷🇺 {user.language === 'ru' ? 'РФ' : 'Russia'}
                </button>
                <button
                  onClick={() => {
                    playSound('click');
                    setCourseCategoryTab('world');
                  }}
                  className={`py-2 px-1 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer text-center ${
                    courseCategoryTab === 'world' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🌍 {user.language === 'ru' ? 'Мир' : 'World'}
                </button>
                <button
                  onClick={() => {
                    playSound('click');
                    setCourseCategoryTab('easiest');
                  }}
                  className={`py-2 px-1 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer text-center ${
                    courseCategoryTab === 'easiest' ? 'bg-amber-500 text-black shadow-md font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🏆 {user.language === 'ru' ? 'Лёгкие' : 'Easy'}
                </button>
                <button
                  onClick={() => {
                    playSound('click');
                    setCourseCategoryTab('hardest');
                  }}
                  className={`py-2 px-1 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer text-center ${
                    courseCategoryTab === 'hardest' ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🔥 {user.language === 'ru' ? 'Сложные' : 'Hard'}
                </button>
                <button
                  onClick={() => {
                    playSound('click');
                    setCourseCategoryTab('beta');
                  }}
                  className={`py-2 px-1 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer text-center ${
                    courseCategoryTab === 'beta' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md ring-1 ring-purple-400/50' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🧪 {user.language === 'ru' ? 'Бета' : 'Beta'}
                </button>
              </div>

              {/* Course Grid */}
              <div className="overflow-y-auto space-y-2 pr-1 flex-1">
                {(
                  courseCategoryTab === 'cis' 
                    ? cisCoursesList 
                    : courseCategoryTab === 'russia'
                    ? russiaCoursesList
                    : courseCategoryTab === 'world'
                    ? worldCoursesList
                    : courseCategoryTab === 'easiest'
                    ? easiestCoursesList
                    : courseCategoryTab === 'hardest'
                    ? hardestCoursesList
                    : betaCoursesList
                ).map(c => {
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        playSound('select');
                        if (onSwitchCourse) onSwitchCourse(c);
                        setShowCoursePickerModal(false);
                      }}
                      className="w-full p-3.5 rounded-2xl flex items-center justify-between border-2 transition-all cursor-pointer bg-gray-800/60 border-gray-700/60 hover:bg-gray-750 hover:border-gray-600 text-gray-300"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{c.flagCode || '🌐'}</span>
                        <div className="text-left">
                          <span className="font-black text-sm block text-white">
                            {getCourseDisplayName(c)}
                          </span>
                          <span className="text-xs text-gray-400 font-bold">
                            {c.name}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs bg-duo-green/20 text-duo-green font-black px-2.5 py-1 rounded-lg">
                        {user.language === 'ru' ? 'Выбрать' : 'Select'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full ${isLightMode ? 'bg-[#F7F9FA] text-slate-900' : 'bg-[#131F24] text-white'} selection:bg-duo-blue/30 pb-28 md:pb-12 transition-colors`}>
      
      {/* ========================================================================= */}
      {/* 1. INTERACTIVE LETTERS LESSON MODE (Screenshots 2, 3, 4, 5, 6)             */}
      {/* ========================================================================= */}
      {activeLesson && currentExercise ? (
        <div className="max-w-2xl mx-auto min-h-screen flex flex-col justify-between p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Top Bar: Close, Skip, Progress, Energy, Hearts */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={() => {
                  playSound('click');
                  setActiveLesson(false);
                }}
                className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                title={user.language === 'ru' ? 'Выйти' : 'Quit'}
              >
                <CloseIcon className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={handleSkipExercise}
                className="px-2.5 py-1 bg-gray-800/90 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 rounded-xl font-black text-xs uppercase tracking-wider flex items-center space-x-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                title={user.language === 'ru' ? 'Пропустить упражнение' : 'Skip exercise'}
              >
                <span>⏭️</span>
                <span className="hidden sm:inline">{user.language === 'ru' ? 'Пропустить' : 'Skip'}</span>
              </button>
            </div>

            {/* Green Animated Progress Bar */}
            <div className="flex-1 bg-gray-800 h-3.5 rounded-full overflow-hidden border border-gray-700">
              <div 
                className="bg-[#58CC02] h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentExerciseIdx + 1) / lessonQueue.length) * 100}%` }}
              />
            </div>

            {/* Stats Indicators */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-duo-orange font-black text-sm">
                <LightningIcon className="w-5 h-5 animate-pulse" />
                <span>{user.energy || 25}</span>
              </div>
              <div className="flex items-center space-x-1 text-duo-red font-black text-sm">
                <InfiniteHeartIcon className="w-5 h-5" />
                <span>∞</span>
              </div>
            </div>
          </div>

          {/* Exercise Content Area */}
          <div className="flex-1 flex flex-col justify-center my-auto py-4">

            {/* Hard Exercise Header Badge (Screenshot 6) */}
            {currentExercise.isHard && (
              <div className="flex items-center space-x-2 text-duo-red font-black text-xs uppercase tracking-widest mb-3 animate-bounce">
                <DumbbellIcon className="w-5 h-5" />
                <span>{user.language === 'ru' ? 'Сложное упражнение' : 'Hard Exercise'}</span>
              </div>
            )}

            {/* Exercise Title */}
            <h2 className="text-2xl sm:text-3xl font-black mb-6 leading-tight">
              {currentExercise.title}
            </h2>

            {/* ================================================================= */}
            {/* EXERCISE 1: TRACE THE CHARACTER (Screenshot 2)                    */}
            {/* ================================================================= */}
            {currentExercise.type === 'trace' && (
              <div className="flex flex-col items-center">
                {/* Audio Badge */}
                <div className="flex items-center space-x-3 self-start mb-6">
                  <button
                    onClick={() => handlePlayLetterAudio(currentExercise.targetChar || '')}
                    className="w-14 h-14 bg-duo-blue hover:bg-[#1899D6] active:scale-95 text-white rounded-2xl flex items-center justify-center shadow-md transition-all cursor-pointer"
                  >
                    <VolumeIcon className="w-7 h-7" />
                  </button>
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase block">
                      {currentExercise.subtitle}
                    </span>
                    <span className="text-2xl font-black text-white">
                      {currentExercise.targetChar}
                    </span>
                  </div>
                </div>

                {/* Tracing Canvas with Coordinate Crosshairs and Stroke Direction Arrow */}
                <div className="relative w-72 h-72 sm:w-80 sm:h-80 bg-[#182329] border-2 border-gray-800 rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl">
                  
                  {/* Dashed Crosshairs Axis */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="w-full h-0 border-t-2 border-dashed border-gray-700/60 absolute top-1/2 -translate-y-1/2" />
                    <div className="h-full w-0 border-l-2 border-dashed border-gray-700/60 absolute left-1/2 -translate-x-1/2" />
                  </div>

                  {/* Character Ghost Background Template */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                    <span className="text-[13rem] font-black text-[#2B3840] leading-none">
                      {currentExercise.targetChar}
                    </span>
                  </div>

                  {/* Animated Stroke Direction Arrow Indicator (Screenshot 2) */}
                  {!hasTraced && (
                    <div className="absolute top-12 right-16 sm:right-20 pointer-events-none animate-bounce z-10 flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-duo-blue flex items-center justify-center text-white font-black text-sm shadow-lg">
                        ↓
                      </div>
                      <div className="w-0.5 h-12 border-l-2 border-dashed border-duo-blue" />
                    </div>
                  )}

                  {/* User Tracing Canvas */}
                  <canvas
                    ref={canvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    className="relative z-20 w-full h-full cursor-crosshair touch-none"
                  />

                  {/* Clear Button */}
                  <button
                    onClick={clearCanvas}
                    className="absolute bottom-3 right-3 z-30 p-2 bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl text-xs flex items-center space-x-1 cursor-pointer"
                    title="Очистить"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Brush Size Adjustment Toolbar (+ and -) */}
                <div className="mt-3 flex items-center justify-center space-x-2 bg-gray-800/90 border border-gray-700/80 px-3 py-1.5 rounded-2xl shadow-md">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      const newSize = Math.max(4, brushSize - 2);
                      setBrushSize(newSize);
                      setUser(prev => ({ ...prev, handwritingBrushSize: newSize }));
                    }}
                    className="w-8 h-8 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-black text-lg flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                    title="Уменьшить толщину кисти (-)"
                  >
                    -
                  </button>

                  <div className="flex items-center space-x-2 px-2" title={`Размер кисти: ${brushSize}px`}>
                    <div
                      className="rounded-full bg-duo-blue shadow-sm transition-all"
                      style={{ width: `${Math.min(18, Math.max(6, brushSize))}px`, height: `${Math.min(18, Math.max(6, brushSize))}px` }}
                    />
                    <span className="text-xs font-black font-mono text-duo-blue">{brushSize}px</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      const newSize = Math.min(36, brushSize + 2);
                      setBrushSize(newSize);
                      setUser(prev => ({ ...prev, handwritingBrushSize: newSize }));
                    }}
                    className="w-8 h-8 rounded-xl bg-duo-blue hover:bg-[#1899D6] text-white font-black text-lg flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                    title="Увеличить толщину кисти (+)"
                  >
                    +
                  </button>
                </div>

                <p className="text-xs text-gray-400 font-bold mt-2">
                  {user.language === 'ru' ? 'Проведите пальцем или мышкой по контуру буквы' : 'Trace along the character outline'}
                </p>
              </div>
            )}

            {/* ================================================================= */}
            {/* EXERCISE 2: SELECT CHARACTER FOR SOUND (Screenshot 3)             */}
            {/* ================================================================= */}
            {currentExercise.type === 'select_sound' && currentExercise.options && (
              <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto w-full">
                {currentExercise.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        playSound('select');
                        triggerHapticFeedback('light');
                        setSelectedOptionId(opt.id);
                        speakText(opt.text, currentCourse.id, false, user.preferredVoice, user.voiceProvider);
                      }}
                      className={`h-36 sm:h-44 rounded-3xl flex items-center justify-center font-black text-4xl sm:text-5xl transition-all border-b-4 active:border-b-2 active:translate-y-0.5 cursor-pointer ${getScriptFontClass(currentCourse.id)} ${
                        isSelected
                          ? 'bg-[#182329] border-duo-blue ring-4 ring-duo-blue/30 text-duo-blue'
                          : 'bg-[#182329] border-gray-800 hover:border-gray-700 text-white hover:bg-[#1E2B33]'
                      }`}
                    >
                      {opt.text}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ================================================================= */}
            {/* EXERCISE 3: WHAT DO YOU HEAR? (Screenshot 4)                      */}
            {/* ================================================================= */}
            {currentExercise.type === 'listen_choice' && currentExercise.options && (
              <div className="flex flex-col items-center">
                {/* Giant Speaker Play Button */}
                <button
                  onClick={() => handlePlayLetterAudio(currentExercise.targetChar || '')}
                  className="w-28 h-28 sm:w-36 sm:h-36 bg-duo-blue hover:bg-[#1899D6] active:scale-95 text-white rounded-3xl flex items-center justify-center shadow-2xl mb-8 transition-all cursor-pointer group"
                >
                  <VolumeIcon className="w-14 h-14 group-hover:scale-110 transition-transform" />
                </button>

                {/* 2x2 Option Grid */}
                <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto w-full mb-4">
                  {currentExercise.options.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          playSound('select');
                          triggerHapticFeedback('light');
                          setSelectedOptionId(opt.id);
                        }}
                        className={`h-28 sm:h-32 rounded-3xl flex items-center justify-center font-black text-3xl sm:text-4xl transition-all border-b-4 active:border-b-2 active:translate-y-0.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#182329] border-duo-blue ring-4 ring-duo-blue/30 text-duo-blue'
                            : 'bg-[#182329] border-gray-800 hover:border-gray-700 text-white hover:bg-[#1E2B33]'
                        }`}
                      >
                        {opt.text}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    playSound('click');
                    setSelectedOptionId(currentExercise.options?.find(o => o.isCorrect)?.id || null);
                  }}
                  className="text-xs font-black text-gray-500 hover:text-gray-300 uppercase tracking-widest mt-2 cursor-pointer"
                >
                  {user.language === 'ru' ? 'СЕЙЧАС НЕ МОГУ СЛУШАТЬ' : "CAN'T LISTEN NOW"}
                </button>
              </div>
            )}

            {/* ================================================================= */}
            {/* EXERCISE 4: TAP THE MATCHING PAIRS (Screenshot 5)                 */}
            {/* ================================================================= */}
            {currentExercise.type === 'match_pairs' && currentExercise.pairs && (
              <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto w-full">
                {/* Left Column (Target Script) */}
                <div className="flex flex-col space-y-3">
                  {currentExercise.pairs.map((p) => {
                    const isMatched = matchedPairIds.includes(p.id);
                    const isSelected = selectedPairLeft === p.id;
                    return (
                      <button
                        key={`left_${p.id}`}
                        disabled={isMatched}
                        onClick={() => handleSelectLeftPair(p.id)}
                        className={`h-20 rounded-2xl flex items-center justify-center font-black text-xl transition-all border-b-4 active:border-b-2 cursor-pointer ${getScriptFontClass(currentCourse.id)} ${
                          isMatched
                            ? 'opacity-30 bg-gray-900 border-transparent text-gray-600 cursor-not-allowed'
                            : isSelected
                            ? 'bg-[#182329] border-duo-blue ring-4 ring-duo-blue/30 text-duo-blue'
                            : pairMismatch && isSelected
                            ? 'bg-red-950 border-red-500 text-red-400 animate-shake'
                            : 'bg-[#182329] border-gray-800 hover:border-gray-700 text-white'
                        }`}
                      >
                        {p.target}
                      </button>
                    );
                  })}
                </div>

                {/* Right Column (Romanized / Translit) */}
                <div className="flex flex-col space-y-3">
                  {[...currentExercise.pairs].sort((a, b) => b.roman.localeCompare(a.roman)).map((p) => {
                    const isMatched = matchedPairIds.includes(p.id);
                    const isSelected = selectedPairRight === p.id;
                    return (
                      <button
                        key={`right_${p.id}`}
                        disabled={isMatched}
                        onClick={() => handleSelectRightPair(p.id)}
                        className={`h-20 rounded-2xl flex items-center justify-center font-black text-xl transition-all border-b-4 active:border-b-2 cursor-pointer ${
                          isMatched
                            ? 'opacity-30 bg-gray-900 border-transparent text-gray-600 cursor-not-allowed'
                            : isSelected
                            ? 'bg-[#182329] border-duo-blue ring-4 ring-duo-blue/30 text-duo-blue'
                            : pairMismatch && isSelected
                            ? 'bg-red-950 border-red-500 text-red-400 animate-shake'
                            : 'bg-[#182329] border-gray-800 hover:border-gray-700 text-white'
                        }`}
                      >
                        {p.roman}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* EXERCISE 5: HARD WORD SELECTION (Screenshot 6)                    */}
            {/* ================================================================= */}
            {currentExercise.type === 'hard_word' && currentExercise.options && (
              <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto w-full">
                {currentExercise.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        playSound('select');
                        triggerHapticFeedback('light');
                        setSelectedOptionId(opt.id);
                      }}
                      className={`h-36 sm:h-44 rounded-3xl flex items-center justify-center font-black text-3xl sm:text-4xl transition-all border-b-4 active:border-b-2 active:translate-y-0.5 cursor-pointer ${getScriptFontClass(currentCourse.id)} ${
                        isSelected
                          ? 'bg-[#182329] border-duo-blue ring-4 ring-duo-blue/30 text-duo-blue'
                          : 'bg-[#182329] border-gray-800 hover:border-gray-700 text-white hover:bg-[#1E2B33]'
                      }`}
                    >
                      {opt.text}
                    </button>
                  );
                })}
              </div>
            )}

          </div>

          {/* Bottom Action / Check / Continue Bar */}
          <div className="pt-4 border-t border-gray-800/80">
            {feedbackStatus === 'idle' ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSkipExercise}
                  className="px-5 py-4 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider border-2 border-gray-700 bg-gray-800/90 hover:bg-gray-700 hover:border-gray-500 text-gray-300 hover:text-white transition-all active:translate-y-1 shadow-md cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  title={user.language === 'ru' ? 'Пропустить упражнение' : 'Skip exercise'}
                >
                  <span>⏭️</span>
                  <span>{user.language === 'ru' ? 'ПРОПУСТИТЬ' : 'SKIP'}</span>
                </button>
                <button
                  disabled={
                    currentExercise.type === 'trace' 
                      ? !hasTraced 
                      : currentExercise.type === 'match_pairs'
                      ? matchedPairIds.length !== (currentExercise.pairs?.length || 0)
                      : !selectedOptionId
                  }
                  onClick={handleCheckAnswer}
                  className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border-b-4 active:border-b-0 active:translate-y-1 shadow-xl cursor-pointer ${
                    (currentExercise.type === 'trace' ? hasTraced : currentExercise.type === 'match_pairs' ? matchedPairIds.length === (currentExercise.pairs?.length || 0) : selectedOptionId)
                      ? 'bg-[#58CC02] hover:bg-[#46A302] text-white border-[#46A302]'
                      : 'bg-gray-800 text-gray-500 border-gray-900 cursor-not-allowed'
                  }`}
                >
                  {user.language === 'ru' ? 'ПРОВЕРИТЬ' : 'CHECK'}
                </button>
              </div>
            ) : (
              <div className={`p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-bottom-3 duration-200 ${
                feedbackStatus === 'correct' ? 'bg-[#58CC02]/20 border-2 border-[#58CC02]' : 'bg-red-500/20 border-2 border-red-500'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xl text-white ${
                    feedbackStatus === 'correct' ? 'bg-[#58CC02]' : 'bg-red-500'
                  }`}>
                    {feedbackStatus === 'correct' ? '✓' : '✕'}
                  </div>
                  <div>
                    <h4 className={`font-black text-lg ${feedbackStatus === 'correct' ? 'text-[#58CC02]' : 'text-red-400'}`}>
                      {feedbackStatus === 'correct' 
                        ? (user.language === 'ru' ? 'Отлично!' : 'Nicely done!') 
                        : (user.language === 'ru' ? 'Неправильно' : 'Incorrect')}
                    </h4>
                    {feedbackStatus === 'wrong' && currentExercise.targetChar && (
                      <p className="text-xs text-gray-300 font-bold">
                        {user.language === 'ru' ? 'Правильный ответ: ' : 'Correct answer: '}
                        <span className="text-white font-black">{currentExercise.targetChar}</span>
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleContinueExercise}
                  className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all border-b-4 active:border-b-0 active:translate-y-1 shadow-lg cursor-pointer ${
                    feedbackStatus === 'correct' ? 'bg-[#58CC02] border-[#46A302]' : 'bg-red-500 border-red-700'
                  }`}
                >
                  {user.language === 'ru' ? 'ПРОДОЛЖИТЬ' : 'CONTINUE'}
                </button>
              </div>
            )}
          </div>

        </div>
      ) : (

        /* ========================================================================= */
        /* 2. DUOLINGO LETTERS OVERVIEW HUB (Screenshot 1)                           */
        /* ========================================================================= */
        <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 animate-in fade-in duration-300">
          
          {/* Header Section */}
          <div className="flex flex-col items-center text-center mb-8">
            
            {/* Course Switcher Pill Badge */}
            <button
              onClick={() => {
                playSound('click');
                setShowCoursePickerModal(true);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-[#182329] hover:bg-[#1E2B33] border-2 border-gray-700/80 hover:border-duo-blue text-white font-black text-xs uppercase tracking-wider mb-4 transition-all shadow-md cursor-pointer group"
            >
              <span className="text-base">{currentCourse.flagCode || '🌐'}</span>
              <span>{getCourseDisplayName(currentCourse)}</span>
              <span className="text-gray-400 group-hover:text-duo-blue transition-colors">▾</span>
            </button>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              {user.language === 'ru' 
                ? `Учим ${getCourseDisplayName(currentCourse)}!` 
                : `Let’s learn ${getCourseDisplayName(currentCourse)}!`}
            </h1>
            
            <p className="text-sm sm:text-base font-bold text-gray-400 max-w-lg">
              {user.language === 'ru'
                ? `Познакомьтесь с письменностью языка ${getCourseDisplayName(currentCourse)}`
                : `Get to know the ${getCourseDisplayName(currentCourse)} writing system`}
            </p>

            {/* Writing Restriction Notice Banner */}
            {isWritingLocked ? (
              <div className="w-full max-w-lg mt-4 p-4 rounded-3xl bg-rose-950/40 border-2 border-rose-500/50 shadow-xl text-center space-y-2 animate-in fade-in">
                <div className="flex items-center justify-center space-x-2 text-rose-300 font-black text-xs sm:text-sm uppercase tracking-wider">
                  <span>🔒</span>
                  <span>Раздел Письмо Будут доступ 1 ноября 2026 год</span>
                </div>
                <div className="text-xs font-bold text-gray-300">
                  🔒 {currentCourse.localName || currentCourse.name} — в разработке • Доступно 1 ноября 2026 г.
                </div>
                <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-black uppercase">
                    🔒 1 нояб. 2026
                  </span>
                  <span className="text-amber-400 font-mono text-xs font-bold">
                    Доступно через {daysUntilUnlock} {daysUntilUnlock === 1 ? 'день' : daysUntilUnlock < 5 ? 'дня' : 'дней'}
                  </span>
                </div>
              </div>
            ) : isBetaRestricted && betaLockInfo ? (
              <div className="w-full max-w-md mt-4 p-4 rounded-3xl bg-amber-950/40 border-2 border-amber-500/50 shadow-xl text-center space-y-2 animate-in fade-in">
                <div className="flex items-center justify-center space-x-2 text-amber-300 font-black text-xs sm:text-sm uppercase tracking-wider">
                  <span>🔒</span>
                  <span>В разработке • Доступно 1 ноября 2026 г.</span>
                </div>
                <div className="flex items-center justify-center flex-wrap gap-2 text-xs font-bold text-gray-300">
                  <span className="text-white font-black">{currentCourse.localName || currentCourse.name}</span>
                  <span className="font-mono text-purple-300 bg-purple-900/60 border border-purple-500/40 px-2 py-0.5 rounded-full font-bold">
                    {betaLockInfo.version}
                  </span>
                  <span className="text-amber-400 font-mono">Доступно через {daysUntilUnlock} дн.</span>
                </div>
                {currentCourse.id === 'tlh' && (
                  <div className="pt-2 flex items-center justify-center gap-2 text-xs text-emerald-300 font-bold border-t border-amber-500/20">
                    <span className="font-klingon text-lg">tlhIngan Hol</span>
                    <span className="text-[11px] text-gray-300">• Шрифт Klingon Font подключен (fontomania.ru/17807-klingon.html)</span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Prominent "LEARN THE LETTERS" Button (Screenshot 1) */}
            <div className="w-full max-w-md mt-6">
              <button
                onClick={() => startLetterLesson()}
                className={`w-full py-4 px-8 active:border-b-0 active:translate-y-1 text-white font-black text-sm uppercase tracking-widest rounded-2xl border-b-4 shadow-xl flex items-center justify-center space-x-3 transition-all cursor-pointer group ${
                  isWritingLocked
                    ? 'bg-rose-700 hover:bg-rose-600 border-rose-900'
                    : isBetaRestricted
                    ? 'bg-amber-600 hover:bg-amber-500 border-amber-800'
                    : 'bg-duo-blue hover:bg-[#1899D6] border-[#1899D6]'
                }`}
              >
                {isWritingLocked ? (
                  <>
                    <span>🔒</span>
                    <span>{user.language === 'ru' ? 'РАЗДЕЛ ПИСЬМО (ДО 1 НОЯБРЯ 2026)' : 'LETTERS LOCKED (UNTIL NOV 1, 2026)'}</span>
                  </>
                ) : isBetaRestricted ? (
                  <>
                    <span>🔒</span>
                    <span>{user.language === 'ru' ? 'ОГРАНИЧЕНИЕ ПИСЬМА (ДО 1 НОЯ 2026)' : 'WRITING RESTRICTED (UNTIL NOV 1 2026)'}</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span>{user.language === 'ru' ? 'УЧИТЬ БУКВЫ' : 'LEARN THE LETTERS'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Arabic Font Switcher Pill Bar (Only shown for Arabic course) */}
            {currentCourse.id === 'ar' && (
              <div className="w-full max-w-md mt-4 p-3 bg-[#182329] border border-emerald-500/40 rounded-2xl flex flex-col items-center gap-2 shadow-lg">
                <div className="flex items-center justify-between w-full px-1 text-xs font-bold text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <span>🇦🇪</span>
                    <span>{user.language === 'ru' ? 'Шрифт курса Арабского:' : 'Arabic Font:'}</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {user.arabicFontFamily === 'cairo' ? 'Cairo' : user.arabicFontFamily === 'noto' ? 'Noto Sans' : 'Duo Rounded'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 w-full">
                  {[
                    { id: 'duo' as const, label: 'Duo Rounded' },
                    { id: 'noto' as const, label: 'Noto Sans' },
                    { id: 'cairo' as const, label: 'Cairo' },
                  ].map((fontOpt) => {
                    const isSelected = (user.arabicFontFamily || 'duo') === fontOpt.id;
                    return (
                      <button
                        key={fontOpt.id}
                        type="button"
                        onClick={() => {
                          playSound('select');
                          const updatedUser = { ...user, arabicFontFamily: fontOpt.id };
                          setUser(updatedUser);
                          if (onSaveProgress) onSaveProgress(updatedUser);
                          try {
                            localStorage.setItem('duowindo6601_user_progress_v1', JSON.stringify(updatedUser));
                          } catch {}
                          document.documentElement.setAttribute('data-arabic-font', fontOpt.id);
                          document.body.setAttribute('data-arabic-font', fontOpt.id);
                        }}
                        className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-1 ring-emerald-400'
                            : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white hover:bg-gray-700'
                        }`}
                      >
                        {fontOpt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Category Tabs (if language has multiple scripts or alphabet sections) */}
          {alphabetCategories.length > 1 && (
            <div className="flex items-center justify-center flex-wrap gap-2 mb-8">
              {alphabetCategories.map((cat, idx) => (
                <button
                  key={cat.title}
                  onClick={() => {
                    playSound('click');
                    setSelectedCategoryIdx(idx);
                  }}
                  className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border-b-4 cursor-pointer ${
                    selectedCategoryIdx === idx
                      ? 'bg-duo-blue text-white border-duo-blueDark shadow-lg scale-105'
                      : 'bg-gray-800 text-gray-400 border-gray-900 hover:bg-gray-700'
                  }`}
                >
                  {cat.title}
                </button>
              ))}
            </div>
          )}

          {/* Letter Cards Grid (Screenshot 1: 4 columns mobile, 6-8 desktop) */}
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3.5 mb-12">
            {currentLetters.map((item, idx) => {
              const mastery = getLetterMastery(item.char);
              const isSelected = selectedLetter?.char === item.char;

              return (
                <div
                  key={`${item.char}_${idx}`}
                  onClick={() => {
                    setSelectedLetter(item);
                    handlePlayLetterAudio(item.char);
                  }}
                  className={`group relative rounded-2xl p-2 sm:p-3 flex flex-col items-center justify-between transition-all duration-200 cursor-pointer select-none border-2 active:scale-95 ${
                    isSelected
                      ? 'bg-[#182329] border-[#FFC800] ring-2 ring-[#FFC800]/50 shadow-lg -translate-y-1'
                      : 'bg-[#182329] border-[#2B3840] hover:border-gray-600 hover:bg-[#1E2B33]'
                  }`}
                >
                  {/* Letter Character Display */}
                  <div className="my-1 flex flex-col items-center">
                    <span className={`text-xl sm:text-2xl font-black transition-colors ${getScriptFontClass(currentCourse.id)} ${
                      isSelected ? 'text-[#FFC800]' : 'text-white group-hover:text-duo-blue'
                    }`}>
                      {formatLetterDisplay(item.char)}
                    </span>
                    
                    {/* Romanization / Sound transcription */}
                    <span className={`text-[11px] sm:text-xs font-bold mt-0.5 tracking-tight ${
                      isSelected ? 'text-[#FFC800]/80' : 'text-[#77909D]'
                    }`}>
                      {item.translit || item.sound || item.name}
                    </span>
                  </div>

                  {/* Mastery Progress Bar (Screenshot 1) */}
                  <div className="w-full bg-[#37464F] h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="bg-[#FFC800] h-full rounded-full transition-all duration-500"
                      style={{ width: `${mastery}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* DUAL ARABIC NUMERALS CONVERTER (0-99) & HANDBOOK FOR ARABIC COURSE */}
          {currentCourse.id === 'ar' && (
            <ArabicNumeralsConverter 
              speakText={speakText} 
              preferredVoice={user.preferredVoice} 
              voiceProvider={user.voiceProvider} 
            />
          )}

          {/* Letter Detail Bottom Sheet / Modal */}
          {selectedLetter && (
            <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6 bg-duo-dark/95 backdrop-blur-xl border-t-2 border-gray-800 rounded-t-[2.5rem] shadow-2xl max-w-xl mx-auto animate-in slide-in-from-bottom-6 duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 rounded-2xl bg-duo-blue/20 border-2 border-duo-blue flex items-center justify-center text-3xl font-black text-white ${getScriptFontClass(currentCourse.id)}`}>
                    {selectedLetter.char}
                  </div>
                  <div>
                    <h3 className={`text-xl font-black text-white ${getScriptFontClass(currentCourse.id)}`}>
                      {formatLetterDisplay(selectedLetter.char)}
                    </h3>
                    <p className="text-xs font-bold text-gray-400">
                      {user.language === 'ru' ? 'Звук: ' : 'Sound: '}
                      <span className="text-duo-blue">{selectedLetter.sound || selectedLetter.name}</span>
                      {selectedLetter.translit && ` • ${selectedLetter.translit}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLetter(null)}
                  className="p-2 text-gray-500 hover:text-white rounded-full hover:bg-gray-800 cursor-pointer"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Word Example */}
              {selectedLetter.word && (
                <div className="bg-[#182329] border border-gray-800 rounded-2xl p-3 mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-400 block uppercase">
                      {user.language === 'ru' ? 'Пример слова' : 'Example Word'}
                    </span>
                    <span className="text-base font-black text-duo-green">{selectedLetter.word}</span>
                    {selectedLetter.translation && (
                      <span className="text-xs font-medium text-gray-400 ml-2">({selectedLetter.translation})</span>
                    )}
                  </div>
                  <button
                    onClick={() => handlePlayLetterAudio(selectedLetter.word || selectedLetter.char)}
                    className="p-2.5 bg-gray-800 hover:bg-duo-blue text-gray-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                  >
                    <VolumeIcon className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handlePlayLetterAudio(selectedLetter.char)}
                  className="py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl border-b-4 border-gray-900 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <VolumeIcon className="w-5 h-5" />
                  <span>{user.language === 'ru' ? 'Слушать' : 'Listen'}</span>
                </button>

                <button
                  onClick={() => startLetterLesson(selectedLetter.char)}
                  className="py-3.5 bg-duo-blue hover:bg-[#1899D6] text-white font-black text-xs uppercase tracking-wider rounded-2xl border-b-4 border-[#1899D6] flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg"
                >
                  <PenIcon className="w-5 h-5" />
                  <span>{user.language === 'ru' ? 'Тренировать' : 'Practice'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Sleek Modal Course Picker (Opens when clicking course title pill) */}
          {showCoursePickerModal && (
            <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-[#182329] border-2 border-gray-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[85vh] flex flex-col">
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <AlphabetIcon className="w-6 h-6 text-duo-blue" />
                    <h3 className="text-xl font-black text-white">
                      {user.language === 'ru' ? 'Выберите язык курса' : 'Choose Course Language'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowCoursePickerModal(false)}
                    className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 cursor-pointer"
                  >
                    <CloseIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Tabs: CIS vs Russia Regions vs World vs Easiest vs Hardest vs Beta */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 rounded-2xl bg-gray-800/80 p-1 mb-4">
                  <button
                    onClick={() => {
                      playSound('click');
                      setCourseCategoryTab('cis');
                    }}
                    className={`py-2 px-1 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer text-center ${
                      courseCategoryTab === 'cis' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🏛️ {user.language === 'ru' ? 'Страны СНГ' : 'CIS'}
                  </button>
                  <button
                    onClick={() => {
                      playSound('click');
                      setCourseCategoryTab('russia');
                    }}
                    className={`py-2 px-1 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer text-center ${
                      courseCategoryTab === 'russia' ? 'bg-rose-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🇷🇺 {user.language === 'ru' ? 'Регионы РФ' : 'Russia'}
                  </button>
                  <button
                    onClick={() => {
                      playSound('click');
                      setCourseCategoryTab('world');
                    }}
                    className={`py-2 px-1 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer text-center ${
                      courseCategoryTab === 'world' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🌍 {user.language === 'ru' ? 'Языки мира' : 'World'}
                  </button>
                  <button
                    onClick={() => {
                      playSound('click');
                      setCourseCategoryTab('easiest');
                    }}
                    className={`py-2 px-1 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer text-center ${
                      courseCategoryTab === 'easiest' ? 'bg-amber-500 text-black shadow-md font-bold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🏆 {user.language === 'ru' ? 'Лёгкие' : 'Easiest'}
                  </button>
                  <button
                    onClick={() => {
                      playSound('click');
                      setCourseCategoryTab('hardest');
                    }}
                    className={`py-2 px-1 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer text-center ${
                      courseCategoryTab === 'hardest' ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🔥 {user.language === 'ru' ? 'Сложнейшие' : 'Hardest'}
                  </button>
                  <button
                    onClick={() => {
                      playSound('click');
                      setCourseCategoryTab('beta');
                    }}
                    className={`py-2 px-1 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer text-center ${
                      courseCategoryTab === 'beta' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md ring-1 ring-purple-400/50' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🧪 {user.language === 'ru' ? 'Бета' : 'Beta'}
                  </button>
                </div>

                {/* Course Grid */}
                <div className="overflow-y-auto space-y-2 pr-1 flex-1">
                  {(
                    courseCategoryTab === 'cis' 
                      ? cisCoursesList 
                      : courseCategoryTab === 'russia'
                      ? russiaCoursesList
                      : courseCategoryTab === 'world'
                      ? worldCoursesList
                      : courseCategoryTab === 'easiest'
                      ? easiestCoursesList
                      : courseCategoryTab === 'hardest'
                      ? hardestCoursesList
                      : betaCoursesList
                  ).map(c => {
                    const isCurrent = currentCourse.id === c.id;
                    const isBeta = c.isBeta || isBetaWritingRestricted(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          playSound('select');
                          if (onSwitchCourse) onSwitchCourse(c);
                          setShowCoursePickerModal(false);
                        }}
                        className={`w-full p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-2 transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-duo-blue/20 border-duo-blue text-white'
                            : 'bg-gray-800/60 border-gray-700/60 hover:bg-gray-750 hover:border-gray-600 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <span className="text-2xl">{c.flagCode || '🌐'}</span>
                          <div className="text-left min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-black text-sm block text-white truncate">
                                {getCourseDisplayName(c)}
                              </span>
                              {c.betaVersion && (
                                <span className="font-mono text-[10px] text-purple-300 bg-purple-950/80 border border-purple-500/40 px-1.5 py-0.2 rounded shrink-0">
                                  {c.betaVersion}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 font-bold block truncate">
                              {c.name}
                            </span>
                            {isWritingSectionLocked(c.id) ? (
                              <div className="mt-1 text-[10px] text-rose-300 font-black bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <span>🔒</span>
                                <span className="truncate">Раздел Письмо Будут доступ 1 ноября 2026 год • 🔒 1 нояб.</span>
                              </div>
                            ) : isBeta ? (
                              <div className="mt-1 text-[9px] text-amber-300 font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <span>🔒</span>
                                <span className="truncate">В разработке • Доступно 1 ноября 2026 г.</span>
                              </div>
                            ) : null}
                            {c.id === 'tlh' && (
                              <div className="mt-1 text-[9px] text-emerald-300 font-bold flex items-center gap-1">
                                <span className="font-klingon text-xs">tlhIngan Hol</span>
                                <span>• Шрифт Klingon Font</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {isCurrent && (
                          <span className="w-3 h-3 rounded-full bg-duo-blue shadow-lg animate-pulse shrink-0 self-end sm:self-center" />
                        )}
                      </button>
                    );
                  })}
                </div>

              </div>
            </div>
          )}

          {/* Writing Lock Modal Dialog */}
          <LanguageLockModal
            isOpen={showBetaLockModal}
            onClose={() => setShowBetaLockModal(false)}
            selectedLang={currentCourse.id}
            userLanguage={user.language}
            isLightMode={isLightMode}
          />

        </div>
      )}

    </div>
  );
};
