import { UserProgress } from '../types';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export function getTimeOfDay(hour: number = new Date().getHours()): TimeOfDay {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

export interface MascotNotificationMessage {
  title: string;
  body: string;
  icon: string;
  badge: string;
  tag: string;
  emoji: string;
  timeOfDay: TimeOfDay;
}

export function getMascotMotivationalNotification(
  user: UserProgress,
  overrideTimeOfDay?: TimeOfDay
): MascotNotificationMessage {
  const streak = user.streak || 0;
  const userName = user.name || (user.language === 'en' ? 'Learner' : 'Тимур');
  const isRu = user.language !== 'en';
  const timeOfDay = overrideTimeOfDay || getTimeOfDay();

  let title = '';
  let body = '';
  let emoji = '🦉';

  if (streak === 0) {
    switch (timeOfDay) {
      case 'morning':
        emoji = '☀️';
        title = isRu ? '🦉 Совёнок Duo: Утренний старт!' : '🦉 Duo Mascot: Morning Start!';
        body = isRu 
          ? `Доброе утро, ${userName}! Утро — лучший момент начать ударный режим! Пройди 1 короткий урок ☀️` 
          : `Good morning, ${userName}! Morning is the best time to start your streak! Take a 1-min lesson ☀️`;
        break;
      case 'afternoon':
        emoji = '🍱';
        title = isRu ? '🦉 DuoWindo6601: Обеденный перерыв' : '🦉 Duo Mascot: Lunch Break';
        body = isRu 
          ? `Привет, ${userName}! Сделай 1 короткий урок в обед и зажги свою первую искорку! 🔥` 
          : `Hey ${userName}! Take a 2-minute lunch lesson and spark your first flame! 🔥`;
        break;
      case 'evening':
        emoji = '🌙';
        title = isRu ? '🦉 Совёнок Duo: Вечерняя тренировка' : '🦉 Duo Mascot: Evening Practice';
        body = isRu 
          ? `Вечер — идеальное время для языков, ${userName}! Зайди на 1 урок перед сном 🌙` 
          : `Evening is perfect for languages, ${userName}! Take 1 quick lesson tonight 🌙`;
        break;
      case 'night':
        emoji = '⚡';
        title = isRu ? '🦉 DuoWindo6601: Ночной вызов!' : '🦉 Duo Mascot: Night Challenge!';
        body = isRu 
          ? `Полночь близко, ${userName}! Начни свой ударный режим прямо сейчас 🦉✨` 
          : `Midnight is near, ${userName}! Start your daily streak right now 🦉✨`;
        break;
    }
  } else if (streak < 7) {
    switch (timeOfDay) {
      case 'morning':
        emoji = '🔥';
        title = isRu ? `🦉 Совёнок Duo: Серия ${streak} дн.!` : `🦉 Duo Mascot: ${streak}-Day Streak!`;
        body = isRu 
          ? `Доброе утро, ${userName}! У тебя уже ${streak} дн. серии! Защити свой огонёк с утра! 🔥` 
          : `Good morning, ${userName}! You're on a ${streak}-day streak! Keep it burning strong! 🔥`;
        break;
      case 'afternoon':
        emoji = '🎯';
        title = isRu ? `🦉 DuoWindo6601: Огонёк горит ${streak} дн.` : `🦉 Duo Mascot: ${streak}-Day Streak`;
        body = isRu 
          ? `Обеденная пауза, ${userName}! Твой огонёк серии (${streak} дн.) ждет 1 уроку! 🎯` 
          : `Lunch break, ${userName}! Your ${streak}-day streak is ready for a quick lesson! 🎯`;
        break;
      case 'evening':
        emoji = '🛡️';
        title = isRu ? `🦉 Совёнок Duo: Защити ${streak} дн.!` : `🦉 Duo Mascot: Protect ${streak} Days!`;
        body = isRu 
          ? `Не дай огоньку погаснуть, ${userName}! Твоя серия — ${streak} дн.! Урок займет 2 мин 🌙` 
          : `Don't let your flame fade, ${userName}! Your ${streak}-day streak needs you tonight! 🌙`;
        break;
      case 'night':
        emoji = '🚨';
        title = isRu ? `🦉 СРОЧНО: ${streak} дн. серии под угрозой!` : `🦉 ALERT: ${streak}-Day Streak in Danger!`;
        body = isRu 
          ? `🔥 Внимание, ${userName}! Твой ${streak}-дневный ударный режим сгорит скоро! Зайди на урок!` 
          : `🔥 Attention ${userName}! Your ${streak}-day streak expires soon! Complete 1 lesson now!`;
        break;
    }
  } else if (streak < 30) {
    switch (timeOfDay) {
      case 'morning':
        emoji = '🏆';
        title = isRu ? `🦉 Утро чемпиона: ${streak} дн.!` : `🦉 Champion Morning: ${streak} Days!`;
        body = isRu 
          ? `Доброе утро, ${userName}! Твоя недельная серия горит уже ${streak} дн.! Укрепи знания с утра! 🏆` 
          : `Good morning, ${userName}! Your week-long streak is up to ${streak} days! Practice now! 🏆`;
        break;
      case 'afternoon':
        emoji = '⚡';
        title = isRu ? `🦉 DuoWindo6601: ${streak} дн. подряд!` : `🦉 Duo Mascot: ${streak} Days Straight!`;
        body = isRu 
          ? `⚡ ${streak} дней подряд, ${userName}! Ты настоящий герой DuoWindo! Готов к быстрому уроку?` 
          : `⚡ ${streak} days in a row, ${userName}! You are unstoppable! Ready for a quick lesson?`;
        break;
      case 'evening':
        emoji = '🛡️';
        title = isRu ? `🦉 Совёнок Duo: Серия ${streak} дн.` : `🦉 Duo Mascot: ${streak}-Day Streak`;
        body = isRu 
          ? `🛡️ Твой ударный режим (${streak} дн.) ждет тебя, ${userName}! Не теряй достигнутый прогресс!` 
          : `🛡️ Your ${streak}-day streak is waiting for you, ${userName}! Don't lose your progress!`;
        break;
      case 'night':
        emoji = '🦉';
        title = isRu ? `🦉 Спаси серию ${streak} дн., ${userName}!` : `🦉 Save your ${streak}-Day Streak, ${userName}!`;
        body = isRu 
          ? `🦉 Ночной вызов! До полуночи осталось мало времени. Спаси свои ${streak} дней серии!` 
          : `🦉 Night alert! Time is ticking down. Save your ${streak}-day streak before midnight!`;
        break;
    }
  } else {
    // 30+ days Legend
    switch (timeOfDay) {
      case 'morning':
        emoji = '🌟';
        title = isRu ? `🦉 ЛЕГЕНДА: ${streak} ДНЕЙ СЕРИИ!` : `🦉 LEGENDARY: ${streak}-DAY STREAK!`;
        body = isRu 
          ? `🌟 Невероятно, ${userName}! ${streak} ДНЕЙ СЕРИИ! Совёнок Duo желает продуктивного утреннего урока!` 
          : `🌟 Incredible ${streak}-day streak, ${userName}! Duo Mascot wishes you a productive morning!`;
        break;
      case 'afternoon':
        emoji = '👑';
        title = isRu ? `🦉 DuoWindo6601: Титан серии (${streak} дн.)` : `🦉 Duo Mascot: Streak Titan (${streak}d)`;
        body = isRu 
          ? `👑 Легендарный огонёк (${streak} дн.)! Совёнок Duo гордится твоим постоянством, ${userName}!` 
          : `👑 Legendary ${streak}-day streak! Duo Mascot is super proud of your dedication, ${userName}!`;
        break;
      case 'evening':
        emoji = '🔥';
        title = isRu ? `🦉 Совёнок Duo: ${streak} дн. славы!` : `🦉 Duo Mascot: ${streak} Days of Glory!`;
        body = isRu 
          ? `🔥 ${streak} дней неустанного труда! Сохрани свой рекорд сегодня вечером, ${userName}!` 
          : `🔥 ${streak} days of hard work! Protect your record tonight, ${userName}!`;
        break;
      case 'night':
        emoji = '🚨';
        title = isRu ? `🦉 СРОЧНЫЙ ВЫЗОВ: ${streak} ДНЕЙ!` : `🦉 URGENT RESCUE: ${streak} DAYS!`;
        body = isRu 
          ? `🦉 ${userName}, твои ${streak} дней серии требуют 1 минуты внимания прямо сейчас! Не упусти!` 
          : `🦉 ${userName}, your ${streak}-day streak requires 1 minute right now! Don't let it slip!`;
        break;
    }
  }

  return {
    title,
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: `duowindo6601-mascot-motivation-${timeOfDay}`,
    emoji,
    timeOfDay,
  };
}

export function sendMascotPushNotification(user: UserProgress, overrideTimeOfDay?: TimeOfDay): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const msg = getMascotMotivationalNotification(user, overrideTimeOfDay);

  try {
    const options: NotificationOptions & { renotify?: boolean } = {
      body: msg.body,
      icon: msg.icon,
      badge: msg.badge,
      tag: msg.tag,
      renotify: true,
      data: {
        url: window.location.origin,
        timeOfDay: msg.timeOfDay,
        streak: user.streak || 0,
      }
    };
    const notif = new Notification(msg.title, options);

    notif.onclick = () => {
      window.focus();
    };
    return true;
  } catch (err) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(msg.title, {
          body: msg.body,
          icon: msg.icon,
          badge: msg.badge,
          tag: msg.tag,
        });
      });
      return true;
    }
  }
  return false;
}
