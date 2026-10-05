import React, { useState } from 'react';
import { UserProgress } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { isUserAdminAccount } from './DataDeletionModal';

interface DataTransferExpertModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  firebaseUser: any | null;
  language: string;
  playSound: (name: string) => void;
  setToast: (msg: string | null) => void;
}

export interface MigrationBundle {
  version: '2.0-expert';
  app: 'DuoWindo6601';
  exportedAt: string;
  sourceAccount: {
    username: string;
    email?: string;
    authProvider?: string;
  };
  stats: {
    xp: number;
    streak: number;
    gems: number;
    completedLessonsCount: number;
    learnedWordsCount: number;
  };
  userData: Partial<UserProgress>;
}

export const DataTransferExpertModal: React.FC<DataTransferExpertModalProps> = ({
  isOpen,
  onClose,
  user,
  setUser,
  firebaseUser,
  language,
  playSound,
  setToast,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'cloud'>('export');
  const [importJson, setImportJson] = useState('');
  const [parsedBundle, setParsedBundle] = useState<MigrationBundle | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isRu = language === 'ru';
  const isAdmin = isUserAdminAccount(user, firebaseUser);

  // Generate complete migration bundle
  const generateBundle = (): MigrationBundle => {
    return {
      version: '2.0-expert',
      app: 'DuoWindo6601',
      exportedAt: new Date().toISOString(),
      sourceAccount: {
        username: user.username || 'user',
        email: user.email,
        authProvider: user.authProvider,
      },
      stats: {
        xp: user.xp || 0,
        streak: user.streak || 0,
        gems: user.gems || 0,
        completedLessonsCount: user.completedLessons?.length || 0,
        learnedWordsCount: user.learnedWords?.length || 0,
      },
      userData: {
        name: user.name,
        username: user.username,
        avatarColor: user.avatarColor,
        avatarImage: user.avatarImage,
        avatarUrl: user.avatarUrl,
        avatarIcon: user.avatarIcon,
        xp: user.xp,
        gems: user.gems,
        streak: user.streak,
        maxStreak: user.maxStreak,
        hearts: user.hearts,
        energy: user.energy,
        subscription: user.subscription,
        completedLessons: user.completedLessons,
        learnedWords: user.learnedWords,
        mistakes: user.mistakes,
        achievements: user.achievements,
        language: user.language,
        country: user.country,
        placementTests: user.placementTests,
        chessStats: user.chessStats,
        theme: user.theme,
        preventAccountDeletion: user.preventAccountDeletion,
      },
    };
  };

  const currentBundle = generateBundle();
  const bundleString = JSON.stringify(currentBundle, null, 2);

  const handleCopyBundle = async () => {
    playSound('click');
    try {
      await navigator.clipboard.writeText(bundleString);
      setCopied(true);
      setToast(isRu ? '📋 Пакет миграции скопирован в буфер!' : '📋 Migration bundle copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setToast(isRu ? '❌ Ошибка копирования' : '❌ Copy failed');
    }
  };

  const handleDownloadBundle = () => {
    playSound('correct');
    try {
      const blob = new Blob([bundleString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = `duowindo6601_migration_${user.username || 'user'}_${new Date().toISOString().slice(0, 10)}.json`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast(isRu ? `💾 Файл сохранён: ${filename}` : `💾 File saved: ${filename}`);
    } catch {
      setToast(isRu ? '❌ Ошибка скачивания' : '❌ Download failed');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJson(content);
      handleValidateJson(content);
    };
    reader.readAsText(file);
  };

  const handleValidateJson = (rawContent?: string) => {
    const textToTest = rawContent || importJson;
    setParseError(null);
    try {
      if (!textToTest.trim()) {
        setParseError(isRu ? 'Вставьте JSON-код пакета данных' : 'Paste data bundle JSON');
        setParsedBundle(null);
        return;
      }
      const parsed = JSON.parse(textToTest);
      if (!parsed || (parsed.app !== 'DuoWindo6601' && !parsed.userData && !parsed.xp)) {
        throw new Error(isRu ? 'Неверный формат пакета DuoWindo6601' : 'Invalid DuoWindo6601 bundle format');
      }

      // Handle raw userProgress object or migration bundle
      let bundle: MigrationBundle;
      if (parsed.version && parsed.userData) {
        bundle = parsed as MigrationBundle;
      } else {
        bundle = {
          version: '2.0-expert',
          app: 'DuoWindo6601',
          exportedAt: new Date().toISOString(),
          sourceAccount: {
            username: parsed.username || 'imported_user',
            email: parsed.email,
          },
          stats: {
            xp: parsed.xp || 0,
            streak: parsed.streak || 0,
            gems: parsed.gems || 0,
            completedLessonsCount: parsed.completedLessons?.length || 0,
            learnedWordsCount: parsed.learnedWords?.length || 0,
          },
          userData: parsed,
        };
      }

      setParsedBundle(bundle);
      playSound('click');
      setToast(isRu ? '✅ Пакет успешно проверен и готов к переносу' : '✅ Bundle verified and ready for migration');
    } catch (err: any) {
      setParseError(err.message || (isRu ? 'Ошибка парсинга JSON' : 'JSON parse error'));
      setParsedBundle(null);
    }
  };

  const handleApplyMigration = async (mode: 'merge' | 'overwrite') => {
    if (!parsedBundle || !parsedBundle.userData) return;
    setIsProcessing(true);
    playSound('correct');

    try {
      const incoming = parsedBundle.userData;
      let updatedUser: UserProgress;

      if (mode === 'merge') {
        const mergedLessons = Array.from(new Set([...(user.completedLessons || []), ...(incoming.completedLessons || [])]));
        const mergedWords = Array.from(new Set([...(user.learnedWords || []), ...(incoming.learnedWords || [])]));

        updatedUser = {
          ...user,
          xp: Math.max(user.xp || 0, incoming.xp || 0),
          gems: Math.max(user.gems || 0, incoming.gems || 0),
          streak: Math.max(user.streak || 0, incoming.streak || 0),
          maxStreak: Math.max(user.maxStreak || 0, incoming.maxStreak || incoming.streak || 0),
          completedLessons: mergedLessons,
          learnedWords: mergedWords,
          // preserve admin privileges if current user is admin
          isAdmin: user.isAdmin || isAdmin,
          role: user.role || (isAdmin ? 'admin' : incoming.role),
        };
      } else {
        // overwrite
        updatedUser = {
          ...user,
          ...incoming,
          // protect admin role from being wiped by an incoming non-admin bundle
          isAdmin: user.isAdmin || isAdmin,
          role: isAdmin ? 'admin' : (incoming.role || user.role),
        } as UserProgress;
      }

      setUser(updatedUser);
      localStorage.setItem('duowindo_user_progress', JSON.stringify(updatedUser));

      if (firebaseUser) {
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), updatedUser, { merge: true });
        } catch (err) {
          console.error('Firestore migration sync error:', err);
        }
      }

      setToast(
        isRu 
          ? `🎉 Перенос данных завершён (${mode === 'merge' ? 'Слияние' : 'Замена'})!` 
          : `🎉 Data migration completed (${mode === 'merge' ? 'Merged' : 'Overwritten'})!`
      );
      onClose();
    } catch (err) {
      playSound('wrong');
      setToast(isRu ? '❌ Ошибка при переносе данных' : '❌ Migration failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[285] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="fixed inset-0" onClick={() => { playSound('click'); onClose(); }} />

      <div className="relative z-10 bg-gray-950 border-2 border-indigo-500/70 rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-[0_0_55px_rgba(99,102,241,0.25)] text-white space-y-4 max-h-[92vh] overflow-y-auto text-left">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-sky-500 border-2 border-white/40 flex items-center justify-center text-2xl shadow-lg shrink-0">
              🛠️
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
                <span>{isRu ? 'Эксперт: Перенос данных' : 'Data Transfer Expert'}</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                  Migration Tool
                </span>
              </h3>
              <p className="text-xs text-indigo-400 font-bold">
                {isRu ? 'Перенос прогресса, уроков и настроек между устройствами и аккаунтами' : 'Transfer progress, lessons and settings between devices and accounts'}
              </p>
            </div>
          </div>
          <button
            onClick={() => { playSound('click'); onClose(); }}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 transition-colors shrink-0 cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-800 text-xs font-black">
          <button
            onClick={() => { playSound('click'); setActiveTab('export'); }}
            className={`pb-2.5 px-3 uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === 'export'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            📤 {isRu ? 'Экспорт пакета' : 'Export Bundle'}
          </button>
          <button
            onClick={() => { playSound('click'); setActiveTab('import'); }}
            className={`pb-2.5 px-3 uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === 'import'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            📥 {isRu ? 'Импорт и перенос' : 'Import & Transfer'}
          </button>
          <button
            onClick={() => { playSound('click'); setActiveTab('cloud'); }}
            className={`pb-2.5 px-3 uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === 'cloud'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            ☁️ {isRu ? 'Облачный перенос' : 'Cloud Sync'}
          </button>
        </div>

        {/* TAB 1: EXPORT BUNDLE */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="p-3 bg-indigo-950/40 border border-indigo-500/40 rounded-2xl text-xs space-y-1">
              <p className="font-bold text-indigo-200">
                {isRu ? 'Пакет миграции включает все достижения:' : 'The migration bundle includes all achievements:'}
              </p>
              <p className="text-[11px] text-gray-300">
                {isRu
                  ? 'Опыт XP, алмазы, серия дней, пройденные модули и уроки, словарь слов, история ошибок, результаты тестов и настройки интерфейса.'
                  : 'XP, gems, streak, completed modules and lessons, vocabulary, mistake history, test results, and UI settings.'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-din">
              <div className="bg-black/50 p-2.5 rounded-xl border border-gray-800">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">{isRu ? 'Опыт' : 'XP'}</span>
                <span className="text-white font-black block">{user.xp || 0} XP</span>
              </div>
              <div className="bg-black/50 p-2.5 rounded-xl border border-gray-800">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">{isRu ? 'Стрик' : 'Streak'}</span>
                <span className="text-amber-400 font-black block">{user.streak || 0} дн.</span>
              </div>
              <div className="bg-black/50 p-2.5 rounded-xl border border-gray-800">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">{isRu ? 'Уроков' : 'Lessons'}</span>
                <span className="text-duo-blue font-black block">{user.completedLessons?.length || 0}</span>
              </div>
              <div className="bg-black/50 p-2.5 rounded-xl border border-gray-800">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">{isRu ? 'Слов' : 'Words'}</span>
                <span className="text-emerald-400 font-black block">{user.learnedWords?.length || 0}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadBundle}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl border-b-4 border-indigo-900 active:translate-y-0.5 transition-all flex items-center justify-center space-x-2 shadow cursor-pointer"
              >
                <span>💾</span>
                <span>{isRu ? 'Скачать пакет миграции .JSON' : 'Download Bundle .JSON'}</span>
              </button>
              <button
                type="button"
                onClick={handleCopyBundle}
                className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-indigo-300 font-black text-xs uppercase tracking-wider rounded-xl border-b-4 border-gray-950 active:translate-y-0.5 transition-all flex items-center justify-center space-x-2 shadow cursor-pointer"
              >
                <span>{copied ? '✅' : '📋'}</span>
                <span>{copied ? (isRu ? 'Скопировано!' : 'Copied!') : (isRu ? 'Копировать в буфер' : 'Copy Bundle')}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: IMPORT & MIGRATE */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            <div className="p-3 bg-black/40 border border-gray-800 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-gray-300 uppercase text-[11px] tracking-wider block">
                  {isRu ? 'Вставьте JSON-код или загрузите файл:' : 'Paste JSON bundle or upload file:'}
                </label>
                <label className="cursor-pointer text-[11px] text-indigo-300 hover:underline font-bold flex items-center gap-1">
                  <span>📂</span>
                  <span>{isRu ? 'Выбрать файл' : 'Browse file'}</span>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <textarea
                value={importJson}
                onChange={(e) => {
                  setImportJson(e.target.value);
                  setParsedBundle(null);
                  setParseError(null);
                }}
                placeholder={isRu ? 'Вставьте сюда содержимое экспортированного пакета...' : 'Paste exported migration JSON bundle here...'}
                className="w-full h-28 bg-gray-900/90 border border-gray-700 focus:border-indigo-400 rounded-xl p-3 font-mono text-xs text-gray-200 outline-none resize-none transition-all"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleValidateJson()}
                  className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs uppercase tracking-wide cursor-pointer"
                >
                  🔍 {isRu ? 'Проверить пакет' : 'Validate Bundle'}
                </button>
              </div>
            </div>

            {parseError && (
              <div className="p-3 bg-red-950/60 border border-red-500/60 rounded-xl text-xs text-red-300 font-bold flex items-center gap-2">
                <span>⚠️</span>
                <span>{parseError}</span>
              </div>
            )}

            {/* PREVIEW OF VALIDATED BUNDLE */}
            {parsedBundle && (
              <div className="p-4 bg-indigo-950/40 border-2 border-indigo-500/60 rounded-2xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">✨</span>
                    <div>
                      <h4 className="font-black text-xs text-white uppercase tracking-wider">
                        {isRu ? 'Пакет проверен: готов к переносу' : 'Bundle Validated: Ready to Transfer'}
                      </h4>
                      <p className="text-[10px] text-gray-400">
                        {isRu ? `Источник: @${parsedBundle.sourceAccount.username}` : `Source: @${parsedBundle.sourceAccount.username}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold">
                    VALID
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-black/50 p-2 rounded-xl border border-gray-800">
                    <span className="text-gray-400 block text-[9px] uppercase font-bold">{isRu ? 'XP (Импорт)' : 'Incoming XP'}</span>
                    <span className="text-emerald-400 font-black">{parsedBundle.stats.xp} XP</span>
                  </div>
                  <div className="bg-black/50 p-2 rounded-xl border border-gray-800">
                    <span className="text-gray-400 block text-[9px] uppercase font-bold">{isRu ? 'Стрик' : 'Incoming Streak'}</span>
                    <span className="text-amber-400 font-black">{parsedBundle.stats.streak} дн.</span>
                  </div>
                  <div className="bg-black/50 p-2 rounded-xl border border-gray-800">
                    <span className="text-gray-400 block text-[9px] uppercase font-bold">{isRu ? 'Уроков' : 'Lessons'}</span>
                    <span className="text-duo-blue font-black">{parsedBundle.stats.completedLessonsCount}</span>
                  </div>
                  <div className="bg-black/50 p-2 rounded-xl border border-gray-800">
                    <span className="text-gray-400 block text-[9px] uppercase font-bold">{isRu ? 'Слов' : 'Words'}</span>
                    <span className="text-white font-black">{parsedBundle.stats.learnedWordsCount}</span>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleApplyMigration('merge')}
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl border-b-4 border-emerald-900 active:translate-y-0.5 transition-all flex items-center justify-center space-x-1.5 shadow cursor-pointer disabled:opacity-60"
                  >
                    <span>✨</span>
                    <span>{isRu ? 'Объединить данные (Merge)' : 'Merge Data'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleApplyMigration('overwrite')}
                    className="py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-xl border-b-4 border-amber-900 active:translate-y-0.5 transition-all flex items-center justify-center space-x-1.5 shadow cursor-pointer disabled:opacity-60"
                  >
                    <span>🔄</span>
                    <span>{isRu ? 'Полная замена (Overwrite)' : 'Overwrite Data'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CLOUD SYNC TRANSFER */}
        {activeTab === 'cloud' && (
          <div className="space-y-4">
            <div className="p-4 bg-black/40 border border-gray-800 rounded-2xl space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">☁️</span>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-white uppercase tracking-wider">
                    {isRu ? 'Прямой перенос в Firebase Firestore' : 'Direct Firebase Firestore Transfer'}
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    {firebaseUser 
                      ? (isRu ? `Подключен аккаунт: ${firebaseUser.email || firebaseUser.uid}` : `Connected account: ${firebaseUser.email || firebaseUser.uid}`)
                      : (isRu ? 'Для прямого облачного переноса выполните вход в аккаунт' : 'Sign in to an account for direct cloud transfer')}
                  </p>
                </div>
              </div>

              {firebaseUser ? (
                <div className="space-y-2">
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold">
                    ✅ {isRu ? 'Облачная база Firestore активна. Вы можете мгновенно перезаписать или синхронизировать прогресс.' : 'Cloud Firestore is active. You can instantly sync progress.'}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      playSound('click');
                      try {
                        await setDoc(doc(db, 'users', firebaseUser.uid), user, { merge: true });
                        playSound('correct');
                        setToast(isRu ? '☁️ Локальные данные успешно загружены в Firestore!' : '☁️ Local data successfully uploaded to Firestore!');
                      } catch {
                        playSound('wrong');
                        setToast(isRu ? '❌ Ошибка синхронизации с облаком' : '❌ Cloud sync failed');
                      }
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl border-b-4 border-emerald-900 active:translate-y-0.5 transition-all flex items-center justify-center space-x-2 shadow cursor-pointer"
                  >
                    <span>🔄</span>
                    <span>{isRu ? 'Синхронизировать локальные данные с Firestore' : 'Sync Local Data to Firestore'}</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-300 font-medium">
                  {isRu
                    ? 'Вы находитесь в Режиме Инкогнито или локальном режиме. Воспользуйтесь вкладкой «Экспорт пакета» для скачивания файла миграции или выполните Полный Вход в Профиле.'
                    : 'You are in Incognito or offline mode. Use the "Export Bundle" tab to download your migration file or perform Full Sign-In in Profile.'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
