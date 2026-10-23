import { useEffect, type ReactNode } from 'react';
import { speak, stopSpeaking } from '../core/speech';
import { Fox, type FoxMood } from './Fox';
import { Icon } from './Icon';

interface Props {
  text: string;
  title?: string;
  mood?: FoxMood;
  /** Beim Erscheinen vorlesen (wenn Vorlesen eingeschaltet ist). */
  autoSpeak?: boolean;
  foxSize?: number;
  children?: ReactNode;
  className?: string;
}

/** Flinn mit Sprechblase. Der Lautsprecher-Knopf liest immer vor, auch wenn Vorlesen aus ist. */
export function FoxSays({ text, title, mood = 'happy', autoSpeak = true, foxSize = 110, children, className }: Props) {
  useEffect(() => {
    if (!autoSpeak) return;
    speak(title ? `${title} ${text}` : text);
    return () => stopSpeaking();
  }, [text, title, autoSpeak]);

  return (
    <div className={className ? `fox-says ${className}` : 'fox-says'}>
      <Fox size={foxSize} mood={mood} className="fox-says-fox" />
      <div className="fox-bubble">
        {title && <h2 className="fox-bubble-title">{title}</h2>}
        <p className="fox-bubble-text">{text}</p>
        <div className="fox-bubble-actions">
          <button
            type="button"
            className="icon-btn speak-btn"
            onClick={() => speak(title ? `${title} ${text}` : text, { force: true })}
            aria-label="Vorlesen"
            title="Vorlesen"
          >
            <Icon name="speaker" size={26} />
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}
