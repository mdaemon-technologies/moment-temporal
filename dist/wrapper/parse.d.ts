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
import { MomentTemporal } from './moment-temporal-class';
/** Used by moment.tz.setDefault — module-wide fallback zone. */
export declare function setDefaultTimezone(tz: string | undefined): void;
export declare function getDefaultTimezone(): string;
/**
 * Entry point used by the factory. Accepts the same varargs moment's
 * default export accepts.
 */
export declare function parseInput(args: unknown[]): MomentTemporal;
/** moment.unix(sec) — seconds since epoch. */
export declare function parseUnix(seconds: number): MomentTemporal;
/** moment.utc(...) — same inputs as moment(), but force UTC timezone. */
export declare function parseUtc(args: unknown[]): MomentTemporal;
/** moment.tz(input, zone) — parse then convert to the given zone. */
export declare function parseTz(args: unknown[]): MomentTemporal;
