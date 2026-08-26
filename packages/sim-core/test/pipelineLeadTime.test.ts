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
    //
    // Note what this does NOT cover: it initialises with the same duration it steps with, so
    // `stagesFor` always matches and the rate never exceeds 1 by construction. The engine does
    // the opposite — it initialises at the baseline duration and steps at the lever's. That gap
    // is what the block below exercises (issue #43).
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

/**
 * Stage count and step duration come from different places (issue #43).
 *
 * `stagesFor` sizes the stage array once, at initialisation, and `engine.ts` initialises with the
 * **baseline** permitting duration even when the reform lever is on — deliberately, since sizing
 * the backlog for the reform duration would make reform a mathematical no-op. So the array holds
 * three stages sized by a 9-year baseline while the step may use a much shorter duration, and the
 * transfer rate `k / duration` is then free to exceed 1.
 *
 * Measured before the clamp, initialising at 9 + 3 and stepping a 1 GW impulse:
 *
 *   permitting 3 (rate 1.00) → cumulative 1.000, stocks ≥ 0
 *   permitting 2 (rate 1.50) → cumulative 0.998, **stocks to −5.06 GW**
 *   permitting 1 (rate 3.00) → cumulative −4.18e8, stocks to −4.78e9
 *
 * The middle row is the reason these assertions are on stocks rather than on totals. At moderate
 * overshoot the cumulative delivery still reads 0.998 — an aggregate check passes while the chain
 * underneath it is nonsense. Only outright divergence is visible from the total.
 */
describe('delay chain stability when init and step durations disagree', () => {
  /** Initialise at the 9 + 3 baseline, the way the engine does, then step at `permitting`. */
  function mismatched(permitting: number, years = 30) {
    const state = initPipeline(0, 9, 3);
    let cumulative = 0;
    let lowestStock = 0;
    let lowestOutflow = 0;
    for (let y = 1; y <= years; y++) {
      const built = stepPipeline(state, y === 1 ? 1 : 0, permitting, 3);
      lowestOutflow = Math.min(lowestOutflow, built);
      lowestStock = Math.min(lowestStock, ...state.announced, ...state.permitted);
      cumulative += built;
    }
    return { cumulative, lowestStock, lowestOutflow };
  }

  it('never drives a stock or an outflow negative, at any duration', () => {
    for (const permitting of [12, 9, 5, 4, 3, 2, 1, 0.5]) {
      const { lowestStock, lowestOutflow } = mismatched(permitting);
      expect(
        lowestStock,
        `stocks went negative at permitting=${permitting}`,
      ).toBeGreaterThanOrEqual(-1e-12);
      expect(
        lowestOutflow,
        `outflow went negative at permitting=${permitting}`,
      ).toBeGreaterThanOrEqual(-1e-12);
    }
  });

  it('conserves the impulse instead of diverging', () => {
    // permitting=1 produced −4.18e8 GW before the clamp.
    for (const permitting of [3, 2, 1, 0.5]) {
      const { cumulative } = mismatched(permitting);
      expect(cumulative, `volume not conserved at permitting=${permitting}`).toBeCloseTo(1, 9);
    }
  });

  it('saturates the lead time below the stage count rather than shortening further', () => {
    // Three stages cannot pass material faster than one stage per year. Durations at or under
    // the stage count therefore all collapse onto the same delivery curve — the lead time stops
    // responding instead of the arithmetic breaking down.
    const atThree = mismatched(3).cumulative;
    expect(mismatched(2).cumulative).toBeCloseTo(atThree, 9);
    expect(mismatched(1).cumulative).toBeCloseTo(atThree, 9);
  });

  it('leaves every duration the UI and sampler can reach untouched', () => {
    // The clamp binds only below duration 3. Nothing reachable through the lever (9 or 5) or the
    // Monte Carlo sampler (as low as 4) crosses it, which is why no published figure moves.
    for (const permitting of [9, 5, 4]) {
      const state = initPipeline(0, 9, 3);
      let cumulative = 0;
      for (let y = 1; y <= 30; y++)
        cumulative += stepPipeline(state, y === 1 ? 1 : 0, permitting, 3);
      // Not an equality: at a 9-year permitting duration the Erlang-3 tail is legitimately
      // still draining after 30 years (0.9975). What matters here is that volume is conserved
      // and none is created — the clamp must not bind at these durations.
      expect(cumulative).toBeGreaterThan(0.99);
      expect(cumulative).toBeLessThanOrEqual(1 + 1e-12);
    }
  });
});
