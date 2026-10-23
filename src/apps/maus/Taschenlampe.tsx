import { useRef, useState, type PointerEvent } from 'react';
import type { EmojiName } from '../../core/emoji';
import type { Pt } from '../../core/geometry';
import { useInterval, useLatest, useMeasured, useTimeouts } from '../../core/hooks';
import { scatter } from '../../core/layout';
import { defaultRng, sample } from '../../core/random';
import { sfx } from '../../core/sound';
import { speak } from '../../core/speech';
import { Emoji } from '../../os/Emoji';
import type { LevelProps } from '../shared/levelTypes';

const FRIENDS: { emoji: EmojiName; name: string }[] = [
  { emoji: 'owl', name: 'eine Eule' },
  { emoji: 'bat', name: 'eine Fledermaus' },
  { emoji: 'hedgehog', name: 'ein Igel' },
  { emoji: 'raccoon', name: 'ein Waschbär' },
  { emoji: 'mouse-face', name: 'eine Maus' },
  { emoji: 'badger', name: 'ein Dachs' },
  { emoji: 'cat-face', name: 'eine Katze' },
  { emoji: 'fox', name: 'ein Fuchs' },
  { emoji: 'teddy-bear', name: 'ein Teddy' },
  { emoji: 'ghost', name: 'ein Gespenst' },
];

const TIERS = {
  1: { count: 4, size: 120, light: 175, dwell: 250 },
  2: { count: 5, size: 90, light: 130, dwell: 350 },
  3: { count: 6, size: 64, light: 95, dwell: 450 },
} as const;

const STEP = 50;

/** Level 1: Maus bewegen. Der Zeiger ist eine Taschenlampe. */
export function Taschenlampe({ tier, onDone }: LevelProps) {
  const cfg = TIERS[tier];
  const field = useRef<HTMLDivElement>(null);
  const dark = useRef<HTMLDivElement>(null);
  const [friends] = useState(() => sample(defaultRng, FRIENDS, cfg.count));
  const {
    size: { width, height },
    layout: spots,
  } = useMeasured(field, (s) =>
    scatter(defaultRng, cfg.count, {
      width: s.width,
      height: s.height,
      minDist: cfg.size * 1.7,
      margin: cfg.size * 0.7,
      avoid: [{ x: s.width / 2 - 260, y: 0, w: 520, h: 100 }],
    }),
  );
  const [found, setFound] = useState<boolean[]>(() => friends.map(() => false));
  const foundRef = useLatest(found);
  const pointer = useRef<Pt | null>(null);
  const dwell = useRef<number[]>(friends.map(() => 0));
  const finished = useRef(false);
  const later = useTimeouts();

  const light = (p: Pt | null) => {
    const el = dark.current;
    if (!el) return;
    if (p) {
      el.style.setProperty('--x', `${p.x}px`);
      el.style.setProperty('--y', `${p.y}px`);
      el.style.setProperty('--r', `${cfg.light}px`);
    } else {
      el.style.setProperty('--r', '0px');
    }
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const p = { x: e.clientX - r.left, y: e.clientY - r.top };
    pointer.current = p;
    light(p);
  };

  // Steht der Lichtkegel kurz auf einem Tier, ist es gefunden – auch wenn die Maus still hält.
  useInterval(() => {
    const p = pointer.current;
    if (!spots || finished.current) return;
    const f = foundRef.current;
    let newly = -1;
    spots.forEach((s, i) => {
      if (f[i]) return;
      const hit = p !== null && Math.hypot(p.x - s.x * width, p.y - s.y * height) < cfg.size * 0.62;
      dwell.current[i] = hit ? dwell.current[i] + STEP : 0;
      if (newly < 0 && dwell.current[i] >= cfg.dwell) newly = i;
    });
    if (newly < 0) return;
    sfx.found();
    speak(`${friends[newly].name}!`);
    const next = f.map((v, i) => v || i === newly);
    setFound(next);
    if (next.every(Boolean)) {
      finished.current = true;
      later(onDone, 1000);
    }
  }, STEP);

  return (
    <div
      ref={field}
      className="lamp-field"
      onPointerMove={onMove}
      onPointerEnter={onMove}
      onPointerLeave={() => {
        pointer.current = null;
        light(null);
      }}
    >
      <Emoji name="crescent-moon" size={80} className="lamp-moon" />
      {spots &&
        friends.map((f, i) => (
          <div
            key={f.emoji}
            className={found[i] ? 'lamp-friend is-found' : 'lamp-friend'}
            style={{ left: `${spots[i].x * 100}%`, top: `${spots[i].y * 100}%`, width: cfg.size, height: cfg.size }}
          >
            <Emoji name={f.emoji} size={cfg.size} />
          </div>
        ))}
      <div ref={dark} className="lamp-dark" />
      <div className="lamp-hud" aria-label={`${found.filter(Boolean).length} von ${friends.length} gefunden`}>
        {friends.map((f, i) => (
          <span key={f.emoji} className={found[i] ? 'lamp-slot is-found' : 'lamp-slot'}>
            {found[i] ? <Emoji name={f.emoji} size={40} /> : '?'}
          </span>
        ))}
      </div>
    </div>
  );
}
