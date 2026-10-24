import type { WallpaperId } from './catalog';
import type { EmojiName } from './emoji';

/*
 * Ein kleines Dateisystem pro Profil. Ordner und Dateien sind einfache
 * Einträge mit einem Eltern-Ordner; alle Operationen sind reine Funktionen,
 * damit sie sich testen lassen und nie etwas „halb“ passiert.
 *
 * Die Systemordner (Mein Computer, Bilder, Musik, Dokumente, Downloads,
 * Papierkorb) gibt es immer – sie werden nicht gespeichert.
 */

export type SongId = 'entchen' | 'haenschen' | 'jakob' | 'morgen' | 'geburtstag';
export const SONG_IDS: readonly SongId[] = ['entchen', 'haenschen', 'jakob', 'morgen', 'geburtstag'];

export type CursorSkinId = 'standard' | 'orange' | 'regenbogen' | 'lila' | 'gruen';
export const CURSOR_SKIN_IDS: readonly CursorSkinId[] = ['standard', 'orange', 'regenbogen', 'lila', 'gruen'];

export type FileContent =
  | { type: 'bild'; emoji: EmojiName }
  /** Im Malkasten gemalt; die Pixel liegen unter `picture` in der IndexedDB (core/pictures.ts). */
  | { type: 'gemalt'; picture: string }
  | { type: 'hintergrund'; wallpaper: WallpaperId }
  | { type: 'zeiger'; cursor: CursorSkinId }
  | { type: 'sticker'; emoji: EmojiName }
  | { type: 'musik'; song: SongId }
  | { type: 'text'; text: string };

export type FileType = FileContent['type'];

export interface FileNode {
  id: string;
  /** Ohne Endung – die zeigt die Oberfläche je nach Einstellung an. */
  name: string;
  /** Ordner, in dem der Eintrag liegt. Im Papierkorb: 'trash'. */
  parent: string;
  folder?: boolean;
  content?: FileContent;
  /** Woher ein Eintrag im Papierkorb kam – für „Wiederherstellen“. */
  trashedFrom?: string;
  created: string;
}

/** IDs gemalter Bilder: „pic-“ und eine zufällige Kennung */
const PICTURE_ID = /^pic-[a-z0-9-]{8,64}$/;

export function isPictureId(id: unknown): id is string {
  return typeof id === 'string' && PICTURE_ID.test(id);
}

export const ROOT = 'root';
export const TRASH = 'trash';

export const SYSTEM_FOLDERS: { id: string; name: string; parent: string; icon: EmojiName }[] = [
  { id: ROOT, name: 'Mein Computer', parent: '', icon: 'laptop' },
  { id: 'bilder', name: 'Bilder', parent: ROOT, icon: 'artist-palette' },
  { id: 'musik', name: 'Musik', parent: ROOT, icon: 'musical-notes' },
  { id: 'dokumente', name: 'Dokumente', parent: ROOT, icon: 'memo' },
  { id: 'downloads', name: 'Downloads', parent: ROOT, icon: 'package' },
  { id: TRASH, name: 'Papierkorb', parent: '', icon: 'wastebasket' },
];

const SYSTEM_IDS = new Set(SYSTEM_FOLDERS.map((f) => f.id));

export function isSystemFolder(id: string): boolean {
  return SYSTEM_IDS.has(id);
}

/** Echte Dateiendungen – wer sie einschaltet, lernt, was .jpg und .mp3 bedeuten. */
export const EXTENSION: Record<FileType, string> = {
  bild: 'jpg',
  gemalt: 'png',
  hintergrund: 'jpg',
  zeiger: 'cur',
  sticker: 'png',
  musik: 'mp3',
  text: 'txt',
};

export const TYPE_NAME: Record<FileType, string> = {
  bild: 'Bild',
  gemalt: 'Gemaltes Bild',
  hintergrund: 'Hintergrundbild',
  zeiger: 'Mauszeiger',
  sticker: 'Sticker',
  musik: 'Lied',
  text: 'Textdatei',
};

export function displayName(node: FileNode, showExtension: boolean): string {
  if (node.folder || !node.content || !showExtension) return node.name;
  return `${node.name}.${EXTENSION[node.content.type]}`;
}

// ---------------------------------------------------------------------------
// Startinhalt
// ---------------------------------------------------------------------------

/** IDs der Übungsdateien, auf die sich die Aufgaben beziehen. */
export const SEED = {
  hund: 'f-hund',
  katze: 'f-katze',
  gespenst: 'f-gespenst',
  dlBild: 'f-dl-bild',
  dlMusik: 'f-dl-musik',
  dlText: 'f-dl-text',
} as const;

export function seedFiles(now: string): FileNode[] {
  const f = (id: string, name: string, parent: string, content: FileContent): FileNode => ({ id, name, parent, content, created: now });
  return [
    f(SEED.hund, 'Hund', 'bilder', { type: 'bild', emoji: 'dog-face' }),
    f(SEED.katze, 'Katze', 'bilder', { type: 'bild', emoji: 'cat-face' }),
    f('f-sonnenblume', 'Sonnenblume', 'bilder', { type: 'bild', emoji: 'sunflower' }),
    f(SEED.gespenst, 'Altes Gespenst', 'bilder', { type: 'bild', emoji: 'ghost' }),
    f('f-entchen', 'Alle meine Entchen', 'musik', { type: 'musik', song: 'entchen' }),
    f('f-einkauf', 'Einkaufsliste', 'dokumente', { type: 'text', text: 'Äpfel\nMilch\nBrot\nKekse für Flinn' }),
    f('f-oma', 'Brief an Oma', 'dokumente', {
      type: 'text',
      text: 'Liebe Oma,\n\nich lerne gerade am Computer. Heute habe ich schon Ballons platzen lassen und Tiere gefüttert!\n\nViele Grüße',
    }),
    f(SEED.dlBild, 'Muschel vom Strand', 'downloads', { type: 'bild', emoji: 'spiral-shell' }),
    f(SEED.dlMusik, 'Hänschen klein', 'downloads', { type: 'musik', song: 'haenschen' }),
    f(SEED.dlText, 'Hausaufgaben', 'downloads', { type: 'text', text: 'Rechnen: Seite 12, Aufgaben 1 bis 5.\nLesen: eine Seite im Lieblingsbuch.' }),
  ];
}

/** Fehlende Übungsdateien zurückholen, ohne Vorhandenes anzufassen. */
export function restoreSeed(files: FileNode[], now: string): FileNode[] {
  const have = new Set(files.map((n) => n.id));
  return [...files, ...seedFiles(now).filter((n) => !have.has(n.id))];
}

// ---------------------------------------------------------------------------
// Lesen
// ---------------------------------------------------------------------------

export function nodeById(files: FileNode[], id: string): FileNode | undefined {
  return files.find((n) => n.id === id);
}

export function isFolder(files: FileNode[], id: string): boolean {
  return isSystemFolder(id) || files.some((n) => n.id === id && n.folder);
}

export function folderName(files: FileNode[], id: string): string {
  return SYSTEM_FOLDERS.find((f) => f.id === id)?.name ?? nodeById(files, id)?.name ?? '?';
}

/** Inhalt eines Ordners: Ordner zuerst, dann nach Name. */
export function childrenOf(files: FileNode[], folder: string): FileNode[] {
  const list = files.filter((n) => n.parent === folder);
  return list.sort((a, b) => Number(!!b.folder) - Number(!!a.folder) || a.name.localeCompare(b.name, 'de'));
}

/** Systemordner, die direkt in „Mein Computer“ liegen, als Einträge. */
export function systemChildren(folder: string): typeof SYSTEM_FOLDERS {
  return SYSTEM_FOLDERS.filter((f) => f.parent === folder && f.id !== TRASH);
}

export function parentOf(files: FileNode[], id: string): string {
  return SYSTEM_FOLDERS.find((f) => f.id === id)?.parent ?? nodeById(files, id)?.parent ?? '';
}

/** Pfad von „Mein Computer“ bis zum Ordner. */
export function pathOf(files: FileNode[], id: string): { id: string; name: string }[] {
  const out: { id: string; name: string }[] = [];
  let cur = id;
  for (let guard = 0; cur && guard < 50; guard++) {
    out.unshift({ id: cur, name: folderName(files, cur) });
    cur = parentOf(files, cur);
  }
  return out;
}

/** Alle gemalten Bilder, auf die Dateien zeigen */
export function picturesIn(files: FileNode[]): string[] {
  return files.flatMap((n) => (n.content?.type === 'gemalt' ? [n.content.picture] : []));
}

/** Liegt `id` in `folder` (oder tiefer)? */
export function isInside(files: FileNode[], id: string, folder: string): boolean {
  let cur = parentOf(files, id);
  for (let guard = 0; cur && guard < 50; guard++) {
    if (cur === folder) return true;
    cur = parentOf(files, cur);
  }
  return false;
}

function descendants(files: FileNode[], id: string): Set<string> {
  const out = new Set<string>();
  const walk = (parent: string) => {
    for (const n of files) {
      if (n.parent === parent && !out.has(n.id)) {
        out.add(n.id);
        if (n.folder) walk(n.id);
      }
    }
  };
  walk(id);
  return out;
}

// ---------------------------------------------------------------------------
// Namen
// ---------------------------------------------------------------------------

export type FsError = 'leer' | 'zeichen' | 'zu-lang' | 'vergeben' | 'system' | 'in-sich-selbst' | 'nicht-gefunden' | 'kein-ordner';

export const FS_ERROR_TEXT: Record<FsError, string> = {
  leer: 'Ein Name darf nicht leer sein.',
  zeichen: 'Diese Zeichen gehen in Namen nicht: \\ / : * ? " < > |',
  'zu-lang': 'Der Name ist zu lang – höchstens 40 Zeichen.',
  vergeben: 'Diesen Namen gibt es hier schon.',
  system: 'Das ist ein Systemordner. Den kann man nicht umbenennen, verschieben oder löschen.',
  'in-sich-selbst': 'Ein Ordner kann nicht in sich selbst liegen.',
  'nicht-gefunden': 'Das gibt es nicht mehr.',
  'kein-ordner': 'Dort kann man nichts hineinlegen.',
};

export const MAX_NAME_LENGTH = 40;
const FORBIDDEN = /[\\/:*?"<>|]/;

/** Dieselben Regeln wie unter Windows – so lernt man sie gleich richtig. */
export function validateName(name: string): FsError | null {
  const trimmed = name.trim();
  if (!trimmed) return 'leer';
  if (FORBIDDEN.test(trimmed)) return 'zeichen';
  if (trimmed.length > MAX_NAME_LENGTH) return 'zu-lang';
  return null;
}

function kindKey(n: Pick<FileNode, 'folder' | 'content'>): string {
  return n.folder ? '/' : n.content ? EXTENSION[n.content.type] : '';
}

function clash(files: FileNode[], parent: string, name: string, key: string, except?: string): boolean {
  const lower = name.trim().toLocaleLowerCase('de');
  if (parent === ROOT && SYSTEM_FOLDERS.some((f) => f.parent === ROOT && f.name.toLocaleLowerCase('de') === lower && key === '/')) {
    return true;
  }
  return files.some((n) => n.id !== except && n.parent === parent && kindKey(n) === key && n.name.toLocaleLowerCase('de') === lower);
}

/** „Neuer Ordner“, „Neuer Ordner (2)“, … */
export function uniqueName(files: FileNode[], parent: string, base: string, key: string, except?: string): string {
  if (!clash(files, parent, base, key, except)) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base} (${i})`;
    if (!clash(files, parent, candidate, key, except)) return candidate;
  }
  return `${base} (${Date.now()})`;
}

// ---------------------------------------------------------------------------
// Ändern
// ---------------------------------------------------------------------------

export type FsResult = { ok: true; files: FileNode[]; id?: string } | { ok: false; error: FsError };

const fail = (error: FsError): FsResult => ({ ok: false, error });

export function createFolder(files: FileNode[], parent: string, name: string, id: string, now: string): FsResult {
  if (!isFolder(files, parent) || parent === TRASH) return fail('kein-ordner');
  const error = validateName(name);
  if (error) return fail(error);
  const clean = uniqueName(files, parent, name.trim(), '/');
  return { ok: true, files: [...files, { id, name: clean, parent, folder: true, created: now }], id };
}

export function addFile(files: FileNode[], parent: string, name: string, content: FileContent, id: string, now: string): FsResult {
  if (!isFolder(files, parent) || parent === TRASH) return fail('kein-ordner');
  const clean = uniqueName(files, parent, name.trim() || 'Datei', EXTENSION[content.type]);
  return { ok: true, files: [...files, { id, name: clean, parent, content, created: now }], id };
}

export function rename(files: FileNode[], id: string, name: string): FsResult {
  if (isSystemFolder(id)) return fail('system');
  const node = nodeById(files, id);
  if (!node) return fail('nicht-gefunden');
  const error = validateName(name);
  if (error) return fail(error);
  const clean = name.trim();
  if (clean === node.name) return { ok: true, files, id };
  if (clash(files, node.parent, clean, kindKey(node), id)) return fail('vergeben');
  return { ok: true, files: files.map((n) => (n.id === id ? { ...n, name: clean } : n)), id };
}

export function move(files: FileNode[], id: string, target: string): FsResult {
  if (isSystemFolder(id)) return fail('system');
  const node = nodeById(files, id);
  if (!node) return fail('nicht-gefunden');
  if (target === TRASH) return trash(files, id);
  if (!isFolder(files, target)) return fail('kein-ordner');
  if (target === id || descendants(files, id).has(target)) return fail('in-sich-selbst');
  if (node.parent === target) return { ok: true, files, id };
  const name = uniqueName(files, target, node.name, kindKey(node), id);
  return {
    ok: true,
    files: files.map((n) => (n.id === id ? { ...n, parent: target, name, trashedFrom: undefined } : n)),
    id,
  };
}

/** Kopie mit neuen IDs; Ordner samt Inhalt. */
export function copy(files: FileNode[], id: string, target: string, makeId: () => string, now: string): FsResult {
  const node = nodeById(files, id);
  if (!node) return fail('nicht-gefunden');
  if (!isFolder(files, target) || target === TRASH) return fail('kein-ordner');
  if (target === id || descendants(files, id).has(target)) return fail('in-sich-selbst');
  const added: FileNode[] = [];
  const clone = (src: FileNode, parent: string, name: string): string => {
    const newId = makeId();
    added.push({ ...src, id: newId, parent, name, created: now, trashedFrom: undefined });
    if (src.folder) {
      for (const child of files.filter((n) => n.parent === src.id)) clone(child, newId, child.name);
    }
    return newId;
  };
  const base = node.parent === target ? `${node.name} (Kopie)` : node.name;
  const newRoot = clone(node, target, uniqueName(files, target, base, kindKey(node)));
  return { ok: true, files: [...files, ...added], id: newRoot };
}

export function trash(files: FileNode[], id: string): FsResult {
  if (isSystemFolder(id)) return fail('system');
  const node = nodeById(files, id);
  if (!node) return fail('nicht-gefunden');
  if (node.parent === TRASH) return { ok: true, files, id };
  return {
    ok: true,
    files: files.map((n) => (n.id === id ? { ...n, parent: TRASH, trashedFrom: node.parent } : n)),
    id,
  };
}

export function restore(files: FileNode[], id: string): FsResult {
  const node = nodeById(files, id);
  if (!node || node.parent !== TRASH) return fail('nicht-gefunden');
  // Gibt es den alten Ordner nicht mehr (oder liegt er selbst im Papierkorb), kommt es nach „Mein Computer“.
  const from = node.trashedFrom && isFolder(files, node.trashedFrom) && !isInside(files, node.trashedFrom, TRASH) && node.trashedFrom !== TRASH
    ? node.trashedFrom
    : ROOT;
  const name = uniqueName(files, from, node.name, kindKey(node), id);
  return {
    ok: true,
    files: files.map((n) => (n.id === id ? { ...n, parent: from, name, trashedFrom: undefined } : n)),
    id,
  };
}

/** Endgültig löschen – samt Inhalt, wenn es ein Ordner ist. */
export function purge(files: FileNode[], id: string): FsResult {
  const node = nodeById(files, id);
  if (!node) return fail('nicht-gefunden');
  const gone = descendants(files, id);
  gone.add(id);
  return { ok: true, files: files.filter((n) => !gone.has(n.id)) };
}

export function emptyTrash(files: FileNode[]): FileNode[] {
  let next = files;
  for (const n of files.filter((x) => x.parent === TRASH)) {
    const r = purge(next, n.id);
    if (r.ok) next = r.files;
  }
  return next;
}

/** Ungefähre Größe für die Speicheranzeige – damit „Mein Computer“ wie ein echter aussieht. */
export function fakeSize(n: FileNode): number {
  if (n.folder || !n.content) return 0;
  switch (n.content.type) {
    case 'bild':
      return 240_000;
    case 'gemalt':
      return 320_000;
    case 'hintergrund':
      return 1_200_000;
    case 'zeiger':
      return 4_000;
    case 'sticker':
      return 60_000;
    case 'musik':
      return 3_500_000;
    case 'text':
      return Math.max(1, n.content.text.length);
  }
}

// ---------------------------------------------------------------------------
// Aufgaben von Flinn
// ---------------------------------------------------------------------------

export interface FsEvent {
  kind: 'navigate' | 'open' | 'restore';
  id: string;
}

export interface Mission {
  id: string;
  text: string;
  check: (files: FileNode[], events: FsEvent[]) => boolean;
}

const folderNamed = (files: FileNode[], parent: string, name: string) =>
  files.find((n) => n.folder && n.parent === parent && n.name.toLocaleLowerCase('de') === name);

export const MISSIONS: Mission[] = [
  {
    id: 'ordner-oeffnen',
    text: 'Öffne den Ordner „Bilder“.',
    check: (_f, ev) => ev.some((e) => e.kind === 'navigate' && e.id === 'bilder'),
  },
  {
    id: 'bild-oeffnen',
    text: 'Öffne das Bild vom Hund.',
    check: (_f, ev) => ev.some((e) => e.kind === 'open' && e.id === SEED.hund),
  },
  {
    id: 'aufraeumen',
    text: 'Räum die Downloads auf: das Bild zu „Bilder“, das Lied zu „Musik“ und den Text zu „Dokumente“.',
    check: (f) =>
      isInside(f, SEED.dlBild, 'bilder') && isInside(f, SEED.dlMusik, 'musik') && isInside(f, SEED.dlText, 'dokumente'),
  },
  {
    id: 'neuer-ordner',
    text: 'Leg in „Bilder“ einen neuen Ordner an und nenne ihn „Tiere“.',
    check: (f) => !!folderNamed(f, 'bilder', 'tiere'),
  },
  {
    id: 'verschieben',
    text: 'Schieb den Hund und die Katze in den Ordner „Tiere“.',
    check: (f) => {
      const tiere = folderNamed(f, 'bilder', 'tiere');
      return !!tiere && nodeById(f, SEED.hund)?.parent === tiere.id && nodeById(f, SEED.katze)?.parent === tiere.id;
    },
  },
  {
    id: 'papierkorb',
    text: 'Lösch das alte Gespenst-Bild – und hol es danach aus dem Papierkorb zurück.',
    check: (_f, ev) => ev.some((e) => e.kind === 'restore' && e.id === SEED.gespenst),
  },
];
