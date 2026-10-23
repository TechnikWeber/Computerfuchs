import { Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { APPS, appById, type AppDef } from '../apps/registry';
import { formatBytes } from '../core/bytes';
import { isKiosk } from '../core/fullscreen';
import { prefersReducedMotion, useElementSize, useLatest } from '../core/hooks';
import {
  ageGroup, applyLevelResult, hasFeature, markSeen, nextRank, withFeature,
  type Feature, type Profile, type Stars,
} from '../core/profile';
import { useSave } from '../core/saveContext';
import { setSoundEnabled, setSoundVolume, sfx } from '../core/sound';
import { setVoiceEnabled } from '../core/speech';
import { Confetti } from './Confetti';
import { makeConfetti, type ConfettiBit } from './confettiBits';
import { ContextMenu, type MenuItem } from './ContextMenu';
import { cursorCss } from './cursors';
import { DesktopIcons } from './DesktopIcons';
import { DesktopStickers } from './DesktopStickers';
import { FEATURE_INFO } from './features';
import { Fox } from './Fox';
import { FoxSays } from './FoxSays';
import { Modal } from './Modal';
import { OsContext, type AppParams, type CompleteResult, type OsApi, type ToastInput } from './osContext';
import { StartMenu } from './StartMenu';
import { Taskbar } from './Taskbar';
import { Toasts, type Toast } from './Toasts';
import { Wallpaper } from './Wallpaper';
import { WindowFrame } from './WindowFrame';
import { clampRect, initialWm, wmReducer, type Win } from './windows';

type Notice =
  | { kind: 'welcome' }
  | { kind: 'soon'; app: AppDef }
  | { kind: 'unlock'; feature: Feature }
  | { kind: 'rank'; name: string; next: string | null }
  | { kind: 'nosave' };

interface Props {
  profile: Profile;
  onLogout: () => void;
  onShutdown: () => void;
}

const NO_PARAMS = { nonce: 0 };

export function Desktop({ profile, onLogout, onShutdown }: Props) {
  const save = useSave();
  const kiosk = isKiosk();
  const group = ageGroup(profile.age);
  const profileRef = useLatest(profile);

  const [wm, dispatch] = useReducer(wmReducer, initialWm);
  const [selected, setSelected] = useState<string | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Begrüßung beim ersten Mal, Warnung wenn der Browser nichts speichert.
  const [notices, setNotices] = useState<Notice[]>(() => [
    ...(profile.seen.includes('welcome') ? [] : [{ kind: 'welcome' } as const]),
    ...(save.persistOk ? [] : [{ kind: 'nosave' } as const]),
  ]);
  const [confetti, setConfetti] = useState<{ key: number; bits: ConfettiBit[] } | null>(null);
  const [params, setParams] = useState<Record<string, AppParams & { nonce: number }>>({});
  const toastId = useRef(0);

  const areaRef = useRef<HTMLDivElement>(null);
  const size = useElementSize(areaRef);
  const area = useMemo(() => ({ w: size.width, h: size.height }), [size.width, size.height]);

  const canDouble = hasFeature(profile, 'doubleClick');
  const canMove = hasFeature(profile, 'moveWindows');
  const canRight = hasFeature(profile, 'rightClick');
  const canControl = hasFeature(profile, 'windowControls');

  // Ton- und Vorlese-Einstellungen des Profils gelten für den ganzen Computer.
  useEffect(() => {
    setSoundEnabled(profile.settings.sound);
    setSoundVolume(profile.settings.volume);
    setVoiceEnabled(profile.settings.voice);
  }, [profile.settings.sound, profile.settings.volume, profile.settings.voice]);

  const update = useCallback((change: (p: Profile) => Profile) => save.updateProfile(profile.id, change), [save, profile.id]);

  const pushNotice = useCallback((n: Notice) => setNotices((list) => [...list, n]), []);

  const noticesRef = useLatest(notices);
  const winsRef = useLatest(wm.wins);
  const closeNotice = useCallback(() => {
    const first = noticesRef.current[0];
    if (first?.kind === 'welcome') update((p) => markSeen(p, 'welcome'));
    // „Ausprobieren!": Große Fenster werden normal, damit man sie gleich verschieben kann.
    if (first?.kind === 'unlock' && first.feature === 'moveWindows') {
      for (const w of winsRef.current) if (w.mode === 'max') dispatch({ type: 'toggleMax', id: w.id });
    }
    setNotices((list) => list.slice(1));
  }, [noticesRef, winsRef, update]);

  const toast = useCallback((t: ToastInput) => {
    const id = ++toastId.current;
    setToasts((list) => [...list.slice(-3), { ...t, id }]);
    window.setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 3800);
  }, []);

  const celebrate = useCallback(() => {
    if (prefersReducedMotion()) return;
    const key = Date.now();
    setConfetti({ key, bits: makeConfetti() });
    window.setTimeout(() => setConfetti((c) => (c?.key === key ? null : c)), 3600);
  }, []);

  const openApp = useCallback(
    (appId: string, p?: AppParams) => {
      let app = appById(appId);
      let appParams = p;
      // Verknüpfungen wie der Papierkorb öffnen eine andere App an der richtigen Stelle.
      if (app?.opens) {
        appParams = { ...app.opens.params, ...p };
        app = appById(app.opens.app);
      }
      setStartOpen(false);
      setMenu(null);
      if (!app) return;
      if (!app.component) {
        sfx.tap();
        pushNotice({ kind: 'soon', app });
        return;
      }
      const id = app.id;
      const small = area.w < 900 || area.h < 560;
      dispatch({ type: 'open', appId: id, w: app.size.w, h: app.size.h, area, max: !canMove || small });
      // Immer neu setzen: Wer die App ohne Ziel öffnet, soll nicht im Ordner vom letzten Mal landen.
      const next = appParams ?? {};
      setParams((all) => ({ ...all, [id]: { ...next, nonce: (all[id]?.nonce ?? 0) + 1 } }));
      sfx.open();
    },
    [area, canMove, pushNotice],
  );

  const completeLevel = useCallback(
    (appId: string, levelId: string, stars: Stars, unlocks?: Feature, score?: number): CompleteResult => {
      const now = new Date().toISOString();
      const before = profileRef.current;
      const { outcome } = applyLevelResult(before, appId, levelId, stars, now, score);
      const unlocked = unlocks && !hasFeature(before, unlocks) ? unlocks : null;
      // Die Änderung selbst läuft über den neuesten Stand – so geht nichts verloren.
      update((p) => {
        const next = applyLevelResult(p, appId, levelId, stars, now, score).profile;
        return unlocks ? withFeature(next, unlocks) : next;
      });
      if (outcome.bytes > 0) {
        sfx.coin();
        toast({
          title: `+${formatBytes(outcome.bytes)}`,
          text: outcome.improved ? 'Für deinen neuen Stern!' : 'Fürs Üben',
          bytes: true,
        });
      }
      // Kurz nach dem Ergebnis, damit man erst die Sterne sieht – aber bevor jemand schon weiterspielt.
      if (outcome.rankUp) {
        const next = nextRank(before.bytesEarned + outcome.bytes);
        window.setTimeout(() => {
          pushNotice({ kind: 'rank', name: outcome.rankAfter.name, next: next?.name ?? null });
          celebrate();
        }, 700);
      }
      if (unlocked) window.setTimeout(() => pushNotice({ kind: 'unlock', feature: unlocked }), 700);
      return { ...outcome, unlocked };
    },
    [profileRef, update, toast, pushNotice, celebrate],
  );

  const api = useMemo<OsApi>(
    () => ({ profile, group, kiosk, update, completeLevel, toast, openApp, celebrate }),
    [profile, group, kiosk, update, completeLevel, toast, openApp, celebrate],
  );

  const onTask = (w: Win) => {
    if (w.mode === 'min') dispatch({ type: 'restore', id: w.id });
    else if (wm.focused === w.id) {
      if (canControl) dispatch({ type: 'minimize', id: w.id });
    } else dispatch({ type: 'focus', id: w.id });
  };

  const desktopApps = APPS.filter((a) => a.desktop);
  const notice = notices[0];

  const desktopMenu: MenuItem[] = [
    { label: 'Hintergrund ändern …', icon: 'artist-palette', onSelect: () => openApp('einstellungen', { tab: 'hintergrund' }) },
    { label: 'Dateien öffnen', icon: 'file-folder', onSelect: () => openApp('dateien') },
    { label: 'Einstellungen', icon: 'gear', onSelect: () => openApp('einstellungen', { tab: 'ton' }) },
  ];

  const removeSticker = (id: string) => {
    sfx.whoosh();
    update((p) => ({ ...p, stickers: p.stickers.filter((s) => s.id !== id) }));
    toast({ title: 'Sticker weg', text: 'Die Datei liegt weiter in deinen Downloads.', icon: 'wastebasket' });
  };

  return (
    <OsContext.Provider value={api}>
      <div className={`desktop group-${group}`}>
        <style>{cursorCss(profile.settings.cursor, profile.settings.cursorSkin)}</style>
        <Wallpaper id={profile.settings.wallpaper} />

        <div
          ref={areaRef}
          className="desk-area"
          onPointerDown={() => {
            setSelected(null);
            setStartOpen(false);
            setMenu(null);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            if (e.target !== e.currentTarget && !(e.target as HTMLElement).closest('.desk-icons')) return;
            if (!canRight) return;
            setStartOpen(false);
            setMenu({ x: e.clientX, y: e.clientY, items: desktopMenu });
          }}
        >
          <DesktopStickers
            stickers={profile.stickers}
            areaRef={areaRef}
            onMove={(id, x, y) => update((p) => ({ ...p, stickers: p.stickers.map((s) => (s.id === id ? { ...s, x, y } : s)) }))}
            onRemove={removeSticker}
            onMenu={(id, x, y) => {
              if (!canRight) return;
              setMenu({ x, y, items: [{ label: 'Sticker entfernen', icon: 'wastebasket', onSelect: () => removeSticker(id) }] });
            }}
          />
          <DesktopIcons
            apps={desktopApps}
            selected={selected}
            doubleClick={canDouble}
            doubleClickMs={profile.settings.doubleClickMs}
            big={group === 'klein'}
            highlight={notice?.kind === 'welcome' || !profile.progress.maus ? 'maus' : null}
            onSelect={setSelected}
            onOpen={(app) => openApp(app.id)}
          />

          {wm.wins.map((w) => {
            const app = appById(w.appId);
            const Comp = app?.component;
            if (!app || !Comp) return null;
            return (
              <WindowFrame
                key={w.id}
                // Wird der Bildschirm kleiner, rücken Fenster beim Zeichnen ins Bild.
                win={area.w > 0 && area.h > 0 ? clampRect(w, area) : w}
                app={app}
                focused={wm.focused === w.id}
                canMove={canMove}
                canControl={canControl}
                area={area}
                params={params[w.appId] ?? NO_PARAMS}
                title={titles[w.id]}
                onTitle={(t) =>
                  setTitles((all) => {
                    if ((all[w.id] ?? null) === t) return all;
                    const next = { ...all };
                    if (t) next[w.id] = t;
                    else delete next[w.id];
                    return next;
                  })
                }
                dispatch={dispatch}
              >
                <Suspense
                  fallback={
                    <div className="win-loading">
                      <Fox size={90} mood="wink" />
                    </div>
                  }
                >
                  <Comp />
                </Suspense>
              </WindowFrame>
            );
          })}
        </div>

        <Taskbar
          profile={profile}
          wins={wm.wins}
          focused={wm.focused}
          startOpen={startOpen}
          kiosk={kiosk}
          onStart={() => {
            sfx.tap();
            setMenu(null);
            setStartOpen((o) => !o);
          }}
          onTask={onTask}
          onToggleSound={() =>
            update((p) => ({ ...p, settings: { ...p.settings, sound: !p.settings.sound } }))
          }
        />

        {startOpen && (
          <StartMenu
            profile={profile}
            onOpen={(app) => openApp(app.id)}
            onLogout={() => {
              sfx.close();
              onLogout();
            }}
            onShutdown={onShutdown}
            onClose={() => setStartOpen(false)}
          />
        )}

        {menu && <ContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)} items={menu.items} />}

        <Toasts toasts={toasts} />

        {notice && <NoticeView notice={notice} profile={profile} onClose={closeNotice} />}
        {confetti && <Confetti key={confetti.key} bits={confetti.bits} />}
      </div>
    </OsContext.Provider>
  );
}

function NoticeView({ notice, profile, onClose }: { notice: Notice; profile: Profile; onClose: () => void }) {
  const klein = ageGroup(profile.age) === 'klein';
  let title: string;
  let text: string;
  let button = 'Okay!';
  let mood: 'happy' | 'cheer' | 'wink' = 'happy';

  switch (notice.kind) {
    case 'welcome':
      title = `Hallo, ${profile.name}!`;
      text = klein
        ? 'Ich bin Flinn, der Computerfuchs. Das hier ist dein eigener Computer! Klick einmal auf die Maus – dann zeige ich dir, wie alles geht.'
        : 'Ich bin Flinn, der Computerfuchs. Das hier ist dein Computer. Öffne das Maustraining mit einem Doppelklick – oder schau unten im Start-Menü, was es noch gibt.';
      button = "Los geht's!";
      break;
    case 'soon':
      title = notice.app.name;
      text = `${notice.app.soon ?? ''} Daran baue ich noch – schau bald wieder vorbei!`;
      mood = 'wink';
      break;
    case 'unlock':
      title = FEATURE_INFO[notice.feature].title;
      text = FEATURE_INFO[notice.feature].text;
      button = 'Ausprobieren!';
      mood = 'cheer';
      break;
    case 'rank':
      title = 'Neuer Rang!';
      text = `Du bist jetzt ein ${notice.name}!${notice.next ? ` Sammle weiter Bytes – als Nächstes wirst du ${notice.next}.` : ' Mehr geht nicht – du bist ganz oben!'}`;
      button = 'Juhu!';
      mood = 'cheer';
      break;
    case 'nosave':
      title = 'Achtung, Erwachsene!';
      text =
        'Dieser Browser speichert gerade nichts – zum Beispiel im privaten Modus oder im Kiosk mit InPrivate. Sichert den Spielstand über Einstellungen › Für Erwachsene als Datei.';
      mood = 'wink';
      break;
  }

  return (
    <Modal label={title} onClose={onClose} className="notice">
      <FoxSays title={title} text={text} mood={mood} foxSize={120}>
        <button type="button" className="btn btn-leaf" onClick={onClose} autoFocus>
          {button}
        </button>
      </FoxSays>
    </Modal>
  );
}
