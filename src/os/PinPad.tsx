import { useEffect, useState } from 'react';
import { PIN_LENGTH, PIN_PICTURES, checkPin, isValidCode, makePin, type Pin, type PinKind } from '../core/pin';
import type { Profile } from '../core/profile';
import { sfx } from '../core/sound';
import { speak } from '../core/speech';
import { Avatar } from './Avatar';
import { Emoji } from './Emoji';
import { Icon } from './Icon';
import { ParentGate } from './ParentGate';

// ---------------------------------------------------------------------------
// Eingabe: neun Bilder oder ein Zahlenfeld
// ---------------------------------------------------------------------------

interface PadProps {
  kind: PinKind;
  value: string;
  onChange: (value: string) => void;
  shake?: boolean;
}

export function PinPad({ kind, value, onChange, shake }: PadProps) {
  const add = (ch: string) => {
    if (value.length >= PIN_LENGTH) return;
    sfx.tap();
    onChange(value + ch);
  };

  // Zahlen gehen auch mit der echten Tastatur.
  useEffect(() => {
    if (kind !== 'zahlen') return;
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key) && value.length < PIN_LENGTH) {
        e.preventDefault();
        sfx.tap();
        onChange(value + e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        onChange(value.slice(0, -1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [kind, value, onChange]);

  return (
    <div className={shake ? 'pin-pad is-shaking' : 'pin-pad'}>
      <div className="pin-dots" aria-label={`${value.length} von ${PIN_LENGTH}`}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span key={i} className={i < value.length ? 'pin-dot is-set' : 'pin-dot'}>
            {kind === 'bilder' && i < value.length ? <Emoji name={PIN_PICTURES[Number(value[i])]} size={30} /> : null}
          </span>
        ))}
      </div>
      {kind === 'bilder' ? (
        <div className="pin-grid">
          {PIN_PICTURES.map((emoji, i) => (
            <button key={emoji} type="button" className="pin-key pin-key-pic" onClick={() => add(String(i))} aria-label={`Bild ${i + 1}`}>
              <Emoji name={emoji} size={52} />
            </button>
          ))}
        </div>
      ) : (
        <div className="pin-grid">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} type="button" className="pin-key" onClick={() => add(d)}>
              {d}
            </button>
          ))}
          <span />
          <button type="button" className="pin-key" onClick={() => add('0')}>
            0
          </button>
        </div>
      )}
      <button type="button" className="btn btn-ghost btn-small pin-back" onClick={() => onChange(value.slice(0, -1))} disabled={!value}>
        <Icon name="back" size={18} /> Löschen
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Anmelden mit Code
// ---------------------------------------------------------------------------

interface PromptProps {
  profile: Profile;
  onSuccess: () => void;
  /** Ein Erwachsener hat den Code zurückgesetzt. */
  onReset: () => void;
  onCancel: () => void;
}

export function PinPrompt({ profile, onSuccess, onReset, onCancel }: PromptProps) {
  const pin = profile.pin as Pin;
  const [value, setValue] = useState('');
  const [shake, setShake] = useState(false);
  const [wrong, setWrong] = useState(0);
  const [grownUp, setGrownUp] = useState(false);

  useEffect(() => speak(`Hallo ${profile.name}! Gib deinen Geheimcode ein.`), [profile.name]);

  const change = (v: string) => {
    setValue(v);
    if (v.length < PIN_LENGTH) return;
    if (checkPin(pin, profile.id, v)) {
      sfx.success();
      onSuccess();
      return;
    }
    sfx.wrong();
    speak('Das war nicht richtig. Versuch es noch einmal.');
    setShake(true);
    setWrong((n) => n + 1);
    window.setTimeout(() => {
      setShake(false);
      setValue('');
    }, 500);
  };

  return (
    <div className="pin-prompt" role="dialog" aria-label={`Geheimcode für ${profile.name}`}>
      <div className="pin-who">
        <Avatar id={profile.avatar} size={64} />
        <h2>{profile.name}</h2>
      </div>
      {grownUp ? (
        <>
          <ParentGate onPass={onReset} />
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setGrownUp(false)}>
            Zurück
          </button>
        </>
      ) : (
        <>
          <p className="pin-hint">{wrong > 0 ? 'Das war nicht richtig – versuch es noch einmal.' : 'Gib deinen Geheimcode ein.'}</p>
          <PinPad kind={pin.kind} value={value} onChange={change} shake={shake} />
          <div className="pin-actions">
            <button type="button" className="btn btn-ghost btn-small" onClick={onCancel}>
              <Icon name="back" size={18} /> Anderes Profil
            </button>
            {wrong >= 2 && (
              <button type="button" className="btn btn-ghost btn-small" onClick={() => setGrownUp(true)}>
                <Icon name="lock" size={18} /> Code vergessen?
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Code festlegen (unter „Ich“)
// ---------------------------------------------------------------------------

type Step = { name: 'idle' } | { name: 'enter'; kind: PinKind } | { name: 'confirm'; kind: PinKind; first: string } | { name: 'remove' };

export function PinSetup({ profile, onSave }: { profile: Profile; onSave: (pin: Pin | undefined) => void }) {
  const [step, setStep] = useState<Step>({ name: 'idle' });
  const [value, setValue] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const fail = (text: string) => {
    sfx.wrong();
    setMessage(text);
    setShake(true);
    window.setTimeout(() => {
      setShake(false);
      setValue('');
    }, 500);
  };

  const change = (v: string) => {
    setValue(v);
    if (v.length < PIN_LENGTH) return;
    if (step.name === 'enter') {
      if (!isValidCode(step.kind, v)) return fail('Das geht nicht als Code.');
      setStep({ name: 'confirm', kind: step.kind, first: v });
      setMessage('Und jetzt noch einmal zur Sicherheit.');
      window.setTimeout(() => setValue(''), 250);
      speak('Und jetzt noch einmal zur Sicherheit.');
    } else if (step.name === 'confirm') {
      if (v !== step.first) {
        setStep({ name: 'enter', kind: step.kind });
        return fail('Die beiden Codes waren verschieden. Noch einmal von vorn.');
      }
      sfx.success();
      onSave(makePin(profile.id, step.kind, v));
      setStep({ name: 'idle' });
      setValue('');
      setMessage('Geheimcode gespeichert. Verrate ihn niemandem – so wie ein Passwort!');
      speak('Geheimcode gespeichert. Verrate ihn niemandem!');
    } else if (step.name === 'remove' && profile.pin) {
      if (!checkPin(profile.pin, profile.id, v)) return fail('Das war nicht dein Code.');
      sfx.tap();
      onSave(undefined);
      setStep({ name: 'idle' });
      setValue('');
      setMessage('Der Geheimcode ist weg. Jetzt kann jeder dein Profil öffnen.');
    }
  };

  if (step.name === 'idle') {
    return (
      <div className="pin-setup">
        <p className="settings-intro">
          Mit einem Geheimcode kann nur noch öffnen, wer den Code kennt – so wie bei einem Passwort. Verrate ihn niemandem!
        </p>
        {message && <p className="settings-note">{message}</p>}
        <div className="settings-buttons">
          {profile.pin ? (
            <button type="button" className="btn btn-ghost" onClick={() => setStep({ name: 'remove' })}>
              <Icon name="lock" size={20} /> Geheimcode entfernen
            </button>
          ) : (
            <>
              <button type="button" className="btn btn-sky" onClick={() => { setMessage('Wähle vier Bilder.'); setStep({ name: 'enter', kind: 'bilder' }); }}>
                <Emoji name="fox" size={26} /> Bilder-Code festlegen
              </button>
              <button type="button" className="btn btn-grape" onClick={() => { setMessage('Wähle vier Zahlen.'); setStep({ name: 'enter', kind: 'zahlen' }); }}>
                1 2 3 4 Zahlen-Code festlegen
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const kind = step.name === 'remove' ? (profile.pin?.kind ?? 'bilder') : step.kind;
  return (
    <div className="pin-setup">
      <p className="settings-note">{step.name === 'remove' ? 'Gib zuerst deinen jetzigen Code ein.' : message}</p>
      <PinPad kind={kind} value={value} onChange={change} shake={shake} />
      <button type="button" className="btn btn-ghost btn-small" onClick={() => { setStep({ name: 'idle' }); setValue(''); setMessage(null); }}>
        Abbrechen
      </button>
    </div>
  );
}
