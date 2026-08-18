import { useMemo, useRef, useState } from 'react';

interface Props {
  years: number[];
  renewables: number[];
  nuclear: number[];
  fossil: number[];
  currentYear: number;
  onYear?: (y: number) => void;
}

const W = 640;
const H = 200;
// right padding must fit the widest end label ("Renewables " + up to 4 digits)
const PAD = { top: 14, right: 108, bottom: 22, left: 44 };

const CATEGORIES = [
  { key: 'renewables', label: 'Renewables', color: 'var(--mix-ren)' },
  { key: 'nuclear', label: 'Nuclear', color: 'var(--mix-nuc)' },
  { key: 'fossil', label: 'Fossil', color: 'var(--mix-fossil)' },
] as const;

/** EU-27 generation mix, stacked by the three categories (issue #12). Production-based. */
export function SupplyMixChart({ years, renewables, nuclear, fossil, currentYear, onYear }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const series = useMemo(() => ({ renewables, nuclear, fossil }), [renewables, nuclear, fossil]);
  const totals = years.map((_, i) => renewables[i]! + nuclear[i]! + fossil[i]!);
  const max = Math.max(...totals) * 1.06;

  const x = (year: number) =>
    PAD.left +
    ((year - years[0]!) / (years[years.length - 1]! - years[0]!)) * (W - PAD.left - PAD.right);
  const y = (v: number) => H - PAD.bottom - (v / max) * (H - PAD.top - PAD.bottom);

  // stacked areas: fossil on top of nuclear on top of renewables
  const stackedAt = (i: number) => {
    const ren = series.renewables[i]!;
    const nuc = ren + series.nuclear[i]!;
    const fos = nuc + series.fossil[i]!;
    return { renewables: [0, ren], nuclear: [ren, nuc], fossil: [nuc, fos] } as const;
  };

  const areaPath = (key: (typeof CATEGORIES)[number]['key']) => {
    const top = years.map((yr, i) => `${x(yr).toFixed(1)},${y(stackedAt(i)[key][1]).toFixed(1)}`);
    const bottom = years
      .map((yr, i) => `${x(yr).toFixed(1)},${y(stackedAt(i)[key][0]).toFixed(1)}`)
      .reverse();
    return `M${top.join('L')}L${bottom.join('L')}Z`;
  };

  const idxFromEvent = (e: React.MouseEvent): number => {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const t = (px - PAD.left) / (W - PAD.left - PAD.right);
    return Math.max(0, Math.min(years.length - 1, Math.round(t * (years.length - 1))));
  };

  const hi = hoverIdx ?? years.indexOf(currentYear);
  const lastIdx = years.length - 1;

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>EU-27 generation mix (TWh, production-based)</h2>
      <div className="legend" style={{ marginBottom: 2 }}>
        {CATEGORIES.map((c) => (
          <span key={c.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <span className="swatch" style={{ background: c.color }} />
            <span>{c.label}</span>
          </span>
        ))}
        <span style={{ marginLeft: 'auto' }}>imports not attributed (no flow tracing)</span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="EU-27 generation mix by category over time"
        style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }}
        onMouseMove={(e) => setHoverIdx(idxFromEvent(e))}
        onMouseLeave={() => setHoverIdx(null)}
        onClick={(e) => onYear?.(years[idxFromEvent(e)]!)}
      >
        {CATEGORIES.map((c) => (
          <path
            key={c.key}
            d={areaPath(c.key)}
            fill={c.color}
            stroke="var(--surface-1)"
            strokeWidth={2}
          />
        ))}
        {/* direct labels at the right edge, centered in each band */}
        {CATEGORIES.map((c) => {
          const seg = stackedAt(lastIdx)[c.key];
          return (
            <text
              key={c.key}
              x={W - PAD.right + 4}
              y={y((seg[0] + seg[1]) / 2) + 3}
              fontSize={10}
              fill="var(--text-secondary)"
            >
              {c.label} {Math.round(seg[1] - seg[0])}
            </text>
          );
        })}
        {[years[0]!, 2030, 2035, 2040, years[years.length - 1]!].map((yr) => (
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
        <text
          x={PAD.left - 6}
          y={y(max / 1.06) + 3}
          textAnchor="end"
          fontSize={10}
          fill="var(--text-muted)"
        >
          {Math.round(max / 1.06)}
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
            <text x={PAD.left} y={PAD.top - 2} fontSize={11} fill="var(--text-primary)">
              {years[hi]}: R {Math.round(series.renewables[hi]!)} · N{' '}
              {Math.round(series.nuclear[hi]!)} · F {Math.round(series.fossil[hi]!)} TWh
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
