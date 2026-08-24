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

1. **`ntcUtilization` (0.3) is unsourced and structurally crude — but it has no consequence, and
   we were wrong to call it the most consequential.** It is a flat share of nameplate NTC treated
   as firm annual import capability, identical in every hour and every direction of stress, and it
   stands in for the flow model we do not have. An external review measured its swing across its
   own uncertainty range (0.2–0.45): **exactly 0.000**, on EU DC demand and on the flag count
   alike. The reason is finding 2 below — the adequacy criterion it feeds essentially never fires.
   The parameters that actually move the corridor are `saturationTwh` (84.1 TWh),
   `demand2030Twh` (84.0) and the two capture shares (72.9 and 26.2); all fifteen others together
   move it by less than 0.9 TWh.
2. **The peak-share criterion produces the headline result, and the adequacy criterion is close to
   inert.** In 2045 only Luxembourg trips the 0.15 threshold on firm DC draw ÷ peak load, at
   16.94%; Ireland sits at 10.03% and is not flagged. Adequacy fires only on base-year data —
   Poland in 2024, 2025 and 2026 at 0.919 / 0.910 / 0.903 — and never again; the 2045 maximum is
   0.750. Both the 0.15 threshold and the 0.85 firm-load share are the numbers that matter, and
   only the latter has a published source. Whether a criterion that reacts only to the starting
   data belongs in the flag logic at all is an open question (issue #30, B2).
3. **The connection pipeline could not constrain at all — found, fixed, and worth checking.**
   Every grid parameter used to score zero sensitivity on EU-wide DC demand. That turned out
   to be an artefact: available capacity was a per-country floor _plus_ the output of a delay
   chain fed by that country's own desired connections, so supply was a lagged function of
   demand. Denmark kept 8.63 of 13.40 TWh with its capability set to zero. The capability now
   caps the chain's inflow instead. Ireland consequently drops out of the flag list, permitting
   reform becomes measurable, and `baseConnectableGwPerYear` — still unsourced — becomes the
   binding parameter. **We would particularly value a view on whether capping the inflow is the
   right repair**, and on whether a static per-country connection ceiling over twenty years is
   defensible. See "Repaired defects" in `model-notes.md`.
4. **Both share anchors run lean.** The model hits the absolute TWh anchors closely but lands at
   4.22% vs 4.5% and 5.36% vs 5.7% on DC share of EU demand, suggesting the exogenous baseline
   demand trajectory may be slightly high.
5. **The renewables siting tilt uses generation mix, not carbon intensity**, so France is penalised
   for being nuclear rather than fossil. Defensible as a reading of "renewables-coupled", but a
   reviewer may consider it the wrong construct.
6. **Efficiency applies only to new additions**, with no retirement or retrofit of installed stock.
   This is a large part of why efficiency bends the curve rather than breaking it, and it is an
   assumption rather than a finding. Note this is now the _only_ remaining caveat on the lever: it
   previously also multiplied European additions alone, which made it indistinguishable from Europe
   losing capture share. It acts on the global increment since issue #27.

## What is deliberately out of scope

Load flow, intra-hour dispatch, market clearing, sub-national resolution (decided: country level for
v1, issue #2), behind-the-meter generation (deferred to v2, issue #3), and any endogenous price
formation. These are documented limits, not oversights — but if any of them makes the demand module
indefensible for the intended audience, that is exactly the finding we need.

## Recording the outcome

The review outcome and the changes it produces get committed to this repository — including
criticism we decide not to act on, with the reasoning. Issue #7 tracks it.
