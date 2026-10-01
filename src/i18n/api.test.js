import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openLocalDatabase } from '../../Downloads/nova-dent/server/local-db.js';
import { handleApi } from '../../Downloads/nova-dent/server/api.js';
import worker from '../../Downloads/nova-dent/server/worker.js';
const now = new Date('2026-09-28T10:00:00Z');
const token = 'a'.repeat(64);
const valid = {
  name: 'Әлия',
  phone: '+77010000000',
  date: '2026-09-29',
  time: '10:00',
  service: 'hygiene',
  doctor: null,
  comment: '',
  consent: true,
  lang: 'kk',
  website: '',
};
let folder, filename, env;
function call(
  path = '/api/bookings',
  method = 'POST',
  value = valid,
  headers = {},
  clientIp = '127.0.0.1',
) {
  return handleApi(
    new Request('https://clinic.test' + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
        ...headers,
      },
      ...(!['GET', 'HEAD'].includes(method)
        ? { body: typeof value === 'string' ? value : JSON.stringify(value) }
        : {}),
    }),
    env,
    { now, clientIp },
  );
}
const auth = { Authorization: 'Bearer ' + token };
describe('persistent booking API', () => {
  beforeEach(() => {
    folder = mkdtempSync(join(tmpdir(), 'nova-test-'));
    filename = join(folder, 'db.sqlite');
    env = { DB: openLocalDatabase(filename), ADMIN_API_TOKEN: token };
  });
  afterEach(() => {
    env.DB.close();
    rmSync(folder, { recursive: true, force: true });
    vi.restoreAllMocks();
  });
  it('saves normalized data and survives closing/reopening the database', async () => {
    const response = await call('/api/bookings', 'POST', {
      ...valid,
      name: '  әлия  ',
      phone: '87010000000',
      createdAt: 'fake',
    });
    expect(response.status).toBe(201);
    const saved = await response.json();
    env.DB.close();
    env.DB = openLocalDatabase(filename);
    const rows = await (await call('/api/bookings', 'GET', null, auth)).json();
    expect(rows.bookings).toHaveLength(1);
    expect(rows.bookings[0]).toMatchObject({
      id: saved.id,
      name: 'Әлия',
      phone: '+77010000000',
      status: 'pending',
      created_at: now.toISOString(),
    });
    expect(rows.bookings[0]).not.toHaveProperty('idempotency_key');
  });
  it('replays concurrent retries exactly once and rejects key reuse with changed content', async () => {
    const headers = { 'Idempotency-Key': crypto.randomUUID() };
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => call('/api/bookings', 'POST', valid, headers)),
    );
    const bodies = await Promise.all(responses.map((r) => r.json()));
    expect(new Set(bodies.map((b) => b.id)).size).toBe(1);
    expect(env.DB.prepare('SELECT count(*) AS n FROM booking_requests').first().n).toBe(1);
    expect(
      (await call('/api/bookings', 'POST', { ...valid, comment: 'changed' }, headers)).status,
    ).toBe(409);
  });
  it.each([
    { consent: 'true' },
    { name: {} },
    { phone: 77010000000 },
    { date: '2026-02-30' },
    { date: '2026-09-27' },
    { time: '03:00' },
    { service: 'unknown' },
    { doctor: 'unknown' },
    { comment: 'x'.repeat(301) },
    { website: 'spam' },
    { lang: 'en' },
  ])('rejects invalid input without inserting: %j', async (patch) => {
    expect((await call('/api/bookings', 'POST', { ...valid, ...patch })).status).toBe(422);
    expect(env.DB.prepare('SELECT count(*) AS n FROM booking_requests').first().n).toBe(0);
  });
  it('rejects invalid JSON, oversized bodies, cross-origin submissions, missing key and wrong media type', async () => {
    expect((await call('/api/bookings', 'POST', '{')).status).toBe(400);
    expect(
      (await call('/api/bookings', 'POST', { ...valid, comment: 'x'.repeat(9000) })).status,
    ).toBe(413);
    expect(
      (await call('/api/bookings', 'POST', valid, { Origin: 'https://other.test' })).status,
    ).toBe(403);
    expect((await call('/api/bookings', 'POST', valid, { 'Idempotency-Key': '' })).status).toBe(
      400,
    );
    expect(
      (await call('/api/bookings', 'POST', valid, { 'Content-Type': 'text/plain' })).status,
    ).toBe(415);
  });
  it('applies durable rate limits and resets expired windows', async () => {
    for (let i = 0; i < 10; i++) expect((await call()).status).toBe(201);
    env.DB.close();
    env.DB = openLocalDatabase(filename);
    const blocked = await call();
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBe('600');
    expect((await call('/api/bookings', 'POST', valid, {}, 'different-ip')).status).toBe(201);
    const later = new Date(now.valueOf() + 601000);
    const response = await handleApi(
      new Request('https://clinic.test/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify(valid),
      }),
      env,
      { now: later, clientIp: '127.0.0.1' },
    );
    expect(response.status).toBe(201);
  });
  it('protects listing and status changes, including unconfigured admin', async () => {
    const { id } = await (await call()).json();
    expect((await call('/api/bookings', 'GET', null)).status).toBe(401);
    expect((await call('/api/bookings/' + id, 'PATCH', { status: 'confirmed' })).status).toBe(401);
    expect(
      (await call('/api/bookings', 'GET', null, { Authorization: 'Bearer wrong' })).status,
    ).toBe(401);
    const updated = await call('/api/bookings/' + id, 'PATCH', { status: 'confirmed' }, auth);
    expect(await updated.json()).toMatchObject({ ok: true, status: 'confirmed' });
    const filtered = await (await call('/api/bookings?status=pending', 'GET', null, auth)).json();
    expect(filtered.bookings).toEqual([]);
    expect((await call('/api/bookings/' + id, 'PATCH', { status: 'invalid' }, auth)).status).toBe(
      422,
    );
    expect(
      (await call('/api/bookings/missing', 'PATCH', { status: 'confirmed' }, auth)).status,
    ).toBe(404);
    expect((await call('/api/bookings?limit=500', 'GET', null, auth)).status).toBe(422);
    delete env.ADMIN_API_TOKEN;
    expect((await call('/api/bookings', 'GET', null, auth)).status).toBe(503);
  });
  it('binds SQL parameters without executing user content', async () => {
    const comment = "'); DROP TABLE booking_requests;--";
    expect((await call('/api/bookings', 'POST', { ...valid, comment })).status).toBe(201);
    expect(env.DB.prepare('SELECT comment FROM booking_requests').first().comment).toBe(comment);
  });
  it('returns a recoverable unavailable response without leaking database details', async () => {
    const realDb = env.DB;
    env.DB = undefined;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await call();
    env.DB = realDb;
    expect(response.status).toBe(503);
    const result = await response.json();
    expect(result).toMatchObject({ ok: false, error: 'service_unavailable' });
    expect(JSON.stringify(result)).not.toContain(valid.phone);
  });
  it('reports health and slots as preferences requiring confirmation', async () => {
    expect((await call('/api/health', 'GET', null)).status).toBe(200);
    const slots = await (await call('/api/slots?date=2026-09-29', 'GET', null)).json();
    expect(slots).toMatchObject({ ok: true, timezone: 'Asia/Almaty', requiresConfirmation: true });
    expect(slots.slots).toContain('10:00');
    expect((await call('/api/slots?date=2026-02-30', 'GET', null)).status).toBe(422);
  });
  it('routes Worker API and serves the SPA fallback only for page routes', async () => {
    const ASSETS = {
      fetch: vi.fn(async (request) =>
        new URL(request.url).pathname === '/index.html'
          ? new Response('<html>NovaDent</html>')
          : new Response('missing', { status: 404 }),
      ),
    };
    expect(
      (await worker.fetch(new Request('https://clinic.test/api/health'), { ...env, ASSETS }))
        .status,
    ).toBe(200);
    const page = await worker.fetch(new Request('https://clinic.test/booking'), { ...env, ASSETS });
    expect(await page.text()).toContain('NovaDent');
    expect(
      (await worker.fetch(new Request('https://clinic.test/missing.js'), { ...env, ASSETS }))
        .status,
    ).toBe(404);
  });
});
