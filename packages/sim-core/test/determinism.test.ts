import { describe, expect, it } from 'vitest';
import { runSimulation } from '../src/index.js';

function comparable(r: ReturnType<typeof runSimulation>) {
  // runtimeMs legitimately differs between runs
  const { runtimeMs: _runtimeMs, ...meta } = r.meta;
  return { years: r.years, countries: r.countries, aggregates: r.aggregates, meta };
}

describe('reproducibility requirement (mission document §7)', () => {
  it('is deterministic given a seed', () => {
    const a = runSimulation({ seed: 42 });
    const b = runSimulation({ seed: 42 });
    expect(comparable(a)).toEqual(comparable(b));
  });

  it('runs a full 20-year default scenario in under 100 ms (performance budget §6)', () => {
    runSimulation(); // warm-up (JIT)
    const warm = runSimulation();
    expect(warm.meta.runtimeMs).toBeLessThan(100);
  });

  it('covers 2024 (data base year) through 2045', () => {
    const r = runSimulation();
    expect(r.years[0]).toBe(2024);
    expect(r.years[r.years.length - 1]).toBe(2045);
  });
});
