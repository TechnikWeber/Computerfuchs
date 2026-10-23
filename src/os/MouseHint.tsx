export type MouseAction = 'move' | 'left' | 'double' | 'drag' | 'right' | 'wheel';

/** Eine Maus, die zeigt, welche Taste gebraucht wird. */
export function MouseHint({ action, size = 96 }: { action: MouseAction; size?: number }) {
  const left = action === 'left' || action === 'double' || action === 'drag';
  const right = action === 'right';
  const wheel = action === 'wheel';
  const hot = '#ff7a2f';
  return (
    <svg
      className={`mouse-hint mouse-hint-${action}`}
      width={size}
      height={size * 1.4}
      viewBox="-30 -26 160 196"
      role="img"
      aria-label={LABELS[action]}
    >
      <path d="M50 8C50-6 66-8 66-24" fill="none" stroke="#5d6380" strokeWidth="5" strokeLinecap="round" />
      <path d="M50 8C78 8 92 30 92 62v34c0 24-18 38-42 38S8 120 8 96V62C8 30 22 8 50 8Z" fill="#fff" stroke="#23263b" strokeWidth="5" />
      <path d="M50 10C25 10 10 30 10 58h40Z" className={left ? 'mh-hot' : undefined} fill={left ? hot : '#eef1f8'} />
      <path d="M50 10c25 0 40 20 40 48H50Z" className={right ? 'mh-hot' : undefined} fill={right ? hot : '#eef1f8'} />
      <path d="M8 58h84M50 8v50" stroke="#23263b" strokeWidth="5" />
      <rect x="42" y="20" width="16" height="28" rx="8" className={wheel ? 'mh-hot' : undefined} fill={wheel ? hot : '#c6ccdc'} stroke="#23263b" strokeWidth="4" />
      {action === 'double' && (
        <g transform="translate(-24 -14)">
          <circle r="20" fill="#2f9bff" />
          <text textAnchor="middle" dy="7" fontSize="20" fontWeight="800" fill="#fff" fontFamily="Fredoka Variable, sans-serif">2×</text>
        </g>
      )}
      {action === 'wheel' && (
        <g fill="none" stroke="#2f9bff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="mh-arrows">
          <path d="M112 30v40m-10-12 10 12 10-12" />
          <path d="M112 96v-6" />
        </g>
      )}
      {action === 'move' && (
        <g fill="none" stroke="#2f9bff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="mh-arrows">
          <path d="M-18 70h-8m8-8-8 8 8 8" />
          <path d="M118 70h8m-8-8 8 8-8 8" />
          <path d="M50 152v8m-8-8 8 8 8-8" />
        </g>
      )}
      {action === 'drag' && (
        <g fill="none" stroke="#2f9bff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="mh-arrows">
          <path d="M100 110q20-6 28-28m-12 2 12-2 2 12" />
        </g>
      )}
    </svg>
  );
}

const LABELS: Record<MouseAction, string> = {
  move: 'Maus bewegen',
  left: 'Linke Maustaste',
  double: 'Zweimal schnell mit der linken Maustaste klicken',
  drag: 'Linke Maustaste festhalten und ziehen',
  right: 'Rechte Maustaste',
  wheel: 'Am Mausrad drehen',
};
