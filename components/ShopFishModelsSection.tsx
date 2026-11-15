import React, { useState, useEffect } from 'react';
import { UserProgress } from '../types';
import {
  FISH_AUDIO_MODELS,
  FishModelSpec,
  canUserAccessFishModel,
  getAdminFishConfig,
} from '../services/fishAudioConfig';
import { speakWithFishAudio } from '../services/geminiService';

interface ShopFishModelsSectionProps {
  user: UserProgress;
  setUser: React.Dispatch<React.SetStateAction<UserProgress>>;
  playSound: (sound: any) => void;
  setToast: (msg: string | null) => void;
  onUpgrade: (tier: 'super' | 'max') => void;
  STORAGE_KEY: string;
}

export const ShopFishModelsSection: React.FC<ShopFishModelsSectionProps> = ({
  user,
  setUser,
  playSound,
  setToast,
  onUpgrade,
  STORAGE_KEY,
}) => {
  const isRu = (user.language || 'ru') !== 'en';
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [, setConfigVersion] = useState(0);

  useEffect(() => {
    const onCfgChange = () => setConfigVersion((v) => v + 1);
    window.addEventListener('duowindo_fish_config_changed', onCfgChange);
    return () => window.removeEventListener('duowindo_fish_config_changed', onCfgChange);
  }, []);

  const activeFishModel =
    user.voiceProvider === 'fish-drama-3'
      ? 'drama-3'
      : user.fishModel || 's2.1-pro-free';
  const isFishProviderActive =
    user.voiceProvider === 'fish' || user.voiceProvider === 'fish-drama-3';
  const fishConfig = getAdminFishConfig();

  const handleSelectModel = (spec: FishModelSpec) => {
    const access = canUserAccessFishModel(spec.id, user);
    if (!access.allowed) {
      playSound('wrong');
      setToast(
        isRu
          ? `🔒 model: ${spec.id} — Платно! Требуется подписка DuoWindo6601 Super или DuoWindo6601 Max.`
          : `🔒 model: ${spec.id} is Paid! Requires DuoWindo6601 Super or DuoWindo6601 Max.`
      );
      return;
    }

    playSound('select');
    setUser((prev) => {
      const updated: UserProgress = {
        ...prev,
        voiceProvider: 'fish',
        fishModel: spec.id,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setToast(
      isRu
        ? `${spec.icon} Fish Audio: выбрана модель ${spec.id} (${spec.accessType === 'free' ? 'Доступ Бесплатно' : 'Платно • Super/Max'})`
        : `${spec.icon} Fish Audio model selected: ${spec.id}`
    );
  };

  const handlePreviewModel = async (spec: FishModelSpec, e: React.MouseEvent) => {
    e.stopPropagation();
    const access = canUserAccessFishModel(spec.id, user);
    if (!access.allowed) {
      playSound('wrong');
      setToast(
        isRu
          ? `💎 ${spec.id} доступна в тарифах DuoWindo6601 Super и DuoWindo6601 Max!`
          : `💎 ${spec.id} requires DuoWindo6601 Super or DuoWindo6601 Max!`
      );
      return;
    }
    playSound('click');
    setTestingModel(spec.id);
    try {
      const sampleText = isRu
        ? `Привет! Это голосовая модель ${spec.label} в DuoWindo6601.`
        : `Hello! This is Fish Audio ${spec.label} in DuoWindo6601.`;
      await speakWithFishAudio(sampleText, user.language || 'ru', false, spec.id, fishConfig.defaultReferenceId);
    } catch (err: any) {
      setToast(err?.message || (isRu ? 'Не удалось воспроизвести пример' : 'Preview playback failed'));
    } finally {
      setTestingModel(null);
    }
  };

  const currentTierLabel =
    user.subscription === 'max'
      ? 'DuoWindo6601 Max'
      : user.subscription === 'super'
        ? 'DuoWindo6601 Super'
        : isRu
          ? 'Бесплатно'
          : 'Free';

  return (
    <div className="bg-gradient-to-br from-slate-900 via-cyan-950/35 to-slate-900 border-2 border-cyan-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/25 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-2xl shadow-inner shrink-0">
            🐋
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                {isRu ? 'Fish Audio — Голосовые Модели' : 'Fish Audio — Voice Models'}
              </h3>
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                SDK: fish-audio
              </span>
            </div>
            <p className="text-xs text-gray-300 font-medium mt-0.5">
              {isRu
                ? 'S2.1 Pro Free — Доступ Бесплатно • Drama 3, S2.1 Pro, S2 Pro — Платно (DuoWindo6601 Super / DuoWindo6601 Max)'
                : 'S2.1 Pro Free — Free Access • Drama 3, S2.1 Pro, S2 Pro — Paid (DuoWindo6601 Super / DuoWindo6601 Max)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-black px-3 py-1 rounded-xl bg-black/50 border border-cyan-500/40 text-cyan-200 uppercase">
            {isRu ? `Тариф: ${currentTierLabel}` : `Plan: ${currentTierLabel}`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FISH_AUDIO_MODELS.map((spec) => {
          const access = canUserAccessFishModel(spec.id, user);
          const isSelected = isFishProviderActive && activeFishModel === spec.id;
          const isFreeModel = spec.accessType === 'free';

          return (
            <div
              key={spec.id}
              onClick={() => handleSelectModel(spec)}
              className={`rounded-2xl border-2 p-4 sm:p-5 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'bg-cyan-900/40 border-cyan-400 ring-2 ring-cyan-400/40 shadow-xl'
                  : access.allowed
                    ? 'bg-black/45 border-gray-700 hover:border-cyan-500/60'
                    : 'bg-black/35 border-amber-500/35 hover:border-amber-400/70'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{spec.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-base text-white">{spec.label}</h4>
                        <code className="text-[10px] font-mono bg-black/60 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                          model: {spec.id}
                        </code>
                      </div>
                      <p className={`text-[11px] font-black mt-0.5 ${isFreeModel ? 'text-emerald-300' : 'text-amber-300'}`}>
                        {isRu ? spec.accessFullRu : spec.accessFullEn}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border shrink-0 ${
                      isFreeModel
                        ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                        : 'bg-amber-950/90 text-amber-300 border-amber-500/50'
                    }`}
                  >
                    {isFreeModel
                      ? isRu ? 'Бесплатно' : 'Free'
                      : isRu ? 'Платно' : 'Paid'}
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                  {isRu ? spec.descRu : spec.descEn}
                </p>

                {!isFreeModel && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-blue-950/80 text-blue-300 border border-blue-500/40">
                      ⭐ DuoWindo6601 Super
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-purple-950/80 text-purple-300 border border-purple-500/40">
                      💎 DuoWindo6601 Max
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-800/80">
                {access.allowed ? (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectModel(spec);
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-b-2 border-emerald-800'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white border-b-2 border-cyan-800'
                      }`}
                    >
                      {isSelected
                        ? isRu ? '✓ Выбрано для озвучки' : '✓ Active Voice'
                        : isRu ? 'Выбрать модель' : 'Select Model'}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handlePreviewModel(spec, e)}
                      disabled={testingModel === spec.id}
                      className="py-2 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-cyan-200 font-bold text-xs border border-gray-700 transition-all cursor-pointer disabled:opacity-50"
                      title={isRu ? 'Прослушать голос модели' : 'Preview voice'}
                    >
                      {testingModel === spec.id ? '⏳' : '🔊'}
                    </button>
                  </>
                ) : (
                  <div className="w-full flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSound('click');
                        onUpgrade('super');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] uppercase tracking-wider border-b-2 border-blue-800 cursor-pointer"
                    >
                      🔒 Super
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSound('click');
                        onUpgrade('max');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-[11px] uppercase tracking-wider border-b-2 border-purple-800 cursor-pointer"
                    >
                      🔒 Max
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
