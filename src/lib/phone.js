export function nationalDigits(input = '') {
  const text = String(input);
  let digits = text.replace(/\D/g, '');
  if (text.trim().startsWith('+7')) digits = digits.slice(1);
  else if (digits.length === 11 && /^[78]/.test(digits)) digits = digits.slice(1);
  return digits.slice(0, 10);
}
export function formatPhone(input = '') {
  const d = nationalDigits(input);
  if (!d) return '';
  return (
    '+7 (' +
    d.slice(0, 3) +
    (d.length >= 3 ? ')' : '') +
    (d.length > 3 ? ' ' + d.slice(3, 6) : '') +
    (d.length > 6 ? '-' + d.slice(6, 8) : '') +
    (d.length > 8 ? '-' + d.slice(8, 10) : '')
  );
}
export function normalizePhone(input = '') {
  const d = nationalDigits(input);
  return /^7\d{9}$/.test(d) ? '+7' + d : null;
}
export function caretForDigits(formatted, count) {
  if (count <= 0) return Math.min(4, formatted.length);
  let n = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) n++;
    if (n >= count) return i + 1;
  }
  return formatted.length;
}