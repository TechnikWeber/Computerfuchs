import { useCallback, useEffect, useRef, useState } from 'react';
import { useLatest, useTimeouts } from '../../core/hooks';
import { defaultRng } from '../../core/random';
import { sfx } from '../../core/sound';
import { speak, stopSpeaking } from '../../core/speech';
import { useOs, useWindow, type CompleteResult } from '../../os/osContext';
import { starsForScore } from '../shared/levelTypes';
import { LevelIntro, LevelMap, LevelTop, ProgressDots, ResultScreen } from '../shared/LevelUi';
import { NumberPad } from '../shared/NumberPad';
import { MathVisual } from './MathVisual';
import { RECHNEN_LEVELS, makeRound, taskSpeech, type RechnenLevel } from './tasks';

const AGE: Record<string, number> = { zaehlen: 4, plus10: 5, minus10: 6, bis20: 6, einmaleins: 7, bis100: 8 };

type View =
  | { name: 'map' }
  | { name: 'intro'; level: RechnenLevel }
  | { name: 'play'; level: RechnenLevel; run: number }
  | { name: 'result'; level: RechnenLevel; result: CompleteResult; correct: number; total: number };

export default function RechnenApp() {
  const os = useOs();
  const progress = os.profile.progress.rechnen ?? {};
  const [view, setView] = useState<View>({ name: 'map' });

  // Weiter kommt, wer die Stufe davor geschafft hat – oder schon alt genug dafür ist.
  const isUnlocked = (i: number) => {
    if (i === 0 || os.allOpen || os.group === 'gross') return true;
    const level = RECHNEN_LEVELS[i];
    return (progress[RECHNEN_LEVELS[i - 1].id]?.stars ?? 0) > 0 || os.profile.age >= AGE[level.id] + 1;
  };

  const toMap = () => {
    stopSpeaking();
    setView({ name: 'map' });
  };

  if (view.name === 'map') {
    return (
      <div className="app-scroll">
        <LevelMap
          title="Rechnen"
          intro="Vom Zählen bis zum Kopfrechnen bis 100. Jede Runde hat 10 Aufgaben – immer wieder neue."
          levels={RECHNEN_LEVELS}
          progress={progress}
          isUnlocked={isUnlocked}
          badge={(l) => (l as RechnenLevel).age}
          onPick={(l) => {
            sfx.tap();
            setView({ name: 'intro', level: l as RechnenLevel });
          }}
        />
      </div>
    );
  }

  if (view.name === 'intro') {
    const { level } = view;
    return (
      <LevelIntro
        level={level}
        text={level.intro}
        onStart={() => {
          stopSpeaking();
          setView({ name: 'play', level, run: Date.now() });
        }}
        onBack={toMap}
      />
    );
  }

  if (view.name === 'play') {
    const { level, run } = view;
    return (
      <Round
        key={run}
        level={level}
        onBack={toMap}
        onFinish={(correct, total) => {
          const result = os.completeLevel('rechnen', level.id, starsForScore(correct, total));
          sfx.success();
          setView({ name: 'result', level, result, correct, total });
        }}
      />
    );
  }

  const { level, result, correct, total } = view;
  const index = RECHNEN_LEVELS.findIndex((l) => l.id === level.id);
  const nextLevel = RECHNEN_LEVELS[index + 1];
  return (
    <div className="app-scroll">
      <ResultScreen
        level={level}
        result={result}
        detail={`${correct} von ${total} beim ersten Versuch richtig.`}
        next={nextLevel ? { label: nextLevel.title, onClick: () => setView({ name: 'intro', level: nextLevel }) } : undefined}
        onReplay={() => setView({ name: 'play', level, run: Date.now() })}
        onMap={toMap}
      />
    </div>
  );
}

type Feedback = 'none' | 'ok' | 'wrong' | 'reveal';

/** Eine Runde mit 10 Aufgaben. Wer sich vertut, hat einen zweiten Versuch. */
function Round({ level, onBack, onFinish }: { level: RechnenLevel; onBack: () => void; onFinish: (correct: number, total: number) => void }) {
  const os = useOs();
  const win = useWindow();
  const [tasks] = useState(() => makeRound(level.id, defaultRng));
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [picked, setPicked] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>('none');
  const [results, setResults] = useState<('ok' | 'miss')[]>([]);
  const resultsRef = useRef<('ok' | 'miss')[]>([]);
  const [help, setHelp] = useState(level.visual === 'objects');
  const later = useTimeouts();
  const task = tasks[index];
  const autoSpeak = os.group !== 'gross';

  useEffect(() => {
    if (autoSpeak) speak(taskSpeech(task));
  }, [task, autoSpeak]);

  const record = (r: 'ok' | 'miss') => {
    resultsRef.current = [...resultsRef.current, r];
    setResults(resultsRef.current);
  };

  const next = useCallback(() => {
    if (resultsRef.current.length >= tasks.length) {
      onFinish(resultsRef.current.filter((r) => r === 'ok').length, tasks.length);
      return;
    }
    setIndex((i) => i + 1);
    setInput('');
    setPicked(null);
    setAttempt(0);
    setFeedback('none');
    setHelp(level.visual === 'objects');
  }, [tasks.length, onFinish, level.visual]);

  const submit = (value: number) => {
    if (feedback !== 'none') return;
    setPicked(value);
    if (value === task.answer) {
      sfx.correct();
      setFeedback('ok');
      record(attempt === 0 ? 'ok' : 'miss');
      later(next, 850);
    } else if (attempt === 0) {
      sfx.wrong();
      setFeedback('wrong');
      setAttempt(1);
      speak('Fast! Versuch es noch einmal.');
      if (level.visual !== 'none') setHelp(true);
      later(() => {
        setFeedback('none');
        setInput('');
        setPicked(null);
      }, 1000);
    } else {
      sfx.wrong();
      setFeedback('reveal');
      setInput(String(task.answer));
      setPicked(task.answer);
      record('miss');
      speak(`Das Ergebnis ist ${task.answer}.`);
      if (level.visual !== 'none') setHelp(true);
      later(next, 2400);
    }
  };

  // Echte Tastatur: Ziffern, Löschen und Enter – aber nur, wenn dieses Fenster vorne ist.
  const latest = useLatest({ submit, input, feedback });
  useEffect(() => {
    if (!win.focused) return;
    const onKey = (e: KeyboardEvent) => {
      const { submit: send, input: value, feedback: fb } = latest.current;
      if (fb !== 'none' || e.ctrlKey || e.altKey || e.metaKey) return;
      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        const d = Number(e.key);
        if (level.input === 'choice') {
          const choice = d === 0 ? 10 : d;
          if (task.choices?.includes(choice)) send(choice);
        } else if (value.length < 3) {
          sfx.click();
          setInput(value + e.key);
        }
      } else if (e.key === 'Backspace' && level.input === 'pad') {
        e.preventDefault();
        setInput(value.slice(0, -1));
      } else if (e.key === 'Enter' && level.input === 'pad' && value) {
        e.preventDefault();
        send(Number(value));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [win.focused, level.input, task, latest]);

  const states = tasks.map((_, i) => (i < results.length ? results[i] : i === index ? 'now' : 'todo'));
  const showVisual = level.visual !== 'none' && (help || task.op === 'count');

  return (
    <div className="level-play">
      <LevelTop level={level} speakText={taskSpeech(task)} onBack={onBack}>
        <ProgressDots states={states} />
      </LevelTop>
      <div className={level.input === 'pad' ? 'math-play is-pad' : 'math-play'}>
        <div className={`math-card is-${feedback}`}>
          {showVisual && (
            <div className="math-visual" key={task.key}>
              <MathVisual task={task} kind={level.visual} />
            </div>
          )}
          {task.op === 'count' ? (
            <p className="math-question">Wie viele {task.item.plural}?</p>
          ) : (
            <div className="math-eq" aria-live="polite">
              <span>{task.a}</span>
              <span className="math-op">{task.op}</span>
              <span>{task.b}</span>
              <span className="math-op">=</span>
              <span className={`math-answer is-${feedback}`}>{input || '?'}</span>
            </div>
          )}
          {level.visual !== 'none' && level.visual !== 'objects' && (
            <button type="button" className="btn btn-ghost btn-small math-help" onClick={() => setHelp((h) => !h)}>
              {help ? 'Hilfe ausblenden' : 'Hilfe zeigen'}
            </button>
          )}
        </div>

        {level.input === 'choice' ? (
          <div className="math-choices">
            {task.choices?.map((c) => (
              <button
                key={c}
                type="button"
                className={[
                  'math-choice',
                  picked === c && feedback === 'ok' ? 'is-ok' : '',
                  picked === c && feedback === 'wrong' ? 'is-wrong' : '',
                  feedback === 'reveal' && c === task.answer ? 'is-reveal' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => submit(c)}
                disabled={feedback !== 'none'}
              >
                {c}
              </button>
            ))}
          </div>
        ) : (
          <NumberPad
            onDigit={(d) => {
              if (input.length < 3) {
                sfx.click();
                setInput(input + String(d));
              }
            }}
            onDelete={() => setInput(input.slice(0, -1))}
            onOk={() => submit(Number(input))}
            disabled={feedback !== 'none'}
            canOk={input.length > 0}
          />
        )}
      </div>
    </div>
  );
}
