import { useState } from 'react';
import { AVATARS, avatarById, type AvatarId } from '../core/catalog';
import { MAX_NAME, type Profile } from '../core/profile';
import { useSave } from '../core/saveContext';
import { sfx } from '../core/sound';
import { Avatar } from './Avatar';
import { FoxSays } from './FoxSays';
import { Icon } from './Icon';

const AGES = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

/** Neues Profil in drei Schritten: Tier, Name, Alter. Lesen muss man dafür nicht können. */
export function ProfileWizard({ onDone, onCancel }: { onDone: (p: Profile) => void; onCancel?: () => void }) {
  const save = useSave();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [avatar, setAvatar] = useState<AvatarId>('fox');
  const [name, setName] = useState('');

  const finish = (age: number) => {
    sfx.success();
    onDone(save.createProfile({ name, avatar, age }));
  };

  return (
    <div className="wizard">
      <div className="wizard-steps" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className={i <= step ? 'is-done' : undefined} />
        ))}
      </div>

      {step === 0 && (
        <>
          <FoxSays title="Hallo!" text="Ich bin Flinn. Welches Tier möchtest du sein? Klick auf eins!" foxSize={96} />
          <div className="avatar-grid">
            {AVATARS.map((a) => (
              <button
                key={a.id}
                type="button"
                className={a.id === avatar ? 'avatar-pick is-picked' : 'avatar-pick'}
                onClick={() => {
                  sfx.tap();
                  setAvatar(a.id);
                  setStep(1);
                }}
                aria-label={a.name}
                title={a.name}
              >
                <Avatar id={a.id} size={84} />
              </button>
            ))}
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <FoxSays text="Wie heißt du? Tippe deinen Namen – oder klick einfach auf Weiter." foxSize={96} />
          <form
            className="name-form"
            onSubmit={(e) => {
              e.preventDefault();
              sfx.tap();
              setStep(2);
            }}
          >
            <Avatar id={avatar} size={96} />
            <input
              className="name-input"
              value={name}
              maxLength={MAX_NAME}
              onChange={(e) => setName(e.target.value)}
              placeholder={avatarById(avatar).name}
              aria-label="Dein Name"
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className="btn btn-leaf btn-big">
              Weiter <Icon name="next" size={28} />
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <FoxSays text="Wie alt bist du?" foxSize={96} />
          <div className="age-grid">
            {AGES.map((age) => (
              <button key={age} type="button" className="age-pick" onClick={() => finish(age)}>
                {age === 15 ? '15+' : age}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="wizard-nav">
        {step > 0 ? (
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setStep((s) => (s === 2 ? 1 : 0))}>
            <Icon name="back" size={20} /> Zurück
          </button>
        ) : (
          onCancel && (
            <button type="button" className="btn btn-ghost btn-small" onClick={onCancel}>
              <Icon name="back" size={20} /> Abbrechen
            </button>
          )
        )}
      </div>
    </div>
  );
}
