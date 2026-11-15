import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../services/audioService';
import {
  OFFLINE_DICTIONARY_PACKS,
  DictionaryPack,
  getDownloadedDictionaryIds,
  saveDownloadedDictionaryIds,
  performOfflineTranslation
} from '../services/offlineDictionaryEngine';
import { VolumeIcon, BookIcon, CheckCircleIcon, TrashIcon, SparklesIcon } from './Icons';
import { speakText } from '../services/geminiService';

interface OfflineTranslatorSectionProps {
  userLanguage?: string;
  setToast?: (msg: string) => void;
  onSelectLanguageForTranslation?: (langCode: string) => void;
}

export const OfflineTranslatorSection: React.FC<OfflineTranslatorSectionProps> = ({
  userLanguage = 'ru',
  setToast,
  onSelectLanguageForTranslation
}) => {
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [downloadingPackId, setDownloadingPackId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadSpeed, setDownloadSpeed] = useState<string>('0 MB/s');
  const [filterQuery, setFilterQuery] = useState<string>('');
  
  // Offline Tester State
  const [testerInput, setTesterInput] = useState<string>('Привет, как дела?');
  const [testerTargetLang, setTesterTargetLang] = useState<string>('eo');
  const [testerOutput, setTesterOutput] = useState<string>('');
  const [isTesterExact, setIsTesterExact] = useState<boolean>(false);
  const [packRequiredWarning, setPackRequiredWarning] = useState<boolean>(false);

  useEffect(() => {
    setDownloadedIds(getDownloadedDictionaryIds());
  }, []);

  // Handle single pack download with animated progress
  const handleDownloadPack = (pack: DictionaryPack) => {
    if (downloadingPackId) return;
    playSound('click');
    setDownloadingPackId(pack.id);
    setDownloadProgress(0);
    setDownloadSpeed('2.8 MB/s');

    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 15) + 10;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => {
          setDownloadedIds(prev => {
            const updated = Array.from(new Set([...prev, pack.id]));
            saveDownloadedDictionaryIds(updated);
            return updated;
          });
          setDownloadingPackId(null);
          setDownloadProgress(0);
          playSound('success');
          if (setToast) {
            setToast(
              (userLanguage !== 'en')
                ? `Офлайн-словарь "${pack.nameRu}" успешно загружен!`
                : `Offline dictionary "${pack.nameEn}" successfully downloaded!`
            );
          }
        }, 300);
      } else {
        setDownloadProgress(current);
        const randomSpeed = (Math.random() * 2 + 2.5).toFixed(1);
        setDownloadSpeed(`${randomSpeed} MB/s`);
      }
    }, 200);
  };

  // Batch Download All
  const handleDownloadAll = () => {
    if (downloadingPackId) return;
    playSound('click');
    const missing = OFFLINE_DICTIONARY_PACKS.filter(p => !downloadedIds.includes(p.id));
    if (missing.length === 0) {
      if (setToast) setToast((userLanguage !== 'en') ? 'Все словари уже загружены!' : 'All dictionaries are already downloaded!');
      return;
    }

    setDownloadingPackId('ALL');
    setDownloadProgress(0);
    setDownloadSpeed('4.2 MB/s');

    let current = 0;
    const interval = setInterval(() => {
      current += 8;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => {
          const allIds = OFFLINE_DICTIONARY_PACKS.map(p => p.id);
          setDownloadedIds(allIds);
          saveDownloadedDictionaryIds(allIds);
          setDownloadingPackId(null);
          setDownloadProgress(0);
          playSound('fanfare');
          if (setToast) {
            setToast(
              (userLanguage !== 'en')
                ? 'Все офлайн-словари успешно загружены (12 языков)!'
                : 'All offline dictionaries downloaded successfully (12 languages)!'
            );
          }
        }, 300);
      } else {
        setDownloadProgress(current);
      }
    }, 150);
  };

  // Delete pack
  const handleDeletePack = (packId: string) => {
    playSound('click');
    setDownloadedIds(prev => {
      const updated = prev.filter(id => id !== packId);
      saveDownloadedDictionaryIds(updated);
      return updated;
    });
    if (setToast) {
      setToast(
        (userLanguage !== 'en')
          ? 'Словарь удален из памяти устройства'
          : 'Dictionary removed from device memory'
      );
    }
  };

  // Clear all
  const handleClearAll = () => {
    playSound('click');
    setDownloadedIds([]);
    saveDownloadedDictionaryIds([]);
    if (setToast) {
      setToast((userLanguage !== 'en') ? 'Все офлайн-словари удалены' : 'All offline dictionaries cleared');
    }
  };

  // Execute test offline translation
  const handleTestTranslation = () => {
    playSound('select');
    const isPackDownloaded = downloadedIds.includes(testerTargetLang);
    const { result, isExactMatch, packRequired } = performOfflineTranslation(
      testerInput,
      testerTargetLang,
      isPackDownloaded
    );
    setTesterOutput(result);
    setIsTesterExact(isExactMatch);
    setPackRequiredWarning(!!packRequired);
  };

  // Total size calculated
  const totalSizeMb = downloadedIds.reduce((acc, id) => {
    const pack = OFFLINE_DICTIONARY_PACKS.find(p => p.id === id);
    return acc + (pack ? pack.sizeMb : 0);
  }, 0).toFixed(1);

  const filteredPacks = OFFLINE_DICTIONARY_PACKS.filter(pack => {
    const q = filterQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      pack.nameRu.toLowerCase().includes(q) ||
      pack.nameEn.toLowerCase().includes(q) ||
      pack.code.toLowerCase().includes(q) ||
      pack.descriptionRu.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-gray-900/90 border-2 border-duo-blue/50 rounded-3xl p-5 md:p-8 shadow-2xl space-y-6 my-6 text-white">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg border border-blue-400/30">
            <BookIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300">
                СЛОВАРИ ДЛЯ ПЕРЕВОДА БЕЗ ИНТЕРНЕТА
              </h3>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                Offline Packs
              </span>
            </div>
            <p className="text-xs text-gray-400 font-bold mt-1">
              {(userLanguage !== 'en')
                ? 'Загружайте словарные базы на устройство для мнгновенного перевода без подключения к сети'
                : 'Download dictionary bases to your device for instant offline translation'}
            </p>
          </div>
        </div>

        {/* BATCH ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadAll}
            disabled={downloadingPackId !== null}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md border-b-2 border-emerald-800 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <span>⚡</span>
            <span>{(userLanguage !== 'en') ? 'Скачать все (12)' : 'Download All (12)'}</span>
          </button>
          {downloadedIds.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-2.5 bg-gray-800 hover:bg-rose-900/60 text-gray-400 hover:text-rose-300 font-bold text-xs rounded-xl border border-gray-700 transition-all flex items-center space-x-1.5"
              title="Очистить память"
            >
              <TrashIcon className="w-4 h-4" />
              <span>{(userLanguage !== 'en') ? 'Очистить' : 'Clear'}</span>
            </button>
          )}
        </div>
      </div>

      {/* STATS & SEARCH BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/80 border border-gray-700/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Загружено словарей
            </p>
            <p className="text-xl font-black text-white mt-0.5">
              {downloadedIds.length} <span className="text-xs font-normal text-gray-400">из {OFFLINE_DICTIONARY_PACKS.length}</span>
            </p>
          </div>
          <div className="text-2xl">📚</div>
        </div>

        <div className="bg-gray-800/80 border border-gray-700/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Память устройств
            </p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">
              {totalSizeMb} MB <span className="text-xs font-normal text-gray-400">из 500 MB</span>
            </p>
          </div>
          <div className="text-2xl">💾</div>
        </div>

        {/* Search input */}
        <div className="bg-gray-800/80 border border-gray-700/80 rounded-2xl p-2.5 flex items-center space-x-2">
          <span className="text-gray-400 ml-2">🔍</span>
          <input
            type="text"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            placeholder={(userLanguage !== 'en') ? 'Поиск словаря...' : 'Search dictionary...'}
            className="w-full bg-transparent text-xs font-bold text-white focus:outline-none placeholder-gray-500"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className="text-xs text-gray-400 hover:text-white px-2"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* BATCH DOWNLOAD PROGRESS BAR */}
      {downloadingPackId === 'ALL' && (
        <div className="bg-blue-950/60 border border-blue-500/40 rounded-2xl p-4 space-y-2 animate-pulse">
          <div className="flex justify-between text-xs font-bold text-blue-300">
            <span>🚀 Пакетная загрузка всех 12 словарей...</span>
            <span>{downloadProgress}% ({downloadSpeed})</span>
          </div>
          <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden border border-blue-500/30">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full transition-all duration-200"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* DICTIONARY PACKS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPacks.map(pack => {
          const isDownloaded = downloadedIds.includes(pack.id);
          const isDownloadingThis = downloadingPackId === pack.id;

          return (
            <div
              key={pack.id}
              className={`relative bg-gray-800/70 border-2 rounded-2xl p-4 transition-all hover:border-blue-400/60 flex flex-col justify-between space-y-3 ${
                isDownloaded
                  ? 'border-emerald-500/40 bg-emerald-950/10'
                  : 'border-gray-700/80'
              }`}
            >
              {/* TOP ITEM HEADER */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2.5">
                    {pack.flag === 'un' ? (
                      <span className="text-2xl">🌐</span>
                    ) : (
                      <img
                        src={`https://flagcdn.com/w40/${pack.flag}.png`}
                        className="w-6 h-4 rounded-sm object-cover border border-white/20 shadow-sm"
                        alt={pack.nameRu}
                      />
                    )}
                    <h4 className="font-black text-sm text-white">{pack.nameRu}</h4>
                  </div>
                  <span className="text-[11px] font-bold text-gray-400 bg-gray-900/80 px-2 py-0.5 rounded-lg border border-gray-700">
                    {pack.sizeMb} MB
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 font-medium leading-snug">
                  {pack.descriptionRu}
                </p>
                <div className="mt-2 text-[10px] text-gray-400 font-mono">
                  {pack.wordCount.toLocaleString()} словарных статей
                </div>
              </div>

              {/* DOWNLOAD / STATUS BUTTON */}
              <div>
                {isDownloadingThis ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-blue-300">
                      <span>Загрузка...</span>
                      <span>{downloadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden border border-blue-500/40">
                      <div
                        className="bg-blue-500 h-full transition-all duration-200"
                        style={{ width: `${downloadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : isDownloaded ? (
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-700/50">
                    <span className="text-emerald-400 text-xs font-black flex items-center space-x-1">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Загружен</span>
                    </span>
                    <div className="flex items-center space-x-1">
                      {onSelectLanguageForTranslation && (
                        <button
                          onClick={() => {
                            playSound('select');
                            onSelectLanguageForTranslation(pack.code);
                          }}
                          className="px-2.5 py-1 bg-duo-blue/20 hover:bg-duo-blue/40 text-duo-blue text-[11px] font-bold rounded-lg transition-all"
                        >
                          Перевести
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePack(pack.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Удалить из памяти"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleDownloadPack(pack)}
                    disabled={downloadingPackId !== null}
                    className="w-full py-2 bg-gray-700 hover:bg-duo-blue text-white font-black text-xs uppercase tracking-wider rounded-xl border-b-2 border-gray-900 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <span>📥</span>
                    <span>Скачать словарь</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* INSTANT OFFLINE TRANSLATION TESTER */}
      <div className="bg-gray-800/90 border border-gray-700 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-700 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">⚡</span>
            <h4 className="font-black text-sm text-white uppercase tracking-wider">
              Проверка локального офлайн-переводчика
            </h4>
          </div>
          <span className="text-[10px] font-bold uppercase bg-blue-900/60 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-500/30">
            Без интернета / Instant Offline
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">
              Введите текст на русском:
            </label>
            <input
              type="text"
              value={testerInput}
              onChange={e => setTesterInput(e.target.value)}
              placeholder="Привет, как дела? / Спасибо / Сколько это стоит?"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:border-duo-blue focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">
              Язык офлайн-перевода:
            </label>
            <select
              value={testerTargetLang}
              onChange={e => setTesterTargetLang(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:border-duo-blue focus:outline-none"
            >
              {OFFLINE_DICTIONARY_PACKS.map(pack => (
                <option key={pack.id} value={pack.code}>
                  {pack.nameRu} ({downloadedIds.includes(pack.id) ? '✅ Загружен' : '⚠️ Не скачан'})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleTestTranslation}
            className="px-6 py-2.5 bg-duo-green hover:brightness-110 active:translate-y-0.5 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md border-b-2 border-duo-greenDark transition-all flex items-center space-x-2"
          >
            <span>⚡</span>
            <span>Выполнить офлайн-перевод</span>
          </button>
        </div>

        {/* OUTPUT RESULT */}
        {testerOutput && (
          <div
            className={`border rounded-xl p-4 space-y-2 animate-in fade-in slide-in-from-bottom-2 ${
              packRequiredWarning
                ? 'bg-amber-950/40 border-amber-500/40'
                : 'bg-gray-900/90 border-duo-blue/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-duo-blue tracking-wider flex items-center space-x-1">
                <span>✨</span>
                <span>Офлайн-перевод (Локальный словарь DuoWindo6601)</span>
              </span>
              <button
                onClick={() => speakText(testerOutput, testerTargetLang)}
                className="p-1.5 bg-gray-800 hover:bg-gray-700 text-duo-blue rounded-lg transition-transform hover:scale-110"
                title="Озвучить"
              >
                <VolumeIcon className="w-4 h-4" />
              </button>
            </div>
            <p className="text-lg font-black text-white">{testerOutput}</p>
          </div>
        )}
      </div>
    </div>
  );
};
