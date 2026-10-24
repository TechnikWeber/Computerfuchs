/*
 * Farbeimer: füllt eine zusammenhängende Fläche. Linien haben weiche Kanten
 * (Kantenglättung) – darum zählen auch ähnliche Farben noch zur Fläche, und am
 * Ende wächst die Füllung um ein Pixel unter die Linie. So bleibt kein heller
 * Rand stehen. Reine Funktionen auf Pixeldaten, damit sie sich testen lassen.
 */

export type Rgba = [number, number, number, number];

export interface Pixels {
  width: number;
  height: number;
  data: Uint8ClampedArray<ArrayBuffer>;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function hexToRgba(hex: string): Rgba {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0, 0, 0, 255];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

export function rgbaToHex([r, g, b]: Rgba): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Wie weit darf ein Pixel von der angeklickten Farbe abweichen und gehört noch zur Fläche? */
export const FILL_TOLERANCE = 60;

/**
 * Füllt ab (sx, sy) alles, was farblich zur angeklickten Stelle passt.
 * Gibt den veränderten Bereich zurück – oder null, wenn es nichts zu tun gab.
 */
export function floodFill(img: Pixels, sx: number, sy: number, color: Rgba, tolerance = FILL_TOLERANCE): Rect | null {
  const { width: w, height: h, data } = img;
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  if (x0 < 0 || y0 < 0 || x0 >= w || y0 >= h) return null;
  const i0 = (y0 * w + x0) * 4;
  const r0 = data[i0];
  const g0 = data[i0 + 1];
  const b0 = data[i0 + 2];
  // Schon diese Farbe? Dann nichts tun – sonst „verschwindet“ ein Klick im Rückgängig-Speicher.
  if (Math.abs(r0 - color[0]) <= 2 && Math.abs(g0 - color[1]) <= 2 && Math.abs(b0 - color[2]) <= 2) return null;

  const mask = new Uint8Array(w * h);
  const fits = (p: number) => {
    const i = p * 4;
    return Math.abs(data[i] - r0) <= tolerance && Math.abs(data[i + 1] - g0) <= tolerance && Math.abs(data[i + 2] - b0) <= tolerance;
  };
  const open = (p: number) => mask[p] === 0 && fits(p);

  let minX = x0;
  let maxX = x0;
  let minY = y0;
  let maxY = y0;
  const stack: number[] = [x0, y0];
  while (stack.length > 0) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    const row = y * w;
    if (!open(row + x)) continue;
    let left = x;
    while (left > 0 && open(row + left - 1)) left--;
    let right = x;
    while (right < w - 1 && open(row + right + 1)) right++;
    for (let i = left; i <= right; i++) mask[row + i] = 1;
    if (left < minX) minX = left;
    if (right > maxX) maxX = right;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    // Darüber und darunter: jeden zusammenhängenden passenden Abschnitt einmal merken.
    for (const ny of [y - 1, y + 1]) {
      if (ny < 0 || ny >= h) continue;
      const nrow = ny * w;
      let i = left;
      while (i <= right) {
        while (i <= right && !open(nrow + i)) i++;
        if (i > right) break;
        stack.push(i, ny);
        while (i <= right && open(nrow + i)) i++;
      }
    }
  }

  // Ein Pixel unter die Kante wachsen lassen.
  const x1 = Math.max(0, minX - 1);
  const x2 = Math.min(w - 1, maxX + 1);
  const y1 = Math.max(0, minY - 1);
  const y2 = Math.min(h - 1, maxY + 1);
  const [r, g, b, a] = color;
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      const p = y * w + x;
      const inside =
        mask[p] === 1 ||
        (x > 0 && mask[p - 1] === 1) ||
        (x < w - 1 && mask[p + 1] === 1) ||
        (y > 0 && mask[p - w] === 1) ||
        (y < h - 1 && mask[p + w] === 1);
      if (!inside) continue;
      const i = p * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }
  return { x: x1, y: y1, w: x2 - x1 + 1, h: y2 - y1 + 1 };
}
