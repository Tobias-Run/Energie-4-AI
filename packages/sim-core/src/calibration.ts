import { calibrationAnchors, countries } from './data.js';
import { runSimulation } from './engine.js';
import type { SimulationResult } from './types.js';

/**
 * Validation gate V1 (mission document §5, §10.1).
 *
 * The gate used to report "passing" on five anchors, three of which the model reproduces by
 * construction: the logistic's growth constant is solved so the global curve passes through the
 * 2030 anchor, and the European capture share was set to the +45 TWh anchor. A gate that mostly
 * verifies its own arithmetic cannot fail, and one that cannot fail is not a measurement.
 *
 * Anchors now carry a tier. The verdict is computed from the `independent` tier alone — the
 * anchors that can actually come out negative — and it is published as computed, including when
 * it is negative. `contested` anchors come from sources that disagree with the designated
 * authority; they are measured and reported but do not decide the verdict, because the model
 * cannot follow two mutually exclusive readings at once.
 */
export type AnchorTier = 'construction' | 'independent' | 'contested';

export interface AnchorResult {
  id: string;
  tier: AnchorTier;
  label: string;
  sourceId: string;
  unit: string;
  note: string;
  /** Published target: a number, a lower bound, or a set of ISO codes. */
  target: number | string[];
  /** What the default run produces on the same definition. */
  model: number | string[];
  /** Signed relative deviation from a numeric target; undefined for set comparisons. */
  deviation?: number;
  tolerance?: number;
  met: boolean;
}

export interface CalibrationReport {
  anchors: AnchorResult[];
  /** Anchors in the `independent` tier that the default run does not reproduce. */
  missed: AnchorResult[];
  independentCount: number;
  /** True only if every independent anchor is met. */
  passed: boolean;
  /** One line, suitable for a badge, a README table header or the UI. */
  verdict: string;
}

/** How each anchor id is read off a run. Sets are returned in descending size order. */
const readers: Record<string, (r: SimulationResult) => number | string[]> = {
  globalDc2030Twh: (r) => at(r, 2030).globalDcTwh,
  euDcIncrease2024to2030Twh: (r) => at(r, 2030).euDcTwh - at(r, 2024).euDcTwh,
  euDcGrowthRatio2025to2030Min: (r) => at(r, 2030).euDcTwh / at(r, 2025).euDcTwh,
  europeDc2024Twh: (r) => at(r, 2024).europeDcTwh,
  europeDc2030TwhMin: (r) => at(r, 2030).europeDcTwh,
  europeDc2035TwhMin: (r) => at(r, 2035).europeDcTwh,
  europeItPower2024Gw: (r) => itPowerGw(r, 2024, () => true),
  euItPower2024Gw: (r) => itPowerGw(r, 2024, (iso) => eu27.has(iso)),
  europeTopFiveSet2024: (r) => rankedIsos(r, 2024).slice(0, 5),
  europeNamedCountrySet2024: (r) => rankedIsos(r, 2024).slice(0, 14),
  euDcShareOfDemand2030: (r) => at(r, 2030).euDcShareOfDemand,
  euDcShareOfDemand2035: (r) => at(r, 2035).euDcShareOfDemand,
  europeDc2030TwhEmber: (r) => at(r, 2030).europeDcTwh,
  europeDc2030TwhIea: (r) => at(r, 2030).europeDcTwh,
};

const eu27 = new Set(countries.filter((c) => c.eu27).map((c) => c.iso));

const at = (r: SimulationResult, year: number) => r.aggregates[r.years.indexOf(year)]!;

/**
 * Installed IT power, not average load: `dcItLoadGw` divides utilisation back out. It is a
 * nameplate-sum concept (Delegated Regulation (EU) 2024/1364, Art. 2(14) — "installed IT power
 * demand") -- NOT the same quantity ENTSO-E reports as "IT power supply", which EUDCA's own
 * source material describes as an Art. 2(15)-style "available IT power" concept, roughly double
 * the installed-nominal figure (48%, EUDCA 2025, p.22). This function's comment used to claim
 * the two concepts were the same; issue #34 settled that they are not (see the anchor notes).
 */
function itPowerGw(r: SimulationResult, year: number, keep: (iso: string) => boolean): number {
  const i = r.years.indexOf(year);
  return Object.entries(r.countries)
    .filter(([iso]) => keep(iso))
    .reduce((sum, [, series]) => sum + series[i]!.dcItLoadGw, 0);
}

function rankedIsos(r: SimulationResult, year: number): string[] {
  const i = r.years.indexOf(year);
  return Object.entries(r.countries)
    .map(([iso, series]) => [iso, series[i]!.dcEnergyTwh] as const)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([iso]) => iso);
}

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

/** Evaluate every anchor against a run. Defaults to the default run. */
export function calibrationReport(result: SimulationResult = runSimulation()): CalibrationReport {
  const provenance = calibrationAnchors.provenance;
  const anchors: AnchorResult[] = Object.entries(calibrationAnchors.anchors).map(([id, spec]) => {
    const model = readers[id]!(result);
    const base = {
      id,
      tier: spec.tier,
      label: spec.label,
      sourceId: provenance[id] ?? 'expert-guess',
      unit: spec.unit,
      note: spec.note,
      target: spec.value,
      model,
    };

    if (spec.comparison === 'setEquals') {
      return { ...base, met: sameSet(model as string[], spec.value as string[]) };
    }

    const target = spec.value as number;
    const value = model as number;
    const deviation = value / target - 1;
    const met =
      spec.comparison === 'atLeast' ? value >= target : Math.abs(deviation) <= spec.tolerance!;
    return { ...base, deviation, tolerance: spec.tolerance, met };
  });

  const independent = anchors.filter((a) => a.tier === 'independent');
  const missed = independent.filter((a) => !a.met);
  const passed = missed.length === 0;

  return {
    anchors,
    missed,
    independentCount: independent.length,
    passed,
    verdict: passed
      ? `passing — ${independent.length} of ${independent.length} independent anchors met`
      : `FAILING — ${missed.length} of ${independent.length} independent anchors missed ` +
        `(${missed.map((a) => a.id).join(', ')})`,
  };
}

/** The source the model follows where published volume estimates disagree (issue #26). */
export const authoritativeVolumeSource = calibrationAnchors.authoritativeVolumeSource;
