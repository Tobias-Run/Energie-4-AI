import { useMemo, useRef } from 'react';
import { runSimulation, type Levers } from '@energie4ai/sim-core';
import { exportPng, exportSvg } from '../lib/export.js';
import { fmt, useI18n, type Strings } from '../i18n/index.js';

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
export function describeLevers(l: Levers, t?: Strings): string {
  const parts: string[] = [];
  if (l.computeGrowthMultiplier !== 1) parts.push(`growth ×${l.computeGrowthMultiplier}`);
  if (l.extraEfficiencyRate !== 0)
    parts.push(`eff ${(l.extraEfficiencyRate * 100).toFixed(1)}%/yr`);
  if (l.permittingReform) parts.push('reform');
  if (l.sitingPolicy !== 'market') parts.push(`siting: ${l.sitingPolicy}`);
  if (l.flexibilityShare !== 0) parts.push(`flex ${(l.flexibilityShare * 100).toFixed(0)}%`);
  if (l.priceSensitivity !== 1) parts.push(`price ×${l.priceSensitivity}`);
  return parts.length > 0 ? parts.join(' · ') : (t?.compare.centralScenario ?? 'central scenario');
}

/**
 * Compare up to three pinned scenarios (spec §6). Deliberately deterministic runs only:
 * three scenarios at 200 Monte Carlo samples each would cost roughly two seconds per lever
 * move, and overlaying three corridors produces a band pile no one can read. Uncertainty
 * stays on the single active scenario.
 */
export function CompareMode({ pinned, current, fromYear, currentYear, onPin, onRemove }: Props) {
  const { t } = useI18n();
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
        <h2>{t.compare.emptyTitle}</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {t.compare.empty}
        </p>
        <button onClick={onPin}>{t.compare.pinFirst}</button>
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
        <h2 style={{ margin: '0 0 2px' }}>{t.compare.title}</h2>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 6 }}>
          <button
            onClick={onPin}
            disabled={!canPin}
            title={canPin ? undefined : t.compare.maxReached}
          >
            {t.compare.pin}
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
              aria-label={fmt(t.compare.remove, { label: s.label })}
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
        aria-label={fmt(t.compare.label, { count: series.length })}
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
        {series.map((s) => (
          <text
            key={s.id}
            x={W - PAD.right + 4}
            y={y(s.values[s.values.length - 1]!) + 3}
            fontSize={10}
            fill="var(--text-secondary)"
          >
            {Math.round(s.values[s.values.length - 1]!)}
          </text>
        ))}
      </svg>

      <table className="data-table" style={{ marginTop: 6 }}>
        <thead>
          <tr>
            <th>{t.compare.colScenario}</th>
            <th>{t.compare.colLevers}</th>
            <th>{fmt(t.compare.colDemand, { year: currentYear })}</th>
            <th>{t.compare.colSaturated}</th>
            <th>{t.compare.colFlags}</th>
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
                <td className="muted">{describeLevers(s.levers, t)}</td>
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
            {t.compare.overlapNote}
          </p>
        )}
      <p className="muted" style={{ margin: '4px 0 0' }}>
        {t.compare.note}{' '}
        {describeLevers(current, t) !== t.compare.centralScenario &&
          fmt(t.compare.unpinned, { levers: describeLevers(current, t) })}
      </p>
    </div>
  );
}
