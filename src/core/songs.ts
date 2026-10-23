import type { SongId } from './files';

/*
 * Kinderlieder als Notenfolge – alle traditionell und gemeinfrei. Gespielt
 * werden sie mit Web Audio, es gibt also keine Tondateien.
 */

export interface Song {
  id: SongId;
  title: string;
  /** Schläge pro Minute */
  bpm: number;
  /** [Ton, Dauer in Schlägen] – Ton wie „C4“, „R“ für eine Pause */
  notes: [string, number][];
}

const n = (seq: string): [string, number][] =>
  seq
    .trim()
    .split(/\s+/)
    .map((token) => {
      const [tone, beats] = token.split(':');
      return [tone, beats ? Number(beats) : 1];
    });

export const SONGS: Record<SongId, Song> = {
  entchen: {
    id: 'entchen',
    title: 'Alle meine Entchen',
    bpm: 132,
    notes: n(`C4 D4 E4 F4 G4:2 G4:2  A4 A4 A4 A4 G4:4  A4 A4 A4 A4 G4:4  F4 F4 F4 F4 E4:2 E4:2  D4 D4 D4 D4 C4:4`),
  },
  haenschen: {
    id: 'haenschen',
    title: 'Hänschen klein',
    bpm: 132,
    notes: n(`
      G4 E4 E4:2  F4 D4 D4:2  C4 D4 E4 F4  G4 G4 G4:2
      G4 E4 E4:2  F4 D4 D4:2  C4 E4 G4 G4  C4:4
      D4 D4 D4 D4  D4 E4 F4:2  E4 E4 E4 E4  E4 F4 G4:2
      G4 E4 E4:2  F4 D4 D4:2  C4 E4 G4 G4  C4:4`),
  },
  jakob: {
    id: 'jakob',
    title: 'Bruder Jakob',
    bpm: 112,
    notes: n(`
      C4 D4 E4 C4  C4 D4 E4 C4  E4 F4 G4:2  E4 F4 G4:2
      G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4  G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4
      C4 G3 C4:2  C4 G3 C4:2`),
  },
  morgen: {
    id: 'morgen',
    title: 'Morgen kommt der Weihnachtsmann',
    bpm: 112,
    notes: n(`
      C4 C4 G4 G4 A4 A4 G4:2  F4 F4 E4 E4 D4 D4 C4:2
      G4 G4 F4 F4 E4 E4 D4:2  G4 G4 F4 F4 E4 E4 D4:2
      C4 C4 G4 G4 A4 A4 G4:2  F4 F4 E4 E4 D4 D4 C4:2`),
  },
  geburtstag: {
    id: 'geburtstag',
    title: 'Zum Geburtstag viel Glück',
    bpm: 100,
    notes: n(`
      G4:0.75 G4:0.25 A4 G4 C5 B4:2
      G4:0.75 G4:0.25 A4 G4 D5 C5:2
      G4:0.75 G4:0.25 G5 E5 C5 B4 A4:2
      F5:0.75 F5:0.25 E5 C5 D5 C5:2`),
  },
};

const STEPS: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };

/** Frequenz in Hertz; 0 für eine Pause. */
export function noteFrequency(tone: string): number {
  const m = /^([A-G])(#?)(\d)$/.exec(tone);
  if (!m) return 0;
  const semis = STEPS[m[1]] + (m[2] ? 1 : 0) + (Number(m[3]) - 4) * 12;
  return 440 * 2 ** (semis / 12);
}

export function songDuration(song: Song): number {
  return (song.notes.reduce((sum, [, beats]) => sum + beats, 0) * 60) / song.bpm;
}
