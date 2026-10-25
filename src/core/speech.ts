/*
 * Vorlesen über die Sprachausgabe des Browsers. Kinder, die noch nicht lesen,
 * hören so jede Anleitung. Die Qualität hängt vom Gerät ab: Edge bringt sehr
 * natürliche Stimmen mit, Chrome eine Google-Stimme, Linux oft nur eine einfache.
 */

let enabled = true;
let voice: SpeechSynthesisVoice | null = null;
let listening = false;
/*
 * Die laufenden Sätze. Chrome räumt Sprach-Objekte sonst manchmal zu früh weg –
 * dann bricht die Ansage mitten im Satz ab.
 */
let queue: SpeechSynthesisUtterance[] = [];
/** Wann zuletzt etwas gesagt werden sollte – und ob die Stimme wirklich angefangen hat. */
let askedAt = 0;
let started = false;
/** So lange darf eine Ansage brauchen, bis sie hörbar anfängt. Sonst ist die Sprachausgabe stumm. */
const START_GRACE_MS = 2000;

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
}

function score(v: SpeechSynthesisVoice): number {
  let s = 0;
  if (/natural|online|neural/i.test(v.name)) s += 4;
  if (/google/i.test(v.name)) s += 2;
  if (v.lang.toLowerCase().replace('_', '-') === 'de-de') s += 1;
  return s;
}

function chooseVoice(): SpeechSynthesisVoice | null {
  const s = synth();
  if (!s) return null;
  const german = s.getVoices().filter((v) => v.lang.toLowerCase().startsWith('de'));
  if (german.length === 0) return null;
  return [...german].sort((a, b) => score(b) - score(a))[0];
}

export function initSpeech(): void {
  const s = synth();
  if (!s) return;
  voice = chooseVoice();
  if (!listening) {
    listening = true;
    s.addEventListener('voiceschanged', () => {
      voice = chooseVoice();
    });
  }
}

export function speechAvailable(): boolean {
  return synth() !== null;
}

export function setVoiceEnabled(on: boolean): void {
  enabled = on;
  if (!on) stopSpeaking();
}

const TLD = '(?:de|org|net|com|info|xyz|eu|at|ch)';
const IP = /\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/g;
const HOST = new RegExp(`\\b[a-zäöüß0-9-]+(?:\\.[a-zäöüß0-9-]+)*\\.${TLD}\\b`, 'gi');

/**
 * Was gelesen gut aussieht, klingt vorgelesen oft falsch: „203.0.113.42" wird
 * zu einer Zahl oder einem Datum. So spricht Flinn es wie ein Mensch.
 */
export function spokenText(text: string): string {
  return text
    .replace(IP, (_, a: string, b: string, c: string, d: string) => `${a} Punkt ${b} Punkt ${c} Punkt ${d}`)
    .replace(HOST, (host) => host.split('.').join(' Punkt '));
}

/**
 * Teilt langen Text in Sätze. Chrome bricht eine einzelne Ansage nach etwa
 * 15 Sekunden einfach ab – kurze Stücke nacheinander laufen bis zum Ende.
 */
export function speechChunks(text: string, max = 160): string[] {
  const sentences = text.split(/(?<=[.!?…:])\s+/).filter((s) => s.trim());
  const chunks: string[] = [];
  for (const s of sentences) {
    const last = chunks.length - 1;
    if (last >= 0 && chunks[last].length + s.length + 1 <= max) chunks[last] = `${chunks[last]} ${s}`;
    else chunks.push(s);
  }
  return chunks;
}

/** force: auch vorlesen, wenn Vorlesen ausgeschaltet ist – für den Lautsprecher-Knopf. */
export function speak(text: string, opts: { force?: boolean; rate?: number } = {}): void {
  const s = synth();
  if (!s || (!enabled && !opts.force) || !text.trim()) return;
  if (!voice) voice = chooseVoice();
  s.cancel();
  const parts = speechChunks(spokenText(text)).map((part) => {
    const u = new SpeechSynthesisUtterance(part);
    u.lang = voice?.lang ?? 'de-DE';
    if (voice) u.voice = voice;
    u.rate = opts.rate ?? 0.95;
    u.pitch = 1.1;
    const done = () => {
      queue = queue.filter((x) => x !== u);
    };
    u.onstart = () => {
      started = true;
    };
    u.onend = done;
    u.onerror = done;
    return u;
  });
  queue = parts;
  askedAt = Date.now();
  started = false;
  for (const u of parts) s.speak(u);
}

export function stopSpeaking(): void {
  queue = [];
  askedAt = 0;
  synth()?.cancel();
}

/** Spricht Flinn gerade (oder wartet ein Satz noch)? */
export function isSpeaking(): boolean {
  const s = synth();
  if (!s) return false;
  // Manche Geräte haben keine Stimme oder keinen Ton: Dann fängt nie etwas an.
  if (!started && Date.now() - askedAt > START_GRACE_MS) return false;
  return s.speaking || s.pending;
}

/**
 * Ruft `fn` auf, sobald Flinn ausgeredet hat – plus eine kleine Atempause.
 * Hängt die Sprachausgabe, geht es nach `maxMs` trotzdem weiter.
 * Gibt eine Funktion zum Abbrechen zurück.
 */
export function afterSpeech(fn: () => void, opts: { pauseMs?: number; maxMs?: number } = {}): () => void {
  const pauseMs = opts.pauseMs ?? 450;
  const deadline = Date.now() + (opts.maxMs ?? 20_000);
  let id = 0;
  let quietSince: number | null = null;
  const check = () => {
    const now = Date.now();
    if (isSpeaking() && now < deadline) quietSince = null;
    else quietSince ??= now;
    if (quietSince !== null && (now - quietSince >= pauseMs || now >= deadline)) {
      fn();
      return;
    }
    id = window.setTimeout(check, 100);
  };
  // Erst kurz warten: Eine eben gesetzte Ansage startet oft einen Moment später.
  id = window.setTimeout(check, 100);
  return () => window.clearTimeout(id);
}
