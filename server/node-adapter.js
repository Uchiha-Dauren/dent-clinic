import { handleApi, json } from './api.js';
export function apiMiddleware(env) {
  return async (req, res, next) => {
    if (!req.url.split('?')[0].startsWith('/api/')) return next();
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 8192) {
          await send(json({ ok: false, error: 'body_too_large' }, 413), res);
          return;
        }
        chunks.push(chunk);
      }
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers))
        if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      const origin =
        (req.socket.encrypted ? 'https://' : 'http://') + (req.headers.host || 'localhost');
      const request = new Request(new URL(req.url, origin), {
        method: req.method,
        headers,
        ...(!['GET', 'HEAD'].includes(req.method) ? { body: Buffer.concat(chunks) } : {}),
      });
      await send(
        await handleApi(request, env, { clientIp: req.socket.remoteAddress || 'local' }),
        res,
      );
    } catch {
      if (!res.headersSent) await send(json({ ok: false, error: 'bad_request' }, 400), res);
      else res.end();
    }
  };
}
async function send(response, res) {
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}
