/**
 * MomentDuration — thin wrapper over Temporal.Duration that exposes
 * moment's duration API: .asX() conversions, .humanize(), .toISOString().
 *
 * Temporal.Duration is authoritative for arithmetic. We only add the
 * moment-shaped surface and the English humanize thresholds.
 */
type TemporalDuration = any;
export declare class MomentDuration {
    #private;
    constructor(input: TemporalDuration | Record<string, number> | number, localeOrUnit?: string);
    asYears(): number;
    asMonths(): number;
    asWeeks(): number;
    asDays(): number;
    asHours(): number;
    asMinutes(): number;
    asSeconds(): number;
    asMilliseconds(): number;
    years(): number;
    months(): number;
    weeks(): number;
    days(): number;
    hours(): number;
    minutes(): number;
    seconds(): number;
    milliseconds(): number;
    toISOString(): string;
    /**
     * Humanize the duration to an English phrase like "a few seconds" or
     * "2 days". Thresholds match moment's documented defaults:
     *   s <= 44 → "a few seconds"
     *   45..89  → "a minute"
     *   90..44m → "X minutes"
     *   45m..89m → "an hour"
     *   ...
     */
    humanize(withSuffix?: boolean): string;
}
export {};
