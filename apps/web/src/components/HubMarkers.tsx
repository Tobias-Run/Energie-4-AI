import type { Hub } from '@energie4ai/sim-core';
import { projectPoint } from '../lib/geo.js';

const RADIUS: Record<Hub['sizeClass'], number> = {
  major: 6.5,
  mid: 4.5,
  regional: 3.5,
  none: 3.5,
};

export interface PlacedHub extends Hub {
  x: number;
  y: number;
}

/** Hubs that fall inside the map's clip area, with canvas coordinates attached. */
export function placeHubs(hubs: Hub[]): PlacedHub[] {
  return hubs.flatMap((h) => {
    const p = projectPoint(h.lon, h.lat);
    return p ? [{ ...h, x: p.x, y: p.y }] : [];
  });
}

interface Props {
  hubs: PlacedHub[];
  onHover: (hub: PlacedHub | null) => void;
}

/**
 * Data center cluster markers (issue #2). Country-level model, so these are annotations
 * — they carry no simulated value. The `driver` is encoded by marker *shape* rather than
 * an extra hue: the map already spends its color budget on the choropleth, and shape
 * survives both color-vision deficiency and the dark/light swap.
 *   filled = interconnection-driven · ring = power-driven · ring with core = both
 */
export function HubMarkers({ hubs, onHover }: Props) {
  return (
    <g aria-label="Data center cluster locations">
      {hubs.map((h) => {
        const r = RADIUS[h.sizeClass];
        const filled = h.driver === 'peering';
        return (
          <g
            key={h.id}
            tabIndex={0}
            role="img"
            aria-label={`${h.name} data center cluster${h.ixpName ? `, internet exchange ${h.ixpName}` : ', no internet exchange'}, ${h.driver}-driven`}
            style={{ cursor: 'pointer', outline: 'none' }}
            onMouseEnter={() => onHover(h)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(h)}
            onBlur={() => onHover(null)}
          >
            {/* halo keeps the marker legible over any choropleth bin */}
            <circle cx={h.x} cy={h.y} r={r + 1.6} fill="var(--hub-halo)" opacity={0.85} />
            <circle
              cx={h.x}
              cy={h.y}
              r={r}
              fill={filled ? 'var(--hub-marker)' : 'none'}
              stroke="var(--hub-marker)"
              strokeWidth={1.8}
            />
            {h.driver === 'mixed' && (
              <circle cx={h.x} cy={h.y} r={r * 0.4} fill="var(--hub-marker)" />
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Legend entries for the marker vocabulary, drawn as tiny inline SVGs. */
export function HubLegend() {
  const item = (label: string, render: React.ReactNode) => (
    <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <svg width={16} height={16} aria-hidden="true">
        {render}
      </svg>
      <span>{label}</span>
    </span>
  );
  return (
    <>
      {item('interconnection-driven', <circle cx={8} cy={8} r={4.5} fill="var(--hub-marker)" />)}
      {item(
        'power-driven',
        <circle cx={8} cy={8} r={4.5} fill="none" stroke="var(--hub-marker)" strokeWidth={1.8} />,
      )}
      {item(
        'both',
        <g>
          <circle cx={8} cy={8} r={4.5} fill="none" stroke="var(--hub-marker)" strokeWidth={1.8} />
          <circle cx={8} cy={8} r={1.8} fill="var(--hub-marker)" />
        </g>,
      )}
    </>
  );
}
