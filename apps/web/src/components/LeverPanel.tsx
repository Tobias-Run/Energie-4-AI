import { scenarioDefaults, type Levers, type SitingPolicy } from '@energie4ai/sim-core';
import { fmt, useI18n, type Strings } from '../i18n/index.js';

interface Props {
  levers: Levers;
  onChange: (l: Levers) => void;
}

const siting = (t: Strings): Array<{ id: SitingPolicy; label: string; note: string }> => [
  { id: 'market', label: t.levers.sitingMarket, note: t.levers.sitingMarketNote },
  { id: 'renewables', label: t.levers.sitingRenewables, note: t.levers.sitingRenewablesNote },
  {
    id: 'capped',
    label: t.levers.sitingCapped,
    note: fmt(t.levers.sitingCappedNote, {
      cap: (scenarioDefaults.hubCapDcShareOfDemand * 100).toFixed(0),
    }),
  },
];

/** Scenario levers, each with its source-backed default and plausible range (spec §6). */
export function LeverPanel({ levers, onChange }: Props) {
  const { t } = useI18n();
  const SITING = siting(t);
  return (
    <div>
      <h2>{t.levers.title}</h2>

      <div className="lever">
        <label>
          <span className="lever-head">
            <span>
              {t.levers.computeGrowth} <span className="source-chip">iea2025energyai</span>
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
        <div className="muted">{t.levers.computeGrowthNote}</div>
      </div>

      <div className="lever">
        <label>
          <span className="lever-head">
            <span>
              {t.levers.efficiency} <span className="source-chip">expert-guess</span>
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
        <div className="muted">{t.levers.efficiencyNote}</div>
      </div>

      <div className="lever">
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={levers.permittingReform}
            onChange={(e) => onChange({ ...levers, permittingReform: e.target.checked })}
          />
          <span>
            {t.levers.permitting} <span className="source-chip">ec2025gridspackage</span>
          </span>
        </label>
        <div className="muted">{t.levers.permittingNote}</div>
      </div>

      <div className="lever">
        <label>
          <span className="lever-head">
            <span>
              {t.levers.siting} <span className="source-chip">expert-guess</span>
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
              {/* Two chips because the lever now drives two mechanisms with two different
                  sources: the participation range, and the connection speed-up (issue #42). */}
              {t.levers.flexibility} <span className="source-chip">elsevier2025dcflexibility</span>{' '}
              <span className="source-chip">entsoe2026datacentres</span>
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
          {fmt(t.levers.flexibilityNote, {
            saved: scenarioDefaults.flexibleConnectionYearsSaved,
          })}
        </div>
      </div>

      <div className="lever">
        <label>
          <span className="lever-head">
            <span>
              {t.levers.priceSensitivity} <span className="source-chip">expert-guess</span>
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
        <div className="muted">{t.levers.priceSensitivityNote}</div>
      </div>

      <button onClick={() => onChange({ ...scenarioDefaults.levers })}>{t.levers.reset}</button>
    </div>
  );
}
