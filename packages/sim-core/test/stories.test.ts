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
    // Luxembourg briefly stopped tripping it at all, once the peakFactor trend (#39) was applied
    // alone -- a one-sided correction with no data-centre-flattening counterweight. Giving grid
    // connection an ex-ante say in siting too (#30, B5) partly reverses that: some of what the
    // trend had redirected toward Luxembourg came from countries whose tight pipelines now also
    // deter new siting there before a project is even proposed, and Luxembourg absorbs more of
    // it. The flag returns, just not at the pre-#39 level.
    expect(at(BASE).flags).not.toContain('IE');
    expect(at(BASE).flags).toEqual(['LU']);
  });

  it('claims the siting cap barely moves Ireland, and clears Luxembourg instead', () => {
    const market = at(BASE);
    const capped = at({ ...BASE, sitingPolicy: 'capped' });
    // Ireland is already refusing this load via its connection pipeline, so a second refusal
    // mechanism has almost nothing left to take.
    expect(market.dc('IE')).toBeGreaterThan(7);
    expect(market.dc('IE')).toBeLessThan(11);
    expect(Math.abs(1 - capped.dc('IE') / market.dc('IE'))).toBeLessThan(0.1);
    // Luxembourg is where the lever actually bites.
    expect(market.flags).toEqual(['LU']);
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

  it('claims Finland overtakes Germany when price dominates, and the flag relocates rather than clears', () => {
    // Sourcing priceIndex from real Eurostat data (issue #4) put Finland, not Sweden, at the
    // cheap end of the Nordic band -- 0.42 measured against 0.65 expert-guess before. The
    // story's point survives the swap, and sharpens: cheap power does not remove the stress
    // flag, it relocates it. Luxembourg's flag (present at every other price setting in this
    // file) clears; Finland trips its own instead, because concentrating this much load onto
    // one system is itself a constraint regardless of which system it is.
    const strong = at({ ...BASE, priceSensitivity: 3 });
    expect(strong.largest()).toBe('FI');
    expect(strong.dc('FI')).toBeGreaterThan(strong.dc('DE'));
    expect(strong.flags).toEqual(['FI']);
  });

  it('claims renewables-coupled siting costs France ground despite its low-carbon mix', () => {
    const market = at(BASE);
    const green = at({ ...BASE, sitingPolicy: 'renewables' });
    expect(green.dc('FR')).toBeLessThan(market.dc('FR'));
    expect(green.dc('SE')).toBeGreaterThan(market.dc('SE'));
  });
});

describe('story: two models, one map (issue #63)', () => {
  // This story quotes figures from an outside source -- the EC Cloud & AI Study (Aug 2026) --
  // against our own. Only our side can be pinned here; the EC figures are quoted in the story
  // text and recorded in issue #63. What these tests guard is that our side still says what
  // the story says it says.
  const EU27 = [
    'AT',
    'BE',
    'BG',
    'HR',
    'CY',
    'CZ',
    'DK',
    'EE',
    'FI',
    'FR',
    'DE',
    'GR',
    'HU',
    'IE',
    'IT',
    'LV',
    'LT',
    'LU',
    'MT',
    'NL',
    'PL',
    'PT',
    'RO',
    'SK',
    'SI',
    'ES',
    'SE',
  ];
  const eu27At = (year: number) => {
    const r = runSimulation({ levers: BASE });
    const i = r.years.indexOf(year);
    const rows = EU27.map((iso) => [iso, r.countries[iso]![i]!] as const);
    const twh = rows.reduce((s, [, c]) => s + c.dcEnergyTwh, 0);
    const itGw = rows.reduce((s, [, c]) => s + c.dcItLoadGw, 0);
    return { twh, itGw, peak: (iso: string) => r.countries[iso]![i]!.dcShareOfPeak };
  };

  it('claims DE, FR, NL and IE hold about 63.8% of EU-27 DC electricity in 2025', () => {
    // The EC study independently reports 63% of EU-27 capacity in the same four countries.
    // Nothing in the model was fitted to that figure -- the concentration is an output of the
    // gravity/price allocation, which is the whole point of the story's first step.
    const y = eu27At(2025);
    const four = ['DE', 'FR', 'NL', 'IE'];
    const r = runSimulation({ levers: BASE });
    const i = r.years.indexOf(2025);
    const share = four.reduce((s, iso) => s + r.countries[iso]![i]!.dcEnergyTwh, 0) / y.twh;
    expect(share).toBeGreaterThan(0.6);
    expect(share).toBeLessThan(0.67);
  });

  it('claims the model implies about 19.5 GW of EU-27 IT load in 2025', () => {
    // Against the EC study's 13.9 GW of maximum IT load -- roughly 40% higher. The story
    // attributes the whole gap to itUtilization; see issue #63 and the contested anchor in #34.
    const itGw = eu27At(2025).itGw;
    expect(itGw).toBeGreaterThan(19);
    expect(itGw).toBeLessThan(20);
  });

  it('claims permitting reform moves the EU total by well under a percent', () => {
    // The EC study: "physical grid capacity availability rather than the administrative grid
    // connection permit procedure". Our model agrees for its own reason -- the connection
    // ceiling binds first -- and the story invites the reader to flip the lever and see.
    const base = at(BASE, 2035).eu;
    const reform = at({ ...BASE, permittingReform: true }, 2035).eu;
    expect(Math.abs(reform - base) / base).toBeLessThan(0.005);
  });

  it('claims Luxembourg is the only flag in 2045, with Ireland close but under', () => {
    const y = eu27At(2045);
    expect(y.peak('LU')).toBeGreaterThan(d.dcPeakShareFlagThreshold);
    expect(y.peak('IE')).toBeLessThan(d.dcPeakShareFlagThreshold);
    expect(y.peak('IE')).toBeGreaterThan(0.13);
    expect(at(BASE).flags).toEqual(['LU']);
  });
});
