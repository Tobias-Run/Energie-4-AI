import { BASE_YEAR, type CountryParams, type ScenarioDefaults } from '../data.js';

const HOURS_PER_YEAR_K = 8.76; // TWh per average GW over one year

/** Average PUE trajectory: geometric decline toward a physical floor. */
export function pueAt(year: number, defaults: ScenarioDefaults): number {
  const declined = defaults.pue2024 * Math.pow(1 - defaults.pueAnnualDeclineRate, year - BASE_YEAR);
  return Math.max(defaults.pueFloor, declined);
}

/** Exogenous baseline (non-DC) demand for a country in a given year (TYNDP-style growth). */
export function baselineDemandTwh(c: CountryParams, year: number): number {
  const yearsPre = Math.min(year, 2030) - BASE_YEAR;
  const yearsPost = Math.max(year - 2030, 0);
  return (
    c.baselineTwh2024 *
    Math.pow(1 + c.baselineGrowthPre2030, yearsPre) *
    Math.pow(1 + c.baselineGrowthPost2030, yearsPost)
  );
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
