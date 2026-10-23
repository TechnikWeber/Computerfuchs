import { useCallback, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { catmullRom, dist, headingAt, nearestIndex, resample, type Pt } from '../../core/geometry';
import { useElementSize, useTimeouts } from '../../core/hooks';
import { defaultRng, pick } from '../../core/random';
import { sfx } from '../../core/sound';
import { Emoji } from '../../os/Emoji';
import type { LevelProps, Tier } from '../shared/levelTypes';
import { LevelHint } from '../shared/LevelUi';
import { useHint } from '../shared/useHint';

/** Stützpunkte in Bruchteilen der Fläche. Pro Stufe mehrere Wege zur Auswahl. */
const ROUTES: Record<Tier, Pt[][]> = {
  1: [
    [{ x: 0.09, y: 0.72 }, { x: 0.32, y: 0.5 }, { x: 0.56, y: 0.64 }, { x: 0.78, y: 0.44 }, { x: 0.91, y: 0.36 }],
    [{ x: 0.09, y: 0.38 }, { x: 0.3, y: 0.58 }, { x: 0.55, y: 0.42 }, { x: 0.76, y: 0.62 }, { x: 0.91, y: 0.6 }],
  ],
  2: [
    [{ x: 0.07, y: 0.8 }, { x: 0.26, y: 0.78 }, { x: 0.37, y: 0.44 }, { x: 0.52, y: 0.26 }, { x: 0.67, y: 0.38 }, { x: 0.72, y: 0.72 }, { x: 0.92, y: 0.7 }],
    [{ x: 0.07, y: 0.3 }, { x: 0.24, y: 0.3 }, { x: 0.36, y: 0.7 }, { x: 0.54, y: 0.82 }, { x: 0.66, y: 0.5 }, { x: 0.78, y: 0.28 }, { x: 0.93, y: 0.42 }],
  ],
  3: [
    [{ x: 0.06, y: 0.84 }, { x: 0.18, y: 0.3 }, { x: 0.32, y: 0.8 }, { x: 0.46, y: 0.26 }, { x: 0.6, y: 0.78 }, { x: 0.74, y: 0.28 }, { x: 0.92, y: 0.6 }],
    [{ x: 0.06, y: 0.28 }, { x: 0.2, y: 0.82 }, { x: 0.34, y: 0.3 }, { x: 0.5, y: 0.84 }, { x: 0.64, y: 0.3 }, { x: 0.78, y: 0.8 }, { x: 0.93, y: 0.36 }],
  ],
};

const WIDTH: Record<Tier, number> = { 1: 100, 2: 72, 3: 52 };
const CHECKPOINTS = [0.25, 0.5, 0.75];
const SPACING = 4;

type Phase = 'wait' | 'go' | 'oops' | 'done';

/** Level 5: Genau führen. Die Biene folgt dem Zeiger nur auf dem Weg. */
export function Bienenweg({ tier, onDone }: LevelProps) {
  const field = useRef<HTMLDivElement>(null);
  const bee = useRef<HTMLDivElement>(null);
  const trail = useRef<SVGPolylineElement>(null);
  const { width, height } = useElementSize(field);
  const [route] = useState(() => pick(defaultRng, ROUTES[tier]));
  const [phase, setPhase] = useState<Phase>('wait');
  const [started, setStarted] = useState(false);
  const [reached, setReached] = useState(0);
  const progress = useRef(0);
  const later = useTimeouts();
  const [hint, showHint] = useHint(2400);
  const half = WIDTH[tier] / 2;

  const samples = useMemo(() => {
    if (width === 0 || height === 0) return [];
    const pad = { x: 0, y: 30 };
    const pts = route.map((p) => ({ x: p.x * width, y: pad.y + p.y * (height - pad.y) }));
    return resample(catmullRom(pts, 20), SPACING);
  }, [route, width, height]);

  const all = useMemo(() => samples.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '), [samples]);
  const cpIndex = (f: number) => Math.round(f * (samples.length - 1));

  // Biene und Spur direkt am Element setzen – das bleibt bei jeder Mausbewegung flüssig.
  const place = useCallback(
    (idx: number) => {
      const p = samples[idx];
      if (!p) return;
      if (bee.current) bee.current.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${headingAt(samples, idx)}deg)`;
      trail.current?.setAttribute('points', samples.slice(0, idx + 1).map((s) => `${s.x.toFixed(1)},${s.y.toFixed(1)}`).join(' '));
    },
    [samples],
  );

  // Wird das Fenster größer oder kleiner, wandert die Biene an dieselbe Stelle des neuen Wegs.
  const prevLength = useRef(0);
  useLayoutEffect(() => {
    const oldLen = prevLength.current;
    if (oldLen > 1 && samples.length > 1) {
      progress.current = Math.round((progress.current / (oldLen - 1)) * (samples.length - 1));
    }
    prevLength.current = samples.length;
    place(progress.current);
  }, [samples, place]);

  const oops = () => {
    setPhase('oops');
    sfx.boing();
    showHint('Ups! Vom Weg abgekommen. Fahr wieder auf die Biene.');
    // Zurück zur letzten erreichten Blume.
    const back = reached > 0 ? cpIndex(CHECKPOINTS[reached - 1]) : 0;
    progress.current = Math.min(progress.current, back);
    bee.current?.classList.add('is-returning');
    place(progress.current);
    later(() => {
      bee.current?.classList.remove('is-returning');
      setPhase('wait');
    }, 650);
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (samples.length === 0 || phase === 'oops' || phase === 'done') return;
    const r = e.currentTarget.getBoundingClientRect();
    const p = { x: e.clientX - r.left, y: e.clientY - r.top };
    const here = progress.current;

    if (phase === 'wait') {
      if (dist(p, samples[here]) < Math.max(44, half)) {
        sfx.tap();
        setPhase('go');
        setStarted(true);
      }
      return;
    }

    const near = nearestIndex(samples, p, here - 25, here + 45);
    if (near.dist > half + 8) {
      oops();
      return;
    }
    if (near.index <= here) return;
    progress.current = near.index;
    place(near.index);

    const frac = near.index / (samples.length - 1);
    const passed = CHECKPOINTS.filter((c) => frac >= c).length;
    if (passed > reached) {
      setReached(passed);
      sfx.found();
    }
    if (near.index >= samples.length - 5) {
      setPhase('done');
      sfx.success();
      later(onDone, 1100);
    }
  };

  const start = samples[0];
  const end = samples[samples.length - 1];

  return (
    <div
      ref={field}
      className={`path-field is-${phase}`}
      onPointerMove={onMove}
      onPointerLeave={() => {
        if (phase === 'go') oops();
      }}
    >
      {samples.length > 0 && (
        <svg className="path-svg" width={width} height={height} aria-hidden="true">
          <polyline points={all} className="path-edge" strokeWidth={WIDTH[tier] + 14} />
          <polyline points={all} className="path-road" strokeWidth={WIDTH[tier]} />
          <polyline points={all} className="path-dash" />
          <polyline ref={trail} points={`${start.x},${start.y}`} className="path-trail" strokeWidth={WIDTH[tier] * 0.42} />
        </svg>
      )}
      {samples.length > 0 &&
        CHECKPOINTS.map((c, i) => {
          const p = samples[cpIndex(c)];
          return (
            <span key={c} className={i < reached ? 'path-cp is-reached' : 'path-cp'} style={{ left: p.x, top: p.y }}>
              <Emoji name={i < reached ? 'blossom' : 'seedling'} size={34} />
            </span>
          );
        })}
      {end && (
        <span className="path-goal" style={{ left: end.x, top: end.y }}>
          <Emoji name="sunflower" size={96} />
        </span>
      )}
      {start && (
        <div ref={bee} className="path-bee">
          <span className={phase === 'wait' ? 'path-bee-inner is-waiting' : 'path-bee-inner'}>
            <Emoji name="honeybee" size={64} />
          </span>
        </div>
      )}
      {!started && <div className="path-start-hint">Fahr auf die Biene!</div>}
      <LevelHint text={hint} />
    </div>
  );
}
