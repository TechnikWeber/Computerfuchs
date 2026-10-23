import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { formatBytes } from '../../core/bytes';
import { fakeSize } from '../../core/files';
import { useTimeouts } from '../../core/hooks';
import { buy, SHOP, SHOP_CATEGORIES, type ShopItem, type ShopKind } from '../../core/shop';
import { noteFrequency, SONGS } from '../../core/songs';
import { playMelody, sfx } from '../../core/sound';
import { speak } from '../../core/speech';
import { newId } from '../../core/storage';
import { cursorPreview } from '../../os/cursors';
import { Emoji } from '../../os/Emoji';
import { Fox } from '../../os/Fox';
import { ByteIcon, Icon } from '../../os/Icon';
import { useOs } from '../../os/osContext';
import { Wallpaper } from '../../os/Wallpaper';

type Phase =
  | { name: 'shop' }
  | { name: 'confirm'; item: ShopItem }
  | { name: 'loading'; item: ShopItem; fileId: string; again: boolean }
  | { name: 'done'; item: ShopItem; fileId: string; again: boolean };

const DOWNLOAD_MS = 1800;

/** Der App-Laden: Bytes ausgeben, Dateien herunterladen – wie in einem echten Store, nur ohne echtes Geld. */
export default function LadenApp() {
  const os = useOs();
  const later = useTimeouts();
  const [kind, setKind] = useState<ShopKind>('hintergrund');
  const [phase, setPhase] = useState<Phase>({ name: 'shop' });
  const owned = new Set(os.profile.owned);
  const bytes = os.profile.bytes;
  const items = SHOP.filter((i) => i.kind === kind);

  const ask = (item: ShopItem) => {
    sfx.tap();
    const again = owned.has(item.id);
    if (!again && bytes < item.price) {
      sfx.boing();
      speak(`Dafür fehlen dir noch ${formatBytes(item.price - bytes)}. Üben bringt neue Bytes!`);
      return;
    }
    setPhase({ name: 'confirm', item });
    speak(again ? `${item.name} noch einmal herunterladen?` : `${item.name} für ${formatBytes(item.price)} holen?`);
  };

  const confirmBuy = (item: ShopItem) => {
    const fileId = newId();
    const result = buy(os.profile, item, fileId, new Date().toISOString());
    if (!result.ok) {
      sfx.boing();
      setPhase({ name: 'shop' });
      return;
    }
    // Erst das Profil, dann die Anzeige – falls jemand das Fenster mitten im Laden schließt.
    os.update((p) => {
      const again = buy(p, item, fileId, new Date().toISOString());
      return again.ok ? again.profile : p;
    });
    if (!result.again) sfx.coin();
    setPhase({ name: 'loading', item, fileId, again: result.again });
    later(() => {
      sfx.success();
      setPhase((ph) => (ph.name === 'loading' && ph.fileId === fileId ? { ...ph, name: 'done' } : ph));
      speak('Fertig! Die Datei liegt jetzt in deinen Downloads.');
    }, DOWNLOAD_MS);
  };

  return (
    <div className="shop">
      <header className="shop-head">
        <div className="shop-title">
          <Emoji name="shopping-bags" size={44} />
          <div>
            <h2>App-Laden</h2>
            <p>Hol dir neue Sachen für deinen Computer.</p>
          </div>
        </div>
        <div className="shop-wallet" title="Deine Bytes">
          <ByteIcon size={38} />
          <span>{formatBytes(bytes)}</span>
        </div>
      </header>

      <nav className="shop-tabs" aria-label="Abteilungen">
        {SHOP_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={c.id === kind ? 'shop-tab is-active' : 'shop-tab'}
            aria-pressed={c.id === kind}
            onClick={() => {
              sfx.tap();
              setKind(c.id);
            }}
          >
            <Emoji name={c.icon} size={30} />
            <span>{c.name}</span>
          </button>
        ))}
      </nav>

      <div className="shop-grid">
        {items.map((item) => {
          const has = owned.has(item.id);
          const short = !has && bytes < item.price;
          return (
            <article key={item.id} className={has ? 'shop-card is-owned' : 'shop-card'}>
              <ItemPreview item={item} />
              <div className="shop-card-body">
                <h3>{item.name}</h3>
                <p>{item.text}</p>
              </div>
              <div className="shop-card-foot">
                {has ? (
                  <span className="shop-owned">
                    <Icon name="check" size={18} stroke={3.4} /> Gekauft
                  </span>
                ) : (
                  <span className="shop-price">
                    <ByteIcon size={26} /> {formatBytes(item.price)}
                  </span>
                )}
                <button
                  type="button"
                  className={has ? 'btn btn-ghost btn-small' : short ? 'btn btn-small is-short' : 'btn btn-leaf btn-small'}
                  onClick={() => ask(item)}
                  aria-disabled={short}
                >
                  {has ? (
                    <>
                      <Icon name="download" size={18} /> Nochmal laden
                    </>
                  ) : short ? (
                    `Noch ${formatBytes(item.price - bytes)}`
                  ) : (
                    <>
                      <Icon name="download" size={18} /> Holen
                    </>
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <footer className="shop-foot">
        <Icon name="info" size={20} />
        <span>
          Hier gibt es kein echtes Geld. Bytes verdienst du nur durchs Üben – und dein Rang bleibt, auch wenn du sie ausgibst.
        </span>
      </footer>

      {phase.name !== 'shop' && (
        <div className="shop-overlay">
          <div className="shop-dialog" role="dialog" aria-label={phase.item.name}>
            <ItemPreview item={phase.item} big />
            {phase.name === 'confirm' && (
              <ConfirmBody
                item={phase.item}
                again={owned.has(phase.item.id)}
                bytes={bytes}
                onYes={() => confirmBuy(phase.item)}
                onNo={() => setPhase({ name: 'shop' })}
              />
            )}
            {phase.name === 'loading' && (
              <div className="shop-loading">
                <p>
                  <strong>{phase.item.fileName}</strong> wird heruntergeladen …
                </p>
                <div className="shop-progress">
                  <span style={{ '--dl-ms': `${DOWNLOAD_MS}ms` } as CSSProperties} />
                </div>
                <p className="shop-size">{formatBytes(fakeSize({ id: '', name: '', parent: '', created: '', content: phase.item.content }))}</p>
              </div>
            )}
            {phase.name === 'done' && (
              <div className="shop-done">
                <Fox size={70} mood="cheer" />
                <p>
                  Fertig! <strong>{phase.item.fileName}</strong> liegt jetzt in deinem Ordner „Downloads“.
                </p>
                <div className="shop-dialog-actions">
                  <button
                    type="button"
                    className="btn btn-sky"
                    autoFocus
                    onClick={() => {
                      setPhase({ name: 'shop' });
                      os.openApp('dateien', { folder: 'downloads' });
                    }}
                  >
                    <Emoji name="file-folder" size={26} /> Downloads öffnen
                  </button>
                  <button
                    type="button"
                    className="btn btn-leaf"
                    onClick={() => {
                      setPhase({ name: 'shop' });
                      os.openApp('anzeige', { file: phase.fileId });
                    }}
                  >
                    Gleich ansehen
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setPhase({ name: 'shop' })}>
                    Weiter stöbern
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ConfirmBody({
  item,
  again,
  bytes,
  onYes,
  onNo,
}: {
  item: ShopItem;
  again: boolean;
  bytes: number;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <div className="shop-confirm">
      <h3>{item.name}</h3>
      {again ? (
        <p>Das hast du schon gekauft. Noch einmal herunterladen kostet nichts.</p>
      ) : (
        <p>
          Für <strong>{formatBytes(item.price)}</strong> holen? Danach hast du noch {formatBytes(bytes - item.price)}.
        </p>
      )}
      <div className="shop-dialog-actions">
        <button type="button" className="btn btn-leaf" onClick={onYes} autoFocus>
          <Icon name="download" size={22} /> {again ? 'Herunterladen' : 'Ja, holen'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onNo}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}

/** Vorschau je nach Art – Lieder kann man kurz anhören. */
function ItemPreview({ item, big }: { item: ShopItem; big?: boolean }) {
  const c = item.content;
  const className = big ? 'shop-preview is-big' : 'shop-preview';
  switch (c.type) {
    case 'hintergrund':
      return (
        <div className={`${className} is-wallpaper`}>
          <Wallpaper id={c.wallpaper} />
        </div>
      );
    case 'zeiger':
      return (
        <div className={`${className} is-cursor`}>
          <img src={cursorPreview(c.cursor, big ? 120 : 84)} width={big ? 120 : 84} height={big ? 120 : 84} alt="" />
        </div>
      );
    case 'musik':
      return <SongPreview className={className} song={c.song} />;
    default:
      return (
        <div className={className}>
          <Emoji name={item.icon} size={big ? 120 : 84} />
        </div>
      );
  }
}

function SongPreview({ className, song }: { className: string; song: keyof typeof SONGS }) {
  const stop = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => () => stop.current?.(), []);
  const data = SONGS[song];
  return (
    <div className={`${className} is-song`}>
      <Emoji name="musical-notes" size={70} />
      <button
        type="button"
        className="shop-listen"
        onClick={() => {
          if (playing) {
            stop.current?.();
            stop.current = null;
            setPlaying(false);
            return;
          }
          const first = data.notes.slice(0, 9).map(([t, b]): [number, number] => [noteFrequency(t), b]);
          stop.current = playMelody(first, data.bpm, () => setPlaying(false));
          setPlaying(true);
        }}
        aria-label={playing ? 'Anhalten' : 'Reinhören'}
      >
        <Icon name={playing ? 'stop' : 'play'} size={18} /> {playing ? 'Stopp' : 'Reinhören'}
      </button>
    </div>
  );
}
