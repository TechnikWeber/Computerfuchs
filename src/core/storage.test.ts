import { describe, expect, it } from 'vitest';
import { createProfile } from './profile';
import {
  MAX_PROFILES, emptySave, exportSave, loadSave, mergeSaves, parseSaveFile, sanitizeProfile, sanitizeSave, writeSave,
  type SaveData,
} from './storage';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, String(v)),
  };
}

const mia = createProfile({ name: 'Mia', avatar: 'cat', age: 6 }, 'mia', '2026-10-23T10:00:00.000Z');
const save: SaveData = { ...emptySave(), profiles: [mia], lastProfileId: 'mia' };

describe('Spielstand', () => {
  it('übersteht Speichern und Laden unverändert', () => {
    const store = memoryStorage();
    expect(writeSave(save, store)).toBe(true);
    expect(loadSave(store)).toEqual({ data: save, ok: true });
  });

  it('startet leer, wenn noch nichts gespeichert ist oder der Speicher kaputt ist', () => {
    expect(loadSave(memoryStorage()).data.profiles).toEqual([]);
    const broken = memoryStorage();
    broken.setItem('computerfuchs.save', '{kaputt');
    expect(loadSave(broken)).toEqual({ data: emptySave(), ok: false });
    expect(loadSave(null).ok).toBe(false);
  });

  it('lässt sich als Datei sichern und wieder laden', () => {
    const file = exportSave(save, new Date('2026-10-23T12:00:00Z'));
    expect(file.filename).toBe('computerfuchs-spielstand-2026-10-23.json');
    const parsed = parseSaveFile(file.text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.data.profiles[0]).toEqual(mia);
  });

  it('lehnt fremde und leere Dateien verständlich ab', () => {
    expect(parseSaveFile('Hallo')).toMatchObject({ ok: false });
    expect(parseSaveFile('{"format":"anders"}')).toMatchObject({ ok: false });
    expect(parseSaveFile('{"format":"computerfuchs","version":1,"profiles":[]}')).toMatchObject({ ok: false });
    expect(parseSaveFile('{"format":"computerfuchs","version":99,"profiles":[{}]}')).toMatchObject({
      ok: false,
      reason: expect.stringContaining('neueren Version'),
    });
  });

  it('repariert kaputte Profile, statt abzustürzen', () => {
    const p = sanitizeProfile({
      id: 'x',
      name: '  Ein sehr sehr langer Name  ',
      avatar: 'drache',
      age: 99,
      bytes: -5,
      bytesEarned: 3,
      features: ['doubleClick', 'fliegen', 'doubleClick'],
      progress: { maus: { ballons: { stars: 7, plays: 2 } }, 'BÖSE<script>': {} },
      settings: { cursor: 'gigantisch', volume: 4, wallpaper: 'nacht' },
    });
    expect(p).not.toBeNull();
    expect(p?.name).toBe('Ein sehr sehr la');
    expect(p?.avatar).toBe('fox');
    expect(p?.age).toBe(18);
    expect(p?.bytes).toBe(0);
    expect(p?.features).toEqual(['doubleClick']);
    expect(p?.progress).toEqual({ maus: { ballons: { stars: 3, plays: 2 } } });
    expect(p?.settings.cursor).toBe('normal');
    expect(p?.settings.volume).toBe(1);
    expect(p?.settings.wallpaper).toBe('nacht');
  });

  it('behält „alles offen“ und geschenkte Bytes', () => {
    const p = sanitizeProfile({ ...mia, allOpen: true, bytes: 900, bytesEarned: 200 });
    expect(p?.allOpen).toBe(true);
    // Mehr auf dem Konto als je verdient: geschenkt – der Rang darf dadurch nicht steigen.
    expect(p?.bytes).toBe(900);
    expect(p?.bytesEarned).toBe(200);
    expect(sanitizeProfile({ ...mia, allOpen: 'ja' })?.allOpen).toBeUndefined();
  });

  it('nimmt gemalte Bilder mit in die Datei – und lässt nur gültige wieder herein', () => {
    const painting = { id: 'f-bild', name: 'Mein Haus', parent: 'bilder', content: { type: 'gemalt' as const, picture: 'pic-abcdef12' }, created: 'x' };
    const withPainting = { ...mia, files: [...mia.files, painting], settings: { ...mia.settings, wallpaperFile: 'f-bild' } };
    const data: SaveData = { ...emptySave(), profiles: [withPainting] };
    const png = 'data:image/png;base64,iVBORw0KGgo=';
    const file = exportSave(data, new Date('2026-10-24T10:00:00Z'), { 'pic-abcdef12': png });
    const parsed = parseSaveFile(file.text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.pictures).toEqual({ 'pic-abcdef12': png });
    const p = parsed.data.profiles[0];
    expect(p.files.find((n) => n.id === 'f-bild')?.content).toEqual({ type: 'gemalt', picture: 'pic-abcdef12' });
    expect(p.settings.wallpaperFile).toBe('f-bild');
    // Falsche Bilddaten und Bilder, auf die keine Datei zeigt, bleiben draußen.
    const evil = JSON.parse(file.text);
    evil.pictures = { 'pic-abcdef12': 'data:text/html;base64,PGI+', 'pic-unbenutzt1': png };
    const parsed2 = parseSaveFile(JSON.stringify(evil));
    expect(parsed2.ok && parsed2.pictures).toEqual({});
    // Ohne Bilder sieht die Datei aus wie bisher.
    expect(JSON.parse(exportSave(save, new Date()).text).pictures).toBeUndefined();
    // Ein kaputter Verweis fliegt raus.
    const broken = { ...painting, content: { type: 'gemalt', picture: '../etwas' } };
    expect(sanitizeProfile({ ...withPainting, files: [broken] })?.files).toEqual([]);
  });

  it('verwirft doppelte Profile und begrenzt die Anzahl', () => {
    const many = Array.from({ length: MAX_PROFILES + 5 }, (_, i) => ({ ...mia, id: `p${i}` }));
    const data = sanitizeSave({ format: 'computerfuchs', version: 1, profiles: [mia, mia, ...many] });
    expect(data?.profiles).toHaveLength(MAX_PROFILES);
    expect(new Set(data?.profiles.map((p) => p.id)).size).toBe(MAX_PROFILES);
  });

  it('übernimmt geladene Profile: gleiche ID ersetzt, neue kommen dazu', () => {
    const newer = { ...mia, bytes: 500, bytesEarned: 500 };
    const ben = createProfile({ name: 'Ben', avatar: 'dog', age: 9 }, 'ben', 'now');
    const merged = mergeSaves(save, { ...emptySave(), profiles: [newer, ben] });
    expect(merged.added).toBe(1);
    expect(merged.replaced).toBe(1);
    expect(merged.data.profiles.map((p) => p.id)).toEqual(['mia', 'ben']);
    expect(merged.data.profiles[0].bytes).toBe(500);
  });
});
