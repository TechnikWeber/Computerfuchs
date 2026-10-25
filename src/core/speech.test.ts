import { describe, expect, it } from 'vitest';
import { speechChunks, spokenText } from './speech';

describe('spokenText', () => {
  it('liest IP-Nummern Stück für Stück', () => {
    expect(spokenText('schule.de hat die Nummer 203.0.113.42.')).toBe(
      'schule Punkt de hat die Nummer 203 Punkt 0 Punkt 113 Punkt 42.',
    );
  });

  it('liest Adressen mit Punkt, auch mit Umlauten', () => {
    expect(spokenText('Such buecherei.de und bücherei.de')).toBe('Such buecherei Punkt de und bücherei Punkt de');
    expect(spokenText('www.kika.de.gewinnspiel-sofort.net')).toBe('www Punkt kika Punkt de Punkt gewinnspiel-sofort Punkt net');
  });

  it('lässt normale Zahlen und Sätze in Ruhe', () => {
    expect(spokenText('Du bekommst 1.024 Bytes. Am 25.10.2026 geht es los.')).toBe('Du bekommst 1.024 Bytes. Am 25.10.2026 geht es los.');
  });
});

describe('speechChunks', () => {
  it('lässt kurze Texte ganz', () => {
    expect(speechChunks('Hallo! Wie geht es dir?')).toEqual(['Hallo! Wie geht es dir?']);
  });

  it('teilt lange Texte an Satzenden', () => {
    const long = 'Erster Satz ist da. '.repeat(12).trim();
    const chunks = speechChunks(long, 60);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.length <= 60)).toBe(true);
    expect(chunks.join(' ')).toBe(long);
  });
});
