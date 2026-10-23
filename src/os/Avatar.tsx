import { avatarById } from '../core/catalog';
import { Emoji } from './Emoji';

export function Avatar({ id, size = 64, className }: { id: string; size?: number; className?: string }) {
  const a = avatarById(id);
  return (
    <span
      className={className ? `avatar ${className}` : 'avatar'}
      style={{ width: size, height: size, background: a.bg }}
      role="img"
      aria-label={a.name}
    >
      <Emoji name={a.emoji} size={Math.round(size * 0.72)} />
    </span>
  );
}
