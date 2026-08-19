import { describe, expect, it } from 'vitest';
import { runSimulation } from '../src/index.js';
import { scenarioDefaults as d } from '../src/data.js';

/**
 * The guided stories in the UI state concrete numbers ("Ireland drops from roughly 15 to
 * 9 TWh", "Sweden overtakes Germany"). These tests pin those claims to the model so a
 * parameter change breaks the narrative loudly instead of leaving it quietly wrong.
 */
const BASE = d.levers;
const at = (levers: typeof BASE, year = 2045) => {
  const r = runSimulation({ levers });
  const i = r.years.indexOf(year);
  return {
    eu: r.aggregates[i]!.euDcTwh,
    flags: r.aggregates[i]!.flaggedRegions,
    dc: (iso: string) => r.countries[iso]![i]!.dcEnergyTwh,
    share: (iso: string) => {
      const x = r.countries[iso]![i]!;
      return x.dcEnergyTwh / x.totalDemandTwh;
    },
    largest: () =>
      Object.entries(r.countries)
        .filter(([iso]) => iso !== 'GB')
        .map(([iso, s]) => [iso, s[i]!.dcEnergyTwh] as const)
        .sort((a, b) => b[1] - a[1])[0]![0],
  };
};

describe('story: Grids Package delivers', () => {
  it('reform leaves the EU total nearly identical — it changes where, not whether', () => {
    const base = at(BASE).eu;
    const reform = at({ ...BASE, permittingReform: true }).eu;
    expect(Math.abs(reform - base) / base).toBeLessThan(0.02);
  });
});

describe('story: Dublin freeze spreads', () => {
  it('claims Ireland reaches about 30% of its own demand by 2045', () => {
    expect(at(BASE).share('IE')).toBeGreaterThan(0.25);
    expect(at(BASE).share('IE')).toBeLessThan(0.35);
  });

  it('claims Ireland is flagged, alongside Luxembourg', () => {
    expect(at(BASE).flags).toContain('IE');
    expect(at(BASE).flags).toContain('LU');
  });

  it('claims capping takes Ireland from roughly 15 to roughly 9 TWh and clears its flag', () => {
    const market = at(BASE);
    const capped = at({ ...BASE, sitingPolicy: 'capped' });
    expect(market.dc('IE')).toBeGreaterThan(13);
    expect(market.dc('IE')).toBeLessThan(17);
    expect(capped.dc('IE')).toBeGreaterThan(7);
    expect(capped.dc('IE')).toBeLessThan(11);
    expect(capped.flags).not.toContain('IE');
  });

  it('claims the load reappears elsewhere rather than disappearing', () => {
    const market = at(BASE);
    const capped = at({ ...BASE, sitingPolicy: 'capped' });
    expect(Math.abs(capped.eu - market.eu) / market.eu).toBeLessThan(0.01);
    // France and the Netherlands are named as recipients
    expect(capped.dc('FR')).toBeGreaterThan(market.dc('FR'));
    expect(capped.dc('NL')).toBeGreaterThan(market.dc('NL'));
  });
});

describe('story: the efficiency wall', () => {
  it('claims the central path reaches about 219 TWh by 2045', () => {
    expect(at(BASE).eu).toBeGreaterThan(205);
    expect(at(BASE).eu).toBeLessThan(235);
  });

  it('claims efficiency slows the climb without reversing it, even at 2%/yr', () => {
    const central = at(BASE).eu;
    const eff = at({ ...BASE, extraEfficiencyRate: 0.02 }).eu;
    const start = runSimulation({ levers: BASE }).aggregates[
      runSimulation({ levers: BASE }).years.indexOf(2026)
    ]!.euDcTwh;
    expect(eff).toBeLessThan(central);
    expect(eff).toBeGreaterThan(start); // still well above where it began
  });

  it('claims boom plus efficiency still ends far above the starting point', () => {
    const boomEff = at({ ...BASE, computeGrowthMultiplier: 1.75, extraEfficiencyRate: 0.02 }).eu;
    expect(boomEff).toBeGreaterThan(at(BASE).eu);
  });
});

describe('story: Nordic gold rush', () => {
  it('claims Germany leads when siting ignores price', () => {
    expect(at({ ...BASE, priceSensitivity: 0 }).largest()).toBe('DE');
  });

  it('claims Sweden overtakes Germany when price dominates, and the flags clear', () => {
    const strong = at({ ...BASE, priceSensitivity: 3 });
    expect(strong.largest()).toBe('SE');
    expect(strong.dc('SE')).toBeGreaterThan(strong.dc('DE'));
    expect(strong.flags).toEqual([]);
  });

  it('claims renewables-coupled siting costs France ground despite its low-carbon mix', () => {
    const market = at(BASE);
    const green = at({ ...BASE, sitingPolicy: 'renewables' });
    expect(green.dc('FR')).toBeLessThan(market.dc('FR'));
    expect(green.dc('SE')).toBeGreaterThan(market.dc('SE'));
  });
});
