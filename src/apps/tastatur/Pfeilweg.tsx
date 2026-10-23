import { useRef, useState } from 'react';
import { emojiUrl, type EmojiName } from '../../core/emoji';
import { useTimeouts } from '../../core/hooks';
import { defaultRng, sample } from '../../core/random';
import { sfx } from '../../core/sound';
import type { LevelProps, Tier } from '../shared/levelTypes';
import { LevelHint } from '../shared/LevelUi';
import { useHint } from '../shared/useHint';
import { KeyCaps, type Flash } from './Keyboard';
import { deadEnds, farthest, hasWall, makeMaze, sameCell, step, type Cell, type Dir } from './maze';
import { useKeys } from './useKeys';

const TIERS: Record<Tier, { w: number; h: number; treats: number }> = {
  1: { w: 5, h: 4, treats: 0 },
  2: { w: 7, h: 5, treats: 0 },
  3: { w: 9, h: 6, treats: 3 },
};

const KEY_DIR: Record<string, Dir> = { ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down', ArrowLeft: 'left' };
const CELL = 10;

function setup(tier: Tier) {
  const cfg = TIERS[tier];
  const start = { x: 0, y: 0 };
  const maze = makeMaze(cfg.w, cfg.h, defaultRng, start);
  const goal = farthest(maze, start);
  const spots = deadEnds(maze).filter((c) => !sameCell(c, start) && !sameCell(c, goal));
  const treats = sample(defaultRng, spots, cfg.treats);
  return { maze, start, goal: { x: goal.x, y: goal.y }, treats };
}

/** Tastatur Level 3: Mit den Pfeiltasten durchs Labyrinth zum Käse. */
export function Pfeilweg({ tier, onDone }: LevelProps) {
  const [game] = useState(() => setup(tier));
  const { maze, goal } = game;
  const [pos, setPos] = useState<Cell>(game.start);
  const [treats, setTreats] = useState<Cell[]>(game.treats);
  const [bump, setBump] = useState(0);
  const [won, setWon] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [hint, showHint] = useHint(2600);
  const lastMove = useRef(0);
  const later = useTimeouts();

  useKeys((e) => {
    if (won) return;
    const dir = KEY_DIR[e.key];
    const n = (flash?.n ?? 0) + 1;
    if (!dir) {
      if ([...e.key].length === 1 || e.key === 'Enter') {
        showHint('Nimm die Pfeiltasten – sie sind rechts unten auf der Tastatur.');
        sfx.wrong();
      }
      return;
    }
    // Wer die Taste festhält, läuft – aber nicht schneller, als man schauen kann.
    if (e.repeat && e.timeStamp - lastMove.current < 140) return;
    lastMove.current = e.timeStamp;
    const next = step(maze, pos, dir);
    if (!next) {
      sfx.boing();
      setBump((b) => b + 1);
      setFlash({ code: e.key, ok: false, n });
      return;
    }
    setFlash({ code: e.key, ok: true, n });
    sfx.click();
    setPos(next);
    const left = treats.filter((t) => !sameCell(t, next));
    if (left.length < treats.length) {
      sfx.coin();
      setTreats(left);
    }
    if (sameCell(next, goal)) {
      if (left.length > 0) {
        showHint(left.length === 1 ? 'Ein Keks fehlt noch!' : `Erst alle Kekse einsammeln – noch ${left.length}!`);
        return;
      }
      setWon(true);
      sfx.eat();
      later(() => onDone(), 900);
    }
  });

  const lines: string[] = [];
  for (let y = 0; y < maze.h; y++) {
    for (let x = 0; x < maze.w; x++) {
      const c = { x, y };
      const X = x * CELL;
      const Y = y * CELL;
      if (hasWall(maze, c, 'up')) lines.push(`M${X} ${Y}h${CELL}`);
      if (hasWall(maze, c, 'left')) lines.push(`M${X} ${Y}v${CELL}`);
      if (y === maze.h - 1 && hasWall(maze, c, 'down')) lines.push(`M${X} ${Y + CELL}h${CELL}`);
      if (x === maze.w - 1 && hasWall(maze, c, 'right')) lines.push(`M${X + CELL} ${Y}v${CELL}`);
    }
  }

  const img = (name: EmojiName, c: Cell, size = 7.4) => (
    <image href={emojiUrl(name)} x={c.x * CELL + (CELL - size) / 2} y={c.y * CELL + (CELL - size) / 2} width={size} height={size} />
  );

  return (
    <div className="kb-level maze-level">
      <div className="maze-wrap">
        <svg
          className="maze"
          viewBox={`-2 -2 ${maze.w * CELL + 4} ${maze.h * CELL + 4}`}
          role="img"
          aria-label="Labyrinth"
        >
          <rect x={0} y={0} width={maze.w * CELL} height={maze.h * CELL} rx={2} className="maze-floor" />
          {img('cheese-wedge', goal, 8)}
          {treats.map((t) => (
            <g key={`${t.x}-${t.y}`}>{img('cookie', t, 6.4)}</g>
          ))}
          <path d={lines.join('')} className="maze-walls" />
          <g className="maze-hamster" style={{ transform: `translate(${pos.x * CELL}px, ${pos.y * CELL}px)` }}>
            {/* key: Bei jedem Stoß gegen eine Wand wackelt der Hamster neu. */}
            <g key={bump} className={bump ? 'maze-hamster-in is-bumped' : 'maze-hamster-in'}>
              {img(won ? 'party-popper' : 'hamster', { x: 0, y: 0 }, 8.4)}
            </g>
          </g>
        </svg>
        <KeyCaps codes={['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']} flash={flash} />
      </div>
      {tier === 3 && (
        <p className="maze-count">
          {treats.length > 0 ? `Noch ${treats.length} ${treats.length === 1 ? 'Keks' : 'Kekse'}` : 'Alle Kekse! Jetzt zum Käse.'}
        </p>
      )}
      <LevelHint text={hint} />
    </div>
  );
}
