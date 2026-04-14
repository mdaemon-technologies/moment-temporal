/**
 * Runtime detection of the Temporal global.
 *
 * Evaluated once per module load. When true, the library routes all calls
 * through the Temporal-backed wrapper. When false, the library re-exports
 * the installed `moment` package unchanged (fallback path).
 */
export function hasTemporal(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any;
  return typeof g.Temporal !== 'undefined'
    && typeof g.Temporal.Now !== 'undefined'
    && typeof g.Temporal.ZonedDateTime !== 'undefined';
}

/**
 * Returns the host Temporal namespace. Only safe to call after hasTemporal()
 * has returned true. Typed as `any` to avoid a hard dependency on TS lib
 * definitions — the wrapper modules import concrete types from
 * `@js-temporal/polyfill` for compile-time checking.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTemporal(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any).Temporal;
}
