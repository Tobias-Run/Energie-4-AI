import type { CountryParams, ScenarioDefaults } from '../data.js';
import { HOURS_PER_YEAR_K } from './electricityDemand.js';

export interface AdequacyInput {
  totalDemandTwh: number;
  dcEnergyTwh: number;
  lowCarbonTwh: number;
  otherFirmTwh: number;
  gasCapTwh: number;
  importCapTwh: number;
}

export interface AdequacyResult {
  gasGenTwh: number;
  peakLoadGw: number;
  dcShareOfPeak: number;
  stressIndex: number;
  flagged: boolean;
  emissionsMt: number;
}

/**
 * Annual energy balance plus peak-stress proxy (mission document §5.4).
 * Gas dispatches as the residual after low-carbon and other firm generation;
 * the stress index measures demand against all available resources incl. imports.
 */
export function assessAdequacy(
  c: CountryParams,
  input: AdequacyInput,
  defaults: ScenarioDefaults,
): AdequacyResult {
  const residual = input.totalDemandTwh - input.lowCarbonTwh - input.otherFirmTwh;
  const gasGenTwh = Math.min(Math.max(residual, 0), input.gasCapTwh);

  const resources = input.lowCarbonTwh + input.otherFirmTwh + input.gasCapTwh + input.importCapTwh;
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

  return { gasGenTwh, peakLoadGw, dcShareOfPeak, stressIndex, flagged, emissionsMt };
}
