import type { CountryYear } from '@energie4ai/sim-core';
import type { Strings } from '../i18n/index.js';

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

export function metricsFor(t: Strings): MetricDef[] {
  return [
    {
      id: 'dcShareOfDemand',
      label: t.metrics.dcShareOfDemand,
      unit: '%',
      value: (r) => (r.totalDemandTwh > 0 ? r.dcEnergyTwh / r.totalDemandTwh : 0),
      format: (v) => `${(v * 100).toFixed(1)}%`,
      explanation: t.metrics.dcShareOfDemandNote,
      sourceIds: ['entsoe2026tyndp', 'iea2025energyai', 'ember2025grids'],
    },
    {
      id: 'dcEnergyTwh',
      label: t.metrics.dcEnergyTwh,
      unit: 'TWh',
      value: (r) => r.dcEnergyTwh,
      format: (v) => `${v.toFixed(1)} TWh`,
      explanation: t.metrics.dcEnergyTwhNote,
      sourceIds: ['iea2025energyai', 'entsoe2026datacentres', 'expert-guess'],
    },
    {
      id: 'stressIndex',
      label: t.metrics.stressIndex,
      unit: '0–1',
      value: (r) => r.stressIndex,
      format: (v) => v.toFixed(2),
      explanation: t.metrics.stressIndexNote,
      sourceIds: ['ember2026interconnection', 'expert-guess'],
    },
    {
      id: 'dcShareOfPeak',
      label: t.metrics.dcShareOfPeak,
      unit: '%',
      value: (r) => r.dcShareOfPeak,
      format: (v) => `${(v * 100).toFixed(1)}%`,
      fixedMax: 0.4,
      explanation: t.metrics.dcShareOfPeakNote,
      sourceIds: ['noland2024baseload', 'ember2026interconnection', 'expert-guess'],
    },
    {
      id: 'renewablesShare',
      label: t.metrics.renewablesShare,
      unit: '%',
      value: (r) => (r.generationTwh > 0 ? r.renewablesTwh / r.generationTwh : 0),
      format: (v) => `${(v * 100).toFixed(0)}%`,
      fixedMax: 1,
      explanation: t.metrics.renewablesShareNote,
      sourceIds: ['ember2025eer', 'expert-guess'],
    },
    {
      id: 'fossilShare',
      label: t.metrics.fossilShare,
      unit: '%',
      value: (r) => (r.generationTwh > 0 ? r.fossilGenTwh / r.generationTwh : 0),
      format: (v) => `${(v * 100).toFixed(0)}%`,
      fixedMax: 1,
      explanation: t.metrics.fossilShareNote,
      sourceIds: ['ember2025eer', 'expert-guess'],
    },
    {
      id: 'netImportShare',
      label: t.metrics.netImportShare,
      unit: '%',
      value: (r) => r.netImportShare,
      format: (v) => `${(v * 100).toFixed(0)}%`,
      fixedMax: 1,
      explanation: t.metrics.netImportShareNote,
      sourceIds: ['ember2025eer', 'expert-guess'],
    },
    {
      id: 'emissionsMt',
      label: t.metrics.emissionsMt,
      unit: 'Mt CO₂',
      value: (r) => r.emissionsMt,
      format: (v) => `${v.toFixed(1)} Mt`,
      explanation: t.metrics.emissionsMtNote,
      sourceIds: ['ipcc2014ar5annex3', 'ember2025eer'],
    },
  ];
}

/** 5 sequential bins (validated palette); domain is [0, max] over the whole run for stable animation. */
export const BIN_VARS = ['--seq-1', '--seq-2', '--seq-3', '--seq-4', '--seq-5'] as const;

export function binIndex(v: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(BIN_VARS.length - 1, Math.floor((v / max) * BIN_VARS.length));
}

export function binThresholds(max: number): number[] {
  return BIN_VARS.map((_, i) => (max * i) / BIN_VARS.length);
}
