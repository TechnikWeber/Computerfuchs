import { useRef, useState } from 'react';
import { useTimeouts } from '../../core/hooks';
import { defaultRng, sample } from '../../core/random';
import { sfx } from '../../core/sound';
import { speak } from '../../core/speech';
import type { LevelProps, Tier } from '../shared/levelTypes';
import { LevelHint, ProgressDots } from '../shared/LevelUi';
import { useHint } from '../shared/useHint';
import { DRILLS } from './content';
import { Hands, Keyboard, type Flash } from './Keyboard';
import { codesFor, FINGER_NAME, fingerFor } from './layout';
import { nextChar, startTyping, typeKey } from './typing';
import { TypingLine } from './TypingLine';
import { useKeys } from './useKeys';

const LINES: Record<Tier, number> = { 1: 4, 2: 4, 3: 5 };
const OPTS = { insertWrong: false, caseSensitive: false };

/** Tastatur Level 6: Grundstellung – jeder Finger hat seine Tasten. */
export function Zehnfinger({ tier, onDone }: LevelProps) {
  const [lines] = useState(() => sample(defaultRng, DRILLS[tier], LINES[tier]));
  const [index, setIndex] = useState(0);
  const [typing, setTyping] = useState(() => startTyping(lines[0]));
  const [results, setResults] = useState<('ok' | 'miss')[]>([]);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [hint, showHint] = useHint(2600);
  const misses = useRef(0);
  const flashes = useRef(0);
  const later = useTimeouts();
  const finished = typing.typed === typing.target;

  useKeys((e) => {
    if (finished) return;
    const expected = nextChar(typing);
    const { state, result } = typeKey(typing, e.key, OPTS);
    if (result === 'ignored') return;
    const n = ++flashes.current;
    setTyping(state);
    if (result === 'wrong') {
      sfx.wrong();
      setFlash({ code: e.code, ok: false, n });
      const finger = expected ? fingerFor(expected) : null;
      if (finger) {
        const text = expected === ' ' ? 'Die Leertaste drückst du mit dem Daumen.' : `Nimm den ${FINGER_NAME[finger]}.`;
        showHint(text);
        // Nur beim zweiten Fehler am Stück vorlesen – sonst redet Flinn zu viel.
        if (++misses.current % 2 === 0) speak(text);
      }
      return;
    }
    misses.current = 0;
    sfx.click();
    setFlash({ code: e.code, ok: true, n });
    if (result === 'done') {
      sfx.correct();
      setResults((r) => [...r, state.errors === 0 ? 'ok' : 'miss']);
      later(() => {
        if (index + 1 >= lines.length) {
          sfx.success();
          onDone();
          return;
        }
        setIndex(index + 1);
        setTyping(startTyping(lines[index + 1]));
      }, 600);
    }
  });

  const next = nextChar(typing);
  const finger = next ? fingerFor(next) : null;
  const states = lines.map((_, i) => results[i] ?? (i === index ? 'now' : 'todo'));

  return (
    <div className="kb-level tenfinger">
      <div className="kb-level-top">
        <ProgressDots states={states} />
      </div>
      <div className="tenfinger-card" key={index}>
        <TypingLine state={typing} size="medium" className="is-mono" />
        <p className="tenfinger-finger">
          {finger ? (next === ' ' ? 'Leertaste – mit dem Daumen' : `${next?.toLocaleUpperCase('de')} – ${FINGER_NAME[finger]}`) : ' '}
        </p>
      </div>
      <Hands active={finger} />
      <Keyboard highlight={next ? codesFor(next) : []} flash={flash} fingers compact className="kb-level-keys" />
      <LevelHint text={hint} />
    </div>
  );
}
