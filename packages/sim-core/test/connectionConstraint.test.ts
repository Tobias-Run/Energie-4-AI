import { describe, expect, it } from 'vitest';
import { countries, globalCompute, scenarioDefaults } from '../src/data.js';
import { runSimulation } from '../src/index.js';
import type { Levers } from '../src/types.js';

/**
 * The grid-connection constraint.
 *
 * These tests began life as characterisation tests pinning a defect: a country's connection
 * capability used to be ADDED to the pipeline output, and the pipeline is fed by that same
 * country's desired connections, so supply was a lagged function of demand and the constraint
 * could not bind. Denmark kept 8.63 of 13.40 TWh with its capability set to zero.
 *
 * The capability now caps what enters the pipeline instead. These tests assert the repaired
 * behaviour: the constraint binds, queues form, and permitting duration still matters below
 * the ceiling.
 */
const BOOM: Levers = {
  computeGrowthMultiplier: 1.75,
  extraEfficiencyRate: 0,
  permittingReform: false,
  sitingPolicy: 'market',
  flexibilityShare: 0,
  priceSensitivity: 1,
};

function dkAt2045(tightness: number, levers: Levers = BOOM) {
  const dk = countries.find((c) => c.iso === 'DK')!;
  const original = dk.pipelineTightness;
  try {
    dk.pipelineTightness = tightness;
    const r = runSimulation({ levers, params: { scenarioDefaults, globalCompute } });
    return r.countries['DK']![r.years.indexOf(2045)]!;
  } finally {
    dk.pipelineTightness = original;
  }
}

describe('connection constraint', () => {
  it('binds: zero connection capability leaves almost no data centre load', () => {
    const unconstrained = dkAt2045(1);
    const zero = dkAt2045(0);
    // Only the 2024 installed base survives; nothing new can connect.
    expect(zero.dcEnergyTwh).toBeLessThan(unconstrained.dcEnergyTwh * 0.25);
  });

  it('queues what it cannot connect', () => {
    // A queue is the observable signature of a binding constraint. Under a modelled
    // moratorium Denmark accumulates one; unconstrained it does not.
    expect(dkAt2045(0).queueGw).toBeGreaterThan(0);
    expect(dkAt2045(1).queueGw).toBe(0);
  });

  it('responds monotonically to tightness', () => {
    const values = [0, 0.15, 0.5, 1].map((t) => dkAt2045(t).dcEnergyTwh);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]!).toBeGreaterThan(values[i - 1]!);
    }
  });

  it('still lets permitting duration matter below the ceiling', () => {
    // The ceiling limits the sustainable rate; permitting governs how fast the delay chain
    // delivers during a ramp. Reform must therefore still move a constrained country.
    const withoutReform = dkAt2045(0.15, BOOM);
    const withReform = dkAt2045(0.15, { ...BOOM, permittingReform: true });
    expect(withReform.dcEnergyTwh).toBeGreaterThan(withoutReform.dcEnergyTwh * 1.05);
  });
});
