import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { EmojiName } from '../../core/emoji';
import { useElementSize, useTimeouts } from '../../core/hooks';
import { defaultRng, sample } from '../../core/random';
import { sfx } from '../../core/sound';
import { speak } from '../../core/speech';
import { Emoji } from '../../os/Emoji';
import { MouseHint } from '../../os/MouseHint';
import type { LevelProps } from '../shared/levelTypes';
import { LevelHint } from '../shared/LevelUi';
import { useHint } from '../shared/useHint';

const CREATURES: { emoji: EmojiName; name: string }[] = [
  { emoji: 'tropical-fish', name: 'den Tropenfisch' },
  { emoji: 'octopus', name: 'die Krake' },
  { emoji: 'crab', name: 'die Krabbe' },
  { emoji: 'spouting-whale', name: 'den Wal' },
  { emoji: 'jellyfish', name: 'die Qualle' },
  { emoji: 'blowfish', name: 'den Kugelfisch' },
  { emoji: 'spiral-shell', name: 'die Muschel' },
  { emoji: 'shark', name: 'den Hai' },
  { emoji: 'seal', name: 'die Robbe' },
  { emoji: 'dolphin', name: 'den Delfin' },
  { emoji: 'squid', name: 'den Tintenfisch' },
  { emoji: 'lobster', name: 'den Hummer' },
  { emoji: 'shrimp', name: 'die Garnele' },
  { emoji: 'turtle', name: 'die Schildkröte' },
];

const TIERS = {
  1: { count: 3, screens: 3, size: 112, ordered: false },
  2: { count: 5, screens: 5, size: 90, ordered: true },
  3: { count: 7, screens: 7, size: 70, ordered: true },
} as const;

/** Meter pro Bildschirmhöhe – nur für die Anzeige. */
const METERS_PER_SCREEN = 10;

/** Level 7: Scrollen. Ein tiefes Meer, durch das man mit dem Mausrad taucht. */
export function Tauchgang({ tier, onDone }: LevelProps) {
  const cfg = TIERS[tier];
  const scroller = useRef<HTMLDivElement>(null);
  const { height, width } = useElementSize(scroller);
  const [animals] = useState(() =>
    sample(defaultRng, CREATURES, cfg.count).map((c, i) => ({
      ...c,
      // Gleichmäßig über die Tiefe verteilt, das erste schon unter dem ersten Bildschirm.
      depth: (0.75 + i + defaultRng() * 0.6) / (cfg.count + 0.4),
      x: 0.1 + defaultRng() * 0.62,
      swim: 3 + defaultRng() * 3,
    })),
  );
  // Reihenfolge, in der gesucht wird (ab Stufe 2): kreuz und quer, damit man auch zurückscrollt.
  const [order] = useState(() => sample(defaultRng, animals.map((_, i) => i), animals.length));
  const [found, setFound] = useState<boolean[]>(() => animals.map(() => false));
  const [depth, setDepth] = useState(0);
  const [meters, setMeters] = useState(METERS_PER_SCREEN / 2);
  const [scrolled, setScrolled] = useState(false);
  const finished = useRef(false);
  const later = useTimeouts();
  const [hint, showHint] = useHint(2400);

  const total = Math.max(1, height * cfg.screens);
  const current = cfg.ordered ? order.find((i) => !found[i]) : undefined;

  useEffect(() => {
    if (cfg.ordered && current !== undefined) speak(`Finde ${animals[current].name}!`);
  }, [cfg.ordered, current, animals]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    if (!scrolled && el.scrollTop > 20) setScrolled(true);
    setDepth(el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight));
    // Tiefe in der Mitte des Bildes – passt zu den Meter-Schildern am Rand.
    setMeters(Math.round(((el.scrollTop + el.clientHeight / 2) / Math.max(1, el.clientHeight)) * METERS_PER_SCREEN));
  };

  const tap = (i: number) => {
    if (found[i] || finished.current) return;
    if (cfg.ordered && i !== current) {
      sfx.boing();
      showHint(`Wir suchen gerade ${animals[current ?? i].name}.`);
      return;
    }
    sfx.found();
    const next = found.map((v, j) => v || j === i);
    setFound(next);
    if (next.every(Boolean)) {
      finished.current = true;
      sfx.success();
      later(onDone, 1100);
    }
  };

  return (
    <div className="dive">
      <div ref={scroller} className="dive-scroll" onScroll={onScroll}>
        <div className="dive-sea" style={{ height: total }}>
          {Array.from({ length: cfg.screens }, (_, i) => (
            <span key={i} className="dive-mark" style={{ top: i * height + height * 0.5 }}>
              {(i * METERS_PER_SCREEN + 5).toLocaleString('de-DE')} m
            </span>
          ))}
          {height > 0 &&
            animals.map((a, i) => (
              <button
                key={a.emoji}
                type="button"
                className={found[i] ? 'dive-animal is-found' : 'dive-animal'}
                style={
                  {
                    top: a.depth * (total - cfg.size * 1.4) + cfg.size * 0.2,
                    left: a.x * Math.max(0, width - cfg.size),
                    width: cfg.size,
                    height: cfg.size,
                    '--swim': `${a.swim}s`,
                  } as CSSProperties
                }
                onClick={() => tap(i)}
                aria-label={a.name}
              >
                <Emoji name={a.emoji} size={cfg.size} />
              </button>
            ))}
          <div className="dive-floor">
            <Emoji name="coral" size={90} />
            <Emoji name="spiral-shell" size={44} />
            <Emoji name="gem-stone" size={56} />
            <Emoji name="coral" size={70} />
          </div>
        </div>
      </div>

      <div className="dive-list" aria-label="Diese Tiere suchst du">
        {(cfg.ordered ? order : animals.map((_, i) => i)).map((i) => (
          <span key={i} className={['dive-slot', found[i] ? 'is-found' : '', i === current ? 'is-current' : ''].filter(Boolean).join(' ')}>
            <Emoji name={animals[i].emoji} size={42} />
          </span>
        ))}
      </div>

      <div className="dive-meter" aria-label={`Tiefe ${meters} Meter`}>
        <span className="dive-meter-bar">
          <span className="dive-meter-diver" style={{ top: `${depth * 100}%` }}>
            <Emoji name="tropical-fish" size={30} />
          </span>
        </span>
        <strong>{meters} m</strong>
      </div>

      {!scrolled && (
        <div className="dive-hint">
          <MouseHint action="wheel" size={62} />
          <span>Dreh am Mausrad!</span>
        </div>
      )}
      <LevelHint text={hint} />
    </div>
  );
}
