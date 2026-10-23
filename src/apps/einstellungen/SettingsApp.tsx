import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AVATARS, WALLPAPERS } from '../../core/catalog';
import { formatBytes } from '../../core/bytes';
import { createDoubleClick } from '../../core/dblclick';
import { downloadText } from '../../core/download';
import type { EmojiName } from '../../core/emoji';
import {
  CURSOR_SIZES, FEATURES, MAX_NAME, clampAge, rankFor,
  type CursorSize, type Feature, type ProfileSettings,
} from '../../core/profile';
import { useSave } from '../../core/saveContext';
import { sfx } from '../../core/sound';
import { speak, speechAvailable } from '../../core/speech';
import { exportSave, parseSaveFile } from '../../core/storage';
import { Avatar } from '../../os/Avatar';
import { Emoji } from '../../os/Emoji';
import { Fox } from '../../os/Fox';
import { Icon } from '../../os/Icon';
import { useOs, useWindow } from '../../os/osContext';
import { ParentGate } from '../../os/ParentGate';
import { Wallpaper } from '../../os/Wallpaper';

type Tab = 'hintergrund' | 'ton' | 'maus' | 'ich' | 'info' | 'erwachsene';

const TABS: { id: Tab; name: string; icon: EmojiName }[] = [
  { id: 'hintergrund', name: 'Hintergrund', icon: 'artist-palette' },
  { id: 'ton', name: 'Ton und Stimme', icon: 'speaker-high-volume' },
  { id: 'maus', name: 'Maus', icon: 'computer-mouse' },
  { id: 'ich', name: 'Ich', icon: 'waving-hand' },
  { id: 'info', name: 'Über', icon: 'light-bulb' },
  { id: 'erwachsene', name: 'Für Erwachsene', icon: 'locked' },
];

const asTab = (t: string | undefined): Tab | undefined => TABS.find((x) => x.id === t)?.id;

const CURSOR_LABEL: Record<CursorSize, string> = { normal: 'Normal', gross: 'Groß', riesig: 'Riesig' };
const FEATURE_LABEL: Record<Feature, string> = {
  doubleClick: 'Symbole mit Doppelklick öffnen',
  moveWindows: 'Fenster verschieben',
  rightClick: 'Rechtsklick-Menü auf dem Desktop',
  windowControls: 'Fenster-Knöpfe und Größe ändern',
};
const AGES = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const REPO = 'https://github.com/TechnikWeber/Computerfuchs';

export default function SettingsApp() {
  const os = useOs();
  const win = useWindow();
  const [tab, setTab] = useState<Tab>(asTab(win.params.tab) ?? 'hintergrund');
  const [grown, setGrown] = useState(false);

  // Öffnet jemand die Einstellungen erneut mit einem Bereich (z. B. per Rechtsklick „Hintergrund ändern"), dorthin wechseln.
  const [seenNonce, setSeenNonce] = useState(win.params.nonce);
  if (seenNonce !== win.params.nonce) {
    setSeenNonce(win.params.nonce);
    const t = asTab(win.params.tab);
    if (t) setTab(t);
  }

  const set = (patch: Partial<ProfileSettings>) =>
    os.update((p) => ({ ...p, settings: { ...p.settings, ...patch } }));

  return (
    <div className="settings">
      <nav className="settings-nav" aria-label="Bereiche">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={t.id === tab ? 'settings-tab is-active' : 'settings-tab'}
            onClick={() => {
              sfx.tap();
              setTab(t.id);
            }}
            aria-current={t.id === tab}
          >
            <Emoji name={t.icon} size={32} />
            <span>{t.name}</span>
          </button>
        ))}
      </nav>
      <div className="settings-page">
        {tab === 'hintergrund' && <WallpaperPage onPick={(wallpaper) => set({ wallpaper })} />}
        {tab === 'ton' && <SoundPage set={set} />}
        {tab === 'maus' && <MousePage set={set} />}
        {tab === 'ich' && <MePage />}
        {tab === 'info' && <InfoPage />}
        {tab === 'erwachsene' && (grown ? <GrownUpPage /> : <ParentGate onPass={() => setGrown(true)} />)}
      </div>
    </div>
  );
}

function Page({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <section className="settings-section">
      <h2>{title}</h2>
      {intro && <p className="settings-intro">{intro}</p>}
      {children}
    </section>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={checked ? 'toggle is-on' : 'toggle'}
      onClick={() => {
        sfx.tap();
        onChange(!checked);
      }}
    >
      <span className="toggle-text">
        <strong>{label}</strong>
        {desc && <span>{desc}</span>}
      </span>
      <span className="toggle-switch" aria-hidden="true">
        <span />
      </span>
    </button>
  );
}

function WallpaperPage({ onPick }: { onPick: (id: ProfileSettings['wallpaper']) => void }) {
  const { profile } = useOs();
  return (
    <Page title="Hintergrund" intro="Such dir ein Bild für deinen Desktop aus.">
      <div className="wall-grid">
        {WALLPAPERS.map((w) => (
          <button
            key={w.id}
            type="button"
            className={profile.settings.wallpaper === w.id ? 'wall-pick is-active' : 'wall-pick'}
            onClick={() => {
              sfx.tap();
              onPick(w.id);
            }}
          >
            <span className="wall-preview">
              <Wallpaper id={w.id} />
            </span>
            <span className="wall-name">{w.name}</span>
          </button>
        ))}
      </div>
    </Page>
  );
}

function SoundPage({ set }: { set: (p: Partial<ProfileSettings>) => void }) {
  const { profile } = useOs();
  const s = profile.settings;
  return (
    <Page title="Ton und Stimme">
      <div className="settings-stack">
        <Toggle label="Töne" desc="Klicks, Plopps und Jubel" checked={s.sound} onChange={(sound) => set({ sound })} />
        <label className="slider-row">
          <span className="slider-label">Lautstärke</span>
          <span className="slider-end">leise</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(s.volume * 100)}
            onChange={(e) => set({ volume: Number(e.target.value) / 100 })}
            onPointerUp={() => sfx.coin()}
            onKeyUp={() => sfx.coin()}
          />
          <span className="slider-end">laut</span>
        </label>
        <Toggle label="Vorlesen" desc="Flinn liest Anleitungen und Aufgaben vor." checked={s.voice} onChange={(voice) => set({ voice })} />
        <div>
          <button type="button" className="btn btn-sky" onClick={() => speak('Hallo! Ich bin Flinn, der Computerfuchs.', { force: true })}>
            <Icon name="speaker" size={22} /> Stimme testen
          </button>
          {!speechAvailable() && <p className="settings-note">Dieser Browser kann leider nicht vorlesen.</p>}
        </div>
      </div>
    </Page>
  );
}

function MousePage({ set }: { set: (p: Partial<ProfileSettings>) => void }) {
  const { profile } = useOs();
  const ms = profile.settings.doubleClickMs;
  return (
    <Page title="Maus" intro="So stellt man auch an einem echten Computer die Maus ein.">
      <h3>Mauszeiger</h3>
      <div className="cursor-picks">
        {CURSOR_SIZES.map((c) => (
          <button
            key={c}
            type="button"
            className={profile.settings.cursor === c ? 'cursor-pick is-active' : 'cursor-pick'}
            onClick={() => {
              sfx.tap();
              set({ cursor: c });
            }}
          >
            <svg viewBox="0 0 32 32" width={c === 'normal' ? 28 : c === 'gross' ? 44 : 62} height={c === 'normal' ? 28 : c === 'gross' ? 44 : 62} aria-hidden="true">
              <path d="M3 2.5v21.5l5.6-5.3 3.9 9.2 4.1-1.7-3.9-9h8z" fill="#fff" stroke="#23263b" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
            <span>{CURSOR_LABEL[c]}</span>
          </button>
        ))}
      </div>
      <h3>Doppelklick-Tempo</h3>
      <p className="settings-intro">Wie schnell müssen die zwei Klicks hintereinander kommen? Probier es am Geschenk aus.</p>
      <div className="dbl-row">
        <label className="slider-row">
          <span className="slider-end">langsam</span>
          <input
            type="range"
            min={300}
            max={1100}
            step={50}
            value={1400 - ms}
            onChange={(e) => set({ doubleClickMs: 1400 - Number(e.target.value) })}
            aria-label="Doppelklick-Tempo"
          />
          <span className="slider-end">schnell</span>
        </label>
        <DoubleClickTest ms={ms} />
      </div>
    </Page>
  );
}

function DoubleClickTest({ ms }: { ms: number }) {
  const detect = useMemo(() => createDoubleClick(ms, 20), [ms]);
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      className={open ? 'dbl-test is-open' : 'dbl-test'}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        if (detect({ x: e.clientX, y: e.clientY, t: e.timeStamp, target: 'test' })) {
          sfx.found();
          setOpen(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setOpen(false), 1400);
        } else sfx.click();
      }}
      aria-label="Doppelklick-Test"
    >
      <Emoji name={open ? 'party-popper' : 'wrapped-gift'} size={72} />
      <span>{open ? 'Geklappt!' : 'Doppelklick hier'}</span>
    </button>
  );
}

function MePage() {
  const os = useOs();
  const p = os.profile;
  const [name, setName] = useState(p.name);
  const commit = () => {
    const clean = name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
    if (clean && clean !== p.name) {
      os.update((q) => ({ ...q, name: clean }));
      sfx.correct();
    } else setName(p.name);
  };
  const stars = (app: string) => Object.values(p.progress[app] ?? {}).reduce((sum, r) => sum + r.stars, 0);

  return (
    <Page title="Ich">
      <div className="me-card">
        <Avatar id={p.avatar} size={96} />
        <div className="me-facts">
          <strong>{p.name}</strong>
          <span>{rankFor(p.bytesEarned).name}</span>
          <span>
            {formatBytes(p.bytes)} · {stars('maus')} Sterne im Maustraining · {stars('rechnen')} Sterne beim Rechnen
          </span>
        </div>
      </div>
      <h3>Name</h3>
      <form
        className="me-name"
        onSubmit={(e) => {
          e.preventDefault();
          commit();
        }}
      >
        <input value={name} maxLength={MAX_NAME} onChange={(e) => setName(e.target.value)} onBlur={commit} aria-label="Name" />
        <button type="submit" className="btn btn-leaf btn-small">
          Speichern
        </button>
      </form>
      <h3>Dein Tier</h3>
      <div className="me-avatars">
        {AVATARS.map((a) => (
          <button
            key={a.id}
            type="button"
            className={p.avatar === a.id ? 'avatar-pick is-picked' : 'avatar-pick'}
            onClick={() => {
              sfx.tap();
              os.update((q) => ({ ...q, avatar: a.id }));
            }}
            aria-label={a.name}
            title={a.name}
          >
            <Avatar id={a.id} size={56} />
          </button>
        ))}
      </div>
      <h3>Alter</h3>
      <div className="me-ages">
        {AGES.map((age) => (
          <button
            key={age}
            type="button"
            className={p.age === age || (age === 15 && p.age > 15) ? 'me-age is-active' : 'me-age'}
            onClick={() => os.update((q) => ({ ...q, age: clampAge(age) }))}
          >
            {age === 15 ? '15+' : age}
          </button>
        ))}
      </div>
    </Page>
  );
}

function InfoPage() {
  const { kiosk } = useOs();
  return (
    <Page title="Über Computerfuchs">
      <div className="info-card">
        <Fox size={110} mood="wink" />
        <div>
          <strong className="info-name">Computerfuchs {__APP_VERSION__}</strong>
          <p>Ein Lerncomputer im Browser. Kostenlos, ohne Werbung und ohne Anmeldung.</p>
          <p>Alles, was du hier machst, bleibt auf diesem Gerät. Es gibt keinen Server, der etwas mitliest.</p>
        </div>
      </div>
      <ul className="info-list">
        <li>
          <strong>Mitmachen und Quelltext:</strong>{' '}
          {kiosk ? (
            <span>{REPO.replace('https://', '')}</span>
          ) : (
            <a href={REPO} target="_blank" rel="noreferrer">
              {REPO.replace('https://', '')}
            </a>
          )}
        </li>
        <li>
          <strong>Bilder:</strong> Fluent Emoji von Microsoft (MIT-Lizenz)
        </li>
        <li>
          <strong>Schriften:</strong> Nunito und Fredoka (SIL Open Font License)
        </li>
        <li>
          <strong>Lizenz:</strong> MIT
        </li>
      </ul>
    </Page>
  );
}

function GrownUpPage() {
  const os = useOs();
  const save = useSave();
  const p = os.profile;
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = async (file: File) => {
    const result = parseSaveFile(await file.text());
    if (!result.ok) {
      setMessage(result.reason);
      return;
    }
    const { added, replaced } = save.importSave(result.data);
    setMessage(`Geladen: ${added} neue und ${replaced} aktualisierte Profile.`);
  };

  return (
    <Page title="Für Erwachsene">
      <h3>Spielstand</h3>
      <p className="settings-intro">
        Der Fortschritt liegt nur in diesem Browser. Als Datei gesichert, lässt er sich auf einem anderen Gerät laden – oder auf
        einem Schul-PC, der beim Abmelden alles löscht.
      </p>
      <div className="settings-buttons">
        <button
          type="button"
          className="btn btn-sky"
          onClick={() => {
            const file = exportSave(save.data, new Date());
            downloadText(file.filename, file.text);
          }}
        >
          <Icon name="download" size={22} /> Alle Profile als Datei sichern
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => fileInput.current?.click()}>
          <Icon name="upload" size={22} /> Spielstand-Datei laden
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void load(file);
          }}
        />
      </div>
      {message && <p className="settings-note">{message}</p>}
      {!save.persistOk && (
        <p className="settings-warn">
          Achtung: Dieser Browser speichert gerade nichts dauerhaft (privater Modus oder Kiosk mit InPrivate). Bitte als Datei sichern.
        </p>
      )}

      <h3>Was der Desktop von {p.name} kann</h3>
      <p className="settings-intro">Normalerweise schaltet das Kind diese Funktionen im Maustraining selbst frei.</p>
      <div className="settings-stack">
        {FEATURES.map((f) => (
          <Toggle
            key={f}
            label={FEATURE_LABEL[f]}
            checked={p.features.includes(f)}
            onChange={(on) =>
              os.update((q) => ({ ...q, features: on ? [...new Set([...q.features, f])] : q.features.filter((x) => x !== f) }))
            }
          />
        ))}
      </div>

      <h3>Kiosk-Modus</h3>
      <p className="settings-intro">
        {os.kiosk
          ? 'Der Kiosk-Modus ist aktiv: kein Knopf zum Verlassen des Vollbilds, Ausschalten führt zurück zum Startbildschirm.'
          : 'Für einen Lerncomputer ohne Ausweg die Seite mit ?kiosk am Ende der Adresse öffnen und das Gerät im Kiosk-Modus des Betriebssystems betreiben. Die Anleitung steht im Projekt unter docs/CONCEPT.de.md.'}
      </p>

      <h3>Profil löschen</h3>
      {confirmDelete ? (
        <div className="settings-buttons">
          <button type="button" className="btn btn-danger" onClick={() => save.deleteProfile(p.id)}>
            <Icon name="trash" size={22} /> Ja, {p.name} wirklich löschen
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>
            Abbrechen
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(true)}>
          <Icon name="trash" size={22} /> Profil von {p.name} löschen …
        </button>
      )}
    </Page>
  );
}
