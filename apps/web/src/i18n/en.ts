/**
 * English reference dictionary. Every other locale is type-checked against this shape, so a
 * missing or stale key is a build error rather than a silent fallback.
 *
 * The bulk of this file is not labels but explanation — the prose that carries the project's
 * honest-limits requirement. Those strings are the ones that must not lose precision in
 * translation; a shortened caveat is a changed caveat.
 */
export const en = {
  app: {
    title: 'Energie-4-AI',
    byline: 'GridSim — AI data center expansion vs. European power supply, 2026–2045',
    language: 'Language',
    mapMetric: 'Map metric',
    summary: 'EU-27 in {year}: DC {twh} TWh · {share}% of demand · {flags}',
    noFlags: 'no stress flags',
    runtime: 'Full 20-year run recomputes in {ms} ms, entirely in your browser.',
    limitsTitle: 'Model limits (read me):',
    limits:
      'annual energy balances on a simplified NTC network — no load flow, no intra-hour dispatch; country-level resolution (hubs are map annotations only); many country parameters are expert-guess approximations. Scenarios are exploration devices, not forecasts. Every number is source-tracked — open the assumptions drawer. External data are used as cited facts for scientific research and education (fair use) — see docs/DISCLAIMER.md.',
    skipToContent: 'Skip to main content',
  },
  levers: {
    title: 'Scenario levers',
    reset: 'Reset to central scenario',
    computeGrowth: 'Compute demand growth',
    computeGrowthNote: 'Multiplier on the IEA base-case global growth (default ×1.00).',
    efficiency: 'Extra efficiency gains',
    efficiencyNote: 'Energy-per-compute improvement on top of the base case (default 0.0%/yr).',
    permitting: 'Permitting reform ("Grids Package")',
    permittingNote: 'Grid permitting ~9 years → ~5 years (default off = today’s baseline).',
    siting: 'Siting policy',
    sitingMarket: 'Market-driven',
    sitingMarketNote: 'Additions follow existing clusters and price only.',
    sitingRenewables: 'Renewables-coupled',
    sitingRenewablesNote:
      'Additionally tilted toward systems with a high renewables share. Reads the generation mix, not carbon intensity — nuclear-heavy France loses ground despite being low-carbon.',
    sitingCapped: 'Capped hubs',
    sitingCappedNote:
      'A country stops accepting new connections once DC load passes {cap}% of its national demand — the Dublin and Amsterdam moratoria, not an EU quota. Existing load stays.',
    flexibility: 'Flexible connection agreements',
    flexibilityNote:
      'Share of DC load that accepts curtailment. One commitment, two consequences: it stops counting toward peak, and it reaches the grid {saved} years sooner, because accepting curtailment is what buys the earlier connection. The model assumes it curtails exactly when needed — ENTSO-E reports 40–70 h/yr in the case it cites, so this is the optimistic reading, and why the range stops at 50%.',
    capture: "Europe's share of global buildout after 2030",
    captureFollowsData: 'follows the data',
    captureNote:
      'The model assumes Europe captures {pre}% of global DC growth before 2030 (IEA) and only {post}% after (Ember) — a 24% decline it used to assert with no way to question it, while ranking among the largest drivers of the whole 2045 corridor. The decline may well be right; it is a projection, not a constant. ENTSO-E notes the EU Cloud and AI Development Act aims to triple EU data centre capacity in five to seven years, which pulls the other way. Range is the published uncertainty band. Left alone, this follows the data bundle and stays uncertain in Monte Carlo mode; move it and you have asserted a value.',
    priceSensitivity: 'Price sensitivity of siting',
    priceSensitivityNote:
      'How strongly electricity price steers where load lands. At ×0 siting ignores price and follows existing clusters; high values pull load to cheap systems (Nordics, Iberia).',
  },
  metrics: {
    dcShareOfDemand: 'DC share of electricity demand',
    dcShareOfDemandNote:
      'Data center energy divided by total national demand (DC + exogenous baseline). Baseline growth follows a TYNDP-style trajectory; DC growth follows the IEA-anchored capture model.',
    dcEnergyTwh: 'DC electricity demand',
    dcEnergyTwhNote:
      'Annual data center electricity consumption. New capacity is allocated by existing-stock gravity and relative electricity price, constrained by grid-connection pipelines.',
    stressIndex: 'Grid stress index',
    stressIndexNote:
      'Annual demand divided by total available resources (renewables + nuclear + legacy firm + gas capacity + NTC import capability). Import capability is direction-aware and grows along sourced 2024/2030/2040 anchors. A coarse adequacy proxy — no load flow, no intra-hour dispatch.',
    dcShareOfPeak: 'DC share of peak load',
    dcShareOfPeakNote:
      'Firm (inference) data center draw as a share of national peak load. This is the criterion that actually trips the late-horizon stress flags — in the central run nobody crosses it, but Luxembourg (14.5%) and Ireland (14.2%) sit closest to the line while their adequacy ratios stay comfortable. Under stronger growth assumptions this is where the flags appear. The flexibility lever acts directly on it.',
    renewablesShare: 'Renewables share of generation',
    renewablesShareNote:
      'Renewables (incl. hydro and bioenergy) divided by total domestic generation. Production-based accounting: imports are not attributed to any mix category (NTC model, no flow tracing) — check the net-import share alongside.',
    fossilShare: 'Fossil share of generation',
    fossilShareNote:
      'Gas dispatch plus legacy firm generation (coal, lignite, oil) divided by total domestic generation. Production-based; imports not attributed.',
    netImportShare: 'Net-import share of demand',
    netImportShareNote:
      'Share of national demand not covered by domestic generation. Shown alongside the generation mix because a production-based mix says little for heavy importers (e.g. Luxembourg).',
    emissionsMt: 'Power sector emissions proxy',
    emissionsMtNote:
      'Gas dispatched as residual demand × 0.37 Mt/TWh plus legacy firm generation × 0.85 Mt/TWh. These are direct-combustion factors anchored on IPCC AR5; they sit below the lifecycle medians by design, since upstream methane, fuel transport and plant construction are not tracked — so this figure is a lower bound.',
  },
  map: {
    label: 'Europe map, {metric} in {year}',
    stressFlag: 'stress flag',
    stressFlagTooltip: 'stress flag (DC share of peak or adequacy threshold)',
    notShown: '{list} simulated but not shown at this map resolution — see table view.',
    clusters: 'Data center clusters',
    clusterLocations: 'Data center cluster locations',
    markerSize: 'marker size = exchange size class',
    driverPeering: 'interconnection-driven',
    driverPower: 'power-driven',
    driverBoth: 'both',
    exchange: 'Internet exchange',
    noExchange: 'No internet exchange at this location',
    peakTraffic: 'Peak traffic {tbps} Tbit/s (as of {asOf})',
    sizeClassOnly: 'Size class {sizeClass} — no current published figure verified',
    clusterDriver: 'Cluster driver',
    driverPeeringLong: 'network interconnection',
    driverPowerLong: 'power and cooling climate',
    driverBothLong: 'interconnection and power',
    countryLevelNote: 'country-level — the model does not resolve individual hubs',
    markerLabel: '{name} data center cluster, {exchange}, {driver}',
    markerExchange: 'internet exchange {ixp}',
    markerNoExchange: 'no internet exchange',
    queue: 'queue',
    imports: 'imports',
  },
  charts: {
    demandTitle: 'EU-27 data center electricity demand (TWh)',
    clickToJump: 'Click the chart to jump to a year.',
    mixTitle: 'EU-27 generation mix (TWh, production-based)',
    mixRenewables: 'Renewables',
    mixNuclear: 'Nuclear',
    mixFossil: 'Fossil',
    mixImportsNote: 'imports not attributed (no flow tracing)',
    mixLabel: 'EU-27 generation mix by category over time',
    benchmarkTitle: 'DC demand growth benchmark (index, 2024 = 100)',
    benchmarkEu: 'EU-27 (model)',
    benchmarkUs: 'USA',
    benchmarkCn: 'China',
    benchmarkRow: 'Rest of World',
    benchmarkLabel:
      'Data center demand growth: EU-27 model output vs. published projections for USA, China, and Rest of World, indexed to 2024',
    benchmarkNote:
      'US/China/RoW: IEA base-case anchors (US corroborated by LBNL/EPRI); published projections end {horizon} — lines stop there, no extrapolation. 2035 regional split is expert-guess within the IEA global envelope.',
    corridorTitle: 'EU-27 data center demand — uncertainty corridor (TWh)',
    corridorBand: 'p10–p90 across {runs} runs',
    corridorMedian: 'sampled median',
    corridorCentral: 'central run',
    corridorLabel:
      'EU-27 data center demand uncertainty corridor, tenth to ninetieth percentile across {runs} Monte Carlo runs',
    corridorHover: '{year}: {p10}–{p90} TWh (median {p50}, central {central})',
  },
  tornado: {
    title: 'Parameter sensitivity in {year}',
    measuredOn: 'Measured on',
    label: 'Parameter sensitivity on {target} in {year}, ranked by swing',
    central: 'central: {value} {unit}',
    none: 'No parameter in the range set moves this metric.',
    note: 'Each bar spans {target} when that parameter alone is pushed to its range bounds, everything else held central — so bars are comparable but do not capture interactions. The corridor above, which samples all parameters together, does. A ? marks a parameter whose range is an expert estimate rather than a published one.',
    countNote:
      'This target counts whole regions, so its resolution is one region — bars of equal length mean "moves the count by one", not "equally important".',
    inert:
      'No effect on this metric ({count}): {list}. That is a statement about this metric, not about the parameter — switch the measure above to see where they act.',
    thresholdHeading: 'Definitional thresholds (not physical uncertainty)',
    thresholdNote:
      'These bars say the cutoff convention is unsettled, not that the value in the world is uncertain — a different kind of not-knowing, kept separate rather than blended into the band above.',
    targetDemand: 'EU-27 data center demand',
    targetFlags: 'Number of stress-flagged regions',
    targetEmissions: 'Europe power-sector emissions',
  },
  uncertainty: {
    title: 'Uncertainty',
    toggle: 'Monte Carlo mode (200 runs)',
    off: 'Replaces the single demand line with a p10–p90 corridor and ranks which parameters drive it. Takes about half a second.',
    sampled:
      'Sampled {runs} runs over {params} source-tracked parameter ranges in {ms} ms. Seed {seed} — the same seed reproduces this corridor exactly.',
    flagTitle: 'Stress flag in {year}',
    ofRuns: 'of runs',
    noFlags: 'No region flagged in any run.',
    frequencyNote:
      'A frequency, not a forecast: it says how often the flag trips across the sampled ranges, not how likely the outcome is in the world.',
  },
  compare: {
    title: 'Compare scenarios — EU-27 DC demand (TWh)',
    emptyTitle: 'Compare scenarios',
    empty: 'Pin the current lever settings to compare up to three scenarios side by side.',
    pinFirst: '+ Pin current scenario',
    pin: '+ Pin current',
    maxReached: 'Maximum of 3',
    remove: 'Remove {label}',
    label: 'Comparison of {count} pinned scenarios, EU-27 data center demand',
    colScenario: 'Scenario',
    colLevers: 'Levers',
    colDemand: 'EU DC {year}',
    colSaturated: 'Most saturated',
    colFlags: 'Flags',
    scenarioName: 'Scenario {letter}',
    centralScenario: 'central scenario',
    overlapNote:
      'These scenarios end within 1% of each other, so the lines overlap almost exactly. That is the result, not a rendering fault: siting and permitting redistribute load rather than changing how much of it Europe ends up with. The difference is in the two right-hand columns.',
    note: 'Pinned scenarios are deterministic central runs. Uncertainty corridors stay on the active scenario — three overlaid bands are unreadable, and three Monte Carlo draws would cost about two seconds on every lever move.',
    unpinned: 'Current settings ({levers}) are not pinned yet.',
  },
  share: {
    title: 'Share & export',
    copyLink: 'Copy link',
    copied: '✓ Copied',
    csv: 'Run as CSV',
    mapSvg: 'Map SVG',
    mapPng: 'Map PNG',
    note: 'The link carries the full scenario — this tool stores nothing on your device. The CSV carries the levers and data-bundle version in its header, so a downloaded table can be traced back to the run that produced it.',
  },
  story: {
    title: 'Story mode',
    intro:
      'Guided scenarios. Each sets the levers for you and ends by naming what the model cannot tell you.',
    back: '← Back',
    next: 'Next →',
    exit: 'Exit story',
    progress: '{title} — {step}/{total}',
  },
  drawer: {
    summary: 'Assumptions behind these numbers',
    sources: 'Sources:',
    footer:
      'Source IDs resolve to docs/sources.bib; expert-guess marks parameters without a published source (§8.3). External data are cited facts used for scientific research and education — full statement. Model structure: model notes.',
    calibrationTitle: 'Calibration gate V1',
    calibrationStatusFailing: 'FAILING — {missed} of {total} independent anchors missed',
    calibrationStatusPassing: 'passing — {total} of {total} independent anchors met',
    calibrationIntro:
      'The model is measured against published anchors at ±10%. Anchors it reproduces by its own construction — the global 2030 level and the EU capture share were fitted to theirs — are kept as regression protection and excluded from this verdict.',
    calibrationMissedLabel: 'Anchors the model does not reproduce',
    calibrationSpread:
      'Published estimates for Europe’s 2030 data centre demand: 109 TWh (IEA), at least 134 TWh (ENTSO-E) and 168 TWh (Ember/ICIS). This model follows ENTSO-E and produces {model} TWh. The 54% spread between sources is wider than the effect of any lever in this panel.',
    rowCapturePre: 'EU capture of global DC additions (pre-2030)',
    rowCapturePost: 'EU capture of global DC additions (post-2030)',
    rowSaturation: 'Global demand ceiling at this growth setting',
    rowPue: 'Average PUE 2024 → floor (conversion only — does not drive demand)',
    rowItUtilization:
      'Average IT utilisation (same conversion; the capacity anchor compares a different quantity — issue #34)',
    rowFirm: 'Firm share of DC load (peak-flag criterion only)',
    rowConnectionFactor:
      "Connection load factor (a country's contracted capacity, not the peak criterion)",
    rowPermitting: 'Permitting duration (baseline / reform)',
    rowFlexConnection: 'Years saved by a flexible connection agreement',
    rowNtc: 'NTC average utilization',
    rowCongestion: 'Congestion cost baseline (EU, 2024)',
    rowGas: 'Gas emission factor',
    rowMix: 'Generation mix accounting',
    rowMixValue: 'production-based; imports not attributed',
    rowBenchmark: 'US/CN/RoW benchmark anchors 2024/2030',
    rowBenchmarkValue: 'IEA base case',
    rowBenchmarkCorroboration: 'US benchmark corroboration',
    rowBenchmark2035: 'Benchmark anchors 2035 (regional split)',
    rowBenchmark2035Value: 'within IEA global envelope',
  },
  table: {
    summary: 'Table view ({year}, all countries)',
    country: 'Country',
    dcTwh: 'DC (TWh)',
    share: 'Share',
    stress: 'Stress',
    queue: 'Queue (GW)',
  },
  time: {
    year: 'Year',
    play: 'Play',
    pause: 'Pause',
    playLabel: 'Animate the years',
    sliderLabel: 'Year, {min} to {max}',
  },
};
