import type { CSSProperties } from 'react';
import { capLabel, keyByCode, ROWS, type Finger, type KeyDef } from './layout';

export interface Flash {
  code: string;
  ok: boolean;
  /** Zähler, damit dieselbe Taste zweimal hintereinander wieder aufblinkt */
  n: number;
}

interface Props {
  /** Leuchtende Tasten (e.code) */
  highlight?: string[];
  /** Zuletzt gedrückte Taste – kurz grün (richtig) oder rot (falsch) */
  flash?: Flash | null;
  /** Jede Taste in der Farbe ihres Fingers */
  fingers?: boolean;
  /** Ohne Zahlenreihe – für kleine Fenster */
  compact?: boolean;
  /** Pfeiltasten rechts daneben */
  arrows?: boolean;
  className?: string;
}

const ARROWS: { code: string; label: string }[] = [
  { code: 'ArrowUp', label: '↑' },
  { code: 'ArrowLeft', label: '←' },
  { code: 'ArrowDown', label: '↓' },
  { code: 'ArrowRight', label: '→' },
];

const same = (a: string, b: string) => a === b || (a === 'Enter2' && b === 'Enter') || (a === 'Enter' && b === 'Enter2');

/** Bildschirmtastatur im deutschen Layout. */
export function Keyboard({ highlight = [], flash, fingers, compact, arrows, className }: Props) {
  const rows = compact ? ROWS.slice(1) : ROWS;
  const lit = (code: string) => highlight.some((h) => same(code, h));
  const flashOf = (code: string) => (flash && same(code, flash.code) ? flash : null);

  const cap = (key: KeyDef) => {
    const f = flashOf(key.code);
    const cls = [
      'kb-key',
      fingers ? `f-${key.finger}` : '',
      lit(key.code) ? 'is-lit' : '',
      f ? (f.ok ? 'is-ok' : 'is-wrong') : '',
      key.bump ? 'has-bump' : '',
      key.code === 'Enter' ? 'is-enter-top' : '',
      key.code === 'Enter2' ? 'is-enter-bottom' : '',
      key.label.length > 1 ? 'is-word' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return (
      <span
        key={f ? `${key.code}-${f.n}` : key.code}
        className={cls}
        style={{ '--w': key.w ?? 1 } as CSSProperties}
        data-code={key.code}
      >
        {key.shift && <span className="kb-shift">{key.shift}</span>}
        <span className="kb-main">{key.code === 'Space' ? '' : capLabel(key)}</span>
        {key.alt && <span className="kb-alt">{key.alt}</span>}
      </span>
    );
  };

  return (
    <div className={['keyboard', compact ? 'is-compact' : '', className ?? ''].filter(Boolean).join(' ')} aria-hidden="true">
      <div className="kb-main-block">
        {rows.map((row, i) => (
          <div className="kb-row" key={i}>
            {row.map(cap)}
          </div>
        ))}
      </div>
      {arrows && (
        <div className="kb-arrows">
          {ARROWS.map((a) => {
            const f = flashOf(a.code);
            return (
              <span
                key={f ? `${a.code}-${f.n}` : a.code}
                className={['kb-key', `kb-${a.code}`, lit(a.code) ? 'is-lit' : '', f ? (f.ok ? 'is-ok' : 'is-wrong') : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="kb-main">{a.label}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Ein paar große Tasten – fürs Bild in der Einleitung und als Pfeil-Kreuz im Hamsterweg. */
export function KeyCaps({ codes, flash }: { codes: string[]; flash?: Flash | null }) {
  const isArrows = codes.every((c) => c.startsWith('Arrow'));
  if (isArrows) {
    return (
      <div className="keycaps is-arrows" aria-hidden="true">
        {ARROWS.map((a) => {
          const f = flash?.code === a.code ? flash : null;
          return (
            <span
              key={f ? `${a.code}-${f.n}` : a.code}
              className={['keycap', `kb-${a.code}`, f ? (f.ok ? 'is-ok' : 'is-wrong') : ''].filter(Boolean).join(' ')}
            >
              {a.label}
            </span>
          );
        })}
      </div>
    );
  }
  return (
    <div className="keycaps" aria-hidden="true">
      {codes.map((code) => {
        const key = keyByCode(code);
        if (!key) return null;
        const label = code === 'Space' ? 'Leertaste' : code.startsWith('Shift') ? '⇧ Umschalt' : capLabel(key);
        return (
          <span key={code} className={['keycap', key.bump ? 'has-bump' : '', label.length > 2 ? 'is-wide' : ''].filter(Boolean).join(' ')}>
            {label}
          </span>
        );
      })}
    </div>
  );
}

const HAND: { finger: Finger; x: number; y: number; h: number }[] = [
  { finger: 'lp', x: 6, y: 34, h: 42 },
  { finger: 'lr', x: 26, y: 18, h: 58 },
  { finger: 'lm', x: 46, y: 10, h: 66 },
  { finger: 'li', x: 66, y: 20, h: 56 },
];

/** Zwei Hände; der Finger, der dran ist, leuchtet. */
export function Hands({ active }: { active: Finger | null }) {
  const finger = (f: Finger, x: number, y: number, h: number, key: string) => (
    <rect
      key={key}
      x={x}
      y={y}
      width={17}
      height={h}
      rx={8.5}
      className={['hand-finger', `f-${f}`, active === f ? 'is-active' : ''].filter(Boolean).join(' ')}
    />
  );
  return (
    <svg className="hands" viewBox="0 0 300 130" role="img" aria-label="Deine Hände auf der Tastatur">
      <g>
        <path d="M4 70h82c6 0 10 4 10 10v20c0 16-12 26-28 26H32C16 126 4 114 4 98z" className="hand-palm" />
        {HAND.map((p) => finger(p.finger, p.x, p.y, p.h, `l-${p.finger}`))}
        <rect x={84} y={74} width={17} height={44} rx={8.5} transform="rotate(-38 92 96)" className={['hand-finger', 'f-th', active === 'th' ? 'is-active' : ''].filter(Boolean).join(' ')} />
      </g>
      <g transform="translate(300 0) scale(-1 1)">
        <path d="M4 70h82c6 0 10 4 10 10v20c0 16-12 26-28 26H32C16 126 4 114 4 98z" className="hand-palm" />
        {HAND.map((p) => finger(p.finger.replace('l', 'r') as Finger, p.x, p.y, p.h, `r-${p.finger}`))}
        <rect x={84} y={74} width={17} height={44} rx={8.5} transform="rotate(-38 92 96)" className={['hand-finger', 'f-th', active === 'th' ? 'is-active' : ''].filter(Boolean).join(' ')} />
      </g>
    </svg>
  );
}
