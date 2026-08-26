export { runSimulation, aggregatesAt, DEFAULT_CONFIG } from './engine.js';
export {
  BASE_YEAR,
  countries,
  globalCompute,
  calibrationAnchors,
  scenarioDefaults,
  provenanceMaps,
  dataVersion,
  regionalBenchmarks,
} from './data.js';
export type { Levers, SimConfig, CountryYear, YearAggregates, SimulationResult } from './types.js';
export { globalDcDemandTwh, effectiveSaturationTwh } from './modules/computeDemand.js';
export { pueAt } from './modules/electricityDemand.js';
export { stepPipeline, initPipeline, announcedGw, permittedGw } from './modules/gridPipeline.js';
export {
  benchmarkTwh,
  benchmarkRegions,
  benchmarkHorizon,
  globalEnvelopeTwh,
} from './modules/benchmarks.js';
export type { Hub, NtcLink } from './data.js';
export type { SitingPolicy } from './types.js';
export { hubs, ntcLinks, ntcAnchorYears } from './data.js';
export { runMonteCarlo, sampleTriangular, TORNADO_TARGETS } from './modules/monteCarlo.js';
export type {
  MonteCarloResult,
  MonteCarloConfig,
  CorridorBand,
  TornadoEntry,
  TornadoTarget,
} from './modules/monteCarlo.js';
export { uncertaintyRanges } from './data.js';
export type { UncertaintyRange } from './data.js';
export { mulberry32 } from './rng.js';
export { modelFacts } from './modelFacts.js';
export type { ModelFacts } from './modelFacts.js';
export { calibrationReport, authoritativeVolumeSource } from './calibration.js';
export type { CalibrationReport, AnchorResult, AnchorTier } from './calibration.js';
