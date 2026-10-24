import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { emojiUrl, type EmojiName } from '../../core/emoji';
import {
  addFile, FS_ERROR_TEXT, isInside, nodeById, TRASH, validateName, type FileNode,
} from '../../core/files';
import { useLatest, useTimeouts } from '../../core/hooks';
import { loadDraft, loadPicture, newPictureId, saveDraft, savePicture, usePictureUrl } from '../../core/pictures';
import { sfx } from '../../core/sound';
import { speak } from '../../core/speech';
import { newId } from '../../core/storage';
import { Emoji } from '../../os/Emoji';
import { Fox } from '../../os/Fox';
import { Icon } from '../../os/Icon';
import { useOs, useWindow } from '../../os/osContext';
import type { PaintEngine } from './engine';
import { blobImage, urlImage, type Drawable } from './images';
import { Paper, type PaperEvent } from './Paper';
import { TEMPLATE_H, TEMPLATE_W, TEMPLATES, type Template } from './templates';
import { ToolIcon } from './ToolIcon';
import {
  COLORS, PAINT_MISSIONS, SIZE_NAMES, sizesFor, STAMP_SIZE_NAMES, STAMP_SIZES, STAMPS, TOOL_HINTS, TOOL_NAMES,
  toolsFor, type ToolId,
} from './tools';

interface Doc {
  /** Die Datei, in die „Speichern“ schreibt – null, solange das Bild neu ist */
  fileId: string | null;
  name: string;
  /** Seit dem letzten Speichern verändert */
  dirty: boolean;
}

/** Was nach der Frage „Erst speichern?“ weitergeht */
type Next = { kind: 'neu' } | { kind: 'oeffnen' } | { kind: 'datei'; id: string } | { kind: 'hintergrund' };

type Dialog =
  | { kind: 'neu' }
  | { kind: 'oeffnen' }
  | { kind: 'speichern'; then?: Next; copy?: boolean }
  | { kind: 'frage'; then: Next }
  | null;

const isPainting = (n: FileNode | undefined, files: FileNode[]): n is FileNode =>
  !!n && n.content?.type === 'gemalt' && n.parent !== TRASH && !isInside(files, n.id, TRASH);

export default function MalkastenApp() {
  const os = useOs();
  const win = useWindow();
  const { setTitle } = win;
  const group = os.group;
  const small = group === 'klein';
  const tools = toolsFor(group);
  const sizes = sizesFor(group);

  const [tool, setTool] = useState<ToolId>('pinsel');
  const [color, setColor] = useState(COLORS[0].hex);
  const [size, setSize] = useState(sizes[1]);
  const [stamp, setStamp] = useState<EmojiName>(STAMPS[0]);
  const [stampSize, setStampSize] = useState(STAMP_SIZES[1]);
  const [doc, setDoc] = useState<Doc>({ fileId: null, name: 'Mein Bild', dirty: false });
  const [history, setHistory] = useState({ undo: false, redo: false });
  const [dialog, setDialog] = useState<Dialog>(null);
  const [hint, setHint] = useState<{ text: string; n: number } | null>(null);
  const [showMissions, setShowMissions] = useState(true);
  const [cheer, setCheer] = useState(false);
  const [ready, setReady] = useState(false);

  const engine = useRef<PaintEngine | null>(null);
  const later = useTimeouts();
  const docRef = useLatest(doc);
  const profileRef = useLatest(os.profile);
  const hintCount = useRef(0);
  const missionsDone = useRef(new Set<string>());
  const colorsUsed = useRef(new Set<string>());
  const hinted = useRef(new Set<ToolId>());
  const draftTimer = useRef<number | undefined>(undefined);
  const saving = useRef(false);

  const say = (text: string) => {
    const n = ++hintCount.current;
    setHint({ text, n });
    speak(text);
    later(() => setHint((h) => (h?.n === n ? null : h)), 6500);
  };

  // ---------------------------------------------------------------------------
  // Aufgaben von Flinn
  // ---------------------------------------------------------------------------

  const progress = os.profile.progress.malkasten ?? {};
  const isDone = (id: string) => (progress[id]?.stars ?? 0) > 0;
  const firstOpen = PAINT_MISSIONS.findIndex((m) => !isDone(m.id));
  const currentMission = firstOpen >= 0 ? PAINT_MISSIONS[firstOpen] : null;

  useEffect(() => {
    if (showMissions && currentMission) speak(currentMission.text);
  }, [showMissions, currentMission]);

  const complete = (id: string) => {
    if ((profileRef.current.progress.malkasten?.[id]?.stars ?? 0) > 0 || missionsDone.current.has(id)) return;
    missionsDone.current.add(id);
    os.completeLevel('malkasten', id, 1);
    sfx.success();
    setCheer(true);
    later(() => setCheer(false), 2600);
  };

  const noteColor = (c: string) => {
    colorsUsed.current.add(c);
    if (colorsUsed.current.size >= 2) complete('farbe');
  };

  // ---------------------------------------------------------------------------
  // Entwurf: Was gerade auf dem Blatt ist, bleibt auch nach dem Schließen da.
  // ---------------------------------------------------------------------------

  const writeDraft = async () => {
    const e = engine.current;
    const blob = e ? await e.toBlob() : null;
    if (!blob) return;
    const d = docRef.current;
    await saveDraft(profileRef.current.id, { blob, fileId: d.fileId, name: d.name, dirty: d.dirty, saved: Date.now() });
  };
  const writeDraftRef = useLatest(writeDraft);

  const scheduleDraft = () => {
    window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(() => {
      draftTimer.current = undefined;
      void writeDraftRef.current();
    }, 700);
  };

  useEffect(
    () => () => {
      if (draftTimer.current === undefined) return;
      window.clearTimeout(draftTimer.current);
      void writeDraftRef.current();
    },
    [writeDraftRef],
  );

  useEffect(() => {
    setTitle(`${doc.name}${doc.dirty ? ' *' : ''} – Malkasten`);
    return () => setTitle(null);
  }, [setTitle, doc.name, doc.dirty]);

  const onChange = useLatest((kind: 'edit' | 'history' | 'reset') => {
    const e = engine.current;
    if (e) setHistory({ undo: e.canUndo, redo: e.canRedo });
    if (kind !== 'reset') setDoc((d) => (d.dirty ? d : { ...d, dirty: true }));
    scheduleDraft();
  });

  const onReady = (e: PaintEngine) => {
    engine.current = e;
    e.onChange = (kind) => onChange.current(kind);
    void loadDraft(profileRef.current.id).then(async (draft) => {
      if (draft) {
        const img = await blobImage(draft.blob);
        if (img && engine.current === e) {
          e.reset({ image: img });
          setDoc({ fileId: draft.fileId, name: draft.name, dirty: draft.dirty });
        }
      }
      setReady(true);
    });
  };

  // ---------------------------------------------------------------------------
  // Werkzeuge
  // ---------------------------------------------------------------------------

  const pickTool = (t: ToolId) => {
    sfx.tap();
    setTool(t);
    if (!hinted.current.has(t)) {
      hinted.current.add(t);
      say(TOOL_HINTS[t]);
    }
  };

  const pickColor = (hex: string) => {
    sfx.tap();
    setColor(hex);
    if (tool === 'radierer' || tool === 'pipette') setTool('pinsel');
  };

  const onAction = (a: PaperEvent) => {
    switch (a.kind) {
      case 'stroke':
        if (!a.eraser) {
          complete('strich');
          noteColor(a.color);
        }
        break;
      case 'shape':
        noteColor(a.color);
        break;
      case 'fill':
        if (!a.ok) {
          sfx.boing();
          say('Diese Fläche hat schon genau diese Farbe. Nimm eine andere Farbe oder klick woandershin.');
          return;
        }
        sfx.pop();
        complete('eimer');
        noteColor(a.color);
        break;
      case 'stamp':
        sfx.pop();
        break;
      case 'pick':
        sfx.click();
        setColor(a.color);
        setTool('pinsel');
        say('Farbe aufgenommen! Der Pinsel malt jetzt damit.');
        break;
    }
  };

  const undo = () => {
    const e = engine.current;
    if (!e || e.busy || !e.undo()) return;
    sfx.tap();
    complete('zurueck');
  };

  const redo = () => {
    const e = engine.current;
    if (!e || e.busy || !e.redo()) return;
    sfx.tap();
  };

  // ---------------------------------------------------------------------------
  // Speichern, Öffnen, Neu, Hintergrund
  // ---------------------------------------------------------------------------

  const usableFile = () => {
    const files = profileRef.current.files;
    const id = docRef.current.fileId;
    const node = id ? nodeById(files, id) : undefined;
    return isPainting(node, files) ? node : undefined;
  };

  /** name === null: in die geöffnete Datei schreiben. Sonst eine neue Datei in „Bilder“. */
  const writeFile = async (name: string | null): Promise<string | null> => {
    const e = engine.current;
    if (!e || saving.current) return null;
    saving.current = true;
    try {
      const blob = await e.toBlob();
      if (!blob) {
        say('Das Speichern hat leider nicht geklappt.');
        return null;
      }
      const picture = newPictureId();
      const durable = await savePicture(picture, blob);
      const files = profileRef.current.files;
      const current = name === null ? usableFile() : undefined;
      let id: string;
      let finalName: string;
      let nextFiles: FileNode[];
      if (current) {
        id = current.id;
        finalName = current.name;
        nextFiles = files.map((n) => (n.id === id ? { ...n, content: { type: 'gemalt', picture } } : n));
      } else {
        const r = addFile(files, 'bilder', name ?? docRef.current.name, { type: 'gemalt', picture }, newId(), new Date().toISOString());
        if (!r.ok || !r.id) {
          sfx.boing();
          say(r.ok ? 'Das Speichern hat leider nicht geklappt.' : FS_ERROR_TEXT[r.error]);
          return null;
        }
        id = r.id;
        finalName = nodeById(r.files, id)?.name ?? name ?? 'Mein Bild';
        nextFiles = r.files;
      }
      os.update((p) => ({ ...p, files: nextFiles }));
      setDoc({ fileId: id, name: finalName, dirty: false });
      complete('speichern');
      sfx.success();
      say(
        durable
          ? `Gespeichert! „${finalName}“ liegt jetzt im Ordner „Bilder“.`
          : `Gespeichert – aber dieser Browser behält Bilder nur, bis er geschlossen wird. Erwachsene können den Spielstand als Datei sichern.`,
      );
      scheduleDraft();
      return id;
    } finally {
      saving.current = false;
    }
  };

  const applyWallpaper = (id: string) => {
    os.update((p) => ({ ...p, settings: { ...p.settings, wallpaperFile: id } }));
    complete('hintergrund');
    os.toast({ title: 'Neuer Hintergrund', text: 'Dein eigenes Bild!', icon: 'artist-palette' });
  };

  const startNew = (t?: Template) => {
    const e = engine.current;
    if (!e) return;
    e.reset(t ? { paths: t.paths } : undefined);
    setDoc({ fileId: null, name: t?.fileName ?? 'Mein Bild', dirty: false });
    setDialog(null);
    sfx.whoosh();
    if (t) {
      setTool('eimer');
      hinted.current.add('eimer');
      say(`${t.name}! Nimm eine Farbe und klick mit dem Farbeimer in die Flächen.`);
    }
    scheduleDraft();
  };

  const openFile = async (id: string) => {
    const e = engine.current;
    const node = nodeById(profileRef.current.files, id);
    if (!e || !node?.content) {
      say('Diese Datei gibt es nicht mehr.');
      return;
    }
    let img: Drawable | null = null;
    if (node.content.type === 'gemalt') {
      const blob = await loadPicture(node.content.picture);
      img = blob ? await blobImage(blob) : null;
    } else if (node.content.type === 'bild') {
      img = await urlImage(emojiUrl(node.content.emoji));
    }
    if (!img) {
      sfx.boing();
      say('Dieses Bild lässt sich hier leider nicht öffnen.');
      return;
    }
    e.reset({ image: img });
    setDoc(node.content.type === 'gemalt' ? { fileId: node.id, name: node.name, dirty: false } : { fileId: null, name: `${node.name} bunt`, dirty: false });
    setDialog(null);
    sfx.whoosh();
    scheduleDraft();
  };

  const makeWallpaper = async () => {
    let id = usableFile()?.id ?? null;
    if (!id || docRef.current.dirty) {
      if (id) id = await writeFile(null);
      else if (small) id = await writeFile(docRef.current.name);
      else {
        setDialog({ kind: 'speichern', then: { kind: 'hintergrund' } });
        return;
      }
    }
    if (id) applyWallpaper(id);
  };

  const proceed = (next: Next) => {
    if (next.kind === 'neu') setDialog({ kind: 'neu' });
    else if (next.kind === 'oeffnen') setDialog({ kind: 'oeffnen' });
    else if (next.kind === 'datei') {
      setDialog(null);
      void openFile(next.id);
    } else {
      setDialog(null);
      void makeWallpaper();
    }
  };

  /** Erst fragen, wenn das Bild noch nicht gespeichert ist. */
  const guard = (next: Next) => {
    if (docRef.current.dirty) setDialog({ kind: 'frage', then: next });
    else proceed(next);
  };
  const guardRef = useLatest(guard);

  /** Speichern-Knopf: vorhandene Datei überschreiben, sonst nach dem Namen fragen (Kleine: gleich speichern). */
  const save = async (then?: Next) => {
    if (usableFile()) {
      if ((await writeFile(null)) && then) proceed(then);
    } else if (small) {
      if ((await writeFile(docRef.current.name)) && then) proceed(then);
    } else {
      setDialog({ kind: 'speichern', then });
    }
  };

  const submitSave = async (name: string, then?: Next, copy?: boolean) => {
    const id = await writeFile(copy || !usableFile() ? name : null);
    if (!id) return;
    setDialog(null);
    if (then?.kind === 'hintergrund') applyWallpaper(id);
    else if (then) proceed(then);
  };

  // Aus der Anzeige: „Im Malkasten bearbeiten“
  const handledNonce = useRef<number | null>(null);
  useEffect(() => {
    if (!ready || handledNonce.current === win.params.nonce) return;
    handledNonce.current = win.params.nonce;
    const id = win.params.file;
    if (id) later(() => guardRef.current({ kind: 'datei', id }), 0);
  }, [ready, win.params.nonce, win.params.file, later, guardRef]);

  // Tastenkürzel wie an jedem Computer: Strg+Z, Strg+Y, Strg+S
  const onKey = useLatest((e: KeyboardEvent) => {
    if (dialog || !(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if (k === 'y' || (k === 'z' && e.shiftKey)) {
      e.preventDefault();
      redo();
    } else if (k === 's') {
      e.preventDefault();
      void save();
    }
  });
  useEffect(() => {
    if (!win.focused) return;
    const handler = (e: KeyboardEvent) => onKey.current(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [win.focused, onKey]);

  // ---------------------------------------------------------------------------

  const showSizes = tool === 'pinsel' || tool === 'radierer' || tool === 'linie' || tool === 'rechteck' || tool === 'kreis';

  return (
    <div className={`paint group-${group}`}>
      <header className="paint-bar">
        <BarButton label="Neu" onClick={() => guard({ kind: 'neu' })}>
          <Icon name="plus" size={24} stroke={3} />
        </BarButton>
        <BarButton label="Öffnen" onClick={() => guard({ kind: 'oeffnen' })}>
          <Emoji name="file-folder" size={26} />
        </BarButton>
        <BarButton label="Speichern" onClick={() => void save()}>
          <Emoji name="floppy-disk" size={26} />
        </BarButton>
        {group === 'gross' && (
          <BarButton label="Speichern unter …" onClick={() => setDialog({ kind: 'speichern', copy: true })} secondary>
            <Emoji name="floppy-disk" size={22} />
          </BarButton>
        )}
        <BarButton label={small ? 'Hintergrund' : 'Als Hintergrund'} onClick={() => void makeWallpaper()}>
          <Emoji name="desktop-computer" size={26} />
        </BarButton>
        <span className="paint-sep" aria-hidden="true" />
        <BarButton label="Rückgängig" onClick={undo} disabled={!history.undo}>
          <Icon name="undo" size={24} stroke={2.8} />
        </BarButton>
        {!small && (
          <BarButton label="Wiederholen" onClick={redo} disabled={!history.redo} secondary>
            <Icon name="redo" size={24} stroke={2.8} />
          </BarButton>
        )}
        {/* Name und Sternchen für „nicht gespeichert“ stehen im Fenstertitel – wie an einem echten Computer. */}
        <span className="paint-gap" aria-hidden="true" />
        <button
          type="button"
          className={showMissions ? 'chip-btn is-on' : 'chip-btn'}
          onClick={() => setShowMissions((v) => !v)}
          aria-pressed={showMissions}
        >
          <Emoji name="fox" size={22} /> Aufgaben
        </button>
      </header>

      <div className="paint-body">
        <nav className="paint-tools" aria-label="Werkzeuge">
          {tools.map((t) => (
            <button
              key={t}
              type="button"
              className={t === tool ? 'paint-tool is-active' : 'paint-tool'}
              onClick={() => pickTool(t)}
              aria-pressed={t === tool}
              title={TOOL_NAMES[t]}
            >
              {t === 'stempel' ? <Emoji name={stamp} size={small ? 40 : 32} /> : <ToolIcon tool={t} color={color} size={small ? 44 : 34} />}
              <span>{TOOL_NAMES[t]}</span>
            </button>
          ))}
        </nav>

        <div className="paint-stage">
          <Paper
            tool={tool}
            color={color}
            size={size}
            stamp={stamp}
            stampSize={stampSize}
            disabled={dialog !== null || !ready}
            onReady={onReady}
            onAction={onAction}
          />
          {hint && (
            <div key={hint.n} className="paint-hint" role="status">
              <Fox size={40} mood="happy" />
              <p>{hint.text}</p>
            </div>
          )}
        </div>

        {showMissions && (
          <aside className="paint-missions" aria-label="Aufgaben von Flinn">
            <header className="paint-missions-head">
              <Fox size={44} mood={cheer ? 'cheer' : 'happy'} />
              <strong>{cheer ? 'Super, geschafft!' : 'Aufgaben von Flinn'}</strong>
            </header>
            <ol className="missions">
              {PAINT_MISSIONS.map((m, i) => {
                const done = isDone(m.id);
                return (
                  <li key={m.id} className={done ? 'mission is-done' : i === firstOpen ? 'mission is-current' : 'mission'}>
                    <span className="mission-check">{done ? <Icon name="check" size={16} stroke={3.4} /> : i + 1}</span>
                    <span>{m.text}</span>
                    {i === firstOpen && (
                      <button
                        type="button"
                        className="mission-speak"
                        onClick={() => speak(m.text, { force: true })}
                        aria-label="Aufgabe vorlesen"
                        title="Vorlesen"
                      >
                        <Icon name="speaker" size={18} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
            {firstOpen < 0 && <p className="missions-done">Alle Aufgaben geschafft – du bist ein Mal-Profi!</p>}
          </aside>
        )}
      </div>

      <footer className="paint-foot">
        {tool === 'stempel' ? (
          <>
            <div className="paint-swatches" role="group" aria-label="Stempel">
              {STAMPS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={s === stamp ? 'paint-stamp is-active' : 'paint-stamp'}
                  onClick={() => {
                    sfx.tap();
                    setStamp(s);
                  }}
                  aria-pressed={s === stamp}
                >
                  <Emoji name={s} size={30} />
                </button>
              ))}
            </div>
            <div className="paint-sizes" role="group" aria-label="Stempelgröße">
              {STAMP_SIZES.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  className={s === stampSize ? 'paint-size is-active' : 'paint-size'}
                  onClick={() => {
                    sfx.tap();
                    setStampSize(s);
                  }}
                  aria-pressed={s === stampSize}
                  aria-label={`Stempel ${STAMP_SIZE_NAMES[i]}`}
                  title={STAMP_SIZE_NAMES[i]}
                >
                  <Emoji name={stamp} size={14 + i * 8} />
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="paint-swatches" role="group" aria-label="Farben">
              {COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  className={c.hex === color && tool !== 'radierer' ? 'paint-swatch is-active' : 'paint-swatch'}
                  style={{ background: c.hex }}
                  onClick={() => pickColor(c.hex)}
                  aria-pressed={c.hex === color}
                  aria-label={c.name}
                  title={c.name}
                />
              ))}
              {group === 'gross' && (
                <label className="paint-swatch is-custom" title="Eigene Farbe" style={{ '--swatch': color } as CSSProperties}>
                  <input type="color" value={color} onChange={(e) => pickColor(e.target.value)} aria-label="Eigene Farbe" />
                </label>
              )}
            </div>
            {showSizes && (
              <div className="paint-sizes" role="group" aria-label="Dicke">
                {sizes.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    className={s === size ? 'paint-size is-active' : 'paint-size'}
                    onClick={() => {
                      sfx.tap();
                      setSize(s);
                    }}
                    aria-pressed={s === size}
                    aria-label={`Dicke: ${SIZE_NAMES[sizes.length === 3 ? i + 1 : i]}`}
                    title={SIZE_NAMES[sizes.length === 3 ? i + 1 : i]}
                  >
                    <span style={{ width: 6 + s / 3, height: 6 + s / 3, background: tool === 'radierer' ? '#fff' : color }} />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </footer>

      {dialog?.kind === 'neu' && <NewDialog onPick={startNew} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'oeffnen' && <OpenDialog onPick={(id) => void openFile(id)} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'speichern' && (
        <SaveDialog
          initial={dialog.copy && doc.fileId ? `${doc.name} (Kopie)` : doc.name}
          copy={dialog.copy}
          onSave={(name) => void submitSave(name, dialog.then, dialog.copy)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'frage' && (
        <AskDialog
          onSave={() => void save(dialog.then)}
          onDiscard={() => proceed(dialog.then)}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function BarButton({
  label,
  onClick,
  disabled,
  secondary,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** In schmalen Fenstern nur das Bild zeigen */
  secondary?: boolean;
  children: ReactNode;
}) {
  return (
    <button type="button" className={secondary ? 'paint-btn is-secondary' : 'paint-btn'} onClick={onClick} disabled={disabled} title={label}>
      {children}
      <span>{label}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Dialoge – innerhalb des Fensters, nicht über dem ganzen Desktop
// ---------------------------------------------------------------------------

function DialogFrame({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const win = useWindow();
  const closeRef = useLatest(onClose);
  useEffect(() => {
    if (!win.focused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [win.focused, closeRef]);
  return (
    <div
      className="paint-dialog-backdrop"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className={wide ? 'paint-dialog is-wide' : 'paint-dialog'} role="dialog" aria-modal="true" aria-label={title}>
        <header className="paint-dialog-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Schließen" title="Schließen">
            <Icon name="close" size={22} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function TemplateThumb({ template }: { template: Template }) {
  return (
    <svg className="paint-thumb-svg" viewBox={`0 0 ${TEMPLATE_W} ${TEMPLATE_H}`} aria-hidden="true">
      {template.paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

function NewDialog({ onPick, onClose }: { onPick: (t?: Template) => void; onClose: () => void }) {
  return (
    <DialogFrame title="Neues Bild" onClose={onClose} wide>
      <div className="paint-grid">
        <button type="button" className="paint-card" onClick={() => onPick()}>
          <span className="paint-thumb is-blank">
            <Icon name="plus" size={40} stroke={3} />
          </span>
          <span>Leeres Blatt</span>
        </button>
        {TEMPLATES.map((t) => (
          <button key={t.id} type="button" className="paint-card" onClick={() => onPick(t)}>
            <span className="paint-thumb">
              <TemplateThumb template={t} />
            </span>
            <span>
              <Emoji name={t.icon} size={22} /> {t.name}
            </span>
          </button>
        ))}
      </div>
    </DialogFrame>
  );
}

function PaintingThumb({ picture, name }: { picture: string; name: string }) {
  const url = usePictureUrl(picture);
  return <span className="paint-thumb">{url && <img src={url} alt={name} draggable={false} />}</span>;
}

function OpenDialog({ onPick, onClose }: { onPick: (id: string) => void; onClose: () => void }) {
  const { profile } = useOs();
  const files = profile.files;
  const visible = (n: FileNode) => n.parent !== TRASH && !isInside(files, n.id, TRASH);
  const paintings = files.filter((n) => n.content?.type === 'gemalt' && visible(n)).sort((a, b) => b.created.localeCompare(a.created));
  const pictures = files.filter((n) => n.content?.type === 'bild' && visible(n));
  return (
    <DialogFrame title="Bild öffnen" onClose={onClose} wide>
      <h3 className="paint-dialog-sub">Deine Bilder</h3>
      {paintings.length === 0 ? (
        <p className="paint-dialog-note">Du hast noch kein Bild gespeichert. Mal eins und klick dann auf „Speichern“!</p>
      ) : (
        <div className="paint-grid">
          {paintings.map((n) => (
            <button key={n.id} type="button" className="paint-card" onClick={() => onPick(n.id)}>
              {n.content?.type === 'gemalt' && <PaintingThumb picture={n.content.picture} name={n.name} />}
              <span>{n.name}</span>
            </button>
          ))}
        </div>
      )}
      {pictures.length > 0 && (
        <>
          <h3 className="paint-dialog-sub">Bilder zum Anmalen</h3>
          <div className="paint-grid is-small">
            {pictures.map((n) => (
              <button key={n.id} type="button" className="paint-card" onClick={() => onPick(n.id)}>
                <span className="paint-thumb is-emoji">{n.content?.type === 'bild' && <Emoji name={n.content.emoji} size={64} />}</span>
                <span>{n.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </DialogFrame>
  );
}

function SaveDialog({ initial, copy, onSave, onClose }: { initial: string; copy?: boolean; onSave: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const problem = validateName(name);
    if (problem) {
      sfx.boing();
      setError(FS_ERROR_TEXT[problem]);
      return;
    }
    onSave(name.trim());
  };
  return (
    <DialogFrame title={copy ? 'Speichern unter' : 'Bild speichern'} onClose={onClose}>
      <form className="paint-save" onSubmit={submit}>
        <p className="paint-dialog-note">
          <Emoji name="file-folder" size={24} /> Dein Bild kommt in den Ordner „Bilder“. Wie soll es heißen?
        </p>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          maxLength={60}
          autoFocus
          onFocus={(e) => e.target.select()}
          aria-label="Name des Bildes"
          spellCheck={false}
        />
        {error && <p className="paint-dialog-error">{error}</p>}
        <div className="paint-dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Abbrechen
          </button>
          <button type="submit" className="btn btn-leaf">
            <Emoji name="floppy-disk" size={24} /> Speichern
          </button>
        </div>
      </form>
    </DialogFrame>
  );
}

function AskDialog({ onSave, onDiscard, onClose }: { onSave: () => void; onDiscard: () => void; onClose: () => void }) {
  return (
    <DialogFrame title="Erst speichern?" onClose={onClose}>
      <div className="paint-ask">
        <Fox size={84} mood="wink" />
        <p>Dein Bild ist noch nicht gespeichert. Soll ich es erst speichern?</p>
      </div>
      <div className="paint-dialog-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Abbrechen
        </button>
        <button type="button" className="btn btn-berry" onClick={onDiscard}>
          Nicht speichern
        </button>
        <button type="button" className="btn btn-leaf" onClick={onSave}>
          <Emoji name="floppy-disk" size={24} /> Speichern
        </button>
      </div>
    </DialogFrame>
  );
}

