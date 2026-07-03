# Mission Document & Software Specification
## Interactive Browser Tool: AI Data Center & Power Supply Expansion Simulator for Europe ("GridSim-AI", working title)

**Version:** 0.1 (Draft) · **Date:** 2026-07-03 · **Status:** For internal review

---

## 1. Mission

Build an interactive, visually compelling browser tool that lets users simulate and explore, over a ~20-year horizon (2026–2045), how AI data center expansion and European power supply co-evolve — and where they collide.

The tool exists because the core tension of the next two decades is a timing mismatch: an AI data center is built in 12–24 months, while the grid infrastructure to feed it takes up to a decade. Every siting, flexibility, and generation decision made today is a bet on how that gap closes. GridSim-AI makes those bets explorable, comparable, and explainable — for planners, operators, policymakers, and an informed public.

**Mission statement:** *Make the Europe-wide interplay of AI compute growth and electricity infrastructure tangible — as an interactive simulation anyone can run in a browser, grounded in the same scenario logic used by European system planners.*

## 2. Problem Statement

- Data center electricity demand in Europe is projected to grow by ~70% (+45 TWh) by 2030 alone (IEA 2025), with regional concentration far exceeding national averages (Frankfurt ~42%, Dublin ~80% of local consumption).
- Grid connection — not chips, capital, or algorithms — is the binding constraint on AI infrastructure buildout (WEF 2026; Ember 2025).
- Existing planning artifacts (TYNDP scenarios, national NECPs, IEA outlooks) are static PDFs. There is no accessible, interactive way to test how alternative assumptions (compute growth, efficiency gains, siting policy, flexibility mandates, generation mix) reshape outcomes over 20 years.
- Decision-relevant uncertainty is extreme: demand projections for 2030 alone span more than a factor of 3 across published scenarios. A tool that treats uncertainty as a first-class citizen fills a real gap.

## 3. Target Users & Use Cases

| User | Primary use case |
|---|---|
| Data center developers / operators | Compare siting regions under grid, price, and policy scenarios |
| TSO/DSO & energy planners | Stress-test load growth assumptions against grid expansion timelines |
| Policy analysts / regulators | Explore effects of flexibility mandates, permitting acceleration, siting steering |
| Researchers / educators | Reproducible scenario experiments; teaching energy-system dynamics |
| Journalists / public | Guided "story mode" scenarios explaining the AI–energy nexus |

## 4. Scope

### 4.1 In scope (v1)
- **Geography:** EU-27 + UK + Norway + Switzerland, resolved at country level with special treatment of known hub regions (FLAP-D: Frankfurt, London, Amsterdam, Paris, Dublin; plus Nordics, Iberia, Milan, Copenhagen).
- **Time horizon:** 2026–2045, annual resolution for capacity/stock variables; representative-day dispatch approximation for system stress indicators.
- **Demand side:** AI data center capacity buildout (training vs. inference split, rack density trajectories, PUE/efficiency curves, utilization), plus exogenous baseline demand growth (heat pumps, EVs, industry electrification) from TYNDP scenario data.
- **Supply side:** Generation mix trajectories per country (renewables, nuclear, gas, storage), grid transfer capacities (simplified NTC-based network), grid expansion pipelines with configurable delay distributions.
- **Levers (user-controllable):** compute demand growth rate; efficiency improvement rate; siting policy (market-driven vs. renewables-coupled vs. capped hubs); flexibility participation share of DC load; behind-the-meter generation share; grid buildout speed (permitting reform on/off); PPA/price sensitivity.
- **Outputs:** per-country and Europe-wide demand curves, supply-demand adequacy indicators, congestion/stress heat map, stranded-asset risk indicator, emissions trajectory, indicative cost ranges.

### 4.2 Out of scope (v1)
- Nodal grid modeling (full load-flow); intra-hour dispatch; water usage; heat reuse economics (candidate for v2); non-European regions except as exogenous compute-demand competition parameter.

## 5. Modeling Approach

**Class:** System-dynamics / stock-flow simulation with annual steps, calibrated against published scenario corridors — deliberately *not* a cost-minimizing optimization model. Rationale: optimization models (PyPSA-Eur, TIMES-Europe) answer "what is optimal"; this tool answers "what happens if", which suits interactive exploration and runs client-side in milliseconds.

**Core structure:**
1. **Compute demand module:** AI capacity stock (GW IT load) per region; inflows driven by global compute demand share captured by Europe, modulated by relative electricity cost, grid connection lead time, and policy attractiveness per region. Training load modeled as time-shiftable; inference as firm 24/7 load (consistent with the 80–90% inference share of AI compute).
2. **Electricity demand module:** DC load = IT load × PUE trajectory × utilization; added to exogenous baseline (TYNDP National Trends+ central scenario as default, economic variants as bounds).
3. **Supply & grid module:** per-country generation capacity trajectories (default: NECP-aligned); simplified interconnection via NTC matrix; grid expansion pipeline as a delay chain (announced → permitted → built) with user-adjustable permitting duration (baseline ~8–10 years, "Grids Package passed" scenario ~4–6 years).
4. **Stress & adequacy module:** annual energy balance plus peak-stress proxy per region; flags regions where DC load share of peak exceeds configurable thresholds; congestion cost proxy scaled from EU 2024 baseline (€4.3 bn).
5. **Uncertainty:** every scenario is a named parameter set; the UI always renders a corridor (central + high/low variants), mirroring the TYNDP 2026 framework (one central scenario, two economic stress variants). Monte Carlo mode (n≈200 runs, client-side) for sensitivity tornado charts.

**Calibration anchors:** IEA base case (global DC demand 415 → 945 TWh, 2024→2030; Europe +45 TWh/+70% by 2030); ENTSO-E (+>50% European DC demand 2025–2030); ICIS/Ember (3% → 4.5% of EU demand by 2030, 5.7% by 2035). The model must reproduce these corridors under default settings before release (validation gate V1).

## 6. Product & UX Specification

- **Platform:** Single-page browser app; all simulation client-side (no backend required for v1). React + TypeScript; visualization with D3/deck.gl for the map layer, lightweight charting for time series.
- **Primary view:** Interactive Europe map with a time slider (2026–2045). Regions colored by selected metric (stress, DC load share, price proxy, emissions). Play/pause animation of the 20-year run.
- **Scenario panel:** Grouped sliders/toggles for the levers in §4.1; every lever shows its source-backed default and plausible range. "Compare mode" pins up to 3 scenarios side by side.
- **Story mode:** 4–6 curated guided scenarios (e.g., "Dublin freeze spreads", "Grids Package delivers", "Efficiency wall", "Nordic gold rush") with narrative annotations.
- **Explainability:** Every output panel has an "assumptions behind this number" drawer linking to the source (see §8). No unexplained numbers on screen.
- **Export:** Scenario permalink (parameters encoded in URL), PNG/SVG chart export, CSV of run results.
- **Performance target:** Full 20-year run < 100 ms; Monte Carlo (200 runs) < 5 s on a mid-range laptop; initial load < 3 s.
- **Accessibility:** WCAG 2.1 AA; color scales safe for common color-vision deficiencies; full keyboard operability of the scenario panel.
- **Languages:** EN and DE at launch.

## 7. Architecture & Non-Functional Requirements

- **Simulation core:** Pure TypeScript module, framework-free, unit-tested against calibration anchors; deterministic given a seed (reproducibility requirement for research use).
- **Data layer:** Versioned static JSON bundles (scenario defaults, country parameters, grid pipeline data) with a documented update pipeline; data provenance recorded per parameter.
- **Licensing:** Open source (MIT or Apache-2.0); data bundles under CC-BY where source licenses permit.
- **Quality gates:** V1 calibration reproduction (§5); scenario snapshot tests; independent review of the demand module by at least one external energy-system modeler before public launch.
- **Honest-limits requirement:** The UI must display model-class limitations (no load flow, annual resolution, corridor not forecast) persistently, not buried in an about page. Scenarios are exploration devices, not predictions — the TYNDP scenario teams say the same about theirs, and they have considerably more staff.

## 8. Source Base

**Assumption disclosed:** "AAA journals" is interpreted as *top-ranked peer-reviewed journals* in energy research (there is no AAA association publishing in this field). Selection below mixes peer-reviewed anchors with the authoritative planning/agency literature the model must calibrate against.

### 8.1 Peer-reviewed (top-ranked energy journals)
1. Hörsch, J., Hofmann, F., Schlachtberger, D., Brown, T. — *PyPSA-Eur: An open optimisation model of the European transmission system.* **Energy Strategy Reviews** 22 (2018), 207–215. → Reference open model of the European grid; benchmark for our simplified network layer.
2. Luxembourg, S. L. et al. — *TIMES-Europe: An integrated energy system model for analyzing Europe's energy and climate challenges.* **Environmental Modeling & Assessment** (2024). → Integrated long-horizon European scenario modeling; methodological contrast (optimization vs. our simulation approach).
3. Nøland, J. K., Hjelmeland, M., Korpås, M. — *Will Energy-Hungry AI Create a Baseload Power Demand Boom?* **IEEE Access** 12 (2024), 110353–110360. → Peer-reviewed treatment of AI load characteristics (firmness/duty cycle) informing our training-vs-inference split.
4. Koronen, C., Åhman, M., Nilsson, L. J. — *Data centres in future European energy systems — energy efficiency, integration and policy.* **Energy Efficiency** 13 (2020). → Foundational EU-focused analysis of DC efficiency, demand response, and heat integration potentials; source for efficiency-lever bounds.
5. (2025) *Data centres as a source of flexibility for power systems.* **Energy Reports / Applied Energy family** (Elsevier, 2025). → Quantifies EU flexibility needs (24% of demand by 2030, 30% by 2050; ~2,189 TWh by 2050); anchors the flexibility-participation lever.
6. Chen, X., Wang, X., Colacelli, A., Lee, M., Xie, L. — *Electricity demand and grid impacts of AI data centers: Challenges and prospects.* (2025, preprint; journal version to be tracked). → Grid-impact taxonomy for AI loads.

### 8.2 Planning & agency literature (calibration anchors)
7. IEA — *Energy and AI* (2025) and *Overcoming energy constraints is key to delivering on Europe's data centre goals* (Nov 2025). → Base-case demand corridors (415→945 TWh global; EU +45 TWh/+70% by 2030; 10% of EU demand growth to 2030); FLAP-D hub dynamics.
8. ENTSO-E / ENTSOG — *TYNDP 2026 Scenarios Report* (2026). → Central Scenario (National Trends+) + two economic variants; our default baseline and the structural template for our scenario UI.
9. ENTSO-E — *Data Centres and the Power System* (April 2026). → European DC demand +>50% 2025–2030; country-level deployment heterogeneity.
10. Ember — *Grids for data centres: ambitious grid planning can win Europe's AI race* (2025). → ICIS demand shares (4.5% by 2030, 5.7% by 2035); grid-planning policy levers.
11. European Commission — *European Grids Package* (Dec 2025) incl. TEN-E revision, permitting deadlines, Grid Connection Guidance. → Parameterizes the "permitting reform" lever.
12. Interface (Nowicka, M.) — European AI compute & energy study (2026). → Stranded-asset risk framing; AI clusters as critical energy infrastructure.

### 8.3 Source-tracking rule
Every model parameter carries a `source_id` referencing this list (or its successors). Parameters without a source are marked `expert-guess` in the UI. Reference list is maintained in the repo (`/docs/sources.bib`) and reviewed quarterly — this field moves fast enough that a 2025 number can be quaint by 2027.

## 9. Roadmap

| Phase | Duration | Deliverable |
|---|---|---|
| P0 — Model prototype | 6 weeks | TypeScript simulation core passing calibration gate V1 |
| P1 — Interactive MVP | 8 weeks | Map + time slider + 3 levers + 1 story scenario, internal release |
| P2 — Full lever set & compare mode | 8 weeks | All §4.1 levers, Monte Carlo, permalinks; external modeler review |
| P3 — Public launch | 4 weeks | Story mode complete, EN/DE, accessibility audit, open-source release |

## 10. Success Criteria

1. Default run reproduces all §5 calibration corridors within ±10%.
2. A first-time user reaches a meaningful scenario comparison within 5 minutes without documentation.
3. At least one external energy-system researcher signs off on the demand module.
4. Tool cited or used in at least one policy or planning discussion within 12 months of launch.

## 11. Open Decisions

- Country-level vs. sub-national resolution for DE/FR (hub granularity vs. data availability).
- Whether to include a gas-bridge/behind-the-meter emissions penalty toggle in v1 or defer to v2.
- Hosting/branding and whether an EU funding track (e.g., Horizon Europe digital-energy calls) changes licensing or partner requirements.
