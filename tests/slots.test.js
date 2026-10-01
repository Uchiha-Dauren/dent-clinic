import { describe, it, expect } from 'vitest';
import { generateSlots, isAvailableDate, validateTime } from '../../../Downloads/nova-dent/src/lib/slots';
import { getOpenStatus, zonedNow, zonedDateTimeToUtc } from '../../../Downloads/nova-dent/src/lib/time';
import { siteConfig } from '../../../Downloads/nova-dent/src/config/siteConfig';
import { buildIcs } from '../../../Downloads/nova-dent/src/lib/ics';
const monday = new Date('2026-09-28T10:00:00Z');
describe('clinic timezone and appointment slots', () => {
  it('uses Almaty time independently of client timezone', () =>
    expect(zonedNow(monday)).toEqual({ date: '2026-09-28', minutes: 900 }));
  it('creates weekday and weekend slots excluding closing time', () => {
    const week = generateSlots('2026-09-29', monday);
    expect(week).toHaveLength(24);
    expect(week[0].time).toBe('09:00');
    expect(week.at(-1).time).toBe('20:30');
    const weekend = generateSlots('2026-10-03', monday);
    expect(weekend).toHaveLength(20);
    expect(weekend.at(-1).time).toBe('19:30');
  });
  it('blocks past and next 60 minutes including boundary', () => {
    const slots = generateSlots('2026-09-28', monday);
    expect(slots.find((s) => s.time === '16:00').disabled).toBe(true);
    expect(slots.find((s) => s.time === '16:30').disabled).toBe(false);
  });
  it('honors closures and 60 day horizon', () => {
    const hours = { ...siteConfig.hours, closedDates: ['2026-09-29'] };
    expect(generateSlots('2026-09-29', monday, hours)).toEqual([]);
    expect(isAvailableDate('2026-09-29', monday, hours)).toBe(false);
    expect(isAvailableDate('2026-11-27', monday)).toBe(true);
    expect(isAvailableDate('2026-11-28', monday)).toBe(false);
    expect(isAvailableDate('2026-02-30', monday)).toBe(false);
  });
  it('handles open/close boundaries and next day', () => {
    expect(getOpenStatus(new Date('2026-09-28T04:00:00Z')).open).toBe(true);
    expect(getOpenStatus(new Date('2026-09-28T16:00:00Z')).key).toBe('closedTomorrow');
    expect(validateTime('2026-09-28', 'any', monday)).toBe(true);
  });
  it('moves past midnight using the clinic calendar', () =>
    expect(zonedNow(new Date('2026-09-28T20:10:00Z')).date).toBe('2026-09-29'));
  it('exports a 30-minute UTC calendar event and omits callback', () => {
    expect(zonedDateTimeToUtc('2026-09-29', '09:00').toISOString()).toBe(
      '2026-09-29T04:00:00.000Z',
    );
    const event = { id: 'test', date: '2026-09-29', time: '09:00', lang: 'ru' };
    const ics = buildIcs(event, { title: 'Приём', description: 'Подтвердить', location: 'Астана' });
    expect(ics).toContain('DTSTART:20260929T040000Z\r\nDTEND:20260929T043000Z');
    expect(buildIcs({ ...event, time: 'any' }, { title: 'Test' })).toBeNull();
  });
});
