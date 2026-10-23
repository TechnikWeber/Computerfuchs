import type { EmojiName } from '../core/emoji';
import type { Feature } from '../core/profile';

/** Was Flinn sagt, wenn der Desktop etwas Neues kann. */
export const FEATURE_INFO: Record<Feature, { title: string; text: string; icon: EmojiName }> = {
  doubleClick: {
    title: 'Neu: Doppelklick!',
    text: 'Ab jetzt öffnest du die Symbole auf dem Desktop mit zwei schnellen Klicks – genau wie an einem echten Computer.',
    icon: 'wrapped-gift',
  },
  moveWindows: {
    title: 'Neu: Fenster verschieben!',
    text: 'Halte die bunte Leiste oben an einem Fenster mit der linken Maustaste fest. Dann kannst du das Fenster hinziehen, wo du willst.',
    icon: 'computer-mouse',
  },
  rightClick: {
    title: 'Neu: Rechtsklick!',
    text: 'Klick mit der rechten Maustaste auf eine freie Stelle vom Desktop. Dann öffnet sich ein Menü, zum Beispiel für ein neues Hintergrundbild.',
    icon: 'artist-palette',
  },
  windowControls: {
    title: 'Neu: Fenster-Knöpfe!',
    text: 'Mit dem Strich machst du ein Fenster klein – es wartet dann unten in der Leiste. Mit dem Viereck wird es groß, mit dem Kreuz geht es zu. Und am Rand kannst du es größer ziehen.',
    icon: 'laptop',
  },
};
