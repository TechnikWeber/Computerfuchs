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
      {id === 'regenbogen' && <Regenbogen u={u} />}
      {id === 'polarlicht' && <Polarlicht u={u} />}
      {id === 'kirschbluete' && <Kirschbluete u={u} />}
      {id === 'pixel' && <Pixel />}
    </svg>
  );
}

const RAINBOW = ['#ff4d5e', '#ff8a3d', '#ffd23f', '#3cc46b', '#3aa3ff', '#5b6cff', '#9b7bff'];

function Regenbogen({ u }: { u: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${u}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fd0ff" />
          <stop offset=".7" stopColor="#d4f0ff" />
          <stop offset="1" stopColor="#f2fbff" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill={`url(#${u}s)`} />
      <g fill="none" strokeWidth="38" opacity=".92">
        {RAINBOW.map((c, i) => {
          const r = 540 - i * 38;
          return <path key={c} d={`M${800 - r} 840A${r} ${r} 0 0 1 ${800 + r} 840`} stroke={c} />;
        })}
      </g>
      <g fill="#fff">
        <Cloud x={290} y={820} s={1.15} />
        <Cloud x={1320} y={820} s={1.15} />
        <Cloud x={760} y={150} s={0.6} />
      </g>
      <path d="M0 820c240-70 480-50 760 10s560-50 840-20V1000H0Z" fill="#8be38f" />
      <path d="M0 900c300-50 640 10 960-10 250-15 450-30 640-10V1000H0Z" fill="#4cc36a" />
    </>
  );
}

function Polarlicht({ u }: { u: string }) {
  const bands = [
    { d: 'M0 260C260 160 480 360 800 250s560-160 800-40v120c-240-90-480 40-800 130S260 280 0 380Z', c: '#3cf0a0', o: 0.55 },
    { d: 'M0 360C300 280 560 460 860 360s520-120 740-30v90c-260-70-460 60-760 140S280 380 0 450Z', c: '#2fd1ff', o: 0.4 },
    { d: 'M200 160C460 90 700 220 960 150s420-90 640-10v70c-220-60-400 40-660 90S420 200 200 230Z', c: '#b98bff', o: 0.35 },
  ];
  return (
    <>
      <defs>
        <linearGradient id={`${u}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#050f24" />
          <stop offset=".6" stopColor="#0b2747" />
          <stop offset="1" stopColor="#143e5e" />
        </linearGradient>
        {bands.map((b, i) => (
          <linearGradient key={i} id={`${u}a${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={b.c} stopOpacity="0" />
            <stop offset=".5" stopColor={b.c} stopOpacity="1" />
            <stop offset="1" stopColor={b.c} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      <rect width="1600" height="1000" fill={`url(#${u}s)`} />
      {SPACE_STARS.slice(0, 120).map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y * 0.7} r={s.s * 0.8} fill="#fff" opacity={s.o * 0.8} />
      ))}
      {bands.map((b, i) => (
        <path key={i} d={b.d} fill={`url(#${u}a${i})`} opacity={b.o} />
      ))}
      <path d="M0 760 200 600l140 100 180-180 180 170 200-130 180 140 180-160 180 140 160-80V1000H0Z" fill="#1d3557" />
      <path d="m520 520 50 52-26-6-24 22-22-20-30 6ZM1260 540l46 48-24-4-22 18-22-18-26 6ZM900 560l40 40-20-4-20 16-18-14-22 4Z" fill="#eef6ff" opacity=".9" />
      <path d="M0 860c300-40 640 20 960 0 260-16 460-36 640-20V1000H0Z" fill="#0c1d31" />
    </>
  );
}

const BLOSSOMS = (() => {
  const r = seeded(21);
  const branch = (x0: number, y0: number, x1: number, y1: number, n: number) =>
    Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1);
      return { x: x0 + (x1 - x0) * t + (r() - 0.5) * 70, y: y0 + (y1 - y0) * t + (r() - 0.5) * 60, s: 0.7 + r() * 0.6 };
    });
  return [...branch(40, 120, 980, 230, 16), ...branch(420, 170, 620, 360, 5), ...branch(760, 220, 980, 420, 5), ...branch(1600, 90, 1180, 200, 8)];
})();

const PETALS = (() => {
  const r = seeded(33);
  return Array.from({ length: 30 }, () => ({ x: r() * 1600, y: 300 + r() * 600, rot: r() * 180 }));
})();

function Kirschbluete({ u }: { u: string }) {
  const pinks = ['#ffb7d0', '#ff8fb8', '#ffd1e0'];
  return (
    <>
      <defs>
        <linearGradient id={`${u}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe1ee" />
          <stop offset=".6" stopColor="#fff5f9" />
          <stop offset="1" stopColor="#e3f3ff" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill={`url(#${u}s)`} />
      <g fill="none" stroke="#6b4a3a" strokeLinecap="round">
        <path d="M-20 110c220 40 360 0 540 80s300 70 460 30" strokeWidth="26" />
        <path d="M430 170c60 60 120 110 190 190" strokeWidth="12" />
        <path d="M760 230c70 50 140 110 220 190" strokeWidth="12" />
        <path d="M1620 80c-140 20-280 60-440 120" strokeWidth="20" />
      </g>
      {BLOSSOMS.map((b, i) => (
        <g key={i} transform={`translate(${b.x} ${b.y}) scale(${b.s})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-16" rx="12" ry="17" fill={pinks[i % 3]} transform={`rotate(${a})`} />
          ))}
          <circle r="6" fill="#ffd23f" />
        </g>
      ))}
      {PETALS.map((p, i) => (
        <ellipse key={i} cx={p.x} cy={p.y} rx="9" ry="5" fill="#ffb7d0" opacity=".8" transform={`rotate(${p.rot} ${p.x} ${p.y})`} />
      ))}
      <path d="M0 880c300-40 700 20 1000 0 300-20 450-10 600 5V1000H0Z" fill="#cdeccf" />
    </>
  );
}

/** Höhen in Klötzchen je Spalte – berechnet, nicht zufällig, damit das Bild immer gleich aussieht. */
const PIXEL_HILLS = Array.from({ length: 40 }, (_, i) => ({
  back: 6 + Math.round(2.4 * Math.sin(i / 3.2) + 1.5 * Math.sin(i / 1.7)),
  front: 3 + Math.round(1.6 * Math.sin(i / 2.3 + 1) + Math.sin(i / 1.1)),
}));

const PIXEL_SUN = (() => {
  const out: { x: number; y: number }[] = [];
  for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) if (dx * dx + dy * dy <= 18) out.push({ x: 32 + dx, y: 5 + dy });
  return out;
})();

const PIXEL_CLOUDS = [
  { x: 5, y: 4, w: [3, 5, 6] },
  { x: 18, y: 7, w: [2, 4, 5] },
];

function Pixel() {
  const B = 40;
  return (
    <>
      <rect width="1600" height="1000" fill="#6ec6ff" />
      <rect y="440" width="1600" height="560" fill="#9fdcff" />
      {PIXEL_SUN.map((p, i) => (
        <rect key={i} x={p.x * B} y={p.y * B} width={B} height={B} fill={(p.x + p.y) % 2 ? '#ffd23f' : '#ffc533'} />
      ))}
      {PIXEL_CLOUDS.map((c, i) => (
        <g key={i} fill="#fff">
          {c.w.map((w, row) => (
            <rect key={row} x={(c.x - Math.floor(w / 2)) * B} y={(c.y + row - 2) * B} width={w * B} height={B} />
          ))}
        </g>
      ))}
      {PIXEL_HILLS.map((h, i) => (
        <g key={i}>
          <rect x={i * B} y={1000 - h.back * B} width={B} height={h.back * B} fill={i % 2 ? '#3cc46b' : '#36b562'} />
          <rect x={i * B} y={1000 - h.front * B} width={B} height={h.front * B} fill={i % 2 ? '#2a9d55' : '#27924f'} />
          <rect x={i * B} y={1000 - h.front * B} width={B} height={B / 2} fill="#7be08f" />
        </g>
      ))}
      <g>
        <rect x={9 * B} y={1000 - 9 * B} width={B} height={4 * B} fill="#8a5a3c" />
        <rect x={8 * B} y={1000 - 12 * B} width={3 * B} height={3 * B} fill="#1f8a4c" />
        <rect x={7 * B} y={1000 - 11 * B} width={5 * B} height={B} fill="#1f8a4c" />
      </g>
    </>
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
