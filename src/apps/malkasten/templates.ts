import type { EmojiName } from '../../core/emoji';

/*
 * Ausmalbilder: Linienzeichnungen aus geschlossenen Flächen, damit der
 * Farbeimer sauber füllt. Gezeichnet in einem Raster von 1200 × 750 – die
 * Zeichenfläche skaliert sie hoch. Dieselben Pfade zeigt die Auswahl als SVG.
 */

export const TEMPLATE_W = 1200;
export const TEMPLATE_H = 750;

export interface Template {
  id: string;
  name: string;
  /** Vorschlag für den Dateinamen beim Speichern */
  fileName: string;
  icon: EmojiName;
  paths: string[];
}

const f = (n: number) => String(Math.round(n * 10) / 10);

const circle = (cx: number, cy: number, r: number) =>
  `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0z`;

/** Ellipse, um `deg` Grad gedreht */
const ellipse = (cx: number, cy: number, rx: number, ry: number, deg = 0) => {
  const t = (deg * Math.PI) / 180;
  const dx = rx * Math.cos(t);
  const dy = rx * Math.sin(t);
  const arc = `A${f(rx)} ${f(ry)} ${f(deg)} 1 0`;
  return `M${f(cx - dx)} ${f(cy - dy)}${arc} ${f(cx + dx)} ${f(cy + dy)}${arc} ${f(cx - dx)} ${f(cy - dy)}z`;
};

const rect = (x: number, y: number, w: number, h: number) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}z`;

const poly = (points: [number, number][]) => `M${points.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}z`;

const star = (cx: number, cy: number, outer: number, inner: number) =>
  poly(
    Array.from({ length: 10 }, (_, i): [number, number] => {
      const r = i % 2 ? inner : outer;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    }),
  );

const rays = (cx: number, cy: number, from: number, to: number, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i * 2 * Math.PI) / n;
    return `M${f(cx + from * Math.cos(a))} ${f(cy + from * Math.sin(a))}L${f(cx + to * Math.cos(a))} ${f(cy + to * Math.sin(a))}`;
  }).join('');

const petals = (cx: number, cy: number, dist: number, rx: number, ry: number, n: number, offset = 0) =>
  Array.from({ length: n }, (_, i) => {
    const deg = offset + (i * 360) / n;
    const t = (deg * Math.PI) / 180;
    return ellipse(cx + dist * Math.cos(t), cy + dist * Math.sin(t), rx, ry, deg);
  });

const daisy = (cx: number, cy: number) => [circle(cx, cy, 20), ...petals(cx, cy, 40, 19, 11, 8)];

export const TEMPLATES: Template[] = [
  {
    id: 'haus',
    name: 'Haus mit Garten',
    fileName: 'Mein Haus',
    icon: 'house-with-garden',
    paths: [
      'M0 612H1200',
      rect(330, 340, 400, 272),
      poly([[300, 340], [530, 160], [760, 340]]),
      'M620 230V175h50v95',
      'M490 612V470h80v142',
      circle(555, 545, 7),
      rect(370, 390, 90, 75),
      'M415 390v75M370 427.5h90',
      rect(600, 390, 90, 75),
      'M645 390v75M600 427.5h90',
      circle(530, 270, 32),
      'M498 270h64M530 238v64',
      circle(1040, 120, 58),
      rays(1040, 120, 80, 114, 10),
      'M170 200a36 36 0 0 1 34-52a52 52 0 0 1 96-12a40 40 0 0 1 58 40a28 28 0 0 1-8 24z',
      'M760 150a30 30 0 0 1 30-44a44 44 0 0 1 80-8a34 34 0 0 1 48 34a24 24 0 0 1-6 18z',
      circle(172, 420, 92),
      'M150 612V509M194 612V509',
      ...[850, 960, 1070].flatMap((x) => [`M${x} 612V599`, circle(x, 555, 16), ...petals(x, 555, 30, 14, 10, 6, 30)]),
    ],
  },
  {
    id: 'fisch',
    name: 'Fisch im Meer',
    fileName: 'Mein Fisch',
    icon: 'tropical-fish',
    paths: [
      'M0 640C150 615 300 665 450 640S750 615 900 640S1100 660 1200 635',
      ellipse(560, 350, 250, 150),
      'M808 330L960 230L935 350L960 470L808 370',
      circle(410, 310, 34),
      circle(418, 312, 15),
      'M320 390q24 18 52 4',
      'M480 208c-50 80-50 204 0 284',
      'M600 202c-40 90-40 206 0 296',
      'M700 226c-34 80-34 168 0 248',
      'M470 210C520 120 620 110 690 222',
      'M540 500C560 570 610 590 640 492',
      circle(250, 200, 26),
      circle(205, 120, 18),
      circle(265, 70, 12),
      'M92 652C62 580 128 540 98 470C78 420 108 380 96 330C134 378 116 420 132 470C160 540 104 580 132 652z',
      'M1122 652C1092 590 1150 550 1124 490C1108 450 1132 410 1124 370C1158 410 1144 450 1158 490C1182 550 1134 590 1160 652z',
      ellipse(1010, 160, 62, 34),
      'M1068 148L1112 118L1112 202L1068 172',
      circle(985, 152, 8),
      star(320, 690, 44, 20),
    ],
  },
  {
    id: 'blumen',
    name: 'Blumenwiese',
    fileName: 'Meine Blumen',
    icon: 'tulip',
    paths: [
      'M0 600C200 575 400 615 600 598S1000 580 1200 602',
      circle(600, 250, 62),
      ...petals(600, 250, 124, 60, 34, 8),
      'M600 434C590 490 612 540 600 598',
      ellipse(548, 515, 52, 20, -25),
      ellipse(652, 490, 52, 20, 25),
      'M250 330C230 380 245 420 285 425C325 420 340 380 320 330L302 352L285 322L268 352z',
      'M285 425C280 480 292 540 285 598',
      ellipse(250, 510, 40, 14, -40),
      'M880 330C860 380 875 420 915 425C955 420 970 380 950 330L932 352L915 322L898 352z',
      'M915 425C920 480 908 540 915 590',
      ellipse(950, 505, 40, 14, 40),
      circle(1090, 110, 52),
      rays(1090, 110, 72, 102, 10),
      ellipse(170, 150, 8, 30),
      ellipse(138, 134, 30, 22, -20),
      ellipse(202, 134, 30, 22, 20),
      ellipse(144, 176, 22, 16, 20),
      ellipse(196, 176, 22, 16, -20),
      'M90 690l12-40 10 40M140 700l10-34 12 34M1040 690l12-40 10 40M1090 700l10-34 12 34',
    ],
  },
  {
    id: 'rakete',
    name: 'Rakete im Weltall',
    fileName: 'Meine Rakete',
    icon: 'rocket',
    paths: [
      'M600 90C690 170 700 300 685 470H515C500 300 510 170 600 90z',
      circle(600, 250, 46),
      circle(600, 250, 30),
      'M510 390H690',
      'M511 420L445 500L452 548L515 470',
      'M689 420L755 500L748 548L685 470',
      'M545 470v26h110v-26',
      'M558 496C560 560 590 600 600 640C610 600 640 560 642 496',
      'M582 496C584 540 596 565 600 590C604 565 616 540 618 496',
      circle(220, 230, 86),
      ellipse(220, 230, 150, 36, -14),
      'M1010 100a92 92 0 1 0 64 168a110 110 0 0 1-64-168z',
      star(940, 520, 42, 18),
      star(150, 560, 32, 14),
      star(820, 170, 26, 11),
      star(380, 650, 24, 10),
      star(1090, 640, 32, 14),
      star(330, 80, 20, 9),
    ],
  },
  {
    id: 'katze',
    name: 'Katze mit Wollknäuel',
    fileName: 'Meine Katze',
    icon: 'cat-face',
    paths: [
      'M0 640H1200',
      ellipse(640, 505, 210, 135),
      circle(450, 310, 135),
      'M333 243L322 118L404 183',
      'M496 183L578 118L567 243',
      ellipse(400, 290, 24, 32),
      ellipse(500, 290, 24, 32),
      ellipse(404, 296, 10, 18),
      ellipse(504, 296, 10, 18),
      poly([[438, 338], [462, 338], [450, 352]]),
      'M450 352q-18 24-42 12M450 352q18 24 42 12',
      'M392 360L300 345M392 374L298 382M508 360L600 345M508 374L602 382',
      'M843 540C935 500 955 380 885 330C871 320 855 336 863 350C910 395 901 470 850 500',
      ellipse(560, 632, 46, 20),
      ellipse(720, 632, 46, 20),
      circle(1010, 575, 65),
      'M955 540c40 10 80 50 95 90M960 600c30-30 80-40 110-20M985 520c10 40 0 90-30 110',
      'M1062 614C1100 650 1150 652 1190 640',
    ],
  },
  {
    id: 'schmetterling',
    name: 'Schmetterling',
    fileName: 'Mein Schmetterling',
    icon: 'butterfly',
    paths: [
      ellipse(600, 380, 22, 150),
      circle(600, 196, 34),
      'M588 164C570 110 545 90 520 82',
      circle(514, 80, 11),
      'M612 164C630 110 655 90 680 82',
      circle(686, 80, 11),
      'M581 300C470 110 270 110 250 230C235 330 400 380 578 360',
      'M619 300C730 110 930 110 950 230C965 330 800 380 622 360',
      'M578 400C440 390 330 450 360 540C390 620 520 590 582 470',
      'M622 400C760 390 870 450 840 540C810 620 680 590 618 470',
      'M581 300H619M578 350H622M578 400H622M580 450H620',
      circle(400, 225, 46),
      circle(800, 225, 46),
      circle(310, 290, 18),
      circle(890, 290, 18),
      circle(455, 500, 34),
      circle(745, 500, 34),
      'M0 700C200 680 400 715 600 700S1000 685 1200 705',
      ...daisy(150, 640),
      ...daisy(1050, 632),
    ],
  },
];

export function templateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
