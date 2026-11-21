import React, { useState } from 'react';
import { UserProgress, SubscriptionTier } from '../types';
import {
  FISH_AUDIO_MODELS,
  FishModelId,
  DEFAULT_FISH_REFERENCE_ID,
  getAdminFishConfig,
  saveAdminFishConfig,
  resetAdminFishConfig,
} from '../services/fishAudioConfig';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface AdminFishAudioManagerProps {
  user: UserProgress;
  onUpdateUser?: (updater: (prev: UserProgress) => UserProgress) => void;
  isUnlocked: boolean;
  isOwnerByEmail: boolean;
  hasInsufficientRights?: boolean;
  isTokenAuditDenied?: boolean;
  playSound?: (type: string) => void;
  setToast?: (msg: any) => void;
}

export const AdminFishAudioManager: React.FC<AdminFishAudioManagerProps> = ({
  user,
  onUpdateUser,
  isUnlocked,
  isOwnerByEmail,
  hasInsufficientRights = false,
  isTokenAuditDenied = false,
  playSound,
  setToast,
}) => {
  const role = String(user.role || '').toLowerCase();
  const isAdminOrDevRole =
    user.isAdmin === true ||
    role === 'admin' ||
    role === 'owner' ||
    role === 'developer' ||
    isOwnerByEmail;
  const isAuthorized = isUnlocked && isAdminOrDevRole && !hasInsufficientRights && !isTokenAuditDenied;

  const [config, setConfig] = useState(() => getAdminFishConfig());
  const [showKey, setShowKey] = useState(false);
  const [testText, setTestText] = useState(
    'Привет! Проверка голосовой модели Fish Audio в Панели Владельца DuoWindo6601.'
  );
  const [testingModel, setTestingModel] = useState<FishModelId | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { ok: boolean; status: number; modelUsed: string; voiceLang?: string; bytes: number; ms: number; error?: string }>
  >({});

  const persistConfig = async (nextConfig: ReturnType<typeof getAdminFishConfig>, note?: string) => {
    const saved = saveAdminFishConfig(nextConfig);
    setConfig(saved);
    try {
      if (db) {
        await setDoc(
          doc(db, 'system_config', 'fish_audio'),
          {
            defaultReferenceId: saved.defaultReferenceId,
            adminDevBypassPaidGate: saved.adminDevBypassPaidGate,
            enabledModels: saved.enabledModels,
            hasCustomApiKey: Boolean(saved.customApiKey),
            updatedAt: saved.updatedAt,
            updatedBy: auth.currentUser?.email || user.email || user.username || 'admin_dev',
          },
          { merge: true }
        );
      }
    } catch (e) {
      console.warn('Firestore system_config/fish_audio sync note:', e);
    }
    if (note) {
      playSound?.('success');
      setToast?.(note);
    }
  };

  const handleTestFishModel = async (modelId: FishModelId) => {
    playSound?.('click');
    setTestingModel(modelId);
    const t0 = performance.now();
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (config.customApiKey && config.customApiKey.startsWith('sk-fish-')) {
        headers['x-fish-api-key'] = config.customApiKey;
      }

      const phrase = testText.trim() || 'Testing Fish Audio TTS.';
      const detectedLang = /[\u0400-\u04FF]/.test(phrase)
        ? 'ru'
        : /[\u0600-\u06FF]/.test(phrase)
          ? 'ar'
          : /[\u3040-\u30FF]/.test(phrase)
            ? 'ja'
            : /[\uAC00-\uD7AF]/.test(phrase)
              ? 'ko'
              : /[\u4E00-\u9FFF]/.test(phrase)
                ? 'zh'
                : /[\u0590-\u05FF]/.test(phrase)
                  ? 'he'
                  : /[\u0900-\u097F]/.test(phrase)
                    ? 'hi'
                    : /[\u0E00-\u0E7F]/.test(phrase)
                      ? 'th'
                      : /[\u0370-\u03FF]/.test(phrase)
                        ? 'el'
                        : !testText.trim()
                          ? 'en'
                          : (user.language || 'ru');
      const shouldSendRef =
        Boolean(config.defaultReferenceId) &&
        (detectedLang === 'en' || config.defaultReferenceId !== DEFAULT_FISH_REFERENCE_ID);

      const res = await fetch('/api/tts/fish', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: phrase,
          format: 'mp3',
          lang: detectedLang,
          model: modelId,
          ...(shouldSendRef ? { reference_id: config.defaultReferenceId } : {}),
        }),
      });

      const ms = Math.round(performance.now() - t0);
      const modelUsed = res.headers.get('x-fish-model-used') || modelId;
      const voiceLang = res.headers.get('x-fish-voice-lang') || detectedLang;

      if (!res.ok) {
        const errTxt = await res.text();
        setTestResults((prev) => ({
          ...prev,
          [modelId]: { ok: false, status: res.status, modelUsed, voiceLang, bytes: 0, ms, error: errTxt.slice(0, 140) },
        }));
        playSound?.('wrong');
        setToast?.(`❌ ${modelId}: HTTP ${res.status}`);
        return;
      }

      const buf = await res.arrayBuffer();
      setTestResults((prev) => ({
        ...prev,
        [modelId]: { ok: true, status: res.status, modelUsed, voiceLang, bytes: buf.byteLength, ms },
      }));

      const blob = new Blob([buf], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      audio.play().catch(() => {});

      playSound?.('success');
      setToast?.(
        `🐋 ${modelId} → ${modelUsed} [${voiceLang}] (${Math.round(buf.byteLength / 1024)} KB, ${ms} мс)`
      );
    } catch (err: any) {
      const ms = Math.round(performance.now() - t0);
      setTestResults((prev) => ({
        ...prev,
        [modelId]: { ok: false, status: 0, modelUsed: modelId, bytes: 0, ms, error: err?.message || 'Network error' },
      }));
      playSound?.('wrong');
    } finally {
      setTestingModel(null);
    }
  };

  const handleToggleModelEnabled = (modelId: FishModelId) => {
    if (modelId === 's2.1-pro-free') {
      setToast?.('🐋 Модель s2.1-pro-free всегда включена для бесплатного доступа.');
      return;
    }
    const next = {
      ...config,
      enabledModels: {
        ...config.enabledModels,
        [modelId]: !config.enabledModels[modelId],
      },
    };
    void persistConfig(
      next,
      next.enabledModels[modelId]
        ? `✅ Модель ${modelId} включена для тарифов Super / Max`
        : `⏸️ Модель ${modelId} временно отключена администратором`
    );
  };

  const handleSwitchTestTier = (tier: SubscriptionTier) => {
    if (!onUpdateUser) return;
    playSound?.('select');
    onUpdateUser((prev) => {
      const updated: UserProgress = {
        ...prev,
        subscription: tier,
        infiniteEnergy: tier !== 'free',
        infiniteHearts: tier !== 'free',
      };
      try {
        localStorage.setItem('duo_user_progress_6601', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setToast?.(`👑 Тариф текущего аккаунта переключён для теста: ${tier.toUpperCase()}`);
  };

  if (!isAuthorized) {
    return (
      <div className="bg-gradient-to-br from-red-950/90 via-gray-900 to-red-950/80 border-2 border-red-500 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-3 text-left">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-red-600/30 border border-red-500 flex items-center justify-center text-2xl">
            🔒
          </div>
          <div>
            <h3 className="text-lg font-black uppercase text-red-400">
              Доступ запрещен • Fish Audio Admin & Dev Tool
            </h3>
            <p className="text-xs text-red-200/80 font-bold">
              Управление моделями Fish Audio (s2.1-pro-free, drama-3, s2.1-pro, s2-pro) доступно только Администрации и Разработчикам в Панели Владельца.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in text-left">
      {/* Header Banner for Administration & Developers */}
      <div className="bg-gradient-to-br from-slate-900 via-cyan-950/35 to-indigo-950/40 border-2 border-cyan-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-2xl shadow-inner">
              🐋
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black uppercase tracking-tight text-white">
                  Fish Audio — Модели и Доступ (Admin / Dev Tool)
                </h2>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                  👑 Администрация
                </span>
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                  💻 Разработчик
                </span>
              </div>
              <p className="text-xs text-gray-300 font-bold mt-1">
                Управление тарифами голосовых моделей Fish Audio, ключом SDK <code>fish-audio</code> и диагностикой в реальном времени.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const reset = resetAdminFishConfig();
              setConfig(reset);
              playSound?.('click');
              setToast?.('🔄 Настройки Fish Audio сброшены к стандартным');
            }}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs rounded-xl border border-gray-700 transition-all cursor-pointer self-start md:self-auto"
          >
            🔄 Сбросить по умолчанию
          </button>
        </div>

        {/* Role & QA Subscription Simulator + Bypass Toggle */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-black/40 border border-gray-800 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase text-white">
                🛠️ Тест платных моделей для Администрации и Разработчика
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Разрешает админам и разработчикам выбирать <code>drama-3</code>, <code>s2.1-pro</code>, <code>s2-pro</code> независимо от текущего тарифа.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                void persistConfig(
                  { ...config, adminDevBypassPaidGate: !config.adminDevBypassPaidGate },
                  !config.adminDevBypassPaidGate
                    ? '✅ Доступ Администрации и Разработчика ко всем моделям включён'
                    : '🔒 Включена строгая проверка тарифа Super / Max'
                )
              }
              className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                config.adminDevBypassPaidGate ? 'bg-cyan-500' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform ${
                  config.adminDevBypassPaidGate ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="bg-black/40 border border-gray-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-white">
                💳 QA-переключатель тарифа (проверка Магазина):
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40">
                Сейчас: {(user.subscription || 'free').toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['free', 'super', 'max'] as SubscriptionTier[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleSwitchTestTier(t)}
                  className={`py-2 px-2 rounded-xl font-black text-[11px] uppercase border transition-all cursor-pointer ${
                    (user.subscription || 'free') === t
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                  }`}
                >
                  {t === 'free' ? 'Бесплатно' : t === 'super' ? 'Super' : 'Max'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Test Phrase Input */}
        <div className="bg-black/35 border border-gray-800 rounded-2xl p-4 space-y-2">
          <label className="text-xs font-black uppercase text-cyan-300 block">
            🎙️ Текст для живой проверки моделей Fish Audio (/api/tts/fish):
          </label>
          <input
            type="text"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none"
          />
        </div>

        {/* 4 Models Access & Diagnostics Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FISH_AUDIO_MODELS.map((spec) => {
            const enabled = config.enabledModels[spec.id] !== false;
            const res = testResults[spec.id];
            const isTesting = testingModel === spec.id;
            const isCurrent = user.fishModel === spec.id;

            return (
              <div
                key={spec.id}
                className={`rounded-2xl border-2 p-4 space-y-3 transition-all ${
                  isCurrent
                    ? 'bg-cyan-950/50 border-cyan-400 shadow-lg'
                    : 'bg-gray-900/80 border-gray-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{spec.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-sm text-white">{spec.label}</h4>
                        <code className="text-[10px] font-mono bg-black/60 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">
                          model: {spec.id}
                        </code>
                      </div>
                      <p className={`text-[11px] font-black mt-0.5 ${spec.accessType === 'free' ? 'text-emerald-300' : 'text-amber-300'}`}>
                        {spec.accessFullRu}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleModelEnabled(spec.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border cursor-pointer shrink-0 ${
                      enabled
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                        : 'bg-red-950/80 text-red-300 border-red-500/50'
                    }`}
                  >
                    {enabled ? 'Вкл' : 'Выкл'}
                  </button>
                </div>

                {res && (
                  <div
                    className={`p-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-between gap-2 ${
                      res.ok
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                        : 'bg-red-950/60 border-red-500/40 text-red-200'
                    }`}
                  >
                    <span>
                      {res.ok
                        ? `✅ HTTP ${res.status} • ${res.modelUsed}${res.voiceLang ? ` [${res.voiceLang}]` : ''} • ${Math.round(res.bytes / 1024)} KB`
                        : `❌ HTTP ${res.status}: ${res.error}`}
                    </span>
                    <span className="font-mono text-[10px] bg-black/40 px-2 py-0.5 rounded">
                      {res.ms} мс
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void handleTestFishModel(spec.id)}
                    disabled={isTesting}
                    className="flex-1 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-black text-xs uppercase border-b-2 border-cyan-800 cursor-pointer"
                  >
                    {isTesting ? '⏳ Генерация...' : '🧪 Тест + Звук'}
                  </button>
                  {onUpdateUser && (
                    <button
                      type="button"
                      onClick={() => {
                        playSound?.('select');
                        onUpdateUser((prev) => {
                          const updated: UserProgress = {
                            ...prev,
                            voiceProvider: 'fish',
                            fishModel: spec.id,
                          };
                          try {
                            localStorage.setItem('duo_user_progress_6601', JSON.stringify(updated));
                          } catch {}
                          return updated;
                        });
                        setToast?.(`${spec.icon} Активная модель установлена: ${spec.id}`);
                      }}
                      className={`py-2 px-3 rounded-xl font-black text-xs uppercase border cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                      }`}
                    >
                      {isCurrent ? '✓ Активна' : 'Выбрать'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* SDK Reference ID & API Key Override for Admin & Developer */}
        <div className="bg-black/40 border border-gray-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-sm font-black uppercase text-white flex items-center gap-2">
              <span>🔑</span>
              <span>Конфигурация Fish Audio SDK (Администратор и Разработчик)</span>
            </h4>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-500/30">
              POST /api/tts/fish • npm: fish-audio
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 block">
                Voice Reference ID (по умолчанию):
              </label>
              <input
                type="text"
                value={config.defaultReferenceId}
                onChange={(e) => setConfig({ ...config, defaultReferenceId: e.target.value })}
                placeholder={DEFAULT_FISH_REFERENCE_ID}
                className="w-full bg-gray-900 border border-gray-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-100 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 block">
                Переопределить Fish Audio API Key (необязательно):
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={config.customApiKey}
                  onChange={(e) => setConfig({ ...config, customApiKey: e.target.value })}
                  placeholder="sk-fish-... (пусто = серверный ключ по умолчанию)"
                  className="w-full bg-gray-900 border border-gray-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 pr-16 text-xs font-mono text-amber-100 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-2 px-2 py-1 text-xs text-gray-400 hover:text-white cursor-pointer"
                >
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() =>
                void persistConfig(config, '💾 Конфигурация Fish Audio для Администрации и Разработчика сохранена!')
              }
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs uppercase rounded-xl border-b-2 border-blue-800 cursor-pointer shadow"
            >
              💾 Сохранить параметры Fish Audio
            </button>
            <button
              type="button"
              onClick={() =>
                void persistConfig(
                  { ...config, defaultReferenceId: DEFAULT_FISH_REFERENCE_ID, customApiKey: '' },
                  '🔄 Восстановлены стандартные ключ и reference_id'
                )
              }
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs rounded-xl border border-gray-700 cursor-pointer"
            >
              Стандартный reference_id
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
