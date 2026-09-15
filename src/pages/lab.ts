import type { View } from '../core/router';
import { icon } from '../core/icons';
import { esc } from '../core/dom';
import { labTiles } from '../data/profile';
import { addTick, reducedMotion } from '../core/ticker';
import { bindReveals } from '../fx/reveal';
import { addXp, unlock } from '../core/gamification';
import { chip } from '../core/audio';
import { toast } from '../core/toast';

type Setup = (canvas: HTMLCanvasElement) => () => void;

/** Particle sandbox — gravity, floor bounce, pointer repulsion. */
const particles: Setup = (canvas) => {
  const ctx = canvas.getContext('2d')!;
  let w = 0;
  let h = 0;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const bits: { x: number; y: number; vx: number; vy: number; c: string }[] = [];
  const COLORS = ['#ffd23f', '#ff5d73', '#3ddad7', '#a06cd5', '#7ee081'];
  const pointer = { x: -999, y: -999, on: false };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    w = Math.max(80, r.width);
    h = Math.max(80, r.height);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  for (let i = 0; i < 130; i++) {
    bits.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 2, vy: Math.random() * 2, c: COLORS[(Math.random() * COLORS.length) | 0] });
  }

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
    pointer.on = true;
  });
  canvas.addEventListener('pointerleave', () => (pointer.on = false));
  canvas.addEventListener('click', () => {
    chip.coin();
    for (const b of bits) {
      const dx = b.x - pointer.x;
      const dy = b.y - pointer.y;
      const d = Math.hypot(dx, dy) || 1;
      const f = Math.min(220 / d, 12);
      b.vx += (dx / d) * f;
      b.vy += (dy / d) * f;
    }
  });

  const off = addTick((dt) => {
    const s = Math.min(dt / 16.67, 2);
    ctx.clearRect(0, 0, w, h);
    for (const b of bits) {
      b.vy += 0.24 * s;
      if (pointer.on) {
        const dx = b.x - pointer.x;
        const dy = b.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 7000) {
          const d = Math.sqrt(d2) || 1;
          b.vx += (dx / d) * 0.6 * s;
          b.vy += (dy / d) * 0.6 * s;
        }
      }
      b.vx *= 0.99;
      b.x += b.vx * s;
      b.y += b.vy * s;
      if (b.y > h - 3) {
        b.y = h - 3;
        b.vy *= -0.62;
        b.vx *= 0.94;
      }
      if (b.x < 2 || b.x > w - 2) {
        b.vx *= -0.8;
        b.x = Math.max(2, Math.min(w - 2, b.x));
      }
      ctx.fillStyle = b.c;
      ctx.fillRect(Math.round(b.x), Math.round(b.y), 3, 3);
    }
  });
  window.addEventListener('resize', resize);
  return () => {
    off();
    window.removeEventListener('resize', resize);
  };
};

/** Conway's Game of Life on a chunky grid. */
const life: Setup = (canvas) => {
  const ctx = canvas.getContext('2d')!;
  const CS = 8;
  let cols = 40;
  let rows = 24;
  let grid = new Uint8Array(cols * rows);
  let next = new Uint8Array(cols * rows);
  let acc = 0;

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    cols = Math.max(10, Math.floor(r.width / CS));
    rows = Math.max(8, Math.floor(r.height / CS));
    canvas.width = cols * CS;
    canvas.height = rows * CS;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    grid = new Uint8Array(cols * rows);
    next = new Uint8Array(cols * rows);
    seed();
  };
  const seed = () => {
    for (let i = 0; i < grid.length; i++) grid[i] = Math.random() > 0.72 ? 1 : 0;
  };
  resize();

  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const cx = Math.floor(((e.clientX - r.left) / r.width) * cols);
    const cy = Math.floor(((e.clientY - r.top) / r.height) * rows);
    for (let y = -2; y <= 2; y++)
      for (let x = -2; x <= 2; x++) {
        const nx = (cx + x + cols) % cols;
        const ny = (cy + y + rows) % rows;
        grid[ny * cols + nx] = 1;
      }
    chip.blip();
  });

  const off = addTick((dt) => {
    acc += dt;
    if (acc < 110) return;
    acc = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            n += grid[((y + dy + rows) % rows) * cols + ((x + dx + cols) % cols)];
          }
        const alive = grid[y * cols + x];
        next[y * cols + x] = alive ? (n === 2 || n === 3 ? 1 : 0) : n === 3 ? 1 : 0;
      }
    }
    [grid, next] = [next, grid];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        if (!grid[y * cols + x]) continue;
        const age = (x * 7 + y * 13) % 3;
        ctx.fillStyle = age === 0 ? '#7ee081' : age === 1 ? '#3ddad7' : '#ffd23f';
        ctx.fillRect(x * CS + 1, y * CS + 1, CS - 2, CS - 2);
      }
  });
  window.addEventListener('resize', resize);
  return () => {
    off();
    window.removeEventListener('resize', resize);
  };
};

/** A fake spectrum analyser — pure maths, no microphone permission needed. */
const wave: Setup = (canvas) => {
  const ctx = canvas.getContext('2d')!;
  let w = 0;
  let h = 0;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const BARS = 42;
  const values = new Array(BARS).fill(0.1);
  let t = 0;
  let boost = 0;

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    w = r.width;
    h = r.height;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  canvas.addEventListener('click', () => {
    boost = 1;
    chip.select();
  });

  const off = addTick((dt) => {
    t += dt / 1000;
    boost *= 0.94;
    ctx.clearRect(0, 0, w, h);
    const bw = w / BARS;
    for (let i = 0; i < BARS; i++) {
      const base = 0.16 + 0.5 * Math.abs(Math.sin(t * 1.4 + i * 0.34)) * Math.abs(Math.sin(t * 0.6 + i * 0.11));
      const target = Math.min(1, base + boost * Math.abs(Math.sin(i * 0.5 + t * 6)));
      values[i] += (target - values[i]) * 0.28;
      const bh = Math.max(2, values[i] * (h - 12));
      const x = Math.round(i * bw);
      const y = Math.round(h - bh);
      ctx.fillStyle = values[i] > 0.72 ? '#ff5d73' : values[i] > 0.45 ? '#ffd23f' : '#3ddad7';
      ctx.fillRect(x + 1, y, Math.max(1, Math.round(bw) - 2), Math.round(bh));
      ctx.fillStyle = 'rgba(255,255,255,.16)';
      ctx.fillRect(x + 1, y + 3, Math.max(1, Math.round(bw) - 2), 2);
    }
  });
  window.addEventListener('resize', resize);
  return () => {
    off();
    window.removeEventListener('resize', resize);
  };
};

/** Procedural isometric terrain with a slowly drifting camera. */
const iso: Setup = (canvas) => {
  const ctx = canvas.getContext('2d')!;
  const TILE = 10;
  const N = 22;
  let w = 0;
  let h = 0;
  let t = 0;
  const heights: number[][] = [];
  for (let y = 0; y < N; y++) {
    heights.push([]);
    for (let x = 0; x < N; x++) {
      const v = Math.sin(x * 0.42) * Math.cos(y * 0.37) + Math.sin((x + y) * 0.21) * 1.4;
      heights[y].push(Math.round(v * 1.6));
    }
  }
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    w = r.width;
    h = r.height;
    canvas.width = Math.floor(w);
    canvas.height = Math.floor(h);
  };
  resize();

  const off = addTick((dt) => {
    t += dt / 1000;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h * 0.34 + Math.sin(t * 0.5) * 4);
    // painter's algorithm: back rows first
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const hh = heights[y][x];
        const sx = (x - y) * TILE;
        const sy = (x + y) * (TILE / 2) - hh * 3;
        const top = hh > 2 ? '#9ae66e' : hh > 0 ? '#7ee081' : hh > -2 ? '#3ddad7' : '#4a7fd4';
        const left = hh > 2 ? '#5fa84a' : hh > 0 ? '#4fa85e' : hh > -2 ? '#2a9aa0' : '#2f5694';
        // two side faces + a top rhombus
        ctx.fillStyle = left;
        ctx.beginPath();
        ctx.moveTo(sx, sy + TILE / 2);
        ctx.lineTo(sx + TILE, sy);
        ctx.lineTo(sx + TILE, sy + TILE / 2 + 3);
        ctx.lineTo(sx, sy + TILE + 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2b6f8a';
        ctx.beginPath();
        ctx.moveTo(sx, sy + TILE / 2);
        ctx.lineTo(sx - TILE, sy);
        ctx.lineTo(sx - TILE, sy + TILE / 2 + 3);
        ctx.lineTo(sx, sy + TILE + 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = top;
        ctx.beginPath();
        ctx.moveTo(sx, sy - TILE / 2);
        ctx.lineTo(sx + TILE, sy);
        ctx.lineTo(sx, sy + TILE / 2);
        ctx.lineTo(sx - TILE, sy);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  });
  window.addEventListener('resize', resize);
  return () => {
    off();
    window.removeEventListener('resize', resize);
  };
};

const SETUPS: Record<string, Setup> = { particles, life, wave, iso };

export function labPage(): View {
  return {
    title: '实验室 · VENTAOO',
    html: `
    <div class="page">
      <div class="page__inner">
        <header class="post-head">
          <h1 class="post-head__title">实验室</h1>
          <p class="muted" style="max-width:62ch">
            四个小玩具，全部跑在原生 Canvas 上。<b style="color:var(--a3)">点一点</b>它们 —— 每个都有反应。
          </p>
        </header>

        <div class="grid grid--2">
          ${labTiles
            .map(
              (t) => `<div class="lab-tile reveal" data-kind="${t.kind}">
            <canvas></canvas>
            <div class="lab-tile__glow"></div>
            <div class="lab-tile__in">
              <div class="lab-tile__t">${esc(t.title)}</div>
              <div class="lab-tile__d">${esc(t.desc)}</div>
              <div class="lab-tile__d" style="margin-top:8px;color:var(--a1);font-size:12px">${icon('sparkles', 12)} 点击交互</div>
            </div>
          </div>`,
            )
            .join('')}
        </div>

        <div class="panel reveal" style="margin-top:48px">
          <div class="panel__bar"><span class="dot"></span><span>NOTE</span></div>
          <div class="panel__body">
            <p class="muted" style="max-width:70ch">
              这些实验只在滚动到可见区域时才运行 —— 离开视口就会暂停，省电也省 CPU。
              如果你开启了系统的「减少动态效果」，它们会以极低帧率运行。
            </p>
          </div>
        </div>
      </div>
    </div>`,

    mount(root) {
      bindReveals(root);
      const teardowns: (() => void)[] = [];
      let started = 0;

      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const tile = e.target as HTMLElement;
            const canvas = tile.querySelector('canvas');
            if (!canvas) continue;
            if (e.isIntersecting && !tile.dataset.running) {
              tile.dataset.running = '1';
              const setup = SETUPS[tile.dataset.kind ?? ''];
              if (setup) {
                try {
                  teardowns.push(setup(canvas));
                  if (++started === labTiles.length) {
                    addXp(20, true);
                    unlock('explorer');
                    toast('实验室全开', '四个实验都在运行了', 'ach', 3000);
                  }
                } catch (err) {
                  console.error('[lab]', err);
                }
              }
            }
          }
        },
        { rootMargin: '120px' },
      );
      root.querySelectorAll('.lab-tile').forEach((t) => io.observe(t));

      if (reducedMotion) {
        // still mount, but the ticker already throttles animations globally
      }

      return () => {
        io.disconnect();
        teardowns.forEach((fn) => fn());
      };
    },
  };
}
