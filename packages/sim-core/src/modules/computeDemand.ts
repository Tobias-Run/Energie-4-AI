import { BASE_YEAR, type GlobalComputeParams, type ScenarioDefaults } from '../data.js';
import type { Levers } from '../types.js';

/**
 * Global DC electricity demand (TWh): logistic curve through the two IEA anchor points
 * (415 TWh in 2024, 945 TWh in 2030), saturating at an expert-guess ceiling.
 * The compute-growth lever scales cumulative growth relative to the 2024 base.
 */
export function globalDcDemandTwh(
  year: number,
  p: GlobalComputeParams,
  growthMultiplier: number,
): number {
  const a = p.saturationTwh / p.demand2024Twh - 1;
  const k = -Math.log((p.saturationTwh / p.demand2030Twh - 1) / a) / (2030 - BASE_YEAR);
  const t = year - BASE_YEAR;
  const base = p.saturationTwh / (1 + a * Math.exp(-k * t));
  return p.demand2024Twh + (base - p.demand2024Twh) * growthMultiplier;
}

/** Share of global demand *additions* captured by the EU-27 (declines after 2030, per IEA/Ember narrative). */
export function euCaptureShare(year: number, defaults: ScenarioDefaults): number {
  return year <= 2030
    ? defaults.captureShareOfGlobalAdditions.euPre2030
    : defaults.captureShareOfGlobalAdditions.euPost2030;
}

/** Energy-per-compute improvement factor from the efficiency lever (1 = base case). */
export function efficiencyFactor(year: number, levers: Levers): number {
  return Math.pow(1 - levers.extraEfficiencyRate, year - BASE_YEAR);
}

/**
 * Allocation weight of a country for new DC additions: gravity toward existing stock,
 * tilted by relative electricity price.
 */
export function allocationWeight(
  dcStockTwh: number,
  priceIndex: number,
  defaults: ScenarioDefaults,
): number {
  const gravity = Math.pow(Math.max(dcStockTwh, 0.01), defaults.allocationGravityExponent);
  const price = Math.pow(1 / priceIndex, defaults.priceElasticity);
  return gravity * price;
}
