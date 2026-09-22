import { BASE_YEAR, type CountryParams, type ScenarioDefaults } from '../data.js';
import type { DemandPath } from '../types.js';

const HOURS_PER_YEAR_K = 8.76; // TWh per average GW over one year

/** Average PUE trajectory: geometric decline toward a physical floor. */
export function pueAt(year: number, defaults: ScenarioDefaults): number {
  const declined = defaults.pue2024 * Math.pow(1 - defaults.pueAnnualDeclineRate, year - BASE_YEAR);
  return Math.max(defaults.pueFloor, declined);
}

/**
 * Exogenous baseline (non-DC) demand for a country in a given year.
 *
 * Two published readings disagree about this by 17-25% (issue #68), so which one is followed is a
 * lever, not a constant. `ember` uses the per-country rates in the bundle -- `expert-guess`
 * scaffolding that happens to sit near the denominator Ember's DC-share anchors imply. `tyndp`
 * replaces them with the EU-27 rates implied by ENTSO-E's TYNDP 2026 Central Scenario, uniformly,
 * because that report publishes no country breakdown (checked: EU-27 aggregates only).
 *
 * The uniform substitution is the honest shape for what the source supports. It also discards what
 * little country differentiation the bundle carries -- 20 of 30 countries share one pre-2030 rate
 * anyway -- and that is stated rather than hidden.
 */
export function baselineDemandTwh(
  c: CountryParams,
  year: number,
  defaults: ScenarioDefaults,
  path: DemandPath = 'ember',
): number {
  // The lever asserts a reading; absent that, the blend is whatever the bundle says -- which is
  // 0 by default and a sampled value in Monte Carlo (issue #67). Same shape as capturePost2030:
  // setting the lever deliberately closes that corridor dimension, because the user has asserted.
  const blend = path === 'tyndp' ? 1 : defaults.demandPathBlend;
  const mix = (ember: number, tyndp: number) => ember + (tyndp - ember) * blend;
  const pre = mix(c.baselineGrowthPre2030, defaults.tyndpDemandGrowth.pre2030);
  const post = mix(c.baselineGrowthPost2030, defaults.tyndpDemandGrowth.post2030);
  const yearsPre = Math.min(year, 2030) - BASE_YEAR;
  const yearsPost = Math.max(year - 2030, 0);
  return c.baselineTwh2024 * Math.pow(1 + pre, yearsPre) * Math.pow(1 + post, yearsPost);
}

/** IT load stock (GW) implied by facility energy: DC load = IT load × PUE × utilization (§5.2). */
export function itLoadGwFromEnergy(
  dcEnergyTwh: number,
  year: number,
  defaults: ScenarioDefaults,
): number {
  return dcEnergyTwh / (HOURS_PER_YEAR_K * defaults.itUtilization * pueAt(year, defaults));
}

/** Grid connection capacity (GW) needed for a given annual DC energy (TWh). */
export function connectionGwForEnergy(dcEnergyTwh: number, defaults: ScenarioDefaults): number {
  return dcEnergyTwh / HOURS_PER_YEAR_K / defaults.connectionLoadFactor;
}

/** Annual DC energy (TWh) served by a given connection capacity (GW). */
export function energyForConnectionGw(gw: number, defaults: ScenarioDefaults): number {
  return gw * HOURS_PER_YEAR_K * defaults.connectionLoadFactor;
}

export { HOURS_PER_YEAR_K };
