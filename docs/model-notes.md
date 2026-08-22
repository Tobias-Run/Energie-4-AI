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

Enforced in `packages/sim-core/test/calibration.test.ts`, ±10% unless noted. Default-run values:

| Anchor                      | Target  | Model      | What it tests              |
| --------------------------- | ------- | ---------- | -------------------------- |
| Global DC demand 2030       | 945 TWh | 945 TWh    | nothing — an identity      |
| EU-27 DC increase 2024→2030 | +45 TWh | +43.93 TWh | almost nothing — see below |
| EU-27 DC growth 2025→2030   | ≥ +50%  | +53.0%     | little — same curve        |
| DC share of EU demand 2030  | 4.5%    | 4.18%      | the denominator            |
| DC share of EU demand 2035  | 5.7%    | 5.32%      | the denominator            |

**Read this gate as regression protection, not as validation.** Three of the five anchors are
arithmetic identities of the model's own construction: `k` in the logistic is solved so the curve
passes through 945 at 2030, and the EU capture share was set to the +45 TWh anchor. Only the two
share anchors can fail, and both sit at the lean edge of tolerance. The base year of the model's
own anchor series — 3% → 4.5% → 5.7% — is not checked at all; the model starts 2024 at 2.61%.
Tracked in issue #25.

The two share anchors and the volume anchors also come from sources that disagree with each other:
the published range for Europe's 2030 DC demand is 109 TWh (IEA) to 168 TWh (Ember/ICIS), and the
share anchor comes from the same publication as the volume level the model misses by 20%. The gate
passes both only because ±10% is wide enough to cover the contradiction. Tracked in issue #26.

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
