import { hash, readJson, json } from './http.js';
import { database, consumeLimit } from './database.js';
const cookieName = 'nova_admin_session';
const lifetime = 8 * 60 * 60;
const configuredKey = (env) =>
  typeof env.ADMIN_API_TOKEN === 'string' && env.ADMIN_API_TOKEN.length >= 32;
async function equal(a, b) {
  const [left, right] = await Promise.all([hash(a), hash(b)]);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}
async function signature(ticket, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ticket));
  return Array.from(new Uint8Array(bytes), (n) => n.toString(16).padStart(2, '0')).join('');
}
function cookie(value, request, seconds) {
  return `${cookieName}=${value}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${seconds}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}
export async function authenticate(request, env, context = {}) {
  // Only Worker dispatch can supply trusted identity; local HTTP headers are never trusted.
  if (env.ADMIN_AUTH_MODE === 'sites' && context.platformIdentity?.id) {
    const identity = context.platformIdentity;
    const allowed = (env.ADMIN_ALLOWED_EMAILS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (allowed.includes(identity.email?.toLowerCase()))
      return { mode: 'sites', name: identity.email, id: identity.id };
  }
  if (!configuredKey(env)) return null;
  const supplied = request.headers.get('authorization') || '';
  if (
    supplied.length <= 512 &&
    supplied.startsWith('Bearer ') &&
    (await equal(supplied, 'Bearer ' + env.ADMIN_API_TOKEN))
  )
    return { mode: 'key', name: 'Admin', id: 'admin-key' };
  const cookies = request.headers.get('cookie') || '';
  const value = cookies
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(cookieName + '='))
    ?.slice(cookieName.length + 1);
  if (!value || value.length > 200) return null;
  const [expiry, nonce, mac, extra] = value.split('.');
  if (
    extra ||
    !/^\d+$/.test(expiry) ||
    !/^[a-f0-9-]{36}$/.test(nonce || '') ||
    !/^[a-f0-9]{64}$/.test(mac || '')
  )
    return null;
  const time = (context.now || new Date()).valueOf();
  if (Number(expiry) <= time || Number(expiry) > time + lifetime * 1000) return null;
  if (!(await equal(mac, await signature(`${expiry}.${nonce}`, env.ADMIN_API_TOKEN)))) return null;
  return { mode: 'key', name: 'Admin', id: 'admin-key' };
}
export function denied(env) {
  const ready = env.ADMIN_AUTH_MODE === 'sites' || configuredKey(env);
  return json(
    { ok: false, error: ready ? 'unauthorized' : 'admin_not_configured' },
    ready ? 401 : 503,
  );
}
export async function authRoute(request, env, context) {
  const path = new URL(request.url).pathname;
  if (path === '/api/admin/session' && request.method === 'GET') {
    const user = await authenticate(request, env, context);
    return json({
      ok: true,
      authenticated: !!user,
      user: user ? { name: user.name, mode: user.mode } : null,
      loginMethod:
        env.ADMIN_AUTH_MODE === 'sites' ? 'chatgpt' : configuredKey(env) ? 'key' : 'unconfigured',
    });
  }
  if (path === '/api/admin/login' && request.method === 'POST') {
    if (!configuredKey(env)) return denied(env);
    const input = await readJson(request);
    if (!input || typeof input.key !== 'string' || input.key.length > 256)
      return json({ ok: false, error: 'invalid_login' }, 400);
    const fingerprint = 'login:' + (await hash(context.clientIp || 'unknown'));
    const limit = await consumeLimit(database(env), fingerprint, context.now.valueOf(), 10);
    if (!limit.allowed)
      return json({ ok: false, error: 'rate_limited', retryAfter: limit.retryAfter }, 429, {
        'Retry-After': String(limit.retryAfter),
      });
    if (!(await equal(input.key, env.ADMIN_API_TOKEN)))
      return json({ ok: false, error: 'unauthorized' }, 401);
    const ticket = `${context.now.valueOf() + lifetime * 1000}.${crypto.randomUUID()}`;
    return json({ ok: true }, 200, {
      'Set-Cookie': cookie(
        `${ticket}.${await signature(ticket, env.ADMIN_API_TOKEN)}`,
        request,
        lifetime,
      ),
    });
  }
  if (path === '/api/admin/logout' && request.method === 'POST')
    return json({ ok: true }, 200, { 'Set-Cookie': cookie('', request, 0) });
  return json({ ok: false, error: 'not_found' }, 404);
}
