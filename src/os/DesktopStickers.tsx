import { useRef, useState, type PointerEvent, type RefObject } from 'react';
import type { Sticker } from '../core/profile';
import { Emoji } from './Emoji';

interface Props {
  stickers: Sticker[];
  areaRef: RefObject<HTMLDivElement | null>;
  onMove: (id: string, x: number, y: number) => void;
  /** Auf den Papierkorb gezogen */
  onRemove: (id: string) => void;
  onMenu: (id: string, x: number, y: number) => void;
}

interface Drag {
  id: string;
  pointerId: number;
  x: number;
  y: number;
}

function trashIcon(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.desk-icon[data-app="papierkorb"]');
}

function overTrash(clientX: number, clientY: number): boolean {
  const r = trashIcon()?.getBoundingClientRect();
  return !!r && clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
}

/** Sticker aus dem App-Laden. Man kann sie verschieben – und auf den Papierkorb ziehen, um sie loszuwerden. */
export function DesktopStickers({ stickers, areaRef, onMove, onRemove, onMenu }: Props) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const moved = useRef(false);

  const local = (e: PointerEvent) => {
    const r = areaRef.current?.getBoundingClientRect();
    return r ? { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height } : { x: 0, y: 0, w: 1, h: 1 };
  };

  return (
    <>
      {stickers.map((s) => {
        const dragging = drag?.id === s.id;
        return (
          <div
            key={s.id}
            className={dragging ? 'sticker is-dragging' : 'sticker'}
            style={dragging ? { left: drag.x, top: drag.y } : { left: `${s.x * 100}%`, top: `${s.y * 100}%` }}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (e.button !== 0) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              moved.current = false;
              const p = local(e);
              setDrag({ id: s.id, pointerId: e.pointerId, x: p.x, y: p.y });
            }}
            onPointerMove={(e) => {
              if (!drag || drag.pointerId !== e.pointerId || drag.id !== s.id) return;
              const p = local(e);
              moved.current = true;
              setDrag({ ...drag, x: p.x, y: p.y });
              trashIcon()?.classList.toggle('is-drop-target', overTrash(e.clientX, e.clientY));
            }}
            onPointerUp={(e) => {
              if (!drag || drag.id !== s.id) return;
              const p = local(e);
              trashIcon()?.classList.remove('is-drop-target');
              setDrag(null);
              if (!moved.current) return;
              if (overTrash(e.clientX, e.clientY)) onRemove(s.id);
              else onMove(s.id, Math.min(1, Math.max(0, p.x / p.w)), Math.min(1, Math.max(0, p.y / p.h)));
            }}
            onPointerCancel={() => setDrag(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMenu(s.id, e.clientX, e.clientY);
            }}
            role="img"
            aria-label="Sticker"
          >
            <Emoji name={s.emoji} size={92} />
          </div>
        );
      })}
    </>
  );
}
