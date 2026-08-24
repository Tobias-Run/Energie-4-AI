import { describe, expect, it } from 'vitest';
import { announcedGw, initPipeline, permittedGw, stepPipeline } from '../src/index.js';
import type { PipelineState } from '../src/modules/gridPipeline.js';

/**
 * Lead-time distribution of the connection pipeline (issue #28, A4).
 *
 * The chain was first-order: one well-mixed stock per phase. Its mean residence time was right,
 * but a share of everything announced left almost immediately and the rest trailed off in a long
 * exponential tail. Measured on the old chain at 9 + 3 nominal years, cumulative deliveries of a
 * 1 GW impulse ran 3.7% in year 1, 9.5% by year 2, 23.4% by year 4 — while the first sentence of
 * the README is that a data centre takes 12–24 months and the grid takes up to a decade.
 *
 * Fixing the step order (#29) removed the same-year delivery; this splits each phase into three
 * sub-stages, which turns the exponential into an Erlang-3 and gives the chain a real minimum.
 */
const empty = (): PipelineState => initPipeline(0, 9, 3);

function impulse(permittingYears: number, constructionYears: number, years = 24): number[] {
  const state = empty();
  const cumulative: number[] = [];
  let total = 0;
  for (let y = 1; y <= years; y++) {
    total += stepPipeline(state, y === 1 ? 1 : 0, permittingYears, constructionYears);
    cumulative.push(total);
  }
  return cumulative;
}

describe('connection pipeline lead time', () => {
  it('delivers nothing for six years — the chain has a real minimum', () => {
    const cum = impulse(9, 3);
    for (let y = 1; y <= 6; y++) {
      expect(cum[y - 1], `year ${y} must still be empty`).toBeCloseTo(0, 12);
    }
    expect(cum[6]!).toBeGreaterThan(0);
  });

  it('keeps the exponential tail from arriving early', () => {
    const cum = impulse(9, 3);
    // Old chain, same nominal durations: 23.4% by year 4 and 49.3% by year 8.
    expect(cum[3]!).toBe(0);
    expect(cum[7]!).toBeLessThan(0.2);
    // and still converges — volume is conserved, just later
    expect(cum[23]!).toBeGreaterThan(0.97);
  });

  it('lets permitting reform move an edge rather than smear a curve', () => {
    // This is why the reform lever was weak: with a first-order lag, 9 → 5 years spread its
    // effect across the whole response instead of shifting when capacity arrives.
    const base = impulse(9, 3);
    const reform = impulse(5, 3);
    expect(base[7]!).toBeLessThan(0.15);
    expect(reform[7]!).toBeGreaterThan(0.4);
    expect(reform[11]!).toBeGreaterThan(0.9);
  });

  it('is an exact fixed point at its initial stocks', () => {
    const state = initPipeline(1, 9, 3);
    for (let y = 0; y < 8; y++) {
      expect(stepPipeline(state, 1, 9, 3)).toBeCloseTo(1, 12);
    }
    expect(announcedGw(state)).toBeCloseTo(9, 9);
    expect(permittedGw(state)).toBeCloseTo(3, 9);
  });

  it('stays stable at the shortest durations the sampler can draw', () => {
    // Sub-stage transfer rate is k / duration and must not exceed 1 in an annual step. The
    // reform permitting duration is sampled as low as 4 and construction is fixed at 3.
    for (const permitting of [4, 4.5, 5, 6]) {
      const state = initPipeline(1, permitting, 3);
      for (let y = 0; y < 30; y++) {
        expect(stepPipeline(state, 1, permitting, 3)).toBeGreaterThanOrEqual(0);
        expect(announcedGw(state)).toBeGreaterThanOrEqual(-1e-12);
        expect(permittedGw(state)).toBeGreaterThanOrEqual(-1e-12);
      }
    }
  });
});
