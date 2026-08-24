/**
 * Grid expansion pipeline as a delay chain: announced → permitted → built
 * (mission document §5.3). Stocks are GW of grid-connection capacity for large loads.
 */
export interface PipelineState {
  announcedGw: number;
  permittedGw: number;
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
  // Outflows are taken from the stocks as they stand at the START of the year, before this
  // year's announcements are added. Adding first let a share of a connection announced today
  // finish construction in the same year — the opposite of the lead-time asymmetry this model
  // exists to represent — and it made initPipeline overshoot its own steady state by 37%.
  const builtFlow = state.permittedGw / constructionYears;
  const toPermitted = state.announcedGw / permittingYears;
  state.permittedGw += toPermitted - builtFlow;
  state.announcedGw += inflowGw - toPermitted;
  return builtFlow;
}

/**
 * Initial pipeline stocks sized so that the chain delivers exactly the given built flow in its
 * first year and holds it (pre-existing projects at simulation start). This is an exact fixed
 * point of stepPipeline: pass the permitting duration the run actually uses, not the baseline,
 * or the stock chain is dimensioned for one duration and drained at another.
 */
export function initPipeline(
  steadyBuiltFlowGwPerYear: number,
  permittingYears: number,
  constructionYears: number,
): PipelineState {
  return {
    announcedGw: steadyBuiltFlowGwPerYear * permittingYears,
    permittedGw: steadyBuiltFlowGwPerYear * constructionYears,
  };
}
