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
 * tilted by relative electricity price, and — under the 'renewables' siting policy —
 * by how clean that country's generation is. The 'capped' policy is not expressible as
 * a weight; it is applied to the normalized shares afterwards (see applyHubCap).
 */
export function allocationWeight(
  dcStockTwh: number,
  priceIndex: number,
  defaults: ScenarioDefaults,
  levers: Levers,
  renewablesShare: number,
): number {
  const gravity = Math.pow(Math.max(dcStockTwh, 0.01), defaults.allocationGravityExponent);
  const price = Math.pow(1 / priceIndex, defaults.priceElasticity * levers.priceSensitivity);
  const clean =
    levers.sitingPolicy === 'renewables'
      ? Math.pow(Math.max(renewablesShare, 0.01), defaults.sitingRenewablesExponent)
      : 1;
  return gravity * price * clean;
}

/**
 * Connection moratorium for saturated systems ('capped' siting policy). A country whose DC
 * load has passed `cap` as a share of its own demand takes no further additions; its share
 * flows to the others through the normal weight normalization.
 *
 * Modelled on the real policy it names — Dublin and Amsterdam paused new connections because
 * local DC concentration strained the grid — rather than on an EU-wide allocation quota,
 * which no authority actually administers. Existing load is untouched: a moratorium stops
 * new connections, it does not remove installed capacity.
 */
export function applySaturationCap(
  weights: Map<string, number>,
  dcShareOfDemand: Map<string, number>,
  cap: number,
): Map<string, number> {
  const out = new Map(weights);
  let anyLeft = false;
  for (const [iso, w] of out) {
    if ((dcShareOfDemand.get(iso) ?? 0) >= cap) out.set(iso, 0);
    else if (w > 0) anyLeft = true;
  }
  // If every country is saturated the cap would zero the whole allocation and silently
  // discard demand; fall back to the uncapped weights so load still lands somewhere.
  return anyLeft ? out : weights;
}
