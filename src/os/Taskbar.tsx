import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { appById } from '../apps/registry';
import { formatBytes, formatBytesShort } from '../core/bytes';
import { enterFullscreen, exitFullscreen, isFullscreen, onFullscreenChange } from '../core/fullscreen';
import { useNow } from '../core/hooks';
import type { Profile } from '../core/profile';
import { Emoji } from './Emoji';
import { Fox } from './Fox';
import { ByteIcon, Icon } from './Icon';
import type { Win } from './windows';

const timeFmt = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });
const dateFmt = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' });

interface Props {
  profile: Profile;
  wins: Win[];
  focused: string | null;
  startOpen: boolean;
  kiosk: boolean;
  onStart: () => void;
  onTask: (w: Win) => void;
  onToggleSound: () => void;
}

export function Taskbar({ profile, wins, focused, startOpen, kiosk, onStart, onTask, onToggleSound }: Props) {
  const now = useNow();
  const [fullscreen, setFullscreen] = useState(isFullscreen);
  useEffect(() => onFullscreenChange(setFullscreen), []);

  // Der Byte-Zähler hüpft, wenn etwas dazukommt.
  const [bump, setBump] = useState(false);
  const lastBytes = useRef(profile.bytes);
  useEffect(() => {
    if (profile.bytes > lastBytes.current) {
      setBump(true);
      const id = window.setTimeout(() => setBump(false), 700);
      lastBytes.current = profile.bytes;
      return () => window.clearTimeout(id);
    }
    lastBytes.current = profile.bytes;
  }, [profile.bytes]);

  return (
    <nav className="taskbar" aria-label="Taskleiste" onPointerDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={startOpen ? 'start-btn is-open' : 'start-btn'}
        onClick={onStart}
        aria-expanded={startOpen}
        aria-label="Start-Menü"
      >
        <Fox size={44} />
        <span>Start</span>
      </button>

      <div className="task-list">
        {wins.map((w) => {
          const app = appById(w.appId);
          if (!app) return null;
          const active = focused === w.id && w.mode !== 'min';
          return (
            <button
              key={w.id}
              type="button"
              className={`task${active ? ' is-active' : ''}${w.mode === 'min' ? ' is-min' : ''}`}
              onClick={() => onTask(w)}
              title={app.name}
              style={{ '--app': app.color } as CSSProperties}
            >
              <Emoji name={app.icon} size={30} />
              <span>{app.name}</span>
            </button>
          );
        })}
      </div>

      <div className="tray">
        <div className={bump ? 'bytes-pill is-bump' : 'bytes-pill'} title={`Deine Bytes: ${formatBytes(profile.bytes)}`}>
          <ByteIcon size={32} />
          <span>{formatBytesShort(profile.bytes)}</span>
        </div>
        <button
          type="button"
          className="icon-btn tray-btn"
          onClick={onToggleSound}
          aria-label={profile.settings.sound ? 'Ton ausschalten' : 'Ton einschalten'}
          title={profile.settings.sound ? 'Ton ist an' : 'Ton ist aus'}
        >
          <Icon name={profile.settings.sound ? 'speaker' : 'speaker-off'} />
        </button>
        {!kiosk && (
          <button
            type="button"
            className="icon-btn tray-btn"
            onClick={() => void (fullscreen ? exitFullscreen() : enterFullscreen())}
            aria-label={fullscreen ? 'Vollbild verlassen' : 'Vollbild'}
            title={fullscreen ? 'Vollbild verlassen' : 'Vollbild'}
          >
            <Icon name={fullscreen ? 'fullscreen-exit' : 'fullscreen'} />
          </button>
        )}
        <div className="clock" title={now.toLocaleDateString('de-DE', { dateStyle: 'full' })}>
          <span className="clock-time">{timeFmt.format(now)}</span>
          <span className="clock-date">{dateFmt.format(now)}</span>
        </div>
      </div>
    </nav>
  );
}
