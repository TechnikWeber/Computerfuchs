/*
 * Die Logik hinter „Was ist das Internet?“ – ohne Oberfläche, damit sie sich
 * testen lässt: Netze aus Knoten und Kabeln, Wege und Brücken, Pakete auf
 * ihrem Weg, Geheimschrift, Adressen lesen und wie schnell Licht ist.
 */

export interface Pt {
  x: number;
  y: number;
}

export interface Link {
  a: string;
  b: string;
}

/** Kabel haben keine Richtung: a|b und b|a sind dasselbe. */
export function linkId(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function hasLink(links: readonly Link[], a: string, b: string): boolean {
  const id = linkId(a, b);
  return links.some((l) => linkId(l.a, l.b) === id);
}

function adjacency(links: readonly Link[], broken: ReadonlySet<string> = new Set()): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const l of links) {
    if (broken.has(linkId(l.a, l.b))) continue;
    adj.set(l.a, [...(adj.get(l.a) ?? []), l.b]);
    adj.set(l.b, [...(adj.get(l.b) ?? []), l.a]);
  }
  return adj;
}

/** Alles, was von `from` aus erreichbar ist (gerissene Kabel zählen nicht). */
export function reachable(links: readonly Link[], from: string, broken?: ReadonlySet<string>): Set<string> {
  const adj = adjacency(links, broken);
  const seen = new Set([from]);
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    for (const next of adj.get(queue[i]) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}

/** Sind alle diese Knoten miteinander verbunden? */
export function allConnected(links: readonly Link[], ids: readonly string[], broken?: ReadonlySet<string>): boolean {
  if (ids.length === 0) return true;
  const seen = reachable(links, ids[0], broken);
  return ids.every((id) => seen.has(id));
}

/**
 * Brücken: Kabel, ohne die das Netz zerfällt. Ein Netz ohne Brücken hält,
 * wenn irgendein einzelnes Kabel reißt – so ist das Internet gebaut.
 */
export function bridges(links: readonly Link[]): string[] {
  const adj = adjacency(links);
  const order = new Map<string, number>();
  const low = new Map<string, number>();
  const out: string[] = [];
  let counter = 0;
  const visit = (node: string, parentLink: string | null) => {
    order.set(node, counter);
    low.set(node, counter);
    counter++;
    for (const next of adj.get(node) ?? []) {
      const id = linkId(node, next);
      if (id === parentLink) continue;
      if (!order.has(next)) {
        visit(next, id);
        low.set(node, Math.min(low.get(node)!, low.get(next)!));
        if (low.get(next)! > order.get(node)!) out.push(id);
      } else {
        low.set(node, Math.min(low.get(node)!, order.get(next)!));
      }
    }
  };
  for (const node of adj.keys()) if (!order.has(node)) visit(node, null);
  return out.sort();
}

export function distance(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Kürzester Weg (nach Länge der Kabel), oder null, wenn keiner da ist. */
export function shortestPath(
  points: Readonly<Record<string, Pt>>,
  links: readonly Link[],
  from: string,
  to: string,
  broken?: ReadonlySet<string>,
): string[] | null {
  const adj = adjacency(links, broken);
  const dist = new Map<string, number>([[from, 0]]);
  const prev = new Map<string, string>();
  const open = new Set([from]);
  while (open.size > 0) {
    let cur = '';
    let best = Infinity;
    for (const id of open) {
      const d = dist.get(id) ?? Infinity;
      if (d < best) {
        best = d;
        cur = id;
      }
    }
    open.delete(cur);
    if (cur === to) break;
    for (const next of adj.get(cur) ?? []) {
      const d = best + distance(points[cur], points[next]);
      if (d < (dist.get(next) ?? Infinity)) {
        dist.set(next, d);
        prev.set(next, cur);
        open.add(next);
      }
    }
  }
  if (!dist.has(to)) return null;
  const path = [to];
  while (path[0] !== from) path.unshift(prev.get(path[0])!);
  return path;
}

/** Wohin schickt ein Router ein Paket für `to`? Der nächste Schritt auf dem kürzesten Weg. */
export function nextHop(points: Readonly<Record<string, Pt>>, links: readonly Link[], at: string, to: string): string | null {
  const path = shortestPath(points, links, at, to);
  return path && path.length > 1 ? path[1] : null;
}

export function polylineLength(pts: readonly Pt[]): number {
  let sum = 0;
  for (let i = 1; i < pts.length; i++) sum += distance(pts[i - 1], pts[i]);
  return sum;
}

/** Punkt auf einem Linienzug, t von 0 (Anfang) bis 1 (Ende). */
export function pointAt(pts: readonly Pt[], t: number): Pt {
  if (pts.length === 0) return { x: 0, y: 0 };
  if (pts.length === 1 || t <= 0) return pts[0];
  if (t >= 1) return pts[pts.length - 1];
  let left = polylineLength(pts) * t;
  for (let i = 1; i < pts.length; i++) {
    const seg = distance(pts[i - 1], pts[i]);
    if (left <= seg) {
      const f = seg === 0 ? 0 : left / seg;
      return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f };
    }
    left -= seg;
  }
  return pts[pts.length - 1];
}

/** Der Anfang eines Linienzugs bis t (0…1) – etwa bis dahin, wo ein Kabel reißt. */
export function slicePolyline(pts: readonly Pt[], t: number): Pt[] {
  if (pts.length < 2 || t >= 1) return [...pts];
  if (t <= 0) return [pts[0]];
  let left = polylineLength(pts) * t;
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const seg = distance(pts[i - 1], pts[i]);
    if (left <= seg) {
      out.push(pointAt([pts[i - 1], pts[i]], seg === 0 ? 0 : left / seg));
      return out;
    }
    out.push(pts[i]);
    left -= seg;
  }
  return out;
}

/** Glatte Kurve durch alle Punkte (Catmull-Rom), als feiner Linienzug. */
export function smooth(pts: readonly Pt[], steps = 8): Pt[] {
  if (pts.length < 3) return [...pts];
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

// ---------------------------------------------------------------------------
// Landkarten
// ---------------------------------------------------------------------------

/** Erdkugel auf ein Rechteck (Länge −180…180 → 0…w, Breite 90…−90 → 0…h). */
export function project(lon: number, lat: number, w: number, h: number): Pt {
  return { x: ((lon + 180) / 360) * w, y: ((90 - lat) / 180) * h };
}

/** Entfernung auf der Erde in Kilometern (Großkreis). */
export function earthKm(a: { lon: number; lat: number }, b: { lon: number; lat: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(s));
}

// ---------------------------------------------------------------------------
// Tempo
// ---------------------------------------------------------------------------

/** Licht im Glasfaserkabel: etwa 200.000 km pro Sekunde. */
export const FIBER_KM_PER_S = 200_000;
/** Funk und Licht im Weltall: etwa 300.000 km pro Sekunde. */
export const VACUUM_KM_PER_S = 300_000;

/** Wie lange ein Paket mindestens unterwegs ist, in Millisekunden. */
export function travelMs(km: number, kmPerSecond = FIBER_KM_PER_S): number {
  return (km / kmPerSecond) * 1000;
}

/** Ein Ping geht hin und zurück. */
export function pingMs(km: number, kmPerSecond = FIBER_KM_PER_S): number {
  return 2 * travelMs(km, kmPerSecond);
}

// ---------------------------------------------------------------------------
// Geheimschrift
// ---------------------------------------------------------------------------

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Caesar-Verschiebung: jeder Buchstabe rückt `shift` Stellen weiter. Anderes bleibt, wie es ist. */
export function caesar(text: string, shift: number): string {
  return [...text.toUpperCase()]
    .map((ch) => {
      const i = ABC.indexOf(ch);
      return i < 0 ? ch : ABC[(((i + shift) % 26) + 26) % 26];
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Adressen lesen
// ---------------------------------------------------------------------------

/** Der Rechnername einer Adresse: ohne https://, ohne Pfad, ohne Port. */
export function hostOf(url: string): string {
  const noScheme = url.replace(/^[a-z]+:\/\//i, '');
  return noScheme.split(/[/?#]/)[0].split('@').pop()!.split(':')[0].toLowerCase();
}

/**
 * Wem die Adresse gehört: die letzten beiden Teile vor dem ersten „/“
 * (bei Endungen wie .co.uk die letzten drei). Alles davor kann sich jeder
 * Seitenbesitzer selbst ausdenken – genau damit tricksen Fallen.
 */
export function ownerOf(url: string): string {
  const parts = hostOf(url).split('.').filter(Boolean);
  const twoPart = new Set(['co.uk', 'org.uk', 'com.au', 'co.at', 'or.at', 'co.jp']);
  const tail2 = parts.slice(-2).join('.');
  if (parts.length >= 3 && twoPart.has(tail2)) return parts.slice(-3).join('.');
  return tail2;
}

export function isHttps(url: string): boolean {
  return /^https:\/\//i.test(url);
}
