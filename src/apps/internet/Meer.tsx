import { useState } from 'react';
import { emojiUrl, type EmojiName } from '../../core/emoji';
import { useAfterSpeech } from '../../core/hooks';
import { sfx } from '../../core/sound';
import { Emoji } from '../../os/Emoji';
import type { LevelProps } from '../shared/levelTypes';
import { ProgressDots } from '../shared/LevelUi';
import {
  ACCIDENT, CONTINENTS, PING_TARGETS, RACE_ROUNDS, REROUTE_ROUNDS, type Place, type Route,
} from './content';
import { earthKm, pingMs, pointAt, project, slicePolyline, smooth, travelMs, VACUUM_KM_PER_S, type Pt } from './net';
import { useTravel, type MapEdge, type MapNode } from './map';
import { NetMap, Story } from './ui';

const W = 1000;
const H = 500;

/** Kapitel 3: Kabel im Meer – viele Wege um die Welt, und wie schnell Licht ist. */
export function Meer({ tier, onDone }: LevelProps) {
  if (tier === 1) return <Umweg onDone={onDone} />;
  if (tier === 2) return <Rennen onDone={onDone} />;
  return <Ping onDone={onDone} />;
}

const pp = (p: Place): Pt => project(p.lon, p.lat, W, H);
const routePoints = (r: Route) => smooth(r.via.map(pp), 10);
const routeKm = (r: Route) => r.via.slice(1).reduce((sum, p, i) => sum + earthKm(r.via[i], p), 0);
const num = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const num1 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });

const CONTINENT_PATHS = CONTINENTS.map(
  (shape) => shape.map(([lon, lat], i) => `${i === 0 ? 'M' : 'L'}${pp({ name: '', lon, lat }).x.toFixed(1)} ${pp({ name: '', lon, lat }).y.toFixed(1)}`).join('') + 'Z',
);

function WorldMap() {
  return (
    <g className="nm-world">
      <rect x="0" y="0" width={W} height={H} rx="22" className="nm-ocean" />
      {CONTINENT_PATHS.map((d, i) => (
        <path key={i} d={d} className="nm-land" />
      ))}
    </g>
  );
}

const FRIENDS: Record<string, { emoji: EmojiName; who: string }> = {
  'New York': { emoji: 'boy', who: 'Leo in New York' },
  'Rio de Janeiro': { emoji: 'soccer-ball', who: 'Fußballfreunde in Rio' },
  Kapstadt: { emoji: 'penguin', who: 'die Pinguine in Kapstadt' },
  Tokio: { emoji: 'robot', who: 'eine Roboterschule in Tokio' },
  Sydney: { emoji: 'koala', who: 'die Koalas in Sydney' },
};

function cityNodes(to: Place, tone: MapNode['tone'] = 'plain'): MapNode[] {
  const friend = FRIENDS[to.name];
  return [
    { id: 'start', icon: 'house', label: 'Du', ...pp({ name: '', lon: 13.4, lat: 52.52 }), size: 48, tone: 'on' },
    { id: 'ziel', icon: friend?.emoji ?? 'house', label: to.name, ...pp(to), size: 54, tone },
  ];
}

// ---------------------------------------------------------------------------
// Stufe 1: Kabel kaputt – anderer Weg
// ---------------------------------------------------------------------------

const BREAK_AT = 0.55;

function Umweg({ onDone }: { onDone: () => void }) {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<'start' | 'unterwegs' | 'kaputt' | 'umweg' | 'da'>('start');
  const [results, setResults] = useState<('ok' | 'miss')[]>([]);
  const r = REROUTE_ROUNDS[round];
  const friend = FRIENDS[r.to.name];
  const [story, setStory] = useState(`Du schickst ${friend.who} ein Foto. Klick auf „Losschicken“ – dann reist das Paket durchs Seekabel.`);
  const travel = useTravel();
  const later = useAfterSpeech();
  const accident = ACCIDENT[r.accident];
  const broken = r.routes[0];
  const brokenPts = routePoints(broken);
  const breakPt = pointAt(brokenPts, BREAK_AT);

  const nodes = cityNodes(r.to, phase === 'da' ? 'on' : 'goal');
  const edges: MapEdge[] = r.routes.map((route, i) => ({
    id: route.id,
    points: routePoints(route),
    kind: 'meer',
    tone: i === 0 && phase !== 'start' && phase !== 'unterwegs' ? 'broken' : phase === 'kaputt' && i > 0 ? 'pick' : 'plain',
    label: phase === 'kaputt' && i > 0 ? route.name : undefined,
    // Über dem heilen Kabel verläuft oft das kaputte – die Beschriftung gehört darunter.
    labelBelow: true,
  }));

  const go = () => {
    sfx.tap();
    setPhase('unterwegs');
    setStory('Das Paket ist unterwegs …');
    travel.send({
      id: 'paket',
      icon: 'envelope',
      size: 38,
      points: slicePolyline(brokenPts, BREAK_AT),
      ms: 2200,
      onArrive: () => {
        sfx.boing();
        setPhase('kaputt');
        setStory(`${accident.text} Das Paket kommt nicht weiter. Such einen anderen Weg – klick ein heiles Kabel an!`);
      },
    });
  };

  const pick = (id: string) => {
    if (phase !== 'kaputt' || id === broken.id) return;
    const route = r.routes.find((x) => x.id === id);
    if (!route) return;
    sfx.click();
    setPhase('umweg');
    setStory(`Gute Idee: ${route.name}!`);
    travel.send({
      id: 'paket',
      icon: 'envelope',
      size: 38,
      points: routePoints(route),
      ms: 3000,
      onArrive: () => {
        sfx.success();
        setPhase('da');
        const nextResults: ('ok' | 'miss')[] = [...results, 'ok'];
        setResults(nextResults);
        setStory(`Angekommen! ${accident.fact}`);
        later(() => {
          if (round + 1 >= REROUTE_ROUNDS.length) {
            setStory('Super! Im Internet gibt es fast immer einen zweiten Weg. Reißt ein Kabel, nehmen die Pakete einfach einen anderen.');
            later(onDone, 3000);
            return;
          }
          const next = REROUTE_ROUNDS[round + 1];
          setRound(round + 1);
          setPhase('start');
          travel.clear();
          setStory(`Jetzt ein Foto für ${FRIENDS[next.to.name].who}. Klick auf „Losschicken“!`);
        }, 3600);
      },
    });
  };

  return (
    <div className="net-level">
      <Story text={story} mood={phase === 'da' ? 'cheer' : phase === 'kaputt' ? 'wink' : 'happy'} />
      <div className="net-stage">
        <NetMap
          width={W}
          height={H}
          label="Eine Weltkarte mit Seekabeln"
          nodes={nodes}
          edges={edges}
          packets={travel.packets}
          background={<WorldMap />}
          overlay={
            phase !== 'start' && phase !== 'unterwegs' && (
              <image href={emojiUrl(accident.emoji)} x={breakPt.x - 30} y={breakPt.y - 70} width="60" height="60" className="nm-accident" />
            )
          }
          onEdgeClick={phase === 'kaputt' ? pick : undefined}
        />
      </div>
      <div className="net-controls">
        <ProgressDots states={REROUTE_ROUNDS.map((_, i) => results[i] ?? (i === round ? 'now' : 'todo'))} />
        <button type="button" className="btn btn-leaf" onClick={go} disabled={phase !== 'start'}>
          <Emoji name="envelope-with-arrow" size={28} /> Losschicken
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stufe 2: Welcher Weg ist schneller?
// ---------------------------------------------------------------------------

/** So viel länger läuft die Animation als die echte Zeit – sonst sähe man nichts. */
const SLOW_MOTION = 28;

function Rennen({ onDone }: { onDone: () => void }) {
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState<string | null>(null);
  const [finished, setFinished] = useState<string[]>([]);
  const [results, setResults] = useState<('ok' | 'miss')[]>([]);
  const r = RACE_ROUNDS[round];
  const [story, setStory] = useState(
    `Zwei Wege nach ${r.to.name}. Licht schafft im Glasfaserkabel 200.000 Kilometer in einer Sekunde. Welches Paket ist zuerst da? Tipp auf einen Weg!`,
  );
  const travel = useTravel();
  const later = useAfterSpeech();
  const info = r.routes.map((route) => ({ route, km: routeKm(route), ms: travelMs(routeKm(route)) }));
  const fastest = info[0].km <= info[1].km ? info[0].route.id : info[1].route.id;
  const racing = guess !== null && finished.length < 2;

  const nodes = cityNodes(r.to, finished.length === 2 ? 'on' : 'goal');
  const edges: MapEdge[] = info.map(({ route }, i) => ({
    id: route.id,
    points: routePoints(route),
    kind: 'meer',
    tone: i === 0 ? 'route-a' : 'route-b',
  }));

  const start = (id: string) => {
    if (guess) return;
    sfx.tap();
    setGuess(id);
    setStory('Auf die Plätze, fertig, los!');
    info.forEach(({ route, ms }, i) => {
      travel.send({
        id: route.id,
        icon: 'envelope',
        label: i === 0 ? 'A' : 'B',
        size: 38,
        points: routePoints(route),
        ms: ms * SLOW_MOTION,
        onArrive: () => {
          setFinished((f) => [...f, route.id]);
          if (route.id !== fastest) return;
          const right = id === fastest;
          if (right) sfx.success();
          else sfx.wrong();
          const win = info.find((x) => x.route.id === fastest)!;
          setResults((rs) => [...rs, right ? 'ok' : 'miss']);
          setStory(
            `${right ? 'Richtig!' : 'Knapp daneben!'} ${win.route.name} ist kürzer: ${num.format(win.km)} km, also ${num1.format(win.ms)} Millisekunden. Kürzere Wege sind schneller.`,
          );
        },
      });
    });
  };

  const next = () => {
    if (round + 1 >= RACE_ROUNDS.length) {
      sfx.fanfare();
      setStory('Licht ist unglaublich schnell – aber nicht unendlich schnell. Darum stehen große Server oft in deiner Nähe.');
      later(onDone, 2600);
      return;
    }
    const n = RACE_ROUNDS[round + 1];
    setRound(round + 1);
    setGuess(null);
    setFinished([]);
    travel.clear();
    setStory(`Jetzt nach ${n.to.name}. Welcher Weg ist schneller?`);
  };

  return (
    <div className="net-level">
      <Story text={story} mood={finished.length === 2 ? 'cheer' : 'happy'} />
      <div className="net-stage">
        <NetMap
          width={W}
          height={H}
          label="Zwei Wege um die Welt im Wettrennen"
          nodes={nodes}
          edges={edges}
          packets={travel.packets}
          background={<WorldMap />}
          onEdgeClick={guess ? undefined : start}
        />
      </div>
      <div className="net-controls">
        <ProgressDots states={RACE_ROUNDS.map((_, i) => results[i] ?? (i === round ? 'now' : 'todo'))} />
        {info.map(({ route, km, ms }, i) => (
          <button
            key={route.id}
            type="button"
            className={['race-pick', i === 0 ? 'is-a' : 'is-b', guess === route.id ? 'is-guess' : ''].filter(Boolean).join(' ')}
            onClick={() => start(route.id)}
            disabled={guess !== null}
          >
            <b>{i === 0 ? 'A' : 'B'}</b> {route.name}
            {finished.includes(route.id) && (
              <small>
                {num.format(km)} km · {num1.format(ms)} ms
              </small>
            )}
          </button>
        ))}
        {finished.length === 2 && !racing && (
          <button type="button" className="btn btn-leaf" onClick={next}>
            {round + 1 >= RACE_ROUNDS.length ? 'Fertig' : 'Nächstes Rennen'}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stufe 3: Ein echter Ping
// ---------------------------------------------------------------------------

/** Ein winziges Paket zum eigenen Server und zurück – die Zeit dafür ist der Ping. */
async function pingOnce(): Promise<number | null> {
  const t0 = performance.now();
  try {
    const res = await fetch(`./favicon.svg?ping=${Date.now().toString(36)}`, { cache: 'no-store' });
    await res.arrayBuffer();
    return res.ok ? performance.now() - t0 : null;
  } catch {
    return null;
  }
}

const QUIZ = ['nach Paris', 'nach New York', 'zum Mond'];

function Ping({ onDone }: { onDone: () => void }) {
  const [pings, setPings] = useState<(number | null)[]>([]);
  const [running, setRunning] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [story, setStory] = useState(
    'Ein Ping ist ein winziges Paket, das zu einem Server fliegt und sofort zurückkommt. Drück auf „Ping senden“ und miss, wie schnell dein Internet ist!',
  );
  const later = useAfterSpeech();
  const done = pings.length === 5;
  const good = pings.filter((p): p is number => p !== null);
  const avg = good.length ? good.reduce((a, b) => a + b, 0) / good.length : null;

  const run = async () => {
    if (running) return;
    setRunning(true);
    setPings([]);
    sfx.tap();
    const out: (number | null)[] = [];
    for (let i = 0; i < 5; i++) {
      const ms = await pingOnce();
      out.push(ms);
      setPings([...out]);
      if (ms !== null) sfx.click();
      await new Promise((r) => window.setTimeout(r, 350));
    }
    setRunning(false);
    const ok = out.filter((p): p is number => p !== null);
    if (ok.length === 0) {
      setStory('Kein Ping kam zurück – ohne Internet geht das nicht. Die Tabelle zeigt trotzdem, wie lange es mindestens dauern würde.');
    } else {
      const mean = ok.reduce((a, b) => a + b, 0) / ok.length;
      setStory(
        `Dein Ping: im Schnitt ${num.format(mean)} Millisekunden. Der Server von Computerfuchs steht wohl gar nicht weit weg – große Seiten haben Server auf der ganzen Welt. Und jetzt eine Frage: Wohin dauert ein Ping am längsten?`,
      );
    }
  };

  const choose = (target: string) => {
    if (answer === 'zum Mond') return;
    setAnswer(target);
    const row = PING_TARGETS.find((t) => t.name === target)!;
    const ms = pingMs(row.km, row.space ? VACUUM_KM_PER_S : undefined);
    if (target === 'zum Mond') {
      sfx.fanfare();
      setStory('Richtig! Bis zum Mond und zurück braucht selbst Licht über zweieinhalb Sekunden. Im Internet sind es meist nur ein paar Millisekunden.');
      later(onDone, 3200);
    } else {
      sfx.wrong();
      setStory(`Nicht ganz: Ein Ping ${target} braucht mindestens ${num1.format(ms)} Millisekunden. Schau in die Tabelle – was ist am weitesten weg?`);
    }
  };

  return (
    <div className="net-level">
      <Story text={story} mood={answer === 'zum Mond' ? 'cheer' : 'happy'} />
      <div className="ping-grid">
        <section className="ping-card">
          <button type="button" className="btn btn-sky btn-big ping-btn" onClick={() => void run()} disabled={running}>
            <Emoji name="stopwatch" size={34} /> {running ? 'Ping läuft …' : pings.length ? 'Nochmal pingen' : 'Ping senden'}
          </button>
          <ol className="ping-list">
            {Array.from({ length: 5 }, (_, i) => {
              const p = pings[i];
              return (
                <li key={i} className={p === null ? 'is-lost' : undefined}>
                  <span>Ping {i + 1}</span>
                  <span className="ping-bar">
                    {p !== undefined && p !== null && <span style={{ width: `${Math.min(100, (p / 200) * 100)}%` }} />}
                  </span>
                  <b>{p === undefined ? '' : p === null ? 'weg' : `${num.format(p)} ms`}</b>
                </li>
              );
            })}
          </ol>
          {done && avg !== null && (
            <p className="ping-avg">
              Im Schnitt: <b>{num.format(avg)} ms</b>
            </p>
          )}
        </section>
        <section className="ping-card">
          <h3>So lange dauert es mindestens</h3>
          <table className="ping-table">
            <tbody>
              {PING_TARGETS.map((t) => (
                <tr key={t.name}>
                  <td>{t.name}</td>
                  <td>{num.format(t.km)} km</td>
                  <td>
                    <b>
                      {t.space
                        ? `${num1.format(pingMs(t.km, VACUUM_KM_PER_S) / 1000)} s`
                        : `${num1.format(pingMs(t.km))} ms`}
                    </b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="ping-note">Hin und zurück, mit Licht im Glasfaserkabel – zum Mond per Funk durchs Weltall.</p>
        </section>
      </div>
      {(done || answer) && (
        <div className="net-controls">
          <span className="net-question">Wohin dauert ein Ping am längsten?</span>
          {QUIZ.map((q) => (
            <button
              key={q}
              type="button"
              className={['btn', 'btn-small', answer === q ? (q === 'zum Mond' ? 'btn-leaf' : 'btn-berry') : 'btn-ghost'].join(' ')}
              onClick={() => choose(q)}
              disabled={answer === 'zum Mond'}
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
