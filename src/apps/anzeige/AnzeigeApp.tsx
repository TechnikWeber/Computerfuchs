import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { WALLPAPERS } from '../../core/catalog';
import { displayName, isInside, nodeById, TRASH, TYPE_NAME, type FileContent, type FileNode } from '../../core/files';
import { usePictureUrl } from '../../core/pictures';
import { wallpaperPicture } from '../../core/profile';
import { playMelody, sfx } from '../../core/sound';
import { noteFrequency, songDuration, SONGS } from '../../core/songs';
import { speak, stopSpeaking } from '../../core/speech';
import { newId } from '../../core/storage';
import { CURSOR_SKINS, cursorPreview } from '../../os/cursors';
import { Emoji } from '../../os/Emoji';
import { Fox } from '../../os/Fox';
import { Icon } from '../../os/Icon';
import { useOs, useWindow } from '../../os/osContext';
import { Wallpaper } from '../../os/Wallpaper';

/** So viele Sticker passen auf den Desktop (wie beim Speichern). */
const MAX_STICKERS = 40;

/** Öffnet eine Datei – je nach Art als Bild, Lied oder Text. */
export default function AnzeigeApp() {
  const os = useOs();
  const win = useWindow();
  const { setTitle } = win;
  const id = win.params.file;
  const node = id ? nodeById(os.profile.files, id) : undefined;
  const trashed = !!node && (node.parent === TRASH || isInside(os.profile.files, node.id, TRASH));
  const name = node ? displayName(node, os.profile.settings.showExtensions) : null;

  useEffect(() => {
    setTitle(name);
    return () => setTitle(null);
  }, [setTitle, name]);

  if (!node || node.folder || !node.content) {
    return (
      <div className="viewer viewer-missing">
        <Fox size={110} mood="wink" />
        <h2>Diese Datei gibt es nicht mehr.</h2>
        <p>Vielleicht wurde sie für immer gelöscht.</p>
        <button type="button" className="btn btn-sky" onClick={() => os.openApp('dateien')}>
          <Emoji name="file-folder" size={28} /> Zu den Dateien
        </button>
      </div>
    );
  }

  if (trashed) {
    return (
      <div className="viewer viewer-missing">
        <Emoji name="wastebasket" size={110} />
        <h2>„{name}“ liegt im Papierkorb.</h2>
        <p>Hol die Datei zurück, dann kannst du sie wieder öffnen.</p>
        <button type="button" className="btn btn-sky" onClick={() => os.openApp('dateien', { folder: TRASH })}>
          <Emoji name="wastebasket" size={28} /> Papierkorb öffnen
        </button>
      </div>
    );
  }

  return (
    <div className="viewer">
      {/* key: Für eine andere Datei fängt alles von vorn an, z. B. ein laufendes Lied. */}
      <Content key={node.id} node={node} content={node.content} />
      <footer className="viewer-foot">
        <span className="chip">{TYPE_NAME[node.content.type]}</span>
        <span className="viewer-name">{name}</span>
      </footer>
    </div>
  );
}

function Content({ node, content }: { node: FileNode; content: FileContent }) {
  switch (content.type) {
    case 'bild':
      return (
        <div className="viewer-stage viewer-picture">
          <span className="viewer-art">
            <Emoji name={content.emoji} size="100%" alt={node.name} />
          </span>
        </div>
      );
    case 'gemalt':
      return <PaintingView node={node} picture={content.picture} />;
    case 'hintergrund':
      return <WallpaperView wallpaper={content.wallpaper} />;
    case 'zeiger':
      return <CursorView cursor={content.cursor} />;
    case 'sticker':
      return <StickerView emoji={content.emoji} name={node.name} />;
    case 'musik':
      return <SongView song={content.song} />;
    case 'text':
      return <TextView text={content.text} />;
  }
}

function Done({ text }: { text: string }) {
  return (
    <p className="viewer-done">
      <Icon name="check" size={20} stroke={3.4} /> {text}
    </p>
  );
}

function WallpaperView({ wallpaper }: { wallpaper: Extract<FileContent, { type: 'hintergrund' }>['wallpaper'] }) {
  const os = useOs();
  const active = os.profile.settings.wallpaper === wallpaper && !wallpaperPicture(os.profile);
  const title = WALLPAPERS.find((w) => w.id === wallpaper)?.name ?? 'Hintergrund';
  return (
    <div className="viewer-stage viewer-wallpaper">
      <div className="viewer-wallpaper-frame">
        <Wallpaper id={wallpaper} />
      </div>
      <div className="viewer-actions">
        {active ? (
          <Done text="Das ist dein Hintergrund." />
        ) : (
          <button
            type="button"
            className="btn btn-leaf"
            onClick={() => {
              sfx.success();
              os.update((p) => ({ ...p, settings: { ...p.settings, wallpaper, wallpaperFile: undefined } }));
              os.toast({ title: 'Neuer Hintergrund', text: title, icon: 'artist-palette' });
            }}
          >
            <Emoji name="artist-palette" size={28} /> Als Hintergrund festlegen
          </button>
        )}
      </div>
    </div>
  );
}

/** Ein im Malkasten gemaltes Bild: ansehen, weitermalen, als Hintergrund festlegen. */
function PaintingView({ node, picture }: { node: FileNode; picture: string }) {
  const os = useOs();
  const url = usePictureUrl(picture);
  const active = os.profile.settings.wallpaperFile === node.id;
  return (
    <div className="viewer-stage viewer-painting">
      <div className="viewer-painting-frame">{url && <img src={url} alt={node.name} draggable={false} />}</div>
      <div className="viewer-actions is-row">
        <button type="button" className="btn btn-sky" onClick={() => os.openApp('malkasten', { file: node.id })}>
          <Emoji name="artist-palette" size={28} /> Im Malkasten weitermalen
        </button>
        {active ? (
          <Done text="Das ist dein Hintergrund." />
        ) : (
          <button
            type="button"
            className="btn btn-leaf"
            onClick={() => {
              sfx.success();
              os.update((p) => ({ ...p, settings: { ...p.settings, wallpaperFile: node.id } }));
              os.toast({ title: 'Neuer Hintergrund', text: node.name, icon: 'artist-palette' });
            }}
          >
            <Emoji name="desktop-computer" size={28} /> Als Hintergrund festlegen
          </button>
        )}
      </div>
    </div>
  );
}

function CursorView({ cursor }: { cursor: Extract<FileContent, { type: 'zeiger' }>['cursor'] }) {
  const os = useOs();
  const active = os.profile.settings.cursorSkin === cursor;
  const skin = CURSOR_SKINS.find((s) => s.id === cursor) ?? CURSOR_SKINS[0];
  return (
    <div className="viewer-stage viewer-cursor">
      <div className="viewer-cursor-pad">
        <img src={cursorPreview(cursor, 160)} width={160} height={160} alt={skin.name} />
      </div>
      <div className="viewer-actions">
        {active ? (
          <Done text="Das ist dein Mauszeiger." />
        ) : (
          <button
            type="button"
            className="btn btn-leaf"
            onClick={() => {
              sfx.success();
              os.update((p) => ({ ...p, settings: { ...p.settings, cursorSkin: cursor } }));
              os.toast({ title: 'Neuer Mauszeiger', text: skin.name, icon: 'computer-mouse' });
            }}
          >
            <Emoji name="computer-mouse" size={28} /> Als Mauszeiger verwenden
          </button>
        )}
      </div>
    </div>
  );
}

function StickerView({ emoji, name }: { emoji: Extract<FileContent, { type: 'sticker' }>['emoji']; name: string }) {
  const os = useOs();
  const count = os.profile.stickers.length;
  const [placed, setPlaced] = useState(0);
  return (
    <div className="viewer-stage viewer-sticker">
      <span className="viewer-art is-small">
        <Emoji name={emoji} size="100%" alt={name} />
      </span>
      <div className="viewer-actions">
        <button
          type="button"
          className="btn btn-berry"
          disabled={count >= MAX_STICKERS}
          onClick={() => {
            sfx.pop();
            // Irgendwo in die Mitte – verschieben kann man ihn danach selbst.
            const x = 0.25 + Math.random() * 0.5;
            const y = 0.2 + Math.random() * 0.45;
            os.update((p) => ({ ...p, stickers: [...p.stickers, { id: newId(), emoji, x, y }] }));
            setPlaced((n) => n + 1);
          }}
        >
          <Emoji name="sparkles" size={28} /> Auf den Desktop kleben
        </button>
        {count >= MAX_STICKERS && <p className="viewer-note">Der Desktop ist voll. Zieh erst ein paar Sticker auf den Papierkorb.</p>}
        {placed > 0 && count < MAX_STICKERS && (
          <Done text={placed === 1 ? 'Klebt! Du kannst ihn auf dem Desktop verschieben.' : `${placed} Sticker geklebt!`} />
        )}
      </div>
    </div>
  );
}

function SongView({ song: songId }: { song: Extract<FileContent, { type: 'musik' }>['song'] }) {
  const os = useOs();
  const song = SONGS[songId];
  const [run, setRun] = useState(0);
  const [playing, setPlaying] = useState(false);
  const stop = useRef<(() => void) | null>(null);

  // Fenster zu oder andere Datei: Musik aus.
  useEffect(
    () => () => {
      stop.current?.();
      stop.current = null;
    },
    [],
  );

  const play = () => {
    stop.current?.();
    stopSpeaking();
    const notes = song.notes.map(([tone, beats]): [number, number] => [noteFrequency(tone), beats]);
    stop.current = playMelody(notes, song.bpm, () => {
      stop.current = null;
      setPlaying(false);
    });
    setRun((r) => r + 1);
    setPlaying(true);
  };

  const halt = () => {
    stop.current?.();
    stop.current = null;
    setPlaying(false);
  };

  const seconds = Math.round(songDuration(song));
  return (
    <div className="viewer-stage viewer-song">
      <div className={playing ? 'song-disc is-playing' : 'song-disc'}>
        <Emoji name="optical-disk" size={180} />
        <span className="song-notes" aria-hidden="true">
          <Emoji name="musical-notes" size={56} />
        </span>
      </div>
      <h2 className="song-title">{song.title}</h2>
      <div className="song-bar" aria-hidden="true">
        {playing && <span key={run} style={{ '--song-s': `${seconds}s` } as CSSProperties} />}
      </div>
      <p className="song-time">
        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')} Minuten
      </p>
      <div className="viewer-actions">
        {playing ? (
          <button type="button" className="btn btn-berry" onClick={halt}>
            <Icon name="stop" size={24} /> Anhalten
          </button>
        ) : (
          <button type="button" className="btn btn-leaf btn-big" onClick={play} autoFocus>
            <Icon name="play" size={26} /> Abspielen
          </button>
        )}
      </div>
      {!os.profile.settings.sound && (
        <p className="viewer-note">
          <Icon name="speaker-off" size={20} /> Der Ton ist aus. Schalte ihn unten rechts am Lautsprecher ein.
        </p>
      )}
    </div>
  );
}

function TextView({ text }: { text: string }) {
  return (
    <div className="viewer-stage viewer-text">
      <div className="paper">
        <pre>{text}</pre>
      </div>
      <div className="viewer-actions">
        <button type="button" className="btn btn-sky btn-small" onClick={() => speak(text, { force: true })}>
          <Icon name="speaker" size={20} /> Vorlesen
        </button>
      </div>
    </div>
  );
}
