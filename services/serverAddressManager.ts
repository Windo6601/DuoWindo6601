/**
 * Server Address & Endpoint Manager for DuoWindo6601
 * Manages Cloud Run (us-east1.run.app) and Google AI Studio (ai.studio)
 * endpoints for Administrators and Developers.
 */

export const US_EAST1_RUN_DEV_URL = 'https://ais-dev-ujm2ttrsbtjzfq4vw4ugz3-76544165513.us-east1.run.app';
export const US_EAST1_RUN_PREVIEW_URL = 'https://ais-pre-ujm2ttrsbtjzfq4vw4ugz3-76544165513.us-east1.run.app';
export const AI_STUDIO_WEB_URL = 'https://aistudio.google.com';
export const AI_STUDIO_DIRECT_API = 'https://generativelanguage.googleapis.com';

export type ServerAddressMode = 'us-east1' | 'ai-studio' | 'auto' | 'custom';

export interface ServerEndpointConfig {
  mode: ServerAddressMode;
  customUrl: string;
  proxyEnabled: boolean;
  activeUrl: string;
  label: string;
  description: string;
}

const STORAGE_KEY = 'duowindo_server_endpoint_config';

/**
 * Returns the detected current origin in the browser, safely handling SSR/localhost.
 */
export const getCurrentOrigin = (): string => {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    if (origin && origin !== 'null' && (origin.startsWith('http://') || origin.startsWith('https://'))) {
      return origin;
    }
  }
  return 'http://localhost:3000';
};

/**
 * Returns the current server endpoint configuration.
 */
export const getServerEndpointConfig = (): ServerEndpointConfig => {
  const currentOrigin = getCurrentOrigin();
  const defaultMode: ServerAddressMode = currentOrigin.includes('us-east1.run.app') 
    ? 'us-east1' 
    : (currentOrigin.includes('localhost') ? 'auto' : 'us-east1');

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return resolveEndpointConfig(parsed.mode || defaultMode, parsed.customUrl || '', parsed.proxyEnabled ?? true);
    }
  } catch (e) {
    console.warn('Error reading server endpoint config:', e);
  }

  return resolveEndpointConfig(defaultMode, '', true);
};

/**
 * Helper to compute active URL and descriptions based on mode.
 */
function resolveEndpointConfig(mode: ServerAddressMode, customUrl: string, proxyEnabled: boolean): ServerEndpointConfig {
  const currentOrigin = getCurrentOrigin();
  let activeUrl = currentOrigin;
  let label = 'Авто-определение (Auto Origin)';
  let description = 'Использует текущий адрес загрузки приложения';

  switch (mode) {
    case 'us-east1':
      activeUrl = US_EAST1_RUN_DEV_URL;
      label = 'Cloud Run (us-east1.run.app)';
      description = 'Выделенный US Cloud Run прокси (us-east1). Обходит блокировки User Location Not Supported и обеспечивает быструю маршрутизацию Gemini в США.';
      break;

    case 'ai-studio':
      activeUrl = proxyEnabled ? `${currentOrigin}` : AI_STUDIO_DIRECT_API;
      label = 'Google AI Studio (ai.studio)';
      description = 'Официальная среда Google AI Studio. Прямой доступ к API Google Gemini для разработчиков.';
      break;

    case 'custom':
      activeUrl = customUrl.trim() || currentOrigin;
      label = 'Пользовательский адрес (Custom URL)';
      description = `Пользовательский сервер разработчика: ${activeUrl}`;
      break;

    case 'auto':
    default:
      activeUrl = currentOrigin;
      label = `Текущий адрес (${currentOrigin.replace(/^https?:\/\//, '').split('/')[0]})`;
      description = 'Автоматическое использование текущего домена браузера для всех API-запросов.';
      break;
  }

  return {
    mode,
    customUrl,
    proxyEnabled,
    activeUrl,
    label,
    description,
  };
}

/**
 * Saves and applies new server endpoint settings.
 */
export const saveServerEndpointConfig = (
  mode: ServerAddressMode,
  customUrl: string = '',
  proxyEnabled: boolean = true
): ServerEndpointConfig => {
  const config = resolveEndpointConfig(mode, customUrl, proxyEnabled);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mode,
      customUrl,
      proxyEnabled,
      updatedAt: new Date().toISOString()
    }));
  } catch (e) {
    console.warn('Could not save server endpoint config:', e);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('duowindo_server_endpoint_changed', { detail: config }));
  }

  return config;
};

/**
 * Returns the effective Gemini Proxy Base URL for client SDK requests.
 */
export const getActiveGeminiProxyUrl = (): string => {
  const config = getServerEndpointConfig();
  const currentOrigin = getCurrentOrigin();

  if (config.mode === 'us-east1') {
    // If the browser is ALREADY running on us-east1.run.app, use relative path to prevent unnecessary CORS
    if (currentOrigin.includes('us-east1.run.app')) {
      return `${currentOrigin}/api/gemini-proxy`;
    }
    return `${US_EAST1_RUN_DEV_URL}/api/gemini-proxy`;
  }

  if (config.mode === 'ai-studio') {
    if (!config.proxyEnabled) {
      return AI_STUDIO_DIRECT_API;
    }
    return `${currentOrigin}/api/gemini-proxy`;
  }

  if (config.mode === 'custom' && config.customUrl.trim()) {
    const base = config.customUrl.trim().replace(/\/+$/, '');
    return `${base}/api/gemini-proxy`;
  }

  return `${currentOrigin}/api/gemini-proxy`;
};

export interface PingResult {
  ok: boolean;
  latencyMs: number;
  statusCode?: number;
  message: string;
}

/**
 * Pings an HTTP endpoint with a strict timeout to measure connection and latency.
 * Never hangs.
 */
export const pingServerEndpoint = async (url: string, timeoutMs: number = 4000): Promise<PingResult> => {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Add health or test query if not already present
    const testUrl = url.includes('/api/') 
      ? url 
      : `${url.replace(/\/+$/, '')}/api/server-info`;

    const res = await fetch(testUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json, text/plain, */*'
      }
    });

    clearTimeout(timer);
    const latencyMs = Date.now() - start;

    if (res.ok) {
      return {
        ok: true,
        latencyMs,
        statusCode: res.status,
        message: `Онлайн (${latencyMs} мс)`
      };
    }

    return {
      ok: res.status < 500,
      latencyMs,
      statusCode: res.status,
      message: `Ответ HTTP ${res.status} (${latencyMs} мс)`
    };
  } catch (err: any) {
    clearTimeout(timer);
    const latencyMs = Date.now() - start;
    const isTimeout = err?.name === 'AbortError' || String(err).includes('abort');

    // As a secondary check for cross-origin endpoints where /api/server-info might have CORS headers:
    // Try pinging the root with mode: no-cors to at least verify network availability
    if (!isTimeout && !url.includes('/api/')) {
      try {
        const ping2Controller = new AbortController();
        const timer2 = setTimeout(() => ping2Controller.abort(), 2000);
        await fetch(url, {
          method: 'GET',
          mode: 'no-cors',
          signal: ping2Controller.signal
        });
        clearTimeout(timer2);
        return {
          ok: true,
          latencyMs: Date.now() - start,
          message: `Доступен (${Date.now() - start} мс)`
        };
      } catch {}
    }

    return {
      ok: false,
      latencyMs,
      message: isTimeout ? 'Таймаут соединения (>4 сек)' : 'Сетевая ошибка / Офлайн'
    };
  }
};
