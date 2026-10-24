import type { Pixels, Rect } from './fill';

/*
 * Rückgängig speichert nicht das ganze Bild, sondern nur den Ausschnitt, den
 * ein Pinselstrich oder eine Füllung verändert hat. So passen viele Schritte
 * in wenig Speicher – wichtig auf alten Laptops und dem Raspberry Pi.
 */

export function unionRect(a: Rect | null, b: Rect): Rect {
  if (!a) return { ...b };
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

/** Auf ganze Pixel innerhalb des Bildes beschneiden; null, wenn nichts übrig bleibt. */
export function clampRect(r: Rect, width: number, height: number): Rect | null {
  const x = Math.max(0, Math.floor(r.x));
  const y = Math.max(0, Math.floor(r.y));
  const right = Math.min(width, Math.ceil(r.x + r.w));
  const bottom = Math.min(height, Math.ceil(r.y + r.h));
  if (right <= x || bottom <= y) return null;
  return { x, y, w: right - x, h: bottom - y };
}

/** Rechteck um zwei Punkte, mit Rand – etwa für einen Pinselstrich der Dicke `pad * 2`. */
export function rectAround(ax: number, ay: number, bx: number, by: number, pad: number): Rect {
  const x = Math.min(ax, bx) - pad;
  const y = Math.min(ay, by) - pad;
  return { x, y, w: Math.abs(ax - bx) + pad * 2, h: Math.abs(ay - by) + pad * 2 };
}

/** Einen Ausschnitt kopieren (Zeile für Zeile). */
export function cropPixels(src: Pixels, r: Rect): Pixels {
  const data = new Uint8ClampedArray(r.w * r.h * 4);
  for (let row = 0; row < r.h; row++) {
    const from = ((r.y + row) * src.width + r.x) * 4;
    data.set(src.data.subarray(from, from + r.w * 4), row * r.w * 4);
  }
  return { width: r.w, height: r.h, data };
}

/** Einen Ausschnitt an (x, y) zurückschreiben. */
export function pastePixels(dst: Pixels, patch: Pixels, x: number, y: number): void {
  for (let row = 0; row < patch.height; row++) {
    const to = ((y + row) * dst.width + x) * 4;
    dst.data.set(patch.data.subarray(row * patch.width * 4, (row + 1) * patch.width * 4), to);
  }
}

/** Älteste Schritte vergessen, bis alles in `maxBytes` passt – der neueste bleibt immer. */
export function trimToBudget<T extends { bytes: number }>(stack: T[], maxBytes: number): T[] {
  let total = stack.reduce((sum, s) => sum + s.bytes, 0);
  let start = 0;
  while (total > maxBytes && start < stack.length - 1) {
    total -= stack[start].bytes;
    start++;
  }
  return start === 0 ? stack : stack.slice(start);
}
