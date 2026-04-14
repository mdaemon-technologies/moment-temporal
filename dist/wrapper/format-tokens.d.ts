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
type ZonedDateTime = any;
/**
 * Format a ZonedDateTime using a moment-style format string.
 *
 * @param z      Temporal.ZonedDateTime source of values
 * @param fmt    moment format string (e.g. "YYYY-MM-DD HH:mm:ss Z")
 * @param locale Locale tag used for Intl-backed tokens
 */
export declare function formatWithTokens(z: ZonedDateTime, fmt: string, locale: string): string;
export {};
