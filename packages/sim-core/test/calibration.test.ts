import { describe, expect, it } from 'vitest';
import { calibrationReport } from '../src/calibration.js';
import type { AnchorResult } from '../src/calibration.js';

/**
 * Validation gate V1 (mission document §5, §10.1, CLAUDE.md P0.4).
 *
 * The gate reported "passing" for months on five anchors, three of which the model reproduces by
 * construction. An external review (issue #25) established that it was mostly verifying its own
 * arithmetic, and that the two anchors which could fail came from a publication whose volume
 * estimate the model misses by 20% (issue #26).
 *
 * The anchor set has been rebuilt around what can actually come out negative, and it does: the
 * default run misses three independent anchors. This file does NOT assert that the gate passes.
 * It asserts that the gate's verdict is exactly the one published in the README, the model notes
 * and the UI — so the model cannot drift, and a missed anchor cannot quietly become met or
 * disappear, without a test failing and the documentation being updated to match.
 */
const report = calibrationReport();
const byId = new Map(report.anchors.map((a) => [a.id, a]));
const get = (id: string): AnchorResult => {
  const a = byId.get(id);
  if (!a) throw new Error(`no anchor '${id}'`);
  return a;
};

/** Signed deviation as a whole number of tenths of a percent, for exact comparison. */
const dev = (id: string) => Number((get(id).deviation! * 100).toFixed(1));

describe('calibration gate V1', () => {
  describe('verdict', () => {
    it('is failing, on exactly these three anchors', () => {
      // The published verdict. Changing the model changes this line, and every place that
      // quotes it (README badge, docs/model-notes.md, the assumptions drawer) must follow.
      expect(report.missed.map((a) => a.id)).toEqual([
        'europeDc2035TwhMin',
        'europeItPower2024Gw',
        'euItPower2024Gw',
      ]);
      expect(report.passed).toBe(false);
      expect(report.independentCount).toBe(9);
      expect(report.verdict).toBe(
        'FAILING — 3 of 9 independent anchors missed ' +
          '(europeDc2035TwhMin, europeItPower2024Gw, euItPower2024Gw)',
      );
    });

    it('is decided by anchors that can fail, not by the model reproducing its own inputs', () => {
      // The three construction anchors must never count toward the verdict again.
      const construction = report.anchors.filter((a) => a.tier === 'construction').map((a) => a.id);
      expect(construction).toEqual([
        'globalDc2030Twh',
        'euDcIncrease2024to2030Twh',
        'euDcGrowthRatio2025to2030Min',
      ]);
      expect(report.missed.every((a) => a.tier === 'independent')).toBe(true);
    });
  });

  describe('construction anchors (regression protection only)', () => {
    it('still reproduces the inputs it was built from', () => {
      for (const a of report.anchors.filter((x) => x.tier === 'construction')) {
        expect(a.met, `${a.id} regressed`).toBe(true);
      }
      // Exactly, not approximately: k is solved so the curve passes through this point.
      expect(get('globalDc2030Twh').model).toBeCloseTo(945, 6);
    });
  });

  describe('independent anchors that the model meets', () => {
    it('reproduces the ENTSO-E base year within 10%', () => {
      expect(get('europeDc2024Twh').met).toBe(true);
      expect(dev('europeDc2024Twh')).toBe(-5.6);
    });

    it('clears the ENTSO-E 2030 level — which is a floor, not a target', () => {
      // ENTSO-E Figure 1 labels 134 TWh "2030 (min)". The model clears it by 0.4%, so this is
      // agreement with the lower bound of the published range and nothing more.
      expect(get('europeDc2030TwhMin').met).toBe(true);
      expect(dev('europeDc2030TwhMin')).toBe(0.4);
    });

    it('puts the same fourteen countries in the lead as ENTSO-E', () => {
      // Compared as sets. ENTSO-E's ordering differs from the model's — it has France ahead of
      // the UK, Spain ahead of Italy, and Norway seventh — but the membership matches, which is
      // what the allocation module can be held to.
      expect(get('europeTopFiveSet2024').met).toBe(true);
      expect(get('europeNamedCountrySet2024').met).toBe(true);
    });

    it('reproduces the Ember share of EU-27 demand within 10%', () => {
      expect(dev('euDcShareOfDemand2030')).toBe(-7.0);
      expect(dev('euDcShareOfDemand2035')).toBe(-6.6);
    });
  });

  describe('independent anchors that the model misses', () => {
    it('is 6.9% below the ENTSO-E 2035 floor', () => {
      // Against the "2035 (min)" value of 199 TWh; the same figure gives 254 TWh as the maximum,
      // so measured against ENTSO-E's own upper bound the shortfall is 27%.
      expect(get('europeDc2035TwhMin').met).toBe(false);
      expect(dev('europeDc2035TwhMin')).toBe(-6.9);
    });

    it('carries too little installed IT power in the base year', () => {
      // The largest single discrepancy in the model. It implicates the volume path and the
      // conversion assumptions together: dcItLoadGw divides out PUE (sourced) and itUtilization
      // (expert-guess, 0.65), so this anchor is also the first real test of that guess.
      expect(dev('europeItPower2024Gw')).toBe(-18.9);
      expect(dev('euItPower2024Gw')).toBe(-14.9);
    });
  });

  describe('contested anchors (measured, not enforced)', () => {
    it('records how far the model sits from each published reading of Europe 2030', () => {
      // The model follows ENTSO-E, so it cannot also satisfy these. Both deviations are
      // recorded rather than absorbed by a tolerance: that spread IS the finding.
      expect(dev('europeDc2030TwhEmber')).toBe(-19.9);
      expect(dev('europeDc2030TwhIea')).toBe(23.5);
      expect(report.anchors.filter((a) => a.tier === 'contested').every((a) => !a.met)).toBe(true);
    });

    it('cannot be satisfied together — the published range is 109 to 168 TWh', () => {
      const ember = get('europeDc2030TwhEmber').target as number;
      const iea = get('europeDc2030TwhIea').target as number;
      // No single value lies within 10% of both: the sources are 54% apart.
      expect(ember / iea - 1).toBeGreaterThan(0.5);
      expect(iea * 1.1).toBeLessThan(ember * 0.9);
    });
  });
});
