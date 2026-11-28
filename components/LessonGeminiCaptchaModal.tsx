import React, { useState } from 'react';
import { Course, UserProgress } from '../types';
import { GoogleRecaptcha } from './GoogleRecaptcha';
import { getActiveApiKeyInfo, pingGeminiApi } from '../services/geminiService';
import { saveCustomApiKey, clearCustomApiKey } from '../services/aiLimitManager';

export interface LessonGeminiCaptchaModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  user: UserProgress;
  setUser?: React.Dispatch<React.SetStateAction<UserProgress>>;
  playSound: (type: string) => void;
  onToast?: (msg: string) => void;
  recaptchaToken: string | null;
  setRecaptchaToken: (token: string | null) => void;
}

export const isLanguageCourse = (courseId: string): boolean => {
  const nonLanguageIds = ['chess', 'math', 'music', 'art', 'ishihara'];
  return !nonLanguageIds.includes((courseId || '').toLowerCase());
};

export const LessonGeminiCaptchaModal: React.FC<LessonGeminiCaptchaModalProps> = ({
  isOpen,
  onClose,
  course,
  user,
  setUser,
  playSound,
  onToast,
  recaptchaToken,
  setRecaptchaToken
}) => {
  const isRu = (user.language || 'ru') !== 'en';
  const isLangCourse = isLanguageCourse(course?.id || '');

  // reCAPTCHA local state
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  // Gemini API Testing state
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null);

  // Quick Key Input state
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [keyInput, setKeyInput] = useState<string>('');
  const [keyType, setKeyType] = useState<'free' | 'paid'>('free');

  if (!isOpen) return null;

  const activeKeyInfo = getActiveApiKeyInfo();

  // Test Gemini API connection during lesson
  const handleTestGeminiApi = async () => {
    playSound('click');
    setCaptchaError(null);

    if (!recaptchaToken) {
      const err = isRu
        ? 'Подтвердите капчу Google reCAPTCHA («Я не робот») перед проверкой Gemini API'
        : 'Please complete the Google reCAPTCHA verification before testing Gemini API';
      setCaptchaError(err);
      playSound('wrong');
      if (onToast) onToast(`⚠️ ${err}`);
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await pingGeminiApi(keyInput.trim() || undefined);
      setTestResult(res);
      if (res.ok) {
        playSound('correct');
        if (onToast) {
          onToast(isRu 
            ? `⚡ Gemini API проверен во время урока (${res.latencyMs || 0} мс)!` 
            : `⚡ Gemini API verified during lesson (${res.latencyMs || 0} ms)!`);
        }
      } else {
        playSound('wrong');
        if (onToast) onToast(`⚠️ ${res.message}`);
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

  // Save key during lesson
  const handleSaveKey = () => {
    setCaptchaError(null);

    if (!recaptchaToken) {
      const err = isRu
        ? 'Подтвердите капчу Google reCAPTCHA («Я не робот») перед сохранением Gemini API Key'
        : 'Please complete the Google reCAPTCHA verification before saving Gemini API Key';
      setCaptchaError(err);
      playSound('wrong');
      if (onToast) onToast(`⚠️ ${err}`);
      return;
    }

    const trimmed = keyInput.trim();
    if (!trimmed || trimmed.length < 10) {
      playSound('wrong');
      if (onToast) onToast(isRu ? 'Введите корректный ключ API (AIzaSy... или AQ....)' : 'Please enter a valid API key');
      return;
    }

    saveCustomApiKey(trimmed, keyType);
    if (setUser) {
      setUser(prev => ({
        ...prev,
        customApiKey: trimmed,
        customApiKeyType: keyType
      }));
    }

    playSound('fanfare');
    setShowKeyInput(false);
    if (onToast) {
      onToast(isRu ? '🔑 Gemini API Key обновлен во время урока!' : '🔑 Gemini API Key updated during lesson!');
    }
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200 select-none">
      <div className="bg-[#12121a] border-2 border-purple-500/50 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative overflow-hidden my-auto text-white">
        
        {/* Glow ambient background */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header with Close */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-800 pb-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-2xl shadow-lg border border-purple-400/40">
              🛡️
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg uppercase text-white tracking-tight flex items-center gap-2">
                <span>{isRu ? 'Капча проверка Gemini API' : 'Gemini API Captcha Verification'}</span>
              </h3>
              <p className="text-[11px] text-purple-300 font-bold">
                {isRu ? 'Во время урока • DuoWindo6601 Security' : 'During Lesson • DuoWindo6601 Security'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 transition-colors cursor-pointer"
            title={isRu ? 'Закрыть' : 'Close'}
          >
            ✕
          </button>
        </div>

        {/* COURSE CATEGORY BADGE & INDICATOR */}
        <div className="mb-4 p-3 rounded-2xl bg-gray-900/90 border border-gray-800 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <span className="text-2xl shrink-0">
              {isLangCourse ? '🌍' : course?.id === 'chess' ? '♟️' : course?.id === 'math' ? '📐' : course?.id === 'music' ? '🎵' : '🎨'}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  isLangCourse 
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {isLangCourse 
                    ? (isRu ? '🌍 Курс-язык' : '🌍 Language Course') 
                    : (isRu ? '♟️ Курс-не язык' : '♟️ Non-Language Course')}
                </span>
                <span className="text-[10px] text-gray-400 font-mono font-bold uppercase truncate">
                  ID: {course?.id}
                </span>
              </div>
              <div className="text-xs font-bold text-gray-200 truncate mt-0.5">
                {course?.localName || course?.name || (isRu ? 'Текущий урок' : 'Current Lesson')}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 font-bold block">
              Gemini 3 Flash
            </span>
          </div>
        </div>

        {/* ACTIVE KEY STATUS CARD */}
        <div className="mb-4 p-3.5 rounded-2xl bg-gray-950/80 border border-purple-500/30 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-400 uppercase text-[10px] tracking-wider">
              {isRu ? 'Активный источник ключа ИИ:' : 'Active AI Key Source:'}
            </span>
            <span className={`font-black uppercase text-[10px] px-2 py-0.5 rounded-full border ${
              activeKeyInfo.type === 'paid' 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {activeKeyInfo.type === 'paid' ? '🔥 Paid Pro' : '🌱 Free Tier'}
            </span>
          </div>

          <div className="flex items-center justify-between text-gray-200 font-bold">
            <span className="truncate flex items-center gap-1.5">
              <span>🔑</span>
              <span>{activeKeyInfo.sourceLabel}</span>
            </span>
            <span className="font-mono text-[11px] text-gray-400">
              {activeKeyInfo.maskedKey}
            </span>
          </div>
        </div>

        {/* GOOGLE RECAPTCHA API COMPONENT */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-300 px-1">
            <span className="flex items-center gap-1.5">
              <span>🤖</span>
              <span>{isRu ? 'Подтверждение Google reCAPTCHA API:' : 'Google reCAPTCHA Verification:'}</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-black">
              {recaptchaToken ? (isRu ? '✓ Пройдено' : '✓ Solved') : (isRu ? 'Требуется' : 'Required')}
            </span>
          </div>

          <GoogleRecaptcha
            isVerified={Boolean(recaptchaToken)}
            onVerify={(tok) => {
              setRecaptchaToken(tok);
              setCaptchaError(null);
              playSound('click');
            }}
            onExpire={() => setRecaptchaToken(null)}
            language={user.language || 'ru'}
            error={captchaError}
          />
        </div>

        {/* TEST RESULT ALERT */}
        {testResult && (
          <div className={`p-3 rounded-2xl mb-4 text-xs font-bold border flex items-center justify-between gap-2 animate-in fade-in ${
            testResult.ok 
              ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300' 
              : 'bg-red-950/60 border-red-500/60 text-red-300'
          }`}>
            <div className="flex items-center space-x-2">
              <span>{testResult.ok ? '✅' : '⚠️'}</span>
              <span>{testResult.message}</span>
            </div>
            {typeof testResult.latencyMs === 'number' && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-black/40 border border-current shrink-0">
                {testResult.latencyMs} ms
              </span>
            )}
          </div>
        )}

        {/* QUICK KEY INPUT ACCORDION */}
        {showKeyInput && (
          <div className="mb-4 p-3.5 rounded-2xl bg-gray-900 border border-gray-700 space-y-2.5 animate-in fade-in text-xs">
            <label className="font-black text-white uppercase text-[10px] tracking-wider block">
              {isRu ? 'Ввести собственный Gemini API Key во время урока:' : 'Enter custom Gemini API Key:'}
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy... / AQ...."
              className="w-full bg-gray-950 border border-gray-700 focus:border-purple-500 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-gray-600 outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setKeyType('free')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase border ${
                  keyType === 'free' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-gray-800 text-gray-400 border-gray-700'
                }`}
              >
                🌱 Free Tier
              </button>
              <button
                type="button"
                onClick={() => setKeyType('paid')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase border ${
                  keyType === 'paid' ? 'bg-amber-600 text-white border-amber-400' : 'bg-gray-800 text-gray-400 border-gray-700'
                }`}
              >
                🔥 Paid Pro
              </button>
              <button
                type="button"
                onClick={handleSaveKey}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase border border-purple-400 shrink-0"
              >
                {isRu ? 'Сохранить' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="space-y-2 pt-1">
          {/* Main Action: Test Gemini API Connection */}
          <button
            type="button"
            disabled={isTesting}
            onClick={handleTestGeminiApi}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:brightness-110 text-white font-black rounded-2xl border-b-4 border-purple-900 active:border-b-0 active:translate-y-1 transition-all uppercase text-xs tracking-wider shadow-lg flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {isTesting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>⚡</span>
            )}
            <span>
              {isTesting 
                ? (isRu ? 'Проверка связи с Gemini API...' : 'Testing Gemini API...') 
                : (isRu ? 'Проверить Gemini API во время урока' : 'Test Gemini API Connection')}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playSound('click');
                setShowKeyInput(!showKeyInput);
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-[11px] font-bold border border-gray-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🔑</span>
              <span>{showKeyInput ? (isRu ? 'Скрыть ввод ключа' : 'Hide key input') : (isRu ? 'Сменить API Key' : 'Change API Key')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playSound('click');
                onClose();
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black uppercase tracking-wider border-b-2 border-emerald-800 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <span>✓</span>
              <span>{isRu ? 'Продолжить урок' : 'Continue Lesson'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
