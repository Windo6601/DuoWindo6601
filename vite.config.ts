import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const geminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || env.GEMINI_API_KEY || env.API_KEY || '';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        tailwindcss(),
        react(),
        {
          name: 'gemini-proxy-middleware',
          configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
              if (req.url && req.url.startsWith('/api/gemini-proxy')) {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', '*');
                if (req.method === 'OPTIONS') {
                  res.statusCode = 204;
                  res.end();
                  return;
                }
                const parsedUrl = new URL(req.url, 'http://localhost:3000');
                const targetPath = parsedUrl.pathname.replace(/^\/api\/gemini-proxy/, '') + parsedUrl.search;
                const targetUrl = `https://generativelanguage.googleapis.com${targetPath}`;
                
                const chunks: any[] = [];
                req.on('data', chunk => chunks.push(chunk));
                req.on('end', async () => {
                  const bodyBuffer = chunks.length ? Buffer.concat(chunks) : undefined;
                  
                  const headers: Record<string, string> = {};
                  for (const [k, v] of Object.entries(req.headers)) {
                    if (v && typeof v === 'string' && !['host', 'connection', 'content-length'].includes(k.toLowerCase())) {
                      headers[k] = v;
                    }
                  }
                  
                  if (!headers['x-goog-api-key'] || headers['x-goog-api-key'] === 'undefined' || headers['x-goog-api-key'].trim() === '') {
                    if (geminiKey) {
                      headers['x-goog-api-key'] = geminiKey;
                    }
                  }
                  
                  try {
                    const googleRes = await fetch(targetUrl, {
                      method: req.method,
                      headers,
                      body: bodyBuffer
                    });
                    
                    res.statusCode = googleRes.status;
                    const contentType = googleRes.headers.get('content-type');
                    if (contentType) res.setHeader('content-type', contentType);
                    
                    const arrayBuffer = await googleRes.arrayBuffer();
                    res.end(Buffer.from(arrayBuffer));
                  } catch (err: any) {
                    console.error('[Gemini Proxy Error]:', err);
                    res.statusCode = 502;
                    res.setHeader('content-type', 'application/json');
                    res.end(JSON.stringify({
                      error: {
                        code: 502,
                        message: 'Failed to proxy request to Google Gemini API: ' + (err?.message || err)
                      }
                    }));
                  }
                });
                return;
              }
              next();
            });
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
