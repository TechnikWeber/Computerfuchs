import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { useInterval, useTimeouts } from '../../core/hooks';
import { defaultRng, pick } from '../../core/random';
import { sfx } from '../../core/sound';
import type { LevelProps } from '../shared/levelTypes';
import { LevelHint } from '../shared/LevelUi';
import { useHint } from '../shared/useHint';

interface Balloon {
  id: number;
  x: number;
  color: string;
  target: boolean;
  dur: number;
  sway: number;
}

interface Burst {
  id: number;
  x: number;
  y: number;
  color: string;
}

const RED = '#ff4d5e';
const COLORS = [RED, '#2f9bff', '#2fbf62', '#ffc533', '#8a6bff', '#ff7a2f', '#ff6fae'];
const DECOYS = ['#2f9bff', '#2fbf62', '#ffc533', '#8a6bff'];

const TIERS = {
  1: { goal: 8, size: 130, rise: 9, every: 1300, max: 3, decoys: 0 },
  2: { goal: 10, size: 102, rise: 6.5, every: 1000, max: 4, decoys: 0 },
  3: { goal: 12, size: 84, rise: 5.2, every: 760, max: 6, decoys: 0.45 },
} as const;

/** Level 2: Klicken. Ballons steigen auf und platzen beim Klick. */
export function Ballons({ tier, onDone }: LevelProps) {
  const cfg = TIERS[tier];
  const field = useRef<HTMLDivElement>(null);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [popped, setPopped] = useState(0);
  const poppedRef = useRef(0);
  const nextId = useRef(1);
  const finished = useRef(false);
  const later = useTimeouts();
  const [hint, showHint] = useHint();

  const spawn = () => {
    if (finished.current) return;
    setBalloons((list) => {
      if (list.length >= cfg.max) return list;
      const decoy = defaultRng() < cfg.decoys;
      const color = decoy ? pick(defaultRng, DECOYS) : tier === 3 ? RED : pick(defaultRng, COLORS);
      return [
        ...list,
        {
          id: nextId.current++,
          x: 0.08 + defaultRng() * 0.84,
          color,
          target: !decoy,
          dur: cfg.rise * (0.85 + defaultRng() * 0.3),
          sway: 1.8 + defaultRng() * 1.4,
        },
      ];
    });
  };

  // Der erste Ballon kommt sofort, die weiteren im Takt.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    spawn();
  });
  useInterval(spawn, cfg.every);

  const remove = (id: number) => setBalloons((list) => list.filter((b) => b.id !== id));

  const pop = (b: Balloon, e: PointerEvent<HTMLButtonElement>) => {
    if (e.button === 2) {
      showHint('Das war die rechte Taste. Nimm die linke!');
      return;
    }
    if (e.button !== 0 || finished.current) return;
    if (!b.target) {
      sfx.boing();
      e.currentTarget.classList.add('is-nope');
      showHint('Nur die roten Ballons!');
      return;
    }
    const host = field.current?.getBoundingClientRect();
    const r = e.currentTarget.getBoundingClientRect();
    if (host) {
      const burst = { id: b.id, x: r.left - host.left + r.width / 2, y: r.top - host.top + r.height * 0.4, color: b.color };
      setBursts((list) => [...list, burst]);
      later(() => setBursts((list) => list.filter((x) => x.id !== b.id)), 650);
    }
    remove(b.id);
    sfx.pop();
    poppedRef.current += 1;
    setPopped(poppedRef.current);
    if (poppedRef.current >= cfg.goal) {
      finished.current = true;
      later(onDone, 800);
    }
  };

  return (
    <div ref={field} className="balloon-field">
      <div className="balloon-hud">
        <BalloonShape color={tier === 3 ? RED : '#ff4f87'} size={44} />
        <span className="hud-count">
          {popped} / {cfg.goal}
        </span>
        <span className="hud-bar">
          <span style={{ width: `${(popped / cfg.goal) * 100}%` }} />
        </span>
      </div>
      {balloons.map((b) => (
        <button
          key={b.id}
          type="button"
          className="balloon keep-motion"
          aria-label={b.target ? 'Ballon' : 'Falscher Ballon'}
          style={
            {
              left: `${b.x * 100}%`,
              width: cfg.size,
              height: cfg.size * 1.32,
              marginLeft: -cfg.size / 2,
              animationDuration: `${b.dur}s`,
              '--sway': `${b.sway}s`,
            } as CSSProperties
          }
          onPointerDown={(e) => pop(b, e)}
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget) remove(b.id);
          }}
        >
          <span className="balloon-sway">
            <BalloonShape color={b.color} />
          </span>
        </button>
      ))}
      {bursts.map((b) => (
        <span key={b.id} className="burst" style={{ left: b.x, top: b.y, '--c': b.color } as CSSProperties}>
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} style={{ '--a': `${i * 36}deg` } as CSSProperties} />
          ))}
        </span>
      ))}
      <LevelHint text={hint} />
    </div>
  );
}

function BalloonShape({ color, size }: { color: string; size?: number }) {
  return (
    <svg viewBox="0 0 100 132" width={size ?? '100%'} height={size ? size * 1.32 : '100%'} aria-hidden="true">
      <path d="M50 4C24 4 8 26 8 50c0 28 22 50 42 56 20-6 42-28 42-56C92 26 76 4 50 4Z" fill={color} />
      <ellipse cx="33" cy="33" rx="10" ry="17" fill="#fff" opacity=".38" transform="rotate(-22 33 33)" />
      <path d="M43 106h14l-7 9Z" fill={color} />
      <path d="M50 115c-7 6 7 10 0 16" stroke="#8a90a8" strokeWidth="2.5" fill="none" />
    </svg>
  );
}
