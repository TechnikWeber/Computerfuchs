import { useState } from 'react';
import { useTimeouts } from '../../core/hooks';
import { defaultRng, sample, shuffle } from '../../core/random';
import { sfx } from '../../core/sound';
import { Emoji } from '../../os/Emoji';
import type { LevelProps } from '../shared/levelTypes';
import { ProgressDots } from '../shared/LevelUi';
import { OWNER_ROUNDS, SITES, type Site } from './content';
import { hostOf, ownerOf } from './net';
import { cable, useTravel, type MapNode } from './map';
import { Browser, NetMap, Story } from './ui';

/** Kapitel 4: Das Telefonbuch des Internets – Namen werden zu Nummern (DNS). */
export function Telefonbuch({ tier, onDone }: LevelProps) {
  if (tier === 1) return <Bilderbuch onDone={onDone} />;
  if (tier === 2) return <Eintippen onDone={onDone} />;
  return <WemGehoert onDone={onDone} />;
}

function SitePage({ site }: { site: Site }) {
  return (
    <div className="site-page" style={{ background: `linear-gradient(160deg, ${site.color}33, #fff 70%)` }}>
      <Emoji name={site.emoji} size={92} />
      <h3>{site.title}</h3>
      <p>{site.text}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stufe 1: Das Bilder-Telefonbuch
// ---------------------------------------------------------------------------

function Bilderbuch({ onDone }: { onDone: () => void }) {
  const [book] = useState(() => shuffle(defaultRng, SITES.slice(0, 6)));
  const [targets] = useState(() => sample(defaultRng, book, 4));
  const [round, setRound] = useState(0);
  const [found, setFound] = useState(false);
  const [missed, setMissed] = useState(false);
  const [wrongPick, setWrongPick] = useState<string | null>(null);
  const [results, setResults] = useState<('ok' | 'miss')[]>([]);
  const target = targets[round];
  const [story, setStory] = useState(
    `Flinn möchte ${target.to}. Computer kennen aber keine Namen, nur Nummern. Such das passende Bild im Telefonbuch und klick es an!`,
  );
  const later = useTimeouts();

  const pick = (site: Site) => {
    if (found) return;
    if (site.name !== target.name) {
      sfx.wrong();
      setMissed(true);
      setWrongPick(site.name);
      setStory('Das ist eine andere Seite. Schau auf das Bild, das Flinn sucht!');
      return;
    }
    sfx.success();
    setFound(true);
    setWrongPick(null);
    setResults((r) => [...r, missed ? 'miss' : 'ok']);
    setStory(`Gefunden! ${site.name} hat die Nummer ${site.ip}. Jetzt weiß der Computer, wohin – und die Seite erscheint.`);
    later(() => {
      if (round + 1 >= targets.length) {
        setStory('Prima! Hinter jedem Namen im Internet steckt eine Nummer. Das Telefonbuch verrät sie dem Computer.');
        later(onDone, 2600);
        return;
      }
      const next = targets[round + 1];
      setRound(round + 1);
      setFound(false);
      setMissed(false);
      setStory(`Und jetzt möchte Flinn ${next.to}. Such das Bild!`);
    }, 3200);
  };

  return (
    <div className="net-level">
      <Story text={story} mood={found ? 'cheer' : 'happy'} />
      <div className="dns-layout">
        <section className="phonebook" aria-label="Telefonbuch">
          <h3>
            <Emoji name="ledger" size={30} /> Telefonbuch
          </h3>
          <div className="phonebook-grid">
            {book.map((site) => (
              <button
                key={site.name}
                type="button"
                className={['phonebook-entry', found && site.name === target.name ? 'is-found' : '', wrongPick === site.name ? 'is-wrong' : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => pick(site)}
              >
                <Emoji name={site.emoji} size={52} />
                <span className="phonebook-name">{site.name}</span>
                <span className="phonebook-ip">{site.ip}</span>
              </button>
            ))}
          </div>
        </section>
        <Browser url={found ? `https://${target.name}` : 'https://'} className="dns-browser">
          {found ? (
            <SitePage site={target} />
          ) : (
            <div className="wish">
              <span>Gesucht:</span>
              <Emoji name={target.emoji} size={110} />
            </div>
          )}
        </Browser>
      </div>
      <div className="net-controls">
        <ProgressDots states={targets.map((_, i) => results[i] ?? (i === round ? 'now' : 'todo'))} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stufe 2: Adresse eintippen – erst das Telefonbuch, dann die Seite
// ---------------------------------------------------------------------------

const STRIP_NODES: MapNode[] = [
  { id: 'du', icon: 'laptop', label: 'Dein Computer', x: 120, y: 95, size: 84 },
  { id: 'dns', icon: 'server', label: 'Telefonbuch (DNS)', x: 500, y: 95, size: 84 },
  { id: 'web', icon: 'server', label: 'Webserver', x: 880, y: 95, size: 84 },
];

const clean = (text: string) =>
  text.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');

function Eintippen({ onDone }: { onDone: () => void }) {
  const [targets] = useState(() => sample(defaultRng, SITES, 4));
  const [round, setRound] = useState(0);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState<Site | null>(null);
  const [missed, setMissed] = useState(false);
  const [results, setResults] = useState<('ok' | 'miss')[]>([]);
  const [lit, setLit] = useState<string | null>(null);
  const target = targets[round];
  const [story, setStory] = useState(`Tipp die Adresse ein: ${target.name} – und drück dann die Enter-Taste.`);
  const travel = useTravel();
  const later = useTimeouts();

  const nodes = STRIP_NODES.map((n): MapNode => ({ ...n, tone: lit === n.id ? 'on' : 'plain' }));
  const edges = [cable(nodes, 'du', 'dns', { tone: lit === 'dns' ? 'active' : 'plain' }), cable(nodes, 'dns', 'web', { tone: 'faint' })];
  const du = STRIP_NODES[0];
  const dns = STRIP_NODES[1];
  const web = STRIP_NODES[2];

  const submit = () => {
    if (busy || page) return;
    const typed = clean(value);
    if (!typed) return;
    setBusy(true);
    setLit('dns');
    setStory(`Der Computer fragt das Telefonbuch: Welche Nummer hat ${typed}?`);
    travel.send({
      id: 'frage',
      icon: 'speech-balloon',
      size: 38,
      points: [du, dns],
      ms: 1000,
      onArrive: () => {
        const site = SITES.find((s) => s.name === typed);
        if (!site) {
          sfx.boing();
          setMissed(true);
          setBusy(false);
          setLit(null);
          setStory(`Das Telefonbuch kennt „${typed}“ nicht – da ist wohl ein Tippfehler. Schau genau hin: ${target.name}`);
          return;
        }
        if (site.name !== target.name) {
          sfx.boing();
          setMissed(true);
          setBusy(false);
          setLit(null);
          setStory(`${site.name} gibt es – aber gesucht ist ${target.name}.`);
          return;
        }
        setStory(`Antwort vom Telefonbuch: ${site.name} hat die Nummer ${site.ip}.`);
        travel.send({
          id: 'antwort',
          icon: 'memo',
          label: '#',
          size: 38,
          points: [dns, du],
          ms: 1000,
          onArrive: () => {
            setLit('web');
            setStory(`Jetzt fragt der Computer bei ${site.ip} nach der Seite …`);
            travel.send({
              id: 'seite',
              icon: 'envelope',
              size: 38,
              points: [du, { x: 500, y: 40 }, web],
              ms: 1300,
              onArrive: () =>
                travel.send({
                  id: 'paket',
                  icon: 'package',
                  size: 40,
                  points: [web, { x: 500, y: 40 }, du],
                  ms: 1300,
                  onArrive: () => {
                    sfx.success();
                    setLit(null);
                    setBusy(false);
                    setPage(site);
                    setResults((r) => [...r, missed ? 'miss' : 'ok']);
                    setStory('Da ist die Seite! Erst die Nummer im Telefonbuch, dann die Seite vom Webserver – so geht das jedes Mal.');
                    later(() => {
                      if (round + 1 >= targets.length) {
                        setStory('Super! Das Telefonbuch des Internets heißt DNS. Es übersetzt Namen wie zoo.de in Nummern.');
                        later(onDone, 2800);
                        return;
                      }
                      const next = targets[round + 1];
                      setRound(round + 1);
                      setValue('');
                      setPage(null);
                      setMissed(false);
                      travel.clear();
                      setStory(`Nächste Adresse: ${next.name}`);
                    }, 3000);
                  },
                }),
            });
          },
        });
      },
    });
  };

  return (
    <div className="net-level">
      <Story text={story} mood={page ? 'cheer' : 'happy'} />
      <div className="dns-strip">
        <NetMap
          width={1000}
          height={190}
          label="Dein Computer, das Telefonbuch und der Webserver"
          nodes={nodes}
          edges={edges}
          packets={travel.packets}
          overlay={
            lit === 'web' && (
              <path d={`M${du.x} ${du.y}Q500 -10 ${web.x} ${web.y}`} className="nm-arc" />
            )
          }
        />
      </div>
      <div className="dns-typing">
        <div className="dns-target">
          <Emoji name={target.emoji} size={46} />
          <span>
            Gesucht: <b>{target.name}</b>
          </span>
        </div>
        <Browser
          url={page ? `https://${page.name}` : ''}
          input={page ? undefined : { value, onChange: setValue, onSubmit: submit, placeholder: 'Adresse eintippen …' }}
          className="dns-browser"
        >
          {page ? <SitePage site={page} /> : <p className="dns-wait">{busy ? 'Einen Moment …' : 'Hier erscheint gleich die Seite.'}</p>}
        </Browser>
      </div>
      <div className="net-controls">
        <ProgressDots states={targets.map((_, i) => results[i] ?? (i === round ? 'now' : 'todo'))} />
        {!page && (
          <button type="button" className="btn btn-leaf" onClick={submit} disabled={busy || !value.trim()}>
            Los (Enter)
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stufe 3: Wem gehört die Adresse wirklich?
// ---------------------------------------------------------------------------

function WemGehoert({ onDone }: { onDone: () => void }) {
  const [round, setRound] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<('ok' | 'miss')[]>([]);
  const [story, setStory] = useState(
    'Fallen im Internet sehen oft echt aus. Entscheidend ist, wem eine Adresse gehört: Das steht ganz hinten im Rechnernamen, direkt vor dem ersten Schrägstrich. Wem gehört diese Adresse?',
  );
  const later = useTimeouts();
  const r = OWNER_ROUNDS[round];
  const owner = ownerOf(r.url);

  const choose = (option: string) => {
    if (answer) return;
    setAnswer(option);
    const right = option === owner;
    if (right) sfx.correct();
    else sfx.wrong();
    setResults((rs) => [...rs, right ? 'ok' : 'miss']);
    const host = hostOf(r.url);
    const front = host !== owner ? host.slice(0, host.length - owner.length - 1) : '';
    const disguise = front ? ` Was davor steht („${front}“), legt der Besitzer von ${owner} selbst fest.` : '';
    const trick =
      r.url.toLowerCase().includes('fuchsbank.de') && owner !== 'fuchsbank.de'
        ? ' „fuchsbank.de“ steht zwar in der Adresse – aber nur zur Verkleidung.'
        : r.url.toLowerCase().includes('kika.de') && owner !== 'kika.de'
          ? ' „kika.de“ steht vorne – aber das kann sich jeder ausdenken.'
          : '';
    setStory(`${right ? 'Richtig!' : 'Nicht ganz.'} Die Adresse gehört zu ${owner}.${disguise}${trick}`);
  };

  const next = () => {
    if (round + 1 >= OWNER_ROUNDS.length) {
      sfx.fanfare();
      setStory('Merke: Wem eine Adresse gehört, steht ganz hinten im Rechnernamen. Alles davor kann sich jeder ausdenken.');
      later(onDone, 2800);
      return;
    }
    setRound(round + 1);
    setAnswer(null);
    setStory('Und diese Adresse – wem gehört sie?');
  };

  return (
    <div className="net-level">
      <Story text={story} mood={answer === owner ? 'cheer' : 'happy'} />
      <div className="owner-layout">
        <Browser url={r.url} highlight={answer ? owner : undefined} className="owner-browser">
          <p className="owner-hint">Wem gehört diese Seite?</p>
        </Browser>
        <div className="owner-options">
          {r.options.map((o) => (
            <button
              key={o}
              type="button"
              className={['btn', answer ? (o === owner ? 'btn-leaf' : o === answer ? 'btn-berry' : 'btn-ghost') : 'btn-sky'].join(' ')}
              onClick={() => choose(o)}
              disabled={!!answer}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
      <div className="net-controls">
        <ProgressDots states={OWNER_ROUNDS.map((_, i) => results[i] ?? (i === round ? 'now' : 'todo'))} />
        {answer && (
          <button type="button" className="btn btn-leaf" onClick={next}>
            {round + 1 >= OWNER_ROUNDS.length ? 'Fertig' : 'Weiter'}
          </button>
        )}
      </div>
    </div>
  );
}
