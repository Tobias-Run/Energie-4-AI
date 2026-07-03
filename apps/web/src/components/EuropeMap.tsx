import { useRef, useState } from 'react';
import type { CountryYear } from '@energie4ai/sim-core';
import { COUNTRY_SHAPES, MAP_HEIGHT, MAP_WIDTH, MISSING_ON_MAP } from '../lib/geo.js';
import { BIN_VARS, binIndex, binThresholds, type MetricDef } from '../lib/metrics.js';

interface Props {
  rows: Record<string, CountryYear>;
  names: Record<string, string>;
  metric: MetricDef;
  domainMax: number;
  year: number;
}

interface Hover {
  iso: string;
  x: number;
  y: number;
}

export function EuropeMap({ rows, names, metric, domainMax, year }: Props) {
  const [hover, setHover] = useState<Hover | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onMove = (iso: string) => (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHover({ iso, x: e.clientX - rect.left + 12, y: e.clientY - rect.top + 12 });
  };

  const hoverRow = hover ? rows[hover.iso] : undefined;
  const thresholds = binThresholds(domainMax);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        role="img"
        aria-label={`Europe map, ${metric.label} in ${year}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {COUNTRY_SHAPES.map((s, i) => {
          if (!s.iso) {
            return (
              <path
                key={i}
                d={s.d}
                fill="var(--map-other)"
                stroke="var(--gridline)"
                strokeWidth={0.5}
              />
            );
          }
          const row = rows[s.iso];
          const v = row ? metric.value(row) : 0;
          const fill = row ? `var(${BIN_VARS[binIndex(v, domainMax)]})` : 'var(--map-other)';
          const flagged = row?.flagged ?? false;
          return (
            <path
              key={i}
              d={s.d}
              fill={fill}
              stroke={flagged ? 'var(--status-critical)' : 'var(--surface-1)'}
              strokeWidth={flagged ? 1.6 : 0.7}
              strokeDasharray={flagged ? '3 2' : undefined}
              tabIndex={0}
              aria-label={`${names[s.iso] ?? s.iso}: ${row ? metric.format(v) : 'no data'}${flagged ? ', stress flag' : ''}`}
              onMouseMove={onMove(s.iso)}
              onMouseLeave={() => setHover(null)}
              onFocus={(e) => {
                const rect = containerRef.current?.getBoundingClientRect();
                const box = (e.target as SVGPathElement).getBoundingClientRect();
                if (rect)
                  setHover({
                    iso: s.iso!,
                    x: box.x - rect.x + box.width / 2,
                    y: box.y - rect.y + box.height / 2,
                  });
              }}
              onBlur={() => setHover(null)}
              style={{ cursor: 'pointer', outline: 'none' }}
            />
          );
        })}
      </svg>

      {hover && hoverRow && (
        <div className="tooltip" style={{ left: hover.x, top: hover.y }}>
          <div className="tt-title">
            {names[hover.iso] ?? hover.iso} · {year}
          </div>
          <div>
            {metric.label}: <strong>{metric.format(metric.value(hoverRow))}</strong>
          </div>
          <div className="muted">
            DC {hoverRow.dcEnergyTwh.toFixed(1)} TWh · stress {hoverRow.stressIndex.toFixed(2)}
            {hoverRow.queueGw > 0.005 && <> · queue {hoverRow.queueGw.toFixed(2)} GW</>}
          </div>
          {hoverRow.flagged && (
            <div className="tt-flag">⚠ stress flag (DC share of peak or adequacy threshold)</div>
          )}
        </div>
      )}

      <div className="legend" style={{ marginTop: 6 }}>
        <span style={{ marginRight: 4 }}>
          {metric.label} ({metric.unit})
        </span>
        {BIN_VARS.map((cssVar, i) => (
          <span key={cssVar} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <span className="swatch" style={{ background: `var(${cssVar})` }} />
            <span>≥ {metric.format(thresholds[i]!).replace(' TWh', '').replace(' Mt', '')}</span>
          </span>
        ))}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <span
            className="swatch"
            style={{
              background: 'transparent',
              borderColor: 'var(--status-critical)',
              borderStyle: 'dashed',
            }}
          />
          <span>stress flag</span>
        </span>
      </div>
      {MISSING_ON_MAP.length > 0 && (
        <p className="muted" style={{ margin: '4px 0 0' }}>
          {MISSING_ON_MAP.join(', ')} simulated but not shown at this map resolution — see table
          view.
        </p>
      )}
    </div>
  );
}
