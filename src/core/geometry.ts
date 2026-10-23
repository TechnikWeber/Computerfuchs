export interface Pt {
  x: number;
  y: number;
}

export function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function polylineLength(points: readonly Pt[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += dist(points[i - 1], points[i]);
  return total;
}

/** Glatte Kurve durch alle Stützpunkte (Catmull-Rom). */
export function catmullRom(points: readonly Pt[], steps = 24): Pt[] {
  if (points.length < 3) return [...points];
  const out: Pt[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/** Punkte in gleichem Abstand entlang eines Linienzugs, Anfang und Ende eingeschlossen. */
export function resample(points: readonly Pt[], spacing: number): Pt[] {
  if (points.length === 0) return [];
  const out: Pt[] = [points[0]];
  let carry = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const seg = dist(a, b);
    if (seg === 0) continue;
    let d = spacing - carry;
    while (d <= seg) {
      const t = d / seg;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      d += spacing;
    }
    carry = seg - (d - spacing);
  }
  const last = points[points.length - 1];
  if (dist(out[out.length - 1], last) > spacing * 0.25) out.push(last);
  return out;
}

/** Nächster Punkt im Bereich [from, to] – so kann man in Kurven nicht abkürzen. */
export function nearestIndex(points: readonly Pt[], p: Pt, from = 0, to = points.length - 1): { index: number; dist: number } {
  const start = Math.max(0, from);
  const end = Math.min(points.length - 1, to);
  let best = start;
  let bestDist = Infinity;
  for (let i = start; i <= end; i++) {
    const d = dist(points[i], p);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return { index: best, dist: bestDist };
}

/** Richtung (in Grad) an einer Stelle des Linienzugs – für die fliegende Biene. */
export function headingAt(points: readonly Pt[], index: number): number {
  const a = points[Math.max(0, index - 2)];
  const b = points[Math.min(points.length - 1, index + 2)];
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}
