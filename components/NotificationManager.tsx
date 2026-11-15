import React, { useState, useEffect } from 'react';
import { UserProgress } from '../types';
import { VolumeIcon, CheckCircleIcon, WarningIcon, CloseIcon, SparklesIcon, LightningIcon } from './Icons';
import { 
  getTimeOfDay, 
  getMascotMotivationalNotification, 
  sendMascotPushNotification, 
  TimeOfDay 
} from '../services/mascotNotificationService';


interface NotificationManagerProps {
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  isLightMode?: boolean;
  playSound?: (sound: string) => void;
  setToast?: (msg: string | null) => void;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  user,
  setUser,
  isLightMode = false,
  playSound = () => {},
  setToast = () => {}
}) => {
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [selectedTime, setSelectedTime] = useState<string>(user.notificationTime || '20:00');
  const [testSent, setTestSent] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const isRu = user.language !== 'en';
  const userName = user.name || 'Тимур';

  // Sync selected time if user profile changes
  useEffect(() => {
    if (user.notificationTime) {
      setSelectedTime(user.notificationTime);
    }
  }, [user.notificationTime]);

  // Check current notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  // Request browser notification permission for PC & Mobile
  const handleRequestPermission = async () => {
    playSound('select');
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setToast(isRu ? '❌ Ваш браузер не поддерживает Web Notifications' : '❌ Your browser does not support Web Notifications');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermissionState(result);

      if (result === 'granted') {
        playSound('success');
        setToast(isRu ? '🔔 Доступ к уведомлениям успешно предоставлен!' : '🔔 Notification permission granted!');
        
        // Save preference to user profile & localStorage
        setUser(prev => {
          const updated: UserProgress = { ...prev, isBetaTester: true, notificationTime: selectedTime };
          try {
            localStorage.setItem('duowindo6601_user_progress_v1', JSON.stringify(updated));
            localStorage.setItem('duowindo6601_notifications_enabled', 'true');
            localStorage.setItem('duowindo6601_notification_time', selectedTime);
          } catch {}
          return updated;
        });

        // Fire initial welcome/test notification
        sendWelcomeNotification();
      } else if (result === 'denied') {
        playSound('wrong');
        setToast(isRu ? '🚫 Уведомления заблокированы в настройках браузера' : '🚫 Notifications blocked in browser settings');
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  };

  // Save selected reminder time
  const handleSaveTime = () => {
    playSound('success');
    setUser(prev => {
      const updated: UserProgress = { ...prev, notificationTime: selectedTime };
      try {
        localStorage.setItem('duowindo6601_user_progress_v1', JSON.stringify(updated));
        localStorage.setItem('duowindo6601_notification_time', selectedTime);
      } catch {}
      return updated;
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);

    setToast(
      isRu 
        ? `⏰ Время ежедневного напоминания сохранено: ${selectedTime}!` 
        : `⏰ Daily reminder time saved: ${selectedTime}!`
    );
  };

  // Send a test notification
  const sendWelcomeNotification = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification('🦉 DuoWindo6601', {
          body: isRu 
            ? `Отлично, ${userName}! Уведомления активированы на ПК и смартфоне. Время напоминания: ${selectedTime}! 🔔` 
            : `Great job, ${userName}! Notifications enabled on PC & Mobile. Reminder time: ${selectedTime}! 🔔`,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'duowindo6601-welcome'
        });

        notif.onclick = () => {
          window.focus();
        };

        setTestSent(true);
        setTimeout(() => setTestSent(false), 4000);
      } catch (err) {
        // Fallback for ServiceWorker registration if desktop constructor blocked
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification('🦉 DuoWindo6601', {
              body: isRu ? `Отлично, ${userName}! Уведомления активированы на ${selectedTime} 🔔` : `Notifications enabled for ${selectedTime} 🔔`,
              icon: '/pwa-192x192.png'
            });
          });
        }
      }
    }
  };

  const timeOptions = ['07:00', '09:00', '12:00', '15:00', '18:00', '20:00', '21:00', '22:00'];

  return (
    <div className={`p-5 sm:p-6 rounded-3xl border-2 transition-all shadow-xl text-left my-4 ${
      isLightMode ? 'bg-white border-indigo-200 shadow-md' : 'bg-gray-850/90 border-indigo-500/50 shadow-2xl'
    }`}>
      
      {/* Top Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border-2 border-indigo-500/40 flex items-center justify-center text-2xl shrink-0 shadow-inner">
            🔔
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-black text-base sm:text-lg text-white uppercase tracking-wider">
                {isRu ? 'Напоминания и Уведомления (ПК и Мобильный)' : 'Reminders & Notifications (PC & Mobile)'}
              </h3>
              <span className="bg-indigo-500/30 text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-indigo-500/50 uppercase">
                PC & Mobile 📱💻
              </span>
            </div>
            <p className="text-xs text-gray-300 font-medium mt-0.5 leading-relaxed">
              {isRu 
                ? 'Разрешите доступ к пуш-уведомлениям, чтобы DuoWindo6601 напоминал вам о уроках и спасал ваш ударный режим каждый день!'
                : 'Grant push notification access to get daily lesson reminders and keep your streak safe on PC and phone!'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="shrink-0">
          {permissionState === 'granted' ? (
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
              <span>{isRu ? 'Разрешено 🔔' : 'Granted 🔔'}</span>
            </span>
          ) : permissionState === 'denied' ? (
            <span className="bg-red-500/20 text-red-300 border border-red-500/50 px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5">
              <WarningIcon className="w-4 h-4 text-red-400" />
              <span>{isRu ? 'Заблокировано 🚫' : 'Blocked 🚫'}</span>
            </span>
          ) : (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/50 px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5">
              <span>⚠️ {isRu ? 'Требуется доступ' : 'Access needed'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Action Box */}
      {permissionState !== 'granted' ? (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-3 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-indigo-200 font-bold">
              {isRu 
                ? '📢 Нажмите кнопку ниже, чтобы включить уведомления на вашем компьютере или телефоне:' 
                : '📢 Tap the button below to enable notifications on your PC or smartphone:'}
            </span>
          </div>

          <button
            onClick={handleRequestPermission}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>🔔</span>
            <span>{isRu ? 'ВКЛЮЧИТЬ УВЕДОМЛЕНИЯ И ДАТЬ ДОСТУП' : 'ENABLE NOTIFICATIONS & GRANT ACCESS'}</span>
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-emerald-300 font-bold">
              {isRu ? '✅ Уведомления активны! Вы можете отправить тестовое уведомление прямо сейчас:' : '✅ Notifications active! Send a test push notification anytime:'}
            </span>
            {testSent && (
              <span className="text-[10px] bg-emerald-500 text-black font-black px-2 py-0.5 rounded animate-bounce">
                {isRu ? 'Отправлено! 🔔' : 'Sent! 🔔'}
              </span>
            )}
          </div>

          <button
            onClick={() => {
              playSound('click');
              sendWelcomeNotification();
            }}
            className="w-full sm:w-auto py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>🔔</span>
            <span>{isRu ? 'Проверить работу уведомлений (Тест)' : 'Test Push Notification'}</span>
          </button>
        </div>
      )}

      {/* Reminder Time Picker & Save Button */}
      <div className="space-y-3 pt-3 border-t border-gray-700/60">
        <div className="flex items-center justify-between text-xs font-bold text-gray-300 flex-wrap gap-1">
          <span>⏰ {isRu ? 'Выберите удобное время ежедневного напоминания:' : 'Select daily reminder time:'}</span>
          <span className="font-mono text-indigo-300 font-black px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/40">
            {selectedTime}
          </span>
        </div>

        {/* 8 TIME OPTIONS (INCLUDING 07:00) */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {timeOptions.map(time => {
            const isSelected = selectedTime === time;
            return (
              <button
                key={time}
                type="button"
                onClick={() => {
                  playSound('click');
                  setSelectedTime(time);
                }}
                className={`py-2 px-1.5 rounded-xl text-xs font-mono font-black transition-all cursor-pointer border text-center ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-400/50 scale-105'
                    : 'bg-black/40 hover:bg-black/60 border-gray-700 text-gray-300 hover:text-white'
                }`}
              >
                {time}
              </button>
            );
          })}
        </div>

        {/* SAVE TIME BUTTON */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleSaveTime}
            className="w-full sm:flex-1 py-3 px-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>💾</span>
            <span>{isRu ? 'СОХРАНИТЬ ВРЕМЯ НАПОМИНАНИЯ' : 'SAVE REMINDER TIME'}</span>
          </button>

          {isSaved && (
            <div className="text-xs font-black text-emerald-400 bg-emerald-950/80 border border-emerald-500/50 px-3 py-2 rounded-xl flex items-center space-x-1.5 animate-in fade-in duration-200">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
              <span>{isRu ? `Время ${selectedTime} сохранено!` : `Time ${selectedTime} saved!`}</span>
            </div>
          )}
        </div>
      </div>

      {/* MASCOT MOTIVATIONAL PUSH NOTIFICATIONS SECTION */}
      <MascotNotificationSection user={user} isRu={isRu} playSound={playSound} setToast={setToast} />

    </div>
  );
};

// Interactive Mascot Motivational Push Notification Component
const MascotNotificationSection: React.FC<{
  user: UserProgress;
  isRu: boolean;
  playSound: (sound: string) => void;
  setToast: (msg: string | null) => void;
}> = ({ user, isRu, playSound, setToast }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimeOfDay>(() => getTimeOfDay());
  const [sentSuccess, setSentSuccess] = useState<boolean>(false);

  const currentStreak = user.streak || 0;
  const currentMsg = getMascotMotivationalNotification(user, selectedPeriod);

  const handleSendMascotNotification = () => {
    playSound('select');
    const sent = sendMascotPushNotification(user, selectedPeriod);
    if (sent) {
      playSound('success');
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 3500);
      setToast(
        isRu 
          ? `🦉 Мотивационное уведомление от Совёнка Duo отправлено! (${currentStreak} дн. серии)` 
          : `🦉 Duo Mascot motivational notification sent! (${currentStreak}d streak)`
      );
    } else {
      playSound('wrong');
      setToast(
        isRu 
          ? '⚠️ Сначала включите разрешения на уведомления выше!' 
          : '⚠️ Please enable notification permissions above first!'
      );
    }
  };

  const timePeriodLabels: { id: TimeOfDay; icon: string; labelRu: string; labelEn: string }[] = [
    { id: 'morning', icon: '🌅', labelRu: 'Утро (05:00-11:59)', labelEn: 'Morning' },
    { id: 'afternoon', icon: '☀️', labelRu: 'День (12:00-17:59)', labelEn: 'Afternoon' },
    { id: 'evening', icon: '🌆', labelRu: 'Вечер (18:00-21:59)', labelEn: 'Evening' },
    { id: 'night', icon: '🌙', labelRu: 'Ночь (22:00-04:59)', labelEn: 'Night' },
  ];

  return (
    <div className="mt-5 pt-4 border-t border-indigo-500/30 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2.5">
          <span className="text-2xl p-2 bg-indigo-950/80 rounded-xl border border-indigo-500/40">🦉</span>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-extrabold text-sm sm:text-base text-white uppercase tracking-wider">
                {isRu ? 'Мотивационные пуш-уведомления от Совёнка Duo' : 'Duo Mascot Motivational Push Notifications'}
              </h4>
              <span className="bg-amber-500/30 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded border border-amber-500/40 uppercase">
                🔥 {currentStreak} {isRu ? 'дн. серии' : 'd streak'}
              </span>
            </div>
            <p className="text-xs text-gray-300 font-medium">
              {isRu 
                ? 'Персонализированные напоминания от маскота DuoWindo6601 с учётом ударного режима и времени суток'
                : 'Personalized mascot reminders tailored to your current streak and local time of day'}
            </p>
          </div>
        </div>
      </div>

      {/* Time of Day Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {timePeriodLabels.map(period => {
          const isSelected = selectedPeriod === period.id;
          return (
            <button
              key={period.id}
              type="button"
              onClick={() => {
                playSound('click');
                setSelectedPeriod(period.id);
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer border ${
                isSelected
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black border-yellow-300 font-black shadow-md scale-[1.02]'
                  : 'bg-black/40 hover:bg-black/60 border-gray-700 text-gray-300 hover:text-white'
              }`}
            >
              <span>{period.icon}</span>
              <span className="truncate">{isRu ? period.labelRu : period.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Notification Preview Box */}
      <div className="bg-indigo-950/40 border border-indigo-400/40 rounded-2xl p-4 space-y-2 relative overflow-hidden shadow-inner">
        <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 uppercase tracking-wider">
          <span className="flex items-center space-x-1">
            <span>{currentMsg.emoji}</span>
            <span>{isRu ? 'Предпросмотр уведомления Совёнка Duo' : 'Duo Mascot Notification Preview'}</span>
          </span>
          <span className="bg-black/40 text-gray-400 px-2 py-0.5 rounded font-mono text-[10px]">
            {selectedPeriod.toUpperCase()} • STREAK #{currentStreak}
          </span>
        </div>

        <div className="p-3 bg-black/60 rounded-xl border border-gray-700/80 space-y-1">
          <div className="font-extrabold text-sm text-white flex items-center space-x-2">
            <span>{currentMsg.title}</span>
          </div>
          <p className="text-xs text-gray-200 font-medium leading-relaxed">
            {currentMsg.body}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSendMascotNotification}
          className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border-b-4 border-amber-800 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
        >
          <span>🦉</span>
          <span>{isRu ? 'ОТПРАВИТЬ МОТИВАЦИОННОЕ УВЕДОМЛЕНИЕ (ТЕСТ)' : 'SEND MASCOT MOTIVATIONAL PUSH (TEST)'}</span>
        </button>

        {sentSuccess && (
          <div className="text-center text-xs font-black text-emerald-400 bg-emerald-950/90 border border-emerald-500/60 py-1.5 rounded-lg animate-bounce mt-1">
            {isRu ? '🎉 Пуш-уведомление от Совёнка Duo успешно отправлено!' : '🎉 Duo Mascot Push Notification sent!'}
          </div>
        )}
      </div>
    </div>
  );
};


// Prominent Standalone Notification Permission Banner for Top of App
export const NotificationPromptBanner: React.FC<{
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  setToast?: (msg: string | null) => void;
  playSound?: (sound: string) => void;
}> = ({ user, setUser, setToast = () => {}, playSound = () => {} }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  const isRu = user.language !== 'en';
  const userName = user.name || 'Тимур';

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  if (permission === 'granted' || isDismissed) return null;

  const handleEnable = async () => {
    playSound('select');
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setPermission(res);
        if (res === 'granted') {
          playSound('success');
          setToast(isRu ? '🔔 Уведомления DuoWindo6601 включены!' : '🔔 DuoWindo6601 Notifications enabled!');
          new Notification('🦉 DuoWindo6601', {
            body: isRu ? `Привет, ${userName}! Напоминания включены!` : `Hello, ${userName}! Reminders enabled!`,
            icon: '/pwa-192x192.png'
          });
        }
      } catch (err) {}
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-indigo-900 via-blue-900 to-purple-900 border-2 border-indigo-400/70 rounded-3xl p-4 shadow-xl my-3 text-white animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/30 border border-indigo-400 flex items-center justify-center text-xl shrink-0 shadow">
            🔔
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-sm block truncate text-indigo-200">
              {isRu ? `Разрешить доступ к уведомлениям, ${userName}?` : `Enable notifications, ${userName}?`}
            </span>
            <span className="text-xs text-gray-300 font-medium block truncate">
              {isRu ? 'Получайте каждый раз напоминания про уроки на ПК и Смартфоне!' : 'Get daily lesson reminders on PC and Smartphone!'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleEnable}
            className="py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
          >
            {isRu ? 'Разрешить 🔔' : 'Allow 🔔'}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
