import { floodFill, hexToRgba, rgbaToHex, type Rect } from './fill';
import { clampRect, cropPixels, rectAround, trimToBudget, unionRect } from './history';
import { TEMPLATE_W } from './templates';

/*
 * Die Zeichenfläche: ein Canvas mit fester Größe (16:10), das die Oberfläche
 * passend verkleinert. Jede Aktion – ein Strich, eine Füllung, ein Stempel –
 * merkt sich vorher den Ausschnitt, den sie verändert. Daraus werden
 * Rückgängig und Wiederholen.
 */

export const PAPER_W = 1440;
export const PAPER_H = 900;
const PAPER = '#ffffff';
const INK = '#23263b';
/** So viel Speicher dürfen die Rückgängig-Schritte zusammen brauchen. */
const HISTORY_BYTES = 64 * 1024 * 1024;

export interface Pt {
  x: number;
  y: number;
}

export type ShapeKind = 'linie' | 'rechteck' | 'kreis';
/** edit: gemalt · history: rückgängig/wiederholt · reset: neues Blatt oder geöffnetes Bild */
export type ChangeKind = 'edit' | 'history' | 'reset';

interface Patch {
  x: number;
  y: number;
  before: ImageData;
  after: ImageData | null;
  bytes: number;
}

/** Eine Form zeichnen – auf die Fläche oder als Vorschau auf eine zweite Ebene. */
export function drawShape(ctx: CanvasRenderingContext2D, kind: ShapeKind, a: Pt, b: Pt, color: string, size: number): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (kind === 'linie') {
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  } else if (kind === 'rechteck') {
    ctx.rect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
  } else {
    const rx = Math.abs(b.x - a.x) / 2;
    const ry = Math.abs(b.y - a.y) / 2;
    ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
  }
  ctx.stroke();
  ctx.restore();
}

export class PaintEngine {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private undos: Patch[] = [];
  private redos: Patch[] = [];
  private snapshot: ImageData | null = null;
  private dirty: Rect | null = null;
  private last: Pt | null = null;
  private brush = { color: INK, size: 16 };
  private stamping: { img: CanvasImageSource; size: number; last: Pt } | null = null;
  onChange: ((kind: ChangeKind) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.width = PAPER_W;
    canvas.height = PAPER_H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Dieser Browser kann nicht malen (kein Canvas).');
    this.ctx = ctx;
    this.paintPaper();
  }

  get canUndo(): boolean {
    return this.undos.length > 0;
  }

  get canRedo(): boolean {
    return this.redos.length > 0;
  }

  /** Läuft gerade ein Strich oder Stempel? */
  get busy(): boolean {
    return this.snapshot !== null;
  }

  private paintPaper(): void {
    const { ctx } = this;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, PAPER_W, PAPER_H);
    ctx.restore();
  }

  private start(): void {
    this.snapshot = this.ctx.getImageData(0, 0, PAPER_W, PAPER_H);
    this.dirty = null;
  }

  private touch(r: Rect): void {
    this.dirty = unionRect(this.dirty, r);
  }

  private commit(): void {
    const snap = this.snapshot;
    const r = this.dirty && clampRect(this.dirty, PAPER_W, PAPER_H);
    this.snapshot = null;
    this.dirty = null;
    if (!snap || !r) return;
    const crop = cropPixels(snap, r);
    const before = new ImageData(crop.data, crop.width, crop.height);
    this.undos = trimToBudget([...this.undos, { x: r.x, y: r.y, before, after: null, bytes: before.data.length }], HISTORY_BYTES);
    this.redos = [];
    this.onChange?.('edit');
  }

  // --- Pinsel und Radierer -------------------------------------------------

  beginStroke(p: Pt, color: string, size: number): void {
    this.start();
    this.brush = { color, size };
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    this.touch(rectAround(p.x, p.y, p.x, p.y, size / 2 + 2));
    this.last = p;
  }

  moveStroke(p: Pt): void {
    const from = this.last;
    if (!from) return;
    const { ctx, brush } = this;
    ctx.strokeStyle = brush.color;
    ctx.lineWidth = brush.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    this.touch(rectAround(from.x, from.y, p.x, p.y, brush.size / 2 + 2));
    this.last = p;
  }

  endStroke(): void {
    if (!this.last) return;
    this.last = null;
    this.commit();
  }

  // --- Stempel ---------------------------------------------------------------

  private stampAt(p: Pt, img: CanvasImageSource, size: number): void {
    this.ctx.drawImage(img, p.x - size / 2, p.y - size / 2, size, size);
    this.touch(rectAround(p.x, p.y, p.x, p.y, size / 2 + 1));
  }

  beginStamp(p: Pt, img: CanvasImageSource, size: number): void {
    this.start();
    this.stamping = { img, size, last: p };
    this.stampAt(p, img, size);
  }

  /** Wer mit gedrückter Taste zieht, stempelt eine Spur. */
  moveStamp(p: Pt): void {
    const s = this.stamping;
    if (!s) return;
    if (Math.hypot(p.x - s.last.x, p.y - s.last.y) < s.size * 0.85) return;
    s.last = p;
    this.stampAt(p, s.img, s.size);
  }

  endStamp(): void {
    if (!this.stamping) return;
    this.stamping = null;
    this.commit();
  }

  // --- Formen und Farbeimer -------------------------------------------------

  shape(kind: ShapeKind, a: Pt, b: Pt, color: string, size: number): void {
    this.start();
    drawShape(this.ctx, kind, a, b, color, size);
    this.touch(rectAround(a.x, a.y, b.x, b.y, size / 2 + 2));
    this.commit();
  }

  /** Füllt die Fläche unter p. false, wenn es nichts zu füllen gab. */
  fill(p: Pt, color: string): boolean {
    this.start();
    const snap = this.snapshot!;
    const work = new ImageData(new Uint8ClampedArray(snap.data), PAPER_W, PAPER_H);
    const r = floodFill(work, p.x, p.y, hexToRgba(color));
    if (!r) {
      this.snapshot = null;
      return false;
    }
    this.ctx.putImageData(work, 0, 0, r.x, r.y, r.w, r.h);
    this.touch(r);
    this.commit();
    return true;
  }

  /** Pipette: Farbe an einer Stelle */
  pick(p: Pt): string {
    const x = Math.min(PAPER_W - 1, Math.max(0, Math.floor(p.x)));
    const y = Math.min(PAPER_H - 1, Math.max(0, Math.floor(p.y)));
    const d = this.ctx.getImageData(x, y, 1, 1).data;
    return rgbaToHex([d[0], d[1], d[2], 255]);
  }

  // --- Ganze Seite ---------------------------------------------------------

  /** Neues Blatt – leer, mit einem Ausmalbild oder mit einem geöffneten Bild. Rückgängig fängt neu an. */
  reset(content?: { image?: CanvasImageSource & { width: number; height: number }; paths?: string[] }): void {
    this.undos = [];
    this.redos = [];
    this.snapshot = null;
    this.dirty = null;
    this.last = null;
    this.stamping = null;
    this.paintPaper();
    if (content?.image) this.drawContained(content.image);
    if (content?.paths) this.drawPaths(content.paths);
    this.onChange?.('reset');
  }

  private drawContained(img: CanvasImageSource & { width: number; height: number }): void {
    const scale = Math.min(PAPER_W / img.width, PAPER_H / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    this.ctx.drawImage(img, (PAPER_W - w) / 2, (PAPER_H - h) / 2, w, h);
  }

  private drawPaths(paths: string[]): void {
    const { ctx } = this;
    const scale = PAPER_W / TEMPLATE_W;
    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 9 / scale;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (const d of paths) ctx.stroke(new Path2D(d));
    ctx.restore();
  }

  undo(): boolean {
    const p = this.undos.pop();
    if (!p) return false;
    const after = this.ctx.getImageData(p.x, p.y, p.before.width, p.before.height);
    this.ctx.putImageData(p.before, p.x, p.y);
    this.redos.push({ ...p, after });
    this.onChange?.('history');
    return true;
  }

  redo(): boolean {
    const p = this.redos.pop();
    if (!p?.after) return false;
    const before = this.ctx.getImageData(p.x, p.y, p.after.width, p.after.height);
    this.ctx.putImageData(p.after, p.x, p.y);
    this.undos.push({ x: p.x, y: p.y, before, after: null, bytes: before.data.length });
    this.onChange?.('history');
    return true;
  }

  toBlob(): Promise<Blob | null> {
    return new Promise((resolve) => {
      try {
        this.canvas.toBlob((b) => resolve(b), 'image/png');
      } catch {
        resolve(null);
      }
    });
  }
}
