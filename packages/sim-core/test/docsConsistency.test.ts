import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { modelFacts } from '../src/modelFacts.js';

/**
 * The prose documentation quotes numbers from the model. They were maintained by hand and drifted:
 * an external review found `model-notes.md` wrong in four places at once — a stale bundle version,
 * two calibration figures, a flag list that contradicted another section of the same file, and
 * Monte Carlo frequencies naming a country that is no longer flagged at all. The README carried
 * four favourably rounded figures and a test-count badge off by a factor of four.
 *
 * Correcting those once would have left the mechanism intact. These tests fail the build whenever
 * a documented figure stops matching a fresh run, so the class of error cannot recur silently.
 *
 * Figures are compared as the exact formatted strings `modelFacts()` produces. That is deliberate:
 * a tolerance would let "helpful" rounding back in, which is precisely what the README did.
 */
const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

const modelNotes = read('../../../docs/model-notes.md');
const readme = read('../../../README.md');
const facts = modelFacts();

describe('documentation matches the model', () => {
  describe('docs/model-notes.md', () => {
    it('states the current data bundle version', () => {
      expect(modelNotes).toContain(`**v${facts.dataVersion}**`);
    });

    it('quotes the calibration figures the model produces', () => {
      for (const value of [
        facts.euIncrease2024to2030Twh,
        facts.euGrowth2025to2030Pct,
        facts.dcShareEu2030Pct,
        facts.dcShareEu2035Pct,
        facts.dcShareEu2024Pct,
      ]) {
        expect(modelNotes, `model-notes.md should quote ${value}`).toContain(value);
      }
    });

    it('names the countries actually flagged in 2045, and their peak shares', () => {
      expect(modelNotes).toContain(facts.luPeakShare2045Pct);
      expect(modelNotes).toContain(facts.iePeakShare2045Pct);
      // Ireland is held below the line by its connection ceiling; the file used to claim it trips.
      expect(facts.flags2045).toBe('LU');
      expect(modelNotes).not.toMatch(/Ireland and Luxembourg trip it/);
    });

    it('quotes Monte Carlo flag frequencies that the sampler reproduces', () => {
      for (const { pct } of facts.mcFlagFrequency) {
        expect(modelNotes, `model-notes.md should quote ${pct}%`).toContain(`${pct}%`);
      }
      // Ireland must not be listed as a flagged country: it appears in no sampled run.
      expect(facts.mcFlagFrequency.map((f) => f.iso)).not.toContain('IE');
    });
  });

  describe('README.md', () => {
    it('quotes the calibration figures the model produces', () => {
      for (const value of [
        facts.euIncrease2024to2030Twh,
        facts.euGrowth2025to2030Pct,
        facts.dcShareEu2030Pct,
        facts.dcShareEu2035Pct,
      ]) {
        expect(readme, `README.md should quote ${value}`).toContain(value);
      }
    });

    it('does not carry the superseded rounded figures', () => {
      for (const stale of ['+45.0 |', '+54%', '4.4%', '5.6%']) {
        expect(readme, `README.md still contains the stale figure ${stale}`).not.toContain(stale);
      }
    });
  });
});
