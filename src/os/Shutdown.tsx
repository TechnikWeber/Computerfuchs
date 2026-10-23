import { useEffect } from 'react';
import { prefersReducedMotion, useLatest } from '../core/hooks';
import { sfx } from '../core/sound';
import { speak } from '../core/speech';
import { Fox } from './Fox';

export function Shutdown({ name, onDone }: { name: string; onDone: () => void }) {
  const done = useLatest(onDone);
  const bye = name ? `Tschüss, ${name}!` : 'Tschüss!';
  useEffect(() => {
    sfx.shutdown();
    speak(`${bye} Bis bald.`);
    const id = window.setTimeout(() => done.current(), prefersReducedMotion() ? 900 : 2400);
    return () => window.clearTimeout(id);
  }, [bye, done]);

  return (
    <div className="shutdown" role="status">
      <Fox size={150} mood="cheer" className="shutdown-fox" />
      <h1>{bye}</h1>
      <p>Der Computer fährt herunter …</p>
    </div>
  );
}
