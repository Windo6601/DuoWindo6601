import React from 'react';
import { CloseIcon, CheckCircleIcon, GearIcon } from './Icons';
import { ChessPieceIcon, ChessPieceTheme, CHESS_UNICODE } from './ChessPieceIcon';
import { playSound } from '../services/audioService';

export interface ChessSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeControl: number; // 5, 10, or 20
  onChangeTimeControl: (minutes: number) => void;
  soundEffectsEnabled: boolean;
  onToggleSoundEffects: (enabled: boolean) => void;
  pieceTheme: ChessPieceTheme;
  onChangePieceTheme: (theme: ChessPieceTheme) => void;
  language?: string;
}

export const ChessSettingsModal: React.FC<ChessSettingsModalProps> = ({
  isOpen,
  onClose,
  timeControl,
  onChangeTimeControl,
  soundEffectsEnabled,
  onToggleSoundEffects,
  pieceTheme,
  onChangePieceTheme,
  language = 'ru',
}) => {
  if (!isOpen) return null;

  const isRu = language === 'ru';

  const timeOptions = [
    {
      minutes: 5,
      label: isRu ? '5 минут' : '5 Minutes',
      badge: isRu ? 'Блиц ⚡' : 'Blitz ⚡',
      desc: isRu ? 'Быстрая динамичная партия' : 'Fast-paced dynamic match',
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/50 text-amber-300'
    },
    {
      minutes: 10,
      label: isRu ? '10 минут' : '10 Minutes',
      badge: isRu ? 'Рапид ⏱️' : 'Rapid ⏱️',
      desc: isRu ? 'Сбалансированный темп игры' : 'Balanced tactical pace',
      color: 'from-sky-500/20 to-blue-500/10 border-sky-500/50 text-sky-300'
    },
    {
      minutes: 20,
      label: isRu ? '20 минут' : '20 Minutes',
      badge: isRu ? 'Классика 🏆' : 'Classic 🏆',
      desc: isRu ? 'Глубокий расчет и анализ ходов' : 'Deep calculation & strategy',
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/50 text-emerald-300'
    }
  ];

  const pieceThemes: { id: ChessPieceTheme; label: string; sub: string; badge: string }[] = [
    {
      id: 'graphical',
      label: isRu ? 'Графические иконки' : 'Graphical Icons',
      sub: isRu ? 'Векторный стиль Staunton SVG с высокой четкостью' : 'Modern vector Staunton SVG chess pieces',
      badge: 'SVG Staunton'
    },
    {
      id: 'unicode',
      label: isRu ? 'Классический Юникод' : 'Classic Unicode',
      sub: isRu ? 'Традиционные типографические символы ♔ ♕ ♖ ♗ ♘ ♙' : 'Traditional typography chess characters ♔ ♕ ♖ ♗ ♘ ♙',
      badge: 'Unicode ♔ ♞'
    }
  ];

  const previewPieces = ['k', 'q', 'r', 'b', 'n', 'p'];

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-gray-900 border-2 border-gray-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] font-din text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gray-800/80 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00cd9c]/20 border border-[#00cd9c]/40 flex items-center justify-center text-xl shadow-inner">
              ♟️
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>{isRu ? 'Настройки шахмат' : 'Chess Settings'}</span>
              </h2>
              <p className="text-xs text-gray-400 font-bold">
                {isRu ? 'Контроль времени, звуки ходов и оформление фигур' : 'Time control, move sound effects & piece theme'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-700/60 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* SECTION 1: TIME CONTROL */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">⏱️</span>
                <h3 className="font-black text-sm uppercase tracking-wider text-gray-200">
                  {isRu ? 'Контроль времени партии' : 'Game Time Control'}
                </h3>
              </div>
              <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-lg border border-amber-400/30">
                {timeControl} {isRu ? 'мин' : 'min'}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              {isRu
                ? 'Выберите время на обдумывание для всей партии (вместо фиксированных 20 минут):'
                : 'Select total game countdown timer (replaces fixed 20 minutes):'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {timeOptions.map((opt) => {
                const isSelected = timeControl === opt.minutes;
                return (
                  <button
                    key={opt.minutes}
                    type="button"
                    onClick={() => {
                      playSound('select');
                      onChangeTimeControl(opt.minutes);
                    }}
                    className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-between text-center relative cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-950/60 border-[#00cd9c] ring-2 ring-[#00cd9c]/50 shadow-lg'
                        : 'bg-gray-800/80 border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 text-emerald-400">
                        <CheckCircleIcon className="w-4 h-4" />
                      </div>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mb-2 bg-gray-900/60 border border-gray-700 text-gray-300">
                      {opt.badge}
                    </span>
                    <span className="text-2xl font-black text-white my-0.5">
                      {opt.minutes} {isRu ? 'мин' : 'm'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium leading-tight mt-1">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: SOUND EFFECTS (CHESS MOVES & CAPTURES) */}
          <div className="bg-gray-800/80 border-2 border-gray-700 rounded-2xl p-4 space-y-3 shadow-inner">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <span className="text-2xl p-2 bg-purple-900/40 rounded-xl border border-purple-500/40 shrink-0">
                  🔊
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">
                      {isRu ? 'Звуковые эффекты ходов и взятий' : 'Chess Move & Capture Sounds'}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-300 font-medium mt-1">
                    {isRu
                      ? 'Особые звуки при перемещении фигур (щелчок) и взятии (стук дерева) на доске'
                      : 'Play dedicated sound effects specifically for chess moves and captures'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  onToggleSoundEffects(!soundEffectsEnabled);
                }}
                className={`py-2 px-4 rounded-xl font-black text-xs uppercase tracking-wider border-b-4 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center space-x-1.5 shadow-md shrink-0 cursor-pointer ${
                  soundEffectsEnabled
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-400 border-gray-950'
                }`}
                title="Toggle chess sound effects"
              >
                <span>{soundEffectsEnabled ? '🔊' : '🔇'}</span>
                <span>{soundEffectsEnabled ? (isRu ? 'ВКЛ' : 'ON') : (isRu ? 'ВЫКЛ' : 'OFF')}</span>
              </button>
            </div>

            {/* Test Sound Samples */}
            <div className="pt-1 border-t border-gray-700/60 flex items-center justify-between text-xs">
              <span className="text-[11px] text-gray-400 font-bold">
                {isRu ? 'Проверка звуков:' : 'Test sounds:'}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    if (soundEffectsEnabled) playSound('click');
                  }}
                  disabled={!soundEffectsEnabled}
                  className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-200 text-[10px] font-bold rounded-lg border border-gray-600 cursor-pointer"
                >
                  {isRu ? 'Щелчок хода' : 'Move click'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (soundEffectsEnabled) playSound('capture');
                  }}
                  disabled={!soundEffectsEnabled}
                  className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 disabled:opacity-40 text-[10px] font-bold rounded-lg border border-amber-500/50 cursor-pointer"
                >
                  {isRu ? 'Стук взятия' : 'Capture clack'}
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: PIECE THEME SWITCHER */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🎨</span>
                <h3 className="font-black text-sm uppercase tracking-wider text-gray-200">
                  {isRu ? 'Тема оформления шахматных фигур' : 'Chess Piece Theme'}
                </h3>
              </div>
              <span className="text-[11px] font-bold text-sky-400 bg-sky-400/10 px-2.5 py-0.5 rounded-lg border border-sky-400/30 uppercase">
                {pieceTheme === 'unicode' ? 'Unicode' : 'Staunton SVG'}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              {isRu
                ? 'Выберите отображение фигур: классические типографические символы Юникод или векторные иконки:'
                : 'Choose piece style: classic typography Unicode glyphs or modern vector Staunton icons:'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pieceThemes.map((th) => {
                const isSelected = pieceTheme === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => {
                      playSound('select');
                      onChangePieceTheme(th.id);
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col text-left relative cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-400/50 shadow-lg'
                        : 'bg-gray-800/80 border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-900/60 border border-gray-700 text-indigo-300">
                        {th.badge}
                      </span>
                      {isSelected && (
                        <div className="text-indigo-400">
                          <CheckCircleIcon className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <span className="text-base font-black text-white">
                      {th.label}
                    </span>
                    <span className="text-xs text-gray-400 font-medium leading-tight mt-1 mb-3">
                      {th.sub}
                    </span>

                    {/* Miniature piece strip preview */}
                    <div className="w-full bg-gray-900/90 border border-gray-700/80 rounded-xl p-2 flex items-center justify-around mt-auto">
                      {previewPieces.slice(0, 4).map((pType) => (
                        <div key={pType} className="w-7 h-7 flex items-center justify-center">
                          <ChessPieceIcon
                            type={pType}
                            color="w"
                            theme={th.id}
                            className="w-full h-full drop-shadow-sm"
                          />
                        </div>
                      ))}
                      {previewPieces.slice(0, 2).map((pType) => (
                        <div key={`b-${pType}`} className="w-7 h-7 flex items-center justify-center">
                          <ChessPieceIcon
                            type={pType}
                            color="b"
                            theme={th.id}
                            className="w-full h-full drop-shadow-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live Board Preview Strip */}
            <div className="bg-black/40 border border-gray-800 rounded-2xl p-3 space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                {isRu ? 'Предпросмотр на доске (Активная тема)' : 'Board Preview (Active Theme)'}
              </span>
              <div className="flex items-center justify-between bg-[#2a3a4a] border border-gray-700 rounded-xl p-2 gap-1 overflow-x-auto">
                {previewPieces.map((p, idx) => {
                  const isWhiteSq = idx % 2 === 0;
                  return (
                    <div
                      key={p}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-inner ${
                        isWhiteSq ? 'bg-[#3a4a5a]' : 'bg-[#2a3a4a]'
                      }`}
                    >
                      <ChessPieceIcon
                        type={p}
                        color={idx < 3 ? 'w' : 'b'}
                        theme={pieceTheme}
                        className="w-8 h-8"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-800/80 border-t border-gray-700 flex justify-end">
          <button
            onClick={() => {
              playSound('success');
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-3 bg-[#00cd9c] hover:bg-[#00cd9c]/90 text-gray-950 font-black text-xs uppercase tracking-wider rounded-2xl border-b-4 border-teal-800 active:border-b-0 active:translate-y-1 transition-all shadow-lg cursor-pointer"
          >
            {isRu ? 'Сохранить и закрыть' : 'Save & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
