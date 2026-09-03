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
const reviewPackage = read('../../../docs/review-package.md');
const fallstudien = read('../../../docs/fallstudien.md');
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
      // Luxembourg was the sole 2045 flag until #39 applied the measured peakFactor trend --
      // that alone pushes it under both thresholds, so the central run now flags nobody.
      expect(facts.flags2045).toBe('');
      expect(modelNotes).not.toMatch(/Ireland and Luxembourg trip it/);
    });

    it('quotes Monte Carlo flag frequencies that the sampler reproduces', () => {
      for (const { pct } of facts.mcFlagFrequency) {
        expect(modelNotes, `model-notes.md should quote ${pct}%`).toContain(`${pct}%`);
      }
      // Ireland used to appear in no sampled run at all, and this assertion said so. Deriving
      // peakFactor from measured load (#39) lowered Ireland's and raised its peak share, and it
      // showed up in 2.0% of runs. Applying the measured trend on top (#39, this PR) pushes it
      // further still, to 16.5% -- the same trend that clears Luxembourg from the deterministic
      // run leaves it exposed under sampled uncertainty far more often than before. The assertion
      // is inverted rather than deleted, because the country crossing into the sampled flag
      // distribution is exactly the kind of change the prose must not be allowed to miss.
      expect(facts.mcFlagFrequency.map((f) => f.iso)).toContain('IE');
    });
  });

  describe('docs/review-package.md and docs/fallstudien.md', () => {
    // Both quote model output and neither was covered when C1 was fixed, so both went stale the
    // first time the peak construct changed (issue #30, B1). The reviewer package and the case
    // studies are the two documents an outsider actually reads; they belong under the same guard.
    it('review package quotes the peak shares the model produces', () => {
      expect(reviewPackage).toContain(facts.luPeakShare2045Pct);
      expect(reviewPackage).toContain(facts.iePeakShare2045Pct);
    });

    it('case studies quote the peak shares, in their own number format', () => {
      expect(fallstudien).toContain(facts.luPeakShare2045PctDe);
      expect(fallstudien).toContain(facts.luPeakShare2045BoomPctDe);
      expect(fallstudien).toContain(facts.iePeakShare2045PctDe);
    });

    it('case studies name the countries the boom run actually flags', () => {
      // The single figure most likely to be left behind: it is prose in three places and a
      // screenshot caption, and it changes whenever the flag arithmetic changes.
      // Lithuania's fifth crossing of the 15% line. LV,LU → LT,EE,LV,LU (B1) → EE,LV,LU (A4)
      // → LT,EE,LV,LU (#39 measured peak factors) → EE,LV,LU (#39 trend applied, this PR):
      // the rising peakFactor trend pushes Lithuania back under the line in the boom run too.
      expect(facts.flags2045Boom).toBe('EE, LV, LU');
      for (const iso of facts.flags2045Boom.split(', ')) {
        const name = { LT: 'Litauen', EE: 'Estland', LV: 'Lettland', LU: 'Luxemburg' }[iso]!;
        expect(fallstudien, `fallstudien.md should name ${name}`).toContain(name);
      }
    });
  });

  describe('the saturation ceiling', () => {
    // The notes asserted a fixed 3,000 TWh while the compute-growth lever scales it. Both
    // figures are now generated, so the claim and the arithmetic cannot drift apart again.
    it('quotes the base-case ceiling and the one the boom setting approaches', () => {
      expect(modelNotes).toContain(facts.saturationBaseTwh);
      expect(modelNotes).toContain(facts.saturationBoomTwh);
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
