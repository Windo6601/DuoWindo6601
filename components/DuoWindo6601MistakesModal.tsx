import React from 'react';
import { UserProgress, Course, Exercise, WordToken } from '../types';
import { CloseIcon, VolumeIcon, SparklesIcon, CheckCircleIcon, ArrowRightIcon } from './Icons';

interface DuoWindo6601MistakesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  currentCourse: Course;
  playSound: (sound: any) => void;
  setToast: (msg: string) => void;
  speakText: (text: string, courseId: string, slow?: boolean) => void;
  onPracticeMistake: (mistake: Exercise) => void;
  onPracticeAllMistakes: () => void;
}

export const DuoWindo6601MistakesModal: React.FC<DuoWindo6601MistakesModalProps> = ({
  isOpen,
  onClose,
  user,
  setUser,
  currentCourse,
  playSound,
  setToast,
  speakText,
  onPracticeMistake,
  onPracticeAllMistakes
}) => {
  const isRu = user.language !== 'en';
  const mistakes = user.mistakes || [];
  const mistakeCount = mistakes.length;

  if (!isOpen) return null;

  const handleClearMistake = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    setUser(u => ({
      ...u,
      mistakes: (u.mistakes || []).filter(m => m.id !== id)
    }));
    setToast(isRu ? '✓ Ошибка удалена из списка' : '✓ Mistake removed from review list');
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in select-none">
      <div className="bg-[#131f24] border-2 border-[#263843] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative text-left">
        
        {/* HEADER BAR */}
        <div className="p-4 sm:p-5 border-b border-[#263843] flex items-center justify-between bg-[#182328]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ff9600] flex items-center justify-center text-xl shadow-md text-white">
              🔄
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>{isRu ? 'Исправление ошибок' : 'Mistakes Review'}</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {mistakeCount} {isRu ? 'ошибок' : 'mistakes'}
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-bold">
                {isRu ? 'Повторяйте трудные фразы, чтобы закрепить их навсегда' : 'Review your tricky sentences and master them for good'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            title="Закрыть"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {mistakeCount === 0 ? (
            /* ZERO MISTAKES CELEBRATION */
            <div className="py-12 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-4xl mx-auto shadow-lg">
                🎉
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">
                  {isRu ? 'Все ошибки исправлены!' : 'All mistakes resolved!'}
                </h3>
                <p className="text-sm font-bold text-gray-400 max-w-md mx-auto mt-1">
                  {isRu
                    ? 'Ваш банк ошибок пуст. Отличная работа! Продолжайте проходить уроки или начните быструю тренировку.'
                    : 'Your mistake bank is completely clear. Awesome work! Continue lessons or start a quick refresh drill.'}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    onClose();
                    onPracticeAllMistakes();
                  }}
                  className="px-6 py-3.5 bg-[#1cb0f6] hover:bg-[#189ddc] border-b-4 border-[#1482b8] text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all cursor-pointer active:translate-y-1 active:border-b-0"
                >
                  {isRu ? '⚡ НАЧАТЬ БЫСТРУЮ ТРЕНИРОВКУ' : '⚡ START QUICK PRACTICE'}
                </button>
              </div>
            </div>
          ) : (
            /* LIST OF MISTAKES */
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                  {isRu ? 'НЕИСПРАВЛЕННЫЕ ФРАЗЫ' : 'MISTAKES TO RESOLVE'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playSound('fanfare');
                    onClose();
                    onPracticeAllMistakes();
                  }}
                  className="text-xs font-black text-amber-400 hover:text-amber-300 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <span>{isRu ? 'Исправить все' : 'Review all'}</span>
                  <span>→</span>
                </button>
              </div>

              {mistakes.map((mistake, index) => (
                <div
                  key={mistake.id || index}
                  onClick={() => {
                    onClose();
                    const safeMistake =
                      currentCourse.id === 'tlh' && mistake.type === 'speech'
                        ? { ...mistake, type: 'listening' as const }
                        : mistake;
                    onPracticeMistake(safeMistake);
                  }}
                  className="bg-[#182328] hover:bg-[#202f36] border-2 border-[#263843] hover:border-amber-500/50 rounded-2xl p-4 cursor-pointer transition-all duration-200 active:scale-[0.99] shadow-md flex items-start justify-between gap-3 group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black flex items-center justify-center">
                        #{index + 1}
                      </span>
                      <span className="text-xs font-black text-gray-400 uppercase">
                        {mistake.type === 'listening' || (currentCourse.id === 'tlh' && mistake.type === 'speech')
                          ? (isRu ? 'Аудирование' : 'Listening') 
                          : mistake.type === 'speech' 
                          ? (isRu ? 'Речь' : 'Speech') 
                          : (isRu ? 'Перевод' : 'Translation')}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(mistake.originalSentence, currentCourse.id);
                        }}
                        className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title="Озвучить"
                      >
                        <VolumeIcon className="w-3.5 h-3.5 text-amber-300" />
                      </button>
                    </div>

                    <p className="text-white font-bold text-base leading-snug">
                      {mistake.originalSentence}
                    </p>

                    <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <span>✓ {isRu ? 'Правильный ответ:' : 'Correct:'}</span>
                      <span className="text-white">{mistake.targetTranslation}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleClearMistake(mistake.id, e)}
                      className="p-1 text-gray-500 hover:text-red-400 text-xs transition-colors cursor-pointer"
                      title={isRu ? 'Удалить из списка' : 'Dismiss'}
                    >
                      ✕
                    </button>
                    <span className="px-3 py-1.5 bg-[#ff9600] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md group-hover:scale-105 transition-transform flex items-center gap-1">
                      <span>{isRu ? 'Исправить' : 'Fix'}</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        {mistakeCount > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#263843] bg-[#182328] flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">
              {isRu ? `Всего ошибок: ${mistakeCount}` : `Total mistakes: ${mistakeCount}`}
            </span>
            <button
              type="button"
              onClick={() => {
                playSound('fanfare');
                onClose();
                onPracticeAllMistakes();
              }}
              className="px-8 py-3.5 bg-[#ff9600] hover:bg-[#e68700] border-b-4 border-[#cc7700] text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all cursor-pointer active:translate-y-1 active:border-b-0"
            >
              {isRu ? '🚀 ИСПРАВИТЬ ВСЕ ОШИБКИ' : '🚀 REVIEW ALL MISTAKES'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const DuolingoMistakesModal = DuoWindo6601MistakesModal;
