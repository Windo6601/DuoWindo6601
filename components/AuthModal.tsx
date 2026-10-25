import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendPasswordResetEmail, 
  signInWithPopup, 
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { UserProgress, Course } from '../types';
import { 
  isIncognitoLoginClosed, 
  getDaysUntilIncognitoClosure, 
  getFormattedClosureDate, 
  downloadIncognitoDataFile, 
  copyIncognitoDataToClipboard,
  isIncognitoClosingTomorrow,
  getIncognitoClosureTitle,
  getSynchronizedActiveStatuses
} from '../services/incognitoService';
import { 
  isLanguageSwitchLocked, 
  getLanguageLockedToastMessage, 
  getLanguageLockInfo, 
  AVAILABLE_SWITCH_LANGUAGES 
} from '../services/languageLockService';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register' | 'google' | 'incognito';
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  firebaseUser: FirebaseUser | null;
  setFirebaseUser: React.Dispatch<React.SetStateAction<FirebaseUser | null>>;
  t: (key: string, params?: Record<string, any>) => string;
  playSound: (name: string) => void;
  setToast: (msg: string | null) => void;
  onOpenIncognitoRestrictions?: () => void;
  onOpenIncognitoExport?: () => void;
  onOpenFirebaseExport?: () => void;
  onSwitchCourse?: (course: Course) => void;
  allCourses?: Course[];
  onOpenLanguageLockModal?: (langCode: string) => void;
}

// Local accounts storage key for fallback / offline lookup by @username or email
const REGISTERED_ACCOUNTS_KEY = 'duo_registered_accounts_6601';

export interface AuthCountryLanguageItem {
  id: string;
  name: string;
  flag: string;
  country: string;
  category: 'available' | 'world_locked' | 'cis_locked';
}

const COUNTRY_LANGUAGES: AuthCountryLanguageItem[] = [
  // ✨ AVAILABLE SWITCH LANGUAGES (8)
  { id: 'ru', name: 'Россия (Русский)', flag: '🇷🇺', country: 'RU', category: 'available' },
  { id: 'en', name: 'USA / UK (English)', flag: '🇺🇸', country: 'US', category: 'available' },
  { id: 'de', name: 'Deutschland (Deutsch)', flag: '🇩🇪', country: 'DE', category: 'available' },
  { id: 'fr', name: 'France (Français)', flag: '🇫🇷', country: 'FR', category: 'available' },
  { id: 'es', name: 'España (Español)', flag: '🇪🇸', country: 'ES', category: 'available' },
  { id: 'zh', name: '中国 (中文)', flag: '🇨🇳', country: 'CN', category: 'available' },
  { id: 'ja', name: '日本 (日本語)', flag: '🇯🇵', country: 'JP', category: 'available' },
  { id: 'ar', name: 'المملكة العربية السعودية (العربية)', flag: '🇸🇦', country: 'SA', category: 'available' },

  // 🔒 WORLD LOCKED LANGUAGES (10) — Available Nov 1, 2026
  { id: 'pt', name: '🔒 Brasil (Português)', flag: '🇧🇷', country: 'BR', category: 'world_locked' },
  { id: 'it', name: '🔒 Italia (Italiano)', flag: '🇮🇹', country: 'IT', category: 'world_locked' },
  { id: 'tr', name: '🔒 Türkiye (Türkçe)', flag: '🇹🇷', country: 'TR', category: 'world_locked' },
  { id: 'ko', name: '🔒 대한민국 (한국어)', flag: '🇰🇷', country: 'KR', category: 'world_locked' },
  { id: 'hi', name: '🔒 Индия (हिन्दी)', flag: '🇮🇳', country: 'IN', category: 'world_locked' },
  { id: 'pl', name: '🔒 Polska (Polski)', flag: '🇵🇱', country: 'PL', category: 'world_locked' },
  { id: 'id', name: '🔒 Indonesia (Bahasa Indonesia)', flag: '🇮🇩', country: 'ID', category: 'world_locked' },
  { id: 'bn', name: '🔒 Bangladesh (বাংলা)', flag: '🇧🇩', country: 'BD', category: 'world_locked' },
  { id: 'th', name: '🔒 Thailand (ไทย)', flag: '🇹🇭', country: 'TH', category: 'world_locked' },
  { id: 'vi', name: '🔒 Việt Nam (Tiếng Việt)', flag: '🇻🇳', country: 'VN', category: 'world_locked' },

  // 🔒 CIS COUNTRIES (5) — Раздел Письмо Будут доступ 1 ноября 2026 год
  { id: 'kk', name: '🔒 Казахстан (Қазақша) — Казахстан (казахский — выбран)', flag: '🇰🇿', country: 'KZ', category: 'cis_locked' },
  { id: 'uz', name: '🔒 Узбекистан (Oʻzbekcha) — Узбекистан (узбекский)', flag: '🇺🇿', country: 'UZ', category: 'cis_locked' },
  { id: 'hy', name: '🔒 Армения (Հայերեն) — Армения (армянский)', flag: '🇦🇲', country: 'AM', category: 'cis_locked' },
  { id: 'ka', name: '🔒 Грузия (ქართული) — Грузия (грузинский)', flag: '🇬🇪', country: 'GE', category: 'cis_locked' },
  { id: 'az', name: '🔒 Азербайджан (Azərbaycan) — Азербайджан (азербайджанский)', flag: '🇦🇿', country: 'AZ', category: 'cis_locked' }
];

const TARGET_COURSES_LIST = [
  { id: 'en', name: 'Английский язык (English)', flag: '🇺🇸' },
  { id: 'de', name: 'Немецкий язык (Deutsch)', flag: '🇩🇪' },
  { id: 'fr', name: 'Французский язык (Français)', flag: '🇫🇷' },
  { id: 'es', name: 'Испанский язык (Español)', flag: '🇪🇸' },
  { id: 'zh', name: 'Китайский язык (中文)', flag: '🇨🇳' },
  { id: 'ja', name: 'Японский язык (日本語)', flag: '🇯🇵' },
  { id: 'ar', name: 'Арабский язык (العربية)', flag: '🇸🇦' },
  { id: 'ru', name: 'Русский язык (Russian)', flag: '🇷🇺' },
  { id: 'it', name: '🔒 Итальянский язык (Italiano)', flag: '🇮🇹' },
  { id: 'ko', name: '🔒 Корейский язык (한국어)', flag: '🇰🇷' },
  { id: 'pl', name: '🔒 Польский язык (Polski)', flag: '🇵🇱' },
  { id: 'pt', name: '🔒 Португальский (Português)', flag: '🇧🇷' },
  { id: 'tr', name: '🔒 Турецкий язык (Türkçe)', flag: '🇹🇷' },
  { id: 'hi', name: '🔒 Хинди (हिन्दी)', flag: '🇮🇳' },
  { id: 'kk', name: '🔒 Казахстан (Қазақша)', flag: '🇰🇿' },
  { id: 'uz', name: '🔒 Узбекистан (Oʻzbekcha)', flag: '🇺🇿' },
  { id: 'hy', name: '🔒 Армения (Հայերեն)', flag: '🇦🇲' },
  { id: 'ka', name: '🔒 Грузия (ქართული)', flag: '🇬🇪' },
  { id: 'az', name: '🔒 Азербайджан (Azərbaycan)', flag: '🇦🇿' }
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  user,
  setUser,
  firebaseUser,
  setFirebaseUser,
  t,
  playSound,
  setToast,
  onOpenIncognitoRestrictions,
  onOpenIncognitoExport,
  onOpenFirebaseExport,
  onSwitchCourse,
  allCourses = [],
  onOpenLanguageLockModal
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'google' | 'incognito'>('login');

  // Form Fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Avatar Selection for Registration
  const [avatarColor, setAvatarColor] = useState('bg-duo-blue');
  const [avatarIcon, setAvatarIcon] = useState('🦉');

  // Country & Language Selector State
  const [selectedNativeLang, setSelectedNativeLang] = useState<string>(
    (user.language as string) || 'ru'
  );
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(user.country || 'RU');
  const [selectedTargetCourseId, setSelectedTargetCourseId] = useState<string>(() => {
    return localStorage.getItem('duo_course_id_6601') || 'en';
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [isOperationNotAllowed, setIsOperationNotAllowed] = useState(false);
  const [notAllowedProvider, setNotAllowedProvider] = useState<'google' | 'email' | null>(null);
  const [exportCopied, setExportCopied] = useState(false);

  const isRu = user.language === 'ru';
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const incognitoClosed = isIncognitoLoginClosed();
  const daysUntilClosure = getDaysUntilIncognitoClosure();
  const closureDateLabel = getFormattedClosureDate(user.language);

  // Helper to apply selected country & target course preferences to user progress
  const applyCountryAndCoursePreferences = (baseUser: UserProgress): UserProgress => {
    const isLocked = isLanguageSwitchLocked(selectedNativeLang);
    const matchedCountry = COUNTRY_LANGUAGES.find(c => c.id === selectedNativeLang)?.country || selectedCountryCode || 'RU';

    // If locked, fallback interface language to 'ru' or existing supported language, while persisting country choice
    const activeInterfaceLang = isLocked 
      ? (AVAILABLE_SWITCH_LANGUAGES.some(a => a.code === baseUser.language) ? baseUser.language : 'ru') 
      : selectedNativeLang;

    const finalUser: UserProgress = {
      ...baseUser,
      language: activeInterfaceLang as any,
      country: matchedCountry,
    };

    if (selectedTargetCourseId) {
      localStorage.setItem('duo_course_id_6601', selectedTargetCourseId);
      if (allCourses.length > 0 && onSwitchCourse) {
        const courseToSwitch = allCourses.find(c => c.id === selectedTargetCourseId);
        if (courseToSwitch) {
          onSwitchCourse(courseToSwitch);
        }
      }
    }

    if (isLocked) {
      if (onOpenLanguageLockModal) {
        setTimeout(() => onOpenLanguageLockModal(selectedNativeLang), 250);
      } else {
        setToast(getLanguageLockedToastMessage(selectedNativeLang, isRu ? 'ru' : 'en'));
      }
    }

    return finalUser;
  };

  // Reusable Selector Component
  const renderCountryAndLanguageSelectors = () => {
    const isSelectedLocked = isLanguageSwitchLocked(selectedNativeLang);
    const lockInfo = getLanguageLockInfo(selectedNativeLang);

    return (
      <div className="bg-gray-950/80 border border-gray-800 p-3 rounded-2xl space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-gray-300 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <span>🌍</span>
            <span>{isRu ? 'Язык страны и Выбор курса' : 'Country Language & Course'}</span>
          </span>
          <span className="text-[10px] text-emerald-400 font-extrabold">{isRu ? 'Страны' : 'Country'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Native Interface Language & Country */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>{isRu ? 'Родной язык / Страна' : 'Native Language & Country'}</span>
              {isSelectedLocked && (
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-black border border-amber-500/40">
                  🔒 01.11.2026
                </span>
              )}
            </label>
            <select
              value={selectedNativeLang}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedNativeLang(val);
                const found = COUNTRY_LANGUAGES.find(c => c.id === val);
                if (found) setSelectedCountryCode(found.country);
                if (isLanguageSwitchLocked(val)) {
                  playSound('wrong');
                } else {
                  playSound('click');
                }
              }}
              className={`w-full bg-gray-900 border ${
                isSelectedLocked ? 'border-amber-500/80 text-amber-200' : 'border-gray-700 text-white'
              } focus:border-emerald-500 rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-none cursor-pointer transition-colors`}
            >
              <optgroup label={isRu ? '✨ Доступные языки стран (8)' : '✨ Available Languages (8)'}>
                {COUNTRY_LANGUAGES.filter(c => c.category === 'available').map(item => (
                  <option key={item.id} value={item.id} className="bg-gray-900 text-white font-bold">
                    {item.flag} {item.name}
                  </option>
                ))}
              </optgroup>

              <optgroup label={isRu ? '🔒 Заблокированные языки мира (10) — 01.11.2026' : '🔒 World Locked Languages (10) — Nov 1, 2026'}>
                {COUNTRY_LANGUAGES.filter(c => c.category === 'world_locked').map(item => (
                  <option key={item.id} value={item.id} className="bg-gray-900 text-amber-300 font-bold">
                    {item.flag} {item.name}
                  </option>
                ))}
              </optgroup>

              <optgroup label={isRu ? '🔒 Страны СНГ — Раздел Письмо (01.11.2026)' : '🔒 CIS Countries — Section Letters (Nov 1, 2026)'}>
                {COUNTRY_LANGUAGES.filter(c => c.category === 'cis_locked').map(item => (
                  <option key={item.id} value={item.id} className="bg-gray-900 text-amber-300 font-bold">
                    {item.flag} {item.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Target Course / Language */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {isRu ? 'Изучаемый курс страны' : 'Target Country Course'}
            </label>
            <select
              value={selectedTargetCourseId}
              onChange={(e) => {
                setSelectedTargetCourseId(e.target.value);
                playSound('click');
              }}
              className="w-full bg-gray-900 border border-gray-700 focus:border-emerald-500 rounded-xl px-2.5 py-2 text-xs text-white font-bold focus:outline-none cursor-pointer"
            >
              {TARGET_COURSES_LIST.map(item => (
                <option key={item.id} value={item.id} className="bg-gray-900 text-white font-bold">
                  {item.flag} {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* LOCKED LANGUAGE WARNING BANNER */}
        {isSelectedLocked && (
          <div className="p-2.5 bg-amber-950/80 border border-amber-500/80 rounded-xl text-[11px] text-amber-200 font-bold space-y-1 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-amber-400 font-black">
                <span>🔒</span>
                <span>{isRu ? 'Заблокированный язык стран' : 'Locked Country Language'}</span>
              </span>
              {onOpenLanguageLockModal && (
                <button
                  type="button"
                  onClick={() => onOpenLanguageLockModal(selectedNativeLang)}
                  className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {isRu ? 'ℹ️ Посмотреть дату' : 'ℹ️ Details'}
                </button>
              )}
            </div>
            <p className="leading-snug">
              {getLanguageLockedToastMessage(selectedNativeLang, isRu ? 'ru' : 'en')}
            </p>
            <p className="text-[10px] text-amber-300/80 italic">
              {lockInfo?.category === 'cis' 
                ? (isRu 
                    ? '🔒 Раздел Письмо Будут доступ 1 ноября 2026 год. Выбор страны сохранится в вашем профиле.' 
                    : '🔒 Section Letters will be available November 1, 2026. Your country choice is saved in profile.')
                : (isRu 
                    ? '🔒 Заблокированные языки будут доступ 1 ноября 2026 год. Интерфейс пока переключен на доступный язык.' 
                    : '🔒 Locked languages will be available November 1, 2026. UI temporarily set to available language.')}
            </p>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setErrorMessage(null);
      setSuccessMessage(null);
      setShowForgotPassword(false);
      setResetSent(false);
      setIsOperationNotAllowed(false);
      setNotAllowedProvider(null);

      if (initialTab === 'register') {
        setDisplayName(user.name !== 'Ученик 6601' && user.name !== 'Ученик' && !user.name.includes('Гость') ? user.name : '');
        setUsername(user.username && !user.username.startsWith('incognito_') && !user.username.startsWith('user_') ? user.username : '');
        setAvatarColor(user.avatarColor || 'bg-duo-blue');
        setAvatarIcon(user.avatarIcon || '🦉');
      } else if (initialTab === 'login') {
        // Prepopulate email or username if user has one
        if (user.email) {
          setEmail(user.email);
        } else if (user.username && !user.username.startsWith('incognito_')) {
          setEmail(user.username);
        }
      }
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, text: isRu ? 'Слабый' : 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { score: 2, text: isRu ? 'Средний' : 'Medium', color: 'bg-amber-500' };
    return { score: 3, text: isRu ? 'Надёжный' : 'Strong', color: 'bg-emerald-500' };
  };

  const pwdStrength = getPasswordStrength(password);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#58cc02', '#1cb0f6', '#ffc800', '#ce82ff'],
      });
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  };

  // Helper to save registered account locally
  const saveAccountLocally = (acc: { email: string; username: string; name: string; userProgress: UserProgress; password?: string }) => {
    try {
      const existingStr = localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
      const accounts = existingStr ? JSON.parse(existingStr) : {};
      if (acc.email) {
        accounts[acc.email.toLowerCase()] = acc;
      }
      if (acc.username) {
        accounts[acc.username.toLowerCase().replace(/^@/, '')] = acc;
      }
      localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.warn('Failed to save account locally:', e);
    }
  };

  // Helper to find local account by email or username
  const findLocalAccount = (ident: string): { email?: string; username?: string; name?: string; userProgress?: UserProgress; password?: string } | null => {
    try {
      const existingStr = localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
      const cleanIdent = ident.trim().toLowerCase().replace(/^@/, '');
      if (existingStr) {
        const accounts = JSON.parse(existingStr);
        if (accounts[cleanIdent]) return accounts[cleanIdent];

        // Deep search through all keys & records
        for (const k of Object.keys(accounts)) {
          const acc = accounts[k];
          if (!acc) continue;
          if (
            (acc.email && acc.email.toLowerCase() === cleanIdent) ||
            (acc.username && acc.username.toLowerCase().replace(/^@/, '') === cleanIdent) ||
            (acc.name && acc.name.toLowerCase() === cleanIdent)
          ) {
            return acc;
          }
        }
      }

      // Also check current user progress in localStorage
      const currentSaved = localStorage.getItem('duowindo_user_progress_v3');
      if (currentSaved) {
        const curr = JSON.parse(currentSaved);
        if (
          (curr.email && curr.email.toLowerCase() === cleanIdent) ||
          (curr.username && curr.username.toLowerCase().replace(/^@/, '') === cleanIdent) ||
          (curr.name && curr.name.toLowerCase() === cleanIdent)
        ) {
          return {
            email: curr.email,
            username: curr.username,
            name: curr.name,
            userProgress: curr,
          };
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // Instant 1-click fallback to local account when Firebase Auth provider is disabled
  const handleQuickLocalFallback = () => {
    playSound('click');
    localStorage.setItem('duo_reg_prompt_seen_6601', 'true');

    if (activeTab === 'register') {
      const cleanEmail = email.trim().toLowerCase() || `${username.trim() || 'user'}@duowindo.local`;
      const cleanUsername = username.trim().replace(/^@/, '').toLowerCase() || `user_${Math.floor(1000 + Math.random() * 9000)}`;
      const cleanDisplayName = displayName.trim() || cleanUsername || (isRu ? 'Ученик' : 'Learner');
      const cleanPass = password || '123456';

      const newUserProgress: UserProgress = applyCountryAndCoursePreferences({
        ...user,
        name: cleanDisplayName,
        username: cleanUsername,
        email: cleanEmail,
        authProvider: 'email',
        avatarColor: avatarColor,
        avatarIcon: avatarIcon,
      });

      setUser(newUserProgress);
      localStorage.setItem('duowindo_user_progress_v3', JSON.stringify(newUserProgress));
      saveAccountLocally({
        email: cleanEmail,
        username: cleanUsername,
        name: cleanDisplayName,
        password: cleanPass,
        userProgress: newUserProgress,
      });

      playSound('success');
      triggerConfetti();
      setToast(
        isRu 
          ? `🎉 Локальный аккаунт создан: ${cleanDisplayName} (@${cleanUsername})!` 
          : `🎉 Local account created: ${cleanDisplayName} (@${cleanUsername})!`
      );
      onClose();
      return;
    }

    if (activeTab === 'google') {
      const googleName = user.name && !user.name.includes('Гость') && user.name !== 'Ученик 6601' 
        ? user.name 
        : (isRu ? 'Ученик Google' : 'Google Learner');
      const googleEmail = user.email || 'learner@gmail.com';
      const cleanUsername = (user.username && !user.username.startsWith('incognito_')) 
        ? user.username 
        : 'google_learner';

      const updatedUser: UserProgress = applyCountryAndCoursePreferences({
        ...user,
        name: googleName,
        email: googleEmail,
        username: cleanUsername,
        authProvider: 'google',
      });

      setUser(updatedUser);
      localStorage.setItem('duowindo_user_progress_v3', JSON.stringify(updatedUser));
      saveAccountLocally({
        email: googleEmail,
        username: cleanUsername,
        name: googleName,
        userProgress: updatedUser,
      });

      playSound('success');
      triggerConfetti();
      setToast(
        isRu 
          ? `🌐 Вход через локальный профиль Google (${googleName})` 
          : `🌐 Signed in with local Google profile (${googleName})`
      );
      onClose();
      return;
    }

    // Tab is 'login'
    const cleanIdent = email.trim() || user.username || 'learner';
    const cleanPass = password;

    const localAcc = findLocalAccount(cleanIdent);
    if (localAcc && localAcc.userProgress) {
      const restored = applyCountryAndCoursePreferences({ ...localAcc.userProgress, authProvider: 'email' as const });
      setUser(restored);
      localStorage.setItem('duowindo_user_progress_v3', JSON.stringify(restored));
      playSound('success');
      triggerConfetti();
      setToast(isRu ? `👋 С возвращением, ${restored.name || cleanIdent}! (Локальный вход)` : `👋 Welcome back, ${restored.name || cleanIdent}! (Local login)`);
      onClose();
      return;
    }

    // Create a new local account right now with credentials entered
    const fallbackUsername = cleanIdent.includes('@') ? cleanIdent.split('@')[0].toLowerCase() : cleanIdent.toLowerCase().replace(/^@/, '');
    const fallbackDisplayName = user.name && user.name !== 'Ученик 6601' ? user.name : fallbackUsername;
    const fallbackEmail = cleanIdent.includes('@') ? cleanIdent.toLowerCase() : `${fallbackUsername}@duowindo.local`;

    const newLocalUser: UserProgress = applyCountryAndCoursePreferences({
      ...user,
      name: fallbackDisplayName,
      username: fallbackUsername,
      email: fallbackEmail,
      authProvider: 'email',
    });

    setUser(newLocalUser);
    localStorage.setItem('duowindo_user_progress_v3', JSON.stringify(newLocalUser));
    saveAccountLocally({
      email: fallbackEmail,
      username: fallbackUsername,
      name: fallbackDisplayName,
      password: cleanPass,
      userProgress: newLocalUser,
    });

    playSound('success');
    triggerConfetti();
    setToast(
      isRu 
        ? `✨ Успешный локальный вход (@${fallbackUsername})! Весь прогресс сохранён.` 
        : `✨ Signed in locally (@${fallbackUsername})! All progress saved.`
    );
    onClose();
  };

  // ==========================================
  // HANDLER: LOGIN WITH EMAIL OR USERNAME
  // ==========================================
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanIdent = email.trim();
    const cleanPass = password;

    if (!cleanIdent) {
      setErrorMessage(isRu ? 'Пожалуйста, укажите ваш Email или имя пользователя' : 'Please enter your Email or Username');
      playSound('wrong');
      return;
    }
    if (!cleanPass) {
      setErrorMessage(isRu ? 'Пожалуйста, введите пароль' : 'Please enter your password');
      playSound('wrong');
      return;
    }

    setLoading(true);
    playSound('click');

    try {
      let targetEmail = cleanIdent;

      // If user entered username (e.g. "@alex" or "alex" without "@"), look up mapped email from local accounts registry
      if (!cleanIdent.includes('@')) {
        const localAcc = findLocalAccount(cleanIdent);
        if (localAcc && localAcc.email) {
          targetEmail = localAcc.email;
        } else {
          // If no email mapped, treat as username@duowindo.local for Firebase Auth or check local storage
          targetEmail = `${cleanIdent.toLowerCase().replace(/[^a-z0-9_]/g, '')}@duowindo.local`;
        }
      }

      let firebaseAuthSucceeded = false;
      try {
        const userCred = await signInWithEmailAndPassword(auth, targetEmail, cleanPass);
        setFirebaseUser(userCred.user);
        firebaseAuthSucceeded = true;

        // Fetch user data from Firestore
        try {
          const userDocRef = doc(db, 'users', userCred.user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProgress;
            const updatedUser: UserProgress = {
              ...user,
              ...data,
              email: userCred.user.email || targetEmail,
              authProvider: 'email',
            };
            setUser(updatedUser);
            localStorage.setItem('duowindo_user_progress_v3', JSON.stringify(updatedUser));
          } else {
            // Document not found in Firestore, update local user with email
            const updatedUser: UserProgress = {
              ...user,
              email: userCred.user.email || targetEmail,
              name: userCred.user.displayName || user.name,
              authProvider: 'email',
            };
            setUser(updatedUser);
            localStorage.setItem('duowindo_user_progress_v3', JSON.stringify(updatedUser));
            await setDoc(userDocRef, {
              ...updatedUser,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }, { merge: true });
          }
        } catch (dbErr) {
          console.warn('Firestore load on login warning:', dbErr);
        }
      } catch (authErr: any) {
        console.warn('Firebase Auth error during email login:', authErr);
        const code = authErr?.code || '';
        const isNotAllowed = code === 'auth/operation-not-allowed' || authErr?.message?.includes('operation-not-allowed');

        // Check if there is a local offline account matching this username/email
        const localAcc = findLocalAccount(cleanIdent);
        if (localAcc && localAcc.userProgress) {
          // If password was stored, check it
          if (localAcc.password && cleanPass && localAcc.password !== cleanPass) {
            throw new Error(isRu ? 'Неверный пароль' : 'Incorrect password');
          }
          // Successfully restored local offline account!
          const restored = { ...localAcc.userProgress, authProvider: 'email' as const };
          setUser(restored);
          localStorage.setItem('duowindo_user_progress_v3', JSON.stringify(restored));
          firebaseAuthSucceeded = true;
        } else if (isNotAllowed) {
          setIsOperationNotAllowed(true);
          setNotAllowedProvider('email');
          // Automatically restore or create a full local account so user is never blocked by Firebase Console configuration
          const cleanUsername = cleanIdent.includes('@') ? cleanIdent.split('@')[0].toLowerCase() : cleanIdent.toLowerCase().replace(/^@/, '');
          const cleanEmail = cleanIdent.includes('@') ? cleanIdent.toLowerCase() : `${cleanUsername}@duowindo.local`;
          const autoUser: UserProgress = {
            ...user,
            email: cleanEmail,
            username: cleanUsername,
            name: cleanUsername,
            authProvider: 'email',
          };
          setUser(autoUser);
          localStorage.setItem('duowindo_user_progress_v3', JSON.stringify(autoUser));
          saveAccountLocally({
            email: cleanEmail,
            username: cleanUsername,
            name: cleanUsername,
            password: cleanPass,
            userProgress: autoUser,
          });
          firebaseAuthSucceeded = true;
          setToast(
            isRu 
              ? `⚡ Вход выполнен локально (Email Auth отключен в Firebase)` 
              : `⚡ Signed in locally (Email Auth disabled in Firebase)`
          );
        } else {
          // Translate error messages
          if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
            throw new Error(isRu ? 'Неверный Email/имя пользователя или пароль' : 'Invalid email/username or password');
          } else if (code === 'auth/invalid-email') {
            throw new Error(isRu ? 'Некорректный формат адреса электронной почты' : 'Invalid email address format');
          } else if (code === 'auth/too-many-requests') {
            throw new Error(isRu ? 'Слишком много неудачных попыток. Пожалуйста, подождите немного' : 'Too many failed attempts. Please try again later');
          } else {
            throw new Error(authErr.message || (isRu ? 'Ошибка при входе в аккаунт' : 'Failed to sign in'));
          }
        }
      }

      localStorage.setItem('duo_reg_prompt_seen_6601', 'true');
      playSound('success');
      triggerConfetti();

      const welcomeName = user.username ? `@${user.username}` : (user.name || cleanIdent);
      setToast(isRu ? `👋 С возвращением, ${welcomeName}!` : `👋 Welcome back, ${welcomeName}!`);
      onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err.message || (isRu ? 'Ошибка входа' : 'Sign in failed'));
      playSound('wrong');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HANDLER: REGISTER WITH EMAIL & USERNAME & PASSWORD
  // ==========================================
  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();
    const cleanDisplayName = displayName.trim() || cleanUsername || (isRu ? 'Ученик' : 'Learner');
    const cleanPass = password;
    const cleanConfirm = confirmPassword;

    // 1. Validations
    if (!cleanEmail) {
      setErrorMessage(isRu ? 'Пожалуйста, введите Email' : 'Please enter an Email');
      playSound('wrong');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage(isRu ? 'Некорректный формат Email (пример: name@mail.com)' : 'Invalid email format (e.g. name@mail.com)');
      playSound('wrong');
      return;
    }

    if (!cleanUsername) {
      setErrorMessage(isRu ? 'Пожалуйста, придумайте имя пользователя (@username)' : 'Please enter a username (@username)');
      playSound('wrong');
      return;
    }
    if (cleanUsername.length < 3) {
      setErrorMessage(isRu ? 'Имя пользователя должно быть не менее 3 символов' : 'Username must be at least 3 characters');
      playSound('wrong');
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
      setErrorMessage(isRu ? 'Имя пользователя может содержать только латинские буквы, цифры и _ - .' : 'Username can only contain English letters, numbers, and _ - .');
      playSound('wrong');
      return;
    }

    if (!cleanPass) {
      setErrorMessage(isRu ? 'Пожалуйста, введите пароль' : 'Please enter a password');
      playSound('wrong');
      return;
    }
    if (cleanPass.length < 6) {
      setErrorMessage(isRu ? 'Пароль должен содержать минимум 6 символов' : 'Password must be at least 6 characters long');
      playSound('wrong');
      return;
    }
    if (cleanPass !== cleanConfirm) {
      setErrorMessage(isRu ? 'Пароли не совпадают' : 'Passwords do not match');
      playSound('wrong');
      return;
    }

    setLoading(true);
    playSound('click');

    try {
      let createdFirebaseUser: any = null;

      // 1. Try Firebase Auth registration
      try {
        const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
        createdFirebaseUser = userCred.user;
        setFirebaseUser(createdFirebaseUser);

        // Update display name in Firebase Auth
        await updateProfile(createdFirebaseUser, {
          displayName: cleanDisplayName,
        });
      } catch (authErr: any) {
        console.warn('Firebase createUserWithEmailAndPassword note:', authErr);
        const code = authErr?.code || '';
        const isNotAllowed = code === 'auth/operation-not-allowed' || authErr?.message?.includes('operation-not-allowed');

        if (code === 'auth/email-already-in-use') {
          throw new Error(isRu ? 'Этот Email уже зарегистрирован. Пожалуйста, перейдите на вкладку "Вход".' : 'This email is already registered. Please switch to the "Login" tab.');
        } else if (code === 'auth/weak-password') {
          throw new Error(isRu ? 'Пароль слишком простой (минимум 6 символов)' : 'Password is too weak (minimum 6 characters)');
        } else if (code === 'auth/invalid-email') {
          throw new Error(isRu ? 'Некорректный Email' : 'Invalid email address');
        } else if (isNotAllowed) {
          setIsOperationNotAllowed(true);
          setNotAllowedProvider('email');
          console.warn('Firebase Auth email registration disabled in console, proceeding with full local registration.');
        } else {
          // If auth provider disabled or network/offline, we still proceed with local profile and warn
          console.warn('Proceeding with full local account registration fallback:', authErr.message);
        }
      }

      // 2. Prepare updated user progress
      const newUserProgress: UserProgress = applyCountryAndCoursePreferences({
        ...user,
        name: cleanDisplayName,
        username: cleanUsername,
        email: cleanEmail,
        authProvider: 'email',
        avatarColor: avatarColor,
        avatarIcon: avatarIcon,
      });

      setUser(newUserProgress);
      localStorage.setItem('duowindo_user_progress_v3', JSON.stringify(newUserProgress));
      localStorage.setItem('duo_reg_prompt_seen_6601', 'true');

      // 3. Save account in local accounts map for fast multi-device / multi-account offline switching
      saveAccountLocally({
        email: cleanEmail,
        username: cleanUsername,
        name: cleanDisplayName,
        password: cleanPass,
        userProgress: newUserProgress,
      });

      // 4. Save to Firestore if Firebase user exists
      if (createdFirebaseUser) {
        try {
          const userDocRef = doc(db, 'users', createdFirebaseUser.uid);
          await setDoc(userDocRef, {
            ...newUserProgress,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }, { merge: true });
        } catch (dbErr) {
          console.warn('Firestore user profile save error:', dbErr);
          handleFirestoreError(dbErr, OperationType.CREATE, `users/${createdFirebaseUser.uid}`);
        }
      }

      playSound('success');
      triggerConfetti();
      setToast(
        isRu 
          ? `🎉 Добро пожаловать, ${cleanDisplayName} (@${cleanUsername})!` 
          : `🎉 Welcome, ${cleanDisplayName} (@${cleanUsername})!`
      );
      onClose();
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMessage(err.message || (isRu ? 'Ошибка при регистрации' : 'Registration failed'));
      playSound('wrong');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HANDLER: GOOGLE SIGN-IN
  // ==========================================
  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setLoading(true);
    playSound('click');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      setFirebaseUser(result.user);

      // Load or create profile in Firestore
      const userRef = doc(db, 'users', result.user.uid);
      const docSnap = await getDoc(userRef);

      const googleName = result.user.displayName || (isRu ? 'Ученик Google' : 'Google Learner');
      const googleEmail = result.user.email || '';
      const fallbackUsername = googleEmail ? googleEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : `user_${Math.floor(1000 + Math.random() * 9000)}`;

      let updatedUser: UserProgress;
      if (docSnap.exists()) {
        const cloudData = docSnap.data() as UserProgress;
        updatedUser = applyCountryAndCoursePreferences({
          ...user,
          ...cloudData,
          email: googleEmail || cloudData.email,
          authProvider: 'google',
        });
      } else {
        updatedUser = applyCountryAndCoursePreferences({
          ...user,
          name: googleName,
          email: googleEmail,
          username: user.username && !user.username.startsWith('incognito_') ? user.username : fallbackUsername,
          authProvider: 'google',
        });
        await setDoc(userRef, {
          ...updatedUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      setUser(updatedUser);
      localStorage.setItem('duowindo_user_progress_v3', JSON.stringify(updatedUser));
      localStorage.setItem('duo_reg_prompt_seen_6601', 'true');

      saveAccountLocally({
        email: googleEmail,
        username: updatedUser.username || fallbackUsername,
        name: updatedUser.name,
        userProgress: updatedUser,
      });

      playSound('success');
      triggerConfetti();
      setToast(
        isRu 
          ? `🌐 Успешный вход через Google (${result.user.displayName || result.user.email})` 
          : `🌐 Signed in with Google (${result.user.displayName || result.user.email})`
      );
      onClose();
    } catch (err: any) {
      console.warn('Google Sign-in error:', err);
      const code = err?.code || '';
      const errMsg = err?.message || String(err);
      const isNotAllowed = code === 'auth/operation-not-allowed' || errMsg.includes('operation-not-allowed');

      if (isNotAllowed) {
        setIsOperationNotAllowed(true);
        setNotAllowedProvider('google');

        // Seamless local fallback for Google profile
        const googleName = user.name && !user.name.includes('Гость') && user.name !== 'Ученик 6601' 
          ? user.name 
          : (isRu ? 'Ученик Google' : 'Google Learner');
        const googleEmail = user.email && user.email.includes('@') ? user.email : 'learner@gmail.com';
        const fallbackUsername = googleEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || 'google_learner';

        const updatedUser: UserProgress = {
          ...user,
          name: googleName,
          email: googleEmail,
          username: user.username && !user.username.startsWith('incognito_') ? user.username : fallbackUsername,
          authProvider: 'google',
        };

        setUser(updatedUser);
        localStorage.setItem('duowindo_user_progress_v3', JSON.stringify(updatedUser));
        localStorage.setItem('duo_reg_prompt_seen_6601', 'true');

        saveAccountLocally({
          email: googleEmail,
          username: updatedUser.username || fallbackUsername,
          name: updatedUser.name,
          userProgress: updatedUser,
        });

        playSound('success');
        triggerConfetti();
        setToast(
          isRu 
            ? `🌐 Вход выполнен через Google (Автономный профиль, провайдер отключен в Firebase)` 
            : `🌐 Signed in with Google (Offline profile, auth provider disabled in Firebase)`
        );
        onClose();
        return;
      }

      if (
        errMsg.includes('auth/cancelled-popup-request') || 
        errMsg.includes('popup-closed-by-user') || 
        errMsg.includes('popup-blocked')
      ) {
        setErrorMessage(
          isRu 
            ? 'Окно авторизации Google было закрыто или заблокировано браузером. Разрешите всплывающие окна или откройте в новой вкладке.' 
            : 'Google popup was closed or blocked. Please allow popups or open in a new tab.'
        );
      } else {
        setErrorMessage(err.message || (isRu ? 'Ошибка входа через Google' : 'Google sign-in error'));
      }
      playSound('wrong');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HANDLER: FORGOT PASSWORD RESET
  // ==========================================
  const handleSendPasswordReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = resetEmail.trim().toLowerCase();
    if (!clean) {
      setErrorMessage(isRu ? 'Введите Email для сброса пароля' : 'Enter your email to reset password');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await sendPasswordResetEmail(auth, clean);
      setResetSent(true);
      playSound('success');
      setToast(isRu ? `📧 Ссылка для сброса отправлена на ${clean}` : `📧 Password reset link sent to ${clean}`);
    } catch (err: any) {
      console.warn('Password reset error:', err);
      setErrorMessage(err.message || (isRu ? 'Не удалось отправить ссылку' : 'Failed to send reset link'));
      playSound('wrong');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HANDLERS: INCOGNITO EXPORT
  // ==========================================
  const handleDownloadIncognitoData = () => {
    playSound('correct');
    const filename = downloadIncognitoDataFile(user, user.language);
    setToast(
      isRu 
        ? `💾 Файл ${filename} успешно сохранён!` 
        : `💾 File ${filename} successfully downloaded!`
    );
  };

  const handleCopyIncognitoData = async () => {
    playSound('click');
    const ok = await copyIncognitoDataToClipboard(user, user.language);
    if (ok) {
      setExportCopied(true);
      setToast(
        isRu 
          ? '📋 Данные Режима Инкогнито скопированы в буфер обмена!' 
          : '📋 Incognito data copied to clipboard!'
      );
      setTimeout(() => setExportCopied(false), 3000);
    } else {
      playSound('wrong');
      setToast(isRu ? '❌ Не удалось скопировать данные' : '❌ Failed to copy data');
    }
  };

  // ==========================================
  // HANDLER: CONTINUE AS INCOGNITO
  // ==========================================
  const handleContinueIncognito = () => {
    if (incognitoClosed) {
      playSound('wrong');
      setErrorMessage(
        isRu 
          ? `🚫 Вход в Режим Инкогнито (Без аккаунта) закрыт с 10 октября 2026 года! Пожалуйста, используйте Полный Вход (Email / Google) или зарегистрируйтесь.` 
          : `🚫 Incognito Mode entry is closed since October 10, 2026! Please use Full Sign-In (Email / Google) or create an account.`
      );
      setToast(
        isRu 
          ? '🚫 Вход в Режим Инкогнито закрыт с 10.10.2026. Полный Вход и Профиль Администратора открыты.' 
          : '🚫 Incognito login closed since Oct 10, 2026. Full Login & Admin Profile remain active.'
      );
      return;
    }

    playSound('click');
    localStorage.setItem('duo_reg_prompt_seen_6601', 'true');
    const assignedUsername = (user.username && !user.username.startsWith('user_')) 
      ? user.username 
      : `incognito_${Math.floor(100 + Math.random() * 900)}`;
    const guestUser: UserProgress = {
      ...user,
      name: (user.name === "Ученик 6601" || user.name === "Ученик") ? (isRu ? "Гость (Инкогнито)" : "Guest (Incognito)") : user.name,
      username: assignedUsername,
      authProvider: 'guest',
    };
    setUser(guestUser);
    localStorage.setItem('duowindo_user_progress_v3', JSON.stringify(guestUser));
    setToast(isRu ? `🕵️ Режим Инкогнито активен (@${assignedUsername})` : `🕵️ Incognito Mode active (@${assignedUsername})`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={() => { playSound('click'); onClose(); }} 
      />

      <div className="relative z-10 w-full max-w-lg bg-gray-900 border-2 border-duo-blue/70 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-left">
        
        {/* HEADER & CLOSE BUTTON */}
        <div className="flex items-start justify-between border-b border-gray-800 pb-3.5">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-duo-blue to-purple-600 border-2 border-white/40 flex items-center justify-center text-2xl shadow-lg shrink-0">
              {activeTab === 'login' && '🔑'}
              {activeTab === 'register' && '📝'}
              {activeTab === 'google' && '🌐'}
              {activeTab === 'incognito' && (incognitoClosed ? '🔒' : '🕵️')}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                {activeTab === 'login' && (isRu ? 'Полный Вход в DuoWindo' : 'Full Sign-In to DuoWindo')}
                {activeTab === 'register' && (isRu ? 'Регистрация аккаунта' : 'Create DuoWindo Account')}
                {activeTab === 'google' && (isRu ? 'Вход через Google' : 'Google Sign-In')}
                {activeTab === 'incognito' && (incognitoClosed 
                  ? (isRu ? 'Режим Инкогнито (Вход закрыт)' : 'Incognito Mode (Closed)') 
                  : (isRu ? 'Режим Инкогнито' : 'Incognito Guest Mode'))}
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                {activeTab === 'login' && (isRu ? 'Полный Вход по Email, имени пользователя и паролю' : 'Full Sign-In with Email or Username & password')}
                {activeTab === 'register' && (isRu ? 'Создайте профиль с Email, никнеймом и паролем' : 'Register with Email, Username, and password')}
                {activeTab === 'google' && (isRu ? 'Мгновенный вход и облачная синхронизация' : 'Instant cloud progress synchronization')}
                {activeTab === 'incognito' && (incognitoClosed
                  ? (isRu ? 'Вход без аккаунта закрыт с 10 октября 2026 г. Доступен экспорт данных.' : 'Login without account closed since Oct 10, 2026. Data export available.')
                  : (isRu ? 'Играйте анонимно без регистрации и паролей (закрывается 10.10.2026)' : 'Play anonymously without account (closes Oct 10, 2026)'))}
              </p>
            </div>
          </div>
          <button
            onClick={() => { playSound('click'); onClose(); }}
            className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 transition-colors shrink-0 cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* NAVIGATION TABS (4 TABS) */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-gray-950/80 rounded-2xl border border-gray-800">
          <button
            type="button"
            onClick={() => { playSound('click'); setActiveTab('login'); setErrorMessage(null); setShowForgotPassword(false); }}
            className={`py-2.5 px-2 rounded-xl font-black text-xs transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-duo-blue text-white shadow-lg border-b-2 border-duo-blueDark'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <span>🔑</span>
            <span className="truncate">{isRu ? 'Полный Вход' : 'Full Login'}</span>
          </button>

          <button
            type="button"
            onClick={() => { playSound('click'); setActiveTab('register'); setErrorMessage(null); setShowForgotPassword(false); }}
            className={`py-2.5 px-2 rounded-xl font-black text-xs transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-emerald-600 text-white shadow-lg border-b-2 border-emerald-800'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <span>✨</span>
            <span className="truncate">{isRu ? 'Регистрация' : 'Register'}</span>
          </button>

          <button
            type="button"
            onClick={() => { playSound('click'); setActiveTab('google'); setErrorMessage(null); setShowForgotPassword(false); }}
            className={`py-2.5 px-2 rounded-xl font-black text-xs transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'google'
                ? 'bg-purple-600 text-white shadow-lg border-b-2 border-purple-800'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <span>🌐</span>
            <span className="truncate">Google</span>
          </button>

          <button
            type="button"
            onClick={() => { playSound('click'); setActiveTab('incognito'); setErrorMessage(null); setShowForgotPassword(false); }}
            className={`py-2.5 px-2 rounded-xl font-black text-xs transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer relative ${
              activeTab === 'incognito'
                ? (incognitoClosed 
                    ? 'bg-rose-900 text-white shadow-lg border-b-2 border-rose-950' 
                    : 'bg-amber-600 text-white shadow-lg border-b-2 border-amber-800')
                : (incognitoClosed 
                    ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50')
            }`}
          >
            <span>{incognitoClosed ? '🔒' : '🕵️'}</span>
            <span className="truncate">{isRu ? 'Инкогнито' : 'Guest'}</span>
            {incognitoClosed && (
              <span className="text-[8px] bg-rose-600 text-white px-1 py-0.2 rounded font-black hidden sm:inline ml-0.5">
                {isRu ? 'Закрыт' : 'Closed'}
              </span>
            )}
          </button>
        </div>

        {/* OPERATION NOT ALLOWED NOTIFICATION & QUICK ACTION */}
        {isOperationNotAllowed && (
          <div className="p-3.5 bg-amber-950/70 border-2 border-amber-500/70 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <span className="text-xl shrink-0">💡</span>
              <div className="text-xs">
                <p className="font-black text-amber-300 uppercase">
                  {isRu ? 'Автономный режим аккаунта' : 'Offline Account Mode'}
                </p>
                <p className="text-amber-200/90 font-medium">
                  {isRu 
                    ? 'Провайдер авторизации отключен в Firebase (auth/operation-not-allowed). Вы можете войти в локальный профиль в один клик!' 
                    : 'Auth provider disabled in Firebase (auth/operation-not-allowed). You can sign in locally with 1 click!'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickLocalFallback}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow-lg uppercase tracking-wider shrink-0 cursor-pointer"
            >
              {isRu ? '⚡ Войти локально' : '⚡ Sign in locally'}
            </button>
          </div>
        )}

        {/* ERROR / SUCCESS ALERTS */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/70 border border-rose-500/60 rounded-2xl text-xs text-rose-200 font-bold flex items-center space-x-2.5 animate-in fade-in">
            <span className="text-base shrink-0">⚠️</span>
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-500/60 rounded-2xl text-xs text-emerald-200 font-bold flex items-center space-x-2.5 animate-in fade-in">
            <span className="text-base shrink-0">✅</span>
            <span className="flex-1">{successMessage}</span>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 1: LOGIN (EMAIL / USERNAME + PASSWORD) */}
        {/* ========================================== */}
        {activeTab === 'login' && (
          <div className="space-y-4 animate-in fade-in">
            {showForgotPassword ? (
              // PASSWORD RESET VIEW
              <form onSubmit={handleSendPasswordReset} className="space-y-3.5 bg-gray-950/60 border border-gray-800 p-4 rounded-2xl">
                <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
                  <span>🔒</span>
                  <span>{isRu ? 'Восстановление пароля' : 'Password Recovery'}</span>
                </div>
                <p className="text-xs text-gray-300 font-medium">
                  {isRu 
                    ? 'Укажите адрес электронной почты, привязанный к вашему аккаунту. Мы отправим ссылку для сброса пароля.' 
                    : 'Enter the email address associated with your account. We will send you a password reset link.'}
                </p>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full bg-gray-900 border-2 border-gray-700 focus:border-duo-blue rounded-2xl px-4 py-2.5 text-sm text-white font-medium focus:outline-none"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="submit"
                    disabled={loading || resetSent}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black text-xs rounded-xl border-b-2 border-purple-800 uppercase tracking-wider cursor-pointer shadow-md"
                  >
                    {loading ? (isRu ? 'Отправка...' : 'Sending...') : (resetSent ? (isRu ? 'Отправлено!' : 'Sent!') : (isRu ? 'Отправить ссылку' : 'Send Reset Link'))}
                  </button>
                  <button
                    type="button"
                    onClick={() => { playSound('click'); setShowForgotPassword(false); }}
                    className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl border border-gray-700 cursor-pointer"
                  >
                    {isRu ? 'Назад' : 'Back'}
                  </button>
                </div>
              </form>
            ) : (
              // STANDARD LOGIN FORM
              <form onSubmit={handleLogin} className="space-y-3.5">
                {/* IDENTIFIER: EMAIL OR USERNAME */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                    <span>{isRu ? 'Email или Имя пользователя (@username)' : 'Email or Username (@username)'}</span>
                    <span className="text-[10px] text-duo-blue font-extrabold">{isRu ? '*Обязательно' : '*Required'}</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">👤</span>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={isRu ? 'name@mail.com или @username' : 'name@mail.com or @username'}
                      required
                      autoComplete="username"
                      className="w-full bg-gray-950 border-2 border-gray-700 focus:border-duo-blue rounded-2xl pl-10 pr-4 py-3 text-sm text-white font-medium focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      {isRu ? 'Пароль' : 'Password'}
                    </label>
                    <button
                      type="button"
                      onClick={() => { playSound('click'); setShowForgotPassword(true); setResetEmail(email.includes('@') ? email : ''); }}
                      className="text-[11px] text-duo-blue hover:text-duo-blue/80 font-bold hover:underline cursor-pointer"
                    >
                      {isRu ? 'Забыли пароль?' : 'Forgot password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isRu ? 'Введите пароль' : 'Enter password'}
                      required
                      autoComplete="current-password"
                      className="w-full bg-gray-950 border-2 border-gray-700 focus:border-duo-blue rounded-2xl pl-10 pr-11 py-3 text-sm text-white font-medium focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-200 cursor-pointer text-sm"
                      title={showPassword ? (isRu ? 'Скрыть пароль' : 'Hide password') : (isRu ? 'Показать пароль' : 'Show password')}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {/* REMEMBER ME & HINTS */}
                <div className="flex items-center justify-between text-xs text-gray-400 font-medium pt-0.5">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-gray-950 border-gray-700 text-duo-blue focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span>{isRu ? 'Запомнить меня' : 'Remember me'}</span>
                  </label>
                  <span className="text-[11px] text-emerald-400 font-bold">🔒 DuoWindo 6601 Cloud</span>
                </div>

                {/* COUNTRY & LANGUAGE SELECTOR */}
                {renderCountryAndLanguageSelectors()}

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-duo-blue hover:brightness-110 disabled:opacity-50 text-white font-black rounded-2xl border-b-4 border-duo-blueDark active:border-b-0 active:translate-y-1 transition-all uppercase text-xs tracking-wider shadow-lg flex items-center justify-center space-x-2 cursor-pointer mt-2"
                >
                  {loading ? (
                    <span className="animate-spin text-base">⏳</span>
                  ) : (
                    <span>🚀</span>
                  )}
                  <span>{loading ? (isRu ? 'Вход в аккаунт...' : 'Signing in...') : (isRu ? 'Войти в аккаунт' : 'Sign In')}</span>
                </button>

                {/* QUICK GOOGLE SIGN IN BUTTON */}
                <div className="relative py-2 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-800" />
                  </div>
                  <span className="relative px-3 bg-gray-900 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                    {isRu ? 'или через' : 'or continue with'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full py-3 bg-white hover:bg-gray-100 text-gray-900 font-black rounded-2xl border-b-4 border-gray-300 active:border-b-0 active:translate-y-1 transition-all text-xs uppercase tracking-wider shadow-md flex items-center justify-center space-x-2.5 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1c0 2.8.7 5.4 1.9 7.8l3.7-2.9z" />
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
                  </svg>
                  <span>{isRu ? 'Войти через Google' : 'Sign in with Google'}</span>
                </button>

                {/* SWITCH TO REGISTER LINK */}
                <div className="pt-2 text-center border-t border-gray-800/80">
                  <p className="text-xs text-gray-400 font-medium">
                    {isRu ? 'Нет аккаунта?' : "Don't have an account?"}{' '}
                    <button
                      type="button"
                      onClick={() => { playSound('click'); setActiveTab('register'); setErrorMessage(null); }}
                      className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer ml-1"
                    >
                      {isRu ? 'Зарегистрироваться' : 'Create Account'}
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: REGISTER (EMAIL, USERNAME, DISPLAY NAME, PASSWORD) */}
        {/* ========================================== */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5 animate-in fade-in">
            
            {/* EMAIL */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                <span>Email (Электронная почта)</span>
                <span className="text-[10px] text-emerald-400 font-extrabold">{isRu ? '*Обязательно' : '*Required'}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📧</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                  className="w-full bg-gray-950 border-2 border-gray-700 focus:border-emerald-500 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white font-medium focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* USERNAME (@username) & DISPLAY NAME (GRID) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                  <span>{isRu ? 'Имя (@username)' : 'Username'}</span>
                  <span className="text-[10px] text-emerald-400 font-extrabold">{isRu ? '*Ник' : '*Handle'}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 font-black text-sm">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                    placeholder="alex_6601"
                    required
                    autoComplete="username"
                    className="w-full bg-gray-950 border-2 border-gray-700 focus:border-emerald-500 rounded-2xl pl-9 pr-3 py-2.5 text-sm text-white font-bold focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  {isRu ? 'Ваше Имя' : 'Display Name'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🪪</span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={isRu ? 'Анатолий' : 'Alex'}
                    autoComplete="name"
                    className="w-full bg-gray-950 border-2 border-gray-700 focus:border-emerald-500 rounded-2xl pl-10 pr-3 py-2.5 text-sm text-white font-medium focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* PASSWORD & CONFIRM PASSWORD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                  <span>{isRu ? 'Пароль' : 'Password'}</span>
                  {password && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-black text-white ${pwdStrength.color}`}>
                      {pwdStrength.text}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isRu ? 'Мин. 6 знаков' : 'Min 6 chars'}
                    required
                    autoComplete="new-password"
                    className="w-full bg-gray-950 border-2 border-gray-700 focus:border-emerald-500 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-white font-medium focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-200 cursor-pointer text-xs"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  {isRu ? 'Повторите пароль' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={isRu ? 'Повторите' : 'Repeat'}
                    required
                    autoComplete="new-password"
                    className={`w-full bg-gray-950 border-2 ${
                      confirmPassword && password !== confirmPassword 
                        ? 'border-rose-500' 
                        : confirmPassword && password === confirmPassword 
                        ? 'border-emerald-500' 
                        : 'border-gray-700 focus:border-emerald-500'
                    } rounded-2xl pl-10 pr-10 py-2.5 text-sm text-white font-medium focus:outline-none transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-200 cursor-pointer text-xs"
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </div>

            {/* AVATAR COLOR & EMOJI QUICK SELECT */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                {isRu ? 'Выбор аватарки и маскота' : 'Select Avatar & Mascot'}
              </label>
              <div className="flex items-center space-x-3 bg-gray-950/70 p-2 rounded-2xl border border-gray-800">
                <div className={`w-12 h-12 rounded-2xl ${avatarColor} border-2 border-white/80 flex items-center justify-center text-2xl shadow-md shrink-0`}>
                  {avatarIcon}
                </div>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {['🦉', '👑', '🚀', '⚡', '🏆', '♟️', '🎨', '🔥', '🦁', '🌟'].map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => { playSound('click'); setAvatarIcon(icon); }}
                      className={`w-7 h-7 rounded-xl bg-gray-900 border transition-all text-sm flex items-center justify-center cursor-pointer ${
                        avatarIcon === icon ? 'border-emerald-400 bg-emerald-950/60 scale-110 shadow-sm' : 'border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* COUNTRY & LANGUAGE SELECTOR */}
            {renderCountryAndLanguageSelectors()}

            {/* SUBMIT REGISTRATION BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-2xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all uppercase text-xs tracking-wider shadow-lg flex items-center justify-center space-x-2 cursor-pointer mt-1"
            >
              {loading ? (
                <span className="animate-spin text-base">⏳</span>
              ) : (
                <span>🚀</span>
              )}
              <span>{loading ? (isRu ? 'Создание аккаунта...' : 'Creating account...') : (isRu ? 'Зарегистрироваться и Начать' : 'Create Account & Start')}</span>
            </button>

            {/* SWITCH TO LOGIN */}
            <div className="pt-2 text-center border-t border-gray-800/80">
              <p className="text-xs text-gray-400 font-medium">
                {isRu ? 'Уже есть аккаунт?' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => { playSound('click'); setActiveTab('login'); setErrorMessage(null); }}
                  className="text-duo-blue hover:text-duo-blue/80 font-bold underline cursor-pointer ml-1"
                >
                  {isRu ? 'Войти' : 'Sign in'}
                </button>
              </p>
            </div>
          </form>
        )}

        {/* ========================================== */}
        {/* TAB 3: GOOGLE SIGN-IN */}
        {/* ========================================== */}
        {activeTab === 'google' && (
          <div className="space-y-4 animate-in fade-in py-1">
            <div className="bg-purple-950/40 border-2 border-purple-500/50 p-4 sm:p-5 rounded-2xl space-y-3 text-left">
              <div className="flex items-center space-x-3">
                <span className="text-3xl shrink-0">🌐</span>
                <div>
                  <h4 className="font-black text-base text-purple-300 uppercase">
                    {t('firebaseCloudSyncTitle')}
                  </h4>
                  <p className="text-xs text-purple-200/80 font-bold">
                    {t('syncAllDevicesDesc')}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-300 font-medium">
                {t('progressSyncNote')}
              </p>
            </div>

            {isIframe && (
              <div className="bg-amber-950/40 border border-amber-800/60 p-3 rounded-2xl text-xs text-amber-200 font-medium space-y-2 text-left">
                <p>⚠️ <strong>{t('iframeWarning')}</strong></p>
                <button
                  type="button"
                  onClick={() => { playSound('click'); window.open(window.location.href, '_blank'); }}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-xl active:translate-y-0.5 transition-all uppercase text-[10px] tracking-wider text-center cursor-pointer"
                >
                  {t('openNewTabBtn')}
                </button>
              </div>
            )}

            {/* COUNTRY & LANGUAGE SELECTOR */}
            {renderCountryAndLanguageSelectors()}

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-4 bg-duo-blue hover:brightness-110 disabled:opacity-50 text-white font-black rounded-2xl border-b-4 border-duo-blueDark active:border-b-0 active:translate-y-1 transition-all uppercase text-xs tracking-wider shadow-lg flex items-center justify-center space-x-2.5 cursor-pointer"
            >
              <svg className="w-5 h-5 bg-white rounded-full p-0.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1c0 2.8.7 5.4 1.9 7.8l3.7-2.9z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
              </svg>
              <span>{loading ? (isRu ? 'Вход в аккаунт...' : 'Signing in...') : (isRu ? 'Войти через аккаунт Google' : 'Sign in with Google Account')}</span>
            </button>

            {isOperationNotAllowed && (
              <button
                type="button"
                onClick={handleQuickLocalFallback}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-emerald-500 hover:brightness-110 text-slate-950 font-black rounded-2xl border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all uppercase text-xs tracking-wider shadow-lg flex items-center justify-center space-x-2.5 cursor-pointer"
              >
                <span>⚡</span>
                <span>{isRu ? 'Войти локально через профиль Google' : 'Sign in locally as Google profile'}</span>
              </button>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 4: INCOGNITO / GUEST */}
        {/* ========================================== */}
        {activeTab === 'incognito' && (
          <div className="space-y-3.5 animate-in fade-in py-1">
            {/* CLOSURE STATUS BANNER */}
            <div className={`p-4 rounded-2xl border-2 ${
              incognitoClosed 
                ? 'bg-rose-950/60 border-rose-500/70 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.2)]' 
                : 'bg-amber-950/50 border-amber-500/70 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
            } space-y-2 text-left`}>
              <div className="flex items-center space-x-2.5">
                <span className="text-2xl shrink-0">{incognitoClosed ? '🛑' : '🚫'}</span>
                <div>
                  <h4 className="font-black text-sm text-white uppercase tracking-wide">
                    {getIncognitoClosureTitle(user.language)}
                  </h4>
                  <span className="text-[11px] font-bold opacity-80 block text-amber-300">
                    {incognitoClosed
                      ? (isRu ? 'Новые сессии без аккаунта заблокированы' : 'New anonymous sessions are blocked')
                      : (isIncognitoClosingTomorrow() 
                          ? (isRu ? 'Срок действия истекает сегодня ночью (00:00, 10.10.2026)' : 'Expiring tonight (00:00, Oct 10, 2026)')
                          : (isRu ? `Осталось дней до закрытия: ${daysUntilClosure > 0 ? daysUntilClosure : 0}` : `Days remaining: ${daysUntilClosure > 0 ? daysUntilClosure : 0}`))}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-amber-200 font-bold leading-relaxed">
                  {isRu
                    ? '10 октября 2026 года вход в Режим Инкогнито недоступен, и его нельзя будет восстановить в DuoWindo6601.'
                    : 'On October 10, 2026, entry into Incognito Mode is unavailable and cannot be restored in DuoWindo6601.'}
                </p>
                <p className="text-[11px] text-gray-300 font-medium leading-relaxed">
                  {isRu
                    ? 'Синхронизирован актуальный статус не закрытия: Полный Вход и регистрация работают без ограничений, профиль Администратора доступен.'
                    : 'Synchronized actual unclosed status: Full Sign-In & registration operate normally, Administrator profile is active.'}
                </p>
              </div>
              
              {/* STATUS CONFIRMATION PILLS */}
              <div className="pt-1.5 flex flex-wrap gap-2 text-[11px] font-bold">
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

            {/* DATA EXPORT CARD (NEW FEATURE) */}
            <div className="bg-gray-950/90 border-2 border-emerald-500/50 p-4 rounded-2xl space-y-3 text-left shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">💾</span>
                  <h4 className="font-black text-xs sm:text-sm text-white uppercase tracking-wide">
                    {isRu ? 'Экспорт данных Режим Инкогнито' : 'Incognito Data Export'}
                  </h4>
                </div>
                <span className="text-[10px] text-emerald-300 bg-emerald-950/90 border border-emerald-500/40 px-2 py-0.5 rounded-lg font-mono font-bold">
                  JSON Резервная копия
                </span>
              </div>

              <p className="text-[11px] text-gray-300 font-medium leading-relaxed">
                {isRu
                  ? 'Сохраните все результаты текущей гостевой сессии: пройденные уроки, заработанный XP, стрик, выученные слова и шахматную статистику.'
                  : 'Save all your guest session progress: completed lessons, earned XP, streak, vocabulary, and chess stats.'}
              </p>

              {/* STATS PREVIEW PILLS */}
              <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                <div className="bg-gray-900 border border-gray-800 p-1.5 rounded-xl">
                  <div className="font-black text-white">{user.xp || 0}</div>
                  <div className="text-[9px] text-gray-400 font-bold uppercase">{isRu ? 'XP' : 'XP'}</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 p-1.5 rounded-xl">
                  <div className="font-black text-amber-400">{user.streak || 0} дн.</div>
                  <div className="text-[9px] text-gray-400 font-bold uppercase">{isRu ? 'Стрик' : 'Streak'}</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 p-1.5 rounded-xl">
                  <div className="font-black text-duo-blue">{user.completedLessons?.length || 0}</div>
                  <div className="text-[9px] text-gray-400 font-bold uppercase">{isRu ? 'Уроков' : 'Lessons'}</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 p-1.5 rounded-xl">
                  <div className="font-black text-emerald-400">{user.learnedWords?.length || 0}</div>
                  <div className="text-[9px] text-gray-400 font-bold uppercase">{isRu ? 'Слов' : 'Words'}</div>
                </div>
              </div>

              {/* EXPORT ACTION BUTTONS */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadIncognitoData}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow border-b-2 border-emerald-800 active:translate-y-0.5 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>📥</span>
                  <span>{isRu ? 'Скачать .JSON' : 'Download .JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyIncognitoData}
                  className="py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow border-b-2 border-sky-800 active:translate-y-0.5 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>{exportCopied ? '✅' : '📋'}</span>
                  <span>{exportCopied ? (isRu ? 'Скопировано!' : 'Copied!') : (isRu ? 'В буфер обмена' : 'To Clipboard')}</span>
                </button>
              </div>

              {onOpenIncognitoExport && (
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    onOpenIncognitoExport();
                  }}
                  className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold rounded-xl border border-gray-700 transition-colors text-[11px] uppercase tracking-wider flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <span>🔍</span>
                  <span>{isRu ? 'Подробный просмотр и управление экспортом' : 'Detailed Export Viewer'}</span>
                </button>
              )}

              {onOpenFirebaseExport && (
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    onOpenFirebaseExport();
                  }}
                  className="w-full py-2 bg-gradient-to-r from-amber-600/30 to-orange-600/30 hover:from-amber-600/50 hover:to-orange-600/50 text-amber-300 font-bold rounded-xl border border-amber-500/40 transition-colors text-[11px] uppercase tracking-wider flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <span>🔥</span>
                  <span>{isRu ? 'Экспорт данных Firebase Firestore & Auth' : 'Export Firebase Firestore & Auth'}</span>
                </button>
              )}
            </div>

            {/* INCOGNITO RULES & LIMITS LIST */}
            <div className="bg-gray-950/60 border border-gray-800 p-3.5 rounded-2xl space-y-2 text-left">
              <h5 className="font-bold text-xs text-gray-300 uppercase tracking-wide">
                {t('incognitoTitle')}
              </h5>
              <ul className="text-xs text-gray-400 font-medium space-y-1 pl-2 list-disc list-inside">
                <li>{t('noSignupPasswordsRule')}</li>
                <li>{t('allProgressLocalRule')}</li>
                <li className="text-amber-300/90 font-bold">
                  {isRu 
                    ? '🔒 Подписки Super/Max и глобальная лига требуют Полный Вход' 
                    : '🔒 Super/Max subscriptions & leagues require Full Sign-In'}
                </li>
              </ul>
            </div>

            {/* MAIN ACTION: CONTINUE OR SWITCH TO FULL LOGIN */}
            {incognitoClosed ? (
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 bg-gray-900 border-2 border-rose-500/50 text-rose-300 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 cursor-not-allowed opacity-80"
                >
                  <span>🛑</span>
                  <span>{isRu ? 'Вход в Инкогнито недоступен' : 'Incognito Entry Unavailable'}</span>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { playSound('click'); setActiveTab('login'); }}
                    className="w-full py-3 bg-duo-blue hover:brightness-110 text-white font-black rounded-2xl border-b-4 border-duo-blueDark active:border-b-0 active:translate-y-1 transition-all uppercase text-xs tracking-wider shadow-lg flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>🔑</span>
                    <span>{isRu ? 'Полный Вход (Email / Никнейм)' : 'Full Sign-In'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { playSound('click'); setActiveTab('register'); }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all uppercase text-xs tracking-wider shadow-lg flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>📝</span>
                    <span>{isRu ? 'Создать аккаунт (Регистрация)' : 'Create Account'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleContinueIncognito}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all uppercase text-xs tracking-wider shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>🕵️</span>
                <span>{t('continueGuestBtn')}</span>
              </button>
            )}

            {onOpenIncognitoRestrictions && (
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  onOpenIncognitoRestrictions();
                }}
                className="w-full py-2.5 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 font-bold rounded-2xl border border-amber-500/40 transition-all text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow cursor-pointer"
              >
                <span>🚫</span>
                <span>{isRu ? 'Что заблокировано в Инкогнито? (8 функций)' : 'What is blocked in Incognito? (8 features)'}</span>
              </button>
            )}
          </div>
        )}

        {/* FOOTER QUICK LINK */}
        <div className="pt-2 text-center border-t border-gray-800 flex items-center justify-between text-xs text-gray-400 font-medium">
          {incognitoClosed ? (
            <button
              type="button"
              onClick={() => { playSound('click'); setActiveTab('login'); }}
              className="text-amber-400 hover:text-amber-300 font-bold transition-colors underline cursor-pointer flex items-center space-x-1"
            >
              <span>🔑</span>
              <span>{isRu ? 'Вход без аккаунта закрыт с 10.10.2026 — Выполнить Полный Вход' : 'Entry without account is closed — Use Full Sign-In'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleContinueIncognito}
              className="hover:text-white transition-colors underline cursor-pointer"
            >
              {t('skipContinueIncognitoBtn')}
            </button>
          )}
          <span className="text-[11px] text-gray-500">DuoWindo 6601 v1.0.2</span>
        </div>

      </div>
    </div>
  );
};
