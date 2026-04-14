/**
 * Duration — asX conversions, humanize thresholds, toISOString.
 */

import momentTemporal from '../moment-temporal';

describe('duration — construction', () => {
  test('from number and unit', () => {
    const d = momentTemporal.duration(1500, 'milliseconds');
    expect(d.asSeconds()).toBe(1.5);
  });

  test('from object input', () => {
    const d = momentTemporal.duration({ hours: 2, minutes: 30 });
    expect(d.asMinutes()).toBe(150);
    expect(d.asHours()).toBe(2.5);
  });
});

describe('duration — asX conversions', () => {
  const d = momentTemporal.duration({ days: 1, hours: 2, minutes: 30 });

  test('asMilliseconds / asSeconds / asMinutes / asHours / asDays', () => {
    expect(d.asMilliseconds()).toBe((1 * 86400 + 2 * 3600 + 30 * 60) * 1000);
    expect(d.asSeconds()).toBe(1 * 86400 + 2 * 3600 + 30 * 60);
    expect(d.asMinutes()).toBe((1 * 86400 + 2 * 3600 + 30 * 60) / 60);
    expect(d.asHours()).toBe((1 * 86400 + 2 * 3600 + 30 * 60) / 3600);
    expect(d.asDays()).toBeCloseTo(1 + 2.5 / 24);
  });
});

describe('duration — humanize thresholds', () => {
  const cases: Array<[number, string, string]> = [
    // [seconds, withoutSuffix, withSuffix (future)]
    [1, 'a few seconds', 'in a few seconds'],
    [44, 'a few seconds', 'in a few seconds'],
    [60, 'a minute', 'in a minute'],
    [600, '10 minutes', 'in 10 minutes'],
    [3600, 'an hour', 'in an hour'],
    [3 * 3600, '3 hours', 'in 3 hours'],
    [86400, 'a day', 'in a day'],
    [3 * 86400, '3 days', 'in 3 days'],
    [40 * 86400, 'a month', 'in a month'],
    [100 * 86400, '3 months', 'in 3 months'],
    [400 * 86400, 'a year', 'in a year'],
  ];

  test.each(cases)('%i seconds → "%s"', (seconds, withoutSuffix, withSuffix) => {
    const d = momentTemporal.duration({ seconds });
    expect(d.humanize(false)).toBe(withoutSuffix);
    expect(d.humanize(true)).toBe(withSuffix);
  });

  test('past tense when negative', () => {
    const d = momentTemporal.duration({ seconds: -3600 });
    expect(d.humanize(true)).toBe('an hour ago');
  });
});

describe('duration — toISOString', () => {
  test('produces ISO 8601 duration format', () => {
    const d = momentTemporal.duration({ hours: 2, minutes: 30, seconds: 45 });
    const s = d.toISOString();
    // Temporal emits "PT2H30M45S" for this shape.
    expect(s).toMatch(/^PT?2H30M45S$/);
  });
});

describe('duration — fromNow relative time', () => {
  test('fromNow with past instant uses "ago"', () => {
    const past = momentTemporal().subtract(2, 'hours');
    expect(past.fromNow()).toContain('ago');
  });

  test('fromNow with future instant uses "in"', () => {
    const future = momentTemporal().add(2, 'hours');
    expect(future.fromNow()).toMatch(/^in /);
  });
});
