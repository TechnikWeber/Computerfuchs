import { useState, type ComponentType } from 'react';
import type { Stars } from '../../core/profile';
import { sfx } from '../../core/sound';
import { stopSpeaking } from '../../core/speech';
import { useOs, type CompleteResult } from '../../os/osContext';
import type { LevelProps, Tier } from '../shared/levelTypes';
import { LevelIntro, LevelMap, LevelTop, ResultScreen } from '../shared/LevelUi';
import { Ballons } from './Ballons';
import { Bienenweg } from './Bienenweg';
import { FensterProfi } from './FensterProfi';
import { Farbenzauber } from './Farbenzauber';
import { Fuettern } from './Fuettern';
import { Geschenke } from './Geschenke';
import { MAUS_LEVELS, type MausLevel, type MausLevelId } from './levels';
import { Taschenlampe } from './Taschenlampe';
import { Tauchgang } from './Tauchgang';

const GAMES: Record<MausLevelId, ComponentType<LevelProps>> = {
  taschenlampe: Taschenlampe,
  ballons: Ballons,
  geschenke: Geschenke,
  fuettern: Fuettern,
  weg: Bienenweg,
  farben: Farbenzauber,
  tauchgang: Tauchgang,
  fenster: FensterProfi,
};

type View =
  | { name: 'map' }
  | { name: 'intro'; level: MausLevel; tier: Tier }
  | { name: 'play'; level: MausLevel; tier: Tier; run: number }
  | { name: 'result'; level: MausLevel; tier: Tier; result: CompleteResult };

export default function MausApp() {
  const os = useOs();
  const progress = os.profile.progress.maus ?? {};
  const [view, setView] = useState<View>({ name: 'map' });

  const starsOf = (id: string) => progress[id]?.stars ?? 0;
  // Große Kinder dürfen springen; die Kleinen gehen Schritt für Schritt.
  const isUnlocked = (i: number) => os.group === 'gross' || i === 0 || starsOf(MAUS_LEVELS[i - 1].id) > 0;
  const maxTier = (level: MausLevel): Tier => Math.min(3, starsOf(level.id) + 1) as Tier;

  const openIntro = (level: MausLevel) => {
    sfx.tap();
    setView({ name: 'intro', level, tier: maxTier(level) });
  };

  const toMap = () => {
    stopSpeaking();
    setView({ name: 'map' });
  };

  if (view.name === 'map') {
    return (
      <div className="app-scroll">
        <LevelMap
          title="Maustraining"
          intro="Acht Übungen – vom ersten Bewegen bis zum Fenster-Profi. Jedes Level hat drei Stufen und drei Sterne."
          levels={MAUS_LEVELS}
          progress={progress}
          isUnlocked={isUnlocked}
          onPick={(l) => openIntro(l as MausLevel)}
        />
      </div>
    );
  }

  if (view.name === 'intro') {
    const { level, tier } = view;
    return (
      <LevelIntro
        level={level}
        text={level.intro}
        mouse={level.mouse}
        tiers={{ hints: level.tiers, maxTier: maxTier(level), stars: starsOf(level.id) }}
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
            onDone={() => {
              const result = os.completeLevel('maus', level.id, tier as Stars, level.unlocks);
              sfx.success();
              setView({ name: 'result', level, tier, result });
            }}
          />
        </div>
      </div>
    );
  }

  const { level, tier, result } = view;
  const index = MAUS_LEVELS.findIndex((l) => l.id === level.id);
  const nextLevel = MAUS_LEVELS[index + 1];
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
        detail={`Stufe ${tier} geschafft!`}
        next={next}
        onReplay={() => setView({ name: 'play', level, tier, run: Date.now() })}
        onMap={toMap}
      />
    </div>
  );
}
