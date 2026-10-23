import type { Feature } from '../../core/profile';
import type { MouseAction } from '../../os/MouseHint';
import type { MapLevel } from '../shared/levelTypes';

export type MausLevelId =
  | 'taschenlampe' | 'ballons' | 'geschenke' | 'fuettern' | 'weg' | 'farben' | 'tauchgang' | 'fenster';

export interface MausLevel extends MapLevel {
  id: MausLevelId;
  mouse: MouseAction;
  intro: string;
  tiers: [string, string, string];
  /** Desktop-Funktion, die dieses Level freischaltet */
  unlocks?: Feature;
}

/*
 * Die Reihenfolge folgt dem, was man an einem echten Computer braucht:
 * bewegen, klicken, doppelklicken, ziehen, genau führen, Rechtsklick,
 * scrollen und am Ende Fenster bedienen.
 */
export const MAUS_LEVELS: MausLevel[] = [
  {
    id: 'taschenlampe',
    title: 'Taschenlampe',
    skill: 'Maus bewegen',
    icon: 'crescent-moon',
    color: '#4b4fc4',
    mouse: 'move',
    intro:
      'Es ist dunkel! Deine Maus ist eine Taschenlampe. Bewege sie hin und her und leuchte auf die versteckten Tiere, bis du alle gefunden hast.',
    tiers: ['Große Tiere und eine helle Lampe.', 'Die Tiere sind kleiner.', 'Winzige Tiere und eine kleine Lampe!'],
  },
  {
    id: 'ballons',
    title: 'Ballons',
    skill: 'Klicken',
    icon: 'balloon',
    color: '#ff4f87',
    mouse: 'left',
    intro:
      'Klick auf die Ballons, damit sie platzen! Fahre mit dem Zeiger auf einen Ballon und drück einmal kurz die linke Maustaste.',
    tiers: ['Große, langsame Ballons.', 'Die Ballons fliegen schneller.', 'Lass nur die roten Ballons platzen!'],
  },
  {
    id: 'geschenke',
    title: 'Geschenke',
    skill: 'Doppelklick',
    icon: 'wrapped-gift',
    color: '#8a6bff',
    mouse: 'double',
    unlocks: 'doubleClick',
    intro:
      'Hier liegen Geschenke! Öffne sie mit einem Doppelklick: Klick zweimal ganz schnell hintereinander mit der linken Maustaste. Halte die Maus dabei still.',
    tiers: ['Du hast viel Zeit zwischen den Klicks.', 'Etwas schneller klicken.', 'So schnell wie an einem echten Computer!'],
  },
  {
    id: 'fuettern',
    title: 'Tiere füttern',
    skill: 'Ziehen und Ablegen',
    icon: 'carrot',
    color: '#2fbf62',
    mouse: 'drag',
    unlocks: 'moveWindows',
    intro:
      'Die Tiere haben Hunger! Drück auf ein Essen und halte die linke Maustaste gedrückt. Zieh es zum richtigen Tier und lass dann los.',
    tiers: ['Zwei hungrige Tiere.', 'Drei hungrige Tiere.', 'Vier Tiere – wer mag was?'],
  },
  {
    id: 'weg',
    title: 'Bienenweg',
    skill: 'Genau führen',
    icon: 'honeybee',
    color: '#f5a524',
    mouse: 'move',
    intro:
      'Hilf der Biene zur Blume! Fahre zuerst mit dem Zeiger auf die Biene. Dann führe sie langsam den Weg entlang, ohne vom Weg abzukommen.',
    tiers: ['Ein breiter Weg.', 'Ein kurviger Weg.', 'Ein schmaler Zickzack-Weg!'],
  },
  {
    id: 'farben',
    title: 'Farbenzauber',
    skill: 'Rechtsklick',
    icon: 'artist-palette',
    color: '#ff7a2f',
    mouse: 'right',
    unlocks: 'rightClick',
    intro:
      'Dieses Bild ist noch grau. Klick mit der rechten Maustaste auf ein Teil vom Bild. Dann geht ein Menü auf – darin suchst du eine Farbe aus.',
    tiers: ['Mal alles bunt an, wie du magst.', 'Mal es genau wie die Vorlage.', 'Die Farben stecken in einem Untermenü.'],
  },
  {
    id: 'tauchgang',
    title: 'Tauchgang',
    skill: 'Scrollen',
    icon: 'tropical-fish',
    color: '#14b0d4',
    mouse: 'wheel',
    intro:
      'Tauch tief ins Meer! Dreh am Mausrad, dann geht es nach unten und wieder nach oben. Am Laptop wischst du dafür mit zwei Fingern über das Touchpad. Klick die Meerestiere an, die du suchst.',
    tiers: ['Drei Tiere im flachen Wasser.', 'Fünf Tiere – eins nach dem anderen.', 'Sieben Tiere, ganz tief unten!'],
  },
  {
    id: 'fenster',
    title: 'Fenster-Profi',
    skill: 'Fenster bedienen',
    icon: 'laptop',
    color: '#5b6cff',
    mouse: 'drag',
    unlocks: 'windowControls',
    intro:
      'Jetzt wirst du ein Fenster-Profi! Halte die bunte Leiste oben am Fenster mit der linken Maustaste fest und schieb das Fenster in den gestrichelten Rahmen.',
    tiers: ['Fenster verschieben.', 'Verschieben und am Rand größer ziehen.', 'Verkleinern, zurückholen, vergrößern und schließen.'],
  },
];
