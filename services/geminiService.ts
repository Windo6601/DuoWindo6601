
import { Exercise, AdventureScenario, RoleplayMessage } from "../types";
import { playKlingonSpeech } from "./klingonSpeechService";
import { isPIqaDText, KLINGON_SENTENCES } from "./klingonDictionaryService";
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
import {
  FISH_NATIVE_LANGS,
  getAdminFishConfig,
  getFishReferenceIdForLang,
  resolveAllowedFishModel,
} from "./fishAudioConfig";
import {
  GTTS_SUPPORTED_LANGS,
  normalizeCourseLangCode,
  resolvePhoneticTtsTarget,
} from "./multilingualTtsHelper";
import { getRandomProgrammingFallbackExercise } from "./programmingCurriculum";

export enum Type {
  STRING = "STRING",
  NUMBER = "NUMBER",
  INTEGER = "INTEGER",
  BOOLEAN = "BOOLEAN",
  ARRAY = "ARRAY",
  OBJECT = "OBJECT",
}

export enum Modality {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  AUDIO = "AUDIO",
}

export const MODEL_FREE = "gemini-4-hydrogen";
export const MODEL_PRO = "gemini-4-argon";
export const TTS_MODEL = "gemini-3.8-flash-lite-tts";
export const LIVE_MODEL = "gemini-3.8-live";

const extractJsonSafe = <T = any>(rawText: string, fallback?: T): T => {
  if (!rawText || typeof rawText !== 'string') {
    return (fallback !== undefined ? fallback : {}) as T;
  }
  const stripped = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(stripped) as T;
  } catch {
    const objStart = stripped.indexOf('{');
    const objEnd = stripped.lastIndexOf('}');
    if (objStart !== -1 && objEnd > objStart) {
      try {
        return JSON.parse(stripped.slice(objStart, objEnd + 1)) as T;
      } catch {}
    }
    const arrStart = stripped.indexOf('[');
    const arrEnd = stripped.lastIndexOf(']');
    if (arrStart !== -1 && arrEnd > arrStart) {
      try {
        return JSON.parse(stripped.slice(arrStart, arrEnd + 1)) as T;
      } catch {}
    }
    return (fallback !== undefined ? fallback : {}) as T;
  }
};

const sanitizeSubjectName = (subject: string): string => {
  return String(subject || '')
    .replace(/\([^)]*(не является языком|является языком программирования|not a language|programming language)[^)]*\)/gi, '')
    .trim() || String(subject || '');
};

const sanitizeKey = (k: string): string => {
  if (!k) return '';
  return k.replace(/\s+/g, '');
};

export const DEFAULT_FALLBACK_GEMINI_KEY = '';

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

  if (priority === 'admin' && adminDetails.isSet && adminDetails.enabled) {
    return { source: 'admin', sourceLabel: 'Администратор (Admin Key)', isSet: true, type: adminDetails.type, maskedKey: adminDetails.maskedKey };
  }
  if (priority === 'dev' && devDetails.isSet && devDetails.enabled) {
    return { source: 'dev', sourceLabel: 'Разработчик (Dev Key)', isSet: true, type: devDetails.type, maskedKey: devDetails.maskedKey };
  }
  if (priority === 'custom' && customDetails.isCustom && !isCustomApiKeySkipped()) {
    return { source: 'custom', sourceLabel: 'Пользовательский ключ', isSet: true, type: customDetails.type, maskedKey: customDetails.maskedKey };
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

  return { source: 'system', sourceLabel: 'Серверный DuoWindo6601 AI Engine', isSet: true, type: 'free', maskedKey: 'Server-Managed Key' };
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
  return '';
};

export interface ServerGeminiCandidate {
  content?: {
    parts?: Array<{
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string;
      };
    }>;
    role?: string;
  };
  finishReason?: string;
}

export interface ServerGeminiResponse {
  ok?: boolean;
  text?: string;
  data?: any;
  candidates?: ServerGeminiCandidate[];
  usageMetadata?: any;
  error?: { message?: string; status?: number; code?: string };
}

/**
 * Executes a Gemini request via the backend proxy endpoint /api/gemini/generate.
 * Keeps all API keys and SDK instances securely on the server.
 */
export async function callServerGemini(params: {
  model?: string;
  contents?: any;
  prompt?: string;
  config?: any;
  systemInstruction?: string;
  customKey?: string;
}): Promise<ServerGeminiResponse> {
  const customKey = (params.customKey && params.customKey.trim()) ? params.customKey.trim() : getApiKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (customKey && customKey !== 'SYSTEM_FREE_TRAFFIC' && !customKey.includes('••••')) {
    headers['x-goog-api-key'] = customKey;
  }

  const res = await fetch('/api/gemini/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: params.model,
      contents: params.contents,
      prompt: params.prompt,
      config: params.config,
      systemInstruction: params.systemInstruction,
    }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok || body.error) {
    const errorMsg = body.error?.message || `Gemini server request failed with status ${res.status}`;
    const err: any = new Error(errorMsg);
    err.status = res.status;
    err.code = body.error?.code;
    throw err;
  }

  const candidateText = body.candidates?.[0]?.content?.parts?.[0]?.text;
  const resolvedText = body.text ?? candidateText ?? '';

  return {
    ...body,
    text: resolvedText,
  };
}

/**
 * Server-Sent Events (SSE) streaming helper via /api/gemini/stream.
 */
export async function* generateContentStream(params: {
  model?: string;
  contents?: any;
  prompt?: string;
  config?: any;
  systemInstruction?: string;
  customKey?: string;
}): AsyncGenerator<{ text: string }, void, unknown> {
  const customKey = (params.customKey && params.customKey.trim()) ? params.customKey.trim() : getApiKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (customKey && customKey !== 'SYSTEM_FREE_TRAFFIC' && !customKey.includes('••••')) {
    headers['x-goog-api-key'] = customKey;
  }

  const res = await fetch('/api/gemini/stream', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Stream request failed: ${res.status}`);
  }

  if (!res.body) {
    throw new Error('ReadableStream not supported in this browser');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed === 'data: [DONE]') return;
        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              yield { text: parsed.text };
            }
          } catch (e: any) {
            if (e?.message && e.message !== 'Unexpected end of JSON input') {
              throw e;
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export interface LiveApiConnection {
  sendAudioChunk: (base64Pcm16k: string) => void;
  sendTextMessage: (text: string) => void;
  close: () => void;
}

/**
 * Establishes a bidirectional WebSocket connection to the server's Live API bridge (/api/gemini/live).
 */
export function connectLiveApi(options: {
  systemInstruction?: string;
  onAudioData?: (base64Pcm24k: string) => void;
  onTextData?: (text: string) => void;
  onError?: (error: any) => void;
  onClose?: () => void;
  onOpen?: () => void;
}): LiveApiConnection {
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = typeof window !== 'undefined' && window.location.host ? window.location.host : 'localhost:3000';
  const wsUrl = `${protocol}//${host}/api/gemini/live`;
  const socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    socket.send(JSON.stringify({
      type: 'setup',
      systemInstruction: options.systemInstruction,
    }));
    options.onOpen?.();
  };

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      const audioData = msg.audio || (msg.type === 'audio' ? msg.data : undefined);
      if (audioData) {
        options.onAudioData?.(audioData);
      } else if (msg.type === 'text' && msg.text) {
        options.onTextData?.(msg.text);
      } else if (msg.text) {
        options.onTextData?.(msg.text);
      } else if (msg.type === 'error' || msg.error) {
        options.onError?.(new Error(msg.message || msg.error || 'Live API error'));
      }
    } catch (e) {
      options.onError?.(e);
    }
  };

  socket.onerror = (e) => {
    options.onError?.(e);
  };

  socket.onclose = () => {
    options.onClose?.();
  };

  return {
    sendAudioChunk: (base64Pcm16k: string) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'audio', audio: base64Pcm16k, data: base64Pcm16k }));
      }
    },
    sendTextMessage: (text: string) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'text', text }));
      }
    },
    close: () => {
      try {
        socket.close();
      } catch {}
    },
  };
}

/**
 * Returns a server-backed Gemini client that routes all calls through /api/gemini/generate.
 * Fully compatible with existing component code.
 */
export const createGenAiClient = (customKey?: string) => {
  return {
    models: {
      generateContent: async (params: {
        model?: string;
        contents?: any;
        config?: any;
        systemInstruction?: string;
      }): Promise<ServerGeminiResponse> => {
        return callServerGemini({ ...params, customKey });
      },
      generateContentStream: async function* (params: {
        model?: string;
        contents?: any;
        config?: any;
        systemInstruction?: string;
      }) {
        yield* generateContentStream({ ...params, customKey });
      },
    },
    chats: {
      create: (params: any) => ({
        sendMessage: async (msg: any) => {
          return callServerGemini({
            model: params?.model,
            contents: msg,
            config: params?.config,
            systemInstruction: params?.config?.systemInstruction,
            customKey,
          });
        },
      }),
    },
  };
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
        if (isRateLimit) {
           throw new Error("Превышена частота запросов к ИИ (Rate Limit). Пожалуйста, подождите минуту и попробуйте снова.");
        }
        throw error;
      }

      // Экспоненциальный рост (1s, 2s, 4s, 8s, 16s...) + случайный джиттер 0-500ms
      const backoffDelay = (baseDelay * Math.pow(2, attempt)) + (Math.random() * 500);
      console.warn(`[429] Лимит запросов. Повтор ${attempt + 1}/${retries} через ${Math.round(backoffDelay)}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  throw new Error("Достигнуто максимальное число попыток повтора к Gemini API. Превышена частота (Rate exceeded).");
}

interface RateLimiterTask<T> {
  apiCallTask: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}

/**
 * 2. Клиентский Rate Limiter и Очередь Запросов
 * Распределяет запросы во времени согласно ограничениям бесплатного тарифа (10 RPM = 1 запрос в 6 секунд)
 */
export class GeminiRateLimiterQueue {
  private delayBetweenRequests: number;
  private queue: RateLimiterTask<any>[] = [];
  private isProcessing: boolean = false;

  constructor(requestsPerMinute: number = 10) {
    // 60,000ms / 10 = 6,000ms между запросами (безопасный запас относительно лимита в 15 RPM)
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
        const result = await apiCallTask();
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

// Глобальный экземпляр очереди с оптимизированной высокой частотой запросов
export const geminiRateLimiter = new GeminiRateLimiterQueue(60);

/**
 * Вспомогательная обертка таймаута для предотвращения зависания загрузки уроков.
 * Автоматически сбрасывает длинные вызовы и переключает на автономное упражнение.
 */
export const fetchWithTimeout = <T>(promise: Promise<T>, ms: number = 25000): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`API request timed out after ${ms}ms`));
    }, ms);
    promise
      .then(res => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

/**
 * Центральный шлюз вызова Gemini API:
 * Маршрутизирует вызовы через очередь ограничения частоты и
 * механизм Exponential Backoff + Jitter при ошибках 429.
 */
export async function callGeminiWithRetry<T>(
  apiCall: () => Promise<T>,
  retries: number = 3,
  baseDelay: number = 800,
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

export interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

export function parseMimeType(mimeType: string): WavConversionOptions {
  const [fileType, ...params] = (mimeType || '').split(';').map(s => s.trim());
  const [_, format] = (fileType || '').split('/');

  const options: Partial<WavConversionOptions> = {
    numChannels: 1,
    sampleRate: 24000,
    bitsPerSample: 16
  };

  if (format && format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }

  for (const param of params) {
    const [key, value] = param.split('=').map(s => s.trim());
    if (key === 'rate') {
      const rate = parseInt(value, 10);
      if (!isNaN(rate)) {
        options.sampleRate = rate;
      }
    }
  }

  return options as WavConversionOptions;
}

export function createWavHeader(dataLength: number, options: WavConversionOptions): Uint8Array {
  const {
    numChannels = 1,
    sampleRate = 24000,
    bitsPerSample = 16,
  } = options || {};

  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = new Uint8Array(44);
  const view = new DataView(buffer.buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  return buffer;
}

export function convertToWav(rawData: Uint8Array | string, mimeType: string = 'audio/pcm;rate=24000'): Uint8Array {
  const options = parseMimeType(mimeType);
  const rawBytes = typeof rawData === 'string'
    ? Uint8Array.from(atob(rawData), c => c.charCodeAt(0))
    : rawData;
  const header = createWavHeader(rawBytes.length, options);
  const wav = new Uint8Array(header.length + rawBytes.length);
  wav.set(header, 0);
  wav.set(rawBytes, header.length);
  return wav;
}

let audioContext: AudioContext | null = null;

const playWav = async (base64Audio: string) => {
  try {
    const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
    await audio.play();
  } catch (e) {
    console.error("Error playing WAV audio:", e);
    try {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const audio2 = new Audio(url);
      await audio2.play();
    } catch (e2) {
      console.error("Fallback WAV play error:", e2);
    }
  }
};

const resolveSpeechLanguage = (text: string, lang: string): string => {
  const clean = text.trim();
  const rawLang = (lang || '').trim().toLowerCase();
  const baseLang = normalizeCourseLangCode(rawLang);
  if (!clean) return baseLang || 'en';

  // 1. Klingon course or ConScript pIqaD text ALWAYS stays 'tlh' (never hijacked to English)
  if (rawLang === 'tlh' || rawLang === 'klingon' || isPIqaDText(clean)) {
    return 'tlh';
  }

  // 2. Non-language courses resolve to Russian or English strictly by script
  if (rawLang === 'math' || rawLang === 'chess' || rawLang === 'music' || rawLang === 'coding' || rawLang === 'art') {
    return /[\u0400-\u04FF]/.test(clean) ? 'ru' : 'en';
  }

  // 3. Explicit non-Latin scripts override UI/default codes
  if (/[\u0400-\u04FF]/.test(clean)) {
    if (rawLang === 'rf-chuvash' || baseLang === 'cv') return 'cv';
    if (baseLang === 'uk') return 'uk';
    if (baseLang === 'be') return 'be';
    if (baseLang === 'kk') return 'kk';
    if (baseLang === 'tt') return 'tt';
    if (baseLang === 'ky') return 'ky';
    if (baseLang === 'tg') return 'tg';
    if (baseLang === 'tab') return 'tab';
    return 'ru';
  }
  if (/[\u0600-\u06FF]/.test(clean)) return 'ar';
  if (/[\u0590-\u05FF]/.test(clean)) return baseLang === 'yi' ? 'yi' : 'he';
  if (/[\u4e00-\u9fa5]/.test(clean)) return 'zh';
  if (/[\u3040-\u30ff]/.test(clean)) return 'ja';
  if (/[\uac00-\ud7af]/.test(clean)) return 'ko';
  if (/[\u0900-\u097F]/.test(clean)) return 'hi';
  if (/[\u0370-\u03FF]/.test(clean)) return 'el';
  if (/[\u0530-\u058F]/.test(clean)) return 'hy';
  if (/[\u10A0-\u10FF]/.test(clean)) return 'ka';

  // 4. Preserve explicit English course strictly as 'en'
  if (baseLang === 'en') {
    return 'en';
  }

  // 5. Only switch to 'en' if lang is empty or UI-Russian ('ru') and text is clearly English ASCII
  const englishWords = [
    'hello', 'welcome', 'thank', 'thanks', 'good', 'morning', 'afternoon', 'evening', 'night',
    'how', 'are', 'you', 'what', 'where', 'when', 'why', 'who', 'yes', 'apple', 'banana',
    'cat', 'dog', 'house', 'water', 'book', 'friend', 'school', 'computer', 'goodbye'
  ];
  const hasEnglishWord =
    /\bhi\b/i.test(clean) ||
    englishWords.some((w) => new RegExp(`\\b${w}\\b`, 'i').test(clean));

  if ((!rawLang || baseLang === 'ru') && (hasEnglishWord || /^[a-zA-Z0-9\s.,!?'"\-]+$/.test(clean))) {
    return 'en';
  }

  return baseLang || 'en';
};

const fallbackSpeak = (text: string, lang: string = 'en', slow: boolean = false, provider: 'google' | 'yandex' | 'system' = 'system') => {
  const cleanText = text
    .replace(/Speak clearly and easily in English[:.]?/gi, '')
    .replace(/Say clearly and naturally in [^:]+[:.]?/gi, '')
    .trim();
  if (!cleanText) return;

  const effectiveLang = resolveSpeechLanguage(cleanText, lang);
  const SYSTEM_SUPPORTED_LANGS = new Set([
    'en', 'de', 'fr', 'es', 'ja', 'zh', 'ko', 'it', 'pt', 'ru', 'uk',
    'et', 'lv', 'lt', 'tr', 'ar', 'hu', 'fi', 'is', 'pl', 'eu', 'he',
    'hi', 'sv', 'no', 'id', 'ro', 'nl', 'cs', 'el', 'vi', 'th'
  ]);
  const routed = SYSTEM_SUPPORTED_LANGS.has(effectiveLang)
    ? { lang: effectiveLang, text: cleanText }
    : resolvePhoneticTtsTarget(cleanText, effectiveLang, SYSTEM_SUPPORTED_LANGS);

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(routed.text);
      utterance.rate = slow ? 0.6 : 1.0;

      const langMap: Record<string, string> = {
        'en': 'en-US', 'de': 'de-DE', 'fr': 'fr-FR', 'es': 'es-ES', 'ja': 'ja-JP',
        'zh': 'zh-CN', 'ko': 'ko-KR', 'it': 'it-IT', 'pt': 'pt-BR', 'ru': 'ru-RU',
        'be': 'uk-UA', 'uk': 'uk-UA', 'et': 'et-EE', 'lv': 'lv-LV', 'lt': 'lt-LT', 'tr': 'tr-TR',
        'ar': 'ar-SA', 'hu': 'hu-HU', 'fi': 'fi-FI', 'is': 'is-IS', 'pl': 'pl-PL', 'eu': 'eu-ES',
        'nv': 'es-ES', 'tab': 'ru-RU', 'cv': 'ru-RU', 'tt': 'ru-RU', 'kk': 'ru-RU', 'uz': 'tr-TR',
        'ky': 'ru-RU', 'az': 'tr-TR', 'tk': 'tr-TR', 'tg': 'ru-RU', 'hy': 'it-IT', 'ka': 'it-IT',
        'he': 'he-IL', 'yi': 'he-IL', 'la': 'it-IT', 'eo': 'es-ES', 'hv': 'it-IT',
        'hi': 'hi-IN', 'sv': 'sv-SE', 'no': 'nb-NO', 'id': 'id-ID', 'ro': 'ro-RO',
        'mo': 'ro-RO', 'nl': 'nl-NL', 'cs': 'cs-CZ', 'el': 'el-GR', 'vi': 'vi-VN', 'th': 'th-TH'
      };

      const targetBcp47 = langMap[routed.lang] || routed.lang;
      utterance.lang = targetBcp47;

      let voices = window.speechSynthesis.getVoices();

      const findVoice = () => {
        try {
          const targetPrefix = targetBcp47.split('-')[0].toLowerCase();
          let matchingVoice: SpeechSynthesisVoice | undefined;

          if (provider === 'yandex') {
            matchingVoice = voices.find(v => (v.name.toLowerCase().includes("yandex") || v.name.toLowerCase().includes("yuri")) && v.lang.toLowerCase().startsWith(targetPrefix));
          } else if (provider === 'google') {
            matchingVoice = voices.find(v => v.name.toLowerCase().includes("google") && v.lang.toLowerCase().startsWith(targetPrefix));
          }

          if (!matchingVoice) {
            matchingVoice = voices.find(v => v.lang.toLowerCase() === targetBcp47.toLowerCase());
          }
          if (!matchingVoice) {
            matchingVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetPrefix));
          }

          // Never force an English voices[0] onto non-English courses!
          if (!matchingVoice && targetPrefix !== 'en') {
            const siblingPrefixes: Record<string, string[]> = {
              no: ['nb', 'sv', 'da'],
              nb: ['no', 'sv', 'da'],
              sv: ['nb', 'no', 'da'],
              is: ['sv', 'nb', 'no', 'de'],
              uk: ['ru', 'pl'],
              et: ['fi'],
              lv: ['pl', 'ru'],
              lt: ['pl', 'ru'],
              eu: ['es'],
              cs: ['pl', 'sk'],
              ro: ['it', 'es'],
            };
            for (const sib of (siblingPrefixes[targetPrefix] || [])) {
              matchingVoice = voices.find(v => v.lang.toLowerCase().startsWith(sib));
              if (matchingVoice) break;
            }
          }

          if (!matchingVoice && targetPrefix === 'en' && voices.length > 0) {
            matchingVoice = voices.find(v => v.lang.toLowerCase().startsWith('en')) || voices[0];
          }

          if (matchingVoice) {
            utterance.voice = matchingVoice;
          }
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.warn("fallbackSpeak findVoice error:", e);
        }
      };

      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          findVoice();
        };
        setTimeout(() => {
          try {
            if (!window.speechSynthesis.speaking) {
              findVoice();
            }
          } catch {}
        }, 300);
      } else {
        findVoice();
      }
    } catch (e) {
      console.warn("fallbackSpeak error:", e);
    }
  }
};

const fishAudioCache = new Map<string, ArrayBuffer>();
const grokAudioCache = new Map<string, ArrayBuffer>();

export const speakWithGrokAudio = async (text: string, lang: string = 'ru', slow: boolean = false): Promise<void> => {
  if (!text) return;
  const cacheKey = `grok_${text}_${slow}`;

  let arrayBuffer = grokAudioCache.get(cacheKey);

  if (!arrayBuffer) {
    const res = await fetch('/api/tts/grok', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text, format: 'mp3', lang })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Grok TTS failed (${res.status}): ${errText}`);
    }

    arrayBuffer = await res.arrayBuffer();
    grokAudioCache.set(cacheKey, arrayBuffer);
  }

  const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
  const audioUrl = URL.createObjectURL(blob);
  const audio = new Audio(audioUrl);

  if (slow) {
    audio.playbackRate = 0.75;
  }

  await audio.play();
};

export const getSelectedFishModel = (): string => {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('duo_user_progress_6601');
      if (raw) {
        const parsed = JSON.parse(raw);
        const requested =
          parsed?.fishModel && typeof parsed.fishModel === 'string'
            ? parsed.fishModel
            : parsed?.voiceProvider === 'fish-drama-3'
              ? 'drama-3'
              : 's2.1-pro-free';
        return resolveAllowedFishModel(requested, parsed);
      }
    }
  } catch {}
  return 's2.1-pro-free';
};

const googleTtsAudioCache = new Map<string, ArrayBuffer>();

const speakWithGoogleServerTts = async (text: string, lang: string, slow: boolean = false): Promise<void> => {
  if (!text) return;
  const effectiveLang = resolveSpeechLanguage(text, lang);
  const cacheKey = `gtts_${effectiveLang}_${text}_${slow}`;
  let arrayBuffer = googleTtsAudioCache.get(cacheKey);
  if (!arrayBuffer) {
    const res = await fetch('/api/tts/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang: effectiveLang }),
    });
    if (!res.ok) {
      throw new Error(`Google TTS failed (${res.status})`);
    }
    arrayBuffer = await res.arrayBuffer();
    googleTtsAudioCache.set(cacheKey, arrayBuffer);
  }
  const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
  const audioUrl = URL.createObjectURL(blob);
  const audio = new Audio(audioUrl);
  if (slow) audio.playbackRate = 0.75;
  await new Promise<void>((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      resolve();
    };
    audio.onerror = (e) => {
      URL.revokeObjectURL(audioUrl);
      reject(e);
    };
    audio.play().catch(reject);
  });
};

export const speakWithFishAudio = async (
  text: string,
  lang: string = 'ru',
  slow: boolean = false,
  model: string = 's2.1-pro-free',
  referenceId?: string
): Promise<void> => {
  if (!text) return;
  const effectiveLang = resolveSpeechLanguage(text, lang);
  if (effectiveLang === 'tlh') {
    await playKlingonSpeech(text, slow);
    return;
  }

  let storedUser: any = null;
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('duo_user_progress_6601');
      if (raw) storedUser = JSON.parse(raw);
    }
  } catch {}

  const adminFishCfg = getAdminFishConfig();
  const effectiveModel = resolveAllowedFishModel(model || getSelectedFishModel() || 's2.1-pro-free', storedUser);

  // Use native per-language Fish Audio voice (or GTTS/phonetic routing handled cleanly on /api/tts/fish)
  // NEVER force English DEFAULT_FISH_REFERENCE_ID ("Adrian") onto non-English courses!
  const targetLangForRef = FISH_NATIVE_LANGS.has(effectiveLang)
    ? effectiveLang
    : resolvePhoneticTtsTarget(text, effectiveLang, FISH_NATIVE_LANGS).lang;
  const effectiveReferenceId = getFishReferenceIdForLang(
    targetLangForRef,
    adminFishCfg.defaultReferenceId,
    referenceId
  );

  const cacheKey = `fish_${effectiveLang}_${text}_${slow}_${effectiveModel}_${effectiveReferenceId || 'auto'}`;

  let arrayBuffer = fishAudioCache.get(cacheKey);

  if (!arrayBuffer) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (adminFishCfg.customApiKey && adminFishCfg.customApiKey.startsWith('sk-fish-')) {
      headers['x-fish-api-key'] = adminFishCfg.customApiKey;
    }

    const res = await fetch('/api/tts/fish', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text,
        format: 'mp3',
        lang: effectiveLang,
        model: effectiveModel,
        ...(effectiveReferenceId ? { reference_id: effectiveReferenceId } : {})
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Fish Audio TTS failed (${res.status}): ${errText}`);
    }

    arrayBuffer = await res.arrayBuffer();
    fishAudioCache.set(cacheKey, arrayBuffer);
  }

  const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
  const audioUrl = URL.createObjectURL(blob);
  const audio = new Audio(audioUrl);

  if (slow) {
    audio.playbackRate = 0.75;
  }

  await new Promise<void>((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      resolve();
    };
    audio.onerror = (e) => {
      URL.revokeObjectURL(audioUrl);
      reject(e);
    };
    audio.play().catch(reject);
  });
};

export const speakText = async (
  text: string, 
  lang: string = 'en', 
  slow: boolean = false, 
  voiceName: string = 'Kore', 
  provider: 'fish' | 'fish-drama-3' | 'grok' | 'gemini' | 'google' | 'yandex' | 'system' | 'sapi53' = 'gemini'
) => {
  if (!text) return;
  const cleanText = text
    .replace(/\([^)]*\)/g, '') // Remove (text in parentheses) - often translations
    .replace(/\[[^\]]*\]/g, '') // Remove [text in brackets]
    .replace(/Speak clearly and easily in English[:.]?/gi, '')
    .replace(/Say clearly and naturally in [^:]+[:.]?/gi, '')
    .replace(/[:;]\s*$/g, '.') // Ensure it ends with a dot if it ends with colon/semicolon
    .trim();
  if (!cleanText) return;

  const effectiveLang = resolveSpeechLanguage(cleanText, lang);

  if (effectiveLang === 'tlh' || effectiveLang === 'klingon') {
    await playKlingonSpeech(cleanText, slow);
    return;
  }

  if (provider === 'fish' || provider === 'fish-drama-3') {
    try {
      const fishModelToUse = provider === 'fish-drama-3' ? 'drama-3' : getSelectedFishModel();
      await speakWithFishAudio(cleanText, effectiveLang, slow, fishModelToUse);
      return;
    } catch (e) {
      console.warn("Fish Audio TTS failed, falling back to Google TTS / Gemini / System:", e);
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          await speakWithGoogleServerTts(cleanText, effectiveLang, slow);
          return;
        } catch {}
      }
    }
  }

  if (provider === 'grok') {
    try {
      await speakWithGrokAudio(cleanText, effectiveLang, slow);
      return;
    } catch (e) {
      console.warn("Grok TTS failed, falling back to Gemini / System:", e);
    }
  }

  if (provider === 'google' && typeof navigator !== 'undefined' && navigator.onLine && GTTS_SUPPORTED_LANGS.has(effectiveLang)) {
    try {
      await speakWithGoogleServerTts(cleanText, effectiveLang, slow);
      return;
    } catch {
      // Fall back to browser Google voice below
    }
  }

  if ((typeof navigator !== 'undefined' && !navigator.onLine) || provider === 'google' || provider === 'yandex' || provider === 'system' || provider === 'sapi53') {
      fallbackSpeak(cleanText, effectiveLang, slow, (provider === 'google' || provider === 'yandex') ? provider : 'system');
      return;
  }

  const normalizedVoice = (!voiceName || voiceName === 'Fola') ? 'Kore' : voiceName;
  const cacheKey = `${cleanText}_${effectiveLang}_${slow}_${normalizedVoice}`;
  if (audioCache.has(cacheKey)) return playWav(audioCache.get(cacheKey)!);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const customKey = getApiKey();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (customKey && customKey !== 'SYSTEM_FREE_TRAFFIC' && !customKey.includes('••••')) {
      headers['x-goog-api-key'] = customKey;
    }

    const res = await fetch('/api/gemini/tts', {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: cleanText, voiceName: normalizedVoice, lang: effectiveLang }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const rawData = data?.audioBase64 || '';
      const mimeType = data?.mimeType || 'audio/pcm;rate=24000';
      if (rawData) {
        if (mimeType.includes('mpeg') || mimeType.includes('mp3') || mimeType.includes('ogg')) {
          const audioUrl = `data:${mimeType};base64,${rawData}`;
          const audio = new Audio(audioUrl);
          if (slow) audio.playbackRate = 0.75;
          await audio.play();
          return;
        }
        let finalBase64 = rawData;
        if (!mimeType.includes('wav') && !rawData.startsWith('UklGR')) {
          const wavBytes = convertToWav(rawData, mimeType);
          let binary = '';
          const len = wavBytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(wavBytes[i]);
          }
          finalBase64 = btoa(binary);
        }
        audioCache.set(cacheKey, finalBase64);
        return playWav(finalBase64);
      }
    }
    throw new Error(`Gemini TTS status ${res.status}`);
  } catch (error) {
    try {
      await speakWithGoogleServerTts(cleanText, effectiveLang, slow);
      return;
    } catch {}
    try {
      await speakWithFishAudio(cleanText, effectiveLang, slow, 's2.1-pro-free');
      return;
    } catch (fishErr) {
      console.warn("Fish Audio fallback failed, using Web Speech:", fishErr);
    }
    console.warn("TTS failed, using system speech fallback:", error);
    fallbackSpeak(cleanText, effectiveLang, slow, 'system');
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
        originalSentence: exercise.originalSentence?.replace(/Speak clearly and easily in English[:.]?/gi, '').trim() || '',
        targetTranslation: exercise.targetTranslation?.replace(/Speak clearly and easily in English[:.]?/gi, '').trim() || '',
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

export const getFallbackExercise = (
  subjectId: string,
  type: Exercise['type'],
  subjectName: string,
  userLanguage: string = 'ru',
  customTopic?: string,
  difficultyLevel: 'easy' | 'hard' = 'easy'
): Exercise => {
    if (subjectId === 'coding') {
      return getRandomProgrammingFallbackExercise(customTopic || subjectName, difficultyLevel);
    }

    // 1. Try local cache first!
    const cached = getCachedExercise(subjectId, type);
    if (cached) {
      return cached;
    }

    if (subjectId === 'math') {
        const mathType = Math.random();
        if (mathType < 0.25) {
            // 🔢 Арифметика (1-6 класс)
            const a = Math.floor(Math.random() * 80) + 10;
            const b = Math.floor(Math.random() * 80) + 10;
            const op = Math.random() > 0.5 ? '+' : '-';
            const res = op === '+' ? a + b : a - b;
            return {
                id: crypto.randomUUID(), type: 'translation', originalSentence: `🔢 [Арифметика] ${a} ${op} ${b} = ?`,
                targetTranslation: res.toString(),
                wordBank: [res.toString(), (res + 1).toString(), (res - 1).toString(), (res + 10).toString()].sort(() => Math.random() - 0.5),
                isFallback: true
            };
        } else if (mathType < 0.5) {
            // 📐 Алгебра (7-9 класс)
            const x = Math.floor(Math.random() * 12) + 1;
            const coef = Math.floor(Math.random() * 5) + 2;
            const b = Math.floor(Math.random() * 20) + 1;
            const rhs = coef * x + b;
            return {
                id: crypto.randomUUID(), type: 'translation', originalSentence: `📐 [Алгебра] Найдите x: ${coef}x + ${b} = ${rhs}`,
                targetTranslation: x.toString(),
                wordBank: [x.toString(), (x + 2).toString(), (x - 1).toString(), (x * 2).toString()].sort(() => Math.random() - 0.5),
                isFallback: true
            };
        } else if (mathType < 0.75) {
            // 🎓 10-11 класс • Логарифмы
            const base = [2, 3, 5, 10][Math.floor(Math.random() * 4)];
            const exp = Math.floor(Math.random() * 4) + 1;
            const val = Math.pow(base, exp);
            return {
                id: crypto.randomUUID(), type: 'translation', originalSentence: `🎓 [10–11 класс • Логарифмы] log${base === 10 ? '' : `_` + base}(${val}) = ?`,
                targetTranslation: exp.toString(),
                wordBank: [exp.toString(), (exp + 1).toString(), (exp - 1).toString(), (exp * 2).toString()].sort(() => Math.random() - 0.5),
                isFallback: true
            };
        } else {
            // 🎓 10-11 класс • Тригонометрия
            const trigQuestions = [
                { q: "🎓 [10–11 класс • Тригонометрия] Чему равно sin²(x) + cos²(x)?", ans: "1" },
                { q: "🎓 [10–11 класс • Тригонометрия] Чему равен sin(90°)?", ans: "1" },
                { q: "🎓 [10–11 класс • Тригонометрия] Чему равен cos(0°)?", ans: "1" },
                { q: "🎓 [10–11 класс • Тригонометрия] Чему равен sin(0°)?", ans: "0" },
                { q: "🎓 [10–11 класс • Тригонометрия] Чему равен tg(45°)?", ans: "1" },
                { q: "🎓 [10–11 класс • Алгебра] Чему равен √144?", ans: "12" }
            ];
            const item = trigQuestions[Math.floor(Math.random() * trigQuestions.length)];
            return {
                id: crypto.randomUUID(), type: 'translation', originalSentence: item.q,
                targetTranslation: item.ans,
                wordBank: [item.ans, "0", "2", "-1", "0.5"].filter(w => w !== item.ans).slice(0, 3).concat([item.ans]).sort(() => Math.random() - 0.5),
                isFallback: true
            };
        }
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
    const hardestFallbacks: Record<string, { orig: string; trans: string; bank: string[] }[]> = {
      cv: [
        { orig: "Ырӑ кун! Мӗнле пурӑнатӑр?", trans: "Добрый день! Как поживаете?", bank: ["Добрый", "день!", "Как", "поживаете?", "Спасибо", "Хорошо", "дела"] },
        { orig: "Эпӗ чӑваш чӗлхине вӗренетӗп", trans: "Я изучаю чувашский язык", bank: ["Я", "изучаю", "чувашский", "язык", "Мы", "говорим", "книга"] },
        { orig: "Салам! Юлташӑм, ырӑ кӑмӑл пултӑр", trans: "Привет! Друг мой, хорошего настроения", bank: ["Привет!", "Друг", "мой,", "хорошего", "настроения", "здравствуйте", "утро"] },
        { orig: "Тавах сире пысӑк пулӑшушӑн", trans: "Спасибо вам за большую помощь", bank: ["Спасибо", "вам", "за", "большую", "помощь", "пожалуйста", "очень"] },
        { orig: "Чӑваш Ен — пирӗн тӑван ҫӗршыв", trans: "Чувашия — наша родная земля", bank: ["Чувашия", "—", "наша", "родная", "земля", "город", "страна"] },
        { orig: "Аннепе атте маншӑн чи ҫывӑх ҫынсем", trans: "Мама и папа для меня самые близкие люди", bank: ["Мама", "и", "папа", "для", "меня", "самые", "близкие", "люди"] },
        { orig: "Шкулта эпир нумай кӗнеке вулатпӑр", trans: "В школе мы читаем много книг", bank: ["В", "школе", "мы", "читаем", "много", "книг", "пишем"] },
        { orig: "Паян ҫутӑ хӗвел пӑхать, ҫанталӑк ӑшӑ", trans: "Сегодня светит яркое солнце, погода теплая", bank: ["Сегодня", "светит", "яркое", "солнце,", "погода", "теплая", "ветер"] },
        { orig: "Эсир чӑвашла калаҫатӑр-и?", trans: "Вы говорите по-чувашски?", bank: ["Вы", "говорите", "по-чувашски?", "Я", "понимаю", "немного"] },
        { orig: "Ҫӑкӑр — пурнӑҫ тӗрекӗ", trans: "Хлеб — основа жизни", bank: ["Хлеб", "—", "основа", "жизни", "вода", "соль"] },
        { orig: "Добрый день, друг!", trans: "Ырӑ кун, юлташ!", bank: ["Ырӑ", "кун,", "юлташ!", "Салам", "тавах", "сывӑ", "пул"] },
        { orig: "Я люблю свой родной край", trans: "Эпӗ хамӑн тӑван ҫӗршыва юрататӑп", bank: ["Эпӗ", "хамӑн", "тӑван", "ҫӗршыва", "юрататӑп", "вӗренетӗп", "пирӗн"] }
      ],
      'rf-chuvash': [
        { orig: "Ырӑ кун! Мӗнле пурӑнатӑр?", trans: "Добрый день! Как поживаете?", bank: ["Добрый", "день!", "Как", "поживаете?", "Спасибо", "Хорошо", "дела"] },
        { orig: "Эпӗ чӑваш чӗлхине вӗренетӗп", trans: "Я изучаю чувашский язык", bank: ["Я", "изучаю", "чувашский", "язык", "Мы", "говорим", "книга"] },
        { orig: "Салам! Юлташӑм, ырӑ кӑмӑл пултӑр", trans: "Привет! Друг мой, хорошего настроения", bank: ["Привет!", "Друг", "мой,", "хорошего", "настроения", "здравствуйте", "утро"] },
        { orig: "Тавах сире пысӑк пулӑшушӑн", trans: "Спасибо вам за большую помощь", bank: ["Спасибо", "вам", "за", "большую", "помощь", "пожалуйста", "очень"] },
        { orig: "Чӑваш Ен — пирӗн тӑван ҫӗршыв", trans: "Чувашия — наша родная земля", bank: ["Чувашия", "—", "наша", "родная", "земля", "город", "страна"] }
      ],
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
      ],
      eo: [
        { orig: "Saluton! Kiel vi fartas?", trans: "Привет! Как ваши дела?", bank: ["Привет!", "Как", "ваши", "дела?", "Хорошо", "Спасибо"] },
        { orig: "Mi lernas Esperanton — la plej facilan lingvon en la mondo", trans: "Я изучаю эсперанто — самый лёгкий язык в мире", bank: ["Я", "изучаю", "эсперанто", "—", "самый", "лёгкий", "язык", "в", "мире"] },
        { orig: "Dankon al vi pro via granda helpo!", trans: "Большое спасибо вам за помощь!", bank: ["Большое", "спасибо", "вам", "за", "помощь!", "друг"] },
        { orig: "La hundo kuras en la bela ĝardeno", trans: "Собака бежит в красивом саду", bank: ["Собака", "бежит", "в", "красивом", "саду", "кот"] },
        { orig: "Bonan tagon, mia kara amiko!", trans: "Добрый день, мой дорогой друг!", bank: ["Добрый", "день,", "мой", "дорогой", "друг!", "Привет"] }
      ],
      id: [
        { orig: "Halo! Apa kabar?", trans: "Привет! Как дела?", bank: ["Привет!", "Как", "дела?", "Хорошо", "Спасибо"] },
        { orig: "Saya belajar bahasa Indonesia", trans: "Я изучаю индонезийский язык", bank: ["Я", "изучаю", "индонезийский", "язык", "мы"] },
        { orig: "Terima kasih banyak atas bantuannya", trans: "Большое спасибо за помощь", bank: ["Большое", "спасибо", "за", "помощь", "пожалуйста"] },
        { orig: "Selamat pagi dan selamat belajar!", trans: "Доброе утро и приятной учёбы!", bank: ["Доброе", "утро", "и", "приятной", "учёбы!", "день"] },
        { orig: "Kucing makan ikan di rumah", trans: "Кот ест рыбу дома", bank: ["Кот", "ест", "рыбу", "дома", "собака"] }
      ],
      en: [
        { orig: "The cat sleeps on the sofa", trans: "Кошка спит на диване", bank: ["Кошка", "спит", "на", "диване", "собака", "кровать"] },
        { orig: "I drink warm tea every morning", trans: "Я пью тёплый чай каждое утро", bank: ["Я", "пью", "тёплый", "чай", "каждое", "утро", "кофе"] },
        { orig: "She reads an interesting book", trans: "Она читает интересную книгу", bank: ["Она", "читает", "интересную", "книгу", "он", "пишет"] },
        { orig: "Good morning, how are you today?", trans: "Доброе утро, как твои дела сегодня?", bank: ["Доброе", "утро,", "как", "твои", "дела", "сегодня?"] }
      ],
      ru: [
        { orig: "Привет! Как у тебя дела сегодня?", trans: "Hello! How are you doing today?", bank: ["Hello!", "How", "are", "you", "doing", "today?", "well"] },
        { orig: "Я люблю читать интересные книги", trans: "I love reading interesting books", bank: ["I", "love", "reading", "interesting", "books", "write"] },
        { orig: "Сегодня на улице тёплая погода", trans: "The weather is warm outside today", bank: ["The", "weather", "is", "warm", "outside", "today", "cold"] }
      ],
      es: [
        { orig: "Hola, ¿cómo estás hoy?", trans: "Привет, как ты сегодня?", bank: ["Привет,", "как", "ты", "сегодня?", "хорошо", "он"] },
        { orig: "El perro corre en el parque", trans: "Собака бегает в парке", bank: ["Собака", "бегает", "в", "парке", "кошка", "дом"] },
        { orig: "Yo bebo café caliente por la mañana", trans: "Я пью горячий кофе по утрам", bank: ["Я", "пью", "горячий", "кофе", "по", "утрам", "чай"] },
        { orig: "Muchas gracias por tu ayuda, amigo", trans: "Большое спасибо за помощь, друг", bank: ["Большое", "спасибо", "за", "помощь,", "друг", "пока"] }
      ],
      de: [
        { orig: "Guten Tag, wie geht es Ihnen?", trans: "Добрый день, как ваши дела?", bank: ["Добрый", "день,", "как", "ваши", "дела?", "вечер"] },
        { orig: "Ich lerne gerne Deutsch", trans: "Я с удовольствием учу немецкий", bank: ["Я", "с", "удовольствием", "учу", "немецкий", "он"] },
        { orig: "Das Haus ist sehr groß und schön", trans: "Дом очень большой и красивый", bank: ["Дом", "очень", "большой", "и", "красивый", "сад"] },
        { orig: "Wir trinken morgens frischen Tee", trans: "Мы пьём свежий чай по утрам", bank: ["Мы", "пьём", "свежий", "чай", "по", "утрам"] }
      ],
      fr: [
        { orig: "Bonjour, comment allez-vous aujourd'hui?", trans: "Здравствуйте, как ваши дела сегодня?", bank: ["Здравствуйте,", "как", "ваши", "дела", "сегодня?", "привет"] },
        { orig: "J'aime la musique et les voyages", trans: "Я люблю музыку и путешествия", bank: ["Я", "люблю", "музыку", "и", "путешествия", "книги"] },
        { orig: "Le chat dort dans le jardin", trans: "Кошка спит в саду", bank: ["Кошка", "спит", "в", "саду", "доме", "собака"] }
      ],
      it: [
        { orig: "Ciao, come stai oggi?", trans: "Привет, как ты сегодня?", bank: ["Привет,", "как", "ты", "сегодня?", "отлично", "друг"] },
        { orig: "Bevo un caffè caldo ogni mattina", trans: "Я пью горячий кофе каждое утро", bank: ["Я", "пью", "горячий", "кофе", "каждое", "утро"] },
        { orig: "Questa città è molto bella", trans: "Этот город очень красивый", bank: ["Этот", "город", "очень", "красивый", "большой"] }
      ],
      pt: [
        { orig: "Olá, tudo bem com você?", trans: "Привет, у тебя всё хорошо?", bank: ["Привет,", "у", "тебя", "всё", "хорошо?", "спасибо"] },
        { orig: "Eu gosto de aprender novos idiomas", trans: "Мне нравится учить новые языки", bank: ["Мне", "нравится", "учить", "новые", "языки", "книги"] },
        { orig: "O sol brilha no céu azul", trans: "Солнце светит на голубом небе", bank: ["Солнце", "светит", "на", "голубом", "небе"] }
      ],
      tr: [
        { orig: "Merhaba, bugün nasılsın?", trans: "Привет, как ты сегодня?", bank: ["Привет,", "как", "ты", "сегодня?", "хорошо"] },
        { orig: "Ben her sabah taze çay içerim", trans: "Я пью свежий чай каждое утро", bank: ["Я", "пью", "свежий", "чай", "каждое", "утро"] },
        { orig: "Türkçe öğrenmek çok ilginç", trans: "Учить турецкий очень интересно", bank: ["Учить", "турецкий", "очень", "интересно", "сложно"] }
      ],
      ar: [
        { orig: "مرحبا، كيف حالك اليوم؟", trans: "Привет, как твои дела сегодня?", bank: ["Привет,", "как", "твои", "дела", "сегодня?", "хорошо"] },
        { orig: "أحب قراءة الكتب في الصباح", trans: "Я люблю читать книги по утрам", bank: ["Я", "люблю", "читать", "книги", "по", "утрам"] },
        { orig: "هذا بيت جميل وكبير", trans: "Это красивый и большой дом", bank: ["Это", "красивый", "и", "большой", "дом", "сад"] }
      ],
      zh: [
        { orig: "你好，很高兴认识你", trans: "Привет, очень приятно познакомиться", bank: ["Привет,", "очень", "приятно", "познакомиться", "друг"] },
        { orig: "我想喝一杯热茶", trans: "Я хочу выпить чашку горячего чая", bank: ["Я", "хочу", "выпить", "чашку", "горячего", "чая"] },
        { orig: "今天天气真好", trans: "Сегодня прекрасная погода", bank: ["Сегодня", "прекрасная", "погода", "солнце"] }
      ],
      ja: [
        { orig: "こんにちは、元気ですか？", trans: "Привет, как твои дела?", bank: ["Привет,", "как", "твои", "дела?", "спасибо"] },
        { orig: "私は毎日日本語を勉強しています", trans: "Я каждый день изучаю японский язык", bank: ["Я", "каждый", "день", "изучаю", "японский", "язык"] },
        { orig: "猫は部屋で眠っています", trans: "Кошка спит в комнате", bank: ["Кошка", "спит", "в", "комнате", "собака"] }
      ],
      ko: [
        { orig: "안녕하세요, 오늘 기분이 어때요?", trans: "Здравствуйте, как ваше настроение сегодня?", bank: ["Здравствуйте,", "как", "ваше", "настроение", "сегодня?"] },
        { orig: "저는 한국어를 열심히 배웁니다", trans: "Я усердно учу корейский язык", bank: ["Я", "усердно", "учу", "корейский", "язык"] },
        { orig: "날씨가 아주 맑고 따뜻해요", trans: "Погода очень ясная и тёплая", bank: ["Погода", "очень", "ясная", "и", "тёплая"] }
      ],
      uk: [
        { orig: "Привіт! Як твої справи сьогодні?", trans: "Привет! Как твои дела сегодня?", bank: ["Привет!", "Как", "твои", "дела", "сегодня?"] },
        { orig: "Я люблю читати цікаві книжки", trans: "Я люблю читать интересные книги", bank: ["Я", "люблю", "читать", "интересные", "книги"] }
      ],
      be: [
        { orig: "Прывітанне! Як твае справы?", trans: "Привет! Как твои дела?", bank: ["Привет!", "Как", "твои", "дела?", "хорошо"] },
        { orig: "Я вывучаю родную мову", trans: "Я изучаю родной язык", bank: ["Я", "изучаю", "родной", "язык", "школу"] }
      ],
      kk: [
        { orig: "Сәлем! Қалың қалай?", trans: "Привет! Как дела?", bank: ["Привет!", "Как", "дела?", "хорошо", "друг"] },
        { orig: "Мен қазақ тілін үйреніп жүрмін", trans: "Я изучаю казахский язык", bank: ["Я", "изучаю", "казахский", "язык", "мы"] }
      ],
      uz: [
        { orig: "Salom! Ishlaringiz qalay?", trans: "Привет! Как ваши дела?", bank: ["Привет!", "Как", "ваши", "дела?", "отлично"] },
        { orig: "Men o'zbek tilini o'rganyapman", trans: "Я изучаю узбекский язык", bank: ["Я", "изучаю", "узбекский", "язык", "мы"] }
      ],
      chess: [
        { orig: "Как называется одновременное нападение на две фигуры соперника?", trans: "Вилка", bank: ["Вилка", "Связка", "Рокировка", "Пат"] },
        { orig: "Какая фигура может перепрыгивать через другие фигуры?", trans: "Конь", bank: ["Конь", "Слон", "Ладья", "Ферзь"] }
      ],
      coding: [
        { orig: "Какая структура данных работает по принципу LIFO (последним пришёл — первым вышел)?", trans: "Стек", bank: ["Стек", "Очередь", "Массив", "Граф"] },
        { orig: "Какой протокол используется для защищённого веб-соединения?", trans: "HTTPS", bank: ["HTTPS", "FTP", "SMTP", "UDP"] }
      ],
      sv: [
        { orig: "Hej! Hur mår du idag?", trans: "Привет! Как у тебя дела сегодня?", bank: ["Привет!", "Как", "у", "тебя", "дела", "сегодня?"] },
        { orig: "Jag lär mig svenska varje dag", trans: "Я учу шведский каждый день", bank: ["Я", "учу", "шведский", "каждый", "день", "книга"] },
        { orig: "Tack så mycket för hjälpen", trans: "Большое спасибо за помощь", bank: ["Большое", "спасибо", "за", "помощь", "пожалуйста"] },
      ],
      no: [
        { orig: "Hei! Hvordan har du det?", trans: "Привет! Как твои дела?", bank: ["Привет!", "Как", "твои", "дела?", "хорошо"] },
        { orig: "Jeg studerer norsk med glede", trans: "Я с радостью изучаю норвежский", bank: ["Я", "с", "радостью", "изучаю", "норвежский", "язык"] },
        { orig: "Tusen takk for hjelpen", trans: "Большое спасибо за помощь", bank: ["Большое", "спасибо", "за", "помощь", "друг"] },
      ],
      la: [
        { orig: "Salve, amice! Quid agis?", trans: "Здравствуй, друг! Как поживаешь?", bank: ["Здравствуй,", "друг!", "Как", "поживаешь?", "хорошо"] },
        { orig: "Linguam Latinam disco", trans: "Я изучаю латинский язык", bank: ["Я", "изучаю", "латинский", "язык", "книгу"] },
        { orig: "Gratias tibi ago, magister", trans: "Благодарю тебя, учитель", bank: ["Благодарю", "тебя,", "учитель", "друг", "спасибо"] },
      ],
      tt: [
        { orig: "Сәлам! Хәлләрең ничек?", trans: "Привет! Как твои дела?", bank: ["Привет!", "Как", "твои", "дела?", "рәхмәт"] },
        { orig: "Мин татар телен өйрәнәм", trans: "Я изучаю татарский язык", bank: ["Я", "изучаю", "татарский", "язык", "мы"] },
        { orig: "Ярдәмең өчен бик зур рәхмәт", trans: "Большое спасибо за твою помощь", bank: ["Большое", "спасибо", "за", "твою", "помощь"] },
      ],
      hv: [
        { orig: "Rytsas, raqiros!", trans: "Привет, друг!", bank: ["Привет,", "друг!", "хорошо", "спасибо"] },
        { orig: "Valyrio udrāzma iksan", trans: "Я говорю на высоком валирийском", bank: ["Я", "говорю", "на", "высоком", "валирийском"] },
        { orig: "Kirimvose, nyke sȳz iksan", trans: "Спасибо, у меня всё хорошо", bank: ["Спасибо,", "у", "меня", "всё", "хорошо"] },
      ],
      yi: [
        { orig: "שלום עליכם, מיין פריינט!", trans: "Мир вам, мой друг!", bank: ["Мир", "вам,", "мой", "друг!", "привет"] },
        { orig: "איך לערן ייִדיש יעדן טאָג", trans: "Я учу идиш каждый день", bank: ["Я", "учу", "идиш", "каждый", "день"] },
      ],
      he: [
        { orig: "שלום! מה שלומך היום?", trans: "Привет! Как твои дела сегодня?", bank: ["Привет!", "Как", "твои", "дела", "сегодня?"] },
        { orig: "אני לומד עברית כל יום", trans: "Я изучаю иврит каждый день", bank: ["Я", "изучаю", "иврит", "каждый", "день"] },
      ],
      mo: [
        { orig: "Salut! Ce mai faci astăzi?", trans: "Привет! Как дела сегодня?", bank: ["Привет!", "Как", "дела", "сегодня?", "хорошо"] },
        { orig: "Eu învăț limba română cu plăcere", trans: "Я учу язык с удовольствием", bank: ["Я", "учу", "язык", "с", "удовольствием"] },
      ],
      lt: [
        { orig: "Labas! Kaip sekasi šiandien?", trans: "Привет! Как дела сегодня?", bank: ["Привет!", "Как", "дела", "сегодня?", "спасибо"] },
        { orig: "Aš mokausi lietuvių kalbos", trans: "Я изучаю литовский язык", bank: ["Я", "изучаю", "литовский", "язык"] },
      ],
      lv: [
        { orig: "Sveiki! Kā jums klājas?", trans: "Привет! Как у вас дела?", bank: ["Привет!", "Как", "у", "вас", "дела?"] },
        { orig: "Es mācos latviešu valodu", trans: "Я изучаю латышский язык", bank: ["Я", "изучаю", "латышский", "язык"] },
      ],
      et: [
        { orig: "Tere! Kuidas sul täna läheb?", trans: "Привет! Как у тебя сегодня дела?", bank: ["Привет!", "Как", "у", "тебя", "сегодня", "дела?"] },
        { orig: "Ma õpin eesti keelt", trans: "Я изучаю эстонский язык", bank: ["Я", "изучаю", "эстонский", "язык"] },
      ],
      ka: [
        { orig: "გამარჯობა! როგორ ხარ დღეს?", trans: "Привет! Как ты сегодня?", bank: ["Привет!", "Как", "ты", "сегодня?", "хорошо"] },
        { orig: "მე ვსწავლობ ქართულ ენას", trans: "Я изучаю грузинский язык", bank: ["Я", "изучаю", "грузинский", "язык"] },
      ],
      hy: [
        { orig: "Բարև ձեզ, ինչպե՞ս եք", trans: "Здравствуйте, как ваши дела?", bank: ["Здравствуйте,", "как", "ваши", "дела?"] },
        { orig: "Ես սովորում եմ հայերեն", trans: "Я изучаю армянский язык", bank: ["Я", "изучаю", "армянский", "язык"] },
      ],
      az: [
        { orig: "Salam! Bu gün necəsən?", trans: "Привет! Как ты сегодня?", bank: ["Привет!", "Как", "ты", "сегодня?", "хорошо"] },
        { orig: "Mən Azərbaycan dilini öyrənirəm", trans: "Я изучаю азербайджанский язык", bank: ["Я", "изучаю", "азербайджанский", "язык"] },
      ],
      ky: [
        { orig: "Салам! Кандайсың досум?", trans: "Привет! Как дела, друг?", bank: ["Привет!", "Как", "дела,", "друг?"] },
        { orig: "Мен кыргыз тилин үйрөнүп жатам", trans: "Я изучаю киргизский язык", bank: ["Я", "изучаю", "киргизский", "язык"] },
      ],
      tk: [
        { orig: "Salam! Ýagdaýlaryňyz nähili?", trans: "Привет! Как ваши дела?", bank: ["Привет!", "Как", "ваши", "дела?"] },
        { orig: "Men türkmen dilini öwrenýärin", trans: "Я изучаю туркменский язык", bank: ["Я", "изучаю", "туркменский", "язык"] },
      ],
      tg: [
        { orig: "Салом! Аҳволатон чӣ тавр аст?", trans: "Привет! Как ваше самочувствие?", bank: ["Привет!", "Как", "ваше", "самочувствие?"] },
        { orig: "Ман забони тоҷикиро меомӯзам", trans: "Я изучаю таджикский язык", bank: ["Я", "изучаю", "таджикский", "язык"] },
      ],
      tlh: KLINGON_SENTENCES.map((s) => ({
        orig: s.tlhLatn,
        trans: userLanguage === 'en' ? s.en : s.ru,
        bank: userLanguage === 'en' ? s.bankEn : s.bankRu,
      })),
      art: [
        { orig: "Какие три цвета являются основными в живописи?", trans: "Красный, жёлтый, синий", bank: ["Красный,", "жёлтый,", "синий", "Зелёный"] },
        { orig: "Как называется техника письма по сырой штукатурке?", trans: "Фреска", bank: ["Фреска", "Акварель", "Гравюра", "Пастель"] }
      ]
    };

    const effectiveBankKey = subjectId in hardestFallbacks
      ? subjectId
      : subjectId.startsWith('rf-')
        ? (subjectId.includes('chuvash') ? 'cv' : 'ru')
        : '';

    if (effectiveBankKey && hardestFallbacks[effectiveBankKey]) {
      const list = hardestFallbacks[effectiveBankKey];
      const item = list[Math.floor(Math.random() * list.length)];
      // Klingon course removes speaking ('speech') exercises and converts them to listening/translation
      const safeType =
        subjectId === 'tlh'
          ? (type === 'listening' ? 'listening' : 'translation')
          : ((type === 'listening' || type === 'speech') ? type : 'translation');
      return {
        id: crypto.randomUUID(),
        type: safeType,
        originalSentence: item.orig,
        targetTranslation: item.trans,
        wordBank: [...item.bank].sort(() => Math.random() - 0.5),
        isFallback: true
      };
    }

    if (subjectId.startsWith('rf-')) {
        return {
            id: crypto.randomUUID(), type: 'translation', originalSentence: `Это регион РФ: ${sanitizeSubjectName(subjectName)}?`,
            targetTranslation: "Да", wordBank: ["Да", "Нет", "Возможно", "Не знаю"], isFallback: true
        };
    }

    // Dynamic procedural sentence builder (for 'en'/'ru'/unknown only if not covered above)
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
      { en: "drinks hot coffee", ru: "пьёт горячий кофе" },
      { en: "listens to quiet music", ru: "слушает тихую музыку" },
      { en: "cooks a tasty dinner", ru: "готовит вкусный ужин" },
      { en: "buys fresh fruits", ru: "покупает свежие фрукты" },
      { en: "walks in the green park", ru: "гуляет в зеленом парке" },
      { en: "plays guitar", ru: "играет на гитаре" },
      { en: "writes a long letter", ru: "пишет длинное письмо" },
      { en: "watches a funny comedy", ru: "смотрит веселую комедию" }
    ];

    const procModifiers = [
      { en: "every morning", ru: "каждое утро" },
      { en: "in summer", ru: "летом" },
      { en: "in winter", ru: "зимой" },
      { en: "after work", ru: "после работы" },
      { en: "on weekends", ru: "по выходным" },
      { en: "today", ru: "сегодня" },
      { en: "in the evening", ru: "вечером" }
    ];

    const subj = procSubjects[Math.floor(Math.random() * procSubjects.length)];
    const act = procActions[Math.floor(Math.random() * procActions.length)];
    const mod = procModifiers[Math.floor(Math.random() * procModifiers.length)];

    const isEngUi = userLanguage === 'en';
    const isRuTarget = subjectId === 'ru';
    const orig = isRuTarget ? `${subj.ru} ${act.ru} ${mod.ru}` : `${subj.en} ${act.en} ${mod.en}`;
    const target = isRuTarget ? `${subj.en} ${act.en} ${mod.en}` : (isEngUi ? `${subj.en} ${act.en} ${mod.en}` : `${subj.ru} ${act.ru} ${mod.ru}`);

    const rawTokens = target.split(' ').filter(Boolean);
    const distractorsPool = isRuTarget || isEngUi
      ? ["quickly", "slowly", "yesterday", "tomorrow", "happy", "home"]
      : ["быстро", "медленно", "дома", "вчера", "завтра", "очень", "друзья"];
    const extraDistractors = distractorsPool.filter(d => !rawTokens.includes(d)).slice(0, 3);
    const wordBank = [...rawTokens, ...extraDistractors].sort(() => Math.random() - 0.5);

    return {
        id: crypto.randomUUID(), 
        type: type || 'translation', 
        originalSentence: orig, 
        targetTranslation: target,
        wordBank, 
        isFallback: true
    };
};

export const OFFLINE_INTERNET_REQUIRED_MESSAGE =
  'Нет подключения к интернету. Для работы DuoWindo6601 нужен интернет. Включите Wi-Fi или мобильные данные и попробуйте снова';

export const notifyNetworkOffline = (): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('duowindo_network_offline'));
  }
};

export const isNetworkDisconnectError = (err: unknown): boolean => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  const msg = String((err as any)?.message || err || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('err_internet_disconnected') ||
    msg.includes('network request failed')
  );
};

export const generateExercise = async (
    targetSubject: string, subjectId: string, isLanguage: boolean = true,
    type: Exercise['type'] = 'translation', isPro: boolean = false, customTopic?: string,
    userLanguage: string = 'ru',
    difficultyLevel: 'easy' | 'hard' = 'easy'
): Promise<Exercise> => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error(OFFLINE_INTERNET_REQUIRED_MESSAGE);
  }

  const cleanTargetSubject = sanitizeSubjectName(targetSubject);
  const model = isPro ? MODEL_PRO : MODEL_FREE;
  const topic = (customTopic && customTopic.trim()) ? customTopic : TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const nonce = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  const difficultyInstruction = difficultyLevel === 'hard'
    ? 'УРОВЕНЬ СЛОЖНОСТИ: СЛОЖНЫЙ УРОВЕНЬ (Hard B2–C1). Используй более длинные, содержательные и грамматически богатые предложения (8–14 слов), продвинутую лексику, сложные времена/обороты и тонкие, близкие по форме слова-дистракторы.'
    : 'УРОВЕНЬ СЛОЖНОСТИ: ЛЁГКИЙ УРОВЕНЬ (Easy A1). Используй короткие, простые и понятные начинающим фразы (3–5 слов), базовую повседневную лексику и простые слова-дистракторы.';

  const speakerLangNames: Record<string, string> = {
    ru: 'русский язык (Russian)',
    en: 'English',
    de: 'Deutsch (German)',
    fr: 'Français (French)',
    es: 'Español (Spanish)',
    ja: '日本語 (Japanese)',
    zh: '中文 (Chinese)',
    ar: 'العربية (Arabic)',
    pt: 'Português (Portuguese)',
    it: 'Italiano (Italian)',
    tr: 'Türkçe (Turkish)',
    ko: '한국어 (Korean)',
    hi: 'हिन्दी (Hindi)',
    pl: 'Polski (Polish)'
  };
  const translationLangName = speakerLangNames[userLanguage] || 'русский язык (Russian)';

  const isChuvash = subjectId === 'cv' || subjectId === 'rf-chuvash' || cleanTargetSubject.toLowerCase().includes('чуваш') || cleanTargetSubject.toLowerCase().includes('chuvash');

  const effectiveType: Exercise['type'] = subjectId === 'tlh' && type === 'speech' ? 'listening' : type;

  let prompt = '';
  if (subjectId === 'tlh') {
    prompt = `Ты создаешь упражнение для курса КЛИНГОНСКОГО ЯЗЫКА (tlhIngan Hol / Klingon language, орфография tlh_Latn по словарю PanderMusubi/klingon и hol.kag.org).
${difficultyInstruction}
Тип упражнения: "${effectiveType}" (режим речи отключён; используются перевод и аудирование).
Обязательно используй строгую каноническую клингонскую орфографию (чувствительную к регистру: D, H, I, Q, S — заглавные; ch, gh, ng, tlh, ’ — канонические графемы; реальные слова вроде nuqneH, Qapla’, tlhIngan Hol, batlh, Duj, HoD, SuvwI’, HIja’, ghobe’, qatlho’, jIyaj, bIQ, Soj, paq, logh).
Тема урока: ${topic}.

Строгая структура JSON:
- originalSentence: аутентичная фраза СТРОГО на клингонском (tlhIngan Hol, tlh_Latn) без перевода в скобках.
- targetTranslation: точный перевод СТРОГО на ${translationLangName}.
- wordBank: массив отдельных слов из targetTranslation плюс 3-4 дистрактора на ${translationLangName}.
Код уникальности: ${nonce}.`;
  } else if (isChuvash) {
    prompt = `Ты создаешь упражнение для курса ЧУВАШСКОГО ЯЗЫКА (Чӑвашла / Chuvash language).
${difficultyInstruction}
Упражнение должно быть ИСКЛЮЧИТЕЛЬНО на ЧУВАШСКОМ и ${translationLangName} языках.
Тема урока: ${topic}. Тип упражнения: "${effectiveType}".
Обязательно используй настоящие чувашские буквы: Ӑ, Ӗ, Ҫ, Ӳ (например: ырӑ кун, салам, тавах, эпӗ, эсир, вӗренетӗп, юлташ, ҫӗршыв, шкул, кӗнеке, пурнӑҫ, апат, ҫӑкӑр, шыв).

Строгая структура JSON:
- originalSentence: фраза СТРОГО на чувашском языке (Чӑвашла).
- targetTranslation: правильный перевод СТРОГО на ${translationLangName}.
- wordBank: массив отдельных слов из targetTranslation плюс 3-4 похожих слова-дистрактора на ${translationLangName}.
Код уникальности: ${nonce}.`;
  } else if (subjectId === 'math') {
    prompt = `Сгенерируй случайное математическое задание для школьного курса "Математика (1–11 классы)".
${difficultyLevel === 'hard'
  ? 'УРОВЕНЬ СЛОЖНОСТИ: СЛОЖНЫЙ (Hard • 8–11 классы, олимпиадные задачи, логарифмы, тригонометрия, степени, квадратные уравнения, производные).'
  : 'УРОВЕНЬ СЛОЖНОСТИ: ЛЁГКИЙ (Easy • 1–5 классы, простая арифметика, устный счёт, простые дроби и базовые уравнения).'}
Оригинал ("originalSentence") — математическое выражение или условие задачи на языке ${translationLangName}.
Перевод ("targetTranslation") — правильный числовой ответ или формула.
"wordBank" — массив, содержащий правильный ответ и 3 разумных числовых дистрактора.
Код уникальности: ${nonce}.`;
  } else if (subjectId === 'music') {
    prompt = `Сгенерируй обучающее задание по МУЗЫКЕ (нотная грамота, сольфеджио, теория музыки, интервалы, аккорды, длительности, музыкальные инструменты, композиторы) для обучающегося на языке ${translationLangName}.
${difficultyInstruction}
Оригинал ("originalSentence") — вопрос или задача по музыке на языке ${translationLangName}.
Перевод ("targetTranslation") — правильный ответ на языке ${translationLangName}.
"wordBank" — массив из 4 вариантов (правильный ответ и 3 правдоподобных дистрактора).
Код уникальности: ${nonce}.`;
  } else if (subjectId === 'chess') {
    prompt = `Сгенерируй обучающее задание по ШАХМАТАМ (тактика, дебюты, шахматные правила, ценность фигур, термины, матовые конструкции) для обучающегося на языке ${translationLangName}.
${difficultyInstruction}
Оригинал ("originalSentence") — шахматная задача или вопрос на языке ${translationLangName}.
Перевод ("targetTranslation") — правильный ответ на языке ${translationLangName}.
"wordBank" — массив из 4 вариантов (правильный ответ и 3 дистрактора).
Код уникальности: ${nonce}.`;
  } else if (subjectId === 'coding') {
    const codingFocus = (customTopic && customTopic.trim())
      ? customTopic
      : 'Lua (скрипты для игр, расширение приложений, легковесный код), Swift и экосистема Apple (iOS/macOS, Objective-C, Xcode только на Mac, SwiftUI, UIKit, AppKit), Android (Kotlin, Java, C++ через Android NDK, Android Studio, Gradle, Jetpack Compose, XML, Flutter на Dart, React Native на JS), 5 этапов создания приложения (.aab), и сборка APK (build.gradle.kts, app-debug.apk, KeyStore .jks, ./gradlew assembleDebug / assembleRelease, Windows gradlew, конструктор Andromo)';
    prompt = `Сгенерируй УНИКАЛЬНОЕ обучающее задание по ПРОГРАММИРОВАНИЮ И РАЗРАБОТКЕ ПРИЛОЖЕНИЙ на языке ${translationLangName}.
${difficultyInstruction}
Фокус темы: ${codingFocus}.
Обязательно опирайся на реальные инструменты стека: Lua, Swift, Xcode, SwiftUI, UIKit, AppKit, Objective-C, Kotlin, Java, C++ Android NDK, Android Studio, Gradle, Jetpack Compose, XML, Flutter (Dart), React Native, Android App Bundle (.aab), build.gradle.kts, app-debug.apk, KeyStore (.jks), ./gradlew assembleDebug / assembleRelease, конструкторы вроде Andromo.
Строгая структура JSON:
- originalSentence: чёткий технический вопрос или мини-задача по выбранной теме на ${translationLangName}.
- targetTranslation: краткий точный правильный ответ (1–4 слова) на ${translationLangName} или название инструмента/команды.
- wordBank: массив слов из правильного ответа (или 1-4 токена) + 3 правдоподобных дистрактора из того же стека технологий.
Код уникальности: ${nonce}.`;
  } else if (subjectId === 'art') {
    prompt = `Сгенерируй обучающее задание по предмету "${cleanTargetSubject}" на языке ${translationLangName}.
${difficultyInstruction}
Оригинал ("originalSentence") — вопрос или задача по предмету на языке ${translationLangName}.
Перевод ("targetTranslation") — краткий правильный ответ (1–3 слова) на языке ${translationLangName}.
"wordBank" — массив из слов правильного ответа и 3 дистракторов.
Код уникальности: ${nonce}.`;
  } else if (isLanguage) {
    const isSameLang = subjectId === userLanguage;
    prompt = isSameLang
      ? `Сгенерируй УНИКАЛЬНОЕ упражнение типа "${type}" на языке "${cleanTargetSubject}" (код: ${subjectId}). Тема: ${topic}.
${difficultyInstruction}
Поскольку изучаемый язык совпадает с языком интерфейса (${translationLangName}):
- "originalSentence": естественное предложение на языке ${cleanTargetSubject}.
- "targetTranslation": синонимичная перефразировка или точное объяснение смысла предложения на ${translationLangName} (без английских вставок!).
- "wordBank": массив отдельных слов для составления "targetTranslation" + 3-4 дистрактора.
Код уникальности: ${nonce}.`
      : `Сгенерируй СЛУЧАЙНОЕ, УНИКАЛЬНОЕ И РАЗНООБРАЗНОЕ упражнение типа "${type}" для изучения языка: "${cleanTargetSubject}" (код курса: ${subjectId}). Тема: ${topic}.
${difficultyInstruction}
Язык изучаемого предмета: ${cleanTargetSubject}.
Язык интерфейса/перевода обучающегося: ${translationLangName}.
СТРОГОЕ ПРАВИЛО НАПРАВЛЕНИЯ:
- Поле "originalSentence" ДОЛЖНО быть написано ТОЛЬКО на изучаемом языке (${cleanTargetSubject}). Ни в коем случае не пиши его на ${translationLangName} и не добавляй перевод в скобках!
- Поле "targetTranslation" ДОЛЖНО быть точным переводом, написанным ТОЛЬКО на языке пользователя (${translationLangName}).
- Поле "wordBank" ДОЛЖНО содержать ВСЕ слова из "targetTranslation" + 3-4 правдоподобных слова-дистрактора на языке пользователя (${translationLangName}).
НЕ меняй языки местами! Код уникальности: ${nonce}.`;
  } else {
    prompt = `Сгенерируй новую УНИКАЛЬНУЮ задачу для предмета "${cleanTargetSubject}" на языке интерфейса пользователя (${translationLangName}). ${difficultyInstruction}
- originalSentence: вопрос/задача на ${translationLangName}.
- targetTranslation: правильный ответ на ${translationLangName}.
- wordBank: массив из правильного ответа и 3 дистракторов.
Код уникальности: ${nonce}.`;
  }

  try {
    const data = await fetchWithTimeout(callGeminiWithRetry(async () => {
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
      return extractJsonSafe<any>(response.text || '{}', {});
    }), 20000);

    const orig = String(data?.originalSentence || '').trim();
    const trans = String(data?.targetTranslation || '').trim();
    if (!orig || !trans) {
      throw new Error('Malformed exercise payload');
    }

    let bank: string[] = Array.isArray(data?.wordBank)
      ? data.wordBank.map((w: any) => String(w || '').trim()).filter(Boolean)
      : [];
    if (bank.length === 0) {
      bank = trans.split(/\s+/).filter(Boolean);
    }

    const exercise: Exercise = {
      id: crypto.randomUUID(),
      originalSentence: orig,
      targetTranslation: trans,
      wordBank: bank,
      hints: data?.hints,
      type: effectiveType,
      difficultyLevel
    };
    shownExerciseSentences.add(exercise.originalSentence);
    saveLessonToCache(subjectId, exercise);
    return exercise;
  } catch (error) {
    if (isNetworkDisconnectError(error)) {
      throw new Error(OFFLINE_INTERNET_REQUIRED_MESSAGE);
    }
    console.warn("API exercise generation failed/timed out, returning backup exercise:", error);
    return { ...getFallbackExercise(subjectId, effectiveType, cleanTargetSubject, userLanguage, customTopic, difficultyLevel), difficultyLevel };
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

  // Fast offline return when physically offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const isClose = normUser === normCorrect || 
      normUser.replace(/\s+/g, '') === normCorrect.replace(/\s+/g, '') ||
      (normCorrect.includes(normUser) && normUser.length >= 3);
    return { 
      isCorrect: isClose, 
      feedback: isClose ? "Правильно!" : `Правильный ответ: ${correctAnswer}`, 
      isFallback: false 
    };
  }

  try {
    const cleanSubject = sanitizeSubjectName(subject);
    const result = await fetchWithTimeout(callGeminiWithRetry(async () => {
      const ai = createGenAiClient();
      const response = await ai.models.generateContent({
        model: isMax ? MODEL_PRO : MODEL_FREE,
        contents: `I am studying "${cleanSubject}". 
        The target correct answer is: "${correctAnswer}".
        My answer was: "${userAnswer}".
        Is my answer correct or mathematically/semantically equivalent? (Allow small typos, spacing, or formatting differences).
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
      return extractJsonSafe<any>(response.text || '{}', {});
    }), 15000);
    if (typeof result?.isCorrect === 'boolean') {
      return {
        isCorrect: result.isCorrect,
        feedback: String(result.feedback || (result.isCorrect ? "Верно!" : `Правильный ответ: ${correctAnswer}`)),
        isFallback: false
      };
    }
    throw new Error('Invalid check JSON');
  } catch (e) {
    const isCorrect = normUser === normCorrect || (normCorrect.includes(normUser) && normUser.length >= 3);
    return { 
        isCorrect, 
        feedback: isCorrect ? "Правильно!" : `Правильный ответ: ${correctAnswer}`, 
        isFallback: false 
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
    if (isOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        throw new Error(OFFLINE_INTERNET_REQUIRED_MESSAGE);
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
            console.warn("MODEL_PRO explanation failed, trying primary server model...", e1);
            const response = await ai.models.generateContent({
                model: MODEL_FREE,
                contents: prompt
            });
            if (response.text?.trim()) return response.text.trim();
        }
    } catch (err) {
        if (isNetworkDisconnectError(err)) {
            throw new Error(OFFLINE_INTERNET_REQUIRED_MESSAGE);
        }
        console.warn("Gemini explanation error:", err);
        throw err;
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
    if (isNetworkDisconnectError(e)) {
      throw new Error(OFFLINE_INTERNET_REQUIRED_MESSAGE);
    }
    const cleaned = text.trim().toLowerCase().replace(/[.,!?;:]/g, '');
    if (CIS_OFFLINE_DICTIONARY[cleaned] && CIS_OFFLINE_DICTIONARY[cleaned][targetLang]) {
      return CIS_OFFLINE_DICTIONARY[cleaned][targetLang];
    }
    return text;
  }
}

export const startRoleplay = async (subject: string, subjectId: string, userLanguage: string = 'ru'): Promise<Exercise> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error(OFFLINE_INTERNET_REQUIRED_MESSAGE);
    }

    const cleanSubject = sanitizeSubjectName(subject);
    const sId = (subjectId || '').toLowerCase();
    const isNonLang = ['math', 'music', 'chess', 'coding', 'art'].includes(sId) || /матем|музык|шахмат|программ|рисован|каллиграф/i.test(subject);
    const isRuUi = userLanguage === 'ru' || userLanguage === 'Russian';
    const isArabic = sId === 'ar' || cleanSubject.toLowerCase().includes('араб') || cleanSubject.toLowerCase().includes('arabic');
    const isChuvash = sId === 'cv' || sId === 'rf-chuvash' || cleanSubject.toLowerCase().includes('чуваш') || cleanSubject.toLowerCase().includes('chuvash');

    const chuvashScenarios = [
        "Саламлашу тата паллашу (Знакомство и приветствие)",
        "Шкулта тата кӗнекесар библиотекара (В школе и библиотеке)",
        "Апатланни тата чей ӗҫни (За чаем и угощением)",
        "Тӑван ялти пурнӑҫ (В родной деревне)"
    ];

    const arabicScenarios = [
        "في المقهى (Заказ в арабском кафе)",
        "التعارف والتحية (Знакомство и приветствие)",
        "في السوق والتبضع (В магазине и на рынке)",
        "السفر في المطار (Путешествие и аэропорт)"
    ];

    const scenario = isChuvash
        ? chuvashScenarios[Math.floor(Math.random() * chuvashScenarios.length)]
        : isArabic
            ? arabicScenarios[Math.floor(Math.random() * arabicScenarios.length)]
            : isNonLang
                ? `${cleanSubject}: ${isRuUi ? 'Практический разбор темы' : 'Interactive Practice'}`
                : `${cleanSubject}: Everyday Conversation`;

    try {
        const firstMessage = await fetchWithTimeout(callGeminiWithRetry(async () => {
            const ai = createGenAiClient();
            const prompt = isNonLang
                ? `You are a friendly ${cleanSubject} tutor in an interactive dialogue. Communicate in ${isRuUi ? 'Russian' : 'English'}. Start with an engaging warm greeting and 1 interesting question or mini-challenge about ${cleanSubject}. Keep it 1-2 sentences.`
                : isChuvash
                    ? `Ты дружелюбный собеседник на ЧУВАШСКОМ ЯЗЫКЕ (Чӑвашла). Тема: "${scenario}". Поприветствуй собеседника на правильном чувашском языке (с буквами Ӑ, Ӗ, Ҫ, Ӳ), в скобках можно краткий перевод на русский. 1-2 коротких предложения. НИКАКОГО АНГЛИЙСКОГО!`
                    : isArabic
                        ? `You are an AI Arabic conversation partner in a roleplay. Scenario: "${scenario}". Greet the student in warm natural Arabic (with Russian/English translation in parentheses). When mentioning numbers or prices, display dual numerals: Western/European digits on the left and Eastern Arabic digits on the right (e.g. 1 / ١, 5 / ٥, 10 / ١٠). Do not replace modern European digits. Keep it 1-2 short sentences.`
                        : `Act as a friendly native tutor who speaks ${cleanSubject} (course code: ${subjectId}). Start a natural conversation STRICTLY in ${cleanSubject} on a realistic everyday topic (do NOT use generic placeholder phrases like "ready to order a coffee?" or "Welcome to conversation practice"). Keep it 1-2 short sentences and invite the student to reply in ${cleanSubject}.`;

            const response = await ai.models.generateContent({ model: MODEL_FREE, contents: prompt });
            const text = response.text?.trim();
            if (!text) {
                throw new Error('Empty Gemini response');
            }
            return text;
        }), 20000);
        return {
            id: crypto.randomUUID(), type: 'roleplay', originalSentence: scenario, targetTranslation: "", wordBank: [],
            roleplayData: { topic: scenario, messages: [{ role: 'model', text: firstMessage }], userTurn: true }
        };
    } catch (e) {
        if (isNetworkDisconnectError(e)) {
            throw new Error(OFFLINE_INTERNET_REQUIRED_MESSAGE);
        }
        throw e;
    }
};

export const replyToRoleplay = async (
    history: RoleplayMessage[],
    userMessageText: string,
    subject: string,
    isMax: boolean,
    userLanguage: string = 'ru',
    subjectId: string = ''
): Promise<RoleplayMessage> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error(OFFLINE_INTERNET_REQUIRED_MESSAGE);
    }
    const cleanSubject = sanitizeSubjectName(subject);
    const sId = (subjectId || '').toLowerCase();
    const isNonLang = ['math', 'music', 'chess', 'coding', 'art'].includes(sId) || /матем|музык|шахмат|программ|рисован|каллиграф/i.test(subject);
    const isRuUi = userLanguage === 'ru' || userLanguage === 'Russian';
    const isArabic = sId === 'ar' || cleanSubject.toLowerCase().includes('араб') || cleanSubject.toLowerCase().includes('arabic');
    const isChuvash = sId === 'cv' || sId === 'rf-chuvash' || cleanSubject.toLowerCase().includes('чуваш') || cleanSubject.toLowerCase().includes('chuvash');

    try {
         const data = await fetchWithTimeout(callGeminiWithRetry(async () => {
             const ai = createGenAiClient();
             const context = history.map(m => `${m.role}: ${m.text}`).join('\n');
             const roleInstruction = isNonLang
               ? `You are a warm, knowledgeable ${cleanSubject} tutor. Respond directly to what the user said in ${isRuUi ? 'Russian' : 'English'} with a helpful insight and a follow-up question.`
               : isChuvash
                 ? 'You are a warm friendly Chuvash language tutor from Cheboksary. Reply in natural authentic Chuvash (Чӑвашла) using letters Ӑ, Ӗ, Ҫ, Ӳ with brief Russian translation in parentheses. NEVER USE ENGLISH.'
                 : isArabic
                   ? 'You are a friendly Arabic language tutor. Reply in clear natural Arabic with RTL formatting. If numbers, prices or counts are mentioned, use dual Arabic numerals: European/Western digits on the left and Eastern Arabic digits on the right (e.g. 1 / ١, 5 / ٥, 10 / ١٠). Do not break modern digits. If user made a mistake in Arabic, provide a brief correction.'
                   : `You are a native tutor in ${cleanSubject}. Reply naturally, warmly, and directly to what the user just said STRICTLY in ${cleanSubject}. Never use generic canned placeholders. If the user made a grammar or vocabulary mistake, give a friendly concise correction.`;

             const prompt = `${context}\nUser: ${userMessageText}\n${roleInstruction}\nReturn valid JSON: { "text": "...", "correction": "..." }`;

             let response;
             try {
                 response = await ai.models.generateContent({
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
             } catch (primaryErr) {
                 if (isMax) {
                     response = await ai.models.generateContent({
                         model: MODEL_FREE,
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
                 } else {
                     throw primaryErr;
                 }
             }
             const raw = (response.text || '').trim();
             const parsed = extractJsonSafe<any>(raw, null);
             if (parsed && typeof parsed.text === 'string' && parsed.text.trim()) {
                 return parsed;
             }
             return { text: raw };
         }), 20000);
         if (!data?.text) {
             throw new Error('Empty Gemini roleplay response');
         }
         return { role: 'model', text: data.text, correction: data.correction };
    } catch (e) {
        if (isNetworkDisconnectError(e)) {
            throw new Error(OFFLINE_INTERNET_REQUIRED_MESSAGE);
        }
        throw e;
    }
};

const MINIMAL_PAIRS_BANK: Record<string, Array<{ wordA: string; wordB: string; diffRu: string; diffEn: string }>> = {
    eo: [
        { wordA: "ĉielo", wordB: "cielo", diffRu: "ĉielo [небо] (аффриката «ĉ» /ч/) против cielo [цель/мишень] (звук «c» /ц/).", diffEn: "ĉielo [sky] ('ĉ' /tʃ/) vs cielo [target/aim] ('c' /ts/)." },
        { wordA: "ŝipo", wordB: "sipo", diffRu: "ŝipo [корабль] (шипящая «ŝ» /ш/) против sipo [сифон] (свистящая «s» /с/).", diffEn: "ŝipo [ship] ('ŝ' /ʃ/) vs sipo [siphon] ('s' /s/)." },
        { wordA: "ĝardeno", wordB: "jardeno", diffRu: "ĝardeno [сад] (звонкая аффриката «ĝ» /дж/) против jardeno [ярды] (полугласный «j» /й/).", diffEn: "ĝardeno [garden] ('ĝ' /dʒ/) vs jardeno [yards] ('j' /j/)." },
        { wordA: "peco", wordB: "peso", diffRu: "peco [кусок, часть] (звук «c» /ц/) против peso [вес] (звук «s» /с/).", diffEn: "peco [piece] ('c' /ts/) vs peso [weight] ('s' /s/)." },
        { wordA: "koro", wordB: "korvo", diffRu: "koro [сердце] против korvo [ворон] — различие одного слога и согласного звука.", diffEn: "koro [heart] vs korvo [raven/crow]." },
        { wordA: "jaro", wordB: "ĉaro", diffRu: "jaro [год] (звук «j» /й/) против ĉaro [повозка] (звук «ĉ» /ч/).", diffEn: "jaro [year] ('j') vs ĉaro [cart] ('ĉ')." },
        { wordA: "lupo", wordB: "supo", diffRu: "lupo [волк] (звук «l») против supo [суп] (звук «s»).", diffEn: "lupo [wolf] ('l') vs supo [soup] ('s')." }
    ],
    id: [
        { wordA: "apel", wordB: "apel", diffRu: "В индонезийском «apel» с гласной /e/ означает яблоко, а с редуцированной /ə/ — построение/перекличку.", diffEn: "In Indonesian, 'apel' with /e/ is apple, while with /ə/ is roll call/assembly." },
        { wordA: "batu", wordB: "satu", diffRu: "batu [камень] (взрывной звонкий «b») против satu [один] (глухой щелевой «s»).", diffEn: "batu [stone] ('b') vs satu [one] ('s')." },
        { wordA: "pola", wordB: "pula", diffRu: "pola [узор/модель] (гласный «o») против pula [тоже/также] (гласный «u»).", diffEn: "pola [pattern] ('o') vs pula [too/also] ('u')." },
        { wordA: "mari", wordB: "mati", diffRu: "mari [давай/пойдём] (дрожащий «r») против mati [умереть/мёртвый] (взрывной «t»).", diffEn: "mari [come on] ('r') vs mati [dead] ('t')." },
        { wordA: "baca", wordB: "kaca", diffRu: "baca [читать] (звонкий «b») против kaca [стекло/зеркало] (глухой «k»).", diffEn: "baca [read] ('b') vs kaca [glass] ('k')." },
        { wordA: "kiri", wordB: "kira", diffRu: "kiri [лево] (конечный гласный «i») против kira [думать/считать] (гласный «a»).", diffEn: "kiri [left] ('i') vs kira [guess/think] ('a')." }
    ],
    es: [
        { wordA: "pero", wordB: "perro", diffRu: "pero [но] (краткий альвеолярный удар «r») против perro [собака] (яркая раскатистая вибрация «rr»).", diffEn: "pero [but] (single flap 'r') vs perro [dog] (trilled 'rr')." },
        { wordA: "caro", wordB: "carro", diffRu: "caro [дорогой] (одинарная «r») против carro [автомобиль/телега] (двойная «rr»).", diffEn: "caro [expensive] ('r') vs carro [car] ('rr')." },
        { wordA: "casa", wordB: "caza", diffRu: "casa [дом] (альвеолярный [s]) против caza [охота] (межзубный [θ] в Испании).", diffEn: "casa [house] ('s') vs caza [hunt] ('z' /θ/ in Castilian)." },
        { wordA: "peso", wordB: "beso", diffRu: "peso [вес] (глухой [p]) против beso [поцелуй] (звонкий [b]).", diffEn: "peso [weight] ('p') vs beso [kiss] ('b')." },
        { wordA: "año", wordB: "amo", diffRu: "año [год] (палатальный носовой «ñ» /ɲ/) против amo [хозяин/люблю] (губной «m»).", diffEn: "año [year] ('ñ' /ɲ/) vs amo [master/I love] ('m')." },
        { wordA: "cero", wordB: "cerro", diffRu: "cero [ноль] (краткая «r») против cerro [холм] (долгая раскатистая «rr»).", diffEn: "cero [zero] ('r') vs cerro [hill] ('rr')." }
    ],
    it: [
        { wordA: "casa", wordB: "cassa", diffRu: "casa [дом] (одинарная согласная «s») против cassa [касса/ящик] (удвоенная напряженная «ss»).", diffEn: "casa [house] (single 's') vs cassa [cashbox/crate] (geminate 'ss')." },
        { wordA: "note", wordB: "notte", diffRu: "note [ноты] (одинарный звук «t») против note [ночь] (удвоенный смычный звук «tt»).", diffEn: "note [musical notes] ('t') vs notte [night] ('tt')." },
        { wordA: "caro", wordB: "carro", diffRu: "caro [дорогой] (одинарная «r») против carro [повозка] (двойная «rr»).", diffEn: "caro [dear/expensive] ('r') vs carro [cart] ('rr')." },
        { wordA: "sete", wordB: "sette", diffRu: "sete [жажда] (одинарная «t») против sette [семь] (удвоенная «tt»).", diffEn: "sete [thirst] ('t') vs sette [seven] ('tt')." },
        { wordA: "pala", wordB: "palla", diffRu: "pala [лопата] (одинарная «l») против palla [мяч] (удвоенная «ll»).", diffEn: "pala [shovel] ('l') vs palla [ball] ('ll')." },
        { wordA: "rosa", wordB: "rossa", diffRu: "rosa [роза] (звонкая одиночная «s») против rossa [красная] (глухая удвоенная «ss»).", diffEn: "rosa [rose] (single 's') vs rossa [red fem.] (geminate 'ss')." }
    ],
    en: [
        { wordA: "ship", wordB: "sheep", diffRu: "ship [корабль] (краткий расслабленный [ɪ]) против sheep [овца] (долгий напряжённый [iː]).", diffEn: "ship (short lax /ɪ/) vs sheep (long tense /iː/)." },
        { wordA: "bit", wordB: "beat", diffRu: "bit [кусочек] (краткий звук [ɪ]) против beat [бить/ритм] (долгий гласный [iː]).", diffEn: "bit (short /ɪ/) vs beat (long /iː/)." },
        { wordA: "bed", wordB: "bad", diffRu: "bed [кровать] (гласный среднего подъема [e]) против bad [плохой] (широкий открытый [æ]).", diffEn: "bed (mid /e/) vs bad (open /æ/)." },
        { wordA: "tree", wordB: "three", diffRu: "tree [дерево] (взрывной альвеолярный [t]) против three [три] (глухой межзубный [θ]).", diffEn: "tree ('t') vs three ('th' /θ/)." },
        { wordA: "live", wordB: "leave", diffRu: "live [жить] (краткий [ɪ]) против leave [уходить] (долгий [iː]).", diffEn: "live (/lɪv/) vs leave (/liːv/)." },
        { wordA: "desk", wordB: "disk", diffRu: "desk [письменный стол] (гласный [e]) против disk [диск] (гласный [ɪ]).", diffEn: "desk (/e/) vs disk (/ɪ/)." }
    ],
    de: [
        { wordA: "bitten", wordB: "bieten", diffRu: "bitten [просить] (краткий [ɪ]) против bieten [предлагать] (долгий [iː]).", diffEn: "bitten (short /ɪ/) vs bieten (long /iː/)." },
        { wordA: "Stadt", wordB: "Staat", diffRu: "Stadt [город] (краткий открытый [a]) против Staat [государство] (долгий [aː]).", diffEn: "Stadt (short /a/) vs Staat (long /aː/)." },
        { wordA: "Miete", wordB: "Mitte", diffRu: "Miete [аренда] (долгий [iː]) против Mitte [середина] (краткий [ɪ]).", diffEn: "Miete (long /iː/) vs Mitte (short /ɪ/)." },
        { wordA: "Schule", wordB: "Schwüle", diffRu: "Schule [школа] (гласный [uː]) против Schwüle [духота] (умлаут [yː]).", diffEn: "Schule (/uː/) vs Schwüle (/yː/)." }
    ],
    fr: [
        { wordA: "poisson", wordB: "poison", diffRu: "poisson [рыба] (глухой согласный [s]) против poison [яд] (звонкий согласный [z]).", diffEn: "poisson [fish] (voiceless /s/) vs poison [poison] (voiced /z/)." },
        { wordA: "vin", wordB: "vent", diffRu: "vin [вино] (носовой гласный [ɛ̃]) против vent [ветер] (носовой гласный [ɑ̃]).", diffEn: "vin [wine] (nasal /ɛ̃/) vs vent [wind] (nasal /ɑ̃/)." },
        { wordA: "dessus", wordB: "dessous", diffRu: "dessus [наверху/над] (передний огубленный [y]) против dessous [внизу/под] (задний огубленный [u]).", diffEn: "dessus [above] (/y/) vs dessous [below] (/u/)." },
        { wordA: "rose", wordB: "rousse", diffRu: "rose [роза] (звонкий [z]) против rousse [рыжая] (глухой [s]).", diffEn: "rose (/z/) vs rousse (/s/)." }
    ],
    ru: [
        { wordA: "лук", wordB: "луг", diffRu: "«лук» (овощ/оружие) и «луг» (поляна) — оглушение звонкого согласного на конце слова в русском языке.", diffEn: "«лук» (onion/bow) vs «луг» (meadow) — terminal devoicing in Russian." },
        { wordA: "плод", wordB: "плот", diffRu: "«плод» (фрукт/результат) и «плот» (деревянный настил на воде) — парные по глухости-звонкости звуки.", diffEn: "«плод» (fruit) vs «плот» (raft) — voiced/voiceless pair." },
        { wordA: "мел", wordB: "мель", diffRu: "«мел» (твердый звук «л») против «мель» (мягкий звук «ль»).", diffEn: "«мел» (chalk, hard 'l') vs «мель» (shoal, soft 'l')." },
        { wordA: "быть", wordB: "бить", diffRu: "«быть» (твердый губной «б» и звук «ы») против «бить» (мягкий «б'» и гласный «и»).", diffEn: "«быть» (to be, hard 'b') vs «бить» (to hit, soft 'b')." }
    ],
    pt: [
        { wordA: "avô", wordB: "avó", diffRu: "avô [дедушка] (закрытое «ô» /o/) против avó [бабушка] (открытое «ó» /ɔ/).", diffEn: "avô [grandfather] (closed /o/) vs avó [grandmother] (open /ɔ/)." },
        { wordA: "pão", wordB: "pau", diffRu: "pão [хлеб] (носовой дифтонг «ão») против pau [палка] (чистый дифтонг «au»).", diffEn: "pão [bread] (nasal /ɐ̃w̃/) vs pau [stick] (oral /aw/)." },
        { wordA: "sede", wordB: "cede", diffRu: "sede [жажда/штаб] и cede [уступает] — тонкое различие закрытого/открытого гласного и ударения.", diffEn: "sede [thirst] vs cede [yields]." }
    ],
    tr: [
        { wordA: "kar", wordB: "kâr", diffRu: "kar [снег] (краткое твердое «k») против kâr [прибыль] (смягчённое «k» и долгий гласный).", diffEn: "kar [snow] vs kâr [profit] (palatalized 'k')." },
        { wordA: "on", wordB: "ön", diffRu: "on [десять] (гласный заднего ряда «o») против ön [перед] (огубленный передний «ö»).", diffEn: "on [ten] ('o') vs ön [front] ('ö')." },
        { wordA: "kız", wordB: "kıs", diffRu: "kız [девочка] (звонкое «z») против kıs [укороти] (глухое «s»).", diffEn: "kız [girl] ('z') vs kıs [shorten] ('s')." }
    ],
    ar: [
        { wordA: "كلب", wordB: "قلب", diffRu: "كلب [собака] (мягкое «ك» /k/) против قلب [сердце] (глубокий увулярный «ق» /q/).", diffEn: "كلب [dog] (/k/) vs قلب [heart] (uvular /q/)." },
        { wordA: "تين", wordB: "طين", diffRu: "تين [инжир] (обычный «ت» /t/) против طين [глина] (эмфатический «ط» /tˤ/).", diffEn: "تين [fig] (plain /t/) vs طين [clay] (emphatic /tˤ/)." },
        { wordA: "سيف", wordB: "صيف", diffRu: "سيف [меч] (обычный «س» /s/) против صيف [лето] (эмфатический «ص» /sˤ/).", diffEn: "سيف [sword] (/s/) vs صيف [summer] (/sˤ/)." }
    ],
    zh: [
        { wordA: "妈 (mā)", wordB: "马 (mǎ)", diffRu: "mā [мама] (1-й ровный высокий тон) против mǎ [лошадь] (3-й нисходяще-восходящий тон).", diffEn: "mā [mother] (1st tone) vs mǎ [horse] (3rd tone)." },
        { wordA: "买 (mǎi)", wordB: "卖 (mài)", diffRu: "mǎi [покупать] (3-й тон) против mài [продавать] (4-й резкий падающий тон).", diffEn: "mǎi [buy] (3rd tone) vs mài [sell] (4th tone)." },
        { wordA: "是 (shì)", wordB: "十 (shí)", diffRu: "shì [быть] (4-й падающий тон) против shí [десять] (2-й восходящий тон).", diffEn: "shì [be] (4th tone) vs shí [ten] (2nd tone)." }
    ],
    ja: [
        { wordA: "おばさん", wordB: "おばあさん", diffRu: "おばさん [тётя] (краткий гласный «а») против おばあさん [бабушка] (долгий гласный «аа»).", diffEn: "obasan [aunt] (short vowel) vs obaasan [grandmother] (long vowel)." },
        { wordA: "きて", wordB: "きって", diffRu: "きて [приходи] (одиночный «t») против きって [почтовая марка] (удвоенный смычный «tt» с паузой).", diffEn: "kite [come] vs kitte [stamp] (geminate 'tt')." },
        { wordA: "はし", wordB: "はしご", diffRu: "はし [палочки/мост] (высота тона) против はしご [лестница] (добавочный слог).", diffEn: "hashi [chopsticks/bridge] vs hashigo [ladder]." }
    ],
    ko: [
        { wordA: "불", wordB: "뿔", diffRu: "불 [огонь] (простой «ㅂ») против 뿔 [рог] (напряжённый удвоенный «ㅃ»).", diffEn: "불 [fire] (plain ㅂ) vs 뿔 [horn] (tense ㅃ)." },
        { wordA: "달", wordB: "탈", diffRu: "달 [луна] (простой «ㄷ») против 탈 [маска] (придыхательный «ㅌ»).", diffEn: "달 [moon] (plain ㄷ) vs 탈 [mask] (aspirated ㅌ)." },
        { wordA: "방", wordB: "빵", diffRu: "방 [комната] (простой «ㅂ») против 빵 [хлеб] (напряжённый «ㅃ»).", diffEn: "방 [room] (ㅂ) vs 빵 [bread] (ㅃ)." }
    ],
    cv: [
        { wordA: "ҫӑкӑр", wordB: "сакӑр", diffRu: "ҫӑкӑр [хлеб] (мягкий шипящий «ҫ» /ɕ/) против сакӑр [восемь] (твёрдый «с» /s/).", diffEn: "ҫӑкӑр [bread] ('ҫ') vs сакӑр [eight] ('с')." },
        { wordA: "кӳрӗ", wordB: "курӗ", diffRu: "кӳрӗ [сосед] (передний гласный «ӳ» /y/) против курӗ [увидит] (задний «у» /u/).", diffEn: "кӳрӗ [neighbor] ('ӳ') vs курӗ [will see] ('у')." },
        { wordA: "тӑр", wordB: "тур", diffRu: "тӑр [стой] (редуцированный «ӑ») против тур [бог/ветка] (полный «у»).", diffEn: "тӑр [stand] ('ӑ') vs тур ('у')." }
    ],
    uk: [
        { wordA: "кіт", wordB: "кит", diffRu: "кіт [кот] (мягкий «і») против кит [кит] (глубокий передне-средний «и»).", diffEn: "кіт [cat] (/i/) vs кит [whale] (/ɪ/)." },
        { wordA: "синій", wordB: "сильний", diffRu: "синій [синий] против сильний [сильный] — разница в согласном «л».", diffEn: "синій [blue] vs сильний [strong]." }
    ],
    kk: [
        { wordA: "қала", wordB: "қалы", diffRu: "қала [город] (конечный «а») против қалы [ковёр] (конечный «ы»).", diffEn: "қала [city] vs қалы [carpet]." },
        { wordA: "көз", wordB: "сөз", diffRu: "көз [глаз] (начальный «к») против сөз [слово] (начальный «с»).", diffEn: "көз [eye] vs сөз [word]." }
    ],
    pl: [
        { wordA: "kura", wordB: "góra", diffRu: "kura [курица] (глухой «k») против góra [гора] (звонкий «g», «ó» звучит как /u/).", diffEn: "kura [hen] ('k') vs góra [mountain] ('g')." },
        { wordA: "proszę", wordB: "prosie", diffRu: "proszę [пожалуйста] (носовой «ę» / шипящая «sz») против prosie [поросёнок].", diffEn: "proszę [please] vs prosie [piglet]." }
    ],
    hu: [
        { wordA: "kor", wordB: "kór", diffRu: "kor [возраст] (краткий «o») против kór [болезнь] (долгий «ó»).", diffEn: "kor [age] (short 'o') vs kór [disease] (long 'ó')." },
        { wordA: "örül", wordB: "őrül", diffRu: "örül [радуется] (краткий «ö») против őrül [сходит с ума] (долгий «ő»).", diffEn: "örül (short 'ö') vs őrül (long 'ő')." }
    ],
    fi: [
        { wordA: "tuli", wordB: "tuuli", diffRu: "tuli [огонь] (краткий «u») против tuuli [ветер] (долгий «uu»).", diffEn: "tuli [fire] (short 'u') vs tuuli [wind] (long 'uu')." },
        { wordA: "tapa", wordB: "tappa", diffRu: "tapa [привычка] (одиночный «p») против tappa [убить] (долгий «pp»).", diffEn: "tapa [habit] ('p') vs tappa ('pp')." }
    ],
    he: [
        { wordA: "קר", wordB: "כר", diffRu: "קר [холодный] и כר [подушка] — исторически разная артикуляция «ק» и «כ».", diffEn: "קר [cold] vs כר [pillow]." }
    ],
    hi: [
        { wordA: "पल", wordB: "फल", diffRu: "पल [мгновение] (непридыхательный «प» /p/) против फल [фрукт] (придыхательный «फ» /pʰ/).", diffEn: "पल [moment] (unaspirated /p/) vs फल [fruit] (aspirated /pʰ/)." }
    ],
    tlh: [
        { wordA: "Qapla’", wordB: "qaH", diffRu: "Qapla’ [успех!] (увулярная аффриката «Q» /q͡χ/) против qaH [сэр] (глухой взрывной «q» /qʰ/).", diffEn: "Qapla’ [success!] (uvular affricate Q /q͡χ/) vs qaH [sir] (uvular stop q /qʰ/)." },
        { wordA: "HoD", wordB: "ghom", diffRu: "HoD [капитан] (глухой хриплый «H» /x/) против ghom [группа] (звонкий фрикативный «gh» /ɣ/).", diffEn: "HoD [captain] (voiceless H /x/) vs ghom [group] (voiced gh /ɣ/)." },
        { wordA: "tlhIngan", wordB: "tI", diffRu: "tlhIngan [клингон] (латеральная аффриката «tlh» /t͡ɬʰ/) против tI [растение] (взрывной «t» /tʰ/).", diffEn: "tlhIngan [Klingon] (lateral affricate tlh /t͡ɬʰ/) vs tI [plant] (plain t /tʰ/)." },
        { wordA: "Duj", wordB: "juH", diffRu: "Duj [корабль] (ретрофлексный «D» /ɖ/) против juH [дом] (аффриката «j» /d͡ʒ/).", diffEn: "Duj [ship] (retroflex D /ɖ/) vs juH [home] (affricate j /d͡ʒ/)." },
        { wordA: "SoH", wordB: "choH", diffRu: "SoH [ты] (ретрофлексный «S» /ʂ/) против choH [изменение] (аффриката «ch» /t͡ʃ/).", diffEn: "SoH [you] (retroflex S /ʂ/) vs choH [change] (affricate ch /t͡ʃ/)." }
    ]
};

const getCuratedIllusion = (subject: string, subjectId: string): { soundText: string; optionA: string; optionB: string; correctOption: 'A' | 'B'; explanation: string } => {
    const sId = (subjectId || '').toLowerCase();
    const sName = sanitizeSubjectName(subject).toLowerCase();

    let langKey = '';
    if (MINIMAL_PAIRS_BANK[sId]) langKey = sId;
    else if (sId === 'tlh' || sName.includes('klingon') || sName.includes('клингон')) langKey = 'tlh';
    else if (sId === 'rf-chuvash' || sId === 'cv' || sName.includes('чуваш') || sName.includes('chuvash')) langKey = 'cv';
    else if (sId.includes('eo') || sName.includes('esperanto') || sName.includes('эсперанто')) langKey = 'eo';
    else if (sId.includes('id') || sName.includes('indones') || sName.includes('индонез')) langKey = 'id';
    else if (sId.includes('es') || sName.includes('span') || sName.includes('испан')) langKey = 'es';
    else if (sId.includes('it') || sName.includes('ital') || sName.includes('италь')) langKey = 'it';
    else if (sId.includes('de') || sName.includes('german') || sName.includes('немец')) langKey = 'de';
    else if (sId.includes('fr') || sName.includes('french') || sName.includes('франц')) langKey = 'fr';
    else if (sId.includes('pt') || sName.includes('portug') || sName.includes('португ')) langKey = 'pt';
    else if (sId.includes('tr') || sName.includes('turk') || sName.includes('турец')) langKey = 'tr';
    else if (sId.includes('ar') || sName.includes('arab') || sName.includes('араб')) langKey = 'ar';
    else if (sId.includes('zh') || sName.includes('chin') || sName.includes('китай')) langKey = 'zh';
    else if (sId.includes('ja') || sName.includes('japan') || sName.includes('япон')) langKey = 'ja';
    else if (sId.includes('ko') || sName.includes('korea') || sName.includes('корей')) langKey = 'ko';
    else if (sId.includes('uk') || sName.includes('ukrain') || sName.includes('украин')) langKey = 'uk';
    else if (sId.includes('kk') || sName.includes('kazakh') || sName.includes('казах')) langKey = 'kk';
    else if (sId.includes('pl') || sName.includes('polish') || sName.includes('польск')) langKey = 'pl';
    else if (sId.includes('hu') || sName.includes('hungar') || sName.includes('венгер')) langKey = 'hu';
    else if (sId.includes('fi') || sName.includes('finn') || sName.includes('финск')) langKey = 'fi';
    else if (sId.includes('he') || sName.includes('hebrew') || sName.includes('иврит')) langKey = 'he';
    else if (sId.includes('hi') || sName.includes('hindi') || sName.includes('хинди')) langKey = 'hi';
    else if (sId.includes('ru') || sId.startsWith('rf-') || sName.includes('russ') || sName.includes('русск')) langKey = 'ru';
    else langKey = 'en';

    const pairs = MINIMAL_PAIRS_BANK[langKey] || MINIMAL_PAIRS_BANK.en;
    const item = pairs[Math.floor(Math.random() * pairs.length)];

    const chooseA = Math.random() < 0.5;
    const swapOptions = Math.random() < 0.5;

    const optA = swapOptions ? item.wordB : item.wordA;
    const optB = swapOptions ? item.wordA : item.wordB;
    const correctOption: 'A' | 'B' = chooseA ? 'A' : 'B';
    const soundText = correctOption === 'A' ? optA : optB;

    return {
        soundText,
        optionA: optA,
        optionB: optB,
        correctOption,
        explanation: item.diffRu
    };
};

export const generateIllusion = async (subject: string, subjectId: string): Promise<Exercise> => {
    const cleanSubject = sanitizeSubjectName(subject);
    try {
        const data = await fetchWithTimeout(callGeminiWithRetry(async () => {
            const ai = createGenAiClient();
            const response = await ai.models.generateContent({
                model: MODEL_FREE,
                contents: `Generate a challenging Minimal Pair auditory discrimination exercise for a student learning ${cleanSubject} (code: ${subjectId}).
IMPORTANT RULES:
- NEVER use dummy, placeholder, or generic words like "Test", "Toast", "Sample", or "Hello".
- Provide two real, authentic words in ${cleanSubject} that sound very similar (minimal pair, e.g. vowel length, single vs double consonant, or subtle phoneme contrast).
- Choose one of them as 'soundText' (which the audio will pronounce).
- Set 'optionA' and 'optionB' to the two words.
- Set 'correctOption' to "A" or "B" depending on which one matches 'soundText'.
- Provide a helpful, clear linguistic explanation in Russian highlighting the acoustic difference to listen for.
Return valid JSON.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: { soundText: { type: Type.STRING }, optionA: { type: Type.STRING }, optionB: { type: Type.STRING }, correctOption: { type: Type.STRING }, explanation: { type: Type.STRING } },
                        required: ["soundText", "optionA", "optionB", "correctOption", "explanation"]
                    }
                }
            });
            return extractJsonSafe<any>(response.text || '', {});
        }), 12000);

        const badWordRegex = /^(test|toast|sample|hello|dummy)$/i;
        if (!data || !data.soundText || !data.optionA || !data.optionB || badWordRegex.test(String(data.soundText)) || badWordRegex.test(String(data.optionA)) || badWordRegex.test(String(data.optionB))) {
            const curated = getCuratedIllusion(cleanSubject, subjectId);
            return { id: crypto.randomUUID(), type: 'illusion', originalSentence: "Sound Illusion", targetTranslation: "", wordBank: [], illusionData: curated };
        }

        const validCorrect: 'A' | 'B' = (data.correctOption === 'B' || data.correctOption === 'b') ? 'B' : 'A';
        return {
            id: crypto.randomUUID(),
            type: 'illusion',
            originalSentence: "Sound Illusion",
            targetTranslation: "",
            wordBank: [],
            illusionData: {
                soundText: String(data.soundText),
                optionA: String(data.optionA),
                optionB: String(data.optionB),
                correctOption: validCorrect,
                explanation: String(data.explanation || "Обратите внимание на тонкие различия в произношении звуков.")
            }
        };
    } catch (e) {
        const curated = getCuratedIllusion(cleanSubject, subjectId);
        return {
            id: crypto.randomUUID(),
            type: 'illusion',
            originalSentence: "Sound Illusion",
            targetTranslation: "",
            wordBank: [],
            isFallback: true,
            illusionData: curated
        };
    }
};

export const getFallbackCharForLanguage = (subjectId: string): string => {
  const sId = (subjectId || '').toLowerCase();
  if (sId === 'eo') {
    const chars = ['ĉ', 'ĝ', 'ĥ', 'ĵ', 'ŝ', 'ŭ', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'Z'];
    return chars[Math.floor(Math.random() * chars.length)];
  }
  if (sId === 'id' || sId === 'la' || sId === 'hv' || sId === 'nl') {
    const chars = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    return chars[Math.floor(Math.random() * chars.length)];
  }
  if (sId === 'tlh') {
    const chars = ['Q', 'q', 'D', 'H', 'j', 'l', 'm', 'n', 'p', 'r', 'S', 't', 'v', 'w', 'y'];
    return chars[Math.floor(Math.random() * chars.length)];
  }
  if (sId === 'es') {
    const chars = ['Ñ', 'Á', 'É', 'Í', 'Ó', 'Ú', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'Z'];
    return chars[Math.floor(Math.random() * chars.length)];
  }
  if (sId === 'pt') {
    const chars = ['Ã', 'Õ', 'Ç', 'Á', 'É', 'Ó', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'Z'];
    return chars[Math.floor(Math.random() * chars.length)];
  }
  if (sId === 'tr') {
    const chars = ['Ç', 'Ğ', 'İ', 'Ö', 'Ş', 'Ü', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'Y', 'Z'];
    return chars[Math.floor(Math.random() * chars.length)];
  }
  if (sId === 'pl') {
    const chars = ['Ą', 'Ć', 'Ę', 'Ł', 'Ń', 'Ó', 'Ś', 'Ź', 'Ż', 'A', 'B', 'C', 'D', 'E', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'W', 'Z'];
    return chars[Math.floor(Math.random() * chars.length)];
  }
  if (sId === 'hu') {
    const chars = ['Á', 'É', 'Í', 'Ó', 'Ö', 'Ő', 'Ú', 'Ü', 'Ű', 'A', 'B', 'C', 'D', 'E', 'G', 'K', 'L', 'M', 'N', 'S', 'T', 'V', 'Z'];
    return chars[Math.floor(Math.random() * chars.length)];
  }
  if (sId === 'fi' || sId === 'sv' || sId === 'no') {
    const chars = ['Ä', 'Ö', 'Å', 'Ø', 'Æ', 'A', 'B', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'Y'];
    return chars[Math.floor(Math.random() * chars.length)];
  }
  if (sId === 'is') {
    const chars = ['Þ', 'Ð', 'Æ', 'Ö', 'Á', 'É', 'Í', 'Ó', 'Ú', 'Ý', 'A', 'B', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'R', 'S', 'T'];
    return chars[Math.floor(Math.random() * chars.length)];
  }
  if (sId === 'it') {
    const chars = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'Z'];
    return chars[Math.floor(Math.random() * chars.length)];
  }
  if (sId === 'de') {
    const chars = ['Ä', 'Ö', 'Ü', 'ß', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'Z'];
    return chars[Math.floor(Math.random() * chars.length)];
  }
  if (sId === 'fr') {
    const chars = ['É', 'È', 'Ç', 'À', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'Z'];
    return chars[Math.floor(Math.random() * chars.length)];
  }
  if (sId === 'cv' || sId === 'rf-chuvash') {
    const chars = ['Ӑ', 'Ӗ', 'Ҫ', 'Ӳ', 'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Э', 'Ю', 'Я'];
    return chars[Math.floor(Math.random() * chars.length)];
  }
  if (sId === 'kk') {
    const chars = ['Ә', 'Ғ', 'Қ', 'Ң', 'Ө', 'Ұ', 'Ү', 'Һ', 'І', 'А', 'Б', 'Д', 'Е', 'Ж', 'К', 'Л', 'М', 'Н', 'О', 'Р', 'С', 'Т'];
    return chars[Math.floor(Math.random() * chars.length)];
  }
  if (sId === 'uk') {
    const chars = ['Є', 'І', 'Ї', 'Ґ', 'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У'];
    return chars[Math.floor(Math.random() * chars.length)];
  }
  if (sId === 'ru' || sId === 'be' || sId === 'uz' || sId.startsWith('rf-')) {
    const chars = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Э', 'Ю', 'Я'];
    return chars[Math.floor(Math.random() * chars.length)];
  }
  if (sId === 'zh') return ['人', '口', '日', '月', '水', '火', '木', '金', '土'][Math.floor(Math.random() * 9)];
  if (sId === 'ja') return ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ'][Math.floor(Math.random() * 15)];
  if (sId === 'ko') return ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'][Math.floor(Math.random() * 14)];
  if (sId === 'ar') return ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'][Math.floor(Math.random() * 28)];
  if (sId === 'he' || sId === 'yi') return ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת'][Math.floor(Math.random() * 22)];
  if (sId === 'el') return ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Ι', 'Κ', 'Λ', 'Μ', 'Ν', 'Ξ', 'Ο', 'Π', 'Ρ', 'Σ', 'Τ', 'Υ', 'Φ', 'Χ', 'Ψ', 'Ω'][Math.floor(Math.random() * 24)];
  if (sId === 'hi') return ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'क', 'ख', 'ग', 'घ', 'च', 'ज', 'त', 'द', 'न', 'प', 'ब', 'म', 'र', 'ल', 'स', 'ह'][Math.floor(Math.random() * 22)];
  if (sId === 'th') return ['ก', 'ข', 'ค', 'ง', 'จ', 'ช', 'ด', 'ต', 'น', 'บ', 'ป', 'ม', 'ย', 'ร', 'ล', 'ว', 'ส', 'ห', 'อ'][Math.floor(Math.random() * 19)];
  if (sId === 'math') return ['∑', 'π', '∞', 'Δ', '√', '∫', '≈', '≠'][Math.floor(Math.random() * 8)];
  if (sId === 'music') return ['𝄞', '♪', '♫', '♩', '♭', '♯'][Math.floor(Math.random() * 6)];
  if (sId === 'chess') return ['♔', '♕', '♖', '♗', '♘', '♙'][Math.floor(Math.random() * 6)];

  const latinChars = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  return latinChars[Math.floor(Math.random() * latinChars.length)];
};

export const generateDrawing = async (subject: string, subjectId: string, specificChar?: string, userLanguage: string = 'ru'): Promise<Exercise> => {
    const cleanSubject = sanitizeSubjectName(subject);
    const isRuUi = userLanguage === 'ru' || userLanguage === 'Russian';
    try {
        const prompt = specificChar
            ? `Generate a writing challenge for the character "${specificChar}" in ${cleanSubject}. Give the instruction in ${isRuUi ? 'Russian' : 'English'}. Return JSON.`
            : `Generate a writing challenge for a random letter or character authentic to ${cleanSubject} (code: ${subjectId}). NEVER output generic test strings like "Test A" or "Test". Return JSON with "character" (single letter/symbol in ${cleanSubject}) and "instruction" (in ${isRuUi ? 'Russian' : 'English'}).`;

        const data = await fetchWithTimeout(callGeminiWithRetry(async () => {
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
            return extractJsonSafe<any>(response.text || '', {});
        }), 10000);

        let character = specificChar ? String(specificChar) : String(data?.character || '').trim();
        let instruction = String(data?.instruction || '').trim();

        if (!character || /^test(\s*a)?$/i.test(character)) {
            character = getFallbackCharForLanguage(subjectId);
            instruction = isRuUi ? `Нарисуйте символ: ${character}` : `Draw the character: ${character}`;
        }
        if (!instruction) {
            instruction = isRuUi ? `Нарисуйте символ: ${character}` : `Draw the character: ${character}`;
        }

        return { id: crypto.randomUUID(), type: 'drawing', originalSentence: "Draw", targetTranslation: "", wordBank: [], drawingData: { character, instruction } };
    } catch (e) {
        const fallbackChar = specificChar || getFallbackCharForLanguage(subjectId);
        return {
            id: 'fb-dr',
            type: 'drawing',
            originalSentence: "Draw",
            targetTranslation: "",
            wordBank: [],
            isFallback: true,
            drawingData: {
                character: fallbackChar,
                instruction: isRuUi ? `Нарисуйте символ: ${fallbackChar}` : `Draw the character: ${fallbackChar}`
            }
        };
    }
};

export const checkDrawing = async (base64Image: string, targetCharacter: string): Promise<{ isCorrect: boolean; feedback: string; isFallback?: boolean }> => {
    try {
        const result = await fetchWithTimeout(callGeminiWithRetry(async () => {
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
            const parsed = extractJsonSafe(response.text || '', { isCorrect: false, feedback: '' });
            return {
                isCorrect: Boolean(parsed?.isCorrect),
                feedback: String(parsed?.feedback || (parsed?.isCorrect ? `Отлично! Символ "${targetCharacter}" нарисован верно.` : `Попробуйте нарисовать "${targetCharacter}" ещё раз.`))
            };
        }), 12000);
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

export const generateReading = async (subject: string, subjectId: string, userLanguage: string = 'ru'): Promise<Exercise> => {
    const mode = Math.random() > 0.5 ? 'fill-blanks' : 'write';
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    const cleanSubject = sanitizeSubjectName(subject);
    const sId = (subjectId || '').toLowerCase();
    const isRuUi = userLanguage === 'ru' || userLanguage === 'Russian';
    const isNonLang = ['math', 'music', 'chess', 'coding', 'art'].includes(sId) || /матем|музык|шахмат|программ|рисован|каллиграф/i.test(subject);
    const isRf = sId.startsWith('rf-') || sId === 'cv' || subject.toLowerCase().includes('республик') || subject.toLowerCase().includes('чуваш') || subject.toLowerCase().includes('татар') || subject.toLowerCase().includes('башкир');

    try {
        const ai = createGenAiClient();
        let prompt = "";
        let schema: any = {};

        if (mode === 'fill-blanks') {
            prompt = isNonLang
                ? `Создай короткое упражнение на чтение с пропусками по предмету "${cleanSubject}" (тема: "${topic}") на языке: ${isRuUi ? 'Русский' : 'English'}.
                Напиши 2-4 предложения с пропусками "___".
                Верни JSON: title, text (с "___"), blanks ([{ id: "b1", word: "..." }]), wordBank (правильные слова + дистракторы).`
                : isRf
                ? `Создай короткое упражнение на чтение для курса "${cleanSubject}" на тему: "${topic}".
                Напиши короткий текст (3-5 предложений) на целевом языке или языке региона.
                Выдели 3-4 ключевых слова для пропусков ("___").
                Верни JSON:
                - title: Короткий заголовок.
                - text: Текст, где пропущенные слова заменены на "___".
                - blanks: Массив объектов { id: "b1", word: "правильноеСлово" }.
                - wordBank: Массив строк, включающий правильные слова и 3-4 похожих дистрактора.
                КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО ИСПОЛЬЗОВАТЬ АНГЛИЙСКИЙ ЯЗЫК!`
                : `Generate a short reading exercise STRICTLY in ${cleanSubject} (code: ${subjectId}) about ${topic}.
                Create a short text (3-5 sentences) in ${cleanSubject}.
                Identify 3-4 key words to be replaced with exact placeholder "___".
                Return JSON with:
                - title: A short title in ${cleanSubject}.
                - text: The text with blanks replaced by exact "___" markers.
                - blanks: An array of objects { id: "b1", word: "correctWord" } matching the count of "___".
                - wordBank: An array of strings in ${cleanSubject} including all correct blank words plus 3 distractors.`;
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
            prompt = isNonLang
                ? `Создай творческое письменное задание по предмету "${cleanSubject}" (тема: "${topic}") на языке: ${isRuUi ? 'Русский' : 'English'}.
                Верни JSON: title, text (короткий контекст 1-2 предложения), prompt (конкретное задание для ответа).`
                : isRf
                ? `Создай творческое задание по письму для курса "${cleanSubject}" на тему: "${topic}".
                Верни JSON:
                - title: Короткий заголовок.
                - text: Вводный текст или контекст (1-2 предложения на целевом языке).
                - prompt: Конкретное задание для пользователя (например, "Опишите природу родного края", "Напишите письмо другу").
                КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО ИСПОЛЬЗОВАТЬ АНГЛИЙСКИЙ ЯЗЫК!`
                : `Generate a creative writing prompt in ${cleanSubject} (code: ${subjectId}) about ${topic}.
                Return JSON with:
                - title: A short title in ${cleanSubject}.
                - text: A story starter or context (1-2 sentences in ${cleanSubject}).
                - prompt: A specific instruction (in ${isRuUi ? 'Russian' : 'English'}) explaining what the student should write in ${cleanSubject}.`;
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

        const response = await fetchWithTimeout(callGeminiWithRetry(async () => {
             return ai.models.generateContent({
                model: MODEL_FREE,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            });
        }), 15000);
        const data = extractJsonSafe<any>(response.text || '', {});

        if (!data || typeof data.text !== 'string' || !data.text.trim()) {
            throw new Error('Invalid reading response');
        }
        if (mode === 'fill-blanks') {
            const blanksArr = Array.isArray(data.blanks) ? data.blanks.filter((b: any) => b && b.word) : [];
            const markersCount = (data.text.match(/___/g) || []).length;
            if (blanksArr.length === 0 || markersCount === 0) {
                throw new Error('Invalid fill-blanks reading structure');
            }
            let fullText = data.text;
            blanksArr.forEach((b: any) => {
                fullText = fullText.replace("___", String(b?.word || ''));
            });
            const normalizedBlanks = blanksArr.slice(0, markersCount).map((b: any, i: number) => ({
                id: String(b?.id || `b${i + 1}`),
                word: String(b?.word || '')
            }));
            const bank = Array.isArray(data.wordBank) && data.wordBank.length > 0
                ? data.wordBank.map((w: any) => String(w || '')).filter(Boolean)
                : normalizedBlanks.map((b: any) => b.word);

            return {
                id: crypto.randomUUID(),
                type: 'reading',
                originalSentence: String(data.title || cleanSubject),
                targetTranslation: fullText,
                wordBank: bank,
                readingData: {
                    title: String(data.title || cleanSubject),
                    text: data.text,
                    mode: 'fill-blanks',
                    blanks: normalizedBlanks
                }
            };
        }

        return {
            id: crypto.randomUUID(),
            type: 'reading',
            originalSentence: String(data.title || cleanSubject),
            targetTranslation: data.text,
            wordBank: [],
            readingData: {
                title: String(data.title || cleanSubject),
                text: data.text,
                mode: 'write',
                prompt: String(data.prompt || (isRuUi ? `Напишите короткий ответ на ${cleanSubject}` : `Write a short response in ${cleanSubject}`))
            }
        };

    } catch (e) {
        const readingFallbacks: Record<string, { title: string; text: string; full: string; blanks: string[]; distractors: string[] }> = {
            cv: { title: "Шкулти пурнӑҫ", text: "Эпӗ паян ___ каятӑп тата ___ вулатӑп.", full: "Эпӗ паян шкула каятӑп тата кӗнеке вулатӑп.", blanks: ['шкула', 'кӗнеке'], distractors: ['паян', 'ҫӑкӑр', 'юлташ'] },
            es: { title: "Un día soleado", text: "Hoy ___ un café y leo un ___ interesante.", full: "Hoy tomo un café y leo un libro interesante.", blanks: ['tomo', 'libro'], distractors: ['agua', 'perro', 'casa'] },
            de: { title: "Mein Morgen", text: "Am Morgen trinke ich ___ und lese die ___.", full: "Am Morgen trinke ich Kaffee und lese die Zeitung.", blanks: ['Kaffee', 'Zeitung'], distractors: ['Wasser', 'Haus', 'Apfel'] },
            fr: { title: "Le matin", text: "Le matin, je mange du ___ et je bois du ___.", full: "Le matin, je mange du pain et je bois du thé.", blanks: ['pain', 'thé'], distractors: ['chat', 'livre', 'soleil'] },
            it: { title: "In piazza", text: "Oggi vado al ___ per comprare un ___ fresco.", full: "Oggi vado al mercato per comprare un pane fresco.", blanks: ['mercato', 'pane'], distractors: ['mare', 'treno', 'casa'] },
            pt: { title: "Café da manhã", text: "Eu gosto de tomar ___ e comer ___ pela manhã.", full: "Eu gosto de tomar café e comer pão pela manhã.", blanks: ['café', 'pão'], distractors: ['livro', 'gato', 'água'] },
            tr: { title: "Sabah Kahvaltısı", text: "Sabah sıcak ___ içiyorum ve taze ___ yiyorum.", full: "Sabah sıcak çay içiyorum ve taze ekmek yiyorum.", blanks: ['çay', 'ekmek'], distractors: ['su', 'kitap', 'ev'] },
            ar: { title: "في الصباح", text: "في الصباح أشرب ___ وأقرأ ___.", full: "في الصباح أشرب القهوة وأقرأ الكتاب.", blanks: ['القهوة', 'الكتاب'], distractors: ['الماء', 'البحر', 'البيت'] },
            zh: { title: "早晨", text: "我早上喝___，然后去___。", full: "我早上喝茶，然后去学校。", blanks: ['茶', '学校'], distractors: ['书', '猫', '水'] },
            ja: { title: "朝の習慣", text: "私は朝、___を飲んで___を読みます。", full: "私は朝、お茶を飲んで本を読みます。", blanks: ['お茶', '本'], distractors: ['水', '猫', '駅'] },
            ko: { title: "아침 시간", text: "아침에 따뜻한 ___를 마시고 ___을 읽어요.", full: "아침에 따뜻한 차를 마시고 책을 읽어요.", blanks: ['차', '책'], distractors: ['물', '집', '친구'] },
            uk: { title: "Ранкова прогулянка", text: "Сьогодні я п'ю гарячий ___ та читаю цікаву ___.", full: "Сьогодні я п'ю гарячий чай та читаю цікаву книгу.", blanks: ['чай', 'книгу'], distractors: ['вікно', 'стіл', 'вода'] },
            kk: { title: "Таңғы уақыт", text: "Мен таңертең ___ ішіп, қызықты ___ оқимын.", full: "Мен таңертең шай ішіп, қызықты кітап оқимын.", blanks: ['шай', 'кітап'], distractors: ['су', 'үй', 'нан'] },
            eo: { title: "Bona mateno", text: "Hodiaŭ mi trinkas ___ kaj legas bonan ___.", full: "Hodiaŭ mi trinkas teon kaj legas bonan libron.", blanks: ['teon', 'libron'], distractors: ['panon', 'katon', 'akvon'] },
            id: { title: "Pagi Hari", text: "Pagi ini saya minum ___ dan membaca ___.", full: "Pagi ini saya minum teh dan membaca buku.", blanks: ['teh', 'buku'], distractors: ['air', 'rumah', 'roti'] },
            ru: { title: "Утренняя привычка", text: "Утром я люблю пить тёплый ___ и читать интересную ___.", full: "Утром я люблю пить тёплый чай и читать интересную книгу.", blanks: ['чай', 'книгу'], distractors: ['окно', 'стол', 'море'] },
            en: { title: "Morning Routine", text: "In the morning I drink warm ___ and read a good ___.", full: "In the morning I drink warm tea and read a good book.", blanks: ['tea', 'book'], distractors: ['apple', 'window', 'chair'] },
            math: { title: "Геометрия", text: "Сумма углов треугольника равна ___ градусам, а площадь квадрата — квадрату его ___.", full: "Сумма углов треугольника равна 180 градусам, а площадь квадрата — квадрату его стороны.", blanks: ['180', 'стороны'], distractors: ['90', 'радиуса', '360'] },
            chess: { title: "Шахматная стратегия", text: "В дебюте важно занять ___ и защитить своего ___ рокировкой.", full: "В дебюте важно занять центр и защитить своего короля рокировкой.", blanks: ['центр', 'короля'], distractors: ['ферзя', 'фланг', 'пешку'] },
            music: { title: "Теория музыки", text: "Скрипичный ключ указывает на ноту ___, а мажорное трезвучие звучит ___.", full: "Скрипичный ключ указывает на ноту соль, а мажорное трезвучие звучит светло.", blanks: ['соль', 'светло'], distractors: ['фа', 'грустно', 'до'] },
            coding: { title: "Основы кода", text: "Цикл позволяет повторять блок ___, а условие проверяет истинность ___.", full: "Цикл позволяет повторять блок кода, а условие проверяет истинность выражения.", blanks: ['кода', 'выражения'], distractors: ['класса', 'окна', 'числа'] },
            art: { title: "Основы живописи", text: "Смешивание синего и жёлтого даёт ___ цвет, а светлые блики создают ___.", full: "Смешивание синего и жёлтого даёт зелёный цвет, а светлые блики создают объём.", blanks: ['зелёный', 'объём'], distractors: ['красный', 'угол', 'линию'] }
        };

        const isChuvash = sId === 'cv' || sId === 'rf-chuvash' || subject.toLowerCase().includes('чуваш');
        const key = isChuvash ? 'cv' : (readingFallbacks[sId] ? sId : (sId.startsWith('rf-') ? 'ru' : 'en'));
        const fb = readingFallbacks[key] || readingFallbacks.en;
        const wordBank = [...fb.blanks, ...fb.distractors].sort(() => Math.random() - 0.5);

        return {
            id: `fallback-reading-${key}`,
            type: 'reading',
            originalSentence: fb.title,
            targetTranslation: fb.full,
            wordBank,
            isFallback: true,
            readingData: {
                title: fb.title,
                text: fb.text,
                mode: 'fill-blanks',
                blanks: fb.blanks.map((word, idx) => ({ id: `b${idx + 1}`, word }))
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

export const getChessTutorialHint = async (
  fen: string,
  history: string[],
  lang: string = 'ru',
  scenarioMessage?: string
): Promise<string> => {
  try {
    const ai = createGenAiClient();
    const isRu = lang === 'ru';
    const prompt = `You are DuoWindo6601 Chess Coach (Owl Mascot).
Current Board FEN: ${fen}
Move History: ${history.slice(-5).join(', ') || 'Game start'}
Current Tutorial Scenario/Instruction: ${scenarioMessage || 'Tutorial scenario'}

Provide a specific, tactical next-move suggestion for White in ${isRu ? 'Russian' : 'English'}.
Specify an exact piece, target square, or move (e.g. "Походите конем на f3 (Nf3), чтобы занять центр и развить фигуру.").
Keep it encouraging, concise (1-2 sentences, max 25 words).`;

    const response = await callGeminiWithRetry(async () => {
      return ai.models.generateContent({
        model: MODEL_FREE,
        contents: prompt
      });
    });

    const text = response.text?.trim();
    if (text) return text;
    return isRu
      ? '💡 Подсказка: Развивайте фигуры в центре (e4 / d4 / Nf3) и готовьте рокировку!'
      : '💡 Hint: Develop your central pieces (e4 / d4 / Nf3) and prepare to castle!';
  } catch (e) {
    return lang === 'ru'
      ? '💡 Подсказка: Сделайте ход пешкой в центр или выведите коня на f3!'
      : '💡 Hint: Control the center with a pawn or develop your knight to f3!';
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
        const response = await fetchWithTimeout(callGeminiWithRetry(async () => {
            return ai.models.generateContent({
                model: MODEL_FREE,
                contents: `Provide a brief, helpful "cheat sheet" reply idea (2-3 short bullet points, concise enough to glance at during a call) for this prompt: "${question}".`
            });
        }), 10000);
        return response.text?.trim() || "• Ответьте коротко и по сути\n• Используйте знакомые слова";
    } catch (e) {
        return "• Ответьте простыми фразами по теме\n• Поделитесь примером из жизни";
    }
};

export const generateVideoCallRoleplayResponse = async (
    topic: string,
    history: RoleplayMessage[],
    userText: string,
    language: string,
    userLanguage: string = 'ru'
): Promise<{ text: string; correction?: string }> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error(OFFLINE_INTERNET_REQUIRED_MESSAGE);
    }
    const cleanLanguage = sanitizeSubjectName(language);
    const isNonLang = /матем|музык|шахмат|программ|рисован|каллиграф|math|music|chess|programming|art/i.test(language);
    const isRuUi = userLanguage === 'ru' || userLanguage === 'Russian';
    const targetSpeakLang = isNonLang ? (isRuUi ? 'Russian' : 'English') : cleanLanguage;

    try {
        const ai = createGenAiClient();
        const context = history.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'DuoWindo6601'}: ${m.text}`).join('\n');
        const isArabic = !isNonLang && (cleanLanguage.toLowerCase().includes('араб') || cleanLanguage.toLowerCase().includes('arabic'));
        const isInitialGreeting = userText === '__START_VIDEO_CALL__';
        const prompt = isInitialGreeting
          ? (isNonLang
              ? `You are DuoWindo6601, an AI tutor starting a LIVE interactive Video Call about "${cleanLanguage}". Topic: "${topic}".
Greet the student warmly in ${targetSpeakLang} (1-2 short sentences) and ask an engaging opening question about "${cleanLanguage}".
Return JSON with { "text": "..." }`
              : `You are DuoWindo6601, an AI language tutor starting a LIVE interactive Video Call with a student learning ${targetSpeakLang}.
Topic: "${topic}".
Greet the student naturally and warmly STRICTLY in ${targetSpeakLang} (1-2 sentences max) and ask an engaging opening question about "${topic}". Do not use generic canned English templates if studying another language.
Return JSON with { "text": "..." }`)
          : (isNonLang
              ? `You are DuoWindo6601, an AI tutor in a LIVE Video Call teaching "${cleanLanguage}".
Topic: "${topic}".
Recent conversation:
${context}
User said during video call: "${userText}"
Reply naturally, warmly, and concisely in ${targetSpeakLang} (1-2 short sentences). Return JSON with { "text": "...", "correction": "..." }`
              : `You are DuoWindo6601, an AI language tutor in a LIVE interactive Video Call with a student learning ${targetSpeakLang}. 
Current topic/scenario: "${topic}".
Recent conversation:
${context}
User said during video call: "${userText}"

Reply naturally, warmly, and concisely as DuoWindo6601 STRICTLY in ${targetSpeakLang} (1-2 sentences max for spoken video call). Do not use generic canned placeholders.
${isArabic ? 'For Arabic language practice: when mentioning numbers, prices, or time, show dual numerals with European/Western digits on the left and Eastern Arabic digits on the right (e.g. 1 / ١, 5 / ٥, 10 / ١٠). Do not remove modern European digits.' : ''}
If user made a language/grammar mistake, provide a very brief friendly correction.
Return JSON with { "text": "...", "correction": "..." }`);

        const response = await fetchWithTimeout(callGeminiWithRetry(async () => {
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
        }), 20000);
        const raw = (response.text || '').trim();
        const data = extractJsonSafe<any>(raw, null);
        if (data && typeof data.text === 'string' && data.text.trim()) {
            return { text: data.text, correction: data.correction };
        }
        if (raw) {
            return { text: raw };
        }
        throw new Error('Empty Gemini video call response');
    } catch (e) {
        if (isNetworkDisconnectError(e)) {
            throw new Error(OFFLINE_INTERNET_REQUIRED_MESSAGE);
        }
        throw e;
    }
};

/**
 * Direct ping function to test connection to Gemini API on the server.
 */
export const pingGeminiApi = async (customKeyToTest?: string): Promise<{ ok: boolean; message: string; latencyMs?: number }> => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      ok: false,
      message: OFFLINE_INTERNET_REQUIRED_MESSAGE,
      latencyMs: 0,
    };
  }

  const customKey = (customKeyToTest && customKeyToTest.trim()) ? customKeyToTest.trim() : getApiKey();
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const headers: Record<string, string> = {};
    if (customKey && customKey !== 'SYSTEM_FREE_TRAFFIC' && !customKey.includes('••••')) {
      headers['x-goog-api-key'] = customKey;
    }

    const res = await fetch('/api/gemini/ping', {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));
    const latencyMs = typeof data.latencyMs === 'number' ? data.latencyMs : (Date.now() - startTime);

    if (res.ok && data.ok) {
      return {
        ok: true,
        message: data.message || 'Gemini API Онлайн и работает (Без VPN и с VPN)!',
        latencyMs,
      };
    }

    return {
      ok: false,
      message: data.message || data.error?.message || `Ошибка сервера Gemini (${res.status})`,
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    if (isNetworkDisconnectError(err)) {
      return {
        ok: false,
        message: OFFLINE_INTERNET_REQUIRED_MESSAGE,
        latencyMs,
      };
    }
    const msg = String(err?.message || err || '');
    if (err?.name === 'AbortError' || msg.includes('TIMEOUT')) {
      return {
        ok: false,
        message: 'Превышено время ожидания ответа от сервера (таймаут 12 сек.)',
        latencyMs,
      };
    }
    return {
      ok: false,
      message: msg.length > 70 ? msg.slice(0, 70) + '...' : (msg || 'Сервер Gemini недоступен'),
      latencyMs,
    };
  }
};