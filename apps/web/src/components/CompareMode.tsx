import { useMemo, useRef } from 'react';
import { runSimulation, type Levers } from '@energie4ai/sim-core';
import { exportPng, exportSvg } from '../lib/export.js';

export interface PinnedScenario {
  id: string;
  label: string;
  levers: Levers;
}

interface Props {
  pinned: PinnedScenario[];
  current: Levers;
  fromYear: number;
  currentYear: number;
  onPin: () => void;
  onRemove: (id: string) => void;
}

const W = 640;
const H = 210;
const PAD = { top: 16, right: 78, bottom: 22, left: 44 };
const COLORS = ['var(--bench-eu)', 'var(--bench-us)', 'var(--bench-cn)'];

/** One-line summary of what makes a pinned scenario different from the central one. */
export function describeLevers(l: Levers): string {
  const parts: string[] = [];
  if (l.computeGrowthMultiplier !== 1) parts.push(`growth ×${l.computeGrowthMultiplier}`);
  if (l.extraEfficiencyRate !== 0)
    parts.push(`eff ${(l.extraEfficiencyRate * 100).toFixed(1)}%/yr`);
  if (l.permittingReform) parts.push('reform');
  if (l.sitingPolicy !== 'market') parts.push(`siting: ${l.sitingPolicy}`);
  if (l.flexibilityShare !== 0) parts.push(`flex ${(l.flexibilityShare * 100).toFixed(0)}%`);
  if (l.priceSensitivity !== 1) parts.push(`price ×${l.priceSensitivity}`);
  return parts.length > 0 ? parts.join(' · ') : 'central scenario';
}

/**
 * Compare up to three pinned scenarios (spec §6). Deliberately deterministic runs only:
 * three scenarios at 200 Monte Carlo samples each would cost roughly two seconds per lever
 * move, and overlaying three corridors produces a band pile no one can read. Uncertainty
 * stays on the single active scenario.
 */
export function CompareMode({ pinned, current, fromYear, currentYear, onPin, onRemove }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const series = useMemo(
    () =>
      pinned.map((s) => {
        const r = runSimulation({ levers: s.levers });
        const from = r.years.indexOf(fromYear);
        // The most DC-saturated country is what siting policy actually moves; the EU total
        // barely budges, so a table without this column reads as three identical rows.
        const mostSaturated = (idx: number) =>
          Object.entries(r.countries)
            .map(([iso, series]) => {
              const row = series[from + idx]!;
              return {
                iso,
                share: row.totalDemandTwh > 0 ? row.dcEnergyTwh / row.totalDemandTwh : 0,
              };
            })
            .sort((a, b) => b.share - a.share)[0]!;
        return {
          ...s,
          years: r.years.slice(from),
          values: r.aggregates.slice(from).map((a) => a.euDcTwh),
          aggregates: r.aggregates.slice(from),
          mostSaturated,
        };
      }),
    [pinned, fromYear],
  );

  const canPin = pinned.length < 3;

  if (series.length === 0) {
    return (
      <div>
        <h2>Compare scenarios</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Pin the current lever settings to compare up to three scenarios side by side.
        </p>
        <button onClick={onPin}>+ Pin current scenario</button>
      </div>
    );
  }

  const years = series[0]!.years;
  const max = Math.max(...series.flatMap((s) => s.values)) * 1.08;
  const x = (year: number) =>
    PAD.left +
    ((year - years[0]!) / (years[years.length - 1]! - years[0]!)) * (W - PAD.left - PAD.right);
  const y = (v: number) => H - PAD.bottom - (v / max) * (H - PAD.top - PAD.bottom);
  const line = (vals: number[]) =>
    years
      .map((yr, i) => `${i === 0 ? 'M' : 'L'}${x(yr).toFixed(1)},${y(vals[i]!).toFixed(1)}`)
      .join('');

  const yearIdx = years.indexOf(currentYear);
  const gridYs = [0.25, 0.5, 0.75, 1]
    .map((f) => Math.round((max * f) / 10) * 10)
    .filter((v) => v > 0 && v <= max);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <h2 style={{ margin: '0 0 2px' }}>Compare scenarios — EU-27 DC demand (TWh)</h2>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 6 }}>
          <button onClick={onPin} disabled={!canPin} title={canPin ? undefined : 'Maximum of 3'}>
            + Pin current
          </button>
          <button onClick={() => svgRef.current && exportSvg(svgRef.current, 'compare.svg')}>
            SVG
          </button>
          <button onClick={() => svgRef.current && void exportPng(svgRef.current, 'compare.png')}>
            PNG
          </button>
        </span>
      </div>

      <div className="legend" style={{ marginBottom: 2 }}>
        {series.map((s, i) => (
          <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <span className="swatch" style={{ background: COLORS[i] }} />
            <span>{s.label}</span>
            <button
              onClick={() => onRemove(s.id)}
              aria-label={`Remove ${s.label}`}
              style={{ padding: '0 5px', lineHeight: 1.2 }}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Comparison of ${series.length} pinned scenarios, EU-27 data center demand`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
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
        {series.map((s, i) => (
          <path key={s.id} d={line(s.values)} fill="none" stroke={COLORS[i]} strokeWidth={2} />
        ))}
        {series.map((s, i) => (
          <text
            key={s.id}
            x={W - PAD.right + 4}
            y={y(s.values[s.values.length - 1]!) + 3}
            fontSize={10}
            fill={COLORS[i]}
          >
            {Math.round(s.values[s.values.length - 1]!)}
          </text>
        ))}
      </svg>

      <table className="data-table" style={{ marginTop: 6 }}>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Levers</th>
            <th>EU DC {currentYear}</th>
            <th>Most saturated</th>
            <th>Flags</th>
          </tr>
        </thead>
        <tbody>
          {series.map((s) => {
            const idx = yearIdx >= 0 ? yearIdx : s.aggregates.length - 1;
            const a = s.aggregates[idx]!;
            const top = s.mostSaturated(idx);
            return (
              <tr key={s.id}>
                <td>{s.label}</td>
                <td className="muted">{describeLevers(s.levers)}</td>
                <td>
                  {a.euDcTwh.toFixed(0)} TWh ({(a.euDcShareOfDemand * 100).toFixed(1)}%)
                </td>
                <td>
                  {top.iso} {(top.share * 100).toFixed(0)}%
                </td>
                <td>{a.flaggedRegions.join(', ') || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {series.length > 1 &&
        Math.max(...series.map((s) => s.values[s.values.length - 1]!)) /
          Math.min(...series.map((s) => s.values[s.values.length - 1]!)) <
          1.01 && (
          <p className="muted" style={{ margin: '4px 0 0' }}>
            These scenarios end within 1% of each other, so the lines overlap almost exactly. That
            is the result, not a rendering fault: siting and permitting redistribute load rather
            than changing how much of it Europe ends up with. The difference is in the two
            right-hand columns.
          </p>
        )}
      <p className="muted" style={{ margin: '4px 0 0' }}>
        Pinned scenarios are deterministic central runs. Uncertainty corridors stay on the active
        scenario — three overlaid bands are unreadable, and three Monte Carlo draws would cost about
        two seconds on every lever move.{' '}
        {describeLevers(current) !== 'central scenario' &&
          `Current settings (${describeLevers(current)}) are not pinned yet.`}
      </p>
    </div>
  );
}
