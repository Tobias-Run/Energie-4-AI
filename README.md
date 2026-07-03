# GridSim-AI

> **Interactive browser simulator for AI data center expansion vs. European power supply, 2026–2045.**

![Status](https://img.shields.io/badge/status-pre--alpha_(P0)-orange)
![Simulation](https://img.shields.io/badge/simulation-client--side_TypeScript-blue)
![Scope](https://img.shields.io/badge/scope-EU--27_%2B_UK_%2B_NO_%2B_CH-green)
![License](https://img.shields.io/badge/license-TBD_(MIT_or_Apache--2.0)-lightgrey)

An AI data center is built in **12–24 months**. The grid infrastructure to feed it takes **up to a decade**. Every siting, flexibility, and generation decision made today is a bet on how that gap closes.

**GridSim-AI** makes those bets explorable: an interactive, fully client-side simulation of how AI compute growth and European electricity infrastructure co-evolve over a 20-year horizon — grounded in the same scenario logic used by European system planners (ENTSO-E TYNDP, IEA, Ember).

*🇩🇪 GridSim-AI ist ein interaktives Browser-Tool, das den Ausbau von KI-Rechenzentren und der europäischen Stromversorgung 2026–2045 als explorierbare Simulation erfahrbar macht. Launch-Sprachen: Englisch und Deutsch.*

---

## What it will do

- 🗺️ **Interactive Europe map** with a 2026–2045 time slider — regions colored by grid stress, data center load share, price proxy, or emissions
- 🎛️ **Scenario levers** — compute growth, efficiency gains, siting policy, flexibility mandates, grid buildout speed (permitting reform), and more; every lever with source-backed defaults and plausible ranges
- 📊 **Uncertainty as a first-class citizen** — every scenario renders a corridor (central + high/low), never a false point forecast; Monte Carlo mode for sensitivity analysis
- 📖 **Story mode** — curated guided scenarios (e.g. *"Dublin freeze spreads"*, *"Grids Package delivers"*) for policymakers, journalists, and the public
- 🔍 **No unexplained numbers** — every on-screen figure links to an assumptions drawer with its source; parameters without a source are visibly marked `expert-guess`

## Who it's for

| User | Use case |
|---|---|
| Data center developers & operators | Compare siting regions under grid, price, and policy scenarios |
| TSOs/DSOs & energy planners | Stress-test load growth against grid expansion timelines |
| Policy analysts & regulators | Explore flexibility mandates, permitting acceleration, siting steering |
| Researchers & educators | Reproducible scenario experiments (deterministic, seeded runs) |
| Journalists & the public | Guided story scenarios on the AI–energy nexus |

## How it works

A **system-dynamics / stock-flow simulation** with annual steps — deliberately *not* a cost-minimizing optimization model. Optimization models (PyPSA-Eur, TIMES-Europe) answer *"what is optimal"*; GridSim-AI answers *"what happens if"*, which suits interactive exploration and runs client-side in milliseconds.

- **Simulation core:** pure, framework-free TypeScript (`/packages/sim-core`), deterministic given a seed
- **UI:** React + TypeScript, D3/deck.gl map layer — no backend, everything in your browser
- **Calibration gate:** the default run must reproduce published scenario corridors (IEA, ENTSO-E, ICIS/Ember) within ±10% before any release
- **Performance targets:** full 20-year run < 100 ms · Monte Carlo (200 runs) < 5 s · initial load < 3 s

**Honest limits:** scenarios are exploration devices, not predictions. Model-class limitations (no load flow, annual resolution, corridor not forecast) are displayed persistently in the UI — not buried in an about page.

## Roadmap

| Phase | Duration | Deliverable | Status |
|---|---|---|---|
| **P0 — Model prototype** | 6 weeks | TypeScript simulation core passing calibration gate V1 | 🚧 up next |
| **P1 — Interactive MVP** | 8 weeks | Map + time slider + 3 levers + 1 story scenario | ⏳ |
| **P2 — Full lever set** | 8 weeks | All levers, Monte Carlo, compare mode, permalinks, external modeler review | ⏳ |
| **P3 — Public launch** | 4 weeks | Story mode, EN/DE, accessibility audit (WCAG 2.1 AA), open-source release | ⏳ |

## Repository layout

```
├── CLAUDE.md                        # Kickoff / work-sequencing instructions
├── docs/
│   ├── mission-document-gridsim.md  # Binding specification (v0.1)
│   └── sources.bib                  # Source base — every model parameter carries a source_id
├── packages/
│   └── sim-core/                    # (P0) framework-free simulation core
└── data/                            # (P0) versioned static JSON parameter bundles
```

## Documentation

- 📋 [**Mission Document & Software Specification**](docs/mission-document-gridsim.md) — mission, scope, modeling approach, UX spec, source base, roadmap
- 📚 [**Source base**](docs/sources.bib) — peer-reviewed anchors and planning/agency literature the model calibrates against

## License

Open source — **MIT or Apache-2.0** (final choice pending, see [mission document §11](docs/mission-document-gridsim.md#11-open-decisions)). Data bundles under CC-BY where source licenses permit.
