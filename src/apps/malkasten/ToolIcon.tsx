import type { ToolId } from './tools';

const LINE = '#23263b';

/** Kleine Bilder für die Werkzeuge. `color` ist die gerade gewählte Farbe – der Pinsel trägt sie. */
export function ToolIcon({ tool, color, size = 40 }: { tool: Exclude<ToolId, 'stempel'>; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" strokeLinejoin="round" strokeLinecap="round">
      {tool === 'pinsel' && (
        <>
          <path d="M28.5 8.5 39.5 19.5 27 32 16 21z" fill="#d79a5a" stroke={LINE} strokeWidth="2.4" />
          <path d="M16 21 27 32 23.5 35.5 12.5 24.5z" fill="#c4c9da" stroke={LINE} strokeWidth="2.4" />
          <path d="M12.5 24.5 23.5 35.5c-2.6 5.2-9.4 7.4-15.4 6-1.4-6 .8-12.8 4.4-17z" fill={color} stroke={LINE} strokeWidth="2.4" />
        </>
      )}
      {tool === 'radierer' && (
        <>
          <path d="M8 30 26 12l14 14-18 18H14z" fill="#ff9fbe" stroke={LINE} strokeWidth="2.4" />
          <path d="M8 30 17 21l14 14-9 9H14z" fill="#8fd3ff" stroke={LINE} strokeWidth="2.4" />
          <path d="M24 44h16" stroke={LINE} strokeWidth="2.4" />
        </>
      )}
      {tool === 'eimer' && (
        <>
          <path d="M12 19c0-9 18-9 18 0" fill="none" stroke={LINE} strokeWidth="2.4" />
          <path d="M9 19h24l-3.2 21.5c-.2 1.4-1.4 2.5-2.8 2.5H15c-1.4 0-2.6-1.1-2.8-2.5z" fill="#c4c9da" stroke={LINE} strokeWidth="2.4" />
          <path d="M30 20c6 1.5 9.5 7 8.2 14.5-.5 3-3.7 3.3-4.6.4-1.1-3.6-2.1-8.5-3.6-14.9z" fill={color} stroke={LINE} strokeWidth="2.4" />
          <path d="M9 19h24" stroke={LINE} strokeWidth="2.4" />
        </>
      )}
      {tool === 'linie' && <path d="M10 38 38 10" stroke={color} strokeWidth="5.5" />}
      {tool === 'rechteck' && <rect x="8.5" y="12.5" width="31" height="23" rx="2.5" fill="none" stroke={color} strokeWidth="5" />}
      {tool === 'kreis' && <circle cx="24" cy="24" r="14.5" fill="none" stroke={color} strokeWidth="5" />}
      {tool === 'pipette' && (
        <>
          <path d="M29 9.5c3.5-3.5 9-.6 9.6 3.2.4 2.6-.8 4.4-2.6 6.2l-3.2 3.2-9-9z" fill="#5b6077" stroke={LINE} strokeWidth="2.4" />
          <path d="M26 15l7 7-15.5 15.5-6 2.2 2.2-6z" fill="#ffffff" stroke={LINE} strokeWidth="2.4" />
          <path d="M11.7 33.7 14.3 36.3 12 40.8 7.2 38.5z" fill={color} stroke={LINE} strokeWidth="2" />
        </>
      )}
    </svg>
  );
}
