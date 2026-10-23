import { useMemo, useRef, type CSSProperties, type Dispatch, type PointerEvent, type ReactNode } from 'react';
import type { AppDef } from '../apps/registry';
import { sfx } from '../core/sound';
import { Emoji } from './Emoji';
import { Icon } from './Icon';
import { WindowContext, type AppParams, type WindowInfo } from './osContext';
import { MIN_H, MIN_W, clampRect, type Area, type Win, type WmAction } from './windows';

type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
const EDGES: Edge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Drag {
  kind: 'move' | Edge;
  startX: number;
  startY: number;
  rect: Rect;
  last: Rect | null;
}

interface Props {
  win: Win;
  app: AppDef;
  focused: boolean;
  /** Fenster lassen sich verschieben (freigeschaltet über das Maustraining). */
  canMove: boolean;
  /** Verkleinern, Vergrößern und Größe ziehen. */
  canControl: boolean;
  area: Area;
  params: AppParams & { nonce: number };
  dispatch: Dispatch<WmAction>;
  children: ReactNode;
}

export function WindowFrame({ win, app, focused, canMove, canControl, area, params, dispatch, children }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const maxed = win.mode === 'max';

  const close = () => {
    sfx.close();
    dispatch({ type: 'close', id: win.id });
  };

  const info = useMemo<WindowInfo>(
    () => ({
      id: win.id,
      appId: win.appId,
      focused,
      params,
      close: () => {
        sfx.close();
        dispatch({ type: 'close', id: win.id });
      },
    }),
    [win.id, win.appId, focused, params, dispatch],
  );

  const focus = () => {
    if (!focused) dispatch({ type: 'focus', id: win.id });
  };

  const begin = (e: PointerEvent<HTMLElement>, kind: Drag['kind']) => {
    if (e.button !== 0 || maxed) return;
    if (kind === 'move' && !canMove) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { kind, startX: e.clientX, startY: e.clientY, rect: { x: win.x, y: win.y, w: win.w, h: win.h }, last: null };
    frame.current?.classList.add(kind === 'move' ? 'is-moving' : 'is-resizing');
  };

  const move = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    const r = { ...d.rect };
    if (d.kind === 'move') {
      r.x += dx;
      r.y += dy;
    } else {
      if (d.kind.includes('e')) r.w = d.rect.w + dx;
      if (d.kind.includes('s')) r.h = d.rect.h + dy;
      if (d.kind.includes('w')) {
        r.w = Math.max(MIN_W, d.rect.w - dx);
        r.x = d.rect.x + d.rect.w - r.w;
      }
      if (d.kind.includes('n')) {
        r.h = Math.max(MIN_H, d.rect.h - dy);
        r.y = d.rect.y + d.rect.h - r.h;
      }
    }
    const c = clampRect(r, area);
    d.last = c;
    // Direkt am Element bewegen statt über React – das bleibt auch auf alten Laptops flüssig.
    const el = frame.current;
    if (el) {
      el.style.left = `${c.x}px`;
      el.style.top = `${c.y}px`;
      el.style.width = `${c.w}px`;
      el.style.height = `${c.h}px`;
    }
  };

  const end = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    frame.current?.classList.remove('is-moving', 'is-resizing');
    if (!d.last) return;
    if (d.kind === 'move') dispatch({ type: 'move', id: win.id, x: d.last.x, y: d.last.y, area });
    else dispatch({ type: 'resize', id: win.id, ...d.last, area });
  };

  const style: CSSProperties = maxed
    ? { zIndex: win.z }
    : { zIndex: win.z, left: win.x, top: win.y, width: win.w, height: win.h };

  const classes = ['win', `win-${win.mode}`, focused ? 'is-focused' : '', canMove && !maxed ? 'can-move' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <section
      ref={frame}
      className={classes}
      style={{ ...style, '--app': app.color, '--app-dark': app.colorDark } as CSSProperties}
      aria-label={app.name}
      aria-hidden={win.mode === 'min'}
      onPointerDownCapture={focus}
    >
      <header
        className="win-title"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('.win-controls')) return;
          begin(e, 'move');
        }}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onDoubleClick={(e) => {
          if (!canControl || (e.target as HTMLElement).closest('.win-controls')) return;
          dispatch({ type: 'toggleMax', id: win.id });
        }}
      >
        <Emoji name={app.icon} size={34} />
        <h2 className="win-name">{app.name}</h2>
        <div className="win-controls">
          {canControl && (
            <>
              <button
                type="button"
                className="win-btn win-btn-min"
                onClick={() => dispatch({ type: 'minimize', id: win.id })}
                aria-label="Verkleinern"
                title="Verkleinern"
              >
                <Icon name="minimize" size={22} stroke={3.2} />
              </button>
              <button
                type="button"
                className="win-btn win-btn-max"
                onClick={() => dispatch({ type: 'toggleMax', id: win.id })}
                aria-label={maxed ? 'Wiederherstellen' : 'Vergrößern'}
                title={maxed ? 'Wiederherstellen' : 'Vergrößern'}
              >
                <Icon name={maxed ? 'restore' : 'maximize'} size={20} stroke={3} />
              </button>
            </>
          )}
          <button type="button" className="win-btn win-btn-close" onClick={close} aria-label="Schließen" title="Schließen">
            <Icon name="close" size={22} stroke={3.4} />
          </button>
        </div>
      </header>
      <div className="win-body">
        <WindowContext.Provider value={info}>{children}</WindowContext.Provider>
      </div>
      {canControl &&
        !maxed &&
        EDGES.map((edge) => (
          <div
            key={edge}
            className={`win-resize win-resize-${edge}`}
            onPointerDown={(e) => begin(e, edge)}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
          />
        ))}
    </section>
  );
}
