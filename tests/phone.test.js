import { describe, it, expect } from 'vitest';
import { formatPhone, normalizePhone, nationalDigits, caretForDigits } from '../../../Downloads/nova-dent/src/lib/phone';
describe('Kazakhstan phone input', () => {
  it.each(['+7 (701) 123-45-67', '87011234567', '77011234567', '7011234567'])(
    'normalizes %s',
    (s) => {
      expect(normalizePhone(s)).toBe('+77011234567');
      expect(formatPhone(s)).toBe('+7 (701) 123-45-67');
    },
  );
  it.each(['+74951234567', '+7701123', '', 'abcdefgh'])(
    'rejects incomplete or non-mobile %s',
    (s) => expect(normalizePhone(s)).toBeNull(),
  );
  it('formats partial input and preserves a digit-based caret', () => {
    expect(formatPhone('7011')).toBe('+7 (701) 1');
    expect(caretForDigits('+7 (701) 123-45-67', 5)).toBe(10);
    expect(nationalDigits('+7 (701)')).toBe('701');
  });
});
