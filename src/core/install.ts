import { useSyncExternalStore } from 'react';

/*
 * „Als App installieren“: Chrome und Edge melden mit beforeinstallprompt, dass
 * das geht. Das Ereignis wird gemerkt, damit der Erwachsenen-Bereich einen
 * Knopf dafür anbieten kann. Installiert startet Computerfuchs wie ein eigenes
 * Programm im Vollbild.
 */

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
let installedNow = false;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function initInstall(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    deferred = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installedNow = true;
    notify();
  });
}

/** Läuft Computerfuchs gerade als installierte App? */
export function runsAsApp(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
}

export async function promptInstall(): Promise<boolean> {
  const event = deferred;
  if (!event) return false;
  deferred = null;
  notify();
  await event.prompt();
  const choice = await event.userChoice;
  return choice.outcome === 'accepted';
}

type InstallState = 'possible' | 'installed' | 'unavailable';

function snapshot(): InstallState {
  if (installedNow || runsAsApp()) return 'installed';
  return deferred ? 'possible' : 'unavailable';
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** possible: Knopf zeigen · installed: läuft schon als App · unavailable: Browser kann es nicht (oder noch nicht) */
export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribe, snapshot, () => 'unavailable');
}
