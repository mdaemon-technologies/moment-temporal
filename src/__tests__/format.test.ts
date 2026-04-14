/**
 * Format — numeric tokens are hand-checked, localized tokens are delegated
 * to Intl (so we only assert they produce a non-empty string and match a
 * reasonable pattern). Temporal-first: Intl is the truth for localized
 * output, not moment's bundled locale files.
 */

import momentTemporal from '../moment-temporal';

describe('format — numeric tokens', () => {
  // Use UTC so the test doesn't depend on the host timezone.
  const m = momentTemporal.utc('2023-06-15T14:05:09.042Z');

  test('YYYY / YY', () => {
    expect(m.format('YYYY')).toBe('2023');
    expect(m.format('YY')).toBe('23');
  });

  test('MM / M', () => {
    expect(m.format('MM')).toBe('06');
    expect(m.format('M')).toBe('6');
  });

  test('DD / D', () => {
    expect(m.format('DD')).toBe('15');
    expect(m.format('D')).toBe('15');
  });

  test('HH / H / hh / h', () => {
    expect(m.format('HH')).toBe('14');
    expect(m.format('H')).toBe('14');
    expect(m.format('hh')).toBe('02');
    expect(m.format('h')).toBe('2');
  });

  test('mm / ss', () => {
    expect(m.format('mm')).toBe('05');
    expect(m.format('ss')).toBe('09');
  });

  test('SSS milliseconds', () => {
    expect(m.format('SSS')).toBe('042');
  });

  test('A / a AM-PM', () => {
    expect(m.format('A')).toBe('PM');
    expect(m.format('a')).toBe('pm');
    const morning = momentTemporal.utc('2023-06-15T09:00:00Z');
    expect(morning.format('A')).toBe('AM');
  });

  test('composite YYYY-MM-DD HH:mm:ss', () => {
    expect(m.format('YYYY-MM-DD HH:mm:ss')).toBe('2023-06-15 14:05:09');
  });

  test('X / x unix timestamps', () => {
    const utc = momentTemporal.utc('2023-01-01T00:00:00Z');
    expect(utc.format('X')).toBe('1672531200');
    expect(utc.format('x')).toBe('1672531200000');
  });

  test('Z / ZZ offset tokens', () => {
    // Explicitly construct a zoned time so the offset is deterministic.
    const zoned = momentTemporal('2023-06-15T12:00:00+05:30');
    expect(zoned.format('Z')).toBe('+05:30');
    expect(zoned.format('ZZ')).toBe('+0530');
  });

  test('bracketed literals pass through', () => {
    expect(m.format('[Year:] YYYY')).toBe('Year: 2023');
    expect(m.format('[YYYY][MM]')).toBe('YYYYMM');
  });

  test('ordinals', () => {
    expect(momentTemporal.utc('2023-01-01T00:00:00Z').format('Do')).toBe('1st');
    expect(momentTemporal.utc('2023-01-02T00:00:00Z').format('Do')).toBe('2nd');
    expect(momentTemporal.utc('2023-01-03T00:00:00Z').format('Do')).toBe('3rd');
    expect(momentTemporal.utc('2023-01-04T00:00:00Z').format('Do')).toBe('4th');
    expect(momentTemporal.utc('2023-01-21T00:00:00Z').format('Do')).toBe('21st');
  });
});

describe('format — localized tokens (Intl-backed)', () => {
  const m = momentTemporal.utc('2023-06-15T14:05:09Z');

  test('dddd produces a long weekday name', () => {
    const s = m.format('dddd');
    // June 15 2023 is a Thursday.
    expect(s.toLowerCase()).toContain('thursday');
  });

  test('MMMM produces a long month name', () => {
    expect(m.format('MMMM').toLowerCase()).toContain('june');
  });

  test('MMM is a short month name', () => {
    expect(m.format('MMM').toLowerCase()).toMatch(/^jun/);
  });

  test('LT / L produce non-empty localized strings', () => {
    expect(m.format('LT').length).toBeGreaterThan(0);
    expect(m.format('L').length).toBeGreaterThan(0);
  });
});

describe('format — invalid instance', () => {
  test('returns "Invalid date"', () => {
    expect(momentTemporal('garbage').format('YYYY-MM-DD')).toBe('Invalid date');
  });
});
