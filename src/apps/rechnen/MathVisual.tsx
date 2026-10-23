import type { CSSProperties } from 'react';
import { Emoji } from '../../os/Emoji';
import type { CountItem, MathTask, RechnenLevel } from './tasks';

/** Bilder zur Aufgabe: Dinge zum Zählen, das Zwanzigerfeld oder ein Punktefeld. */
export function MathVisual({ task, kind }: { task: MathTask; kind: RechnenLevel['visual'] }) {
  if (task.op === 'count') return <ObjectGroup n={task.a} item={task.item} big />;
  if (kind === 'objects' && task.op === '+') {
    return (
      <div className="vis-row">
        <ObjectGroup n={task.a} item={task.item} />
        <span className="vis-op">+</span>
        <ObjectGroup n={task.b} item={task.item} />
      </div>
    );
  }
  if (kind === 'objects' && task.op === '−') return <ObjectGroup n={task.a} item={task.item} crossed={task.b} />;
  if (kind === 'tenframe') return <TenFrame task={task} />;
  if (kind === 'array') return <DotArray rows={task.a} cols={task.b} />;
  return null;
}

/** Dinge in Fünferreihen – die „Kraft der Fünf" aus der Grundschule hilft beim Erfassen. */
function ObjectGroup({ n, item, crossed = 0, big }: { n: number; item: CountItem; crossed?: number; big?: boolean }) {
  const size = big ? 64 : n > 5 ? 44 : 52;
  return (
    <div className={big ? 'vis-objects is-big' : 'vis-objects'} style={{ '--cols': Math.min(5, Math.max(n, 1)) } as CSSProperties}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={i >= n - crossed ? 'vis-obj is-crossed' : 'vis-obj'} style={{ rotate: `${((i * 37) % 21) - 10}deg` }}>
          <Emoji name={item.emoji} size={size} />
        </span>
      ))}
    </div>
  );
}

/** Zwanzigerfeld: zwei Reihen mit je zweimal fünf Feldern. */
function TenFrame({ task }: { task: MathTask }) {
  const cells = Array.from({ length: 20 }, (_, i) => {
    if (task.op === '+') {
      if (i < task.a) return 'a';
      if (i < task.a + task.b) return 'b';
      return 'empty';
    }
    if (i < task.a - task.b) return 'a';
    if (i < task.a) return 'gone';
    return 'empty';
  });
  return (
    <div className="tenframe" aria-hidden="true">
      {[0, 1].map((row) => (
        <div key={row} className="tenframe-row">
          {[0, 1].map((half) => (
            <div key={half} className="tenframe-five">
              {cells.slice(row * 10 + half * 5, row * 10 + half * 5 + 5).map((c, i) => (
                <span key={i} className={`tf-cell tf-${c}`} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Punktefeld fürs Einmaleins: a Reihen mit je b Punkten. */
function DotArray({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="dot-array" style={{ '--cols': cols } as CSSProperties} aria-hidden="true">
      {Array.from({ length: rows * cols }, (_, i) => (
        <span key={i} className={Math.floor(i / cols) % 2 === 0 ? 'dot-a' : 'dot-b'} />
      ))}
    </div>
  );
}
