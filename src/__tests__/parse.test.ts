/**
 * Parse — verifies that every moment-style input shape produces a valid
 * MomentTemporal (or an invalid instance when Temporal refuses).
 */

import momentTemporal from '../moment-temporal';

describe('parse — input dispatch', () => {
  test('no args produces a valid "now" instance', () => {
    const m = momentTemporal();
    expect(m.isValid()).toBe(true);
    // Within 5 seconds of wall-clock now.
    expect(Math.abs(m.valueOf() - Date.now())).toBeLessThan(5000);
  });

  test('epoch milliseconds', () => {
    const m = momentTemporal(1700000000000);
    expect(m.isValid()).toBe(true);
    expect(m.valueOf()).toBe(1700000000000);
  });

  test('Date instance', () => {
    const d = new Date('2023-06-15T12:30:45.000Z');
    const m = momentTemporal(d);
    expect(m.isValid()).toBe(true);
    expect(m.valueOf()).toBe(d.getTime());
  });

  test('invalid Date produces invalid instance', () => {
    const m = momentTemporal(new Date('not a date'));
    expect(m.isValid()).toBe(false);
  });

  test('ISO 8601 string with Z', () => {
    const m = momentTemporal('2023-06-15T12:30:45Z');
    expect(m.isValid()).toBe(true);
    expect(m.year()).toBe(2023);
    expect(m.month()).toBe(5); // 0-indexed
    expect(m.date()).toBe(15);
  });

  test('ISO 8601 with explicit offset', () => {
    const m = momentTemporal('2023-06-15T12:30:45+02:00');
    expect(m.isValid()).toBe(true);
  });

  test('ZonedDateTime bracketed annotation', () => {
    const m = momentTemporal('2023-06-15T12:30:45-04:00[America/New_York]');
    expect(m.isValid()).toBe(true);
    expect(m.year()).toBe(2023);
  });

  test('date-only string', () => {
    const m = momentTemporal('2023-06-15');
    expect(m.isValid()).toBe(true);
    expect(m.hour()).toBe(0);
    expect(m.minute()).toBe(0);
  });

  test('array input [Y, M, D, h, m, s, ms]', () => {
    const m = momentTemporal([2023, 5, 15, 10, 30, 0, 0]); // June (0-indexed)
    expect(m.isValid()).toBe(true);
    expect(m.year()).toBe(2023);
    expect(m.month()).toBe(5);
    expect(m.date()).toBe(15);
    expect(m.hour()).toBe(10);
  });

  test('object input', () => {
    const m = momentTemporal({ year: 2023, month: 5, day: 15, hour: 10, minute: 30 });
    expect(m.isValid()).toBe(true);
    expect(m.year()).toBe(2023);
    expect(m.month()).toBe(5);
  });

  test('clone path: moment(momentTemporal)', () => {
    const m1 = momentTemporal('2023-06-15T12:00:00Z');
    const m2 = momentTemporal(m1);
    expect(m2.valueOf()).toBe(m1.valueOf());
    // Independent state — mutating one does not affect the other.
    m2.add(1, 'day');
    expect(m2.date()).not.toBe(m1.date());
  });

  test('moment.utc(input) forces UTC zone', () => {
    const m = momentTemporal.utc('2023-06-15T12:00:00');
    expect(m.isValid()).toBe(true);
    expect(m.isUTC()).toBe(true);
  });

  test('moment.unix(seconds)', () => {
    const m = momentTemporal.unix(1700000000);
    expect(m.isValid()).toBe(true);
    expect(m.unix()).toBe(1700000000);
  });

  test('garbage input produces invalid instance, not a throw', () => {
    expect(() => momentTemporal('definitely not a date')).not.toThrow();
    expect(momentTemporal('definitely not a date').isValid()).toBe(false);
  });
});
