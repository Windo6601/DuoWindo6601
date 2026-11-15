import React, { useState, useEffect, useRef } from 'react';
import { UserProgress } from '../types';
import { VolumeIcon, SparklesIcon, CheckCircleIcon } from './Icons';
import {
  SOUND_ILLUSIONS_CATALOG,
  SoundIllusionItem,
  playShepardTone,
  playBinauralBeats,
  playTritoneParadox,
  stopActiveIllusion
} from '../services/soundIllusionService';
import { playSound, triggerHapticFeedback } from '../services/audioService';

interface SoundIllusionLabProps {
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  onSaveProgress?: (updatedUser: UserProgress) => void;
  speakText: (text: string, lang?: string, isSlow?: boolean, voice?: string, provider?: string) => void;
  isLightMode?: boolean;
}

export const SoundIllusionLab: React.FC<SoundIllusionLabProps> = ({
  user,
  setUser,
  onSaveProgress,
  speakText,
  isLightMode = false,
}) => {
  const isRu = (user.language || 'ru') !== 'en';
  const difficultyLevel: 'easy' | 'hard' = user.difficultyLevel === 'hard' ? 'hard' : 'easy';
  const [selectedIllusionIdx, setSelectedIllusionIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'explore' | 'quiz'>('explore');
  const [quizAnsweredId, setQuizAnsweredId] = useState<string | null>(null);
  const [revealedReality, setRevealedReality] = useState<boolean>(false);
  const playTimerRef = useRef<any>(null);

  const handleSwitchDifficulty = (level: 'easy' | 'hard') => {
    playSound('select');
    const updatedUser: UserProgress = { ...user, difficultyLevel: level };
    setUser(updatedUser);
    if (onSaveProgress) onSaveProgress(updatedUser);
  };

  const currentIllusion: SoundIllusionItem = SOUND_ILLUSIONS_CATALOG[selectedIllusionIdx] || SOUND_ILLUSIONS_CATALOG[0];

  useEffect(() => {
    return () => {
      stopActiveIllusion();
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, []);

  const handleStopAudio = () => {
    stopActiveIllusion();
    if (playTimerRef.current) clearTimeout(playTimerRef.current);
    setIsPlaying(false);
  };

  const handlePlayIllusion = () => {
    handleStopAudio();
    playSound('click');
    setIsPlaying(true);

    if (currentIllusion.illusionType === 'shepard') {
      playShepardTone(7);
      playTimerRef.current = setTimeout(() => setIsPlaying(false), 7000);
    } else if (currentIllusion.illusionType === 'binaural') {
      playBinauralBeats(7);
      playTimerRef.current = setTimeout(() => setIsPlaying(false), 7000);
    } else if (currentIllusion.illusionType === 'tritone') {
      playTritoneParadox();
      playTimerRef.current = setTimeout(() => setIsPlaying(false), 2500);
    } else if (currentIllusion.speechText) {
      speakText(
        currentIllusion.speechText,
        currentIllusion.speechLang || 'en',
        false,
        user.preferredVoice,
        user.voiceProvider
      );
      playTimerRef.current = setTimeout(() => setIsPlaying(false), 3500);
    } else {
      playTimerRef.current = setTimeout(() => setIsPlaying(false), 3000);
    }
  };

  const handleSelectIllusion = (idx: number) => {
    handleStopAudio();
    playSound('select');
    setSelectedIllusionIdx(idx);
    setQuizAnsweredId(null);
    setRevealedReality(false);
  };

  const handleQuizChoice = (opt: { id: string; text: string; isReal: boolean; explanation: string }) => {
    setQuizAnsweredId(opt.id);
    setRevealedReality(true);
    if (opt.isReal) {
      playSound('correct');
      triggerHapticFeedback('correct');
      const xpReward = difficultyLevel === 'hard' ? 35 : 20;
      const updatedUser = { ...user, xp: user.xp + xpReward };
      setUser(updatedUser);
      if (onSaveProgress) onSaveProgress(updatedUser);
    } else {
      playSound('wrong');
      triggerHapticFeedback('wrong');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950 via-purple-950/80 to-slate-900 border-2 border-purple-500/50 shadow-2xl relative overflow-hidden text-left">
        <div className="absolute right-0 top-0 -mr-10 -mt-10 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border-2 border-purple-400/60 flex items-center justify-center text-3xl shadow-lg shrink-0">
              🌀
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {isRu ? 'Звуковая Иллюзия: ЧТО РЕАЛЬНО, А ЧТО НЕТ?' : 'Sound Illusion: WHAT IS REAL & WHAT IS NOT?'}
                </h2>
                <span className="bg-purple-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {isRu ? 'Психоакустика' : 'Psychoacoustics'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-purple-200/90 font-medium max-w-2xl leading-relaxed">
                {isRu
                  ? 'Слух человека — не микрофон, а мощная система интерпретации. Исследуйте удивительные звуковые иллюзии: проверьте, что звучит в реальности, а что конструирует мозг!'
                  : 'Human hearing is not a microphone. Explore scientific auditory illusions: discover what physically exists in the acoustic wave vs what the brain fabricates!'}
              </p>
            </div>
          </div>

          {/* Mode & Difficulty Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <div className="flex items-center bg-gray-900/80 p-1 rounded-2xl border border-gray-700/80">
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
            <div className="flex items-center bg-gray-900/80 p-1.5 rounded-2xl border border-gray-700/80 shrink-0">
              <button
                type="button"
                onClick={() => { playSound('click'); setActiveTab('explore'); }}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'explore'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🔬 {isRu ? 'Лаборатория' : 'Lab'}
              </button>
              <button
                type="button"
                onClick={() => { playSound('click'); setActiveTab('quiz'); }}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'quiz'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                ❓ {isRu ? 'Викторина: Что реально?' : 'Quiz: What is Real?'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Illusion Selection Carousel / Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-2">
        {SOUND_ILLUSIONS_CATALOG.map((item, idx) => {
          const isSelected = selectedIllusionIdx === idx;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectIllusion(idx)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center space-x-2 whitespace-nowrap transition-all border-2 cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-purple-600 border-purple-400 text-white shadow-lg scale-102 ring-2 ring-purple-400/40'
                  : 'bg-[#182329] border-gray-800 text-gray-300 hover:border-gray-700 hover:bg-[#1E2B33]'
              }`}
            >
              <span>{item.icon}</span>
              <span>{isRu ? item.titleRu : item.titleEn}</span>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Stage */}
      <div className="bg-[#182329] border-2 border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl text-left space-y-6">
        
        {/* Top details of selected illusion */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-widest text-purple-400">
              {isRu ? currentIllusion.badgeRu : currentIllusion.badgeEn}
            </span>
            <h3 className="text-2xl font-black text-white flex items-center gap-2">
              <span>{currentIllusion.icon}</span>
              <span>{isRu ? currentIllusion.titleRu : currentIllusion.titleEn}</span>
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              {isRu ? currentIllusion.descriptionRu : currentIllusion.descriptionEn}
            </p>
          </div>

          {/* Sound Trigger Button with Wave Animation */}
          <div className="flex items-center space-x-3 self-center sm:self-auto">
            {isPlaying ? (
              <button
                type="button"
                onClick={handleStopAudio}
                className="py-3 px-6 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl flex items-center gap-2 cursor-pointer animate-pulse"
              >
                <span>⏹️</span>
                <span>{isRu ? 'Остановить' : 'Stop'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePlayIllusion}
                className="py-3.5 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl border-b-4 border-purple-900 shadow-xl flex items-center gap-2.5 cursor-pointer transition-all"
              >
                <VolumeIcon className="w-5 h-5 text-amber-300" />
                <span>{isRu ? 'Воспроизвести иллюзию' : 'Play Illusion'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Audio Visualizer Strip */}
        <div className="p-4 rounded-2xl bg-black/60 border border-gray-800 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-gray-600'}`} />
            <span className="text-xs font-bold text-gray-300">
              {isPlaying
                ? (isRu ? 'Звучание активно — слушайте в наушниках для максимального эффекта' : 'Playing — use headphones for best illusion effect')
                : (isRu ? currentIllusion.audioPromptRu : currentIllusion.audioPromptEn)}
            </span>
          </div>

          {/* Oscilloscope Graphic */}
          <div className="flex items-center space-x-1 h-6">
            {[14, 22, 10, 26, 18, 28, 12, 24, 16, 20].map((h, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${isPlaying ? 'bg-purple-400 animate-pulse' : 'bg-gray-700'}`}
                style={{ height: isPlaying ? `${Math.min(28, h * 1.1)}px` : '4px' }}
              />
            ))}
          </div>
        </div>

        {/* MODE 1: EXPLORE (SIDE-BY-SIDE: ЧТО СЛЫШИТ МОЗГ vs ЧТО РЕАЛЬНО) */}
        {activeTab === 'explore' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            
            {/* Card A: What the Brain Hears (The Illusion) */}
            <div className="p-5 rounded-3xl bg-purple-950/40 border-2 border-purple-500/40 space-y-3 relative overflow-hidden shadow-lg">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center text-lg font-black shrink-0">
                  🧠
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block">
                    {isRu ? 'Восприятие' : 'Perception'}
                  </span>
                  <h4 className="font-black text-sm text-white">
                    {isRu ? 'ЧТО СЛЫШИТ МОЗГ (ИЛЛЮЗИЯ):' : 'WHAT THE BRAIN HEARS (ILLUSION):'}
                  </h4>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-purple-100 font-medium leading-relaxed bg-black/30 p-3.5 rounded-2xl border border-purple-500/20">
                {isRu ? currentIllusion.whatYouHearRu : currentIllusion.whatYouHearEn}
              </p>
            </div>

            {/* Card B: What is Real (Acoustic Physics) */}
            <div className="p-5 rounded-3xl bg-emerald-950/40 border-2 border-emerald-500/40 space-y-3 relative overflow-hidden shadow-lg">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-lg font-black shrink-0">
                  🔬
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                    {isRu ? 'Физика звука' : 'Acoustic Physics'}
                  </span>
                  <h4 className="font-black text-sm text-white">
                    {isRu ? 'ЧТО РЕАЛЬНО В ЗВУКОВОЙ ВОЛНЕ:' : 'WHAT IS REAL IN THE SOUND WAVE:'}
                  </h4>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed bg-black/30 p-3.5 rounded-2xl border border-emerald-500/20">
                {isRu ? currentIllusion.whatIsRealRu : currentIllusion.whatIsRealEn}
              </p>
            </div>
          </div>
        )}

        {/* MODE 2: QUIZ: "ЧТО РЕАЛЬНО, А ЧТО НЕТ?" */}
        {activeTab === 'quiz' && (
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-purple-950/60 border border-purple-500/40 rounded-2xl">
              <span className="text-[10px] uppercase font-black tracking-widest text-purple-300 block mb-1">
                {isRu ? 'Вопрос на проверку слуха и логики:' : 'Ear & Logic Verification Question:'}
              </span>
              <h4 className="text-base sm:text-lg font-black text-white">
                {isRu ? currentIllusion.quizQuestionRu : currentIllusion.quizQuestionEn}
              </h4>
            </div>

            {/* Selectable Options */}
            <div className="space-y-2.5">
              {(isRu ? currentIllusion.optionsRu : currentIllusion.optionsEn).map((opt) => {
                const isSelected = quizAnsweredId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleQuizChoice(opt)}
                    className={`w-full p-4 rounded-2xl border-2 font-bold text-xs sm:text-sm text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected && opt.isReal
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-md'
                        : isSelected && !opt.isReal
                        ? 'bg-red-950/80 border-red-500 text-red-200 shadow-md'
                        : 'bg-gray-800/80 hover:bg-gray-750 border-gray-700 text-white'
                    }`}
                  >
                    <span className="flex-1 pr-3">{opt.text}</span>
                    <span className="shrink-0 text-base">
                      {isSelected ? (opt.isReal ? '✅ Реальность' : '❌ Иллюзия') : '👉'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation & Acoustic Reality Card */}
            {revealedReality && (
              <div className="p-5 rounded-2xl bg-black/60 border-2 border-emerald-500/60 text-xs sm:text-sm space-y-2 animate-in fade-in">
                <div className="flex items-center space-x-2 text-emerald-300 font-black uppercase tracking-wider text-xs">
                  <span>🔬</span>
                  <span>{isRu ? 'Акустическая реальность звука:' : 'Acoustic Reality:'}</span>
                </div>
                <p className="text-gray-200 font-medium leading-relaxed">
                  {isRu ? currentIllusion.whatIsRealRu : currentIllusion.whatIsRealEn}
                </p>
                <div className="text-[11px] text-amber-300 font-bold pt-1">
                  ✨ {isRu ? `Награда за исследование иллюзии: +${difficultyLevel === 'hard' ? 35 : 20} XP!` : `Exploration reward: +${difficultyLevel === 'hard' ? 35 : 20} XP!`}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
