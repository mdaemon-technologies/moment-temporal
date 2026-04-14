/**
 * Format token translator.
 *
 * Numeric moment tokens (YYYY, MM, DD, HH, mm, ss, ...) are computed
 * directly from the ZonedDateTime fields and padded. Localized tokens
 * (dddd, MMMM, LT, LL, ...) are delegated to Intl.DateTimeFormat with
 * the stored locale — this is the Temporal-first semantics: Intl is the
 * source of truth for localized strings, not moment's bundled locale files.
 *
 * Bracketed literals `[foo]` pass through verbatim, matching moment.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ZonedDateTime = any;

const pad = (n: number, width = 2): string => String(n).padStart(width, '0');

const ordinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/**
 * Tokens are matched longest-first (important: `YYYY` before `YY`,
 * `MMMM` before `MMM`, etc.). Literal `[...]` blocks are captured so
 * they survive unchanged.
 */
const TOKEN_RE =
  /\[([^\]]+)]|YYYY|YY|Qo|Q|MMMM|MMM|MM|Mo|M|DDDD|DDDo|DDD|DD|Do|D|dddd|ddd|dd|do|d|e|E|wo|ww|w|Wo|WW|W|gggg|gg|GGGG|GG|HH|H|hh|h|kk|k|mm|m|ss|s|SSSS|SSS|SS|S|A|a|ZZ|Z|X|x|LTS|LT|LLLL|LLL|LL|L|ll|lll|llll|z/g;

// Cache DateTimeFormat instances — they're expensive to construct repeatedly.
const dtfCache = new Map<string, Intl.DateTimeFormat>();
const dtf = (locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => {
  const key = locale + JSON.stringify(options);
  let f = dtfCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, options);
    dtfCache.set(key, f);
  }
  return f;
};

/**
 * Format a ZonedDateTime using a moment-style format string.
 *
 * @param z      Temporal.ZonedDateTime source of values
 * @param fmt    moment format string (e.g. "YYYY-MM-DD HH:mm:ss Z")
 * @param locale Locale tag used for Intl-backed tokens
 */
export function formatWithTokens(z: ZonedDateTime, fmt: string, locale: string): string {
  const date = new Date(Number(z.epochMilliseconds));
  const timeZone = z.timeZoneId;

  return fmt.replace(TOKEN_RE, (match, literal) => {
    if (literal !== undefined) return literal;

    switch (match) {
      // Year
      case 'YYYY': return pad(z.year, 4);
      case 'YY':   return pad(z.year % 100, 2);

      // Quarter
      case 'Q':  return String(Math.floor((z.month - 1) / 3) + 1);
      case 'Qo': return ordinal(Math.floor((z.month - 1) / 3) + 1);

      // Month
      case 'MMMM': return dtf(locale, { month: 'long', timeZone }).format(date);
      case 'MMM':  return dtf(locale, { month: 'short', timeZone }).format(date);
      case 'MM':   return pad(z.month, 2);
      case 'Mo':   return ordinal(z.month);
      case 'M':    return String(z.month);

      // Day of year
      case 'DDDD': return pad(z.dayOfYear, 3);
      case 'DDDo': return ordinal(z.dayOfYear);
      case 'DDD':  return String(z.dayOfYear);

      // Day of month
      case 'DD': return pad(z.day, 2);
      case 'Do': return ordinal(z.day);
      case 'D':  return String(z.day);

      // Day of week (name)
      case 'dddd': return dtf(locale, { weekday: 'long', timeZone }).format(date);
      case 'ddd':  return dtf(locale, { weekday: 'short', timeZone }).format(date);
      case 'dd':   return dtf(locale, { weekday: 'narrow', timeZone }).format(date);

      // Day of week (number): moment 'd' is 0=Sunday; Temporal is 1=Monday..7=Sunday
      case 'd':  return String(z.dayOfWeek % 7);
      case 'do': return ordinal(z.dayOfWeek % 7);
      case 'e':  return String(z.dayOfWeek % 7);
      case 'E':  return String(z.dayOfWeek);

      // Week of year (ISO 8601)
      case 'w':
      case 'W':  return String(z.weekOfYear);
      case 'ww':
      case 'WW': return pad(z.weekOfYear, 2);
      case 'wo':
      case 'Wo': return ordinal(z.weekOfYear);

      // Week year
      case 'gggg':
      case 'GGGG': return pad(z.yearOfWeek ?? z.year, 4);
      case 'gg':
      case 'GG':   return pad((z.yearOfWeek ?? z.year) % 100, 2);

      // Hour 24h
      case 'HH': return pad(z.hour, 2);
      case 'H':  return String(z.hour);

      // Hour 12h
      case 'hh': return pad(z.hour % 12 || 12, 2);
      case 'h':  return String(z.hour % 12 || 12);

      // Hour 0-23 (moment 'k' is 1-24, not 0-23)
      case 'kk': return pad(z.hour === 0 ? 24 : z.hour, 2);
      case 'k':  return String(z.hour === 0 ? 24 : z.hour);

      // Minute
      case 'mm': return pad(z.minute, 2);
      case 'm':  return String(z.minute);

      // Second
      case 'ss': return pad(z.second, 2);
      case 's':  return String(z.second);

      // Fractional second
      case 'SSSS': return pad(z.millisecond, 3) + '0';
      case 'SSS':  return pad(z.millisecond, 3);
      case 'SS':   return pad(Math.floor(z.millisecond / 10), 2);
      case 'S':    return String(Math.floor(z.millisecond / 100));

      // AM/PM
      case 'A': return z.hour < 12 ? 'AM' : 'PM';
      case 'a': return z.hour < 12 ? 'am' : 'pm';

      // UTC offset. Temporal.ZonedDateTime.offsetNanoseconds is a Number
      // (not a BigInt) per spec, so plain arithmetic is correct here.
      case 'ZZ': {
        const offsetMinutes = Math.trunc(z.offsetNanoseconds / 60_000_000_000);
        const sign = offsetMinutes >= 0 ? '+' : '-';
        const abs = Math.abs(offsetMinutes);
        return `${sign}${pad(Math.floor(abs / 60), 2)}${pad(abs % 60, 2)}`;
      }
      case 'Z': {
        const offsetMinutes = Math.trunc(z.offsetNanoseconds / 60_000_000_000);
        const sign = offsetMinutes >= 0 ? '+' : '-';
        const abs = Math.abs(offsetMinutes);
        return `${sign}${pad(Math.floor(abs / 60), 2)}:${pad(abs % 60, 2)}`;
      }

      // Unix timestamps
      case 'X': return String(Math.floor(Number(z.epochMilliseconds) / 1000));
      case 'x': return String(Number(z.epochMilliseconds));

      // Timezone abbreviation via Intl
      case 'z': {
        const parts = dtf(locale, { timeZone, timeZoneName: 'short' }).formatToParts(date);
        return parts.find(p => p.type === 'timeZoneName')?.value ?? '';
      }

      // Localized presets — all delegate to Intl.DateTimeFormat so output
      // matches the platform's locale data, not moment's bundled files.
      case 'LT':
        return dtf(locale, { hour: 'numeric', minute: 'numeric', timeZone }).format(date);
      case 'LTS':
        return dtf(locale, { hour: 'numeric', minute: 'numeric', second: 'numeric', timeZone }).format(date);
      case 'L':
        return dtf(locale, { year: 'numeric', month: '2-digit', day: '2-digit', timeZone }).format(date);
      case 'l':
        return dtf(locale, { year: 'numeric', month: 'numeric', day: 'numeric', timeZone }).format(date);
      case 'LL':
        return dtf(locale, { year: 'numeric', month: 'long', day: 'numeric', timeZone }).format(date);
      case 'll':
        return dtf(locale, { year: 'numeric', month: 'short', day: 'numeric', timeZone }).format(date);
      case 'LLL':
        return dtf(locale, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZone }).format(date);
      case 'lll':
        return dtf(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZone }).format(date);
      case 'LLLL':
        return dtf(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZone }).format(date);
      case 'llll':
        return dtf(locale, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZone }).format(date);

      default:
        return match;
    }
  });
}
