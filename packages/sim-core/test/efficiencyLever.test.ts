import { describe, expect, it } from 'vitest';
import { scenarioDefaults as d } from '../src/data.js';
import { runSimulation } from '../src/index.js';
import type { Levers } from '../src/types.js';

/**
 * The efficiency lever.
 *
 * An external review found that it multiplied only the European additions, leaving the global
 * driver untouched. That made "2%/yr additional efficiency" arithmetically indistinguishable from
 * "Europe captures less compute": the same chips ran elsewhere at the same efficiency and Europe
 * simply got fewer of them. Measured at 3%/yr, Europe's share of global DC energy fell from 8.41%
 * to 6.88% by 2045 while the global curve did not move at all.
 *
 * Efficiency is a technology assumption about the world, so it now acts on the global increment.
 * These tests pin both halves of that: the global total must respond, and Europe's share must not
 * collapse.
 */
const at = (levers: Levers, year: number) => {
  const r = runSimulation({ levers });
  return r.aggregates[r.years.indexOf(year)]!;
};

const base = d.levers;
const withEfficiency = (rate: number): Levers => ({ ...base, extraEfficiencyRate: rate });

describe('efficiency lever', () => {
  it('reduces global demand, not just European demand', () => {
    const off = at(base, 2045);
    const on = at(withEfficiency(0.02), 2045);
    // The whole point: the global curve has to move.
    expect(on.globalDcTwh).toBeLessThan(off.globalDcTwh * 0.9);
  });

  it('leaves Europe roughly its share of a smaller world', () => {
    const shareOf = (a: ReturnType<typeof at>) => a.euDcTwh / a.globalDcTwh;
    const off = shareOf(at(base, 2045));
    const on = shareOf(at(withEfficiency(0.03), 2045));
    // Before the fix this ratio fell by 18%. A small rise remains because the 2024 installed
    // base is not retrofitted, so it grows as a proportion of a slower-growing total — that is
    // the documented additions-only limitation, not relocation.
    expect(on / off).toBeGreaterThan(0.98);
    expect(on / off).toBeLessThan(1.15);
  });

  it('does not touch the default run', () => {
    // Calibration depends on this: efficiencyFactor is 1 at the default rate of zero.
    const a = at(base, 2030);
    expect(a.globalDcTwh).toBeCloseTo(945, 3);
  });

  it('still reduces European demand, monotonically', () => {
    const values = [0, 0.01, 0.02, 0.03].map((rate) => at(withEfficiency(rate), 2045).euDcTwh);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]!).toBeLessThan(values[i - 1]!);
    }
  });
});
