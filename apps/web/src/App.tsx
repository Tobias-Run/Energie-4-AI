import { useMemo } from 'react';
import { aggregatesAt, runSimulation } from '@energie4ai/sim-core';

/**
 * P0 smoke page: proves the simulation core runs client-side within the performance
 * budget. The actual product UI (map, time slider, levers) is Phase P1 — deliberately
 * not started here (CLAUDE.md: no UI work until calibration gate V1 passes).
 */
export function App() {
  const result = useMemo(() => runSimulation(), []);
  const y2030 = aggregatesAt(result, 2030);
  const y2035 = aggregatesAt(result, 2035);
  const y2045 = aggregatesAt(result, 2045);

  const fmt = (n: number, digits = 0) =>
    n.toLocaleString('en-GB', { maximumFractionDigits: digits });

  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        maxWidth: 720,
        margin: '3rem auto',
        padding: '0 1rem',
      }}
    >
      <h1 style={{ marginBottom: 0 }}>Energie-4-AI</h1>
      <p style={{ marginTop: 4, color: '#555' }}>
        <em>GridSim — AI data center expansion vs. European power supply, 2026–2045</em>
      </p>
      <p>
        <strong>Phase P0 — model prototype.</strong> This page is an engine smoke check, not the
        product UI (that is Phase P1). Default run, computed in your browser in{' '}
        <strong>{result.meta.runtimeMs.toFixed(1)} ms</strong>.
      </p>
      <table style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Indicator', '2030', '2035', '2045'].map((h) => (
              <th
                key={h}
                style={{ textAlign: 'left', padding: '4px 12px', borderBottom: '1px solid #999' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '4px 12px' }}>Global DC demand (TWh)</td>
            <td style={{ padding: '4px 12px' }}>{fmt(y2030.globalDcTwh)}</td>
            <td style={{ padding: '4px 12px' }}>{fmt(y2035.globalDcTwh)}</td>
            <td style={{ padding: '4px 12px' }}>{fmt(y2045.globalDcTwh)}</td>
          </tr>
          <tr>
            <td style={{ padding: '4px 12px' }}>EU-27 DC demand (TWh)</td>
            <td style={{ padding: '4px 12px' }}>{fmt(y2030.euDcTwh)}</td>
            <td style={{ padding: '4px 12px' }}>{fmt(y2035.euDcTwh)}</td>
            <td style={{ padding: '4px 12px' }}>{fmt(y2045.euDcTwh)}</td>
          </tr>
          <tr>
            <td style={{ padding: '4px 12px' }}>DC share of EU demand</td>
            <td style={{ padding: '4px 12px' }}>{(y2030.euDcShareOfDemand * 100).toFixed(1)}%</td>
            <td style={{ padding: '4px 12px' }}>{(y2035.euDcShareOfDemand * 100).toFixed(1)}%</td>
            <td style={{ padding: '4px 12px' }}>{(y2045.euDcShareOfDemand * 100).toFixed(1)}%</td>
          </tr>
          <tr>
            <td style={{ padding: '4px 12px' }}>Stressed regions</td>
            <td style={{ padding: '4px 12px' }}>{y2030.flaggedRegions.join(', ') || '—'}</td>
            <td style={{ padding: '4px 12px' }}>{y2035.flaggedRegions.join(', ') || '—'}</td>
            <td style={{ padding: '4px 12px' }}>{y2045.flaggedRegions.join(', ') || '—'}</td>
          </tr>
        </tbody>
      </table>
      <p
        style={{
          fontSize: '0.85rem',
          color: '#777',
          borderTop: '1px solid #ddd',
          marginTop: '2rem',
          paddingTop: '0.75rem',
        }}
      >
        Model limits: annual resolution, simplified NTC network (no load flow), scenario corridors —
        not forecasts. Every number is source-tracked; parameters without a published source are
        marked <code>expert-guess</code>. External data are used for scientific research and
        education (fair use) — see docs/DISCLAIMER.md.
      </p>
    </main>
  );
}
