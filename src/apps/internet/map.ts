import { useCallback, useRef, useState } from 'react';
import type { EmojiName } from '../../core/emoji';
import { useFrame, useLatest } from '../../core/hooks';
import { pointAt, type Pt } from './net';

/*
 * Was auf einer Netzkarte zu sehen ist – und Pakete, die sich darauf bewegen.
 * Gezeichnet wird das in NetMap (ui.tsx).
 */

export type NodeIcon = EmojiName | 'router' | 'server';

export interface MapNode {
  id: string;
  x: number;
  y: number;
  icon: NodeIcon;
  label?: string;
  /** Beschriftung über statt unter dem Kreis, wenn darunter kein Platz ist. */
  labelAbove?: boolean;
  /** Durchmesser */
  size?: number;
  tone?: 'plain' | 'on' | 'pick' | 'warn' | 'goal';
  badge?: EmojiName;
}

export interface MapEdge {
  id: string;
  points: Pt[];
  kind?: 'kabel' | 'meer' | 'funk';
  tone?: 'plain' | 'active' | 'broken' | 'pick' | 'faint' | 'new' | 'route-a' | 'route-b';
  label?: string;
  /** Beschriftung unter statt über dem Kabel, wenn darüber ein anderes verläuft. */
  labelBelow?: boolean;
}

export interface MapPacket {
  id: string;
  at: Pt;
  icon?: EmojiName;
  label?: string;
  size?: number;
}

/** Ein Kabel zwischen zwei Knoten. */
export function cable(nodes: MapNode[], a: string, b: string, extra: Partial<MapEdge> = {}): MapEdge {
  const na = nodes.find((n) => n.id === a);
  const nb = nodes.find((n) => n.id === b);
  return { id: a < b ? `${a}|${b}` : `${b}|${a}`, points: na && nb ? [na, nb] : [], ...extra };
}

export interface Trip {
  id: string;
  points: Pt[];
  ms: number;
  icon?: EmojiName;
  label?: string;
  size?: number;
  /** Am Ziel liegen bleiben statt zu verschwinden */
  stay?: boolean;
  onArrive?: () => void;
}

const clock = () => performance.now();

/** Bewegt Pakete gleichmäßig an ihren Wegen entlang und meldet, wenn eins ankommt. */
export function useTravel() {
  const [trips, setTrips] = useState<(Trip & { start: number; done: boolean })[]>([]);
  const [now, setNow] = useState(0);
  const latest = useLatest(trips);
  const fired = useRef(new Set<string>());

  useFrame(() => {
    const t = clock();
    setNow(t);
    const finished = latest.current.filter((tr) => !tr.done && !fired.current.has(tr.id) && t - tr.start >= tr.ms);
    if (finished.length === 0) return;
    for (const f of finished) fired.current.add(f.id);
    setTrips((all) =>
      all.flatMap((tr) => (finished.some((f) => f.id === tr.id) ? (tr.stay ? [{ ...tr, done: true }] : []) : [tr])),
    );
    for (const f of finished) f.onArrive?.();
  }, trips.some((t) => !t.done));

  const send = useCallback((trip: Trip) => {
    const start = clock();
    fired.current.delete(trip.id);
    setNow(start);
    setTrips((all) => [...all.filter((x) => x.id !== trip.id), { ...trip, start, done: false }]);
  }, []);

  const remove = useCallback((id: string) => setTrips((all) => all.filter((t) => t.id !== id)), []);
  const clear = useCallback(() => setTrips([]), []);

  const packets: MapPacket[] = trips.map((tr) => ({
    id: tr.id,
    at: pointAt(tr.points, tr.done ? 1 : Math.min(1, Math.max(0, (now - tr.start) / tr.ms))),
    icon: tr.icon,
    label: tr.label,
    size: tr.size,
  }));
  return { packets, send, remove, clear, moving: trips.some((t) => !t.done) };
}
