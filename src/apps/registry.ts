import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { EmojiName } from '../core/emoji';

export type AppCategory = 'computer' | 'schule' | 'kreativ' | 'system';

export interface AppDef {
  id: string;
  name: string;
  icon: EmojiName;
  color: string;
  colorDark: string;
  category: AppCategory;
  /** Bevorzugte Fenstergröße */
  size: { w: number; h: number };
  /** Liegt als Symbol auf dem Desktop */
  desktop?: boolean;
  component?: LazyExoticComponent<ComponentType>;
  /** Noch in Arbeit – das sagt Flinn dazu. */
  soon?: string;
}

export const CATEGORIES: { id: AppCategory; name: string }[] = [
  { id: 'computer', name: 'Computer lernen' },
  { id: 'schule', name: 'Schule' },
  { id: 'kreativ', name: 'Kreativ' },
  { id: 'system', name: 'System' },
];

export const APPS: AppDef[] = [
  {
    id: 'maus',
    name: 'Maustraining',
    icon: 'computer-mouse',
    color: '#2f9bff',
    colorDark: '#1673d6',
    category: 'computer',
    size: { w: 1060, h: 720 },
    desktop: true,
    component: lazy(() => import('./maus/MausApp')),
  },
  {
    id: 'rechnen',
    name: 'Rechnen',
    icon: 'abacus',
    color: '#8a6bff',
    colorDark: '#6646e0',
    category: 'schule',
    size: { w: 980, h: 700 },
    desktop: true,
    component: lazy(() => import('./rechnen/RechnenApp')),
  },
  {
    id: 'einstellungen',
    name: 'Einstellungen',
    icon: 'gear',
    color: '#69728f',
    colorDark: '#4b526b',
    category: 'system',
    size: { w: 900, h: 640 },
    desktop: true,
    component: lazy(() => import('./einstellungen/SettingsApp')),
  },
  {
    id: 'papierkorb',
    name: 'Papierkorb',
    icon: 'wastebasket',
    color: '#22b8a0',
    colorDark: '#13907c',
    category: 'system',
    size: { w: 600, h: 440 },
    desktop: true,
    component: lazy(() => import('./papierkorb/TrashApp')),
  },

  // In Arbeit – sie stehen schon im Start-Menü, damit man sieht, wohin die Reise geht.
  {
    id: 'tastatur',
    name: 'Tastatur',
    icon: 'keyboard',
    color: '#ff7a2f',
    colorDark: '#d95a10',
    category: 'computer',
    size: { w: 1000, h: 680 },
    soon: 'Hier lernst du bald, wo die Buchstaben wohnen – mit Buchstabenregen, Tipp-Rennen und dem 10-Finger-System.',
  },
  {
    id: 'dateien',
    name: 'Dateien',
    icon: 'file-folder',
    color: '#f5a524',
    colorDark: '#cc8400',
    category: 'computer',
    size: { w: 900, h: 600 },
    soon: 'Bald kannst du hier deine Bilder und Briefe in Ordnern aufräumen – und Gelöschtes aus dem Papierkorb zurückholen.',
  },
  {
    id: 'internet',
    name: 'Was ist das Internet?',
    icon: 'globe-with-meridians',
    color: '#14b0d4',
    colorDark: '#0c8aa8',
    category: 'computer',
    size: { w: 1000, h: 680 },
    soon: 'Bald reist du hier als kleines Datenpaket um die ganze Welt – durch Kabel unter dem Meer bis zu einem Server!',
  },
  {
    id: 'netzdetektiv',
    name: 'Netz-Detektiv',
    icon: 'magnifying-glass-tilted-left',
    color: '#5b6cff',
    colorDark: '#3d4de0',
    category: 'computer',
    size: { w: 1000, h: 680 },
    soon: 'Bald erkennst du hier Werbung, Fallen und falsche Nachrichten – in einem Spiel-Internet, in dem nichts passieren kann.',
  },
  {
    id: 'postfach',
    name: 'Postfach',
    icon: 'envelope',
    color: '#ff6b6b',
    colorDark: '#d94848',
    category: 'computer',
    size: { w: 960, h: 640 },
    soon: 'Bald schreibst du hier E-Mails mit Bildern im Anhang – und lernst, komische Nachrichten zu erkennen.',
  },
  {
    id: 'lesen',
    name: 'Buchstaben',
    icon: 'input-latin-uppercase',
    color: '#2fbf62',
    colorDark: '#1d9548',
    category: 'schule',
    size: { w: 980, h: 680 },
    soon: 'Bald lernst du hier Buchstaben und Anlaute: A wie Affe, B wie Banane!',
  },
  {
    id: 'englisch',
    name: 'Englisch',
    icon: 'speech-balloon',
    color: '#e8508a',
    colorDark: '#c2306a',
    category: 'schule',
    size: { w: 980, h: 680 },
    soon: 'Hello! Bald lernst du hier erste englische Wörter – mit Bildern und zum Anhören.',
  },
  {
    id: 'uhr',
    name: 'Uhr lesen',
    icon: 'mantelpiece-clock',
    color: '#4f86ff',
    colorDark: '#2f62d9',
    category: 'schule',
    size: { w: 900, h: 640 },
    soon: 'Bald lernst du hier, wie spät es ist – mit einer Uhr, an der du selbst drehen kannst.',
  },
  {
    id: 'malkasten',
    name: 'Malkasten',
    icon: 'artist-palette',
    color: '#ff4f87',
    colorDark: '#d42c63',
    category: 'kreativ',
    size: { w: 1000, h: 700 },
    soon: 'Bald malst du hier eigene Bilder, speicherst sie und machst sie zu deinem Hintergrund.',
  },
  {
    id: 'robocode',
    name: 'Robo-Code',
    icon: 'robot',
    color: '#a855f7',
    colorDark: '#8135d4',
    category: 'kreativ',
    size: { w: 1000, h: 700 },
    soon: 'Bald programmierst du hier einen kleinen Roboter – erst mit Pfeilen, später mit echtem Code.',
  },
  {
    id: 'laden',
    name: 'App-Laden',
    icon: 'shopping-bags',
    color: '#ff9f1c',
    colorDark: '#d97f00',
    category: 'system',
    size: { w: 960, h: 660 },
    soon: 'Bald tauschst du hier deine Bytes gegen Hintergründe, Mauszeiger und Sticker. Was du holst, landet in deinem Download-Ordner.',
  },
];

export function appById(id: string): AppDef | undefined {
  return APPS.find((a) => a.id === id);
}
