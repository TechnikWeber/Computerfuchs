import type { EmojiName } from './emoji';
import { addFile, type FileContent } from './files';
import type { Profile } from './profile';

/*
 * Der App-Laden: Hier geben Kinder ihre Bytes aus. Was sie holen, landet als
 * Datei im Ordner „Downloads“ – öffnen, verschieben und als Hintergrund
 * festlegen üben sie so ganz nebenbei.
 */

export type ShopKind = 'hintergrund' | 'zeiger' | 'sticker' | 'lied';

export interface ShopItem {
  id: string;
  kind: ShopKind;
  name: string;
  price: number;
  icon: EmojiName;
  /** Dateiname ohne Endung */
  fileName: string;
  content: FileContent;
  text: string;
}

export const SHOP_CATEGORIES: { id: ShopKind; name: string; icon: EmojiName }[] = [
  { id: 'hintergrund', name: 'Hintergründe', icon: 'rainbow' },
  { id: 'zeiger', name: 'Mauszeiger', icon: 'computer-mouse' },
  { id: 'sticker', name: 'Sticker', icon: 'sparkles' },
  { id: 'lied', name: 'Lieder', icon: 'musical-notes' },
];

const sticker = (id: string, name: string, emoji: EmojiName): ShopItem => ({
  id: `sticker-${id}`,
  kind: 'sticker',
  name,
  price: 30,
  icon: emoji,
  fileName: `Sticker ${name}`,
  content: { type: 'sticker', emoji },
  text: 'Kleb ihn auf deinen Desktop!',
});

export const SHOP: ShopItem[] = [
  {
    id: 'hg-regenbogen',
    kind: 'hintergrund',
    name: 'Regenbogenland',
    price: 120,
    icon: 'rainbow',
    fileName: 'Regenbogenland',
    content: { type: 'hintergrund', wallpaper: 'regenbogen' },
    text: 'Ein Regenbogen über bunten Hügeln.',
  },
  {
    id: 'hg-polarlicht',
    kind: 'hintergrund',
    name: 'Polarlicht',
    price: 150,
    icon: 'glowing-star',
    fileName: 'Polarlicht',
    content: { type: 'hintergrund', wallpaper: 'polarlicht' },
    text: 'Grüne Lichter am Nachthimmel – wie im hohen Norden.',
  },
  {
    id: 'hg-kirschbluete',
    kind: 'hintergrund',
    name: 'Kirschblüten',
    price: 150,
    icon: 'blossom',
    fileName: 'Kirschblüten',
    content: { type: 'hintergrund', wallpaper: 'kirschbluete' },
    text: 'Rosa Blüten, die langsam herabschweben.',
  },
  {
    id: 'hg-pixel',
    kind: 'hintergrund',
    name: 'Pixel-Welt',
    price: 200,
    icon: 'joystick',
    fileName: 'Pixel-Welt',
    content: { type: 'hintergrund', wallpaper: 'pixel' },
    text: 'Eine Welt aus lauter kleinen Quadraten – wie in alten Videospielen.',
  },
  {
    id: 'zeiger-orange',
    kind: 'zeiger',
    name: 'Fuchs-Orange',
    price: 60,
    icon: 'fox',
    fileName: 'Fuchs-Orange',
    content: { type: 'zeiger', cursor: 'orange' },
    text: 'Ein Mauszeiger in Flinns Farbe.',
  },
  {
    id: 'zeiger-regenbogen',
    kind: 'zeiger',
    name: 'Regenbogen',
    price: 100,
    icon: 'rainbow',
    fileName: 'Regenbogen-Zeiger',
    content: { type: 'zeiger', cursor: 'regenbogen' },
    text: 'Ein Mauszeiger in allen Farben.',
  },
  {
    id: 'zeiger-lila',
    kind: 'zeiger',
    name: 'Galaxie-Lila',
    price: 60,
    icon: 'ringed-planet',
    fileName: 'Galaxie-Zeiger',
    content: { type: 'zeiger', cursor: 'lila' },
    text: 'Lila wie das Weltall.',
  },
  {
    id: 'zeiger-gruen',
    kind: 'zeiger',
    name: 'Dino-Grün',
    price: 60,
    icon: 't-rex',
    fileName: 'Dino-Zeiger',
    content: { type: 'zeiger', cursor: 'gruen' },
    text: 'Grün wie ein kleiner Dino.',
  },
  sticker('einhorn', 'Einhorn', 'unicorn'),
  sticker('dino', 'Dino', 't-rex'),
  sticker('rakete', 'Rakete', 'rocket'),
  sticker('regenbogen', 'Regenbogen', 'rainbow'),
  sticker('krone', 'Krone', 'crown'),
  sticker('roboter', 'Roboter', 'robot'),
  sticker('schmetterling', 'Schmetterling', 'butterfly'),
  sticker('stern', 'Stern', 'glowing-star'),
  {
    id: 'lied-jakob',
    kind: 'lied',
    name: 'Bruder Jakob',
    price: 40,
    icon: 'musical-notes',
    fileName: 'Bruder Jakob',
    content: { type: 'musik', song: 'jakob' },
    text: 'Schläfst du noch? Ein Lied zum Mitsingen.',
  },
  {
    id: 'lied-morgen',
    kind: 'lied',
    name: 'Morgen kommt der Weihnachtsmann',
    price: 40,
    icon: 'musical-notes',
    fileName: 'Morgen kommt der Weihnachtsmann',
    content: { type: 'musik', song: 'morgen' },
    text: 'Dieselbe Melodie wie „Morgen kommt der Weihnachtsmann“ – auch im Sommer schön.',
  },
  {
    id: 'lied-geburtstag',
    kind: 'lied',
    name: 'Zum Geburtstag viel Glück',
    price: 60,
    icon: 'party-popper',
    fileName: 'Zum Geburtstag viel Glück',
    content: { type: 'musik', song: 'geburtstag' },
    text: 'Für den nächsten Geburtstag in der Familie.',
  },
];

export const SHOP_IDS = SHOP.map((i) => i.id);

export function shopItem(id: string): ShopItem | undefined {
  return SHOP.find((i) => i.id === id);
}

export type BuyResult = { ok: true; profile: Profile; fileId: string; again: boolean } | { ok: false; missing: number };

/**
 * Kaufen: Bytes abziehen, merken, dass es dem Kind gehört, Datei nach
 * „Downloads“ legen. Wer etwas schon besitzt, lädt es kostenlos noch einmal –
 * so wie in echten App-Läden.
 */
export function buy(profile: Profile, item: ShopItem, fileId: string, now: string): BuyResult {
  const again = profile.owned.includes(item.id);
  if (!again && profile.bytes < item.price) return { ok: false, missing: item.price - profile.bytes };
  const added = addFile(profile.files, 'downloads', item.fileName, item.content, fileId, now);
  if (!added.ok) return { ok: false, missing: 0 };
  return {
    ok: true,
    again,
    fileId,
    profile: {
      ...profile,
      bytes: again ? profile.bytes : profile.bytes - item.price,
      owned: again ? profile.owned : [...profile.owned, item.id],
      files: added.files,
    },
  };
}

/** Freie Hintergründe plus alles, was gekauft wurde. */
export function ownsWallpaper(profile: Profile, wallpaper: string, shopOnly: boolean): boolean {
  return !shopOnly || profile.owned.includes(`hg-${wallpaper}`);
}
