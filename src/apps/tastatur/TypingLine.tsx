import { correctPrefix, type TypingState } from './typing';

interface Cell {
  ch: string;
  cls: string;
}

/** Der Text zum Abtippen: Geschafftes grün, Vertipptes rot, der nächste Buchstabe blinkt. */
export function TypingLine({ state, size = 'big', className }: { state: TypingState; size?: 'big' | 'medium'; className?: string }) {
  const prefix = correctPrefix(state);
  const wrong = state.typed.slice(prefix);
  const rest = state.target.slice(prefix);
  const cells: Cell[] = [];
  for (const ch of state.target.slice(0, prefix)) cells.push({ ch, cls: 'is-done' });
  for (const ch of wrong) cells.push({ ch, cls: 'is-wrong' });
  // Solange etwas Falsches dasteht, wartet der Rest.
  [...rest].forEach((ch, i) => cells.push({ ch, cls: i === 0 && !wrong ? 'is-next' : wrong ? 'is-waiting' : 'is-todo' }));

  // Wörter zusammenhalten: Umbrochen wird nur an Leerzeichen.
  const words: Cell[][] = [[]];
  for (const c of cells) {
    words[words.length - 1].push(c);
    if (c.ch === ' ') words.push([]);
  }

  return (
    <div className={['typing-line', `is-${size}`, className ?? ''].filter(Boolean).join(' ')} aria-label={state.target}>
      {words.map((word, w) => (
        <span key={w} className="typing-word">
          {word.map((c, i) => (
            <span key={i} className={['typing-ch', c.cls, c.ch === ' ' ? 'is-space' : ''].filter(Boolean).join(' ')}>
              {c.ch === ' ' ? ' ' : c.ch}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}
