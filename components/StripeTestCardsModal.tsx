import React, { useState } from 'react';

interface StripeTestCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: string;
  onToast?: (msg: string) => void;
}

interface TestCard {
  brand: string;
  number: string;
  exp: string;
  cvc: string;
  zip: string;
  descriptionRu: string;
  descriptionEn: string;
  status: 'success' | '3ds' | 'decline';
  badgeRu: string;
  badgeEn: string;
}

const STRIPE_TEST_CARDS: TestCard[] = [
  {
    brand: 'Visa (Успешная оплата)',
    number: '4242 4242 4242 4242',
    exp: '12/28',
    cvc: '123',
    zip: '12345',
    descriptionRu: 'Основная тестовая карта для успешного оформления подписки и покупки алмазов.',
    descriptionEn: 'Default test card that always succeeds for subscriptions and gem purchases.',
    status: 'success',
    badgeRu: 'Успех (Success)',
    badgeEn: 'Success',
  },
  {
    brand: 'Mastercard (Успешная оплата)',
    number: '5555 5555 5555 4444',
    exp: '12/28',
    cvc: '456',
    zip: '101000',
    descriptionRu: 'Тестовая карта Mastercard для проверки международных платежей.',
    descriptionEn: 'Mastercard test card for international payment simulation.',
    status: 'success',
    badgeRu: 'Успех (Success)',
    badgeEn: 'Success',
  },
  {
    brand: 'Visa 3D Secure (Проверка СМС / 3DS)',
    number: '4000 0027 6000 3184',
    exp: '12/28',
    cvc: '123',
    zip: '12345',
    descriptionRu: 'Тестирует окно двухфакторной аутентификации 3D Secure (нажмите "Complete" в окне Stripe).',
    descriptionEn: 'Simulates 3D Secure / OTP verification modal in Stripe Checkout.',
    status: '3ds',
    badgeRu: '3D Secure (3DS)',
    badgeEn: '3D Secure',
  },
  {
    brand: 'Отказ: Недостаточно средств',
    number: '4000 0000 0000 9995',
    exp: '12/28',
    cvc: '123',
    zip: '12345',
    descriptionRu: 'Симулирует отказ банка по причине "Недостаточно средств (Insufficient Funds)".',
    descriptionEn: 'Simulates card decline due to insufficient funds.',
    status: 'decline',
    badgeRu: 'Отказ банка',
    badgeEn: 'Decline',
  },
  {
    brand: 'Отказ: Истекший срок действия',
    number: '4000 0000 0000 0069',
    exp: '12/28',
    cvc: '123',
    zip: '12345',
    descriptionRu: 'Симулирует ошибку "Срок действия карты истек (Expired Card)".',
    descriptionEn: 'Simulates expired card rejection.',
    status: 'decline',
    badgeRu: 'Истекла',
    badgeEn: 'Expired',
  },
  {
    brand: 'Отказ: Неверный CVC код',
    number: '4000 0000 0000 0127',
    exp: '12/28',
    cvc: '123',
    zip: '12345',
    descriptionRu: 'Симулирует ошибку проверки секретного кода CVC.',
    descriptionEn: 'Simulates incorrect CVC security code failure.',
    status: 'decline',
    badgeRu: 'Неверный CVC',
    badgeEn: 'Incorrect CVC',
  },
];

export const StripeTestCardsModal: React.FC<StripeTestCardsModalProps> = ({
  isOpen,
  onClose,
  language = 'ru',
  onToast,
}) => {
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const isRu = language === 'ru';

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    const rawNumber = text.replace(/\s+/g, '');
    navigator.clipboard.writeText(rawNumber);
    setCopiedNumber(rawNumber);
    if (onToast) {
      onToast(isRu ? `📋 Скопировано: ${rawNumber}` : `📋 Copied: ${rawNumber}`);
    }
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 text-left relative my-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-xl bg-gray-800 transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* Header with Explanation of Test Mode */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-3xl shrink-0 shadow-lg">
            💳
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-wide text-amber-300">
                {isRu ? 'Действующие тестовые карты Stripe' : 'Official Stripe Test Cards'}
              </h2>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                TEST MODE
              </span>
            </div>
            <p className="text-xs text-gray-300 font-medium leading-relaxed">
              {isRu
                ? 'Ошибка «не тестовая карта» означает, что шлюз работает в режиме тестирования (pk_test_...). В этом режиме Stripe блокирует настоящие банковские карты для защиты ваших денег. Используйте официальные тестовые карты ниже:'
                : 'The error "not a test card" means your Stripe account is currently in Test Mode (pk_test_...). Stripe rejects real credit cards in test mode. Please use the official test cards below:'}
            </p>
          </div>
        </div>

        {/* Quick Recommended Card Callout */}
        <div className="p-4 bg-gradient-to-r from-blue-950/80 to-purple-950/80 border-2 border-blue-400/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div>
            <span className="text-[10px] font-black uppercase text-blue-300 tracking-wider block">
              ⭐ {isRu ? 'Рекомендуемая карта для оплаты' : 'Recommended Success Card'}
            </span>
            <span className="font-mono text-xl sm:text-2xl font-black text-white tracking-widest block mt-0.5">
              4242 4242 4242 4242
            </span>
            <span className="text-xs text-gray-300 font-bold mt-1 block">
              {isRu ? 'Срок:' : 'Exp:'} <strong className="text-white">12/28</strong> • CVC: <strong className="text-white">123</strong> • ZIP: <strong className="text-white">12345</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => copyToClipboard('4242 4242 4242 4242', 'Visa 4242')}
            className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md shrink-0 ${
              copiedNumber === '4242424242424242'
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
            }`}
          >
            <span>{copiedNumber === '4242424242424242' ? '✓' : '📋'}</span>
            <span>{copiedNumber === '4242424242424242' ? (isRu ? 'Скопировано!' : 'Copied!') : (isRu ? 'Скопировать номер' : 'Copy Card')}</span>
          </button>
        </div>

        {/* Detailed Cards List */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">
            {isRu ? 'Полный список карт для тестирования Stripe:' : 'All Stripe Simulation Cards:'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STRIPE_TEST_CARDS.map((card, idx) => {
              const cleanNumber = card.number.replace(/\s+/g, '');
              const isCopied = copiedNumber === cleanNumber;

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all text-xs space-y-2 flex flex-col justify-between ${
                    card.status === 'success'
                      ? 'bg-emerald-950/40 border-emerald-500/50 hover:border-emerald-400'
                      : card.status === '3ds'
                      ? 'bg-blue-950/40 border-blue-500/50 hover:border-blue-400'
                      : 'bg-red-950/40 border-red-500/50 hover:border-red-400'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-white text-xs">{card.brand}</span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase border ${
                          card.status === 'success'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : card.status === '3ds'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : 'bg-red-500/20 text-red-300 border-red-500/40'
                        }`}
                      >
                        {isRu ? card.badgeRu : card.badgeEn}
                      </span>
                    </div>

                    <div className="font-mono text-sm font-bold text-amber-200 tracking-wider">
                      {card.number}
                    </div>

                    <p className="text-[11px] text-gray-300 font-medium">
                      {isRu ? card.descriptionRu : card.descriptionEn}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-800 gap-2">
                    <span className="text-[10px] text-gray-400 font-mono">
                      {isRu ? 'Срок:' : 'Exp:'} {card.exp} • CVC: {card.cvc}
                    </span>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(card.number, card.brand)}
                      className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isCopied ? '✓' : '📋'}</span>
                      <span>{isCopied ? (isRu ? 'Готово' : 'Copied') : (isRu ? 'Копировать' : 'Copy')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Mode Notice */}
        <div className="p-4 bg-gray-950/80 border border-gray-800 rounded-2xl text-xs space-y-2 text-gray-300">
          <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-xs">
            <span>⚙️</span>
            <span>{isRu ? 'Как принимать настоящие банковские карты (Live Mode)?' : 'How to accept real credit cards (Live Mode)?'}</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            {isRu
              ? 'Чтобы списывать реальные деньги с настоящих карт клиентов, активируйте ваш аккаунт в панели управления Stripe Dashboard (stripe.com), пройдите верификацию бизнеса и замените ключи pk_test_... и sk_test_... на рабочие боевые ключи pk_live_... и sk_live_....'
              : 'To charge real credit cards from real users, activate your account in the Stripe Dashboard (stripe.com), complete business verification, and replace your test keys pk_test_... and sk_test_... with your production keys pk_live_... and sk_live_....'}
          </p>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg"
          >
            {isRu ? 'Понятно, вернуться к оплате' : 'Got it, back to checkout'}
          </button>
        </div>
      </div>
    </div>
  );
};
