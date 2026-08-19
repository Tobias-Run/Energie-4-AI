import { describe, expect, it } from 'vitest';
import { countries, hubs, ntcLinks } from '../src/index.js';
import { scenarioDefaults } from '../src/data.js';
import { importCapTwhByCountry } from '../src/modules/supplyGrid.js';

/**
 * Hubs are display metadata only (decision on issue #2: the model stays country-level).
 * These tests guard the invariants the map relies on — nothing here asserts model behavior.
 */
describe('hub metadata (issue #2)', () => {
  const isos = new Set(countries.map((c) => c.iso));

  it('every hub belongs to a simulated country', () => {
    for (const h of hubs) {
      expect(isos.has(h.iso), `${h.id} → ${h.iso}`).toBe(true);
    }
  });

  it('hub ids are unique', () => {
    expect(new Set(hubs.map((h) => h.id)).size).toBe(hubs.length);
  });

  it('coordinates sit inside the map bounding box, so no marker silently vanishes', () => {
    for (const h of hubs) {
      expect(h.lon, `${h.id} lon`).toBeGreaterThan(-11);
      expect(h.lon, `${h.id} lon`).toBeLessThan(35);
      expect(h.lat, `${h.id} lat`).toBeGreaterThan(34.5);
      expect(h.lat, `${h.id} lat`).toBeLessThan(71.5);
    }
  });

  it('the FLAP-D set is exactly Frankfurt, London, Amsterdam, Paris, Dublin', () => {
    expect(
      hubs
        .filter((h) => h.flapd)
        .map((h) => h.id)
        .sort(),
    ).toEqual(['amsterdam', 'dublin', 'frankfurt', 'london', 'paris']);
  });

  it('a published traffic figure always carries its as-of date, and vice versa', () => {
    for (const h of hubs) {
      expect(h.ixpPeakTbps === null, `${h.id}`).toBe(h.asOf === null);
    }
  });

  it("sizeClass 'none' is used exactly where there is no exchange", () => {
    for (const h of hubs) {
      expect(h.sizeClass === 'none', `${h.id}`).toBe(h.ixpName === null);
    }
  });

  it('only verified hubs claim the major size class', () => {
    for (const h of hubs.filter((x) => x.sizeClass === 'major')) {
      expect(h.ixpPeakTbps, `${h.id} claims major`).not.toBeNull();
      expect(h.ixpPeakTbps!).toBeGreaterThan(10);
    }
  });
});

describe('NTC network (issue #4)', () => {
  const anchored = ntcLinks.filter((l) => l.source !== 'expert-guess');

  it('most borders are sourced, and only GB borders remain estimates', () => {
    expect(anchored.length).toBeGreaterThan(50);
    for (const l of ntcLinks.filter((x) => x.source === 'expert-guess')) {
      expect(l.from === 'GB' || l.to === 'GB', `${l.from}-${l.to}`).toBe(true);
    }
  });

  it('capacity is interpolated between anchors and held flat outside them', () => {
    const d = scenarioDefaults;
    const at = (y: number) => importCapTwhByCountry(ntcLinks, d, y);
    // Ireland gains the Celtic Interconnector (FR-IE) at the 2030 anchor
    expect(at(2030)['IE']!).toBeGreaterThan(at(2026)['IE']!);
    // between anchors the value moves monotonically, outside them it is flat
    expect(at(2028)['IE']!).toBeGreaterThan(at(2026)['IE']!);
    expect(at(2028)['IE']!).toBeLessThan(at(2030)['IE']!);
    expect(at(2045)['IE']!).toBeCloseTo(at(2040)['IE']!, 6);
    expect(at(2020)['IE']!).toBeCloseTo(at(2024)['IE']!, 6);
  });

  it('direction matters: asymmetric borders give the two ends different capability', () => {
    // CH->IT is far larger than IT->CH in the sourced data
    const chit = ntcLinks.find((l) => l.from === 'CH' && l.to === 'IT');
    expect(chit).toBeDefined();
    expect(chit!.forwardGw['2024']).not.toBeCloseTo(chit!.backwardGw['2024']!, 3);
  });

  it('the sourced network expands over the horizon', () => {
    const total = (y: string) =>
      anchored.reduce((sum, l) => sum + (l.forwardGw[y] ?? 0) + (l.backwardGw[y] ?? 0), 0);
    expect(total('2030')).toBeGreaterThan(total('2024'));
    expect(total('2040')).toBeGreaterThan(total('2030'));
  });
});
