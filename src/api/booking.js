import { createId } from '../lib/id';
export const isMockMode = import.meta.env.VITE_MOCK_API === 'true';
// Keep the same key after a timeout: the server may already have saved the request.
let pendingAttempt;
export async function submitBooking(payload) {
  if (isMockMode) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return { ok: true, id: createId(), mock: true };
  }
  const body = JSON.stringify(payload);
  if (!pendingAttempt || pendingAttempt.body !== body) pendingAttempt = { body, key: createId() };
  const attempt = pendingAttempt;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const base = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
    const response = await fetch(base + '/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attempt.key },
      body,
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(`Booking request failed (${response.status})`);
      error.fields = result.fields;
      error.retryAfter = result.retryAfter;
      throw error;
    }
    if (result?.ok !== true || !result?.id) throw new Error('Invalid booking response');
    if (pendingAttempt === attempt) pendingAttempt = undefined;
    return result;
  } finally {
    clearTimeout(timeout);
  }
}
