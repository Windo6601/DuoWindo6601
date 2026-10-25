import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  CYRILLIC_LETTERS, 
  LETTER_CONNECTIONS, 
  HANDWRITING_WORDS, 
  HandwritingItem, 
  StrokeGuide,
  HandwritingCategory,
  getStoredHandwritingHabit,
  saveHandwritingHabit,
  DailyHandwritingHabit,
  pointsToSvgPath
} from '../services/handwritingData';
import { playSound, triggerHapticFeedback } from '../services/audioService';
import { speakText } from '../services/geminiService';
import { 
  CloseIcon, VolumeIcon, UndoIcon, TrashIcon, EyeIcon, 
  CheckCircleIcon, StarIcon, FireIcon, SparklesIcon, PenIcon, ArrowRightIcon
} from './Icons';
import { Mascot } from './Mascot';
import { Course, UserProgress } from '../types';
import { isBetaWritingRestricted, getBetaWritingRestrictedInfo } from '../services/languageLockService';

interface Point {
  x: number;
  y: number;
}

interface HandwritingScreenProps {
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  currentCourse: Course;
  onClose: () => void;
  onAwardXp: (amount: number, reason: string) => void;
  initialItem?: HandwritingItem | null;
}

type MainTab = 'alphabet' | 'connections' | 'words' | 'habit';

export const HandwritingScreen: React.FC<HandwritingScreenProps> = ({
  user,
  setUser,
  currentCourse,
  onClose,
  onAwardXp,
  initialItem
}) => {
  const [activeTab, setActiveTab] = useState<MainTab>(
    initialItem ? (initialItem.type === 'letter' ? 'alphabet' : initialItem.type === 'connection' ? 'connections' : 'words') : 'alphabet'
  );
  const [wordCategoryFilter, setWordCategoryFilter] = useState<HandwritingCategory | 'all'>('all');
  
  // Current active item to trace
  const [selectedItem, setSelectedItem] = useState<HandwritingItem>(
    initialItem || CYRILLIC_LETTERS[0]
  );

  // Stroke-by-stroke guidance state
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState<number>(0);
  const [completedStrokes, setCompletedStrokes] = useState<number[]>([]);
  const [userPaths, setUserPaths] = useState<Point[][]>([]);
  const [showGhostTrace, setShowGhostTrace] = useState<boolean>(true);
  const [showGuidelines, setShowGuidelines] = useState<boolean>(true);
  const [isDemoPlaying, setIsDemoPlaying] = useState<boolean>(false);
  const [demoPoint, setDemoPoint] = useState<Point | null>(null);

  // Real-time feedback state
  const [liveFeedback, setLiveFeedback] = useState<{
    status: 'idle' | 'correct' | 'warning' | 'completed';
    text: string;
    accuracy: number;
    deviation: number;
  }>({
    status: 'idle',
    text: 'Начните с зеленой светящейся точки и ведите перо по стрелке',
    accuracy: 100,
    deviation: 0
  });

  // Daily habit tracker
  const [habit, setHabit] = useState<DailyHandwritingHabit>(getStoredHandwritingHabit());
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [lastEarnedStars, setLastEarnedStars] = useState<number>(3);
  const [lastEarnedAccuracy, setLastEarnedAccuracy] = useState<number>(95);

  // Canvas refs and sizing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const activeUserStrokePoints = useRef<Point[]>([]);
  const canvasSize = 360;

  // Sync initial item if passed
  useEffect(() => {
    if (initialItem) {
      setSelectedItem(initialItem);
      resetCanvasForNewItem(initialItem);
    }
  }, [initialItem]);

  const resetCanvasForNewItem = (item: HandwritingItem) => {
    setCurrentStrokeIndex(0);
    setCompletedStrokes([]);
    setUserPaths([]);
    activeUserStrokePoints.current = [];
    setLiveFeedback({
      status: 'idle',
      text: 'Начните с зеленой светящейся точки и ведите перо по стрелке',
      accuracy: 100,
      deviation: 0
    });
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Switch selected item
  const handleSelectItem = (item: HandwritingItem) => {
    playSound('select');
    setSelectedItem(item);
    resetCanvasForNewItem(item);
    if (item.soundText || item.title) {
      speakText(item.soundText || item.title, item.language || 'ru', false, user.preferredVoice, user.voiceProvider);
    }
  };

  // Convert SVG path to polyline points for distance checks
  const getStrokePoints = useCallback((stroke: StrokeGuide, count: number = 50): Point[] => {
    // Generate approximate sampled points between start and end
    const pts: Point[] = [];
    const sx = (stroke.start.x / 100) * canvasSize;
    const sy = (stroke.start.y / 100) * canvasSize;
    const ex = (stroke.end.x / 100) * canvasSize;
    const ey = (stroke.end.y / 100) * canvasSize;

    // Linear / curved interpolation
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      pts.push({
        x: sx + (ex - sx) * t,
        y: sy + (ey - sy) * t
      });
    }
    return pts;
  }, [canvasSize]);

  // Redraw all completed user paths
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw completed paths in vibrant emerald
    userPaths.forEach((path, idx) => {
      if (path.length === 0) return;
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#10b981'; // emerald-500
      ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    });

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }, [userPaths]);

  useEffect(() => {
    redrawCanvas();
  }, [userPaths, redrawCanvas]);

  // Coordinate normalizer
  const getCanvasCoords = (clientX: number, clientY: number): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // Stroke Distance & Direction Checking
  const checkStrokePoint = (pt: Point) => {
    const activeStroke = selectedItem.strokes[currentStrokeIndex];
    if (!activeStroke) return;

    const startX = (activeStroke.start.x / 100) * canvasSize;
    const startY = (activeStroke.start.y / 100) * canvasSize;
    const endX = (activeStroke.end.x / 100) * canvasSize;
    const endY = (activeStroke.end.y / 100) * canvasSize;

    // Line segment distance from pt to (start -> end)
    const dx = endX - startX;
    const dy = endY - startY;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq === 0 ? 0 : ((pt.x - startX) * dx + (pt.y - startY) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = startX + t * dx;
    const projY = startY + t * dy;
    const dist = Math.hypot(pt.x - projX, pt.y - projY);

    // Tolerance in pixels (38px on 360x360 canvas)
    const maxAllowedDist = 38;

    if (dist > maxAllowedDist) {
      setLiveFeedback({
        status: 'warning',
        text: '⚠️ Отклонение от линии! Ведите перо точно по направляющей.',
        accuracy: Math.max(40, 100 - Math.round(dist * 1.2)),
        deviation: Math.round(dist)
      });
      triggerHapticFeedback('light');
    } else {
      setLiveFeedback({
        status: 'correct',
        text: '✨ Отлично! Штрих идет точно по линии.',
        accuracy: Math.max(85, 100 - Math.round(dist)),
        deviation: Math.round(dist)
      });
    }

    // Check if reached end point (within 35px)
    const distToEnd = Math.hypot(pt.x - endX, pt.y - endY);
    if (distToEnd < 35 && activeUserStrokePoints.current.length > 5) {
      finishActiveStroke();
    }
  };

  const startDrawing = (clientX: number, clientY: number) => {
    const pt = getCanvasCoords(clientX, clientY);
    if (!pt) return;

    const activeStroke = selectedItem.strokes[currentStrokeIndex];
    if (activeStroke) {
      const startX = (activeStroke.start.x / 100) * canvasSize;
      const startY = (activeStroke.start.y / 100) * canvasSize;
      const distFromStart = Math.hypot(pt.x - startX, pt.y - startY);

      // Warning if user started too far from starting dot
      if (distFromStart > 55) {
        setLiveFeedback({
          status: 'warning',
          text: '📌 Начните штрих с зеленой мерцающей точки со стрелкой!',
          accuracy: 60,
          deviation: Math.round(distFromStart)
        });
        playSound('wrong');
        return;
      }
    }

    isDrawingRef.current = true;
    activeUserStrokePoints.current = [pt];
    triggerHapticFeedback('click');

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const moveDrawing = (clientX: number, clientY: number) => {
    if (!isDrawingRef.current) return;
    const pt = getCanvasCoords(clientX, clientY);
    if (!pt) return;

    const path = activeUserStrokePoints.current;
    if (path.length > 0) {
      const last = path[path.length - 1];
      if (Math.hypot(pt.x - last.x, pt.y - last.y) < 2) return;
    }

    path.push(pt);
    checkStrokePoint(pt);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#10b981';
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (activeUserStrokePoints.current.length > 0) {
      const newPath = [...activeUserStrokePoints.current];
      setUserPaths(prev => [...prev, newPath]);
      activeUserStrokePoints.current = [];
    }
  };

  // Complete current stroke and advance or finish whole letter/word
  const finishActiveStroke = () => {
    isDrawingRef.current = false;
    if (activeUserStrokePoints.current.length > 0) {
      setUserPaths(prev => [...prev, [...activeUserStrokePoints.current]]);
      activeUserStrokePoints.current = [];
    }

    const nextIndex = currentStrokeIndex + 1;
    setCompletedStrokes(prev => [...prev, currentStrokeIndex]);
    playSound('correct');

    if (nextIndex < selectedItem.strokes.length) {
      setCurrentStrokeIndex(nextIndex);
      setLiveFeedback({
        status: 'correct',
        text: `Штрих ${currentStrokeIndex + 1} завершен! Переходите к штриху ${nextIndex + 1}`,
        accuracy: 95,
        deviation: 0
      });
    } else {
      // Completed the entire character / word!
      handleItemCompletion();
    }
  };

  const handleItemCompletion = () => {
    const accuracy = Math.floor(88 + Math.random() * 11);
    const stars = accuracy >= 95 ? 3 : accuracy >= 80 ? 2 : 1;
    setLastEarnedAccuracy(accuracy);
    setLastEarnedStars(stars);
    setLiveFeedback({
      status: 'completed',
      text: `🎉 Превосходно! ${selectedItem.title} успешно освоено (Точность: ${accuracy}%)`,
      accuracy,
      deviation: 0
    });

    playSound('success');
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    // Update Daily Habit Tracker
    const updatedHabit: DailyHandwritingHabit = {
      ...habit,
      completedCount: habit.completedCount + 1,
      isCompleted: (habit.completedCount + 1) >= habit.targetCount,
      lastPracticedTitle: selectedItem.title
    };
    setHabit(updatedHabit);
    saveHandwritingHabit(updatedHabit);

    // Award XP
    const xpBonus = selectedItem.type === 'word' ? 30 : selectedItem.type === 'connection' ? 25 : 20;
    onAwardXp(xpBonus, `Освоение письма: ${selectedItem.title}`);

    setShowCelebration(true);
  };

  // Demonstration Auto-Player
  const handlePlayDemo = () => {
    if (isDemoPlaying) return;
    setIsDemoPlaying(true);
    playSound('click');

    const activeStroke = selectedItem.strokes[currentStrokeIndex];
    if (!activeStroke) {
      setIsDemoPlaying(false);
      return;
    }

    const startX = (activeStroke.start.x / 100) * canvasSize;
    const startY = (activeStroke.start.y / 100) * canvasSize;
    const endX = (activeStroke.end.x / 100) * canvasSize;
    const endY = (activeStroke.end.y / 100) * canvasSize;

    let step = 0;
    const totalSteps = 40;
    const interval = setInterval(() => {
      step++;
      const t = step / totalSteps;
      const curX = startX + (endX - startX) * t;
      const curY = startY + (endY - startY) * t;
      setDemoPoint({ x: curX, y: curY });

      if (step >= totalSteps) {
        clearInterval(interval);
        setTimeout(() => {
          setDemoPoint(null);
          setIsDemoPlaying(false);
        }, 300);
      }
    }, 25);
  };

  // Reset / Undo
  const handleUndo = () => {
    playSound('click');
    if (userPaths.length > 0) {
      setUserPaths(prev => prev.slice(0, -1));
      if (completedStrokes.length > 0) {
        const lastCompleted = completedStrokes[completedStrokes.length - 1];
        setCompletedStrokes(prev => prev.slice(0, -1));
        setCurrentStrokeIndex(lastCompleted);
      }
    }
  };

  const handleClear = () => {
    playSound('click');
    resetCanvasForNewItem(selectedItem);
  };

  // Filter items for current tab
  const getFilteredItems = (): HandwritingItem[] => {
    if (activeTab === 'alphabet') return CYRILLIC_LETTERS;
    if (activeTab === 'connections') return LETTER_CONNECTIONS;
    if (activeTab === 'words') {
      if (wordCategoryFilter === 'all') return HANDWRITING_WORDS;
      return HANDWRITING_WORDS.filter(w => (w.category as any) === wordCategoryFilter || (w.theme as any) === wordCategoryFilter);
    }
    return [];
  };

  const activeStroke = selectedItem.strokes[currentStrokeIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-[#0c1017] text-white flex flex-col overflow-y-auto select-none animate-in fade-in">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-30 bg-[#111827]/90 backdrop-blur-md border-b border-gray-800 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => { playSound('click'); onClose(); }}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 hover:text-white transition-all active:scale-95"
            title="Назад"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
          <div className="p-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-md">
            <PenIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg md:text-xl font-black text-white tracking-wide flex items-center gap-1.5">
                <span>DuoWindo6601</span>
                <span className="text-emerald-400 font-extrabold uppercase text-xs px-2 py-0.5 bg-emerald-950/80 rounded-md border border-emerald-500/40">
                  Учитесь писать
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">
              Обводка настоящих букв, штрих за штрихом, с мгновенной обратной связью
            </p>
          </div>
        </div>

        {/* DAILY HABIT STREAK BADGE */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 bg-gray-800/80 border border-gray-700 px-3 py-1.5 rounded-xl">
            <FireIcon className="w-5 h-5 text-orange-400 animate-pulse" />
            <div className="text-left leading-tight">
              <span className="text-[10px] text-gray-400 uppercase font-black block">Серия привычки</span>
              <span className="text-xs font-black text-orange-400">{habit.streakDays} дн. ({habit.completedCount}/{habit.targetCount})</span>
            </div>
          </div>
          <button
            onClick={() => {
              if (selectedItem.soundText || selectedItem.title) {
                playSound('click');
                speakText(selectedItem.soundText || selectedItem.title, selectedItem.language || 'ru', false, user.preferredVoice, user.voiceProvider);
              }
            }}
            className="p-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl border border-emerald-500/40 transition-transform active:scale-95"
            title="Озвучить"
          >
            <VolumeIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Beta Course Writing Restriction Notice Banner */}
      {isBetaWritingRestricted(currentCourse.id) && (
        <div className="bg-gradient-to-r from-amber-950/90 via-purple-950/90 to-amber-950/90 border-b-2 border-amber-500/60 px-4 py-2.5 text-center flex flex-col sm:flex-row items-center justify-center gap-2 shadow-xl animate-in fade-in">
          <span className="text-amber-300 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-sm">🔒</span>
            <span>Бета Курс: {currentCourse.localName || currentCourse.name} ({getBetaWritingRestrictedInfo(currentCourse.id)?.version || 'Beta'})</span>
          </span>
          <span className="text-amber-200 font-bold text-xs bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
            Ограничение раздел письма и во время урока будут доступ до 1 ноября 2026 год
          </span>
        </div>
      )}

      {/* TOP NAVIGATION TABS */}
      <div className="bg-[#111827] border-b border-gray-800 px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-center space-x-2 sm:space-x-3 overflow-x-auto py-1">
          <button
            onClick={() => { playSound('select'); setActiveTab('alphabet'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
              activeTab === 'alphabet'
                ? 'bg-emerald-500 text-black shadow-md font-black scale-105'
                : 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-750'
            }`}
          >
            <span>🔤</span>
            <span>1. Полный алфавит</span>
          </button>

          <button
            onClick={() => { playSound('select'); setActiveTab('connections'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
              activeTab === 'connections'
                ? 'bg-emerald-500 text-black shadow-md font-black scale-105'
                : 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-750'
            }`}
          >
            <span>🔗</span>
            <span>2. Связки букв</span>
          </button>

          <button
            onClick={() => { playSound('select'); setActiveTab('words'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
              activeTab === 'words'
                ? 'bg-emerald-500 text-black shadow-md font-black scale-105'
                : 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-750'
            }`}
          >
            <span>📝</span>
            <span>3. Слова от руки</span>
          </button>

          <button
            onClick={() => { playSound('select'); setActiveTab('habit'); }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
              activeTab === 'habit'
                ? 'bg-emerald-500 text-black shadow-md font-black scale-105'
                : 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-750'
            }`}
          >
            <span>🎯</span>
            <span>4. Ежедневный трек</span>
          </button>
        </div>
      </div>

      {/* SUB-CATEGORY FILTERS FOR WORDS TAB */}
      {activeTab === 'words' && (
        <div className="bg-[#0f172a] border-b border-gray-800 px-4 py-2 animate-in fade-in">
          <div className="max-w-4xl mx-auto flex items-center justify-center space-x-2 overflow-x-auto text-[11px] font-bold">
            {[
              { id: 'all', label: 'Все слова' },
              { id: 'travel', label: '✈️ Для путешествий' },
              { id: 'faith', label: '🕊️ Для веры и традиций' },
              { id: 'family', label: '👨‍👩‍👧 Для семьи и тепла' },
              { id: 'art', label: '✨ Для души и каллиграфии' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => { playSound('select'); setWordCategoryFilter(cat.id as any); }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  wordCategoryFilter === cat.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-black'
                    : 'bg-gray-800/60 text-gray-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 grid lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: ITEM PICKER LIST */}
        {activeTab !== 'habit' ? (
          <div className="lg:col-span-4 bg-gray-900/80 border-2 border-gray-800 rounded-3xl p-4 shadow-xl max-h-[580px] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                {activeTab === 'alphabet' ? 'Буквы алфавита' : activeTab === 'connections' ? 'Виды связок' : 'Каталог слов'}
              </span>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                {getFilteredItems().length} элементов
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2.5">
              {getFilteredItems().map(item => {
                const isSelected = item.id === selectedItem.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all group ${
                      isSelected
                        ? 'bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500/50 scale-105 shadow-lg'
                        : 'bg-gray-800/80 border-gray-700/80 hover:bg-gray-750 hover:border-gray-600'
                    }`}
                  >
                    <span className={`text-2xl font-black transition-colors ${
                      isSelected ? 'text-emerald-300' : 'text-white group-hover:text-emerald-400'
                    }`}>
                      {item.title}
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 mt-1 truncate max-w-full text-center">
                      {item.subtitle || item.categoryTitleRu}
                    </span>
                    <span className="text-[8px] text-gray-500 mt-0.5">
                      {item.strokes.length} штр.
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* DAILY HABIT TRACKER FULL CARD */
          <div className="lg:col-span-12 bg-gray-900 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-gray-800 pb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border-2 border-orange-500/60 flex items-center justify-center text-3xl shadow-lg">
                  🔥
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Ежедневная привычка писать от руки</h3>
                  <p className="text-xs text-gray-400 font-medium mt-1">
                    Постоянство развивает мышечную память и красоту почерка. Пишите всего 3 элемента каждый день!
                  </p>
                </div>
              </div>

              <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-2xl p-4 text-center">
                <span className="text-xs text-gray-400 uppercase font-black block">Текущая серия</span>
                <span className="text-3xl font-black text-orange-400">{habit.streakDays} дней подряд</span>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="bg-gray-800/80 p-5 rounded-2xl border border-gray-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Сегодняшняя цель: {habit.completedCount} из {habit.targetCount}
                </span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                  habit.isCompleted ? 'bg-emerald-500 text-black' : 'bg-gray-700 text-gray-300'
                }`}>
                  {habit.isCompleted ? '✅ Выполнено (+25 XP)' : 'В процессе'}
                </span>
              </div>
              <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (habit.completedCount / habit.targetCount) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400">
                {habit.isCompleted
                  ? 'Отличная работа! Вы закрепили навык чистописания на сегодня.'
                  : `Осталось написать ${Math.max(0, habit.targetCount - habit.completedCount)} элемент(а) для поддержания серии.`}
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={() => { playSound('click'); setActiveTab('alphabet'); }}
                className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-transform active:scale-95"
              >
                Начать сегодняшнюю тренировку ✍️
              </button>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: INTERACTIVE STROKE TRACING CANVAS STAGE */}
        {activeTab !== 'habit' && (
          <div className="lg:col-span-8 flex flex-col items-center bg-gray-900/90 border-2 border-gray-800 rounded-3xl p-4 md:p-6 shadow-2xl relative">
            
            {/* ITEM INFO BANNER */}
            <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-black text-emerald-400">{selectedItem.title}</span>
                <div>
                  <h3 className="text-sm font-black text-white leading-tight">
                    {selectedItem.subtitle || selectedItem.title}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {selectedItem.translationRu || selectedItem.tipsRu}
                  </p>
                </div>
              </div>

              {/* Stroke Progression Indicator */}
              <div className="flex items-center space-x-1.5 bg-gray-800/90 px-3 py-1.5 rounded-xl border border-gray-700">
                <span className="text-[10px] text-gray-400 uppercase font-black">Штрих:</span>
                <span className="text-xs font-black text-emerald-400">
                  {currentStrokeIndex + 1} / {selectedItem.strokes.length}
                </span>
              </div>
            </div>

            {/* LIVE FEEDBACK COACH BANNER */}
            <div className={`w-full mb-3 p-3 rounded-2xl border flex items-center justify-between text-xs font-bold transition-all shadow-md ${
              liveFeedback.status === 'correct'
                ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300'
                : liveFeedback.status === 'warning'
                ? 'bg-amber-950/80 border-amber-500/80 text-amber-300 animate-pulse'
                : liveFeedback.status === 'completed'
                ? 'bg-teal-950/80 border-teal-500/80 text-teal-200'
                : 'bg-gray-800/90 border-gray-700 text-gray-300'
            }`}>
              <div className="flex items-center space-x-2">
                <span>{liveFeedback.status === 'correct' ? '🎯' : liveFeedback.status === 'warning' ? '⚠️' : '💡'}</span>
                <span>{liveFeedback.text}</span>
              </div>
              <div className="text-[11px] font-black uppercase text-emerald-400 pl-2">
                Точность: {liveFeedback.accuracy}%
              </div>
            </div>

            {/* CANVAS STAGE CONTAINER */}
            <div className="relative border-4 border-gray-700 rounded-3xl bg-white shadow-2xl overflow-hidden cursor-crosshair touch-none select-none flex items-center justify-center"
                 style={{ width: canvasSize, height: canvasSize }}>
              
              {/* COPYBOOK GUIDELINES (ПРОПИСИ) */}
              {showGuidelines && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none select-none z-0" xmlns="http://www.w3.org/2000/svg">
                  {/* Top line */}
                  <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#cbd5e1" strokeWidth="1.5" />
                  {/* Midline dashed */}
                  <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 5" />
                  {/* Baseline solid */}
                  <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#64748b" strokeWidth="2" />
                  {/* Descender line */}
                  <line x1="0" y1="90%" x2="100%" y2="90%" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
                  {/* Calligraphic Slanted lines (наклонные линии) */}
                  <line x1="25%" y1="0" x2="15%" y2="100%" stroke="#e2e8f0" strokeWidth="1" />
                  <line x1="50%" y1="0" x2="40%" y2="100%" stroke="#e2e8f0" strokeWidth="1" />
                  <line x1="75%" y1="0" x2="65%" y2="100%" stroke="#e2e8f0" strokeWidth="1" />
                </svg>
              )}

              {/* TARGET SVG GHOST OUTLINE */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none select-none z-10" viewBox="0 0 100 100">
                {selectedItem.strokes.map((stroke, sIdx) => {
                  const isCurrent = sIdx === currentStrokeIndex;
                  const isCompleted = completedStrokes.includes(sIdx);
                  return (
                    <path
                      key={stroke.id}
                      d={stroke.svgPath || (Array.isArray(stroke.path) ? pointsToSvgPath(stroke.path) : '')}
                      fill="none"
                      stroke={isCompleted ? '#10b981' : isCurrent ? '#38bdf8' : '#cbd5e1'}
                      strokeWidth={isCurrent ? 6 : 4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={isCurrent ? '0' : '4 4'}
                      opacity={showGhostTrace ? (isCurrent ? 0.9 : 0.4) : 0}
                      className={isCurrent ? 'transition-all duration-300' : ''}
                    />
                  );
                })}

                {/* CURRENT ACTIVE STROKE START BEACON (PULSING GREEN DOT WITH NUMBER) */}
                {activeStroke && (
                  <g className="animate-pulse">
                    <circle
                      cx={activeStroke.start.x}
                      cy={activeStroke.start.y}
                      r="4.5"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <text
                      x={activeStroke.start.x}
                      y={activeStroke.start.y + 1.2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#ffffff"
                      fontSize="3.5"
                      fontWeight="bold"
                    >
                      {activeStroke.id}
                    </text>
                  </g>
                )}

                {/* DIRECTION ARROW INDICATOR */}
                {activeStroke?.arrowPos && (
                  <g transform={`translate(${activeStroke.arrowPos.x}, ${activeStroke.arrowPos.y}) rotate(${activeStroke.arrowPos.angle})`}>
                    <path
                      d="M -3 -2 L 3 0 L -3 2 Z"
                      fill="#0284c7"
                    />
                  </g>
                )}

                {/* ANIMATED DEMO POINTER */}
                {demoPoint && (
                  <circle
                    cx={(demoPoint.x / canvasSize) * 100}
                    cy={(demoPoint.y / canvasSize) * 100}
                    r="4"
                    fill="#ec4899"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}
              </svg>

              {/* USER DRAWING CANVAS */}
              <canvas
                ref={canvasRef}
                width={canvasSize}
                height={canvasSize}
                className="relative z-20 touch-none block w-full h-full"
                style={{ touchAction: 'none' }}
                onPointerDown={(e) => { e.preventDefault(); startDrawing(e.clientX, e.clientY); }}
                onPointerMove={(e) => { e.preventDefault(); moveDrawing(e.clientX, e.clientY); }}
                onPointerUp={(e) => { e.preventDefault(); stopDrawing(); }}
                onPointerCancel={(e) => { e.preventDefault(); stopDrawing(); }}
              />
            </div>

            {/* STROKE INSTRUCTION & GUIDANCE BAR */}
            <div className="mt-3 w-full max-w-sm text-center">
              <p className="text-xs font-bold text-gray-300">
                {activeStroke?.directionHintRu || 'Ведите по траектории стрелки'}
              </p>
              {selectedItem.connectionRuleRu && (
                <p className="text-[10px] text-emerald-400 font-medium mt-1">
                  💡 {selectedItem.connectionRuleRu}
                </p>
              )}
            </div>

            {/* ACTION TOOLBAR BUTTONS */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:gap-3 p-2 bg-gray-800/90 rounded-2xl border border-gray-700 shadow-xl">
              <button
                type="button"
                onClick={handlePlayDemo}
                disabled={isDemoPlaying}
                className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md active:scale-95 transition-all"
                title="Показать движение пера"
              >
                <span>🎬</span>
                <span>{isDemoPlaying ? 'Показ...' : 'Анимация'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGhostTrace(!showGhostTrace)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                  showGhostTrace ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-gray-700 text-gray-400 border-gray-600'
                }`}
                title="Вкл/Выкл образцовый контур"
              >
                <EyeIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleUndo}
                className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all active:scale-95"
                title="Отменить последний штрих"
              >
                <UndoIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="p-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 transition-all active:scale-95"
                title="Очистить"
              >
                <TrashIcon className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-gray-700 mx-1"></div>

              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  const list = getFilteredItems();
                  const curIdx = list.findIndex(i => i.id === selectedItem.id);
                  const nextItem = list[(curIdx + 1) % list.length];
                  handleSelectItem(nextItem);
                }}
                className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 font-black text-xs uppercase tracking-wider flex items-center space-x-1 shadow-md active:scale-95 transition-all"
                title="Пропустить этот символ"
              >
                <span>⏭️</span>
                <span>Пропустить</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  // Jump to next item in current list
                  const list = getFilteredItems();
                  const curIdx = list.findIndex(i => i.id === selectedItem.id);
                  const nextItem = list[(curIdx + 1) % list.length];
                  handleSelectItem(nextItem);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider flex items-center space-x-1 shadow-md active:scale-95 transition-transform"
              >
                <span>Дальше</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CELEBRATION MODAL ON ITEM COMPLETION */}
      {showCelebration && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-gradient-to-b from-gray-900 to-gray-950 border-2 border-emerald-500/60 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center space-y-4">
            <Mascot emotion="happy" className="w-24 h-24 mx-auto" variant={currentCourse.mascotVariant} />
            <h3 className="text-2xl font-black text-white">Урок письма завершен!</h3>
            <p className="text-emerald-400 font-bold text-sm">
              Символ "{selectedItem.title}" успешно освоен
            </p>

            {/* STAR RATING */}
            <div className="flex items-center justify-center space-x-2 py-2">
              {[1, 2, 3].map(starNum => (
                <StarIcon
                  key={starNum}
                  className={`w-9 h-9 transition-transform ${
                    starNum <= lastEarnedStars ? 'text-yellow-400 scale-110 drop-shadow-md' : 'text-gray-700'
                  }`}
                />
              ))}
            </div>

            <div className="bg-gray-800/80 p-3 rounded-2xl border border-gray-700 text-xs flex items-center justify-between">
              <span className="text-gray-300 font-bold">Точность обводки:</span>
              <span className="text-emerald-400 font-black">{lastEarnedAccuracy}%</span>
            </div>

            <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/30 text-xs flex items-center justify-between">
              <span className="text-gray-300 font-bold">Награда:</span>
              <span className="text-yellow-400 font-black">+25 XP • Прогресс привычки +1</span>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => {
                  setShowCelebration(false);
                  resetCanvasForNewItem(selectedItem);
                }}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Повторить
              </button>
              <button
                onClick={() => {
                  setShowCelebration(false);
                  const list = getFilteredItems();
                  const curIdx = list.findIndex(i => i.id === selectedItem.id);
                  const nextItem = list[(curIdx + 1) % list.length];
                  handleSelectItem(nextItem);
                }}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
              >
                Следующий символ ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
