import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

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
    const googleRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: bodyBuffer,
    });

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

// MCP (Model Context Protocol) & Jules debugging status endpoint
app.get('/api/mcp/status', (_req, res) => {
  const renderMcpKey = process.env.RENDER_MCP_API_KEY || 'rnd_yJ0QbFmEPVzGFlD6OwWG4o8Rg6t8';
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
  } else {
    const distPath = path.resolve(__dirname, 'dist');
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
