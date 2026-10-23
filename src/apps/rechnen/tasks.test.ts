import { describe, expect, it } from 'vitest';
import { seeded } from '../../core/random';
import { starsForScore } from '../shared/levelTypes';
import { RECHNEN_LEVELS, makeChoices, makeRound, makeTask, taskSpeech, type RechnenLevelId } from './tasks';

const ROUNDS = 300;

function many(level: RechnenLevelId) {
  const rng = seeded(level.length * 97);
  return Array.from({ length: ROUNDS }, () => makeTask(level, rng));
}

describe('Rechenaufgaben', () => {
  it('rechnet immer richtig', () => {
    for (const level of RECHNEN_LEVELS) {
      for (const t of many(level.id)) {
        const expected = t.op === '+' ? t.a + t.b : t.op === '−' ? t.a - t.b : t.op === '×' ? t.a * t.b : t.a;
        expect(t.answer).toBe(expected);
        expect(Number.isInteger(t.answer)).toBe(true);
        expect(t.answer).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('bleibt im Zahlenraum der Stufe', () => {
    for (const t of many('zaehlen')) {
      expect(t.answer).toBeGreaterThanOrEqual(1);
      expect(t.answer).toBeLessThanOrEqual(10);
    }
    for (const t of many('plus10')) expect(t.answer).toBeLessThanOrEqual(10);
    for (const t of many('minus10')) expect(t.a).toBeLessThanOrEqual(10);
    for (const t of many('bis20')) {
      expect(Math.max(t.a, t.b, t.answer)).toBeLessThanOrEqual(20);
      expect(t.b).toBeGreaterThanOrEqual(1);
    }
    for (const t of many('einmaleins')) {
      expect(t.a).toBeLessThanOrEqual(10);
      expect(t.b).toBeLessThanOrEqual(10);
    }
    for (const t of many('bis100')) {
      expect(t.answer).toBeLessThanOrEqual(100);
      expect(t.answer).toBeGreaterThanOrEqual(1);
    }
  });

  it('übt bis 20 vor allem den Zehnerübergang', () => {
    const tasks = many('bis20');
    const crossing = tasks.filter((t) =>
      t.op === '+' ? t.a < 10 && t.b < 10 && t.answer > 10 : t.a > 10 && t.answer < 10,
    );
    expect(crossing.length / tasks.length).toBeGreaterThan(0.5);
  });

  it('stellt in einer Runde keine Aufgabe doppelt', () => {
    for (const level of RECHNEN_LEVELS) {
      const round = makeRound(level.id, seeded(5));
      expect(round).toHaveLength(10);
      if (level.id === 'zaehlen') {
        for (let i = 1; i < round.length; i++) expect(round[i].answer).not.toBe(round[i - 1].answer);
      } else {
        expect(new Set(round.map((t) => t.key)).size).toBe(10);
      }
    }
  });

  it('bietet vier verschiedene Antworten mit der richtigen an', () => {
    const rng = seeded(9);
    for (let n = 1; n <= 10; n++) {
      const c = makeChoices(rng, n, 1, 10);
      expect(c).toHaveLength(4);
      expect(new Set(c).size).toBe(4);
      expect(c).toContain(n);
      expect(Math.min(...c)).toBeGreaterThanOrEqual(1);
      expect(Math.max(...c)).toBeLessThanOrEqual(10);
    }
  });

  it('liest die Aufgabe verständlich vor', () => {
    const t = makeTask('einmaleins', seeded(1));
    expect(taskSpeech(t)).toMatch(/^Was ist \d+ mal \d+\?$/);
  });

  it('vergibt Sterne nach richtigen Antworten', () => {
    expect(starsForScore(10, 10)).toBe(3);
    expect(starsForScore(9, 10)).toBe(3);
    expect(starsForScore(7, 10)).toBe(2);
    expect(starsForScore(3, 10)).toBe(1);
  });
});
