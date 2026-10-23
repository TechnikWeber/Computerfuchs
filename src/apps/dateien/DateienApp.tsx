import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import { formatBytes } from '../../core/bytes';
import { createDoubleClick } from '../../core/dblclick';
import {
  FS_ERROR_TEXT, MISSIONS, ROOT, SEED, SYSTEM_FOLDERS, TRASH, TYPE_NAME, childrenOf, copy, createFolder, displayName,
  emptyTrash, fakeSize, folderName, isFolder, isSystemFolder, move, nodeById, parentOf, pathOf, purge, rename, restore,
  restoreSeed, systemChildren, trash, type FileNode, type FsEvent, type FsResult,
} from '../../core/files';
import { useLatest, useTimeouts } from '../../core/hooks';
import { hasFeature } from '../../core/profile';
import { sfx } from '../../core/sound';
import { speak } from '../../core/speech';
import { newId } from '../../core/storage';
import { ContextMenu, type MenuItem } from '../../os/ContextMenu';
import { Emoji } from '../../os/Emoji';
import { Fox } from '../../os/Fox';
import { Icon } from '../../os/Icon';
import { useOs, useWindow } from '../../os/osContext';
import { FileIcon } from './FileIcon';

interface Entry {
  id: string;
  system: boolean;
  node?: FileNode;
  label: string;
  isFolder: boolean;
}

interface Press {
  entry: Entry;
  x: number;
  y: number;
  pointerId: number;
  canDrag: boolean;
}

/** So groß ist die „Festplatte“ – damit die Speicheranzeige etwas zu zeigen hat. */
const CAPACITY = 64_000_000;

const nowIso = () => new Date().toISOString();

/** Der Datei-Explorer: Ordner, Ziehen und Ablegen, Papierkorb – und Flinns Aufgaben dazu. */
export default function DateienApp() {
  const os = useOs();
  const win = useWindow();
  const { setTitle } = win;
  const files = os.profile.files;
  const showExt = os.profile.settings.showExtensions;
  const canRight = hasFeature(os.profile, 'rightClick');
  const canDouble = hasFeature(os.profile, 'doubleClick');
  const rootRef = useRef<HTMLDivElement>(null);
  const later = useTimeouts();

  const [folder, setFolder] = useState<string>(() =>
    win.params.folder && isFolder(files, win.params.folder) ? win.params.folder : ROOT,
  );
  const [history, setHistory] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; value: string } | null>(null);
  const [hint, setHint] = useState<{ text: string; n: number } | null>(null);
  const [clipboard, setClipboard] = useState<{ id: string; cut: boolean } | null>(null);
  const [events, setEvents] = useState<FsEvent[]>([]);
  const [confirm, setConfirm] = useState<'empty' | 'purge' | null>(null);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; over: string | null } | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const [showMissions, setShowMissions] = useState(true);
  const [cheer, setCheer] = useState(false);
  const press = useRef<Press | null>(null);
  const missionsDone = useRef(new Set<string>());
  const hintCount = useRef(0);
  const detect = useMemo(() => createDoubleClick(os.profile.settings.doubleClickMs, 18), [os.profile.settings.doubleClickMs]);

  // Öffnet jemand die Dateien erneut mit einem Ordner (z. B. über den Papierkorb), dorthin wechseln.
  const [seenNonce, setSeenNonce] = useState(win.params.nonce);
  if (seenNonce !== win.params.nonce) {
    setSeenNonce(win.params.nonce);
    const f = win.params.folder;
    if (f && isFolder(files, f) && f !== folder) {
      setHistory((h) => [...h, folder]);
      setFolder(f);
      setSelected(null);
    }
  }

  // Gibt es den Ordner nicht mehr (gelöscht), zeigt die App „Mein Computer“.
  const current = isFolder(files, folder) ? folder : ROOT;
  const inTrash = current === TRASH;

  const title = `Dateien – ${folderName(files, current)}`;
  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [setTitle, title]);

  const entries: Entry[] = useMemo(() => {
    const list: Entry[] = [];
    if (current === ROOT) {
      for (const s of systemChildren(ROOT)) list.push({ id: s.id, system: true, label: s.name, isFolder: true });
    }
    for (const n of childrenOf(files, current)) {
      list.push({ id: n.id, system: false, node: n, label: displayName(n, showExt), isFolder: !!n.folder });
    }
    return list;
  }, [files, current, showExt]);

  const say = (text: string) => {
    const n = ++hintCount.current;
    setHint({ text, n });
    speak(text);
    later(() => setHint((h) => (h?.n === n ? null : h)), 6000);
  };

  // ---------------------------------------------------------------------------
  // Aufgaben
  // ---------------------------------------------------------------------------

  const progress = os.profile.progress.dateien ?? {};
  const isDone = (id: string) => (progress[id]?.stars ?? 0) > 0;
  const firstOpen = MISSIONS.findIndex((m) => !isDone(m.id));
  const currentMission = firstOpen >= 0 ? MISSIONS[firstOpen] : null;

  useEffect(() => {
    if (showMissions && currentMission) speak(currentMission.text);
  }, [showMissions, currentMission]);

  const checkMissions = (f: FileNode[], ev: FsEvent[]) => {
    let any = false;
    for (const m of MISSIONS) {
      if (isDone(m.id) || missionsDone.current.has(m.id) || !m.check(f, ev)) continue;
      missionsDone.current.add(m.id);
      os.completeLevel('dateien', m.id, 1);
      any = true;
    }
    if (any) {
      sfx.success();
      setCheer(true);
      later(() => setCheer(false), 2600);
    }
  };

  const addEvent = (e: FsEvent): FsEvent[] => {
    const next = [...events.slice(-40), e];
    setEvents(next);
    return next;
  };

  /** Ergebnis einer Datei-Operation übernehmen – oder erklären, warum es nicht geht. */
  const apply = (r: FsResult, ev?: FsEvent): boolean => {
    if (!r.ok) {
      sfx.boing();
      say(FS_ERROR_TEXT[r.error]);
      return false;
    }
    const nextEvents = ev ? addEvent(ev) : events;
    if (r.files !== files) os.update((p) => ({ ...p, files: r.files }));
    checkMissions(r.files, nextEvents);
    return true;
  };

  // ---------------------------------------------------------------------------
  // Aktionen
  // ---------------------------------------------------------------------------

  const navigate = (id: string) => {
    if (id === current) return;
    setHistory((h) => [...h.slice(-30), current]);
    setFolder(id);
    setSelected(null);
    setRenaming(null);
    checkMissions(files, addEvent({ kind: 'navigate', id }));
  };

  const back = () => {
    const prev = history[history.length - 1];
    if (prev === undefined) return;
    sfx.tap();
    setHistory((h) => h.slice(0, -1));
    setFolder(prev);
    setSelected(null);
  };

  const up = () => {
    const parent = parentOf(files, current);
    if (parent) {
      sfx.tap();
      navigate(parent);
    }
  };

  const open = (e: Entry) => {
    sfx.tap();
    if (inTrash) {
      say(
        e.isFolder
          ? 'Ordner im Papierkorb kann man nicht öffnen. Hol ihn erst zurück.'
          : 'Was im Papierkorb liegt, kann man nicht öffnen. Hol es erst zurück.',
      );
      return;
    }
    if (e.isFolder) {
      navigate(e.id);
      return;
    }
    os.openApp('anzeige', { file: e.id });
    checkMissions(files, addEvent({ kind: 'open', id: e.id }));
  };

  const startRename = (id: string) => {
    if (isSystemFolder(id)) {
      sfx.boing();
      say(FS_ERROR_TEXT.system);
      return;
    }
    const node = nodeById(files, id);
    if (node) {
      setSelected(id);
      setRenaming({ id, value: node.name });
    }
  };

  /** Mit Enter bleibt man bei einem Fehler im Feld; wer woanders hinklickt, behält den alten Namen. */
  const commitRename = (fromBlur: boolean) => {
    if (!renaming) return;
    const r = rename(files, renaming.id, renaming.value);
    if (apply(r) || fromBlur) setRenaming(null);
  };

  const newFolder = () => {
    if (inTrash) return;
    const id = newId();
    const r = createFolder(files, current, 'Neuer Ordner', id, nowIso());
    if (r.ok && apply(r)) {
      sfx.tap();
      setSelected(id);
      setRenaming({ id, value: nodeById(r.files, id)?.name ?? 'Neuer Ordner' });
    }
  };

  const toTrash = (id: string) => {
    if (apply(trash(files, id))) {
      sfx.whoosh();
      setSelected(null);
      os.toast({ title: 'Im Papierkorb', text: 'Von dort kannst du es zurückholen.', icon: 'wastebasket' });
    }
  };

  const removeSelected = () => {
    if (!selected) return;
    if (isSystemFolder(selected)) {
      sfx.boing();
      say(FS_ERROR_TEXT.system);
      return;
    }
    if (inTrash) setConfirm('purge');
    else toTrash(selected);
  };

  const restoreItem = (id: string) => {
    const from = nodeById(files, id)?.trashedFrom ?? ROOT;
    if (apply(restore(files, id), { kind: 'restore', id })) {
      sfx.success();
      setSelected(null);
      os.toast({
        title: 'Zurückgeholt',
        text: `Wieder in „${isFolder(files, from) ? folderName(files, from) : 'Mein Computer'}“.`,
        icon: 'sparkles',
      });
    }
  };

  const toClipboard = (id: string | null, cut: boolean) => {
    if (!id || isSystemFolder(id) || inTrash) return;
    setClipboard({ id, cut });
    os.toast({
      title: cut ? 'Ausgeschnitten' : 'Kopiert',
      text: 'Öffne einen Ordner und drück Strg und V zum Einfügen.',
      icon: 'memo',
    });
  };

  const paste = () => {
    if (!clipboard || inTrash) return;
    const r = clipboard.cut
      ? move(files, clipboard.id, current)
      : copy(files, clipboard.id, current, newId, nowIso());
    if (apply(r)) {
      sfx.tap();
      if (clipboard.cut) setClipboard(null);
      if (r.ok && r.id) setSelected(r.id);
    }
  };

  const toggleExtensions = () => {
    sfx.tap();
    os.update((p) => ({ ...p, settings: { ...p.settings, showExtensions: !p.settings.showExtensions } }));
  };

  // ---------------------------------------------------------------------------
  // Maus: auswählen, öffnen, ziehen
  // ---------------------------------------------------------------------------

  const dropTargetAt = (x: number, y: number, dragging: string): string | null => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop]');
    const id = el?.dataset.drop;
    return id && id !== dragging ? id : null;
  };

  const local = (x: number, y: number) => {
    const r = rootRef.current?.getBoundingClientRect();
    return r ? { x: x - r.left, y: y - r.top } : { x, y };
  };

  const onItemDown = (e: PointerEvent<HTMLElement>, entry: Entry) => {
    e.stopPropagation();
    if (e.button !== 0 || renaming?.id === entry.id) return;
    if (canDouble && detect({ x: e.clientX, y: e.clientY, t: e.timeStamp, target: entry.id })) {
      press.current = null;
      open(entry);
      return;
    }
    sfx.click();
    setSelected(entry.id);
    e.currentTarget.setPointerCapture(e.pointerId);
    press.current = { entry, x: e.clientX, y: e.clientY, pointerId: e.pointerId, canDrag: !entry.system && !inTrash };
  };

  const onItemMove = (e: PointerEvent<HTMLElement>) => {
    const p = press.current;
    if (!p || p.pointerId !== e.pointerId || !p.canDrag) return;
    if (!drag && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 8) return;
    const at = local(e.clientX, e.clientY);
    setDrag({ id: p.entry.id, x: at.x, y: at.y, over: dropTargetAt(e.clientX, e.clientY, p.entry.id) });
  };

  const onItemUp = (e: PointerEvent<HTMLElement>) => {
    const p = press.current;
    press.current = null;
    if (!p || p.pointerId !== e.pointerId) return;
    if (!drag) {
      // Wer den Doppelklick noch nicht kennt, öffnet mit einem Klick – wie auf dem Desktop.
      if (!canDouble) open(p.entry);
      return;
    }
    const target = dropTargetAt(e.clientX, e.clientY, p.entry.id);
    setDrag(null);
    if (!target || target === parentOf(files, p.entry.id)) return;
    if (target === TRASH) toTrash(p.entry.id);
    else if (apply(move(files, p.entry.id, target))) sfx.whoosh();
  };

  const cancelPress = () => {
    press.current = null;
    setDrag(null);
  };

  const itemMenu = (e: MouseEvent, entry: Entry) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(entry.id);
    if (!canRight) {
      say('Den Rechtsklick lernst du im Maustraining beim Farbenzauber. Bis dahin helfen dir die Knöpfe oben.');
      return;
    }
    let items: MenuItem[];
    if (inTrash) {
      items = [
        { label: 'Wiederherstellen', icon: 'sparkles', onSelect: () => restoreItem(entry.id) },
        { label: 'Endgültig löschen', icon: 'wastebasket', onSelect: () => setConfirm('purge') },
      ];
    } else if (entry.system) {
      items = [{ label: 'Öffnen', icon: 'file-folder', onSelect: () => open(entry) }];
    } else {
      items = [
        { label: 'Öffnen', icon: entry.isFolder ? 'file-folder' : 'open-book', onSelect: () => open(entry) },
        { label: 'Umbenennen', icon: 'memo', onSelect: () => startRename(entry.id) },
        { label: 'Kopieren', icon: 'package', onSelect: () => toClipboard(entry.id, false) },
        { label: 'Ausschneiden', icon: 'package', onSelect: () => toClipboard(entry.id, true) },
        { label: 'In den Papierkorb', icon: 'wastebasket', onSelect: () => toTrash(entry.id) },
      ];
    }
    setMenu({ x: e.clientX, y: e.clientY, items });
  };

  const backgroundMenu = (e: MouseEvent) => {
    e.preventDefault();
    if (!canRight || inTrash) return;
    const items: MenuItem[] = [{ label: 'Neuer Ordner', icon: 'file-folder', onSelect: newFolder }];
    if (clipboard) items.push({ label: 'Einfügen', icon: 'package', onSelect: paste });
    items.push({
      label: showExt ? 'Endungen ausblenden' : 'Endungen anzeigen',
      icon: 'magnifying-glass-tilted-left',
      onSelect: toggleExtensions,
    });
    setMenu({ x: e.clientX, y: e.clientY, items });
  };

  // ---------------------------------------------------------------------------
  // Tastatur – nur, wenn dieses Fenster vorne ist und niemand gerade tippt
  // ---------------------------------------------------------------------------

  const onKey = useLatest((e: KeyboardEvent) => {
    if (renaming || (e.target instanceof HTMLElement && e.target.closest('input, textarea'))) return;
    if (confirm) {
      if (e.key === 'Escape') setConfirm(null);
      return;
    }
    const ctrl = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();
    if (ctrl && key === 'c') toClipboard(selected, false);
    else if (ctrl && key === 'x') toClipboard(selected, true);
    else if (ctrl && key === 'v') paste();
    else if (e.key === 'Delete') removeSelected();
    else if (e.key === 'F2' && selected) startRename(selected);
    else if (e.key === 'Enter' && selected) {
      const entry = entries.find((x) => x.id === selected);
      if (entry) open(entry);
    } else if (e.key === 'Backspace') back();
    else return;
    e.preventDefault();
  });

  useEffect(() => {
    if (!win.focused) return;
    const handler = (e: KeyboardEvent) => onKey.current(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [win.focused, onKey]);

  // ---------------------------------------------------------------------------
  // Anzeige
  // ---------------------------------------------------------------------------

  const sel = entries.find((x) => x.id === selected);
  const used = files.reduce((sum, n) => sum + fakeSize(n), 0);
  const trashCount = childrenOf(files, TRASH).length;
  const missingSeeds = Object.values(SEED).some((id) => !nodeById(files, id));

  let status: string;
  if (sel?.node?.content) {
    status = `${sel.label} · ${TYPE_NAME[sel.node.content.type]} · ${formatBytes(fakeSize(sel.node))}`;
  } else if (sel) {
    status = `${sel.label} · Ordner`;
  } else {
    status = `${entries.length} ${entries.length === 1 ? 'Objekt' : 'Objekte'}`;
  }

  const path = inTrash ? [{ id: TRASH, name: 'Papierkorb' }] : pathOf(files, current);

  return (
    <div
      ref={rootRef}
      className={drag ? 'files is-dragging' : 'files'}
      onPointerDown={() => setSelected(null)}
      onContextMenu={backgroundMenu}
    >
      <aside className="files-side" aria-label="Orte" onPointerDown={(e) => e.stopPropagation()}>
        {SYSTEM_FOLDERS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={['files-place', current === s.id ? 'is-active' : '', drag?.over === s.id ? 'is-over' : '']
              .filter(Boolean)
              .join(' ')}
            data-drop={s.id}
            onClick={() => {
              sfx.tap();
              navigate(s.id);
            }}
          >
            <Emoji name={s.icon} size={30} />
            <span className="files-place-name">{s.name}</span>
            {s.id === TRASH && trashCount > 0 && <span className="files-count">{trashCount}</span>}
          </button>
        ))}
      </aside>

      <section className="files-main">
        <div className="files-toolbar" onPointerDown={(e) => e.stopPropagation()}>
          <button type="button" className="icon-btn" onClick={back} disabled={history.length === 0} aria-label="Zurück" title="Zurück">
            <Icon name="back" />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={up}
            disabled={current === ROOT || inTrash}
            aria-label="Eine Ebene nach oben"
            title="Eine Ebene nach oben"
          >
            <Icon name="up" />
          </button>
          <nav className="files-path" aria-label="Pfad">
            {path.map((p, i) => (
              <span key={p.id} className="files-crumb">
                {i > 0 && <span className="files-sep">›</span>}
                <button
                  type="button"
                  className={drag?.over === p.id ? 'is-over' : undefined}
                  onClick={() => navigate(p.id)}
                  data-drop={inTrash ? undefined : p.id}
                >
                  {p.name}
                </button>
              </span>
            ))}
          </nav>
          <div className="files-actions">
            {inTrash ? (
              <>
                <button
                  type="button"
                  className="btn btn-leaf btn-small"
                  onClick={() => selected && restoreItem(selected)}
                  disabled={!selected}
                >
                  <Icon name="replay" size={18} /> Wiederherstellen
                </button>
                <button type="button" className="btn btn-ghost btn-small" onClick={() => setConfirm('empty')} disabled={trashCount === 0}>
                  <Icon name="trash" size={18} /> Leeren
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-sun btn-small" onClick={newFolder}>
                  <Icon name="plus" size={18} /> Neuer Ordner
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  onClick={() => selected && startRename(selected)}
                  disabled={!selected || !!sel?.system}
                >
                  Umbenennen
                </button>
                <button type="button" className="btn btn-ghost btn-small" onClick={removeSelected} disabled={!selected || !!sel?.system}>
                  <Icon name="trash" size={18} /> Löschen
                </button>
              </>
            )}
            <button
              type="button"
              className={showExt ? 'chip-btn is-on' : 'chip-btn'}
              onClick={toggleExtensions}
              aria-pressed={showExt}
              title="Dateiendungen wie .jpg anzeigen"
            >
              .jpg
            </button>
            <button
              type="button"
              className={showMissions ? 'chip-btn is-on' : 'chip-btn'}
              onClick={() => setShowMissions((v) => !v)}
              aria-pressed={showMissions}
              aria-label="Aufgaben von Flinn"
              title="Aufgaben von Flinn"
            >
              <Fox size={24} />
            </button>
          </div>
        </div>

        <div className="files-grid" data-drop={inTrash ? undefined : current}>
          {entries.map((e) => (
            <div
              key={e.id}
              className={[
                'file-item',
                selected === e.id ? 'is-selected' : '',
                drag?.over === e.id ? 'is-over' : '',
                drag?.id === e.id ? 'is-dragged' : '',
                clipboard?.cut && clipboard.id === e.id ? 'is-cut' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              data-drop={e.isFolder && !inTrash ? e.id : undefined}
              data-id={e.id}
              onPointerDown={(ev) => onItemDown(ev, e)}
              onPointerMove={onItemMove}
              onPointerUp={onItemUp}
              onPointerCancel={cancelPress}
              onContextMenu={(ev) => itemMenu(ev, e)}
              role="button"
              tabIndex={0}
              aria-label={e.label}
              aria-pressed={selected === e.id}
            >
              <FileIcon node={e.node} systemId={e.system ? e.id : undefined} size={64} />
              {renaming?.id === e.id ? (
                <input
                  className="file-rename"
                  value={renaming.value}
                  maxLength={60}
                  autoFocus
                  onFocus={(ev) => ev.currentTarget.select()}
                  onChange={(ev) => setRenaming({ id: e.id, value: ev.target.value })}
                  onKeyDown={(ev) => {
                    ev.stopPropagation();
                    if (ev.key === 'Enter') commitRename(false);
                    if (ev.key === 'Escape') {
                      ev.currentTarget.dataset.cancel = '1';
                      setRenaming(null);
                    }
                  }}
                  onBlur={(ev) => {
                    if (!ev.currentTarget.dataset.cancel) commitRename(true);
                  }}
                  onPointerDown={(ev) => ev.stopPropagation()}
                  aria-label="Neuer Name"
                />
              ) : (
                <span className="file-label">{e.label}</span>
              )}
            </div>
          ))}
          {entries.length === 0 && (
            <p className="files-empty">{inTrash ? 'Der Papierkorb ist leer.' : 'Dieser Ordner ist leer.'}</p>
          )}
        </div>

        <footer className="files-status">
          <span className="files-status-text">{status}</span>
          {!canDouble && <span className="files-tip">Ein Klick öffnet</span>}
          {current === ROOT && (
            <span className="files-disk" title="So viel Platz ist schon belegt">
              <span className="files-disk-bar">
                <span style={{ width: `${Math.max(2, Math.min(100, (used / CAPACITY) * 100))}%` }} />
              </span>
              {formatBytes(used)} von {formatBytes(CAPACITY)}
            </span>
          )}
        </footer>
      </section>

      {showMissions && (
        <aside className="files-missions" aria-label="Aufgaben von Flinn" onPointerDown={(e) => e.stopPropagation()}>
          <header className="files-missions-head">
            <Fox size={48} mood={cheer ? 'cheer' : 'happy'} />
            <strong>{cheer ? 'Super, geschafft!' : 'Aufgaben von Flinn'}</strong>
          </header>
          <ol className="missions">
            {MISSIONS.map((m, i) => {
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
          {firstOpen < 0 && <p className="missions-done">Alle Aufgaben geschafft – du bist ein Datei-Profi!</p>}
          {missingSeeds && (
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => {
                sfx.tap();
                apply({ ok: true, files: restoreSeed(files, nowIso()) });
              }}
            >
              Übungsdateien zurückholen
            </button>
          )}
        </aside>
      )}

      {drag && (
        <div className="file-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <FileIcon node={nodeById(files, drag.id)} size={56} />
        </div>
      )}

      {confirm && (
        <div className="files-confirm" onPointerDown={(e) => e.stopPropagation()}>
          <div className="files-confirm-box" role="alertdialog" aria-label="Wirklich löschen?">
            <Emoji name="wastebasket" size={64} />
            <p>
              {confirm === 'empty'
                ? 'Papierkorb wirklich leeren? Was darin liegt, ist danach für immer weg.'
                : 'Für immer löschen? Das kann man nicht rückgängig machen.'}
            </p>
            <div className="files-confirm-actions">
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  if (confirm === 'empty') apply({ ok: true, files: emptyTrash(files) });
                  else if (selected) apply(purge(files, selected));
                  sfx.whoosh();
                  setConfirm(null);
                  setSelected(null);
                }}
              >
                Ja, löschen
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirm(null)} autoFocus>
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />}
      {hint && (
        <div className="files-hint" role="status" onPointerDown={(e) => e.stopPropagation()} onClick={() => setHint(null)}>
          {hint.text}
        </div>
      )}
    </div>
  );
}
