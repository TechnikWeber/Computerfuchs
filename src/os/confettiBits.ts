const COLORS = ['#ff7a2f', '#2f9bff', '#2fbf62', '#ffc533', '#ff4f87', '#8a6bff', '#22c7ad'];

export interface ConfettiBit {
  left: number;
  delay: number;
  dur: number;
  dx: string;
  rot: string;
  color: string;
  w: number;
  round: boolean;
}

/** Zufällige Schnipsel – einmal beim Feiern erzeugt, nicht bei jedem Zeichnen. */
export function makeConfetti(pieces = 90): ConfettiBit[] {
  return Array.from({ length: pieces }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    dur: 1.8 + Math.random() * 1.4,
    dx: `${(Math.random() - 0.5) * 30}vw`,
    rot: `${(Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720)}deg`,
    color: COLORS[i % COLORS.length],
    w: 8 + Math.random() * 8,
    round: Math.random() > 0.6,
  }));
}
