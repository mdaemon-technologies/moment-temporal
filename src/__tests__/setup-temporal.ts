/**
 * Jest setup — installs the Temporal polyfill onto globalThis so the
 * Temporal-backed wrapper path is exercised by default.
 *
 * Tests that specifically want to exercise the fallback path (raw moment)
 * must import the fallback helper and delete globalThis.Temporal BEFORE
 * importing the package. See fallback.test.ts.
 */

// The polyfill exposes its own `Temporal` namespace. Consumers install
// whichever polyfill they prefer; we bind it to the global for the test
// run so the wrapper can find it via globalThis.Temporal.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Temporal } = require('@js-temporal/polyfill');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).Temporal = Temporal;
