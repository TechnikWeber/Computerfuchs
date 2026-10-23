import { useId } from 'react';

export type FoxMood = 'happy' | 'cheer' | 'wink';

/** Flinn, der flinke Computerfuchs – das Maskottchen. */
export function Fox({ size = 96, mood = 'happy', className }: { size?: number; mood?: FoxMood; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const fur = `fox-fur-${uid}`;
  return (
    <svg
      className={className ? `fox ${className}` : 'fox'}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="Flinn, der Fuchs"
    >
      <defs>
        <linearGradient id={fur} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffa057" />
          <stop offset="1" stopColor="#ff6a1a" />
        </linearGradient>
      </defs>
      <g className="fox-ear fox-ear-l">
        <path d="M44 98 50 28q2-11 11.5-6L104 58Z" fill={`url(#${fur})`} stroke="#c9500c" strokeWidth="4" strokeLinejoin="round" />
        <path d="M56 82 60 40l28 22Z" fill="#ffe1cc" />
      </g>
      <g className="fox-ear fox-ear-r">
        <path d="M156 98 150 28q-2-11-11.5-6L96 58Z" fill={`url(#${fur})`} stroke="#c9500c" strokeWidth="4" strokeLinejoin="round" />
        <path d="M144 82 140 40l-28 22Z" fill="#ffe1cc" />
      </g>
      <path d="M100 52c46 0 76 30 76 62 0 32-34 58-76 62-42-4-76-30-76-62 0-32 30-62 76-62Z" fill={`url(#${fur})`} />
      <path d="M24 114c24 2 48 14 76 38 28-24 52-36 76-38-2 32-34 58-76 62-42-4-74-30-76-62Z" fill="#fff8f2" />
      <path
        d="M100 52c46 0 76 30 76 62 0 32-34 58-76 62-42-4-76-30-76-62 0-32 30-62 76-62Z"
        fill="none"
        stroke="#c9500c"
        strokeWidth="4"
      />
      {mood === 'cheer' ? (
        <>
          <path d="M60 111q12-14 24 0M116 111q12-14 24 0" fill="none" stroke="#23263b" strokeWidth="6" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="72" cy="108" rx="10" ry="12" fill="#23263b" />
          <circle cx="75.5" cy="103" r="3.6" fill="#fff" />
          {mood === 'wink' ? (
            <path d="M118 109q10-10 20 0" fill="none" stroke="#23263b" strokeWidth="6" strokeLinecap="round" />
          ) : (
            <>
              <ellipse cx="128" cy="108" rx="10" ry="12" fill="#23263b" />
              <circle cx="131.5" cy="103" r="3.6" fill="#fff" />
            </>
          )}
        </>
      )}
      <ellipse cx="53" cy="134" rx="11" ry="7" fill="#ff8fa3" opacity=".55" />
      <ellipse cx="147" cy="134" rx="11" ry="7" fill="#ff8fa3" opacity=".55" />
      <path d="M89 139q11-7 22 0-4 10-11 12-7-2-11-12Z" fill="#23263b" />
      {mood === 'cheer' ? (
        <path d="M86 155q14 20 28 0Z" fill="#23263b" stroke="#23263b" strokeWidth="3" strokeLinejoin="round" />
      ) : (
        <path d="M100 151q0 10-10 12m10-12q0 10 10 12" fill="none" stroke="#23263b" strokeWidth="4" strokeLinecap="round" />
      )}
    </svg>
  );
}
