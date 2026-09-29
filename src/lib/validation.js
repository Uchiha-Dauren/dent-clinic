import { normalizePhone } from './phone.js';
import { isAvailableDate, validateTime } from './slots.js';
import { siteConfig as c } from '../config/siteConfig.js';
export function tidyName(s) {
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/(^|[\s\-'])[\p{L}]/gu, (m) => m.toLocaleUpperCase());
}
export function validateBooking(values, now = new Date()) {
  const errors = {};
  const name = values.name.trim();
  if (
    name.length < 2 ||
    name.length > 60 ||
    !/^[\p{Script=Latin}\p{Script=Cyrillic}][\p{Script=Latin}\p{Script=Cyrillic} '\u2019-]*$/u.test(
      name,
    )
  )
    errors.name = 'name';
  if (!normalizePhone(values.phone)) errors.phone = 'phone';
  if (!isAvailableDate(values.date, now)) errors.date = 'date';
  if (!validateTime(values.date, values.time, now)) errors.time = 'time';
  if (!values.consent) errors.consent = 'consent';
  if (values.comment.length > 300) errors.comment = 'comment';
  if (values.service && !c.services.some((s) => s.id === values.service))
    errors.service = 'service';
  if (values.doctor && !c.doctors.some((d) => d.id === values.doctor)) errors.doctor = 'doctor';
  if (values.website) errors.website = 'spam';
  return errors;
}
