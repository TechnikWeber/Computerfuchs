import { useEffect, type CSSProperties } from 'react';
import { APPS, CATEGORIES, type AppDef } from '../apps/registry';
import { formatBytes } from '../core/bytes';
import { nextRank, rankFor, type Profile } from '../core/profile';
import { Avatar } from './Avatar';
import { Emoji } from './Emoji';
import { ByteIcon, Icon } from './Icon';

interface Props {
  profile: Profile;
  onOpen: (app: AppDef) => void;
  onLogout: () => void;
  onShutdown: () => void;
  onClose: () => void;
}

export function StartMenu({ profile, onOpen, onLogout, onShutdown, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rank = rankFor(profile.bytesEarned);
  const next = nextRank(profile.bytesEarned);
  const progress = next ? (profile.bytesEarned - rank.min) / (next.min - rank.min) : 1;
  const ready = APPS.filter((a) => (a.component || a.opens) && !a.hidden);
  const soon = APPS.filter((a) => a.soon);

  return (
    <div className="start-menu" role="dialog" aria-label="Start-Menü" onPointerDown={(e) => e.stopPropagation()}>
      <header className="start-head">
        <Avatar id={profile.avatar} size={72} />
        <div className="start-who">
          <strong>{profile.name}</strong>
          <span className="start-rank">{rank.name}</span>
          <div className="rank-bar" title={next ? `Noch ${formatBytes(next.min - profile.bytesEarned)} bis ${next.name}` : 'Höchster Rang!'}>
            <span style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          {next && (
            <span className="start-next">
              Noch {formatBytes(next.min - profile.bytesEarned)} bis {next.name}
            </span>
          )}
        </div>
        <div className="start-bytes">
          <ByteIcon size={34} />
          <span>{formatBytes(profile.bytes)}</span>
        </div>
      </header>

      <div className="start-body">
        <div className="start-groups">
          {CATEGORIES.map((cat) => {
            const apps = ready.filter((a) => a.category === cat.id);
            if (apps.length === 0) return null;
            return (
              <section key={cat.id} className="start-group">
                <h3>{cat.name}</h3>
                <div className="start-apps">
                  {apps.map((app) => (
                    <StartTile key={app.id} app={app} onOpen={onOpen} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
        <section className="start-group start-soon">
          <h3>Bald da</h3>
          <div className="start-apps">
            {soon.map((app) => (
              <StartTile key={app.id} app={app} onOpen={onOpen} soon />
            ))}
          </div>
        </section>
      </div>

      <footer className="start-foot">
        <button type="button" className="btn btn-ghost btn-small" onClick={onLogout}>
          <Icon name="logout" size={20} /> Abmelden
        </button>
        <button type="button" className="btn btn-danger btn-small" onClick={onShutdown}>
          <Icon name="power" size={20} /> Ausschalten
        </button>
      </footer>
    </div>
  );
}

function StartTile({ app, onOpen, soon }: { app: AppDef; onOpen: (app: AppDef) => void; soon?: boolean }) {
  return (
    <button
      type="button"
      className={soon ? 'start-tile is-soon' : 'start-tile'}
      onClick={() => onOpen(app)}
      style={{ '--app': app.color, '--app-dark': app.colorDark } as CSSProperties}
    >
      <span className="app-tile">
        <Emoji name={app.icon} size={40} />
        {soon && (
          <span className="soon-badge">
            <Icon name="lock" size={14} stroke={3} />
          </span>
        )}
      </span>
      <span className="start-tile-name">{app.name}</span>
    </button>
  );
}
