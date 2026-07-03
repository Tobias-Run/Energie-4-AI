import { scenarioDefaults } from '@energie4ai/sim-core';
import type { MetricDef } from '../lib/metrics.js';

interface Props {
  metric: MetricDef;
}

const REPO = 'https://github.com/Tobias-Run/Energie-4-AI';

/** "Assumptions behind this number" drawer — every on-screen figure is traceable (spec §6). */
export function AssumptionsDrawer({ metric }: Props) {
  const d = scenarioDefaults;
  const rows: Array<[string, string, string]> = [
    [
      'EU capture of global DC additions (pre-2030)',
      `${(d.captureShareOfGlobalAdditions.euPre2030 * 100).toFixed(1)}%`,
      'iea2025energyai',
    ],
    [
      'EU capture of global DC additions (post-2030)',
      `${(d.captureShareOfGlobalAdditions.euPost2030 * 100).toFixed(1)}%`,
      'ember2025grids',
    ],
    ['Average PUE 2024 → floor', `${d.pue2024} → ${d.pueFloor}`, 'koronen2020datacentres'],
    [
      'Firm (inference) share of DC load',
      `${(d.firmLoadShare * 100).toFixed(0)}%`,
      'noland2024baseload',
    ],
    [
      'Permitting duration (baseline / reform)',
      `${d.permittingYearsBaseline} yr / ${d.permittingYearsReform} yr`,
      'ec2025gridspackage',
    ],
    ['NTC average utilization', `${(d.ntcUtilization * 100).toFixed(0)}%`, 'expert-guess'],
    [
      'Congestion cost baseline (EU, 2024)',
      `€${d.congestionBaselineBnEur2024} bn`,
      'ember2025grids',
    ],
    ['Gas emission factor', `${d.gasEmissionFactorMtPerTwh} Mt/TWh`, 'expert-guess'],
  ];

  return (
    <details className="drawer">
      <summary>Assumptions behind these numbers</summary>
      <p className="muted" style={{ marginBottom: 4 }}>
        <strong>{metric.label}:</strong> {metric.explanation} Sources:{' '}
        {metric.sourceIds.map((s) => (
          <span key={s} className="source-chip" style={{ marginRight: 3 }}>
            {s}
          </span>
        ))}
      </p>
      {rows.map(([label, value, source]) => (
        <div key={label} className="assumption-row">
          <span>{label}</span>
          <span>
            <strong>{value}</strong> <span className="source-chip">{source}</span>
          </span>
        </div>
      ))}
      <p className="muted" style={{ marginTop: 8 }}>
        Source IDs resolve to <a href={`${REPO}/blob/main/docs/sources.bib`}>docs/sources.bib</a>;{' '}
        <code>expert-guess</code> marks parameters without a published source (§8.3). External data
        are cited facts used for scientific research and education —{' '}
        <a href={`${REPO}/blob/main/docs/DISCLAIMER.md`}>full statement</a>. Model structure:{' '}
        <a href={`${REPO}/blob/main/docs/model-notes-p0.md`}>model notes</a>.
      </p>
    </details>
  );
}
