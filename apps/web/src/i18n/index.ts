import { createContext, useContext } from 'react';
import { en } from './en.js';
import { de } from './de.js';

export type Locale = 'en' | 'de';
export const LOCALES: Locale[] = ['en', 'de'];
export const LOCALE_NAMES: Record<Locale, string> = { en: 'English', de: 'Deutsch' };

/** English is the reference: every other locale must supply exactly these keys. */
export type Strings = typeof en;

const DICTS: Record<Locale, Strings> = { en, de };

export interface I18n {
  locale: Locale;
  t: Strings;
  setLocale: (l: Locale) => void;
}

export const I18nContext = createContext<I18n>({
  locale: 'en',
  t: en,
  setLocale: () => {},
});

export function useI18n(): I18n {
  return useContext(I18nContext);
}

export function stringsFor(locale: Locale): Strings {
  return DICTS[locale];
}

/**
 * Locale resolution order: explicit `lang` in the URL, then the browser's preference, then
 * English. Deliberately no storage fallback — localStorage and sessionStorage are forbidden
 * (§4), so the URL is the only place a choice can persist.
 */
export function resolveLocale(search: string, navigatorLanguages: readonly string[]): Locale {
  const fromUrl = new URLSearchParams(search).get('lang');
  if (fromUrl && (LOCALES as string[]).includes(fromUrl)) return fromUrl as Locale;
  for (const lang of navigatorLanguages) {
    const base = lang.toLowerCase().split('-')[0];
    if (base && (LOCALES as string[]).includes(base)) return base as Locale;
  }
  return 'en';
}

/** Fill `{name}` placeholders. Kept trivial on purpose — no plural or gender rules are needed
 *  for either locale here, and a real ICU formatter would be dead weight. */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in values ? String(values[k]) : `{${k}}`,
  );
}
