import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { EmojiName } from '../core/emoji';
import type { AppParams } from '../os/osContext';

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
  /** Verknüpfung: öffnet eine andere App, z. B. Papierkorb → Dateien */
  opens?: { app: string; params: AppParams };
  /** Nicht im Start-Menü (z. B. die Anzeige, die Dateien öffnet) */
  hidden?: boolean;
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
    id: 'tastatur',
    name: 'Tastatur',
    icon: 'keyboard',
    color: '#ff7a2f',
    colorDark: '#d95a10',
    category: 'computer',
    size: { w: 1060, h: 720 },
    desktop: true,
    component: lazy(() => import('./tastatur/TastaturApp')),
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
    id: 'dateien',
    name: 'Dateien',
    icon: 'file-folder',
    color: '#f5a524',
    colorDark: '#cc8400',
    category: 'computer',
    size: { w: 1000, h: 660 },
    desktop: true,
    component: lazy(() => import('./dateien/DateienApp')),
  },
  {
    id: 'laden',
    name: 'App-Laden',
    icon: 'shopping-bags',
    color: '#ff9f1c',
    colorDark: '#d97f00',
    category: 'system',
    size: { w: 980, h: 680 },
    desktop: true,
    component: lazy(() => import('./laden/LadenApp')),
  },
  {
    id: 'einstellungen',
    name: 'Einstellungen',
    icon: 'gear',
    color: '#69728f',
    colorDark: '#4b526b',
    category: 'system',
    size: { w: 920, h: 660 },
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
    size: { w: 1000, h: 660 },
    desktop: true,
    opens: { app: 'dateien', params: { folder: 'trash' } },
  },
  {
    id: 'anzeige',
    name: 'Anzeige',
    icon: 'open-book',
    color: '#5b6cff',
    colorDark: '#3d4de0',
    category: 'system',
    size: { w: 760, h: 600 },
    hidden: true,
    component: lazy(() => import('./anzeige/AnzeigeApp')),
  },

  // In Arbeit – sie stehen schon im Start-Menü, damit man sieht, wohin die Reise geht.
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
];

export function appById(id: string): AppDef | undefined {
  return APPS.find((a) => a.id === id);
}
