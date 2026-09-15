/**
 * PIXELVERSE — the living background.
 *
 * A deliberately low-resolution canvas (≈200–520px wide) stretched over the
 * viewport with `image-rendering: pixelated`, so every rectangle we draw becomes
 * a chunky, honest pixel. Nine layers scroll at different rates, the sun arcs
 * across the sky as you read, and a small hero walks along the ground forever.
 */
import { addTick, reducedMotion } from '../core/ticker';
import { chip } from '../core/audio';
import { clamp, cssVar, hex2rgb, mixRGB, mulberry32, rgb2css, type RGB } from '../core/dom';

interface Star { x: number; y: number; s: number; ph: number; sp: number }
interface Cloud { x: number; y: number; w: number; h: number; sp: number; layer: number }
interface Building { x: number; w: number; h: number; win: { x: number; y: number; ph: number }[] }
interface Tree { x: number; h: number; kind: number }
interface Isle { x: number; y: number; w: number; sp: number; h: number }
interface Fly { x: number; y: number; ph: number; sp: number; r: number }
interface Shoot { x: number; y: number; vx: number; vy: number; life: number }

/** A walk cycle is just three different pairs of legs. */
const HERO_BODY = [
  '..hhhh..',
  '.hssssh.',
  '.skssks.',
  '.ssssss.',
  '..ssss..',
  '.cccccc.',
  'cccccccc',
  '.cccccc.',
];
const HERO_LEGS: string[][] = [
  ['..pppp..', '..pp.pp.', '..pp.pp.', '.bb..bb.'],
  ['.pp..pp.', '.pp..pp.', '.pp..pp.', 'bb....bb'],
  ['..pppp..', '.pp..pp.', '.pp..pp.', '.bb..bb.'],
  ['.pp..pp.', '.pp..pp.', '.pp..pp.', 'bb....bb'],
];
const CAT = ['k.....k', 'kk...kk', 'kkkkkkk', 'kkkkkkk', '.k.k.k.'];

const PALETTE_KEYS = ['--sky-a', '--sky-b', '--sky-c', '--ink', '--bg', '--a1', '--a2', '--a3', '--a4', '--a5', '--a6', '--line', '--panel-solid'] as const;
type Pal = Record<(typeof PALETTE_KEYS)[number], RGB>;

class World {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private W = 320;
  private H = 200;
  private acc = 0;
  private time = 0;
  private pal!: Pal;
  private sunHit: HTMLButtonElement;
  private rnd = mulberry32(0x5eed);
  private stars: Star[] = [];
  private clouds: Cloud[] = [];
  private mtnFar: number[] = [];
  private mtnMid: number[] = [];
  private city: Building[] = [];
  private trees: Tree[] = [];
  private isles: Isle[] = [];
  private flies: Fly[] = [];
  private grit: { x: number; y: number; w: number; c: number }[] = [];
  private shoot: Shoot | null = null;
  private nextShoot = 4000;
  private heroX = 40;
  private heroDir = 1;
  private heroFrame = 0;
  private catX = 20;
  private lastTheme = '';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('2D canvas is unavailable');
    this.ctx = ctx;

    this.sunHit = document.createElement('button');
    this.sunHit.type = 'button';
    this.sunHit.className = 'sun-hit';
    this.sunHit.title = '戳一下天体';
    this.sunHit.setAttribute('aria-label', '点击切换昼 / 夜');
    document.body.appendChild(this.sunHit);
    this.sunHit.addEventListener('click', () => {
      const ev = new CustomEvent('pv:toggle-theme', { bubbles: true });
      this.sunHit.dispatchEvent(ev);
    });

    this.readPalette();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private readPalette(): void {
    const root = document.documentElement;
    const src = {} as Record<string, RGB>;
    for (const k of PALETTE_KEYS) src[k] = hex2rgb(cssVar(k));
    const day = root.dataset.theme === 'day';
    // Night keeps the declared palette; day lifts the sky and softens the rock.
    const sky = day ? [mixRGB(src['--sky-a'], [126, 199, 240], 0.72), mixRGB(src['--sky-b'], [173, 222, 250], 0.78), mixRGB(src['--sky-c'], [255, 224, 178], 0.72)] : [src['--sky-a'], src['--sky-b'], src['--sky-c']];
    this.pal = {
      ...src,
      '--sky-a': sky[0] as RGB,
      '--sky-b': sky[1] as RGB,
      '--sky-c': sky[2] as RGB,
    } as Pal;
    this.lastTheme = (root.dataset.theme ?? 'night') + '/' + (root.dataset.palette ?? 'dusk');
  }

  private resize(): void {
    const vw = Math.max(320, innerWidth);
    const vh = Math.max(320, innerHeight);
    this.W = Math.round(clamp(vw / 3.2, 200, 560));
    this.H = Math.round((this.W * vh) / vw);
    this.canvas.width = this.W;
    this.canvas.height = this.H;
    this.ctx.imageSmoothingEnabled = false;
    this.generate();
    this.draw(0, 0, true);
  }

  private px(x: number, y: number, w: number, h: number, c: RGB | string, a = 1): void {
    this.ctx.fillStyle = typeof c === 'string' ? c : rgb2css(c, a);
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  }

  private generate(): void {
    const { W, H } = this;
    const r = mulberry32(0x5eed ^ (W * 2654435761));
    const hz = this.horizon();

    this.stars = Array.from({ length: Math.round(W * 0.45) }, () => ({
      x: r() * W,
      y: r() * hz * 0.92,
      s: r() > 0.86 ? 2 : 1,
      ph: r() * Math.PI * 2,
      sp: 0.4 + r() * 1.6,
    }));

    this.clouds = Array.from({ length: 9 }, (_, i) => ({
      x: r() * W * 1.4 - W * 0.2,
      y: 8 + r() * hz * 0.42,
      w: 14 + r() * 30,
      h: 4 + r() * 3,
      sp: 1.5 + r() * 4,
      layer: i % 2,
    }));

    const ridge = (base: number, amp: number, rough: number) => {
      const out: number[] = [];
      let y = base + (r() - 0.5) * amp * 0.4;
      for (let x = 0; x < W; x++) {
        y += (r() - 0.5) * rough;
        y = clamp(y, base - amp, base + amp * 0.35);
        out.push(Math.round(y));
      }
      // light smoothing so the silhouette reads as rock, not noise
      return out.map((v, i, a) => Math.round((v + (a[i - 1] ?? v) + (a[i + 1] ?? v)) / 3));
    };
    this.mtnFar = ridge(hz - H * 0.13, H * 0.13, 1.5);
    this.mtnMid = ridge(hz - H * 0.06, H * 0.08, 1.9);

    this.city = [];
    for (let x = -6; x < W + 6; ) {
      const w = 8 + Math.floor(r() * 16);
      const h = 10 + Math.floor(r() * H * 0.16);
      const win: Building['win'] = [];
      for (let wy = 4; wy < h - 4; wy += 6) {
        for (let wx = 3; wx < w - 3; wx += 5) {
          if (r() > 0.42) win.push({ x: wx, y: wy, ph: r() * Math.PI * 2 });
        }
      }
      this.city.push({ x, w, h, win });
      x += w + 1 + Math.floor(r() * 5);
    }

    this.trees = Array.from({ length: Math.round(W / 26) + 3 }, () => ({
      x: r() * W,
      h: H * 0.07 + r() * H * 0.09,
      kind: Math.floor(r() * 3),
    }));

    this.isles = Array.from({ length: 3 }, (_, i) => ({
      x: W * (0.16 + i * 0.32) + r() * 24,
      y: hz - H * (0.3 + r() * 0.16),
      w: 26 + r() * 26,
      sp: 0.12 + r() * 0.22,
      h: 6 + r() * 5,
    }));

    this.flies = Array.from({ length: Math.round(W / 14) }, () => ({
      x: r() * W,
      y: hz - H * 0.02 + r() * H * 0.34,
      ph: r() * Math.PI * 2,
      sp: 0.4 + r() * 1.1,
      r: r(),
    }));

    this.grit = [];
    for (let i = 0; i < W * 0.7; i++) {
      this.grit.push({ x: r() * W, y: hz + 6 + r() * (H - hz - 8), w: 1 + Math.floor(r() * 3), c: r() });
    }
  }

  private horizon(): number {
    return Math.round(this.H * 0.685);
  }

  // ── scene pieces ────────────────────────────────────────────────────────
  private sky(shift: number): void {
    const { W, H } = this;
    const [a, b, c] = [this.pal['--sky-a'], this.pal['--sky-b'], this.pal['--sky-c']];
    const hz = this.horizon();
    const bands = 22;
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1);
      const col = t < 0.55 ? mixRGB(a, b, t / 0.55) : mixRGB(b, c, (t - 0.55) / 0.45);
      const y = Math.round((i * hz) / bands - shift * 0.04);
      this.px(0, y, W, Math.ceil(hz / bands) + 2, col);
    }
    this.px(0, hz - shift * 0.04, W, H - hz + 4, c);
  }

  private celestial(prog: number, night: boolean): void {
    const { W } = this;
    const hz = this.horizon();
    // the sun/moon rides an arc that is driven by how far you have scrolled
    const t = clamp(0.06 + prog * 0.86, 0, 1);
    const x = Math.round(W * 0.08 + t * W * 0.8);
    const arc = Math.sin(t * Math.PI);
    const y = Math.round(hz * 0.78 - arc * hz * 0.62);
    const rad = Math.max(5, Math.round(this.H * 0.055));

    const body = night ? ([236, 240, 255] as RGB) : this.pal['--a1'];
    const glow = night ? ([150, 170, 240] as RGB) : this.pal['--a6'];

    this.ctx.globalAlpha = 0.18;
    for (let i = 3; i >= 1; i--) this.px(x - rad * i, y - rad * i, rad * 2 * i, rad * 2 * i, glow);
    this.ctx.globalAlpha = 1;

    // a chunky circle assembled from scanline spans
    for (let dy = -rad; dy <= rad; dy++) {
      const span = Math.floor(Math.sqrt(Math.max(0, rad * rad - dy * dy)));
      this.px(x - span, y + dy, span * 2, 1, body);
    }
    if (night) {
      // crescent bite
      for (let dy = -rad; dy <= rad; dy++) {
        const span = Math.floor(Math.sqrt(Math.max(0, rad * rad - dy * dy)));
        const off = Math.round(rad * 0.42 + rad * 0.3 * Math.sin(dy * 0.22));
        this.px(x - span + off, y + dy, span, 1, this.pal['--sky-a']);
      }
      this.px(x + rad + 3, y - rad - 2, 1, 1, body);
      this.px(x - rad - 4, y + 2, 1, 1, body);
    }

    this.sunHit.style.left = (x / this.W) * innerWidth - 26 + 'px';
    this.sunHit.style.top = (y / this.H) * innerHeight - 26 + 'px';
    this.sunHit.style.width = this.sunHit.style.height = (rad * 2 * innerWidth) / this.W + 'px';
  }

  private starfield(shift: number, night: boolean): void {
    const tw = this.pal['--a1'];
    for (const s of this.stars) {
      const y = s.y - shift * 0.05;
      if (y < -2 || y > this.horizon()) continue;
      const flick = night ? 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(this.time * 0.0016 * s.sp + s.ph)) : 0.16;
      this.px(s.x, y, s.s, s.s, night ? tw : [255, 255, 255], flick);
    }
    if (this.shoot && this.shoot.life > 0) {
      const sh = this.shoot;
      for (let i = 0; i < 7; i++) {
        this.px(sh.x - sh.vx * i * 1.6, sh.y - sh.vy * i * 1.6, 1, 1, [255, 255, 255], (1 - i / 7) * (sh.life / 500));
      }
    }
  }

  private cloudLayer(shift: number, layer: number): void {
    const base = mixRGB(this.pal['--sky-c'], [255, 255, 255], layer ? 0.42 : 0.2);
    for (const c of this.clouds) {
      if (c.layer !== layer) continue;
      const x = c.x - shift * (layer ? 0.14 : 0.06);
      const y = c.y - shift * 0.03;
      if (x < -c.w - 20 || x > this.W + 20) continue;
      this.px(x, y, c.w, c.h, base, layer ? 0.95 : 0.7);
      this.px(x + c.w * 0.2, y - c.h, c.w * 0.5, c.h, base, layer ? 0.95 : 0.7);
      this.px(x + c.w * 0.55, y - c.h * 0.5, c.w * 0.32, c.h * 0.6, base, layer ? 0.95 : 0.7);
    }
  }

  private ridgeLine(heights: number[], shift: number, factor: number, col: RGB, cap: RGB, night: boolean): void {
    const hz = this.horizon();
    const off = shift * factor;
    for (let x = 0; x < this.W; x++) {
      const top = heights[x] - off;
      this.px(x, top, 1, hz + 8 - top, col);
      // a lit rim on the sun-facing side
      this.px(x, top, 1, 1, night ? cap : mixRGB(cap, [255, 255, 255], 0.35));
      if (x % 7 === 0) this.px(x, top + 3, 1, 2, cap, 0.5);
    }
  }

  private skyline(shift: number, night: boolean): void {
    const hz = this.horizon();
    const off = shift * 0.2;
    const body = mixRGB(this.pal['--sky-a'], this.pal['--ink'], night ? 0.72 : 0.34);
    const win = night ? this.pal['--a1'] : mixRGB(this.pal['--a3'], [255, 255, 255], 0.2);
    for (const b of this.city) {
      const y = hz - b.h - off;
      this.px(b.x, y, b.w, b.h + 8, body);
      this.px(b.x, y, b.w, 1, mixRGB(body, [255, 255, 255], 0.22));
      for (const w of b.win) {
        const lit = night ? 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(this.time * 0.0011 + w.ph)) : 0.5;
        this.px(b.x + w.x, y + w.y, 2, 2, win, lit);
      }
    }
  }

  private ground(shift: number, night: boolean): void {
    const { W, H } = this;
    const hz = this.horizon();
    const off = shift * 0.34;
    const top = hz - off + 2;
    const grass = mixRGB(this.pal['--a5'], this.pal['--ink'], night ? 0.42 : 0.12);
    const soil = mixRGB(this.pal['--a6'], this.pal['--ink'], night ? 0.78 : 0.42);
    const deep = mixRGB(soil, this.pal['--ink'], 0.55);

    this.px(0, top, W, H - top + 4, soil);
    this.px(0, top, W, 3, grass);
    this.px(0, top + 3, W, 2, mixRGB(grass, soil, 0.5));
    this.px(0, top + Math.round((H - top) * 0.55), W, 2, deep);
    for (const g of this.grit) {
      const y = g.y - off * 0.3;
      if (y < top + 6) continue;
      this.px(g.x, y, g.w, 1, g.c > 0.5 ? deep : mixRGB(soil, grass, 0.3), 0.85);
    }
  }

  private flora(shift: number, night: boolean): void {
    const hz = this.horizon();
    const off = shift * 0.46;
    const trunk = mixRGB(this.pal['--a6'], this.pal['--ink'], night ? 0.72 : 0.5);
    const leafA = mixRGB(this.pal['--a5'], this.pal['--ink'], night ? 0.5 : 0.24);
    const leafB = mixRGB(this.pal['--a3'], this.pal['--ink'], night ? 0.62 : 0.36);
    for (const t of this.trees) {
      const base = hz - off + 4;
      const h = Math.round(t.h);
      if (t.kind === 0) {
        this.px(t.x, base - h, 3, h, trunk);
        for (let i = 0; i < 4; i++) {
          const w = Math.round(14 - i * 2.6);
          this.px(t.x - w / 2 + 1, base - h - i * 4 - 3, w, 4, i % 2 ? leafA : leafB);
        }
      } else if (t.kind === 1) {
        this.px(t.x, base - h * 0.7, 4, h * 0.7, trunk);
        this.px(t.x - 6, base - h - 2, 16, 8, leafA);
        this.px(t.x - 3, base - h - 6, 11, 5, leafB);
      } else {
        this.px(t.x, base - h * 1.25, 2, h * 1.25, trunk);
        for (let i = 0; i < 3; i++) this.px(t.x - 4 + (i % 2) * 4, base - h * 1.25 - i * 4 - 2, 8, 4, i % 2 ? leafB : leafA);
      }
    }
  }

  private islands(shift: number, night: boolean): void {
    const rock = mixRGB(this.pal['--sky-a'], this.pal['--ink'], night ? 0.5 : 0.2);
    const grass = mixRGB(this.pal['--a5'], this.pal['--ink'], night ? 0.35 : 0.1);
    for (const s of this.isles) {
      const bob = Math.sin(this.time * 0.0006 * s.sp * 6 + s.x) * 2;
      const x = s.x - shift * 0.1;
      const y = s.y - shift * 0.03 + bob;
      const w = Math.round(s.w);
      this.px(x, y, w, 4, grass);
      for (let i = 0; i < s.h; i++) {
        const cw = w - i * (w / (s.h + 1.5));
        this.px(x + (w - cw) / 2, y + 4 + i, cw, 1, mixRGB(rock, this.pal['--ink'], i / (s.h * 1.6)));
      }
      // a lonely tree and a beacon
      this.px(x + w * 0.28, y - 7, 2, 7, mixRGB(this.pal['--a6'], this.pal['--ink'], 0.5));
      this.px(x + w * 0.28 - 4, y - 13, 10, 7, mixRGB(this.pal['--a5'], this.pal['--ink'], night ? 0.4 : 0.15));
      const beacon = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(this.time * 0.003 + s.x));
      this.px(x + w * 0.76, y - 4, 2, 4, this.pal['--line']);
      this.px(x + w * 0.76 - 1, y - 6, 4, 2, this.pal['--a2'], beacon);
    }
  }

  private sprite(art: string[], x: number, y: number, map: Record<string, RGB>, flip: boolean): void {
    const rows = art.length;
    const cols = art[0].length;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ch = art[r][flip ? cols - 1 - c : c];
        const col = map[ch];
        if (!col) continue;
        this.px(x + c, y + r, 1, 1, col);
      }
    }
  }

  private hero(shift: number): void {
    const { W } = this;
    const hz = this.horizon();
    const groundY = hz - shift * 0.34 + 6;
    this.heroX += this.heroDir * 0.35;
    if (this.heroX > W + 20) this.heroX = -20;
    if (this.heroX < -20) this.heroX = W + 20;
    this.catX += (this.heroX - this.heroDir * 16 - this.catX) * 0.06;

    const map: Record<string, RGB> = {
      h: this.pal['--a4'],
      s: [247, 206, 164],
      k: [24, 20, 40],
      c: this.pal['--a1'],
      p: this.pal['--a3'],
      b: [40, 34, 66],
    };
    const art = [...HERO_BODY, ...HERO_LEGS[this.heroFrame]];
    this.sprite(art, Math.round(this.heroX), Math.round(groundY - art.length), map, this.heroDir < 0);

    const catMap: Record<string, RGB> = { k: mixRGB(this.pal['--a4'], this.pal['--ink'], 0.45) };
    const catArt = CAT.map((row, i) => (i === 1 && this.heroFrame % 2 ? '.k...k.' : row));
    this.sprite(catArt, Math.round(this.catX), Math.round(groundY - catArt.length), catMap, this.heroDir < 0);
  }

  private fireflies(shift: number, night: boolean): void {
    const hz = this.horizon();
    for (const f of this.flies) {
      const y = f.y - shift * 0.2 + Math.sin(this.time * 0.001 * f.sp + f.ph) * 4;
      const x = f.x + Math.cos(this.time * 0.0007 * f.sp + f.ph) * 6 - shift * 0.16;
      const a = night ? 0.3 + 0.7 * f.r : 0.22;
      this.px(x, y, 1, 1, this.pal['--a1'], a);
      if (f.r > 0.75 && night) {
        this.ctx.globalAlpha = a * 0.25;
        this.px(x - 1, y - 1, 3, 3, this.pal['--a1']);
        this.ctx.globalAlpha = 1;
      }
    }
  }

  private foreground(shift: number, night: boolean): void {
    const { W, H } = this;
    const hz = this.horizon();
    const off = shift * 0.52;
    const col = mixRGB(this.pal['--ink'], [0, 0, 0], night ? 0.1 : 0.02);
    const y = H - 10 - off * 0.4;
    // a silhouette of pipes and rocks framing the bottom edge
    this.px(0, y + 8, W, H - y, col);
    for (let x = 0; x < W; x += 34) {
      this.px(x, y - 6 + (x % 68 ? 0 : 4), 12, 16, col);
      this.px(x + 14, y - 2, 8, 12, col);
    }
    this.px(0, hz + 40 - off, W, 3, col, 0.55);
  }

  // ── main loop ───────────────────────────────────────────────────────────
  private draw(dt: number, scrollY: number, force = false): void {
    const root = document.documentElement;
    const key = (root.dataset.theme ?? 'night') + '/' + (root.dataset.palette ?? 'dusk');
    if (key !== this.lastTheme) this.readPalette();

    const night = (root.dataset.theme ?? 'night') === 'night';
    const docH = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const prog = clamp(scrollY / docH, 0, 1);
    const shift = clamp(scrollY / (innerHeight / this.H), 0, this.H * 1.6);

    if (!force) {
      this.time += dt;
      this.heroFrame = Math.floor(this.time / 150) % 4;
      if (night && this.time > this.nextShoot && !this.shoot) {
        this.shoot = { x: this.W * (0.2 + Math.random() * 0.7), y: this.horizon() * 0.25, vx: -3.4, vy: 1.5, life: 500 };
        this.nextShoot = this.time + 6000 + Math.random() * 12000;
      }
      if (this.shoot) {
        this.shoot.x += this.shoot.vx;
        this.shoot.y += this.shoot.vy;
        this.shoot.life -= dt;
        if (this.shoot.life <= 0) this.shoot = null;
      }
    }

    this.sky(shift);
    this.starfield(shift, night);
    this.celestial(prog, night);
    this.cloudLayer(shift, 0);
    this.islands(shift, night);
    this.ridgeLine(this.mtnFar, shift, 0.06, mixRGB(this.pal['--sky-b'], this.pal['--ink'], night ? 0.55 : 0.24), mixRGB(this.pal['--sky-c'], [255, 255, 255], 0.25), night);
    this.ridgeLine(this.mtnMid, shift, 0.11, mixRGB(this.pal['--sky-b'], this.pal['--ink'], night ? 0.74 : 0.42), mixRGB(this.pal['--a4'], [255, 255, 255], 0.2), night);
    this.cloudLayer(shift, 1);
    this.skyline(shift, night);
    this.flora(shift, night);
    this.ground(shift, night);
    this.hero(shift);
    this.fireflies(shift, night);
    this.foreground(shift, night);
  }

  start(): void {
    if (reducedMotion) {
      this.draw(0, window.scrollY, true);
      window.addEventListener('scroll', () => this.draw(0, window.scrollY, true), { passive: true });
      return;
    }
    addTick((dt, _t, scrollY) => {
      this.acc += dt;
      if (this.acc < 33) return; // a deliberate ~30fps for that arcade cadence
      this.draw(this.acc, scrollY);
      this.acc = 0;
    });
  }
}

export function initWorld(): void {
  const canvas = document.getElementById('world') as HTMLCanvasElement | null;
  if (!canvas) return;
  try {
    const world = new World(canvas);
    world.start();
  } catch (err) {
    console.error('[world] failed to start', err);
    chip.error();
  }
}
