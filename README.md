# Energie-4-AI

> **GridSim — interactive browser simulator for AI data center expansion vs. European power supply, 2026–2045.**

[![CI](https://github.com/Tobias-Run/Energie-4-AI/actions/workflows/ci.yml/badge.svg)](https://github.com/Tobias-Run/Energie-4-AI/actions/workflows/ci.yml)
![Status](https://img.shields.io/badge/status-P1_interactive_MVP-blue)
![Calibration](<https://img.shields.io/badge/calibration_gate_V1-passing_(22_tests)-brightgreen>)
![Simulation](https://img.shields.io/badge/simulation-client--side_TypeScript-blue)
![Scope](https://img.shields.io/badge/scope-EU--27_%2B_UK_%2B_NO_%2B_CH-green)
![License](<https://img.shields.io/badge/license-TBD_(MIT_or_Apache--2.0)-lightgrey>)

An AI data center is built in **12–24 months**. The grid infrastructure to feed it takes **up to a decade**. Every siting, flexibility, and generation decision made today is a bet on how that gap closes.

**Energie-4-AI** makes those bets explorable: an interactive, fully client-side simulation of how AI compute growth and European electricity infrastructure co-evolve over a 20-year horizon — grounded in the same scenario logic used by European system planners (ENTSO-E TYNDP, IEA, Ember).

_🇩🇪 Energie-4-AI ist ein interaktives Browser-Tool, das den Ausbau von KI-Rechenzentren und der europäischen Stromversorgung 2026–2045 als explorierbare Simulation erfahrbar macht. Launch-Sprachen: Englisch und Deutsch._

---

## What it will do

- 🗺️ **Interactive Europe map** with a 2026–2045 time slider — regions colored by grid stress, data center load share, price proxy, or emissions
- 🎛️ **Scenario levers** — compute growth, efficiency gains, siting policy, flexibility mandates, grid buildout speed (permitting reform), and more; every lever with source-backed defaults and plausible ranges
- 📊 **Uncertainty as a first-class citizen** — every scenario renders a corridor (central + high/low), never a false point forecast; Monte Carlo mode for sensitivity analysis
- 📖 **Story mode** — curated guided scenarios (e.g. _"Dublin freeze spreads"_, _"Grids Package delivers"_) for policymakers, journalists, and the public
- 🔍 **No unexplained numbers** — every on-screen figure links to an assumptions drawer with its source; parameters without a source are visibly marked `expert-guess`

## Who it's for

| User                               | Use case                                                               |
| ---------------------------------- | ---------------------------------------------------------------------- |
| Data center developers & operators | Compare siting regions under grid, price, and policy scenarios         |
| TSOs/DSOs & energy planners        | Stress-test load growth against grid expansion timelines               |
| Policy analysts & regulators       | Explore flexibility mandates, permitting acceleration, siting steering |
| Researchers & educators            | Reproducible scenario experiments (deterministic, seeded runs)         |
| Journalists & the public           | Guided story scenarios on the AI–energy nexus                          |

## How it works

A **system-dynamics / stock-flow simulation** with annual steps — deliberately _not_ a cost-minimizing optimization model. Optimization models (PyPSA-Eur, TIMES-Europe) answer _"what is optimal"_; Energie-4-AI answers _"what happens if"_, which suits interactive exploration and runs client-side in milliseconds.

- **Simulation core:** pure, framework-free TypeScript (`/packages/sim-core`), deterministic given a seed
- **UI:** React + TypeScript, D3/deck.gl map layer — no backend, everything in your browser
- **Calibration gate:** the default run must reproduce published scenario corridors (IEA, ENTSO-E, ICIS/Ember) within ±10% before any release — **currently passing** (see below)
- **Performance:** full 20-year default run currently ~6 ms (budget < 100 ms) · Monte Carlo (200 runs, P2) < 5 s · initial load < 3 s

**Honest limits:** scenarios are exploration devices, not predictions. Model-class limitations (no load flow, annual resolution, corridor not forecast) are displayed persistently in the UI — not buried in an about page.

## Calibration gate V1 — status

The default run reproduces the published corridors (enforced by `packages/sim-core/test/calibration.test.ts`):

| Anchor                                 | Source            | Target   | Model |
| -------------------------------------- | ----------------- | -------- | ----- |
| Global DC demand 2030                  | IEA (2025)        | ~945 TWh | 945.0 |
| EU-27 DC demand growth 2024→2030       | IEA (2025)        | ~+45 TWh | +45.0 |
| EU-27 DC demand growth 2025→2030       | ENTSO-E (2026)    | > +50%   | +54%  |
| DC share of EU electricity demand 2030 | ICIS/Ember (2025) | ~4.5%    | 4.4%  |
| DC share of EU electricity demand 2035 | ICIS/Ember (2025) | ~5.7%    | 5.6%  |

## Development

```bash
npm install
npm test          # sim-core unit tests incl. calibration gate V1
npm run dev       # interactive app: Europe map, time slider, levers, story mode
npm run lint && npm run format:check && npm run typecheck
```

## Roadmap

| Phase                    | Duration | Deliverable                                                                | Status         |
| ------------------------ | -------- | -------------------------------------------------------------------------- | -------------- |
| **P0 — Model prototype** | 6 weeks  | TypeScript simulation core passing calibration gate V1                     | ✅ done        |
| **P1 — Interactive MVP** | 8 weeks  | Map + time slider + 3 levers + 1 story scenario                            | ✅ MVP in repo |
| **P2 — Full lever set**  | 8 weeks  | All levers, Monte Carlo, compare mode, permalinks, external modeler review | ⏳             |
| **P3 — Public launch**   | 4 weeks  | Story mode, EN/DE, accessibility audit (WCAG 2.1 AA), open-source release  | ⏳             |

## Repository layout

```
├── CLAUDE.md                        # Kickoff / work-sequencing instructions
├── docs/
│   ├── mission-document-gridsim.md  # Binding specification (v0.1)
│   ├── sources.bib                  # Source base — every model parameter carries a source_id
│   └── DISCLAIMER.md                # Data usage & fair use statement (EN/DE)
├── packages/
│   └── sim-core/                    # Framework-free simulation core + calibration tests
├── apps/
│   └── web/                         # Interactive app: map, time slider, levers, story mode
└── data/
    └── v1/                          # Versioned JSON parameter bundles with provenance
```

## Documentation

- 📋 [**Mission Document & Software Specification**](docs/mission-document-gridsim.md) — mission, scope, modeling approach, UX spec, source base, roadmap
- 📚 [**Source base**](docs/sources.bib) — peer-reviewed anchors and planning/agency literature the model calibrates against
- ⚖️ [**Data usage & fair use statement**](docs/DISCLAIMER.md) — external data are used for scientific research and education; provenance rules and takedown contact

## Data & fair use

All external data (IEA, ENTSO-E/ENTSOG, Ember/ICIS, European Commission, peer-reviewed journals) are used as **individual cited facts for non-commercial scientific research and education**, under fair-use principles and the corresponding EU copyright exceptions. Every parameter carries a `source_id` resolving to [`docs/sources.bib`](docs/sources.bib) or is marked `expert-guess` — enforced by a unit test. Full statement (EN/DE): [docs/DISCLAIMER.md](docs/DISCLAIMER.md).

## License

Open source — **MIT or Apache-2.0** (final choice pending, see [mission document §11](docs/mission-document-gridsim.md#11-open-decisions)). Data bundles under CC-BY where source licenses permit.
