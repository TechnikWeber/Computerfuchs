import type { EmojiName } from './emoji';

/*
 * Der Geheimcode fürs Profil ist das erste Passwort der Kinder. Echte
 * Sicherheit ist das nicht – alles liegt im Browser, und Erwachsene können
 * den Code jederzeit zurücksetzen. Gespeichert wird trotzdem nur eine
 * Prüfsumme, damit der Code nicht im Klartext in der Spielstand-Datei steht.
 */

export type PinKind = 'bilder' | 'zahlen';
export const PIN_LENGTH = 4;

/** Neun Bilder in einem 3×3-Feld. */
export const PIN_PICTURES: readonly EmojiName[] = [
  'fox', 'cat-face', 'dog-face', 'rabbit-face', 'frog', 'owl', 'panda', 'lion', 'penguin',
];

export interface Pin {
  kind: PinKind;
  hash: string;
}

/** FNV-1a, 32 Bit, als Hex – klein und ohne Abhängigkeiten. */
export function hashPin(profileId: string, kind: PinKind, code: string): string {
  let h = 0x811c9dc5;
  const text = `${profileId}:${kind}:${code}`;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function makePin(profileId: string, kind: PinKind, code: string): Pin {
  return { kind, hash: hashPin(profileId, kind, code) };
}

export function checkPin(pin: Pin, profileId: string, code: string): boolean {
  return hashPin(profileId, pin.kind, code) === pin.hash;
}

export function isValidCode(kind: PinKind, code: string): boolean {
  return code.length === PIN_LENGTH && (kind === 'zahlen' ? /^\d{4}$/.test(code) : /^[0-8]{4}$/.test(code));
}
