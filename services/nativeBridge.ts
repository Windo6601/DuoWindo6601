import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { Camera } from '@capacitor/camera';
import { US_EAST1_RUN_DEV_URL, getServerEndpointConfig } from './serverAddressManager';

/**
 * Checks whether DuoWindo6601 is running inside a native Android/iOS Capacitor shell.
 */
export function isNativeCapacitorApp(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (typeof Capacitor?.isNativePlatform === 'function' && Capacitor.isNativePlatform()) {
      return true;
    }
    const winCap = (window as any).Capacitor;
    if (winCap?.isNativePlatform?.()) return true;
    const platform = winCap?.getPlatform?.() || Capacitor?.getPlatform?.();
    if (platform === 'android' || platform === 'ios') return true;
  } catch {
    // ignore
  }
  return false;
}

/**
 * Resolves a backend API path (such as '/api/gemini/generate') to a full URL when running
 * inside the Capacitor Android APK (where window.location.origin is https://localhost),
 * or keeps it relative on hosted web servers unless a custom remote server is configured.
 */
export function resolveApiUrl(apiPath: string): string {
  const normalizedPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  if (typeof window === 'undefined') {
    return normalizedPath;
  }

  const config = getServerEndpointConfig();
  const isNative = isNativeCapacitorApp();

  if (config.mode === 'custom' && config.customUrl.trim()) {
    const base = config.customUrl.trim().replace(/\/+$/, '');
    return `${base}${normalizedPath}`;
  }

  if (isNative) {
    // Inside Android APK WebView (https://localhost), relative /api/* paths hit local static assets and fail with 404.
    // Route to configured remote server or Cloud Run backend.
    const remoteBase =
      config.activeUrl &&
      !config.activeUrl.includes('localhost') &&
      !config.activeUrl.includes('127.0.0.1') &&
      config.activeUrl.startsWith('http')
        ? config.activeUrl.replace(/\/+$/, '')
        : US_EAST1_RUN_DEV_URL;
    return `${remoteBase}${normalizedPath}`;
  }

  return normalizedPath;
}

/**
 * Resolves WebSocket URL for Live API (/api/gemini/live) in both browser and Android APK.
 */
export function resolveWsUrl(wsPath: string): string {
  const normalizedPath = wsPath.startsWith('/') ? wsPath : `/${wsPath}`;
  if (typeof window === 'undefined') {
    return `ws://localhost:3000${normalizedPath}`;
  }

  if (isNativeCapacitorApp()) {
    const httpUrl = resolveApiUrl(normalizedPath);
    return httpUrl.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host || 'localhost:3000';
  return `${protocol}//${host}${normalizedPath}`;
}

/**
 * Requests Android/iOS runtime CAMERA permission before calling getUserMedia({ video: true }).
 */
export async function ensureCameraPermission(): Promise<boolean> {
  if (!isNativeCapacitorApp()) {
    return true;
  }
  try {
    const status = await Camera.checkPermissions();
    if (status.camera === 'granted') {
      return true;
    }
    const requested = await Camera.requestPermissions({ permissions: ['camera'] });
    return requested.camera === 'granted' || requested.camera === 'limited';
  } catch (err) {
    console.warn('[NativeBridge] Camera permission check warning (falling back to WebView prompt):', err);
    return true;
  }
}

/**
 * Requests Android/iOS runtime RECORD_AUDIO permission for microphone & speech recognition.
 */
export async function ensureMicrophonePermission(): Promise<boolean> {
  if (!isNativeCapacitorApp()) {
    return true;
  }
  try {
    const status = await SpeechRecognition.checkPermissions();
    if (status.speechRecognition === 'granted') {
      return true;
    }
    const requested = await SpeechRecognition.requestPermissions();
    return requested.speechRecognition === 'granted';
  } catch (err) {
    console.warn('[NativeBridge] Microphone permission check warning:', err);
    return true;
  }
}

/**
 * Requests both Camera and Microphone permissions at startup or on demand in the Android app.
 */
export async function requestAllMediaPermissions(): Promise<{ camera: boolean; microphone: boolean }> {
  const camera = await ensureCameraPermission();
  const microphone = await ensureMicrophonePermission();
  return { camera, microphone };
}

export interface UnifiedSpeechRecognizer {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

/**
 * Creates a SpeechRecognition instance that uses native Android SpeechRecognizer
 * inside the Capacitor APK (where WebView lacks window.webkitSpeechRecognition)
 * and falls back to standard Web Speech API in desktop/mobile browsers.
 */
export function createSpeechRecognitionAdapter(): UnifiedSpeechRecognizer | null {
  if (typeof window === 'undefined') return null;

  if (isNativeCapacitorApp()) {
    let active = false;
    let latestTranscript = '';
    const listenerHandles: Array<{ remove: () => Promise<void> }> = [];

    const cleanupListeners = async () => {
      while (listenerHandles.length > 0) {
        const h = listenerHandles.pop();
        try {
          await h?.remove();
        } catch {}
      }
      try {
        await SpeechRecognition.removeAllListeners();
      } catch {}
    };

    const emitResult = (adapter: UnifiedSpeechRecognizer, text: string, isFinal: boolean) => {
      if (!adapter.onresult) return;
      const syntheticEvent = {
        resultIndex: 0,
        results: [
          Object.assign([{ transcript: text, confidence: 0.95 }], { isFinal }),
        ],
      };
      adapter.onresult(syntheticEvent);
    };

    const adapter: UnifiedSpeechRecognizer = {
      lang: 'ru-RU',
      continuous: false,
      interimResults: true,
      maxAlternatives: 1,
      onstart: null,
      onresult: null,
      onerror: null,
      onend: null,
      start() {
        if (active) return;
        active = true;
        latestTranscript = '';

        void (async () => {
          try {
            const granted = await ensureMicrophonePermission();
            if (!granted) {
              active = false;
              adapter.onerror?.({ error: 'not-allowed', message: 'Microphone permission denied' });
              adapter.onend?.();
              return;
            }

            const avail = await SpeechRecognition.available().catch(() => ({ available: true }));
            if (!avail.available) {
              active = false;
              adapter.onerror?.({ error: 'service-not-allowed', message: 'Speech recognition service unavailable on device' });
              adapter.onend?.();
              return;
            }

            await cleanupListeners();

            const partialHandle = await SpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
              const text = (Array.isArray(data?.matches) && data.matches[0]) || '';
              if (text) {
                latestTranscript = text;
                emitResult(adapter, text, false);
              }
            });
            listenerHandles.push(partialHandle);

            const stateHandle = await SpeechRecognition.addListener('listeningState', (stateEvt: { status: 'started' | 'stopped' }) => {
              if (stateEvt.status === 'started') {
                adapter.onstart?.();
              } else if (stateEvt.status === 'stopped') {
                if (active) {
                  active = false;
                  if (latestTranscript.trim()) {
                    emitResult(adapter, latestTranscript.trim(), true);
                  }
                  void cleanupListeners();
                  adapter.onend?.();
                }
              }
            });
            listenerHandles.push(stateHandle);

            adapter.onstart?.();

            if (adapter.interimResults) {
              await SpeechRecognition.start({
                language: adapter.lang || 'ru-RU',
                maxResults: adapter.maxAlternatives || 2,
                partialResults: true,
                popup: false,
              });
            } else {
              const res = await SpeechRecognition.start({
                language: adapter.lang || 'ru-RU',
                maxResults: adapter.maxAlternatives || 2,
                partialResults: false,
                popup: false,
              });
              const match = res?.matches?.[0] || '';
              if (match) {
                latestTranscript = match;
                emitResult(adapter, match, true);
              }
              active = false;
              await cleanupListeners();
              adapter.onend?.();
            }
          } catch (err: any) {
            active = false;
            await cleanupListeners();
            adapter.onerror?.({ error: 'audio-capture', message: err?.message || String(err) });
            adapter.onend?.();
          }
        })();
      },
      stop() {
        if (!active) return;
        active = false;
        void (async () => {
          try {
            const finalCandidate = latestTranscript.trim();
            await SpeechRecognition.stop().catch(() => {});
            await cleanupListeners();
            if (finalCandidate) {
              emitResult(adapter, finalCandidate, true);
            }
          } finally {
            adapter.onend?.();
          }
        })();
      },
    };

    return adapter;
  }

  const BrowserSpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!BrowserSpeechRecognition) {
    return null;
  }
  return new BrowserSpeechRecognition();
}
