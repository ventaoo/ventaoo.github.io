/**
 * The background: a slow ink wash.
 *
 * Two drifting colour fields plus a few hair-thin ink curves, drawn at device
 * resolution (no pixel grid anywhere). It breathes rather than animates —
 * roughly 30 fps, tiny amplitudes — so it reads as paper texture, not motion.
 */
import { addTick, reducedMotion } from '../core/ticker';
import { cssVar, hex2rgb, mulberry32, type RGB } from '../core/dom';

interface Curve { base: number; amp: number; len: number; speed: number; phase: number; alpha: number }

class Atmosphere {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private t = 0;
  private acc = 0;
  private curves: Curve[] = [];
  private accent: RGB = [168, 63, 40];
  private ink: RGB = [25, 23, 18];
  private key = '';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable');
    this.ctx = ctx;
    this.readPalette();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private readPalette(): void {
    this.accent = hex2rgb(cssVar('--accent'));
    this.ink = hex2rgb(cssVar('--ink'));
    this.key = (document.documentElement.dataset.theme ?? 'light') + '/' + (document.documentElement.dataset.accent ?? 'vermillion');
  }

  private resize(): void {
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.w = innerWidth;
    this.h = innerHeight;
    this.canvas.width = Math.floor(this.w * this.dpr);
    this.canvas.height = Math.floor(this.h * this.dpr);
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const rnd = mulberry32(0xa11ce);
    this.curves = Array.from({ length: 5 }, (_, i) => ({
      base: this.h * (0.24 + i * 0.14),
      amp: this.h * (0.02 + rnd() * 0.045),
      len: 900 + rnd() * 1500,
      speed: 0.012 + rnd() * 0.026,
      phase: rnd() * Math.PI * 2,
      alpha: 0.05 + rnd() * 0.045,
    }));
    this.draw(0, true);
  }

  /** A soft radial field, drawn as one gradient — cheap and smooth. */
  private wash(x: number, y: number, r: number, c: RGB, alpha: number): void {
    const g = this.ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${alpha})`);
    g.addColorStop(1, `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},0)`);
    this.ctx.fillStyle = g;
    this.ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  private draw(dt: number, force = false): void {
    const root = document.documentElement;
    const key = (root.dataset.theme ?? 'light') + '/' + (root.dataset.accent ?? 'vermillion');
    if (key !== this.key) this.readPalette();
    if (!force) this.t += dt;

    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);

    const drift = this.t * 0.00004;
    this.wash(
      w * (0.72 + Math.sin(drift * 1.7) * 0.06),
      h * (0.18 + Math.cos(drift * 1.3) * 0.05),
      Math.max(w, h) * 0.55,
      this.accent,
      0.06,
    );
    this.wash(
      w * (0.18 + Math.cos(drift * 1.1) * 0.07),
      h * (0.76 + Math.sin(drift * 0.9) * 0.05),
      Math.max(w, h) * 0.5,
      this.ink,
      0.045,
    );

    // hair-thin ink curves
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    const step = 14;
    for (const c of this.curves) {
      ctx.beginPath();
      for (let x = -step; x <= w + step; x += step) {
        const u = x / c.len;
        const y =
          c.base +
          Math.sin(u * 6.283 + this.t * c.speed * 0.001 + c.phase) * c.amp +
          Math.sin(u * 15.7 + this.t * c.speed * 0.0006 + c.phase * 1.7) * c.amp * 0.34;
        if (x <= -step) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${this.ink[0] | 0},${this.ink[1] | 0},${this.ink[2] | 0},${c.alpha})`;
      ctx.stroke();
    }
  }

  start(): void {
    if (reducedMotion) {
      this.draw(0, true);
      window.addEventListener('scroll', () => this.draw(0, true), { passive: true });
      return;
    }
    addTick((dt) => {
      this.acc += dt;
      if (this.acc < 32) return; // ~30 fps is plenty for something this slow
      this.draw(this.acc);
      this.acc = 0;
    });
  }
}

export function initAtmosphere(): void {
  const canvas = document.getElementById('atmosphere') as HTMLCanvasElement | null;
  if (!canvas) return;
  try {
    new Atmosphere(canvas).start();
  } catch (err) {
    console.error('[atmosphere] failed to start', err);
  }
}
