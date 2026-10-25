import React, { useState, useEffect } from 'react';
import { UserProgress, SubscriptionTier } from '../types';
import { UNLOCK_DEADLINE_ISO } from '../services/languageLockService';

interface ShopSuperTrialSectionProps {
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  playSound: (sound: any) => void;
  setToast: (msg: string) => void;
  upgradeSubscription: (tier: SubscriptionTier) => void;
  isIncognitoUser: boolean;
  STORAGE_KEY: string;
}

export const ShopSuperTrialSection: React.FC<ShopSuperTrialSectionProps> = ({
  user,
  setUser,
  playSound,
  setToast,
  upgradeSubscription,
  isIncognitoUser,
  STORAGE_KEY,
}) => {
  const isRu = user.language === 'ru';
  const deadlineDate = new Date(UNLOCK_DEADLINE_ISO); // November 1, 2026
  const isDeadlinePassed = Date.now() >= deadlineDate.getTime();

  // Calculate if trial is active
  const isTrialActive = Boolean(
    user.hasClaimedSuperTrial &&
    user.superTrialExpiresAt &&
    Date.now() < new Date(user.superTrialExpiresAt).getTime() &&
    user.subscription === 'super'
  );

  // If user ALREADY has a permanent/active subscription to Super or Max (not temporary trial)
  const isAlreadySubscribed = (user.subscription === 'super' || user.subscription === 'max') && !isTrialActive;

  // Calculate if trial expired (either marked expired, or expiresAt in the past)
  const isTrialExpired = Boolean(
    !isAlreadySubscribed && (
      user.superTrialExpired ||
      (user.superTrialExpiresAt && Date.now() >= new Date(user.superTrialExpiresAt).getTime())
    )
  );

  // Calculate if skipped
  const isTrialSkipped = Boolean(!isAlreadySubscribed && user.superTrialSkipped && !user.hasClaimedSuperTrial);

  // Time remaining state for active trial
  const [remainingText, setRemainingText] = useState<string>('');

  useEffect(() => {
    if (!isTrialActive || !user.superTrialExpiresAt) return;

    const updateRemaining = () => {
      const diffMs = new Date(user.superTrialExpiresAt!).getTime() - Date.now();
      if (diffMs <= 0) {
        // Expired right now!
        setUser(prev => {
          const updated: UserProgress = {
            ...prev,
            subscription: prev.subscription === 'super' ? 'free' : prev.subscription,
            superTrialExpired: true,
            infiniteEnergy: false,
            infiniteHearts: false
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        });
        setToast(
          isRu
            ? '⌛ Срок бесплатного DuoWindo6601 Super (3 дня) закончился! Предложение доступно 1 раз (до 1 ноября 2026 г.).'
            : '⌛ Free 3-Day DuoWindo6601 Super trial has expired! Available once (offer ended Nov 1, 2026).'
        );
        return;
      }
      const totalSec = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;

      if (days > 0) {
        setRemainingText(isRu ? `${days} дн. ${hours} ч. ${mins} мин.` : `${days}d ${hours}h ${mins}m`);
      } else {
        setRemainingText(isRu ? `${hours} ч. ${mins} мин. ${secs} сек.` : `${hours}h ${mins}m ${secs}s`);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [isTrialActive, user.superTrialExpiresAt, isRu, setUser, setToast, STORAGE_KEY]);

  // Handler: Claim Free 3-Day Super Trial
  const handleClaimTrial = () => {
    if (user.subscription === 'super' || user.subscription === 'max') {
      playSound('wrong');
      setToast(
        isRu
          ? '🔒 Уже оформлена подписка DuoWindo6601 Super или DuoWindo6601 Max! Нельзя получить бесплатный DuoWindo6601 Super на 3 дня.'
          : '🔒 Already subscribed to DuoWindo6601 Super or DuoWindo6601 Max! Cannot claim free 3-day Super trial.'
      );
      return;
    }

    if (isDeadlinePassed) {
      playSound('wrong');
      setToast(
        isRu
          ? '🛑 Предложение закончилось до 1 ноября 2026 года!'
          : '🛑 The offer ended by November 1, 2026!'
      );
      return;
    }

    if (user.hasClaimedSuperTrial || isTrialExpired) {
      playSound('wrong');
      setToast(
        isRu
          ? '🛑 Срок закончился (3 дня). Предложение доступно только один раз до 1 ноября 2026 года!'
          : '🛑 Trial expired (3 days). Offer is available only once until November 1, 2026!'
      );
      return;
    }

    if (isIncognitoUser) {
      playSound('wrong');
      setToast(
        isRu
          ? '🔒 Режим Инкогнито: Для получения бесплатного Super на 3 дня требуется постоянный аккаунт!'
          : '🔒 Incognito Mode: Registered account required to claim free 3-day Super!'
      );
      return;
    }

    const now = new Date();
    const expiresDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days

    playSound('fanfare');
    setUser(prev => {
      const updated: UserProgress = {
        ...prev,
        subscription: 'super',
        infiniteEnergy: true,
        infiniteHearts: true,
        hasClaimedSuperTrial: true,
        superTrialClaimedAt: now.toISOString(),
        superTrialExpiresAt: expiresDate.toISOString(),
        superTrialSkipped: false,
        superTrialExpired: false,
        lastFreeSuperClaimDate: now.toDateString(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setToast(
      isRu
        ? '🎉 Поздравляем! Бесплатный DuoWindo6601 Super на 3 дня активирован! Доступно 1 раз (до 1 ноября 2026 г.).'
        : '🎉 Congratulations! Free 3-Day DuoWindo6601 Super trial activated! Available once (until Nov 1, 2026).'
    );
  };

  // Handler: Skip Free 3-Day Super Trial
  const handleSkipTrial = () => {
    playSound('click');
    setUser(prev => {
      const updated: UserProgress = {
        ...prev,
        superTrialSkipped: true,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setToast(
      isRu
        ? '⏭️ Предложение бесплатного Super на 3 дня пропущено. Доступно 1 раз до 1 ноября 2026 г.'
        : '⏭️ Free 3-Day Super trial offer skipped. Available once until Nov 1, 2026.'
    );
  };

  // Handler: Restore/Reconsider if skipped
  const handleReconsiderTrial = () => {
    playSound('click');
    setUser(prev => {
      const updated: UserProgress = {
        ...prev,
        superTrialSkipped: false,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  return (
    <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-blue-950 border-2 border-purple-500/60 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 text-left relative overflow-hidden">
      {/* Decorative gradient blur backdrop */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER SECTION */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start space-x-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0 border-2 ${
            isAlreadySubscribed
              ? 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-amber-500/20'
              : isTrialExpired
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                : isTrialActive
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 border-emerald-400 text-white animate-pulse'
                  : isTrialSkipped
                    ? 'bg-gray-900 border-gray-700 text-gray-400'
                    : 'bg-gradient-to-tr from-purple-500 to-blue-500 border-purple-400 text-white'
          }`}>
            {isAlreadySubscribed ? '👑' : isTrialExpired ? '⌛' : isTrialActive ? '⚡' : isTrialSkipped ? '⏭️' : isDeadlinePassed ? '🛑' : '🎁'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wide">
                {isAlreadySubscribed
                  ? (isRu 
                      ? `Уже оформлена подписка DuoWindo6601 ${user.subscription === 'max' ? 'Max' : 'Super'}`
                      : `Already Subscribed to DuoWindo6601 ${user.subscription === 'max' ? 'Max' : 'Super'}`)
                  : isTrialExpired
                    ? (isRu ? 'Срок действия DuoWindo6601 Super закончился (3 дня)' : 'DuoWindo6601 Super Trial Expired (3 Days)')
                    : isTrialActive
                      ? (isRu ? 'DuoWindo6601 Super: Пробный период активен' : 'DuoWindo6601 Super: Trial Active')
                      : isTrialSkipped
                        ? (isRu ? 'Бесплатный DuoWindo6601 Super (3 дня) пропущен' : 'Free 3-Day Super Trial Skipped')
                        : isDeadlinePassed
                          ? (isRu ? 'Предложение закончилось 1 ноября 2026 г.' : 'Offer Ended on Nov 1, 2026')
                          : (isRu ? 'Бесплатный DuoWindo6601 Super (3 дня)' : 'Free 3-Day DuoWindo6601 Super')}
              </h3>

              {/* Status Badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {isAlreadySubscribed ? (
                  <>
                    <span className="bg-amber-400 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-sm">
                      👑 {isRu ? 'Подписка активна' : 'Active Subscription'}
                    </span>
                    <span className="bg-rose-950/80 text-rose-300 border border-rose-500/50 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      🔒 {isRu ? 'Нельзя получить Super 3 дня' : 'Cannot claim 3-day trial'}
                    </span>
                    <span className="bg-purple-500/30 text-purple-200 border border-purple-400/50 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      DuoWindo6601 {user.subscription.toUpperCase()}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="bg-amber-400 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-sm">
                      {isRu ? 'Доступно один раз' : 'Available once'}
                    </span>

                    <span className="bg-purple-500/30 text-purple-200 border border-purple-400/50 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      {isRu ? 'Срок: 3 дня' : 'Term: 3 Days'}
                    </span>

                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                      isDeadlinePassed
                        ? 'bg-red-950/80 text-red-300 border-red-500/50'
                        : 'bg-blue-500/30 text-blue-200 border-blue-400/50'
                    }`}>
                      {isRu ? 'До 1 ноября 2026 г.' : 'Until Nov 1, 2026'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Subtitle / Explanation */}
            <p className="text-xs text-purple-200/90 font-medium leading-relaxed max-w-2xl">
              {isAlreadySubscribed
                ? (isRu
                    ? `У вас уже оформлена подписка DuoWindo6601 ${user.subscription === 'max' ? 'Max' : 'Super'}! Нельзя получить бесплатный DuoWindo6601 Super 3 дня, так как у вас уже действуют все преимущества безлимитного обучения, отсутствия рекламы и бесконечной энергии.`
                    : `You already have an active DuoWindo6601 ${user.subscription === 'max' ? 'Max' : 'Super'} subscription! You cannot claim the free 3-day Super trial because unlimited access is already active on your account.`)
                : isTrialExpired
                  ? (isRu
                      ? 'Срок действия вашего 3-дневного бесплатного пробного периода завершен. Предложение действовало один раз и закончилось (акция до 1 ноября 2026 года). Оформите подписку DuoWindo6601 Super или DuoWindo6601 Max для неограниченного обучения!'
                      : 'Your 3-day free trial has expired. The offer was available once and ended (valid until Nov 1, 2026). Subscribe to DuoWindo6601 Super or Max to keep learning without limits!')
                  : isTrialActive
                    ? (isRu
                        ? `Ваш 3-дневный доступ к DuoWindo6601 Super активен (без рекламы, безлимитные сердца и энергия). Доступно 1 раз. По истечении 3 дней вы сможете оформить постоянную подписку Super или Max.`
                        : `Your 3-day Super trial is currently active with unlimited hearts, energy, and zero ads. Available once. When 3 days conclude, you can subscribe to Super or Max.`)
                    : isTrialSkipped
                      ? (isRu
                          ? 'Вы пропустили бесплатный 3-дневный Super. Предложение доступно один раз до 1 ноября 2026 года. Вы можете активировать его сейчас или сразу оформить подписку Super / Max.'
                          : 'You skipped the free 3-day Super trial. The offer is available once until Nov 1, 2026. You can activate it now or subscribe to Super / Max.')
                      : isDeadlinePassed
                        ? (isRu
                            ? 'Специальная акция на бесплатный 3-дневный Super завершилась 1 ноября 2026 года. Доступно прямое оформление подписки DuoWindo6601 Super или DuoWindo6601 Max.'
                            : 'The free 3-day Super promotion ended on November 1, 2026. Direct subscriptions to Super or Max are available below.')
                        : (isRu
                            ? 'Активируйте 3-дневный бесплатный доступ к Super режимам: без рекламы, бесконечные сердца и энергия! Предложение доступно только один раз и действует до 1 ноября 2026 года.'
                            : 'Claim your free 3-day Super access with zero ads, infinite hearts, and maximum learning velocity! Available once until Nov 1, 2026.')}
            </p>
          </div>
        </div>

        {/* ACTION BUTTONS (CLAIM / SKIP / STATUS) */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 w-full lg:w-auto">
          {/* User Already Subscribed Pill / Notice */}
          {isAlreadySubscribed && (
            <div className="px-5 py-3 rounded-2xl bg-amber-950/70 border-2 border-amber-400/80 text-amber-200 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg">
              <span>👑</span>
              <span>{isRu ? 'Подписка уже оформлена' : 'Already Subscribed'}</span>
            </div>
          )}

          {/* Active Trial Countdown Pill */}
          {isTrialActive && (
            <div className="px-5 py-3 rounded-2xl bg-emerald-950/70 border-2 border-emerald-400 text-emerald-300 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg">
              <span className="animate-spin text-sm">⏱️</span>
              <span>{isRu ? `Осталось: ${remainingText || '3 дня'}` : `Remaining: ${remainingText || '3 days'}`}</span>
            </div>
          )}

          {/* Expired Status Pill */}
          {isTrialExpired && (
            <div className="px-5 py-3 rounded-2xl bg-rose-950/70 border-2 border-rose-500/80 text-rose-300 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg">
              <span>⌛</span>
              <span>{isRu ? 'Срок закончился (3 дня)' : 'Trial Expired (3 Days)'}</span>
            </div>
          )}

          {/* Claim Button (only for free users who have not claimed yet and not deadline passed) */}
          {!isAlreadySubscribed && !user.hasClaimedSuperTrial && !isTrialExpired && !isDeadlinePassed && (
            <button
              type="button"
              onClick={handleClaimTrial}
              className="px-6 py-3.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all active:scale-95 border-b-4 border-amber-700 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🎁</span>
              <span>{isRu ? 'Получить Super (3 дня)' : 'Claim Super (3 Days)'}</span>
            </button>
          )}

          {/* Skip Button (if claimable and not skipped) */}
          {!isAlreadySubscribed && !user.hasClaimedSuperTrial && !isTrialSkipped && !isTrialExpired && !isDeadlinePassed && (
            <button
              type="button"
              onClick={handleSkipTrial}
              className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all border-b-2 border-gray-900 cursor-pointer text-center"
            >
              {isRu ? 'Пропустить предложение' : 'Skip Offer'}
            </button>
          )}

          {/* Re-activate if skipped */}
          {!isAlreadySubscribed && isTrialSkipped && !user.hasClaimedSuperTrial && !isTrialExpired && !isDeadlinePassed && (
            <button
              type="button"
              onClick={handleReconsiderTrial}
              className="px-5 py-2.5 bg-purple-800/80 hover:bg-purple-700 text-purple-200 font-black text-xs uppercase tracking-wider rounded-2xl transition-all border border-purple-500/50 cursor-pointer text-center"
            >
              {isRu ? 'Вернуть предложение (3 дня)' : 'Re-open Offer (3 Days)'}
            </button>
          )}
        </div>
      </div>

      {/* QUICK SUBSCRIPTION SECTION: SUPER VS MAX */}
      <div className="pt-4 border-t border-purple-500/30">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>⭐</span> {isRu ? 'Подписка DuoWindo6601 Super или Max:' : 'DuoWindo6601 Super or Max Subscription:'}
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase">
            {isRu ? 'Безлимитный доступ' : 'Unlimited Access'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Super Subscription Card */}
          <div className={`bg-black/50 border-2 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all shadow-md ${
            user.subscription === 'super' ? 'border-blue-400 ring-2 ring-blue-500/40' : 'border-blue-500/40 hover:border-blue-500/80'
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">⭐</span>
                <h4 className="font-extrabold text-sm text-blue-300 uppercase tracking-wide">
                  DuoWindo6601 Super
                </h4>
                {user.subscription === 'super' && (
                  <span className="bg-blue-500/30 text-blue-200 border border-blue-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    {isRu ? 'Подписка активна' : 'Active'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 font-medium mt-1">
                {isRu
                  ? 'Без рекламы, бесконечные сердца, энергия и режим повторения ошибок'
                  : 'Zero ads, infinite hearts & energy, dedicated mistake practice'}
              </p>
            </div>

            {user.subscription === 'super' ? (
              <div className="px-4 py-2 bg-blue-950/80 text-blue-300 font-black text-xs uppercase tracking-wider rounded-xl border border-blue-500/50 text-center shrink-0">
                ✓ {isRu ? 'Оформлено' : 'Subscribed'}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => upgradeSubscription('super')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer shrink-0 border-b-2 border-blue-800"
              >
                {isRu ? 'Оформить Super' : 'Subscribe Super'}
              </button>
            )}
          </div>

          {/* Max Subscription Card */}
          <div className={`bg-black/50 border-2 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all shadow-md ${
            user.subscription === 'max' ? 'border-purple-400 ring-2 ring-purple-500/40' : 'border-purple-500/40 hover:border-purple-500/80'
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">💎</span>
                <h4 className="font-extrabold text-sm text-purple-300 uppercase tracking-wide">
                  DuoWindo6601 Max
                </h4>
                {user.subscription === 'max' && (
                  <span className="bg-purple-500/30 text-purple-200 border border-purple-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    {isRu ? 'Подписка активна' : 'Active'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 font-medium mt-1">
                {isRu
                  ? 'Все функции Super + живые AI видео-звонки с совенком и разбор ответов'
                  : 'All Super perks + real-time AI Video Calls and deep answer analysis'}
              </p>
            </div>

            {user.subscription === 'max' ? (
              <div className="px-4 py-2 bg-purple-950/80 text-purple-300 font-black text-xs uppercase tracking-wider rounded-xl border border-purple-500/50 text-center shrink-0">
                ✓ {isRu ? 'Оформлено' : 'Subscribed'}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => upgradeSubscription('max')}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer shrink-0 border-b-2 border-purple-800"
              >
                {isRu ? 'Оформить Max' : 'Subscribe Max'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
