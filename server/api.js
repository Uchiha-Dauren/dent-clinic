import { database, findRequest, consumeLimit, insertRequest } from './database.js';
import { validateBooking, tidyName } from '../src/lib/validation.js';
import { normalizePhone } from '../src/lib/phone.js';
import { isAvailableDate, generateSlots } from '../src/lib/slots.js';
import { siteConfig } from '../src/config/siteConfig.js';
import { json, hash, readJson as body } from './http.js';
import { authRoute } from './auth.js';
import { adminRoute } from './admin.js';
export { json } from './http.js';
function validate(input, now) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    return { errors: { form: 'invalid' } };
  const errors = {};
  for (const k of ['name', 'phone', 'date', 'time', 'comment'])
    if (typeof input[k] !== 'string') errors[k] = 'invalid';
  for (const k of ['service', 'doctor', 'website'])
    if (input[k] != null && typeof input[k] !== 'string') errors[k] = 'invalid';
  if (input.consent !== true) errors.consent = 'consent';
  if (!['ru', 'kk'].includes(input.lang)) errors.lang = 'invalid';
  if (Object.keys(errors).length) return { errors };
  const value = {
    name: tidyName(input.name),
    phone: normalizePhone(input.phone) || input.phone,
    date: input.date,
    time: input.time,
    comment: input.comment.trim(),
    service: input.service || null,
    doctor: input.doctor || null,
    consent: true,
    lang: input.lang,
    website: input.website || '',
  };
  return { value, errors: validateBooking(value, now) };
}
export async function handleApi(
  request,
  env,
  { now = new Date(), clientIp = 'unknown', platformIdentity = null } = {},
) {
  const url = new URL(request.url),
    path = url.pathname;
  const requestId = crypto.randomUUID();
  try {
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin)
      return json({ ok: false, error: 'origin_not_allowed' }, 403);
    const context = { now, clientIp, platformIdentity };
    if (path.startsWith('/api/admin/')) return await authRoute(request, env, context);
    if (path === '/api/health' && request.method === 'GET') {
      await database(env).prepare('SELECT 1 AS ready').first();
      return json({ ok: true, database: 'ready' });
    }
    if (path === '/api/slots' && request.method === 'GET') {
      const date = url.searchParams.get('date');
      if (!isAvailableDate(date, now)) return json({ ok: false, error: 'invalid_date' }, 422);
      return json({
        ok: true,
        date,
        timezone: siteConfig.hours.timezone,
        slots: generateSlots(date, now)
          .filter((s) => !s.disabled)
          .map((s) => s.time),
        requiresConfirmation: true,
      });
    }
    if (path === '/api/bookings' && request.method === 'POST') {
      const key = request.headers.get('idempotency-key');
      if (!key || !/^[A-Za-z0-9_-]{16,128}$/.test(key))
        return json({ ok: false, error: 'idempotency_key_required' }, 400);
      const { value, errors } = validate(await body(request), now);
      if (Object.keys(errors).length)
        return json({ ok: false, error: 'validation_failed', fields: errors }, 422);
      const db = database(env),
        payloadHash = await hash(JSON.stringify(value));
      const replay = (row) =>
        row.payload_hash === payloadHash
          ? json({
              ok: true,
              id: row.id,
              createdAt: row.created_at,
              status: row.status,
              replayed: true,
            })
          : json({ ok: false, error: 'idempotency_conflict' }, 409);
      const previous = await findRequest(db, key);
      if (previous) return replay(previous);
      const limitKey = 'ip:' + (await hash(now.toISOString().slice(0, 10) + ':' + clientIp));
      const limit = await consumeLimit(db, limitKey, now.valueOf(), 10);
      if (!limit.allowed)
        return json({ ok: false, error: 'rate_limited', retryAfter: limit.retryAfter }, 429, {
          'Retry-After': String(limit.retryAfter),
        });
      const record = {
        ...value,
        key,
        hash: payloadHash,
        id: crypto.randomUUID(),
        createdAt: now.toISOString(),
      };
      const inserted = await insertRequest(db, record);
      if (!inserted) return replay(await findRequest(db, key));
      return json({ ok: true, id: record.id, createdAt: record.createdAt, status: 'pending' }, 201);
    }
    if (path === '/api/bookings' || /^\/api\/bookings\/[^/]+$/.test(path))
      return await adminRoute(request, env, context);
    return json({ ok: false, error: 'not_found' }, 404);
  } catch (error) {
    if (error?.status) return json({ ok: false, error: error.code }, error.status);
    // Never log request bodies, tokens, phone numbers or SQL parameter values.
    console.error('[NovaDent API] storage/request failure', requestId, path);
    return json({ ok: false, error: 'service_unavailable', requestId }, 503);
  }
}
