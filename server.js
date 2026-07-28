import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Since the project is configured with "type": "module", we use ESM imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

const server = http.createServer((req, res) => {
  // Strip query parameters and decode URL-encoded paths
  const parsedUrl = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(parsedUrl.pathname);
  
  // Translate URL to file path in the 'dist' directory
  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);

  // Prevent directory traversal attacks
  if (!filePath.startsWith(DIST_DIR)) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Forbidden');
    return;
  }

  // Check if file exists and is not a directory
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // SPA fallback: If file is not found (e.g., custom routes), serve index.html
      const fallbackPath = path.join(DIST_DIR, 'index.html');
      fs.readFile(fallbackPath, (fallbackErr, data) => {
        if (fallbackErr) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DuoWindo Server — Сборка не найдена</title>
  <style>
    body {
      background-color: #0d0e12;
      color: #ffffff;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
    }
    .card {
      background: #151821;
      border: 2px solid #1cb0f6;
      border-radius: 24px;
      padding: 40px;
      max-width: 500px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    h1 {
      color: #58cc02;
      font-size: 28px;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    code {
      background: #202431;
      color: #ffc600;
      padding: 4px 8px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 15px;
    }
    p {
      color: #a0aec0;
      line-height: 1.6;
      font-size: 16px;
    }
    .btn {
      display: inline-block;
      margin-top: 20px;
      background: #1cb0f6;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: bold;
      border-bottom: 4px solid #1899d6;
      transition: all 0.2s;
    }
    .btn:active {
      transform: translateY(2px);
      border-bottom-width: 2px;
    }
    .command-box {
      background: #202431;
      border-left: 4px solid #58cc02;
      padding: 12px;
      text-align: left;
      font-family: monospace;
      font-size: 14px;
      border-radius: 4px;
      margin: 20px 0;
      color: #e2e8f0;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <div class="card">
    <span style="font-size:64px;">🦉</span>
    <h1>Сборка не найдена! / Build Not Found</h1>
    <p>Продакшн-сервер <strong>DuoWindo</strong> готов к работе, но статические ресурсы еще не скомпилированы.</p>
    <p>Чтобы запустить приложение, соберите проект на вашем сервере/устройстве, выполнив команду в терминале:</p>
    <div class="command-box">
      npm run build
    </div>
    <p>После успешной сборки обновите эту страницу. Для локальной разработки без компиляции используйте команду:</p>
    <div class="command-box">
      npm run dev
    </div>
    <a href="/" class="btn">Обновить страницу</a>
  </div>
</body>
</html>`);
          return;
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(data);
      });
      return;
    }

    // Serve the requested static file
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Internal Server Error');
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.end(data);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[DuoWindo Server] Listening on http://0.0.0.0:${PORT}`);
  console.log(`[DuoWindo Server] Serving static production files from: ${DIST_DIR}`);
});
