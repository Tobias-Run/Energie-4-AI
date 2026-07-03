import { describe, expect, it } from 'vitest';
import { scenarioDefaults } from '../src/data.js';
import {
  globalDcDemandTwh,
  pueAt,
  initPipeline,
  stepPipeline,
  runSimulation,
} from '../src/index.js';
import { globalCompute } from '../src/data.js';

describe('compute demand module', () => {
  it('hits both IEA anchor points of the global curve exactly', () => {
    expect(globalDcDemandTwh(2024, globalCompute, 1)).toBeCloseTo(415, 6);
    expect(globalDcDemandTwh(2030, globalCompute, 1)).toBeCloseTo(945, 0);
  });

  it('is monotone and below saturation through 2045', () => {
    let prev = 0;
    for (let y = 2024; y <= 2045; y++) {
      const v = globalDcDemandTwh(y, globalCompute, 1);
      expect(v).toBeGreaterThan(prev);
      expect(v).toBeLessThan(globalCompute.saturationTwh);
      prev = v;
    }
  });

  it('compute-growth lever scales cumulative growth', () => {
    const base = globalDcDemandTwh(2030, globalCompute, 1) - 415;
    const scaled = globalDcDemandTwh(2030, globalCompute, 1.5) - 415;
    expect(scaled / base).toBeCloseTo(1.5, 6);
  });
});

describe('electricity demand module', () => {
  it('PUE declines monotonically and never falls below the floor', () => {
    let prev = Infinity;
    for (let y = 2024; y <= 2045; y++) {
      const v = pueAt(y, scenarioDefaults);
      expect(v).toBeLessThanOrEqual(prev);
      expect(v).toBeGreaterThanOrEqual(scenarioDefaults.pueFloor);
      prev = v;
    }
  });
});

describe('grid pipeline delay chain', () => {
  it('conserves volume: total built never exceeds total inflow plus initial stocks', () => {
    const state = initPipeline(1, 9, 3);
    const initial = state.announcedGw + state.permittedGw;
    let inflow = 0;
    let built = 0;
    for (let i = 0; i < 30; i++) {
      inflow += 2;
      built += stepPipeline(state, 2, 9, 3);
    }
    expect(built).toBeLessThanOrEqual(initial + inflow + 1e-9);
    expect(state.announcedGw).toBeGreaterThanOrEqual(0);
    expect(state.permittedGw).toBeGreaterThanOrEqual(0);
  });

  it('permitting reform delivers more connection capacity by 2035', () => {
    const base = runSimulation();
    const reform = runSimulation({ levers: { permittingReform: true } as never });
    const year = (r: typeof base) => r.aggregates.find((a) => a.year === 2035)!;
    expect(year(reform).euQueueGw).toBeLessThanOrEqual(year(base).euQueueGw);
    expect(year(reform).euDcTwh).toBeGreaterThanOrEqual(year(base).euDcTwh);
  });
});

describe('stress & adequacy module', () => {
  it('produces sane country metrics for the default run', () => {
    const r = runSimulation();
    for (const [iso, series] of Object.entries(r.countries)) {
      for (const row of series) {
        expect(row.stressIndex, iso).toBeGreaterThan(0);
        expect(row.stressIndex, iso).toBeLessThan(2);
        expect(row.dcShareOfPeak, iso).toBeGreaterThanOrEqual(0);
        expect(row.dcShareOfPeak, iso).toBeLessThan(1);
        expect(row.gasGenTwh, iso).toBeGreaterThanOrEqual(0);
        expect(row.emissionsMt, iso).toBeGreaterThanOrEqual(0);
        expect(row.queueGw, iso).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('keeps hub-congestion narrative plausible: Ireland queues under baseline permitting', () => {
    const r = runSimulation();
    const ie2030 = r.countries['IE']![r.years.indexOf(2030)]!;
    expect(ie2030.queueGw).toBeGreaterThan(0);
  });
});
