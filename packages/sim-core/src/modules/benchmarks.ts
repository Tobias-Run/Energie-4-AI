import { regionalBenchmarks } from '../data.js';

/**
 * Exogenous regional DC-demand benchmarks (issue #13). Piecewise-linear interpolation
 * between published anchor points; returns null beyond the last anchor — the published
 * projections end there and the tool must not silently extrapolate (honest-limits rule).
 */
export function benchmarkTwh(regionId: string, year: number): number | null {
  const region = regionalBenchmarks.regions.find((r) => r.id === regionId);
  if (!region) throw new Error(`unknown benchmark region ${regionId}`);
  return interpolateAnchors(region.anchorsTwh, year);
}

export function globalEnvelopeTwh(year: number): number | null {
  return interpolateAnchors(regionalBenchmarks.globalEnvelopeTwh, year);
}

export function benchmarkRegions(): Array<{ id: string; name: string }> {
  return regionalBenchmarks.regions.map(({ id, name }) => ({ id, name }));
}

/** Last year covered by published anchors (charts must stop benchmark lines here). */
export function benchmarkHorizon(): number {
  return Math.max(
    ...regionalBenchmarks.regions.flatMap((r) => Object.keys(r.anchorsTwh).map(Number)),
  );
}

function interpolateAnchors(anchors: Record<string, number>, year: number): number | null {
  const years = Object.keys(anchors)
    .map(Number)
    .sort((a, b) => a - b);
  const first = years[0]!;
  const last = years[years.length - 1]!;
  if (year < first || year > last) return null;
  for (let i = 1; i < years.length; i++) {
    const y0 = years[i - 1]!;
    const y1 = years[i]!;
    if (year <= y1) {
      const t = (year - y0) / (y1 - y0);
      return anchors[String(y0)]! + t * (anchors[String(y1)]! - anchors[String(y0)]!);
    }
  }
  return anchors[String(last)]!;
}
