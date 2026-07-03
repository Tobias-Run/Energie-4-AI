import type { Levers } from '@energie4ai/sim-core';

interface Props {
  levers: Levers;
  onChange: (l: Levers) => void;
}

/** The three P1 levers, each with its source-backed default and plausible range (spec §6). */
export function LeverPanel({ levers, onChange }: Props) {
  return (
    <div>
      <h2>Scenario levers</h2>

      <div className="lever">
        <label>
          <span className="lever-head">
            <span>
              Compute demand growth <span className="source-chip">iea2025energyai</span>
            </span>
            <strong>×{levers.computeGrowthMultiplier.toFixed(2)}</strong>
          </span>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.05}
            value={levers.computeGrowthMultiplier}
            onChange={(e) =>
              onChange({ ...levers, computeGrowthMultiplier: Number(e.target.value) })
            }
          />
        </label>
        <div className="muted">Multiplier on the IEA base-case global growth (default ×1.00).</div>
      </div>

      <div className="lever">
        <label>
          <span className="lever-head">
            <span>
              Extra efficiency gains <span className="source-chip">expert-guess</span>
            </span>
            <strong>{(levers.extraEfficiencyRate * 100).toFixed(1)}%/yr</strong>
          </span>
          <input
            type="range"
            min={0}
            max={0.03}
            step={0.0025}
            value={levers.extraEfficiencyRate}
            onChange={(e) => onChange({ ...levers, extraEfficiencyRate: Number(e.target.value) })}
          />
        </label>
        <div className="muted">
          Energy-per-compute improvement on top of the base case (default 0.0%/yr).
        </div>
      </div>

      <div className="lever">
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={levers.permittingReform}
            onChange={(e) => onChange({ ...levers, permittingReform: e.target.checked })}
          />
          <span>
            Permitting reform (&quot;Grids Package&quot;){' '}
            <span className="source-chip">ec2025gridspackage</span>
          </span>
        </label>
        <div className="muted">
          Grid permitting ~9 years → ~5 years (default off = today&apos;s baseline).
        </div>
      </div>

      <button
        onClick={() =>
          onChange({ computeGrowthMultiplier: 1, extraEfficiencyRate: 0, permittingReform: false })
        }
      >
        Reset to central scenario
      </button>
    </div>
  );
}
