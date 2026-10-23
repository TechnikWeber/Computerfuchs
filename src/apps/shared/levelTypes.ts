import type { EmojiName } from '../../core/emoji';

export type Tier = 1 | 2 | 3;

/** Was jedes Spiel-Level bekommt. */
export interface LevelProps {
  tier: Tier;
  onDone: () => void;
}

/** Ein Eintrag auf der Level-Karte. */
export interface MapLevel {
  id: string;
  title: string;
  /** Was man dabei lernt, z. B. „Doppelklick" */
  skill: string;
  icon: EmojiName;
  color: string;
}

/** Sterne aus richtigen Antworten beim ersten Versuch. */
export function starsForScore(correct: number, total: number): 1 | 2 | 3 {
  const ratio = total > 0 ? correct / total : 0;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  return 1;
}
