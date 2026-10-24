import { describe, expect, it } from 'vitest';
import { formatBytes, formatBytesShort } from './bytes';
import { createDoubleClick } from './dblclick';
import { catmullRom, dist, nearestIndex, polylineLength, resample } from './geometry';
import { scatter } from './layout';
import {
  MAX_BYTES, RANKS, REPLAY_REWARD, STAR_REWARD, ageGroup, applyLevelResult, createProfile, defaultFeatures, nextRank,
  rankFor, rewardFor, wallpaperPicture, withAge, withAllOpen, withBytes,
} from './profile';
import { seeded, shuffle } from './random';

describe('Bytes', () => {
  it('zeigt Bytes, Kilobyte und Megabyte', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1)).toBe('1 Byte');
    expect(formatBytes(999)).toBe('999 Bytes');
    expect(formatBytes(1000)).toBe('1 KB');
    expect(formatBytes(1580)).toBe('1,5 KB');
    expect(formatBytes(1_234_567)).toBe('1,2 MB');
    expect(formatBytesShort(48)).toBe('48 B');
    expect(formatBytesShort(2048)).toBe('2 KB');
  });

  it('rundet nie auf', () => {
    expect(formatBytes(1999)).toBe('1,9 KB');
  });
});

describe('Profil', () => {
  it('teilt Altersgruppen ein', () => {
    expect(ageGroup(4)).toBe('klein');
    expect(ageGroup(6)).toBe('klein');
    expect(ageGroup(7)).toBe('mittel');
    expect(ageGroup(10)).toBe('gross');
  });

  it('startet für Kleine mit einem einfachen Desktop', () => {
    expect(defaultFeatures(5)).toEqual([]);
    expect(defaultFeatures(8)).toContain('doubleClick');
    expect(defaultFeatures(12)).toContain('windowControls');
  });

  it('nimmt den Tiernamen, wenn kein Name eingegeben wurde', () => {
    const p = createProfile({ name: '   ', avatar: 'owl', age: 5 }, 'x', '2026-10-23');
    expect(p.name).toBe('Eule');
    expect(p.settings.cursor).toBe('gross');
    expect(p.settings.voice).toBe(true);
  });

  it('belohnt jeden neuen Stern einmal', () => {
    expect(rewardFor(0, 1)).toBe(STAR_REWARD[1]);
    expect(rewardFor(0, 3)).toBe(STAR_REWARD[1] + STAR_REWARD[2] + STAR_REWARD[3]);
    expect(rewardFor(2, 3)).toBe(STAR_REWARD[3]);
    expect(rewardFor(3, 3)).toBe(REPLAY_REWARD);
    expect(rewardFor(3, 1)).toBe(REPLAY_REWARD);
  });

  it('speichert den besten Stern und zählt Bytes', () => {
    const p0 = createProfile({ name: 'Mia', avatar: 'fox', age: 6 }, 'id', '2026-10-23');
    const r1 = applyLevelResult(p0, 'maus', 'ballons', 2, 'now');
    expect(r1.outcome.bytes).toBe(48);
    expect(r1.profile.bytes).toBe(48);
    const r2 = applyLevelResult(r1.profile, 'maus', 'ballons', 1, 'now');
    expect(r2.profile.progress.maus.ballons).toEqual({ stars: 2, plays: 2, last: 'now' });
    expect(r2.outcome.improved).toBe(false);
    expect(r2.profile.bytesEarned).toBe(48 + REPLAY_REWARD);
  });

  it('meldet einen Aufstieg im Rang', () => {
    const p0 = { ...createProfile({ name: 'A', avatar: 'fox', age: 8 }, 'id', 'now'), bytesEarned: 140 };
    const r = applyLevelResult(p0, 'maus', 'weg', 1, 'now');
    expect(r.outcome.rankUp).toBe(true);
    expect(r.outcome.rankAfter.name).toBe('Jungfuchs');
  });

  it('ergänzt beim Ändern des Alters passende Funktionen, nimmt aber keine weg', () => {
    const p = createProfile({ name: 'A', avatar: 'fox', age: 5 }, 'id', 'now');
    const older = withAge(p, 12);
    expect(older.age).toBe(12);
    expect([...older.features].sort()).toEqual(['doubleClick', 'moveWindows', 'rightClick', 'windowControls']);
    const younger = withAge(older, 4);
    expect(younger.age).toBe(4);
    expect(younger.features).toHaveLength(4);
    expect(withAge(p, 99).age).toBe(18);
  });

  it('schaltet alles frei, ohne Sterne zu verschenken – und wieder zurück', () => {
    const p = createProfile({ name: 'A', avatar: 'fox', age: 5 }, 'id', 'now');
    const open = withAllOpen(p, true);
    expect(open.allOpen).toBe(true);
    expect([...open.features].sort()).toEqual(['doubleClick', 'moveWindows', 'rightClick', 'windowControls']);
    expect(open.progress).toEqual({});
    expect(open.bytes).toBe(0);
    const closed = withAllOpen(open, false);
    expect('allOpen' in closed).toBe(false);
    expect(closed.features).toHaveLength(4);
  });

  it('lässt Erwachsene Kontostand und Rang einstellen', () => {
    const p = { ...createProfile({ name: 'A', avatar: 'fox', age: 8 }, 'id', 'now'), bytes: 120, bytesEarned: 600 };
    // Geschenkt: mehr auf dem Konto, der Rang bleibt.
    const gift = withBytes(p, 220, p.bytesEarned);
    expect(gift.bytes).toBe(220);
    expect(rankFor(gift.bytesEarned).name).toBe('Schlaufuchs');
    const odd = withBytes(p, -40, 12.6);
    expect(odd.bytes).toBe(0);
    expect(odd.bytesEarned).toBe(13);
    expect(withBytes(p, Number.NaN, 5 * MAX_BYTES).bytesEarned).toBe(MAX_BYTES);
  });

  it('findet das gemalte Hintergrundbild – solange es die Datei gibt', () => {
    const p = createProfile({ name: 'A', avatar: 'fox', age: 8 }, 'id', 'now');
    const file = { id: 'f-bild', name: 'Bild', parent: 'bilder', content: { type: 'gemalt' as const, picture: 'pic-abcdef12' }, created: 'now' };
    const painted = { ...p, files: [...p.files, file], settings: { ...p.settings, wallpaperFile: 'f-bild' } };
    expect(wallpaperPicture(painted)).toBe('pic-abcdef12');
    expect(wallpaperPicture({ ...painted, files: p.files })).toBeNull();
    expect(wallpaperPicture(p)).toBeNull();
  });

  it('kennt Ränge und den nächsten Rang', () => {
    expect(rankFor(0).name).toBe(RANKS[0].name);
    expect(rankFor(1000).name).toBe('Computerfuchs');
    expect(nextRank(999)?.name).toBe('Computerfuchs');
    expect(nextRank(1_000_000)).toBeNull();
  });
});

describe('Doppelklick', () => {
  it('erkennt zwei schnelle Klicks auf dasselbe Ziel', () => {
    const dbl = createDoubleClick(500);
    expect(dbl({ x: 10, y: 10, t: 0, target: 'a' })).toBe(false);
    expect(dbl({ x: 12, y: 11, t: 300, target: 'a' })).toBe(true);
    // Der dritte Klick beginnt von vorn.
    expect(dbl({ x: 12, y: 11, t: 400, target: 'a' })).toBe(false);
  });

  it('lehnt zu langsame, verschobene oder andere Ziele ab', () => {
    const dbl = createDoubleClick(500);
    dbl({ x: 0, y: 0, t: 0, target: 'a' });
    expect(dbl({ x: 0, y: 0, t: 800, target: 'a' })).toBe(false);
    expect(dbl({ x: 40, y: 0, t: 900, target: 'a' })).toBe(false);
    expect(dbl({ x: 40, y: 0, t: 1000, target: 'b' })).toBe(false);
  });
});

describe('Geometrie', () => {
  it('verteilt Punkte gleichmäßig auf einer Linie', () => {
    const pts = resample([{ x: 0, y: 0 }, { x: 100, y: 0 }], 10);
    expect(pts).toHaveLength(11);
    expect(pts[5]).toEqual({ x: 50, y: 0 });
  });

  it('läuft gleichmäßig um Ecken', () => {
    const pts = resample([{ x: 0, y: 0 }, { x: 15, y: 0 }, { x: 15, y: 15 }], 10);
    for (let i = 1; i < pts.length - 1; i++) expect(dist(pts[i - 1], pts[i])).toBeLessThanOrEqual(10.0001);
    expect(pts[pts.length - 1]).toEqual({ x: 15, y: 15 });
  });

  it('geht durch alle Stützpunkte', () => {
    const ctrl = [{ x: 0, y: 0 }, { x: 50, y: 40 }, { x: 100, y: 0 }];
    const curve = catmullRom(ctrl, 10);
    expect(curve[0]).toEqual(ctrl[0]);
    expect(curve[10]).toEqual(ctrl[1]);
    expect(curve[curve.length - 1]).toEqual(ctrl[2]);
    expect(polylineLength(curve)).toBeGreaterThan(polylineLength(ctrl) - 1);
  });

  it('sucht den nächsten Punkt nur im erlaubten Bereich', () => {
    const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }, { x: 30, y: 0 }];
    expect(nearestIndex(pts, { x: 29, y: 1 }).index).toBe(3);
    expect(nearestIndex(pts, { x: 29, y: 1 }, 0, 1).index).toBe(1);
  });
});

describe('Verteilen', () => {
  it('hält Abstand und bleibt in der Fläche', () => {
    const pts = scatter(seeded(7), 6, { width: 800, height: 500, minDist: 120, margin: 60 });
    expect(pts).toHaveLength(6);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(60 / 800);
      expect(p.x).toBeLessThanOrEqual(1 - 60 / 800);
      expect(p.y).toBeGreaterThanOrEqual(60 / 500);
    }
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot((pts[i].x - pts[j].x) * 800, (pts[i].y - pts[j].y) * 500);
        expect(d).toBeGreaterThanOrEqual(120);
      }
    }
  });

  it('meidet gesperrte Bereiche', () => {
    const pts = scatter(seeded(3), 20, { width: 400, height: 400, minDist: 10, margin: 0, avoid: [{ x: 0, y: 0, w: 400, h: 200 }] });
    for (const p of pts) expect(p.y * 400).toBeGreaterThanOrEqual(200);
  });
});

describe('Zufall', () => {
  it('ist mit Startwert reproduzierbar und mischt vollständig', () => {
    expect(shuffle(seeded(1), [1, 2, 3, 4, 5])).toEqual(shuffle(seeded(1), [1, 2, 3, 4, 5]));
    expect([...shuffle(seeded(2), [1, 2, 3, 4, 5])].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
