import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { emojiUrl, type EmojiName } from '../../core/emoji';
import { useLatest } from '../../core/hooks';
import { drawShape, PaintEngine, PAPER_H, PAPER_W, type Pt, type ShapeKind } from './engine';
import { stampImage } from './images';
import { isShape, type ToolId } from './tools';

/** Was auf dem Blatt passiert ist – für Flinns Aufgaben und Hinweise. */
export type PaperEvent =
  | { kind: 'stroke'; color: string; eraser: boolean }
  | { kind: 'fill'; color: string; ok: boolean }
  | { kind: 'stamp' }
  | { kind: 'shape'; color: string }
  | { kind: 'pick'; color: string };

interface Props {
  tool: ToolId;
  color: string;
  size: number;
  stamp: EmojiName;
  stampSize: number;
  disabled?: boolean;
  onReady: (engine: PaintEngine) => void;
  onAction: (event: PaperEvent) => void;
}

type Drag =
  | { kind: 'stroke'; pointer: number; eraser: boolean; color: string }
  | { kind: 'stamp'; pointer: number }
  | { kind: 'shape'; pointer: number; shape: ShapeKind; from: Pt; to: Pt };

const ERASER = '#ffffff';

/** Das Zeichenblatt. Die Pixel gehören der PaintEngine; React kümmert sich nur um Zeiger und Vorschau. */
export function Paper(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const engine = useRef<PaintEngine | null>(null);
  const drag = useRef<Drag | null>(null);
  const latest = useLatest(props);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const e = new PaintEngine(c);
    engine.current = e;
    if (overlay.current) {
      overlay.current.width = PAPER_W;
      overlay.current.height = PAPER_H;
    }
    latest.current.onReady(e);
    return () => {
      engine.current = null;
    };
  }, [latest]);

  // Das Stempelbild schon laden, bevor jemand klickt.
  useEffect(() => {
    stampImage(props.stamp);
  }, [props.stamp]);

  const toPaper = (clientX: number, clientY: number): Pt => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * PAPER_W, y: ((clientY - r.top) / r.height) * PAPER_H };
  };

  /** Der Kreis zeigt, wie dick der Pinsel malt – oder wo der Stempel landet. */
  const showRing = (clientX: number, clientY: number) => {
    const el = ring.current;
    const c = canvas.current;
    if (!el || !c) return;
    const r = c.getBoundingClientRect();
    const p = latest.current;
    const big = p.tool === 'stempel' ? p.stampSize : p.tool === 'pinsel' || p.tool === 'radierer' ? p.size : 0;
    const d = Math.max(10, big * (r.width / PAPER_W));
    el.style.width = `${d}px`;
    el.style.height = `${d}px`;
    el.style.transform = `translate(${clientX - r.left - d / 2}px, ${clientY - r.top - d / 2}px)`;
    el.dataset.on = 'true';
  };

  const clearPreview = () => {
    const ctx = overlay.current?.getContext('2d');
    ctx?.clearRect(0, 0, PAPER_W, PAPER_H);
  };

  const finish = (pointer: number) => {
    const d = drag.current;
    const e = engine.current;
    if (!d || d.pointer !== pointer) return;
    drag.current = null;
    if (!e) return;
    const p = latest.current;
    if (d.kind === 'stroke') {
      e.endStroke();
      p.onAction({ kind: 'stroke', color: d.color, eraser: d.eraser });
    } else if (d.kind === 'stamp') {
      e.endStamp();
      p.onAction({ kind: 'stamp' });
    } else {
      clearPreview();
      if (Math.hypot(d.to.x - d.from.x, d.to.y - d.from.y) > 4) {
        e.shape(d.shape, d.from, d.to, p.color, p.size);
        p.onAction({ kind: 'shape', color: p.color });
      }
    }
  };

  const onDown = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const p = latest.current;
    const e = engine.current;
    if (!e || p.disabled || ev.button !== 0 || drag.current) return;
    ev.preventDefault();
    ev.currentTarget.setPointerCapture(ev.pointerId);
    showRing(ev.clientX, ev.clientY);
    const pt = toPaper(ev.clientX, ev.clientY);
    if (p.tool === 'pinsel' || p.tool === 'radierer') {
      const eraser = p.tool === 'radierer';
      const color = eraser ? ERASER : p.color;
      e.beginStroke(pt, color, p.size);
      drag.current = { kind: 'stroke', pointer: ev.pointerId, eraser, color };
    } else if (p.tool === 'stempel') {
      const img = stampImage(p.stamp);
      if (!img.complete || img.naturalWidth === 0) return;
      e.beginStamp(pt, img, p.stampSize);
      drag.current = { kind: 'stamp', pointer: ev.pointerId };
    } else if (p.tool === 'eimer') {
      p.onAction({ kind: 'fill', color: p.color, ok: e.fill(pt, p.color) });
    } else if (p.tool === 'pipette') {
      p.onAction({ kind: 'pick', color: e.pick(pt) });
    } else if (isShape(p.tool)) {
      drag.current = { kind: 'shape', pointer: ev.pointerId, shape: p.tool, from: pt, to: pt };
    }
  };

  const onMove = (ev: ReactPointerEvent<HTMLDivElement>) => {
    showRing(ev.clientX, ev.clientY);
    const d = drag.current;
    const e = engine.current;
    if (!d || !e || d.pointer !== ev.pointerId) return;
    // Zwischen zwei Bildern meldet der Browser oft mehrere Bewegungen – alle nehmen, dann werden Striche glatt.
    const native = ev.nativeEvent;
    const many = typeof native.getCoalescedEvents === 'function' ? native.getCoalescedEvents() : [];
    const points = (many.length > 0 ? many : [native]).map((m) => toPaper(m.clientX, m.clientY));
    if (d.kind === 'stroke') for (const pt of points) e.moveStroke(pt);
    else if (d.kind === 'stamp') for (const pt of points) e.moveStamp(pt);
    else {
      d.to = points[points.length - 1];
      const ctx = overlay.current?.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, PAPER_W, PAPER_H);
      drawShape(ctx, d.shape, d.from, d.to, latest.current.color, latest.current.size);
    }
  };

  const ringMode = props.tool === 'stempel' ? 'stamp' : props.tool === 'pinsel' || props.tool === 'radierer' ? 'brush' : 'dot';

  return (
    <div
      className={`paint-paper tool-${props.tool}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={(ev) => finish(ev.pointerId)}
      onPointerCancel={(ev) => finish(ev.pointerId)}
      onLostPointerCapture={(ev) => finish(ev.pointerId)}
      onPointerLeave={() => {
        if (ring.current) ring.current.dataset.on = '';
      }}
    >
      <canvas ref={canvas} className="paint-canvas" role="img" aria-label="Zeichenfläche" />
      <canvas ref={overlay} className="paint-overlay" aria-hidden="true" />
      <div ref={ring} className={`paint-ring is-${ringMode}`} aria-hidden="true">
        {ringMode === 'stamp' && <img src={emojiUrl(props.stamp)} alt="" draggable={false} />}
      </div>
    </div>
  );
}
