import React, { useState, useMemo } from 'react';
import { Course, UserProgress } from '../types';
import { VolumeIcon, CloseIcon, SparklesIcon, CheckCircleIcon } from './Icons';
import { 
  getCourseLetterWords, 
  LetterWordItem, 
  generateWordExercise, 
  WordQuizExercise 
} from '../services/wordsLearningService';
import { playSound, triggerHapticFeedback } from '../services/audioService';
import { tlhToPIqaD } from '../services/klingonDictionaryService';
import { downloadKlingonAudioFile } from '../services/klingonSpeechService';

interface LetterWordsLearningProps {
  currentCourse: Course;
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  onSaveProgress?: (updatedUser: UserProgress) => void;
  speakText: (text: string, lang?: string, isSlow?: boolean, voice?: string, provider?: string) => void;
  isLightMode?: boolean;
}

export const LetterWordsLearning: React.FC<LetterWordsLearningProps> = ({
  currentCourse,
  user,
  setUser,
  onSaveProgress,
  speakText,
  isLightMode = false,
}) => {
  const isRu = (user.language || 'ru') !== 'en';
  const isKlingon = currentCourse.id === 'tlh';
  const difficultyLevel: 'easy' | 'hard' = user.difficultyLevel === 'hard' ? 'hard' : 'easy';
  const words = useMemo(() => getCourseLetterWords(currentCourse.id), [currentCourse.id]);
  const [selectedWord, setSelectedWord] = useState<LetterWordItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuizExercise, setActiveQuizExercise] = useState<WordQuizExercise | null>(null);
  const [assembledLetters, setAssembledLetters] = useState<{ id: string; letter: string }[]>([]);
  const [quizFeedback, setQuizFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) return words;
    const q = searchQuery.trim().toLowerCase();
    return words.filter(w => 
      w.word.toLowerCase().includes(q) || 
      w.char.toLowerCase().includes(q) || 
      w.translationRu.toLowerCase().includes(q) || 
      w.translationEn.toLowerCase().includes(q)
    );
  }, [words, searchQuery]);

  const handlePlayAudio = (text: string, isSlow: boolean = false, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playSound('click');
    speakText(text, currentCourse.id, isSlow, user.preferredVoice, user.voiceProvider);
  };

  const handleSwitchDifficulty = (level: 'easy' | 'hard') => {
    playSound('select');
    const updatedUser: UserProgress = { ...user, difficultyLevel: level };
    setUser(updatedUser);
    if (onSaveProgress) onSaveProgress(updatedUser);
  };

  const startWordQuiz = (specificWord?: LetterWordItem) => {
    playSound('select');
    const ex = generateWordExercise(currentCourse.id, specificWord, difficultyLevel);
    setActiveQuizExercise(ex);
    setAssembledLetters([]);
    setQuizFeedback('idle');
    setSelectedOptionId(null);
  };

  const handleTileClick = (tile: { id: string; letter: string }) => {
    playSound('click');
    setAssembledLetters(prev => [...prev, tile]);
  };

  const handleRemoveTile = (index: number) => {
    playSound('click');
    setAssembledLetters(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleCheckAssembledWord = () => {
    if (!activeQuizExercise) return;
    const currentStr = assembledLetters.map(t => t.letter).join('').toLowerCase();
    const targetStr = activeQuizExercise.targetWord.word.toLowerCase();

    const xpReward = difficultyLevel === 'hard' ? 40 : 25;
    if (currentStr === targetStr) {
      playSound('correct');
      triggerHapticFeedback('correct');
      setQuizFeedback('correct');
      const updatedUser = { ...user, xp: user.xp + xpReward };
      setUser(updatedUser);
      if (onSaveProgress) onSaveProgress(updatedUser);
    } else {
      playSound('wrong');
      triggerHapticFeedback('wrong');
      setQuizFeedback('wrong');
    }
  };

  const handleCheckOption = (opt: { id: string; text: string; isCorrect: boolean }) => {
    setSelectedOptionId(opt.id);
    const xpReward = difficultyLevel === 'hard' ? 35 : 20;
    if (opt.isCorrect) {
      playSound('correct');
      triggerHapticFeedback('correct');
      setQuizFeedback('correct');
      const updatedUser = { ...user, xp: user.xp + xpReward };
      setUser(updatedUser);
      if (onSaveProgress) onSaveProgress(updatedUser);
    } else {
      playSound('wrong');
      triggerHapticFeedback('wrong');
      setQuizFeedback('wrong');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/70 via-gray-900 to-teal-950/70 border-2 border-emerald-500/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-3xl shadow-inner shrink-0">
            📖
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isRu ? 'Изучение слов (не только буквы)' : 'Learn Words (Beyond Letters)'}
              </h2>
              <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                {isRu ? 'Словарь курса' : 'Course Vocabulary'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 font-medium mt-1">
              {isRu
                ? `Осваивайте целые аутентичные слова на каждую букву курса «${currentCourse.localName || currentCourse.name}» с произношением и переводом.`
                : `Master full authentic words for each letter of ${currentCourse.name} with real pronunciation and meaning.`}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <div className="flex items-center bg-black/50 border border-gray-700 rounded-2xl p-1 gap-1">
            <button
              type="button"
              onClick={() => handleSwitchDifficulty('easy')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                difficultyLevel === 'easy' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-gray-300 hover:text-white'
              }`}
            >
              🌱 {isRu ? 'Лёгкий' : 'Easy'}
            </button>
            <button
              type="button"
              onClick={() => handleSwitchDifficulty('hard')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                difficultyLevel === 'hard' ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow' : 'text-gray-300 hover:text-white'
              }`}
            >
              🔥 {isRu ? 'Сложный' : 'Hard'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => startWordQuiz()}
            className="px-6 py-3.5 bg-duo-green hover:brightness-110 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl border-b-4 border-duo-greenDark shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <SparklesIcon className="w-4 h-4 text-amber-300" />
            <span>{isRu ? `Тренировка слов (+${difficultyLevel === 'hard' ? 40 : 25} XP)` : `Practice Words (+${difficultyLevel === 'hard' ? 40 : 25} XP)`}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRu ? 'Поиск слова, буквы или перевода...' : 'Search word, letter, or translation...'}
            className="w-full py-2.5 pl-10 pr-4 bg-[#182329] border border-gray-700 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <span className="text-xs font-bold text-gray-400">
          {isRu ? `Слов: ${filteredWords.length}` : `Words: ${filteredWords.length}`}
        </span>
      </div>

      {/* Words Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {filteredWords.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              setSelectedWord(item);
              handlePlayAudio(item.word);
            }}
            className="group p-4 bg-[#182329] hover:bg-[#1E2B33] border-2 border-gray-800 hover:border-emerald-500/60 rounded-3xl transition-all duration-200 cursor-pointer shadow-md flex flex-col justify-between text-left relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-lg flex items-center justify-center shrink-0">
                {item.char}
              </div>
              <button
                type="button"
                onClick={(e) => handlePlayAudio(item.word, false, e)}
                className="p-2 rounded-xl bg-gray-800 hover:bg-emerald-600 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title={isRu ? 'Прослушать' : 'Listen'}
              >
                <VolumeIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-1">
              <h3 className={`text-lg font-black text-white group-hover:text-emerald-300 transition-colors ${isKlingon ? 'font-klingon' : ''}`}>
                {item.word}
              </h3>
              {isKlingon && (
                <div className="font-piqad text-sm text-purple-300">
                  {tlhToPIqaD(item.word)}
                </div>
              )}
              {item.translit && item.translit !== item.word && (
                <div className="text-[11px] font-mono text-gray-400">
                  [{item.translit}]
                </div>
              )}
              <p className="text-xs font-bold text-gray-300">
                {isRu ? item.translationRu : item.translationEn}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-400 font-bold">
              <span>{item.lettersBreakdown.length} {isRu ? 'букв' : 'letters'}</span>
              <span className="text-emerald-400 group-hover:underline">
                {isRu ? 'Учить слово →' : 'Learn word →'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Word Detail Modal */}
      {selectedWord && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#182329] border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-left space-y-5">
            <button
              onClick={() => setSelectedWord(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl bg-gray-800 hover:bg-gray-700 cursor-pointer"
            >
              <CloseIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl font-black text-emerald-300 shadow-lg shrink-0">
                {selectedWord.char}
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400">
                  {isRu ? `Слово на букву «${selectedWord.char}»` : `Word on letter "${selectedWord.char}"`}
                </span>
                <h3 className={`text-2xl font-black text-white ${isKlingon ? 'font-klingon' : ''}`}>
                  {selectedWord.word}
                </h3>
                {isKlingon && (
                  <p className="font-piqad text-base text-purple-300">{tlhToPIqaD(selectedWord.word)}</p>
                )}
                <p className="text-xs text-gray-300 font-bold">
                  {isRu ? selectedWord.translationRu : selectedWord.translationEn}
                </p>
              </div>
            </div>

            {/* Letter Breakdown */}
            <div className="bg-black/50 border border-gray-800 rounded-2xl p-4 space-y-2">
              <span className="text-[11px] font-black uppercase text-gray-400 block">
                {isRu ? 'Состав слова по буквам:' : 'Letter composition:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedWord.lettersBreakdown.map((ltr, idx) => (
                  <span
                    key={idx}
                    className={`min-w-8 h-8 px-2 rounded-xl bg-gray-800 border border-gray-700 text-white font-black text-sm flex items-center justify-center shadow-sm ${isKlingon ? 'font-klingon' : ''}`}
                  >
                    {ltr}
                  </span>
                ))}
              </div>
            </div>

            {/* Audio Controls */}
            <div className={`grid ${isKlingon ? 'grid-cols-3' : 'grid-cols-2'} gap-2.5`}>
              <button
                type="button"
                onClick={() => handlePlayAudio(selectedWord.word, false)}
                className="py-3 px-3 bg-duo-blue hover:brightness-110 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <VolumeIcon className="w-4 h-4" />
                <span>{isRu ? 'Обычн.' : 'Normal'}</span>
              </button>
              <button
                type="button"
                onClick={() => handlePlayAudio(selectedWord.word, true)}
                className="py-3 px-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-black text-xs uppercase tracking-wider rounded-2xl border border-gray-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>🐢</span>
                <span>{isRu ? 'Медл.' : 'Slow'}</span>
              </button>
              {isKlingon && (
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    void downloadKlingonAudioFile(selectedWord.word);
                  }}
                  className="py-3 px-3 bg-emerald-950/80 hover:bg-emerald-800 text-emerald-200 font-black text-xs uppercase tracking-wider rounded-2xl border border-emerald-500/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>💾</span>
                  <span>{isRu ? 'Файл' : 'File'}</span>
                </button>
              )}
            </div>

            {/* Start Practice button */}
            <button
              type="button"
              onClick={() => {
                const target = selectedWord;
                setSelectedWord(null);
                startWordQuiz(target);
              }}
              className="w-full py-3.5 bg-duo-green hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-2xl border-b-4 border-duo-greenDark active:border-b-0 active:translate-y-1 shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>✏️</span>
              <span>{isRu ? 'Собрать это слово по буквам' : 'Assemble this word'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Word Quiz Modal */}
      {activeQuizExercise && (
        <div className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#182329] border-2 border-emerald-500/70 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative text-left space-y-5">
            <button
              onClick={() => setActiveQuizExercise(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl bg-gray-800 hover:bg-gray-700 cursor-pointer"
            >
              <CloseIcon className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400">
                {isRu ? 'Интерактивная тренировка слов' : 'Interactive Word Training'}
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                {isRu ? activeQuizExercise.promptRu : activeQuizExercise.promptEn}
              </h3>
            </div>

            {/* Audio Prompt button */}
            <div className="flex items-center justify-center py-2">
              <button
                type="button"
                onClick={() => handlePlayAudio(activeQuizExercise.targetWord.word)}
                className="w-16 h-16 rounded-2xl bg-duo-blue hover:brightness-110 active:scale-95 text-white flex items-center justify-center shadow-lg transition-transform cursor-pointer"
              >
                <VolumeIcon className="w-8 h-8" />
              </button>
            </div>

            {/* Type 1: Assemble Word from letters */}
            {activeQuizExercise.type === 'assemble_word' && (
              <div className="space-y-4">
                {/* Assembled Slots */}
                <div className="min-h-14 p-2.5 bg-black/60 border-2 border-dashed border-gray-700 rounded-2xl flex flex-wrap items-center justify-center gap-1.5">
                  {assembledLetters.length === 0 ? (
                    <span className="text-xs text-gray-500 font-bold">
                      {isRu ? 'Нажимайте буквы снизу, чтобы составить слово' : 'Click letter tiles below to form word'}
                    </span>
                  ) : (
                    assembledLetters.map((t, idx) => (
                      <button
                        key={`${t.id}_${idx}`}
                        type="button"
                        onClick={() => handleRemoveTile(idx)}
                        className={`min-w-10 h-10 px-2 rounded-xl bg-duo-green text-white font-black text-base flex items-center justify-center shadow-md cursor-pointer hover:bg-red-500 transition-colors ${isKlingon ? 'font-klingon' : ''}`}
                        title={isRu ? 'Удалить букву' : 'Remove letter'}
                      >
                        {t.letter}
                      </button>
                    ))
                  )}
                </div>

                {/* Scrambled Available Tiles */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {(activeQuizExercise.scrambledLetters || []).map((t) => {
                    const isUsed = assembledLetters.some(al => al.id === t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        disabled={isUsed || quizFeedback !== 'idle'}
                        onClick={() => handleTileClick(t)}
                        className={`min-w-11 h-11 px-2.5 rounded-2xl font-black text-base flex items-center justify-center transition-all cursor-pointer border-b-4 ${isKlingon ? 'font-klingon' : ''} ${
                          isUsed
                            ? 'opacity-20 bg-gray-800 text-gray-500 border-gray-900 pointer-events-none'
                            : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-900 active:translate-y-1 active:border-b-0 shadow-md'
                        }`}
                      >
                        {t.letter}
                      </button>
                    );
                  })}
                </div>

                {quizFeedback === 'idle' && (
                  <button
                    type="button"
                    onClick={handleCheckAssembledWord}
                    disabled={assembledLetters.length === 0}
                    className="w-full py-3.5 bg-duo-blue hover:brightness-110 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl border-b-4 border-duo-blueDark active:border-b-0 active:translate-y-1 shadow-lg transition-all cursor-pointer"
                  >
                    {isRu ? 'Проверить слово' : 'Check Word'}
                  </button>
                )}
              </div>
            )}

            {/* Type 2: Multiple Choice Options */}
            {(activeQuizExercise.type === 'listen_word' || activeQuizExercise.type === 'word_meaning') && (
              <div className="space-y-2.5">
                {(activeQuizExercise.options || []).map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={quizFeedback !== 'idle'}
                      onClick={() => handleCheckOption(opt)}
                      className={`w-full p-4 rounded-2xl border-2 font-bold text-sm text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected && opt.isCorrect
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                          : isSelected && !opt.isCorrect
                          ? 'bg-red-950/80 border-red-500 text-red-200'
                          : 'bg-gray-800/80 hover:bg-gray-750 border-gray-700 text-white'
                      }`}
                    >
                      <div>
                        <span className={`font-black text-base block ${isKlingon && activeQuizExercise.type === 'listen_word' ? 'font-klingon' : ''}`}>
                          {opt.text}
                        </span>
                        {isKlingon && activeQuizExercise.type === 'listen_word' && (
                          <span className="font-piqad text-xs text-purple-300 block">{tlhToPIqaD(opt.text)}</span>
                        )}
                        {opt.sub && <span className="text-xs text-gray-400 font-normal">{opt.sub}</span>}
                      </div>
                      {isSelected && (
                        <span>{opt.isCorrect ? '✓' : '✕'}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Feedback & Next */}
            {quizFeedback !== 'idle' && (
              <div className={`p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-bottom-2 ${
                quizFeedback === 'correct'
                  ? 'bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200'
                  : 'bg-red-950/80 border-2 border-red-500 text-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{quizFeedback === 'correct' ? '🎉' : '⚠️'}</span>
                  <div>
                    <span className="font-black text-sm block">
                      {quizFeedback === 'correct'
                        ? (isRu ? 'Правильно! +25 XP' : 'Correct! +25 XP')
                        : (isRu ? `Неверно. Правильное слово: ${activeQuizExercise.targetWord.word}` : `Incorrect. Word: ${activeQuizExercise.targetWord.word}`)}
                    </span>
                    <span className="text-xs opacity-90">
                      {activeQuizExercise.targetWord.translationRu}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => startWordQuiz()}
                  className="px-4 py-2 bg-white text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow cursor-pointer active:scale-95"
                >
                  {isRu ? 'Дальше' : 'Next'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
