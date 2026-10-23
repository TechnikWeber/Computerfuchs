import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { useMeasured, useTimeouts } from '../../core/hooks';
import { sfx } from '../../core/sound';
import { speak } from '../../core/speech';
import { Emoji } from '../../os/Emoji';
import { Icon } from '../../os/Icon';
import type { LevelProps, Tier } from '../shared/levelTypes';
import { LevelHint } from '../shared/LevelUi';
import { useHint } from '../shared/useHint';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Mode = 'normal' | 'min' | 'max' | 'closed';
type Step = 'min' | 'restore' | 'max' | 'close';
type Control = 'min' | 'max' | 'close' | 'task';

const STEPS: Step[] = ['min', 'restore', 'max', 'close'];
const STEP_TEXT: Record<Step, string> = {
  min: 'Mach das Fenster klein: Klick auf den gelben Knopf mit dem Strich.',
  restore: 'Das Fenster wartet jetzt unten in der Leiste. Klick darauf, dann kommt es zurück!',
  max: 'Mach das Fenster ganz groß: Klick auf den grünen Knopf mit dem Viereck.',
  close: 'Und jetzt zumachen: Klick auf den roten Knopf mit dem Kreuz.',
};
const EXPECTED: Record<Step, Control> = { min: 'min', restore: 'task', max: 'max', close: 'close' };
const WHERE: Record<Control, string> = {
  min: 'den gelben Knopf',
  max: 'den grünen Knopf',
  close: 'den roten Knopf',
  task: 'das Fenster unten in der Leiste',
};
const BAR_H = 64;
const TOLERANCE = 30;
const MIN = { w: 200, h: 150 };

interface Drag {
  kind: 'move' | 'resize';
  sx: number;
  sy: number;
  start: Rect;
}

/** Start-Anordnung: Fenster links oben, Rahmen rechts unten (Stufe 2: größer). */
function initialLayout(tier: Tier, width: number, areaH: number): { win: Rect; target: Rect | null } {
  const w = Math.round(Math.min(380, Math.max(260, width * 0.36)));
  const h = Math.round(Math.min(280, Math.max(190, areaH * 0.42)));
  if (tier === 1) {
    return {
      win: { x: Math.round(width * 0.06), y: Math.round(areaH * 0.08), w, h },
      target: { x: Math.round(width - w - width * 0.07), y: Math.round(areaH - h - areaH * 0.08), w, h },
    };
  }
  if (tier === 2) {
    const tw = Math.round(Math.min(width * 0.62, w * 1.4));
    const th = Math.round(Math.min(areaH * 0.8, h * 1.35));
    return {
      win: { x: Math.round(width * 0.05), y: Math.round(areaH * 0.06), w, h },
      target: { x: Math.round(width - tw - width * 0.06), y: Math.round(areaH - th - areaH * 0.06), w: tw, h: th },
    };
  }
  return { win: { x: Math.round((width - w) / 2), y: Math.round((areaH - h) / 2), w, h }, target: null };
}

/** Level 8: Fenster bedienen – verschieben, Größe ändern und die drei Knöpfe. */
export function FensterProfi({ tier, onDone }: LevelProps) {
  const field = useRef<HTMLDivElement>(null);
  const {
    size: { width, height },
    layout: start,
  } = useMeasured(field, (s) => initialLayout(tier, s.width, Math.max(0, s.height - BAR_H)));
  const [moved, setMoved] = useState<Rect | null>(null);
  const [mode, setMode] = useState<Mode>('normal');
  const [step, setStep] = useState(0);
  const [snapped, setSnapped] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const drag = useRef<Drag | null>(null);
  const later = useTimeouts();
  const [hint, showHint] = useHint(2600);

  const areaH = Math.max(0, height - BAR_H);
  const win = moved ?? start?.win ?? null;
  const target = start?.target ?? null;

  useEffect(() => {
    if (tier === 3 && !done) speak(STEP_TEXT[STEPS[step]]);
  }, [tier, step, done]);

  const succeed = () => {
    if (done) return;
    setDone(true);
    sfx.success();
    later(onDone, 1100);
  };

  const begin = (kind: Drag['kind'], e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0 || !win || mode !== 'normal' || tier === 3 || done) return;
    if ((e.target as HTMLElement).closest('.win-controls')) return;
    if (kind === 'resize' && tier === 1) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { kind, sx: e.clientX, sy: e.clientY, start: win };
    setDragging(true);
  };

  const move = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (d.kind === 'move') {
      setMoved({
        ...d.start,
        x: Math.min(Math.max(d.start.x + dx, -d.start.w + 80), width - 80),
        y: Math.min(Math.max(d.start.y + dy, 0), areaH - 50),
      });
    } else {
      setMoved({
        ...d.start,
        w: Math.min(Math.max(MIN.w, d.start.w + dx), width - d.start.x),
        h: Math.min(Math.max(MIN.h, d.start.h + dy), areaH - d.start.y),
      });
    }
  };

  const end = () => {
    const wasDragging = drag.current !== null;
    drag.current = null;
    setDragging(false);
    if (!wasDragging || !win || !target) return;
    const near = (a: number, b: number) => Math.abs(a - b) <= TOLERANCE;
    const posOk = near(win.x, target.x) && near(win.y, target.y);
    const sizeOk = near(win.w, target.w) && near(win.h, target.h);
    if (posOk && (tier === 1 || sizeOk)) {
      setMoved(target);
      setSnapped(true);
      succeed();
    } else if (tier === 2 && posOk && !sizeOk) {
      showHint('Gut! Jetzt zieh die Ecke unten rechts, bis das Fenster den Rahmen füllt.');
    }
  };

  const press = (control: Control) => {
    if (done) return;
    if (tier < 3) {
      if (control !== 'task') showHint('Diese Knöpfe kommen gleich. Jetzt schieb das Fenster in den Rahmen!');
      return;
    }
    const expected = EXPECTED[STEPS[step]];
    if (control !== expected) {
      sfx.boing();
      showHint(`Fast! Such ${WHERE[expected]}.`);
      return;
    }
    sfx.tap();
    if (control === 'close') {
      setMode('closed');
      succeed();
      return;
    }
    setMode(control === 'min' ? 'min' : control === 'max' ? 'max' : 'normal');
    setStep((s) => s + 1);
  };

  const expected = tier === 3 && !done ? EXPECTED[STEPS[step]] : null;
  const rect = mode === 'max' ? { x: 0, y: 0, w: width, h: areaH } : win;
  const ctl = (c: Control, base: string) => (expected === c ? `${base} is-expected` : base);

  return (
    <div ref={field} className="winpro-field">
      <div className="winpro-desk" style={{ height: areaH }}>
        {target && (
          <div className={snapped ? 'winpro-target is-hit' : 'winpro-target'} style={{ left: target.x, top: target.y, width: target.w, height: target.h }}>
            {!snapped && <span>Hier hinein!</span>}
          </div>
        )}
        {rect && mode !== 'closed' && (
          <section
            className={`winpro-win is-${mode}${dragging ? ' is-dragging' : ''}`}
            style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
            aria-label="Übungsfenster"
          >
            <header
              className={tier < 3 ? 'win-title winpro-title can-drag' : 'win-title winpro-title'}
              onPointerDown={(e) => begin('move', e)}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={end}
            >
              <Emoji name="sunflower" size={30} />
              <h3 className="win-name">Mein Fenster</h3>
              <div className="win-controls">
                <button type="button" className={ctl('min', 'win-btn win-btn-min')} onClick={() => press('min')} aria-label="Verkleinern">
                  <Icon name="minimize" size={20} stroke={3.2} />
                </button>
                <button type="button" className={ctl('max', 'win-btn win-btn-max')} onClick={() => press('max')} aria-label="Vergrößern">
                  <Icon name={mode === 'max' ? 'restore' : 'maximize'} size={18} stroke={3} />
                </button>
                <button type="button" className={ctl('close', 'win-btn win-btn-close')} onClick={() => press('close')} aria-label="Schließen">
                  <Icon name="close" size={20} stroke={3.4} />
                </button>
              </div>
            </header>
            <div className="winpro-body">
              <Emoji name="rainbow" size={Math.min(96, rect.h * 0.4)} />
              <p>{tier === 3 ? 'Ich bin ein Fenster!' : 'Schieb mich in den Rahmen!'}</p>
            </div>
            {tier === 2 && mode === 'normal' && (
              <span
                className="winpro-grip"
                onPointerDown={(e) => begin('resize', e)}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                aria-label="Größe ändern"
              />
            )}
          </section>
        )}
      </div>
      <div className="winpro-bar" style={{ height: BAR_H }}>
        <span className="winpro-start">
          <Icon name="grid" size={26} />
        </span>
        {mode !== 'closed' && (
          <button
            type="button"
            className={ctl('task', mode !== 'min' ? 'task is-active' : 'task')}
            onClick={() => press('task')}
          >
            <Emoji name="sunflower" size={28} />
            <span>Mein Fenster</span>
          </button>
        )}
      </div>
      {tier === 3 && !done && <div className="winpro-step">{STEP_TEXT[STEPS[step]]}</div>}
      <LevelHint text={hint} />
    </div>
  );
}
