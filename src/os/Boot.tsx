import { useState } from 'react';
import { enterFullscreen, hasFinePointer } from '../core/fullscreen';
import { prefersReducedMotion, useTimeouts } from '../core/hooks';
import { sfx, unlockAudio } from '../core/sound';
import { initSpeech } from '../core/speech';
import { Fox } from './Fox';
import { Icon } from './Icon';

const TIPS = ['Flinn wird geweckt …', 'Bytes werden gezählt …', 'Fenster werden geputzt …'];

/** Der ausgeschaltete Computer. Der Einschaltknopf zeigt das echte Power-Symbol. */
export function Boot({ onStarted }: { onStarted: () => void }) {
  const [starting, setStarting] = useState(false);
  const [tip, setTip] = useState(0);
  const later = useTimeouts();

  const start = () => {
    if (starting) return;
    // Ton, Sprache und Vollbild brauchen eine Nutzeraktion – der Klick hier ist sie.
    unlockAudio();
    initSpeech();
    void enterFullscreen();
    sfx.boot();
    setStarting(true);
    const total = prefersReducedMotion() ? 700 : 2600;
    later(() => setTip(1), total * 0.35);
    later(() => setTip(2), total * 0.68);
    later(onStarted, total);
  };

  return (
    <div className={starting ? 'boot is-starting' : 'boot'}>
      {starting ? (
        <div className="boot-splash" role="status">
          <Fox size={150} mood="wink" className="boot-fox" />
          <h1>Computerfuchs</h1>
          <div className="boot-bar">
            <span />
          </div>
          <p className="boot-tip">{TIPS[tip]}</p>
        </div>
      ) : (
        <>
          <div className="boot-brand">
            <Fox size={56} />
            <span>Computerfuchs</span>
          </div>
          <button type="button" className="power-btn" onClick={start} aria-label="Computer einschalten" autoFocus>
            <Icon name="power" size={86} stroke={3.2} />
          </button>
          <p className="boot-label">Einschalten</p>
          {!hasFinePointer() && (
            <p className="boot-note">Computerfuchs ist für Computer mit Maus und Tastatur gemacht. Auf dem Tablet geht nicht alles.</p>
          )}
          <p className="boot-foot">Ohne Anmeldung · ohne Werbung · alles bleibt auf diesem Gerät</p>
        </>
      )}
    </div>
  );
}
