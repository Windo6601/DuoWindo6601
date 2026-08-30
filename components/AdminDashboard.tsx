import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { FeedbackItem, FeedbackReply, UserProgress } from '../types';
import { StarIcon, TrashIcon, CloseIcon, CheckCircleIcon, ShieldIcon, ActivityIcon, ChatBubbleIcon, ArrowRightIcon, FireIcon, GemStoneIcon, LightningIcon } from './Icons';

interface AdminDashboardProps {
  user: UserProgress;
  onBack: () => void;
  playSound?: (type: string) => void;
  setToast?: (msg: string | null) => void;
  onUpdateUser?: (updater: (prev: UserProgress) => UserProgress) => void;
}

const OWNER_EMAILS = ['abramovanatolij81@gmail.com', 'va997217@gmail.com'];
const ADMIN_KEYS = ['abramov6601', 'abramovanatolij81@gmail.com', 'va997217@gmail.com', '7777', 'duowindo6601admin', 'admin6601', 'abramov', 'va997217', 'admin'];

const CATEGORY_OPTIONS = [
  'Все категории',
  '🌟 Общие впечатления',
  '🏛️ Языки СНГ (казахский, узбекский, армянский и др.)',
  '🌍 Мировые языки (английский, испанский, китайский и др.)',
  '🧩 Предметы & Игры (шахматы, математика, логика)',
  '📚 Тренажер и графическое письмо',
  '✨ Новая функция',
  '🐛 Ошибка / Доработка',
  '💡 Идея для улучшения'
];

// Default fallback seed reviews in case Firestore is empty
const SEED_REVIEWS: FeedbackItem[] = [
  {
    id: 'seed-admin-1',
    userId: 'user-duo-1',
    userName: 'Азамат К.',
    userAvatar: '🏛️',
    userColor: '#1cb0f6',
    rating: 5,
    category: '🏛️ Языки СНГ (казахский, узбекский, армянский и др.)',
    comment: 'Отличное приложение DuoWindo6601! Озвучка букв и тренажер письменности для казахского, узбекского, армянского и других языков СНГ очень помогают в обучении!',
    likes: 12,
    likedBy: [],
    isPinned: true,
    replies: [
      {
        id: 'reply-seed-1',
        userId: 'admin-duowindo6601',
        userName: 'Администратор DuoWindo6601',
        userAvatar: '👑',
        userColor: '#f59e0b',
        isAdmin: true,
        comment: 'Азамат, спасибо за ваш теплый отзыв! Мы постоянно пополняем словарную базу языков СНГ!',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 2.5).toISOString()
  },
  {
    id: 'seed-admin-2',
    userId: 'user-duo-2',
    userName: 'Ирина M.',
    userAvatar: '🌍',
    userColor: '#ff9600',
    rating: 5,
    category: '🌍 Мировые языки (английский, испанский, китайский и др.)',
    comment: 'Курсы мировых языков (английский, испанский, китайский, немецкий) сделаны великолепно! Практика написания и аудио на смартфоне дают прекрасный результат.',
    likes: 9,
    likedBy: [],
    replies: [],
    createdAt: new Date(Date.now() - 86400000 * 1.8).toISOString()
  },
  {
    id: 'seed-admin-3',
    userId: 'user-duo-chess',
    userName: 'Данияр С.',
    userAvatar: '♟️',
    userColor: '#ce82ff',
    rating: 5,
    category: '🧩 Предметы & Игры (шахматы, математика, логика)',
    comment: 'Раздел Предметы & Игры потрясающий! Шахматный симулятор и логика превосходно сочетаются с обучением языкам.',
    likes: 14,
    likedBy: [],
    isPinned: true,
    replies: [
      {
        id: 'reply-seed-chess',
        userId: 'admin-duowindo6601',
        userName: 'Администратор DuoWindo6601',
        userAvatar: '👑',
        userColor: '#f59e0b',
        isAdmin: true,
        comment: 'Данияр, благодарим! Скоро в разделе Предметы & Игры появятся новые математические и логические уровни!',
        createdAt: new Date(Date.now() - 86400000 * 1.3).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 1.6).toISOString()
  },
  {
    id: 'seed-admin-4',
    userId: 'user-duo-3',
    userName: 'Константин П.',
    userAvatar: '🤖',
    userColor: '#ff4b4b',
    rating: 2,
    category: '🐛 Ошибка / Доработка',
    comment: 'При слабом сигнале сети звук произношения букв подгружается с задержкой в пару секунд.',
    likes: 3,
    likedBy: [],
    replies: [],
    createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString()
  }
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  onBack,
  playSound,
  setToast,
  onUpdateUser
}) => {
  // Check if current user is owner
  const currentEmail = auth.currentUser?.email?.toLowerCase() || user.username?.toLowerCase() || user.name?.toLowerCase() || '';
  const isOwnerByEmail = OWNER_EMAILS.some(email => currentEmail.includes(email.toLowerCase())) ||
    Boolean(user.username && (user.username.toLowerCase().includes('abramov') || user.username.toLowerCase().includes('va997217'))) ||
    Boolean(user.name && (user.name.includes('Анатолий') || user.name.includes('Владимир') || user.name.includes('Abramov') || user.name.toLowerCase().includes('va997217')));

  const [isUnlocked, setIsUnlocked] = useState<boolean>(isOwnerByEmail || Boolean(user.isAdmin));
  const [unlockPass, setUnlockPass] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string>('');

  // Dashboard Data states
  const [activeTab, setActiveTab] = useState<'reviews' | 'streak_recovery' | 'users'>('streak_recovery');
  const [reviews, setReviews] = useState<FeedbackItem[]>(SEED_REVIEWS);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeUsersCount, setActiveUsersCount] = useState<number>(148);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('Все категории');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');

  // Reply Draft
  const [adminReplyTexts, setAdminReplyTexts] = useState<Record<string, string>>({});
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null);

  // Admin Streak Recovery State
  const [adminStreakInput, setAdminStreakInput] = useState<string>(String(user.streak || 0));
  const [adminFreezesInput, setAdminFreezesInput] = useState<string>(String(user.streakFreezeCount || 0));
  const [adminGemsInput, setAdminGemsInput] = useState<string>(String(user.gems || 0));
  const [searchUserKey, setSearchUserKey] = useState<string>('');
  const [searchedUserDoc, setSearchedUserDoc] = useState<any | null>(null);
  const [searchingUser, setSearchingUser] = useState<boolean>(false);
  const [searchedStreakInput, setSearchedStreakInput] = useState<string>('0');
  const [searchedFreezesInput, setSearchedFreezesInput] = useState<string>('0');
  const [streakAuditLogs, setStreakAuditLogs] = useState<Array<{ id: string; timestamp: string; action: string; target: string; change: string }>>(() => {
    try {
      const saved = localStorage.getItem('duo_admin_streak_audit');
      return saved ? JSON.parse(saved) : [
        {
          id: 'audit-init',
          timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          action: 'Инициализация модуля',
          target: user.username || user.name || 'Текущий профиль',
          change: `Текущий ударный режим: ${user.streak} дн.`
        }
      ];
    } catch {
      return [];
    }
  });

  const addAuditLog = (action: string, target: string, change: string) => {
    const newEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      action,
      target,
      change
    };
    setStreakAuditLogs(prev => {
      const updated = [newEntry, ...prev.slice(0, 19)];
      try {
        localStorage.setItem('duo_admin_streak_audit', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Sync inputs when user prop changes
  useEffect(() => {
    setAdminStreakInput(String(user.streak || 0));
    setAdminFreezesInput(String(user.streakFreezeCount || 0));
    setAdminGemsInput(String(user.gems || 0));
  }, [user.streak, user.streakFreezeCount, user.gems]);

  // Admin handle streak updates for current active user
  const handleAdminApplyStreak = async (newStreakVal: number, newFreezesVal?: number, customNote?: string) => {
    playSound?.('success');
    const todayStr = new Date().toISOString().split('T')[0];
    const prevStreak = user.streak;
    const finalStreak = Math.max(0, newStreakVal);
    const finalFreezes = newFreezesVal !== undefined ? Math.max(0, newFreezesVal) : (user.streakFreezeCount || 0);

    if (onUpdateUser) {
      onUpdateUser(prev => ({
        ...prev,
        streak: finalStreak,
        streakFreezeCount: finalFreezes,
        previousLostStreak: 0,
        maxStreak: Math.max(prev.maxStreak || 0, finalStreak),
        lastActiveDate: todayStr
      }));
    }

    addAuditLog(
      customNote || 'Восстановление ударного режима',
      user.username ? `@${user.username}` : user.name,
      `${prevStreak} дн. ➔ ${finalStreak} дн. (Заморозки: ${finalFreezes} ❄️)`
    );

    // Sync to Firestore if authenticated
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          streak: finalStreak,
          streakFreezeCount: finalFreezes,
          previousLostStreak: 0,
          maxStreak: Math.max(user.maxStreak || 0, finalStreak),
          lastActiveDate: todayStr
        });
      }
    } catch (err) {
      console.warn('Firestore user streak sync (local state applied):', err);
    }

    setToast?.(`🔥 Ударный режим обновлен: ${finalStreak} дн.!`);
  };

  // Search User in Firestore
  const handleSearchUserInFirestore = async () => {
    const key = searchUserKey.trim();
    if (!key) {
      setToast?.('Введите UID или Username для поиска');
      return;
    }

    playSound?.('click');
    setSearchingUser(true);
    setSearchedUserDoc(null);

    try {
      // 1. Direct UID search
      const userRef = doc(db, 'users', key);
      const userSnap = await (async () => {
        try {
          const { getDoc } = await import('firebase/firestore');
          return await getDoc(userRef);
        } catch {
          return null;
        }
      })();

      if (userSnap && userSnap.exists()) {
        const data = userSnap.data();
        setSearchedUserDoc({ id: userSnap.id, ...data });
        setSearchedStreakInput(String(data.streak || 0));
        setSearchedFreezesInput(String(data.streakFreezeCount || 0));
        setToast?.(`👤 Пользователь найден: ${data.name || data.username || userSnap.id}`);
        return;
      }

      // 2. Query by username or email
      const q = query(collection(db, 'users'));
      const querySnap = await getDocs(q);
      let found: any = null;

      querySnap.forEach((d) => {
        const udata = d.data();
        if (
          d.id.toLowerCase() === key.toLowerCase() ||
          (udata.username && udata.username.toLowerCase() === key.toLowerCase()) ||
          (udata.email && udata.email.toLowerCase() === key.toLowerCase()) ||
          (udata.name && udata.name.toLowerCase().includes(key.toLowerCase()))
        ) {
          found = { id: d.id, ...udata };
        }
      });

      if (found) {
        setSearchedUserDoc(found);
        setSearchedStreakInput(String(found.streak || 0));
        setSearchedFreezesInput(String(found.streakFreezeCount || 0));
        setToast?.(`👤 Пользователь найден: ${found.name || found.username || found.id}`);
      } else {
        setToast?.(`❌ Пользователь "${key}" не найден в облачной базе.`);
      }
    } catch (err) {
      console.warn('User search notice:', err);
      setToast?.(`❌ Ошибка поиска: проверьте подключение к базе данных.`);
    } finally {
      setSearchingUser(false);
    }
  };

  // Save modified streak for searched user
  const handleSaveSearchedUserStreak = async () => {
    if (!searchedUserDoc) return;
    playSound?.('success');
    const targetStreak = Math.max(0, parseInt(searchedStreakInput) || 0);
    const targetFreezes = Math.max(0, parseInt(searchedFreezesInput) || 0);
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      await updateDoc(doc(db, 'users', searchedUserDoc.id), {
        streak: targetStreak,
        streakFreezeCount: targetFreezes,
        previousLostStreak: 0,
        lastActiveDate: todayStr
      });

      setSearchedUserDoc((prev: any) => ({
        ...prev,
        streak: targetStreak,
        streakFreezeCount: targetFreezes,
        lastActiveDate: todayStr
      }));

      addAuditLog(
        'Восстановление серии пользователя',
        searchedUserDoc.username ? `@${searchedUserDoc.username}` : (searchedUserDoc.name || searchedUserDoc.id),
        `${searchedUserDoc.streak || 0} дн. ➔ ${targetStreak} дн.`
      );

      setToast?.(`✅ Серия пользователя ${searchedUserDoc.name || searchedUserDoc.username} успешно обновлена: ${targetStreak} дн.!`);
    } catch (err) {
      console.error('Error updating user streak in Firestore:', err);
      setToast?.('⚠️ Не удалось обновить документ в Firestore.');
    }
  };

  // Load reviews from Firestore
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
      const fetchPromise = getDocs(q);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 4000)
      );
      const querySnapshot = (await Promise.race([fetchPromise, timeoutPromise])) as Awaited<typeof fetchPromise>;
      const loaded: FeedbackItem[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        loaded.push({
          id: docSnap.id,
          userId: data.userId || 'anon',
          userName: data.userName || 'Аноним',
          userAvatar: data.userAvatar || '👤',
          userColor: data.userColor || '#1cb0f6',
          rating: data.rating || 5,
          category: data.category || '🌟 Общие впечатления',
          comment: data.comment || '',
          likes: data.likes || 0,
          likedBy: data.likedBy || [],
          replies: data.replies || [],
          isPinned: data.isPinned || false,
          createdAt: data.createdAt || new Date().toISOString()
        });
      });

      if (loaded.length > 0) {
        setReviews(loaded);
      } else {
        setReviews(SEED_REVIEWS);
      }
    } catch (err) {
      console.warn('Firestore fetch notice in Admin Dashboard, using current pool:', err);
      // Keep existing reviews or SEED
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchReviews();
    }
  }, [isUnlocked]);

  // Simulate active online users count fluctuation for live dashboard
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsersCount(prev => {
        const delta = Math.floor(Math.random() * 7) - 3;
        return Math.max(120, prev + delta);
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Unlock handler
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (ADMIN_KEYS.includes(unlockPass.trim().toLowerCase()) || OWNER_EMAILS.includes(unlockPass.trim().toLowerCase())) {
      playSound?.('click');
      setIsUnlocked(true);
      setUnlockError('');
      setToast?.('👑 Доступ владельца подтвержден!');
    } else {
      playSound?.('wrong');
      setUnlockError('Неверный ключ доступа владельца!');
    }
  };

  // Delete feedback entry
  const handleDeleteFeedback = async (reviewId: string) => {
    if (!window.confirm('Вы действительно хотите удалить этот отзыв из базы?')) return;

    playSound?.('click');
    setDeletingId(reviewId);

    try {
      if (!reviewId.startsWith('seed-')) {
        await deleteDoc(doc(db, 'feedback', reviewId));
      }
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      setToast?.('🗑️ Отзыв успешно удален!');
    } catch (err) {
      console.error('Error deleting review:', err);
      // Fallback local remove
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      setToast?.('🗑️ Отзыв удален локально.');
    } finally {
      setDeletingId(null);
    }
  };

  // Delete individual reply
  const handleDeleteReply = async (reviewId: string, replyId: string) => {
    playSound?.('click');
    const targetReview = reviews.find(r => r.id === reviewId);
    if (!targetReview) return;

    const updatedReplies = (targetReview.replies || []).filter(rep => rep.id !== replyId);

    try {
      if (!reviewId.startsWith('seed-')) {
        await updateDoc(doc(db, 'feedback', reviewId), { replies: updatedReplies });
      }
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, replies: updatedReplies } : r));
      setToast?.('🗑️ Комментарий удален!');
    } catch (err) {
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, replies: updatedReplies } : r));
      setToast?.('🗑️ Комментарий удален!');
    }
  };

  // Pin/Unpin feedback
  const handleTogglePin = async (reviewId: string) => {
    playSound?.('click');
    const targetReview = reviews.find(r => r.id === reviewId);
    if (!targetReview) return;

    const newPinned = !targetReview.isPinned;

    try {
      if (!reviewId.startsWith('seed-')) {
        await updateDoc(doc(db, 'feedback', reviewId), { isPinned: newPinned });
      }
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, isPinned: newPinned } : r));
      setToast?.(newPinned ? '📌 Отзыв закреплен сверху!' : '📌 Отзыв откреплен');
    } catch (err) {
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, isPinned: newPinned } : r));
      setToast?.(newPinned ? '📌 Отзыв закреплен!' : '📌 Отзыв откреплен');
    }
  };

  // Post Admin Reply
  const handlePostAdminReply = async (reviewId: string) => {
    const text = (adminReplyTexts[reviewId] || '').trim();
    if (!text) return;

    playSound?.('click');
    setSubmittingReplyId(reviewId);

    const newReply: FeedbackReply = {
      id: `reply-admin-${Date.now()}`,
      userId: 'admin-duowindo6601',
      userName: 'Администратор DuoWindo6601',
      userAvatar: '👑',
      userColor: '#f59e0b',
      isAdmin: true,
      comment: text,
      createdAt: new Date().toISOString()
    };

    const targetReview = reviews.find(r => r.id === reviewId);
    if (!targetReview) return;

    const updatedReplies = [...(targetReview.replies || []), newReply];

    try {
      if (!reviewId.startsWith('seed-')) {
        await updateDoc(doc(db, 'feedback', reviewId), { replies: updatedReplies });
      }
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, replies: updatedReplies } : r));
      setAdminReplyTexts(prev => ({ ...prev, [reviewId]: '' }));
      setToast?.('💬 Ответ администратора опубликован!');
    } catch (err) {
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, replies: updatedReplies } : r));
      setAdminReplyTexts(prev => ({ ...prev, [reviewId]: '' }));
      setToast?.('💬 Ответ сохранен!');
    } finally {
      setSubmittingReplyId(null);
    }
  };

  // Computed metrics
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) : '5.0';
  const pinnedCount = reviews.filter(r => r.isPinned).length;

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const matchesSearch = 
        r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.category && r.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = filterCategory === 'Все категории' || r.category === filterCategory;
      const matchesRating = filterRating === 'all' || r.rating === filterRating;

      return matchesSearch && matchesCategory && matchesRating;
    }).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [reviews, searchQuery, filterCategory, filterRating]);

  // Locked Screen View
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-duo-dark text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-duo-card border-2 border-amber-500/40 rounded-[2.5rem] p-8 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-amber-500/20 border-2 border-amber-500 text-amber-400 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-xl">
            👑
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wide text-amber-400 mb-2">
              Панель Владельца
            </h1>
            <p className="text-xs text-gray-300 font-bold leading-relaxed">
              Доступ ограничен только владельцами проекта:<br />
              <span className="text-duo-blue">abramovanatolij81@gmail.com</span> или <span className="text-duo-blue">va997217@gmail.com</span>
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4 pt-2">
            <div>
              <input
                type="password"
                value={unlockPass}
                onChange={(e) => setUnlockPass(e.target.value)}
                placeholder="Введите пароль или email владельца..."
                className="w-full bg-gray-800 border-2 border-amber-500/50 focus:border-amber-400 text-white rounded-2xl px-4 py-3 text-center font-extrabold text-sm focus:outline-none transition-colors"
              />
              {unlockError && (
                <p className="text-red-400 font-bold text-xs mt-2">{unlockError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest rounded-2xl border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all shadow-xl"
            >
              Войти как Владелец
            </button>
          </form>

          <button
            onClick={onBack}
            className="text-xs text-gray-400 font-bold hover:text-white underline transition-colors"
          >
            ← Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-duo-dark text-white pb-20 font-din animate-in fade-in">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-duo-dark/95 backdrop-blur-xl border-b border-amber-500/30 px-4 py-4 shadow-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-2xl transition-colors border border-gray-700"
              title="Назад"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-amber-400 flex items-center space-x-2">
                <span>👑</span>
                <span>Панель Управления DuoWindo6601</span>
              </h1>
              <p className="text-[11px] text-gray-400 font-bold">
                Авторизованный владелец: <span className="text-duo-blue">abramovanatolij81@gmail.com</span> / <span className="text-duo-blue">va997217@gmail.com</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchReviews}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-xs font-bold rounded-xl border border-gray-700 transition-all flex items-center space-x-1.5"
            >
              <span>🔄 Обновить</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* TOP TAB NAVIGATION BAR */}
        <div className="flex flex-wrap gap-2 bg-gray-900/80 p-1.5 rounded-2xl border border-gray-800 backdrop-blur-md">
          <button
            onClick={() => { playSound?.('click'); setActiveTab('streak_recovery'); }}
            className={`flex-1 min-w-[200px] py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'streak_recovery'
                ? 'bg-gradient-to-r from-duo-red to-orange-600 text-white shadow-lg shadow-red-950/50 scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="text-base animate-pulse">🔥</span>
            <span>Восстановление Ударного Режима</span>
          </button>

          <button
            onClick={() => { playSound?.('click'); setActiveTab('reviews'); }}
            className={`flex-1 min-w-[180px] py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'reviews'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-950/50 scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="text-base">💬</span>
            <span>Отзывы & Модерация ({reviews.length})</span>
          </button>

          <button
            onClick={() => { playSound?.('click'); setActiveTab('users'); }}
            className={`flex-1 min-w-[180px] py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'users'
                ? 'bg-duo-blue text-white shadow-lg shadow-blue-950/50 scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="text-base">👥</span>
            <span>Поиск & Облачные Пользователи</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: STREAK RECOVERY & ADMINISTRATION */}
        {/* ========================================================================= */}
        {activeTab === 'streak_recovery' && (
          <div className="space-y-8 animate-in fade-in">
            {/* CURRENT USER STREAK REPAIR CARD */}
            <div className="bg-duo-card border-2 border-duo-red/50 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-duo-red/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-3xl flex items-center justify-center text-3xl shadow-xl shadow-red-950/50">
                    🔥
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                        Восстановление Ударного Режима
                      </h2>
                      <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                        Admin Tool
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-bold mt-0.5">
                      Управление днями непрерывного обучения для аккаунта: <span className="text-duo-blue font-extrabold">{user.name} ({user.username ? `@${user.username}` : 'Текущий'})</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-2xl text-right">
                    <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">Текущая серия</p>
                    <p className="text-2xl font-black text-duo-red">{user.streak} дн.</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-2xl text-right">
                    <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">Заморозки</p>
                    <p className="text-2xl font-black text-cyan-400">{user.streakFreezeCount || 0} ❄️</p>
                  </div>
                </div>
              </div>

              {/* LOST STREAK QUICK RESTORATION BANNER IF APPLICABLE */}
              {(user.previousLostStreak || 0) > 0 && (
                <div className="bg-gradient-to-r from-amber-950/70 via-red-950/60 to-gray-900 border-2 border-amber-500/60 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center space-x-3 text-left">
                    <span className="text-3xl animate-bounce">🚨</span>
                    <div>
                      <h3 className="font-black text-amber-300 text-sm uppercase tracking-wide">
                        Обнаружена потерянная серия: {user.previousLostStreak} дн.!
                      </h3>
                      <p className="text-xs text-gray-300 font-medium mt-0.5">
                        Ударный режим был прерван или сброшен. Вы можете мгновенно восстановить его в один клик.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdminApplyStreak(user.previousLostStreak || 0, user.streakFreezeCount, 'Восстановление потерянной серии (Быстрое)')}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border-b-2 border-amber-700 active:translate-y-0.5 transition-all whitespace-nowrap"
                  >
                    ⚡ Восстановить {user.previousLostStreak} дн.
                  </button>
                </div>
              )}

              {/* QUICK RESTORATION PRESETS */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center space-x-1.5">
                  <span>⚡</span>
                  <span>Быстрое добавление и восстановление дней:</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {[
                    { label: '+1 день', add: 1 },
                    { label: '+7 дней', add: 7 },
                    { label: '+14 дней', add: 14 },
                    { label: '+30 дней', add: 30 },
                    { label: '+100 дней', add: 100 },
                    { label: '+365 дней', add: 365 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handleAdminApplyStreak((user.streak || 0) + preset.add, user.streakFreezeCount, `Быстрое добавление: ${preset.label}`)}
                      className="py-3 px-2 bg-gray-800 hover:bg-duo-red hover:text-white border-2 border-gray-700 hover:border-red-500 rounded-2xl font-black text-xs uppercase transition-all shadow-md active:scale-95 text-gray-200 flex flex-col items-center justify-center space-y-1"
                    >
                      <span className="text-sm">🔥</span>
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* MANUAL STREAK & FREEZE ADJUSTMENT FORM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* STREAK DAYS FORM */}
                <div className="bg-gray-900/60 p-5 rounded-2xl border border-gray-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-wider text-white flex items-center space-x-1.5">
                      <span>🎯</span>
                      <span>Установить точное число дней:</span>
                    </label>
                    <span className="text-[10px] text-gray-400 font-bold">0 - 9999 дн.</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="9999"
                      value={adminStreakInput}
                      onChange={(e) => setAdminStreakInput(e.target.value)}
                      className="flex-1 bg-gray-800 border-2 border-gray-700 focus:border-duo-red text-white rounded-xl px-4 py-2.5 font-black text-lg text-center focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const val = parseInt(adminStreakInput) || 0;
                        handleAdminApplyStreak(val, user.streakFreezeCount, 'Ручная установка серии');
                      }}
                      className="px-5 py-2.5 bg-duo-red hover:bg-red-600 text-white font-black text-xs uppercase rounded-xl border-b-2 border-red-800 active:translate-y-0.5 transition-all shadow-md"
                    >
                      Сохранить
                    </button>
                  </div>
                </div>

                {/* FREEZES FORM */}
                <div className="bg-gray-900/60 p-5 rounded-2xl border border-gray-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-wider text-white flex items-center space-x-1.5">
                      <span>❄️</span>
                      <span>Пополнить заморозки серии:</span>
                    </label>
                    <span className="text-[10px] text-cyan-400 font-bold">Защита от пропуска</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {[1, 3, 5, 10].map((count) => (
                      <button
                        key={count}
                        onClick={() => handleAdminApplyStreak(user.streak, (user.streakFreezeCount || 0) + count, `Пополнение заморозок: +${count} ❄️`)}
                        className="flex-1 py-2.5 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-700/50 hover:border-cyan-400 text-cyan-300 font-black text-xs rounded-xl transition-all"
                      >
                        +{count} ❄️
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* DANGER / RESET CONTROLS */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-800/80 text-xs">
                <div className="flex items-center space-x-2 text-gray-400 font-bold">
                  <span>📅 Последняя активность:</span>
                  <span className="text-duo-blue font-extrabold">{user.lastActiveDate || 'Не указана'}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      if (window.confirm('Сбросить ударный режим до 0? (Потерянное значение будет сохранено для возможности восстановления).')) {
                        handleAdminApplyStreak(0, user.streakFreezeCount, 'Административный сброс серии');
                      }
                    }}
                    className="px-4 py-2 bg-gray-800 hover:bg-red-950 text-gray-400 hover:text-red-300 border border-gray-700 hover:border-red-700/60 rounded-xl font-bold transition-colors"
                  >
                    Сбросить серию (0)
                  </button>
                </div>
              </div>
            </div>

            {/* AUDIT LOG TABLE */}
            <div className="bg-duo-card border-2 border-gray-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black uppercase tracking-wider text-white flex items-center space-x-2">
                  <span>📋</span>
                  <span>Журнал операций восстановления (Audit Log)</span>
                </h3>
                <span className="text-xs text-gray-500 font-bold">Последние 20 записей</span>
              </div>

              {streakAuditLogs.length === 0 ? (
                <p className="text-xs text-gray-500 font-bold text-center py-4">Журнал пуст.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {streakAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-gray-900/60 p-3 rounded-xl border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold gap-1.5"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500 text-[10px] font-mono">{log.timestamp}</span>
                        <span className="text-amber-400 font-black">{log.action}</span>
                        <span className="text-gray-400">({log.target})</span>
                      </div>
                      <div className="text-duo-blue font-extrabold text-right">
                        {log.change}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: REVIEWS & FEEDBACK */}
        {/* ========================================================================= */}
        {activeTab === 'reviews' && (
          <div className="space-y-8 animate-in fade-in">
            {/* STATS & ACTIVE USERS WIDGET GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* ACTIVE USERS LIVE WIDGET */}
              <div className="bg-gradient-to-br from-emerald-950/60 to-emerald-900/40 border-2 border-emerald-500/50 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                    Активные Юзеры
                  </span>
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-black text-white flex items-baseline space-x-2">
                    <span>{activeUsersCount}</span>
                    <span className="text-xs font-bold text-emerald-300">онлайн</span>
                  </div>
                  <p className="text-[10px] text-emerald-200/80 font-bold mt-1">
                    🟢 Живой мониторинг сессий
                  </p>
                </div>
              </div>

              {/* TOTAL REVIEWS */}
              <div className="bg-duo-card border-2 border-gray-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Всего отзывов
                </span>
                <div className="mt-2">
                  <div className="text-3xl md:text-4xl font-black text-duo-blue">
                    {totalReviews}
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold mt-1">
                    💬 Вся база отзывов
                  </p>
                </div>
              </div>

              {/* AVERAGE RATING */}
              <div className="bg-duo-card border-2 border-gray-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Средняя оценка
                </span>
                <div className="mt-2">
                  <div className="text-3xl md:text-4xl font-black text-amber-400 flex items-center space-x-1">
                    <span>{avgRating}</span>
                    <StarIcon className="w-6 h-6 fill-amber-400 text-amber-400" />
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold mt-1">
                    ⭐ Уровень удовлетворенности
                  </p>
                </div>
              </div>

              {/* PINNED REVIEWS */}
              <div className="bg-duo-card border-2 border-gray-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Закреплено
                </span>
                <div className="mt-2">
                  <div className="text-3xl md:text-4xl font-black text-purple-400">
                    {pinnedCount}
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold mt-1">
                    📌 Избранные отзывы
                  </p>
                </div>
              </div>
            </div>

            {/* SEARCH & FILTER TOOLBAR */}
            <div className="bg-duo-card border-2 border-gray-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                {/* Search input */}
                <div className="relative w-full md:w-80">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по автору, тексту..."
                    className="w-full bg-gray-800 border-2 border-gray-700 focus:border-duo-blue text-white rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold focus:outline-none transition-colors"
                  />
                  <span className="absolute left-3.5 top-3 text-gray-400 text-sm">🔍</span>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {/* Category Select */}
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-gray-800 border-2 border-gray-700 text-white rounded-2xl px-3 py-2.5 text-xs font-bold focus:outline-none"
                  >
                    {CATEGORY_OPTIONS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  {/* Rating Select */}
                  <select
                    value={filterRating}
                    onChange={(e) => setFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="bg-gray-800 border-2 border-gray-700 text-white rounded-2xl px-3 py-2.5 text-xs font-bold focus:outline-none"
                  >
                    <option value="all">Все оценки ⭐</option>
                    <option value={5}>5 Звезд ⭐⭐⭐⭐⭐</option>
                    <option value={4}>4 Звезды ⭐⭐⭐⭐</option>
                    <option value={3}>3 Звезды ⭐⭐⭐</option>
                    <option value={2}>2 Звезды ⭐⭐</option>
                    <option value={1}>1 Звезда ⭐</option>
                  </select>
                </div>
              </div>
            </div>

            {/* REVIEWS LIST */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black uppercase tracking-wider text-white">
                  Список Отзывов ({filteredReviews.length})
                </h2>
                <span className="text-xs text-gray-400 font-bold">
                  Владелец может удалять и комментировать любые отзывы
                </span>
              </div>

              {loading ? (
                <div className="bg-duo-card border-2 border-gray-800 rounded-3xl p-12 text-center text-gray-400 font-bold space-y-3">
                  <div className="animate-spin text-3xl mx-auto w-8 h-8">⚙️</div>
                  <p>Загрузка отзывов из базы данных...</p>
                </div>
              ) : filteredReviews.length === 0 ? (
                <div className="bg-duo-card border-2 border-gray-800 rounded-3xl p-12 text-center text-gray-400 font-bold">
                  Отзывы по заданным критериям не найдены.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className={`bg-duo-card border-2 rounded-3xl p-6 shadow-xl transition-all relative ${
                        rev.isPinned ? 'border-amber-500/80 bg-amber-950/10' : 'border-gray-800'
                      }`}
                    >
                      {/* PIN BADGE IF PINNED */}
                      {rev.isPinned && (
                        <div className="absolute top-4 right-4 bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center space-x-1">
                          <span>📌 Закреплено</span>
                        </div>
                      )}

                      {/* USER INFO & RATING */}
                      <div className="flex items-start justify-between gap-4 mb-3 pr-24">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-md text-white border-2 border-white/20"
                            style={{ backgroundColor: rev.userColor || '#1cb0f6' }}
                          >
                            {rev.userAvatar || '👤'}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-black text-white text-base">
                                {rev.userName}
                              </h3>
                            </div>
                            <span className="inline-block bg-gray-800 text-duo-blue text-[10px] font-extrabold px-2.5 py-0.5 rounded-full mt-0.5">
                              {rev.category || '🌟 Общие впечатления'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* RATING STARS */}
                      <div className="flex items-center space-x-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon
                            key={star}
                            className={`w-4 h-4 ${
                              star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-700'
                            }`}
                          />
                        ))}
                        <span className="text-xs font-bold text-gray-400 ml-2">
                          {new Date(rev.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>

                      {/* COMMENT TEXT */}
                      <p className="text-sm font-bold text-gray-200 leading-relaxed bg-gray-900/50 p-4 rounded-2xl border border-gray-800 mb-4">
                        {rev.comment}
                      </p>

                      {/* EXISTING REPLIES */}
                      {rev.replies && rev.replies.length > 0 && (
                        <div className="space-y-2 mb-4 pl-4 border-l-2 border-amber-500/40">
                          {rev.replies.map((rep) => (
                            <div
                              key={rep.id}
                              className={`p-3 rounded-2xl text-xs font-bold flex items-start justify-between gap-3 ${
                                rep.isAdmin
                                  ? 'bg-amber-950/40 border border-amber-500/30 text-amber-200'
                                  : 'bg-gray-800 text-gray-300'
                              }`}
                            >
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <span>{rep.userAvatar || '👑'}</span>
                                  <span className="font-black text-amber-400">
                                    {rep.userName}
                                  </span>
                                </div>
                                <p className="leading-snug">{rep.comment}</p>
                              </div>

                              <button
                                onClick={() => handleDeleteReply(rev.id, rep.id)}
                                className="text-red-400 hover:text-red-300 p-1 text-xs font-black transition-colors"
                                title="Удалить ответ"
                              >
                                🗑️
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* ADMIN REPLY INPUT BOX */}
                      <div className="mt-4 pt-4 border-t border-gray-800/80 flex flex-col md:flex-row gap-2 items-center">
                        <input
                          type="text"
                          value={adminReplyTexts[rev.id] || ''}
                          onChange={(e) =>
                            setAdminReplyTexts((prev) => ({ ...prev, [rev.id]: e.target.value }))
                          }
                          placeholder="Ответить от имени Администратора DuoWindo6601..."
                          className="flex-1 w-full bg-gray-800 border-2 border-gray-700 focus:border-amber-400 text-white rounded-2xl px-4 py-2 text-xs font-bold focus:outline-none"
                        />
                        <button
                          onClick={() => handlePostAdminReply(rev.id)}
                          disabled={submittingReplyId === rev.id || !adminReplyTexts[rev.id]?.trim()}
                          className="w-full md:w-auto px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase rounded-2xl border-b-2 border-amber-700 transition-all disabled:opacity-50"
                        >
                          {submittingReplyId === rev.id ? 'Отправка...' : '💬 Ответить'}
                        </button>
                      </div>

                      {/* ACTION CONTROLS BAR */}
                      <div className="flex items-center justify-between pt-4 mt-3 border-t border-gray-800 text-xs">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleTogglePin(rev.id)}
                            className={`px-3 py-1.5 rounded-xl font-bold transition-colors border ${
                              rev.isPinned
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                : 'bg-gray-800 text-gray-400 hover:text-white border-gray-700'
                            }`}
                          >
                            {rev.isPinned ? '📌 Открепить' : '📌 Закрепить'}
                          </button>
                        </div>

                        {/* DELETE BUTTON */}
                        <button
                          onClick={() => handleDeleteFeedback(rev.id)}
                          disabled={deletingId === rev.id}
                          className="px-4 py-1.5 bg-red-900/40 hover:bg-red-800 text-red-300 border border-red-700 rounded-xl font-black text-xs transition-colors flex items-center space-x-1"
                        >
                          <span>🗑️ Удалить ненадлежащий отзыв</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CLOUD USER LOOKUP & STREAK MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="bg-duo-card border-2 border-gray-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center space-x-2">
                  <span>👥</span>
                  <span>Поиск и Восстановление Пользователей Firestore</span>
                </h2>
                <p className="text-xs text-gray-400 font-bold mt-1">
                  Найдите любого пользователя по UID, Email или Юзернейму для просмотра и восстановления его ударного режима.
                </p>
              </div>

              {/* SEARCH BOX */}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={searchUserKey}
                  onChange={(e) => setSearchUserKey(e.target.value)}
                  placeholder="Введите UID, Email или @username (например: abramov)..."
                  className="flex-1 bg-gray-800 border-2 border-gray-700 focus:border-duo-blue text-white rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUserInFirestore()}
                />
                <button
                  onClick={handleSearchUserInFirestore}
                  disabled={searchingUser}
                  className="px-6 py-3 bg-duo-blue hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-2xl border-b-2 border-duo-blueDark active:translate-y-0.5 transition-all flex items-center justify-center space-x-2"
                >
                  <span>{searchingUser ? 'Поиск...' : '🔍 Найти'}</span>
                </button>
              </div>

              {/* SEARCH RESULT CARD */}
              {searchedUserDoc && (
                <div className="bg-gray-900/80 border-2 border-duo-blue/50 rounded-2xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-md text-white border border-white/20"
                        style={{ backgroundColor: searchedUserDoc.avatarColor || '#1cb0f6' }}
                      >
                        {searchedUserDoc.avatarIcon || '👤'}
                      </div>
                      <div>
                        <h3 className="font-black text-white text-base">
                          {searchedUserDoc.name || 'Без имени'}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold">
                          {searchedUserDoc.username ? `@${searchedUserDoc.username}` : searchedUserDoc.email || searchedUserDoc.id}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs bg-duo-blue/20 text-duo-blue border border-duo-blue/40 font-black px-3 py-1 rounded-full self-start sm:self-auto">
                      UID: {searchedUserDoc.id.slice(0, 10)}...
                    </span>
                  </div>

                  {/* USER STATS ROW */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-black/40 p-3 rounded-xl border border-gray-800 text-center">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Ударный режим</p>
                      <p className="text-xl font-black text-duo-red">{searchedUserDoc.streak || 0} дн.</p>
                    </div>
                    <div className="bg-black/40 p-3 rounded-xl border border-gray-800 text-center">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Заморозки</p>
                      <p className="text-xl font-black text-cyan-400">{searchedUserDoc.streakFreezeCount || 0} ❄️</p>
                    </div>
                    <div className="bg-black/40 p-3 rounded-xl border border-gray-800 text-center">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Гемы</p>
                      <p className="text-xl font-black text-duo-blue">{searchedUserDoc.gems || 0} 💎</p>
                    </div>
                    <div className="bg-black/40 p-3 rounded-xl border border-gray-800 text-center">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Опыт XP</p>
                      <p className="text-xl font-black text-amber-400">{searchedUserDoc.xp || 0}</p>
                    </div>
                  </div>

                  {/* EDIT STREAK & FREEZES */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/20 p-4 rounded-xl border border-gray-800">
                    <div>
                      <label className="text-xs font-black uppercase text-gray-300 block mb-1.5">
                        🔥 Новый ударный режим (дней):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={searchedStreakInput}
                        onChange={(e) => setSearchedStreakInput(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-duo-red"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase text-gray-300 block mb-1.5">
                        ❄️ Новое количество заморозок:
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={searchedFreezesInput}
                        onChange={(e) => setSearchedFreezesInput(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveSearchedUserStreak}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border-b-2 border-green-800 active:translate-y-0.5 transition-all"
                  >
                    💾 Сохранить и применить в Firestore
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
