import React, { useState, useEffect, useRef } from 'react';
import { UserProgress, SupportMessage } from '../types';
import { 
  SparklesIcon, 
  CloseIcon, 
  ShieldIcon, 
  FireIcon, 
  CheckCircleIcon, 
  ArrowRightIcon
} from './Icons';

interface SupportChatScreenProps {
  user: UserProgress;
  onBack: () => void;
  playSound?: (type: 'click' | 'correct' | 'wrong' | 'fanfare' | 'streak') => void;
  setToast?: (msg: string) => void;
  onUpdateUser?: (updater: (prev: UserProgress) => UserProgress) => void;
  isIncognito?: boolean;
  onOpenProfile?: () => void;
}

const DEFAULT_INITIAL_MESSAGES: SupportMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'bot',
    senderName: 'DuoSupport AI 🦉',
    text: 'Здравствуйте! Я интеллектуальный ассистент техподдержки DuoWindo6601. Чем я могу вам помочь сегодня?',
    timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }
];

export const SupportChatScreen: React.FC<SupportChatScreenProps> = ({
  user,
  onBack,
  playSound,
  setToast,
  onUpdateUser,
  isIncognito = false,
  onOpenProfile
}) => {
  const isIncognitoMode = Boolean(
    isIncognito ||
    user.username?.startsWith('incognito_') ||
    user.name?.includes('Гость') ||
    user.name?.includes('Incognito') ||
    user.authProvider === 'guest'
  );

  const [messages, setMessages] = useState<SupportMessage[]>(() => {
    try {
      const saved = localStorage.getItem(`duo_support_chat_${user.id || 'default'}`);
      return saved ? JSON.parse(saved) : DEFAULT_INITIAL_MESSAGES;
    } catch {
      return DEFAULT_INITIAL_MESSAGES;
    }
  });

  const [input, setInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = Boolean(
    user.isAdmin || 
    (user.username && user.username.toLowerCase().includes('abramov')) || 
    (user.email && user.email.toLowerCase().includes('abramov'))
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    try {
      localStorage.setItem(`duo_support_chat_${user.id || 'default'}`, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    playSound?.('click');

    const userMsg: SupportMessage = {
      id: `msg-${Date.now()}`,
      sender: user.isAdmin ? 'admin' : 'user',
      senderName: user.isAdmin ? 'Администратор DuoWindo6601 🛡️' : (user.name || user.username || 'Пользователь'),
      text: text,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');

    // Trigger AI or Admin auto-response
    setIsTyping(true);
    setTimeout(() => {
      generateBotResponse(text);
      setIsTyping(false);
    }, 1200);
  };

  const executeStreakRepair = () => {
    if (isIncognitoMode) {
      playSound?.('wrong');
      setToast?.('🔒 Ограничение: Восстановление Ударного Режима недоступно в Режиме Инкогнито (Без аккаунта)!');
      return false;
    }

    const targetStreak = Math.max(1, (user.previousLostStreak || user.maxStreak || 5));
    if (onUpdateUser) {
      onUpdateUser(prev => ({
        ...prev,
        streak: targetStreak,
        previousLostStreak: 0,
        streakFreezeCount: Math.max(1, prev.streakFreezeCount || 1),
        lastActiveDate: new Date().toISOString().split('T')[0]
      }));
    }
    playSound?.('streak');
    setToast?.(`🔥 Ударный режим официально восстановлен (${targetStreak} дн.)!`);
    return true;
  };

  const generateBotResponse = (userQuery: string) => {
    const queryLower = userQuery.toLowerCase();
    let responseText = '';
    let isRepair = false;
    let isIncognitoBlocked = false;

    if (queryLower.includes('ударн') || queryLower.includes('сери') || queryLower.includes('восстанов') || queryLower.includes('streak')) {
      if (isIncognitoMode) {
        playSound?.('wrong');
        setToast?.('🔒 Ограничение: Восстановление Ударного Режима недоступно в Режиме Инкогнито (Без аккаунта)!');
        isIncognitoBlocked = true;
        responseText = `🔒 **Ограничение: Восстановление Ударного Режима недоступно в Режиме Инкогнито (Без аккаунта)!**

В Режиме Инкогнито учётная запись является временной гостевой сессией и не привязана к облачному аккаунту. Для защиты честного рейтинга восстановление серии дней через техподдержку доступно только зарегистрированным пользователям с постоянным аккаунтом.

👉 Пожалуйста, войдите в аккаунт или зарегистрируйтесь в разделе «Профиль», чтобы сохранять серию, открывать достижения и восстанавливать ударный режим!`;
      } else {
        isRepair = true;
        executeStreakRepair();
        responseText = `Запрос на восстановление ударного режима обработан! 

🔥 **Ударный режим успешно восстановлен!**
Текущая серия установлена в ${Math.max(1, user.previousLostStreak || user.maxStreak || 5)} дн. Также вам добавлена 1 бесплатная заморозка серии ❄️.

Пожалуйста, продолжайте заниматься ежедневно!`;
      }
    } else if (queryLower.includes('max') || queryLower.includes('подписк') || queryLower.includes('премиум')) {
      responseText = `Подписка **DuoWindo6601 Max** открывает эксклюзивные возможности:
• ✨ AI-Объяснение ответов и ошибок
• 📞 Видеозвонки и практика диалогов с AI
• ♾️ Безлимитная энергия для всех уроков
• ♟️ Расширенный шахматный симулятор

Вы можете оформить подписку в разделе «Магазин»!`;
    } else if (queryLower.includes('ошибк') || queryLower.includes('баг') || queryLower.includes('bug')) {
      responseText = `Спасибо за сообщение об ошибке! Наша команда разработчиков и администраторов уже уведомлена. Мы устраним неисправность в ближайшем обновлении.`;
    } else if (queryLower.includes('админ') || queryLower.includes('оператор')) {
      responseText = `Ваш запрос отправлен Администратору DuoWindo6601. Администратор ответит вам прямо в этом чате.`;
    } else {
      responseText = `Спасибо за обращение в поддержку DuoWindo6601! Мы зафиксировали ваш вопрос: "${userQuery}". Если у вас есть вопросы по работе платформы, напишите их здесь!`;
    }

    const botMsg: SupportMessage = {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      senderName: 'DuoSupport AI 🦉',
      text: responseText,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      isStreakRepairAction: isRepair,
      isIncognitoBlocked: isIncognitoBlocked
    };

    setMessages(prev => [...prev, botMsg]);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all active:scale-95"
          >
            ←
          </button>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-duo-green to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-duo-green/20">
            <div className="w-full h-full bg-gray-900 rounded-[14px] flex items-center justify-center text-xl">
              🦉
            </div>
          </div>
          <div>
            <h1 className="font-black text-base md:text-lg text-white flex items-center space-x-2">
              <span>Чат техподдержки DuoWindo6601</span>
              {isAdmin && (
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Admin Access
                </span>
              )}
            </h1>
            <p className="text-xs text-emerald-400 font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>AI ИИ-Ассистент & Администратор онлайн</span>
            </p>
          </div>
        </div>

        <button 
          onClick={onBack}
          className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </header>

      {/* INCOGNITO RESTRICTION NOTICE BANNER */}
      {isIncognitoMode && (
        <div className="bg-gradient-to-r from-red-950/90 via-amber-950/70 to-red-950/90 border-b-2 border-red-500/50 p-3 px-4 flex items-center justify-between flex-wrap gap-2 text-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2.5">
            <span className="text-xl">🕶️</span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-red-300 uppercase tracking-wide text-[11px]">
                  Режим Инкогнито (Без аккаунта)
                </span>
                <span className="bg-red-500/30 text-red-200 text-[9px] font-black px-2 py-0.5 rounded-full border border-red-500/40 uppercase">
                  Ограничение
                </span>
              </div>
              <p className="text-[11px] text-gray-300 leading-snug mt-0.5">
                🔒 <strong>Восстановление Ударного Режима недоступно без аккаунта.</strong> Чтобы сохранять серию дней и активировать заморозки, войдите в профиль.
              </p>
            </div>
          </div>
          {onOpenProfile && (
            <button
              onClick={() => { playSound?.('click'); onOpenProfile(); }}
              className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-black px-3.5 py-1.5 rounded-xl text-xs uppercase tracking-wide transition-all shadow-md active:scale-95 flex items-center space-x-1"
            >
              <span>👤</span>
              <span>Войти в аккаунт →</span>
            </button>
          )}
        </div>
      )}

      {/* QUICK ACTIONS BANNER */}
      <div className="bg-gray-900/60 border-b border-gray-800/80 p-3 px-4 flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs font-bold">
        <button
          onClick={() => {
            if (isIncognitoMode) {
              playSound?.('wrong');
              setToast?.('🔒 Ограничение: Восстановление Ударного Режима недоступно в Режиме Инкогнито (Без аккаунта)!');
              handleSendMessage('Пожалуйста, восстановите мой ударный режим 🔥');
            } else {
              handleSendMessage('Пожалуйста, восстановите мой ударный режим 🔥');
            }
          }}
          className={`flex-shrink-0 ${
            isIncognitoMode 
              ? 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/40' 
              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
          } px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 active:scale-95`}
        >
          <span>{isIncognitoMode ? '🔒' : '🔥'}</span>
          <span>{isIncognitoMode ? 'Восстановление серии (Требуется аккаунт)' : 'Восстановить ударный режим'}</span>
        </button>
        <button
          onClick={() => handleSendMessage('Расскажите подробнее про подписку DuoWindo6601 Max 👑')}
          className="flex-shrink-0 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 active:scale-95"
        >
          <span>👑</span>
          <span>Подписка DuoWindo6601 Max</span>
        </button>
        <button
          onClick={() => handleSendMessage('Я хочу сообщить об ошибке в уроке 🐞')}
          className="flex-shrink-0 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 active:scale-95"
        >
          <span>🐞</span>
          <span>Сообщить об ошибке</span>
        </button>
      </div>

      {/* MESSAGES BODY */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 max-w-3xl w-full mx-auto">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isAdminSender = msg.sender === 'admin';

          return (
            <div 
              key={msg.id} 
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-200`}
            >
              <div className="flex items-center space-x-1.5 px-1 text-[11px] text-gray-400 font-bold">
                <span>{msg.senderName}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              <div 
                className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl shadow-md text-sm md:text-base leading-relaxed whitespace-pre-wrap ${
                  isUser 
                    ? 'bg-duo-green text-white font-medium rounded-tr-none border-b-2 border-duo-greenDark' 
                    : isAdminSender
                    ? 'bg-amber-950/80 text-amber-100 border-2 border-amber-500/50 rounded-tl-none'
                    : 'bg-gray-850 text-gray-100 border border-gray-750 rounded-tl-none shadow-lg'
                }`}
              >
                {msg.text}

                {msg.isStreakRepairAction && (
                  <div className="mt-3 p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl flex items-center space-x-3 text-amber-200 text-xs font-bold">
                    <span className="text-2xl animate-bounce">🔥</span>
                    <div>
                      <p className="font-black text-amber-300">Серия восстановлена!</p>
                      <p className="text-[11px] opacity-90">Ударный режим снова активен в вашем аккаунте.</p>
                    </div>
                  </div>
                )}

                {msg.isIncognitoBlocked && (
                  <div className="mt-3 p-3.5 bg-red-950/80 border-2 border-red-500/60 rounded-xl flex items-center justify-between flex-wrap gap-2 text-red-200 text-xs font-bold shadow-lg">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-2xl">🔒</span>
                      <div>
                        <p className="font-black text-red-300">Ограничение: Режим Инкогнито (Без аккаунта)</p>
                        <p className="text-[11px] text-gray-300 font-normal">Восстановление Ударного Режима доступно только для зарегистрированных аккаунтов.</p>
                      </div>
                    </div>
                    {onOpenProfile && (
                      <button
                        onClick={() => { playSound?.('click'); onOpenProfile(); }}
                        className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-black px-3 py-1.5 rounded-lg text-xs uppercase tracking-wide transition-all shadow-md active:scale-95 flex items-center space-x-1"
                      >
                        <span>👤</span>
                        <span>Войти / Регистрация →</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center space-x-2 p-3 bg-gray-850 rounded-2xl border border-gray-750 w-fit animate-pulse text-xs text-gray-400 font-bold">
            <span>🦉 DuoSupport AI печатает ответ...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* FOOTER INPUT */}
      <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 p-3 md:p-4">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="max-w-3xl mx-auto flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Напишите вопрос техподдержке..."
            className="flex-1 bg-gray-800 border-2 border-gray-700 focus:border-duo-green text-white text-sm md:text-base rounded-2xl px-4 py-3.5 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-duo-green hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 text-white font-black px-5 md:px-6 py-3.5 rounded-2xl border-b-4 border-duo-greenDark active:border-b-0 active:translate-y-1 transition-all text-sm uppercase flex items-center space-x-1"
          >
            <span>Отправить</span>
          </button>
        </form>
      </div>
    </div>
  );
};
