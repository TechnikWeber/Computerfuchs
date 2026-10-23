import { useState, type ComponentType } from 'react';
import type { Stars } from '../../core/profile';
import { sfx } from '../../core/sound';
import { stopSpeaking } from '../../core/speech';
import { Emoji } from '../../os/Emoji';
import { useOs, type CompleteResult } from '../../os/osContext';
import type { LevelProps, Tier } from '../shared/levelTypes';
import { LevelIntro, LevelMap, LevelTop, ResultScreen } from '../shared/LevelUi';
import { BilderPost } from './BilderPost';
import { CHAPTERS, TIER_AGES, tierForAge, type InternetChapter, type InternetChapterId } from './chapters';
import { Meer } from './Meer';
import { Netz } from './Netz';
import { Schloss } from './Schloss';
import { Telefonbuch } from './Telefonbuch';

const GAMES: Record<InternetChapterId, ComponentType<LevelProps>> = {
  netz: Netz,
  post: BilderPost,
  meer: Meer,
  telefonbuch: Telefonbuch,
  schloss: Schloss,
};

type View =
  | { name: 'map' }
  | { name: 'intro'; level: InternetChapter; tier: Tier }
  | { name: 'play'; level: InternetChapter; tier: Tier; run: number }
  | { name: 'result'; level: InternetChapter; tier: Tier; result: CompleteResult };

export default function InternetApp() {
  const os = useOs();
  const progress = os.profile.progress.internet ?? {};
  const [view, setView] = useState<View>({ name: 'map' });
  const ageTier = tierForAge(os.profile.age);

  const starsOf = (id: string) => progress[id]?.stars ?? 0;
  const isUnlocked = (i: number) => os.group === 'gross' || i === 0 || starsOf(CHAPTERS[i - 1].id) > 0;
  // Ältere Kinder fangen gleich auf ihrer Stufe an – niemand muss erst die für Fünfjährige spielen.
  // Geöffnet wird die höchste freie Stufe – das ist zugleich die passende fürs Alter.
  const maxTier = (level: InternetChapter): Tier => Math.min(3, Math.max(starsOf(level.id) + 1, ageTier)) as Tier;

  const openIntro = (level: InternetChapter) => {
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
          title="Was ist das Internet?"
          intro="Eine Reise vom Router bis ans andere Ende der Welt. Jedes Kapitel hat drei Stufen – für 5 bis 7, für 8 bis 10 und ab 11 Jahren."
          levels={CHAPTERS}
          progress={progress}
          isUnlocked={isUnlocked}
          onPick={(l) => openIntro(l as InternetChapter)}
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
        illustration={<Emoji name={level.icon} size={112} />}
        tiers={{ hints: level.tiers, maxTier: maxTier(level), stars: starsOf(level.id), notes: TIER_AGES }}
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
              const result = os.completeLevel('internet', level.id, tier as Stars);
              sfx.success();
              setView({ name: 'result', level, tier, result });
            }}
          />
        </div>
      </div>
    );
  }

  const { level, tier, result } = view;
  const index = CHAPTERS.findIndex((l) => l.id === level.id);
  const nextLevel = CHAPTERS[index + 1];
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
        detail={level.lessons[tier - 1]}
        next={next}
        onReplay={() => setView({ name: 'play', level, tier, run: Date.now() })}
        onMap={toMap}
      />
    </div>
  );
}
