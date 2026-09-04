import { describe, expect, it } from 'vitest';
import {
  runMonteCarlo,
  sampleTriangular,
  uncertaintyRanges,
  scenarioDefaults,
} from '../src/index.js';
import { globalCompute } from '../src/data.js';
import { mulberry32 } from '../src/rng.js';

// taken from the bundle so new levers do not silently drop out of these runs
const LEVERS = scenarioDefaults.levers;

describe('uncertainty ranges (issue #5)', () => {
  it('every central value matches the shipped bundle value', () => {
    const resolve = (path: string): number => {
      const parts = path.split('.');
      const root: Record<string, unknown> = { scenarioDefaults, globalCompute };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let node: any = root;
      for (const part of parts) node = node[part];
      return node as number;
    };
    for (const [path, r] of Object.entries(uncertaintyRanges)) {
      expect(resolve(path), `${path} central`).toBeCloseTo(r.central, 9);
    }
  });

  it('ranges are ordered low <= central <= high', () => {
    for (const [path, r] of Object.entries(uncertaintyRanges)) {
      expect(r.low, path).toBeLessThanOrEqual(r.central);
      expect(r.central, path).toBeLessThanOrEqual(r.high);
      expect(r.low, path).toBeLessThan(r.high);
    }
  });

  it('triangular sampling stays inside its bounds and centers near the mode', () => {
    const rng = mulberry32(7);
    const r = {
      low: 1,
      central: 2,
      high: 6,
      rationale: '',
      source_id: 'expert-guess',
      kind: 'physical' as const,
    };
    const draws = Array.from({ length: 4000 }, () => sampleTriangular(r, rng));
    expect(Math.min(...draws)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...draws)).toBeLessThanOrEqual(6);
    const mean = draws.reduce((a, b) => a + b, 0) / draws.length;
    expect(mean).toBeCloseTo((1 + 2 + 6) / 3, 1); // triangular mean = (a+c+b)/3
  });
});

describe('Monte Carlo mode (issue #5)', () => {
  it('is deterministic for a given seed and differs across seeds', () => {
    const a = runMonteCarlo({ levers: LEVERS, runs: 30, seed: 11 });
    const b = runMonteCarlo({ levers: LEVERS, runs: 30, seed: 11 });
    const c = runMonteCarlo({ levers: LEVERS, runs: 30, seed: 12 });
    expect(a.corridor.p50).toEqual(b.corridor.p50);
    expect(a.corridor.p50).not.toEqual(c.corridor.p50);
  });

  it('produces an ordered corridor that brackets the central run', () => {
    const r = runMonteCarlo({ levers: LEVERS, runs: 60, seed: 4 });
    for (let i = 0; i < r.corridor.years.length; i++) {
      expect(r.corridor.p10[i]!).toBeLessThanOrEqual(r.corridor.p50[i]!);
      expect(r.corridor.p50[i]!).toBeLessThanOrEqual(r.corridor.p90[i]!);
    }
    // by the final year the band must be non-degenerate and contain the central path
    const last = r.corridor.years.length - 1;
    expect(r.corridor.p90[last]! - r.corridor.p10[last]!).toBeGreaterThan(0);
    expect(r.corridor.central[last]!).toBeGreaterThanOrEqual(r.corridor.p10[last]!);
    expect(r.corridor.central[last]!).toBeLessThanOrEqual(r.corridor.p90[last]!);
  });

  it('ranks the tornado by swing, led by the global compute drivers', () => {
    const r = runMonteCarlo({ levers: LEVERS, runs: 10, seed: 4 });
    for (let i = 1; i < r.tornado.length; i++) {
      expect(r.tornado[i - 1]!.swing).toBeGreaterThanOrEqual(r.tornado[i]!.swing);
    }
    // Which of the two leads depends on the target year: the 2030 anchor shapes the early
    // trajectory, the saturation level dominates once the logistic curve flattens (2045).
    expect(r.tornado[0]!.path.startsWith('globalCompute.')).toBe(true);
  });

  it('parameters that cannot affect DC demand show zero swing on that target', () => {
    const r = runMonteCarlo({ levers: LEVERS, runs: 10, seed: 4 });
    const byPath = Object.fromEntries(r.tornado.map((t) => [t.path, t.swing]));
    // emission factors are downstream of demand, so they move emissions but never demand
    expect(byPath['scenarioDefaults.gasEmissionFactorMtPerTwh']).toBeCloseTo(0, 9);
    // the flag threshold is a reporting cut-off, not a driver of the demand path
    expect(byPath['scenarioDefaults.stressFlagThreshold']).toBeCloseTo(0, 9);
  });

  it('reports flag frequencies as shares in [0,1]', () => {
    const r = runMonteCarlo({ levers: LEVERS, runs: 40, seed: 4 });
    for (const [iso, f] of Object.entries(r.flagFrequency)) {
      expect(f, iso).toBeGreaterThan(0);
      expect(f, iso).toBeLessThanOrEqual(1);
    }
  });

  it('meets the performance budget: 200 runs well under 5 s (spec §6)', () => {
    const r = runMonteCarlo({ levers: LEVERS, runs: 200, seed: 4 });
    expect(r.runs).toBe(200);
    expect(r.runtimeMs).toBeLessThan(5000);
  });
});

describe('tornado targets (issue #5)', () => {
  it('the flagged-count target exposes parameters that DC demand hides', () => {
    const demand = runMonteCarlo({ levers: LEVERS, runs: 5, seed: 4, tornadoTarget: 'euDcTwh' });
    const flags = runMonteCarlo({
      levers: LEVERS,
      runs: 5,
      seed: 4,
      tornadoTarget: 'flaggedCount',
    });
    const swing = (r: typeof demand, path: string) => r.tornado.find((t) => t.path === path)!.swing;

    // In the central run the late-horizon flags are triggered by the peak-share criterion,
    // not the adequacy ratio — so this threshold moves the flag map while leaving EU-wide
    // DC demand untouched. That asymmetry is the reason the target is selectable.
    expect(swing(demand, 'scenarioDefaults.dcPeakShareFlagThreshold')).toBeCloseTo(0, 9);
    expect(swing(flags, 'scenarioDefaults.dcPeakShareFlagThreshold')).toBeGreaterThan(0);
    expect(flags.tornadoTarget).toBe('flaggedCount');
  });

  it('the emissions target responds to the emission factors', () => {
    const r = runMonteCarlo({ levers: LEVERS, runs: 5, seed: 4, tornadoTarget: 'euEmissionsMt' });
    expect(
      r.tornado.find((t) => t.path === 'scenarioDefaults.gasEmissionFactorMtPerTwh')!.swing,
    ).toBeGreaterThan(0);
  });
});
