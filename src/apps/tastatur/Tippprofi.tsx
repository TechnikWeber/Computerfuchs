import { useRef, useState } from 'react';
import { useTimeouts } from '../../core/hooks';
import { defaultRng, pick, sample } from '../../core/random';
import { sfx } from '../../core/sound';
import { Fox } from '../../os/Fox';
import type { LevelProps, Tier } from '../shared/levelTypes';
import { LevelHint, ProgressDots } from '../shared/LevelUi';
import { useHint } from '../shared/useHint';
import { FLINN_SPEED, RACE_TEXTS, SHIFT_PHRASES, SPECIAL_PHRASES } from './content';
import { Keyboard, type Flash } from './Keyboard';
import { codesFor, howToType, sameLetter } from './layout';
import { nextChar, perMinute, startTyping, typeKey, type TypingOptions } from './typing';
import { TypingLine } from './TypingLine';
import { useFrame, useKeys } from './useKeys';

function pickTexts(tier: Tier): string[] {
  if (tier === 1) return sample(defaultRng, SHIFT_PHRASES, 4);
  if (tier === 2) return sample(defaultRng, SPECIAL_PHRASES, 4);
  return [pick(defaultRng, RACE_TEXTS)];
}

/** Tastatur Level 7: Großbuchstaben, Satzzeichen und ein Wettrennen gegen Flinn. */
export function Tippprofi({ tier, onDone }: LevelProps) {
  const opts: TypingOptions = { insertWrong: tier === 3, caseSensitive: true };
  const [texts] = useState(() => pickTexts(tier));
  const [index, setIndex] = useState(0);
  const [typing, setTyping] = useState(() => startTyping(texts[0]));
  const [results, setResults] = useState<('ok' | 'miss')[]>([]);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [outcome, setOutcome] = useState<{ apm: number; won: boolean } | null>(null);
  const [hint, showHint] = useHint(3000);
  const flashes = useRef(0);
  const later = useTimeouts();
  const finished = typing.typed === typing.target;
  const racing = tier === 3 && startedAt !== null && !outcome;

  useFrame(() => setNow(performance.now()), racing);

  useKeys((e) => {
    if (finished || outcome) return;
    const expected = nextChar(typing);
    const { state, result } = typeKey(typing, e.key, opts);
    if (result === 'ignored') return;
    const t = performance.now();
    if (tier === 3 && startedAt === null) {
      setStartedAt(t);
      setNow(t);
    }
    const n = ++flashes.current;
    setTyping(state);
    if (result === 'wrong') {
      sfx.wrong();
      setFlash({ code: e.code, ok: false, n });
      if (expected && sameLetter(e.key, expected) && e.key !== expected) {
        showHint(expected === expected.toLocaleUpperCase('de') ? 'Großer Buchstabe: Halte ⇧ gedrückt.' : 'Hier bitte klein – ohne ⇧.');
      } else if (expected && howToType(expected)) {
        showHint(`So geht's: ${howToType(expected)}`);
      } else if (opts.insertWrong) {
        showHint('Vertippt? Lösch den roten Buchstaben mit ⌫.');
      }
      return;
    }
    if (result === 'blocked') {
      sfx.boing();
      showHint('Erst mit der Rücktaste ⌫ löschen!');
      return;
    }
    if (result === 'deleted') {
      sfx.tap();
      return;
    }
    sfx.click();
    setFlash({ code: e.code, ok: true, n });
    if (result !== 'done') return;

    setResults((r) => [...r, state.errors === 0 ? 'ok' : 'miss']);
    if (tier === 3) {
      const started = startedAt ?? t;
      const ms = Math.max(1, t - started);
      const apm = perMinute(state.target.length, ms);
      const flinnMs = (state.target.length / FLINN_SPEED) * 60_000;
      const won = ms <= flinnMs;
      setOutcome({ apm, won });
      if (won) sfx.fanfare();
      else sfx.success();
      later(() => onDone(apm), 2600);
      return;
    }
    sfx.correct();
    later(() => {
      if (index + 1 >= texts.length) {
        sfx.success();
        onDone();
        return;
      }
      setIndex(index + 1);
      setTyping(startTyping(texts[index + 1]));
    }, 700);
  });

  const next = nextChar(typing);
  let lit: string[] = [];
  if (!finished && next === null) lit = ['Backspace'];
  else if (next && (tier === 1 || (tier === 2 && howToType(next)))) lit = codesFor(next);
  const how = next && tier < 3 ? howToType(next) : null;

  // Wettrennen: Flinn tippt gleichmäßig mit 60 Anschlägen pro Minute.
  const total = typing.target.length;
  const elapsed = startedAt !== null ? Math.max(0, now - startedAt) : 0;
  const flinnAt = Math.min(total, (elapsed / 60_000) * FLINN_SPEED);
  const flinn = outcome && !outcome.won ? total : flinnAt;
  const mine = typing.typed === typing.target ? total : Math.min(total, typing.typed.length);

  return (
    <div className="kb-level profi">
      {tier < 3 ? (
        <div className="kb-level-top">
          <ProgressDots states={texts.map((_, i) => results[i] ?? (i === index ? 'now' : 'todo'))} />
        </div>
      ) : (
        <div className="race" aria-label="Wettrennen">
          <div className="race-lane">
            <span className="race-name">Du</span>
            <div className="race-bar">
              <span className="race-fill is-me" style={{ width: `${(mine / total) * 100}%` }} />
            </div>
          </div>
          <div className="race-lane">
            <span className="race-name">
              <Fox size={26} /> Flinn
            </span>
            <div className="race-bar">
              <span className="race-fill is-flinn" style={{ width: `${(flinn / total) * 100}%` }} />
            </div>
          </div>
          {startedAt === null && <p className="race-start">Das Rennen startet mit deinem ersten Buchstaben.</p>}
        </div>
      )}
      <div className="profi-card" key={index}>
        <TypingLine state={typing} size={tier === 3 ? 'medium' : 'big'} />
        <p className="profi-how">{how ?? ' '}</p>
      </div>
      {outcome && (
        <div className={outcome.won ? 'race-result is-won' : 'race-result'} role="status">
          <Fox size={64} mood={outcome.won ? 'cheer' : 'wink'} />
          <p>
            <strong>{outcome.apm} Anschläge pro Minute.</strong>{' '}
            {outcome.won ? 'Du warst schneller als Flinn!' : 'Flinn war diesmal schneller – übe weiter, dann holst du ihn ein!'}
          </p>
        </div>
      )}
      <Keyboard highlight={lit} flash={flash} className="kb-level-keys" />
      <LevelHint text={hint} />
    </div>
  );
}
