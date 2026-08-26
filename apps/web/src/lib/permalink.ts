import { scenarioDefaults, type Levers, type SitingPolicy } from '@energie4ai/sim-core';
import { resolveLocale, type Locale } from '../i18n/index.js';

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
  if (s.levers.capturePost2030 !== d.capturePost2030) p.set('c', String(s.levers.capturePost2030));
  p.set('y', String(s.year));
  p.set('m', s.metricId);
  if (s.monteCarlo) p.set('mc', '1');
  return p.toString();
}

/** Same clamping, for a lever whose absence is meaningful rather than a fallback value. */
function optNum(raw: string | null, min: number, max: number): number | null {
  const v = Number(raw);
  if (raw === null || !Number.isFinite(v)) return null;
  return Math.min(max, Math.max(min, v));
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
      // Absent means "follow the data bundle" — the lever is an override, so that its default
      // leaves Monte Carlo perturbing the parameter (issue #41). Bounds are the published
      // uncertainty range, not the slider's own invention, so a hand-edited link cannot claim a
      // share no source states.
      capturePost2030: optNum(p.get('c'), 0.045, 0.09),
    },
    year: Math.round(num(p.get('y'), fallback.year, 2026, 2045)),
    metricId: p.get('m') ?? fallback.metricId,
    monteCarlo: p.get('mc') === '1',
  };
}

/** The chosen language rides along with the scenario, for the same reason: there is nowhere
 *  else to put it. Omitted when it matches what the browser would pick anyway, so a link
 *  shared between two German readers does not carry a redundant key. */
function withLocale(query: string, locale: Locale): string {
  const auto = resolveLocale('', navigator.languages ?? [navigator.language]);
  return locale === auto ? query : `${query}&lang=${locale}`;
}

/** Replace the address bar without adding a history entry — lever drags would otherwise
 *  bury the back button under hundreds of states. */
export function writeScenarioToUrl(s: ScenarioState, locale: Locale): void {
  const query = withLocale(encodeScenario(s), locale);
  window.history.replaceState(null, '', `${window.location.pathname}?${query}`);
}

export function scenarioUrl(s: ScenarioState, locale: Locale): string {
  const query = withLocale(encodeScenario(s), locale);
  return `${window.location.origin}${window.location.pathname}?${query}`;
}
