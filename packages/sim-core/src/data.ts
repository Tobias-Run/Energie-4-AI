import countriesJson from '../../../data/v1/countries.json';
import globalJson from '../../../data/v1/global-compute.json';
import defaultsJson from '../../../data/v1/scenario-defaults.json';
import ntcJson from '../../../data/v1/ntc.json';
import anchorsJson from '../../../data/v1/calibration-anchors.json';
import benchmarksJson from '../../../data/v1/regional-benchmarks.json';
import hubsJson from '../../../data/v1/hubs.json';
import uncertaintyJson from '../../../data/v1/uncertainty.json';

export interface CountryParams {
  iso: string;
  name: string;
  eu27: boolean;
  /**
   * Legacy free-text hub label. Superseded by the `hubs` bundle, which is authoritative
   * for hub identity, location, and IXP linkage; kept only so the bundle schema is stable.
   */
  hub: string | null;
  baselineTwh2024: number;
  baselineGrowthPre2030: number;
  baselineGrowthPost2030: number;
  dcTwh2024: number;
  priceIndex: number;
  peakFactor: number;
  /** Measured drift in peakFactor (ratio units per year), applied linearly from 2024 (#39). */
  peakFactorTrendPerYear: number;
  renewablesTwh2024: number;
  renewablesGrowthPre2030: number;
  renewablesGrowthPost2030: number;
  nuclearTwh2024: number;
  nuclearDeltaPre2030: number;
  nuclearDeltaPost2030: number;
  gasCapTwh2024: number;
  otherFirmTwh2024: number;
  otherFirmDeclinePerYear: number;
  baseConnectableGwPerYear: number;
  pipelineTightness: number;
}

/**
 * A data center cluster location. Display metadata only — the simulation stays at
 * country level (decision on issue #2), so nothing here feeds the model.
 */
export interface Hub {
  id: string;
  name: string;
  iso: string;
  lat: number;
  lon: number;
  /** Part of the FLAP-D cluster (Frankfurt, London, Amsterdam, Paris, Dublin). */
  flapd: boolean;
  /** Why the cluster sits here: interconnection density, cheap/clean power, or both. */
  driver: 'peering' | 'power' | 'mixed';
  /** Internet exchange point at this location, null where there is none. */
  ixpName: string | null;
  /** Published peak traffic; null where no current figure could be verified. */
  ixpPeakTbps: number | null;
  /** As-of date for ixpPeakTbps (live figure that drifts), null when unverified. */
  asOf: string | null;
  sizeClass: 'major' | 'mid' | 'regional' | 'none';
}

/** One parameter's triangular uncertainty range (mission document §5.5). */
export interface UncertaintyRange {
  low: number;
  central: number;
  high: number;
  rationale: string;
  source_id: string;
}

export interface RegionalBenchmarks {
  globalEnvelopeTwh: Record<string, number>;
  euReferenceTwh: Record<string, number>;
  regions: Array<{ id: string; name: string; anchorsTwh: Record<string, number> }>;
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
  /**
   * Years of permitting shaved off for load under a flexible connection agreement
   * (ENTSO-E §4.3). Applies only to the `flexibilityShare` fraction of the inflow.
   */
  flexibleConnectionYearsSaved: number;
  ntcUtilization: number;
  gasEmissionFactorMtPerTwh: number;
  otherFirmEmissionFactorMtPerTwh: number;
  congestionBaselineBnEur2024: number;
  stressFlagThreshold: number;
  dcPeakShareFlagThreshold: number;
  allocationGravityExponent: number;
  priceElasticity: number;
  /** Strength of the renewables tilt under the 'renewables' siting policy. */
  sitingRenewablesExponent: number;
  /** DC share of national demand at which 'capped' siting stops new connections. */
  hubCapDcShareOfDemand: number;
  levers: import('./types.js').Levers;
}

/**
 * One entry of the validation gate. `tier` records what the anchor is capable of establishing:
 * `construction` anchors are reproduced by the model's own arithmetic and cannot fail,
 * `independent` anchors decide the gate verdict, and `contested` anchors come from sources that
 * disagree with the designated authority and are reported rather than enforced (issues #25, #26).
 */
export interface CalibrationAnchor {
  tier: 'construction' | 'independent' | 'contested';
  comparison: 'within' | 'atLeast' | 'setEquals';
  value: number | string[];
  tolerance?: number;
  unit: string;
  label: string;
  note: string;
}

export interface CalibrationAnchors {
  version: string;
  authoritativeVolumeSource: { sourceId: string; rationale: string };
  anchors: Record<string, CalibrationAnchor>;
  provenance: Record<string, string>;
}

/**
 * One border, with capacity per direction and per anchor year. Asymmetry is common
 * (72 of the sourced borders differ by direction), so importing and exporting capability
 * must be read from the matching direction rather than a single link value.
 */
export interface NtcLink {
  from: string;
  to: string;
  /** Capacity from `from` into `to`, keyed by anchor year. */
  forwardGw: Record<string, number>;
  /** Capacity from `to` into `from`, keyed by anchor year. */
  backwardGw: Record<string, number>;
  source: string;
}

export const BASE_YEAR = 2024;

export const countries: CountryParams[] = countriesJson.countries as CountryParams[];
export const globalCompute: GlobalComputeParams = globalJson;
export const scenarioDefaults: ScenarioDefaults = defaultsJson as ScenarioDefaults;
export const ntcLinks: NtcLink[] = ntcJson.links as NtcLink[];
export const ntcAnchorYears: number[] = ntcJson.anchorYears;
export const calibrationAnchors: CalibrationAnchors = anchorsJson as CalibrationAnchors;
export const regionalBenchmarks: RegionalBenchmarks = benchmarksJson as RegionalBenchmarks;
export const hubs: Hub[] = hubsJson.hubs as Hub[];
/** Uncertainty ranges keyed by dotted parameter path (e.g. 'scenarioDefaults.ntcUtilization'). */
export const uncertaintyRanges: Record<string, UncertaintyRange> =
  uncertaintyJson.parameters as Record<string, UncertaintyRange>;

export const dataVersion = countriesJson.version;

/** All provenance maps, keyed by bundle name — used to enforce the source-tracking rule (§8.3). */
export const provenanceMaps: Record<string, Record<string, string>> = {
  'countries.json': countriesJson.provenance,
  'global-compute.json': globalJson.provenance,
  'scenario-defaults.json': defaultsJson.provenance,
  'ntc.json': ntcJson.provenance,
  'calibration-anchors.json': anchorsJson.provenance,
  'regional-benchmarks.json': benchmarksJson.provenance,
  'hubs.json': hubsJson.provenance,
  'uncertainty.json': uncertaintyJson.provenance,
};
