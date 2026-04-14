/**
 * Unit normalization — moment accepts a loose vocabulary
 * ('y' | 'year' | 'years' | 'Y') for every unit-taking method. Temporal
 * uses a strict canonical set. This module is the single chokepoint that
 * maps moment's aliases to Temporal's canonical plural form, and to the
 * field name used when reading/writing on a ZonedDateTime.
 */

export type MomentUnit =
  | 'year'
  | 'month'
  | 'week'
  | 'isoWeek'
  | 'day'
  | 'hour'
  | 'minute'
  | 'second'
  | 'millisecond';

export type TemporalDurationUnit =
  | 'years'
  | 'months'
  | 'weeks'
  | 'days'
  | 'hours'
  | 'minutes'
  | 'seconds'
  | 'milliseconds';

const UNIT_ALIASES: Record<string, MomentUnit> = {
  // Year
  y: 'year', year: 'year', years: 'year', Y: 'year',
  // Month
  M: 'month', month: 'month', months: 'month',
  // Week (ISO 8601 — Monday start)
  w: 'week', week: 'week', weeks: 'week',
  W: 'isoWeek', isoWeek: 'isoWeek', isoWeeks: 'isoWeek',
  // Day
  d: 'day', day: 'day', days: 'day', D: 'day', date: 'day', dates: 'day',
  // Hour
  h: 'hour', hour: 'hour', hours: 'hour',
  // Minute
  m: 'minute', minute: 'minute', minutes: 'minute',
  // Second
  s: 'second', second: 'second', seconds: 'second',
  // Millisecond
  ms: 'millisecond', millisecond: 'millisecond', milliseconds: 'millisecond',
};

/**
 * Resolve a moment-style unit alias to its canonical form. Returns
 * undefined when the alias is unrecognized — callers decide whether to
 * throw or treat as no-op (moment itself silently ignores bad units).
 */
export function normalizeUnit(input: string | undefined): MomentUnit | undefined {
  if (!input) return undefined;
  return UNIT_ALIASES[input];
}

/**
 * Map a canonical unit to the plural form Temporal.Duration expects.
 * Note: isoWeek maps to 'weeks' because Temporal treats all weeks as ISO.
 */
export function toDurationUnit(unit: MomentUnit): TemporalDurationUnit {
  switch (unit) {
    case 'year': return 'years';
    case 'month': return 'months';
    case 'week':
    case 'isoWeek': return 'weeks';
    case 'day': return 'days';
    case 'hour': return 'hours';
    case 'minute': return 'minutes';
    case 'second': return 'seconds';
    case 'millisecond': return 'milliseconds';
  }
}
