import React, { useEffect, useRef, useState } from 'react';

export interface TypewriterTextProps {
  text: string;
  animate?: boolean;
  animateKey?: string | number;
  speedMs?: number;
  className?: string;
  cursorClassName?: string;
  showCursor?: boolean;
  formatFn?: (rawText: string) => string;
  onProgress?: () => void;
  onComplete?: () => void;
  children?: (visibleRawText: string, isTyping: boolean) => React.ReactNode;
}

/**
 * Smooth character-by-character typewriter effect for AI replies in Roleplay & Video Call.
 * Uses animateKey to guarantee only new AI messages animate while unrelated re-renders stay untouched.
 */
export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  animate = true,
  animateKey,
  speedMs = 18,
  className = '',
  cursorClassName = 'inline-block w-[2px] h-[1em] align-middle ml-1 bg-current animate-pulse',
  showCursor = true,
  formatFn,
  onProgress,
  onComplete,
  children
}) => {
  const [revealedCount, setRevealedCount] = useState<number>(() =>
    animate ? 0 : text.length
  );
  const completedRef = useRef<boolean>(!animate);
  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);

  onProgressRef.current = onProgress;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!animate || !text) {
      setRevealedCount(text.length);
      completedRef.current = true;
      return;
    }

    setRevealedCount(0);
    completedRef.current = false;

    // Adaptive chunking: keep short/medium texts 1 char at a time, speed up gently for long responses
    const stepSize = text.length > 260 ? 3 : text.length > 140 ? 2 : 1;
    let current = 0;

    const timer = window.setInterval(() => {
      current = Math.min(text.length, current + stepSize);
      setRevealedCount(current);
      if (onProgressRef.current && current % 6 === 0) {
        onProgressRef.current();
      }
      if (current >= text.length) {
        window.clearInterval(timer);
        if (!completedRef.current) {
          completedRef.current = true;
          onProgressRef.current?.();
          onCompleteRef.current?.();
        }
      }
    }, speedMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [text, animate, animateKey, speedMs]);

  const isTyping = animate && revealedCount < text.length;
  const visibleRaw = isTyping ? text.slice(0, revealedCount) : text;

  const handleRevealImmediately = () => {
    if (!isTyping) return;
    setRevealedCount(text.length);
    if (!completedRef.current) {
      completedRef.current = true;
      onCompleteRef.current?.();
    }
  };

  if (children) {
    return (
      <span onClick={handleRevealImmediately} className={className}>
        {children(visibleRaw, isTyping)}
        {isTyping && showCursor && <span className={cursorClassName} aria-hidden="true" />}
      </span>
    );
  }

  const displayed = formatFn ? formatFn(visibleRaw) : visibleRaw;

  return (
    <span onClick={handleRevealImmediately} className={className}>
      {displayed}
      {isTyping && showCursor && <span className={cursorClassName} aria-hidden="true" />}
    </span>
  );
};
