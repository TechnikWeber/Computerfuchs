import { useState } from 'react';
import { Icon } from './Icon';

/**
 * Kleine Hürde vor den Erwachsenen-Einstellungen: eine Rechenaufgabe, die
 * Kindergarten- und Grundschulkinder noch nicht lösen. Ein echter Schutz ist
 * das nicht – nur ein Schild „Bitte nicht aus Versehen".
 */
export function ParentGate({ onPass }: { onPass: () => void }) {
  const [task] = useState(() => ({ a: 12 + Math.floor(Math.random() * 8), b: 3 + Math.floor(Math.random() * 7) }));
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);

  return (
    <form
      className="parent-gate"
      onSubmit={(e) => {
        e.preventDefault();
        if (Number(value) === task.a * task.b) onPass();
        else {
          setWrong(true);
          setValue('');
        }
      }}
    >
      <span className="parent-gate-icon">
        <Icon name="lock" size={40} />
      </span>
      <h2>Nur für Erwachsene</h2>
      <p>Hier stellen Erwachsene ein, was Kinder nicht selbst ändern sollen. Bitte lös kurz diese Aufgabe:</p>
      <label className="parent-gate-task">
        <span>
          {task.a} × {task.b} =
        </span>
        <input
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            setWrong(false);
            setValue(e.target.value.replace(/\D/g, '').slice(0, 4));
          }}
          aria-label="Ergebnis"
          autoComplete="off"
        />
      </label>
      {wrong && <p className="parent-gate-wrong">Das stimmt leider nicht.</p>}
      <button type="submit" className="btn btn-grape">
        Öffnen
      </button>
    </form>
  );
}
