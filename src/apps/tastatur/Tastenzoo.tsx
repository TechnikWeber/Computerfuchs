import { useEffect, useRef, useState } from 'react';
import { useTimeouts } from '../../core/hooks';
import { defaultRng, pick, sample } from '../../core/random';
import { sfx } from '../../core/sound';
import { speak } from '../../core/speech';
import { Emoji } from '../../os/Emoji';
import { Icon } from '../../os/Icon';
import type { LevelProps, Tier } from '../shared/levelTypes';
import { LevelHint, ProgressDots } from '../shared/LevelUi';
import { useHint } from '../shared/useHint';
import { ANLAUT, EASY_LETTERS, type PictureWord } from './content';
import { Keyboard, type Flash } from './Keyboard';
import { sameLetter, strokeFor } from './layout';
import { useKeys } from './useKeys';

const ROUNDS: Record<Tier, number> = { 1: 6, 2: 8, 3: 8 };

/** Beim Hinhören (Stufe 3) nur Wörter, deren erster Laut wie der Buchstabe klingt – „Eule“ beginnt mit „Eu“. */
const TRICKY_SOUND = new Set(['Eule', 'Einhorn']);

function pickRounds(tier: Tier): PictureWord[] {
  const byLetter = new Map<string, PictureWord[]>();
  for (const w of ANLAUT) {
    if (tier === 3 && TRICKY_SOUND.has(w.word)) continue;
    const l = w.word[0].toLocaleLowerCase('de');
    byLetter.set(l, [...(byLetter.get(l) ?? []), w]);
  }
  const letters = tier === 1 ? EASY_LETTERS.filter((l) => byLetter.has(l)) : [...byLetter.keys()];
  return sample(defaultRng, letters, ROUNDS[tier]).map((l) => pick(defaultRng, byLetter.get(l) ?? []));
}

/** Tastatur Level 1: Zu jedem Bild die Taste mit dem Anfangsbuchstaben finden. */
export function Tastenzoo({ tier, onDone }: LevelProps) {
  const [rounds] = useState(() => pickRounds(tier));
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<('ok' | 'miss')[]>([]);
  const [missed, setMissed] = useState(false);
  const [solved, setSolved] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [hint, showHint] = useHint(2600);
  const flashes = useRef(0);
  const later = useTimeouts();

  const item = rounds[round];
  const letter = item.word[0].toLocaleUpperCase('de');
  const prompt = tier === 3 ? `${item.word}. Mit welchem Buchstaben fängt ${item.word} an?` : `${letter} wie ${item.word}.`;

  useEffect(() => {
    speak(prompt);
  }, [prompt]);

  useKeys((e) => {
    if (solved || [...e.key].length !== 1) return;
    const n = ++flashes.current;
    if (sameLetter(e.key, letter)) {
      sfx.correct();
      setFlash({ code: e.code, ok: true, n });
      setSolved(true);
      setResults((r) => [...r, missed ? 'miss' : 'ok']);
      speak(`${letter} wie ${item.word}!`);
      later(() => {
        if (round + 1 >= rounds.length) {
          onDone();
          return;
        }
        setRound(round + 1);
        setSolved(false);
        setMissed(false);
      }, 1300);
      return;
    }
    sfx.wrong();
    setFlash({ code: e.code, ok: false, n });
    setMissed(true);
    const pressed = e.key.toLocaleUpperCase('de');
    if (tier === 3) {
      showHint(`Das war ${pressed}. Hör noch mal hin: ${item.word}`);
      speak(item.word);
    } else {
      showHint(`Das war ${pressed}. Such das ${letter}!`);
    }
  });

  const states = rounds.map((_, i) => (i < results.length ? results[i] : i === round && !solved ? 'now' : 'todo'));
  const target = strokeFor(letter.toLocaleLowerCase('de'))?.code;

  return (
    <div className="kb-level zoo">
      <div className="kb-level-top">
        <ProgressDots states={states} />
      </div>
      <div className={solved ? 'zoo-card is-solved' : 'zoo-card'} key={round}>
        <Emoji name={item.emoji} size={168} alt={item.word} className="zoo-pic" />
        <div className="zoo-word">
          {tier === 3 && !solved ? (
            <span className="zoo-letter is-hidden">?</span>
          ) : (
            <>
              <span className="zoo-letter">{letter}</span>
              <span className="zoo-rest">wie {item.word}</span>
            </>
          )}
        </div>
        <button type="button" className="icon-btn zoo-speak" onClick={() => speak(prompt, { force: true })} aria-label="Nochmal vorlesen">
          <Icon name="speaker" size={26} />
        </button>
      </div>
      <Keyboard highlight={tier === 1 && target ? [target] : []} flash={flash} compact className="kb-level-keys" />
      <LevelHint text={hint} />
    </div>
  );
}
