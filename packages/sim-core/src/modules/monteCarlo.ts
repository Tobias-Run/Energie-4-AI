import {
  globalCompute,
  scenarioDefaults,
  uncertaintyRanges,
  type GlobalComputeParams,
  type ScenarioDefaults,
  type UncertaintyRange,
} from '../data.js';
import { runSimulation } from '../engine.js';
import { mulberry32, type Rng } from '../rng.js';
import type { Levers, SimParams } from '../types.js';

export interface CorridorBand {
  years: number[];
  /** Percentile trajectories of EU-27 DC demand (TWh). */
  p10: number[];
  p50: number[];
  p90: number[];
  /** The unperturbed central run, for reference against the sampled median. */
  central: number[];
}

export interface TornadoEntry {
  path: string;
  rationale: string;
  sourceId: string;
  /** 'threshold' entries say the cutoff convention is unsettled, not that the world is
   *  uncertain -- a different kind of not-knowing (issue #30, B3). Kept separate from
   *  'physical' ones wherever they would otherwise share one band. */
  kind: 'physical' | 'threshold';
  /** Target metric when this parameter alone is set to its low / high bound. */
  lowValue: number;
  highValue: number;
  centralValue: number;
  /** Absolute spread, used for ranking. */
  swing: number;
}

export interface MonteCarloResult {
  runs: number;
  seed: number;
  tornadoTarget: TornadoTarget;
  corridor: CorridorBand;
  /** Share of runs in which each country is stress-flagged in the final year. */
  flagFrequency: Record<string, number>;
  tornado: TornadoEntry[];
  runtimeMs: number;
}

/** Triangular inverse-CDF sample — the standard choice for expert-elicited low/mode/high. */
export function sampleTriangular(r: UncertaintyRange, rng: Rng): number {
  const { low: a, high: b, central: c } = r;
  if (b <= a) return c;
  const u = rng();
  const fc = (c - a) / (b - a);
  return u < fc ? a + Math.sqrt(u * (b - a) * (c - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - c));
}

function clone(): SimParams {
  return {
    scenarioDefaults: structuredClone(scenarioDefaults) as ScenarioDefaults,
    globalCompute: structuredClone(globalCompute) as GlobalComputeParams,
  };
}

/** Write a value addressed by a dotted path (e.g. 'scenarioDefaults.ntcUtilization'). */
function setPath(params: SimParams, path: string, value: number): void {
  const parts = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = params;
  for (let i = 0; i < parts.length - 1; i++) node = node[parts[i]!];
  node[parts[parts.length - 1]!] = value;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return lo === hi ? sorted[lo]! : sorted[lo]! + (idx - lo) * (sorted[hi]! - sorted[lo]!);
}

/**
 * What the tornado measures. EU DC demand is blind to the grid parameters — at EU level the
 * connection pipeline redistributes rather than removes load — so a second target is offered
 * that exposes exactly those: how many regions end up stress-flagged.
 */
export type TornadoTarget = 'euDcTwh' | 'flaggedCount' | 'euEmissionsMt';

export const TORNADO_TARGETS: Record<TornadoTarget, { label: string; unit: string }> = {
  euDcTwh: { label: 'EU-27 data center demand', unit: 'TWh' },
  flaggedCount: { label: 'Number of stress-flagged regions', unit: 'regions' },
  euEmissionsMt: { label: 'Europe power-sector emissions', unit: 'Mt' },
};

export interface MonteCarloConfig {
  runs?: number;
  seed?: number;
  levers: Levers;
  endYear?: number;
  /** Metric the one-at-a-time sensitivity is measured on. Default: EU DC demand. */
  tornadoTarget?: TornadoTarget;
}

/**
 * Client-side Monte Carlo over the source-tracked uncertainty ranges (mission document §5.5).
 * Deterministic for a given seed: the same seed reproduces the same corridor exactly.
 *
 * The tornado is a one-at-a-time sensitivity — each parameter is pushed to its bounds while
 * every other stays central — so entries are directly comparable but do not capture
 * interactions between parameters. The corridor, which samples all parameters jointly, does.
 */
export function runMonteCarlo(config: MonteCarloConfig): MonteCarloResult {
  const t0 = performance.now();
  const runs = config.runs ?? 200;
  const seed = config.seed ?? 4;
  const rng = mulberry32(seed);
  const paths = Object.keys(uncertaintyRanges);

  const central = runSimulation({ levers: config.levers, endYear: config.endYear });
  const years = central.years;
  const targetIdx = years.length - 1;

  // per-year samples of EU DC demand across runs
  const byYear: number[][] = years.map(() => []);
  const flagCounts: Record<string, number> = {};

  for (let i = 0; i < runs; i++) {
    const params = clone();
    for (const path of paths)
      setPath(params, path, sampleTriangular(uncertaintyRanges[path]!, rng));
    const r = runSimulation({ levers: config.levers, endYear: config.endYear, params });
    r.aggregates.forEach((a, y) => byYear[y]!.push(a.euDcTwh));
    for (const iso of r.aggregates[targetIdx]!.flaggedRegions) {
      flagCounts[iso] = (flagCounts[iso] ?? 0) + 1;
    }
  }

  const sorted = byYear.map((v) => v.slice().sort((a, b) => a - b));
  const corridor: CorridorBand = {
    years,
    p10: sorted.map((v) => percentile(v, 0.1)),
    p50: sorted.map((v) => percentile(v, 0.5)),
    p90: sorted.map((v) => percentile(v, 0.9)),
    central: central.aggregates.map((a) => a.euDcTwh),
  };

  const flagFrequency: Record<string, number> = {};
  for (const [iso, n] of Object.entries(flagCounts)) flagFrequency[iso] = n / runs;

  // one-at-a-time sensitivity on the selected final-year target
  const targetKind = config.tornadoTarget ?? 'euDcTwh';
  const readTarget = (a: (typeof central.aggregates)[number]): number => {
    switch (targetKind) {
      case 'flaggedCount':
        return a.flaggedRegions.length;
      case 'euEmissionsMt':
        return a.europeEmissionsMt;
      default:
        return a.euDcTwh;
    }
  };
  const centralTarget = readTarget(central.aggregates[targetIdx]!);
  const tornado: TornadoEntry[] = paths
    .map((path) => {
      const range = uncertaintyRanges[path]!;
      const at = (v: number) => {
        const params = clone();
        setPath(params, path, v);
        return readTarget(
          runSimulation({ levers: config.levers, endYear: config.endYear, params }).aggregates[
            targetIdx
          ]!,
        );
      };
      const lowValue = at(range.low);
      const highValue = at(range.high);
      return {
        path,
        rationale: range.rationale,
        sourceId: range.source_id,
        kind: range.kind,
        lowValue,
        highValue,
        centralValue: centralTarget,
        swing: Math.abs(highValue - lowValue),
      };
    })
    .sort((a, b) => b.swing - a.swing);

  return {
    runs,
    seed,
    tornadoTarget: targetKind,
    corridor,
    flagFrequency,
    tornado,
    runtimeMs: performance.now() - t0,
  };
}
