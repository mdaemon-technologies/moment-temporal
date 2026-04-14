/**
 * @mdaemon/moment-temporal
 *
 * Drop-in replacement for moment. At load time we check for a host Temporal
 * global. If present, we return a moment-shaped wrapper backed by
 * Temporal.ZonedDateTime. If absent, we return the installed moment package
 * unchanged so the fallback path is indistinguishable from vanilla moment.
 *
 * Consumers:
 *   import moment from "@mdaemon/moment-temporal";
 *   moment().add(1, "day").format("YYYY-MM-DD");
 *
 * Note on semantics: when the Temporal-backed wrapper is used, behavior
 * follows Temporal (ISO 8601 weeks, strict parsing, Intl-based locale
 * output, Temporal DST rules). When the fallback returns raw moment,
 * behavior follows moment's legacy rules. Callers who need byte-identical
 * output across environments should install a Temporal polyfill such as
 * @js-temporal/polyfill or temporal-polyfill.
 */

import moment from 'moment';
import 'moment-timezone';

import { hasTemporal } from './detect';
import { createMomentTemporalFactory } from './wrapper/factory';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api: any = hasTemporal() ? createMomentTemporalFactory() : moment;

export default api;
