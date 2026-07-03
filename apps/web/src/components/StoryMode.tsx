import { useState } from 'react';
import type { Levers } from '@energie4ai/sim-core';

export interface StoryStep {
  title: string;
  text: string;
  year: number;
  metricId: string;
  levers: Levers;
}

const BASE: Levers = {
  computeGrowthMultiplier: 1,
  extraEfficiencyRate: 0,
  permittingReform: false,
};
const REFORM: Levers = { ...BASE, permittingReform: true };

/** P1 story scenario: "Grids Package delivers" (mission document §6). */
const STEPS: StoryStep[] = [
  {
    title: 'The starting grid',
    text: 'Europe, 2026. Data centers cluster in a handful of hubs — Frankfurt, London, Amsterdam, Paris, Dublin. Grid connection, not chips or capital, is the binding constraint: under baseline rules a new grid corridor takes ~9 years to permit.',
    year: 2026,
    metricId: 'dcShareOfDemand',
    levers: BASE,
  },
  {
    title: 'Business as usual, 2030',
    text: 'Under today’s permitting rules, EU data center demand grows to the IEA corridor (~+45 TWh vs. 2024). Connection queues form where the pipeline is tightest — Ireland’s de-facto Dublin moratorium pushes new builds toward the Nordics and Iberia.',
    year: 2030,
    metricId: 'stressIndex',
    levers: BASE,
  },
  {
    title: 'The Grids Package passes',
    text: 'Now flip the permitting-reform lever: the European Grids Package (Dec 2025) caps permitting at ~4–6 years. The delay chain (announced → permitted → built) delivers connection capacity roughly twice as fast.',
    year: 2030,
    metricId: 'stressIndex',
    levers: REFORM,
  },
  {
    title: 'A decade of delivery',
    text: 'By 2035, faster permitting has drained most connection queues; more of Europe’s captured AI demand is actually built instead of relocating or waiting. Watch Ireland: its stress flag now comes from inference load at system peak, not from the queue.',
    year: 2035,
    metricId: 'dcShareOfPeak' as never,
    levers: REFORM,
  },
  {
    title: 'The honest ending',
    text: 'By 2045 the corridor logic still holds: reform changes *where and when* stress appears, not whether AI load grows. Remember what this model is — an annual, NTC-level exploration device, not a forecast. Open the assumptions drawer to see every number’s source.',
    year: 2045,
    metricId: 'dcShareOfDemand',
    levers: REFORM,
  },
];

interface Props {
  onApply: (step: StoryStep) => void;
  onExit: () => void;
}

export function StoryMode({ onApply, onExit }: Props) {
  const [index, setIndex] = useState<number | null>(null);

  const go = (i: number) => {
    setIndex(i);
    const step = STEPS[i]!;
    // dcShareOfPeak isn't a standalone map metric in P1; fall back to stress for that step
    onApply({
      ...step,
      metricId: step.metricId === 'dcShareOfPeak' ? 'stressIndex' : step.metricId,
    });
  };

  if (index === null) {
    return (
      <div>
        <h2>Story mode</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          &quot;Grids Package delivers&quot; — a guided 5-step tour of the permitting-reform lever.
        </p>
        <button onClick={() => go(0)}>▶ Start story</button>
      </div>
    );
  }

  const step = STEPS[index]!;
  return (
    <div>
      <h2>
        Story {index + 1}/{STEPS.length}: {step.title}
      </h2>
      <p style={{ fontSize: '0.85rem', marginTop: 0 }}>{step.text}</p>
      <div className="story-nav">
        <button disabled={index === 0} onClick={() => go(index - 1)}>
          ← Back
        </button>
        <button disabled={index === STEPS.length - 1} onClick={() => go(index + 1)}>
          Next →
        </button>
        <button
          onClick={() => {
            setIndex(null);
            onExit();
          }}
        >
          Exit story
        </button>
      </div>
    </div>
  );
}
