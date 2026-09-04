import { BASE_YEAR, type GlobalComputeParams, type ScenarioDefaults } from '../data.js';
import type { Levers } from '../types.js';

/**
 * The ceiling the curve actually approaches, given the compute-growth lever.
 *
 * `saturationTwh` in the data bundle is the ceiling of the **base case**. The lever scales
 * growth above the 2024 base — which is what its label promises, "a multiplier on the IEA
 * base-case global growth" — so it scales the ultimate growth too, and the ceiling moves with it:
 *
 *     ceiling(m) = demand2024 + (saturation − demand2024) × m
 *
 * At the default ×1.00 this is exactly `saturationTwh`; at ×1.75 it is 4,938.75 TWh.
 *
 * An external review filed this as "the growth lever breaks the documented saturation" (issue #30,
 * B4), because the global curve reaches 4,228 TWh in 2045 at ×1.75 against a documented ceiling of
 * 3,000. Measured, the curve does not overshoot anything: it approaches a *different* ceiling that
 * the lever sets, and 4,228 is below it. The defect was in the documentation, which asserted a
 * fixed ceiling, not in the arithmetic.
 *
 * The alternative repair — scaling the growth constant instead, so every scenario converges on
 * 3,000 — was measured and rejected: it puts 2045 at 2,971 TWh against the base case's 2,594, a
 * spread of 14.5%, which would leave the boom scenario with almost no long-run divergence to show.
 * A scenario ceiling that moves with the scenario is the honest reading of this lever; a fixed one
 * would make the lever mostly cosmetic after 2040.
 */
export function effectiveSaturationTwh(p: GlobalComputeParams, growthMultiplier: number): number {
  return p.demand2024Twh + (p.saturationTwh - p.demand2024Twh) * growthMultiplier;
}

/**
 * Global DC electricity demand (TWh): logistic curve through the two IEA anchor points
 * (415 TWh in 2024, 945 TWh in 2030), approaching `effectiveSaturationTwh` for the run's
 * compute-growth setting.
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
  // Identical arithmetic to before, written so the ceiling above is visibly the limit of this
  // expression as t grows: base → saturationTwh, so the result → effectiveSaturationTwh.
  return p.demand2024Twh + (base - p.demand2024Twh) * growthMultiplier;
}

/**
 * Share of global demand *additions* captured by the EU-27.
 *
 * Pre-2030 stays on the IEA anchor: it is near-term and the buildout is largely already
 * committed. Post-2030 is the lever's, because that is where the model used to assert a decline
 * on its own authority (issue #41). The default reproduces the bundle value exactly.
 */
export function euCaptureShare(year: number, defaults: ScenarioDefaults, levers: Levers): number {
  if (year <= 2030) return defaults.captureShareOfGlobalAdditions.euPre2030;
  // null = follow the bundle, which is what Monte Carlo perturbs. See the note on the lever.
  return levers.capturePost2030 ?? defaults.captureShareOfGlobalAdditions.euPost2030;
}

/** Energy-per-compute improvement factor from the efficiency lever (1 = base case). */
export function efficiencyFactor(year: number, levers: Levers): number {
  return Math.pow(1 - levers.extraEfficiencyRate, year - BASE_YEAR);
}

/**
 * Allocation weight of a country for new DC additions: gravity toward existing stock,
 * tilted by relative electricity price and by grid connection prospects, and — under the
 * 'renewables' siting policy — by how clean that country's generation is. The 'capped' policy
 * is not expressible as a weight; it is applied to the normalized shares afterwards (see
 * applyHubCap).
 *
 * `pipelineTightness` now scales this weight too (issue #30, B5), not just what happens after a
 * project has already been sited there. Spec §5.1 asks for inflows "modulated by relative
 * electricity cost, grid connection lead time, and policy attractiveness" — this model used to
 * have price, and connection lead time only ex post: a project was allocated first and queued or
 * relocated only once it failed to connect. A developer avoids Dublin *because of* the
 * moratorium, not after building there anyway.
 *
 * Applied at full strength (`pipelineTightness` unexponentiated) this cancels the OTHER place
 * the same value already appears, `capabilityGw` in the engine's connection module: both terms
 * would then scale linearly with tightness, so their ratio — and therefore whether the
 * connection ceiling binds at all — stops depending on tightness, and the EU-wide queue this
 * model spent three prior fixes (#23, #28, #43) making into a usable stranded-asset indicator
 * collapses to zero regardless of scenario. Measured, not assumed: it does, in both the central
 * and boom runs. `sitingConnectionExponent` (< 1, expert-guess like the other two exponents in
 * this function) softens the ex-ante effect so it decays slower than the ex-post ceiling as
 * tightness falls — both channels still reach zero at a true moratorium, but the ex-post one
 * gets there faster, so a binding queue still forms below it rather than the two cancelling.
 */
export function allocationWeight(
  dcStockTwh: number,
  priceIndex: number,
  pipelineTightness: number,
  defaults: ScenarioDefaults,
  levers: Levers,
  renewablesShare: number,
): number {
  const gravity = Math.pow(Math.max(dcStockTwh, 0.01), defaults.allocationGravityExponent);
  const price = Math.pow(1 / priceIndex, defaults.priceElasticity * levers.priceSensitivity);
  const connection = Math.pow(pipelineTightness, defaults.sitingConnectionExponent);
  const clean =
    levers.sitingPolicy === 'renewables'
      ? Math.pow(Math.max(renewablesShare, 0.01), defaults.sitingRenewablesExponent)
      : 1;
  return gravity * price * connection * clean;
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
