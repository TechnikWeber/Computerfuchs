import { useEffect, useRef, useState } from 'react';
import { useAfterSpeech } from '../../core/hooks';
import { defaultRng, sample } from '../../core/random';
import { sfx } from '../../core/sound';
import { speak } from '../../core/speech';
import { Emoji } from '../../os/Emoji';
import { Icon } from '../../os/Icon';
import type { LevelProps, Tier } from '../shared/levelTypes';
import { LevelHint, ProgressDots } from '../shared/LevelUi';
import { useHint } from '../shared/useHint';
import { WORDS_CASED, WORDS_LONG, WORDS_SHORT, type PictureWord } from './content';
import { Keyboard, type Flash } from './Keyboard';
import { codesFor, sameLetter, strokeFor } from './layout';
import { nextChar, startTyping, typeKey, type TypingOptions } from './typing';
import { TypingLine } from './TypingLine';
import { useKeys } from './useKeys';

const TIERS: Record<Tier, { words: PictureWord[]; count: number; opts: TypingOptions }> = {
  1: { words: WORDS_SHORT, count: 5, opts: { insertWrong: false, caseSensitive: false } },
  2: { words: WORDS_LONG, count: 5, opts: { insertWrong: true, caseSensitive: false } },
  3: { words: WORDS_CASED, count: 5, opts: { insertWrong: true, caseSensitive: true } },
};

/** Tastatur Level 5: Das Wort zum Bild schreiben. */
export function Woerter({ tier, onDone }: LevelProps) {
  const cfg = TIERS[tier];
  const [words] = useState(() => sample(defaultRng, cfg.words, cfg.count));
  const [index, setIndex] = useState(0);
  const [typing, setTyping] = useState(() => startTyping(words[0].word));
  const [results, setResults] = useState<('ok' | 'miss')[]>([]);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [shiftHelp, setShiftHelp] = useState(false);
  const [hint, showHint] = useHint(2800);
  const flashes = useRef(0);
  const later = useAfterSpeech();
  const item = words[index];
  const finished = typing.typed === typing.target;

  useEffect(() => {
    speak(item.word);
  }, [item.word]);

  useKeys((e) => {
    if (finished) return;
    const expected = nextChar(typing);
    const { state, result } = typeKey(typing, e.key, cfg.opts);
    if (result === 'ignored') return;
    const n = ++flashes.current;
    setTyping(state);
    if (result === 'ok' || result === 'done') {
      sfx.click();
      setFlash({ code: e.code, ok: true, n });
      setShiftHelp(false);
    }
    if (result === 'deleted') sfx.tap();
    if (result === 'blocked') {
      sfx.boing();
      showHint('Erst die falschen Buchstaben mit der Rücktaste ⌫ löschen!');
    }
    if (result === 'wrong') {
      sfx.wrong();
      setFlash({ code: e.code, ok: false, n });
      if (expected && cfg.opts.caseSensitive && sameLetter(e.key, expected)) {
        setShiftHelp(true);
        showHint(
          expected === expected.toLocaleUpperCase('de')
            ? 'Großer Buchstabe: Halte die Umschalttaste ⇧ gedrückt.'
            : 'Hier kommt ein kleiner Buchstabe – ohne ⇧.',
        );
      } else if (cfg.opts.insertWrong) {
        showHint('Vertippt? Mit der Rücktaste ⌫ löschst du den roten Buchstaben.');
      } else if (expected) {
        showHint(`Such das ${expected.toLocaleUpperCase('de')}!`);
      }
    }
    if (result === 'done') {
      sfx.success();
      speak(item.word);
      setResults((r) => [...r, state.errors === 0 ? 'ok' : 'miss']);
      later(() => {
        if (index + 1 >= words.length) {
          onDone();
          return;
        }
        setIndex(index + 1);
        setTyping(startTyping(words[index + 1].word));
      }, 1200);
    }
  });

  const next = nextChar(typing);
  let lit: string[] = [];
  if (!finished && next === null) lit = ['Backspace'];
  else if (next && tier === 1) lit = [strokeFor(next.toLocaleLowerCase('de'))?.code ?? ''];
  else if (next && shiftHelp) lit = codesFor(next);

  const states = words.map((_, i) => results[i] ?? (i === index ? 'now' : 'todo'));

  return (
    <div className="kb-level words">
      <div className="kb-level-top">
        <ProgressDots states={states} />
      </div>
      <div className={finished ? 'words-card is-done' : 'words-card'} key={index}>
        <Emoji name={item.emoji} size={150} alt={item.word} className="words-pic" />
        <TypingLine state={typing} />
        <button type="button" className="icon-btn words-speak" onClick={() => speak(item.word, { force: true })} aria-label="Wort vorlesen">
          <Icon name="speaker" size={26} />
        </button>
      </div>
      <Keyboard highlight={lit} flash={flash} compact={tier === 1} className="kb-level-keys" />
      <LevelHint text={hint} />
    </div>
  );
}
