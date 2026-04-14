/**
 * MomentDuration — thin wrapper over Temporal.Duration that exposes
 * moment's duration API: .asX() conversions, .humanize(), .toISOString().
 *
 * Temporal.Duration is authoritative for arithmetic. We only add the
 * moment-shaped surface and the English humanize thresholds.
 */

import { getTemporal } from '../detect';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TemporalDuration = any;

export class MomentDuration {
  #d: TemporalDuration;
  #locale: string;

  constructor(input: TemporalDuration | Record<string, number> | number, localeOrUnit?: string) {
    const T = getTemporal();
    if (typeof input === 'number') {
      // moment.duration(1000, 'ms') — numeric input + unit
      const unit = localeOrUnit ?? 'milliseconds';
      this.#d = T.Duration.from({ [unit]: input });
      this.#locale = 'en';
    } else if (input && typeof input === 'object' && 'total' in input) {
      // Already a Temporal.Duration
      this.#d = input;
      this.#locale = localeOrUnit ?? 'en';
    } else {
      this.#d = T.Duration.from(input);
      this.#locale = localeOrUnit ?? 'en';
    }
  }

  asYears():        number { return this.#d.total({ unit: 'years', relativeTo: referenceInstant() }); }
  asMonths():       number { return this.#d.total({ unit: 'months', relativeTo: referenceInstant() }); }
  asWeeks():        number { return this.#d.total({ unit: 'weeks', relativeTo: referenceInstant() }); }
  asDays():         number { return this.#d.total({ unit: 'days', relativeTo: referenceInstant() }); }
  asHours():        number { return this.#d.total({ unit: 'hours' }); }
  asMinutes():      number { return this.#d.total({ unit: 'minutes' }); }
  asSeconds():      number { return this.#d.total({ unit: 'seconds' }); }
  asMilliseconds(): number { return this.#d.total({ unit: 'milliseconds' }); }

  years():        number { return this.#d.years; }
  months():       number { return this.#d.months; }
  weeks():        number { return this.#d.weeks; }
  days():         number { return this.#d.days; }
  hours():        number { return this.#d.hours; }
  minutes():      number { return this.#d.minutes; }
  seconds():      number { return this.#d.seconds; }
  milliseconds(): number { return this.#d.milliseconds; }

  toISOString(): string {
    return this.#d.toString();
  }

  /**
   * Humanize the duration to an English phrase like "a few seconds" or
   * "2 days". Thresholds match moment's documented defaults:
   *   s <= 44 → "a few seconds"
   *   45..89  → "a minute"
   *   90..44m → "X minutes"
   *   45m..89m → "an hour"
   *   ...
   */
  humanize(withSuffix = false): string {
    const seconds = Math.abs(this.asSeconds());
    const past = this.asSeconds() < 0;

    let phrase: string;
    if (seconds < 45) phrase = 'a few seconds';
    else if (seconds < 90) phrase = 'a minute';
    else if (seconds < 45 * 60) phrase = `${Math.round(seconds / 60)} minutes`;
    else if (seconds < 90 * 60) phrase = 'an hour';
    else if (seconds < 22 * 3600) phrase = `${Math.round(seconds / 3600)} hours`;
    else if (seconds < 36 * 3600) phrase = 'a day';
    else if (seconds < 26 * 86400) phrase = `${Math.round(seconds / 86400)} days`;
    else if (seconds < 46 * 86400) phrase = 'a month';
    else if (seconds < 320 * 86400) phrase = `${Math.round(seconds / (30 * 86400))} months`;
    else if (seconds < 548 * 86400) phrase = 'a year';
    else phrase = `${Math.round(seconds / (365 * 86400))} years`;

    if (!withSuffix) return phrase;
    return past ? `${phrase} ago` : `in ${phrase}`;
  }
}

/**
 * Stable reference for Duration.total() on calendar units (years, months,
 * weeks). Without a relativeTo, Temporal refuses to compute a total on
 * variable-length units because the answer depends on when you start
 * counting. We anchor to 2000-01-01 UTC so behavior is deterministic.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function referenceInstant(): any {
  const T = getTemporal();
  return T.ZonedDateTime.from('2000-01-01T00:00:00+00:00[UTC]');
}
