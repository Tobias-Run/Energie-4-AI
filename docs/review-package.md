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

## What this would cost you, and what you get

Stated plainly, because an open-ended "please review our model" is not a reasonable thing to send
anyone.

**A useful review is roughly half a day.** Reading `model-notes.md` and this document is about two
hours; forming a judgement on the three questions above is another two. Running anything is
optional — every figure quoted here is reproducible in a few minutes, but nothing in the ask
depends on you doing so.

**You would not be asked to find the obvious problems.** The ten weaknesses below are ones we found
ourselves and published, several by overturning our own earlier claims on measurement. The
calibration gate currently reports **FAILING**, unrounded, in the README badge and in the UI. What
we cannot do from inside is tell whether the construction is sound for the audience it targets.

**A "this should not be published as is" is a useful answer** and will be recorded as such. So is
disagreement we decide not to act on — the repository already carries several such cases with the
reasoning, rather than quietly dropping them.

**Attribution is yours to choose:** named in the repository and in the tool's own about panel,
acknowledged without naming, or anonymous. The project is MIT-licensed, data bundles CC-BY-4.0, and
there is no commercial interest behind it.

## Reproducing a run

```bash
npm install
npm test          # 156 tests, includes the calibration gate and the narrative claims
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
   alike. The reason is finding 2 below — the adequacy criterion it fed never fired past year
   three of any run, which is exactly why that criterion has since been removed from flag logic.
   The parameters that actually move the corridor are `saturationTwh` (84.1 TWh),
   `demand2030Twh` (84.0) and the two capture shares (72.9 and 26.2); all fifteen others together
   move it by less than 0.9 TWh.
2. **The peak-share criterion is now the only flag criterion in the model — the adequacy ratio was
   removed from the flag logic entirely, not left inert (issue #30, B2, resolved).** Luxembourg
   trips the 0.15 threshold on firm DC draw ÷ peak load at **15.80%**; Ireland is closer than it
   looks, at **13.92%**, and still not flagged. (Both figures have moved six times: up when the
   peak-load denominator was corrected — issue #30, B1 — apart when `peakFactor` itself was
   derived from ENTSO-E's hourly load series instead of borrowed from an interconnection dataset
   — issue #39 — further apart when that same series' measured trend was applied linearly from
   2024 rather than held flat, which represents only one of two opposing real effects
   (electrification raises the baseline peak; a growing near-flat data centre share would lower
   it, but that effect is not sourced) and was on its own enough to clear the model's only
   central-run flag — back together when grid connection tightness was given a say in siting
   itself, not just in what gets served once sited (issue #30, B5) — and apart a final time when
   `priceIndex` was sourced from real Eurostat data (issue #4), which also changed the boom run's
   flag list to `FI, LV, LU, MT` from the long-standing `EE, LV, LU`.) The adequacy ratio used to
   fire only on base-year data — Poland in 2024, 2025 and 2026 at 0.919 / 0.910 / 0.903 — and
   never again; its 2045 maximum was 0.750, and sweeping `ntcUtilization` across its full
   uncertainty range moved it by exactly 0.000 either way past 2026. **This was the open question
   in the previous version of this document — whether a criterion that reacts only to the starting
   data belongs in the flag logic at all — and it's been resolved: dropped, not sharpened.** The
   ratio is still computed and shown (data table, CSV export); it just no longer decides a flag.
   Sharpening it into a real capacity-adequacy check (peak GW demand against _firm_ GW capacity,
   with per-technology capacity credits — the classic energy-vs-capacity-adequacy distinction,
   the textbook case being Texas 2021) would be the more capable fix, but needs sourced data this
   model doesn't hold (capacity credits, nameplate GW by technology, a firm-import figure) and
   edges toward the intra-hour dispatch detail the model's own honest-limits already disclose as
   out of scope. Sketched for v2 in `model-notes.md`; **we would value a view on whether that
   sketch is the right shape for it.**
3. **The connection pipeline could not constrain at all — found, fixed, and worth checking.**
   Every grid parameter used to score zero sensitivity on EU-wide DC demand. That turned out
   to be an artefact: available capacity was a per-country floor _plus_ the output of a delay
   chain fed by that country's own desired connections, so supply was a lagged function of
   demand. Denmark kept 8.63 of 13.40 TWh with its capability set to zero. The capability now
   caps the chain's inflow instead. Ireland consequently drops out of the flag list, permitting
   reform becomes measurable, and `baseConnectableGwPerYear` — still unsourced — becomes the
   binding parameter. It no longer has to stay frozen for the whole run: a
   `connectionCapacityGrowthPerYear` lever (default 0, so every published figure here is
   unchanged) lets a user compound it from 2024, prompted by Ireland's own modelled share
   not resembling the national statistics it should track (issue #30, B8). That mismatch has
   since been traced to its two causes and is no longer an open question: two thirds of it is
   a `dcTwh2024` that sits between the CSO's 2023 and 2024 readings, one third is that the CSO
   measures metered consumption where this model's denominator is total demand — the two
   shares were never directly comparable. **We deliberately did not correct Ireland's figure**,
   because `dcTwh2024` feeds the allocation gravity and every other country comes from the same
   ENTSO-E split; fixing one country of a relative set distorts the map rather than sharpening
   it. **A view on that call would be useful** — it is the same reasoning as weak-point 5, and
   we would rather be told it is too conservative than keep applying it by reflex. **We would
   particularly value a view on whether capping the inflow is the right repair**, and on
   whether the _default_ of a frozen ceiling — now a stated assumption rather than a silent
   one — is itself defensible, absent any published per-country growth rate. See "Repaired
   defects" in `model-notes.md`.
4. **An outside study now says the binding constraint is the one we model — and narrows our worst
   anchor (issue #63).** The EC's _Study on Cloud and AI Development in the EU_ (Aug 2026, CATI
   survey of 280 European data centres) states the mechanism directly: **"the primary delay stems
   from physical grid capacity availability rather than the administrative grid connection permit
   procedure."** That is finding 3 above, reached independently, and it has an uncomfortable
   corollary we would like a view on: our permitting-reform lever acts on the thing this source says
   is _not_ binding, which is also why it moves the EU total by 0.04%. The same study reports
   connection waits of 7–10 years (up to 13) in the FLAP-D markets holding 62% of European capacity,
   which corroborates `permittingYearsBaseline` = 9 from a second source. It also supplies the exact
   concept our contested IT-power anchor needed — 13.9 GW of "maximum IT load, assuming 100%
   utilisation" — which, once its exclusion of private enterprise data centres is corrected for,
   takes that anchor from +80% to **about +18%**. It does not clear it: the residual splits into a
   volume difference and a utilisation difference that partly cancel, and the two utilisation figures
   turn out to measure different things (nameplate draw from mandatory EED reporting, versus
   occupancy over commissioned capacity). **We would value a view on whether that decomposition is
   right**, and on whether a 30-country model should be reaching for a study that explicitly excludes
   enterprise capacity as a check at all. See `model-notes.md`, "A fourth source narrows it".
5. **Three of the five most-constrained markets in Europe carry an unsourced connection tightness,
   and we could not find a defensible way to fix it (issue #63).** `pipelineTightness` is sourced
   for Denmark, Ireland, the Netherlands and Italy, where a TSO has published a binding constraint.
   Great Britain (0.7), Germany (0.8) and France (0.9) carry values with no source — and all three
   are FLAP-D markets, which the EC study puts at 62% of European capacity and 7–10 year connection
   waits. The study looked like the fix: its Table 36 gives grid-connection timelines for twelve
   member states. We rejected it as a systematic source because the column explicitly blends
   administrative permitting with physical capacity availability, which this model represents as two
   separate parameters; because it mixes national figures with metro-versus-rest splits; and because
   it disagrees with the study's own appendix. We then measured changing Germany alone to the 0.45
   band its evidence arguably supports: EU-27 demand and the flag list are unchanged, but France
   overtakes Germany as the largest market — i.e. the load lands on the neighbouring _guess_. **We
   would value a view on whether a relative-allocation parameter can be sourced one country at a
   time at all**, and on whether leaving three known-constrained markets at unsourced values is the
   lesser error. See `model-notes.md` under data provenance.
6. **The flag denominator is unsourced, uncertain, and decisive — and it cited a source it does not
   follow (issues #67, #68).** Since the adequacy ratio was dropped (finding 2), DC share of peak
   load is the only flag criterion, and the non-DC demand trajectory is its denominator. Three
   things are true of it at once. It carried `entsoe2026tyndp` as its `source_id` from the first
   commit while implying ~0.85%/yr against that report's ~2.5%/yr — now corrected to `expert-guess`.
   It carried **no uncertainty at all** — every corridor parameter was a scenario or
   global-compute value — while deciding the output: **±0.5 pp/yr on baseline growth takes the
   model from two flags to none**, against `ntcUtilization`, which the corridor does sample and
   which moves the flag count by exactly 0.000. **That is now fixed** (issue #67):
   `demandPathBlend` samples the denominator, ranged on the 17–25% disagreement between the two
   authorities rather than on TYNDP's own ±8% economic variants — the variants measure movement
   within one reading and would leave the choice between readings treated as certain. The effect
   is large: sampled flag frequencies fall by roughly two thirds (Luxembourg 60.0% → 44.5%,
   Ireland 12.0% → 4.0%). **The corridor had been overstating how often anything crosses the
   line.** One caveat we would rather state than let a reader infer: the range is **not a
   probability statement** — a draw of 0.5 corresponds to no published path at all, and the mode
   sits at the low bound because that is where the central run is. Adopting TYNDP's
   own rates was measured: it takes the gate from 2 to 4 of 8 independent anchors missed and removes
   the only central-run flag, because **Ember and ENTSO-E disagree about EU-27 electricity demand by
   17% in 2030 and 25% by 2035** — the same shape as finding 4's volume spread, on the other side of
   the ratio. Both readings are now recorded as contested anchors and neither is enforced.
   The choice is now a `demandPath` lever rather than a buried assumption — `ember` (default, every
   figure here) or `tyndp` — so a reviewer can see what it does to the flag list directly.
   **We have deliberately not chosen between the two readings, and this is the single question we
   would most like answered.** The default stays `ember`; neither option is clean. `ember` meets the
   gate better but rests on scaffolding that agrees with Ember by coincidence rather than
   derivation. `tyndp` is a published path that breaks two independent anchors, removes the only
   central-run flag, and overshoots its own source by 7%. Picking one and presenting it as settled
   would assert a confidence we do not have — and picking is the judgement an external modeller is
   better placed to make than we are. **We would value a view on which authority a European demand
   denominator should follow**, and, separately, on whether a flag criterion whose denominator
   carries this much disagreement should be reported at all.
7. **Both share anchors run lean.** The model hits the absolute TWh anchors closely but lands at
   4.22% vs 4.5% and 5.36% vs 5.7% on DC share of EU demand, suggesting the exogenous baseline
   demand trajectory may be slightly high.
8. **The renewables siting tilt uses generation mix, not carbon intensity**, so France is penalised
   for being nuclear rather than fossil. Defensible as a reading of "renewables-coupled", but a
   reviewer may consider it the wrong construct.
9. **Efficiency applies only to new additions**, with no retirement or retrofit of installed stock.
   This is a large part of why efficiency bends the curve rather than breaking it, and it is an
   assumption rather than a finding. Note this is now the _only_ remaining caveat on the lever: it
   previously also multiplied European additions alone, which made it indistinguishable from Europe
   losing capture share. It acts on the global increment since issue #27.
10. **Grid connection now shapes siting itself, not just what gets served once sited (issue #30,
    B5).** `allocationWeight` multiplies in `pipelineTightness^0.5`, so a tight-pipeline country
    attracts less new build from the outset rather than only failing to connect it later. The
    exponent (0.5, `sitingConnectionExponent`, expert-guess) is load-bearing: applying
    `pipelineTightness` unexponentiated here exactly cancels the _other_ place it already scales a
    quantity, the connection ceiling, and collapses the EU-wide connection queue to zero regardless
    of scenario — measured directly, not assumed. **We would value a view on whether 0.5 is a
    defensible middle ground or an arbitrary one**, and on whether reusing one sourced number for
    two different real-world decisions (whether to propose a project, and how much of it connects)
    is the right modelling choice at all. See `docs/model-notes.md`, "Grid connection now has a say
    in siting itself".

## What is deliberately out of scope

Load flow, intra-hour dispatch, market clearing, sub-national resolution (decided: country level for
v1, issue #2), behind-the-meter generation (deferred to v2, issue #3), and any endogenous price
formation. These are documented limits, not oversights — but if any of them makes the demand module
indefensible for the intended audience, that is exactly the finding we need.

## Recording the outcome

The review outcome and the changes it produces get committed to this repository — including
criticism we decide not to act on, with the reasoning. Issue #7 tracks it.
