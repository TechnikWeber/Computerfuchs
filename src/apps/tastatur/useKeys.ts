import { useEffect } from 'react';
import { useLatest } from '../../core/hooks';
import { useWindow } from '../../os/osContext';

/**
 * Tasten fürs Spiel – aber nur, solange dieses Fenster vorne ist.
 * Leertaste und Enter drücken dabei keine Knöpfe, die gerade den Fokus haben,
 * und Pfeiltasten scrollen nichts weg.
 */
export function useKeys(handler: (e: KeyboardEvent) => void, active = true): void {
  const win = useWindow();
  const latest = useLatest(handler);
  useEffect(() => {
    if (!active || !win.focused) return;
    const onDown = (e: KeyboardEvent) => {
      // Das Ziel kann auch das Fenster selbst sein – dann gibt es kein closest().
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target?.closest('input, textarea, select')) return;
      // Kürzel wie Strg+R bleiben beim Browser. AltGr ist unter Windows Strg+Alt – das brauchen wir fürs @.
      const altGr = e.getModifierState?.('AltGraph') || (e.ctrlKey && e.altKey);
      if ((e.ctrlKey || e.metaKey) && !altGr) return;
      if (e.key === ' ' || e.key === 'Enter' || e.key.startsWith('Arrow') || e.key === 'Backspace' || e.key === 'Tab') {
        e.preventDefault();
        if (target && target !== document.body && target.closest('button, a')) target.blur();
      }
      latest.current(e);
    };
    // Die Leertaste löst Knöpfe erst beim Loslassen aus.
    const onUp = (e: KeyboardEvent) => {
      if (e.key === ' ') e.preventDefault();
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [active, win.focused, latest]);
}
