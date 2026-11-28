import { GoogleGenAI, Modality, ThinkingLevel, LiveServerMessage } from '@google/genai';
import type { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import { FISH_NATIVE_LANGS, getFishReferenceIdForLang } from './fishAudioConfig.ts';
import {
  GTTS_SUPPORTED_LANGS,
  normalizeCourseLangCode,
  resolveGoogleTtsLang,
  resolvePhoneticTtsTarget,
} from './multilingualTtsHelper.ts';

export const MODEL_FREE = 'gemini-4-hydrogen';
export const MODEL_PRO = 'gemini-4-argon';
export const FAST_FALLBACK_MODEL = 'gemini-3.1-flash-lite';
export const SECONDARY_FALLBACK_MODEL = 'gemini-4-hydrogen';
export const TTS_MODEL = 'gemini-3.8-flash-lite-tts';
export const TTS_FALLBACK_MODEL = 'gemini-3.8-flash-tts';
export const LIVE_MODEL = 'gemini-3.8-live';

const ALLOWED_LIVE_VOICES = new Set([
  'Zephyr',
  'Kore',
  'Puck',
  'Charon',
  'Fenrir',
  'Aoede',
  'Leda',
  'Orus',
]);

function normalizeVoiceName(voice?: string, fallback: string = 'Kore'): string {
  const clean = String(voice || '').trim();
  if (ALLOWED_LIVE_VOICES.has(clean)) return clean;
  return fallback;
}

function isFailoverEligibleError(err: any): boolean {
  const status = Number(err?.status || err?.code || 0);
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    status === 503 ||
    status === 502 ||
    status === 429 ||
    status === 404 ||
    status === 400 ||
    status === 500 ||
    status === 504 ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('overloaded') ||
    msg.includes('resource_exhausted') ||
    msg.includes('not_found') ||
    msg.includes('timeout') ||
    msg.includes('aborted') ||
    msg.includes('fetch failed')
  );
}

function getModelChain(requestedModel: string, isAudioTtsRequest: boolean): string[] {
  if (isAudioTtsRequest) {
    const chain = [requestedModel, TTS_MODEL, TTS_FALLBACK_MODEL].filter(
      (m) => m && m.includes('tts')
    );
    return Array.from(new Set(chain));
  }

  let chain: string[];
  if (requestedModel === MODEL_PRO) {
    chain = [MODEL_PRO, MODEL_FREE, FAST_FALLBACK_MODEL, SECONDARY_FALLBACK_MODEL];
  } else if (requestedModel === MODEL_FREE) {
    chain = [MODEL_FREE, FAST_FALLBACK_MODEL, SECONDARY_FALLBACK_MODEL];
  } else if (requestedModel === FAST_FALLBACK_MODEL) {
    chain = [FAST_FALLBACK_MODEL, MODEL_FREE, SECONDARY_FALLBACK_MODEL];
  } else {
    chain = [requestedModel, MODEL_FREE, FAST_FALLBACK_MODEL, SECONDARY_FALLBACK_MODEL];
  }
  return Array.from(new Set(chain.filter(Boolean)));
}

function buildModelConfig(baseConfig: any, modelName: string, isAudioTtsRequest: boolean): any {
  const cfg = { ...(baseConfig || {}) };
  if (isAudioTtsRequest) {
    delete cfg.thinkingConfig;
    return cfg;
  }

  if (modelName === MODEL_FREE) {
    if (!cfg.thinkingConfig) {
      cfg.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
    }
  } else if (modelName !== MODEL_PRO) {
    // Strip Gemini 4 thinkingLevel options when failing over to non-4 models
    if (cfg.thinkingConfig && 'thinkingLevel' in cfg.thinkingConfig) {
      delete cfg.thinkingConfig;
    }
  }
  return cfg;
}

function extractJsonSafe(rawText: string): any {
  if (!rawText || typeof rawText !== 'string') return undefined;
  const trimmed = rawText.trim();
  if (!trimmed) return undefined;

  const stripped = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(stripped);
  } catch {
    // Attempt extracting first JSON object or array
    const objStart = stripped.indexOf('{');
    const objEnd = stripped.lastIndexOf('}');
    if (objStart !== -1 && objEnd > objStart) {
      try {
        return JSON.parse(stripped.slice(objStart, objEnd + 1));
      } catch {
        // ignore
      }
    }
    const arrStart = stripped.indexOf('[');
    const arrEnd = stripped.lastIndexOf(']');
    if (arrStart !== -1 && arrEnd > arrStart) {
      try {
        return JSON.parse(stripped.slice(arrStart, arrEnd + 1));
      } catch {
        // ignore
      }
    }
  }
  return undefined;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`TIMEOUT_${label}`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function isValidGoogleApiKeyFormat(key?: string): boolean {
  const trimmed = String(key || '').trim();
  return /^((AIza)[0-9A-Za-z_-]{20,}|(AQ\.)[0-9A-Za-z_.-]{20,})$/.test(trimmed);
}

export function getRawServerEnvGeminiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    ''
  ).trim();
}

export function isAuthKeyError(err: any): boolean {
  const status = Number(err?.status || err?.code || 0);
  const msg = String(err?.message || err || '');
  return (
    status === 401 ||
    status === 403 ||
    msg.includes('UNAUTHENTICATED') ||
    msg.includes('PERMISSION_DENIED') ||
    msg.includes('SERVICE_DISABLED') ||
    msg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') ||
    msg.includes('API_KEY_INVALID') ||
    msg.includes('API key not valid')
  );
}

export function buildInvalidKeyErrorPayload(apiKey: string, err?: any): {
  httpStatus: number;
  message: string;
  code: string;
} {
  const trimmed = String(apiKey || '').trim();
  const errMsg = String(err?.message || err || '');
  const status = Number(err?.status || 0) === 403 ? 403 : 401;

  if (errMsg.includes('SERVICE_DISABLED') || errMsg.includes('has not been used in project')) {
    const urlMatch = errMsg.match(/https:\/\/console\.developers\.google\.com\/apis\/api\/generativelanguage\.googleapis\.com\/[^\s"\\]+/);
    const activationLink = urlMatch ? ` (${urlMatch[0]})` : '';
    return {
      httpStatus: 403,
      code: 'SERVICE_DISABLED',
      message:
        `Generative Language API (Gemini API) отключён в Google Cloud проекте для этого ключа. Включите generativelanguage.googleapis.com в Google Cloud Console${activationLink} и повторите через минуту.`,
    };
  }

  if (errMsg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED')) {
    return {
      httpStatus: 401,
      code: 'INVALID_API_KEY',
      message:
        'Ключ GEMINI_API_KEY в Settings > Secrets отклонён шлюзом Gemini API (ACCESS_TOKEN_TYPE_UNSUPPORTED). Проверьте, что это действующий ключ Gemini API (с включённым Generative Language API) в Settings > Secrets.',
    };
  }

  if (trimmed && !isValidGoogleApiKeyFormat(trimmed)) {
    return {
      httpStatus: 401,
      code: 'INVALID_API_KEY',
      message:
        'GEMINI_API_KEY в Settings > Secrets имеет неподдерживаемый формат (ожидается ключ Gemini API, начинающийся на AIza... или AQ....). Проверьте ключ в Settings > Secrets.',
    };
  }

  return {
    httpStatus: status,
    code: status === 403 ? 'PERMISSION_DENIED' : 'INVALID_API_KEY',
    message:
      'Gemini API отклонил ключ (401/403). Пожалуйста, проверьте или выберите действующий GEMINI_API_KEY в панели Settings > Secrets.',
  };
}

/**
 * Returns the effective Gemini API key configured on the server.
 * Never exposed to the browser.
 */
export function getServerGeminiKey(overrideKey?: string): string {
  const custom = (overrideKey || '').trim();
  const serverKey = getRawServerEnvGeminiKey();
  if (isValidGoogleApiKeyFormat(custom)) {
    return custom;
  }
  if (serverKey) {
    return serverKey;
  }
  if (custom && custom !== 'SYSTEM_FREE_TRAFFIC' && custom !== 'undefined' && custom !== 'null' && !custom.includes('••••')) {
    return custom;
  }
  return '';
}

/**
 * Factory creating a server-side GoogleGenAI client
 * with mandatory telemetry header 'User-Agent': 'aistudio-build'.
 */
export function createServerGenAiClient(customKey?: string): GoogleGenAI {
  const apiKey = getServerGeminiKey(customKey);
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

let cachedDefaultServerAi: GoogleGenAI | null = null;
let cachedDefaultServerKey: string = '';

export function getServerAiClient(customKey?: string): GoogleGenAI {
  const resolvedKey = getServerGeminiKey(customKey);
  if (!resolvedKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  if (isValidGoogleApiKeyFormat(customKey)) {
    return createServerGenAiClient(customKey);
  }
  if (!cachedDefaultServerAi || cachedDefaultServerKey !== resolvedKey) {
    cachedDefaultServerAi = createServerGenAiClient();
    cachedDefaultServerKey = resolvedKey;
  }
  return cachedDefaultServerAi;
}

/**
 * POST /api/gemini/generate
 * Standard server-side content generation (JSON, text, multimodal).
 */
export async function handleGeminiGenerate(req: Request, res: Response): Promise<void> {
  const customKey =
    (req.headers['x-goog-api-key'] as string) ||
    req.body?.customKey ||
    (req.query?.key as string) ||
    (req.query?.apiKey as string);
  const apiKey = getServerGeminiKey(customKey);
  if (!apiKey) {
    res.status(503).json({
      error: {
        message: 'GEMINI_API_KEY is not configured on the server. Please attach an API key in Settings > Secrets or server environment.',
        code: 'MISSING_API_KEY',
      },
    });
    return;
  }

  const serverEnvKey = getRawServerEnvGeminiKey();
  if (!isValidGoogleApiKeyFormat(apiKey)) {
    const payload = buildInvalidKeyErrorPayload(apiKey);
    res.status(payload.httpStatus).json({
      error: {
        message: payload.message,
        status: payload.httpStatus,
        code: payload.code,
      },
    });
    return;
  }

  let activeClient = getServerAiClient(customKey);
  let activeKey = apiKey;

  const {
    model = MODEL_FREE,
    contents,
    prompt,
    config = {},
    systemInstruction,
    responseSchema,
    responseMimeType,
  } = req.body || {};

  const effectiveContents = contents || (prompt ? String(prompt) : '');
  if (!effectiveContents) {
    res.status(400).json({ error: { message: 'contents or prompt is required' } });
    return;
  }

  const mergedConfig: any = { ...config };
  if (systemInstruction) mergedConfig.systemInstruction = systemInstruction;
  if (responseSchema) mergedConfig.responseSchema = responseSchema;
  if (responseMimeType) mergedConfig.responseMimeType = responseMimeType;

  const requestedModel = String(model || MODEL_FREE).trim();
  const isAudioTtsRequest =
    requestedModel.includes('tts') ||
    (Array.isArray(mergedConfig.responseModalities) && mergedConfig.responseModalities.includes('AUDIO'));

  const modelChain = getModelChain(requestedModel, isAudioTtsRequest);

  try {
    let response: any = null;
    let lastError: any = null;
    let retriedWithServerKey = false;

    for (let idx = 0; idx < modelChain.length; idx++) {
      const candidateModel = modelChain[idx];
      const attemptConfig = buildModelConfig(mergedConfig, candidateModel, isAudioTtsRequest);
      const timeoutMs = idx === 0 ? 15000 : 15000;

      try {
        response = await withTimeout(
          activeClient.models.generateContent({
            model: candidateModel,
            contents: effectiveContents,
            config: Object.keys(attemptConfig).length > 0 ? attemptConfig : undefined,
          }),
          timeoutMs,
          idx === 0 ? 'GENERATE' : `GENERATE_FALLBACK_${idx}`
        );
        break;
      } catch (err: any) {
        lastError = err;
        if (
          isAuthKeyError(err) &&
          !retriedWithServerKey &&
          isValidGoogleApiKeyFormat(serverEnvKey) &&
          activeKey !== serverEnvKey
        ) {
          retriedWithServerKey = true;
          activeClient = getServerAiClient();
          activeKey = serverEnvKey;
          idx -= 1;
          continue;
        }
        const msg = String(err?.message || '');
        // Some gateway routes reject speechConfig on TTS models; retry once without speechConfig
        if (isAudioTtsRequest && msg.includes('speechConfig') && attemptConfig.speechConfig) {
          try {
            const strippedConfig = { ...attemptConfig };
            delete strippedConfig.speechConfig;
            response = await withTimeout(
              activeClient.models.generateContent({
                model: candidateModel,
                contents: effectiveContents,
                config: Object.keys(strippedConfig).length > 0 ? strippedConfig : undefined,
              }),
              8000,
              'TTS_STRIPPED'
            );
            break;
          } catch (stripErr: any) {
            lastError = stripErr;
          }
        }

        if (idx < modelChain.length - 1 && isFailoverEligibleError(lastError)) {
          console.warn(
            `[Server Gemini Failover]: ${candidateModel} -> ${modelChain[idx + 1]} (${lastError?.message || lastError})`
          );
          continue;
        }
        throw lastError;
      }
    }

    if (!response) {
      throw lastError || new Error('Gemini server generation failed');
    }

    const text = response.text || '';
    let parsedData: any = undefined;
    if (
      mergedConfig.responseMimeType === 'application/json' ||
      text.trim().startsWith('{') ||
      text.trim().startsWith('[') ||
      text.trim().startsWith('```')
    ) {
      parsedData = extractJsonSafe(text);
    }

    res.json({
      text,
      data: parsedData,
      candidates: response.candidates,
      usageMetadata: response.usageMetadata,
    });
  } catch (err: any) {
    if (isAuthKeyError(err)) {
      const payload = buildInvalidKeyErrorPayload(activeKey, err);
      console.warn('[Server Gemini Auth Error]:', payload.code, payload.httpStatus);
      res.status(payload.httpStatus).json({
        error: {
          message: payload.message,
          status: payload.httpStatus,
          code: payload.code,
        },
      });
      return;
    }
    console.error('[Server Gemini Generate Error]:', err?.message || err);
    res.status(err?.status || 500).json({
      error: {
        message: err?.message || 'Gemini server generation failed',
        status: err?.status,
        code: err?.code,
      },
    });
  }
}

/**
 * POST /api/gemini/stream
 * Server-Sent Events (SSE) streaming generation.
 */
export async function handleGeminiStream(req: Request, res: Response): Promise<void> {
  const customKey =
    (req.headers['x-goog-api-key'] as string) ||
    req.body?.customKey ||
    (req.query?.key as string) ||
    (req.query?.apiKey as string);
  const apiKey = getServerGeminiKey(customKey);
  if (!apiKey) {
    res.status(503).json({
      error: {
        message: 'GEMINI_API_KEY is not configured on the server. Please attach an API key in Settings > Secrets or server environment.',
        code: 'MISSING_API_KEY',
      },
    });
    return;
  }
  if (!isValidGoogleApiKeyFormat(apiKey)) {
    const payload = buildInvalidKeyErrorPayload(apiKey);
    res.status(payload.httpStatus).json({
      error: {
        message: payload.message,
        status: payload.httpStatus,
        code: payload.code,
      },
    });
    return;
  }
  const serverEnvKey = getRawServerEnvGeminiKey();
  let activeClient = getServerAiClient(customKey);
  let activeKey = apiKey;

  const {
    model = MODEL_FREE,
    contents,
    prompt,
    config = {},
    systemInstruction,
  } = req.body || {};

  const effectiveContents = contents || (prompt ? String(prompt) : '');
  if (!effectiveContents) {
    res.status(400).json({ error: { message: 'contents or prompt is required' } });
    return;
  }

  const mergedConfig: any = { ...config };
  if (systemInstruction) mergedConfig.systemInstruction = systemInstruction;

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let isAborted = false;
  res.on('close', () => {
    if (!res.writableFinished) {
      isAborted = true;
    }
  });

  const requestedModel = String(model || MODEL_FREE).trim();
  const modelChain = getModelChain(requestedModel, false);

  try {
    let streamedAnyText = false;
    let lastError: any = null;
    let retriedWithServerKey = false;

    for (let idx = 0; idx < modelChain.length; idx++) {
      if (isAborted) break;
      const candidateModel = modelChain[idx];
      const attemptConfig = buildModelConfig(mergedConfig, candidateModel, false);
      try {
        const responseStream = await withTimeout(
          activeClient.models.generateContentStream({
            model: candidateModel,
            contents: effectiveContents,
            config: Object.keys(attemptConfig).length > 0 ? attemptConfig : undefined,
          }),
          15000,
          idx === 0 ? 'STREAM' : `STREAM_FALLBACK_${idx}`
        );

        for await (const chunk of responseStream) {
          if (isAborted) break;
          const text = chunk?.text || '';
          if (text) {
            streamedAnyText = true;
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }

        if (streamedAnyText || isAborted) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        if (
          !streamedAnyText &&
          isAuthKeyError(err) &&
          !retriedWithServerKey &&
          isValidGoogleApiKeyFormat(serverEnvKey) &&
          activeKey !== serverEnvKey
        ) {
          retriedWithServerKey = true;
          activeClient = getServerAiClient();
          activeKey = serverEnvKey;
          idx -= 1;
          continue;
        }
        if (!streamedAnyText && idx < modelChain.length - 1 && isFailoverEligibleError(err)) {
          console.warn(`[Server Gemini Stream Failover]: ${candidateModel} -> ${modelChain[idx + 1]}`);
          continue;
        }
        if (!streamedAnyText) {
          throw err;
        }
        break;
      }
    }

    if (!streamedAnyText && !isAborted && lastError) {
      throw lastError;
    }

    if (!isAborted && !res.writableEnded) {
      res.write('data: [DONE]\n\n');
    }
  } catch (err: any) {
    const errPayload = isAuthKeyError(err) ? buildInvalidKeyErrorPayload(activeKey, err) : null;
    const msg = errPayload ? errPayload.message : (err?.message || 'Streaming failed');
    console.error('[Server Gemini Stream Error]:', msg);
    if (!res.headersSent) {
      res.status(errPayload?.httpStatus || 500).json({ error: { message: msg } });
    } else if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    }
  } finally {
    if (res.headersSent && !res.writableEnded) {
      res.end();
    }
  }
}

/**
 * POST /api/gemini/tts
 * Server-side Text-to-Speech using gemini-3.8-flash-lite-tts / gemini-3.8-flash-tts.
 */
let defaultServerGeminiTtsMissing = false;

const TTS_LANGUAGE_LABELS: Record<string, string> = {
  ru: 'Russian', es: 'Spanish', de: 'German', fr: 'French', it: 'Italian', pt: 'Portuguese',
  ja: 'Japanese', zh: 'Mandarin Chinese', ko: 'Korean', ar: 'Arabic', he: 'Hebrew', yi: 'Yiddish',
  sv: 'Swedish', no: 'Norwegian', la: 'Classical Latin', eo: 'Esperanto', tt: 'Tatar',
  hv: 'High Valyrian', uk: 'Ukrainian', be: 'Belarusian', kk: 'Kazakh', uz: 'Uzbek',
  ky: 'Kyrgyz', az: 'Azerbaijani', hy: 'Armenian', ka: 'Georgian', tr: 'Turkish',
  pl: 'Polish', fi: 'Finnish', hu: 'Hungarian', is: 'Icelandic', eu: 'Basque',
  id: 'Indonesian', hi: 'Hindi', nl: 'Dutch', el: 'Greek', ro: 'Romanian', mo: 'Romanian',
  cs: 'Czech', vi: 'Vietnamese', th: 'Thai', et: 'Estonian', lv: 'Latvian', lt: 'Lithuanian',
  cv: 'Chuvash', tab: 'Tabasaran', tk: 'Turkmen', tg: 'Tajik', nv: 'Navajo',
};

async function fetchServerGoogleTtsAudio(rawText: string, rawLang: string): Promise<Buffer | null> {
  const gttsTarget = resolveGoogleTtsLang(rawLang);
  const phonetic = !gttsTarget ? resolvePhoneticTtsTarget(rawText, rawLang, GTTS_SUPPORTED_LANGS) : null;
  const tl = gttsTarget
    ? gttsTarget.tl
    : (phonetic && GTTS_SUPPORTED_LANGS.has(phonetic.lang)
      ? (phonetic.lang === 'zh' ? 'zh-CN' : phonetic.lang)
      : null);
  const textToSpeak = gttsTarget ? rawText : (phonetic ? phonetic.text : rawText);
  if (!tl || !textToSpeak.trim()) return null;

  const trimmed = textToSpeak.trim().slice(0, 200);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(tl)}&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length >= 128 ? buf : null;
  } catch {
    return null;
  }
}

export async function handleGeminiTTS(req: Request, res: Response): Promise<void> {
  const customKey =
    (req.headers['x-goog-api-key'] as string) ||
    req.body?.customKey ||
    (req.query?.key as string) ||
    (req.query?.apiKey as string);
  const apiKey = getServerGeminiKey(customKey);

  const { text, voiceName = 'Kore', lang } = req.body || {};
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: { message: 'text is required' } });
    return;
  }
  const normalizedLang = normalizeCourseLangCode(String(lang || 'en'));
  if (normalizedLang === 'tlh') {
    res.status(400).json({ error: { message: 'Klingon speech is served via /api/tts/klingon or client synthesizer' } });
    return;
  }

  const safeVoice = normalizeVoiceName(voiceName, 'Kore');
  const ttsModels = [TTS_MODEL, TTS_FALLBACK_MODEL];
  const langLabel = TTS_LANGUAGE_LABELS[normalizedLang];
  const geminiPromptText =
    normalizedLang !== 'en' && langLabel
      ? `Read aloud clearly in ${langLabel} with authentic native ${langLabel} pronunciation:\n${text}`
      : text;

  try {
    let lastError: any = null;

    if (isValidGoogleApiKeyFormat(apiKey) && (customKey || !defaultServerGeminiTtsMissing)) {
      const ai = getServerAiClient(customKey);
      let all404 = true;
      for (const candidateModel of ttsModels) {
        try {
          let response: any;
          try {
            response = await withTimeout(
              ai.models.generateContent({
                model: candidateModel,
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: geminiPromptText }],
                  },
                ],
                config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: safeVoice },
                    },
                  },
                },
              }),
              4500,
              'TTS'
            );
          } catch (errWithCfg: any) {
            const msg = String(errWithCfg?.message || '');
            if (msg.includes('speechConfig')) {
              response = await withTimeout(
                ai.models.generateContent({
                  model: candidateModel,
                  contents: [
                    {
                      role: 'user',
                      parts: [{ text: geminiPromptText }],
                    },
                  ],
                  config: {
                    responseModalities: [Modality.AUDIO],
                  },
                }),
                4500,
                'TTS_PLAIN'
              );
            } else {
              throw errWithCfg;
            }
          }

          all404 = false;
          const part = response?.candidates?.[0]?.content?.parts?.[0];
          if (part?.inlineData?.data) {
            const base64Data = part.inlineData.data;
            const isRiffWav = typeof base64Data === 'string' && base64Data.startsWith('UklGR');
            res.json({
              ok: true,
              audioBase64: base64Data,
              mimeType: isRiffWav ? 'audio/wav' : part.inlineData.mimeType || 'audio/pcm;rate=24000',
            });
            return;
          }
        } catch (modelErr: any) {
          lastError = modelErr;
          const errStr = String(modelErr?.message || '');
          if (!errStr.includes('404') && !errStr.includes('NOT_FOUND')) {
            all404 = false;
          }
        }
      }
      if (!customKey && all404) {
        defaultServerGeminiTtsMissing = true;
      }
    }

    // 1. Native Google Translate TTS for all 33 natively supported languages (including la, sv, no, is, et, lv, lt, eu, uk, fi, hu, he)
    if (GTTS_SUPPORTED_LANGS.has(normalizedLang)) {
      const gttsBuf = await fetchServerGoogleTtsAudio(text, normalizedLang);
      if (gttsBuf) {
        res.json({
          ok: true,
          audioBase64: gttsBuf.toString('base64'),
          mimeType: 'audio/mpeg',
          providerUsed: `gtts-${normalizedLang}`,
        });
        return;
      }
    }

    // 2. Native / Phonetically-routed Fish Audio TTS with explicit per-language reference_id (never English bf322df2... for non-English)
    const routed = FISH_NATIVE_LANGS.has(normalizedLang)
      ? { lang: normalizedLang, text }
      : resolvePhoneticTtsTarget(text, normalizedLang, FISH_NATIVE_LANGS);

    const refId = getFishReferenceIdForLang(routed.lang);
    if (FISH_NATIVE_LANGS.has(routed.lang) && refId) {
      try {
        const envFishKey = (process.env.FISH_AUDIO_API_KEY || '').trim();
        const fishApiKey = (envFishKey && envFishKey.startsWith('sk-fish-'))
          ? envFishKey
          : 'sk-fish-u5Iq7Y832NDeKO1mTkjc5_thtfuYFZ8HIiSX7xfNwyo';
        const fishController = new AbortController();
        const fishTimeout = setTimeout(() => fishController.abort(), 5500);
        const fishRes = await fetch('https://api.fish.audio/v1/tts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${fishApiKey}`,
            'Content-Type': 'application/json',
            'model': 's2.1-pro-free',
          },
          body: JSON.stringify({
            text: routed.text,
            format: 'mp3',
            model: 's2.1-pro-free',
            normalize: true,
            latency: 'normal',
            top_p: 0.5,
            temperature: 0.1,
            repetition_penalty: 1.2,
            reference_id: refId,
          }),
          signal: fishController.signal,
        });
        clearTimeout(fishTimeout);
        if (fishRes.ok) {
          const audioBuf = Buffer.from(await fishRes.arrayBuffer());
          if (audioBuf.length > 0) {
            res.json({
              ok: true,
              audioBase64: audioBuf.toString('base64'),
              mimeType: 'audio/mpeg',
              providerUsed: `fish-${routed.lang}`,
            });
            return;
          }
        }
      } catch {}
    }

    // 3. Phonetic GTTS fallback (e.g. eo -> es/it, tt/cv/kk/ky/tg -> ru, uz/az/tk -> tr, yi -> he/de, ka/hy -> it)
    const phoneticGttsBuf = await fetchServerGoogleTtsAudio(text, normalizedLang);
    if (phoneticGttsBuf) {
      res.json({
        ok: true,
        audioBase64: phoneticGttsBuf.toString('base64'),
        mimeType: 'audio/mpeg',
        providerUsed: `gtts-phonetic-${normalizedLang}`,
      });
      return;
    }

    res.status(lastError?.status || 502).json({
      error: { message: lastError?.message || 'No audio returned from TTS engine' },
    });
  } catch (err: any) {
    console.error('[Server Gemini TTS Error]:', err?.message || err);
    res.status(err?.status || 500).json({
      error: { message: err?.message || 'Gemini TTS generation failed' },
    });
  }
}

/**
 * POST /api/gemini/chat
 * Multi-turn conversation on the server using ai.chats.create.
 */
export async function handleGeminiChat(req: Request, res: Response): Promise<void> {
  const customKey = (req.headers['x-goog-api-key'] as string) || req.body?.customKey;
  const apiKey = getServerGeminiKey(customKey);
  if (!apiKey) {
    res.status(503).json({
      error: {
        message: 'GEMINI_API_KEY is not configured on the server. Please attach an API key in Settings > Secrets or server environment.',
        code: 'MISSING_API_KEY',
      },
    });
    return;
  }
  if (!isValidGoogleApiKeyFormat(apiKey)) {
    const payload = buildInvalidKeyErrorPayload(apiKey);
    res.status(payload.httpStatus).json({
      error: {
        message: payload.message,
        status: payload.httpStatus,
        code: payload.code,
      },
    });
    return;
  }
  const serverEnvKey = getRawServerEnvGeminiKey();
  let activeClient = getServerAiClient(customKey);
  let activeKey = apiKey;

  const {
    model = MODEL_FREE,
    history = [],
    message,
    systemInstruction,
  } = req.body || {};

  if (!message) {
    res.status(400).json({ error: { message: 'message is required' } });
    return;
  }

  const requestedModel = String(model || MODEL_FREE).trim();
  const modelChain = getModelChain(requestedModel, false);

  try {
    let response: any = null;
    let lastError: any = null;
    let retriedWithServerKey = false;

    for (let idx = 0; idx < modelChain.length; idx++) {
      const candidateModel = modelChain[idx];
      const baseCfg: any = systemInstruction ? { systemInstruction } : {};
      const chatCfg = buildModelConfig(baseCfg, candidateModel, false);
      try {
        const chat = activeClient.chats.create({
          model: candidateModel,
          config: Object.keys(chatCfg).length > 0 ? chatCfg : undefined,
          history: Array.isArray(history) && history.length > 0 ? history : undefined,
        });
        response = await withTimeout(
          chat.sendMessage({ message }),
          idx === 0 ? 9000 : 11000,
          idx === 0 ? 'CHAT' : `CHAT_FALLBACK_${idx}`
        );
        break;
      } catch (err: any) {
        lastError = err;
        if (
          isAuthKeyError(err) &&
          !retriedWithServerKey &&
          isValidGoogleApiKeyFormat(serverEnvKey) &&
          activeKey !== serverEnvKey
        ) {
          retriedWithServerKey = true;
          activeClient = getServerAiClient();
          activeKey = serverEnvKey;
          idx -= 1;
          continue;
        }
        if (idx < modelChain.length - 1 && isFailoverEligibleError(err)) {
          console.warn(`[Server Gemini Chat Failover]: ${candidateModel} -> ${modelChain[idx + 1]}`);
          continue;
        }
        throw err;
      }
    }

    if (!response) {
      throw lastError || new Error('Gemini chat failed');
    }

    res.json({ text: response.text || '' });
  } catch (err: any) {
    if (isAuthKeyError(err)) {
      const payload = buildInvalidKeyErrorPayload(activeKey, err);
      res.status(payload.httpStatus).json({
        error: { message: payload.message, status: payload.httpStatus, code: payload.code },
      });
      return;
    }
    console.error('[Server Gemini Chat Error]:', err?.message || err);
    res.status(err?.status || 500).json({
      error: { message: err?.message || 'Gemini chat failed' },
    });
  }
}

/**
 * GET & POST /api/gemini/ping
 * Server-side health and latency check.
 */
export async function handleGeminiPing(req: Request, res: Response): Promise<void> {
  const customKey =
    (req.headers['x-goog-api-key'] as string) ||
    req.body?.customKey ||
    (req.query?.key as string) ||
    (req.query?.apiKey as string);
  const apiKey = getServerGeminiKey(customKey as string);
  if (!apiKey) {
    res.json({
      ok: false,
      latencyMs: 0,
      message: 'GEMINI_API_KEY не настроен на сервере. Укажите ключ в переменных окружения (Settings > Secrets).',
    });
    return;
  }
  if (!isValidGoogleApiKeyFormat(apiKey)) {
    const payload = buildInvalidKeyErrorPayload(apiKey);
    res.status(payload.httpStatus).json({
      ok: false,
      latencyMs: 0,
      code: payload.code,
      message: payload.message,
    });
    return;
  }

  const serverEnvKey = getRawServerEnvGeminiKey();
  let activeClient = getServerAiClient(customKey as string);
  let activeKey = apiKey;
  let retriedWithServerKey = false;
  const startTime = Date.now();
  const pingModels = [FAST_FALLBACK_MODEL, MODEL_FREE];

  let lastError: any = null;
  for (let idx = 0; idx < pingModels.length; idx++) {
    const usedModel = pingModels[idx];
    try {
      const cfg = buildModelConfig({}, usedModel, false);
      const response = await withTimeout(
        activeClient.models.generateContent({
          model: usedModel,
          contents: 'Reply with the single word: ONLINE',
          config: Object.keys(cfg).length > 0 ? cfg : undefined,
        }),
        7000,
        'PING'
      );

      const latencyMs = Date.now() - startTime;
      res.json({
        ok: true,
        latencyMs,
        message: 'Gemini API Онлайн и работает (Без VPN и с VPN)!',
        model: usedModel,
        text: response?.text || 'ONLINE',
      });
      return;
    } catch (err: any) {
      lastError = err;
      if (
        isAuthKeyError(err) &&
        !retriedWithServerKey &&
        isValidGoogleApiKeyFormat(serverEnvKey) &&
        activeKey !== serverEnvKey
      ) {
        retriedWithServerKey = true;
        activeClient = getServerAiClient();
        activeKey = serverEnvKey;
        idx -= 1;
        continue;
      }
    }
  }

  const latencyMs = Date.now() - startTime;
  if (isAuthKeyError(lastError)) {
    const payload = buildInvalidKeyErrorPayload(activeKey, lastError);
    res.status(payload.httpStatus).json({
      ok: false,
      latencyMs,
      code: payload.code,
      message: payload.message,
    });
    return;
  }
  console.error('[Server Gemini Ping Error]:', lastError?.message || lastError);
  res.status(502).json({
    ok: false,
    latencyMs,
    message: lastError?.message || 'Server ping failed',
  });
}

/**
 * Sets up WebSocketServer on the HTTP server for real-time Live API voice/video interactions.
 * Connects to gemini-3.8-live and bridges low-latency audio via WebSocket.
 */
export function setupLiveApiWebSocket(httpServer: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const parsedUrl = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    if (pathname === '/api/gemini/live' || pathname === '/live') {
      wss.handleUpgrade(request, socket, head, (clientWs) => {
        wss.emit('connection', clientWs, request);
      });
    }
  });

  wss.on('connection', (clientWs: WebSocket, request) => {
    console.log('[Live API WS] Client connected to Live API session');

    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    let voiceName = normalizeVoiceName(url.searchParams.get('voice') || undefined, 'Zephyr');
    let promptInstruction =
      url.searchParams.get('prompt') ||
      'You are DuoWindo6601, an interactive voice and language learning tutor.';
    let session: any = null;
    let isConnecting = false;
    let isClosed = false;
    const pendingMessages: any[] = [];

    const initLiveSession = async () => {
      if (isConnecting || session || isClosed) return;
      isConnecting = true;
      try {
        const apiKey = getServerGeminiKey();
        if (!apiKey) {
          throw new Error('GEMINI_API_KEY is not configured on the server.');
        }
        if (!isValidGoogleApiKeyFormat(apiKey)) {
          throw new Error(buildInvalidKeyErrorPayload(apiKey).message);
        }

        const liveSession = await getServerAiClient().live.connect({
          model: LIVE_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName } },
            },
            systemInstruction: promptInstruction,
          },
          callbacks: {
            onmessage: (message: LiveServerMessage) => {
              if (clientWs.readyState !== WebSocket.OPEN) return;

              for (const part of message.serverContent?.modelTurn?.parts ?? []) {
                if (part.inlineData?.data) {
                  clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
                }
                if (part.text) {
                  clientWs.send(JSON.stringify({ type: 'text', text: part.text }));
                }
              }

              if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ interrupted: true }));
              }
            },
            onerror: (err: any) => {
              console.warn('[Live API Session Error]:', err?.message || err);
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'error', error: err?.message || 'Live API session error' }));
              }
            },
            onclose: () => {
              if (clientWs.readyState === WebSocket.OPEN) {
                try {
                  clientWs.close();
                } catch {}
              }
            },
          },
        });

        if (isClosed) {
          try {
            liveSession.close();
          } catch {}
          return;
        }

        session = liveSession;
        while (pendingMessages.length > 0) {
          const parsed = pendingMessages.shift();
          try {
            if (parsed.audio) {
              session.sendRealtimeInput({
                audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
              });
            } else if (parsed.text) {
              session.sendClientContent({
                turns: [{ role: 'user', parts: [{ text: parsed.text }] }],
                turnComplete: true,
              });
            }
          } catch (sendErr) {
            console.warn('[Live API WS Pending Send Error]:', sendErr);
          }
        }
      } catch (sessionErr: any) {
        console.error('[Live API Session Connect Error]:', sessionErr?.message || sessionErr);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({ type: 'error', error: sessionErr?.message || 'Live session initialization failed' })
          );
          clientWs.close();
        }
      }
    };

    const setupFallbackTimer = setTimeout(() => {
      void initLiveSession();
    }, 250);

    clientWs.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.type === 'setup') {
          if (parsed.systemInstruction) promptInstruction = String(parsed.systemInstruction);
          if (parsed.voiceName) voiceName = normalizeVoiceName(String(parsed.voiceName), 'Zephyr');
          clearTimeout(setupFallbackTimer);
          void initLiveSession();
          return;
        }
        if (session) {
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          } else if (parsed.text) {
            session.sendClientContent({
              turns: [{ role: 'user', parts: [{ text: parsed.text }] }],
              turnComplete: true,
            });
          }
        } else {
          pendingMessages.push(parsed);
          void initLiveSession();
        }
      } catch (msgErr) {
        console.warn('[Live API WS Message Error]:', msgErr);
      }
    });

    clientWs.on('close', () => {
      isClosed = true;
      clearTimeout(setupFallbackTimer);
      console.log('[Live API WS] Client disconnected, closing Live session');
      try {
        session?.close();
      } catch {}
    });

    clientWs.on('error', (err) => {
      isClosed = true;
      clearTimeout(setupFallbackTimer);
      console.warn('[Live API WS Socket Error]:', err);
      try {
        session?.close();
      } catch {}
    });
  });

  return wss;
}
