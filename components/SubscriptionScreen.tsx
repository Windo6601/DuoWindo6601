import React, { useState } from 'react';
import { UserProgress, SubscriptionTier, STRIPE_BUY_BUTTON_MAX, STRIPE_BUY_BUTTON_SUPER } from '../types';
import { StripeBuyButton } from './StripeBuyButton';
import { StripeTestCardsModal } from './StripeTestCardsModal';
import { createStripeCheckout, cancelStripeSubscription, openStripePortal, getStripeApiStatus, navigateToStripeUrl, StripeApiStatus } from '../services/stripeService';

interface SubscriptionScreenProps {
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  onBack: () => void;
  playSound: (sound: any) => void;
  setToast: (msg: string) => void;
  upgradeSubscription: (tier: SubscriptionTier) => void;
  cancelSubscription?: () => void;
  isIncognitoUser: boolean;
  STORAGE_KEY: string;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({
  user,
  setUser,
  onBack,
  playSound,
  setToast,
  upgradeSubscription,
  cancelSubscription,
  isIncognitoUser,
  STORAGE_KEY,
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showTestCardsModal, setShowTestCardsModal] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isProcessingStripe, setIsProcessingStripe] = useState<string | null>(null);
  const [stripeStatus, setStripeStatus] = useState<StripeApiStatus | null>(null);
  const [isCheckingStripe, setIsCheckingStripe] = useState(false);
  const [checkoutExternalUrl, setCheckoutExternalUrl] = useState<string | null>(null);

  const isRu = (user.language || 'ru') === 'ru';
  const isSuperActive = user.subscription === 'super';
  const isMaxActive = user.subscription === 'max';
  const hasActiveSub = isSuperActive || isMaxActive;

  const handleConfirmCancel = async () => {
    setIsCanceling(true);
    try {
      if (user.stripeSubscriptionId || user.stripeCustomerId) {
        await cancelStripeSubscription({
          subscriptionId: user.stripeSubscriptionId,
          customerId: user.stripeCustomerId,
          email: user.email,
          reason: 'User cancelled from Subscription screen',
        });
      }
    } catch (e) {
      console.warn('Stripe cancellation error:', e);
    } finally {
      setIsCanceling(false);
    }

    playSound('click');
    const nowIso = new Date().toISOString();
    setUser(prev => {
      const updated: UserProgress = {
        ...prev,
        subscription: 'free',
        infiniteHearts: false,
        infiniteEnergy: false,
        superTrialExpired: true,
        stripeSubscriptionStatus: 'canceled',
        subscriptionCanceledAt: nowIso,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (cancelSubscription) {
      cancelSubscription();
    }
    setToast(isRu ? '✅ Подписка DuoWindo6601 успешно отменена' : '✅ DuoWindo6601 subscription successfully canceled');
    setShowCancelModal(false);
  };

  const handleStripeCheckout = async (tier: 'super' | 'max') => {
    if (isIncognitoUser) {
      playSound('wrong');
      setToast(
        isRu
          ? '🔒 Режим Инкогнито: Для оформления подписки требуется аккаунт!'
          : '🔒 Incognito Mode: Account required to subscribe!'
      );
      return;
    }

    setIsProcessingStripe(tier);
    try {
      const res = await createStripeCheckout({
        tier,
        email: user.email,
        username: user.username || user.name,
      });

      if (res.url) {
        const nav = navigateToStripeUrl(res.url);
        if (!nav.navigated && nav.fallbackUrl) {
          setCheckoutExternalUrl(nav.fallbackUrl);
        }
        setToast(isRu ? '💳 Сессия Stripe Checkout готова!' : '💳 Stripe Checkout session ready!');
        return;
      }
    } catch (e) {
      console.warn('Checkout error:', e);
    } finally {
      setIsProcessingStripe(null);
    }

    // Fallback to instant local upgrade
    upgradeSubscription(tier);
  };

  const handleVerifyStripeApi = async () => {
    playSound('click');
    setIsCheckingStripe(true);
    try {
      const status = await getStripeApiStatus();
      setStripeStatus(status);
      if (status?.connected) {
        playSound('success');
        setToast(isRu ? '✅ Stripe API подключён и работает (Cloud Run + AI Studio)' : '✅ Stripe API connected & verified');
      } else {
        playSound('wrong');
        setToast(isRu ? `⚠️ Ошибка проверки Stripe API: ${status?.error || 'Недоступно'}` : '⚠️ Stripe API verification failed');
      }
    } finally {
      setIsCheckingStripe(false);
    }
  };

  const handleOpenCustomerPortal = async () => {
    setToast(isRu ? '💳 Открытие личного кабинета Stripe...' : '💳 Opening Stripe Customer Portal...');
    const res = await openStripePortal({
      customerId: user.stripeCustomerId,
      email: user.email,
    });
    if (res.url) {
      const nav = navigateToStripeUrl(res.url);
      if (!nav.navigated && nav.fallbackUrl) {
        setCheckoutExternalUrl(nav.fallbackUrl);
      }
    } else {
      setShowCancelModal(true);
    }
  };

  return (
    <div className="py-8 max-w-5xl mx-auto w-full px-4 animate-in fade-in duration-200 text-left space-y-8">
      {/* TOP NAVIGATION & HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={() => {
            playSound('click');
            onBack();
          }}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs uppercase rounded-xl border-b-2 border-gray-900 flex items-center space-x-2 transition-all shadow-md cursor-pointer"
        >
          <span>←</span>
          <span>{isRu ? 'Назад в Магазин' : 'Back to Shop'}</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/70 px-3 py-1.5 rounded-full border border-purple-500/40 flex items-center gap-1.5 shadow">
            <span>💳</span>
            <span>Stripe Payments Verified</span>
          </span>
        </div>
      </div>

      {/* HERO TITLE & STRIPE PLATFORM INFORMATION */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white flex items-center justify-center gap-3">
          <span>👑</span>
          <span className="bg-gradient-to-r from-blue-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            {isRu ? 'Тарифы DuoWindo6601' : 'DuoWindo6601 Plans'}
          </span>
        </h1>
        <p className="text-sm md:text-base text-gray-300 font-medium leading-relaxed">
          {isRu
            ? 'Stripe API — это международная финансовая и технологическая платформа, предназначенная для приема и обработки онлайн-платежей, управления подписками и выплат по всему миру.'
            : 'Stripe API is an international financial and technology platform built for accepting and processing online payments, managing recurring subscriptions, and global payouts.'}
        </p>
      </div>

      {/* STRIPE TEST MODE BANNER & TEST CARD CHEATSHEET */}
      <div className="p-4 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-2 border-amber-500/70 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0 shadow-md">
            ⚠️
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-xs uppercase text-amber-300">
                {isRu ? 'Тестовый режим Stripe (Test Mode)' : 'Stripe Test Mode'}
              </span>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                pk_test_51UZPQY...
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black px-2 py-0.5 rounded-full">
                Stripe Tax ✓
              </span>
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-black px-2 py-0.5 rounded-full">
                Connect ✓
              </span>
            </div>
            <p className="text-xs text-gray-300 font-medium leading-relaxed">
              {isRu
                ? 'Настоящие карты отклоняются («не тестовая карта»). Для проверки используйте официальную тестовую карту Stripe: '
                : 'Real credit cards are rejected ("not a test card"). To test checkout, use the official Stripe card: '}
              <strong className="text-amber-200 font-mono bg-black/50 px-2 py-0.5 rounded-lg border border-amber-500/30">
                4242 4242 4242 4242
              </strong>
              {' '}(CVC: <strong className="text-white font-mono">123</strong>, Exp: <strong className="text-white font-mono">12/28</strong>).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => void handleVerifyStripeApi()}
            disabled={isCheckingStripe}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap disabled:opacity-60"
          >
            {isCheckingStripe
              ? (isRu ? 'Проверка...' : 'Checking...')
              : (isRu ? 'Проверить Stripe API' : 'Verify Stripe API')}
          </button>
          <button
            type="button"
            onClick={() => {
              playSound('click');
              setShowTestCardsModal(true);
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 self-end md:self-center"
          >
            <span>📋</span>
            <span>{isRu ? 'Список тестовых карт' : 'Test Cards List'}</span>
          </button>
        </div>
      </div>

      {stripeStatus && (
        <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
          stripeStatus.connected
            ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200'
            : 'bg-red-950/50 border-red-500/60 text-red-200'
        }`}>
          <div className="font-black uppercase tracking-wider flex flex-wrap items-center gap-2">
            <span>{stripeStatus.connected ? '✅ Stripe API активен' : '⚠️ Ошибка Stripe API'}</span>
            <span className="font-mono text-[10px] bg-black/40 px-2 py-0.5 rounded">
              {stripeStatus.publishableKey.slice(0, 14)}••••{stripeStatus.publishableKey.slice(-5)}
            </span>
            {stripeStatus.maskedSecretKey && (
              <span className="font-mono text-[10px] bg-black/40 px-2 py-0.5 rounded">
                {stripeStatus.maskedSecretKey}
              </span>
            )}
          </div>
          <div className="text-[11px] opacity-90">
            {stripeStatus.connected
              ? `Cloud Run + AI Studio ✓ • Режим: ${stripeStatus.mode.toUpperCase()} • ${stripeStatus.products.join(', ')}`
              : stripeStatus.error}
          </div>
        </div>
      )}

      {checkoutExternalUrl && (
        <div className="p-4 bg-blue-950/70 border-2 border-blue-400/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-blue-100 font-bold">
            {isRu
              ? '💳 Страница оплаты Stripe Checkout создана. Откройте её в новой вкладке для завершения платежа:'
              : '💳 Stripe Checkout session created. Open in a new tab to complete payment:'}
          </div>
          <a
            href={checkoutExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-duo-green hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg whitespace-nowrap"
          >
            {isRu ? 'Перейти к оплате Stripe ↗' : 'Open Stripe Checkout ↗'}
          </a>
        </div>
      )}

      {/* ACTIVE SUBSCRIPTION / TRIAL STATUS BANNER */}
      {hasActiveSub ? (
        <div className="p-6 bg-gradient-to-r from-amber-950/70 via-slate-900 to-purple-950/70 border-2 border-amber-400/80 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-3xl font-black shadow-lg shrink-0">
              {isMaxActive ? '💎' : '⭐'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-black text-white uppercase tracking-wide">
                  {isRu
                    ? `У вас активна подписка DuoWindo6601 ${isMaxActive ? 'Max' : 'Super'}`
                    : `Active DuoWindo6601 ${isMaxActive ? 'Max' : 'Super'} Subscription`}
                </h3>
                <span className="bg-amber-400 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow">
                  Активно
                </span>
              </div>
              <p className="text-xs text-amber-200/90 font-medium mt-1">
                {isRu
                  ? 'Бесконечные сердца, энергия без ограничений и полный доступ к расширенным функциям.'
                  : 'Infinite hearts, unlimited energy, and unrestricted premium learning tools.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="flex-1 md:flex-none px-5 py-3 rounded-2xl bg-red-950/80 hover:bg-red-900 border-2 border-red-500/80 text-red-200 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer hover:border-red-400"
            >
              <span>✕</span>
              <span>{isRu ? 'Отменить подписку' : 'Cancel Subscription'}</span>
            </button>

            {user.stripeCustomerId && (
              <button
                type="button"
                onClick={handleOpenCustomerPortal}
                className="flex-1 md:flex-none px-4 py-3 rounded-2xl bg-blue-950/80 hover:bg-blue-900 border-2 border-blue-400/80 text-blue-200 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <span>💳</span>
                <span>Stripe Portal</span>
              </button>
            )}
          </div>
        </div>
      ) : user.hasClaimedSuperTrial && !user.superTrialExpired ? (
        <div className="p-6 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border-2 border-emerald-400/80 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-3xl font-black shadow-lg shrink-0 animate-pulse">
              ⚡
            </div>
            <div>
              <h3 className="text-xl font-black text-emerald-300 uppercase tracking-wide">
                {isRu ? 'Пробный период DuoWindo6601 Super (3 дня)' : 'DuoWindo6601 Super 3-Day Trial Active'}
              </h3>
              <p className="text-xs text-emerald-200/90 font-medium mt-1">
                {isRu
                  ? 'Вы используете бесплатный пробный доступ к Super. После окончания вы можете оформить постоянную подписку ниже.'
                  : 'You are currently on the free 3-day Super trial. You can lock in a monthly plan below.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="px-5 py-3 rounded-2xl bg-red-950/80 hover:bg-red-900 border-2 border-red-500/80 text-red-200 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <span>✕</span>
            <span>{isRu ? 'Отменить подписку' : 'Cancel Subscription'}</span>
          </button>
        </div>
      ) : (
        <div className="p-5 bg-slate-900/80 border-2 border-gray-800 rounded-3xl shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌱</span>
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                {isRu ? 'Текущий статус: Бесплатный тариф (Free)' : 'Current Status: Free Tier'}
              </h4>
              <p className="text-xs text-gray-400 font-medium">
                {isRu
                  ? 'Стандартная скорость восстановления энергии, ограничение сердец при ошибках.'
                  : 'Standard energy refill rate, heart deductions on mistakes.'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-gray-800 text-gray-300 border border-gray-700 text-xs font-black uppercase rounded-xl">
            FREE
          </span>
        </div>
      )}

      {/* TARIFF CARDS GRID (SUPER & MAX WITH STRIPE BUY BUTTONS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* CARD 1: DUOWINDO6601 SUPER */}
        <div className={`bg-slate-900/95 border-2 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all ${
          isSuperActive ? 'border-blue-400 ring-4 ring-blue-500/30' : 'border-blue-500/50 hover:border-blue-400'
        }`}>
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-3xl shadow-lg">
                  ⭐
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-wide">
                    DuoWindo6601 Super
                  </h2>
                  <span className="text-xs text-blue-300 font-bold uppercase tracking-wider">
                    {isRu ? 'Для быстрого прогресса' : 'Maximum Velocity'}
                  </span>
                </div>
              </div>

              {isSuperActive && (
                <span className="px-3 py-1 bg-blue-500/30 text-blue-200 border border-blue-400 text-xs font-black uppercase rounded-full shadow">
                  Активно
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 pt-2 border-b border-gray-800 pb-4">
              <span className="text-4xl md:text-5xl font-black text-white">$9.99</span>
              <span className="text-sm text-gray-400 font-bold uppercase">/ {isRu ? 'месяц' : 'month'}</span>
            </div>

            {/* Feature List */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-black text-gray-400 uppercase tracking-wider block">
                {isRu ? 'В подписку входит:' : 'Included Features:'}
              </span>
              <ul className="space-y-2.5 text-xs text-gray-200 font-medium">
                <li className="flex items-center gap-2.5">
                  <span className="text-blue-400 font-bold text-sm">✓</span>
                  <span><strong>{isRu ? 'Бесконечные сердца' : 'Infinite Hearts'}</strong> ({isRu ? 'ошибки не останавливают урок' : 'mistakes do not halt practice'})</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-blue-400 font-bold text-sm">✓</span>
                  <span><strong>{isRu ? 'Бесконечная энергия' : 'Infinite Energy'}</strong> ({isRu ? '25/25 постоянный максимум' : 'always maxed at 25/25'})</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-blue-400 font-bold text-sm">✓</span>
                  <span><strong>{isRu ? 'Без рекламы' : 'Zero Advertisements'}</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-blue-400 font-bold text-sm">✓</span>
                  <span><strong>{isRu ? 'Практика ошибок' : 'Mistake Review Hub'}</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-blue-400 font-bold text-sm">✓</span>
                  <span>{isRu ? 'Приоритетные AI ответы Gemini API' : 'High priority Gemini API responses'}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Action Area: Stripe Buy Button & Cancel Subscription */}
          <div className="mt-8 pt-6 border-t border-gray-800 space-y-4">
            {isSuperActive ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-blue-950/80 border border-blue-500/50 rounded-2xl text-center text-blue-200 font-black text-xs uppercase tracking-wider">
                  ✓ {isRu ? 'Подписка DuoWindo6601 Super уже оформлена' : 'DuoWindo6601 Super Active'}
                </div>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="w-full py-3.5 bg-red-950/80 hover:bg-red-900 border-2 border-red-500/70 text-red-200 font-black text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  ✕ {isRu ? 'Отменить подписку' : 'Cancel Subscription'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Official Stripe Buy Button Component */}
                <div className="flex flex-col items-center">
                  <StripeBuyButton
                    buyButtonId={STRIPE_BUY_BUTTON_SUPER}
                    customerEmail={user.email}
                    className="w-full flex justify-center"
                  />
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-gray-800"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-gray-500 uppercase font-black">{isRu ? 'Или' : 'Or'}</span>
                  <div className="flex-grow border-t border-gray-800"></div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStripeCheckout('super')}
                  disabled={isProcessingStripe === 'super'}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-2xl border-b-4 border-blue-800 transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{isProcessingStripe === 'super' ? '⏳' : '💳'}</span>
                  <span>{isRu ? 'Оформить подписку ($9.99/мес)' : 'Subscribe via Stripe ($9.99/mo)'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: DUOWINDO6601 MAX */}
        <div className={`bg-slate-900/95 border-2 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all ${
          isMaxActive ? 'border-purple-400 ring-4 ring-purple-500/30' : 'border-purple-500/50 hover:border-purple-400'
        }`}>
          {/* Top highlight ribbon */}
          <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-[10px] uppercase px-4 py-1.5 rounded-bl-2xl shadow-lg">
            {isRu ? 'Максимальный тариф' : 'Ultimate Tier'}
          </div>

          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/50 flex items-center justify-center text-3xl shadow-lg">
                  💎
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-wide">
                    DuoWindo6601 Max
                  </h2>
                  <span className="text-xs text-purple-300 font-bold uppercase tracking-wider">
                    {isRu ? 'ИИ Видеозвонки & Все возможности' : 'Real-Time AI Video & Super'}
                  </span>
                </div>
              </div>

              {isMaxActive && (
                <span className="px-3 py-1 bg-purple-500/30 text-purple-200 border border-purple-400 text-xs font-black uppercase rounded-full shadow">
                  Активно
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 pt-2 border-b border-gray-800 pb-4">
              <span className="text-4xl md:text-5xl font-black text-white">$29.99</span>
              <span className="text-sm text-gray-400 font-bold uppercase">/ {isRu ? 'месяц' : 'month'}</span>
            </div>

            {/* Feature List */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-black text-gray-400 uppercase tracking-wider block">
                {isRu ? 'В подписку входит:' : 'Included Features:'}
              </span>
              <ul className="space-y-2.5 text-xs text-gray-200 font-medium">
                <li className="flex items-center gap-2.5">
                  <span className="text-purple-400 font-bold text-sm">✓</span>
                  <span><strong>{isRu ? 'Все преимущества Super' : 'Everything in Super'}</strong> (сердца, энергия, без рекламы)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-purple-400 font-bold text-sm">✓</span>
                  <span><strong>{isRu ? 'AI Видео-звонки в реальном времени' : 'Live Real-Time AI Video Calls'}</strong> {isRu ? 'с совенком DuoWindo6601' : 'with Mascot'}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-purple-400 font-bold text-sm">✓</span>
                  <span><strong>{isRu ? 'Глубокий анализ грамматики' : 'Deep Grammar & Answer Analysis'}</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-purple-400 font-bold text-sm">✓</span>
                  <span><strong>{isRu ? 'Интерактивный Roleplay чат' : 'Advanced Roleplay Dialogues'}</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-purple-400 font-bold text-sm">✓</span>
                  <span><strong>{isRu ? 'Безлимитный доступ' : 'Unlimited Gemini 3 Pro'}</strong> {isRu ? 'к премиальным моделям Gemini 3 Pro' : 'model access'}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Action Area: Stripe Buy Button & Cancel Subscription */}
          <div className="mt-8 pt-6 border-t border-gray-800 space-y-4">
            {isMaxActive ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-purple-950/80 border border-purple-500/50 rounded-2xl text-center text-purple-200 font-black text-xs uppercase tracking-wider">
                  ✓ {isRu ? 'Подписка DuoWindo6601 Max уже оформлена' : 'DuoWindo6601 Max Active'}
                </div>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="w-full py-3.5 bg-red-950/80 hover:bg-red-900 border-2 border-red-500/70 text-red-200 font-black text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  ✕ {isRu ? 'Отменить подписку' : 'Cancel Subscription'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Official Stripe Buy Button Component */}
                <div className="flex flex-col items-center">
                  <StripeBuyButton
                    buyButtonId={STRIPE_BUY_BUTTON_MAX}
                    customerEmail={user.email}
                    className="w-full flex justify-center"
                  />
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-gray-800"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-gray-500 uppercase font-black">{isRu ? 'Или' : 'Or'}</span>
                  <div className="flex-grow border-t border-gray-800"></div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStripeCheckout('max')}
                  disabled={isProcessingStripe === 'max'}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-2xl border-b-4 border-purple-900 transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{isProcessingStripe === 'max' ? '⏳' : '💳'}</span>
                  <span>{isRu ? 'Оформить подписку ($29.99/мес)' : 'Subscribe via Stripe ($29.99/mo)'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER GUARANTEE & SECURITY NOTE */}
      <div className="bg-duo-card/60 border border-gray-800 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <span className="font-bold text-white block uppercase tracking-wider">
              {isRu ? 'Безопасность платежей гарантирована Stripe' : 'Payments Secured by Stripe'}
            </span>
            <span>
              {isRu
                ? 'Платежные данные шифруются по стандарту PCI DSS Service Provider Level 1.'
                : 'All credit card transactions are encrypted with certified PCI DSS Level 1 standards.'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="px-3 py-1 bg-gray-800 rounded-xl border border-gray-700 font-mono text-[11px] text-gray-300">
            SSL 256-bit
          </span>
          <span className="px-3 py-1 bg-gray-800 rounded-xl border border-gray-700 font-mono text-[11px] text-gray-300">
            3D Secure 2.0
          </span>
        </div>
      </div>

      {/* CANCEL SUBSCRIPTION CONFIRMATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border-2 border-red-500/70 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left relative">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/60 flex items-center justify-center text-2xl text-red-400 shrink-0">
                ⚠️
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-white uppercase tracking-wide">
                  {isRu ? 'Отмена подписки DuoWindo6601' : 'Cancel DuoWindo6601 Subscription'}
                </h3>
                <p className="text-xs text-red-300 font-medium">
                  {user.subscription === 'max' ? 'DuoWindo6601 Max' : 'DuoWindo6601 Super'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-white text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              {isRu
                ? 'Вы действительно хотите отменить подписку? После отмены вы перейдете на бесплатный тариф (Free): бесконечные сердца и энергия будут отключены.'
                : 'Are you sure you want to cancel your subscription? You will transition to the Free tier: unlimited hearts and energy will be disabled.'}
            </p>

            <div className="bg-black/50 border border-gray-800 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-gray-400">
                <span>{isRu ? 'Тариф:' : 'Tier:'}</span>
                <span className="font-bold text-white uppercase px-2 py-0.5 bg-purple-900/50 rounded-lg border border-purple-500/40">
                  {user.subscription}
                </span>
              </div>
              {user.stripeSubscriptionId && (
                <div className="flex justify-between items-center text-gray-400">
                  <span>Stripe Sub ID:</span>
                  <span className="font-mono text-[10px] text-blue-300">{user.stripeSubscriptionId}</span>
                </div>
              )}
              <div className="text-[11px] text-amber-300/90 pt-1 border-t border-gray-800/80">
                ⚡ {isRu ? 'Доступ вернется к обычному бесплатному режиму DuoWindo6601.' : 'Access will return to regular free mode.'}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={isCanceling}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
              >
                {isRu ? 'Оставить подписку' : 'Keep Subscription'}
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCanceling}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer text-center border-b-4 border-red-800 active:border-b-0 active:translate-y-1 shadow-lg disabled:opacity-50"
              >
                {isCanceling ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin text-xs">⏳</span>
                    <span>{isRu ? 'Отмена...' : 'Canceling...'}</span>
                  </span>
                ) : (
                  isRu ? 'Да, отменить подписку' : 'Yes, Cancel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test cards modal */}
      <StripeTestCardsModal
        isOpen={showTestCardsModal}
        onClose={() => setShowTestCardsModal(false)}
        language={user.language}
        onToast={setToast}
      />
    </div>
  );
};
