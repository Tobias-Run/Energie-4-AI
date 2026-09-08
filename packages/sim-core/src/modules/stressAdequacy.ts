import { BASE_YEAR, type CountryParams, type ScenarioDefaults } from '../data.js';
import type { Levers } from '../types.js';
import { HOURS_PER_YEAR_K } from './electricityDemand.js';

/**
 * `peakFactor` at a given year: the 2024 measured value plus its measured trend, extrapolated
 * linearly (issue #39). Floored at 1 -- peak load cannot be below average load by definition,
 * a physical bound rather than a modelling choice.
 *
 * This captures one of two real, opposing effects and not the other: electrification of heat
 * and transport raises the baseline peak (measured, applied here); a growing near-flat data
 * centre share lowers the system's overall peakiness (real, but not sourced or modelled -- see
 * docs/model-notes.md). Treat this as a one-sided correction, not a netted forecast.
 */
export function peakFactorAt(c: CountryParams, year: number): number {
  return Math.max(1, c.peakFactor + c.peakFactorTrendPerYear * (year - BASE_YEAR));
}

export interface AdequacyInput {
  totalDemandTwh: number;
  dcEnergyTwh: number;
  renewablesTwh: number;
  nuclearTwh: number;
  otherFirmTwh: number;
  gasCapTwh: number;
  importCapTwh: number;
}

export interface AdequacyResult {
  gasGenTwh: number;
  generationTwh: number;
  fossilGenTwh: number;
  /** Production-based accounting: imports are not attributed to a generation category (issue #12). */
  netImportShare: number;
  peakLoadGw: number;
  dcShareOfPeak: number;
  stressIndex: number;
  flagged: boolean;
  emissionsMt: number;
}

/**
 * Annual energy balance plus peak-stress proxy (mission document §5.4).
 * Renewables, nuclear, and legacy firm generation are must-run; gas dispatches as the
 * residual; the stress index measures demand against all available resources incl. imports.
 *
 * `stressIndex` no longer drives `flagged` (issue #30, B2). It is an *annual energy* balance,
 * not a *peak capacity* one -- the distinction that separates "enough electricity across the
 * year" from "enough available power at the hour it's needed" (the textbook case is Texas
 * 2021: ample annual energy, a capacity shortfall at one cold-snap hour). Resources
 * (renewables, nuclear, imports) grow faster than demand in this model almost everywhere
 * almost immediately, so the ratio only ever reflects the base year: Poland is the only
 * country that ever crosses 0.9, only in 2024-2026, and never again through 2045. Measured
 * directly: `ntcUtilization` -- which sets `importCapTwh` and therefore this ratio -- swings
 * `flaggedRegions` by exactly 0.000 across its full uncertainty range, because the criterion
 * it feeds cannot cross the threshold in either direction after 2026 regardless. Building a
 * real capacity-adequacy check (peak demand against *firm* capacity, with per-technology
 * capacity credits) would fix this properly, but edges into the intra-hour, technology-specific
 * dispatch detail the project's own honest-limits already disclose as out of scope -- see
 * docs/model-notes.md for the sketch, kept for v2. `stressIndex` stays computed and visible
 * (the data table, CSV export) so nothing is hidden; it just stops silently implying a
 * twenty-year adequacy watch the model cannot actually run.
 */
export function assessAdequacy(
  c: CountryParams,
  input: AdequacyInput,
  defaults: ScenarioDefaults,
  levers: Levers,
  year: number,
): AdequacyResult {
  const nonGas = input.renewablesTwh + input.nuclearTwh + input.otherFirmTwh;
  const gasGenTwh = Math.min(Math.max(input.totalDemandTwh - nonGas, 0), input.gasCapTwh);
  const generationTwh = nonGas + gasGenTwh;
  const fossilGenTwh = gasGenTwh + input.otherFirmTwh;
  const netImportShare =
    input.totalDemandTwh > 0
      ? Math.max(0, input.totalDemandTwh - generationTwh) / input.totalDemandTwh
      : 0;

  const resources = nonGas + input.gasCapTwh + input.importCapTwh;
  const stressIndex = resources > 0 ? input.totalDemandTwh / resources : 1;

  // DC load is near-flat; its firm (inference) share contributes its average draw at peak.
  // Load enrolled in demand response is assumed curtailable exactly when it matters, so it
  // drops out of the peak contribution entirely — an optimistic reading of flexibility, and
  // the reason the lever is capped well below full participation.
  const effectiveFirmShare = defaults.firmLoadShare * (1 - levers.flexibilityShare);
  const dcFirmGw = (input.dcEnergyTwh / HOURS_PER_YEAR_K) * effectiveFirmShare;

  // The peak factor is a property of the *baseline* load shape — heating, lighting, industry —
  // derived from 2024, when data centres were a small part of it. Applying it to total demand
  // would scale the flat DC load by a peaking factor it does not have, and it would do so most
  // where DC load is largest, so the share below was diluted exactly where it mattered
  // (issue #30, B1). Baseline peaks; DC adds its firm draw on top, the same quantity the
  // numerator uses. Numerator and denominator now describe the same system state.
  const baselinePeakGw =
    ((input.totalDemandTwh - input.dcEnergyTwh) * peakFactorAt(c, year)) / HOURS_PER_YEAR_K;
  const peakLoadGw = baselinePeakGw + dcFirmGw;
  const dcShareOfPeak = peakLoadGw > 0 ? dcFirmGw / peakLoadGw : 0;

  // stressIndex dropped from this condition (issue #30, B2) -- see the note on stressIndex
  // above. dcPeakShareFlagThreshold is the only criterion doing real work across the horizon.
  const flagged = dcShareOfPeak > defaults.dcPeakShareFlagThreshold;

  const emissionsMt =
    gasGenTwh * defaults.gasEmissionFactorMtPerTwh +
    input.otherFirmTwh * defaults.otherFirmEmissionFactorMtPerTwh;

  return {
    gasGenTwh,
    generationTwh,
    fossilGenTwh,
    netImportShare,
    peakLoadGw,
    dcShareOfPeak,
    stressIndex,
    flagged,
    emissionsMt,
  };
}
