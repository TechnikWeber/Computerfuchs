/*
 * Alle Töne werden mit der Web-Audio-Schnittstelle erzeugt – keine Tondateien,
 * nichts zu laden. Browser erlauben Ton erst nach einer Nutzeraktion; deshalb
 * ruft der Einschaltknopf unlockAudio() auf.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let volume = 0.7;

interface Out {
  ctx: AudioContext;
  out: GainNode;
}

function audio(): Out | null {
  if (!enabled || typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return master ? { ctx, out: master } : null;
  } catch {
    return null;
  }
}

export function unlockAudio(): void {
  audio();
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

export function setSoundVolume(v: number): void {
  volume = Math.min(1, Math.max(0, v));
  if (master) master.gain.value = volume;
}

interface ToneOptions {
  type?: OscillatorType;
  gain?: number;
  slideTo?: number;
}

function tone(freq: number, at: number, dur: number, opts: ToneOptions = {}): void {
  const a = audio();
  if (!a) return;
  const t0 = a.ctx.currentTime + at;
  const osc = a.ctx.createOscillator();
  const g = a.ctx.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);
  const peak = opts.gain ?? 0.2;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(a.out);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(at: number, dur: number, filter = 1800, gain = 0.3, q = 0.8): void {
  const a = audio();
  if (!a) return;
  const len = Math.max(1, Math.floor(a.ctx.sampleRate * dur));
  const buffer = a.ctx.createBuffer(1, len, a.ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.ctx.createBufferSource();
  src.buffer = buffer;
  const f = a.ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = filter;
  f.Q.value = q;
  const g = a.ctx.createGain();
  g.gain.value = gain;
  src.connect(f);
  f.connect(g);
  g.connect(a.out);
  const t0 = a.ctx.currentTime + at;
  src.start(t0);
  src.stop(t0 + dur);
}

const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;

export const sfx = {
  click: () => tone(1250, 0, 0.05, { type: 'triangle', gain: 0.12 }),
  tap: () => tone(720, 0, 0.07, { type: 'sine', gain: 0.16 }),
  pop: () => {
    noise(0, 0.12, 2400, 0.55);
    tone(560, 0, 0.12, { gain: 0.18, slideTo: 140 });
  },
  found: () => {
    tone(988, 0, 0.12, { type: 'triangle', gain: 0.15 });
    tone(1319, 0.08, 0.2, { type: 'triangle', gain: 0.15 });
  },
  coin: () => {
    tone(1568, 0, 0.08, { type: 'square', gain: 0.05 });
    tone(2093, 0.07, 0.24, { type: 'square', gain: 0.05 });
  },
  correct: () => {
    tone(E5, 0, 0.12, { type: 'triangle', gain: 0.16 });
    tone(C6, 0.09, 0.22, { type: 'triangle', gain: 0.16 });
  },
  success: () => [C5, E5, G5, C6].forEach((f, i) => tone(f, i * 0.09, 0.3, { type: 'triangle', gain: 0.15 })),
  fanfare: () => {
    [C5, E5, G5].forEach((f, i) => tone(f, i * 0.1, 0.2, { type: 'triangle', gain: 0.14 }));
    tone(C6, 0.32, 0.5, { type: 'triangle', gain: 0.16 });
    tone(G5, 0.32, 0.5, { type: 'sine', gain: 0.08 });
  },
  boing: () => tone(330, 0, 0.3, { gain: 0.2, slideTo: 150 }),
  wrong: () => {
    tone(310, 0, 0.16, { type: 'triangle', gain: 0.13 });
    tone(245, 0.13, 0.24, { type: 'triangle', gain: 0.13 });
  },
  eat: () => {
    noise(0, 0.07, 900, 0.3);
    noise(0.13, 0.07, 1000, 0.3);
    tone(880, 0.26, 0.16, { type: 'triangle', gain: 0.12, slideTo: 1320 });
  },
  open: () => tone(420, 0, 0.16, { gain: 0.11, slideTo: 860 }),
  close: () => tone(760, 0, 0.14, { gain: 0.09, slideTo: 300 }),
  whoosh: () => noise(0, 0.28, 900, 0.2, 0.5),
  paint: () => noise(0, 0.18, 3200, 0.22, 1.2),
  boot: () => [261.63, 329.63, 392, C5].forEach((f, i) => tone(f, i * 0.13, 1.2, { gain: 0.08 })),
  shutdown: () => [C5, 392, 329.63, 261.63].forEach((f, i) => tone(f, i * 0.13, 0.55, { gain: 0.08 })),
};
