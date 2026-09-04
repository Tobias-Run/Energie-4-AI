import { TORNADO_TARGETS, type TornadoEntry, type TornadoTarget } from '@energie4ai/sim-core';
import { fmt, useI18n } from '../i18n/index.js';

interface Props {
  entries: TornadoEntry[];
  target: TornadoTarget;
  year: number;
  onTarget: (t: TornadoTarget) => void;
}

const ROW_H = 20;
const LABEL_W = 210;
const BAR_W = 300;

/**
 * Readable names per parameter path. An explicit map rather than a camelCase splitter:
 * the heuristic mangles acronyms and digits ("Ntc Utilization", "Pue2024").
 */
const LABELS: Record<string, string> = {
  'globalCompute.demand2030Twh': 'Global DC demand 2030',
  'globalCompute.saturationTwh': 'Global demand saturation',
  'scenarioDefaults.captureShareOfGlobalAdditions.euPre2030': 'EU capture share, pre-2030',
  'scenarioDefaults.captureShareOfGlobalAdditions.euPost2030': 'EU capture share, post-2030',
  'scenarioDefaults.pue2024': 'PUE, 2024 fleet average',
  'scenarioDefaults.pueAnnualDeclineRate': 'PUE improvement rate',
  'scenarioDefaults.itUtilization': 'IT utilization',
  'scenarioDefaults.firmLoadShare': 'Firm (inference) load share',
  'scenarioDefaults.connectionLoadFactor': 'Connection load factor',
  'scenarioDefaults.spareCapacityFactor': 'Spare capacity factor',
  'scenarioDefaults.spillShare': 'Siting spillover share',
  'scenarioDefaults.allocationGravityExponent': 'Agglomeration strength',
  'scenarioDefaults.ntcUtilization': 'NTC utilization',
  'scenarioDefaults.stressFlagThreshold': 'Adequacy flag threshold',
  'scenarioDefaults.dcPeakShareFlagThreshold': 'Peak-share flag threshold',
  'scenarioDefaults.gasEmissionFactorMtPerTwh': 'Gas emission factor',
  'scenarioDefaults.otherFirmEmissionFactorMtPerTwh': 'Legacy firm emission factor',
  'scenarioDefaults.permittingYearsBaseline': 'Permitting duration, baseline',
  'scenarioDefaults.permittingYearsReform': 'Permitting duration, reform',
};

function shortLabel(path: string): string {
  return LABELS[path] ?? path.split('.').slice(-1)[0]!;
}

/** One labelled bar. Shared between the physical and the definitional-threshold sections so the
 *  two are visually distinct (a dashed axis, a heading, a note) without duplicating markup. */
function TornadoRow({
  entry: e,
  yTop,
  x,
  meta,
}: {
  entry: TornadoEntry;
  yTop: number;
  x: (v: number) => number;
  meta: { unit: string };
}) {
  const lo = Math.min(x(e.lowValue), x(e.highValue));
  const hiX = Math.max(x(e.lowValue), x(e.highValue));
  return (
    <g>
      <text
        x={LABEL_W - 6}
        y={yTop + 12}
        textAnchor="end"
        fontSize={10}
        fill="var(--text-secondary)"
      >
        {shortLabel(e.path)}
        {e.sourceId === 'expert-guess' ? ' ?' : ''}
      </text>
      <rect
        x={lo}
        y={yTop + 3}
        width={Math.max(hiX - lo, 1)}
        height={ROW_H - 8}
        fill="var(--series-1)"
        opacity={0.75}
        rx={2}
      />
      <text x={hiX + 5} y={yTop + 12} fontSize={9} fill="var(--text-muted)">
        ±{(e.swing / 2).toFixed(e.swing < 5 ? 1 : 0)} {meta.unit}
      </text>
    </g>
  );
}

/**
 * One-at-a-time sensitivity (mission document §5.5). Each bar spans the target metric when
 * that parameter alone is pushed to its bounds, everything else central. Parameters with no
 * effect on the selected target are listed separately rather than drawn as empty bars —
 * "no effect on this metric" is a different statement from "unimportant".
 */
export function TornadoChart({ entries, target, year, onTarget }: Props) {
  const { t } = useI18n();
  // sim-core owns the target ids; their display names are localised here
  const targetLabel: Record<TornadoTarget, string> = {
    euDcTwh: t.tornado.targetDemand,
    flaggedCount: t.tornado.targetFlags,
    euEmissionsMt: t.tornado.targetEmissions,
  };
  const active = entries.filter((e) => e.swing > 1e-6);
  const inert = entries.filter((e) => e.swing <= 1e-6);
  // 'threshold' entries say a cutoff convention is unsettled, not that the world is uncertain --
  // a different kind of not-knowing (issue #30, B3). Drawn in their own section, on the same
  // scale, rather than in a single band where a reader cannot tell the two apart.
  const activePhysical = active.filter((e) => e.kind === 'physical');
  const activeThreshold = active.filter((e) => e.kind === 'threshold');
  const meta = TORNADO_TARGETS[target];

  const maxSwing = active.length > 0 ? Math.max(...active.map((e) => e.swing)) : 1;
  const centre = active[0]?.centralValue ?? 0;
  const bound = Math.max(
    ...active.flatMap((e) => [Math.abs(e.lowValue - centre), Math.abs(e.highValue - centre)]),
    maxSwing / 2,
  );

  const H = Math.max(activePhysical.length, 1) * ROW_H + 26;
  const W = LABEL_W + BAR_W + 60;
  const x = (v: number) => LABEL_W + BAR_W / 2 + ((v - centre) / bound) * (BAR_W / 2);
  const thresholdH = activeThreshold.length * ROW_H + 4;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <h2 style={{ margin: '0 0 2px' }}>{fmt(t.tornado.title, { year })}</h2>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
          <span className="muted">{t.tornado.measuredOn}</span>
          <select value={target} onChange={(e) => onTarget(e.target.value as TornadoTarget)}>
            {(Object.keys(TORNADO_TARGETS) as TornadoTarget[]).map((k) => (
              <option key={k} value={k}>
                {targetLabel[k]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {active.length === 0 ? (
        <p className="muted">{t.tornado.none}</p>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={fmt(t.tornado.label, { target: targetLabel[target], year })}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          >
            <line
              x1={LABEL_W + BAR_W / 2}
              x2={LABEL_W + BAR_W / 2}
              y1={4}
              y2={H - 22}
              stroke="var(--baseline)"
              strokeWidth={1}
            />
            {activePhysical.map((e, i) => (
              <TornadoRow key={e.path} entry={e} yTop={i * ROW_H + 4} x={x} meta={meta} />
            ))}
            <text
              x={LABEL_W + BAR_W / 2}
              y={H - 8}
              textAnchor="middle"
              fontSize={10}
              fill="var(--text-muted)"
            >
              {fmt(t.tornado.central, {
                value: centre.toFixed(centre < 10 ? 1 : 0),
                unit: meta.unit,
              })}
            </text>
          </svg>

          {activeThreshold.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <p className="muted" style={{ margin: '0 0 2px', fontSize: 10 }}>
                {t.tornado.thresholdHeading}
              </p>
              <svg
                viewBox={`0 0 ${W} ${thresholdH}`}
                role="img"
                aria-label={t.tornado.thresholdHeading}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              >
                <line
                  x1={LABEL_W + BAR_W / 2}
                  x2={LABEL_W + BAR_W / 2}
                  y1={4}
                  y2={thresholdH}
                  stroke="var(--baseline)"
                  strokeWidth={1}
                  strokeDasharray="2,2"
                />
                {activeThreshold.map((e, i) => (
                  <TornadoRow key={e.path} entry={e} yTop={i * ROW_H + 4} x={x} meta={meta} />
                ))}
              </svg>
              <p className="muted" style={{ margin: '2px 0 0', fontSize: 10 }}>
                {t.tornado.thresholdNote}
              </p>
            </div>
          )}
        </>
      )}

      <p className="muted" style={{ margin: '4px 0 0' }}>
        {fmt(t.tornado.note, { target: targetLabel[target].toLowerCase() })}
        {target === 'flaggedCount' && <> {t.tornado.countNote}</>}
      </p>
      {inert.length > 0 && (
        <p className="muted" style={{ margin: '2px 0 0' }}>
          {fmt(t.tornado.inert, {
            count: inert.length,
            list: inert.map((e) => shortLabel(e.path)).join(', '),
          })}
        </p>
      )}
    </div>
  );
}
