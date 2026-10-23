import { useEffect, useState, type ComponentType } from 'react';
import type { Stars } from '../../core/profile';
import { sfx } from '../../core/sound';
import { stopSpeaking } from '../../core/speech';
import { useOs, type CompleteResult } from '../../os/osContext';
import type { LevelProps, Tier } from '../shared/levelTypes';
import { LevelIntro, LevelMap, LevelTop, ResultScreen } from '../shared/LevelUi';
import { Huepfhase } from './Huepfhase';
import { KeyCaps } from './Keyboard';
import { detectLayout } from './layout';
import { TASTATUR_LEVELS, type TastaturLevel, type TastaturLevelId } from './levels';
import { Pfeilweg } from './Pfeilweg';
import { Sternenregen } from './Sternenregen';
import { Tastenzoo } from './Tastenzoo';
import { Tippprofi } from './Tippprofi';
import { Woerter } from './Woerter';
import { Zehnfinger } from './Zehnfinger';

const GAMES: Record<TastaturLevelId, ComponentType<LevelProps>> = {
  tastenzoo: Tastenzoo,
  huepfhase: Huepfhase,
  pfeilweg: Pfeilweg,
  sternenregen: Sternenregen,
  woerter: Woerter,
  zehnfinger: Zehnfinger,
  tippprofi: Tippprofi,
};

type View =
  | { name: 'map' }
  | { name: 'intro'; level: TastaturLevel; tier: Tier }
  | { name: 'play'; level: TastaturLevel; tier: Tier; run: number }
  | { name: 'result'; level: TastaturLevel; tier: Tier; result: CompleteResult; score?: number };

export default function TastaturApp() {
  const os = useOs();
  const progress = os.profile.progress.tastatur ?? {};
  const [view, setView] = useState<View>({ name: 'map' });
  const [layout, setLayout] = useState<'de' | 'other' | 'unknown'>('unknown');

  useEffect(() => {
    let alive = true;
    void detectLayout().then((l) => {
      if (alive) setLayout(l);
    });
    return () => {
      alive = false;
    };
  }, []);

  const starsOf = (id: string) => progress[id]?.stars ?? 0;
  const isUnlocked = (i: number) => os.allOpen || os.group === 'gross' || i === 0 || starsOf(TASTATUR_LEVELS[i - 1].id) > 0;
  const maxTier = (level: TastaturLevel): Tier => Math.min(3, starsOf(level.id) + 1) as Tier;
  const openTiers = (level: TastaturLevel): Tier => (os.allOpen ? 3 : maxTier(level));

  const openIntro = (level: TastaturLevel) => {
    sfx.tap();
    setView({ name: 'intro', level, tier: maxTier(level) });
  };

  const toMap = () => {
    stopSpeaking();
    setView({ name: 'map' });
  };

  if (view.name === 'map') {
    const best = progress.tippprofi?.best;
    return (
      <div className="app-scroll">
        <LevelMap
          title="Tastatur"
          intro="Sieben Übungen – vom ersten Buchstaben bis zum Zehn-Finger-Schreiben. Jedes Level hat drei Stufen und drei Sterne."
          levels={TASTATUR_LEVELS}
          progress={progress}
          isUnlocked={isUnlocked}
          onPick={(l) => openIntro(l as TastaturLevel)}
          badge={(l) => (l.id === 'tippprofi' && best ? `Rekord: ${best} pro Minute` : undefined)}
        />
        {layout === 'other' && (
          <p className="kb-layout-note">
            Hinweis für Erwachsene: Die Tastatur ist nicht auf Deutsch eingestellt. Dann sind zum Beispiel Z und Y vertauscht, und
            Ä, Ö, Ü fehlen. Am besten in den Einstellungen des Computers „Deutsch“ als Tastatur wählen.
          </p>
        )}
      </div>
    );
  }

  if (view.name === 'intro') {
    const { level, tier } = view;
    return (
      <LevelIntro
        level={level}
        text={level.intro}
        illustration={<KeyCaps codes={level.keys} />}
        tiers={{ hints: level.tiers, maxTier: openTiers(level), stars: starsOf(level.id) }}
        tier={tier}
        onTier={(t) => setView({ name: 'intro', level, tier: t })}
        onStart={() => {
          stopSpeaking();
          setView({ name: 'play', level, tier, run: Date.now() });
        }}
        onBack={toMap}
      />
    );
  }

  if (view.name === 'play') {
    const { level, tier, run } = view;
    const Game = GAMES[level.id];
    return (
      <div className="level-play">
        <LevelTop level={level} tier={tier} speakText={`${level.intro} Stufe ${tier}: ${level.tiers[tier - 1]}`} onBack={toMap} />
        <div className="level-stage">
          <Game
            key={run}
            tier={tier}
            onDone={(score) => {
              const result = os.completeLevel('tastatur', level.id, tier as Stars, undefined, score);
              sfx.success();
              setView({ name: 'result', level, tier, result, score });
            }}
          />
        </div>
      </div>
    );
  }

  const { level, tier, result, score } = view;
  const index = TASTATUR_LEVELS.findIndex((l) => l.id === level.id);
  const nextLevel = TASTATUR_LEVELS[index + 1];
  const next =
    tier < 3
      ? { label: `Stufe ${tier + 1}`, onClick: () => setView({ name: 'play', level, tier: (tier + 1) as Tier, run: Date.now() }) }
      : nextLevel
        ? { label: nextLevel.title, onClick: () => openIntro(nextLevel) }
        : undefined;

  return (
    <div className="app-scroll">
      <ResultScreen
        level={level}
        result={result}
        detail={score ? `${score} Anschläge pro Minute!` : `Stufe ${tier} geschafft!`}
        next={next}
        onReplay={() => setView({ name: 'play', level, tier, run: Date.now() })}
        onMap={toMap}
      />
    </div>
  );
}
