import countriesJson from '../../../data/v1/countries.json';
import globalJson from '../../../data/v1/global-compute.json';
import defaultsJson from '../../../data/v1/scenario-defaults.json';
import ntcJson from '../../../data/v1/ntc.json';
import anchorsJson from '../../../data/v1/calibration-anchors.json';

export interface CountryParams {
  iso: string;
  name: string;
  eu27: boolean;
  hub: string | null;
  baselineTwh2024: number;
  baselineGrowthPre2030: number;
  baselineGrowthPost2030: number;
  dcTwh2024: number;
  priceIndex: number;
  peakFactor: number;
  lowCarbonTwh2024: number;
  lowCarbonGrowthPre2030: number;
  lowCarbonGrowthPost2030: number;
  gasCapTwh2024: number;
  otherFirmTwh2024: number;
  otherFirmDeclinePerYear: number;
  baseConnectableGwPerYear: number;
  pipelineTightness: number;
}

export interface GlobalComputeParams {
  demand2024Twh: number;
  demand2030Twh: number;
  saturationTwh: number;
}

export interface ScenarioDefaults {
  captureShareOfGlobalAdditions: {
    euPre2030: number;
    euPost2030: number;
    nonEu: Record<string, number>;
  };
  pue2024: number;
  pueFloor: number;
  pueAnnualDeclineRate: number;
  itUtilization: number;
  firmLoadShare: number;
  connectionLoadFactor: number;
  phantomQueueFactor: number;
  spillShare: number;
  permittingYearsBaseline: number;
  permittingYearsReform: number;
  constructionYears: number;
  ntcUtilization: number;
  gasEmissionFactorMtPerTwh: number;
  otherFirmEmissionFactorMtPerTwh: number;
  congestionBaselineBnEur2024: number;
  stressFlagThreshold: number;
  dcPeakShareFlagThreshold: number;
  allocationGravityExponent: number;
  priceElasticity: number;
  levers: {
    computeGrowthMultiplier: number;
    extraEfficiencyRate: number;
    permittingReform: boolean;
  };
}

export interface CalibrationAnchors {
  anchors: {
    globalDc2030Twh: { value: number; tolerance: number };
    euDcIncrease2024to2030Twh: { value: number; tolerance: number };
    euDcGrowthRatio2025to2030Min: { value: number };
    euDcShareOfDemand2030: { value: number; tolerance: number };
    euDcShareOfDemand2035: { value: number; tolerance: number };
  };
}

export type NtcLink = [string, string, number];

export const BASE_YEAR = 2024;

export const countries: CountryParams[] = countriesJson.countries as CountryParams[];
export const globalCompute: GlobalComputeParams = globalJson;
export const scenarioDefaults: ScenarioDefaults = defaultsJson as ScenarioDefaults;
export const ntcLinks: NtcLink[] = ntcJson.links as NtcLink[];
export const calibrationAnchors: CalibrationAnchors = anchorsJson as CalibrationAnchors;

export const dataVersion = countriesJson.version;

/** All provenance maps, keyed by bundle name — used to enforce the source-tracking rule (§8.3). */
export const provenanceMaps: Record<string, Record<string, string>> = {
  'countries.json': countriesJson.provenance,
  'global-compute.json': globalJson.provenance,
  'scenario-defaults.json': defaultsJson.provenance,
  'ntc.json': ntcJson.provenance,
  'calibration-anchors.json': anchorsJson.provenance,
};
