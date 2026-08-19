import { useState } from 'react';
import { scenarioDefaults, type Levers } from '@energie4ai/sim-core';
import { fmt, useI18n } from '../i18n/index.js';
import { storiesEn } from '../i18n/stories-en.js';
import { storiesDe } from '../i18n/stories-de.js';

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
const CAPPED: Levers = { ...BASE, sitingPolicy: 'capped' };
const EFF: Levers = { ...BASE, extraEfficiencyRate: 0.02 };
const BOOM_EFF: Levers = { ...BOOM, extraEfficiencyRate: 0.02 };
const PRICE_BLIND: Levers = { ...BASE, priceSensitivity: 0 };
const PRICE_STRONG: Levers = { ...BASE, priceSensitivity: 3 };
const GREEN: Levers = { ...BASE, sitingPolicy: 'renewables' };

const STORY_TEXT = { en: storiesEn, de: storiesDe };

/**
 * Guided scenarios (mission document §6). Each ends by naming what the model cannot tell you —
 * the story is a way into the levers, not a claim about the future. Text lives in the locale
 * dictionaries; only the lever settings and the metric to show live here.
 */
function buildStories(locale: 'en' | 'de'): Story[] {
  const x = STORY_TEXT[locale];
  const cap = (CAP * 100).toFixed(0);
  const step = (
    title: string,
    text: string,
    year: number,
    metricId: string,
    levers: Levers,
  ): StoryStep => ({ title, text, year, metricId, levers });

  return [
    {
      id: 'grids-package',
      title: x.gridsPackage.title,
      blurb: x.gridsPackage.blurb,
      steps: [
        step(x.gridsPackage.s1t, x.gridsPackage.s1, 2026, 'dcShareOfDemand', BASE),
        step(x.gridsPackage.s2t, x.gridsPackage.s2, 2030, 'stressIndex', BASE),
        step(x.gridsPackage.s3t, x.gridsPackage.s3, 2030, 'stressIndex', REFORM),
        step(x.gridsPackage.s4t, x.gridsPackage.s4, 2035, 'dcShareOfPeak', REFORM),
        step(x.gridsPackage.s5t, x.gridsPackage.s5, 2045, 'dcShareOfDemand', REFORM),
      ],
    },
    {
      id: 'dublin-freeze',
      title: x.dublinFreeze.title,
      blurb: x.dublinFreeze.blurb,
      steps: [
        step(x.dublinFreeze.s1t, x.dublinFreeze.s1, 2035, 'dcShareOfDemand', BASE),
        step(x.dublinFreeze.s2t, x.dublinFreeze.s2, 2045, 'dcShareOfDemand', BASE),
        step(x.dublinFreeze.s3t, fmt(x.dublinFreeze.s3, { cap }), 2045, 'dcShareOfDemand', CAPPED),
        step(x.dublinFreeze.s4t, x.dublinFreeze.s4, 2045, 'dcEnergyTwh', CAPPED),
        step(x.dublinFreeze.s5t, x.dublinFreeze.s5, 2045, 'stressIndex', CAPPED),
      ],
    },
    {
      id: 'efficiency-wall',
      title: x.efficiencyWall.title,
      blurb: x.efficiencyWall.blurb,
      steps: [
        step(x.efficiencyWall.s1t, x.efficiencyWall.s1, 2045, 'dcShareOfDemand', BASE),
        step(x.efficiencyWall.s2t, x.efficiencyWall.s2, 2045, 'dcShareOfDemand', EFF),
        step(x.efficiencyWall.s3t, x.efficiencyWall.s3, 2045, 'dcShareOfDemand', BOOM_EFF),
        step(x.efficiencyWall.s4t, x.efficiencyWall.s4, 2045, 'dcShareOfPeak', BOOM_EFF),
        step(x.efficiencyWall.s5t, x.efficiencyWall.s5, 2045, 'dcShareOfDemand', BOOM_EFF),
      ],
    },
    {
      id: 'nordic-gold-rush',
      title: x.nordicGoldRush.title,
      blurb: x.nordicGoldRush.blurb,
      steps: [
        step(x.nordicGoldRush.s1t, x.nordicGoldRush.s1, 2045, 'dcEnergyTwh', PRICE_BLIND),
        step(x.nordicGoldRush.s2t, x.nordicGoldRush.s2, 2045, 'dcEnergyTwh', PRICE_STRONG),
        step(x.nordicGoldRush.s3t, x.nordicGoldRush.s3, 2045, 'renewablesShare', GREEN),
        step(x.nordicGoldRush.s4t, x.nordicGoldRush.s4, 2045, 'stressIndex', PRICE_STRONG),
        step(x.nordicGoldRush.s5t, x.nordicGoldRush.s5, 2045, 'dcShareOfPeak', PRICE_STRONG),
      ],
    },
  ];
}

interface Props {
  onApply: (step: StoryStep) => void;
  onExit: () => void;
}

export function StoryMode({ onApply, onExit }: Props) {
  const { t, locale } = useI18n();
  const [storyId, setStoryId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const stories = buildStories(locale);
  const story = stories.find((s) => s.id === storyId);

  const go = (s: Story, i: number) => {
    setStoryId(s.id);
    setIndex(i);
    onApply(s.steps[i]!);
  };

  if (!story) {
    return (
      <div>
        <h2>{t.story.title}</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {t.story.intro}
        </p>
        {stories.map((s) => (
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
        {fmt(t.story.progress, {
          title: story.title,
          step: index + 1,
          total: story.steps.length,
        })}
      </h2>
      <p style={{ fontSize: '0.9rem', margin: '0 0 2px', fontWeight: 600 }}>{step.title}</p>
      <p style={{ fontSize: '0.85rem', marginTop: 0 }}>{step.text}</p>
      <div className="story-nav">
        <button disabled={index === 0} onClick={() => go(story, index - 1)}>
          {t.story.back}
        </button>
        <button disabled={index === story.steps.length - 1} onClick={() => go(story, index + 1)}>
          {t.story.next}
        </button>
        <button
          onClick={() => {
            setStoryId(null);
            setIndex(0);
            onExit();
          }}
        >
          {t.story.exit}
        </button>
      </div>
    </div>
  );
}
