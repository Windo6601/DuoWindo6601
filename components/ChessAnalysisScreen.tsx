import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { ChessPieceIcon, ChessColor } from './ChessPieceIcon';
import { playSound } from '../services/audioService';
import { analyzeChessPosition, analyzeFullChessGameWithAI, ChessAiMoveAnalysis, getChessMove } from '../services/geminiService';

export interface ChessAnalysisScreenProps {
  initialMoves?: string[];
  initialFen?: string;
  gameResult?: string;
  playerColor?: 'w' | 'b';
  onBack: () => void;
  onNewGame?: () => void;
  onPlayAgainstBot?: (fen?: string, moves?: string[]) => void;
}

interface AnalyzedMove {
  ply: number;
  san: string;
  from: string;
  to: string;
  piece: string;
  color: 'w' | 'b';
  fenBefore: string;
  fenAfter: string;
  evalBefore: number;
  evalAfter: number;
  evalDiff: number; // For the player who moved (positive is good, negative is bad)
  classification: 'brilliant' | 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'book';
  bestMoveSan?: string;
  comment?: string;
}

// Preset historic games
const FAMOUS_GAMES = [
  {
    id: 'opera',
    name: '«Оперная партия» (Пол Морфи, 1858)',
    desc: 'Классический шедевр развития фигур и жертв от легенды шахмат Пола Морфи.',
    moves: ['e4', 'e5', 'Nf3', 'd6', 'd4', 'Bg4', 'dxe5', 'Bxf3', 'Qxf3', 'dxe5', 'Bc4', 'Nf6', 'Qb3', 'Qe7', 'Nc3', 'c6', 'Bg5', 'b5', 'Nxb5', 'cxb5', 'Bxb5+', 'Nbd7', 'O-O-O', 'Rd8', 'Rxd7', 'Rxd7', 'Rd1', 'Qe6', 'Bxd7+', 'Nxd7', 'Qb8+', 'Nxb8', 'Rd8#']
  },
  {
    id: 'immortal',
    name: '«Бессмертная партия» (Андерсен – Кизерицкий, 1851)',
    desc: 'Невероятная комбинация с жертвой двух ладей, слона и ферзя ради мата слоном и двумя конями.',
    moves: ['e4', 'e5', 'f4', 'exf4', 'Bc4', 'Qh4+', 'Kf1', 'b5', 'Bxb5', 'Nf6', 'Nf3', 'Qh6', 'd3', 'Nh5', 'Nh4', 'Qg5', 'Nf5', 'c6', 'g4', 'Nf6', 'Rg1', 'cxb5', 'h4', 'Qg6', 'h5', 'Qg5', 'Qf3', 'Ng8', 'Bxf4', 'Qf6', 'Nc3', 'Bc5', 'Nd5', 'Qxb2', 'Bd6', 'Bxg1', 'e5', 'Qxa1+', 'Ke2', 'Na6', 'Nxg7+', 'Kd8', 'Qf6+', 'Nxf6', 'Be7#']
  },
  {
    id: 'evergreen',
    name: '«Вечнозелёная партия» (Андерсен – Дюфрень, 1852)',
    desc: 'Потрясающая жертва ферзя и комбинационный триумф романтических шахмат XIX века.',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4', 'Bxb4', 'c3', 'Ba5', 'd4', 'exd4', 'O-O', 'd3', 'Qb3', 'Qf6', 'e5', 'Qg6', 'Re1', 'Nge7', 'Ba3', 'b5', 'Qxb5', 'Rb8', 'Qa4', 'Bb6', 'Nbd2', 'Bb7', 'Ne4', 'Qf5', 'Bxd3', 'Qh5', 'Nf6+', 'gxf6', 'exf6', 'Rg8', 'Rad1', 'Qxf3', 'Rxe7+', 'Nxe7', 'Qxd7+', 'Kxd7', 'Bf5+', 'Ke8', 'Bd7+', 'Kf8', 'Bxe7#']
  },
  {
    id: 'century',
    name: '«Партия века» (Бобби Фишер – Дональд Бирн, 1956)',
    desc: '13-летний гений Бобби Фишер повергает мастера ошеломляющей жертвой ферзя на 17-м ходу.',
    moves: ['Nf3', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'd4', 'O-O', 'Bf4', 'd5', 'Qb3', 'dxc4', 'Qxc4', 'c6', 'e4', 'Nbd7', 'Rd1', 'Nb6', 'Qc5', 'Bg4', 'Bg5', 'Na4', 'Qa3', 'Nxc3', 'bxc3', 'Nxe4', 'Bxe7', 'Qb6', 'Bc4', 'Nxc3', 'Bc5', 'Rfe8+', 'Kf1', 'Be6', 'Bxb6', 'Bxc4+', 'Kg1', 'Ne2+', 'Kf1', 'Nxd4+', 'Kg1', 'Ne2+', 'Kf1', 'Nc3+', 'Kg1', 'axb6', 'Qb4', 'Ra4', 'Qxb6', 'Nxd1']
  },
  {
    id: 'kasparov_topalov',
    name: '«Шедевр Каспарова» (Гарри Каспаров – Веселин Топалов, 1999)',
    desc: 'Безумная атака Каспарова с прорывом ладьи в Вейк-ан-Зее, признанная одной из величайших партий в истории.',
    moves: ['e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6', 'Be3', 'Bg7', 'Qd2', 'c6', 'f3', 'b5', 'Nge2', 'Nbd7', 'Bh6', 'Bxh6', 'Qxh6', 'Bb7', 'a3', 'e5', 'O-O-O', 'Qe7', 'Kb1', 'a6', 'Nc1', 'O-O-O', 'Nb3', 'exd4', 'Rxd4', 'c5', 'Rd1', 'Nb6', 'g3', 'Kb8', 'Na5', 'Ba8', 'Bh3', 'd5', 'Qf4+', 'Ka7', 'Rhe1', 'd4', 'Nd5', 'Nbxd5', 'exd5', 'Qd6', 'Rxd4', 'cxd4', 'Re7+', 'Kb6', 'Qxd4+', 'Kxa5', 'b4+', 'Ka4', 'Qc3', 'Qxd5', 'Ra7', 'Bb7', 'Rxb7', 'Qc4', 'Qxf6', 'Kxa3', 'Qxa6+', 'Kxb4', 'c3+', 'Kxc3', 'Qa1+', 'Kd2', 'Qb2+', 'Kd1', 'Bf1', 'Rd2', 'Rd7', 'Rxd7', 'Bxc4', 'bxc4', 'Qxh8', 'Rd3', 'Qa8', 'c3', 'Qa4+', 'Ke1', 'f4', 'f5', 'Kc1', 'Rd2', 'Qa7']
  },
  {
    id: 'legal',
    name: '«Мат Легаля» (Легаль – Сен-Бри, 1750)',
    desc: 'Знаменитейшая ловушка с мнимой жертвой ферзя и молниеносным матом тремя легкими фигурами.',
    moves: ['e4', 'e5', 'Nf3', 'd6', 'Bc4', 'Bg4', 'Nc3', 'g6', 'Nxe5', 'Bxd1', 'Bxf7+', 'Ke7', 'Nd5#']
  }
];

// Piece point values for static evaluation
const PIECE_VALUES: Record<string, number> = {
  p: 1.0,
  n: 3.1,
  b: 3.3,
  r: 5.0,
  q: 9.2,
  k: 0
};

// Fast local chess evaluator
const evaluatePositionHeuristic = (chess: Chess): number => {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -99 : 99;
  }
  if (chess.isDraw()) {
    return 0;
  }

  const board = chess.board();
  let material = 0;
  let positional = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const val = PIECE_VALUES[piece.type] || 0;
      const isWhite = piece.color === 'w';

      // Material
      if (isWhite) {
        material += val;
      } else {
        material -= val;
      }

      // Center control bonus (d4, d5, e4, e5, c4, c5, f4, f5)
      const distFromCenter = Math.abs(3.5 - r) + Math.abs(3.5 - c);
      const centerBonus = (7 - distFromCenter) * 0.04;

      // Pawn advance bonus
      let advanceBonus = 0;
      if (piece.type === 'p') {
        advanceBonus = isWhite ? (7 - r) * 0.05 : r * 0.05;
      }

      const totalBonus = centerBonus + advanceBonus;
      if (isWhite) {
        positional += totalBonus;
      } else {
        positional -= totalBonus;
      }
    }
  }

  // Check bonus/penalty
  if (chess.inCheck()) {
    if (chess.turn() === 'w') positional -= 0.35;
    else positional += 0.35;
  }

  // Legal moves mobility
  const movesCount = chess.moves().length;
  const mobility = (chess.turn() === 'w' ? movesCount : -movesCount) * 0.02;

  const total = material + positional + mobility;
  return Math.round(total * 10) / 10;
};

// Parse FEN into 8x8 matrix
const parseFenToBoard = (fen: string) => {
  const rows = fen.split(' ')[0].split('/');
  return rows.map(rowStr => {
    const row: ({ type: string; color: ChessColor } | null)[] = [];
    for (const char of rowStr) {
      if (/\d/.test(char)) {
        const count = parseInt(char, 10);
        for (let i = 0; i < count; i++) row.push(null);
      } else {
        row.push({
          type: char.toLowerCase(),
          color: char === char.toUpperCase() ? 'w' : 'b'
        });
      }
    }
    return row;
  });
};

export const ChessAnalysisScreen: React.FC<ChessAnalysisScreenProps> = ({
  initialMoves = [],
  initialFen,
  gameResult,
  playerColor = 'w',
  onBack,
  onNewGame,
  onPlayAgainstBot
}) => {
  // Original preset moves (for resetting)
  const [originalPresetMoves, setOriginalPresetMoves] = useState<string[]>(() => {
    if (initialMoves && initialMoves.length > 0) return initialMoves;
    return FAMOUS_GAMES[0].moves;
  });

  // Current game moves being analyzed
  const [movesList, setMovesList] = useState<string[]>(() => {
    if (initialMoves && initialMoves.length > 0) return initialMoves;
    return FAMOUS_GAMES[0].moves;
  });

  // Current ply (move index: 0 is starting board, 1 is after move 1, etc.)
  const [currentPly, setCurrentPly] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(playerColor === 'b');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState<number>(1400);

  // Board interaction mode: 'append' = adds user's own move to game/history, 'sandbox' = temporary trial move ("Что если")
  const [boardMode, setBoardMode] = useState<'append' | 'sandbox'>('append');

  // DuoWindo6601 Bot Interactive Mode
  const [isDuoBotActive, setIsDuoBotActive] = useState<boolean>(false);
  const [isDuoThinking, setIsDuoThinking] = useState<boolean>(false);
  const [duoSpeech, setDuoSpeech] = useState<string | null>(null);
  const [showPlayBotModal, setShowPlayBotModal] = useState<boolean>(false);

  // Custom PGN / FEN modal
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importInput, setImportInput] = useState<string>('');
  const [importError, setImportError] = useState<string>('');

  // AI Analysis Cache & States
  const [aiAnalysisCache, setAiAnalysisCache] = useState<Record<number, ChessAiMoveAnalysis>>({});
  const [isAiAnalyzingMove, setIsAiAnalyzingMove] = useState<boolean>(false);
  const [fullGameReport, setFullGameReport] = useState<{
    whiteAccuracy: number;
    blackAccuracy: number;
    summary: string;
    verdictRu: string;
  } | null>(null);
  const [isAiAnalyzingGame, setIsAiAnalyzingGame] = useState<boolean>(false);
  const [showFullReportModal, setShowFullReportModal] = useState<boolean>(false);

  // "What if" trial moves from current position
  const [trialMoveFens, setTrialMoveFens] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMovesForSquare, setLegalMovesForSquare] = useState<string[]>([]);

  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const movesScrollRef = useRef<HTMLDivElement | null>(null);

  // Compute full timeline of game positions and static classifications
  const analyzedGame = useMemo(() => {
    const chess = new Chess();
    const timeline: AnalyzedMove[] = [];
    const fens: string[] = [chess.fen()];

    for (let i = 0; i < movesList.length; i++) {
      const san = movesList[i];
      const fenBefore = chess.fen();
      const evalBefore = evaluatePositionHeuristic(chess);
      const turn = chess.turn();

      try {
        const moveObj = chess.move(san);
        if (!moveObj) break;

        const fenAfter = chess.fen();
        fens.push(fenAfter);
        const evalAfter = evaluatePositionHeuristic(chess);

        // evalDiff from moving player's point of view
        const evalDiff = turn === 'w' ? (evalAfter - evalBefore) : (evalBefore - evalAfter);

        // Classification
        let classification: AnalyzedMove['classification'] = 'good';
        if (i < 6) {
          classification = 'book';
        } else if (evalDiff < -2.2) {
          classification = 'blunder';
        } else if (evalDiff < -1.1) {
          classification = 'mistake';
        } else if (evalDiff < -0.5) {
          classification = 'inaccuracy';
        } else if (evalDiff >= 1.5 && ['n', 'b', 'r', 'q'].includes(moveObj.piece) && moveObj.captured) {
          classification = 'brilliant';
        } else if (evalDiff >= 0.2) {
          classification = 'best';
        } else if (evalDiff >= -0.15) {
          classification = 'excellent';
        }

        timeline.push({
          ply: i + 1,
          san: moveObj.san,
          from: moveObj.from,
          to: moveObj.to,
          piece: moveObj.piece,
          color: turn,
          fenBefore,
          fenAfter,
          evalBefore,
          evalAfter,
          evalDiff,
          classification
        });
      } catch (e) {
        console.warn(`Failed to play move: ${san}`, e);
        break;
      }
    }

    return { timeline, fens };
  }, [movesList]);

  // Aggregate stats (accuracy, mistakes, blunders)
  const stats = useMemo(() => {
    let whiteLossSum = 0;
    let blackLossSum = 0;
    let whiteMoves = 0;
    let blackMoves = 0;

    const counts = {
      w: { brilliant: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0, book: 0 },
      b: { brilliant: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0, book: 0 }
    };

    analyzedGame.timeline.forEach(m => {
      counts[m.color][m.classification]++;
      const loss = Math.max(0, -m.evalDiff);
      if (m.color === 'w') {
        whiteLossSum += loss;
        whiteMoves++;
      } else {
        blackLossSum += loss;
        blackMoves++;
      }
    });

    const calcAccuracy = (lossSum: number, count: number) => {
      if (count === 0) return 90;
      const avgLoss = lossSum / count;
      // Formula: 100 * exp(-0.06 * avgLoss * 10)
      const acc = Math.max(45, Math.min(99, Math.round(100 * Math.exp(-0.45 * avgLoss))));
      return acc;
    };

    return {
      whiteAccuracy: calcAccuracy(whiteLossSum, whiteMoves),
      blackAccuracy: calcAccuracy(blackLossSum, blackMoves),
      counts
    };
  }, [analyzedGame]);

  // Current FEN to render on the board
  const currentFen = useMemo(() => {
    if (trialMoveFens.length > 0) {
      return trialMoveFens[trialMoveFens.length - 1];
    }
    return analyzedGame.fens[currentPly] || analyzedGame.fens[0];
  }, [analyzedGame.fens, currentPly, trialMoveFens]);

  // Current move object
  const currentMove = useMemo(() => {
    if (currentPly === 0 || currentPly > analyzedGame.timeline.length) return null;
    return analyzedGame.timeline[currentPly - 1];
  }, [analyzedGame.timeline, currentPly]);

  // Position evaluation score in pawns
  const currentEval = useMemo(() => {
    const aiData = aiAnalysisCache[currentPly];
    if (aiData) return aiData.eval;
    if (currentMove) return currentMove.evalAfter;
    try {
      const c = new Chess(currentFen);
      return evaluatePositionHeuristic(c);
    } catch {
      return 0;
    }
  }, [aiAnalysisCache, currentPly, currentMove, currentFen]);

  // Board matrix
  const boardMatrix = useMemo(() => {
    return parseFenToBoard(currentFen);
  }, [currentFen]);

  // Check status
  const isKingInCheck = useMemo(() => {
    try {
      const c = new Chess(currentFen);
      return c.inCheck();
    } catch {
      return false;
    }
  }, [currentFen]);

  // Auto-play effect
  useEffect(() => {
    if (!isPlaying) {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      return;
    }

    autoPlayRef.current = setInterval(() => {
      setCurrentPly(prev => {
        if (prev >= analyzedGame.fens.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        playSound('click');
        return prev + 1;
      });
    }, autoPlaySpeed);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPlaying, autoPlaySpeed, analyzedGame.fens.length]);

  // Auto-scroll move table when currentPly changes
  useEffect(() => {
    if (!movesScrollRef.current) return;
    const activeEl = movesScrollRef.current.querySelector(`[data-ply="${currentPly}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentPly]);

  // Clear trial moves when navigating
  const goToPly = (ply: number) => {
    setTrialMoveFens([]);
    setSelectedSquare(null);
    setLegalMovesForSquare([]);
    const target = Math.max(0, Math.min(ply, analyzedGame.fens.length - 1));
    setCurrentPly(target);
    playSound('click');
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPly(currentPly - 1);
      } else if (e.key === 'ArrowRight') {
        goToPly(currentPly + 1);
      } else if (e.key === 'Home') {
        goToPly(0);
      } else if (e.key === 'End') {
        goToPly(analyzedGame.fens.length - 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPly, analyzedGame.fens.length]);

  // Trigger AI Move Analysis for current position
  const handleRequestAiAnalysis = async () => {
    if (isAiAnalyzingMove || aiAnalysisCache[currentPly]) return;
    setIsAiAnalyzingMove(true);
    try {
      const lastMoveStr = currentMove ? `${currentMove.color === 'w' ? 'Белые' : 'Черные'} сыграли ${currentMove.san}` : 'Начало';
      const historySlice = movesList.slice(0, currentPly);
      const res = await analyzeChessPosition(currentFen, lastMoveStr, historySlice);
      setAiAnalysisCache(prev => ({ ...prev, [currentPly]: res }));
      playSound('correct');
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiAnalyzingMove(false);
    }
  };

  // Trigger Full AI Game Review
  const handleRequestFullGameReport = async () => {
    if (isAiAnalyzingGame) return;
    setIsAiAnalyzingGame(true);
    setShowFullReportModal(true);
    try {
      const res = await analyzeFullChessGameWithAI(movesList, gameResult);
      setFullGameReport(res);
      playSound('correct');
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiAnalyzingGame(false);
    }
  };

  // DuoWindo6601 bot automated reply on analysis board
  const triggerDuoBotReply = async (currentMoves: string[], fenAfterUserMove: string) => {
    setIsDuoThinking(true);
    try {
      const chess = new Chess(fenAfterUserMove);
      if (chess.isGameOver()) {
        setIsDuoThinking(false);
        if (chess.isCheckmate()) {
          playSound('correct');
          setDuoSpeech("🦉 DuoWindo6601: «Шах и мат! Великолепная партия, снимаю шляпу перед вашим мастерством!»");
        } else {
          playSound('correct');
          setDuoSpeech("🦉 DuoWindo6601: «Ничья! Ни один гроссмейстер не смог одолеть другого!»");
        }
        return;
      }

      // 1. Try Gemini AI Bot Move
      let botSan = '';
      try {
        const aiMove = await getChessMove(fenAfterUserMove, currentMoves);
        if (aiMove) {
          const clean = aiMove.replace('-', '');
          if (clean.length >= 4) {
            const moveRes = chess.move({
              from: clean.substring(0, 2) as Square,
              to: clean.substring(2, 4) as Square,
              promotion: 'q'
            });
            if (moveRes) botSan = moveRes.san;
          }
        }
      } catch (err) {
        console.warn("AI move fetch error, fallback to heuristic", err);
      }

      // 2. Fallback to heuristic move evaluation if AI took too long
      if (!botSan) {
        const moves = chess.moves({ verbose: true });
        if (moves.length > 0) {
          let bestMove = moves[0];
          let bestVal = chess.turn() === 'w' ? -999 : 999;
          for (const m of moves) {
            chess.move(m);
            const val = evaluatePositionHeuristic(chess);
            chess.undo();
            if (chess.turn() === 'w' ? val > bestVal : val < bestVal) {
              bestVal = val;
              bestMove = m;
            }
          }
          const executed = chess.move(bestMove);
          if (executed) botSan = executed.san;
        }
      }

      if (botSan) {
        const isCapture = botSan.includes('x');
        const isCheck = botSan.includes('+') || botSan.includes('#');
        if (isCapture) playSound('capture');
        else playSound('click');

        const updatedMoves = [...currentMoves, botSan];
        setMovesList(updatedMoves);
        setCurrentPly(updatedMoves.length);

        if (isCheck) {
          setDuoSpeech(`🦉 DuoWindo6601: «Шах! Мой ответ: ${botSan}. Береги короля!»`);
        } else if (isCapture) {
          setDuoSpeech(`🦉 DuoWindo6601: «Забираю фигуру: ${botSan}! Внимательнее с защитой!»`);
        } else {
          const phrases = [
            `🦉 DuoWindo6601: «Мой ход: ${botSan}. Твой черед удивлять!»`,
            `🦉 DuoWindo6601: «Хожу ${botSan}! Гроссмейстеры Совиного Королевства держат оборону!»`,
            `🦉 DuoWindo6601: «Отличная партия! Мой ответ: ${botSan}.»`
          ];
          setDuoSpeech(phrases[Math.floor(Math.random() * phrases.length)]);
        }
      }
    } catch (e) {
      console.error("Duo bot move error", e);
    } finally {
      setIsDuoThinking(false);
    }
  };

  // Handle board square click for exploring variations or appending player's own moves
  const handleSquareClick = (square: Square) => {
    try {
      const chess = new Chess(currentFen);
      if (selectedSquare) {
        // Attempt move
        const move = chess.move({
          from: selectedSquare,
          to: square,
          promotion: 'q'
        });
        if (move) {
          const isCapture = !!(move.captured || (move.flags && (move.flags.includes('c') || move.flags.includes('e'))));
          if (isCapture) playSound('capture');
          else playSound('click');

          if (boardMode === 'append') {
            // Append player move to current game ply!
            const newMoves = [...movesList.slice(0, currentPly), move.san];
            setMovesList(newMoves);
            setCurrentPly(newMoves.length);
            setTrialMoveFens([]);
            setSelectedSquare(null);
            setLegalMovesForSquare([]);

            // Trigger DuoWindo6601 bot if active
            if (isDuoBotActive && !chess.isGameOver()) {
              setTimeout(() => {
                triggerDuoBotReply(newMoves, chess.fen());
              }, 400);
            }
            return;
          } else {
            // Temporary variation exploration
            setTrialMoveFens(prev => [...prev, chess.fen()]);
            setSelectedSquare(null);
            setLegalMovesForSquare([]);
            return;
          }
        }
      }

      // Select new piece
      const piece = chess.get(square);
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square);
        const moves = chess.moves({ square, verbose: true });
        setLegalMovesForSquare(moves.map(m => m.to));
        playSound('click');
      } else {
        setSelectedSquare(null);
        setLegalMovesForSquare([]);
      }
    } catch (e) {
      setSelectedSquare(null);
      setLegalMovesForSquare([]);
    }
  };

  // Undo last appended move
  const handleUndoMove = () => {
    if (movesList.length === 0) return;
    const newMoves = movesList.slice(0, -1);
    setMovesList(newMoves);
    setCurrentPly(Math.min(currentPly, newMoves.length));
    setTrialMoveFens([]);
    setDuoSpeech(null);
    playSound('click');
  };

  // Reset to original preset moves
  const handleResetToOriginal = () => {
    setMovesList(originalPresetMoves);
    setCurrentPly(0);
    setTrialMoveFens([]);
    setSelectedSquare(null);
    setLegalMovesForSquare([]);
    setDuoSpeech(null);
    playSound('click');
  };

  // Load preset game
  const handleSelectPresetGame = (gameId: string) => {
    const g = FAMOUS_GAMES.find(x => x.id === gameId);
    if (!g) return;
    setMovesList(g.moves);
    setOriginalPresetMoves(g.moves);
    setCurrentPly(0);
    setTrialMoveFens([]);
    setAiAnalysisCache({});
    setFullGameReport(null);
    setDuoSpeech(null);
    playSound('click');
  };

  // Load custom PGN/moves
  const handleApplyCustomPgn = () => {
    setImportError('');
    const raw = importInput.trim();
    if (!raw) return;

    try {
      // Try parsing as PGN
      const chess = new Chess();
      if (raw.includes('1.') || raw.includes('[')) {
        chess.loadPgn(raw);
        const history = chess.history();
        if (history.length > 0) {
          setMovesList(history);
          setCurrentPly(0);
          setTrialMoveFens([]);
          setAiAnalysisCache({});
          setFullGameReport(null);
          setShowImportModal(false);
          playSound('correct');
          return;
        }
      }

      // Try as space-separated moves: e4 e5 Nf3 Nc6
      const tokens = raw.replace(/\d+\./g, '').replace(/\s+/g, ' ').trim().split(' ');
      const testChess = new Chess();
      const validMoves: string[] = [];
      for (const t of tokens) {
        const cleanT = t.replace(/[+#!?]/g, '');
        const res = testChess.move(cleanT) || testChess.move(t);
        if (res) {
          validMoves.push(res.san);
        }
      }
      if (validMoves.length > 0) {
        setMovesList(validMoves);
        setCurrentPly(0);
        setTrialMoveFens([]);
        setAiAnalysisCache({});
        setFullGameReport(null);
        setShowImportModal(false);
        playSound('correct');
        return;
      }

      setImportError('Не удалось распознать ходы. Проверьте правильность нотации (например: e4 e5 Nf3 Nc6).');
    } catch (e: any) {
      setImportError(`Ошибка загрузки: ${e.message || 'Неверный формат'}`);
    }
  };

  // Classification styling helper
  const getClassificationMeta = (cls: AnalyzedMove['classification']) => {
    switch (cls) {
      case 'brilliant':
        return { label: 'Блестящий ход', badge: '💎 Блестящий', color: 'bg-cyan-500 text-white', icon: '💎' };
      case 'best':
        return { label: 'Лучший ход', badge: '🌟 Лучший', color: 'bg-emerald-600 text-white', icon: '🌟' };
      case 'excellent':
        return { label: 'Отличный ход', badge: '👍 Отличный', color: 'bg-teal-600 text-white', icon: '👍' };
      case 'good':
        return { label: 'Хороший ход', badge: '⚖️ Хороший', color: 'bg-blue-600 text-white', icon: '⚖️' };
      case 'book':
        return { label: 'Теоретический ход', badge: '📖 Дебют', color: 'bg-amber-600 text-white', icon: '📖' };
      case 'inaccuracy':
        return { label: 'Неточность', badge: '⚠️ Неточность', color: 'bg-yellow-500 text-black', icon: '⚠️' };
      case 'mistake':
        return { label: 'Ошибка', badge: '❌ Ошибка', color: 'bg-orange-500 text-white', icon: '❌' };
      case 'blunder':
        return { label: 'Грубый зевок', badge: '💀 Зевок', color: 'bg-red-600 text-white', icon: '💀' };
      default:
        return { label: 'Ход', badge: 'Ход', color: 'bg-slate-500 text-white', icon: '•' };
    }
  };

  // Evaluation bar percentage: 0 = completely black winning, 50 = equal, 100 = completely white winning
  const evalPercentage = useMemo(() => {
    // Sigmoid curve around eval
    const val = currentEval;
    if (val >= 20) return 100;
    if (val <= -20) return 0;
    const p = 50 + 50 * (2 / (1 + Math.exp(-0.25 * val)) - 1);
    return Math.round(Math.max(3, Math.min(97, p)));
  }, [currentEval]);

  const evalLabel = useMemo(() => {
    if (currentEval > 0) return `+${currentEval.toFixed(1)}`;
    if (currentEval < 0) return currentEval.toFixed(1);
    return '0.0';
  }, [currentEval]);

  const activeAiData = aiAnalysisCache[currentPly];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 pb-12 select-none">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-sm transition-colors border border-slate-700"
            title="Назад к курсу шахмат"
          >
            <span className="text-lg">←</span> Назад
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base md:text-lg text-white flex items-center gap-2">
                <span>♟️ Анализ партии шахмат</span>
                <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full font-bold uppercase tracking-wider hidden sm:inline-block">
                  ИИ-Гроссмейстер
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Ход {Math.ceil(currentPly / 2)} из {Math.ceil(movesList.length / 2)} • {currentPly % 2 === 1 ? 'Ход белых' : 'Ход черных'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preset Selector */}
          <div className="relative">
            <select
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs md:text-sm font-semibold px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500"
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setShowImportModal(true);
                } else {
                  handleSelectPresetGame(e.target.value);
                }
              }}
              defaultValue="opera"
            >
              <optgroup label="Великие партии">
                {FAMOUS_GAMES.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </optgroup>
              {initialMoves && initialMoves.length > 0 && (
                <option value="my_game">🎮 Моя последняя сыгранная партия</option>
              )}
              <option value="custom">📥 Вставить свой PGN / FEN...</option>
            </select>
          </div>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition-colors hidden sm:flex items-center gap-1"
            title="Вставить PGN"
          >
            <span>📥 PGN</span>
          </button>

          <button
            onClick={handleRequestFullGameReport}
            className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs md:text-sm font-extrabold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <span>✨ Отчет ИИ</span>
          </button>

          {/* Big Header Play With Bot button */}
          <button
            onClick={() => setShowPlayBotModal(true)}
            className="px-3 md:px-4 py-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:brightness-110 text-slate-950 rounded-xl text-xs md:text-sm font-black shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-1.5 border border-amber-300"
            title="Одиночная партия с ИИ-ботом DuoWindo6601"
          >
            <span className="text-base">🦉</span>
            <span className="hidden sm:inline">ИГРАТЬ С DUOWINDO6601</span>
            <span className="sm:hidden">БОТ DUO</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Evaluation Bar + Chessboard (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center gap-3">
          {/* Top Board Bar: Opponent Info & Eval Meter */}
          <div className="w-full flex items-center justify-between px-2 py-1 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isFlipped ? 'bg-white shadow' : 'bg-slate-900 border border-slate-600'}`} />
              <span className="text-xs md:text-sm font-bold text-slate-300">
                {isFlipped ? 'Белые (White)' : 'Черные (Black)'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                Точность: {isFlipped ? `${stats.whiteAccuracy}%` : `${stats.blackAccuracy}%`}
              </span>
            </div>

            {/* Eval Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Оценка:</span>
              <span className={`text-xs md:text-sm font-black px-2.5 py-0.5 rounded-lg font-mono ${
                currentEval > 0.5 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                currentEval < -0.5 ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {evalLabel}
              </span>
            </div>
          </div>

          {/* Board Container with Evaluation Bar */}
          <div className="w-full flex gap-2 md:gap-3 items-stretch justify-center">
            {/* Vertical Eval Bar */}
            <div className="w-5 md:w-7 bg-slate-800 rounded-lg overflow-hidden flex flex-col border border-slate-700 relative shadow-inner">
              <div
                className="w-full bg-white transition-all duration-300 relative"
                style={{
                  height: isFlipped ? `${100 - evalPercentage}%` : `${evalPercentage}%`
                }}
              />
              <div
                className="w-full bg-slate-900 transition-all duration-300"
                style={{
                  height: isFlipped ? `${evalPercentage}%` : `${100 - evalPercentage}%`
                }}
              />
              <div className="absolute inset-0 flex flex-col justify-between items-center py-1 pointer-events-none text-[9px] font-black font-mono">
                <span className={isFlipped ? 'text-white' : 'text-slate-900'}>{isFlipped ? '-B' : '+W'}</span>
                <span className={isFlipped ? 'text-slate-900' : 'text-white'}>{isFlipped ? '+W' : '-B'}</span>
              </div>
            </div>

            {/* Chessboard Grid */}
            <div className="relative aspect-square max-w-[520px] w-full bg-amber-900/30 rounded-2xl p-1.5 md:p-2 border-2 border-slate-700 shadow-2xl">
              {/* Variation Alert Banner */}
              {trialMoveFens.length > 0 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
                  <span>🧪 Проба варианта ({trialMoveFens.length} ход.)</span>
                  <button
                    onClick={() => {
                      setTrialMoveFens([]);
                      setSelectedSquare(null);
                      setLegalMovesForSquare([]);
                    }}
                    className="underline text-slate-900 hover:text-black font-extrabold ml-1"
                  >
                    Вернуться к партии
                  </button>
                </div>
              )}

              <div className="w-full h-full grid grid-rows-8 grid-cols-8 rounded-xl overflow-hidden border border-amber-950/40 shadow-inner">
                {Array.from({ length: 8 }).map((_, rIndex) => {
                  const r = isFlipped ? 7 - rIndex : rIndex;
                  return Array.from({ length: 8 }).map((_, cIndex) => {
                    const c = isFlipped ? 7 - cIndex : cIndex;
                    const isLight = (r + c) % 2 === 0;
                    const squareAlg = `${String.fromCharCode(97 + c)}${8 - r}` as Square;
                    const piece = boardMatrix[r]?.[c];

                    const isSelected = selectedSquare === squareAlg;
                    const isLegalTarget = legalMovesForSquare.includes(squareAlg);
                    const isLastMoveFrom = currentMove && currentMove.from === squareAlg;
                    const isLastMoveTo = currentMove && currentMove.to === squareAlg;
                    const isBestMoveTarget = activeAiData?.bestMove && activeAiData.bestMove.includes(squareAlg);

                    return (
                      <div
                        key={`${r}-${c}`}
                        onClick={() => handleSquareClick(squareAlg)}
                        className={`relative flex items-center justify-center cursor-pointer transition-colors ${
                          isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'
                        } ${isSelected ? '!bg-amber-300/80 ring-2 ring-amber-500 inset-0' : ''} ${
                          isLastMoveFrom || isLastMoveTo ? '!bg-yellow-300/50' : ''
                        } ${isBestMoveTarget ? '!bg-emerald-300/60 ring-2 ring-emerald-500' : ''}`}
                      >
                        {/* Board Coordinates on Edges */}
                        {cIndex === 0 && (
                          <span className={`absolute top-0.5 left-1 text-[10px] font-bold ${
                            isLight ? 'text-[#b58863]' : 'text-[#f0d9b5]'
                          }`}>
                            {8 - r}
                          </span>
                        )}
                        {rIndex === 7 && (
                          <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold ${
                            isLight ? 'text-[#b58863]' : 'text-[#f0d9b5]'
                          }`}>
                            {String.fromCharCode(97 + c)}
                          </span>
                        )}

                        {/* Move Highlight Dot / Ring */}
                        {isLegalTarget && (
                          <div className={`absolute rounded-full pointer-events-none z-10 ${
                            piece ? 'w-full h-full border-4 border-amber-500/80' : 'w-3.5 h-3.5 bg-slate-900/40'
                          }`} />
                        )}

                        {/* Check Indicator on King */}
                        {isKingInCheck && piece && piece.type === 'k' && (
                          <div className="absolute inset-0 bg-red-600/50 rounded-full animate-pulse pointer-events-none" />
                        )}

                        {/* Piece Icon */}
                        {piece && (
                          <div className="w-[82%] h-[82%] flex items-center justify-center pointer-events-none transition-transform active:scale-95">
                            <ChessPieceIcon type={piece.type} color={piece.color} className="w-full h-full drop-shadow-md" />
                          </div>
                        )}

                        {/* Classification Marker on Target Square */}
                        {isLastMoveTo && currentMove && (
                          <div className="absolute -top-1 -right-1 z-10 shadow-lg rounded-full px-1 py-0.2 text-[10px] font-black pointer-events-none">
                            <span>{getClassificationMeta(currentMove.classification).icon}</span>
                          </div>
                        )}
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          </div>

          {/* Bottom Board Bar: Player Info & Quick Actions */}
          <div className="w-full flex items-center justify-between px-2 py-1 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isFlipped ? 'bg-slate-900 border border-slate-600' : 'bg-white shadow'}`} />
              <span className="text-xs md:text-sm font-bold text-slate-300">
                {isFlipped ? 'Черные (Black)' : 'Белые (White)'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                Точность: {isFlipped ? `${stats.blackAccuracy}%` : `${stats.whiteAccuracy}%`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFlipped(f => !f)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-slate-700"
                title="Перевернуть доску"
              >
                <span>🔄 Повернуть</span>
              </button>
            </div>
          </div>

          {/* Navigation Controls Bar */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goToPly(0)}
                disabled={currentPly === 0}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors"
                title="В начало (Home)"
              >
                ⏮
              </button>
              <button
                onClick={() => goToPly(currentPly - 1)}
                disabled={currentPly === 0}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl text-sm font-black transition-colors"
                title="Назад (Стрелка влево)"
              >
                ◀
              </button>
              <button
                onClick={() => setIsPlaying(p => !p)}
                className={`px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all shadow-md flex items-center gap-1.5 ${
                  isPlaying ? 'bg-amber-600 text-white hover:bg-amber-500' : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
                title="Автопроигрывание (Пробел)"
              >
                <span>{isPlaying ? '⏸ Пауза' : '▶ Авто'}</span>
              </button>
              <button
                onClick={() => goToPly(currentPly + 1)}
                disabled={currentPly >= analyzedGame.fens.length - 1}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl text-sm font-black transition-colors"
                title="Вперед (Стрелка вправо)"
              >
                ▶
              </button>
              <button
                onClick={() => goToPly(analyzedGame.fens.length - 1)}
                disabled={currentPly >= analyzedGame.fens.length - 1}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors"
                title="В конец (End)"
              >
                ⏭
              </button>
            </div>

            {/* Speed selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold hidden sm:inline">Скорость:</span>
              <div className="flex bg-slate-800 rounded-xl p-0.5 border border-slate-700">
                {[
                  { label: '1x', speed: 1800 },
                  { label: '2x', speed: 1100 },
                  { label: '3x', speed: 650 }
                ].map(s => (
                  <button
                    key={s.label}
                    onClick={() => setAutoPlaySpeed(s.speed)}
                    className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors ${
                      autoPlaySpeed === s.speed ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Game Action Bar & DuoWindo6601 Launcher */}
          <div className="w-full bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-3 md:p-4 shadow-xl flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0">
                  🦉
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs md:text-sm font-black text-amber-300 uppercase tracking-wider">
                      Добавить свой ход & Игра с DuoWindo6601
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-bold">
                      1500 ELO
                    </span>
                  </div>
                  <p className="text-[11px] md:text-xs text-slate-300">
                    Нажмите на фигуру на доске, чтобы сделать ход после окончания партии или сыграть с ИИ-ботом!
                  </p>
                </div>
              </div>

              {/* Big Primary Button: ИГРАТЬ С DUOWINDO6601 ОДИНОЧНАЯ ПАРТИЯ С ИИ-БОТОМ */}
              <button
                onClick={() => setShowPlayBotModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-slate-950 rounded-xl text-xs md:text-sm font-black shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 border border-amber-300"
              >
                <span className="text-base">🎮</span>
                <span>ИГРАТЬ С DUOWINDO6601 • ОДИНОЧНАЯ ПАРТИЯ С ИИ-БОТОМ</span>
              </button>
            </div>

            {/* Quick Interactive Toggles & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {/* Append Mode Switcher */}
                <button
                  onClick={() => {
                    setBoardMode(m => m === 'append' ? 'sandbox' : 'append');
                    playSound('click');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                    boardMode === 'append'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="В режиме добавления ходов ваш ход записывается в партию"
                >
                  <span>{boardMode === 'append' ? '✏️ Запись ходов: ВКЛ' : '🔍 Пробные ходы (Что если)'}</span>
                </button>

                {/* DuoWindo6601 Response Toggle on Board */}
                <button
                  onClick={() => {
                    const next = !isDuoBotActive;
                    setIsDuoBotActive(next);
                    playSound('click');
                    if (next) {
                      setBoardMode('append');
                      setDuoSpeech("🦉 DuoWindo6601: «Я готов! Сделай ход на доске, и я сразу отвечу!»");
                    } else {
                      setDuoSpeech(null);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl font-black flex items-center gap-1.5 transition-all ${
                    isDuoBotActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 ring-2 ring-amber-300'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>🦉 Бот DuoWindo: {isDuoBotActive ? 'АКТИВЕН' : 'ВКЛЮЧИТЬ'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Undo appended move */}
                <button
                  onClick={handleUndoMove}
                  disabled={movesList.length === 0}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 rounded-xl font-bold transition-colors flex items-center gap-1"
                  title="Отменить последний добавленный ход"
                >
                  <span>↩️ Отменить</span>
                </button>

                {/* Reset to original preset */}
                <button
                  onClick={handleResetToOriginal}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors flex items-center gap-1"
                  title="Сбросить все добавленные ходы к исходной партии"
                >
                  <span>🔄 Исходная</span>
                </button>
              </div>
            </div>

            {/* DuoWindo Speech Bubble or Thinking Animation */}
            {(isDuoThinking || duoSpeech) && (
              <div className="mt-1 p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-start gap-2.5 text-xs animate-in fade-in duration-200">
                <span className="text-xl animate-bounce">🦉</span>
                <div className="flex-1">
                  <span className="font-extrabold text-amber-300 block">DuoWindo6601 (ИИ-Бот):</span>
                  {isDuoThinking ? (
                    <span className="text-slate-300 italic flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      Рассчитываю лучший тактический ответ...
                    </span>
                  ) : (
                    <p className="text-white font-medium">{duoSpeech}</p>
                  )}
                </div>
                {duoSpeech && !isDuoThinking && (
                  <button
                    onClick={() => setDuoSpeech(null)}
                    className="text-slate-400 hover:text-white text-xs p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: AI Move Breakdown + Move Sheet + Accuracy Stats (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 w-full">
          {/* Active Move Intelligence Card */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🦉</span>
                <h2 className="font-extrabold text-sm md:text-base text-white">Разбор текущего хода</h2>
              </div>

              {currentMove && (
                <span className={`px-2.5 py-1 rounded-xl text-xs font-black shadow-sm ${
                  getClassificationMeta(currentMove.classification).color
                }`}>
                  {getClassificationMeta(currentMove.classification).badge}
                </span>
              )}
            </div>

            {currentMove ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base text-white">{Math.ceil(currentPly / 2)}. {currentMove.san}</span>
                    <span className="text-xs text-slate-400">({currentMove.from} → {currentMove.to})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Перепад:</span>
                    <span className={`text-xs font-mono font-bold ${currentMove.evalDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {currentMove.evalDiff >= 0 ? `+${currentMove.evalDiff.toFixed(1)}` : currentMove.evalDiff.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* AI Move Commentary or Button to Fetch Deep Insight */}
                {activeAiData ? (
                  <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between text-indigo-300 font-bold">
                      <span>Гроссмейстерский комментарий:</span>
                      {activeAiData.bestMove && (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono">
                          Лучший: {activeAiData.bestMove}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-200 leading-relaxed font-medium">
                      {activeAiData.explanation}
                    </p>
                    {activeAiData.threats && (
                      <p className="text-amber-300 text-[11px] font-semibold flex items-center gap-1">
                        <span>⚡ Идея / угроза:</span> {activeAiData.threats}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {currentMove.classification === 'blunder' ? 'Грубая тактическая ошибка, резко меняющая баланс сил в пользу соперника.' :
                       currentMove.classification === 'mistake' ? 'Неудачное продолжение, упускающее инициативу или позиционное преимущество.' :
                       currentMove.classification === 'inaccuracy' ? 'Ход слегка неточен, у соперника появляется контригра.' :
                       currentMove.classification === 'brilliant' ? 'Фантастический ход с глубоким расчетом и жертвой материала!' :
                       currentMove.classification === 'best' ? 'Сильнейшее продолжение позиции по оценке шахматного движка.' :
                       'Надежный ход, сохраняющий гармоничное развитие фигур.'}
                    </p>
                    <button
                      onClick={handleRequestAiAnalysis}
                      disabled={isAiAnalyzingMove}
                      className="w-full py-2 bg-gradient-to-r from-indigo-600/80 to-violet-600/80 hover:from-indigo-600 hover:to-violet-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-indigo-500/30"
                    >
                      {isAiAnalyzingMove ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span>ИИ анализирует позицию...</span>
                        </>
                      ) : (
                        <>
                          <span>⚡ Глубокий разбор хода от Gemini</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-800/40 rounded-xl text-center text-xs text-slate-400">
                <span>Начальная расстановка фигур. Нажмите «▶» для перехода к первому ходу.</span>
              </div>
            )}
          </div>

          {/* Game Accuracy & Classification Stats Breakdown */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs md:text-sm text-slate-200">Точность и качество ходов</h3>
              <button
                onClick={handleRequestFullGameReport}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold underline"
              >
                Подробнее
              </button>
            </div>

            {/* Accuracy Bars */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-white" /> Белые</span>
                  <span className="font-mono text-emerald-400 text-sm">{stats.whiteAccuracy}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${stats.whiteAccuracy}%` }} />
                </div>
              </div>

              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-600" /> Черные</span>
                  <span className="font-mono text-indigo-400 text-sm">{stats.blackAccuracy}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-400 rounded-full" style={{ width: `${stats.blackAccuracy}%` }} />
                </div>
              </div>
            </div>

            {/* Classification Counters Table */}
            <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
              <div className="bg-emerald-950/30 border border-emerald-500/20 p-1.5 rounded-lg">
                <div className="text-[11px] text-emerald-300 font-bold">🌟 Лучшие</div>
                <div className="text-xs font-mono font-black text-white mt-0.5">
                  {stats.counts.w.best + stats.counts.w.brilliant} / {stats.counts.b.best + stats.counts.b.brilliant}
                </div>
              </div>
              <div className="bg-yellow-950/30 border border-yellow-500/20 p-1.5 rounded-lg">
                <div className="text-[11px] text-yellow-300 font-bold">⚠️ Неточн.</div>
                <div className="text-xs font-mono font-black text-white mt-0.5">
                  {stats.counts.w.inaccuracy} / {stats.counts.b.inaccuracy}
                </div>
              </div>
              <div className="bg-orange-950/30 border border-orange-500/20 p-1.5 rounded-lg">
                <div className="text-[11px] text-orange-300 font-bold">❌ Ошибки</div>
                <div className="text-xs font-mono font-black text-white mt-0.5">
                  {stats.counts.w.mistake} / {stats.counts.b.mistake}
                </div>
              </div>
              <div className="bg-red-950/30 border border-red-500/20 p-1.5 rounded-lg">
                <div className="text-[11px] text-red-400 font-bold">💀 Зевки</div>
                <div className="text-xs font-mono font-black text-white mt-0.5">
                  {stats.counts.w.blunder} / {stats.counts.b.blunder}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Move List (Notation Sheet) */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col flex-1 min-h-[260px] max-h-[380px]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Лист ходов партии</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(movesList.join(' '));
                  playSound('click');
                  alert('Ходы скопированы в буфер обмена!');
                }}
                className="text-xs text-slate-400 hover:text-slate-200 font-bold flex items-center gap-1"
                title="Копировать нотацию партии"
              >
                📋 Копировать
              </button>
            </div>

            <div ref={movesScrollRef} className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
              {Array.from({ length: Math.ceil(movesList.length / 2) }).map((_, moveNumIndex) => {
                const moveNum = moveNumIndex + 1;
                const whitePly = moveNumIndex * 2 + 1;
                const blackPly = moveNumIndex * 2 + 2;
                const whiteMove = analyzedGame.timeline[whitePly - 1];
                const blackMove = analyzedGame.timeline[blackPly - 1];

                return (
                  <div key={moveNum} className="flex items-center gap-1.5 py-0.5 px-1.5 rounded hover:bg-slate-800/50 transition-colors">
                    <span className="w-7 text-slate-500 font-bold text-[11px]">{moveNum}.</span>

                    {/* White Move */}
                    {whiteMove ? (
                      <button
                        data-ply={whitePly}
                        onClick={() => goToPly(whitePly)}
                        className={`flex-1 flex items-center justify-between px-2 py-1 rounded-lg text-left transition-colors ${
                          currentPly === whitePly ? 'bg-indigo-600 text-white font-black shadow' : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <span>{whiteMove.san}</span>
                        <span className="text-[10px]">{getClassificationMeta(whiteMove.classification).icon}</span>
                      </button>
                    ) : (
                      <div className="flex-1" />
                    )}

                    {/* Black Move */}
                    {blackMove ? (
                      <button
                        data-ply={blackPly}
                        onClick={() => goToPly(blackPly)}
                        className={`flex-1 flex items-center justify-between px-2 py-1 rounded-lg text-left transition-colors ${
                          currentPly === blackPly ? 'bg-indigo-600 text-white font-black shadow' : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <span>{blackMove.san}</span>
                        <span className="text-[10px]">{getClassificationMeta(blackMove.classification).icon}</span>
                      </button>
                    ) : (
                      <div className="flex-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* PGN / FEN Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>📥 Загрузить партию для анализа</span>
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Вставьте PGN-текст партии или список ходов через пробел (например: <code className="text-emerald-400">1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5</code>).
            </p>

            <textarea
              rows={6}
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
              placeholder="1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 ..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />

            {importError && (
              <p className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded-xl border border-red-500/30 font-medium">
                {importError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleApplyCustomPgn}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all"
              >
                Анализировать партию
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full AI Game Review Modal */}
      {showFullReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <h3 className="text-lg md:text-xl font-black text-white">
                  Полный разбор партии от ИИ-Гроссмейстера
                </h3>
              </div>
              <button
                onClick={() => setShowFullReportModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {isAiAnalyzingGame && !fullGameReport ? (
              <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-bold text-white">ИИ анализирует дебют, миттельшпиль и эндшпиль...</p>
                  <p className="text-xs text-slate-400">Оцениваются критические переломные моменты и ошибки обоих игроков</p>
                </div>
              </div>
            ) : fullGameReport ? (
              <div className="flex flex-col gap-4">
                {/* Accuracy Comparison Banner */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-slate-400">Точность белых</span>
                    <span className="text-2xl font-black font-mono text-emerald-400">{fullGameReport.whiteAccuracy}%</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-slate-400">Точность черных</span>
                    <span className="text-2xl font-black font-mono text-indigo-400">{fullGameReport.blackAccuracy}%</span>
                  </div>
                </div>

                {/* Verdict */}
                <div className="p-3.5 bg-gradient-to-r from-indigo-950/60 to-violet-950/60 border border-indigo-500/40 rounded-2xl">
                  <span className="text-xs font-extrabold text-indigo-300 block mb-1 uppercase tracking-wider">Вердикт гроссмейстера:</span>
                  <p className="text-base font-extrabold text-white">{fullGameReport.verdictRu}</p>
                </div>

                {/* Summary Text */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-slate-200 text-xs md:text-sm leading-relaxed space-y-2.5 font-medium whitespace-pre-line">
                  {fullGameReport.summary}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowFullReportModal(false)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    Вернуться к доске
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                Не удалось получить отчет. Проверьте соединение с интернетом.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: ИГРАТЬ С DUOWINDO6601 ОДИНОЧНАЯ ПАРТИЯ С ИИ-БОТОМ */}
      {showPlayBotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30">
                  🦉
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-black text-white">
                    ИГРАТЬ С DUOWINDO6601
                  </h3>
                  <p className="text-xs text-amber-300 font-bold">
                    Одиночная партия с ИИ-ботом • 1500 ELO
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPlayBotModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl text-lg font-bold bg-slate-800 hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              DuoWindo6601 — гроссмейстер Совиного Королевства. Выберите, как вы хотите сыграть:
            </p>

            {/* Play Options */}
            <div className="flex flex-col gap-3">
              {/* Option 1: Continue from current position */}
              <button
                onClick={() => {
                  setShowPlayBotModal(false);
                  if (onPlayAgainstBot) {
                    onPlayAgainstBot(currentFen, movesList.slice(0, currentPly));
                  } else if (onNewGame) {
                    onNewGame();
                  }
                }}
                className="p-3.5 bg-gradient-to-r from-slate-800 to-slate-800/80 hover:from-amber-950/40 hover:to-orange-950/40 border-2 border-amber-500/40 hover:border-amber-400 rounded-2xl text-left transition-all group flex items-start gap-3 shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-black text-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  ▶️
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-white group-hover:text-amber-300">
                      Продолжить с текущей позиции ({Math.ceil(currentPly / 2)} ход)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full font-bold">
                      Рекомендуется
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Сыграть против DuoWindo6601 с сохранением текущего расположения фигур и всех сыгранных ходов.
                  </p>
                </div>
              </button>

              {/* Option 2: Fresh game from beginning */}
              <button
                onClick={() => {
                  setShowPlayBotModal(false);
                  if (onPlayAgainstBot) {
                    onPlayAgainstBot();
                  } else if (onNewGame) {
                    onNewGame();
                  }
                }}
                className="p-3.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-500 rounded-2xl text-left transition-all group flex items-start gap-3 shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  ⚔️
                </div>
                <div className="flex-1">
                  <span className="font-extrabold text-sm text-white group-hover:text-emerald-300">
                    Новая одиночная партия с начала
                  </span>
                  <p className="text-xs text-slate-400 mt-1">
                    Классическая шахматная партия белыми фигурами с 1-го хода против DuoWindo6601 с таймером и XP.
                  </p>
                </div>
              </button>

              {/* Option 3: Enable bot right on analysis board */}
              <button
                onClick={() => {
                  setShowPlayBotModal(false);
                  setIsDuoBotActive(true);
                  setBoardMode('append');
                  playSound('select');
                  const chess = new Chess(currentFen);
                  if (chess.turn() === 'b' && !chess.isGameOver()) {
                    triggerDuoBotReply(movesList.slice(0, currentPly), currentFen);
                  } else {
                    setDuoSpeech("🦉 DuoWindo6601: «Я включен прямо на этой доске анализа! Сделай свой ход!»");
                  }
                }}
                className="p-3.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-500 rounded-2xl text-left transition-all group flex items-start gap-3 shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 font-black text-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  🤖
                </div>
                <div className="flex-1">
                  <span className="font-extrabold text-sm text-white group-hover:text-indigo-300">
                    Играть прямо на этой доске анализа
                  </span>
                  <p className="text-xs text-slate-400 mt-1">
                    Бот будет мгновенно отвечать на любые ваши ходы на доске анализа с одновременным ИИ-разбором.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
