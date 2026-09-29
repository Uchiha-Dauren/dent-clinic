import { createId } from './id';
import { zonedDateTimeToUtc } from './time';
import { siteConfig as c } from '../config/siteConfig';
const escape = (s) =>
  String(s)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
const stamp = (d) =>
  d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
// RFC 5545 folds long lines at 75 octets (UTF-8 aware) and uses CRLF endings.
function fold(line) {
  let lines = [],
    part = '',
    bytes = 0;
  for (const ch of line) {
    const len = new TextEncoder().encode(ch).length;
    if (bytes + len > 75) {
      lines.push(part);
      part = ' ';
      bytes = 1;
    }
    part += ch;
    bytes += len;
  }
  lines.push(part);
  return lines.join('\r\n');
}
export function buildIcs(booking, { title, description, location = c.address[booking.lang] }) {
  if (booking.time === 'any') return null;
  const start = zonedDateTimeToUtc(booking.date, booking.time),
    end = new Date(start.getTime() + 30 * 60000);
  return (
    [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nova Dent//Appointment Request//RU',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${booking.id || createId()}@nova-dent`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${escape(title)}`,
      `DESCRIPTION:${escape(description)}`,
      `LOCATION:${escape(location)}`,
      'STATUS:TENTATIVE',
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .map(fold)
      .join('\r\n') + '\r\n'
  );
}
export function downloadIcs(booking, options) {
  const content = buildIcs(booking, options);
  if (!content) return;
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'nova-dent-appointment.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
