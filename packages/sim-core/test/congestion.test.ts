import { describe, expect, it } from 'vitest';
import { globalCompute, scenarioDefaults } from '../src/data.js';
import { runSimulation } from '../src/index.js';

/**
 * The congestion-cost proxy (issue #35).
 *
 * It is a euro baseline scaled by how much worse Europe's demand-weighted stress has become since
 * 2024. It used to divide by the base-year index *of the same run*, so a parameter that changed
 * 2024 stress moved numerator and denominator together — and `ntcUtilization` moved the
 * denominator more, which made the reported cost rise as import capability rose. Measured before
 * the fix: €3.455 bn at u=0.30 against €3.505 bn at u=0.90, while the stress it is built from fell
 * in every country.
 *
 * Parameters are perturbed here the way `runMonteCarlo` perturbs them — a cloned params object,
 * not a mutation of the module-level defaults. Mutating those would move the reference too and
 * reproduce the original defect, which is how it survived unnoticed.
 */
const withNtc = (u: number) =>
  runSimulation({
    params: {
      scenarioDefaults: { ...structuredClone(scenarioDefaults), ntcUtilization: u },
      globalCompute,
    },
  });

const at = (r: ReturnType<typeof runSimulation>, year: number) =>
  r.aggregates[r.years.indexOf(year)]!;

describe('congestion cost', () => {
  it('falls as import capability rises, in every year it reports', () => {
    const utilisations = [0.3, 0.45, 0.6, 0.9];
    for (const year of [2024, 2035, 2045]) {
      const series = utilisations.map((u) => at(withNtc(u), year).congestionCostBnEur);
      for (let i = 1; i < series.length; i++) {
        expect(
          series[i]!,
          `${year}: u=${utilisations[i]} should not cost more than u=${utilisations[i - 1]}`,
        ).toBeLessThan(series[i - 1]!);
      }
    }
  });

  it('anchors the default run on the published 2024 euro baseline', () => {
    // The reference index is the default 2024 system, so the default run reproduces the baseline
    // exactly. This is what makes the figure interpretable rather than merely monotone.
    expect(at(runSimulation(), 2024).congestionCostBnEur).toBeCloseTo(
      scenarioDefaults.congestionBaselineBnEur2024,
      9,
    );
  });

  it('does not anchor a perturbed run there — 2024 is a different system', () => {
    // The old normalisation forced every run through the same 2024 value, which hid exactly the
    // effect the metric exists to show.
    expect(at(withNtc(0.9), 2024).congestionCostBnEur).toBeLessThan(
      scenarioDefaults.congestionBaselineBnEur2024 * 0.95,
    );
  });
});
