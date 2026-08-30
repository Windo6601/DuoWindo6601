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
import { UserProgress } from '../types';

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
}

// Local accounts storage key for fallback / offline lookup by @username or email
const REGISTERED_ACCOUNTS_KEY = 'duo_registered_accounts_6601';

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

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const isRu = user.language === 'ru';
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setErrorMessage(null);
      setSuccessMessage(null);
      setShowForgotPassword(false);
      setResetSent(false);

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
  const saveAccountLocally = (acc: { email: string; username: string; name: string; userProgress: UserProgress }) => {
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
  const findLocalAccount = (ident: string) => {
    try {
      const existingStr = localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
      if (!existingStr) return null;
      const accounts = JSON.parse(existingStr);
      const cleanIdent = ident.trim().toLowerCase().replace(/^@/, '');
      return accounts[cleanIdent] || null;
    } catch (e) {
      return null;
    }
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

        // Check if there is a local offline account matching this username/email
        const localAcc = findLocalAccount(cleanIdent);
        if (localAcc && localAcc.userProgress) {
          // Successfully restored local offline account!
          const restored = { ...localAcc.userProgress, authProvider: 'email' as const };
          setUser(restored);
          localStorage.setItem('duowindo_user_progress_v3', JSON.stringify(restored));
          firebaseAuthSucceeded = true;
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
        if (code === 'auth/email-already-in-use') {
          throw new Error(isRu ? 'Этот Email уже зарегистрирован. Пожалуйста, перейдите на вкладку "Вход".' : 'This email is already registered. Please switch to the "Login" tab.');
        } else if (code === 'auth/weak-password') {
          throw new Error(isRu ? 'Пароль слишком простой (минимум 6 символов)' : 'Password is too weak (minimum 6 characters)');
        } else if (code === 'auth/invalid-email') {
          throw new Error(isRu ? 'Некорректный Email' : 'Invalid email address');
        } else {
          // If auth provider disabled or network/offline, we still proceed with local profile and warn
          console.warn('Proceeding with full local account registration fallback:', authErr.message);
        }
      }

      // 2. Prepare updated user progress
      const newUserProgress: UserProgress = {
        ...user,
        name: cleanDisplayName,
        username: cleanUsername,
        email: cleanEmail,
        authProvider: 'email',
        avatarColor: avatarColor,
        avatarIcon: avatarIcon,
      };

      setUser(newUserProgress);
      localStorage.setItem('duowindo_user_progress_v3', JSON.stringify(newUserProgress));
      localStorage.setItem('duo_reg_prompt_seen_6601', 'true');

      // 3. Save account in local accounts map for fast multi-device / multi-account offline switching
      saveAccountLocally({
        email: cleanEmail,
        username: cleanUsername,
        name: cleanDisplayName,
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
        updatedUser = {
          ...user,
          ...cloudData,
          email: googleEmail || cloudData.email,
          authProvider: 'google',
        };
      } else {
        updatedUser = {
          ...user,
          name: googleName,
          email: googleEmail,
          username: user.username && !user.username.startsWith('incognito_') ? user.username : fallbackUsername,
          authProvider: 'google',
        };
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
      console.error('Google Sign-in error:', err);
      const errMsg = err?.code || err?.message || String(err);
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
  // HANDLER: CONTINUE AS INCOGNITO
  // ==========================================
  const handleContinueIncognito = () => {
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
              {activeTab === 'incognito' && '🕵️'}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                {activeTab === 'login' && (isRu ? 'Вход в аккаунт DuoWindo' : 'Sign in to DuoWindo')}
                {activeTab === 'register' && (isRu ? 'Регистрация аккаунта' : 'Create DuoWindo Account')}
                {activeTab === 'google' && (isRu ? 'Вход через Google' : 'Google Sign-In')}
                {activeTab === 'incognito' && (isRu ? 'Режим Инкогнито' : 'Incognito Guest Mode')}
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                {activeTab === 'login' && (isRu ? 'Войдите по Email или имени пользователя и паролю' : 'Sign in with Email or Username and password')}
                {activeTab === 'register' && (isRu ? 'Создайте профиль с Email, никнеймом и паролем' : 'Register with Email, Username, and password')}
                {activeTab === 'google' && (isRu ? 'Мгновенный вход и облачная синхронизация' : 'Instant cloud progress synchronization')}
                {activeTab === 'incognito' && (isRu ? 'Играйте анонимно без регистрации и паролей' : 'Play anonymously without account')}
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
            <span className="truncate">{isRu ? 'Вход' : 'Login'}</span>
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
            className={`py-2.5 px-2 rounded-xl font-black text-xs transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'incognito'
                ? 'bg-amber-600 text-white shadow-lg border-b-2 border-amber-800'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <span>🕵️</span>
            <span className="truncate">{isRu ? 'Инкогнито' : 'Guest'}</span>
          </button>
        </div>

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
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 4: INCOGNITO / GUEST */}
        {/* ========================================== */}
        {activeTab === 'incognito' && (
          <div className="space-y-4 animate-in fade-in py-1">
            <div className="bg-emerald-950/40 border-2 border-emerald-500/50 p-4 sm:p-5 rounded-2xl space-y-3 text-left">
              <div className="flex items-center space-x-3">
                <span className="text-3xl shrink-0">🕵️</span>
                <div>
                  <h4 className="font-black text-base text-emerald-300 uppercase">
                    {t('incognitoTitle')}
                  </h4>
                  <p className="text-xs text-emerald-200/80 font-bold">
                    {t('fullIncognitoTitle')}
                  </p>
                </div>
              </div>
              <ul className="text-xs text-gray-300 font-bold space-y-1.5 pl-2 list-disc list-inside">
                <li>{t('noSignupPasswordsRule')}</li>
                <li>{t('allProgressLocalRule')}</li>
                <li>{t('canRegisterAnytimeRule')}</li>
                <li className="text-amber-300 font-extrabold">
                  {isRu 
                    ? '🔒 Ограничение: Подписки Super и Max требуют создания аккаунта' 
                    : '🔒 Restriction: Super & Max subscriptions require an account'}
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleContinueIncognito}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all uppercase text-xs tracking-wider shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>🕵️</span>
              <span>{t('continueGuestBtn')}</span>
            </button>

            {onOpenIncognitoRestrictions && (
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  onOpenIncognitoRestrictions();
                }}
                className="w-full py-3 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 font-bold rounded-2xl border border-amber-500/50 transition-all text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md cursor-pointer"
              >
                <span>🚫</span>
                <span>{isRu ? 'Что заблокировано в Инкогнито? (8 функций)' : 'What is blocked in Incognito? (8 features)'}</span>
              </button>
            )}
          </div>
        )}

        {/* FOOTER QUICK LINK */}
        <div className="pt-2 text-center border-t border-gray-800 flex items-center justify-between text-xs text-gray-400 font-medium">
          <button
            type="button"
            onClick={handleContinueIncognito}
            className="hover:text-white transition-colors underline cursor-pointer"
          >
            {t('skipContinueIncognitoBtn')}
          </button>
          <span className="text-[11px] text-gray-500">DuoWindo 6601 v1.0.2</span>
        </div>

      </div>
    </div>
  );
};
