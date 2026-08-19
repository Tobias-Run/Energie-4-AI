import { scenarioDefaults, type Levers, type SitingPolicy } from '@energie4ai/sim-core';

export interface ScenarioState {
  levers: Levers;
  year: number;
  metricId: string;
  monteCarlo: boolean;
}

const SITING_POLICIES: SitingPolicy[] = ['market', 'renewables', 'capped'];

/**
 * Scenario state lives in the URL and nowhere else — the project forbids localStorage and
 * sessionStorage, so the address bar is the only persistence there is. Keys are short
 * because the whole state has to stay pasteable, and every field is optional on read so an
 * old link keeps working after new levers are added.
 */
export function encodeScenario(s: ScenarioState): string {
  const d = scenarioDefaults.levers;
  const p = new URLSearchParams();
  // only non-default values are written, so a central-scenario link stays clean
  if (s.levers.computeGrowthMultiplier !== d.computeGrowthMultiplier)
    p.set('g', String(s.levers.computeGrowthMultiplier));
  if (s.levers.extraEfficiencyRate !== d.extraEfficiencyRate)
    p.set('e', String(s.levers.extraEfficiencyRate));
  if (s.levers.permittingReform !== d.permittingReform) p.set('r', '1');
  if (s.levers.sitingPolicy !== d.sitingPolicy) p.set('s', s.levers.sitingPolicy);
  if (s.levers.flexibilityShare !== d.flexibilityShare)
    p.set('f', String(s.levers.flexibilityShare));
  if (s.levers.priceSensitivity !== d.priceSensitivity)
    p.set('p', String(s.levers.priceSensitivity));
  p.set('y', String(s.year));
  p.set('m', s.metricId);
  if (s.monteCarlo) p.set('mc', '1');
  return p.toString();
}

/** Clamp to the range the corresponding UI control allows, so a hand-edited URL cannot
 *  push the model somewhere the sliders never could. */
function num(raw: string | null, fallback: number, min: number, max: number): number {
  const v = Number(raw);
  if (raw === null || !Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}

export function decodeScenario(search: string, fallback: ScenarioState): ScenarioState {
  const p = new URLSearchParams(search);
  const d = scenarioDefaults.levers;
  const siting = p.get('s');
  return {
    levers: {
      computeGrowthMultiplier: num(p.get('g'), d.computeGrowthMultiplier, 0.5, 2),
      extraEfficiencyRate: num(p.get('e'), d.extraEfficiencyRate, 0, 0.03),
      permittingReform: p.get('r') === '1' ? true : d.permittingReform,
      sitingPolicy:
        siting && (SITING_POLICIES as string[]).includes(siting)
          ? (siting as SitingPolicy)
          : d.sitingPolicy,
      flexibilityShare: num(p.get('f'), d.flexibilityShare, 0, 0.5),
      priceSensitivity: num(p.get('p'), d.priceSensitivity, 0, 3),
    },
    year: Math.round(num(p.get('y'), fallback.year, 2026, 2045)),
    metricId: p.get('m') ?? fallback.metricId,
    monteCarlo: p.get('mc') === '1',
  };
}

/** Replace the address bar without adding a history entry — lever drags would otherwise
 *  bury the back button under hundreds of states. */
export function writeScenarioToUrl(s: ScenarioState): void {
  const query = encodeScenario(s);
  window.history.replaceState(null, '', `${window.location.pathname}?${query}`);
}

export function scenarioUrl(s: ScenarioState): string {
  return `${window.location.origin}${window.location.pathname}?${encodeScenario(s)}`;
}
