import React from 'react';
import { CloseIcon } from './Icons';
import { UserProgress } from '../types';
import { 
  isIncognitoLoginClosed, 
  getDaysUntilIncognitoClosure, 
  getFormattedClosureDate,
  downloadIncognitoDataFile,
  isIncognitoClosingTomorrow,
  getIncognitoClosureTitle,
  getSynchronizedActiveStatuses
} from '../services/incognitoService';

export interface IncognitoRestrictionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister: (tab?: 'login' | 'register' | 'incognito' | 'google') => void;
  onGoogleSignIn: () => void;
  language?: string;
  playSound: (type: 'click' | 'correct' | 'wrong' | 'fanfare' | 'streak') => void;
  user?: UserProgress;
  onOpenExport?: () => void;
}

export const INCOGNITO_RESTRICTIONS = [
  {
    id: 'sync',
    icon: '🔄',
    titleRu: 'Синхронизация прогресса',
    titleEn: 'Progress Synchronization',
    statusRu: 'Требуется аккаунт',
    statusEn: 'Account Required',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    descRu: 'Облачная синхронизация между ПК, телефоном и планшетом отключена. При очистке кэша или смене браузера уровень и кристаллы сбросятся.',
    descEn: 'Cloud sync between PC, phone, and tablet is disabled. Clearing cache or switching browsers will reset your level and gems.',
  },
  {
    id: 'lessons',
    icon: '💾',
    titleRu: 'Сохранение уроков',
    titleEn: 'Lesson & Mistake Saving',
    statusRu: 'Локальный режим',
    statusEn: 'Local Only',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    descRu: 'История пройденных тем, банк ошибок и персональные повторения хранятся только во временной памяти текущей сессии.',
    descEn: 'Completed topics history, mistake bank, and spaced repetitions are stored only in temporary browser memory.',
  },
  {
    id: 'leaderboard',
    icon: '🏆',
    titleRu: 'Рейтинг и таблицы лидеров',
    titleEn: 'Leaderboard & Global Leagues',
    statusRu: 'Заблокировано',
    statusEn: 'Blocked',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    descRu: 'Заработанные очки XP не отправляются на общий сервер. Вы не сможете занять призовые места в глобальной Алмазной Лиге.',
    descEn: 'Earned XP points are not sent to the global server. You cannot compete for top spots in the Diamond League.',
  },
  {
    id: 'videocall',
    icon: '📹',
    titleRu: 'ВидеоЗвонок DuoWindo6601',
    titleEn: 'DuoWindo6601 AI Video Call',
    statusRu: 'Требуется профиль',
    statusEn: 'Profile Required',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    descRu: 'Интерактивный видеодиалог с ИИ-партнёром и персональный разбор произношения требуют профиль для сохранения истории диалогов.',
    descEn: 'Interactive AI video dialogue and personal pronunciation feedback require a profile to save chat history and speech analytics.',
  },
  {
    id: 'profile',
    icon: '👤',
    titleRu: 'Профиль и статистика',
    titleEn: 'Profile & Cloud Statistics',
    statusRu: 'Ограничено',
    statusEn: 'Restricted',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    descRu: 'Персональный никнейм (@username), вечный стрик, кастомный аватар и детальная 30-дневная статистика привязаны к учётной записи.',
    descEn: 'Unique handle (@username), permanent streak, custom avatar, and 30-day activity stats are bound to a verified account.',
  },
  {
    id: 'reviews',
    icon: '⭐',
    titleRu: 'Отзывы DuoWindo6601',
    titleEn: 'DuoWindo6601 Reviews',
    statusRu: 'Только для аккаунтов',
    statusEn: 'Accounts Only',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    descRu: 'Публикация официальных отзывов и выставление оценок платформе/курсам доступны только авторизованным ученикам для защиты от спама.',
    descEn: 'Publishing official platform reviews and rating courses is exclusive to registered learners to prevent spam.',
  },
  {
    id: 'comments',
    icon: '💬',
    titleRu: 'Комментарии',
    titleEn: 'Community Comments',
    statusRu: 'Режим чтения',
    statusEn: 'Read-Only Mode',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    descRu: 'Обсуждение сложных упражнений, вопросы сообществу и ответы в ветках открыты только зарегистрированным пользователям.',
    descEn: 'Discussing tricky exercises, asking the community questions, and posting replies are available only after signing in.',
  },
  {
    id: 'shop',
    icon: '💎',
    titleRu: 'Магазин DuoWindo6601',
    titleEn: 'DuoWindo6601 Shop',
    statusRu: 'Ограничено',
    statusEn: 'Restricted',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    descRu: 'Активация подписок Super/Max, покупка заморозок стрика и наград требует аккаунт для надёжного бессрочного сохранения прав.',
    descEn: 'Activating Super/Max subscriptions, buying streak freezes and perks requires an account for permanent license retention.',
  },
  {
    id: 'support_streak',
    icon: '🔥',
    titleRu: 'Восстановление Ударного Режима (Чат-поддержка)',
    titleEn: 'Streak Recovery (Support Chat)',
    statusRu: 'Заблокировано',
    statusEn: 'Blocked',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    descRu: 'Восстановление серии дней через техподдержку заблокировано для Режима Инкогнито без аккаунта. Требуется зарегистрированный аккаунт.',
    descEn: 'Streak recovery via support chat is restricted in Incognito Mode without an account. A registered account is required.',
  },
  {
    id: 'chess_bot',
    icon: '🦉',
    titleRu: 'Играть с DuoWindo6601 (ИИ-бот)',
    titleEn: 'Play with DuoWindo6601 (AI Bot)',
    statusRu: 'Локально / +30 XP',
    statusEn: 'Local Only / +30 XP',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    descRu: 'Одиночная партия с ИИ-ботом DuoWindo6601 доступна в Инкогнито с начислением +30 очков опыта. Однако победы и шахматный рейтинг ELO сбросятся при закрытии вкладки.',
    descEn: 'Single match vs DuoWindo6601 AI bot is available with +30 XP reward. However, wins and ELO rating are not saved to the cloud and will reset.',
  },
  {
    id: 'chess_pvp',
    icon: '⚔️',
    titleRu: 'Играть с другим Пользователем',
    titleEn: 'Play with Another User (PvP)',
    statusRu: 'Гостевой режим / +30 XP',
    statusEn: 'Guest Mode / +30 XP',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    descRu: 'Пригласить друга • Ссылка • Поиск работают в гостевом режиме (+30 очков опыта). Для добавления в постоянные друзья и сохранения ELO в лиге требуется аккаунт.',
    descEn: 'Invite a friend • Link • Search operate in guest mode (+30 XP). Permanent friends list and cloud ELO rankings require signing in.',
  },
  {
    id: 'chess_lessons',
    icon: '💡',
    titleRu: '💡 Обучение & 📖 Урок (без бота)',
    titleEn: 'Tutorial & Lesson (No Bot)',
    statusRu: 'Локальное обучение',
    statusEn: 'Local Training',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    descRu: 'Обучение правилам шахматных фигур и свободный режим уроков (без бота) доступны в Инкогнито без ограничений для тренировки.',
    descEn: 'Interactive piece rules tutorial and free lesson mode (no bot) are fully available in Incognito for move practicing.',
  },
];

export const IncognitoRestrictionsModal: React.FC<IncognitoRestrictionsModalProps> = ({
  isOpen,
  onClose,
  onOpenRegister,
  onGoogleSignIn,
  language = 'ru',
  playSound,
  user,
  onOpenExport,
}) => {
  if (!isOpen) return null;

  const isRu = language === 'ru';
  const isClosed = isIncognitoLoginClosed();
  const daysLeft = getDaysUntilIncognitoClosure();
  const closureDateStr = getFormattedClosureDate(language);

  const handleExportClick = () => {
    playSound('click');
    if (onOpenExport) {
      onClose();
      onOpenExport();
    } else if (user) {
      downloadIncognitoDataFile(user, language);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-[#10131a] border-2 border-amber-500/60 rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-[0_0_50px_rgba(245,158,11,0.25)] text-white my-6 relative max-h-[92vh] flex flex-col">
        {/* CLOSE BUTTON */}
        <button
          onClick={() => {
            playSound('click');
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors z-10 cursor-pointer"
          title={isRu ? 'Закрыть' : 'Close'}
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        {/* MODAL HEADER */}
        <div className="text-center space-y-2 pb-3 border-b border-gray-800 shrink-0 pr-8 sm:pr-0">
          <div className="inline-flex items-center justify-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-black uppercase tracking-wider shadow-inner">
            <span className="text-base">{isClosed ? '🛑' : '🚫'}</span>
            <span>{isRu ? 'Режим Ограничения в Инкогнито' : 'Incognito Restricted Mode'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white flex items-center justify-center gap-2">
            <span>{isRu ? 'Что заблокировано?' : 'What is blocked?'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 font-bold max-w-lg mx-auto leading-relaxed">
            {isRu
              ? 'Каждый пункт — это функция, которая требует полноценный аккаунт. В режиме Инкогнито все данные изолированы только в этой сессии браузера.'
              : 'Each item below is a feature that requires a full account. In Incognito mode, all data is isolated only to this browser session.'}
          </p>
        </div>

        {/* 10 ОКТЯБРЯ 2026 CLOSURE & EXPORT NOTICE BANNER */}
        <div className={`mt-3 p-3.5 rounded-2xl border ${
          isClosed 
            ? 'bg-rose-950/50 border-rose-500/60 text-rose-200' 
            : 'bg-amber-950/40 border-amber-500/60 text-amber-200'
        } shrink-0 space-y-2 text-left`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{isClosed ? '🛑' : '🚫'}</span>
              <h4 className="font-black text-xs sm:text-sm uppercase tracking-wide">
                {getIncognitoClosureTitle(language)}
              </h4>
            </div>
            {(onOpenExport || user) && (
              <button
                type="button"
                onClick={handleExportClick}
                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow cursor-pointer"
              >
                <span>💾</span>
                <span>{isRu ? 'Экспорт данных' : 'Export Data'}</span>
              </button>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-amber-200 font-bold">
              {isRu
                ? '10 октября 2026 года вход в Режим Инкогнито недоступен, и его нельзя будет восстановить в DuoWindo6601.'
                : 'On October 10, 2026, entry into Incognito Mode is unavailable and cannot be restored in DuoWindo6601.'}
            </p>
            <p className="text-xs text-gray-300 font-medium">
              {isRu
                ? 'Синхронизирован актуальный статус не закрытия: Полный Вход и регистрация работают без ограничений, профиль Администратора доступен.'
                : 'Synchronized actual unclosed status: Full Sign-In & registration operate normally, Admin profile is active.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-bold pt-1">
            <span className="bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 px-2.5 py-1 rounded-xl flex items-center space-x-1.5 shadow-sm">
              <span>✅</span>
              <span>{isRu ? 'Полный Вход и регистрация: НЕ ЗАКРЫТ (Работает)' : 'Full Sign-In & Registration: NOT CLOSED (Active)'}</span>
            </span>
            <span className="bg-amber-950/90 text-amber-300 border border-amber-500/60 px-2.5 py-1 rounded-xl flex items-center space-x-1.5 shadow-sm">
              <span>👑</span>
              <span>{isRu ? 'Профиль Администратора: НЕ ЗАКРЫТ' : 'Admin Profile: NOT CLOSED'}</span>
            </span>
          </div>
        </div>

        {/* 8 RESTRICTIONS LIST */}
        <div className="overflow-y-auto my-3 pr-1 sm:pr-2 space-y-3 flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {INCOGNITO_RESTRICTIONS.map((item, idx) => (
              <div
                key={item.id}
                className="bg-gray-900/90 border border-gray-800 hover:border-amber-500/40 rounded-2xl p-3.5 sm:p-4 transition-all hover:bg-gray-800/80 flex flex-col justify-between group shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl sm:text-2xl p-1.5 bg-black/40 rounded-xl border border-gray-800">
                        {item.icon}
                      </span>
                      <div>
                        <span className="text-[10px] text-gray-500 font-mono font-bold block">
                          #{idx + 1}
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition-colors leading-tight">
                          {isRu ? item.titleRu : item.titleEn}
                        </h4>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border shrink-0 ${item.badgeColor}`}
                    >
                      {isRu ? item.statusRu : item.statusEn}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-400 font-medium leading-relaxed mt-1">
                    {isRu ? item.descRu : item.descEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="pt-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                playSound('click');
                onClose();
                onOpenRegister('register');
              }}
              className="flex-1 sm:flex-initial px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
            >
              <span>👤</span>
              <span>{isRu ? 'Зарегистрироваться' : 'Register Free'}</span>
            </button>
            <button
              onClick={() => {
                playSound('click');
                onClose();
                onOpenRegister('login');
              }}
              className="flex-1 sm:flex-initial px-4 py-3 bg-duo-blue hover:bg-sky-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider border-b-4 border-duo-blueDark active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center space-x-1.5 shadow-lg cursor-pointer"
            >
              <span>🔑</span>
              <span>{isRu ? 'Полный Вход' : 'Full Sign-In'}</span>
            </button>
            {(onOpenExport || user) && (
              <button
                onClick={handleExportClick}
                className="flex-1 sm:flex-initial px-4 py-3 bg-sky-700 hover:bg-sky-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider border-b-4 border-sky-900 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center space-x-1.5 shadow-lg cursor-pointer"
              >
                <span>💾</span>
                <span>{isRu ? 'Экспорт' : 'Export'}</span>
              </button>
            )}
          </div>

          {isClosed ? (
            <button
              onClick={() => {
                playSound('click');
                onClose();
                onOpenRegister('login');
              }}
              className="w-full sm:w-auto px-4 py-3 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wider cursor-pointer"
            >
              {isRu ? 'Вход закрыт с 10.10.2026 • Полный Вход ↗' : 'Entry closed since 10.10.2026 • Full Login ↗'}
            </button>
          ) : (
            <button
              onClick={() => {
                playSound('click');
                onClose();
              }}
              className="w-full sm:w-auto px-4 py-3 text-xs font-bold text-gray-400 hover:text-gray-200 transition-colors uppercase tracking-wider cursor-pointer"
            >
              {isRu ? 'Продолжить как Инкогнито ↗' : 'Continue Incognito ↗'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
