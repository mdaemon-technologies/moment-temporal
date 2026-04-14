/**
 * Factory — assembles the moment-shaped callable used when Temporal is
 * available. This is the single place that wires parse/timezone/locale
 * into one callable surface. Everything else lives in isolated modules
 * so each layer's Temporal-first semantics can be audited on its own.
 */
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
export declare function createMomentTemporalFactory(): MomentLike;
