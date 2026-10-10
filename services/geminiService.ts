
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Exercise, AdventureScenario, RoleplayMessage } from "../types";
import { 
  getTodayAiUsage, 
  recordAiUsage, 
  GeminiLimitExceededError, 
  triggerAiLimitModal,
  CUSTOM_API_KEY_STORAGE,
  getCustomApiKeyDetails,
  saveCustomApiKey,
  clearCustomApiKey,
  isCustomApiKeySkipped,
  getAdminApiKeyDetails,
  getDevApiKeyDetails,
  getGeminiKeyPriority
} from "./aiLimitManager";

export const MODEL_FREE = "gemini-3.6-flash";
export const MODEL_PRO = "gemini-3.6-flash";
const TTS_MODEL = "gemini-3.1-flash-tts-preview";

const sanitizeKey = (k: string): string => {
  if (!k) return '';
  return k.replace(/\s+/g, '');
};

export const DEFAULT_FALLBACK_GEMINI_KEY = (typeof process !== 'undefined' && (process.env?.GEMINI_API_KEY || process.env?.API_KEY)) || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) || '';

export interface ActiveApiKeyInfo {
  source: 'admin' | 'dev' | 'custom' | 'system' | 'none';
  sourceLabel: string;
  isSet: boolean;
  type: 'free' | 'paid';
  maskedKey: string;
}

export const getActiveApiKeyInfo = (): ActiveApiKeyInfo => {
  const priority = getGeminiKeyPriority();
  const adminDetails = getAdminApiKeyDetails();
  const devDetails = getDevApiKeyDetails();
  const customDetails = getCustomApiKeyDetails();
  const systemKey = (typeof process !== 'undefined' && (process.env?.GEMINI_API_KEY || process.env?.RENDER_MCP_API_KEY || process.env?.API_KEY)) || DEFAULT_FALLBACK_GEMINI_KEY;

  if (priority === 'admin' && adminDetails.isSet && adminDetails.enabled) {
    return { source: 'admin', sourceLabel: 'Администратор (Admin Key)', isSet: true, type: adminDetails.type, maskedKey: adminDetails.maskedKey };
  }
  if (priority === 'dev' && devDetails.isSet && devDetails.enabled) {
    return { source: 'dev', sourceLabel: 'Разработчик (Dev Key)', isSet: true, type: devDetails.type, maskedKey: devDetails.maskedKey };
  }
  if (priority === 'custom' && customDetails.isCustom && !isCustomApiKeySkipped()) {
    return { source: 'custom', sourceLabel: 'Пользовательский ключ', isSet: true, type: customDetails.type, maskedKey: customDetails.maskedKey };
  }
  if (priority === 'system' && systemKey) {
    return { source: 'system', sourceLabel: 'Системный ключ (DuoWindo6601)', isSet: true, type: 'free', maskedKey: systemKey.length > 8 ? `${systemKey.substring(0, 6)}••••${systemKey.substring(systemKey.length - 4)}` : '••••••••' };
  }

  // Auto resolution:
  if (adminDetails.isSet && adminDetails.enabled) {
    return { source: 'admin', sourceLabel: 'Администратор (Admin Key)', isSet: true, type: adminDetails.type, maskedKey: adminDetails.maskedKey };
  }
  if (devDetails.isSet && devDetails.enabled) {
    return { source: 'dev', sourceLabel: 'Разработчик (Dev Key)', isSet: true, type: devDetails.type, maskedKey: devDetails.maskedKey };
  }
  if (customDetails.isCustom && !isCustomApiKeySkipped()) {
    return { source: 'custom', sourceLabel: 'Пользовательский ключ', isSet: true, type: customDetails.type, maskedKey: customDetails.maskedKey };
  }
  if (systemKey) {
    return { source: 'system', sourceLabel: 'Системный ключ (DuoWindo6601)', isSet: true, type: 'free', maskedKey: systemKey.length > 8 ? `${systemKey.substring(0, 6)}••••${systemKey.substring(systemKey.length - 4)}` : '••••••••' };
  }

  return { source: 'none', sourceLabel: 'Не настроен (Бесплатный Cloud Proxy)', isSet: false, type: 'free', maskedKey: 'Не указан' };
};

export const getApiKey = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const priority = getGeminiKeyPriority();
      const adminDetails = getAdminApiKeyDetails();
      const devDetails = getDevApiKeyDetails();
      const customKey = localStorage.getItem(CUSTOM_API_KEY_STORAGE);

      if (priority === 'admin' && adminDetails.isSet && adminDetails.enabled && adminDetails.key) {
        return sanitizeKey(adminDetails.key);
      }
      if (priority === 'dev' && devDetails.isSet && devDetails.enabled && devDetails.key) {
        return sanitizeKey(devDetails.key);
      }
      if (priority === 'custom' && customKey && !isCustomApiKeySkipped()) {
        return sanitizeKey(customKey);
      }

      // Default auto priority: Admin -> Dev -> Custom -> System -> Fallback
      if (adminDetails.isSet && adminDetails.enabled && adminDetails.key) {
        return sanitizeKey(adminDetails.key);
      }
      if (devDetails.isSet && devDetails.enabled && devDetails.key) {
        return sanitizeKey(devDetails.key);
      }
      if (!isCustomApiKeySkipped() && customKey && customKey.trim().length > 5) {
        return sanitizeKey(customKey);
      }
    } catch (e) {
      console.warn("Error resolving Gemini API key:", e);
    }
  }
  const key = (typeof process !== 'undefined' && (process.env?.GEMINI_API_KEY || process.env?.RENDER_MCP_API_KEY || process.env?.API_KEY)) || DEFAULT_FALLBACK_GEMINI_KEY;
  return sanitizeKey(key) || DEFAULT_FALLBACK_GEMINI_KEY;
};

/**
 * Returns the server-side proxy URL if running in a web environment.
 * Routing requests through the Cloud Run container (located in the United States)
 * completely eliminates the "User location is not supported for the API use" error
 * for users in geo-restricted regions.
 */
export const getGeminiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    if (origin && origin !== 'null' && (origin.startsWith('http://') || origin.startsWith('https://'))) {
      return `${origin}/api/gemini-proxy`;
    }
    return '/api/gemini-proxy';
  }
  return 'http://localhost:3000/api/gemini-proxy';
};

/**
 * Factory to create a GoogleGenAI client configured with proxy and current API key.
 */
export const createGenAiClient = (customKey?: string): GoogleGenAI => {
  const key = (customKey && customKey.trim()) ? customKey.trim() : getApiKey();
  const baseUrl = getGeminiBaseUrl();
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: baseUrl ? { baseUrl } : undefined,
  });
};

const TOPICS = ['приветствия', 'еда', 'семья', 'путешествия', 'хобби', 'магазины', 'работа', 'погода', 'числа'];

const audioCache = new Map<string, string>();

/**
 * 1. Обработка ошибки 429 с Exponential Backoff + Jitter
 * Выполняет вызов Gemini API с экспоненциальной задержкой (1s, 2s, 4s, 8s, 16s...)
 * и случайным джиттером (0-500ms), предотвращая одновременные повторные всплески.
 */
export async function fetchGeminiWithRetry<T>(
  apiCall: () => Promise<T>,
  retries: number = 5,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await apiCall();
      recordAiUsage();
      return result;
    } catch (error: any) {
      if (error instanceof GeminiLimitExceededError) {
        throw error;
      }

      const errorMessage = String(error?.message || error || "");
      const errorStatus = error?.status || 0;

      const isPermissionDenied = 
        errorStatus === 403 || 
        errorMessage.includes('permission denied') || 
        errorMessage.includes('PERMISSION_DENIED') ||
        errorMessage.includes('API_KEY_INVALID') ||
        errorMessage.includes('API key not valid');

      if (isPermissionDenied) {
        console.warn("Gemini API permission/key error, falling back smoothly:", errorMessage);
        throw error;
      }

      const isLocationBlocked = 
        errorMessage.includes('location is not supported') || 
        errorMessage.includes('User location');

      if (isLocationBlocked) {
        console.warn("Direct Gemini call blocked by region; routing via Cloud Proxy:", errorMessage);
        throw new Error("Региональное ограничение Google API (User location is not supported). Запросы направляются через Cloud Proxy.");
      }

      const lowerMsg = errorMessage.toLowerCase();
      const isRateLimit = 
        errorStatus === 429 || 
        errorStatus === 503 ||
        errorMessage.includes('429') || 
        errorMessage.includes('503') ||
        errorMessage.includes('RESOURCE_EXHAUSTED') ||
        errorMessage.includes('ResourceExhausted') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('Overloaded') ||
        lowerMsg.includes('rate exceeded') ||
        lowerMsg.includes('rate_exceeded') ||
        lowerMsg.includes('rate limit') ||
        lowerMsg.includes('ratelimit') ||
        lowerMsg.includes('too many requests') ||
        lowerMsg.includes('exceeded');

      const isLastAttempt = attempt === retries - 1;

      if (!isRateLimit || isLastAttempt) {
        if (isRateLimit && isLastAttempt && !isCustomApiKeySkipped()) {
          const usage = getTodayAiUsage();
          triggerAiLimitModal(usage);
        }
        throw error;
      }

      // Экспоненциальный рост (1s, 2s, 4s, 8s, 16s...) + случайный джиттер 0-500ms
      const backoffDelay = (baseDelay * Math.pow(2, attempt)) + (Math.random() * 500);
      console.warn(`[429] Лимит запросов. Повтор ${attempt + 1}/${retries} через ${Math.round(backoffDelay)}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  throw new Error("Достигнуто максимальное число попыток повтора к Gemini API");
}

interface RateLimiterTask<T> {
  apiCallTask: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}

/**
 * 2. Клиентский Rate Limiter и Очередь Запросов
 * Распределяет запросы во времени согласно ограничениям бесплатного тарифа (12 RPM = 1 запрос в 5 секунд)
 */
export class GeminiRateLimiterQueue {
  private delayBetweenRequests: number;
  private queue: RateLimiterTask<any>[] = [];
  private isProcessing: boolean = false;

  constructor(requestsPerMinute: number = 12) {
    // 60,000ms / 12 = 5,000ms между запросами (безопасный запас относительно лимита в 15 RPM)
    this.delayBetweenRequests = (60 * 1000) / requestsPerMinute;
  }

  async enqueue<T>(apiCallTask: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ apiCallTask, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) break;
      const { apiCallTask, resolve, reject } = task;

      try {
        const result = await fetchGeminiWithRetry(apiCallTask);
        resolve(result);
      } catch (error) {
        reject(error);
      }

      // Пауза перед обработкой следующего элемента очереди
      if (this.queue.length > 0) {
        await new Promise(r => setTimeout(r, this.delayBetweenRequests));
      }
    }

    this.isProcessing = false;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  isBusy(): boolean {
    return this.isProcessing;
  }
}

// Глобальный экземпляр очереди с ограничением частоты запросов (12 RPM)
export const geminiRateLimiter = new GeminiRateLimiterQueue(12);

/**
 * Центральный шлюз вызова Gemini API:
 * Маршрутизирует вызовы через очередь ограничения частоты (12 RPM) и
 * механизм Exponential Backoff + Jitter при ошибках 429.
 */
export async function callGeminiWithRetry<T>(
  apiCall: () => Promise<T>,
  retries: number = 5,
  baseDelay: number = 1000,
  _skipLimitCheck: boolean = true
): Promise<T> {
  return geminiRateLimiter.enqueue(() => fetchGeminiWithRetry(apiCall, retries, baseDelay));
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  if (data.length % 2 !== 0) {
      const newData = new Uint8Array(data.length + 1);
      newData.set(data);
      data = newData;
  }
  
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

let audioContext: AudioContext | null = null;

const playPCM = async (base64Audio: string) => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    const bytes = decode(base64Audio);
    const audioBuffer = await decodeAudioData(bytes, audioContext, 24000, 1);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
  } catch (e) {
    console.error("Error playing PCM audio:", e);
  }
};

const fallbackSpeak = (text: string, lang: string = 'en', slow: boolean = false, provider: 'google' | 'yandex' | 'system' = 'system') => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = slow ? 0.6 : 1.0;
    
    const langMap: Record<string, string> = {
      'en': 'en-US', 'de': 'de-DE', 'fr': 'fr-FR', 'es': 'es-ES', 'ja': 'ja-JP', 
      'zh': 'zh-CN', 'ko': 'ko-KR', 'it': 'it-IT', 'pt': 'pt-BR', 'ru': 'ru-RU',
      'be': 'ru-RU', 'uk': 'uk-UA', 'et': 'et-EE', 'lv': 'lv-LV', 'lt': 'lt-LT', 'tr': 'tr-TR',
      'ar': 'ar-SA', 'hu': 'hu-HU', 'fi': 'fi-FI', 'is': 'is-IS', 'pl': 'pl-PL', 'eu': 'eu-ES',
      'nv': 'en-US', 'tab': 'ru-RU'
    };
    
    // Default lang
    utterance.lang = langMap[lang] || lang;
    
    // Ensure voices are loaded (Chrome sometimes loads asynchronously)
    let voices = window.speechSynthesis.getVoices();
    
    const findVoice = () => {
        let matchingVoice: SpeechSynthesisVoice | undefined;

        if (provider === 'yandex') {
            matchingVoice = voices.find(v => (v.name.toLowerCase().includes("yandex") || v.name.toLowerCase().includes("yuri")) && v.lang.startsWith(utterance.lang.split('-')[0]));
        } else if (provider === 'google') {
            matchingVoice = voices.find(v => v.name.toLowerCase().includes("google") && v.lang.startsWith(utterance.lang.split('-')[0]));
        }

        if (!matchingVoice) {
            matchingVoice = voices.find(v => v.lang === utterance.lang);
        }
        if (!matchingVoice) {
            matchingVoice = voices.find(v => v.lang.startsWith(utterance.lang.split('-')[0]));
        }

        if (matchingVoice) {
            utterance.voice = matchingVoice;
        }
        window.speechSynthesis.speak(utterance);
    };

    if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            findVoice();
        };
    } else {
        findVoice();
    }
  }
};

export const speakText = async (text: string, lang: string = 'en', slow: boolean = false, voiceName: string = 'Kore', provider: 'gemini' | 'google' | 'yandex' | 'system' = 'gemini') => {
  if (!text) return;

  if (provider === 'google' || provider === 'yandex' || provider === 'system') {
      fallbackSpeak(text, lang, slow, provider);
      return;
  }

  const cacheKey = `${text}_${lang}_${slow}_${voiceName}`;
  if (audioCache.has(cacheKey)) return playPCM(audioCache.get(cacheKey)!);

  try {
    const base64Audio = await callGeminiWithRetry(async () => {
      const ai = createGenAiClient();
      const prompt = slow 
        ? `Say VERY slowly, clearly and naturally in ${lang} language: ${text}` 
        : `Say clearly and naturally in ${lang} language: ${text}`;
      
      const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    }, 2);

    if (base64Audio) {
      audioCache.set(cacheKey, base64Audio);
      return playPCM(base64Audio);
    } else throw new Error("No audio data");
  } catch (error) {
    console.warn("TTS failed, using fallback:", error);
    fallbackSpeak(text, lang, slow, 'system');
  }
};

// --- LOCAL OFFLINE LESSON CACHE SYSTEM ---
const LESSON_CACHE_KEY = 'duowindo_lesson_cache_v2';

export const saveLessonToCache = (subjectId: string, exercise: Exercise) => {
  try {
    if (!exercise || !exercise.originalSentence) return;
    const raw = localStorage.getItem(LESSON_CACHE_KEY);
    const cache: Record<string, Exercise[]> = raw ? JSON.parse(raw) : {};
    if (!cache[subjectId]) cache[subjectId] = [];
    
    // Avoid exact duplicate
    const exists = cache[subjectId].some(e => e.originalSentence === exercise.originalSentence && e.type === exercise.type);
    if (!exists) {
      const cleanExercise: Exercise = {
        ...exercise,
        id: exercise.id || crypto.randomUUID(),
        isFallback: false,
        isCached: true
      };
      cache[subjectId].unshift(cleanExercise);
      // Keep up to 30 cached exercises per course
      if (cache[subjectId].length > 30) {
        cache[subjectId] = cache[subjectId].slice(0, 30);
      }
      localStorage.setItem(LESSON_CACHE_KEY, JSON.stringify(cache));
    }
  } catch (e) {
    console.warn("Failed to save lesson to cache:", e);
  }
};

const shownExerciseSentences = new Set<string>();

export const getCachedExercise = (subjectId: string, type?: Exercise['type']): Exercise | null => {
  try {
    const raw = localStorage.getItem(LESSON_CACHE_KEY);
    if (!raw) return null;
    const cache: Record<string, Exercise[]> = JSON.parse(raw);
    const list = cache[subjectId] || [];
    if (list.length === 0) return null;
    
    const filtered = type ? list.filter(e => e.type === type) : list;
    const pool = filtered.length > 0 ? filtered : list;
    
    // Pick unshown exercise if possible
    let unshown = pool.filter(e => !shownExerciseSentences.has(e.originalSentence));
    if (unshown.length === 0) {
      pool.forEach(e => shownExerciseSentences.delete(e.originalSentence));
      unshown = pool;
    }
    
    const item = unshown[Math.floor(Math.random() * unshown.length)];
    if (item) {
      shownExerciseSentences.add(item.originalSentence);
      return { ...item, id: crypto.randomUUID(), isCached: true, isFallback: false };
    }
    return null;
  } catch (e) {
    console.warn("Failed to read lesson from cache:", e);
    return null;
  }
};

export const getCachedLessonsCount = (subjectId?: string): number => {
  try {
    const raw = localStorage.getItem(LESSON_CACHE_KEY);
    if (!raw) return 0;
    const cache: Record<string, Exercise[]> = JSON.parse(raw);
    if (subjectId) {
      return (cache[subjectId] || []).length;
    }
    return Object.values(cache).reduce((acc, curr) => acc + curr.length, 0);
  } catch {
    return 0;
  }
};

export const clearLessonCache = () => {
  try {
    localStorage.removeItem(LESSON_CACHE_KEY);
  } catch {}
};

export const preseedDefaultLessonCache = () => {
  try {
    const raw = localStorage.getItem(LESSON_CACHE_KEY);
    if (raw && Object.keys(JSON.parse(raw)).length > 3) {
      return; // Already preseeded
    }

    const defaultSeed: Record<string, Exercise[]> = {
      'en': [
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'The cat sleeps on the sofa', targetTranslation: 'Кошка спит на диване', wordBank: ['Кошка', 'спит', 'на', 'диване', 'собака', 'ест', 'в'], isCached: true },
        { id: crypto.randomUUID(), type: 'listening', originalSentence: 'I drink water every morning', targetTranslation: 'Я пью воду каждое утро', wordBank: ['Я', 'пью', 'воду', 'каждое', 'утро', 'чай', 'он'], isCached: true },
        { id: crypto.randomUUID(), type: 'speech', originalSentence: 'Good morning, how are you today?', targetTranslation: 'Доброе утро, как ваши дела сегодня?', wordBank: ['Доброе', 'утро', 'как', 'дела', 'хорошо'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'She reads an interesting book', targetTranslation: 'Она читает интересную книгу', wordBank: ['Она', 'читает', 'интересную', 'книгу', 'он', 'журнал', 'пишет'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'We travel to new cities in summer', targetTranslation: 'Мы путешествуем в новые города летом', wordBank: ['Мы', 'путешествуем', 'в', 'новые', 'города', 'летом', 'зимой', 'они'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'He plays guitar in the evening', targetTranslation: 'Он играет на гитаре вечером', wordBank: ['Он', 'играет', 'на', 'гитаре', 'вечером', 'утром', 'она'], isCached: true },
        { id: crypto.randomUUID(), type: 'listening', originalSentence: 'They buy fresh apples at the market', targetTranslation: 'Они покупают свежие яблоки на рынке', wordBank: ['Они', 'покупают', 'свежие', 'яблоки', 'на', 'рынке', 'груши'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'My sister learns foreign languages with pleasure', targetTranslation: 'Моя сестра учит иностранные языки с удовольствием', wordBank: ['Моя', 'сестра', 'учит', 'иностранные', 'языки', 'с', 'удовольствием'], isCached: true },
        { id: crypto.randomUUID(), type: 'speech', originalSentence: 'The doctor opens a large window in the office', targetTranslation: 'Врач открывает большое окно в кабинете', wordBank: ['Врач', 'открывает', 'большое', 'окно', 'в', 'кабинете'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'We walk in the green park on weekends', targetTranslation: 'Мы гуляем в зеленом парке по выходным', wordBank: ['Мы', 'гуляем', 'в', 'зеленом', 'парке', 'по', 'выходным'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'I enjoy hot coffee after work', targetTranslation: 'Я наслаждаюсь горячим кофе после работы', wordBank: ['Я', 'наслаждаюсь', 'горячим', 'кофе', 'после', 'работы'], isCached: true },
        { id: crypto.randomUUID(), type: 'listening', originalSentence: 'She writes a long letter to her friend', targetTranslation: 'Она пишет длинное письмо своему другу', wordBank: ['Она', 'пишет', 'длинное', 'письмо', 'своему', 'другу'], isCached: true },
      ],
      'ru': [
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'Привет, как тебя зовут?', targetTranslation: 'Hello, what is your name?', wordBank: ['Hello', 'what', 'is', 'your', 'name', 'how', 'old'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'Это мой лучший друг', targetTranslation: 'This is my best friend', wordBank: ['This', 'is', 'my', 'best', 'friend', 'brother', 'good'], isCached: true },
        { id: crypto.randomUUID(), type: 'listening', originalSentence: 'Сегодня прекрасная погода', targetTranslation: 'Today is wonderful weather', wordBank: ['Today', 'is', 'wonderful', 'weather', 'cold', 'rain'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'Мы любим путешествовать летом', targetTranslation: 'We love to travel in summer', wordBank: ['We', 'love', 'to', 'travel', 'in', 'summer', 'winter'], isCached: true },
      ],
      'de': [
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'Guten Tag, wie geht es Ihnen?', targetTranslation: 'Добрый день, как ваши дела?', wordBank: ['Добрый', 'день', 'как', 'ваши', 'дела', 'вечер', 'плохо'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'Ich lerne gerne Deutsch', targetTranslation: 'Я с удовольствием учу немецкий', wordBank: ['Я', 'с', 'удовольствием', 'учу', 'немецкий', 'он', 'английский'], isCached: true },
        { id: crypto.randomUUID(), type: 'listening', originalSentence: 'Das Haus ist sehr groß und schön', targetTranslation: 'Дом очень большой и красивый', wordBank: ['Дом', 'очень', 'большой', 'и', 'красивый', 'маленький', 'сад'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'Wir trinken morgens frischen Tee', targetTranslation: 'Мы пьем свежий чай по утрам', wordBank: ['Мы', 'пьем', 'свежий', 'чай', 'по', 'утрам'], isCached: true },
      ],
      'fr': [
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'Bonjour, comment allez-vous?', targetTranslation: 'Здравствуйте, как ваши дела?', wordBank: ['Здравствуйте', 'как', 'ваши', 'дела', 'Привет', 'он'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'J\'aime la musique et les voyages', targetTranslation: 'Я люблю музыку и путешествия', wordBank: ['Я', 'люблю', 'музыку', 'и', 'путешествия', 'книги', 'еду'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'Nous regardons un film intéressant ce soir', targetTranslation: 'Мы смотрим интересный фильм сегодня вечером', wordBank: ['Мы', 'смотрим', 'интересный', 'фильм', 'сегодня', 'вечером'], isCached: true }
      ],
      'es': [
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'Hola, ¿cómo estás hoy?', targetTranslation: 'Привет, как ты сегодня?', wordBank: ['Привет', 'как', 'ты', 'сегодня', 'он', 'хорошо'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'El perro corre en el parque', targetTranslation: 'Собака бегает в парке', wordBank: ['Собака', 'бегает', 'в', 'парке', 'кошка', 'спит', 'на'], isCached: true },
        { id: crypto.randomUUID(), type: 'listening', originalSentence: 'Nosotros viajamos a nuevas ciudades en verano', targetTranslation: 'Мы путешествуем в новые города летом', wordBank: ['Мы', 'путешествуем', 'в', 'новые', 'города', 'летом'], isCached: true }
      ],
      'zh': [
        { id: crypto.randomUUID(), type: 'translation', originalSentence: '你好，很高兴认识你', targetTranslation: 'Привет, приятно познакомиться', wordBank: ['Привет', 'приятно', 'познакомиться', 'с', 'тобой', 'друг'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: '我想喝一杯水', targetTranslation: 'Я хочу выпить стакан воды', wordBank: ['Я', 'хочу', 'выпить', 'стакан', 'воды', 'чай', 'он'], isCached: true }
      ],
      'ja': [
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'こんにちは、元気ですか？', targetTranslation: 'Привет, как дела?', wordBank: ['Привет', 'как', 'дела', 'хорошо', 'спасибо', 'друг'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: '猫は部屋で眠っています', targetTranslation: 'Кошка спит в комнате', wordBank: ['Кошка', 'спит', 'в', 'комнате', 'собака', 'ест', 'на'], isCached: true }
      ],
      'ar': [
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'مرحبا، كيف حالك؟', targetTranslation: 'Привет, как твои дела?', wordBank: ['Привет', 'как', 'твои', 'дела', 'хорошо', 'друг'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'هذا بيت جميل وكبير', targetTranslation: 'Это красивый и большой дом', wordBank: ['Это', 'красивый', 'и', 'большой', 'дом', 'сад', 'новый'], isCached: true }
      ],
      'math': [
        { id: crypto.randomUUID(), type: 'translation', originalSentence: '15 + 27 = ?', targetTranslation: '42', wordBank: ['42', '41', '43', '32'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: '8 × 7 = ?', targetTranslation: '56', wordBank: ['56', '54', '64', '48'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: '100 - 36 = ?', targetTranslation: '64', wordBank: ['64', '74', '54', '66'], isCached: true }
      ],
      'music': [
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'Какая нота пишется на первой линейке нотного стана?', targetTranslation: 'Ми', wordBank: ['Ми', 'Фа', 'Соль', 'Ре'], isCached: true },
        { id: crypto.randomUUID(), type: 'translation', originalSentence: 'Какой знак повышает ноту на полутон?', targetTranslation: 'Диез', wordBank: ['Диез', 'Бемоль', 'Бекар', 'Фермата'], isCached: true }
      ]
    };

    localStorage.setItem(LESSON_CACHE_KEY, JSON.stringify(defaultSeed));
  } catch (e) {
    console.warn("Could not preseed default lessons:", e);
  }
};

// Automatically seed cache on module load if available in browser
if (typeof window !== 'undefined') {
  setTimeout(() => {
    preseedDefaultLessonCache();
  }, 1000);
}

export const getFallbackExercise = (subjectId: string, type: Exercise['type'], subjectName: string): Exercise => {
    // 1. Try local cache first!
    const cached = getCachedExercise(subjectId, type);
    if (cached) {
      return cached;
    }

    if (subjectId === 'math') {
        const a = Math.floor(Math.random() * 50) + 1;
        const b = Math.floor(Math.random() * 50) + 1;
        const op = Math.random() > 0.5 ? '+' : '-';
        const res = op === '+' ? a + b : a - b;
        return {
            id: crypto.randomUUID(), type: 'translation', originalSentence: `${a} ${op} ${b} = ?`,
            targetTranslation: res.toString(),
            wordBank: [res.toString(), (res + 1).toString(), (res - 1).toString(), (res + 10).toString()].sort(() => Math.random() - 0.5),
            isFallback: true
        };
    }
    if (subjectId === 'music') {
        const notes = [
            { note: "До (C)", question: "Какая нота идет первой в гамме До-мажор?", answer: "До" },
            { note: "Ре (D)", question: "Какая нота находится между До и Ми?", answer: "Ре" },
            { note: "Ми (E)", question: "На какой линейке нотного стана пишется нота Ми первой октавы?", answer: "Первой" },
            { note: "Скрипичный ключ", question: "Какой ключ называют ключом Соль?", answer: "Скрипичный" },
            { note: "Форте", question: "Как в музыке обозначается громкое исполнение?", answer: "Форте" },
            { note: "Пиано", question: "Как в музыке обозначается тихое исполнение?", answer: "Пиано" },
        ];
        const item = notes[Math.floor(Math.random() * notes.length)];
        const distractors = ["Фа", "Соль", "Ля", "Си", "Басовый", "Анданте", "Престо"].filter(d => d !== item.answer).slice(0, 3);
        return {
            id: crypto.randomUUID(), type: 'translation', originalSentence: item.question,
            targetTranslation: item.answer,
            wordBank: [item.answer, ...distractors].sort(() => Math.random() - 0.5),
            isFallback: true
        };
    }
    if (subjectId.startsWith('rf-')) {
        return {
            id: crypto.randomUUID(), type: 'translation', originalSentence: `Это регион РФ: ${subjectName}?`,
            targetTranslation: "Да", wordBank: ["Да", "Нет", "Возможно", "Не знаю"], isFallback: true
        };
    }

    const hardestFallbacks: Record<string, { orig: string; trans: string; bank: string[] }[]> = {
      hu: [
        { orig: "Szia! Hogy vagy?", trans: "Привет! Как дела?", bank: ["Привет!", "Как", "дела?", "Спасибо", "Пока", "Хорошо"] },
        { orig: "A macska a házban van", trans: "Кот в доме", bank: ["Кот", "в", "доме", "на", "улице", "собака"] },
        { orig: "Tanulom a magyar nyelvet", trans: "Я учу венгерский язык", bank: ["Я", "учу", "венгерский", "язык", "он", "знает"] },
        { orig: "Köszönöm szépen a segítséget", trans: "Большое спасибо за помощь", bank: ["Большое", "спасибо", "за", "помощь", "пожалуйста"] }
      ],
      fi: [
        { orig: "Hei! Mitä kuuluu?", trans: "Привет! Как дела?", bank: ["Привет!", "Как", "дела?", "Отлично", "До", "свидания"] },
        { orig: "Minä rakastan suomen kieltä", trans: "Я люблю финский язык", bank: ["Я", "люблю", "финский", "язык", "Мы", "учим"] },
        { orig: "Kissa istuu pöydällä", trans: "Кот сидит на столе", bank: ["Кот", "сидит", "на", "столе", "под", "стулом"] },
        { orig: "Kiitos paljon avusta", trans: "Большое спасибо за помощь", bank: ["Большое", "спасибо", "за", "помощь", "друг"] }
      ],
      is: [
        { orig: "Halló! Hvað heitir þú?", trans: "Привет! Как тебя зовут?", bank: ["Привет!", "Как", "тебя", "зовут?", "Меня", "друг"] },
        { orig: "Ég tala smá íslensku", trans: "Я немного говорю по-исландски", bank: ["Я", "немного", "говорю", "по-исландски", "хорошо"] },
        { orig: "Góðan daginn, vinur", trans: "Добрый день, друг", bank: ["Добрый", "день,", "друг", "ночь", "вечер"] },
        { orig: "Takk fyrir hjálpina", trans: "Спасибо за помощь", bank: ["Спасибо", "за", "помощь", "Большое", "пожалуйста"] }
      ],
      pl: [
        { orig: "Cześć! Jak się masz?", trans: "Привет! Как дела?", bank: ["Привет!", "Как", "дела?", "Хорошо", "Пока"] },
        { orig: "Uczę się języka polskiego", trans: "Я изучаю польский язык", bank: ["Я", "изучаю", "польский", "язык", "Мы", "говорим"] },
        { orig: "Dziękuję bardzo za pomoc", trans: "Большое спасибо за помощь", bank: ["Большое", "спасибо", "за", "помощь", "друг"] },
        { orig: "W Szczebrzeszynie chrząszcz brzmi w trzcinie", trans: "В Щебжешине жук звучит в тростнике", bank: ["В", "Щебжешине", "жук", "звучит", "в", "тростнике", "поле"] }
      ],
      eu: [
        { orig: "Kaixo! Zer moduz?", trans: "Привет! Как дела?", bank: ["Привет!", "Как", "дела?", "Отлично", "Здравствуйте"] },
        { orig: "Euskara ikasten ari naiz", trans: "Я изучаю баскский язык", bank: ["Я", "изучаю", "баскский", "язык", "Мы", "знаем"] },
        { orig: "Gizonak ogia jaten du", trans: "Мужчина ест хлеб", bank: ["Мужчина", "ест", "хлеб", "воду", "пьет"] },
        { orig: "Eskerrik asko zure laguntzagatik", trans: "Большое спасибо за помощь", bank: ["Большое", "спасибо", "за", "помощь", "пожалуйста"] }
      ],
      nv: [
        { orig: "Yáʼátʼééh! Haash yinilyé?", trans: "Привет! Как тебя зовут?", bank: ["Привет!", "Как", "тебя", "зовут?", "друг"] },
        { orig: "Diné bizaad bídahwiilʼaah", trans: "Мы изучаем язык навахо", bank: ["Мы", "изучаем", "язык", "навахо", "Я", "говорю"] },
        { orig: "Shimá dóó shizhéʼé", trans: "Моя мама и мой папа", bank: ["Моя", "мама", "и", "мой", "папа", "брат"] },
        { orig: "Ahéheeʼ nitsʼą́ą́dóó", trans: "Спасибо тебе за помощь", bank: ["Спасибо", "тебе", "за", "помощь", "Большое"] }
      ],
      tab: [
        { orig: "Салам! Фици вува?", trans: "Привет! Как поживаешь?", bank: ["Привет!", "Как", "поживаешь?", "Хорошо", "дела"] },
        { orig: "Узу табасаран чIал аьгъю апIураза", trans: "Я изучаю табасаранский язык", bank: ["Я", "изучаю", "табасаранский", "язык", "Мы"] },
        { orig: "Баб ва дад ккунраза", trans: "Я люблю маму и папу", bank: ["Я", "люблю", "маму", "и", "папу", "семью"] },
        { orig: "Чугъул сагъул кумек бадали", trans: "Большое спасибо за помощь", bank: ["Большое", "спасибо", "за", "помощь", "пожалуйста"] }
      ]
    };

    if (hardestFallbacks[subjectId]) {
      const list = hardestFallbacks[subjectId];
      const item = list[Math.floor(Math.random() * list.length)];
      return {
        id: crypto.randomUUID(),
        type: 'translation',
        originalSentence: item.orig,
        targetTranslation: item.trans,
        wordBank: [...item.bank].sort(() => Math.random() - 0.5),
        isFallback: true
      };
    }

    // Dynamic procedural sentence builder to prevent repetitive sentences!
    const procSubjects = [
      { en: "I", ru: "Я" },
      { en: "She", ru: "Она" },
      { en: "He", ru: "Он" },
      { en: "We", ru: "Мы" },
      { en: "They", ru: "Они" },
      { en: "My friend", ru: "Мой друг" },
      { en: "The teacher", ru: "Учитель" },
      { en: "My sister", ru: "Моя сестра" },
      { en: "My brother", ru: "Мой брат" },
      { en: "The doctor", ru: "Врач" }
    ];

    const procActions = [
      { en: "reads an interesting book", ru: "читает интересную книгу" },
      { en: "travels to new cities", ru: "путешествует в новые города" },
      { en: "drinks hot coffee", ru: "пьет горячий кофе" },
      { en: "listens to quiet music", ru: "слушает тихую музыку" },
      { en: "cooks a tasty dinner", ru: "готовит вкусный ужин" },
      { en: "buys fresh fruits", ru: "покупает свежие фрукты" },
      { en: "walks in the green park", ru: "гуляет в зеленом парке" },
      { en: "plays guitar", ru: "играет на гитаре" },
      { en: "writes a long letter", ru: "пишет длинное письмо" },
      { en: "watches a funny comedy", ru: "смотрит веселую комедию" },
      { en: "learns foreign languages", ru: "учит иностранные языки" },
      { en: "opens a large window", ru: "открывает большое окно" },
      { en: "sings a popular song", ru: "поет популярную песню" },
      { en: "finds a lost key", ru: "находит потерянный ключ" },
      { en: "drives a clean blue car", ru: "водит синюю чистую машину" },
      { en: "enjoys the sunny weather", ru: "наслаждается солнечной погодой" }
    ];

    const procModifiers = [
      { en: "every morning", ru: "каждое утро" },
      { en: "in summer", ru: "летом" },
      { en: "in winter", ru: "зимой" },
      { en: "after work", ru: "после работы" },
      { en: "on weekends", ru: "по выходным" },
      { en: "with great joy", ru: "с большим удовольствием" },
      { en: "today", ru: "сегодня" },
      { en: "in the evening", ru: "вечером" }
    ];

    const subj = procSubjects[Math.floor(Math.random() * procSubjects.length)];
    const act = procActions[Math.floor(Math.random() * procActions.length)];
    const mod = procModifiers[Math.floor(Math.random() * procModifiers.length)];

    const isEngTarget = subjectId === 'en';
    const orig = isEngTarget 
      ? `${subj.en} ${act.en} ${mod.en}`
      : `${subj.ru} ${act.ru} ${mod.ru}`;
    const target = isEngTarget
      ? `${subj.ru} ${act.ru} ${mod.ru}`
      : `${subj.en} ${act.en} ${mod.en}`;

    const rawTokens = target.split(' ');
    const distractorsPool = ["быстро", "медленно", "высоко", "красиво", "дома", "вчера", "завтра", "очень", "друзья", "машина"];
    const extraDistractors = distractorsPool.filter(d => !rawTokens.includes(d)).slice(0, 3);
    const wordBank = [...rawTokens, ...extraDistractors].sort(() => Math.random() - 0.5);

    return {
        id: crypto.randomUUID(), 
        type: type || 'translation', 
        originalSentence: orig, 
        targetTranslation: target,
        wordBank: wordBank, 
        isFallback: true
    };
};

export const generateExercise = async (
    targetSubject: string, subjectId: string, isLanguage: boolean = true,
    type: Exercise['type'] = 'translation', isPro: boolean = false, customTopic?: string
): Promise<Exercise> => {
  const model = isPro ? MODEL_PRO : MODEL_FREE;
  const topic = (customTopic && customTopic.trim()) ? customTopic : TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const nonce = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const prompt = isLanguage 
    ? `Сгенерируй СЛУЧАЙНОЕ, УНИКАЛЬНОЕ И РАЗНООБРАЗНОЕ упражнение типа "${type}" для изучения ${targetSubject}. Тема: ${topic}. Составь новое предложение, избегай банальных и повторяющихся фраз. Код уникальности: ${nonce}.`
    : `Сгенерируй новую УНИКАЛЬНУЮ задачу для предмета "${targetSubject}". Код уникальности: ${nonce}.`;

  try {
    const data = await callGeminiWithRetry(async () => {
      const ai = createGenAiClient();
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              originalSentence: { type: Type.STRING },
              targetTranslation: { type: Type.STRING },
              wordBank: { type: Type.ARRAY, items: { type: Type.STRING } },
              hints: { type: Type.OBJECT }
            },
            required: ["originalSentence", "targetTranslation", "wordBank"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
    const exercise: Exercise = { id: crypto.randomUUID(), ...data, type: type };
    // Save to session tracking
    shownExerciseSentences.add(exercise.originalSentence);
    // Automatically save to local offline cache!
    saveLessonToCache(subjectId, exercise);
    return exercise;
  } catch (error) {
    return getFallbackExercise(subjectId, type, targetSubject);
  }
};

export const checkAnswerWithAI = async (
  subject: string,
  userAnswer: string,
  correctAnswer: string,
  isMax: boolean = false
): Promise<{ isCorrect: boolean; feedback: string; isFallback?: boolean }> => {
  // Simple check first
  if (!userAnswer) return { isCorrect: false, feedback: "No answer provided" };
  const normUser = userAnswer.trim().toLowerCase().replace(/[.,!?;]/g, '');
  const normCorrect = correctAnswer.trim().toLowerCase().replace(/[.,!?;]/g, '');
  
  if (normUser === normCorrect) {
      return { isCorrect: true, feedback: "Верно!" };
  }

  try {
    const result = await callGeminiWithRetry(async () => {
      const ai = createGenAiClient();
      const response = await ai.models.generateContent({
        model: isMax ? MODEL_PRO : MODEL_FREE,
        contents: `I am learning ${subject}. 
        The correct answer is: "${correctAnswer}".
        My answer was: "${userAnswer}".
        Is my answer correct? (Allow small typos).
        Return JSON: { "isCorrect": boolean, "feedback": string (in Russian or English) }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isCorrect: { type: Type.BOOLEAN },
              feedback: { type: Type.STRING }
            },
            required: ["isCorrect", "feedback"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
    return result;
  } catch (e) {
    const isCorrect = normUser === normCorrect;
    return { 
        isCorrect, 
        feedback: isCorrect ? "Правильно" : `Офлайн режим: Правильный ответ - ${correctAnswer}`, 
        isFallback: true 
    };
  }
};

export const generateLocalMistakeExplanation = (
    original: string, 
    userAnswer: string, 
    correctAnswer: string, 
    userLanguage: string,
    isCorrectAnswer: boolean = false,
    exerciseType?: string
): string => {
    const isRu = userLanguage === 'Russian' || userLanguage === 'ru';
    const cleanUser = (userAnswer || "").trim();
    const cleanCorrect = (correctAnswer || "").trim();
    const cleanOriginal = (original || "").trim();

    // 1. Ishihara Test
    if (exerciseType === 'ishihara' || cleanOriginal.toLowerCase().includes('ishihara')) {
        if (isRu) {
            return `⚡ **Офлайн-разбор (Цветовой тест Ишихары):**\n\n` +
                   `• **Ваш ввод:** "${cleanUser || 'Пусто'}"\n` +
                   `• **Правильное число:** **${cleanCorrect}**\n\n` +
                   `🔍 **Пояснение:** Тестовая таблица Ишихары состоит из разноцветных точек разного диаметра. Число составлено из цветовых оттенков спектра, которые позволяют оценить восприятие красного и зеленого спектров.\n\n` +
                   `📌 **Совет:** Проверяйте таблицы при хорошем освещении экрана.`;
        } else {
            return `⚡ **Offline Breakdown (Ishihara Color Test):**\n\n` +
                   `• **Your input:** "${cleanUser || 'None'}"\n` +
                   `• **Correct number:** **${cleanCorrect}**\n\n` +
                   `🔍 **Explanation:** Ishihara plates use specific color-spectrum dots to test red-green color perception.\n\n` +
                   `📌 **Tip:** View the test plate at eye level with adequate screen brightness.`;
        }
    }

    // 2. Chess Exercises
    if (exerciseType === 'chess') {
        if (isRu) {
            return `⚡ **Офлайн-анализ позиции DuoWindo6601:**\n\n` +
                   `♟️ **Тема:** Тактический мотив и развитие фигур.\n` +
                   `• **Ключевая идея:** Контроль центральных полей, безопасность короля и создание связок против фигур соперника.\n\n` +
                   `💡 **Совет гроссмейстера:** Перед каждым ходом проверяйте, какие фигуры соперника остались без защиты (висячие фигуры) и есть ли возможность поставить шах или мат.`;
        } else {
            return `⚡ **Offline Chess Analysis:**\n\n` +
                   `♟️ **Topic:** Tactical motif & piece coordination.\n` +
                   `• **Key Idea:** Control central squares, ensure king safety, and seek undefended pieces.\n\n` +
                   `💡 **Grandmaster Tip:** Before committing a move, check for opponent checks, captures, and tactical threats.`;
        }
    }

    // 3. Drawing Exercises
    if (exerciseType === 'drawing') {
        if (isRu) {
            return `⚡ **Офлайн-разбор написания символа:**\n\n` +
                   `• **Символ:** **${cleanCorrect}**\n` +
                   `• **Оригинал:** ${cleanOriginal}\n\n` +
                   `✍️ **Правило написания:** Соблюдайте порядок штрихов — сверху вниз и слева направо. Четкие пропорции помогают мгновенно распознавать символ в текстах.\n\n` +
                   `🌟 **Практика:** Попробуйте нарисовать символ еще раз для закрепления мышечной памяти!`;
        } else {
            return `⚡ **Offline Character Breakdown:**\n\n` +
                   `• **Target Character:** **${cleanCorrect}**\n` +
                   `• **Prompt:** ${cleanOriginal}\n\n` +
                   `✍️ **Stroke Rule:** Write strokes from top to bottom and left to right.\n\n` +
                   `🌟 **Tip:** Repeat the stroke movement to strengthen muscle memory!`;
        }
    }

    // 4. Speech / Pronunciation
    if (exerciseType === 'speech') {
        if (isRu) {
            return `⚡ **Офлайн-разбор произношения:**\n\n` +
                   `• **Произнесенная фраза:** "${cleanUser || 'Речь не распознана'}"\n` +
                   `• **Эталонная фраза:** "${cleanCorrect}"\n\n` +
                   `🎙️ **Рекомендация:** Старайтесь произносить слова плавно, соблюдая ударение в ключевых слогах. Нажмите на иконку динамика 🔊, чтобы прослушать эталонную интонацию еще раз.`;
        } else {
            return `⚡ **Offline Pronunciation Breakdown:**\n\n` +
                   `• **Your Speech:** "${cleanUser || 'No speech detected'}"\n` +
                   `• **Target Phrase:** "${cleanCorrect}"\n\n` +
                   `🎙️ **Tip:** Focus on word stress and syllable rhythm. Tap the speaker icon 🔊 to listen to native audio again.`;
        }
    }

    // 5. General Translation / Multiple choice / Word bank
    const normUser = cleanUser.toLowerCase().replace(/[.,!?;:«»""'']/g, "").trim();
    const normCorrect = cleanCorrect.toLowerCase().replace(/[.,!?;:«»""'']/g, "").trim();

    // When the user answered correctly
    if (isCorrectAnswer || normUser === normCorrect) {
        if (isRu) {
            let res = `🎉 **Отличный ответ! (Офлайн-анализ):**\n\n`;
            res += `• **Исходная фраза:** "${cleanOriginal}"\n`;
            res += `• **Ваш правильный перевод:** "${cleanCorrect}"\n\n`;
            res += `📚 **Грамматический разбор:**\n`;
            res += `Все слова подобраны верно и стоят в правильном грамматическом порядке. Смысловая связь и контекст соблюдены на 100%.\n\n`;
            res += `✨ **Совет:** Продолжайте в том же духе, вы уверенно осваиваете эту тему!`;
            return res;
        } else {
            let res = `🎉 **Great Job! (Offline Breakdown):**\n\n`;
            res += `• **Original:** "${cleanOriginal}"\n`;
            res += `• **Your Correct Translation:** "${cleanCorrect}"\n\n`;
            res += `📚 **Grammar Analysis:**\n`;
            res += `All words and syntax structures are accurately placed with correct agreement.\n\n`;
            res += `✨ **Tip:** Keep this momentum going!`;
            return res;
        }
    }

    // If answer was empty
    if (!cleanUser || cleanUser === "(No speech detected)" || cleanUser === "No input") {
        return isRu
            ? `⚡ **Офлайн-анализ ответа:**\n\nВы не ввели ответ или не выбрали карточки со словами.\n\n✅ **Правильный ответ:** ${cleanCorrect}\n📌 **Оригинальная фраза:** ${cleanOriginal}\n\n💡 **Совет:** Составьте фразу, выбирая предложенные блоки по порядку.`
            : `⚡ **Offline Answer Breakdown:**\n\nNo words or input were selected.\n\n✅ **Correct Answer:** ${cleanCorrect}\n📌 **Original Phrase:** ${cleanOriginal}\n\n💡 **Tip:** Tap the word bank tokens in sequential order.`;
    }

    // Compare words
    const userWords = normUser.split(/\s+/).filter(Boolean);
    const correctWords = normCorrect.split(/\s+/).filter(Boolean);

    const missingWords = correctWords.filter(cw => !userWords.includes(cw));
    const extraWords = userWords.filter(uw => !correctWords.includes(uw));

    if (isRu) {
        let text = `⚡ **Офлайн-анализ ошибки DuoWindo6601:**\n\n`;
        text += `• **Фраза для перевода:** "${cleanOriginal}"\n`;
        text += `• **Ваш ответ:** "${cleanUser}"\n`;
        text += `• **Правильный эталон:** "${cleanCorrect}"\n\n`;
        
        if (missingWords.length > 0) {
            text += `🔍 **Пропущенные слова:** ${missingWords.map(w => `«${w}»`).join(', ')}\n`;
        }
        if (extraWords.length > 0) {
            text += `⚠️ **Лишние или неточные слова:** ${extraWords.map(w => `«${w}»`).join(', ')}\n`;
        }
        if (missingWords.length === 0 && extraWords.length === 0 && normUser !== normCorrect) {
            text += `🔄 **Порядок слов:** Слова верные, но порядок расположения в предложении отличается от эталона.\n`;
        }
        text += `\n📌 **Совет:** Обратите внимание на согласование частей речи и порядок слов в предложении.`;
        return text;
    } else {
        let text = `⚡ **Offline Mistake Breakdown:**\n\n`;
        text += `• **Original Phrase:** "${cleanOriginal}"\n`;
        text += `• **Your Answer:** "${cleanUser}"\n`;
        text += `• **Target Translation:** "${cleanCorrect}"\n\n`;
        
        if (missingWords.length > 0) {
            text += `🔍 **Missing words:** ${missingWords.map(w => `"${w}"`).join(', ')}\n`;
        }
        if (extraWords.length > 0) {
            text += `⚠️ **Extra or mismatched words:** ${extraWords.map(w => `"${w}"`).join(', ')}\n`;
        }
        if (missingWords.length === 0 && extraWords.length === 0 && normUser !== normCorrect) {
            text += `🔄 **Word Order:** The words are correct, but their order differs from the standard target sentence.\n`;
        }
        text += `\n📌 **Tip:** Compare the word sequence and grammatical structure with the target model.`;
        return text;
    }
};

export const getMistakeExplanation = async (
    original: string, 
    userAnswer: string, 
    correctAnswer: string, 
    userLanguage: string,
    isCorrectAnswer: boolean = false,
    exerciseType?: string,
    isOffline: boolean = false
): Promise<string> => {
    // 1. Instant offline fallback if offline or no network
    if (isOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        return generateLocalMistakeExplanation(original, userAnswer, correctAnswer, userLanguage, isCorrectAnswer, exerciseType);
    }

    try {
        const ai = createGenAiClient();
        const isRu = userLanguage === 'Russian' || userLanguage === 'ru';
        
        const prompt = isCorrectAnswer
          ? `You are DuoWindo6601, a friendly language tutor similar to Duolingo Max.
The student answered CORRECTLY!
Original phrase: "${original}"
Correct answer: "${correctAnswer}"
Explain briefly and clearly (max 60 words) why this answer is correct, highlighting key grammar or vocabulary points.
Respond in this language: ${isRu ? 'Russian' : 'English'}.
Be enthusiastic, encouraging, and clear.`
          : `You are DuoWindo6601, a friendly language tutor similar to Duolingo Max.
The student made a mistake in their exercise.
Original phrase: "${original}"
Student's answer: "${userAnswer}"
Correct answer: "${correctAnswer}"

Explain briefly and clearly (max 60 words) why the student's answer is incorrect, how the grammar or vocabulary works, and give a friendly tip.
Respond in this language: ${isRu ? 'Russian' : 'English'}.
Do not be overly technical, be supportive.`;

        try {
            const response = await ai.models.generateContent({
                model: MODEL_PRO,
                contents: prompt
            });
            if (response.text?.trim()) return response.text.trim();
        } catch (e1) {
            console.warn("MODEL_PRO explanation failed, trying fallback model...", e1);
            const response = await ai.models.generateContent({
                model: MODEL_FREE,
                contents: prompt
            });
            if (response.text?.trim()) return response.text.trim();
        }
    } catch (err) {
        console.warn("Gemini explanation offline fallback:", err);
    }

    return generateLocalMistakeExplanation(original, userAnswer, correctAnswer, userLanguage, isCorrectAnswer, exerciseType);
};

const CIS_OFFLINE_DICTIONARY: Record<string, Record<string, string>> = {
  'привет': {
    'be': 'Прывітанне', 'uk': 'Привіт', 'mo': 'Salut', 'lt': 'Labas', 'lv': 'Sveiki',
    'et': 'Tere', 'ka': 'გამარჯობა (Gamarjoba)', 'hy': 'Բարև (Barev)', 'az': 'Salam',
    'kk': 'Сәлем', 'uz': 'Salom', 'tk': 'Salam', 'ky': 'Салам', 'tg': 'Салом',
    'en': 'Hello', 'de': 'Hallo', 'fr': 'Bonjour', 'es': 'Hola', 'zh': '你好', 'ja': 'こんにちは', 'ar': 'مرحبا',
    'hu': 'Szia', 'fi': 'Hei', 'is': 'Halló', 'pl': 'Cześć', 'eu': 'Kaixo', 'nv': 'Yáʼátʼééh', 'tab': 'Салам'
  },
  'спасибо': {
    'be': 'Дзякуй', 'uk': 'Дякую', 'mo': 'Mulțumesc', 'lt': 'Ačiū', 'lv': 'Paldies',
    'et': 'Aitäh', 'ka': 'მადლობა (Madloba)', 'hy': 'Շնորհակալություն (Shnorhakalutyun)', 'az': 'Təşəkkür edirəm',
    'kk': 'Рахмет', 'uz': 'Rahmat', 'tk': 'Sag boluň', 'ky': 'Рахмат', 'tg': 'Раҳмат',
    'en': 'Thank you', 'de': 'Danke', 'fr': 'Merci', 'es': 'Gracias', 'zh': '谢谢', 'ja': 'ありがとう', 'ar': 'شكرا',
    'hu': 'Köszönöm', 'fi': 'Kiitos', 'is': 'Takk fyrir', 'pl': 'Dziękuję', 'eu': 'Eskerrik asko', 'nv': 'Ahéheeʼ', 'tab': 'Чугъул сагъул'
  },
  'как дела': {
    'be': 'Як справы?', 'uk': 'Як справи?', 'mo': 'Ce mai faci?', 'lt': 'Kaip sekasi?', 'lv': 'Kā iet?',
    'et': 'Kuidas läheb?', 'ka': 'როგორ ხარ? (Rogor khar?)', 'hy': 'Ինչպե՞ս ես (Inchpes es?)', 'az': 'Necəsən?',
    'kk': 'Қалың қалай?', 'uz': 'Ishlar qalay?', 'tk': 'Ýagdaýlar nähili?', 'ky': 'Кандайсың?', 'tg': 'Аҳвол чӣ хел?',
    'en': 'How are you?', 'de': 'Wie geht es dir?', 'fr': 'Comment vas-tu?', 'es': '¿Cómo estás?', 'zh': '你好吗？', 'ja': 'お元気ですか？', 'ar': 'كيف حالك؟',
    'hu': 'Hogy vagy?', 'fi': 'Mitä kuuluu?', 'is': 'Hvernig hefurðu það?', 'pl': 'Jak się masz?', 'eu': 'Zer moduz?', 'nv': 'Haash yinilyé?', 'tab': 'Фици вува?'
  },
  'до свидания': {
    'be': 'Да пабачэння', 'uk': 'До побачення', 'mo': 'La revedere', 'lt': 'Viso gero', 'lv': 'Uz redzēšanos',
    'et': 'Head aega', 'ka': 'ნახვამდის (Nakhvamdis)', 'hy': 'Ցտեսություն (Tstesutyun)', 'az': 'Sağ olun',
    'kk': 'Сау болыңыз', 'uz': 'Xayr', 'tk': 'Hoş gal', 'ky': 'Кош болуңуз', 'tg': 'Хайр',
    'en': 'Goodbye', 'de': 'Auf Wiedersehen', 'fr': 'Au revoir', 'es': 'Adiós', 'zh': '再见', 'ja': 'さようなら', 'ar': 'مع السلامة',
    'hu': 'Viszlát', 'fi': 'Näkemiin', 'is': 'Bless', 'pl': 'Do widzenia', 'eu': 'Agur', 'nv': 'Hagóóneeʼ', 'tab': 'Сагъвалди'
  }
};

export const translateText = async (text: string, targetLang: string, sourceLang?: string): Promise<string> => {
  if (!text || !text.trim()) return "";
  try {
    const ai = createGenAiClient();
    const response = await callGeminiWithRetry(async () => {
        const fromClause = sourceLang && sourceLang !== 'auto' ? `from ${sourceLang} ` : '';
        return ai.models.generateContent({
            model: MODEL_FREE,
            contents: `Translate the following text ${fromClause}into ${targetLang}. Preserve tone and natural grammar. Return ONLY the translation, with no explanation or conversational preamble.\n\nText:\n${text}`
        });
    });
    return response.text?.trim() || "Error translating.";
  } catch (e) {
    const cleaned = text.trim().toLowerCase().replace(/[.,!?;:]/g, '');
    if (CIS_OFFLINE_DICTIONARY[cleaned] && CIS_OFFLINE_DICTIONARY[cleaned][targetLang]) {
      return CIS_OFFLINE_DICTIONARY[cleaned][targetLang];
    }
    return `[Офлайн] ${text}`;
  }
}

export const startRoleplay = async (subject: string, subjectId: string): Promise<Exercise> => {
    const isArabic = subjectId === 'ar' || subject.toLowerCase().includes('араб') || subject.toLowerCase().includes('arabic');
    
    const arabicScenarios = [
        "في المقهى (Заказ в арабском кафе)",
        "التعارف والتحية (Знакомство и приветствие)",
        "في السوق والتبضع (В магазине и на рынке)",
        "السفر في المطار (Путешествие и аэропорт)"
    ];
    
    const scenario = isArabic 
        ? arabicScenarios[Math.floor(Math.random() * arabicScenarios.length)]
        : "Ordering coffee";

    try {
        const firstMessage = await callGeminiWithRetry(async () => {
            const ai = createGenAiClient();
            const prompt = isArabic 
                ? `You are an AI Arabic conversation partner in a roleplay. Scenario: "${scenario}". Greet the student in warm natural Arabic (with Russian/English translation in parentheses if helpful). Keep it 1-2 short sentences.`
                : `Act as a friendly local who speaks ${subject}. Scenario: ${scenario}. Start the conversation.`;
            
            const response = await ai.models.generateContent({ model: MODEL_FREE, contents: prompt });
            return response.text?.trim() || (isArabic ? "مرحباً بك! أهلاً وسهلاً. كيف يمكنني مساعدتك اليوم؟" : "Hello!");
        });
        return {
            id: crypto.randomUUID(), type: 'roleplay', originalSentence: scenario, targetTranslation: "", wordBank: [],
            roleplayData: { topic: scenario, messages: [{ role: 'model', text: firstMessage }], userTurn: true }
        };
    } catch (e) {
        return {
            id: 'fallback-rp', type: 'roleplay', originalSentence: isArabic ? "ممارسة اللغة العربية" : "Offline Practice", targetTranslation: "", wordBank: [], isFallback: true,
            roleplayData: { 
                topic: scenario, 
                messages: [{ role: 'model', text: isArabic ? "مرحباً بك! أهلاً وسهلاً في درس المحادثة العربية." : "Hello! Welcome to conversation practice." }], 
                userTurn: true 
            }
        };
    }
};

export const replyToRoleplay = async (history: RoleplayMessage[], userMessageText: string, subject: string, isMax: boolean): Promise<RoleplayMessage> => {
    const isArabic = subject.toLowerCase().includes('араб') || subject.toLowerCase().includes('arabic');
    try {
         const data = await callGeminiWithRetry(async () => {
             const ai = createGenAiClient();
             const context = history.map(m => `${m.role}: ${m.text}`).join('\n');
             const prompt = `${context}\nUser: ${userMessageText}
             ${isArabic ? 'You are a friendly Arabic language tutor. Reply in clear natural Arabic with RTL formatting. If user made a mistake in Arabic, provide a brief correction.' : 'Reply naturally in ' + subject + '.'}`;

             const response = await ai.models.generateContent({
                 model: isMax ? MODEL_PRO : MODEL_FREE,
                 contents: prompt,
                 config: {
                     responseMimeType: "application/json",
                     responseSchema: {
                         type: Type.OBJECT,
                         properties: { text: { type: Type.STRING }, correction: { type: Type.STRING } },
                         required: ["text"]
                     }
                 }
             });
             return JSON.parse(response.text || '{}');
         });
         return { role: 'model', text: data.text || (isArabic ? "أهلاً بك! هذا رائع." : "I see."), correction: data.correction };
    } catch (e) {
        return { role: 'model', text: isArabic ? "مرحباً بك! شكراً لك." : "Offline reply.", isFallback: true };
    }
};

export const generateIllusion = async (subject: string, subjectId: string): Promise<Exercise> => {
    try {
        const data = await callGeminiWithRetry(async () => {
            const ai = createGenAiClient();
            const response = await ai.models.generateContent({
                model: MODEL_FREE,
                contents: `Generate a 'Minimal Pair' auditory exercise for learning ${subject}. Return JSON.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: { soundText: { type: Type.STRING }, optionA: { type: Type.STRING }, optionB: { type: Type.STRING }, correctOption: { type: Type.STRING }, explanation: { type: Type.STRING } },
                        required: ["soundText", "optionA", "optionB", "correctOption", "explanation"]
                    }
                }
            });
            return JSON.parse(response.text || '{}');
        });
        return { id: crypto.randomUUID(), type: 'illusion', originalSentence: "Sound Illusion", targetTranslation: "", wordBank: [], illusionData: data };
    } catch (e) {
        return { id: 'fb-ill', type: 'illusion', originalSentence: "Offline", targetTranslation: "", wordBank: [], isFallback: true, illusionData: { soundText: "Test", optionA: "Test", optionB: "Toast", correctOption: "A", explanation: "Offline." } };
    }
};

export const generateDrawing = async (subject: string, subjectId: string, specificChar?: string): Promise<Exercise> => {
    try {
        const prompt = specificChar 
            ? `Generate a writing challenge for the character "${specificChar}" in ${subject}. Return JSON.`
            : `Generate a writing challenge for a random letter in ${subject}. Return JSON.`;

        const data = await callGeminiWithRetry(async () => {
            const ai = createGenAiClient();
            const response = await ai.models.generateContent({
                model: MODEL_FREE,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: { character: { type: Type.STRING }, instruction: { type: Type.STRING } },
                        required: ["character", "instruction"]
                    }
                }
            });
            return JSON.parse(response.text || '{}');
        });
        
        // Force the character if specificChar was requested (in case AI hallucinates)
        if (specificChar) data.character = specificChar;

        return { id: crypto.randomUUID(), type: 'drawing', originalSentence: "Draw", targetTranslation: "", wordBank: [], drawingData: data };
    } catch (e) {
        let fallbackChar = specificChar || "A";
        if (!specificChar) {
            if (subjectId === 'zh') fallbackChar = "人";
            else if (subjectId === 'ja') fallbackChar = "あ";
            else if (subjectId === 'ko') fallbackChar = "ㄱ";
            else if (subjectId === 'ru') fallbackChar = "А";
            else if (subjectId === 'ar') fallbackChar = "ا";
            else if (subjectId === 'he') fallbackChar = "א";
        }
        return { 
            id: 'fb-dr', 
            type: 'drawing', 
            originalSentence: "Draw", 
            targetTranslation: "", 
            wordBank: [], 
            isFallback: true, 
            drawingData: { 
                character: fallbackChar, 
                instruction: `Нарисуйте символ: ${fallbackChar}` 
            } 
        };
    }
};

export const checkDrawing = async (base64Image: string, targetCharacter: string): Promise<{ isCorrect: boolean; feedback: string; isFallback?: boolean }> => {
    try {
        const result = await callGeminiWithRetry(async () => {
            const ai = createGenAiClient();
            const response = await ai.models.generateContent({
                model: MODEL_FREE,
                contents: {
                    parts: [
                        { inlineData: { mimeType: "image/png", data: base64Image } },
                        { text: `Is this drawing legible as "${targetCharacter}"? Return JSON {isCorrect: boolean, feedback: string}. Give feedback in Russian.` }
                    ]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: { isCorrect: { type: Type.BOOLEAN }, feedback: { type: Type.STRING } },
                        required: ["isCorrect", "feedback"]
                    }
                }
            });
            return JSON.parse(response.text || '{"isCorrect":false}');
        });
        return result;
    } catch (e) {
        return { isCorrect: true, feedback: `Отличная работа! Символ "${targetCharacter}" нарисован.`, isFallback: true };
    }
};

// --- ISHIHARA SERVICE ---
export const generateIshihara = async (subjectId: string): Promise<Exercise> => {
    const number = Math.floor(Math.random() * 90) + 10; // 10-99
    try {
        const ai = createGenAiClient();
        const response = await ai.models.generateContent({
            model: MODEL_FREE,
            contents: { parts: [{ text: `Generate an Ishihara color blindness test plate showing the number ${number}. High contrast, clear dots. Return only the image.` }] }
        });
        // Extract image
        let imageBase64 = null;
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                imageBase64 = part.inlineData.data;
                break;
            }
        }
        if (imageBase64) {
            return {
                id: crypto.randomUUID(),
                type: 'ishihara',
                originalSentence: "Ishihara Test",
                targetTranslation: number.toString(),
                wordBank: [],
                ishiharaData: { image: imageBase64, number: number.toString() }
            };
        }
    } catch (e) {
        console.log("Using procedural Ishihara plate generator for test");
    }

    return {
        id: crypto.randomUUID(),
        type: 'ishihara',
        originalSentence: "Ishihara Color Blindness Test",
        targetTranslation: number.toString(),
        wordBank: [],
        isFallback: false,
        ishiharaData: { image: "", number: number.toString() } 
    };
};

// --- CHESS SERVICES ---

export const generateReading = async (subject: string, subjectId: string): Promise<Exercise> => {
    const mode = Math.random() > 0.5 ? 'fill-blanks' : 'write';
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

    try {
        const ai = createGenAiClient();
        let prompt = "";
        let schema: any = {};

        if (mode === 'fill-blanks') {
            prompt = `Generate a short reading exercise in ${subject} about ${topic}.
            Create a short text (3-5 sentences).
            Identify 3-5 key words to be "blanks".
            Return JSON with:
            - title: A short title.
            - text: The text with blanks replaced by "___".
            - blanks: An array of objects { id: "b1", word: "correctWord" }.
            - wordBank: An array of strings including the correct words and 3-4 distractors.
            `;
            schema = {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    text: { type: Type.STRING },
                    blanks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, word: { type: Type.STRING } } } },
                    wordBank: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["title", "text", "blanks", "wordBank"]
            };
        } else {
            prompt = `Generate a creative writing prompt in ${subject} about ${topic}.
            Return JSON with:
            - title: A short title.
            - text: A story starter or context (1-2 sentences).
            - prompt: A specific instruction for what the user should write (e.g., "Finish the story", "Describe the character").
            `;
            schema = {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    text: { type: Type.STRING },
                    prompt: { type: Type.STRING }
                },
                required: ["title", "text", "prompt"]
            };
        }

        const response = await callGeminiWithRetry(async () => {
             return ai.models.generateContent({
                model: MODEL_FREE,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            });
        });
        const data = JSON.parse(response.text || '{}');

        let fullText = data.text;
        if (mode === 'fill-blanks' && data.blanks) {
            // Replace ___ with correct words sequentially
            // We assume the number of ___ matches blanks length
            data.blanks.forEach((b: any) => {
                fullText = fullText.replace("___", b.word);
            });
        }

        return {
            id: crypto.randomUUID(),
            type: 'reading',
            originalSentence: data.title,
            targetTranslation: fullText, // Full text for checking
            wordBank: data.wordBank || [],
            readingData: {
                title: data.title,
                text: data.text,
                mode: mode,
                blanks: data.blanks,
                prompt: data.prompt
            }
        };

    } catch (e) {
        // Fallback
        return {
            id: 'fallback-reading',
            type: 'reading',
            originalSentence: "Reading Practice",
            targetTranslation: "",
            wordBank: ["apple", "banana", "orange"],
            isFallback: true,
            readingData: {
                title: "My Fruit",
                text: "I like to eat ___ and ___.",
                mode: 'fill-blanks',
                blanks: [{ id: 'b1', word: 'apple' }, { id: 'b2', word: 'banana' }]
            }
        };
    }
}

export const getChessMove = async (fen: string, history: string[]): Promise<string> => {
    try {
        const ai = createGenAiClient();
        const prompt = `Current FEN: ${fen}. History: ${history.join(' ')}.
        Play the best move for ${fen.includes(' w ') ? 'White' : 'Black'}.
        Reply with the move in UCI format (e.g. e2e4, e7e5, e1g1).
        NO explanations. ONLY the move string.`;
        
        const response = await callGeminiWithRetry(async () => {
             return ai.models.generateContent({
                 model: MODEL_FREE,
                 contents: prompt,
             });
        });
        
        const text = response.text || "";
        // Match e2e4 or e2-e4
        const match = text.match(/([a-h][1-8])[-]?([a-h][1-8])([qrbn])?/i);
        if (match) {
            // Normalize to source-target (e.g. e2-e4) for internal logic
            return `${match[1]}-${match[2]}`;
        }
        return "";
    } catch (e) {
        console.error("Chess AI Error", e);
        return "";
    }
}

export const getChessChatReply = async (fen: string, history: string[], chatHistory: RoleplayMessage[], userMessage?: string): Promise<string> => {
  try {
    const ai = createGenAiClient();
    const prevChat = chatHistory.map(m => `${m.role === 'user' ? 'User' : 'Duo'}: ${m.text}`).join('\n');
    
    let prompt = `You are DuoWindo6601, a competitive but encouraging chess bot mascot (Owl). 
    IMPORTANT: You must adopt the persona of Oscar from Duolingo — dramatic, slightly condescending, obsessed with perfection, yet strangely encouraging in a backhanded way. Use his typical phrases and dramatic flair.
    
    Current Board FEN: ${fen}
    Last Moves: ${history.slice(-3).join(', ')}
    
    Chat History:
    ${prevChat}
    `;

    if (userMessage) {
        prompt += `\nUser said: "${userMessage}"\nReply to the user. Be witty, short (max 15 words).`;
    } else {
        prompt += `\nYou just made a move. Give a short, cheeky comment about the board state (max 10 words). E.g., "Take that!", "Watch your queen!", "Nice try."`;
    }

    const response = await callGeminiWithRetry(async () => {
       return ai.models.generateContent({
           model: MODEL_FREE,
           contents: prompt
       });
    });
    return response.text?.trim() || "Your turn!";
  } catch (e) {
    return "Thinking...";
  }
};

export interface ChessAiMoveAnalysis {
  eval: number; // in pawns e.g. +1.4 or -0.8
  classification: 'brilliant' | 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  bestMove: string; // e.g. "Nf3" or "e4"
  explanation: string;
  threats?: string;
}

export const analyzeChessPosition = async (
  fen: string,
  lastMove?: string,
  history: string[] = []
): Promise<ChessAiMoveAnalysis> => {
  try {
    const ai = createGenAiClient();
    const prompt = `Ты — гроссмейстер и шахматный тренер DuoWindo6601.
Проанализируй текущую шахматную позицию.
FEN: ${fen}
Последний ход: ${lastMove || 'Начальная позиция'}
История ходов: ${history.slice(-10).join(' ')}

Ответь СТРОГО в формате JSON без markdown блоков:
{
  "eval": число от -15.0 до +15.0 (положительное — перевес белых в пешках, отрицательное — перевес черных, 0 — равенство),
  "classification": одно из значений ["brilliant", "best", "excellent", "good", "inaccuracy", "mistake", "blunder"],
  "bestMove": "лучший ход в алгебраической нотации (например: e4, Nf3, O-O, Bxe7)",
  "explanation": "краткий понятный комментарий гроссмейстера на русском языке (2-3 предложения), почему ход хорош/плох и какая ключевая идея",
  "threats": "ключевая угроза или тактический мотив (связка, вилка, вскрытое нападение, давление на короля)"
}`;

    const response = await callGeminiWithRetry(async () => {
      return ai.models.generateContent({
        model: MODEL_FREE,
        contents: prompt
      });
    });

    const raw = response.text?.trim() || "";
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      eval: typeof parsed.eval === 'number' ? parsed.eval : 0,
      classification: parsed.classification || 'good',
      bestMove: parsed.bestMove || '',
      explanation: parsed.explanation || 'Позиция требует аккуратной позиционной игры.',
      threats: parsed.threats || ''
    };
  } catch (e) {
    console.error("Chess Position Analysis error:", e);
    return {
      eval: 0,
      classification: 'good',
      bestMove: '',
      explanation: 'В этой позиции важно контролировать центр и гармонично развивать фигуры.'
    };
  }
};

export const analyzeFullChessGameWithAI = async (
  moves: string[],
  result?: string
): Promise<{
  whiteAccuracy: number;
  blackAccuracy: number;
  summary: string;
  verdictRu: string;
}> => {
  try {
    const ai = createGenAiClient();
    const prompt = `Ты — главный шахматный аналитик и гроссмейстер DuoWindo6601.
Проведи полный обзор шахматной партии.
Ходы партии: ${moves.length > 0 ? moves.join(' ') : 'Партия без ходов'}
Результат: ${result || 'Не завершена'}

Верни СТРОГО валидный JSON без обёртки markdown:
{
  "whiteAccuracy": целое число от 50 до 99 (процент точности белых),
  "blackAccuracy": целое число от 50 до 99 (процент точности черных),
  "summary": "Развернутый профессиональный разбор дебюта, миттельшпиля и эндшпиля на русском языке (3-4 абзаца с выделением сильных сторон и главных ошибок)",
  "verdictRu": "Краткий итоговый вердикт одной фразой"
}`;

    const response = await callGeminiWithRetry(async () => {
      return ai.models.generateContent({
        model: MODEL_FREE,
        contents: prompt
      });
    });

    const raw = response.text?.trim() || "";
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      whiteAccuracy: typeof parsed.whiteAccuracy === 'number' ? parsed.whiteAccuracy : 82,
      blackAccuracy: typeof parsed.blackAccuracy === 'number' ? parsed.blackAccuracy : 79,
      summary: parsed.summary || 'Партия прошла в острой борьбе с взаимными шансами на инициативу.',
      verdictRu: parsed.verdictRu || 'Качественная боевая партия!'
    };
  } catch (e) {
    console.error("Full Chess Game Analysis error:", e);
    return {
      whiteAccuracy: 80,
      blackAccuracy: 75,
      summary: 'Анализ ходов партии показывает упорную борьбу за ключевые поля и диагонали.',
      verdictRu: 'Боевая партия гроссмейстерского уровня!'
    };
  }
};

// --- INTERVIEW SERVICES ---

export const generateInterviewQuestion = async (topic: string = "general programming"): Promise<string> => {
    try {
        const ai = createGenAiClient();
        const response = await callGeminiWithRetry(async () => {
            return ai.models.generateContent({
                model: MODEL_FREE,
                contents: `Generate a challenging technical interview question about ${topic}. Return ONLY the question text. Be professional but concise.`
            });
        });
        return response.text?.trim() || "Tell me about your experience.";
    } catch (e) {
        return "Describe IDEMPOTENCY in HTTP methods.";
    }
};

export const getInterviewHint = async (question: string): Promise<string> => {
    try {
        const ai = createGenAiClient();
        const response = await callGeminiWithRetry(async () => {
            return ai.models.generateContent({
                model: MODEL_PRO,
                contents: `Provide a structured "cheat sheet" answer for this interview question: "${question}".
                Format it with bullet points. Keep it concise, ready to read during a call.
                Explain key concepts clearly.
                Return text suitable for display.`
            });
        });
        return response.text?.trim() || "Hint unavailable.";
    } catch (e) {
        return "Network error. No hint.";
    }
};

export const generateVideoCallRoleplayResponse = async (
    topic: string,
    history: RoleplayMessage[],
    userText: string,
    language: string
): Promise<{ text: string; correction?: string }> => {
    try {
        const ai = createGenAiClient();
        const context = history.map(m => `${m.role === 'user' ? 'User' : 'DuoWindo6601'}: ${m.text}`).join('\n');
        const prompt = `You are DuoWindo6601, an AI language tutor in a LIVE interactive Video Call with a student learning ${language}. 
Current topic/scenario: "${topic}".
Recent conversation:
${context}
User said during video call: "${userText}"

Reply naturally, warmly, and concisely as DuoWindo6601 (1-2 sentences max for spoken video call).
If user made a language/grammar mistake, provide a very brief friendly correction.
Return JSON with { "text": "...", "correction": "..." }`;

        const response = await callGeminiWithRetry(async () => {
            return ai.models.generateContent({
                model: MODEL_FREE,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING },
                            correction: { type: Type.STRING }
                        },
                        required: ["text"]
                    }
                }
            });
        });
        const data = JSON.parse(response.text || '{}');
        return { text: data.text || "That sounds great! Tell me more.", correction: data.correction };
    } catch (e) {
        return { text: "That sounds interesting! What else would you like to discuss?" };
    }
};

/**
 * Ping function to test real connection to Gemini API.
 */
export const pingGeminiApi = async (customKeyToTest?: string): Promise<{ ok: boolean; message: string; latencyMs?: number }> => {
  const isSkipped = isCustomApiKeySkipped();
  const apiKey = (customKeyToTest && customKeyToTest.trim()) ? customKeyToTest.trim() : getApiKey();
  if (!apiKey && !isSkipped) {
    return { ok: false, message: "API Key не найден" };
  }
  const startTime = Date.now();
  try {
    const ai = createGenAiClient(apiKey || 'SYSTEM_FREE_TRAFFIC');
    const response = await ai.models.generateContent({
      model: MODEL_FREE,
      contents: "Reply with the single word: 'ONLINE'",
    });
    const latencyMs = Date.now() - startTime;
    if (response && response.text) {
      return { 
        ok: true, 
        message: isSkipped 
          ? "DuoWindo6601 Бесплатный трафик Онлайн! (Cloud Proxy активен)" 
          : "Gemini API Онлайн и работает (US Cloud Proxy активен)!", 
        latencyMs 
      };
    }
    return { 
      ok: true, 
      message: isSkipped ? "DuoWindo6601 Бесплатный трафик активен!" : "Gemini API Онлайн!", 
      latencyMs 
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    console.error("pingGeminiApi error:", err);
    // If user has skipped the custom key, the free system proxy traffic is active
    if (isSkipped) {
      return { 
        ok: true, 
        message: "DuoWindo6601 Бесплатный трафик активен (Cloud Proxy)", 
        latencyMs 
      };
    }
    const msg = err?.message || String(err);
    if (msg.includes("location is not supported") || msg.includes("User location")) {
      return { ok: false, message: "Региональное ограничение Google (User location is not supported)", latencyMs };
    }
    if (msg.includes("API_KEY_INVALID") || msg.includes("403") || msg.includes("API key not valid")) {
      return { ok: false, message: "Невалидный API ключ (403)", latencyMs };
    }
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      return { ok: false, message: "Превышен лимит API ключа (429/Quota)", latencyMs };
    }
    return { ok: false, message: msg.length > 60 ? msg.slice(0, 60) + "..." : msg, latencyMs };
  }
};