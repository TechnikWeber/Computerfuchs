import { Icon } from '../../os/Icon';

interface Props {
  onDigit: (d: number) => void;
  onDelete: () => void;
  onOk: () => void;
  disabled?: boolean;
  canOk: boolean;
}

/** Zahlenfeld zum Anklicken. Die echte Tastatur geht genauso – das übt nebenbei die Zifferntasten. */
export function NumberPad({ onDigit, onDelete, onOk, disabled, canOk }: Props) {
  return (
    <div className="numpad" role="group" aria-label="Zahlenfeld">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <button key={n} type="button" className="numkey" onClick={() => onDigit(n)} disabled={disabled}>
          {n}
        </button>
      ))}
      <button type="button" className="numkey numkey-del" onClick={onDelete} disabled={disabled} aria-label="Löschen" title="Löschen">
        <Icon name="back" size={30} stroke={3.2} />
      </button>
      <button type="button" className="numkey" onClick={() => onDigit(0)} disabled={disabled}>
        0
      </button>
      <button
        type="button"
        className="numkey numkey-ok"
        onClick={onOk}
        disabled={disabled || !canOk}
        aria-label="Fertig"
        title="Fertig (Enter)"
      >
        <Icon name="check" size={32} stroke={3.4} />
      </button>
    </div>
  );
}
