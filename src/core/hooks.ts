import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

export interface Size {
  width: number;
  height: number;
}

/** Größe eines Elements, aktualisiert bei jeder Größenänderung (auch beim Fenster-Ziehen). */
export function useElementSize(ref: RefObject<HTMLElement | null>): Size {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize((s) => (s.width === r.width && s.height === r.height ? s : { width: r.width, height: r.height }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/** Immer der aktuelle Wert – für Rückrufe, die nicht neu erzeugt werden sollen. */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}

/** setInterval, das bei null pausiert. */
export function useInterval(callback: () => void, ms: number | null): void {
  const latest = useLatest(callback);
  useEffect(() => {
    if (ms === null) return;
    const id = window.setInterval(() => latest.current(), ms);
    return () => window.clearInterval(id);
  }, [ms, latest]);
}

/** Ein Zeitgeber, der beim Aufräumen sicher gestoppt wird. */
export function useTimeouts(): (fn: () => void, ms: number) => void {
  const ids = useRef<number[]>([]);
  useEffect(
    () => () => {
      ids.current.forEach((id) => window.clearTimeout(id));
      ids.current = [];
    },
    [],
  );
  return useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      ids.current = ids.current.filter((x) => x !== id);
      fn();
    }, ms);
    ids.current.push(id);
  }, []);
}

/**
 * Größe eines Elements plus eine Anordnung, die einmal berechnet wird, sobald
 * die Größe bekannt ist – etwa zufällig verteilte Tiere. Spätere Größen-
 * änderungen ändern nur die Größe, nicht die Anordnung.
 */
export function useMeasured<T>(ref: RefObject<HTMLElement | null>, make: (size: Size) => T): { size: Size; layout: T | null } {
  const [state, setState] = useState<{ size: Size; layout: T | null }>({ size: { width: 0, height: 0 }, layout: null });
  const makeLatest = useLatest(make);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setState((s) => {
        const same = s.size.width === r.width && s.size.height === r.height;
        const size = same ? s.size : { width: r.width, height: r.height };
        const layout = s.layout ?? (r.width > 0 && r.height > 0 ? makeLatest.current(size) : null);
        return same && layout === s.layout ? s : { size, layout };
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, makeLatest]);
  return state;
}

/** Aktuelle Uhrzeit, alle paar Sekunden neu. */
export function useNow(ms = 10_000): Date {
  const [now, setNow] = useState(() => new Date());
  useInterval(() => setNow(new Date()), ms);
  return now;
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Bildwiederholung für Spiele: ruft `tick(dt)` mit vergangenen Sekunden auf (höchstens 0,05 s am Stück). */
export function useFrame(tick: (dt: number) => void, active: boolean): void {
  const latest = useLatest(tick);
  const last = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return;
    let id = 0;
    last.current = null;
    const loop = (t: number) => {
      const dt = last.current === null ? 0 : Math.min(0.05, (t - last.current) / 1000);
      last.current = t;
      latest.current(dt);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [active, latest]);
}
