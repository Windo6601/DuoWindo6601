import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());

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

  const serverKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  if (!headers['x-goog-api-key'] || headers['x-goog-api-key'] === 'undefined' || headers['x-goog-api-key'].trim() === '') {
    if (serverKey) {
      headers['x-goog-api-key'] = serverKey;
    }
  }

  const bodyBuffer =
    req.method !== 'GET' && req.method !== 'HEAD' && Buffer.isBuffer(req.body) && req.body.length > 0
      ? req.body
      : undefined;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
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

    if (googleRes.body) {
      Readable.fromWeb(googleRes.body as any).pipe(res);
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error('[Gemini Server Proxy Error]:', err);
    res.status(502).json({
      error: {
        code: 502,
        message: 'Failed to proxy request: ' + (err?.message || err),
      },
    });
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

  const fishApiKey = process.env.FISH_AUDIO_API_KEY || 'sk-fish-eeRI1K1-YeiTi0uS5E_FdXnZktU8SfQ42PYPIEUvTOY';

  try {
    const fishRes = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fishApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        format: format || 'mp3',
        model,
        normalize: true,
        latency: 'normal',
        top_p: 0.5,
        temperature: 0.1,
        repetition_penalty: 1.2,
        ...(reference_id ? { reference_id } : {})
      })
    });

    if (!fishRes.ok) {
      const errText = await fishRes.text();
      console.error('[Fish Audio Proxy Error]:', fishRes.status, errText);
      res.status(fishRes.status).json({ error: { message: errText || 'Fish Audio API error' } });
      return;
    }

    res.setHeader('Content-Type', fishRes.headers.get('content-type') || 'audio/mpeg');
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
  res.json({
    mcpEnabled: true,
    julesDebugging: true,
    mcpServer: 'render-mcp',
    renderApiKeyConfigured: !!renderMcpKey,
    maskedKey: renderMcpKey ? `${renderMcpKey.substring(0, 8)}••••${renderMcpKey.substring(renderMcpKey.length - 4)}` : null,
    timestamp: new Date().toISOString(),
  });
});


async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DuoWindo Server] Listening on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
