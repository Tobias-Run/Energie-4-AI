# Energie-4-AI

> **GridSim — interactive browser simulator for AI data center expansion vs. European power supply, 2026–2045.**

### ▶ [**Open the tool**](https://tobias-run.github.io/Energie-4-AI/) · [Tool öffnen](https://tobias-run.github.io/Energie-4-AI/?lang=de)

Runs entirely in your browser — no sign-up, no backend, nothing sent anywhere. A full 20-year run takes about 6 ms. **The calibration gate is currently red** ([why](#calibration-gate-v1--status)), and the tool says so on screen rather than in the footnotes.

---

[![CI](https://github.com/Tobias-Run/Energie-4-AI/actions/workflows/ci.yml/badge.svg)](https://github.com/Tobias-Run/Energie-4-AI/actions/workflows/ci.yml)
![Status](https://img.shields.io/badge/status-P1_interactive_MVP-blue)
![Calibration](<https://img.shields.io/badge/calibration_gate_V1-failing_(2_of_8_anchors_missed)-red>)
![Simulation](https://img.shields.io/badge/simulation-client--side_TypeScript-blue)
![Scope](https://img.shields.io/badge/scope-EU--27_%2B_UK_%2B_NO_%2B_CH-green)
![License](https://img.shields.io/badge/license-MIT-green)

An AI data center is built in **12–24 months**. The grid infrastructure to feed it takes **up to a decade**. Every siting, flexibility, and generation decision made today is a bet on how that gap closes.

**Energie-4-AI** makes those bets explorable: an interactive, fully client-side simulation of how AI compute growth and European electricity infrastructure co-evolve over a 20-year horizon — grounded in the same scenario logic used by European system planners (ENTSO-E TYNDP, IEA, Ember).

_🇩🇪 Energie-4-AI ist ein interaktives Browser-Tool, das den Ausbau von KI-Rechenzentren und der europäischen Stromversorgung 2026–2045 als explorierbare Simulation erfahrbar macht. Launch-Sprachen: Englisch und Deutsch._

---

## What it does

- 🗺️ **Interactive Europe map** with a 2026–2045 time slider — regions colored by grid stress, data center load share, price proxy, or emissions
- 🎛️ **Scenario levers** — compute growth, efficiency gains, siting policy, flexible connection agreements, grid buildout speed (permitting reform), price sensitivity, and Europe's share of the global buildout; every lever with source-backed defaults and plausible ranges
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
- **Calibration gate:** the default run is measured against published anchors (IEA, ENTSO-E, ICIS/Ember) at ±10% — **currently failing on 2 of 8 independent anchors, see below**
- **Performance:** full 20-year default run currently ~6 ms (budget < 100 ms) · Monte Carlo (200 runs, P2) < 5 s · initial load < 3 s

**Honest limits:** scenarios are exploration devices, not predictions. Model-class limitations (no load flow, annual resolution, corridor not forecast) are displayed persistently in the UI — not buried in an about page.

## Calibration gate V1 — status

**FAILING — 2 of 8 independent anchors missed.** Computed by `packages/sim-core/src/calibration.ts`,
enforced by `packages/sim-core/test/calibration.test.ts`.

This gate read "passing" for months. It was not measuring the model. An external review
([#25](https://github.com/Tobias-Run/Energie-4-AI/issues/25),
[#26](https://github.com/Tobias-Run/Energie-4-AI/issues/26)) established that three of its five
anchors were reproduced by the model's own construction, that the base year was never checked, and
that the two anchors capable of failing came from a publication whose volume estimate the model
misses by a fifth. The anchor set was rebuilt around anchors that can come out negative. The red
badge is the finding, not a defect in the build.

| Anchor                                 | Source            | Target    | Model  | Deviation  |
| -------------------------------------- | ----------------- | --------- | ------ | ---------- |
| Europe DC demand 2024 (base year)      | ENTSO-E (2026)    | 87 TWh    | 82.13  | −5.6%      |
| **DC share of EU demand 2024**         | EUDCA (2025)      | 2.0%      | 2.61%  | **+30.5%** |
| Europe DC demand 2030                  | ENTSO-E (2026)    | ≥ 134 TWh | 134.58 | +0.4%      |
| Five largest DC countries 2024         | ENTSO-E (2026)    | set       | match  | —          |
| Countries ENTSO-E names individually   | ENTSO-E (2026)    | set of 14 | match  | —          |
| DC share of EU electricity demand 2030 | ICIS/Ember (2025) | 4.5%      | 4.18%  | −7.0%      |
| DC share of EU electricity demand 2035 | ICIS/Ember (2025) | 5.7%      | 5.32%  | −6.6%      |
| **Europe DC demand 2035**              | ENTSO-E (2026)    | ≥ 199 TWh | 185.18 | **−6.9%**  |

**Two anchors moved to the contested tier below and no longer count toward this verdict** —
installed IT power for Europe and EU-27, formerly missing at −18.9% and −14.9%
([#34](https://github.com/Tobias-Run/Energie-4-AI/issues/34)). Not because the model improved: the
anchor and the model turned out to compare two different, incompatible definitions of "IT power."
Details below.

**A new anchor moved the other way** ([#40](https://github.com/Tobias-Run/Energie-4-AI/issues/40)):
EUDCA states DC load at 2% of EU electricity demand in 2023; unlike the volume figure it
accompanies, that share has a stated bottom-up basis (grid-operator input plus measured national
usage data), so it is kept independent and left to fail — which it does, at +30.5%.

Three further anchors are reproduced by the model's own arithmetic and are kept as regression
protection only. They no longer count toward the verdict:

| Construction anchor         | Source     | Target  | Model  |
| --------------------------- | ---------- | ------- | ------ |
| Global DC demand 2030       | IEA (2025) | 945 TWh | 945.0  |
| EU-27 DC increase 2024→2030 | IEA (2025) | +45 TWh | +43.93 |
| EU-27 DC growth 2025→2030   | ENTSO-E    | > +50%  | +53.0% |

`k` in the logistic is solved so the global curve passes through 945 at 2030, and the EU capture
share was set to the +45 TWh anchor.

**Published sources disagree by more than any lever in this model.** Europe's 2030 DC demand is
109 TWh (IEA), ≥134 TWh (ENTSO-E) or 168 TWh (Ember/ICIS): a 54% spread. ENTSO-E is the designated
authority; the other readings are measured and reported rather than hidden in a tolerance.

**The base year has the same conflict** ([#40](https://github.com/Tobias-Run/Energie-4-AI/issues/40)):
EUDCA's survey states ≈55.3 TWh EU DC consumption for 2023 — the model's comparable EU-27 2024
figure is 67.13, **+21.4%** over it — while ENTSO-E's 87 TWh (which the model meets at −5.6%) is
itself a synthesis folding in this same EUDCA survey alongside IEA and Accenture material, so
meeting it is not independent confirmation against either extreme. EUDCA names the disagreement
itself: its figure is "significantly lower compared to the most recent IEA estimates for about
100 TWh in 2022," and it claims grid-operator data corroborates its own reading, which the IEA
figure does not carry.

**Installed IT power, contested rather than independent** ([#34](https://github.com/Tobias-Run/Energie-4-AI/issues/34)):

| Anchor                         | Source  | Target  | Model | Deviation  |
| ------------------------------ | ------- | ------- | ----- | ---------- |
| Europe installed IT power 2024 | ENTSO-E | 12.7 GW | 21.82 | **+71.8%** |
| EU-27 installed IT power 2024  | ENTSO-E | 9.9 GW  | 17.83 | **+80.1%** |

`itUtilization` (nameplate-to-drawn-power ratio) used to be an unsourced 0.65. It is now derived
from the EU's mandatory data-centre reporting (0.316, cross-checked at 0.41 by an independent
sample) — and correcting it does not close this anchor, it reverses it, from missing by a fifth to
overshooting by three-quarters to four-fifths. The reason is definitional, not numerical:
Commission Delegated Regulation (EU) 2024/1364 defines "installed IT power demand" (the model's
concept, nameplate sum of racked equipment) and "rated IT load" (closer to ENTSO-E's figures, what
the facility's power and cooling can carry) as two different quantities. A 48% conversion factor
between them exists (EUDCA 2025), but applying it on top of the sourced `itUtilization` double-counts
the same correction and pushes the deviation past +250%. No re-scoping produced a plausible match —
that is the finding. Details in [`docs/model-notes.md`](docs/model-notes.md).

## Development

```bash
npm install
npm test          # sim-core unit tests incl. calibration gate V1
npm run dev       # interactive app: Europe map, time slider, levers, story mode
npm run lint && npm run format:check && npm run typecheck
npm run build     # production bundle in apps/web/dist
```

Pushes to `main` publish the built app to GitHub Pages via `.github/workflows/deploy.yml`.
The bundle is served from a sub-path there, so the workflow passes `BASE_PATH`; locally the
base stays `/` and nothing has to be configured.

## Roadmap

| Phase                    | Duration | Deliverable                                                                | Status                                                                                                                               |
| ------------------------ | -------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **P0 — Model prototype** | 6 weeks  | TypeScript simulation core, measured against calibration gate V1           | ✅ done                                                                                                                              |
| **P1 — Interactive MVP** | 8 weeks  | Map + time slider + 3 levers + 1 story scenario                            | ✅ MVP in repo                                                                                                                       |
| **P2 — Full lever set**  | 8 weeks  | All levers, Monte Carlo, compare mode, permalinks, external modeler review | 🟡 built; external review outstanding ([#7](https://github.com/Tobias-Run/Energie-4-AI/issues/7))                                    |
| **P3 — Public launch**   | 4 weeks  | Story mode, EN/DE, accessibility audit (WCAG 2.1 AA), open-source release  | 🟡 story mode, EN/DE and MIT release done; formal a11y audit outstanding ([#8](https://github.com/Tobias-Run/Energie-4-AI/issues/8)) |

## Repository layout

```
├── CLAUDE.md                        # Kickoff / work-sequencing instructions
├── docs/
│   ├── mission-document-gridsim.md  # Binding specification (v0.1)
│   ├── model-notes.md               # What the model does, where it is weak
│   ├── review-package.md            # Entry point for external reviewers
│   ├── fallstudien.md               # Worked case studies read off the UI (DE)
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
- 🔍 [**Reviewer package**](docs/review-package.md) — start here for an external review: what to check, and the six weaknesses we already know about
- 🧮 [**Model notes**](docs/model-notes.md) — module-by-module description of the running model, its calibration and its limits
- 🌏 [**Kontrast China**](docs/kontrast-china.md) — outlook only: China's grid buildout and its 2026 AI-and-energy action plan, as a counterfactual to Europe's connection constraint. Nothing in it enters the model (German)
- 📊 [**Fallstudien**](docs/fallstudien.md) — three worked case studies with permalinks and screenshots (German)
- ⚖️ [**Data usage & fair use statement**](docs/DISCLAIMER.md) — external data are used for scientific research and education; provenance rules and takedown contact

## Data & fair use

All external data (IEA, ENTSO-E/ENTSOG, Ember/ICIS, European Commission, peer-reviewed journals) are used as **individual cited facts for non-commercial scientific research and education**, under fair-use principles and the corresponding EU copyright exceptions. Every parameter carries a `source_id` resolving to [`docs/sources.bib`](docs/sources.bib) or is marked `expert-guess` — enforced by a unit test. Full statement (EN/DE): [docs/DISCLAIMER.md](docs/DISCLAIMER.md).

## License

Code: **MIT** — see [LICENSE](LICENSE). Chosen as the maximally permissive option; no
copyleft, no patent clause, no attribution burden beyond the copyright notice.

Data bundles in [`data/`](data/): **CC-BY-4.0**, to the extent the project holds rights
in them. The bundles are compilations of individually cited facts from third-party
publications (IEA, ENTSO-E, Ember, European Commission) plus our own `expert-guess`
estimates — this project cannot grant broader rights in the underlying figures than it
holds itself, which is why the data cannot go as permissive as the code. See
[docs/DISCLAIMER.md](docs/DISCLAIMER.md).
