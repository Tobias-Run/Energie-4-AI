# Data bundles — v1

Versioned static JSON parameter bundles for the Energie-4-AI simulation core (mission document §7, §8.3).

## Files

| File                       | Contents                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------ |
| `global-compute.json`      | Global data center electricity demand driver (IEA-anchored logistic curve)           |
| `countries.json`           | Per-country parameters, base year 2024 (demand, DC stock, supply mix, grid pipeline) |
| `ntc.json`                 | Simplified interconnection network (bidirectional NTCs, GW)                          |
| `scenario-defaults.json`   | Default ("central") scenario parameter set and lever defaults                        |
| `calibration-anchors.json` | Published corridors the default run must reproduce (validation gate V1)              |

## Source-tracking rule

Every parameter is covered by a `provenance` map entry whose value is a BibTeX key
in [`/docs/sources.bib`](../../docs/sources.bib), or the reserved value `"expert-guess"`
for parameters without a published source. The UI must visibly flag `expert-guess`
parameters. This rule is enforced by a unit test (`packages/sim-core/test/provenance.test.ts`).

## External data & fair use

All numeric values derived from external publications are used for **non-commercial
scientific research and educational purposes**. See
[`/docs/DISCLAIMER.md`](../../docs/DISCLAIMER.md) for the full data usage statement.

## Update pipeline

1. Change values in the JSON bundles; bump the bundle's `version` (semver).
2. Add or update the corresponding entry in `/docs/sources.bib`; update the `provenance` map.
3. Run `npm test` — the calibration gate and the provenance test must stay green.
4. Record the change in the commit message (`data:` prefix).

Quarterly review of the source list is required (mission document §8.3).
