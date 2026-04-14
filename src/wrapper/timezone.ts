/**
 * Timezone statics — moment.tz.* surface.
 *
 * All state (default zone, guess result) goes through Temporal APIs and
 * Intl.supportedValuesOf. Custom zones via moment.tz.add() are not
 * supported — Temporal only reads the host's IANA database.
 */

import { getTemporal } from '../detect';
import { setDefaultTimezone, getDefaultTimezone } from './parse';

let addWarningShown = false;

export interface TzStatics {
  (input?: unknown, zone?: string): unknown;
  guess(): string;
  names(): string[];
  zone(name: string): TzZoneInfo | null;
  setDefault(name: string | undefined): void;
  add(..._args: unknown[]): void;
}

export interface TzZoneInfo {
  name: string;
  abbr(timestamp: number): string;
}

/**
 * Build the tz.* namespace object. Consumers mutate this via setDefault;
 * reads go directly to Temporal.Now / Intl where possible.
 */
export function createTzStatics(callable: (input: unknown, zone: string) => unknown): TzStatics {
  const tz = callable as unknown as TzStatics;

  tz.guess = (): string => {
    const T = getTemporal();
    return T.Now.timeZoneId();
  };

  tz.names = (): string[] => {
    // Intl.supportedValuesOf is the portable way to enumerate IANA zones.
    // Node 18+ and modern browsers support it; if it's missing we return
    // a single-element fallback so callers can still probe with guess().
    const intl = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
    if (typeof intl.supportedValuesOf === 'function') {
      return intl.supportedValuesOf('timeZone');
    }
    return [tz.guess()];
  };

  tz.zone = (name: string): TzZoneInfo | null => {
    // Verify the zone exists by round-tripping through Temporal.
    const T = getTemporal();
    try {
      T.ZonedDateTime.from({ year: 2000, month: 1, day: 1, timeZone: name });
    } catch {
      return null;
    }
    return {
      name,
      abbr(timestamp: number): string {
        const d = new Date(timestamp);
        const dtf = new Intl.DateTimeFormat('en', { timeZone: name, timeZoneName: 'short' });
        const parts = dtf.formatToParts(d);
        return parts.find(p => p.type === 'timeZoneName')?.value ?? '';
      },
    };
  };

  tz.setDefault = (name: string | undefined): void => {
    setDefaultTimezone(name);
  };

  tz.add = (): void => {
    // Deliberately a no-op. Temporal reads IANA zones from the host's
    // CLDR database and cannot be extended at runtime. We warn once so
    // upgrading consumers notice the change, then silently accept further
    // calls to avoid noisy logs.
    if (!addWarningShown) {
      addWarningShown = true;
      // eslint-disable-next-line no-console
      console.warn(
        '[@mdaemon/moment-temporal] moment.tz.add() is a no-op. ' +
        'Temporal reads IANA zones from the host; custom zones are not supported.',
      );
    }
  };

  return tz;
}

export { getDefaultTimezone };
