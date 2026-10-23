/*
 * Vollbild und Kiosk-Modus.
 *
 * Eine Webseite kann einen Laptop nicht abschließen – Alt+Tab oder
 * Strg+Alt+Entf gehören dem Betriebssystem. Dafür gibt es den Kiosk des
 * Systems (siehe docs/CONCEPT.de.md). Mit ?kiosk in der Adresse verhält sich
 * die Seite passend dazu: kein Knopf zum Verlassen des Vollbilds, Ausschalten
 * führt zurück zum Startbildschirm.
 */

const KIOSK_KEY = 'computerfuchs.kiosk';

let kiosk: boolean | null = null;

export function isKiosk(): boolean {
  if (kiosk !== null) return kiosk;
  let on = false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('kiosk')) {
      on = params.get('kiosk') !== '0';
      sessionStorage.setItem(KIOSK_KEY, on ? '1' : '0');
    } else {
      on = sessionStorage.getItem(KIOSK_KEY) === '1';
    }
  } catch {
    // Ohne sessionStorage gilt nur die Adresse.
  }
  kiosk = on;
  return on;
}

export function isFullscreen(): boolean {
  return typeof document !== 'undefined' && document.fullscreenElement !== null;
}

export async function enterFullscreen(): Promise<boolean> {
  const el = document.documentElement;
  if (isFullscreen()) return true;
  if (!el.requestFullscreen) return false;
  try {
    await el.requestFullscreen({ navigationUI: 'hide' });
    if (isKiosk()) await lockKeys();
    return true;
  } catch {
    // Abgelehnt, etwa in einem eingebetteten Rahmen – dann eben ohne Vollbild.
    return false;
  }
}

export async function exitFullscreen(): Promise<void> {
  if (!isFullscreen()) return;
  try {
    await document.exitFullscreen();
  } catch {
    // Nichts zu tun.
  }
}

/** Fängt im Vollbild auch Tasten wie Esc ab (nur Chromium). Strg+Alt+Entf bleibt immer frei. */
async function lockKeys(): Promise<void> {
  const nav = navigator as Navigator & { keyboard?: { lock?: (keys?: string[]) => Promise<void> } };
  try {
    await nav.keyboard?.lock?.();
  } catch {
    // Nicht unterstützt.
  }
}

export function onFullscreenChange(cb: (on: boolean) => void): () => void {
  const handler = () => cb(isFullscreen());
  document.addEventListener('fullscreenchange', handler);
  return () => document.removeEventListener('fullscreenchange', handler);
}

/** Geräte ohne Maus (Handy, Tablet) bekommen einen freundlichen Hinweis. */
export function hasFinePointer(): boolean {
  try {
    return window.matchMedia('(any-pointer: fine)').matches;
  } catch {
    return true;
  }
}
