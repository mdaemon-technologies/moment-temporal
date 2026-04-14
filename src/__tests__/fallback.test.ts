/**
 * Fallback contract: when globalThis.Temporal is not present, the package
 * default export must be the installed `moment` module itself — not a
 * wrapper, not a lookalike. `momentTemporal === moment` should hold so
 * consumer code that tests `moment.isMoment(x)` or relies on prototype
 * identity keeps working.
 *
 * This file uses jest.isolateModules + dynamic require so it can mutate
 * globalThis.Temporal and get a fresh import of the package under the
 * mutated conditions, without polluting other test files.
 */

import { hasTemporal } from '../detect';

describe('fallback — when Temporal is absent', () => {
  const savedTemporal = (globalThis as unknown as { Temporal?: unknown }).Temporal;

  beforeEach(() => {
    delete (globalThis as unknown as { Temporal?: unknown }).Temporal;
  });

  afterEach(() => {
    (globalThis as unknown as { Temporal?: unknown }).Temporal = savedTemporal;
  });

  test('hasTemporal() returns false', () => {
    expect(hasTemporal()).toBe(false);
  });

  test('default export is identity-equal to real moment', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pkg = require('../moment-temporal').default;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const realMoment = require('moment');

      // In the fallback branch the default export must BE real moment.
      expect(pkg).toBe(realMoment);
    });
  });

  test('fallback exposes moment-timezone extensions on the returned function', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pkg = require('../moment-temporal').default;
      // moment-timezone extends moment with .tz(), .tz.guess(), etc.
      expect(typeof pkg.tz).toBe('function');
      expect(typeof pkg.tz.guess).toBe('function');
      expect(typeof pkg.tz.names).toBe('function');
    });
  });
});

describe('detection — when Temporal is present', () => {
  test('hasTemporal() returns true with the polyfill installed by setup', () => {
    expect(hasTemporal()).toBe(true);
  });

  test('default export is NOT the raw moment function when Temporal is present', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pkg = require('../moment-temporal').default;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const realMoment = require('moment');
      expect(pkg).not.toBe(realMoment);
      expect(typeof pkg).toBe('function');
      expect(typeof pkg.isMoment).toBe('function');
    });
  });
});
