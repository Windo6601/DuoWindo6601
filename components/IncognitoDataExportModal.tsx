import React, { useState } from 'react';
import { UserProgress } from '../types';
import { 
  downloadIncognitoDataFile, 
  copyIncognitoDataToClipboard, 
  generateIncognitoExportData, 
  isIncognitoLoginClosed, 
  getDaysUntilIncognitoClosure,
  getFormattedClosureDate,
  getIncognitoClosureTitle
} from '../services/incognitoService';

export interface IncognitoDataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProgress;
  onOpenRegister?: (tab?: 'login' | 'register' | 'google' | 'incognito') => void;
  language?: string;
  playSound: (type: 'click' | 'correct' | 'wrong' | 'fanfare' | 'streak') => void;
  setToast: (msg: string | null) => void;
}

export const IncognitoDataExportModal: React.FC<IncognitoDataExportModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenRegister,
  language = 'ru',
  playSound,
  setToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  if (!isOpen) return null;

  const isRu = language === 'ru';
  const isClosed = isIncognitoLoginClosed();
  const daysLeft = getDaysUntilIncognitoClosure();
  const closureDateStr = getFormattedClosureDate(language);

  const exportPayload = generateIncognitoExportData(user, language);
  const jsonPreviewText = JSON.stringify(exportPayload, null, 2);

  const handleDownload = () => {
    playSound('correct');
    const filename = downloadIncognitoDataFile(user, language);
    setToast(
      isRu 
        ? `💾 Файл ${filename} успешно сохранён!` 
        : `💾 File ${filename} successfully downloaded!`
    );
  };

  const handleCopy = async () => {
    playSound('click');
    const success = await copyIncognitoDataToClipboard(user, language);
    if (success) {
      setCopied(true);
      setToast(
        isRu 
          ? '📋 Все данные Режима Инкогнито скопированы в буфер обмена!' 
          : '📋 All Incognito data copied to clipboard!'
      );
      setTimeout(() => setCopied(false), 3000);
    } else {
      playSound('wrong');
      setToast(isRu ? '❌ Не удалось скопировать данные' : '❌ Failed to copy data');
    }
  };

  return (
    <div className="fixed inset-0 z-[280] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div 
        className="fixed inset-0" 
        onClick={() => { playSound('click'); onClose(); }} 
      />

      <div className="relative z-10 bg-gray-950 border-2 border-emerald-500/70 rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-[0_0_50px_rgba(16,185,129,0.25)] text-white space-y-4 max-h-[92vh] overflow-y-auto text-left">
        
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 border-2 border-white/40 flex items-center justify-center text-2xl shadow-lg shrink-0">
              💾
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
                <span>{isRu ? 'Экспорт данных' : 'Export Incognito Data'}</span>
              </h3>
              <p className="text-xs text-emerald-400 font-bold">
                {isRu ? 'Режим Инкогнито (Без аккаунта)' : 'Incognito Mode (No Account)'}
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

        {/* STATUS & CLOSURE BANNER */}
        <div className={`p-4 rounded-2xl border ${
          isClosed 
            ? 'bg-rose-950/40 border-rose-500/60 text-rose-200' 
            : 'bg-amber-950/40 border-amber-500/60 text-amber-200'
        } space-y-2`}>
          <div className="flex items-center space-x-2">
            <span className="text-xl shrink-0">{isClosed ? '🛑' : '🚫'}</span>
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wide">
              {getIncognitoClosureTitle(language)}
            </h4>
          </div>
          <p className="text-xs text-gray-200 font-bold leading-relaxed">
            {isRu
              ? '10 октября 2026 года вход в Режим Инкогнито недоступен, и его нельзя будет восстановить в DuoWindo6601.'
              : 'On October 10, 2026, entry into Incognito Mode is unavailable and cannot be restored in DuoWindo6601.'}
          </p>
          <p className="text-xs text-gray-300 font-medium leading-relaxed">
            {isRu 
              ? 'Синхронизирован актуальный статус не закрытия: Полный Вход и регистрация работают без ограничений, профиль Администратора доступен.' 
              : 'Synchronized actual unclosed status: Full Sign-In & registration operate normally, Admin Profile is active.'}
          </p>
          <div className="pt-1 flex flex-wrap gap-2 text-[11px] font-bold">
            <span className="bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 px-2.5 py-1 rounded-xl flex items-center space-x-1.5 shadow-sm">
              <span>✅</span>
              <span>{isRu ? 'Полный Вход и регистрация: НЕ ЗАКРЫТ (Работает)' : 'Full Sign-In & Registration: NOT CLOSED (Active)'}</span>
            </span>
            <span className="bg-amber-950/90 text-amber-300 border border-amber-500/60 px-2.5 py-1 rounded-xl flex items-center space-x-1.5 shadow-sm">
              <span>👑</span>
              <span>{isRu ? 'Профиль Администратора: НЕ ЗАКРЫТ' : 'Admin Profile: NOT CLOSED'}</span>
            </span>
          </div>
        </div>

        {/* DATA SUMMARY CARDS */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {isRu ? 'Что входит в экспорт данных:' : 'Data included in export:'}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-gray-900 border border-gray-800 p-2.5 rounded-xl text-center">
              <span className="text-lg">⚡</span>
              <div className="text-base font-black text-white">{user.xp || 0}</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase">{isRu ? 'Опыт XP' : 'XP'}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-2.5 rounded-xl text-center">
              <span className="text-lg">🔥</span>
              <div className="text-base font-black text-amber-400">{user.streak || 0}</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase">{isRu ? 'Серия дней' : 'Streak'}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-2.5 rounded-xl text-center">
              <span className="text-lg">📚</span>
              <div className="text-base font-black text-duo-blue">{user.completedLessons?.length || 0}</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase">{isRu ? 'Уроков' : 'Lessons'}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-2.5 rounded-xl text-center">
              <span className="text-lg">📖</span>
              <div className="text-base font-black text-emerald-400">{user.learnedWords?.length || 0}</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase">{isRu ? 'Слов' : 'Words'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
            <div className="bg-gray-900/60 border border-gray-800 px-3 py-2 rounded-xl text-gray-300 flex items-center justify-between">
              <span className="text-gray-400">{isRu ? 'Кристаллы:' : 'Gems:'}</span>
              <span className="font-bold text-sky-400">💎 {user.gems || 0}</span>
            </div>
            <div className="bg-gray-900/60 border border-gray-800 px-3 py-2 rounded-xl text-gray-300 flex items-center justify-between">
              <span className="text-gray-400">{isRu ? 'Ошибки:' : 'Mistakes:'}</span>
              <span className="font-bold text-rose-400">{user.mistakes?.length || 0}</span>
            </div>
            <div className="bg-gray-900/60 border border-gray-800 px-3 py-2 rounded-xl text-gray-300 flex items-center justify-between col-span-2 sm:col-span-1">
              <span className="text-gray-400">{isRu ? 'Шахматы ELO:' : 'Chess ELO:'}</span>
              <span className="font-bold text-amber-300">♟️ {user.chessStats?.elo || 1200}</span>
            </div>
          </div>
        </div>

        {/* PRIMARY EXPORT BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownload}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all uppercase text-xs tracking-wider shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>📥</span>
            <span>{isRu ? 'Скачать файл JSON' : 'Download JSON File'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-2xl border-b-4 border-sky-800 active:border-b-0 active:translate-y-1 transition-all uppercase text-xs tracking-wider shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>{copied ? '✅' : '📋'}</span>
            <span>
              {copied 
                ? (isRu ? 'Скопировано!' : 'Copied!') 
                : (isRu ? 'Копировать в буфер' : 'Copy to Clipboard')}
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
            <span>{showJsonPreview ? '▼ Скрыть предпросмотр JSON' : '▶ Показать структуру JSON-файла'}</span>
          </button>

          {showJsonPreview && (
            <div className="mt-2 p-3 bg-black/90 border border-gray-800 rounded-xl font-mono text-[11px] text-emerald-300 max-h-48 overflow-y-auto custom-scrollbar whitespace-pre">
              {jsonPreviewText}
            </div>
          )}
        </div>

        {/* TRANSFER TO FULL ACCOUNT CTA */}
        {onOpenRegister && (
          <div className="pt-3 border-t border-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300">
                {isRu ? 'Хотите сохранить прогресс навсегда?' : 'Want to keep your progress permanently?'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  onClose();
                  onOpenRegister('register');
                }}
                className="w-full py-2.5 bg-duo-green hover:bg-duo-greenDark text-white font-black rounded-xl border-b-2 border-duo-greenDark active:translate-y-0.5 transition-all uppercase text-xs tracking-wider shadow flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>📝</span>
                <span>{isRu ? 'Создать аккаунт (Перенести данные)' : 'Register & Transfer Data'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  onClose();
                  onOpenRegister('login');
                }}
                className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-black rounded-xl border-b-2 border-gray-600 active:translate-y-0.5 transition-all uppercase text-xs tracking-wider shadow flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>🔑</span>
                <span>{isRu ? 'Полный Вход (Email / Google)' : 'Full Sign-In'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
