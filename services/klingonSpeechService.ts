/**
 * Client-Side Klingon Speech Synthesizer & Audio File Service
 * - SAM (Software Automatic Mouth / sam-js) Client-Side Speech Synthesizer (1982 C64/Atari retro formant TTS)
 * - Offline Formant & Phoneme WAV fallback (16-bit PCM .wav Blob)
 * - Proxied Klingon Audio File Playback & Download via hol.kag.org (/api/tts/klingon)
 * - Supports both tlh_Latn and ConScript pIqaD (U+F8D0-U+F8FF) input
 */

import SamJs from 'sam-js';
import { isPIqaDText, pIqaDToTlh, splitKlingonPhonemes } from './klingonDictionaryService.ts';
import { isAppOnlineNow, setAppOnlineState } from './networkState.ts';

export const KLINGON_SENTENCE_PLAYER_BASE = 'https://hol.kag.org/sentence/';
export const KLINGON_HOL_NUQNEH_URL = 'https://hol.kag.org/sentence/nuqneH';
export const KLINGON_HOL_HELLO_URL = KLINGON_HOL_NUQNEH_URL;
export const KLINGON_SAM_HOMEPAGE = 'https://discordier.github.io/sam/';

export type KlingonSpeechSource = 'auto' | 'client' | 'hol';

const KLINGON_SPEECH_MODE_STORAGE_KEY = 'duo_klingon_speech_mode_v2';
let activeKlingonSpeechMode: KlingonSpeechSource = (() => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(KLINGON_SPEECH_MODE_STORAGE_KEY);
      if (saved === 'hol' || saved === 'client' || saved === 'auto') return saved;
    }
  } catch {}
  return 'hol';
})();

export const getKlingonSpeechMode = (): KlingonSpeechSource => activeKlingonSpeechMode;

export const setKlingonSpeechMode = (mode: KlingonSpeechSource): void => {
  activeKlingonSpeechMode = mode;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(KLINGON_SPEECH_MODE_STORAGE_KEY, mode);
    }
  } catch {}
};

export interface KlingonAudioInfo {
  text: string;
  normalizedTlh: string;
  source: 'client-wav' | 'hol-sam-wav' | 'hol-mp3';
  mimeType: string;
  filename: string;
}

const SAMPLE_RATE = 22050;
const remoteAudioBlobCache = new Map<string, { blob: Blob; source: 'hol-mp3' | 'hol-sam-wav' }>();
const clientWavBlobCache = new Map<string, Blob>();
let activeAudioEl: HTMLAudioElement | null = null;
let activeAudioUrl: string | null = null;
let lastAudioInfo: KlingonAudioInfo | null = null;

export const getKlingonLastAudioInfo = (): KlingonAudioInfo | null => lastAudioInfo;

export const normalizeToTlhLatin = (input: string): string => {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';
  const converted = isPIqaDText(trimmed) ? pIqaDToTlh(trimmed) : trimmed;
  return converted.replace(/[’‘`´]/g, "'").replace(/\s+/g, ' ').trim();
};

const KLINGON_SINGLE_LETTER_NAMES: Record<string, string> = {
  a: 'a',
  b: 'ba',
  ch: 'cha',
  D: 'Da',
  e: 'e',
  gh: 'gha',
  H: 'Ha',
  I: 'I',
  j: 'ja',
  l: 'la',
  m: 'ma',
  n: 'na',
  ng: 'nga',
  o: 'o',
  p: 'pa',
  q: 'qa',
  Q: 'Qa',
  r: 'ra',
  S: 'Sa',
  t: 'ta',
  tlh: 'tlha',
  u: 'u',
  v: 'va',
  w: 'wa',
  y: 'ya',
  "'": "'a'",
};

export const resolveKlingonSpeakableText = (input: string): string => {
  const normalized = normalizeToTlhLatin(input);
  if (!normalized) return '';
  if (Object.prototype.hasOwnProperty.call(KLINGON_SINGLE_LETTER_NAMES, normalized)) {
    return KLINGON_SINGLE_LETTER_NAMES[normalized];
  }
  return normalized;
};

export const cleanTextForHolUrl = (input: string): string => {
  const normalized = normalizeToTlhLatin(input);
  if (!normalized) return '';
  return normalized
    .replace(/[?!.,:;—–…"«»()\[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const getKlingonSentencePlayerUrl = (text: string): string => {
  const clean = cleanTextForHolUrl(resolveKlingonSpeakableText(text));
  if (!clean) return KLINGON_HOL_NUQNEH_URL;
  return `${KLINGON_SENTENCE_PLAYER_BASE}${encodeURIComponent(clean)}`;
};

const VOWEL_FORMANTS: Record<string, { f1: number; f2: number; f3: number; dur: number }> = {
  a: { f1: 730, f2: 1120, f3: 2450, dur: 0.145 },
  e: { f1: 540, f2: 1840, f3: 2520, dur: 0.14 },
  I: { f1: 390, f2: 1990, f3: 2560, dur: 0.135 },
  i: { f1: 390, f2: 1990, f3: 2560, dur: 0.135 },
  o: { f1: 480, f2: 860, f3: 2320, dur: 0.145 },
  u: { f1: 320, f2: 740, f3: 2240, dur: 0.145 },
};

const seededNoise = (n: number): number => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
};

const renderVowelSegment = (
  phoneme: string,
  durationSec: number,
  baseF0: number,
  pitchSlope: number
): Float32Array => {
  const numSamples = Math.max(1, Math.floor(durationSec * SAMPLE_RATE));
  const out = new Float32Array(numSamples);
  const cfg = VOWEL_FORMANTS[phoneme] || VOWEL_FORMANTS.a;

  let phase0 = 0;
  let phase1 = 0;
  let phase2 = 0;
  let phase3 = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / numSamples;
    const f0 = baseF0 * (1 + pitchSlope * (t - 0.5));
    phase0 += (2 * Math.PI * f0) / SAMPLE_RATE;
    phase1 += (2 * Math.PI * cfg.f1) / SAMPLE_RATE;
    phase2 += (2 * Math.PI * cfg.f2) / SAMPLE_RATE;
    phase3 += (2 * Math.PI * cfg.f3) / SAMPLE_RATE;

    // Glottal pulse + formant harmonics
    const glottal =
      0.52 * Math.sin(phase0) +
      0.24 * Math.sin(2 * phase0) +
      0.12 * Math.sin(3 * phase0);
    const f1Wave = 0.55 * Math.sin(phase1);
    const f2Wave = 0.30 * Math.sin(phase2);
    const f3Wave = 0.14 * Math.sin(phase3);

    const attack = Math.min(1, t / 0.12);
    const release = Math.min(1, (1 - t) / 0.18);
    const env = attack * release;

    out[i] = env * (0.48 * glottal + 0.52 * (f1Wave + f2Wave + f3Wave)) * 0.65;
  }
  return out;
};

const renderConsonantSegment = (phoneme: string, durationSec: number, baseF0: number): Float32Array => {
  const numSamples = Math.max(1, Math.floor(durationSec * SAMPLE_RATE));
  const out = new Float32Array(numSamples);
  const p = phoneme;

  // Glottal stop '
  if (p === "'" || p === '’') {
    return out; // clean crisp silence break
  }

  // Voiced nasals & approximants: ng, m, n, l, r, w, y
  if (['ng', 'm', 'n', 'l', 'r', 'w', 'y'].includes(p)) {
    const f1 = p === 'ng' ? 280 : p === 'm' ? 260 : p === 'n' ? 300 : p === 'l' ? 360 : p === 'r' ? 420 : 320;
    const f2 = p === 'ng' ? 1150 : p === 'm' ? 920 : p === 'n' ? 1450 : p === 'l' ? 1320 : p === 'y' ? 2150 : 720;
    let ph0 = 0;
    let ph1 = 0;
    let ph2 = 0;

    for (let i = 0; i < numSamples; i++) {
      const t = i / numSamples;
      ph0 += (2 * Math.PI * baseF0 * 0.96) / SAMPLE_RATE;
      ph1 += (2 * Math.PI * f1) / SAMPLE_RATE;
      ph2 += (2 * Math.PI * f2) / SAMPLE_RATE;
      const trillMod = p === 'r' ? 0.55 + 0.45 * Math.sin(2 * Math.PI * 26 * (i / SAMPLE_RATE)) : 1;
      const env = Math.sin(Math.PI * t) * trillMod;
      out[i] = env * (0.45 * Math.sin(ph0) + 0.35 * Math.sin(ph1) + 0.2 * Math.sin(ph2)) * 0.55;
    }
    return out;
  }

  // Voiced plosives/fricative/affricate: b, D, gh, j, v
  if (['b', 'D', 'gh', 'j', 'v'].includes(p)) {
    let ph0 = 0;
    let prevNoise = 0;
    for (let i = 0; i < numSamples; i++) {
      const t = i / numSamples;
      ph0 += (2 * Math.PI * baseF0 * 0.92) / SAMPLE_RATE;
      const rawNoise = seededNoise(i + p.charCodeAt(0) * 97);
      // Low-pass filtered friction for gh / v / j
      prevNoise = prevNoise * 0.68 + rawNoise * 0.32;
      const noiseFactor = p === 'gh' ? 0.38 : p === 'j' ? 0.42 : p === 'v' ? 0.34 : 0.16;
      const burst = (p === 'b' || p === 'D') && t > 0.35 && t < 0.58 ? 0.55 * rawNoise : 0;
      const env = Math.sin(Math.PI * t);
      out[i] = env * (0.42 * Math.sin(ph0) + noiseFactor * prevNoise + burst) * 0.58;
    }
    return out;
  }

  // Canonical Klingon voiceless consonants: tlh, Q, q, H, ch, S, t, p
  let lp = 0;
  let hpPrev = 0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / numSamples;
    const raw = seededNoise(i * 1.7 + p.charCodeAt(0) * 131);

    // Shape spectral brightness: S/ch/tlh are brighter; Q/q/H are deeper uvular
    let shaped = raw;
    if (p === 'Q' || p === 'q' || p === 'H') {
      lp = lp * 0.72 + raw * 0.28;
      shaped = lp * 1.4;
    } else if (p === 'S' || p === 'ch' || p === 'tlh') {
      const hp = raw - hpPrev * 0.85;
      hpPrev = raw;
      shaped = hp * 0.85;
    }

    // Affricate / plosive burst envelope
    let env = Math.sin(Math.PI * t);
    if (p === 'tlh' || p === 'ch' || p === 'Q') {
      env = t < 0.22 ? 0.1 : t < 0.38 ? 1.0 : Math.max(0, 1 - (t - 0.38) / 0.62);
    } else if (p === 'q' || p === 't' || p === 'p') {
      env = t < 0.35 ? 0.05 : Math.exp(-(t - 0.35) * 6.5);
    }

    const amp = p === 'Q' || p === 'H' || p === 'tlh' ? 0.52 : 0.40;
    out[i] = shaped * env * amp;
  }
  return out;
};

const KLINGON_TO_SAM_PHONEME_MAP: Record<string, string> = {
  a: 'AA5',
  e: 'EH5',
  I: 'IH5',
  i: 'IH5',
  o: 'OH5',
  u: 'UW5',
  b: 'B',
  ch: 'CH',
  D: 'D',
  d: 'D',
  gh: 'G/H',
  H: '/H',
  j: 'J',
  l: 'L',
  m: 'M',
  n: 'N',
  ng: 'NX',
  p: 'P',
  q: 'K',
  Q: 'K/H',
  r: 'R',
  S: 'SH',
  t: 'T',
  tlh: 'TL/H',
  v: 'V',
  w: 'W',
  y: 'Y',
  "'": 'Q',
  '’': 'Q',
};

/**
 * Converts tlh_Latn / pIqaD Klingon text into SAM (Software Automatic Mouth) phonetic tokens.
 */
export const klingonWordToSamPhonemes = (word: string): string => {
  const cleanWord = (word || '').replace(/[^a-zA-Z'’]/g, '');
  if (!cleanWord) return '';
  const phonemes = splitKlingonPhonemes(cleanWord);
  const parts: string[] = [];
  for (const ph of phonemes) {
    const mapped = KLINGON_TO_SAM_PHONEME_MAP[ph] || KLINGON_TO_SAM_PHONEME_MAP[ph.toLowerCase()];
    if (mapped) {
      parts.push(mapped);
    }
  }
  return parts.join('');
};

export const klingonToSamPhonemes = (text: string): string => {
  const normalized = normalizeToTlhLatin(text);
  if (!normalized) return '';
  return normalized
    .split(/\s+/)
    .map(w => klingonWordToSamPhonemes(w))
    .filter(Boolean)
    .join(' ');
};

const createWav8BitUint8ArrayFromSamples = (samples: Uint8Array): Uint8Array => {
  const wav = new Uint8Array(44 + samples.length);
  const view = new DataView(wav.buffer);
  const writeAscii = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + samples.length, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE, true); // 8-bit mono = 1 byte/sample
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  writeAscii(36, 'data');
  view.setUint32(40, samples.length, true);
  wav.set(samples, 44);
  return wav;
};

/**
 * Generates raw 8-bit Mono PCM WAV bytes using SAM (Software Automatic Mouth / sam-js).
 * Shared by both client-side browser playback and server /api/tts/klingon (hol.kag.org + SAM).
 */
export const synthesizeSamKlingonWavBytes = (text: string, isSlow: boolean = false): Uint8Array | null => {
  const normalized = normalizeToTlhLatin(text);
  if (!normalized) return null;

  try {
    const sam = new SamJs({
      pitch: 72,
      speed: isSlow ? 108 : 78,
      mouth: 120,
      throat: 112,
    });

    const words = normalized.split(/\s+/).filter(Boolean);
    const wordPhonemes = words.map(w => klingonWordToSamPhonemes(w)).filter(Boolean);
    if (wordPhonemes.length === 0) return null;

    // Group into safe chunks (max 42 phoneme chars per SAM render call)
    const groups: string[] = [];
    let current = '';
    for (const wp of wordPhonemes) {
      if (current && current.length + 1 + wp.length > 42) {
        groups.push(current);
        current = wp;
      } else {
        current = current ? `${current} ${wp}` : wp;
      }
    }
    if (current) groups.push(current);

    const pcmChunks: Uint8Array[] = [];
    const silenceGap = new Uint8Array(Math.floor(SAMPLE_RATE * (isSlow ? 0.14 : 0.08))).fill(128);

    for (let i = 0; i < groups.length; i++) {
      const grp = groups[i];
      let buf = sam.buf8(grp, true);
      if (!(buf instanceof Uint8Array) || buf.length === 0) {
        const rawWords = words.join(' ');
        const convertFn = (SamJs as unknown as { convert?: (text: string) => string }).convert;
        const fallbackConv = typeof convertFn === 'function' ? convertFn(rawWords) : '';
        if (fallbackConv) {
          buf = sam.buf8(fallbackConv.slice(0, 60), true);
        }
      }
      if (buf instanceof Uint8Array && buf.length > 0) {
        pcmChunks.push(buf);
        if (i < groups.length - 1) {
          pcmChunks.push(silenceGap);
        }
      }
    }

    if (pcmChunks.length === 0) return null;
    const totalLen = pcmChunks.reduce((acc, c) => acc + c.length, 0);
    const merged = new Uint8Array(totalLen);
    let pos = 0;
    for (const c of pcmChunks) {
      merged.set(c, pos);
      pos += c.length;
    }
    return createWav8BitUint8ArrayFromSamples(merged);
  } catch {
    return null;
  }
};

/**
 * Generates an authentic Client-Side WAV Blob using SAM (Software Automatic Mouth / sam-js).
 * Chunks longer sentences so SAM's internal 255-phoneme buffer never overflows.
 */
export const synthesizeSamKlingonWavBlob = (text: string, isSlow: boolean = false): Blob | null => {
  const wavBytes = synthesizeSamKlingonWavBytes(text, isSlow);
  if (!wavBytes) return null;
  return new Blob([new Uint8Array(wavBytes)], { type: 'audio/wav' });
};

/**
 * Generates an authentic Client-Side WAV Blob for Klingon text.
 * Uses SAM Software Automatic Mouth (sam-js) first, with formant PCM fallback.
 */
export const synthesizeClientKlingonWavBlob = (text: string, isSlow: boolean = false): Blob => {
  const normalized = normalizeToTlhLatin(text);
  const cacheKey = `sam_${normalized}__${isSlow ? 'slow' : 'norm'}`;
  const existing = clientWavBlobCache.get(cacheKey);
  if (existing) return existing;

  const samBlob = synthesizeSamKlingonWavBlob(normalized, isSlow);
  if (samBlob) {
    if (clientWavBlobCache.size > 120) {
      const firstKey = clientWavBlobCache.keys().next().value;
      if (firstKey) clientWavBlobCache.delete(firstKey);
    }
    clientWavBlobCache.set(cacheKey, samBlob);
    return samBlob;
  }

  const speed = isSlow ? 1.48 : 1.0;
  const words = normalized.split(/\s+/).filter(Boolean);
  const chunks: Float32Array[] = [];

  // Leading micro-silence
  chunks.push(new Float32Array(Math.floor(SAMPLE_RATE * 0.04)));

  words.forEach((word, wIdx) => {
    const cleanWord = word.replace(/[^a-zA-Z'’]/g, '');
    const phonemes = splitKlingonPhonemes(cleanWord);
    const totalPhonemes = Math.max(1, phonemes.length);

    phonemes.forEach((ph, pIdx) => {
      const progress = pIdx / totalPhonemes;
      const baseF0 = 126 - progress * 12; // Natural masculine/warrior downward Klingon cadence

      if (VOWEL_FORMANTS[ph]) {
        const vDur = VOWEL_FORMANTS[ph].dur * speed;
        const slope = word.endsWith('?') || word.includes("’a'") || word.includes("'a'") ? 0.12 : -0.06;
        chunks.push(renderVowelSegment(ph, vDur, baseF0, slope));
      } else {
        const cDur =
          (ph === 'tlh' || ph === 'Q' || ph === 'ch'
            ? 0.115
            : ph === "'" || ph === '’'
              ? 0.065
              : 0.085) * speed;
        chunks.push(renderConsonantSegment(ph, cDur, baseF0));
      }
    });

    if (wIdx < words.length - 1) {
      chunks.push(new Float32Array(Math.floor(SAMPLE_RATE * 0.11 * speed)));
    }
  });

  // Trailing silence
  chunks.push(new Float32Array(Math.floor(SAMPLE_RATE * 0.08)));

  const totalSamples = chunks.reduce((acc, arr) => acc + arr.length, 0);
  const pcmBuffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(pcmBuffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // Standard 16-bit Mono PCM WAV Header
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + totalSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, totalSamples * 2, true);

  let offset = 44;
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++) {
      const clamped = Math.max(-0.98, Math.min(0.98, chunk[i]));
      view.setInt16(offset, Math.floor(clamped * 32767), true);
      offset += 2;
    }
  }

  const blob = new Blob([pcmBuffer], { type: 'audio/wav' });
  if (clientWavBlobCache.size > 120) {
    const firstKey = clientWavBlobCache.keys().next().value;
    if (firstKey) clientWavBlobCache.delete(firstKey);
  }
  clientWavBlobCache.set(cacheKey, blob);
  return blob;
};

const stopActiveAudio = () => {
  if (activeAudioEl) {
    try {
      activeAudioEl.pause();
      activeAudioEl.src = '';
    } catch {}
    activeAudioEl = null;
  }
  if (activeAudioUrl) {
    try {
      URL.revokeObjectURL(activeAudioUrl);
    } catch {}
    activeAudioUrl = null;
  }
};

const playBlobViaHtmlAudio = async (blob: Blob, playbackRate: number = 1.0): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  stopActiveAudio();
  const url = URL.createObjectURL(blob);
  activeAudioUrl = url;
  const audio = new Audio(url);
  audio.playbackRate = playbackRate;
  activeAudioEl = audio;

  return new Promise<boolean>((resolve) => {
    audio.onended = () => {
      if (activeAudioUrl === url) {
        URL.revokeObjectURL(url);
        activeAudioUrl = null;
      }
      resolve(true);
    };
    audio.onerror = () => {
      if (activeAudioUrl === url) {
        URL.revokeObjectURL(url);
        activeAudioUrl = null;
      }
      resolve(false);
    };
    audio.play().catch(() => {
      resolve(false);
    });
  });
};

const playBlobViaWebAudio = async (blob: Blob, playbackRate: number = 1.0): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return false;
  try {
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = playbackRate;
    source.connect(ctx.destination);
    source.start(0);
    return true;
  } catch {
    return false;
  }
};

const fetchHolKlingonAudioBlob = async (
  normalizedTlh: string,
  isSlow: boolean = false
): Promise<{ blob: Blob; source: 'hol-mp3' | 'hol-sam-wav' } | null> => {
  if (!normalizedTlh || typeof fetch === 'undefined' || !isAppOnlineNow()) return null;
  const cacheKey = `${normalizedTlh.toLowerCase()}__${isSlow ? 'slow' : 'norm'}`;
  const cached = remoteAudioBlobCache.get(cacheKey);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7500);
    const res = await fetch(`/api/tts/klingon?text=${encodeURIComponent(normalizedTlh)}${isSlow ? '&slow=1' : ''}`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('audio')) return null;

    const blob = await res.blob();
    if (!blob || blob.size < 256) return null;
    const headerSrc = (res.headers.get('x-klingon-audio-source') || '').toLowerCase();
    const source: 'hol-mp3' | 'hol-sam-wav' =
      contentType.includes('mpeg') || contentType.includes('mp3') || headerSrc === 'hol.kag.org'
        ? 'hol-mp3'
        : 'hol-sam-wav';

    if (remoteAudioBlobCache.size > 100) {
      const first = remoteAudioBlobCache.keys().next().value;
      if (first) remoteAudioBlobCache.delete(first);
    }
    const entry = { blob, source };
    remoteAudioBlobCache.set(cacheKey, entry);
    return entry;
  } catch {
    return null;
  }
};

const notifyKlingonOffline = () => {
  setAppOnlineState(false, true);
};

/**
 * Generates a downloadable Klingon audio file:
 * - Real hol.kag.org .mp3 when hol.kag.org mode is active & online
 * - SAM (Software Automatic Mouth) .wav when client mode is selected while online
 */
export const generateKlingonAudioFileBlob = async (
  text: string,
  isSlow: boolean = false,
  sourcePref: KlingonSpeechSource = 'auto'
): Promise<{ blob: Blob; filename: string; mimeType: string; source: 'hol-mp3' | 'hol-sam-wav' | 'client-wav' }> => {
  if (!isAppOnlineNow()) {
    notifyKlingonOffline();
    throw new Error('Нет подключения к интернету');
  }
  const speakableTlh = resolveKlingonSpeakableText(text);
  const safeSlug = speakableTlh.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'klingon';
  const effectivePref = sourcePref === 'auto' ? getKlingonSpeechMode() : sourcePref;

  if (effectivePref !== 'client' && isAppOnlineNow()) {
    const remote = await fetchHolKlingonAudioBlob(speakableTlh, isSlow);
    if (remote) {
      const isMp3 = remote.source === 'hol-mp3' || remote.blob.type.includes('mpeg');
      const ext = isMp3 ? 'hol.mp3' : 'sam.wav';
      const filename = `klingon_${safeSlug}${isSlow ? '_slow' : ''}_${ext}`;
      const mimeType = remote.blob.type || (isMp3 ? 'audio/mpeg' : 'audio/wav');
      lastAudioInfo = { text, normalizedTlh: speakableTlh, source: remote.source, mimeType, filename };
      return { blob: remote.blob, filename, mimeType, source: remote.source };
    }
  }

  const wavBlob = synthesizeClientKlingonWavBlob(speakableTlh, isSlow);
  const filename = `klingon_${safeSlug}${isSlow ? '_slow' : ''}_sam.wav`;
  lastAudioInfo = { text, normalizedTlh: speakableTlh, source: 'client-wav', mimeType: 'audio/wav', filename };
  return { blob: wavBlob, filename, mimeType: 'audio/wav', source: 'client-wav' };
};

/**
 * Triggers browser download of the generated Klingon audio file (.mp3 from hol.kag.org or SAM .wav).
 */
export const downloadKlingonAudioFile = async (
  text: string,
  isSlow: boolean = false,
  sourcePref: KlingonSpeechSource = 'auto'
): Promise<{ filename: string; source: 'hol-mp3' | 'hol-sam-wav' | 'client-wav' }> => {
  if (!isAppOnlineNow()) {
    notifyKlingonOffline();
    throw new Error('Нет подключения к интернету');
  }
  const file = await generateKlingonAudioFileBlob(text, isSlow, sourcePref);
  if (typeof document !== 'undefined') {
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  return { filename: file.filename, source: file.source };
};

/**
 * Primary Klingon Speech entry point (online-only):
 * - 'hol' (default): plays authentic hol.kag.org MP3 voice (/api/tts/klingon), falling back to SAM WAV when online.
 * - 'client': plays SAM (Software Automatic Mouth) WAV directly when online.
 */
export const playKlingonSpeech = async (
  text: string,
  isSlow: boolean = false,
  sourcePref: KlingonSpeechSource = 'auto'
): Promise<boolean> => {
  if (!isAppOnlineNow()) {
    notifyKlingonOffline();
    return false;
  }
  const speakableTlh = resolveKlingonSpeakableText(text);
  if (!speakableTlh) return false;
  const safeSlug = speakableTlh.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'klingon';
  const effectivePref = sourcePref === 'auto' ? getKlingonSpeechMode() : sourcePref;

  if (effectivePref !== 'client' && isAppOnlineNow()) {
    const remote = await fetchHolKlingonAudioBlob(speakableTlh, isSlow);
    if (remote) {
      const isMp3 = remote.source === 'hol-mp3' || remote.blob.type.includes('mpeg');
      const playbackRate = isMp3 && isSlow ? 0.78 : 1.0;
      lastAudioInfo = {
        text,
        normalizedTlh: speakableTlh,
        source: remote.source,
        mimeType: remote.blob.type || (isMp3 ? 'audio/mpeg' : 'audio/wav'),
        filename: `klingon_${safeSlug}${isSlow ? '_slow' : ''}_${isMp3 ? 'hol.mp3' : 'sam.wav'}`,
      };
      const played = await playBlobViaHtmlAudio(remote.blob, playbackRate);
      if (played) return true;
      const webAudioPlayed = await playBlobViaWebAudio(remote.blob, playbackRate);
      if (webAudioPlayed) return true;
    }
  }

  // Client-Side SAM (Software Automatic Mouth) Synthesizer (online-only)
  const wavBlob = synthesizeClientKlingonWavBlob(speakableTlh, isSlow);
  lastAudioInfo = {
    text,
    normalizedTlh: speakableTlh,
    source: effectivePref === 'hol' ? 'hol-sam-wav' : 'client-wav',
    mimeType: 'audio/wav',
    filename: `klingon_${safeSlug}${isSlow ? '_slow' : ''}_sam.wav`,
  };

  const okHtml = await playBlobViaHtmlAudio(wavBlob, 1.0);
  if (okHtml) return true;
  return playBlobViaWebAudio(wavBlob, 1.0);
};
