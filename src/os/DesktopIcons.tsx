import { useMemo, useRef, useState, type CSSProperties } from 'react';
import type { AppDef } from '../apps/registry';
import { createDoubleClick } from '../core/dblclick';
import { sfx } from '../core/sound';
import { Emoji } from './Emoji';

interface Props {
  apps: AppDef[];
  selected: string | null;
  /** Symbole öffnen erst mit Doppelklick (sonst mit einem Klick). */
  doubleClick: boolean;
  doubleClickMs: number;
  big: boolean;
  /** Dieses Symbol leuchtet, etwa bei der Begrüßung. */
  highlight?: string | null;
  onSelect: (id: string | null) => void;
  onOpen: (app: AppDef) => void;
}

export function DesktopIcons({ apps, selected, doubleClick, doubleClickMs, big, highlight, onSelect, onOpen }: Props) {
  const detect = useMemo(() => createDoubleClick(doubleClickMs, 18), [doubleClickMs]);
  const [hint, setHint] = useState<string | null>(null);
  const hintTimer = useRef<number | undefined>(undefined);
  const hintsShown = useRef(0);
  // Der zweite Klick eines Doppelklicks soll nicht gleich wieder als neuer Einzelklick zählen.
  const lastOpen = useRef<{ id: string; t: number } | null>(null);

  return (
    <div className={big ? 'desk-icons is-big' : 'desk-icons'}>
      {apps.map((app) => (
        <button
          key={app.id}
          type="button"
          className={[
            'desk-icon',
            selected === app.id ? 'is-selected' : '',
            highlight === app.id ? 'is-highlight' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ '--app': app.color, '--app-dark': app.colorDark } as CSSProperties}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (e.button !== 0) return;
            if (!doubleClick) return;
            if (lastOpen.current?.id === app.id && e.timeStamp - lastOpen.current.t < 900) return;
            if (detect({ x: e.clientX, y: e.clientY, t: e.timeStamp, target: app.id })) {
              window.clearTimeout(hintTimer.current);
              setHint(null);
              lastOpen.current = { id: app.id, t: e.timeStamp };
              onOpen(app);
              return;
            }
            sfx.click();
            onSelect(app.id);
            // Wer nur einmal klickt, bekommt nach kurzer Zeit einen Tipp.
            window.clearTimeout(hintTimer.current);
            if (hintsShown.current < 3) {
              hintTimer.current = window.setTimeout(() => {
                hintsShown.current++;
                setHint(app.id);
                window.setTimeout(() => setHint((h) => (h === app.id ? null : h)), 2600);
              }, doubleClickMs + 150);
            }
          }}
          onClick={() => {
            if (!doubleClick) onOpen(app);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && doubleClick) {
              e.preventDefault();
              onOpen(app);
            }
          }}
          aria-label={doubleClick ? `${app.name} – mit Doppelklick öffnen` : app.name}
        >
          <span className="app-tile">
            <Emoji name={app.icon} size={big ? 70 : 54} />
          </span>
          <span className="desk-label">{app.name}</span>
          {hint === app.id && <span className="desk-hint">Zweimal schnell klicken!</span>}
        </button>
      ))}
    </div>
  );
}
