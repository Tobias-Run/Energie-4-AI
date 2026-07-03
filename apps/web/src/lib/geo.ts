import { geoAzimuthalEqualArea, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import worldJson from 'world-atlas/countries-110m.json';

/** ISO 3166-1 numeric (world-atlas feature id) → our ISO2 codes, EU-27 + UK + NO + CH. */
const NUMERIC_TO_ISO2: Record<string, string> = {
  '040': 'AT',
  '056': 'BE',
  '100': 'BG',
  '191': 'HR',
  '196': 'CY',
  '203': 'CZ',
  '208': 'DK',
  '233': 'EE',
  '246': 'FI',
  '250': 'FR',
  '276': 'DE',
  '300': 'GR',
  '348': 'HU',
  '372': 'IE',
  '380': 'IT',
  '428': 'LV',
  '440': 'LT',
  '442': 'LU',
  '470': 'MT',
  '528': 'NL',
  '616': 'PL',
  '620': 'PT',
  '642': 'RO',
  '703': 'SK',
  '705': 'SI',
  '724': 'ES',
  '752': 'SE',
  '756': 'CH',
  '826': 'GB',
  '578': 'NO',
};

export const MAP_WIDTH = 640;
export const MAP_HEIGHT = 620;

export interface CountryShape {
  iso: string | null; // null = context country (not simulated)
  name: string;
  d: string;
}

function buildShapes(): { shapes: CountryShape[]; missing: string[] } {
  const world = worldJson as unknown as Topology;
  const collection = feature(
    world,
    world.objects.countries as GeometryCollection<{ name: string }>,
  ) as FeatureCollection<Geometry, { name: string }>;

  // Fit to a mainland-Europe bounding box rather than the raw features: Norway's
  // geometry includes Svalbard (~80°N), which would shrink the whole map.
  const europeBounds: Feature<Geometry> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      // d3-geo winding: exterior rings clockwise, else the ring encloses the rest of the sphere
      coordinates: [
        [
          [-11, 34.5],
          [-11, 71.5],
          [35, 71.5],
          [35, 34.5],
          [-11, 34.5],
        ],
      ],
    },
  };
  const projection = geoAzimuthalEqualArea()
    .rotate([-10, -52])
    .fitExtent(
      [
        [6, 6],
        [MAP_WIDTH - 6, MAP_HEIGHT - 6],
      ],
      europeBounds,
    );
  const path = geoPath(projection);

  const shapes: CountryShape[] = collection.features
    .map((f) => ({
      iso: NUMERIC_TO_ISO2[String(f.id)] ?? null,
      name: f.properties?.name ?? String(f.id),
      d: path(f) ?? '',
    }))
    .filter((s) => s.d !== '');

  const found = new Set(shapes.map((s) => s.iso).filter(Boolean));
  const missing = Object.values(NUMERIC_TO_ISO2).filter((iso) => !found.has(iso));
  return { shapes, missing };
}

const built = buildShapes();
/** All country outlines (simulated ones carry an iso, neighbors are context). */
export const COUNTRY_SHAPES = built.shapes;
/** Simulated countries absent at 110m map resolution (e.g. Malta). */
export const MISSING_ON_MAP = built.missing;
