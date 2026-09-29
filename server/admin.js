import { tidyName } from '../src/lib/validation.js';
import { database } from './database.js';
import { authenticate, denied } from './auth.js';
import { json, readJson } from './http.js';
export const statuses = ['pending', 'contacted', 'confirmed', 'cancelled'];
const columns =
  'id, name, phone, preferred_date, preferred_time, service, doctor, comment, admin_note, revision, lang, status, consent_version, created_at, updated_at';
function filters(url) {
  const status = url.searchParams.get('status') || '';
  const q = (url.searchParams.get('q') || '').trim();
  const date = url.searchParams.get('date') || '';
  if (
    (status && !statuses.includes(status)) ||
    q.length > 100 ||
    (date &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(date + 'T12:00:00Z')) ||
        new Date(date + 'T12:00:00Z').toISOString().slice(0, 10) !== date))
  )
    throw { status: 422, code: 'invalid_query' };
  const clauses = [],
    params = [];
  if (q) {
    clauses.push(
      '(instr(lower(name), lower(?)) > 0 OR instr(name, ?) > 0 OR instr(name, ?) > 0 OR instr(phone, ?) > 0)',
    );
    params.push(q, tidyName(q), q.toUpperCase(), q.replace(/[\s()-]/g, '') || q);
  }
  if (date) {
    clauses.push('preferred_date = ?');
    params.push(date);
  }
  const scope = clauses.length ? ' WHERE ' + clauses.join(' AND ') : '';
  const scopedParams = [...params];
  if (status) {
    clauses.push('status = ?');
    params.push(status);
  }
  return {
    where: clauses.length ? ' WHERE ' + clauses.join(' AND ') : '',
    scope,
    params,
    scopedParams,
  };
}
function csvCell(value) {
  let text = String(value ?? '').replace(/\u0000/g, '');
  if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export async function adminRoute(request, env, context) {
  if (!(await authenticate(request, env, context))) return denied(env);
  const db = database(env),
    url = new URL(request.url),
    path = url.pathname;
  if (path === '/api/bookings/export' && request.method === 'GET') {
    const filter = filters(url);
    const result = await db
      .prepare(
        `SELECT ${columns} FROM booking_requests${filter.where} ORDER BY created_at DESC, id DESC LIMIT 5001`,
      )
      .bind(...filter.params)
      .all();
    if (result.results.length > 5000) return json({ ok: false, error: 'export_too_large' }, 422);
    const keys = [
      'id',
      'name',
      'phone',
      'preferred_date',
      'preferred_time',
      'service',
      'doctor',
      'status',
      'comment',
      'admin_note',
      'lang',
      'created_at',
    ];
    const csv =
      '\uFEFF' +
      [
        keys.join(','),
        ...result.results.map((row) => keys.map((k) => csvCell(row[k])).join(',')),
      ].join('\r\n');
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="nova-dent-bookings-${context.now.toISOString().slice(0, 10)}.csv"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }
  if (path === '/api/bookings' && request.method === 'GET') {
    const filter = filters(url),
      limit = Number(url.searchParams.get('limit') ?? 20),
      offset = Number(url.searchParams.get('offset') ?? 0);
    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      !Number.isInteger(offset) ||
      offset < 0 ||
      offset > 100000
    )
      return json({ ok: false, error: 'invalid_query' }, 422);
    const [rows, total, counts] = await db.batch([
      db
        .prepare(
          `SELECT ${columns} FROM booking_requests${filter.where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
        )
        .bind(...filter.params, limit, offset),
      db
        .prepare(`SELECT count(*) AS total FROM booking_requests${filter.where}`)
        .bind(...filter.params),
      db
        .prepare(
          `SELECT status, count(*) AS count FROM booking_requests${filter.scope} GROUP BY status`,
        )
        .bind(...filter.scopedParams),
    ]);
    const summary = Object.fromEntries(statuses.map((s) => [s, 0]));
    for (const row of counts.results)
      if (statuses.includes(row.status)) summary[row.status] = row.count;
    return json({
      ok: true,
      bookings: rows.results,
      total: total.results[0].total,
      counts: summary,
      limit,
      offset,
    });
  }
  if (/^\/api\/bookings\/[^/]+$/.test(path)) {
    const id = path.split('/').pop();
    if (request.method === 'GET') {
      const row = await db
        .prepare(`SELECT ${columns} FROM booking_requests WHERE id = ?`)
        .bind(id)
        .first();
      return row ? json({ ok: true, booking: row }) : json({ ok: false, error: 'not_found' }, 404);
    }
    if (request.method === 'PATCH') {
      const data = await readJson(request);
      if (!data || !statuses.includes(data.status))
        return json({ ok: false, error: 'invalid_status' }, 422);
      if (
        data.adminNote !== undefined &&
        (typeof data.adminNote !== 'string' || data.adminNote.length > 1000)
      )
        return json({ ok: false, error: 'invalid_note' }, 422);
      if (data.revision !== undefined && (!Number.isInteger(data.revision) || data.revision < 1))
        return json({ ok: false, error: 'invalid_revision' }, 422);
      const current = await db
        .prepare('SELECT admin_note, revision FROM booking_requests WHERE id = ?')
        .bind(id)
        .first();
      if (!current) return json({ ok: false, error: 'not_found' }, 404);
      const result = await db
        .prepare(
          'UPDATE booking_requests SET status = ?, admin_note = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND revision = ? RETURNING id, status, revision, updated_at',
        )
        .bind(
          data.status,
          data.adminNote === undefined ? current.admin_note : data.adminNote.trim(),
          context.now.toISOString(),
          id,
          data.revision ?? current.revision,
        )
        .first();
      return result
        ? json({ ok: true, ...result })
        : json({ ok: false, error: 'revision_conflict' }, 409);
    }
  }
  return json({ ok: false, error: 'method_not_allowed' }, 405);
}
