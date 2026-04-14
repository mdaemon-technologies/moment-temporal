/**
 * Unit normalization — moment accepts a loose vocabulary
 * ('y' | 'year' | 'years' | 'Y') for every unit-taking method. Temporal
 * uses a strict canonical set. This module is the single chokepoint that
 * maps moment's aliases to Temporal's canonical plural form, and to the
 * field name used when reading/writing on a ZonedDateTime.
 */
export type MomentUnit = 'year' | 'month' | 'week' | 'isoWeek' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';
export type TemporalDurationUnit = 'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds';
/**
 * Resolve a moment-style unit alias to its canonical form. Returns
 * undefined when the alias is unrecognized — callers decide whether to
 * throw or treat as no-op (moment itself silently ignores bad units).
 */
export declare function normalizeUnit(input: string | undefined): MomentUnit | undefined;
/**
 * Map a canonical unit to the plural form Temporal.Duration expects.
 * Note: isoWeek maps to 'weeks' because Temporal treats all weeks as ISO.
 */
export declare function toDurationUnit(unit: MomentUnit): TemporalDurationUnit;
