import { describe, expect, it } from 'vitest';
import { en } from '../src/i18n/en.js';
import { de } from '../src/i18n/de.js';
import { storiesEn } from '../src/i18n/stories-en.js';
import { storiesDe } from '../src/i18n/stories-de.js';
import { fmt, resolveLocale } from '../src/i18n/index.js';

type Dict = Record<string, unknown>;
function flatten(o: Dict, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[key] = v;
    else if (v && typeof v === 'object') Object.assign(out, flatten(v as Dict, key));
  }
  return out;
}

const flatEn = flatten(en as Dict);
const flatDe = flatten(de as Dict);
const flatStoryEn = flatten(storiesEn as Dict);
const flatStoryDe = flatten(storiesDe as Dict);

describe('i18n completeness (issue #8)', () => {
  it('German covers every English key, and adds none', () => {
    expect(Object.keys(flatDe).sort()).toEqual(Object.keys(flatEn).sort());
    expect(Object.keys(flatStoryDe).sort()).toEqual(Object.keys(flatStoryEn).sort());
  });

  it('no German string is left as the English original', () => {
    // Legitimate matches: the project name, country names that are identical in both
    // languages, and one template that is nothing but placeholders and punctuation.
    const allowed = new Set([
      'app.title',
      'charts.benchmarkUs',
      'charts.benchmarkCn',
      'story.progress',
    ]);
    const untranslated = Object.keys(flatEn).filter(
      (k) => !allowed.has(k) && flatEn[k] === flatDe[k] && flatEn[k]!.length > 12,
    );
    expect(untranslated, `untranslated: ${untranslated.join(', ')}`).toEqual([]);
  });

  it('placeholders survive translation in both dictionaries', () => {
    const holders = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort();
    for (const [pairEn, pairDe] of [
      [flatEn, flatDe],
      [flatStoryEn, flatStoryDe],
    ] as const) {
      for (const k of Object.keys(pairEn)) {
        expect(holders(pairEn[k]!), `${k} placeholders`).toEqual(holders(pairDe[k]!));
      }
    }
  });

  it('the caveats keep their hedging in German', () => {
    // These strings carry the honest-limits requirement; a translation that drops the
    // qualifier changes what the tool claims, so the hedge is asserted explicitly.
    expect(de.app.limits).toContain('keine Prognosen');
    expect(de.metrics.emissionsMtNote).toContain('Untergrenze');
    expect(de.uncertainty.frequencyNote).toContain('keine Prognose');
    expect(de.levers.flexibilityNote).toContain('optimistische Lesart');
    expect(de.compare.overlapNote).toContain('kein Darstellungsfehler');
    expect(de.tornado.note).toContain('keine Wechselwirkungen');
  });

  it('resolves the locale from the URL first, then the browser, then English', () => {
    expect(resolveLocale('?lang=de', ['en-US'])).toBe('de');
    expect(resolveLocale('', ['de-AT', 'en'])).toBe('de');
    expect(resolveLocale('', ['fr-FR'])).toBe('en');
    expect(resolveLocale('?lang=klingon', ['fr'])).toBe('en');
  });

  it('fmt fills placeholders and leaves unknown ones visible', () => {
    expect(fmt('{a} and {b}', { a: 1, b: 'two' })).toBe('1 and two');
    expect(fmt('{a} and {missing}', { a: 1 })).toBe('1 and {missing}');
  });
});
