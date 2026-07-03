import { BASE_YEAR, type CountryParams, type NtcLink, type ScenarioDefaults } from '../data.js';
import { HOURS_PER_YEAR_K } from './electricityDemand.js';

/** Low-carbon generation (TWh) for a country in a given year (NECP-aligned linear buildout). */
export function lowCarbonTwh(c: CountryParams, year: number): number {
  const yearsPre = Math.min(year, 2030) - BASE_YEAR;
  const yearsPost = Math.max(year - 2030, 0);
  return (
    c.lowCarbonTwh2024 + c.lowCarbonGrowthPre2030 * yearsPre + c.lowCarbonGrowthPost2030 * yearsPost
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
