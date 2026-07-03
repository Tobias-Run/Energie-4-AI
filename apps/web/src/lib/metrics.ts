import type { CountryYear } from '@energie4ai/sim-core';

export interface MetricDef {
  id: string;
  label: string;
  unit: string;
  /** Extract the value from a country-year row. */
  value: (row: CountryYear) => number;
  format: (v: number) => string;
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
      'Annual demand divided by total available resources (domestic low-carbon + legacy firm + gas capacity + NTC import capability). A coarse adequacy proxy — no load flow, no intra-hour dispatch (see model limits).',
    sourceIds: ['expert-guess'],
  },
  {
    id: 'emissionsMt',
    label: 'Power sector emissions proxy',
    unit: 'Mt CO₂',
    value: (r) => r.emissionsMt,
    format: (v) => `${v.toFixed(1)} Mt`,
    explanation:
      'Gas dispatched as residual demand × 0.37 Mt/TWh plus legacy firm generation × 0.85 Mt/TWh. Emission factors are expert-guess placeholders pending a sourced dataset.',
    sourceIds: ['expert-guess'],
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
