import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const geminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || env.GEMINI_API_KEY || env.API_KEY || '';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        strictPort: true,
        hmr: false,
      },
      plugins: [
        tailwindcss(),
        react({ fastRefresh: false }),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: [
            'favicon.png',
            'apple-touch-icon.png',
            'icon.svg',
            '100042597.svg',
            '1000042597.svg',
            'pwa-192x192.png',
            'pwa-512x512.png',
            'pwa-maskable-512x512.png'
          ],
          manifest: {
            id: '/',
            name: 'DuoWindo6601',
            short_name: 'DuoWindo',
            description: 'Интерактивная платформа изучения языков и логики DuoWindo6601 с маскотом, аудио, речью, шахматами и AI-звонками.',
            theme_color: '#131F24',
            background_color: '#131F24',
            display: 'standalone',
            orientation: 'portrait-primary',
            categories: ['education', 'games', 'productivity'],
            start_url: '/',
            scope: '/',
            icons: [
              {
                src: '/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/pwa-maskable-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              },
              {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'any'
              },
              {
                src: '/100042597.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'any'
              }
            ]
          },
          workbox: {
            maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'gstatic-fonts-cache',
                  expiration: {
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
            ],
          },
          devOptions: {
            enabled: true,
            type: 'module',
          },
        }),
        {
          name: 'fish-audio-dev-proxy',
          configureServer(server: any) {
            server.middlewares.use('/api/tts/fish', async (req: any, res: any) => {
              if (req.method === 'OPTIONS') {
                res.statusCode = 204;
                res.end();
                return;
              }
              let chunks: any[] = [];
              req.on('data', (chunk: any) => chunks.push(chunk));
              req.on('end', async () => {
                try {
                  const bodyBuffer = chunks.length ? Buffer.concat(chunks) : undefined;
                  let parsed: any = {};
                  if (bodyBuffer) {
                    try { parsed = JSON.parse(bodyBuffer.toString('utf8')); } catch (_) {}
                  }
                  const text = parsed.text || '';
                  if (!text) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: { message: 'Text is required' } }));
                    return;
                  }

                  const fishApiKey = process.env.FISH_AUDIO_API_KEY || 'sk-fish-4AQDQGlpw6stJiyg5JTTJabhtkgPpmwBTu_Gveo7DMI';
                  const fishRes = await fetch('https://api.fish.audio/v1/tts', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${fishApiKey}`,
                      'Content-Type': 'application/json',
                      'model': 's2.1-pro-free'
                    },
                    body: JSON.stringify({
                      text,
                      format: parsed.format || 'mp3'
                    })
                  });

                  if (!fishRes.ok) {
                    const errText = await fishRes.text();
                    res.statusCode = fishRes.status;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: { message: errText } }));
                    return;
                  }

                  res.statusCode = 200;
                  res.setHeader('Content-Type', fishRes.headers.get('content-type') || 'audio/mpeg');
                  const arrayBuffer = await fishRes.arrayBuffer();
                  res.end(Buffer.from(arrayBuffer));
                } catch (err: any) {
                  res.statusCode = 502;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: { message: err?.message || 'Fish Audio error' } }));
                }
              });
            });
          }
        }
      ],
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        target: ['es2020', 'chrome80', 'firefox78', 'safari13.1', 'edge80'],
      },
      optimizeDeps: {
        entries: ['index.html'],
      },
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
