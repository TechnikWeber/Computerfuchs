import type { Pt } from './geometry';
import type { Rng } from './random';

export interface ScatterOptions {
  /** Fläche in Pixeln */
  width: number;
  height: number;
  /** Mindestabstand der Mittelpunkte in Pixeln */
  minDist: number;
  /** Freier Rand in Pixeln */
  margin: number;
  /** Bereiche (in Pixeln), die frei bleiben sollen – etwa für die Anzeige oben. */
  avoid?: { x: number; y: number; w: number; h: number }[];
  tries?: number;
}

/**
 * Verteilt n Punkte zufällig, aber mit Abstand zueinander.
 * Ergebnis in Bruchteilen (0..1), damit es beim Vergrößern des Fensters mitwächst.
 * Passt nicht alles hinein, nimmt sie den Kandidaten mit dem größten Abstand.
 */
export function scatter(rng: Rng, n: number, opts: ScatterOptions): Pt[] {
  const { width, height, minDist, margin } = opts;
  const tries = opts.tries ?? 120;
  const avoid = opts.avoid ?? [];
  const placed: Pt[] = [];
  const innerW = Math.max(1, width - 2 * margin);
  const innerH = Math.max(1, height - 2 * margin);

  const blocked = (p: Pt) => avoid.some((r) => p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h);

  for (let i = 0; i < n; i++) {
    let best: Pt | null = null;
    let bestScore = -Infinity;
    for (let t = 0; t < tries; t++) {
      const c = { x: margin + rng() * innerW, y: margin + rng() * innerH };
      if (blocked(c)) continue;
      const nearest = placed.reduce((m, p) => Math.min(m, Math.hypot(p.x - c.x, p.y - c.y)), Infinity);
      if (nearest >= minDist) {
        best = c;
        break;
      }
      if (nearest > bestScore) {
        bestScore = nearest;
        best = c;
      }
    }
    placed.push(best ?? { x: margin + rng() * innerW, y: margin + rng() * innerH });
  }
  return placed.map((p) => ({ x: p.x / width, y: p.y / height }));
}
