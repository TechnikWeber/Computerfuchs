import type { CSSProperties, ReactNode } from 'react';

export type IconName =
  | 'close' | 'minimize' | 'maximize' | 'restore' | 'speaker' | 'speaker-off' | 'fullscreen' | 'fullscreen-exit'
  | 'power' | 'back' | 'next' | 'up' | 'lock' | 'check' | 'plus' | 'upload' | 'download' | 'logout' | 'replay' | 'grid'
  | 'trash' | 'info' | 'play' | 'stop' | 'user' | 'undo' | 'redo';

const PATHS: Record<IconName, ReactNode> = {
  close: <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />,
  minimize: <path d="M5.5 12h13" />,
  maximize: <rect x="5" y="5" width="14" height="14" rx="2.5" />,
  restore: (
    <>
      <rect x="4" y="8.5" width="11.5" height="11.5" rx="2.2" />
      <path d="M8.5 8.5V6A1.8 1.8 0 0 1 10.3 4.2H18A1.8 1.8 0 0 1 19.8 6v7.7a1.8 1.8 0 0 1-1.8 1.8h-2.5" />
    </>
  ),
  speaker: (
    <>
      <path d="M4 9.5h3.4L12 5.6v12.8l-4.6-3.9H4z" fill="currentColor" />
      <path d="M15.6 9.2a4 4 0 0 1 0 5.6M18.2 6.6a7.6 7.6 0 0 1 0 10.8" />
    </>
  ),
  'speaker-off': (
    <>
      <path d="M4 9.5h3.4L12 5.6v12.8l-4.6-3.9H4z" fill="currentColor" />
      <path d="m16 9.5 5 5m0-5-5 5" />
    </>
  ),
  fullscreen: <path d="M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15" />,
  'fullscreen-exit': <path d="M9 4.5V9H4.5M19.5 9H15V4.5M15 19.5V15h4.5M4.5 15H9v4.5" />,
  power: <path d="M12 3.8v7.4M7.1 6.6a7.4 7.4 0 1 0 9.8 0" />,
  back: <path d="M14.5 5.5 8 12l6.5 6.5" />,
  next: <path d="M9.5 5.5 16 12l-6.5 6.5" />,
  up: <path d="M12 19V5.5M5.5 12 12 5.5l6.5 6.5" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  check: <path d="m5 12.5 4.8 4.8L19 7.2" />,
  plus: <path d="M12 5v14M5 12h14" />,
  upload: <path d="M12 15V4.5M7.5 9 12 4.5 16.5 9M5 15.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5" />,
  download: <path d="M12 4.5V15M7.5 10.5 12 15l4.5-4.5M5 15.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5" />,
  logout: <path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10M14 8l4 4-4 4M18 12H9.5" />,
  replay: <path d="M5.2 12a6.8 6.8 0 1 0 2-4.8M5 4.5v4h4" />,
  grid: (
    <>
      <rect x="4.5" y="4.5" width="6" height="6" rx="1.6" />
      <rect x="13.5" y="4.5" width="6" height="6" rx="1.6" />
      <rect x="4.5" y="13.5" width="6" height="6" rx="1.6" />
      <rect x="13.5" y="13.5" width="6" height="6" rx="1.6" />
    </>
  ),
  trash: <path d="M5 7h14M10 4.5h4M7 7l.9 12.5h8.2L17 7" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  play: <path d="M8 5.5 18 12 8 18.5z" fill="currentColor" />,
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" />,
  undo: <path d="M9 14.5 4.5 10 9 5.5M4.5 10H14a5.5 5.5 0 0 1 0 11h-3.5" />,
  redo: <path d="M15 14.5 19.5 10 15 5.5M19.5 10H10a5.5 5.5 0 0 0 0 11h3.5" />,
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M5 19.5a7 7 0 0 1 14 0" />
    </>
  ),
};

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 24, stroke = 2.6, className, style }: IconProps) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/**
 * Ein Byte als goldener Riegel mit 8 Bits. Die Kästchen zeigen 01000010 –
 * das ist im Computer der Buchstabe „B".
 */
export function ByteIcon({ size = 28 }: { size?: number }) {
  const bits = [0, 1, 0, 0, 0, 0, 1, 0];
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 40 28" aria-hidden="true" className="byte-icon">
      <rect x="1" y="1" width="38" height="26" rx="7" fill="#ffc533" stroke="#d99a00" strokeWidth="2" />
      <rect x="3" y="3" width="34" height="9" rx="4.5" fill="#fff" opacity=".28" />
      {bits.map((b, i) => (
        <rect
          key={i}
          x={6 + (i % 4) * 7.5}
          y={i < 4 ? 6 : 15.5}
          width="5.5"
          height="6.5"
          rx="1.6"
          fill={b ? '#fffbe8' : '#d99a00'}
          opacity={b ? 1 : 0.55}
        />
      ))}
    </svg>
  );
}

export function StarIcon({ filled, size = 24 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.8l2.75 5.6 6.15.9-4.45 4.33 1.05 6.12L12 16.87l-5.5 2.88 1.05-6.12L3.1 9.3l6.15-.9z"
        fill={filled ? '#ffc533' : '#e3e7f1'}
        stroke={filled ? '#d99a00' : '#c6ccdc'}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Stars({ count, size = 22, max = 3 }: { count: number; size?: number; max?: number }) {
  return (
    <span className="stars" role="img" aria-label={`${count} von ${max} Sternen`}>
      {Array.from({ length: max }, (_, i) => (
        <StarIcon key={i} filled={i < count} size={size} />
      ))}
    </span>
  );
}
