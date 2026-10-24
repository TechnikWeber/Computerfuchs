import { describe, expect, it } from 'vitest';
import { floodFill, hexToRgba, rgbaToHex, type Pixels } from './fill';
import { clampRect, cropPixels, pastePixels, rectAround, trimToBudget, unionRect } from './history';
import { TEMPLATES } from './templates';
import { COLORS, PAINT_MISSIONS, sizesFor, STAMPS, toolsFor } from './tools';

/** Ein weißes Bild mit einem schwarzen, 1 Pixel breiten Quadrat als Rahmen. */
function framed(size = 12, from = 2, to = 9): Pixels {
  const data = new Uint8ClampedArray(size * size * 4).fill(255);
  for (let y = from; y <= to; y++) {
    for (let x = from; x <= to; x++) {
      if (x !== from && x !== to && y !== from && y !== to) continue;
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 0;
    }
  }
  return { width: size, height: size, data };
}

const at = (img: Pixels, x: number, y: number) => {
  const i = (y * img.width + x) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
};

describe('Farbeimer', () => {
  it('füllt die Fläche im Rahmen und wächst ein Pixel unter die Linie', () => {
    const img = framed();
    const r = floodFill(img, 5, 5, hexToRgba('#ff0000'));
    expect(r).not.toBeNull();
    expect(at(img, 5, 5)).toEqual([255, 0, 0]);
    expect(at(img, 3, 3)).toEqual([255, 0, 0]);
    // Die Linie wird von innen eingefärbt …
    expect(at(img, 2, 5)).toEqual([255, 0, 0]);
    // … draußen bleibt alles weiß.
    expect(at(img, 0, 0)).toEqual([255, 255, 255]);
    expect(at(img, 1, 5)).toEqual([255, 255, 255]);
    expect(r).toEqual({ x: 2, y: 2, w: 8, h: 8 });
  });

  it('füllt draußen rund um den Rahmen herum', () => {
    const img = framed();
    floodFill(img, 0, 0, hexToRgba('#2f6bff'));
    expect(at(img, 11, 11)).toEqual([47, 107, 255]);
    expect(at(img, 5, 5)).toEqual([255, 255, 255]);
  });

  it('tut nichts, wenn die Fläche schon diese Farbe hat oder der Klick daneben liegt', () => {
    const img = framed();
    expect(floodFill(img, 5, 5, [255, 255, 255, 255])).toBeNull();
    expect(floodFill(img, -1, 5, [255, 0, 0, 255])).toBeNull();
    expect(floodFill(img, 5, 40, [255, 0, 0, 255])).toBeNull();
  });

  it('nimmt ähnliche Farben mit (weiche Kanten), aber keine ganz anderen', () => {
    const img = framed();
    const i = (5 * img.width + 6) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 215; // hellgrauer Kantenpixel
    floodFill(img, 4, 4, hexToRgba('#00ff00'));
    expect(at(img, 6, 5)).toEqual([0, 255, 0]);
  });

  it('rechnet Farben hin und zurück', () => {
    expect(hexToRgba('#ff8a3d')).toEqual([255, 138, 61, 255]);
    expect(rgbaToHex([255, 138, 61, 255])).toBe('#ff8a3d');
    expect(hexToRgba('quatsch')).toEqual([0, 0, 0, 255]);
  });
});

describe('Rückgängig', () => {
  it('rechnet mit Rechtecken', () => {
    expect(unionRect(null, { x: 1, y: 2, w: 3, h: 4 })).toEqual({ x: 1, y: 2, w: 3, h: 4 });
    expect(unionRect({ x: 0, y: 0, w: 2, h: 2 }, { x: 5, y: 1, w: 1, h: 4 })).toEqual({ x: 0, y: 0, w: 6, h: 5 });
    expect(clampRect({ x: -3.5, y: 2.2, w: 10, h: 100 }, 8, 8)).toEqual({ x: 0, y: 2, w: 7, h: 6 });
    expect(clampRect({ x: 20, y: 0, w: 5, h: 5 }, 8, 8)).toBeNull();
    expect(rectAround(10, 10, 4, 20, 2)).toEqual({ x: 2, y: 8, w: 10, h: 14 });
  });

  it('schneidet einen Ausschnitt aus und setzt ihn wieder ein', () => {
    const img = framed();
    const before = cropPixels(img, { x: 1, y: 1, w: 4, h: 3 });
    expect(before.width).toBe(4);
    expect(before.data.length).toBe(4 * 3 * 4);
    floodFill(img, 0, 0, [9, 9, 9, 255]);
    expect(at(img, 1, 1)).toEqual([9, 9, 9]);
    pastePixels(img, before, 1, 1);
    expect(at(img, 1, 1)).toEqual([255, 255, 255]);
    expect(at(img, 2, 2)).toEqual([0, 0, 0]);
  });

  it('vergisst die ältesten Schritte, wenn der Speicher voll ist – der neueste bleibt', () => {
    const stack = [{ bytes: 50 }, { bytes: 30 }, { bytes: 40 }];
    expect(trimToBudget(stack, 100)).toEqual([{ bytes: 30 }, { bytes: 40 }]);
    expect(trimToBudget(stack, 500)).toBe(stack);
    expect(trimToBudget([{ bytes: 900 }], 100)).toEqual([{ bytes: 900 }]);
  });
});

describe('Malkasten', () => {
  it('wächst mit: Kleine haben weniger Werkzeuge', () => {
    expect(toolsFor('klein')).toEqual(['pinsel', 'eimer', 'stempel', 'radierer']);
    expect(toolsFor('mittel')).toContain('kreis');
    expect(toolsFor('mittel')).not.toContain('pipette');
    expect(toolsFor('gross')).toContain('pipette');
    expect(sizesFor('klein')).toHaveLength(3);
    expect(Math.min(...sizesFor('klein'))).toBeGreaterThan(Math.min(...sizesFor('gross')));
  });

  it('hat eindeutige Farben, Stempel und Aufgaben', () => {
    expect(new Set(COLORS.map((c) => c.hex)).size).toBe(COLORS.length);
    expect(COLORS.every((c) => /^#[0-9a-f]{6}$/.test(c.hex))).toBe(true);
    expect(new Set(STAMPS).size).toBe(STAMPS.length);
    expect(new Set(PAINT_MISSIONS.map((m) => m.id)).size).toBe(PAINT_MISSIONS.length);
  });

  it('hat sechs Ausmalbilder mit gültigen Pfaden', () => {
    expect(TEMPLATES).toHaveLength(6);
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(6);
    for (const t of TEMPLATES) {
      expect(t.paths.length).toBeGreaterThan(8);
      for (const d of t.paths) {
        expect(d).toMatch(/^M/);
        expect(d).not.toMatch(/NaN|undefined/);
        expect(d).toMatch(/^[MmLlHhVvCcSsQqTtAaZz0-9 .,-]+$/);
      }
    }
  });
});
