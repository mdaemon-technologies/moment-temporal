/**
 * Build-artifact contract — asserts that the two Rollup outputs differ in
 * the way the plan requires:
 *
 *   - dist/moment-temporal.mjs must contain dynamic `import("moment")`
 *     and `import("moment-timezone")` so that Vite / modern ESM bundlers
 *     split moment into its own chunk. Temporal-capable consumers never
 *     download moment.
 *
 *   - dist/moment-temporal.cjs must contain eager `require("moment")`
 *     because CJS has no top-level await and no code-splitting semantics.
 *     CJS consumers pay the eager load cost.
 *
 * These tests are skipped if dist/ hasn't been built — CI runs
 * `npm run build` before `npm test` so the artifacts are present.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const distDir = resolve(__dirname, '..', '..', 'dist');
const mjsPath = resolve(distDir, 'moment-temporal.mjs');
const cjsPath = resolve(distDir, 'moment-temporal.cjs');

const describeIfBuilt = existsSync(mjsPath) && existsSync(cjsPath) ? describe : describe.skip;

describeIfBuilt('build artifacts — lazy-vs-eager contract', () => {
  test('dist/moment-temporal.mjs contains dynamic import("moment")', () => {
    const src = readFileSync(mjsPath, 'utf8');
    expect(src).toMatch(/import\(['"`]moment['"`]\)/);
  });

  test('dist/moment-temporal.mjs contains dynamic import("moment-timezone")', () => {
    const src = readFileSync(mjsPath, 'utf8');
    expect(src).toMatch(/import\(['"`]moment-timezone['"`]\)/);
  });

  test('dist/moment-temporal.mjs uses top-level await', () => {
    const src = readFileSync(mjsPath, 'utf8');
    // terser may rename locals but the `await` keyword survives.
    expect(src).toMatch(/await\s+import\(/);
  });

  test('dist/moment-temporal.cjs contains eager require("moment")', () => {
    const src = readFileSync(cjsPath, 'utf8');
    expect(src).toMatch(/require\(['"`]moment['"`]\)/);
  });

  test('dist/moment-temporal.cjs does NOT contain a dynamic import()', () => {
    const src = readFileSync(cjsPath, 'utf8');
    // A true dynamic import in CJS output would be something like
    //   Promise.resolve().then(function(){return require("moment")})
    // or a preserved `import(...)` expression. Either signals the
    // lazy path accidentally leaked into the CJS build.
    expect(src).not.toMatch(/\bimport\(/);
  });
});
