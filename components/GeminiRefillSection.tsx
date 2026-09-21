import React, { useState, useEffect } from 'react';
import { 
  SparklesIcon, 
  CheckCircleIcon, 
  GemStoneIcon, 
  LightningIcon, 
  SuperIcon, 
  MaxIcon 
} from './Icons';
import { UserProgress } from '../types';
import { 
  getTodayAiUsage, 
  refillAiRequests, 
  resetAiDailyQuota, 
  AiUsageStatus, 
  TIER_AI_CONFIG,
  canClaimFreeDailyLimit,
  claimFreeDailyLimit
} from '../services/aiLimitManager';
import { GeminiApiKeyManager } from './GeminiApiKeyManager';

interface GeminiRefillSectionProps {
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  playSound: (type: 'click' | 'correct' | 'wrong' | 'fanfare' | 'streak') => void;
  onToast?: (msg: string) => void;
}

export const GeminiRefillSection: React.FC<GeminiRefillSectionProps> = ({
  user,
  setUser,
  playSound,
  onToast
}) => {
  const isRu = (user.language || 'ru') === 'ru';
  const [usage, setUsage] = useState<AiUsageStatus>(() => getTodayAiUsage(user));
  const [showKeyManager, setShowKeyManager] = useState<boolean>(false);
  const [canClaimFree, setCanClaimFree] = useState<boolean>(() => canClaimFreeDailyLimit());

  const refreshUsage = () => {
    setUsage(getTodayAiUsage(user));
    setCanClaimFree(canClaimFreeDailyLimit());
  };

  useEffect(() => {
    refreshUsage();
    const handler = () => refreshUsage();
    window.addEventListener('duowindo_ai_limit_changed', handler);
    window.addEventListener('duowindo_api_key_changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('duowindo_ai_limit_changed', handler);
      window.removeEventListener('duowindo_api_key_changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, [user]);

  const handleBuyPackage = (amount: number, gemCost: number, label: string) => {
    if (user.gems < gemCost) {
      playSound('wrong');
      const msg = isRu 
        ? `Недостаточно кристаллов! Нужно ${gemCost} 💎, а у вас ${user.gems} 💎. Пополните кристаллы ниже!`
        : `Not enough gems! Need ${gemCost} 💎, you have ${user.gems} 💎. Get more gems below!`;
      if (onToast) onToast(msg);
      return;
    }

    playSound('fanfare');
    const newGems = user.gems - gemCost;
    setUser(prev => ({ ...prev, gems: newGems }));
    refillAiRequests(amount, setUser);

    const successMsg = isRu
      ? `⚡ Успешно! Пополнено +${amount} запросов Gemini API! Списано: ${gemCost} 💎`
      : `⚡ Success! Refilled +${amount} Gemini API requests! Spent: ${gemCost} 💎`;
    if (onToast) onToast(successMsg);
  };

  const handleResetQuota = (gemCost: number) => {
    if (user.gems < gemCost) {
      playSound('wrong');
      const msg = isRu 
        ? `Недостаточно кристаллов! Нужно ${gemCost} 💎 для сброса дневного расхода.`
        : `Not enough gems! Need ${gemCost} 💎 to reset today's quota.`;
      if (onToast) onToast(msg);
      return;
    }

    playSound('fanfare');
    setUser(prev => ({ ...prev, gems: prev.gems - gemCost }));
    resetAiDailyQuota(setUser);

    const successMsg = isRu
      ? `🔄 Дневная квота Gemini API сброшена до 0! Все запросы снова доступны!`
      : `🔄 Today's Gemini API quota reset to 0! All requests available again!`;
    if (onToast) onToast(successMsg);
  };

  const handleClaimFreeDailyBonus = () => {
    if (!canClaimFree) {
      playSound('wrong');
      if (onToast) onToast(isRu ? 'Вы уже забрали бесплатный дневной лимит сегодня!' : 'You already claimed free daily limit today!');
      return;
    }

    playSound('fanfare');
    const res = claimFreeDailyLimit(setUser);
    setCanClaimFree(canClaimFreeDailyLimit());
    refreshUsage();

    if (onToast) {
      onToast(res.message);
    }
  };

  const percentUsed = usage.limit > 0 ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;

  return (
    <div className="bg-gradient-to-br from-[#12121a] via-[#161626] to-[#0f172a] border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden my-8 text-white">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-gray-800">
        <div>
          <div className="flex items-center space-x-2 mb-1.5 flex-wrap gap-y-1">
            {/* Yellow styled Gemini Key API Account indicator */}
            <span className="bg-yellow-400 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
              <span>🔑</span>
              <span>{isRu ? 'Счёт Gemini Key API' : 'Gemini Key API Account'}</span>
            </span>

            {usage.isCustomKey ? (
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                usage.customKeyType === 'paid'
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {isRu 
                  ? (usage.customKeyType === 'paid' ? '💎 Собственный Платный Ключ (Безлимит)' : '🟢 Собственный Бесплатный Ключ (1500 RPD)')
                  : (usage.customKeyType === 'paid' ? '💎 Custom Paid Key (Unlimited)' : '🟢 Custom Free Key (1500 RPD)')}
              </span>
            ) : usage.isSkippedKey ? (
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-blue-900/40 text-blue-300 border border-blue-500/30">
                ⏭️ {isRu ? 'Ключ пропущен (Встроенный)' : 'Key Skipped (Built-in)'}
              </span>
            ) : (
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-purple-900/40 text-purple-300 border border-purple-500/30">
                ⚡ {TIER_AI_CONFIG[usage.tier]?.label}
              </span>
            )}

            {(usage.bonusRequests || 0) > 0 && (
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-black shadow-sm animate-pulse">
                +{usage.bonusRequests} {isRu ? 'бонусных запросов' : 'bonus requests'}
              </span>
            )}
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-cyan-200 uppercase tracking-tight">
            {isRu ? 'Пополнение Gemini API Key & Запросов ИИ' : 'Replenish Gemini API Key & AI Requests'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {isRu
              ? 'Получайте бесплатный дневной лимит, пополняйте пакеты запросов за кристаллы (💎) или подключите свой бесплатный/платный Gemini API Key.'
              : 'Get free daily limit, replenish AI request packages using gems (💎), or connect your own free/paid Gemini API Key.'}
          </p>
        </div>

        {/* Action button to toggle Custom API Key Manager */}
        <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-2">
          <button
            onClick={() => {
              playSound('click');
              setShowKeyManager(!showKeyManager);
            }}
            className="px-4 py-2.5 rounded-2xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-2 shadow-md hover:scale-105 active:scale-95"
          >
            <span>🔑</span>
            <span>{showKeyManager ? (isRu ? 'Скрыть настройки Ключа' : 'Hide Key Setup') : (isRu ? 'Ввести свой API Key' : 'Enter Custom API Key')}</span>
          </button>
        </div>
      </div>

      {/* Live Quota Bar with Yellow highlighted Gemini Key API counter */}
      <div className="bg-[#181824] border border-yellow-500/30 rounded-2xl p-4 sm:p-5 mb-6 shadow-inner">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center space-x-2">
            <span className="text-lg">📊</span>
            <div>
              <span className="text-xs font-black text-gray-300 uppercase tracking-wide">
                {isRu ? 'Текущий баланс запросов:' : 'Current Request Balance:'}
              </span>
              <span className="ml-2 font-mono font-bold text-cyan-300">
                {usage.remaining === 999999 ? '∞ (Безлимит)' : `${usage.remaining} доступно`}
              </span>
            </div>
          </div>

          {/* Yellow account counter for Gemini Key API */}
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/40 rounded-xl px-3 py-1.5 text-xs text-yellow-300">
            <span className="font-bold flex items-center gap-1">
              <span>🔑</span>
              <span>{isRu ? 'Счёт Gemini Key API:' : 'Gemini Key API Quota:'}</span>
            </span>
            <span className="font-mono font-black text-yellow-400">
              {usage.limit === 999999 ? '∞ (Безлимит)' : `${usage.limit} лимит`}
            </span>
          </div>

          <div className="text-xs font-mono text-gray-400">
            {isRu ? 'Расход сегодня:' : 'Used today:'}{' '}
            <span className="text-amber-400 font-bold">{usage.used}</span> / {usage.limit === 999999 ? '∞' : usage.limit}
          </div>
        </div>

        {usage.limit !== 999999 && (
          <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden p-0.5 border border-gray-700">
            <div
              className={`h-full rounded-full transition-all duration-500 shadow-sm ${
                percentUsed > 85 
                  ? 'bg-gradient-to-r from-amber-500 to-red-500' 
                  : 'bg-gradient-to-r from-yellow-400 via-amber-400 to-cyan-400'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-gray-800/80 text-[11px] text-gray-400 font-medium">
          <span className="flex items-center gap-1">
            <span>💎</span>
            <span>{isRu ? `Ваш баланс: ${user.gems} кристаллов` : `Your balance: ${user.gems} gems`}</span>
          </span>
          <span className="flex items-center gap-1 text-yellow-400/90 font-bold">
            <span>🎁</span>
            <span>{isRu ? 'Бесплатный дневной лимит обновляется каждый день!' : 'Free daily limit updates every day!'}</span>
          </span>
        </div>
      </div>

      {/* Embedded API Key Manager */}
      {showKeyManager && (
        <div className="mb-8 animate-in fade-in">
          <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-2xl p-4 mb-4">
            <h4 className="text-sm font-black text-cyan-200 uppercase tracking-wide flex items-center gap-2 mb-1">
              <span>🔑</span>
              <span>{isRu ? 'Управление Gemini API Key' : 'Gemini API Key Manager'}</span>
            </h4>
            <p className="text-xs text-gray-300">
              {isRu
                ? 'Вы можете переключиться на свой Бесплатный Gemini API Key (1500 RPD) или Платный Gemini API Key с полным безлимитом запросов.'
                : 'You can switch to your own Free Gemini API Key (1500 RPD) or Paid Gemini API Key with full unlimited queries.'}
            </p>
          </div>
          <GeminiApiKeyManager
            user={user}
            setUser={setUser}
            playSound={playSound}
            onToast={onToast}
          />
        </div>
      )}

      {/* REFILL PACKAGES GRID */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm sm:text-base font-black text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <span>⚡</span>
            <span>{isRu ? 'Пакеты пополнения Gemini ИИ за кристаллы' : 'Gemini AI Refill Packages for Gems'}</span>
          </h4>
          <span className="text-[11px] text-cyan-400 font-bold">
            {isRu ? 'Мгновенное начисление' : 'Instant Delivery'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* PACKAGE 0: FREE DAILY LIMIT */}
          <div 
            onClick={handleClaimFreeDailyBonus}
            role="button"
            tabIndex={0}
            className="rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between group shadow-xl relative overflow-hidden border-2 bg-gradient-to-b from-[#2a2410] to-[#17140a] hover:from-[#3a3014] hover:to-[#221c0c] border-yellow-400/80 hover:border-yellow-300 cursor-pointer hover:scale-[1.03] ring-1 ring-yellow-400/40"
          >
            <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-bl-xl uppercase tracking-widest shadow-sm">
              {isRu ? 'БЕСПЛАТНО' : 'FREE'}
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl transition-transform bg-yellow-400/20 text-yellow-300 group-hover:scale-110">
                  🎁
                </div>
                <span className="text-xs font-black text-yellow-300 font-mono bg-yellow-400/10 px-2.5 py-0.5 rounded-full border border-yellow-400/30">
                  +50
                </span>
              </div>
              <h5 className="font-black text-base text-yellow-200 mb-1 uppercase tracking-tight flex items-center gap-1.5">
                <span>{isRu ? 'Дневной Лимит' : 'Daily Limit'}</span>
              </h5>
              <p className="text-xs text-yellow-100/70 mb-4 font-medium">
                {isRu 
                  ? 'Бесплатный ежедневный лимит +50 запросов к Gemini API без списания кристаллов!' 
                  : 'Free daily limit bonus +50 Gemini API requests without spending gems!'}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClaimFreeDailyBonus();
              }}
              className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-md bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-black cursor-pointer"
            >
              <span>🎁 {isRu ? 'Получить 0 💎' : 'Claim 0 💎'}</span>
            </button>
          </div>

          {/* PACKAGE 1: +100 REQS */}
          <div 
            onClick={() => handleBuyPackage(100, 150, '+100 Запросов')}
            className="bg-[#191924] hover:bg-[#202030] border-2 border-cyan-500/30 hover:border-cyan-400 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.03] flex flex-col justify-between group shadow-lg relative overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-black text-xl group-hover:rotate-12 transition-transform">
                  ⚡
                </div>
                <span className="text-xs font-black text-cyan-400 font-mono bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                  +100
                </span>
              </div>
              <h5 className="font-black text-base text-white mb-1 uppercase tracking-tight">
                {isRu ? 'Пакет «Старт»' : 'Starter Pack'}
              </h5>
              <p className="text-xs text-gray-400 mb-4 font-medium">
                {isRu ? '+100 запросов к Gemini API без ожидания полуночи.' : '+100 Gemini API requests without waiting for midnight.'}
              </p>
            </div>
            <div className="w-full py-2.5 rounded-xl bg-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-black border border-cyan-500/40 text-cyan-300 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors">
              <span>150</span>
              <span>💎</span>
            </div>
          </div>

          {/* PACKAGE 2: +500 REQS (POPULAR) */}
          <div 
            onClick={() => handleBuyPackage(500, 600, '+500 Запросов')}
            className="bg-gradient-to-b from-[#1b1932] to-[#141226] hover:from-[#242045] hover:to-[#1b1932] border-2 border-purple-500/60 hover:border-purple-400 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.03] flex flex-col justify-between group shadow-xl relative overflow-hidden ring-1 ring-purple-500/30"
          >
            <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-purple-500 text-black text-[9px] font-black px-2 py-0.5 rounded-bl-xl uppercase tracking-widest shadow-sm">
              {isRu ? 'ХИТ' : 'HOT'}
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform">
                  🚀
                </div>
                <span className="text-xs font-black text-purple-300 font-mono bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-500/40">
                  +500
                </span>
              </div>
              <h5 className="font-black text-base text-purple-200 mb-1 uppercase tracking-tight flex items-center gap-1.5">
                <span>{isRu ? 'Пакет «Прорыв»' : 'Pro Booster'}</span>
              </h5>
              <p className="text-xs text-purple-200/70 mb-4 font-medium">
                {isRu ? '+500 запросов для комфортных занятий и чата с ИИ.' : '+500 requests for extensive study and AI chatting.'}
              </p>
            </div>
            <div className="w-full py-2.5 rounded-xl bg-purple-600 group-hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-md">
              <span>600</span>
              <span>💎</span>
            </div>
          </div>

          {/* PACKAGE 3: +2500 REQS (MEGA) */}
          <div 
            onClick={() => handleBuyPackage(2500, 2000, '+2500 Запросов')}
            className="bg-gradient-to-b from-[#132238] to-[#0f172a] hover:from-[#1a2f4d] hover:to-[#132238] border-2 border-amber-400/50 hover:border-amber-300 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.03] flex flex-col justify-between group shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-amber-400 text-black text-[9px] font-black px-2 py-0.5 rounded-bl-xl uppercase tracking-widest shadow-sm">
              {isRu ? 'ВЫГОДА' : 'MAX'}
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-black text-xl group-hover:rotate-12 transition-transform">
                  👑
                </div>
                <span className="text-xs font-black text-amber-300 font-mono bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/40">
                  +2500
                </span>
              </div>
              <h5 className="font-black text-base text-amber-200 mb-1 uppercase tracking-tight">
                {isRu ? 'Мега-Пакет' : 'Mega Quota'}
              </h5>
              <p className="text-xs text-amber-100/70 mb-4 font-medium">
                {isRu ? '+2500 запросов Gemini Pro для максимальных результатов.' : '+2500 Gemini Pro requests for top learning.'}
              </p>
            </div>
            <div className="w-full py-2.5 rounded-xl bg-amber-400 group-hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-md">
              <span>2000</span>
              <span>💎</span>
            </div>
          </div>

          {/* PACKAGE 4: RESET DAILY QUOTA */}
          <div 
            onClick={() => handleResetQuota(250)}
            className="bg-[#171b26] hover:bg-[#1f2433] border-2 border-emerald-500/40 hover:border-emerald-400 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.03] flex flex-col justify-between group shadow-lg relative overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black text-xl group-hover:rotate-180 transition-transform duration-500">
                  🔄
                </div>
                <span className="text-xs font-black text-emerald-300 font-mono bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {isRu ? 'СБРОС' : 'RESET'}
                </span>
              </div>
              <h5 className="font-black text-base text-emerald-200 mb-1 uppercase tracking-tight">
                {isRu ? 'Обнулить расход' : 'Reset Spent Quota'}
              </h5>
              <p className="text-xs text-gray-400 mb-4 font-medium">
                {isRu ? 'Мгновенно обнуляет потраченные сегодня запросы до 0!' : 'Instantly resets your spent queries today back to 0!'}
              </p>
            </div>
            <div className="w-full py-2.5 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-black border border-emerald-500/40 text-emerald-300 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors">
              <span>250</span>
              <span>💎</span>
            </div>
          </div>

        </div>
      </div>

      {/* DAILY FREE BONUS GIFT BANNER */}
      <div className="bg-gradient-to-r from-yellow-500/20 via-amber-500/15 to-purple-500/20 border-2 border-yellow-400/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-2xl shrink-0 shadow-inner">
            🎁
          </div>
          <div>
            <h5 className="font-black text-sm sm:text-base text-yellow-300 uppercase tracking-tight flex items-center gap-2">
              <span>{isRu ? 'Получить Бесплатный Дневной Лимит (+50 Запросов)' : 'Get Free Daily Limit (+50 Requests)'}</span>
              {canClaimFree && (
                <span className="text-[10px] font-black bg-yellow-400 text-black px-2 py-0.5 rounded-full animate-bounce">
                  {isRu ? 'ДОСТУПНО' : 'AVAILABLE'}
                </span>
              )}
            </h5>
            <p className="text-xs text-gray-300">
              {isRu
                ? 'Забирайте бесплатный дневной лимит каждый день! Добавляет +50 запросов к балансу без списания кристаллов.'
                : 'Claim your free daily limit every day! Adds +50 requests to your quota without spending any gems.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleClaimFreeDailyBonus}
          disabled={!canClaimFree}
          className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5 ${
            !canClaimFree
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
              : 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-300 text-black shadow-xl hover:scale-105 active:scale-95 ring-2 ring-yellow-400/50'
          }`}
        >
          <span>{!canClaimFree ? '✓' : '🎁'}</span>
          <span>{!canClaimFree ? (isRu ? 'Получено сегодня' : 'Claimed Today') : (isRu ? 'Получить Бесплатный Лимит' : 'Get Free Daily Limit')}</span>
        </button>
      </div>
    </div>
  );
};
