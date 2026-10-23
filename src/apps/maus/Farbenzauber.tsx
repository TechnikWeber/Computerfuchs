import { useRef, useState, type MouseEvent, type PointerEvent, type ReactNode, type SVGProps } from 'react';
import { useTimeouts } from '../../core/hooks';
import { defaultRng, pick } from '../../core/random';
import { sfx } from '../../core/sound';
import { Icon } from '../../os/Icon';
import type { LevelProps, Tier } from '../shared/levelTypes';
import { LevelHint } from '../shared/LevelUi';
import { useHint } from '../shared/useHint';

type ColorId = 'rot' | 'orange' | 'gelb' | 'gruen' | 'blau' | 'lila' | 'rosa' | 'braun';
type PartId = 'sonne' | 'dach' | 'haus' | 'tuer' | 'baum' | 'blume' | 'fenster';

const PALETTE: { id: ColorId; name: string; c: string }[] = [
  { id: 'rot', name: 'Rot', c: '#ff4d5e' },
  { id: 'orange', name: 'Orange', c: '#ff8a3d' },
  { id: 'gelb', name: 'Gelb', c: '#ffd23f' },
  { id: 'gruen', name: 'Grün', c: '#3cc46b' },
  { id: 'blau', name: 'Blau', c: '#3aa3ff' },
  { id: 'lila', name: 'Lila', c: '#9b7bff' },
  { id: 'rosa', name: 'Rosa', c: '#ff8fc8' },
  { id: 'braun', name: 'Braun', c: '#a8683a' },
];

const colorOf = (id: ColorId) => PALETTE.find((p) => p.id === id)?.c ?? '#fff';

const PART_NAMES: Record<PartId, string> = {
  sonne: 'die Sonne',
  dach: 'das Dach',
  haus: 'das Haus',
  tuer: 'die Tür',
  baum: 'den Baum',
  blume: 'die Blume',
  fenster: 'das Fenster',
};

/** Sinnvolle Farben für die Vorlage – eine grüne Sonne wäre gemein. */
const TEMPLATE_CHOICES: Record<PartId, ColorId[]> = {
  sonne: ['gelb', 'orange'],
  dach: ['rot', 'braun', 'blau', 'lila'],
  haus: ['blau', 'gelb', 'rosa', 'orange', 'lila', 'gruen'],
  tuer: ['braun', 'rot', 'gruen', 'blau'],
  baum: ['gruen'],
  blume: ['rosa', 'lila', 'rot', 'gelb', 'blau'],
  fenster: ['blau', 'gelb'],
};

const PARTS_BY_TIER: Record<Tier, PartId[]> = {
  1: ['sonne', 'dach', 'haus', 'baum'],
  2: ['sonne', 'dach', 'haus', 'tuer', 'baum', 'blume'],
  3: ['sonne', 'dach', 'haus', 'tuer', 'fenster', 'baum', 'blume'],
};

const BLANK = '#eef0f6';

/** Teile, die auf dieser Stufe nicht ausgemalt werden, sind schon bunt. */
const FIXED: Record<PartId, string> = {
  sonne: '#ffd23f',
  dach: '#ff4d5e',
  haus: '#ffe3b3',
  tuer: '#a8683a',
  baum: '#3cc46b',
  blume: '#ff8fc8',
  fenster: '#bfe3ff',
};

function makeTemplate(parts: PartId[]): Partial<Record<PartId, ColorId>> {
  const t: Partial<Record<PartId, ColorId>> = {};
  for (const part of parts) {
    let choices = TEMPLATE_CHOICES[part];
    // Tür und Fenster sollen sich vom Haus abheben.
    if ((part === 'tuer' || part === 'fenster') && t.haus) choices = choices.filter((c) => c !== t.haus);
    t[part] = pick(defaultRng, choices);
  }
  return t;
}

interface Menu {
  part: PartId;
  x: number;
  y: number;
  sub: boolean;
}

/** Level 6: Rechtsklick. Ein Kontextmenü färbt das Bild ein. */
export function Farbenzauber({ tier, onDone }: LevelProps) {
  const parts = PARTS_BY_TIER[tier];
  const field = useRef<HTMLDivElement>(null);
  const [template] = useState(() => makeTemplate(parts));
  const [colors, setColors] = useState<Partial<Record<PartId, ColorId>>>({});
  const [menu, setMenu] = useState<Menu | null>(null);
  const [splash, setSplash] = useState<PartId | null>(null);
  const finished = useRef(false);
  const later = useTimeouts();
  const [hint, showHint] = useHint(2600);
  const withTemplate = tier > 1;

  const openMenu = (part: PartId, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (finished.current) return;
    const r = field.current?.getBoundingClientRect();
    if (!r) return;
    sfx.tap();
    setMenu({
      part,
      x: Math.max(8, Math.min(e.clientX - r.left, r.width - (tier === 3 ? 470 : 300))),
      y: Math.max(8, Math.min(e.clientY - r.top, r.height - (tier === 3 ? 200 : 290))),
      sub: false,
    });
  };

  const leftClick = (e: PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setMenu(null);
    showHint('Das war die linke Taste. Nimm die RECHTE Maustaste!');
  };

  const paint = (part: PartId, color: ColorId | null) => {
    setMenu(null);
    const next = { ...colors };
    if (color) next[part] = color;
    else delete next[part];
    setColors(next);
    if (!color) return;
    sfx.paint();
    setSplash(part);
    later(() => setSplash((s) => (s === part ? null : s)), 450);
    const done = withTemplate
      ? parts.every((p) => next[p] === template[p])
      : parts.every((p) => next[p] !== undefined);
    if (done && !finished.current) {
      finished.current = true;
      sfx.success();
      later(onDone, 1200);
    } else if (withTemplate && next[part] !== template[part]) {
      showHint('Schau auf die Vorlage – welche Farbe hat das dort?');
    }
  };

  const fill = (part: PartId) => {
    const c = colors[part];
    return c ? colorOf(c) : BLANK;
  };

  const partProps = (part: PartId): SVGProps<SVGGElement> => ({
    className: [
      'paint-part',
      parts.includes(part) ? 'is-paintable' : '',
      splash === part ? 'is-splash' : '',
      menu?.part === part ? 'is-menu' : '',
    ]
      .filter(Boolean)
      .join(' '),
    onContextMenu: parts.includes(part) ? (e: MouseEvent) => openMenu(part, e) : undefined,
    onPointerDown: parts.includes(part) ? leftClick : undefined,
  });

  return (
    <div ref={field} className="paint-field" onPointerDown={() => setMenu(null)}>
      <Scene fill={fill} partProps={partProps} parts={parts} />

      {withTemplate && (
        <figure className="paint-template" aria-label="Vorlage">
          <Scene fill={(p) => (template[p] ? colorOf(template[p]!) : BLANK)} parts={parts} />
          <figcaption>Vorlage</figcaption>
        </figure>
      )}

      {menu && (
        <div
          className="ctx-menu paint-menu"
          role="menu"
          style={{ left: menu.x, top: menu.y }}
          onPointerDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {tier < 3 ? (
            <>
              <div className="paint-menu-title">Farbe für {PART_NAMES[menu.part]}</div>
              <div className="paint-swatches">
                {PALETTE.map((p) => (
                  <button key={p.id} type="button" className="paint-swatch" onClick={() => paint(menu.part, p.id)} role="menuitem">
                    <span style={{ background: p.c }} />
                    {p.name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="paint-menu-row">
              <div className="paint-menu-col">
                <button
                  type="button"
                  className={menu.sub ? 'ctx-item is-open' : 'ctx-item'}
                  role="menuitem"
                  aria-haspopup="menu"
                  onPointerEnter={() => setMenu({ ...menu, sub: true })}
                  onClick={() => setMenu({ ...menu, sub: true })}
                >
                  <span className="paint-dot" style={{ background: 'conic-gradient(#ff4d5e, #ffd23f, #3cc46b, #3aa3ff, #9b7bff, #ff4d5e)' }} />
                  Farbe
                  <Icon name="next" size={18} className="ctx-arrow" />
                </button>
                <button type="button" className="ctx-item" role="menuitem" onClick={() => paint(menu.part, null)} onPointerEnter={() => setMenu({ ...menu, sub: false })}>
                  <span className="paint-dot" style={{ background: BLANK }} />
                  Weiß machen
                </button>
                <button type="button" className="ctx-item" role="menuitem" onClick={() => setMenu(null)} onPointerEnter={() => setMenu({ ...menu, sub: false })}>
                  <Icon name="close" size={22} />
                  Abbrechen
                </button>
              </div>
              {menu.sub && (
                <div className="paint-menu-col paint-submenu" role="menu">
                  {PALETTE.map((p) => (
                    <button key={p.id} type="button" className="ctx-item" role="menuitem" onClick={() => paint(menu.part, p.id)}>
                      <span className="paint-dot" style={{ background: p.c }} />
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <LevelHint text={hint} />
    </div>
  );
}

interface SceneProps {
  fill: (part: PartId) => string;
  parts: PartId[];
  partProps?: (part: PartId) => SVGProps<SVGGElement>;
}

/** Ein Haus mit Garten zum Ausmalen. */
function Scene({ fill, parts, partProps }: SceneProps) {
  const has = (p: PartId) => parts.includes(p);
  const color = (p: PartId) => (has(p) ? fill(p) : FIXED[p]);
  const g = (part: PartId, children: ReactNode) => (
    <g {...(has(part) ? partProps?.(part) : undefined)} fill={color(part)}>
      {children}
    </g>
  );
  return (
    <svg className="paint-scene" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect width="800" height="500" fill="#d9f0ff" />
      <g fill="#fff">
        <ellipse cx="160" cy="90" rx="70" ry="28" />
        <ellipse cx="200" cy="72" rx="44" ry="30" />
        <ellipse cx="470" cy="70" rx="56" ry="22" />
      </g>
      <rect y="425" width="800" height="75" fill="#7ed37f" />
      <g stroke="#5d6380" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        {g(
          'sonne',
          <>
            <circle cx="680" cy="100" r="52" />
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i * Math.PI) / 4;
              return (
                <path
                  key={i}
                  d={`M${680 + Math.cos(a) * 66} ${100 + Math.sin(a) * 66}L${680 + Math.cos(a) * 92} ${100 + Math.sin(a) * 92}`}
                  strokeWidth="14"
                  stroke={color('sonne')}
                />
              );
            })}
          </>,
        )}
        {g('haus', <rect x="200" y="250" width="240" height="176" rx="6" />)}
        {g('dach', <path d="M176 254 320 138l144 116Z" />)}
        {g('tuer', <rect x="292" y="330" width="58" height="96" rx="8" />)}
        {g('fenster', <rect x="226" y="282" width="52" height="48" rx="6" />)}
        <rect x="364" y="282" width="52" height="48" rx="6" fill="#bfe3ff" />
        <rect x="594" y="330" width="30" height="96" rx="6" fill="#a8683a" />
        {g(
          'baum',
          <>
            <circle cx="609" cy="270" r="74" />
            <circle cx="560" cy="300" r="40" />
            <circle cx="660" cy="300" r="40" />
          </>,
        )}
        <path d="M110 426v-60" stroke="#3a9a4a" strokeWidth="8" fill="none" />
        {g(
          'blume',
          <>
            {Array.from({ length: 6 }, (_, i) => {
              const a = (i * Math.PI) / 3;
              return <circle key={i} cx={110 + Math.cos(a) * 26} cy={350 + Math.sin(a) * 26} r="18" />;
            })}
          </>,
        )}
        <circle cx="110" cy="350" r="14" fill="#ffd23f" />
      </g>
    </svg>
  );
}
