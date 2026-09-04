import {
  BASE_YEAR,
  countries,
  dataVersion,
  globalCompute,
  ntcLinks,
  scenarioDefaults,
} from './data.js';
import type { CountryYear, Levers, SimConfig, SimulationResult, YearAggregates } from './types.js';
import {
  allocationWeight,
  applySaturationCap,
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

/**
 * The 2024 demand-weighted stress index under **default** parameters — the fixed reference the
 * congestion figure is expressed against.
 *
 * Congestion cost is a proxy: a euro baseline scaled by how much worse the system's
 * demand-weighted stress has become since 2024. It used to divide by the base-year index *of the
 * same run*, which meant any parameter that changed 2024 stress moved numerator and denominator
 * together. `ntcUtilization` moved the denominator more, so the reported cost ROSE as import
 * capability rose — monotonically, in the wrong direction (issue #35): €3.455 bn at u=0.30 against
 * €3.505 bn at u=0.90, while the stress it is built from fell everywhere.
 *
 * Against a fixed reference the figure is comparable across runs and means something statable:
 * congestion relative to the default 2024 European system. In the default run 2024 still returns
 * exactly the euro baseline; in a perturbed run it does not, which is correct — a differently
 * assumed system has different congestion in 2024 too.
 *
 * Computed from data rather than from a nested run: in the base year demand, generation and gas
 * caps come straight from the bundle, and import capability depends only on the default
 * `ntcUtilization`.
 */
function referenceCongestionIndex2024(): number {
  const importCap = importCapTwhByCountry(ntcLinks, scenarioDefaults, BASE_YEAR);
  let numerator = 0;
  let denominator = 0;
  for (const c of countries) {
    const total = c.baselineTwh2024 + c.dcTwh2024;
    const nonGas =
      renewablesTwh(c, BASE_YEAR) + nuclearTwh(c, BASE_YEAR) + otherFirmTwh(c, BASE_YEAR);
    const resources = nonGas + c.gasCapTwh2024 + (importCap[c.iso] ?? 0);
    const stress = resources > 0 ? total / resources : 1;
    numerator += stress * total;
    denominator += total;
  }
  return numerator / denominator;
}

export const DEFAULT_CONFIG: SimConfig = {
  startYear: 2026,
  endYear: 2045,
  seed: 4,
  levers: { ...scenarioDefaults.levers },
};

interface CountryState {
  dcEnergyTwh: number;
  queueGw: number;
  /**
   * Two chains, because a flexible connection agreement is a per-project deal, not a blanket
   * speed-up (issue #42). Load that accepts curtailment takes the shorter permitting route;
   * everything else waits the full duration. A single chain on a blended duration would move
   * the mean identically but claim every project got faster, which is not what ENTSO-E
   * describes.
   */
  pipelineFirm: PipelineState;
  pipelineFlexible: PipelineState;
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

  const permittingYears = levers.permittingReform
    ? d.permittingYearsReform
    : d.permittingYearsBaseline;

  // Load under a flexible connection agreement reaches the grid sooner (ENTSO-E §4.3). The floor
  // of 1 keeps the duration positive if a parameter set shaves off more than the baseline allows;
  // the chain clamps its own drain rate below the stage count regardless (issue #43).
  const flexiblePermittingYears = Math.max(1, permittingYears - d.flexibleConnectionYearsSaved);

  const euIsos = new Set(countries.filter((c) => c.eu27).map((c) => c.iso));

  // --- initial state (base year 2024) ---
  const state = new Map<string, CountryState>();
  for (const c of countries) {
    state.set(c.iso, {
      dcEnergyTwh: c.dcTwh2024,
      queueGw: 0,
      // Deliberately the BASELINE permitting duration, not the run's. The initial stocks
      // represent the world as it stands in the base year, where the backlog accumulated under
      // today's ~9-year regime. A reform then drains that existing backlog faster, which is a
      // real effect of the policy rather than an artefact: with the fixed step order the run
      // starts at exactly the steady flow and rises to about 1.43x over four years before
      // decaying back. Initialising with the reform duration instead scales the starting stock
      // down by precisely the factor the drain rate is scaled up, which makes permitting reform
      // a mathematical no-op — measured, flat 1.000 in every year.
      // The whole base-year backlog sits in the firm chain. Flexible connection agreements are
      // what ENTSO-E calls an emerging instrument, so in 2024 there is no stock of them to
      // inherit — projects already in the queue were permitted under the firm regime and stay
      // there. The flexible chain starts empty and fills only from the lever.
      pipelineFirm: initPipeline(
        c.baseConnectableGwPerYear * c.pipelineTightness,
        d.permittingYearsBaseline,
        d.constructionYears,
      ),
      pipelineFlexible: initPipeline(0, d.permittingYearsBaseline, d.constructionYears),
    });
  }

  const years: number[] = [];
  const perCountry: Record<string, CountryYear[]> = Object.fromEntries(
    countries.map((c) => [c.iso, []]),
  );
  const aggregates: YearAggregates[] = [];
  const congestionReference = referenceCongestionIndex2024();

  // `baseTwh` is the published energy curve (IEA); `globalTwh` is that curve after the
  // efficiency lever has acted on it. They differ only when the lever is off its default.
  let prevBaseTwh = globalDcDemandTwh(BASE_YEAR, gc, levers.computeGrowthMultiplier);
  let globalTwh = prevBaseTwh;

  for (let year = BASE_YEAR; year <= cfg.endYear; year++) {
    // --- compute demand module: global driver and Europe's captured additions ---
    //
    // Efficiency acts on the GLOBAL increment, not on Europe's slice of it. It used to
    // multiply only the European additions, which left the global curve untouched and made
    // the lever arithmetically indistinguishable from Europe losing capture share: the same
    // chips ran elsewhere at the same efficiency and Europe simply got fewer of them. As a
    // technology assumption it belongs to the world, so Europe's share of global demand now
    // stays put when the lever moves. Like every other efficiency effect here it applies to
    // new capacity only — there is no retrofit of installed stock (see honest limits).
    const baseTwh = globalDcDemandTwh(year, gc, levers.computeGrowthMultiplier);
    const globalAdditions = Math.max(0, baseTwh - prevBaseTwh) * efficiencyFactor(year, levers);
    prevBaseTwh = baseTwh;
    globalTwh += globalAdditions;

    if (year > BASE_YEAR) {
      const euAdditionsTwh = euCaptureShare(year, d, levers) * globalAdditions;

      // Allocate EU additions by gravity/price weights; non-EU countries have their own capture.
      let weights = new Map<string, number>();
      const dcShare = new Map<string, number>();
      for (const c of countries.filter((c) => c.eu27)) {
        // renewables share of this country's generation, for the 'renewables' siting policy
        const ren = renewablesTwh(c, year);
        const gen = ren + nuclearTwh(c, year) + otherFirmTwh(c, year) + c.gasCapTwh2024;
        const renShare = gen > 0 ? ren / gen : 0;
        const dcTwh = state.get(c.iso)!.dcEnergyTwh;
        const demand = baselineDemandTwh(c, year) + dcTwh;
        dcShare.set(c.iso, demand > 0 ? dcTwh / demand : 0);
        weights.set(
          c.iso,
          allocationWeight(dcTwh, c.priceIndex, c.pipelineTightness, d, levers, renShare),
        );
      }
      if (levers.sitingPolicy === 'capped') {
        weights = applySaturationCap(weights, dcShare, d.hubCapDcShareOfDemand);
      }
      let weightSum = 0;
      for (const w of weights.values()) weightSum += w;

      const desiredGw = new Map<string, number>();
      for (const c of countries) {
        const s = state.get(c.iso)!;
        const additionsTwh = c.eu27
          ? (euAdditionsTwh * weights.get(c.iso)!) / weightSum
          : (d.captureShareOfGlobalAdditions.nonEu[c.iso] ?? 0) * globalAdditions;
        desiredGw.set(c.iso, connectionGwForEnergy(additionsTwh, d) + s.queueGw);
      }

      // --- supply & grid module: connection constraint via the permitting pipeline ---
      const availableGw = new Map<string, number>();
      for (const c of countries) {
        const s = state.get(c.iso)!;
        // The country's own commissioning capability caps what can ENTER the pipeline, not
        // what leaves it. It used to be added to the pipeline output, which made supply a
        // lagged function of demand — the chain is fed by the country's own desired
        // connections, so it manufactured whatever was wanted and the constraint could never
        // bind; a national moratorium was unrepresentable at any parameter value. Capping the
        // inflow instead keeps both mechanisms live: the ceiling limits the sustainable rate,
        // while permitting duration still governs how fast the chain delivers during a ramp.
        //
        // `spareCapacityFactor` inflates what's fed toward the ceiling (formerly
        // `phantomQueueFactor`, issue #30 B6). Below the ceiling -- true almost everywhere, the
        // EU-wide queue is 0.007 GW -- this builds more than any country actually desired, and
        // that surplus becomes `sparePool`, the only capacity the spillover mechanism below has
        // to redistribute unserved demand into. It never represented speculative demand
        // shrinking the real queue, whatever the old name implied; it IS Europe's cross-country
        // redistribution headroom, and is named for that now.
        const capabilityGw = c.baseConnectableGwPerYear * c.pipelineTightness;
        const inflowGw = Math.min(desiredGw.get(c.iso)! * d.spareCapacityFactor, capabilityGw);
        // Split the inflow by the flexible share and route each part at its own duration. The
        // ceiling is applied before the split, so accepting curtailment buys time-to-power and
        // nothing else — it does NOT raise how much a country can connect per year. ENTSO-E
        // argues for that second channel too (avoiding "premature or oversized network
        // reinforcements"), but the ceiling is what #30 B8 is about (a static per-country
        // constant, unchanged here), and it barely binds anyway: the EU-wide queue is 0.007 GW.
        // Keeping the two apart means this lever
        // changes one mechanism that can be checked rather than two that cannot (issue #42).
        const builtFlow =
          stepPipeline(
            s.pipelineFirm,
            inflowGw * (1 - levers.flexibilityShare),
            permittingYears,
            d.constructionYears,
          ) +
          stepPipeline(
            s.pipelineFlexible,
            inflowGw * levers.flexibilityShare,
            flexiblePermittingYears,
            d.constructionYears,
          );
        availableGw.set(c.iso, builtFlow);
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
        levers,
        year,
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
      congestionCostBnEur: d.congestionBaselineBnEur2024 * (congestionIndex / congestionReference),
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
