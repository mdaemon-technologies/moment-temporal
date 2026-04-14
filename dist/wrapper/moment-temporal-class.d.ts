/**
 * MomentTemporal — the mutable, chainable wrapper around Temporal.ZonedDateTime.
 *
 * Moment's API is mutable: `m.add(1, 'day')` mutates `m` and returns `this`.
 * Temporal is immutable. We bridge the two by holding a single internal
 * ZonedDateTime field that gets reassigned on every mutating operation,
 * while still returning `this` to preserve moment's chaining contract.
 *
 * Semantics follow Temporal wherever moment and Temporal disagree:
 *   - ISO 8601 weeks (Monday-start, week 1 contains the first Thursday)
 *   - Temporal disambiguation rules on DST boundaries
 *   - Strict parsing (Temporal refuses → isValid() === false)
 *   - Intl-based localized format output (not moment's locale files)
 *   - `diff` on variable-length units uses Temporal.Duration.total with relativeTo
 *
 * These differences are intentional and locked in by the divergence test suite.
 */
import { type MomentUnit } from './units';
type ZonedDateTime = any;
/** Options accepted by startOf/endOf comparisons and many setters. */
export type UnitInput = string;
/** Inclusivity brackets accepted by isBetween. '()' exclusive, '[]' inclusive. */
export type Inclusivity = '()' | '[]' | '(]' | '[)';
export declare class MomentTemporal {
    #private;
    constructor(zdt: ZonedDateTime, opts?: {
        locale?: string;
        isUTC?: boolean;
        invalid?: boolean;
    });
    /** Produce an invalid instance. Matches moment's "invalid moment" contract. */
    static invalid(): MomentTemporal;
    isValid(): boolean;
    clone(): MomentTemporal;
    toDate(): Date;
    valueOf(): number;
    unix(): number;
    toISOString(keepOffset?: boolean): string;
    toJSON(): string;
    toString(): string;
    toArray(): [number, number, number, number, number, number, number];
    toObject(): {
        years: number;
        months: number;
        date: number;
        hours: number;
        minutes: number;
        seconds: number;
        milliseconds: number;
    };
    year(): number;
    year(v: number): MomentTemporal;
    month(): number;
    month(v: number): MomentTemporal;
    date(): number;
    date(v: number): MomentTemporal;
    day(): number;
    day(v: number): MomentTemporal;
    hour(): number;
    hour(v: number): MomentTemporal;
    minute(): number;
    minute(v: number): MomentTemporal;
    second(): number;
    second(v: number): MomentTemporal;
    millisecond(): number;
    millisecond(v: number): MomentTemporal;
    /** Generic getter — moment's .get('year'), .get('month'), etc. */
    get(unitInput: UnitInput): number;
    /** Generic setter — moment's .set('year', 2020) etc. Chainable. */
    set(unitInput: UnitInput, value: number): MomentTemporal;
    daysInMonth(): number;
    add(amount: number | Record<string, number>, unitInput?: UnitInput): MomentTemporal;
    subtract(amount: number | Record<string, number>, unitInput?: UnitInput): MomentTemporal;
    /**
     * Truncate to the start of the given unit. Temporal-first semantics:
     * weeks are ISO (Monday-start). That's a deliberate divergence from
     * moment's locale-dependent week starts.
     */
    startOf(unitInput: UnitInput): MomentTemporal;
    /**
     * Truncate to the end of the given unit. Implemented as
     * startOf(unit) + 1 unit − 1 millisecond, matching moment's definition.
     */
    endOf(unitInput: UnitInput): MomentTemporal;
    utc(): MomentTemporal;
    local(): MomentTemporal;
    tz(zone: string): MomentTemporal;
    zoneName(): string;
    utcOffset(): number;
    isUTC(): boolean;
    isDST(): boolean;
    isLeapYear(): boolean;
    private _compareTo;
    isBefore(other: MomentTemporal, unitInput?: UnitInput): boolean;
    isAfter(other: MomentTemporal, unitInput?: UnitInput): boolean;
    isSame(other: MomentTemporal, unitInput?: UnitInput): boolean;
    isSameOrBefore(other: MomentTemporal, unitInput?: UnitInput): boolean;
    isSameOrAfter(other: MomentTemporal, unitInput?: UnitInput): boolean;
    isBetween(from: MomentTemporal, to: MomentTemporal, unitInput?: UnitInput, inclusivity?: Inclusivity): boolean;
    diff(other: MomentTemporal, unitInput?: UnitInput, asFloat?: boolean): number;
    format(formatString?: string): string;
    /** Locale getter/setter — mutates when called with an argument. */
    locale(): string;
    locale(locale: string): MomentTemporal;
    fromNow(withoutSuffix?: boolean): string;
    from(other: MomentTemporal, withoutSuffix?: boolean): string;
    toNow(withoutSuffix?: boolean): string;
    to(other: MomentTemporal, withoutSuffix?: boolean): string;
    /** Calendar-time display: "Today at 3:00 PM", "Yesterday at 3:00 PM", etc. */
    calendar(reference?: MomentTemporal): string;
    /** Current moment — used by fromNow / toNow / calendar. */
    static now(): MomentTemporal;
    /** @internal */
    _getZdt(): ZonedDateTime;
    /** @internal */
    _setZdt(zdt: ZonedDateTime): void;
    /** @internal */
    _getLocale(): string;
    /** @internal */
    _markInvalid(): void;
    /** @internal — consumed by the parse module to build instances. */
    static _wrap(zdt: ZonedDateTime, opts?: {
        locale?: string;
        isUTC?: boolean;
    }): MomentTemporal;
}
export type { MomentUnit };
