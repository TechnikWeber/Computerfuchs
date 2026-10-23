import { AVATARS, WALLPAPERS, type AvatarId, type WallpaperId } from './catalog';
import {
  CURSOR_SIZES, FEATURES, MAX_NAME, clampAge, defaultSettings,
  type CursorSize, type Feature, type LevelRecord, type Profile, type ProfileSettings, type Stars,
} from './profile';

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
const KEY_PATTERN = /^[a-z0-9-]{1,40}$/;

function sanitizeSettings(raw: unknown, age: number): ProfileSettings {
  const base = defaultSettings(age);
  if (!isRecord(raw)) return base;
  return {
    wallpaper: oneOf(raw.wallpaper, WALLPAPER_IDS, base.wallpaper),
    sound: typeof raw.sound === 'boolean' ? raw.sound : base.sound,
    volume: num(raw.volume, base.volume, 0, 1),
    voice: typeof raw.voice === 'boolean' ? raw.voice : base.voice,
    cursor: oneOf<CursorSize>(raw.cursor, CURSOR_SIZES, base.cursor),
    doubleClickMs: int(raw.doubleClickMs, base.doubleClickMs, 250, 1500),
  };
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
  const bytesEarned = Math.max(bytes, int(raw.bytesEarned, bytes, 0, 100_000_000));
  const features = Array.isArray(raw.features)
    ? [...new Set(raw.features.filter((f): f is Feature => (FEATURES as readonly unknown[]).includes(f)))]
    : [];
  const seen = Array.isArray(raw.seen)
    ? [...new Set(raw.seen.filter((s): s is string => typeof s === 'string' && s.length <= 60))].slice(0, 200)
    : [];

  return {
    id: typeof raw.id === 'string' && raw.id.length > 0 && raw.id.length <= 64 ? raw.id : newId(),
    name,
    avatar,
    age,
    createdAt: typeof raw.createdAt === 'string' && raw.createdAt.length <= 40 ? raw.createdAt : now,
    bytes,
    bytesEarned,
    progress: sanitizeProgress(raw.progress),
    features,
    settings: sanitizeSettings(raw.settings, age),
    seen,
  };
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

export function exportSave(data: SaveData, now: Date): { filename: string; text: string } {
  const date = now.toISOString().slice(0, 10);
  const payload = { ...data, exportedAt: now.toISOString(), app: 'Computerfuchs' };
  return { filename: `computerfuchs-spielstand-${date}.json`, text: JSON.stringify(payload, null, 2) };
}

export type ParseResult = { ok: true; data: SaveData } | { ok: false; reason: string };

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
  return { ok: true, data };
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
