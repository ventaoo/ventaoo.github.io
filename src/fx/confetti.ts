/** Pixel confetti — 4x4 blocks of colour, because circles are not invited. */
import { addTick } from '../core/ticker';

interface Bit { x: number; y: number; vx: number; vy: number; s: number; c: string; life: number }

const COLORS = ['#ffd23f', '#ff5d73', '#3ddad7', '#a06cd5', '#7ee081', '#ff9f45'];
let bits: Bit[] = [];
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let dpr = 1;

function ensure(): CanvasRenderingContext2D | null {
  if (ctx) return ctx;
  canvas = document.getElementById('confetti') as HTMLCanvasElement | null;
  if (!canvas) return null;
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  return ctx;
}

function resize(): void {
  if (!canvas) return;
  dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
}

addTick((dt) => {
  if (!bits.length || !ctx || !canvas) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  const step = dt / 16.67;
  bits = bits.filter((b) => {
    b.vy += 0.35 * step;
    b.x += b.vx * step;
    b.y += b.vy * step;
    b.life -= dt;
    if (b.life <= 0 || b.y > innerHeight + 40) return false;
    ctx!.globalAlpha = Math.min(1, b.life / 400);
    ctx!.fillStyle = b.c;
    ctx!.fillRect(Math.round(b.x), Math.round(b.y), b.s, b.s);
    return true;
  });
  ctx.globalAlpha = 1;
  if (!bits.length) ctx.clearRect(0, 0, innerWidth, innerHeight);
});

export function burst(count = 120, originX = innerWidth / 2, originY = innerHeight / 2): void {
  if (!ensure()) return;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 9;
    bits.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      s: 4 + Math.floor(Math.random() * 3) * 2,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      life: 1400 + Math.random() * 1600,
    });
  }
}

export function rain(count = 80): void {
  if (!ensure()) return;
  for (let i = 0; i < count; i++) {
    bits.push({
      x: Math.random() * innerWidth,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 2,
      vy: 1 + Math.random() * 3,
      s: 4 + Math.floor(Math.random() * 3) * 2,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      life: 3000 + Math.random() * 1800,
    });
  }
}
