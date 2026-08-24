/**
 * Grid expansion pipeline as a delay chain: announced → permitted → built
 * (mission document §5.3). Stocks are GW of grid-connection capacity for large loads.
 */

/**
 * Sub-stages per phase. A single well-mixed stock drains exponentially: its mean residence time
 * is right, but a share of everything announced leaves almost immediately and a long tail never
 * leaves at all. Splitting each phase into `k` sub-stages in series turns that exponential lag
 * into an Erlang-k distribution — same mean, far less dispersion, and a real minimum lead time.
 *
 * Three is the largest value that stays stable at every sampled duration. The per-stage transfer
 * rate is `k / duration`, and an annual explicit step needs that at or below 1; construction runs
 * at 3 years and the reform permitting duration is sampled as low as 4, so k = 3 sits exactly at
 * the edge for construction and comfortably inside it for permitting. `stagesFor` clamps anyway,
 * so a shorter duration degrades to fewer stages rather than to a stock that drains more than it
 * holds (issue #28).
 */
const STAGES_PER_PHASE = 3;

const stagesFor = (durationYears: number) =>
  Math.max(1, Math.min(STAGES_PER_PHASE, Math.floor(durationYears)));

export interface PipelineState {
  /** Sub-stage stocks of the permitting phase, in order. */
  announced: number[];
  /** Sub-stage stocks of the construction phase, in order. */
  permitted: number[];
}

/** Total capacity waiting for a permit (GW) — the sum across sub-stages. */
export const announcedGw = (s: PipelineState) => s.announced.reduce((a, b) => a + b, 0);
/** Total capacity permitted but not yet built (GW). */
export const permittedGw = (s: PipelineState) => s.permitted.reduce((a, b) => a + b, 0);

/**
 * Advance one phase by a year and return what leaves its final sub-stage.
 *
 * Every sub-stage outflow is computed from the stocks as they stand at the START of the year,
 * before this year's inflow is added anywhere. That is what stops material from skipping stages
 * within a single step, and it is the same ordering that gave the two-phase chain its minimum
 * lead time when the step order was fixed (issue #29).
 */
function advancePhase(stages: number[], durationYears: number, inflowGw: number): number {
  const rate = stages.length / durationYears;
  const outflow = stages.map((stock) => stock * rate);
  for (let i = 0; i < stages.length; i++) {
    stages[i] += (i === 0 ? inflowGw : outflow[i - 1]!) - outflow[i]!;
  }
  return outflow[outflow.length - 1]!;
}

/**
 * Advance the pipeline by one year. Returns the connection capacity (GW) that
 * finishes construction this year.
 */
export function stepPipeline(
  state: PipelineState,
  inflowGw: number,
  permittingYears: number,
  constructionYears: number,
): number {
  const toPermitted = advancePhase(state.announced, permittingYears, inflowGw);
  return advancePhase(state.permitted, constructionYears, toPermitted);
}

/**
 * Initial pipeline stocks sized so that the chain delivers exactly the given built flow in its
 * first year and holds it (pre-existing projects at simulation start). An exact fixed point of
 * `stepPipeline`: each sub-stage holds `flow × phaseDuration / k`, so its outflow at rate
 * `k / duration` is exactly `flow`.
 *
 * Called with the **baseline** permitting duration even when the reform lever is on, deliberately
 * — see the note in `engine.ts`. The base-year stocks are a backlog accumulated under today's
 * regime; sizing them for the reform duration instead scales the starting stock down by precisely
 * the factor the drain rate rises, which makes permitting reform a mathematical no-op.
 */
export function initPipeline(
  steadyBuiltFlowGwPerYear: number,
  permittingYears: number,
  constructionYears: number,
): PipelineState {
  const fill = (duration: number) => {
    const k = stagesFor(duration);
    return Array.from({ length: k }, () => (steadyBuiltFlowGwPerYear * duration) / k);
  };
  return { announced: fill(permittingYears), permitted: fill(constructionYears) };
}
