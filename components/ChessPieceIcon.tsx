import React from 'react';

export type ChessColor = 'w' | 'b';
export type ChessPieceTheme = 'graphical' | 'unicode';

export const CHESS_UNICODE: Record<string, { w: string; b: string }> = {
  p: { w: '♙', b: '♟' },
  r: { w: '♖', b: '♜' },
  n: { w: '♘', b: '♞' },
  b: { w: '♗', b: '♝' },
  q: { w: '♕', b: '♛' },
  k: { w: '♔', b: '♚' },
};

export const ChessPieceIcon: React.FC<{
  type: string;
  color: ChessColor;
  className?: string;
  theme?: ChessPieceTheme;
}> = ({ type, color, className, theme }) => {
  const isWhite = color === 'w';
  const t = type.toLowerCase();

  const activeTheme: ChessPieceTheme = theme || (typeof window !== 'undefined' ? (() => {
    try {
      const raw = localStorage.getItem('duowindo6601_user_progress_v1');
      if (raw) return JSON.parse(raw).chessPieceTheme || 'graphical';
    } catch {}
    return 'graphical';
  })() : 'graphical');

  if (activeTheme === 'unicode') {
    const char = CHESS_UNICODE[t]?.[color] || '?';
    return (
      <span
        className={`inline-flex items-center justify-center select-none font-serif leading-none ${className || ''} ${
          isWhite
            ? 'text-white [text-shadow:_0_0_2px_#000000,_0_2px_4px_rgba(0,0,0,0.9)]'
            : 'text-slate-950 [text-shadow:_0_0_2px_#ffffff,_0_1px_3px_rgba(255,255,255,0.7)]'
        }`}
        style={{ fontSize: '1.9em' }}
      >
        {char}
      </span>
    );
  }

  const fill = isWhite ? "#FFFFFF" : "#1E293B";
  const stroke = isWhite ? "#0F172A" : "#FFFFFF";
  const strokeWidth = 1.5;

  if (t === 'p') {
    return (
      <svg viewBox="0 0 45 45" className={className} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 22.5,9 C 20,9 18,11 18,13.5 C 18,14.5 18.3,15.4 18.8,16.2 C 16.8,17.2 15.5,19.2 15.5,21.5 C 15.5,23.5 16.4,25.3 17.8,26.5 C 14.8,27.5 12,31.5 12,36 L 33,36 C 33,31.5 30.2,27.5 27.2,26.5 C 28.6,25.3 29.5,23.5 29.5,21.5 C 29.5,19.2 28.2,17.2 26.2,16.2 C 26.7,15.4 27,14.5 27,13.5 C 27,11 25,9 22.5,9 Z" />
        <path d="M 12,36 L 33,36 L 33,39 L 12,39 Z" />
      </svg>
    );
  }

  if (t === 'r') {
    return (
      <svg viewBox="0 0 45 45" className={className} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 9,39 L 36,39 L 36,36 L 9,36 Z" />
        <path d="M 12,36 L 12,32 L 33,32 L 33,36 Z" />
        <path d="M 14,32 L 14,16 L 31,16 L 31,32 Z" />
        <path d="M 12,16 L 12,9 L 16,9 L 16,12 L 21,12 L 21,9 L 24,9 L 24,12 L 29,12 L 29,9 L 33,9 L 33,16 Z" />
      </svg>
    );
  }

  if (t === 'n') {
    const eyeFill = isWhite ? "#0F172A" : "#FFFFFF";
    return (
      <svg viewBox="0 0 45 45" className={className} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,27.5 23,13" />
        <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,18 25.5,11 28,13.5 C 29,14.5 30,16.5 30,18.5 C 30,22.5 28,25 28,25 Z" />
        <path d="M 9.5,25.5 C 9.5,27.5 11,29 13,29 C 15,29 16.5,27.5 16.5,25.5 C 16.5,23.5 15,22 13,22 C 11,22 9.5,23.5 9.5,25.5 Z" />
        <circle cx="27" cy="15" r="1.5" fill={eyeFill} stroke="none" />
      </svg>
    );
  }

  if (t === 'b') {
    return (
      <svg viewBox="0 0 45 45" className={className} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 9,39 L 36,39 L 36,36 L 9,36 Z" />
        <path d="M 12,36 C 12,32 15,27 18,25 C 16,23 15,20 15,17 C 15,12.5 18.3,9 22.5,9 C 26.7,9 30,12.5 30,17 C 30,20 29,23 27,25 C 30,27 33,32 33,36 Z" />
        <circle cx="22.5" cy="6" r="1.8" />
        <path d="M 17.5,26 L 27.5,26 M 22.5,21 L 22.5,31" />
      </svg>
    );
  }

  if (t === 'q') {
    return (
      <svg viewBox="0 0 45 45" className={className} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 9,39 L 36,39 L 36,36 L 9,36 Z" />
        <path d="M 11,36 L 13,28 L 32,28 L 34,36 Z" />
        <path d="M 9,26 L 9,14 L 15,22 L 22.5,11 L 30,22 L 36,14 L 36,26 Z" />
        <circle cx="9" cy="12" r="2" />
        <circle cx="15" cy="19" r="2" />
        <circle cx="22.5" cy="9" r="2" />
        <circle cx="30" cy="19" r="2" />
        <circle cx="36" cy="12" r="2" />
      </svg>
    );
  }

  if (t === 'k') {
    return (
      <svg viewBox="0 0 45 45" className={className} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 22.5,11.5 L 22.5,6 M 20,8 L 25,8" strokeWidth={1.5} />
        <path d="M 9,39 L 36,39 L 36,36 L 9,36 Z" />
        <path d="M 12,36 C 12,32 14,27 18,25 C 16,23 15,20 15,16 C 15,11 19,8 22.5,8 C 26,8 30,11 30,16 C 30,20 29,23 27,25 C 31,27 33,32 33,36 Z" />
        <circle cx="22.5" cy="16" r="2.5" />
      </svg>
    );
  }

  return null;
};
