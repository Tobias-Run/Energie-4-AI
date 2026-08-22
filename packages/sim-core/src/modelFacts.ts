import { dataVersion, scenarioDefaults } from './data.js';
import { runSimulation } from './engine.js';
import { runMonteCarlo } from './modules/monteCarlo.js';

/**
 * Canonical figures about the default run, as pre-formatted strings.
 *
 * The prose documentation quotes numbers from the model. Those numbers were maintained by hand
 * and drifted: an external review found `model-notes.md` wrong in four places at once, including
 * a flag list that contradicted another section of the same file. This module is the single
 * place those figures are produced, and `test/docsConsistency.test.ts` asserts that the
 * documentation still contains what the model actually computes — so the class of error is
 * caught rather than corrected once.
 *
 * Values are strings, formatted exactly as they should appear in prose, so a test can look for
 * them literally and a writer cannot round them "helpfully".
 */
export interface ModelFacts {
  dataVersion: string;
  /** Calibration anchors, as documented in the gate. */
  global2030Twh: string;
  euIncrease2024to2030Twh: string;
  euGrowth2025to2030Pct: string;
  dcShareEu2024Pct: string;
  dcShareEu2030Pct: string;
  dcShareEu2035Pct: string;
  /** Stress flags in the final year of the default run. */
  flags2045: string;
  /** The countries the peak-share criterion trips, with their shares. */
  luPeakShare2045Pct: string;
  iePeakShare2045Pct: string;
  ieShareOfOwnDemand2045Pct: string;
  /** Monte Carlo flag frequencies in the final year, share of runs. */
  mcFlagFrequency: Array<{ iso: string; pct: string }>;
  mcRuns: number;
}

const pct = (x: number, digits = 2) => (x * 100).toFixed(digits);

export function modelFacts(): ModelFacts {
  const levers = scenarioDefaults.levers;
  const r = runSimulation({ levers });
  const at = (year: number) => r.aggregates[r.years.indexOf(year)]!;
  const country = (iso: string, year: number) => r.countries[iso]![r.years.indexOf(year)]!;

  const eu2024 = at(2024).euDcTwh;
  const eu2025 = at(2025).euDcTwh;
  const eu2030 = at(2030).euDcTwh;

  const mc = runMonteCarlo({ levers, runs: 200, seed: 1 });
  const mcFlagFrequency = Object.entries(mc.flagFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([iso, share]) => ({ iso, pct: pct(share, 1) }));

  return {
    dataVersion,
    global2030Twh: at(2030).globalDcTwh.toFixed(0),
    euIncrease2024to2030Twh: (eu2030 - eu2024).toFixed(2),
    euGrowth2025to2030Pct: pct(eu2030 / eu2025 - 1, 1),
    dcShareEu2024Pct: pct(at(2024).euDcShareOfDemand),
    dcShareEu2030Pct: pct(at(2030).euDcShareOfDemand),
    dcShareEu2035Pct: pct(at(2035).euDcShareOfDemand),
    flags2045: at(2045).flaggedRegions.join(', '),
    luPeakShare2045Pct: pct(country('LU', 2045).dcShareOfPeak),
    iePeakShare2045Pct: pct(country('IE', 2045).dcShareOfPeak),
    ieShareOfOwnDemand2045Pct: pct(
      country('IE', 2045).dcEnergyTwh / country('IE', 2045).totalDemandTwh,
    ),
    mcFlagFrequency,
    mcRuns: mc.runs,
  };
}
