/**
 * Runtime detection of the Temporal global.
 *
 * Evaluated once per module load. When true, the library routes all calls
 * through the Temporal-backed wrapper. When false, the library re-exports
 * the installed `moment` package unchanged (fallback path).
 */
export declare function hasTemporal(): boolean;
/**
 * Returns the host Temporal namespace. Only safe to call after hasTemporal()
 * has returned true. Typed as `any` to avoid a hard dependency on TS lib
 * definitions — the wrapper modules import concrete types from
 * `@js-temporal/polyfill` for compile-time checking.
 */
export declare function getTemporal(): any;
