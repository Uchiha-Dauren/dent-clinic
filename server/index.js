import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { openLocalDatabase } from './local-db.js';
import { apiMiddleware } from './node-adapter.js';
try {
  process.loadEnvFile();
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const DB = openLocalDatabase();
const middleware = apiMiddleware({ DB, ADMIN_API_TOKEN: process.env.ADMIN_API_TOKEN });
const root = resolve('dist/client');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};
const server = createServer((req, res) =>
  middleware(req, res, async () => {
    try {
      if (!['GET', 'HEAD'].includes(req.method)) {
        res.writeHead(405);
        res.end();
        return;
      }
      const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
      let path = resolve(root, '.' + pathname);
      if (path !== root && !path.startsWith(root + sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      if (path === root) path = resolve(root, 'index.html');
      try {
        if (!(await stat(path)).isFile()) throw new Error();
      } catch {
        if (extname(pathname)) {
          res.writeHead(404);
          res.end();
          return;
        }
        path = resolve(root, 'index.html');
      }
      const content = await readFile(path);
      res.writeHead(200, {
        'Content-Type': types[extname(path)] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': pathname.startsWith('/assets/')
          ? 'public, max-age=31536000, immutable'
          : 'no-cache',
      });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch {
      res.writeHead(404);
      res.end('Not found. Run npm run build first.');
    }
  }),
);
server.requestTimeout = 30000;
server.headersTimeout = 15000;
server.listen(Number(process.env.PORT || 4173), process.env.HOST || '127.0.0.1', () =>
  console.log(`NovaDent frontend + API: http://localhost:${process.env.PORT || 4173}`),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(() => {
      DB.close();
      process.exit(0);
    }),
  );
