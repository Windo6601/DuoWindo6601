import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  HandwritingItem,
  StrokeGuide,
  StrokePoint,
  ALPHABET_HANDWRITING_ITEMS,
  LIGATURE_HANDWRITING_ITEMS,
  WORD_HANDWRITING_ITEMS,
  getDailyHandwritingWorkout
} from '../services/handwritingData';
import { playSound, triggerHapticFeedback } from '../services/audioService';
import { UserProgress } from '../types';
import { speakText } from '../services/geminiService';

interface HandwritingMasterProps {
  user: UserProgress;
  onUpdateUser: (updater: (prev: UserProgress) => UserProgress) => void;
  onBack: () => void;
  onToast: (msg: string) => void;
  initialChar?: string;
  isLightMode?: boolean;
}

type PracticeMode = 'guided' | 'test' | 'demo';
type StageTab = 'alphabet' | 'forms' | 'words' | 'daily';

export const HandwritingMaster: React.FC<HandwritingMasterProps> = ({
  user,
  onUpdateUser,
  onBack,
  onToast,
  initialChar,
  isLightMode = false
}) => {
  const isRu = user.language !== 'en';

  // Tabs and selection
  const [currentTab, setCurrentTab] = useState<StageTab>('alphabet');
  const [selectedCategoryTheme, setSelectedCategoryTheme] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<HandwritingItem>(() => {
    if (initialChar) {
      const match = [...ALPHABET_HANDWRITING_ITEMS, ...LIGATURE_HANDWRITING_ITEMS, ...WORD_HANDWRITING_ITEMS].find(
        item => item.char.toLowerCase() === initialChar.toLowerCase()
      );
      if (match) return match;
    }
    return ALPHABET_HANDWRITING_ITEMS[0];
  });

  // Practice state
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('guided');
  const [currentStrokeIdx, setCurrentStrokeIdx] = useState<number>(0);
  const [completedStrokes, setCompletedStrokes] = useState<StrokePoint[][]>([]);
  const [currentDrawingStroke, setCurrentDrawingStroke] = useState<StrokePoint[]>([]);
  const [accuracyScore, setAccuracyScore] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showGuidelines, setShowGuidelines] = useState<boolean>(true);
  const [showGhost, setShowGhost] = useState<boolean>(true);
  const [ghostOpacity, setGhostOpacity] = useState<number>(0.28);
  const [penColor, setPenColor] = useState<string>('#3b82f6');
  const [penWidth, setPenWidth] = useState<number>(8);

  // Demo playback
  const [isDemoPlaying, setIsDemoPlaying] = useState<boolean>(false);
  const [demoPoint, setDemoPoint] = useState<StrokePoint | null>(null);
  const demoAnimRef = useRef<number | null>(null);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPointerDownRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canvasDim, setCanvasDim] = useState<{ w: number; h: number }>({ w: 420, h: 420 });

  // Daily challenge data
  const dailyItems = useMemo(() => getDailyHandwritingWorkout(), []);

  // Filtered item list
  const currentList = useMemo(() => {
    if (currentTab === 'daily') return dailyItems;
    if (currentTab === 'alphabet') return ALPHABET_HANDWRITING_ITEMS;
    if (currentTab === 'forms') return LIGATURE_HANDWRITING_ITEMS;
    if (currentTab === 'words') {
      if (selectedCategoryTheme === 'all') return WORD_HANDWRITING_ITEMS;
      return WORD_HANDWRITING_ITEMS.filter(item => item.theme === selectedCategoryTheme);
    }
    return ALPHABET_HANDWRITING_ITEMS;
  }, [currentTab, selectedCategoryTheme, dailyItems]);

  // Responsive canvas size adjustment
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const availWidth = Math.min(rect.width - 24, 520);
      const isMobile = window.innerWidth < 768;
      const targetDim = isMobile ? Math.max(280, Math.min(availWidth, 380)) : Math.max(340, Math.min(availWidth, 480));
      setCanvasDim({ w: targetDim, h: targetDim });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Reset drawing when item changes
  useEffect(() => {
    resetCanvas();
  }, [selectedItem]);

  const resetCanvas = useCallback(() => {
    setCurrentStrokeIdx(0);
    setCompletedStrokes([]);
    setCurrentDrawingStroke([]);
    setAccuracyScore(null);
    setIsCompleted(false);
    setFeedbackMessage(null);
    if (demoAnimRef.current) {
      cancelAnimationFrame(demoAnimRef.current);
      demoAnimRef.current = null;
    }
    setIsDemoPlaying(false);
    setDemoPoint(null);
  }, []);

  // Calculate distance between two points in normalized 0-100 system
  const dist = (p1: StrokePoint, p2: StrokePoint) => {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  };

  // Convert canvas pixel point to normalized 0-100 coordinate
  const getNormalizedPoint = useCallback((clientX: number, clientY: number): StrokePoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  }, []);

  // Check stroke accuracy against current target stroke
  const evaluateStroke = useCallback((userStroke: StrokePoint[], targetGuide: StrokeGuide): { success: boolean; accuracy: number; msg: string } => {
    if (!userStroke || userStroke.length < 3) {
      return { success: false, accuracy: 0, msg: isRu ? 'Слишком короткий штрих' : 'Stroke too short' };
    }

    const startUser = userStroke[0];
    const endUser = userStroke[userStroke.length - 1];
    const startTarget = targetGuide.startPoint;
    const endTarget = targetGuide.endPoint;

    // 1. Check start point proximity
    const startDist = dist(startUser, startTarget);
    // 2. Check end point proximity
    const endDist = dist(endUser, endTarget);

    // 3. Direction vector check (ensure user did not write backwards)
    const targetDx = endTarget.x - startTarget.x;
    const targetDy = endTarget.y - startTarget.y;
    const userDx = endUser.x - startUser.x;
    const userDy = endUser.y - startUser.y;
    const dotProduct = (targetDx * userDx + targetDy * userDy);
    const isForward = dotProduct >= -10;

    // 4. Sample path points
    let pathScoreTotal = 0;
    const sampleCount = Math.min(userStroke.length, targetGuide.path.length);
    for (let i = 0; i < sampleCount; i++) {
      const uPoint = userStroke[Math.floor((i / sampleCount) * userStroke.length)];
      let minTargetDist = Infinity;
      for (const tPoint of targetGuide.path) {
        const d = dist(uPoint, tPoint);
        if (d < minTargetDist) minTargetDist = d;
      }
      pathScoreTotal += Math.max(0, 100 - minTargetDist * 3.5);
    }
    const avgPathScore = sampleCount > 0 ? pathScoreTotal / sampleCount : 70;

    // Combined score calculation
    let calculatedAccuracy = Math.round(
      Math.max(20, Math.min(100, (
        (100 - Math.min(50, startDist * 2)) * 0.35 +
        (100 - Math.min(50, endDist * 2)) * 0.35 +
        avgPathScore * 0.30
      )))
    );

    if (!isForward) {
      calculatedAccuracy = Math.max(30, calculatedAccuracy - 35);
      return {
        success: false,
        accuracy: calculatedAccuracy,
        msg: isRu ? '⚠️ Неправильное направление штриха! Начните с точки ①' : '⚠️ Incorrect direction! Start from dot ①'
      };
    }

    if (startDist > 25) {
      return {
        success: false,
        accuracy: calculatedAccuracy,
        msg: isRu ? '📍 Начните ближе к начальной точке штриха' : '📍 Start closer to the starting dot'
      };
    }

    const isSuccess = calculatedAccuracy >= 65 || (startDist < 18 && endDist < 25);
    const successMsg = calculatedAccuracy >= 90
      ? (isRu ? '🌟 Идеальный штрих! 100% точность!' : '🌟 Perfect stroke! 100% accuracy!')
      : (isRu ? `✨ Отлично! Точность ${calculatedAccuracy}%` : `✨ Great! Accuracy ${calculatedAccuracy}%`);

    return {
      success: isSuccess,
      accuracy: calculatedAccuracy,
      msg: isSuccess ? successMsg : (isRu ? 'Немного скорректируйте линию по контуру' : 'Align line closer to the guide')
    };
  }, [isRu]);

  // Pointer event handlers for the canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isCompleted || isDemoPlaying) return;
    const pt = getNormalizedPoint(e.clientX, e.clientY);
    if (!pt) return;
    isPointerDownRef.current = true;
    setCurrentDrawingStroke([pt]);
    triggerHapticFeedback('light');
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isPointerDownRef.current || isCompleted || isDemoPlaying) return;
    const pt = getNormalizedPoint(e.clientX, e.clientY);
    if (!pt) return;
    setCurrentDrawingStroke(prev => {
      if (prev.length === 0) return [pt];
      const last = prev[prev.length - 1];
      if (dist(last, pt) < 0.8) return prev;
      return [...prev, pt];
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    if (currentDrawingStroke.length < 2) {
      setCurrentDrawingStroke([]);
      return;
    }

    const currentGuide = selectedItem.strokes[currentStrokeIdx];
    if (!currentGuide) return;

    const evaluation = evaluateStroke(currentDrawingStroke, currentGuide);

    if (evaluation.success) {
      playSound('correct');
      triggerHapticFeedback('correct');
      const updatedCompleted = [...completedStrokes, currentDrawingStroke];
      setCompletedStrokes(updatedCompleted);
      setCurrentDrawingStroke([]);
      setAccuracyScore(evaluation.accuracy);
      setFeedbackMessage({ text: evaluation.msg, type: 'success' });

      // Check if entire letter/word is completed
      if (currentStrokeIdx + 1 >= selectedItem.strokes.length) {
        setIsCompleted(true);
        handleItemCompletion(evaluation.accuracy);
      } else {
        setCurrentStrokeIdx(prev => prev + 1);
      }
    } else {
      playSound('wrong');
      triggerHapticFeedback('wrong');
      setFeedbackMessage({ text: evaluation.msg, type: 'warning' });
      setCurrentDrawingStroke([]);
    }
  };

  // Completion awards and progress tracking
  const handleItemCompletion = (finalAccuracy: number) => {
    playSound('success');
    triggerHapticFeedback('success');
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    const stars = finalAccuracy >= 90 ? 3 : finalAccuracy >= 75 ? 2 : 1;
    const earnedXp = 15 + stars * 5;

    onUpdateUser(prev => {
      const stats = prev.handwritingStats || {
        completedItems: [],
        stars: {},
        totalStrokes: 0,
        streak: prev.streak || 1
      };
      const newCompleted = Array.from(new Set([...stats.completedItems, selectedItem.id]));
      const newStars = { ...stats.stars, [selectedItem.id]: Math.max(stats.stars[selectedItem.id] || 0, stars) };

      return {
        ...prev,
        xp: (prev.xp || 0) + earnedXp,
        gems: (prev.gems || 0) + 3,
        handwritingStats: {
          ...stats,
          completedItems: newCompleted,
          stars: newStars,
          totalStrokes: stats.totalStrokes + selectedItem.strokes.length,
          lastPracticeDate: new Date().toISOString().split('T')[0]
        }
      };
    });

    onToast(
      isRu
        ? `🏆 Символ «${selectedItem.char}» освоен! +${earnedXp} XP (${stars} ★)`
        : `🏆 Mastered "${selectedItem.char}"! +${earnedXp} XP (${stars} ★)`
    );
  };

  // Animated demonstration player
  const playDemonstration = () => {
    if (isDemoPlaying) return;
    resetCanvas();
    setIsDemoPlaying(true);
    playSound('select');

    let strokeI = 0;
    let pointI = 0;

    const animate = () => {
      const targetStrokes = selectedItem.strokes;
      if (strokeI >= targetStrokes.length) {
        setIsDemoPlaying(false);
        setDemoPoint(null);
        return;
      }

      const stroke = targetStrokes[strokeI];
      const path = stroke.path;

      if (pointI < path.length) {
        setDemoPoint(path[pointI]);
        pointI++;
        demoAnimRef.current = requestAnimationFrame(animate);
      } else {
        // Finished this stroke
        setCompletedStrokes(prev => [...prev, stroke.path]);
        strokeI++;
        pointI = 0;
        setTimeout(() => {
          demoAnimRef.current = requestAnimationFrame(animate);
        }, 200);
      }
    };

    demoAnimRef.current = requestAnimationFrame(animate);
  };

  // Redraw Canvas content (Guidelines, Calligraphy grid, Completed strokes, Active stroke)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / 100;
    const scaleY = canvas.height / 100;

    // 1. Draw Calligraphy Guidelines (Ascender, Cap height, Midline, Baseline, Descender, 68° Slant Lines)
    if (showGuidelines) {
      ctx.save();
      ctx.lineWidth = 1;

      // Base line (y = 70)
      ctx.strokeStyle = isLightMode ? '#94a3b8' : '#475569';
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(0, 70 * scaleY);
      ctx.lineTo(canvas.width, 70 * scaleY);
      ctx.stroke();

      // Midline (x-height, y = 45)
      ctx.strokeStyle = isLightMode ? '#cbd5e1' : '#334155';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, 45 * scaleY);
      ctx.lineTo(canvas.width, 45 * scaleY);
      ctx.stroke();

      // Cap / Ascender line (y = 20)
      ctx.beginPath();
      ctx.moveTo(0, 20 * scaleY);
      ctx.lineTo(canvas.width, 20 * scaleY);
      ctx.stroke();

      // Descender line (y = 88)
      ctx.beginPath();
      ctx.moveTo(0, 88 * scaleY);
      ctx.lineTo(canvas.width, 88 * scaleY);
      ctx.stroke();

      // 68-degree slant guide lines
      ctx.strokeStyle = isLightMode ? 'rgba(203, 213, 225, 0.4)' : 'rgba(51, 65, 85, 0.4)';
      ctx.setLineDash([2, 6]);
      for (let x = -20; x <= 120; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x * scaleX, 0);
        ctx.lineTo((x - 20) * scaleX, canvas.height);
        ctx.stroke();
      }

      ctx.restore();
    }

    // 2. Draw Ghost Guide Silhouette & Target Stroke Indicators (if guided mode)
    if (practiceMode === 'guided' && showGhost) {
      ctx.save();
      ctx.strokeStyle = isLightMode ? `rgba(59, 130, 246, ${ghostOpacity})` : `rgba(96, 165, 250, ${ghostOpacity})`;
      ctx.lineWidth = penWidth * 1.6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Draw all stroke ghost paths
      selectedItem.strokes.forEach((stroke, sIdx) => {
        const isCurrent = sIdx === currentStrokeIdx;
        const isPast = sIdx < currentStrokeIdx;

        if (!isPast) {
          ctx.beginPath();
          stroke.path.forEach((pt, pIdx) => {
            const px = pt.x * scaleX;
            const py = pt.y * scaleY;
            if (pIdx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();
        }

        // Draw start dot and numbered order badge for active stroke
        if (isCurrent && !isCompleted) {
          const startX = stroke.startPoint.x * scaleX;
          const startY = stroke.startPoint.y * scaleY;

          // Glowing animated start circle
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(startX, startY, 9, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(stroke.order), startX, startY);
        }
      });

      ctx.restore();
    }

    // 3. Draw Completed Strokes (Ink with pressure curves)
    ctx.save();
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    completedStrokes.forEach(path => {
      if (path.length === 0) return;
      ctx.beginPath();
      path.forEach((pt, idx) => {
        const px = pt.x * scaleX;
        const py = pt.y * scaleY;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    });

    // 4. Draw Current Drawing Stroke (Active ink)
    if (currentDrawingStroke.length > 0) {
      ctx.strokeStyle = isLightMode ? '#0284c7' : '#38bdf8';
      ctx.lineWidth = penWidth + 1;
      ctx.beginPath();
      currentDrawingStroke.forEach((pt, idx) => {
        const px = pt.x * scaleX;
        const py = pt.y * scaleY;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    // 5. Draw Demo Pointer Animation Cursor
    if (isDemoPlaying && demoPoint) {
      const dx = demoPoint.x * scaleX;
      const dy = demoPoint.y * scaleY;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(dx, dy, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }, [
    completedStrokes,
    currentDrawingStroke,
    selectedItem,
    currentStrokeIdx,
    practiceMode,
    showGuidelines,
    showGhost,
    ghostOpacity,
    penColor,
    penWidth,
    isCompleted,
    isDemoPlaying,
    demoPoint,
    canvasDim,
    isLightMode
  ]);

  const activeStrokeGuide = selectedItem.strokes[currentStrokeIdx];
  const userStars = user.handwritingStats?.stars?.[selectedItem.id] || 0;

  return (
    <div className={`min-h-screen py-4 sm:py-8 px-3 sm:px-6 max-w-7xl mx-auto w-full transition-colors ${
      isLightMode ? 'text-slate-900' : 'text-white'
    }`}>
      {/* TOP HEADER */}
      <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-700/50">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => { playSound('click'); onBack(); }}
            className={`p-2.5 rounded-2xl border transition-all active:scale-95 ${
              isLightMode
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-sm'
                : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-white'
            }`}
            title={isRu ? 'Вернуться назад' : 'Back'}
          >
            ←
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              <span>✍️</span>
              <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                {isRu ? 'Учитесь писать' : 'Learn to Write'}
              </span>
            </h1>
            <p className="text-xs text-gray-400 font-bold">
              {isRu
                ? 'Каллиграфия и обводка штрих за штрихом с обратной связью'
                : 'Stroke-by-stroke guided handwriting with real-time feedback'}
            </p>
          </div>
        </div>

        {/* PROGRESS METRICS */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="bg-amber-500/15 border border-amber-500/40 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
            <span className="text-sm">🔥</span>
            <span className="font-black text-xs text-amber-400">
              {user.streak || 1} {isRu ? 'дн.' : 'd'}
            </span>
          </div>
          <div className="bg-blue-500/15 border border-blue-500/40 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
            <span className="text-sm">⭐</span>
            <span className="font-black text-xs text-blue-400">
              {Object.keys(user.handwritingStats?.stars || {}).length}
            </span>
          </div>
        </div>
      </div>

      {/* 3 PROGRESSION STAGES & DAILY CHALLENGE TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <button
          onClick={() => { playSound('click'); setCurrentTab('alphabet'); resetCanvas(); }}
          className={`p-3 rounded-2xl border-b-4 font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 ${
            currentTab === 'alphabet'
              ? 'bg-blue-600 border-blue-800 text-white shadow-lg scale-102'
              : isLightMode
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-gray-800 border-gray-900 text-gray-400 hover:bg-gray-750 hover:text-white'
          }`}
        >
          <span className="text-lg">🔤</span>
          <span className="truncate">{isRu ? '1. Алфавит' : '1. Alphabet'}</span>
        </button>

        <button
          onClick={() => { playSound('click'); setCurrentTab('forms'); resetCanvas(); }}
          className={`p-3 rounded-2xl border-b-4 font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 ${
            currentTab === 'forms'
              ? 'bg-indigo-600 border-indigo-800 text-white shadow-lg scale-102'
              : isLightMode
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-gray-800 border-gray-900 text-gray-400 hover:bg-gray-750 hover:text-white'
          }`}
        >
          <span className="text-lg">🔗</span>
          <span className="truncate">{isRu ? '2. Соединения' : '2. Connected Forms'}</span>
        </button>

        <button
          onClick={() => { playSound('click'); setCurrentTab('words'); resetCanvas(); }}
          className={`p-3 rounded-2xl border-b-4 font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 ${
            currentTab === 'words'
              ? 'bg-emerald-600 border-emerald-800 text-white shadow-lg scale-102'
              : isLightMode
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-gray-800 border-gray-900 text-gray-400 hover:bg-gray-750 hover:text-white'
          }`}
        >
          <span className="text-lg">✍️</span>
          <span className="truncate">{isRu ? '3. Слова' : '3. Word Tracing'}</span>
        </button>

        <button
          onClick={() => { playSound('click'); setCurrentTab('daily'); resetCanvas(); }}
          className={`p-3 rounded-2xl border-b-4 font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 ${
            currentTab === 'daily'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-700 text-slate-950 shadow-lg scale-102'
              : isLightMode
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-gray-800 border-gray-900 text-gray-400 hover:bg-gray-750 hover:text-white'
          }`}
        >
          <span className="text-lg">🎯</span>
          <span className="truncate">{isRu ? 'Дневная норма' : 'Daily Goal'}</span>
        </button>
      </div>

      {/* SUB-CATEGORY FILTER FOR WORDS (Travel, Faith, Family, Art) */}
      {currentTab === 'words' && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
          {[
            { id: 'all', label: isRu ? 'Все темы' : 'All Themes', icon: '🌐' },
            { id: 'travel', label: isRu ? '✈️ Для путешествий' : '✈️ Travel', icon: '✈️' },
            { id: 'faith', label: isRu ? '🕊️ Для веры и традиций' : '🕊️ Faith & Culture', icon: '🕊️' },
            { id: 'family', label: isRu ? '👨‍👩‍👧 Для семьи и общения' : '👨‍👩‍👧 Family & Notes', icon: '👨‍👩‍👧' },
            { id: 'art', label: isRu ? '🎨 Для души и красоты' : '🎨 Art & Daily', icon: '🎨' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => { playSound('click'); setSelectedCategoryTheme(cat.id); }}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all border ${
                selectedCategoryTheme === cat.id
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                  : 'bg-gray-800/60 text-gray-400 border-gray-700 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* MAIN TWO-ZONE STAGE: LEFT CANVAS / RIGHT CONCEPT & INSTRUCTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: INTERACTIVE CANVAS & WRITING STAGE (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div
            ref={containerRef}
            className={`w-full p-4 sm:p-6 rounded-[2.5rem] border-2 shadow-2xl relative flex flex-col items-center ${
              isLightMode
                ? 'bg-white border-slate-200'
                : 'bg-duo-card border-gray-700'
            }`}
          >
            {/* CANVAS HEADER BAR: ITEM INFO & SOUND */}
            <div className="w-full flex items-center justify-between mb-3 px-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-2xl font-black text-blue-400 shadow-inner">
                  {selectedItem.char}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base sm:text-lg font-black">{selectedItem.name}</h2>
                    {userStars > 0 && (
                      <span className="text-amber-400 text-xs">
                        {'★'.repeat(userStars)}{'☆'.repeat(3 - userStars)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-bold">
                    {selectedItem.translation || selectedItem.sound || ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => {
                    playSound('click');
                    speakText(selectedItem.char, selectedItem.script === 'arabic' ? 'ar' : 'ru', false, user.preferredVoice, user.voiceProvider);
                  }}
                  className="p-2.5 rounded-xl bg-gray-800 hover:bg-blue-600 text-gray-300 hover:text-white transition-all active:scale-95"
                  title={isRu ? 'Озвучить' : 'Listen'}
                >
                  🔊
                </button>
                <button
                  onClick={playDemonstration}
                  disabled={isDemoPlaying}
                  className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs uppercase transition-all flex items-center gap-1.5"
                  title={isRu ? 'Показать правильное написание' : 'Demonstrate stroke'}
                >
                  <span>🎬</span>
                  <span className="hidden sm:inline">{isRu ? 'Демо' : 'Demo'}</span>
                </button>
              </div>
            </div>

            {/* STROKE PROGRESS PILLS */}
            <div className="w-full flex items-center justify-between px-2 mb-2 text-xs font-bold">
              <span className="text-gray-400">
                {isRu ? 'Штрих:' : 'Stroke:'} <b className="text-blue-400">{Math.min(currentStrokeIdx + 1, selectedItem.strokes.length)} / {selectedItem.strokes.length}</b>
              </span>
              {accuracyScore !== null && (
                <span className={`font-black ${accuracyScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isRu ? 'Точность:' : 'Accuracy:'} {accuracyScore}%
                </span>
              )}
            </div>

            {/* ACTIVE STROKE HINT CALLOUT */}
            {activeStrokeGuide && !isCompleted && (
              <div className="w-full mb-3 px-3.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300 flex items-center space-x-2">
                <span className="text-base animate-pulse">💡</span>
                <span className="font-bold">
                  {isRu ? activeStrokeGuide.hintRu : activeStrokeGuide.hint}
                </span>
              </div>
            )}

            {/* INTERACTIVE CANVAS */}
            <div
              className="relative rounded-3xl overflow-hidden border-2 border-dashed border-gray-700/80 touch-none select-none shadow-inner"
              style={{
                width: canvasDim.w,
                height: canvasDim.h,
                backgroundColor: isLightMode ? '#f8fafc' : '#0b0f19'
              }}
            >
              <canvas
                ref={canvasRef}
                width={canvasDim.w}
                height={canvasDim.h}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="w-full h-full cursor-crosshair"
              />

              {/* SUCCESS OVERLAY BADGE */}
              {isCompleted && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-3xl mb-3 shadow-lg">
                    ✨
                  </div>
                  <h3 className="text-xl font-black text-emerald-400 uppercase tracking-wider mb-1">
                    {isRu ? 'Блестяще выполнено!' : 'Masterfully Completed!'}
                  </h3>
                  <p className="text-xs text-gray-300 mb-4 max-w-xs">
                    {isRu
                      ? 'Все штрихи начертаны правильно и с соблюдением порядка.'
                      : 'All strokes drawn with accurate direction and order.'}
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={resetCanvas}
                      className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs uppercase tracking-wider"
                    >
                      {isRu ? 'Повторить' : 'Repeat'}
                    </button>
                    <button
                      onClick={() => {
                        const idx = currentList.findIndex(i => i.id === selectedItem.id);
                        const nextItem = currentList[(idx + 1) % currentList.length];
                        setSelectedItem(nextItem);
                      }}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg"
                    >
                      {isRu ? 'Следующий символ →' : 'Next Symbol →'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* REAL-TIME FEEDBACK ALERT */}
            {feedbackMessage && !isCompleted && (
              <div className={`mt-3 w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in ${
                feedbackMessage.type === 'success'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
              }`}>
                <span>{feedbackMessage.text}</span>
                <button onClick={() => setFeedbackMessage(null)} className="text-gray-400 hover:text-white ml-2">✕</button>
              </div>
            )}

            {/* CANVAS BOTTOM TOOLBAR */}
            <div className="w-full flex items-center justify-between flex-wrap gap-2 mt-4 pt-3 border-t border-gray-700/50">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowGuidelines(prev => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    showGuidelines
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}
                  title={isRu ? 'Косая каллиграфическая сетка' : 'Calligraphy slant grid'}
                >
                  📏 {isRu ? 'Линейка' : 'Grid'}
                </button>
                <button
                  onClick={() => setShowGhost(prev => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    showGhost
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}
                  title={isRu ? 'Контурные подсказки' : 'Ghost trace'}
                >
                  👁️ {isRu ? 'Контур' : 'Ghost'}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    playSound('click');
                    if (completedStrokes.length > 0) {
                      setCompletedStrokes(prev => prev.slice(0, -1));
                      setCurrentStrokeIdx(prev => Math.max(0, prev - 1));
                    }
                  }}
                  disabled={completedStrokes.length === 0}
                  className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-40"
                  title={isRu ? 'Отменить штрих' : 'Undo stroke'}
                >
                  ↩️
                </button>
                <button
                  onClick={() => {
                    playSound('click');
                    resetCanvas();
                  }}
                  className="p-2 rounded-xl bg-gray-800 hover:bg-red-900/60 text-gray-300 hover:text-red-300"
                  title={isRu ? 'Очистить холст' : 'Clear canvas'}
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CONCEPT DECK, CURSIVE NOTES & LETTER CAROUSEL (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* CURSIVE & ANATOMY CARD */}
          <div className={`p-5 rounded-3xl border-2 shadow-xl ${
            isLightMode ? 'bg-white border-slate-200' : 'bg-duo-card border-gray-700'
          }`}>
            <h3 className="text-sm font-black uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-1.5">
              <span>📖</span>
              <span>{isRu ? 'Каллиграфическая схема' : 'Handwriting Blueprint'}</span>
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              {isRu
                ? (selectedItem.cursiveNotesRu || 'Соблюдайте естественный наклон пера и последовательность штрихов.')
                : (selectedItem.cursiveNotes || 'Maintain consistent slant and follow numbered stroke order.')}
            </p>

            {selectedItem.exampleWord && (
              <div className="p-3 bg-blue-950/40 border border-blue-800/50 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-blue-300 uppercase font-bold block">
                    {isRu ? 'Пример в слове:' : 'Example word:'}
                  </span>
                  <span className="font-black text-white text-sm">{selectedItem.exampleWord.word}</span>
                  <span className="text-gray-400 text-[11px] block">{selectedItem.exampleWord.translation}</span>
                </div>
                <button
                  onClick={() => {
                    playSound('click');
                    speakText(selectedItem.exampleWord!.word, selectedItem.script === 'arabic' ? 'ar' : 'ru', false, user.preferredVoice, user.voiceProvider);
                  }}
                  className="p-2 rounded-xl bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white"
                >
                  🔊
                </button>
              </div>
            )}
          </div>

          {/* ITEM SELECTION GRID / CAROUSEL */}
          <div className={`p-5 rounded-3xl border-2 shadow-xl ${
            isLightMode ? 'bg-white border-slate-200' : 'bg-duo-card border-gray-700'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
                {isRu ? 'Выберите символ для тренировки:' : 'Select character to practice:'}
              </h3>
              <span className="text-[11px] text-gray-500 font-bold">
                {currentList.length} {isRu ? 'символов' : 'items'}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1 no-scrollbar">
              {currentList.map(item => {
                const isSelected = item.id === selectedItem.id;
                const stars = user.handwritingStats?.stars?.[item.id] || 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      playSound('select');
                      setSelectedItem(item);
                    }}
                    className={`p-2.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-between group cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 border-blue-400 text-white shadow-lg scale-105'
                        : isLightMode
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                          : 'bg-gray-800 hover:bg-gray-750 border-gray-700 text-white'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl font-black">{item.char}</span>
                    <span className="text-[9px] font-bold text-gray-400 group-hover:text-white truncate w-full text-center mt-0.5">
                      {item.translit || item.sound || item.char}
                    </span>
                    {stars > 0 && (
                      <span className="text-[9px] text-amber-400 mt-0.5">
                        {'★'.repeat(stars)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
