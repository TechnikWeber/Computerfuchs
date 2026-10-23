import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { useLatest } from './hooks';
import { createProfile, type Profile } from './profile';
import { SaveContext, type NewProfileInput, type SaveApi } from './saveContext';
import { SAVE_KEY, loadSave, mergeSaves, newId, sanitizeSave, writeSaveText, type SaveData } from './storage';

type Action =
  | { type: 'add'; profile: Profile }
  | { type: 'update'; id: string; change: (p: Profile) => Profile }
  | { type: 'delete'; id: string }
  | { type: 'replace'; data: SaveData }
  | { type: 'last'; id: string };

function reducer(state: SaveData, action: Action): SaveData {
  switch (action.type) {
    case 'add':
      return { ...state, profiles: [...state.profiles, action.profile], lastProfileId: action.profile.id };
    case 'update': {
      let changed = false;
      const profiles = state.profiles.map((p) => {
        if (p.id !== action.id) return p;
        const next = action.change(p);
        if (next !== p) changed = true;
        return next;
      });
      return changed ? { ...state, profiles } : state;
    }
    case 'delete': {
      const profiles = state.profiles.filter((p) => p.id !== action.id);
      const next: SaveData = { ...state, profiles };
      if (next.lastProfileId === action.id) delete next.lastProfileId;
      return next;
    }
    case 'replace':
      return action.data;
    case 'last':
      return state.lastProfileId === action.id ? state : { ...state, lastProfileId: action.id };
  }
}

export function SaveProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadSave);
  const [data, dispatch] = useReducer(reducer, initial.data);
  const [persistOk, setPersistOk] = useState(initial.ok);
  const latest = useLatest(data);
  // Zuletzt geschriebener Text: verhindert, dass zwei offene Tabs sich gegenseitig endlos überschreiben.
  const lastWritten = useRef<string | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const text = JSON.stringify(data);
      if (text === lastWritten.current) return;
      lastWritten.current = text;
      setPersistOk(writeSaveText(text));
    }, 250);
    return () => window.clearTimeout(id);
  }, [data]);

  useEffect(() => {
    const flush = () => {
      const text = JSON.stringify(latest.current);
      if (text !== lastWritten.current) {
        lastWritten.current = text;
        writeSaveText(text);
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== SAVE_KEY || !e.newValue) return;
      try {
        const incoming = sanitizeSave(JSON.parse(e.newValue));
        if (!incoming) return;
        lastWritten.current = JSON.stringify(incoming);
        dispatch({ type: 'replace', data: incoming });
      } catch {
        // Kaputter Eintrag aus einem anderen Tab – ignorieren.
      }
    };
    window.addEventListener('pagehide', flush);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('storage', onStorage);
    };
  }, [latest]);

  const profile = useCallback((id: string) => data.profiles.find((p) => p.id === id), [data.profiles]);

  const createNew = useCallback((input: NewProfileInput) => {
    const p = createProfile(input, newId(), new Date().toISOString());
    dispatch({ type: 'add', profile: p });
    return p;
  }, []);

  const updateProfile = useCallback((id: string, change: (p: Profile) => Profile) => {
    dispatch({ type: 'update', id, change });
  }, []);

  const deleteProfile = useCallback((id: string) => dispatch({ type: 'delete', id }), []);

  const importSave = useCallback(
    (incoming: SaveData) => {
      const merged = mergeSaves(latest.current, incoming);
      dispatch({ type: 'replace', data: merged.data });
      return { added: merged.added, replaced: merged.replaced };
    },
    [latest],
  );

  const setLastProfile = useCallback((id: string) => dispatch({ type: 'last', id }), []);

  const api = useMemo<SaveApi>(
    () => ({ data, persistOk, profile, createProfile: createNew, updateProfile, deleteProfile, importSave, setLastProfile }),
    [data, persistOk, profile, createNew, updateProfile, deleteProfile, importSave, setLastProfile],
  );

  return <SaveContext.Provider value={api}>{children}</SaveContext.Provider>;
}
