import { describe, expect, it } from 'vitest';
import {
  MISSIONS, ROOT, SEED, TRASH, childrenOf, copy, createFolder, displayName, emptyTrash, isInside, move, nodeById,
  pathOf, purge, rename, restore, restoreSeed, seedFiles, trash, uniqueName, validateName, type FileNode,
} from './files';
import { checkPin, isValidCode, makePin } from './pin';
import { createProfile } from './profile';
import { SHOP, buy, shopItem } from './shop';
import { noteFrequency, songDuration, SONGS } from './songs';
import { sanitizeFiles, sanitizeProfile } from './storage';

const NOW = '2026-10-23T12:00:00.000Z';
let counter = 0;
const makeId = () => `n${++counter}`;

function must<T extends { ok: boolean }>(r: T): Extract<T, { ok: true }> {
  if (!r.ok) throw new Error(`erwartet ok, bekam ${JSON.stringify(r)}`);
  return r as Extract<T, { ok: true }>;
}

describe('Dateisystem', () => {
  const start = seedFiles(NOW);

  it('startet mit Übungsdateien in den richtigen Ordnern', () => {
    expect(childrenOf(start, 'bilder').map((n) => n.name)).toEqual(['Altes Gespenst', 'Hund', 'Katze', 'Sonnenblume']);
    expect(childrenOf(start, 'downloads')).toHaveLength(3);
    expect(pathOf(start, 'bilder').map((p) => p.name)).toEqual(['Mein Computer', 'Bilder']);
  });

  it('legt Ordner mit freien Namen an', () => {
    let f = must(createFolder(start, 'bilder', 'Neuer Ordner', 'a', NOW)).files;
    f = must(createFolder(f, 'bilder', 'Neuer Ordner', 'b', NOW)).files;
    expect(nodeById(f, 'b')?.name).toBe('Neuer Ordner (2)');
    expect(createFolder(f, TRASH, 'x', 'c', NOW)).toEqual({ ok: false, error: 'kein-ordner' });
  });

  it('prüft Namen wie ein echter Computer', () => {
    expect(validateName('   ')).toBe('leer');
    expect(validateName('Was?')).toBe('zeichen');
    expect(validateName('a'.repeat(41))).toBe('zu-lang');
    expect(validateName('Urlaub 2026')).toBeNull();
    expect(rename(start, SEED.hund, 'Katze')).toEqual({ ok: false, error: 'vergeben' });
    expect(rename(start, 'bilder', 'Fotos')).toEqual({ ok: false, error: 'system' });
    expect(nodeById(must(rename(start, SEED.hund, 'Bello')).files, SEED.hund)?.name).toBe('Bello');
  });

  it('erlaubt gleiche Namen für verschiedene Dateiarten', () => {
    // „Hund.jpg" und „Hund.txt" dürfen nebeneinander liegen.
    expect(uniqueName(start, 'bilder', 'Hund', 'txt')).toBe('Hund');
    expect(uniqueName(start, 'bilder', 'Hund', 'jpg')).toBe('Hund (2)');
  });

  it('verschiebt, aber nie einen Ordner in sich selbst', () => {
    let f = must(createFolder(start, 'bilder', 'Tiere', 'tiere', NOW)).files;
    f = must(createFolder(f, 'tiere', 'Hunde', 'hunde', NOW)).files;
    f = must(move(f, SEED.hund, 'hunde')).files;
    expect(isInside(f, SEED.hund, 'bilder')).toBe(true);
    expect(move(f, 'tiere', 'hunde')).toEqual({ ok: false, error: 'in-sich-selbst' });
    expect(move(f, 'tiere', 'tiere')).toEqual({ ok: false, error: 'in-sich-selbst' });
    expect(move(f, 'bilder', 'musik')).toEqual({ ok: false, error: 'system' });
  });

  it('benennt beim Verschieben um, wenn der Name schon da ist', () => {
    const f = must(addFileTo(start, 'downloads', 'Hund')).files;
    const moved = must(move(f, 'neu', 'bilder')).files;
    expect(nodeById(moved, 'neu')?.name).toBe('Hund (2)');
  });

  it('kopiert Ordner samt Inhalt', () => {
    let f = must(createFolder(start, 'bilder', 'Tiere', 'tiere', NOW)).files;
    f = must(move(f, SEED.hund, 'tiere')).files;
    const r = must(copy(f, 'tiere', 'bilder', makeId, NOW));
    const kopie = nodeById(r.files, r.id!);
    expect(kopie?.name).toBe('Tiere (Kopie)');
    expect(childrenOf(r.files, r.id!).map((n) => n.name)).toEqual(['Hund']);
  });

  it('wirft in den Papierkorb und holt zurück', () => {
    let f = must(trash(start, SEED.gespenst)).files;
    expect(nodeById(f, SEED.gespenst)?.parent).toBe(TRASH);
    f = must(restore(f, SEED.gespenst)).files;
    expect(nodeById(f, SEED.gespenst)?.parent).toBe('bilder');
    expect(trash(f, 'downloads')).toEqual({ ok: false, error: 'system' });
  });

  it('holt nach „Mein Computer", wenn der alte Ordner fehlt', () => {
    let f = must(createFolder(start, ROOT, 'Kram', 'kram', NOW)).files;
    f = must(move(f, SEED.katze, 'kram')).files;
    f = must(trash(f, SEED.katze)).files;
    f = must(purge(f, 'kram')).files;
    f = must(restore(f, SEED.katze)).files;
    expect(nodeById(f, SEED.katze)?.parent).toBe(ROOT);
  });

  it('löscht endgültig samt Inhalt und leert den Papierkorb', () => {
    let f = must(createFolder(start, 'bilder', 'Tiere', 'tiere', NOW)).files;
    f = must(move(f, SEED.hund, 'tiere')).files;
    f = must(trash(f, 'tiere')).files;
    f = emptyTrash(f);
    expect(nodeById(f, 'tiere')).toBeUndefined();
    expect(nodeById(f, SEED.hund)).toBeUndefined();
    expect(restoreSeed(f, NOW).some((n) => n.id === SEED.hund)).toBe(true);
  });

  it('zeigt Endungen nur, wenn man sie einschaltet', () => {
    const hund = nodeById(start, SEED.hund)!;
    expect(displayName(hund, false)).toBe('Hund');
    expect(displayName(hund, true)).toBe('Hund.jpg');
  });
});

function addFileTo(files: FileNode[], parent: string, name: string) {
  return { ok: true as const, files: [...files, { id: 'neu', name, parent, content: { type: 'bild' as const, emoji: 'dog-face' as const }, created: NOW }] };
}

describe('Aufgaben in der Dateien-App', () => {
  const done = (files: FileNode[], events: { kind: 'navigate' | 'open' | 'restore'; id: string }[] = []) =>
    MISSIONS.filter((m) => m.check(files, events)).map((m) => m.id);

  it('ist am Anfang keine erfüllt', () => {
    expect(done(seedFiles(NOW))).toEqual([]);
  });

  it('erkennt Aufräumen, neuen Ordner und Verschieben', () => {
    let f = seedFiles(NOW);
    f = must(move(f, SEED.dlBild, 'bilder')).files;
    f = must(move(f, SEED.dlMusik, 'musik')).files;
    f = must(move(f, SEED.dlText, 'dokumente')).files;
    f = must(createFolder(f, 'bilder', 'tiere', 'tiere', NOW)).files;
    f = must(move(f, SEED.hund, 'tiere')).files;
    f = must(move(f, SEED.katze, 'tiere')).files;
    expect(done(f)).toEqual(['aufraeumen', 'neuer-ordner', 'verschieben']);
  });

  it('zählt Öffnen und Zurückholen als Ereignisse', () => {
    const ev = [
      { kind: 'navigate' as const, id: 'bilder' },
      { kind: 'open' as const, id: SEED.hund },
      { kind: 'restore' as const, id: SEED.gespenst },
    ];
    expect(done(seedFiles(NOW), ev)).toEqual(['ordner-oeffnen', 'bild-oeffnen', 'papierkorb']);
  });
});

describe('App-Laden', () => {
  const p0 = { ...createProfile({ name: 'A', avatar: 'fox', age: 7 }, 'p', NOW), bytes: 130, bytesEarned: 400 };
  const regenbogen = shopItem('hg-regenbogen')!;

  it('zieht Bytes ab und legt die Datei in die Downloads', () => {
    const r = buy(p0, regenbogen, 'dl1', NOW);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.profile.bytes).toBe(10);
    expect(r.profile.bytesEarned).toBe(400);
    expect(r.profile.owned).toEqual(['hg-regenbogen']);
    expect(nodeById(r.profile.files, 'dl1')).toMatchObject({ parent: 'downloads', name: 'Regenbogenland' });
  });

  it('lädt Gekauftes kostenlos noch einmal', () => {
    const first = buy(p0, regenbogen, 'dl1', NOW);
    if (!first.ok) throw new Error();
    const again = buy({ ...first.profile, bytes: 0 }, regenbogen, 'dl2', NOW);
    expect(again).toMatchObject({ ok: true, again: true });
    if (again.ok) expect(nodeById(again.profile.files, 'dl2')?.name).toBe('Regenbogenland (2)');
  });

  it('sagt, wie viele Bytes fehlen', () => {
    expect(buy({ ...p0, bytes: 100 }, regenbogen, 'x', NOW)).toEqual({ ok: false, missing: 20 });
  });

  it('hat nur sinnvolle Preise', () => {
    for (const item of SHOP) expect(item.price).toBeGreaterThan(0);
    expect(new Set(SHOP.map((i) => i.id)).size).toBe(SHOP.length);
  });
});

describe('Geheimcode', () => {
  it('prüft den Code, ohne ihn im Klartext zu speichern', () => {
    const pin = makePin('p1', 'bilder', '3517');
    expect(pin.hash).toMatch(/^[0-9a-f]{8}$/);
    expect(JSON.stringify(pin)).not.toContain('3517');
    expect(checkPin(pin, 'p1', '3517')).toBe(true);
    expect(checkPin(pin, 'p1', '3571')).toBe(false);
    expect(checkPin(pin, 'p2', '3517')).toBe(false);
  });

  it('kennt gültige Codes', () => {
    expect(isValidCode('bilder', '0812')).toBe(true);
    expect(isValidCode('bilder', '0912')).toBe(false);
    expect(isValidCode('zahlen', '0912')).toBe(true);
    expect(isValidCode('zahlen', '12')).toBe(false);
  });
});

describe('Lieder', () => {
  it('rechnet Töne richtig um', () => {
    expect(noteFrequency('A4')).toBeCloseTo(440);
    expect(noteFrequency('C4')).toBeCloseTo(261.63, 1);
    expect(noteFrequency('R')).toBe(0);
  });

  it('sind alle spielbar und nicht zu lang', () => {
    for (const song of Object.values(SONGS)) {
      for (const [tone] of song.notes) expect(noteFrequency(tone)).toBeGreaterThan(0);
      expect(songDuration(song)).toBeLessThan(40);
    }
  });
});

describe('Spielstand mit Dateien', () => {
  it('gibt alten Spielständen ohne Dateien den Startinhalt', () => {
    const p = sanitizeProfile({ id: 'alt', name: 'Alt', avatar: 'fox', age: 6 });
    expect(p?.files.some((n) => n.id === SEED.hund)).toBe(true);
    expect(p?.owned).toEqual([]);
  });

  it('repariert kaputte Dateisysteme', () => {
    const files = sanitizeFiles(
      [
        { id: 'a', name: 'A', parent: 'b', folder: true },
        { id: 'b', name: 'B', parent: 'a', folder: true },
        { id: 'c', name: 'Wa/s?', parent: 'gibt-es-nicht', content: { type: 'bild', emoji: 'dog-face' } },
        { id: 'd', name: 'Böse', parent: ROOT, content: { type: 'bild', emoji: '<script>' } },
        { id: 'bilder', name: 'Doppelt', parent: ROOT, folder: true },
        'Quatsch',
      ],
      NOW,
    );
    expect(files.map((n) => n.id)).toEqual(['a', 'b', 'c']);
    expect(files.find((n) => n.id === 'c')).toMatchObject({ name: 'Was', parent: ROOT });
    // Der Kreis a ↔ b ist aufgelöst: Beide liegen irgendwo unter „Mein Computer".
    expect(files.some((n) => n.parent === ROOT && (n.id === 'a' || n.id === 'b'))).toBe(true);
  });

  it('behält nur bekannte Käufe und gültige Sticker', () => {
    const p = sanitizeProfile({
      id: 'x', name: 'X', avatar: 'fox', age: 8,
      owned: ['hg-regenbogen', 'gibt-es-nicht', 'hg-regenbogen'],
      stickers: [{ id: 's', emoji: 'unicorn', x: 2, y: -1 }, { id: 't', emoji: 'quatsch', x: 0, y: 0 }],
      pin: { kind: 'bilder', hash: 'zzzz' },
    });
    expect(p?.owned).toEqual(['hg-regenbogen']);
    expect(p?.stickers).toEqual([{ id: 's', emoji: 'unicorn', x: 1, y: 0 }]);
    expect(p?.pin).toBeUndefined();
  });
});
