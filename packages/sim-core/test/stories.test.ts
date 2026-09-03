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
  it('claims Ireland reaches about 20% of its own demand by 2045', () => {
    expect(at(BASE).share('IE')).toBeGreaterThan(0.17);
    expect(at(BASE).share('IE')).toBeLessThan(0.23);
  });

  it('claims Ireland is NOT flagged because its connection constraint binds first', () => {
    // Ireland has the tightest connection pipeline in the model (moratorium since 2021 plus
    // the CRU's December 2025 conditions), which holds its draw below the peak-share line.
    // Luxembourg used to be the one country that still tripped it regardless -- the peakFactor
    // trend applied in #39 pushes even Luxembourg under both thresholds, so the central run now
    // flags nobody at all. Ireland's own margin (14.19% of peak, one line below Luxembourg's
    // 14.51%) is the more interesting fact now: not flagged, but not comfortably so either.
    expect(at(BASE).flags).not.toContain('IE');
    expect(at(BASE).flags).toEqual([]);
  });

  it('claims the siting cap barely moves Ireland, and lowers Luxembourg regardless of a flag', () => {
    const market = at(BASE);
    const capped = at({ ...BASE, sitingPolicy: 'capped' });
    // Ireland is already refusing this load via its connection pipeline, so a second refusal
    // mechanism has almost nothing left to take.
    expect(market.dc('IE')).toBeGreaterThan(7);
    expect(market.dc('IE')).toBeLessThan(11);
    expect(Math.abs(1 - capped.dc('IE') / market.dc('IE'))).toBeLessThan(0.1);
    // Luxembourg is where the lever visibly bites, even though there is no longer a threshold
    // for it to clear: capped siting still takes Luxembourg from ~24.7% to ~20.2% of its own
    // demand, and from 14.51% to 11.58% of peak. Neither figure crosses a line either side of
    // the cap; the cap is doing real work that the flag list alone would no longer show.
    expect(market.flags).toEqual([]);
    expect(capped.flags).toEqual([]);
    expect(capped.dc('LU')).toBeLessThan(market.dc('LU'));
    expect(capped.share('LU')).toBeLessThan(market.share('LU'));
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
