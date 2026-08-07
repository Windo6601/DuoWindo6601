import React, { useEffect, useRef, useState, useCallback } from 'react';
import { UndoIcon, EyeIcon, VolumeIcon, TrashIcon } from './Icons';

interface Point {
  x: number;
  y: number;
}

interface DrawingCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  character: string;
  instruction: string;
  onUndo?: () => void;
  onClear?: () => void;
  onSpeak?: () => void;
  showTrace: boolean;
  setShowTrace: (show: boolean) => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  canvasRef,
  character,
  instruction,
  onSpeak,
  showTrace,
  setShowTrace
}) => {
  const [paths, setPaths] = useState<Point[][]>([]);
  const currentPathRef = useRef<Point[]>([]);
  const isDrawingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 340, height: 340 });

  // Measure container and compute canvas dimensions dynamically for mobile comfort
  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const w = Math.floor(rect.width) || 320;
      // Calculate max height based on viewport so everything fits on mobile screens
      const viewportH = window.innerHeight || 600;
      const maxH = Math.floor(viewportH * 0.38); // max 38% of screen height
      const dimension = Math.max(220, Math.min(w, 360, maxH));
      setSize(prev => (prev.width === dimension && prev.height === dimension ? prev : { width: dimension, height: dimension }));
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate coordinates relative to canvas resolution
  const getCanvasCoordinates = useCallback((clientX: number, clientY: number): Point | null => {
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
  }, [canvasRef]);

  // Redraw all completed paths
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.fillStyle = '#1e293b';

    paths.forEach(path => {
      if (path.length === 0) return;
      if (path.length === 1) {
        ctx.beginPath();
        ctx.arc(path[0].x, path[0].y, 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length - 1; i++) {
          const xc = (path[i].x + path[i + 1].x) / 2;
          const yc = (path[i].y + path[i + 1].y) / 2;
          ctx.quadraticCurveTo(path[i].x, path[i].y, xc, yc);
        }
        const last = path[path.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
      }
    });
  }, [canvasRef, paths]);

  useEffect(() => {
    redraw();
  }, [paths, size, redraw]);

  const startDrawing = useCallback((clientX: number, clientY: number) => {
    const pt = getCanvasCoordinates(clientX, clientY);
    if (!pt) return;

    isDrawingRef.current = true;
    currentPathRef.current = [pt];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.fillStyle = '#1e293b';

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  }, [canvasRef, getCanvasCoordinates]);

  const moveDrawing = useCallback((clientX: number, clientY: number) => {
    if (!isDrawingRef.current) return;
    const pt = getCanvasCoordinates(clientX, clientY);
    if (!pt) return;

    const path = currentPathRef.current;
    if (path.length > 0) {
      const last = path[path.length - 1];
      const dist = Math.hypot(pt.x - last.x, pt.y - last.y);
      if (dist < 2) return; // avoid duplicate micro points
    }

    path.push(pt);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b';

    if (path.length >= 2) {
      const p1 = path[path.length - 2];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    }
  }, [canvasRef, getCanvasCoordinates]);

  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (currentPathRef.current.length > 0) {
      const newPath = [...currentPathRef.current];
      currentPathRef.current = [];
      setPaths(prev => [...prev, newPath]);
    }
  }, []);

  // Attach native non-passive touch events to prevent browser scrolling/cancelling mid-stroke
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        startDrawing(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        moveDrawing(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      stopDrawing();
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [canvasRef, startDrawing, moveDrawing, stopDrawing]);

  // Mouse & Pointer handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') return; // already handled by touch listeners above
    e.preventDefault();
    if (canvasRef.current && canvasRef.current.setPointerCapture) {
      try { canvasRef.current.setPointerCapture(e.pointerId); } catch (_) {}
    }
    startDrawing(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') return;
    e.preventDefault();
    moveDrawing(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') return;
    e.preventDefault();
    if (canvasRef.current && canvasRef.current.releasePointerCapture) {
      try { canvasRef.current.releasePointerCapture(e.pointerId); } catch (_) {}
    }
    stopDrawing();
  };

  const handleUndo = () => {
    if (paths.length > 0) {
      setPaths(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    setPaths([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden touch-none select-none min-h-0 w-full max-w-sm mx-auto px-2">
      <h2 className="text-xs md:text-sm font-bold mb-2 text-center tracking-tight text-gray-300 uppercase">
        {instruction}
      </h2>

      <div
        ref={containerRef}
        className="relative border-4 border-gray-300 rounded-3xl bg-white shadow-2xl overflow-hidden cursor-crosshair touch-none select-none flex items-center justify-center"
        style={{
          width: size.width,
          height: size.height,
        }}
      >
        {/* COPYBOOK GUIDELINES BACKGROUND */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none select-none z-0"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Horizontal midline */}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />
          {/* Horizontal top line */}
          <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#e2e8f0" strokeWidth="1" />
          {/* Horizontal bottom line */}
          <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#e2e8f0" strokeWidth="1" />
          {/* Vertical center axis line */}
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />
        </svg>

        {/* TRACE LAYER WITH PROPORTIONAL LETTER SIZE */}
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 transition-opacity duration-300 ${
            showTrace ? 'opacity-30' : 'opacity-0'
          }`}
        >
          <span
            style={{ fontSize: Math.min(size.width, size.height) * 0.48, lineHeight: 1 }}
            className="text-gray-900 font-serif font-bold select-none whitespace-nowrap text-center leading-none"
          >
            {character}
          </span>
        </div>

        <canvas
          ref={canvasRef}
          width={size.width}
          height={size.height}
          className="relative z-10 touch-none block touch-action-none w-full h-full"
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 md:gap-4 p-2 md:p-3 bg-duo-card rounded-2xl border-2 border-gray-700 shadow-xl animate-in fade-in slide-in-from-bottom-2">
        <button
          type="button"
          onClick={handleUndo}
          title="Отменить последний штрих"
          className="p-2.5 md:p-3 rounded-xl bg-duo-yellow border-b-4 border-yellowDark text-white shadow-md active:scale-95 active:border-b-0 active:translate-y-1 transition-all"
        >
          <UndoIcon className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        <button
          type="button"
          onClick={() => setShowTrace(!showTrace)}
          title="Показать / скрыть образцовую букву"
          className={`p-2.5 md:p-3 rounded-xl border-b-4 shadow-md active:scale-95 active:border-b-0 active:translate-y-1 transition-all ${
            showTrace ? 'bg-duo-green border-duo-greenDark text-white' : 'bg-gray-700 border-gray-800 text-gray-400'
          }`}
        >
          <EyeIcon className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {onSpeak && (
          <button
            type="button"
            onClick={onSpeak}
            title="Озвучить букву"
            className="p-2.5 md:p-3 rounded-xl bg-duo-blue border-b-4 border-duo-blueDark text-white shadow-md active:scale-95 active:border-b-0 active:translate-y-1 transition-all"
          >
            <VolumeIcon className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}

        <div className="w-px h-6 bg-gray-600 mx-0.5"></div>

        <button
          type="button"
          onClick={handleClear}
          title="Очистить холст"
          className="p-2.5 md:p-3 rounded-xl bg-red-500 border-b-4 border-red-700 text-white shadow-md active:scale-95 active:border-b-0 active:translate-y-1 transition-all"
        >
          <TrashIcon className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>
    </div>
  );
};
