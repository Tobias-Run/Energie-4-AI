import type { CountryYear } from '@energie4ai/sim-core';

export interface MetricDef {
  id: string;
  label: string;
  unit: string;
  /** Extract the value from a country-year row. */
  value: (row: CountryYear) => number;
  format: (v: number) => string;
  /** Fixed color-scale maximum (e.g. 1 for shares); otherwise the run maximum is used. */
  fixedMax?: number;
  /** Assumptions-drawer text: what is behind this number (spec §6). */
  explanation: string;
  sourceIds: string[];
}

export const METRICS: MetricDef[] = [
  {
    id: 'dcShareOfDemand',
    label: 'DC share of electricity demand',
    unit: '%',
    value: (r) => (r.totalDemandTwh > 0 ? r.dcEnergyTwh / r.totalDemandTwh : 0),
    format: (v) => `${(v * 100).toFixed(1)}%`,
    explanation:
      'Data center energy divided by total national demand (DC + exogenous baseline). Baseline growth follows a TYNDP-style trajectory; DC growth follows the IEA-anchored capture model.',
    sourceIds: ['entsoe2026tyndp', 'iea2025energyai', 'ember2025grids'],
  },
  {
    id: 'dcEnergyTwh',
    label: 'DC electricity demand',
    unit: 'TWh',
    value: (r) => r.dcEnergyTwh,
    format: (v) => `${v.toFixed(1)} TWh`,
    explanation:
      'Annual data center electricity consumption. 2024 country split is approximate (expert-guess); new capacity is allocated by existing-stock gravity and relative electricity price, constrained by grid-connection pipelines.',
    sourceIds: ['iea2025energyai', 'entsoe2026datacentres', 'expert-guess'],
  },
  {
    id: 'stressIndex',
    label: 'Grid stress index',
    unit: '0–1',
    value: (r) => r.stressIndex,
    format: (v) => v.toFixed(2),
    explanation:
      'Annual demand divided by total available resources (renewables + nuclear + legacy firm + gas capacity + NTC import capability). Import capability is direction-aware and grows along sourced 2024/2030/2040 anchors. A coarse adequacy proxy — no load flow, no intra-hour dispatch (see model limits).',
    sourceIds: ['ember2026interconnection', 'expert-guess'],
  },
  {
    id: 'dcShareOfPeak',
    label: 'DC share of peak load',
    unit: '%',
    value: (r) => r.dcShareOfPeak,
    format: (v) => `${(v * 100).toFixed(1)}%`,
    fixedMax: 0.4,
    explanation:
      'Firm (inference) data center draw as a share of national peak load. This is the criterion that actually trips the late-horizon stress flags — in the central run Ireland and Luxembourg cross it while their adequacy ratios stay comfortable. The flexibility lever acts directly on it.',
    sourceIds: ['noland2024baseload', 'ember2026interconnection', 'expert-guess'],
  },
  {
    id: 'renewablesShare',
    label: 'Renewables share of generation',
    unit: '%',
    value: (r) => (r.generationTwh > 0 ? r.renewablesTwh / r.generationTwh : 0),
    format: (v) => `${(v * 100).toFixed(0)}%`,
    fixedMax: 1,
    explanation:
      'Renewables (incl. hydro and bioenergy) divided by total domestic generation. Production-based accounting: imports are not attributed to any mix category (NTC model, no flow tracing) — check the net-import share alongside.',
    sourceIds: ['ember2025eer', 'expert-guess'],
  },
  {
    id: 'fossilShare',
    label: 'Fossil share of generation',
    unit: '%',
    value: (r) => (r.generationTwh > 0 ? r.fossilGenTwh / r.generationTwh : 0),
    format: (v) => `${(v * 100).toFixed(0)}%`,
    fixedMax: 1,
    explanation:
      'Gas dispatch plus legacy firm generation (coal, lignite, oil) divided by total domestic generation. Production-based; imports not attributed.',
    sourceIds: ['ember2025eer', 'expert-guess'],
  },
  {
    id: 'netImportShare',
    label: 'Net-import share of demand',
    unit: '%',
    value: (r) => r.netImportShare,
    format: (v) => `${(v * 100).toFixed(0)}%`,
    fixedMax: 1,
    explanation:
      'Share of national demand not covered by domestic generation. Shown alongside the generation mix because a production-based mix says little for heavy importers (e.g. Luxembourg).',
    sourceIds: ['ember2025eer', 'expert-guess'],
  },
  {
    id: 'emissionsMt',
    label: 'Power sector emissions proxy',
    unit: 'Mt CO₂',
    value: (r) => r.emissionsMt,
    format: (v) => `${v.toFixed(1)} Mt`,
    explanation:
      'Gas dispatched as residual demand × 0.37 Mt/TWh plus legacy firm generation × 0.85 Mt/TWh. These are direct-combustion factors anchored on IPCC AR5; they sit below the lifecycle medians by design, since upstream methane, fuel transport and plant construction are not tracked — so this figure is a lower bound.',
    sourceIds: ['ipcc2014ar5annex3', 'ember2025eer'],
  },
];

/** 5 sequential bins (validated palette); domain is [0, max] over the whole run for stable animation. */
export const BIN_VARS = ['--seq-1', '--seq-2', '--seq-3', '--seq-4', '--seq-5'] as const;

export function binIndex(v: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(BIN_VARS.length - 1, Math.floor((v / max) * BIN_VARS.length));
}

export function binThresholds(max: number): number[] {
  return BIN_VARS.map((_, i) => (max * i) / BIN_VARS.length);
}
