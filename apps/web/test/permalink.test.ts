import { describe, expect, it } from 'vitest';
import { scenarioDefaults } from '@energie4ai/sim-core';
import { decodeScenario, encodeScenario, type ScenarioState } from '../src/lib/permalink.js';

const central: ScenarioState = {
  levers: { ...scenarioDefaults.levers },
  year: 2026,
  metricId: 'dcShareOfDemand',
  monteCarlo: false,
};

describe('scenario permalinks (issue #6)', () => {
  it('round-trips a fully non-default scenario', () => {
    const s: ScenarioState = {
      levers: {
        computeGrowthMultiplier: 1.75,
        extraEfficiencyRate: 0.02,
        permittingReform: true,
        sitingPolicy: 'capped',
        flexibilityShare: 0.35,
        priceSensitivity: 2.5,
        capturePost2030: 0.085,
      },
      year: 2041,
      metricId: 'dcShareOfPeak',
      monteCarlo: true,
    };
    expect(decodeScenario(encodeScenario(s), central)).toEqual(s);
  });

  it('omits defaults so a central-scenario link stays short', () => {
    const q = encodeScenario(central);
    expect(q).toBe('y=2026&m=dcShareOfDemand');
  });

  it('clamps hand-edited values to what the controls allow', () => {
    // the URL is user-editable, so it must not be able to push the model somewhere
    // the sliders never could
    const s = decodeScenario('g=99&e=-5&f=9&p=-1&y=3000', central);
    expect(s.levers.computeGrowthMultiplier).toBe(2);
    expect(s.levers.extraEfficiencyRate).toBe(0);
    expect(s.levers.flexibilityShare).toBe(0.5);
    expect(s.levers.priceSensitivity).toBe(0);
    expect(s.year).toBe(2045);
  });

  it('falls back to defaults for junk and unknown siting policies', () => {
    const s = decodeScenario('g=abc&s=teleportation', central);
    expect(s.levers.computeGrowthMultiplier).toBe(scenarioDefaults.levers.computeGrowthMultiplier);
    expect(s.levers.sitingPolicy).toBe('market');
  });

  it('keeps an older link working after new levers are added', () => {
    // a link written before the P2 levers existed carries none of their keys
    const s = decodeScenario('g=1.5&r=1&y=2035&m=stressIndex', central);
    expect(s.levers.computeGrowthMultiplier).toBe(1.5);
    expect(s.levers.permittingReform).toBe(true);
    expect(s.levers.sitingPolicy).toBe('market');
    expect(s.levers.flexibilityShare).toBe(0);
    expect(s.levers.priceSensitivity).toBe(1);
    // null, not the bundle number: an old link asserts nothing about the capture share, so it
    // must keep following the data — and keep Monte Carlo perturbing it (issue #41).
    expect(s.levers.capturePost2030).toBeNull();
  });

  it('treats an out-of-range capture share as the published bound, not as given', () => {
    // The lever's bounds are the published uncertainty range for the parameter. A hand-edited
    // link must not be able to claim a European share no source states.
    expect(decodeScenario('c=0.4', central).levers.capturePost2030).toBe(0.09);
    expect(decodeScenario('c=0', central).levers.capturePost2030).toBe(0.045);
    expect(decodeScenario('c=nonsense', central).levers.capturePost2030).toBeNull();
  });
});
