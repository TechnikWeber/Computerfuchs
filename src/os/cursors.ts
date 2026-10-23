import type { CursorSkinId } from '../core/files';
import type { CursorSize } from '../core/profile';

/*
 * Mauszeiger als SVG: in drei Größen und mehreren Farben. Über klickbaren
 * Dingen wird der Zeiger heller – so sehen Kinder, wo etwas passiert.
 */

export interface CursorSkin {
  id: CursorSkinId;
  name: string;
  /** Füllung und Füllung über Klickbarem; zwei Farben ergeben einen Verlauf */
  fill: [string, string?];
  hover: [string, string?];
}

export const CURSOR_SKINS: CursorSkin[] = [
  { id: 'standard', name: 'Weiß', fill: ['#ffffff'], hover: ['#ffb347'] },
  { id: 'orange', name: 'Fuchs-Orange', fill: ['#ff8a3d', '#ffb366'], hover: ['#ffc533', '#ffe38a'] },
  { id: 'regenbogen', name: 'Regenbogen', fill: ['#ff4d5e', '#2f9bff'], hover: ['#ffc533', '#2fbf62'] },
  { id: 'lila', name: 'Galaxie-Lila', fill: ['#7b5cff', '#c79bff'], hover: ['#ff8fc8', '#ffd0ea'] },
  { id: 'gruen', name: 'Dino-Grün', fill: ['#2fbf62', '#8be38f'], hover: ['#b6f25a', '#e6ff9e'] },
];

const SIZES: Record<CursorSize, { px: number; hot: [number, number]; stroke: number }> = {
  normal: { px: 32, hot: [3, 2], stroke: 2 },
  gross: { px: 48, hot: [4, 3], stroke: 1.8 },
  riesig: { px: 72, hot: [6, 5], stroke: 1.6 },
};

const ARROW = 'M3 2.5v21.5l5.6-5.3 3.9 9.2 4.1-1.7-3.9-9h8z';

function svgUrl(px: number, stroke: number, [a, b]: [string, string?]): string {
  const fill = b ? 'url(#g)' : a;
  const defs = b
    ? `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`
    : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 32 32">${defs}<path d="${ARROW}" fill="${fill}" stroke="#23263b" stroke-width="${stroke}" stroke-linejoin="round"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** CSS für den Desktop. Leer bei normaler Größe und weißem Zeiger – dann bleibt der des Systems. */
export function cursorCss(size: CursorSize, skinId: CursorSkinId, scope = '.desktop'): string {
  if (size === 'normal' && skinId === 'standard') return '';
  const skin = CURSOR_SKINS.find((s) => s.id === skinId) ?? CURSOR_SKINS[0];
  const s = SIZES[size];
  const hot = `${s.hot[0]} ${s.hot[1]}`;
  const base = `${svgUrl(s.px, s.stroke, skin.fill)} ${hot}, auto`;
  const hover = `${svgUrl(s.px, s.stroke, skin.hover)} ${hot}, pointer`;
  const clickable = `:is(button, a, label, [role='button'], .can-move .win-title)`;
  return [
    // Die Griffe zum Größerziehen behalten ihre Pfeile – die zeigen, in welche Richtung es geht.
    `${scope}, ${scope} *:not(.win-resize) { cursor: ${base} !important; }`,
    `${scope} ${clickable}, ${scope} ${clickable} * { cursor: ${hover} !important; }`,
    `${scope} input, ${scope} textarea { cursor: text !important; }`,
  ].join('\n');
}

/** Vorschau-Bild eines Zeigers, z. B. im App-Laden. */
export function cursorPreview(skinId: CursorSkinId, px = 48): string {
  const skin = CURSOR_SKINS.find((s) => s.id === skinId) ?? CURSOR_SKINS[0];
  return svgUrl(px, 1.8, skin.fill).slice(5, -2);
}
