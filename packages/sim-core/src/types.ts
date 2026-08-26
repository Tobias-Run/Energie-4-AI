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
  /**
   * Europe's share of global data centre demand *additions* after 2030.
   *
   * The model used to assert a decline here — 8.5% before 2030 (IEA) falling to 6.5% (Ember) —
   * with no way for a user to question it, while the sensitivity analysis ranked this parameter
   * among the largest drivers of the whole 2045 corridor. A policy decision was being presented
   * as a natural constant (issue #41).
   *
   * Bounded by the published uncertainty range for this parameter (0.045–0.09), so every
   * reachable value sits inside something a source states rather than somewhere invented.
   *
   * **`null` means "follow the data bundle", and that is the default.** It is an override, not a
   * copy of the bundle value, because Monte Carlo perturbs
   * `captureShareOfGlobalAdditions.euPost2030` and the sampler must keep its grip on it. Wiring
   * the lever as a plain number silently collapsed this parameter's tornado swing from 72.9 TWh
   * to exactly zero — the corridor lost its third-largest dimension while every headline figure
   * stayed put. Setting the lever deliberately fixes the parameter, so in Monte Carlo mode that
   * dimension of the corridor closes: the user has asserted a value, and it is no longer
   * uncertain (issue #41).
   */
  capturePost2030: number | null;
}

export type SitingPolicy = 'market' | 'renewables' | 'capped';

export interface SimConfig {
  /** First reported year. The model always computes from the data base year (2024). */
  /**
   * Reporting convention only — the simulation always integrates from the 2024 data base year,
   * because the 2045 state depends on every year in between. This is the first year the UI
   * charts, and it is carried into `meta` so an export says what it covers. It does not bound
   * the run (issue #31, C4).
   */
  startYear: number;
  endYear: number;
  /**
   * Carried into `meta` for provenance. **A single run draws no random numbers** — given the same
   * levers and parameters it produces the same output at every seed, so this value changes
   * nothing here. Seeding is what makes `runMonteCarlo` reproducible; that sampler owns its own
   * seed. Stating it plainly because the reproducibility claim used to rest on a determinism test
   * that compared two identical deterministic runs (issue #31, C4).
   */
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
