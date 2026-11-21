import React, { useState } from 'react';
import { UserProgress, Course, Exercise, AppScreen, WordToken } from '../types';
import { Mascot } from './Mascot';
import { 
  VideoIcon, 
  ChatBubbleIcon, 
  VolumeIcon, 
  MicIcon, 
  BookIcon, 
  EarIcon, 
  PaletteIcon, 
  NewWordIcon,
  PenIcon,
  HeadphonesRadioIcon
} from './Icons';
import { DuoWindo6601StoriesModal } from './DuoWindo6601StoriesModal';
import { DuoWindo6601MistakesModal } from './DuoWindo6601MistakesModal';
import { DuoWindo6601PoemModal } from './DuoWindo6601PoemModal';
import { DuoWindo6601RadioModal } from './DuoWindo6601RadioModal';
import { ArabicNumeralsConverter } from './ArabicNumeralsConverter';

interface DuoWindo6601PracticeHubProps {
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  currentCourse: Course;
  startTraining: (type: Exercise['type'], topicOverride?: string) => Promise<void>;
  startVideoCall: (topic: string) => Promise<void>;
  setScreen: (screen: AppScreen) => void;
  playSound: (sound: any) => void;
  setToast: (msg: string) => void;
  customTopic: string;
  setCustomTopic: (topic: string) => void;
  setCurrentExercise: (ex: Exercise | null) => void;
  setAvailableTokens: (tokens: WordToken[]) => void;
  setSelectedWordIds: (ids: string[]) => void;
  setFeedback: (fb: any) => void;
  setExplanation: (exp: any) => void;
  setShowExplanationModal: (show: boolean) => void;
  speakText?: (text: string, courseId: string, slow?: boolean) => void;
  t: (key: string) => string;
}

export const DuoWindo6601PracticeHub: React.FC<DuoWindo6601PracticeHubProps> = ({
  user,
  setUser,
  currentCourse,
  startTraining,
  startVideoCall,
  setScreen,
  playSound,
  setToast,
  customTopic,
  setCustomTopic,
  setCurrentExercise,
  setAvailableTokens,
  setSelectedWordIds,
  setFeedback,
  setExplanation,
  setShowExplanationModal,
  speakText,
  t
}) => {
  const isRu = user.language === 'ru';
  const mistakeCount = user.mistakes?.length || 0;
  const learnedCount = user.learnedWords?.length || 0;

  const [isStoriesModalOpen, setIsStoriesModalOpen] = useState(false);
  const [isMistakesModalOpen, setIsMistakesModalOpen] = useState(false);
  const [isPoemModalOpen, setIsPoemModalOpen] = useState(false);
  const [isRadioModalOpen, setIsRadioModalOpen] = useState(false);
  const [isArabicConverterOpen, setIsArabicConverterOpen] = useState(false);

  // Safe TTS fallback
  const handleSpeak = (text: string, courseId: string, slow?: boolean) => {
    if (speakText) {
      return speakText(text, courseId, slow);
    }
  };

  // Handler: Unit Review (+20 XP) - "Тренировка"
  const handleUnitReview = () => {
    playSound('fanfare');
    const unitMsg = t('unitReviewToast') 
      ? t('unitReviewToast').replace('{unit}', String(user.currentUnit || 1))
      : (isRu ? `⚡ Повторение раздела ${user.currentUnit || 1}: +20 очков!` : `⚡ Unit ${user.currentUnit || 1} Review: +20 XP!`);
    setToast(unitMsg);
    startTraining('translation', `Раздел ${user.currentUnit || 1}: закрепление материала`);
  };

  // Handler: Mistakes practice
  const handlePracticeSingleMistake = (targetMistake: Exercise) => {
    playSound('click');
    setCurrentExercise(targetMistake);
    setAvailableTokens((targetMistake.wordBank || []).map(w => ({ id: crypto.randomUUID(), text: w })));
    setSelectedWordIds([]);
    setFeedback({ status: 'idle', message: '' });
    setExplanation(null);
    setShowExplanationModal(false);
    setScreen(AppScreen.LESSON);
    const toastMsg = t('mistakePracticeToast')
      ? t('mistakePracticeToast').replace('{text}', targetMistake.originalSentence)
      : (isRu ? `🔄 Исправление ошибки: ${targetMistake.originalSentence}` : `🔄 Reviewing mistake: ${targetMistake.originalSentence}`);
    setToast(toastMsg);
  };

  const handlePracticeAllMistakes = () => {
    playSound('click');
    if (mistakeCount > 0) {
      const targetMistake = user.mistakes[Math.floor(Math.random() * user.mistakes.length)];
      handlePracticeSingleMistake(targetMistake);
    } else {
      setToast(
        t('mistakesZero') || (isRu ? '🎉 Все ошибки исправлены! Запускаем быструю тренировку.' : '🎉 All mistakes corrected! Starting quick practice.')
      );
      startTraining('translation');
    }
  };

  // Handler: Words practice
  const handleWordsPractice = () => {
    playSound('click');
    setScreen(AppScreen.VOCABULARY);
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-16 animate-in fade-in select-none">
      
      {/* ============================================================== */}
      {/* 1. TOP DUOLINGO SKY BLUE BANNER: "ТРЕНИРОВКА"                   */}
      {/* ============================================================== */}
      <div className="bg-[#1cb0f6] rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden text-left mb-8 border-b-8 border-[#1899d6]">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 -mb-12 w-32 h-32 bg-sky-300/20 rounded-full blur-lg pointer-events-none" />

        {/* Header Title & Duo Mascot */}
        <div className="flex items-center justify-between relative z-10 mb-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
              {t('practiceTitle') || (isRu ? 'Тренировка' : 'Practice')}
            </h1>
            <p className="text-sky-100 font-extrabold text-xs md:text-sm mt-1 uppercase tracking-wider">
              {t('practiceSubtitle') || (isRu ? 'ЗАКРЕПЛЯЙТЕ ПРОЙДЕННОЕ И СТАВЬТЕ РЕКОРДЫ' : 'STRENGTHEN SKILLS & ACHIEVE DAILY GOALS')}
            </p>
          </div>

          {/* Duolingo workout owl mascot */}
          <div className="relative shrink-0 -mr-2 -mt-2">
            <Mascot emotion="happy" className="w-24 h-24 md:w-32 md:h-32 drop-shadow-xl" variant={currentCourse.mascotVariant} />
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full border-2 border-white shadow-lg uppercase tracking-wider">
              XP +20
            </div>
          </div>
        </div>

        {/* Embedded Dark Card: "Повторение раздела" */}
        <div className="bg-[#131f24] border-2 border-[#20343f] rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-2xl relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white font-black text-base md:text-lg">
              {t('unitReview') || (isRu ? 'Повторение раздела' : 'Unit Review')}
            </span>
            <span className="bg-sky-500/20 text-sky-300 border border-sky-400/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {t('unit') || (isRu ? 'Раздел' : 'Unit')} {user.currentUnit || 1}
            </span>
          </div>

          <button
            type="button"
            onClick={handleUnitReview}
            className="w-full py-4 bg-[#1cb0f6] hover:bg-[#189ddc] active:translate-y-1 active:border-b-0 border-b-4 border-[#1482b8] text-white font-black text-sm md:text-base uppercase tracking-wider rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 group"
          >
            <span>⚡</span>
            <span>{t('unitReviewAction') || (isRu ? 'НАЧАТЬ ТРЕНИРОВКУ: +20 ОЧКОВ' : 'START PRACTICE: +20 XP')}</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. SECTION: ОТРАБОТКА НАВЫКОВ (SKILL PRACTICE)                 */}
      {/* ============================================================== */}
      <div className="text-left space-y-3 mb-8">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 px-2 flex items-center justify-between">
          <span>{t('skillsPractice') || (isRu ? 'ОТРАБОТКА НАВЫКОВ' : 'SKILL PRACTICE')}</span>
          <span className="text-[10px] text-gray-500 font-bold">{currentCourse.localName}</span>
        </h3>

        <div className="space-y-3">
          {/* Row 1: Исправление ошибок */}
          <div
            onClick={() => {
              playSound('click');
              setIsMistakesModalOpen(true);
            }}
            className="bg-[#182328] hover:bg-[#202f36] border-2 border-[#263843] hover:border-amber-500/50 rounded-2xl md:rounded-3xl p-4 md:p-5 flex items-center justify-between transition-all cursor-pointer shadow-lg active:scale-[0.99] group"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h4 className="text-white font-black text-lg md:text-xl group-hover:text-amber-300 transition-colors">
                  {t('mistakesReview') || (isRu ? 'Исправление ошибок' : 'Mistakes Review')}
                </h4>
                {mistakeCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                    {mistakeCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-bold">
                {mistakeCount > 0 
                  ? (t('mistakesCount') ? t('mistakesCount').replace('{count}', String(mistakeCount)) : (isRu ? `${mistakeCount} неисправленных фраз • Нажмите для просмотра` : `${mistakeCount} mistakes to review • Tap to practice`))
                  : (t('mistakesZero') || (isRu ? 'Все ошибки исправлены! Отличная работа' : 'All mistakes resolved! Great work'))}
              </p>
            </div>

            {/* Circular Arrows Orange Icon */}
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#ff9600] flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-8 h-8 text-white stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>

          {/* Row 2: Слова */}
          <div
            onClick={handleWordsPractice}
            className="bg-[#182328] hover:bg-[#202f36] border-2 border-[#263843] hover:border-sky-500/50 rounded-2xl md:rounded-3xl p-4 md:p-5 flex items-center justify-between transition-all cursor-pointer shadow-lg active:scale-[0.99] group"
          >
            <div className="space-y-0.5">
              <h4 className="text-white font-black text-lg md:text-xl group-hover:text-sky-300 transition-colors">
                {t('wordsTitle') || (isRu ? 'Слова' : 'Words')}
              </h4>
              <p className="text-xs text-gray-400 font-bold">
                {t('wordsDesc') ? t('wordsDesc').replace('{count}', String(learnedCount)) : (isRu ? `${learnedCount} изученных слов в словаре • Карточки и тренировка` : `${learnedCount} learned words in vocabulary • Flashcards and review`)}
              </p>
            </div>

            {/* Blue Cards Icon with Stars */}
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-400 flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform text-white">
              <span className="text-2xl">🗂️</span>
            </div>
          </div>

          {/* Row 3: Аудирование */}
          <div
            onClick={() => startTraining('listening')}
            className="bg-[#182328] hover:bg-[#202f36] border-2 border-[#263843] hover:border-rose-500/50 rounded-2xl md:rounded-3xl p-4 md:p-5 flex items-center justify-between transition-all cursor-pointer shadow-lg active:scale-[0.99] group"
          >
            <div className="space-y-0.5">
              <h4 className="text-white font-black text-lg md:text-xl group-hover:text-rose-300 transition-colors">
                {t('listeningTitle') || (isRu ? 'Аудирование' : 'Listening')}
              </h4>
              <p className="text-xs text-gray-400 font-bold">
                {t('listeningDesc') || (isRu ? 'Что вы услышали? Тренируйте восприятие речи на слух' : 'What did you hear? Practice listening comprehension')}
              </p>
            </div>

            {/* Coral Headphones Icon */}
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#ff4b4b] flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform text-white">
              <span className="text-2xl">🎧</span>
            </div>
          </div>

          {/* Row 4: Речь (скрыто только для курса Клингонского — сохранено для всех остальных языков) */}
          {currentCourse.id !== 'tlh' && (
            <div
              onClick={() => startTraining('speech')}
              className="bg-[#182328] hover:bg-[#202f36] border-2 border-[#263843] hover:border-emerald-500/50 rounded-2xl md:rounded-3xl p-4 md:p-5 flex items-center justify-between transition-all cursor-pointer shadow-lg active:scale-[0.99] group"
            >
              <div className="space-y-0.5">
                <h4 className="text-white font-black text-lg md:text-xl group-hover:text-emerald-300 transition-colors">
                  {t('speakingTitle') || (isRu ? 'Речь' : 'Speaking')}
                </h4>
                <p className="text-xs text-gray-400 font-bold">
                  {t('speakingDesc') || (isRu ? 'Говорите за DuoWindo6601 • Отрабатывайте чистое произношение' : 'Speak for DuoWindo6601 • Master pure pronunciation')}
                </p>
              </div>

              {/* Mint Green Microphone Icon */}
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#20e3b2] flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform text-slate-950">
                <span className="text-2xl">🎙️</span>
              </div>
            </div>
          )}

          {/* Row 5: Выучить стихотворение наизусть */}
          <div
            onClick={() => {
              playSound('click');
              setIsPoemModalOpen(true);
            }}
            className="bg-gradient-to-r from-[#182328] via-[#241c30] to-[#182328] hover:bg-[#202f36] border-2 border-purple-500/40 hover:border-purple-400 rounded-2xl md:rounded-3xl p-4 md:p-5 flex items-center justify-between transition-all cursor-pointer shadow-lg active:scale-[0.99] group"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h4 className="text-white font-black text-lg md:text-xl group-hover:text-purple-300 transition-colors">
                  {t('poemTitle') || (isRu ? 'Выучить стихотворение наизусть' : 'Memorize Poem by Heart')}
                </h4>
                <span className="bg-purple-500 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-sm">
                  {(user.learnedPoems || []).length > 0 ? `${user.learnedPoems?.length} выучено` : '+35 XP'}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-bold">
                {t('poemDesc') || (isRu 
                  ? 'Поэтический тренажёр • Метод исчезающих слов, ритм, озвучка и проверка наизусть' 
                  : 'Poetry trainer • Vanishing words, rhythm, audio reciting and memory test')}
              </p>
            </div>

            {/* Purple Scroll & Quill Icon */}
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform text-white">
              <span className="text-2xl">📜</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. SECTION: КОЛЛЕКЦИИ (ИСТОРИИ)                                 */}
      {/* ============================================================== */}
      <div className="text-left space-y-3 mb-10">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 px-2 flex items-center justify-between">
          <span>{t('storiesTitle') || (isRu ? 'КОЛЛЕКЦИИ ИСТОРИЙ' : 'STORY COLLECTIONS')}</span>
          <span className="text-[10px] text-purple-400 font-black">+25 XP ZA STORY</span>
        </h3>

        <div
          onClick={() => {
            playSound('click');
            setIsStoriesModalOpen(true);
          }}
          className="bg-gradient-to-r from-[#182328] via-[#221c32] to-[#182328] hover:bg-[#202f36] border-2 border-purple-500/40 hover:border-purple-400 rounded-2xl md:rounded-3xl p-4 md:p-5 flex items-center justify-between transition-all cursor-pointer shadow-xl active:scale-[0.99] group"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-white font-black text-lg md:text-xl group-hover:text-purple-300 transition-colors">
                {t('storiesTitle') || (isRu ? 'Истории (Stories)' : 'Stories')}
              </h4>
            </div>
            <p className="text-xs text-gray-300 font-bold">
              {t('storiesDesc') || (isRu 
                ? 'Интерактивные сюжетные диалоги с озвучкой реплик и вопросами на понимание' 
                : 'Interactive story dialogues with voice playback and comprehension questions')}
            </p>
          </div>

          {/* Lilac Open Book Icon */}
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-400 flex items-center justify-center shadow-lg shrink-0 group-hover:scale-105 transition-transform text-white">
            <span className="text-2xl">📖</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. SECTION: ВСЕ 10 РЕЖИМОВ DUOWINDO6601 (СОХРАНЕНЫ НЕ ТРОНУТЫМИ) */}
      {/* ============================================================== */}
      <div className="text-left space-y-4 pt-6 border-t-2 border-gray-800">
        <div className="flex items-center justify-between px-2">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>🚀</span>
              <span>{t('duowindoModes') || (isRu ? 'РЕЖИМЫ DUOWINDO6601' : 'DUOWINDO6601 MODES')}</span>
            </h3>
            <p className="text-[11px] text-gray-400 font-bold">
              {t('duowindoModesDesc') || (isRu ? 'Все специальные AI и интерактивные форматы обучения сохранены' : 'All special AI & interactive learning formats preserved intact')}
            </p>
          </div>
          <span className="bg-sky-500/20 text-sky-400 border border-sky-400/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
            Original DuoWindo6601
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* 0. Конвертер (0-99) и Справочник арабских цифр (Доступ строго в Курсе Арабской) */}
          {(() => {
            const isArabicCourse = currentCourse.id === 'ar' || currentCourse.name.toLowerCase().includes('arabic') || (currentCourse.localName && currentCourse.localName.toLowerCase().includes('араб'));
            return (
              <div 
                onClick={() => {
                  playSound('click');
                  if (isArabicCourse) {
                    setIsArabicConverterOpen(true);
                  } else {
                    setToast(
                      isRu 
                        ? '🔒 Функция «Конвертер и Справочник арабских цифр» доступна только в Курсе Арабской (🇸🇦)!' 
                        : '🔒 "Arabic Numerals Converter & Handbook" is strictly available only in the Arabic Course (🇸🇦)!'
                    );
                  }
                }} 
                className={`md:col-span-2 p-5 md:p-6 rounded-[2.5rem] border-2 text-left transition-all flex flex-col sm:flex-row items-center justify-between shadow-2xl group cursor-pointer relative overflow-hidden ${
                  isArabicCourse 
                    ? 'bg-gradient-to-r from-emerald-900/90 via-[#18232c] to-purple-950/90 border-emerald-500/50 hover:border-emerald-400 hover:brightness-110 active:translate-y-1' 
                    : 'bg-gradient-to-r from-gray-900/95 via-[#18232c] to-amber-950/90 border-amber-500/40 opacity-85 hover:border-amber-400'
                }`}
              >
                <div className="flex items-center space-x-4 relative z-10 w-full sm:w-auto">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-xl group-hover:scale-105 transition-transform shrink-0 ${
                    isArabicCourse 
                      ? 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-500' 
                      : 'bg-gradient-to-tr from-amber-600 via-orange-600 to-gray-700'
                  }`}>
                    <span className="text-3xl font-black">{isArabicCourse ? '🔢' : '🔒'}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl md:text-2xl font-black text-white">
                        {t('arabicHandbook')}
                      </h3>
                      {isArabicCourse ? (
                        <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          ЗАПАДНЫЕ 0-99 • ВОСТОЧНЫЕ ٠-٩٩
                        </span>
                      ) : (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                          <span>🔒</span>
                          <span>{t('lockedBtn')}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-emerald-200/90 font-bold leading-relaxed">
                      {t('arabicHandbookDesc')}
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[10px] font-black text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-md">
                        ✍️ DuoWindo6601
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 sm:mt-0 flex items-center space-x-2 shrink-0">
                  <span className="px-3 py-1.5 rounded-xl bg-white/10 text-white font-mono font-bold text-xs border border-white/15">
                    25 / ٢٥  •  50 / ٥٠  •  99 / ٩٩
                  </span>
                  {isArabicCourse ? (
                    <span className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md">
                      {t('openBtn')}
                    </span>
                  ) : (
                    <span className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-1">
                      <span>🔒</span>
                      <span>{t('lockedBtn')}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 1. ВидеоЗвонок (Живое общение с AI партнером) */}
          <button 
            type="button"
            onClick={() => startVideoCall(t('videoCall'))} 
            className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 p-6 md:p-8 rounded-[2.5rem] border-b-8 border-purple-900 text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center justify-between shadow-2xl group relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest animate-pulse border border-white/20">
              NEW DuoWindo6601
            </div>
            <div className="flex items-center space-x-5 relative z-10">
              <div className="bg-white/20 p-4 rounded-3xl group-hover:scale-110 transition-transform">
                <VideoIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-2xl md:text-3xl font-black text-white">{t('videoCall')}</h3>
                </div>
                <p className="opacity-90 font-bold text-xs md:text-sm text-purple-200">
                  {t('videoCallDesc')}
                </p>
              </div>
            </div>
          </button>

          {/* 2. Roleplays MAX (Начни говорить →) */}
          <button 
            type="button"
            onClick={() => startTraining('roleplay')} 
            className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 md:p-8 rounded-[2.5rem] border-b-8 border-purple-800 text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center justify-between shadow-2xl group cursor-pointer"
          >
            <div className="flex items-center space-x-5">
              <div className="bg-white/20 p-4 rounded-3xl group-hover:rotate-6 transition-transform">
                <ChatBubbleIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-2xl md:text-3xl font-black text-white">{t('roleplays')}</h3>
                  {user.subscription === 'max' && <span className="bg-black text-duo-blue text-[10px] px-2 py-0.5 rounded font-black border border-duo-blue">MAX</span>}
                </div>
                <p className="opacity-90 font-bold text-xs md:text-sm text-white/80">{t('startSpeak')}</p>
              </div>
            </div>
            <Mascot emotion="happy" className="w-20 h-20 hidden sm:block" variant={currentCourse.mascotVariant} />
          </button>

          {/* 3. Аудио (Что вы услышали?) */}
          <button 
            type="button"
            onClick={() => startTraining('listening')} 
            className="bg-duo-blue p-8 md:p-10 rounded-[2.5rem] border-b-8 border-blue-800 text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center space-x-6 shadow-2xl cursor-pointer"
          >
            <div className="bg-white/20 p-4 md:p-5 rounded-3xl">
              <VolumeIcon className="w-12 h-12 text-white" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-1 text-white">{t('audio')}</h3>
              <p className="opacity-80 font-bold uppercase tracking-widest text-xs text-white">{t('whatHeard')}</p>
            </div>
          </button>

          {/* 4. Речь (Говори за DuoWindo6601) — скрыто только для клингонского (tlh) */}
          {currentCourse.id !== 'tlh' && (
            <button 
              type="button"
              onClick={() => startTraining('speech')} 
              className="bg-duo-orange p-8 md:p-10 rounded-[2.5rem] border-b-8 border-orange-700 text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center space-x-6 shadow-2xl cursor-pointer"
            >
              <div className="bg-white/20 p-4 md:p-5 rounded-3xl">
                <MicIcon className="w-12 h-12 text-white" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold mb-1 text-white">{t('speech')}</h3>
                <p className="opacity-80 font-bold uppercase tracking-widest text-xs text-white">{t('speakForDuo')}</p>
              </div>
            </button>
          )}

          {/* 5. Перевод (Практика чтения) */}
          <button 
            type="button"
            onClick={() => startTraining('translation')} 
            className="bg-duo-green p-8 md:p-10 rounded-[2.5rem] border-b-8 border-duo-greenDark text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center space-x-6 shadow-2xl cursor-pointer"
          >
            <div className="bg-white/20 p-4 md:p-5 rounded-3xl">
              <BookIcon className="w-12 h-12 text-white" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-1 text-white">{t('translate')}</h3>
              <p className="opacity-80 font-bold uppercase tracking-widest text-xs text-white">{t('readPractice')}</p>
            </div>
          </button>

          {/* 6. Практика (Истории и Письмо) */}
          <button 
            type="button"
            onClick={() => startTraining('reading')} 
            className="bg-teal-500 p-8 md:p-10 rounded-[2.5rem] border-b-8 border-teal-700 text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center space-x-6 shadow-2xl cursor-pointer"
          >
            <div className="bg-white/20 p-4 md:p-5 rounded-3xl">
              <BookIcon className="w-12 h-12 text-white" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-1 text-white">{t('practice')}</h3>
              <p className="opacity-80 font-bold uppercase tracking-widest text-xs text-white">{t('storiesAndWriting')}</p>
            </div>
          </button>

          {/* 7. Переводчик (AI и Словари без интернета) */}
          <button 
            type="button"
            onClick={() => setScreen(AppScreen.TRANSLATOR)} 
            className="bg-gradient-to-r from-sky-700 to-indigo-800 p-8 md:p-10 rounded-[2.5rem] border-b-8 border-indigo-950 text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center justify-between shadow-2xl cursor-pointer relative overflow-hidden group"
          >
            <div className="flex items-center space-x-6">
              <div className="bg-white/20 p-4 md:p-5 rounded-3xl group-hover:scale-105 transition-transform">
                <BookIcon className="w-12 h-12 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-2xl md:text-3xl font-bold text-white">{t('translator')}</h3>
                  <span className="bg-emerald-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {t('offlineDictTitle')}
                  </span>
                </div>
                <p className="opacity-90 font-bold uppercase tracking-widest text-xs text-sky-200 mt-0.5">
                  {t('offlineDictDesc')}
                </p>
              </div>
            </div>
            <span className="text-2xl hidden sm:inline group-hover:translate-x-1 transition-transform">⇄</span>
          </button>

          {/* 8. Звуковая Иллюзия (Что реально, а что нет?) */}
          <button 
            type="button"
            onClick={() => startTraining('illusion')} 
            className="bg-indigo-600 p-8 md:p-10 rounded-[2.5rem] border-b-8 border-indigo-800 text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center space-x-6 shadow-2xl cursor-pointer"
          >
            <div className="bg-white/20 p-4 md:p-5 rounded-3xl">
              <EarIcon className="w-12 h-12 text-white" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-1 text-white">{t('illusion')}</h3>
              <p className="opacity-80 font-bold uppercase tracking-widest text-xs text-white">{t('realOrNot')}</p>
            </div>
          </button>

          {/* 9. Нарисовать буквы (Практика письма) */}
          <button 
            type="button"
            onClick={() => startTraining('drawing')} 
            className="bg-pink-600 p-8 md:p-10 rounded-[2.5rem] border-b-8 border-pink-800 text-left hover:brightness-110 active:translate-y-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl cursor-pointer md:col-span-2 group relative overflow-hidden"
          >
            <div className="flex items-center space-x-6">
              <div className="bg-white/20 p-4 md:p-5 rounded-3xl shrink-0 group-hover:scale-105 transition-transform">
                <PenIcon className="w-12 h-12 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-2xl md:text-3xl font-black text-white">{t('drawing')}</h3>
                  <span className="bg-amber-400 text-slate-950 text-[10px] md:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <span>🔒</span>
                    <span>{isRu ? 'В разработке • Доступно 1 ноября 2026 г.' : 'In Development • Available Nov 1, 2026'}</span>
                  </span>
                </div>
                <p className="font-bold text-xs md:text-sm text-pink-100">
                  {isRu 
                    ? 'Переключение на эти языки и раздел «Письмо» откроются 1 ноября 2026 года' 
                    : 'Switching to these languages and "Writing" section will unlock on November 1, 2026'}
                </p>
                <p className="opacity-80 font-bold uppercase tracking-widest text-[11px] text-white/90">
                  {t('writePractice')} • DuoWindo6601
                </p>
              </div>
            </div>
            <div className="bg-pink-800/80 border border-pink-400/30 px-3.5 py-2 rounded-2xl text-white font-black text-xs uppercase tracking-wider self-start sm:self-center shrink-0 flex items-center space-x-1.5 shadow-md">
              <span>✍️</span>
              <span>1 нояб. 2026</span>
            </div>
          </button>

          {/* 10. Тест Ишихары (Проверка цветовосприятия) */}
          <button 
            type="button"
            onClick={() => startTraining('ishihara')} 
            className="bg-teal-600 p-8 md:p-10 rounded-[2.5rem] border-b-8 border-teal-800 text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center space-x-6 shadow-2xl cursor-pointer"
          >
            <div className="bg-white/20 p-4 md:p-5 rounded-3xl">
              <PaletteIcon className="w-12 h-12 text-white" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-1 text-white">{t('ishihara')}</h3>
              <p className="opacity-80 font-bold uppercase tracking-widest text-xs text-white">{t('ishiharaDesc')}</p>
            </div>
          </button>

          {/* 11. Выучить стихотворение наизусть (Поэтический тренажёр) */}
          <button 
            type="button"
            onClick={() => {
              playSound('click');
              setIsPoemModalOpen(true);
            }} 
            className="bg-gradient-to-r from-purple-800 via-indigo-850 to-slate-900 p-8 md:p-10 rounded-[2.5rem] border-b-8 border-purple-950 text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center justify-between shadow-2xl cursor-pointer md:col-span-2 group"
          >
            <div className="flex items-center space-x-6">
              <div className="bg-white/20 p-4 md:p-5 rounded-3xl group-hover:rotate-6 transition-transform">
                <span className="text-3xl md:text-4xl">📜</span>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-2xl md:text-3xl font-black text-white">
                    {t('poemTitle')}
                  </h3>
                  <span className="bg-purple-950 text-purple-300 text-[10px] px-2.5 py-0.5 rounded-md font-black border border-purple-400 uppercase">
                    NEW DUOWINDO6601
                  </span>
                </div>
                <p className="opacity-90 font-bold text-xs md:text-sm text-purple-200">
                  {t('poemDesc')}
                </p>
              </div>
            </div>
            <div className="bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl uppercase tracking-wider shrink-0 hidden sm:flex items-center gap-1 shadow-md">
              <span>⚡</span>
              <span>+35 XP</span>
            </div>
          </button>
          {/* 11b. DuoWindo6601Radio — Подкасты на аудирование */}
          <button
            type="button"
            onClick={() => {
              playSound('click');
              setIsRadioModalOpen(true);
            }}
            className="bg-gradient-to-r from-[#2D9EE0] to-[#1A78B8] p-8 md:p-10 rounded-[2.5rem] border-b-8 border-[#125688] text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center justify-between shadow-2xl cursor-pointer md:col-span-2 group"
          >
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-b from-[#66DBFF] to-[#42C6FA] border-b-4 border-[#1B89C2] flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                <HeadphonesRadioIcon className="w-11 h-11 md:w-12 md:h-12" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1 flex-wrap">
                  <h3 className="text-2xl md:text-3xl font-black text-white">
                    DuoWindo6601Radio
                  </h3>
                  <span className="bg-sky-950 text-sky-200 text-[10px] px-2.5 py-0.5 rounded-md font-black border border-sky-300/40 uppercase">
                    {isRu ? 'ПОДКАСТЫ' : 'PODCASTS'}
                  </span>
                </div>
                <p className="opacity-95 font-bold text-xs md:text-sm text-sky-100">
                  {isRu
                    ? 'Короткие выпуски подкастов с DuoWindo6601, погружение в речь и проверка понимания'
                    : 'Short podcast episodes with DuoWindo6601, speech immersion, and comprehension checks'}
                </p>
              </div>
            </div>
            <div className="bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl uppercase tracking-wider shrink-0 hidden sm:flex items-center gap-1 shadow-md">
              <span>🎧</span>
              <span>+30 XP</span>
            </div>
          </button>
        </div>

        {/* 12. Своя тема генерации задач */}
        <div className="bg-duo-card border-2 border-gray-700 rounded-[2.5rem] p-6 md:p-8 mt-4 shadow-xl text-left">
          <h3 className="text-xl font-bold mb-4 flex items-center text-white">
            <NewWordIcon className="w-6 h-6 mr-2 text-duo-blue" />
            {t('topicPrompt')}
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              value={customTopic} 
              onChange={(e) => setCustomTopic(e.target.value)} 
              placeholder={t('topicPlaceholder')} 
              className="flex-1 bg-duo-dark border-2 border-gray-600 rounded-2xl px-6 py-4 font-bold text-white placeholder-gray-500 focus:border-duo-blue focus:outline-none transition-colors" 
            />
            <button 
              type="button"
              onClick={() => { 
                if (customTopic.trim() === "") { 
                  setToast(t('t_topic_empty')); 
                } 
                startTraining('translation', customTopic); 
              }} 
              className="bg-duo-blue border-b-4 border-duo-blueDark rounded-2xl px-8 py-4 font-bold uppercase tracking-widest hover:brightness-110 active:translate-y-1 active:border-b-0 transition-all text-white cursor-pointer"
            >
              {t('start')}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. INTERACTIVE MODALS                                           */}
      {/* ============================================================== */}
      <DuoWindo6601StoriesModal
        isOpen={isStoriesModalOpen}
        onClose={() => setIsStoriesModalOpen(false)}
        currentCourse={currentCourse}
        user={user}
        setUser={setUser}
        playSound={playSound}
        setToast={setToast}
        speakText={handleSpeak}
      />

      <DuoWindo6601MistakesModal
        isOpen={isMistakesModalOpen}
        onClose={() => setIsMistakesModalOpen(false)}
        user={user}
        setUser={setUser}
        currentCourse={currentCourse}
        playSound={playSound}
        setToast={setToast}
        speakText={handleSpeak}
        onPracticeMistake={handlePracticeSingleMistake}
        onPracticeAllMistakes={handlePracticeAllMistakes}
      />

      <DuoWindo6601PoemModal
        isOpen={isPoemModalOpen}
        onClose={() => setIsPoemModalOpen(false)}
        currentCourse={currentCourse}
        user={user}
        setUser={setUser}
        playSound={playSound}
        setToast={setToast}
        speakText={handleSpeak}
      />

      <DuoWindo6601RadioModal
        isOpen={isRadioModalOpen}
        onClose={() => setIsRadioModalOpen(false)}
        currentCourse={currentCourse}
        user={user}
        setUser={setUser}
        playSound={playSound}
        setToast={setToast}
        speakText={handleSpeak}
      />

      {/* Modal for Arabic Numerals Converter (0-99) & Handbook */}
      {isArabicConverterOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md overflow-y-auto flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl animate-in zoom-in-95 my-8">
            <button
              onClick={() => setIsArabicConverterOpen(false)}
              className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-red-600 rounded-full text-white transition-colors z-50 shadow-lg cursor-pointer"
              title="Закрыть"
            >
              ✕
            </button>
            <ArabicNumeralsConverter
              speakText={handleSpeak}
              preferredVoice={user.preferredVoice}
              voiceProvider={user.voiceProvider}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const DuolingoPracticeHub = DuoWindo6601PracticeHub;
