import { describe, expect, it } from 'vitest';
import { aggregatesAt, calibrationAnchors, runSimulation } from '../src/index.js';

/**
 * Validation gate V1 (mission document §5, §10.1, CLAUDE.md P0.4 — BLOCKING):
 * the default run must reproduce the published scenario corridors within ±10%.
 * No UI work until this file is green.
 */
const result = runSimulation();
const a = calibrationAnchors.anchors;

function expectWithin(actual: number, target: number, tolerance: number) {
  expect(actual).toBeGreaterThanOrEqual(target * (1 - tolerance));
  expect(actual).toBeLessThanOrEqual(target * (1 + tolerance));
}

describe('calibration gate V1 (default run vs. published corridors)', () => {
  it('IEA: global DC demand reaches ~945 TWh in 2030', () => {
    const anchor = a.globalDc2030Twh;
    expectWithin(aggregatesAt(result, 2030).globalDcTwh, anchor.value, anchor.tolerance);
  });

  it('IEA: EU DC demand grows by ~+45 TWh from 2024 to 2030', () => {
    const anchor = a.euDcIncrease2024to2030Twh;
    const increase = aggregatesAt(result, 2030).euDcTwh - aggregatesAt(result, 2024).euDcTwh;
    expectWithin(increase, anchor.value, anchor.tolerance);
  });

  it('ENTSO-E: EU DC demand grows by more than +50% from 2025 to 2030', () => {
    const ratio = aggregatesAt(result, 2030).euDcTwh / aggregatesAt(result, 2025).euDcTwh;
    expect(ratio).toBeGreaterThanOrEqual(a.euDcGrowthRatio2025to2030Min.value);
    // sanity ceiling: still a corridor, not a runaway
    expect(ratio).toBeLessThanOrEqual(2.5);
  });

  it('ICIS/Ember: DC share of EU electricity demand reaches ~4.5% in 2030', () => {
    const anchor = a.euDcShareOfDemand2030;
    expectWithin(aggregatesAt(result, 2030).euDcShareOfDemand, anchor.value, anchor.tolerance);
  });

  it('ICIS/Ember: DC share of EU electricity demand reaches ~5.7% in 2035', () => {
    const anchor = a.euDcShareOfDemand2035;
    expectWithin(aggregatesAt(result, 2035).euDcShareOfDemand, anchor.value, anchor.tolerance);
  });
});
