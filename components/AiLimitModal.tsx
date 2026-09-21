import React from 'react';
import { CloseIcon, SparklesIcon, SuperIcon, MaxIcon, InfiniteEnergyIcon, CheckCircleIcon } from './Icons';
import { AiUsageStatus, TIER_AI_CONFIG, setSkipCustomApiKey, claimFreeDailyLimit } from '../services/aiLimitManager';
import { SubscriptionTier } from '../types';

export interface AiLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: AiUsageStatus | null;
  currentSubscription: SubscriptionTier;
  onUpgrade: (tier: 'super' | 'max') => void;
  language?: string;
  playSound: (type: 'click' | 'correct' | 'wrong' | 'fanfare' | 'streak') => void;
}

export const AiLimitModal: React.FC<AiLimitModalProps> = ({
  isOpen,
  onClose,
  status,
  currentSubscription,
  onUpgrade,
  language = 'ru',
  playSound
}) => {
  if (!isOpen) return null;

  const isRu = language === 'ru';
  const tier = currentSubscription || status?.tier || 'free';
  const used = status?.used || 0;
  const limit = status?.limit || TIER_AI_CONFIG[tier]?.dailyLimit || 250;
  const percentUsed = Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="fixed inset-0 z-[220] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#141418] border-2 border-purple-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden my-auto text-white">
        
        {/* Background glow effects */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close button */}
        <button
          onClick={() => {
            playSound('click');
            onClose();
          }}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-20"
          title={isRu ? 'Закрыть' : 'Close'}
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-purple-500/20 to-cyan-500/20 border border-purple-400/30 mb-3 shadow-inner relative">
            <SparklesIcon className="w-10 h-10 text-amber-400 animate-pulse" />
            <div className="absolute -bottom-1 -right-1 bg-purple-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-300">
              AI
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-purple-300 to-cyan-300 uppercase">
            {isRu ? 'Дневной лимит Gemini ИИ исчерпан' : 'Gemini AI Daily Limit Reached'}
          </h2>
          <p className="text-sm text-gray-300 font-medium mt-1 max-w-md mx-auto">
            {isRu
              ? `Вы израсходовали лимит ИИ-запросов (${used}/${limit}) на сегодня для вашего текущего тарифа.`
              : `You have reached your daily AI query quota (${used}/${limit}) for your current plan.`}
          </p>
        </div>

        {/* Progress Bar of Daily Quota */}
        <div className="bg-[#1c1c24] border border-gray-800 rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-center text-xs font-bold mb-2">
            <span className="text-gray-400 uppercase tracking-wider">
              {isRu ? 'Использовано сегодня:' : 'Used today:'}
            </span>
            <span className="text-amber-400 font-mono">
              {used} / {limit} {isRu ? 'запросов' : 'requests'} ({percentUsed}%)
            </span>
          </div>
          <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden p-0.5 border border-gray-700">
            <div
              className="bg-gradient-to-r from-amber-500 via-purple-500 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${percentUsed}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-gray-400 text-center mt-2 font-medium">
            ⏱️ {isRu ? 'Лимит обновится ровно в полночь (00:00)' : 'Limit resets at midnight (00:00)'}
          </p>
        </div>

        {/* Tier Comparison Cards */}
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          
          {/* FREE TIER CARD */}
          <div className={`rounded-2xl p-3.5 border flex flex-col justify-between ${
            tier === 'free' 
              ? 'bg-gray-900/90 border-amber-500/60 shadow-md ring-1 ring-amber-500/30' 
              : 'bg-[#181820] border-gray-800 opacity-75'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-gray-300 uppercase tracking-wider">Бесплатно Тариф</span>
                {tier === 'free' && (
                  <span className="bg-amber-500/20 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-500/40 uppercase">
                    Текущий
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-white mb-2 font-mono">
                {TIER_AI_CONFIG.free.dailyLimit} <span className="text-xs font-normal text-gray-400">запр/день</span>
              </div>
              <ul className="text-[11px] space-y-1.5 text-gray-300">
                <li className="flex items-center"><span className="mr-1 text-amber-400">⚡</span> 250 Gemini API Key запросов</li>
                <li className="flex items-center"><span className="mr-1 text-emerald-400">✓</span> Проверка уроков и переводчик</li>
                <li className="flex items-center"><span className="mr-1 text-gray-500">❌</span> Ограниченная энергия</li>
              </ul>
            </div>
          </div>

          {/* SUPER TIER CARD */}
          <div className={`rounded-2xl p-3.5 border flex flex-col justify-between relative ${
            tier === 'super' 
              ? 'bg-gradient-to-b from-purple-950 to-indigo-950 border-purple-400 ring-2 ring-purple-500/50 shadow-xl' 
              : 'bg-gradient-to-b from-purple-950/40 to-indigo-950/40 border-purple-500/30 hover:border-purple-400/60'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-purple-300 italic flex items-center">
                  <SuperIcon className="w-3.5 h-3.5 mr-1 text-purple-300" /> DuoWindo6601 Super
                </span>
                {tier === 'super' ? (
                  <span className="bg-purple-500/30 text-purple-200 text-[9px] font-black px-1.5 py-0.5 rounded border border-purple-400 uppercase">
                    Текущий
                  </span>
                ) : (
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                    Популярно
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-purple-200 mb-2 font-mono">
                {TIER_AI_CONFIG.super.dailyLimit} <span className="text-xs font-normal text-purple-300/70">запр/день</span>
              </div>
              <ul className="text-[11px] space-y-1.5 text-purple-100">
                <li className="flex items-center"><span className="mr-1 text-yellow-300">⚡</span> 1000 Gemini API Key запросов</li>
                <li className="flex items-center"><span className="mr-1 text-emerald-400">✓</span> Без рекламы</li>
                <li className="flex items-center"><span className="mr-1 text-yellow-400">♾️</span> Бесконечная энергия & Чат</li>
              </ul>
            </div>
          </div>

          {/* MAX TIER CARD */}
          <div className={`rounded-2xl p-3.5 border flex flex-col justify-between relative ${
            tier === 'max' 
              ? 'bg-gradient-to-b from-cyan-950 to-blue-950 border-cyan-400 ring-2 ring-cyan-500/50 shadow-xl' 
              : 'bg-gradient-to-b from-cyan-950/40 to-blue-950/40 border-cyan-500/30 hover:border-cyan-400/60'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-cyan-300 italic flex items-center">
                  <MaxIcon className="w-3.5 h-3.5 mr-1 text-cyan-300" /> DuoWindo6601 Max
                </span>
                {tier === 'max' ? (
                  <span className="bg-cyan-500/30 text-cyan-200 text-[9px] font-black px-1.5 py-0.5 rounded border border-cyan-400 uppercase">
                    Текущий
                  </span>
                ) : (
                  <span className="bg-cyan-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                    Максимум
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-cyan-200 mb-2 font-mono">
                {TIER_AI_CONFIG.max.dailyLimit} <span className="text-xs font-normal text-cyan-300/70">запр/день</span>
              </div>
              <ul className="text-[11px] space-y-1.5 text-cyan-100">
                <li className="flex items-center"><span className="mr-1 text-cyan-300">🚀</span> 5000 Gemini API Pro запросов</li>
                <li className="flex items-center"><span className="mr-1 text-cyan-300">💡</span> ИИ Разбор всех ответов</li>
                <li className="flex items-center"><span className="mr-1 text-cyan-300">💬</span> Ролевой ИИ-Чат и Шахматы</li>
              </ul>
            </div>
          </div>

        </div>

        {/* Upgrade Action Buttons */}
        <div className="space-y-2.5">
          {tier !== 'max' && (
            <button
              onClick={() => {
                playSound('fanfare');
                onUpgrade(tier === 'free' ? 'super' : 'max');
              }}
              className="w-full py-3.5 px-6 rounded-2xl font-black bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 hover:from-purple-400 hover:to-cyan-300 text-white shadow-xl border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1 transition-all text-sm uppercase tracking-wider flex items-center justify-center space-x-2"
            >
              <SparklesIcon className="w-5 h-5 text-yellow-300 animate-spin" />
              <span>
                {tier === 'free'
                  ? (isRu ? 'ПОДКЛЮЧИТЬ SUPER (1000 ЗАПРОСОВ В ДЕНЬ)' : 'UPGRADE TO SUPER (1000 REQS/DAY)')
                  : (isRu ? 'ПЕРЕЙТИ НА MAX (5000 ЗАПРОСОВ + GEMINI PRO)' : 'UPGRADE TO MAX (5000 REQS + PRO)')}
              </span>
            </button>
          )}

          {tier === 'free' && (
            <button
              onClick={() => {
                playSound('fanfare');
                onUpgrade('max');
              }}
              className="w-full py-3 px-6 rounded-2xl font-bold bg-[#1e1e28] hover:bg-[#282836] text-cyan-300 border-2 border-cyan-500/50 transition-all text-xs uppercase tracking-wider flex items-center justify-center space-x-2"
            >
              <MaxIcon className="w-4 h-4 text-cyan-400" />
              <span>{isRu ? 'Получить Максимум с DuoWindo6601 Max (5000 запросов/день)' : 'Get DuoWindo6601 Max (5000 reqs/day)'}</span>
            </button>
          )}

          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="w-full py-2.5 text-center text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider"
          >
            {isRu ? 'Продолжить уроки в офлайн-режиме' : 'Continue in Offline Cache Mode'}
          </button>
        </div>

      </div>
    </div>
  );
};
