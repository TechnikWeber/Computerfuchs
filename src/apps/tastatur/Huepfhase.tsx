import { useRef, useState } from 'react';
import { useFrame, useTimeouts } from '../../core/hooks';
import { defaultRng } from '../../core/random';
import { sfx } from '../../core/sound';
import { Emoji } from '../../os/Emoji';
import type { LevelProps, Tier } from '../shared/levelTypes';
import { LevelHint, ProgressDots } from '../shared/LevelUi';
import { useHint } from '../shared/useHint';
import { Keyboard, type Flash } from './Keyboard';
import { useKeys } from './useKeys';

interface Config {
  count: number;
  /** Prozent der Breite pro Sekunde */
  speed: number;
  jumpMs: number;
  gap: [number, number];
  /** Anteil der Doppel-Igel */
  doubles: number;
}

const TIERS: Record<Tier, Config> = {
  1: { count: 6, speed: 20, jumpMs: 900, gap: [55, 80], doubles: 0 },
  2: { count: 8, speed: 28, jumpMs: 800, gap: [45, 70], doubles: 0 },
  3: { count: 10, speed: 34, jumpMs: 760, gap: [42, 64], doubles: 0.4 },
};

const RABBIT_X = 16;
const START_DELAY = 1.4;

interface Obstacle {
  id: number;
  x: number;
  double: boolean;
  hit: boolean;
  passed: boolean;
}

interface Sim {
  t: number;
  jumpAt: number | null;
  obstacles: Obstacle[];
  spawned: number;
  nextGap: number;
  cleared: number;
  hits: number;
  ouchUntil: number;
  results: ('ok' | 'miss')[];
  finished: boolean;
}

interface Snap {
  y: number;
  ouch: boolean;
  obstacles: Obstacle[];
  results: ('ok' | 'miss')[];
}

const height = (sim: Sim, jumpSec: number) => {
  if (sim.jumpAt === null) return 0;
  const p = (sim.t - sim.jumpAt) / jumpSec;
  return p >= 0 && p < 1 ? Math.sin(Math.PI * p) : 0;
};

/** Tastatur Level 2: Mit der Leertaste über Igel hüpfen. */
export function Huepfhase({ tier, onDone }: LevelProps) {
  const cfg = TIERS[tier];
  const jumpSec = cfg.jumpMs / 1000;
  const sim = useRef<Sim>({
    t: 0,
    jumpAt: null,
    obstacles: [],
    spawned: 0,
    nextGap: 0,
    cleared: 0,
    hits: 0,
    ouchUntil: 0,
    results: [],
    finished: false,
  });
  const [snap, setSnap] = useState<Snap>({ y: 0, ouch: false, obstacles: [], results: [] });
  const [running, setRunning] = useState(true);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [wrongKeys, setWrongKeys] = useState(0);
  const [hint, showHint] = useHint(2600);
  const ids = useRef(0);
  const later = useTimeouts();

  useFrame((dt) => {
    const s = sim.current;
    s.t += dt;
    for (const o of s.obstacles) o.x -= cfg.speed * dt;

    // Neue Igel kommen von rechts, mit Abstand.
    const last = s.obstacles[s.obstacles.length - 1];
    if (s.t > START_DELAY && s.spawned < cfg.count && (!last || last.x < 100 - s.nextGap)) {
      const double = s.spawned > 1 && defaultRng() < cfg.doubles;
      s.obstacles.push({ id: ++ids.current, x: 108, double, hit: false, passed: false });
      s.spawned++;
      s.nextGap = cfg.gap[0] + defaultRng() * (cfg.gap[1] - cfg.gap[0]) + (double ? 10 : 0);
    }

    const y = height(s, jumpSec);
    for (const o of s.obstacles) {
      // Großzügig: Nur wer wirklich mitten in den Igel läuft, stolpert.
      const center = o.x;
      const reach = o.double ? 7 : 5;
      if (!o.hit && !o.passed && Math.abs(center - RABBIT_X) < reach && y < 0.32) {
        o.hit = true;
        s.hits++;
        s.ouchUntil = s.t + 0.6;
        s.results.push('miss');
        sfx.boing();
      }
      if (!o.passed && center + reach < RABBIT_X - 3) {
        o.passed = true;
        if (!o.hit) {
          s.cleared++;
          s.results.push('ok');
          sfx.found();
        }
      }
    }
    s.obstacles = s.obstacles.filter((o) => o.x > -14);

    if (!s.finished && s.spawned >= cfg.count && s.obstacles.length === 0) {
      s.finished = true;
      setRunning(false);
      sfx.success();
      later(() => onDone(), 700);
    }

    setSnap({ y, ouch: s.t < s.ouchUntil, obstacles: s.obstacles.map((o) => ({ ...o })), results: [...s.results] });
  }, running);

  useKeys((e) => {
    const s = sim.current;
    const n = (flash?.n ?? 0) + 1;
    if (e.key === ' ') {
      setFlash({ code: 'Space', ok: true, n });
      if (height(s, jumpSec) === 0) {
        s.jumpAt = s.t;
        sfx.open();
      }
      return;
    }
    if ([...e.key].length !== 1 && e.key !== 'Enter') return;
    setFlash({ code: e.code, ok: false, n });
    setWrongKeys((w) => w + 1);
    showHint('Die Leertaste ist die lange Taste ganz unten!');
  });

  const states = Array.from({ length: cfg.count }, (_, i) => snap.results[i] ?? (i === snap.results.length ? 'now' : 'todo'));

  return (
    <div className="kb-level hop">
      <div className="kb-level-top">
        <ProgressDots states={states} />
      </div>
      <div className="hop-track">
        <div className="hop-hills" aria-hidden="true" />
        <div
          className={snap.ouch ? 'hop-rabbit is-ouch' : 'hop-rabbit'}
          style={{ left: `${RABBIT_X}%`, bottom: `calc(18% + ${snap.y * 42}%)` }}
        >
          <Emoji name="rabbit-face" size="100%" alt="Hase" />
        </div>
        {snap.obstacles.map((o) => (
          <div key={o.id} className={o.hit ? 'hop-hedgehog is-hit' : 'hop-hedgehog'} style={{ left: `${o.x}%` }}>
            <Emoji name="hedgehog" size="100%" />
            {o.double && <Emoji name="hedgehog" size="100%" />}
          </div>
        ))}
        <div className="hop-ground" aria-hidden="true" />
        {snap.results.length === 0 && <p className="hop-start">Drück die Leertaste zum Hüpfen!</p>}
      </div>
      <Keyboard highlight={wrongKeys > 0 || tier === 1 ? ['Space'] : []} flash={flash} compact className="kb-level-keys" />
      <LevelHint text={hint} />
    </div>
  );
}
