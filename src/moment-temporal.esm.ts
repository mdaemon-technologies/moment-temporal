/**
 * @mdaemon/moment-temporal — ESM entry with lazy moment loading.
 *
 * This file is the input for the `dist/moment-temporal.mjs` Rollup build.
 * It exists as a separate entry from `moment-temporal.ts` specifically so
 * modern ESM bundlers (Vite, Rollup, Webpack 5+) can treat `moment` as a
 * code-split chunk that is only fetched when the fallback path actually
 * runs.
 *
 * The trick: `await import('moment')` is a dynamic import expression, and
 * bundlers emit dynamic imports as separate chunks. Combined with
 * top-level await, the default export is still a synchronous value from
 * the consumer's point of view — the import of this module resolves only
 * after the chosen branch has settled.
 *
 * Consumers with a Temporal polyfill installed *before* this module is
 * imported will never trigger the dynamic branch, and their bundler will
 * never network-fetch the moment chunk. Consumers without Temporal pay
 * one extra round-trip to load the moment chunk, then the API is
 * identical to raw moment.
 *
 * CJS and UMD builds use `moment-temporal.ts` instead, which eagerly
 * imports moment the traditional way. Top-level await is not valid in
 * CJS, and CJS consumers are typically Node backends where bundle size
 * is less of a concern.
 */

import { hasTemporal } from './detect';
import { createMomentTemporalFactory } from './wrapper/factory';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let api: any;

if (hasTemporal()) {
  // Fast path — no moment, no moment-timezone, no dynamic import. The
  // bundler can see that this branch does not reference moment and will
  // not pull it into the initial chunk.
  api = createMomentTemporalFactory();
} else {
  // Lazy path — dynamic imports become separate chunks under Vite/Rollup/
  // Webpack. moment-timezone must be awaited *after* moment because it
  // augments moment's prototype as a side effect of being loaded.
  const momentModule = await import('moment');
  await import('moment-timezone');
  api = momentModule.default ?? momentModule;
}

export default api;
