/**
 * Query — isBefore/isSame/isAfter/isBetween/diff. Unit granularity and
 * inclusivity brackets are the subtle bits.
 */

import momentTemporal from '../moment-temporal';

describe('query — comparisons', () => {
  const a = momentTemporal('2023-06-15T10:00:00Z');
  const b = momentTemporal('2023-06-15T12:00:00Z');
  const c = momentTemporal('2023-06-15T10:00:00Z');

  test('isBefore / isAfter', () => {
    expect(a.isBefore(b)).toBe(true);
    expect(b.isAfter(a)).toBe(true);
    expect(a.isBefore(a)).toBe(false);
  });

  test('isSame', () => {
    expect(a.isSame(c)).toBe(true);
    expect(a.isSame(b)).toBe(false);
  });

  test('isSameOrBefore / isSameOrAfter', () => {
    expect(a.isSameOrBefore(c)).toBe(true);
    expect(a.isSameOrBefore(b)).toBe(true);
    expect(b.isSameOrAfter(a)).toBe(true);
    expect(b.isSameOrAfter(b)).toBe(true);
  });

  test('granularity: isSame at day-level ignores time-of-day', () => {
    // Use UTC so startOf('day') lands on the same UTC calendar day
    // regardless of the CI host's timezone.
    const morning = momentTemporal.utc('2023-06-15T03:00:00Z');
    const evening = momentTemporal.utc('2023-06-15T22:00:00Z');
    expect(morning.isSame(evening, 'day')).toBe(true);
    expect(morning.isSame(evening)).toBe(false);
  });

  test('granularity: isBefore at month-level', () => {
    const june = momentTemporal.utc('2023-06-30T00:00:00Z');
    const july = momentTemporal.utc('2023-07-01T00:00:00Z');
    expect(june.isBefore(july, 'month')).toBe(true);
    expect(june.isSame(july, 'month')).toBe(false);
  });
});

describe('query — isBetween with inclusivity', () => {
  const from = momentTemporal('2023-01-01T00:00:00Z');
  const to = momentTemporal('2023-12-31T00:00:00Z');

  test('default "()" exclusive', () => {
    expect(momentTemporal('2023-06-15T00:00:00Z').isBetween(from, to)).toBe(true);
    expect(from.isBetween(from, to)).toBe(false);
    expect(to.isBetween(from, to)).toBe(false);
  });

  test('"[]" fully inclusive', () => {
    expect(from.isBetween(from, to, undefined, '[]')).toBe(true);
    expect(to.isBetween(from, to, undefined, '[]')).toBe(true);
  });

  test('"[)" left inclusive, right exclusive', () => {
    expect(from.isBetween(from, to, undefined, '[)')).toBe(true);
    expect(to.isBetween(from, to, undefined, '[)')).toBe(false);
  });

  test('"(]" left exclusive, right inclusive', () => {
    expect(from.isBetween(from, to, undefined, '(]')).toBe(false);
    expect(to.isBetween(from, to, undefined, '(]')).toBe(true);
  });
});

describe('query — diff', () => {
  test('diff in days', () => {
    const a = momentTemporal('2023-01-01T00:00:00Z');
    const b = momentTemporal('2023-01-11T00:00:00Z');
    expect(b.diff(a, 'days')).toBe(10);
    expect(a.diff(b, 'days')).toBe(-10);
  });

  test('diff in hours', () => {
    const a = momentTemporal('2023-01-01T00:00:00Z');
    const b = momentTemporal('2023-01-01T05:30:00Z');
    expect(b.diff(a, 'hours')).toBe(5); // truncated
    expect(b.diff(a, 'hours', true)).toBeCloseTo(5.5);
  });

  test('diff in months (Temporal-first: uses relativeTo for precision)', () => {
    const a = momentTemporal('2023-01-15T00:00:00Z');
    const b = momentTemporal('2023-04-15T00:00:00Z');
    expect(b.diff(a, 'months')).toBe(3);
  });

  test('diff defaults to milliseconds', () => {
    const a = momentTemporal('2023-01-01T00:00:00Z');
    const b = momentTemporal('2023-01-01T00:00:01Z');
    expect(b.diff(a)).toBe(1000);
  });
});
