import React, { useState, useMemo, useEffect } from 'react';
import { Course, UserProgress } from '../types';
import { VolumeIcon } from './Icons';
import {
  WHAT_YOU_HEARD_COLLECTION,
  WhatYouHeardExercise
} from '../services/soundIllusionService';
import { playSound, triggerHapticFeedback } from '../services/audioService';
import { tlhToPIqaD } from '../services/klingonDictionaryService';
import { downloadKlingonAudioFile } from '../services/klingonSpeechService';

interface AudioWhatHeardQuizProps {
  currentCourse: Course;
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  onSaveProgress?: (updatedUser: UserProgress) => void;
  speakText: (text: string, lang?: string, isSlow?: boolean, voice?: string, provider?: string) => void;
  isLightMode?: boolean;
}

export const AudioWhatHeardQuiz: React.FC<AudioWhatHeardQuizProps> = ({
  currentCourse,
  user,
  setUser,
  onSaveProgress,
  speakText,
  isLightMode = false,
}) => {
  const isRu = (user.language || 'ru') !== 'en';
  const difficultyLevel: 'easy' | 'hard' = user.difficultyLevel === 'hard' ? 'hard' : 'easy';

  // Match exercises for the active course cleanly, order by difficulty, and ensure >= 4 exercises
  const exercises: WhatYouHeardExercise[] = useMemo(() => {
    const baseCourseId = (currentCourse.id || '').split('_')[0];
    const courseSpecific = WHAT_YOU_HEARD_COLLECTION.filter(
      ex => ex.courseId === currentCourse.id || ex.courseId === baseCourseId
    );

    const sortByDifficulty = (list: WhatYouHeardExercise[]) => {
      return [...list].sort((a, b) => {
        const aHard = a.difficulty === 'hard' ? 1 : 0;
        const bHard = b.difficulty === 'hard' ? 1 : 0;
        return difficultyLevel === 'hard' ? bHard - aHard : aHard - bHard;
      });
    };

    const primary = sortByDifficulty(courseSpecific);
    if (primary.length >= 4) return primary;

    const existingIds = new Set(primary.map(ex => ex.id));
    const supplement = sortByDifficulty(
      WHAT_YOU_HEARD_COLLECTION.filter(ex => !existingIds.has(ex.id))
    );
    return [...primary, ...supplement];
  }, [currentCourse.id, difficultyLevel]);

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedChoice, setSelectedChoice] = useState<'A' | 'B' | 'C' | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [streakCount, setStreakCount] = useState<number>(0);
  const [isSlowMode, setIsSlowMode] = useState<boolean>(false);

  // Reset exercise cursor cleanly when switching course or difficulty level
  useEffect(() => {
    setCurrentIdx(0);
    setSelectedChoice(null);
    setFeedbackStatus('idle');
  }, [currentCourse.id, difficultyLevel]);

  const safeIdx = exercises.length > 0 ? currentIdx % exercises.length : 0;
  const currentExercise = exercises[safeIdx];
  const isKlingonAudio = (currentExercise?.courseId || currentCourse.id) === 'tlh';

  const handleSwitchDifficulty = (level: 'easy' | 'hard') => {
    playSound('select');
    if (level === 'hard') setIsSlowMode(false);
    const updatedUser: UserProgress = { ...user, difficultyLevel: level };
    setUser(updatedUser);
    if (onSaveProgress) onSaveProgress(updatedUser);
  };

  const handlePlaySound = (
    text: string,
    slow: boolean = isSlowMode,
    e?: React.MouseEvent,
    exerciseLang?: string
  ) => {
    if (e) e.stopPropagation();
    playSound('click');
    speakText(
      text,
      exerciseLang || currentExercise.courseId || currentCourse.id,
      slow,
      user.preferredVoice,
      user.voiceProvider
    );
  };

  const handleSelectOption = (choice: 'A' | 'B' | 'C') => {
    if (feedbackStatus !== 'idle') return;
    setSelectedChoice(choice);
    const isCorrect = choice === currentExercise.correctOptionId;
    const xpReward = difficultyLevel === 'hard' ? 35 : 20;

    if (isCorrect) {
      playSound('correct');
      triggerHapticFeedback('correct');
      setFeedbackStatus('correct');
      setStreakCount(prev => prev + 1);
      const updatedUser = { ...user, xp: user.xp + xpReward };
      setUser(updatedUser);
      if (onSaveProgress) onSaveProgress(updatedUser);
    } else {
      playSound('wrong');
      triggerHapticFeedback('wrong');
      setFeedbackStatus('wrong');
      setStreakCount(0);
    }
  };

  const handleNextExercise = () => {
    if (exercises.length === 0) return;
    playSound('select');
    const nextIdx = (safeIdx + 1) % exercises.length;
    const nextExercise = exercises[nextIdx];
    setCurrentIdx(nextIdx);
    setSelectedChoice(null);
    setFeedbackStatus('idle');
    if (nextExercise) {
      speakText(
        nextExercise.soundText,
        nextExercise.courseId || currentCourse.id,
        isSlowMode,
        user.preferredVoice,
        user.voiceProvider
      );
    }
  };

  const optionItems: Array<{
    key: 'A' | 'B' | 'C';
    data: { text: string; translationRu: string; translationEn: string };
  }> = [
    { key: 'A', data: currentExercise.optionA },
    { key: 'B', data: currentExercise.optionB },
    ...(currentExercise.optionC ? [{ key: 'C' as const, data: currentExercise.optionC }] : []),
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border-2 border-sky-500/50 shadow-2xl relative overflow-hidden text-left">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/20 border-2 border-sky-400/60 flex items-center justify-center text-3xl shadow-lg shrink-0">
              🎧
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {isRu ? 'Аудио: ЧТО ВЫ УСЛЫШАЛИ?' : 'Audio: WHAT DID YOU HEAR?'}
                </h2>
                <span className="bg-sky-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {isRu ? 'Восприятие на слух' : 'Auditory Perception'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-300 font-medium mt-1 leading-relaxed max-w-xl">
                {isRu
                  ? 'Слуховая тренировка различения близких звуков, долготы гласных и минимальных пар для чистой речи.'
                  : 'Ear training to distinguish minimal pairs, vowel lengths, and subtle phonetic contrasts.'}
              </p>
            </div>
          </div>

          {/* Difficulty & Streak Counter */}
          <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
            <div className="flex items-center bg-black/50 border border-sky-500/30 p-1 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => handleSwitchDifficulty('easy')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  difficultyLevel === 'easy' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                🌱 {isRu ? 'Лёгкий' : 'Easy'}
              </button>
              <button
                type="button"
                onClick={() => handleSwitchDifficulty('hard')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  difficultyLevel === 'hard' ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                🔥 {isRu ? 'Сложный' : 'Hard'}
              </button>
            </div>
            <div className="flex items-center space-x-2 bg-black/50 border border-sky-500/30 px-4 py-2 rounded-2xl">
              <span className="text-amber-400 text-lg">🔥</span>
              <span className="text-xs font-black text-white uppercase tracking-wider">
                {isRu ? `Серия: ${streakCount}` : `Streak: ${streakCount}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Quiz Box */}
      <div className={`border-2 rounded-3xl p-6 sm:p-8 shadow-xl text-left space-y-6 ${
        isLightMode ? 'bg-white border-sky-200 text-slate-900' : 'bg-[#182329] border-gray-800 text-white'
      }`}>

        {/* Title & Category */}
        <div className={`flex items-center justify-between flex-wrap gap-2 border-b pb-4 ${
          isLightMode ? 'border-sky-100' : 'border-gray-800'
        }`}>
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-sky-400 block">
              {isRu ? 'Фонетическая задача' : 'Phonetic Challenge'}
            </span>
            <h3 className={`text-lg sm:text-xl font-black mt-0.5 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              {isRu ? currentExercise.titleRu : currentExercise.titleEn}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
              isLightMode ? 'bg-sky-50 text-sky-700' : 'bg-black/40 text-gray-300'
            }`}>
              {safeIdx + 1} / {exercises.length}
            </span>
            <button
              type="button"
              onClick={handleNextExercise}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 border ${
                isLightMode
                  ? 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-700'
                  : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-sky-300'
              }`}
              title={isRu ? 'Перейти к следующему аудио' : 'Switch to next audio'}
            >
              {isRu ? 'След. аудио →' : 'Next →'}
            </button>
          </div>
        </div>

        {/* Central Audio Playback Stage */}
        <div className="p-8 rounded-3xl bg-black/60 border-2 border-sky-500/30 flex flex-col items-center justify-center space-y-4 shadow-inner">
          <span className="text-xs font-black uppercase tracking-widest text-sky-400">
            {isRu ? 'Нажмите, чтобы прослушать аудио' : 'Click to play audio'}
          </span>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => handlePlaySound(currentExercise.soundText, isSlowMode)}
              className="w-20 h-20 rounded-3xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 flex items-center justify-center shadow-2xl transition-all cursor-pointer group"
              title={isRu ? 'Прослушать звук' : 'Play audio'}
            >
              <VolumeIcon className="w-10 h-10 group-hover:scale-110 transition-transform" />
            </button>

            {/* Slow speed toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !isSlowMode;
                setIsSlowMode(next);
                handlePlaySound(currentExercise.soundText, next);
              }}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center ${
                isSlowMode
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
              }`}
              title={isRu ? 'Медленное воспроизведение (0.75x)' : 'Slow speed (0.75x)'}
            >
              <span className="text-lg">🐢</span>
              <span className="text-[9px] font-black uppercase mt-0.5">0.75x</span>
            </button>

            {/* Klingon Audio File Download Button */}
            {isKlingonAudio && (
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  void downloadKlingonAudioFile(currentExercise.soundText, isSlowMode);
                }}
                className="p-3 rounded-2xl border bg-emerald-950/70 hover:bg-emerald-800 border-emerald-500/40 text-emerald-300 transition-all cursor-pointer flex flex-col items-center justify-center"
                title={isRu ? 'Скачать аудио-файл клингонский' : 'Download Klingon audio file'}
              >
                <span className="text-lg">💾</span>
                <span className="text-[9px] font-black uppercase mt-0.5">{isRu ? 'Файл' : 'Audio'}</span>
              </button>
            )}
          </div>

          {isKlingonAudio && (
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/40">
              🖖 {isRu ? 'Клиентский Speech + hol.kag.org' : 'Client Speech + hol.kag.org'}
            </span>
          )}

          <h4 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider text-center">
            {isRu ? 'Что вы услышали?' : 'What did you hear?'}
          </h4>
        </div>

        {/* Options Grid */}
        <div className={`grid grid-cols-1 ${optionItems.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3.5`}>
          {optionItems.map(item => {
            const isSelected = selectedChoice === item.key;
            const isCorrectChoice = currentExercise.correctOptionId === item.key;
            return (
              <button
                key={item.key}
                type="button"
                disabled={feedbackStatus !== 'idle'}
                onClick={() => handleSelectOption(item.key)}
                className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                  isSelected && isCorrectChoice
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-lg'
                    : isSelected && !isCorrectChoice
                    ? 'bg-red-950/80 border-red-500 text-red-200 shadow-lg'
                    : feedbackStatus !== 'idle' && isCorrectChoice
                    ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-200'
                    : isLightMode
                    ? 'bg-slate-50 hover:bg-sky-50 border-slate-200 text-slate-900'
                    : 'bg-gray-800/80 hover:bg-gray-750 border-gray-700 text-white'
                }`}
              >
                <div>
                  <span className={`text-xl font-black block ${isKlingonAudio ? 'font-klingon' : ''}`}>
                    {item.data.text}
                  </span>
                  {isKlingonAudio && (
                    <span className="font-piqad text-xs text-purple-300 block">
                      {tlhToPIqaD(item.data.text)}
                    </span>
                  )}
                  <span className={`text-xs font-medium ${isLightMode && !isSelected ? 'text-slate-500' : 'text-gray-400'}`}>
                    {isRu ? item.data.translationRu : item.data.translationEn}
                  </span>
                </div>
                <span className="text-lg font-black text-gray-400">{item.key}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback & Acoustic Breakdown Panel */}
        {feedbackStatus !== 'idle' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2">

            {/* Success / Error Card */}
            <div className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              feedbackStatus === 'correct'
                ? 'bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200'
                : 'bg-red-950/80 border-2 border-red-500 text-red-200'
            }`}>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{feedbackStatus === 'correct' ? '🎉' : '❌'}</span>
                <div>
                  <span className="font-black text-sm block">
                    {feedbackStatus === 'correct'
                      ? (isRu ? `Правильно! Вы точно распознали звук (+${difficultyLevel === 'hard' ? 35 : 20} XP)` : `Correct! Precise hearing (+${difficultyLevel === 'hard' ? 35 : 20} XP)`)
                      : (isRu ? 'Не совсем так, но это отличная тренировка слуха!' : 'Not quite, but great ear training!')}
                  </span>
                  <span className="text-xs opacity-90">
                    {isRu ? 'Звучало слово: ' : 'Target sound was: '}
                    <strong className={isKlingonAudio ? 'font-klingon' : ''}>{currentExercise.soundText}</strong>
                    {isKlingonAudio && (
                      <span className="font-piqad text-xs text-purple-300 ml-2">({tlhToPIqaD(currentExercise.soundText)})</span>
                    )}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextExercise}
                className="px-5 py-2.5 bg-white text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow cursor-pointer active:scale-95 shrink-0"
              >
                {isRu ? 'Следующее аудио →' : 'Next Audio →'}
              </button>
            </div>

            {/* Side-by-side Comparative Audio Listening Tool */}
            <div className="p-4 rounded-2xl bg-black/60 border border-gray-800 space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-400 block">
                {isRu ? 'Сравните оба варианта на слух:' : 'Compare both sounds side-by-side:'}
              </span>
              <div className={`grid ${optionItems.length === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                {optionItems.map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handlePlaySound(item.data.text, false)}
                    className="py-2.5 px-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <VolumeIcon className="w-4 h-4 text-sky-400" />
                    <span className={isKlingonAudio ? 'font-klingon' : ''}>{item.data.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Phonetic & Acoustic Explanation */}
            <div className="p-4 rounded-2xl bg-[#141C21] border border-gray-800 text-xs space-y-1.5">
              <span className="font-black text-sky-300 uppercase tracking-wide block">
                🔬 {isRu ? 'Акустический разбор:' : 'Acoustic Breakdown:'}
              </span>
              <p className="text-gray-300 font-medium leading-relaxed">
                {isRu ? currentExercise.acousticDifferenceRu : currentExercise.acousticDifferenceEn}
              </p>
              <div className="pt-1 text-[11px] text-amber-300 font-bold">
                💡 {isRu ? currentExercise.phoneticTipRu : currentExercise.phoneticTipEn}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
