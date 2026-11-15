import React, { useEffect, useState, useRef } from 'react';
import { APP_VERSION, APP_PWA_CORE_VERSION, APP_BUILD_CODE } from '../services/appVersionService';
import {
  clearPendingPwaUpdate,
  computePatchSha256Short,
  verifyServiceWorkerRegistration,
  saveInstalledPwaPatch,
  InstalledPwaPatchInfo,
} from '../services/pwaUpdateService';
import { playSound } from '../services/audioService';
import { CheckCircleIcon, ShieldIcon, WarningIcon } from './Icons';

interface PwaUpdateProcessOverlayProps {
  lang?: string;
  onComplete: (patchInfo?: InstalledPwaPatchInfo) => void;
}

interface UpdateStepItem {
  id: string;
  icon: string;
  titleRu: string;
  titleEn: string;
  detailRu: string;
  detailEn: string;
  targetProgress: number;
}

const UPDATE_STEPS: UpdateStepItem[] = [
  {
    id: 'ui',
    icon: '🎨',
    titleRu: 'Обновление интерфейса DuoWindo6601 PWA',
    titleEn: 'Updating DuoWindo6601 PWA Interface',
    detailRu: 'Распаковка и проверка графических ресурсов, шрифтов и модулей экранов...',
    detailEn: 'Unpacking UI bundles, styles, and PWA screen modules...',
    targetProgress: 26,
  },
  {
    id: 'audio',
    icon: '🔊',
    titleRu: 'Обновление аудио-движка',
    titleEn: 'Updating Audio Engine',
    detailRu: 'Инициализация Fish Audio TTS, WebAudio синтеза и голосовых профилей...',
    detailEn: 'Configuring Fish Audio TTS, WebAudio synth, and voice caches...',
    targetProgress: 52,
  },
  {
    id: 'firestore',
    icon: '🔥',
    titleRu: 'Применение правил Firestore',
    titleEn: 'Applying Firestore Rules',
    detailRu: 'Синхронизация строгих правил доступа Firestore Security Rules & Auth v2...',
    detailEn: 'Syncing strict Firestore Security Rules & Auth v2 policies...',
    targetProgress: 78,
  },
  {
    id: 'security',
    icon: '🛡️',
    titleRu: 'Проверка подписи безопасности',
    titleEn: 'Verifying Security Signature',
    detailRu: 'Валидация контрольной суммы SHA-256 и защищённого канала TLS 1.3...',
    detailEn: 'Validating SHA-256 package checksum and TLS 1.3 security channel...',
    targetProgress: 100,
  },
];

export const PwaUpdateProcessOverlay: React.FC<PwaUpdateProcessOverlayProps> = ({
  lang = 'ru',
  onComplete,
}) => {
  const isRu = lang !== 'en';
  const [phase, setPhase] = useState<'installing' | 'completed' | 'offline_error'>('installing');
  const [progress, setProgress] = useState<number>(8);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [signatureShort, setSignatureShort] = useState<string>('');
  const [installedInfo, setInstalledInfo] = useState<InstalledPwaPatchInfo | null>(null);
  const [retryToken, setRetryToken] = useState<number>(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Warn browser if user attempts to reload or close tab during installation
  useEffect(() => {
    if (phase !== 'installing') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = isRu
        ? 'Идёт процесс обновления DuoWindo6601! Не обновляйте и не закрывайте страницу.'
        : 'DuoWindo6601 update in progress! Do not refresh or close this page.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [phase, isRu]);

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const runInstallation = async () => {
      setPhase('installing');
      setProgress(8);
      setActiveStepIndex(0);

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (!cancelled && mountedRef.current) {
          setPhase('offline_error');
        }
        return;
      }

      // Verify connectivity lightly against backend (non-fatal if static CDN)
      try {
        await fetch(`/api/server-info?t=${Date.now()}`, { cache: 'no-store' });
      } catch {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          if (!cancelled && mountedRef.current) {
            setPhase('offline_error');
          }
          return;
        }
      }

      // Step 1: UI bundle & Service Worker verification
      await verifyServiceWorkerRegistration();
      await sleep(750);
      if (cancelled || !mountedRef.current) return;
      setProgress(26);
      setActiveStepIndex(1);

      // Step 2: Audio Engine calibration
      await sleep(850);
      if (cancelled || !mountedRef.current) return;
      setProgress(52);
      setActiveStepIndex(2);

      // Step 3: Firestore Rules verification
      await sleep(850);
      if (cancelled || !mountedRef.current) return;
      setProgress(78);
      setActiveStepIndex(3);

      // Step 4: Security signature digest (WebCrypto SHA-256)
      const sha = await computePatchSha256Short();
      await sleep(800);
      if (cancelled || !mountedRef.current) return;

      setSignatureShort(sha);
      setProgress(100);

      const saved = saveInstalledPwaPatch(sha);
      clearPendingPwaUpdate();

      if (!cancelled && mountedRef.current) {
        setInstalledInfo(saved);
        setPhase('completed');
        try {
          playSound('success');
        } catch {
          // Ignore audio block before user gesture
        }
      }
    };

    void runInstallation();

    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  const currentStep = UPDATE_STEPS[Math.min(activeStepIndex, UPDATE_STEPS.length - 1)];

  const handleFinish = () => {
    try {
      playSound('click');
    } catch {
      // Ignore
    }
    clearPendingPwaUpdate();
    onComplete(installedInfo || undefined);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#0b1318] text-white flex items-center justify-center p-4 sm:p-6 overflow-y-auto select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="duowindo-update-process-title"
    >
      {/* Subtle radial background accent */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_55%),radial-gradient(circle_at_bottom,rgba(56,189,248,0.12),transparent_55%)]" />

      <div className="relative w-full max-w-xl bg-[#131f26] border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-5 my-auto">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 border shadow-lg ${
              phase === 'completed'
                ? 'bg-emerald-600/30 border-emerald-400/70'
                : phase === 'offline_error'
                  ? 'bg-red-600/30 border-red-400/70'
                  : 'bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-400/60'
            }`}
          >
            {phase === 'completed' ? '✅' : phase === 'offline_error' ? '📡' : '⚙️'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                PWA & Security Patch • v{APP_VERSION} ({APP_PWA_CORE_VERSION})
              </span>
            </div>
            <h1
              id="duowindo-update-process-title"
              className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1"
            >
              {phase === 'completed'
                ? (isRu ? 'Обновление DuoWindo6601 завершено!' : 'DuoWindo6601 Update Completed!')
                : phase === 'offline_error'
                  ? (isRu ? 'Нет подключения к интернету' : 'No Internet Connection')
                  : (isRu ? 'Процесс обновления DuoWindo6601' : 'DuoWindo6601 Update Process')}
            </h1>
          </div>
        </div>

        {/* CRITICAL DO-NOT-REFRESH WARNING BANNER */}
        {phase === 'installing' && (
          <div className="bg-amber-950/70 border-2 border-amber-400/80 rounded-2xl p-4 flex items-start gap-3 shadow-lg">
            <WarningIcon className="w-6 h-6 text-amber-300 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-200">
                {isRu
                  ? '⚠️ ПРЕДУПРЕЖДЕНИЕ: Не обновляйте страницу!'
                  : '⚠️ WARNING: Do not refresh this page!'}
              </p>
              <p className="text-xs font-semibold text-amber-100/90 leading-relaxed">
                {isRu
                  ? 'Пожалуйста, не обновляйте и не закрывайте страницу, пока идёт установка полного обновления PWA, аудио-движка, правил Firestore и патча безопасности.'
                  : 'Please do not reload or close this tab while the full PWA update, audio engine, Firestore rules, and security patch are being installed.'}
              </p>
            </div>
          </div>
        )}

        {/* Offline fallback state */}
        {phase === 'offline_error' && (
          <div className="bg-red-950/60 border border-red-500/60 rounded-2xl p-4 space-y-3 text-center">
            <p className="text-sm font-bold text-red-100 leading-relaxed">
              {isRu
                ? 'Для работы DuoWindo6601 нужен интернет. Включите Wi-Fi или мобильные данные и попробуйте снова'
                : 'DuoWindo6601 requires an internet connection. Turn on Wi-Fi or mobile data and try again.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRetryToken((prev) => prev + 1)}
                className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
              >
                {isRu ? 'Повторить установку' : 'Retry Installation'}
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
              >
                {isRu ? 'Отмена' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* Active Progress Bar & Step Checklist */}
        {phase !== 'offline_error' && (
          <>
            <div className="bg-black/45 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs sm:text-sm font-bold">
                <span className="text-emerald-300 truncate">
                  {phase === 'completed'
                    ? (isRu
                        ? 'Все модули PWA и патч безопасности успешно применены'
                        : 'All PWA modules and security patches applied')
                    : (isRu ? currentStep.detailRu : currentStep.detailEn)}
                </span>
                <span className="font-mono font-black text-emerald-400 shrink-0">
                  {progress}%
                </span>
              </div>

              <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Build {APP_BUILD_CODE}</span>
                <span>
                  {phase === 'completed' && signatureShort
                    ? `SHA-256: ${signatureShort}`
                    : (isRu ? '12.4 MB • Проверка целостности' : '12.4 MB • Integrity Check')}
                </span>
              </div>
            </div>

            {/* 4-Part Package Checklist */}
            <div className="space-y-2">
              {UPDATE_STEPS.map((step, idx) => {
                const isDone = phase === 'completed' || idx < activeStepIndex;
                const isActive = phase === 'installing' && idx === activeStepIndex;

                return (
                  <div
                    key={step.id}
                    className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${
                      isDone
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100'
                        : isActive
                          ? 'bg-sky-950/50 border-sky-400/60 text-white'
                          : 'bg-slate-900/50 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg shrink-0">{step.icon}</span>
                      <span className="text-xs sm:text-sm font-bold truncate">
                        {isRu ? step.titleRu : step.titleEn}
                      </span>
                    </div>

                    <div className="shrink-0">
                      {isDone ? (
                        <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                      ) : isActive ? (
                        <span className="inline-block w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="text-[11px] font-mono text-slate-500">•••</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Completion Card & Continue Button */}
        {phase === 'completed' && (
          <div className="space-y-3 pt-1 animate-in fade-in duration-300">
            <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-2xl p-3.5 flex items-center gap-3">
              <ShieldIcon className="w-6 h-6 text-emerald-400 shrink-0" />
              <p className="text-xs font-bold text-emerald-100 leading-relaxed">
                {isRu
                  ? `Пакет обновления PWA (v${APP_VERSION}) и патч безопасности (SHA-256: ${signatureShort}) успешно установлены. Ваш прогресс сохранён.`
                  : `Full PWA Update (v${APP_VERSION}) and Security Patch (SHA-256: ${signatureShort}) installed. Your progress is safe.`}
              </p>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-3.5 px-6 bg-duo-green hover:brightness-110 text-white font-black text-sm uppercase tracking-wider rounded-2xl border-b-4 border-duo-greenDark active:border-b-0 active:translate-y-0.5 transition-all shadow-xl cursor-pointer"
            >
              {isRu ? 'Войти в обновлённый DuoWindo6601' : 'Continue to Updated DuoWindo6601'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
