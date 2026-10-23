import { useRef, useState } from 'react';
import { useFrame, useTimeouts } from '../../core/hooks';
import { defaultRng, pick } from '../../core/random';
import { sfx } from '../../core/sound';
import { Emoji } from '../../os/Emoji';
import type { LevelProps, Tier } from '../shared/levelTypes';
import { LevelHint } from '../shared/LevelUi';
import { useHint } from '../shared/useHint';
import { Keyboard, type Flash } from './Keyboard';
import { sameLetter, strokeFor } from './layout';
import { useKeys } from './useKeys';

interface Config {
  goal: number;
  max: number;
  /** Prozent der Höhe pro Sekunde */
  speed: number;
  chars: string;
}

const TIERS: Record<Tier, Config> = {
  1: { goal: 8, max: 1, speed: 8, chars: 'asdfjklgh' },
  2: { goal: 12, max: 2, speed: 10, chars: 'abcdefghijklmnoprstuvwz' },
  3: { goal: 15, max: 3, speed: 12, chars: 'abcdefghijklmnopqrstuvwxyz123456789' },
};

interface Star {
  id: number;
  ch: string;
  x: number;
  y: number;
  state: 'fall' | 'caught' | 'lost';
  /** Sekunden seit dem Fangen oder Verlieren – für die kleine Animation */
  since: number;
}

/** Tastatur Level 4: Fallende Sterne fangen – mit der passenden Taste. */
export function Sternenregen({ tier, onDone }: LevelProps) {
  const cfg = TIERS[tier];
  const stars = useRef<Star[]>([]);
  const t = useRef({ now: 0, lastSpawn: -2, ids: 0 });
  const [view, setView] = useState<Star[]>([]);
  const [caught, setCaught] = useState(0);
  const [lost, setLost] = useState(0);
  const [running, setRunning] = useState(true);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [hint, showHint] = useHint(2200);
  const later = useTimeouts();

  useFrame((dt) => {
    const clock = t.current;
    clock.now += dt;
    let list = stars.current;
    for (const s of list) {
      if (s.state === 'fall') {
        s.y += cfg.speed * dt;
        if (s.y > 88) {
          s.state = 'lost';
          s.since = 0;
          setLost((n) => n + 1);
          sfx.whoosh();
        }
      } else {
        s.since += dt;
      }
    }
    list = list.filter((s) => s.state === 'fall' || s.since < 0.6);
    const falling = list.filter((s) => s.state === 'fall');
    // Nie zwei gleiche Buchstaben auf einmal – und nicht zu dicht nebeneinander.
    if (falling.length < cfg.max && clock.now - clock.lastSpawn > 1.2) {
      const taken = new Set(falling.map((s) => s.ch));
      const ch = pick(defaultRng, [...cfg.chars].filter((c) => !taken.has(c)));
      let x = 10 + defaultRng() * 80;
      for (let tries = 0; tries < 6 && falling.some((s) => Math.abs(s.x - x) < 16); tries++) x = 10 + defaultRng() * 80;
      list.push({ id: ++clock.ids, ch, x, y: -12, state: 'fall', since: 0 });
      clock.lastSpawn = clock.now;
    }
    stars.current = list;
    setView(list.map((s) => ({ ...s })));
  }, running);

  useKeys((e) => {
    if (!running || [...e.key].length !== 1) return;
    const n = (flash?.n ?? 0) + 1;
    const hit = stars.current
      .filter((s) => s.state === 'fall' && sameLetter(s.ch, e.key))
      .sort((a, b) => b.y - a.y)[0];
    if (!hit) {
      sfx.wrong();
      setFlash({ code: e.code, ok: false, n });
      showHint(`${e.key.toLocaleUpperCase('de')} fällt gerade nicht.`);
      return;
    }
    hit.state = 'caught';
    hit.since = 0;
    setFlash({ code: e.code, ok: true, n });
    sfx.coin();
    const total = caught + 1;
    setCaught(total);
    if (total >= cfg.goal) {
      setRunning(false);
      sfx.success();
      later(() => onDone(), 800);
    }
  });

  const lowest = view.filter((s) => s.state === 'fall').sort((a, b) => b.y - a.y)[0];
  const lit = tier === 1 && lowest ? [strokeFor(lowest.ch)?.code ?? ''] : [];

  return (
    <div className="kb-level rain">
      <div className="rain-sky">
        <div className="rain-count" aria-live="polite">
          <Emoji name="glowing-star" size={30} />
          {caught} von {cfg.goal}
          {lost > 0 && <span className="rain-lost">({lost} verpasst)</span>}
        </div>
        {view.map((s) => (
          <div key={s.id} className={`rain-star is-${s.state}`} style={{ left: `${s.x}%`, top: `${s.y}%` }}>
            <Emoji name="star" size="100%" />
            <span>{s.ch.toLocaleUpperCase('de')}</span>
          </div>
        ))}
        <div className="rain-ground" aria-hidden="true" />
      </div>
      <Keyboard highlight={lit} flash={flash} compact={tier < 3} className="kb-level-keys" />
      <LevelHint text={hint} />
    </div>
  );
}
