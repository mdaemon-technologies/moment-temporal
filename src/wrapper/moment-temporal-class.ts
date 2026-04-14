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

import { getTemporal } from '../detect';
import {
  normalizeUnit,
  toDurationUnit,
  type MomentUnit,
} from './units';
import { formatWithTokens } from './format-tokens';
import { MomentDuration } from './duration';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ZonedDateTime = any;

/** Options accepted by startOf/endOf comparisons and many setters. */
export type UnitInput = string;

/** Inclusivity brackets accepted by isBetween. '()' exclusive, '[]' inclusive. */
export type Inclusivity = '()' | '[]' | '(]' | '[)';

export class MomentTemporal {
  /** Internal state — reassigned by every mutating method. */
  #zdt: ZonedDateTime;
  #locale: string = 'en';
  #isUTC: boolean = false;
  #invalid: boolean = false;

  constructor(
    zdt: ZonedDateTime,
    opts?: { locale?: string; isUTC?: boolean; invalid?: boolean },
  ) {
    this.#zdt = zdt;
    if (opts?.locale) this.#locale = opts.locale;
    if (opts?.isUTC) this.#isUTC = opts.isUTC;
    if (opts?.invalid) this.#invalid = opts.invalid;
  }

  /** Produce an invalid instance. Matches moment's "invalid moment" contract. */
  static invalid(): MomentTemporal {
    const T = getTemporal();
    // The field is never read because isValid() short-circuits, but we need
    // *something* assigned so the class invariant holds.
    return new MomentTemporal(T.Now.zonedDateTimeISO(), { invalid: true });
  }

  // --- Validity -----------------------------------------------------------

  isValid(): boolean {
    return !this.#invalid;
  }

  // --- Cloning ------------------------------------------------------------

  clone(): MomentTemporal {
    return new MomentTemporal(this.#zdt, {
      locale: this.#locale,
      isUTC: this.#isUTC,
      invalid: this.#invalid,
    });
  }

  // --- Primitive coercions -----------------------------------------------

  toDate(): Date {
    return new Date(Number(this.#zdt.epochMilliseconds));
  }

  valueOf(): number {
    return Number(this.#zdt.epochMilliseconds);
  }

  unix(): number {
    return Math.floor(Number(this.#zdt.epochMilliseconds) / 1000);
  }

  toISOString(keepOffset = false): string {
    if (!this.#invalid && keepOffset) {
      // Temporal's toString on a ZonedDateTime emits the full bracketed form.
      // For moment parity we strip the [IANA] annotation and keep the offset.
      const s = this.#zdt.toString({ timeZoneName: 'never' });
      return s;
    }
    return this.toDate().toISOString();
  }

  toJSON(): string {
    return this.toISOString();
  }

  toString(): string {
    return this.toDate().toString();
  }

  toArray(): [number, number, number, number, number, number, number] {
    const z = this.#zdt;
    return [z.year, z.month - 1, z.day, z.hour, z.minute, z.second, z.millisecond];
  }

  toObject(): {
    years: number;
    months: number;
    date: number;
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
  } {
    const z = this.#zdt;
    return {
      years: z.year,
      months: z.month - 1,
      date: z.day,
      hours: z.hour,
      minutes: z.minute,
      seconds: z.second,
      milliseconds: z.millisecond,
    };
  }

  // --- Getters / setters --------------------------------------------------
  //
  // Moment's getters double as setters: calling `.hour()` returns the hour,
  // `.hour(5)` mutates and returns `this`. Replicated here via overloads.

  year(): number;
  year(v: number): MomentTemporal;
  year(v?: number): number | MomentTemporal {
    if (v === undefined) return this.#zdt.year;
    this.#zdt = this.#zdt.with({ year: v });
    return this;
  }

  // moment's month is 0-indexed; Temporal's is 1-indexed.
  month(): number;
  month(v: number): MomentTemporal;
  month(v?: number): number | MomentTemporal {
    if (v === undefined) return this.#zdt.month - 1;
    this.#zdt = this.#zdt.with({ month: v + 1 });
    return this;
  }

  date(): number;
  date(v: number): MomentTemporal;
  date(v?: number): number | MomentTemporal {
    if (v === undefined) return this.#zdt.day;
    this.#zdt = this.#zdt.with({ day: v });
    return this;
  }

  // day() in moment returns day-of-week (0=Sunday). Temporal ISO day-of-week
  // is 1=Monday..7=Sunday — we convert so moment callers see the same 0-6.
  day(): number;
  day(v: number): MomentTemporal;
  day(v?: number): number | MomentTemporal {
    const isoDow = this.#zdt.dayOfWeek; // 1..7, Mon..Sun
    const momentDow = isoDow % 7;       // 0..6, Sun..Sat
    if (v === undefined) return momentDow;
    // Target day-of-week: move forward/back the minimum days to land on it.
    const delta = v - momentDow;
    this.#zdt = this.#zdt.add({ days: delta });
    return this;
  }

  hour(): number;
  hour(v: number): MomentTemporal;
  hour(v?: number): number | MomentTemporal {
    if (v === undefined) return this.#zdt.hour;
    this.#zdt = this.#zdt.with({ hour: v });
    return this;
  }

  minute(): number;
  minute(v: number): MomentTemporal;
  minute(v?: number): number | MomentTemporal {
    if (v === undefined) return this.#zdt.minute;
    this.#zdt = this.#zdt.with({ minute: v });
    return this;
  }

  second(): number;
  second(v: number): MomentTemporal;
  second(v?: number): number | MomentTemporal {
    if (v === undefined) return this.#zdt.second;
    this.#zdt = this.#zdt.with({ second: v });
    return this;
  }

  millisecond(): number;
  millisecond(v: number): MomentTemporal;
  millisecond(v?: number): number | MomentTemporal {
    if (v === undefined) return this.#zdt.millisecond;
    this.#zdt = this.#zdt.with({ millisecond: v });
    return this;
  }

  /** Generic getter — moment's .get('year'), .get('month'), etc. */
  get(unitInput: UnitInput): number {
    const unit = normalizeUnit(unitInput);
    switch (unit) {
      case 'year': return this.#zdt.year;
      case 'month': return this.#zdt.month - 1;
      case 'day': return this.#zdt.day;
      case 'hour': return this.#zdt.hour;
      case 'minute': return this.#zdt.minute;
      case 'second': return this.#zdt.second;
      case 'millisecond': return this.#zdt.millisecond;
      case 'week': return this.#zdt.weekOfYear ?? 0;
      case 'isoWeek': return this.#zdt.weekOfYear ?? 0;
      default: return NaN;
    }
  }

  /** Generic setter — moment's .set('year', 2020) etc. Chainable. */
  set(unitInput: UnitInput, value: number): MomentTemporal {
    const unit = normalizeUnit(unitInput);
    switch (unit) {
      case 'year':        this.#zdt = this.#zdt.with({ year: value }); break;
      case 'month':       this.#zdt = this.#zdt.with({ month: value + 1 }); break;
      case 'day':         this.#zdt = this.#zdt.with({ day: value }); break;
      case 'hour':        this.#zdt = this.#zdt.with({ hour: value }); break;
      case 'minute':      this.#zdt = this.#zdt.with({ minute: value }); break;
      case 'second':      this.#zdt = this.#zdt.with({ second: value }); break;
      case 'millisecond': this.#zdt = this.#zdt.with({ millisecond: value }); break;
      // 'week' / 'isoWeek' intentionally not supported for set — moment
      // allows it but the semantics are ambiguous; we follow Temporal's
      // stricter stance. Silently ignore like moment does for bad units.
    }
    return this;
  }

  daysInMonth(): number {
    return this.#zdt.daysInMonth;
  }

  // --- Manipulate ---------------------------------------------------------

  add(amount: number | Record<string, number>, unitInput?: UnitInput): MomentTemporal {
    if (typeof amount === 'object') {
      this.#zdt = this.#zdt.add(amount);
      return this;
    }
    const unit = normalizeUnit(unitInput);
    if (unit === undefined) return this;
    this.#zdt = this.#zdt.add({ [toDurationUnit(unit)]: amount });
    return this;
  }

  subtract(amount: number | Record<string, number>, unitInput?: UnitInput): MomentTemporal {
    if (typeof amount === 'object') {
      this.#zdt = this.#zdt.subtract(amount);
      return this;
    }
    const unit = normalizeUnit(unitInput);
    if (unit === undefined) return this;
    this.#zdt = this.#zdt.subtract({ [toDurationUnit(unit)]: amount });
    return this;
  }

  /**
   * Truncate to the start of the given unit. Temporal-first semantics:
   * weeks are ISO (Monday-start). That's a deliberate divergence from
   * moment's locale-dependent week starts.
   */
  startOf(unitInput: UnitInput): MomentTemporal {
    const unit = normalizeUnit(unitInput);
    if (unit === undefined) return this;

    const z = this.#zdt;
    switch (unit) {
      case 'year':
        this.#zdt = z.with({ month: 1, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });
        break;
      case 'month':
        this.#zdt = z.with({ day: 1, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });
        break;
      case 'week':
      case 'isoWeek': {
        // ISO week starts Monday (dayOfWeek 1). Subtract (dow-1) days.
        const daysBack = z.dayOfWeek - 1;
        this.#zdt = z.subtract({ days: daysBack }).with({ hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });
        break;
      }
      case 'day':
        this.#zdt = z.with({ hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });
        break;
      case 'hour':
        this.#zdt = z.with({ minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });
        break;
      case 'minute':
        this.#zdt = z.with({ second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });
        break;
      case 'second':
        this.#zdt = z.with({ millisecond: 0, microsecond: 0, nanosecond: 0 });
        break;
      case 'millisecond':
        this.#zdt = z.with({ microsecond: 0, nanosecond: 0 });
        break;
    }
    return this;
  }

  /**
   * Truncate to the end of the given unit. Implemented as
   * startOf(unit) + 1 unit − 1 millisecond, matching moment's definition.
   */
  endOf(unitInput: UnitInput): MomentTemporal {
    const unit = normalizeUnit(unitInput);
    if (unit === undefined) return this;
    this.startOf(unitInput);
    this.#zdt = this.#zdt
      .add({ [toDurationUnit(unit)]: 1 })
      .subtract({ milliseconds: 1 });
    return this;
  }

  // --- UTC / local / timezone --------------------------------------------

  utc(): MomentTemporal {
    this.#zdt = this.#zdt.withTimeZone('UTC');
    this.#isUTC = true;
    return this;
  }

  local(): MomentTemporal {
    const T = getTemporal();
    this.#zdt = this.#zdt.withTimeZone(T.Now.timeZoneId());
    this.#isUTC = false;
    return this;
  }

  tz(zone: string): MomentTemporal {
    this.#zdt = this.#zdt.withTimeZone(zone);
    this.#isUTC = false;
    return this;
  }

  zoneName(): string {
    // Derive the abbreviation via Intl. Temporal does not expose abbreviations directly.
    const d = this.toDate();
    const dtf = new Intl.DateTimeFormat(this.#locale, {
      timeZone: this.#zdt.timeZoneId,
      timeZoneName: 'short',
    });
    const parts = dtf.formatToParts(d);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    return tzPart?.value ?? '';
  }

  utcOffset(): number {
    // offsetNanoseconds is a plain Number per Temporal spec.
    return Math.trunc(this.#zdt.offsetNanoseconds / 60_000_000_000);
  }

  isUTC(): boolean {
    return this.#isUTC;
  }

  isDST(): boolean {
    // True when this instant's offset differs from the winter offset for
    // the same zone. Approximated by comparing against January 15 of the
    // same year at the same local time.
    const T = getTemporal();
    const winter = T.ZonedDateTime.from({
      year: this.#zdt.year,
      month: 1,
      day: 15,
      hour: 12,
      timeZone: this.#zdt.timeZoneId,
    });
    return this.#zdt.offsetNanoseconds !== winter.offsetNanoseconds;
  }

  isLeapYear(): boolean {
    return this.#zdt.inLeapYear;
  }

  // --- Comparison / query ------------------------------------------------

  private _compareTo(other: MomentTemporal): number {
    const T = getTemporal();
    return T.ZonedDateTime.compare(this.#zdt, other.#zdt);
  }

  isBefore(other: MomentTemporal, unitInput?: UnitInput): boolean {
    const a = unitInput ? this.clone().startOf(unitInput) : this;
    const b = unitInput ? other.clone().startOf(unitInput) : other;
    return a._compareTo(b) < 0;
  }

  isAfter(other: MomentTemporal, unitInput?: UnitInput): boolean {
    const a = unitInput ? this.clone().startOf(unitInput) : this;
    const b = unitInput ? other.clone().startOf(unitInput) : other;
    return a._compareTo(b) > 0;
  }

  isSame(other: MomentTemporal, unitInput?: UnitInput): boolean {
    const a = unitInput ? this.clone().startOf(unitInput) : this;
    const b = unitInput ? other.clone().startOf(unitInput) : other;
    return a._compareTo(b) === 0;
  }

  isSameOrBefore(other: MomentTemporal, unitInput?: UnitInput): boolean {
    return this.isSame(other, unitInput) || this.isBefore(other, unitInput);
  }

  isSameOrAfter(other: MomentTemporal, unitInput?: UnitInput): boolean {
    return this.isSame(other, unitInput) || this.isAfter(other, unitInput);
  }

  isBetween(
    from: MomentTemporal,
    to: MomentTemporal,
    unitInput?: UnitInput,
    inclusivity: Inclusivity = '()',
  ): boolean {
    const leftInclusive = inclusivity[0] === '[';
    const rightInclusive = inclusivity[1] === ']';
    const leftOk = leftInclusive
      ? this.isSameOrAfter(from, unitInput)
      : this.isAfter(from, unitInput);
    const rightOk = rightInclusive
      ? this.isSameOrBefore(to, unitInput)
      : this.isBefore(to, unitInput);
    return leftOk && rightOk;
  }

  diff(other: MomentTemporal, unitInput?: UnitInput, asFloat = false): number {
    const unit = normalizeUnit(unitInput) ?? 'millisecond';
    const duration = this.#zdt.since(other.#zdt, {
      largestUnit: toDurationUnit(unit),
      smallestUnit: 'nanoseconds',
    });
    const total = duration.total({
      unit: toDurationUnit(unit),
      relativeTo: other.#zdt,
    });
    return asFloat ? total : Math.trunc(total);
  }

  // --- Display ------------------------------------------------------------

  format(formatString?: string): string {
    if (this.#invalid) return 'Invalid date';
    return formatWithTokens(this.#zdt, formatString ?? 'YYYY-MM-DDTHH:mm:ssZ', this.#locale);
  }

  /** Locale getter/setter — mutates when called with an argument. */
  locale(): string;
  locale(locale: string): MomentTemporal;
  locale(locale?: string): string | MomentTemporal {
    if (locale === undefined) return this.#locale;
    this.#locale = locale;
    return this;
  }

  fromNow(withoutSuffix = false): string {
    const now = MomentTemporal.now();
    return this.from(now, withoutSuffix);
  }

  from(other: MomentTemporal, withoutSuffix = false): string {
    const duration = new MomentDuration(
      other._getZdt().until(this.#zdt, { largestUnit: 'years' }),
      this.#locale,
    );
    return duration.humanize(!withoutSuffix);
  }

  toNow(withoutSuffix = false): string {
    const now = MomentTemporal.now();
    return now.from(this, withoutSuffix);
  }

  to(other: MomentTemporal, withoutSuffix = false): string {
    return other.from(this, withoutSuffix);
  }

  /** Calendar-time display: "Today at 3:00 PM", "Yesterday at 3:00 PM", etc. */
  calendar(reference?: MomentTemporal): string {
    const now = reference ?? MomentTemporal.now();
    const diffDays = this.clone().startOf('day').diff(now.clone().startOf('day'), 'day');
    const timeStr = this.format('LT');
    if (diffDays === 0) return `Today at ${timeStr}`;
    if (diffDays === 1) return `Tomorrow at ${timeStr}`;
    if (diffDays === -1) return `Yesterday at ${timeStr}`;
    if (diffDays > 1 && diffDays < 7) return `${this.format('dddd')} at ${timeStr}`;
    if (diffDays < -1 && diffDays > -7) return `Last ${this.format('dddd')} at ${timeStr}`;
    return this.format('MM/DD/YYYY');
  }

  /** Current moment — used by fromNow / toNow / calendar. */
  static now(): MomentTemporal {
    const T = getTemporal();
    return new MomentTemporal(T.Now.zonedDateTimeISO());
  }

  // --- Internal accessors used by sibling wrapper modules ----------------
  /** @internal */
  _getZdt(): ZonedDateTime { return this.#zdt; }
  /** @internal */
  _setZdt(zdt: ZonedDateTime): void { this.#zdt = zdt; }
  /** @internal */
  _getLocale(): string { return this.#locale; }
  /** @internal */
  _markInvalid(): void { this.#invalid = true; }

  /** @internal — consumed by the parse module to build instances. */
  static _wrap(zdt: ZonedDateTime, opts?: { locale?: string; isUTC?: boolean }): MomentTemporal {
    return new MomentTemporal(zdt, opts);
  }
}

// Re-export MomentUnit from units for convenience.
export type { MomentUnit };
