import type { SimulationResult } from '@energie4ai/sim-core';

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // revoke on the next tick — revoking synchronously can cancel the download in some browsers
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Full run results as CSV: one row per country and year. Includes the scenario levers as a
 * comment header so a downloaded file can be traced back to the run that produced it —
 * without that, a spreadsheet of numbers has no provenance at all.
 */
export function exportRunCsv(result: SimulationResult, names: Record<string, string>): void {
  const l = result.meta.levers;
  const header = [
    `# Energie-4-AI run export`,
    `# data bundle: ${result.meta.dataVersion}`,
    `# seed: ${result.meta.seed}`,
    `# levers: computeGrowthMultiplier=${l.computeGrowthMultiplier}, extraEfficiencyRate=${l.extraEfficiencyRate}, permittingReform=${l.permittingReform}, sitingPolicy=${l.sitingPolicy}, flexibilityShare=${l.flexibilityShare}, priceSensitivity=${l.priceSensitivity}`,
    `# Scenario outputs are exploration devices, not forecasts. Parameter sources: docs/sources.bib`,
  ].join('\n');

  const cols = [
    'year',
    'iso',
    'country',
    'dcEnergyTwh',
    'baselineTwh',
    'totalDemandTwh',
    'dcShareOfDemand',
    'renewablesTwh',
    'nuclearTwh',
    'gasGenTwh',
    'otherFirmTwh',
    'generationTwh',
    'netImportShare',
    'importCapTwh',
    'peakLoadGw',
    'dcShareOfPeak',
    'stressIndex',
    'flagged',
    'emissionsMt',
    'queueGw',
  ];

  const lines: string[] = [header, cols.join(',')];
  result.years.forEach((year, i) => {
    for (const [iso, series] of Object.entries(result.countries)) {
      const r = series[i]!;
      lines.push(
        [
          year,
          iso,
          csvCell(names[iso] ?? iso),
          r.dcEnergyTwh.toFixed(4),
          r.baselineTwh.toFixed(4),
          r.totalDemandTwh.toFixed(4),
          (r.totalDemandTwh > 0 ? r.dcEnergyTwh / r.totalDemandTwh : 0).toFixed(6),
          r.renewablesTwh.toFixed(4),
          r.nuclearTwh.toFixed(4),
          r.gasGenTwh.toFixed(4),
          r.otherFirmTwh.toFixed(4),
          r.generationTwh.toFixed(4),
          r.netImportShare.toFixed(6),
          r.importCapTwh.toFixed(4),
          r.peakLoadGw.toFixed(4),
          r.dcShareOfPeak.toFixed(6),
          r.stressIndex.toFixed(6),
          r.flagged ? '1' : '0',
          r.emissionsMt.toFixed(4),
          r.queueGw.toFixed(4),
        ].join(','),
      );
    }
  });

  download(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }), 'energie4ai-run.csv');
}

/**
 * Inline the CSS custom properties an SVG references before exporting it. The charts are
 * themed entirely through `var(--token)`, which resolves against the document — detached
 * from the page those variables are undefined and every stroke renders black.
 */
function inlineThemeVars(svg: SVGSVGElement): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const computed = getComputedStyle(document.documentElement);
  const attrs = ['fill', 'stroke', 'color'] as const;

  const resolve = (el: Element) => {
    for (const attr of attrs) {
      const v = el.getAttribute(attr);
      const m = v?.match(/^var\((--[\w-]+)\)$/);
      if (m) el.setAttribute(attr, computed.getPropertyValue(m[1]!).trim() || 'currentColor');
    }
    for (const child of Array.from(el.children)) resolve(child);
  };
  resolve(clone);

  // give the exported file an explicit background; the page's own background is not inside it
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', '100%');
  bg.setAttribute('height', '100%');
  bg.setAttribute('fill', computed.getPropertyValue('--surface-1').trim() || '#ffffff');
  clone.insertBefore(bg, clone.firstChild);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  return clone;
}

export function exportSvg(svg: SVGSVGElement, filename: string): void {
  const source = new XMLSerializer().serializeToString(inlineThemeVars(svg));
  download(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }), filename);
}

/** Rasterize at 2x for a usable screenshot-quality PNG. */
export async function exportPng(svg: SVGSVGElement, filename: string, scale = 2): Promise<void> {
  const clone = inlineThemeVars(svg);
  const box = svg.viewBox.baseVal;
  const w = box.width || svg.clientWidth;
  const h = box.height || svg.clientHeight;
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));

  const source = new XMLSerializer().serializeToString(clone);
  const svgUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(source)))}`;

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('could not rasterize chart'));
    img.src = svgUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0);

  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) download(blob, filename);
      resolve();
    }, 'image/png');
  });
}
