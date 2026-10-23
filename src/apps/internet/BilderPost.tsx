import { useEffect, useRef, useState } from 'react';
import { emojiUrl, type EmojiName } from '../../core/emoji';
import { useTimeouts } from '../../core/hooks';
import { sfx } from '../../core/sound';
import { Emoji } from '../../os/Emoji';
import type { LevelProps } from '../shared/levelTypes';
import { ProgressDots } from '../shared/LevelUi';
import { nextHop, type Link, type Pt } from './net';
import { cable, useTravel, type MapEdge, type MapNode } from './map';
import { NetMap, Story } from './ui';

const W = 1000;
const H = 560;

/** Kapitel 2: Datenpakete – wie ein Foto zu Oma kommt. */
export function BilderPost({ tier, onDone }: LevelProps) {
  if (tier === 1) return <Puzzle onDone={onDone} />;
  if (tier === 2) return <Wegweiser onDone={onDone} />;
  return <Reihenfolge onDone={onDone} />;
}

const at = (nodes: MapNode[], ...ids: string[]): Pt[] => ids.map((id) => nodes.find((n) => n.id === id)!);

// ---------------------------------------------------------------------------
// Stufe 1: Ein Foto in vier Paketen
// ---------------------------------------------------------------------------

const QUARTERS = [
  { x: 0, y: 0 },
  { x: 60, y: 0 },
  { x: 0, y: 60 },
  { x: 60, y: 60 },
];

function Photo({ x, y, pieces, cut }: { x: number; y: number; pieces: number[]; cut?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} className="nm-photo">
      <defs>
        {QUARTERS.map((q, i) => (
          <clipPath key={i} id={`q-${x}-${i}`}>
            <rect x={q.x} y={q.y} width="60" height="60" />
          </clipPath>
        ))}
      </defs>
      <rect x="-8" y="-8" width="136" height="136" rx="14" className="nm-photo-frame" />
      {pieces.map((i) => (
        <image key={i} href={emojiUrl('cat-face')} width="120" height="120" clipPath={`url(#q-${x}-${i})`} />
      ))}
      {cut && <path d="M60 -4v128M-4 60h128" className="nm-photo-cut" />}
    </g>
  );
}

const POST_NODES: MapNode[] = [
  { id: 'laptop', icon: 'laptop', label: 'Dein Laptop', x: 110, y: 300, size: 96 },
  { id: 'r1', icon: 'router', label: 'Router', x: 310, y: 170, size: 84 },
  { id: 'r2', icon: 'router', label: 'Router', x: 500, y: 390, size: 84 },
  { id: 'r3', icon: 'router', label: 'Router', x: 690, y: 170, size: 84 },
  { id: 'oma', icon: 'old-woman', label: 'Oma', x: 890, y: 300, size: 96 },
];

function Puzzle({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'foto' | 'pakete' | 'fertig'>('foto');
  const [waiting, setWaiting] = useState([0, 1, 2, 3]);
  const [arrived, setArrived] = useState<number[]>([]);
  const [story, setStory] = useState('Das ist dein Katzenfoto. Für die Reise zerschneidet es der Computer in vier kleine Pakete …');
  const travel = useTravel();
  const later = useTimeouts();
  const count = useRef(0);

  useEffect(() => {
    later(() => {
      sfx.whoosh();
      setPhase('pakete');
      setStory('Klick ein Paket an – dann fliegt es los, von Router zu Router bis zu Oma!');
    }, 2600);
  }, [later]);

  const nodes: MapNode[] = [
    ...POST_NODES.map((n): MapNode => ({
      ...n,
      tone: n.id === 'oma' && phase === 'fertig' ? 'on' : n.id.startsWith('r') && travel.moving ? 'on' : 'plain',
      badge: n.id === 'oma' && phase === 'fertig' ? 'waving-hand' : undefined,
    })),
    ...(phase === 'pakete' ? waiting : []).map((i): MapNode => ({
      id: `paket-${i}`,
      icon: 'envelope',
      label: String(i + 1),
      x: 52 + i * 78,
      y: 445,
      size: 62,
      tone: 'pick',
    })),
  ];
  const edges: MapEdge[] = [
    cable(nodes, 'laptop', 'r1', { tone: travel.moving ? 'active' : 'plain' }),
    cable(nodes, 'r1', 'r2', { tone: travel.moving ? 'active' : 'plain' }),
    cable(nodes, 'r2', 'r3', { tone: travel.moving ? 'active' : 'plain' }),
    cable(nodes, 'r3', 'oma', { tone: travel.moving ? 'active' : 'plain' }),
  ];

  const send = (id: string) => {
    if (!id.startsWith('paket-')) return;
    const i = Number(id.slice(6));
    if (!waiting.includes(i)) return;
    sfx.tap();
    setWaiting((w) => w.filter((x) => x !== i));
    travel.send({
      id,
      icon: 'envelope',
      label: String(i + 1),
      points: at(POST_NODES, 'laptop', 'r1', 'r2', 'r3', 'oma'),
      ms: 2800,
      onArrive: () => {
        sfx.pop();
        setArrived((a) => [...a, i]);
        const total = ++count.current;
        if (total === 4) {
          sfx.success();
          setPhase('fertig');
          setStory('Alle Pakete sind da! Omas Tablet setzt sie wieder zum ganzen Foto zusammen.');
          later(onDone, 2800);
        } else {
          setStory(`Paket ${i + 1} ist bei Oma angekommen. ${4 - total === 1 ? 'Noch eins!' : `Noch ${4 - total}.`}`);
        }
      },
    });
  };

  return (
    <div className="net-level">
      <Story text={story} mood={phase === 'fertig' ? 'cheer' : 'happy'} />
      <div className="net-stage">
        <NetMap
          width={W}
          height={H}
          label="Dein Laptop, drei Router und Oma"
          nodes={nodes}
          edges={edges}
          packets={travel.packets}
          overlay={
            <>
              <Photo x={46} y={60} pieces={phase === 'foto' ? [0, 1, 2, 3] : waiting} cut />
              <Photo x={830} y={392} pieces={arrived} />
            </>
          }
          onNodeClick={send}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stufe 2: Router lesen die Adresse
// ---------------------------------------------------------------------------

const ROUTER_NODES: MapNode[] = [
  { id: 'laptop', icon: 'laptop', label: 'Du', x: 62, y: 280, size: 76 },
  { id: 'A', icon: 'router', label: 'Router A', x: 185, y: 280, size: 80 },
  { id: 'B', icon: 'router', label: 'Router B', x: 345, y: 128, size: 80 },
  { id: 'C', icon: 'router', label: 'Router C', x: 345, y: 432, size: 80 },
  { id: 'D', icon: 'router', label: 'Router D', x: 520, y: 280, size: 80 },
  { id: 'E', icon: 'router', label: 'Router E', x: 690, y: 128, size: 80 },
  { id: 'F', icon: 'router', label: 'Router F', x: 690, y: 432, size: 80 },
  { id: 'G', icon: 'router', label: 'Router G', x: 800, y: 280, size: 80 },
  { id: 'oma', icon: 'old-woman', label: 'Oma', x: 925, y: 118, size: 76 },
  { id: 'zoo', icon: 'lion', label: 'Zoo-Server', x: 925, y: 280, size: 76 },
  { id: 'schule', icon: 'school', label: 'Schule', x: 925, y: 442, size: 76 },
];

const ROUTER_LINKS: Link[] = [
  { a: 'laptop', b: 'A' }, { a: 'A', b: 'B' }, { a: 'A', b: 'C' }, { a: 'B', b: 'D' }, { a: 'C', b: 'D' },
  { a: 'B', b: 'E' }, { a: 'D', b: 'E' }, { a: 'D', b: 'F' }, { a: 'C', b: 'F' }, { a: 'E', b: 'G' },
  { a: 'F', b: 'G' }, { a: 'D', b: 'G' }, { a: 'E', b: 'oma' }, { a: 'G', b: 'zoo' }, { a: 'F', b: 'schule' },
];

const ROUTER_POINTS = Object.fromEntries(ROUTER_NODES.map((n) => [n.id, { x: n.x, y: n.y }]));

const DESTINATIONS: { id: string; name: string; ip: string; prefix: string; emoji: EmojiName; color: string }[] = [
  { id: 'oma', name: 'Oma', ip: '203.0.113.7', prefix: '203.0.113.', emoji: 'old-woman', color: '#ff7a2f' },
  { id: 'zoo', name: 'Zoo', ip: '192.0.2.44', prefix: '192.0.2.', emoji: 'lion', color: '#2fbf62' },
  { id: 'schule', name: 'Schule', ip: '198.51.100.20', prefix: '198.51.100.', emoji: 'school', color: '#8a6bff' },
];

const nameOf = (id: string) => ROUTER_NODES.find((n) => n.id === id)?.label ?? id;

function Wegweiser({ onDone }: { onDone: () => void }) {
  const [round, setRound] = useState(0);
  const [here, setHere] = useState('A');
  const [hint, setHint] = useState(false);
  const [missed, setMissed] = useState(false);
  const [results, setResults] = useState<('ok' | 'miss')[]>([]);
  const dest = DESTINATIONS[round];
  const [story, setStory] = useState(
    `Dieses Paket soll zu ${dest.name}: ${dest.ip}. Es steht bei Router A. Schau auf den Wegweiser: Welcher Router ist der nächste?`,
  );
  const travel = useTravel();
  const later = useTimeouts();
  const finished = results.length === DESTINATIONS.length;
  const moving = travel.moving;

  const neighbors = ROUTER_LINKS.filter((l) => l.a === here || l.b === here).map((l) => (l.a === here ? l.b : l.a));
  const nodes: MapNode[] = ROUTER_NODES.map((n) => ({
    ...n,
    tone: n.id === here ? 'on' : !moving && !finished && neighbors.includes(n.id) && n.id !== 'laptop' ? 'pick' : n.id === dest.id ? 'goal' : 'plain',
  }));
  const edges: MapEdge[] = ROUTER_LINKS.map((l) => cable(nodes, l.a, l.b));
  const packets = moving
    ? travel.packets
    : [{ id: 'paket', at: ROUTER_POINTS[here], icon: 'envelope' as EmojiName, size: 40 }];

  const pick = (id: string) => {
    if (moving || finished || !neighbors.includes(id) || id === 'laptop') return;
    const right = nextHop(ROUTER_POINTS, ROUTER_LINKS, here, dest.id);
    if (id !== right) {
      sfx.wrong();
      setHint(true);
      setMissed(true);
      setStory(`Fast! Der Wegweiser von ${nameOf(here)} sagt: ${dest.prefix}… geht zu ${right === dest.id ? dest.name : nameOf(right ?? '')}.`);
      return;
    }
    sfx.click();
    setHint(false);
    travel.send({
      id: `hop-${here}-${id}`,
      icon: 'envelope',
      size: 40,
      points: [ROUTER_POINTS[here], ROUTER_POINTS[id]],
      ms: 850,
      onArrive: () => {
        setHere(id);
        if (id !== dest.id) {
          setStory(`Jetzt ist das Paket bei ${nameOf(id)}. Was sagt dieser Wegweiser für ${dest.ip}?`);
          return;
        }
        sfx.success();
        const nextResults: ('ok' | 'miss')[] = [...results, missed ? 'miss' : 'ok'];
        setResults(nextResults);
        if (nextResults.length === DESTINATIONS.length) {
          setStory('Alle drei Pakete sind angekommen! Router lesen die Adresse auf jedem Paket und schicken es weiter – Schritt für Schritt.');
          later(onDone, 3000);
          return;
        }
        setStory(`Angekommen bei ${dest.name}! Gleich kommt das nächste Paket …`);
        later(() => {
          const next = DESTINATIONS[round + 1];
          setRound(round + 1);
          setHere('A');
          setMissed(false);
          setStory(`Neues Paket an ${next.name}: ${next.ip}. Wohin schickt Router A es weiter?`);
        }, 1800);
      },
    });
  };

  const table = here.length === 1 && !finished
    ? DESTINATIONS.map((d) => {
        const hop = nextHop(ROUTER_POINTS, ROUTER_LINKS, here, d.id);
        return { ...d, to: hop === d.id ? `direkt zu ${d.name}` : nameOf(hop ?? '') };
      })
    : [];

  return (
    <div className="net-level">
      <Story text={story} mood={finished ? 'cheer' : 'happy'} />
      <div className="net-stage">
        <NetMap
          width={W}
          height={H}
          label="Ein Netz aus sieben Routern"
          nodes={nodes}
          edges={edges}
          packets={packets}
          onNodeClick={pick}
        />
        {table.length > 0 && (
          <aside className="net-sign" aria-label={`Wegweiser von ${nameOf(here)}`}>
            <div className="net-sign-head">Wegweiser von {nameOf(here)}</div>
            {table.map((row) => (
              <div key={row.id} className={['net-sign-row', row.id === dest.id ? 'is-current' : '', row.id === dest.id && hint ? 'is-hint' : ''].filter(Boolean).join(' ')}>
                <Emoji name={row.emoji} size={22} />
                <span className="net-ip">{row.prefix}…</span>
                <span className="net-arrow">→</span>
                <b>{row.to}</b>
              </div>
            ))}
          </aside>
        )}
        <div className="net-label-chip">
          <Emoji name={dest.emoji} size={26} />
          An: <b>{dest.ip}</b> ({dest.name})
        </div>
      </div>
      <div className="net-controls">
        <ProgressDots states={DESTINATIONS.map((_, i) => results[i] ?? (i === round ? 'now' : 'todo'))} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stufe 3: Nummern ordnen – und nachfragen, wenn eins fehlt
// ---------------------------------------------------------------------------

const LETTERS = 'HALLOOMA'.split('');
const LOST = 7;

const TCP_NODES: MapNode[] = [
  { id: 'du', icon: 'laptop', label: 'Du', x: 90, y: 250, size: 90 },
  { id: 't1', icon: 'router', label: 'Router', x: 330, y: 105, size: 72 },
  { id: 't2', icon: 'router', label: 'Router', x: 670, y: 105, size: 72 },
  { id: 'b1', icon: 'router', label: 'Router', x: 300, y: 395, size: 72 },
  { id: 'b2', icon: 'router', label: 'Router', x: 500, y: 430, size: 72 },
  { id: 'b3', icon: 'router', label: 'Router', x: 700, y: 395, size: 72 },
  { id: 'oma', icon: 'old-woman', label: 'Oma', x: 910, y: 250, size: 90 },
];
const TOP = ['du', 't1', 't2', 'oma'];
const BOTTOM = ['du', 'b1', 'b2', 'b3', 'oma'];
/** Wer welchen Weg nimmt: oben ist kürzer und schneller. */
const PLAN: ('top' | 'bottom')[] = ['top', 'bottom', 'top', 'bottom', 'bottom', 'top', 'bottom', 'top'];

function Reihenfolge({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'reise' | 'ordnen'>('reise');
  const [tray, setTray] = useState<number[]>([]);
  const [placed, setPlaced] = useState<number[]>([]);
  const [jam, setJam] = useState(false);
  const [asked, setAsked] = useState(false);
  const [story, setStory] = useState('Deine Nachricht an Oma ist in 8 Pakete verpackt. Jedes Paket bekommt eine Nummer – gleich reisen sie los, auf verschiedenen Wegen.');
  const travel = useTravel();
  const later = useTimeouts();
  const arrivedCount = useRef(0);
  const nextNeeded = placed.length + 1;
  const done = placed.length === LETTERS.length;
  const { send } = travel;

  useEffect(() => {
    PLAN.forEach((way, i) => {
      const n = i + 1;
      later(() => {
        const lost = n === LOST;
        const ids = way === 'top' ? TOP : BOTTOM;
        send({
          id: `p${n}`,
          icon: 'envelope',
          label: String(n),
          size: 42,
          points: at(TCP_NODES, ...(lost ? ['du', 'b1', 'b2'] : ids)),
          ms: lost ? 1500 : way === 'top' ? 1900 : 3100,
          onArrive: () => {
            if (lost) {
              sfx.boing();
              setJam(true);
              later(() => setJam(false), 1800);
              return;
            }
            sfx.pop();
            setTray((t) => [...t, n]);
            if (++arrivedCount.current === LETTERS.length - 1) {
              setPhase('ordnen');
              setStory('Bei Oma ist alles durcheinander angekommen! Leg die Pakete in die richtige Reihenfolge: Klick zuerst Paket 1, dann 2 und so weiter.');
            }
          },
        });
      }, 900 + i * 380);
    });
  }, [later, send]);

  const place = (n: number) => {
    if (n !== nextNeeded) {
      sfx.wrong();
      setStory(`Erst Paket ${nextNeeded}!`);
      return;
    }
    sfx.click();
    const next = [...placed, n];
    setPlaced(next);
    setTray((t) => t.filter((x) => x !== n));
    if (next.length === LETTERS.length) {
      sfx.fanfare();
      setStory('„HALLO OMA“ – die ganze Nachricht ist da! Dank der Nummern weiß Omas Computer, wie die Pakete zusammengehören und welches fehlt.');
      later(onDone, 3200);
    } else if (next.length + 1 === LOST && !asked) {
      setStory(`Paket ${LOST} fehlt! Es ist unterwegs im Stau verloren gegangen. Was macht Omas Computer? Er fragt einfach nach.`);
    } else {
      setStory(`Gut! Jetzt Paket ${next.length + 1}.`);
    }
  };

  const ask = () => {
    if (asked) return;
    setAsked(true);
    sfx.tap();
    setStory(`„Bitte Paket ${LOST} noch einmal schicken!“ – und schon kommt es.`);
    travel.send({
      id: 'frage',
      icon: 'speech-balloon',
      size: 38,
      points: at(TCP_NODES, 'oma', 't2', 't1', 'du'),
      ms: 1300,
      onArrive: () =>
        travel.send({
          id: `p${LOST}`,
          icon: 'envelope',
          label: String(LOST),
          size: 42,
          points: at(TCP_NODES, ...TOP),
          ms: 1500,
          onArrive: () => {
            sfx.pop();
            setTray((t) => [...t, LOST]);
            setStory(`Da ist Paket ${LOST}! Leg es an seinen Platz.`);
          },
        }),
    });
  };

  const nodes: MapNode[] = TCP_NODES.map((n) => ({ ...n, tone: n.id === 'b2' && jam ? 'warn' : n.id === 'oma' && done ? 'on' : 'plain' }));
  const edges: MapEdge[] = [
    ...TOP.slice(1).map((id, i) => cable(nodes, TOP[i], id, { tone: 'route-a' })),
    ...BOTTOM.slice(1).map((id, i) => cable(nodes, BOTTOM[i], id, { tone: 'route-b' })),
  ];
  const b2 = TCP_NODES.find((n) => n.id === 'b2')!;

  return (
    <div className="net-level">
      <Story text={story} mood={done ? 'cheer' : 'happy'} />
      <div className="net-stage net-stage-short">
        <NetMap
          width={W}
          height={500}
          label="Zwei Wege zu Oma"
          nodes={nodes}
          edges={edges}
          packets={travel.packets}
          overlay={jam && <image href={emojiUrl('cloud-with-lightning')} x={b2.x - 34} y={b2.y - 96} width="68" height="68" className="nm-accident" />}
        />
      </div>
      <div className="tcp-panel">
        <div className="tcp-message" aria-label="Nachricht">
          {LETTERS.map((ch, i) => (
            <span key={i} className={['tcp-slot', placed.includes(i + 1) ? 'is-filled' : '', i === 4 ? 'is-gap' : ''].filter(Boolean).join(' ')}>
              <small>{i + 1}</small>
              {placed.includes(i + 1) ? ch : ''}
            </span>
          ))}
        </div>
        <div className="tcp-tray" aria-label="Angekommene Pakete">
          {tray.map((n) => (
            <button key={n} type="button" className="tcp-packet" onClick={() => place(n)} disabled={done}>
              <Emoji name="envelope" size={34} />
              <b>{n}</b>
            </button>
          ))}
          {phase === 'ordnen' && nextNeeded === LOST && !asked && (
            <button type="button" className="btn btn-sky btn-small" onClick={ask}>
              Paket {LOST} nochmal anfordern
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
