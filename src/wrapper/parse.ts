/**
 * Parse — dispatches moment-style inputs to a Temporal.ZonedDateTime.
 *
 * Temporal-first semantics: anything Temporal refuses becomes an invalid
 * MomentTemporal (matching moment's .isValid() === false contract). We do
 * NOT attempt moment's loose fallback parser for human-readable strings
 * that aren't ISO 8601 — strict parsing is a deliberate divergence.
 *
 * Supported input shapes (mirrors moment):
 *   - undefined/no-args       → "now"
 *   - number                  → epoch milliseconds
 *   - Date                    → from .getTime()
 *   - string                  → ISO 8601 via Temporal.ZonedDateTime.from
 *                               or PlainDateTime.from for naive strings
 *   - number[]                → [Y, M, D, h, m, s, ms]  (month is 0-indexed)
 *   - plain object            → { year, month, day, hour, minute, second, ms }
 *   - MomentTemporal          → clone
 */

import { getTemporal } from '../detect';
import { MomentTemporal } from './moment-temporal-class';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ZonedDateTime = any;

let moduleDefaultTimezone: string | undefined;

/** Used by moment.tz.setDefault — module-wide fallback zone. */
export function setDefaultTimezone(tz: string | undefined): void {
  moduleDefaultTimezone = tz;
}

export function getDefaultTimezone(): string {
  const T = getTemporal();
  return moduleDefaultTimezone ?? T.Now.timeZoneId();
}

/**
 * Entry point used by the factory. Accepts the same varargs moment's
 * default export accepts.
 */
export function parseInput(args: unknown[]): MomentTemporal {
  const T = getTemporal();
  const zone = getDefaultTimezone();

  // moment() — now
  if (args.length === 0 || args[0] === undefined) {
    return MomentTemporal._wrap(T.Now.zonedDateTimeISO(zone));
  }

  const first = args[0];

  // moment(MomentTemporal) — clone path
  if (first instanceof MomentTemporal) {
    return first.clone();
  }

  // moment(Date)
  if (first instanceof Date) {
    if (isNaN(first.getTime())) return MomentTemporal.invalid();
    const instant = T.Instant.fromEpochMilliseconds(first.getTime());
    return MomentTemporal._wrap(instant.toZonedDateTimeISO(zone));
  }

  // moment(number) — epoch milliseconds
  if (typeof first === 'number') {
    if (!Number.isFinite(first)) return MomentTemporal.invalid();
    try {
      const instant = T.Instant.fromEpochMilliseconds(first);
      return MomentTemporal._wrap(instant.toZonedDateTimeISO(zone));
    } catch {
      return MomentTemporal.invalid();
    }
  }

  // moment([Y, M, D, h, m, s, ms])
  if (Array.isArray(first)) {
    try {
      const [y = 0, mo = 0, d = 1, h = 0, mi = 0, s = 0, ms = 0] = first as number[];
      const zdt = T.ZonedDateTime.from({
        year: y, month: mo + 1, day: d,
        hour: h, minute: mi, second: s, millisecond: ms,
        timeZone: zone,
      });
      return MomentTemporal._wrap(zdt);
    } catch {
      return MomentTemporal.invalid();
    }
  }

  // moment(string) or moment(string, formatString) — formatString currently ignored
  // beyond recognizing that Temporal-strict parsing should be used.
  if (typeof first === 'string') {
    return parseString(first, zone);
  }

  // moment({ year, month, day, ... })
  if (typeof first === 'object' && first !== null) {
    try {
      const o = first as Record<string, number>;
      const zdt = T.ZonedDateTime.from({
        year: o.year ?? o.years ?? 1970,
        month: (o.month ?? o.months ?? 0) + 1, // moment is 0-indexed
        day: o.day ?? o.days ?? o.date ?? 1,
        hour: o.hour ?? o.hours ?? 0,
        minute: o.minute ?? o.minutes ?? 0,
        second: o.second ?? o.seconds ?? 0,
        millisecond: o.millisecond ?? o.milliseconds ?? 0,
        timeZone: zone,
      });
      return MomentTemporal._wrap(zdt);
    } catch {
      return MomentTemporal.invalid();
    }
  }

  return MomentTemporal.invalid();
}

/**
 * Matches a trailing ISO 8601 numeric offset (Z, ±HH, ±HHMM, ±HH:MM) at
 * the end of a timestamp string. Captured so we can reuse the literal
 * offset as a synthetic timezone when no IANA bracket is present —
 * otherwise Temporal discards the offset and we lose the wall-clock
 * semantics the caller intended.
 */
const OFFSET_SUFFIX_RE = /(Z|[+-]\d\d(?::?\d\d)?)$/;

/**
 * String parsing with Temporal. Strategy:
 *   1. If the string has a bracketed IANA annotation, ZonedDateTime.from
 *      handles it directly.
 *   2. If the string has a trailing numeric offset (±HH:MM or Z), reuse
 *      that offset as a synthetic timeZone so the wall-clock representation
 *      survives. This is what moment does by default — preserve the input's
 *      offset rather than reinterpreting in local time.
 *   3. Fall back to PlainDateTime.from + the default zone for naive strings.
 *   4. Fall back to PlainDate.from for date-only strings.
 *   5. Give up → invalid.
 *
 * Temporal's parser is stricter than moment's. We do not try to rescue
 * malformed input with a custom fallback — that's the divergence.
 */
function parseString(input: string, zone: string): MomentTemporal {
  const T = getTemporal();
  const trimmed = input.trim();
  if (!trimmed) return MomentTemporal.invalid();

  // 1. ZonedDateTime (with bracketed IANA annotation)
  if (trimmed.includes('[')) {
    try {
      return MomentTemporal._wrap(T.ZonedDateTime.from(trimmed));
    } catch { /* fall through */ }
  }

  // 2. Offset-bearing string without IANA annotation — reuse the offset.
  const offsetMatch = trimmed.match(OFFSET_SUFFIX_RE);
  if (offsetMatch) {
    const rawOffset = offsetMatch[1];
    // Normalize '+0530' → '+05:30'; pass 'Z' through unchanged because
    // Temporal accepts both Z and +00:00 as a timeZone string.
    let tzString: string;
    if (rawOffset === 'Z') {
      tzString = 'UTC';
    } else if (/^[+-]\d\d$/.test(rawOffset)) {
      tzString = `${rawOffset}:00`;
    } else if (/^[+-]\d{4}$/.test(rawOffset)) {
      tzString = `${rawOffset.slice(0, 3)}:${rawOffset.slice(3)}`;
    } else {
      tzString = rawOffset;
    }
    const wallClockPart = trimmed.slice(0, -rawOffset.length);
    try {
      const pdt = T.PlainDateTime.from(wallClockPart);
      const zdt = pdt.toZonedDateTime(tzString);
      return MomentTemporal._wrap(zdt);
    } catch { /* fall through */ }
  }

  // 3. PlainDateTime (naive wall-clock string)
  try {
    const pdt = T.PlainDateTime.from(trimmed);
    return MomentTemporal._wrap(pdt.toZonedDateTime(zone));
  } catch { /* fall through */ }

  // 4. Instant (RFC 9557 / ISO 8601 with Z)
  try {
    const instant = T.Instant.from(trimmed);
    return MomentTemporal._wrap(instant.toZonedDateTimeISO(zone));
  } catch { /* fall through */ }

  // 5. PlainDate (date-only)
  try {
    const pd = T.PlainDate.from(trimmed);
    const pdt = pd.toPlainDateTime(T.PlainTime.from('00:00:00'));
    return MomentTemporal._wrap(pdt.toZonedDateTime(zone));
  } catch { /* fall through */ }

  return MomentTemporal.invalid();
}

/** moment.unix(sec) — seconds since epoch. */
export function parseUnix(seconds: number): MomentTemporal {
  if (!Number.isFinite(seconds)) return MomentTemporal.invalid();
  const T = getTemporal();
  const instant = T.Instant.fromEpochMilliseconds(seconds * 1000);
  return MomentTemporal._wrap(instant.toZonedDateTimeISO(getDefaultTimezone()));
}

/** moment.utc(...) — same inputs as moment(), but force UTC timezone. */
export function parseUtc(args: unknown[]): MomentTemporal {
  const saved = moduleDefaultTimezone;
  moduleDefaultTimezone = 'UTC';
  try {
    const m = parseInput(args);
    if (m.isValid()) m.utc();
    return m;
  } finally {
    moduleDefaultTimezone = saved;
  }
}

/** moment.tz(input, zone) — parse then convert to the given zone. */
export function parseTz(args: unknown[]): MomentTemporal {
  if (args.length === 0) return parseInput([]);
  const zone = args[args.length - 1];
  if (typeof zone !== 'string') return parseInput(args);
  const m = parseInput(args.slice(0, -1));
  if (m.isValid()) m.tz(zone);
  return m;
}
