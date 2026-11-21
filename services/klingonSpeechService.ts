/**
 * Client-Side Klingon Speech Synthesizer & Audio File Service
 * - Offline Client-Side Formant & Phoneme WAV Synthesizer (16-bit PCM .wav Blob)
 * - Proxied Klingon Audio File Playback & Download via hol.kag.org (/api/tts/klingon)
 * - Supports both tlh_Latn and ConScript pIqaD (U+F8D0-U+F8FF) input
 */

import { isPIqaDText, pIqaDToTlh, splitKlingonPhonemes } from './klingonDictionaryService';

export const KLINGON_SENTENCE_PLAYER_BASE = 'https://hol.kag.org/sentence/';

export type KlingonSpeechSource = 'auto' | 'client' | 'hol';

export interface KlingonAudioInfo {
  text: string;
  normalizedTlh: string;
  source: 'client-wav' | 'hol-mp3';
  mimeType: string;
  filename: string;
}

const SAMPLE_RATE = 22050;
const remoteMp3BlobCache = new Map<string, Blob>();
const clientWavBlobCache = new Map<string, Blob>();
let activeAudioEl: HTMLAudioElement | null = null;
let activeAudioUrl: string | null = null;
let lastAudioInfo: KlingonAudioInfo | null = null;

export const getKlingonLastAudioInfo = (): KlingonAudioInfo | null => lastAudioInfo;

export const getKlingonSentencePlayerUrl = (text: string): string => {
  const clean = normalizeToTlhLatin(text);
  if (!clean) return 'https://hol.kag.org/sentence/Hello';
  return `${KLINGON_SENTENCE_PLAYER_BASE}?sent=${encodeURIComponent(clean.replace(/’/g, "'"))}`;
};

export const normalizeToTlhLatin = (input: string): string => {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';
  const converted = isPIqaDText(trimmed) ? pIqaDToTlh(trimmed) : trimmed;
  return converted.replace(/’/g, "'").replace(/\s+/g, ' ').trim();
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

/**
 * Generates an authentic Client-Side 16-bit PCM WAV Blob for Klingon text.
 * Works 100% offline in the browser with zero network dependency.
 */
export const synthesizeClientKlingonWavBlob = (text: string, isSlow: boolean = false): Blob => {
  const normalized = normalizeToTlhLatin(text);
  const cacheKey = `${normalized}__${isSlow ? 'slow' : 'norm'}`;
  const existing = clientWavBlobCache.get(cacheKey);
  if (existing) return existing;

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

const fetchHolKlingonMp3Blob = async (normalizedTlh: string): Promise<Blob | null> => {
  if (!normalizedTlh || typeof fetch === 'undefined') return null;
  const cacheKey = normalizedTlh.toLowerCase();
  const cached = remoteMp3BlobCache.get(cacheKey);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2200);
    const res = await fetch(`/api/tts/klingon?text=${encodeURIComponent(normalizedTlh)}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('audio')) return null;

    const blob = await res.blob();
    if (!blob || blob.size < 256) return null;
    if (remoteMp3BlobCache.size > 100) {
      const first = remoteMp3BlobCache.keys().next().value;
      if (first) remoteMp3BlobCache.delete(first);
    }
    remoteMp3BlobCache.set(cacheKey, blob);
    return blob;
  } catch {
    return null;
  }
};

/**
 * Generates a downloadable Klingon audio file (.mp3 from hol.kag.org if available, or offline Client Speech .wav).
 */
export const generateKlingonAudioFileBlob = async (
  text: string,
  isSlow: boolean = false,
  sourcePref: KlingonSpeechSource = 'auto'
): Promise<{ blob: Blob; filename: string; mimeType: string; source: 'hol-mp3' | 'client-wav' }> => {
  const normalizedTlh = normalizeToTlhLatin(text);
  const safeSlug = normalizedTlh.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'klingon';

  if (sourcePref !== 'client' && !isSlow && typeof navigator !== 'undefined' && navigator.onLine) {
    const mp3Blob = await fetchHolKlingonMp3Blob(normalizedTlh);
    if (mp3Blob) {
      const filename = `klingon_${safeSlug}.mp3`;
      lastAudioInfo = { text, normalizedTlh, source: 'hol-mp3', mimeType: 'audio/mpeg', filename };
      return { blob: mp3Blob, filename, mimeType: 'audio/mpeg', source: 'hol-mp3' };
    }
  }

  const wavBlob = synthesizeClientKlingonWavBlob(normalizedTlh, isSlow);
  const filename = `klingon_${safeSlug}${isSlow ? '_slow' : ''}.wav`;
  lastAudioInfo = { text, normalizedTlh, source: 'client-wav', mimeType: 'audio/wav', filename };
  return { blob: wavBlob, filename, mimeType: 'audio/wav', source: 'client-wav' };
};

/**
 * Triggers browser download of the generated Klingon audio file (.mp3 / .wav).
 */
export const downloadKlingonAudioFile = async (
  text: string,
  isSlow: boolean = false,
  sourcePref: KlingonSpeechSource = 'auto'
): Promise<{ filename: string; source: 'hol-mp3' | 'client-wav' }> => {
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
 * Primary Client-Side Klingon Speech entry point.
 * 1) Plays authentic hol.kag.org MP3 audio file when available (or when sourcePref='hol'),
 * 2) Plays Client-Side Formant & Phoneme WAV Speech synthesizer cleanly offline & on all browsers.
 */
export const playKlingonSpeech = async (
  text: string,
  isSlow: boolean = false,
  sourcePref: KlingonSpeechSource = 'auto'
): Promise<boolean> => {
  const normalizedTlh = normalizeToTlhLatin(text);
  if (!normalizedTlh) return false;

  // 1. Try hol.kag.org real MP3 audio file if online and not forced to client
  if (sourcePref !== 'client' && typeof navigator !== 'undefined' && navigator.onLine) {
    const mp3Blob = await fetchHolKlingonMp3Blob(normalizedTlh);
    if (mp3Blob) {
      const safeSlug = normalizedTlh.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'klingon';
      lastAudioInfo = {
        text,
        normalizedTlh,
        source: 'hol-mp3',
        mimeType: 'audio/mpeg',
        filename: `klingon_${safeSlug}.mp3`,
      };
      const played = await playBlobViaHtmlAudio(mp3Blob, isSlow ? 0.72 : 1.0);
      if (played) return true;
      const webAudioPlayed = await playBlobViaWebAudio(mp3Blob, isSlow ? 0.72 : 1.0);
      if (webAudioPlayed) return true;
    }
  }

  // 2. Offline Client-Side Formant WAV Speech Synthesizer
  const wavBlob = synthesizeClientKlingonWavBlob(normalizedTlh, isSlow);
  const safeSlug = normalizedTlh.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'klingon';
  lastAudioInfo = {
    text,
    normalizedTlh,
    source: 'client-wav',
    mimeType: 'audio/wav',
    filename: `klingon_${safeSlug}${isSlow ? '_slow' : ''}.wav`,
  };

  const okHtml = await playBlobViaHtmlAudio(wavBlob, 1.0);
  if (okHtml) return true;
  return playBlobViaWebAudio(wavBlob, 1.0);
};
