/*
 * Vorlesen über die Sprachausgabe des Browsers. Kinder, die noch nicht lesen,
 * hören so jede Anleitung. Die Qualität hängt vom Gerät ab: Edge bringt sehr
 * natürliche Stimmen mit, Chrome eine Google-Stimme, Linux oft nur eine einfache.
 */

let enabled = true;
let voice: SpeechSynthesisVoice | null = null;
let listening = false;

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
  if (!on) synth()?.cancel();
}

/** force: auch vorlesen, wenn Vorlesen ausgeschaltet ist – für den Lautsprecher-Knopf. */
export function speak(text: string, opts: { force?: boolean; rate?: number } = {}): void {
  const s = synth();
  if (!s || (!enabled && !opts.force) || !text.trim()) return;
  if (!voice) voice = chooseVoice();
  s.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = voice?.lang ?? 'de-DE';
  if (voice) u.voice = voice;
  u.rate = opts.rate ?? 0.95;
  u.pitch = 1.1;
  s.speak(u);
}

export function stopSpeaking(): void {
  synth()?.cancel();
}
