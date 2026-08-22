import { describe, expect, it } from 'vitest';
import { countries, globalCompute, scenarioDefaults } from '../src/data.js';
import { runSimulation } from '../src/index.js';
import type { Levers } from '../src/types.js';

/**
 * Characterisation tests for the grid-connection constraint.
 *
 * These pin behaviour that is KNOWN TO BE WRONG. They exist so that a future fix to the
 * pipeline mechanism shows up as a deliberate, visible test change rather than a silent
 * shift in results. See docs/model-notes.md, "Known defects".
 *
 * The defect: `availableGw = baseConnectableGwPerYear * pipelineTightness + builtFlow`
 * (engine.ts). `builtFlow` comes out of a delay chain whose inflow is the country's own
 * desired connections, so the pipeline manufactures roughly whatever capacity is demanded,
 * three years late. The per-country term is only an additive floor on top of that, which
 * means a national connection moratorium — the thing Denmark actually did in March 2026 —
 * cannot be represented, however small pipelineTightness is set.
 */
const BOOM: Levers = {
  computeGrowthMultiplier: 1.75,
  extraEfficiencyRate: 0,
  permittingReform: false,
  sitingPolicy: 'market',
  flexibilityShare: 0,
  priceSensitivity: 1,
};

function dkAt2045(tightness: number) {
  const dk = countries.find((c) => c.iso === 'DK')!;
  const original = dk.pipelineTightness;
  try {
    dk.pipelineTightness = tightness;
    const r = runSimulation({ levers: BOOM, params: { scenarioDefaults, globalCompute } });
    return r.countries['DK']![r.years.indexOf(2045)]!;
  } finally {
    dk.pipelineTightness = original;
  }
}

describe('connection constraint (characterisation — documents a known defect)', () => {
  it('a country keeps most of its data centres even with zero connection capability', () => {
    const unconstrained = dkAt2045(1);
    const zero = dkAt2045(0);

    // Denmark still absorbs well over half its unconstrained load with the per-country
    // connection term switched off entirely. If a fix makes the constraint bind, this
    // ratio drops and the test must be revisited.
    const retained = zero.dcEnergyTwh / unconstrained.dcEnergyTwh;
    expect(retained).toBeGreaterThan(0.6);
    expect(retained).toBeLessThan(0.7);
  });

  it('never queues anything, even under a modelled national moratorium', () => {
    // A queue is the observable signature of a binding connection constraint. The current
    // mechanism produces none for Denmark at any tightness, including zero.
    for (const tightness of [1, 0.5, 0.15, 0]) {
      expect(dkAt2045(tightness).queueGw).toBe(0);
    }
  });

  it('responds to tightness only weakly, and not at all EU-wide', () => {
    const strict = dkAt2045(0.15);
    const loose = dkAt2045(1);
    // An 85% cut in connection capability moves Danish DC load by well under a fifth.
    expect(Math.abs(1 - strict.dcEnergyTwh / loose.dcEnergyTwh)).toBeLessThan(0.2);
  });
});
