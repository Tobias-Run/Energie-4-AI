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
    it('is failing, on exactly these two anchors', () => {
      // The published verdict. Changing the model changes this line, and every place that
      // quotes it (README badge, docs/model-notes.md, the assumptions drawer) must follow.
      //
      // Used to read three missed anchors out of nine. Issue #34 moved europeItPower2024Gw and
      // euItPower2024Gw to contested (see the test below), which dropped both the miss and the
      // denominator -- the verdict improved through re-scoping, not through the model changing.
      // Issue #40 added euDcShareOfDemand2024Eudca as a new, failable independent anchor -- EUDCA's
      // 2% EU share has a stated bottom-up basis (grid-operator data, three connection-constrained
      // countries measured directly), unlike the volume figure it accompanies, so it is testable on
      // its own terms rather than absorbed into the contested tier. The model misses it at +30.5%.
      // No model output moved: euDcTwh, the flag list, and every other published figure are
      // unchanged by this PR.
      expect(report.missed.map((a) => a.id)).toEqual([
        'europeDc2035TwhMin',
        'euDcShareOfDemand2024Eudca',
      ]);
      expect(report.passed).toBe(false);
      expect(report.independentCount).toBe(8);
      expect(report.verdict).toBe(
        'FAILING — 2 of 8 independent anchors missed ' +
          '(europeDc2035TwhMin, euDcShareOfDemand2024Eudca)',
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

    it('is 30.5% above the EUDCA base-year share reading (issue #40)', () => {
      // EUDCA: DC load was 2% of EU electricity demand in 2023, with a stated bottom-up basis
      // (grid-operator input plus measured usage in three connection-constrained countries) --
      // unlike the volume figure it accompanies, kept independent and left to fail on its own
      // terms rather than absorbed into the contested tier alongside the 2030 share anchors.
      expect(get('euDcShareOfDemand2024Eudca').met).toBe(false);
      expect(dev('euDcShareOfDemand2024Eudca')).toBe(30.5);
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

    it('sits 21% above the EUDCA base-year reading, contested rather than independent (issue #40)', () => {
      // EUDCA's 55.3 TWh (EU, 2023) is the low end of a base-year spread the model's independent
      // anchor -- ENTSO-E's 87 TWh, europeDc2024Twh -- cannot actually adjudicate: ENTSO-E's figure
      // is itself a synthesis that folds in this same EUDCA survey. Kept contested rather than
      // independent for that reason, alongside the already-contested 2030 spread above.
      expect(get('euDc2024TwhEudca').tier).toBe('contested');
      expect(dev('euDc2024TwhEudca')).toBe(21.4);
      expect(get('euDc2024TwhEudca').met).toBe(false);
    });

    it('carries far too much installed IT power once itUtilization is corrected (issue #34)', () => {
      // Used to sit here as an independent miss at -18.9% / -14.9%, with itUtilization an
      // unsourced 0.65. Correcting it to the EU Commission's EED-implied value (0.316, from
      // Table 22: (14,088 GWh / 1.36) / (3,738.86 MW x 8,760 h)) does not close the gap -- it
      // flips its sign and roughly quadruples its size. The regulation itself explains why:
      // dcItLoadGw is a nameplate-sum concept (Art. 2(14)), ENTSO-E's 12.7/9.9 GW is closer to
      // an available-power concept (Art. 2(15)), and EUDCA's own 48% conversion factor between
      // the two would push the gap past +250% if applied on top rather than close it -- the
      // correction and the conversion compensate for the same gap, so combining them
      // double-counts it. No re-scoping option produced a plausible match, which moved these
      // two anchors from independent to contested rather than either "fixing" them.
      expect(get('europeItPower2024Gw').tier).toBe('contested');
      expect(get('euItPower2024Gw').tier).toBe('contested');
      expect(dev('europeItPower2024Gw')).toBe(71.8);
      expect(dev('euItPower2024Gw')).toBe(80.1);
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
