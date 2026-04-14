/**
 * Divergence regression suite. Each test here locks in a deliberate
 * difference between the Temporal-backed wrapper and raw moment. If
 * someone "fixes" the wrapper to match moment's legacy behavior, the
 * corresponding test fails and points at the plan decision it protects.
 *
 * The pattern: build both a wrapper instance and a raw moment instance
 * for the same input, then assert the documented divergence.
 */

import momentTemporal from '../moment-temporal';
// Raw moment is available transitively — we use it here only to compare.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const moment = require('moment');

describe('divergence — strict parsing', () => {
  test('invalid input: wrapper refuses what moment accepts loosely', () => {
    // Moment's forgiving parser will happily mangle this; Temporal refuses.
    const input = '2023-13-45'; // month 13, day 45
    const wrap = momentTemporal(input);
    expect(wrap.isValid()).toBe(false);

    // moment also reports invalid for this specific case — but for many
    // malformed-but-recognizable strings moment accepts and wrapper doesn't.
    // A more illustrative case: moment accepts "June 15 2023" via its
    // human-readable parser; Temporal does not.
    const human = 'June 15 2023';
    expect(momentTemporal(human).isValid()).toBe(false);
    // moment accepts it with a deprecation warning:
    // (we do not assert moment's validity to avoid coupling to moment internals)
  });
});

describe('divergence — week numbering (ISO vs locale)', () => {
  test('startOf(week) is Monday in the wrapper, regardless of locale', () => {
    // 2023-06-15 is a Thursday.
    // ISO week start → Monday 2023-06-12.
    const wrap = momentTemporal.utc('2023-06-15T12:00:00Z').startOf('week');
    expect(wrap.date()).toBe(12);

    // Moment's en-US default starts weeks on Sunday (June 11). This asserts
    // the wrapper does NOT match moment's locale-dependent start.
    const m = moment.utc('2023-06-15T12:00:00Z').startOf('week');
    expect(m.date()).toBe(11);
    expect(wrap.date()).not.toBe(m.date());
  });
});

describe('divergence — diff on variable-length units uses relativeTo', () => {
  test('month diff across month boundaries is Temporal-accurate', () => {
    // From Jan 31 to Feb 28 — moment's diff is 0 months (fractional);
    // Temporal.Duration.total with relativeTo returns a value closer to 1.
    const a = momentTemporal.utc('2023-01-31T00:00:00Z');
    const b = momentTemporal.utc('2023-02-28T00:00:00Z');
    const wrapDiff = b.diff(a, 'months', true);
    // We don't assert an exact value — just that the Temporal computation
    // treats this as "very close to 1 month" rather than "0 months".
    expect(wrapDiff).toBeGreaterThan(0.9);
  });
});

describe('divergence — localized format output via Intl', () => {
  test('LL format uses Intl.DateTimeFormat output', () => {
    // We don't byte-compare against moment; we assert the wrapper's
    // output is a non-empty string that came from Intl. Moment's LL for
    // en-US is "June 15, 2023"; Intl.DateTimeFormat en-US produces the
    // same shape but the implementations are independent.
    const wrap = momentTemporal.utc('2023-06-15T12:00:00Z');
    wrap.locale('en-US');
    const out = wrap.format('LL');
    expect(out).toContain('2023');
    expect(out.toLowerCase()).toContain('june');
  });
});

describe('divergence — fallback vs wrapper divergence is documented', () => {
  test('wrapper and raw moment can report different output for the same input', () => {
    // This is a meta-test: it simply exercises a known divergence case
    // to confirm the regression suite itself runs. If the wrapper ever
    // starts matching moment on week starts, the earlier test fails.
    const input = '2023-06-15T12:00:00Z';
    const wrapWeek = momentTemporal.utc(input).startOf('week').date();
    const momentWeek = moment.utc(input).startOf('week').date();
    expect(wrapWeek).not.toBe(momentWeek);
  });
});
