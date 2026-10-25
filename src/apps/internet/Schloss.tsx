import { useEffect, useState } from 'react';
import { emojiUrl } from '../../core/emoji';
import { useAfterSpeech, useLatest } from '../../core/hooks';
import { sfx } from '../../core/sound';
import { Emoji } from '../../os/Emoji';
import { useWindow } from '../../os/osContext';
import type { LevelProps } from '../shared/levelTypes';
import { ProgressDots } from '../shared/LevelUi';
import { CIPHER_ROUNDS, CIPHER_SHIFT, LOGIN_ROUNDS, MESSAGES } from './content';
import { caesar, isHttps, ownerOf } from './net';
import { cable, useTravel, type MapNode } from './map';
import { Browser, NetMap, Story } from './ui';

/** Kapitel 5: Das Schloss – verschlüsselt verschicken, und woran man sichere Seiten erkennt. */
export function Schloss({ tier, onDone }: LevelProps) {
  if (tier === 1) return <Schatzkiste onDone={onDone} />;
  if (tier === 2) return <Geheimschrift onDone={onDone} />;
  return <Passwort onDone={onDone} />;
}

// ---------------------------------------------------------------------------
// Stufe 1: Postkarte oder Schatzkiste?
// ---------------------------------------------------------------------------

const WAY_NODES: MapNode[] = [
  { id: 'du', icon: 'house', label: 'Dein Haus', x: 110, y: 260, size: 104 },
  { id: 'waschbaer', icon: 'raccoon', label: 'Neugieriger Waschbär', x: 500, y: 300, size: 104 },
  { id: 'oma', icon: 'house-with-garden', label: 'Oma', x: 890, y: 260, size: 104 },
];

function Schatzkiste({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [moving, setMoving] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [missed, setMissed] = useState(false);
  const [results, setResults] = useState<('ok' | 'miss')[]>([]);
  const [story, setStory] = useState(
    // Die Nachricht steht mit im Text, damit sie auch vorgelesen wird.
    `Unterwegs sitzt ein neugieriger Waschbär. Er liest alles, was offen ist! Wie schickst du diese Nachricht: „${MESSAGES[0].text}“ – als Postkarte oder in der Schatzkiste mit Schloss?`,
  );
  const travel = useTravel();
  const later = useAfterSpeech();
  const msg = MESSAGES[index];
  const finished = results.length === MESSAGES.length;
  const [du, bear, oma] = WAY_NODES;

  const nextMessage = (ok: boolean) => {
    const nextResults: ('ok' | 'miss')[] = [...results, ok ? 'ok' : 'miss'];
    setResults(nextResults);
    later(() => {
      setBubble(null);
      if (nextResults.length >= MESSAGES.length) {
        sfx.fanfare();
        setStory('Super! Geheimes gehört in die Schatzkiste. Im Internet ist das Schloss in der Adressleiste diese Kiste: Dann ist alles unterwegs verschlossen.');
        later(onDone, 3200);
        return;
      }
      setIndex(index + 1);
      setMissed(false);
      setMoving(false);
      setStory(`Und diese Nachricht: „${MESSAGES[index + 1].text}“ – Postkarte oder Schatzkiste?`);
    }, 3200);
  };

  const send = (box: boolean) => {
    if (moving || finished) return;
    sfx.tap();
    setMoving(true);
    setBubble(null);
    travel.send({
      id: 'brief',
      icon: box ? 'locked-with-key' : 'memo',
      size: 56,
      points: [du, { x: bear.x, y: bear.y - 70 }],
      ms: 1500,
      onArrive: () => {
        if (!box) {
          setBubble(`„${msg.text}“`);
          if (msg.secret) {
            sfx.wrong();
            setMissed(true);
            setStory(`Der Waschbär liest laut vor: „${msg.text}“ Oh nein – jetzt kennt er dein Geheimnis! So etwas gehört in die Schatzkiste. Probier es nochmal!`);
            travel.clear();
            later(() => {
              setBubble(null);
              setMoving(false);
            }, 2600);
            return;
          }
          setStory(`Der Waschbär liest mit: „${msg.text}“ Macht nichts – das darf ruhig jeder lesen.`);
        } else {
          setBubble('Mist, verschlossen!');
        }
        travel.send({
          id: 'brief',
          icon: box ? 'locked-with-key' : 'memo',
          size: 56,
          points: [{ x: bear.x, y: bear.y - 70 }, oma],
          ms: 1300,
          onArrive: () => {
            sfx.success();
            if (box) {
              setStory(
                msg.secret
                  ? 'Richtig! Nur Oma hat den Schlüssel – der Waschbär konnte nichts lesen.'
                  : 'Auch gut – sicher ist sicher! Nur Oma hat den Schlüssel.',
              );
            }
            nextMessage(!missed);
          },
        });
      },
    });
  };

  const nodes = WAY_NODES.map((n): MapNode => ({ ...n, tone: n.id === 'waschbaer' && bubble ? 'warn' : 'plain' }));
  const edges = [cable(nodes, 'du', 'waschbaer', { tone: moving ? 'active' : 'plain' }), cable(nodes, 'waschbaer', 'oma', { tone: moving ? 'active' : 'plain' })];

  return (
    <div className="net-level">
      <Story text={story} mood={finished ? 'cheer' : 'happy'} />
      <div className="net-stage net-stage-short">
        <NetMap
          width={1000}
          height={430}
          label="Der Weg zu Oma mit einem neugierigen Waschbären"
          nodes={nodes}
          edges={edges}
          packets={travel.packets}
          overlay={
            bubble && (
              <foreignObject x={bear.x - 190} y={bear.y - 210} width="380" height="110">
                <div className="raccoon-bubble">{bubble}</div>
              </foreignObject>
            )
          }
        />
      </div>
      {!finished && (
        <div className="message-card">
          <Emoji name={msg.emoji} size={58} />
          <p>{msg.text}</p>
          <div className="message-actions">
            <button type="button" className="btn btn-sun" onClick={() => send(false)} disabled={moving}>
              <Emoji name="memo" size={30} /> Postkarte
            </button>
            <button type="button" className="btn btn-leaf" onClick={() => send(true)} disabled={moving}>
              <Emoji name="locked-with-key" size={30} /> Schatzkiste
            </button>
          </div>
        </div>
      )}
      <div className="net-controls">
        <ProgressDots states={MESSAGES.map((_, i) => results[i] ?? (i === index ? 'now' : 'todo'))} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stufe 2: Die Geheimschrift
// ---------------------------------------------------------------------------

const ABC = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

function Geheimschrift({ onDone }: { onDone: () => void }) {
  const win = useWindow();
  const [round, setRound] = useState(0);
  const [pos, setPos] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [results, setResults] = useState<('ok' | 'miss')[]>([]);
  const [missed, setMissed] = useState(false);
  const r = CIPHER_ROUNDS[round];
  const decode = r.mode === 'entschluesseln';
  const plain = r.word;
  const secret = caesar(plain, CIPHER_SHIFT);
  // Gezeigt wird, was man hat; getippt wird, was man sucht.
  const shown = decode ? secret : plain;
  const wanted = decode ? plain : secret;
  const done = pos >= wanted.length;
  const [story, setStory] = useState(
    `Flinn hat dir eine Geheimnachricht geschickt: ${secret}. Jeder Buchstabe ist um ${CIPHER_SHIFT} Stellen verschoben. Such ihn unten auf dem Streifen – darüber steht der echte Buchstabe. Klick ihn an!`,
  );
  const later = useAfterSpeech();

  const press = (letter: string) => {
    if (done) return;
    if (letter !== wanted[pos]) {
      sfx.wrong();
      setWrong(letter);
      setMissed(true);
      setStory(
        decode
          ? `Such ${shown[pos]} unten auf dem Streifen – der Buchstabe genau darüber ist der echte.`
          : `Such ${shown[pos]} oben auf dem Streifen – der Buchstabe genau darunter ist die Geheimschrift.`,
      );
      return;
    }
    sfx.click();
    setWrong(null);
    const next = pos + 1;
    setPos(next);
    if (next < wanted.length) return;
    sfx.success();
    setResults((rs) => [...rs, missed ? 'miss' : 'ok']);
    setStory(decode ? `Geknackt! Die Nachricht heißt ${plain}.` : `Fertig! ${plain} heißt in Geheimschrift ${secret}. Nur wer den Schlüssel ${CIPHER_SHIFT} kennt, kann es lesen.`);
    later(() => {
      if (round + 1 >= CIPHER_ROUNDS.length) {
        sfx.fanfare();
        setStory('Das ist Verschlüsselung! Im Internet ist sie viel schwerer zu knacken – aber die Idee ist dieselbe: Ohne Schlüssel bleibt es Buchstabensalat.');
        later(onDone, 3200);
        return;
      }
      const n = CIPHER_ROUNDS[round + 1];
      setRound(round + 1);
      setPos(0);
      setMissed(false);
      setStory(
        n.mode === 'entschluesseln'
          ? `Noch eine Geheimnachricht: ${caesar(n.word, CIPHER_SHIFT)}. Knack sie!`
          : `Jetzt du: Verschlüssle ${n.word} für Oma. Such jeden Buchstaben oben – darunter steht die Geheimschrift. Klick ihn unten an!`,
      );
    }, 2600);
  };

  const onKey = useLatest((e: KeyboardEvent) => {
    const k = e.key.toUpperCase();
    if (k.length === 1 && ABC.includes(k)) press(k);
  });
  useEffect(() => {
    if (!win.focused) return;
    const handler = (e: KeyboardEvent) => onKey.current(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [win.focused, onKey]);

  const findLetter = !done ? shown[pos] : null;

  return (
    <div className="net-level">
      <Story text={story} mood={done ? 'cheer' : 'happy'} />
      <div className="cipher">
        <div className="cipher-word">
          {[...shown].map((ch, i) => (
            <span key={i} className={['cipher-tile', i === pos && !done ? 'is-current' : '', i < pos ? 'is-done' : ''].filter(Boolean).join(' ')}>
              <small>{ch}</small>
              {i < pos ? wanted[i] : '?'}
            </span>
          ))}
        </div>
        <p className="cipher-key">
          <Emoji name="old-key" size={30} /> Schlüssel: jeder Buchstabe {CIPHER_SHIFT} Stellen weiter
        </p>
        <div className="cipher-strip" role="group" aria-label="Geheimschrift-Streifen">
          <div className="cipher-row is-plain">
            {ABC.map((ch) => (
              <button
                key={ch}
                type="button"
                className={['cipher-cell', !decode ? '' : 'is-pick', !decode && ch === findLetter ? 'is-find' : '', decode && wrong === ch ? 'is-wrong' : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => decode && press(ch)}
                tabIndex={decode ? 0 : -1}
              >
                {ch}
              </button>
            ))}
          </div>
          <div className="cipher-row is-secret">
            {ABC.map((ch) => {
              const s = caesar(ch, CIPHER_SHIFT);
              return (
                <button
                  key={ch}
                  type="button"
                  className={['cipher-cell', decode ? '' : 'is-pick', decode && s === findLetter ? 'is-find' : '', !decode && wrong === s ? 'is-wrong' : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => !decode && press(s)}
                  tabIndex={decode ? -1 : 0}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="net-controls">
        <ProgressDots states={CIPHER_ROUNDS.map((_, i) => results[i] ?? (i === round ? 'now' : 'todo'))} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stufe 3: Wo darf das Passwort hin?
// ---------------------------------------------------------------------------

function Passwort({ onDone }: { onDone: () => void }) {
  const [round, setRound] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [results, setResults] = useState<('ok' | 'miss')[]>([]);
  const [story, setStory] = useState(
    'Achte auf zwei Dinge: Ist das Schloss in der Adressleiste da? Und gehört die Adresse wirklich zu der Seite, die sie sein will? Würdest du hier dein Passwort eingeben?',
  );
  const later = useAfterSpeech();
  const r = LOGIN_ROUNDS[round];

  const choose = (yes: boolean) => {
    if (answer !== null) return;
    setAnswer(yes);
    const right = yes === r.safe;
    if (right) sfx.correct();
    else sfx.wrong();
    setResults((rs) => [...rs, right ? 'ok' : 'miss']);
    setStory(`${right ? 'Richtig!' : 'Aufgepasst!'} ${r.why}`);
  };

  const next = () => {
    if (round + 1 >= LOGIN_ROUNDS.length) {
      sfx.fanfare();
      setStory('Merke: Das Schloss heißt nur, dass niemand unterwegs mitlesen kann. Ob die Seite echt ist, verrät die Adresse. Und Passwörter gibst du nur ein, wenn du ganz sicher bist.');
      later(onDone, 3400);
      return;
    }
    setRound(round + 1);
    setAnswer(null);
    setStory('Und hier – würdest du dein Passwort eingeben?');
  };

  return (
    <div className="net-level">
      <Story text={story} mood={answer !== null && answer === r.safe ? 'cheer' : 'happy'} />
      <div className="owner-layout">
        <Browser url={r.url} highlight={answer !== null ? ownerOf(r.url) : undefined} className="owner-browser">
          <div className="fake-login" aria-hidden="true">
            <img src={emojiUrl(isHttps(r.url) ? 'locked' : 'unlocked')} width="54" height="54" alt="" />
            <div className="fake-field">Name</div>
            <div className="fake-field">Passwort ••••••</div>
            <div className="fake-button">Anmelden</div>
          </div>
        </Browser>
        <div className="owner-options">
          <button
            type="button"
            className={['btn', answer === null ? 'btn-leaf' : r.safe ? 'btn-leaf' : answer ? 'btn-berry' : 'btn-ghost'].join(' ')}
            onClick={() => choose(true)}
            disabled={answer !== null}
          >
            Ja, hier schon
          </button>
          <button
            type="button"
            className={['btn', answer === null ? 'btn-berry' : !r.safe ? 'btn-leaf' : answer === false ? 'btn-berry' : 'btn-ghost'].join(' ')}
            onClick={() => choose(false)}
            disabled={answer !== null}
          >
            Nein, lieber nicht
          </button>
        </div>
      </div>
      <div className="net-controls">
        <ProgressDots states={LOGIN_ROUNDS.map((_, i) => results[i] ?? (i === round ? 'now' : 'todo'))} />
        {answer !== null && (
          <button type="button" className="btn btn-leaf" onClick={next}>
            {round + 1 >= LOGIN_ROUNDS.length ? 'Fertig' : 'Weiter'}
          </button>
        )}
      </div>
    </div>
  );
}
