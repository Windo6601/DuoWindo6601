import React, { useState, useEffect } from 'react';
import { 
  SparklesIcon, 
  CheckCircleIcon, 
  LockIcon, 
  EyeIcon, 
  TrashIcon, 
  LightningIcon,
  WarningIcon
} from './Icons';
import { 
  getCustomApiKeyDetails, 
  saveCustomApiKey, 
  clearCustomApiKey,
  CustomApiKeyDetails,
  isCustomApiKeySkipped,
  setSkipCustomApiKey,
  canClaimFreeDailyLimit,
  claimFreeDailyLimit
} from '../services/aiLimitManager';
import { pingGeminiApi } from '../services/geminiService';
import { UserProgress } from '../types';

interface GeminiApiKeyManagerProps {
  user: UserProgress;
  setUser?: React.Dispatch<React.SetStateAction<UserProgress>>;
  playSound: (type: 'click' | 'correct' | 'wrong' | 'fanfare' | 'streak') => void;
  onToast?: (msg: string) => void;
  compact?: boolean;
}

export const GeminiApiKeyManager: React.FC<GeminiApiKeyManagerProps> = ({
  user,
  setUser,
  playSound,
  onToast,
  compact = false
}) => {
  const isRu = (user.language || 'ru') === 'ru';
  const [customKeyDetails, setCustomKeyDetails] = useState<CustomApiKeyDetails>({
    key: '',
    type: 'free',
    isCustom: false,
    maskedKey: ''
  });

  const [inputKey, setInputKey] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'free' | 'paid'>('free');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [isSkipped, setIsSkipped] = useState<boolean>(() => isCustomApiKeySkipped());
  const [canClaimFree, setCanClaimFree] = useState<boolean>(() => canClaimFreeDailyLimit());

  // Sync state from localStorage on mount and on storage events
  const loadKeyDetails = () => {
    const details = getCustomApiKeyDetails();
    setCustomKeyDetails(details);
    setIsSkipped(isCustomApiKeySkipped());
    setCanClaimFree(canClaimFreeDailyLimit());
    if (details.isCustom) {
      setInputKey(details.key);
      setSelectedType(details.type);
    }
  };

  useEffect(() => {
    loadKeyDetails();
    const handleKeyChange = () => loadKeyDetails();
    window.addEventListener('duowindo_api_key_changed', handleKeyChange);
    window.addEventListener('duowindo_ai_limit_changed', handleKeyChange);
    window.addEventListener('storage', handleKeyChange);
    return () => {
      window.removeEventListener('duowindo_api_key_changed', handleKeyChange);
      window.removeEventListener('duowindo_ai_limit_changed', handleKeyChange);
      window.removeEventListener('storage', handleKeyChange);
    };
  }, []);

  const handleSkipKey = () => {
    playSound('click');
    const nextSkip = !isSkipped;
    setSkipCustomApiKey(nextSkip);
    setIsSkipped(nextSkip);
    setTestResult(null);

    if (onToast) {
      onToast(nextSkip
        ? (isRu ? '⏭️ Вы пропустили ввод API Key! DuoWindo6601 использует встроенный ключ.' : '⏭️ API Key skipped! DuoWindo6601 uses built-in system key.')
        : (isRu ? '🔑 Режим пропуска выключен. Вы можете ввести свой Gemini API Key.' : '🔑 Skip mode disabled. You can enter your custom key.')
      );
    }
  };

  const handleClaimFreeBonus = () => {
    playSound('fanfare');
    const res = claimFreeDailyLimit(setUser);
    setCanClaimFree(canClaimFreeDailyLimit());
    if (onToast) {
      onToast(res.message);
    }
  };

  const handleTestConnection = async () => {
    playSound('click');
    const keyToTest = inputKey.trim();
    if (!keyToTest && !customKeyDetails.isCustom) {
      setTestResult({
        ok: false,
        message: isRu 
          ? 'Введите Gemini API Key для проверки или оставьте пустым для проверки системного ключа.' 
          : 'Enter a Gemini API Key to test or leave empty to test default system key.'
      });
      playSound('wrong');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await pingGeminiApi(keyToTest || undefined);
      setTestResult(res);
      if (res.ok) {
        playSound('correct');
        if (onToast) {
          onToast(isRu 
            ? `⚡ Соединение с Gemini API успешно! (${res.latencyMs || 0} мс)` 
            : `⚡ Gemini API Connected successfully! (${res.latencyMs || 0} ms)`);
        }
      } else {
        playSound('wrong');
        if (onToast) {
          onToast(isRu ? `⚠️ ${res.message}` : `⚠️ ${res.message}`);
        }
      }
    } catch (e: any) {
      setTestResult({
        ok: false,
        message: isRu ? 'Сбой проверки соединения с Gemini API' : 'Failed to test Gemini API connection'
      });
      playSound('wrong');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveKey = () => {
    const trimmed = inputKey.trim();
    if (!trimmed) {
      playSound('wrong');
      if (onToast) onToast(isRu ? 'Введите корректный API ключ' : 'Please enter a valid API key');
      return;
    }

    if (trimmed.length < 10) {
      playSound('wrong');
      if (onToast) onToast(isRu ? 'Ключ слишком короткий. Проверьте формат.' : 'API Key is too short.');
      return;
    }

    saveCustomApiKey(trimmed, selectedType);
    loadKeyDetails();

    if (setUser) {
      setUser(prev => ({
        ...prev,
        customApiKey: trimmed,
        customApiKeyType: selectedType
      }));
    }

    playSound('fanfare');
    if (onToast) {
      onToast(isRu 
        ? `🔑 ${selectedType === 'paid' ? 'Платный' : 'Бесплатный'} Gemini API Key сохранен и активирован!` 
        : `🔑 ${selectedType === 'paid' ? 'Paid' : 'Free'} Gemini API Key saved and activated!`);
    }
  };

  const handleResetToDefault = () => {
    playSound('click');
    clearCustomApiKey();
    setInputKey('');
    setSelectedType('free');
    setTestResult(null);
    loadKeyDetails();

    if (setUser) {
      setUser(prev => ({
        ...prev,
        customApiKey: undefined,
        customApiKeyType: undefined
      }));
    }

    if (onToast) {
      onToast(isRu 
        ? '🔄 Возвращен стандартный встроенный ключ DuoWindo6601' 
        : '🔄 Reverted to default DuoWindo6601 system key');
    }
  };

  const handlePaste = async () => {
    playSound('click');
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputKey(text.trim());
          if (onToast) onToast(isRu ? 'Ключ вставлен из буфера!' : 'Key pasted from clipboard!');
        }
      }
    } catch (e) {
      console.warn("Clipboard read failed:", e);
    }
  };

  return (
    <div className={`bg-gradient-to-br from-[#1c1a12] via-[#17161e] to-[#111118] border-2 border-yellow-500/40 rounded-3xl ${compact ? 'p-5' : 'p-6 sm:p-8'} shadow-2xl relative overflow-hidden text-white my-6`}>
      
      {/* Background ambient lighting - Yellow & Amber themed */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-yellow-500/20">
        <div>
          <div className="flex items-center space-x-2 mb-1.5 flex-wrap gap-y-1">
            <span className="bg-yellow-400 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
              <span>🔑</span>
              <span>{isRu ? 'Раздел Магазин: Gemini API Key' : 'Store: Gemini API Key Setup'}</span>
            </span>

            {isSkipped ? (
              <span className="bg-yellow-500/20 text-yellow-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-yellow-500/40 flex items-center gap-1">
                <span>⏭️</span>
                <span>{isRu ? 'API Key пропущен (Встроенный ключ)' : 'API Key Skipped (Built-in Key)'}</span>
              </span>
            ) : customKeyDetails.isCustom ? (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                customKeyDetails.type === 'paid'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                <span>🟢</span>
                <span>
                  {isRu 
                    ? (customKeyDetails.type === 'paid' ? 'Собственный Платный Ключ (Безлимит)' : 'Собственный Бесплатный Ключ (1500 RPD)')
                    : (customKeyDetails.type === 'paid' ? 'Custom Paid Key (Unlimited)' : 'Custom Free Key (1500 RPD)')}
                </span>
              </span>
            ) : (
              <span className="bg-yellow-950/40 text-yellow-200 text-[10px] font-black px-2 py-0.5 rounded-full border border-yellow-500/30 flex items-center gap-1">
                <span>⚡</span>
                <span>{isRu ? 'Встроенный ключ DuoWindo6601' : 'Built-in DuoWindo6601 Key'}</span>
              </span>
            )}

            {/* Claim Free Daily Limit Trigger Badge */}
            <button
              type="button"
              onClick={handleClaimFreeBonus}
              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border transition-all flex items-center gap-1 shadow-sm ${
                canClaimFree
                  ? 'bg-yellow-400 text-black border-yellow-300 hover:bg-yellow-300 animate-pulse cursor-pointer'
                  : 'bg-gray-800/90 text-gray-400 border-gray-700 opacity-70 cursor-default'
              }`}
              title={isRu ? 'Получить бесплатный дневной лимит (+50)' : 'Claim free daily limit (+50)'}
            >
              <span>🎁</span>
              <span>{canClaimFree ? (isRu ? 'Получить +50 лимит' : 'Get +50 limit') : (isRu ? 'Лимит +50 активен' : '+50 limit active')}</span>
            </button>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-100 uppercase tracking-tight">
            {isRu ? 'Установка Gemini API Key (Бесплатно & Платно)' : 'Set Gemini API Key (Free & Paid)'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {isRu
              ? 'В Магазине вы можете оставить стандартный ключ тарифа, пропустить ввод или подключить собственный бесплатный / платный ключ Google Gemini API.'
              : 'In the Shop you can keep the default tier key, skip key setup, or connect your own free / paid Google Gemini API Key.'}
          </p>
        </div>

        <button
          onClick={() => {
            playSound('click');
            setShowInstructions(!showInstructions);
          }}
          className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border border-gray-700"
        >
          <span>💡</span>
          <span>{showInstructions ? (isRu ? 'Скрыть помощь' : 'Hide help') : (isRu ? 'Инструкция' : 'Instructions')}</span>
        </button>
      </div>

      {/* Skipped Notice Banner */}
      {isSkipped && (
        <div className="p-4 rounded-2xl mb-5 bg-gradient-to-r from-yellow-950/40 via-amber-950/30 to-blue-950/30 border border-yellow-500/40 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏭️</span>
            <div>
              <div className="font-bold text-yellow-300">
                {isRu ? 'Ввод собственного API Key пропущен' : 'Custom API Key entry skipped'}
              </div>
              <div className="text-gray-300 text-[11px] mt-0.5">
                {isRu 
                  ? 'DuoWindo6601 работает со встроенным системным ключом Gemini. Расход и запросы не заблокированы.' 
                  : 'DuoWindo6601 is running using the built-in system Gemini key. Requests are fully functional.'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSkipKey}
            className="px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs uppercase tracking-wider shrink-0 transition-all shadow"
          >
            {isRu ? 'Ввести свой ключ' : 'Enter custom key'}
          </button>
        </div>
      )}

      {/* Instructions Dropdown */}
      {showInstructions && (
        <div className="bg-[#12121c] border border-purple-500/30 rounded-2xl p-4 sm:p-5 mb-6 text-xs text-gray-300 space-y-3 animate-in fade-in">
          <h4 className="font-black text-white text-sm uppercase tracking-wider flex items-center gap-2">
            <span>🚀</span>
            <span>{isRu ? 'Как получить бесплатный Gemini API Key за 1 минуту:' : 'How to get a free Gemini API Key in 1 minute:'}</span>
          </h4>
          <ol className="list-decimal list-inside space-y-1.5 text-gray-300 font-medium pl-1">
            <li>
              {isRu ? 'Перейдите на официальный портал Google AI Studio: ' : 'Visit official Google AI Studio: '}
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer noopener"
                className="text-cyan-400 underline font-bold hover:text-cyan-300 ml-1"
              >
                aistudio.google.com/app/apikey ↗
              </a>
            </li>
            <li>{isRu ? 'Войдите в аккаунт Google и нажмите синюю кнопку «Create API key».' : 'Sign in to your Google account and click "Create API key".'}</li>
            <li>{isRu ? 'Скопируйте полученный ключ (начинается на AIzaSy...) и вставьте в поле ниже.' : 'Copy the generated key (starts with AIzaSy...) and paste it below.'}</li>
            <li>
              <strong className="text-emerald-400">
                {isRu ? 'Бесплатный ключ (Free tier)' : 'Free tier key'}
              </strong>
              {isRu ? ' дает 1500 запросов в день бесплатно без привязки банковской карты!' : ' gives 1500 requests per day for free with no credit card required!'}
            </li>
          </ol>
        </div>
      )}

      {/* Key Type Selector: Free vs Paid */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
          {isRu ? 'Выберите тип ключа Gemini API Key:' : 'Select Gemini API Key Type:'}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Option 1: Free Key API */}
          <button
            type="button"
            onClick={() => {
              playSound('click');
              setSelectedType('free');
            }}
            className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
              selectedType === 'free'
                ? 'bg-emerald-950/30 border-emerald-400 ring-2 ring-emerald-500/40 shadow-lg'
                : 'bg-[#181822] border-gray-800 hover:border-gray-700 opacity-80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-sm text-emerald-300 flex items-center gap-1.5">
                  <span>🟢</span>
                  <span>{isRu ? 'Бесплатный Key API' : 'Free Key API'}</span>
                </span>
                <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                  Google AI Studio
                </span>
              </div>
              <p className="text-xs text-gray-300 font-medium">
                {isRu ? '1500 запросов в день (15 запросов в минуту). Бесплатно навсегда.' : '1500 requests/day (15 RPM). 100% Free forever.'}
              </p>
            </div>
            <div className="mt-2 text-[11px] text-emerald-400/90 font-bold flex items-center gap-1">
              <CheckCircleIcon className="w-3.5 h-3.5" />
              <span>{isRu ? 'Идеально для неограниченного обучения' : 'Ideal for continuous learning'}</span>
            </div>
          </button>

          {/* Option 2: Paid Key API */}
          <button
            type="button"
            onClick={() => {
              playSound('click');
              setSelectedType('paid');
            }}
            className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
              selectedType === 'paid'
                ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-500/40 shadow-lg'
                : 'bg-[#181822] border-gray-800 hover:border-gray-700 opacity-80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-sm text-cyan-300 flex items-center gap-1.5">
                  <span>💎</span>
                  <span>{isRu ? 'Платный Key API (Pay-as-you-go)' : 'Paid Key API (Pay-as-you-go)'}</span>
                </span>
                <span className="text-[10px] font-black bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/40">
                  Безлимит
                </span>
              </div>
              <p className="text-xs text-gray-300 font-medium">
                {isRu ? 'Неограниченные запросы в день, максимальная скорость и приоритет.' : 'Unlimited requests per day, fastest speed & highest priority.'}
              </p>
            </div>
            <div className="mt-2 text-[11px] text-cyan-400/90 font-bold flex items-center gap-1">
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>{isRu ? 'Доступ к Gemini 3 Pro без ограничений' : 'Full Gemini 3 Pro access'}</span>
            </div>
          </button>

        </div>
      </div>

      {/* Input Field with Eye Toggle & Paste */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
          {isRu ? 'Ключ Gemini API Key:' : 'Gemini API Key Value:'}
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-4 text-gray-500 pointer-events-none">
            <LockIcon className="w-5 h-5" />
          </div>
          <input
            type={showKey ? 'text' : 'password'}
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder={isRu ? "Вставьте ваш ключ: AIzaSy..." : "Paste your key: AIzaSy..."}
            className="w-full pl-11 pr-24 py-3.5 bg-[#101018] border-2 border-gray-700 focus:border-purple-500 rounded-2xl text-sm text-white font-mono placeholder:text-gray-600 transition-all outline-none shadow-inner"
          />
          <div className="absolute right-3 flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => {
                playSound('click');
                setShowKey(!showKey);
              }}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
              title={showKey ? (isRu ? 'Скрыть' : 'Hide') : (isRu ? 'Показать' : 'Show')}
            >
              <EyeIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handlePaste}
              className="px-2.5 py-1 text-[11px] font-bold bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors border border-gray-700"
              title={isRu ? 'Вставить из буфера' : 'Paste from clipboard'}
            >
              {isRu ? 'Вставить' : 'Paste'}
            </button>
          </div>
        </div>
      </div>

      {/* Test Connection Feedback Banner */}
      {testResult && (
        <div className={`p-4 rounded-2xl mb-5 text-xs font-bold border flex items-center justify-between gap-3 animate-in fade-in ${
          testResult.ok 
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
            : 'bg-red-950/40 border-red-500/50 text-red-300'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-base">{testResult.ok ? '✅' : '⚠️'}</span>
            <span>{testResult.message}</span>
          </div>
          {typeof testResult.latencyMs === 'number' && (
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/40 border border-current shrink-0">
              {testResult.latencyMs} ms
            </span>
          )}
        </div>
      )}

      {/* Action Buttons: Test Connection / Save / Reset */}
      <div className="flex flex-wrap items-center gap-3">
        
        {/* Test Connection */}
        <button
          type="button"
          disabled={isTesting}
          onClick={handleTestConnection}
          className="px-5 py-3 rounded-2xl font-black bg-gray-800 hover:bg-gray-700 text-white border-b-4 border-gray-900 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-wider text-xs flex items-center space-x-2 shadow-lg disabled:opacity-50"
        >
          {isTesting ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <LightningIcon className="w-4 h-4 text-amber-400" />
          )}
          <span>
            {isTesting 
              ? (isRu ? 'ПРОВЕРКА СВЯЗИ...' : 'TESTING CONNECTION...') 
              : (isRu ? 'ПРОВЕРИТЬ СОЕДИНЕНИЕ' : 'TEST CONNECTION')}
          </span>
        </button>

        {/* Save & Apply Key */}
        <button
          type="button"
          onClick={handleSaveKey}
          className="px-5 py-3 rounded-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-wider text-xs flex items-center space-x-2 shadow-lg"
        >
          <CheckCircleIcon className="w-4 h-4" />
          <span>{isRu ? 'СОХРАНИТЬ И АКТИВИРОВАТЬ КЛЮЧ' : 'SAVE & ACTIVATE KEY'}</span>
        </button>

        {/* Skip / Unskip Custom API Key */}
        <button
          type="button"
          onClick={handleSkipKey}
          className={`px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center space-x-2 border-b-4 shadow-lg active:border-b-0 active:translate-y-1 ${
            isSkipped
              ? 'bg-yellow-400 hover:bg-yellow-300 text-black border-yellow-600 ring-2 ring-yellow-400/50'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-900'
          }`}
          title={isRu ? 'Пропустить ввод своего ключа и использовать встроенный' : 'Skip custom key entry and use built-in key'}
        >
          <span>⏭️</span>
          <span>
            {isSkipped 
              ? (isRu ? 'API KEY ПРОПУЩЕН ✓' : 'API KEY SKIPPED ✓')
              : (isRu ? 'ПРОПУСТИТЬ API KEY' : 'SKIP API KEY')}
          </span>
        </button>

        {/* Free Daily Limit Claim Button */}
        <button
          type="button"
          onClick={handleClaimFreeBonus}
          className={`px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center space-x-2 border-b-4 shadow-lg active:border-b-0 active:translate-y-1 ${
            canClaimFree
              ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-300 text-black border-yellow-600 animate-pulse'
              : 'bg-gray-800/80 text-gray-400 border-gray-900 opacity-60 cursor-default'
          }`}
          title={isRu ? 'Получить бесплатный дневной лимит (+50 запросов в день)' : 'Get free daily limit (+50 requests/day)'}
        >
          <span>🎁</span>
          <span>{canClaimFree ? (isRu ? 'ПОЛУЧИТЬ БЕСПЛАТНЫЙ ДНЕВНОЙ ЛИМИТ (+50)' : 'GET FREE DAILY LIMIT (+50)') : (isRu ? 'ДНЕВНОЙ ЛИМИТ ПОЛУЧЕН (+50)' : 'DAILY LIMIT CLAIMED (+50)')}</span>
        </button>

        {/* Reset to Default System Key */}
        {customKeyDetails.isCustom && (
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-4 py-3 rounded-2xl font-bold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 hover:border-rose-400 text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 ml-auto"
            title={isRu ? 'Сбросить на системный ключ' : 'Reset to system key'}
          >
            <TrashIcon className="w-4 h-4" />
            <span>{isRu ? 'Сбросить на встроенный ключ' : 'Reset to default'}</span>
          </button>
        )}

      </div>

    </div>
  );
};
