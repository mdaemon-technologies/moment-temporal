/**
 * Module-level locale state for moment.locale() / moment.locale('fr').
 *
 * Instance locale overrides (m.locale('de')) live on MomentTemporal itself
 * and are not touched here. This module only tracks the factory default
 * used when a new instance is created without an explicit locale.
 */

let moduleLocale = 'en';

export function getLocale(): string {
  return moduleLocale;
}

export function setLocale(locale: string | undefined): string {
  if (locale) moduleLocale = locale;
  return moduleLocale;
}
