import { useEffect, useState } from 'react';
import { isPictureId } from './files';
import { newId } from './storage';

/*
 * Gemalte Bilder sind echte Pixel – zu groß für den localStorage, in dem der
 * Spielstand liegt. Sie kommen deshalb als PNG in die IndexedDB des Browsers;
 * die Datei im Ordner „Bilder“ verweist nur auf sie. Jedes gespeicherte Bild
 * bekommt eine neue ID und wird nie verändert – so bleiben Kopien unabhängig.
 *
 * Fehlt die IndexedDB (sehr alte Browser, manche gesperrten Kiosk-Profile),
 * bleiben die Bilder bis zum Schließen im Arbeitsspeicher.
 */

const DB_NAME = 'computerfuchs';
const DB_VERSION = 1;
const PICTURES = 'bilder';
const DRAFTS = 'entwuerfe';
const DAY = 24 * 60 * 60 * 1000;

interface PictureRecord {
  blob: Blob;
  created: number;
}

/** Das Bild, an dem ein Kind gerade malt – damit nichts verloren geht, wenn das Fenster zugeht. */
export interface Draft {
  blob: Blob;
  fileId: string | null;
  name: string;
  dirty: boolean;
  saved: number;
}

const memory = { [PICTURES]: new Map<string, unknown>(), [DRAFTS]: new Map<string, unknown>() };
let dbPromise: Promise<IDBDatabase | null> | undefined;

function openDb(): Promise<IDBDatabase | null> {
  dbPromise ??= new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(PICTURES)) db.createObjectStore(PICTURES);
        if (!db.objectStoreNames.contains(DRAFTS)) db.createObjectStore(DRAFTS);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

type Store = typeof PICTURES | typeof DRAFTS;

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB'));
  });
}

async function put(store: Store, key: string, value: unknown): Promise<boolean> {
  const db = await openDb();
  if (db) {
    try {
      const tx = db.transaction(store, 'readwrite');
      await request(tx.objectStore(store).put(value, key));
      return true;
    } catch {
      // Voll oder gesperrt – dann wenigstens bis zum Schließen behalten.
    }
  }
  memory[store].set(key, value);
  return false;
}

async function get<T>(store: Store, key: string): Promise<T | undefined> {
  const db = await openDb();
  if (db) {
    try {
      const value = await request(db.transaction(store, 'readonly').objectStore(store).get(key));
      if (value !== undefined) return value as T;
    } catch {
      // weiter mit dem Arbeitsspeicher
    }
  }
  return memory[store].get(key) as T | undefined;
}

async function entries<T>(store: Store): Promise<[string, T][]> {
  const db = await openDb();
  const out: [string, T][] = [...memory[store].entries()].map(([k, v]) => [k, v as T]);
  if (!db) return out;
  try {
    const os = db.transaction(store, 'readonly').objectStore(store);
    const [keys, values] = await Promise.all([request(os.getAllKeys()), request(os.getAll())]);
    keys.forEach((k, i) => out.push([String(k), values[i] as T]));
  } catch {
    // nichts zu holen
  }
  return out;
}

async function remove(store: Store, keys: string[]): Promise<void> {
  for (const k of keys) memory[store].delete(k);
  const db = await openDb();
  if (!db || keys.length === 0) return;
  try {
    const tx = db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    await Promise.all(keys.map((k) => request(os.delete(k))));
  } catch {
    // Dann eben beim nächsten Mal.
  }
}

// ---------------------------------------------------------------------------
// Bilder
// ---------------------------------------------------------------------------

export function newPictureId(): string {
  return `pic-${newId().toLowerCase()}`;
}

/** true: dauerhaft gespeichert · false: nur bis zum Schließen (Speicher voll oder gesperrt) */
export function savePicture(id: string, blob: Blob): Promise<boolean> {
  return put(PICTURES, id, { blob, created: Date.now() } satisfies PictureRecord);
}

export async function loadPicture(id: string): Promise<Blob | null> {
  const rec = await get<PictureRecord>(PICTURES, id);
  return rec?.blob instanceof Blob ? rec.blob : null;
}

const urls = new Map<string, Promise<string | null>>();

/** Eine Adresse fürs Bild, z. B. für <img> – einmal erzeugt, danach wiederverwendet. */
export function pictureUrl(id: string): Promise<string | null> {
  let url = urls.get(id);
  if (!url) {
    url = loadPicture(id).then((blob) => {
      if (!blob) {
        urls.delete(id);
        return null;
      }
      return URL.createObjectURL(blob);
    });
    urls.set(id, url);
  }
  return url;
}

export function usePictureUrl(id: string | null | undefined): string | null {
  const [state, setState] = useState<{ id: string; url: string | null } | null>(null);
  useEffect(() => {
    if (!id) return;
    let alive = true;
    void pictureUrl(id).then((url) => {
      if (alive) setState({ id, url });
    });
    return () => {
      alive = false;
    };
  }, [id]);
  return id && state?.id === id ? state.url : null;
}

// ---------------------------------------------------------------------------
// Entwürfe
// ---------------------------------------------------------------------------

export function saveDraft(profileId: string, draft: Draft): Promise<boolean> {
  return put(DRAFTS, profileId, draft);
}

export async function loadDraft(profileId: string): Promise<Draft | null> {
  const d = await get<Draft>(DRAFTS, profileId);
  return d && d.blob instanceof Blob ? d : null;
}

// ---------------------------------------------------------------------------
// Aufräumen
// ---------------------------------------------------------------------------

/**
 * Bilder löschen, auf die keine Datei mehr zeigt – etwa nach dem Leeren des
 * Papierkorbs oder nach dem Überschreiben. Nur, was älter als `minAge` ist:
 * So kann ein zweiter Tab mit älterem Stand nichts Frisches wegräumen.
 */
export async function sweepPictures(keepPictures: Set<string>, keepDrafts: Set<string>, minAge = 3 * DAY): Promise<number> {
  const now = Date.now();
  const oldEnough = (t: unknown) => typeof t === 'number' && now - t > minAge;
  const pictures = await entries<PictureRecord>(PICTURES);
  const drafts = await entries<Draft>(DRAFTS);
  const goPictures = pictures.filter(([k, v]) => !keepPictures.has(k) && oldEnough(v?.created)).map(([k]) => k);
  const goDrafts = drafts.filter(([k, v]) => !keepDrafts.has(k) && oldEnough(v?.saved)).map(([k]) => k);
  await remove(PICTURES, goPictures);
  await remove(DRAFTS, goDrafts);
  return goPictures.length;
}

// ---------------------------------------------------------------------------
// Spielstand-Datei: Bilder als Text (data:-Adressen)
// ---------------------------------------------------------------------------

function bytesToBase64(bytes: Uint8Array): string {
  let text = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) text += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(text);
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return `data:${blob.type || 'image/png'};base64,${bytesToBase64(bytes)}`;
}

const DATA_URL = /^data:(image\/(?:png|webp|jpeg));base64,([A-Za-z0-9+/]*={0,2})$/;

export function dataUrlToBlob(url: string): Blob | null {
  const m = DATA_URL.exec(url);
  if (!m) return null;
  try {
    const bin = atob(m[2]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: m[1] });
  } catch {
    return null;
  }
}

/** Alle genannten Bilder als Text – für die Spielstand-Datei. Fehlende werden übersprungen. */
export async function picturesForExport(ids: Iterable<string>): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const id of ids) {
    const blob = await loadPicture(id);
    if (blob) out[id] = await blobToDataUrl(blob);
  }
  return out;
}

/** Bilder aus einer geladenen Spielstand-Datei ablegen. Gibt zurück, wie viele es waren. */
export async function storeImportedPictures(pictures: Record<string, string>): Promise<number> {
  let n = 0;
  for (const [id, url] of Object.entries(pictures)) {
    if (!isPictureId(id)) continue;
    const blob = dataUrlToBlob(url);
    if (!blob) continue;
    await savePicture(id, blob);
    urls.delete(id);
    n++;
  }
  return n;
}
