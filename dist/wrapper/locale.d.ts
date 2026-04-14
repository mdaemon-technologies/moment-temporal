/**
 * Module-level locale state for moment.locale() / moment.locale('fr').
 *
 * Instance locale overrides (m.locale('de')) live on MomentTemporal itself
 * and are not touched here. This module only tracks the factory default
 * used when a new instance is created without an explicit locale.
 */
export declare function getLocale(): string;
export declare function setLocale(locale: string | undefined): string;
