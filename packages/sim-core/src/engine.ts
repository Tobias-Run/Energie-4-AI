import {
  BASE_YEAR,
  countries,
  dataVersion,
  globalCompute,
  ntcLinks,
  scenarioDefaults,
} from './data.js';
import { mulberry32 } from './rng.js';
import type { CountryYear, Levers, SimConfig, SimulationResult, YearAggregates } from './types.js';
import {
  allocationWeight,
  efficiencyFactor,
  euCaptureShare,
  globalDcDemandTwh,
} from './modules/computeDemand.js';
import {
  baselineDemandTwh,
  connectionGwForEnergy,
  energyForConnectionGw,
  itLoadGwFromEnergy,
} from './modules/electricityDemand.js';
import { initPipeline, stepPipeline, type PipelineState } from './modules/gridPipeline.js';
import {
  importCapTwhByCountry,
  nuclearTwh,
  otherFirmTwh,
  renewablesTwh,
} from './modules/supplyGrid.js';
import { assessAdequacy } from './modules/stressAdequacy.js';

export const DEFAULT_CONFIG: SimConfig = {
  startYear: 2026,
  endYear: 2045,
  seed: 4,
  levers: { ...scenarioDefaults.levers },
};

interface CountryState {
  dcEnergyTwh: number;
  queueGw: number;
  pipeline: PipelineState;
}

export function runSimulation(config?: Partial<SimConfig>): SimulationResult {
  const t0 = performance.now();
  // Resolve field by field rather than spreading: a spread lets an explicitly-passed
  // `undefined` overwrite a default, which silently produced zero-length runs.
  const cfg: SimConfig = {
    startYear: config?.startYear ?? DEFAULT_CONFIG.startYear,
    endYear: config?.endYear ?? DEFAULT_CONFIG.endYear,
    seed: config?.seed ?? DEFAULT_CONFIG.seed,
    levers: { ...DEFAULT_CONFIG.levers, ...config?.levers },
    params: config?.params,
  };
  const levers: Levers = cfg.levers;
  const d = cfg.params?.scenarioDefaults ?? scenarioDefaults;
  const gc = cfg.params?.globalCompute ?? globalCompute;
  // Reserved for Monte Carlo parameter perturbation (P2); the default run draws nothing.
  mulberry32(cfg.seed);

  const permittingYears = levers.permittingReform
    ? d.permittingYearsReform
    : d.permittingYearsBaseline;

  const euIsos = new Set(countries.filter((c) => c.eu27).map((c) => c.iso));

  // --- initial state (base year 2024) ---
  const state = new Map<string, CountryState>();
  for (const c of countries) {
    state.set(c.iso, {
      dcEnergyTwh: c.dcTwh2024,
      queueGw: 0,
      pipeline: initPipeline(
        c.baseConnectableGwPerYear * c.pipelineTightness,
        d.permittingYearsBaseline,
        d.constructionYears,
      ),
    });
  }

  const years: number[] = [];
  const perCountry: Record<string, CountryYear[]> = Object.fromEntries(
    countries.map((c) => [c.iso, []]),
  );
  const aggregates: YearAggregates[] = [];
  let congestionIndex2024 = 0;

  let prevGlobal = globalDcDemandTwh(BASE_YEAR, gc, levers.computeGrowthMultiplier);

  for (let year = BASE_YEAR; year <= cfg.endYear; year++) {
    // --- compute demand module: global driver and Europe's captured additions ---
    const globalTwh = globalDcDemandTwh(year, gc, levers.computeGrowthMultiplier);
    const globalAdditions = Math.max(0, globalTwh - prevGlobal);
    prevGlobal = globalTwh;

    if (year > BASE_YEAR) {
      const eff = efficiencyFactor(year, levers);
      const euAdditionsTwh = euCaptureShare(year, d) * globalAdditions * eff;

      // Allocate EU additions by gravity/price weights; non-EU countries have their own capture.
      const weights = new Map<string, number>();
      let weightSum = 0;
      for (const c of countries.filter((c) => c.eu27)) {
        const w = allocationWeight(state.get(c.iso)!.dcEnergyTwh, c.priceIndex, d);
        weights.set(c.iso, w);
        weightSum += w;
      }

      const desiredGw = new Map<string, number>();
      for (const c of countries) {
        const s = state.get(c.iso)!;
        const additionsTwh = c.eu27
          ? (euAdditionsTwh * weights.get(c.iso)!) / weightSum
          : (d.captureShareOfGlobalAdditions.nonEu[c.iso] ?? 0) * globalAdditions * eff;
        desiredGw.set(c.iso, connectionGwForEnergy(additionsTwh, d) + s.queueGw);
      }

      // --- supply & grid module: connection constraint via the permitting pipeline ---
      const availableGw = new Map<string, number>();
      for (const c of countries) {
        const s = state.get(c.iso)!;
        const builtFlow = stepPipeline(
          s.pipeline,
          desiredGw.get(c.iso)! * d.phantomQueueFactor,
          permittingYears,
          d.constructionYears,
        );
        availableGw.set(c.iso, c.baseConnectableGwPerYear * c.pipelineTightness + builtFlow);
      }

      const servedGw = new Map<string, number>();
      const unservedGw = new Map<string, number>();
      let unservedPool = 0;
      let sparePool = 0;
      for (const c of countries) {
        const served = Math.min(desiredGw.get(c.iso)!, availableGw.get(c.iso)!);
        servedGw.set(c.iso, served);
        unservedGw.set(c.iso, desiredGw.get(c.iso)! - served);
        unservedPool += desiredGw.get(c.iso)! - served;
        sparePool += availableGw.get(c.iso)! - served;
      }

      // Unserved demand partially relocates to countries with spare connection capacity
      // (siting spillover, e.g. "Dublin freeze spreads"); the rest queues at origin.
      const spill = Math.min(unservedPool * d.spillShare, sparePool);
      for (const c of countries) {
        const spare = availableGw.get(c.iso)! - servedGw.get(c.iso)!;
        if (sparePool > 0 && spare > 0) {
          servedGw.set(c.iso, servedGw.get(c.iso)! + (spill * spare) / sparePool);
        }
      }

      for (const c of countries) {
        const s = state.get(c.iso)!;
        const relocated = unservedPool > 0 ? (spill * unservedGw.get(c.iso)!) / unservedPool : 0;
        s.queueGw = Math.max(0, unservedGw.get(c.iso)! - relocated);
        s.dcEnergyTwh += energyForConnectionGw(servedGw.get(c.iso)!, d);
      }
    }

    // --- electricity demand, supply, stress & adequacy per country ---
    // NTCs follow sourced 2024/2030/2040 anchors, so the network expands during the run
    const importCap = importCapTwhByCountry(ntcLinks, d, year);
    years.push(year);
    let euDc = 0;
    let europeDc = 0;
    let euTotal = 0;
    let euRen = 0;
    let euNuc = 0;
    let euFossil = 0;
    let europeEmissions = 0;
    let euQueue = 0;
    let congestionNumerator = 0;
    let congestionDenominator = 0;
    const flagged: string[] = [];

    for (const c of countries) {
      const s = state.get(c.iso)!;
      const baseline = baselineDemandTwh(c, year);
      const total = baseline + s.dcEnergyTwh;
      const ren = renewablesTwh(c, year);
      const nuc = nuclearTwh(c, year);
      const other = otherFirmTwh(c, year);
      const adequacy = assessAdequacy(
        c,
        {
          totalDemandTwh: total,
          dcEnergyTwh: s.dcEnergyTwh,
          renewablesTwh: ren,
          nuclearTwh: nuc,
          otherFirmTwh: other,
          gasCapTwh: c.gasCapTwh2024,
          importCapTwh: importCap[c.iso] ?? 0,
        },
        d,
      );

      const row: CountryYear = {
        dcEnergyTwh: s.dcEnergyTwh,
        dcItLoadGw: itLoadGwFromEnergy(s.dcEnergyTwh, year, d),
        baselineTwh: baseline,
        totalDemandTwh: total,
        renewablesTwh: ren,
        nuclearTwh: nuc,
        gasGenTwh: adequacy.gasGenTwh,
        otherFirmTwh: other,
        generationTwh: adequacy.generationTwh,
        fossilGenTwh: adequacy.fossilGenTwh,
        netImportShare: adequacy.netImportShare,
        importCapTwh: importCap[c.iso] ?? 0,
        peakLoadGw: adequacy.peakLoadGw,
        dcShareOfPeak: adequacy.dcShareOfPeak,
        stressIndex: adequacy.stressIndex,
        flagged: adequacy.flagged,
        emissionsMt: adequacy.emissionsMt,
        queueGw: s.queueGw,
      };
      perCountry[c.iso].push(row);

      europeDc += s.dcEnergyTwh;
      europeEmissions += adequacy.emissionsMt;
      if (euIsos.has(c.iso)) {
        euDc += s.dcEnergyTwh;
        euTotal += total;
        euQueue += s.queueGw;
        euRen += ren;
        euNuc += nuc;
        euFossil += adequacy.fossilGenTwh;
      }
      if (adequacy.flagged) flagged.push(c.iso);
      congestionNumerator += adequacy.stressIndex * total;
      congestionDenominator += total;
    }

    const congestionIndex = congestionNumerator / congestionDenominator;
    if (year === BASE_YEAR) congestionIndex2024 = congestionIndex;

    aggregates.push({
      year,
      globalDcTwh: globalTwh,
      euDcTwh: euDc,
      europeDcTwh: europeDc,
      euTotalDemandTwh: euTotal,
      euDcShareOfDemand: euDc / euTotal,
      euRenewablesTwh: euRen,
      euNuclearTwh: euNuc,
      euFossilGenTwh: euFossil,
      europeEmissionsMt: europeEmissions,
      congestionCostBnEur: d.congestionBaselineBnEur2024 * (congestionIndex / congestionIndex2024),
      euQueueGw: euQueue,
      flaggedRegions: flagged,
    });
  }

  return {
    years,
    countries: perCountry,
    aggregates,
    meta: {
      seed: cfg.seed,
      levers,
      startYear: cfg.startYear,
      endYear: cfg.endYear,
      baseYear: BASE_YEAR,
      dataVersion,
      runtimeMs: performance.now() - t0,
    },
  };
}

/** Aggregates row for a given year (helper for tests and UI). */
export function aggregatesAt(result: SimulationResult, year: number): YearAggregates {
  const row = result.aggregates.find((a) => a.year === year);
  if (!row) throw new Error(`year ${year} not in simulation result`);
  return row;
}
