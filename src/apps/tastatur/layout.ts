/*
 * Die deutsche Tastatur (QWERTZ) – nach den Tastencodes des Browsers.
 * e.code nennt die Stelle der Taste (nach US-Vorbild, darum ist „KeyY“ bei
 * uns das Z), e.key das Zeichen, das herauskommt. Die Spiele prüfen e.key,
 * die Bildschirmtastatur leuchtet über e.code.
 */

export type Finger = 'lp' | 'lr' | 'lm' | 'li' | 'th' | 'ri' | 'rm' | 'rr' | 'rp';

export interface KeyDef {
  code: string;
  /** Beschriftung unten (ohne Umschalt) */
  label: string;
  /** Beschriftung oben (mit Umschalt) */
  shift?: string;
  /** Drittbelegung mit AltGr, z. B. @ */
  alt?: string;
  /** Breite in Tasten */
  w?: number;
  finger: Finger;
  /** Taste mit Tastmarke (F und J) */
  bump?: boolean;
}

const k = (code: string, label: string, finger: Finger, extra: Partial<KeyDef> = {}): KeyDef => ({ code, label, finger, ...extra });

export const ROWS: KeyDef[][] = [
  [
    k('Backquote', '^', 'lp', { shift: '°' }),
    k('Digit1', '1', 'lp', { shift: '!' }),
    k('Digit2', '2', 'lr', { shift: '"' }),
    k('Digit3', '3', 'lm', { shift: '§' }),
    k('Digit4', '4', 'li', { shift: '$' }),
    k('Digit5', '5', 'li', { shift: '%' }),
    k('Digit6', '6', 'ri', { shift: '&' }),
    k('Digit7', '7', 'ri', { shift: '/', alt: '{' }),
    k('Digit8', '8', 'rm', { shift: '(', alt: '[' }),
    k('Digit9', '9', 'rr', { shift: ')', alt: ']' }),
    k('Digit0', '0', 'rp', { shift: '=', alt: '}' }),
    k('Minus', 'ß', 'rp', { shift: '?', alt: '\\' }),
    k('Equal', '´', 'rp', { shift: '`' }),
    k('Backspace', '⌫', 'rp', { w: 2 }),
  ],
  [
    k('Tab', '↹', 'lp', { w: 1.5 }),
    k('KeyQ', 'q', 'lp', { alt: '@' }),
    k('KeyW', 'w', 'lr'),
    k('KeyE', 'e', 'lm', { alt: '€' }),
    k('KeyR', 'r', 'li'),
    k('KeyT', 't', 'li'),
    k('KeyY', 'z', 'ri'),
    k('KeyU', 'u', 'ri'),
    k('KeyI', 'i', 'rm'),
    k('KeyO', 'o', 'rr'),
    k('KeyP', 'p', 'rp'),
    k('BracketLeft', 'ü', 'rp'),
    k('BracketRight', '+', 'rp', { shift: '*', alt: '~' }),
    k('Enter', '↵', 'rp', { w: 1.5 }),
  ],
  [
    k('CapsLock', '⇪', 'lp', { w: 1.75 }),
    k('KeyA', 'a', 'lp'),
    k('KeyS', 's', 'lr'),
    k('KeyD', 'd', 'lm'),
    k('KeyF', 'f', 'li', { bump: true }),
    k('KeyG', 'g', 'li'),
    k('KeyH', 'h', 'ri'),
    k('KeyJ', 'j', 'ri', { bump: true }),
    k('KeyK', 'k', 'rm'),
    k('KeyL', 'l', 'rr'),
    k('Semicolon', 'ö', 'rp'),
    k('Quote', 'ä', 'rp'),
    k('Backslash', '#', 'rp', { shift: "'" }),
    k('Enter2', '', 'rp', { w: 1.25 }),
  ],
  [
    k('ShiftLeft', '⇧', 'lp', { w: 1.25 }),
    k('IntlBackslash', '<', 'lp', { shift: '>', alt: '|' }),
    k('KeyZ', 'y', 'lp'),
    k('KeyX', 'x', 'lr'),
    k('KeyC', 'c', 'lm'),
    k('KeyV', 'v', 'li'),
    k('KeyB', 'b', 'li'),
    k('KeyN', 'n', 'ri'),
    k('KeyM', 'm', 'ri'),
    k('Comma', ',', 'rm', { shift: ';' }),
    k('Period', '.', 'rr', { shift: ':' }),
    k('Slash', '-', 'rp', { shift: '_' }),
    k('ShiftRight', '⇧', 'rp', { w: 2.75 }),
  ],
  [
    k('ControlLeft', 'Strg', 'lp', { w: 1.5 }),
    k('AltLeft', 'Alt', 'th', { w: 1.5 }),
    k('Space', '', 'th', { w: 9 }),
    k('AltRight', 'AltGr', 'th', { w: 1.5 }),
    k('ControlRight', 'Strg', 'rp', { w: 1.5 }),
  ],
];

const BY_CODE = new Map(ROWS.flat().map((key) => [key.code, key]));

export function keyByCode(code: string): KeyDef | undefined {
  return BY_CODE.get(code === 'NumpadEnter' ? 'Enter' : code);
}

/** Linke Hand? Dann drückt die rechte Hand die Umschalttaste – so lernt man es beim Zehn-Finger-Schreiben. */
export function isLeftHand(finger: Finger): boolean {
  return finger.startsWith('l');
}

export const FINGER_NAME: Record<Finger, string> = {
  lp: 'linker kleiner Finger',
  lr: 'linker Ringfinger',
  lm: 'linker Mittelfinger',
  li: 'linker Zeigefinger',
  th: 'Daumen',
  ri: 'rechter Zeigefinger',
  rm: 'rechter Mittelfinger',
  rr: 'rechter Ringfinger',
  rp: 'rechter kleiner Finger',
};

/** Wie man ein Zeichen tippt: Taste plus Umschalt oder AltGr. */
export interface Stroke {
  code: string;
  shift: boolean;
  altGr: boolean;
}

const SPECIAL: Record<string, Stroke> = {};
for (const key of ROWS.flat()) {
  if (key.shift) SPECIAL[key.shift] = { code: key.code, shift: true, altGr: false };
  if (key.alt) SPECIAL[key.alt] = { code: key.code, shift: false, altGr: true };
  if (key.label.length === 1 && !/[a-zäöü]/.test(key.label) && !/[⌫↹↵⇪⇧]/.test(key.label)) {
    SPECIAL[key.label] = { code: key.code, shift: false, altGr: false };
  }
}
SPECIAL[' '] = { code: 'Space', shift: false, altGr: false };
SPECIAL['\n'] = { code: 'Enter', shift: false, altGr: false };

const LETTER_CODE: Record<string, string> = { z: 'KeyY', y: 'KeyZ', ä: 'Quote', ö: 'Semicolon', ü: 'BracketLeft', ß: 'Minus' };

/** Welche Taste(n) für ein Zeichen? null, wenn es das auf der Tastatur nicht gibt. */
export function strokeFor(ch: string): Stroke | null {
  if (ch.length !== 1) return null;
  if (SPECIAL[ch] && !/\p{L}/u.test(ch)) return SPECIAL[ch];
  const lower = ch.toLocaleLowerCase('de');
  const upper = ch !== lower;
  if (ch === 'ß') return { code: 'Minus', shift: false, altGr: false };
  if (LETTER_CODE[lower]) return { code: LETTER_CODE[lower], shift: upper, altGr: false };
  if (/^[a-z]$/.test(lower)) return { code: `Key${lower.toUpperCase()}`, shift: upper, altGr: false };
  return null;
}

/** Codes, die für ein Zeichen leuchten sollen – mit der richtigen Umschalttaste. */
export function codesFor(ch: string): string[] {
  const s = strokeFor(ch);
  if (!s) return [];
  const out = [s.code];
  if (s.shift) {
    const finger = keyByCode(s.code)?.finger ?? 'rp';
    out.push(isLeftHand(finger) ? 'ShiftRight' : 'ShiftLeft');
  }
  if (s.altGr) out.push('AltRight');
  return out;
}

/** Finger für ein Zeichen, z. B. für „Nimm den linken Zeigefinger“. */
export function fingerFor(ch: string): Finger | null {
  const s = strokeFor(ch);
  return s ? (keyByCode(s.code)?.finger ?? null) : null;
}

/** Beschriftung, wie sie auf der Taste steht – Buchstaben groß, wie auf echten Tastaturen. */
export function capLabel(key: KeyDef): string {
  return /^[a-zäöü]$/.test(key.label) ? key.label.toLocaleUpperCase('de') : key.label;
}

/** „@ = AltGr + Q“ – wie man ein Zeichen tippt, in Worten. */
export function howToType(ch: string): string | null {
  const s = strokeFor(ch);
  if (!s) return null;
  const key = keyByCode(s.code);
  if (!key) return null;
  const parts = [s.shift ? '⇧' : '', s.altGr ? 'AltGr' : '', ch === ' ' ? 'Leertaste' : capLabel(key)].filter(Boolean);
  return parts.length > 1 ? `${ch} = ${parts.join(' + ')}` : null;
}

/** Vergleich für Spiele, in denen Groß und Klein egal sind. */
export function sameLetter(a: string, b: string): boolean {
  return a.toLocaleLowerCase('de') === b.toLocaleLowerCase('de');
}

/** Ist die Tastatur auf Deutsch gestellt? Nur Chrome und Edge können das sagen; sonst „unbekannt“. */
export async function detectLayout(): Promise<'de' | 'other' | 'unknown'> {
  const kb = (navigator as Navigator & { keyboard?: { getLayoutMap?: () => Promise<Map<string, string>> } }).keyboard;
  if (!kb?.getLayoutMap) return 'unknown';
  try {
    const map = await kb.getLayoutMap();
    const z = map.get('KeyY');
    if (!z) return 'unknown';
    return z === 'z' && map.get('Semicolon') === 'ö' ? 'de' : 'other';
  } catch {
    return 'unknown';
  }
}
