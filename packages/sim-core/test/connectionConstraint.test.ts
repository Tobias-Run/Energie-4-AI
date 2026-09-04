import { describe, expect, it } from 'vitest';
import { countries, globalCompute, scenarioDefaults } from '../src/data.js';
import { runSimulation } from '../src/index.js';
import type { Levers } from '../src/types.js';

/**
 * The grid-connection constraint, and its two channels.
 *
 * These tests began life as characterisation tests pinning a defect: a country's connection
 * capability used to be ADDED to the pipeline output, and the pipeline is fed by that same
 * country's desired connections, so supply was a lagged function of demand and the constraint
 * could not bind. Denmark kept 8.63 of 13.40 TWh with its capability set to zero.
 *
 * The capability now caps what enters the pipeline instead. Issue #30 B5 added a second,
 * earlier channel on top: `pipelineTightness` now also discourages new siting ex ante, not just
 * ex post once a project fails to connect. The two channels are tested separately here —
 * `baseConnectableGwPerYear`, held constant, isolates the ex-post capability ceiling exactly as
 * before; `pipelineTightness`, held constant in those tests, is swept on its own further down.
 * Sweeping tightness alone, as earlier versions of this file did, no longer isolates either
 * mechanism: it moves both the desired allocation (B5) and the capability ceiling by the same
 * amount, so a country that is fully deterred ex ante never generates a queue at all — which is
 * the point of B5, not a defect in it.
 */
const BOOM: Levers = {
  computeGrowthMultiplier: 1.75,
  extraEfficiencyRate: 0,
  permittingReform: false,
  sitingPolicy: 'market',
  flexibilityShare: 0,
  priceSensitivity: 1,
  capturePost2030: scenarioDefaults.levers.capturePost2030,
};

function dkAt2045(overrides: Partial<{ baseConnectableGwPerYear: number }>, levers: Levers = BOOM) {
  const dk = countries.find((c) => c.iso === 'DK')!;
  const original = { baseConnectableGwPerYear: dk.baseConnectableGwPerYear };
  try {
    Object.assign(dk, overrides);
    const r = runSimulation({ levers, params: { scenarioDefaults, globalCompute } });
    return r.countries['DK']![r.years.indexOf(2045)]!;
  } finally {
    Object.assign(dk, original);
  }
}

describe('connection constraint: the ex-post capability ceiling', () => {
  it('binds: zero connection capability leaves almost no data centre load', () => {
    const unconstrained = dkAt2045({ baseConnectableGwPerYear: 1 });
    const zero = dkAt2045({ baseConnectableGwPerYear: 0 });
    // Only the 2024 installed base survives; nothing new can connect. The gap is smaller than
    // it used to be -- "unconstrained" is a smaller number now too, because B5's ex-ante siting
    // deterrent already discourages new build here regardless of what capability allows through.
    expect(zero.dcEnergyTwh).toBeLessThan(unconstrained.dcEnergyTwh * 0.4);
    expect(unconstrained.dcEnergyTwh).toBeGreaterThan(zero.dcEnergyTwh);
  });

  it('queues what it cannot connect', () => {
    // A queue is the observable signature of a binding constraint. Under a modelled
    // moratorium Denmark accumulates one; unconstrained it does not.
    expect(dkAt2045({ baseConnectableGwPerYear: 0 }).queueGw).toBeGreaterThan(0);
    expect(dkAt2045({ baseConnectableGwPerYear: 1 }).queueGw).toBe(0);
  });

  it('responds monotonically to the connection ceiling', () => {
    const values = [0, 0.05, 0.2, 1].map(
      (c) => dkAt2045({ baseConnectableGwPerYear: c }).dcEnergyTwh,
    );
    for (let i = 1; i < values.length; i++) {
      expect(values[i]!).toBeGreaterThan(values[i - 1]!);
    }
  });

  it('still lets permitting duration matter below the ceiling', () => {
    // The ceiling limits the sustainable rate; permitting governs how fast the delay chain
    // delivers during a ramp. Reform must therefore still move a constrained country.
    const withoutReform = dkAt2045({ baseConnectableGwPerYear: 0.05 }, BOOM);
    const withReform = dkAt2045(
      { baseConnectableGwPerYear: 0.05 },
      { ...BOOM, permittingReform: true },
    );
    expect(withReform.dcEnergyTwh).toBeGreaterThan(withoutReform.dcEnergyTwh * 1.05);
  });
});

describe('connection constraint: the ex-ante siting deterrent (issue #30, B5)', () => {
  function dkAtTightness(tightness: number, levers: Levers = BOOM) {
    const dk = countries.find((c) => c.iso === 'DK')!;
    // A generous, non-binding ceiling, so only the siting effect is visible in the result —
    // the ex-post channel above is deliberately not exercised here.
    const original = {
      pipelineTightness: dk.pipelineTightness,
      baseConnectableGwPerYear: dk.baseConnectableGwPerYear,
    };
    try {
      dk.pipelineTightness = tightness;
      dk.baseConnectableGwPerYear = 5;
      const r = runSimulation({ levers, params: { scenarioDefaults, globalCompute } });
      return r.countries['DK']![r.years.indexOf(2045)]!;
    } finally {
      Object.assign(dk, original);
    }
  }

  it('a tighter pipeline now means less gets sited there in the first place, not just less served', () => {
    const values = [0, 0.05, 0.15, 0.5, 1].map((t) => dkAtTightness(t).dcEnergyTwh);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]!).toBeGreaterThan(values[i - 1]!);
    }
    // A true moratorium (tightness 0) deters new siting entirely rather than producing a
    // (redundant) queue: nothing was ever desired there for the ceiling to reject.
    expect(dkAtTightness(0).queueGw).toBe(0);
  });

  it('does not by itself collapse the EU-wide queue to zero in every scenario', () => {
    // sitingConnectionExponent is damped below 1 specifically so this channel does not exactly
    // cancel the capability ceiling everywhere (see the note on allocationWeight): applied at
    // full strength, both terms scale linearly with the same pipelineTightness and their ratio
    // -- whether the ceiling binds at all -- stops depending on it. The boom run, run with the
    // sourced country data rather than a synthetic override, still produces a nonzero queue.
    const boom = runSimulation({
      levers: { ...scenarioDefaults.levers, computeGrowthMultiplier: 1.75 },
    });
    const i = boom.years.indexOf(2045);
    expect(boom.aggregates[i]!.euQueueGw).toBeGreaterThan(0);
  });
});
