import { useMemo, useRef, useState, type PointerEvent } from 'react';
import { createDoubleClick } from '../../core/dblclick';
import type { EmojiName } from '../../core/emoji';
import { useTimeouts } from '../../core/hooks';
import { defaultRng, sample, shuffle } from '../../core/random';
import { sfx } from '../../core/sound';
import { Emoji } from '../../os/Emoji';
import type { LevelProps } from '../shared/levelTypes';
import { LevelHint } from '../shared/LevelUi';
import { useHint } from '../shared/useHint';

const SURPRISES: EmojiName[] = [
  'teddy-bear', 'rocket', 'soccer-ball', 'rainbow', 'unicorn', 'party-popper', 'soft-ice-cream', 'kite', 'guitar',
  'yo-yo', 'lollipop', 'crown', 'sauropod', 'robot', 'gem-stone', 'ringed-planet',
];

const BOXES: [string, string][] = [
  ['#ff4f87', '#ffc533'],
  ['#2f9bff', '#ff7a2f'],
  ['#2fbf62', '#ff4f87'],
  ['#8a6bff', '#ffc533'],
  ['#ff7a2f', '#2f9bff'],
  ['#22c7ad', '#ff4f87'],
  ['#f5a524', '#8a6bff'],
  ['#e8508a', '#2fbf62'],
];

const TIERS = {
  1: { count: 4, cols: 4, size: 150, ms: 900 },
  2: { count: 6, cols: 3, size: 124, ms: 650 },
  3: { count: 8, cols: 4, size: 98, ms: 480 },
} as const;

/** Level 3: Doppelklick. Geschenke gehen nur mit zwei schnellen Klicks auf. */
export function Geschenke({ tier, onDone }: LevelProps) {
  const cfg = TIERS[tier];
  const [gifts] = useState(() => {
    const boxes = shuffle(defaultRng, BOXES);
    return sample(defaultRng, SURPRISES, cfg.count).map((surprise, i) => ({
      surprise,
      box: boxes[i % boxes.length],
      jx: (defaultRng() - 0.5) * 0.5,
      jy: (defaultRng() - 0.5) * 0.4,
      tilt: (defaultRng() - 0.5) * 14,
    }));
  });
  const [opened, setOpened] = useState<boolean[]>(() => gifts.map(() => false));
  const [wiggle, setWiggle] = useState<{ i: number; n: number } | null>(null);
  const detect = useMemo(() => createDoubleClick(cfg.ms, 22), [cfg.ms]);
  const singles = useRef(0);
  const hintTimer = useRef<number | undefined>(undefined);
  const finished = useRef(false);
  const later = useTimeouts();
  const [hint, showHint] = useHint(2600);

  const rows = Math.ceil(cfg.count / cfg.cols);

  const press = (i: number, e: PointerEvent<HTMLButtonElement>) => {
    if (e.button === 2) {
      showHint('Nimm die linke Maustaste!');
      return;
    }
    if (e.button !== 0 || opened[i] || finished.current) return;
    if (detect({ x: e.clientX, y: e.clientY, t: e.timeStamp, target: String(i) })) {
      window.clearTimeout(hintTimer.current);
      sfx.pop();
      later(() => sfx.found(), 120);
      const next = opened.map((v, j) => v || j === i);
      setOpened(next);
      if (next.every(Boolean)) {
        finished.current = true;
        later(onDone, 1300);
      }
      return;
    }
    sfx.click();
    setWiggle((w) => ({ i, n: (w?.n ?? 0) + 1 }));
    window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => {
      singles.current += 1;
      showHint(singles.current > 2 ? 'Schneller! Zweimal ganz schnell hintereinander klicken.' : 'Zweimal schnell klicken!');
    }, cfg.ms + 120);
  };

  return (
    <div className="gift-field" onPointerDown={() => window.clearTimeout(hintTimer.current)}>
      <div className="gift-grid" style={{ gridTemplateColumns: `repeat(${cfg.cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
        {gifts.map((g, i) => (
          <div key={i} className="gift-cell">
            <button
              type="button"
              className={['gift', opened[i] ? 'is-open' : '', wiggle?.i === i ? 'is-wiggle' : ''].filter(Boolean).join(' ')}
              // Neuer Schlüssel startet das Wackeln bei jedem Klick von vorn.
              key={wiggle?.i === i ? `w${wiggle.n}` : 'idle'}
              style={{
                width: cfg.size,
                height: cfg.size,
                translate: `${g.jx * 40}px ${g.jy * 40}px`,
                rotate: `${g.tilt}deg`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                press(i, e);
              }}
              aria-label={opened[i] ? 'Offenes Geschenk' : 'Geschenk – mit Doppelklick öffnen'}
            >
              <GiftBox box={g.box[0]} ribbon={g.box[1]} />
              {opened[i] && (
                <span className="gift-surprise">
                  <Emoji name={g.surprise} size={cfg.size * 0.7} />
                </span>
              )}
            </button>
          </div>
        ))}
      </div>
      <LevelHint text={hint} />
    </div>
  );
}

function GiftBox({ box, ribbon }: { box: string; ribbon: string }) {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden="true" className="gift-svg">
      <rect x="16" y="54" width="88" height="58" rx="7" fill={box} />
      <rect x="16" y="54" width="88" height="12" fill="#000" opacity=".12" />
      <rect x="52" y="54" width="16" height="58" fill={ribbon} />
      <g className="gift-lid">
        <path d="M60 31C49 12 25 11 29 25c3 9 21 8 31 6Zm0 0c11-19 35-20 31-6-3 9-21 8-31 6Z" fill={ribbon} />
        <rect x="8" y="30" width="104" height="26" rx="7" fill={box} />
        <rect x="8" y="30" width="104" height="8" rx="4" fill="#fff" opacity=".22" />
        <rect x="52" y="30" width="16" height="26" fill={ribbon} />
      </g>
    </svg>
  );
}
