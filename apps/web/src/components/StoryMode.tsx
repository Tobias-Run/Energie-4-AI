import { useState } from 'react';
import { scenarioDefaults, type Levers } from '@energie4ai/sim-core';

export interface StoryStep {
  title: string;
  text: string;
  year: number;
  metricId: string;
  levers: Levers;
}

export interface Story {
  id: string;
  title: string;
  blurb: string;
  steps: StoryStep[];
}

const BASE: Levers = { ...scenarioDefaults.levers };
const REFORM: Levers = { ...BASE, permittingReform: true };
const BOOM: Levers = { ...BASE, computeGrowthMultiplier: 1.75 };
const CAP = scenarioDefaults.hubCapDcShareOfDemand;

/**
 * Guided scenarios (mission document §6). Each ends by naming what the model cannot tell you —
 * the story is a way into the levers, not a claim about the future.
 */
const STORIES: Story[] = [
  {
    id: 'grids-package',
    title: 'Grids Package delivers',
    blurb: 'A 5-step tour of the permitting-reform lever.',
    steps: [
      {
        title: 'The starting grid',
        text: 'Europe, 2026. Data centers cluster in a handful of hubs — Frankfurt, London, Amsterdam, Paris, Dublin. Grid connection, not chips or capital, is the binding constraint: under baseline rules a new grid corridor takes ~9 years to permit.',
        year: 2026,
        metricId: 'dcShareOfDemand',
        levers: BASE,
      },
      {
        title: 'Business as usual, 2030',
        text: 'Under today’s permitting rules, EU data center demand grows into the IEA corridor. Connection queues form where the pipeline is tightest — Ireland’s de-facto Dublin moratorium pushes new builds toward the Nordics and Iberia.',
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
        text: 'By 2035 faster permitting has drained most connection queues; more of Europe’s captured demand is built instead of relocating or waiting. Switch to DC share of peak load — that, not the adequacy ratio, is the criterion that trips the flags.',
        year: 2035,
        metricId: 'dcShareOfPeak',
        levers: REFORM,
      },
      {
        title: 'The honest ending',
        text: 'By 2045 the finding holds: reform changes *where and when* stress appears, not whether AI load grows. The EU total is almost identical with and without it. Remember what this model is — an annual, NTC-level exploration device, not a forecast.',
        year: 2045,
        metricId: 'dcShareOfDemand',
        levers: REFORM,
      },
    ],
  },
  {
    id: 'dublin-freeze',
    title: 'Dublin freeze spreads',
    blurb: 'What a connection moratorium actually does to the map.',
    steps: [
      {
        title: 'A system at its limit',
        text: 'Ireland already runs the most DC-saturated grid in Europe. Follow its share of national demand: under market-driven siting it keeps climbing past every threshold a system operator would be comfortable with.',
        year: 2035,
        metricId: 'dcShareOfDemand',
        levers: BASE,
      },
      {
        title: 'Where it ends up',
        text: `By 2045, data centers draw about 30% of Irish electricity in the central run, and Ireland carries a stress flag. Luxembourg — small, import-dependent, with a flat industrial baseline — sits in the same position for different reasons.`,
        year: 2045,
        metricId: 'dcShareOfDemand',
        levers: BASE,
      },
      {
        title: 'The moratorium',
        text: `Switch siting policy to "capped hubs": a country stops accepting new connections once DC load passes ${(CAP * 100).toFixed(0)}% of its own demand. This is what Dublin and Amsterdam actually did — not an EU quota, a local refusal.`,
        year: 2045,
        metricId: 'dcShareOfDemand',
        levers: { ...BASE, sitingPolicy: 'capped' },
      },
      {
        title: 'The load does not vanish',
        text: 'Ireland drops from roughly 15 to 9 TWh and its flag clears. But the EU total is unchanged — the demand reappears in France, the Netherlands and the Nordics. A moratorium is a redistribution instrument, not a demand-reduction one.',
        year: 2045,
        metricId: 'dcEnergyTwh',
        levers: { ...BASE, sitingPolicy: 'capped' },
      },
      {
        title: 'What this cannot tell you',
        text: 'The model has no sub-national resolution, so "Dublin" is really "Ireland", and it has no economics of refusal — no lost investment, no operators simply going elsewhere in the world. It shows where load lands, not what the refusal costs.',
        year: 2045,
        metricId: 'stressIndex',
        levers: { ...BASE, sitingPolicy: 'capped' },
      },
    ],
  },
  {
    id: 'efficiency-wall',
    title: 'The efficiency wall',
    blurb: 'Why efficiency buys less than it looks like it should.',
    steps: [
      {
        title: 'The optimistic case',
        text: 'Efficiency is the most cited answer to AI energy growth: better chips, better cooling, better utilization. Start from the central path and watch EU demand climb to about 219 TWh by 2045.',
        year: 2045,
        metricId: 'dcShareOfDemand',
        levers: BASE,
      },
      {
        title: 'Two percent a year',
        text: 'Now add 2%/year of energy-per-compute improvement on top of the base case — sustained for two decades, which would be a remarkable run. Demand falls, but nothing like proportionally.',
        year: 2045,
        metricId: 'dcShareOfDemand',
        levers: { ...BASE, extraEfficiencyRate: 0.02 },
      },
      {
        title: 'Now add the boom',
        text: 'Set compute growth to ×1.75 with the same efficiency gains. Demand ends up far above where it started — efficiency slows the climb, it does not reverse it. This is the shape of a rebound argument, drawn out over 20 years.',
        year: 2045,
        metricId: 'dcShareOfDemand',
        levers: { ...BOOM, extraEfficiencyRate: 0.02 },
      },
      {
        title: 'Where efficiency does bite',
        text: 'Switch to DC share of peak load. Efficiency thins out the edges of the map — the small systems that were about to tip. It works on who gets flagged more than on the aggregate curve.',
        year: 2045,
        metricId: 'dcShareOfPeak',
        levers: { ...BOOM, extraEfficiencyRate: 0.02 },
      },
      {
        title: 'The wall is in the assumptions',
        text: 'PUE cannot fall below a physical floor, and the model applies efficiency to new load, not to installed stock. Both are assumptions you can inspect in the drawer — and both are why the curve bends rather than breaks.',
        year: 2045,
        metricId: 'dcShareOfDemand',
        levers: { ...BOOM, extraEfficiencyRate: 0.02 },
      },
    ],
  },
  {
    id: 'nordic-gold-rush',
    title: 'Nordic gold rush',
    blurb: 'What happens when cheap clean power sets the map.',
    steps: [
      {
        title: 'Price barely matters',
        text: 'Set price sensitivity to ×0. Siting now follows existing clusters and nothing else — Germany takes the largest share and Ireland keeps growing, because that is where the capacity already is. Agglomeration alone.',
        year: 2045,
        metricId: 'dcEnergyTwh',
        levers: { ...BASE, priceSensitivity: 0 },
      },
      {
        title: 'Price sets the map',
        text: 'Now push price sensitivity to ×3. Sweden overtakes Germany as Europe’s largest data center system, Finland climbs, and the stress flags clear — cheap Nordic power sits in systems with room to absorb the load.',
        year: 2045,
        metricId: 'dcEnergyTwh',
        levers: { ...BASE, priceSensitivity: 3 },
      },
      {
        title: 'Clean is not the same as cheap',
        text: 'Switch siting to renewables-coupled instead. Sweden still gains, but France loses ground despite being one of Europe’s lowest-carbon systems — the tilt reads the renewables share of generation, and French nuclear does not count toward it.',
        year: 2045,
        metricId: 'renewablesShare',
        levers: { ...BASE, sitingPolicy: 'renewables' },
      },
      {
        title: 'The grid has to carry it',
        text: 'Look at the stress index under the price-driven map. Concentrating load in the Nordics leans on interconnection to move power south — the model grants that generously, at a flat utilization of nameplate NTC.',
        year: 2045,
        metricId: 'stressIndex',
        levers: { ...BASE, priceSensitivity: 3 },
      },
      {
        title: 'The catch',
        text: 'There is no local grid in this model, no land, no water, no permitting difference between Norrland and North Rhine-Westphalia, and no price feedback from the new load itself. A real gold rush would raise the prices that attracted it.',
        year: 2045,
        metricId: 'dcShareOfPeak',
        levers: { ...BASE, priceSensitivity: 3 },
      },
    ],
  },
];

interface Props {
  onApply: (step: StoryStep) => void;
  onExit: () => void;
}

export function StoryMode({ onApply, onExit }: Props) {
  const [storyId, setStoryId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const story = STORIES.find((s) => s.id === storyId);

  const go = (s: Story, i: number) => {
    setStoryId(s.id);
    setIndex(i);
    onApply(s.steps[i]!);
  };

  if (!story) {
    return (
      <div>
        <h2>Story mode</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Guided scenarios. Each sets the levers for you and ends by naming what the model cannot
          tell you.
        </p>
        {STORIES.map((s) => (
          <div key={s.id} className="lever">
            <button onClick={() => go(s, 0)} style={{ width: '100%', textAlign: 'left' }}>
              ▶ {s.title}
            </button>
            <div className="muted">{s.blurb}</div>
          </div>
        ))}
      </div>
    );
  }

  const step = story.steps[index]!;
  return (
    <div>
      <h2>
        {story.title} — {index + 1}/{story.steps.length}
      </h2>
      <p style={{ fontSize: '0.9rem', margin: '0 0 2px', fontWeight: 600 }}>{step.title}</p>
      <p style={{ fontSize: '0.85rem', marginTop: 0 }}>{step.text}</p>
      <div className="story-nav">
        <button disabled={index === 0} onClick={() => go(story, index - 1)}>
          ← Back
        </button>
        <button disabled={index === story.steps.length - 1} onClick={() => go(story, index + 1)}>
          Next →
        </button>
        <button
          onClick={() => {
            setStoryId(null);
            setIndex(0);
            onExit();
          }}
        >
          Exit story
        </button>
      </div>
    </div>
  );
}
