import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';

interface PWAInstallButtonProps {
  isRu?: boolean;
  className?: string;
  variant?: 'compact' | 'full' | 'banner';
  onSkip?: () => void;
  onOpenReviews?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  isRu = true,
  className = '',
  variant = 'compact',
  onSkip,
  onOpenReviews
}) => {
  const { isInstallable, isInstalled, isIOS, isIframe, isFirefox, install, openInNewTab } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('duo_pwa_banner_dismissed') === 'true';
    }
    return false;
  });

  // If already running in standalone mode or banner was dismissed
  if (isInstalled || (variant === 'banner' && isDismissed)) {
    return null;
  }

  const handleInstallClick = async () => {
    // If inside an iframe, prompt modal explaining iframe restriction with 1-click openInNewTab
    if (isIframe) {
      setShowModal(true);
      return;
    }

    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleSkip = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('duo_pwa_banner_dismissed', 'true');
    }
    if (onSkip) {
      onSkip();
    }
  };

  if (variant === 'banner') {
    return (
      <>
        <div className={`bg-gradient-to-r from-blue-900/85 via-indigo-900/85 to-purple-900/85 p-4 sm:p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 relative animate-in zoom-in duration-300 ${className}`}>
          {/* Top-right quick close button */}
          <button
            type="button"
            onClick={handleSkip}
            title={isRu ? "Пропустить / Скрыть баннер" : "Skip / Dismiss banner"}
            className="absolute top-3 right-3 text-white/50 hover:text-white bg-black/30 hover:bg-black/50 p-1.5 rounded-full transition-colors cursor-pointer z-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center space-x-3.5 pr-6 sm:pr-0">
            <img src="/100042597.svg" alt="DuoWindo6601 PWA" className="w-12 h-12 rounded-2xl shadow-md border border-white/20 shrink-0" />
            <div>
              <h4 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2 flex-wrap">
                <span>{isRu ? 'Установить DuoWindo6601 PWA' : 'Install DuoWindo6601 PWA'}</span>
                <span className="bg-emerald-500 text-[10px] text-white px-2 py-0.5 rounded-full font-black uppercase">{isRu ? 'Онлайн PWA' : 'Online PWA'}</span>
              </h4>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-xs text-blue-200 font-bold">
                  {isRu 
                    ? 'ПК и мобильный браузер: быстрый запуск без адресной строки (без VPN и с VPN)' 
                    : 'Desktop & Mobile: standalone window, fast launch (works with & without VPN)'}
                </p>
                {onOpenReviews && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenReviews();
                    }}
                    className="inline-flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 underline font-black cursor-pointer"
                    title={isRu ? "Открыть отзывы о приложении DuoWindo6601 PWA" : "Open DuoWindo6601 PWA reviews"}
                  >
                    <span>⭐ {isRu ? 'Отзывы о PWA' : 'PWA Reviews'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 sm:flex-initial bg-duo-green hover:brightness-110 active:translate-y-1 text-white font-black text-xs px-5 py-3 rounded-2xl border-b-4 border-duo-greenDark uppercase tracking-wider shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>{isRu ? 'Установить' : 'Install'}</span>
            </button>

            {/* ПРОПУСТИТЬ УСТАНОВКУ */}
            <button
              type="button"
              onClick={handleSkip}
              className="bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white font-black text-xs px-4 py-3 rounded-2xl border border-white/20 uppercase tracking-wider transition-all flex items-center justify-center space-x-1 cursor-pointer"
              title={isRu ? "Пропустить установку PWA" : "Skip PWA installation"}
            >
              <span>{isRu ? 'Пропустить' : 'Skip'}</span>
            </button>
          </div>
        </div>

        {showModal && (
          <PWAInstructionModal 
            isRu={isRu} 
            isIOS={isIOS} 
            isIframe={isIframe}
            isFirefox={isFirefox}
            onClose={() => setShowModal(false)} 
            onSkip={handleSkip} 
            onOpenReviews={onOpenReviews}
            onOpenInNewTab={openInNewTab}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title={isRu ? "Установить PWA приложение DuoWindo6601" : "Install DuoWindo6601 PWA App"}
        className={`inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white font-black text-xs px-3.5 py-2 rounded-xl border-b-2 border-blue-800 shadow-md transition-all uppercase tracking-wider cursor-pointer ${className}`}
      >
        <img src="/100042597.svg" alt="PWA" className="w-4 h-4 rounded-sm" />
        <span className="hidden sm:inline">{isRu ? 'Установить PWA' : 'Install PWA'}</span>
        <span className="sm:hidden">{isRu ? 'PWA' : 'PWA'}</span>
        <svg className="w-3.5 h-3.5 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>

      {showModal && (
        <PWAInstructionModal 
          isRu={isRu} 
          isIOS={isIOS} 
          isIframe={isIframe}
          isFirefox={isFirefox}
          onClose={() => setShowModal(false)} 
          onSkip={handleSkip} 
          onOpenReviews={onOpenReviews}
          onOpenInNewTab={openInNewTab}
        />
      )}
    </>
  );
};

export const PWAInstructionModal: React.FC<{
  isRu: boolean;
  isIOS: boolean;
  isIframe?: boolean;
  isFirefox?: boolean;
  onClose: () => void;
  onSkip?: () => void;
  onOpenReviews?: () => void;
  onOpenInNewTab?: () => void;
}> = ({ isRu, isIOS, isIframe = false, isFirefox = false, onClose, onSkip, onOpenReviews, onOpenInNewTab }) => {
  const { isInstallable, install, openInNewTab } = usePWAInstall();
  const [showTroubleshooting, setShowTroubleshooting] = useState(isIframe || isFirefox);

  const handleInstall = async () => {
    if (isInstallable) {
      await install();
    }
    onClose();
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
    onClose();
  };

  const handleOpenTab = () => {
    if (onOpenInNewTab) {
      onOpenInNewTab();
    } else {
      openInNewTab();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-[#18262D] border-4 border-[#2B404C] rounded-3xl max-w-lg w-full p-5 sm:p-6 text-white shadow-2xl relative my-auto">
        <div className="flex items-center space-x-3 sm:space-x-4 mb-4 pb-4">
          <img src="/100042597.svg" alt="PWA Icon" className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl shadow-lg border-2 border-blue-400 shrink-0" />
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              {isRu ? 'Установка DuoWindo6601' : 'Install DuoWindo6601'}
            </h3>
            <p className="text-xs text-blue-300 font-bold uppercase tracking-wider">
              {isRu ? 'PWA-приложение (Онлайн • Без VPN и с VPN)' : 'Progressive Web App (Online • Works with & without VPN)'}
            </p>
          </div>
          <button 
            type="button"
            onClick={handleSkip}
            className="ml-auto text-gray-400 hover:text-white p-2 text-xl font-bold rounded-lg cursor-pointer"
            title={isRu ? "Пропустить / Закрыть" : "Skip / Close"}
          >
            ✕
          </button>
        </div>

        {/* ПРЕДУПРЕЖДЕНИЕ О ФРЕЙМЕ / IFRAME */}
        {isIframe && (
          <div className="mb-4 bg-amber-950/60 border-2 border-amber-500/70 p-3.5 rounded-2xl text-amber-200">
            <div className="flex items-start gap-2.5">
              <span className="text-xl">⚠️</span>
              <div className="text-xs font-bold leading-relaxed">
                <span className="font-black text-amber-100 block mb-1">
                  {isRu 
                    ? 'Почему браузер пишет «Это приложение нельзя установить»?' 
                    : 'Why does the browser say "This app cannot be installed"?'}
                </span>
                <span>
                  {isRu 
                    ? 'Приложение запущено во фрейме предпросмотра (iframe). Браузеры Chrome и Edge из соображений безопасности блокируют установку PWA из фреймов. Чтобы установить DuoWindo6601 на ПК или телефон, откройте его в отдельной вкладке!' 
                    : 'The app is running inside an iframe preview. Browsers block PWA installation inside iframes. Open the app in a standalone browser tab to install it!'}
                </span>
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={handleOpenTab}
                    className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-xs px-4 py-2 rounded-xl transition-all uppercase tracking-wider shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🔗</span>
                    <span>{isRu ? 'Открыть в новой вкладке для установки ↗' : 'Open in New Tab to Install ↗'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FIREFOX ПРЕДУПРЕЖДЕНИЕ */}
        {isFirefox && !isIframe && (
          <div className="mb-4 bg-sky-950/60 border-2 border-sky-500/70 p-3.5 rounded-2xl text-sky-200">
            <div className="flex items-start gap-2.5">
              <span className="text-xl">🦊</span>
              <div className="text-xs font-bold leading-relaxed">
                <span className="font-black text-sky-100 block mb-1">
                  {isRu ? 'Особенность браузера Mozilla Firefox' : 'Mozilla Firefox Note'}
                </span>
                <span>
                  {isRu 
                    ? 'Настольная версия Firefox не поддерживает стандартную установку PWA. Для установки в отдельном окне используйте Google Chrome, Microsoft Edge, Яндекс Браузер, Opera или Brave.' 
                    : 'Desktop Firefox does not support standard PWA installation. Please open this link in Google Chrome, Edge, or Brave to install as a standalone app.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {isIOS ? (
          <div className="space-y-4 text-sm text-gray-200 font-medium">
            <p className="text-xs text-blue-200 bg-blue-900/30 p-3 rounded-2xl border border-blue-500/30 font-bold">
              📱 {isRu ? 'Для установки на iPhone / iPad (Safari):' : 'For iPhone / iPad (Safari):'}
            </p>
            <ol className="list-decimal pl-5 space-y-2.5 text-xs font-bold leading-relaxed text-gray-300">
              <li>
                {isRu ? 'Нажмите кнопку ' : 'Tap '}
                <span className="text-blue-400 font-black">«Поделиться» (Share ⎋)</span>
                {isRu ? ' на нижней панели Safari.' : ' in Safari toolbar.'}
              </li>
              <li>
                {isRu ? 'Прокрутите меню вниз и выберите пункт ' : 'Scroll down and tap '}
                <span className="text-emerald-400 font-black">«На экран «Домой» (Add to Home Screen)</span>.
              </li>
              <li>
                {isRu ? 'Нажмите «Добавить» в верхнем правом углу.' : 'Tap "Add" in the top right corner.'}
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-gray-200 font-medium">
            <p className="text-xs text-emerald-200 bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/30 font-bold">
              💻 {isRu ? 'Для установки на ПК (Chrome, Edge, Yandex Browser, Opera):' : 'For Desktop PC (Chrome, Edge, Opera):'}
            </p>
            <ul className="space-y-2 text-xs font-bold leading-relaxed text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-black">1.</span>
                <span>
                  {isRu 
                    ? 'В адресной строке браузера справа нажмите на значок компьютера со стрелочкой «Установить приложение».' 
                    : 'In the browser URL bar on the right, click the monitor icon "Install App".'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-black">2.</span>
                <span>
                  {isRu 
                    ? 'Или откройте меню браузера (три точки ⋮ в правом верхнем углу) → «Установить DuoWindo6601».' 
                    : 'Or open browser menu (⋮ in top right) → "Install DuoWindo6601".'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-black">3.</span>
                <span>
                  {isRu 
                    ? 'Готово! Приложение появится на рабочем столе и панели задач и работает в автономном окне.' 
                    : 'Done! The app will open in a clean standalone window without browser tabs.'}
                </span>
              </li>
            </ul>
          </div>
        )}

        {/* СПОЙЛЕР ДИАГНОСТИКИ И ПРИЧИН ОШИБКИ */}
        <div className="mt-4 pt-3 border-t border-[#2B404C]">
          <button
            type="button"
            onClick={() => setShowTroubleshooting(!showTroubleshooting)}
            className="text-xs text-blue-300 hover:text-white font-bold flex items-center justify-between w-full p-1 cursor-pointer"
          >
            <span>🔧 {isRu ? 'Почему еще может писать «Нельзя установить»?' : 'Why else can it say "Cannot install"?'}</span>
            <span>{showTroubleshooting ? '▲' : '▼'}</span>
          </button>

          {showTroubleshooting && (
            <div className="mt-2.5 p-3 bg-black/40 rounded-2xl border border-gray-700 space-y-2 text-[11px] text-gray-300 font-medium">
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>{isRu ? 'Приложение уже установлено:' : 'App already installed:'}</strong> {isRu ? 'если DuoWindo6601 уже есть на компьютере или телефоне, повторная установка блокируется браузером.' : 'if already installed on your device, Chrome prevents duplicate installs.'}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>{isRu ? 'Service Worker & Манифест:' : 'Service Worker & Manifest:'}</strong> {isRu ? 'манифест и Service Worker активны (работает онлайн).' : 'manifest and Service Worker are active (online mode).'}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>{isRu ? 'Иконка маскота:' : 'Mascot icon:'}</strong> {isRu ? '100042597.svg, PNG 192x192 и 512x512 загружены.' : '100042597.svg, PNG 192x192 & 512x512 loaded.'}</span>
              </div>
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={handleOpenTab}
                  className="text-xs text-amber-300 hover:text-amber-200 underline font-black cursor-pointer inline-flex items-center gap-1"
                >
                  <span>↗</span>
                  <span>{isRu ? 'Открыть сайт напрямую в новой вкладке' : 'Open directly in a new browser tab'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* КНОПКИ ДЕЙСТВИЯ: УСТАНОВИТЬ, ОТКРЫТЬ ВО ВКЛАДКЕ, ПРОПУСТИТЬ */}
        <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
          {isInstallable && !isIframe && (
            <button
              type="button"
              onClick={handleInstall}
              className="flex-1 bg-duo-green hover:brightness-110 active:translate-y-1 text-white font-black py-3 rounded-2xl border-b-4 border-duo-greenDark uppercase tracking-wider transition-all text-xs cursor-pointer text-center flex items-center justify-center space-x-2 shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>{isRu ? 'Установить' : 'Install'}</span>
            </button>
          )}

          {isIframe && (
            <button
              type="button"
              onClick={handleOpenTab}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 active:translate-y-1 text-white font-black py-3 rounded-2xl border-b-4 border-blue-800 uppercase tracking-wider transition-all text-xs cursor-pointer text-center flex items-center justify-center space-x-2 shadow-lg"
            >
              <span>🔗 {isRu ? 'Открыть во вкладке ↗' : 'Open in New Tab ↗'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSkip}
            className="flex-1 bg-[#37464F] hover:bg-[#43545e] active:translate-y-1 text-white font-black py-3 rounded-2xl border-b-4 border-[#202b31] uppercase tracking-wider transition-all text-xs cursor-pointer text-center"
          >
            {isRu ? 'Пропустить' : 'Skip'}
          </button>
        </div>

        {/* КНОПКА ОТЗЫВА О PWA */}
        {onOpenReviews && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenReviews();
            }}
            className="w-full mt-3 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-black py-2.5 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
          >
            <span>⭐</span>
            <span>{isRu ? 'Смотреть и оставить отзыв о PWA' : 'View & Write PWA Review'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
