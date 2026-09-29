export function database(env) {
  if (!env.DB) throw new Error('Database unavailable');
  return env.DB;
}
export async function findRequest(db, key) {
  return db
    .prepare(
      'SELECT id, payload_hash, created_at, status FROM booking_requests WHERE idempotency_key = ?',
    )
    .bind(key)
    .first();
}
export async function consumeLimit(db, key, now, maximum) {
  const windowMs = 10 * 60 * 1000;
  const [result] = await db.batch([
    db
      .prepare(
        `INSERT INTO request_limits (key, count, expires_at) VALUES (?, 1, ?)
      ON CONFLICT(key) DO UPDATE SET
        count = CASE WHEN expires_at <= ? THEN 1 ELSE count + 1 END,
        expires_at = CASE WHEN expires_at <= ? THEN excluded.expires_at ELSE expires_at END
      RETURNING count, expires_at`,
      )
      .bind(key, now + windowMs, now, now),
    db.prepare('DELETE FROM request_limits WHERE expires_at <= ?').bind(now),
  ]);
  const row = result.results[0];
  return {
    allowed: row.count <= maximum,
    retryAfter: Math.max(1, Math.ceil((row.expires_at - now) / 1000)),
  };
}
export async function insertRequest(db, record) {
  return db
    .prepare(
      `INSERT INTO booking_requests
    (id, idempotency_key, payload_hash, name, phone, preferred_date, preferred_time,
     service, doctor, comment, consent, consent_version, lang, source, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 'website', 'pending', ?, ?)
    ON CONFLICT(idempotency_key) DO NOTHING RETURNING id`,
    )
    .bind(
      record.id,
      record.key,
      record.hash,
      record.name,
      record.phone,
      record.date,
      record.time,
      record.service,
      record.doctor,
      record.comment,
      '2026-09-28',
      record.lang,
      record.createdAt,
      record.createdAt,
    )
    .first();
}
