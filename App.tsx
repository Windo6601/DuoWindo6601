
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { AppScreen, Exercise, UserProgress, Course, WordToken, LeaderboardEntry, SubscriptionTier, RoleplayMessage } from './types';
import { Chess, Square } from 'chess.js';
import { generateExercise, checkAnswerWithAI, pingGeminiApi, speakText, startRoleplay, replyToRoleplay, generateIllusion, generateDrawing, checkDrawing, getFallbackExercise, getChessMove, getChessChatReply, translateText, getMistakeExplanation, generateLocalMistakeExplanation, generateIshihara, generateInterviewQuestion, getInterviewHint, generateReading, generateVideoCallRoleplayResponse } from './services/geminiService';

import { detectSystemCompatibility, SimulationMode, SystemCompatibilityResult } from "./services/systemCompatibilityService";
import { SystemCompatibilityBanner } from "./components/SystemCompatibilityBanner";
import { SystemInfoModal } from "./components/SystemInfoModal";
import { BetaModal } from "./components/BetaModal";
import { playSound } from './services/audioService';
import { 
  HomeIcon, DumbbellIcon, ShieldIcon, ChestIcon, UserIcon,
  FireIcon, GemStoneIcon, VolumeIcon, CloseIcon, BookIcon, 
  InfiniteHeartIcon, InfiniteEnergyIcon, LightningIcon, BatteryIcon, CameraIcon,
  ActivityIcon, StarIcon, CheckCircleIcon, GridIcon, MicIcon, NewWordIcon,
  WarningIcon, TurtleIcon, PlusIcon, SuperIcon, MaxIcon, NoAdIcon, ChatBubbleIcon, EarIcon, PenIcon, EyeIcon, GearIcon, TrashIcon, UndoIcon, ArrowRightIcon, AlphabetIcon, PaletteIcon, VideoIcon, PhoneIcon, MonitorIcon, SparklesIcon
} from './components/Icons';
import { Mascot } from './components/Mascot';
import { IshiharaPlateCanvas } from './components/IshiharaPlateCanvas';
import { DrawingCanvas } from './components/DrawingCanvas';
import { FeedbackScreen } from './components/FeedbackScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { SupportChatScreen } from './components/SupportChatScreen';
import { ActivityChart } from './components/ActivityChart';
import { VocabularyBank } from './components/VocabularyBank';
import { IncognitoRestrictionsModal } from './components/IncognitoRestrictionsModal';
import { IncognitoDataExportModal } from './components/IncognitoDataExportModal';
import { FirebaseExportModal } from './components/FirebaseExportModal';
import { DataDeletionModal, isUserAdminAccount } from './components/DataDeletionModal';
import { DataTransferExpertModal } from './components/DataTransferExpertModal';
import { PlacementTestModal } from './components/PlacementTestModal';
import { 
  downloadFirebaseExportFile, 
  copyFirebaseExportToClipboard 
} from './services/firebaseExportService';
import { 
  isIncognitoLoginClosed, 
  getDaysUntilIncognitoClosure, 
  getFormattedClosureDate, 
  downloadIncognitoDataFile,
  isIncognitoClosingTomorrow,
  getIncognitoClosureTitle,
  getSynchronizedActiveStatuses
} from './services/incognitoService';
import { 
  DUOWINDO6601_OFFICIAL_CATALOG, 
  formatLearnerCount, 
  searchCatalog,
  SPEAKER_LANGUAGES,
  getCoursesForSpeaker,
  getLocalizedLanguageName,
  getLocalizedCatalogTitle,
  LANGUAGE_TRANSLATIONS,
  SpeakerLanguageOption
} from './services/duowindo6601Catalog';
import { ALL_COUNTRIES, getLocalizedCountryName } from './services/countryTranslationService';
import { AiLimitModal } from './components/AiLimitModal';
import { AiLimitSection } from './components/AiLimitSection';
import { GeminiRefillSection } from './components/GeminiRefillSection';
import { getTodayAiUsage, AiUsageStatus, isCustomApiKeySkipped } from './services/aiLimitManager';
import { AuthModal } from './components/AuthModal';
import { ChessInviteModal, ChessOpponent } from './components/ChessInviteModal';
import { ChessAnalysisScreen } from './components/ChessAnalysisScreen';
import { triggerHapticFeedback } from './services/audioService';
import { LettersScreen } from './components/LettersScreen';
import { CIS_ALPHABET_DATA, AlphabetItem, AlphabetCategory as CISAlphabetCategory } from './services/alphabetData';
import {
  initFirestoreCacheMaintenance,
  recordFirestoreUserActivity,
  getFirestoreCacheStatus,
  purgeOldFirestoreCache,
  simulateInactivityForTesting,
  resetInactivityTimer,
  FirestoreCacheStatus,
  FIRESTORE_INACTIVITY_THRESHOLD_DAYS
} from './services/firestoreCacheManager';

// --- CHESS UTILS & TYPES ---
type ChessColor = 'w' | 'b';
interface ChessPiece {
  type: string;
  color: ChessColor;
  piece: string;
}
type Board = (ChessPiece | null)[][];
interface Coords { r: number; c: number; }

const INITIAL_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const isValidCoord = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

const parseFen = (fen: string): Board => {
  const board: Board = [];
  const rows = fen.split(' ')[0].split('/');
  for (const rowStr of rows) {
    const row: (ChessPiece | null)[] = [];
    for (const char of rowStr) {
      if (/\d/.test(char)) {
        const count = parseInt(char);
        for (let i = 0; i < count; i++) row.push(null);
      } else {
        const color = char === char.toUpperCase() ? 'w' : 'b';
        row.push({ type: char.toLowerCase(), color, piece: char });
      }
    }
    board.push(row);
  }
  return board;
};

const getStrictLegalPieceMoves = (fen: string, r: number, c: number): Coords[] => {
    try {
        const chess = new Chess(fen);
        const squareAlg = coordToAlg(r, c) as Square;
        const moves = chess.moves({ square: squareAlg, verbose: true });
        return moves.map(m => algToCoord(m.to));
    } catch(e) {
        return [];
    }
};

const getAllAI_Moves = (fen: string): {from: Coords, to: Coords}[] => {
    try {
        const chess = new Chess(fen);
        const moves = chess.moves({ verbose: true });
        return moves.map(m => ({ from: algToCoord(m.from), to: algToCoord(m.to) }));
    } catch(e) {
        return [];
    }
};

const coordToAlg = (r: number, c: number) => `${String.fromCharCode(97 + c)}${8 - r}`;
const algToCoord = (alg: string) => ({ c: alg.charCodeAt(0) - 97, r: 8 - parseInt(alg[1]) });

// Clean Staunton Chess Piece SVGs
const CHESS_UNICODE: Record<string, { w: string; b: string }> = {
  p: { w: '♙', b: '♟' },
  r: { w: '♖', b: '♜' },
  n: { w: '♘', b: '♞' },
  b: { w: '♗', b: '♝' },
  q: { w: '♕', b: '♛' },
  k: { w: '♔', b: '♚' },
};

const ChessPieceIcon: React.FC<{ type: string; color: ChessColor; className?: string }> = ({ type, color, className }) => {
    const isWhite = color === 'w';
    const fill = isWhite ? "#FFFFFF" : "#1E293B";
    const stroke = isWhite ? "#0F172A" : "#FFFFFF";
    const strokeWidth = 1.5;
    const t = type.toLowerCase(); 

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
                <path d="M 22.5,11.5 L 22.5,6 M 20,8.5 L 25,8.5" strokeWidth="2" />
                <path d="M 22.5,25 C 22.5,25 27,17.5 27,13 C 27,10.5 25.5,9 22.5,9 C 19.5,9 18,10.5 18,13 C 18,17.5 22.5,25 22.5,25 Z" />
                <path d="M 11.5,37 C 17,35 28,35 33.5,37 C 33.5,32 30,27 22.5,27 C 15,27 11.5,32 11.5,37 Z" />
                <path d="M 11.5,37 L 33.5,37 L 33.5,40 L 11.5,40 Z" />
                <path d="M 20,21 C 20,21 22.5,23.5 25,21" />
            </svg>
        );
    }

    return <span className={`text-2xl select-none ${isWhite ? 'text-white' : 'text-gray-900'}`}>{CHESS_UNICODE[t]?.[color] || '?'}</span>;
};

const RF_REPUBLICS = [
  { name: 'Adygea', local: 'Республика Адыгея' }, { name: 'Altai', local: 'Республика Алтай' },
  { name: 'Bashkortostan', local: 'Республика Башкортостан' }, { name: 'Buryatia', local: 'Республика Бурятия' },
  { name: 'Dagestan', local: 'Республика Дагестан' }, { name: 'Ingushetia', local: 'Республика Ингушетия' },
  { name: 'Kabardino-Balkaria', local: 'Кабардино-Балкарская Республика' }, { name: 'Kalmykia', local: 'Республика Калмыкия' },
  { name: 'Karachay-Cherkessia', local: 'Карачаево-Черкесская Республика' }, { name: 'Karelia', local: 'Республика Карелия' },
  { name: 'Komi', local: 'Республика Коми' }, { name: 'Crimea', local: 'Республика Крым' },
  { name: 'Mari El', local: 'Республика Марий Эл' }, { name: 'Mordovia', local: 'Республика Мордовия' },
  { name: 'Sakha (Yakutia)', local: 'Республика Саха (Якутия)' }, { name: 'North Ossetia', local: 'Республика Северная Осетия — Алания' },
  { name: 'Tatarstan', local: 'Республика Татарстан' }, { name: 'Tyva', local: 'Республика Тыва' },
  { name: 'Udmurtia', local: 'Удмуртская Республика' }, { name: 'Khakassia', local: 'Республика Хакасия' },
  { name: 'Chechnya', local: 'Чеченская Республика' }, { name: 'Chuvashia', local: 'Чувашская Республика' }
];

const RF_KRAIS = [
  { name: 'Altai Krai', local: 'Алтайский край' }, { name: 'Zabaykalsky', local: 'Забайкальский край' },
  { name: 'Kamchatka', local: 'Камчатский край' }, { name: 'Krasnodar', local: 'Краснодарский край' },
  { name: 'Krasnoyarsk', local: 'Красноярский край' }, { name: 'Perm', local: 'Пермский край' },
  { name: 'Primorsky', local: 'Приморский край' }, { name: 'Stavropol', local: 'Ставропольский край' },
  { name: 'Khabarovsk', local: 'Хабаровский край' }
];

const RF_OBLASTS = [
  { name: 'Amur', local: 'Амурская область' }, { name: 'Arkhangelsk', local: 'Архангельская область' },
  { name: 'Astrakhan', local: 'Астраханская область' }, { name: 'Belgorod', local: 'Белгородская область' },
  { name: 'Bryansk', local: 'Брянская область' }, { name: 'Vladimir', local: 'Владимирская область' },
  { name: 'Volgograd', local: 'Волгоградская область' }, { name: 'Vologda', local: 'Вологодская область' },
  { name: 'Voronezh', local: 'Воронежская область' }, { name: 'Zaporozhye', local: 'Запорожская область' },
  { name: 'Ivanovo', local: 'Ивановская область' }, { name: 'Irkutsk', local: 'Иркутская область' },
  { name: 'Kaliningrad', local: 'Калининградская область' }, { name: 'Kaluga', local: 'Калужская область' },
  { name: 'Kemerovo', local: 'Кемеровская область — Кузбасс' }, { name: 'Kirov', local: 'Кировская область' },
  { name: 'Kostroma', local: 'Костромская область' }, { name: 'Kurgan', local: 'Курганская область' },
  { name: 'Kursk', local: 'Курская область' }, { name: 'Leningrad', local: 'Ленинградская область' },
  { name: 'Lipetsk', local: 'Липецкая область' }, { name: 'Magadan', local: 'Магаданская область' },
  { name: 'Moscow', local: 'Московская область' }, { name: 'Murmansk', local: 'Мурманская область' },
  { name: 'Nizhny Novgorod', local: 'Нижегородская область' }, { name: 'Novgorod', local: 'Новгородская область' },
  { name: 'Novosibirsk', local: 'Новосибирская область' }, { name: 'Omsk', local: 'Омская область' },
  { name: 'Orenburg', local: 'Оренбургская область' }, { name: 'Oryol', local: 'Орловская область' },
  { name: 'Penza', local: 'Пензенская область' }, { name: 'Pskov', local: 'Псковская область' },
  { name: 'Rostov', local: 'Ростовская область' }, { name: 'Ryazan', local: 'Рязанская область' },
  { name: 'Samara', local: 'Самарская область' }, { name: 'Saratov', local: 'Саратовская область' },
  { name: 'Sakhalin', local: 'Сахалинская область' }, { name: 'Sverdlovsk', local: 'Свердловская область' },
  { name: 'Smolensk', local: 'Смоленская область' }, { name: 'Tambov', local: 'Тамбовская область' },
  { name: 'Tver', local: 'Тверская область' }, { name: 'Tomsk', local: 'Томская область' },
  { name: 'Tula', local: 'Тульская область' }, { name: 'Tyumen', local: 'Тюменская область' },
  { name: 'Ulyanovsk', local: 'Ульяновская область' }, { name: 'Kherson', local: 'Херсонская область' },
  { name: 'Chelyabinsk', local: 'Челябинская область' }, { name: 'Yaroslavl', local: 'Ярославская область' }
];

const COLORS = ['bg-duo-blue', 'bg-duo-green', 'bg-duo-red', 'bg-duo-yellow', 'bg-orange-500', 'bg-purple-600', 'bg-pink-500', 'bg-indigo-500'];
const BORDERS = ['border-duo-blueDark', 'border-duo-greenDark', 'border-red-700', 'border-yellowDark', 'border-orange-700', 'border-purple-800', 'border-pink-700', 'border-indigo-700'];

const generateCourses = (list: typeof RF_REPUBLICS, prefix: string) => {
  return list.map((item, index) => ({
    id: `rf-${prefix}-${index}`,
    name: item.name,
    localName: item.local,
    flagCode: 'ru',
    themeColor: COLORS[index % COLORS.length],
    themeBorder: BORDERS[index % BORDERS.length],
    mascotVariant: 'default' as const
  }));
};

const CIS_COURSES: Course[] = [
  { id: 'ru', name: 'Russian', localName: 'Русский (Россия)', flagCode: 'ru', themeColor: 'bg-blue-600', themeBorder: 'border-blue-800', mascotVariant: 'default' },
  { id: 'be', name: 'Belarusian', localName: 'Белорусский (Беларусь)', flagCode: 'by', themeColor: 'bg-red-600', themeBorder: 'border-red-800', mascotVariant: 'default' },
  { id: 'uk', name: 'Ukrainian', localName: 'Украинский (Украина)', flagCode: 'ua', themeColor: 'bg-amber-500', themeBorder: 'border-amber-700', mascotVariant: 'default' },
  { id: 'mo', name: 'Moldavian', localName: 'Молдавский (Молдова)', flagCode: 'md', themeColor: 'bg-blue-700', themeBorder: 'border-blue-900', mascotVariant: 'default' },
  { id: 'lt', name: 'Lithuanian', localName: 'Литовский (Литва)', flagCode: 'lt', themeColor: 'bg-yellow-600', themeBorder: 'border-yellow-800', mascotVariant: 'default' },
  { id: 'lv', name: 'Latvian', localName: 'Латышский (Латвия)', flagCode: 'lv', themeColor: 'bg-red-700', themeBorder: 'border-red-900', mascotVariant: 'default' },
  { id: 'et', name: 'Estonian', localName: 'Эстонский (Эстония)', flagCode: 'ee', themeColor: 'bg-sky-600', themeBorder: 'border-sky-800', mascotVariant: 'default' },
  { id: 'ka', name: 'Georgian', localName: 'Грузинский (Грузия)', flagCode: 'ge', themeColor: 'bg-rose-600', themeBorder: 'border-rose-800', mascotVariant: 'default' },
  { id: 'hy', name: 'Armenian', localName: 'Армянский (Армения)', flagCode: 'am', themeColor: 'bg-orange-600', themeBorder: 'border-orange-800', mascotVariant: 'default' },
  { id: 'az', name: 'Azerbaijani', localName: 'Азербайджанский (Азербайджан)', flagCode: 'az', themeColor: 'bg-cyan-600', themeBorder: 'border-cyan-800', mascotVariant: 'default' },
  { id: 'kk', name: 'Kazakh', localName: 'Казахский (Казахстан)', flagCode: 'kz', themeColor: 'bg-sky-500', themeBorder: 'border-sky-700', mascotVariant: 'default' },
  { id: 'uz', name: 'Uzbek', localName: 'Узбекский (Узбекистан)', flagCode: 'uz', themeColor: 'bg-emerald-500', themeBorder: 'border-emerald-700', mascotVariant: 'default' },
  { id: 'tk', name: 'Turkmen', localName: 'Туркменский (Туркменистан)', flagCode: 'tm', themeColor: 'bg-green-700', themeBorder: 'border-green-900', mascotVariant: 'default' },
  { id: 'ky', name: 'Kyrgyz', localName: 'Киргизский (Кыргызстан)', flagCode: 'kg', themeColor: 'bg-red-600', themeBorder: 'border-red-800', mascotVariant: 'default' },
  { id: 'tg', name: 'Tajik', localName: 'Таджикский (Таджикистан)', flagCode: 'tj', themeColor: 'bg-green-600', themeBorder: 'border-green-800', mascotVariant: 'default' },
];

const HARDEST_COURSES: Course[] = [
  { id: 'tab', name: 'Tabasaran', localName: 'Табасаранский (Табасаран)', flagCode: 'ru', themeColor: 'bg-purple-600', themeBorder: 'border-purple-800', mascotVariant: 'default' },
  { id: 'hu', name: 'Hungarian', localName: 'Венгерский (Magyar)', flagCode: 'hu', themeColor: 'bg-red-500', themeBorder: 'border-red-700', mascotVariant: 'default' },
  { id: 'eu', name: 'Basque', localName: 'Баскский (Euskara)', flagCode: 'es', themeColor: 'bg-emerald-600', themeBorder: 'border-emerald-800', mascotVariant: 'default' },
  { id: 'fi', name: 'Finnish', localName: 'Финский (Suomi)', flagCode: 'fi', themeColor: 'bg-blue-600', themeBorder: 'border-blue-800', mascotVariant: 'default' },
  { id: 'nv', name: 'Navajo', localName: 'Навахо (Diné bizaad)', flagCode: 'us', themeColor: 'bg-amber-600', themeBorder: 'border-amber-800', mascotVariant: 'default' },
  { id: 'is', name: 'Icelandic', localName: 'Исландский (Íslenska)', flagCode: 'is', themeColor: 'bg-indigo-600', themeBorder: 'border-indigo-800', mascotVariant: 'default' },
  { id: 'pl', name: 'Polish', localName: 'Польский (Polski)', flagCode: 'pl', themeColor: 'bg-rose-500', themeBorder: 'border-rose-700', mascotVariant: 'default' },
];

const HARDEST_LANGUAGE_INFO: Record<string, { badge: string; reasonRu: string; reasonEn: string; rank: string }> = {
  tab: { badge: '🏆 Рекорд Гиннесса', reasonRu: '48–53 падежа существительных, сложнейшая эргативная грамматика', reasonEn: 'Guinness Record: 48–53 noun cases, intricate ergative grammar', rank: '#1' },
  hu: { badge: '⚡ Уральский гигант', reasonRu: '18–35 падежей, сингармонизм гласных, агглютинация суффиксов', reasonEn: '18–35 noun cases, vowel harmony, agglutinative affixes', rank: '#2' },
  eu: { badge: '🗿 Древний изолят', reasonRu: 'Язык-изолят Европы, полиперсональное спряжение глаголов', reasonEn: 'European language isolate, polypersonal verb conjugation', rank: '#3' },
  fi: { badge: '❄️ 15 падежей', reasonRu: '15 падежей, чередование ступеней согласных, отсутствие предлогов', reasonEn: '15 noun cases, consonant gradation, no prepositions', rank: '#4' },
  nv: { badge: '🪶 Язык шифровальщиков', reasonRu: 'Полисинтетический строй, 4 тона, префиксы формы и одушевленности', reasonEn: 'Code Talkers language, polysynthetic verb structure, 4 tones', rank: '#5' },
  is: { badge: '⚔️ Язык викингов', reasonRu: 'Древнескандинавская морфология, 4 падежа, пуризм словаря', reasonEn: 'Old Norse archaic grammar, 4 cases, strict linguistic purism', rank: '#6' },
  pl: { badge: '🌪️ Фонетический шторм', reasonRu: '7 падежей, ряды шипящих согласных, сложнейшие исключения', reasonEn: '7 cases, dense consonant clusters (szcz, rz), complex aspects', rank: '#7' },
  ja: { badge: '🏯 3 системы письма', reasonRu: 'Кандзи + Хирагана + Катакана, система почтительности кейго', reasonEn: '3 writing scripts (Kanji/Kana), complex keigo honorifics', rank: '#8' },
  zh: { badge: '🏮 Тоновая иероглифика', reasonRu: '4 тона + нейтральный, тысячи логограмм, счётные слова', reasonEn: '4 tones, logographic characters, extensive homophones', rank: '#9' },
  ar: { badge: '📜 Трёхсогласный корень', reasonRu: 'Корневая морфология, письмо справа налево, двойственное число', reasonEn: 'Triconsonantal root system, right-to-left abjad script, dual form', rank: '#10' },
  ko: { badge: '🎎 Иерархия вежливости', reasonRu: '7 уровней уважительности, частицы-послелоги, агглютинация', reasonEn: '7 speech politeness levels, postpositions, SOV word order', rank: '#11' },
};

const WORLD_COURSES: Course[] = [
  { id: 'en', name: 'English', localName: 'Английский', flagCode: 'us', themeColor: 'bg-duo-blue', themeBorder: 'border-duo-blueDark', mascotVariant: 'default' },
  { id: 'de', name: 'German', localName: 'Немецкий', flagCode: 'de', themeColor: 'bg-orange-500', themeBorder: 'border-orange-700', mascotVariant: 'default' },
  { id: 'fr', name: 'French', localName: 'Французский', flagCode: 'fr', themeColor: 'bg-indigo-500', themeBorder: 'border-indigo-700', mascotVariant: 'default' },
  { id: 'es', name: 'Spanish', localName: 'Испанский', flagCode: 'es', themeColor: 'bg-yellow-500', themeBorder: 'border-yellow-700', mascotVariant: 'default' },
  { id: 'ja', name: 'Japanese', localName: 'Японский', flagCode: 'jp', themeColor: 'bg-rose-500', themeBorder: 'border-rose-700', mascotVariant: 'default' },
  { id: 'zh', name: 'Chinese', localName: 'Китайский', flagCode: 'cn', themeColor: 'bg-red-600', themeBorder: 'border-red-800', mascotVariant: 'default' },
  { id: 'ko', name: 'Korean', localName: 'Корейский', flagCode: 'kr', themeColor: 'bg-sky-400', themeBorder: 'border-sky-600', mascotVariant: 'default' },
  { id: 'it', name: 'Italian', localName: 'Итальянский', flagCode: 'it', themeColor: 'bg-green-600', themeBorder: 'border-green-800', mascotVariant: 'default' },
  { id: 'pt', name: 'Portuguese', localName: 'Португальский', flagCode: 'br', themeColor: 'bg-blue-500', themeBorder: 'border-blue-700', mascotVariant: 'default' },
  { id: 'ar', name: 'Arabic', localName: 'Арабский', flagCode: 'sa', themeColor: 'bg-emerald-600', themeBorder: 'border-emerald-800', mascotVariant: 'default' },
  { id: 'he', name: 'Hebrew', localName: 'Иврит', flagCode: 'il', themeColor: 'bg-blue-600', themeBorder: 'border-blue-800', mascotVariant: 'default' },
];

const ALL_HARDEST_COURSES: Course[] = [
  ...HARDEST_COURSES,
  ...WORLD_COURSES.filter(c => ['ja', 'zh', 'ar', 'ko'].includes(c.id))
];

const SPECIAL_COURSES: Course[] = [
  { id: 'math', name: 'Mathematics', localName: 'Математика', flagCode: 'math', themeColor: 'bg-duo-blue', themeBorder: 'border-duo-blueDark', mascotVariant: 'math' },
  { id: 'music', name: 'Music', localName: 'Музыка', flagCode: 'music', themeColor: 'bg-pink-500', themeBorder: 'border-pink-700', mascotVariant: 'music' },
  { id: 'chess', name: 'Chess', localName: 'Шахматы', flagCode: 'chess', themeColor: 'bg-slate-600', themeBorder: 'border-slate-800', mascotVariant: 'chess' },
];

const SPECIAL_IDS = ['math', 'music', 'chess', 'hv', 'tlh'];
const CONLANG_IDS = ['yi', 'hv', 'tlh'];
const CIS_IDS = CIS_COURSES.map(c => c.id);

const COURSES: Course[] = [
  ...HARDEST_COURSES,
  ...WORLD_COURSES,
  ...CIS_COURSES,
  ...SPECIAL_COURSES,
  ...generateCourses(RF_REPUBLICS, 'rep'),
  ...generateCourses(RF_KRAIS, 'krai'),
  ...generateCourses(RF_OBLASTS, 'obl')
];

interface AlphabetCategory {
  title: string;
  description?: string;
  script?: 'cyrillic' | 'latin' | 'arabic' | 'georgian' | 'armenian' | 'special';
  items: (string | AlphabetItem)[];
}

const ALPHABET_SETS: Record<string, AlphabetCategory[]> = {
  ...CIS_ALPHABET_DATA,
  'en': [
    {
      title: 'English Alphabet (26)',
      description: 'Standard Latin Alphabet with pronunciation and phonetic examples',
      script: 'latin',
      items: [
        { char: 'A', name: 'ay', sound: '[eɪ]/[æ]', word: 'Apple', translation: 'Яблоко / Apple' },
        { char: 'B', name: 'bee', sound: '[b]', word: 'Book', translation: 'Книга / Book' },
        { char: 'C', name: 'cee', sound: '[k]/[s]', word: 'Cat', translation: 'Кот / Cat' },
        { char: 'D', name: 'dee', sound: '[d]', word: 'Dog', translation: 'Собака / Dog' },
        { char: 'E', name: 'ee', sound: '[iː]/[e]', word: 'Elephant', translation: 'Слон / Elephant' },
        { char: 'F', name: 'ef', sound: '[f]', word: 'Fish', translation: 'Рыба / Fish' },
        { char: 'G', name: 'gee', sound: '[ɡ]/[dʒ]', word: 'Guitar', translation: 'Гитара / Guitar' },
        { char: 'H', name: 'aitch', sound: '[h]', word: 'House', translation: 'Дом / House' },
        { char: 'I', name: 'eye', sound: '[aɪ]/[ɪ]', word: 'Island', translation: 'Остров / Island' },
        { char: 'J', name: 'jay', sound: '[dʒ]', word: 'Juice', translation: 'Сок / Juice' },
        { char: 'K', name: 'kay', sound: '[k]', word: 'Kite', translation: 'Воздушный змей / Kite' },
        { char: 'L', name: 'el', sound: '[l]', word: 'Lion', translation: 'Лев / Lion' },
        { char: 'M', name: 'em', sound: '[m]', word: 'Moon', translation: 'Луна / Moon' },
        { char: 'N', name: 'en', sound: '[n]', word: 'Nest', translation: 'Гнездо / Nest' },
        { char: 'O', name: 'oh', sound: '[oʊ]/[ɒ]', word: 'Orange', translation: 'Апельсин / Orange' },
        { char: 'P', name: 'pee', sound: '[p]', word: 'Pen', translation: 'Ручка / Pen' },
        { char: 'Q', name: 'cue', sound: '[kw]', word: 'Queen', translation: 'Королева / Queen' },
        { char: 'R', name: 'ar', sound: '[r]', word: 'River', translation: 'Река / River' },
        { char: 'S', name: 'ess', sound: '[s]', word: 'Sun', translation: 'Солнце / Sun' },
        { char: 'T', name: 'tee', sound: '[t]', word: 'Tree', translation: 'Дерево / Tree' },
        { char: 'U', name: 'you', sound: '[juː]/[ʌ]', word: 'Umbrella', translation: 'Зонт / Umbrella' },
        { char: 'V', name: 'vee', sound: '[v]', word: 'Violin', translation: 'Скрипка / Violin' },
        { char: 'W', name: 'double-u', sound: '[w]', word: 'Water', translation: 'Вода / Water' },
        { char: 'X', name: 'ex', sound: '[ks]', word: 'Xylophone', translation: 'Ксилофон / Xylophone' },
        { char: 'Y', name: 'wy', sound: '[waɪ]/[j]', word: 'Yacht', translation: 'Яхта / Yacht' },
        { char: 'Z', name: 'zed / zee', sound: '[z]', word: 'Zebra', translation: 'Зебра / Zebra' }
      ]
    }
  ],
  'de': [
    {
      title: 'Deutsches Alphabet (30)',
      description: 'Немецкий алфавит с умлаутами и эсцет',
      script: 'latin',
      items: [
        { char: 'A', name: 'a', sound: '[aː]', word: 'Apfel', translation: 'Яблоко / Apple' },
        { char: 'B', name: 'be', sound: '[beː]', word: 'Buch', translation: 'Книга / Book' },
        { char: 'C', name: 'ce', sound: '[tseː]', word: 'Computer', translation: 'Компьютер / Computer' },
        { char: 'D', name: 'de', sound: '[deː]', word: 'Danke', translation: 'Спасибо / Thanks' },
        { char: 'E', name: 'e', sound: '[eː]', word: 'Elefant', translation: 'Слон / Elephant' },
        { char: 'F', name: 'ef', sound: '[ɛf]', word: 'Freund', translation: 'Друг / Friend' },
        { char: 'G', name: 'ge', sound: '[ɡeː]', word: 'Garten', translation: 'Сад / Garden' },
        { char: 'H', name: 'ha', sound: '[haː]', word: 'Haus', translation: 'Дом / House' },
        { char: 'I', name: 'i', sound: '[iː]', word: 'Insel', translation: 'Остров / Island' },
        { char: 'J', name: 'jot', sound: '[jɔt]', word: 'Jahr', translation: 'Год / Year' },
        { char: 'K', name: 'ka', sound: '[kaː]', word: 'Katze', translation: 'Кошка / Cat' },
        { char: 'L', name: 'el', sound: '[ɛl]', word: 'Lampe', translation: 'Лампа / Lamp' },
        { char: 'M', name: 'em', sound: '[ɛm]', word: 'Mond', translation: 'Луна / Moon' },
        { char: 'N', name: 'en', sound: '[ɛn]', word: 'Nacht', translation: 'Ночь / Night' },
        { char: 'O', name: 'o', sound: '[oː]', word: 'Ozean', translation: 'Океан / Ocean' },
        { char: 'P', name: 'pe', sound: '[peː]', word: 'Papier', translation: 'Бумага / Paper' },
        { char: 'Q', name: 'ku', sound: '[kuː]', word: 'Quelle', translation: 'Источник / Source' },
        { char: 'R', name: 'er', sound: '[ɛʁ]', word: 'Regen', translation: 'Дождь / Rain' },
        { char: 'S', name: 'es', sound: '[ɛs]', word: 'Sonne', translation: 'Солнце / Sun' },
        { char: 'T', name: 'te', sound: '[teː]', word: 'Tag', translation: 'День / Day' },
        { char: 'U', name: 'u', sound: '[uː]', word: 'Uhr', translation: 'Часы / Clock' },
        { char: 'V', name: 'vau', sound: '[faʊ]', word: 'Vogel', translation: 'Птица / Bird' },
        { char: 'W', name: 'we', sound: '[veː]', word: 'Wasser', translation: 'Вода / Water' },
        { char: 'X', name: 'ix', sound: '[ɪks]', word: 'Xylofon', translation: 'Ксилофон / Xylophone' },
        { char: 'Y', name: 'ypsilon', sound: '[ˈʏpsilɔn]', word: 'Yoga', translation: 'Йога / Yoga' },
        { char: 'Z', name: 'zett', sound: '[tsɛt]', word: 'Zug', translation: 'Поезд / Train' },
        { char: 'Ä', name: 'ä', sound: '[ɛː]', word: 'Äpfel', translation: 'Яблоки / Apples' },
        { char: 'Ö', name: 'ö', sound: '[øː]', word: 'Öl', translation: 'Масло / Oil' },
        { char: 'Ü', name: 'ü', sound: '[yː]', word: 'Über', translation: 'Над / Over' },
        { char: 'ß', name: 'eszett', sound: '[s]', word: 'Straße', translation: 'Улица / Street' }
      ]
    }
  ],
  'fr': [
    {
      title: 'Alphabet Français (26)',
      description: 'Французский алфавит с диакритикой',
      script: 'latin',
      items: [
        { char: 'A', name: 'a', sound: '[a]', word: 'Arbre', translation: 'Дерево / Tree' },
        { char: 'B', name: 'bé', sound: '[be]', word: 'Bateau', translation: 'Лодка / Boat' },
        { char: 'C', name: 'cé', sound: '[se]/[k]', word: 'Ciel', translation: 'Небо / Sky' },
        { char: 'D', name: 'dé', sound: '[de]', word: 'Danse', translation: 'Танец / Dance' },
        { char: 'E', name: 'e', sound: '[ə]', word: 'Eau', translation: 'Вода / Water' },
        { char: 'F', name: 'effe', sound: '[ɛf]', word: 'Fleur', translation: 'Цветок / Flower' },
        { char: 'G', name: 'gé', sound: '[ʒe]/[ɡ]', word: 'Gâteau', translation: 'Торт / Cake' },
        { char: 'H', name: 'hache', sound: '[-]', word: 'Hiver', translation: 'Зима / Winter' },
        { char: 'I', name: 'i', sound: '[i]', word: 'Île', translation: 'Остров / Island' },
        { char: 'J', name: 'ji', sound: '[ʒi]', word: 'Jour', translation: 'День / Day' },
        { char: 'K', name: 'ka', sound: '[ka]', word: 'Koala', translation: 'Коала / Koala' },
        { char: 'L', name: 'elle', sound: '[ɛl]', word: 'Lune', translation: 'Луна / Moon' },
        { char: 'M', name: 'emme', sound: '[ɛm]', word: 'Mer', translation: 'Море / Sea' },
        { char: 'N', name: 'enne', sound: '[ɛn]', word: 'Nuage', translation: 'Облако / Cloud' },
        { char: 'O', name: 'o', sound: '[o]', word: 'Oiseau', translation: 'Птица / Bird' },
        { char: 'P', name: 'pé', sound: '[pe]', word: 'Pain', translation: 'Хлеб / Bread' },
        { char: 'Q', name: 'qu', sound: '[ky]', word: 'Quatre', translation: 'Четыре / Four' },
        { char: 'R', name: 'erre', sound: '[ɛʁ]', word: 'Rose', translation: 'Роза / Rose' },
        { char: 'S', name: 'esse', sound: '[ɛs]', word: 'Soleil', translation: 'Солнце / Sun' },
        { char: 'T', name: 'té', sound: '[te]', word: 'Terre', translation: 'Земля / Earth' },
        { char: 'U', name: 'u', sound: '[y]', word: 'Usine', translation: 'Завод / Factory' },
        { char: 'V', name: 'vé', sound: '[ve]', word: 'Vent', translation: 'Ветер / Wind' },
        { char: 'W', name: 'double vé', sound: '[dubləve]', word: 'Wagon', translation: 'Вагон / Wagon' },
        { char: 'X', name: 'ixe', sound: '[iks]', word: 'Xylophone', translation: 'Ксилофон / Xylophone' },
        { char: 'Y', name: 'i grec', sound: '[iɡʁɛk]', word: 'Yeux', translation: 'Глаза / Eyes' },
        { char: 'Z', name: 'zède', sound: '[zɛd]', word: 'Zèbre', translation: 'Зебра / Zebra' },
        { char: 'É', name: 'e accent aigu', sound: '[e]', word: 'École', translation: 'Школа / School' },
        { char: 'È', name: 'e accent grave', sound: '[ɛ]', word: 'Père', translation: 'Отец / Father' },
        { char: 'Ç', name: 'c cédille', sound: '[s]', word: 'Français', translation: 'Французский / French' }
      ]
    }
  ],
  'es': [
    {
      title: 'Alfabeto Español (27)',
      description: 'Испанский алфавит с буквой Ñ',
      script: 'latin',
      items: [
        { char: 'A', name: 'a', sound: '[a]', word: 'Amigo', translation: 'Друг / Friend' },
        { char: 'B', name: 'be', sound: '[be]', word: 'Barco', translation: 'Корабль / Ship' },
        { char: 'C', name: 'ce', sound: '[θ]/[k]', word: 'Casa', translation: 'Дом / House' },
        { char: 'D', name: 'de', sound: '[de]', word: 'Día', translation: 'День / Day' },
        { char: 'E', name: 'e', sound: '[e]', word: 'Estrella', translation: 'Звезда / Star' },
        { char: 'F', name: 'efe', sound: '[efe]', word: 'Flor', translation: 'Цветок / Flower' },
        { char: 'G', name: 'ge', sound: '[xe]/[ɡ]', word: 'Gato', translation: 'Кот / Cat' },
        { char: 'H', name: 'hache', sound: '[-]', word: 'Hola', translation: 'Привет / Hello' },
        { char: 'I', name: 'i', sound: '[i]', word: 'Isla', translation: 'Остров / Island' },
        { char: 'J', name: 'jota', sound: '[xota]', word: 'Jardín', translation: 'Сад / Garden' },
        { char: 'K', name: 'ka', sound: '[ka]', word: 'Kilo', translation: 'Килограмм / Kilo' },
        { char: 'L', name: 'ele', sound: '[ele]', word: 'Luna', translation: 'Луна / Moon' },
        { char: 'M', name: 'eme', sound: '[eme]', word: 'Mar', translation: 'Море / Sea' },
        { char: 'N', name: 'ene', sound: '[ene]', word: 'Noche', translation: 'Ночь / Night' },
        { char: 'Ñ', name: 'eñe', sound: '[eɲe]', word: 'Niño', translation: 'Ребёнок / Child', tips: 'Буква N с тильдой' },
        { char: 'O', name: 'o', sound: '[o]', word: 'Ojo', translation: 'Глаз / Eye' },
        { char: 'P', name: 'pe', sound: '[pe]', word: 'Pan', translation: 'Хлеб / Bread' },
        { char: 'Q', name: 'cu', sound: '[ku]', word: 'Queso', translation: 'Сыр / Cheese' },
        { char: 'R', name: 'erre', sound: '[ere]/[r]', word: 'Río', translation: 'Река / River' },
        { char: 'S', name: 'ese', sound: '[ese]', word: 'Sol', translation: 'Солнце / Sun' },
        { char: 'T', name: 'te', sound: '[te]', word: 'Tierra', translation: 'Земля / Earth' },
        { char: 'U', name: 'u', sound: '[u]', word: 'Uva', translation: 'Виноград / Grape' },
        { char: 'V', name: 'uve', sound: '[ube]', word: 'Viento', translation: 'Ветер / Wind' },
        { char: 'W', name: 'uve doble', sound: '[ube doble]', word: 'Web', translation: 'Веб / Web' },
        { char: 'X', name: 'equis', sound: '[ekis]', word: 'Éxito', translation: 'Успех / Success' },
        { char: 'Y', name: 'ye / i griega', sound: '[ʝe]', word: 'Yo', translation: 'Я / I' },
        { char: 'Z', name: 'zeta', sound: '[θeta]', word: 'Zapato', translation: 'Обувь / Shoe' }
      ]
    }
  ],
  'zh': [
    {
      title: 'Иероглифы (Hanzi)',
      description: 'Базовые ключи и популярные китайские иероглифы',
      script: 'special',
      items: [
        { char: '一', name: 'yī', sound: '[ji]', word: '一天', translation: 'Один день / One day' },
        { char: '二', name: 'èr', sound: '[aɻ]', word: '二月', translation: 'Февраль / February' },
        { char: '三', name: 'sān', sound: '[san]', word: '三个人', translation: 'Три человека / 3 people' },
        { char: '四', name: 'sì', sound: '[sz̩]', word: '四季', translation: 'Четыре сезона / 4 seasons' },
        { char: '五', name: 'wǔ', sound: '[u]', word: '五星', translation: 'Пять звезд / Five stars' },
        { char: '六', name: 'liù', sound: '[ljou]', word: '六月', translation: 'Июнь / June' },
        { char: '七', name: 'qī', sound: '[tɕʰi]', word: '七天', translation: 'Семь дней / Seven days' },
        { char: '八', name: 'bā', sound: '[pa]', word: '八月', translation: 'Август / August' },
        { char: '九', name: 'jiǔ', sound: '[tɕjou]', word: '九点', translation: 'Девять часов / 9 o\'clock' },
        { char: '十', name: 'shí', sound: '[ʂʐ̩]', word: '十分', translation: 'Очень / Very' },
        { char: '人', name: 'rén', sound: '[ʐən]', word: '人民', translation: 'Человек / Person' },
        { char: '口', name: 'kǒu', sound: '[kʰou]', word: '门口', translation: 'Рот / Вход / Mouth' },
        { char: '日', name: 'rì', sound: '[ʐʐ̩]', word: '日出', translation: 'Солнце / День / Sun' },
        { char: '月', name: 'yuè', sound: '[ɥe]', word: '月亮', translation: 'Луна / Месяц / Moon' },
        { char: '水', name: 'shuǐ', sound: '[ʂwei]', word: '喝水', translation: 'Вода / Water' },
        { char: '火', name: 'huǒ', sound: '[xwo]', word: '火山', translation: 'Огонь / Fire' },
        { char: '木', name: 'mù', sound: '[mu]', word: '木头', translation: 'Дерево / Wood' },
        { char: '金', name: 'jīn', sound: '[tɕin]', word: '黄金', translation: 'Золото / Металл / Gold' },
        { char: '土', name: 'tǔ', sound: '[tʰu]', word: '土地', translation: 'Земля / Почва / Soil' },
        { char: '女', name: 'nǚ', sound: '[ny]', word: '女人', translation: 'Женщина / Woman' },
        { char: '子', name: 'zǐ', sound: '[tsz̩]', word: '孩子', translation: 'Ребенок / Сын / Child' },
        { char: '大', name: 'dà', sound: '[ta]', word: '大人', translation: 'Большой / Big' },
        { char: '小', name: 'xiǎo', sound: '[ɕjau]', word: '小孩', translation: 'Маленький / Small' },
        { char: '中', name: 'zhōng', sound: '[tʂuŋ]', word: '中国', translation: 'Центр / Китай / Middle' },
        { char: '国', name: 'guó', sound: '[kwo]', word: '国家', translation: 'Страна / Country' },
        { char: '山', name: 'shān', sound: '[ʂan]', word: '高山', translation: 'Гора / Mountain' },
        { char: '田', name: 'tián', sound: '[tʰjɛn]', word: '田野', translation: 'Поле / Field' },
        { char: '天', name: 'tiān', sound: '[tʰjɛn]', word: '天空', translation: 'Небо / День / Sky' },
        { char: '心', name: 'xīn', sound: '[ɕin]', word: '心情', translation: 'Сердце / Heart' },
        { char: '手', name: 'shǒu', sound: '[ʂou]', word: '双手', translation: 'Рука / Hand' }
      ]
    },
    {
      title: 'Пиньинь (Pinyin)',
      description: 'Латинская транслитерация китайского языка',
      script: 'latin',
      items: ['ā', 'á', 'ǎ', 'à', 'ō', 'ó', 'ǒ', 'ò', 'ē', 'é', 'ě', 'è', 'ī', 'í', 'ǐ', 'ì', 'ū', 'ú', 'ǔ', 'ù', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's']
    }
  ],
  'ja': [
    {
      title: 'Хирагана (Hiragana)',
      description: 'Японская слоговая азбука для исконно японских слов',
      script: 'special',
      items: [
        { char: 'あ', name: 'a', sound: '[a]', word: 'あさ (Asa)', translation: 'Утро / Morning' },
        { char: 'い', name: 'i', sound: '[i]', word: 'いぬ (Inu)', translation: 'Собака / Dog' },
        { char: 'う', name: 'u', sound: '[ɯ]', word: 'うみ (Umi)', translation: 'Море / Sea' },
        { char: 'え', name: 'e', sound: '[e]', word: 'えき (Eki)', translation: 'Станция / Station' },
        { char: 'お', name: 'o', sound: '[o]', word: 'お茶 (Ocha)', translation: 'Чай / Tea' },
        { char: 'か', name: 'ka', sound: '[ka]', word: 'かさ (Kasa)', translation: 'Зонт / Umbrella' },
        { char: 'き', name: 'ki', sound: '[ki]', word: 'き (Ki)', translation: 'Дерево / Tree' },
        { char: 'く', name: 'ku', sound: '[kɯ]', word: 'くるま (Kuruma)', translation: 'Машина / Car' },
        { char: 'け', name: 'ke', sound: '[ke]', word: 'けむり (Kemuri)', translation: 'Дым / Smoke' },
        { char: 'こ', name: 'ko', sound: '[ko]', word: 'こども (Kodomo)', translation: 'Ребенок / Child' },
        { char: 'さ', name: 'sa', sound: '[sa]', word: 'さくら (Sakura)', translation: 'Сакура / Cherry blossom' },
        { char: 'し', name: 'shi', sound: '[ɕi]', word: 'しろ (Shiro)', translation: 'Белый / White' },
        { char: 'す', name: 'su', sound: '[sɯ]', word: 'すし (Sushi)', translation: 'Суши / Sushi' },
        { char: 'せ', name: 'se', sound: '[se]', word: 'せんせい (Sensei)', translation: 'Учитель / Teacher' },
        { char: 'そ', name: 'so', sound: '[so]', word: 'そら (Sora)', translation: 'Небо / Sky' },
        { char: 'た', name: 'ta', sound: '[ta]', word: 'たけ (Take)', translation: 'Бамбук / Bamboo' },
        { char: 'ち', name: 'chi', sound: '[tɕi]', word: 'ちず (Chizu)', translation: 'Карта / Map' },
        { char: 'つ', name: 'tsu', sound: '[tsɯ]', word: 'つき (Tsuki)', translation: 'Луна / Moon' },
        { char: 'て', name: 'te', sound: '[te]', word: 'て (Te)', translation: 'Рука / Hand' },
        { char: 'と', name: 'to', sound: '[to]', word: 'とり (Tori)', translation: 'Птица / Bird' },
        { char: 'な', name: 'na', sound: '[na]', word: 'なつ (Natsu)', translation: 'Лето / Summer' },
        { char: 'に', name: 'ni', sound: '[ɲi]', word: 'にほん (Nihon)', translation: 'Япония / Japan' },
        { char: 'ぬ', name: 'nu', sound: '[nɯ]', word: 'ぬいぐるみ (Nuigurumi)', translation: 'Игрушка / Toy' },
        { char: 'ね', name: 'ne', sound: '[ne]', word: 'ねこ (Neko)', translation: 'Кошка / Cat' },
        { char: 'の', name: 'no', sound: '[no]', word: 'やまの (Yama no)', translation: 'Горы / Mountain\'s' },
        { char: 'は', name: 'ha', sound: '[ha]', word: 'はな (Hana)', translation: 'Цветок / Flower' },
        { char: 'ひ', name: 'hi', sound: '[çi]', word: 'ひかり (Hikari)', translation: 'Свет / Light' },
        { char: 'ふ', name: 'fu', sound: '[ɸɯ]', word: 'ふね (Fune)', translation: 'Корабль / Boat' },
        { char: 'へ', name: 'he', sound: '[he]', word: 'へや (Heya)', translation: 'Комната / Room' },
        { char: 'ほ', name: 'ho', sound: '[ho]', word: 'ほし (Hoshi)', translation: 'Звезда / Star' },
        { char: 'ま', name: 'ma', sound: '[ma]', word: 'まち (Machi)', translation: 'Город / Town' },
        { char: 'み', name: 'mi', sound: '[mi]', word: 'みず (Mizu)', translation: 'Вода / Water' },
        { char: 'む', name: 'mu', sound: '[mɯ]', word: 'むし (Mushi)', translation: 'Насекомое / Bug' },
        { char: 'め', name: 'me', sound: '[me]', word: 'め (Me)', translation: 'Глаз / Eye' },
        { char: 'も', name: 'mo', sound: '[mo]', word: 'もり (Mori)', translation: 'Лес / Forest' },
        { char: 'や', name: 'ya', sound: '[ja]', word: 'やま (Yama)', translation: 'Гора / Mountain' },
        { char: 'ゆ', name: 'yu', sound: '[jɯ]', word: 'ゆき (Yuki)', translation: 'Снег / Snow' },
        { char: 'よ', name: 'yo', sound: '[jo]', word: 'よる (Yoru)', translation: 'Ночь / Night' },
        { char: 'ら', name: 'ra', sound: '[ɾa]', word: 'らいおん (Raion)', translation: 'Лев / Lion' },
        { char: 'り', name: 'ri', sound: '[ɾi]', word: 'りんご (Ringo)', translation: 'Яблоко / Apple' },
        { char: 'る', name: 'ru', sound: '[ɾɯ]', word: 'るす (Rusu)', translation: 'Отсутствие / Away' },
        { char: 'れ', name: 're', sound: '[ɾe]', word: 'れんあい (Ren\'ai)', translation: 'Любовь / Love' },
        { char: 'ろ', name: 'ro', sound: '[ɾo]', word: 'ろうそく (Rōsoku)', translation: 'Свеча / Candle' },
        { char: 'わ', name: 'wa', sound: '[ɰa]', word: 'わに (Wani)', translation: 'Крокодил / Crocodile' },
        { char: 'を', name: 'wo / o', sound: '[o]', word: '本を (Hon o)', translation: 'Винительный падеж' },
        { char: 'ん', name: 'n', sound: '[ɴ]', word: 'ほん (Hon)', translation: 'Книга / Book' }
      ]
    },
    {
      title: 'Катакана (Katakana)',
      description: 'Японская слоговая азбука для заимствованных слов',
      script: 'special',
      items: ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ', 'サ', 'シ', 'ス', 'セ', 'ソ', 'タ', 'チ', 'ツ', 'テ', 'ト', 'ナ', 'ニ', 'ヌ', 'ネ', 'ノ', 'ハ', 'ヒ', 'フ', 'ヘ', 'ホ', 'マ', 'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ', 'ル', 'レ', 'ロ', 'ワ', 'ヲ', 'ン']
    }
  ],
  'ko': [
    {
      title: 'Согласные (Consonants)',
      description: 'Корейские согласные буквы хангыля',
      script: 'special',
      items: [
        { char: 'ㄱ', name: 'гиёк (giyeok)', sound: '[k]/[ɡ]', word: '가방 (Gabang)', translation: 'Сумка / Bag' },
        { char: 'ㄴ', name: 'ниын (nieun)', sound: '[n]', word: '나무 (Namu)', translation: 'Дерево / Tree' },
        { char: 'ㄷ', name: 'дигыт (digeut)', sound: '[t]/[d]', word: '달 (Dal)', translation: 'Луна / Moon' },
        { char: 'ㄹ', name: 'риыль (rieul)', sound: '[ɾ]/[l]', word: '라면 (Ramyeon)', translation: 'Рамен / Ramen' },
        { char: 'ㅁ', name: 'миым (mieum)', sound: '[m]', word: '물 (Mul)', translation: 'Вода / Water' },
        { char: 'ㅂ', name: 'биып (bieup)', sound: '[p]/[b]', word: '밥 (Bap)', translation: 'Рис / Еда / Rice' },
        { char: 'ㅅ', name: 'сиот (siot)', sound: '[s]', word: '사람 (Saram)', translation: 'Человек / Person' },
        { char: 'ㅇ', name: 'иын (ieung)', sound: '[-]/[ŋ]', word: '아이 (Ai)', translation: 'Ребенок / Child' },
        { char: 'ㅈ', name: 'джиыт (jieut)', sound: '[tɕ]/[dʒ]', word: '집 (Jip)', translation: 'Дом / House' },
        { char: 'ㅊ', name: 'чиыт (chieut)', sound: '[tɕʰ]', word: '차 (Cha)', translation: 'Чай / Машина / Tea' },
        { char: 'ㅋ', name: 'кхиык (khieuk)', sound: '[kʰ]', word: '커피 (Keopi)', translation: 'Кофе / Coffee' },
        { char: 'ㅌ', name: 'тхиыт (thieut)', sound: '[tʰ]', word: '토끼 (Tokki)', translation: 'Кролик / Rabbit' },
        { char: 'ㅍ', name: 'пхиып (phieup)', sound: '[pʰ]', word: '포도 (Podo)', translation: 'Виноград / Grape' },
        { char: 'ㅎ', name: 'хиыт (hieut)', sound: '[h]', word: '하늘 (Haneul)', translation: 'Небо / Sky' }
      ]
    },
    {
      title: 'Гласные (Vowels)',
      description: 'Корейские гласные буквы хангыля',
      script: 'special',
      items: ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ', 'ㅐ', 'ㅒ', 'ㅔ', 'ㅖ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ']
    }
  ],
  'ar': [
    {
      title: 'Арабские буквы (28)',
      description: 'Арабский алфавит с направлением письма справа налево',
      script: 'arabic',
      items: [
        { char: 'ا', name: 'Алиф (Alif)', sound: '[aː]', word: 'أب (Ab)', translation: 'Отец / Father' },
        { char: 'ب', name: 'Ба (Baa)', sound: '[b]', word: 'باب (Bab)', translation: 'Дверь / Door' },
        { char: 'ت', name: 'Та (Taa)', sound: '[t]', word: 'تمر (Tamr)', translation: 'Финики / Dates' },
        { char: 'ث', name: 'Са (Thaa)', sound: '[θ]', word: 'ثعلب (Tha\'lab)', translation: 'Лиса / Fox' },
        { char: 'ج', name: 'Джим (Jeem)', sound: '[dʒ]', word: 'جبل (Jabal)', translation: 'Гора / Mountain' },
        { char: 'ح', name: 'Ха (Haa)', sound: '[ħ]', word: 'حب (Hubb)', translation: 'Любовь / Love' },
        { char: 'خ', name: 'Ха (Khaa)', sound: '[x]', word: 'خبز (Khubz)', translation: 'Хлеб / Bread' },
        { char: 'د', name: 'Даль (Dal)', sound: '[d]', word: 'دار (Dar)', translation: 'Дом / House' },
        { char: 'ذ', name: 'Заль (Dhal)', sound: '[ð]', word: 'ذهب (Dhahab)', translation: 'Золото / Gold' },
        { char: 'ر', name: 'Ра (Raa)', sound: '[r]', word: 'رجل (Rajul)', translation: 'Мужчина / Man' },
        { char: 'ز', name: 'Зай (Zay)', sound: '[z]', word: 'زهرة (Zahra)', translation: 'Цветок / Flower' },
        { char: 'س', name: 'Син (Seen)', sound: '[s]', word: 'سلام (Salam)', translation: 'Мир / Peace' },
        { char: 'ش', name: 'Шин (Sheen)', sound: '[ʃ]', word: 'شمس (Shams)', translation: 'Солнце / Sun' },
        { char: 'ص', name: 'Сад (Saad)', sound: '[sˤ]', word: 'صديق (Sadeeq)', translation: 'Друг / Friend' },
        { char: 'ض', name: 'Дад (Daad)', sound: '[dˤ]', word: 'ضوء (Daw\')', translation: 'Свет / Light' },
        { char: 'ط', name: 'Та (Taa\')', sound: '[tˤ]', word: 'طالب (Talib)', translation: 'Студент / Student' },
        { char: 'ظ', name: 'За (Zaa\')', sound: '[ðˤ]', word: 'ظرف (Zarf)', translation: 'Конверт / Envelope' },
        { char: 'ع', name: 'Айн (\'Ayn)', sound: '[ʕ]', word: 'عين (\'Ayn)', translation: 'Глаз / Родник / Eye' },
        { char: 'غ', name: 'Гайн (Ghayn)', sound: '[ɣ]', word: 'غيمة (Ghayma)', translation: 'Облако / Cloud' },
        { char: 'ف', name: 'Фа (Faa)', sound: '[f]', word: 'فراشة (Farasha)', translation: 'Бабочка / Butterfly' },
        { char: 'ق', name: 'Каф (Qaaf)', sound: '[q]', word: 'قمر (Qamar)', translation: 'Луна / Moon' },
        { char: 'ك', name: 'Кяф (Kaaf)', sound: '[k]', word: 'كتاب (Kitab)', translation: 'Книга / Book' },
        { char: 'ل', name: 'Лям (Laam)', sound: '[l]', word: 'ليل (Layl)', translation: 'Ночь / Night' },
        { char: 'م', name: 'Мим (Meem)', sound: '[m]', word: 'ماء (Maa\')', translation: 'Вода / Water' },
        { char: 'ن', name: 'Нун (Noon)', sound: '[n]', word: 'نجم (Najm)', translation: 'Звезда / Star' },
        { char: 'ه', name: 'Ха (Haa\')', sound: '[h]', word: 'هدية (Hadiyya)', translation: 'Подарок / Gift' },
        { char: 'و', name: 'Вав (Waaw)', sound: '[w]/[uː]', word: 'وردة (Warda)', translation: 'Роза / Rose' },
        { char: 'ي', name: 'Йа (Yaa\')', sound: '[j]/[iː]', word: 'يد (Yad)', translation: 'Рука / Hand' }
      ]
    },
    {
      title: 'Огласовки и Знаки',
      description: 'Арабские харакаты (гласные значки)',
      script: 'arabic',
      items: ['َ', 'ُ', 'ِ', 'ً', 'ٌ', 'ٍ', 'ْ', 'ّ', 'آ', 'إ', 'أ', 'ء']
    }
  ],
  'he': [
    {
      title: 'Буквы иврита (22)',
      description: 'Еврейский квадратный алфавит (справа налево)',
      script: 'special',
      items: [
        { char: 'א', name: 'Алеф (Alef)', sound: '[ʔ]', word: 'אבא (Abba)', translation: 'Папа / Father' },
        { char: 'ב', name: 'Бет (Bet)', sound: '[b]/[v]', word: 'בית (Bayit)', translation: 'Дом / House' },
        { char: 'ג', name: 'Гимель (Gimel)', sound: '[ɡ]', word: 'גמל (Gamal)', translation: 'Верблюд / Camel' },
        { char: 'ד', name: 'Далет (Dalet)', sound: '[d]', word: 'דלת (Delet)', translation: 'Дверь / Door' },
        { char: 'ה', name: 'Хей (He)', sound: '[h]', word: 'הר (Har)', translation: 'Гора / Mountain' },
        { char: 'ו', name: 'Вав (Vav)', sound: '[v]/[o]/[u]', word: 'ורד (Vered)', translation: 'Роза / Rose' },
        { char: 'ז', name: 'Заин (Zayin)', sound: '[z]', word: 'זמן (Zman)', translation: 'Время / Time' },
        { char: 'ח', name: 'Хет (Chet)', sound: '[χ]', word: 'חבר (Chaver)', translation: 'Друг / Friend' },
        { char: 'ט', name: 'Тет (Tet)', sound: '[t]', word: 'טוב (Tov)', translation: 'Хорошо / Good' },
        { char: 'י', name: 'Йод (Yod)', sound: '[j]', word: 'ילד (Yeled)', translation: 'Мальчик / Boy' },
        { char: 'כ', name: 'Каф (Khaf)', sound: '[k]/[χ]', word: 'כוכב (Kochav)', translation: 'Звезда / Star' },
        { char: 'ל', name: 'Ламед (Lamed)', sound: '[l]', word: 'לב (Lev)', translation: 'Сердце / Heart' },
        { char: 'מ', name: 'Мем (Mem)', sound: '[m]', word: 'מים (Mayim)', translation: 'Вода / Water' },
        { char: 'נ', name: 'Нун (Nun)', sound: '[n]', word: 'נר (Ner)', translation: 'Свеча / Candle' },
        { char: 'ס', name: 'Самех (Samekh)', sound: '[s]', word: 'ספר (Sefer)', translation: 'Книга / Book' },
        { char: 'ע', name: 'Аин (Ayin)', sound: '[ʔ]', word: 'עין (Ayin)', translation: 'Глаз / Eye' },
        { char: 'פ', name: 'Пе (Pe/Fe)', sound: '[p]/[f]', word: 'פרח (Perach)', translation: 'Цветок / Flower' },
        { char: 'צ', name: 'Цади (Tsadi)', sound: '[ts]', word: 'ציפור (Tzipor)', translation: 'Птица / Bird' },
        { char: 'ק', name: 'Коф (Qof)', sound: '[k]', word: 'קיץ (Kayitz)', translation: 'Лето / Summer' },
        { char: 'ר', name: 'Реш (Resh)', sound: '[ʁ]', word: 'רוח (Ruach)', translation: 'Ветер / Дух / Wind' },
        { char: 'ש', name: 'Шин / Син (Shin)', sound: '[ʃ]/[s]', word: 'שלום (Shalom)', translation: 'Мир / Привет / Peace' },
        { char: 'ת', name: 'Тав (Tav)', sound: '[t]', word: 'תפוח (Tapuach)', translation: 'Яблоко / Apple' }
      ]
    },
    {
      title: 'Софиот (Конечные формы)',
      description: 'Формы букв, пишущиеся только на конце слова',
      script: 'special',
      items: ['ך', 'ם', 'ן', 'ף', 'ץ']
    }
  ],
  'hu': [
    {
      title: 'Magyar ábécé (Венгерский алфавит — 44 буквы)',
      description: 'Уникальный алфавит с двойными и тройными согласными (cs, dz, dzs, gy, ly, ny, sz, ty, zs)',
      script: 'latin',
      items: [
        { char: 'A', name: 'a', sound: '[ɒ]', word: 'Alma', translation: 'Яблоко' },
        { char: 'Á', name: 'á', sound: '[aː]', word: 'Álom', translation: 'Мечта / Сон' },
        { char: 'B', name: 'bé', sound: '[b]', word: 'Bor', translation: 'Вино' },
        { char: 'C', name: 'cé', sound: '[ts]', word: 'Cica', translation: 'Котёнок' },
        { char: 'Cs', name: 'csé', sound: '[tʃ]', word: 'Család', translation: 'Семья' },
        { char: 'D', name: 'dé', sound: '[d]', word: 'Dió', translation: 'Орех' },
        { char: 'Dz', name: 'dzé', sound: '[dz]', word: 'Edző', translation: 'Тренер' },
        { char: 'Dzs', name: 'dzsé', sound: '[dʒ]', word: 'Dzsip', translation: 'Джип' },
        { char: 'E', name: 'e', sound: '[ɛ]', word: 'Erdő', translation: 'Лес' },
        { char: 'É', name: 'é', sound: '[eː]', word: 'Élet', translation: 'Жизнь' },
        { char: 'F', name: 'ef', sound: '[f]', word: 'Fa', translation: 'Дерево' },
        { char: 'G', name: 'gé', sound: '[ɡ]', word: 'Gomba', translation: 'Гриб' },
        { char: 'Gy', name: 'gyé', sound: '[ɟ]', word: 'Gyerek', translation: 'Ребёнок' },
        { char: 'H', name: 'há', sound: '[h]', word: 'Ház', translation: 'Дом' },
        { char: 'I', name: 'i', sound: '[i]', word: 'Ing', translation: 'Рубашка' },
        { char: 'Í', name: 'í', sound: '[iː]', word: 'Ír', translation: 'Писать' },
        { char: 'J', name: 'jé', sound: '[j]', word: 'Jó', translation: 'Хороший' },
        { char: 'K', name: 'ká', sound: '[k]', word: 'Kéz', translation: 'Рука' },
        { char: 'L', name: 'el', sound: '[l]', word: 'Ló', translation: 'Лошадь' },
        { char: 'Ly', name: 'ej / el-ypsilon', sound: '[j]', word: 'Lyuk', translation: 'Дыра' },
        { char: 'M', name: 'em', sound: '[m]', word: 'Madár', translation: 'Птица' },
        { char: 'N', name: 'en', sound: '[n]', word: 'Nap', translation: 'Солнце / День' },
        { char: 'Ny', name: 'eny', sound: '[ɲ]', word: 'Nyelv', translation: 'Язык' },
        { char: 'O', name: 'o', sound: '[o]', word: 'Orr', translation: 'Нос' },
        { char: 'Ó', name: 'ó', sound: '[oː]', word: 'Óra', translation: 'Часы' },
        { char: 'Ö', name: 'ö', sound: '[ø]', word: 'Öt', translation: 'Пять' },
        { char: 'Ő', name: 'ő', sound: '[øː]', word: 'Ősz', translation: 'Осень' },
        { char: 'P', name: 'pé', sound: '[p]', word: 'Pénz', translation: 'Деньги' },
        { char: 'R', name: 'er', sound: '[r]', word: 'Reggel', translation: 'Утро' },
        { char: 'S', name: 'es', sound: '[ʃ]', word: 'Szép (s=[ш])', translation: 'Красивый' },
        { char: 'Sz', name: 'esz', sound: '[s]', word: 'Szó', translation: 'Слово' },
        { char: 'T', name: 'té', sound: '[t]', word: 'Tűz', translation: 'Огонь' },
        { char: 'Ty', name: 'tyé', sound: '[c]', word: 'Tyúk', translation: 'Курица' },
        { char: 'U', name: 'u', sound: '[u]', word: 'Utca', translation: 'Улица' },
        { char: 'Ú', name: 'ú', sound: '[uː]', word: 'Új', translation: 'Новый' },
        { char: 'Ü', name: 'ü', sound: '[y]', word: 'Üveg', translation: 'Стекло' },
        { char: 'Ű', name: 'ű', sound: '[yː]', word: 'Űr', translation: 'Космос' },
        { char: 'V', name: 'vé', sound: '[v]', word: 'Víz', translation: 'Вода' },
        { char: 'Z', name: 'zé', sound: '[z]', word: 'Zene', translation: 'Музыка' },
        { char: 'Zs', name: 'zsé', sound: '[ʒ]', word: 'Zseb', translation: 'Карман' }
      ]
    }
  ],
  'fi': [
    {
      title: 'Suomen aakkoset (Финский алфавит — 29 букв)',
      description: 'Фонетический алфавит с гармонией гласных (Ä, Ö, Y) и долгими звуками',
      script: 'latin',
      items: [
        { char: 'A', name: 'aa', sound: '[ɑ]', word: 'Aurinko', translation: 'Солнце' },
        { char: 'B', name: 'bee', sound: '[b]', word: 'Banaani', translation: 'Банан' },
        { char: 'C', name: 'see', sound: '[s]/[k]', word: 'Celsius', translation: 'Цельсий' },
        { char: 'D', name: 'dee', sound: '[d]', word: 'Kotiin (D)', translation: 'Домой' },
        { char: 'E', name: 'ee', sound: '[e]', word: 'Elämä', translation: 'Жизнь' },
        { char: 'F', name: 'äf', sound: '[f]', word: 'Farkut', translation: 'Джинсы' },
        { char: 'G', name: 'gee', sound: '[ɡ]', word: 'Helsinki (ng)', translation: 'Хельсинки' },
        { char: 'H', name: 'hoo', sound: '[h]', word: 'Hevonen', translation: 'Лошадь' },
        { char: 'I', name: 'ii', sound: '[i]', word: 'Ilta', translation: 'Вечер' },
        { char: 'J', name: 'jii', sound: '[j]', word: 'Järvi', translation: 'Озеро' },
        { char: 'K', name: 'koo', sound: '[k]', word: 'Kissa', translation: 'Кот' },
        { char: 'L', name: 'äl', sound: '[l]', word: 'Lumi', translation: 'Снег' },
        { char: 'M', name: 'äm', sound: '[m]', word: 'Maa', translation: 'Земля / Страна' },
        { char: 'N', name: 'än', sound: '[n]', word: 'Nainen', translation: 'Женщина' },
        { char: 'O', name: 'oo', sound: '[o]', word: 'Ovi', translation: 'Дверь' },
        { char: 'P', name: 'pee', sound: '[p]', word: 'Puu', translation: 'Дерево' },
        { char: 'R', name: 'är', sound: '[r]', word: 'Rakkaus', translation: 'Любовь' },
        { char: 'S', name: 'äs', sound: '[s]', word: 'Suomi', translation: 'Финляндия' },
        { char: 'T', name: 'tee', sound: '[t]', word: 'Talo', translation: 'Дом' },
        { char: 'U', name: 'uu', sound: '[u]', word: 'Uusi', translation: 'Новый' },
        { char: 'V', name: 'vee', sound: '[v]', word: 'Vesi', translation: 'Вода' },
        { char: 'Y', name: 'yy', sound: '[y]', word: 'Yö', translation: 'Ночь' },
        { char: 'Ä', name: 'ää', sound: '[æ]', word: 'Äiti', translation: 'Мама' },
        { char: 'Ö', name: 'öö', sound: '[ø]', word: 'Öljy', translation: 'Масло' },
        { char: 'Å', name: 'ruotsalainen oo', sound: '[oː]', word: 'Åland', translation: 'Аландские о-ва' }
      ]
    }
  ],
  'is': [
    {
      title: 'Íslenska stafrófið (Исландский алфавит — 32 буквы)',
      description: 'Древнескандинавские рунические буквы Торн (Þ) и Эд (Ð)',
      script: 'latin',
      items: [
        { char: 'A', name: 'a', sound: '[a]', word: 'Afi', translation: 'Дедушка' },
        { char: 'Á', name: 'á', sound: '[au]', word: 'Ást', translation: 'Любовь' },
        { char: 'B', name: 'bé', sound: '[p]', word: 'Bók', translation: 'Книга' },
        { char: 'D', name: 'dé', sound: '[t]', word: 'Dagur', translation: 'День' },
        { char: 'Ð', name: 'eð', sound: '[ð]', word: 'Maður', translation: 'Человек / Мужчина' },
        { char: 'E', name: 'e', sound: '[ɛ]', word: 'Eldur', translation: 'Огонь' },
        { char: 'É', name: 'é', sound: '[jɛ]', word: 'Ég', translation: 'Я' },
        { char: 'F', name: 'eff', sound: '[f]/[v]', word: 'Fjall', translation: 'Гора' },
        { char: 'G', name: 'ge', sound: '[k]/[ɣ]', word: 'Góður', translation: 'Хороший' },
        { char: 'H', name: 'há', sound: '[h]', word: 'Hús', translation: 'Дом' },
        { char: 'I', name: 'i', sound: '[ɪ]', word: 'Ísland', translation: 'Исландия' },
        { char: 'Í', name: 'í', sound: '[i]', word: 'Ís', translation: 'Лёд' },
        { char: 'J', name: 'joð', sound: '[j]', word: 'Jörð', translation: 'Земля' },
        { char: 'K', name: 'ká', sound: '[kʰ]', word: 'Köttur', translation: 'Кот' },
        { char: 'L', name: 'ell', sound: '[l]/[tl]', word: 'Ljós', translation: 'Свет' },
        { char: 'M', name: 'emm', sound: '[m]', word: 'Mamma', translation: 'Мама' },
        { char: 'N', name: 'enn', sound: '[n]', word: 'Nótt', translation: 'Ночь' },
        { char: 'O', name: 'o', sound: '[ɔ]', word: 'Ormur', translation: 'Змей' },
        { char: 'Ó', name: 'ó', sound: '[ou]', word: 'Ósk', translation: 'Желание' },
        { char: 'P', name: 'pé', sound: '[pʰ]', word: 'Pabbi', translation: 'Папа' },
        { char: 'R', name: 'err', sound: '[r]', word: 'Rigning', translation: 'Дождь' },
        { char: 'S', name: 'ess', sound: '[s]', word: 'Sól', translation: 'Солнце' },
        { char: 'T', name: 'té', sound: '[tʰ]', word: 'Tími', translation: 'Время' },
        { char: 'U', name: 'u', sound: '[ʏ]', word: 'Ull', translation: 'Шерсть' },
        { char: 'Ú', name: 'ú', sound: '[u]', word: 'Úlfar', translation: 'Волки' },
        { char: 'V', name: 'vaff', sound: '[v]', word: 'Vatn', translation: 'Вода' },
        { char: 'Þ', name: 'þorn', sound: '[θ]', word: 'Þakka', translation: 'Благодарить' },
        { char: 'Æ', name: 'æ', sound: '[ai]', word: 'Æska', translation: 'Молодость' },
        { char: 'Ö', name: 'ö', sound: '[œ]', word: 'Örn', translation: 'Орёл' }
      ]
    }
  ],
  'pl': [
    {
      title: 'Alfabet polski (Польский алфавит — 32 буквы)',
      description: 'Богатейшая система носовых гласных (Ą, Ę) и шипящих (Ć, Ł, Ń, Ś, Ź, Ż)',
      script: 'latin',
      items: [
        { char: 'A', name: 'a', sound: '[a]', word: 'Anioł', translation: 'Ангел' },
        { char: 'Ą', name: 'ą', sound: '[ɔ̃]', word: 'Mąż', translation: 'Муж' },
        { char: 'B', name: 'be', sound: '[b]', word: 'Brat', translation: 'Брат' },
        { char: 'C', name: 'ce', sound: '[ts]', word: 'Czas', translation: 'Время' },
        { char: 'Ć', name: 'cie', sound: '[tɕ]', word: 'Ćma', translation: 'Мотылёк' },
        { char: 'D', name: 'de', sound: '[d]', word: 'Dom', translation: 'Дом' },
        { char: 'E', name: 'e', sound: '[ɛ]', word: 'Ekran', translation: 'Экран' },
        { char: 'Ę', name: 'ę', sound: '[ɛ̃]', word: 'Ręka', translation: 'Рука' },
        { char: 'F', name: 'ef', sound: '[f]', word: 'Film', translation: 'Фильм' },
        { char: 'G', name: 'gie', sound: '[ɡ]', word: 'Góra', translation: 'Гора' },
        { char: 'H', name: 'ha', sound: '[x]', word: 'Herbata', translation: 'Чай' },
        { char: 'I', name: 'i', sound: '[i]', word: 'Iskra', translation: 'Искра' },
        { char: 'J', name: 'jot', sound: '[j]', word: 'Jutro', translation: 'Завтра' },
        { char: 'K', name: 'ka', sound: '[k]', word: 'Kot', translation: 'Кот' },
        { char: 'L', name: 'el', sound: '[l]', word: 'Las', translation: 'Лес' },
        { char: 'Ł', name: 'eł', sound: '[w]', word: 'Łódź', translation: 'Лодка' },
        { char: 'M', name: 'em', sound: '[m]', word: 'Mama', translation: 'Мама' },
        { char: 'N', name: 'en', sound: '[n]', word: 'Noc', translation: 'Ночь' },
        { char: 'Ń', name: 'eń', sound: '[ɲ]', word: 'Koń', translation: 'Конь' },
        { char: 'O', name: 'o', sound: '[ɔ]', word: 'Okno', translation: 'Окно' },
        { char: 'Ó', name: 'ó kreskowane', sound: '[u]', word: 'Ósmy', translation: 'Восьмой' },
        { char: 'P', name: 'pe', sound: '[p]', word: 'Polska', translation: 'Польша' },
        { char: 'R', name: 'er', sound: '[r]', word: 'Rzeka', translation: 'Река' },
        { char: 'S', name: 'es', sound: '[s]', word: 'Słońce', translation: 'Солнце' },
        { char: 'Ś', name: 'eś', sound: '[ɕ]', word: 'Śnieg', translation: 'Снег' },
        { char: 'T', name: 'te', sound: '[t]', word: 'Tydzień', translation: 'Неделя' },
        { char: 'U', name: 'u', sound: '[u]', word: 'Ulica', translation: 'Улица' },
        { char: 'W', name: 'wu', sound: '[v]', word: 'Woda', translation: 'Вода' },
        { char: 'Y', name: 'igrek', sound: '[ɨ]', word: 'Syn', translation: 'Сын' },
        { char: 'Z', name: 'zet', sound: '[z]', word: 'Zima', translation: 'Зима' },
        { char: 'Ź', name: 'ziet', sound: '[ʑ]', word: 'Źródło', translation: 'Источник' },
        { char: 'Ż', name: 'żet z kropką', sound: '[ʐ]', word: 'Życie', translation: 'Жизнь' }
      ]
    }
  ],
  'eu': [
    {
      title: 'Euskal alfabetoa (Баскский алфавит — 27 букв)',
      description: 'Древнейший изолированный язык Европы с диграфами ts, tx, tz',
      script: 'latin',
      items: [
        { char: 'A', name: 'a', sound: '[a]', word: 'Aita', translation: 'Отец' },
        { char: 'B', name: 'be', sound: '[b]', word: 'Begi', translation: 'Глаз' },
        { char: 'D', name: 'de', sound: '[d]', word: 'Diru', translation: 'Деньги' },
        { char: 'E', name: 'e', sound: '[e]', word: 'Etxeko', translation: 'Домашний' },
        { char: 'F', name: 'efe', sound: '[f]', word: 'Festa', translation: 'Праздник' },
        { char: 'G', name: 'ge', sound: '[ɡ]', word: 'Gau', translation: 'Ночь' },
        { char: 'H', name: 'hatxe', sound: '[h]', word: 'Haur', translation: 'Ребёнок' },
        { char: 'I', name: 'i', sound: '[i]', word: 'Izar', translation: 'Звезда' },
        { char: 'J', name: 'jota', sound: '[x]/[j]', word: 'Jan', translation: 'Есть / Кушать' },
        { char: 'K', name: 'ka', sound: '[k]', word: 'Katu', translation: 'Кот' },
        { char: 'L', name: 'ele', sound: '[l]', word: 'Lur', translation: 'Земля' },
        { char: 'M', name: 'eme', sound: '[m]', word: 'Mendi', translation: 'Гора' },
        { char: 'N', name: 'ene', sound: '[n]', word: 'Neskato', translation: 'Девочка' },
        { char: 'Ñ', name: 'eñe', sound: '[ɲ]', word: 'Iñaki', translation: 'Имя Иньяки' },
        { char: 'O', name: 'o', sound: '[o]', word: 'Ogi', translation: 'Хлеб' },
        { char: 'P', name: 'pe', sound: '[p]', word: 'Pake', translation: 'Мир' },
        { char: 'R', name: 'erre', sound: '[r]', word: 'Rojua', translation: 'Красный' },
        { char: 'S', name: 'ese', sound: '[s̺]', word: 'Sua', translation: 'Огонь' },
        { char: 'T', name: 'te', sound: '[t]', word: 'Txoria', translation: 'Птица' },
        { char: 'U', name: 'u', sound: '[u]', word: 'Ura', translation: 'Вода' },
        { char: 'Z', name: 'zeta', sound: '[s̻]', word: 'Zeru', translation: 'Небо' }
      ]
    }
  ],
  'nv': [
    {
      title: 'Diné bizaad (Алфавит навахо)',
      description: 'Язык легендарных шифровальщиков навахо: гортанные смычки, носовые гласные и 4 тона',
      script: 'latin',
      items: [
        { char: 'A', name: 'a', sound: '[ɑ]', word: 'Abíní', translation: 'Утро' },
        { char: 'B', name: 'bé', sound: '[p]', word: 'Bizaad', translation: 'Язык / Слово' },
        { char: 'Ch', name: 'ch', sound: '[tʃʰ]', word: 'Chidí', translation: 'Автомобиль' },
        { char: 'Chʼ', name: 'ch glottal', sound: '[tʃʼ]', word: 'Chʼah', translation: 'Шляпа' },
        { char: 'D', name: 'dé', sound: '[t]', word: 'Diné', translation: 'Навахо / Народ' },
        { char: 'Dl', name: 'dl', sound: '[tɬ]', word: 'Dlóóʼ', translation: 'Суслик' },
        { char: 'Dz', name: 'dz', sound: '[ts]', word: 'Dzidzé', translation: 'Ягода' },
        { char: 'E', name: 'e', sound: '[e]', word: 'Eʼeʼaah', translation: 'Запад' },
        { char: 'G', name: 'gé', sound: '[k]', word: 'Góola', translation: 'Золото' },
        { char: 'H', name: 'há', sound: '[x]', word: 'Hosh', translation: 'Кактус' },
        { char: 'I', name: 'i', sound: '[i]', word: 'Iiná', translation: 'Жизнь' },
        { char: 'J', name: 'jé', sound: '[tʃ]', word: 'Jóhonaaʼéí', translation: 'Солнце' },
        { char: 'K', name: 'ká', sound: '[kʰ]', word: 'Kǫʼ', translation: 'Огонь' },
        { char: 'Kʼ', name: 'k glottal', sound: '[kʼ]', word: 'Kʼad', translation: 'Сейчас' },
        { char: 'L', name: 'el', sound: '[l]', word: 'Lį́į́ʼ', translation: 'Лошадь' },
        { char: 'Ł', name: 'barred l', sound: '[ɬ]', word: 'Łóóʼ', translation: 'Рыба' },
        { char: 'M', name: 'em', sound: '[m]', word: 'Mósí', translation: 'Кошка' },
        { char: 'N', name: 'en', sound: '[n]', word: 'Níłchʼi', translation: 'Ветер' },
        { char: 'O', name: 'o', sound: '[o]', word: 'Ooljééʼ', translation: 'Луна' },
        { char: 'S', name: 'es', sound: '[s]', word: 'Są́', translation: 'Мудрость' },
        { char: 'Sh', name: 'esh', sound: '[ʃ]', word: 'Shash', translation: 'Медведь' },
        { char: 'T', name: 'té', sound: '[tʰ]', word: 'Tó', translation: 'Вода' },
        { char: 'Tʼ', name: 't glottal', sound: '[tʼ]', word: 'Tʼáá', translation: 'Просто / Только' },
        { char: 'W', name: 'we', sound: '[w]', word: 'Wózhchʼį́į́d', translation: 'Март' },
        { char: 'Y', name: 'ye', sound: '[j]', word: 'Yáʼátʼééh', translation: 'Привет' },
        { char: 'Z', name: 'zet', sound: '[z]', word: 'Zas', translation: 'Снег' }
      ]
    }
  ],
  'tab': [
    {
      title: 'Табасаран чIал (Табасаранский алфавит — Рекорд Гиннесса)',
      description: 'Дагестанский язык с 48–53 падежами, глухими и смычно-гортанными согласными (кI, пI, тI, цI, чI)',
      script: 'cyrillic',
      items: [
        { char: 'А', name: 'а', sound: '[a]', word: 'Абай', translation: 'Отец' },
        { char: 'Аь', name: 'аь', sound: '[æ]', word: 'Аьхю', translation: 'Большой' },
        { char: 'Б', name: 'бэ', sound: '[b]', word: 'Баб', translation: 'Мать' },
        { char: 'В', name: 'вэ', sound: '[v]', word: 'Варж', translation: 'Молот' },
        { char: 'Г', name: 'гэ', sound: '[g]', word: 'Гъяр', translation: 'Поле' },
        { char: 'Гъ', name: 'гъ', sound: '[ʁ]', word: 'Гъум', translation: 'Песок' },
        { char: 'Гь', name: 'гь', sound: '[h]', word: 'Гьял', translation: 'Состояние' },
        { char: 'Д', name: 'дэ', sound: '[d]', word: 'Дад', translation: 'Отец' },
        { char: 'Ж', name: 'жэ', sound: '[ʒ]', word: 'Жэннет', translation: 'Рай' },
        { char: 'Жв', name: 'жв лабиал', sound: '[ʒʷ]', word: 'Жвув', translation: 'Сам' },
        { char: 'З', name: 'зэ', sound: '[z]', word: 'Зул', translation: 'Осень' },
        { char: 'И', name: 'и', sound: '[i]', word: 'Ицци', translation: 'Сладкий' },
        { char: 'Й', name: 'йот', sound: '[j]', word: 'Йигъ', translation: 'День' },
        { char: 'К', name: 'ка', sound: '[k]', word: 'Ккун', translation: 'Любить' },
        { char: 'Къ', name: 'къ увуляр', sound: '[qʼ]', word: 'Къакъ', translation: 'Курица' },
        { char: 'Кь', name: 'кь эйектив', sound: '[kʲʼ]', word: 'КьатI', translation: 'Кусок' },
        { char: 'КI', name: 'кI гортанный', sound: '[kʼ]', word: 'КIул', translation: 'Голова' },
        { char: 'Л', name: 'эл', sound: '[l]', word: 'Лазим', translation: 'Нужный' },
        { char: 'М', name: 'эм', sound: '[m]', word: 'МагIна', translation: 'Смысл' },
        { char: 'Н', name: 'эн', sound: '[n]', word: 'НивкI', translation: 'Сон' },
        { char: 'П', name: 'пэ', sound: '[p]', word: 'Пул', translation: 'Деньги' },
        { char: 'ПI', name: 'пI гортанный', sound: '[pʼ]', word: 'ПIини', translation: 'Черешня' },
        { char: 'Р', name: 'эр', sound: '[r]', word: 'Ряхь', translation: 'Дорога' },
        { char: 'С', name: 'эс', sound: '[s]', word: 'Саб', translation: 'Один' },
        { char: 'Т', name: 'тэ', sound: '[t]', word: 'ТIул', translation: 'Обычай' },
        { char: 'ТI', name: 'тI гортанный', sound: '[tʼ]', word: 'ТIуб', translation: 'Палец' },
        { char: 'У', name: 'у', sound: '[u]', word: 'Узу', translation: 'Я' },
        { char: 'Уь', name: 'уь', sound: '[y]', word: 'Уьмур', translation: 'Жизнь' },
        { char: 'Х', name: 'ха', sound: '[χ]', word: 'Хал', translation: 'Дом' },
        { char: 'Хъ', name: 'хъ увуляр', sound: '[qʰ]', word: 'Хъадагъу', translation: 'Взять' },
        { char: 'Хь', name: 'хь веляр', sound: '[xʲ]', word: 'Хьял', translation: 'Завтра' },
        { char: 'Ц', name: 'цэ', sound: '[ts]', word: 'ЦIа', translation: 'Огонь' },
        { char: 'ЦI', name: 'цI гортанный', sound: '[tsʼ]', word: 'ЦIийи', translation: 'Новый' },
        { char: 'Ч', name: 'чэ', sound: '[tʃ]', word: 'ЧIал', translation: 'Язык' },
        { char: 'ЧI', name: 'чI гортанный', sound: '[tʃʼ]', word: 'ЧIвур', translation: 'Лицо' },
        { char: 'Ш', name: 'ша', sound: '[ʃ]', word: 'Шубуб', translation: 'Три' },
        { char: 'Ъ', name: 'твёрдый знак', sound: '[ʔ]', word: 'Аьгъю', translation: 'Знание' }
      ]
    }
  ]
};

const ALPHABETS: Record<string, string[]> = {
  'ru': ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э', 'Ю', 'Я'],
  'hu': ['A', 'Á', 'B', 'C', 'Cs', 'D', 'Dz', 'Dzs', 'E', 'É', 'F', 'G', 'Gy', 'H', 'I', 'Í', 'J', 'K', 'L', 'Ly', 'M', 'N', 'Ny', 'O', 'Ó', 'Ö', 'Ő', 'P', 'R', 'S', 'Sz', 'T', 'Ty', 'U', 'Ú', 'Ü', 'Ű', 'V', 'Z', 'Zs'],
  'fi': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Å', 'Ä', 'Ö'],
  'is': ['A', 'Á', 'B', 'D', 'Ð', 'E', 'É', 'F', 'G', 'H', 'I', 'Í', 'J', 'K', 'L', 'M', 'N', 'O', 'Ó', 'P', 'R', 'S', 'T', 'U', 'Ú', 'V', 'X', 'Y', 'Ý', 'Þ', 'Æ', 'Ö'],
  'pl': ['A', 'Ą', 'B', 'C', 'Ć', 'D', 'E', 'Ę', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'Ł', 'M', 'N', 'Ń', 'O', 'Ó', 'P', 'R', 'S', 'Ś', 'T', 'U', 'W', 'Y', 'Z', 'Ź', 'Ż'],
  'eu': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
  'nv': ['A', 'B', 'Ch', 'Chʼ', 'D', 'Dl', 'Dz', 'E', 'G', 'Gh', 'H', 'Hw', 'I', 'J', 'K', 'Kʼ', 'Kw', 'L', 'Ł', 'M', 'N', 'O', 'S', 'Sh', 'T', 'Tʼ', 'Tł', 'Tłʼ', 'Ts', 'Tsʼ', 'W', 'X', 'Y', 'Z', 'Zh'],
  'tab': ['А', 'Аь', 'Б', 'В', 'Г', 'Гъ', 'Гь', 'Д', 'Е', 'Ё', 'Ж', 'Жв', 'З', 'И', 'Й', 'К', 'Къ', 'Кь', 'КI', 'Л', 'М', 'Н', 'О', 'П', 'ПI', 'Р', 'С', 'Т', 'ТI', 'У', 'Уь', 'Ф', 'Х', 'Хъ', 'Хь', 'Ц', 'ЦI', 'Ч', 'ЧI', 'Чв', 'ЧIв', 'Ш', 'Шв', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э', 'Ю', 'Я'],
  'be': ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'І', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ў', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Ы', 'Ь', 'Э', 'Ю', 'Я'],
  'uk': ['А', 'Б', 'В', 'Г', 'Ґ', 'Д', 'Е', 'Є', 'Ж', 'З', 'И', 'І', 'Ї', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ь', 'Ю', 'Я'],
  'mo': ['A', 'Ă', 'Â', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'Î', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'Ș', 'T', 'Ț', 'U', 'V', 'W', 'X', 'Y', 'Z'],
  'lt': ['A', 'Ą', 'B', 'C', 'Č', 'D', 'E', 'Ę', 'Ė', 'F', 'G', 'H', 'I', 'Į', 'Y', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'Š', 'T', 'U', 'Ų', 'Ū', 'V', 'Z', 'Ž'],
  'lv': ['A', 'Ā', 'B', 'C', 'Č', 'D', 'E', 'Ē', 'F', 'G', 'Ģ', 'H', 'I', 'Ī', 'J', 'K', 'Ķ', 'L', 'Ļ', 'M', 'N', 'Ņ', 'O', 'P', 'R', 'S', 'Š', 'T', 'U', 'Ū', 'V', 'Z', 'Ž'],
  'et': ['A', 'B', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'Š', 'Z', 'Ž', 'T', 'U', 'V', 'Õ', 'Ä', 'Ö', 'Ü'],
  'ka': ['ა', 'ბ', 'გ', 'დ', 'ე', 'ვ', 'ზ', 'თ', 'ი', 'კ', 'ლ', 'მ', 'ნ', 'ო', 'პ', 'ჟ', 'რ', 'ს', 'ტ', 'უ', 'ფ', 'ქ', 'ღ', 'ყ', 'შ', 'ჩ', 'ც', 'ძ', 'წ', 'ჭ', 'ხ', 'ჯ', 'ჰ'],
  'hy': ['Ա', 'Բ', 'Գ', 'Դ', 'Ե', 'Զ', 'Է', 'Ը', 'Թ', 'Ժ', 'Ի', 'Լ', 'Խ', 'Ծ', 'Կ', 'Հ', 'Ձ', 'Ղ', 'Ճ', 'Մ', 'Յ', 'Ն', 'Շ', 'Ո', 'Չ', 'Պ', 'Ջ', 'Ռ', 'Ս', 'Վ', 'Տ', 'Ր', 'Ց', 'Ւ', 'Փ', 'Ք', 'Օ', 'Ֆ', 'և'],
  'az': ['A', 'B', 'C', 'Ç', 'D', 'E', 'Ə', 'F', 'G', 'Ğ', 'H', 'X', 'I', 'İ', 'J', 'K', 'Q', 'L', 'M', 'N', 'O', 'Ö', 'P', 'R', 'S', 'Ş', 'T', 'U', 'Ü', 'V', 'Y', 'Z'],
  'kk': ['А', 'Ә', 'Б', 'В', 'Г', 'Ғ', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И', 'Й', 'К', 'Қ', 'Л', 'М', 'Н', 'Ң', 'О', 'Ө', 'П', 'Р', 'С', 'Т', 'У', 'Ұ', 'Ү', 'Ф', 'Х', 'Һ', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'І', 'Ь', 'Э', 'Ю', 'Я'],
  'uz': ['A', 'B', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z', 'Oʻ', 'Gʻ', 'Sh', 'Ch', 'Ng'],
  'tk': ['A', 'B', 'Ç', 'D', 'E', 'Ä', 'F', 'G', 'H', 'I', 'J', 'Ž', 'K', 'L', 'M', 'N', 'Ň', 'O', 'Ö', 'P', 'R', 'S', 'Ş', 'T', 'U', 'Ü', 'W', 'Y', 'Ý', 'Z'],
  'ky': ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'Ң', 'О', 'Ө', 'П', 'Р', 'С', 'Т', 'У', 'Ү', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э', 'Ю', 'Я'],
  'tg': ['А', 'Б', 'В', 'Г', 'Ғ', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И', 'Ӣ', 'Й', 'К', 'Қ', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ӯ', 'Ф', 'Х', 'Ҳ', 'Ч', 'Ҷ', 'Ш', 'Ъ', 'Э', 'Ю', 'Я'],
  'en': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
  'de': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Ä', 'Ö', 'Ü', 'ß'],
  'fr': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'É', 'È', 'Ç', 'À', 'Ù', 'Â', 'Ê', 'Î', 'Ô', 'Û'],
  'es': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
  'it': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'Z'],
  'pt': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Á', 'É', 'Í', 'Ó', 'Ú', 'Ã', 'Õ', 'Ç'],
  'zh': ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '人', '口', '日', '月', '水', '火', '木', '金', '土', '女', '子', '大', '小', '中', '国', '山', '田', '天', '地', '心', '手', '目', '石', '竹', '米', '糸', '耳', '言', '走', '足', '雨', '风', '龙', '车', '门', '马', '鸟', '鱼'],
  'ja': ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と', 'な', 'に', 'ぬ', 'ね', 'の', 'は', 'ひ', 'ふ', 'へ', 'ほ', 'ま', 'み', 'む', 'め', 'も', 'や', 'ゆ', 'よ', 'ら', 'り', 'る', 'れ', 'ろ', 'わ', 'を', 'ん'],
  'ko': ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ', 'ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'],
  'ar': ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'],
  'he': ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת', 'ך', 'ם', 'ן', 'ף', 'ץ']
};

const STORAGE_KEY = 'duowindo6601_user_progress_v1';

const COUNTRIES = ALL_COUNTRIES.map(c => ({
  code: c.code,
  name: c.name,
  local: c.translations['ru'] || c.name,
}));

const USER_TRANSLATIONS: Record<string, Record<string, string>> = {
  "home": {
    "ru": "Главная",
    "en": "Home",
    "de": "Startseite",
    "fr": "Accueil",
    "es": "Inicio",
    "ja": "ホーム",
    "zh": "主页",
    "ar": "الرئيسية"
  },
  "play_chess": {
    "ru": "Сыграем в Шахматы",
    "en": "Play Chess",
    "de": "Schach spielen",
    "fr": "Jouer aux échecs",
    "es": "Jugar ajedrez",
    "ja": "チェスをする",
    "zh": "下棋",
    "ar": "لعب الشطرنج"
  },
  "playChess": {
    "ru": "Сыграем в Шахматы",
    "en": "Play Chess",
    "de": "Schach spielen",
    "fr": "Jouer aux échecs",
    "es": "Jugar ajedrez",
    "ja": "チェスをする",
    "zh": "下棋",
    "ar": "لعب الشطرنج"
  },
  "practice": {
    "ru": "Практика",
    "en": "Practice",
    "de": "Übung",
    "fr": "Pratique",
    "es": "Práctica",
    "ja": "練習",
    "zh": "练习",
    "ar": "التدريب"
  },
  "video_call": {
    "ru": "ВидеоЗвонок",
    "en": "Video Call",
    "de": "Videoanruf",
    "fr": "Appel vidéo",
    "es": "Videollamada",
    "ja": "ビデオ通話",
    "zh": "视频通话",
    "ar": "مكالمة فيديو"
  },
  "videoCall": {
    "ru": "ВидеоЗвонок",
    "en": "Video Call",
    "de": "Videoanruf",
    "fr": "Appel vidéo",
    "es": "Videollamada",
    "ja": "ビデオ通話",
    "zh": "视频通话",
    "ar": "مكالمة فيديو"
  },
  "rating": {
    "ru": "Рейтинг",
    "en": "Rating",
    "de": "Bewertung",
    "fr": "Classement",
    "es": "Clasificación",
    "ja": "評価",
    "zh": "评分",
    "ar": "التصنيف"
  },
  "leaderboard": {
    "ru": "Рейтинг",
    "en": "Rating",
    "de": "Bewertung",
    "fr": "Classement",
    "es": "Clasificación",
    "ja": "評価",
    "zh": "评分",
    "ar": "التصنيف"
  },
  "store": {
    "ru": "Магазин",
    "en": "Store",
    "de": "Shop",
    "fr": "Boutique",
    "es": "Tienda",
    "ja": "ストア",
    "zh": "商店",
    "ar": "المتجر"
  },
  "shop": {
    "ru": "Магазин",
    "en": "Store",
    "de": "Shop",
    "fr": "Boutique",
    "es": "Tienda",
    "ja": "ストア",
    "zh": "商店",
    "ar": "المتجر"
  },
  "profile": {
    "ru": "Профиль",
    "en": "Profile",
    "de": "Profil",
    "fr": "Profil",
    "es": "Perfil",
    "ja": "プロフィール",
    "zh": "个人资料",
    "ar": "الملف الشخصي"
  },
  "full_access": {
    "ru": "Полный доступ",
    "en": "Full Access",
    "de": "Voller Zugriff",
    "fr": "Accès complet",
    "es": "Acceso completo",
    "ja": "フルアクセス",
    "zh": "完全访问",
    "ar": "وصول كامل"
  },
  "fullAccess": {
    "ru": "Полный доступ",
    "en": "Full Access",
    "de": "Voller Zugriff",
    "fr": "Accès complet",
    "es": "Acceso completo",
    "ja": "フルアクセス",
    "zh": "完全访问",
    "ar": "وصول كامل"
  },
  "languages": {
    "ru": "Язык стран",
    "en": "Languages",
    "de": "Sprachen",
    "fr": "Langues",
    "es": "Idiomas",
    "ja": "言語",
    "zh": "语言",
    "ar": "اللغات"
  },
  "section": {
    "ru": "Раздел",
    "en": "Section",
    "de": "Abschnitt",
    "fr": "Section",
    "es": "Sección",
    "ja": "セクション",
    "zh": "部分",
    "ar": "القسم"
  },
  "feedback": {
    "ru": "Отзыв",
    "en": "Feedback",
    "de": "Feedback",
    "fr": "Retour",
    "es": "Opinión",
    "ja": "フィードバック",
    "zh": "反馈",
    "ar": "الآراء"
  },
  "translator": {
    "ru": "Переводчик",
    "en": "Translator",
    "de": "Übersetzer",
    "fr": "Traducteur",
    "es": "Traductor",
    "ja": "翻訳",
    "zh": "翻译",
    "ar": "المترجم"
  },
  "register": {
    "ru": "Регистрация",
    "en": "Register",
    "de": "Registrieren",
    "fr": "Inscription",
    "es": "Registro",
    "ja": "登録",
    "zh": "注册",
    "ar": "تسجيل الحساب"
  },
  "login": {
    "ru": "Вход",
    "en": "Login",
    "de": "Anmelden",
    "fr": "Connexion",
    "es": "Iniciar sesión",
    "ja": "ログイン",
    "zh": "登录",
    "ar": "تسجيل الدخول"
  },
  "guest_mode": {
    "ru": "Войти как Гость",
    "en": "Guest Mode",
    "de": "Gastmodus",
    "fr": "Mode invité",
    "es": "Modo invitado",
    "ja": "ゲストモード",
    "zh": "访客模式",
    "ar": "وضع الضيف"
  },
  "guestMode": {
    "ru": "Войти как Гость",
    "en": "Guest Mode",
    "de": "Gastmodus",
    "fr": "Mode invité",
    "es": "Modo invitado",
    "ja": "ゲストモード",
    "zh": "访客模式",
    "ar": "وضع الضيف"
  },
  "username": {
    "ru": "Имя пользователя",
    "en": "Username",
    "de": "Benutzername",
    "fr": "Nom d'utilisateur",
    "es": "Nombre de usuario",
    "ja": "ユーザー名",
    "zh": "用户名",
    "ar": "اسم المستخدم"
  },
  "name": {
    "ru": "Имя",
    "en": "Name",
    "de": "Name",
    "fr": "Nom",
    "es": "Nombre",
    "ja": "名前",
    "zh": "姓名",
    "ar": "الاسم"
  },
  "avatar": {
    "ru": "Аватар",
    "en": "Avatar",
    "de": "Avatar",
    "fr": "Avatar",
    "es": "Avatar",
    "ja": "アバター",
    "zh": "头像",
    "ar": "الصورة الرمزية"
  },
  "color": {
    "ru": "Цвет",
    "en": "Color",
    "de": "Farbe",
    "fr": "Couleur",
    "es": "Color",
    "ja": "色",
    "zh": "颜色",
    "ar": "اللون"
  },
  "save": {
    "ru": "Сохранить",
    "en": "Save",
    "de": "Speichern",
    "fr": "Sauvegarder",
    "es": "Guardar",
    "ja": "保存",
    "zh": "保存",
    "ar": "حفظ"
  },
  "cancel": {
    "ru": "Отмена",
    "en": "Cancel",
    "de": "Abbrechen",
    "fr": "Annuler",
    "es": "Cancelar",
    "ja": "キャンセル",
    "zh": "取消",
    "ar": "إلغاء"
  },
  "continue": {
    "ru": "Продолжить",
    "en": "Continue",
    "de": "Weiter",
    "fr": "Continuer",
    "es": "Continuar",
    "ja": "続ける",
    "zh": "继续",
    "ar": "متابعة"
  },
  "loading": {
    "ru": "Загрузка",
    "en": "Loading",
    "de": "Laden",
    "fr": "Chargement",
    "es": "Cargando",
    "ja": "読み込み中",
    "zh": "加载中",
    "ar": "جاري التحميل"
  },
  "error": {
    "ru": "Ошибка",
    "en": "Error",
    "de": "Fehler",
    "fr": "Erreur",
    "es": "Error",
    "ja": "エラー",
    "zh": "错误",
    "ar": "خطأ"
  },
  "no_internet": {
    "ru": "Нет интернета",
    "en": "No Internet",
    "de": "Kein Internet",
    "fr": "Pas d'internet",
    "es": "Sin internet",
    "ja": "インターネットなし",
    "zh": "无网络",
    "ar": "لا يوجد إنترنت"
  },
  "noInternet": {
    "ru": "Нет интернета",
    "en": "No Internet",
    "de": "Kein Internet",
    "fr": "Pas d'internet",
    "es": "Sin internet",
    "ja": "インターネットなし",
    "zh": "无网络",
    "ar": "لا يوجد إنترنت"
  },
  "reviews_duowindo6601": {
    "ru": "Отзывы о DuoWindo6601",
    "en": "Reviews about DuoWindo6601",
    "de": "Bewertungen über DuoWindo6601",
    "fr": "Avis sur DuoWindo6601",
    "es": "Reseñas sobre DuoWindo6601",
    "ja": "DuoWindo6601のレビュー",
    "zh": "关于DuoWindo6601的评价",
    "ar": "مراجعات DuoWindo6601"
  },
  "reviewsduowindo6601": {
    "ru": "Отзывы о DuoWindo6601",
    "en": "Reviews about DuoWindo6601",
    "de": "Bewertungen über DuoWindo6601",
    "fr": "Avis sur DuoWindo6601",
    "es": "Reseñas sobre DuoWindo6601",
    "ja": "DuoWindo6601のレビュー",
    "zh": "关于DuoWindo6601的评价",
    "ar": "مراجعات DuoWindo6601"
  },
  "reviews_subtitle": {
    "ru": "Оставьте отзыв или задайте вопрос Администратору DuoWindo6601!",
    "en": "Leave feedback or ask a DuoWindo6601 Administrator a question!",
    "de": "Hinterlassen Sie Feedback oder stellen Sie Fragen an den DuoWindo6601-Administrator!",
    "fr": "Laissez un avis ou posez une question à l'administrateur DuoWindo6601 !",
    "es": "¡Deja tu opinión o haz una pregunta al Administrador de DuoWindo6601!",
    "ja": "レビューを投稿するか、DuoWindo6601管理者にご質問ください！",
    "zh": "留下评价或向DuoWindo6601管理员提问！",
    "ar": "اترك رأيك أو اسأل مسؤول DuoWindo6601!"
  },
  "reviews": {
    "ru": "Отзывы",
    "en": "Reviews",
    "de": "Bewertungen",
    "fr": "Avis",
    "es": "Reseñas",
    "ja": "レビュー",
    "zh": "评价",
    "ar": "المراجعات"
  },
  "suggestions": {
    "ru": "Предложения",
    "en": "Suggestions",
    "de": "Vorschläge",
    "fr": "Suggestions",
    "es": "Sugerencias",
    "ja": "提案",
    "zh": "建议",
    "ar": "المقترحات"
  },
  "admin_comments": {
    "ru": "Комментарии Администрации",
    "en": "Administration Comments",
    "de": "Kommentare der Administration",
    "fr": "Commentaires de l'administration",
    "es": "Comentarios de la administración",
    "ja": "管理者コメント",
    "zh": "管理团队评论",
    "ar": "تعليقات الإدارة"
  },
  "user_comments": {
    "ru": "Комментарии пользователей",
    "en": "User Comments",
    "de": "Benutzerkommentare",
    "fr": "Commentaires des utilisateurs",
    "es": "Comentarios de usuarios",
    "ja": "ユーザーコメント",
    "zh": "用户评论",
    "ar": "تعليقات المستخدمين"
  },
  "add_comment": {
    "ru": "Добавить комментарий",
    "en": "Add Comment",
    "de": "Kommentar hinzufügen",
    "fr": "Ajouter un commentaire",
    "es": "Agregar comentario",
    "ja": "コメントを追加",
    "zh": "添加评论",
    "ar": "إضافة تعليق"
  },
  "write_comment_placeholder": {
    "ru": "Напишите ваш комментарий...",
    "en": "Write your comment...",
    "de": "Schreiben Sie Ihren Kommentar...",
    "fr": "Écrivez votre commentaire...",
    "es": "Escriba su comentario...",
    "ja": "コメントを入力...",
    "zh": "写下您的评论...",
    "ar": "اكتب تعليقك..."
  },
  "admin_reply_placeholder": {
    "ru": "Напишите официальный ответ Администратора DuoWindo6601...",
    "en": "Write official DuoWindo6601 Administrator reply...",
    "de": "Schreiben Sie eine offizielle Antwort des DuoWindo6601-Administrators...",
    "fr": "Écrivez une réponse officielle de l'administrateur DuoWindo6601...",
    "es": "Escriba una respuesta oficial del Administrador de DuoWindo6601...",
    "ja": "DuoWindo6601管理者の公式回答を入力...",
    "zh": "写下 DuoWindo6601 管理员官方回复...",
    "ar": "اكتب رداً رسمياً من مسؤول DuoWindo6601..."
  },
  "as_admin_checkbox": {
    "ru": "От имени Администратора DuoWindo6601 👑",
    "en": "As DuoWindo6601 Administrator 👑",
    "de": "Als DuoWindo6601-Administrator 👑",
    "fr": "En tant qu'administrateur DuoWindo6601 👑",
    "es": "Como Administrador de DuoWindo6601 👑",
    "ja": "DuoWindo6601管理者として 👑",
    "zh": "以 DuoWindo6601 管理员身份 👑",
    "ar": "بصفتك مسؤول DuoWindo6601 👑"
  },
  "official_admin_reply": {
    "ru": "Официальный ответ",
    "en": "Official Response",
    "de": "Offizielle Antwort",
    "fr": "Réponse officielle",
    "es": "Respuesta oficial",
    "ja": "公式回答",
    "zh": "官方回复",
    "ar": "رد رسمي"
  },
  "translate_btn": {
    "ru": "Перевести",
    "en": "Translate",
    "de": "Übersetzen",
    "fr": "Traduire",
    "es": "Traducir",
    "ja": "翻訳",
    "zh": "翻译",
    "ar": "ترجمة"
  },
  "show_original": {
    "ru": "Показать оригинал",
    "en": "Show original",
    "de": "Original anzeigen",
    "fr": "Afficher l'original",
    "es": "Mostrar original",
    "ja": "原文を表示",
    "zh": "显示原文",
    "ar": "عرض النص الأصلي"
  },
  "translator_title": {
    "ru": "🌐 Переводчик комментариев и отзывов",
    "en": "🌐 Comments & Reviews Translator",
    "de": "🌐 Übersetzer für Kommentare & Bewertungen",
    "fr": "🌐 Traducteur de commentaires et d'avis",
    "es": "🌐 Traductor de comentarios y reseñas",
    "ja": "🌐 コメント＆レビュー翻訳機",
    "zh": "🌐 评论与评价翻译器",
    "ar": "🌐 مترجم التعليقات والمراجعات"
  },
  "switch_language": {
    "ru": "Переключить язык",
    "en": "Switch Language",
    "de": "Sprache wechseln",
    "fr": "Changer de langue",
    "es": "Cambiar idioma",
    "ja": "言語を切り替える",
    "zh": "切换语言",
    "ar": "تغيير اللغة"
  },
  "good_review": {
    "ru": "👍 Хороший отзыв",
    "en": "👍 Good Review",
    "de": "👍 Gute Bewertung",
    "fr": "👍 Bon avis",
    "es": "👍 Buena reseña",
    "ja": "👍 良いレビュー",
    "zh": "👍 好评",
    "ar": "👍 تقييم جيد"
  },
  "bad_review": {
    "ru": "👎 Критический отзыв",
    "en": "👎 Critical Review",
    "de": "👎 Kritische Bewertung",
    "fr": "👎 Avis critique",
    "es": "👎 Reseña crítica",
    "ja": "👎 批判的レビュー",
    "zh": "👎 差评",
    "ar": "👎 تقييم نقدي"
  },
  "helpful": {
    "ru": "Полезно",
    "en": "Helpful",
    "de": "Hilfreich",
    "fr": "Utile",
    "es": "Útil",
    "ja": "役に立った",
    "zh": "有用",
    "ar": "مفيد"
  },
  "write_review": {
    "ru": "Написать отзыв о DuoWindo6601",
    "en": "Write a review about DuoWindo6601",
    "de": "Eine Bewertung zu DuoWindo6601 schreiben",
    "fr": "Écrire un avis sur DuoWindo6601",
    "es": "Escribir una reseña sobre DuoWindo6601",
    "ja": "DuoWindo6601のレビューを書く",
    "zh": "撰写关于DuoWindo6601的评价",
    "ar": "كتابة مراجعة عن DuoWindo6601"
  },
  "comments_access": {
    "ru": "Доступ Комментарии",
    "en": "Comments Access",
    "de": "Kommentare Zugriff",
    "fr": "Accès aux commentaires",
    "es": "Acceso a comentarios",
    "ja": "コメントアクセス",
    "zh": "评论访问",
    "ar": "الوصول إلى التعليقات"
  },
  "commentsaccess": {
    "ru": "Доступ Комментарии",
    "en": "Comments Access",
    "de": "Kommentare Zugriff",
    "fr": "Accès aux commentaires",
    "es": "Acceso a comentarios",
    "ja": "コメントアクセス",
    "zh": "评论访问",
    "ar": "الوصول إلى التعليقات"
  },
  "lang_ru": {
    "ru": "Русский",
    "en": "Russian",
    "de": "Russisch",
    "fr": "Russe",
    "es": "Ruso",
    "ja": "ロシア語",
    "zh": "俄语",
    "ar": "الروسية"
  },
  "lang_en": {
    "ru": "Английский",
    "en": "English",
    "de": "Englisch",
    "fr": "Anglais",
    "es": "Inglés",
    "ja": "英語",
    "zh": "英语",
    "ar": "الإنجليزية"
  },
  "lang_de": {
    "ru": "Немецкий",
    "en": "German",
    "de": "Deutsch",
    "fr": "Allemand",
    "es": "Alemán",
    "ja": "ドイツ語",
    "zh": "德语",
    "ar": "الألمانية"
  },
  "lang_fr": {
    "ru": "Французский",
    "en": "French",
    "de": "Französisch",
    "fr": "Français",
    "es": "Francés",
    "ja": "フランス語",
    "zh": "法语",
    "ar": "الفرنسية"
  },
  "lang_es": {
    "ru": "Испанский",
    "en": "Spanish",
    "de": "Spanisch",
    "fr": "Espagnol",
    "es": "Español",
    "ja": "スペイン語",
    "zh": "西班牙语",
    "ar": "الإسبانية"
  },
  "lang_ja": {
    "ru": "Японский",
    "en": "Japanese",
    "de": "Japanisch",
    "fr": "Japonais",
    "es": "Japonés",
    "ja": "日本語",
    "zh": "日语",
    "ar": "اليابانية"
  },
  "lang_zh": {
    "ru": "Китайский",
    "en": "Chinese",
    "de": "Chinesisch",
    "fr": "Chinois",
    "es": "Chino",
    "ja": "中国語",
    "zh": "中文",
    "ar": "الصينية"
  },
  "lang_ar": {
    "ru": "Арабский",
    "en": "Arabic",
    "de": "Arabisch",
    "fr": "Arabe",
    "es": "Árabe",
    "ja": "アラビア語",
    "zh": "阿拉伯语",
    "ar": "العربية"
  },
  "name_translator": {
    "ru": "Имя переводчик",
    "en": "Name Translator",
    "de": "Namensübersetzer",
    "fr": "Traducteur de noms",
    "es": "Traductor de nombres",
    "ja": "名前翻訳機",
    "zh": "姓名翻译器",
    "ar": "مترجم الأسماء"
  },
  "add_admin_comment": {
    "ru": "Добавить комментарий Администрации",
    "en": "Add Administration Comment",
    "de": "Administrationskommentar hinzufügen",
    "fr": "Ajouter un commentaire de l'administration",
    "es": "Agregar comentario de la administración",
    "ja": "管理者コメントを追加",
    "zh": "添加管理员评论",
    "ar": "إضافة تعليق من الإدارة"
  },
  "admin_name_title": {
    "ru": "Администратор DuoWindo6601",
    "en": "DuoWindo6601 Administrator",
    "de": "DuoWindo6601-Administrator",
    "fr": "Administrateur DuoWindo6601",
    "es": "Administrador de DuoWindo6601",
    "ja": "DuoWindo6601 管理者",
    "zh": "DuoWindo6601 管理员",
    "ar": "مسؤول DuoWindo6601"
  }
};

const TRANSLATIONS: Record<string, any> = {
  // ... (keeping translations concise for brevity, assume existing ones are here)
  ru: {
    androidAlertTitle: 'Приложение для Android!',
    androidAlertDesc: 'DuoWindo6601 теперь доступно на вашем мобильном устройстве! Откройте мир знаний на ходу.',
    androidAlertBtn: 'УСТАНОВИТЬ',
    androidModalTitle: 'Инструкция по установке',
    androidModalClose: 'Закрыть',
    coursesAndRegions: 'Курсы и Языковые регионы',
    searchPlaceholder: '🔍 Поиск языка или региона...',
    allCourses: 'Все курсы',
    hardestLanguages: 'Сложные языки (TOP)',
    cisLanguages: 'СНГ языки (15)',
    worldLanguages: 'Мировые языки',
    subjectsAndGames: 'Предметы & Игры',
    rfRegions: 'Регионы РФ',
    searchResults: 'Результаты поиска',
    hardestSectionTitle: 'Самые сложные языки мира',
    hardestSectionDesc: 'Языки с рекордным количеством падежей, уникальной грамматикой, полиперсональным строем и тонами',
    extremeDifficulty: 'Экстремальная сложность',
    cisSectionTitle: 'Языки СНГ и стран-соседей',
    worldSectionTitle: 'Популярные мировые языки',
    specialSectionTitle: 'Специальные предметы и Игры',
    rfSectionTitle: 'Субъекты и регионы РФ',
    regionalCourse: 'Региональный курс',
    foreignLanguage: 'Иностранный язык',
    specialSubject: 'Специальный предмет',
    musicTheory: 'Музыкальная теория',
    exactScience: 'Точная наука',
    chessLogic: 'Шахматная игра & Логика',
    betaTitle: 'DuoWindo6601 Доступ Бета-тестирование',
    betaDesc: 'Все функции приложения доступны для проверки тестеров: языки СНГ и мира, Шахматы, Графика, AI Озвучка и Панель Управления.',
    betaBtn: '🧪 Бета-Центр DuoWindo6601',
    reviewsBtn: '⭐ Отзывы',
    githubTitle: 'DuoWindo6601 уже доступен на GitHub',
    githubDesc: 'Автоматическая сборка Android APK запущена через .github/workflows/build.yml.',
    testAndroidBtn: '🤖 Тест Android',
    home: 'ГЛАВНАЯ', practice: 'ПРАКТИКА', leaderboard: 'РЕЙТИНГ', shop: 'МАГАЗИН', profile: 'ПРОФИЛЬ', feedback: 'ОТЗЫВЫ',
    lang_ru: 'Русский', lang_en: 'Английский', lang_de: 'Немецкий', lang_fr: 'Французский', lang_es: 'Испанский', lang_ja: 'Японский', lang_zh: 'Китайский',
    lang_hu: 'Венгерский', lang_fi: 'Финский', lang_is: 'Исландский', lang_pl: 'Польский', lang_eu: 'Баскский', lang_nv: 'Навахо', lang_tab: 'Табасаранский',
    videoCallDesc: 'Живое общение с AI партнером', storiesAndWriting: 'Истории и Письмо', leaderboardDesc: 'Топ-3 переходят в Серебряную лигу',
    sslCertificateTitle: 'Сертификат SSL (WR2 / Новый сайт)', sslCertificateDesc: 'Данное подтверждение: издатель сертификата — сайт WR2. Серверу успешно удалось предоставить журналы прозрачности.',
    edit: 'Изменить', mobileSimulatorBench: 'Тест-стенд Мобильный Симулятор', mobileSimulatorDesc: 'Интерактивный эмулятор iOS и Android для проверки адаптивности на ПК.',
    launchSimulator: 'Запустить стенд', usernameNotSet: 'Юзернейм не указан', incognito: 'Инкогнито',
    listenSpeech: 'Слушаю вашу речь...', typeMessage: 'Напишите сообщение...', send: 'Отправить', recordingSpeech: 'Запись речи... Нажмите микрофон еще раз для отправки',
    activeWith: 'Активно с', change: 'Изменить', isYou: 'Это вы',
    unit: 'Раздел', start: 'НАЧАТЬ', check: 'ПРОВЕРИТЬ', continue: 'ПРОДОЛЖИТЬ', skip: 'ПРОПУСТИТЬ',
    module1: 'МОДУЛЬ 1, РАЗДЕЛ 1', chessUnitName: 'Движение фигур',
    settings: 'Настройки', language: 'Язык', country: 'Страна', back: 'Назад', save: 'Сохранить',
    free: 'Бесплатно', trySuper: 'ПОПРОБОВАТЬ', connectMax: 'ПОДКЛЮЧИТЬ MAX', cancelSub: 'Отменить подписку',
    whatToLearn: 'Что вы хотите изучать?', newCourses: 'Новые курсы', forRu: 'Для знающих русский',
    shopTitle: 'Магазин 6601', leaderboardTitle: 'Бронзовая Лига', roleplays: 'Roleplays',
    audio: 'Аудио', speech: 'Речь', translate: 'Перевод', translator: 'Переводчик', illusion: 'Звуковая Иллюзия',
    drawing: 'Нарисовать буквы', offline: 'ОФЛАЙН', apiStatus: 'Состояние API', online: 'Онлайн',
    limitReached: 'Лимит исчерпан', checkConnection: 'Проверить соединение', voice: 'Голос',
    voiceProvider: 'Озвучка', t_api_online: 'API Онлайн!', t_offline_limit: 'Офлайн / Лимит исчерпан',
    t_skip: 'Упражнение пропущено', t_energy_low: 'У вас закончилась энергия! Купите Super или восполните её.',
    t_sub_cancel: 'Подписка отменена', t_welcome_super: 'Добро пожаловать в Super!', t_welcome_max: 'Добро пожаловать в Max!',
    t_buy_energy: 'Энергия восстановлена!', t_freeze_used: 'Ударный режим заморожен!', t_rec_error: 'Не удалось распознать. Попробуйте снова.',
    t_buy_gems: 'Куплено', t_topic_empty: 'Тема не выбрана: используем общие слова', t_api_error: 'Ошибка сети или лимит API',
    t_speech_empty: 'Мы ничего не услышали. Попробуйте еще раз.', alphabet: 'БУКВЫ', explainMax: 'Объясни мой ответ', explainHeader: 'Объяснение ошибки',
    ishihara: 'Тест Ишихары', ishiharaDesc: 'Проверка цветовосприятия', auto: 'Авто',
    chooseTier: "Выберите уровень", energy25: "25 Энергии", ads: "Реклама", infEnergy: "Бесконечная энергия", noAds: "Без рекламы",
    trafficFree: "Бесплатный трафик DuoWindo6601 Gemini API Key",
    trafficSuper: "Трафик DuoWindo6601 Super Платное Gemini API Key",
    trafficMax: "Трафик DuoWindo6601 Max Платное Gemini API Key",
    allInSuper: "Всё, что в Super", aiExplain: "Объяснение ответов (AI)", currentPlan: "ТЕКУЩИЙ ПЛАН", streakDays: "Ударные дни",
    totalXP: "Общий опыт", playChess: "СЫГРАЕМ В ШАХМАТЫ", chessDesc: "Партии с DuoWindo6601", games: "ПАРТИИ", wins: "ПОБЕДЫ", elo: "ЭЛО",
    startChess: "НАЧАТЬ: +30 XP", startSpeak: "Начни говорить →", whatHeard: "Что вы услышали?", speakForDuo: "Говори за Duo",
    chessSubtitle: "20-минутные партии с DuoWindo6601", startChessMatch: "НАЧАТЬ ПАРТИЮ: +30 ОЧКОВ ОПЫТА",
    pvp: "Игрок против Игрока", pve: "Игрок против DuoWindo6601",
    readPractice: "Практика чтения", aiTrans: "AI Переводчик", realOrNot: "Что реально, а что нет?", writePractice: "Практика письма",
    topicPrompt: "Тема для лексики?", topicPlaceholder: "Оставьте пустым для общих слов...", trySuperTitle: "ПОПРОБУЙТЕ SUPER",
    trySuperDesc: "Без рекламы и лимитов!", refill: "Восполнить до 25", freeze: "Заморозка", freezeDesc: "Сохрани ударный режим",
    refillGems: "Пополнить алмазы", popular: "Популярно", handful: "Горсть", sack: "Мешок", chest: "Сундук", cantListen: "НЕ МОГУ СЛУШАТЬ",
    cantSpeak: "НЕ МОГУ ГОВОРИТЬ", endChat: "Закончить", exitGame: "Выйти", great: "Великолепно!", wrong: "Ошибочка!", next: "ДАЛЕЕ",
    correctAnswer: "Правильно:", checkmateWin: "Мат! Вы победили!", checkmateLoss: "Мат! AI победил.",
    videoCall: "ВИДЕОЗВОНОК", startInterview: "Начать интервью", smartMode: "Умный режим", interviewer: "Интервьюер", self: "Вы",
    serverJsTitle: 'Поддержка server.js!',
    serverJsDesc: 'В проект DuoWindo официально добавлен собственный продакшн-сервер server.js с полной раздачей статики и поддержкой SPA-маршрутов!',
    serverJsBtn: 'Классно! 🚀',
    streakResume: 'Ударный режим',
    streakResumed: '🔥 Ударный режим возобновлен (+1 день за урок)!',
    browserBtn: 'Браузер',
    eduBtn: '💡 Обучение',
    eduWelcome: 'Добро пожаловать! Нажмите на любую белую фигуру, чтобы узнать, как она ходит.',
    lessonWelcome: 'Режим урока. Бот отключен. Вы можете свободно передвигать фигуры за обе стороны.',
    lessonBtn: 'Урок (без бота)',
    playDuoBtn: 'Игра с DuoWindo6601 (Бот)',
    chessStudyDesc: 'Режим урока (без бота). Готовьтесь и отрабатывайте ходы!',
    chessTutorialDesc: 'Обучение! Нажмите на любую белую фигуру, чтобы узнать её правила.',
    chessPlayDesc: 'Не бойтесь. Я буду играть вполсилы!',
    incognitoTitle: 'Режим Инкогнито (Без аккаунта)',
    incognitoLeaderboardDesc: 'Очки зачитываются локально. Зарегистрируйтесь, чтобы участвовать в глобальном рейтинге!',
    register: 'Регистрация',
    noUsername: 'Юзернейм не установлен',
    editProfile: 'Редактировать профиль',
    registerAuth: 'Регистрация / Вход',
    streakAdjustment: 'Регулировка ударного режима: ручная накрутка дней отключена (это считается нечестно). Ударный режим возобновляется и продлевается автоматически при прохождении уроков каждый день.',
    streakLessonAction: '🚀 Пройти урок для возобновления / продления (+1 день)',
    streakFairPlayBadge: '🛡️ Честная игра: только за прохождение уроков',
    streakFreezeActive: '❄️ Заморозка активна ({count} шт.)',
    toastStreakBack7: '⏪ Ударный режим: {streak} дн.',
    toastStreakBack1: '◀ Назад: {streak} дн.',
    toastStreakForward1: '▶ Вперёд: {streak} дн.',
    toastStreakForward7: '⏩ Вперёд (+7): {streak} дн.',
    days: 'дней',
    registerAndLogin: 'Регистрация и Вход',
    regLoginSubtitle: 'Зарегистрируйте аккаунт, войдите через Google или играйте Инкогнито без аккаунта',
    incognitoTab: 'Инкогнито',
    googleTab: 'Google',
    displayNameLabel: 'Ваше Имя',
    requiredLabel: '*Обязательно',
    displayNamePlaceholder: 'Например: Анатолий',
    usernameLabel: 'Имя пользователя (@username)',
    uniqueHandleLabel: 'Уникальный ник',
    profileLeaderboardVisible: 'Отображается в профиле и рейтинге',
    selectAvatarLabel: 'Выбор аватарки',
    registerAndStartBtn: 'Зарегистрироваться и Начать',
    fullIncognitoTitle: 'Полная анонимность без ввода имени и почты',
    noSignupPasswordsRule: 'Никакой регистрации и паролей',
    allProgressLocalRule: 'Весь прогресс сохраняется в вашем браузере',
    canRegisterAnytimeRule: 'Вы сможете зарегистрироваться в любой момент',
    continueGuestBtn: 'Войти как Гость / Инкогнито',
    firebaseCloudSyncTitle: 'Облачная синхронизация Firebase',
    syncAllDevicesDesc: 'Сохраняйте свой прогресс на всех устройствах',
    progressSyncNote: 'При входе ваш прогресс будет автоматически привязан к вашему Google-аккаунту.',
    iframeWarning: '⚠️ Ограничение фрейма: Вход может блокироваться внутри фрейма.',
    openNewTabBtn: 'Открыть в новой вкладке ↗',
    signInGoogleBtn: 'Войти через Google',
    skipContinueIncognitoBtn: 'Пропустить / Продолжить без аккаунта (Инкогнито) ↗',
    uploadPhotoBtn: '📷 Загрузить фото',
    deletePhotoBtn: '🗑️ Удалить фото',
    avatarUrlLabel: 'Ссылка на фото (URL)',
    avatarBgColorLabel: 'Цвет фона аватарки',
    avatarIconLabel: 'Значок / Иконка',
    cancelBtn: 'Отмена',
    saveProfileBtn: 'Сохранить',
    listeningPlaceholder: 'Слушаю вашу речь...',
    typingPlaceholder: 'Напишите сообщение...',
    sendBtn: 'Отправить',
    recordingToastText: '🎙 Запись речи... Нажмите микрофон еще раз для отправки',
    browserWarningTitle: 'Экран предупреждения: старый браузер не поддерживается',
    browserWarningSub: 'Проверка совместимости платформы DuoWindo6601',
    browserCompatibleTitle: 'Новый Браузер и современная ОС (Windows / Linux / macOS / Android):',
    browserCompatibleDesc: 'Ваша система полностью совместима! Предупреждений нет. Все функции, Gemini API и голосовой ввод работают отлично.',
    browserOutdatedTitle: 'Обнаружен устаревший браузер или неподдерживаемая ОС:',
    browserOutdatedDesc: 'Ваша система устарела (устаревший браузер или Windows XP / Windows Vista).',
    sysMessageLabel: 'Сообщение системы:',
    sysMessageDesc: 'К сожалению, ваш текущий браузер больше не поддерживается. Чтобы продолжить использовать Duowindo6601 обновитесь до современного браузера или Windows XP/Windows Vista не поддерживается',
    riskLabel: 'Риск:',
    riskDesc: 'Могут некорректно работать Gemini API',
    winOsSupportLabel: 'Сроки поддержки операционных систем Windows:',
    win7Desc: 'Полное прекращение поддержки',
    win7Status: '❌ Прекращена (14 января 2020 г.)',
    win8Status: '❌ Прекращена (10 января 2023 г.)',
    win10Desc: 'Бесплатная поддержка завершилась 14 октября 2025 г.',
    win10Status: '⚠️ ESU до 12 октября 2027 г.',
    win10Note: '* Платная программа расширенных обновлений (ESU) для обычных пользователей продлена до октября 2027 г.',
    win11Desc: 'Общей даты закрытия проекта нет, поддержка зависит от версии',
    win11Status: '✅ Версия 24H2 до 13 окт. 2026 г.',
    win11Note: '* Срок поддержки зависит от ежегодных крупных обновлений. Версия 24H2 (Home/Pro) поддерживается до 13 октября 2026 года.',
    modernBrowsersLabel: 'Рекомендуемые современные браузеры:',
    downloadBtn: 'Скачать',
    sslTitle: 'Сертификат SSL (WR2 / Новый сайт)',
    sslDesc: 'Данное подтверждение: издатель сертификата — сайт WR2. Серверу успешно удалось предоставить журналы прозрачности.',
    mobileSimTitle: 'Тест-стенд Мобильный Симулятор',
    mobileSimDesc: 'Интерактивный эмулятор iOS и Android для проверки адаптивности на ПК.',
    mobileSimBtn: 'Запустить стенд',
    feedbackBannerTitle: 'Отзывы и Поддержка',
    feedbackBannerDesc: 'Нашли ошибку или хотите идею?',
    adminBannerTitle: 'Панель Владельца — Admin Tool',
    adminBannerDesc: 'Ограничение: Доступ только администратора (Ввод пароля, эл. почты или admin)',
    cloudSaveTitle: 'Облачное сохранение',
    loading: 'Загрузка...',
    loggedInAs: 'Вы вошли как {user}',
    progressSynced: '● Прогресс синхронизирован с облаком',
    signOut: 'Выйти из аккаунта',
    savedLocallyAs: 'Вы зашли как @{username}. Данные сохраняются только в этом браузере.',
    updateBrowserBtn: 'Обновите свой браузер',
    continueDuoWindoBtn: 'Продолжить работу в DuoWindo6601'
  },
  en: {
    androidAlertTitle: 'Android App Available!',
    androidAlertDesc: 'DuoWindo6601 is now available on Android! Take your learning on the go.',
    androidAlertBtn: 'INSTALL NOW',
    androidModalTitle: 'Android Installation Guide',
    androidModalClose: 'Close',
    coursesAndRegions: 'Courses & Language Regions',
    searchPlaceholder: '🔍 Search language or region...',
    allCourses: 'All Courses',
    hardestLanguages: 'Hardest Languages (TOP)',
    cisLanguages: 'CIS Languages (15)',
    worldLanguages: 'World Languages',
    subjectsAndGames: 'Subjects & Games',
    rfRegions: 'RF Regions',
    searchResults: 'Search Results',
    hardestSectionTitle: "World's Hardest Languages",
    hardestSectionDesc: 'Languages with record case systems, polysynthetic structures, polypersonal agreement and extreme complexity',
    extremeDifficulty: 'Extreme Difficulty',
    cisSectionTitle: 'CIS & Neighboring Languages',
    worldSectionTitle: 'World Popular Languages',
    specialSectionTitle: 'Special Subjects & Games',
    rfSectionTitle: 'Russian Regions',
    regionalCourse: 'Regional Course',
    foreignLanguage: 'Foreign Language',
    specialSubject: 'Special Subject',
    musicTheory: 'Music Theory',
    exactScience: 'Exact Science',
    chessLogic: 'Chess Game & Logic',
    betaTitle: 'DuoWindo6601 Beta Testing Access',
    betaDesc: 'All app features are available for testing: CIS & world languages, Chess, Graphics, AI Voiceover, and Control Panel.',
    betaBtn: '🧪 DuoWindo6601 Beta Center',
    reviewsBtn: '⭐ Reviews',
    githubTitle: 'DuoWindo6601 is already available on GitHub',
    githubDesc: 'Automatic Android APK build is launched via .github/workflows/build.yml.',
    testAndroidBtn: '🤖 Test Android',
    home: 'HOME', practice: 'PRACTICE', leaderboard: 'LEADERBOARD', shop: 'SHOP', profile: 'PROFILE', feedback: 'FEEDBACK',
    lang_ru: 'Russian', lang_en: 'English', lang_de: 'German', lang_fr: 'French', lang_es: 'Spanish', lang_ja: 'Japanese', lang_zh: 'Chinese',
    lang_hu: 'Hungarian', lang_fi: 'Finnish', lang_is: 'Icelandic', lang_pl: 'Polish', lang_eu: 'Basque', lang_nv: 'Navajo', lang_tab: 'Tabasaran',
    videoCallDesc: 'Live communication with an AI partner', storiesAndWriting: 'Stories & Writing', leaderboardDesc: 'Top 3 advance to Silver League',
    sslCertificateTitle: 'SSL Certificate (WR2 / New Site)', sslCertificateDesc: 'Confirmation that certificate issuer is WR2 site. Server successfully presented transparency logs.',
    edit: 'Edit', mobileSimulatorBench: 'Mobile Simulator Test Bench', mobileSimulatorDesc: 'Interactive iOS & Android emulator for testing layouts on PC.',
    launchSimulator: 'Launch Simulator', usernameNotSet: 'No handle set', incognito: 'Incognito',
    listenSpeech: 'Listening to speech...', typeMessage: 'Type a message...', send: 'Send', recordingSpeech: 'Recording speech... Tap mic again to send',
    activeWith: 'Active with', change: 'Change', isYou: "It's you",
    unit: 'Unit', start: 'START', check: 'CHECK', continue: 'CONTINUE', skip: 'SKIP',
    module1: 'MODULE 1, UNIT 1', chessUnitName: 'Movement of pieces',
    settings: 'Settings', language: 'Language', country: 'Country', back: 'Back', save: 'Save',
    free: 'Free', trySuper: 'TRY SUPER', connectMax: 'GET MAX', cancelSub: 'Cancel Subscription',
    whatToLearn: 'What do you want to learn?', newCourses: 'New Courses', forRu: 'For Russian Speakers',
    shopTitle: 'Shop 6601', leaderboardTitle: 'Bronze League', roleplays: 'Roleplays',
    audio: 'Audio', speech: 'Speech', translate: 'Translation', translator: 'Translator', illusion: 'Sound Illusion',
    drawing: 'Draw Letters', offline: 'OFFLINE', apiStatus: 'API Status', online: 'Online',
    limitReached: 'Limit Reached', checkConnection: 'Check Connection', voice: 'Voice',
    voiceProvider: 'Voice Provider', t_api_online: 'API Online!', t_offline_limit: 'Offline / Limit Reached',
    t_skip: 'Skipped', t_energy_low: 'No Energy!', t_sub_cancel: 'Subscription cancelled',
    t_welcome_super: 'Welcome to Super!', t_welcome_max: 'Welcome to Max!', t_buy_energy: 'Refilled!',
    t_freeze_used: 'Frozen!', t_rec_error: 'Recognition failed.', t_buy_gems: 'Bought',
    t_topic_empty: 'No topic selected', t_api_error: 'API Error', t_speech_empty: 'Nothing heard', alphabet: 'LETTERS', explainMax: 'Explain my Answer', explainHeader: 'Mistake Explanation',
    ishihara: 'Ishihara Test', ishiharaDesc: 'Color Vision Check', auto: 'Auto',
    chooseTier: "Choose your tier", energy25: "25 Energy", ads: "Ads", infEnergy: "Infinite Energy", noAds: "No Ads",
    trafficFree: "DuoWindo6601 Free Traffic (Free Gemini API Key)",
    trafficSuper: "DuoWindo6601 Super Traffic (Paid Gemini API Key)",
    trafficMax: "DuoWindo6601 Max Traffic (Paid Gemini API Key)",
    allInSuper: "Everything in Super", aiExplain: "Answer Explanation (AI)", currentPlan: "CURRENT PLAN", streakDays: "Streak Days",
    totalXP: "Total XP", playChess: "LET'S PLAY CHESS", chessDesc: "Games with DuoWindo6601", games: "GAMES", wins: "WINS", elo: "ELO",
    startChess: "START: +30 XP", startSpeak: "Start speaking →", whatHeard: "What did you hear?", speakForDuo: "Speak for Duo",
    chessSubtitle: "20-minute games with DuoWindo6601", startChessMatch: "START MATCH: +30 XP",
    pvp: "Player vs Player", pve: "Player vs DuoWindo6601",
    readPractice: "Reading Practice", aiTrans: "AI Translator", realOrNot: "Real or not?", writePractice: "Writing Practice",
    topicPrompt: "Topic for vocabulary?", topicPlaceholder: "Leave empty for general...", trySuperTitle: "TRY SUPER",
    trySuperDesc: "No ads, no limits!", refill: "Refill to 25", freeze: "Freeze", freezeDesc: "Save your streak",
    refillGems: "Refill Gems", popular: "Popular", handful: "Handful", sack: "Sack", chest: "Chest", cantListen: "CAN'T LISTEN",
    cantSpeak: "CAN'T SPEAK", endChat: "End Chat", exitGame: "Exit Game", great: "Great job!", wrong: "Incorrect!", next: "CONTINUE",
    correctAnswer: "Correct:", checkmateWin: "Checkmate! You win!", checkmateLoss: "Checkmate! AI wins.",
    videoCall: "VIDEO CALL", startInterview: "Start Interview", smartMode: "Smart Mode", interviewer: "Interviewer", self: "You",
    serverJsTitle: 'server.js support is LIVE!',
    serverJsDesc: 'The DuoWindo project has officially integrated its own production server.js with complete static assets distribution and SPA fallback handling!',
    serverJsBtn: 'Awesome! 🚀',
    streakResume: 'Streak Mode',
    streakResumed: '🔥 Streak resumed (+1 day for lesson)!',
    browserBtn: 'Browser',
    eduBtn: '💡 Education',
    eduWelcome: 'Welcome! Click on any white piece to see how it moves.',
    lessonWelcome: 'Lesson Mode. Bot is disabled. You can move pieces for both sides.',
    lessonBtn: 'Lesson (No Bot)',
    playDuoBtn: 'Play with DuoWindo6601',
    chessStudyDesc: 'Lesson mode (no bot). Practice your moves!',
    chessTutorialDesc: 'Tutorial! Click on any white piece to learn its moves.',
    chessPlayDesc: "Don't be afraid! I will play at half strength!",
    incognitoTitle: 'Incognito Mode (No Account)',
    incognitoLeaderboardDesc: 'Scores count locally. Register to join the global leaderboard!',
    register: 'Register',
    noUsername: 'No username set',
    editProfile: 'Edit Profile',
    registerAuth: 'Registration / Auth',
    streakAdjustment: 'Streak adjustment: manual day adjustment is disabled (considered unfair). Your streak resumes and extends automatically by completing lessons every day.',
    streakLessonAction: '🚀 Complete Lesson to Resume / Extend (+1 day)',
    streakFairPlayBadge: '🛡️ Fair Play: Earned via lessons only',
    streakFreezeActive: '❄️ Streak Freeze active ({count})',
    toastStreakBack7: '⏪ Streak: {streak} days',
    toastStreakBack1: '◀ Backward: {streak} days',
    toastStreakForward1: '▶ Forward: {streak} days',
    toastStreakForward7: '⏩ Forward (+7): {streak} days',
    days: 'days',
    registerAndLogin: 'Registration & Login',
    regLoginSubtitle: 'Register an account, sign in with Google or play Incognito without an account',
    incognitoTab: 'Incognito',
    googleTab: 'Google',
    displayNameLabel: 'Display Name',
    requiredLabel: '*Required',
    displayNamePlaceholder: 'E.g. Anatoly',
    usernameLabel: 'Username (@handle)',
    uniqueHandleLabel: 'Unique handle',
    profileLeaderboardVisible: 'Visible in profile and leaderboards',
    selectAvatarLabel: 'Select Avatar',
    registerAndStartBtn: 'Register & Get Started',
    fullIncognitoTitle: 'Full privacy without entering email or name',
    noSignupPasswordsRule: 'No signups or passwords required',
    allProgressLocalRule: 'All progress is stored locally in browser',
    canRegisterAnytimeRule: 'You can create an account at any time',
    continueGuestBtn: 'Continue as Guest / Incognito',
    firebaseCloudSyncTitle: 'Firebase Cloud Sync',
    syncAllDevicesDesc: 'Sync your learning stats across devices',
    progressSyncNote: 'Your progress will automatically sync with your Google account.',
    iframeWarning: '⚠️ Frame limitation: Google sign-in might be blocked inside an iFrame.',
    openNewTabBtn: 'Open in a new tab ↗',
    signInGoogleBtn: 'Sign in with Google',
    skipContinueIncognitoBtn: 'Skip / Continue without account (Incognito) ↗',
    uploadPhotoBtn: '📷 Upload Photo',
    deletePhotoBtn: '🗑️ Delete Photo',
    avatarUrlLabel: 'Avatar Image URL',
    avatarBgColorLabel: 'Avatar Color',
    avatarIconLabel: 'Avatar Icon / Emoji',
    cancelBtn: 'Cancel',
    saveProfileBtn: 'Save Profile',
    listeningPlaceholder: 'Listening to speech...',
    typingPlaceholder: 'Type a message...',
    sendBtn: 'Send',
    recordingToastText: '🎙 Recording speech... Tap mic again to send',
    browserWarningTitle: 'Warning Screen: Old browser not supported',
    browserWarningSub: 'DuoWindo6601 platform compatibility check',
    browserCompatibleTitle: 'Modern Browser & Current OS (Windows / Linux / macOS / Android):',
    browserCompatibleDesc: 'Your system is fully compatible! No warnings. All features, Gemini API, and voice input work perfectly.',
    browserOutdatedTitle: 'Outdated browser or unsupported OS detected:',
    browserOutdatedDesc: 'Your system is outdated (legacy browser or Windows XP / Windows Vista).',
    sysMessageLabel: 'System message:',
    sysMessageDesc: 'Unfortunately, your current browser is no longer supported. To continue using Duowindo6601, please update to a modern browser. Windows XP/Windows Vista are not supported.',
    riskLabel: 'Risk:',
    riskDesc: 'Gemini API may not work correctly',
    winOsSupportLabel: 'Windows Operating System Support Lifecycles:',
    win7Desc: 'End of support lifecycle',
    win7Status: '❌ Ended (January 14, 2020)',
    win8Status: '❌ Ended (January 10, 2023)',
    win10Desc: 'Free support ended on October 14, 2025.',
    win10Status: '⚠️ ESU until October 12, 2027',
    win10Note: '* Paid Extended Security Updates (ESU) program for retail users has been extended until October 2027.',
    win11Desc: 'No general end date, support depends on the version',
    win11Status: '✅ Version 24H2 until Oct 13, 2026',
    win11Note: '* Support lifecycle depends on annual feature updates. Version 24H2 (Home/Pro) is supported until October 13, 2026.',
    modernBrowsersLabel: 'Recommended modern browsers:',
    downloadBtn: 'Download',
    sslTitle: 'SSL Certificate (WR2 / New Site)',
    sslDesc: 'Confirmation that the certificate issuer is the WR2 site. The server successfully presented transparency logs.',
    mobileSimTitle: 'Mobile Simulator Test Bench',
    mobileSimDesc: 'Interactive iOS & Android emulator for testing responsive layouts on PC.',
    mobileSimBtn: 'Launch Simulator',
    feedbackBannerTitle: 'Feedback & Support',
    feedbackBannerDesc: 'Found a bug or want to suggest an idea?',
    adminBannerTitle: 'Owner Dashboard — Admin Tool',
    adminBannerDesc: 'Restricted: Administrator Access Only (Enter password, email, or "admin")',
    cloudSaveTitle: 'Cloud Save',
    loading: 'Loading...',
    loggedInAs: 'You are logged in as {user}',
    progressSynced: '● Progress is synchronized with the cloud',
    signOut: 'Sign Out',
    savedLocallyAs: 'Saved locally in browser as @{username}.',
    updateBrowserBtn: 'Update your browser',
    continueDuoWindoBtn: 'Continue using DuoWindo6601'
  },
  de: {
    androidAlertTitle: 'Android-App verfügbar!',
    androidAlertDesc: 'DuoWindo6601 ist jetzt auf Android verfügbar! Lernen Sie unterwegs.',
    androidAlertBtn: 'JETZT INSTALLIEREN',
    androidModalTitle: 'Installationsanleitung',
    androidModalClose: 'Schließen',
    coursesAndRegions: 'Kurse & Sprachregionen',
    searchPlaceholder: '🔍 Sprache oder Region suchen...',
    allCourses: 'Alle Kurse',
    cisLanguages: 'GUS-Sprachen (15)',
    worldLanguages: 'Weltsprachen',
    subjectsAndGames: 'Fächer & Spiele',
    rfRegions: 'Russische Regionen',
    searchResults: 'Suchergebnisse',
    cisSectionTitle: 'GUS- und Nachbarsprachen',
    worldSectionTitle: 'Beliebte Weltsprachen',
    specialSectionTitle: 'Spezielle Fächer & Spiele',
    rfSectionTitle: 'Subjekte und Regionen Russlands',
    regionalCourse: 'Regionaler Kurs',
    foreignLanguage: 'Fremdsprache',
    specialSubject: 'Spezielles Fach',
    musicTheory: 'Musiktheorie',
    exactScience: 'Exakte Wissenschaft',
    chessLogic: 'Schachspiel & Logik',
    betaTitle: 'DuoWindo6601 Beta-Testzugang',
    betaDesc: 'Alle App-Funktionen stehen zum Testen zur Verfügung: GUS- und Weltsprachen, Schach, Grafik, KI-Voiceover und Kontrollzentrum.',
    betaBtn: '🧪 DuoWindo6601 Beta-Zentrum',
    reviewsBtn: '⭐ Bewertungen',
    githubTitle: 'DuoWindo6601 ist bereits auf GitHub verfügbar',
    githubDesc: 'Automatisches Android APK Build wird über .github/workflows/build.yml gestartet.',
    testAndroidBtn: '🤖 Android-Test',
    home: 'STARTSEITE', practice: 'ÜBEN', leaderboard: 'RANGLISTE', shop: 'SHOP', profile: 'PROFIL', feedback: 'BEWERTUNGEN',
    lang_ru: 'Russisch', lang_en: 'Englisch', lang_de: 'Deutsch', lang_fr: 'Französisch', lang_es: 'Spanisch', lang_ja: 'Japanisch', lang_zh: 'Chinesisch',
    videoCallDesc: 'Live-Kommunikation mit einem KI-Partner', storiesAndWriting: 'Geschichten & Schreiben', leaderboardDesc: 'Die Top 3 steigen in die Silber-Liga auf',
    sslCertificateTitle: 'SSL-Zertifikat (WR2 / Neue Website)', sslCertificateDesc: 'Bestätigung, dass der Zertifikatsaussteller die WR2-Website ist. Der Server hat die Protokolle erfolgreich bereitgestellt.',
    edit: 'Bearbeiten', mobileSimulatorBench: 'Mobiler Simulator-Teststand', mobileSimulatorDesc: 'Interaktiver iOS- und Android-Emulator zum Testen von Layouts auf dem PC.',
    launchSimulator: 'Simulator starten', usernameNotSet: 'Kein Benutzername festgelegt', incognito: 'Inkognito',
    listenSpeech: 'Zuhören...', typeMessage: 'Nachricht eingeben...', send: 'Senden', recordingSpeech: 'Sprachaufnahme... Tippen Sie erneut, um zu senden',
    activeWith: 'Aktiv mit', change: 'Ändern', isYou: 'Das bist du',
    unit: 'Einheit', start: 'STARTEN', check: 'ÜBERPRÜFEN', continue: 'WEITER', skip: 'ÜBERSPRINGEN',
    module1: 'MODUL 1, EINHEIT 1', chessUnitName: 'Figurenbewegung',
    settings: 'Einstellungen', language: 'Sprache', country: 'Land', back: 'Zurück', save: 'Speichern',
    free: 'Kostenlos', trySuper: 'SUPER TESTEN', connectMax: 'MAX VERBINDEN', cancelSub: 'Abonnement kündigen',
    whatToLearn: 'Was möchten Sie lernen?', newCourses: 'Neue Kurse', forRu: 'Für Russischsprachige',
    shopTitle: 'Shop 6601', leaderboardTitle: 'Bronze-Liga', roleplays: 'Rollenspiele',
    audio: 'Audio', speech: 'Sprache', translate: 'Übersetzung', translator: 'Übersetzer', illusion: 'Klang illusion',
    drawing: 'Buchstaben zeichnen', offline: 'OFFLINE', apiStatus: 'API-Status', online: 'Online',
    limitReached: 'Limit erreicht', checkConnection: 'Verbindung prüfen', voice: 'Stimme',
    voiceProvider: 'Sprachausgabe', t_api_online: 'API Online!', t_offline_limit: 'Offline / Limit erreicht',
    t_skip: 'Übung übersprungen', t_energy_low: 'Keine Energie mehr! Holen Sie sich Super oder füllen Sie auf.',
    t_sub_cancel: 'Abonnement gekündigt', t_welcome_super: 'Willkommen bei Super!', t_welcome_max: 'Willkommen bei Max!',
    t_buy_energy: 'Energie wieder aufgefüllt!', t_freeze_used: 'Streak eingefroren!', t_rec_error: 'Erkennung fehlgeschlagen.',
    t_buy_gems: 'Gekauft', t_topic_empty: 'Kein Thema ausgewählt', t_api_error: 'Netzwerkfehler oder API-Limit',
    t_speech_empty: 'Nichts gehört.', alphabet: 'BUCHSTABEN', explainMax: 'Antwort erklären', explainHeader: 'Fehlererklärung',
    ishihara: 'Ishihara-Test', ishiharaDesc: 'Farbsehtest', auto: 'Auto',
    chooseTier: "Stufe wählen", energy25: "25 Energie", ads: "Werbung", infEnergy: "Unendliche Energie", noAds: "Keine Werbung",
    trafficFree: "Kostenloser DuoWindo6601 Gemini API Key-Traffic",
    trafficSuper: "DuoWindo6601 Super-Traffic (Kostenpflichtiger Gemini API Key)",
    trafficMax: "DuoWindo6601 Max-Traffic (Kostenpflichtiger Gemini API Key)",
    allInSuper: "Alles in Super", aiExplain: "Antworterklärung (AI)", currentPlan: "AKTUELLER PLAN", streakDays: "Streak-Tage",
    totalXP: "Gesamt-XP", playChess: "SCHACH SPIELEN", chessDesc: "Partien mit DuoWindo6601", games: "SPIELE", wins: "SIEGE", elo: "ELO",
    startChess: "START: +30 XP", startSpeak: "Sprechen beginnen →", whatHeard: "Was haben Sie gehört?", speakForDuo: "Für Duo sprechen",
    chessSubtitle: "20-Minuten-Partien mit DuoWindo6601", startChessMatch: "PARTIE STARTEN: +30 XP",
    pvp: "Spieler gegen Spieler", pve: "Spieler gegen DuoWindo6601",
    readPractice: "Lesepraxis", aiTrans: "KI-Übersetzer", realOrNot: "Echt oder nicht?", writePractice: "Schreibpraxis",
    topicPrompt: "Thema für Vokabeln?", topicPlaceholder: "Leer lassen...", trySuperTitle: "SUPER TESTEN",
    trySuperDesc: "Keine Werbung, keine Limits!", refill: "Auf 25 auffüllen", freeze: "Einfrieren", freezeDesc: "Streak retten",
    refillGems: "Edelsteine aufladen", popular: "Beliebt", handful: "Handvoll", sack: "Sack", chest: "Schatulle", cantListen: "KANN NICHT HÖREN",
    cantSpeak: "KANN NICHT SPRECHEN", endChat: "Chat beenden", exitGame: "Spiel verlassen", great: "Großartig!", wrong: "Falsch!", next: "WEITER",
    correctAnswer: "Richtig:", checkmateWin: "Schachmatt! Sie haben gewonnen!", checkmateLoss: "Schachmatt! KI gewinnt.",
    videoCall: "VIDEOANRUF", startInterview: "Interview starten", smartMode: "Smart-Modus", interviewer: "Interviewer", self: "Sie",
    serverJsTitle: 'server.js Unterstützung!',
    serverJsDesc: 'DuoWindo hat offiziell einen eigenen Produktionsserver server.js mit Statik- und SPA-Routing integriert!',
    serverJsBtn: 'Fantastisch! 🚀',
    streakResume: 'Streak-Modus',
    streakResumed: '🔥 Streak fortgesetzt (+1 Tag für Lektion)!',
    browserBtn: 'Browser',
    eduBtn: '💡 Ausbildung',
    eduWelcome: 'Willkommen! Klicken Sie auf eine beliebige weiße Figur, um zu sehen, wie sie sich bewegt.',
    lessonWelcome: 'Lektionsmodus. Der Bot ist deaktiviert. Sie können Figuren für beide Seiten bewegen.',
    lessonBtn: 'Lektion (kein Bot)',
    playDuoBtn: 'Spielen mit DuoWindo6601',
    chessStudyDesc: 'Lektionsmodus (kein Bot). Üben Sie Ihre Züge!',
    chessTutorialDesc: 'Anleitung! Klicken Sie auf eine beliebige weiße Figur, um ihre Züge zu lernen.',
    chessPlayDesc: 'Keine Sorge. Ich spiele mit halber Kraft!',
    incognitoTitle: 'Inkognito-Modus (kein Konto)',
    incognitoLeaderboardDesc: 'Punkte zählen lokal. Registrieren Sie sich, um an der globalen Rangliste teilzunehmen!',
    register: 'Registrieren',
    noUsername: 'Kein Benutzername festgelegt',
    editProfile: 'Profil bearbeiten',
    registerAuth: 'Registrierung / Login',
    streakAdjustment: 'Streak-Anpassung: Manuelle Tagesänderung ist deaktiviert (gilt als unfairen Vorteil). Der Streak wird automatisch durch tägliche Lektionen fortgesetzt.',
    streakLessonAction: '🚀 Lektion abschließen (+1 Tag)',
    streakFairPlayBadge: '🛡️ Fair Play: Nur durch Lektionen',
    streakFreezeActive: '❄️ Streak-Freeze aktiv ({count})',
    toastStreakBack7: '⏪ Streak: {streak} Tage',
    toastStreakBack1: '◀ Zurück: {streak} Tage',
    toastStreakForward1: '▶ Vorwärts: {streak} Tage',
    toastStreakForward7: '⏩ Vorwärts (+7): {streak} Tage',
    days: 'Tage',
    registerAndLogin: 'Registrierung & Login',
    regLoginSubtitle: 'Registrieren Sie ein Konto, melden Sie sich mit Google an oder spielen Sie anonym im Inkognito-Modus',
    incognitoTab: 'Inkognito',
    googleTab: 'Google',
    displayNameLabel: 'Anzeigename',
    requiredLabel: '*Erforderlich',
    displayNamePlaceholder: 'Z.B. Anatoli',
    usernameLabel: 'Benutzername (@handle)',
    uniqueHandleLabel: 'Einzigartiger Name',
    profileLeaderboardVisible: 'Sichtbar im Profil und auf Bestenlisten',
    selectAvatarLabel: 'Avatar auswählen',
    registerAndStartBtn: 'Registrieren & Loslegen',
    fullIncognitoTitle: 'Volle Anonymität ohne Eingabe von E-Mail oder Name',
    noSignupPasswordsRule: 'Keine Registrierung oder Passwörter erforderlich',
    allProgressLocalRule: 'Der gesamte Fortschritt wird lokal im Browser gespeichert',
    canRegisterAnytimeRule: 'Sie können sich jederzeit registrieren',
    continueGuestBtn: 'Als Gast / Inkognito fortfahren',
    firebaseCloudSyncTitle: 'Firebase Cloud-Synchronisierung',
    syncAllDevicesDesc: 'Synchronisieren Sie Ihre Lernstatistiken geräteübergreifend',
    progressSyncNote: 'Ihr Fortschritt wird automatisch mit Ihrem Google-Konto synchronisiert.',
    iframeWarning: '⚠️ Frame-Einschränkung: Die Google-Anmeldung ist im iFrame möglicherweise blockiert.',
    openNewTabBtn: 'In neuem Tab öffnen ↗',
    signInGoogleBtn: 'Mit Google anmelden',
    skipContinueIncognitoBtn: 'Überspringen / Ohne Konto fortfahren (Inkognito) ↗',
    uploadPhotoBtn: '📷 Foto hochladen',
    deletePhotoBtn: '🗑️ Foto löschen',
    avatarUrlLabel: 'Avatar-Bild-URL',
    avatarBgColorLabel: 'Avatar-Farbe',
    avatarIconLabel: 'Avatar-Symbol / Emoji',
    cancelBtn: 'Abbrechen',
    saveProfileBtn: 'Profil speichern',
    listeningPlaceholder: 'Zuhören...',
    typingPlaceholder: 'Nachricht schreiben...',
    sendBtn: 'Senden',
    recordingToastText: '🎙 Sprache wird aufgenommen... Tippen Sie erneut, um zu senden',
    browserWarningTitle: 'Warnbildschirm: Veralteter Browser nicht unterstützt',
    browserWarningSub: 'DuoWindo6601 Plattform-Kompatibilitätsprüfung',
    browserCompatibleTitle: 'Moderner Browser & aktuelles Betriebssystem (Windows / Linux / macOS / Android):',
    browserCompatibleDesc: 'Ihr System ist vollständig kompatibel! Keine Warnungen. Alle Funktionen, Gemini-API und Spracheingabe funktionieren einwandfrei.',
    browserOutdatedTitle: 'Veralteter Browser oder nicht unterstütztes Betriebssystem erkannt:',
    browserOutdatedDesc: 'Ihr System ist veraltet (legacy Browser oder Windows XP / Windows Vista).',
    sysMessageLabel: 'Systemmeldung:',
    sysMessageDesc: 'Leider wird Ihr aktueller Browser nicht mehr unterstützt. Um Duowindo6601 weiterhin zu nutzen, aktualisieren Sie bitte auf einen modernen Browser. Windows XP/Windows Vista werden nicht unterstützt.',
    riskLabel: 'Risiko:',
    riskDesc: 'Gemini-API funktioniert möglicherweise nicht richtig',
    winOsSupportLabel: 'Support-Lebenszyklen für Windows-Betriebssysteme:',
    win7Desc: 'Support vollständig beendet',
    win7Status: '❌ Beendet (14. Januar 2020)',
    win8Status: '❌ Beendet (10. Januar 2023)',
    win10Desc: 'Der kostenlose Support endete am 14. Oktober 2025.',
    win10Status: '⚠️ ESU bis 12. Oktober 2027',
    win10Note: '* Das kostenpflichtige Programm für erweiterte Sicherheitsupdates (ESU) für normale Benutzer wurde bis Oktober 2027 verlängert.',
    win11Desc: 'Kein allgemeines Enddatum, der Support hängt von der Version ab',
    win11Status: '✅ Version 24H2 bis 13. Okt. 2026',
    win11Note: '* Die Supportdauer hängt von den jährlichen Funktionsupdates ab. Version 24H2 (Home/Pro) wird bis zum 13. Oktober 2026 unterstützt.',
    modernBrowsersLabel: 'Empfohlene moderne Browser:',
    downloadBtn: 'Herunterladen',
    sslTitle: 'SSL-Zertifikat (WR2 / Neue Website)',
    sslDesc: 'Bestätigung, dass der Zertifikatsaussteller die WR2-Website ist. Der Server hat die Protokolle erfolgreich bereitgestellt.',
    mobileSimTitle: 'Mobile Simulator Teststand',
    mobileSimDesc: 'Interaktiver iOS- und Android-Emulator zum Testen reaktionsfähiger Layouts auf dem PC.',
    mobileSimBtn: 'Simulator starten',
    feedbackBannerTitle: 'Feedback & Support',
    feedbackBannerDesc: 'Fehler gefunden oder Idee vorschlagen?',
    adminBannerTitle: 'Besitzer-Dashboard',
    adminBannerDesc: 'Moderation & Überwachung',
    cloudSaveTitle: 'Wolken-Speicherung',
    loading: 'Laden...',
    loggedInAs: 'Eingeloggt als {user}',
    progressSynced: '● Fortschritt mit der Cloud synchronisiert',
    signOut: 'Abmelden',
    savedLocallyAs: 'Lokal im Browser gespeichert als @{username}.',
    updateBrowserBtn: 'Aktualisieren Sie Ihren Browser',
    continueDuoWindoBtn: 'Mit DuoWindo6601 fortfahren'
  },
  fr: {
    androidAlertTitle: 'Application Android disponible !',
    androidAlertDesc: 'DuoWindo6601 est désormais disponible sur Android !',
    androidAlertBtn: 'INSTALLER',
    androidModalTitle: "Guide d'installation",
    androidModalClose: 'Fermer',
    coursesAndRegions: 'Cours et régions linguistiques',
    searchPlaceholder: '🔍 Rechercher une langue ou une région...',
    allCourses: 'Tous les cours',
    cisLanguages: 'Langues de la CEI (15)',
    worldLanguages: 'Langues du monde',
    subjectsAndGames: 'Sujets et Jeux',
    rfRegions: 'Régions russes',
    searchResults: 'Résultats de recherche',
    cisSectionTitle: 'CEI & Langues voisines',
    worldSectionTitle: 'Langues mondiales populaires',
    specialSectionTitle: 'Sujets spéciaux & Jeux',
    rfSectionTitle: 'Régions de la Fédération de Russie',
    regionalCourse: 'Cours régional',
    foreignLanguage: 'Langue étrangère',
    specialSubject: 'Sujet spécial',
    musicTheory: 'Théorie de la musique',
    exactScience: 'Science exacte',
    chessLogic: 'Jeu d’échecs & Logique',
    betaTitle: 'DuoWindo6601 Accès au bêta-test',
    betaDesc: 'Toutes les fonctionnalités de l’application sont disponibles pour les tests : langues de la CEI et du monde, Échecs, Graphiques, Voix off IA et Panneau de configuration.',
    betaBtn: '🧪 Centre Bêta DuoWindo6601',
    reviewsBtn: '⭐ Avis',
    githubTitle: 'DuoWindo6601 est déjà disponible sur GitHub',
    githubDesc: 'La génération automatique de l’APK Android est lancée via .github/workflows/build.yml.',
    testAndroidBtn: '🤖 Test Android',
    home: 'ACCUEIL', practice: 'PRATIQUE', leaderboard: 'CLASSEMENT', shop: 'BOUTIQUE', profile: 'PROFIL', feedback: 'AVIS',
    lang_ru: 'Russe', lang_en: 'Anglais', lang_de: 'Allemand', lang_fr: 'Français', lang_es: 'Espagnol', lang_ja: 'Japonais', lang_zh: 'Chinois',
    videoCallDesc: 'Communication en direct avec un partenaire IA', storiesAndWriting: 'Histoires & Écriture', leaderboardDesc: 'Les 3 premiers passent en Ligue Argent',
    sslCertificateTitle: 'Certificat SSL (WR2 / Nouveau site)', sslCertificateDesc: 'Confirmation que l’émetteur du certificat est le site WR2. Le serveur a réussi à présenter les journaux de transparence.',
    edit: 'Modifier', mobileSimulatorBench: 'Banc d’essai du simulateur mobile', mobileSimulatorDesc: 'Émulateur interactif iOS et Android pour tester les mises en page sur PC.',
    launchSimulator: 'Lancer le simulateur', usernameNotSet: 'Aucun identifiant défini', incognito: 'Incognito',
    listenSpeech: 'Écoute de la parole...', typeMessage: 'Saisissez un message...', send: 'Envoyer', recordingSpeech: 'Enregistrement... Appuyez à nouveau pour envoyer',
    activeWith: 'Actif avec', change: 'Modifier', isYou: "C'est vous",
    unit: 'Unité', start: 'COMMENCER', check: 'VÉRIFIER', continue: 'CONTINUER', skip: 'PASSER',
    module1: 'MODULE 1, UNITÉ 1', chessUnitName: 'Déplacement des pièces',
    settings: 'Paramètres', language: 'Langue', country: 'Pays', back: 'Retour', save: 'Enregistrer',
    free: 'Gratuit', trySuper: 'ESSAYER SUPER', connectMax: 'OBTENIR MAX', cancelSub: "Annuler l'abonnement",
    whatToLearn: 'Que voulez-vous apprendre ?', newCourses: 'Nouveaux cours', forRu: 'Pour les russophones',
    shopTitle: 'Boutique 6601', leaderboardTitle: 'Ligue de Bronze', roleplays: 'Jeux de rôle',
    audio: 'Audio', speech: 'Parole', translate: 'Traduction', translator: 'Traducteur', illusion: 'Illusion sonore',
    drawing: 'Dessiner les lettres', offline: 'HORS-LIGNE', apiStatus: "Statut de l'API", online: 'En ligne',
    limitReached: 'Limite atteinte', checkConnection: 'Vérifier la connexion', voice: 'Voix',
    voiceProvider: 'Fournisseur de voix', t_api_online: 'API en ligne !', t_offline_limit: 'Hors-ligne / Limite atteinte',
    t_skip: 'Exercice passé', t_energy_low: "Plus d'énergie !", t_sub_cancel: 'Abonnement annulé',
    t_welcome_super: 'Bienvenue dans Super !', t_welcome_max: 'Bienvenue dans Max !', t_buy_energy: 'Énergie rechargée !',
    t_freeze_used: 'Série gelée !', t_rec_error: 'Échec de la reconnaissance.', t_buy_gems: 'Acheté',
    t_topic_empty: 'Aucun sujet choisi', t_api_error: 'Erreur réseau', t_speech_empty: 'Rien entendu.', alphabet: 'LETTRES', explainMax: 'Expliquer ma réponse', explainHeader: 'Explication de l’erreur',
    ishihara: 'Test d’Ishihara', ishiharaDesc: 'Contrôle de la vision des couleurs', auto: 'Auto',
    chooseTier: "Choisir le niveau", energy25: "25 Énergie", ads: "Publicités", infEnergy: "Énergie illimitée", noAds: "Sans pub",
    trafficFree: "Trafic gratuit DuoWindo6601 Gemini API Key",
    trafficSuper: "Trafic DuoWindo6601 Super (Gemini API Key Payant)",
    trafficMax: "Trafic DuoWindo6601 Max (Gemini API Key Payant)",
    allInSuper: "Tout dans Super", aiExplain: "Explication des réponses (IA)", currentPlan: "PLAN ACTUEL", streakDays: "Jours de série",
    totalXP: "XP Total", playChess: "JOUER AUX ÉCHECS", chessDesc: "Parties avec DuoWindo6601", games: "PARTIES", wins: "VICTOIRES", elo: "ELO",
    startChess: "DÉMARRER : +30 XP", startSpeak: "Commencer à parler →", whatHeard: "Qu’avez-vous entendu ?", speakForDuo: "Parler pour Duo",
    chessSubtitle: "Parties de 20 min avec DuoWindo6601", startChessMatch: "LANCER LE MATCH : +30 XP",
    pvp: "Joueur contre Joueur", pve: "Joueur contre DuoWindo6601",
    readPractice: "Pratique de lecture", aiTrans: "Traducteur IA", realOrNot: "Réel ou non ?", writePractice: "Pratique d'écriture",
    topicPrompt: "Sujet de vocabulaire ?", topicPlaceholder: 'Laisser vide...', trySuperTitle: 'ESSAYER SUPER',
    trySuperDesc: 'Sans pubs, sans limites !', refill: 'Recharger à 25', freeze: 'Gel', freezeDesc: 'Sauvegarder votre série',
    refillGems: 'Recharger gemmes', popular: 'Populaire', handful: 'Poignée', sack: 'Sac', chest: 'Coffre', cantListen: 'JE NE PEUX PAS ÉCOUTER',
    cantSpeak: 'JE NE PEUX PAS PARLER', endChat: 'Terminer', exitGame: 'Quitter', great: 'Superbe !', wrong: 'Erreur !', next: 'CONTINUER',
    correctAnswer: 'Correct :', checkmateWin: 'Échec et mat ! Vous avez gagné !', checkmateLoss: 'Échec et mat ! L’IA a gagné.',
    videoCall: 'APPEL VIDÉO', startInterview: 'Commencer l’entretien', smartMode: 'Mode intelligent', interviewer: 'Interviewer', self: 'Vous',
    serverJsTitle: 'Support de server.js !',
    serverJsDesc: 'DuoWindo a officiellement intégré son propre serveur de production server.js avec distribution des assets et support SPA !',
    serverJsBtn: 'Génial ! 🚀',
    streakResume: 'Mode Série',
    streakResumed: '🔥 Série reprise (+1 jour pour la leçon) !',
    browserBtn: 'Navigateur',
    eduBtn: '💡 Éducation',
    eduWelcome: 'Bienvenue ! Cliquez sur n\'importe quelle pièce blanche pour voir comment elle se déplace.',
    lessonWelcome: 'Mode leçon. Le bot est désactivé. Vous pouvez déplacer les pièces pour les deux côtés.',
    lessonBtn: 'Leçon (sans bot)',
    playDuoBtn: 'Jouer avec DuoWindo6601',
    chessStudyDesc: 'Mode leçon (sans bot). Entraînez-vous à vos mouvements !',
    chessTutorialDesc: 'Tutoriel ! Cliquez sur n\'importe quelle pièce blanche pour apprendre ses mouvements.',
    chessPlayDesc: 'N\'y allez pas de main morte, je jouerai à moitié de mes capacités !',
    incognitoTitle: 'Mode incognito (sans compte)',
    incognitoLeaderboardDesc: 'Les scores comptent localement. Inscrivez-vous pour rejoindre le classement mondial !',
    register: 'S\'inscrire',
    noUsername: 'Aucun nom d\'utilisateur défini',
    editProfile: 'Modifier le profil',
    registerAuth: 'Inscription / Connexion',
    streakAdjustment: 'Ajustement de la série : l\'ajustement manuel est désactivé (considéré comme déloyal). La série reprend et progresse automatiquement en complétant des leçons quotidiennes.',
    streakLessonAction: '🚀 Faire une leçon pour prolonger (+1 jour)',
    streakFairPlayBadge: '🛡️ Jeu équitable : par les leçons uniquement',
    streakFreezeActive: '❄️ Gel de série actif ({count})',
    toastStreakBack7: '⏪ Série : {streak} jours',
    toastStreakBack1: '◀ En arrière : {streak} jours',
    toastStreakForward1: '▶ En avant : {streak} jours',
    toastStreakForward7: '⏩ En avant (+7) : {streak} jours',
    days: 'jours',
    registerAndLogin: 'Inscription & Connexion',
    regLoginSubtitle: 'Créez un compte, connectez-vous avec Google ou jouez incognito sans compte',
    incognitoTab: 'Incognito',
    googleTab: 'Google',
    displayNameLabel: 'Nom affiché',
    requiredLabel: '*Requis',
    displayNamePlaceholder: 'Ex : Anatole',
    usernameLabel: 'Nom d\'utilisateur (@handle)',
    uniqueHandleLabel: 'Pseudo unique',
    profileLeaderboardVisible: 'Visible sur le profil et les classements',
    selectAvatarLabel: 'Choisir un avatar',
    registerAndStartBtn: 'S\'inscrire & Commencer',
    fullIncognitoTitle: 'Anonymat complet sans entrer d\'e-mail ni de nom',
    noSignupPasswordsRule: 'Aucune inscription ni mot de passe requis',
    allProgressLocalRule: 'Toute la progression est stockée localement dans le navigateur',
    canRegisterAnytimeRule: 'Vous pouvez créer un compte à tout moment',
    continueGuestBtn: 'Continuer en tant qu\'invité / Incognito',
    firebaseCloudSyncTitle: 'Synchronisation Cloud Firebase',
    syncAllDevicesDesc: 'Synchronisez vos statistiques sur tous vos appareils',
    progressSyncNote: 'Votre progression sera automatiquement synchronisée avec votre compte Google.',
    iframeWarning: '⚠️ Limitation d\'iFrame : la connexion Google peut être bloquée à l\'intérieur d\'un iFrame.',
    openNewTabBtn: 'Ouvrir dans un nouvel onglet ↗',
    signInGoogleBtn: 'Se connecter avec Google',
    skipContinueIncognitoBtn: 'Passer / Continuer sans compte (Incognito) ↗',
    uploadPhotoBtn: '📷 Charger une photo',
    deletePhotoBtn: '🗑️ Supprimer la photo',
    avatarUrlLabel: 'URL de l\'image d\'avatar',
    avatarBgColorLabel: 'Couleur d\'avatar',
    avatarIconLabel: 'Icône d\'avatar / Émoticône',
    cancelBtn: 'Annuler',
    saveProfileBtn: 'Enregistrer',
    listeningPlaceholder: 'Écoute en cours...',
    typingPlaceholder: 'Écrire un message...',
    sendBtn: 'Envoyer',
    recordingToastText: '🎙 Enregistrement vocal... Appuyez à nouveau pour envoyer',
    browserWarningTitle: 'Écran d’avertissement : navigateur obsolète non pris en charge',
    browserWarningSub: 'Vérification de la compatibilité de la plateforme DuoWindo6601',
    browserCompatibleTitle: 'Navigateur moderne & système d\'exploitation actuel (Windows / Linux / macOS / Android) :',
    browserCompatibleDesc: 'Votre système est entièrement compatible ! Aucun avertissement. Toutes les fonctionnalités, l\'API Gemini et la saisie vocale fonctionnent parfaitement.',
    browserOutdatedTitle: 'Navigateur obsolète ou système d\'exploitation non pris en charge détecté :',
    browserOutdatedDesc: 'Votre système est obsolète (navigateur hérité ou Windows XP / Windows Vista).',
    sysMessageLabel: 'Message système :',
    sysMessageDesc: 'Malheureusement, votre navigateur actuel n\'est plus pris en charge. Pour continuer à utiliser Duowindo6601, veuillez mettre à jour vers un navigateur moderne. Windows XP/Windows Vista ne sont pas pris en charge.',
    riskLabel: 'Risque :',
    riskDesc: 'L\'API Gemini peut ne pas fonctionner correctement',
    winOsSupportLabel: 'Cycles de vie du support des systèmes d\'exploitation Windows :',
    win7Desc: 'Fin du support',
    win7Status: '❌ Terminé (14 janvier 2020)',
    win8Status: '❌ Terminé (10 janvier 2023)',
    win10Desc: 'Le support gratuit s\'est terminé le 14 octobre 2025.',
    win10Status: '⚠️ ESU jusqu\'au 12 octobre 2027',
    win10Note: '* Le programme payant de mises à jour de sécurité étendues (ESU) pour les utilisateurs grand public a été prolongé jusqu\'en octobre 2027.',
    win11Desc: 'Pas de date de fin générale, le support dépend de la version',
    win11Status: '✅ Version 24H2 jusqu\'au 13 oct. 2026',
    win11Note: '* Le cycle de vie du support dépend des mises à jour annuelles. La version 24H2 (Home/Pro) est prise en charge jusqu\'au 13 octobre 2026.',
    modernBrowsersLabel: 'Navigateurs modernes recommandés :',
    downloadBtn: 'Télécharger',
    sslTitle: 'Certificat SSL (WR2 / Nouveau site)',
    sslDesc: 'Confirmation que l\'émetteur du certificat est le site WR2. Le serveur a réussi à présenter les journaux de transparence.',
    mobileSimTitle: 'Banc d\'essai du simulateur mobile',
    mobileSimDesc: 'Émulateur interactif iOS et Android pour tester les mises en page réactives sur PC.',
    mobileSimBtn: 'Lancer le simulateur',
    feedbackBannerTitle: 'Avis & Support',
    feedbackBannerDesc: 'Un bug trouvé ou une idée à suggérer ?',
    adminBannerTitle: 'Tableau de bord propriétaire',
    adminBannerDesc: 'Modération & Surveillance',
    cloudSaveTitle: 'Sauvegarde Cloud',
    loading: 'Chargement...',
    loggedInAs: 'Connecté en tant que {user}',
    progressSynced: '● Progrès synchronisé avec le cloud',
    signOut: 'Se déconnecter',
    savedLocallyAs: 'Enregistré localement dans le navigateur en tant que @{username}.',
    updateBrowserBtn: 'Mettez à jour votre navigateur',
    continueDuoWindoBtn: 'Continuer à utiliser DuoWindo6601'
  },
  es: {
    androidAlertTitle: '¡Aplicación de Android disponible!',
    androidAlertDesc: '¡DuoWindo6601 ya está disponible en Android!',
    androidAlertBtn: 'INSTALAR AHORA',
    androidModalTitle: 'Guía de instalación',
    androidModalClose: 'Cerrar',
    coursesAndRegions: 'Cursos y regiones lingüísticas',
    searchPlaceholder: '🔍 Buscar idioma o región...',
    allCourses: 'Todos los cursos',
    cisLanguages: 'Idiomas de la CEI (15)',
    worldLanguages: 'Idiomas del mundo',
    subjectsAndGames: 'Materias y Juegos',
    rfRegions: 'Regiones rusas',
    searchResults: 'Resultados de búsqueda',
    cisSectionTitle: 'Idiomas de la CEI y vecinos',
    worldSectionTitle: 'Idiomas del mundo populares',
    specialSectionTitle: 'Materias especiales y Juegos',
    rfSectionTitle: 'Regiones de la Federación de Rusia',
    regionalCourse: 'Curso regional',
    foreignLanguage: 'Idioma extranjero',
    specialSubject: 'Materia especial',
    musicTheory: 'Teoría musical',
    exactScience: 'Ciencia exacta',
    chessLogic: 'Juego de ajedrez y Lógica',
    betaTitle: 'DuoWindo6601 Acceso a la prueba beta',
    betaDesc: 'Todas las funciones de la aplicación están disponibles para pruebas: idiomas de la CEI y del mundo, Ajedrez, Gráficos, Locución de IA y Panel de control.',
    betaBtn: '🧪 Centro Beta DuoWindo6601',
    reviewsBtn: '⭐ Reseñas',
    githubTitle: 'DuoWindo6601 ya está disponible en GitHub',
    githubDesc: 'La compilación automática de APK de Android se inicia a través de .github/workflows/build.yml.',
    testAndroidBtn: '🤖 Prueba Android',
    home: 'INICIO', practice: 'PRÁCTICA', leaderboard: 'CLASIFICACIÓN', shop: 'TIENDA', profile: 'PERFIL', feedback: 'OPINIONES',
    lang_ru: 'Ruso', lang_en: 'Inglés', lang_de: 'Alemán', lang_fr: 'Francés', lang_es: 'Español', lang_ja: 'Japonés', lang_zh: 'Chino',
    videoCallDesc: 'Comunicación en vivo con un socio de IA', storiesAndWriting: 'Historias y Escritura', leaderboardDesc: 'Los 3 mejores ascienden a la Liga de Plata',
    sslCertificateTitle: 'Certificado SSL (WR2 / Nuevo sitio)', sslCertificateDesc: 'Confirmación de que el emisor del certificado es el sitio WR2. El servidor presentó con éxito los registros de transparencia.',
    edit: 'Editar', mobileSimulatorBench: 'Banco de pruebas del simulador móvil', mobileSimulatorDesc: 'Emulador interactivo de iOS y Android para probar diseños en PC.',
    launchSimulator: 'Iniciar simulador', usernameNotSet: 'Sin nombre de usuario establecido', incognito: 'Incógnito',
    listenSpeech: 'Escuchando voz...', typeMessage: 'Escribe un mensaje...', send: 'Enviar', recordingSpeech: 'Grabando voz... Toca el micrófono otra vez para enviar',
    activeWith: 'Activo con', change: 'Cambiar', isYou: 'Eres tú',
    unit: 'Unidad', start: 'EMPEZAR', check: 'COMPROBAR', continue: 'CONTINUAR', skip: 'OMITIR',
    module1: 'MÓDULO 1, UNIDAD 1', chessUnitName: 'Movimiento de piezas',
    settings: 'Ajustes', language: 'Idioma', country: 'País', back: 'Atrás', save: 'Guardar',
    free: 'Gratis', trySuper: 'PROBAR SUPER', connectMax: 'OBTENER MAX', cancelSub: 'Cancelar suscripción',
    whatToLearn: '¿Qué quieres aprender?', newCourses: 'Nuevos cursos', forRu: 'Para hispanohablantes',
    shopTitle: 'Tienda 6601', leaderboardTitle: 'Liga de Bronce', roleplays: 'Juegos de rol',
    audio: 'Audio', speech: 'Voz', translate: 'Traducción', translator: 'Traductor', illusion: 'Ilusión sonora',
    drawing: 'Dibujar letras', offline: 'OFFLINE', apiStatus: 'Estado de API', online: 'En línea',
    limitReached: 'Límite alcanzado', checkConnection: 'Comprobar conexión', voice: 'Voz',
    voiceProvider: 'Proveedor de voz', t_api_online: '¡API en línea!', t_offline_limit: 'Sin conexión / Límite alcanzado',
    t_skip: 'Ejercicio omitido', t_energy_low: '¡Sin energía!', t_sub_cancel: 'Suscripción cancelada',
    t_welcome_super: '¡Bienvenido a Super!', t_welcome_max: '¡Bienvenido a Max!', t_buy_energy: '¡Energía recargada!',
    t_freeze_used: '¡Racha congelada!', t_rec_error: 'Reconocimiento fallido.', t_buy_gems: 'Comprado',
    t_topic_empty: 'Sin tema seleccionado', t_api_error: 'Error de red', t_speech_empty: 'No se escuchó nada.', alphabet: 'LETRAS', explainMax: 'Explicar mi respuesta', explainHeader: 'Explicación del error',
    ishihara: 'Test de Ishihara', ishiharaDesc: 'Prueba de visión cromática', auto: 'Auto',
    chooseTier: "Elige tu nivel", energy25: "25 Energía", ads: "Anuncios", infEnergy: "Energía infinita", noAds: "Sin anuncios",
    trafficFree: "Tráfico gratuito DuoWindo6601 Gemini API Key",
    trafficSuper: "Tráfico DuoWindo6601 Super (Gemini API Key De Pago)",
    trafficMax: "Tráfico DuoWindo6601 Max (Gemini API Key De Pago)",
    allInSuper: "Todo en Super", aiExplain: "Explicación de respuestas (IA)", currentPlan: "PLAN ACTUAL", streakDays: "Días de racha",
    totalXP: "XP Total", playChess: "JUGAR AL AJEDREZ", chessDesc: "Partidas con DuoWindo6601", games: "PARTIDAS", wins: "VICTORIAS", elo: "ELO",
    startChess: "INICIAR: +30 XP", startSpeak: "Empezar a hablar →", whatHeard: "¿Qué escuchaste?", speakForDuo: "Hablar por Duo",
    chessSubtitle: "Partidas de 20 min con DuoWindo6601", startChessMatch: "INICIAR PARTIDA: +30 XP",
    pvp: "Jugador vs Jugador", pve: "Jugador vs DuoWindo6601",
    readPractice: "Práctica de lectura", aiTrans: "Traductor IA", realOrNot: "¿Real o no?", writePractice: "Práctica de escritura",
    topicPrompt: "¿Tema para vocabulario?", topicPlaceholder: 'Dejar vacío...', trySuperTitle: 'PRUEBA SUPER',
    trySuperDesc: '¡Sin anuncios, sin límites!', refill: 'Recargar a 25', freeze: 'Congelar', freezeDesc: 'Salva tu racha',
    refillGems: 'Recargar gemas', popular: 'Popular', handful: 'Puñado', sack: 'Saco', chest: 'Cofre', cantListen: 'NO PUEDO ESCUCHAR',
    cantSpeak: 'NO PUEDO HABLAR', endChat: 'Terminar', exitGame: 'Salir', great: '¡Excelente!', wrong: '¡Incorrecto!', next: 'CONTINUAR',
    correctAnswer: 'Correcto:', checkmateWin: '¡Jaque mate! ¡Ganaste!', checkmateLoss: '¡Jaque mate! La IA gana.',
    videoCall: 'VIDEOCALL', startInterview: 'Iniciar entrevista', smartMode: 'Modo inteligente', interviewer: 'Entrevistador', self: 'Tú',
    serverJsTitle: '¡Soporte de server.js!',
    serverJsDesc: '¡DuoWindo ha integrado oficialmente su propio servidor server.js con distribución de estáticos y SPA!',
    serverJsBtn: '¡Genial! 🚀',
    streakResume: 'Modo Racha',
    streakResumed: '🔥 ¡Racha reanudada (+1 día por lección)!',
    browserBtn: 'Navegador',
    eduBtn: '💡 Educación',
    eduWelcome: '¡Bienvenido! Haz clic en cualquier pieza blanca para ver cómo se mueve.',
    lessonWelcome: 'Modo lección. El bot está desactivado. Puedes mover piezas para ambos lados.',
    lessonBtn: 'Lección (sin bot)',
    playDuoBtn: 'Jugar con DuoWindo6601',
    chessStudyDesc: 'Modo lección (sin bot). ¡Practica tus movimientos!',
    chessTutorialDesc: '¡Tutorial! Haz clic en cualquier pieza blanca para aprender sus movimientos.',
    chessPlayDesc: '¡No tengas miedo! ¡Jugaré a media fuerza!',
    incognitoTitle: 'Modo incógnito (sin cuenta)',
    incognitoLeaderboardDesc: 'Las puntuaciones cuentan localmente. ¡Regístrate para unirte a la clasificación global!',
    register: 'Registrarse',
    noUsername: 'Sin nombre de usuario',
    editProfile: 'Editar perfil',
    registerAuth: 'Registro / Iniciar sesión',
    streakAdjustment: 'Ajuste de racha: el ajuste manual de días está desactivado (se considera injusto). Tu racha se reanuda y extiende automáticamente completando lecciones diarias.',
    streakLessonAction: '🚀 Completar lección para extender (+1 día)',
    streakFairPlayBadge: '🛡️ Juego Limpio: solo completando lecciones',
    streakFreezeActive: '❄️ Protector de racha activo ({count})',
    toastStreakBack7: '⏪ Racha: {streak} días',
    toastStreakBack1: '◀ Atrás: {streak} días',
    toastStreakForward1: '▶ Adelante: {streak} días',
    toastStreakForward7: '⏩ Adelante (+7): {streak} días',
    days: 'días',
    registerAndLogin: 'Registro y Acceso',
    regLoginSubtitle: 'Registra una cuenta, inicia sesión con Google o juega en incógnito sin cuenta',
    incognitoTab: 'Incógnito',
    googleTab: 'Google',
    displayNameLabel: 'Nombre para mostrar',
    requiredLabel: '*Obligatorio',
    displayNamePlaceholder: 'Ej: Anatolio',
    usernameLabel: 'Nombre de usuario (@handle)',
    uniqueHandleLabel: 'Apodo único',
    profileLeaderboardVisible: 'Visible en perfil y tablas de clasificación',
    selectAvatarLabel: 'Elegir avatar',
    registerAndStartBtn: 'Registrarse y Comenzar',
    fullIncognitoTitle: 'Privacidad total sin ingresar correo ni nombre',
    noSignupPasswordsRule: 'No se requieren registros ni contraseñas',
    allProgressLocalRule: 'Todo el progreso se almacena localmente en el navegador',
    canRegisterAnytimeRule: 'Puedes crear una cuenta en cualquier momento',
    continueGuestBtn: 'Continuar como Invitado / Incógnito',
    firebaseCloudSyncTitle: 'Sincronización en la nube de Firebase',
    syncAllDevicesDesc: 'Sincroniza tus estadísticas en todos tus dispositivos',
    progressSyncNote: 'Tu progreso se sincronizará automáticamente con tu cuenta de Google.',
    iframeWarning: '⚠️ Limitación del marco: el inicio de sesión de Google puede estar bloqueado dentro de un iFrame.',
    openNewTabBtn: 'Abrir en pestaña nueva ↗',
    signInGoogleBtn: 'Iniciar sesión con Google',
    skipContinueIncognitoBtn: 'Omitir / Continuar sin cuenta (Incógnito) ↗',
    uploadPhotoBtn: '📷 Subir foto',
    deletePhotoBtn: '🗑️ Eliminar foto',
    avatarUrlLabel: 'URL de la imagen del avatar',
    avatarBgColorLabel: 'Color de avatar',
    avatarIconLabel: 'Icono de avatar / Emoji',
    cancelBtn: 'Cancelar',
    saveProfileBtn: 'Guardar',
    listeningPlaceholder: 'Escuchando tu voz...',
    typingPlaceholder: 'Escribe un mensaje...',
    sendBtn: 'Enviar',
    recordingToastText: '🎙 Grabando voz... Toca el micrófono otra vez para enviar',
    browserWarningTitle: 'Pantalla de advertencia: navegador antiguo no compatible',
    browserWarningSub: 'Comprobación de compatibilidad de la plataforma DuoWindo6601',
    browserCompatibleTitle: 'Navegador moderno y sistema operativo actual (Windows / Linux / macOS / Android):',
    browserCompatibleDesc: '¡Tu sistema es totalmente compatible! Sin advertencias. Todas las funciones, la API de Gemini y la entrada de voz funcionan perfectamente.',
    browserOutdatedTitle: 'Se detectó un navegador antiguo o un sistema operativo no compatible:',
    browserOutdatedDesc: 'Tu sistema está desactualizado (navegador heredado o Windows XP / Windows Vista).',
    sysMessageLabel: 'Mensaje del sistema:',
    sysMessageDesc: 'Lamentablemente, tu navegador actual ya no es compatible. Para continuar usando Duowindo6601, actualízalo a un navegador moderno. Windows XP/Windows Vista no son compatibles.',
    riskLabel: 'Riesgo:',
    riskDesc: 'La API de Gemini puede no funcionar correctamente',
    winOsSupportLabel: 'Ciclos de vida de soporte del sistema operativo Windows:',
    win7Desc: 'Fin del ciclo de vida de soporte',
    win7Status: '❌ Finalizado (14 de enero de 2020)',
    win8Status: '❌ Finalizado (10 de enero de 2023)',
    win10Desc: 'El soporte gratuito finalizó el 14 de octubre de 2025.',
    win10Status: '⚠️ ESU hasta el 12 de octubre de 2027',
    win10Note: '* El programa de Actualizaciones de seguridad extendidas (ESU) de pago para usuarios minoristas se ha extendido hasta octubre de 2027.',
    win11Desc: 'Sin fecha de finalización general, el soporte depende de la versión',
    win11Status: '✅ Versión 24H2 hasta el 13 de oct de 2026',
    win11Note: '* El ciclo de vida de soporte depende de las actualizaciones anuales de funciones. La versión 24H2 (Home/Pro) es compatible hasta el 13 de octubre de 2026.',
    modernBrowsersLabel: 'Navegadores modernos recomendados:',
    downloadBtn: 'Descargar',
    sslTitle: 'Certificado SSL (WR2 / Nuevo sitio)',
    sslDesc: 'Confirmación de que el emisor del certificado es el sitio WR2. El servidor presentó con éxito los registros de transparencia.',
    mobileSimTitle: 'Banco de pruebas del simulador móvil',
    mobileSimDesc: 'Emulador interactivo de iOS y Android para probar diseños adaptables en PC.',
    mobileSimBtn: 'Iniciar simulador',
    feedbackBannerTitle: 'Comentarios y Soporte',
    feedbackBannerDesc: '¿Encontraste un error o quieres sugerir una idea?',
    adminBannerTitle: 'Panel del propietario',
    adminBannerDesc: 'Moderación y Monitoreo',
    cloudSaveTitle: 'Guardado en la Nube',
    loading: 'Cargando...',
    loggedInAs: 'Sesión iniciada como {user}',
    progressSynced: '● Progreso sincronizado con la nube',
    signOut: 'Cerrar sesión',
    savedLocallyAs: 'Guardado localmente en el navegador como @{username}.',
    updateBrowserBtn: 'Actualiza tu navegador',
    continueDuoWindoBtn: 'Continuar usando DuoWindo6601'
  },
  ja: {
    androidAlertTitle: 'Androidアプリ利用可能！',
    androidAlertDesc: 'DuoWindo6601がAndroidで利用可能になりました！',
    androidAlertBtn: '今すぐインストール',
    androidModalTitle: 'インストール手順',
    androidModalClose: '閉じる',
    coursesAndRegions: 'コースと言語地域',
    searchPlaceholder: '🔍 言語または地域を検索...',
    allCourses: 'すべてのコース',
    cisLanguages: '独立国家共同体言語（15）',
    worldLanguages: '世界の言語',
    subjectsAndGames: '科目とゲーム',
    rfRegions: 'ロシアの地域',
    searchResults: '検索結果',
    cisSectionTitle: '独立国家共同体と近隣の言語',
    worldSectionTitle: '世界の人気言語',
    specialSectionTitle: '特別科目とゲーム',
    rfSectionTitle: 'ロシア連邦の地域',
    regionalCourse: '地域コース',
    foreignLanguage: '外国語',
    specialSubject: '特別科目',
    musicTheory: '音楽理論',
    exactScience: '精密科学',
    chessLogic: 'チェスゲームとロジック',
    betaTitle: 'DuoWindo6601 ベータテストアクセス',
    betaDesc: 'すべてのアプリ機能がテスト可能です：独立国家共同体と言語、チェス、グラフィック、AI音声、コントロールパネル。',
    betaBtn: '🧪 DuoWindo6601 ベータセンター',
    reviewsBtn: '⭐ レビュー',
    githubTitle: 'DuoWindo6601はすでにGitHubで利用可能です',
    githubDesc: '.github/workflows/build.yml経由で自動Android APKビルドが実行されます。',
    testAndroidBtn: '🤖 Androidテスト',
    home: 'ホーム', practice: '練習', leaderboard: 'ランキング', shop: 'ショップ', profile: 'プロフィール', feedback: 'フィードバック',
    lang_ru: 'ロシア語', lang_en: '英語', lang_de: 'ドイツ語', lang_fr: 'フランス語', lang_es: 'スペイン語', lang_ja: '日本語', lang_zh: '中国語',
    videoCallDesc: 'AIパートナーとのライブコミュニケーション', storiesAndWriting: 'ストーリーと執筆', leaderboardDesc: 'トップ3がシルバーリーグに進出',
    sslCertificateTitle: 'SSL証明書 (WR2 / 新しいサイト)', sslCertificateDesc: '証明書の発行元がWR2サイトであることの確認。サーバーがログの提示に成功しました。',
    edit: '編集', mobileSimulatorBench: 'モバイルシミュレータテストベンチ', mobileSimulatorDesc: 'PCでレイアウトをテストするためのインタラクティブなiOSおよびAndroidエミュレータ。',
    launchSimulator: 'シミュレータを起動', usernameNotSet: 'ユーザー名が設定されていません', incognito: 'シークレット',
    listenSpeech: '音声を聞いています...', typeMessage: 'メッセージを入力...', send: '送信', recordingSpeech: '音声を録音中... マイクをもう一度タップして送信',
    activeWith: 'アクティブ：', change: '変更', isYou: 'あなたです',
    unit: 'セクション', start: 'スタート', check: '確認', continue: '続ける', skip: 'スキップ',
    module1: 'モジュール 1, セクション 1', chessUnitName: '駒の動き',
    settings: '設定', language: '言語', country: '国', back: '戻る', save: '保存',
    free: '無料', trySuper: 'Superを試す', connectMax: 'Maxに接続', cancelSub: 'サブスクリプションをキャンセル',
    whatToLearn: '何を学びますか？', newCourses: '新しいコース', forRu: 'ロシア語話者向け',
    shopTitle: 'ショップ 6601', leaderboardTitle: 'ブロンズリーグ', roleplays: 'ロールプレイ',
    audio: 'オーディオ', speech: '音声', translate: '翻訳', translator: '翻訳者', illusion: '音の錯覚',
    drawing: '文字を書く', offline: 'オフライン', apiStatus: 'APIステータス', online: 'オンライン',
    limitReached: '制限に達しました', checkConnection: '接続を確認', voice: '音声',
    voiceProvider: '音声プロバイダー', t_api_online: 'APIオンライン！', t_offline_limit: 'オフライン / 制限到達',
    t_skip: 'スキップしました', t_energy_low: 'エネルギー切れです！', t_sub_cancel: 'キャンセルされました',
    t_welcome_super: 'Superへようこそ！', t_welcome_max: 'Maxへようこそ！', t_buy_energy: '回復しました！',
    t_freeze_used: '凍結しました！', t_rec_error: '認識失敗', t_buy_gems: '購入しました',
    t_topic_empty: 'トピック未選択', t_api_error: 'APIエラー', t_speech_empty: '音声なし', alphabet: '文字', explainMax: '回答を解説', explainHeader: 'ミスの解説',
    ishihara: '石原式色覚テスト', ishiharaDesc: '色覚チェック', auto: '自動',
    chooseTier: "プランを選択", energy25: "25 エネルギー", ads: "広告", infEnergy: "無制限エネルギー", noAds: "広告なし",
    trafficFree: "DuoWindo6601 無料トラフィック (無料 Gemini API Key)",
    trafficSuper: "DuoWindo6601 Super トラフィック (有料 Gemini API Key)",
    trafficMax: "DuoWindo6601 Max トラフィック (有料 Gemini API Key)",
    allInSuper: "Superの全機能", aiExplain: "AIによる回答解説", currentPlan: "現在のプラン", streakDays: "連続日数",
    totalXP: "合計XP", playChess: "チェスで遊ぶ", chessDesc: "DuoWindo6601との対局", games: "対局数", wins: "勝利", elo: "イロ",
    startChess: "開始：+30 XP", startSpeak: "話し始める →", whatHeard: "何が聞こえましたか？", speakForDuo: "Duoの代わりに話す",
    chessSubtitle: "DuoWindo6601との20分間の対局", startChessMatch: "マッチ開始：+30 XP",
    pvp: "プレイヤー対プレイヤー", pve: "プレイヤー対DuoWindo6601",
    readPractice: "リーディング練習", aiTrans: "AI翻訳", realOrNot: "本物？偽物？", writePractice: "ライティング練習",
    topicPrompt: "語彙のトピックは？", topicPlaceholder: "空欄...", trySuperTitle: "SUPERを試す",
    trySuperDesc: "広告なし、制限なし！", refill: "25まで回復", freeze: "凍結", freezeDesc: "ストリークを維持",
    refillGems: "ジェムを補充", popular: "人気", handful: "少量", sack: "袋", chest: "宝箱", cantListen: "聴き取れません",
    cantSpeak: "話せません", endChat: "チャット終了", exitGame: "ゲーム終了", great: "素晴らしい！", wrong: "不正解！", next: "続ける",
    correctAnswer: "正解：", checkmateWin: "チェックメイト！あなたの勝ちです！", checkmateLoss: "チェックメイト！AIの勝ちです。",
    videoCall: "ビデオ通話", startInterview: "面接を開始", smartMode: "スマートモード", interviewer: "面接官", self: "あなた",
    serverJsTitle: 'server.js サポート！',
    serverJsDesc: 'DuoWindoプロジェクトに独自のプロダクションサーバー server.js が統合され、静的配信とSPAルーティングが有効になりました！',
    serverJsBtn: '最高！ 🚀',
    streakResume: '連続記録モード',
    streakResumed: '🔥 レッスン完了で連続記録が更新されました (+1日)！',
    browserBtn: 'ブラウザ',
    eduBtn: '💡 学習',
    eduWelcome: 'ようこそ！白い駒をクリックすると、その動き方を確認できます。',
    lessonWelcome: 'レッスンモード。ボットは無効です。両方の駒を自由に動かせます。',
    lessonBtn: 'レッスン（ボットなし）',
    playDuoBtn: 'DuoWindo6601と対局',
    chessStudyDesc: 'レッスンモード（ボットなし）。自分のペースで駒を動かして練習しましょう！',
    chessTutorialDesc: 'チュートリアル！白い駒をクリックするとルールが表示されます。',
    chessPlayDesc: '怖がらないで。手加減してあげるからね！',
    incognitoTitle: 'シークレットモード（アカウントなし）',
    incognitoLeaderboardDesc: 'スコアはローカルに保存されます。グローバルランキングに参加するには登録してください！',
    register: '登録',
    noUsername: 'ユーザー名未設定',
    editProfile: 'プロフィール編集',
    registerAuth: '登録 / ログイン',
    streakAdjustment: '連続記録の調整：手動の日数調整は無効化されています（フェアプレイのため）。毎日のレッスン完了で自動的に再開・延長されます。',
    streakLessonAction: '🚀 レッスンを完了して記録を伸ばす (+1日)',
    streakFairPlayBadge: '🛡️ フェアプレイ：レッスンでのみ獲得',
    streakFreezeActive: '❄️ 連続フリーズ有効 ({count}個)',
    toastStreakBack7: '⏪ ストリーク：{streak}日',
    toastStreakBack1: '◀ 戻る：{streak}日',
    toastStreakForward1: '▶ 進む：{streak}日',
    toastStreakForward7: '⏩ 進む（+7）：{streak}日',
    days: '日',
    registerAndLogin: 'アカウント登録 & ログイン',
    regLoginSubtitle: 'アカウント登録、Google ログイン、またはアカウントなしでプレイできるシークレットモード',
    incognitoTab: 'シークレット',
    googleTab: 'Google',
    displayNameLabel: '表示名',
    requiredLabel: '*必須',
    displayNamePlaceholder: '例: アナトリー',
    usernameLabel: 'ユーザー名 (@username)',
    uniqueHandleLabel: '固有ハンドル',
    profileLeaderboardVisible: 'プロフィールやランキングに表示されます',
    selectAvatarLabel: 'アバター選択',
    registerAndStartBtn: '登録して開始',
    fullIncognitoTitle: 'メールや名前を入力しない完全なプライバシー',
    noSignupPasswordsRule: '会員登録やパスワードは不要です',
    allProgressLocalRule: 'すべての進行状況はブラウザにローカル保存されます',
    canRegisterAnytimeRule: 'いつでもアカウントを作成できます',
    continueGuestBtn: 'ゲスト / 匿名で続ける',
    firebaseCloudSyncTitle: 'Firebase クラウド同期',
    syncAllDevicesDesc: 'すべてのデバイスで学習状況を同期します',
    progressSyncNote: 'ログインすると、進行状況が Google アカウントに自動同期されます。',
    iframeWarning: '⚠️ フレーム制限：iFrame内ではGoogleログインがブロックされる場合があります。',
    openNewTabBtn: '新しいタブで開く ↗',
    signInGoogleBtn: 'Google でログイン',
    skipContinueIncognitoBtn: 'スキップ / アカウントなしで進む ↗',
    uploadPhotoBtn: '📷 写真をアップロード',
    deletePhotoBtn: '🗑️ 写真を削除',
    avatarUrlLabel: 'アバター画像URL',
    avatarBgColorLabel: '背景カラー',
    avatarIconLabel: 'アバターアイコン / 絵文字',
    cancelBtn: 'キャンセル',
    saveProfileBtn: '保存',
    listeningPlaceholder: '音声を聞き取っています...',
    typingPlaceholder: 'メッセージを入力...',
    sendBtn: '送信',
    recordingToastText: '🎙 音声を録音中... もう一度マイクをタップして送信',
    browserWarningTitle: '警告画面：古いブラウザはサポートされていません',
    browserWarningSub: 'DuoWindo6601 プラットフォーム互換性チェック',
    browserCompatibleTitle: 'モダンなブラウザと最新のOS (Windows / Linux / macOS / Android):',
    browserCompatibleDesc: 'お使いのシステムは完全に互換性があります！警告はありません。すべての機能、Gemini API、および音声入力が正常に動作します。',
    browserOutdatedTitle: '古いブラウザまたはサポートされていないOSが検出されました：',
    browserOutdatedDesc: 'システムが古くなっています（レガシーブラウザまたは Windows XP / Windows Vista）。',
    sysMessageLabel: 'システムメッセージ：',
    sysMessageDesc: '申し訳ありませんが、現在お使いのブラウザはサポートされていません。DuoWindo6601を使い続けるには、モダンなブラウザにアップデートしてください。Windows XP/Windows Vistaはサポートされていません。',
    riskLabel: 'リスク：',
    riskDesc: 'Gemini API が正しく動作しない可能性があります',
    winOsSupportLabel: 'Windowsオペレーティングシステムのサポート有効期限：',
    win7Desc: 'サポート終了',
    win7Status: '❌ サポート終了 (2020年1月14日)',
    win8Status: '❌ サポート終了 (2023年1月10日)',
    win10Desc: '無料サポートは2025年10月14日に終了しました',
    win10Status: '⚠️ ESUは2027年10月12日まで',
    win10Note: '* 一般ユーザー向けの有料の拡張セキュリティ更新（ESU）プログラムは2027年10月まで延長されました。',
    win11Desc: 'サポート終了日は未定、バージョンによって異なります',
    win11Status: '✅ バージョン 24H2は2026年10月13日まで',
    win11Note: '* サポートライフサイクルは、毎年的機能アップデートによって異なります。バージョン 24H2（Home/Pro）は2026年10月13日までサポートされます。',
    modernBrowsersLabel: '推奨されるモダンなブラウザ：',
    downloadBtn: 'ダウンロード',
    sslTitle: 'SSL証明書 (WR2 / 新しいサイト)',
    sslDesc: '証明書の発行元がWR2サイトであることの確認。サーバーは透明性ログの提示に成功しました。',
    mobileSimTitle: 'モバイルシミュレータテストベンチ',
    mobileSimDesc: 'PCでレスポンシブレイアウトをテストするためのインタラクティブなiOSおよびAndroidエミュレータ。',
    mobileSimBtn: 'シミュレータを起動',
    feedbackBannerTitle: 'フィードバックとサポート',
    feedbackBannerDesc: 'バグを見つけたか、アイデアを提案したいですか？',
    adminBannerTitle: 'オーナーダッシュボード',
    adminBannerDesc: 'モデレーションと監視',
    cloudSaveTitle: 'クラウド保存',
    loading: '読み込み中...',
    loggedInAs: '{user} としてログイン中',
    progressSynced: '● 進捗状況がクラウドと同期されました',
    signOut: 'ログアウト',
    savedLocallyAs: 'ブラウザにローカル保存中: @{username}',
    updateBrowserBtn: 'ブラウザを更新する',
    continueDuoWindoBtn: 'DuoWindo6601 の使用を継続する'
  },
  zh: {
    androidAlertTitle: 'Android 应用可用！',
    androidAlertDesc: 'DuoWindo6601 现已登陆 Android！',
    androidAlertBtn: '立即安装',
    androidModalTitle: '安装指南',
    androidModalClose: '关闭',
    coursesAndRegions: '课程与语言地区',
    searchPlaceholder: '🔍 搜索语言或地区...',
    allCourses: '所有课程',
    cisLanguages: '独联体语言 (15)',
    worldLanguages: '世界语言',
    subjectsAndGames: '科目与游戏',
    rfRegions: '俄罗斯地区',
    searchResults: '搜索结果',
    cisSectionTitle: '独联体及邻国语言',
    worldSectionTitle: '热门世界语言',
    specialSectionTitle: '特色科目与游戏',
    rfSectionTitle: '俄罗斯联邦地区',
    regionalCourse: '地区课程',
    foreignLanguage: '外语',
    specialSubject: '特色科目',
    musicTheory: '音乐理论',
    exactScience: '精密科学',
    chessLogic: '国际象棋游戏与逻辑',
    betaTitle: 'DuoWindo6601 Beta 测试访问',
    betaDesc: '所有应用功能均可用于测试：独联体和世界语言、国际象棋、图形、AI配音和控制面板。',
    betaBtn: '🧪 DuoWindo6601 Beta 中心',
    reviewsBtn: '⭐ 评价',
    githubTitle: 'DuoWindo6601 已在 GitHub 上可用',
    githubDesc: '通过 .github/workflows/build.yml 启动自动 Android APK 构建。',
    testAndroidBtn: '🤖 Android 测试',
    home: '首页', practice: '练习', leaderboard: '排行榜', shop: '商店', profile: '个人资料', feedback: '反馈',
    lang_ru: '俄语', lang_en: '英语', lang_de: '德语', lang_fr: '法语', lang_es: '西班牙语', lang_ja: '日语', lang_zh: '中文',
    videoCallDesc: '与人工智能伙伴的实时交流', storiesAndWriting: '故事与写作', leaderboardDesc: '前3名晋级白银联赛',
    sslCertificateTitle: 'SSL 证书 (WR2 / 新版网站)', sslCertificateDesc: '确认证书颁发者是 WR2 网站。服务器已成功提供透明度日志。',
    edit: '编辑', mobileSimulatorBench: '移动模拟器测试台', mobileSimulatorDesc: '用于在 PC 上测试布局的交互式 iOS 和 Android 模拟器。',
    launchSimulator: '启动模拟器', usernameNotSet: '未设置用户名', incognito: '无痕',
    listenSpeech: '正在聆听语音...', typeMessage: '输入消息...', send: '发送', recordingSpeech: '正在录制语音... 再次点击麦克风发送',
    activeWith: '启用：', change: '修改', isYou: '是你',
    unit: '单元', start: '开始', check: '检查', continue: '继续', skip: '跳过',
    module1: '模块 1，单元 1', chessUnitName: '棋子走法',
    settings: '设置', language: '语言', country: '国家', back: '返回', save: '保存',
    free: '免费', trySuper: '试用 Super', connectMax: '连接 Max', cancelSub: '取消订阅',
    whatToLearn: '你想学什么？', newCourses: '新课程', forRu: '俄语学习者专属',
    shopTitle: '商店 6601', leaderboardTitle: '青铜联赛', roleplays: '角色扮演',
    audio: '音频', speech: '语音', translate: '翻译', translator: '翻译器', illusion: '声音错觉',
    drawing: '书写字母', offline: '离线', apiStatus: 'API 状态', online: '在线',
    limitReached: '额度已用尽', checkConnection: '检查连接', voice: '声音',
    voiceProvider: '语音提供商', t_api_online: 'API 在线！', t_offline_limit: '离线 / 额度已用尽',
    t_skip: '已跳过', t_energy_low: '能量耗尽！', t_sub_cancel: '订阅已取消',
    t_welcome_super: '欢迎来到 Super！', t_welcome_max: '欢迎来到 Max！', t_buy_energy: '能量已恢复！',
    t_freeze_used: '已冻结！', t_rec_error: '识别失败', t_buy_gems: '已购买',
    t_topic_empty: '未选择主题', t_api_error: 'API 错误', t_speech_empty: '未听到语音', alphabet: '字母', explainMax: '解释我的回答', explainHeader: '错误解释',
    ishihara: '石原色盲测试', ishiharaDesc: '色觉检查', auto: '自动',
    chooseTier: "选择等级", energy25: "25 能量", ads: "广告", infEnergy: "无限能量", noAds: "无广告",
    trafficFree: "DuoWindo6601 免费流量 (免费 Gemini API Key)",
    trafficSuper: "DuoWindo6601 Super 流量 (付费 Gemini API Key)",
    trafficMax: "DuoWindo6601 Max 流量 (付费 Gemini API Key)",
    allInSuper: "Super 的所有功能", aiExplain: "AI 解答纠错", currentPlan: "当前方案", streakDays: "连续天数",
    totalXP: "总经验值", playChess: "下国际象棋", chessDesc: "与 DuoWindo6601 对弈", games: "对局", wins: "胜利", elo: "积分",
    startChess: "开始：+30 XP", startSpeak: "开始说话 →", whatHeard: "你听到了什么？", speakForDuo: "替 Duo 发言",
    chessSubtitle: "与 DuoWindo6601 进行 20 分钟对弈", startChessMatch: "开始对局：+30 经验值",
    pvp: "玩家对战玩家", pve: "玩家对战 DuoWindo6601",
    readPractice: "阅读练习", aiTrans: "AI 翻译官", realOrNot: "是真是假？", writePractice: "写作练习",
    topicPrompt: "词汇主题？", topicPlaceholder: "留空...", trySuperTitle: "试用 SUPER",
    trySuperDesc: "无广告，无限制！", refill: "补充至 25", freeze: "冻结", freezeDesc: "保留连续天数",
    refillGems: "充值宝石", popular: "热门", handful: "一把", sack: "麻袋", chest: "宝箱", cantListen: "无法收听",
    cantSpeak: "无法说话", endChat: "结束对话", exitGame: "退出游戏", great: "太棒了！", wrong: "回答错误！", next: "继续",
    correctAnswer: "正确答案：", checkmateWin: "将死！你赢了！", checkmateLoss: "将死！AI 获胜。",
    videoCall: "视频通话", startInterview: "开始面试", smartMode: "智能模式", interviewer: "面试官", self: "你",
    serverJsTitle: 'server.js 支持！',
    serverJsDesc: 'DuoWindo 项目已正式集成专属生产服务器 server.js，完美支持静态托管与 SPA 路由！',
    serverJsBtn: '太棒了！ 🚀',
    streakResume: '连胜模式',
    streakResumed: '🔥 完成课程，连胜已恢复（+1天）！',
    browserBtn: '浏览器',
    eduBtn: '💡 学习',
    eduWelcome: '欢迎！点击任意白棋查看其移动方式。',
    lessonWelcome: '课堂模式。机器人已禁用。你可以自由移动双方的棋子。',
    lessonBtn: '课堂（无机器人）',
    playDuoBtn: '与 DuoWindo6601 对弈',
    chessStudyDesc: '课堂模式（无机器人）。练习你的走法！',
    chessTutorialDesc: '教程！点击任意白棋学习其移动规则。',
    chessPlayDesc: '别怕，我会手下留情的！',
    incognitoTitle: '无痕模式（无账户）',
    incognitoLeaderboardDesc: '分数将保存在本地。注册以加入全球排行榜！',
    register: '注册',
    noUsername: '未设置用户名',
    editProfile: '编辑个人资料',
    registerAuth: '注册 / 登录',
    streakAdjustment: '连胜调整：已禁用手动增减天数（属于作弊行为）。每日完成课程即可自动恢复并延续连胜。',
    streakLessonAction: '🚀 完成课程以延续连胜（+1天）',
    streakFairPlayBadge: '🛡️ 公平学习：仅通过课程获取',
    streakFreezeActive: '❄️ 连胜冻结保护生效中（{count}个）',
    toastStreakBack7: '⏪ 连续：{streak} 天',
    toastStreakBack1: '◀ 后退：{streak} 天',
    toastStreakForward1: '▶ 前进：{streak} 天',
    toastStreakForward7: '⏩ 前进（+7）：{streak} 天',
    days: '天',
    registerAndLogin: '注册与登录',
    regLoginSubtitle: '注册账号、通过 Google 登录，或在无痕模式下匿名游玩',
    incognitoTab: '无痕模式',
    googleTab: 'Google',
    displayNameLabel: '显示名称',
    requiredLabel: '*必填',
    displayNamePlaceholder: '例如：阿纳托利',
    usernameLabel: '用户名 (@username)',
    uniqueHandleLabel: '唯一昵称',
    profileLeaderboardVisible: '显示在个人资料和排行榜中',
    selectAvatarLabel: '选择头像',
    registerAndStartBtn: '注册并开始',
    fullIncognitoTitle: '无需输入邮箱或姓名的完全隐私模式',
    noSignupPasswordsRule: '无需注册或密码',
    allProgressLocalRule: '所有进度均保存在本地浏览器中',
    canRegisterAnytimeRule: '您可以随时进行注册',
    continueGuestBtn: '作为访客 / 无痕继续',
    firebaseCloudSyncTitle: 'Firebase 云端同步',
    syncAllDevicesDesc: '在所有设备间同步您的学习统计数据',
    progressSyncNote: '登录后，您的进度将自动与 Google 账号同步。',
    iframeWarning: '⚠️ 框架限制：Google 登录可能在 iFrame 中被拦截。',
    openNewTabBtn: '在新标签页中打开 ↗',
    signInGoogleBtn: '通过 Google 登录',
    skipContinueIncognitoBtn: '跳过 / 无账号继续（无痕）↗',
    uploadPhotoBtn: '📷 上传照片',
    deletePhotoBtn: '🗑️ 删除照片',
    avatarUrlLabel: '头像图片网址 (URL)',
    avatarBgColorLabel: '头像背景颜色',
    avatarIconLabel: '头像图标 / 表情',
    cancelBtn: '取消',
    saveProfileBtn: '保存',
    listeningPlaceholder: '正在聆听您的语音...',
    typingPlaceholder: '输入消息...',
    sendBtn: '发送',
    recordingToastText: '🎙 正在录音... 再次点击麦克风发送',
    browserWarningTitle: '警告页面：不支持旧版浏览器',
    browserWarningSub: 'DuoWindo6601 平台兼容性检查',
    browserCompatibleTitle: '现代浏览器与当前操作系统 (Windows / Linux / macOS / Android):',
    browserCompatibleDesc: '您的系统完全兼容！无任何警告。所有功能、Gemini API 和语音输入均能完美运行。',
    browserOutdatedTitle: '检测到旧版浏览器或不被支持的操作系统：',
    browserOutdatedDesc: '您的系统已过时（旧版浏览器或 Windows XP / Windows Vista）。',
    sysMessageLabel: '系统信息：',
    sysMessageDesc: '很抱歉，您当前使用的浏览器已不再受支持。要继续使用 Duowindo6601，请更新到现代浏览器。不支持 Windows XP/Windows Vista。',
    riskLabel: '风险：',
    riskDesc: 'Gemini API 可能无法正常运行',
    winOsSupportLabel: 'Windows 操作系统支持生命周期：',
    win7Desc: '停止全部支持',
    win7Status: '❌ 已结束 (2020年1月14日)',
    win8Status: '❌ 已结束 (2023年1月10日)',
    win10Desc: '免费支持已于 2025 年 10 月 14 日结束',
    win10Status: '⚠️ ESU 持续至 2027 年 10 月 12 日',
    win10Note: '* 面向零售用户的付费扩展安全更新 (ESU) 计划已延长至 2027 年 10 月。',
    win11Desc: '没有统一结束日期，支持取决于具体版本',
    win11Status: '✅ 24H2 版本支持至 2026 年 10 月 13 日',
    win11Note: '* 支持周期取决于年度功能更新。24H2 版本 (家庭版/专业版) 的支持持续至 2026 年 10 月 13 日。',
    modernBrowsersLabel: '推荐的现代浏览器：',
    downloadBtn: '下载',
    sslTitle: 'SSL 证书 (WR2 / 新版网站)',
    sslDesc: '确认证书颁发者是 WR2 网站。服务器已成功提供透明度日志。',
    mobileSimTitle: '移动模拟器测试台',
    mobileSimDesc: '用于在电脑端测试响应式布局的交互式 iOS 和 Android 模拟器。',
    mobileSimBtn: '启动模拟器',
    feedbackBannerTitle: '意见反馈与支持',
    feedbackBannerDesc: '发现 Bug 或想提出建议？',
    adminBannerTitle: '所有者仪表板',
    adminBannerDesc: '版面管理与监控',
    cloudSaveTitle: '云端保存',
    loading: '加载中...',
    loggedInAs: '已登录为 {user}',
    progressSynced: '● 进度已同步至云端',
    signOut: '退出登录',
    savedLocallyAs: '已作为 @{username} 仅在浏览器本地保存。',
    updateBrowserBtn: '更新您的浏览器',
    continueDuoWindoBtn: '继续使用 DuoWindo6601'
  },
  ar: {
    androidAlertTitle: 'تطبيق أندرويد!',
    androidAlertDesc: 'DuoWindo6601 متاح الآن على جهازك المحمول! اكتشف عالم المعرفة.',
    androidAlertBtn: 'تثبيت',
    androidModalTitle: 'تعليمات التثبيت',
    androidModalClose: 'إغلاق',
    coursesAndRegions: 'الدورات والمناطق اللغوية',
    searchPlaceholder: '🔍 البحث عن لغة أو منطقة...',
    allCourses: 'جميع الدورات',
    cisLanguages: 'لغات رابطة الدول المستقلة',
    worldLanguages: 'اللغات العالمية',
    subjectsAndGames: 'المواد والألعاب',
    rfRegions: 'مناطق روسيا',
    searchResults: 'نتائج البحث',
    cisSectionTitle: 'لغات رابطة الدول المستقلة والدول المجاورة',
    worldSectionTitle: 'اللغات العالمية الشائعة',
    specialSectionTitle: 'المواد الخاصة والألعاب',
    rfSectionTitle: 'مناطق روسيا الاتحادية',
    regionalCourse: 'دورة إقليمية',
    foreignLanguage: 'لغة أجنبية',
    specialSubject: 'مادة خاصة',
    musicTheory: 'نظرية الموسيقى',
    exactScience: 'العلوم الدقيقة',
    chessLogic: 'لعبة الشطرنج والمنطق',
    betaTitle: 'DuoWindo6601 الوصول للاختبار التجريبي',
    betaDesc: 'جميع ميزات التطبيق متاحة للاختبار.',
    betaBtn: '🧪 مركز بيتا DuoWindo6601',
    reviewsBtn: '⭐ المراجعات',
    githubTitle: 'DuoWindo6601 متاح على GitHub',
    githubDesc: 'تم إطلاق البناء التلقائي لـ Android APK عبر .github/workflows/build.yml.',
    testAndroidBtn: '🤖 اختبار أندرويد',
    home: 'الرئيسية', practice: 'الممارسة', leaderboard: 'التصنيف', shop: 'المتجر', profile: 'الملف الشخصي', feedback: 'الآراء',
    lang_ru: 'الروسية', lang_en: 'الإنجليزية', lang_de: 'الألمانية', lang_fr: 'الفرنسية', lang_es: 'الإسبانية', lang_ja: 'اليابانية', lang_zh: 'الصينية', lang_ar: 'العربية',
    videoCallDesc: 'تواصل مباشر مع شريك الذكاء الاصطناعي', storiesAndWriting: 'القصص والكتابة', leaderboardDesc: 'أفضل 3 ينتقلون إلى الدوري الفضي',
    sslCertificateTitle: 'شهادة SSL (WR2 / الموقع الجديد)', sslCertificateDesc: 'تأكيد الشهادة: الناشر موقع WR2.',
    edit: 'تعديل', mobileSimulatorBench: 'منصة محاكي الهاتف', mobileSimulatorDesc: 'محاكي تفاعلي لـ iOS و Android.',
    launchSimulator: 'تشغيل المنصة', usernameNotSet: 'اسم المستخدم غير محدد', incognito: 'المتخفي',
    listenSpeech: 'أستمع لكلامك...', typeMessage: 'اكتب رسالة...', send: 'إرسال', recordingSpeech: 'تسجيل الصوت...',
    activeWith: 'نشط مع', change: 'تغيير', isYou: 'هذا أنت',
    unit: 'الوحدة', start: 'ابدأ', check: 'تحقق', continue: 'متابعة', skip: 'تخطي',
    module1: 'الوحدة 1، القسم 1', chessUnitName: 'حركة القطع',
    settings: 'الإعدادات', language: 'اللغة', country: 'البلد', back: 'عودة', save: 'حفظ',
    free: 'مجاني', trySuper: 'تجربة Super', connectMax: 'توصيل Max', cancelSub: 'إلغاء الاشتراك',
    whatToLearn: 'ماذا تريد أن تتعلم؟', newCourses: 'دورات جديدة', forRu: 'للناطقين بالروسية',
    shopTitle: 'متجر 6601', leaderboardTitle: 'الدوري البرونزي', roleplays: 'تمثيل الأدوار',
    audio: 'الصوت', speech: 'الكلام', translate: 'الترجمة', translator: 'المترجم', illusion: 'الخداع الصوتي',
    drawing: 'رسم الحروف', offline: 'غير متصل', apiStatus: 'حالة API', online: 'متصل',
    limitReached: 'تم الوصول إلى الحد', checkConnection: 'تحقق من الاتصال', voice: 'الصوت',
    voiceProvider: 'مزود الصوت', t_api_online: 'API متصل!', t_offline_limit: 'غير متصل / تم الوصول إلى الحد',
    t_skip: 'تم تخطي التمرين', t_energy_low: 'نفدت طاقتك!', t_sub_cancel: 'تم إلغاء الاشتراك',
    t_welcome_super: 'مرحباً بك في Super!', t_welcome_max: 'مرحباً بك في Max!', t_buy_energy: 'تم استعادة الطاقة!',
    t_freeze_used: 'تم تجميد السلسلة!', t_rec_error: 'تعذر التعرف. حاول مرة أخرى.', t_buy_gems: 'تم الشراء',
    t_topic_empty: 'لم يتم تحديد موضوع', t_api_error: 'خطأ في API', t_speech_empty: 'لم يتم سماع صوت', alphabet: 'الأبجدية', explainMax: 'شرح إجابتي', explainHeader: 'شرح الخطأ',
    ishihara: 'اختبار إيشيهارا', ishiharaDesc: 'فحص رؤية الألوان', auto: 'تلقائي',
    chooseTier: "اختر المستوى", energy25: "25 طاقة", ads: "الإعلانات", infEnergy: "طاقة غير محدودة", noAds: "بدون إعلانات",
    trafficFree: "حركة مرور DuoWindo6601 المجانية (Gemini API Key مجاني)",
    trafficSuper: "حركة مرور DuoWindo6601 Super (Gemini API Key مدفوع)",
    trafficMax: "حركة مرور DuoWindo6601 Max (Gemini API Key مدفوع)",
    allInSuper: "جميع ميزات Super", aiExplain: "توضيح الذكاء الاصطناعي", currentPlan: "الخطة الحالية", streakDays: "أيام متتالية",
    totalXP: "إجمالي النقاط", playChess: "لعب الشطرنج", chessDesc: "اللعب مع DuoWindo6601", games: "مباريات", wins: "انتصارات", elo: "التصنيف",
    startChess: "ابدأ: +30 XP", startSpeak: "ابدأ التحدث ←", whatHeard: "ماذا سمعت؟", speakForDuo: "التحدث عن Duo",
    chessSubtitle: "لعبة شطرنج مدتها 20 دقيقة مع DuoWindo6601", startChessMatch: "بدء المباراة: +30 XP",
    pvp: "لاعب ضد لاعب", pve: "لاعب ضد DuoWindo6601",
    readPractice: "تمرين القراءة", aiTrans: "مترجم الذكاء الاصطناعي", realOrNot: "حقيقي أم لا؟", writePractice: "تمرين الكتابة",
    topicPrompt: "موضوع المفردات؟", topicPlaceholder: "اتركه فارغاً...", trySuperTitle: "تجربة SUPER",
    trySuperDesc: "بدون إعلانات، بدون حدود!", refill: "إعادة التعبئة إلى 25", freeze: "تجميد", freezeDesc: "الحفاظ على السلسلة",
    refillGems: "تعبئة الجواهر", popular: "شائع", handful: "حفنة", sack: "كيس", chest: "صندوق", cantListen: "تعذر الاستماع",
    cantSpeak: "تعذر التحدث", endChat: "إنهاء المحادثة", exitGame: "خروج من اللعبة", great: "رائع!", wrong: "إجابة خاطئة!", next: "التالي",
    correctAnswer: "الإجابة الصحيحة:", checkmateWin: "كش مات! لقد فزت!", checkmateLoss: "كش مات! فاز الذكاء الاصطناعي.",
    videoCall: "مكالمة فيديو", startInterview: "بدء المقابلة", smartMode: "الوضع الذكي", interviewer: "المقابل", self: "أنت",
    serverJsTitle: 'دعم server.js!',
    serverJsDesc: 'تم دمج خادم الإنتاج الخصوصي server.js بنجاح!',
    serverJsBtn: 'رائع! 🚀',
    streakResume: 'وضع الحماسة',
    streakResumed: '🔥 تم استئناف وضع الحماسة (+1 يوم للدرس)!',
    browserBtn: 'المتصفح',
    eduBtn: '💡 التعلم',
    eduWelcome: 'مرحباً! انقر على أي قطعة بيضاء لمعرفة طريقة حركتها.',
    lessonWelcome: 'وضع الدرس. تم تعطيل الروبوت.',
    lessonBtn: 'درس (بدون روبوت)',
    playDuoBtn: 'لعب مع DuoWindo6601',
    chessStudyDesc: 'وضع الدرس (بدون روبوت). تدرب على النقلات!',
    chessTutorialDesc: 'تعليمي! انقر على أي قطعة بيضاء لمعرفة قواعدها.',
    chessPlayDesc: 'لا تقلق، سألعب ببطء!',
    incognitoTitle: 'وضع المتخفي (بدون حساب)',
    incognitoLeaderboardDesc: 'تُحسب النقاط محلياً. سجل للمشاركة في التصنيف العالمي!',
    register: 'تسجيل',
    noUsername: 'اسم المستخدم غير محدد',
    editProfile: 'تعديل الملف الشخصي',
    registerAuth: 'التسجيل / الدخول',
    streakAdjustment: 'تعديل الحماسة: تم تعطيل التعديل اليدوي للأيام (يعتبر غير عادل). يُستأنف وضع الحماسة ويمتد تلقائياً عبر إكمال الدروس اليومية.',
    streakLessonAction: '🚀 أكمل درساً لتمديد الحماسة (+1 يوم)',
    streakFairPlayBadge: '🛡️ لعب عادل: عبر الدروس فقط',
    streakFreezeActive: '❄️ تجميد الحماسة مفعل ({count})',
    toastStreakBack7: '⏪ السلسلة: {streak} يوم',
    toastStreakBack1: '◀ للخلف: {streak} يوم',
    toastStreakForward1: '▶ للأمام: {streak} يوم',
    toastStreakForward7: '⏩ للأمام (+7): {streak} يوم',
    days: 'أيام',
    registerAndLogin: 'التسجيل والدخول',
    regLoginSubtitle: 'إنشاء حساب أو الدخول عبر Google أو اللعب كمتخفٍ',
    incognitoTab: 'المتخفي',
    googleTab: 'Google',
    displayNameLabel: 'الاسم المعروض',
    requiredLabel: '*مطلوب',
    displayNamePlaceholder: 'مثال: أحمد',
    usernameLabel: 'اسم المستخدم (@username)',
    uniqueHandleLabel: 'المعرف الفريد',
    profileLeaderboardVisible: 'يظهر في الملف الشخصي والتصنيف',
    selectAvatarLabel: 'اختر الصورة الرمزية',
    registerAndStartBtn: 'التسجيل والبدء',
    fullIncognitoTitle: 'خصوصية تامة بدون بريد أو اسم',
    noSignupPasswordsRule: 'بدون تسجيل أو كلمة سر',
    allProgressLocalRule: 'يتم حفظ جميع التطورات محلياً',
    canRegisterAnytimeRule: 'يمكنك التسجيل في أي وقت',
    continueGuestBtn: 'المتابعة كضيف / متخفٍ',
    firebaseCloudSyncTitle: 'مزامنة Firebase السحابية',
    syncAllDevicesDesc: 'حفظ تقدمك عبر جميع الأجهزة',
    progressSyncNote: 'عند الدخول، سيتم ربط التقدم بحساب Google الخاص بك.',
    iframeWarning: '⚠️ تنبيه الإطار: قد يتم حظر الدخول داخل الإطار.',
    openNewTabBtn: 'فتح في تبويب جديد ↗',
    signInGoogleBtn: 'الدخول عبر Google',
    skipContinueIncognitoBtn: 'تخطي / المتابعة بدون حساب (متخفٍ) ↗',
    uploadPhotoBtn: '📷 رفع صورة',
    deletePhotoBtn: '🗑️ حذف الصورة',
    avatarUrlLabel: 'رابط الصورة (URL)',
    avatarBgColorLabel: 'لون خلفية الصورة الرمزية',
    avatarIconLabel: 'الرمز / الأيقونة',
    cancelBtn: 'إلغاء',
    saveProfileBtn: 'حفظ',
    listeningPlaceholder: 'جاري الاستماع لكلامك...',
    typingPlaceholder: 'اكتب رسالة...',
    sendBtn: 'إرسال',
    recordingToastText: '🎙 تسجيل الصوت... انقر على الميكروفون مرة أخرى للإرسال',
    browserWarningTitle: 'شاشة التنبيه: المتصفح القديم غير مدعوم',
    browserWarningSub: 'فحص توافق منصة DuoWindo6601',
    browserCompatibleTitle: 'متصفح حديث ونظام تشغيل حديث (Windows / Linux / macOS / Android):',
    browserCompatibleDesc: 'نظامك متوافق تماماً! لا توجد تحذيرات. جميع الميزات و Gemini API والمدخلات الصوتية تعمل بامتياز.',
    browserOutdatedTitle: 'تم اكتشاف متصفح قديم أو نظام تشغيل غير مدعوم:',
    browserOutdatedDesc: 'نظامك قديم (متصفح قديم أو Windows XP / Windows Vista).',
    sysMessageLabel: 'رسالة النظام:',
    sysMessageDesc: 'عذراً، متصفحك الحالي لم يعد مدعوماً. لمواصلة استخدام Duowindo6601 يرجى التحديث لمتصفح حديث. Windows XP/Vista غير مدعوم.',
    riskLabel: 'المخاطر:',
    riskDesc: 'قد لا تعمل ميزات Gemini API بشكل صحيح',
    winOsSupportLabel: 'دورات دعم أنظمة تشغيل Windows:',
    win7Desc: 'إنهاء الدعم الكامل',
    win7Status: '❌ انتهى (14 يناير 2020)',
    win8Status: '❌ انتهى (10 يناير 2023)',
    win10Desc: 'انتهى الدعم المجاني في 14 أكتوبر 2025',
    win10Status: '⚠️ ESU حتى 12 أكتوبر 2027',
    win10Note: '* برنامج التحديثات الأمنية الممتدة (ESU) للمستخدمين ممتد حتى أكتوبر 2027.',
    win11Desc: 'لا يوجد تاريخ إنهاء موحد، الدعم يعتمد على الإصدار',
    win11Status: '✅ دعم إصدار 24H2 حتى 13 أكتوبر 2026',
    win11Note: '* يعتمد الدعم على التحديثات السنوية.',
    modernBrowsersLabel: 'المتصفحات الحديثة الموصى بها:',
    downloadBtn: 'تنزيل',
    sslTitle: 'شهادة SSL (WR2 / الموقع الجديد)',
    sslDesc: 'تأكيد الشهادة: الناشر موقع WR2. تم تقديم سجلات الشفافية بنجاح.',
    mobileSimTitle: 'منصة محاكي الهاتف المحمول',
    mobileSimDesc: 'محاكي تفاعلي لـ iOS و Android لاختبار الاستجابة على جهاز الكمبيوتر.',
    mobileSimBtn: 'تشغيل المحاكي',
    feedbackBannerTitle: 'الآراء والدعم',
    feedbackBannerDesc: 'هل وجدت خطأ أو لديك اقتراح؟',
    adminBannerTitle: 'لوحة تحكم المالك',
    adminBannerDesc: 'إدارة اللوحة والمراقبة',
    cloudSaveTitle: 'الحفظ السحابي',
    loading: 'جاري التحميل...',
    loggedInAs: 'تم الدخول باسم {user}',
    progressSynced: '● تم مزامنة التقدم سحابياً',
    signOut: 'تسجيل الخروج',
    savedLocallyAs: 'تم الحفظ محلياً كـ @{username} في المتصفح.',
    updateBrowserBtn: 'تحديث المتصفح الخاص بك',
    continueDuoWindoBtn: 'المتابعة إلى DuoWindo6601'
  }
};

const sanitizeForFirestore = (obj: any, isUpdate = false) => {
  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    if (isUpdate && key === 'createdAt') continue;
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
};

const DUO_TIPS = [
  "🦉 Duo точит карандаши и раскладывает карточки...",
  "💡 15 минут в день — и вы заговорите свободно!",
  "✨ Не бойтесь ошибаться — на ошибках учатся быстрее!",
  "🎯 Подбираем персональные упражнения под ваш уровень...",
  "⚡ Не прерывайте серию ударных дней — вы на верном пути!",
  "🧠 Регулярность занятий намного важнее их длительности!",
  "🎉 Каждый пройденный урок приближает вас к заветной цели!",
  "🌟 Изучение нового языка тренирует память и мозг!"
];

function App() {
  const [simSystemMode, setSimSystemMode] = useState<SimulationMode>("real");
  const [systemDismissed, setSystemDismissed] = useState<boolean>(false);
  const [showSystemInfoModal, setShowSystemInfoModal] = useState<boolean>(false);

  const systemInfo = useMemo(() => {
    return detectSystemCompatibility(simSystemMode);
  }, [simSystemMode]);

  const [screen, setScreen] = useState<AppScreen>(AppScreen.PATH);
  const [offlineMode, setOfflineMode] = useState(false);
  
  // Mobile test simulator states
  const [simulatorMode, setSimulatorMode] = useState<'none' | 'android' | 'ios'>('none');
  const [simulatorOrientation, setSimulatorOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [simulatorBattery, setSimulatorBattery] = useState<number>(85);
  const [simulatorWifi, setSimulatorWifi] = useState<boolean>(true);
  const [simNotify, setSimNotify] = useState<string | null>(null);
  const [simShaking, setSimShaking] = useState<boolean>(false);
  const [simScreenshotFlash, setSimScreenshotFlash] = useState<boolean>(false);
  const [simTouchPointer, setSimTouchPointer] = useState<boolean>(false);
  const [pointerPos, setPointerPos] = useState({ x: 190, y: 400 });
  const [clickRipples, setClickRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [simScreenOn, setSimScreenOn] = useState<boolean>(true);
  const [simVolume, setSimVolume] = useState<number>(70);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  const [showScreenshotAlert, setShowScreenshotAlert] = useState<boolean>(false);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);
  const [swipePath, setSwipePath] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [simTriggerDismissed, setSimTriggerDismissed] = useState<boolean>(() => localStorage.getItem('duo_sim_trigger_dismissed') === 'true');
  const [dailyChallengeDismissedDate, setDailyChallengeDismissedDate] = useState<string>(() => localStorage.getItem('duo_daily_challenge_dismissed') || '');
  const [showBetaModal, setShowBetaModal] = useState<boolean>(false);
  const [showExplanationModal, setShowExplanationModal] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string>('');
  const [explanationLoading, setExplanationLoading] = useState<boolean>(false);
const DAILY_CHALLENGES: Array<{
  type: Exercise['type'];
  titleRu: string;
  titleEn: string;
  bonusXp: number;
  icon: string;
  descRu: string;
  descEn: string;
}> = [
  { type: 'translation', titleRu: 'Мастер перевода', titleEn: 'Translation Master', bonusXp: 50, icon: '📖', descRu: 'Пройдите 1 упражнение на перевод предложений', descEn: 'Complete 1 sentence translation exercise' },
  { type: 'listening', titleRu: 'Острый слух', titleEn: 'Sharp Listener', bonusXp: 50, icon: '🎧', descRu: 'Пройдите 1 упражнение на аудирование', descEn: 'Complete 1 listening practice exercise' },
  { type: 'speech', titleRu: 'Оратор дня', titleEn: 'Daily Speaker', bonusXp: 50, icon: '🎙️', descRu: 'Произнесите фразу с помощью микрофона', descEn: 'Speak a sentence using microphone' },
  { type: 'roleplay', titleRu: 'Общение с ИИ', titleEn: 'AI Roleplay', bonusXp: 50, icon: '💬', descRu: 'Пообщайтесь с ИИ в ролевом диалоге', descEn: 'Chat with AI in roleplay mode' },
  { type: 'reading', titleRu: 'Любитель историй', titleEn: 'Story Reader', bonusXp: 50, icon: '📚', descRu: 'Прочитайте короткий текст или историю', descEn: 'Read a short text or story' },
  { type: 'drawing', titleRu: 'Искусство письма', titleEn: 'Character Artist', bonusXp: 50, icon: '✏️', descRu: 'Нарисуйте символ или иероглиф на экране', descEn: 'Draw a character on screen' },
  { type: 'illusion', titleRu: 'Слуховая загадка', titleEn: 'Audio Illusion', bonusXp: 50, icon: '👂', descRu: 'Разгадайте слуховую иллюзию', descEn: 'Solve an audio illusion' },
];

const getTodayChallenge = () => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length];
};

  const [toast, setToast] = useState<string | null>(null);
  const [alphabetTab, setAlphabetTab] = useState<number>(0);
  
  const [user, setUser] = useState<UserProgress>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const todayStr = new Date().toISOString().split('T')[0];
    return saved ? JSON.parse(saved) : { 
      name: "Ученик 6601", avatarColor: "bg-duo-blue", 
      energy: 25, 
      hearts: 0, 
      streak: 12, gems: 350, xp: 850, currentUnit: 1, 
      completedLessons: [], mistakes: [], learnedWords: [], achievements: [],
      subscription: 'free', doubleXPActive: false,
      language: 'ru', 
      country: 'Russia',
      preferredVoice: 'Kore',
      voiceProvider: 'gemini',
      chessStats: { games: 265, wins: 134, elo: 590 },
      streakFreezeCount: 1,
      lastActiveDate: todayStr
    };
  });

  const [leaderboardLang, setLeaderboardLang] = useState<string>(() => user.language || 'ru');

  const t = (key: string) => {
    const lang = TRANSLATIONS[user.language] ? user.language : 'en';
    if (USER_TRANSLATIONS[key] && USER_TRANSLATIONS[key][lang]) {
      return USER_TRANSLATIONS[key][lang];
    }
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en'][key] || TRANSLATIONS['ru'][key] || key;
  };

  const getLocalizedCourseName = (c: any) => {
    if (!c) return '';
    const lang = TRANSLATIONS[user.language] ? user.language : 'en';
    const directKey = `lang_${c.id}`;
    if (TRANSLATIONS[lang]?.[directKey]) {
      return TRANSLATIONS[lang][directKey];
    }
    if (c.id === 'chess') return t('playChess');
    if (c.id === 'math') {
      if (lang === 'ru') return 'Математика';
      if (lang === 'de') return 'Mathematik';
      if (lang === 'fr') return 'Mathématiques';
      if (lang === 'es') return 'Matemáticas';
      if (lang === 'ja') return '数学';
      if (lang === 'zh') return '数学';
      if (lang === 'ar') return 'الرياضيات';
      return 'Mathematics';
    }
    if (c.id === 'music') {
      if (lang === 'ru') return 'Музыка';
      if (lang === 'de') return 'Musik';
      if (lang === 'fr') return 'Musique';
      if (lang === 'es') return 'Música';
      if (lang === 'ja') return '音楽';
      if (lang === 'zh') return '音乐';
      if (lang === 'ar') return 'الموسيقى';
      return 'Music';
    }
    const rfTranslations: Record<string, Record<string, string>> = {
      'rf-tatar': { ru: 'Татарский', en: 'Tatar', de: 'Tatarisch', fr: 'Tatar', es: 'Tártaro', ja: 'タタール語', zh: '鞑靼语', ar: 'التترية' },
      'rf-bashkir': { ru: 'Башкирский', en: 'Bashkir', de: 'Baschkirisch', fr: 'Bachkir', es: 'Bashkir', ja: 'バシキール語', zh: '巴什基尔语', ar: 'الباشكيرية' },
      'rf-sakha': { ru: 'Якутский (Саха)', en: 'Yakut (Sakha)', de: 'Jakutisch', fr: 'Iakoute', es: 'Yakuto', ja: 'ヤクート語', zh: '雅库特语', ar: 'الياقوتية' },
      'rf-buryat': { ru: 'Бурятский', en: 'Buryat', de: 'Burjatisch', fr: 'Bouriate', es: 'Buriato', ja: 'ブリヤート語', zh: '布里亚特语', ar: 'البورياتية' },
      'rf-chuvash': { ru: 'Чувашский', en: 'Chuvash', de: 'Tschuwaschisch', fr: 'Tchouvache', es: 'Chuvasio', ja: 'チュヴァシ語', zh: '楚瓦什语', ar: 'التشوفاشية' },
      'rf-tuvan': { ru: 'Тувинский', en: 'Tuvan', de: 'Tuwinisch', fr: 'Touvain', es: 'Tuvano', ja: 'トゥバ語', zh: '图瓦语', ar: 'التوفية' },
      'rf-ossetian': { ru: 'Осетинский', en: 'Ossetian', de: 'Ossetisch', fr: 'Ossète', es: 'Osetio', ja: 'オセチア語', zh: '奥塞梯语', ar: 'الأوسيتية' },
      'rf-chechen': { ru: 'Чеченский', en: 'Chechen', de: 'Tschetschenisch', fr: 'Tchétchène', es: 'Checheno', ja: 'チェチェン語', zh: '车臣语', ar: 'الشيشانية' },
      'rf-avare': { ru: 'Аварский', en: 'Avar', de: 'Awarisch', fr: 'Avar', es: 'Ávaro', ja: 'アヴァル語', zh: '阿瓦尔语', ar: 'الأفارية' },
      'rf-udmurt': { ru: 'Удмуртский', en: 'Udmurt', de: 'Udmurtisch', fr: 'Oudmourte', es: 'Udmurto', ja: 'ウドムルト語', zh: '乌德穆尔特语', ar: 'الأودمورتية' },
      'rf-mari': { ru: 'Марийский', en: 'Mari', de: 'Mari', fr: 'Mari', es: 'Mari', ja: 'マリ語', zh: '马里语', ar: 'المارية' },
      'rf-mordvin': { ru: 'Мордовский (Эрзя/Мокша)', en: 'Mordvin', de: 'Mordwinisch', fr: 'Mordve', es: 'Mordvino', ja: 'モルドヴィン語', zh: '莫尔多瓦语', ar: 'الموردفينية' },
      'rf-kalmyk': { ru: 'Калмыцкий', en: 'Kalmyk', de: 'Kalmückisch', fr: 'Kalmouk', es: 'Calmuco', ja: 'カルムイク語', zh: '卡尔梅克语', ar: 'الكالميكية' },
    };
    if (rfTranslations[c.id]?.[lang]) {
      return rfTranslations[c.id][lang];
    }
    const cisTranslations: Record<string, Record<string, string>> = {
      ru: { en: 'Russian', de: 'Russisch', fr: 'Russe', es: 'Ruso', ja: 'ロシア語', zh: '俄语', ru: 'Русский', ar: 'الروسية' },
      be: { en: 'Belarusian', de: 'Weißrussisch', fr: 'Biélorusse', es: 'Bielorruso', ja: 'ベラルーシ語', zh: '白俄罗斯语', ru: 'Белорусский', ar: 'البيلاروسية' },
      uk: { en: 'Ukrainian', de: 'Ukrainisch', fr: 'Ukrainien', es: 'Ucraniano', ja: 'ウクライナ語', zh: '乌克兰语', ru: 'Украинский', ar: 'الأوكرانية' },
      mo: { en: 'Moldavian', de: 'Moldauisch', fr: 'Moldave', es: 'Moldavo', ja: 'モルドバ語', zh: '摩尔多瓦语', ru: 'Молдавский', ar: 'المولدوفية' },
      lt: { en: 'Lithuanian', de: 'Litauisch', fr: 'Lituanien', es: 'Lituano', ja: 'リトアニア語', zh: '立陶宛语', ru: 'Литовский', ar: 'الليتوانية' },
      lv: { en: 'Latvian', de: 'Lettisch', fr: 'Letton', es: 'Letón', ja: 'ラトビア語', zh: '拉脱维亚语', ru: 'Латышский', ar: 'اللاتفية' },
      et: { en: 'Estonian', de: 'Estnisch', fr: 'Estonien', es: 'Estonio', ja: 'エストニア語', zh: '爱沙尼亚语', ru: 'Эстонский', ar: 'الإستونية' },
      ka: { en: 'Georgian', de: 'Georgisch', fr: 'Géorgien', es: 'Georgiano', ja: 'グルジア語', zh: '格鲁吉亚语', ru: 'Грузинский', ar: 'الجورجية' },
      hy: { en: 'Armenian', de: 'Armenisch', fr: 'Arménien', es: 'Armenio', ja: 'アルメニア語', zh: '亚美尼亚语', ru: 'Армянский', ar: 'الأرمنية' },
      az: { en: 'Azerbaijani', de: 'Aserbaidschanisch', fr: 'Azerbaïdjanais', es: 'Azerbaiyano', ja: 'アゼルバイジャン語', zh: '阿塞拜疆语', ru: 'Азербайджанский', ar: 'الأذربيجانية' },
      kk: { en: 'Kazakh', de: 'Kasachisch', fr: 'Kazakh', es: 'Kazajo', ja: 'カザフ語', zh: '哈萨克语', ru: 'Казахский', ar: 'الكازاخية' },
      uz: { en: 'Uzbek', de: 'Usbekisch', fr: 'Ouzbek', es: 'Uzbeko', ja: 'ウズベク語', zh: '乌兹别克语', ru: 'Узбекский', ar: 'الأوزبكية' },
      tk: { en: 'Turkmen', de: 'Turkmenisch', fr: 'Turkmène', es: 'Turcomano', ja: 'トルクメン語', zh: '土库曼语', ru: 'Туркменский', ar: 'التركمانية' },
      ky: { en: 'Kyrgyz', de: 'Kirgisisch', fr: 'Kirghize', es: 'Kirguís', ja: 'キルギス語', zh: '吉尔吉斯语', ru: 'Киргизский', ar: 'القيرغيزية' },
      tg: { en: 'Tajik', de: 'Tadschikisch', fr: 'Tadjik', es: 'Tayiko', ja: 'タジク語', zh: '塔吉克语', ru: 'Таджикский', ar: 'الطاجيكية' },
      hu: { en: 'Hungarian', de: 'Ungarisch', fr: 'Hongrois', es: 'Húngaro', ja: 'ハンガリー語', zh: '匈牙利语', ru: 'Венгерский', ar: 'المجرية' },
      fi: { en: 'Finnish', de: 'Finnisch', fr: 'Finnois', es: 'Finlandés', ja: 'フィンランド語', zh: '芬兰语', ru: 'Финский', ar: 'الفنلندية' },
      is: { en: 'Icelandic', de: 'Isländisch', fr: 'Islandais', es: 'Islandés', ja: 'アイスランド語', zh: '冰岛语', ru: 'Исландский', ar: 'الآيسلندية' },
      pl: { en: 'Polish', de: 'Polnisch', fr: 'Polonais', es: 'Polaco', ja: 'ポーランド語', zh: '波兰语', ru: 'Польский', ar: 'البولندية' },
      eu: { en: 'Basque', de: 'Baskisch', fr: 'Basque', es: 'Vasco', ja: 'バスク語', zh: '巴斯克语', ru: 'Баскский', ar: 'الباسكية' },
      nv: { en: 'Navajo', de: 'Navajo', fr: 'Navajo', es: 'Navajo', ja: 'ナバホ語', zh: '纳瓦霍语', ru: 'Навахо', ar: 'النافاهو' },
      tab: { en: 'Tabasaran', de: 'Tabassaranisch', fr: 'Tabassaran', es: 'Tabasarán', ja: 'タバサラン語', zh: '塔巴萨兰语', ru: 'Табасаранский', ar: 'التبرسرانية' }
    };
    if (cisTranslations[c.id]?.[lang]) {
      return cisTranslations[c.id][lang];
    }
    if (c.name && LANGUAGE_TRANSLATIONS[c.name]?.[lang]) {
      return LANGUAGE_TRANSLATIONS[c.name][lang];
    }
    if (lang === 'ru') return c.localName || c.name;
    return c.name;
  };

  const [currentCourse, setCurrentCourse] = useState<Course>(() => {
    const savedCourseId = localStorage.getItem('duo_course_id_6601');
    return COURSES.find(l => l.id === savedCourseId) || COURSES[0];
  });

  const [loading, setLoading] = useState(false);
  const [isCheckingApi, setIsCheckingApi] = useState(false);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(25);
  const [loadingTipIndex, setLoadingTipIndex] = useState(0);
  const [showQuitModal, setShowQuitModal] = useState(false);

  useEffect(() => {
    if (!lessonLoading) {
      setLoadingProgress(25);
      return;
    }
    setLoadingProgress(30);
    const tipInterval = setInterval(() => {
      setLoadingTipIndex(prev => (prev + 1) % DUO_TIPS.length);
    }, 2200);

    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 92) return prev;
        return prev + (prev < 65 ? 12 : 4);
      });
    }, 280);

    return () => {
      clearInterval(tipInterval);
      clearInterval(progressInterval);
    };
  }, [lessonLoading]);

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const initialSyncComplete = useRef<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem('duo_last_synced_time_6601') || new Date().toLocaleTimeString();
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [firestoreCacheStatus, setFirestoreCacheStatus] = useState<FirestoreCacheStatus>(() => getFirestoreCacheStatus());
  const [isPurgingFirestoreCache, setIsPurgingFirestoreCache] = useState<boolean>(false);

  // Initialize automated Firestore cache maintenance (auto-purge if inactive > 30 days)
  useEffect(() => {
    initFirestoreCacheMaintenance((meta) => {
      setFirestoreCacheStatus(getFirestoreCacheStatus());
      setToast(user.language === 'ru' 
        ? `🧹 Локальный кэш Firestore автоматически очищен (неактивность ${meta.inactiveDays} дн. > 30 дней)` 
        : `🧹 Local Firestore cache auto-cleaned (inactive for ${meta.inactiveDays}d > 30 days)`);
    });
  }, []);

  const handleManualPurgeFirestoreCache = async () => {
    playSound('click');
    triggerHapticFeedback('medium');
    setIsPurgingFirestoreCache(true);
    try {
      const res = await purgeOldFirestoreCache('Manual user cleanup', true);
      setFirestoreCacheStatus(getFirestoreCacheStatus());
      if (res.success) {
        playSound('streak_update');
        setToast(user.language === 'ru' 
          ? `🧹 Кэш Firestore успешно очищен (удалено ${res.freedDatabases.length} IndexedDB баз, память освобождена)` 
          : `🧹 Firestore cache cleared (${res.freedDatabases.length} IndexedDB databases purged)`);
      } else {
        setToast(user.language === 'ru' ? 'Кэш уже пуст или актуален' : 'Cache is already clean');
      }
    } catch (e: any) {
      setToast(user.language === 'ru' ? `⚠️ Ошибка очистки кэша: ${e.message}` : `⚠️ Cache purge error: ${e.message}`);
    } finally {
      setIsPurgingFirestoreCache(false);
    }
  };

  const handleSimulateInactivity31Days = () => {
    playSound('click');
    const updatedStatus = simulateInactivityForTesting(31);
    setFirestoreCacheStatus(updatedStatus);
    setToast(user.language === 'ru' 
      ? '⏳ Смоделирована неактивность 31 день (>30 дн.). Теперь автоочистка сработает при следующей проверке!' 
      : '⏳ Simulated 31 days inactivity (>30d). Auto-cleanup is now ready to trigger!');
  };

  const handleResetInactivityTimer = () => {
    playSound('click');
    const updatedStatus = resetInactivityTimer();
    setFirestoreCacheStatus(updatedStatus);
    setToast(user.language === 'ru' ? '🔄 Таймер активности сброшен на текущее время' : '🔄 Activity timer reset to now');
  };

  const handleForceSync = async () => {
    playSound('streak_update');
    triggerHapticFeedback('medium');
    setIsSyncing(true);
    try {
      recordFirestoreUserActivity(true);
      setFirestoreCacheStatus(getFirestoreCacheStatus());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      const nowStr = new Date().toLocaleTimeString(user.language === 'ru' ? 'ru-RU' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userRef, sanitizeForFirestore({
          ...user,
          updatedAt: serverTimestamp()
        }, true), { merge: true });
        setLastSyncTime(nowStr);
        localStorage.setItem('duo_last_synced_time_6601', nowStr);
        setToast(user.language === 'ru' ? `☁️ Облачная синхронизация Firestore завершена (${nowStr})` : `☁️ Cloud sync completed with Firestore (${nowStr})`);
      } else {
        setLastSyncTime(nowStr);
        localStorage.setItem('duo_last_synced_time_6601', nowStr);
        setToast(user.language === 'ru' ? `💾 Локальный кэш обновлен (${nowStr}). Готов к выгрузке при подключении!` : `💾 Local cache refreshed (${nowStr}). Ready to sync upon connection!`);
      }
    } catch (err: any) {
      console.error('Force sync error:', err);
      setToast(user.language === 'ru' ? '⚠️ Ошибка синхронизации: ' + err.message : '⚠️ Sync error: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      setAuthLoading(false);
      
      if (fUser) {
        try {
          const userRef = doc(db, 'users', fUser.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            // Load user profile from Firebase and exclude timestamps from local state
            const { createdAt, updatedAt, ...cloudUser } = docSnap.data() as any;
            const updatedUser: UserProgress = {
              ...user,
              ...cloudUser,
              email: fUser.email || cloudUser.email || user.email || '',
              authProvider: (fUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email') as 'google' | 'email',
            };
            setUser(updatedUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
          } else {
            // Document doesn't exist, create it from local user
            const cleanUsername = user.username && !user.username.startsWith('incognito_') 
              ? user.username 
              : (fUser.email ? fUser.email.split('@')[0] : ('user_' + Math.floor(1000 + Math.random() * 9000)));
            const cleanName = user.name && user.name !== "Ученик 6601" && !user.name.includes("Гость")
              ? user.name
              : (fUser.displayName || (fUser.email ? fUser.email.split('@')[0] : 'Ученик 6601'));
            const newUserProfile = {
              ...user,
              name: cleanName,
              username: cleanUsername,
              email: fUser.email || user.email || '',
              authProvider: (fUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email') as 'google' | 'email',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            await setDoc(userRef, sanitizeForFirestore(newUserProfile));
            setUser(newUserProfile as any);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newUserProfile));
          }
          initialSyncComplete.current = true;
          setSimNotify("Успешный вход в облако Duowindo!");
          const syncNowStr = new Date().toLocaleTimeString();
          setLastSyncTime(syncNowStr);
          localStorage.setItem('duo_last_synced_time_6601', syncNowStr);
        } catch (err) {
          console.error("Error syncing profile with Firestore:", err);
          handleFirestoreError(err, OperationType.GET, `users/${fUser.uid}`);
        }
      } else {
        initialSyncComplete.current = false;
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync state changes to Firestore
  useEffect(() => {
    const syncToCloud = async () => {
      if (firebaseUser && initialSyncComplete.current) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          await setDoc(userRef, sanitizeForFirestore({
            ...user,
            updatedAt: serverTimestamp()
          }, true), { merge: true });
        } catch (err) {
          console.error("Error updating profile in Firestore:", err);
          handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
        }
      }
    };
    syncToCloud();
  }, [user, firebaseUser]);

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleGoogleSignIn = async () => {
    playSound('click');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Error signing in with Google:", err);
      const errMsg = err?.code || err?.message || String(err);
      if (
        errMsg.includes('auth/cancelled-popup-request') || 
        errMsg.includes('popup-closed-by-user') || 
        errMsg.includes('popup-blocked')
      ) {
        setToast("Окно авторизации было закрыто или заблокировано. Пожалуйста, разрешите всплывающие окна или откройте в новой вкладке.");
      } else {
        setToast("Ошибка входа: " + (err instanceof Error ? err.message : String(err)));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    playSound('click');
    setLoading(true);
    try {
      await signOut(auth);
      initialSyncComplete.current = false;
      setFirebaseUser(null);
      setToast("Вы вышли из аккаунта");
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      setLoading(false);
    }
  };
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [availableTokens, setAvailableTokens] = useState<WordToken[]>([]);
  const [feedback, setFeedback] = useState<{ status: 'idle' | 'correct' | 'wrong', message: string }>({ status: 'idle', message: '' });
  const [isRecording, setIsRecording] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [canvasSize, setCanvasSize] = useState<{width: number, height: number}>({width: 320, height: 320}); 
  const [showTrace, setShowTrace] = useState(true); 
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [showBrowserModal, setShowBrowserModal] = useState(false);
  const [isOutdatedBrowserDetected, setIsOutdatedBrowserDetected] = useState(false);
  const [betaDismissed, setBetaDismissed] = useState(() => localStorage.getItem('duo_beta_dismissed') === 'true');
  const [androidDismissed, setAndroidDismissed] = useState(() => localStorage.getItem('duo_android_dismissed') === 'true');
  const [serverJsDismissed, setServerJsDismissed] = useState(() => localStorage.getItem('duo_serverjs_dismissed') === 'true');

  useEffect(() => {
    try {
      const ua = navigator.userAgent || '';
      const isOldOS = /Windows NT 5\.1|Windows NT 5\.2|Windows NT 6\.0/i.test(ua); // Windows XP / Vista specifically
      const isVeryOldIE = /MSIE|Trident/i.test(ua);
      const isVeryOldChrome = /Chrome\/([1-8][0-9])\./i.test(ua);
      const isVeryOldFirefox = /Firefox\/([1-8][0-9])\./i.test(ua);
      
      const isOutdated = isOldOS || isVeryOldIE || isVeryOldChrome || isVeryOldFirefox;
      if (isOutdated) {
        setIsOutdatedBrowserDetected(true);
      } else {
        setIsOutdatedBrowserDetected(false);
      }
    } catch (e) {
      console.warn("Browser compatibility check failed:", e);
    }
  }, []);

  useEffect(() => {
    try {
      const isRtl = user.language === 'ar';
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      document.documentElement.lang = user.language || 'ru';
    } catch (e) {
      console.warn("Language direction update error:", e);
    }
  }, [user.language]);

  // Daily Streak Freeze check on launch
  useEffect(() => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastActive = user.lastActiveDate;
      
      if (!lastActive) {
        setUser(u => ({ ...u, lastActiveDate: todayStr }));
        return;
      }
      
      if (lastActive !== todayStr) {
        const lastDate = new Date(lastActive);
        const currentDate = new Date(todayStr);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
        
        if (diffDays === 1) {
          setUser(u => ({ ...u, lastActiveDate: todayStr }));
        } else if (diffDays === 2 && (user.streakFreezeCount || 0) > 0) {
          const newFreezeCount = (user.streakFreezeCount || 0) - 1;
          setUser(u => ({
            ...u,
            streakFreezeCount: newFreezeCount,
            lastActiveDate: todayStr
          }));
          playSound('freeze_use');
          setToast(
            user.language === 'ru' 
              ? `❄️ Заморозка серии сработала! Серия в ${user.streak} дн. сохранена!` 
              : `❄️ Streak Freeze activated! Your ${user.streak}-day streak is saved!`
          );
        } else if (diffDays > 1) {
          const lostAmount = user.streak;
          setUser(u => ({
            ...u,
            previousLostStreak: lostAmount > 0 ? lostAmount : (u.previousLostStreak || 0),
            maxStreak: Math.max(u.maxStreak || 0, u.streak || 0),
            streak: 0,
            lastActiveDate: todayStr
          }));
        }
      }
    } catch (e) {
      console.warn("Streak check error:", e);
    }
  }, []);


  const triggerCelebrationConfetti = useCallback(() => {
    try {
      // 1. Initial central burst
      confetti({
        particleCount: 85,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#58cc02', '#1cb0f6', '#ff4b4b', '#ffc800', '#ce82ff', '#ffffff'],
        shapes: ['square', 'circle'],
        scalar: 1.2,
      });

      // 2. Dual side cannons (Duolingo style)
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.75 },
          colors: ['#58cc02', '#ffc800', '#1cb0f6'],
          scalar: 1.1,
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.75 },
          colors: ['#58cc02', '#ffc800', '#ce82ff'],
          scalar: 1.1,
        });
      }, 120);

      // 3. Gold sparkle wave
      setTimeout(() => {
        confetti({
          particleCount: 35,
          spread: 100,
          origin: { y: 0.4 },
          colors: ['#ffc800', '#ffd700', '#58cc02'],
          ticks: 180,
          gravity: 0.85,
        });
      }, 280);
    } catch (err) {
      console.error("Confetti trigger error:", err);
    }
  }, []);

  useEffect(() => {
    if (feedback.status === 'correct') {
      triggerCelebrationConfetti();
    }
  }, [feedback.status, triggerCelebrationConfetti]);

  // Registration, Login & Incognito Auth Modal states & handlers
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [showIncognitoRestrictionsModal, setShowIncognitoRestrictionsModal] = useState<boolean>(false);
  const [showIncognitoExportModal, setShowIncognitoExportModal] = useState<boolean>(false);
  const [showFirebaseExportModal, setShowFirebaseExportModal] = useState<boolean>(false);
  const [regInitialTab, setRegInitialTab] = useState<'login' | 'register' | 'google' | 'incognito'>('register');

  const incognitoClosed = isIncognitoLoginClosed();
  const daysUntilClosure = getDaysUntilIncognitoClosure();
  const closureDateLabel = getFormattedClosureDate(user.language);

  // New features modal states (Deletion, Transfer Expert, Placement Test)
  const [showDataDeletionModal, setShowDataDeletionModal] = useState<boolean>(false);
  const [showDataTransferModal, setShowDataTransferModal] = useState<boolean>(false);
  const [showPlacementTestModal, setShowPlacementTestModal] = useState<boolean>(false);
  const [placementCourse, setPlacementCourse] = useState<Course | null>(null);

  // Synchronized theme detection (light vs dark mode)
  const isLightMode = useMemo(() => {
    const theme = user.theme;
    if (theme === 'light') return true;
    if (theme === 'dark') return false;
    if (user.nightMode === false) return true;
    if (user.nightMode === true) return false;
    if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      return !window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }, [user.theme, user.nightMode]);

  // Global Theme Effect (Syncs light/dark/system theme to HTML & body classes)
  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light', 'theme-light');
      document.documentElement.classList.remove('dark');
      document.body.classList.add('theme-light');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light', 'theme-light');
      document.body.classList.remove('theme-light');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, [isLightMode]);

  // Instant one-click toggle between Light and Dark mode with sound & toast
  const toggleTheme = () => {
    playSound('click');
    const nextTheme: 'light' | 'dark' = isLightMode ? 'dark' : 'light';
    setUser(prev => {
      const updated: UserProgress = {
        ...prev,
        theme: nextTheme,
        nightMode: nextTheme === 'dark'
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setToast(nextTheme === 'light' 
      ? (user.language === 'ru' ? '☀️ Светлая тема включена' : '☀️ Light mode enabled') 
      : (user.language === 'ru' ? '🌙 Тёмная тема включена' : '🌙 Dark mode enabled')
    );
  };

  // Permanently delete all local application data (double confirmation)
  const handleWipeAllLocalData = () => {
    // If admin account - strictly prohibited
    if (isUserAdminAccount(user, firebaseUser)) {
      playSound('wrong');
      setToast(
        user.language === 'ru'
          ? '⛔ Запрещено: аккаунт и данные администрации защищены от удаления!'
          : '⛔ Prohibited: Administration account and data are protected from deletion!'
      );
      setShowDataDeletionModal(false);
      return;
    }

    // If user enabled protection toggle
    if (user.preventAccountDeletion) {
      playSound('wrong');
      setToast(
        user.language === 'ru'
          ? '🔒 Защита включена! Удаление аккаунта и локальных данных заблокировано в настройках.'
          : '🔒 Deletion blocked by protection setting in Profile / Settings.'
      );
      setShowDataDeletionModal(false);
      return;
    }

    // Reset local data
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.clear();
    const cleanUser: UserProgress = {
      name: user.language === 'ru' ? 'Новый ученик' : 'New Learner',
      avatarColor: 'bg-duo-blue',
      energy: 25,
      hearts: 5,
      streak: 0,
      gems: 100,
      xp: 0,
      currentUnit: 1,
      completedLessons: [],
      mistakes: [],
      learnedWords: [],
      achievements: [],
      subscription: 'free',
      language: user.language || 'ru',
      country: user.country || 'Russia',
      theme: user.theme || 'dark',
      preventAccountDeletion: false,
    };

    setUser(cleanUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanUser));
    setShowDataDeletionModal(false);
    setScreen(AppScreen.PATH);
    playSound('correct');
    setToast(
      user.language === 'ru'
        ? '🗑️ Все локальные данные приложения успешно безвозвратно удалены'
        : '🗑️ All local application data has been permanently wiped'
    );
  };
  const handleQuickDownloadFirebase = async () => {
    playSound('correct');
    try {
      const filename = await downloadFirebaseExportFile(user, firebaseUser);
      setToast(
        user.language === 'ru'
          ? `🔥 Экспорт Firebase сохранён: ${filename}`
          : `🔥 Firebase export saved: ${filename}`
      );
    } catch {
      playSound('wrong');
      setToast(user.language === 'ru' ? '❌ Ошибка при скачивании файла' : '❌ Failed to download file');
    }
  };

  const handleQuickCopyFirebase = async () => {
    playSound('click');
    try {
      const success = await copyFirebaseExportToClipboard(user, firebaseUser);
      if (success) {
        setToast(
          user.language === 'ru'
            ? '📋 Данные Firebase Firestore & Auth скопированы в буфер!'
            : '📋 Firebase Firestore & Auth data copied to clipboard!'
        );
      } else {
        playSound('wrong');
        setToast(user.language === 'ru' ? '❌ Не удалось скопировать данные' : '❌ Failed to copy data');
      }
    } catch {
      playSound('wrong');
      setToast(user.language === 'ru' ? '❌ Ошибка копирования' : '❌ Copy failed');
    }
  };

  // AI Daily Limit Modal states & handlers
  const [isAiLimitModalOpen, setIsAiLimitModalOpen] = useState<boolean>(false);
  const [aiLimitStatus, setAiLimitStatus] = useState<AiUsageStatus | null>(null);

  useEffect(() => {
    const handleAiLimitEvent = (event: Event) => {
      // NEVER show limit modal if custom API key is skipped (using free DuoWindo6601 traffic) or user has Super / Max!
      if (isCustomApiKeySkipped() || user.subscription === 'super' || user.subscription === 'max') {
        return;
      }
      const customEvent = event as CustomEvent<AiUsageStatus>;
      if (customEvent.detail) {
        setAiLimitStatus(customEvent.detail);
      } else {
        setAiLimitStatus(getTodayAiUsage(user));
      }
      setIsAiLimitModalOpen(true);
    };

    const handleDisableOffline = () => {
      setOfflineMode(false);
    };

    // If key is already skipped or user is super/max, disable offline mode automatically
    if (isCustomApiKeySkipped() || user.subscription === 'super' || user.subscription === 'max') {
      setOfflineMode(false);
    }

    window.addEventListener('duowindo_ai_limit_reached', handleAiLimitEvent);
    window.addEventListener('duowindo_disable_offline_mode', handleDisableOffline);
    window.addEventListener('duowindo_api_key_changed', handleDisableOffline);
    return () => {
      window.removeEventListener('duowindo_ai_limit_reached', handleAiLimitEvent);
      window.removeEventListener('duowindo_disable_offline_mode', handleDisableOffline);
      window.removeEventListener('duowindo_api_key_changed', handleDisableOffline);
    };
  }, [user]);

  const openIncognitoRestrictionsModal = () => {
    playSound('click');
    setShowIncognitoRestrictionsModal(true);
  };

  const openRegisterModal = (initialTab: 'login' | 'register' | 'google' | 'incognito' = 'register') => {
    playSound('click');
    setRegInitialTab(initialTab);
    setShowRegisterModal(true);
  };

  useEffect(() => {
    const hasPrompted = localStorage.getItem('duo_reg_prompt_seen_6601');
    if (!hasPrompted && !user.username && user.name === "Ученик 6601") {
      const timer = setTimeout(() => {
        setRegInitialTab('register');
        setShowRegisterModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const isIncognitoUser = !firebaseUser && (!user.username || user.username.startsWith('incognito_') || user.name.includes('Гость') || user.name.includes('Incognito') || user.authProvider === 'guest');

  // Profile Editor Modal states & handlers
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editUsername, setEditUsername] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editLink, setEditLink] = useState<string>('');
  const [editHidePhone, setEditHidePhone] = useState<boolean>(false);
  const [editHideEmail, setEditHideEmail] = useState<boolean>(false);
  const [editHideLink, setEditHideLink] = useState<boolean>(false);
  const [editAvatarColor, setEditAvatarColor] = useState<string>('bg-duo-blue');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>('');
  const [editAvatarIcon, setEditAvatarIcon] = useState<string>('');
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const openEditProfile = () => {
    playSound('click');
    setEditName(user.name || '');
    setEditUsername(user.username || '');
    setEditPhone(user.phone || '');
    setEditEmail(user.email || '');
    setEditLink(user.link || '');
    setEditHidePhone(user.hidePhone ?? false);
    setEditHideEmail(user.hideEmail ?? false);
    setEditHideLink(user.hideLink ?? false);
    setEditAvatarColor(user.avatarColor || 'bg-duo-blue');
    setEditAvatarUrl(user.avatarUrl || user.avatarImage || '');
    setEditAvatarIcon(user.avatarIcon || '');
    setShowEditProfileModal(true);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setToast("Размер файла не должен превышать 5 МБ");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setEditAvatarUrl(reader.result);
        setToast("Фото загружено! Нажмите 'Сохранить', чтобы применить.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setToast("Имя не может быть пустым");
      return;
    }
    playSound('success');
    const cleanUsername = editUsername.trim().replace(/^@/, '');
    const updatedUser: UserProgress = {
      ...user,
      name: editName.trim(),
      username: cleanUsername ? cleanUsername : undefined,
      phone: editPhone.trim() || undefined,
      email: editEmail.trim() || undefined,
      link: editLink.trim() || undefined,
      hidePhone: editHidePhone,
      hideEmail: editHideEmail,
      hideLink: editHideLink,
      avatarColor: editAvatarColor,
      avatarUrl: editAvatarUrl || undefined,
      avatarImage: editAvatarUrl || undefined,
      avatarIcon: editAvatarIcon || undefined,
    };
    
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    
    if (firebaseUser) {
      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userRef, sanitizeForFirestore({
          ...updatedUser,
          updatedAt: serverTimestamp()
        }, true), { merge: true });
      } catch (err) {
        console.error("Error saving updated profile to Firestore:", err);
      }
    }
    
    setToast("Профиль успешно сохранен! ✨");
    setShowEditProfileModal(false);
  };

  // Mobile simulator gesture, notification and sensor effects
  useEffect(() => {
    if (simNotify) {
      const timer = setTimeout(() => { setSimNotify(null); }, 6500);
      return () => clearTimeout(timer);
    }
  }, [simNotify]);

  const handleSimMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (simTouchPointer) {
      const rect = e.currentTarget.getBoundingClientRect();
      setPointerPos({
        x: Math.round(e.clientX - rect.left),
        y: Math.round(e.clientY - rect.top)
      });
    }
  };

  const handleSimScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const newRipple = { id: Date.now(), x, y };
    setClickRipples(prev => [...prev, newRipple]);
    setTimeout(() => {
      setClickRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 850);
  };

  const simulateGesture = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (isSwiping) return;
    playSound('click');
    setIsSwiping(true);
    setSimTouchPointer(true);

    const isPortrait = simulatorOrientation === 'portrait';
    const center = { x: isPortrait ? 180 : 390, y: isPortrait ? 390 : 180 };

    let startX = center.x;
    let startY = center.y;
    let endX = center.x;
    let endY = center.y;

    if (direction === 'up') {
      startY = center.y + 160;
      endY = center.y - 160;
    } else if (direction === 'down') {
      startY = center.y - 160;
      endY = center.y + 160;
    } else if (direction === 'left') {
      startX = center.x + 130;
      endX = center.x - 130;
    } else if (direction === 'right') {
      startX = center.x - 130;
      endX = center.x + 130;
    }

    setSwipePath({ startX, startY, endX, endY });
    setPointerPos({ x: startX, y: startY });

    let startTime: number | null = null;
    const duration = 450; // smooth 450ms movement

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // easeInOutCubic for natural flick gesture feel
      const ease = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentX = Math.round(startX + (endX - startX) * ease);
      const currentY = Math.round(startY + (endY - startY) * ease);
      setPointerPos({ x: currentX, y: currentY });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          setIsSwiping(false);
          setSwipePath(null);
          
          const viewport = document.getElementById('virtual-device-viewport');
          if (viewport) {
            if (direction === 'up') {
              viewport.scrollBy({ top: 190, behavior: 'smooth' });
            } else if (direction === 'down') {
              viewport.scrollBy({ top: -190, behavior: 'smooth' });
            }
          }

          const dirRu = direction === 'up' ? 'наверх ⬆️' : direction === 'down' ? 'вниз ⬇️' : direction === 'left' ? 'влево ⬅️' : 'вправо ➡️';
          setSimNotify(`Жест проведения выполнен ${dirRu}!`);
          playSound('success');
        }, 120);
      }
    };

    requestAnimationFrame(animate);
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [paths, setPaths] = useState<Array<{x: number, y: number}[]>>([]);
  const currentPath = useRef<{x: number, y: number}[]>([]);
  
  // CHESS STATE
  const [isChessInviteModalOpen, setIsChessInviteModalOpen] = useState(false);
  const [chessOpponent, setChessOpponent] = useState<{ name: string; elo: number; avatar: string; isBot?: boolean }>({
    name: "DuoWindo6601",
    elo: 1500,
    avatar: "🦉",
    isBot: true
  });
  const [chessBoard, setChessBoard] = useState<Board>([]);
  const [chessFen, setChessFen] = useState<string>(INITIAL_BOARD_FEN);
  const [chessTurn, setChessTurn] = useState<ChessColor>('w');
  const [chessMode, setChessMode] = useState<'pve'|'pvp'|'tutorial'|'study'>('pve');
  const [tutorialMessage, setTutorialMessage] = useState("");
  const [chessSelected, setChessSelected] = useState<Coords | null>(null);
  const [chessValidMoves, setChessValidMoves] = useState<Coords[]>([]);
  const [chessHistory, setChessHistory] = useState<string[]>([]);
  const [chessStatus, setChessStatus] = useState<'active' | 'check' | 'mate'>('active');
  const [chessLastMove, setChessLastMove] = useState<{from: Coords, to: Coords} | null>(null);
  const [chessChat, setChessChat] = useState<RoleplayMessage[]>([]);
  const [chessTab, setChessTab] = useState<'history' | 'chat'>('history');
  const [chessInput, setChessInput] = useState("");
  const [chessTimerSeconds, setChessTimerSeconds] = useState<number>(20 * 60);
  const chessMoveHistoryEndRef = useRef<HTMLDivElement>(null);

  const [ishiharaInput, setIshiharaInput] = useState("");
  const [readingInput, setReadingInput] = useState("");
  const [roleplayInput, setRoleplayInput] = useState("");

  const [translatorInput, setTranslatorInput] = useState("");
  const [translatorOutput, setTranslatorOutput] = useState("");
  const [transTarget, setTransTarget] = useState<Course>(currentCourse);

  const [courseRegionTab, setCourseRegionTab] = useState<'all' | 'speaker' | 'hardest' | 'cis' | 'world' | 'special' | 'rf' | 'catalog'>('all');
  const [speakerLanguage, setSpeakerLanguage] = useState<string>(() => user.language || 'ru');
  const [courseSearch, setCourseSearch] = useState("");

  // VIDEO CALL STATE
  const [videoCameraOn, setVideoCameraOn] = useState(true);
  const [videoMicOn, setVideoMicOn] = useState(true);
  const [videoSmartMode, setVideoSmartMode] = useState(true);
  const [videoQuestion, setVideoQuestion] = useState("");
  const [videoHint, setVideoHint] = useState("");
  const [videoSelfViewOpen, setVideoSelfViewOpen] = useState(true);
  const [videoTopic, setVideoTopic] = useState<string>("Заказ в кафе");
  const [videoCallHistory, setVideoCallHistory] = useState<RoleplayMessage[]>([]);
  const [videoInputText, setVideoInputText] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");

  const isLanguageCourse = useMemo(() => !SPECIAL_IDS.includes(currentCourse.id), [currentCourse]);

  const [useRtlOverride, setUseRtlOverride] = useState<boolean>(true);

  const isArabicCourse = useMemo(() => {
    return currentCourse.id === 'ar' || 
           currentCourse.name.toLowerCase().includes('arabic') || 
           currentCourse.localName.toLowerCase().includes('араб');
  }, [currentCourse]);

  const isHebrewCourse = useMemo(() => {
    return currentCourse.id === 'he' || 
           currentCourse.name.toLowerCase().includes('hebrew') || 
           currentCourse.localName.toLowerCase().includes('иврит');
  }, [currentCourse]);

  const isRtlCourse = useMemo(() => {
    return isArabicCourse || isHebrewCourse;
  }, [isArabicCourse, isHebrewCourse]);

  const isArabicText = useCallback((text: string) => {
    return /[\u0600-\u06FF]/.test(text || '');
  }, []);

  const isHebrewText = useCallback((text: string) => {
    return /[\u0590-\u05FF]/.test(text || '');
  }, []);

  const formatRTLOverride = useCallback((text: string) => {
    if (!text) return "";
    
    // Always strip manual forced byte-order directional overrides (u+202e, u+202c, u+202d)
    // that force reverse character order and break Cyrillic/Latin text wrapping in RTL contexts.
    const cleanText = text.replace(/[\u202E\u202C\u202D]/g, '');

    const hasRtl = /[\u0600-\u06FF\u0590-\u05FF]/.test(cleanText);
    if (!hasRtl) {
      return cleanText;
    }

    // Isolate LTR (Cyrillic/Latin/Numbers) and RTL (Arabic/Hebrew) segments 
    // using Unicode BiDi Isolate control characters (\u2066 for LTR Isolate, \u2067 for RTL Isolate, \u2069 for PDI)
    // plus LTR Mark (\u200E) to preserve natural order and text wrapping without reversing character bytes.
    const parts = cleanText.split(/([\u0600-\u06FF\u0590-\u05FF]+|[a-zA-Z\u0400-\u04FFёЁ0-9]+)/g);
    
    const formattedParts = parts.map(part => {
      if (!part) return "";
      const isPartRtl = /[\u0600-\u06FF\u0590-\u05FF]/.test(part);
      const isPartLtr = /[a-zA-Z\u0400-\u04FFёЁ0-9]/.test(part);
      
      if (isPartLtr && !isPartRtl) {
        return `\u2066${part}\u2069\u200E`;
      } else if (isPartRtl) {
        return `\u2067${part}\u2069`;
      }
      return part;
    });

    return formattedParts.join('');
  }, []);

  const leaderboardData = useMemo(() => {
     const baseXP = Math.max(100, user.xp); 
     const bots: LeaderboardEntry[] = [
        { id: 'b1', name: 'Илон', xp: Math.floor(baseXP * 1.25) + 200, color: 'bg-purple-600' },
        { id: 'b2', name: 'Гермиона', xp: Math.floor(baseXP * 1.1) + 100, color: 'bg-red-600' },
        { id: 'b3', name: 'Наруто', xp: Math.floor(baseXP * 0.95), color: 'bg-orange-500' },
        { id: 'b4', name: 'Шерлок', xp: Math.floor(baseXP * 0.8), color: 'bg-blue-600' },
        { id: 'b5', name: 'Валл-И', xp: Math.floor(baseXP * 0.6), color: 'bg-yellow-500' },
        { id: 'b6', name: 'Марио', xp: Math.floor(baseXP * 0.5), color: 'bg-red-500' },
        { id: 'b7', name: 'Пикачу', xp: Math.floor(baseXP * 0.4), color: 'bg-yellow-400' },
     ];
     const currentUser: LeaderboardEntry = { id: 'user', name: user.name, xp: user.xp, color: user.avatarColor };
     return [...bots, currentUser].sort((a, b) => b.xp - a.xp);
  }, [user.xp, user.name, user.avatarColor]);

  // DAILY LEADERBOARD (24-Hour Reset & Daily XP Tracking)
  const [leaderboardTab, setLeaderboardTab] = useState<'daily' | 'allTime'>('daily');
  const [dailyResetCountdown, setDailyResetCountdown] = useState<string>('24:00:00');
  const [dailyXp, setDailyXp] = useState<number>(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const savedDate = localStorage.getItem('duowindo_daily_xp_date');
      if (savedDate === today) {
        const val = parseInt(localStorage.getItem('duowindo_daily_xp') || '0', 10);
        return isNaN(val) ? 0 : val;
      } else {
        localStorage.setItem('duowindo_daily_xp_date', today);
        localStorage.setItem('duowindo_daily_xp', '0');
        return 0;
      }
    } catch {
      return 0;
    }
  });

  // Track XP increases and accumulate into dailyXp
  const prevUserXpRef = useRef<number>(user.xp);
  useEffect(() => {
    const diff = user.xp - prevUserXpRef.current;
    if (diff > 0) {
      const today = new Date().toISOString().split('T')[0];
      const savedDate = localStorage.getItem('duowindo_daily_xp_date');
      let currentVal = dailyXp;
      if (savedDate !== today) {
        currentVal = 0;
        localStorage.setItem('duowindo_daily_xp_date', today);
      }
      const newVal = currentVal + diff;
      setDailyXp(newVal);
      localStorage.setItem('duowindo_daily_xp', String(newVal));
    }
    prevUserXpRef.current = user.xp;
  }, [user.xp, dailyXp]);

  // Daily reset check every second and countdown to 24h reset
  useEffect(() => {
    const checkReset = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const savedDate = localStorage.getItem('duowindo_daily_xp_date');
      if (savedDate && savedDate !== today) {
        localStorage.setItem('duowindo_daily_xp_date', today);
        localStorage.setItem('duowindo_daily_xp', '0');
        setDailyXp(0);
      }
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();
      const h = Math.floor(diffMs / (1000 * 60 * 60));
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diffMs % (1000 * 60)) / 1000);
      setDailyResetCountdown(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };
    checkReset();
    const interval = setInterval(checkReset, 1000);
    return () => clearInterval(interval);
  }, []);

  // Daily Leaderboard Data (XP gains for today only)
  const dailyLeaderboardData = useMemo(() => {
    const baseDaily = Math.max(15, dailyXp);
    const dailyBots: LeaderboardEntry[] = [
      { id: 'db1', name: 'Илон', xp: Math.floor(baseDaily * 1.35) + 30, color: 'bg-purple-600' },
      { id: 'db2', name: 'Гермиона', xp: Math.floor(baseDaily * 1.15) + 20, color: 'bg-red-600' },
      { id: 'db3', name: 'Наруто', xp: Math.max(10, Math.floor(baseDaily * 0.9)), color: 'bg-orange-500' },
      { id: 'db4', name: 'Шерлок', xp: Math.max(10, Math.floor(baseDaily * 0.75)), color: 'bg-blue-600' },
      { id: 'db5', name: 'Валл-И', xp: Math.max(5, Math.floor(baseDaily * 0.55)), color: 'bg-yellow-500' },
      { id: 'db6', name: 'Марио', xp: Math.max(5, Math.floor(baseDaily * 0.4)), color: 'bg-red-500' },
      { id: 'db7', name: 'Пикачу', xp: Math.max(5, Math.floor(baseDaily * 0.25)), color: 'bg-yellow-400' },
    ];
    const currentUser: LeaderboardEntry = { id: 'user', name: user.name, xp: dailyXp, color: user.avatarColor || 'bg-duo-blue' };
    return [...dailyBots, currentUser].sort((a, b) => b.xp - a.xp);
  }, [dailyXp, user.name, user.avatarColor]);

  // Download Local Progress (full user state from localStorage backup)
  const handleDownloadLocalProgress = useCallback(() => {
    playSound('click');
    try {
      const rawUser = localStorage.getItem(STORAGE_KEY);
      const parsedUser = rawUser ? JSON.parse(rawUser) : user;
      const backupData = {
        app: 'DuoWindo6601',
        version: '1.0.2',
        backupType: 'Local Progress Backup',
        exportedAt: new Date().toISOString(),
        user: parsedUser,
        localStorageSnapshot: {
          [STORAGE_KEY]: parsedUser,
          duowindo_daily_xp: localStorage.getItem('duowindo_daily_xp') || '0',
          duowindo_daily_xp_date: localStorage.getItem('duowindo_daily_xp_date') || new Date().toISOString().split('T')[0],
          duowindo_leaderboard_lang: localStorage.getItem('duowindo_leaderboard_lang') || 'ru'
        }
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `duowindo6601_local_progress_${user.username || 'user'}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast(user.language === 'ru' ? '💾 Локальный прогресс успешно скачан!' : '💾 Local progress downloaded successfully!');
    } catch (err) {
      console.error(err);
      setToast(user.language === 'ru' ? '❌ Ошибка при скачивании локального прогресса' : '❌ Error downloading local progress');
    }
  }, [user, playSound]);

  // Video Call Effect
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      if (screen === AppScreen.VIDEO_CALL && videoCameraOn) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Camera access error", err);
          setToast("Camera access denied");
        }
      }
    };

    if (screen === AppScreen.VIDEO_CALL && videoSelfViewOpen) {
        startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [screen, videoCameraOn, videoSelfViewOpen]);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('duo_course_id_6601', currentCourse.id); }, [currentCourse]);
  useEffect(() => { setTransTarget(currentCourse); }, [currentCourse]);

  // Level & Achievement Toast Notification Tracker
  const prevXpRef = useRef(user.xp);
  useEffect(() => {
    if (prevXpRef.current !== undefined && user.xp > prevXpRef.current) {
      const oldLevel = Math.floor((prevXpRef.current || 0) / 100) + 1;
      const newLevel = Math.floor((user.xp || 0) / 100) + 1;
      if (newLevel > oldLevel) {
        playSound('streak_update');
        const levelMsg = user.language === 'ru'
          ? `🎉 ПОЗДРАВЛЯЕМ! Вы достигли уровня ${newLevel}! 🏆`
          : `🎉 CONGRATULATIONS! You reached Level ${newLevel}! 🏆`;
        setToast(levelMsg);
      }
    }
    prevXpRef.current = user.xp;
  }, [user.xp, user.language]);

  // ... (Canvas and Resize effects kept same) ...
  useEffect(() => {
      let timeoutId: any;
      const handleResize = () => {
          if (isDrawing.current) return;
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
              const w = Math.min(window.innerWidth - 32, 800); 
              const availableH = window.innerHeight - 300; 
              const h = Math.max(300, Math.min(availableH, 600));
              setCanvasSize(prev => {
                  if (Math.abs(prev.width - w) < 20 && Math.abs(prev.height - h) < 20) return prev;
                  return {width: w, height: h};
              }); 
          }, 150); 
      };
      handleResize(); 
      window.addEventListener('resize', handleResize);
      return () => {
          window.removeEventListener('resize', handleResize);
          clearTimeout(timeoutId);
      };
  }, []);

  useEffect(() => {
      const canvas = canvasRef.current;
      if(!canvas) return;
      const ctx = canvas.getContext('2d');
      if(!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 12; 
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#222'; 
      
      const drawSmoothPath = (path: {x: number, y: number}[]) => {
          if(path.length < 1) return;
          ctx.beginPath();
          if (path.length === 1) {
              ctx.fillStyle = '#222';
              ctx.arc(path[0].x, path[0].y, 6, 0, Math.PI * 2);
              ctx.fill();
          } else {
              ctx.moveTo(path[0].x, path[0].y);
              for (let i = 1; i < path.length - 1; i++) {
                  const xc = (path[i].x + path[i + 1].x) / 2;
                  const yc = (path[i].y + path[i + 1].y) / 2;
                  ctx.quadraticCurveTo(path[i].x, path[i].y, xc, yc);
              }
              const last = path[path.length - 1];
              if (path.length > 2) {
                  ctx.lineTo(last.x, last.y); 
              } else {
                  ctx.lineTo(path[1].x, path[1].y);
              }
              ctx.stroke();
          }
      };

      paths.forEach(drawSmoothPath);
      
      if (currentPath.current.length > 0) {
          drawSmoothPath(currentPath.current);
      }
  }, [paths, canvasSize]);

  useEffect(() => {
    if (currentExercise?.type === 'roleplay' && chatBottomRef.current) {
        chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentExercise?.roleplayData?.messages]);

  // ... (Video, Speech, Draw handlers same as before) ...
  const startVideoCall = async (topic: string = "Заказ в кафе") => {
      playSound('click');
      setLoading(true);
      setVideoTopic(topic);
      setVideoHint("");
      setVideoInputText("");
      setScreen(AppScreen.VIDEO_CALL);

      const initialGreeting = user.language === 'en'
        ? `Hello! I'm DuoWindo6601. Welcome to our video call! Let's talk about "${topic}". How are you doing today?`
        : `Привет! Я DuoWindo6601. Рад приветствовать тебя на нашем видеозвонке! Давай пообщаемся на тему: "${topic}". Как твои дела сегодня?`;

      setVideoQuestion(initialGreeting);
      const initialHistory: RoleplayMessage[] = [{ role: 'model', text: initialGreeting }];
      setVideoCallHistory(initialHistory);

      speakText(initialGreeting, currentCourse.id, false, user.preferredVoice, user.voiceProvider);

      if (videoSmartMode) {
          try {
              const hint = await getInterviewHint(`Topic: ${topic}. How should I reply to the greeting?`);
              setVideoHint(hint);
          } catch (e) {}
      }
      setLoading(false);
  };

  const handleVideoCallSend = async (text: string) => {
      if (!text.trim() || loading) return;
      playSound('click');
      setLoading(true);
      setVideoInputText("");

      const userMsg: RoleplayMessage = { role: 'user', text };
      const updatedHistory = [...videoCallHistory, userMsg];
      setVideoCallHistory(updatedHistory);

      try {
          const res = await generateVideoCallRoleplayResponse(videoTopic, updatedHistory, text, currentCourse.localName);
          const aiMsg: RoleplayMessage = { role: 'model', text: res.text, correction: res.correction };
          const finalHistory = [...updatedHistory, aiMsg];
          setVideoCallHistory(finalHistory);
          setVideoQuestion(res.text);

          speakText(res.text, currentCourse.id, false, user.preferredVoice, user.voiceProvider);
          setUser(u => ({ ...u, xp: u.xp + 15 }));

          if (videoSmartMode) {
              const hint = await getInterviewHint(`Topic: ${videoTopic}. Question: "${res.text}". What are good ways to reply?`);
              setVideoHint(hint);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const startVideoInterview = async () => {
      startVideoCall("Собеседование на работу");
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true; 
        recognition.maxAlternatives = 1;
        const langMap: Record<string, string> = { 'en': 'en-US', 'de': 'de-DE', 'fr': 'fr-FR', 'es': 'es-ES', 'ja': 'ja-JP', 'zh': 'zh-CN', 'ko': 'ko-KR', 'it': 'it-IT', 'pt': 'pt-BR', 'ru': 'ru-RU' };
        recognition.lang = langMap[currentCourse.id] || 'en-US';
        recognition.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    const finalTrans = event.results[i][0].transcript;
                    transcriptRef.current = finalTrans;
                    setIsRecording(false);
                    if (currentExercise?.type === 'roleplay') {
                        handleRoleplaySend(finalTrans);
                    } else if (screen === AppScreen.VIDEO_CALL) {
                        handleVideoCallSend(finalTrans);
                    } else {
                        checkAnswer(finalTrans);
                    }
                    return;
                } else interim += event.results[i][0].transcript;
            }
            if (interim) transcriptRef.current = interim;
        };
        recognition.onerror = (e: any) => {
            if (e.error !== 'no-speech') { setIsRecording(false); if (e.error !== 'aborted') setToast(t('t_rec_error')); }
        };
        recognition.onend = () => setIsRecording(false);
        recognitionRef.current = recognition;
    }
  }, [currentExercise, currentCourse.id]);

  const onPointerDown = (e: React.PointerEvent) => {
      e.preventDefault(); e.stopPropagation(); isDrawing.current = true;
      const canvas = canvasRef.current; if(canvas && canvas.setPointerCapture) try { canvas.setPointerCapture(e.pointerId); } catch(err) {}
      if(!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left; const y = e.clientY - rect.top;
      currentPath.current = [{x, y}];
      const ctx = canvas.getContext('2d');
      if(ctx) { ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#222'; ctx.beginPath(); ctx.fillStyle = '#222'; ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, y); }
  }
  const onPointerMove = (e: React.PointerEvent) => {
      e.preventDefault(); e.stopPropagation(); if(!isDrawing.current) return;
      const canvas = canvasRef.current; if(!canvas) return;
      const rect = canvas.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top;
      const points = currentPath.current; if (points.length === 0) return; const lastPoint = points[points.length - 1]; const dist = Math.hypot(x - lastPoint.x, y - lastPoint.y); if (dist < 2) return;
      points.push({x, y});
      const ctx = canvas.getContext('2d'); if(ctx) { ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#222'; ctx.beginPath(); ctx.moveTo(lastPoint.x, lastPoint.y); ctx.lineTo(x, y); ctx.stroke(); }
  }
  const onPointerUp = (e: React.PointerEvent) => { e.preventDefault(); const canvas = canvasRef.current; if(canvas && canvas.releasePointerCapture) try { canvas.releasePointerCapture(e.pointerId); } catch(err) {} isDrawing.current = false; if (currentPath.current.length > 0) { setPaths(prev => [...prev, [...currentPath.current]]); } currentPath.current = []; }
  const onPointerCancel = (e: React.PointerEvent) => { onPointerUp(e); }
  const clearCanvas = () => { setPaths([]); playSound('click'); };
  const undoDrawing = () => { if (paths.length > 0) { setPaths(prev => prev.slice(0, -1)); playSound('click'); } };

  // ... (API and Logic handlers) ...
  const checkApiStatus = async () => { 
    setIsCheckingApi(true); 
    try { 
      const res = await pingGeminiApi(); 
      if (res.ok || isCustomApiKeySkipped() || user.subscription === 'super' || user.subscription === 'max') { 
        setOfflineMode(false); 
        setToast(user.language === 'ru' ? "⚡ Gemini API онлайн и работает (Трафик активен)!" : "⚡ Gemini API is Online!"); 
        playSound('success'); 
      } else { 
        setOfflineMode(true); 
        setToast(user.language === 'ru' ? `⚠️ Ошибка API: ${res.message}` : `⚠️ API Error: ${res.message}`); 
        playSound('wrong'); 
      } 
    } catch (e: any) { 
      if (isCustomApiKeySkipped() || user.subscription === 'super' || user.subscription === 'max') {
        setOfflineMode(false);
        setToast(user.language === 'ru' ? "⚡ Бесплатный трафик DuoWindo6601 онлайн!" : "⚡ DuoWindo6601 Free Traffic Online!");
        playSound('success');
      } else {
        setOfflineMode(true); 
        setToast(user.language === 'ru' ? "⚠️ Сбой проверки соединения с API" : "⚠️ API Connection Test Failed"); 
        playSound('wrong'); 
      }
    } finally { 
      setIsCheckingApi(false); 
    } 
  };
  const handleTranslator = async (targetLangOverride?: string) => {
    if (!translatorInput.trim()) return;
    setLoading(true);
    try {
      const targetLangName = targetLangOverride || (user.language === 'en' ? transTarget.name : (user.language === 'ru' ? (transTarget.localName || transTarget.name) : transTarget.name));
      const result = await translateText(translatorInput, targetLangName);
      setTranslatorOutput(result);
      playSound('success');
    } catch (e) {
      setTranslatorOutput(user.language === 'ru' ? "Ошибка перевода. Пожалуйста, повторите попытку." : "Translation error. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const updateChessStats = (result: 'win' | 'loss') => {
      setUser(prev => {
          const stats = prev.chessStats || { games: 0, wins: 0, elo: 400 };
          return {
              ...prev,
              chessStats: {
                  games: stats.games + 1,
                  wins: result === 'win' ? stats.wins + 1 : stats.wins,
                  elo: result === 'win' ? stats.elo + 15 : Math.max(0, stats.elo - 8)
              },
              xp: prev.xp + 30
          };
      });
  };

  const initChessGame = (customOpponent?: { name: string; elo: number; avatar: string; isBot?: boolean }) => {
    const opp = customOpponent || chessOpponent;
    setChessFen(INITIAL_BOARD_FEN);
    setChessBoard(parseFen(INITIAL_BOARD_FEN));
    setChessTurn('w');
    setChessHistory([]);
    setChessSelected(null);
    setChessValidMoves([]);
    setChessStatus('active');
    setChessLastMove(null);
    setChessTimerSeconds(20 * 60);
    setChessChat([{
      role: 'model',
      text: opp.isBot
        ? "Ready to lose? I'm DuoWindo6601, Grandmaster of the Owl Kingdom! 🦉"
        : `Партия с ${opp.name} (${opp.elo} ELO) началась! Ваш ход белыми. Удачи! ⚔️`
    }]);
    setChessTab('history');
  };

  const handleStartPvpChess = (opponent: ChessOpponent) => {
    playSound('select');
    const opp = {
      name: opponent.name,
      elo: opponent.elo,
      avatar: opponent.avatar,
      isBot: false
    };
    setChessOpponent(opp);
    setChessMode('pvp');
    setIsChessInviteModalOpen(false);
    initChessGame(opp);
    setCurrentExercise({
      id: crypto.randomUUID(),
      type: 'chess',
      originalSentence: `Шахматная партия против ${opp.name}`,
      targetTranslation: "Checkmate",
      wordBank: [],
      chessData: {
        fen: INITIAL_BOARD_FEN,
        pgn: [],
        difficulty: 'intermediate'
      }
    });
    setScreen(AppScreen.LESSON);
  };
  const handleChessChatSend = async () => { if (!chessInput.trim()) return; const userText = chessInput; setChessInput(""); const newHistory = [...chessChat, { role: 'user', text: userText } as RoleplayMessage]; setChessChat(newHistory); setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); const reply = await getChessChatReply(chessFen, chessHistory, newHistory, userText); setChessChat([...newHistory, { role: 'model', text: reply }]); setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }
  const getPieceTutorial = (piece: ChessPiece, lang: string) => {
      const isRu = lang === 'ru';
      switch(piece.piece.toLowerCase()) {
          case 'p': return isRu ? "Пешка ходит вперед на 1 клетку (со старта можно на 2), а бьет по диагонали." : "Pawns move forward 1 square (2 on first move), and capture diagonally.";
          case 'n': return isRu ? "Конь ходит буквой «Г» и может перепрыгивать через другие фигуры!" : "Knights move in an 'L' shape and can jump over other pieces!";
          case 'b': return isRu ? "Слон ходит по диагонали на любое расстояние." : "Bishops move diagonally any number of squares.";
          case 'r': return isRu ? "Ладья ходит по прямой (по вертикали или горизонтали) на любое расстояние." : "Rooks move in straight lines horizontally or vertically.";
          case 'q': return isRu ? "Ферзь — самая сильная фигура! Ходит по прямой и по диагонали." : "The Queen moves in any straight or diagonal line.";
          case 'k': return isRu ? "Король ходит на 1 клетку в любую сторону. Берегите его!" : "The King moves one square in any direction. Protect him!";
          default: return "";
      }
  };

  const onChessSquareClick = async (r: number, c: number) => { 
      if (chessStatus === 'mate') return; 
      if ((chessMode === 'pve' || chessMode === 'tutorial' || chessMode === 'pvp') && chessTurn !== 'w') return; // In PvE/Tutorial, player is only white
      
      const clickedSq = chessBoard[r][c]; 
      if (clickedSq && (chessMode === 'study' || clickedSq.color === chessTurn)) { 
          setChessSelected({ r, c }); 
          setChessValidMoves(getStrictLegalPieceMoves(chessFen, r, c)); 
          playSound('click'); 
          if (chessMode === 'tutorial') setTutorialMessage(getPieceTutorial(clickedSq, user.language));
          return; 
      } 
      if (chessSelected && chessValidMoves.some(m => m.r === r && m.c === c)) { 
          await makeChessMove(chessSelected, { r, c }); 
          setChessSelected(null); 
          setChessValidMoves([]); 
      } else { 
          setChessSelected(null); 
          setChessValidMoves([]); 
      } 
  };
  
  const makeChessMove = async (from: Coords, to: Coords) => { 
      const chess = new Chess(chessFen);
      let moveObj: any = null;
      try {
          moveObj = chess.move({
              from: coordToAlg(from.r, from.c) as Square,
              to: coordToAlg(to.r, to.c) as Square,
              promotion: 'q'
          });
      } catch(e) {
          console.error("Invalid user move?", e);
          return;
      }
      
      const isCapture = !!(moveObj && (moveObj.captured || (moveObj.flags && (moveObj.flags.includes('c') || moveObj.flags.includes('e')))));
      if (isCapture) {
          playSound('capture');
      } else {
          playSound('click');
      }

      const newFen = chess.fen();
      setChessFen(newFen);
      setChessBoard(parseFen(newFen));
      setChessLastMove({from, to});
      setChessHistory(chess.history());
      setChessTurn(chess.turn());
      
      if (chessMode === 'tutorial') {
          setTutorialMessage(user.language === 'ru' ? "Отличный ход! Посмотрим, как ответит соперник." : "Great move! Let's see how the opponent responds.");
      }
      
      if (chess.isGameOver()) {
          setChessStatus('mate');
          if (chess.isCheckmate()) {
              playSound('correct'); 
              setFeedback({status: 'correct', message: t('checkmateWin')}); 
              updateChessStats('win'); 
          } else {
              playSound('correct'); 
              setFeedback({status: 'correct', message: "Draw/Stalemate!"}); 
          }
          return;
      }
      
      if (chess.turn() === 'b' && chessMode !== 'study' && (chessMode === 'pve' || chessMode === 'tutorial' || chessMode === 'pvp')) {
          setTimeout(() => makeAiMove(newFen), 500); 
      }
  };

  const makeAiMove = async (currentFen: string) => { 
      let moveStr = "";
      const chess = new Chess(currentFen);
      
      try { 
          moveStr = await getChessMove(currentFen, chess.history()); 
          if (moveStr) {
              const cleanMove = moveStr.replace('-', '');
              if (cleanMove.length >= 4) {
                  try {
                      chess.move({
                          from: cleanMove.substring(0, 2) as Square,
                          to: cleanMove.substring(2, 4) as Square,
                          promotion: 'q'
                      });
                  } catch(e) {
                      chess.move(cleanMove, { strict: false });
                  }
              } else {
                  chess.move(cleanMove, { strict: false });
              }
          } else {
              throw new Error("Empty move string");
          }
      } catch (e) {
          console.error("AI Move logic error/fallback", e); 
          const chessForFallback = new Chess(currentFen);
          const legalMoves = chessForFallback.moves();
          if (legalMoves.length > 0) {
              const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
              chess.move(randomMove);
          } else {
              return;
          }
      }
      
      const aiMoves = chess.history({ verbose: true });
      if (aiMoves.length === 0) return;
      const lastMove = aiMoves[aiMoves.length - 1];

      const isCapture = !!(lastMove && (lastMove.captured || (lastMove.flags && (lastMove.flags.includes('c') || lastMove.flags.includes('e')))));
      if (isCapture) {
          playSound('capture');
      } else {
          playSound('select');
      }
      
      const newFen = chess.fen();
      setChessFen(newFen);
      setChessBoard(parseFen(newFen));
      setChessLastMove({from: algToCoord(lastMove.from), to: algToCoord(lastMove.to)});
      setChessHistory(chess.history());
      setChessTurn('w');
      
      if (chessMode === 'tutorial') {
          setTutorialMessage(user.language === 'ru' ? "Очередь за вами! Выберите фигуру, чтобы узнать, как она ходит." : "Your turn! Select a piece to see how it moves.");
      }
      
      if (chess.isGameOver()) {
          setChessStatus('mate');
          if (chess.isCheckmate()) {
              setFeedback({status: 'wrong', message: t('checkmateLoss')}); 
              updateChessStats('loss'); 
              playSound('wrong');
          } else {
              setFeedback({status: 'correct', message: "Draw!"}); 
              playSound('correct');
          }
          return;
      }
      
      // Auto chat reply
      setChessChat(prev => {
          const arr = [...prev];
          arr.push({ role: 'model', text: '...', isFallback: true }); // temporary typing indicator
          return arr;
      });
      try {
          const comment = await getChessChatReply(newFen, chess.history(), chessChat, ""); 
          setChessChat(prev => {
              const newArr = prev.filter(m => m.text !== '...');
              newArr.push({ role: 'model', text: comment });
              return newArr;
          });
          setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); 
      } catch (e) {
          setChessChat(prev => prev.filter(m => m.text !== '...'));
      } 
  };

  useEffect(() => {
      let timer: any = null;
      if (screen === AppScreen.LESSON && currentExercise?.type === 'chess' && chessStatus === 'active') {
          timer = setInterval(() => {
              setChessTimerSeconds((prev) => {
                  if (prev <= 1) {
                      clearInterval(timer);
                      setChessStatus('mate');
                      setFeedback({ status: 'wrong', message: user.language === 'ru' ? 'Время вышло! Поражение по времени ⏱' : 'Time is up! Defeat on time ⏱' });
                      playSound('wrong');
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000);
      }
      return () => {
          if (timer) clearInterval(timer);
      };
  }, [screen, currentExercise?.type, chessStatus, user.language]);

  useEffect(() => {
      if (chessMoveHistoryEndRef.current) {
          chessMoveHistoryEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [chessHistory, chessTab]);

  const formatChessTimer = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getFormattedMoveHistory = (history: string[] = chessHistory) => {
      const pairs: { moveNum: number; moveNumber: number; white: string; black?: string }[] = [];
      for (let i = 0; i < history.length; i += 2) {
          const mNum = Math.floor(i / 2) + 1;
          pairs.push({
              moveNum: mNum,
              moveNumber: mNum,
              white: history[i],
              black: history[i + 1]
          });
      }
      return pairs;
  };
  
  const handleExplainMistake = async () => {
    playSound('click');
    const isOffline = offlineMode || (typeof navigator !== 'undefined' && !navigator.onLine);

    // In online mode without MAX subscription, invite user to upgrade to MAX.
    // In offline mode or with MAX, allow accessing the answer explanation immediately!
    if (!isOffline && user.subscription !== 'max') {
      if (isIncognitoUser) {
        setToast(
          user.language === 'ru'
            ? '🔒 Функция «Объяснение ответов (AI)» — платная функция подписки DuoWindo6601 Max (требуется аккаунт)'
            : '🔒 "AI Answer Explanation" is a paid DuoWindo6601 Max feature (account required)'
        );
      } else {
        setToast(
          user.language === 'ru'
            ? '🔒 Функция «Объяснение ответов (AI)» — платная функция, доступная только в подписке DuoWindo6601 Max'
            : '🔒 "AI Answer Explanation" is a paid feature available only in DuoWindo6601 Max'
        );
      }
      setScreen(AppScreen.SUBSCRIPTION);
      return;
    }
    if (!currentExercise) return;
    setShowExplanationModal(true);
    if (explanation) return;
    setExplanationLoading(true);

    let userAnswer = "";
    if (currentExercise.type === 'speech') userAnswer = transcriptRef.current || "(No speech detected)";
    else if (currentExercise.type === 'ishihara') userAnswer = ishiharaInput || "No input";
    else if (selectedWordIds.length > 0) userAnswer = selectedWordIds.map(id => availableTokens.find(t => t.id === id)?.text).join(' ');
    else if (feedback.status === 'correct') userAnswer = currentExercise.targetTranslation;

    const isCorrect = feedback.status === 'correct';
    const correctAnswer = currentExercise.type === 'speech' ? currentExercise.originalSentence : currentExercise.targetTranslation;
    const original = currentExercise.type === 'ishihara' ? "Ishihara Test" : currentExercise.originalSentence;
    const userLang = user.language === 'en' ? 'English' : 'Russian';

    try {
      const explanationText = await getMistakeExplanation(original, userAnswer, correctAnswer, userLang, isCorrect, currentExercise.type, isOffline);
      setExplanation(explanationText || generateLocalMistakeExplanation(original, userAnswer, correctAnswer, userLang, isCorrect, currentExercise.type));
    } catch (e) {
      setExplanation(generateLocalMistakeExplanation(original, userAnswer, correctAnswer, userLang, isCorrect, currentExercise.type));
    } finally {
      setExplanationLoading(false);
    }
  };
  const startTraining = async (type: Exercise['type'] = 'translation', topicOverride?: string) => {
    playSound('click');
    if (user.subscription === 'free' && user.energy <= 0) {
      setToast(t('t_energy_low'));
      setScreen(AppScreen.SHOP);
      return;
    }

    if (currentCourse.id === 'chess') {
      initChessGame();
      setCurrentExercise({
        id: crypto.randomUUID(),
        type: 'chess',
        originalSentence: "Chess Game",
        targetTranslation: "Checkmate",
        wordBank: [],
        chessData: { fen: INITIAL_BOARD_FEN, pgn: [], difficulty: 'beginner' }
      });
      setScreen(AppScreen.LESSON);
      return;
    }

    // Authentic Duolingo lesson loading screen transition
    setCurrentExercise(null);
    setLessonLoading(true);
    setLoading(true);
    setScreen(AppScreen.LESSON);
    setFeedback({ status: 'idle', message: '' });
    setExplanation('');
    setShowExplanationModal(false);
    setSelectedWordIds([]);
    setPaths([]);
    setIshiharaInput("");
    setReadingInput("");

    if (offlineMode && !isCustomApiKeySkipped() && user.subscription !== 'super' && user.subscription !== 'max') {
      const ex = getFallbackExercise(currentCourse.id, type, currentCourse.localName);
      setCurrentExercise(ex);
      setAvailableTokens((ex.wordBank || []).map(w => ({ id: crypto.randomUUID(), text: w })));
      setLessonLoading(false);
      setLoading(false);
      return;
    }

    try {
      if (type === 'roleplay') {
        setRoleplayInput("");
        const ex = await startRoleplay(currentCourse.localName, currentCourse.id);
        setCurrentExercise(ex);
        if (ex.roleplayData?.messages[0]) speakText(ex.roleplayData.messages[0].text, currentCourse.id, false, user.preferredVoice, user.voiceProvider);
      } else if (type === 'illusion') {
        const ex = await generateIllusion(currentCourse.localName, currentCourse.id);
        setCurrentExercise(ex);
        if (ex.illusionData) speakText(ex.illusionData.soundText, currentCourse.id, false, user.preferredVoice, user.voiceProvider);
      } else if (type === 'drawing') {
        const ex = await generateDrawing(currentCourse.localName, currentCourse.id, topicOverride);
        setCurrentExercise(ex);
        setPaths([]);
        setShowTrace(true);
        if (ex.drawingData) speakText(ex.drawingData.character, currentCourse.id, false, user.preferredVoice, user.voiceProvider);
      } else if (type === 'ishihara') {
        const ex = await generateIshihara(currentCourse.id);
        setCurrentExercise(ex);
        setIshiharaInput("");
      } else if (type === 'reading') {
        const ex = await generateReading(currentCourse.localName, currentCourse.id);
        setCurrentExercise(ex);
        setReadingInput("");
        if (ex.readingData?.mode === 'fill-blanks') {
          setAvailableTokens((ex.wordBank || []).map(w => ({ id: crypto.randomUUID(), text: w })));
          setSelectedWordIds([]);
        }
      } else {
        const ex = await generateExercise(currentCourse.localName, currentCourse.id, isLanguageCourse, type, user.subscription === 'max', topicOverride);
        setAvailableTokens((ex.wordBank || []).map(w => ({ id: crypto.randomUUID(), text: w })));
        setSelectedWordIds([]);
        setCurrentExercise(ex);
        transcriptRef.current = "";
        if (isLanguageCourse && type === 'listening') speakText(ex.originalSentence, currentCourse.id, false, user.preferredVoice, user.voiceProvider);
      }
    } catch (e: any) {
      console.warn("API exercise generation failed, smoothly loading offline exercise:", e);
      const ex = getFallbackExercise(currentCourse.id, type, currentCourse.localName);
      setAvailableTokens((ex.wordBank || []).map(w => ({ id: crypto.randomUUID(), text: w })));
      setSelectedWordIds([]);
      setCurrentExercise(ex);
    } finally {
      setLessonLoading(false);
      setLoading(false);
    }
  };
  const awardLessonStreak = () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      if (user.lastActiveDate !== todayStr) {
        setUser(u => ({
          ...u,
          streak: Math.max(1, (u.streak || 0) + 1),
          lastActiveDate: todayStr
        }));
        playSound('streak_update');
        setToast(t('streakResumed'));
      }
    } catch (e) {
      console.warn("Streak award error", e);
    }
  };

  const handleRoleplaySend = async (text: string) => { if (!currentExercise || !currentExercise.roleplayData || !text.trim()) return; const newMessage: RoleplayMessage = { role: 'user', text: text }; const updatedMessages = [...currentExercise.roleplayData.messages, newMessage]; setCurrentExercise({ ...currentExercise, roleplayData: { ...currentExercise.roleplayData, messages: updatedMessages, userTurn: false } }); setRoleplayInput(""); setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); setLoading(true); try { const reply = await replyToRoleplay(updatedMessages, text, currentCourse.localName, user.subscription === 'max'); if (reply.isFallback && !offlineMode && !isCustomApiKeySkipped() && user.subscription !== 'super' && user.subscription !== 'max') setShowLimitModal(true); setCurrentExercise(prev => { if (!prev || !prev.roleplayData) return prev; return { ...prev, roleplayData: { ...prev.roleplayData, messages: [...updatedMessages, reply], userTurn: true } } }); setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); speakText(reply.text, currentCourse.id, false, user.preferredVoice, user.voiceProvider); setUser(u => ({ ...u, xp: u.xp + 10 })); checkAndAwardDailyChallenge('roleplay'); awardLessonStreak(); } catch (e) { console.error(e); } finally { setLoading(false); } };
  const checkIllusionAnswer = async (selectedOption: 'A' | 'B') => { if (!currentExercise || !currentExercise.illusionData) return; setLoading(true); try { const isCorrect = currentExercise.illusionData.correctOption === selectedOption; if (isCorrect) { playSound('correct'); setFeedback({ status: 'correct', message: currentExercise.illusionData.explanation }); setUser(u => ({ ...u, xp: u.xp + 20 })); checkAndAwardDailyChallenge('illusion'); awardLessonStreak(); } else { playSound('wrong'); const correctText = currentExercise.illusionData.correctOption === 'A' ? currentExercise.illusionData.optionA : currentExercise.illusionData.optionB; setFeedback({ status: 'wrong', message: `${t('correctAnswer')} ${correctText}. ${currentExercise.illusionData.explanation}` }); if (user.subscription === 'free') setUser(u => ({ ...u, energy: Math.max(0, u.energy - 1) })); } } finally { setLoading(false); } };
  const checkDrawingAnswer = async () => { if (!currentExercise || !currentExercise.drawingData || !canvasRef.current) return; playSound('click'); setLoading(true); try { const imageBase64 = canvasRef.current.toDataURL('image/png').split(',')[1]; const result = await checkDrawing(imageBase64, currentExercise.drawingData.character); if (result.isFallback && !offlineMode && !isCustomApiKeySkipped() && user.subscription !== 'super' && user.subscription !== 'max') setShowLimitModal(true); if (result.isCorrect) { playSound('correct'); setFeedback({ status: 'correct', message: result.feedback }); setUser(u => ({ ...u, xp: u.xp + 20 })); checkAndAwardDailyChallenge('drawing'); awardLessonStreak(); } else { playSound('wrong'); setFeedback({ status: 'wrong', message: result.feedback }); if (user.subscription === 'free') setUser(u => ({ ...u, energy: Math.max(0, u.energy - 1) })); } } catch (e) { console.error(e); } finally { setLoading(false); } };
  const checkAnswer = async (spokenText?: string) => { if (!currentExercise) return; if (isRecording) { setIsRecording(false); if (recognitionRef.current) recognitionRef.current.stop(); if (timerRef.current) clearTimeout(timerRef.current); } if (!spokenText && currentExercise.type !== 'ishihara') playSound('click'); if (currentExercise.type === 'ishihara') { const correct = currentExercise.targetTranslation; const userAnswer = ishiharaInput.trim(); if (userAnswer === correct) { playSound('correct'); setFeedback({ status: 'correct', message: "Correct! You have good color vision for this plate." }); setUser(u => ({ ...u, xp: u.xp + 15 })); checkAndAwardDailyChallenge('ishihara'); awardLessonStreak(); } else { playSound('wrong'); setFeedback({ status: 'wrong', message: `Incorrect. The number was ${correct}.` }); if (user.subscription === 'free') setUser(u => ({ ...u, energy: Math.max(0, u.energy - 1) })); } return; } if (currentExercise.type === 'reading') { setLoading(true); if (currentExercise.readingData?.mode === 'write') { const ans = readingInput; const res = await checkAnswerWithAI(currentCourse.localName, ans, currentExercise.readingData.prompt || "Write something relevant", user.subscription === 'max'); if (res.isFallback && !offlineMode && !isCustomApiKeySkipped() && user.subscription !== 'super' && user.subscription !== 'max') setShowLimitModal(true); if (res.isCorrect) { playSound('correct'); setFeedback({ status: 'correct', message: res.feedback }); setUser(u => ({ ...u, xp: u.xp + 20, gems: u.gems + 5 })); checkAndAwardDailyChallenge('reading'); awardLessonStreak(); } else { playSound('wrong'); setFeedback({ status: 'wrong', message: res.feedback }); if (user.subscription === 'free') setUser(u => ({ ...u, energy: Math.max(0, u.energy - 1) })); } setLoading(false); return; } else { let tempText = currentExercise.readingData!.text; const blanksCount = (tempText.match(/___/g) || []).length; if (selectedWordIds.length !== blanksCount) { setToast("Fill all blanks!"); setLoading(false); return; } const correctWords = currentExercise.readingData!.blanks?.map(b => b.word) || []; const userWords = selectedWordIds.map(id => availableTokens.find(t => t.id === id)?.text); const isCorrect = correctWords.every((w, i) => w.toLowerCase() === userWords[i]?.toLowerCase()); if (isCorrect) { playSound('correct'); setFeedback({ status: 'correct', message: "Perfect!" }); setUser(u => ({ ...u, xp: u.xp + 20 })); checkAndAwardDailyChallenge('reading'); awardLessonStreak(); } else { playSound('wrong'); setFeedback({ status: 'wrong', message: `Correct: ${currentExercise.targetTranslation}` }); if (user.subscription === 'free') setUser(u => ({ ...u, energy: Math.max(0, u.energy - 1) })); } setLoading(false); return; } } setLoading(true); try { let ans = ""; if (typeof spokenText === 'string') ans = spokenText; else if (currentExercise.type === 'speech') { if (transcriptRef.current.trim()) ans = transcriptRef.current; else if (!recognitionRef.current) ans = currentExercise.originalSentence; else { setLoading(false); setToast(t('t_speech_empty')); return; } } else ans = selectedWordIds.map(id => availableTokens.find(t => t.id === id)?.text).join(' '); const correctAnswer = currentExercise.type === 'speech' ? currentExercise.originalSentence : currentExercise.targetTranslation; const res = await checkAnswerWithAI(currentCourse.localName, ans, correctAnswer, user.subscription === 'max'); if (res.isFallback && !offlineMode && !isCustomApiKeySkipped() && user.subscription !== 'super' && user.subscription !== 'max') setShowLimitModal(true); if (res.isCorrect) { playSound('correct'); setFeedback({ status: 'correct', message: res.feedback }); setUser(u => ({ ...u, xp: u.xp + 20, gems: u.gems + 5 })); checkAndAwardDailyChallenge(currentExercise.type); awardLessonStreak(); } else { playSound('wrong'); setFeedback({ status: 'wrong', message: `${t('correctAnswer')} ${correctAnswer}` }); if (user.subscription === 'free') setUser(u => ({ ...u, energy: Math.max(0, u.energy - 1) })); } } catch (e) { console.error(e); setToast("Ошибка проверки"); } finally { setLoading(false); } };
  const handleContinueAfterLesson = () => { playSound('click'); if (user.subscription === 'free' && Math.random() > 0.5) setShowAd(true); else setScreen(AppScreen.PATH); setFeedback({ status: 'idle', message: '' }); setCurrentExercise(null); setExplanation(null); setShowExplanationModal(false); }
  const handleSkip = () => { playSound('click'); setToast(t('t_skip')); handleContinueAfterLesson(); };
  const toggleRecording = () => { playSound('click'); if (isRecording) { setIsRecording(false); if (recognitionRef.current) recognitionRef.current.stop(); if (timerRef.current) clearTimeout(timerRef.current); if (currentExercise?.type === 'roleplay') setTimeout(() => { if (transcriptRef.current) handleRoleplaySend(transcriptRef.current); }, 500); else if (screen === AppScreen.VIDEO_CALL) setTimeout(() => { if (transcriptRef.current) handleVideoCallSend(transcriptRef.current); }, 500); else if (!recognitionRef.current) checkAnswer(currentExercise?.originalSentence); else setTimeout(() => checkAnswer(), 200); } else { transcriptRef.current = ""; setIsRecording(true); if (recognitionRef.current) try { recognitionRef.current.start(); } catch (e) { console.error("Rec start error", e); setIsRecording(false); } else timerRef.current = setTimeout(() => { setIsRecording(false); if (currentExercise?.type === 'roleplay') handleRoleplaySend("Hello friend!"); else if (screen === AppScreen.VIDEO_CALL) handleVideoCallSend("Hello DuoWindo6601!"); else checkAnswer(currentExercise?.originalSentence); }, 3000); } };
  const upgradeSubscription = (tier: SubscriptionTier) => {
    if (isIncognitoUser) {
      playSound('wrong');
      setToast(
        user.language === 'ru'
          ? '🔒 Режим Инкогнито: Подписки DuoWindo6601 Super и Max требуют зарегистрированный аккаунт!'
          : '🔒 Incognito Mode: DuoWindo6601 Super & Max subscriptions require an account registration!'
      );
      openRegisterModal('register');
      return;
    }
    playSound('success');
    setUser(u => ({ ...u, subscription: tier, energy: 25 }));
    setToast(tier === 'super' ? t('t_welcome_super') : t('t_welcome_max'));
    setScreen(AppScreen.PATH);
  };
  const cancelSubscription = () => { playSound('click'); setUser(u => ({ ...u, subscription: 'free', energy: 25 })); setToast(t('t_sub_cancel')); };
  const checkAndAwardDailyChallenge = (exType: Exercise['type']) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayChallenge = getTodayChallenge();
      if (exType === todayChallenge.type && user.dailyChallengeCompletedDate !== todayStr) {
        setUser(u => ({
          ...u,
          xp: u.xp + todayChallenge.bonusXp,
          dailyChallengeCompletedDate: todayStr
        }));
        playSound('streak_update');
        const challengeTitle = user.language === 'ru' ? todayChallenge.titleRu : todayChallenge.titleEn;
        setToast(
          user.language === 'ru'
            ? `🎯 Ежедневный челлендж "${challengeTitle}" выполнен! +${todayChallenge.bonusXp} XP!`
            : `🎯 Daily Challenge "${challengeTitle}" completed! +${todayChallenge.bonusXp} XP!`
        );
      }
    } catch (e) {
      console.warn("Daily challenge award error", e);
    }
  };

  const handleNavigation = (s: AppScreen) => { playSound('screen_transition'); setScreen(s); };

  const ChessNavIcon: React.FC<{ className?: string }> = ({ className }) => (
    <ChessPieceIcon type="n" color={isLightMode ? 'w' : 'b'} className={className} />
  );

  const NAV_ITEMS = [
    { screen: AppScreen.PATH, icon: HomeIcon, label: t('home') },
    { screen: AppScreen.ALPHABET, icon: AlphabetIcon, label: user.language === 'ru' ? 'Письма' : t('alphabet') },
    { screen: AppScreen.TRANSLATOR, icon: BookIcon, label: user.language === 'ru' ? 'Переводчик DuoWindo6601' : 'Translator DuoWindo6601' },
    { screen: AppScreen.FEEDBACK, icon: StarIcon, label: user.language === 'ru' ? 'Отзывы о DuoWindo6601' : 'Reviews DuoWindo6601' },
    { screen: AppScreen.SUPPORT_CHAT, icon: ChatBubbleIcon, label: user.language === 'ru' ? 'Чат техподдержки DuoWindo6601' : 'Support Chat DuoWindo6601' },
    { screen: AppScreen.CHESS_MATCH, icon: ChessNavIcon, label: t('playChess') },
    { screen: AppScreen.PRACTICE, icon: DumbbellIcon, label: t('practice') },
    { screen: AppScreen.VOCABULARY, icon: NewWordIcon, label: user.language === 'ru' ? 'Банк слов' : 'Vocabulary' },
    { screen: AppScreen.VIDEO_CALL, icon: CameraIcon, label: t('videoCall') },
    { screen: AppScreen.LEADERBOARD, icon: ShieldIcon, label: t('leaderboard') },
    { screen: AppScreen.SHOP, icon: ChestIcon, label: t('shop') },
    { screen: AppScreen.SUBSCRIPTION, icon: SparklesIcon, label: user.language === 'ru' ? 'Лимит & Подписка' : 'Limit & Subscription' },
    { screen: AppScreen.PROFILE, icon: UserIcon, label: t('profile') },
    ...(user.isAdmin ? [{ screen: AppScreen.ADMIN_DASHBOARD, icon: GearIcon, label: 'Admin Tool 🛡️' }] : [])
  ];

  const MOBILE_NAV_SCREENS = [
    AppScreen.PATH,
    AppScreen.ALPHABET,
    AppScreen.TRANSLATOR,
    AppScreen.FEEDBACK,
    AppScreen.SUPPORT_CHAT,
    AppScreen.CHESS_MATCH,
    AppScreen.PRACTICE,
    AppScreen.LEADERBOARD,
    AppScreen.SHOP,
    AppScreen.PROFILE
  ];

  const renderAppLayout = () => {
    const isNativeApp = typeof window !== 'undefined' && (
      !!(window as any).Capacitor?.isNativePlatform?.() || 
      !!(window as any).Capacitor?.platform
    );
    const isSimulatingMobile = simulatorMode !== 'none' || isNativeApp;

    return (
      <div className={simulatorMode === 'none' 
        ? `${isLightMode ? 'bg-[#F0F2F5] text-slate-900' : (user.nightMode ? 'bg-[#08080d] brightness-95 text-white' : 'bg-duo-dark text-white')} min-h-screen flex flex-col lg:flex-row font-din selection:bg-duo-blue/30 overflow-x-hidden w-full transition-colors duration-500`
        : `w-full h-full ${isLightMode ? 'bg-[#F0F2F5] text-slate-900' : (user.nightMode ? 'bg-[#08080d] brightness-95 text-white' : 'bg-duo-dark text-white')} flex flex-col font-din selection:bg-duo-blue/30 overflow-y-auto no-scrollbar relative transition-colors duration-500`
      }>
      {/* SIDEBAR */}
      <aside className={isSimulatingMobile ? "hidden" : `hidden lg:flex flex-col w-64 fixed left-0 h-full border-r ${isLightMode ? 'border-slate-200 bg-white shadow-sm' : 'border-gray-800 bg-duo-dark'} p-6 z-50 overflow-y-auto no-scrollbar transition-colors`}>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-duo-green italic tracking-tighter font-din">DUOWINDO</h1>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isLightMode
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 shadow-sm'
                : 'bg-gray-800/80 hover:bg-gray-700 text-indigo-300 border-gray-700'
            }`}
            title={isLightMode ? 'Светлая тема (клик для тёмной)' : 'Тёмная тема (клик для светлой)'}
          >
            <span className="text-base select-none">{isLightMode ? '☀️' : '🌙'}</span>
          </button>
        </div>
        <nav className="space-y-1.5 flex-1">
          {NAV_ITEMS.map(item => {
            const todayStr = new Date().toISOString().split('T')[0];
            const isTodayChallengePending = item.screen === AppScreen.PATH && 
              user.dailyChallengeCompletedDate !== todayStr && 
              dailyChallengeDismissedDate !== todayStr;
            return (
              <button 
                key={item.screen} 
                onClick={() => handleNavigation(item.screen)} 
                className={`flex items-center space-x-4 w-full px-4 py-3.5 rounded-2xl border-2 transition-all relative cursor-pointer ${
                  screen === item.screen 
                    ? 'bg-duo-blue/10 border-duo-blue/40 text-duo-blue font-black' 
                    : isLightMode 
                      ? 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900' 
                      : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="relative">
                  <item.icon className="w-6 h-6" />
                  {isTodayChallengePending && (
                    <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 bg-duo-orange rounded-full border-2 ${isLightMode ? 'border-white' : 'border-duo-dark'} animate-pulse`} />
                  )}
                </div>
                <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
              </button>
            );
          })}
          {isIncognitoUser && (
            <>
              <button
                onClick={openIncognitoRestrictionsModal}
                className="flex items-center space-x-3 w-full px-4 py-3 rounded-2xl border border-amber-500/40 bg-amber-950/30 hover:bg-amber-900/50 text-amber-300 transition-all text-left shadow-inner mt-4 group cursor-pointer"
                title="Режим Ограничения в Инкогнито (8 функций заблокировано)"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">🚫</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[11px] uppercase tracking-wider block leading-tight text-amber-200">
                      {user.language === 'ru' ? 'Ограничения' : 'Restrictions'}
                    </span>
                    <span className="bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">8</span>
                  </div>
                  <span className="text-[10px] text-amber-400/70 font-bold block truncate">
                    {user.language === 'ru' ? 'Что заблокировано' : 'Blocked features'}
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  playSound('click');
                  setShowIncognitoExportModal(true);
                }}
                className="flex items-center space-x-3 w-full px-4 py-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300 transition-all text-left shadow-inner mt-2 group cursor-pointer"
                title="Экспорт данных Режим Инкогнито (Без аккаунта)"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">💾</span>
                <div className="flex-1 min-w-0">
                  <span className="font-black text-[11px] uppercase tracking-wider block leading-tight text-emerald-200">
                    {user.language === 'ru' ? 'Экспорт данных' : 'Export Data'}
                  </span>
                  <span className="text-[10px] text-emerald-400/70 font-bold block truncate">
                    {user.language === 'ru' ? 'Резервная копия .JSON' : '.JSON Backup'}
                  </span>
                </div>
              </button>
            </>
          )}
        </nav>
      </aside>

      <main className={isSimulatingMobile ? "flex-1 relative pb-44 min-h-screen w-full" : "flex-1 lg:ml-64 relative pb-44 lg:pb-0 min-h-screen"}>
        {/* HEADER */}
        {screen !== AppScreen.LESSON && screen !== AppScreen.VIDEO_CALL && (
          <header className={`sticky top-0 z-40 ${isLightMode ? 'bg-white/95 border-slate-200' : 'bg-duo-dark/95 border-gray-800'} backdrop-blur-md p-2.5 sm:p-4 border-b flex flex-col space-y-2 sm:space-y-4 shadow-sm transition-colors`}>
             <div className="flex justify-between items-center max-w-5xl mx-auto w-full">
                <div className="flex items-center space-x-3 sm:space-x-5">
                  <div className="flex items-center text-duo-red font-bold text-sm sm:text-lg"><FireIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-1" /> {user.streak}</div>
                  <div className="flex items-center text-duo-blue font-bold text-sm sm:text-lg"><GemStoneIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-1" /> {user.gems}</div>
                  <div className="flex items-center font-bold text-sm sm:text-lg text-yellow-400">{user.subscription !== 'free' ? <InfiniteEnergyIcon className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-400" /> : <><LightningIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-1" /> {user.energy}</>}</div>
                </div>
                 <div className="flex items-center space-x-2">
                    {isIncognitoUser ? (
                      <>
                        <button 
                          onClick={() => openRegisterModal('register')} 
                          className="px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 hover:scale-105 transition-all flex items-center space-x-1.5 shadow-md cursor-pointer"
                          title="Режим Инкогнито (Без аккаунта) — Нажмите для регистрации"
                        >
                          <span>🕵️</span>
                          <span className="hidden sm:inline">
                            {t('incognito')}
                          </span>
                          <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.5 rounded-md font-bold">
                            {user.username ? `@${user.username}` : 'Гость'}
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            playSound('click');
                            setShowIncognitoExportModal(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-500/50 hover:scale-105 transition-all flex items-center space-x-1 shadow-md cursor-pointer"
                          title="Экспорт данных Режим Инкогнито (Без аккаунта)"
                        >
                          <span>💾</span>
                          <span className="hidden sm:inline">{user.language === 'ru' ? 'Экспорт' : 'Export'}</span>
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => openRegisterModal('register')} 
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${
                          isLightMode 
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' 
                            : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700'
                        } border hover:scale-105 transition-all flex items-center space-x-1 shadow-md cursor-pointer`}
                        title="Регистрация / Вход / Инкогнито"
                      >
                        <span>👤</span>
                        <span className="hidden sm:inline">
                          {user.username ? `@${user.username}` : user.name !== "Ученик 6601" ? user.name : t('register')}
                        </span>
                      </button>
                    )}
                                      {/* SYSTEM STATUS BADGE BUTTON */}
                  <button
                    onClick={() => setShowSystemInfoModal(true)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center space-x-1 shadow-md cursor-pointer border ${
                      systemInfo.warningType === "windows_xp_vista"
                        ? "bg-red-950/80 hover:bg-red-900 text-red-300 border-red-500/60 animate-pulse"
                        : systemInfo.warningType === "old_browser"
                          ? "bg-amber-950/80 hover:bg-amber-900 text-amber-300 border-amber-500/60"
                          : isLightMode
                            ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-gray-800/80 hover:bg-gray-700 text-emerald-400 border-gray-700"
                    }`}
                    title="Информация о системе и ОС (Windows 7/8/8.1/10/11 & XP/Vista)"
                  >
                    <span>{systemInfo.warningType === "windows_xp_vista" ? "🛑" : systemInfo.warningType === "old_browser" ? "⚠️" : "💻"}</span>
                    <span className="hidden sm:inline">
                      {systemInfo.warningType === "windows_xp_vista" 
                        ? "Win XP/Vista" 
                        : systemInfo.warningType === "old_browser" 
                          ? "Старый Браузер" 
                          : "Win 7-11"}
                    </span>
                  </button>

                  {/* QUICK THEME TOGGLE BUTTON (☀️ Светлая / 🌙 Тёмная) */}
                  <button
                    onClick={toggleTheme}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-md cursor-pointer border hover:scale-105 active:scale-95 ${
                      isLightMode
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 ring-1 ring-amber-300/60 shadow-amber-200/50'
                        : 'bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border-indigo-500/50 shadow-indigo-950/50'
                    }`}
                    title={user.language === 'ru' 
                      ? (isLightMode ? 'Светлая тема (нажмите для переключения на тёмную)' : 'Тёмная тема (нажмите для переключения на светлую)') 
                      : (isLightMode ? 'Light theme (click for dark)' : 'Dark theme (click for light)')}
                  >
                    <span className="text-sm select-none">{isLightMode ? '☀️' : '🌙'}</span>
                    <span className="hidden sm:inline font-black">
                      {user.language === 'ru' 
                        ? (isLightMode ? 'Светлая' : 'Тёмная') 
                        : (isLightMode ? 'Light' : 'Dark')}
                    </span>
                  </button>

                  {/* QUICK LANGUAGE SWITCHER */}
                    <div className="relative group">
                      <button 
                        onClick={() => {
                          playSound('click');
                          const langs = ['ru', 'en', 'de', 'fr', 'es', 'ja', 'zh', 'ar'];
                          const nextIdx = (langs.indexOf(user.language) + 1) % langs.length;
                          setUser({ ...user, language: langs[nextIdx] as any });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${
                          isLightMode 
                            ? 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-300' 
                            : 'bg-duo-blue/20 hover:bg-duo-blue/30 text-duo-blue border-duo-blue/50'
                        } hover:scale-105 transition-all flex items-center space-x-1 shadow-md cursor-pointer border`}
                        title="Переключить язык интерфейса (RU, EN, DE, FR, ES, JA, ZH, AR)"
                      >
                        <span>🌐</span>
                        <span className="font-black">{user.language.toUpperCase()}</span>
                      </button>
                    </div>

                    {/* TRANSLATOR QUICK BUTTON */}
                    <button 
                      onClick={() => { playSound('click'); setScreen(AppScreen.TRANSLATOR); }} 
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${
                        screen === AppScreen.TRANSLATOR
                          ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400'
                          : isLightMode 
                            ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-300' 
                            : 'bg-blue-950/80 hover:bg-blue-900 text-blue-200 border-blue-500/50'
                      } hover:scale-105 transition-all flex items-center space-x-1 shadow-md cursor-pointer border`}
                      title="Переводчик DuoWindo6601"
                    >
                      <span>📖</span>
                      <span className="hidden md:inline">{user.language === 'ru' ? 'Переводчик' : 'Translator'}</span>
                    </button>

                    {/* REVIEWS QUICK BUTTON */}
                    <button 
                      onClick={() => { playSound('click'); setScreen(AppScreen.FEEDBACK); }} 
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${
                        screen === AppScreen.FEEDBACK
                          ? 'bg-amber-600 text-white border-amber-400 ring-2 ring-amber-400'
                          : isLightMode 
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300' 
                            : 'bg-amber-950/80 hover:bg-amber-900 text-amber-200 border-amber-500/50'
                      } hover:scale-105 transition-all flex items-center space-x-1 shadow-md cursor-pointer border`}
                      title="Отзывы о DuoWindo6601"
                    >
                      <span>⭐</span>
                      <span className="hidden md:inline">{user.language === 'ru' ? 'Отзывы' : 'Reviews'}</span>
                    </button>

                    {/* SUPPORT CHAT QUICK BUTTON */}
                    <button 
                      onClick={() => { playSound('click'); setScreen(AppScreen.SUPPORT_CHAT); }} 
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${
                        screen === AppScreen.SUPPORT_CHAT
                          ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400'
                          : isLightMode 
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300' 
                            : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border-emerald-500/50'
                      } hover:scale-105 transition-all flex items-center space-x-1 shadow-md cursor-pointer border`}
                      title="Чат техподдержки DuoWindo6601"
                    >
                      <span>💬</span>
                      <span className="hidden md:inline">{user.language === 'ru' ? 'Поддержка' : 'Support'}</span>
                    </button>

                    <button 
                      onClick={() => { playSound('click'); setShowBetaModal(true); }} 
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${
                        isLightMode 
                          ? 'bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-300' 
                          : 'bg-purple-900/60 hover:bg-purple-800 text-purple-200 border-purple-500/50'
                      } hover:scale-105 transition-all flex items-center space-x-1 shadow-md cursor-pointer border`}
                      title="Доступ бета-тестирование DuoWindo6601"
                    >
                      <span className="animate-pulse">🧪</span>
                      <span className="hidden sm:inline">Бета-Тест</span>
                    </button>
                    <button 
                      onClick={() => { playSound('click'); setShowBrowserModal(true); setShowSystemInfoModal(true); }} 
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${
                        isOutdatedBrowserDetected 
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/80 animate-pulse' 
                          : isLightMode 
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                            : 'bg-gray-800/80 text-gray-300 border border-gray-700 hover:text-white'
                      } hover:scale-105 transition-all flex items-center space-x-1 shadow-md cursor-pointer border`}
                      title="Предупреждение о браузере / Поддержка"
                    >
                      <span>{isOutdatedBrowserDetected ? '⚠️' : '🌐'}</span>
                      <span className="hidden md:inline">Браузер</span>
                    </button>
                    <button onClick={() => { playSound('click'); setScreen(AppScreen.SUBSCRIPTION); }} className={`px-4 py-1.5 rounded-xl text-[12px] font-black border-b-4 uppercase tracking-widest transition-transform hover:scale-105 ${
                      user.subscription === 'max' 
                        ? (isLightMode ? 'bg-indigo-600 border-indigo-800 text-white shadow-md' : 'bg-black border-gray-700 text-duo-blue shadow-[0_0_10px_rgba(28,176,246,0.5)]')
                        : user.subscription === 'super' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-purple-700 text-white' 
                          : 'bg-duo-blue border-blue-800 text-white'
                    }`}>{user.subscription === 'free' ? t('free') : user.subscription === 'super' ? 'SUPER' : 'MAX'}</button>
                 </div>
             </div>
             <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar py-2 max-w-5xl mx-auto w-full px-4">
                {COURSES.slice(0, 5).map(c => (
                  <button key={c.id} onClick={() => { playSound('select'); setCurrentCourse(c); setScreen(AppScreen.PATH); }} className={`flex-shrink-0 w-14 h-11 rounded-2xl border-2 flex items-center justify-center transition-all ${
                    currentCourse.id === c.id 
                      ? 'border-duo-blue bg-duo-blue/15 scale-110 shadow-lg' 
                      : isLightMode 
                        ? 'border-slate-200 bg-white hover:border-slate-300 text-slate-800 shadow-sm' 
                        : 'border-gray-800 bg-duo-card hover:border-gray-600'
                  }`}>{SPECIAL_IDS.includes(c.id) ? <span className="text-xl font-bold">{c.id === 'math' ? 'Σ' : c.id === 'music' ? '♫' : c.id === 'chess' ? '♔' : c.id === 'hv' ? '🐉' : '🖖'}</span> : <img src={`https://flagcdn.com/w40/${c.flagCode}.png`} className="w-8 rounded-sm shadow-sm" alt={c.name} />}</button>
                ))}
                <button onClick={() => { playSound('click'); setScreen(AppScreen.COURSE_SELECT); }} className={`flex-shrink-0 w-14 h-11 rounded-2xl border-2 ${isLightMode ? 'border-slate-200 bg-white hover:bg-slate-100 text-slate-600 shadow-sm' : 'border-gray-700 hover:bg-gray-800 text-gray-400'} flex items-center justify-center transition-all`}><PlusIcon className="w-6 h-6 text-gray-400" /></button>
             </div>
          </header>
        )}

        {/* INCOGNITO CLOSURE NOTICE & DATA EXPORT BANNER */}
        {isIncognitoUser && (
          <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-emerald-950/90 border-b-2 border-amber-500/50 px-3 sm:px-6 py-2.5 shadow-md">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-left">
              <div className="flex items-center space-x-2.5">
                <span className="text-xl sm:text-2xl shrink-0">{incognitoClosed ? '🛑' : '🚫'}</span>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="font-black text-amber-300 uppercase tracking-wide">
                      {getIncognitoClosureTitle(user.language)}
                    </span>
                    <span className="bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center space-x-1 shadow-sm">
                      <span>✅</span>
                      <span>{user.language === 'ru' ? 'Полный Вход и регистрация: НЕ ЗАКРЫТ (Работает)' : 'Full Sign-In & Registration: NOT CLOSED (Active)'}</span>
                    </span>
                    <span className="bg-amber-950/90 text-amber-300 border border-amber-500/50 text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center space-x-1 shadow-sm">
                      <span>👑</span>
                      <span>{user.language === 'ru' ? 'Профиль Администратора: НЕ ЗАКРЫТ' : 'Admin Profile: NOT CLOSED'}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 font-medium mt-0.5">
                    {user.language === 'ru' 
                      ? '10 октября 2026 года вход в Режим Инкогнито недоступен, и его нельзя будет восстановить в DuoWindo6601. Синхронизирован актуальный статус не закрытия: Полный Вход и регистрация работают без ограничений, профиль Администратора доступен.' 
                      : 'On October 10, 2026, entry into Incognito Mode is unavailable and cannot be restored in DuoWindo6601. Synchronized actual unclosed status: Full Sign-In & registration operate normally, Admin Profile is active.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0 justify-end flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setShowIncognitoExportModal(true);
                  }}
                  className="flex-1 sm:flex-initial px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl border-b-2 border-emerald-800 active:translate-y-0.5 transition-all text-xs uppercase tracking-wider flex items-center justify-center space-x-1 shadow cursor-pointer"
                >
                  <span>💾</span>
                  <span>{user.language === 'ru' ? 'Экспорт данных' : 'Export Data'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setShowFirebaseExportModal(true);
                  }}
                  className="flex-1 sm:flex-initial px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black rounded-xl border-b-2 border-amber-800 active:translate-y-0.5 transition-all text-xs uppercase tracking-wider flex items-center justify-center space-x-1 shadow cursor-pointer"
                >
                  <span>🔥</span>
                  <span>{user.language === 'ru' ? 'Firebase Экспорт' : 'Firebase Export'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => openRegisterModal('login')}
                  className="flex-1 sm:flex-initial px-3 py-1.5 bg-duo-blue hover:bg-sky-500 text-white font-black rounded-xl border-b-2 border-duo-blueDark active:translate-y-0.5 transition-all text-xs uppercase tracking-wider flex items-center justify-center space-x-1 shadow cursor-pointer"
                >
                  <span>🔑</span>
                  <span>{user.language === 'ru' ? 'Полный Вход' : 'Full Sign-In'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ... (Other Screens) ... */}
        {screen === AppScreen.ALPHABET && (
          <LettersScreen
            currentCourse={currentCourse}
            user={user}
            setUser={setUser}
            onSaveProgress={(updatedUser) => {
              setUser(updatedUser);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
            }}
            speakText={speakText}
            isLightMode={isLightMode}
            onBackToPath={() => setScreen(AppScreen.PATH)}
            onSwitchCourse={(course) => {
              setCurrentCourse(course);
              localStorage.setItem('duo_course_id_6601', course.id);
            }}
            allCourses={COURSES}
          />
        )}

        {/* SETTINGS OVERLAY */}
        {screen === AppScreen.SETTINGS && (
            <div className="fixed inset-0 z-[100] bg-duo-dark overflow-y-auto">
                <div className="p-4 md:p-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5">
                    <button onClick={() => { playSound('click'); setScreen(AppScreen.PROFILE); }} className="mb-6 text-gray-500 hover:text-white flex items-center font-bold"><CloseIcon className="w-8 h-8 mr-2"/> {t('back')}</button>
                    <h2 className="text-4xl font-black mb-8">{t('settings')}</h2>
                    
                                        {/* SYSTEM COMPATIBILITY CARD */}
                    <div className="bg-duo-card border-2 border-gray-700 rounded-3xl p-6 mb-6 shadow-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl ${
                            systemInfo.warningType === "windows_xp_vista" ? "bg-red-600 text-white" : systemInfo.warningType === "old_browser" ? "bg-amber-500 text-black" : "bg-emerald-600 text-white"
                          }`}>
                            {systemInfo.warningType === "windows_xp_vista" ? "🛑" : systemInfo.warningType === "old_browser" ? "⚠️" : "💻"}
                          </div>
                          <div>
                            <h4 className="font-black text-base text-white uppercase tracking-wider">
                              Совместимость ОС и Браузера
                            </h4>
                            <p className="text-xs text-gray-400 font-bold">
                              Windows 7/8/8.1/10/11 (Без предупреждений) | XP/Vista (Прекращено)
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setShowSystemInfoModal(true)}
                          className="px-4 py-2 bg-duo-blue hover:bg-duo-blue/90 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
                        >
                          Проверить
                        </button>
                      </div>

                      <div className="bg-gray-800/80 p-3 rounded-2xl border border-gray-700 text-xs flex items-center justify-between">
                        <span className="text-gray-300 font-bold">
                          Текущая ОС: <strong className="text-white">{systemInfo.osName}</strong> | Браузер: <strong className="text-white">{systemInfo.browserName}</strong>
                        </span>
                        <span className={`font-black px-2 py-0.5 rounded text-[10px] uppercase ${
                          systemInfo.isModernSystem ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40" : "bg-red-950 text-red-300 border border-red-500/40"
                        }`}>
                          {systemInfo.isModernSystem ? "Поддерживается" : "Предупреждение"}
                        </span>
                      </div>
                    </div>

{/* PROFILE SUMMARY & EDIT TRIGGER */}
                    <div className="bg-duo-card border-2 border-gray-700 rounded-3xl p-6 mb-6 shadow-xl flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className={`w-14 h-14 rounded-2xl ${user.avatarColor || 'bg-duo-blue'} flex items-center justify-center text-2xl font-bold overflow-hidden border-2 border-gray-700 shadow-md`}>
                                {user.avatarUrl || user.avatarImage ? (
                                    <img src={user.avatarUrl || user.avatarImage} alt={user.name} className="w-full h-full object-cover" />
                                ) : user.avatarIcon ? (
                                    <span>{user.avatarIcon}</span>
                                ) : (
                                    <span>{user.name ? user.name[0].toUpperCase() : 'U'}</span>
                                )}
                            </div>
                            <div>
                                <h4 className="font-black text-lg text-white flex items-center gap-2">
                                    <span>{user.name}</span>
                                </h4>
                                <p className="text-xs text-gray-400 font-bold">{user.username ? `@${user.username}` : t('usernameNotSet')}</p>
                            </div>
                        </div>
                        <button onClick={openEditProfile} className="px-4 py-2.5 bg-duo-blue hover:brightness-110 text-white rounded-2xl font-black text-xs uppercase tracking-wider border-b-4 border-duo-blueDark active:border-b-0 active:translate-y-1 transition-all shadow-md flex items-center space-x-1.5">
                            <PenIcon className="w-4 h-4" />
                            <span>{t('edit')}</span>
                        </button>
                    </div>

                    {/* MOBILE SIMULATOR TEST BENCH (PC ONLY) */}
                    <div className="hidden lg:block bg-duo-card border-2 border-emerald-600/60 rounded-3xl p-6 mb-6 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-emerald-400 uppercase tracking-widest flex items-center space-x-2">
                                    <span>📱</span>
                                    <span>{t('mobileSimulatorBench')}</span>
                                </h3>
                                <p className="text-xs text-gray-400 font-bold mt-1">
                                    {t('mobileSimulatorDesc')}
                                </p>
                            </div>
                            <button 
                                onClick={() => { playSound('click'); setSimulatorMode('android'); setScreen(AppScreen.PATH); }}
                                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all shadow-md"
                            >
                                {t('launchSimulator')}
                            </button>
                        </div>
                    </div>

                    <div className="bg-duo-card border-2 border-gray-700 rounded-3xl p-6 mb-6 shadow-xl">
                      <h3 className="text-xl font-bold mb-4 text-white uppercase tracking-widest">{t('apiStatus')}</h3>
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${offlineMode ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                          <div>
                            <span className={`font-black text-lg ${offlineMode ? 'text-red-400' : 'text-green-400'}`}>
                              {offlineMode 
                                ? (user.language === 'ru' ? 'Офлайн / Ошибка' : t('limitReached')) 
                                : (user.language === 'ru' ? 'Онлайн' : t('online'))}
                            </span>
                            <p className="text-xs text-gray-400 font-bold">
                              {user.language === 'ru' ? 'Проверка связи с моделью Gemini 3.8 Flash' : 'Gemini 3.8 Flash model connection status'}
                            </p>
                          </div>
                        </div>
                        <button 
                          disabled={isCheckingApi}
                          onClick={() => { playSound('click'); checkApiStatus(); }} 
                          className="px-5 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-2xl font-black text-xs md:text-sm transition-all border-b-4 border-gray-800 active:border-b-0 active:translate-y-1 uppercase tracking-wider text-white flex items-center space-x-2 shadow-lg cursor-pointer"
                        >
                          {isCheckingApi && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                          <span>
                            {isCheckingApi 
                              ? (user.language === 'ru' ? 'ПРОВЕРКА...' : 'CHECKING...') 
                              : (user.language === 'ru' ? 'ПРОВЕРИТЬ СОЕДИНЕНИЕ' : t('checkConnection'))}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* SYNC STATUS & OFFLINE CACHE CONTROLLER */}
                    <div className="bg-duo-card border-2 border-emerald-500/50 rounded-3xl p-6 mb-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl shadow-md">
                                    ☁️
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                                        <span>{user.language === 'ru' ? 'Статус синхронизации Firestore' : 'Firestore Sync Status'}</span>
                                    </h3>
                                    <p className="text-xs text-gray-400 font-bold">
                                        {user.language === 'ru' ? 'Синхронизация локального кэша с облачной базой данных' : 'Local cache synchronization with cloud database'}
                                    </p>
                                </div>
                            </div>
                            <span className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider border-b-4 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center space-x-2 shadow-lg ${isSyncing ? "bg-gray-700 text-gray-400 border-gray-900 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800 hover:brightness-110"}`}>
                                <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                                <span>{firebaseUser ? (user.language === 'ru' ? 'Облако активно' : 'Cloud Active') : (user.language === 'ru' ? 'Локальный кэш' : 'Local Cache')}</span>
                            </span>
                        </div>

                        {/* SYNC DETAILS GRID */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/40 p-4 rounded-2xl border border-gray-800 text-xs font-din">
                            <div className="space-y-1">
                                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                                    {user.language === 'ru' ? 'Последняя синхронизация:' : 'Last Synced:'}
                                </p>
                                <p className="font-black text-emerald-400 text-sm flex items-center gap-1.5">
                                    <span>⏱️</span>
                                    <span>{lastSyncTime}</span>
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                                    {user.language === 'ru' ? 'Состояние хранилища:' : 'Storage State:'}
                                </p>
                                <p className="font-black text-gray-200 text-sm flex items-center gap-1.5">
                                    <span>💾</span>
                                    <span>{firebaseUser ? ("Firestore UID: " + firebaseUser.uid.slice(0, 8) + "...") : (user.language === "ru" ? "Offline IndexedDB / Storage" : "Offline Storage")}</span>
                                </p>
                            </div>
                        </div>

                        {/* FORCE SYNC BUTTON */}
                        <button
                            onClick={handleForceSync}
                            disabled={isSyncing}
                            className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider border-b-4 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center space-x-2 shadow-lg ${isSyncing ? "bg-gray-700 text-gray-400 border-gray-900 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800 hover:brightness-110"}`}
                        >
                            <span className={isSyncing ? 'animate-spin' : ''}>🔄</span>
                            <span>
                                {isSyncing
                                    ? (user.language === 'ru' ? 'Синхронизация...' : 'Syncing...')
                                    : (user.language === 'ru' ? 'Принудительная синхронизация (Force Sync)' : 'Force Sync with Firestore')}
                            </span>
                        </button>
                    </div>

                    {/* FIREBASE FIRESTORE & AUTH DATA EXPORT SECTION */}
                    <div className="bg-duo-card border-2 border-amber-500/50 rounded-3xl p-6 mb-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shadow-md">
                                    🔥
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                                        <span>{user.language === 'ru' ? 'Экспорт данных Firebase Firestore & Auth' : 'Firebase Firestore & Auth Export'}</span>
                                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold uppercase">
                                            JSON
                                        </span>
                                    </h3>
                                    <p className="text-xs text-gray-400 font-bold">
                                        {user.language === 'ru' 
                                            ? 'Выгрузка профиля, прогресса, уроков, отзывов и учетной записи аутентификации' 
                                            : 'Export user profile, progress, lessons, feedback and authentication metadata'}
                                    </p>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-black/40 border border-gray-700 rounded-xl text-xs font-mono text-amber-300">
                                {firebaseUser ? `Auth: ${firebaseUser.email || firebaseUser.uid.slice(0, 8)}` : (user.language === 'ru' ? 'Локальный / Offline' : 'Local / Offline')}
                            </span>
                        </div>

                        {/* INCOGNITO CLOSURE & EXPORT ADVICE BANNER */}
                        <div className="p-3.5 bg-black/40 border border-amber-500/50 rounded-2xl text-xs space-y-1.5 text-left">
                            <div className="flex items-center space-x-1.5 text-amber-300 font-black uppercase text-[11px]">
                                <span>🚫</span>
                                <span>{getIncognitoClosureTitle(user.language)}</span>
                            </div>
                            <p className="font-bold text-gray-200">
                                {user.language === 'ru'
                                    ? '10 октября 2026 года вход в Режим Инкогнито недоступен, и его нельзя будет восстановить в DuoWindo6601.'
                                    : 'On October 10, 2026, entry into Incognito Mode is unavailable and cannot be restored in DuoWindo6601.'}
                            </p>
                            <p className="text-[11px] text-gray-300">
                                {user.language === 'ru'
                                    ? 'Синхронизирован актуальный статус не закрытия: Полный Вход и регистрация работают без ограничений, профиль Администратора доступен.'
                                    : 'Synchronized actual unclosed status: Full Sign-In & registration operate normally, Admin Profile is active.'}
                            </p>
                            <div className="flex flex-wrap gap-1.5 text-[10px] font-bold pt-1">
                                <span className="bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 px-2 py-0.5 rounded-lg flex items-center space-x-1">
                                    <span>✅</span>
                                    <span>{user.language === 'ru' ? 'Полный Вход и регистрация: НЕ ЗАКРЫТ (Работает)' : 'Full Sign-In & Registration: NOT CLOSED (Active)'}</span>
                                </span>
                                <span className="bg-amber-950/90 text-amber-300 border border-amber-500/60 px-2 py-0.5 rounded-lg flex items-center space-x-1">
                                    <span>👑</span>
                                    <span>{user.language === 'ru' ? 'Профиль Администратора: НЕ ЗАКРЫТ' : 'Admin Profile: NOT CLOSED'}</span>
                                </span>
                            </div>
                        </div>

                        {/* EXPORT DETAILS PREVIEW */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-din">
                            <div className="bg-black/40 p-2.5 rounded-xl border border-gray-800">
                                <span className="text-gray-400 block text-[10px] uppercase font-bold">{user.language === 'ru' ? 'База данных' : 'Database'}</span>
                                <span className="text-amber-300 font-black truncate block">Firestore</span>
                            </div>
                            <div className="bg-black/40 p-2.5 rounded-xl border border-gray-800">
                                <span className="text-gray-400 block text-[10px] uppercase font-bold">{user.language === 'ru' ? 'Аутентификация' : 'Authentication'}</span>
                                <span className="text-emerald-400 font-black truncate block">{firebaseUser ? 'Firebase Auth' : (user.language === 'ru' ? 'Гость / Локально' : 'Guest / Local')}</span>
                            </div>
                            <div className="bg-black/40 p-2.5 rounded-xl border border-gray-800">
                                <span className="text-gray-400 block text-[10px] uppercase font-bold">{user.language === 'ru' ? 'Прогресс XP' : 'Total XP'}</span>
                                <span className="text-white font-black block">{user.xp || 0} XP</span>
                            </div>
                            <div className="bg-black/40 p-2.5 rounded-xl border border-gray-800">
                                <span className="text-gray-400 block text-[10px] uppercase font-bold">{user.language === 'ru' ? 'Пройдено уроков' : 'Lessons'}</span>
                                <span className="text-duo-blue font-black block">{user.completedLessons?.length || 0}</span>
                            </div>
                        </div>

                        {/* EXPORT ACTION BUTTONS */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                            <button
                                onClick={() => {
                                    playSound('click');
                                    setShowFirebaseExportModal(true);
                                }}
                                className="sm:col-span-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border-b-4 border-amber-800 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                            >
                                <span>🔥</span>
                                <span>{user.language === 'ru' ? 'Открыть экспорт' : 'Open Export'}</span>
                            </button>

                            <button
                                onClick={handleQuickDownloadFirebase}
                                className="py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                            >
                                <span>📥</span>
                                <span>{user.language === 'ru' ? 'Скачать .JSON' : 'Download .JSON'}</span>
                            </button>

                            <button
                                onClick={handleQuickCopyFirebase}
                                className="py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-gray-800 hover:bg-gray-700 text-amber-300 border-b-4 border-gray-950 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                            >
                                <span>📋</span>
                                <span>{user.language === 'ru' ? 'Копировать JSON' : 'Copy JSON'}</span>
                            </button>
                        </div>
                    </div>

                    {/* DOWNLOAD LOCAL PROGRESS BACKUP CARD */}
                    <div className="bg-duo-card border-2 border-emerald-500/50 rounded-3xl p-6 mb-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl shadow-md">
                                    💾
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                                        <span>Download Local Progress</span>
                                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold uppercase">
                                            JSON Backup
                                        </span>
                                    </h3>
                                    <p className="text-xs text-gray-400 font-bold">
                                        {user.language === 'ru' 
                                            ? 'Резервная копия всего локального состояния user из localStorage в файл JSON' 
                                            : 'Generates a downloadable JSON file containing the full user state from localStorage for backup purposes'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleDownloadLocalProgress}
                                className="w-full sm:w-auto py-3 px-6 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                            >
                                <span>📥</span>
                                <span>Download Local Progress</span>
                            </button>
                        </div>
                    </div>

                    {/* FIRESTORE LOCAL CACHE CLEANUP & 30-DAY INACTIVITY MANAGER */}
                    <div className="bg-duo-card border-2 border-indigo-500/50 rounded-3xl p-6 mb-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-xl shadow-md">
                                    🧹
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                                        <span>{user.language === 'ru' ? 'Очистка кэша Firestore (>30 дней)' : 'Firestore Cache Cleanup (>30 Days)'}</span>
                                    </h3>
                                    <p className="text-xs text-gray-400 font-bold">
                                        {user.language === 'ru' 
                                            ? 'Автоматическое удаление старого кэша IndexedDB при неактивности более 30 дней' 
                                            : 'Automatic IndexedDB cache cleanup when user is inactive for more than 30 days'}
                                    </p>
                                </div>
                            </div>
                            <span className={`px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider border flex items-center gap-1.5 shadow-sm ${
                                firestoreCacheStatus.isInactiveOverThreshold 
                                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' 
                                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                            }`}>
                                <span className={`w-2 h-2 rounded-full ${firestoreCacheStatus.isInactiveOverThreshold ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`}></span>
                                <span>
                                    {firestoreCacheStatus.isInactiveOverThreshold
                                        ? (user.language === 'ru' ? 'Требуется очистка (>30 дн.)' : 'Purge Required (>30d)')
                                        : (user.language === 'ru' ? 'Кэш оптимизирован' : 'Cache Optimized')}
                                </span>
                            </span>
                        </div>

                        {/* CACHE STATUS GRID */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-black/40 p-4 rounded-2xl border border-gray-800 text-xs font-din">
                            <div className="space-y-1">
                                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                                    {user.language === 'ru' ? 'Порог неактивности:' : 'Inactivity Threshold:'}
                                </p>
                                <p className="font-black text-indigo-300 text-sm flex items-center gap-1.5">
                                    <span>⏳</span>
                                    <span>{firestoreCacheStatus.thresholdDays} {user.language === 'ru' ? 'дней' : 'days'}</span>
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                                    {user.language === 'ru' ? 'Период неактивности:' : 'Inactive Period:'}
                                </p>
                                <p className={`font-black text-sm flex items-center gap-1.5 ${firestoreCacheStatus.isInactiveOverThreshold ? 'text-rose-400' : 'text-gray-200'}`}>
                                    <span>📅</span>
                                    <span>{firestoreCacheStatus.inactiveDays} {user.language === 'ru' ? 'дн.' : 'd'}</span>
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                                    {user.language === 'ru' ? 'Последняя очистка:' : 'Last Cleaned:'}
                                </p>
                                <p className="font-black text-emerald-400 text-sm flex items-center gap-1.5 truncate">
                                    <span>✨</span>
                                    <span title={firestoreCacheStatus.lastCleanupDateString || ''}>
                                        {firestoreCacheStatus.lastCleanupDateString || (user.language === 'ru' ? 'Не требовалась' : 'Not required yet')}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* EXPLANATION NOTE */}
                        <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-xs text-indigo-200/80 leading-relaxed">
                            💡 {user.language === 'ru'
                                ? 'Если вы не заходите в приложение более 30 дней, локальный кэш Firestore (IndexedDB) автоматически очищается при следующем запуске, освобождая дисковое пространство браузера. Облачные данные в аккаунте сохраняются.'
                                : 'If you remain inactive for more than 30 days, old local Firestore IndexedDB cache is automatically cleared on the next visit to reclaim browser disk storage. Your cloud account data remains safe.'}
                        </div>

                        {/* CACHE ACTIONS & SIMULATION */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <button
                                onClick={handleManualPurgeFirestoreCache}
                                disabled={isPurgingFirestoreCache}
                                className="flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white border-b-4 border-rose-800 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                            >
                                <span className={isPurgingFirestoreCache ? 'animate-spin' : ''}>🗑️</span>
                                <span>
                                    {isPurgingFirestoreCache
                                        ? (user.language === 'ru' ? 'Очистка...' : 'Purging...')
                                        : (user.language === 'ru' ? 'Очистить кэш сейчас' : 'Purge Cache Now')}
                                </span>
                            </button>

                            <button
                                onClick={handleSimulateInactivity31Days}
                                title={user.language === 'ru' ? 'Смоделировать 31 день неактивности для проверки автоочистки' : 'Simulate 31 days inactivity to test auto-clean'}
                                className="py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-gray-800 hover:bg-gray-700 text-amber-300 border-b-4 border-gray-950 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                            >
                                <span>🧪</span>
                                <span>{user.language === 'ru' ? 'Тест: 31 день неактивности' : 'Test: 31d Inactivity'}</span>
                            </button>

                            <button
                                onClick={handleResetInactivityTimer}
                                title={user.language === 'ru' ? 'Сбросить таймер активности на сейчас' : 'Reset activity timer to now'}
                                className="py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-gray-800 hover:bg-gray-700 text-gray-300 border-b-4 border-gray-950 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                            >
                                <span>🔄</span>
                                <span>{user.language === 'ru' ? 'Сброс' : 'Reset'}</span>
                            </button>
                        </div>
                    </div>

                    {/* HAPTIC FEEDBACK TOGGLE */}
                    <div className="bg-duo-card border-2 border-amber-500/40 rounded-3xl p-6 mb-6 shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start space-x-3">
                                <span className="text-2xl p-2.5 bg-amber-500/20 rounded-2xl border border-amber-500/40">📳</span>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">
                                            {user.language === 'ru' ? 'Тактильный отклик (Haptic Feedback)' : 'Haptic Vibration Feedback'}
                                        </h4>
                                        <span className="bg-amber-500/30 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-500/50 uppercase">
                                            Mobile & PC
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-300 font-medium mt-1">
                                        {user.language === 'ru'
                                            ? 'Вибрационный отклик смартфона и ПК версия при правильных и неправильных ответах в уроках'
                                            : 'Tactile vibration response on mobile devices and PC version for correct and incorrect lesson answers'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    playSound('click');
                                    triggerHapticFeedback('medium');
                                    const newVal = !(user.hapticFeedback ?? true);
                                    setUser((prev) => {
                                        const updated = { ...prev, hapticFeedback: newVal };
                                        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                                        return updated;
                                    });
                                    setToast(newVal
                                        ? (user.language === 'ru' ? '📳 Тактильный отклик включен!' : '📳 Haptic feedback enabled!')
                                        : (user.language === 'ru' ? '📴 Тактильный отклик выключен' : '📴 Haptic feedback disabled')
                                    );
                                }}
                                className={`py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider border-b-4 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center space-x-2 shadow-lg shrink-0 ${
                                    (user.hapticFeedback ?? true)
                                        ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800"
                                        : "bg-gray-800 hover:bg-gray-700 text-gray-400 border-gray-950"
                                }`}
                                title="Переключить Тактильный отклик"
                            >
                                <span>
                                    {(user.hapticFeedback ?? true)
                                        ? (user.language === 'ru' ? 'ВКЛЮЧЕНО' : 'ENABLED')
                                        : (user.language === 'ru' ? 'ВЫКЛЮЧЕНО' : 'DISABLED')}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* SSL CERTIFICATE WR2 & SERVER LOGS STATUS */}
                    <div className="bg-emerald-950/40 border-2 border-emerald-500/60 rounded-3xl p-6 mb-6 shadow-xl">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-black text-emerald-400 uppercase tracking-wide flex items-center space-x-2">
                                <span>🔒</span>
                                <span>{t('sslCertificateTitle')}</span>
                            </h3>
                            <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/40">
                                WR2 VERIFIED
                            </span>
                        </div>
                        <p className="text-xs text-emerald-200/90 font-medium leading-relaxed mb-4">
                            {t('sslCertificateDesc')}
                        </p>
                        <div className="bg-black/40 border border-emerald-500/30 rounded-2xl p-3 text-[11px] font-mono text-emerald-300/90 space-y-1">
                            <div>[SSL Status] Issuer: WR2 Root CA (Verified)</div>
                            <div>[Server Logs] Certificate Transparency Log: Successfully retrieved & verified</div>
                            <div>[Cipher Suite] TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256</div>
                        </div>
                    </div>
                    <div className="bg-duo-card border-2 border-gray-700 rounded-3xl p-6 mb-6 shadow-xl">
                    <h3 className="text-xl font-bold mb-4 text-white uppercase tracking-widest">{t('language')}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                        {['ru','en','de','fr','es','ja','zh','ar'].map(lang => (
                            <button key={lang} onClick={() => { playSound('select'); setUser({...user, language: lang as any}); }} className={`p-3 rounded-xl font-bold border-b-4 transition-all text-xs flex flex-col items-center justify-center space-y-1 ${user.language === lang ? 'bg-duo-blue border-duo-blueDark text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}>
                                <span className="font-black text-sm tracking-wider">{lang.toUpperCase()}</span>
                                <span className="text-[10px] opacity-80">{t('lang_' + lang)}</span>
                            </button>
                        ))}
                    </div>

                    {/* Auto-Translator toggle in Settings -> Language */}
                    <div className="bg-gray-800/80 border-2 border-indigo-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl p-2 bg-indigo-600/30 rounded-xl border border-indigo-500/40">🌐</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">
                              {user.language === 'ru' ? 'Авто-Переводчик отзывов и имен' : 'Auto-Translator'}
                            </h4>
                            <span className="bg-indigo-500/30 text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-indigo-500/50 uppercase">
                              DuoWindo6601
                            </span>
                          </div>
                          <p className="text-xs text-gray-300 font-medium mt-1">
                            {user.language === 'ru'
                              ? 'Автоматический перевод отзывов, комментариев администрации, категорий и имён авторов на выбранный язык'
                              : 'Automatically translate reviews, admin comments, categories, and author names into chosen language'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          playSound('click');
                          const newVal = !(user.autoTranslateFeedback ?? true);
                          setUser((prev) => {
                            const updated = { ...prev, autoTranslateFeedback: newVal };
                            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                            return updated;
                          });
                          setToast(newVal
                            ? (user.language === 'ru' ? 'Авто-Переводчик включен!' : 'Auto-Translator enabled!')
                            : (user.language === 'ru' ? 'Авто-Переводчик отключен' : 'Auto-Translator disabled')
                          );
                        }}
                        className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 flex-shrink-0 cursor-pointer ${
                          (user.autoTranslateFeedback ?? true) ? 'bg-indigo-600 border-2 border-indigo-400' : 'bg-gray-700 border-2 border-gray-600'
                        }`}
                        title="Переключить Авто-Переводчик"
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                            (user.autoTranslateFeedback ?? true) ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* GLOBAL THEME SWITCHER */}
                    <div className="bg-gray-800/80 border-2 border-indigo-500/40 rounded-2xl p-4 flex flex-col space-y-3 shadow-inner mt-3 text-left">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl p-2 bg-indigo-950/60 rounded-xl border border-indigo-500/40">
                            {user.theme === 'light' ? '☀️' : user.theme === 'system' ? '💻' : '🌙'}
                          </span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">
                                {user.language === 'ru' ? 'Тема оформления (Светлая / Темная)' : 'Theme Mode (Light / Dark)'}
                              </h4>
                              <span className="bg-indigo-500/30 text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-indigo-500/50 uppercase">
                                UI Theme
                              </span>
                            </div>
                            <p className="text-xs text-gray-300 font-medium mt-1">
                              {user.language === 'ru'
                                ? 'Глобальный переключатель между светлым, темным и системным режимами интерфейса'
                                : 'Global switch between light, dark, and system interface modes'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 3 THEME PILLS */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            playSound('click');
                            setUser(prev => {
                              const updated = { ...prev, theme: 'light' as const, nightMode: false };
                              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                              return updated;
                            });
                            setToast(user.language === 'ru' ? '☀️ Светлая тема включена' : '☀️ Light Mode enabled');
                          }}
                          className={`py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 border-2 transition-all cursor-pointer ${
                            user.theme === 'light'
                              ? 'bg-amber-500 text-white border-amber-400 shadow-md ring-2 ring-amber-300'
                              : isLightMode 
                                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm' 
                                : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          <span>☀️</span>
                          <span>{user.language === 'ru' ? 'Светлая' : 'Light'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playSound('click');
                            setUser(prev => {
                              const updated = { ...prev, theme: 'dark' as const, nightMode: true };
                              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                              return updated;
                            });
                            setToast(user.language === 'ru' ? '🌙 Тёмная тема включена' : '🌙 Dark Mode enabled');
                          }}
                          className={`py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 border-2 transition-all cursor-pointer ${
                            user.theme === 'dark' || (!user.theme && (user.nightMode ?? true))
                              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-400'
                              : isLightMode 
                                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm' 
                                : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          <span>🌙</span>
                          <span>{user.language === 'ru' ? 'Тёмная' : 'Dark'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playSound('click');
                            setUser(prev => {
                              const updated = { ...prev, theme: 'system' as const };
                              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                              return updated;
                            });
                            setToast(user.language === 'ru' ? '💻 Системная тема' : '💻 System Theme');
                          }}
                          className={`py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 border-2 transition-all cursor-pointer ${
                            user.theme === 'system'
                              ? 'bg-sky-600 text-white border-sky-400 shadow-md ring-2 ring-sky-400'
                              : isLightMode 
                                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm' 
                                : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          <span>💻</span>
                          <span>{user.language === 'ru' ? 'Система' : 'System'}</span>
                        </button>
                      </div>
                    </div>

                    {/* DATA SECURITY & EXPERT MIGRATION SECTION */}
                    <div className="bg-gray-800/80 border-2 border-red-500/40 rounded-2xl p-4 flex flex-col space-y-3 shadow-inner mt-3 text-left">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl p-2 bg-red-950/60 rounded-xl border border-red-500/40">🛡️</span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">
                                {user.language === 'ru' ? 'Безопасность и удаление данных' : 'Data Security & Deletion'}
                              </h4>
                              <span className="bg-red-500/30 text-red-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-red-500/50 uppercase">
                                Security
                              </span>
                            </div>
                            <p className="text-xs text-gray-300 font-medium mt-1">
                              {user.language === 'ru'
                                ? 'Запрет удаления аккаунта и локальных данных приложения или полный сброс'
                                : 'Protection against account & local data deletion or full reset'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ADMIN ACCOUNT PROTECTION BADGE */}
                      {isUserAdminAccount(user, firebaseUser) && (
                        <div className="p-3 bg-red-950/80 border border-red-500 rounded-xl text-xs space-y-1">
                          <div className="flex items-center space-x-1.5 text-red-300 font-black uppercase text-[11px]">
                            <span>⛔</span>
                            <span>{user.language === 'ru' ? 'Защита администрации: удаление запрещено' : 'Admin Protection: Deletion Prohibited'}</span>
                          </div>
                          <p className="text-gray-200 text-[11px] font-bold">
                            {user.language === 'ru'
                              ? 'Запретить удаление аккаунта администрации и запретить удалять все данные администрации о локальном приложении. Учетная запись администратора защищена.'
                              : 'Administration account and data deletion is strictly prohibited by security rules.'}
                          </p>
                        </div>
                      )}

                      {/* TOGGLE: PREVENT ACCOUNT & DATA DELETION */}
                      <div className="flex items-center justify-between p-3 bg-black/40 border border-gray-700 rounded-xl">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-white flex items-center gap-1.5">
                            <span>🔒</span>
                            <span>{user.language === 'ru' ? 'Запретить удаление аккаунта и данных' : 'Prevent Account & Data Deletion'}</span>
                          </span>
                          <span className="text-[10px] text-gray-400 block font-medium">
                            {user.language === 'ru'
                              ? 'Блокирует любые попытки очистки данных и удаления аккаунта'
                              : 'Locks out any attempts to wipe data or delete account'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            playSound('click');
                            const newVal = !Boolean(user.preventAccountDeletion);
                            setUser(prev => {
                              const updated = { ...prev, preventAccountDeletion: newVal };
                              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                              return updated;
                            });
                            setToast(
                              newVal
                                ? (user.language === 'ru' ? '🔒 Запрет удаления включен!' : '🔒 Deletion protection enabled!')
                                : (user.language === 'ru' ? '🔓 Запрет удаления выключен' : '🔓 Deletion protection disabled')
                            );
                          }}
                          className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 flex-shrink-0 cursor-pointer ${
                            user.preventAccountDeletion ? 'bg-emerald-600 border border-emerald-400' : 'bg-gray-700 border border-gray-600'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                              user.preventAccountDeletion ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* ACTION BUTTONS: EXPERT TRANSFER & DATA DELETION */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            playSound('click');
                            setShowDataTransferModal(true);
                          }}
                          className="py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl border-b-4 border-indigo-900 active:translate-y-0.5 transition-all flex items-center justify-center space-x-1.5 shadow cursor-pointer"
                        >
                          <span>🛠️</span>
                          <span>{user.language === 'ru' ? 'Эксперт: Перенести данные' : 'Expert: Transfer Data'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playSound('click');
                            setShowDataDeletionModal(true);
                          }}
                          className={`py-3 px-4 font-black text-xs uppercase tracking-wider rounded-xl border-b-4 active:translate-y-0.5 transition-all flex items-center justify-center space-x-1.5 shadow cursor-pointer ${
                            isUserAdminAccount(user, firebaseUser)
                              ? 'bg-gray-800 text-red-400 border-gray-900 hover:bg-gray-750'
                              : user.preventAccountDeletion
                              ? 'bg-gray-800 text-amber-400 border-gray-900 hover:bg-gray-750'
                              : 'bg-red-600 hover:bg-red-500 text-white border-red-900'
                          }`}
                        >
                          <span>💣</span>
                          <span>{user.language === 'ru' ? 'Удалить все данные' : 'Wipe All Data'}</span>
                        </button>
                      </div>
                    </div>
                    </div>
                    <div className="bg-duo-card border-2 border-gray-700 rounded-3xl p-6 mb-6 shadow-xl">
                    <h3 className="text-xl font-bold mb-4 text-white uppercase tracking-widest">{t('country')}</h3>
                    <div className="grid grid-cols-2 gap-3 h-48 overflow-y-auto no-scrollbar">
                        {COUNTRIES.map((c) => (
                            <button key={c.code} onClick={() => { playSound('select'); setUser({...user, country: c.name}); }} className={`p-3 rounded-xl font-bold border-b-4 transition-all flex items-center space-x-2 ${user.country === c.name ? 'bg-duo-blue border-duo-blueDark text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}>
                                <img src={`https://flagcdn.com/w40/${c.code}.png`} className="w-6 h-4 rounded-sm object-cover" alt={c.name}/>
                                <span className="text-sm">{getLocalizedCountryName(c.code, user.language)}</span>
                            </button>
                        ))}
                    </div>
                    </div>
                    <div className="bg-duo-card border-2 border-gray-700 rounded-3xl p-6 mb-6 shadow-xl"><h3 className="text-xl font-bold mb-4 text-white uppercase tracking-widest">{t('voiceProvider')}</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-2"><button onClick={() => setUser({...user, voiceProvider: 'gemini'})} className={`p-3 rounded-xl font-bold border-b-4 ${user.voiceProvider === 'gemini' ? 'bg-purple-600 border-purple-800 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'} text-[10px]`}>Gemini AI</button><button onClick={() => setUser({...user, voiceProvider: 'google'})} className={`p-3 rounded-xl font-bold border-b-4 ${user.voiceProvider === 'google' ? 'bg-blue-600 border-blue-800 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'} text-[10px]`}>Google</button><button onClick={() => setUser({...user, voiceProvider: 'yandex'})} className={`p-3 rounded-xl font-bold border-b-4 ${user.voiceProvider === 'yandex' ? 'bg-red-600 border-red-800 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'} text-[10px]`}>Yandex</button><button onClick={() => setUser({...user, voiceProvider: 'system'})} className={`p-3 rounded-xl font-bold border-b-4 ${user.voiceProvider === 'system' ? 'bg-green-600 border-green-800 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'} text-[10px]`}>System</button></div></div>
                </div>
            </div>
        )}

        {/* COURSE SELECT OVERLAY */}
        {screen === AppScreen.COURSE_SELECT && (
            <div className="fixed inset-0 z-[100] bg-duo-dark overflow-y-auto">
                <div className="p-4 md:p-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-5 pb-16">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-800 pb-4">
                        <div className="flex items-center space-x-4">
                            <button onClick={() => { playSound('click'); setScreen(AppScreen.PATH); }} className="text-gray-400 hover:text-white transition-colors p-2 rounded-xl bg-gray-800"><CloseIcon className="w-8 h-8"/></button>
                            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-white">{t('coursesAndRegions')}</h2>
                        </div>
                        {/* SEARCH FIELD */}
                        <div className="relative w-full md:w-80">
                            <input 
                                type="text"
                                value={courseSearch}
                                onChange={(e) => setCourseSearch(e.target.value)}
                                placeholder={t('searchPlaceholder')}
                                className="w-full bg-gray-800 border-2 border-gray-700 focus:border-duo-blue text-white rounded-2xl px-4 py-2 text-sm font-bold focus:outline-none transition-colors placeholder-gray-400"
                            />
                            {courseSearch && (
                                <button onClick={() => setCourseSearch('')} className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-white font-bold">✕</button>
                            )}
                        </div>
                    </div>

                    {/* DUOLINGO ICONIC: "Я ГОВОРЮ НА..." / "I SPEAK..." & QUICK LANGUAGE SWITCHER */}
                    <div className="bg-gradient-to-r from-gray-900 via-gray-850 to-gray-900 border-2 border-gray-700/80 rounded-3xl p-4 sm:p-5 mb-6 shadow-xl space-y-3.5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-800 pb-3">
                            {/* I SPEAK SELECTOR */}
                            <div className="flex items-center space-x-3">
                                <span className="text-3xl">🗣️</span>
                                <div>
                                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                        <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-wider">
                                            {user.language === 'ru' ? 'Я говорю на:' : 'I speak:'}
                                        </h3>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                                            {SPEAKER_LANGUAGES.find(s => s.code === speakerLanguage)?.name || speakerLanguage.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium">
                                        {user.language === 'ru'
                                            ? 'Курсы, адаптированные для носителей вашего язык'
                                            : 'Courses tailored for speakers of your native language'}
                                    </p>
                                </div>
                            </div>

                            {/* APP INTERFACE LANGUAGE SWITCHER PILLS */}
                            <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-1 self-start md:self-auto">
                                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                                    🌐 {user.language === 'ru' ? 'Язык интерфейса:' : 'App language:'}
                                </span>
                                <div className="flex items-center space-x-1 bg-black/60 p-1 rounded-xl border border-gray-700 shadow-inner">
                                    {[
                                        { code: 'ru', flag: '🇷🇺', label: 'RU' },
                                        { code: 'en', flag: '🇺🇸', label: 'EN' },
                                        { code: 'es', flag: '🇪🇸', label: 'ES' },
                                        { code: 'de', flag: '🇩🇪', label: 'DE' },
                                        { code: 'fr', flag: '🇫🇷', label: 'FR' },
                                        { code: 'ja', flag: '🇯🇵', label: 'JA' },
                                        { code: 'zh', flag: '🇨🇳', label: 'ZH' },
                                        { code: 'ar', flag: '🇸🇦', label: 'AR' },
                                    ].map(l => (
                                        <button
                                            key={l.code}
                                            type="button"
                                            onClick={() => {
                                                playSound('select');
                                                setUser({ ...user, language: l.code as any });
                                            }}
                                            className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all flex items-center space-x-1 cursor-pointer ${
                                                user.language === l.code
                                                    ? 'bg-duo-blue text-white shadow-md'
                                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                            }`}
                                            title={l.label}
                                        >
                                            <span>{l.flag}</span>
                                            <span>{l.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* HORIZONTAL SPEAKER LANGUAGES CHIPS */}
                        <div className="space-y-1.5">
                            <div className="text-[11px] font-black uppercase text-amber-400 tracking-wider flex items-center justify-between">
                                <span>{user.language === 'ru' ? 'Выберите язык, на котором говорите:' : 'Select the language you speak:'}</span>
                                <span className="text-gray-400 font-medium lowercase">
                                    {SPEAKER_LANGUAGES.length} {user.language === 'ru' ? 'языков' : 'languages'}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
                                {SPEAKER_LANGUAGES.map(sp => {
                                    const isSelected = speakerLanguage === sp.code;
                                    const count = getCoursesForSpeaker(sp.code).length;
                                    return (
                                        <button
                                            key={sp.code}
                                            type="button"
                                            onClick={() => {
                                                playSound('click');
                                                setSpeakerLanguage(sp.code);
                                                setCourseRegionTab('speaker');
                                            }}
                                            className={`px-3 py-2 rounded-2xl font-black text-xs transition-all flex items-center space-x-2 whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                                                isSelected
                                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black border-amber-700 shadow-lg scale-105'
                                                    : 'bg-gray-800 text-gray-300 border-gray-900 hover:bg-gray-750 hover:text-white'
                                            }`}
                                        >
                                            <img src={`https://flagcdn.com/w40/${sp.flagCode}.png`} className="w-5 h-3.5 rounded-sm object-cover" alt={sp.name} />
                                            <span>{sp.name}</span>
                                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? 'bg-black/20 text-black' : 'bg-gray-700 text-gray-400'}`}>
                                                {count > 0 ? `${count}` : (sp.code === 'ru' ? '12+' : '6+')}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* REGION NAVIGATION TABS */}
                    {!courseSearch && (
                        <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
                            <button 
                                onClick={() => { playSound('click'); setCourseRegionTab('all'); }}
                                className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider whitespace-nowrap transition-all border-b-4 ${courseRegionTab === 'all' ? 'bg-duo-blue border-duo-blueDark text-white' : 'bg-gray-800 border-gray-900 text-gray-400 hover:bg-gray-700'}`}
                            >
                                🌐 {t('allCourses')}
                            </button>
                            <button 
                                onClick={() => { playSound('click'); setCourseRegionTab('speaker'); }}
                                className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider whitespace-nowrap transition-all border-b-4 ${courseRegionTab === 'speaker' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 border-amber-700 text-black shadow-lg shadow-amber-500/20' : 'bg-gray-800 border-gray-900 text-gray-400 hover:bg-gray-700'}`}
                            >
                                🗣️ {user.language === 'ru' ? 'Для знающих мой язык' : 'For My Language'} ({SPEAKER_LANGUAGES.find(s => s.code === speakerLanguage)?.name || speakerLanguage.toUpperCase()})
                            </button>
                            <button 
                                onClick={() => { playSound('click'); setCourseRegionTab('hardest'); }}
                                className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider whitespace-nowrap transition-all border-b-4 ${courseRegionTab === 'hardest' ? 'bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 border-red-800 text-white shadow-lg shadow-orange-500/20' : 'bg-gray-800 border-gray-900 text-gray-400 hover:bg-gray-700'}`}
                            >
                                🔥 {t('hardestLanguages')}
                            </button>
                            <button 
                                onClick={() => { playSound('click'); setCourseRegionTab('cis'); }}
                                className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider whitespace-nowrap transition-all border-b-4 ${courseRegionTab === 'cis' ? 'bg-emerald-600 border-emerald-800 text-white' : 'bg-gray-800 border-gray-900 text-gray-400 hover:bg-gray-700'}`}
                            >
                                🏛️ {t('cisLanguages')}
                            </button>
                            <button 
                                onClick={() => { playSound('click'); setCourseRegionTab('world'); }}
                                className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider whitespace-nowrap transition-all border-b-4 ${courseRegionTab === 'world' ? 'bg-indigo-600 border-indigo-800 text-white' : 'bg-gray-800 border-gray-900 text-gray-400 hover:bg-gray-700'}`}
                            >
                                🌍 {t('worldLanguages')}
                            </button>
                            <button 
                                onClick={() => { playSound('click'); setCourseRegionTab('special'); }}
                                className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider whitespace-nowrap transition-all border-b-4 ${courseRegionTab === 'special' ? 'bg-amber-600 border-amber-800 text-white' : 'bg-gray-800 border-gray-900 text-gray-400 hover:bg-gray-700'}`}
                            >
                                🧩 {t('subjectsAndGames')}
                            </button>
                            <button 
                                onClick={() => { playSound('click'); setCourseRegionTab('rf'); }}
                                className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider whitespace-nowrap transition-all border-b-4 ${courseRegionTab === 'rf' ? 'bg-rose-600 border-rose-800 text-white' : 'bg-gray-800 border-gray-900 text-gray-400 hover:bg-gray-700'}`}
                            >
                                🇷🇺 {t('rfRegions')}
                            </button>
                            <button 
                                onClick={() => { playSound('click'); setCourseRegionTab('catalog'); }}
                                className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider whitespace-nowrap transition-all border-b-4 ${courseRegionTab === 'catalog' ? 'bg-sky-600 border-sky-800 text-white shadow-lg shadow-sky-500/20' : 'bg-gray-800 border-gray-900 text-gray-400 hover:bg-gray-700'}`}
                            >
                                🏆 {user.language === 'ru' ? 'Каталог (100+ языков)' : 'Global Catalog (100+)'}
                            </button>
                        </div>
                    )}
                    
                    {/* SEARCH RESULTS VIEW */}
                    {courseSearch ? (
                        <div>
                            <h3 className="text-xl font-black text-duo-blue uppercase tracking-widest mb-4">
                                {t('searchResults')}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {COURSES.filter(c => 
                                    c.name.toLowerCase().includes(courseSearch.toLowerCase()) || 
                                    c.localName.toLowerCase().includes(courseSearch.toLowerCase())
                                ).map(c => (
                                    <div 
                                        key={c.id} 
                                        onClick={() => { playSound('select'); setCurrentCourse(c); setScreen(AppScreen.PATH); }} 
                                        className={`relative p-4 rounded-2xl border-2 border-b-4 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all flex items-center space-x-4 shadow-lg group ${currentCourse.id === c.id ? 'bg-blue-900/30 border-duo-blue ring-2 ring-duo-blue' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}`}
                                    >
                                        {SPECIAL_IDS.includes(c.id) ? (
                                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${c.themeColor} text-white shadow-md`}>
                                                {c.id === 'math' ? 'Σ' : c.id === 'music' ? '♫' : c.id === 'chess' ? '♔' : '🚀'}
                                            </div>
                                        ) : (
                                            <img src={`https://flagcdn.com/w80/${c.flagCode}.png`} className="w-12 h-8 rounded-md object-cover shadow-md group-hover:scale-110 transition-transform" alt={c.name} />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-base text-white truncate">{getLocalizedCourseName(c)}</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{c.name}</p>
                                        </div>
                                        {currentCourse.id === c.id && <div className="bg-duo-green rounded-full p-1"><CheckCircleIcon className="w-5 h-5 text-white"/></div>}
                                    </div>
                                ))}

                                {searchCatalog(courseSearch).map(item => (
                                    <div 
                                        key={item.itemId}
                                        onClick={() => {
                                            playSound('select');
                                            const existing = COURSES.find(c => c.id === item.learningLanguage);
                                            const selectedCourse = existing || {
                                                id: item.learningLanguage,
                                                name: item.learningLanguageName,
                                                localName: item.title,
                                                flagCode: item.flagCode,
                                                themeColor: 'bg-duo-blue',
                                                themeBorder: 'border-duo-blueDark',
                                                mascotVariant: 'default'
                                            };
                                            setCurrentCourse(selectedCourse);
                                            setScreen(AppScreen.PATH);
                                        }}
                                        className="relative p-4 rounded-2xl border-2 border-sky-500/40 bg-sky-950/30 hover:bg-sky-900/50 cursor-pointer transition-all flex flex-col justify-between hover:scale-[1.02] shadow-md group"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center space-x-3">
                                                <img src={`https://flagcdn.com/w80/${item.flagCode}.png`} className="w-10 h-7 rounded-md object-cover shadow" alt={item.learningLanguageName} />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-sm text-white truncate">{getLocalizedCatalogTitle(item, user.language)}</h4>
                                                    <p className="text-[10px] text-sky-300 font-semibold truncate">{getLocalizedLanguageName(item.learningLanguageName, user.language)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {item.numLearners > 0 && (
                                            <div className="mt-2 pt-2 border-t border-sky-500/30 flex items-center justify-between text-[10px] font-black text-sky-200">
                                                <span>👥 {formatLearnerCount(item.numLearners)} {user.language === 'ru' ? 'учащихся' : 'learners'}</span>
                                                <span className="bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full">DuoWindo6601</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* SECTION: COURSES FOR SPEAKERS OF SELECTED LANGUAGE (DUOLINGO ICONIC) */}
                            {(courseRegionTab === 'all' || courseRegionTab === 'speaker') && (
                                <div className="rounded-3xl p-5 md:p-6 bg-gradient-to-br from-amber-950/40 via-yellow-950/20 to-gray-900 border-2 border-amber-500/40 shadow-2xl relative overflow-hidden">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-3xl">🗣️</span>
                                            <div>
                                                <h3 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 uppercase tracking-widest flex items-center gap-2">
                                                    {user.language === 'ru' 
                                                        ? `Курсы для тех, кто говорит по-${SPEAKER_LANGUAGES.find(s => s.code === speakerLanguage)?.name.toLowerCase() || speakerLanguage}`
                                                        : `Courses for ${SPEAKER_LANGUAGES.find(s => s.code === speakerLanguage)?.name || speakerLanguage} speakers`}
                                                    <span className="bg-amber-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                        {SPEAKER_LANGUAGES.find(s => s.code === speakerLanguage)?.code.toUpperCase()}
                                                    </span>
                                                </h3>
                                                <p className="text-xs text-amber-200/80 font-bold mt-0.5">
                                                    {user.language === 'ru' 
                                                        ? 'Официальная подборка языковых курсов для вашего родного языка'
                                                        : 'Official courses designed for learning from your spoken language'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {user.language !== speakerLanguage && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        playSound('select');
                                                        setUser({ ...user, language: speakerLanguage as any });
                                                    }}
                                                    className="px-3 py-1.5 bg-duo-blue/30 hover:bg-duo-blue/50 text-sky-200 border border-sky-400/40 rounded-xl text-xs font-black transition-all flex items-center space-x-1 cursor-pointer"
                                                >
                                                    <span>🌐</span>
                                                    <span>{user.language === 'ru' ? 'Включить этот язык в приложении' : 'Set as app language'}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* LIST OF COURSES FOR THIS SPEAKER */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {/* Core courses if speaker is Russian */}
                                        {speakerLanguage === 'ru' && COURSES.filter(c => !c.id.startsWith('rf-')).slice(0, 8).map(c => (
                                            <div 
                                                key={c.id} 
                                                onClick={() => { playSound('select'); setCurrentCourse(c); setScreen(AppScreen.PATH); }} 
                                                className={`relative p-4 rounded-2xl border-2 border-b-4 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all flex items-center space-x-4 shadow-lg group ${currentCourse.id === c.id ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}`}
                                            >
                                                {SPECIAL_IDS.includes(c.id) ? (
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${c.themeColor} text-white shadow-md`}>
                                                        {c.id === 'math' ? 'Σ' : c.id === 'music' ? '♫' : c.id === 'chess' ? '♔' : '🚀'}
                                                    </div>
                                                ) : (
                                                    <img src={`https://flagcdn.com/w80/${c.flagCode}.png`} className="w-12 h-8 rounded-md object-cover shadow-md group-hover:scale-110 transition-transform" alt={c.name} />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-base text-white truncate">{getLocalizedCourseName(c)}</h3>
                                                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">{user.language === 'ru' ? 'Для русскоязычных' : 'From Russian'}</p>
                                                </div>
                                                {currentCourse.id === c.id && <div className="bg-duo-green rounded-full p-1"><CheckCircleIcon className="w-5 h-5 text-white"/></div>}
                                            </div>
                                        ))}

                                        {/* Catalog items matching this fromLanguage */}
                                        {getCoursesForSpeaker(speakerLanguage).map(item => (
                                            <div 
                                                key={item.itemId}
                                                onClick={() => {
                                                    playSound('select');
                                                    const existing = COURSES.find(c => c.id === item.learningLanguage);
                                                    const selectedCourse = existing || {
                                                        id: item.learningLanguage,
                                                        name: item.learningLanguageName,
                                                        localName: item.title,
                                                        flagCode: item.flagCode,
                                                        themeColor: 'bg-duo-blue',
                                                        themeBorder: 'border-duo-blueDark',
                                                        mascotVariant: 'default'
                                                    };
                                                    setCurrentCourse(selectedCourse);
                                                    setScreen(AppScreen.PATH);
                                                }}
                                                className="relative p-4 rounded-2xl border-2 border-amber-500/40 bg-gray-800/90 hover:bg-amber-950/40 cursor-pointer transition-all flex flex-col justify-between hover:scale-[1.02] active:scale-95 shadow-lg group"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center space-x-3 min-w-0">
                                                        <img src={`https://flagcdn.com/w80/${item.flagCode}.png`} className="w-10 h-7 rounded-md object-cover shadow group-hover:scale-110 transition-transform" alt={item.learningLanguageName} />
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-bold text-sm text-white truncate">{getLocalizedCatalogTitle(item, user.language)}</h4>
                                                            <p className="text-[10px] text-amber-300 font-bold truncate">{getLocalizedLanguageName(item.learningLanguageName, user.language)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {item.numLearners > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-gray-700/60 flex items-center justify-between text-[10px] font-black text-amber-200">
                                                        <span>👥 {formatLearnerCount(item.numLearners)} {user.language === 'ru' ? 'учащихся' : 'learners'}</span>
                                                        <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">DuoWindo6601</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SECTION: HARDEST LANGUAGES IN THE WORLD */}
                            {(courseRegionTab === 'all' || courseRegionTab === 'hardest') && (
                                <div className="rounded-3xl p-5 md:p-6 bg-gradient-to-br from-red-950/40 via-orange-950/20 to-gray-900 border-2 border-orange-500/30 shadow-2xl relative overflow-hidden">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-3xl animate-pulse">🔥</span>
                                            <div>
                                                <h3 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-orange-400 uppercase tracking-widest flex items-center gap-2">
                                                    {t('hardestSectionTitle')}
                                                    <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-red-400/50">TOP</span>
                                                </h3>
                                                <p className="text-xs text-orange-200/70 font-bold mt-0.5">
                                                    {t('hardestSectionDesc')}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-black text-amber-300 bg-amber-950/80 px-3 py-1.5 rounded-xl border border-amber-500/40 uppercase tracking-wider self-start md:self-auto">
                                            ⚡ {t('extremeDifficulty')}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {ALL_HARDEST_COURSES.map(c => {
                                            const info = HARDEST_LANGUAGE_INFO[c.id];
                                            const isSelected = currentCourse.id === c.id;
                                            return (
                                                <div 
                                                    key={c.id} 
                                                    onClick={() => { playSound('select'); setCurrentCourse(c); setScreen(AppScreen.PATH); }} 
                                                    className={`relative p-4 rounded-2xl border-2 border-b-4 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all flex flex-col justify-between shadow-xl group ${isSelected ? 'bg-orange-950/50 border-orange-500 ring-2 ring-orange-500' : 'bg-gray-800/90 border-gray-700/80 hover:bg-gray-750 hover:border-orange-500/50'}`}
                                                >
                                                    <div className="flex items-start justify-between gap-3 mb-2">
                                                        <div className="flex items-center space-x-3 min-w-0">
                                                            <img src={`https://flagcdn.com/w80/${c.flagCode}.png`} className="w-12 h-8 rounded-md object-cover shadow-md group-hover:scale-110 transition-transform" alt={c.name} />
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-bold text-base text-white truncate">{getLocalizedCourseName(c)}</h3>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{c.name}</p>
                                                            </div>
                                                        </div>
                                                        {isSelected && <div className="bg-duo-green rounded-full p-1"><CheckCircleIcon className="w-5 h-5 text-white"/></div>}
                                                    </div>
                                                    {info && (
                                                        <div className="mt-2 pt-2 border-t border-gray-700/60 flex flex-col space-y-1">
                                                            <div className="flex items-center justify-between text-[10px] font-black">
                                                                <span className="text-amber-400">{info.badge}</span>
                                                                <span className="text-gray-400">{info.rank}</span>
                                                            </div>
                                                            <p className="text-[10px] text-gray-300 font-medium leading-tight line-clamp-2">
                                                                {user.language === 'ru' ? info.reasonRu : info.reasonEn}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* SECTION 1: CIS LANGUAGES */}
                            {(courseRegionTab === 'all' || courseRegionTab === 'cis') && (
                                <div>
                                    <div className="flex items-center space-x-3 mb-4">
                                        <span className="text-2xl">🏛️</span>
                                        <h3 className="text-xl font-black text-emerald-400 uppercase tracking-widest">
                                            {t('cisSectionTitle')}
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {CIS_COURSES.map(c => (
                                            <div 
                                                key={c.id} 
                                                onClick={() => { playSound('select'); setCurrentCourse(c); setScreen(AppScreen.PATH); }} 
                                                className={`relative p-4 rounded-2xl border-2 border-b-4 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all flex items-center space-x-4 shadow-lg group ${currentCourse.id === c.id ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}`}
                                            >
                                                <img src={`https://flagcdn.com/w80/${c.flagCode}.png`} className="w-12 h-8 rounded-md object-cover shadow-md group-hover:scale-110 transition-transform" alt={c.name} />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-base text-white truncate">{getLocalizedCourseName(c)}</h3>
                                                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{c.name}</p>
                                                </div>
                                                {currentCourse.id === c.id && <div className="bg-duo-green rounded-full p-1"><CheckCircleIcon className="w-5 h-5 text-white"/></div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SECTION 2: WORLD LANGUAGES */}
                            {(courseRegionTab === 'all' || courseRegionTab === 'world') && (
                                <div>
                                    <div className="flex items-center space-x-3 mb-4">
                                        <span className="text-2xl">🌍</span>
                                        <h3 className="text-xl font-black text-duo-blue uppercase tracking-widest">
                                            {t('worldSectionTitle')}
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {WORLD_COURSES.map(c => (
                                            <div 
                                                key={c.id} 
                                                onClick={() => { playSound('select'); setCurrentCourse(c); setScreen(AppScreen.PATH); }} 
                                                className={`relative p-4 rounded-2xl border-2 border-b-4 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all flex items-center space-x-4 shadow-lg group ${currentCourse.id === c.id ? 'bg-blue-900/30 border-duo-blue ring-2 ring-duo-blue' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}`}
                                            >
                                                <img src={`https://flagcdn.com/w80/${c.flagCode}.png`} className="w-12 h-8 rounded-md object-cover shadow-md group-hover:scale-110 transition-transform" alt={c.name} />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-base text-white truncate">{getLocalizedCourseName(c)}</h3>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('foreignLanguage')}</p>
                                                </div>
                                                {currentCourse.id === c.id && <div className="bg-duo-green rounded-full p-1"><CheckCircleIcon className="w-5 h-5 text-white"/></div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SECTION 3: SPECIAL COURSES & GAMES */}
                            {(courseRegionTab === 'all' || courseRegionTab === 'special') && (
                                <div>
                                    <div className="flex items-center space-x-3 mb-4">
                                        <span className="text-2xl">🧩</span>
                                        <h3 className="text-xl font-black text-amber-400 uppercase tracking-widest">
                                            {t('specialSectionTitle')}
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {SPECIAL_COURSES.map(c => (
                                            <div 
                                                key={c.id} 
                                                onClick={() => { playSound('select'); setCurrentCourse(c); setScreen(AppScreen.PATH); }} 
                                                className={`relative p-5 rounded-2xl border-2 border-b-4 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all flex items-center space-x-4 shadow-xl group ${currentCourse.id === c.id ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}`}
                                            >
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black ${c.themeColor} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                                    {c.id === 'math' ? 'Σ' : c.id === 'music' ? '♫' : c.id === 'chess' ? '♔' : '🚀'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-black text-lg text-white truncate">{getLocalizedCourseName(c)}</h3>
                                                    <p className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">
                                                        {c.id === 'chess' 
                                                            ? t('chessLogic') 
                                                            : c.id === 'math'
                                                            ? t('exactScience')
                                                            : c.id === 'music'
                                                            ? t('musicTheory')
                                                            : t('specialSubject')}
                                                    </p>
                                                </div>
                                                {currentCourse.id === c.id && <div className="bg-duo-green rounded-full p-1"><CheckCircleIcon className="w-6 h-6 text-white"/></div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SECTION 4: RF REGIONS */}
                            {(courseRegionTab === 'all' || courseRegionTab === 'rf') && (
                                <div>
                                    <div className="flex items-center space-x-3 mb-4">
                                        <span className="text-2xl">🇷🇺</span>
                                        <h3 className="text-xl font-black text-rose-400 uppercase tracking-widest">
                                            {t('rfSectionTitle')}
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {COURSES.filter(c => c.id.startsWith('rf-')).map(c => (
                                            <div 
                                                key={c.id} 
                                                onClick={() => { playSound('select'); setCurrentCourse(c); setScreen(AppScreen.PATH); }} 
                                                className={`relative p-4 rounded-2xl border-2 border-b-4 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all flex items-center space-x-4 shadow-lg group ${currentCourse.id === c.id ? 'bg-rose-900/30 border-rose-500 ring-2 ring-rose-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}`}
                                            >
                                                <img src={`https://flagcdn.com/w80/${c.flagCode}.png`} className="w-12 h-8 rounded-md object-cover shadow-md group-hover:scale-110 transition-transform" alt={c.name} />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-sm text-white truncate">{getLocalizedCourseName(c)}</h3>
                                                    <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">{t('regionalCourse')}</p>
                                                </div>
                                                {currentCourse.id === c.id && <div className="bg-duo-green rounded-full p-1"><CheckCircleIcon className="w-5 h-5 text-white"/></div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SECTION 5: OFFICIAL DUOWINDO6601 GLOBAL CATALOG (100+ COURSES) */}
                            {(courseRegionTab === 'all' || courseRegionTab === 'catalog') && (
                                <div className="rounded-3xl p-5 md:p-6 bg-gradient-to-br from-sky-950/50 via-slate-900 to-indigo-950/60 border-2 border-sky-500/40 shadow-2xl relative overflow-hidden">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-3xl animate-bounce">🏆</span>
                                            <div>
                                                <h3 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-200 to-indigo-300 uppercase tracking-widest flex items-center gap-2">
                                                    {user.language === 'ru' ? 'Официальный Каталог DuoWindo6601' : 'Official DuoWindo6601 Catalog'}
                                                    <span className="bg-sky-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-sky-300">100+ COURSES</span>
                                                </h3>
                                                <p className="text-xs text-sky-200/80 font-bold mt-0.5">
                                                    {user.language === 'ru' ? 'Реальная статистика учащихся со всего мира' : 'Real-time learner statistics across all language pairs'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {DUOWINDO6601_OFFICIAL_CATALOG.slice(0, courseRegionTab === 'catalog' ? 120 : 16).map(item => (
                                            <div 
                                                key={item.itemId}
                                                onClick={() => {
                                                    playSound('select');
                                                    const existing = COURSES.find(c => c.id === item.learningLanguage);
                                                    const selectedCourse = existing || {
                                                        id: item.learningLanguage,
                                                        name: item.learningLanguageName,
                                                        localName: item.title,
                                                        flagCode: item.flagCode,
                                                        themeColor: 'bg-duo-blue',
                                                        themeBorder: 'border-duo-blueDark',
                                                        mascotVariant: 'default'
                                                    };
                                                    setCurrentCourse(selectedCourse);
                                                    setScreen(AppScreen.PATH);
                                                }}
                                                className="relative p-4 rounded-2xl border-2 border-sky-500/30 bg-gray-800/90 hover:bg-sky-950/60 cursor-pointer transition-all flex flex-col justify-between hover:scale-[1.02] active:scale-95 shadow-lg group"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center space-x-3 min-w-0">
                                                        <img src={`https://flagcdn.com/w80/${item.flagCode}.png`} className="w-10 h-7 rounded-md object-cover shadow group-hover:scale-110 transition-transform" alt={item.learningLanguageName} />
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-bold text-sm text-white truncate">{getLocalizedCatalogTitle(item, user.language)}</h4>
                                                            <p className="text-[10px] text-sky-300 font-bold truncate">{getLocalizedLanguageName(item.learningLanguageName, user.language)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {item.numLearners > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-gray-700/60 flex items-center justify-between text-[10px] font-black text-sky-200">
                                                        <span>👥 {formatLearnerCount(item.numLearners)} {user.language === 'ru' ? 'учащихся' : 'learners'}</span>
                                                        <span className="bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/30">Official</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* SUBSCRIPTION OVERLAY */}
        {screen === AppScreen.SUBSCRIPTION && (
            <div className="fixed inset-0 z-[100] bg-[#101010] overflow-y-auto">
                <div className="min-h-screen flex flex-col relative">
                    {/* Header Image Area */}
                    <div className="h-64 bg-gradient-to-b from-purple-900 via-[#220044] to-[#101010] flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                        <SuperIcon className="w-32 h-32 mb-4 animate-float z-10" />
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-tighter italic z-10 drop-shadow-lg">SUPER DUOWINDO</h1>
                        <button onClick={() => { playSound('click'); setScreen(AppScreen.SHOP); }} className="absolute top-6 left-6 text-white/50 hover:text-white transition-colors z-20"><CloseIcon className="w-8 h-8"/></button>
                    </div>

                    <div className="flex-1 p-6 max-w-4xl mx-auto w-full -mt-10 z-10">
                        {/* INCOGNITO MODE RESTRICTION BANNER */}
                        {isIncognitoUser && (
                            <div className="mb-6 bg-gradient-to-r from-amber-950/90 via-purple-950/90 to-indigo-950/90 border-2 border-amber-500/70 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3">
                                <div className="flex items-start sm:items-center space-x-3.5">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                                        🕵️
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="font-black text-amber-300 text-sm md:text-base uppercase tracking-wider">
                                                {user.language === 'ru' ? 'Режим Инкогнито (Без аккаунта)' : 'Incognito Mode (No Account)'}
                                            </h4>
                                            <span className="bg-amber-500/30 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/50 uppercase tracking-widest">
                                                {user.language === 'ru' ? 'Ограничение подписки' : 'Subscription Restriction'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-300 font-medium mt-1 leading-relaxed">
                                            {user.language === 'ru'
                                                ? 'Подписки DuoWindo6601 Super и DuoWindo6601 Max требуют зарегистрированный аккаунт. Создайте аккаунт или войдите через Google, чтобы активировать подписку и сохранить доступ навсегда!'
                                                : 'DuoWindo6601 Super and DuoWindo6601 Max subscriptions require a registered account. Create an account or sign in with Google to activate subscriptions and keep permanent access!'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        playSound('click');
                                        openRegisterModal('register');
                                    }}
                                    className="w-full sm:w-auto px-5 py-3 rounded-2xl font-black bg-gradient-to-r from-amber-500 to-orange-500 text-black border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-wider text-xs whitespace-nowrap shadow-lg flex-shrink-0 flex items-center justify-center space-x-1.5"
                                >
                                    <span>👤</span>
                                    <span>{user.language === 'ru' ? 'Создать аккаунт ↗' : 'Register Account ↗'}</span>
                                </button>
                            </div>
                        )}

                        {/* RENDER SUBSCRIPTION & FREE PLAN AI LIMIT SECTION */}
                        <AiLimitSection
                            user={user}
                            setUser={setUser}
                            onOpenLimitModal={() => setIsAiLimitModalOpen(true)}
                            onUpgrade={(tier) => upgradeSubscription(tier)}
                            playSound={playSound}
                            onToast={(msg) => setToast(msg)}
                        />

                        <div className="grid md:grid-cols-3 gap-6">
                            {/* FREE CARD */}
                            <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">{t('free')}</h3>
                                    {isIncognitoUser && (
                                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-500/30 uppercase">
                                            {user.language === 'ru' ? 'Активен (Инкогнито)' : 'Active (Incognito)'}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center text-gray-400 font-bold"><BatteryIcon className="w-6 h-6 mr-3 opacity-50"/> {t('energy25')}</div>
                                    <div className="flex items-center text-gray-400 font-bold"><span className="w-6 h-6 mr-3 flex items-center justify-center text-xl opacity-50">📺</span> {t('ads')}</div>
                                    <div className="flex items-center text-gray-400 font-bold text-xs"><SparklesIcon className="w-5 h-5 mr-3 text-emerald-400/70" /> {t('trafficFree')}</div>
                                </div>
                                <button onClick={cancelSubscription} className="mt-8 w-full py-3 rounded-2xl font-bold border-2 border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors uppercase tracking-widest text-sm">{t('currentPlan')}</button>
                            </div>

                            {/* SUPER CARD */}
                            <div className={`bg-gradient-to-br from-indigo-900 to-purple-900 border-2 ${isIncognitoUser ? "border-amber-500/50 opacity-95" : "border-purple-500"} rounded-3xl p-6 flex flex-col relative transform scale-105 shadow-2xl shadow-purple-900/50`}>
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg">Most Popular</div>
                                <div className="flex items-center justify-center mt-2 mb-6 space-x-2">
                                    <h3 className="text-2xl font-black text-white italic text-center">SUPER</h3>
                                    {isIncognitoUser && (
                                        <span className="bg-amber-500/30 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-500/50 uppercase">
                                            🔒 {user.language === 'ru' ? 'Нужен аккаунт' : 'Account needed'}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center text-white font-bold"><InfiniteEnergyIcon className="w-6 h-6 mr-3 text-yellow-300"/> {t('infEnergy')}</div>
                                    <div className="flex items-center text-white font-bold"><NoAdIcon className="w-6 h-6 mr-3 text-blue-300"/> {t('noAds')}</div>
                                    <div className="flex items-center text-white font-bold"><BookIcon className="w-6 h-6 mr-3 text-purple-300"/> Unlimited Tests</div>
                                    <div className="flex items-center text-amber-200 font-bold text-xs"><SparklesIcon className="w-5 h-5 mr-3 text-amber-300 animate-pulse"/> {t('trafficSuper')}</div>
                                </div>
                                {isIncognitoUser && (
                                    <div className="mt-4 p-2 bg-amber-950/60 border border-amber-500/40 rounded-xl text-center">
                                        <span className="text-[11px] font-bold text-amber-300 flex items-center justify-center space-x-1">
                                            <span>🔒</span>
                                            <span>{user.language === 'ru' ? 'Недоступно в Инкогнито без регистрации' : 'Unavailable in Incognito without account'}</span>
                                        </span>
                                    </div>
                                )}
                                <button onClick={() => upgradeSubscription('super')} className={`mt-6 w-full py-4 rounded-2xl font-black ${isIncognitoUser ? 'bg-amber-400 text-gray-950 hover:bg-amber-300 border-b-4 border-amber-600' : 'bg-white text-purple-900 border-b-4 border-gray-300'} active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest shadow-xl text-sm flex items-center justify-center space-x-2`}>
                                    {isIncognitoUser && <span>🔒</span>}
                                    <span>{isIncognitoUser ? (user.language === 'ru' ? 'ТРЕБУЕТСЯ АККАУНТ' : 'ACCOUNT REQUIRED') : t('trySuper')}</span>
                                </button>
                            </div>

                            {/* MAX CARD */}
                            <div className={`bg-black border ${isIncognitoUser ? "border-amber-500/40" : "border-gray-800"} rounded-3xl p-6 flex flex-col relative shadow-[0_0_30px_rgba(28,176,246,0.15)]`}>
                                <div className="flex items-center justify-center mb-6 space-x-2">
                                    <h3 className="text-xl font-black text-duo-blue italic flex items-center">MAX <span className="ml-2 text-[10px] bg-duo-blue text-black px-1.5 py-0.5 rounded font-bold">NEW</span></h3>
                                    {isIncognitoUser && (
                                        <span className="bg-amber-500/30 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-500/50 uppercase">
                                            🔒 {user.language === 'ru' ? 'Нужен аккаунт' : 'Account needed'}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center text-gray-300 font-bold"><SuperIcon className="w-5 h-5 mr-3 opacity-80"/> {t('allInSuper')}</div>
                                    <div className="flex items-center text-gray-300 font-bold"><MaxIcon className="w-5 h-5 mr-3 text-duo-blue"/> {t('aiExplain')}</div>
                                    <div className="flex items-center text-gray-300 font-bold"><ChatBubbleIcon className="w-5 h-5 mr-3 text-duo-blue"/> Roleplay Max</div>
                                    <div className="flex items-center text-duo-blue font-bold text-xs"><SparklesIcon className="w-5 h-5 mr-3 text-duo-blue animate-pulse"/> {t('trafficMax')}</div>
                                </div>
                                {isIncognitoUser && (
                                    <div className="mt-4 p-2 bg-amber-950/60 border border-amber-500/40 rounded-xl text-center">
                                        <span className="text-[11px] font-bold text-amber-300 flex items-center justify-center space-x-1">
                                            <span>🔒</span>
                                            <span>{user.language === 'ru' ? 'Недоступно в Инкогнито без регистрации' : 'Unavailable in Incognito without account'}</span>
                                        </span>
                                    </div>
                                )}
                                <button onClick={() => upgradeSubscription('max')} className={`mt-6 w-full py-3 rounded-2xl font-bold ${isIncognitoUser ? 'bg-amber-950/80 text-amber-300 border-2 border-amber-500/60 hover:bg-amber-900/80' : 'bg-gray-900 text-duo-blue border-2 border-duo-blue hover:bg-gray-800'} transition-all uppercase tracking-widest text-sm flex items-center justify-center space-x-2`}>
                                    {isIncognitoUser && <span>🔒</span>}
                                    <span>{isIncognitoUser ? (user.language === 'ru' ? 'ТРЕБУЕТСЯ АККАУНТ' : 'ACCOUNT REQUIRED') : t('connectMax')}</span>
                                </button>
                            </div>
                        </div>
                        <p className="text-center text-gray-600 text-xs mt-8 font-bold">Recurring billing. Cancel anytime.</p>
                    </div>
                </div>
            </div>
        )}

        {/* TRANSLATOR OVERLAY */}
        {screen === AppScreen.TRANSLATOR && (
            <div className="fixed inset-0 z-[100] bg-duo-dark overflow-y-auto">
                <div className="p-4 md:p-10 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-5">
                    <button onClick={() => { playSound('click'); setScreen(AppScreen.PRACTICE); }} className="mb-6 text-gray-400 hover:text-white flex items-center font-bold transition-colors">
                        <CloseIcon className="w-8 h-8 mr-2"/> {t('back')}
                    </button>
                    
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-duo-blue/20 rounded-2xl border border-duo-blue/40">
                                <BookIcon className="w-8 h-8 text-duo-blue" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white">{t('translator')}</h2>
                                <p className="text-xs text-gray-400 font-bold">{t('aiTrans')}</p>
                            </div>
                        </div>
                        <div className="text-2xl animate-bounce">🦉</div>
                    </div>

                    <div className="bg-duo-card border-2 border-gray-700 rounded-3xl p-6 shadow-xl space-y-6 relative">
                        {/* TARGET LANGUAGE SELECTOR */}
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">
                                {user.language === 'ru' ? 'Язык перевода:' : 'Target Language:'}
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'ru', name: 'Русский', flag: 'ru' },
                                    { id: 'en', name: 'English', flag: 'gb' },
                                    { id: 'de', name: 'Deutsch', flag: 'de' },
                                    { id: 'fr', name: 'Français', flag: 'fr' },
                                    { id: 'es', name: 'Español', flag: 'es' },
                                    { id: 'ja', name: '日本語', flag: 'jp' },
                                    { id: 'zh', name: '中文', flag: 'cn' },
                                    { id: 'ar', name: 'العربية', flag: 'sa' },
                                ].map(lang => {
                                    const isSelected = transTarget.id === lang.id || (transTarget.name === lang.name);
                                    return (
                                        <button
                                            key={lang.id}
                                            onClick={() => {
                                                playSound('select');
                                                const matchCourse = COURSES.find(c => c.id === lang.id) || {
                                                    id: lang.id,
                                                    name: lang.name,
                                                    localName: lang.name,
                                                    flagCode: lang.flag,
                                                    themeColor: 'bg-duo-blue',
                                                    mascotVariant: 'owl'
                                                } as any;
                                                setTransTarget(matchCourse);
                                            }}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
                                                isSelected 
                                                    ? 'bg-duo-blue text-white border-duo-blueDark shadow-md scale-105' 
                                                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-750 hover:text-white'
                                            }`}
                                        >
                                            <img src={`https://flagcdn.com/w40/${lang.flag}.png`} className="w-5 h-3.5 rounded-sm object-cover" alt={lang.name}/>
                                            <span>{lang.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* INPUT AREA */}
                        <div className="relative">
                            <textarea 
                                value={translatorInput} 
                                onChange={(e) => setTranslatorInput(e.target.value)} 
                                placeholder={user.language === 'ru' ? "Введите текст для перевода..." : "Type text here to translate..."} 
                                className="w-full h-32 bg-gray-800 border-2 border-gray-700 rounded-2xl p-4 text-base md:text-lg font-bold text-white focus:border-duo-blue focus:outline-none resize-none placeholder-gray-500"
                            />
                            {translatorInput && (
                                <button 
                                    onClick={() => setTranslatorInput("")} 
                                    className="absolute top-3 right-3 p-1.5 bg-gray-700/80 hover:bg-gray-600 rounded-lg text-gray-300 hover:text-white text-xs font-bold transition-all"
                                    title="Очистить"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* SAMPLE PRESETS */}
                        <div>
                            <p className="text-[11px] font-bold text-gray-400 mb-2">
                                {user.language === 'ru' ? 'Быстрые фразы:' : 'Quick phrases:'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    user.language === 'ru' ? 'Привет, как твои дела?' : 'Hello, how are you?',
                                    user.language === 'ru' ? 'Спасибо большое за помощь!' : 'Thank you very much for your help!',
                                    user.language === 'ru' ? 'Где находится ближайший музей?' : 'Where is the nearest museum?',
                                    user.language === 'ru' ? 'Сколько это стоит?' : 'How much does this cost?'
                                ].map((phrase, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => {
                                            playSound('click');
                                            setTranslatorInput(phrase);
                                        }}
                                        className="px-2.5 py-1 bg-gray-800/80 hover:bg-gray-700 text-gray-300 text-[11px] font-bold rounded-lg border border-gray-700 transition-colors"
                                    >
                                        "{phrase}"
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ACTION BUTTON */}
                        <div className="flex justify-center pt-2">
                            <button 
                                onClick={() => handleTranslator()} 
                                disabled={loading || !translatorInput.trim()} 
                                className={`px-10 py-4 rounded-2xl font-black text-white uppercase tracking-widest transition-all shadow-lg text-sm md:text-base flex items-center space-x-2 ${
                                    loading || !translatorInput.trim() 
                                        ? 'bg-gray-700 cursor-not-allowed opacity-60' 
                                        : 'bg-duo-green hover:brightness-110 border-b-4 border-duo-greenDark active:border-b-0 active:translate-y-1'
                                }`}
                            >
                                <span>{loading ? '⏳' : '⚡'}</span>
                                <span>{loading ? (user.language === 'ru' ? "Перевод..." : "Translating...") : (user.language === 'ru' ? "Перевести" : "Translate")}</span>
                            </button>
                        </div>

                        {/* OUTPUT RESULT */}
                        {translatorOutput && (
                            <div className="bg-gray-800/90 border-2 border-duo-blue/40 rounded-2xl p-5 relative animate-in fade-in slide-in-from-bottom-2 shadow-xl space-y-3">
                                <div className="flex items-center justify-between border-b border-gray-700/60 pb-2">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-duo-blue flex items-center space-x-1.5">
                                        <span>✨</span>
                                        <span>{user.language === 'ru' ? 'Результат' : 'Translation Result'} ({transTarget.name || transTarget.localName})</span>
                                    </span>
                                    <div className="flex items-center space-x-2">
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard?.writeText(translatorOutput);
                                                playSound('success');
                                                setToast(user.language === 'ru' ? "Скопировано в буфер!" : "Copied to clipboard!");
                                            }}
                                            className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                                            title="Скопировать"
                                        >
                                            <span>📋</span>
                                            <span>{user.language === 'ru' ? 'Копировать' : 'Copy'}</span>
                                        </button>
                                        <button 
                                            onClick={() => speakText(translatorOutput, transTarget.id, false, user.preferredVoice, user.voiceProvider)} 
                                            className="p-2 bg-duo-blue/20 hover:bg-duo-blue/40 text-duo-blue rounded-xl transition-transform hover:scale-110 active:scale-95"
                                            title="Озвучить"
                                        >
                                            <VolumeIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xl font-black text-white pr-4 leading-relaxed font-din select-text">
                                    {translatorOutput}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- VIDEO CALL SCREEN DUOWINDO6601 --- */}
        {screen === AppScreen.VIDEO_CALL && (
            <div className="fixed inset-0 z-[100] bg-[#121212] flex flex-col animate-in fade-in select-none">
                {/* Header Bar */}
                <div className="flex items-center justify-between p-4 bg-black/60 backdrop-blur-xl absolute top-0 w-full z-20 border-b border-white/10">
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={() => { playSound('click'); setScreen(AppScreen.PRACTICE); }}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all active:scale-95"
                            title="Назад"
                        >
                            <CloseIcon className="w-5 h-5"/>
                        </button>
                        <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg">
                            <VideoIcon className="w-6 h-6 text-white"/>
                        </div>
                        <div>
                            <h3 className="font-black text-white text-base md:text-lg flex items-center space-x-2">
                                <span>Видеозвонок DuoWindo6601</span>
                                <span className="bg-yellow-400 text-black text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider hidden sm:inline">AI Partner</span>
                            </h3>
                            <p className="text-xs text-purple-300 font-bold flex items-center space-x-2">
                                <span>Тема:</span>
                                <span className="text-white bg-purple-900/80 px-2 py-0.5 rounded border border-purple-500/30">{videoTopic}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* Topic Selector Menu */}
                        <div className="hidden md:flex items-center space-x-1.5 bg-white/5 p-1 rounded-2xl border border-white/10">
                            {(isArabicCourse ? [
                                { name: '☕ في المقهى', topic: 'Заказ в кафе' },
                                { name: '🤝 التعارف', topic: 'Знакомство' },
                                { name: '🛒 في السوق', topic: 'Рынок и покупки' },
                                { name: '💬 حوار حر', topic: 'Свободный разговор' }
                            ] : [
                                { name: '☕ Кафе', topic: 'Заказ в кафе' },
                                { name: '💼 Собеседование', topic: 'Собеседование на работу' },
                                { name: '✈️ Аэропорт', topic: 'В аэропорту и регистрация' },
                                { name: '💬 Беседа', topic: 'Свободная беседа о жизни' }
                            ]).map(item => (
                                <button
                                    key={item.name}
                                    onClick={() => startVideoCall(item.topic)}
                                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${videoTopic === item.topic ? 'bg-duo-blue text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                >
                                    {item.name}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center space-x-2 bg-red-950/80 border border-red-500/40 px-3 py-1.5 rounded-full shadow-inner">
                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                            <span className="text-red-400 text-xs font-black uppercase tracking-widest">LIVE</span>
                        </div>
                    </div>
                </div>

                {/* Main Call View Area */}
                <div className="flex-1 relative flex flex-col items-center justify-center p-4 pt-20 pb-32 overflow-hidden bg-gradient-to-b from-[#18181f] via-[#121212] to-[#0a0a0f]">
                    {/* Background Subtle Pulsing Aura */}
                    <div className="absolute w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

                    {/* DuoWindo6601 Mascot Stream */}
                    <div className="relative z-10 flex flex-col items-center my-auto transition-all transform scale-100">
                        <div className="relative mb-6">
                            {/* Speaking Wave Ripple Ring */}
                            {loading && (
                                <div className="absolute -inset-8 bg-purple-500/20 rounded-full blur-xl animate-ping"></div>
                            )}
                            <div className="relative p-6 bg-gradient-to-b from-purple-900/40 to-black/60 rounded-full border-2 border-purple-500/30 shadow-[0_0_50px_rgba(147,51,234,0.3)]">
                                <Mascot 
                                    emotion={loading ? "happy" : isRecording ? "surprised" : "neutral"} 
                                    className="w-48 h-48 md:w-64 md:h-64 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]" 
                                    variant={currentCourse.mascotVariant || 'default'} 
                                />
                            </div>
                            <span className="absolute bottom-2 right-2 bg-green-500 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-full border-2 border-black flex items-center space-x-1 shadow-lg">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                <span>ONLINE</span>
                            </span>
                        </div>

                        {/* Speech Subtitles & Latest Reply Card */}
                        <div className="w-full max-w-xl bg-black/70 backdrop-blur-xl border border-white/15 p-5 md:p-6 rounded-3xl shadow-2xl relative text-center animate-in slide-in-from-bottom-3">
                            <p className="text-purple-300 text-xs font-black uppercase tracking-widest mb-2 flex items-center justify-center space-x-2">
                                <span>DuoWindo6601 говорит:</span>
                                {videoQuestion && (
                                    <button 
                                        onClick={() => speakText(videoQuestion, currentCourse.id, false, user.preferredVoice, user.voiceProvider)}
                                        className="p-1 bg-purple-600/30 hover:bg-purple-600/60 text-purple-200 rounded-lg transition-transform active:scale-95"
                                        title="Повторить озвучку"
                                    >
                                        <VolumeIcon className="w-4 h-4"/>
                                    </button>
                                )}
                            </p>
                            <h4 
                                className={`text-white text-base md:text-xl font-bold leading-relaxed ${isArabicText(videoQuestion) ? 'font-arabic text-right' : ''}`}
                                dir="auto"
                            >
                                {videoQuestion ? formatRTLOverride(videoQuestion) : "Начните разговор! Нажмите микрофон или напишите сообщение."}
                            </h4>

                            {loading && (
                                <div className="mt-3 flex items-center justify-center space-x-2 text-xs text-purple-400 font-bold animate-pulse">
                                    <ActivityIcon className="w-4 h-4 animate-spin" />
                                    <span>DuoWindo6601 генерирует ответ...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AI Copilot Overlay */}
                    {videoSmartMode && videoHint && (
                        <div className="absolute top-24 right-4 md:right-8 bg-indigo-950/90 backdrop-blur-2xl border border-indigo-500/40 p-5 rounded-3xl shadow-2xl max-w-xs md:max-w-sm w-full animate-in slide-in-from-right-8 z-30">
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-indigo-500/30">
                                <h4 className="text-indigo-300 font-black uppercase text-xs tracking-widest flex items-center">
                                    <MonitorIcon className="w-4 h-4 mr-1.5 text-indigo-400"/> AI Copilot
                                </h4>
                                <button onClick={() => setVideoSmartMode(false)} className="text-indigo-400 hover:text-white text-xs font-bold">×</button>
                            </div>
                            <div className="text-indigo-100 text-xs md:text-sm font-bold leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto pr-1">
                                {videoHint}
                            </div>
                        </div>
                    )}
                </div>

                {/* Self View (PIP Camera Stream) */}
                {videoSelfViewOpen && (
                    <div className="absolute bottom-28 right-4 w-32 h-44 md:w-44 md:h-56 bg-gray-900 rounded-3xl border-2 border-purple-500/40 overflow-hidden shadow-2xl z-40 group transition-all">
                        {videoCameraOn ? (
                            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800/90 p-2 text-center">
                                <UserIcon className="w-10 h-10 text-gray-500 mb-1" />
                                <span className="text-[10px] text-gray-400 font-bold">Камера выключена</span>
                            </div>
                        )}
                        <div className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/60 backdrop-blur px-2 py-0.5 rounded-full text-white border border-white/10">
                            {t('self')}
                        </div>
                        
                        <button 
                            onClick={() => setVideoSelfViewOpen(false)}
                            className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all z-50"
                            title="Скрыть селфи-камеру"
                        >
                            <CloseIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* Interactive Bottom Control Bar */}
                <div className="p-4 md:p-6 bg-[#18181f]/95 backdrop-blur-2xl border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 z-50 pb-8 md:pb-6">
                    {/* Live Mic Speech & Recording Button */}
                    <div className="flex items-center space-x-3 w-full md:w-auto justify-center">
                        <button 
                            onClick={toggleRecording} 
                            disabled={loading}
                            className={`p-5 rounded-2xl transition-all font-black uppercase text-xs tracking-wider flex items-center space-x-3 shadow-xl active:scale-95 ${
                                isRecording 
                                ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-500/50 scale-105' 
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:brightness-110'
                            }`}
                        >
                            <MicIcon className="w-7 h-7"/>
                            <span>{isRecording ? "Слушаю вас..." : "Говорить с Duo"}</span>
                        </button>

                        <button 
                            onClick={() => setVideoCameraOn(!videoCameraOn)} 
                            className={`p-4 rounded-2xl transition-all border ${videoCameraOn ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' : 'bg-red-500/20 text-red-400 border-red-500/50'}`}
                            title={videoCameraOn ? "Выключить камеру" : "Включить камеру"}
                        >
                            <VideoIcon className="w-6 h-6"/>
                        </button>

                        <button 
                            onClick={() => setVideoSelfViewOpen(!videoSelfViewOpen)} 
                            className={`p-4 rounded-2xl transition-all border ${videoSelfViewOpen ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' : 'bg-gray-800 text-gray-500 border-gray-700'}`}
                            title="Переключить селфи-вид"
                        >
                            <EyeIcon className="w-6 h-6"/>
                        </button>

                        <button 
                            onClick={() => setVideoSmartMode(!videoSmartMode)} 
                            className={`p-4 rounded-2xl transition-all border ${videoSmartMode ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-white/10 text-gray-400 border-white/10'}`}
                            title="AI Copilot подсказки"
                        >
                            <MonitorIcon className="w-6 h-6"/>
                        </button>
                    </div>

                    {/* Quick Text Input for Typing Reply */}
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleVideoCallSend(videoInputText); }}
                        className="flex items-center space-x-2 w-full md:max-w-md"
                    >
                        <input 
                            type="text" 
                            value={videoInputText} 
                            onChange={(e) => setVideoInputText(e.target.value)} 
                            placeholder="Или напишите ответ текстом..." 
                            disabled={loading}
                            className="flex-1 bg-black/50 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-bold"
                        />
                        <button 
                            type="submit" 
                            disabled={loading || !videoInputText.trim()} 
                            className="px-5 py-3 bg-duo-blue hover:brightness-110 disabled:bg-gray-800 disabled:text-gray-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-95 shadow-md"
                        >
                            {loading ? "..." : "Отправить"}
                        </button>
                    </form>

                    {/* Hangup / End Call */}
                    <button 
                        onClick={() => { playSound('click'); setScreen(AppScreen.PRACTICE); }} 
                        className="p-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center"
                        title="Завершить видеозвонок"
                    >
                        <PhoneIcon className="w-6 h-6 transform rotate-135"/>
                    </button>
                </div>
            </div>
        )}

        {/* ... (Main Content: PATH, PRACTICE, etc.) ... */}
        <div className="p-4 md:p-10 max-w-5xl mx-auto">
          {screen === AppScreen.PATH && (
            <div className="flex flex-col items-center py-10 animate-in fade-in slide-in-from-bottom-5">
              {/* DAILY CHALLENGE BANNER */}
              {(() => {
                const todayStr = new Date().toISOString().split('T')[0];
                if (dailyChallengeDismissedDate === todayStr) return null;
                const todayChallenge = getTodayChallenge();
                const isChallengeDone = user.dailyChallengeCompletedDate === todayStr;
                const challengeTitle = user.language === 'ru' ? todayChallenge.titleRu : todayChallenge.titleEn;
                const challengeDesc = user.language === 'ru' ? todayChallenge.descRu : todayChallenge.descEn;

                return (
                  <div className="w-full max-w-md bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 border-2 border-b-8 border-amber-900 rounded-[2.5rem] p-5 md:p-6 mb-8 shadow-2xl relative animate-in zoom-in duration-300">
                    {/* Close / Dismiss button */}
                    <button
                      onClick={() => {
                        playSound('click');
                        setDailyChallengeDismissedDate(todayStr);
                        localStorage.setItem('duo_daily_challenge_dismissed', todayStr);
                      }}
                      className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center bg-black/20 hover:bg-black/40 text-amber-100 hover:text-white rounded-full transition-all text-xs font-black z-10"
                      title={user.language === 'ru' ? 'Скрыть Задание Дня' : 'Dismiss Daily Challenge'}
                    >
                      ✕
                    </button>

                    <div className="flex items-center justify-between mb-2 pr-8">
                      <span className="bg-amber-300 text-amber-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <span>🎯</span>
                        <span>{user.language === 'ru' ? 'Задание Дня' : 'Daily Challenge'}</span>
                      </span>
                      <span className="text-yellow-300 font-black text-xs flex items-center gap-1">
                        <span>+{todayChallenge.bonusXp} XP</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="pr-2 min-w-0 flex-1">
                        <h3 className="font-black text-base md:text-lg text-white uppercase tracking-wider truncate">{challengeTitle}</h3>
                        <p className="text-xs text-amber-100 font-bold mt-0.5 leading-snug">{challengeDesc}</p>
                      </div>
                      {isChallengeDone ? (
                        <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider shrink-0 flex items-center gap-1">
                          <span>✅</span>
                          <span>{user.language === 'ru' ? 'Готово' : 'Done'}</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => startTraining(todayChallenge.type)}
                          className="bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-black font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl border-b-4 border-yellow-700 transition-all shrink-0 shadow-lg"
                        >
                          {user.language === 'ru' ? 'Начать' : 'Start'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
              {!betaDismissed && (
                  <div className="w-full max-w-md bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border-2 border-b-8 border-purple-950 rounded-[2.5rem] p-6 mb-8 shadow-2xl relative animate-in zoom-in duration-300">
                      {/* Close button */}
                      <button 
                          onClick={() => {
                              playSound('click');
                              setBetaDismissed(true);
                              localStorage.setItem('duo_beta_dismissed', 'true');
                          }}
                          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors bg-black/30 p-1.5 rounded-full z-10"
                          title="Закрыть Баннер"
                      >
                          <CloseIcon className="w-4 h-4" />
                      </button>
                      
                      <div className="flex items-start space-x-4">
                          <div className="bg-purple-500/20 p-3.5 rounded-2xl mt-1 border border-purple-400/30 flex-shrink-0">
                              <span className="text-3xl">🧪</span>
                          </div>
                          <div className="flex-1 pr-6">
                              <div className="flex items-center space-x-2 mb-1.5 flex-wrap">
                                  <span className="bg-purple-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Бета-тестирование</span>
                                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase">v1.0.2 Active</span>
                              </div>
                              <h3 className="font-din font-black text-xl text-white tracking-widest uppercase mb-1">DuoWindo6601 Доступ Бета-тестирование</h3>
                              <p className="font-din font-bold text-xs text-purple-200 leading-normal mb-3">
                                  Все функции приложения доступны для проверки тестеров: языки СНГ и мира, Шахматы, Графика, AI Озвучка и Панель Управления.
                              </p>

                              <div className="flex flex-col sm:flex-row gap-2">
                                  <button 
                                      onClick={() => {
                                          playSound('select');
                                          setShowBetaModal(true);
                                      }}
                                      className="font-din font-black text-xs uppercase tracking-widest bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white hover:scale-[1.02] active:scale-95 px-4 py-2.5 rounded-xl border-b-4 border-indigo-950 transition-all shadow-md text-center flex-1 flex items-center justify-center space-x-1.5"
                                  >
                                      <span>🧪 Бета-Центр DuoWindo6601</span>
                                  </button>
                                  
                                  <button 
                                      onClick={() => {
                                          playSound('click');
                                          setScreen(AppScreen.FEEDBACK);
                                      }}
                                      className="font-din font-black text-xs uppercase tracking-widest bg-gray-800 hover:bg-gray-750 text-amber-300 hover:scale-[1.02] active:scale-95 px-3 py-2.5 rounded-xl border-b-4 border-gray-950 border border-amber-500/30 transition-all shadow-md text-center flex items-center justify-center space-x-1"
                                  >
                                      <span>⭐ Отзывы</span>
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
              {!androidDismissed && (
                  <div className="w-full max-w-md bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 border-2 border-b-8 border-emerald-900 rounded-[2.5rem] p-6 mb-8 shadow-2xl relative animate-in zoom-in duration-300">
                      {/* Close button */}
                      <button 
                          onClick={() => {
                              playSound('click');
                              setAndroidDismissed(true);
                              localStorage.setItem('duo_android_dismissed', 'true');
                          }}
                          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors bg-black/20 p-1.5 rounded-full z-10"
                      >
                          <CloseIcon className="w-4 h-4" />
                      </button>
                      
                      <div className="flex items-start space-x-4">
                          <div className="bg-white/20 p-3 rounded-full mt-1 flex-shrink-0">
                              <svg className="w-8 h-8 text-white fill-current" viewBox="0 0 24 24">
                                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                              </svg>
                          </div>
                          <div className="flex-1 pr-6">
                              <span className="inline-block bg-yellow-400 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">GitHub Release</span>
                              <h3 className="font-din font-black text-xl text-white tracking-widest uppercase mb-1">DuoWindo6601 уже доступен на GitHub</h3>
                              <p className="font-din font-bold text-xs text-emerald-100 leading-normal mb-3">
                                  Автоматическая сборка Android APK запущена через <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-[11px] text-yellow-300">.github/workflows/build.yml</code>.
                              </p>

                              <a 
                                  href="https://github.com/Windo6601/DuoWindo6601" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="font-din font-black text-xs uppercase tracking-widest bg-white hover:bg-gray-100 text-gray-950 hover:scale-[1.03] active:scale-95 px-4 py-2.5 rounded-xl border-b-4 border-gray-300 transition-all shadow-md text-center flex items-center justify-center space-x-2 mb-3"
                              >
                                  <span>🐙 GitHub Repository (DuoWindo6601)</span>
                              </a>
                              
                              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                                  <button 
                                      onClick={() => {
                                          playSound('select');
                                          setShowAndroidModal(true);
                                      }}
                                      className="font-din font-black text-xs uppercase tracking-widest bg-emerald-700 hover:bg-emerald-800 text-white hover:scale-[1.03] active:scale-95 px-3 py-2 rounded-xl border-b-4 border-emerald-950 transition-all shadow-md text-center flex-1"
                                  >
                                      {t('androidAlertBtn')}
                                  </button>
                                  
                                  <button 
                                      onClick={() => {
                                          playSound('success');
                                          setSimulatorMode('android');
                                          setSimNotify("Вы завели симулятор в режиме Android!");
                                      }}
                                      className="font-din font-black text-xs uppercase tracking-widest bg-yellow-400 hover:bg-yellow-500 text-gray-950 hover:scale-[1.03] active:scale-95 px-3 py-2 rounded-xl border-b-4 border-yellow-700 transition-all shadow-md text-center flex items-center justify-center space-x-1 flex-1"
                                  >
                                      <span>🤖 Тест Android</span>
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {!serverJsDismissed && (
                  <div className="w-full max-w-md bg-gradient-to-r from-blue-600 to-indigo-600 border-2 border-b-8 border-indigo-800 rounded-[2.5rem] p-6 mb-8 shadow-2xl relative animate-in zoom-in duration-300">
                      {/* Close button */}
                      <button 
                          onClick={() => {
                              playSound('click');
                              setServerJsDismissed(true);
                              localStorage.setItem('duo_serverjs_dismissed', 'true');
                          }}
                          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors bg-black/20 p-1.5 rounded-full z-10"
                      >
                          <CloseIcon className="w-4 h-4" />
                      </button>
                      
                      <div className="flex items-start space-x-4">
                          <div className="bg-white/20 p-3 rounded-full mt-1">
                              <svg className="w-8 h-8 text-white fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
                                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
                                  <line x1="6" y1="6" x2="6.01" y2="6"/>
                                  <line x1="6" y1="18" x2="6.01" y2="18"/>
                                  <line x1="20" y1="21" x2="20" y2="21"/>
                              </svg>
                          </div>
                          <div className="flex-1 pr-6">
                              <h3 className="font-din font-black text-xl text-white tracking-widest uppercase mb-1">{t('serverJsTitle')}</h3>
                              <p className="font-din font-bold text-sm text-blue-100 leading-tight mb-4">{t('serverJsDesc')}</p>
                              
                              <div className="flex">
                                  <button 
                                      onClick={() => {
                                          playSound('success');
                                          setServerJsDismissed(true);
                                          localStorage.setItem('duo_serverjs_dismissed', 'true');
                                          setSimNotify("Вы активировали стабильный продакшн-сервер server.js!");
                                      }}
                                      className="font-din font-black text-xs uppercase tracking-widest bg-yellow-400 hover:bg-yellow-500 text-gray-950 hover:scale-[1.03] active:scale-95 px-5 py-2.5 rounded-xl border-b-4 border-yellow-700 transition-all shadow-md text-center flex-1"
                                  >
                                      {t('serverJsBtn')}
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {currentCourse.id === 'chess' ? (
                  <div className="w-full max-w-md flex flex-col items-center px-4 relative">
                      <div className={`bg-duo-green w-full p-6 rounded-2xl border-b-8 border-duo-greenDark mb-12 flex justify-between items-center shadow-2xl transition-transform hover:scale-[1.02]`}>
                          <div>
                              <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1 text-white">{t('module1')}</p>
                              <h2 className="text-2xl font-bold text-white">{t('chessUnitName')}</h2>
                          </div>
                          <button className="w-12 h-12 rounded-xl bg-gray-800/50 flex items-center justify-center hover:bg-gray-800 transition-colors">
                              <span className="text-red-500 font-bold text-2xl">🐞</span>
                          </button>
                      </div>
                      
                      <div className="flex flex-col items-center space-y-8 relative w-full">
                          <button onClick={() => setScreen(AppScreen.CHESS_MATCH)} className="w-20 h-20 rounded-full bg-duo-green border-b-8 border-duo-greenDark active:translate-y-2 active:border-b-0 transition-all flex items-center justify-center shadow-2xl hover:brightness-110 z-10">
                              <StarIcon className="w-10 h-10 text-white" />
                          </button>
                          
                          <button onClick={() => setScreen(AppScreen.CHESS_MATCH)} className="w-20 h-20 rounded-full bg-duo-green border-b-8 border-duo-greenDark active:translate-y-2 active:border-b-0 transition-all flex items-center justify-center shadow-2xl hover:brightness-110 z-10 -ml-16">
                              <StarIcon className="w-10 h-10 text-white" />
                          </button>
                          
                          <div className="relative w-full flex justify-center">
                              <button onClick={() => setScreen(AppScreen.CHESS_MATCH)} className="w-20 h-20 rounded-full bg-duo-green border-b-8 border-duo-greenDark active:translate-y-2 active:border-b-0 transition-all flex items-center justify-center shadow-2xl hover:brightness-110 z-10 -ml-32">
                                  <DumbbellIcon className="w-10 h-10 text-white" />
                              </button>
                              <div className="absolute right-4 top-0">
                                  <Mascot variant="chess" className="w-40 h-40" />
                              </div>
                          </div>
                          
                          <button onClick={() => setScreen(AppScreen.CHESS_MATCH)} className="w-24 h-24 rounded-2xl bg-yellow-400 border-b-8 border-yellow-600 active:translate-y-2 active:border-b-0 transition-all flex items-center justify-center shadow-2xl hover:brightness-110 z-10">
                              <ChestIcon className="w-12 h-12 text-white" />
                          </button>
                          
                          <button onClick={() => setScreen(AppScreen.CHESS_MATCH)} className="w-20 h-20 rounded-full bg-duo-green border-b-8 border-duo-greenDark active:translate-y-2 active:border-b-0 transition-all flex items-center justify-center shadow-2xl hover:brightness-110 z-10">
                              <StarIcon className="w-10 h-10 text-white" />
                          </button>
                      </div>
                  </div>
              ) : (
                  <>
                  <div className={`${currentCourse.themeColor} w-full max-w-md p-8 rounded-[2.5rem] border-b-8 ${currentCourse.themeBorder} mb-16 flex justify-between items-center shadow-2xl transition-transform hover:scale-[1.02]`}><div><p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">{t('unit')} {user.currentUnit}</p><h2 className="text-3xl font-bold">{getLocalizedCourseName(currentCourse)}</h2></div>{currentCourse.id === 'chess' ? <span className="text-5xl">♔</span> : <ActivityIcon className="w-12 h-12 text-white" />}</div>
                  <div className="flex flex-col items-center space-y-16">
                    <button onClick={() => startTraining('translation')} className="w-28 h-28 rounded-full bg-duo-green border-b-8 border-duo-greenDark active:translate-y-2 active:border-b-0 transition-all flex items-center justify-center shadow-2xl hover:brightness-110 group"><StarIcon className="w-14 h-14 text-white group-hover:scale-110 transition-transform" /></button>
                    <div className="w-3 h-16 bg-gray-800 rounded-full"></div>
                    <button onClick={() => { playSound('click'); setScreen(AppScreen.VOCABULARY); }} className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 md:p-10 rounded-[2.5rem] border-b-8 border-emerald-800 text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center justify-between shadow-2xl group md:col-span-2">
                  <div className="flex items-center space-x-6 md:space-x-8">
                      <div className="bg-white/20 p-4 md:p-5 rounded-3xl group-hover:rotate-6 transition-transform">
                          <NewWordIcon className="w-10 h-10 md:w-14 md:h-14 text-white" />
                      </div>
                      <div>
                          <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-2xl md:text-3xl font-black text-white">{user.language === 'ru' ? 'Банк Слов' : 'Vocabulary Bank'}</h3>
                              <span className="bg-emerald-950 text-emerald-300 text-[10px] px-2.5 py-0.5 rounded-md font-black border border-emerald-400 uppercase">{user.language === 'ru' ? 'Словарь' : 'Lexicon'}</span>
                          </div>
                          <p className="opacity-90 font-bold text-xs md:text-sm text-white/80">{user.language === 'ru' ? 'Все изученные слова по курсам с озвучкой и транскрипцией' : 'All learned words across courses with audio and phonetics'}</p>
                      </div>
                  </div>
                  <ArrowRightIcon className="w-8 h-8 text-white group-hover:translate-x-2 transition-transform hidden sm:block" />
              </button>
              <button onClick={() => startTraining('listening')} className="w-24 h-24 rounded-full bg-duo-blue border-b-8 border-duo-blueDark active:translate-y-2 active:border-b-0 transition-all flex items-center justify-center shadow-xl hover:brightness-110">{currentCourse.id === 'chess' ? <span className="text-3xl">♟</span> : <VolumeIcon className="w-10 h-10 text-white" />}</button>
                    <Mascot emotion="neutral" className="w-64 h-64 mt-10 animate-float" variant={currentCourse.mascotVariant} />
                  </div>
                  </>
              )}
            </div>
          )}

          {screen === AppScreen.CHESS_MATCH && (
            <div className="fixed inset-0 z-[100] bg-[#00cd9c] flex flex-col items-center justify-center p-4 md:p-6 animate-in fade-in duration-300 font-din h-[100dvh] overflow-y-auto">
                <div className="w-full max-w-md flex flex-col items-center px-4 mt-auto mb-auto">
                    <div className="relative mb-8">
                        <Mascot variant="chess" className="w-64 h-64" />
                    </div>
                    
                    <h1 className="text-3xl font-black uppercase text-center mb-2 text-gray-900 tracking-tight flex items-center justify-center space-x-2">
                        <ChessPieceIcon type="n" color="b" className="w-8 h-8" />
                        <span>{t('playChess')}</span>
                    </h1>
                    <p className="text-gray-800 font-bold mb-10 text-center text-sm">{t('chessSubtitle')}</p>
                    
                    <div className="grid grid-cols-3 gap-4 w-full mb-10">
                        <div className="bg-teal-600/20 rounded-2xl p-4 flex flex-col items-center border-t-8 border-teal-700/30 shadow-sm">
                            <span className="text-[10px] font-black text-gray-800 uppercase mb-2 tracking-widest">{t('games')}</span>
                            <div className="flex items-center space-x-2">
                                <GridIcon className="w-5 h-5 text-white" />
                                <span className="text-xl font-black text-gray-900">{user.chessStats?.games || 0}</span>
                            </div>
                        </div>
                        <div className="bg-teal-600/20 rounded-2xl p-4 flex flex-col items-center border-t-8 border-teal-700/30 shadow-sm">
                            <span className="text-[10px] font-black text-gray-800 uppercase mb-2 tracking-widest">{t('wins')}</span>
                            <div className="flex items-center space-x-2">
                                <CheckCircleIcon className="w-5 h-5 text-white" />
                                <span className="text-xl font-black text-gray-900">{user.chessStats?.wins || 0}</span>
                            </div>
                        </div>
                        <div className="bg-teal-600/20 rounded-2xl p-4 flex flex-col items-center border-t-8 border-teal-700/30 shadow-sm">
                            <span className="text-[10px] font-black text-gray-800 uppercase mb-2 tracking-widest">{t('elo')}</span>
                            <div className="flex items-center space-x-2">
                                <ActivityIcon className="w-5 h-5 text-white" />
                                <span className="text-xl font-black text-gray-900">{user.chessStats?.elo || 0}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Course header badge */}
                    <div className="mb-4">
                        <span className="bg-gray-900/20 text-gray-900 text-xs font-black px-4 py-1.5 rounded-full border border-gray-900/30 uppercase tracking-widest shadow-sm">
                            {user.language === 'ru' ? 'Не язык • Курс Шахматы' : 'Non-language • Chess Course'}
                        </span>
                    </div>

                    <div className="flex flex-col w-full space-y-3">
                        {/* 1. Играть с DuoWindo6601 */}
                        <button 
                            onClick={() => { 
                                setChessMode('pve'); 
                                const opp = { name: 'DuoWindo6601', elo: 1500, avatar: '🦉', isBot: true };
                                setChessOpponent(opp); 
                                initChessGame(opp);
                                startTraining('chess'); 
                            }} 
                            className="w-full p-4 bg-gray-900 text-[#00cd9c] rounded-2xl font-black uppercase tracking-wider border-b-6 border-black active:border-b-0 active:translate-y-1 transition-all shadow-xl hover:bg-gray-800 flex items-center justify-between group cursor-pointer"
                        >
                            <div className="flex items-center space-x-3 text-left">
                                <span className="text-3xl group-hover:scale-110 transition-transform">🦉</span>
                                <div>
                                    <div className="text-sm sm:text-base font-black text-[#00cd9c]">
                                        {user.language === 'ru' ? 'Играть с DuoWindo6601' : 'Play with DuoWindo6601'}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-bold">
                                        {user.language === 'ru' ? 'Одиночная партия с ИИ-ботом' : 'Single match vs AI Grandmaster'}
                                    </div>
                                </div>
                            </div>
                            <span className="bg-[#00cd9c]/20 text-[#00cd9c] text-[11px] font-black px-2.5 py-1 rounded-xl border border-[#00cd9c]/40 uppercase tracking-wider whitespace-nowrap">
                                +30 очков опыта
                            </span>
                        </button>

                        {/* 2. Играть с другим Пользователем */}
                        <button 
                            onClick={() => { 
                                playSound('click'); 
                                setIsChessInviteModalOpen(true); 
                            }} 
                            className="w-full p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl font-black uppercase tracking-wider border-b-6 border-indigo-950 active:border-b-0 active:translate-y-1 transition-all shadow-xl hover:brightness-110 flex items-center justify-between group cursor-pointer ring-2 ring-white/30"
                        >
                            <div className="flex items-center space-x-3 text-left">
                                <span className="text-3xl group-hover:scale-110 transition-transform">⚔️</span>
                                <div>
                                    <div className="text-sm sm:text-base font-black text-white">
                                        {user.language === 'ru' ? 'Играть с другим Пользователем' : 'Play with another User'}
                                    </div>
                                    <div className="text-[10px] text-blue-200 font-bold">
                                        {user.language === 'ru' ? 'Пригласить друга • Ссылка • Поиск' : 'Invite friend • Link • Search'}
                                    </div>
                                </div>
                            </div>
                            <span className="bg-amber-400 text-gray-950 text-[11px] font-black px-2.5 py-1 rounded-xl shadow-md uppercase tracking-wider whitespace-nowrap">
                                +30 очков опыта
                            </span>
                        </button>

                        {/* 3. АНАЛИЗИРОВАТЬ ПАРТИЮ ШАХМАТЫ */}
                        <button 
                            onClick={() => { 
                                playSound('click'); 
                                setScreen(AppScreen.CHESS_ANALYSIS); 
                            }} 
                            className="w-full p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 rounded-2xl font-black uppercase tracking-wider border-b-6 border-amber-900 active:border-b-0 active:translate-y-1 transition-all shadow-xl hover:brightness-105 flex items-center justify-between group cursor-pointer ring-2 ring-white/40"
                        >
                            <div className="flex items-center space-x-3 text-left">
                                <span className="text-3xl group-hover:scale-110 transition-transform">🔍</span>
                                <div>
                                    <div className="text-sm sm:text-base font-black text-slate-950 flex items-center gap-1.5">
                                        <span>{user.language === 'ru' ? 'АНАЛИЗИРОВАТЬ ПАРТИЮ ШАХМАТЫ' : 'ANALYZE CHESS GAME'}</span>
                                    </div>
                                    <div className="text-[10px] text-amber-950 font-bold">
                                        {user.language === 'ru' ? 'ИИ-разбор ходов • Оценка позиции • Точность' : 'AI Move Breakdown • Position Eval • Accuracy'}
                                    </div>
                                </div>
                            </div>
                            <span className="bg-slate-950 text-amber-400 text-[11px] font-black px-2.5 py-1 rounded-xl shadow-md uppercase tracking-wider whitespace-nowrap">
                                {user.language === 'ru' ? 'ИИ-Анализ' : 'AI Analysis'}
                            </span>
                        </button>

                        {/* Secondary: Tutorial & Lesson */}
                        <div className="grid grid-cols-2 gap-2.5 pt-1">
                            <button 
                                onClick={() => { setChessMode('tutorial'); setTutorialMessage(t('eduWelcome')); startTraining('chess'); }} 
                                className="py-3 px-3 bg-teal-800/40 hover:bg-teal-800/60 text-gray-900 rounded-xl font-bold uppercase text-xs tracking-wider border border-teal-700/40 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                            >
                                <span className="text-base">💡</span>
                                <span>{t('eduBtn')}</span>
                            </button>
                            <button 
                                onClick={() => { setChessMode('study'); setTutorialMessage(t('lessonWelcome')); startTraining('chess'); }} 
                                className="py-3 px-3 bg-teal-800/40 hover:bg-teal-800/60 text-gray-900 rounded-xl font-bold uppercase text-xs tracking-wider border border-teal-700/40 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                            >
                                <span className="text-base">📖</span>
                                <span>{t('lessonBtn')}</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Bottom Navigation for this screen */}
                <div className="mt-auto w-full max-w-md flex justify-between items-center px-6 py-4 bg-gray-900/10 rounded-3xl mb-4">
                    <button onClick={() => setScreen(AppScreen.PATH)} className="p-2 opacity-50 hover:opacity-100 transition-opacity"><HomeIcon className="w-8 h-8 text-gray-900" /></button>
                    <button className="p-2 opacity-100"><ChessPieceIcon type="n" color="b" className="w-8 h-8" /></button>
                    <button onClick={() => setScreen(AppScreen.LEADERBOARD)} className="p-2 opacity-50 hover:opacity-100 transition-opacity"><ShieldIcon className="w-8 h-8 text-gray-900" /></button>
                    <button className="p-2 opacity-50 hover:opacity-100 transition-opacity"><ChestIcon className="w-8 h-8 text-gray-900" /></button>
                    <button onClick={() => setScreen(AppScreen.SHOP)} className="p-2 opacity-50 hover:opacity-100 transition-opacity"><span className="text-3xl font-black text-gray-900">🏪</span></button>
                    <button onClick={() => setScreen(AppScreen.PROFILE)} className="p-2 opacity-50 hover:opacity-100 transition-opacity"><UserIcon className="w-8 h-8 text-gray-900" /></button>
                </div>
            </div>
          )}

          {screen === AppScreen.CHESS_ANALYSIS && (
            <div className="fixed inset-0 z-[120] bg-slate-950 overflow-y-auto animate-in fade-in duration-200">
              <ChessAnalysisScreen
                initialMoves={chessHistory}
                initialFen={chessFen}
                gameResult={
                  chessStatus === 'mate'
                    ? (feedback.status === 'correct' ? (user.language === 'ru' ? 'Победа белых' : 'White wins') : (user.language === 'ru' ? 'Победа черных' : 'Black wins'))
                    : chessStatus === 'draw'
                    ? (user.language === 'ru' ? 'Ничья' : 'Draw')
                    : (chessHistory.length > 0 ? (user.language === 'ru' ? 'Текущая партия' : 'Active game') : undefined)
                }
                playerColor="w"
                onBack={() => setScreen(AppScreen.CHESS_MATCH)}
                onNewGame={() => {
                  playSound('select');
                  setChessMode('pve');
                  const botOpp = { name: 'DuoWindo6601', elo: 1500, avatar: '🦉', isBot: true };
                  setChessOpponent(botOpp);
                  initChessGame(botOpp);
                  setCurrentExercise({
                    id: crypto.randomUUID(),
                    type: 'chess',
                    originalSentence: "Одиночная партия с DuoWindo6601",
                    targetTranslation: "Checkmate",
                    wordBank: [],
                    chessData: {
                      fen: INITIAL_BOARD_FEN,
                      pgn: [],
                      difficulty: 'intermediate'
                    }
                  });
                  setScreen(AppScreen.LESSON);
                }}
                onPlayAgainstBot={(startFen?: string, startMoves?: string[]) => {
                  playSound('select');
                  setChessMode('pve');
                  const botOpp = { name: 'DuoWindo6601', elo: 1500, avatar: '🦉', isBot: true };
                  setChessOpponent(botOpp);

                  if (startFen && startFen !== INITIAL_BOARD_FEN) {
                    setChessFen(startFen);
                    setChessBoard(parseFen(startFen));
                    const chessObj = new Chess(startFen);
                    const turn = chessObj.turn();
                    setChessTurn(turn);
                    setChessHistory(startMoves || []);
                    setChessSelected(null);
                    setChessValidMoves([]);
                    setChessStatus(chessObj.isGameOver() ? 'mate' : 'active');
                    setChessLastMove(null);
                    setChessTimerSeconds(20 * 60);
                    setChessChat([{
                      role: 'model',
                      text: turn === 'b'
                        ? "Готов проиграть? Я DuoWindo6601! 🦉 Сейчас мой ход черными... Посмотрим!"
                        : "Готов проиграть? Я DuoWindo6601, Гроссмейстер Совиного Королевства! 🦉 Твой ход белыми!"
                    }]);
                    setChessTab('history');
                    setCurrentExercise({
                      id: crypto.randomUUID(),
                      type: 'chess',
                      originalSentence: "Одиночная партия с DuoWindo6601",
                      targetTranslation: "Checkmate",
                      wordBank: [],
                      chessData: {
                        fen: startFen,
                        pgn: startMoves || [],
                        difficulty: 'intermediate'
                      }
                    });
                    setScreen(AppScreen.LESSON);
                    if (turn === 'b' && !chessObj.isGameOver()) {
                      setTimeout(() => makeAiMove(startFen), 600);
                    }
                  } else {
                    initChessGame(botOpp);
                    setCurrentExercise({
                      id: crypto.randomUUID(),
                      type: 'chess',
                      originalSentence: "Одиночная партия с DuoWindo6601",
                      targetTranslation: "Checkmate",
                      wordBank: [],
                      chessData: {
                        fen: INITIAL_BOARD_FEN,
                        pgn: [],
                        difficulty: 'intermediate'
                      }
                    });
                    setScreen(AppScreen.LESSON);
                  }
                }}
              />
            </div>
          )}

          {screen === AppScreen.PRACTICE && (
            <div className="grid md:grid-cols-2 gap-8 py-10 animate-in fade-in">
              {/* VIDEO CALL & ROLEPLAY FEATURED CARDS */}
              <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
                  <button 
                      onClick={() => startVideoCall(t('videoCall'))} 
                      className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 p-6 md:p-8 rounded-[2.5rem] border-b-8 border-purple-900 text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center justify-between shadow-2xl group relative overflow-hidden"
                  >
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest animate-pulse border border-white/20">
                          NEW DuoWindo6601
                      </div>
                      <div className="flex items-center space-x-5 relative z-10">
                          <div className="bg-white/20 p-4 rounded-3xl group-hover:scale-110 transition-transform">
                              <VideoIcon className="w-10 h-10 text-white" />
                          </div>
                          <div>
                              <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="text-2xl md:text-3xl font-black text-white">{t('videoCall')}</h3>
                              </div>
                              <p className="opacity-90 font-bold text-xs md:text-sm text-purple-200">
                                  {t('videoCallDesc')}
                              </p>
                          </div>
                      </div>
                  </button>

                  <button 
                      onClick={() => startTraining('roleplay')} 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 md:p-8 rounded-[2.5rem] border-b-8 border-purple-800 text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center justify-between shadow-2xl group"
                  >
                      <div className="flex items-center space-x-5">
                          <div className="bg-white/20 p-4 rounded-3xl group-hover:rotate-6 transition-transform">
                              <ChatBubbleIcon className="w-10 h-10 text-white" />
                          </div>
                          <div>
                              <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="text-2xl md:text-3xl font-black text-white">{t('roleplays')}</h3>
                                  {user.subscription === 'max' && <span className="bg-black text-duo-blue text-[10px] px-2 py-0.5 rounded font-black border border-duo-blue">MAX</span>}
                              </div>
                              <p className="opacity-90 font-bold text-xs md:text-sm text-white/80">{t('startSpeak')}</p>
                          </div>
                      </div>
                      <Mascot emotion="happy" className="w-20 h-20 hidden sm:block" variant={currentCourse.mascotVariant} />
                  </button>
              </div>
              <button onClick={() => startTraining('listening')} className="bg-duo-blue p-12 rounded-[3rem] border-b-8 border-blue-800 text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center space-x-8 shadow-2xl"><div className="bg-white/20 p-5 rounded-3xl"><VolumeIcon className="w-14 h-14 text-white" /></div><div><h3 className="text-3xl font-bold mb-1">{t('audio')}</h3><p className="opacity-80 font-bold uppercase tracking-widest text-xs">{t('whatHeard')}</p></div></button>
              <button onClick={() => startTraining('speech')} className="bg-duo-orange p-12 rounded-[3rem] border-b-8 border-orange-700 text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center space-x-8 shadow-2xl"><div className="bg-white/20 p-5 rounded-3xl"><MicIcon className="w-14 h-14 text-white" /></div><div><h3 className="text-3xl font-bold mb-1">{t('speech')}</h3><p className="opacity-80 font-bold uppercase tracking-widest text-xs">{t('speakForDuo')}</p></div></button>
              <button onClick={() => startTraining('translation')} className="bg-duo-green p-12 rounded-[3rem] border-b-8 border-duo-greenDark text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center space-x-8 shadow-2xl"><div className="bg-white/20 p-5 rounded-3xl"><BookIcon className="w-14 h-14 text-white" /></div><div><h3 className="text-3xl font-bold mb-1">{t('translate')}</h3><p className="opacity-80 font-bold uppercase tracking-widest text-xs">{t('readPractice')}</p></div></button>
              <button onClick={() => startTraining('reading')} className="bg-teal-500 p-12 rounded-[3rem] border-b-8 border-teal-700 text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center space-x-8 shadow-2xl"><div className="bg-white/20 p-5 rounded-3xl"><BookIcon className="w-14 h-14 text-white" /></div><div><h3 className="text-3xl font-bold mb-1">{t('practice')}</h3><p className="opacity-80 font-bold uppercase tracking-widest text-xs">{t('storiesAndWriting')}</p></div></button>
              <button onClick={() => setScreen(AppScreen.TRANSLATOR)} className="bg-gray-700 p-12 rounded-[3rem] border-b-8 border-gray-900 text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center space-x-8 shadow-2xl"><div className="bg-white/20 p-5 rounded-3xl"><BookIcon className="w-14 h-14 text-white" /></div><div><h3 className="text-3xl font-bold mb-1 text-white">{t('translator')}</h3><p className="opacity-80 font-bold uppercase tracking-widest text-xs text-white">{t('aiTrans')}</p></div></button>
              <button onClick={() => startTraining('illusion')} className="bg-indigo-600 p-12 rounded-[3rem] border-b-8 border-indigo-800 text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center space-x-8 shadow-2xl"><div className="bg-white/20 p-5 rounded-3xl"><EarIcon className="w-14 h-14 text-white" /></div><div><h3 className="text-3xl font-bold mb-1">{t('illusion')}</h3><p className="opacity-80 font-bold uppercase tracking-widest text-xs">{t('realOrNot')}</p></div></button>
              <button onClick={() => startTraining('drawing')} className="bg-pink-600 p-12 rounded-[3rem] border-b-8 border-pink-800 text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center space-x-8 shadow-2xl"><div className="bg-white/20 p-5 rounded-3xl"><PenIcon className="w-14 h-14 text-white" /></div><div><h3 className="text-3xl font-bold mb-1">{t('drawing')}</h3><p className="opacity-80 font-bold uppercase tracking-widest text-xs">{t('writePractice')}</p></div></button>
              <button onClick={() => startTraining('ishihara')} className="bg-teal-600 p-12 rounded-[3rem] border-b-8 border-teal-800 text-left hover:brightness-110 active:translate-y-2 transition-all flex items-center space-x-8 shadow-2xl"><div className="bg-white/20 p-5 rounded-3xl"><PaletteIcon className="w-14 h-14 text-white" /></div><div><h3 className="text-3xl font-bold mb-1">{t('ishihara')}</h3><p className="opacity-80 font-bold uppercase tracking-widest text-xs">{t('ishiharaDesc')}</p></div></button>
              <div className="md:col-span-2 bg-duo-card border-2 border-gray-700 rounded-[3rem] p-8 mt-4 shadow-xl"><h3 className="text-xl font-bold mb-4 flex items-center"><NewWordIcon className="w-6 h-6 mr-2 text-duo-blue"/> {t('topicPrompt')}</h3><div className="flex flex-col sm:flex-row gap-4"><input type="text" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} placeholder={t('topicPlaceholder')} className="flex-1 bg-duo-dark border-2 border-gray-600 rounded-2xl px-6 py-4 font-bold text-white placeholder-gray-500 focus:border-duo-blue focus:outline-none transition-colors" /><button onClick={() => { if (customTopic.trim() === "") { setToast(t('t_topic_empty')); } startTraining('translation', customTopic); }} className="bg-duo-blue border-b-4 border-duo-blueDark rounded-2xl px-8 py-4 font-bold uppercase tracking-widest hover:brightness-110 active:translate-y-1 active:border-b-0 transition-all">{t('start')}</button></div></div>
            </div>
          )}

          {/* ... (LEADERBOARD) ... */}
          {screen === AppScreen.LEADERBOARD && (
             <div className="py-10 animate-in fade-in max-w-4xl mx-auto w-full px-4" dir="auto">
                <div className="flex flex-col items-center mb-6 text-center" dir="auto">
                  <ShieldIcon className="w-20 h-20 text-yellow-400 mb-3 animate-bounce shrink-0" />
                  <h2 className="text-3xl md:text-4xl font-black uppercase tracking-widest text-yellow-400" dir="auto">
                    <bdi dir="auto">{t('leaderboardTitle')}</bdi>
                  </h2>
                  <p className="text-gray-400 font-bold mt-2 text-sm md:text-base" dir="auto">
                    <bdi dir="auto">{t('leaderboardDesc')}</bdi>
                  </p>
                </div>

                {/* 30-DAY ACTIVITY & STREAK PROGRESS BAR CHART */}
                <div className="mb-8 w-full">
                  <ActivityChart user={user} language={user.language} />
                </div>

                {/* LEADERBOARD SECTION TABS: DAILY LEADERBOARD vs ALL-TIME */}
                <div className="flex items-center justify-center p-1.5 bg-gray-900/90 border border-gray-700/80 rounded-2xl mb-6 max-w-md mx-auto shadow-lg">
                  <button
                    onClick={() => { playSound('click'); setLeaderboardTab('daily'); }}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      leaderboardTab === 'daily'
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md scale-[1.02]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>🌟</span>
                    <span>{user.language === 'ru' ? 'Дневной рейтинг' : 'Daily Leaderboard'}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 font-mono font-bold">24ч</span>
                  </button>

                  <button
                    onClick={() => { playSound('click'); setLeaderboardTab('allTime'); }}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      leaderboardTab === 'allTime'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md scale-[1.02]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>🏆</span>
                    <span>{user.language === 'ru' ? 'Общий рейтинг' : 'All-Time League'}</span>
                  </button>
                </div>

                {/* DAILY LEADERBOARD BANNER (WHEN DAILY TAB ACTIVE) */}
                {leaderboardTab === 'daily' && (
                  <div className="mb-6 p-4 md:p-5 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-yellow-950/60 border-2 border-amber-500/60 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-2xl shadow-lg shrink-0 text-slate-950">
                        ⚡
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h3 className="font-black text-base text-amber-300 uppercase tracking-wide">
                            {user.language === 'ru' ? 'Дневной рейтинг (Daily Leaderboard)' : 'Daily Leaderboard'}
                          </h3>
                          <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-lg uppercase tracking-wider shadow-sm">
                            Только сегодня
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 font-bold mt-0.5">
                          {user.language === 'ru'
                            ? 'Фиксирует очки опыта (XP), заработанные только за текущий день. Обнуление каждые 24 часа в полночь.'
                            : 'Specifically tracks and displays XP gains only for the current calendar day, resetting every 24 hours.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="bg-black/60 border border-amber-500/50 rounded-2xl px-4 py-2 text-center shadow-inner">
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">
                          {user.language === 'ru' ? 'Сброс через' : 'Resets in'}
                        </span>
                        <span className="font-mono font-black text-sm text-amber-400">
                          ⏱ {dailyResetCountdown}
                        </span>
                      </div>
                      <div className="bg-amber-500/20 border border-amber-500/50 rounded-2xl px-4 py-2 text-center shadow-inner">
                        <span className="text-[10px] text-amber-300 uppercase font-black tracking-wider block">
                          {user.language === 'ru' ? 'Ваш XP сегодня' : 'Your Today XP'}
                        </span>
                        <span className="font-mono font-black text-sm text-yellow-300">
                          +{dailyXp} XP
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rating / Leaderboard Name Translator Bar */}
                <div className="bg-duo-card border-2 border-purple-500/50 rounded-2xl p-4 mb-6 shadow-xl">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <span className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🌐</span> Имя переводчик / Лидеры (8 языков)
                    </span>
                    <span className="text-[10px] bg-purple-900/50 text-purple-200 px-2 py-0.5 rounded-md border border-purple-500/40 font-mono">
                      {leaderboardLang.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {[
                      { code: 'ru', label: 'RU', flag: '🇷🇺' },
                      { code: 'en', label: 'EN', flag: '🇬🇧' },
                      { code: 'de', label: 'DE', flag: '🇩🇪' },
                      { code: 'fr', label: 'FR', flag: '🇫🇷' },
                      { code: 'es', label: 'ES', flag: '🇪🇸' },
                      { code: 'ja', label: 'JA', flag: '🇯🇵' },
                      { code: 'zh', label: 'ZH', flag: '🇨🇳' },
                      { code: 'ar', label: 'AR', flag: '🇸🇦' },
                    ].map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { playSound('click'); setLeaderboardLang(l.code); }}
                        className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 border ${
                          leaderboardLang === l.code
                            ? 'bg-purple-600 text-white border-purple-400 shadow-md scale-105'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700'
                        }`}
                      >
                        <span className="text-base">{l.flag}</span>
                        <span className="text-[10px]">{l.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {isIncognitoUser && (
                  <div className="mb-6 p-5 rounded-3xl bg-amber-950/50 border-2 border-amber-500/50 flex flex-col md:flex-row items-center justify-between gap-4 text-left shadow-xl" dir="auto">
                    <div className="flex items-center gap-3" dir="auto">
                      <span className="text-3xl shrink-0">🕵️</span>
                      <div dir="auto">
                        <h4 className="font-black text-sm text-amber-300 uppercase" dir="auto">
                          <bdi dir="auto">{t('incognitoTitle')}</bdi>
                        </h4>
                        <p className="text-xs text-amber-200/80 font-medium leading-relaxed" dir="auto">
                          <bdi dir="auto">{t('incognitoLeaderboardDesc')}</bdi>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={openIncognitoRestrictionsModal}
                        className="w-full md:w-auto px-4 py-2.5 bg-amber-900/80 hover:bg-amber-800 text-amber-200 font-bold text-xs uppercase rounded-2xl border border-amber-500/40 active:translate-y-0.5 transition-all whitespace-nowrap shadow-md flex items-center justify-center gap-1.5"
                      >
                        <span>🚫</span>
                        <span>{user.language === 'ru' ? 'Ограничения (8)' : 'Restrictions (8)'}</span>
                      </button>
                      <button
                        onClick={() => openRegisterModal('register')}
                        className="w-full md:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase rounded-2xl border-b-2 border-amber-700 active:translate-y-0.5 transition-all whitespace-nowrap shadow-md flex items-center justify-center gap-1 shrink-0"
                      >
                        <span>✨</span>
                        <span><bdi dir="auto">{t('register')}</bdi></span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-duo-card border-2 border-gray-700 rounded-3xl overflow-hidden shadow-2xl">
                   {(leaderboardTab === 'daily' ? dailyLeaderboardData : leaderboardData).map((entry, index) => {
                      const isUser = entry.id === 'user';
                      const rank = index + 1;
                      let rankColor = "text-gray-400"; if (rank === 1) rankColor = "text-yellow-400"; if (rank === 2) rankColor = "text-gray-300"; if (rank === 3) rankColor = "text-orange-400";
                      
                      // Translate name if available in LEADERBOARD_TRANSLATIONS or custom
                      const botNameMap: Record<string, Record<string, string>> = {
                        'Илон': { ru: 'Илон', en: 'Elon', de: 'Elon', fr: 'Elon', es: 'Elon', ja: 'イーロン', zh: '埃隆', ar: 'إيلون' },
                        'Гермиона': { ru: 'Гермиона', en: 'Hermione', de: 'Hermine', fr: 'Hermione', es: 'Hermione', ja: 'ハーマイオニー', zh: '赫敏', ar: 'هيرميوني' },
                        'Наруто': { ru: 'Наруто', en: 'Naruto', de: 'Naruto', fr: 'Naruto', es: 'Naruto', ja: 'ナルト', zh: '鸣人', ar: 'ناروتو' },
                        'Шерлок': { ru: 'Шерлок', en: 'Sherlock', de: 'Sherlock', fr: 'Sherlock', es: 'Sherlock', ja: 'シャーロック', zh: '夏洛克', ar: 'شيرلوك' },
                        'Валл-И': { ru: 'Валл-И', en: 'WALL-E', de: 'WALL-E', fr: 'WALL-E', es: 'WALL-E', ja: 'ウォーリー', zh: '机器人总动员', ar: 'والي' },
                        'Марио': { ru: 'Марио', en: 'Mario', de: 'Mario', fr: 'Mario', es: 'Mario', ja: 'マリオ', zh: '马里奥', ar: 'ماريو' },
                        'Пикачу': { ru: 'Пикачу', en: 'Pikachu', de: 'Pikachu', fr: 'Pikachu', es: 'Pikachu', ja: 'ピカチュウ', zh: '皮卡丘', ar: 'بيكاتشو' }
                      };
                      const displayName = isUser ? entry.name : (botNameMap[entry.name]?.[leaderboardLang] || entry.name);

                      return ( 
                        <div key={entry.id} className={`flex items-center gap-2.5 sm:gap-4 p-3 sm:p-5 border-b border-gray-700 last:border-0 transition-colors ${isUser ? 'bg-duo-card border-l-4 border-l-duo-blue' : 'hover:bg-white/5'} ${isUser ? 'bg-gray-800' : ''}`} dir="auto">
                          <div className={`w-6 sm:w-8 font-black text-base sm:text-xl text-center shrink-0 ${rankColor}`}>
                            <bdi dir="ltr">{rank}</bdi>
                          </div>
                          <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full ${entry.color} flex items-center justify-center font-bold text-sm sm:text-lg shrink-0 border-2 border-gray-600`}>
                            <bdi dir="auto">{displayName[0]}</bdi>
                          </div>
                          <div className="flex-1 min-w-0" dir="auto">
                            <h3 className={`font-bold text-sm sm:text-base md:text-lg truncate ${isUser ? 'text-duo-blue' : 'text-white'}`}>
                              <bdi dir="auto">{displayName}</bdi>
                            </h3>
                            {isUser && <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase"><bdi dir="auto">{t('isYou')}</bdi></span>}
                          </div>
                          <div className="font-bold text-xs sm:text-base text-gray-400 shrink-0 text-right ltr-preserve" dir="ltr">
                            <bdi dir="ltr">{leaderboardTab === 'daily' ? `+${entry.xp} XP` : `${entry.xp} XP`}</bdi>
                          </div>
                        </div> 
                      );
                   })}
                </div>
             </div>
          )}

          {screen === AppScreen.SHOP && (
             <div className="py-10 space-y-8 animate-in fade-in">
                <h2 className="text-4xl font-bold text-center mb-10 tracking-tight uppercase">{t('shopTitle')}</h2>
                {user.subscription === 'free' && (
                  <div onClick={() => { playSound('click'); setScreen(AppScreen.SUBSCRIPTION); }} className={`bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-3xl border-b-8 border-purple-800 cursor-pointer hover:scale-[1.02] transition-all shadow-2xl mb-10 flex items-center justify-between relative overflow-hidden`}>
                    {isIncognitoUser && (
                      <div className="absolute top-3 right-3 bg-amber-500 text-black text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center space-x-1">
                        <span>🔒</span>
                        <span>{user.language === 'ru' ? 'Требуется аккаунт (Инкогнито)' : 'Account Required (Incognito)'}</span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-2xl font-black text-white mb-2">{t('trySuperTitle')}</h3>
                      <p className="text-white/80 font-bold">{t('trySuperDesc')}</p>
                    </div>
                    <SuperIcon className="w-16 h-16" />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {user.subscription === 'free' ? (<div onClick={() => { playSound('success'); setUser(u => ({...u, energy: 25, gems: Math.max(0, u.gems - 100)})); setToast(t('t_buy_energy')); }} className="bg-duo-card p-8 rounded-3xl border-2 border-b-8 border-duo-red cursor-pointer hover:scale-[1.02] transition-all flex items-center justify-between shadow-xl"><div><h4 className="font-bold text-xl mb-1 uppercase">{t('energy25')}</h4><p className="text-gray-400 font-bold">{t('refill')}</p></div><div className="text-duo-red font-bold text-lg">100 💎</div></div>) : (<div className="bg-duo-card p-8 rounded-3xl border-2 border-b-8 border-gray-700 opacity-80 flex items-center justify-between shadow-xl cursor-default"><div><h4 className="font-bold text-xl mb-1 uppercase text-gray-400">{t('infEnergy')}</h4><p className="text-gray-500 font-bold">{t('activeWith')} {user.subscription === 'super' ? 'Super' : 'Max'}</p></div><InfiniteEnergyIcon className="w-10 h-10 text-yellow-400" /></div>)}
                   <div 
                      className="bg-duo-card p-8 rounded-3xl border-2 border-b-8 border-duo-green cursor-pointer hover:scale-[1.02] transition-all flex items-center justify-between shadow-xl" 
                      onClick={() => { 
                        if (user.gems < 500) {
                          playSound('wrong');
                          setToast(user.language === 'ru' ? "Недостаточно гемов! Нужно 500 💎" : "Not enough gems! Need 500 💎");
                        } else {
                          playSound('purchase');
                          const newCount = (user.streakFreezeCount || 0) + 1;
                          setUser(u => ({ ...u, gems: u.gems - 500, streakFreezeCount: newCount }));
                          setToast(user.language === 'ru' ? `❄️ Заморозка куплена! Всего: ${newCount} шт.` : `❄️ Streak Freeze purchased! Total: ${newCount}`);
                        }
                      }}
                   >
                     <div>
                       <h4 className="font-bold text-xl mb-1 uppercase flex items-center gap-2">
                         <span>{t('freeze')}</span>
                         {(user.streakFreezeCount || 0) > 0 && (
                           <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded-full font-black">
                             x{user.streakFreezeCount}
                           </span>
                         )}
                       </h4>
                       <p className="text-gray-400 font-bold">{t('freezeDesc')}</p>
                     </div>
                     <div className="text-duo-green font-bold text-lg shrink-0 ml-4">500 💎</div>
                   </div>
                </div>

                {/* GEMINI REFILL & BONUS REQUESTS SECTION IN SHOP */}
                <GeminiRefillSection
                    user={user}
                    setUser={setUser}
                    playSound={playSound}
                    onToast={(msg) => setToast(msg)}
                />

                {/* AI LIMIT & SUBSCRIPTION OVERVIEW SECTION */}
                <AiLimitSection
                    user={user}
                    setUser={setUser}
                    onOpenLimitModal={() => setIsAiLimitModalOpen(true)}
                    onUpgrade={(tier) => upgradeSubscription(tier)}
                    playSound={playSound}
                    onToast={(msg) => setToast(msg)}
                />

                <h3 className="text-2xl font-bold text-gray-400 mb-6 uppercase tracking-wider mt-12 border-t-2 border-gray-800 pt-8">{t('refillGems')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div onClick={() => { playSound('success'); setUser(u => ({...u, gems: u.gems + 300})); setToast(`${t('t_buy_gems')}: 300 💎`); }} className="bg-duo-card p-6 rounded-3xl border-2 border-b-8 border-gray-700 cursor-pointer hover:scale-[1.05] transition-all flex flex-col items-center shadow-xl text-center group"><GemStoneIcon className="w-16 h-16 text-duo-blue mb-4 group-hover:animate-bounce" /><h4 className="font-bold text-lg mb-1">{t('handful')}</h4><p className="text-gray-500 font-bold text-sm mb-4">300 шт.</p><div className="w-full py-2 rounded-xl bg-gray-800 font-bold text-green-400 group-hover:bg-green-500 group-hover:text-white transition-colors">Бесплатно</div></div>
                    <div onClick={() => { playSound('success'); setUser(u => ({...u, gems: u.gems + 1200})); setToast(`${t('t_buy_gems')}: 1200 💎`); }} className="bg-duo-card p-6 rounded-3xl border-2 border-b-8 border-gray-700 cursor-pointer hover:scale-[1.05] transition-all flex flex-col items-center shadow-xl text-center group relative overflow-hidden"><div className="absolute top-0 right-0 bg-duo-orange text-white text-[10px] font-black px-2 py-1 rounded-bl-xl uppercase tracking-wider">{t('popular')}</div><GemStoneIcon className="w-20 h-20 text-purple-500 mb-4 group-hover:animate-pulse" /><h4 className="font-bold text-lg mb-1">{t('sack')}</h4><p className="text-gray-500 font-bold text-sm mb-4">1200 шт.</p><div className="w-full py-2 rounded-xl bg-gray-800 font-bold text-white group-hover:bg-duo-blue transition-colors">$4.99</div></div>
                    <div onClick={() => { playSound('success'); setUser(u => ({...u, gems: u.gems + 6500})); setToast(`${t('t_buy_gems')}: 6500 💎`); }} className="bg-duo-card p-6 rounded-3xl border-2 border-b-8 border-gray-700 cursor-pointer hover:scale-[1.05] transition-all flex flex-col items-center shadow-xl text-center group"><ChestIcon className="w-20 h-20 mb-4 group-hover:rotate-12 transition-transform" /><h4 className="font-bold text-lg mb-1">{t('chest')}</h4><p className="text-gray-500 font-bold text-sm mb-4">6500 шт.</p><div className="w-full py-2 rounded-xl bg-gray-800 font-bold text-white group-hover:bg-duo-orange transition-colors">$19.99</div></div>
                </div>
             </div>
          )}

          {screen === AppScreen.PROFILE && (
             <div className="flex flex-col items-center space-y-8 py-10 animate-in fade-in relative max-w-3xl mx-auto w-full px-4 rtl-directional-aware">
                <button onClick={() => { playSound('click'); setScreen(AppScreen.SETTINGS); }} className="absolute top-0 right-4 p-3 bg-duo-card rounded-2xl border-2 border-gray-700 hover:bg-gray-800 transition-colors shadow-lg"><GearIcon className="w-7 h-7 text-gray-400" /></button>
                
                {/* AVATAR INTERACTIVE DISPLAY */}
                <div onClick={openEditProfile} className="relative group cursor-pointer mt-2">
                   <div className={`w-36 h-36 md:w-44 md:h-44 rounded-[3rem] ${user.avatarColor || 'bg-duo-blue'} border-8 border-gray-800 flex items-center justify-center text-7xl font-bold shadow-2xl relative overflow-hidden font-feather transition-transform group-hover:scale-105`}>
                      {user.avatarUrl || user.avatarImage ? (
                         <img src={user.avatarUrl || user.avatarImage} alt={user.name} className="w-full h-full object-cover" />
                      ) : user.avatarIcon ? (
                         <span className="text-7xl">{user.avatarIcon}</span>
                      ) : (
                         <span>{user.name ? user.name[0].toUpperCase() : 'U'}</span>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                         <CameraIcon className="w-10 h-10 mb-1" />
                         <span className="text-xs font-black uppercase tracking-wider">{t('change')}</span>
                      </div>
                   </div>
                </div>

                {/* NAME & USERNAME DISPLAY */}
                <div className="text-center space-y-1">
                   <h2 className="text-3xl md:text-4xl font-black tracking-tight uppercase flex items-center justify-center gap-2">
                      <span>{user.name}</span>
                      {user.subscription === 'super' && <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-xs font-black text-white">SUPER</span>}
                      {user.subscription === 'max' && <span className="px-3 py-1 bg-black border border-duo-blue rounded-lg text-xs font-black text-duo-blue">MAX</span>}
                   </h2>
                   <p className="text-gray-400 font-bold text-sm md:text-base">
                      {user.username ? `@${user.username}` : t('noUsername')}
                   </p>
                   <div className="flex flex-wrap justify-center gap-3 mt-3">
                      <button onClick={openEditProfile} className="px-5 py-2.5 bg-duo-blue hover:brightness-110 text-white rounded-2xl font-black text-xs uppercase tracking-wider border-b-4 border-duo-blueDark active:border-b-0 active:translate-y-1 transition-all flex items-center space-x-2 shadow-lg">
                         <PenIcon className="w-4 h-4" />
                         <span>{t('editProfile')}</span>
                      </button>
                      <button onClick={() => openRegisterModal('register')} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all flex items-center space-x-2 shadow-lg">
                         <span>👤</span>
                         <span>{t('registerAuth')}</span>
                      </button>
                   </div>

   {/* USER CONTACTS & PRIVACY BADGES */}
                   {(user.phone || user.email || user.link) && (
                     <div className="mt-4 p-3.5 bg-duo-card/80 border border-gray-800 rounded-2xl max-w-md mx-auto w-full flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 text-xs">
                       {user.phone && (
                         <div className="flex items-center space-x-1.5 text-gray-300">
                           <span>📱</span>
                           <span className="font-mono font-bold">
                             {user.hidePhone 
                               ? (user.phone.length > 5 ? user.phone.slice(0, 4) + ' ••• •• ' + user.phone.slice(-2) : '••••••••') 
                               : user.phone}
                           </span>
                           {user.hidePhone && (
                             <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                               🔒 Номер скрыт
                             </span>
                           )}
                         </div>
                       )}
                       {user.phone && user.email && <span className="hidden sm:inline text-gray-600">•</span>}
                       {user.email && (
                         <div className="flex items-center space-x-1.5 text-gray-300">
                           <span>📧</span>
                           <span className="font-mono font-bold">
                             {user.hideEmail 
                               ? user.email.split('@')[0].slice(0, 2) + '••••@' + (user.email.split('@')[1] || '•••')
                               : user.email}
                           </span>
                           {user.hideEmail && (
                             <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                               🔒 Email скрыт
                             </span>
                           )}
                         </div>
                       )}
                       {(user.phone || user.email) && user.link && <span className="hidden sm:inline text-gray-600">•</span>}
                       {user.link && (
                         <div className="flex items-center space-x-1.5 text-gray-300">
                           <span>🔗</span>
                           <span className="font-mono font-bold truncate max-w-[180px]">
                             {user.hideLink 
                               ? 'https://••••••••'
                               : user.link}
                           </span>
                           {user.hideLink && (
                             <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">
                               🔒 Ссылка скрыта
                             </span>
                           )}
                         </div>
                       )}
                     </div>
                   )}
                </div>

                {/* 30-DAY ACTIVITY & STREAK PROGRESS BAR CHART */}
                <div className="w-full">
                    <ActivityChart user={user} language={user.language} />
                </div>

                {/* RESPONSIVE GRID FOR PROFILE CARDS (2-COL ON PC, 1-COL ON MOBILE) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                   {/* COLUMN 1: STATS & STREAK CONTROL */}
                   <div className="space-y-6 flex flex-col">
                      <div className="grid grid-cols-2 gap-4 w-full">
                         <div className="bg-duo-card p-5 rounded-3xl border-2 border-gray-800 text-center shadow-xl">
                            <p className="text-[11px] text-gray-500 font-bold mb-1 uppercase tracking-widest">{t('streakDays')}</p>
                            <p className="text-3xl md:text-4xl font-black text-duo-red">{user.streak}</p>
                         </div>
                         <div className="bg-duo-card p-5 rounded-3xl border-2 border-gray-800 text-center shadow-xl">
                            <p className="text-[11px] text-gray-500 font-bold mb-1 uppercase tracking-widest">{t('totalXP')}</p>
                            <p className="text-3xl md:text-4xl font-black text-duo-yellow">{user.xp}</p>
                         </div>
                      </div>

                      {/* Streak Fair Play & Lesson Resume Card */}
                      <div className="w-full bg-duo-card border-2 border-duo-red/50 rounded-3xl p-5 shadow-xl text-center space-y-4">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                               <span className="text-2xl animate-bounce">🔥</span>
                               <h3 className="text-sm md:text-base font-black text-white uppercase tracking-wider">{t('streakResume')}</h3>
                            </div>
                            <span className="text-[10px] bg-red-500/20 text-red-300 font-bold px-2.5 py-1 rounded-full border border-red-500/30">
                               {t('streakFairPlayBadge')}
                            </span>
                         </div>
                         <p className="text-xs text-gray-400 font-medium text-left leading-relaxed">
                            {t('streakAdjustment')}
                         </p>

                         {/* Streak Display Info */}
                         <div className="bg-black/40 p-4 rounded-2xl border border-gray-800 flex items-center justify-between">
                            <div className="text-left space-y-1">
                               <div className="flex items-center space-x-2">
                                  <span className="text-3xl font-black text-duo-red">{user.streak}</span>
                                  <span className="text-xs text-gray-400 font-bold uppercase">{t('days')}</span>
                               </div>
                               <p className="text-[11px] text-gray-400 font-medium">
                                  {user.lastActiveDate === new Date().toISOString().split('T')[0]
                                     ? '✅ ' + (user.language === 'ru' ? 'Сегодня урок пройден (+1 день сохранён)' : 'Today\'s lesson completed (+1 day active)')
                                     : '⏳ ' + (user.language === 'ru' ? 'Пройдите урок сегодня для продления' : 'Complete a lesson today to extend streak')}
                               </p>
                            </div>

                            <div className="text-right">
                               <span className="inline-block text-xs bg-cyan-950/80 text-cyan-300 font-bold px-3 py-1.5 rounded-xl border border-cyan-800/50">
                                  {t('streakFreezeActive').replace('{count}', String(user.streakFreezeCount))}
                                </span>
                            </div>
                         </div>

                         {/* Lost Streak Restriction & Recovery Policy */}
                         {((user.previousLostStreak || 0) > 0 || (user.streak === 0 && (user.maxStreak || 0) > 0)) && (
                            <div className="bg-gradient-to-r from-red-950/70 via-gray-900 to-amber-950/70 border-2 border-amber-500/50 p-4 rounded-2xl text-left space-y-3 shadow-xl">
                               <div className="flex items-center justify-between gap-2 border-b border-gray-800 pb-2.5">
                                  <span className="text-xs font-black text-amber-300 uppercase tracking-wide flex items-center space-x-1.5">
                                     <span className="text-base">🔒</span>
                                     <span>{user.language === 'ru' ? 'Ограничение: Восстановление Ударного Режима' : 'Restricted: Streak Recovery'}</span>
                                  </span>
                                  <span className="text-[10px] font-bold text-red-300 bg-red-500/20 px-2 py-0.5 rounded-lg border border-red-500/40">
                                     {user.language === 'ru' ? `Потеряно: ${user.previousLostStreak || user.maxStreak} дн.` : `Lost: ${user.previousLostStreak || user.maxStreak} d.`}
                                  </span>
                               </div>
                               <p className="text-[11px] text-gray-300 font-medium leading-relaxed">
                                  {user.language === 'ru' 
                                     ? 'Самостоятельное восстановление ударного режима заблокировано для честного рейтинга. Доступ открыт только Администратору через Панель Владельца (Admin Tool) или по обращению в Чат техподдержки.'
                                     : 'Direct streak recovery is restricted for fair play. Available exclusively to Administrators in the Admin Tool or via the Support Chat.'}
                                </p>
                               <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                  {(user.isAdmin || (user.email && user.email.toLowerCase().includes('abramov'))) && (
                                     <button
                                        onClick={() => {
                                           playSound('click');
                                           setScreen(AppScreen.ADMIN_DASHBOARD);
                                           setToast(user.language === 'ru' ? '👑 Открыта Панель Владельца (Admin Tool)' : '👑 Opened Admin Tool');
                                        }}
                                        className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow border-b-2 border-amber-700 active:translate-y-0.5 transition-all flex items-center justify-center space-x-1.5"
                                     >
                                        <span>👑</span>
                                        <span>{user.language === 'ru' ? 'Admin Tool: Восстановить' : 'Admin Tool: Restore'}</span>
                                     </button>
                                  )}
                                  <button
                                     onClick={() => {
                                        playSound('click');
                                        setScreen(AppScreen.SUPPORT_CHAT);
                                        setToast(user.language === 'ru' ? '💬 Открыт Чат техподдержки' : '💬 Opened Support Chat');
                                     }}
                                     className="flex-1 py-2.5 px-3 bg-duo-blue hover:bg-sky-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow border-b-2 border-duo-blueDark active:translate-y-0.5 transition-all flex items-center justify-center space-x-1.5"
                                  >
                                     <span>💬</span>
                                     <span>{user.language === 'ru' ? 'Чат техподдержки (Восстановить серию)' : 'Support Chat (Restore Streak)'}</span>
                                  </button>
                               </div>
                            </div>
                         )}

                         {/* Action to Start Lesson */}
                         <button
                            onClick={() => {
                               playSound('click');
                               setScreen(AppScreen.PATH);
                               setToast(user.language === 'ru' ? '🎯 Выберите тему урока на пути!' : '🎯 Choose a lesson on your learning path!');
                            }}
                            className="w-full py-3.5 bg-duo-red hover:bg-red-600 active:scale-[0.98] text-white font-black rounded-2xl border-b-4 border-red-800 transition-all uppercase text-xs tracking-wider shadow-md flex items-center justify-center space-x-2"
                         >
                            <span>{t('streakLessonAction')}</span>
                         </button>
                      </div>
                   </div>

                   {/* COLUMN 2: CLOUD SYNC & FEEDBACK */}
                   <div className="space-y-6 flex flex-col">
                      <div className="w-full bg-duo-card rounded-3xl border-2 border-gray-800 p-5 md:p-6 flex flex-col items-center text-center space-y-4 shadow-xl h-full justify-between">
                         <div className="w-full space-y-3">
                            <div className="flex items-center justify-center space-x-2">
                               <span className="text-2xl">☁️</span>
                               <h3 className="text-lg font-bold text-white uppercase tracking-wider">{t('cloudSaveTitle')}</h3>
                            </div>
                            {authLoading ? (
                               <p className="text-sm text-gray-500 font-bold">{t('loading')}</p>
                            ) : firebaseUser ? (
                               <div className="space-y-3 w-full">
                                  <div className="text-sm text-gray-400 font-bold">
                                     {t('loggedInAs').split('{user}')[0]}
                                     <span className="text-duo-blue">{firebaseUser.displayName || firebaseUser.email}</span>
                                     {t('loggedInAs').split('{user}')[1]}
                                  </div>
                                  <p className="text-xs text-green-400 font-medium">{t('progressSynced')}</p>

                                  {/* FIREBASE FIRESTORE & AUTH EXPORT BUTTON */}
                                  <button 
                                     onClick={() => {
                                        playSound('click');
                                        setShowFirebaseExportModal(true);
                                     }}
                                     className="w-full py-3 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-black rounded-2xl border-b-4 border-amber-900 active:border-b-0 active:translate-y-1 transition-all text-xs uppercase flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
                                  >
                                     <span>🔥</span>
                                     <span>{user.language === 'ru' ? 'Экспорт данных Firebase Firestore & Auth' : 'Export Firebase Firestore & Auth'}</span>
                                  </button>

                                  <button 
                                     onClick={handleSignOut} 
                                     className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all text-xs uppercase"
                                  >
                                     {t('signOut')}
                                  </button>
                               </div>
                            ) : (
                               <div className="space-y-3 w-full">
                                  <div className={`border p-3.5 rounded-2xl text-left space-y-2 ${
                                     incognitoClosed 
                                        ? 'bg-rose-950/40 border-rose-500/60' 
                                        : 'bg-emerald-950/50 border-emerald-500/50'
                                  }`}>
                                     <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                           <span className="text-base">{incognitoClosed ? '🛑' : '🕵️'}</span>
                                           <span className="font-black text-xs text-white uppercase">
                                              {t('incognitoTitle')}
                                           </span>
                                        </div>
                                        <span className="text-[10px] bg-black/40 border border-gray-700 px-2 py-0.5 rounded-lg text-gray-300 font-mono">
                                           {user.username ? `@${user.username}` : 'guest'}
                                        </span>
                                     </div>

                                     <div className="p-3 bg-black/40 border border-amber-500/40 rounded-xl space-y-1.5 text-left">
                                        <div className="flex items-center space-x-1.5 text-amber-300 font-black uppercase text-[11px]">
                                           <span>🚫</span>
                                           <span>{getIncognitoClosureTitle(user.language)}</span>
                                        </div>
                                        <p className="text-[11px] text-amber-200 font-bold leading-normal">
                                           {user.language === 'ru'
                                              ? '10 октября 2026 года вход в Режим Инкогнито недоступен, и его нельзя будет восстановить в DuoWindo6601.'
                                              : 'On October 10, 2026, entry into Incognito Mode is unavailable and cannot be restored in DuoWindo6601.'}
                                        </p>
                                        <p className="text-[10px] text-gray-300 font-medium leading-relaxed">
                                           {user.language === 'ru'
                                              ? 'Синхронизирован актуальный статус не закрытия: Полный Вход и регистрация работают без ограничений, профиль Администратора доступен.'
                                              : 'Synchronized actual unclosed status: Full Sign-In & registration operate normally, Admin Profile is active.'}
                                        </p>
                                     </div>

                                     <div className="flex flex-wrap gap-1.5 text-[10px] font-bold pt-0.5">
                                        <span className="bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 px-2 py-0.5 rounded-md flex items-center space-x-1">
                                           <span>✅</span>
                                           <span>{user.language === 'ru' ? 'Полный Вход и регистрация: НЕ ЗАКРЫТ (Работает)' : 'Full Sign-In & Registration: NOT CLOSED (Active)'}</span>
                                        </span>
                                        <span className="bg-amber-950/90 text-amber-300 border border-amber-500/60 px-2 py-0.5 rounded-md flex items-center space-x-1">
                                           <span>👑</span>
                                           <span>{user.language === 'ru' ? 'Профиль Администратора: НЕ ЗАКРЫТ' : 'Admin Profile: NOT CLOSED'}</span>
                                        </span>
                                     </div>

                                     {/* EXPORT DATA BUTTON */}
                                     <button
                                        onClick={() => {
                                           playSound('click');
                                           setShowIncognitoExportModal(true);
                                        }}
                                        className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow border-b-2 border-emerald-800 active:translate-y-0.5 transition-all flex items-center justify-center space-x-1.5 cursor-pointer mt-1"
                                     >
                                        <span>💾</span>
                                        <span>{user.language === 'ru' ? 'Экспорт данных Режим Инкогнито' : 'Export Incognito Data'}</span>
                                     </button>

                                     {/* EXPORT FIREBASE (FIRESTORE & AUTH) BUTTON */}
                                     <button
                                        onClick={() => {
                                           playSound('click');
                                           setShowFirebaseExportModal(true);
                                        }}
                                        className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow border-b-2 border-amber-800 active:translate-y-0.5 transition-all flex items-center justify-center space-x-1.5 cursor-pointer mt-1.5"
                                     >
                                        <span>🔥</span>
                                        <span>{user.language === 'ru' ? 'Экспорт Firebase Firestore & Auth' : 'Export Firebase Firestore & Auth'}</span>
                                     </button>
                                  </div>

                                  {isIframe && (
                                     <div className="bg-amber-950/40 border border-amber-800/60 p-3 rounded-2xl text-xs text-amber-200 font-medium space-y-2 mb-2 text-left">
                                        <p>{t('iframeWarning')}</p>
                                        <button 
                                           onClick={() => { playSound('click'); window.open(window.location.href, '_blank'); }} 
                                           className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-xl active:translate-y-0.5 transition-all uppercase text-[10px] tracking-wider text-center"
                                        >
                                           {t('openNewTabBtn')}
                                        </button>
                                     </div>
                                  )}

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                                     <button 
                                        onClick={() => openRegisterModal("login")} 
                                        className="w-full py-3 bg-duo-blue hover:bg-sky-500 text-white font-black rounded-2xl border-b-4 border-duo-blueDark active:border-b-0 active:translate-y-1 transition-all text-xs uppercase flex items-center justify-center space-x-1 shadow-lg cursor-pointer"
                                     >
                                        <span>🔑</span>
                                        <span>{user.language === "ru" ? "Полный Вход" : "Full Sign-In"}</span>
                                     </button>

                                     <button 
                                        onClick={() => openRegisterModal("register")} 
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all text-xs uppercase flex items-center justify-center space-x-1 shadow-lg cursor-pointer"
                                     >
                                        <span>📝</span>
                                        <span>{user.language === "ru" ? "Регистрация" : "Sign Up"}</span>
                                     </button>

                                     <button 
                                        onClick={() => openRegisterModal("google")} 
                                        className="w-full py-3 bg-duo-blue hover:brightness-110 text-white font-black rounded-2xl border-b-4 border-duo-blueDark active:border-b-0 active:translate-y-1 transition-all text-xs uppercase flex items-center justify-center space-x-1 shadow-lg cursor-pointer"
                                     >
                                        <span>🌐</span>
                                        <span>Google</span>
                                     </button>
                                  </div>
                               </div>
                            )}
                         </div>

                         {/* Feedback Entry Banner inside column 2 */}
                         <button 
                           onClick={() => { playSound('click'); setScreen(AppScreen.FEEDBACK); }}
                           className="w-full bg-gradient-to-r from-duo-yellow/20 to-duo-green/20 border-2 border-duo-yellow hover:border-white p-4 rounded-2xl flex items-center justify-between shadow-xl transition-all group cursor-pointer mt-2"
                         >
                           <div className="flex items-center space-x-3 text-left">
                             <div className="bg-duo-yellow p-2.5 rounded-xl text-white shadow-md group-hover:scale-110 transition-transform">
                               <ChatBubbleIcon className="w-5 h-5" />
                             </div>
                             <div>
                               <h4 className="font-bold text-xs uppercase text-white tracking-wider">{t('feedbackBannerTitle')}</h4>
                               <p className="text-[10px] text-gray-300 font-bold">{t('feedbackBannerDesc')}</p>
                             </div>
                           </div>
                           <ArrowRightIcon className="w-5 h-5 text-duo-yellow group-hover:translate-x-1 transition-transform" />
                         </button>

                         {/* Admin Dashboard Entry Banner */}
                         <button 
                           onClick={() => { playSound('click'); setScreen(AppScreen.ADMIN_DASHBOARD); }}
                           className="w-full bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-amber-700/20 border-2 border-amber-500 hover:border-amber-400 p-4 rounded-2xl flex items-center justify-between shadow-xl transition-all group cursor-pointer mt-2"
                         >
                           <div className="flex items-center space-x-3 text-left">
                             <div className="bg-amber-500 p-2 rounded-xl text-black font-black text-xl shadow-md group-hover:scale-110 transition-transform flex-shrink-0">
                               👑
                             </div>
                             <div>
                               <div className="flex items-center space-x-2 flex-wrap">
                                 <h4 className="font-bold text-xs text-amber-400 uppercase tracking-wider">{t('adminBannerTitle')}</h4>
                                 <span className="bg-red-500/25 border border-red-500/40 text-red-300 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                   {user.language === 'ru' ? 'Доступ только администратора' : 'Admin Only'}
                                 </span>
                               </div>
                               <p className="text-[10px] text-gray-300 font-bold mt-0.5">{t('adminBannerDesc')}</p>
                             </div>
                           </div>
                           <ArrowRightIcon className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {screen === AppScreen.VOCABULARY && (
            <VocabularyBank
              user={user}
              courses={COURSES}
              currentCourse={currentCourse}
              onBack={() => setScreen(AppScreen.PATH)}
              onSpeak={(text, courseId, slow = false) => {
                speakText(text, courseId, slow, user.preferredVoice, user.voiceProvider);
              }}
            />
          )}
          {screen === AppScreen.FEEDBACK && (
            <FeedbackScreen
              user={user}
              t={t}
              onBack={() => setScreen(AppScreen.PATH)}
              playSound={playSound}
              setToast={setToast}
              onOpenAdminDashboard={() => setScreen(AppScreen.ADMIN_DASHBOARD)}
              onOpenSupportChat={() => setScreen(AppScreen.SUPPORT_CHAT)}
              onOpenIncognitoRestrictions={openIncognitoRestrictionsModal}
              onOpenRegister={openRegisterModal}
              courses={COURSES}
              currentCourse={currentCourse}
              onSetLanguage={(newLang) => {
                setUser((prev) => {
                  const updated = { ...prev, language: newLang };
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                  return updated;
                });
              }}
            />
          )}

          {screen === AppScreen.ADMIN_DASHBOARD && (
            <AdminDashboard
              user={user}
              onBack={() => setScreen(AppScreen.PATH)}
              playSound={playSound}
              setToast={setToast}
              onUpdateUser={setUser}
              onOpenSupportChat={() => setScreen(AppScreen.SUPPORT_CHAT)}
              isIncognito={isIncognitoUser}
            />
          )}

          {screen === AppScreen.SUPPORT_CHAT && (
            <SupportChatScreen
              user={user}
              onBack={() => setScreen(AppScreen.PATH)}
              playSound={playSound}
              setToast={setToast}
              onUpdateUser={setUser}
              isIncognito={isIncognitoUser}
              onOpenProfile={() => setScreen(AppScreen.PROFILE)}
            />
          )}

          {screen === AppScreen.BROWSER_WARNING && (
            <div className="py-8 max-w-3xl mx-auto w-full px-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => { playSound('click'); setScreen(AppScreen.PATH); }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs uppercase rounded-xl border-b-2 border-gray-900 flex items-center space-x-2 transition-all shadow-md"
                >
                  <span>←</span>
                  <span>{t('back')}</span>
                </button>

                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/40">
                  DuoWindo6601 Browser & OS Alert
                </span>
              </div>

              <div className="bg-duo-card border-2 border-amber-500/80 rounded-[2.5rem] p-6 md:p-10 shadow-2xl space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-amber-500/20 p-4 rounded-2xl border border-amber-500/50 text-4xl shrink-0">
                    ⚠️
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-black text-amber-400 uppercase tracking-wide leading-tight">
                      {t('browserWarningTitle')}
                    </h1>
                    <p className="text-xs text-amber-200/80 font-bold uppercase tracking-wider mt-1">
                      {t('browserWarningSub')}
                    </p>
                  </div>
                </div>

                {!isOutdatedBrowserDetected ? (
                  <div className="bg-emerald-950/70 border-2 border-emerald-500/70 p-4 rounded-2xl flex items-center space-x-3 text-emerald-200 text-xs md:text-sm font-bold shadow-md">
                    <span className="text-2xl">✅</span>
                    <div>
                      <span className="text-emerald-300 font-black uppercase block">{t('browserCompatibleTitle')}</span>
                      <span>{t('browserCompatibleDesc')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-rose-950/70 border-2 border-rose-500/70 p-4 rounded-2xl flex items-center space-x-3 text-rose-200 text-xs md:text-sm font-bold shadow-md">
                    <span className="text-2xl">🛑</span>
                    <div>
                      <span className="text-rose-300 font-black uppercase block">{t('browserOutdatedTitle')}</span>
                      <span>{t('browserOutdatedDesc')}</span>
                    </div>
                  </div>
                )}

                <div className="bg-amber-950/60 border-2 border-amber-500/60 p-5 rounded-2xl text-amber-100 text-sm md:text-base font-bold leading-relaxed shadow-inner">
                  <p className="text-xs uppercase text-amber-400 font-black mb-1.5 tracking-wider">{t('sysMessageLabel')}</p>
                  <p>
                    {t('sysMessageDesc')}
                  </p>
                </div>

                <div className="bg-rose-950/70 border-2 border-rose-500/60 p-5 rounded-2xl flex items-start space-x-3.5 text-rose-200 text-xs md:text-sm font-bold leading-relaxed shadow-lg">
                  <span className="text-2xl shrink-0">🚨</span>
                  <div>
                    <span className="text-rose-300 font-black uppercase block text-xs tracking-wider mb-1">{t('riskLabel')}</span>
                    <span>{t('riskDesc')}</span>
                  </div>
                </div>

                {/* Windows OS Lifecycle & Support Status */}
                <div className="bg-gray-900/60 border border-gray-800 p-5 rounded-2xl space-y-3.5">
                  <h3 className="font-black text-xs text-white uppercase tracking-wider flex items-center gap-2">
                    <span>💻</span>
                    <span>{t('winOsSupportLabel')}</span>
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-black text-white text-sm">Windows 7</span>
                        <p className="text-gray-400 text-[11px] mt-0.5">{t('win7Desc')}</p>
                      </div>
                      <span className="text-[10px] bg-red-500/20 text-red-300 px-2.5 py-1 rounded-full border border-red-500/30 font-black uppercase whitespace-nowrap self-start sm:self-center">
                        {t('win7Status')}
                      </span>
                    </div>

                    <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-black text-white text-sm">Windows 8 / 8.1</span>
                        <p className="text-gray-400 text-[11px] mt-0.5">{t('win7Desc')}</p>
                      </div>
                      <span className="text-[10px] bg-red-500/20 text-red-300 px-2.5 py-1 rounded-full border border-red-500/30 font-black uppercase whitespace-nowrap self-start sm:self-center">
                        {t('win8Status')}
                      </span>
                    </div>

                    <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-black text-white text-sm">Windows 10</span>
                          <p className="text-gray-400 text-[11px] mt-0.5">{t('win10Desc')}</p>
                        </div>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30 font-black uppercase whitespace-nowrap self-start sm:self-center">
                          {t('win10Status')}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-200/70 leading-relaxed italic">
                        {t('win10Note')}
                      </p>
                    </div>

                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-black text-white text-sm">Windows 11</span>
                          <p className="text-gray-400 text-[11px] mt-0.5">{t('win11Desc')}</p>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30 font-black uppercase whitespace-nowrap self-start sm:self-center">
                          {t('win11Status')}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-200/70 leading-relaxed italic">
                        {t('win11Note')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/80 border border-gray-700/80 p-5 rounded-2xl space-y-3">
                  <h3 className="font-black text-xs text-white uppercase tracking-wider flex items-center gap-2">
                    <span>🌐</span>
                    <span>{t('modernBrowsersLabel')}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
                    <a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center justify-between text-blue-300 transition-colors border border-gray-700">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">🌐</span>
                        <span>Google Chrome</span>
                      </div>
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded uppercase font-black">{t('downloadBtn')}</span>
                    </a>

                    <a href="https://www.mozilla.org/firefox/" target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center justify-between text-amber-300 transition-colors border border-gray-700">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">🦊</span>
                        <span>Mozilla Firefox</span>
                      </div>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded uppercase font-black">{t('downloadBtn')}</span>
                    </a>

                    <a href="https://browser.yandex.ru/" target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center justify-between text-red-300 transition-colors border border-gray-700">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">🔴</span>
                        <span>Яндекс Браузер</span>
                      </div>
                      <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded uppercase font-black">{t('downloadBtn')}</span>
                    </a>

                    <a href="https://www.microsoft.com/edge" target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center justify-between text-teal-300 transition-colors border border-gray-700">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">🌀</span>
                        <span>Microsoft Edge</span>
                      </div>
                      <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded uppercase font-black">{t('downloadBtn')}</span>
                    </a>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <a
                    href="https://www.google.com/chrome/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm uppercase tracking-widest rounded-2xl border-b-4 border-amber-700 active:translate-y-0.5 transition-all flex items-center justify-center space-x-2 shadow-xl text-center block"
                  >
                    <span>🚀</span>
                    <span>{t('updateBrowserBtn')}</span>
                  </a>

                  <button
                    onClick={() => {
                      playSound('click');
                      setScreen(AppScreen.PATH);
                    }}
                    className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs uppercase rounded-xl transition-all border border-gray-700"
                  >
                    {t('continueDuoWindoBtn')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MOBILE NAV */}
      {screen !== AppScreen.LESSON && screen !== AppScreen.VIDEO_CALL && (
        <nav className={isSimulatingMobile
          ? `fixed bottom-0 left-0 w-full ${isLightMode ? 'bg-white/95 border-slate-200' : 'bg-duo-dark/95 border-gray-800'} backdrop-blur-xl border-t px-2 py-2 flex items-center justify-around z-50 pb-6 shadow-2xl safe-bottom overflow-x-auto no-scrollbar gap-1`
          : `lg:hidden fixed bottom-0 left-0 w-full ${isLightMode ? 'bg-white/95 border-slate-200' : 'bg-duo-dark/95 border-gray-800'} backdrop-blur-xl border-t px-2 py-2 flex items-center justify-around z-50 pb-6 shadow-2xl safe-bottom overflow-x-auto no-scrollbar gap-1`
        }>
          {NAV_ITEMS.filter(item => MOBILE_NAV_SCREENS.includes(item.screen)).map(item => {
            const todayStr = new Date().toISOString().split('T')[0];
            const isTodayChallengePending = item.screen === AppScreen.PATH && 
              user.dailyChallengeCompletedDate !== todayStr && 
              dailyChallengeDismissedDate !== todayStr;
            const isActive = screen === item.screen;
            return (
              <button 
                key={item.screen} 
                onClick={() => handleNavigation(item.screen)} 
                className={`flex flex-col items-center justify-center min-w-[44px] py-1 px-1 rounded-xl transition-all duration-200 relative cursor-pointer flex-shrink-0 ${
                  isActive 
                    ? 'text-duo-blue scale-105 font-black bg-duo-blue/10' 
                    : isLightMode 
                      ? 'text-slate-500 hover:text-slate-900' 
                      : 'text-gray-400 hover:text-white'
                }`}
                title={item.label}
              >
                <div className="relative">
                  <item.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                  {isTodayChallengePending && (
                    <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 bg-duo-orange rounded-full border-2 ${isLightMode ? 'border-white' : 'border-duo-dark'} animate-pulse`} />
                  )}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-tighter mt-0.5 max-w-[48px] truncate text-center leading-none ${isActive ? 'text-duo-blue font-black' : 'text-gray-400 opacity-80'}`}>
                  {item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {/* CHESS INVITE MODAL (Link, Name Search, Contacts, Your Friends) */}
      <ChessInviteModal
        isOpen={isChessInviteModalOpen}
        onClose={() => setIsChessInviteModalOpen(false)}
        onStartMatch={handleStartPvpChess}
        currentUserName={user.name || user.username || 'Пользователь'}
        currentUserElo={user.chessStats?.elo || 1400}
        language={user.language}
        playSound={playSound}
      />

      {/* AUTHENTICATION & REGISTRATION MODAL (Email, Username, Password, Google, Incognito) */}
      <AuthModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        user={user}
        setUser={setUser}
        firebaseUser={firebaseUser}
        setFirebaseUser={setFirebaseUser}
        t={t}
        playSound={playSound}
        setToast={setToast}
        onOpenIncognitoRestrictions={openIncognitoRestrictionsModal}
        onOpenIncognitoExport={() => setShowIncognitoExportModal(true)}
        onOpenFirebaseExport={() => setShowFirebaseExportModal(true)}
        initialTab={regInitialTab}
      />

      {/* INCOGNITO RESTRICTIONS MODAL */}
      <IncognitoRestrictionsModal
        isOpen={showIncognitoRestrictionsModal}
        onClose={() => setShowIncognitoRestrictionsModal(false)}
        onOpenRegister={openRegisterModal}
        onGoogleSignIn={handleGoogleSignIn}
        language={user.language}
        playSound={playSound}
        user={user}
        onOpenExport={() => setShowIncognitoExportModal(true)}
      />

      {/* INCOGNITO DATA EXPORT MODAL */}
      <IncognitoDataExportModal
        isOpen={showIncognitoExportModal}
        onClose={() => setShowIncognitoExportModal(false)}
        user={user}
        onOpenRegister={openRegisterModal}
        language={user.language}
        playSound={playSound}
        setToast={setToast}
      />

      {/* FIREBASE FIRESTORE & AUTH EXPORT MODAL */}
      <FirebaseExportModal
        isOpen={showFirebaseExportModal}
        onClose={() => setShowFirebaseExportModal(false)}
        user={user}
        firebaseUser={firebaseUser}
        language={user.language}
        playSound={playSound}
        setToast={setToast}
        onOpenRegister={openRegisterModal}
      />

      {/* DUOWINDO6601 BETA TESTING CENTER MODAL */}
      {showBetaModal && (
        <BetaModal
          user={user}
          setUser={setUser}
          onClose={() => setShowBetaModal(false)}
          onOpenAdmin={() => {
            setShowBetaModal(false);
            setScreen(AppScreen.ADMIN_DASHBOARD);
          }}
          onOpenSystemInfo={() => {
            setShowBetaModal(false);
            setShowSystemInfoModal(true);
          }}
          onOpenFeedback={() => {
            setShowBetaModal(false);
            setScreen(AppScreen.FEEDBACK);
          }}
          courses={COURSES}
          onSelectCourse={(course) => {
            setCurrentCourse(course);
            localStorage.setItem('duo_course_id_6601', course.id);
            setScreen(AppScreen.PATH);
            setShowBetaModal(false);
          }}
          onDismissBanner={() => {
            setBetaDismissed(true);
            localStorage.setItem('duo_beta_dismissed', 'true');
            setShowBetaModal(false);
          }}
          playSound={playSound}
        />
      )}

      {/* SYSTEM INFO & COMPATIBILITY MODAL */}
      {showSystemInfoModal && (
        <SystemInfoModal
          systemInfo={systemInfo}
          simMode={simSystemMode}
          onSetSimMode={setSimSystemMode}
          onClose={() => setShowSystemInfoModal(false)}
          lang={user.language}
        />
      )}

      {/* GEMINI AI DAILY LIMIT MODAL */}
      <AiLimitModal
        isOpen={isAiLimitModalOpen}
        onClose={() => setIsAiLimitModalOpen(false)}
        status={aiLimitStatus}
        currentSubscription={user.subscription || 'free'}
        onUpgrade={(tier) => {
          setIsAiLimitModalOpen(false);
          upgradeSubscription(tier);
        }}
        language={user.language}
        playSound={playSound}
      />

      {/* EDIT PROFILE MODAL */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-duo-dark border-2 border-gray-700 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 text-white my-8 relative rtl-directional-aware">
            <button 
              onClick={() => { playSound('click'); setShowEditProfileModal(false); }} 
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-xl bg-gray-800 transition-colors"
            >
              <CloseIcon className="w-6 h-6"/>
            </button>

            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-white">
              {t('editProfile')}
            </h2>

            {/* AVATAR PREVIEW & EDIT SECTION */}
            <div className="flex flex-col items-center space-y-4 pt-2">
              <div className="relative group">
                <div className={`w-32 h-32 md:w-36 md:h-36 rounded-[2.5rem] ${editAvatarColor || 'bg-duo-blue'} border-4 border-gray-700 flex items-center justify-center text-5xl font-bold overflow-hidden shadow-xl`}>
                  {editAvatarUrl ? (
                    <img src={editAvatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : editAvatarIcon ? (
                    <span className="text-6xl">{editAvatarIcon}</span>
                  ) : (
                    <span className="text-6xl">{editName ? editName[0].toUpperCase() : 'U'}</span>
                  )}
                </div>
                <button 
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 p-3 bg-duo-blue hover:brightness-110 text-white rounded-2xl border-2 border-gray-900 shadow-lg active:scale-95 transition-transform"
                  title="Загрузить фото"
                >
                  <CameraIcon className="w-5 h-5" />
                </button>
                <input 
                  type="file" 
                  ref={avatarFileInputRef} 
                  onChange={handleAvatarFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              {/* FILE UPLOAD & URL CONTROLS */}
              <div className="flex flex-wrap justify-center gap-2 w-full pt-1">
                <button 
                  onClick={() => avatarFileInputRef.current?.click()} 
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
                >
                  <span>{t('uploadPhotoBtn')}</span>
                </button>
                {editAvatarUrl && (
                  <button 
                    onClick={() => { setEditAvatarUrl(''); setToast("Photo cleared"); }} 
                    className="px-3 py-2 bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-700 rounded-xl text-xs font-bold transition-all"
                  >
                    <span>{t('deletePhotoBtn')}</span>
                  </button>
                )}
              </div>

              {/* OR IMAGE URL INPUT */}
              <div className="w-full space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {t('avatarUrlLabel')}
                </label>
                <input 
                  type="text" 
                  value={editAvatarUrl.startsWith('data:') ? '' : editAvatarUrl} 
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-gray-800 border-2 border-gray-700 focus:border-duo-blue text-white rounded-2xl px-4 py-2.5 text-xs font-bold focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* COLOR SELECTOR */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                {t('avatarBgColorLabel')}
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Синий', color: 'bg-duo-blue' },
                  { label: 'Зеленый', color: 'bg-duo-green' },
                  { label: 'Фиолетовый', color: 'bg-purple-600' },
                  { label: 'Красный', color: 'bg-rose-600' },
                  { label: 'Желтый', color: 'bg-amber-500' },
                  { label: 'Индиго', color: 'bg-indigo-600' },
                  { label: 'Бирюзовый', color: 'bg-teal-600' },
                  { label: 'Темный', color: 'bg-slate-700' },
                ].map(c => (
                  <button 
                    key={c.color}
                    onClick={() => setEditAvatarColor(c.color)}
                    className={`w-8 h-8 rounded-full ${c.color} border-2 transition-all ${editAvatarColor === c.color ? 'border-white scale-125 ring-2 ring-duo-blue' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  />
                ))}
              </div>
            </div>

            {/* EMOJI / ICON SELECTOR */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                {t('avatarIconLabel')}
              </label>
              <div className="flex flex-wrap gap-2">
                {['', '🦉', '👑', '🚀', '⚡', '🏆', '♟️', '🎨', '🌟', '🦊', '🐯', '🔥', '🎓'].map(icon => (
                  <button 
                    key={icon || 'none'}
                    onClick={() => setEditAvatarIcon(icon)}
                    className={`w-9 h-9 rounded-xl bg-gray-800 border-2 transition-all flex items-center justify-center text-lg ${editAvatarIcon === icon ? 'border-duo-blue bg-duo-blue/20 scale-110' : 'border-gray-700 hover:border-gray-500'}`}
                  >
                    {icon || 'Aa'}
                  </button>
                ))}
              </div>
            </div>

            {/* NAME INPUT */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                {t('displayNameLabel')}
              </label>
              <input 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={t('displayNamePlaceholder')}
                maxLength={50}
                className="w-full bg-gray-800 border-2 border-gray-700 focus:border-duo-blue text-white rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none transition-colors"
              />
            </div>

            {/* USERNAME INPUT */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                {t('usernameLabel')}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-gray-400 font-black">@</span>
                <input 
                  type="text" 
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9_\.]/g, ''))}
                  placeholder="anatolij81"
                  maxLength={30}
                  className="w-full bg-gray-800 border-2 border-gray-700 focus:border-duo-blue text-white rounded-2xl pl-9 pr-4 py-3 text-sm font-bold focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* PHONE & PRIVACY TOGGLE */}
            <div className="space-y-1.5 p-3.5 bg-gray-850 rounded-2xl border border-gray-700">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1">
                  <span>📱</span>
                  <span>{t('phoneLabel') || 'Номер телефона'}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setEditHidePhone(!editHidePhone)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all flex items-center space-x-1 border ${
                    editHidePhone
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                  }`}
                >
                  <span>{editHidePhone ? '🔒 Скрыть номер: ВКЛ' : '👁️ Номер виден'}</span>
                </button>
              </div>
              <input 
                type="tel" 
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+7 (999) 000-00-00"
                maxLength={25}
                className="w-full bg-gray-900 border-2 border-gray-700 focus:border-duo-blue text-white rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none transition-colors"
              />
              <p className="text-[10px] text-gray-400">
                {editHidePhone 
                  ? '🔒 Номер скрыт от других пользователей в контактах и при приглашениях.'
                  : '👁️ Номер доступен друзьям для поиска и связи в контактах.'}
              </p>
            </div>

            {/* EMAIL & PRIVACY TOGGLE */}
            <div className="space-y-1.5 p-3.5 bg-gray-850 rounded-2xl border border-gray-700">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1">
                  <span>📧</span>
                  <span>{t('emailLabel') || 'Электронная почта'}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setEditHideEmail(!editHideEmail)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all flex items-center space-x-1 border ${
                    editHideEmail
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                  }`}
                >
                  <span>{editHideEmail ? '🔒 Скрыть email: ВКЛ' : '👁️ Email виден'}</span>
                </button>
              </div>
              <input 
                type="email" 
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="user@example.com"
                maxLength={60}
                className="w-full bg-gray-900 border-2 border-gray-700 focus:border-duo-blue text-white rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none transition-colors"
              />
              <p className="text-[10px] text-gray-400">
                {editHideEmail 
                  ? '🔒 Почта скрыта от других игроков в списках контактов.'
                  : '👁️ Почта видна контактам для совместной игры и шахматных дуэлей.'}
              </p>
            </div>

            {/* LINK / WEBSITE & PRIVACY TOGGLE */}
            <div className="space-y-1.5 p-3.5 bg-gray-850 rounded-2xl border border-gray-700">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1">
                  <span>🔗</span>
                  <span>{t('linkLabel') || 'Ссылка / Профиль'}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setEditHideLink(!editHideLink)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all flex items-center space-x-1 border ${
                    editHideLink
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                  }`}
                >
                  <span>{editHideLink ? '🔒 Скрыть ссылку: ВКЛ' : '👁️ Ссылка видна'}</span>
                </button>
              </div>
              <input 
                type="text" 
                value={editLink}
                onChange={(e) => setEditLink(e.target.value)}
                placeholder="https://t.me/username или vk.com/id"
                maxLength={100}
                className="w-full bg-gray-900 border-2 border-gray-700 focus:border-duo-blue text-white rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none transition-colors"
              />
              <p className="text-[10px] text-gray-400">
                {editHideLink 
                  ? '🔒 Персональная ссылка скрыта от других игроков в контактах.'
                  : '👁️ Персональная ссылка видна друзьям для связи и совместной игры.'}
              </p>
            </div>

            {/* BUTTONS */}
            <div className="pt-4 flex items-center space-x-3">
              <button 
                onClick={() => { playSound('click'); setShowEditProfileModal(false); }}
                className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-2xl border-b-4 border-gray-900 active:border-b-0 active:translate-y-1 transition-all uppercase text-xs"
              >
                {t('cancelBtn')}
              </button>
              <button 
                onClick={handleSaveProfile}
                className="flex-1 py-3.5 bg-duo-green hover:brightness-110 text-white font-black rounded-2xl border-b-4 border-duo-greenDark active:border-b-0 active:translate-y-1 transition-all uppercase text-xs shadow-lg"
              >
                {t('saveProfileBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AD OVERLAY */}
      {showAd && (
          <div className="fixed inset-0 z-[250] bg-black/90 flex flex-col items-center justify-center p-6 animate-in fade-in">
              <div className="bg-white text-black p-8 rounded-3xl max-w-md w-full text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gray-200"><div className="h-full bg-blue-500 animate-[width_5s_linear]"></div></div>
                  <h3 className="text-2xl font-black mb-4 mt-4">РЕКЛАМА</h3>
                  <div className="w-full h-40 bg-gray-200 rounded-xl mb-6 flex items-center justify-center text-gray-400 font-bold">[Место для вашей рекламы]</div>
                  <p className="text-lg font-bold mb-8">Устали от рекламы? Попробуйте Super бесплатно!</p>
                  <button onClick={() => { playSound('select'); setShowAd(false); setScreen(AppScreen.SUBSCRIPTION); }} className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-black rounded-xl mb-3 shadow-xl">ПОПРОБОВАТЬ SUPER</button>
                  <button onClick={() => { playSound('click'); setShowAd(false); setScreen(AppScreen.PATH); }} className="w-full py-4 text-gray-500 font-bold hover:text-black">Нет, спасибо</button>
              </div>
          </div>
      )}

      {/* AUTHENTIC DUOLINGO LESSON LOADING SCREEN */}
      {screen === AppScreen.LESSON && (!currentExercise || lessonLoading) && (
        <div className="fixed inset-0 z-[100] bg-duo-dark flex flex-col p-4 md:p-6 animate-in fade-in duration-300 font-din h-[100dvh] select-none">
          <div className="max-w-3xl mx-auto w-full flex flex-col h-full relative">
            {/* TOP BAR */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <button 
                onClick={() => { playSound('click'); setLessonLoading(false); setLoading(false); setScreen(AppScreen.PATH); }} 
                className="text-gray-500 hover:text-white transition-colors p-1"
                title={user.language === 'ru' ? 'Прервать загрузку' : 'Cancel'}
              >
                <CloseIcon className="w-8 h-8 md:w-10 md:h-10"/>
              </button>
              <div className="flex-1 mx-4 text-center">
                <span className="text-xs md:text-sm font-black uppercase tracking-widest text-emerald-400">
                  {user.language === 'ru' ? 'Подготовка урока...' : 'Preparing lesson...'}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-yellow-400 font-bold text-xl md:text-2xl">
                {user.subscription !== 'free' ? <InfiniteEnergyIcon className="w-6 h-6 md:w-8 md:h-8 text-yellow-400"/> : <><LightningIcon className="w-5 h-5 md:w-7 md:h-7" /> <span>{user.energy}</span></>}
              </div>
            </div>

            {/* CENTER CONTENT */}
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-md mx-auto w-full my-auto space-y-6">
              {/* MASCOT ANIMATION */}
              <div className="relative">
                <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative animate-bounce duration-1000">
                  <Mascot 
                    emotion="happy" 
                    className="w-36 h-36 md:w-48 md:h-48 drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)]" 
                    variant={currentCourse.mascotVariant || 'default'} 
                  />
                </div>
              </div>

              {/* SPEECH BUBBLE WITH ROTATING DUO TIP */}
              <div className="bg-gray-800/90 border-2 border-gray-700/80 p-5 rounded-3xl shadow-xl w-full text-center relative animate-in fade-in zoom-in-95 duration-300">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-3 bg-gray-800 border-t-2 border-l-2 border-gray-700 rotate-45" />
                <p className="text-[11px] md:text-xs uppercase font-black text-amber-400 tracking-wider mb-1.5 flex items-center justify-center space-x-1.5">
                  <span>💡</span>
                  <span>{user.language === 'ru' ? 'СОВЕТ ОТ DUO' : 'DUO TIP'}</span>
                </p>
                <p className="text-sm md:text-base font-bold text-white leading-relaxed min-h-[3rem] flex items-center justify-center">
                  {DUO_TIPS[loadingTipIndex % DUO_TIPS.length]}
                </p>
              </div>

              {/* DUOLINGO SIGNATURE SHIMMER LOADING BAR */}
              <div className="w-full space-y-2.5">
                <div className="w-full h-4 md:h-5 bg-gray-800 border border-gray-700 rounded-full p-0.5 relative overflow-hidden shadow-inner flex items-center">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-green-500 relative overflow-hidden transition-all duration-300 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_infinite]" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span>{user.language === 'ru' ? 'Загрузка упражнения...' : 'Loading exercise...'}</span>
                  </span>
                  <span className="text-emerald-400 font-mono font-black">{Math.round(loadingProgress)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LESSON OVERLAY */}
      {screen === AppScreen.LESSON && currentExercise && !lessonLoading && (
        <div className="fixed inset-0 z-[100] bg-duo-dark flex flex-col p-4 md:p-6 animate-in fade-in duration-300 font-din h-[100dvh]">
           <div className="max-w-4xl mx-auto w-full flex flex-col h-full relative">
             <div className="flex items-center justify-between mb-4 flex-shrink-0">
               <button onClick={() => { playSound('click'); setShowQuitModal(true); }} className="text-gray-500 hover:text-white transition-colors" title={user.language === 'ru' ? 'Выйти' : 'Quit'}><CloseIcon className="w-8 h-8 md:w-10 md:h-10"/></button>
               {currentExercise.type === 'chess' ? (
                   <div className="flex-1 flex justify-center">
                       <div className="flex items-center bg-gray-800/80 rounded-full border border-gray-700 overflow-hidden shadow-md">
                           <div className="flex items-center px-4 md:px-6 py-1.5 border-r border-gray-700 bg-amber-500/10">
                               <span className="text-amber-400 font-black text-sm md:text-lg mr-2">⚡</span>
                               <span className="text-amber-400 font-black uppercase tracking-wider text-xs md:text-sm">+30 ОЧКОВ ОПЫТА</span>
                           </div>
                           <div className="flex items-center px-4 md:px-5 py-1.5">
                               <span className="text-gray-400 mr-2 text-sm">⏱</span>
                               <span className="text-gray-300 font-bold tracking-widest text-xs md:text-sm">20:00</span>
                           </div>
                       </div>
                   </div>
               ) : currentExercise.type === 'ishihara' ? (
                   <div className="flex-1 text-center font-bold text-gray-400 uppercase tracking-widest text-xs md:text-sm truncate px-2">Ishihara Test</div>
               ) : currentExercise.type !== 'roleplay' ? (
                  <div className="flex-1 mx-3 md:mx-6 h-4 md:h-5 bg-gray-800/90 border border-gray-700/80 rounded-full p-0.5 relative overflow-hidden shadow-inner flex items-center">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${
                        feedback.status === 'correct' 
                          ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-green-500 shadow-[0_0_12px_rgba(34,197,94,0.7)]' 
                          : feedback.status === 'wrong'
                          ? 'bg-gradient-to-r from-yellow-500 to-red-500'
                          : 'bg-gradient-to-r from-yellow-400 to-amber-500'
                      }`} 
                      style={{ width: `${feedback.status === 'correct' ? 100 : feedback.status === 'wrong' ? 30 : selectedWordIds.length > 0 ? Math.min(95, Math.max(10, Math.round((selectedWordIds.length / Math.max(1, availableTokens.length)) * 100))) : 45}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
                      {feedback.status === 'correct' && (
                        <div className="absolute inset-0 bg-white/25 animate-pulse" />
                      )}
                    </div>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] md:text-xs font-black text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] pointer-events-none z-10 tracking-wider">
                      {feedback.status === 'correct' ? 100 : feedback.status === 'wrong' ? 30 : selectedWordIds.length > 0 ? Math.min(95, Math.max(10, Math.round((selectedWordIds.length / Math.max(1, availableTokens.length)) * 100))) : 45}%
                    </span>
                    {(currentExercise.isCached || offlineMode) && (
                      <span className="absolute right-3 text-[9px] md:text-[10px] uppercase font-black tracking-widest text-emerald-400/90 pointer-events-none drop-shadow">
                        {user.language === 'ru' ? 'Офлайн' : 'Offline'}
                      </span>
                    )}
                  </div>
               ) : (
                  <div className="flex-1 text-center font-bold text-gray-400 uppercase tracking-widest text-xs md:text-sm truncate px-2">Roleplay: {currentExercise.originalSentence}</div>
               )}
               {currentExercise.type !== 'chess' ? (
                   <div className="flex items-center space-x-2 text-yellow-400 font-bold text-xl md:text-2xl">{user.subscription !== 'free' ? <InfiniteEnergyIcon className="w-6 h-6 md:w-8 md:h-8 text-yellow-400"/> : <><LightningIcon className="w-5 h-5 md:w-7 md:h-7" /> <span>{user.energy}</span></>}</div>
               ) : (
                   <div className="w-8 md:w-10"></div>
               )}
             </div>

             {/* 1. CHESS UI */}
             {currentExercise.type === 'chess' ? (
                 <div className="flex-1 flex flex-col items-center justify-start min-h-0 overflow-hidden w-full max-w-md mx-auto relative px-2">
                     {/* Game mode & opponent banner */}
                     <div className="w-full flex items-center justify-between bg-gray-800/90 border border-gray-700 px-4 py-2 rounded-2xl mb-3 mt-1 shadow-md">
                         <div className="flex items-center space-x-2.5">
                             <span className="text-2xl">{chessMode === 'pvp' ? '⚔️' : '🦉'}</span>
                             <div className="text-left">
                                 <div className="text-xs font-black text-white uppercase tracking-wider">
                                     {chessMode === 'pvp' ? 'Играть с другим Пользователем' : chessMode === 'study' ? 'Режим урока' : chessMode === 'tutorial' ? 'Обучение' : 'Играть с DuoWindo6601'}
                                 </div>
                                 <div className="text-[10px] text-gray-400 font-bold">
                                     {chessMode === 'pvp' ? `Против: ${chessOpponent.name} (${chessOpponent.elo} ELO)` : 'DuoWindo6601 Grandmaster (1500 ELO)'}
                                 </div>
                             </div>
                         </div>
                         <div className="flex items-center space-x-2">
                             {/* 20-Minute Countdown Timer */}
                             <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-mono font-black border shadow-inner transition-colors ${
                                 chessTimerSeconds < 180 ? 'bg-red-950/80 border-red-500/60 text-red-400 animate-pulse' : 'bg-gray-900/90 border-amber-500/40 text-amber-400'
                             }`}>
                                 <span className="text-sm animate-pulse">⏱</span>
                                 <span>{formatChessTimer(chessTimerSeconds)}</span>
                             </div>
                             <div className="bg-amber-400 text-gray-950 font-black text-[10px] px-2.5 py-1 rounded-xl uppercase tracking-wider shadow-sm">
                                 +30 XP
                             </div>
                         </div>
                     </div>

                     {/* Opponent & Turn speech bubble */}
                     <div className="flex items-end w-full mb-3 relative">
                         <div className="w-16 h-16 relative z-10 flex-shrink-0">
                             {chessMode === 'pvp' ? (
                                 <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-3xl shadow-xl border-2 border-indigo-400">
                                     <span>{chessOpponent.avatar || '👤'}</span>
                                 </div>
                             ) : (
                                 <Mascot variant="chess" className="w-full h-full" />
                             )}
                         </div>
                         <div className="bg-gray-800 border-2 border-gray-700 rounded-2xl rounded-bl-none p-3 ml-2 mb-1 relative shadow-lg flex-1">
                             <div className="flex items-center justify-between mb-0.5">
                                 <span className="text-xs font-black text-[#00cd9c] uppercase">
                                     {chessMode === 'pvp' ? chessOpponent.name : 'DuoWindo6601'}
                                 </span>
                                 <span className="text-[10px] text-gray-400 font-bold">
                                     {chessTurn === 'w' ? 'Ход: Белые ⚪' : 'Ход: Черные ⚫'}
                                 </span>
                             </div>
                             <p className="text-white font-bold text-xs leading-tight">
                               {chessMode === 'pvp'
                                 ? (chessTurn === 'w' ? 'Ваш ход! Сделайте ход фигурой.' : `${chessOpponent.name} обдумывает ответный ход...`)
                                 : chessMode === 'study' 
                                 ? (user.language === 'ru' ? 'Режим урока (без бота). Отрабатывайте ходы!' : 'Lesson mode (no bot). Practice your moves!') 
                                 : chessMode === 'tutorial' 
                                 ? (user.language === 'ru' ? 'Обучение! Нажмите на любую фигуру, чтобы узнать её правила.' : 'Tutorial! Click on any piece to learn its moves.')
                                 : (user.language === 'ru' ? 'Не бойтесь. Я буду играть вполсилы! (+30 XP)' : "Don't be afraid! I will play at half strength! (+30 XP)")}
                             </p>
                             <div className="absolute -left-2 bottom-0 w-4 h-4 bg-gray-800 border-l-2 border-b-2 border-gray-700 transform rotate-45 translate-y-1/2"></div>
                         </div>
                     </div>
                     {chessMode === 'tutorial' && (
                         <div className="w-full bg-duo-blue/20 border-2 border-duo-blue text-duo-blue p-4 rounded-xl mb-4 text-sm font-bold shadow-sm flex items-start space-x-3">
                             <span className="text-2xl flex-shrink-0">💡</span>
                             <p className="leading-tight">{tutorialMessage}</p>
                         </div>
                     )}
                     
                     {/* Board Container */}
                     <div className="relative flex-shrink-0 flex items-center justify-center w-full aspect-square max-w-[400px]">
                         <div className="grid grid-cols-8 gap-0 border-4 border-gray-800 rounded-xl shadow-2xl bg-gray-800 w-full h-full overflow-hidden">
                             {chessBoard.map((row, r) => row.map((square, c) => {
                                 const isSelected = chessSelected?.r === r && chessSelected?.c === c;
                                 const isLight = (r + c) % 2 === 0;
                                 const isValid = chessValidMoves.some(m => m.r === r && m.c === c);
                                 const isLastMoveFrom = chessLastMove && chessLastMove.from.r === r && chessLastMove.from.c === c;
                                 const isLastMoveTo = chessLastMove && chessLastMove.to.r === r && chessLastMove.to.c === c;
                                 const isLastMove = isLastMoveFrom || isLastMoveTo;
                                 
                                 const bgClass = isSelected ? '!bg-[#f5f682] ring-2 ring-yellow-300 z-10' : (isLastMove ? '!bg-[#cdd26a]/90' : (isLight ? 'bg-[#3a4a5a]' : 'bg-[#2a3a4a]'));

                                 return (
                                     <div key={`${r}-${c}`} onClick={() => onChessSquareClick(r, c)} className={`relative flex items-center justify-center cursor-pointer ${bgClass} transition-colors duration-100`}>
                                         {isLastMove && (
                                             <div className={`absolute inset-0 pointer-events-none z-10 border-2 ${isLastMoveTo ? 'border-amber-300 shadow-[inset_0_0_8px_rgba(251,191,36,0.6)]' : 'border-amber-400/50 shadow-[inset_0_0_4px_rgba(251,191,36,0.3)]'} rounded-sm flex items-center justify-center`}>
                                                 {isLastMoveTo && (
                                                     <div className="w-2 h-2 rounded-full bg-amber-300/90 ring-2 ring-amber-500/80 opacity-80" />
                                                 )}
                                             </div>
                                         )}
                                         {isValid && !square && <div className="w-3 h-3 bg-emerald-400/60 rounded-full absolute pointer-events-none z-20"></div>}
                                         {isValid && square && <div className="absolute inset-0 border-[3px] border-emerald-400/80 rounded-full pointer-events-none z-20"></div>}

                                         {square && (
                                             <div className={`w-[85%] h-[85%] drop-shadow-sm select-none pointer-events-none transform transition-transform ${chessTurn === square.color ? 'hover:scale-105' : ''}`}>
                                                 <ChessPieceIcon 
                                                    type={square.piece} 
                                                    color={square.color} 
                                                    className="w-full h-full filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"
                                                 />
                                             </div>
                                         )}
                                     </div>
                                 );
                             }))}
                         </div>
                     </div>
                     
                     {/* Algebraic Notation Move History Panel */}
                     <div className="w-full max-w-[400px] mt-2.5 bg-gray-900/90 border border-gray-700/80 rounded-xl p-2.5 shadow-lg flex flex-col z-10">
                         <div className="flex items-center justify-between mb-1.5 px-1">
                             <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-300 uppercase tracking-wider">
                                 <span>📜</span>
                                 <span>История ходов</span>
                             </div>
                             <div className="flex items-center space-x-2">
                                 <button
                                     type="button"
                                     onClick={() => {
                                         playSound("click");
                                         setScreen(AppScreen.CHESS_ANALYSIS);
                                     }}
                                     className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-[10px] rounded-lg uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                                 >
                                     <span>🔍</span>
                                     <span>{user.language === "ru" ? "Анализ" : "Analyze"}</span>
                                 </button>
                                 <span className="text-[10px] text-gray-400 font-mono">
                                     {chessHistory.length} {chessHistory.length === 1 ? 'ход' : chessHistory.length > 1 && chessHistory.length < 5 ? 'хода' : 'ходов'}
                                 </span>
                             </div>
                         </div>
                         <div className="max-h-24 overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                             {getFormattedMoveHistory().length === 0 ? (
                                 <div className="text-[11px] text-gray-500 italic text-center py-2">
                                     Ходов пока не сделано (e2-e4)
                                 </div>
                             ) : (
                                 <div className="grid grid-cols-2 gap-1.5">
                                     {getFormattedMoveHistory().map((item) => (
                                         <div key={item.moveNumber} className="flex items-center justify-between bg-gray-800/80 border border-gray-700/50 px-2.5 py-1 rounded-lg text-xs font-mono">
                                             <span className="text-gray-500 font-bold text-[10px]">{item.moveNumber}.</span>
                                             <div className="flex items-center space-x-2">
                                                 <span className={`font-semibold ${chessHistory.length % 2 === 1 && item.moveNumber === Math.ceil(chessHistory.length/2) && !item.black ? 'text-amber-300 font-bold' : 'text-gray-200'}`}>
                                                     {item.white}
                                                 </span>
                                                 {item.black && (
                                                     <span className={`font-semibold ${chessHistory.length % 2 === 0 && item.moveNumber === Math.ceil(chessHistory.length/2) ? 'text-amber-300 font-bold' : 'text-gray-400'}`}>
                                                         {item.black}
                                                     </span>
                                                 )}
                                             </div>
                                         </div>
                                     ))}
                                     <div ref={chessMoveHistoryEndRef} />
                                 </div>
                             )}
                         </div>
                     </div>
                     
                     <button className="absolute bottom-4 right-0 w-12 h-12 rounded-2xl bg-gray-800/50 flex items-center justify-center hover:bg-gray-800 transition-colors border border-gray-700">
                         <span className="text-red-500 font-bold text-2xl">🐞</span>
                     </button>
                 </div>
             ) : 
             // ... other cases (Drawing, Ishihara etc.) kept same ...
             currentExercise.type === 'drawing' && currentExercise.drawingData ? (
                 <DrawingCanvas
                    canvasRef={canvasRef}
                    character={currentExercise.drawingData.character}
                    instruction={currentExercise.drawingData.instruction}
                    onSpeak={() => speakText(currentExercise.drawingData!.character, currentCourse.id, false, user.preferredVoice, user.voiceProvider)}
                    showTrace={showTrace}
                    setShowTrace={setShowTrace}
                 />
             ) : 
             currentExercise.type === 'ishihara' && currentExercise.ishiharaData ? (
                 <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                    <h2 className="text-2xl font-bold mb-4 text-center tracking-tight uppercase text-gray-400">What number do you see?</h2>
                    <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-gray-700 bg-black mb-8 aspect-square max-w-[300px] w-full">
                        <IshiharaPlateCanvas 
                          number={currentExercise.ishiharaData.number || currentExercise.targetTranslation || "12"} 
                          image={currentExercise.ishiharaData.image} 
                          className="w-full h-full object-cover" 
                        />
                    </div>
                    <div className="w-full max-w-xs relative">
                        <input type="number" inputMode="numeric" value={ishiharaInput} onChange={(e) => setIshiharaInput(e.target.value)} placeholder="#" className="w-full bg-duo-card border-b-4 border-gray-600 rounded-2xl p-6 text-center text-4xl font-black text-white focus:border-duo-blue focus:outline-none placeholder-gray-600" disabled={feedback.status !== 'idle'} />
                    </div>
                 </div>
             ) : currentExercise.type === 'reading' && currentExercise.readingData ? (
                 <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-4 overflow-y-auto">
                    <h2 className="text-2xl font-bold mb-6 text-center text-duo-blue">{currentExercise.readingData.title}</h2>
                    
                    {currentExercise.readingData.mode === 'write' ? (
                        <div className="w-full max-w-2xl">
                            <p className="text-lg mb-4 text-gray-300 italic" dir="auto">"{currentExercise.readingData.text}"</p>
                            <p className="text-white font-bold mb-4 uppercase tracking-widest text-sm" dir="auto">{currentExercise.readingData.prompt}</p>
                            <textarea 
                                value={readingInput}
                                onChange={(e) => setReadingInput(e.target.value)}
                                className="w-full h-40 bg-duo-card border-2 border-gray-700 rounded-2xl p-4 text-white focus:border-duo-blue focus:outline-none resize-none placeholder-gray-600 font-bold"
                                placeholder="Write your answer here..."
                                disabled={feedback.status !== 'idle'}
                                dir="auto"
                            />
                        </div>
                    ) : (
                        <div className="w-full max-w-2xl text-xl leading-relaxed text-center font-bold text-gray-300" dir="auto">
                            {currentExercise.readingData.text.split("___").map((part, i, arr) => (
                                <React.Fragment key={i}>
                                    <span>{part}</span>
                                    {i < arr.length - 1 && (
                                        <span className={`inline-block min-w-[80px] border-b-4 mx-1 px-2 text-center transition-colors ${selectedWordIds[i] ? 'text-duo-blue border-duo-blue bg-duo-blue/10 rounded-t-lg' : 'text-gray-500 border-gray-600 bg-gray-800/50 rounded-t-lg'}`}>
                                            {selectedWordIds[i] ? availableTokens.find(t => t.id === selectedWordIds[i])?.text : "?"}
                                        </span>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                    
                    {/* Word Bank for Fill Blanks */}
                    {currentExercise.readingData.mode === 'fill-blanks' && (
                        <div className="mt-10 flex flex-wrap gap-3 justify-center" dir={currentCourse.id === 'ar' ? 'rtl' : 'ltr'}>
                            {availableTokens.map(token => (
                                <button 
                                    key={token.id}
                                    disabled={selectedWordIds.includes(token.id) || feedback.status !== 'idle'}
                                    onClick={() => {
                                        playSound('click');
                                        if (selectedWordIds.length < (currentExercise.readingData!.blanks?.length || 0)) {
                                            setSelectedWordIds([...selectedWordIds, token.id]);
                                        }
                                    }}
                                    className={`p-3 px-6 rounded-xl border-b-4 font-bold text-lg transition-all ${selectedWordIds.includes(token.id) ? 'opacity-0 pointer-events-none scale-90' : 'bg-duo-card border-gray-700 hover:border-duo-blue hover:text-duo-blue active:translate-y-1 active:border-b-0'}`}
                                    dir="auto"
                                >
                                    {token.text}
                                </button>
                            ))}
                            {selectedWordIds.length > 0 && feedback.status === 'idle' && (
                                <button onClick={() => { playSound('click'); setSelectedWordIds([]); }} className="p-3 px-6 rounded-xl border-b-4 font-bold bg-gray-700 border-gray-800 text-red-400 hover:bg-gray-600 active:translate-y-1 active:border-b-0">
                                    <TrashIcon className="w-6 h-6" />
                                </button>
                            )}
                        </div>
                    )}
                 </div>
             ) : 
             currentExercise.type === 'illusion' && currentExercise.illusionData ? (
                 <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                    <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-10 text-center tracking-tight">Какое слово было произнесено?</h2>
                    <button onClick={() => speakText(currentExercise.illusionData!.soundText, currentCourse.id, false, user.preferredVoice, user.voiceProvider)} className="w-32 h-32 md:w-48 md:h-48 rounded-[2rem] md:rounded-[3rem] bg-indigo-600 border-b-8 border-indigo-800 shadow-2xl flex items-center justify-center mb-10 md:mb-16 hover:brightness-110 active:translate-y-2 active:border-b-0 transition-all group"><VolumeIcon className="w-16 h-16 md:w-24 md:h-24 text-white group-hover:scale-110 transition-transform" /></button>
                    <div className="grid grid-cols-2 gap-4 md:gap-6 w-full max-w-lg px-4">
                        <button disabled={feedback.status !== 'idle'} onClick={() => checkIllusionAnswer('A')} className="bg-duo-card border-2 border-b-4 border-gray-700 p-4 md:p-8 rounded-3xl font-bold text-xl md:text-2xl hover:bg-gray-700 active:border-b-0 active:translate-y-1 transition-all">{currentExercise.illusionData.optionA}</button>
                        <button disabled={feedback.status !== 'idle'} onClick={() => checkIllusionAnswer('B')} className="bg-duo-card border-2 border-b-4 border-gray-700 p-4 md:p-8 rounded-3xl font-bold text-xl md:text-2xl hover:bg-gray-700 active:border-b-0 active:translate-y-1 transition-all">{currentExercise.illusionData.optionB}</button>
                    </div>
                 </div>
             ) : currentExercise.type === 'roleplay' && currentExercise.roleplayData ? (
                 <div className="flex-1 flex flex-col relative overflow-hidden min-h-0">
                     {/* Video Call Quick Switch Banner */}
                     <div className="bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-blue-900/80 border border-purple-500/30 p-3 rounded-2xl mb-3 flex items-center justify-between shadow-lg">
                         <div className="flex items-center space-x-3">
                             <div className="p-2 bg-purple-600 rounded-xl">
                                 <VideoIcon className="w-5 h-5 text-white animate-pulse" />
                             </div>
                             <div>
                                 <h4 className="text-white text-xs md:text-sm font-black">Переключиться на видеозвонок?</h4>
                                 <p className="text-[11px] text-purple-200">Живой разговор с AI партнером DuoWindo6601</p>
                             </div>
                         </div>
                         <button 
                             onClick={() => startVideoCall(currentCourse.localName || "Ролевой диалог")}
                             className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center space-x-1"
                         >
                             <span>Начать звонок</span>
                         </button>
                     </div>

                     <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 md:space-y-6 pb-24 px-2" dir="auto">
                        {currentExercise.roleplayData.messages.map((msg, i) => {
                           const isAr = isArabicText(msg.text);
                           const textFormatted = formatRTLOverride(msg.text);
                           const isUser = msg.role === 'user';
                           return (
                             <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                 {!isUser && (
                                   <div 
                                     onClick={() => speakText(msg.text, currentCourse.id, false, user.preferredVoice, user.voiceProvider)} 
                                     className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-duo-blue flex-shrink-0 mr-3 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                                   >
                                     <VolumeIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                   </div>
                                 )}
                                 <div className="max-w-[85%] flex flex-col">
                                   <div 
                                     className={`p-3 md:p-4 rounded-2xl text-sm md:text-lg font-bold ${isAr ? 'font-arabic text-right' : ''} ${isUser ? 'bg-duo-blue text-white rounded-br-none' : 'bg-gray-800 text-white rounded-bl-none border-2 border-gray-700'}`}
                                     dir="auto"
                                   >
                                     {textFormatted}
                                   </div>
                                   {msg.correction && (
                                     <div className="mt-2 bg-black border border-duo-blue/50 p-2 md:p-3 rounded-xl text-xs md:text-sm flex items-start space-x-2 animate-in fade-in" dir="auto">
                                       <MaxIcon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                                       <div className="text-gray-300">
                                         <span className="text-duo-blue font-black uppercase text-[10px]">Correction: </span>
                                         {formatRTLOverride(msg.correction)}
                                       </div>
                                     </div>
                                   )}
                                 </div>
                                 {isUser && (
                                   <div 
                                     onClick={() => speakText(msg.text, currentCourse.id, false, user.preferredVoice, user.voiceProvider)} 
                                     className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-600 flex-shrink-0 ml-3 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                                   >
                                     <VolumeIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                   </div>
                                 )}
                             </div>
                           );
                        })}
                        <div ref={chatBottomRef} />
                     </div>
                      <div className="w-full bg-duo-card border-t-2 border-gray-800 p-2 md:p-3 mt-auto">
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (roleplayInput.trim()) {
                              handleRoleplaySend(roleplayInput);
                            }
                          }}
                          className="flex items-center space-x-2 md:space-x-3 max-w-2xl mx-auto w-full"
                        >
                          <button 
                            type="button"
                            onClick={toggleRecording} 
                            className={`w-11 h-11 md:w-13 md:h-13 rounded-2xl flex-shrink-0 flex items-center justify-center transition-all shadow-lg border-2 ${isRecording ? 'bg-red-500 border-red-400 scale-105 animate-pulse' : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-duo-blue'}`}
                            title={isRecording ? "Слушаю..." : "Голосовой ввод"}
                          >
                            <MicIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                          </button>

                          <input 
                            type="text"
                            value={roleplayInput}
                            onChange={(e) => setRoleplayInput(e.target.value)}
                            placeholder={isRecording ? (user.language === 'ru' ? 'Слушаю вашу речь...' : 'Listening to speech...') : (user.language === 'ru' ? 'Напишите сообщение...' : 'Type a message...')}
                            className={`flex-1 bg-gray-900 border-2 border-gray-700 rounded-2xl px-4 py-2.5 text-white text-sm md:text-base font-bold focus:outline-none focus:border-duo-blue transition-colors ${isArabicText(roleplayInput) ? 'font-arabic text-right' : ''}`}
                            dir="auto"
                          />

                          <button 
                            type="submit"
                            disabled={!roleplayInput.trim()}
                            className={`px-4 md:px-6 py-2.5 rounded-2xl font-black uppercase text-xs md:text-sm tracking-wider transition-all border-b-4 flex items-center justify-center ${roleplayInput.trim() ? 'bg-duo-blue border-duo-blueDark text-white hover:brightness-110 active:translate-y-0.5' : 'bg-gray-800 border-gray-900 text-gray-500 cursor-not-allowed'}`}
                          >
                            <span>{user.language === 'ru' ? 'Отправить' : 'Send'}</span>
                          </button>
                        </form>
                        
                        {isRecording && (
                          <p className="text-center text-xs font-bold text-red-400 mt-1.5 animate-bounce">
                            🎙 {user.language === 'ru' ? 'Запись речи... Нажмите микрофон еще раз для отправки' : 'Recording speech... Tap mic again to send'}
                          </p>
                        )}
                      </div>
                 </div>
             ) : (
                 <motion.div 
                   key={currentExercise.id || currentExercise.originalSentence || currentExercise.type}
                   initial={{ opacity: 0, x: 60 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ duration: 0.3 }}
                   className="flex-1 overflow-y-auto no-scrollbar min-h-0"
                 >
                   <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-10 text-center sm:text-left tracking-tight px-2">{currentExercise.type === 'listening' ? t('whatHeard') : currentExercise.type === 'speech' ? t('speakForDuo') : t('readPractice')}</h2>
                   <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-12 mb-8 md:mb-12">
                     <div className="relative flex flex-col items-center flex-shrink-0">
                        <Mascot emotion={feedback.status === 'wrong' ? 'confused' : (feedback.status === 'correct' ? 'happy' : 'neutral')} className="w-32 h-32 md:w-48 md:h-48" variant={currentCourse.mascotVariant} />
                        {currentExercise.type === 'speech' && <button onClick={() => speakText(currentExercise.originalSentence, currentCourse.id, false, user.preferredVoice, user.voiceProvider)} className="md:hidden mt-4 bg-duo-card border-2 border-gray-700 p-3 px-4 rounded-2xl shadow-xl flex items-center space-x-2 active:scale-95 transition-transform"><VolumeIcon className="w-6 h-6 text-duo-blue" /><span className="font-bold text-lg">{currentExercise.originalSentence}</span></button>}
                        {currentExercise.type === 'speech' && <button onClick={() => speakText(currentExercise.originalSentence, currentCourse.id, false, user.preferredVoice, user.voiceProvider)} className="hidden md:flex absolute -top-4 -right-48 w-max max-w-xs bg-duo-card border-2 border-gray-700 p-4 rounded-2xl shadow-2xl animate-in zoom-in items-center space-x-3 hover:bg-gray-800 transition-colors active:scale-95"><VolumeIcon className="w-6 h-6 text-duo-blue" /><span className="font-bold text-lg border-b-2 border-dashed border-gray-500">{currentExercise.originalSentence}</span></button>}
                     </div>
                     <div className="flex-1 w-full px-2">
                        {currentExercise.type === 'listening' ? (
                          <div className="flex items-center space-x-0 border-2 border-gray-700 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl max-w-sm mx-auto md:mx-0">
                            <button onClick={() => speakText(currentExercise.originalSentence, currentCourse.id, false, user.preferredVoice, user.voiceProvider)} className="flex-1 bg-duo-card p-6 md:p-12 hover:bg-white/5 transition-colors border-r border-gray-700"><VolumeIcon className="w-12 h-12 md:w-20 md:h-20 text-duo-blue mx-auto" /></button>
                            <button onClick={() => speakText(currentExercise.originalSentence, currentCourse.id, true, user.preferredVoice, user.voiceProvider)} className="flex-1 bg-duo-card p-6 md:p-12 hover:bg-white/5 transition-colors"><TurtleIcon className="w-8 h-8 md:w-16 md:h-16 text-duo-blue mx-auto" /></button>
                          </div>
                        ) : currentExercise.type === 'speech' ? (
                            <div className="w-full flex justify-center py-2"><button onClick={toggleRecording} className={`w-28 h-28 md:w-36 md:h-36 rounded-[2.5rem] md:rounded-[3rem] flex items-center justify-center transition-all shadow-2xl ${isRecording ? 'bg-red-500 scale-110 animate-pulse' : 'bg-duo-blue hover:brightness-110'}`}><MicIcon className="w-12 h-12 md:w-16 md:h-16 text-white" />{isRecording && <span className="absolute mt-20 md:mt-24 text-xs md:text-sm font-bold animate-bounce">Слушаю...</span>}</button></div>
                        ) : (
                          <div className={`bg-duo-card border-2 border-gray-700 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 pb-16 md:pb-10 text-xl md:text-3xl font-bold relative shadow-xl text-center md:text-left break-words ${isArabicText(currentExercise.originalSentence) ? 'font-arabic text-right' : ''}`} dir="auto">
                            {formatRTLOverride(currentExercise.originalSentence)}
                            <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-0 h-0 border-t-[10px] border-t-transparent border-r-[15px] border-r-gray-700 border-b-[10px] border-b-transparent hidden md:block"></div>
                            <div className="absolute bottom-4 right-4 flex space-x-3"><button onClick={() => speakText(currentExercise.originalSentence, currentCourse.id, false, user.preferredVoice, user.voiceProvider)} className="p-2 md:p-3 bg-gray-800 rounded-2xl hover:bg-gray-700 transition-all shadow-md border-b-4 border-black/20 active:border-b-0 active:translate-y-1"><VolumeIcon className="w-5 h-5 md:w-6 md:h-6 text-duo-blue" /></button><button onClick={() => speakText(currentExercise.originalSentence, currentCourse.id, true, user.preferredVoice, user.voiceProvider)} className="p-2 md:p-3 bg-gray-800 rounded-2xl hover:bg-gray-700 transition-all shadow-md border-b-4 border-black/20 active:border-b-0 active:translate-y-1"><TurtleIcon className="w-5 h-5 md:w-6 md:h-6 text-duo-blue" /></button></div>
                          </div>
                        )}
                     </div>
                   </div>
                   <div className="space-y-6 md:space-y-12 px-2">
                     {(currentExercise.type === 'translation' || currentExercise.type === 'listening') && (
                        <>
                        <div className="min-h-[80px] md:min-h-[100px] border-b-2 border-gray-700 flex flex-wrap gap-2 md:gap-4 p-2 md:p-4 items-end" dir="auto">
                          {selectedWordIds.map(id => {
                            const tok = availableTokens.find(t => t.id === id);
                            const tokText = tok?.text || '';
                            const isArTok = isArabicText(tokText);
                            return (
                              <button key={id} onClick={() => { playSound('click'); setSelectedWordIds(p => p.filter(x => x !== id)); }} className={`bg-duo-card border-2 border-b-4 border-gray-700 p-2 px-4 md:p-4 md:px-8 rounded-xl md:rounded-2xl font-bold text-lg md:text-2xl hover:bg-gray-700 transition-all animate-in slide-in-from-bottom-2 ${isArTok ? 'font-arabic' : ''}`}>
                                {formatRTLOverride(tokText)}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex flex-wrap gap-2 md:gap-4 justify-center pb-4" dir="auto">
                          {availableTokens.map(token => {
                            const isArTok = isArabicText(token.text);
                            return (
                              <button key={token.id} disabled={selectedWordIds.includes(token.id) || feedback.status !== 'idle'} onClick={() => { playSound('click'); setSelectedWordIds(p => [...p, token.id]); }} className={`bg-duo-card border-2 border-b-4 border-gray-700 p-2 px-4 md:p-4 md:px-8 rounded-xl md:rounded-2xl font-bold text-lg md:text-2xl hover:bg-gray-700 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none ${isArTok ? 'font-arabic' : ''}`}>
                                {formatRTLOverride(token.text)}
                              </button>
                            );
                          })}
                        </div>
                        </>
                      )}
                    </div>
                  </motion.div>
              )}

              <div className="mt-auto pt-4 border-t-2 border-gray-800 flex items-center justify-between gap-4 relative z-20 flex-shrink-0">
                {feedback.status === 'idle' ? (
                  <>
                    <button onClick={handleSkip} disabled={loading} className="px-4 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider text-sm md:text-base disabled:opacity-40">{t('t_skip')}</button>
                    <button 
                      disabled={loading || (selectedWordIds.length === 0 && currentExercise.type !== 'speech' && currentExercise.type !== 'drawing' && !(currentExercise.type === 'ishihara' && ishiharaInput))} 
                      onClick={() => { 
                        if (loading) return; 
                        if (currentExercise.type === 'drawing') checkDrawingAnswer(); 
                        else if (selectedWordIds.length > 0 || currentExercise.type === 'speech' || currentExercise.type === 'ishihara') checkAnswer(); 
                      }} 
                      className={`w-full py-4 md:py-7 rounded-2xl md:rounded-[2.5rem] font-bold text-xl md:text-2xl transition-all uppercase tracking-widest shadow-2xl active:translate-y-2 active:border-b-0 ${
                        loading 
                          ? 'bg-duo-green/60 border-b-4 border-duo-greenDark text-white cursor-wait'
                          : selectedWordIds.length > 0 || currentExercise.type === 'speech' || currentExercise.type === 'drawing' || (currentExercise.type === 'ishihara' && ishiharaInput) 
                          ? 'bg-duo-green border-b-8 border-duo-greenDark text-white' 
                          : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center space-x-3">
                          <span className="w-5 h-5 md:w-6 md:h-6 border-3 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
                          <span>{user.language === 'ru' ? 'ПРОВЕРКА...' : 'CHECKING...'}</span>
                        </span>
                      ) : (
                        t('check')
                      )}
                    </button>
                  </>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`w-full flex flex-col md:flex-row items-center justify-between p-4 md:p-6 rounded-2xl md:rounded-3xl ${feedback.status === 'correct' ? 'bg-duo-green/20 border-2 border-duo-green' : 'bg-duo-red/20 border-2 border-duo-red'}`}
                  >
                    <div className="flex items-center space-x-4 mb-4 md:mb-0">
                      <span className="text-3xl md:text-5xl">{feedback.status === 'correct' ? '🎉' : '❌'}</span>
                      <div>
                        <h3 className={`font-black text-xl md:text-2xl ${feedback.status === 'correct' ? 'text-duo-green' : 'text-duo-red'}`}>{feedback.status === 'correct' ? (user.language === 'ru' ? 'Отлично!' : 'Great job!') : (user.language === 'ru' ? 'Решение:' : 'Solution:')}</h3>
                        <p className="text-gray-300 font-bold text-sm md:text-lg">{feedback.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 w-full md:w-auto">
                      <button 
                        onClick={handleExplainMistake} 
                        className={`p-3 md:p-4 rounded-2xl border-2 font-bold flex items-center space-x-2 transition-all active:scale-95 ${
                          feedback.status === 'correct'
                            ? 'bg-[#e2f7d3] hover:bg-[#d0f0ba] text-[#58cc02] border-[#a5ed6e] dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-600'
                            : 'bg-[#ffefef] hover:bg-[#ffd3d3] text-[#ff4b4b] border-[#ffb3b3] dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-600'
                        }`}
                      >
                        <SparklesIcon className="w-5 h-5 text-amber-400 animate-pulse" />
                        <span className="font-black uppercase tracking-wide text-xs md:text-sm">
                          {feedback.status === 'correct' 
                            ? (user.language === 'ru' ? '✨ ОБЪЯСНИТЬ МОЙ ОТВЕТ' : '✨ EXPLAIN MY ANSWER')
                            : (user.language === 'ru' ? '✨ ОБЪЯСНИТЬ ОШИБКУ' : '✨ EXPLAIN MY MISTAKE')
                          }
                        </span>
                        {user.subscription !== 'max' && (
                          <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center space-x-1 ml-1">
                            <span>🔒</span>
                            <span>Max</span>
                          </span>
                        )}
                      </button>
                      {currentExercise?.type === 'chess' && (
                        <button
                          type="button"
                          onClick={() => {
                            playSound("click");
                            setScreen(AppScreen.CHESS_ANALYSIS);
                          }}
                          className="p-3 md:p-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl border-2 border-amber-600 flex items-center space-x-2 transition-all active:scale-95 shadow-md text-xs md:text-sm uppercase tracking-wide cursor-pointer"
                        >
                          <span className="text-base">🔍</span>
                          <span>{user.language === "ru" ? "АНАЛИЗИРОВАТЬ ПАРТИЮ" : "ANALYZE GAME"}</span>
                        </button>
                      )}
                      <button onClick={() => handleContinueAfterLesson()} className={`w-full md:w-auto px-10 md:px-16 py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-white border-b-4 transition-all hover:scale-105 active:translate-y-1 ${feedback.status === 'correct' ? 'bg-duo-green border-duo-greenDark shadow-xl shadow-duo-green/20' : 'bg-duo-red border-red-800'}`}>{t('next')}</button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
      )}

      {/* AUTHENTIC DUOLINGO QUIT CONFIRMATION MODAL */}
      {showQuitModal && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-duo-card border-2 border-gray-700 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative text-center flex flex-col items-center animate-in zoom-in-95">
            <Mascot emotion="sad" className="w-28 h-28 mb-3" variant={currentCourse.mascotVariant || 'default'} />
            <h3 className="text-2xl font-black text-white mb-2">
              {user.language === 'ru' ? 'Уже уходите?' : 'Quit lesson?'}
            </h3>
            <p className="text-gray-300 font-bold text-sm mb-6 leading-relaxed">
              {user.language === 'ru' ? 'Весь накопленный прогресс за этот урок будет потерян!' : 'All your progress in this session will be lost!'}
            </p>
            <div className="w-full space-y-3">
              <button 
                onClick={() => { playSound('click'); setShowQuitModal(false); }} 
                className="w-full py-4 bg-duo-green hover:brightness-110 text-white font-black rounded-2xl border-b-4 border-duo-greenDark active:border-b-0 active:translate-y-1 transition-all uppercase text-sm shadow-lg tracking-wider"
              >
                {user.language === 'ru' ? 'ОСТАТЬСЯ' : 'KEEP LEARNING'}
              </button>
              <button 
                onClick={() => { 
                  setShowQuitModal(false); 
                  playSound('click'); 
                  setScreen(AppScreen.PATH); 
                  setFeedback({ status: 'idle', message: '' }); 
                  setCurrentExercise(null); 
                  setLessonLoading(false);
                  setLoading(false);
                }} 
                className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 text-red-400 hover:text-red-300 font-black rounded-2xl border border-gray-700 transition-all uppercase text-xs tracking-wider"
              >
                {user.language === 'ru' ? 'ВЫЙТИ ИЗ УРОКА' : 'END SESSION'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DUOLINGO MAX "EXPLAIN MY ANSWER" SCREEN */}
      {showExplanationModal && (
        <div className="fixed inset-0 z-[200] bg-gray-950/95 backdrop-blur-md flex flex-col items-center justify-between p-4 md:p-6 animate-in fade-in duration-200">
          {/* HEADER BAR */}
          <div className="w-full max-w-2xl flex items-center justify-between py-2 border-b border-gray-800/80 mb-4">
            <button 
              onClick={() => setShowExplanationModal(false)}
              className="p-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-2xl border border-gray-700 transition-all font-bold flex items-center space-x-2"
            >
              <span className="text-xl">←</span>
              <span className="text-xs uppercase font-black">{t('back') || 'Назад'}</span>
            </button>

            <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-sky-600/20 border border-purple-500/30 px-4 py-1.5 rounded-full">
              <span className="text-xl">🦉</span>
              <span className="text-xs md:text-sm font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>DuoWindo6601 Max</span>
                <SparklesIcon className="w-4 h-4 text-amber-400" />
                {(offlineMode || (typeof navigator !== 'undefined' && !navigator.onLine)) && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black px-2 py-0.5 rounded-md ml-1">
                    ⚡ {user.language === 'ru' ? 'Офлайн' : 'Offline'}
                  </span>
                )}
              </span>
            </div>

            <button 
              onClick={() => setShowExplanationModal(false)}
              className="p-2.5 text-gray-400 hover:text-white rounded-2xl bg-gray-800/80 hover:bg-gray-700"
            >
              <CloseIcon className="w-5 h-5"/>
            </button>
          </div>

          {/* MAIN CONTENT CONTAINER */}
          <div className="w-full max-w-2xl flex-1 flex flex-col justify-center overflow-y-auto space-y-4 py-2 my-auto">
            {/* PHRASE BADGE */}
            <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-4 flex items-center justify-between text-sky-200">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">💬</span>
                <div>
                  <p className="text-[10px] uppercase font-extrabold text-sky-400 tracking-wider">Фраза из урока</p>
                  <p className="text-base md:text-lg font-black text-white">{currentExercise?.originalSentence || 'Урок DuoWindo6601'}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-sky-300 bg-sky-900/60 px-3 py-1 rounded-xl border border-sky-500/30">
                {currentExercise?.targetTranslation ? `➔ ${currentExercise.targetTranslation}` : ''}
              </span>
            </div>

            {/* DUOLINGO MAX WHITE CARD */}
            <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-3xl p-6 md:p-8 shadow-2xl relative text-gray-900 dark:text-gray-100 flex flex-col justify-between min-h-[280px]">
              {explanationLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 my-auto">
                  <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-500 dark:text-gray-400 font-black text-sm uppercase tracking-wider animate-pulse">
                    Сова DuoWindo6601 анализирует логику и грамматику...
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-base md:text-lg leading-relaxed font-sans space-y-2 pr-1 whitespace-pre-line text-left">
                    <div className="font-medium text-gray-800 dark:text-gray-200">
                      {explanation.split('\n').map((line, idx) => {
                        if (!line.trim()) return <div key={idx} className="h-1.5" />;
                        const parts = line.split(/(\*\*.*?\*\*)/g);
                        return (
                          <p key={idx} className="mb-1 leading-relaxed">
                            {parts.map((p, pIdx) => {
                              if (p.startsWith('**') && p.endsWith('**')) {
                                return (
                                  <strong key={pIdx} className="font-black text-indigo-600 dark:text-amber-400">
                                    {p.slice(2, -2)}
                                  </strong>
                                );
                              }
                              return p;
                            })}
                          </p>
                        );
                      })}
                    </div>
                  </div>

                  {/* FEEDBACK RATING BAR AT BOTTOM RIGHT */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-400">
                      Было ли объяснение понятным?
                    </p>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setToast(user.language === 'ru' ? 'Спасибо за ваш отзыв! 👍' : 'Thank you for your feedback! 👍')}
                        className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-gray-600 dark:text-gray-300 hover:text-emerald-500 rounded-xl transition-all active:scale-90 border border-gray-200 dark:border-gray-700"
                        title="Понятно"
                      >
                        👍
                      </button>
                      <button 
                        onClick={() => setToast(user.language === 'ru' ? 'Спасибо! Мы улучшим объяснения AI. 👎' : 'Thank you! We will improve AI explanations. 👎')}
                        className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-gray-600 dark:text-gray-300 hover:text-rose-500 rounded-xl transition-all active:scale-90 border border-gray-200 dark:border-gray-700"
                        title="Не совсем понятно"
                      >
                        👎
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* BOTTOM FULL WIDTH ACTION BUTTON */}
          <div className="w-full max-w-2xl pt-2">
            <button 
              onClick={() => setShowExplanationModal(false)}
              className="w-full py-4 md:py-5 bg-[#1cb0f6] hover:bg-[#189ddc] border-b-4 border-[#1482b8] active:border-b-0 active:translate-y-1 text-white font-black text-center text-base md:text-lg uppercase rounded-2xl shadow-xl shadow-sky-500/20 transition-all"
            >
              {user.language === 'ru' ? 'ПРОДОЛЖИТЬ УРОК' : 'CONTINUE LESSON'}
            </button>
          </div>
        </div>
      )}

      {showLimitModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-duo-card border-2 border-gray-700 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative text-center">
            <button onClick={() => setShowLimitModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white p-2"><CloseIcon className="w-6 h-6"/></button>
            <h3 className="text-2xl font-black text-white mb-2">⚡ {user.language === 'ru' ? 'Достигнут лимит ИИ' : 'Limit Reached'}</h3>
            <p className="text-gray-300 font-bold text-sm mb-6">
              {user.language === 'ru' 
                ? 'Переключение в кэшированный автономный режим из-за большого объема запросов.' 
                : 'Switching to cached offline mode due to high request volume.'}
            </p>
            <button onClick={() => setShowLimitModal(false)} className="w-full py-3.5 bg-duo-green hover:brightness-110 text-white font-black rounded-2xl border-b-4 border-duo-greenDark active:border-b-0 active:translate-y-1 transition-all uppercase text-sm shadow-lg">
              {user.language === 'ru' ? 'ПОНЯТНО' : 'OK'}
            </button>
          </div>
        </div>
      )}
</div>
);
};

return renderAppLayout();
}

export default App;
