import { describe, expect, it } from 'vitest';
import { countries, hubs } from '../src/index.js';

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
