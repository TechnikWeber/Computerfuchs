import { emojiUrl, type EmojiName } from '../../core/emoji';

/** Ein Bild, das sich aufs Blatt zeichnen lässt – mit bekannter Größe. */
export type Drawable = CanvasImageSource & { width: number; height: number };

const stamps = new Map<EmojiName, HTMLImageElement>();

/** Stempelbilder einmal laden und behalten. */
export function stampImage(name: EmojiName): HTMLImageElement {
  let img = stamps.get(name);
  if (!img) {
    img = new Image();
    img.decoding = 'async';
    img.src = emojiUrl(name);
    stamps.set(name, img);
  }
  return img;
}

/** Ein Bild von einer Adresse laden (gleiche Herkunft, damit das Blatt speicherbar bleibt). */
export function urlImage(src: string): Promise<Drawable | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Ein gespeichertes PNG zum Weitermalen öffnen. */
export async function blobImage(blob: Blob): Promise<Drawable | null> {
  try {
    if (typeof createImageBitmap === 'function') return await createImageBitmap(blob);
  } catch {
    // weiter mit dem Umweg über <img>
  }
  const url = URL.createObjectURL(blob);
  try {
    return await urlImage(url);
  } finally {
    // Erst nach dem Zeichnen freigeben – das passiert sofort nach dem Laden.
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}
