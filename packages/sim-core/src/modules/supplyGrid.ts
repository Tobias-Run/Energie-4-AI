import { BASE_YEAR, type CountryParams, type NtcLink, type ScenarioDefaults } from '../data.js';
import { HOURS_PER_YEAR_K } from './electricityDemand.js';

function piecewise(base: number, pre2030PerYear: number, post2030PerYear: number, year: number) {
  const yearsPre = Math.min(year, 2030) - BASE_YEAR;
  const yearsPost = Math.max(year - 2030, 0);
  return base + pre2030PerYear * yearsPre + post2030PerYear * yearsPost;
}

/**
 * Renewables generation (TWh) for a country in a given year (NECP-aligned linear buildout).
 * Category = Ember's Wind + Solar + Hydro + Bioenergy + Other Renewables (issue #38, see
 * mixCategoryMapping in countries.json) -- Hydro here excludes pumped storage's contribution,
 * per Ember's own methodology, not the model's choice.
 */
export function renewablesTwh(c: CountryParams, year: number): number {
  return Math.max(
    0,
    piecewise(c.renewablesTwh2024, c.renewablesGrowthPre2030, c.renewablesGrowthPost2030, year),
  );
}

/** Nuclear generation (TWh): deltas may be negative (phase-out) or positive (new builds), floored at zero. */
export function nuclearTwh(c: CountryParams, year: number): number {
  return Math.max(
    0,
    piecewise(c.nuclearTwh2024, c.nuclearDeltaPre2030, c.nuclearDeltaPost2030, year),
  );
}

/**
 * Other firm generation (coal, lignite, oil, waste): linear phase-out, floored at zero.
 * Waste sits here, not in `renewablesTwh`, per Ember's own taxonomy (issue #38) -- a
 * published ENTSO-E-level mapping (Unnewehr et al. 2022) keeps Waste separate instead, see
 * mixCategoryMapping in countries.json for why that mapping doesn't apply to this model's data.
 */
export function otherFirmTwh(c: CountryParams, year: number): number {
  return Math.max(0, c.otherFirmTwh2024 - c.otherFirmDeclinePerYear * (year - BASE_YEAR));
}

/** Linear interpolation between NTC anchor years; flat outside the anchored range. */
function capacityAt(byYear: Record<string, number>, year: number): number {
  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => a - b);
  if (years.length === 0) return 0;
  const first = years[0]!;
  const last = years[years.length - 1]!;
  if (year <= first) return byYear[String(first)]!;
  if (year >= last) return byYear[String(last)]!;
  for (let i = 1; i < years.length; i++) {
    const y0 = years[i - 1]!;
    const y1 = years[i]!;
    if (year <= y1) {
      const t = (year - y0) / (y1 - y0);
      return byYear[String(y0)]! + t * (byYear[String(y1)]! - byYear[String(y0)]!);
    }
  }
  return byYear[String(last)]!;
}

/**
 * Annual energy import capability (TWh) per country in a given year: the sum of border
 * capacities pointing INTO that country, times hours, times average utilization.
 * Still an energy-balance proxy, not a flow model (§4.2) — but direction-aware, and the
 * network grows over time along the sourced 2024/2030/2040 anchors.
 */
export function importCapTwhByCountry(
  links: NtcLink[],
  defaults: ScenarioDefaults,
  year: number,
): Record<string, number> {
  const cap: Record<string, number> = {};
  const add = (iso: string, gw: number) => {
    cap[iso] = (cap[iso] ?? 0) + gw * HOURS_PER_YEAR_K * defaults.ntcUtilization;
  };
  for (const link of links) {
    // forward capacity flows from `from` into `to`, so it is `to`'s import capability
    add(link.to, capacityAt(link.forwardGw, year));
    add(link.from, capacityAt(link.backwardGw, year));
  }
  return cap;
}
