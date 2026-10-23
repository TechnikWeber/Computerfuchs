import { sameLetter } from './layout';

/*
 * Tippen als reine Funktion: Zielwort, bisher Getipptes, Fehler. Zwei Arten:
 * Für die Kleinen werden falsche Tasten einfach nicht angenommen. Später
 * landen sie im Text wie an einem echten Computer und müssen mit der
 * Rücktaste ⌫ wieder weg.
 */

export interface TypingOptions {
  /** Falsche Zeichen erscheinen im Text und müssen gelöscht werden. */
  insertWrong: boolean;
  /** Groß und klein müssen stimmen (Umschalttaste üben). */
  caseSensitive: boolean;
}

export interface TypingState {
  target: string;
  typed: string;
  /** Falsche Anschläge */
  errors: number;
  /** Richtige Anschläge */
  correct: number;
}

export type TypingResult = 'ok' | 'wrong' | 'blocked' | 'deleted' | 'ignored' | 'done';

/** Mehr falsche Zeichen am Stück nimmt das Feld nicht an – erst löschen. */
export const MAX_WRONG = 3;

export function startTyping(target: string): TypingState {
  return { target, typed: '', errors: 0, correct: 0 };
}

/** Wie viele Zeichen am Anfang stimmen schon? */
export function correctPrefix(state: TypingState): number {
  let i = 0;
  while (i < state.typed.length && i < state.target.length && state.typed[i] === state.target[i]) i++;
  return i;
}

export function isDone(state: TypingState): boolean {
  return state.typed === state.target;
}

/** Das nächste Zeichen, das getippt werden soll – oder null, wenn erst gelöscht werden muss. */
export function nextChar(state: TypingState): string | null {
  if (isDone(state)) return null;
  if (correctPrefix(state) < state.typed.length) return null;
  return state.target[state.typed.length] ?? null;
}

const matches = (key: string, expected: string, caseSensitive: boolean) =>
  caseSensitive ? key === expected : sameLetter(key, expected);

/** Eine Taste verarbeiten. `key` ist e.key aus dem Browser. */
export function typeKey(state: TypingState, key: string, opts: TypingOptions): { state: TypingState; result: TypingResult } {
  if (isDone(state)) return { state, result: 'ignored' };

  if (key === 'Backspace') {
    if (!opts.insertWrong || state.typed.length === 0) return { state, result: 'ignored' };
    return { state: { ...state, typed: state.typed.slice(0, -1) }, result: 'deleted' };
  }
  // Umschalt, Tote Tasten (^ ´), Pfeile … zählen nicht.
  if ([...key].length !== 1) return { state, result: 'ignored' };

  const prefix = correctPrefix(state);
  const clean = prefix === state.typed.length;
  const expected = state.target[state.typed.length];

  if (clean && expected !== undefined && matches(key, expected, opts.caseSensitive)) {
    // Das Zielzeichen eintragen – so steht bei „egal ob groß oder klein“ trotzdem das richtige da.
    const next = { ...state, typed: state.typed + expected, correct: state.correct + 1 };
    return { state: next, result: isDone(next) ? 'done' : 'ok' };
  }

  if (!opts.insertWrong) return { state: { ...state, errors: state.errors + 1 }, result: 'wrong' };
  if (state.typed.length - prefix >= MAX_WRONG) return { state, result: 'blocked' };
  return { state: { ...state, typed: state.typed + key, errors: state.errors + 1 }, result: 'wrong' };
}

/** Anschläge pro Minute aus richtigen Zeichen und Zeit. */
export function perMinute(correct: number, ms: number): number {
  if (ms <= 0) return 0;
  return Math.round((correct * 60_000) / ms);
}
