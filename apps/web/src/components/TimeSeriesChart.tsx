import { useMemo, useRef, useState } from 'react';

interface Props {
  years: number[];
  values: number[];
  currentYear: number;
  title: string;
  unit: string;
  onYear?: (y: number) => void;
}

const W = 640;
const H = 180;
const PAD = { top: 14, right: 46, bottom: 22, left: 44 };

/** Single-series line chart (no legend needed — the title names it) with crosshair hover. */
export function TimeSeriesChart({ years, values, currentYear, title, unit, onYear }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const max = useMemo(() => Math.max(...values) * 1.08, [values]);
  const x = (year: number) =>
    PAD.left +
    ((year - years[0]!) / (years[years.length - 1]! - years[0]!)) * (W - PAD.left - PAD.right);
  const y = (v: number) => H - PAD.bottom - (v / max) * (H - PAD.top - PAD.bottom);

  const line = years
    .map((yr, i) => `${i === 0 ? 'M' : 'L'}${x(yr).toFixed(1)},${y(values[i]!).toFixed(1)}`)
    .join('');

  const idxFromEvent = (e: React.MouseEvent): number => {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const t = (px - PAD.left) / (W - PAD.left - PAD.right);
    return Math.max(0, Math.min(years.length - 1, Math.round(t * (years.length - 1))));
  };

  const gridYs = [0.25, 0.5, 0.75, 1].map((f) => max * f);
  const curIdx = years.indexOf(currentYear);
  const hi = hoverIdx ?? curIdx;

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>{title}</h2>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${title}, ${years[0]} to ${years[years.length - 1]}`}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          cursor: onYear ? 'pointer' : 'crosshair',
        }}
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
              {Math.round(v)}
            </text>
          </g>
        ))}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={y(0)}
          y2={y(0)}
          stroke="var(--baseline)"
          strokeWidth={1}
        />
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

        <path d={line} fill="none" stroke="var(--series-1)" strokeWidth={2} />

        {/* current-year marker */}
        {curIdx >= 0 && (
          <line
            x1={x(currentYear)}
            x2={x(currentYear)}
            y1={PAD.top}
            y2={H - PAD.bottom}
            stroke="var(--text-muted)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {/* hover crosshair + point */}
        {hi >= 0 && (
          <g>
            <circle
              cx={x(years[hi]!)}
              cy={y(values[hi]!)}
              r={4}
              fill="var(--series-1)"
              stroke="var(--surface-1)"
              strokeWidth={2}
            />
            <text
              x={Math.min(x(years[hi]!) + 6, W - PAD.right)}
              y={y(values[hi]!) - 8}
              fontSize={11}
              fill="var(--text-primary)"
            >
              {years[hi]}: {values[hi]!.toFixed(1)} {unit}
            </text>
          </g>
        )}

        {/* direct end label */}
        <text
          x={W - PAD.right + 4}
          y={y(values[values.length - 1]!) + 3}
          fontSize={10}
          fill="var(--text-secondary)"
        >
          {Math.round(values[values.length - 1]!)}
        </text>
      </svg>
      <p className="muted" style={{ margin: '2px 0 0' }}>
        Click the chart to jump to a year.
      </p>
    </div>
  );
}
