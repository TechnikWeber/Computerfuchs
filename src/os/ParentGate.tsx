import { useState } from 'react';
import { Icon } from './Icon';

/**
 * Kleine Hürde vor den Erwachsenen-Einstellungen: eine Rechenaufgabe mit
 * großen runden Zahlen wie 10 × 1000. Erwachsene rechnen das im Kopf, kleine
 * Kinder klicken nicht aus Versehen hinein. Ein echter Schutz ist das nicht –
 * nur ein Schild „Bitte nicht aus Versehen".
 */
const pick = (list: number[]) => list[Math.floor(Math.random() * list.length)];

export function ParentGate({ onPass }: { onPass: () => void }) {
  const [task] = useState(() => ({ a: pick([2, 3, 4, 5, 10, 20]), b: pick([100, 1000]) }));
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
            setValue(e.target.value.replace(/\D/g, '').slice(0, 6));
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
