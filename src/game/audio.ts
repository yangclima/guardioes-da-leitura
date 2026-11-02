import type { Theme } from "@/lib/types";

export type Sfx = "jump" | "power" | "empty" | "tink" | "defeat" | "star" | "hurt" | "stomp" | "correct" | "wrong" | "gate" | "win" | "lose";

interface Song {
  tempo: number;
  root: number;
  scale: number[];
  wave: OscillatorType;
  /** Scale degrees, -1 = rest. */
  melody: number[];
  bass: number[];
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const PENTA = [0, 2, 4, 7, 9];

const SONGS: Record<Theme, Song> = {
  floresta: { tempo: 132, root: 60, scale: MAJOR, wave: "square", melody: [0, 2, 4, 2, 5, 4, 2, -1, 4, 5, 7, 5, 4, 2, 0, -1], bass: [0, 0, 3, 3, 4, 4, 0, 0] },
  deserto: { tempo: 150, root: 57, scale: [0, 1, 4, 5, 7, 8, 10], wave: "sawtooth", melody: [0, 1, 2, 1, 0, -1, 4, 3, 2, 1, 2, -1, 0, 4, 2, -1], bass: [0, 0, 0, 0, 3, 3, 4, 4] },
  neve: { tempo: 110, root: 64, scale: PENTA, wave: "triangle", melody: [4, 3, 2, 3, 4, -1, 2, -1, 1, 2, 3, 2, 0, -1, -1, -1], bass: [0, 0, 2, 2, 3, 3, 1, 1] },
  caverna: { tempo: 100, root: 52, scale: MINOR, wave: "triangle", melody: [0, -1, 2, -1, 3, 2, 0, -1, 4, -1, 3, -1, 2, 1, 0, -1], bass: [0, 0, 0, 0, 5, 5, 4, 4] },
  ceu: { tempo: 140, root: 62, scale: MINOR, wave: "square", melody: [0, 2, 4, 6, 4, 2, 4, -1, 3, 4, 5, 4, 2, 0, 1, -1], bass: [0, 0, 5, 5, 3, 3, 4, 4] },
  espaco: { tempo: 120, root: 55, scale: PENTA, wave: "sine", melody: [0, 2, 4, 5, 4, 2, 3, -1, 0, 4, 3, 2, 1, 2, 0, -1], bass: [0, 0, 3, 3, 2, 2, 4, 4] },
};

const LOOKAHEAD_S = 0.15;
const TICK_MS = 50;

function midiToHz(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

/** Tiny chiptune synth: music loop per theme plus sound effects. */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private nextTime = 0;
  private song: Song = SONGS.floresta;
  muted = false;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.22;
      this.musicGain.connect(this.master);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.05);
  }

  playMusic(theme: Theme): void {
    const ctx = this.ensure();
    if (!ctx) return;
    this.song = SONGS[theme];
    this.stopMusic();
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), TICK_MS);
  }

  stopMusic(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;
    const stepDur = 60 / this.song.tempo / 2;
    while (this.nextTime < ctx.currentTime + LOOKAHEAD_S) {
      const m = this.song.melody[this.step % this.song.melody.length];
      if (m >= 0) this.note(this.degree(m, 12), this.nextTime, stepDur * 0.9, this.song.wave, 0.35, this.musicGain);
      if (this.step % 2 === 0) {
        const b = this.song.bass[(this.step / 2) % this.song.bass.length];
        this.note(this.degree(b, -12), this.nextTime, stepDur * 1.8, "triangle", 0.5, this.musicGain);
      }
      this.nextTime += stepDur;
      this.step++;
    }
  }

  private degree(d: number, octave: number): number {
    const s = this.song.scale;
    return this.song.root + octave + s[d % s.length] + Math.floor(d / s.length) * 12;
  }

  private note(midi: number, at: number, dur: number, wave: OscillatorType, vol: number, dest: AudioNode): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = midiToHz(midi);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(vol, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, at + dur);
    osc.connect(gain).connect(dest);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  private sweep(from: number, to: number, dur: number, wave: OscillatorType, vol: number, delay = 0): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const at = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(from, at);
    osc.frequency.exponentialRampToValueAtTime(to, at + dur);
    gain.gain.setValueAtTime(vol, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + dur);
    osc.connect(gain).connect(this.master);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  sfx(name: Sfx): void {
    if (!this.ensure()) return;
    switch (name) {
      case "jump":
        return this.sweep(280, 620, 0.16, "square", 0.18);
      case "power":
        this.sweep(520, 1400, 0.1, "triangle", 0.16);
        return this.sweep(1400, 900, 0.12, "sine", 0.1, 0.08);
      case "empty":
        return this.sweep(180, 140, 0.08, "square", 0.12);
      case "tink":
        return this.sweep(2200, 1800, 0.06, "square", 0.08);
      case "defeat":
        this.sweep(700, 200, 0.18, "square", 0.18);
        return this.sweep(1200, 1600, 0.12, "triangle", 0.12, 0.1);
      case "star":
        this.sweep(990, 990, 0.07, "square", 0.15);
        return this.sweep(1320, 1320, 0.16, "square", 0.15, 0.07);
      case "stomp":
        return this.sweep(500, 120, 0.15, "square", 0.25);
      case "hurt":
        return this.sweep(420, 80, 0.35, "sawtooth", 0.25);
      case "gate":
        return [523, 659, 784].forEach((f, i) => this.sweep(f, f * 1.01, 0.14, "triangle", 0.25, i * 0.08));
      case "correct":
        return [523, 659, 784, 1046].forEach((f, i) => this.sweep(f, f, 0.16, "square", 0.18, i * 0.09));
      case "wrong":
        return [330, 262].forEach((f, i) => this.sweep(f, f * 0.95, 0.25, "sawtooth", 0.2, i * 0.18));
      case "win":
        return [523, 659, 784, 1046, 784, 1046].forEach((f, i) => this.sweep(f, f, 0.2, "square", 0.18, i * 0.12));
      case "lose":
        return [392, 330, 262, 196].forEach((f, i) => this.sweep(f, f, 0.3, "triangle", 0.25, i * 0.22));
    }
  }

  dispose(): void {
    this.stopMusic();
    void this.ctx?.close();
    this.ctx = null;
  }
}
