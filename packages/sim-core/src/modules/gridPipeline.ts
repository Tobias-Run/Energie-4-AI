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
  state.announcedGw += inflowGw;
  const toPermitted = state.announcedGw / permittingYears;
  state.announcedGw -= toPermitted;
  state.permittedGw += toPermitted;
  const builtFlow = state.permittedGw / constructionYears;
  state.permittedGw -= builtFlow;
  return builtFlow;
}

/**
 * Initial pipeline stocks sized so that, at steady state, the chain delivers roughly
 * the given built flow per year (pre-existing projects at simulation start).
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
