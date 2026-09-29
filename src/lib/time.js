import ru from '../i18n/ru.js';
import kk from '../i18n/kk.js';
import { siteConfig } from '../config/siteConfig.js';
export function zonedNow(now = new Date(), timeZone = siteConfig.hours.timezone) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .filter((x) => x.type !== 'literal')
      .map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}
export function addDays(date, n) {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function weekday(date) {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][
    new Date(date + 'T12:00:00Z').getUTCDay()
  ];
}
export function dayHours(date, hours = siteConfig.hours) {
  if (hours.closedDates.includes(date)) return null;
  return hours.weekly[weekday(date)] ?? null;
}
export const toMinutes = (s) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};
export function dateLabel(date, lang = 'ru', options = { day: 'numeric', month: 'long' }) {
  const d = new Date(date + 'T12:00:00Z');
  if (Number.isNaN(d.valueOf())) return '';
  const words = (lang === 'kk' ? kk : ru).dates;
  const parts = [];
  if (options.weekday)
    parts.push((options.weekday === 'long' ? words.weekdays : words.shortDays)[d.getUTCDay()]);
  if (options.day)
    parts.push(
      options.day === '2-digit' ? String(d.getUTCDate()).padStart(2, '0') : String(d.getUTCDate()),
    );
  if (options.month)
    parts.push(
      options.month === 'numeric' || options.month === '2-digit'
        ? String(d.getUTCMonth() + 1).padStart(2, '0')
        : (options.month === 'short' ? words.shortMonths : words.months)[d.getUTCMonth()],
    );
  if (options.year) parts.push(String(d.getUTCFullYear()));
  return parts.join(options.month === '2-digit' && !options.weekday ? '.' : ' ');
}
export function getOpenStatus(now = new Date(), hours = siteConfig.hours) {
  const local = zonedNow(now, hours.timezone);
  const todayHours = dayHours(local.date, hours);
  if (
    todayHours &&
    local.minutes >= toMinutes(todayHours[0]) &&
    local.minutes < toMinutes(todayHours[1])
  )
    return { open: true, key: 'open', time: todayHours[1] };
  for (let i = 0; i < 370; i++) {
    const date = addDays(local.date, i);
    const schedule = dayHours(date, hours);
    if (schedule && (i > 0 || local.minutes < toMinutes(schedule[0])))
      return {
        open: false,
        key: i === 0 ? 'closedToday' : i === 1 ? 'closedTomorrow' : 'closedDate',
        time: schedule[0],
        date,
      };
  }
  return { open: false, key: 'closed' };
}

export function zonedDateTimeToUtc(date, time, timeZone = siteConfig.hours.timezone) {
  let guess = Date.parse(`${date}T${time}:00Z`);
  for (let i = 0; i < 3; i++) {
    const local = zonedNow(new Date(guess), timeZone);
    const asUtc = Date.parse(
      `${local.date}T${String(Math.floor(local.minutes / 60)).padStart(2, '0')}:${String(local.minutes % 60).padStart(2, '0')}:00Z`,
    );
    guess += Date.parse(`${date}T${time}:00Z`) - asUtc;
  }
  return new Date(guess);
}
