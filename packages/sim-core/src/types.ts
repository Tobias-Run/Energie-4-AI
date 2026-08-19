export interface Levers {
  /** Multiplier on global compute-demand growth. 1 = IEA base case. */
  computeGrowthMultiplier: number;
  /** Additional annual energy-per-compute improvement on top of the base case. 0 = base case. */
  extraEfficiencyRate: number;
  /** European Grids Package scenario: permitting ~4-6 years instead of ~8-10. */
  permittingReform: boolean;
  /**
   * Where new DC load is steered. 'market' = gravity and price only (default);
   * 'renewables' = additionally tilted toward high-renewables systems;
   * 'capped' = no country may take more than hubCapShare of EU additions in a year.
   */
  sitingPolicy: SitingPolicy;
  /**
   * Fraction of DC load participating in demand response, and therefore not counted as
   * firm at peak. Acts directly on the criterion that drives the late-horizon flags.
   */
  flexibilityShare: number;
  /** Multiplier on priceElasticity: how strongly price differences steer siting. */
  priceSensitivity: number;
}

export type SitingPolicy = 'market' | 'renewables' | 'capped';

export interface SimConfig {
  /** First reported year. The model always computes from the data base year (2024). */
  startYear: number;
  endYear: number;
  seed: number;
  levers: Levers;
  /**
   * Parameter set to run with. Defaults to the shipped bundles; Monte Carlo mode passes
   * perturbed copies drawn from the uncertainty ranges. Runs stay deterministic given a seed.
   */
  params?: SimParams;
}

export interface SimParams {
  scenarioDefaults: import('./data.js').ScenarioDefaults;
  globalCompute: import('./data.js').GlobalComputeParams;
}

export interface CountryYear {
  dcEnergyTwh: number;
  dcItLoadGw: number;
  baselineTwh: number;
  totalDemandTwh: number;
  renewablesTwh: number;
  nuclearTwh: number;
  gasGenTwh: number;
  otherFirmTwh: number;
  /** Total domestic generation (renewables + nuclear + other firm + gas dispatch). */
  generationTwh: number;
  /** Gas dispatch + legacy firm — the fossil leg of the three-category mix (issue #12). */
  fossilGenTwh: number;
  /** Share of demand not covered by domestic generation; imports are not attributed to a mix category. */
  netImportShare: number;
  importCapTwh: number;
  peakLoadGw: number;
  dcShareOfPeak: number;
  /** Demand as share of total available resources (domestic + import). >stressFlagThreshold flags the region. */
  stressIndex: number;
  flagged: boolean;
  emissionsMt: number;
  /** DC grid-connection requests waiting in the queue (GW). Stranded-asset risk proxy. */
  queueGw: number;
}

export interface YearAggregates {
  year: number;
  globalDcTwh: number;
  euDcTwh: number;
  europeDcTwh: number;
  euTotalDemandTwh: number;
  euDcShareOfDemand: number;
  /** EU-27 generation by mix category (production-based, TWh). */
  euRenewablesTwh: number;
  euNuclearTwh: number;
  euFossilGenTwh: number;
  europeEmissionsMt: number;
  congestionCostBnEur: number;
  euQueueGw: number;
  flaggedRegions: string[];
}

export interface SimulationResult {
  /** All computed years (from the 2024 data base year through endYear). */
  years: number[];
  countries: Record<string, CountryYear[]>;
  aggregates: YearAggregates[];
  meta: {
    seed: number;
    levers: Levers;
    startYear: number;
    endYear: number;
    baseYear: number;
    dataVersion: string;
    runtimeMs: number;
  };
}
