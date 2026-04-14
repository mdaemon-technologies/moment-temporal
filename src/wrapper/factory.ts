/**
 * Factory — assembles the moment-shaped callable used when Temporal is
 * available. This is the single place that wires parse/timezone/locale
 * into one callable surface. Everything else lives in isolated modules
 * so each layer's Temporal-first semantics can be audited on its own.
 */

import { MomentTemporal } from './moment-temporal-class';
import { MomentDuration } from './duration';
import {
  parseInput,
  parseUnix,
  parseUtc,
  parseTz,
} from './parse';
import { createTzStatics } from './timezone';
import { getLocale, setLocale } from './locale';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MomentLike = any;

/**
 * Returns a callable that mimics the `moment` default export. Includes:
 *   - moment(input) / moment(input, format)
 *   - moment.utc, moment.unix
 *   - moment.duration
 *   - moment.isMoment, moment.isDate
 *   - moment.tz.* (guess/names/zone/setDefault/add)
 *   - moment.locale (get/set)
 *   - moment.ISO_8601 sentinel
 *   - moment.version
 */
export function createMomentTemporalFactory(): MomentLike {
  const fn = function (...args: unknown[]): MomentTemporal {
    return parseInput(args);
  } as MomentLike;

  // Construction statics ---------------------------------------------------
  fn.utc = (...args: unknown[]): MomentTemporal => parseUtc(args);
  fn.unix = (seconds: number): MomentTemporal => parseUnix(seconds);
  fn.duration = (input: unknown, unit?: string): MomentDuration =>
    new MomentDuration(input as never, unit);

  // Type guards ------------------------------------------------------------
  fn.isMoment = (value: unknown): boolean => value instanceof MomentTemporal;
  fn.isDate = (value: unknown): boolean => value instanceof Date;
  fn.isDuration = (value: unknown): boolean => value instanceof MomentDuration;

  // Sentinels / metadata ---------------------------------------------------
  fn.ISO_8601 = 'ISO_8601';
  fn.version = '0.1.0-temporal';

  // Locale -----------------------------------------------------------------
  fn.locale = (locale?: string): string => setLocale(locale) || getLocale();
  fn.locales = (): string[] => {
    // Intl.supportedValuesOf('locale') not universally available; fall back to current.
    const intl = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
    if (typeof intl.supportedValuesOf === 'function') {
      try { return intl.supportedValuesOf('locale' as never); } catch { /* ignore */ }
    }
    return [getLocale()];
  };

  // Timezone statics -------------------------------------------------------
  // moment.tz() is itself callable AND has methods attached — we build the
  // callable first, then layer the statics onto it via createTzStatics.
  const tzCallable = (...args: unknown[]): MomentTemporal => parseTz(args);
  fn.tz = createTzStatics(tzCallable as (input: unknown, zone: string) => unknown);

  return fn;
}
