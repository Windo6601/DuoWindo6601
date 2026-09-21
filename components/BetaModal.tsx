import React from 'react';
import { UserProgress, Course } from '../types';
import { 
  CloseIcon, 
  ShieldIcon, 
  ActivityIcon, 
  StarIcon, 
  GemStoneIcon, 
  LightningIcon, 
  CheckCircleIcon,
  VolumeIcon
} from './Icons';
import { speakText } from '../services/geminiService';

interface BetaModalProps {
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  onClose: () => void;
  onOpenAdmin: () => void;
  onOpenSystemInfo: () => void;
  onOpenFeedback: () => void;
  onSelectCourse?: (course: Course) => void;
  onDismissBanner?: () => void;
  playSound: (type: 'click' | 'correct' | 'wrong' | 'fanfare' | 'streak' | string) => void;
  courses?: Course[];
}

export const BetaModal: React.FC<BetaModalProps> = ({
  user,
  setUser,
  onClose,
  onOpenAdmin,
  onOpenSystemInfo,
  onOpenFeedback,
  onSelectCourse,
  onDismissBanner,
  playSound,
  courses = []
}) => {
  const handleEnableVip = () => {
    playSound('correct');
    setUser(prev => ({
      ...prev,
      subscription: 'max',
      hearts: 'unlimited',
      gems: prev.gems + 99999,
      streak: Math.max(prev.streak, 100)
    }));
  };

  const handleAddGems = () => {
    playSound('correct');
    setUser(prev => ({
      ...prev,
      gems: prev.gems + 1000
    }));
  };

  const handleTestTts = async () => {
    playSound('click');
    try {
      await speakText('Добро пожаловать в Бета-Центр DuoWindo6601!', user.language || 'ru');
    } catch {
      playSound('correct');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-gradient-to-b from-gray-900 via-gray-900 to-slate-950 border-2 border-purple-500/50 rounded-3xl max-w-2xl w-full p-6 text-white shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar relative">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-purple-500/30 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-2xl shadow-lg ring-2 ring-purple-400/40">
              🧪
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-din font-black text-xl md:text-2xl text-white tracking-wider uppercase">
                  DuoWindo6601 Бета-Центр
                </h3>
                <span className="bg-purple-500/20 text-purple-300 border border-purple-400/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Beta v6601
                </span>
              </div>
              <p className="text-xs text-purple-200/80 font-medium mt-0.5">
                Панель управления тестированием, диагностикой и функциями приложения
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Current Status Bar */}
        <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-gray-300">
              Статус подписки: <strong className="text-amber-400 uppercase">{user.subscription}</strong>
            </span>
            <span className="text-gray-500">|</span>
            <span className="font-bold text-gray-300">
              Кристаллы: <strong className="text-duo-blue">{user.gems} 💎</strong>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-300">
              Язык: <strong className="text-emerald-400 uppercase">{user.language}</strong>
            </span>
          </div>
        </div>

        {/* Testing Actions Grid */}
        <div className="space-y-3">
          <h4 className="font-black text-xs uppercase tracking-wider text-purple-300 flex items-center space-x-2">
            <LightningIcon className="w-4 h-4 text-purple-400" />
            <span>Инструменты и функции для тестов</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* Enable MAX VIP */}
            <button
              onClick={handleEnableVip}
              className="p-4 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800/80 hover:to-indigo-800/80 border border-purple-500/40 rounded-2xl text-left transition-all group hover:scale-[1.02] shadow-md flex items-start space-x-3"
            >
              <div className="text-2xl p-2 bg-purple-950 rounded-xl border border-purple-500/30">
                👑
              </div>
              <div>
                <span className="font-black text-sm block text-purple-200 group-hover:text-white">
                  Активировать MAX VIP
                </span>
                <span className="text-[11px] text-gray-300 font-medium block mt-0.5">
                  Бесконечные жизни, 99k кристаллов и максимальный доступ
                </span>
              </div>
            </button>

            {/* Admin Dashboard */}
            <button
              onClick={onOpenAdmin}
              className="p-4 bg-gray-800/80 hover:bg-gray-750 border border-gray-700 hover:border-purple-500/50 rounded-2xl text-left transition-all group hover:scale-[1.02] shadow-md flex items-start space-x-3"
            >
              <div className="text-2xl p-2 bg-black/40 rounded-xl border border-gray-700">
                🛠️
              </div>
              <div>
                <span className="font-black text-sm block text-gray-200 group-hover:text-white">
                  Панель Управления (Admin)
                </span>
                <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
                  Управление базой данных, курсами и логами систем
                </span>
              </div>
            </button>

            {/* System & OS Compatibility */}
            <button
              onClick={onOpenSystemInfo}
              className="p-4 bg-gray-800/80 hover:bg-gray-750 border border-gray-700 hover:border-duo-blue/50 rounded-2xl text-left transition-all group hover:scale-[1.02] shadow-md flex items-start space-x-3"
            >
              <div className="text-2xl p-2 bg-black/40 rounded-xl border border-gray-700">
                🌐
              </div>
              <div>
                <span className="font-black text-sm block text-gray-200 group-hover:text-white">
                  Проверка Браузера & ОС
                </span>
                <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
                  Тест Android, macOS, Linux, Windows и Браузеров
                </span>
              </div>
            </button>

            {/* Feedback & Reviews */}
            <button
              onClick={onOpenFeedback}
              className="p-4 bg-gray-800/80 hover:bg-gray-750 border border-gray-700 hover:border-amber-500/50 rounded-2xl text-left transition-all group hover:scale-[1.02] shadow-md flex items-start space-x-3"
            >
              <div className="text-2xl p-2 bg-black/40 rounded-xl border border-gray-700">
                ⭐
              </div>
              <div>
                <span className="font-black text-sm block text-gray-200 group-hover:text-white">
                  Отзывы и Тест-Репорты
                </span>
                <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
                  Просмотр сообщений от пользователей и отправка отзывов
                </span>
              </div>
            </button>

            {/* Test AI Voice / TTS */}
            <button
              onClick={handleTestTts}
              className="p-4 bg-gray-800/80 hover:bg-gray-750 border border-gray-700 hover:border-emerald-500/50 rounded-2xl text-left transition-all group hover:scale-[1.02] shadow-md flex items-start space-x-3"
            >
              <div className="text-2xl p-2 bg-black/40 rounded-xl border border-gray-700">
                🔊
              </div>
              <div>
                <span className="font-black text-sm block text-gray-200 group-hover:text-white flex items-center gap-1.5">
                  <span>Тест AI Озвучки</span>
                  <VolumeIcon className="w-4 h-4 text-emerald-400" />
                </span>
                <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
                  Проверить работу речи и аудиосинтезатора
                </span>
              </div>
            </button>

            {/* Add 1000 Gems */}
            <button
              onClick={handleAddGems}
              className="p-4 bg-gray-800/80 hover:bg-gray-750 border border-gray-700 hover:border-duo-yellow/50 rounded-2xl text-left transition-all group hover:scale-[1.02] shadow-md flex items-start space-x-3"
            >
              <div className="text-2xl p-2 bg-black/40 rounded-xl border border-gray-700">
                💎
              </div>
              <div>
                <span className="font-black text-sm block text-gray-200 group-hover:text-white">
                  +1000 Кристаллов
                </span>
                <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
                  Пополнить баланс гемов для тестовых покупок
                </span>
              </div>
            </button>

          </div>
        </div>

        {/* Quick Language Switcher */}
        <div className="space-y-2 pt-2 border-t border-gray-800">
          <h4 className="font-black text-xs uppercase tracking-wider text-gray-400">
            Быстрое переключение языка интерфейса
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {[
              { code: 'ru', label: '🇷🇺 RU' },
              { code: 'en', label: '🇬🇧 EN' },
              { code: 'de', label: '🇩🇪 DE' },
              { code: 'fr', label: '🇫🇷 FR' },
              { code: 'es', label: '🇪🇸 ES' },
              { code: 'ja', label: '🇯🇵 JA' },
              { code: 'zh', label: '🇨🇳 ZH' },
              { code: 'ar', label: '🇸🇦 AR' },
            ].map(lang => (
              <button
                key={lang.code}
                onClick={() => {
                  playSound('click');
                  setUser(prev => ({ ...prev, language: lang.code as any }));
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                  user.language === lang.code
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md ring-2 ring-purple-400/50'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-800">
          {onDismissBanner && (
            <button
              onClick={onDismissBanner}
              className="text-xs font-bold text-gray-400 hover:text-red-400 transition-colors"
            >
              Скрыть баннер бета-тестирования
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-95"
          >
            Закрыть Бета-Центр
          </button>
        </div>

      </div>
    </div>
  );
};
