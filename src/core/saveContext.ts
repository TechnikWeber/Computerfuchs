import { createContext, useContext } from 'react';
import type { AvatarId } from './catalog';
import type { Profile } from './profile';
import type { SaveData } from './storage';

export interface NewProfileInput {
  name: string;
  avatar: AvatarId;
  age: number;
}

export interface SaveApi {
  data: SaveData;
  /** false, wenn der Browser gerade nichts speichern kann. */
  persistOk: boolean;
  profile: (id: string) => Profile | undefined;
  createProfile: (input: NewProfileInput) => Profile;
  updateProfile: (id: string, change: (p: Profile) => Profile) => void;
  deleteProfile: (id: string) => void;
  importSave: (incoming: SaveData) => { added: number; replaced: number };
  setLastProfile: (id: string) => void;
}

export const SaveContext = createContext<SaveApi | null>(null);

export function useSave(): SaveApi {
  const ctx = useContext(SaveContext);
  if (!ctx) throw new Error('useSave muss innerhalb von <SaveProvider> verwendet werden.');
  return ctx;
}
