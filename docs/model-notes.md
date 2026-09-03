# Model Notes

Audience: external energy-system reviewers (quality gate, mission document §7, issue #7).

**Status:** post-P2. This file was previously called `model-notes-p0.md` and described the P0
prototype; by the time the P2 work landed it misdescribed the model in four material ways, so it
has been rewritten against the running code rather than patched. Every figure below is read from a
default run at data bundle **v2.4.0**. This file drifted once before and an external review caught
it in four places at once, so the figures marked below are now produced by `modelFacts()` in
sim-core and checked against this file by `test/docsConsistency.test.ts` — a number here that
disagrees with the code fails the build.

## What this model is

A deterministic annual system-dynamics simulation of European data center electricity demand and
the grid's ability to serve it, 2024–2045, running entirely in the browser. It is an **exploration
device, not a forecast**, and it is not an optimization model: nothing here dispatches, minimizes
cost, or clears a market.

Runtime: a full 20-year run takes single-digit to low-tens of milliseconds; 200 Monte Carlo runs
take roughly 600 ms.

## Structure (mission document §5)

The core (`packages/sim-core`) simulates annually from base year **2024** through **2045** (the UI
reports 2026+). 30 countries: EU-27 plus GB, NO, CH. Modules, executed per year:

**1. Compute demand.** Global DC electricity demand follows a logistic curve through two IEA
anchors (415 TWh in 2024, 945 TWh in 2030), approaching an expert-guess ceiling of **3,000 TWh in
the base case**. That ceiling is not fixed across scenarios: the compute-growth lever scales growth
above the 2024 base, so it scales the ultimate growth too — `ceiling(m) = 415 + (3,000 − 415) × m`,
which is **4,938.75 TWh at ×1.75**. The curve never exceeds its own ceiling; earlier versions of
this file asserted a fixed 3,000 and were wrong about that (issue #30, B4).
The EU-27 captures a share of global _additions_ — 8.5% pre-2030 (IEA), 6.5% after (Ember/ICIS);
GB/NO/CH carry separate small capture shares. Additions are allocated across countries by a
gravity weight (existing stock^0.7) tilted by relative electricity price, and modified by the
siting-policy lever:

- `market` — gravity and price only (default).
- `renewables` — additionally weighted by the country's renewables share of generation^0.6. Note
  this reads the _renewables_ share, not carbon intensity, so nuclear-heavy France loses ground
  under it. That is a deliberate reading of "renewables-coupled siting", but a reviewer may
  reasonably think it should be carbon-based instead.
- `capped` — a country takes no further additions once DC load passes 20% of its own demand. The
  check runs at the start of each year against the previous year's share, so a country can
  overshoot by one year of additions before the cap bites.

**2. Electricity demand.** DC energy plus exogenous TYNDP-style baseline growth per country.
IT-load stock is derived from energy via PUE (1.36, declining 0.8%/yr toward a 1.15 floor) and
utilization (0.316) — both sourced to the EU's mandatory EED reporting rather than an unsourced
guess (issue #34, below).

**3. Supply & grid.** Per-country generation is split into **renewables, nuclear and legacy firm**
(coal/lignite/oil), each on a linear NECP-flavoured trajectory; nuclear deltas may be negative
(phase-out) or positive (new build) and are floored at zero. Gas dispatches as the residual, up to
a per-country cap.

Interconnection is a **direction-aware NTC network with 2024/2030/2040 anchors**, interpolated
linearly and held flat outside them. Direction matters: 72 of the sourced borders are asymmetric
(CH→IT carries 4.42 GW against 1.91 GW the other way), so a country's import capability is the sum
of capacities pointing _into_ it. The sourced network grows 80.7 → 118.1 GW across the horizon.
Import capability is that capacity × hours × a flat 30% utilization — a modelling convention
standing in for the absent flow model, and **the single most consequential unsourced number in the
model**.

Grid connection for new DC load is constrained by a three-stage delay chain (announced → permitted
→ built), permitting 9 years baseline / 5 with the reform lever, construction 3 years, with a
speculative queue inflation factor of 1.5. Unserved connection demand relocates to countries with
spare capacity at a rate of 60% ("Dublin freeze spreads"); the rest queues as a stranded-asset
proxy.

**4. Stress & adequacy.** Two independent flag criteria, and which one binds matters:

- _Adequacy:_ stress index = demand ÷ total resources (renewables + nuclear + legacy firm + gas cap
  - import capability). Flags above 0.9.
- _Peak share:_ firm DC draw ÷ national peak load, flags above 0.15. `peakFactor` per country is
  computed from 2024 peak demand ÷ average load, not guessed — and it is applied to the **baseline**
  load only. Data centre load is near-flat and does not peak with heating and lighting, so the peak
  is `baseline × peakFactor + DC firm draw`. Applying the factor to total demand, as this model did
  until #30/B1 was fixed, inflated the denominator exactly where DC load was largest and diluted
  every share below.

**In the central run, nobody is flagged in 2045 — a result that changed sign under this same
model within the space of one issue (#39).** `peakFactor` used to be held at its 2024 value for
the whole horizon even after the value itself was corrected to a measured one (see "`peakFactor`
was borrowed from an interconnection dataset", below). ENTSO-E's own load series show it is
rising, not flat, in 33 of 38 countries measured (median +0.0115/year); applying that trend
linearly from 2024 raises `peakFactor` at every country, which raises the baseline-peak
denominator, which dilutes the DC share of peak everywhere. Luxembourg — the sole country that
still tripped the line under a held-flat 2024 factor — falls from 16.46% to **14.51%** of peak,
under the 15% threshold. Ireland sits at **14.19%** and is closer to the line than Luxembourg is,
but still not flagged — its own connection ceiling holds it there (see "Repaired defects").

This is the trade the issue itself named before it was made: the trend captures one real effect
(electrification of heat and transport raises the baseline peak) and not its opposite (a growing
near-flat data centre share lowers the system's overall peakiness), so applying it alone is a
one-sided correction, not a netted forecast — see "Known simplifications" below. It happens to
be enough, on its own, to clear the model's only 2045 flag. That the central case now names no
country at all is a fact about this one-sided correction, not a claim that grid stress has gone
away; the boom scenario (compute growth ×1.75) still flags three countries (below).

The adequacy criterion is close to inert, and a reviewer should know how close. It fires only on
base-year data: Poland is flagged in 2024, 2025 and 2026 at 0.919 / 0.910 / 0.903, and from 2027
onward nothing reaches the 0.9 line again — the 2045 maximum is 0.750. Every parameter feeding it
therefore scores a sensitivity of exactly zero at the 2045 tornado horizon. Tracked as B2 in
issue #30.

The flexibility lever removes enrolled load from the peak contribution entirely, on the assumption
that it curtails exactly when needed — an optimistic reading, which is why the lever stops at 50%.
ENTSO-E's own case holds curtailment to 40–70 hours a year at better than 99% availability, so
"available whenever the peak falls" is a good deal more than the instrument actually promises. The
same lever also shortens the permitting route for the enrolled share (issue #42, below).

Emissions: gas × 0.37 Mt/TWh plus legacy firm × 0.85 Mt/TWh, anchored on IPCC AR5 Annex III. These
are **direct-combustion factors** and sit below the lifecycle medians (gas 0.49, coal 0.82) by
design, because upstream methane, fuel transport and plant construction are not tracked. Reported
emissions are therefore a lower bound.

## Uncertainty (mission document §5.5)

19 parameters carry triangular low/central/high ranges in `data/v1/uncertainty.json`. Two kinds live
there and are labelled as such: ranges taken from a publication's own scenario spread (IEA gives
700 / 945 / 1300 TWh for global 2030 demand; IPCC AR5 gives 740–910 gCO₂eq/kWh for coal) and ranges
on model-internal parameters with no published equivalent — for those the range _is_ the statement,
and the central value alone was always false precision.

Monte Carlo mode samples all of them jointly, seeded and deterministic per seed. The tornado is a
one-at-a-time sensitivity and does not capture interactions; the corridor does.

Two results from that machinery a reviewer should see early:

- **Flag frequencies say more than the flags.** For 2045 the deterministic run names nobody at
  all; across sampled ranges (200 runs, seed 1) Luxembourg is still flagged in **46.5%** of runs,
  Ireland in **16.5%**, Latvia in 4.0%, Estonia in 3.5% and Malta in 2.5%. A country the
  deterministic central run clears can still be one uncertainty draw away from tripping the line
  in nearly half the sampled runs — the flag list is a single point on a distribution, not the
  distribution. Ireland's jump is the sharper story: it appeared in no sampled run at all before
  peak factors were measured (#39), then 2.0% once they were, and now 16.5% once their trend is
  applied on top (#39, this section) — the same correction that clears Luxembourg's deterministic
  flag makes Ireland's the more exposed of the two under uncertainty.
- **Every grid parameter scores zero on EU-wide DC demand.** At EU level the connection pipeline
  redistributes load rather than removing it. This is why the tornado target is selectable, and it
  is the same finding the permitting-reform and siting scenarios produce independently.

## Calibration (validation gate V1)

**Verdict: FAILING — 2 of 8 independent anchors missed.** Computed by
`packages/sim-core/src/calibration.ts`, enforced by `test/calibration.test.ts`.

The gate reported "passing" for months and the claim did not hold. An external review (issues #25,
#26) established that three of its five anchors were arithmetic identities of the model's own
construction, that the base year was never checked at all, and that the two anchors which could
fail came from a publication whose volume estimate the model misses by a fifth. The anchor set has
been rebuilt around what can actually come out negative — and it does.

Anchors now carry a **tier**, and only the independent tier decides the verdict.

### Construction tier — reproduced by the model's own arithmetic

| Anchor                      | Source  | Target  | Model  | Deviation |
| --------------------------- | ------- | ------- | ------ | --------- |
| Global DC demand 2030       | IEA     | 945 TWh | 945.00 | 0.0%      |
| EU-27 DC increase 2024→2030 | IEA     | +45 TWh | +43.93 | −2.4%     |
| EU-27 DC growth 2025→2030   | ENTSO-E | ≥ +50%  | +53.0% | —         |

`k` in the logistic is solved so the global curve passes through 945 at 2030, and the European
capture share was set to the +45 TWh anchor: 0.085 × (945 − 415) = 45.05. These are regression
protection. They establish nothing about the model and no longer count toward the verdict.

### Independent tier — the anchors that decide the verdict

| Anchor                               | Source  | Target    | Model  | Deviation  | Status |
| ------------------------------------ | ------- | --------- | ------ | ---------- | ------ |
| Europe DC demand 2024 (base year)    | ENTSO-E | 87 TWh    | 82.13  | −5.6%      | met    |
| DC share of EU demand 2024 — EUDCA   | EUDCA   | 2.0%      | 2.61%  | **+30.5%** | missed |
| Europe DC demand 2030                | ENTSO-E | ≥ 134 TWh | 134.58 | +0.4%      | met    |
| Five largest DC countries 2024       | ENTSO-E | set       | match  | —          | met    |
| Countries ENTSO-E names individually | ENTSO-E | set of 14 | match  | —          | met    |
| DC share of EU-27 demand 2030        | Ember   | 4.5%      | 4.18%  | −7.0%      | met    |
| DC share of EU-27 demand 2035        | Ember   | 5.7%      | 5.32%  | −6.6%      | met    |
| **Europe DC demand 2035**            | ENTSO-E | ≥ 199 TWh | 185.18 | **−6.9%**  | missed |

**What the two misses mean.**

_The 2035 level_ is measured against ENTSO-E's **lower** bound. The same figure gives 254 TWh as its
maximum, so against ENTSO-E's upper bound the shortfall is 27%, not 7%.

_The base year now has a real, failable test — not just the ENTSO-E volume it meets (issue #40)._
EUDCA's survey states DC load at **2%** of EU electricity demand in 2023; the model starts 2024 at
**2.61%**, +30.5% over that reading. Unlike the ENTSO-E volume anchor above, EUDCA's share has a
stated bottom-up basis — informal grid-operator input on capacity usage plus actual measured usage
data for Denmark, the Netherlands and Ireland, covering 46% of EU colocation-plus-hyperscale by MW
— rather than being folded into ENTSO-E's own top-down synthesis. Kept `independent` for that
reason, unlike the EUDCA volume reading below it (`contested`): the share has grounds to falsify
the model that the volume figure it accompanies does not.

Two anchors used to sit in this table — installed IT power for Europe and EU-27 — missing at
**−18.9%** and **−14.9%**. They no longer do, and not because the model improved: they were
**re-scoped to `contested`** (issue #34), for reasons that belong with the other contested anchors
below.

_The 2030 level, which the model meets, is also a floor._ ENTSO-E labels 134 TWh `2030 (min)`. The
model clears it by 0.4%. Reading that as agreement with ENTSO-E is a mistake this document made
before: it is agreement with the bottom of ENTSO-E's range.

### Contested tier — measured, not enforced

The published estimates for Europe's 2030 DC demand do not agree with each other:

| Reading                 | Value    | Model  | Deviation |
| ----------------------- | -------- | ------ | --------- |
| IEA _Energy and AI_     | 109 TWh  | 134.58 | +23.5%    |
| ENTSO-E (authoritative) | ≥134 TWh | 134.58 | +0.4%     |
| Ember/ICIS              | 168 TWh  | 134.58 | −19.9%    |

**The published range is 109–168 TWh — a 54% spread, wider than any lever in this model.** No value
satisfies both ends within ±10%, so no model can. **ENTSO-E is the designated authority** (European
scope, published by the association of European TSOs, most recent at May 2026); the other readings
are recorded and reported rather than absorbed into a tolerance.

An earlier version of this file explained the lean share anchors with "the exogenous baseline demand
trajectory may be a touch high." That was wrong, and wrong in the opposite direction: for the model
to reach 4.5% at its own DC volume, EU-27 demand in 2030 would have to fall below its 2024 level in
the middle of electrification. The cause was never the denominator — it was a conflict between
sources that the ±10% tolerance was wide enough to hide.

**The base year has the same kind of conflict, found reading EUDCA / Pb7 Research's own report
(issue #40).** EUDCA states DC electricity consumption at ≈55.3 TWh, EU, 2023 — the model's
comparable EU-27 2024 figure is **67.13 TWh, +21.4%** over it:

| Reading                 | Scope  | Year | Value    | Model | Deviation  |
| ----------------------- | ------ | ---- | -------- | ----- | ---------- |
| EUDCA / Pb7             | EU     | 2023 | 55.3 TWh | 67.13 | **+21.4%** |
| ENTSO-E (authoritative) | Europe | 2024 | 87 TWh   | 82.13 | −5.6%      |
| IEA                     | EU     | 2022 | ~100 TWh | 67.13 | −33%       |

**ENTSO-E's own figure is not independent of EUDCA's.** ENTSO-E's 87 TWh is a synthesis that folds
in this EUDCA survey alongside IEA and Accenture material, so the independent-tier anchor the model
meets is agreement with a midpoint of a range EUDCA and IEA disagree on by nearly a factor of two —
not confirmation against either end. EUDCA states the disagreement itself, in its own footnote to
the 55.3 TWh figure: "significantly lower compared to the most recent IEA estimates for about
100 TWh in 2022," adding that "cross checks with non-public data from grid companies show this is
in line with their actual data" — a claim of grid-operator corroboration the IEA figure does not
carry. Kept `contested` rather than `independent`, alongside the 2030 spread above, for the same
reason: no value can satisfy sources this far apart within a tolerance, so no model can either.

**Installed IT power — moved here from independent, and the reversal is the finding (issue #34).**
`dcItLoadGw` divides utilisation back out of average draw, so it tests the base-year volume, the PUE
trajectory and `itUtilization` at once. `itUtilization` was an `expert-guess`, 0.65, never tested
against a source. It is now sourced: the EU's mandatory EED reporting (Delegated Regulation (EU)
2024/1364, Article 12 of the recast Energy Efficiency Directive) implies **0.316** —
`(14,088 GWh / 1.36) / (3,738.86 MW × 8,760 h)`, cross-checked independently at 0.41 by a German
sample facility in the same report. `pue2024` moved too, 1.4 → **1.36**, the same report's
energy-weighted EU average (n=681), replacing a 2020 academic estimate.

Correcting `itUtilization` does not close the anchor. It reverses it:

| Anchor                         | Source  | Target  | Model | Deviation  |
| ------------------------------ | ------- | ------- | ----- | ---------- |
| Europe installed IT power 2024 | ENTSO-E | 12.7 GW | 21.82 | **+71.8%** |
| EU-27 installed IT power 2024  | ENTSO-E | 9.9 GW  | 17.83 | **+80.1%** |

The model used to sit **below** ENTSO-E's figure by a fifth; with `itUtilization` sourced instead of
guessed, it sits **above** it by three-quarters to four-fifths. Not a small correction to a
parameter — a sign flip and roughly a quadrupling of the gap's size, and the reason is definitional,
not numerical. Commission Delegated Regulation (EU) 2024/1364, Article 2, defines two different
quantities: **installed IT power demand** (Art. 2(14), the nameplate sum of equipment racked) and
**rated IT load** (Art. 2(15), what the facility's power and cooling can carry). `dcItLoadGw` is
built as "DC load = IT load × PUE × utilization" — a nameplate-like, Art. 2(14) concept. ENTSO-E's
12.7/9.9 GW is closer to the Art. 2(15) concept: EUDCA's own _State of European Data Centres 2025_
(p.22) confirms this in its own words — "the EED asks for the actually installed nominal IT power
based on the installed IT equipment," distinct from "the maximum power that is available for IT
equipment" that ENTSO-E's figures track — and quantifies the gap: **installed nominal ÷ available =
48%** (weighted, N=63, colocation).

That 48% factor looks like the fix. It is not, once `itUtilization` is already sourced: dividing
`dcItLoadGw` by 0.48 to convert it into "available" terms would push the deviation past **+250%**,
because the `itUtilization` correction and the 0.48 conversion compensate for the same
nameplate-versus-drawn-power gap — applying both double-counts it. Retargeting to installed-nominal
terms instead (EU-27 ≈ 9,937 × 0.48 ≈ 4.77 GW) fares no better: the model's 17.83 GW is **+274%**
over that target. And EUDCA's own EU energy figure (55.3 TWh, → #40) against 4.77 GW of installed
nominal implies an IT utilisation near unity, which is not credible on its own terms. Three
independently-sourced figures — the anchor, the 48% conversion, and the energy total — do not close
against each other by any pairing. **No re-scoping produced a plausible match, which is the
finding**, not a gap this project's own measurement could paper over by picking whichever pair of
sources happens to agree.

### What this gate still does not establish

- **ENTSO-E is not independent of the IEA.** Its figures are a synthesis of IEA _Energy and AI_
  (2025), EUDCA _State of European Data Centres 2025_ and an Accenture multi-source consolidation.
  Treating both as separate anchors overstates how much independent evidence the model is held to.
- **The country distribution is tested as a set, not as an order.** ENTSO-E ranks France ahead of
  the UK, Spain ahead of Italy, and Norway seventh; the model does none of those. The set of
  fourteen matches, which is what the allocation module is held to for now.
- **Ireland is not checked against national statistics.** The single most concentrated case in the
  model has no anchor of its own.
- **EU-27 and Europe are two different scopes, and the anchor bundle now says so explicitly
  (issue #31, C5) — but re-scoping does not change any verdict.** "Europe" here means all 30
  countries; GB, NO and CH sit outside EU-27 and carry their own fixed capture shares
  (`captureShareOfGlobalAdditions.nonEu`) on top of the EU-27 mechanism, so Europe's DC total
  runs consistently above EU-27's — 22% in 2024, 21–22% across 2030–2035. The volume anchors
  (`europeDc2024Twh`, `europeDc2030TwhMin`, `europeDc2035TwhMin`) are already Europe-scoped, and
  the share anchors (`euDcShareOfDemand2030`, `euDcShareOfDemand2035`) are already EU-27-scoped
  against an EU-27-scoped source (Ember/ICIS) — each compares like with like. Measured directly:
  recomputing those two share anchors at Europe scope moves them from 4.18%/5.32% to only
  4.27%/5.46% — GB/NO/CH's capture is too small a share of the total to matter much either way,
  and both anchors already pass at either scope. The scope distinction was worth disclosing
  (done in #32), but it was never the reason any anchor here passes or fails.

## Data provenance

Every parameter carries a `source_id` resolving to `docs/sources.bib` or the reserved value
`expert-guess`, enforced by a unit test. Currently **79 of 123 tracked parameters are sourced (64%)**.

That percentage went _down_ when uncertainty ranges were added, because 19 new parameters came under
the same tracking rule and 11 of them are expert estimates. The denominator grew; nothing regressed.

Sourced in the current pass: per-country demand and the renewables/nuclear/fossil split (Ember
European Electricity Review 2025), NTC capacities and peak factors (Ember Europe Electricity
Interconnection Data Tool, CC-BY-4.0, ENTSO-E-derived), emission factors (IPCC AR5), permitting
durations (EC Grids Package), regional benchmarks (IEA, corroborated for the US by LBNL and EPRI).

`pipelineTightness` is now sourced for the four countries where a TSO has published a binding
constraint: Denmark (national connection pause, 2026-03-02), Ireland (CRU decision, 2025-12),
the Netherlands (TenneT queue and the Amsterdam moratorium) and Italy (Terna). The numeric
mapping from those facts to a 0–1 multiplier is a documented model convention, recorded in
`data/v1/countries.json` under `pipelineTightnessMapping` — the evidence is sourced, the
multiplier is not a measured quantity. The remaining 26 countries stay at 1.0 and
`expert-guess`.

**The generation-mix categories were an unbacked convention; they still are, just a sourced one
(issue #38).** `renewablesTwh2024`, `nuclearTwh2024` and `otherFirmTwh2024` have carried a
`source_id` (Ember's European Electricity Review 2025) for their _values_ since #4/#12, but
nothing backed the _taxonomy_ — which ENTSO-E-level production type belongs in which bucket.
Issue #38 proposed checking that against a peer-reviewed mapping (Unnewehr et al. 2022) found in
a KIT/Helmholtz open-source repo, which raises two concrete questions: where does Waste go, and
is pumped-storage hydro counted as generation without double-counting the energy consumed to
fill the reservoir.

Fetching Ember's own Data Methodology document (v1.5) settles both, for the taxonomy that
actually matters here: this model's mix values come from Ember, not from raw ENTSO-E production
types, so Ember's own definitions govern regardless of what a different, ENTSO-E-level mapping
says. Ember's answer: Waste sits inside "Other Fossil" (p.9), alongside oil/petroleum products
and manufactured gases — so it lands in `otherFirmTwh2024`, not `renewablesTwh2024`, which is
what this model's code comment already said before it had a citation. Pumped hydro: "Where
possible, Hydro generation excludes any contribution from pumped hydro generation" — excluded
from the renewables figure rather than counted, avoiding the double-count.

Checked against Unnewehr et al.'s mapping specifically, the split does **not** hold — the more
interesting outcome the issue anticipated. Unnewehr keeps Waste as its own category rather than
folding it into Other Fossil, and its published mapping assigns Hydro Pumped Storage's raw
"Actual Aggregated" generation to Hydro without resolving whether that double-counts pumping
consumption; the reference implementation of that mapping (Helmholtz-AI-Energy) flags the paired
consumption field as unclear rather than handling it. Both are genuine disagreements with Ember,
not just presentation differences. Since this model is one aggregation step downstream of Ember
rather than of raw ENTSO-E data, Ember's choices are the ones it actually inherits — Unnewehr's
mapping is recorded as the comparison that was checked, in `mixCategoryMapping` in
`countries.json`, rather than adopted. No mix value changed.

Still `expert-guess` and worth the hardest scrutiny: `ntcUtilization`,
`baseConnectableGwPerYear`, `priceIndex`, `gasCapTwh2024`, all growth-rate fields, both flag
thresholds, `phantomQueueFactor`, `spillShare`, `allocationGravityExponent`.

## Repaired defects

**The grid-connection constraint could not bind (fixed).** A country's available connection
capacity used to be `baseConnectableGwPerYear * pipelineTightness + builtFlow`, where
`builtFlow` leaves a delay chain whose inflow is that same country's desired connections.
Supply was therefore a lagged function of demand: the pipeline manufactured roughly whatever
capacity was wanted and the per-country term was only an additive floor. Setting Denmark's
`pipelineTightness` to **zero** still left it 8.63 of the 13.40 TWh it got unconstrained in
the 2045 boom run, with a queue of exactly zero throughout. A national moratorium — precisely
what Energinet imposed in March 2026 — was unrepresentable at any parameter value.

The capability now caps what **enters** the pipeline instead of supplementing what leaves it.
Both mechanisms stay live: the ceiling limits the sustainable connection rate, while
permitting duration still governs how fast the chain delivers during a ramp. Capping the
outflow instead was tried and rejected — it made permitting reform completely inert, because
the ceiling then bound in every year that mattered.

Three results changed, and all three are published in `docs/fallstudien.md`:

- **Ireland is no longer flagged.** Its own connection limit holds it at 19.58% of national
  demand and 12.47% of peak, below the 15% line, and it is now completely insensitive to the
  compute boom — 8.7 TWh in the central, boom and boom-plus-efficiency runs alike.
- **Permitting reform became measurable.** The three countries with a sourced connection
  constraint gain double digits by 2030 (NL +11%, DK +12%, IE +4%) and their queues shrink.
  Previously the lever moved almost nothing, because nothing could be withheld.
- **Efficiency now moves the flag list**, taking Latvia off it in the boom run. It previously
  changed the level only.

The trade is that `baseConnectableGwPerYear`, still `expert-guess`, became the binding
parameter. Its leverage was measured: over a ×0.5 to ×2 range the EU total moves 221 → 219 TWh
and the flag list stays `[LU]`, but Ireland's own figure swings between 7.6 and 11.0 TWh. EU
aggregates are robust to it; country-level statements are not.

Pinned by `packages/sim-core/test/connectionConstraint.test.ts`.

**Pipeline initialisation was not a fixed point (fixed).** `stepPipeline` added the year's inflow
to the announced stock _before_ computing outflows, so a share of a connection announced today
finished construction in the same year, and `initPipeline` overshot its own steady state by 37.04%
in the first year. Outflows are now taken from the stocks as they stand at the start of the year.
The initialisation is an exact fixed point — a steady inflow of 1 returns exactly 1.000000 in every
year — and a one-off announcement now builds nothing for two years before deliveries start, which
is a minimum lead time emerging from the step order rather than an added rule.

This was raised by the external review, which additionally proposed calling `initPipeline` with the
permitting duration the run actually uses. **We tested that and did not adopt it.** Scaling the
initial stock by the reform duration reduces it by precisely the factor the drain rate is increased,
so permitting reform becomes a mathematical no-op: measured, a flat 1.000 in every year, identical
to the baseline. The base-year stocks represent a backlog accumulated under today's ~9-year regime,
and a reform draining that backlog faster is a real effect of the policy. With the step order fixed
it is no longer an instantaneous jump: the run starts at exactly the steady flow and rises to about
1.43× over four years before decaying back.

**The efficiency lever did not model efficiency (fixed).** `efficiencyFactor()` multiplied only
the European additions, leaving the global driver untouched. That made the lever arithmetically
indistinguishable from Europe capturing less compute: at 3%/yr the global curve did not move at
all while Europe's share of global DC energy fell from 8.41% to 6.88% by 2045. For a policy
audience that is the wrong statement — the same chips run elsewhere, at the same efficiency, and
Europe simply gets fewer of them.

Efficiency is a technology assumption about the world, so it now acts on the global increment.
Europe's share of global demand stays put when the lever moves (8.40% → 8.75% at 2%/yr; the small
rise is the un-retrofitted 2024 base growing as a proportion of a slower-growing total). European
demand still falls by the same amount it did before — the arithmetic for Europe is unchanged, which
is why no case-study figure moved. What changed is that the global total now falls too: 2,594 →
2,171 TWh in 2045 at 2%/yr.

Efficiency still applies to new capacity only; nothing already built is retrofitted. That is a
separate limitation, listed under honest limits, and it is the reason the curve bends rather than
breaks. Pinned by `packages/sim-core/test/efficiencyLever.test.ts`.

**`phantomQueueFactor` measures the wrong direction (open).** In the model a larger
speculative queue _expands_ grid build-out. The sources that quantify speculation describe the
opposite response: Terna reports 82 GW of data-centre requests against 1.5–2 GW it expects to
materialise by 2030 and triages accordingly; Energinet stopped connecting altogether at 60 GW
against a 7 GW peak. Oversubscription produces rationing, not proportional construction. The
sourced figures are therefore deliberately _not_ plugged into this parameter — doing so would
push the model to build more grid, not less. Its range was widened to 1.0–3.0 instead.

### The peak-load denominator (issue #30, B1)

`peakLoadGw` applied the country's 2024 peak factor to **total** demand, data centre load included.
That factor describes the baseline load shape — heating, lighting, industry — from a year in which
data centres were a small part of it. Data centre load is near-flat, so scaling it by a peaking
factor it does not have inflated the denominator, and it did so most in exactly the countries where
the data centre share was largest. The numerator meanwhile used the flat firm draw, so the two
halves of the ratio described different systems.

The peak is now `baseline × peakFactor + DC firm draw`, using the same firm draw the numerator uses.

| 2045, central | before | after  |
| ------------- | ------ | ------ |
| Luxembourg    | 16.94% | 18.35% |
| Ireland       | 10.03% | 11.09% |

**The flag list changed in the boom run**, which is what makes this more than a rounding matter.
Estonia went from 14.59% to 16.82% and Lithuania from 13.11% to 15.06%, both crossing a 15% line
they had sat under. Monte Carlo frequencies moved with it. (Lithuania has since fallen back below
the line — see the lead-time section below. It has been on both sides of the threshold twice in one
day of corrections, which is the best available evidence for how little the flag list is worth as a
robust quantity.)

A second consequence is worth stating because it cuts against the tool's own optimism: **the
flexibility lever now has to work harder.** Luxembourg's share falls 18.35 → 16.83 → 15.24 → 13.59%
at 0 / 10 / 20 / 30% participation, so clearing its flag takes 30% enrolment where 20% used to do
it — half the lever's range for one country. **Both halves of that sentence were undone by #39:**
on measured peak factors the series is 16.46 → 15.06 → 13.61 → 12.12% and 20% clears Luxembourg
again. The 30% claim rested entirely on an unsourced parameter. Shedding load lowers the system peak as well as the
data centre's own contribution, so the share falls sub-proportionally rather than in step with the
lever, which is the arithmetically correct behaviour and the less flattering one.

Note on provenance: the external review's counter-calculation for B1 put the **full** DC average in
the denominator while keeping the firm draw in the numerator, which is inconsistent in the opposite
direction and lands 0.5–0.6 pp lower. At system peak the shiftable part is by construction shifted
away, so both halves use the firm draw here.

### Three presentation defects, fixed together (issues #35, #31 C2/C4)

**Congestion cost moved the wrong way.** The figure was normalised against the base-year index _of
the same run_, so a parameter that changed 2024 stress moved numerator and denominator together.
`ntcUtilization` moved the denominator more, and the reported cost therefore **rose** as import
capability rose — €3.455 bn at 30% utilisation against €3.505 bn at 90%, while the stress it is
built from fell in every country. It is now normalised against a fixed reference computed from
default parameters, so it falls monotonically with import capability and is comparable across
runs. (The defect survived unnoticed partly because mutating the module-level defaults, as a naive
sensitivity check does, moves the reference too and reproduces the old behaviour. The regression
test perturbs a cloned parameter set, the way `runMonteCarlo` does.)

**PUE was displayed as an assumption.** `pueAt()` feeds `itLoadGwFromEnergy()` and nothing else;
its swing on demand is exactly 0.000. Shown in the assumptions drawer next to capture shares and
permitting durations, it reads to any professional audience as a demand driver. Both it and
`itUtilization` are now labelled as the conversion they are — and `itUtilization` is now shown at
all, because since the ENTSO-E capacity anchors landed it is the `expert-guess` that carries a
failed gate anchor (#34).

**The reproducibility promise tested nothing.** A single run draws no random numbers, so asserting
that two runs at the same seed agree compared two identical deterministic computations.
`mulberry32(cfg.seed)` was called and its result discarded; that dead call is gone. The tests now
assert the two real properties: a single run is seed-_independent_, and the Monte Carlo sampler is
seed-dependent and reproducible. `startYear` likewise bounds nothing — the integration always
begins at the 2024 data base year, because 2045 depends on every year in between — and is now
documented as the reporting convention it is.

### The delay chain had no lead-time distribution (issue #28, A4)

Each phase was one well-mixed stock, which drains exponentially. The mean residence time was right
and everything else about the timing was wrong: a share of every announcement left almost at once,
and the remainder trailed off in a tail that never quite ended. Fixing the step order (#29) stopped
same-year delivery, but the shape stayed exponential.

Each phase is now three sub-stages in series — an Erlang-3 chain. Same mean, far less dispersion,
and a genuine minimum: the six sub-stages take six annual steps to traverse, so **nothing at all
arrives before year seven**.

Cumulative delivery of a 1 GW announcement, nominal 9 + 3 years:

| Year        | 1    | 2    | 4     | 8     | 12    | 20    |
| ----------- | ---- | ---- | ----- | ----- | ----- | ----- |
| First-order | 3.7% | 9.5% | 23.4% | 49.3% | 67.8% | ~85%  |
| Erlang-3    | 0%   | 0%   | 0%    | 11.1% | 53.2% | 94.1% |

This is also why permitting reform read as a weak lever. Against a first-order lag, moving 9 years
to 5 smears across the whole response function; against this chain it moves an edge. At year 8 the
baseline has delivered 11.1% and the reform 47.5%. Ireland's 2045 volume responds to the lever for
the first time: 8.56 TWh baseline against 8.96 with reform.

The boom flag list moves again as a result — `LT, EE, LV, LU` back to `EE, LV, LU`, because
Lithuania sat at 15.06%, six hundredths of a point over the line. The renewables-siting case still
pushes it back over. A threshold that three separate corrections have flipped in both directions is
a threshold, not a finding.

**What this construct still cannot do.** At the default three-year construction duration the
sub-stage transfer rate is exactly 1, so construction is a rigid three-year shift register with no
dispersion at all — every project takes exactly three years to build. Permitting keeps its spread
because its duration is longer than the stage count. Real construction times vary; this does not.

### The same chain drained more than it held (issue #43)

Found while measuring something else, and it is a defect in the repair above rather than in the
original model.

The stage count comes from `stagesFor` at initialisation; the duration comes from the lever at each
step. `engine.ts` initialises with the **baseline** permitting duration even when reform is on —
deliberately, because sizing the starting backlog for the reform duration would make reform a
mathematical no-op. So the array holds three stages sized by nine years while a step may use a much
shorter duration, and the transfer rate `k / duration` was free to exceed 1.

Measured, initialising at 9 + 3 and stepping a 1 GW impulse:

| Step duration | Rate | Cumulative delivery | Lowest stock |
| ------------- | ---- | ------------------- | ------------ |
| 3 years       | 1.00 | 1.000               | 0            |
| 2 years       | 1.50 | **0.998**           | **−5.06 GW** |
| 1 year        | 3.00 | −4.18 × 10⁸         | −4.78 × 10⁹  |

The middle row is the one worth keeping. At moderate overshoot the **cumulative delivery still
reads 0.998** while the stocks underneath sit at minus five gigawatts. An aggregate check passes;
only outright divergence is visible from the total. The regression tests therefore assert on stocks
and outflows, not on sums.

The rate is now clamped at 1 where it is computed, which is the graceful degradation the module
comment already claimed and did not have: below `duration = k` the chain saturates at one stage per
year, so the lead time stops shortening instead of the arithmetic breaking down.

**No published figure moves.** The clamp binds only below a three-year duration, and nothing
reachable crosses that — the lever offers 9 or 5, the sampler draws no lower than 4, construction is
fixed at 3 and therefore sat exactly on the boundary rather than inside it. The defect was reachable
only through `runSimulation({ params })`, which is a public export, and it failed silently: no throw,
no `NaN`, just a well-formed result object full of nonsense.

The pre-existing stability test did not catch it because it initialised and stepped with the _same_
duration, so `stagesFor` always matched. That assumption is now written into the test rather than
left implicit.

### Flexibility bought a lower flag and nothing else (issue #42)

`flexibilityShare` appeared in exactly one place in the whole simulation core — the firm share in
the peak criterion. ENTSO-E §4.3 describes the mechanism it is named after quite differently:

> "Rather than waiting years for full firm capacity, a data centre receives a reduced firm
> allocation complemented by conditional capacity that can be curtailed when the system is
> constrained."

It is a **time-to-power** instrument. ENTSO-E quantifies it at three to five years earlier, with
curtailment held to 40–70 hours a year. The model's headline finding is that connection is the
binding constraint, and the lever that ought to carry the one published mechanism for relaxing it
was wired somewhere else entirely.

A flexible connection agreement is one commitment with two consequences, so the lever now drives
both: curtailable load is not firm at peak, **and** it takes a permitting route shorter by
`flexibleConnectionYearsSaved` (4 years, the midpoint of ENTSO-E's range).

**Two chains, not a blended duration.** The inflow splits by the flexible share and each part runs
at its own duration. A single chain on a weighted-average duration would move the mean identically
while claiming every project got faster, which is not what the source describes. The base-year
backlog sits entirely in the firm chain — flexible agreements are an emerging instrument, so in
2024 there is no stock of them to inherit.

**What it does, measured at 2045:**

| flexibilityShare | 0      | 0.1    | 0.2    | 0.3    | 0.5    |
| ---------------- | ------ | ------ | ------ | ------ | ------ |
| EU-27 DC (TWh)   | 217.95 | 217.97 | 217.99 | 218.02 | 218.06 |
| Ireland (TWh)    | 8.56   | 8.60   | 8.64   | 8.68   | 8.75   |
| Luxembourg peak% | 16.46  | 15.06  | 13.61  | 12.12  | 8.96   |

**The volume effect is a ramp effect, and it fades.** EU deltas against the same run without the
channel: **0.000 through 2030, +0.132 in 2033, +0.181 in 2036, +0.117 in 2040, +0.106 in 2045.**
Zero for the first eight years because the flexible route still costs 5 + 3 years from an empty
chain; a peak mid-horizon; then decay, because in the long run a faster chain delivers the same
volume, only earlier. A lever that looks like it creates capacity is actually shifting when
capacity arrives, and saying so is the point.

**What it deliberately does not do.** The connection ceiling is applied _before_ the inflow is
split, so accepting curtailment buys time and nothing else. ENTSO-E also argues the other channel —
that flexible connections let the system avoid "premature or oversized network reinforcements",
i.e. more load fits the same network. That is the connection ceiling, which is what #30 B5/B6/B8
are about, and it barely binds here anyway: the EU-wide queue is 0.007 GW and does not move with
this lever (residual 1e-4, from load redistributing between countries). Two mechanisms in one lever
would have made neither checkable.

**A correction to our own record.** The Luxembourg series in `levers.test.ts` read
18.37 / 16.84 / 15.26 / 13.61%. It measures 18.35 / 16.83 / 15.24 / 13.59 — and did so before this
change too, verified against the pre-#42 code. Those figures were measured after B1 and never
re-measured after A4 changed the volumes underneath them. They sat in a code comment, which is the
one place the documentation-drift guard does not reach.

### Europe's share of the buildout was an assertion, not a lever (issue #41)

The model captured 8.5% of global data centre demand additions before 2030 (IEA) and 6.5% after
(Ember) — **a 24% decline, asserted with no way for a user to question it**, while the sensitivity
analysis ranked this parameter among the largest drivers of the entire 2045 corridor. There were
levers for global growth, efficiency, permitting, siting, flexibility and price. There was none for
how much of the world's buildout lands in Europe at all.

Same defect class as B8 one level up: a policy quantity presented as a natural constant.

`capturePost2030` is now a lever, bounded by the **published uncertainty range** for the parameter
(0.045–0.09) rather than a range invented for the slider. Measured at 2045:

| Post-2030 share | 4.5%  | 5.5%  | 6.5% (default) | 7.5%  | 8.5%  | 9.0%  |
| --------------- | ----- | ----- | -------------- | ----- | ----- | ----- |
| EU-27 DC (TWh)  | 185.4 | 201.7 | **218.0**      | 234.1 | 250.2 | 258.3 |
| Share of demand | 5.74% | 6.22% | **6.68%**      | 7.14% | 7.60% | 7.82% |
| Flags           | —     | LU    | LU             | LU    | LU    | LU    |

**A 72.9 TWh span** — a third of the central result, and exactly the swing B3 measured for this
parameter. 2030 is untouched at 111.1 TWh in every case: only the post-2030 leg is the lever's,
because the near-term buildout is largely committed and the contested claim is the decline.

**This is the only lever that changes how much load Europe ends up with.** Siting, permitting
reform, flexibility and transmission all redistribute — the European volume is capture share ×
global demand, so nothing on the supply or connection side can add to it. Three separate
measurements found that independently (`ntcUtilization`, UHV-scale transmission, flexible
connection agreements) before it was stated as one property.

**The counter-evidence is in a source we already carry.** ENTSO-E §1.1 notes the **EU Cloud and AI
Development Act** aims to _"triple EU data centre capacity over the next five to seven years"_ — an
explicit European target pulling against a modelled decline. Both can hold at once if the global
denominator grows faster; the point is that the model asserted the decline without ever showing the
tension. The lever's note now does.

**`null` means "follow the data bundle", and it is the default — not a copy of 0.065.** Wired as a
plain number, the lever replaced the parameter Monte Carlo perturbs, and `euPost2030`'s tornado
swing **collapsed from 72.9 TWh to exactly 0.00** while every headline figure stayed put: the
corridor silently lost its third-largest dimension. The documentation-drift guard caught it through
changed Monte Carlo flag frequencies, which is the only place it surfaced. A regression test now
fails on precisely that mistake. Setting the lever deliberately does fix the parameter, so that
dimension of the corridor closes — the user has asserted a value, and it is no longer uncertain.

### `peakFactor` was borrowed from an interconnection dataset (issue #39)

The denominator of the criterion that decides the entire flag list was sourced to
`ember2026interconnection` — a dataset of interconnection capacity, which is not a load statistic —
with Great Britain an outright `expert-guess`, and a single 2024 value carried to 2045.

It is now derived from **ENTSO-E's published hourly load series** (Monthly Hourly Load Values,
2019–2025), free and without the API token this work was previously thought to need. Numerator and
denominator come from the same series, so no cross-source definition mismatch is introduced.
`scripts/derive-peak-factors.mjs` reproduces every number.

**The annual maximum turned out to be unusable.** Denmark 2020 peaks at 9,618 MW against a
second-highest hour of 5,811 — a 65% jump no load curve makes. The same contamination appears in
DK 2024 and CH 2025. Taking the maximum would have written those single-hour errors straight into
the parameter; the peak is therefore the 99.9th percentile of hourly load, which moves DK 2020 from
2.477 to 1.427 and CH 2025 from 2.226 to 1.457, both back in line with neighbouring years. The
published value is the median across usable years, so no single bad year — 2020 included, with its
COVID load shape — decides a country's number.

**The old values were systematically too high.** 24 of 29 fell, the largest being Slovenia
(1.99 → 1.47), the Netherlands (1.86 → 1.43), Croatia (1.86 → 1.48) and Denmark (1.83 → 1.45).
Luxembourg went the other way, 1.24 → 1.42, which is why its peak share drops.

**What moved, in published figures, before the trend was applied:**

|                            | before             | after                 |
| -------------------------- | ------------------ | --------------------- |
| Luxembourg peak share 2045 | 18.35%             | **16.46%**            |
| Ireland peak share 2045    | 11.09%             | **12.47%**            |
| Boom flag list             | EE, LV, LU         | **LT, EE, LV, LU**    |
| Flexibility to clear LU    | 30%                | **20%**               |
| Capped siting              | leaves LU at 15.4% | **clears every flag** |
| Ireland in Monte Carlo     | no sampled run     | **2.0% of runs**      |

Two of those reverse corrections this project published earlier. _"Only the cap clears all flags"_
was called false after B1; on measured peak factors it is true again. _"Clearing Luxembourg takes
30% enrolment"_ was published with #42 and is now 20% again. Neither claim was wrong when measured —
both rested on a parameter that had never been measured at all, and that is the finding.

**The trend answers the second half of the question, and it has now been applied.** The
peak-to-average ratio is **rising in 33 of 38 countries**, median **+0.0115 per year** across
2019–2025. Over the 21 years to 2045 that is about +0.24 — larger than the entire correction just
applied. Holding `peakFactor` constant to 2045 was **not** defensible, and the direction was
known, so `stressAdequacy.ts` now extrapolates each country's measured trend linearly from 2024
(`peakFactorAt`, floored at 1 — a physical bound, peak cannot be below average). Malta, with no
trend to measure, keeps a flat `expert-guess` peakFactor throughout.

This is a genuine model change, not a parameter update, and it was flagged as needing a decision
before it landed: the trend captures the electrification side of two opposing real effects (rising
baseline peak) without the data-centre-flattening side (a growing near-flat load lowering system
peakiness) to net it against, because the latter has no published measurement. Applying it moves
every figure in the table above a second time:

|                            | measured, flat (above) | trend applied (this PR)    |
| -------------------------- | ---------------------- | -------------------------- |
| Luxembourg peak share 2045 | 16.46%                 | **14.51%**                 |
| Ireland peak share 2045    | 12.47%                 | **14.19%**                 |
| Central 2045 flag list     | LU                     | **(none)**                 |
| Boom flag list             | LT, EE, LV, LU         | **EE, LV, LU**             |
| Capped siting              | clears every flag      | **still nothing to clear** |
| Ireland in Monte Carlo     | 2.0% of runs           | **16.5% of runs**          |
| Luxembourg in Monte Carlo  | 68.5% of runs          | **46.5% of runs**          |

The direction is exactly what the "opposing pull" warning predicted: a rising baseline peak
dilutes the DC share of peak everywhere, so flags clear rather than appear. Applied alone, it is
enough to erase the model's only central-run flag entirely — not because grid stress went away,
but because this correction only ever pointed one way. The boom scenario still flags three
countries, and Ireland — never flagged, but always the closer call — moves markedly closer to the
line in both the deterministic run and under sampled uncertainty. Both directions of "the flag
list changed and nothing about actual grid stress did" are now on the record for this parameter.

**Malta has no value.** ENTSO-E publishes no load series for it, so `MT.peakFactor` stays
`expert-guess` and is now the only country in the bundle without a measured one. Great Britain has
only three usable years after Brexit, against seven for most countries, so its 1.559 is the least
certain of the derived values.

### Two load factors share a value, not a meaning (issue #31, C3)

`connectionLoadFactor = 0.85` and `firmLoadShare = 0.85` are identical numbers with unrelated
provenance — `expert-guess` and `noland2024baseload` respectively — and they answer different
questions:

- **`firmLoadShare`** is the share of a data centre's _average_ draw that counts as always-on for
  the peak-flag criterion. It is **multiplied** in: `dcFirmGw = mean × firmLoadShare` (0.85×
  mean). This is what `dcShareOfPeak` compares against baseline peak (#30, B1).
- **`connectionLoadFactor`** is how much headroom a country contracts above its own average draw
  when requesting a grid connection. It is **divided** in:
  `connectionGwForEnergy = mean / connectionLoadFactor` (1.18× mean, in `engine.ts`'s pipeline
  inflow). A classic power-systems load factor — mean over peak — applied to the connection
  request, not to the peak criterion.

One is multiplied, the other divided, from the same starting value, for two quantities that are
never compared to each other in the model. The result is a **1.38× gap** (1.18 ÷ 0.85) between
`connectionGwForEnergy` and `dcFirmGw` for the same energy figure — explainable once the two
concepts are separated, opaque as long as they share a number by coincidence.

**No model output changes.** This was a naming and disclosure gap, not a calculation error:
`connectionLoadFactor` was invisible in the assumptions drawer entirely, even though it drives the
connection queue shown on screen — a gap on its own against §6 ("every on-screen number must be
traceable to an assumptions drawer"). Both parameters are now shown together in the drawer, in
both locales, with labels naming which one belongs to which quantity.

## Known simplifications (honest-limits, §7)

- **Europe's data centre volume is exogenous.** It is capture share × global demand, so every
  supply-side and connection-side intervention in this model can only move load between countries,
  never change how much Europe gets. Measured three times independently before it was stated once:
  tripling `ntcUtilization` moves nothing but Poland's stress index; UHV-scale transmission shifts
  load rather than removing it; flexible connection agreements shift +0.1 TWh at EU level while
  moving Denmark 15%. The one lever that changes the European total is the capture share itself
  (#41). Anyone reading a supply-side result as "Europe gets more data centres" is reading it
  wrong.
- Annual energy balances only. No load flow, no intra-hour or representative-day dispatch, no
  market clearing, no prices formed inside the model.
- Country-level resolution. The 14 hub markers are display metadata only and feed nothing
  (decided, issue #2).
- Great Britain is absent from the Ember interconnection dataset, so its six borders are estimates
  held flat across the horizon while every other border follows sourced anchors.
- No DC capacity retirement. The efficiency lever applies to new additions' energy only, which is
  why efficiency bends the curve rather than breaking it.
- Behind-the-meter generation is not modelled at all (deferred to v2, issue #3), so on-site gas for
  data centers is invisible to the emissions proxy.
- Import capability is a flat share of nameplate NTC, identical in every hour and every direction
  of stress.
- The renewables siting tilt uses generation mix, not carbon intensity.
- **The model deconcentrates; the real market does not (issue #31, C6).** EU-27 HHI of data
  centre load falls from **0.115 (2024) to 0.076 (2045)**, measured on the default run and
  unchanged by every intervening correction (#30, #39, #41, #42) — a mechanical consequence of
  `stock^0.7` in the siting-gravity function being sub-proportional: doubling a hub's existing
  stock less than doubles its pull on new load, so small markets gain share every year. Malta
  grows in **every single year** of the horizon (0.03 → 0.64 TWh, ×21), which is the allocation
  formula's property, not a claim about Malta. Real markets concentrate around specific hubs
  through lumpy individual siting decisions and the formation of new clusters — neither of which
  a continuous allocation function can represent. The map's smallest-country entries should be
  read as "the model has nowhere else obvious to put this load," not as a projection.
- Congestion cost is a proxy: the €4.3 bn EU 2024 baseline scaled by the demand-weighted stress
  index **relative to a fixed reference — the default 2024 European system**. It is an index, not
  a cost model. The default run therefore returns exactly €4.3 bn in 2024; a run with different
  parameters does not, which is the point.
- No feedback from new load onto prices, and none from stress onto siting beyond the explicit
  levers.
- `peakFactor` now moves (issue #39), but only one of two real effects that push it in opposite
  directions is modelled: electrification of heat and transport raises the baseline peak
  (measured, applied); a growing share of near-flat data centre load lowers the system's overall
  peakiness (real, but not sourced, so not modelled). Applying the measured half alone is a
  one-sided correction, and it is strong enough on its own to clear the model's only central-run
  2045 flag — a result to read as "this correction only pushes one way," not as good news about
  grid stress.
- `pipelineTightness` collapses permitting throughput, construction capacity and skilled labour
  into a single number per country. That the third of those is a constraint at all is invisible
  here.
- **Nothing outside Europe is represented on the supply side.** Non-European regions enter only as
  exogenous demand benchmarks (§4.2), so the model's central result — that grid connection binds
  before generation does — has no international reference point and can read as a law of nature
  rather than a policy outcome. [`kontrast-china.md`](kontrast-china.md) sets one alongside it as
  an outlook; nothing in that document enters the model.
