import { useLayoutEffect, useRef, useState } from 'react';
import type { EmojiName } from '../core/emoji';
import { Emoji } from './Emoji';

export interface MenuItem {
  label: string;
  icon?: EmojiName;
  onSelect: () => void;
}

/** Rechtsklick-Menü. Rückt selbst ins Bild, wenn es am Rand aufgehen würde. */
export function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: MenuItem[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      x: Math.max(8, Math.min(x, window.innerWidth - r.width - 8)),
      y: Math.max(8, Math.min(y, window.innerHeight - r.height - 8)),
    });
  }, [x, y]);

  return (
    <div
      ref={ref}
      className="ctx-menu"
      role="menu"
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          className="ctx-item"
          onClick={() => {
            onClose();
            item.onSelect();
          }}
        >
          {item.icon && <Emoji name={item.icon} size={28} />}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
