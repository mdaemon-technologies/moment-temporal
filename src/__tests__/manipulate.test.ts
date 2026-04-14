/**
 * Manipulate — add/subtract/startOf/endOf/set/get and the mutable
 * chainable contract. Moment's API mutates the receiver AND returns it;
 * we preserve both so idiomatic moment code keeps working.
 */

import momentTemporal from '../moment-temporal';

// All tests that read/write calendar fields use .utc() so assertions do
// not depend on the CI host's local timezone.
describe('manipulate — add / subtract', () => {
  test('add days is chainable and mutating', () => {
    const m = momentTemporal.utc('2023-01-01T00:00:00Z');
    const result = m.add(5, 'days');
    expect(result).toBe(m); // chainable — returns this
    expect(m.date()).toBe(6); // mutated
  });

  test('add supports alias forms', () => {
    const m = momentTemporal.utc('2023-01-01T00:00:00Z');
    m.add(1, 'd').add(1, 'day').add(1, 'days');
    expect(m.date()).toBe(4);
  });

  test('subtract hours', () => {
    const m = momentTemporal.utc('2023-06-15T12:00:00Z');
    m.subtract(3, 'hours');
    expect(m.hour()).toBe(9);
  });

  test('add with object shorthand', () => {
    const m = momentTemporal.utc('2023-01-01T00:00:00Z');
    m.add({ years: 1, months: 2, days: 3 });
    expect(m.year()).toBe(2024);
    expect(m.month()).toBe(2); // March (0-indexed)
    expect(m.date()).toBe(4);
  });
});

describe('manipulate — startOf / endOf', () => {
  test('startOf day', () => {
    const m = momentTemporal.utc('2023-06-15T14:37:22.500Z').startOf('day');
    expect(m.hour()).toBe(0);
    expect(m.minute()).toBe(0);
    expect(m.second()).toBe(0);
    expect(m.millisecond()).toBe(0);
  });

  test('startOf month', () => {
    const m = momentTemporal.utc('2023-06-15T14:37:22Z').startOf('month');
    expect(m.date()).toBe(1);
    expect(m.hour()).toBe(0);
  });

  test('startOf year', () => {
    const m = momentTemporal.utc('2023-06-15T14:37:22Z').startOf('year');
    expect(m.month()).toBe(0); // January
    expect(m.date()).toBe(1);
  });

  test('startOf week is ISO Monday (Temporal-first)', () => {
    // 2023-06-15 is a Thursday. ISO week starts Monday 2023-06-12.
    const m = momentTemporal('2023-06-15T14:00:00Z').utc().startOf('week');
    expect(m.date()).toBe(12);
    // Day-of-week: Monday is 1 in ISO; moment's .day() returns 1 for Monday.
    expect(m.day()).toBe(1);
  });

  test('endOf day', () => {
    const m = momentTemporal.utc('2023-06-15T14:00:00Z').endOf('day');
    expect(m.hour()).toBe(23);
    expect(m.minute()).toBe(59);
    expect(m.second()).toBe(59);
    expect(m.millisecond()).toBe(999);
  });

  test('endOf month handles varying month lengths', () => {
    const feb = momentTemporal.utc('2023-02-10T00:00:00Z').endOf('month');
    expect(feb.date()).toBe(28); // 2023 is not a leap year
    const febLeap = momentTemporal.utc('2024-02-10T00:00:00Z').endOf('month');
    expect(febLeap.date()).toBe(29);
  });
});

describe('manipulate — get / set', () => {
  test('generic get', () => {
    const m = momentTemporal.utc('2023-06-15T14:37:22Z');
    expect(m.get('year')).toBe(2023);
    expect(m.get('month')).toBe(5);
    expect(m.get('day')).toBe(15);
    expect(m.get('hour')).toBe(14);
  });

  test('generic set mutates and chains', () => {
    const m = momentTemporal.utc('2023-01-01T00:00:00Z');
    const result = m.set('year', 2025).set('month', 11);
    expect(result).toBe(m);
    expect(m.year()).toBe(2025);
    expect(m.month()).toBe(11);
  });

  test('getter/setter duality on each unit', () => {
    const m = momentTemporal.utc('2023-06-15T10:20:30.400Z');
    m.hour(5).minute(15).second(45).millisecond(100);
    expect(m.hour()).toBe(5);
    expect(m.minute()).toBe(15);
    expect(m.second()).toBe(45);
    expect(m.millisecond()).toBe(100);
  });

  test('daysInMonth', () => {
    expect(momentTemporal.utc('2023-01-15T00:00:00Z').daysInMonth()).toBe(31);
    expect(momentTemporal.utc('2023-02-15T00:00:00Z').daysInMonth()).toBe(28);
    expect(momentTemporal.utc('2024-02-15T00:00:00Z').daysInMonth()).toBe(29);
    expect(momentTemporal.utc('2023-04-15T00:00:00Z').daysInMonth()).toBe(30);
  });

  test('isLeapYear', () => {
    expect(momentTemporal.utc('2023-06-15T12:00:00Z').isLeapYear()).toBe(false);
    expect(momentTemporal.utc('2024-06-15T12:00:00Z').isLeapYear()).toBe(true);
    expect(momentTemporal.utc('2000-06-15T12:00:00Z').isLeapYear()).toBe(true);
    expect(momentTemporal.utc('1900-06-15T12:00:00Z').isLeapYear()).toBe(false);
  });
});

describe('manipulate — clone independence', () => {
  test('clone produces independent state', () => {
    const m1 = momentTemporal.utc('2023-06-15T00:00:00Z');
    const m2 = m1.clone();
    m2.add(1, 'year');
    expect(m1.year()).toBe(2023);
    expect(m2.year()).toBe(2024);
  });
});
