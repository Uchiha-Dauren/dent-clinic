import { siteConfig } from '../config/siteConfig.js';
import { zonedNow, dayHours, toMinutes, addDays } from './time.js';
export function isAvailableDate(date, now = new Date(), hours = siteConfig.hours) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(date + 'T12:00:00Z');
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== date) return false;
  const { date: today } = zonedNow(now, hours.timezone);
  return date >= today && date <= addDays(today, 60) && !!dayHours(date, hours);
}
export function generateSlots(date, now = new Date(), hours = siteConfig.hours) {
  const schedule = dayHours(date, hours);
  if (!schedule) return [];
  const local = zonedNow(now, hours.timezone),
    result = [];
  for (let n = toMinutes(schedule[0]); n < toMinutes(schedule[1]); n += hours.slotMinutes) {
    result.push({
      time: `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`,
      disabled: date < local.date || (date === local.date && n <= local.minutes + 60),
    });
  }
  return result;
}
export function validateTime(date, time, now = new Date(), hours = siteConfig.hours) {
  return (
    isAvailableDate(date, now, hours) &&
    (time === 'any' || generateSlots(date, now, hours).some((s) => s.time === time && !s.disabled))
  );
}
