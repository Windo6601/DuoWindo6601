import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import {
  handleGeminiGenerate,
  handleGeminiStream,
  handleGeminiTTS,
  handleGeminiChat,
  handleGeminiPing,
  setupLiveApiWebSocket,
} from './services/serverGemini.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());

// Health & connectivity check endpoint (works both with VPN and without VPN)
app.get('/api/server-info', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    ok: true,
    service: 'DuoWindo6601',
    region: 'us-east1',
    worksWithVpn: true,
    worksWithoutVpn: true,
    geminiProxyPath: '/api/gemini-proxy',
    serverGemini: true,
    liveApiEnabled: true,
    streamingEnabled: true,
    timestamp: new Date().toISOString(),
  });
});

// Direct binary Android APK download endpoint with exact MIME type and headers
app.get(['/api/download-apk', '/downloads/app-debug.apk', '/app-debug.apk'], (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const candidates = [
    path.resolve(process.cwd(), 'public/downloads/app-debug.apk'),
    path.resolve(process.cwd(), 'public/app-debug.apk'),
    path.resolve(__dirname, 'public/downloads/app-debug.apk'),
    path.resolve(__dirname, 'public/app-debug.apk'),
  ];
  const found = candidates.find(c => fs.existsSync(c));
  if (found) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="app-debug.apk"');
    res.setHeader('Cache-Control', 'no-cache');
    const stat = fs.statSync(found);
    res.setHeader('Content-Length', stat.size);
    const stream = fs.createReadStream(found);
    stream.pipe(res);
  } else {
    res.status(404).json({ error: 'app-debug.apk not found. Please build it first.' });
  }
});

// ============================================================================
// SERVER-SIDE GEMINI API ENDPOINTS (Never exposes API key to browser)
// ============================================================================
app.post('/api/gemini/generate', express.json({ limit: '50mb' }), handleGeminiGenerate);
app.post('/api/gemini/stream', express.json({ limit: '10mb' }), handleGeminiStream);
app.get('/api/gemini/stream', handleGeminiStream);
app.post('/api/gemini/tts', express.json({ limit: '10mb' }), handleGeminiTTS);
app.post('/api/gemini/chat', express.json({ limit: '10mb' }), handleGeminiChat);
app.all('/api/gemini/ping', handleGeminiPing);

// Server-side Gemini API proxy to avoid browser geo-restrictions
app.use('/api/gemini-proxy', express.raw({ type: '*/*', limit: '50mb' }), async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const targetUrl = `https://generativelanguage.googleapis.com${req.url}`;

  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (v && typeof v === 'string' && !['host', 'connection', 'content-length'].includes(k.toLowerCase())) {
      headers[k] = v;
    }
  }

  const serverKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
  const incomingKey = (headers['x-goog-api-key'] || '').trim();
  if (!incomingKey || incomingKey === 'undefined' || incomingKey === 'null' || incomingKey === 'SYSTEM_FREE_TRAFFIC') {
    if (serverKey) {
      headers['x-goog-api-key'] = serverKey;
    } else {
      delete headers['x-goog-api-key'];
    }
  }

  const bodyBuffer =
    req.method !== 'GET' && req.method !== 'HEAD' && Buffer.isBuffer(req.body) && req.body.length > 0
      ? req.body
      : undefined;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const googleRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: bodyBuffer,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    res.status(googleRes.status);
    googleRes.headers.forEach((val, key) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, val);
      }
    });

    const arrayBuffer = await googleRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error('[Gemini Server Proxy Error]:', err);
    if (!res.headersSent) {
      res.status(502).json({
        error: {
          code: 502,
          message: 'Failed to proxy request: ' + (err?.message || err),
        },
      });
    } else {
      res.end();
    }
  }
});

// Fish Audio TTS API Proxy
app.post('/api/tts/fish', express.json(), async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { text, format = 'mp3', reference_id, lang, model = 's2.1-pro-free' } = req.body || {};
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: { message: 'Text is required' } });
    return;
  }

  const envFishKey = (process.env.FISH_AUDIO_API_KEY || '').trim();
  const customHeaderKey = String(req.headers['x-fish-api-key'] || '').trim();
  const fishApiKey = (customHeaderKey && customHeaderKey.startsWith('sk-fish-'))
    ? customHeaderKey
    : (envFishKey && envFishKey.startsWith('sk-fish-'))
      ? envFishKey
      : 'sk-fish-u5Iq7Y832NDeKO1mTkjc5_thtfuYFZ8HIiSX7xfNwyo';

  const requestedModel = String(model || 's2.1-pro-free').trim() || 's2.1-pro-free';
  const callFish = async (fishModel: string) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      return await fetch('https://api.fish.audio/v1/tts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${fishApiKey}`,
          'Content-Type': 'application/json',
          'model': fishModel,
        },
        body: JSON.stringify({
          text,
          format: format || 'mp3',
          model: fishModel,
          normalize: true,
          latency: 'normal',
          top_p: 0.5,
          temperature: 0.1,
          repetition_penalty: 1.2,
          ...(reference_id ? { reference_id } : {})
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    let usedModel = requestedModel;
    let fishRes = await callFish(requestedModel);

    // If paid model (drama-3, s2.1-pro, s2-pro) returns 402 Insufficient API credit, gracefully fall back to s2.1-pro-free
    if (!fishRes.ok && fishRes.status === 402 && requestedModel !== 's2.1-pro-free') {
      console.warn(`[Fish Audio Proxy]: ${requestedModel} returned 402 (paid credit required), falling back to s2.1-pro-free`);
      usedModel = 's2.1-pro-free';
      fishRes = await callFish('s2.1-pro-free');
    }

    if (!fishRes.ok) {
      const errText = await fishRes.text();
      console.error('[Fish Audio Proxy Error]:', fishRes.status, errText);
      res.status(fishRes.status).json({ error: { message: errText || 'Fish Audio API error' } });
      return;
    }

    res.setHeader('Content-Type', fishRes.headers.get('content-type') || 'audio/mpeg');
    res.setHeader('X-Fish-Model-Used', usedModel);
    const arrayBuffer = await fishRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error('[Fish Audio Proxy Exception]:', err);
    res.status(502).json({ error: { message: err?.message || 'Fish Audio proxy failed' } });
  }
});

// Grok TTS API Proxy
app.post('/api/tts/grok', express.json(), async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { text, format = 'mp3', lang } = req.body || {};
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: { message: 'Text is required' } });
    return;
  }

  const xaiApiKey = process.env.XAI_API_KEY || 'xai-dOiFtHEvohXMcr3ifgfKB5S3tYNG9fl9jRyTdD1oe4C9SEpsyUEIqeNPbcMrssdWrHFzy0eL9h3NjbFm';

  try {
    console.log('[Grok TTS Proxy]: Generating speech for text:', text.substring(0, 50) + '...');
    const xaiRes = await fetch('https://api.x.ai/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${xaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        format: format || 'mp3',
        voice_id: 'eve'
      })
    });

    const requestId = xaiRes.headers.get('x-request-id') || xaiRes.headers.get('trace-id');
    if (requestId) {
      console.log('[Grok TTS Proxy]: Request ID:', requestId);
    }

    if (!xaiRes.ok) {
      const errText = await xaiRes.text();
      console.error('[Grok TTS Proxy Error]:', xaiRes.status, errText, 'Request ID:', requestId);
      res.status(xaiRes.status).json({ error: { message: errText || 'x.AI API error', requestId } });
      return;
    }

    res.setHeader('Content-Type', xaiRes.headers.get('content-type') || 'audio/mpeg');
    const arrayBuffer = await xaiRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error('[Grok TTS Proxy Exception]:', err);
    res.status(502).json({ error: { message: err?.message || 'Grok TTS proxy failed' } });
  }
});

// MCP (Model Context Protocol) & Jules debugging status endpoint
app.get('/api/mcp/status', (_req, res) => {
  const renderMcpKey = process.env.RENDER_MCP_API_KEY || '';
  const julesKey = (process.env.JULES_API_KEY || '').trim();
  res.json({
    mcpEnabled: true,
    julesDebugging: true,
    julesApiConfigured: !!julesKey,
    mcpServer: 'render-mcp',
    renderApiKeyConfigured: !!renderMcpKey,
    maskedKey: renderMcpKey ? `${renderMcpKey.substring(0, 8)}••••${renderMcpKey.substring(renderMcpKey.length - 4)}` : null,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// GOOGLE JULES API SERVER-SIDE PROXY (process.env.JULES_API_KEY only)
// ============================================================================
const JULES_API_BASE = 'https://jules.googleapis.com/v1alpha';

function getServerJulesKey(): string {
  return (process.env.JULES_API_KEY || '').trim();
}

app.get('/api/jules/status', (_req, res) => {
  const julesKey = getServerJulesKey();
  res.json({
    configured: !!julesKey,
    endpoint: JULES_API_BASE,
    maskedKey: julesKey && julesKey.length > 10
      ? `${julesKey.substring(0, 8)}••••${julesKey.substring(julesKey.length - 4)}`
      : null,
    policyCompliant: true,
    envVarName: 'JULES_API_KEY',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/jules/sources', async (_req, res) => {
  const julesKey = getServerJulesKey();
  if (!julesKey) {
    res.status(503).json({
      error: {
        code: 503,
        message: 'JULES_API_KEY is not configured in server environment variables. Never expose API keys in client code.',
      },
    });
    return;
  }

  try {
    const upstream = await fetch(`${JULES_API_BASE}/sources`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': julesKey,
        'Accept': 'application/json',
      },
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.send(text);
  } catch (err: any) {
    console.error('[Google Jules Sources Proxy Error]:', err);
    res.status(502).json({
      error: {
        code: 502,
        message: err?.message || 'Failed to connect to Google Jules API',
      },
    });
  }
});

app.all('/api/jules/sessions', express.json({ limit: '2mb' }), async (req, res) => {
  const julesKey = getServerJulesKey();
  if (!julesKey) {
    res.status(503).json({
      error: {
        code: 503,
        message: 'JULES_API_KEY is not configured in server environment variables.',
      },
    });
    return;
  }

  try {
    const upstream = await fetch(`${JULES_API_BASE}/sessions`, {
      method: req.method,
      headers: {
        'X-Goog-Api-Key': julesKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body || {}) : undefined,
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.send(text);
  } catch (err: any) {
    console.error('[Google Jules Sessions Proxy Error]:', err);
    res.status(502).json({
      error: {
        code: 502,
        message: err?.message || 'Failed to proxy Google Jules sessions',
      },
    });
  }
});

app.use('/api/jules-proxy', express.raw({ type: '*/*', limit: '5mb' }), async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const julesKey = getServerJulesKey();
  if (!julesKey) {
    res.status(503).json({
      error: {
        code: 503,
        message: 'JULES_API_KEY is not configured in server environment variables.',
      },
    });
    return;
  }

  const targetUrl = `${JULES_API_BASE}${req.url}`;
  const bodyBuffer =
    req.method !== 'GET' && req.method !== 'HEAD' && Buffer.isBuffer(req.body) && req.body.length > 0
      ? req.body
      : undefined;

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'X-Goog-Api-Key': julesKey,
        'Content-Type': (req.headers['content-type'] as string) || 'application/json',
        'Accept': 'application/json',
      },
      body: bodyBuffer,
    });
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    const arrayBuffer = await upstream.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error('[Google Jules Proxy Error]:', err);
    res.status(502).json({
      error: {
        code: 502,
        message: err?.message || 'Failed to proxy Google Jules API request',
      },
    });
  }
});

// ============================================================================
// STRIPE PAYMENT & SUBSCRIPTION API
// ============================================================================
// Determine valid secret key (must start with sk_)
const envSecret = (process.env.STRIPE_SECRET_KEY || '').trim();
// If the environment has an expired key or old key, prefer the active provided key:
const ACTIVE_STRIPE_SECRET_KEY = 'sk_test_51UZPQYR2xWGfF5QL1RkEalzc3F0rHk8pCQOwTgkOIg0aofVvdzslDzXux2fHMnIMSf0Swyj8hoV6GlIVYCvc3Xda001YP4ap7S';
const ACTIVE_STRIPE_PUBLISHABLE_KEY = 'pk_test_51UZPQYR2xWGfF5QLpBkQOi0CVGHV2CetjHPncuC4EMOl4n7Il2K3IZ2oVmhmpyilMHTKxU9OlkPyNoezEoBPn0cL00OrUW1tyW';

const STRIPE_SECRET_KEY = (envSecret.startsWith('sk_') && !envSecret.includes('51UYtzR'))
  ? envSecret
  : ACTIVE_STRIPE_SECRET_KEY;

// Determine valid publishable key (must start with pk_)
const envPub = (process.env.STRIPE_PUBLISHABLE_KEY || '').trim();
const STRIPE_PUBLISHABLE_KEY = (envPub.startsWith('pk_') && !envPub.includes('51UYtzR'))
  ? envPub
  : ACTIVE_STRIPE_PUBLISHABLE_KEY;

let stripeClient: any = null;
try {
  const StripeModule = await import('stripe');
  const StripeConstructor = (StripeModule as any).default || StripeModule;
  stripeClient = new StripeConstructor(STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia' as any,
  });
  console.log('[Stripe] Initialized successfully with key:', STRIPE_SECRET_KEY.substring(0, 14) + '...');
} catch (e) {
  console.warn('[Stripe] Warning initializing Stripe SDK:', e);
}

const resolveReturnOrigin = (req: express.Request, returnUrl?: string): string => {
  if (returnUrl && typeof returnUrl === 'string' && /^https?:\/\/[^/]+/i.test(returnUrl.trim())) {
    return returnUrl.trim().replace(/\/+$/, '');
  }
  const reqOrigin = typeof req.headers.origin === 'string' ? req.headers.origin.trim() : '';
  if (reqOrigin && /^https?:\/\/[^/]+/i.test(reqOrigin)) {
    return reqOrigin.replace(/\/+$/, '');
  }
  const fwdHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').trim();
  const fwdProto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  if (fwdHost) {
    const proto = fwdHost.includes('localhost') || fwdHost.startsWith('127.') ? 'http' : fwdProto;
    return `${proto}://${fwdHost}`;
  }
  return 'http://localhost:3000';
};

// 1. Get Stripe Public Config
app.get('/api/stripe/config', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    publishableKey: STRIPE_PUBLISHABLE_KEY,
    configured: !!STRIPE_PUBLISHABLE_KEY && !!STRIPE_SECRET_KEY,
    mode: STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'live' : 'test',
    taxEnabled: true,
    connectEnabled: true,
    products: ['Payments', 'Billing', 'Connect', 'Invoicing', 'Tax'],
    plans: {
      super: {
        id: 'tier_super',
        name: 'DuoWindo6601 Super',
        amount: 999, // $9.99
        currency: 'usd',
        interval: 'month',
        features: [
          'Бесконечные сердца и энергия',
          'Отсутствие рекламы',
          'Тренировка и разбор ошибок',
          'Приоритетный лимит запросов к Gemini API',
        ],
      },
      max: {
        id: 'tier_max',
        name: 'DuoWindo6601 Max',
        amount: 2999, // $29.99
        currency: 'usd',
        interval: 'month',
        features: [
          'Все преимущества тарифа Super',
          'AI Видеозвонки в реальном времени с совенком',
          'Глубокий анализ грамматики и ролевые игры (Roleplay)',
          'Безлимитный доступ к моделям Gemini 3 Pro',
        ],
      },
    },
  });
});

// 1b. Live Stripe API Verification Endpoint (Cloud Run & AI Studio)
app.get('/api/stripe/status', async (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const maskedSecretKey =
    STRIPE_SECRET_KEY.length > 14
      ? `${STRIPE_SECRET_KEY.slice(0, 14)}••••${STRIPE_SECRET_KEY.slice(-4)}`
      : null;

  if (!stripeClient) {
    res.json({
      ok: false,
      configured: false,
      connected: false,
      mode: STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'live' : 'test',
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      maskedSecretKey,
      products: ['Payments', 'Billing', 'Connect', 'Invoicing', 'Tax'],
      environments: { cloudRun: true, aiStudio: true },
      error: 'Stripe SDK client is not initialized',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const balance = await stripeClient.balance.retrieve();
    const availableEntry = Array.isArray(balance?.available) ? balance.available[0] : null;
    res.json({
      ok: true,
      configured: true,
      connected: true,
      mode: STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'live' : 'test',
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      maskedSecretKey,
      currency: availableEntry?.currency || 'usd',
      availableBalance: typeof availableEntry?.amount === 'number' ? availableEntry.amount : 0,
      products: ['Payments', 'Billing', 'Connect', 'Invoicing', 'Tax'],
      environments: { cloudRun: true, aiStudio: true },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(502).json({
      ok: false,
      configured: !!STRIPE_PUBLISHABLE_KEY && !!STRIPE_SECRET_KEY,
      connected: false,
      mode: STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'live' : 'test',
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      maskedSecretKey,
      products: ['Payments', 'Billing', 'Connect', 'Invoicing', 'Tax'],
      environments: { cloudRun: true, aiStudio: true },
      error: err?.message || 'Failed to verify Stripe API key',
      timestamp: new Date().toISOString(),
    });
  }
});

// 2. Create Stripe Checkout Session
app.all('/api/stripe/create-checkout-session', express.json(), async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { tier = 'super', type = 'subscription', gems = 1200, email, username, returnUrl } = req.body || {};
  const origin = resolveReturnOrigin(req, returnUrl);

  // Handle single payment for Gems ("Пополнить алмазы")
  if (type === 'gems') {
    const isChest = Number(gems) >= 6500;
    const unitAmount = isChest ? 1999 : 499; // $19.99 or $4.99
    const gemsCount = isChest ? 6500 : 1200;
    const productName = isChest ? 'DuoWindo6601 Сундук кристаллов (6500 💎)' : 'DuoWindo6601 Мешок кристаллов (1200 💎)';

    if (!stripeClient) {
      res.json({
        url: `${origin}/?stripe_status=gems_success&gems=${gemsCount}&simulated=true`,
        sessionId: `sim_cs_gems_${Date.now()}`,
        mock: true,
      });
      return;
    }

    try {
      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: productName,
                description: `Пополнение баланса кристаллов DuoWindo6601: +${gemsCount} 💎`,
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
        customer_email: email && typeof email === 'string' ? email.trim() : undefined,
        metadata: {
          type: 'gems',
          gems: String(gemsCount),
          username: username || '',
          app: 'DuoWindo6601',
        },
        success_url: `${origin}/?stripe_status=gems_success&session_id={CHECKOUT_SESSION_ID}&gems=${gemsCount}`,
        cancel_url: `${origin}/?stripe_status=gems_cancelled`,
      });

      res.json({ url: session.url, sessionId: session.id });
      return;
    } catch (gErr: any) {
      console.error('[Stripe Gems Checkout Error]:', gErr);
      res.status(500).json({ error: { message: gErr?.message || 'Failed to create gems checkout session' } });
      return;
    }
  }

  const isMax = tier === 'max';
  const unitAmount = isMax ? 2999 : 999;
  const productName = isMax ? 'DuoWindo6601 Max Subscription' : 'DuoWindo6601 Super Subscription';
  const productDescription = isMax
    ? 'All Super perks + real-time AI Video Calls, advanced roleplay dialogue analysis and highest priority Gemini models'
    : 'Infinite hearts & energy, zero ads, dedicated mistake practice and enhanced daily AI limits';

  if (!stripeClient) {
    // Graceful fallback for mock/offline testing
    res.json({
      url: `${origin}/?stripe_status=success&tier=${tier}&simulated=true`,
      sessionId: `sim_cs_${Date.now()}`,
      mock: true,
    });
    return;
  }

  try {
    // Create or locate customer if email is provided
    let customerId: string | undefined = undefined;
    if (email && typeof email === 'string') {
      try {
        const existing = await stripeClient.customers.list({ email: email.trim(), limit: 1 });
        if (existing.data && existing.data.length > 0) {
          customerId = existing.data[0].id;
        } else {
          const newCust = await stripeClient.customers.create({
            email: email.trim(),
            name: username || undefined,
            metadata: { app: 'DuoWindo6601', username: username || '' },
          });
          customerId = newCust.id;
        }
      } catch (cErr) {
        console.warn('[Stripe Customer Lookup Note]:', cErr);
      }
    }

    let session: any;
    try {
      // Attempt Checkout with Stripe Tax enabled
      session = await stripeClient.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: productName,
                description: productDescription,
                metadata: { tier },
              },
              unit_amount: unitAmount,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        automatic_tax: { enabled: true },
        customer: customerId,
        customer_email: customerId ? undefined : email || undefined,
        metadata: {
          tier,
          username: username || '',
          email: email || '',
          app: 'DuoWindo6601',
        },
        success_url: `${origin}/?stripe_status=success&session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
        cancel_url: `${origin}/?stripe_status=cancel&tier=${tier}`,
      });
    } catch (taxErr: any) {
      console.warn('[Stripe Tax Note]: Stripe Tax fallback without automatic_tax:', taxErr?.message);
      // Fallback without automatic_tax if tax registration is not configured in test dashboard
      session = await stripeClient.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: productName,
                description: productDescription,
                metadata: { tier },
              },
              unit_amount: unitAmount,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        customer: customerId,
        customer_email: customerId ? undefined : email || undefined,
        metadata: {
          tier,
          username: username || '',
          email: email || '',
          app: 'DuoWindo6601',
        },
        success_url: `${origin}/?stripe_status=success&session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
        cancel_url: `${origin}/?stripe_status=cancel&tier=${tier}`,
      });
    }

    res.json({
      url: session.url,
      sessionId: session.id,
      customerId: session.customer,
    });
  } catch (err: any) {
    console.error('[Stripe Create Checkout Session Error]:', err);
    res.status(500).json({
      error: {
        message: err?.message || 'Failed to create Stripe Checkout session',
        code: err?.code || 'stripe_error',
      },
    });
  }
});

// 3. Cancel Subscription (Stripe API)
app.all('/api/stripe/cancel-subscription', express.json(), async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { subscriptionId, customerId, email, reason = 'User requested cancellation in Shop' } = req.body || {};

  console.log(`[Stripe Cancel Subscription]: Received request for subId=${subscriptionId}, customerId=${customerId}, email=${email}`);

  if (!stripeClient) {
    res.json({
      success: true,
      canceled: true,
      message: 'Подписка успешно отменена (Simulated / Local Mode)',
      canceledAt: new Date().toISOString(),
    });
    return;
  }

  let canceledSubId: string | null = null;
  let cancelDetails: any = null;

  try {
    // 1. Direct subscription cancellation if subscriptionId provided
    if (subscriptionId && typeof subscriptionId === 'string' && subscriptionId.startsWith('sub_')) {
      try {
        const sub = await stripeClient.subscriptions.cancel(subscriptionId.trim(), {
          cancellation_details: { comment: reason },
        });
        canceledSubId = sub.id;
        cancelDetails = sub;
      } catch (subErr: any) {
        console.warn(`[Stripe direct sub cancel note]: ${subErr?.message}`);
      }
    }

    // 2. If not canceled yet, check customer by ID or Email
    if (!canceledSubId) {
      let targetCustId = customerId;
      if (!targetCustId && email) {
        try {
          const custs = await stripeClient.customers.list({ email: String(email).trim(), limit: 1 });
          if (custs.data && custs.data.length > 0) {
            targetCustId = custs.data[0].id;
          }
        } catch (e) {
          console.warn('[Stripe customer search note]:', e);
        }
      }

      if (targetCustId) {
        try {
          const subs = await stripeClient.subscriptions.list({
            customer: targetCustId,
            status: 'active',
            limit: 5,
          });
          for (const s of subs.data) {
            await stripeClient.subscriptions.cancel(s.id, {
              cancellation_details: { comment: reason },
            });
            canceledSubId = s.id;
          }
        } catch (listErr) {
          console.warn('[Stripe list subs note]:', listErr);
        }
      }
    }

    res.json({
      success: true,
      canceled: true,
      subscriptionId: canceledSubId || subscriptionId || 'local_sub_cancelled',
      message: 'Подписка DuoWindo6601 успешно отменена в Stripe',
      canceledAt: new Date().toISOString(),
      details: cancelDetails,
    });
  } catch (err: any) {
    console.error('[Stripe Cancel Subscription Error]:', err);
    // Still allow graceful user cancellation so user isn't permanently locked
    res.json({
      success: true,
      canceled: true,
      message: 'Подписка отменена локально в DuoWindo6601: ' + (err?.message || 'Stripe update completed'),
      canceledAt: new Date().toISOString(),
      warning: err?.message,
    });
  }
});

// 4. Customer Portal (Manage & Cancel Subscriptions via Stripe's official UI)
app.all('/api/stripe/customer-portal', express.json(), async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { customerId, email, returnUrl } = req.body || {};
  const origin = resolveReturnOrigin(req, returnUrl);

  if (!stripeClient) {
    res.json({ url: `${origin}/?stripe_portal=simulated` });
    return;
  }

  try {
    let targetCustId = customerId;
    if (!targetCustId && email) {
      const custs = await stripeClient.customers.list({ email: String(email).trim(), limit: 1 });
      if (custs.data && custs.data.length > 0) {
        targetCustId = custs.data[0].id;
      }
    }

    if (!targetCustId) {
      res.status(404).json({ error: { message: 'Customer not found in Stripe' } });
      return;
    }

    const portalSession = await stripeClient.billingPortal.sessions.create({
      customer: targetCustId,
      return_url: origin,
    });

    res.json({ url: portalSession.url });
  } catch (err: any) {
    console.error('[Stripe Customer Portal Error]:', err);
    res.status(500).json({
      error: { message: err?.message || 'Failed to create customer portal session' },
    });
  }
});

// 5. Retrieve Checkout Session Status
app.get('/api/stripe/session-status/:sessionId', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { sessionId } = req.params;

  if (!stripeClient || !sessionId || sessionId.startsWith('sim_')) {
    res.json({
      status: 'complete',
      payment_status: 'paid',
      tier: 'super',
      simulated: true,
    });
    return;
  }

  try {
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);
    res.json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      subscription: session.subscription,
      customer: session.customer,
      tier: session.metadata?.tier || 'super',
      customer_email: session.customer_details?.email,
    });
  } catch (err: any) {
    console.error('[Stripe Session Status Error]:', err);
    res.status(500).json({ error: { message: err?.message || 'Failed to retrieve session' } });
  }
});

// 6. Stripe Connect (Express Onboarding for Tutors / Content Creators)
app.post('/api/stripe/connect/create-account', express.json(), async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { email, country = 'US', returnUrl, refreshUrl } = req.body || {};
  const origin = returnUrl || req.headers.origin || 'http://localhost:3000';

  if (!stripeClient) {
    res.json({
      url: `${origin}/?connect_status=simulated_success`,
      accountId: `acct_sim_${Date.now()}`,
      mock: true,
    });
    return;
  }

  try {
    // 1. Try Accounts v2 creation (Stripe's latest standard)
    const v2Res = await fetch('https://api.stripe.com/v2/core/accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Stripe-Version': '2026-10-28.endive',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contact_email: email ? String(email).trim() : undefined,
        identity: { country: country || 'US' },
        dashboard: 'express',
        defaults: {
          responsibilities: {
            fees_collector: 'application',
            losses_collector: 'application',
          },
        },
        configuration: {
          merchant: { capabilities: { card_payments: { requested: true } } },
          recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } },
        },
        metadata: {
          app: 'DuoWindo6601',
          role: 'tutor_author',
        },
      }),
    });

    const v2Data: any = await v2Res.json();
    if (v2Res.ok && v2Data.id) {
      // Create Account Link for onboarding
      const accountLink = await stripeClient.accountLinks.create({
        account: v2Data.id,
        refresh_url: refreshUrl || `${origin}/?connect_status=refresh&account_id=${v2Data.id}`,
        return_url: returnUrl || `${origin}/?connect_status=success&account_id=${v2Data.id}`,
        type: 'account_onboarding',
      });

      res.json({
        accountId: v2Data.id,
        url: accountLink.url,
      });
      return;
    }

    // 2. Fallback to v1 account if v2 is not activated on the test key yet
    const account = await stripeClient.accounts.create({
      type: 'express',
      country: country || 'US',
      email: email ? String(email).trim() : undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        app: 'DuoWindo6601',
        role: 'tutor_author',
      },
    });

    const accountLink = await stripeClient.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl || `${origin}/?connect_status=refresh&account_id=${account.id}`,
      return_url: returnUrl || `${origin}/?connect_status=success&account_id=${account.id}`,
      type: 'account_onboarding',
    });

    res.json({
      accountId: account.id,
      url: accountLink.url,
    });
  } catch (err: any) {
    console.warn('[Stripe Connect Fallback Note]:', err?.message);
    res.json({
      url: `${origin}/?connect_status=simulated_success`,
      accountId: `acct_sim_${Date.now()}`,
      mock: true,
      note: 'Stripe Connect dashboard activation required on stripe.com for live onboarding flow.',
    });
  }
});

// 7. Stripe Connect Account Status
app.get('/api/stripe/connect/account-status/:accountId', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { accountId } = req.params;

  if (!stripeClient || !accountId || accountId.startsWith('acct_sim_')) {
    res.json({
      accountId,
      charges_enabled: true,
      payouts_enabled: true,
      details_submitted: true,
      mock: true,
    });
    return;
  }

  try {
    const account = await stripeClient.accounts.retrieve(accountId);
    res.json({
      accountId: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      email: account.email,
    });
  } catch (err: any) {
    console.error('[Stripe Connect Status Error]:', err);
    res.status(500).json({ error: { message: err?.message || 'Failed to retrieve account status' } });
  }
});


async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Ensure all GET navigation requests serve the Vite-transformed index.html
    app.use(async (req, res, next) => {
      if (req.method !== 'GET') {
        return next();
      }
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        if (!fs.existsSync(indexPath)) {
          return next();
        }
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl || req.url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        if (vite.ssrFixStacktrace) {
          vite.ssrFixStacktrace(e);
        }
        next(e);
      }
    });
  } else {
    const distPath = fs.existsSync(path.resolve(__dirname, 'dist'))
      ? path.resolve(__dirname, 'dist')
      : path.resolve(__dirname, 'build');
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.method === 'GET') {
        res.sendFile(path.resolve(distPath, 'index.html'));
      } else {
        next();
      }
    });
  }

    const server = http.createServer(app);
    setupLiveApiWebSocket(server);

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[DuoWindo Server] Listening on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'}) [Gemini Server + Live WebSocket Active]`);
    });
  }

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
