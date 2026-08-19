import { scenarioDefaults, type Levers, type SitingPolicy } from '@energie4ai/sim-core';

interface Props {
  levers: Levers;
  onChange: (l: Levers) => void;
}

const SITING: Array<{ id: SitingPolicy; label: string; note: string }> = [
  {
    id: 'market',
    label: 'Market-driven',
    note: 'Additions follow existing clusters and price only.',
  },
  {
    id: 'renewables',
    label: 'Renewables-coupled',
    note: 'Additionally tilted toward systems with a high renewables share. Reads the generation mix, not carbon intensity — nuclear-heavy France loses ground despite being low-carbon.',
  },
  {
    id: 'capped',
    label: 'Capped hubs',
    note: `A country stops accepting new connections once DC load passes ${(scenarioDefaults.hubCapDcShareOfDemand * 100).toFixed(0)}% of its national demand — the Dublin and Amsterdam moratoria, not an EU quota. Existing load stays.`,
  },
];

/** Scenario levers, each with its source-backed default and plausible range (spec §6). */
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

      <div className="lever">
        <label>
          <span className="lever-head">
            <span>
              Siting policy <span className="source-chip">expert-guess</span>
            </span>
          </span>
          <select
            value={levers.sitingPolicy}
            onChange={(e) => onChange({ ...levers, sitingPolicy: e.target.value as SitingPolicy })}
            style={{ width: '100%' }}
          >
            {SITING.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <div className="muted">{SITING.find((o) => o.id === levers.sitingPolicy)!.note}</div>
      </div>

      <div className="lever">
        <label>
          <span className="lever-head">
            <span>
              Flexibility participation{' '}
              <span className="source-chip">elsevier2025dcflexibility</span>
            </span>
            <strong>{(levers.flexibilityShare * 100).toFixed(0)}%</strong>
          </span>
          <input
            type="range"
            min={0}
            max={0.5}
            step={0.05}
            value={levers.flexibilityShare}
            onChange={(e) => onChange({ ...levers, flexibilityShare: Number(e.target.value) })}
          />
        </label>
        <div className="muted">
          Share of DC load enrolled in demand response, which stops counting toward peak. The model
          assumes it curtails exactly when needed — an optimistic reading, which is why the range
          stops at 50%.
        </div>
      </div>

      <div className="lever">
        <label>
          <span className="lever-head">
            <span>
              Price sensitivity of siting <span className="source-chip">expert-guess</span>
            </span>
            <strong>×{levers.priceSensitivity.toFixed(1)}</strong>
          </span>
          <input
            type="range"
            min={0}
            max={3}
            step={0.25}
            value={levers.priceSensitivity}
            onChange={(e) => onChange({ ...levers, priceSensitivity: Number(e.target.value) })}
          />
        </label>
        <div className="muted">
          How strongly electricity price steers where load lands. At ×0 siting ignores price and
          follows existing clusters; high values pull load to cheap systems (Nordics, Iberia).
        </div>
      </div>

      <button onClick={() => onChange({ ...scenarioDefaults.levers })}>
        Reset to central scenario
      </button>
    </div>
  );
}
