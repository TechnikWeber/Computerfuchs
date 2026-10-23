import type { MapLevel } from '../shared/levelTypes';

export type TastaturLevelId = 'tastenzoo' | 'huepfhase' | 'pfeilweg' | 'sternenregen' | 'woerter' | 'zehnfinger' | 'tippprofi';

export interface TastaturLevel extends MapLevel {
  id: TastaturLevelId;
  intro: string;
  tiers: [string, string, string];
  /** Tasten für das Bild in der Einleitung */
  keys: string[];
}

/*
 * Erst einzelne Tasten finden, dann die besonderen Tasten (Leertaste,
 * Pfeile), dann ganze Wörter – und am Ende das Zehn-Finger-Schreiben.
 */
export const TASTATUR_LEVELS: TastaturLevel[] = [
  {
    id: 'tastenzoo',
    title: 'Tastenzoo',
    skill: 'Buchstaben finden',
    icon: 'monkey-face',
    color: '#ff7a2f',
    keys: ['KeyA', 'KeyF'],
    intro:
      'Im Tastenzoo wohnt hinter jeder Taste ein Tier. Schau dir das Bild an und drück die Taste mit dem richtigen Buchstaben – A wie Affe!',
    tiers: ['Die Taste leuchtet auf.', 'Nur der Buchstabe hilft dir.', 'Hör genau hin: Mit welchem Buchstaben fängt das Wort an?'],
  },
  {
    id: 'huepfhase',
    title: 'Hüpfhase',
    skill: 'Leertaste',
    icon: 'rabbit-face',
    color: '#2fbf62',
    keys: ['Space'],
    intro:
      'Der Hase will über die Igel springen! Drück die Leertaste – das ist die lange Taste ganz unten. Dann hüpft er.',
    tiers: ['Langsame Igel.', 'Schnellere Igel.', 'Manchmal kommen zwei Igel hintereinander!'],
  },
  {
    id: 'pfeilweg',
    title: 'Hamsterweg',
    skill: 'Pfeiltasten',
    icon: 'hamster',
    color: '#f5a524',
    keys: ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'],
    intro:
      'Der Hamster sucht seinen Käse! Mit den Pfeiltasten läuft er durch das Labyrinth: hoch, runter, links und rechts.',
    tiers: ['Ein kleines Labyrinth.', 'Ein größeres Labyrinth.', 'Sammle zuerst alle Kekse ein!'],
  },
  {
    id: 'sternenregen',
    title: 'Sternenregen',
    skill: 'Schnell tippen',
    icon: 'glowing-star',
    color: '#5b6cff',
    keys: ['KeyS', 'KeyT'],
    intro:
      'Sterne mit Buchstaben fallen vom Himmel. Drück schnell die passende Taste, dann fängst du den Stern, bevor er unten ankommt.',
    tiers: ['Ein Stern nach dem anderen.', 'Zwei Sterne auf einmal.', 'Drei Sterne – und auch Zahlen!'],
  },
  {
    id: 'woerter',
    title: 'Bilderwörter',
    skill: 'Wörter schreiben',
    icon: 'memo',
    color: '#ff4f87',
    keys: ['KeyH', 'KeyU', 'KeyN', 'KeyD'],
    intro: 'Schreib das Wort zum Bild! Buchstabe für Buchstabe, bis es ganz dasteht.',
    tiers: [
      'Kurze Wörter. Falsche Tasten zählen nicht.',
      'Längere Wörter. Wenn du dich vertippst, löschst du mit der Rücktaste ⌫.',
      'Richtig schreiben: groß und klein mit der Umschalttaste ⇧.',
    ],
  },
  {
    id: 'zehnfinger',
    title: 'Zehn Finger',
    skill: 'Grundstellung',
    icon: 'clapping-hands',
    color: '#14b0d4',
    keys: ['KeyF', 'KeyJ'],
    intro:
      'Profis tippen mit allen zehn Fingern. Leg deine Zeigefinger auf F und J – dort fühlst du kleine Huckel. Jeder Finger hat seine eigenen Tasten.',
    tiers: ['Nur F und J.', 'Die ganze Grundreihe.', 'Ganze Wörter aus der Grundreihe.'],
  },
  {
    id: 'tippprofi',
    title: 'Tipp-Profi',
    skill: 'Groß, Zeichen, Tempo',
    icon: 'trophy',
    color: '#8a6bff',
    keys: ['ShiftLeft', 'AltRight', 'KeyQ'],
    intro:
      'Jetzt wird es knifflig: Großbuchstaben mit der Umschalttaste, Satzzeichen – und das @ für E-Mail-Adressen. Zum Schluss ein Wettrennen gegen Flinn!',
    tiers: ['Großbuchstaben mit ⇧.', 'Satzzeichen und das @ (AltGr und Q).', 'Wettrennen: Wer tippt schneller?'],
  },
];
