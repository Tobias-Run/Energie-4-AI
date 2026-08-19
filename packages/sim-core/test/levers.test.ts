import { describe, expect, it } from 'vitest';
import { runSimulation } from '../src/index.js';
import { scenarioDefaults as d } from '../src/data.js';

const BASE = d.levers;
const at = (levers: typeof BASE, year = 2045) => {
  const r = runSimulation({ levers });
  const i = r.years.indexOf(year);
  return {
    agg: r.aggregates[i]!,
    row: (iso: string) => r.countries[iso]![i]!,
    share: (iso: string) => {
      const x = r.countries[iso]![i]!;
      return x.dcEnergyTwh / x.totalDemandTwh;
    },
  };
};

describe('P2 levers (issue #6)', () => {
  it('siting policy moves load between countries and barely touches the EU total', () => {
    // Same finding as the permitting reform: at EU level siting redistributes rather than
    // removing demand. Not bit-identical though — the connection pipeline binds per country,
    // so a different distribution meets different constraints and the spillover relocates
    // only spillShare of what goes unserved. The residual is well under a tenth of a percent.
    const market = at(BASE).agg.euDcTwh;
    for (const policy of ['renewables', 'capped'] as const) {
      const moved = at({ ...BASE, sitingPolicy: policy }).agg.euDcTwh;
      expect(Math.abs(moved - market) / market, policy).toBeLessThan(0.001);
    }
  });

  it('capped siting holds saturated systems at the cap and clears their flags', () => {
    const capped = at({ ...BASE, sitingPolicy: 'capped' });
    const market = at(BASE);
    for (const iso of ['IE', 'LU']) {
      expect(market.share(iso), `${iso} uncapped`).toBeGreaterThan(d.hubCapDcShareOfDemand);
      // The cap is tested at the start of each year against the previous year's share, so a
      // country can overshoot by one year of additions before the moratorium bites — the same
      // way a real moratorium is declared after the threshold is observed, not before.
      expect(capped.share(iso), `${iso} capped`).toBeLessThan(d.hubCapDcShareOfDemand * 1.02);
      expect(capped.row(iso).dcEnergyTwh).toBeLessThan(market.row(iso).dcEnergyTwh);
    }
    expect(capped.agg.flaggedRegions).toEqual([]);
  });

  it('renewables-coupled siting favours high-renewables systems over nuclear-heavy ones', () => {
    const market = at(BASE);
    const green = at({ ...BASE, sitingPolicy: 'renewables' });
    // Sweden is renewables-heavy, France is nuclear-heavy — the tilt reads generation mix,
    // not carbon intensity, so France loses ground despite being low-carbon.
    expect(green.row('SE').dcEnergyTwh).toBeGreaterThan(market.row('SE').dcEnergyTwh);
    expect(green.row('FR').dcEnergyTwh).toBeLessThan(market.row('FR').dcEnergyTwh);
  });

  it('flexibility lowers the peak contribution proportionally and leaves demand alone', () => {
    const base = at(BASE);
    const flex = at({ ...BASE, flexibilityShare: 0.2 });
    expect(flex.agg.euDcTwh).toBeCloseTo(base.agg.euDcTwh, 6);
    expect(flex.row('IE').dcShareOfPeak).toBeCloseTo(base.row('IE').dcShareOfPeak * 0.8, 6);
    // the late-horizon flags are peak-share driven, so flexibility clears them
    expect(flex.agg.flaggedRegions.length).toBeLessThan(base.agg.flaggedRegions.length);
  });

  it('price sensitivity steers siting toward cheap power', () => {
    const blind = at({ ...BASE, priceSensitivity: 0 });
    const strong = at({ ...BASE, priceSensitivity: 3 });
    // Sweden is the cheapest system in the dataset, Germany among the most expensive
    expect(strong.row('SE').dcEnergyTwh).toBeGreaterThan(blind.row('SE').dcEnergyTwh);
    expect(strong.row('DE').dcEnergyTwh).toBeLessThan(blind.row('DE').dcEnergyTwh);
  });

  it('lever defaults reproduce the pre-P2 behaviour exactly', () => {
    expect(BASE.sitingPolicy).toBe('market');
    expect(BASE.flexibilityShare).toBe(0);
    expect(BASE.priceSensitivity).toBe(1);
    // central run is unchanged by the new machinery
    expect(at(BASE).agg.euDcTwh).toBeCloseTo(
      at({ ...BASE, sitingPolicy: 'market', flexibilityShare: 0, priceSensitivity: 1 }).agg.euDcTwh,
      9,
    );
  });
});
