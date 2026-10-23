import { useCallback, useEffect, useRef, useState } from 'react';
import { speak } from '../../core/speech';

/** Ein kurzer Hinweis, der von selbst wieder verschwindet – und vorgelesen wird. */
export function useHint(ms = 2200): [string | null, (text: string) => void] {
  const [hint, setHint] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const lastSpoken = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const show = useCallback(
    (text: string) => {
      setHint(text);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setHint(null), ms);
      // Nicht bei jedem Fehlklick sofort wieder reden.
      const now = Date.now();
      if (now - lastSpoken.current > 2500) {
        lastSpoken.current = now;
        speak(text);
      }
    },
    [ms],
  );

  return [hint, show];
}
