# External Review Package

For the quality gate in mission document §7 / success criterion §10.3: at least one external
energy-system modeller signs off on the demand module before public launch.

This document is what to hand a reviewer. It is written to be readable without running anything,
but everything in it is reproducible in a few minutes.

## What we are asking for

Not a full model audit — a judgement on whether the **demand module** is defensible enough to put
in front of policy audiences, and a list of what would have to change for that to be true.

Concretely, three questions:

1. **Is the demand construction sound?** Global logistic curve → EU capture share of additions →
   gravity/price allocation across countries → grid-connection constraint. Does that chain produce
   demand for the right reasons, or does it produce roughly-right numbers for wrong reasons?
2. **Are the calibration anchors the right ones**, and is reproducing them within ±10% meaningful
   evidence or circular?
3. **Which of the remaining `expert-guess` parameters would you refuse to publish with?** We have a
   list of what we think is weakest (below); we would like to know where it is wrong.

We are explicitly not asking whether the projections are correct. The tool is framed throughout as
an exploration device, and the reviewer is not being asked to endorse any scenario.

## Reproducing a run

```bash
npm install
npm test          # 76 tests, includes the calibration gate and the narrative claims
npm run dev       # the tool itself
```

Everything is client-side and deterministic. `runSimulation()` with a given seed and lever set
reproduces bit-identically; `runMonteCarlo({ seed })` reproduces its corridor exactly. There is no
backend, no database, and no stored state — a scenario travels entirely in the URL.

To inspect a run outside the UI, the app exports full per-country/per-year results as CSV with the
lever settings and data-bundle version in the header.

## Where to look

| Question                                       | File                                                 |
| ---------------------------------------------- | ---------------------------------------------------- |
| Model structure, all known simplifications     | `docs/model-notes.md`                                |
| Demand construction                            | `packages/sim-core/src/modules/computeDemand.ts`     |
| PUE, utilization, connection conversion        | `packages/sim-core/src/modules/electricityDemand.ts` |
| Generation trajectories, NTC import capability | `packages/sim-core/src/modules/supplyGrid.ts`        |
| Flag criteria                                  | `packages/sim-core/src/modules/stressAdequacy.ts`    |
| Year loop, allocation, spillover               | `packages/sim-core/src/engine.ts`                    |
| Calibration gate                               | `packages/sim-core/test/calibration.test.ts`         |
| Parameter values and their sources             | `data/v1/*.json`, `docs/sources.bib`                 |
| Uncertainty ranges and their rationales        | `data/v1/uncertainty.json`                           |

## What we already think is weak

Stating this up front so the review is not spent rediscovering it.

1. **`ntcUtilization` (0.3)** is a flat share of nameplate NTC treated as firm annual import
   capability, identical in every hour and every direction of stress. It stands in for the flow
   model we do not have, it is unsourced, and it feeds the adequacy criterion directly. We think
   this is the weakest consequential number in the model.
2. **The peak-share criterion produces the headline result, not adequacy.** In 2045 Ireland and
   Luxembourg trip a 0.15 threshold on firm DC draw ÷ peak load, while their adequacy ratios sit at
   0.43–0.78. Both the 0.15 threshold and the 0.85 firm-load share are the numbers that matter, and
   only the latter has a published source.
3. **The connection pipeline redistributes rather than constrains at EU level.** Every grid
   parameter scores zero sensitivity on EU-wide DC demand. That may be a real finding or an
   artefact of the 60% spillover assumption; we cannot currently tell which.
4. **Both share anchors run lean.** The model hits the absolute TWh anchors closely but lands at
   4.22% vs 4.5% and 5.36% vs 5.7% on DC share of EU demand, suggesting the exogenous baseline
   demand trajectory may be slightly high.
5. **The renewables siting tilt uses generation mix, not carbon intensity**, so France is penalised
   for being nuclear rather than fossil. Defensible as a reading of "renewables-coupled", but a
   reviewer may consider it the wrong construct.
6. **Efficiency applies only to new additions**, with no retirement or retrofit of installed stock.
   This is a large part of why efficiency bends the curve rather than breaking it, and it is an
   assumption rather than a finding.

## What is deliberately out of scope

Load flow, intra-hour dispatch, market clearing, sub-national resolution (decided: country level for
v1, issue #2), behind-the-meter generation (deferred to v2, issue #3), and any endogenous price
formation. These are documented limits, not oversights — but if any of them makes the demand module
indefensible for the intended audience, that is exactly the finding we need.

## Recording the outcome

The review outcome and the changes it produces get committed to this repository — including
criticism we decide not to act on, with the reasoning. Issue #7 tracks it.
