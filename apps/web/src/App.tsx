import { useEffect, useMemo, useRef, useState } from 'react';
import {
  countries,
  runSimulation,
  runMonteCarlo,
  scenarioDefaults,
  uncertaintyRanges,
  type CountryYear,
  type Levers,
  type TornadoTarget,
} from '@energie4ai/sim-core';
import { metricsFor } from './lib/metrics.js';
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
import {
  I18nContext,
  LOCALES,
  LOCALE_NAMES,
  fmt,
  resolveLocale,
  stringsFor,
  type Locale,
} from './i18n/index.js';

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
  const [locale, setLocale] = useState<Locale>(() =>
    resolveLocale(window.location.search, navigator.languages ?? [navigator.language]),
  );
  const t = stringsFor(locale);
  const METRICS = useMemo(() => metricsFor(t), [t]);

  // The URL is the only place scenario state persists — localStorage is forbidden (§4).
  useEffect(() => {
    writeScenarioToUrl({ levers, year, metricId, monteCarlo }, locale);
    document.documentElement.lang = locale;
  }, [levers, year, metricId, monteCarlo, locale]);

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
    await navigator.clipboard.writeText(
      scenarioUrl({ levers, year, metricId, monteCarlo }, locale),
    );
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
              label: fmt(t.compare.scenarioName, { letter: String.fromCharCode(65 + prev.length) }),
              levers: { ...levers },
            },
          ],
    );

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      <div className="app">
        <a href="#main" className="skip-link">
          {t.app.skipToContent}
        </a>
        <header>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <h1>{t.app.title}</h1>
            <label
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}
            >
              <span className="muted">{t.app.language}</span>
              <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
                {LOCALES.map((l) => (
                  <option key={l} value={l}>
                    {LOCALE_NAMES[l]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="byline">
            <em>{t.app.byline}</em>
          </p>
        </header>

        <div className="layout">
          <main className="panel" id="main">
            <div className="controls-row">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="muted">{t.app.mapMetric}</span>
                <select value={metric.id} onChange={(e) => setMetricId(e.target.value)}>
                  {METRICS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <span className="muted" style={{ marginLeft: 'auto' }} role="status">
                {fmt(t.app.summary, {
                  year,
                  twh: agg.euDcTwh.toFixed(0),
                  share: (agg.euDcShareOfDemand * 100).toFixed(1),
                  flags:
                    agg.flaggedRegions.length > 0
                      ? `⚠ ${agg.flaggedRegions.join(', ')}`
                      : t.app.noFlags,
                })}
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
                title={t.charts.demandTitle}
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
                {fmt(t.app.runtime, { ms: result.meta.runtimeMs.toFixed(1) })}
              </p>
            </div>
            <div className="panel">
              <h2>{t.uncertainty.title}</h2>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={monteCarlo}
                  onChange={(e) => setMonteCarlo(e.target.checked)}
                />
                <span>{t.uncertainty.toggle}</span>
              </label>
              {mc ? (
                <>
                  <p className="muted" style={{ margin: '6px 0 4px' }}>
                    {fmt(t.uncertainty.sampled, {
                      runs: mc.runs,
                      params: Object.keys(uncertaintyRanges).length,
                      ms: mc.runtimeMs.toFixed(0),
                      seed: mc.seed,
                    })}
                  </p>
                  <h2 style={{ margin: '10px 0 4px' }}>
                    {fmt(t.uncertainty.flagTitle, { year: END_YEAR })}
                  </h2>
                  {Object.entries(mc.flagFrequency).length === 0 ? (
                    <p className="muted" style={{ margin: 0 }}>
                      {t.uncertainty.noFlags}
                    </p>
                  ) : (
                    Object.entries(mc.flagFrequency)
                      .sort((a, b) => b[1] - a[1])
                      .map(([iso, f]) => (
                        <div key={iso} className="assumption-row">
                          <span>{NAMES[iso] ?? iso}</span>
                          <span>
                            <strong>{(f * 100).toFixed(0)}%</strong> {t.uncertainty.ofRuns}
                          </span>
                        </div>
                      ))
                  )}
                  <p className="muted" style={{ margin: '4px 0 0' }}>
                    {t.uncertainty.frequencyNote}
                  </p>
                </>
              ) : (
                <p className="muted" style={{ margin: '6px 0 0' }}>
                  {t.uncertainty.off}
                </p>
              )}
            </div>
            <div className="panel">
              <h2>{t.share.title}</h2>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => void copyLink()}>
                  {copied ? t.share.copied : t.share.copyLink}
                </button>
                <button onClick={() => exportRunCsv(result, NAMES)}>{t.share.csv}</button>
                <button
                  onClick={() => {
                    const svg = mapRef.current?.querySelector('svg');
                    if (svg) exportSvg(svg as SVGSVGElement, `map-${metric.id}-${year}.svg`);
                  }}
                >
                  {t.share.mapSvg}
                </button>
                <button
                  onClick={() => {
                    const svg = mapRef.current?.querySelector('svg');
                    if (svg) void exportPng(svg as SVGSVGElement, `map-${metric.id}-${year}.png`);
                  }}
                >
                  {t.share.mapPng}
                </button>
              </div>
              <p className="muted" style={{ marginBottom: 0 }}>
                {t.share.note}
              </p>
            </div>
            <div className="panel">
              <StoryMode onApply={applyStory} onExit={() => setLevers({ ...levers })} />
            </div>
          </aside>
        </div>

        <footer className="limits-banner" role="note">
          <strong>{t.app.limitsTitle}</strong> {t.app.limits}
        </footer>
      </div>
    </I18nContext.Provider>
  );
}
