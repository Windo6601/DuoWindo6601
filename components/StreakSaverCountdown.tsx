import React, { useState, useEffect } from 'react';
import { UserProgress } from '../types';
import { FireIcon, LightningIcon, SparklesIcon, CheckCircleIcon, ShieldIcon, CloseIcon } from './Icons';

interface StreakSaverCountdownProps {
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  onStartLesson?: () => void;
  onOpenShop?: () => void;
  isLightMode?: boolean;
  playSound?: (sound: string) => void;
  setToast?: (msg: string | null) => void;
  isCompact?: boolean;
}

export const StreakSaverCountdown: React.FC<StreakSaverCountdownProps> = ({
  user,
  setUser,
  onStartLesson,
  onOpenShop,
  isLightMode = false,
  playSound = () => {},
  setToast = () => {},
  isCompact = false
}) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [daysInactive, setDaysInactive] = useState<number>(0);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // Personalized username fallback (e.g. "Тимур!")
  const userName = user.name || 'Тимур';
  const isRu = user.language === 'ru';

  const todayISO = new Date().toISOString().split('T')[0];
  const isCompletedToday = user.dailyChallengeCompletedDate === todayISO || user.lastActiveDate === todayISO;

  // Calculate live countdown until midnight (23:59:59) & inactivity days
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const diffMs = endOfDay.getTime() - now.getTime();
      if (diffMs > 0) {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }

      // Calculate days inactive if user hasn't logged in for a while
      if (user.lastActiveDate) {
        const lastDate = new Date(user.lastActiveDate);
        const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        setDaysInactive(Math.max(0, diffDays));
      } else {
        setDaysInactive(0);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [user.lastActiveDate]);

  // Activate Streak Freeze (Заморозка)
  const handleUseFreeze = () => {
    if ((user.streakFreezeCount || 0) <= 0) {
      playSound('click');
      if (onOpenShop) onOpenShop();
      return;
    }

    playSound('success');
    setUser(prev => {
      const updated: UserProgress = {
        ...prev,
        streakFreezeCount: Math.max(0, (prev.streakFreezeCount || 1) - 1),
        dailyChallengeCompletedDate: todayISO
      };
      try {
        localStorage.setItem('duowindo6601_user_progress_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setToast(isRu ? '🧊 Заморозка ударного режима активирована! Ваш рекорд защищён.' : '🧊 Streak Freeze activated! Your streak is protected.');
  };

  if (isDismissed) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  // Completed Today Banner State
  if (isCompletedToday) {
    return (
      <div className={`w-full rounded-3xl p-4 sm:p-5 border-2 transition-all shadow-lg my-3 ${
        isLightMode ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-emerald-950/40 border-emerald-500/50 text-white'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              🔥
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm sm:text-base text-emerald-400 truncate">
                  {isRu ? `Ударный режим продлён, ${userName}!` : `Streak Extended, ${userName}!`}
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-500/40 shrink-0">
                  {user.streak || 1} {isRu ? 'дн.' : 'days'}
                </span>
              </div>
              <p className="text-xs text-gray-300 font-medium mt-0.5 truncate">
                {isRu ? 'Вы отлично позанимались сегодня! Следующий обратный отсчёт начнётся завтра.' : 'Great job today! Next countdown starts tomorrow.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
              <span>{isRu ? 'Защищено' : 'Protected'}</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Active Countdown Warning Banner State
  return (
    <div className={`relative w-full rounded-3xl p-4 sm:p-6 border-2 transition-all shadow-2xl my-3 overflow-hidden ${
      isLightMode 
        ? 'bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border-amber-400 text-slate-900' 
        : 'bg-gradient-to-r from-amber-950/80 via-orange-950/70 to-rose-950/80 border-amber-500/70 text-white'
    }`}>
      
      {/* Background Animated Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Side: Avatar / Flame + Title */}
        <div className="flex items-start space-x-3.5">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-3xl shadow-lg border-2 border-amber-300 animate-bounce">
              🔥
            </div>
            {user.streak > 0 && (
              <span className="absolute -bottom-1 -right-1 bg-red-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded-full border border-white shadow">
                {user.streak}d
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-500/40">
                ⚠️ {isRu ? 'ОБРАТНЫЙ ОТСЧЁТ' : 'COUNTDOWN TIMER'}
              </span>
              {daysInactive > 1 && (
                <span className="bg-red-500/20 text-red-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-red-500/40">
                  {isRu ? `Не заходили ${daysInactive} дн.` : `Inactive ${daysInactive}d`}
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-black mt-1 text-white leading-snug">
              {isRu ? `Продлите ударный режим, ${userName}!` : `Extend your streak, ${userName}!`}
            </h3>

            <p className="text-xs text-amber-200/90 font-medium mt-0.5 max-w-lg leading-relaxed">
              {daysInactive >= 7
                ? (isRu ? 'Вы не заходили в приложение DuoWindo6601 более недели! Пройдите 1 урок прямо сейчас, чтобы вернуть и сохранить ударный режим!' : 'You haven’t logged in for over a week! Complete 1 lesson now to recover your streak!')
                : (isRu ? 'Если не пройти урок до конца дня, ваш ударный режим может сброситься.' : 'Complete a lesson before midnight to protect your streak.')}
            </p>
          </div>
        </div>

        {/* Right Side: Live Timer Clock & CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 self-stretch md:self-auto">
          
          {/* Real-time Clock Widget */}
          <div className="bg-black/50 border border-amber-500/50 rounded-2xl px-4 py-2 flex items-center justify-center space-x-2 text-center w-full sm:w-auto shadow-inner">
            <div className="flex flex-col items-center">
              <span className="text-xl font-black font-mono text-amber-300 leading-none">
                {pad(timeLeft.hours)}
              </span>
              <span className="text-[9px] font-bold text-gray-400 uppercase">{isRu ? 'час' : 'hrs'}</span>
            </div>
            <span className="text-amber-400 font-black text-lg animate-pulse">:</span>
            <div className="flex flex-col items-center">
              <span className="text-xl font-black font-mono text-amber-300 leading-none">
                {pad(timeLeft.minutes)}
              </span>
              <span className="text-[9px] font-bold text-gray-400 uppercase">{isRu ? 'мин' : 'min'}</span>
            </div>
            <span className="text-amber-400 font-black text-lg animate-pulse">:</span>
            <div className="flex flex-col items-center">
              <span className="text-xl font-black font-mono text-amber-300 leading-none">
                {pad(timeLeft.seconds)}
              </span>
              <span className="text-[9px] font-bold text-gray-400 uppercase">{isRu ? 'сек' : 'sec'}</span>
            </div>
          </div>

          {/* Start Lesson Button */}
          {onStartLesson && (
            <button
              onClick={() => {
                playSound('select');
                onStartLesson();
              }}
              className="w-full sm:w-auto py-3 px-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <LightningIcon className="w-4 h-4 text-black" />
              <span>{isRu ? '⚡ Пройти урок' : '⚡ Start Lesson'}</span>
            </button>
          )}

          {/* Freeze Button */}
          {(user.streakFreezeCount || 0) > 0 ? (
            <button
              onClick={handleUseFreeze}
              className="w-full sm:w-auto py-3 px-3.5 bg-sky-950 hover:bg-sky-900 border border-sky-400/60 text-sky-200 font-bold text-xs rounded-2xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow"
              title={isRu ? 'Использовать заморозку' : 'Use streak freeze'}
            >
              <span>🧊</span>
              <span className="text-[11px] font-black">{user.streakFreezeCount}</span>
            </button>
          ) : (
            onOpenShop && (
              <button
                onClick={() => {
                  playSound('click');
                  onOpenShop();
                }}
                className="w-full sm:w-auto py-3 px-3.5 bg-gray-900/80 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
                title={isRu ? 'Купить заморозку' : 'Buy freeze'}
              >
                <span>🛒</span>
                <span className="text-[10px] uppercase font-black">{isRu ? 'Заморозка' : 'Freeze'}</span>
              </button>
            )
          )}
        </div>

      </div>
    </div>
  );
};
