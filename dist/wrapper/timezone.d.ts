/**
 * Timezone statics — moment.tz.* surface.
 *
 * All state (default zone, guess result) goes through Temporal APIs and
 * Intl.supportedValuesOf. Custom zones via moment.tz.add() are not
 * supported — Temporal only reads the host's IANA database.
 */
import { getDefaultTimezone } from './parse';
export interface TzStatics {
    (input?: unknown, zone?: string): unknown;
    guess(): string;
    names(): string[];
    zone(name: string): TzZoneInfo | null;
    setDefault(name: string | undefined): void;
    add(..._args: unknown[]): void;
}
export interface TzZoneInfo {
    name: string;
    abbr(timestamp: number): string;
}
/**
 * Build the tz.* namespace object. Consumers mutate this via setDefault;
 * reads go directly to Temporal.Now / Intl where possible.
 */
export declare function createTzStatics(callable: (input: unknown, zone: string) => unknown): TzStatics;
export { getDefaultTimezone };
