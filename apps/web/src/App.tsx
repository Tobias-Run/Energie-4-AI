import { useEffect, useMemo, useRef, useState } from 'react';
import {
  countries,
  runSimulation,
  runMonteCarlo,
  scenarioDefaults,
  type CountryYear,
  type Levers,
  type TornadoTarget,
} from '@energie4ai/sim-core';
import { METRICS } from './lib/metrics.js';
import { EuropeMap } from './components/EuropeMap.js';
import { TimeSlider } from './components/TimeSlider.js';
import { LeverPanel } from './components/LeverPanel.js';
import { StoryMode, type StoryStep } from './components/StoryMode.js';
import { TimeSeriesChart } from './components/TimeSeriesChart.js';
import { SupplyMixChart } from './components/SupplyMixChart.js';
import { BenchmarkChart } from './components/BenchmarkChart.js';
import { CorridorChart } from './components/CorridorChart.js';
import { TornadoChart } from './components/TornadoChart.js';
import { AssumptionsDrawer } from './components/AssumptionsDrawer.js';
import { DataTable } from './components/DataTable.js';
import { CompareMode, type PinnedScenario } from './components/CompareMode.js';
import { decodeScenario, scenarioUrl, writeScenarioToUrl } from './lib/permalink.js';
import { exportPng, exportRunCsv, exportSvg } from './lib/export.js';

const START_YEAR = 2026;
const END_YEAR = 2045;
const NAMES: Record<string, string> = Object.fromEntries(countries.map((c) => [c.iso, c.name]));

const INITIAL = decodeScenario(window.location.search, {
  levers: { ...scenarioDefaults.levers },
  year: START_YEAR,
  metricId: 'dcShareOfDemand',
  monteCarlo: false,
});

export function App() {
  const [levers, setLevers] = useState<Levers>(INITIAL.levers);
  const [year, setYear] = useState(INITIAL.year);
  const [metricId, setMetricId] = useState(INITIAL.metricId);
  const [playing, setPlaying] = useState(false);
  const [monteCarlo, setMonteCarlo] = useState(INITIAL.monteCarlo);
  const [tornadoTarget, setTornadoTarget] = useState<TornadoTarget>('euDcTwh');
  const [pinned, setPinned] = useState<PinnedScenario[]>([]);
  const [copied, setCopied] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // The URL is the only place scenario state persists — localStorage is forbidden (§4).
  useEffect(() => {
    writeScenarioToUrl({ levers, year, metricId, monteCarlo });
  }, [levers, year, metricId, monteCarlo]);

  const result = useMemo(() => runSimulation({ levers }), [levers]);
  // ~600 ms for 200 runs, so it only runs while the mode is on
  const mc = useMemo(
    () => (monteCarlo ? runMonteCarlo({ levers, runs: 200, seed: 4, tornadoTarget }) : null),
    [levers, monteCarlo, tornadoTarget],
  );
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
    if (metric.fixedMax !== undefined) return metric.fixedMax;
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
      renewables: result.aggregates.slice(from).map((a) => a.euRenewablesTwh),
      nuclear: result.aggregates.slice(from).map((a) => a.euNuclearTwh),
      fossil: result.aggregates.slice(from).map((a) => a.euFossilGenTwh),
    };
  }, [result]);

  // benchmark series needs the 2024 base year as index base
  const benchmarkSeries = useMemo(
    () => ({
      years: result.years,
      euValues: result.aggregates.map((a) => a.euDcTwh),
    }),
    [result],
  );

  const applyStory = (step: StoryStep) => {
    setPlaying(false);
    setLevers(step.levers);
    setYear(step.year);
    setMetricId(step.metricId);
  };

  const agg = result.aggregates[yearIdx]!;

  const copyLink = async () => {
    await navigator.clipboard.writeText(scenarioUrl({ levers, year, metricId, monteCarlo }));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const pinCurrent = () =>
    setPinned((prev) =>
      prev.length >= 3
        ? prev
        : [
            // short positional name; the lever settings get their own column, so repeating
            // the description here just printed the same string twice per row
            ...prev,
            {
              id: `${Date.now()}`,
              label: `Scenario ${String.fromCharCode(65 + prev.length)}`,
              levers: { ...levers },
            },
          ],
    );

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

          <div ref={mapRef}>
            <EuropeMap
              rows={rows}
              names={NAMES}
              metric={metric}
              domainMax={domainMax}
              year={year}
            />
          </div>

          <TimeSlider
            year={year}
            min={START_YEAR}
            max={END_YEAR}
            playing={playing}
            onYear={setYear}
            onPlaying={setPlaying}
          />

          {mc ? (
            <CorridorChart
              corridor={mc.corridor}
              fromYear={START_YEAR}
              currentYear={year}
              runs={mc.runs}
              onYear={(y) => {
                setPlaying(false);
                setYear(y);
              }}
            />
          ) : (
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
          )}

          {mc && (
            <div style={{ marginTop: 14 }}>
              <TornadoChart
                entries={mc.tornado}
                target={mc.tornadoTarget}
                year={END_YEAR}
                onTarget={setTornadoTarget}
              />
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <SupplyMixChart
              years={euSeries.years}
              renewables={euSeries.renewables}
              nuclear={euSeries.nuclear}
              fossil={euSeries.fossil}
              currentYear={year}
              onYear={(y) => {
                setPlaying(false);
                setYear(y);
              }}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <BenchmarkChart
              years={benchmarkSeries.years}
              euValues={benchmarkSeries.euValues}
              currentYear={year}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <CompareMode
              pinned={pinned}
              current={levers}
              fromYear={START_YEAR}
              currentYear={year}
              onPin={pinCurrent}
              onRemove={(id) => setPinned((prev) => prev.filter((p) => p.id !== id))}
            />
          </div>

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
            <h2>Uncertainty</h2>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={monteCarlo}
                onChange={(e) => setMonteCarlo(e.target.checked)}
              />
              <span>Monte Carlo mode (200 runs)</span>
            </label>
            {mc ? (
              <>
                <p className="muted" style={{ margin: '6px 0 4px' }}>
                  Sampled {mc.runs} runs over 19 source-tracked parameter ranges in{' '}
                  {mc.runtimeMs.toFixed(0)} ms. Seed {mc.seed} — the same seed reproduces this
                  corridor exactly.
                </p>
                <h2 style={{ margin: '10px 0 4px' }}>Stress flag in {END_YEAR}</h2>
                {Object.entries(mc.flagFrequency).length === 0 ? (
                  <p className="muted" style={{ margin: 0 }}>
                    No region flagged in any run.
                  </p>
                ) : (
                  Object.entries(mc.flagFrequency)
                    .sort((a, b) => b[1] - a[1])
                    .map(([iso, f]) => (
                      <div key={iso} className="assumption-row">
                        <span>{NAMES[iso] ?? iso}</span>
                        <span>
                          <strong>{(f * 100).toFixed(0)}%</strong> of runs
                        </span>
                      </div>
                    ))
                )}
                <p className="muted" style={{ margin: '4px 0 0' }}>
                  A frequency, not a forecast: it says how often the flag trips across the sampled
                  ranges, not how likely the outcome is in the world.
                </p>
              </>
            ) : (
              <p className="muted" style={{ margin: '6px 0 0' }}>
                Replaces the single demand line with a p10–p90 corridor and ranks which parameters
                drive it. Takes about half a second.
              </p>
            )}
          </div>
          <div className="panel">
            <h2>Share &amp; export</h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={() => void copyLink()}>{copied ? '✓ Copied' : 'Copy link'}</button>
              <button onClick={() => exportRunCsv(result, NAMES)}>Run as CSV</button>
              <button
                onClick={() => {
                  const svg = mapRef.current?.querySelector('svg');
                  if (svg) exportSvg(svg as SVGSVGElement, `map-${metric.id}-${year}.svg`);
                }}
              >
                Map SVG
              </button>
              <button
                onClick={() => {
                  const svg = mapRef.current?.querySelector('svg');
                  if (svg) void exportPng(svg as SVGSVGElement, `map-${metric.id}-${year}.png`);
                }}
              >
                Map PNG
              </button>
            </div>
            <p className="muted" style={{ marginBottom: 0 }}>
              The link carries the full scenario — this tool stores nothing on your device. The CSV
              carries the levers and data-bundle version in its header, so a downloaded table can be
              traced back to the run that produced it.
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
