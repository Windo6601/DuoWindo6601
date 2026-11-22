import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Course, UserProgress } from '../types';
import {
  CloseIcon,
  VolumeIcon,
  TurtleIcon,
  CheckCircleIcon,
  SparklesIcon,
  HeadphonesRadioIcon,
  EyeIcon
} from './Icons';
import {
  DuoRadioEpisode,
  DuoRadioQuestion,
  getCuratedRadioEpisodes,
  generateDuoRadioEpisodeAI,
  buildEpisodeFromCustomText,
  classifyCoursesForRadio
} from '../services/duowindo6601RadioService';
import { normalizeCourseLangCode } from '../services/multilingualTtsHelper';

export const DUO_RADIO_COMPLETED_STORAGE_KEY = 'duo_radio_completed_6601';

export function getCompletedRadioEpisodeIds(): string[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(DUO_RADIO_COMPLETED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface DuoWindo6601RadioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCourse: Course;
  allCourses?: Course[];
  onSwitchCourse?: (course: Course) => void;
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  playSound: (sound: any) => void;
  setToast: (msg: string) => void;
  speakText: (text: string, courseId: string, slow?: boolean) => Promise<void> | void;
  langSection?: number;
  isLightMode?: boolean;
  onEpisodeCompleted?: (completedIds: string[]) => void;
}

export const DuoWindo6601RadioModal: React.FC<DuoWindo6601RadioModalProps> = ({
  isOpen,
  onClose,
  currentCourse,
  allCourses,
  onSwitchCourse,
  user,
  setUser,
  playSound,
  setToast,
  speakText,
  langSection = 1,
  isLightMode = false,
  onEpisodeCompleted
}) => {
  const isRu = user.language !== 'en';
  const hostLang = isRu ? 'ru' : 'en';

  const baseEpisodes = useMemo(
    () => getCuratedRadioEpisodes(currentCourse, user.language, langSection),
    [currentCourse, user.language, langSection]
  );

  const courseLists = useMemo(
    () => classifyCoursesForRadio(allCourses),
    [allCourses]
  );

  const [aiEpisodes, setAiEpisodes] = useState<DuoRadioEpisode[]>([]);
  const episodes = useMemo(() => [...aiEpisodes, ...baseEpisodes], [aiEpisodes, baseEpisodes]);

  const [customEpisodeText, setCustomEpisodeText] = useState<string>('');
  const [showCourseLists, setShowCourseLists] = useState<boolean>(false);
  const [courseListTab, setCourseListTab] = useState<'available' | 'unavailable' | 'non_language'>('available');

  const [completedIds, setCompletedIds] = useState<string[]>(() => getCompletedRadioEpisodeIds());
  const [activeEpisode, setActiveEpisode] = useState<DuoRadioEpisode | null>(null);
  const [currentCueIndex, setCurrentCueIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSlow, setIsSlow] = useState<boolean>(false);
  const [pureListeningMode, setPureListeningMode] = useState<boolean>(true);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  // Comprehension questions state
  const [activeQuestion, setActiveQuestion] = useState<DuoRadioQuestion | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, number>>({});
  const [correctQuestionsCount, setCorrectQuestionsCount] = useState<number>(0);
  const [isEpisodeComplete, setIsEpisodeComplete] = useState<boolean>(false);

  const playbackRunIdRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      playbackRunIdRef.current += 1;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopAudioPlayback();
    }
  }, [isOpen]);

  // Reset AI episodes when course changes so list matches current course
  useEffect(() => {
    setAiEpisodes([]);
    setActiveEpisode(null);
    stopAudioPlayback();
  }, [currentCourse.id]);

  const stopAudioPlayback = () => {
    playbackRunIdRef.current += 1;
    setIsPlaying(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  };

  const speakCueAndWait = async (cueIndex: number, ep: DuoRadioEpisode, runId: number, slowMode: boolean) => {
    const cue = ep.cues[cueIndex];
    if (!cue) return;
    const targetLang = normalizeCourseLangCode(ep.courseId);
    const langForCue = cue.isFamiliarLang ? hostLang : targetLang;

    try {
      await Promise.resolve(speakText(cue.text, langForCue, slowMode));
    } catch {}

    // If Web Speech API fallback is actively speaking, wait cleanly until finished or cancelled
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      let ticks = 0;
      while (window.speechSynthesis.speaking && ticks < 240) {
        if (!isMountedRef.current || playbackRunIdRef.current !== runId) return;
        await new Promise((r) => setTimeout(r, 120));
        ticks += 1;
      }
    }

    // Brief natural broadcast pause between speakers
    if (isMountedRef.current && playbackRunIdRef.current === runId) {
      await new Promise((r) => setTimeout(r, 450));
    }
  };

  const playFromCue = async (startIdx: number, ep: DuoRadioEpisode, autoAdvance: boolean = true, slowOverride?: boolean) => {
    stopAudioPlayback();
    const runId = playbackRunIdRef.current;
    const effectiveSlow = slowOverride ?? isSlow;

    setIsPlaying(true);
    let idx = startIdx;

    while (idx < ep.cues.length) {
      if (!isMountedRef.current || playbackRunIdRef.current !== runId) return;
      setCurrentCueIndex(idx);

      await speakCueAndWait(idx, ep, runId, effectiveSlow);
      if (!isMountedRef.current || playbackRunIdRef.current !== runId) return;

      // Check if there is an unanswered mid or final comprehension question right after this cue
      const pendingQ = ep.questions.find(
        (q) => q.afterCueIndex === idx && answeredQuestions[q.id] === undefined
      );

      if (pendingQ) {
        setIsPlaying(false);
        setActiveQuestion(pendingQ);
        playSound('select');
        return;
      }

      if (!autoAdvance) {
        setIsPlaying(false);
        return;
      }

      idx += 1;
    }

    // Reached end of cues — show final unanswered question or completion screen
    if (isMountedRef.current && playbackRunIdRef.current === runId) {
      setIsPlaying(false);
      const remainingQ = ep.questions.find((q) => answeredQuestions[q.id] === undefined);
      if (remainingQ) {
        setActiveQuestion(remainingQ);
        playSound('select');
      } else {
        completeEpisode(ep);
      }
    }
  };

  const completeEpisode = (ep: DuoRadioEpisode) => {
    if (isEpisodeComplete) return;
    playSound('fanfare');
    setIsEpisodeComplete(true);

    const xpEarned = user.difficultyLevel === 'hard' ? 35 : 30;
    setUser((u) => ({
      ...u,
      xp: u.xp + xpEarned,
      gems: u.gems + 5
    }));

    if (!completedIds.includes(ep.id)) {
      const updated = [...completedIds, ep.id];
      setCompletedIds(updated);
      try {
        localStorage.setItem(DUO_RADIO_COMPLETED_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      onEpisodeCompleted?.(updated);
    }

    confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
    setToast(
      isRu
        ? `🎧 Выпуск DuoWindo6601Radio завершён! +${xpEarned} XP и +5 💎`
        : `🎧 DuoWindo6601Radio episode complete! +${xpEarned} XP & +5 💎`
    );
  };

  const handleStartEpisode = (ep: DuoRadioEpisode) => {
    playSound('click');
    setActiveEpisode(ep);
    setCurrentCueIndex(0);
    setActiveQuestion(null);
    setAnsweredQuestions({});
    setCorrectQuestionsCount(0);
    setIsEpisodeComplete(false);
    void playFromCue(0, ep, true);
  };

  const handleTogglePlayPause = () => {
    if (!activeEpisode) return;
    playSound('click');
    if (isPlaying) {
      stopAudioPlayback();
    } else {
      void playFromCue(currentCueIndex, activeEpisode, true);
    }
  };

  const handleAnswerQuestion = (optionIdx: number) => {
    if (!activeQuestion || !activeEpisode) return;
    if (answeredQuestions[activeQuestion.id] !== undefined) return;

    const isCorrect = optionIdx === activeQuestion.correctIndex;
    setAnsweredQuestions((prev) => ({ ...prev, [activeQuestion.id]: optionIdx }));

    if (isCorrect) {
      setCorrectQuestionsCount((c) => c + 1);
      playSound('correct');
      confetti({ particleCount: 35, spread: 55, origin: { y: 0.7 } });
    } else {
      playSound('wrong');
    }
  };

  const handleContinueAfterQuestion = () => {
    if (!activeEpisode || !activeQuestion) return;
    playSound('click');
    const nextIdx = activeQuestion.afterCueIndex + 1;
    setActiveQuestion(null);

    if (nextIdx < activeEpisode.cues.length) {
      void playFromCue(nextIdx, activeEpisode, true);
    } else {
      const nextUnanswered = activeEpisode.questions.find(
        (q) => q.id !== activeQuestion.id && answeredQuestions[q.id] === undefined
      );
      if (nextUnanswered) {
        setActiveQuestion(nextUnanswered);
      } else {
        completeEpisode(activeEpisode);
      }
    }
  };

  const handleGenerateAiEpisode = async () => {
    if (isGeneratingAi) return;
    playSound('click');
    setIsGeneratingAi(true);
    try {
      const generated = await generateDuoRadioEpisodeAI(
        currentCourse,
        user.language,
        user.difficultyLevel === 'hard' ? 'hard' : 'easy',
        langSection,
        customEpisodeText.trim() || undefined
      );
      setAiEpisodes((prev) => [generated, ...prev]);
      playSound('fanfare');
      setToast(
        isRu
          ? `🎙️ Новый выпуск DuoWindo6601Radio (${currentCourse.localName || currentCourse.name}) запущен!`
          : `🎙️ New DuoWindo6601Radio episode (${currentCourse.name}) started!`
      );
      handleStartEpisode(generated);
    } finally {
      if (isMountedRef.current) setIsGeneratingAi(false);
    }
  };

  const handleLaunchCustomTextEpisode = () => {
    const text = customEpisodeText.trim();
    if (!text) {
      setToast(
        isRu
          ? 'Введите текст или реплики для выпуска'
          : 'Enter text or dialogue lines for the episode'
      );
      return;
    }
    const created = buildEpisodeFromCustomText(
      currentCourse,
      text,
      user.language,
      user.difficultyLevel === 'hard' ? 'hard' : 'easy',
      langSection,
      false
    );
    setAiEpisodes((prev) => [created, ...prev]);
    playSound('fanfare');
    setToast(
      isRu
        ? `📝 Выпуск по вашему тексту (${currentCourse.localName || currentCourse.name}) запущен!`
        : `📝 Custom text episode (${currentCourse.name}) launched!`
    );
    handleStartEpisode(created);
  };

  const handleCloseModal = () => {
    stopAudioPlayback();
    playSound('click');
    setActiveEpisode(null);
    onClose();
  };

  const blockedCourses = new Set(['tlh', 'math', 'music', 'chess', 'coding', 'art']);
  if (!isOpen || blockedCourses.has(currentCourse.id)) return null;

  const modalShell = isLightMode
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-[#131f24] border-[#263843] text-white';

  const headerShell = isLightMode
    ? 'bg-slate-50 border-slate-200'
    : 'bg-[#182328] border-[#263843]';

  const subText = isLightMode ? 'text-slate-500' : 'text-gray-400';

  return (
    <div className="fixed inset-0 z-[125] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in select-none">
      <div className={`border-2 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative text-left ${modalShell}`}>
        {/* TOP STUDIO HEADER */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${headerShell}`}>
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-[#66DBFF] to-[#34BDF5] border-b-4 border-[#1B89C2] flex items-center justify-center shadow-md shrink-0">
              <HeadphonesRadioIcon className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black flex items-center gap-2 flex-wrap">
                <span>DuoWindo6601Radio</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  {currentCourse.localName || currentCourse.name}
                </span>
              </h2>
              <p className={`text-xs font-bold ${subText}`}>
                {isRu
                  ? 'Подкасты на аудирование • Без спикера (+30 XP)'
                  : 'Listening Podcasts • Audio Immersion (+30 XP)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (activeEpisode) {
                stopAudioPlayback();
                playSound('click');
                setActiveEpisode(null);
              } else {
                handleCloseModal();
              }
            }}
            aria-label={activeEpisode ? (isRu ? 'Назад к выпускам' : 'Back to episodes') : (isRu ? 'Закрыть' : 'Close')}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isLightMode
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {!activeEpisode ? (
            /* ==================== EPISODE CATALOG ==================== */
            <div className="space-y-5">
              {/* How DuoRadio Works Info Card */}
              <div className={`rounded-2xl p-4 border ${
                isLightMode
                  ? 'bg-sky-50 border-sky-200 text-slate-800'
                  : 'bg-sky-950/35 border-sky-500/30 text-sky-100'
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">🦉</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="font-black uppercase tracking-wider text-sky-400">
                      {isRu ? 'Как устроен урок DuoWindo6601Radio' : 'How DuoWindo6601Radio Works'}
                    </div>
                    <ul className={`space-y-1 font-bold ${isLightMode ? 'text-slate-600' : 'text-gray-300'}`}>
                      <li>• {isRu ? 'Формат подкаста: короткий аудиоэфир без спикера (только аудирование).' : 'Podcast format: short audio listening episodes.'}</li>
                      <li>• {isRu ? 'Погружение: пояснения на вашем языке, диалог — на изучаемом.' : 'Immersion: notes in your language, dialogue in your target language.'}</li>
                      <li>• {isRu ? 'Проверка понимания: интерактивные вопросы по ходу и в конце выпуска.' : 'Comprehension checks: questions during and after listening.'}</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Custom Episode Text / Topic Input Studio */}
              <div className={`rounded-2xl p-4 border space-y-3 ${
                isLightMode
                  ? 'bg-slate-50 border-slate-200 text-slate-900'
                  : 'bg-[#17252d] border-[#283c48] text-white'
              }`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <span>📝</span>
                    <span>{isRu ? 'Текст или тема выпуска (по желанию)' : 'Custom Episode Text or Topic (Optional)'}</span>
                  </label>
                  {customEpisodeText.trim() && (
                    <button
                      type="button"
                      onClick={() => setCustomEpisodeText('')}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg cursor-pointer ${
                        isLightMode ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-gray-800 text-gray-300 hover:text-white'
                      }`}
                    >
                      ✕ {isRu ? 'Очистить' : 'Clear'}
                    </button>
                  )}
                </div>

                <textarea
                  rows={3}
                  dir="auto"
                  value={customEpisodeText}
                  onChange={(e) => setCustomEpisodeText(e.target.value.slice(0, 1200))}
                  placeholder={
                    isRu
                      ? `Введите свой текст, реплики на языке «${currentCourse.localName || currentCourse.name}» (по строкам) или тему для нового выпуска...`
                      : `Enter your own dialogue lines in ${currentCourse.name} (one per line) or a topic for the new episode...`
                  }
                  className={`w-full rounded-xl p-3 text-xs font-medium border focus:outline-none focus:border-sky-400 transition-colors ${
                    isLightMode
                      ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-[#101a20] border-[#293d49] text-white placeholder-gray-500'
                  }`}
                />

                {/* Quick Topic Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {(isRu
                    ? [
                        { label: '☕ В кафе', text: 'Заказ кофе и десерта в уютном кафе' },
                        { label: '✈️ В аэропорту', text: 'Регистрация на рейс и посадка в аэропорту' },
                        { label: '🌦️ О погоде', text: 'Прогноз погоды на выходные и прогулка в парке' },
                        { label: '📚 Любимая книга', text: 'Обсуждение интересной книги и музыки' }
                      ]
                    : [
                        { label: '☕ Cafe Order', text: 'Ordering coffee and pastry at a cozy cafe' },
                        { label: '✈️ At the Airport', text: 'Flight check-in and boarding announcement' },
                        { label: '🌦️ Weather Forecast', text: 'Weekend weather forecast and walk in the park' },
                        { label: '📚 Favorite Book', text: 'Talking about a favorite book and music' }
                      ]
                  ).map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        playSound('click');
                        setCustomEpisodeText(chip.text);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        isLightMode
                          ? 'bg-white border-slate-200 hover:border-sky-400 text-slate-700'
                          : 'bg-[#111c22] border-[#293d49] hover:border-sky-400 text-sky-200'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Action Buttons: AI Generate & Direct Custom Text Launch */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                  <span className={`text-xs font-black uppercase tracking-wider ${subText}`}>
                    {isRu ? `Эфиры курса (${episodes.length})` : `Course Episodes (${episodes.length})`}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {customEpisodeText.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={handleLaunchCustomTextEpisode}
                        className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>▶</span>
                        <span>{isRu ? 'Запустить из текста' : 'Play From Text'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleGenerateAiEpisode}
                      disabled={isGeneratingAi}
                      className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider border-b-4 border-sky-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      <SparklesIcon className="w-4 h-4" />
                      <span>
                        {isGeneratingAi
                          ? (isRu ? 'Записываем эфир...' : 'Recording episode...')
                          : (isRu ? 'Новый выпуск (AI)' : 'New AI Episode')}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3-Category Course Availability Lists (Available Language / Unavailable Language / Non-Language) */}
              <div className={`rounded-2xl border overflow-hidden ${
                isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#152229] border-[#263843]'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setShowCourseLists((v) => !v);
                  }}
                  className={`w-full px-4 py-3 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors ${
                    isLightMode ? 'hover:bg-slate-100' : 'hover:bg-[#1a2b34]'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base">📋</span>
                    <span className="text-xs font-black uppercase tracking-wider text-sky-400">
                      {isRu ? 'Списки курсов DuoWindo6601Radio' : 'DuoWindo6601Radio Course Lists'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ✅ {courseLists.availableLanguageCourses.length}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      🚫 {courseLists.unavailableLanguageCourses.length}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      🧩 {courseLists.nonLanguageCourses.length}
                    </span>
                  </div>
                  <span className={`text-xs font-black ${subText}`}>
                    {showCourseLists ? '▲' : '▼'}
                  </span>
                </button>

                {showCourseLists && (
                  <div className="px-4 pb-4 pt-1 space-y-3 border-t border-white/10">
                    {/* Sub-tabs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => { playSound('click'); setCourseListTab('available'); }}
                        className={`px-3 py-2 rounded-xl text-[11px] font-black transition-all cursor-pointer border text-left flex items-center justify-between ${
                          courseListTab === 'available'
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : isLightMode
                            ? 'bg-white border-slate-200 text-slate-600'
                            : 'bg-[#101a20] border-[#253844] text-gray-400'
                        }`}
                      >
                        <span>✅ {isRu ? 'Доступные языки' : 'Available Languages'}</span>
                        <span>({courseLists.availableLanguageCourses.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { playSound('click'); setCourseListTab('unavailable'); }}
                        className={`px-3 py-2 rounded-xl text-[11px] font-black transition-all cursor-pointer border text-left flex items-center justify-between ${
                          courseListTab === 'unavailable'
                            ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                            : isLightMode
                            ? 'bg-white border-slate-200 text-slate-600'
                            : 'bg-[#101a20] border-[#253844] text-gray-400'
                        }`}
                      >
                        <span>🚫 {isRu ? 'Недоступные языки' : 'Unavailable Languages'}</span>
                        <span>({courseLists.unavailableLanguageCourses.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { playSound('click'); setCourseListTab('non_language'); }}
                        className={`px-3 py-2 rounded-xl text-[11px] font-black transition-all cursor-pointer border text-left flex items-center justify-between ${
                          courseListTab === 'non_language'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : isLightMode
                            ? 'bg-white border-slate-200 text-slate-600'
                            : 'bg-[#101a20] border-[#253844] text-gray-400'
                        }`}
                      >
                        <span>🧩 {isRu ? 'Курсы не языки' : 'Non-Language Courses'}</span>
                        <span>({courseLists.nonLanguageCourses.length})</span>
                      </button>
                    </div>

                    {/* Tab Body */}
                    <div className="max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1">
                      {courseListTab === 'available' &&
                        courseLists.availableLanguageCourses.map((c) => {
                          const isCurrent = c.id === currentCourse.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                if (onSwitchCourse && !isCurrent) {
                                  playSound('click');
                                  onSwitchCourse(c);
                                  setToast(
                                    isRu
                                      ? `📻 DuoWindo6601Radio переключено на курс: ${c.localName || c.name}`
                                      : `📻 Switched DuoWindo6601Radio to: ${c.name}`
                                  );
                                }
                              }}
                              className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all ${
                                isCurrent
                                  ? 'bg-sky-500/25 border-sky-400 text-white'
                                  : isLightMode
                                  ? 'bg-white border-slate-200 hover:border-emerald-400 text-slate-800'
                                  : 'bg-[#101a20] border-[#253844] hover:border-emerald-500/60 text-gray-200'
                              } ${onSwitchCourse && !isCurrent ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-black truncate">{c.localName || c.name}</div>
                                <div className={`text-[10px] font-bold truncate ${subText}`}>
                                  {c.name} • {c.id.toUpperCase()}
                                  {c.isBeta ? ' • BETA' : ''}
                                </div>
                              </div>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 shrink-0">
                                {isCurrent ? (isRu ? 'ВЫБРАН' : 'ACTIVE') : 'AI + 🎧'}
                              </span>
                            </button>
                          );
                        })}

                      {courseListTab === 'unavailable' &&
                        courseLists.unavailableLanguageCourses.map((c) => (
                          <div
                            key={c.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                              isLightMode ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-rose-950/30 border-rose-500/30 text-rose-100'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-black truncate">{c.localName || c.name}</div>
                              <div className="text-[10px] font-bold opacity-80">
                                {c.name} • {c.id.toUpperCase()} • {isRu ? 'Без спикера (SAM Speech)' : 'No Radio / SAM Speech'}
                              </div>
                            </div>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-500/25 text-rose-300 shrink-0">
                              {isRu ? 'НЕ ДОСТУПЕН' : 'UNAVAILABLE'}
                            </span>
                          </div>
                        ))}

                      {courseListTab === 'non_language' &&
                        courseLists.nonLanguageCourses.map((c) => (
                          <div
                            key={c.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                              isLightMode ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/25 border-amber-500/30 text-amber-100'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-black truncate">{c.localName || c.name}</div>
                              <div className="text-[10px] font-bold opacity-80">
                                {c.name} • {c.id.toUpperCase()} • {isRu ? 'Предмет / Навык' : 'Subject / Skill'}
                              </div>
                            </div>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/25 text-amber-300 shrink-0">
                              {isRu ? 'НЕ ЯЗЫК' : 'NOT A LANG'}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Episodes Grid */}
              <div className="grid grid-cols-1 gap-3.5">
                {episodes.map((ep, idx) => {
                  const isDone = completedIds.includes(ep.id);
                  return (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => handleStartEpisode(ep)}
                      className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 border-b-4 transition-all flex items-center justify-between gap-4 group cursor-pointer active:translate-y-0.5 ${
                        isLightMode
                          ? 'bg-slate-50 hover:bg-sky-50/70 border-slate-200 hover:border-sky-400'
                          : 'bg-[#192830] hover:bg-[#1e323d] border-[#293d49] hover:border-sky-500/70'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-[#66DBFF] to-[#30B8F2] border-b-4 border-[#1B89C2] flex items-center justify-center text-2xl shadow-md shrink-0 group-hover:scale-105 transition-transform">
                          {ep.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">
                              {isRu ? `Выпуск #${idx + 1}` : `Episode #${idx + 1}`} • {ep.durationLabel} • {ep.levelBadge}
                            </span>
                            {ep.isAiGenerated && (
                              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                AI
                              </span>
                            )}
                            {isDone && (
                              <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                {isRu ? 'Прослушано' : 'Listened'}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base sm:text-lg font-black truncate">
                            {isRu ? ep.titleRu : ep.titleEn}
                          </h3>
                          <p className={`text-xs font-bold line-clamp-2 mt-0.5 ${subText}`}>
                            {isRu ? ep.descRu : ep.descEn}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center font-black shadow group-hover:scale-110 transition-transform">
                        ▶
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : isEpisodeComplete ? (
            /* ==================== EPISODE COMPLETION SCREEN ==================== */
            <div className="py-8 flex flex-col items-center text-center space-y-5 animate-in zoom-in-95">
              <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#66DBFF] to-[#30B8F2] border-b-8 border-[#1B89C2] flex items-center justify-center shadow-xl">
                <HeadphonesRadioIcon className="w-14 h-14" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-black text-sky-400">
                  {isRu ? 'Эфир успешно пройден!' : 'Podcast Episode Complete!'}
                </h3>
                <p className={`text-sm font-bold ${subText}`}>
                  {isRu
                    ? `Правильных ответов на аудирование: ${correctQuestionsCount} из ${activeEpisode.questions.length}`
                    : `Listening comprehension score: ${correctQuestionsCount} / ${activeEpisode.questions.length}`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className={`px-5 py-3 rounded-2xl border font-black text-amber-400 ${
                  isLightMode ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                  ⚡ +{user.difficultyLevel === 'hard' ? 35 : 30} XP
                </div>
                <div className={`px-5 py-3 rounded-2xl border font-black text-sky-400 ${
                  isLightMode ? 'bg-sky-50 border-sky-200' : 'bg-sky-500/10 border-sky-500/30'
                }`}>
                  💎 +5
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleStartEpisode(activeEpisode)}
                  className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider border cursor-pointer transition-all ${
                    isLightMode
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                      : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-white'
                  }`}
                >
                  🔁 {isRu ? 'Слушать снова' : 'Listen Again'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setActiveEpisode(null);
                  }}
                  className="px-6 py-3 rounded-2xl bg-duo-green hover:brightness-110 text-white font-black text-xs uppercase tracking-wider border-b-4 border-duo-greenDark active:border-b-0 active:translate-y-1 transition-all cursor-pointer"
                >
                  {isRu ? 'К другим выпускам' : 'More Episodes'}
                </button>
              </div>
            </div>
          ) : (
            /* ==================== ACTIVE PODCAST PLAYER & CHECKS ==================== */
            <div className="space-y-4">
              {/* Studio Player Artwork & Equalizer Card */}
              <div className="rounded-3xl bg-gradient-to-br from-[#134c70] via-[#176899] to-[#0f344d] p-5 text-white shadow-xl border border-sky-400/30 relative overflow-hidden">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-widest text-sky-200 flex items-center gap-2">
                      <span>🎙️ {isRu ? activeEpisode.showNameRu : activeEpisode.showNameEn}</span>
                      <span>•</span>
                      <span>{activeEpisode.levelBadge}</span>
                    </div>
                    <h3 className="text-xl font-black mt-0.5">
                      {isRu ? activeEpisode.titleRu : activeEpisode.titleEn}
                    </h3>
                  </div>

                  {/* Animated Podcast Equalizer */}
                  <div className="flex items-end gap-1 h-8 px-3 py-1.5 rounded-xl bg-black/25 border border-white/10" aria-hidden="true">
                    {[14, 24, 18, 28, 16, 22].map((h, i) => (
                      <span
                        key={i}
                        className={`w-1.5 rounded-full bg-sky-300 transition-all duration-300 ${
                          isPlaying ? 'animate-pulse' : 'opacity-45'
                        }`}
                        style={{
                          height: isPlaying ? `${h}px` : '6px',
                          animationDelay: `${i * 110}ms`
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Progress Track */}
                <div className="space-y-2">
                  <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#66DBFF] to-white rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.round(((currentCueIndex + 1) / Math.max(1, activeEpisode.cues.length)) * 100)}%`
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-sky-100/90">
                    <span>
                      {isRu
                        ? `Реплика ${currentCueIndex + 1} из ${activeEpisode.cues.length}`
                        : `Segment ${currentCueIndex + 1} of ${activeEpisode.cues.length}`}
                    </span>
                    <span>
                      {activeEpisode.cues[currentCueIndex]?.isFamiliarLang
                        ? (isRu ? '🎧 Пояснение в эфире' : '🎧 Audio note')
                        : (isRu ? `🎧 Язык курса: ${currentCourse.localName}` : `🎧 Course Audio: ${currentCourse.name}`)}
                    </span>
                  </div>
                </div>

                {/* Transport Controls */}
                <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const prev = Math.max(0, currentCueIndex - 1);
                        void playFromCue(prev, activeEpisode, false);
                      }}
                      disabled={currentCueIndex === 0}
                      className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-40 font-black text-xs cursor-pointer transition-colors"
                      title={isRu ? 'Предыдущая реплика' : 'Previous segment'}
                    >
                      ⏮
                    </button>

                    <button
                      type="button"
                      onClick={handleTogglePlayPause}
                      className="px-5 py-2.5 rounded-2xl bg-white text-sky-900 hover:bg-sky-50 font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>{isPlaying ? '⏸' : '▶'}</span>
                      <span>
                        {isPlaying
                          ? (isRu ? 'Пауза' : 'Pause')
                          : (isRu ? 'Слушать эфир' : 'Play Episode')}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.min(activeEpisode.cues.length - 1, currentCueIndex + 1);
                        void playFromCue(next, activeEpisode, false);
                      }}
                      disabled={currentCueIndex >= activeEpisode.cues.length - 1}
                      className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-40 font-black text-xs cursor-pointer transition-colors"
                      title={isRu ? 'Следующая реплика' : 'Next segment'}
                    >
                      ⏭
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const nextSlow = !isSlow;
                        setIsSlow(nextSlow);
                        playSound('select');
                        void playFromCue(currentCueIndex, activeEpisode, false, nextSlow);
                      }}
                      className={`px-3 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isSlow
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-white/15 hover:bg-white/25 text-white border-white/20'
                      }`}
                      title={isRu ? 'Переключить скорость 0.75x / 1.0x' : 'Toggle slow playback 0.75x / 1.0x'}
                    >
                      <TurtleIcon className="w-4 h-4" />
                      <span>{isSlow ? '0.75x' : '1.0x'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playSound('click');
                        setPureListeningMode((v) => !v);
                      }}
                      className={`px-3 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                        !pureListeningMode
                          ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                          : 'bg-white/15 hover:bg-white/25 text-white border-white/20'
                      }`}
                      title={isRu ? 'Скрыть или показать субтитры диалога' : 'Hide or show dialogue script'}
                    >
                      <EyeIcon className="w-4 h-4" />
                      <span>
                        {pureListeningMode
                          ? (isRu ? 'Показать текст' : 'Show Script')
                          : (isRu ? 'Только слух' : 'Audio Only')}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* MID OR FINAL COMPREHENSION CHECKPOINT OVERLAY CARD */}
              {activeQuestion && (
                <div className={`rounded-3xl p-5 border-2 shadow-xl space-y-4 animate-in slide-in-from-bottom-3 ${
                  isLightMode
                    ? 'bg-sky-50 border-sky-400 text-slate-900'
                    : 'bg-[#162934] border-sky-500 text-white'
                }`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-black uppercase tracking-wider text-sky-400">
                      {activeQuestion.stage === 'mid'
                        ? (isRu ? '🎧 Проверка понимания (в середине эфира)' : '🎧 Mid-Episode Listening Check')
                        : (isRu ? '🏆 Финальная проверка понимания' : '🏆 Final Listening Comprehension')}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        const targetCue = activeEpisode.cues[activeQuestion.replayCueIndex];
                        if (targetCue) {
                          const lang = targetCue.isFamiliarLang ? hostLang : normalizeCourseLangCode(activeEpisode.courseId);
                          void speakText(targetCue.text, lang, isSlow);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/40 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                    >
                      <VolumeIcon className="w-4 h-4" />
                      <span>{isRu ? 'Переслушать фрагмент' : 'Replay Audio'}</span>
                    </button>
                  </div>

                  <h4 className="text-base sm:text-lg font-black">
                    {isRu ? activeQuestion.questionRu : activeQuestion.questionEn}
                  </h4>

                  <div className="space-y-2.5">
                    {(isRu ? activeQuestion.optionsRu : activeQuestion.optionsEn).map((opt, idx) => {
                      const chosenIdx = answeredQuestions[activeQuestion.id];
                      const isAnswered = chosenIdx !== undefined;
                      const isRight = idx === activeQuestion.correctIndex;
                      const isSelected = idx === chosenIdx;

                      let btnStyle = isLightMode
                        ? 'bg-white border-slate-300 hover:border-sky-400 text-slate-800'
                        : 'bg-[#111c22] border-[#293d49] hover:border-sky-400 text-white';

                      if (isAnswered) {
                        if (isRight) {
                          btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300';
                        } else if (isSelected) {
                          btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
                        } else {
                          btnStyle = isLightMode
                            ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-70'
                            : 'bg-[#0e171c] border-gray-800 text-gray-500 opacity-70';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isAnswered}
                          onClick={() => handleAnswerQuestion(idx)}
                          className={`w-full text-left p-3.5 rounded-2xl border-2 font-bold text-sm transition-all flex items-center justify-between gap-2 cursor-pointer ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isAnswered && isRight && <span className="text-emerald-400 font-black">✓</span>}
                          {isAnswered && isSelected && !isRight && <span className="text-rose-400 font-black">✕</span>}
                        </button>
                      );
                    })}
                  </div>

                  {answeredQuestions[activeQuestion.id] !== undefined && (
                    <div className="pt-2 space-y-3">
                      <p className={`text-xs font-bold p-3 rounded-xl ${
                        isLightMode ? 'bg-white border border-slate-200 text-slate-700' : 'bg-black/25 text-sky-200'
                      }`}>
                        💡 {isRu ? activeQuestion.explanationRu : activeQuestion.explanationEn}
                      </p>
                      <button
                        type="button"
                        onClick={handleContinueAfterQuestion}
                        className="w-full py-3 rounded-2xl bg-duo-green hover:brightness-110 text-white font-black text-xs uppercase tracking-wider border-b-4 border-duo-greenDark active:border-b-0 active:translate-y-1 transition-all cursor-pointer"
                      >
                        {activeQuestion.afterCueIndex < activeEpisode.cues.length - 1
                          ? (isRu ? 'Продолжить прослушивание →' : 'Continue Episode →')
                          : (isRu ? 'Завершить выпуск (+30 XP)' : 'Finish Episode (+30 XP)')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* PODCAST CUES TIMELINE */}
              <div className="space-y-2.5">
                {activeEpisode.cues.map((cue, idx) => {
                  const isCurrent = idx === currentCueIndex;
                  const isHeard = idx <= currentCueIndex;
                  const hideTargetScript = pureListeningMode && !cue.isFamiliarLang;

                  return (
                    <div
                      key={cue.id}
                      onClick={() => {
                        if (!activeQuestion) {
                          void playFromCue(idx, activeEpisode, false);
                        }
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isCurrent
                          ? isLightMode
                            ? 'bg-sky-50 border-sky-400 shadow-md'
                            : 'bg-sky-950/45 border-sky-400 shadow-md'
                          : isHeard
                            ? isLightMode
                              ? 'bg-slate-50 border-slate-200'
                              : 'bg-[#18262e] border-[#253844]'
                            : isLightMode
                              ? 'bg-white border-slate-200 opacity-65'
                              : 'bg-[#111b20] border-[#1e2d36] opacity-65'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        cue.role === 'host' ? 'bg-emerald-500/20' : 'bg-sky-500/20'
                      }`}>
                        {cue.avatar}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-black text-[11px] uppercase tracking-wide text-sky-400">
                            {cue.isFamiliarLang
                              ? (isRu ? '🎧 Пояснение' : '🎧 Audio Note')
                              : (isRu ? `🎧 Фрагмент #${idx + 1}` : `🎧 Audio Segment #${idx + 1}`)}
                          </span>
                          <VolumeIcon className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-sky-400' : subText}`} />
                        </div>

                        {hideTargetScript ? (
                          <div className={`text-xs font-bold italic py-1 ${subText}`}>
                            {isRu
                              ? '🎧 Слушайте реплику на слух (нажмите «Показать текст», чтобы открыть расшифровку)'
                              : '🎧 Audio-only listening cue (tap “Show Script” to reveal text)'}
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-bold leading-snug">{cue.text}</p>
                            {!cue.isFamiliarLang && (
                              <p className={`text-xs font-medium mt-1 ${subText}`}>
                                {isRu ? cue.translationRu : cue.translationEn}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
