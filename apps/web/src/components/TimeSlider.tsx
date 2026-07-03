import { useEffect, useRef } from 'react';

interface Props {
  year: number;
  min: number;
  max: number;
  playing: boolean;
  onYear: (y: number) => void;
  onPlaying: (p: boolean) => void;
}

export function TimeSlider({ year, min, max, playing, onYear, onPlaying }: Props) {
  const yearRef = useRef(year);
  yearRef.current = year;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const next = yearRef.current + 1;
      if (next > max) {
        onPlaying(false);
      } else {
        onYear(next);
      }
    }, 600);
    return () => clearInterval(id);
  }, [playing, max, onYear, onPlaying]);

  return (
    <div className="controls-row">
      <button
        onClick={() => {
          if (!playing && year >= max) onYear(min);
          onPlaying(!playing);
        }}
        aria-pressed={playing}
        aria-label={playing ? 'Pause animation' : 'Play 20-year animation'}
      >
        {playing ? '⏸ Pause' : '▶ Play'}
      </button>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={year}
        onChange={(e) => {
          onPlaying(false);
          onYear(Number(e.target.value));
        }}
        aria-label="Simulation year"
        style={{ flex: 1, minWidth: 160 }}
      />
      <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{year}</strong>
    </div>
  );
}
