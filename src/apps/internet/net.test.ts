import { describe, expect, it } from 'vitest';
import {
  allConnected, bridges, caesar, earthKm, hasLink, hostOf, isHttps, linkId, nextHop, ownerOf, pingMs, pointAt,
  polylineLength, reachable, shortestPath, slicePolyline, smooth, travelMs, type Link,
} from './net';
import { CIPHER_ROUNDS, LOGIN_ROUNDS, OWNER_ROUNDS, SITES } from './content';

const L = (pairs: string): Link[] => pairs.split(' ').map((p) => ({ a: p[0], b: p[1] }));

describe('Netze', () => {
  it('kennt Kabel in beide Richtungen', () => {
    expect(linkId('b', 'a')).toBe(linkId('a', 'b'));
    expect(hasLink(L('ab bc'), 'c', 'b')).toBe(true);
    expect(hasLink(L('ab bc'), 'a', 'c')).toBe(false);
  });

  it('findet, wer erreichbar ist – auch wenn ein Kabel reißt', () => {
    const links = L('ab bc cd');
    expect([...reachable(links, 'a')].sort()).toEqual(['a', 'b', 'c', 'd']);
    expect([...reachable(links, 'a', new Set([linkId('b', 'c')]))].sort()).toEqual(['a', 'b']);
    expect(allConnected(links, ['a', 'd'])).toBe(true);
    expect(allConnected(links, ['a', 'd'], new Set([linkId('c', 'd')]))).toBe(false);
  });

  it('erkennt Brücken: ein Ring hält, ein Stern nicht', () => {
    expect(bridges(L('ab bc cd da'))).toEqual([]);
    expect(bridges(L('ab ac ad'))).toEqual(['a|b', 'a|c', 'a|d']);
    // Zwei Ringe mit einem Kabel dazwischen: nur das Verbindungskabel ist eine Brücke.
    expect(bridges(L('ab bc ca cd de ef fd'))).toEqual(['c|d']);
  });

  it('sucht den kürzesten Weg und den nächsten Schritt', () => {
    const pts = { a: { x: 0, y: 0 }, b: { x: 10, y: 0 }, c: { x: 20, y: 0 }, d: { x: 10, y: 50 } };
    const links = L('ab bc ad dc');
    expect(shortestPath(pts, links, 'a', 'c')).toEqual(['a', 'b', 'c']);
    expect(shortestPath(pts, links, 'a', 'c', new Set([linkId('a', 'b')]))).toEqual(['a', 'd', 'c']);
    expect(shortestPath(pts, L('ab'), 'a', 'c')).toBeNull();
    expect(nextHop(pts, links, 'a', 'c')).toBe('b');
    expect(nextHop(pts, links, 'c', 'c')).toBeNull();
  });

  it('bewegt Pakete gleichmäßig entlang eines Weges', () => {
    const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }];
    expect(polylineLength(pts)).toBe(20);
    expect(pointAt(pts, 0)).toEqual({ x: 0, y: 0 });
    expect(pointAt(pts, 0.25)).toEqual({ x: 5, y: 0 });
    expect(pointAt(pts, 0.75)).toEqual({ x: 10, y: 5 });
    expect(pointAt(pts, 1)).toEqual({ x: 10, y: 10 });
  });

  it('schneidet einen Weg ab und glättet Kurven', () => {
    const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }];
    expect(slicePolyline(pts, 0.75)).toEqual([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }]);
    expect(slicePolyline(pts, 1)).toEqual(pts);
    const curve = smooth(pts, 4);
    expect(curve[0]).toEqual(pts[0]);
    expect(curve[curve.length - 1]).toEqual(pts[2]);
    expect(curve).toHaveLength(9);
  });
});

describe('Tempo', () => {
  it('rechnet mit Licht im Glasfaserkabel', () => {
    expect(travelMs(200_000)).toBe(1000);
    expect(pingMs(6400)).toBe(64);
    // Zum Mond geht es per Funk: 2 × 384.400 km bei Lichtgeschwindigkeit
    expect(Math.round(pingMs(384_400, 300_000))).toBe(2563);
  });

  it('misst Entfernungen auf der Erde', () => {
    const berlin = { lon: 13.4, lat: 52.52 };
    const newYork = { lon: -74.0, lat: 40.71 };
    expect(Math.round(earthKm(berlin, newYork) / 100) * 100).toBe(6400);
  });
});

describe('Geheimschrift', () => {
  it('verschiebt Buchstaben und lässt den Rest', () => {
    expect(caesar('HALLO', 3)).toBe('KDOOR');
    expect(caesar('xyz', 3)).toBe('ABC');
    expect(caesar('KDOOR', -3)).toBe('HALLO');
    expect(caesar('OMA!', 3)).toBe('RPD!');
    expect(caesar(caesar('Fuchs', 7), -7)).toBe('FUCHS');
  });
});

describe('Adressen lesen', () => {
  it('findet den Rechnernamen', () => {
    expect(hostOf('https://www.fuchsbank.de/login?x=1')).toBe('www.fuchsbank.de');
    expect(hostOf('http://user@seite.de:8080/a')).toBe('seite.de');
    expect(hostOf('kino.de')).toBe('kino.de');
  });

  it('weiß, wem eine Adresse wirklich gehört', () => {
    expect(ownerOf('https://www.fuchsbank.de/login')).toBe('fuchsbank.de');
    expect(ownerOf('https://fuchsbank.de-konto-sicher.info/login')).toBe('de-konto-sicher.info');
    expect(ownerOf('https://de.wikipedia.org/wiki/Fuchs')).toBe('wikipedia.org');
    expect(ownerOf('https://www.bbc.co.uk')).toBe('bbc.co.uk');
  });

  it('erkennt https', () => {
    expect(isHttps('https://kika.de')).toBe(true);
    expect(isHttps('http://kika.de')).toBe(false);
  });
});

describe('Inhalte', () => {
  it('hat bei jeder Adresse genau eine richtige Antwort', () => {
    for (const r of OWNER_ROUNDS) expect(r.options.filter((o) => o === ownerOf(r.url))).toHaveLength(1);
  });

  it('nutzt nur Adressen aus den Beispiel-Bereichen', () => {
    for (const s of SITES) expect(s.ip).toMatch(/^(192\.0\.2|198\.51\.100|203\.0\.113)\.\d{1,3}$/);
    expect(new Set(SITES.map((s) => s.ip)).size).toBe(SITES.length);
  });

  it('sagt bei Anmeldeseiten ehrlich, was sicher ist', () => {
    for (const r of LOGIN_ROUNDS) if (!isHttps(r.url)) expect(r.safe).toBe(false);
  });

  it('kann jedes Geheimwort ver- und entschlüsseln', () => {
    for (const r of CIPHER_ROUNDS) expect(caesar(caesar(r.word, 3), -3)).toBe(r.word);
  });
});
