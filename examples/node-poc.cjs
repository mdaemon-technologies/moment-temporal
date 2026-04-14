/**
 * Proof of Concept — @mdaemon/moment-temporal (Node.js)
 *
 * Run:  node examples/node-poc.cjs
 *
 * This script installs the Temporal polyfill onto globalThis so the library
 * takes the Temporal-backed path, then exercises the moment-compatible API.
 */

// 1. Install the Temporal polyfill before loading the library
const { Temporal } = require('@js-temporal/polyfill');
globalThis.Temporal = Temporal;

// 2. Load moment-temporal — same import shape as `moment`
const moment = require('../dist/moment-temporal.cjs');

// ── Helpers ──────────────────────────────────────────────────────────────────
const section = (title) => console.log(`\n${'═'.repeat(60)}\n  ${title}\n${'═'.repeat(60)}`);
const log = (label, value) => console.log(`  ${label.padEnd(36)} → ${value}`);

// ══════════════════════════════════════════════════════════════════════════════
section('1. Basic creation & formatting');
// ══════════════════════════════════════════════════════════════════════════════

const now = moment();
log('moment()', now.format('YYYY-MM-DD HH:mm:ss'));
log('moment().toISOString()', now.toISOString());
log('moment().unix()', now.unix());
log('moment().valueOf()', now.valueOf());

const specific = moment('2025-06-15T10:30:00');
log("moment('2025-06-15T10:30:00')", specific.format('YYYY-MM-DD HH:mm:ss'));

const fromUnix = moment.unix(1700000000);
log('moment.unix(1700000000)', fromUnix.format('YYYY-MM-DD HH:mm:ss'));

const utcNow = moment.utc();
log('moment.utc()', utcNow.format('YYYY-MM-DD HH:mm:ss [UTC]'));

// ══════════════════════════════════════════════════════════════════════════════
section('2. Getters');
// ══════════════════════════════════════════════════════════════════════════════

const d = moment('2025-03-15T14:30:45');
log('year()', d.year());
log('month() (0-indexed)', d.month());
log('date()', d.date());
log('day() (0=Sun)', d.day());
log('hour()', d.hour());
log('minute()', d.minute());
log('second()', d.second());

// ══════════════════════════════════════════════════════════════════════════════
section('3. Manipulation (add / subtract)');
// ══════════════════════════════════════════════════════════════════════════════

const base = moment('2025-01-15');
log('base', base.format('YYYY-MM-DD'));
log('add(1, "month")', base.clone().add(1, 'month').format('YYYY-MM-DD'));
log('add(7, "days")', base.clone().add(7, 'days').format('YYYY-MM-DD'));
log('subtract(1, "year")', base.clone().subtract(1, 'year').format('YYYY-MM-DD'));
log('add(2, "hours")', base.clone().add(2, 'hours').format('YYYY-MM-DD HH:mm'));
log('startOf("month")', base.clone().startOf('month').format('YYYY-MM-DD'));
log('endOf("month")', base.clone().endOf('month').format('YYYY-MM-DD HH:mm:ss'));

// ══════════════════════════════════════════════════════════════════════════════
section('4. Formatting tokens');
// ══════════════════════════════════════════════════════════════════════════════

const f = moment('2025-12-25T18:05:09');
log('YYYY-MM-DD', f.format('YYYY-MM-DD'));
log('dddd, MMMM Do YYYY', f.format('dddd, MMMM Do YYYY'));
log('hh:mm:ss A', f.format('hh:mm:ss A'));
log('X (unix)', f.format('X'));
log('x (unix ms)', f.format('x'));
log('[Today is] dddd', f.format('[Today is] dddd'));

// ══════════════════════════════════════════════════════════════════════════════
section('5. Querying / Comparison');
// ══════════════════════════════════════════════════════════════════════════════

const a = moment('2025-06-01');
const b = moment('2025-09-01');
log('a.isBefore(b)', a.isBefore(b));
log('a.isAfter(b)', a.isAfter(b));
log('a.isSame(a.clone())', a.isSame(a.clone()));
log('a.isBetween(2025-03,2025-12)', a.isBetween(moment('2025-03-01'), moment('2025-12-01')));
log('a.isValid()', a.isValid());

// ══════════════════════════════════════════════════════════════════════════════
section('6. Diff');
// ══════════════════════════════════════════════════════════════════════════════

const start = moment('2025-01-01');
const end = moment('2025-07-15');
log('diff in days', start.diff(end, 'days'));
log('diff in months', start.diff(end, 'months'));
log('diff in years (float)', start.diff(end, 'years', true));

// ══════════════════════════════════════════════════════════════════════════════
section('7. Duration');
// ══════════════════════════════════════════════════════════════════════════════

const dur = moment.duration(90, 'minutes');
log("duration(90, 'minutes')", dur.humanize());
log('  .asHours()', dur.asHours());
log('  .asMinutes()', dur.asMinutes());
log('  .minutes()', dur.minutes());
log('  .hours()', dur.hours());

const dur2 = moment.duration({ hours: 2, minutes: 30 });
log('duration({h:2,m:30}).asMinutes()', dur2.asMinutes());

const isoDur = moment.duration('PT1H30M');
log("duration('PT1H30M').asMinutes()", isoDur.asMinutes());

// ══════════════════════════════════════════════════════════════════════════════
section('8. Timezone support');
// ══════════════════════════════════════════════════════════════════════════════

log('moment.tz.guess()', moment.tz.guess());
log('moment.tz.names() count', moment.tz.names().length + ' timezones');

const nyc = moment.tz('2025-06-15T12:00:00', 'America/New_York');
log("tz('...', 'America/New_York')", nyc.format('YYYY-MM-DD HH:mm Z'));

const tokyo = moment.tz('2025-06-15T12:00:00', 'Asia/Tokyo');
log("tz('...', 'Asia/Tokyo')", tokyo.format('YYYY-MM-DD HH:mm Z'));

// ══════════════════════════════════════════════════════════════════════════════
section('9. Type checks');
// ══════════════════════════════════════════════════════════════════════════════

log('isMoment(moment())', moment.isMoment(moment()));
log('isMoment("hello")', moment.isMoment('hello'));
log('isDate(new Date())', moment.isDate(new Date()));
log('isDuration(duration())', moment.isDuration(moment.duration(1, 'days')));

// ══════════════════════════════════════════════════════════════════════════════
section('10. Drop-in replacement — same code works');
// ══════════════════════════════════════════════════════════════════════════════

// This is code that works with vanilla moment — and works identically here.
function formatCountdown(eventDate) {
  const event = moment(eventDate);
  const now = moment();
  const diff = moment.duration(event.diff(now));

  if (diff.asMilliseconds() < 0) {
    return `Event was ${moment.duration(now.diff(event)).humanize()} ago`;
  }
  return `Event in ${diff.humanize()}`;
}

log('formatCountdown("2025-12-31")', formatCountdown('2025-12-31'));
log('formatCountdown("2020-01-01")', formatCountdown('2020-01-01'));

console.log(`\n${'═'.repeat(60)}`);
console.log('  ✔ All examples executed successfully using Temporal backend');
console.log(`${'═'.repeat(60)}\n`);
