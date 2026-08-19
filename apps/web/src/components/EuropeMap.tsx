import { useMemo, useRef, useState } from 'react';
import { hubs as HUB_DATA, type CountryYear } from '@energie4ai/sim-core';
import { COUNTRY_SHAPES, MAP_HEIGHT, MAP_WIDTH, MISSING_ON_MAP } from '../lib/geo.js';
import { BIN_VARS, binIndex, binThresholds, type MetricDef } from '../lib/metrics.js';
import { HubLegend, HubMarkers, placeHubs, type PlacedHub } from './HubMarkers.js';
import { fmt, useI18n } from '../i18n/index.js';

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
  const { t } = useI18n();
  const [hover, setHover] = useState<Hover | null>(null);
  const [showHubs, setShowHubs] = useState(true);
  const [hubHover, setHubHover] = useState<PlacedHub | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const placedHubs = useMemo(() => placeHubs(HUB_DATA), []);

  // Map-canvas coordinates -> container pixels, so the hub tooltip lands correctly
  // no matter how the SVG is scaled by its container.
  const hubTooltipPos = (h: PlacedHub) => {
    const svg = svgRef.current?.getBoundingClientRect();
    const box = containerRef.current?.getBoundingClientRect();
    if (!svg || !box) return { x: 0, y: 0 };
    const scale = svg.width / MAP_WIDTH;
    return {
      x: svg.x - box.x + h.x * scale + 12,
      y: svg.y - box.y + h.y * scale + 12,
    };
  };

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
        ref={svgRef}
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        role="img"
        aria-label={fmt(t.map.label, { metric: metric.label, year })}
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
              aria-label={`${names[s.iso] ?? s.iso}: ${row ? metric.format(v) : '—'}${flagged ? `, ${t.map.stressFlag}` : ''}`}
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
              style={{ cursor: 'pointer' }}
            />
          );
        })}
        {showHubs && <HubMarkers hubs={placedHubs} onHover={setHubHover} />}
      </svg>

      {hover && hoverRow && !hubHover && (
        <div className="tooltip" style={{ left: hover.x, top: hover.y }}>
          <div className="tt-title">
            {names[hover.iso] ?? hover.iso} · {year}
          </div>
          <div>
            {metric.label}: <strong>{metric.format(metric.value(hoverRow))}</strong>
          </div>
          <div className="muted">
            DC {hoverRow.dcEnergyTwh.toFixed(1)} TWh · {t.table.stress}{' '}
            {hoverRow.stressIndex.toFixed(2)}
            {hoverRow.queueGw > 0.005 && (
              <>
                {' '}
                · {t.map.queue} {hoverRow.queueGw.toFixed(2)} GW
              </>
            )}
          </div>
          <div className="muted">
            mix R/N/F:{' '}
            {hoverRow.generationTwh > 0
              ? `${Math.round((hoverRow.renewablesTwh / hoverRow.generationTwh) * 100)}/${Math.round((hoverRow.nuclearTwh / hoverRow.generationTwh) * 100)}/${Math.round((hoverRow.fossilGenTwh / hoverRow.generationTwh) * 100)}%`
              : '—'}{' '}
            · {t.map.imports} {Math.round(hoverRow.netImportShare * 100)}%
          </div>
          {hoverRow.flagged && <div className="tt-flag">⚠ {t.map.stressFlagTooltip}</div>}
        </div>
      )}

      {hubHover && (
        <div className="tooltip" style={hubTooltipPos(hubHover)}>
          <div className="tt-title">
            {hubHover.name}
            {hubHover.flapd && ' · FLAP-D'}
          </div>
          <div>
            {hubHover.ixpName ? (
              <>
                {t.map.exchange}: <strong>{hubHover.ixpName}</strong>
              </>
            ) : (
              <span className="muted">{t.map.noExchange}</span>
            )}
          </div>
          {hubHover.ixpPeakTbps !== null ? (
            <div className="muted">
              {fmt(t.map.peakTraffic, { tbps: hubHover.ixpPeakTbps, asOf: hubHover.asOf ?? '' })}
            </div>
          ) : (
            hubHover.ixpName && (
              <div className="muted">
                {fmt(t.map.sizeClassOnly, { sizeClass: hubHover.sizeClass })}
              </div>
            )
          )}
          <div className="muted">
            {t.map.clusterDriver}:{' '}
            {hubHover.driver === 'peering'
              ? t.map.driverPeeringLong
              : hubHover.driver === 'power'
                ? t.map.driverPowerLong
                : t.map.driverBothLong}
          </div>
          {rows[hubHover.iso] && (
            <div className="muted">
              {names[hubHover.iso] ?? hubHover.iso} {year}: DC{' '}
              {rows[hubHover.iso]!.dcEnergyTwh.toFixed(1)} TWh ({t.map.countryLevelNote})
            </div>
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
          <span>{t.map.stressFlag}</span>
        </span>
      </div>

      <div className="legend" style={{ marginTop: 4 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <input
            type="checkbox"
            checked={showHubs}
            onChange={(e) => {
              setShowHubs(e.target.checked);
              if (!e.target.checked) setHubHover(null);
            }}
          />
          <span>{t.map.clusters}</span>
        </label>
        {showHubs && <HubLegend />}
        {showHubs && <span style={{ marginLeft: 'auto' }}>{t.map.markerSize}</span>}
      </div>
      {MISSING_ON_MAP.length > 0 && (
        <p className="muted" style={{ margin: '4px 0 0' }}>
          {fmt(t.map.notShown, { list: MISSING_ON_MAP.join(', ') })}
        </p>
      )}
    </div>
  );
}
