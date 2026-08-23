# Model Notes

Audience: external energy-system reviewers (quality gate, mission document §7, issue #7).

**Status:** post-P2. This file was previously called `model-notes-p0.md` and described the P0
prototype; by the time the P2 work landed it misdescribed the model in four material ways, so it
has been rewritten against the running code rather than patched. Every figure below is read from a
default run at data bundle **v2.2.0**. This file drifted once before and an external review caught
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
anchors (415 TWh in 2024, 945 TWh in 2030), saturating at an expert-guess ceiling of 3,000 TWh.
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
IT-load stock is derived from energy via PUE (1.4, declining 0.8%/yr toward a 1.15 floor) and
utilization (0.65).

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
  computed from 2024 peak demand ÷ average load, not guessed.

**In the central run the late-horizon flags come from the peak-share criterion, not adequacy.** In
2045 only Luxembourg trips it, at 16.94%. Ireland sits at 10.03% of peak and is not flagged — its
own connection ceiling holds it there (see "Repaired defects"). Anyone reviewing the adequacy
formula should know it is not what produces the headline result.

The adequacy criterion is close to inert, and a reviewer should know how close. It fires only on
base-year data: Poland is flagged in 2024, 2025 and 2026 at 0.919 / 0.910 / 0.903, and from 2027
onward nothing reaches the 0.9 line again — the 2045 maximum is 0.750. Every parameter feeding it
therefore scores a sensitivity of exactly zero at the 2045 tornado horizon. Tracked as B2 in
issue #30.

The flexibility lever removes enrolled load from the peak contribution entirely, on the assumption
that it curtails exactly when needed — an optimistic reading, which is why the lever stops at 50%.

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

- **Flag frequencies say more than the flags.** For 2045 the deterministic run names Luxembourg
  alone; across sampled ranges (200 runs, seed 1) Luxembourg is flagged in 69.5% of runs, Latvia in
  5.0% and Estonia in 2.5%. Ireland appears in none.
- **Every grid parameter scores zero on EU-wide DC demand.** At EU level the connection pipeline
  redistributes load rather than removing it. This is why the tornado target is selectable, and it
  is the same finding the permitting-reform and siting scenarios produce independently.

## Calibration (validation gate V1)

**Verdict: FAILING — 3 of 9 independent anchors missed.** Computed by
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
| Europe DC demand 2030                | ENTSO-E | ≥ 134 TWh | 134.58 | +0.4%      | met    |
| Five largest DC countries 2024       | ENTSO-E | set       | match  | —          | met    |
| Countries ENTSO-E names individually | ENTSO-E | set of 14 | match  | —          | met    |
| DC share of EU-27 demand 2030        | Ember   | 4.5%      | 4.18%  | −7.0%      | met    |
| DC share of EU-27 demand 2035        | Ember   | 5.7%      | 5.32%  | −6.6%      | met    |
| **Europe DC demand 2035**            | ENTSO-E | ≥ 199 TWh | 185.18 | **−6.9%**  | missed |
| **Europe installed IT power 2024**   | ENTSO-E | 12.7 GW   | 10.30  | **−18.9%** | missed |
| **EU-27 installed IT power 2024**    | ENTSO-E | 9.9 GW    | 8.42   | **−14.9%** | missed |

**What the three misses mean.**

_Installed IT power_ is the largest discrepancy in the model and the most informative. ENTSO-E
counts over 10,500 European facilities above 50 kW totalling ≈12.7 GW of IT power supply, 9.9 GW of
it in the EU-27. The model carries 10.30 and 8.42 GW. Because `dcItLoadGw` divides utilisation back
out, this anchor tests the base-year volume, the PUE trajectory and the `itUtilization` assumption
at once — and `itUtilization` (0.65) is an `expert-guess`. This is the first test that guess has
ever faced.

_The 2035 level_ is measured against ENTSO-E's **lower** bound. The same figure gives 254 TWh as its
maximum, so against ENTSO-E's upper bound the shortfall is 27%, not 7%.

_The base year is now checked at all,_ which it previously was not. The model's own anchor series
runs 3% → 4.5% → 5.7%, and the model starts 2024 at **2.61%** of EU-27 demand — 13% below the start
of the series it is calibrated against. The two base-year anchors above are what put a test under
that number for the first time; both come out negative.

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

### What this gate still does not establish

- **ENTSO-E is not independent of the IEA.** Its figures are a synthesis of IEA _Energy and AI_
  (2025), EUDCA _State of European Data Centres 2025_ and an Accenture multi-source consolidation.
  Treating both as separate anchors overstates how much independent evidence the model is held to.
- **The country distribution is tested as a set, not as an order.** ENTSO-E ranks France ahead of
  the UK, Spain ahead of Italy, and Norway seventh; the model does none of those. The set of
  fourteen matches, which is what the allocation module is held to for now.
- **Ireland is not checked against national statistics.** The single most concentrated case in the
  model has no anchor of its own.

## Data provenance

Every parameter carries a `source_id` resolving to `docs/sources.bib` or the reserved value
`expert-guess`, enforced by a unit test. Currently **59 of 105 tracked parameters are sourced (56%)**.

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

- **Ireland is no longer flagged.** Its own connection limit holds it at 19.9% of national
  demand and 10.2% of peak, below the 15% line, and it is now completely insensitive to the
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

## Known simplifications (honest-limits, §7)

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
- Congestion cost is a proxy: the €4.3 bn EU 2024 baseline scaled by the demand-weighted stress
  index. It is an index, not a cost model.
- No feedback from new load onto prices, and none from stress onto siting beyond the explicit
  levers.
- `pipelineTightness` collapses permitting throughput, construction capacity and skilled labour
  into a single number per country. That the third of those is a constraint at all is invisible
  here.
- **Nothing outside Europe is represented on the supply side.** Non-European regions enter only as
  exogenous demand benchmarks (§4.2), so the model's central result — that grid connection binds
  before generation does — has no international reference point and can read as a law of nature
  rather than a policy outcome. [`kontrast-china.md`](kontrast-china.md) sets one alongside it as
  an outlook; nothing in that document enters the model.
