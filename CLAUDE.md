# CLAUDE.md — GridSim-AI Kickoff (Handover from Mission Document)

Read `docs/mission-document-gridsim.md` in full before writing any code. It is the binding spec; this file only sequences the work.

## Project

Interactive browser tool simulating AI data center expansion vs. European power supply, 2026–2045. Client-side system-dynamics simulation, React + TypeScript, map + time slider UI. Details: §4–§7 of the mission document.

## Phase P0 — start here (do not skip ahead to UI)

1. Scaffold: Vite + React + TypeScript, Vitest, ESLint/Prettier. Simulation core as a **framework-free** pure TS package (`/packages/sim-core`), deterministic given a seed.
2. Implement modules in order (spec §5): compute demand → electricity demand → supply & grid (NTC matrix, delay-chain pipeline) → stress & adequacy.
3. Data layer: versioned static JSON bundles in `/data`, every parameter with `source_id` referencing `/docs/sources.bib` (spec §8.3). Missing source → `"source_id": "expert-guess"`.
4. **Calibration gate V1 (blocking):** unit tests asserting default-run reproduction of the corridors in spec §5 (IEA, ENTSO-E, ICIS/Ember anchors) within ±10%. No UI work until these pass.

## Phase P1 (only after V1 passes)

Europe map (deck.gl or D3) + time slider + 3 levers (compute growth, efficiency rate, permitting reform toggle) + 1 story scenario. Performance budget: full 20-year run < 100 ms.

## Hard constraints

- No backend in v1. No localStorage/sessionStorage.
- Every on-screen number must be traceable to an assumptions drawer (spec §6).
- Model-class limitations visible in the UI, not hidden (spec §7, honest-limits requirement).
- License: MIT or Apache-2.0 (flag before committing to one — open decision §11).

## Open decisions — ask, don't assume (spec §11)

Sub-national resolution DE/FR; gas-bridge emissions toggle in v1; funding-track implications for licensing.
