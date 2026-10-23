/*
 * Computerfuchs offline: Diese Datei wird beim Bauen zu dist/sw.js
 * (siehe tools/offline.ts). Sie legt alle Dateien der Seite im Browser ab –
 * so startet der Lerncomputer auch ohne Internet, etwa wenn ein Kiosk-Laptop
 * schneller hochfährt als das WLAN.
 *
 * Die Seite selbst kommt zuerst aus dem Netz (damit Updates ankommen), alles
 * andere hat einen Namen mit Prüfsumme und ändert sich nie – das kommt aus dem
 * Speicher.
 */

const VERSION = __VERSION__;
const FILES = __FILES__;
const PREFIX = 'computerfuchs-';
const CACHE = PREFIX + VERSION;
const PAGE = new URL('index.html', self.registration.scope).href;
const NETWORK_TIMEOUT = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES.map((file) => new Request(file, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Die vorige Fassung bleibt: Ein schon offenes Fenster lädt vielleicht noch Teile davon nach.
      const older = (await caches.keys()).filter((key) => key.startsWith(PREFIX) && key !== CACHE);
      await Promise.all(older.slice(0, -1).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function page(request) {
  const cache = await caches.open(CACHE);
  const fresh = fetch(request).then(async (response) => {
    if (response.ok) await cache.put(PAGE, response.clone());
    return response;
  });
  // Kommt das Netz zu spät oder gar nicht, reicht die gespeicherte Seite – kein Fehler in der Konsole.
  fresh.catch(() => undefined);
  try {
    return await withTimeout(fresh, NETWORK_TIMEOUT);
  } catch {
    const stored = await caches.match(PAGE, { ignoreVary: true });
    if (stored) return stored;
    return fresh;
  }
}

async function file(request) {
  // ignoreVary: Manche Server schicken „Vary: Origin“ – unsere Dateien ändern sich aber nie.
  const stored = await caches.match(request, { ignoreVary: true });
  if (stored) return stored;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith(request.mode === 'navigate' ? page(request) : file(request));
});
