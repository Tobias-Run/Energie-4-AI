import { BASE_YEAR, type CountryParams, type NtcLink, type ScenarioDefaults } from '../data.js';
import { HOURS_PER_YEAR_K } from './electricityDemand.js';

function piecewise(base: number, pre2030PerYear: number, post2030PerYear: number, year: number) {
  const yearsPre = Math.min(year, 2030) - BASE_YEAR;
  const yearsPost = Math.max(year - 2030, 0);
  return base + pre2030PerYear * yearsPre + post2030PerYear * yearsPost;
}

/** Renewables generation (TWh) for a country in a given year (NECP-aligned linear buildout). */
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

/** Other firm generation (coal, lignite, oil, waste): linear phase-out, floored at zero. */
export function otherFirmTwh(c: CountryParams, year: number): number {
  return Math.max(0, c.otherFirmTwh2024 - c.otherFirmDeclinePerYear * (year - BASE_YEAR));
}

/**
 * Annual energy import capability (TWh) per country from the static NTC network:
 * sum of link capacities × hours × average utilization (v1: no flow model, §4.2).
 */
export function importCapTwhByCountry(
  links: NtcLink[],
  defaults: ScenarioDefaults,
): Record<string, number> {
  const cap: Record<string, number> = {};
  for (const [a, b, gw] of links) {
    const twh = gw * HOURS_PER_YEAR_K * defaults.ntcUtilization;
    cap[a] = (cap[a] ?? 0) + twh;
    cap[b] = (cap[b] ?? 0) + twh;
  }
  return cap;
}
