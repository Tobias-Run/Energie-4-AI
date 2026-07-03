import type { CountryYear } from '@energie4ai/sim-core';
import type { MetricDef } from '../lib/metrics.js';

interface Props {
  rows: Record<string, CountryYear>;
  names: Record<string, string>;
  metric: MetricDef;
  year: number;
}

/** Accessible table view of the current map state (all 30 countries, sorted by metric). */
export function DataTable({ rows, names, metric, year }: Props) {
  const sorted = Object.entries(rows).sort(([, a], [, b]) => metric.value(b) - metric.value(a));
  return (
    <details className="drawer">
      <summary>Table view ({year}, all countries)</summary>
      <div style={{ maxHeight: 320, overflowY: 'auto', marginTop: 6 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Country</th>
              <th>{metric.label}</th>
              <th>DC (TWh)</th>
              <th>Stress</th>
              <th>Queue (GW)</th>
              <th>Flag</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(([iso, row]) => (
              <tr key={iso}>
                <td>{names[iso] ?? iso}</td>
                <td>{metric.format(metric.value(row))}</td>
                <td>{row.dcEnergyTwh.toFixed(1)}</td>
                <td>{row.stressIndex.toFixed(2)}</td>
                <td>{row.queueGw > 0.005 ? row.queueGw.toFixed(2) : '—'}</td>
                <td>{row.flagged ? '⚠' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
