import { useRef, useState, type DragEvent } from 'react';
import { useNow } from '../core/hooks';
import { rankFor } from '../core/profile';
import { useSave } from '../core/saveContext';
import { sfx } from '../core/sound';
import { parseSaveFile } from '../core/storage';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { ProfileWizard } from './ProfileWizard';
import { Wallpaper } from './Wallpaper';

const timeFmt = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });
const dateFmt = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

/** Anmeldebildschirm: Wer bist du? – die erste Lektion über Benutzerkonten. */
export function Login({ onLogin, onShutdown }: { onLogin: (id: string) => void; onShutdown: () => void }) {
  const save = useSave();
  const profiles = save.data.profiles;
  const [creating, setCreating] = useState(profiles.length === 0);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const now = useNow();

  const last = profiles.find((p) => p.id === save.data.lastProfileId) ?? profiles[0];

  const loadFile = async (file: File) => {
    const result = parseSaveFile(await file.text());
    if (!result.ok) {
      sfx.wrong();
      setMessage({ text: result.reason, ok: false });
      return;
    }
    const { added, replaced } = save.importSave(result.data);
    const count = added + replaced;
    sfx.success();
    setMessage({ text: count === 1 ? 'Ein Profil geladen.' : `${count} Profile geladen.`, ok: true });
    setCreating(false);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void loadFile(file);
  };

  return (
    <div
      className="login"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={onDrop}
    >
      <Wallpaper id={last?.settings.wallpaper ?? 'wiese'} className="login-wallpaper" />
      <div className="login-shade" />

      <div className="login-clock" aria-hidden="true">
        <span className="login-time">{timeFmt.format(now)}</span>
        <span className="login-date">{dateFmt.format(now)}</span>
      </div>

      <main className="login-panel">
        {creating ? (
          <ProfileWizard
            onDone={(p) => onLogin(p.id)}
            onCancel={profiles.length > 0 ? () => setCreating(false) : undefined}
          />
        ) : (
          <>
            <h1 className="login-title">Wer bist du?</h1>
            <div className="profile-grid">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="profile-card"
                  onClick={() => {
                    sfx.tap();
                    onLogin(p.id);
                  }}
                >
                  <Avatar id={p.avatar} size={104} />
                  <span className="profile-name">{p.name}</span>
                  <span className="profile-rank">{rankFor(p.bytesEarned).name}</span>
                </button>
              ))}
              <button type="button" className="profile-card profile-new" onClick={() => setCreating(true)}>
                <span className="profile-plus">
                  <Icon name="plus" size={52} stroke={3.4} />
                </span>
                <span className="profile-name">Neu</span>
                <span className="profile-rank">Profil anlegen</span>
              </button>
            </div>
          </>
        )}
      </main>

      <footer className="login-foot">
        <button type="button" className="btn btn-ghost btn-small" onClick={() => fileInput.current?.click()}>
          <Icon name="upload" size={20} /> Spielstand laden
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void loadFile(file);
          }}
        />
        <button type="button" className="login-power" onClick={onShutdown} aria-label="Ausschalten" title="Ausschalten">
          <Icon name="power" size={30} />
        </button>
      </footer>

      {message && (
        <div className={message.ok ? 'login-message' : 'login-message is-error'} role="status" onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}
      {dragging && <div className="drop-overlay">Spielstand-Datei hier loslassen</div>}
    </div>
  );
}
