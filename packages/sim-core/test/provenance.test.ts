import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { provenanceMaps } from '../src/index.js';

/**
 * Source-tracking rule (mission document §8.3): every parameter's source_id must
 * reference an entry in /docs/sources.bib or be the reserved value 'expert-guess'.
 */
const bibPath = fileURLToPath(new URL('../../../docs/sources.bib', import.meta.url));
const bib = readFileSync(bibPath, 'utf8');
const bibKeys = new Set([...bib.matchAll(/^@\w+\{([^,]+),/gm)].map((m) => m[1].trim()));

describe('data provenance (source-tracking rule §8.3)', () => {
  it('finds BibTeX keys in docs/sources.bib', () => {
    expect(bibKeys.size).toBeGreaterThanOrEqual(10);
  });

  for (const [bundle, provenance] of Object.entries(provenanceMaps)) {
    it(`${bundle}: every source_id resolves to sources.bib or 'expert-guess'`, () => {
      expect(Object.keys(provenance).length).toBeGreaterThan(0);
      for (const [field, sourceId] of Object.entries(provenance)) {
        const ok = sourceId === 'expert-guess' || bibKeys.has(sourceId);
        expect(ok, `${bundle} → ${field} → '${sourceId}' is not a known source`).toBe(true);
      }
    });
  }
});
