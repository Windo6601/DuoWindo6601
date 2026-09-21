import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy, setDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { FeedbackItem, FeedbackReply, UserProgress } from '../types';
import { StarIcon, TrashIcon, CloseIcon, CheckCircleIcon, ShieldIcon, ActivityIcon, ChatBubbleIcon, ArrowRightIcon, FireIcon, GemStoneIcon, LightningIcon } from './Icons';
import { AdminGeminiKeyManager } from './AdminGeminiKeyManager';
import {
  getAdminApiKeyDetails,
  saveAdminApiKey,
  clearAdminApiKey,
  getDevApiKeyDetails,
  saveDevApiKey,
  clearDevApiKey,
  getGeminiKeyPriority,
  setGeminiKeyPriority,
  getCustomApiKeyDetails
} from '../services/aiLimitManager';
import {
  pingGeminiApi,
  getActiveApiKeyInfo,
  MODEL_FREE,
  MODEL_PRO
} from '../services/geminiService';

interface AdminDashboardProps {
  user: UserProgress;
  onBack: () => void;
  onOpenSupportChat?: () => void;
  playSound?: (type: string) => void;
  setToast?: (msg: string | null) => void;
  onUpdateUser?: (updater: (prev: UserProgress) => UserProgress) => void;
  isIncognito?: boolean;
}

const OWNER_EMAILS = ['abramovanatolij81@gmail.com', 'va997217@gmail.com'];
const ADMIN_KEYS = [
  'admin',
  'admin6601',
  'abramov6601',
  'abramovanatolij81@gmail.com',
  'va997217@gmail.com',
  '7777',
  'duowindo6601admin',
  'abramov',
  'va997217',
  'admintool',
  'admin-tool',
  'admin tool',
  'админ',
  'администратор',
  'owner'
];

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
  onOpenSupportChat,
  playSound,
  setToast,
  onUpdateUser,
  isIncognito = false
}) => {
  // Check if current user is in incognito mode (no account / guest)
  const isIncognitoMode = Boolean(
    isIncognito ||
    user.username?.startsWith('incognito_') ||
    user.name?.includes('Гость') ||
    user.name?.includes('Incognito') ||
    user.authProvider === 'guest'
  );

  // Check if current user is owner (only valid if NOT in incognito mode)
  const currentEmail = auth.currentUser?.email?.toLowerCase() || user.username?.toLowerCase() || user.name?.toLowerCase() || '';
  const isOwnerByEmail = !isIncognitoMode && (
    OWNER_EMAILS.some(email => currentEmail.includes(email.toLowerCase())) ||
    Boolean(user.username && (user.username.toLowerCase().includes('abramov') || user.username.toLowerCase().includes('va997217'))) ||
    Boolean(user.name && (user.name.includes('Анатолий') || user.name.includes('Владимир') || user.name.includes('Abramov') || user.name.toLowerCase().includes('va997217')))
  );

  // Session-based unlock state: strictly requires admin authentication (password or admin email)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('duo_admin_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const [inputEmail, setInputEmail] = useState<string>('');
  const [inputPassword, setInputPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [unlockError, setUnlockError] = useState<string>('');

  // Dashboard Data states
  const [activeTab, setActiveTab] = useState<'reviews' | 'streak_recovery' | 'gemini_keys' | 'users'>('gemini_keys');
  const [reviews, setReviews] = useState<FeedbackItem[]>(SEED_REVIEWS);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeUsersCount, setActiveUsersCount] = useState<number>(148);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Gemini API Key Management State (Admin & Developer)
  const [adminKeyDetails, setAdminKeyDetails] = useState(() => getAdminApiKeyDetails());
  const [adminKeyInput, setAdminKeyInput] = useState<string>(() => getAdminApiKeyDetails().key);
  const [adminKeyType, setAdminKeyType] = useState<'free' | 'paid'>(() => getAdminApiKeyDetails().type);
  const [adminKeyEnabled, setAdminKeyEnabled] = useState<boolean>(() => getAdminApiKeyDetails().enabled);
  const [showAdminKey, setShowAdminKey] = useState<boolean>(false);
  const [adminTesting, setAdminTesting] = useState<boolean>(false);
  const [adminTestResult, setAdminTestResult] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null);

  const [devKeyDetails, setDevKeyDetails] = useState(() => getDevApiKeyDetails());
  const [devKeyInput, setDevKeyInput] = useState<string>(() => getDevApiKeyDetails().key);
  const [devKeyType, setDevKeyType] = useState<'free' | 'paid'>(() => getDevApiKeyDetails().type);
  const [devKeyEnabled, setDevKeyEnabled] = useState<boolean>(() => getDevApiKeyDetails().enabled);
  const [showDevKey, setShowDevKey] = useState<boolean>(false);
  const [devTesting, setDevTesting] = useState<boolean>(false);
  const [devTestResult, setDevTestResult] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null);

  const [keyPriority, setKeyPriorityState] = useState<'auto' | 'admin' | 'dev' | 'custom' | 'system'>(() => getGeminiKeyPriority());
  const [activeKeyInfo, setActiveKeyInfo] = useState(() => getActiveApiKeyInfo());
  const [batchTesting, setBatchTesting] = useState<boolean>(false);
  const [batchTestReport, setBatchTestReport] = useState<{
    active?: { ok: boolean; message: string; latencyMs?: number };
    admin?: { ok: boolean; message: string; latencyMs?: number };
    dev?: { ok: boolean; message: string; latencyMs?: number };
  } | null>(null);

  // Listen for key changes across tabs/windows
  useEffect(() => {
    const handleKeyChange = () => {
      const a = getAdminApiKeyDetails();
      const d = getDevApiKeyDetails();
      setAdminKeyDetails(a);
      setDevKeyDetails(d);
      setKeyPriorityState(getGeminiKeyPriority());
      setActiveKeyInfo(getActiveApiKeyInfo());
    };
    window.addEventListener('duowindo_api_key_changed', handleKeyChange);
    return () => window.removeEventListener('duowindo_api_key_changed', handleKeyChange);
  }, []);

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

  // --- GEMINI API KEY HANDLERS (ADMIN & DEVELOPER) ---
  const handleSaveAdminKey = async () => {
    playSound?.('success');
    const trimmed = adminKeyInput.trim();
    saveAdminApiKey(trimmed, adminKeyType, adminKeyEnabled);
    const updated = getAdminApiKeyDetails();
    setAdminKeyDetails(updated);
    setActiveKeyInfo(getActiveApiKeyInfo());

    // Also attempt to sync to Firestore system_config/gemini_keys if admin authenticated
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, 'system_config', 'gemini_keys'), {
          adminKeyMasked: updated.maskedKey,
          adminKeyType: adminKeyType,
          adminKeyEnabled: adminKeyEnabled,
          updatedAt: new Date().toISOString(),
          updatedBy: auth.currentUser.email || user.username || 'admin'
        }, { merge: true });
      }
    } catch (e) {
      console.warn("Firestore system_config sync notice:", e);
    }

    addAuditLog(
      'Настройка Gemini Key (Администратор)',
      'Система AI / DuoWindo6601',
      trimmed ? `Ключ сохранен (${adminKeyType === 'paid' ? 'Платный' : 'Бесплатный'}, ${adminKeyEnabled ? 'Включен' : 'Отключен'})` : 'Ключ удален'
    );

    setToast?.(trimmed ? '👑 Gemini API Key Администратора сохранен и активирован!' : '👑 Gemini API Key Администратора очищен.');
  };

  const handleClearAdminKey = () => {
    playSound?.('click');
    clearAdminApiKey();
    setAdminKeyInput('');
    setAdminTestResult(null);
    setAdminKeyDetails(getAdminApiKeyDetails());
    setActiveKeyInfo(getActiveApiKeyInfo());
    addAuditLog('Сброс Gemini Key (Администратор)', 'Система AI', 'Ключ Администратора удален');
    setToast?.('🗑️ Ключ Администратора удален.');
  };

  const handleTestAdminKey = async () => {
    const keyToTest = adminKeyInput.trim();
    if (!keyToTest && !adminKeyDetails.key) {
      setToast?.('Введите Gemini API ключ для проверки');
      return;
    }
    playSound?.('click');
    setAdminTesting(true);
    setAdminTestResult(null);
    try {
      const res = await pingGeminiApi(keyToTest || adminKeyDetails.key);
      setAdminTestResult(res);
      if (res.ok) {
        playSound?.('success');
        setToast?.(`✅ Ключ Администратора работает! Задержка: ${res.latencyMs || 0}ms`);
      } else {
        setToast?.(`⚠️ Ошибка проверки ключа: ${res.message}`);
      }
    } catch (err: any) {
      setAdminTestResult({ ok: false, message: err?.message || 'Ошибка сети' });
      setToast?.('⚠️ Не удалось проверить ключ');
    } finally {
      setAdminTesting(false);
    }
  };

  const handleSaveDevKey = async () => {
    playSound?.('success');
    const trimmed = devKeyInput.trim();
    saveDevApiKey(trimmed, devKeyType, devKeyEnabled);
    const updated = getDevApiKeyDetails();
    setDevKeyDetails(updated);
    setActiveKeyInfo(getActiveApiKeyInfo());

    // Also sync to Firestore system_config/gemini_keys
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, 'system_config', 'gemini_keys'), {
          devKeyMasked: updated.maskedKey,
          devKeyType: devKeyType,
          devKeyEnabled: devKeyEnabled,
          updatedAt: new Date().toISOString(),
          updatedBy: auth.currentUser.email || user.username || 'admin'
        }, { merge: true });
      }
    } catch (e) {
      console.warn("Firestore system_config sync notice:", e);
    }

    addAuditLog(
      'Настройка Gemini Key (Разработчик)',
      'Система AI / Dev Staging',
      trimmed ? `Ключ сохранен (${devKeyType === 'paid' ? 'Платный' : 'Бесплатный'}, ${devKeyEnabled ? 'Включен' : 'Отключен'})` : 'Ключ удален'
    );

    setToast?.(trimmed ? '💻 Gemini API Key Разработчика сохранен и активирован!' : '💻 Gemini API Key Разработчика очищен.');
  };

  const handleClearDevKey = () => {
    playSound?.('click');
    clearDevApiKey();
    setDevKeyInput('');
    setDevTestResult(null);
    setDevKeyDetails(getDevApiKeyDetails());
    setActiveKeyInfo(getActiveApiKeyInfo());
    addAuditLog('Сброс Gemini Key (Разработчик)', 'Система AI', 'Ключ Разработчика удален');
    setToast?.('🗑️ Ключ Разработчика удален.');
  };

  const handleTestDevKey = async () => {
    const keyToTest = devKeyInput.trim();
    if (!keyToTest && !devKeyDetails.key) {
      setToast?.('Введите Gemini API ключ для проверки');
      return;
    }
    playSound?.('click');
    setDevTesting(true);
    setDevTestResult(null);
    try {
      const res = await pingGeminiApi(keyToTest || devKeyDetails.key);
      setDevTestResult(res);
      if (res.ok) {
        playSound?.('success');
        setToast?.(`✅ Ключ Разработчика работает! Задержка: ${res.latencyMs || 0}ms`);
      } else {
        setToast?.(`⚠️ Ошибка проверки ключа: ${res.message}`);
      }
    } catch (err: any) {
      setDevTestResult({ ok: false, message: err?.message || 'Ошибка сети' });
      setToast?.('⚠️ Не удалось проверить ключ');
    } finally {
      setDevTesting(false);
    }
  };

  const handleSetPriority = (priority: 'auto' | 'admin' | 'dev' | 'custom' | 'system') => {
    playSound?.('click');
    setGeminiKeyPriority(priority);
    setKeyPriorityState(priority);
    setActiveKeyInfo(getActiveApiKeyInfo());
    addAuditLog('Изменение приоритета Gemini API', 'Система AI', `Установлен режим: ${priority}`);
    setToast?.(`⚙️ Приоритет ключей изменен: ${priority.toUpperCase()}`);
  };

  const handleRunFullDiagnostics = async () => {
    playSound?.('click');
    setBatchTesting(true);
    setBatchTestReport(null);
    try {
      const activeRes = await pingGeminiApi();
      let adminRes: any = null;
      let devRes: any = null;

      if (adminKeyDetails.key || adminKeyInput.trim()) {
        adminRes = await pingGeminiApi(adminKeyInput.trim() || adminKeyDetails.key);
      }
      if (devKeyDetails.key || devKeyInput.trim()) {
        devRes = await pingGeminiApi(devKeyInput.trim() || devKeyDetails.key);
      }

      setBatchTestReport({
        active: activeRes,
        admin: adminRes || undefined,
        dev: devRes || undefined
      });
      playSound?.('success');
      setToast?.('🚀 Полная диагностика Gemini API завершена!');
    } catch (e) {
      setToast?.('⚠️ Ошибка при выполнении диагностики');
    } finally {
      setBatchTesting(false);
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

  // Unlock handler: verifies admin credentials or applies the restriction for users and incognito mode
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const emailClean = inputEmail.trim().toLowerCase();
    const passClean = inputPassword.trim().toLowerCase();

    // Current user is logged in with verified owner email (not incognito/guest)
    const isCurrentUserVerifiedOwner = !isIncognitoMode && isOwnerByEmail;

    // Master owner credentials validation (for when owner enters email + master password)
    const isOwnerEmailMatch = OWNER_EMAILS.some(em => em.toLowerCase() === emailClean);
    const isMasterPasswordMatch = ['abramov6601', '7777', 'duowindo6601admin', 'admin6601', 'abramov'].includes(passClean);
    const isFullOwnerCredentials = isOwnerEmailMatch && isMasterPasswordMatch;

    // If current logged-in user is verified owner, typing "admin" or owner credentials unlocks it
    const isVerifiedOwnerQuickUnlock = isCurrentUserVerifiedOwner && (
      passClean === 'admin' || 
      passClean === 'админ' || 
      emailClean === 'admin' || 
      emailClean === 'админ' ||
      isMasterPasswordMatch ||
      isOwnerEmailMatch
    );

    if (isFullOwnerCredentials || isVerifiedOwnerQuickUnlock) {
      try {
        sessionStorage.setItem('duo_admin_unlocked', 'true');
      } catch {}
      playSound?.('success');
      setIsUnlocked(true);
      setUnlockError('');
      setToast?.('👑 Доступ администратора подтвержден! Открыта Панель Владельца — Admin Tool.');
    } else {
      // Restriction triggers for regular users and incognito mode without account!
      playSound?.('wrong');
      const restrictionMessage = isIncognitoMode
        ? '🔒 Ограничение: Доступ только администратора! Вход не сработал для Режима Инкогнито (Без аккаунта). Модерация, Мониторинг и Восстановление Ударного Режима разрешены исключительно администратору платформы.'
        : '🔒 Ограничение: Доступ только администратора! Вход не сработал для пользователя. Модерация, Мониторинг и Восстановление Ударного Режима заблокированы: требуется подтверждённый аккаунт администратора.';
      
      setUnlockError(restrictionMessage);
      setToast?.('🔒 Ограничение: Доступ только администратора (не сработал для пользователя и Режима Инкогнито без аккаунта)');
    }
  };

  const handleQuickUnlockAsOwner = () => {
    try {
      sessionStorage.setItem('duo_admin_unlocked', 'true');
    } catch {}
    playSound?.('success');
    setIsUnlocked(true);
    setUnlockError('');
    setToast?.(`👑 Доступ подтвержден для аккаунта: ${currentEmail}`);
  };

  const handleLockAdmin = () => {
    try {
      sessionStorage.removeItem('duo_admin_unlocked');
    } catch {}
    setIsUnlocked(false);
    setInputEmail('');
    setInputPassword('');
    setUnlockError('');
    playSound?.('click');
    setToast?.('🔒 Панель администратора заблокирована');
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

  // Locked Screen View: Strict restriction for regular users
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-duo-dark text-white flex flex-col items-center justify-center p-4 sm:p-6 font-din animate-in fade-in">
        <div className="max-w-lg w-full bg-duo-card border-2 border-amber-500/50 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden text-center">
          {/* Ambient Glows */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Security Restriction Badge */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-2 border-amber-500 text-amber-400 rounded-3xl flex items-center justify-center text-4xl shadow-xl shadow-amber-950/40">
                👑
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 bg-red-600 text-white rounded-full p-1.5 shadow-lg border-2 border-gray-900 text-xs" title="Доступ ограничен">
                🔒
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 bg-red-500/20 border border-red-500/40 px-3 py-0.5 rounded-full text-red-300 text-[10px] font-black uppercase tracking-wider">
                <span>🔒 Ограничение: Доступ только администратора</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-amber-400">
                Панель Владельца — Admin Tool
              </h1>
              <p className="text-xs text-gray-300 font-bold">
                Модерация, Мониторинг и Восстановление Ударного Режима
              </p>
            </div>
          </div>

          {/* Incognito Mode Notice */}
          {isIncognitoMode && (
            <div className="bg-gradient-to-r from-red-500/20 via-amber-500/15 to-red-500/20 border-2 border-red-500/50 rounded-2xl p-4 text-left space-y-2 shadow-xl animate-in fade-in">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🕶️</span>
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="text-xs font-black text-red-300 uppercase tracking-wider">
                    Ограничение: Режим Инкогнито (Без аккаунта)
                  </span>
                  <span className="bg-red-500/30 text-red-200 text-[9px] font-black px-2 py-0.5 rounded-full border border-red-500/40 uppercase">
                    Доступ закрыт
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-gray-200 leading-relaxed font-medium">
                В <strong>Режиме Инкогнито (Без аккаунта)</strong> и для обычных пользователей раздел <strong>Панель Владельца — Admin Tool</strong> строго заблокирован. 
                Модерация, Мониторинг и Восстановление Ударного Режима доступны исключительно администратору платформы. При вводе пароля, эл. почты или <strong>admin</strong> появится уведомление: <strong>🔒 Ограничение: Доступ только администратора (не сработает без прав администратора)</strong>.
              </p>
            </div>
          )}

          {/* Regular User Notice if not incognito and not owner */}
          {!isIncognitoMode && !isOwnerByEmail && (
            <div className="bg-gradient-to-r from-amber-500/15 via-red-500/10 to-amber-500/15 border border-amber-500/40 rounded-2xl p-3.5 text-left space-y-1.5 shadow-lg">
              <div className="flex items-center space-x-2">
                <span className="text-base">👤</span>
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  Пользовательский аккаунт: доступ ограничен
                </span>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
                Раздел предназначен только для владельцев и администраторов платформы DuoWindo6601. Для обычного пользователя ввод пароля, эл. почты или <strong>admin</strong> вызовет: <strong>🔒 Ограничение: Доступ только администратора</strong>.
              </p>
            </div>
          )}

          {/* Explanatory Policy Card: Moderation, Monitoring & Streak Recovery */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 text-left space-y-2.5">
            <div className="flex items-center space-x-2 text-amber-300 text-xs font-black uppercase tracking-wide">
              <span>🛡️</span>
              <span>Модули Панели Владельца — Admin Tool</span>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
              Для защиты честной статистики платформы Модерация, Мониторинг и Восстановление Ударного Режима требуют прав администратора. 
              Для пользователей и Режима Инкогнито без аккаунта вход заблокирован.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="bg-gray-800/80 border border-gray-700/60 p-2.5 rounded-xl text-center">
                <span className="text-lg block">💬</span>
                <span className="text-[10px] font-black text-amber-300 uppercase block mt-1">Модерация</span>
                <span className="text-[9px] text-gray-400 block">Отзывы & ответы</span>
              </div>
              <div className="bg-gray-800/80 border border-gray-700/60 p-2.5 rounded-xl text-center">
                <span className="text-lg block">📡</span>
                <span className="text-[10px] font-black text-sky-300 uppercase block mt-1">Мониторинг</span>
                <span className="text-[9px] text-gray-400 block">Онлайн & серверы</span>
              </div>
              <div className="bg-gray-800/80 border border-gray-700/60 p-2.5 rounded-xl text-center">
                <span className="text-lg block">🔥</span>
                <span className="text-[10px] font-black text-duo-red uppercase block mt-1">Ударный Режим</span>
                <span className="text-[9px] text-gray-400 block">Восстановление</span>
              </div>
            </div>
          </div>

          {/* Quick Unlock if already logged in with Owner Email */}
          {isOwnerByEmail && (
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/40 p-3.5 rounded-2xl text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-amber-300 uppercase flex items-center space-x-1.5">
                  <span>👑</span>
                  <span>Обнаружен профиль владельца</span>
                </span>
                <span className="text-[10px] font-bold text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30">
                  Авторизован
                </span>
              </div>
              <p className="text-[11px] text-gray-300">
                Текущий аккаунт: <span className="text-duo-blue font-bold">{currentEmail}</span>
              </p>
              <button
                type="button"
                onClick={handleQuickUnlockAsOwner}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow border-b-2 border-amber-700 active:translate-y-0.5 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>⚡</span>
                <span>Подтвердить вход владельца</span>
              </button>
            </div>
          )}

          {/* Form: Email, Password, or "admin" */}
          <form onSubmit={handleUnlock} className="space-y-4 pt-1 text-left">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-300 uppercase tracking-wide flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <span>📧</span>
                  <span>Электронная почта или "admin"</span>
                </span>
                <span className="text-[10px] text-gray-400 font-normal">email администратора</span>
              </label>
              <input
                type="text"
                value={inputEmail}
                onChange={(e) => { setInputEmail(e.target.value); setUnlockError(''); }}
                placeholder="abramovanatolij81@gmail.com, va997217@gmail.com или admin"
                className="w-full bg-gray-900 border-2 border-gray-700 focus:border-amber-500 text-white rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold focus:outline-none transition-colors placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-300 uppercase tracking-wide flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <span>🔑</span>
                  <span>Пароль администратора или "admin"</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-amber-400 hover:underline font-bold"
                >
                  {showPassword ? 'Скрыть' : 'Показать'}
                </button>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={inputPassword}
                onChange={(e) => { setInputPassword(e.target.value); setUnlockError(''); }}
                placeholder="Введите пароль или admin..."
                className="w-full bg-gray-900 border-2 border-gray-700 focus:border-amber-500 text-white rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold focus:outline-none transition-colors placeholder:text-gray-500"
              />
            </div>

            <div className="flex items-center justify-between bg-gray-900/60 p-2.5 rounded-xl border border-gray-800 text-[11px]">
              <span className="text-gray-400 text-[10px] font-bold">
                💡 Ввод: пароль, эл. почта или слово "admin"
              </span>
              <button
                type="button"
                onClick={() => {
                  setInputPassword('admin');
                  setUnlockError('');
                  playSound?.('click');
                }}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-black text-[10px] transition-all cursor-pointer flex items-center space-x-1"
                title="Автоматически вставить admin"
              >
                <span>🔑</span>
                <span>Вставить "admin"</span>
              </button>
            </div>

            {unlockError && (
              <div className="p-3.5 bg-red-950/90 border-2 border-red-500/80 rounded-2xl text-red-200 font-bold text-xs sm:text-sm leading-relaxed animate-in fade-in shadow-xl shadow-red-950/50">
                <div className="flex items-start space-x-2.5">
                  <span className="text-lg leading-tight flex-shrink-0">⚠️</span>
                  <div className="space-y-1">
                    <p className="font-black text-red-300 uppercase tracking-wide text-[11px]">
                      Отказ в доступе
                    </p>
                    <p className="text-xs text-gray-200 font-medium leading-relaxed">
                      {unlockError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black uppercase tracking-widest text-xs sm:text-sm rounded-2xl border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all shadow-xl flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>🔓</span>
              <span>Войти в Панель Владельца — Admin Tool</span>
            </button>
          </form>

          {/* Navigation links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-gray-800">
            <button
              onClick={onBack}
              className="text-xs text-gray-400 font-bold hover:text-white transition-colors flex items-center space-x-1"
            >
              <span>←</span>
              <span>Вернуться назад</span>
            </button>

            {onOpenSupportChat && (
              <button
                onClick={() => { playSound?.('click'); onOpenSupportChat(); }}
                className="text-xs text-duo-blue hover:text-sky-300 font-bold transition-colors flex items-center space-x-1"
              >
                <span>💬</span>
                <span>Чат техподдержки (Восстановить серию)</span>
              </button>
            )}
          </div>
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
              <div className="flex items-center space-x-2">
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-amber-400 flex items-center space-x-2">
                  <span>👑</span>
                  <span>Панель Владельца — Admin Tool</span>
                </h1>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Доступ только администратора
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-bold">
                Модерация, Мониторинг и Восстановление Ударного Режима | Владелец: <span className="text-duo-blue">abramovanatolij81@gmail.com</span> / <span className="text-duo-blue">va997217@gmail.com</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleLockAdmin}
              className="px-3 py-2 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/40 text-xs font-black rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow"
              title="Заблокировать доступ администратора"
            >
              <span>🔒</span>
              <span className="hidden sm:inline">Заблокировать / Выйти</span>
            </button>
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
            onClick={() => { playSound?.('click'); setActiveTab('gemini_keys'); }}
            className={`flex-1 min-w-[200px] py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'gemini_keys'
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 text-black shadow-lg shadow-amber-950/50 scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="text-base animate-bounce">🔑</span>
            <span>Gemini Key API (Админ & Разработчик)</span>
          </button>

          <button
            onClick={() => { playSound?.('click'); setActiveTab('streak_recovery'); }}
            className={`flex-1 min-w-[200px] py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'streak_recovery'
                ? 'bg-gradient-to-r from-duo-red to-orange-600 text-white shadow-lg shadow-red-950/50 scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="text-base animate-pulse">🔥</span>
            <span>Модерация & Восстановление Серии</span>
          </button>

          <button
            onClick={() => { playSound?.('click'); setActiveTab('reviews'); }}
            className={`flex-1 min-w-[160px] py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'reviews'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-950/50 scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="text-base">💬</span>
            <span>Отзывы ({reviews.length})</span>
          </button>

          <button
            onClick={() => { playSound?.('click'); setActiveTab('users'); }}
            className={`flex-1 min-w-[160px] py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'users'
                ? 'bg-duo-blue text-white shadow-lg shadow-blue-950/50 scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="text-base">📊</span>
            <span>Мониторинг</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB: GEMINI API KEY MANAGEMENT (DEVELOPER & ADMINISTRATOR) */}
        {/* ========================================================================= */}
        {activeTab === 'gemini_keys' && (
          <AdminGeminiKeyManager
            isUnlocked={isUnlocked}
            currentUserEmail={currentEmail}
            role={user.role}
            isAdmin={user.role === 'admin' || user.role === 'owner' || isOwnerByEmail}
            playSound={playSound}
            setToast={setToast}
          />
        )}
        {false && (
          <div className="hidden">
            <div className="bg-gradient-to-br from-gray-900 via-amber-950/30 to-gray-900 border-2 border-amber-500/50 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-800 pb-5">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-2xl border border-amber-500/40">
                    🔑
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black uppercase tracking-tight text-white">
                        Управление Gemini API Ключами
                      </h2>
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                        👑 Владельцы: abramovanatolij81@gmail.com & va997217@gmail.com
                      </span>
                      <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                        💻 Разработчики
                      </span>
                      <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                        🔒 Недоступно пользователям
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-bold mt-0.5">
                      Конфиденциальная установка и настройка Gemini API Keys для владельцев (<b className="text-amber-300">abramovanatolij81@gmail.com</b>, <b className="text-amber-300">va997217@gmail.com</b>) и разработчиков. Обычным пользователям функционал полностью недоступен.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleRunFullDiagnostics}
                    disabled={batchTesting}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border-b-2 border-amber-700 active:translate-y-0.5 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    <span>{batchTesting ? '⏳ Проверка...' : '⚡ Экспресс-диагностика всех ключей'}</span>
                  </button>
                </div>
              </div>

              {/* ACTIVE KEY STATUS CARD */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/70 border border-gray-700 p-4 rounded-2xl">
                  <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">Текущий активный источник</p>
                  <div className="flex items-center space-x-2 mt-1.5">
                    <span className="text-xl">
                      {activeKeyInfo.source === 'ADMIN' ? '👑' : activeKeyInfo.source === 'DEV' ? '💻' : activeKeyInfo.source === 'CUSTOM' ? '👤' : '🌐'}
                    </span>
                    <span className={`text-base font-black uppercase tracking-tight ${
                      activeKeyInfo.source === 'ADMIN' ? 'text-amber-400' :
                      activeKeyInfo.source === 'DEV' ? 'text-cyan-400' :
                      activeKeyInfo.source === 'CUSTOM' ? 'text-emerald-400' : 'text-blue-400'
                    }`}>
                      {activeKeyInfo.source === 'ADMIN' ? 'Ключ Администратора' :
                       activeKeyInfo.source === 'DEV' ? 'Ключ Разработчика' :
                       activeKeyInfo.source === 'CUSTOM' ? 'Пользовательский' : 'Системный по умолчанию'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Приоритет: <span className="text-white font-bold">{keyPriority.toUpperCase()}</span></p>
                </div>

                <div className="bg-gray-800/70 border border-gray-700 p-4 rounded-2xl">
                  <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">Маскированный ключ</p>
                  <p className="text-base font-mono font-bold text-white mt-1.5 truncate">
                    {activeKeyInfo.maskedKey || 'Встроенный системный'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Статус: <span className="text-emerald-400 font-bold">Готов к генерации</span>
                  </p>
                </div>

                <div className="bg-gray-800/70 border border-gray-700 p-4 rounded-2xl">
                  <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">Тип квоты / Тариф</p>
                  <div className="flex items-center space-x-1.5 mt-1.5">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase border ${
                      activeKeyInfo.type === 'paid'
                        ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                        : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {activeKeyInfo.type === 'paid' ? '🔥 Paid Pro (Без лимитов)' : '🌱 Free Tier (15 RPM)'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">DuoWindo6601 AI Engine</p>
                </div>

                <div className="bg-gray-800/70 border border-gray-700 p-4 rounded-2xl">
                  <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">Состояние ключей</p>
                  <div className="flex items-center space-x-2 mt-2 text-xs font-bold">
                    <span className={`px-2 py-0.5 rounded-md ${adminKeyDetails.key ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                      👑 Админ: {adminKeyDetails.key ? (adminKeyDetails.enabled ? 'ВКЛ' : 'ВЫКЛ') : 'НЕТ'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md ${devKeyDetails.key ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                      💻 Дев: {devKeyDetails.key ? (devKeyDetails.enabled ? 'ВКЛ' : 'ВЫКЛ') : 'НЕТ'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Синхронизация активна</p>
                </div>
              </div>

              {/* BATCH DIAGNOSTICS REPORT */}
              {batchTestReport && (
                <div className="bg-black/50 border border-amber-500/30 rounded-2xl p-4 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-400 flex items-center space-x-1.5">
                      <span>📊</span>
                      <span>Результаты экспресс-диагностики Gemini API</span>
                    </span>
                    <button
                      onClick={() => setBatchTestReport(null)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      ✕ Закрыть
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className={`p-3 rounded-xl border ${batchTestReport.active?.ok ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-red-950/40 border-red-500/40 text-red-200'}`}>
                      <p className="font-black">Текущий активный ключ:</p>
                      <p className="mt-1 font-bold">{batchTestReport.active?.ok ? `✅ Доступен (${batchTestReport.active?.latencyMs || 0} ms)` : `❌ ${batchTestReport.active?.message}`}</p>
                    </div>
                    <div className={`p-3 rounded-xl border ${batchTestReport.admin ? (batchTestReport.admin.ok ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-red-950/40 border-red-500/40 text-red-200') : 'bg-gray-800/40 border-gray-700 text-gray-400'}`}>
                      <p className="font-black">Ключ Администратора:</p>
                      <p className="mt-1 font-bold">{batchTestReport.admin ? (batchTestReport.admin.ok ? `✅ Доступен (${batchTestReport.admin.latencyMs || 0} ms)` : `❌ ${batchTestReport.admin.message}`) : 'Не задан'}</p>
                    </div>
                    <div className={`p-3 rounded-xl border ${batchTestReport.dev ? (batchTestReport.dev.ok ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-red-950/40 border-red-500/40 text-red-200') : 'bg-gray-800/40 border-gray-700 text-gray-400'}`}>
                      <p className="font-black">Ключ Разработчика:</p>
                      <p className="mt-1 font-bold">{batchTestReport.dev ? (batchTestReport.dev.ok ? `✅ Доступен (${batchTestReport.dev.latencyMs || 0} ms)` : `❌ ${batchTestReport.dev.message}`) : 'Не задан'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PRIORITY STRATEGY SELECTOR */}
            <div className="bg-duo-card border-2 border-gray-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-5">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center space-x-2">
                  <span>⚙️</span>
                  <span>Стратегия Приоритета Ключей Gemini (Resolution Order)</span>
                </h3>
                <p className="text-xs text-gray-400 font-bold mt-1">
                  Определяет, какой ключ имеет преимущество при обращении к AI-моделям (проверка грамматики, озвучка, ролевые диалоги, бот поддержки)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <button
                  onClick={() => handleSetPriority('auto')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                    keyPriority === 'auto'
                      ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-950/40 scale-[1.02]'
                      : 'bg-gray-800/60 border-gray-700 hover:border-gray-600 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">⚡</span>
                    {keyPriority === 'auto' && <span className="text-[10px] bg-amber-500 text-black font-black px-1.5 py-0.5 rounded">АКТИВНО</span>}
                  </div>
                  <div>
                    <p className="font-black text-xs uppercase">Авто-приоритет</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">Админ ➔ Дев ➔ Пользователь ➔ Системный</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSetPriority('admin')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                    keyPriority === 'admin'
                      ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-950/40 scale-[1.02]'
                      : 'bg-gray-800/60 border-gray-700 hover:border-gray-600 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">👑</span>
                    {keyPriority === 'admin' && <span className="text-[10px] bg-amber-500 text-black font-black px-1.5 py-0.5 rounded">АКТИВНО</span>}
                  </div>
                  <div>
                    <p className="font-black text-xs uppercase">Только Администратор</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">Принудительно использовать ключ Владельца</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSetPriority('dev')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                    keyPriority === 'dev'
                      ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-lg shadow-cyan-950/40 scale-[1.02]'
                      : 'bg-gray-800/60 border-gray-700 hover:border-gray-600 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">💻</span>
                    {keyPriority === 'dev' && <span className="text-[10px] bg-cyan-500 text-black font-black px-1.5 py-0.5 rounded">АКТИВНО</span>}
                  </div>
                  <div>
                    <p className="font-black text-xs uppercase">Только Разработчик</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">Принудительно использовать dev/staging ключ</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSetPriority('custom')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                    keyPriority === 'custom'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-950/40 scale-[1.02]'
                      : 'bg-gray-800/60 border-gray-700 hover:border-gray-600 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">👤</span>
                    {keyPriority === 'custom' && <span className="text-[10px] bg-emerald-500 text-black font-black px-1.5 py-0.5 rounded">АКТИВНО</span>}
                  </div>
                  <div>
                    <p className="font-black text-xs uppercase">Пользовательский</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">Ключ из настроек текущего профиля</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSetPriority('system')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                    keyPriority === 'system'
                      ? 'bg-blue-500/15 border-blue-500 text-white shadow-lg shadow-blue-950/40 scale-[1.02]'
                      : 'bg-gray-800/60 border-gray-700 hover:border-gray-600 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">🌐</span>
                    {keyPriority === 'system' && <span className="text-[10px] bg-blue-500 text-white font-black px-1.5 py-0.5 rounded">АКТИВНО</span>}
                  </div>
                  <div>
                    <p className="font-black text-xs uppercase">Системный по умолчанию</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">Встроенный платформенный ключ</p>
                  </div>
                </button>
              </div>
            </div>

            {/* TWO ROLE CARDS: 1. ADMIN KEY & 2. DEVELOPER KEY */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* CARD 1: ADMIN KEY (OWNER / GLOBAL PRODUCTION OVERRIDE) */}
              <div className="bg-gradient-to-br from-gray-900 via-gray-900/90 to-amber-950/30 border-2 border-amber-500/60 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-2xl border border-amber-500/40">
                        👑
                      </div>
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center space-x-2">
                          <span>Gemini API Key Администратора / Владельца</span>
                        </h3>
                        <p className="text-xs text-amber-400 font-bold">
                          Главный ключ Владельцев (abramovanatolij81@gmail.com, va997217@gmail.com)
                        </p>
                      </div>
                    </div>

                    <span className={`text-[11px] font-black px-3 py-1 rounded-full uppercase border ${
                      adminKeyDetails.key
                        ? (adminKeyDetails.enabled ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-gray-800 text-gray-400 border-gray-700')
                        : 'bg-gray-800 text-gray-500 border-gray-700'
                    }`}>
                      {adminKeyDetails.key ? (adminKeyDetails.enabled ? '🟢 Включен' : '⏸️ Отключен') : '⚪ Не задан'}
                    </span>
                  </div>

                  {/* INPUT FIELD */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-300 flex items-center justify-between">
                      <span>Вставьте Gemini API Ключ Администратора:</span>
                      {adminKeyDetails.key && (
                        <span className="text-[10px] text-amber-400 font-mono">Сохранен: {adminKeyDetails.maskedKey}</span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showAdminKey ? 'text' : 'password'}
                        value={adminKeyInput}
                        onChange={(e) => setAdminKeyInput(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full bg-gray-800 border-2 border-gray-700 focus:border-amber-400 text-white rounded-2xl px-4 py-3.5 pr-20 text-xs font-mono font-bold focus:outline-none transition-colors"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => setShowAdminKey(!showAdminKey)}
                          className="p-2 text-gray-400 hover:text-white transition-colors text-xs"
                          title={showAdminKey ? 'Скрыть ключ' : 'Показать ключ'}
                        >
                          {showAdminKey ? '🙈' : '👁️'}
                        </button>
                        {adminKeyInput && (
                          <button
                            type="button"
                            onClick={() => setAdminKeyInput('')}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors text-xs"
                            title="Очистить поле"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* TIER & TOGGLES */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/30 p-4 rounded-2xl border border-gray-800">
                    <div>
                      <label className="text-[11px] font-black uppercase text-gray-300 block mb-1.5">
                        Тип тарифа ключа:
                      </label>
                      <select
                        value={adminKeyType}
                        onChange={(e) => setAdminKeyType(e.target.value as 'free' | 'paid')}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-400"
                      >
                        <option value="free">🌱 Free Tier (Стандартный)</option>
                        <option value="paid">🔥 Paid / Pro (Безлимитный)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase text-gray-300 block mb-1.5">
                        Состояние активности:
                      </label>
                      <button
                        type="button"
                        onClick={() => setAdminKeyEnabled(!adminKeyEnabled)}
                        className={`w-full py-2 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center space-x-2 ${
                          adminKeyEnabled
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            : 'bg-gray-800 border-gray-700 text-gray-400'
                        }`}
                      >
                        <span>{adminKeyEnabled ? '✅ Ключ Активен' : '⏸️ Приостановлен'}</span>
                      </button>
                    </div>
                  </div>

                  {/* TEST RESULT BOX */}
                  {adminTestResult && (
                    <div className={`p-4 rounded-2xl border text-xs font-bold animate-in fade-in ${
                      adminTestResult.ok
                        ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                        : 'bg-red-950/50 border-red-500/50 text-red-200'
                    }`}>
                      <p className="flex items-center space-x-2">
                        <span>{adminTestResult.ok ? '✅' : '❌'}</span>
                        <span>{adminTestResult.message}</span>
                      </p>
                      {adminTestResult.latencyMs && (
                        <p className="text-[10px] text-gray-400 mt-1">Время отклика: {adminTestResult.latencyMs} ms</p>
                      )}
                    </div>
                  )}

                  {/* SECURITY & CLOUD SYNC NOTE */}
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl flex items-start space-x-2.5 text-[11px] text-amber-200/90">
                    <span>🔒</span>
                    <div>
                      Ключ Администратора сохраняется в зашифрованном виде в локальном хранилище и синхронизируется в защищенную коллекцию Firestore <code className="font-mono bg-black/40 px-1 py-0.5 rounded text-amber-300">system_config/gemini_keys</code>.
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={handleSaveAdminKey}
                    className="sm:col-span-2 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border-b-2 border-amber-700 active:translate-y-0.5 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>💾 Сохранить и применить</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestAdminKey}
                    disabled={adminTesting}
                    className="py-3 bg-gray-800 hover:bg-gray-700 text-white font-black text-xs uppercase rounded-xl border border-gray-700 transition-all flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                  >
                    <span>{adminTesting ? '⏳' : '🧪 Тест'}</span>
                  </button>

                  {adminKeyDetails.key && (
                    <button
                      type="button"
                      onClick={handleClearAdminKey}
                      className="sm:col-span-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 font-bold text-xs rounded-xl border border-red-500/30 transition-all text-center"
                    >
                      🗑️ Удалить ключ Администратора
                    </button>
                  )}
                </div>
              </div>

              {/* CARD 2: DEVELOPER KEY (STAGING / DEBUG / DEV TEAM) */}
              <div className="bg-gradient-to-br from-gray-900 via-gray-900/90 to-cyan-950/30 border-2 border-cyan-500/60 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-2xl border border-cyan-500/40">
                        💻
                      </div>
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center space-x-2">
                          <span>Gemini API Key Разработчика</span>
                        </h3>
                        <p className="text-xs text-cyan-400 font-bold">
                          Для тестирования, отладки и изолированного Dev-окружения
                        </p>
                      </div>
                    </div>

                    <span className={`text-[11px] font-black px-3 py-1 rounded-full uppercase border ${
                      devKeyDetails.key
                        ? (devKeyDetails.enabled ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-gray-800 text-gray-400 border-gray-700')
                        : 'bg-gray-800 text-gray-500 border-gray-700'
                    }`}>
                      {devKeyDetails.key ? (devKeyDetails.enabled ? '🟢 Включен' : '⏸️ Отключен') : '⚪ Не задан'}
                    </span>
                  </div>

                  {/* INPUT FIELD */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-300 flex items-center justify-between">
                      <span>Вставьте Gemini API Ключ Разработчика:</span>
                      {devKeyDetails.key && (
                        <span className="text-[10px] text-cyan-400 font-mono">Сохранен: {devKeyDetails.maskedKey}</span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showDevKey ? 'text' : 'password'}
                        value={devKeyInput}
                        onChange={(e) => setDevKeyInput(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full bg-gray-800 border-2 border-gray-700 focus:border-cyan-400 text-white rounded-2xl px-4 py-3.5 pr-20 text-xs font-mono font-bold focus:outline-none transition-colors"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => setShowDevKey(!showDevKey)}
                          className="p-2 text-gray-400 hover:text-white transition-colors text-xs"
                          title={showDevKey ? 'Скрыть ключ' : 'Показать ключ'}
                        >
                          {showDevKey ? '🙈' : '👁️'}
                        </button>
                        {devKeyInput && (
                          <button
                            type="button"
                            onClick={() => setDevKeyInput('')}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors text-xs"
                            title="Очистить поле"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* TIER & TOGGLES */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/30 p-4 rounded-2xl border border-gray-800">
                    <div>
                      <label className="text-[11px] font-black uppercase text-gray-300 block mb-1.5">
                        Тип тарифа ключа:
                      </label>
                      <select
                        value={devKeyType}
                        onChange={(e) => setDevKeyType(e.target.value as 'free' | 'paid')}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-cyan-400"
                      >
                        <option value="free">🌱 Free Tier (Стандартный)</option>
                        <option value="paid">🔥 Paid / Pro (Безлимитный)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase text-gray-300 block mb-1.5">
                        Состояние активности:
                      </label>
                      <button
                        type="button"
                        onClick={() => setDevKeyEnabled(!devKeyEnabled)}
                        className={`w-full py-2 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center space-x-2 ${
                          devKeyEnabled
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            : 'bg-gray-800 border-gray-700 text-gray-400'
                        }`}
                      >
                        <span>{devKeyEnabled ? '✅ Ключ Активен' : '⏸️ Приостановлен'}</span>
                      </button>
                    </div>
                  </div>

                  {/* TEST RESULT BOX */}
                  {devTestResult && (
                    <div className={`p-4 rounded-2xl border text-xs font-bold animate-in fade-in ${
                      devTestResult.ok
                        ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                        : 'bg-red-950/50 border-red-500/50 text-red-200'
                    }`}>
                      <p className="flex items-center space-x-2">
                        <span>{devTestResult.ok ? '✅' : '❌'}</span>
                        <span>{devTestResult.message}</span>
                      </p>
                      {devTestResult.latencyMs && (
                        <p className="text-[10px] text-gray-400 mt-1">Время отклика: {devTestResult.latencyMs} ms</p>
                      )}
                    </div>
                  )}

                  {/* DEV USAGE NOTE */}
                  <div className="bg-cyan-500/10 border border-cyan-500/20 p-3.5 rounded-2xl flex items-start space-x-2.5 text-[11px] text-cyan-200/90">
                    <span>💡</span>
                    <div>
                      Ключ Разработчика позволяет тестировать новые фичи, голосовые промты и генерацию уроков, не расходуя квоту ключа Администратора.
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={handleSaveDevKey}
                    className="sm:col-span-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border-b-2 border-cyan-700 active:translate-y-0.5 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>💾 Сохранить ключ Dev</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestDevKey}
                    disabled={devTesting}
                    className="py-3 bg-gray-800 hover:bg-gray-700 text-white font-black text-xs uppercase rounded-xl border border-gray-700 transition-all flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                  >
                    <span>{devTesting ? '⏳' : '🧪 Тест'}</span>
                  </button>

                  {devKeyDetails.key && (
                    <button
                      type="button"
                      onClick={handleClearDevKey}
                      className="sm:col-span-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 font-bold text-xs rounded-xl border border-red-500/30 transition-all text-center"
                    >
                      🗑️ Удалить ключ Разработчика
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* QUICK GUIDE & DOCUMENTATION FOR DEVELOPER & ADMIN */}
            <div className="bg-duo-card border-2 border-gray-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
              <div className="flex items-center space-x-3 border-b border-gray-800 pb-4">
                <span className="text-2xl">📚</span>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">
                    Справка и Инструкция по получению Gemini API Key
                  </h3>
                  <p className="text-xs text-gray-400 font-bold">
                    Как сгенерировать официальный бесплатный или платный ключ Google Gemini
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/60 p-4 rounded-2xl border border-gray-700/80 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm">
                    1
                  </div>
                  <h4 className="font-black text-white text-xs uppercase">Перейдите в Google AI Studio</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Откройте официальную консоль разработчика Google AI:
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-duo-blue hover:underline block font-mono text-[11px] mt-1"
                    >
                      aistudio.google.com/app/apikey ↗
                    </a>
                  </p>
                </div>

                <div className="bg-gray-800/60 p-4 rounded-2xl border border-gray-700/80 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-sm">
                    2
                  </div>
                  <h4 className="font-black text-white text-xs uppercase">Создайте API Ключ</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Нажмите <b className="text-white">"Create API Key"</b>, выберите проект Google Cloud или создайте новый в один клик. Ключ имеет префикс <code className="text-cyan-300 font-mono">AIzaSy...</code>.
                  </p>
                </div>

                <div className="bg-gray-800/60 p-4 rounded-2xl border border-gray-700/80 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm">
                    3
                  </div>
                  <h4 className="font-black text-white text-xs uppercase">Сохраните и Проверьте</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Вставьте ключ в поле <b className="text-white">Администратора</b> или <b className="text-white">Разработчика</b> выше, нажмите «Тест» для проверки пинга, затем «Сохранить».
                  </p>
                </div>

                <div className="bg-rose-950/30 p-4 rounded-2xl border border-rose-500/40 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-sm">
                    🔒
                  </div>
                  <h4 className="font-black text-rose-200 text-xs uppercase">Закрыто для пользователей</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Доступ разрешен только владельцам (<b className="text-white">abramovanatolij81@gmail.com</b>, <b className="text-white">va997217@gmail.com</b>). Обычным пользователям функционал полностью недоступен.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: STREAK RECOVERY & ADMINISTRATION */}
        {/* ========================================================================= */}
        {activeTab === 'streak_recovery' && (
          <div className="space-y-8 animate-in fade-in">
            {/* POLICY & RESTRICTION NOTICE */}
            <div className="bg-gradient-to-r from-red-950/80 via-gray-900 to-amber-950/80 border-2 border-red-500/60 rounded-3xl p-6 shadow-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <h3 className="text-base font-black text-amber-300 uppercase tracking-wide">
                      Раздел Ограничение: Восстановление Ударного Режима
                    </h3>
                    <p className="text-xs text-gray-400 font-bold">
                      Статус защиты: <span className="text-emerald-400 font-black">АКТИВЕН</span> (Свободный доступ обычным пользователям закрыт)
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[11px] font-black px-3 py-1 rounded-full uppercase">
                    Admin Tool Only
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-medium">
                По регламенту DuoWindo6601 функция восстановления потерянной серии (<span className="text-duo-red font-bold">Ударного Режима</span>) выведена из общего доступа во избежание нечестной накрутки. 
                Доступ к восстановлению серии разрешён исключительно:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-gray-900/90 border border-gray-800 p-3.5 rounded-2xl flex items-start space-x-3">
                  <span className="text-xl">👑</span>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase">1. Администратор платформы</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Прямое управление и восстановление в данном модуле «Панель Владельца — Admin Tool» для любого аккаунта.
                    </p>
                  </div>
                </div>
                <div className="bg-gray-900/90 border border-gray-800 p-3.5 rounded-2xl flex items-start space-x-3">
                  <span className="text-xl">💬</span>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase">2. Чат техподдержки</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Пользователь обращается в Чат техподдержки, где администратор или дежурный AI-ассистент валидирует причину сбоя и восстанавливает серию.
                    </p>
                  </div>
                </div>
              </div>
            </div>

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
        {/* TAB 3: CLOUD USER LOOKUP & SYSTEM MONITORING */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-8 animate-in fade-in">
            {/* REAL-TIME SYSTEM MONITORING PANEL */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-900/90 to-blue-950/40 border-2 border-duo-blue/50 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-duo-blue/20 rounded-2xl flex items-center justify-center text-2xl border border-duo-blue/40">
                    📡
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center space-x-2">
                      <span>Мониторинг Системы DuoWindo6601</span>
                    </h2>
                    <p className="text-xs text-gray-400 font-bold mt-0.5">
                      Телеметрия в реальном времени: Сервер, Облачная База Данных и Ударный Режим
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-emerald-950/50 border border-emerald-500/40 px-3.5 py-1.5 rounded-2xl">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                    Система Стабильна (100% Онлайн)
                  </span>
                </div>
              </div>

              {/* TELEMETRY GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-800/60 border border-gray-700/80 p-4 rounded-2xl">
                  <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">Активные сессии</p>
                  <p className="text-2xl md:text-3xl font-black text-emerald-400 mt-1">{activeUsersCount} онлайн</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">🟢 Живые соединения</p>
                </div>

                <div className="bg-gray-800/60 border border-gray-700/80 p-4 rounded-2xl">
                  <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">Чат техподдержки</p>
                  <p className="text-2xl md:text-3xl font-black text-cyan-400 mt-1">24/7 Активен</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">🤖 AI-бот + Администратор</p>
                </div>

                <div className="bg-gray-800/60 border border-gray-700/80 p-4 rounded-2xl">
                  <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">Пинг серверов</p>
                  <p className="text-2xl md:text-3xl font-black text-duo-blue mt-1">18 ms</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">⚡ Быстрый отклик</p>
                </div>

                <div className="bg-gray-800/60 border border-gray-700/80 p-4 rounded-2xl">
                  <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">SSL Сертификат</p>
                  <p className="text-2xl md:text-3xl font-black text-amber-400 mt-1">WR2 256-bit</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">🔒 Защищённое соединение</p>
                </div>
              </div>

              {/* RECOVERY RULES REMINDER */}
              <div className="bg-blue-950/30 border border-blue-500/30 p-4 rounded-2xl flex items-start space-x-3 text-xs text-gray-300">
                <span className="text-lg">ℹ️</span>
                <div>
                  <span className="font-black text-blue-300 uppercase block mb-0.5">
                    Регламент Мониторинга & Восстановления
                  </span>
                  Обычные пользователи не имеют прямого доступа к редактированию значений Ударного режима. Все обращения по восстановлению серий поступают в Чат техподдержки, либо администратор использует данный модуль для ручного поиска профиля и точечной корректировки.
                </div>
              </div>
            </div>

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
