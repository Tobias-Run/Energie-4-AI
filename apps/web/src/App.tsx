import { useMemo, useState } from 'react';
import { countries, runSimulation, type CountryYear, type Levers } from '@energie4ai/sim-core';
import { METRICS } from './lib/metrics.js';
import { EuropeMap } from './components/EuropeMap.js';
import { TimeSlider } from './components/TimeSlider.js';
import { LeverPanel } from './components/LeverPanel.js';
import { StoryMode, type StoryStep } from './components/StoryMode.js';
import { TimeSeriesChart } from './components/TimeSeriesChart.js';
import { AssumptionsDrawer } from './components/AssumptionsDrawer.js';
import { DataTable } from './components/DataTable.js';

const START_YEAR = 2026;
const END_YEAR = 2045;
const NAMES: Record<string, string> = Object.fromEntries(countries.map((c) => [c.iso, c.name]));

export function App() {
  const [levers, setLevers] = useState<Levers>({
    computeGrowthMultiplier: 1,
    extraEfficiencyRate: 0,
    permittingReform: false,
  });
  const [year, setYear] = useState(START_YEAR);
  const [metricId, setMetricId] = useState('dcShareOfDemand');
  const [playing, setPlaying] = useState(false);

  const result = useMemo(() => runSimulation({ levers }), [levers]);
  const metric = METRICS.find((m) => m.id === metricId) ?? METRICS[0]!;

  const yearIdx = result.years.indexOf(year);
  const rows: Record<string, CountryYear> = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(result.countries).map(([iso, series]) => [iso, series[yearIdx]!]),
      ),
    [result, yearIdx],
  );

  // stable color domain across the whole run so the animation is comparable
  const domainMax = useMemo(() => {
    let max = 0;
    for (const series of Object.values(result.countries)) {
      for (let i = result.years.indexOf(START_YEAR); i < series.length; i++) {
        max = Math.max(max, metric.value(series[i]!));
      }
    }
    return max;
  }, [result, metric]);

  const euSeries = useMemo(() => {
    const from = result.years.indexOf(START_YEAR);
    return {
      years: result.years.slice(from),
      values: result.aggregates.slice(from).map((a) => a.euDcTwh),
    };
  }, [result]);

  const applyStory = (step: StoryStep) => {
    setPlaying(false);
    setLevers(step.levers);
    setYear(step.year);
    setMetricId(step.metricId);
  };

  const agg = result.aggregates[yearIdx]!;

  return (
    <div className="app">
      <header>
        <h1>Energie-4-AI</h1>
        <p className="byline">
          <em>GridSim — AI data center expansion vs. European power supply, 2026–2045</em>
        </p>
      </header>

      <div className="layout">
        <main className="panel">
          <div className="controls-row">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="muted">Map metric</span>
              <select value={metric.id} onChange={(e) => setMetricId(e.target.value)}>
                {METRICS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <span className="muted" style={{ marginLeft: 'auto' }}>
              EU-27 in {year}: DC {agg.euDcTwh.toFixed(0)} TWh ·{' '}
              {(agg.euDcShareOfDemand * 100).toFixed(1)}% of demand ·{' '}
              {agg.flaggedRegions.length > 0
                ? `⚠ ${agg.flaggedRegions.join(', ')}`
                : 'no stress flags'}
            </span>
          </div>

          <EuropeMap rows={rows} names={NAMES} metric={metric} domainMax={domainMax} year={year} />

          <TimeSlider
            year={year}
            min={START_YEAR}
            max={END_YEAR}
            playing={playing}
            onYear={setYear}
            onPlaying={setPlaying}
          />

          <TimeSeriesChart
            years={euSeries.years}
            values={euSeries.values}
            currentYear={year}
            title="EU-27 data center electricity demand (TWh)"
            unit="TWh"
            onYear={(y) => {
              setPlaying(false);
              setYear(y);
            }}
          />

          <AssumptionsDrawer metric={metric} />
          <DataTable rows={rows} names={NAMES} metric={metric} year={year} />
        </main>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel">
            <LeverPanel
              levers={levers}
              onChange={(l) => {
                setPlaying(false);
                setLevers(l);
              }}
            />
            <p className="muted" style={{ marginBottom: 0 }}>
              Full 20-year run recomputes in {result.meta.runtimeMs.toFixed(1)} ms, entirely in your
              browser.
            </p>
          </div>
          <div className="panel">
            <StoryMode onApply={applyStory} onExit={() => setLevers({ ...levers })} />
          </div>
        </aside>
      </div>

      <footer className="limits-banner" role="note">
        <strong>Model limits (read me):</strong> annual energy balances on a simplified NTC network
        — no load flow, no intra-hour dispatch; country-level resolution (hubs are metadata); many
        country parameters are <code>expert-guess</code> approximations. Scenarios are{' '}
        <strong>exploration devices, not forecasts</strong>. Every number is source-tracked — open
        the assumptions drawer. External data are used as cited facts for scientific research and
        education (fair use) — see docs/DISCLAIMER.md.
      </footer>
    </div>
  );
}
