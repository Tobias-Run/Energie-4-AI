#!/usr/bin/env node
/**
 * Derive `peakFactor` per country from ENTSO-E's published hourly load series (issue #39).
 *
 * `peakFactor` is peak load ÷ average load, and it is the denominator of the criterion that
 * decides the entire flag list. It used to be sourced to `ember2026interconnection` — an
 * interconnection capacity dataset, which is not a load statistic — with Great Britain an
 * outright `expert-guess`.
 *
 * Source: ENTSO-E Power Statistics, "Monthly Hourly Load Values — aggregated hourly load by
 * country". Published as CSV per year, free, no account and no API token. This replaces the
 * Transparency Platform route this issue originally required: numerator and denominator both
 * come from one series, so no cross-source definition mismatch is introduced.
 *
 * Two decisions worth knowing before reading the numbers.
 *
 * **The annual maximum is not usable.** Single-hour data errors contaminate it. Denmark 2020
 * peaks at 9,618 MW while its second-highest hour is 5,811 — a 65% jump that no load curve
 * makes. The same pattern appears in DK 2024 and CH 2025. Using the raw maximum would import
 * those errors straight into the parameter that decides the flag list, so the peak is taken as
 * the **99.9th percentile** of hourly load (about the ninth-highest hour of the year). Measured
 * on the contaminated years, that moves DK 2020 from 2.477 to 1.427 and CH 2025 from 2.226 to
 * 1.457, both back in line with their neighbouring years.
 *
 * **One year is not enough.** Coverage is patchy for some countries and 2020 is a COVID year
 * with an atypical load shape. The published value is the **median across all usable years**,
 * which is robust to a single bad year in a way a mean is not.
 *
 * Usage:  node scripts/derive-peak-factors.mjs [--out <file>] [--keep <dir>]
 *
 * Downloads roughly 280 MB of CSV to a temporary directory and deletes it again unless --keep
 * is given. Prints the derived table and, with --out, writes JSON ready to merge into
 * `data/v1/countries.json`.
 */

import { createWriteStream } from 'node:fs';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
const URL_FOR = (y) =>
  `https://www.entsoe.eu/publications/data/power-stats/${y}/monthly_hourly_load_values_${y}.csv`;

/** Below this many hours a country-year is too incomplete for a peak-to-average ratio. */
const MIN_HOURS = 7000;
/** Fewer usable years than this and no value is published for the country. */
const MIN_YEARS = 3;
/** Quantile used as "the peak" — see the note above on single-hour data errors. */
const PEAK_QUANTILE = 0.001;

const args = process.argv.slice(2);
const outPath = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
const keepDir = args.includes('--keep') ? args[args.indexOf('--keep') + 1] : null;

/** ENTSO-E ships these files with a delimiter that varies by vintage (tab in most years,
 *  semicolon in 2021 and 2022) and occasionally a comma decimal separator. */
function parseCsv(text) {
  const lines = text.split(/\r?\n/);
  const header = lines[0] ?? '';
  const delim = header.includes('\t') ? '\t' : header.includes(';') ? ';' : ',';
  const cols = header.split(delim).map((h) => h.trim());
  const iCountry = cols.indexOf('CountryCode');
  const iScaled = cols.indexOf('Value_ScaleTo100');
  const iValue = cols.indexOf('Value');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(delim);
    if (parts.length <= iCountry) continue;
    const iso = (parts[iCountry] ?? '').trim();
    if (!iso) continue;
    const raw = (parts[iScaled] ?? parts[iValue] ?? '').trim();
    const value = Number(raw.includes(',') && !raw.includes('.') ? raw.replace(',', '.') : raw);
    if (!Number.isFinite(value) || value <= 0) continue;
    rows.push([iso, value]);
  }
  return rows;
}

function quantileFromSortedDesc(sorted, q) {
  return sorted[Math.max(0, Math.floor(sorted.length * q))];
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Least-squares slope of y on x — the per-year trend in the peak factor. */
function slope(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const den = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  return den === 0 ? 0 : xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / den;
}

const dir = keepDir ?? (await mkdtemp(join(tmpdir(), 'entsoe-load-')));
const byCountry = new Map();

for (const year of YEARS) {
  const file = join(dir, `${year}.csv`);
  // Re-use an already-downloaded file when --keep points at one. These are ~40 MB each and the
  // published years never change, so re-fetching them on every run is pure waste — and it lets
  // the derivation be re-run offline to check that a committed number still reproduces.
  if (
    await stat(file)
      .then((s) => s.size > 0)
      .catch(() => false)
  ) {
    process.stderr.write(`cached  ${year} … `);
  } else {
    process.stderr.write(`fetching ${year} … `);
    const res = await fetch(URL_FOR(year));
    if (!res.ok) {
      process.stderr.write(`HTTP ${res.status}, skipped\n`);
      continue;
    }
    await pipeline(Readable.fromWeb(res.body), createWriteStream(file));
  }

  const rows = parseCsv(await readFile(file, 'utf8'));
  const perIso = new Map();
  for (const [iso, value] of rows) {
    if (!perIso.has(iso)) perIso.set(iso, []);
    perIso.get(iso).push(value);
  }
  let used = 0;
  for (const [iso, values] of perIso) {
    if (values.length < MIN_HOURS) continue;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    values.sort((a, b) => b - a);
    const peak = quantileFromSortedDesc(values, PEAK_QUANTILE);
    if (!byCountry.has(iso)) byCountry.set(iso, []);
    byCountry.get(iso).push({ year, hours: values.length, peakFactor: peak / mean });
    used++;
  }
  process.stderr.write(`${used} countries\n`);
}

if (!keepDir) await rm(dir, { recursive: true, force: true });

const derived = {};
const report = [];
for (const [iso, entries] of [...byCountry].sort()) {
  if (entries.length < MIN_YEARS) {
    report.push({ iso, note: `only ${entries.length} usable year(s) — no value published` });
    continue;
  }
  const factors = entries.map((e) => e.peakFactor);
  derived[iso] = Number(median(factors).toFixed(3));
  report.push({
    iso,
    peakFactor: derived[iso],
    years: entries.length,
    trendPerYear: Number(
      slope(
        entries.map((e) => e.year),
        factors,
      ).toFixed(4),
    ),
    series: entries.map((e) => `${e.year}:${e.peakFactor.toFixed(3)}`).join(' '),
  });
}

for (const r of report) {
  if (r.note) console.log(`${r.iso.padEnd(4)} ${r.note}`);
  else
    console.log(
      `${r.iso.padEnd(4)} ${String(r.peakFactor).padEnd(6)} trend ${r.trendPerYear >= 0 ? '+' : ''}${r.trendPerYear}/yr  ${r.years}y  ${r.series}`,
    );
}

const trends = report.filter((r) => r.trendPerYear !== undefined).map((r) => r.trendPerYear);
console.log(
  `\nmedian trend ${median(trends) >= 0 ? '+' : ''}${median(trends).toFixed(4)}/yr · ` +
    `rising in ${trends.filter((t) => t > 0).length}/${trends.length} countries`,
);

if (outPath) {
  await writeFile(outPath, JSON.stringify(derived, null, 2) + '\n');
  console.log(`\nwrote ${outPath}`);
}
