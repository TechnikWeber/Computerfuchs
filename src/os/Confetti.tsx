import type { CSSProperties } from 'react';
import type { ConfettiBit } from './confettiBits';

/** Konfetti von oben. Der Desktop blendet es nach ein paar Sekunden wieder aus. */
export function Confetti({ bits }: { bits: ConfettiBit[] }) {
  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              left: `${b.left}%`,
              width: b.w,
              height: b.round ? b.w : b.w * 0.45,
              borderRadius: b.round ? '50%' : 2,
              background: b.color,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.dur}s`,
              '--dx': b.dx,
              '--rot': b.rot,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
