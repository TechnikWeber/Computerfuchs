import { useState } from 'react';
import { emojiUrl, type EmojiName } from '../../core/emoji';
import { useTimeouts } from '../../core/hooks';
import { sfx } from '../../core/sound';
import type { LevelProps } from '../shared/levelTypes';
import { GERMAN_CITIES, GERMANY } from './content';
import { allConnected, bridges, hasLink, linkId, reachable, type Link, type Pt } from './net';
import { cable, useTravel, type MapEdge, type MapNode } from './map';
import { NetMap, Story } from './ui';

const W = 1000;
const H = 560;

/** Kapitel 1: Was ist das Internet? Ein Netz aus verbundenen Geräten. */
export function Netz({ tier, onDone }: LevelProps) {
  if (tier === 1) return <Zuhause onDone={onDone} />;
  if (tier === 2) return <ZuOma onDone={onDone} />;
  return <Robust onDone={onDone} />;
}

// ---------------------------------------------------------------------------
// Stufe 1: Alle Geräte am Router einstecken
// ---------------------------------------------------------------------------

const DEVICES: { id: string; icon: EmojiName; label: string; x: number; y: number; funk?: boolean }[] = [
  { id: 'laptop', icon: 'laptop', label: 'Laptop', x: 205, y: 225 },
  { id: 'pc', icon: 'desktop-computer', label: 'Computer', x: 795, y: 225 },
  { id: 'handy', icon: 'mobile-phone', label: 'Handy', x: 215, y: 455, funk: true },
  { id: 'tv', icon: 'television', label: 'Fernseher', x: 785, y: 455 },
];

function Zuhause({ onDone }: { onDone: () => void }) {
  const [plugged, setPlugged] = useState<string[]>([]);
  const [online, setOnline] = useState(false);
  const [story, setStory] = useState(
    'Hier stehen dein Laptop, ein Computer, ein Handy und ein Fernseher. Drück auf ein Gerät, halte die Maustaste fest und zieh ein Kabel zum Router in der Mitte.',
  );
  const travel = useTravel();
  const later = useTimeouts();

  const nodes: MapNode[] = [
    { id: 'internet', icon: 'cloud', label: 'Internet', x: 500, y: 62, size: 92, tone: online ? 'on' : 'plain' },
    { id: 'router', icon: 'router', label: 'Router', x: 500, y: 345, size: 116, tone: plugged.length > 0 ? 'on' : 'plain' },
    ...DEVICES.map((d): MapNode => ({
      id: d.id,
      x: d.x,
      y: d.y,
      icon: d.icon,
      label: d.label,
      size: 100,
      tone: plugged.includes(d.id) ? 'on' : 'pick',
    })),
  ];

  const firstOpen = DEVICES.find((d) => !plugged.includes(d.id));
  const edges: MapEdge[] = [
    cable(nodes, 'router', 'internet', { tone: online ? 'active' : 'plain' }),
    ...DEVICES.filter((d) => plugged.includes(d.id)).map((d) =>
      cable(nodes, 'router', d.id, { kind: d.funk ? 'funk' : 'kabel', tone: online ? 'active' : 'plain' }),
    ),
    // Am Anfang zeigt eine blasse Linie, was zu tun ist.
    ...(plugged.length === 0 && firstOpen ? [cable(nodes, firstOpen.id, 'router', { tone: 'faint' })] : []),
  ];

  const connect = (a: string, b: string) => {
    const device = DEVICES.find((d) => d.id === a || d.id === b);
    const other = device ? (device.id === a ? b : a) : null;
    if (!device || other !== 'router') {
      sfx.boing();
      setStory(
        a === 'internet' || b === 'internet'
          ? 'Das Internet kommt über den Router ins Haus. Steck die Geräte am Router ein.'
          : 'Geräte steckst du am Router ein – er verteilt das Internet im ganzen Haus.',
      );
      return;
    }
    if (plugged.includes(device.id)) return;
    sfx.pop();
    const next = [...plugged, device.id];
    setPlugged(next);
    const left = DEVICES.length - next.length;
    if (device.funk) setStory('Das Handy braucht gar kein Kabel: Es funkt mit dem Router. Das heißt WLAN.');
    else setStory(left > 0 ? `Eingesteckt! Noch ${left === 1 ? 'ein Gerät' : `${left} Geräte`}.` : 'Eingesteckt!');
    if (left > 0) return;
    later(() => {
      setOnline(true);
      sfx.success();
      setStory('Super! Jetzt sind alle Geräte im Netz – und der Router verbindet sie mit dem Internet.');
      const cloud = nodes[0];
      const router = nodes[1];
      DEVICES.forEach((d, i) => {
        travel.send({ id: `herz-${d.id}`, icon: 'red-heart', size: 40, points: [cloud, router, d], ms: 1600 + i * 250 });
      });
      later(onDone, 3800);
    }, 700);
  };

  return (
    <div className="net-level">
      <Story text={story} mood={online ? 'cheer' : 'happy'} />
      <div className="net-stage">
        <NetMap
          width={W}
          height={H}
          label="Ein Router mit vier Geräten"
          nodes={nodes}
          edges={edges}
          packets={travel.packets}
          background={<rect x="40" y="142" width="920" height="408" rx="36" className="nm-room" />}
          connectFrom={(id) => !online && (id === 'router' || (DEVICES.some((d) => d.id === id) && !plugged.includes(id)))}
          onConnect={connect}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stufe 2: Von deinem Haus bis zu Oma
// ---------------------------------------------------------------------------

const OMA_NODES: MapNode[] = [
  { id: 'laptop', icon: 'laptop', label: 'Dein Laptop', x: 105, y: 440, size: 88 },
  { id: 'routerA', icon: 'router', label: 'Dein Router', x: 250, y: 440, size: 96 },
  { id: 'provA', icon: 'office-building', label: 'Dein Anbieter', x: 300, y: 235, size: 92 },
  { id: 'internet', icon: 'cloud', label: 'Internet', x: 500, y: 100, size: 104 },
  { id: 'provB', icon: 'office-building', label: 'Omas Anbieter', x: 700, y: 235, size: 92 },
  { id: 'routerB', icon: 'router', label: 'Omas Router', x: 750, y: 440, size: 96 },
  { id: 'oma', icon: 'old-woman', label: 'Oma', x: 895, y: 440, size: 88 },
];

const OMA_LINKS: { a: string; b: string; text: string }[] = [
  { a: 'routerA', b: 'provA', text: 'Richtig! Dein Router hängt am Kabel in der Wand – das führt zu deinem Internetanbieter.' },
  { a: 'provA', b: 'internet', text: 'Dein Anbieter ist mit vielen anderen Netzen verbunden. Alle zusammen sind das Internet.' },
  { a: 'internet', b: 'provB', text: 'Auch Omas Anbieter hängt am Internet.' },
  { a: 'provB', b: 'routerB', text: 'Und Omas Anbieter führt bis zu Omas Router.' },
];

function ZuOma({ onDone }: { onDone: () => void }) {
  const [links, setLinks] = useState<Link[]>([]);
  const [arrived, setArrived] = useState(false);
  const [story, setStory] = useState(
    'Schick Oma eine Nachricht! Dafür braucht es einen Weg von deinem Router bis zu Omas Router. Zieh die Kabel: über deinen Internetanbieter, das Internet und Omas Anbieter.',
  );
  const travel = useTravel();
  const later = useTimeouts();
  const done = links.length === OMA_LINKS.length;

  const nodes = OMA_NODES.map((n): MapNode => ({
    ...n,
    tone: n.id === 'oma' && arrived ? 'on' : n.id === 'oma' || n.id === 'laptop' ? 'plain' : 'pick',
    badge: n.id === 'oma' && arrived ? 'waving-hand' : undefined,
  }));
  const edges: MapEdge[] = [
    cable(nodes, 'laptop', 'routerA'),
    cable(nodes, 'routerB', 'oma'),
    ...links.map((l) => cable(nodes, l.a, l.b, { tone: done ? 'active' : 'new' })),
  ];

  const connect = (a: string, b: string) => {
    if (hasLink(links, a, b)) return;
    const right = OMA_LINKS.find((l) => linkId(l.a, l.b) === linkId(a, b));
    if (!right) {
      sfx.boing();
      const pair = linkId(a, b);
      if (pair === linkId('routerA', 'routerB')) setStory('So lang ist kein Kabel! Dein Router bringt die Daten zuerst zu deinem Internetanbieter.');
      else if (pair === linkId('routerA', 'internet') || pair === linkId('routerB', 'internet'))
        setStory('Fast! Dazwischen sitzt noch der Internetanbieter – die Firma, die ein Haus ans Internet anschließt.');
      else if (pair === linkId('provA', 'provB')) setStory('Die beiden Anbieter treffen sich im Internet in der Mitte.');
      else setStory('Das passt so nicht. Der Weg geht: Router, Anbieter, Internet, Anbieter, Router.');
      return;
    }
    sfx.pop();
    const next = [...links, { a, b }];
    setLinks(next);
    setStory(right.text);
    if (next.length < OMA_LINKS.length) return;
    later(() => {
      setStory('Der Weg ist fertig! Jetzt reist deine Nachricht los …');
      const pts = ['laptop', 'routerA', 'provA', 'internet', 'provB', 'routerB', 'oma'].map((id) => nodes.find((n) => n.id === id)!);
      travel.send({
        id: 'brief',
        icon: 'envelope',
        points: pts,
        ms: 4200,
        onArrive: () => {
          setArrived(true);
          sfx.success();
          setStory('Angekommen! Deine Nachricht ist bei Oma – gereist durch viele Kabel und Computer.');
          later(onDone, 2800);
        },
      });
    }, 900);
  };

  return (
    <div className="net-level">
      <Story text={story} mood={arrived ? 'cheer' : 'happy'} />
      <div className="net-stage">
        <NetMap
          width={W}
          height={H}
          label="Dein Haus und Omas Haus, dazwischen Anbieter und das Internet"
          nodes={nodes}
          edges={edges}
          packets={travel.packets}
          background={
            <>
              <rect x="30" y="345" width="300" height="190" rx="28" className="nm-room" />
              <rect x="670" y="345" width="300" height="190" rx="28" className="nm-room" />
              <text x="180" y="380" className="nm-area-label">Dein Haus</text>
              <text x="820" y="380" className="nm-area-label">Omas Haus</text>
            </>
          }
          connectFrom={(id) => !done && id !== 'laptop' && id !== 'oma'}
          onConnect={connect}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stufe 3: Ein Netz, das hält
// ---------------------------------------------------------------------------

const BUDGET = 7;

/** Deutschland, längentreu genug für ein Spiel. */
function de(lon: number, lat: number): Pt {
  // Etwas in die Breite gezogen, damit die Städte Platz haben.
  return { x: 500 + (lon - 10.45) * 52, y: 38 + (55.1 - lat) * 61 };
}

const CITY_NODES = GERMAN_CITIES.map((c) => ({ ...c, ...de(c.lon, c.lat) }));
const CITY_IDS = CITY_NODES.map((c) => c.id);
const GERMANY_PATH = GERMANY.map(([lon, lat], i) => {
  const p = de(lon, lat);
  return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
}).join('') + 'Z';

const cityName = (id: string) => CITY_NODES.find((c) => c.id === id)?.name ?? id;
const listNames = (ids: string[]) =>
  ids.length <= 1 ? ids.map(cityName).join('') : `${ids.slice(0, -1).map(cityName).join(', ')} und ${cityName(ids[ids.length - 1])}`;

function Robust({ onDone }: { onDone: () => void }) {
  const [links, setLinks] = useState<Link[]>([]);
  const [checking, setChecking] = useState<{ cut: string | null; cutOff: string[] } | null>(null);
  const [won, setWon] = useState(false);
  const [story, setStory] = useState(
    'Bau ein Netz für sechs Städte, das hält, auch wenn irgendwo ein Kabel reißt. Du hast 7 Kabel. Zieh sie von Stadt zu Stadt – ein Klick auf ein Kabel nimmt es wieder weg.',
  );
  const later = useTimeouts();
  const busy = checking !== null || won;

  const nodes: MapNode[] = CITY_NODES.map((c) => ({
    id: c.id,
    x: c.x,
    y: c.y,
    icon: 'office-building',
    label: c.name,
    // Direkt unter Berlin liegt Dresden.
    labelAbove: c.id === 'berlin',
    size: 58,
    tone: checking?.cutOff.includes(c.id) ? 'warn' : won ? 'on' : 'plain',
  }));
  const edges: MapEdge[] = links.map((l) =>
    cable(nodes, l.a, l.b, { tone: checking?.cut === linkId(l.a, l.b) ? 'broken' : won ? 'active' : 'plain' }),
  );
  const cutEdge = checking?.cut ? edges.find((e) => e.id === checking.cut) : undefined;
  const cutAt = cutEdge ? { x: (cutEdge.points[0].x + cutEdge.points[1].x) / 2, y: (cutEdge.points[0].y + cutEdge.points[1].y) / 2 } : null;

  const connect = (a: string, b: string) => {
    if (hasLink(links, a, b)) return;
    if (links.length >= BUDGET) {
      sfx.boing();
      setStory('Alle 7 Kabel sind verlegt. Klick ein Kabel an, um es wieder wegzunehmen.');
      return;
    }
    sfx.pop();
    setLinks([...links, { a, b }]);
  };

  const removeLink = (id: string) => {
    if (busy) return;
    sfx.tap();
    setLinks(links.filter((l) => linkId(l.a, l.b) !== id));
  };

  const check = () => {
    if (!allConnected(links, CITY_IDS)) {
      sfx.boing();
      const seen = reachable(links, CITY_IDS[0]);
      const alone = CITY_IDS.filter((id) => !seen.has(id));
      setStory(`Noch nicht alle Städte hängen am Netz: ${listNames(alone)}.`);
      return;
    }
    const weak = new Set(bridges(links));
    const order = [...links];
    const step = (i: number) => {
      if (i >= order.length) {
        setChecking(null);
        setWon(true);
        sfx.fanfare();
        setStory('Dein Netz hält! Egal welches Kabel reißt – jede Stadt bleibt erreichbar. Genau so ist das Internet gebaut.');
        later(onDone, 3200);
        return;
      }
      const id = linkId(order[i].a, order[i].b);
      if (weak.has(id)) {
        const seen = reachable(links, CITY_IDS[0], new Set([id]));
        let cutOff = CITY_IDS.filter((c) => !seen.has(c));
        if (cutOff.length > CITY_IDS.length / 2) cutOff = CITY_IDS.filter((c) => seen.has(c));
        sfx.wrong();
        setChecking({ cut: id, cutOff });
        setStory(`Oh! Reißt dieses Kabel, ist ${listNames(cutOff)} abgeschnitten. ${cutOff.length === 1 ? 'Diese Stadt braucht' : 'Diese Städte brauchen'} einen zweiten Weg.`);
        later(() => setChecking(null), 3200);
        return;
      }
      sfx.click();
      setChecking({ cut: id, cutOff: [] });
      later(() => step(i + 1), 650);
    };
    setStory('Der Traktor gräbt sich durch – Kabel für Kabel. Hält dein Netz?');
    step(0);
  };

  return (
    <div className="net-level">
      <Story text={story} mood={won ? 'cheer' : 'happy'} />
      <div className="net-stage">
        <NetMap
          width={W}
          height={H}
          label="Eine Deutschlandkarte mit sechs Städten"
          nodes={nodes}
          edges={edges}
          background={<path d={GERMANY_PATH} className="nm-land" />}
          overlay={
            cutAt && (
              <image href={emojiUrl('tractor')} x={cutAt.x - 30} y={cutAt.y - 58} width="60" height="60" className="nm-accident" />
            )
          }
          connectFrom={() => !busy}
          onConnect={connect}
          onEdgeClick={busy ? undefined : removeLink}
        />
      </div>
      <div className="net-controls">
        <span className="net-budget">
          Kabel: <b>{links.length}</b> von {BUDGET}
        </span>
        <button type="button" className="btn btn-leaf" onClick={check} disabled={busy || links.length < 2}>
          Netz prüfen
        </button>
        <button type="button" className="btn btn-ghost btn-small" onClick={() => setLinks([])} disabled={busy || links.length === 0}>
          Alle Kabel weg
        </button>
      </div>
    </div>
  );
}
