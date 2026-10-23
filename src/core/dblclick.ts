export interface Press {
  x: number;
  y: number;
  /** Zeit in Millisekunden */
  t: number;
  /** Worauf geklickt wurde – zwei Klicks auf verschiedene Dinge zählen nicht. */
  target: string;
}

/**
 * Eigene Doppelklick-Erkennung statt des Browser-Ereignisses: Das nimmt die
 * Geschwindigkeit des Betriebssystems, und die ist für Fünfjährige zu streng.
 * Liefert true, wenn dieser Klick einen Doppelklick vollendet.
 */
export function createDoubleClick(maxMs: number, maxDist = 16): (press: Press) => boolean {
  let last: Press | null = null;
  return (press) => {
    const isDouble =
      last !== null &&
      last.target === press.target &&
      press.t - last.t <= maxMs &&
      Math.hypot(press.x - last.x, press.y - last.y) <= maxDist;
    last = isDouble ? null : press;
    return isDouble;
  };
}
