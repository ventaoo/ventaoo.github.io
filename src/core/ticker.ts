/**
 * One requestAnimationFrame loop for the entire site. Every animated subsystem
 * subscribes here instead of spawning its own rAF, which keeps the frame budget
 * predictable and lets us pause everything when the tab is hidden.
 */
export type Tick = (dt: number, elapsed: number, scrollY: number) => void;

const subs = new Set<Tick>();
let running = false;
let last = 0;
let elapsed = 0;
let scrollY = window.scrollY;

export const reducedMotion =
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function frame(now: number) {
  if (!running) return;
  const dt = Math.min(now - last, 64);
  last = now;
  elapsed += dt;
  scrollY = window.scrollY;
  for (const fn of subs) {
    try {
      fn(dt, elapsed, scrollY);
    } catch (err) {
      console.error('[ticker] subscriber failed', err);
      subs.delete(fn);
    }
  }
  requestAnimationFrame(frame);
}

function start() {
  if (running) return;
  running = true;
  last = performance.now();
  requestAnimationFrame(frame);
}

export function addTick(fn: Tick): () => void {
  subs.add(fn);
  start();
  return () => subs.delete(fn);
}

export function currentScroll(): number {
  return scrollY;
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    running = false;
  } else if (subs.size) {
    start();
  }
});
