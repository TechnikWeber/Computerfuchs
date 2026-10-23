import type { EmojiName } from './emoji';

export interface AvatarDef {
  id: string;
  emoji: EmojiName;
  name: string;
  /** Hintergrundfarbe hinter dem Tier. */
  bg: string;
}

export const AVATARS = [
  { id: 'fox', emoji: 'fox', name: 'Fuchs', bg: '#ffd9bf' },
  { id: 'cat', emoji: 'cat-face', name: 'Katze', bg: '#ffe9a8' },
  { id: 'dog', emoji: 'dog-face', name: 'Hund', bg: '#eedcc8' },
  { id: 'panda', emoji: 'panda', name: 'Panda', bg: '#dfe7f2' },
  { id: 'frog', emoji: 'frog', name: 'Frosch', bg: '#cdf3d5' },
  { id: 'owl', emoji: 'owl', name: 'Eule', bg: '#ecdcc8' },
  { id: 'rabbit', emoji: 'rabbit-face', name: 'Hase', bg: '#ffd9e8' },
  { id: 'unicorn', emoji: 'unicorn', name: 'Einhorn', bg: '#eadcff' },
  { id: 'lion', emoji: 'lion', name: 'Löwe', bg: '#ffe2a3' },
  { id: 'koala', emoji: 'koala', name: 'Koala', bg: '#dde3ea' },
  { id: 'trex', emoji: 't-rex', name: 'Dino', bg: '#d3f0c2' },
  { id: 'robot', emoji: 'robot', name: 'Roboter', bg: '#d6e9ff' },
  { id: 'tiger', emoji: 'tiger-face', name: 'Tiger', bg: '#ffdcb8' },
  { id: 'penguin', emoji: 'penguin', name: 'Pinguin', bg: '#d9ecf7' },
  { id: 'hamster', emoji: 'hamster', name: 'Hamster', bg: '#f8e1c8' },
  { id: 'monkey', emoji: 'monkey-face', name: 'Affe', bg: '#ecd6c0' },
] as const satisfies readonly AvatarDef[];

export type AvatarId = (typeof AVATARS)[number]['id'];

export function avatarById(id: string): AvatarDef {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}

export const WALLPAPERS = [
  { id: 'wiese', name: 'Sonnenwiese' },
  { id: 'nacht', name: 'Sternennacht' },
  { id: 'meer', name: 'Unterwasser' },
  { id: 'weltall', name: 'Weltall' },
  { id: 'berge', name: 'Abendrot' },
  { id: 'bonbon', name: 'Bonbon' },
] as const;

export type WallpaperId = (typeof WALLPAPERS)[number]['id'];
