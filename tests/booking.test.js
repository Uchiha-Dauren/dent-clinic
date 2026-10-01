import { describe, it, expect, vi, afterEach } from 'vitest';
import { validateBooking } from '../../../Downloads/nova-dent/src/lib/validation';
import ru from '../../../Downloads/nova-dent/src/i18n/ru';
import kk from '../../../Downloads/nova-dent/src/i18n/kk';
import { dateLabel } from '../../../Downloads/nova-dent/src/lib/time';
const values = {
  name: 'Әлия',
  phone: '+77010000000',
  date: '2026-09-29',
  time: '09:30',
  service: '',
  doctor: '',
  comment: '',
  consent: true,
  website: '',
};
const now = new Date('2026-09-28T10:00Z');
describe('booking', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.resetModules();
  });
  it('validates Kazakh and rejects invalid date, consent and honeypot', () => {
    expect(validateBooking(values, now)).toEqual({});
    expect(
      validateBooking({ ...values, date: '2026-09-27', consent: false, website: 'bot' }, now),
    ).toMatchObject({ date: 'date', time: 'time', consent: 'consent', website: 'spam' });
  });
  it('matches every Russian and Kazakh translation key', () => {
    function keys(o, p = '') {
      return Object.entries(o)
        .flatMap(([k, v]) => (typeof v === 'object' ? keys(v, p + k + '.') : [p + k]))
        .sort();
    }
    expect(keys(kk)).toEqual(keys(ru));
    expect(
      dateLabel('2026-09-29', 'kk', { weekday: 'short', day: 'numeric', month: 'short' }),
    ).toBe('Сс 29 қыр.');
  });
  it('uses mock only when explicitly enabled', async () => {
    vi.stubEnv('VITE_MOCK_API', 'true');
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const { submitBooking } = await import('../../../Downloads/nova-dent/src/api/booking');
    const pending = submitBooking(values);
    await vi.advanceTimersByTimeAsync(900);
    expect(await pending).toMatchObject({ ok: true, mock: true, id: expect.any(String) });
  });
  it('posts JSON to configured backend', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.test/');
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ ok: true, id: '123' }) });
    vi.stubGlobal('fetch', fetch);
    const { submitBooking } = await import('../../../Downloads/nova-dent/src/api/booking');
    expect(await submitBooking(values)).toEqual({ ok: true, id: '123' });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.test/api/bookings',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(values) }),
    );
  });
  it('surfaces server errors instead of reporting success', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.test');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    );
    const { submitBooking } = await import('../../../Downloads/nova-dent/src/api/booking');
    await expect(submitBooking(values)).rejects.toThrow('500');
  });
});

describe('same-origin backend', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });
  it('defaults to real API and reuses the key when retrying a failed response', async () => {
    vi.stubEnv('VITE_API_URL', '');
    vi.stubEnv('VITE_MOCK_API', 'false');
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('connection lost'))
      .mockResolvedValue({ ok: true, json: async () => ({ ok: true, id: 'saved' }) });
    vi.stubGlobal('fetch', fetch);
    const { submitBooking, isMockMode } = await import('../../../Downloads/nova-dent/src/api/booking');
    expect(isMockMode).toBe(false);
    await expect(submitBooking(values)).rejects.toThrow('connection lost');
    expect(await submitBooking(values)).toMatchObject({ ok: true, id: 'saved' });
    expect(fetch.mock.calls[0][0]).toBe('/api/bookings');
    expect(fetch.mock.calls[0][1].headers['Idempotency-Key']).toBe(
      fetch.mock.calls[1][1].headers['Idempotency-Key'],
    );
  });
});
