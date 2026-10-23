import { describe, expect, it } from 'vitest';
import { seeded } from '../../core/random';
import { codesFor, fingerFor, howToType, keyByCode, ROWS, strokeFor } from './layout';
import { deadEnds, distances, farthest, makeMaze, shortestPath, step } from './maze';
import { correctPrefix, nextChar, perMinute, startTyping, typeKey, MAX_WRONG, type TypingOptions } from './typing';

describe('deutsche Tastatur', () => {
  it('kennt Z und Y an der richtigen Stelle', () => {
    expect(strokeFor('z')).toEqual({ code: 'KeyY', shift: false, altGr: false });
    expect(strokeFor('Y')).toEqual({ code: 'KeyZ', shift: true, altGr: false });
  });

  it('kennt Umlaute, ß und Sonderzeichen', () => {
    expect(strokeFor('ö')?.code).toBe('Semicolon');
    expect(strokeFor('Ä')).toEqual({ code: 'Quote', shift: true, altGr: false });
    expect(strokeFor('ü')?.code).toBe('BracketLeft');
    expect(strokeFor('ß')).toEqual({ code: 'Minus', shift: false, altGr: false });
    expect(strokeFor('?')).toEqual({ code: 'Minus', shift: true, altGr: false });
    expect(strokeFor('@')).toEqual({ code: 'KeyQ', shift: false, altGr: true });
    expect(strokeFor('!')).toEqual({ code: 'Digit1', shift: true, altGr: false });
    expect(strokeFor('-')?.code).toBe('Slash');
    expect(strokeFor(' ')?.code).toBe('Space');
    expect(strokeFor('Ω')).toBeNull();
  });

  it('nimmt die Umschalttaste der anderen Hand', () => {
    // F ist links → rechte Umschalttaste; J ist rechts → linke.
    expect(codesFor('F')).toEqual(['KeyF', 'ShiftRight']);
    expect(codesFor('J')).toEqual(['KeyJ', 'ShiftLeft']);
    expect(codesFor('@')).toEqual(['KeyQ', 'AltRight']);
  });

  it('ordnet Finger zu', () => {
    expect(fingerFor('f')).toBe('li');
    expect(fingerFor('j')).toBe('ri');
    expect(fingerFor('a')).toBe('lp');
    expect(fingerFor('ö')).toBe('rp');
    expect(fingerFor(' ')).toBe('th');
  });

  it('erklärt Tastenkombinationen', () => {
    expect(howToType('@')).toBe('@ = AltGr + Q');
    expect(howToType('?')).toBe('? = ⇧ + ß');
    expect(howToType('H')).toBe('H = ⇧ + H');
    expect(howToType('h')).toBeNull();
  });

  it('hat gleich lange Reihen und jede Taste nur einmal', () => {
    const widths = ROWS.map((row) => row.reduce((sum, k) => sum + (k.w ?? 1), 0));
    expect(new Set(widths)).toEqual(new Set([15]));
    const codes = ROWS.flat().map((k) => k.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(keyByCode('NumpadEnter')?.code).toBe('Enter');
  });
});

describe('Tippen', () => {
  const easy: TypingOptions = { insertWrong: false, caseSensitive: false };
  const real: TypingOptions = { insertWrong: true, caseSensitive: true };

  it('nimmt bei den Kleinen falsche Tasten nicht an', () => {
    let s = startTyping('HUND');
    ({ state: s } = typeKey(s, 'h', easy));
    expect(s.typed).toBe('H');
    const r = typeKey(s, 'x', easy);
    expect(r.result).toBe('wrong');
    expect(r.state.typed).toBe('H');
    expect(r.state.errors).toBe(1);
  });

  it('meldet, wenn das Wort fertig ist', () => {
    let s = startTyping('EIS');
    let result = '';
    for (const ch of 'eis') ({ state: s, result } = typeKey(s, ch, easy));
    expect(result).toBe('done');
    expect(s.typed).toBe('EIS');
    expect(nextChar(s)).toBeNull();
  });

  it('lässt Fehler stehen, bis man sie löscht', () => {
    let s = startTyping('Hund');
    ({ state: s } = typeKey(s, 'H', real));
    ({ state: s } = typeKey(s, 'x', real));
    expect(s.typed).toBe('Hx');
    expect(correctPrefix(s)).toBe(1);
    expect(nextChar(s)).toBeNull();
    // Auch das richtige Zeichen zählt nicht, solange vorher etwas falsch ist.
    ({ state: s } = typeKey(s, 'u', real));
    expect(s.typed).toBe('Hxu');
    ({ state: s } = typeKey(s, 'Backspace', real));
    ({ state: s } = typeKey(s, 'Backspace', real));
    expect(s.typed).toBe('H');
    expect(nextChar(s)).toBe('u');
  });

  it('nimmt höchstens drei falsche Zeichen am Stück', () => {
    let s = startTyping('ab');
    for (let i = 0; i < MAX_WRONG; i++) ({ state: s } = typeKey(s, 'x', real));
    const r = typeKey(s, 'x', real);
    expect(r.result).toBe('blocked');
    expect(r.state.typed).toBe('xxx');
  });

  it('achtet auf groß und klein, wenn es soll', () => {
    const s = startTyping('Hund');
    expect(typeKey(s, 'h', real).result).toBe('wrong');
    expect(typeKey(s, 'H', real).result).toBe('ok');
    expect(typeKey(s, 'h', easy).result).toBe('ok');
  });

  it('übergeht Umschalt, tote Tasten und Pfeile', () => {
    const s = startTyping('a');
    for (const key of ['Shift', 'Dead', 'ArrowLeft', 'AltGraph']) expect(typeKey(s, key, real).result).toBe('ignored');
  });

  it('rechnet Anschläge pro Minute', () => {
    expect(perMinute(60, 60_000)).toBe(60);
    expect(perMinute(30, 15_000)).toBe(120);
    expect(perMinute(10, 0)).toBe(0);
  });
});

describe('Labyrinth', () => {
  it('erreicht jede Zelle', () => {
    for (const seed of [1, 2, 3, 42]) {
      const maze = makeMaze(9, 6, seeded(seed));
      const dist = distances(maze, { x: 0, y: 0 });
      expect(dist.flat().every((d) => d >= 0)).toBe(true);
    }
  });

  it('ist ein echtes Labyrinth: genau ein Weg zwischen zwei Zellen', () => {
    const maze = makeMaze(7, 5, seeded(7));
    // Ein Baum mit n Zellen hat n − 1 Durchgänge.
    let open = 0;
    for (let y = 0; y < maze.h; y++) for (let x = 0; x < maze.w; x++) if (step(maze, { x, y }, 'right')) open++;
    for (let y = 0; y < maze.h; y++) for (let x = 0; x < maze.w; x++) if (step(maze, { x, y }, 'down')) open++;
    expect(open).toBe(7 * 5 - 1);
  });

  it('lässt niemanden durch Wände oder aus dem Feld', () => {
    const maze = makeMaze(5, 4, seeded(3));
    expect(step(maze, { x: 0, y: 0 }, 'up')).toBeNull();
    expect(step(maze, { x: 0, y: 0 }, 'left')).toBeNull();
  });

  it('legt das Ziel ans weiteste Ende', () => {
    const maze = makeMaze(7, 5, seeded(11));
    const goal = farthest(maze, { x: 0, y: 0 });
    expect(shortestPath(maze, { x: 0, y: 0 }, goal)).toBe(goal.dist);
    expect(goal.dist).toBeGreaterThan(6);
    expect(deadEnds(maze).length).toBeGreaterThan(0);
  });
});
