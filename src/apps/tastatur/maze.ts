import { shuffle, type Rng } from '../../core/random';

/*
 * Labyrinthe für den Pfeilweg. Jede Zelle merkt sich ihre Wände als Bits.
 * Erzeugt wird mit „Tiefensuche mit Zurückgehen“ – dabei entsteht immer ein
 * Labyrinth, in dem jede Zelle erreichbar ist.
 */

export type Dir = 'up' | 'right' | 'down' | 'left';
export const DIRS: readonly Dir[] = ['up', 'right', 'down', 'left'];

const BIT: Record<Dir, number> = { up: 1, right: 2, down: 4, left: 8 };
const OPPOSITE: Record<Dir, Dir> = { up: 'down', right: 'left', down: 'up', left: 'right' };
export const STEP: Record<Dir, [number, number]> = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };

export interface Cell {
  x: number;
  y: number;
}

export interface Maze {
  w: number;
  h: number;
  /** walls[y][x]: gesetzte Bits sind Wände (1 oben, 2 rechts, 4 unten, 8 links) */
  walls: number[][];
}

export function makeMaze(w: number, h: number, rng: Rng, start: Cell = { x: 0, y: 0 }): Maze {
  const walls = Array.from({ length: h }, () => Array.from({ length: w }, () => 15));
  const seen = Array.from({ length: h }, () => Array.from({ length: w }, () => false));
  const stack: Cell[] = [start];
  seen[start.y][start.x] = true;
  while (stack.length > 0) {
    const cur = stack[stack.length - 1];
    const options = shuffle(rng, DIRS).filter((d) => {
      const [dx, dy] = STEP[d];
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      return nx >= 0 && ny >= 0 && nx < w && ny < h && !seen[ny][nx];
    });
    if (options.length === 0) {
      stack.pop();
      continue;
    }
    const d = options[0];
    const [dx, dy] = STEP[d];
    const next = { x: cur.x + dx, y: cur.y + dy };
    walls[cur.y][cur.x] &= ~BIT[d];
    walls[next.y][next.x] &= ~BIT[OPPOSITE[d]];
    seen[next.y][next.x] = true;
    stack.push(next);
  }
  return { w, h, walls };
}

export function hasWall(maze: Maze, cell: Cell, dir: Dir): boolean {
  return (maze.walls[cell.y]?.[cell.x] ?? 15) & BIT[dir] ? true : false;
}

/** Ein Schritt in eine Richtung – oder null, wenn dort eine Wand ist. */
export function step(maze: Maze, cell: Cell, dir: Dir): Cell | null {
  if (hasWall(maze, cell, dir)) return null;
  const [dx, dy] = STEP[dir];
  const next = { x: cell.x + dx, y: cell.y + dy };
  if (next.x < 0 || next.y < 0 || next.x >= maze.w || next.y >= maze.h) return null;
  return next;
}

/** Abstände (in Schritten) von einer Zelle zu allen anderen – Breitensuche. */
export function distances(maze: Maze, from: Cell): number[][] {
  const dist = Array.from({ length: maze.h }, () => Array.from({ length: maze.w }, () => -1));
  dist[from.y][from.x] = 0;
  const queue: Cell[] = [from];
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i];
    for (const d of DIRS) {
      const next = step(maze, cur, d);
      if (next && dist[next.y][next.x] < 0) {
        dist[next.y][next.x] = dist[cur.y][cur.x] + 1;
        queue.push(next);
      }
    }
  }
  return dist;
}

export function shortestPath(maze: Maze, from: Cell, to: Cell): number {
  return distances(maze, from)[to.y]?.[to.x] ?? -1;
}

/** Die Zelle, die am weitesten weg ist – dort liegt das Ziel. */
export function farthest(maze: Maze, from: Cell): Cell & { dist: number } {
  const dist = distances(maze, from);
  let best = { x: from.x, y: from.y, dist: 0 };
  for (let y = 0; y < maze.h; y++) {
    for (let x = 0; x < maze.w; x++) {
      if (dist[y][x] > best.dist) best = { x, y, dist: dist[y][x] };
    }
  }
  return best;
}

/** Sackgassen (nur ein Ausgang) – gute Verstecke für Leckerlis. */
export function deadEnds(maze: Maze): Cell[] {
  const out: Cell[] = [];
  for (let y = 0; y < maze.h; y++) {
    for (let x = 0; x < maze.w; x++) {
      const open = DIRS.filter((d) => !hasWall(maze, { x, y }, d)).length;
      if (open === 1) out.push({ x, y });
    }
  }
  return out;
}

export function sameCell(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}
