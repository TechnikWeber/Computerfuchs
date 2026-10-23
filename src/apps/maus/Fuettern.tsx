import { useRef, useState, type PointerEvent } from 'react';
import type { EmojiName } from '../../core/emoji';
import type { Pt } from '../../core/geometry';
import { useMeasured, useTimeouts } from '../../core/hooks';
import { scatter } from '../../core/layout';
import { defaultRng, sample, shuffle } from '../../core/random';
import { sfx } from '../../core/sound';
import { Emoji } from '../../os/Emoji';
import type { LevelProps } from '../shared/levelTypes';
import { LevelHint } from '../shared/LevelUi';
import { useHint } from '../shared/useHint';

interface Pair {
  animal: EmojiName;
  food: EmojiName;
  /** „Der Hase" */
  who: string;
}

const PAIRS: Pair[] = [
  { animal: 'rabbit-face', food: 'carrot', who: 'Der Hase' },
  { animal: 'dog-face', food: 'bone', who: 'Der Hund' },
  { animal: 'monkey-face', food: 'banana', who: 'Der Affe' },
  { animal: 'mouse-face', food: 'cheese-wedge', who: 'Die Maus' },
  { animal: 'cat-face', food: 'fish', who: 'Die Katze' },
  { animal: 'bear', food: 'honey-pot', who: 'Der Bär' },
  { animal: 'chipmunk', food: 'chestnut', who: 'Das Streifenhörnchen' },
];

const TIERS = {
  1: { count: 2, animal: 150, food: 104 },
  2: { count: 3, animal: 132, food: 90 },
  3: { count: 4, animal: 114, food: 76 },
} as const;

interface Drag {
  index: number;
  pointerId: number;
  /** Abstand vom Zeiger zur Mitte des Essens */
  dx: number;
  dy: number;
  x: number;
  y: number;
}

/** Level 4: Ziehen und Ablegen. Jedes Tier bekommt sein Lieblingsessen. */
export function Fuettern({ tier, onDone }: LevelProps) {
  const cfg = TIERS[tier];
  const field = useRef<HTMLDivElement>(null);
  const [pairs] = useState(() => sample(defaultRng, PAIRS, cfg.count));
  // Tiere oben in einer Reihe, das Essen unten – auf Stufe 3 bunt durcheinander.
  const {
    size: { width, height },
    layout: foodHome,
  } = useMeasured(field, (s): Pt[] => {
    if (tier === 3) {
      return scatter(defaultRng, pairs.length, {
        width: s.width,
        height: s.height * 0.42,
        minDist: cfg.food * 1.5,
        margin: cfg.food * 0.7,
      }).map((p) => ({ x: p.x, y: 0.56 + p.y * 0.42 }));
    }
    const order = shuffle(defaultRng, pairs.map((_, i) => i));
    return order.map((slot) => ({ x: (slot + 1) / (pairs.length + 1), y: 0.78 }));
  });
  const [fed, setFed] = useState<boolean[]>(() => pairs.map(() => false));
  const [drag, setDrag] = useState<Drag | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [shake, setShake] = useState<{ i: number; n: number } | null>(null);
  const finished = useRef(false);
  const later = useTimeouts();
  const [hint, showHint] = useHint(2600);

  const animalPos = pairs.map((_, i) => ({ x: (i + 1) / (pairs.length + 1), y: 0.3 }));

  const local = (e: PointerEvent): Pt => {
    const r = field.current?.getBoundingClientRect();
    return r ? { x: e.clientX - r.left, y: e.clientY - r.top } : { x: 0, y: 0 };
  };

  const hovered = (p: Pt): number | null => {
    let best: number | null = null;
    let bestD = cfg.animal * 0.75;
    animalPos.forEach((a, i) => {
      if (fed[i]) return;
      const d = Math.hypot(p.x - a.x * width, p.y - a.y * height);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };

  const start = (i: number, e: PointerEvent<HTMLDivElement>) => {
    if (e.button === 2) {
      showHint('Nimm die linke Maustaste!');
      return;
    }
    if (e.button !== 0 || fed[i] || !foodHome || finished.current) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = local(e);
    const home = { x: foodHome[i].x * width, y: foodHome[i].y * height };
    sfx.tap();
    setDrag({ index: i, pointerId: e.pointerId, dx: p.x - home.x, dy: p.y - home.y, x: home.x, y: home.y });
  };

  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const p = local(e);
    const next = { ...drag, x: p.x - drag.dx, y: p.y - drag.dy };
    setDrag(next);
    setOver(hovered({ x: next.x, y: next.y }));
  };

  const drop = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const target = hovered({ x: drag.x, y: drag.y });
    const i = drag.index;
    setDrag(null);
    setOver(null);
    if (target === null) return;
    if (target === i) {
      sfx.eat();
      const next = fed.map((v, j) => v || j === i);
      setFed(next);
      if (next.every(Boolean)) {
        finished.current = true;
        later(onDone, 1200);
      }
    } else {
      sfx.wrong();
      setShake((s) => ({ i: target, n: (s?.n ?? 0) + 1 }));
      showHint(`${pairs[target].who} mag das nicht. Probier ein anderes Tier!`);
    }
  };

  return (
    <div ref={field} className={drag ? 'feed-field is-dragging' : 'feed-field'}>
      {pairs.map((p, i) => (
        <div
          key={p.animal}
          className={['feed-animal', fed[i] ? 'is-fed' : '', over === i ? 'is-over' : '', drag && !fed[i] ? 'is-target' : '']
            .filter(Boolean)
            .join(' ')}
          style={{ left: `${animalPos[i].x * 100}%`, top: `${animalPos[i].y * 100}%`, width: cfg.animal, height: cfg.animal }}
        >
          <span key={shake?.i === i ? `s${shake.n}` : 'calm'} className={shake?.i === i ? 'feed-face is-shaking' : 'feed-face'}>
            <Emoji name={p.animal} size={cfg.animal * 0.86} />
          </span>
          {fed[i] && (
            <span className="feed-heart">
              <Emoji name="red-heart" size={44} />
            </span>
          )}
        </div>
      ))}
      {foodHome &&
        pairs.map((p, i) => {
          if (fed[i]) return null;
          const dragging = drag?.index === i;
          const x = dragging ? drag.x : foodHome[i].x * width;
          const y = dragging ? drag.y : foodHome[i].y * height;
          return (
            <div
              key={p.food}
              className={dragging ? 'feed-food is-dragging' : 'feed-food'}
              style={{ left: x, top: y, width: cfg.food, height: cfg.food }}
              onPointerDown={(e) => start(i, e)}
              onPointerMove={move}
              onPointerUp={drop}
              onPointerCancel={() => {
                setDrag(null);
                setOver(null);
              }}
              role="button"
              aria-label="Essen zum Ziehen"
            >
              <Emoji name={p.food} size={cfg.food} />
            </div>
          );
        })}
      <LevelHint text={hint} />
    </div>
  );
}
