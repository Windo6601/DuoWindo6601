import React, { useState } from 'react';
import { SparklesIcon, SuperIcon, MaxIcon, CheckCircleIcon } from './Icons';
import { getTodayAiUsage, TIER_AI_CONFIG } from '../services/aiLimitManager';
import { UserProgress } from '../types';
import { GeminiApiKeyManager } from './GeminiApiKeyManager';
import { GeminiRefillSection } from './GeminiRefillSection';

interface AiLimitSectionProps {
  user: UserProgress;
  setUser?: React.Dispatch<React.SetStateAction<UserProgress>>;
  onOpenLimitModal: () => void;
  onUpgrade: (tier: 'super' | 'max') => void;
  playSound: (type: 'click' | 'correct' | 'wrong' | 'fanfare' | 'streak') => void;
  onToast?: (msg: string) => void;
  defaultTab?: 'limits' | 'store' | 'refill';
}

export const AiLimitSection: React.FC<AiLimitSectionProps> = ({
  user,
  setUser,
  onOpenLimitModal,
  onUpgrade,
  playSound,
  onToast,
  defaultTab = 'limits'
}) => {
  const usage = getTodayAiUsage(user);
  const isRu = (user.language || 'ru') === 'ru';
  const tier = user.subscription || 'free';
  const percentUsed = Math.min(100, Math.round((usage.used / usage.limit) * 100));
  const [activeTab, setActiveTab] = useState<'limits' | 'store' | 'refill'>(defaultTab);

  return (
    <div className="bg-[#14141c] border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden my-6 text-white">
      
      {/* Glow ambient background */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Tabs: Limits vs Refill vs Store */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-800">
        <div className="flex flex-wrap items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-purple-500/30">
          <button
            onClick={() => {
              playSound('click');
              setActiveTab('limits');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'limits'
                ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>📊</span>
            <span>{isRu ? 'Тарифы DuoWindo' : 'DuoWindo Tiers'}</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setActiveTab('refill');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'refill'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>⚡</span>
            <span>{isRu ? 'Пополнить Gemini API' : 'Refill Gemini API'}</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setActiveTab('store');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'store'
                ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-lg font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>🔑</span>
            <span>{isRu ? 'Счёт Gemini Key API' : 'Gemini Key API Account'}</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {usage.isCustomKey ? (
            <span className="bg-yellow-400 text-black text-[10px] font-black px-2.5 py-1 rounded-full border border-yellow-300 shadow-sm flex items-center gap-1">
              <span>🔑</span>
              <span>
                {isRu 
                  ? (usage.customKeyType === 'paid' ? 'Счёт Gemini Key API: Платный (Безлимит)' : 'Счёт Gemini Key API: Бесплатный (1500 RPD)')
                  : (usage.customKeyType === 'paid' ? 'Gemini Key API: Paid (Unlimited)' : 'Gemini Key API: Free (1500 RPD)')}
              </span>
            </span>
          ) : usage.isSkippedKey ? (
            <span className="bg-yellow-400 text-black border border-yellow-300 text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
              <span>🔑</span>
              <span>{isRu ? 'Счёт Gemini Key API: Пропущен' : 'Gemini Key API: Skipped'}</span>
            </span>
          ) : (
            <span className="bg-yellow-400 text-black border border-yellow-300 text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
              <span>🔑</span>
              <span>{isRu ? `Счёт Gemini Key API: ${TIER_AI_CONFIG[tier]?.label || 'Базовый'}` : `Gemini Key API: ${TIER_AI_CONFIG[tier]?.label || 'Base'}`}</span>
            </span>
          )}

          <button
            onClick={() => {
              playSound('click');
              onOpenLimitModal();
            }}
            className="px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/50 text-purple-200 font-bold text-xs transition-all flex items-center space-x-1 shadow-md"
          >
            <SparklesIcon className="w-3.5 h-3.5 text-amber-300" />
            <span>{isRu ? 'Инфо' : 'Info'}</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT: REFILL (GEMINI BONUS REQUESTS & PACKAGES) */}
      {activeTab === 'refill' && (
        <div className="animate-in fade-in">
          <GeminiRefillSection
            user={user}
            setUser={setUser}
            playSound={playSound}
            onToast={onToast}
          />
        </div>
      )}

      {/* TAB CONTENT: STORE (GEMINI API KEY) */}
      {activeTab === 'store' && (
        <div className="animate-in fade-in">
          <div className="mb-4 bg-cyan-950/30 border border-cyan-500/30 rounded-2xl p-4">
            <h4 className="text-base font-black text-cyan-300 uppercase tracking-wide flex items-center gap-2 mb-1">
              <span>🏪</span>
              <span>{isRu ? 'Раздел Магазин: Установка Gemini API Key' : 'Shop: Setup Gemini API Key'}</span>
            </h4>
            <p className="text-xs text-gray-300">
              {isRu
                ? 'Здесь вы можете выбрать Бесплатный Key API (лимит 1500 RPD) или Платный Key API (полный безлимит), протестировать соединение с Gemini 3.6 Flash и переключаться между ними в один клик.'
                : 'Here you can select Free Key API (1500 RPD limit) or Paid Key API (unlimited), test the connection with Gemini 3.6 Flash, and switch between them in one click.'}
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

      {/* TAB CONTENT: LIMITS */}
      {activeTab === 'limits' && (
        <div className="animate-in fade-in">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-purple-200 to-cyan-200 uppercase tracking-tight">
              {isRu ? 'Раздел Лимит Подписки и Бесплатного Тарифа' : 'Subscription & Free Plan Limits Section'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {isRu
                ? 'Квоты Gemini API Key для Бесплатного тарифа (250/день), DuoWindo6601 Super (1000/день), DuoWindo6601 Max (5000/день) или собственный API Key.'
                : 'Gemini API Key quotas for Free tier (250/day), DuoWindo6601 Super (1000/day), DuoWindo6601 Max (5000/day), or custom API Key.'}
            </p>
          </div>

      {/* Live Current User Meter */}
      <div className="bg-[#1c1c28] border border-purple-500/30 rounded-2xl p-4 sm:p-5 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {isRu ? 'Ваш текущий лимит на сегодня:' : 'Your limit today:'}
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase border ${TIER_AI_CONFIG[tier].badgeColor}`}>
              {TIER_AI_CONFIG[tier].label}
            </span>
            {usage.isCustomKey && (
              <span className="text-[10px] bg-black/40 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-mono">
                {usage.customKeyMasked}
              </span>
            )}
          </div>
          <div className="text-sm font-black font-mono">
            <span className="text-amber-400">{usage.used}</span>
            <span className="text-gray-500"> / </span>
            <span className="text-cyan-400">
              {usage.customKeyType === 'paid' ? '∞' : usage.limit} {isRu ? 'запросов' : 'requests'}
            </span>
            {usage.customKeyType !== 'paid' && (
              <span className="text-xs text-gray-400 ml-2">({percentUsed}%)</span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-gray-700/80 mb-2">
          <div
            className="bg-gradient-to-r from-amber-500 via-purple-500 to-cyan-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${usage.customKeyType === 'paid' ? 10 : percentUsed}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-400 font-medium gap-2">
          <span>
            {usage.customKeyType === 'paid' ? (
              <span className="text-cyan-300 font-bold flex items-center gap-1">
                <span>💎</span> {isRu ? 'Платный собственный API Key: Полный безлимит запросов' : 'Paid Custom API Key: Unlimited requests'}
              </span>
            ) : usage.canUse ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span>🟢</span> {isRu ? `Доступно еще ${usage.remaining} запросов` : `${usage.remaining} requests remaining`}
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span>⚠️</span> {isRu ? 'Дневной лимит исчерпан. Офлайн-режим активен.' : 'Daily limit reached. Offline mode active.'}
              </span>
            )}
          </span>
          <span className="text-gray-500">
            ⏱️ {isRu ? 'Сброс счетчика в 00:00 UTC' : 'Resets at 00:00 UTC'}
          </span>
        </div>
      </div>

      {/* Plan Limits Grid Comparison */}
      <div className="grid sm:grid-cols-3 gap-4">
        
        {/* FREE PLAN */}
        <div className={`rounded-2xl p-4 border flex flex-col justify-between transition-all ${
          tier === 'free'
            ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/30'
            : 'bg-[#181824] border-gray-800 hover:border-gray-700'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                Бесплатно Тариф DuoWindo6601
              </span>
              {tier === 'free' && (
                <span className="bg-amber-500/20 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-500/40 uppercase">
                  Ваш тариф
                </span>
              )}
            </div>
            <div className="text-3xl font-black text-white mb-1 font-mono">
              250 <span className="text-xs font-normal text-gray-400">запр/день</span>
            </div>
            <p className="text-xs text-amber-400/90 mb-3 font-medium">
              {isRu ? 'Бесплатный лимит Gemini API Key' : 'Free Gemini API Key limit'}
            </p>
            <ul className="text-xs space-y-1.5 text-gray-300 border-t border-gray-800/80 pt-3">
              <li className="flex items-center gap-1.5"><CheckCircleIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" /> 250 ИИ-запросов (Gemini 3 Flash)</li>
              <li className="flex items-center gap-1.5"><CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Проверка уроков и переводчик</li>
              <li className="flex items-center gap-1.5"><CheckCircleIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> Озвучка вопросов и фраз</li>
              <li className="flex items-center gap-1.5 text-gray-400"><span className="text-gray-600">❌</span> Стандартная энергия</li>
            </ul>
          </div>
        </div>

        {/* SUPER PLAN */}
        <div className={`rounded-2xl p-4 border flex flex-col justify-between transition-all relative ${
          tier === 'super'
            ? 'bg-purple-950/40 border-purple-400 ring-2 ring-purple-500/40 shadow-lg'
            : 'bg-purple-950/20 border-purple-500/30 hover:border-purple-400/60'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-purple-300 italic flex items-center">
                <SuperIcon className="w-3.5 h-3.5 mr-1 text-purple-300" /> Платно DuoWindo6601 Super
              </span>
              {tier === 'super' ? (
                <span className="bg-purple-500/30 text-purple-200 text-[9px] font-black px-1.5 py-0.5 rounded border border-purple-400 uppercase">
                  Ваш тариф
                </span>
              ) : (
                <span className="bg-purple-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                  Популярно
                </span>
              )}
            </div>
            <div className="text-3xl font-black text-purple-200 mb-1 font-mono">
              1000 <span className="text-xs font-normal text-purple-300/70">запр/день</span>
            </div>
            <p className="text-xs text-purple-300/80 mb-3 font-medium">
              {isRu ? 'Приоритетный лимит Gemini API Key' : 'Priority Gemini API Key limit'}
            </p>
            <ul className="text-xs space-y-1.5 text-purple-100 border-t border-purple-800/50 pt-3">
              <li className="flex items-center gap-1.5"><CheckCircleIcon className="w-3.5 h-3.5 text-purple-300 shrink-0" /> 1000 ИИ-запросов (Gemini 3 Flash)</li>
              <li className="flex items-center gap-1.5"><CheckCircleIcon className="w-3.5 h-3.5 text-yellow-300 shrink-0" /> Бесконечная энергия & Без рекламы</li>
              <li className="flex items-center gap-1.5"><CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Интерактивный Ролевой ИИ-Чат</li>
              <li className="flex items-center gap-1.5"><CheckCircleIcon className="w-3.5 h-3.5 text-cyan-300 shrink-0" /> Ускоренное обучение</li>
            </ul>
          </div>
          {tier !== 'super' && tier !== 'max' && (
            <button
              onClick={() => {
                playSound('fanfare');
                onUpgrade('super');
              }}
              className="mt-4 w-full py-2.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white text-xs uppercase tracking-wider transition-all shadow-md"
            >
              {isRu ? 'Подключить Super ↗' : 'Upgrade to Super ↗'}
            </button>
          )}
        </div>

        {/* MAX PLAN */}
        <div className={`rounded-2xl p-4 border flex flex-col justify-between transition-all relative ${
          tier === 'max'
            ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-500/40 shadow-lg'
            : 'bg-cyan-950/20 border-cyan-500/30 hover:border-cyan-400/60'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-cyan-300 italic flex items-center">
                <MaxIcon className="w-3.5 h-3.5 mr-1 text-cyan-300" /> Платно DuoWindo6601 Max
              </span>
              {tier === 'max' ? (
                <span className="bg-cyan-500/30 text-cyan-200 text-[9px] font-black px-1.5 py-0.5 rounded border border-cyan-400 uppercase">
                  Ваш тариф
                </span>
              ) : (
                <span className="bg-cyan-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                  Максимум
                </span>
              )}
            </div>
            <div className="text-3xl font-black text-cyan-200 mb-1 font-mono">
              5000 <span className="text-xs font-normal text-cyan-300/70">запр/день</span>
            </div>
            <p className="text-xs text-cyan-300/80 mb-3 font-medium">
              {isRu ? 'Максимальный лимит Gemini 3 Pro' : 'Maximum Gemini 3 Pro limit'}
            </p>
            <ul className="text-xs space-y-1.5 text-cyan-100 border-t border-cyan-800/50 pt-3">
              <li className="flex items-center gap-1.5"><CheckCircleIcon className="w-3.5 h-3.5 text-cyan-300 shrink-0" /> 5000 ИИ-запросов (Gemini 3 Pro)</li>
              <li className="flex items-center gap-1.5"><CheckCircleIcon className="w-3.5 h-3.5 text-cyan-300 shrink-0" /> Глубокий ИИ-разбор ошибок и речи</li>
              <li className="flex items-center gap-1.5"><CheckCircleIcon className="w-3.5 h-3.5 text-cyan-300 shrink-0" /> ИИ-Шахматы и продвинутый анализ</li>
              <li className="flex items-center gap-1.5"><CheckCircleIcon className="w-3.5 h-3.5 text-amber-300 shrink-0" /> Все возможности Super</li>
            </ul>
          </div>
          {tier !== 'max' && (
            <button
              onClick={() => {
                playSound('fanfare');
                onUpgrade('max');
              }}
              className="mt-4 w-full py-2.5 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white text-xs uppercase tracking-wider transition-all shadow-md"
            >
              {isRu ? 'Подключить Max ↗' : 'Upgrade to Max ↗'}
            </button>
          )}
        </div>

      </div>
        </div>
      )}

    </div>
  );
};
