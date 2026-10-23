import { createContext, useContext } from 'react';
import type { EmojiName } from '../core/emoji';
import type { AgeGroup, Feature, LevelOutcome, Profile, Stars } from '../core/profile';

export interface ToastInput {
  title: string;
  text?: string;
  icon?: EmojiName;
  /** Zeigt den Byte-Riegel statt eines Bildes. */
  bytes?: boolean;
}

export interface CompleteResult extends LevelOutcome {
  /** Gerade freigeschaltete Desktop-Funktion */
  unlocked: Feature | null;
}

export interface AppParams {
  /** Für Einstellungen: welcher Bereich offen sein soll */
  tab?: string;
  /** Für Dateien: welcher Ordner offen sein soll */
  folder?: string;
  /** Für die Anzeige: welche Datei gezeigt wird */
  file?: string;
}

/** Was jede App vom „Betriebssystem" bekommt. */
export interface OsApi {
  profile: Profile;
  group: AgeGroup;
  /** Erwachsene haben alle Level und Stufen geöffnet. */
  allOpen: boolean;
  kiosk: boolean;
  update: (change: (p: Profile) => Profile) => void;
  /** score: Bestwert, bei dem höher besser ist (z. B. Anschläge pro Minute) */
  completeLevel: (appId: string, levelId: string, stars: Stars, unlocks?: Feature, score?: number) => CompleteResult;
  toast: (t: ToastInput) => void;
  openApp: (appId: string, params?: AppParams) => void;
  celebrate: () => void;
}

export interface WindowInfo {
  id: string;
  appId: string;
  focused: boolean;
  params: AppParams & { nonce: number };
  close: () => void;
  /** Eigener Fenstertitel, z. B. der Name der geöffneten Datei */
  setTitle: (title: string | null) => void;
}

export const OsContext = createContext<OsApi | null>(null);
export const WindowContext = createContext<WindowInfo | null>(null);

export function useOs(): OsApi {
  const ctx = useContext(OsContext);
  if (!ctx) throw new Error('useOs muss innerhalb des Desktops verwendet werden.');
  return ctx;
}

export function useWindow(): WindowInfo {
  const ctx = useContext(WindowContext);
  if (!ctx) throw new Error('useWindow muss innerhalb eines Fensters verwendet werden.');
  return ctx;
}
