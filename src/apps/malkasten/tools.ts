import type { EmojiName } from '../../core/emoji';
import type { AgeGroup } from '../../core/profile';

/*
 * Was der Malkasten kann – wie der Desktop wächst er mit: Kleine bekommen
 * Pinsel, Farbeimer, Stempel und Radierer, Größere dazu Formen, die Großen
 * noch Pipette und eigene Farben.
 */

export type ToolId = 'pinsel' | 'radierer' | 'eimer' | 'stempel' | 'linie' | 'rechteck' | 'kreis' | 'pipette';

export const TOOL_NAMES: Record<ToolId, string> = {
  pinsel: 'Pinsel',
  radierer: 'Radierer',
  eimer: 'Farbeimer',
  stempel: 'Stempel',
  linie: 'Linie',
  rechteck: 'Rechteck',
  kreis: 'Kreis',
  pipette: 'Pipette',
};

/** Was Flinn zum Werkzeug sagt, wenn man es wählt */
export const TOOL_HINTS: Record<ToolId, string> = {
  pinsel: 'Halt die Maustaste gedrückt und mal los.',
  radierer: 'Der Radierer malt weiß – so verschwinden Striche wieder.',
  eimer: 'Klick in eine Fläche – der Farbeimer füllt sie bis zum Rand.',
  stempel: 'Such dir unten einen Stempel aus und klick aufs Bild.',
  linie: 'Drück die Maustaste, zieh und lass los – schon ist die Linie da.',
  rechteck: 'Zieh mit gedrückter Maustaste ein Rechteck auf.',
  kreis: 'Zieh mit gedrückter Maustaste einen Kreis auf.',
  pipette: 'Klick auf eine Stelle im Bild – die Pipette nimmt ihre Farbe auf.',
};

export function toolsFor(group: AgeGroup): ToolId[] {
  if (group === 'klein') return ['pinsel', 'eimer', 'stempel', 'radierer'];
  if (group === 'mittel') return ['pinsel', 'eimer', 'stempel', 'radierer', 'linie', 'rechteck', 'kreis'];
  return ['pinsel', 'eimer', 'stempel', 'radierer', 'linie', 'rechteck', 'kreis', 'pipette'];
}

export const isShape = (t: ToolId): t is 'linie' | 'rechteck' | 'kreis' => t === 'linie' || t === 'rechteck' || t === 'kreis';

export interface PaintColor {
  hex: string;
  name: string;
}

export const COLORS: PaintColor[] = [
  { hex: '#ff4d5e', name: 'Rot' },
  { hex: '#ff8a3d', name: 'Orange' },
  { hex: '#ffd43b', name: 'Gelb' },
  { hex: '#9be15d', name: 'Hellgrün' },
  { hex: '#2fbf62', name: 'Grün' },
  { hex: '#14b0d4', name: 'Türkis' },
  { hex: '#7cc8ff', name: 'Hellblau' },
  { hex: '#2f6bff', name: 'Blau' },
  { hex: '#8a6bff', name: 'Lila' },
  { hex: '#ff6fae', name: 'Rosa' },
  { hex: '#ffc2d9', name: 'Hellrosa' },
  { hex: '#f5c79b', name: 'Hautfarbe' },
  { hex: '#8b5a2b', name: 'Braun' },
  { hex: '#8a8fa8', name: 'Grau' },
  { hex: '#23263b', name: 'Schwarz' },
  { hex: '#ffffff', name: 'Weiß' },
];

export const colorName = (hex: string) => COLORS.find((c) => c.hex === hex.toLowerCase())?.name ?? 'deine Farbe';

/** Pinselgrößen in Pixeln der Zeichenfläche (1440 breit) */
export function sizesFor(group: AgeGroup): number[] {
  return group === 'klein' ? [18, 36, 64] : [8, 18, 36, 64];
}

export const SIZE_NAMES = ['dünn', 'mittel', 'dick', 'ganz dick'];

export const STAMPS: EmojiName[] = [
  'star', 'red-heart', 'sparkles', 'sunflower', 'tulip', 'butterfly', 'lady-beetle', 'rainbow',
  'sun-behind-small-cloud', 'rocket', 'ringed-planet', 'cat-face', 'dog-face', 'tropical-fish', 'unicorn', 't-rex',
];

export const STAMP_SIZES = [100, 170, 260];
export const STAMP_SIZE_NAMES = ['klein', 'mittel', 'groß'];

export interface PaintMission {
  id: string;
  text: string;
}

/** Flinns Aufgaben – jede bringt einmal Bytes, wie in der Dateien-App. */
export const PAINT_MISSIONS: PaintMission[] = [
  { id: 'strich', text: 'Mal mit dem Pinsel einen Strich.' },
  { id: 'farbe', text: 'Such dir unten eine andere Farbe aus und mal weiter.' },
  { id: 'eimer', text: 'Nimm den Farbeimer und klick in eine Fläche. Mit einem Ausmalbild geht das besonders gut.' },
  { id: 'zurueck', text: 'Ups! Mach einen Schritt rückgängig – mit dem Pfeil oben.' },
  { id: 'speichern', text: 'Speichere dein Bild. Es landet im Ordner „Bilder“.' },
  { id: 'hintergrund', text: 'Mach dein Bild zum Hintergrund für deinen Desktop.' },
];
