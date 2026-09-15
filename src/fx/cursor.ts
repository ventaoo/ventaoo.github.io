/** A crosshair pixel cursor with a trailing dot, plus a click "shockwave". */
import { addTick, reducedMotion } from '../core/ticker';

export function initCursor(): void {
  if (matchMedia('(hover: none)').matches || reducedMotion) return;
  if (matchMedia('(max-width: 900px)').matches) return;

  const ring = document.createElement('div');
  ring.className = 'pcursor';
  const dot = document.createElement('div');
  dot.className = 'pcursor-dot';
  document.body.append(ring, dot);
  document.body.classList.add('pixel-cursor');

  let mx = innerWidth / 2;
  let my = innerHeight / 2;
  let rx = mx;
  let ry = my;

  window.addEventListener(
    'pointermove',
    (ev) => {
      if (ev.pointerType !== 'mouse') return;
      mx = ev.clientX;
      my = ev.clientY;
    },
    { passive: true },
  );

  addTick(() => {
    // the crosshair snaps on a 4px grid — it is a pixel cursor after all
    rx += (mx - rx) * 0.55;
    ry += (my - ry) * 0.55;
    ring.style.transform = `translate(${Math.round(rx / 4) * 4}px, ${Math.round(ry / 4) * 4}px)`;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-3px,-3px)`;
  });

  const HOT = 'a,button,input,textarea,select,[data-hot],.card,.chip,.post-row,.lab-tile';
  document.addEventListener('pointerover', (ev) => {
    const t = ev.target as Element | null;
    const hot = !!t?.closest?.(HOT);
    ring.classList.toggle('is-hot', hot);
    dot.classList.toggle('is-hot', hot);
  });
}
