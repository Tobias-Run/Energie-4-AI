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

  describe('the calibration verdict, wherever it is published', () => {
    // The gate said "passing" for months while it was reproducing its own inputs. The verdict is
    // now computed, and the two documents that state it must state the computed one — including
    // the count of missed anchors, which is the part a future change is most likely to leave stale.
    const missed = facts.calibrationVerdict.match(/(\d+) of (\d+)/)!;

    it('is negative, and both documents say so', () => {
      expect(facts.calibrationPassed).toBe(false);
      for (const [name, doc] of [
        ['model-notes.md', modelNotes],
        ['README.md', readme],
      ] as const) {
        expect(doc, `${name} must state the verdict`).toContain(
          `${missed[1]} of ${missed[2]} independent anchors missed`,
        );
        expect(doc, `${name} must not claim the gate passes`).not.toMatch(
          /gate[^.]{0,40}currently passing/i,
        );
      }
    });

    it('quotes the deviation of every missed anchor', () => {
      for (const id of ['europeDc2035TwhMin', 'europeItPower2024Gw', 'euItPower2024Gw']) {
        const a = facts.anchorDeviations.find((x) => x.id === id)!;
        // Deviations are written with a minus sign in prose, so compare the magnitude.
        const magnitude = a.dev.replace('-', '');
        expect(modelNotes, `model-notes.md should quote ${id} at ${magnitude}`).toContain(
          magnitude,
        );
        expect(readme, `README.md should quote ${id} at ${magnitude}`).toContain(magnitude);
      }
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
      // Only the two that stay unambiguous. The share figures used to be blocked here too, but
      // '5.6%' is now a legitimate deviation in the anchor table; they are positively asserted
      // against modelFacts above, which is the stronger check anyway.
      for (const stale of ['+45.0 |', '+54%']) {
        expect(readme, `README.md still contains the stale figure ${stale}`).not.toContain(stale);
      }
    });
  });
});
