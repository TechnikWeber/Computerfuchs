import type { EmojiName } from '../../core/emoji';
import { randInt, shuffle, type Rng } from '../../core/random';
import type { MapLevel } from '../shared/levelTypes';

/*
 * Aufgaben werden erzeugt, nicht abgeschrieben: So gibt es unendlich viele,
 * und jede Runde ist neu. Die Zahlenräume folgen der Grundschule –
 * bis 10, bis 20 mit Zehnerübergang, das Einmaleins, bis 100.
 */

export type RechnenLevelId = 'zaehlen' | 'plus10' | 'minus10' | 'bis20' | 'einmaleins' | 'bis100';

export interface RechnenLevel extends MapLevel {
  id: RechnenLevelId;
  age: string;
  intro: string;
  /** Antwort aus Knöpfen wählen oder selbst eintippen */
  input: 'choice' | 'pad';
  /** Welche Hilfe-Bilder es gibt */
  visual: 'objects' | 'tenframe' | 'array' | 'none';
}

export const RECHNEN_LEVELS: RechnenLevel[] = [
  {
    id: 'zaehlen',
    title: 'Zählen',
    skill: 'bis 10',
    icon: 'red-apple',
    color: '#ff4d5e',
    age: 'ab 4',
    input: 'choice',
    visual: 'objects',
    intro: 'Wie viele siehst du? Zähle genau und klick dann auf die richtige Zahl.',
  },
  {
    id: 'plus10',
    title: 'Plus',
    skill: 'bis 10',
    icon: 'strawberry',
    color: '#ff7a2f',
    age: 'ab 5',
    input: 'pad',
    visual: 'objects',
    intro: 'Zähle zusammen: Wie viele sind es zusammen? Tippe die Zahl ein – mit den Knöpfen oder mit der Tastatur.',
  },
  {
    id: 'minus10',
    title: 'Minus',
    skill: 'bis 10',
    icon: 'cookie',
    color: '#f5a524',
    age: 'ab 6',
    input: 'pad',
    visual: 'objects',
    intro: 'Ein paar werden weggenommen. Wie viele bleiben übrig?',
  },
  {
    id: 'bis20',
    title: 'Plus und Minus',
    skill: 'bis 20',
    icon: 'lady-beetle',
    color: '#2fbf62',
    age: 'ab 6',
    input: 'pad',
    visual: 'tenframe',
    intro: 'Rechne bis 20! Wenn du Hilfe brauchst, zeigt dir das Zwanzigerfeld die Punkte.',
  },
  {
    id: 'einmaleins',
    title: 'Einmaleins',
    skill: '1 × 1',
    icon: 'star',
    color: '#2f9bff',
    age: 'ab 7',
    input: 'pad',
    visual: 'array',
    intro: 'Mal-Aufgaben! 3 mal 4 heißt: 3 Reihen mit je 4 Punkten.',
  },
  {
    id: 'bis100',
    title: 'Kopfrechnen',
    skill: 'bis 100',
    icon: 'abacus',
    color: '#8a6bff',
    age: 'ab 8',
    input: 'pad',
    visual: 'none',
    intro: 'Plus und Minus bis 100 – ganz im Kopf. Tipp: erst die Zehner, dann die Einer.',
  },
];

export type Op = '+' | '−' | '×' | 'count';

export interface CountItem {
  emoji: EmojiName;
  plural: string;
}

export const ITEMS: CountItem[] = [
  { emoji: 'red-apple', plural: 'Äpfel' },
  { emoji: 'strawberry', plural: 'Erdbeeren' },
  { emoji: 'lady-beetle', plural: 'Marienkäfer' },
  { emoji: 'butterfly', plural: 'Schmetterlinge' },
  { emoji: 'duck', plural: 'Enten' },
  { emoji: 'star', plural: 'Sterne' },
  { emoji: 'cupcake', plural: 'Muffins' },
  { emoji: 'balloon', plural: 'Luftballons' },
  // Keine Kirschen: Das Bild zeigt zwei Stück und zählt doch als eins.
  { emoji: 'fish', plural: 'Fische' },
  { emoji: 'cookie', plural: 'Kekse' },
  { emoji: 'soccer-ball', plural: 'Bälle' },
  { emoji: 'doughnut', plural: 'Donuts' },
];

export interface MathTask {
  key: string;
  op: Op;
  a: number;
  b: number;
  answer: number;
  item: CountItem;
  /** Nur bei Auswahl-Aufgaben */
  choices?: number[];
}

function task(op: Op, a: number, b: number, item: CountItem): MathTask {
  const answer = op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a;
  return { key: `${a}${op}${b}`, op, a, b, answer, item };
}

/** Vier verschiedene Antworten, darunter die richtige, alle im Bereich. */
export function makeChoices(rng: Rng, answer: number, min: number, max: number, count = 4): number[] {
  const set = new Set([answer]);
  let spread = 1;
  while (set.size < count && spread < 50) {
    const candidates = shuffle(rng, [answer - spread, answer + spread]).filter((n) => n >= min && n <= max);
    for (const c of candidates) if (set.size < count) set.add(c);
    spread++;
  }
  // Der Größe nach – so finden auch Kleine die Zahl schneller.
  return [...set].sort((x, y) => x - y);
}

export function makeTask(level: RechnenLevelId, rng: Rng): MathTask {
  const item = ITEMS[Math.floor(rng() * ITEMS.length)];
  switch (level) {
    case 'zaehlen': {
      const n = randInt(rng, 1, 10);
      return { ...task('count', n, 0, item), key: `${n}`, choices: makeChoices(rng, n, 1, 10) };
    }
    case 'plus10': {
      const a = randInt(rng, 1, 9);
      return task('+', a, randInt(rng, 1, 10 - a), item);
    }
    case 'minus10': {
      const a = randInt(rng, 2, 10);
      return task('−', a, randInt(rng, 1, a), item);
    }
    case 'bis20': {
      // Meist mit Zehnerübergang – genau der ist die Hürde in Klasse 1.
      const crossing = rng() < 0.7;
      if (rng() < 0.5) {
        if (crossing) {
          const a = randInt(rng, 3, 9);
          return task('+', a, randInt(rng, 11 - a, 9), item);
        }
        const a = randInt(rng, 1, 18);
        return task('+', a, randInt(rng, 1, 20 - a), item);
      }
      if (crossing) {
        const a = randInt(rng, 11, 18);
        return task('−', a, randInt(rng, a - 9, 9), item);
      }
      const a = randInt(rng, 2, 20);
      return task('−', a, randInt(rng, 1, a), item);
    }
    case 'einmaleins': {
      const easy = rng() < 0.15;
      const a = easy ? (rng() < 0.5 ? 1 : 10) : randInt(rng, 2, 9);
      const b = randInt(rng, 2, 10);
      return rng() < 0.5 ? task('×', a, b, item) : task('×', b, a, item);
    }
    case 'bis100': {
      if (rng() < 0.5) {
        const a = randInt(rng, 11, 88);
        return task('+', a, randInt(rng, 2, Math.min(60, 100 - a)), item);
      }
      const a = randInt(rng, 20, 99);
      return task('−', a, randInt(rng, 2, Math.min(60, a - 1)), item);
    }
  }
}

/** Eine Runde: verschiedene Aufgaben, beim Zählen nie zweimal dieselbe Zahl hintereinander. */
export function makeRound(level: RechnenLevelId, rng: Rng, count = 10): MathTask[] {
  const out: MathTask[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard++ < 500) {
    const t = makeTask(level, rng);
    if (level === 'zaehlen') {
      if (out.length > 0 && out[out.length - 1].answer === t.answer) continue;
    } else if (seen.has(t.key)) continue;
    seen.add(t.key);
    out.push(t);
  }
  return out;
}

export function taskText(t: MathTask): string {
  return t.op === 'count' ? 'Wie viele?' : `${t.a} ${t.op} ${t.b} =`;
}

export function taskSpeech(t: MathTask): string {
  switch (t.op) {
    case 'count':
      return `Wie viele ${t.item.plural} siehst du?`;
    case '+':
      return `Was ist ${t.a} plus ${t.b}?`;
    case '−':
      return `Was ist ${t.a} minus ${t.b}?`;
    case '×':
      return `Was ist ${t.a} mal ${t.b}?`;
  }
}
