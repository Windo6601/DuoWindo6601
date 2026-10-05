import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { UserProgress } from '../types';
import { 
  downloadFirebaseExportFile, 
  copyFirebaseExportToClipboard, 
  generateFirebaseExportPayload, 
  getQuickFirebaseSummary,
  FirebaseExportPayload,
  FirebaseExportSummary
} from '../services/firebaseExportService';

export interface FirebaseExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProgress;
  firebaseUser: FirebaseUser | null;
  language?: string;
  playSound: (type: 'click' | 'correct' | 'wrong' | 'fanfare' | 'streak') => void;
  setToast: (msg: string | null) => void;
  onOpenRegister?: (tab?: 'login' | 'register' | 'google' | 'incognito') => void;
}

export const FirebaseExportModal: React.FC<FirebaseExportModalProps> = ({
  isOpen,
  onClose,
  user,
  firebaseUser,
  language = 'ru',
  playSound,
  setToast,
  onOpenRegister,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'auth' | 'firestore'>('overview');
  const [livePayload, setLivePayload] = useState<FirebaseExportPayload | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  const isRu = language === 'ru';
  const quickSummary: FirebaseExportSummary = getQuickFirebaseSummary(user, firebaseUser);

  // Load complete live data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingLive(true);

    generateFirebaseExportPayload(user, firebaseUser)
      .then((payload) => {
        if (isMounted) {
          setLivePayload(payload);
          setIsLoadingLive(false);
        }
      })
      .catch((err) => {
        console.warn('Error loading live payload:', err);
        if (isMounted) setIsLoadingLive(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, user, firebaseUser]);

  if (!isOpen) return null;

  const currentSummary = livePayload?.summary || quickSummary;
  const jsonPreviewText = livePayload 
    ? JSON.stringify(livePayload, null, 2) 
    : JSON.stringify({ summary: quickSummary, status: 'loading...' }, null, 2);

  const handleDownload = async () => {
    setIsExporting(true);
    playSound('correct');
    try {
      const filename = await downloadFirebaseExportFile(user, firebaseUser);
      setToast(
        isRu 
          ? `🔥 Экспорт Firebase сохранён: ${filename}` 
          : `🔥 Firebase export saved: ${filename}`
      );
    } catch (err) {
      console.error('Download error:', err);
      playSound('wrong');
      setToast(isRu ? '❌ Ошибка при скачивании файла' : '❌ Failed to download file');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    setIsExporting(true);
    playSound('click');
    try {
      const success = await copyFirebaseExportToClipboard(user, firebaseUser);
      if (success) {
        setCopied(true);
        setToast(
          isRu 
            ? '📋 Данные Firebase Firestore & Auth скопированы в буфер обмена!' 
            : '📋 Firebase Firestore & Auth data copied to clipboard!'
        );
        setTimeout(() => setCopied(false), 3000);
      } else {
        playSound('wrong');
        setToast(isRu ? '❌ Не удалось скопировать данные' : '❌ Failed to copy data');
      }
    } catch {
      playSound('wrong');
      setToast(isRu ? '❌ Ошибка копирования' : '❌ Copy failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = async () => {
    playSound('click');
    setIsLoadingLive(true);
    try {
      const payload = await generateFirebaseExportPayload(user, firebaseUser);
      setLivePayload(payload);
      setToast(isRu ? '🔄 Данные из Firestore обновлены' : '🔄 Data refreshed from Firestore');
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setIsLoadingLive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[280] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div 
        className="fixed inset-0" 
        onClick={() => { playSound('click'); onClose(); }} 
      />

      <div className="relative z-10 bg-gray-950 border-2 border-amber-500/70 rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-[0_0_55px_rgba(245,158,11,0.25)] text-white space-y-4 max-h-[92vh] overflow-y-auto text-left">
        
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-400 border-2 border-white/40 flex items-center justify-center text-2xl shadow-lg shrink-0">
              🔥
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
                <span>{isRu ? 'Экспорт данных Firebase' : 'Firebase Data Export'}</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                  Firestore & Auth
                </span>
              </h3>
              <p className="text-xs text-amber-400/90 font-bold">
                {isRu ? 'Облачная база данных Firestore и учётная запись пользователя' : 'Cloud Firestore Database and User Authentication'}
              </p>
            </div>
          </div>
          <button
            onClick={() => { playSound('click'); onClose(); }}
            className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 transition-colors shrink-0 cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* CLOUD CONNECTION STATUS BANNER */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-amber-950/40 border border-amber-500/40 p-3.5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${currentSummary.isCloudActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-xs font-black uppercase text-white tracking-wider">
                {currentSummary.isCloudActive 
                  ? (isRu ? 'Облачный профиль подключен' : 'Cloud Profile Active')
                  : (isRu ? 'Локальный профиль (Готов к экспорту)' : 'Local Profile (Ready for Export)')}
              </span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoadingLive}
              className="text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className={isLoadingLive ? 'animate-spin' : ''}>🔄</span>
              <span>{isLoadingLive ? (isRu ? 'Синхронизация...' : 'Syncing...') : (isRu ? 'Обновить из облака' : 'Refresh Cloud')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
            <div className="bg-black/50 p-2 rounded-xl border border-gray-800 flex items-center justify-between">
              <span className="text-gray-400">Project ID:</span>
              <span className="text-amber-300 truncate max-w-[180px]" title={currentSummary.projectId}>
                {currentSummary.projectId}
              </span>
            </div>
            <div className="bg-black/50 p-2 rounded-xl border border-gray-800 flex items-center justify-between">
              <span className="text-gray-400">Провайдер / Auth:</span>
              <span className="text-emerald-400 font-bold truncate max-w-[180px]">
                {currentSummary.authProvider}
              </span>
            </div>
          </div>
        </div>

        {/* INCOGNITO PERMANENT CLOSURE & EXPORT ADVICE BANNER */}
        <div className="p-3.5 bg-gradient-to-r from-amber-950/50 via-rose-950/30 to-amber-950/50 border border-amber-500/50 rounded-2xl text-xs space-y-1.5 text-left">
          <div className="flex items-center space-x-2 text-amber-300 font-black uppercase tracking-wider text-[11px]">
            <span>⚠️</span>
            <span>{isRu ? 'Предупреждение о сохранении контента' : 'Content Retention Warning'}</span>
          </div>
          <p className="text-gray-200 font-bold leading-snug">
            {isRu 
              ? 'После 10 октября 2026 года Режим Инкогнито будет недоступен, и его нельзя будет восстановить в DuoWindo6601.'
              : 'After October 10, 2026, Incognito Mode will be unavailable and cannot be restored in DuoWindo6601.'}
          </p>
          <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
            {isRu
              ? 'Если вы хотите сохранить какой-либо контент, мы рекомендуем заранее экспортировать данные Firebase Firestore & Auth через Раздел «Профиль» и Раздел «Настройки» с помощью кнопок ниже или выполнить Полный Вход в систему.'
              : 'If you want to save any content, we recommend exporting your Firebase Firestore & Auth data in advance via the Profile and Settings sections using the buttons below or performing Full Sign-In.'}
          </p>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-800 text-xs font-black">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            📊 {isRu ? 'Сводка экспорта' : 'Export Summary'}
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`pb-2.5 px-3 uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === 'auth'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            🔑 {isRu ? 'Firebase Auth' : 'Firebase Auth'}
          </button>
          <button
            onClick={() => setActiveTab('firestore')}
            className={`pb-2.5 px-3 uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === 'firestore'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            🗄️ {isRu ? 'Firestore DB' : 'Firestore DB'}
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-gray-900 border border-gray-800 p-2.5 rounded-xl text-center">
                <span className="text-lg">⚡</span>
                <div className="text-base font-black text-white">{currentSummary.xp}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">{isRu ? 'Опыт XP' : 'XP'}</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 p-2.5 rounded-xl text-center">
                <span className="text-lg">🔥</span>
                <div className="text-base font-black text-amber-400">{currentSummary.streak}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">{isRu ? 'Серия дней' : 'Streak'}</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 p-2.5 rounded-xl text-center">
                <span className="text-lg">📚</span>
                <div className="text-base font-black text-duo-blue">{currentSummary.completedLessonsCount}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">{isRu ? 'Уроков' : 'Lessons'}</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 p-2.5 rounded-xl text-center">
                <span className="text-lg">📖</span>
                <div className="text-base font-black text-emerald-400">{currentSummary.learnedWordsCount}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">{isRu ? 'Слов' : 'Words'}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-gray-900/70 border border-gray-800 p-2.5 rounded-xl flex items-center justify-between">
                <span className="text-gray-400">💎 {isRu ? 'Кристаллы:' : 'Gems:'}</span>
                <span className="font-bold text-sky-400">{currentSummary.gems}</span>
              </div>
              <div className="bg-gray-900/70 border border-gray-800 p-2.5 rounded-xl flex items-center justify-between">
                <span className="text-gray-400">💬 {isRu ? 'Отзывы в базе:' : 'User Reviews:'}</span>
                <span className="font-bold text-yellow-400">{livePayload?.firebaseFirestore.userFeedbackCount || 0}</span>
              </div>
              <div className="bg-gray-900/70 border border-gray-800 p-2.5 rounded-xl flex items-center justify-between">
                <span className="text-gray-400">🎫 {isRu ? 'Тикеты поддержки:' : 'Support Tickets:'}</span>
                <span className="font-bold text-indigo-400">{livePayload?.firebaseFirestore.userSupportTicketsCount || 0}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl text-xs text-amber-200/90 leading-relaxed">
              💡 {isRu
                ? 'Полный экспорт содержит все параметры профиля Firestore (/users), сохранённые уроки, словарь, отзывы, обращения в поддержку и метаданные аутентификации Firebase Auth в едином стандартизированном JSON-файле.'
                : 'Full export includes all Firestore user profile document fields (/users), lessons, vocabulary, reviews, support tickets, and Firebase Auth metadata in standardized JSON.'}
            </div>
          </div>
        )}

        {/* TAB 2: FIREBASE AUTH */}
        {activeTab === 'auth' && (
          <div className="space-y-2 animate-in fade-in text-xs font-din">
            <div className="bg-gray-900 p-3 rounded-2xl border border-gray-800 space-y-2">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">UID:</span>
                <span className="font-mono text-emerald-400 font-bold truncate max-w-[260px]">
                  {currentSummary.uid || (isRu ? 'Не назначен (гость)' : 'None (guest)')}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Email:</span>
                <span className="text-white font-bold">{currentSummary.email || (isRu ? 'Не указан' : 'Not set')}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">{isRu ? 'Email подтверждён:' : 'Email Verified:'}</span>
                <span className={livePayload?.firebaseAuth.emailVerified ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {livePayload?.firebaseAuth.emailVerified ? '✅ Да / Yes' : '⏳ Нет / No'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">{isRu ? 'Провайдер:' : 'Provider:'}</span>
                <span className="text-cyan-400 font-bold">{currentSummary.authProvider}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">{isRu ? 'Дата создания:' : 'Creation Time:'}</span>
                <span className="text-gray-300">{livePayload?.firebaseAuth.metadata.creationTime || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">{isRu ? 'Последний вход:' : 'Last Sign-In:'}</span>
                <span className="text-gray-300">{livePayload?.firebaseAuth.metadata.lastSignInTime || '—'}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FIRESTORE DB */}
        {activeTab === 'firestore' && (
          <div className="space-y-2 animate-in fade-in text-xs font-din">
            <div className="bg-gray-900 p-3 rounded-2xl border border-gray-800 space-y-2">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">{isRu ? 'Путь документа пользователя:' : 'User Doc Path:'}</span>
                <span className="font-mono text-amber-300 font-bold">
                  {livePayload?.firebaseFirestore.userDocumentPath || (currentSummary.uid ? `users/${currentSummary.uid}` : 'users/guest')}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">{isRu ? 'Database ID:' : 'Database ID:'}</span>
                <span className="font-mono text-gray-300">{currentSummary.databaseId}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">{isRu ? 'Коллекция /feedback:' : 'Collection /feedback:'}</span>
                <span className="text-white font-bold">{livePayload?.firebaseFirestore.userFeedbackCount || 0} {isRu ? 'записей' : 'docs'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">{isRu ? 'Коллекция /support_tickets:' : 'Collection /support_tickets:'}</span>
                <span className="text-white font-bold">{livePayload?.firebaseFirestore.userSupportTicketsCount || 0} {isRu ? 'обращений' : 'tickets'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">{isRu ? 'Синхронизировано:' : 'Synced At:'}</span>
                <span className="text-emerald-400 font-mono text-[11px]">{livePayload?.firebaseFirestore.syncedAt || 'Now'}</span>
              </div>
            </div>
          </div>
        )}

        {/* PRIMARY EXPORT BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownload}
            className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black rounded-2xl border-b-4 border-amber-800 active:border-b-0 active:translate-y-1 transition-all uppercase text-xs tracking-wider shadow-lg flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <span>📥</span>
            <span>{isExporting ? (isRu ? 'Подготовка...' : 'Preparing...') : (isRu ? 'Скачать JSON (Firestore & Auth)' : 'Download JSON (Firestore & Auth)')}</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleCopy}
            className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 text-amber-300 font-black rounded-2xl border-b-4 border-gray-950 active:border-b-0 active:translate-y-1 transition-all uppercase text-xs tracking-wider shadow-lg flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <span>{copied ? '✅' : '📋'}</span>
            <span>
              {copied 
                ? (isRu ? 'Скопировано!' : 'Copied!') 
                : (isRu ? 'Копировать JSON в буфер' : 'Copy JSON to Clipboard')}
            </span>
          </button>
        </div>

        {/* PREVIEW JSON TOGGLE */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => { playSound('click'); setShowJsonPreview(!showJsonPreview); }}
            className="text-xs text-gray-400 hover:text-gray-200 underline font-bold flex items-center space-x-1 cursor-pointer"
          >
            <span>{showJsonPreview ? (isRu ? '▼ Скрыть структуру JSON' : '▼ Hide JSON structure') : (isRu ? '▶ Показать полную структуру JSON Firebase' : '▶ Show full Firebase JSON structure')}</span>
          </button>

          {showJsonPreview && (
            <div className="mt-2 p-3 bg-black/90 border border-gray-800 rounded-xl font-mono text-[11px] text-amber-300 max-h-52 overflow-y-auto custom-scrollbar whitespace-pre">
              {jsonPreviewText}
            </div>
          )}
        </div>

        {/* IF USER HAS NO FULL ACCOUNT - SUGGEST SIGN IN */}
        {!firebaseUser && onOpenRegister && (
          <div className="pt-3 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-gray-400 font-medium text-center sm:text-left">
              {isRu ? 'Для постоянного сохранения в облаке выполните Полный Вход:' : 'For continuous cloud storage perform Full Sign-In:'}
            </span>
            <button
              type="button"
              onClick={() => {
                playSound('click');
                onClose();
                onOpenRegister('login');
              }}
              className="px-4 py-2 bg-duo-blue hover:bg-sky-500 text-white font-black rounded-xl uppercase tracking-wider shadow transition-all shrink-0 cursor-pointer"
            >
              🔑 {isRu ? 'Полный Вход' : 'Full Sign-In'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
