import type { CountryParams, ScenarioDefaults } from '../data.js';
import { HOURS_PER_YEAR_K } from './electricityDemand.js';

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
 */
export function assessAdequacy(
  c: CountryParams,
  input: AdequacyInput,
  defaults: ScenarioDefaults,
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

  const peakLoadGw = (input.totalDemandTwh * c.peakFactor) / HOURS_PER_YEAR_K;
  // DC load is near-flat; its firm (inference) share contributes its average draw at peak.
  const dcFirmGw = (input.dcEnergyTwh / HOURS_PER_YEAR_K) * defaults.firmLoadShare;
  const dcShareOfPeak = peakLoadGw > 0 ? dcFirmGw / peakLoadGw : 0;

  const flagged =
    stressIndex > defaults.stressFlagThreshold || dcShareOfPeak > defaults.dcPeakShareFlagThreshold;

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
