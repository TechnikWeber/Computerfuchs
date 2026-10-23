import type { CSSProperties } from 'react';
import { emojiUrl, type EmojiName } from '../core/emoji';

interface Props {
  name: EmojiName;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  /** Leer lassen, wenn das Bild nur schmückt. */
  alt?: string;
}

export function Emoji({ name, size = 48, className, style, alt = '' }: Props) {
  return (
    <img
      className={className ? `emoji ${className}` : 'emoji'}
      src={emojiUrl(name)}
      alt={alt}
      draggable={false}
      decoding="async"
      style={{ width: size, height: size, ...style }}
    />
  );
}
