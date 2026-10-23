/*
 * Offline-Speicher anmelden (dist/sw.js, siehe tools/offline.ts). Danach
 * startet Computerfuchs auch ohne Internet. Geht das nicht – etwa als
 * lokale Datei oder im privaten Fenster –, läuft alles wie bisher.
 */

const UPDATE_EVERY = 6 * 60 * 60 * 1000;

export function registerOffline(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((registration) => {
        // Kiosk-Rechner laufen tagelang: ab und zu nach einer neuen Fassung schauen.
        window.setInterval(() => void registration.update().catch(() => undefined), UPDATE_EVERY);
      })
      .catch(() => undefined);
  });
}
