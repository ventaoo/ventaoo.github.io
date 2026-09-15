/**
 * Pointer drift, scroll drift, and a gentle fade-out — small, slow, optional.
 *
 *   <div data-drift="0.06">        rises slightly as you scroll
 *   <div data-drift="0.1" data-fade>   …and fades out over the first 620px
 *   <div data-mouse="0.02">        drifts a few pixels with the pointer
 */
import { $$ } from '../core/dom';
import { addTick, reducedMotion } from '../core/ticker';

interface Drift { el: HTMLElement; amount: number; fade: boolean }
interface Mouse { el: HTMLElement; amount: number }

let drifts: Drift[] = [];
let mouses: Mouse[] = [];
let px = 0;
let py = 0;

export function bindParallax(root: ParentNode = document): void {
  const scope = root as HTMLElement;
  drifts = $$<HTMLElement>('[data-drift]', scope).map((el) => ({
    el,
    amount: Number(el.dataset.drift) || 0.04,
    fade: el.hasAttribute('data-fade'),
  }));
  mouses = $$<HTMLElement>('[data-mouse]', scope).map((el) => ({ el, amount: Number(el.dataset.mouse) || 0.02 }));
}

window.addEventListener(
  'pointermove',
  (ev) => {
    if (ev.pointerType !== 'mouse') return;
    px = (ev.clientX / innerWidth - 0.5) * 2;
    py = (ev.clientY / innerHeight - 0.5) * 2;
  },
  { passive: true },
);

addTick((_dt, _t, scrollY) => {
  if (reducedMotion) return;
  for (const d of drifts) {
    d.el.style.transform = 'translate3d(0,' + (-scrollY * d.amount).toFixed(2) + 'px,0)';
    if (d.fade) d.el.style.opacity = String(Math.max(0, 1 - scrollY / 620));
  }
  for (const m of mouses) {
    m.el.style.transform =
      'translate3d(' + (px * m.amount * 100).toFixed(2) + 'px,' + (py * m.amount * 100).toFixed(2) + 'px,0)';
  }
});
