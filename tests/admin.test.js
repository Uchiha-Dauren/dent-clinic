import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openLocalDatabase } from '../../../Downloads/nova-dent/server/local-db.js';
import { handleApi } from '../../../Downloads/nova-dent/server/api.js';
const now = new Date('2026-09-28T10:00Z'),
  token = 'local-admin-integration-key-'.repeat(3);
let env;
const auth = { Authorization: 'Bearer ' + token };
const booking = {
  name: 'Әлия',
  phone: '+77010000000',
  date: '2026-09-29',
  time: 'any',
  comment: '=HYPERLINK("https://example.invalid")',
  consent: true,
  lang: 'kk',
};
function call(path, method = 'GET', data, headers = {}, context = {}) {
  return handleApi(
    new Request('https://clinic.test' + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
        ...headers,
      },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    }),
    env,
    { now, clientIp: '127.0.0.1', ...context },
  );
}
async function insert(data = {}) {
  return (await call('/api/bookings', 'POST', { ...booking, ...data })).json();
}
describe('admin access and workflows', () => {
  beforeEach(() => {
    env = { DB: openLocalDatabase(':memory:'), ADMIN_API_TOKEN: token };
  });
  afterEach(() => env.DB.close());
  it('creates an HttpOnly session, restores it, rejects forgery/expiry and clears logout cookie', async () => {
    expect((await (await call('/api/admin/session')).json()).authenticated).toBe(false);
    expect((await call('/api/admin/login', 'POST', { key: 'wrong' })).status).toBe(401);
    const login = await call('/api/admin/login', 'POST', { key: token });
    expect(login.status).toBe(200);
    const header = login.headers.get('set-cookie');
    expect(header).toContain('HttpOnly');
    expect(header).toContain('SameSite=Strict');
    expect(header).toContain('Secure');
    const cookie = header.split(';')[0];
    expect(cookie).not.toContain(token);
    const session = await (
      await call('/api/admin/session', 'GET', undefined, { Cookie: cookie })
    ).json();
    expect(session.authenticated).toBe(true);
    expect((await call('/api/bookings', 'GET', undefined, { Cookie: cookie })).status).toBe(200);
    expect((await call('/api/bookings', 'GET', undefined, { Cookie: cookie + 'x' })).status).toBe(
      401,
    );
    expect(
      (
        await call(
          '/api/bookings',
          'GET',
          undefined,
          { Cookie: cookie },
          { now: new Date(now.valueOf() + 9 * 3600000) },
        )
      ).status,
    ).toBe(401);
    const logout = await call('/api/admin/logout', 'POST', undefined, { Cookie: cookie });
    expect(logout.headers.get('set-cookie')).toContain('Max-Age=0');
  });
  it('limits repeated login attempts and rejects cross-origin cookie mutations', async () => {
    for (let i = 0; i < 10; i++)
      expect((await call('/api/admin/login', 'POST', { key: 'wrong' })).status).toBe(401);
    expect((await call('/api/admin/login', 'POST', { key: token })).status).toBe(429);
    expect(
      (await call('/api/admin/logout', 'POST', undefined, { Origin: 'https://evil.test' })).status,
    ).toBe(403);
  });
  it('uses only trusted platform identity and an explicit owner allowlist', async () => {
    env.ADMIN_AUTH_MODE = 'sites';
    env.ADMIN_ALLOWED_EMAILS = 'owner@example.test';
    delete env.ADMIN_API_TOKEN;
    const headers = {
      'oai-authenticated-user-id': 'owner',
      'oai-authenticated-user-email': 'owner@example.test',
    };
    expect((await call('/api/bookings', 'GET', undefined, headers)).status).toBe(401);
    expect(
      (
        await call(
          '/api/bookings',
          'GET',
          undefined,
          {},
          { platformIdentity: { id: 'other', email: 'other@example.test' } },
        )
      ).status,
    ).toBe(401);
    const identity = { platformIdentity: { id: 'site-owner-id', email: 'owner@example.test' } };
    expect((await call('/api/bookings', 'GET', undefined, {}, identity)).status).toBe(200);
    const session = await (await call('/api/admin/session', 'GET', undefined, {}, identity)).json();
    expect(session).toMatchObject({ authenticated: true, user: { mode: 'sites' } });
    delete env.ADMIN_ALLOWED_EMAILS;
    expect((await call('/api/bookings', 'GET', undefined, {}, identity)).status).toBe(401);
  });
  it('filters by Kazakh name/phone/date/status and returns accurate paginated totals', async () => {
    await insert();
    const second = await insert({ name: 'Тимур', phone: '+77020000000' });
    await call('/api/bookings/' + second.id, 'PATCH', { status: 'contacted' }, auth);
    const page = await (await call('/api/bookings?limit=1', 'GET', undefined, auth)).json();
    expect(page.total).toBe(2);
    expect(page.bookings).toHaveLength(1);
    expect(page.counts).toMatchObject({ pending: 1, contacted: 1, confirmed: 0, cancelled: 0 });
    const search = await (
      await call('/api/bookings?q=' + encodeURIComponent('әлия'), 'GET', undefined, auth)
    ).json();
    expect(search.total).toBe(1);
    expect(search.bookings[0].name).toBe('Әлия');
    const phone = await (
      await call('/api/bookings?q=702&date=2026-09-29&status=contacted', 'GET', undefined, auth)
    ).json();
    expect(phone.total).toBe(1);
    expect((await call('/api/bookings?date=2026-02-30', 'GET', undefined, auth)).status).toBe(422);
    expect(
      (
        await (
          await call('/api/bookings?q=' + encodeURIComponent("' OR 1=1 --"), 'GET', undefined, auth)
        ).json()
      ).total,
    ).toBe(0);
  });
  it('persists notes/status and prevents stale updates from overwriting newer edits', async () => {
    const { id } = await insert();
    const saved = await call(
      '/api/bookings/' + id,
      'PATCH',
      { status: 'confirmed', adminNote: 'Уақыт келісілді', revision: 1 },
      auth,
    );
    expect(await saved.json()).toMatchObject({ ok: true, revision: 2, status: 'confirmed' });
    const conflict = await call(
      '/api/bookings/' + id,
      'PATCH',
      { status: 'cancelled', adminNote: 'old', revision: 1 },
      auth,
    );
    expect(conflict.status).toBe(409);
    const current = await (await call('/api/bookings/' + id, 'GET', undefined, auth)).json();
    expect(current.booking).toMatchObject({
      status: 'confirmed',
      admin_note: 'Уақыт келісілді',
      revision: 2,
    });
    expect(
      (
        await call(
          '/api/bookings/' + id,
          'PATCH',
          { status: 'confirmed', adminNote: 'x'.repeat(1001) },
          auth,
        )
      ).status,
    ).toBe(422);
    expect(
      (await call('/api/bookings/' + id, 'PATCH', { status: 'confirmed', revision: -1 }, auth))
        .status,
    ).toBe(422);
    expect((await call('/api/bookings/' + id, 'GET')).status).toBe(401);
  });
  it('exports only authorized filtered rows and neutralizes spreadsheet formulas', async () => {
    await insert();
    await insert({ name: 'Тимур', comment: '' });
    expect((await call('/api/bookings/export')).status).toBe(401);
    const response = await call(
      '/api/bookings/export?q=' + encodeURIComponent('Әлия'),
      'GET',
      undefined,
      auth,
    );
    expect(response.headers.get('content-type')).toContain('text/csv');
    expect(response.headers.get('cache-control')).toBe('no-store');
    const csv = await response.text();
    expect(csv).toContain('Әлия');
    expect(csv).not.toContain('Тимур');
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).not.toContain('payload_hash');
    expect(csv).not.toContain(token);
  });
  it('returns unconfigured state without ever enabling public admin access', async () => {
    delete env.ADMIN_API_TOKEN;
    expect((await (await call('/api/admin/session')).json()).loginMethod).toBe('unconfigured');
    expect((await call('/api/bookings')).status).toBe(503);
  });
});
it('adds admin fields to an existing database without losing bookings', () => {
  const directory = mkdtempSync(join(tmpdir(), 'nova-migrate-')),
    filename = join(directory, 'db.sqlite');
  let db;
  try {
    const old = new DatabaseSync(filename);
    old.exec(
      readFileSync(new URL('../drizzle/0000_pink_the_initiative.sql', import.meta.url), 'utf8'),
    );
    old.exec(
      "CREATE TABLE _local_migrations(name TEXT PRIMARY KEY); INSERT INTO _local_migrations VALUES('0000_pink_the_initiative.sql');",
    );
    old
      .prepare(
        "INSERT INTO booking_requests (id,idempotency_key,payload_hash,name,phone,preferred_date,preferred_time,consent,consent_version,lang,created_at,updated_at) VALUES ('old','old-key','hash','Алия','+77010000000','2026-09-29','any',1,'2026-09-28','ru','2026-09-28','2026-09-28')",
      )
      .run();
    old.close();
    db = openLocalDatabase(filename);
    expect(
      db.prepare("SELECT id,admin_note,revision FROM booking_requests WHERE id='old'").first(),
    ).toMatchObject({ id: 'old', admin_note: '', revision: 1 });
  } finally {
    db?.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
