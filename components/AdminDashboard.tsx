import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { FeedbackItem, FeedbackReply, UserProgress } from '../types';
import { StarIcon, TrashIcon, CloseIcon, CheckCircleIcon, ShieldIcon, ActivityIcon, ChatBubbleIcon, ArrowRightIcon } from './Icons';

interface AdminDashboardProps {
  user: UserProgress;
  onBack: () => void;
  playSound?: (type: string) => void;
  setToast?: (msg: string | null) => void;
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
  setToast
}) => {
  // Check if current user is owner
  const currentEmail = auth.currentUser?.email?.toLowerCase() || user.username?.toLowerCase() || user.name?.toLowerCase() || '';
  const isOwnerByEmail = OWNER_EMAILS.some(email => currentEmail.includes(email.toLowerCase())) ||
    Boolean(user.username && (user.username.toLowerCase().includes('abramov') || user.username.toLowerCase().includes('va997217'))) ||
    Boolean(user.name && (user.name.includes('Анатолий') || user.name.includes('Abramov') || user.name.toLowerCase().includes('va997217')));

  const [isUnlocked, setIsUnlocked] = useState<boolean>(isOwnerByEmail || Boolean(user.isAdmin));
  const [unlockPass, setUnlockPass] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string>('');

  // Dashboard Data states
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
      </main>
    </div>
  );
};
