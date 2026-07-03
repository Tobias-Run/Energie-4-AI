export interface Levers {
  /** Multiplier on global compute-demand growth. 1 = IEA base case. */
  computeGrowthMultiplier: number;
  /** Additional annual energy-per-compute improvement on top of the base case. 0 = base case. */
  extraEfficiencyRate: number;
  /** European Grids Package scenario: permitting ~4-6 years instead of ~8-10. */
  permittingReform: boolean;
}

export interface SimConfig {
  /** First reported year. The model always computes from the data base year (2024). */
  startYear: number;
  endYear: number;
  seed: number;
  levers: Levers;
}

export interface CountryYear {
  dcEnergyTwh: number;
  dcItLoadGw: number;
  baselineTwh: number;
  totalDemandTwh: number;
  lowCarbonTwh: number;
  gasGenTwh: number;
  otherFirmTwh: number;
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
