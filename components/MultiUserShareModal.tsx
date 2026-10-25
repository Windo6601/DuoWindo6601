import React, { useState } from 'react';
import { CloseIcon, CheckCircleIcon, SparklesIcon } from './Icons';

interface MultiUserShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRoomId: string | null;
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: () => void;
  language?: string;
  playSound?: (sound: string) => void;
  setToast?: (msg: string) => void;
}

export const MultiUserShareModal: React.FC<MultiUserShareModalProps> = ({
  isOpen,
  onClose,
  activeRoomId,
  onJoinRoom,
  onCreateRoom,
  language = 'ru',
  playSound = () => {},
  setToast = () => {}
}) => {
  const isRu = language === 'ru';
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getShareUrl = (code: string) => {
    if (typeof window === 'undefined') return `https://duowindo6601.applet.run/?room=${code}`;
    return `${window.location.origin}${window.location.pathname}?room=${code}`;
  };

  const handleCopy = (code: string) => {
    playSound('click');
    const url = getShareUrl(code);
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(url);
      }
    } catch (e) {
      console.warn("Clipboard copy failed", e);
    }
    setCopied(true);
    setToast(isRu ? '✅ Ссылка для совместного доступа скопирована!' : '✅ Share link copied!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShare = async (code: string) => {
    playSound('click');
    const url = getShareUrl(code);
    if (navigator?.share) {
      try {
        await navigator.share({
          title: isRu ? 'Совместное обучение в DuoWindo6601' : 'Multi-User Learning in DuoWindo6601',
          text: isRu 
            ? 'Присоединяйся к моей онлайн-сессии в DuoWindo6601! Давай заниматься и играть вместе!' 
            : 'Join my online session in DuoWindo6601! Let\'s learn and play together!',
          url
        });
        return;
      } catch (_) {}
    }
    handleCopy(code);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 font-din">
      <div className="bg-[#131F24] border-2 border-emerald-500/50 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl relative overflow-hidden">
        {/* TOP GLOW */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* HEADER */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
                <span>{isRu ? 'Совместный доступ' : 'Multi-User Sync'}</span>
                <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/40">
                  REAL-TIME
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-medium">
                {isRu ? 'Онлайн-синхронизация сессий, уроков и шахматных партий' : 'Real-time online synchronization for lessons & chess'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { playSound('click'); onClose(); }}
            className="p-2 text-gray-400 hover:text-white rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* ACTIVE ROOM DISPLAY */}
        {activeRoomId ? (
          <div className="bg-emerald-950/40 border-2 border-emerald-500/60 rounded-2xl p-4 mb-5 text-center relative z-10 shadow-inner">
            <div className="flex items-center justify-center space-x-2 text-xs font-black uppercase tracking-widest text-emerald-400 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>{isRu ? 'Активная совместная комната' : 'Active Collaborative Room'}</span>
            </div>
            <div className="text-2xl font-mono font-black text-white tracking-widest my-2 selection:bg-emerald-500">
              {activeRoomId}
            </div>
            <p className="text-xs text-emerald-200/80 mb-3 font-bold">
              {isRu ? 'Любой пользователь по вашей ссылке сразу подключится к партии и уроку!' : 'Anyone with your link connects immediately!'}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCopy(activeRoomId)}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 shadow-md active:scale-95"
              >
                <span>{copied ? '✅' : '📋'}</span>
                <span>{copied ? (isRu ? 'Скопировано!' : 'Copied!') : (isRu ? 'Скопировать ссылку' : 'Copy Link')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleShare(activeRoomId)}
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 shadow-md active:scale-95"
              >
                <span>🚀</span>
                <span>{isRu ? 'Поделиться' : 'Share'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/80 border border-gray-700/80 rounded-2xl p-4 mb-5 text-center relative z-10">
            <span className="text-3xl block mb-1">🌐</span>
            <div className="font-extrabold text-sm text-white mb-1">
              {isRu ? 'Создайте комнату для совместной работы' : 'Create a room for collaborative sessions'}
            </div>
            <p className="text-xs text-gray-400 mb-3">
              {isRu ? 'Генерирует прямую ссылку для входа двух и более пользователей' : 'Generates direct link for multiple users'}
            </p>
            <button
              type="button"
              onClick={() => {
                playSound('click');
                onCreateRoom();
              }}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border-b-4 border-emerald-800 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center space-x-2"
            >
              <SparklesIcon className="w-4 h-4" />
              <span>{isRu ? 'Создать Совместную Комнату (+30 XP)' : 'Create Shared Room (+30 XP)'}</span>
            </button>
          </div>
        )}

        {/* JOIN BY CODE SECTION */}
        <div className="bg-gray-900/90 border border-gray-700/80 rounded-2xl p-4 relative z-10">
          <label className="block text-xs font-black uppercase text-gray-300 tracking-wider mb-2 text-left">
            {isRu ? 'Войти в комнату по коду:' : 'Join room by code:'}
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder={isRu ? 'Введите код комнаты (например DUO123)' : 'Enter room code (e.g. DUO123)'}
              className="flex-1 bg-gray-800 border-2 border-gray-700 focus:border-emerald-500 text-white text-sm font-mono font-bold rounded-xl px-3.5 py-2.5 focus:outline-none transition-colors"
            />
            <button
              type="button"
              disabled={!inputCode.trim()}
              onClick={() => {
                if (!inputCode.trim()) return;
                playSound('click');
                onJoinRoom(inputCode.trim());
                setInputCode('');
                onClose();
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border-b-4 border-emerald-800 active:translate-y-1 active:border-b-0"
            >
              {isRu ? 'Войти' : 'Join'}
            </button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-gray-400 font-medium">
            {isRu 
              ? '💡 Синхронизация выполняется в реальном времени через Google Firebase Firestore' 
              : '💡 Synchronized in real time via Google Firebase Firestore'}
          </p>
        </div>
      </div>
    </div>
  );
};
