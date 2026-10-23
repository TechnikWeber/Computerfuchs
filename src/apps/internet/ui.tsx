import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { emojiUrl } from '../../core/emoji';
import { speak } from '../../core/speech';
import { Fox, type FoxMood } from '../../os/Fox';
import { Icon } from '../../os/Icon';
import type { MapEdge, MapNode, MapPacket } from './map';
import { distance, pointAt, type Pt } from './net';

// ---------------------------------------------------------------------------
// Flinn erzählt
// ---------------------------------------------------------------------------

/** Die Erzählzeile über jeder Aufgabe. Neuer Text wird vorgelesen. */
export function Story({ text, mood = 'happy' }: { text: string; mood?: FoxMood }) {
  useEffect(() => {
    speak(text);
  }, [text]);
  return (
    <div className="net-story" role="status">
      <Fox size={52} mood={mood} />
      <p key={text}>{text}</p>
      <button type="button" className="icon-btn" onClick={() => speak(text, { force: true })} aria-label="Vorlesen" title="Vorlesen">
        <Icon name="speaker" size={24} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Netzkarte: Knoten, Kabel, Pakete
// ---------------------------------------------------------------------------

interface NetMapProps {
  width: number;
  height: number;
  nodes: MapNode[];
  edges: MapEdge[];
  packets?: MapPacket[];
  /** Hinter allem, z. B. eine Landkarte */
  background?: ReactNode;
  /** Über allem */
  overlay?: ReactNode;
  /** Von welchen Knoten aus darf man ein Kabel ziehen? */
  connectFrom?: (id: string) => boolean;
  onConnect?: (from: string, to: string) => void;
  onNodeClick?: (id: string) => void;
  onEdgeClick?: (id: string) => void;
  className?: string;
  label: string;
}

function toPath(points: Pt[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('');
}

function RouterGlyph({ size }: { size: number }) {
  return (
    <g transform={`scale(${size / 64}) translate(-32 -30)`} className="glyph-router">
      <path d="M18 26 13 9M46 26l5-17" stroke="#3b4260" strokeWidth="4" strokeLinecap="round" />
      <circle cx="13" cy="8" r="3.6" fill="#3b4260" />
      <circle cx="51" cy="8" r="3.6" fill="#3b4260" />
      <rect x="6" y="25" width="52" height="24" rx="9" fill="url(#nm-router)" stroke="#23263b" strokeWidth="3" />
      <circle className="led" cx="21" cy="37" r="3.6" />
      <circle className="led led-2" cx="32" cy="37" r="3.6" />
      <circle className="led led-3" cx="43" cy="37" r="3.6" />
    </g>
  );
}

function ServerGlyph({ size }: { size: number }) {
  return (
    <g transform={`scale(${size / 64}) translate(-32 -32)`} className="glyph-server">
      <rect x="14" y="4" width="36" height="56" rx="6" fill="url(#nm-server)" stroke="#23263b" strokeWidth="3" />
      {[11, 26, 41].map((y, i) => (
        <g key={y}>
          <rect x="19" y={y} width="26" height="11" rx="3" fill="#2b2f45" />
          <circle className={`led led-${i + 1}`} cx="24.5" cy={y + 5.5} r="2.4" />
          <rect x="30" y={y + 4} width="11" height="3" rx="1.5" fill="#5d6380" />
        </g>
      ))}
    </g>
  );
}

export function NetMap({
  width, height, nodes, edges, packets = [], background, overlay, connectFrom, onConnect, onNodeClick, onEdgeClick, className, label,
}: NetMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draft, setDraft] = useState<{ from: string; to: Pt; moved: boolean } | null>(null);

  const toSvg = (e: PointerEvent): Pt => {
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };
  const nodeAt = (pt: Pt) => nodes.find((n) => distance(n, pt) <= (n.size ?? 84) / 2 + 12);

  const from = draft ? nodes.find((n) => n.id === draft.from) : undefined;
  const target = draft?.moved ? nodeAt(draft.to) : undefined;

  return (
    <svg
      ref={svgRef}
      className={['netmap', draft ? 'is-drawing' : '', className ?? ''].filter(Boolean).join(' ')}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      onPointerMove={(e) => {
        if (draft) setDraft({ ...draft, to: toSvg(e), moved: true });
      }}
      onPointerUp={(e) => {
        if (!draft) return;
        const hit = nodeAt(toSvg(e));
        if (draft.moved && hit && hit.id !== draft.from) onConnect?.(draft.from, hit.id);
        else if (!draft.moved || hit?.id === draft.from) onNodeClick?.(draft.from);
        setDraft(null);
      }}
      onPointerCancel={() => setDraft(null)}
    >
      <defs>
        <linearGradient id="nm-router" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6fb8ff" />
          <stop offset="1" stopColor="#2f7be0" />
        </linearGradient>
        <linearGradient id="nm-server" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9deec" />
          <stop offset="1" stopColor="#9aa3bd" />
        </linearGradient>
      </defs>
      {background}

      {edges.map((e) => {
        const mid = pointAt(e.points, 0.5);
        return (
          <g key={e.id} className={`nm-edge kind-${e.kind ?? 'kabel'} tone-${e.tone ?? 'plain'}`}>
            <path d={toPath(e.points)} className="nm-edge-line" />
            {onEdgeClick && (
              <path
                d={toPath(e.points)}
                className="nm-edge-hit"
                data-edge={e.id}
                onPointerDown={(ev) => ev.stopPropagation()}
                onClick={() => onEdgeClick(e.id)}
              />
            )}
            {e.tone === 'broken' && (
              <g transform={`translate(${mid.x} ${mid.y})`} className="nm-break">
                <circle r="15" />
                <path d="M-6 -6 6 6M6 -6-6 6" />
              </g>
            )}
            {e.label && (
              <text x={mid.x} y={e.labelBelow ? mid.y + 30 : mid.y - 14} className="nm-edge-label">
                {e.label}
              </text>
            )}
          </g>
        );
      })}

      {from && draft && <line className="nm-draft" x1={from.x} y1={from.y} x2={draft.to.x} y2={draft.to.y} />}

      {nodes.map((n) => {
        const size = n.size ?? 84;
        const r = size / 2;
        const draggable = !!connectFrom?.(n.id);
        return (
          <g
            key={n.id}
            className={[
              'nm-node',
              `tone-${n.tone ?? 'plain'}`,
              draggable ? 'is-draggable' : '',
              onNodeClick ? 'is-clickable' : '',
              target?.id === n.id ? 'is-target' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            transform={`translate(${n.x} ${n.y})`}
            data-node={n.id}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.stopPropagation();
              if (draggable) {
                svgRef.current?.setPointerCapture(e.pointerId);
                setDraft({ from: n.id, to: { x: n.x, y: n.y }, moved: false });
              } else {
                onNodeClick?.(n.id);
              }
            }}
          >
            <circle r={r} className="nm-node-bg" />
            {n.icon === 'router' ? (
              <RouterGlyph size={size * 0.8} />
            ) : n.icon === 'server' ? (
              <ServerGlyph size={size * 0.78} />
            ) : (
              <image href={emojiUrl(n.icon)} x={-r * 0.66} y={-r * 0.66} width={r * 1.32} height={r * 1.32} />
            )}
            {n.badge && <image href={emojiUrl(n.badge)} x={r * 0.32} y={-r * 1.08} width={r * 0.82} height={r * 0.82} />}
            {n.label && (
              <text y={n.labelAbove ? -r - 12 : r + 24} className="nm-label">
                {n.label}
              </text>
            )}
          </g>
        );
      })}

      {packets.map((p) => {
        const s = p.size ?? 46;
        return (
          <g key={p.id} className="nm-packet" transform={`translate(${p.at.x} ${p.at.y})`}>
            <image href={emojiUrl(p.icon ?? 'envelope')} x={-s / 2} y={-s / 2} width={s} height={s} />
            {p.label && (
              <g transform={`translate(${s * 0.42} ${-s * 0.4})`} className="nm-packet-tag">
                <circle r="14" />
                <text dy="5.5">{p.label}</text>
              </g>
            )}
          </g>
        );
      })}

      {overlay}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Ein Spiel-Browser
// ---------------------------------------------------------------------------

interface BrowserProps {
  url: string;
  /** Statt der Adresse ein Eingabefeld */
  input?: { value: string; onChange: (v: string) => void; onSubmit: () => void; placeholder?: string };
  /** Diesen Teil der Adresse hervorheben (z. B. wem sie gehört) */
  highlight?: string;
  children?: ReactNode;
  className?: string;
}

export function Browser({ url, input, highlight, children, className }: BrowserProps) {
  const secure = /^https:\/\//i.test(url);
  // Hervorgehoben wird nur im Rechnernamen – dort, wo er aufhört (z. B. „fuchsbank.de“ in „www.fuchsbank.de/login“).
  const hostStart = url.includes('://') ? url.indexOf('://') + 3 : 0;
  const rest = url.slice(hostStart);
  const hostEnd = hostStart + (rest.search(/[/?#]/) < 0 ? rest.length : rest.search(/[/?#]/));
  const host = url.slice(hostStart, hostEnd).toLowerCase();
  const at = highlight && host.endsWith(highlight.toLowerCase()) ? hostEnd - highlight.length : -1;
  return (
    <div className={['mock-browser', className ?? ''].filter(Boolean).join(' ')}>
      <div className="mock-bar">
        <span className="mock-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <div className={secure || input ? 'mock-address' : 'mock-address is-insecure'}>
          {input ? (
            <Icon name="info" size={18} />
          ) : secure ? (
            <span className="mock-lock" title="Verschlüsselte Verbindung">
              <Icon name="lock" size={18} stroke={3} />
            </span>
          ) : (
            <span className="mock-warn">Nicht sicher</span>
          )}
          {input ? (
            <input
              value={input.value}
              placeholder={input.placeholder}
              onChange={(e) => input.onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') input.onSubmit();
              }}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoFocus
              aria-label="Adresse"
            />
          ) : at >= 0 ? (
            <span className="mock-url">
              {url.slice(0, at)}
              <mark>{url.slice(at, at + highlight!.length)}</mark>
              {url.slice(at + highlight!.length)}
            </span>
          ) : (
            <span className="mock-url">{url}</span>
          )}
        </div>
      </div>
      <div className="mock-page">{children}</div>
    </div>
  );
}
