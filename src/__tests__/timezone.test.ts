/**
 * Timezone — moment.tz.* statics and instance .tz() / .utc() / .local().
 */

import momentTemporal from '../moment-temporal';

describe('timezone — statics', () => {
  test('moment.tz.guess() returns a non-empty IANA zone', () => {
    const zone = momentTemporal.tz.guess();
    expect(typeof zone).toBe('string');
    expect(zone.length).toBeGreaterThan(0);
  });

  test('moment.tz.names() includes common IANA zones', () => {
    const names = momentTemporal.tz.names();
    expect(Array.isArray(names)).toBe(true);
    // On any reasonably modern Node/jsdom we expect a full IANA list.
    // We only assert one well-known canonical zone is present —
    // Intl.supportedValuesOf returns canonical forms only, so aliases
    // like 'UTC' may or may not appear depending on ICU version.
    if (names.length > 1) {
      expect(names).toContain('America/New_York');
      expect(names).toContain('Europe/London');
    }
  });

  test('moment.tz.zone(valid) returns a zone object with abbr()', () => {
    const zone = momentTemporal.tz.zone('America/New_York');
    expect(zone).not.toBeNull();
    expect(zone!.name).toBe('America/New_York');
    const abbr = zone!.abbr(Date.UTC(2023, 5, 15));
    expect(typeof abbr).toBe('string');
    expect(abbr.length).toBeGreaterThan(0);
  });

  test('moment.tz.zone(invalid) returns null', () => {
    expect(momentTemporal.tz.zone('Not/AZone')).toBeNull();
  });

  test('moment.tz.add() warns once and is a no-op', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      momentTemporal.tz.add('Custom/Zone|CST|0|0|');
      momentTemporal.tz.add('Another/Zone|X|0|0|');
      // Warning shown at least once; subsequent calls are silent but still no-op.
      expect(warn.mock.calls.length).toBeGreaterThanOrEqual(1);
    } finally {
      warn.mockRestore();
    }
  });
});

describe('timezone — instance conversion', () => {
  test('moment.tz(input, zone)', () => {
    const m = momentTemporal.tz('2023-06-15T12:00:00Z', 'America/New_York');
    expect(m.isValid()).toBe(true);
    // June 15 is EDT (UTC-4): 12:00Z → 08:00 local
    expect(m.hour()).toBe(8);
  });

  test('instance .tz(zone) converts in place', () => {
    const m = momentTemporal('2023-06-15T12:00:00Z').tz('Asia/Tokyo');
    // JST is UTC+9 year-round
    expect(m.hour()).toBe(21);
  });

  test('.utc() converts to UTC', () => {
    const m = momentTemporal.tz('2023-06-15T08:00:00-04:00[America/New_York]', 'America/New_York');
    m.utc();
    expect(m.isUTC()).toBe(true);
    expect(m.hour()).toBe(12);
  });

  test('.local() converts to host default', () => {
    const m = momentTemporal.utc('2023-06-15T12:00:00Z');
    m.local();
    expect(m.isUTC()).toBe(false);
  });

  test('.zoneName() produces a non-empty abbreviation', () => {
    const m = momentTemporal.tz('2023-06-15T12:00:00Z', 'America/New_York');
    const abbr = m.zoneName();
    expect(typeof abbr).toBe('string');
    // EDT in June; could be "EDT" or "GMT-4" depending on ICU data.
    expect(abbr.length).toBeGreaterThan(0);
  });

  test('.isDST() is true in summer for northern-hemisphere DST zones', () => {
    const summer = momentTemporal.tz('2023-07-15T12:00:00Z', 'America/New_York');
    const winter = momentTemporal.tz('2023-01-15T12:00:00Z', 'America/New_York');
    expect(summer.isDST()).toBe(true);
    expect(winter.isDST()).toBe(false);
  });
});

describe('timezone — setDefault', () => {
  afterEach(() => {
    momentTemporal.tz.setDefault(undefined);
  });

  test('setDefault shifts new instances into the given zone', () => {
    momentTemporal.tz.setDefault('Asia/Tokyo');
    const m = momentTemporal('2023-06-15T00:00:00');
    // With Asia/Tokyo default, the naive time is interpreted as JST.
    // Converting back to UTC should produce 15:00Z the previous day.
    expect(m.toDate().getUTCHours()).toBe(15);
  });
});
