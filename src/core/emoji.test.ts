import { describe, expect, it } from 'vitest';
import { EMOJI } from './emoji';

describe('Bilder', () => {
  // Vite listet die Dateien beim Bauen des Tests auf – ohne Dateisystem-Zugriff zur Laufzeit.
  const files = Object.keys(import.meta.glob('../../public/emoji/*.svg')).map((path) =>
    path.slice(path.lastIndexOf('/') + 1, -'.svg'.length),
  );

  it('hat zu jedem Namen eine Datei', () => {
    expect(files.length).toBeGreaterThan(100);
    expect(EMOJI.filter((name) => !files.includes(name))).toEqual([]);
  });

  it('listet jede Datei auch als Namen', () => {
    expect(files.filter((f) => !(EMOJI as readonly string[]).includes(f))).toEqual([]);
  });
});
