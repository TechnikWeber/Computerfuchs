import { useId } from 'react';
import type { WallpaperId } from '../core/catalog';
import { seeded } from '../core/random';

/*
 * Hintergrundbilder als SVG: scharf auf jedem Bildschirm, ohne Bilddateien.
 */

const NIGHT_STARS = (() => {
  const r = seeded(42);
  return Array.from({ length: 110 }, () => ({ x: r() * 1600, y: r() * 680, s: 0.8 + r() * 2.4, o: 0.35 + r() * 0.65 }));
})();

const SPACE_STARS = (() => {
  const r = seeded(7);
  return Array.from({ length: 170 }, () => ({ x: r() * 1600, y: r() * 1000, s: 0.6 + r() * 2.2, o: 0.3 + r() * 0.7 }));
})();

const BUBBLES = (() => {
  const r = seeded(3);
  return Array.from({ length: 26 }, () => ({ x: r() * 1600, y: 120 + r() * 760, s: 6 + r() * 22 }));
})();

const FLOWERS = (() => {
  const r = seeded(11);
  const colors = ['#ff6fae', '#ffffff', '#ffd43b', '#b28dff', '#ff8a3d'];
  return Array.from({ length: 34 }, (_, i) => ({
    x: (i / 34) * 1600 + r() * 40,
    y: 912 + r() * 70,
    s: 0.55 + r() * 0.6,
    c: colors[Math.floor(r() * colors.length)],
  }));
})();

const FIREFLIES = (() => {
  const r = seeded(5);
  return Array.from({ length: 14 }, () => ({ x: r() * 1600, y: 760 + r() * 200, s: 2 + r() * 3 }));
})();

export function Wallpaper({ id, className }: { id: WallpaperId; className?: string }) {
  const u = `wp${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg
      className={className ? `wallpaper ${className}` : 'wallpaper'}
      viewBox="0 0 1600 1000"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {id === 'wiese' && <Wiese u={u} />}
      {id === 'nacht' && <Nacht u={u} />}
      {id === 'meer' && <Meer u={u} />}
      {id === 'weltall' && <Weltall u={u} />}
      {id === 'berge' && <Berge u={u} />}
      {id === 'bonbon' && <Bonbon u={u} />}
    </svg>
  );
}

function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse rx="125" ry="46" />
      <ellipse cx="58" cy="-28" rx="78" ry="56" />
      <ellipse cx="-52" cy="-16" rx="64" ry="44" />
    </g>
  );
}

function Wiese({ u }: { u: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${u}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#57b9ff" />
          <stop offset=".55" stopColor="#a6dcff" />
          <stop offset="1" stopColor="#e6f7ff" />
        </linearGradient>
        <radialGradient id={`${u}g`}>
          <stop offset="0" stopColor="#fff7c2" />
          <stop offset=".5" stopColor="#ffe066" stopOpacity=".55" />
          <stop offset="1" stopColor="#ffe066" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="1000" fill={`url(#${u}s)`} />
      <circle cx="1290" cy="190" r="220" fill={`url(#${u}g)`} />
      <circle cx="1290" cy="190" r="92" fill="#ffd43b" />
      <g fill="#fff" opacity=".96">
        <Cloud x={300} y={210} s={1} />
        <Cloud x={820} y={300} s={0.72} />
        <Cloud x={1480} y={430} s={0.55} />
      </g>
      <path d="M0 690C260 590 470 610 720 670s520-80 880-30V1000H0Z" fill="#9be38f" />
      <path d="M0 790c300-90 600-30 900 10 250 30 450-60 700-40V1000H0Z" fill="#62cf70" />
      <path d="M0 885c350-60 700 20 1000 0 250-15 450-50 600-30V1000H0Z" fill="#3db85d" />
      {FLOWERS.map((f, i) => (
        <g key={i} transform={`translate(${f.x} ${f.y}) scale(${f.s})`}>
          <circle r="9" cy="-9" fill={f.c} />
          <circle r="9" cx="9" fill={f.c} />
          <circle r="9" cy="9" fill={f.c} />
          <circle r="9" cx="-9" fill={f.c} />
          <circle r="6.5" fill="#ffc533" />
        </g>
      ))}
    </>
  );
}

function Nacht({ u }: { u: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${u}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#10143d" />
          <stop offset=".6" stopColor="#251f66" />
          <stop offset="1" stopColor="#3f3589" />
        </linearGradient>
        <radialGradient id={`${u}g`}>
          <stop offset="0" stopColor="#fff5c8" stopOpacity=".7" />
          <stop offset="1" stopColor="#fff5c8" stopOpacity="0" />
        </radialGradient>
        <mask id={`${u}m`}>
          <circle cx="1250" cy="210" r="78" fill="#fff" />
          <circle cx="1286" cy="184" r="70" fill="#000" />
        </mask>
      </defs>
      <rect width="1600" height="1000" fill={`url(#${u}s)`} />
      {NIGHT_STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={s.o} />
      ))}
      <circle cx="1250" cy="210" r="180" fill={`url(#${u}g)`} opacity=".55" />
      <circle cx="1250" cy="210" r="78" fill="#fff1b8" mask={`url(#${u}m)`} />
      <path d="M0 760c300-80 520-60 800 0s560-40 800-20V1000H0Z" fill="#262a6e" />
      <path d="M0 860c320-60 640 10 960 0 260-8 440-50 640-40V1000H0Z" fill="#1a1d4f" />
      {FIREFLIES.map((f, i) => (
        <circle key={i} cx={f.x} cy={f.y} r={f.s} fill="#ffe77a" opacity=".85" />
      ))}
    </>
  );
}

function Meer({ u }: { u: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${u}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5fd6ff" />
          <stop offset=".35" stopColor="#1f9be6" />
          <stop offset=".7" stopColor="#0b5fae" />
          <stop offset="1" stopColor="#073a78" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill={`url(#${u}s)`} />
      <g fill="#fff" opacity=".09">
        <path d="M300 0h120L260 1000H80Z" />
        <path d="M720 0h90L770 1000H570Z" />
        <path d="M1100 0h140l120 1000h-200Z" />
      </g>
      {BUBBLES.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={b.s} fill="#fff" fillOpacity=".08" stroke="#fff" strokeOpacity=".5" strokeWidth="3" />
      ))}
      <g transform="translate(1150 380)">
        <ellipse rx="46" ry="26" fill="#ffb84d" />
        <path d="m40 0 34-22v44Z" fill="#ffb84d" />
        <circle cx="-24" cy="-6" r="5" fill="#23263b" />
      </g>
      <g transform="translate(430 560) scale(-.8 .8)">
        <ellipse rx="46" ry="26" fill="#ff7aa8" />
        <path d="m40 0 34-22v44Z" fill="#ff7aa8" />
        <circle cx="-24" cy="-6" r="5" fill="#23263b" />
      </g>
      <g fill="none" stroke="#1fc48d" strokeWidth="22" strokeLinecap="round">
        <path d="M180 1000c-30-90 40-150 0-240s30-150 10-200" />
        <path d="M260 1000c30-80-30-130 10-210" />
        <path d="M1380 1000c-30-90 40-150 0-240s30-120 10-170" />
        <path d="M1460 1000c25-70-25-110 5-180" />
      </g>
      <path d="M0 940c220-30 500 10 800-10s560-30 800-5V1000H0Z" fill="#f0cf86" />
    </>
  );
}

function Weltall({ u }: { u: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${u}s`} cx=".3" cy=".25" r=".9">
          <stop offset="0" stopColor="#3b2a86" />
          <stop offset=".55" stopColor="#17113f" />
          <stop offset="1" stopColor="#0a0822" />
        </radialGradient>
        <radialGradient id={`${u}p`} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#ffd27a" />
          <stop offset=".6" stopColor="#ff8a3d" />
          <stop offset="1" stopColor="#d9501a" />
        </radialGradient>
        <radialGradient id={`${u}q`} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#7fe0ff" />
          <stop offset="1" stopColor="#2f6bff" />
        </radialGradient>
        <linearGradient id={`${u}t`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill={`url(#${u}s)`} />
      {SPACE_STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={s.o} />
      ))}
      <path d="M250 150 500 235" stroke={`url(#${u}t)`} strokeWidth="5" strokeLinecap="round" />
      <g transform="translate(1180 330) rotate(-16)">
        <ellipse rx="270" ry="62" fill="none" stroke="#ffd9a0" strokeWidth="18" opacity=".45" />
        <circle r="150" fill={`url(#${u}p)`} transform="rotate(16)" />
        <path d="M-270 0a270 62 0 0 0 540 0" fill="none" stroke="#ffd9a0" strokeWidth="18" opacity=".9" />
      </g>
      <circle cx="360" cy="720" r="70" fill={`url(#${u}q)`} />
      <ellipse cx="340" cy="700" rx="16" ry="10" fill="#fff" opacity=".25" />
      <ellipse cx="385" cy="745" rx="10" ry="7" fill="#fff" opacity=".2" />
      <circle cx="505" cy="615" r="20" fill="#c9c3ff" />
    </>
  );
}

function Berge({ u }: { u: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${u}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff7d8c" />
          <stop offset=".45" stopColor="#ffa27a" />
          <stop offset=".75" stopColor="#ffd29a" />
          <stop offset="1" stopColor="#ffe8c2" />
        </linearGradient>
        <radialGradient id={`${u}g`}>
          <stop offset="0" stopColor="#fff6d6" stopOpacity=".9" />
          <stop offset="1" stopColor="#fff6d6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="1000" fill={`url(#${u}s)`} />
      <circle cx="800" cy="640" r="280" fill={`url(#${u}g)`} />
      <circle cx="800" cy="640" r="150" fill="#fff3c9" />
      <path d="M0 700 180 520l150 120 190-210 180 190 180-150 180 170 190-220 170 180 180-100V1000H0Z" fill="#c77fb0" />
      <path d="m520 430 40 48-20-8-20 16-20-18-18 8ZM1250 420l40 48-20-8-20 16-20-18-18 8Z" fill="#fff" opacity=".85" />
      <path d="M0 800 220 610l200 150 220-200 220 220 220-180 220 190 300-170V1000H0Z" fill="#8f5ea8" />
      <path d="M0 900c200-50 400-10 600-30s500-60 1000-10V1000H0Z" fill="#5a3f86" />
      <g fill="none" stroke="#5a3f86" strokeWidth="5" strokeLinecap="round">
        <path d="M300 260q15-14 30 0 15-14 30 0" />
        <path d="M380 220q11-10 22 0 11-10 22 0" />
        <path d="M1180 280q13-12 26 0 13-12 26 0" />
      </g>
    </>
  );
}

function Bonbon({ u }: { u: string }) {
  const blobs = [
    { x: 250, y: 200, r: 520, c: '#ff8cc6' },
    { x: 1350, y: 180, r: 560, c: '#a98bff' },
    { x: 1200, y: 880, r: 600, c: '#66ccff' },
    { x: 300, y: 900, r: 520, c: '#ffd66b' },
    { x: 820, y: 520, r: 420, c: '#7ee8d0' },
  ];
  return (
    <>
      <defs>
        {blobs.map((b, i) => (
          <radialGradient key={i} id={`${u}b${i}`}>
            <stop offset="0" stopColor={b.c} stopOpacity=".95" />
            <stop offset="1" stopColor={b.c} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      <rect width="1600" height="1000" fill="#fff1f7" />
      {blobs.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={`url(#${u}b${i})`} />
      ))}
      <g fill="#fff" opacity=".9">
        <path d="M520 300l10 26 26 10-26 10-10 26-10-26-26-10 26-10Z" />
        <path d="M1120 640l7 18 18 7-18 7-7 18-7-18-18-7 18-7Z" />
        <path d="M1380 380l6 15 15 6-15 6-6 15-6-15-15-6 15-6Z" />
      </g>
    </>
  );
}
