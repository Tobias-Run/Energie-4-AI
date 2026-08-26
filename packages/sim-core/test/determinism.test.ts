import { describe, expect, it } from 'vitest';
import { runMonteCarlo, runSimulation } from '../src/index.js';
import { scenarioDefaults } from '../src/data.js';

function comparable(r: ReturnType<typeof runSimulation>) {
  // runtimeMs legitimately differs between runs
  const { runtimeMs: _runtimeMs, ...meta } = r.meta;
  return { years: r.years, countries: r.countries, aggregates: r.aggregates, meta };
}

/**
 * Reproducibility (mission document §7).
 *
 * This file used to assert that two runs at the same seed agree — which they do, and which
 * established nothing: a single run draws no random numbers at all, so the comparison was
 * between two identical deterministic computations (issue #31, C4). `mulberry32(cfg.seed)` was
 * called and its result discarded; that dead call is gone.
 *
 * What is worth asserting is the pair of real properties: a single run is seed-INdependent, and
 * the Monte Carlo sampler — the only part that draws — is seed-dependent and reproducible.
 */
describe('reproducibility requirement (mission document §7)', () => {
  it('produces identical output at different seeds: a single run draws nothing', () => {
    const a = runSimulation({ seed: 1 });
    const b = runSimulation({ seed: 987654321 });
    const strip = (r: ReturnType<typeof runSimulation>) => {
      const c = comparable(r);
      return { ...c, meta: { ...c.meta, seed: 0 } };
    };
    expect(strip(a)).toEqual(strip(b));
  });

  it('records the seed it was given, so an export says how it was produced', () => {
    expect(runSimulation({ seed: 42 }).meta.seed).toBe(42);
  });

  it('makes the Monte Carlo sampler reproducible, and only it responds to the seed', () => {
    const levers = scenarioDefaults.levers;
    const a = runMonteCarlo({ levers, runs: 40, seed: 7 });
    const b = runMonteCarlo({ levers, runs: 40, seed: 7 });
    const c = runMonteCarlo({ levers, runs: 40, seed: 8 });
    expect(a.flagFrequency).toEqual(b.flagFrequency);
    // A different seed must actually change the draw, or the sampler is not sampling.
    expect(c.flagFrequency).not.toEqual(a.flagFrequency);
  });

  it('runs a full 20-year default scenario in under 100 ms (performance budget §6)', () => {
    runSimulation(); // warm-up (JIT)
    const warm = runSimulation();
    expect(warm.meta.runtimeMs).toBeLessThan(100);
  });

  it('covers 2024 (data base year) through 2045, whatever startYear says', () => {
    // startYear is a reporting convention; the integration always begins at the data base year.
    const r = runSimulation({ startYear: 2035 });
    expect(r.years[0]).toBe(2024);
    expect(r.years[r.years.length - 1]).toBe(2045);
    expect(r.meta.startYear).toBe(2035);
  });
});
