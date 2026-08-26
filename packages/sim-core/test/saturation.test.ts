import { describe, expect, it } from 'vitest';
import { globalCompute as p } from '../src/data.js';
import { effectiveSaturationTwh, globalDcDemandTwh } from '../src/modules/computeDemand.js';

/**
 * The saturation ceiling and the compute-growth lever (issue #30, B4).
 *
 * The model notes asserted a fixed ceiling of 3,000 TWh while the lever scales growth above the
 * 2024 base — and therefore scales the ceiling. An external review read the resulting 4,228 TWh at
 * ×1.75 as the curve breaking through its ceiling. It is not: the ceiling itself has moved to
 * 4,938.75, and the curve stays below it. These tests pin the relationship the documentation now
 * states, so neither the arithmetic nor the claim can drift away from the other again.
 */
const MULTIPLIERS = [1, 1.25, 1.5, 1.75];

describe('saturation ceiling', () => {
  it('is the base-case ceiling at the default lever setting', () => {
    expect(effectiveSaturationTwh(p, 1)).toBeCloseTo(p.saturationTwh, 9);
  });

  it('scales the growth above the 2024 base, not the whole curve', () => {
    // 415 + (3000 − 415) × 1.75. If this ever becomes saturationTwh × multiplier, the base year
    // would scale too, which would silently move a calibration anchor.
    expect(effectiveSaturationTwh(p, 1.75)).toBeCloseTo(4938.75, 6);
    expect(globalDcDemandTwh(2024, p, 1.75)).toBeCloseTo(p.demand2024Twh, 9);
  });

  it('is the limit the curve approaches, and the curve never exceeds it', () => {
    for (const m of MULTIPLIERS) {
      const ceiling = effectiveSaturationTwh(p, m);
      // Far future stands in for t → ∞; the logistic is monotone so this is the supremum.
      expect(globalDcDemandTwh(2400, p, m)).toBeCloseTo(ceiling, 6);
      for (const year of [2030, 2035, 2045]) {
        expect(
          globalDcDemandTwh(year, p, m),
          `${year} at ×${m} must stay under its own ceiling`,
        ).toBeLessThan(ceiling);
      }
    }
  });

  it('reaches the figures the documentation quotes', () => {
    // The boom run. Quoted in docs/model-notes.md; docsConsistency guards the prose separately.
    expect(globalDcDemandTwh(2045, p, 1.75)).toBeCloseTo(4227.9, 1);
    expect(globalDcDemandTwh(2045, p, 1)).toBeCloseTo(2593.8, 1);
  });
});
