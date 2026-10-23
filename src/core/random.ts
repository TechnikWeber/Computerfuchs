/** Zufallsquelle: liefert Zahlen in [0, 1). Für Tests lässt sie sich festlegen. */
export type Rng = () => number;

export const defaultRng: Rng = Math.random;

/** Kleiner, schneller Generator mit Startwert – für reproduzierbare Tests und Bilder. */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ganze Zahl zwischen min und max, beide eingeschlossen. */
export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick<T>(rng: Rng, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)];
}

export function shuffle<T>(rng: Rng, list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** n verschiedene Elemente; bei zu kurzer Liste entsprechend weniger. */
export function sample<T>(rng: Rng, list: readonly T[], n: number): T[] {
  return shuffle(rng, list).slice(0, Math.max(0, n));
}
