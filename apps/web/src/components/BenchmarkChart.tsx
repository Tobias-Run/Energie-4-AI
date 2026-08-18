import { useRef, useState } from 'react';
import { benchmarkHorizon, benchmarkTwh } from '@energie4ai/sim-core';

interface Props {
  /** Full model years incl. base year 2024 (index base). */
  years: number[];
  /** EU-27 DC demand (model output), aligned with `years`. */
  euValues: number[];
  currentYear: number;
}

const W = 640;
const H = 200;
const PAD = { top: 16, right: 96, bottom: 22, left: 44 };

const REGIONS = [
  { id: 'EU', label: 'EU-27 (model)', color: 'var(--bench-eu)' },
  { id: 'US', label: 'USA', color: 'var(--bench-us)' },
  { id: 'CN', label: 'China', color: 'var(--bench-cn)' },
  { id: 'ROW', label: 'Rest of World', color: 'var(--bench-row)' },
] as const;

/**
 * Regional benchmark (issue #13): DC demand indexed to 2024 = 100. US/China/RoW are
 * exogenous published projections (IEA base case; US corroborated by LBNL/EPRI) and
 * end at the publication horizon — no silent extrapolation.
 */
export function BenchmarkChart({ years, euValues, currentYear }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const horizon = benchmarkHorizon();

  const indexed = (id: string): Array<number | null> => {
    if (id === 'EU') {
      const base = euValues[0]!;
      return euValues.map((v) => (v / base) * 100);
    }
    const base = benchmarkTwh(id, years[0]!)!;
    return years.map((y) => {
      const v = benchmarkTwh(id, y);
      return v === null ? null : (v / base) * 100;
    });
  };

  const seriesData = REGIONS.map((r) => ({ ...r, values: indexed(r.id) }));
  const max =
    Math.max(...seriesData.flatMap((s) => s.values.filter((v): v is number => v !== null))) * 1.08;

  const x = (year: number) =>
    PAD.left +
    ((year - years[0]!) / (years[years.length - 1]! - years[0]!)) * (W - PAD.left - PAD.right);
  const y = (v: number) => H - PAD.bottom - (v / max) * (H - PAD.top - PAD.bottom);

  const linePath = (values: Array<number | null>) => {
    let d = '';
    values.forEach((v, i) => {
      if (v === null) return;
      d += `${d === '' ? 'M' : 'L'}${x(years[i]!).toFixed(1)},${y(v).toFixed(1)}`;
    });
    return d;
  };

  const idxFromEvent = (e: React.MouseEvent): number => {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const t = (px - PAD.left) / (W - PAD.left - PAD.right);
    return Math.max(0, Math.min(years.length - 1, Math.round(t * (years.length - 1))));
  };

  const hi = hoverIdx ?? years.indexOf(Math.min(currentYear, horizon));

  // Decluttered end-of-line labels: raw y-positions often land within a few px of each
  // other (regions converge in growth rate), which makes overlapping text unreadable.
  // Sort by vertical position, then push down any label that's too close to the one above.
  const MIN_LABEL_GAP = 11;
  const rawEndPoints: Array<{ id: string; x: number; y: number; text: string }> = [];
  for (const s of seriesData) {
    let lastIdx = -1;
    s.values.forEach((v, i) => {
      if (v !== null) lastIdx = i;
    });
    if (lastIdx < 0) continue;
    rawEndPoints.push({
      id: s.id,
      x: x(years[lastIdx]!) + 4,
      y: y(s.values[lastIdx]!),
      text: `${s.label.replace(' (model)', '')} ${Math.round(s.values[lastIdx]!)}`,
    });
  }
  rawEndPoints.sort((a, b) => a.y - b.y);
  const endLabels: Array<{ id: string; x: number; labelY: number; text: string }> = [];
  for (const l of rawEndPoints) {
    const prev = endLabels[endLabels.length - 1];
    const labelY = prev ? Math.max(l.y, prev.labelY + MIN_LABEL_GAP) : l.y;
    endLabels.push({ id: l.id, x: l.x, labelY, text: l.text });
  }

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>DC demand growth benchmark (index, 2024 = 100)</h2>
      <div className="legend" style={{ marginBottom: 2 }}>
        {REGIONS.map((r) => (
          <span key={r.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <span className="swatch" style={{ background: r.color }} />
            <span>{r.label}</span>
          </span>
        ))}
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Data center demand growth: EU-27 model output vs. published projections for USA, China, and Rest of World, indexed to 2024"
        style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
        onMouseMove={(e) => setHoverIdx(idxFromEvent(e))}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {[100, 200, 300].map((v) =>
          v < max ? (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--gridline)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 6}
                y={y(v) + 3}
                textAnchor="end"
                fontSize={10}
                fill="var(--text-muted)"
              >
                {v}
              </text>
            </g>
          ) : null,
        )}
        {[years[0]!, 2030, horizon, 2040, years[years.length - 1]!].map((yr) => (
          <text
            key={yr}
            x={x(yr)}
            y={H - 6}
            textAnchor="middle"
            fontSize={10}
            fill="var(--text-muted)"
          >
            {yr}
          </text>
        ))}
        {seriesData.map((s) => (
          <path key={s.id} d={linePath(s.values)} fill="none" stroke={s.color} strokeWidth={2} />
        ))}
        {/* direct labels at each line's end, decluttered so close-together lines stay legible */}
        {endLabels.map((l) => (
          <text key={l.id} x={l.x} y={l.labelY} fontSize={10} fill="var(--text-secondary)">
            {l.text}
          </text>
        ))}
        {hi >= 0 && (
          <g>
            <line
              x1={x(years[hi]!)}
              x2={x(years[hi]!)}
              y1={PAD.top}
              y2={H - PAD.bottom}
              stroke="var(--text-muted)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <text x={PAD.left} y={PAD.top - 4} fontSize={11} fill="var(--text-primary)">
              {years[hi]}:{' '}
              {seriesData
                .map((s) =>
                  s.values[hi] !== null
                    ? `${s.label.replace(' (model)', '')} ${Math.round(s.values[hi]!)}`
                    : null,
                )
                .filter(Boolean)
                .join(' · ')}
            </text>
          </g>
        )}
      </svg>
      <p className="muted" style={{ margin: '2px 0 0' }}>
        US/China/RoW: IEA base-case anchors (US corroborated by LBNL/EPRI); published projections
        end {horizon} — lines stop there, no extrapolation. 2035 regional split is expert-guess
        within the IEA global envelope.
      </p>
    </div>
  );
}
