import { describe, expect, it } from 'vitest';
import { regionalBenchmarks } from '../src/data.js';
import {
  benchmarkHorizon,
  benchmarkRegions,
  benchmarkTwh,
  globalEnvelopeTwh,
  runSimulation,
  aggregatesAt,
} from '../src/index.js';

describe('regional benchmarks (issue #13)', () => {
  it('US + China + RoW + EU reference stay within the IEA global envelope (±2%)', () => {
    for (const year of [2024, 2030, 2035]) {
      const sum =
        benchmarkTwh('US', year)! +
        benchmarkTwh('CN', year)! +
        benchmarkTwh('ROW', year)! +
        regionalBenchmarks.euReferenceTwh[String(year)]!;
      const envelope = globalEnvelopeTwh(year)!;
      expect(Math.abs(sum - envelope) / envelope, `year ${year}`).toBeLessThanOrEqual(0.02);
    }
  });

  it('model EU output matches the EU reference used in the envelope (±10%)', () => {
    const r = runSimulation();
    for (const year of [2024, 2030, 2035]) {
      const ref = regionalBenchmarks.euReferenceTwh[String(year)]!;
      expect(aggregatesAt(r, year).euDcTwh).toBeGreaterThanOrEqual(ref * 0.9);
      expect(aggregatesAt(r, year).euDcTwh).toBeLessThanOrEqual(ref * 1.1);
    }
  });

  it('interpolates between anchors and refuses to extrapolate beyond the horizon', () => {
    const us2027 = benchmarkTwh('US', 2027)!;
    expect(us2027).toBeGreaterThan(180);
    expect(us2027).toBeLessThan(425);
    expect(benchmarkTwh('US', benchmarkHorizon() + 1)).toBeNull();
    expect(benchmarkTwh('US', 2023)).toBeNull();
  });

  it('benchmark trajectories are monotonically increasing', () => {
    for (const { id } of benchmarkRegions()) {
      let prev = 0;
      for (let y = 2024; y <= benchmarkHorizon(); y++) {
        const v = benchmarkTwh(id, y)!;
        expect(v, `${id} ${y}`).toBeGreaterThanOrEqual(prev);
        prev = v;
      }
    }
  });
});

describe('supply mix (issue #12)', () => {
  const r = runSimulation();

  it('EU mix categories are positive and fossil share declines over the run', () => {
    const a26 = aggregatesAt(r, 2026);
    const a45 = aggregatesAt(r, 2045);
    for (const a of [a26, a45]) {
      expect(a.euRenewablesTwh).toBeGreaterThan(0);
      expect(a.euNuclearTwh).toBeGreaterThan(0);
      expect(a.euFossilGenTwh).toBeGreaterThan(0);
    }
    const fossilShare = (x: typeof a26) =>
      x.euFossilGenTwh / (x.euRenewablesTwh + x.euNuclearTwh + x.euFossilGenTwh);
    expect(fossilShare(a45)).toBeLessThan(fossilShare(a26));
  });

  it('net-import share is within [0,1] and Luxembourg is a heavy importer', () => {
    for (const [iso, series] of Object.entries(r.countries)) {
      for (const row of series) {
        expect(row.netImportShare, iso).toBeGreaterThanOrEqual(0);
        expect(row.netImportShare, iso).toBeLessThanOrEqual(1);
        expect(row.generationTwh, iso).toBeGreaterThanOrEqual(0);
      }
    }
    const lu2026 = r.countries['LU']![r.years.indexOf(2026)]!;
    expect(lu2026.netImportShare).toBeGreaterThan(0.5);
  });

  it('adequacy is not broadly broken at the start of the run', () => {
    // Not asserting an empty set: with sourced, direction-aware NTCs some systems sit
    // close to the flag threshold from year one. What would signal a broken model is
    // many countries flagged at once.
    expect(aggregatesAt(r, 2026).flaggedRegions.length).toBeLessThanOrEqual(3);
  });
});
