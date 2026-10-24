import { AVATARS, WALLPAPERS, type AvatarId, type WallpaperId } from './catalog';
import { EMOJI, type EmojiName } from './emoji';
import {
  CURSOR_SKIN_IDS, MAX_NAME_LENGTH, ROOT, SONG_IDS, isPictureId, isSystemFolder, picturesIn, seedFiles,
  type CursorSkinId, type FileContent, type FileNode, type SongId,
} from './files';
import type { Pin } from './pin';
import {
  CURSOR_SIZES, FEATURES, MAX_NAME, clampAge, defaultSettings,
  type CursorSize, type Feature, type LevelRecord, type Profile, type ProfileSettings, type Stars, type Sticker,
} from './profile';
import { SHOP_IDS } from './shop';

/*
 * Spielstände liegen im localStorage des Browsers und lassen sich als Datei
 * sichern. Alles, was von außen kommt – eine geladene Datei oder ein von Hand
 * veränderter Speicher –, läuft durch sanitize*(): fehlende oder kaputte Felder
 * bekommen sinnvolle Werte, statt die Oberfläche zum Absturz zu bringen.
 */

export const SAVE_KEY = 'computerfuchs.save';
export const SAVE_FORMAT = 'computerfuchs';
export const SAVE_VERSION = 1;
export const MAX_PROFILES = 30;

export interface SaveData {
  format: typeof SAVE_FORMAT;
  version: typeof SAVE_VERSION;
  profiles: Profile[];
  lastProfileId?: string;
}

export function emptySave(): SaveData {
  return { format: SAVE_FORMAT, version: SAVE_VERSION, profiles: [] };
}

export function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch {
    // randomUUID fehlt außerhalb sicherer Kontexte, etwa bei http:// im Schulnetz.
  }
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Prüfen und reparieren
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function num(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function int(value: unknown, fallback: number, min: number, max: number): number {
  return Math.round(num(value, fallback, min, max));
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

const AVATAR_IDS = AVATARS.map((a) => a.id) as AvatarId[];
const WALLPAPER_IDS = WALLPAPERS.map((w) => w.id) as WallpaperId[];
const EMOJI_SET = new Set<string>(EMOJI);
const KEY_PATTERN = /^[a-z0-9-]{1,40}$/;
export const MAX_FILES = 500;
const MAX_STICKERS = 40;

function sanitizeSettings(raw: unknown, age: number): ProfileSettings {
  const base = defaultSettings(age);
  if (!isRecord(raw)) return base;
  const settings: ProfileSettings = {
    wallpaper: oneOf(raw.wallpaper, WALLPAPER_IDS, base.wallpaper),
    sound: typeof raw.sound === 'boolean' ? raw.sound : base.sound,
    volume: num(raw.volume, base.volume, 0, 1),
    voice: typeof raw.voice === 'boolean' ? raw.voice : base.voice,
    cursor: oneOf<CursorSize>(raw.cursor, CURSOR_SIZES, base.cursor),
    cursorSkin: oneOf<CursorSkinId>(raw.cursorSkin, CURSOR_SKIN_IDS, base.cursorSkin),
    doubleClickMs: int(raw.doubleClickMs, base.doubleClickMs, 250, 1500),
    showExtensions: typeof raw.showExtensions === 'boolean' ? raw.showExtensions : base.showExtensions,
  };
  if (typeof raw.wallpaperFile === 'string' && raw.wallpaperFile.length > 0 && raw.wallpaperFile.length <= 64) {
    settings.wallpaperFile = raw.wallpaperFile;
  }
  return settings;
}

const isEmoji = (v: unknown): v is EmojiName => typeof v === 'string' && EMOJI_SET.has(v);

function sanitizeContent(raw: unknown): FileContent | null {
  if (!isRecord(raw)) return null;
  switch (raw.type) {
    case 'bild':
      return isEmoji(raw.emoji) ? { type: 'bild', emoji: raw.emoji } : null;
    case 'sticker':
      return isEmoji(raw.emoji) ? { type: 'sticker', emoji: raw.emoji } : null;
    case 'gemalt':
      return isPictureId(raw.picture) ? { type: 'gemalt', picture: raw.picture } : null;
    case 'hintergrund':
      return (WALLPAPER_IDS as readonly unknown[]).includes(raw.wallpaper)
        ? { type: 'hintergrund', wallpaper: raw.wallpaper as WallpaperId }
        : null;
    case 'zeiger':
      return (CURSOR_SKIN_IDS as readonly unknown[]).includes(raw.cursor) ? { type: 'zeiger', cursor: raw.cursor as CursorSkinId } : null;
    case 'musik':
      return (SONG_IDS as readonly unknown[]).includes(raw.song) ? { type: 'musik', song: raw.song as SongId } : null;
    case 'text':
      return typeof raw.text === 'string' ? { type: 'text', text: raw.text.slice(0, 4000) } : null;
    default:
      return null;
  }
}

/** Dateisystem prüfen: kaputte Einträge weg, unbekannte Eltern und Kreise nach „Mein Computer“. */
export function sanitizeFiles(raw: unknown, now: string): FileNode[] {
  if (!Array.isArray(raw)) return seedFiles(now);
  const out: FileNode[] = [];
  const ids = new Set<string>();
  for (const r of raw) {
    if (out.length >= MAX_FILES) break;
    if (!isRecord(r) || typeof r.id !== 'string' || !r.id || r.id.length > 64 || ids.has(r.id) || isSystemFolder(r.id)) continue;
    const folder = r.folder === true;
    const content = folder ? null : sanitizeContent(r.content);
    if (!folder && !content) continue;
    const name = typeof r.name === 'string' ? r.name.replace(/[\\/:*?"<>|]/g, '').trim().slice(0, MAX_NAME_LENGTH) : '';
    const node: FileNode = {
      id: r.id,
      name: name || (folder ? 'Ordner' : 'Datei'),
      parent: typeof r.parent === 'string' ? r.parent : ROOT,
      created: typeof r.created === 'string' && r.created.length <= 40 ? r.created : now,
    };
    if (folder) node.folder = true;
    if (content) node.content = content;
    if (typeof r.trashedFrom === 'string' && r.trashedFrom.length <= 64) node.trashedFrom = r.trashedFrom;
    ids.add(r.id);
    out.push(node);
  }
  const folders = new Set(out.filter((n) => n.folder).map((n) => n.id));
  for (const n of out) if (!isSystemFolder(n.parent) && !folders.has(n.parent)) n.parent = ROOT;
  const byId = new Map(out.map((n) => [n.id, n]));
  for (const n of out) {
    const visited = new Set<string>();
    let cur: FileNode | undefined = n;
    while (cur && !isSystemFolder(cur.parent)) {
      if (visited.has(cur.id)) {
        n.parent = ROOT;
        break;
      }
      visited.add(cur.id);
      cur = byId.get(cur.parent);
    }
  }
  return out;
}

function sanitizeStickers(raw: unknown): Sticker[] {
  if (!Array.isArray(raw)) return [];
  const out: Sticker[] = [];
  for (const s of raw) {
    if (out.length >= MAX_STICKERS) break;
    if (!isRecord(s) || typeof s.id !== 'string' || s.id.length > 64 || !isEmoji(s.emoji)) continue;
    out.push({ id: s.id, emoji: s.emoji, x: num(s.x, 0.5, 0, 1), y: num(s.y, 0.5, 0, 1) });
  }
  return out;
}

function sanitizePin(raw: unknown): Pin | undefined {
  if (!isRecord(raw)) return undefined;
  if ((raw.kind !== 'bilder' && raw.kind !== 'zahlen') || typeof raw.hash !== 'string' || !/^[0-9a-f]{8}$/.test(raw.hash)) {
    return undefined;
  }
  return { kind: raw.kind, hash: raw.hash };
}

function sanitizeProgress(raw: unknown): Profile['progress'] {
  const out: Profile['progress'] = {};
  if (!isRecord(raw)) return out;
  for (const [appId, levels] of Object.entries(raw)) {
    if (!KEY_PATTERN.test(appId) || !isRecord(levels)) continue;
    const clean: Record<string, LevelRecord> = {};
    for (const [levelId, rec] of Object.entries(levels)) {
      if (!KEY_PATTERN.test(levelId) || !isRecord(rec)) continue;
      const entry: LevelRecord = {
        stars: int(rec.stars, 0, 0, 3) as Stars,
        plays: int(rec.plays, 0, 0, 1_000_000),
      };
      if (typeof rec.last === 'string' && rec.last.length <= 40) entry.last = rec.last;
      if (typeof rec.best === 'number' && Number.isFinite(rec.best) && rec.best > 0) entry.best = int(rec.best, 0, 0, 100_000);
      clean[levelId] = entry;
    }
    out[appId] = clean;
  }
  return out;
}

export function sanitizeProfile(raw: unknown, now = new Date().toISOString()): Profile | null {
  if (!isRecord(raw)) return null;
  const age = clampAge(typeof raw.age === 'number' ? raw.age : 7);
  const avatar = oneOf(raw.avatar, AVATAR_IDS, 'fox');
  const name =
    typeof raw.name === 'string' && raw.name.trim()
      ? raw.name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME)
      : (AVATARS.find((a) => a.id === avatar)?.name ?? 'Kind');
  const bytes = int(raw.bytes, 0, 0, 100_000_000);
  // Kein Math.max mit dem Kontostand: Erwachsene dürfen Bytes schenken, ohne dass der Rang steigt.
  const bytesEarned = int(raw.bytesEarned, bytes, 0, 100_000_000);
  const features = Array.isArray(raw.features)
    ? [...new Set(raw.features.filter((f): f is Feature => (FEATURES as readonly unknown[]).includes(f)))]
    : [];
  const seen = Array.isArray(raw.seen)
    ? [...new Set(raw.seen.filter((s): s is string => typeof s === 'string' && s.length <= 60))].slice(0, 200)
    : [];

  const createdAt = typeof raw.createdAt === 'string' && raw.createdAt.length <= 40 ? raw.createdAt : now;
  const profile: Profile = {
    id: typeof raw.id === 'string' && raw.id.length > 0 && raw.id.length <= 64 ? raw.id : newId(),
    name,
    avatar,
    age,
    createdAt,
    bytes,
    bytesEarned,
    progress: sanitizeProgress(raw.progress),
    features,
    settings: sanitizeSettings(raw.settings, age),
    seen,
    // Spielstände aus Version 0.1 haben noch keine Dateien – sie bekommen den Startinhalt.
    files: sanitizeFiles(raw.files, createdAt),
    owned: Array.isArray(raw.owned)
      ? [...new Set(raw.owned.filter((id): id is string => typeof id === 'string' && SHOP_IDS.includes(id)))]
      : [],
    stickers: sanitizeStickers(raw.stickers),
  };
  const pin = sanitizePin(raw.pin);
  if (pin) profile.pin = pin;
  if (raw.allOpen === true) profile.allOpen = true;
  return profile;
}

export function sanitizeSave(raw: unknown): SaveData | null {
  if (!isRecord(raw) || raw.format !== SAVE_FORMAT) return null;
  if (typeof raw.version !== 'number' || raw.version > SAVE_VERSION) return null;
  const profiles: Profile[] = [];
  const ids = new Set<string>();
  if (Array.isArray(raw.profiles)) {
    for (const p of raw.profiles) {
      const clean = sanitizeProfile(p);
      if (!clean || ids.has(clean.id)) continue;
      ids.add(clean.id);
      profiles.push(clean);
      if (profiles.length >= MAX_PROFILES) break;
    }
  }
  const data: SaveData = { format: SAVE_FORMAT, version: SAVE_VERSION, profiles };
  if (typeof raw.lastProfileId === 'string' && ids.has(raw.lastProfileId)) data.lastProfileId = raw.lastProfileId;
  return data;
}

// ---------------------------------------------------------------------------
// Browser-Speicher
// ---------------------------------------------------------------------------

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function loadSave(store: Storage | null = storage()): { data: SaveData; ok: boolean } {
  if (!store) return { data: emptySave(), ok: false };
  try {
    const text = store.getItem(SAVE_KEY);
    if (!text) return { data: emptySave(), ok: true };
    return { data: sanitizeSave(JSON.parse(text)) ?? emptySave(), ok: true };
  } catch {
    return { data: emptySave(), ok: false };
  }
}

export function writeSave(data: SaveData, store: Storage | null = storage()): boolean {
  return writeSaveText(JSON.stringify(data), store);
}

export function writeSaveText(text: string, store: Storage | null = storage()): boolean {
  if (!store) return false;
  try {
    store.setItem(SAVE_KEY, text);
    return true;
  } catch {
    // Voll oder gesperrt (privater Modus, Kiosk mit InPrivate). Die Datei-Sicherung hilft dann weiter.
    return false;
  }
}

// ---------------------------------------------------------------------------
// Spielstand-Datei
// ---------------------------------------------------------------------------

/** Alle gemalten Bilder, auf die irgendein Profil zeigt */
export function picturesInSave(data: SaveData): Set<string> {
  return new Set(data.profiles.flatMap((p) => picturesIn(p.files)));
}

/** `pictures`: gemalte Bilder als data:-Adressen (siehe core/pictures.ts) – so reisen sie mit. */
export function exportSave(data: SaveData, now: Date, pictures: Record<string, string> = {}): { filename: string; text: string } {
  const date = now.toISOString().slice(0, 10);
  const payload = {
    ...data,
    exportedAt: now.toISOString(),
    app: 'Computerfuchs',
    ...(Object.keys(pictures).length > 0 ? { pictures } : {}),
  };
  return { filename: `computerfuchs-spielstand-${date}.json`, text: JSON.stringify(payload, null, 2) };
}

const PICTURE_DATA = /^data:image\/(?:png|webp|jpeg);base64,[A-Za-z0-9+/]*={0,2}$/;
/** Ein gemaltes Bild ist ein paar Hundert Kilobyte – 16 Millionen Zeichen sind großzügig. */
const MAX_PICTURE_TEXT = 16_000_000;

/** Nur Bilder übernehmen, auf die ein geladenes Profil zeigt, und nur echte PNG/WebP/JPEG-Daten. */
function sanitizePictures(raw: unknown, data: SaveData): Record<string, string> {
  const out: Record<string, string> = {};
  if (!isRecord(raw)) return out;
  const wanted = picturesInSave(data);
  for (const [id, value] of Object.entries(raw)) {
    if (!wanted.has(id) || typeof value !== 'string' || value.length > MAX_PICTURE_TEXT || !PICTURE_DATA.test(value)) continue;
    out[id] = value;
  }
  return out;
}

export type ParseResult = { ok: true; data: SaveData; pictures: Record<string, string> } | { ok: false; reason: string };

export function parseSaveFile(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'Die Datei ist kein Computerfuchs-Spielstand.' };
  }
  if (!isRecord(raw) || raw.format !== SAVE_FORMAT) {
    return { ok: false, reason: 'Die Datei ist kein Computerfuchs-Spielstand.' };
  }
  if (typeof raw.version === 'number' && raw.version > SAVE_VERSION) {
    return { ok: false, reason: 'Der Spielstand stammt aus einer neueren Version. Bitte die Seite neu laden.' };
  }
  const data = sanitizeSave(raw);
  if (!data || data.profiles.length === 0) return { ok: false, reason: 'In der Datei steckt kein Profil.' };
  return { ok: true, data, pictures: sanitizePictures(raw.pictures, data) };
}

/** Geladene Profile übernehmen: gleiche ID ersetzt, neue kommen dazu. */
export function mergeSaves(current: SaveData, incoming: SaveData): { data: SaveData; added: number; replaced: number } {
  const profiles = [...current.profiles];
  let added = 0;
  let replaced = 0;
  for (const p of incoming.profiles) {
    const idx = profiles.findIndex((q) => q.id === p.id);
    if (idx >= 0) {
      profiles[idx] = p;
      replaced++;
    } else if (profiles.length < MAX_PROFILES) {
      profiles.push(p);
      added++;
    }
  }
  return { data: { ...current, profiles }, added, replaced };
}
