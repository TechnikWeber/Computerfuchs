import { describe, expect, it } from 'vitest';
import { MIN_H, MIN_W, clampRect, initialWm, wmReducer, type WmState } from './windows';

const area = { w: 1200, h: 700 };

function open(state: WmState, appId: string, max = false): WmState {
  return wmReducer(state, { type: 'open', appId, w: 800, h: 500, area, max });
}

describe('Fensterverwaltung', () => {
  it('öffnet ein Fenster mittig und fokussiert es', () => {
    const s = open(initialWm, 'maus');
    expect(s.wins).toHaveLength(1);
    expect(s.focused).toBe(s.wins[0].id);
    expect(s.wins[0].x).toBe(200);
    expect(s.wins[0].mode).toBe('normal');
  });

  it('öffnet jede App nur einmal und holt sie nach vorn', () => {
    let s = open(initialWm, 'maus');
    s = open(s, 'rechnen');
    const mausId = s.wins[0].id;
    s = open(s, 'maus');
    expect(s.wins).toHaveLength(2);
    expect(s.focused).toBe(mausId);
    expect(s.wins[0].z).toBeGreaterThan(s.wins[1].z);
  });

  it('verkleinert und stellt wieder her – auch ein großes Fenster bleibt groß', () => {
    let s = open(initialWm, 'maus', true);
    const id = s.wins[0].id;
    s = wmReducer(s, { type: 'minimize', id });
    expect(s.wins[0].mode).toBe('min');
    expect(s.focused).toBeNull();
    s = wmReducer(s, { type: 'restore', id });
    expect(s.wins[0].mode).toBe('max');
    expect(s.focused).toBe(id);
  });

  it('gibt beim Schließen den Fokus an das oberste Fenster', () => {
    let s = open(initialWm, 'a');
    s = open(s, 'b');
    s = open(s, 'c');
    const [a, b, c] = s.wins.map((w) => w.id);
    s = wmReducer(s, { type: 'focus', id: a });
    s = wmReducer(s, { type: 'close', id: a });
    expect(s.focused).toBe(c);
    s = wmReducer(s, { type: 'minimize', id: c });
    expect(s.focused).toBe(b);
  });

  it('fokussieren ohne Änderung liefert denselben Zustand', () => {
    const s = open(initialWm, 'maus');
    expect(wmReducer(s, { type: 'focus', id: s.wins[0].id })).toBe(s);
  });

  it('verschiebt nur normale Fenster und hält die Titelleiste erreichbar', () => {
    let s = open(initialWm, 'maus');
    const id = s.wins[0].id;
    s = wmReducer(s, { type: 'move', id, x: 5000, y: -300, area });
    expect(s.wins[0].x).toBe(area.w - 120);
    expect(s.wins[0].y).toBe(0);
    s = wmReducer(s, { type: 'toggleMax', id });
    const before = s.wins[0];
    s = wmReducer(s, { type: 'move', id, x: 10, y: 10, area });
    expect(s.wins[0]).toEqual(before);
  });

  it('hält beim Ändern der Größe die Mindestgröße ein', () => {
    let s = open(initialWm, 'maus');
    const id = s.wins[0].id;
    s = wmReducer(s, { type: 'resize', id, x: 10, y: 10, w: 50, h: 20, area });
    expect(s.wins[0].w).toBe(MIN_W);
    expect(s.wins[0].h).toBe(MIN_H);
  });

  it('passt Fenster an einen kleineren Bildschirm an', () => {
    const r = clampRect({ x: 900, y: 600, w: 1100, h: 650 }, { w: 800, h: 500 });
    expect(r.w).toBe(800);
    expect(r.h).toBe(500);
    expect(r.x).toBeLessThanOrEqual(800 - 120);
    expect(r.y).toBeLessThanOrEqual(500 - 56);
  });
});
