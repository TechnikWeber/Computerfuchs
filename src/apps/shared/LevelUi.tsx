import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { formatBytes } from '../../core/bytes';
import type { LevelRecord } from '../../core/profile';
import { speak } from '../../core/speech';
import { Emoji } from '../../os/Emoji';
import { FEATURE_INFO } from '../../os/features';
import { Fox } from '../../os/Fox';
import { FoxSays } from '../../os/FoxSays';
import { ByteIcon, Icon, Stars } from '../../os/Icon';
import { MouseHint, type MouseAction } from '../../os/MouseHint';
import type { CompleteResult } from '../../os/osContext';
import type { MapLevel, Tier } from './levelTypes';

// ---------------------------------------------------------------------------
// Level-Karte
// ---------------------------------------------------------------------------

interface MapProps {
  title: string;
  intro: string;
  levels: MapLevel[];
  progress: Record<string, LevelRecord>;
  isUnlocked: (index: number) => boolean;
  onPick: (level: MapLevel) => void;
  /** Zusatz unter dem Titel, z. B. „ab 6" */
  badge?: (level: MapLevel) => string | undefined;
}

export function LevelMap({ title, intro, levels, progress, isUnlocked, onPick, badge }: MapProps) {
  const nextIndex = levels.findIndex((l, i) => isUnlocked(i) && (progress[l.id]?.stars ?? 0) === 0);
  return (
    <div className="level-map">
      <div className="level-map-head">
        <Fox size={84} />
        <div>
          <h2>{title}</h2>
          <p>{intro}</p>
        </div>
      </div>
      <ol className="level-grid">
        {levels.map((level, i) => {
          const unlocked = isUnlocked(i);
          const stars = progress[level.id]?.stars ?? 0;
          const extra = badge?.(level);
          return (
            <li key={level.id}>
              <button
                type="button"
                className={['level-card', unlocked ? '' : 'is-locked', i === nextIndex ? 'is-next' : ''].filter(Boolean).join(' ')}
                style={{ '--lvl': level.color } as CSSProperties}
                onClick={() => unlocked && onPick(level)}
                aria-disabled={!unlocked}
                aria-label={unlocked ? `${level.title}: ${level.skill}` : `${level.title} – noch gesperrt`}
              >
                <span className="level-num">{i + 1}</span>
                <span className="level-icon">
                  <Emoji name={level.icon} size={64} />
                  {!unlocked && (
                    <span className="level-lock">
                      <Icon name="lock" size={26} stroke={3} />
                    </span>
                  )}
                </span>
                <span className="level-title">{level.title}</span>
                <span className="level-skill">{level.skill}</span>
                {extra && <span className="level-badge">{extra}</span>}
                <Stars count={stars} size={24} />
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Einleitung eines Levels
// ---------------------------------------------------------------------------

interface IntroProps {
  level: MapLevel;
  text: string;
  mouse?: MouseAction;
  /** Stufen-Auswahl: höchste freie Stufe und Hinweise je Stufe */
  tiers?: { hints: [string, string, string]; maxTier: Tier; stars: number };
  tier?: Tier;
  onTier?: (t: Tier) => void;
  onStart: () => void;
  onBack: () => void;
}

export function LevelIntro({ level, text, mouse, tiers, tier = 1, onTier, onStart, onBack }: IntroProps) {
  const hint = tiers ? tiers.hints[tier - 1] : undefined;
  return (
    <div className="level-intro" style={{ '--lvl': level.color } as CSSProperties}>
      <button type="button" className="btn btn-ghost btn-small level-back" onClick={onBack}>
        <Icon name="back" size={20} /> Karte
      </button>
      <div className="level-intro-main">
        <FoxSays title={level.title} text={hint ? `${text} ${tiers && tiers.maxTier > 1 ? `Stufe ${tier}: ${hint}` : ''}` : text} foxSize={120}>
          <button type="button" className="btn btn-leaf btn-big" onClick={onStart} autoFocus>
            <Icon name="play" size={26} /> Los geht's!
          </button>
        </FoxSays>
        {mouse && (
          <div className="level-intro-mouse">
            <MouseHint action={mouse} size={104} />
          </div>
        )}
      </div>
      {tiers && (
        <div className="tier-pick" role="group" aria-label="Stufe wählen">
          {([1, 2, 3] as Tier[]).map((t) => {
            const open = t <= tiers.maxTier;
            return (
              <button
                key={t}
                type="button"
                className={['tier-chip', t === tier ? 'is-current' : '', open ? '' : 'is-locked'].filter(Boolean).join(' ')}
                onClick={() => open && onTier?.(t)}
                aria-disabled={!open}
                aria-pressed={t === tier}
              >
                <span>Stufe {t}</span>
                {open ? <Stars count={tiers.stars >= t ? t : 0} max={t} size={18} /> : <Icon name="lock" size={18} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Leiste über dem laufenden Level
// ---------------------------------------------------------------------------

interface TopProps {
  level: MapLevel;
  tier?: Tier;
  speakText: string;
  onBack: () => void;
  children?: ReactNode;
}

export function LevelTop({ level, tier, speakText, onBack, children }: TopProps) {
  return (
    <div className="level-top" style={{ '--lvl': level.color } as CSSProperties}>
      <button type="button" className="btn btn-ghost btn-small" onClick={onBack} aria-label="Zurück zur Karte">
        <Icon name="back" size={20} /> Karte
      </button>
      <span className="level-top-title">
        <Emoji name={level.icon} size={32} />
        {level.title}
        {tier && <span className="chip">Stufe {tier}</span>}
      </span>
      <div className="level-top-extra">{children}</div>
      <button
        type="button"
        className="icon-btn speak-btn"
        onClick={() => speak(speakText, { force: true })}
        aria-label="Anleitung vorlesen"
        title="Anleitung vorlesen"
      >
        <Icon name="speaker" size={26} />
      </button>
    </div>
  );
}

/** Fortschritt als Reihe von Punkten. */
export function ProgressDots({ states }: { states: ('todo' | 'ok' | 'miss' | 'now')[] }) {
  return (
    <span className="progress-dots" aria-label={`${states.filter((s) => s === 'ok' || s === 'miss').length} von ${states.length}`}>
      {states.map((s, i) => (
        <span key={i} className={`dot dot-${s}`} />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Ergebnis
// ---------------------------------------------------------------------------

interface ResultProps {
  level: MapLevel;
  result: CompleteResult;
  /** z. B. „8 von 10 richtig" */
  detail?: string;
  next?: { label: string; onClick: () => void };
  onReplay: () => void;
  onMap: () => void;
}

const PRAISE = ['Super!', 'Klasse!', 'Toll gemacht!', 'Spitze!', 'Wow!', 'Prima!'];

export function ResultScreen({ level, result, detail, next, onReplay, onMap }: ResultProps) {
  const praise = PRAISE[(level.title.length + result.best) % PRAISE.length];
  useEffect(() => {
    speak(`${praise} ${detail ?? ''} Du bekommst ${formatBytes(result.bytes)}.`);
  }, [praise, detail, result.bytes]);

  return (
    <div className="result" style={{ '--lvl': level.color } as CSSProperties}>
      <Fox size={130} mood="cheer" className="result-fox" />
      <h2>{praise}</h2>
      {detail && <p className="result-detail">{detail}</p>}
      <div className="result-stars">
        <Stars count={result.best} size={64} />
      </div>
      <div className="result-bytes">
        <ByteIcon size={46} />
        <span>+{formatBytes(result.bytes)}</span>
      </div>
      {result.unlocked && (
        <p className="result-unlock">
          <Emoji name={FEATURE_INFO[result.unlocked].icon} size={36} />
          {FEATURE_INFO[result.unlocked].title}
        </p>
      )}
      <div className="result-actions">
        {next && (
          <button type="button" className="btn btn-leaf btn-big" onClick={next.onClick} autoFocus>
            {next.label} <Icon name="next" size={26} />
          </button>
        )}
        <button type="button" className="btn btn-sky" onClick={onReplay}>
          <Icon name="replay" size={22} /> Nochmal
        </button>
        <button type="button" className="btn btn-ghost" onClick={onMap}>
          <Icon name="grid" size={22} /> Karte
        </button>
      </div>
    </div>
  );
}

/** Kurzer Hinweis oben im Level, z. B. „Nimm die linke Maustaste!" */
export function LevelHint({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="level-hint" role="status" key={text}>
      {text}
    </div>
  );
}
