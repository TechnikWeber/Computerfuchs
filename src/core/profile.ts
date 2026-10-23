import { AVATARS, type AvatarId, type WallpaperId } from './catalog';

/*
 * Ein Profil pro Kind. Alles bleibt im Browser; es gibt keinen Server.
 */

export type AgeGroup = 'klein' | 'mittel' | 'gross';

/**
 * Was der Desktop schon kann. Kleine Kinder starten mit einem stark
 * vereinfachten Computer und schalten echte Funktionen im Maustraining frei.
 */
export type Feature = 'doubleClick' | 'moveWindows' | 'rightClick' | 'windowControls';
export const FEATURES: readonly Feature[] = ['doubleClick', 'moveWindows', 'rightClick', 'windowControls'];

export type Stars = 0 | 1 | 2 | 3;
export type CursorSize = 'normal' | 'gross' | 'riesig';
export const CURSOR_SIZES: readonly CursorSize[] = ['normal', 'gross', 'riesig'];

export interface LevelRecord {
  stars: Stars;
  plays: number;
  last?: string;
}

export interface ProfileSettings {
  wallpaper: WallpaperId;
  sound: boolean;
  /** 0 bis 1 */
  volume: number;
  /** Der Fuchs liest Anleitungen vor. */
  voice: boolean;
  cursor: CursorSize;
  /** Wie viel Zeit zwischen zwei Klicks für einen Doppelklick bleibt. */
  doubleClickMs: number;
}

export interface Profile {
  id: string;
  name: string;
  avatar: AvatarId;
  age: number;
  createdAt: string;
  /** Kontostand – später im App-Laden ausgegeben. */
  bytes: number;
  /** Alles jemals Verdiente; bestimmt den Rang und sinkt nie. */
  bytesEarned: number;
  /** progress[appId][levelId] */
  progress: Record<string, Record<string, LevelRecord>>;
  features: Feature[];
  settings: ProfileSettings;
  /** Schon gezeigte Hinweise, z. B. die Begrüßung. */
  seen: string[];
}

export const MIN_AGE = 3;
export const MAX_AGE = 18;
export const MAX_NAME = 16;

export function ageGroup(age: number): AgeGroup {
  if (age <= 6) return 'klein';
  if (age <= 9) return 'mittel';
  return 'gross';
}

export function defaultFeatures(age: number): Feature[] {
  switch (ageGroup(age)) {
    case 'klein':
      return [];
    case 'mittel':
      return ['doubleClick', 'moveWindows'];
    case 'gross':
      return [...FEATURES];
  }
}

export function defaultDoubleClickMs(age: number): number {
  switch (ageGroup(age)) {
    case 'klein':
      return 900;
    case 'mittel':
      return 650;
    case 'gross':
      return 500;
  }
}

export function defaultSettings(age: number): ProfileSettings {
  return {
    wallpaper: 'wiese',
    sound: true,
    volume: 0.7,
    voice: age <= 9,
    cursor: age <= 6 ? 'gross' : 'normal',
    doubleClickMs: defaultDoubleClickMs(age),
  };
}

export function clampAge(age: number): number {
  if (!Number.isFinite(age)) return 7;
  return Math.min(MAX_AGE, Math.max(MIN_AGE, Math.round(age)));
}

export function cleanName(name: string, avatar: AvatarId): string {
  const trimmed = name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
  if (trimmed) return trimmed;
  return AVATARS.find((a) => a.id === avatar)?.name ?? 'Kind';
}

export function createProfile(input: { name: string; avatar: AvatarId; age: number }, id: string, now: string): Profile {
  const age = clampAge(input.age);
  return {
    id,
    name: cleanName(input.name, input.avatar),
    avatar: input.avatar,
    age,
    createdAt: now,
    bytes: 0,
    bytesEarned: 0,
    progress: {},
    features: defaultFeatures(age),
    settings: defaultSettings(age),
    seen: [],
  };
}

export function hasFeature(profile: Profile, feature: Feature): boolean {
  return profile.features.includes(feature);
}

// ---------------------------------------------------------------------------
// Ränge
// ---------------------------------------------------------------------------

export interface Rank {
  min: number;
  name: string;
}

export const RANKS: readonly Rank[] = [
  { min: 0, name: 'Fuchswelpe' },
  { min: 150, name: 'Jungfuchs' },
  { min: 500, name: 'Schlaufuchs' },
  { min: 1000, name: 'Computerfuchs' },
  { min: 2500, name: 'Meisterfuchs' },
];

export function rankFor(bytesEarned: number): Rank {
  let rank = RANKS[0];
  for (const r of RANKS) if (bytesEarned >= r.min) rank = r;
  return rank;
}

export function nextRank(bytesEarned: number): Rank | null {
  return RANKS.find((r) => r.min > bytesEarned) ?? null;
}

// ---------------------------------------------------------------------------
// Belohnung
// ---------------------------------------------------------------------------

/** Bytes für den ersten, zweiten und dritten Stern eines Levels. */
export const STAR_REWARD = [0, 16, 32, 64] as const;
/** Wer ein Level ohne neuen Stern wiederholt, bekommt trotzdem eine Kleinigkeit. */
export const REPLAY_REWARD = 4;

export function rewardFor(previous: Stars, earned: Stars): number {
  if (earned <= previous) return REPLAY_REWARD;
  let sum = 0;
  for (let s = previous + 1; s <= earned; s++) sum += STAR_REWARD[s];
  return sum;
}

export interface LevelOutcome {
  bytes: number;
  stars: Stars;
  best: Stars;
  improved: boolean;
  rankBefore: Rank;
  rankAfter: Rank;
  rankUp: boolean;
}

export function levelRecord(profile: Profile, appId: string, levelId: string): LevelRecord {
  return profile.progress[appId]?.[levelId] ?? { stars: 0, plays: 0 };
}

export function applyLevelResult(
  profile: Profile,
  appId: string,
  levelId: string,
  stars: Stars,
  now: string,
): { profile: Profile; outcome: LevelOutcome } {
  const appProgress = profile.progress[appId] ?? {};
  const previous = levelRecord(profile, appId, levelId);
  const best = Math.max(previous.stars, stars) as Stars;
  const bytes = rewardFor(previous.stars, stars);
  const bytesEarned = profile.bytesEarned + bytes;
  const rankBefore = rankFor(profile.bytesEarned);
  const rankAfter = rankFor(bytesEarned);

  return {
    profile: {
      ...profile,
      bytes: profile.bytes + bytes,
      bytesEarned,
      progress: {
        ...profile.progress,
        [appId]: { ...appProgress, [levelId]: { stars: best, plays: previous.plays + 1, last: now } },
      },
    },
    outcome: {
      bytes,
      stars,
      best,
      improved: stars > previous.stars,
      rankBefore,
      rankAfter,
      rankUp: rankAfter.min > rankBefore.min,
    },
  };
}

/**
 * Alter ändern – nur im Erwachsenen-Bereich, denn das Alter bestimmt, wie viel
 * der Desktop kann. Wer älter eingestellt wird, bekommt die passenden
 * Funktionen dazu; schon vorhandene bleiben (abschalten geht einzeln).
 */
export function withAge(profile: Profile, age: number): Profile {
  const next = clampAge(age);
  return { ...profile, age: next, features: [...new Set([...profile.features, ...defaultFeatures(next)])] };
}

export function withFeature(profile: Profile, feature: Feature): Profile {
  if (hasFeature(profile, feature)) return profile;
  return { ...profile, features: [...profile.features, feature] };
}

export function markSeen(profile: Profile, key: string): Profile {
  if (profile.seen.includes(key)) return profile;
  return { ...profile, seen: [...profile.seen, key] };
}
