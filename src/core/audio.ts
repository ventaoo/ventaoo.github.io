/**
 * A miniature 8-bit sound chip built on the Web Audio API — square/triangle/noise
 * voices, plus a step sequencer that plays a chiptune loop while you read.
 * No audio files, no dependencies: every sound is synthesised on demand.
 */
import { settings, setSetting } from './store';

type Wave = OscillatorType;

class Chip {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private seqTimer: number | null = null;
  private step = 0;

  /** Lazily create the graph — browsers require a user gesture first. */
  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctor) return null;
    const ctx: AudioContext = new Ctor();
    const master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);

    const music = ctx.createGain();
    music.gain.value = 0.16;
    music.connect(master);

    // one second of white noise, reused by every percussive voice
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    this.ctx = ctx;
    this.master = master;
    this.musicGain = music;
    this.noiseBuf = buf;
    return ctx;
  }

  unlock(): void {
    const ctx = this.ensure();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  }

  private tone(
    freq: number,
    dur: number,
    wave: Wave = 'square',
    vol = 0.14,
    dest: AudioNode | null = null,
    slideTo?: number,
  ): void {
    if (!settings.sound) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    // hard on/off envelope => authentic 1-bit attack
    gain.gain.setValueAtTime(vol, t);
    gain.gain.setValueAtTime(vol, t + dur * 0.82);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(dest ?? this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol = 0.1, highpass = 1200, dest: AudioNode | null = null): void {
    if (!settings.sound) return;
    const ctx = this.ensure();
    if (!ctx || !this.noiseBuf || !this.master) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = highpass;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(gain).connect(dest ?? this.master);
    src.start(t);
    src.stop(t + dur);
  }

  /* ── UI voices ─────────────────────────────────────────────────────── */
  hover(): void { this.tone(880, 0.03, 'square', 0.035); }
  blip(): void { this.tone(660, 0.07, 'square', 0.1); }
  select(): void { this.tone(520, 0.06, 'square', 0.1); window.setTimeout(() => this.tone(780, 0.09, 'square', 0.1), 55); }
  back(): void { this.tone(420, 0.07, 'square', 0.09); window.setTimeout(() => this.tone(280, 0.1, 'square', 0.09), 55); }
  type(): void { this.tone(1500 + Math.random() * 500, 0.014, 'square', 0.02); }
  coin(): void {
    this.tone(988, 0.07, 'square', 0.12);
    window.setTimeout(() => this.tone(1319, 0.18, 'square', 0.12), 70);
  }
  levelUp(): void {
    [523, 659, 784, 1047].forEach((f, i) => window.setTimeout(() => this.tone(f, 0.16, 'square', 0.13), i * 95));
  }
  achievement(): void {
    [784, 988, 1175, 1568].forEach((f, i) => window.setTimeout(() => this.tone(f, 0.14, 'triangle', 0.13), i * 80));
  }
  error(): void { this.tone(160, 0.18, 'sawtooth', 0.1, null, 90); }
  warp(): void { this.tone(220, 0.5, 'square', 0.11, null, 1400); }
  power(): void {
    this.noise(0.3, 0.07, 400);
    this.tone(180, 0.4, 'triangle', 0.1, null, 900);
  }

  /* ── background chiptune ───────────────────────────────────────────── */
  private static readonly BASS = [110, 110, 146.8, 146.8, 87.3, 87.3, 130.8, 130.8];
  private static readonly ARP = [440, 523, 659, 523, 587, 698, 880, 698, 349, 440, 523, 440, 523, 659, 784, 659];

  private stepMs(): number { return 150; }

  private tickSeq(): void {
    if (!settings.sound || !this.musicGain) return;
    const s = this.step;
    const bass = Chip.BASS[s % Chip.BASS.length];
    const arp = Chip.ARP[s % Chip.ARP.length];
    this.tone(bass, 0.16, 'triangle', 0.22, this.musicGain);
    this.tone(arp, 0.09, 'square', 0.075, this.musicGain);
    if (s % 4 === 2) this.noise(0.05, 0.05, 3000, this.musicGain);
    if (s % 8 === 0) this.noise(0.11, 0.07, 1200, this.musicGain);
    this.step = (s + 1) % 64;
  }

  startMusic(): void {
    if (this.seqTimer !== null) return;
    const ctx = this.ensure();
    if (!ctx) return;
    void ctx.resume();
    this.seqTimer = window.setInterval(() => this.tickSeq(), this.stepMs());
  }

  stopMusic(): void {
    if (this.seqTimer === null) return;
    clearInterval(this.seqTimer);
    this.seqTimer = null;
  }

  toggleSound(): boolean {
    setSetting('sound', !settings.sound);
    if (settings.sound) {
      this.unlock();
      this.select();
      if (settings.music) this.startMusic();
    } else {
      this.stopMusic();
    }
    return settings.sound;
  }

  toggleMusic(): boolean {
    setSetting('music', !settings.music);
    if (settings.music && settings.sound) this.startMusic();
    else this.stopMusic();
    return settings.music;
  }
}

export const chip = new Chip();
