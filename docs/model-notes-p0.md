# Model Notes — P0 Prototype

Status: P0 (model prototype). Audience: external energy-system reviewers (quality gate, mission document §7).

## Structure (mission document §5)

The core (`packages/sim-core`) simulates annually from the data base year **2024** through **2045**
(the product UI reports 2026+). Modules, executed per year:

1. **Compute demand** — global DC electricity demand follows a logistic curve through the two IEA
   anchors (415 TWh in 2024, 945 TWh in 2030), saturating at an expert-guess ceiling of 3,000 TWh.
   The EU-27 captures a share of global _additions_ (8.5% pre-2030 per IEA, declining to 6.5%
   after 2030 per the Ember/ICIS trajectory); GB/NO/CH have separate small capture shares.
   Additions are allocated across countries by a gravity weight (existing stock^0.7) tilted by
   relative electricity price.
2. **Electricity demand** — DC energy plus exogenous TYNDP-style baseline growth per country;
   IT-load stock is derived from energy via PUE (1.4 declining ~0.8%/yr toward a 1.15 floor)
   and utilization (0.65).
3. **Supply & grid** — per-country low-carbon and legacy-firm generation trajectories (linear,
   NECP-flavored); static NTC network for import capability; grid connection for new DC load is
   constrained by a three-stage delay chain (announced → permitted → built) with permitting
   duration 9 years (5 with the permitting-reform lever). Unserved connection demand partially
   relocates to countries with spare capacity ("Dublin freeze spreads" mechanism), the rest queues
   (stranded-asset risk proxy).
4. **Stress & adequacy** — gas dispatches as residual; stress index = demand divided by total
   resources (domestic plus import capability); peak proxy via country peak factors; DC firm share
   (85%, inference) counts toward peak. Congestion cost proxy scales the €4.3 bn EU 2024 baseline
   with the demand-weighted stress index. Emissions from gas (0.37 Mt/TWh) and legacy firm
   generation (0.85 Mt/TWh).

## Calibration (validation gate V1)

Enforced in `test/calibration.test.ts` (±10% unless noted): global 945 TWh (2030); EU-27 +45 TWh
(2024→2030); EU-27 growth 2025→2030 ≥ +50%; DC share of EU demand 4.5% (2030) and 5.7% (2035).
All pass under default levers.

## Known simplifications (honest-limits, §7)

- Annual energy balances only; no load flow, no intra-hour dispatch, no representative-day
  dispatch yet (planned before P1 stress indicators are surfaced in the UI).
- Country-level resolution; hub regions are metadata, not sub-national nodes (open decision §11).
- Most per-country parameters are `expert-guess` approximations; only EU-level aggregates are
  anchored. Replacing them with a sourced per-country dataset is a P2 task.
- NTC matrix is static and symmetric; no grid expansion of interconnectors yet.
- No DC capacity retirement; efficiency lever applies to new additions' energy only.
- The seeded RNG is wired but unused until Monte Carlo mode (P2); the default run is
  deterministic by construction.
