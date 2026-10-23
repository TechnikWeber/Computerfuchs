import type { EmojiName } from '../../core/emoji';

/*
 * Was getippt wird. Die Wörter passen zu den Bildern, die es gibt – und zu
 * dem, was Kinder in der ersten und zweiten Klasse lesen.
 */

export interface PictureWord {
  word: string;
  emoji: EmojiName;
}

/** Tierisches ABC für den Tastenzoo: Buchstabe wie im Anlaut. */
export const ANLAUT: PictureWord[] = [
  { word: 'Affe', emoji: 'monkey-face' },
  { word: 'Apfel', emoji: 'red-apple' },
  { word: 'Biene', emoji: 'honeybee' },
  { word: 'Banane', emoji: 'banana' },
  { word: 'Ball', emoji: 'soccer-ball' },
  { word: 'Dino', emoji: 't-rex' },
  { word: 'Delfin', emoji: 'dolphin' },
  { word: 'Ente', emoji: 'duck' },
  { word: 'Eule', emoji: 'owl' },
  { word: 'Einhorn', emoji: 'unicorn' },
  { word: 'Fuchs', emoji: 'fox' },
  { word: 'Frosch', emoji: 'frog' },
  { word: 'Fisch', emoji: 'fish' },
  { word: 'Geschenk', emoji: 'wrapped-gift' },
  { word: 'Gitarre', emoji: 'guitar' },
  { word: 'Gespenst', emoji: 'ghost' },
  { word: 'Hund', emoji: 'dog-face' },
  { word: 'Hase', emoji: 'rabbit-face' },
  { word: 'Herz', emoji: 'red-heart' },
  { word: 'Igel', emoji: 'hedgehog' },
  { word: 'Jo-Jo', emoji: 'yo-yo' },
  { word: 'Katze', emoji: 'cat-face' },
  { word: 'Krone', emoji: 'crown' },
  { word: 'Keks', emoji: 'cookie' },
  { word: 'Löwe', emoji: 'lion' },
  { word: 'Lolli', emoji: 'lollipop' },
  { word: 'Maus', emoji: 'mouse-face' },
  { word: 'Mond', emoji: 'crescent-moon' },
  { word: 'Muschel', emoji: 'spiral-shell' },
  { word: 'Oktopus', emoji: 'octopus' },
  { word: 'Panda', emoji: 'panda' },
  { word: 'Pinguin', emoji: 'penguin' },
  { word: 'Qualle', emoji: 'jellyfish' },
  { word: 'Rakete', emoji: 'rocket' },
  { word: 'Roboter', emoji: 'robot' },
  { word: 'Regenbogen', emoji: 'rainbow' },
  { word: 'Sonnenblume', emoji: 'sunflower' },
  { word: 'Seehund', emoji: 'seal' },
  { word: 'Tiger', emoji: 'tiger-face' },
  { word: 'Teddy', emoji: 'teddy-bear' },
  { word: 'Tulpe', emoji: 'tulip' },
  { word: 'Uhr', emoji: 'mantelpiece-clock' },
  { word: 'Wal', emoji: 'spouting-whale' },
  { word: 'Waschbär', emoji: 'raccoon' },
  { word: 'Zahlen', emoji: 'input-numbers' },
];

/** Für den Anfang: Buchstaben, die man gut hört und leicht findet. */
export const EASY_LETTERS = ['a', 'e', 'i', 'o', 'm', 'l', 'h', 'f', 'b', 'd', 'k', 't'];

/** Stufe 1: kurze Wörter, alle in Großbuchstaben, wie auf den Tasten. */
export const WORDS_SHORT: PictureWord[] = [
  { word: 'HUND', emoji: 'dog-face' },
  { word: 'MAUS', emoji: 'mouse-face' },
  { word: 'ENTE', emoji: 'duck' },
  { word: 'EULE', emoji: 'owl' },
  { word: 'IGEL', emoji: 'hedgehog' },
  { word: 'BALL', emoji: 'soccer-ball' },
  { word: 'EIS', emoji: 'soft-ice-cream' },
  { word: 'HASE', emoji: 'rabbit-face' },
  { word: 'KEKS', emoji: 'cookie' },
  { word: 'AFFE', emoji: 'monkey-face' },
  { word: 'WAL', emoji: 'spouting-whale' },
  { word: 'MOND', emoji: 'crescent-moon' },
  { word: 'UHR', emoji: 'mantelpiece-clock' },
  { word: 'HERZ', emoji: 'red-heart' },
];

/** Stufe 2: längere Wörter, auch mit Ä, Ö und Ü. */
export const WORDS_LONG: PictureWord[] = [
  { word: 'KATZE', emoji: 'cat-face' },
  { word: 'FUCHS', emoji: 'fox' },
  { word: 'PANDA', emoji: 'panda' },
  { word: 'LÖWE', emoji: 'lion' },
  { word: 'BÄR', emoji: 'bear' },
  { word: 'BIENE', emoji: 'honeybee' },
  { word: 'ROBOTER', emoji: 'robot' },
  { word: 'RAKETE', emoji: 'rocket' },
  { word: 'KRONE', emoji: 'crown' },
  { word: 'TIGER', emoji: 'tiger-face' },
  { word: 'DELFIN', emoji: 'dolphin' },
  { word: 'FROSCH', emoji: 'frog' },
  { word: 'QUALLE', emoji: 'jellyfish' },
  { word: 'BANANE', emoji: 'banana' },
  { word: 'KÄSE', emoji: 'cheese-wedge' },
  { word: 'TÜTE', emoji: 'shopping-bags' },
];

/** Stufe 3: richtig geschrieben – Namenwörter groß, also mit Umschalttaste. */
export const WORDS_CASED: PictureWord[] = [
  { word: 'Hund', emoji: 'dog-face' },
  { word: 'Katze', emoji: 'cat-face' },
  { word: 'Löwe', emoji: 'lion' },
  { word: 'Rakete', emoji: 'rocket' },
  { word: 'Regenbogen', emoji: 'rainbow' },
  { word: 'Sonnenblume', emoji: 'sunflower' },
  { word: 'Schildkröte', emoji: 'turtle' },
  { word: 'Erdbeere', emoji: 'strawberry' },
  { word: 'Schmetterling', emoji: 'butterfly' },
  { word: 'Marienkäfer', emoji: 'lady-beetle' },
  { word: 'Weintrauben', emoji: 'grapes' },
  { word: 'Wassermelone', emoji: 'watermelon' },
  { word: 'Eichhörnchen', emoji: 'chipmunk' },
  { word: 'Igel', emoji: 'hedgehog' },
];

/** Zehn-Finger-Übungen: erst die Tastmarken, dann die ganze Grundreihe, dann Wörter daraus. */
export const DRILLS: Record<1 | 2 | 3, string[]> = {
  1: ['fff jjj', 'fjf jfj', 'ff jj fj', 'jjf ffj', 'fj jf fj'],
  2: ['asdf jklö', 'fdsa ölkj', 'aa ss dd ff', 'jj kk ll öö', 'sad lös', 'fass dass'],
  3: ['das lag', 'als hals', 'glas gas', 'fall lass', 'saal kahl', 'jagd las', 'ja das glas'],
};

/** Tipp-Profi: Großbuchstaben, Satzzeichen – und ein Wettrennen. */
export const SHIFT_PHRASES = ['Hallo Flinn', 'Der Hund', 'Die Katze', 'Mein Name', 'Ein Ball', 'Viele Grüße', 'Guten Morgen'];

export const SPECIAL_PHRASES = ['Hallo!', 'Wie geht es dir?', 'Eins, zwei, drei.', 'flinn@fuchs.de', '3 + 4 = 7', 'Ja: genau!'];

export const RACE_TEXTS = [
  'Flinn wohnt im Computer und hilft dir beim Lernen.',
  'Ein Fuchs ist schlau, schnell und mag Kekse.',
  'Heute tippe ich schneller als gestern.',
  'Der Mond scheint hell über dem stillen See.',
];

/** Wie schnell Flinn im Wettrennen tippt: Anschläge pro Minute. */
export const FLINN_SPEED = 60;
