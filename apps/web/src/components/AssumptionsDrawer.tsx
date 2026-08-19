import { scenarioDefaults } from '@energie4ai/sim-core';
import type { MetricDef } from '../lib/metrics.js';

interface Props {
  metric: MetricDef;
}

import { useI18n } from '../i18n/index.js';

const REPO = 'https://github.com/Tobias-Run/Energie-4-AI';

/** "Assumptions behind this number" drawer — every on-screen figure is traceable (spec §6). */
export function AssumptionsDrawer({ metric }: Props) {
  const { t } = useI18n();
  const d = scenarioDefaults;
  const rows: Array<[string, string, string]> = [
    [
      t.drawer.rowCapturePre,
      `${(d.captureShareOfGlobalAdditions.euPre2030 * 100).toFixed(1)}%`,
      'iea2025energyai',
    ],
    [
      t.drawer.rowCapturePost,
      `${(d.captureShareOfGlobalAdditions.euPost2030 * 100).toFixed(1)}%`,
      'ember2025grids',
    ],
    [t.drawer.rowPue, `${d.pue2024} → ${d.pueFloor}`, 'koronen2020datacentres'],
    [t.drawer.rowFirm, `${(d.firmLoadShare * 100).toFixed(0)}%`, 'noland2024baseload'],
    [
      t.drawer.rowPermitting,
      `${d.permittingYearsBaseline} yr / ${d.permittingYearsReform} yr`,
      'ec2025gridspackage',
    ],
    [t.drawer.rowNtc, `${(d.ntcUtilization * 100).toFixed(0)}%`, 'expert-guess'],
    [t.drawer.rowCongestion, `€${d.congestionBaselineBnEur2024} bn`, 'ember2025grids'],
    [t.drawer.rowGas, `${d.gasEmissionFactorMtPerTwh} Mt/TWh`, 'expert-guess'],
    [t.drawer.rowMix, t.drawer.rowMixValue, 'ember2025eer'],
    [t.drawer.rowBenchmark, t.drawer.rowBenchmarkValue, 'iea2025energyai'],
    [t.drawer.rowBenchmarkCorroboration, 'LBNL 2024 / EPRI 2024', 'lbnl2024usdc'],
    [t.drawer.rowBenchmark2035, t.drawer.rowBenchmark2035Value, 'expert-guess'],
  ];

  return (
    <details className="drawer">
      <summary>{t.drawer.summary}</summary>
      <p className="muted" style={{ marginBottom: 4 }}>
        <strong>{metric.label}:</strong> {metric.explanation} {t.drawer.sources}{' '}
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
        <a href={`${REPO}/blob/main/docs/model-notes.md`}>model notes</a>.
      </p>
    </details>
  );
}
