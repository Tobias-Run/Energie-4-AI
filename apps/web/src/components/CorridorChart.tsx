import { useRef, useState } from 'react';
import type { CorridorBand } from '@energie4ai/sim-core';

interface Props {
  corridor: CorridorBand;
  fromYear: number;
  currentYear: number;
  runs: number;
  onYear?: (y: number) => void;
}

const W = 640;
const H = 230;
const PAD = { top: 16, right: 72, bottom: 22, left: 44 };

/**
 * Uncertainty corridor (mission document §5.5): p10–p90 band from the Monte Carlo draw,
 * with the sampled median and the unperturbed central run drawn on top. Central and median
 * are deliberately both shown — they separate when the ranges are skewed, and that gap is
 * information rather than an error.
 */
export function CorridorChart({ corridor, fromYear, currentYear, runs, onYear }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const from = corridor.years.indexOf(fromYear);
  const years = corridor.years.slice(from);
  const p10 = corridor.p10.slice(from);
  const p50 = corridor.p50.slice(from);
  const p90 = corridor.p90.slice(from);
  const central = corridor.central.slice(from);

  const max = Math.max(...p90) * 1.08;
  const x = (year: number) =>
    PAD.left +
    ((year - years[0]!) / (years[years.length - 1]! - years[0]!)) * (W - PAD.left - PAD.right);
  const y = (v: number) => H - PAD.bottom - (v / max) * (H - PAD.top - PAD.bottom);

  const band = [
    ...years.map((yr, i) => `${x(yr).toFixed(1)},${y(p90[i]!).toFixed(1)}`),
    ...years.map((yr, i) => `${x(yr).toFixed(1)},${y(p10[i]!).toFixed(1)}`).reverse(),
  ].join('L');

  const line = (vals: number[]) =>
    years
      .map((yr, i) => `${i === 0 ? 'M' : 'L'}${x(yr).toFixed(1)},${y(vals[i]!).toFixed(1)}`)
      .join('');

  const idxFromEvent = (e: React.MouseEvent): number => {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const t = (px - PAD.left) / (W - PAD.left - PAD.right);
    return Math.max(0, Math.min(years.length - 1, Math.round(t * (years.length - 1))));
  };

  const hi = hoverIdx ?? years.indexOf(currentYear);
  const last = years.length - 1;
  const gridYs = [0.25, 0.5, 0.75, 1]
    .map((f) => Math.round((max * f) / 10) * 10)
    .filter((v) => v > 0 && v <= max);

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>EU-27 data center demand — uncertainty corridor (TWh)</h2>
      <div className="legend" style={{ marginBottom: 2 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <span className="swatch" style={{ background: 'var(--series-1)', opacity: 0.22 }} />
          <span>p10–p90 across {runs} runs</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <svg width={20} height={10} aria-hidden="true">
            <line x1={0} x2={20} y1={5} y2={5} stroke="var(--series-1)" strokeWidth={2} />
          </svg>
          <span>sampled median</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <svg width={20} height={10} aria-hidden="true">
            <line
              x1={0}
              x2={20}
              y1={5}
              y2={5}
              stroke="var(--text-primary)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          </svg>
          <span>central run</span>
        </span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`EU-27 data center demand uncertainty corridor, tenth to ninetieth percentile across ${runs} Monte Carlo runs`}
        style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }}
        onMouseMove={(e) => setHoverIdx(idxFromEvent(e))}
        onMouseLeave={() => setHoverIdx(null)}
        onClick={(e) => onYear?.(years[idxFromEvent(e)]!)}
      >
        {gridYs.map((v) => (
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
        ))}
        {[years[0]!, 2030, 2035, 2040, years[last]!].map((yr) => (
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

        <path d={`M${band}Z`} fill="var(--series-1)" opacity={0.22} />
        <path d={line(p50)} fill="none" stroke="var(--series-1)" strokeWidth={2} />
        <path
          d={line(central)}
          fill="none"
          stroke="var(--text-primary)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />

        <text
          x={W - PAD.right + 4}
          y={y(p90[last]!) + 3}
          fontSize={10}
          fill="var(--text-secondary)"
        >
          p90 {Math.round(p90[last]!)}
        </text>
        <text
          x={W - PAD.right + 4}
          y={y(p10[last]!) + 3}
          fontSize={10}
          fill="var(--text-secondary)"
        >
          p10 {Math.round(p10[last]!)}
        </text>

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
              {years[hi]}: {Math.round(p10[hi]!)}–{Math.round(p90[hi]!)} TWh (median{' '}
              {Math.round(p50[hi]!)}, central {Math.round(central[hi]!)})
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
