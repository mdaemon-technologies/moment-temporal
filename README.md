[![Dynamic JSON Badge](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fmdaemon-technologies%2Fmoment-temporal%2Fmain%2Fpackage.json&query=%24.version&prefix=v&label=npm&color=blue)](https://www.npmjs.com/package/@mdaemon/moment-temporal) [![Static Badge](https://img.shields.io/badge/node-v18%2B-blue?style=flat&label=node&color=blue)](https://nodejs.org) [![TypeScript](https://img.shields.io/badge/TypeScript-5.8%2B-blue?logo=typescript)](https://www.typescriptlang.org/) [![install size](https://packagephobia.com/badge?p=@mdaemon/moment-temporal)](https://packagephobia.com/result?p=@mdaemon/moment-temporal) [![Dynamic JSON Badge](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fmdaemon-technologies%2Fmoment-temporal%2Fmain%2Fpackage.json&query=%24.license&prefix=v&label=license&color=green)](https://github.com/mdaemon-technologies/moment-temporal/blob/main/LICENSE) [![Node.js CI](https://github.com/mdaemon-technologies/moment-temporal/actions/workflows/node.js.yml/badge.svg)](https://github.com/mdaemon-technologies/moment-temporal/actions/workflows/node.js.yml)

# @mdaemon/moment-temporal

A drop-in replacement for [moment](https://momentjs.com/) that is backed by the [TC39 Temporal API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) when one is available on the host. If Temporal is not available, the package returns the installed `moment` module unchanged so your code keeps working without any runtime changes.

[ [@mdaemon/moment-temporal on npm](https://www.npmjs.com/package/@mdaemon/moment-temporal "npm") ]

## How it works

At load time the library probes `globalThis.Temporal`:

- **Temporal present** → the default export is a moment-shaped callable backed by `Temporal.ZonedDateTime`. Calling `.add()`, `.format()`, `.tz()`, `.duration()`, etc. routes through Temporal internally. The surface is deliberately moment's, so existing code doesn't change.
- **Temporal absent** → the default export **is** the installed `moment` module (identity-equal; `momentTemporal === moment` holds). Every call resolves against raw moment / moment-timezone with no wrapping overhead.

Detection happens exactly once. No per-call branching. No feature flags.

## Install

    $ npm install @mdaemon/moment-temporal --save

## Node CommonJS

```javascript
const moment = require("@mdaemon/moment-temporal/dist/moment-temporal.cjs");

moment().add(1, "day").format("YYYY-MM-DD");
moment.tz("2023-06-15T12:00:00Z", "America/New_York").format("LLLL");
```

## Node / ES Modules / TypeScript

```typescript
import moment from "@mdaemon/moment-temporal/dist/moment-temporal.mjs";
// or the unscoped import — bundlers pick the right output via `module`/`main`:
import moment from "@mdaemon/moment-temporal";

const m = moment("2023-06-15T12:00:00Z");
m.add(1, "month").subtract(3, "days");
console.log(m.format("dddd, MMMM Do YYYY"));
```

## Web (UMD)

```html
<script src="/path_to_modules/dist/moment-temporal.umd.js"></script>
<script>
  // Exposed as window.MomentTemporal in UMD mode
  MomentTemporal().format("YYYY-MM-DD");
</script>
```

## Temporal polyfill

Native `Temporal` is not yet shipped in every runtime. If you want the Temporal-backed path everywhere, install a polyfill before importing this package:

```javascript
import { Temporal } from "@js-temporal/polyfill";
globalThis.Temporal = Temporal;

import moment from "@mdaemon/moment-temporal";
```

Either [`@js-temporal/polyfill`](https://www.npmjs.com/package/@js-temporal/polyfill) or [`temporal-polyfill`](https://www.npmjs.com/package/temporal-polyfill) works. The package itself does not bundle a polyfill — consumers choose.

## Bundle size: lazy moment loading under ESM bundlers

The ESM build (`dist/moment-temporal.mjs`) loads `moment` and `moment-timezone` via **dynamic `import()` behind top-level await**. That means bundlers which honor the `module` field and support code-splitting (Vite, modern Rollup, Webpack 5+) treat moment as a separate chunk that is only fetched when the fallback path actually runs.

**What this means for your bundle:**

- **Temporal is available (polyfill installed or native support)** → moment is never requested. The moment chunk sits in `dist/assets/` but no `<script>` tag ever fetches it. Your initial JS payload does not include moment.
- **Temporal is not available** → one extra async fetch for the moment chunk, then the API is identity-equal to raw moment.

To get the small-bundle path, install a Temporal polyfill *before* importing the package:

```javascript
// app entry (e.g. src/main.ts in a Vite app)
import { Temporal } from "@js-temporal/polyfill";
globalThis.Temporal = Temporal;

// Now import moment-temporal. The dynamic branch for moment is
// dead code from the bundler's point of view — it will still be
// emitted as a chunk, but never fetched at runtime.
import moment from "@mdaemon/moment-temporal";
```

Polyfill sizes for reference: `temporal-polyfill` is ~20KB gzipped, versus moment + moment-timezone at ~70KB+ gzipped. Dropping moment entirely is usually a net win.

**CJS and UMD consumers** get the eager load behavior — CJS has no top-level await, and UMD is designed for script tags that assume synchronous availability. `dist/moment-temporal.cjs` and `dist/moment-temporal.umd.js` static-require moment at module load time, same as the fallback contract always has.

## API

Public surface mirrors [moment](https://momentjs.com/docs/) and [moment-timezone](https://momentjs.com/timezone/) one-for-one. Commonly used entry points:

| Category | Methods |
|---|---|
| **Parse** | `moment()`, `moment(input)`, `moment(input, format)`, `moment.utc()`, `moment.unix()`, `moment.tz()` |
| **Get / Set** | `year`, `month`, `date`, `day`, `hour`, `minute`, `second`, `millisecond`, `get`, `set` |
| **Manipulate** | `add`, `subtract`, `startOf`, `endOf`, `local`, `utc`, `tz` |
| **Display** | `format`, `fromNow`, `from`, `toNow`, `to`, `calendar`, `diff`, `valueOf`, `unix`, `toDate`, `toArray`, `toJSON`, `toISOString`, `toObject`, `toString` |
| **Query** | `isBefore`, `isSame`, `isAfter`, `isSameOrBefore`, `isSameOrAfter`, `isBetween`, `isDST`, `isLeapYear`, `isValid`, `isMoment`, `isDate` |
| **Duration** | `moment.duration`, `.asYears/Months/Days/Hours/Minutes/Seconds/Milliseconds`, `.humanize`, `.toISOString` |
| **Timezone** | `moment.tz`, `moment.tz.guess`, `moment.tz.names`, `moment.tz.zone`, `moment.tz.setDefault`, `.tz(zone)`, `.zoneName()` |
| **Locale** | `moment.locale()`, `.locale()` |

## Temporal-first semantics

This library presents moment's API surface, but its **behavior is governed by the Temporal specification**. Where moment and Temporal disagree, Temporal wins. A small set of outputs will not byte-match moment. These differences are intentional and locked in by the `moment-divergence` test suite.

1. **Localized format output** comes from `Intl.DateTimeFormat` with the stored locale, not moment's bundled locale files. Most strings match in common locales; edge cases (`LLLL` weekday spellings in some languages, ordinals in non-English locales) may differ.
2. **Week numbering** is ISO 8601: weeks start on **Monday** and week 1 is the week containing the first Thursday. Moment defaults to Sunday-start in English locales — that is not replicated.
3. **DST arithmetic** follows Temporal's rules. Ambiguous local times at DST boundaries resolve via Temporal's `disambiguation: 'compatible'` default.
4. **Strict parsing** — input strings that Temporal refuses report `isValid() === false`. Moment's forgiving parser (e.g. `"June 15 2023"`, `"2023-13-45"`) is not replicated.
5. **`diff` on variable-length units** (month, year) uses `Temporal.Duration.total` with a `relativeTo`, which is more accurate than moment's heuristic.
6. **Custom timezones** (`moment.tz.add`) are a no-op with a one-time deprecation warning. Temporal reads IANA zones from the host's CLDR database and cannot be extended at runtime.
7. **Deprecated moment internals** (`moment.fn`, internal parser hooks) are not implemented. Only the documented public surface.

## Fallback behavior caveat

When `Temporal` is not present on the host, the default export is raw `moment` — which means the fallback path produces moment's output, **including** the quirks listed above. A consumer running on two different hosts (one with Temporal, one without) can see different output for the same input in those edge cases.

For byte-identical behavior across environments, install a Temporal polyfill as shown above. The wrapper path is then always used and all hosts agree.

## Versioning

This package is pre-1.0 (`0.x.y`) while the Temporal-backed surface stabilizes. Non-breaking additions land in minor versions; divergence-test-guarded behavior changes are breaking and bump the minor until 1.0.

## License

Published under the [LGPL-2.1 license](https://github.com/mdaemon-technologies/moment-temporal/blob/main/LICENSE "LGPL-2.1 License").

Published by<br/>
<b>MDaemon Technologies, Ltd.<br/>
Simple Secure Email</b><br/>
[https://www.mdaemon.com](https://www.mdaemon.com)
