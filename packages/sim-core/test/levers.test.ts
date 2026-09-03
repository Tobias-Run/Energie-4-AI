import { describe, expect, it } from 'vitest';
import { runMonteCarlo, runSimulation } from '../src/index.js';
import { scenarioDefaults as d, globalCompute } from '../src/data.js';

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

    // Luxembourg is the only country that still passes the cap on its own demand. Ireland
    // used to as well; since the connection constraint was repaired its own pipeline refuses
    // the load first, leaving it just under the line at ~19.9% against a 20% cap.
    expect(market.share('LU'), 'LU uncapped').toBeGreaterThan(d.hubCapDcShareOfDemand);
    expect(market.share('IE'), 'IE uncapped').toBeLessThan(d.hubCapDcShareOfDemand);
    expect(market.share('IE'), 'IE uncapped').toBeGreaterThan(d.hubCapDcShareOfDemand * 0.9);

    // The cap is tested at the start of each year against the previous year's share, so a
    // country can overshoot by one year of additions before the moratorium bites — the same
    // way a real moratorium is declared after the threshold is observed, not before.
    expect(capped.share('LU'), 'LU capped').toBeLessThan(d.hubCapDcShareOfDemand * 1.02);
    expect(capped.row('LU').dcEnergyTwh).toBeLessThan(market.row('LU').dcEnergyTwh);
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

  /**
   * Flexibility drives two mechanisms, because a flexible connection agreement is one commitment
   * with two consequences (ENTSO-E §4.3, issue #42): curtailable load is not firm at peak, AND it
   * reaches the grid sooner, since accepting curtailment is what buys the earlier connection.
   *
   * The two are separated here by running the connection channel at zero years saved. Testing
   * them together would let a change in one mask a change in the other.
   */
  const peakChannelOnly = (levers: typeof BASE, year = 2045) => {
    const r = runSimulation({
      levers,
      params: { scenarioDefaults: { ...d, flexibleConnectionYearsSaved: 0 }, globalCompute },
    });
    const i = r.years.indexOf(year);
    return { agg: r.aggregates[i]!, row: (iso: string) => r.countries[iso]![i]! };
  };

  it('peak channel: lowers the peak contribution sub-proportionally, demand untouched', () => {
    const base = peakChannelOnly(BASE);
    const flex = peakChannelOnly({ ...BASE, flexibilityShare: 0.2 });

    // With the connection channel switched off, flexibility moves no volume at all.
    expect(flex.agg.euDcTwh).toBeCloseTo(base.agg.euDcTwh, 9);

    // This assertion used to read `× 0.8` exactly. That held only while the denominator ignored
    // data centre load. Now that the peak is baseline-peak + DC firm draw (issue #30, B1),
    // shedding 20% of the firm draw shrinks the system peak too, so the share falls by less than
    // 20% — the identity below rather than the naive one.
    const b = base.row('IE');
    const baselinePeakGw = b.peakLoadGw * (1 - b.dcShareOfPeak);
    const dcFirmGw = b.peakLoadGw * b.dcShareOfPeak;
    const predicted = (dcFirmGw * 0.8) / (baselinePeakGw + dcFirmGw * 0.8);

    expect(flex.row('IE').dcShareOfPeak).toBeCloseTo(predicted, 9);
    expect(flex.row('IE').dcShareOfPeak).toBeLessThan(b.dcShareOfPeak);
    expect(flex.row('IE').dcShareOfPeak).toBeGreaterThan(b.dcShareOfPeak * 0.8);
  });

  it('peak channel: lowers a Luxembourg peak share that no longer needs clearing (#39)', () => {
    // This assertion has now been written four ways, and the sequence is the point.
    //
    //   18.37 / 16.84 / 15.26 / 13.61  — measured after B1, then left stale through A4 (#28)
    //   18.35 / 16.83 / 15.24 / 13.59  — the same code, correctly re-measured in #42
    //   16.46 / 15.06 / 13.61 / 12.12  — peakFactor derived from measured load (#39)
    //   14.51 / 13.25 / 11.96 / 10.62  — the same peakFactor's own measured trend, applied (#39)
    //
    // The third row is where a flag actually needed clearing: at 0% Luxembourg sat above the
    // 15% line, and 20% enrolment brought it under. Issue #39 flagged the trend row as the one
    // piece left undone -- "needs weighing against the opposing pull of a growing near-flat data
    // centre share" -- and weighing it the other way, applying only the measured (electrification)
    // side without a countervailing (DC-flattening) one to net it against, was enough on its own
    // to put Luxembourg under the line before the lever does anything. The lever still lowers the
    // share sub-proportionally, exactly as before; it just no longer has a threshold to cross.
    const shares = [0, 0.1, 0.2, 0.3].map((f) =>
      Number(
        (peakChannelOnly({ ...BASE, flexibilityShare: f }).row('LU').dcShareOfPeak * 100).toFixed(
          2,
        ),
      ),
    );
    expect(shares).toEqual([14.51, 13.25, 11.96, 10.62]);
    expect(shares[0]).toBeLessThan(15);

    for (const f of [0, 0.1, 0.2, 0.3]) {
      expect(peakChannelOnly({ ...BASE, flexibilityShare: f }).agg.flaggedRegions).toEqual([]);
    }
  });

  it('connection channel: flexible load reaches the grid sooner, and only during the ramp', () => {
    const base = at(BASE);
    const flex = at({ ...BASE, flexibilityShare: 0.5 });

    // Volume now moves — that is the whole point of the channel — but barely, and only in the
    // constrained countries. Europe's total is set by capture share × global demand, so a
    // faster connection redistributes rather than creates (same finding as siting and reform).
    expect(flex.agg.euDcTwh).toBeGreaterThan(base.agg.euDcTwh);
    expect(flex.agg.euDcTwh - base.agg.euDcTwh).toBeLessThan(0.5);
    for (const iso of ['IE', 'NL', 'DK']) {
      expect(flex.row(iso).dcEnergyTwh).toBeGreaterThan(base.row(iso).dcEnergyTwh);
    }

    // Nothing arrives early. The flexible route still costs 5 + 3 years from an empty chain, so
    // the first deliveries land around 2032 and the effect is exactly zero before then.
    const early = at(BASE, 2030).agg.euDcTwh;
    const earlyFlex = at({ ...BASE, flexibilityShare: 0.5 }, 2030).agg.euDcTwh;
    expect(earlyFlex).toBeCloseTo(early, 9);

    // And it fades: the gain peaks mid-horizon and decays as the transient washes out, because
    // in the long run a faster chain delivers the same volume, only earlier. Measured EU deltas:
    // +0.132 (2033), +0.181 (2036), +0.117 (2040), +0.106 (2045).
    const delta = (y: number) =>
      at({ ...BASE, flexibilityShare: 0.5 }, y).agg.euDcTwh - at(BASE, y).agg.euDcTwh;
    expect(delta(2036)).toBeGreaterThan(delta(2045));
  });

  it('connection channel: does not raise how much a country can connect per year', () => {
    // The ceiling is applied before the inflow is split, deliberately. Accepting curtailment
    // buys time-to-power and nothing else here; the hosting-capacity argument ENTSO-E also
    // makes belongs to the connection ceiling, which is #30 B5/B6/B8.
    //
    // Not bit-identical, and the reason is worth stating: the queue is desired minus served, and
    // desired shifts slightly once the channel has moved load between countries. That residual is
    // second-order — 1e-4 relative — where raising the ceiling would move the queue outright.
    const base = at(BASE);
    for (const f of [0.1, 0.3, 0.5]) {
      const q = at({ ...BASE, flexibilityShare: f }).agg.euQueueGw;
      expect(Math.abs(q - base.agg.euQueueGw) / base.agg.euQueueGw).toBeLessThan(1e-3);
    }
  });

  it('capture share: the lever moves the EU total, unlike every other lever', () => {
    // The one quantity that changes how much data centre load Europe ends up with, rather than
    // where it lands. Everything else — siting, reform, flexibility, transmission — redistributes,
    // because the European volume is capture share × global demand (issue #41).
    const base = at(BASE).agg.euDcTwh;
    const held = at({ ...BASE, capturePost2030: 0.085 }).agg.euDcTwh;
    const low = at({ ...BASE, capturePost2030: 0.045 }).agg.euDcTwh;
    expect(held).toBeGreaterThan(base + 20);
    expect(low).toBeLessThan(base - 20);
  });

  it('capture share: null means follow the bundle, and the sampler keeps its grip', () => {
    // This is the trap this lever walked into. Wired as a plain number defaulting to the bundle
    // value, the lever replaced the parameter Monte Carlo perturbs — and euPost2030's tornado
    // swing collapsed from 72.9 TWh to exactly 0.00 while every headline figure stayed put. The
    // corridor lost its third-largest dimension silently.
    expect(BASE.capturePost2030).toBeNull();
    expect(at(BASE).agg.euDcTwh).toBeCloseTo(
      at({ ...BASE, capturePost2030: d.captureShareOfGlobalAdditions.euPost2030 }).agg.euDcTwh,
      9,
    );

    const mc = runMonteCarlo({ runs: 60, seed: 7, levers: BASE });
    const post = mc.tornado.find((e) => e.path.endsWith('euPost2030'));
    expect(post, 'euPost2030 must still be a sampled parameter').toBeDefined();
    expect(Math.abs(post!.highValue - post!.lowValue)).toBeGreaterThan(50);
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
