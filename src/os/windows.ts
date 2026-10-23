/*
 * Fensterverwaltung als reine Funktion: leicht zu testen und unabhängig von React.
 */

export type WinMode = 'normal' | 'max' | 'min';

export interface Win {
  id: string;
  appId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  mode: WinMode;
  /** Wohin ein verkleinertes Fenster zurückkehrt. */
  restoreTo: 'normal' | 'max';
}

export interface WmState {
  wins: Win[];
  z: number;
  seq: number;
  focused: string | null;
}

export interface Area {
  w: number;
  h: number;
}

export const MIN_W = 320;
export const MIN_H = 220;
/** So viel vom Fenster bleibt immer sichtbar, damit man es zurückholen kann. */
const KEEP_VISIBLE = 120;
const TITLE_H = 56;

export const initialWm: WmState = { wins: [], z: 0, seq: 0, focused: null };

export type WmAction =
  | { type: 'open'; appId: string; w: number; h: number; area: Area; max: boolean }
  | { type: 'close'; id: string }
  | { type: 'focus'; id: string }
  | { type: 'minimize'; id: string }
  | { type: 'toggleMax'; id: string }
  | { type: 'restore'; id: string }
  | { type: 'move'; id: string; x: number; y: number; area: Area }
  | { type: 'resize'; id: string; x: number; y: number; w: number; h: number; area: Area }
  | { type: 'fit'; area: Area }
  | { type: 'closeAll' };

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), Math.max(min, max));
}

export function clampRect<T extends { x: number; y: number; w: number; h: number }>(r: T, area: Area): T {
  const w = clamp(r.w, MIN_W, area.w);
  const h = clamp(r.h, MIN_H, area.h);
  return {
    ...r,
    w,
    h,
    x: clamp(r.x, -(w - KEEP_VISIBLE), area.w - KEEP_VISIBLE),
    y: clamp(r.y, 0, area.h - TITLE_H),
  };
}

function topmost(wins: Win[], except?: string): string | null {
  let best: Win | null = null;
  for (const w of wins) {
    if (w.id === except || w.mode === 'min') continue;
    if (!best || w.z > best.z) best = w;
  }
  return best?.id ?? null;
}

function update(state: WmState, id: string, change: (w: Win) => Win): WmState {
  return { ...state, wins: state.wins.map((w) => (w.id === id ? change(w) : w)) };
}

function raise(state: WmState, id: string): WmState {
  const win = state.wins.find((w) => w.id === id);
  if (!win) return state;
  if (state.focused === id && win.z === state.z && win.mode !== 'min') return state;
  const z = state.z + 1;
  return { ...update(state, id, (w) => ({ ...w, z })), z, focused: id };
}

export function wmReducer(state: WmState, action: WmAction): WmState {
  switch (action.type) {
    case 'open': {
      // Jede App gibt es nur einmal – ein zweiter Klick holt das Fenster nach vorn.
      const existing = state.wins.find((w) => w.appId === action.appId);
      if (existing) {
        const restored =
          existing.mode === 'min' ? update(state, existing.id, (w) => ({ ...w, mode: w.restoreTo })) : state;
        return raise(restored, existing.id);
      }
      const seq = state.seq + 1;
      const z = state.z + 1;
      const w = Math.min(action.w, Math.max(MIN_W, action.area.w - 40));
      const h = Math.min(action.h, Math.max(MIN_H, action.area.h - 40));
      const offset = (state.wins.length % 5) * 32;
      const rect = clampRect(
        {
          x: Math.round((action.area.w - w) / 2) + offset,
          y: Math.max(12, Math.round((action.area.h - h) / 2) - 20) + offset,
          w,
          h,
        },
        action.area,
      );
      const win: Win = {
        id: `${action.appId}-${seq}`,
        appId: action.appId,
        ...rect,
        z,
        mode: action.max ? 'max' : 'normal',
        restoreTo: action.max ? 'max' : 'normal',
      };
      return { wins: [...state.wins, win], z, seq, focused: win.id };
    }
    case 'close': {
      const wins = state.wins.filter((w) => w.id !== action.id);
      if (wins.length === state.wins.length) return state;
      const focused = state.focused === action.id ? topmost(wins) : state.focused;
      return { ...state, wins, focused };
    }
    case 'focus':
      return raise(state, action.id);
    case 'minimize': {
      const win = state.wins.find((w) => w.id === action.id);
      if (!win || win.mode === 'min') return state;
      const next = update(state, action.id, (w) => ({ ...w, mode: 'min', restoreTo: w.mode === 'max' ? 'max' : 'normal' }));
      return { ...next, focused: state.focused === action.id ? topmost(next.wins, action.id) : state.focused };
    }
    case 'restore': {
      const win = state.wins.find((w) => w.id === action.id);
      if (!win) return state;
      const next = win.mode === 'min' ? update(state, action.id, (w) => ({ ...w, mode: w.restoreTo })) : state;
      return raise(next, action.id);
    }
    case 'toggleMax': {
      const win = state.wins.find((w) => w.id === action.id);
      if (!win) return state;
      const mode = win.mode === 'max' ? 'normal' : 'max';
      return raise(update(state, action.id, (w) => ({ ...w, mode, restoreTo: mode })), action.id);
    }
    case 'move':
      return update(state, action.id, (w) =>
        w.mode === 'normal' ? clampRect({ ...w, x: Math.round(action.x), y: Math.round(action.y) }, action.area) : w,
      );
    case 'resize':
      return update(state, action.id, (w) =>
        w.mode === 'normal'
          ? clampRect(
              { ...w, x: Math.round(action.x), y: Math.round(action.y), w: Math.round(action.w), h: Math.round(action.h) },
              action.area,
            )
          : w,
      );
    case 'fit':
      return { ...state, wins: state.wins.map((w) => clampRect(w, action.area)) };
    case 'closeAll':
      return { ...state, wins: [], focused: null };
  }
}
