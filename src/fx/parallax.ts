/**
 * Scroll parallax + pointer tilt.
 *
 *   <div data-px="0.25">      translateY(-scrollY * 0.25)
 *   <div data-px-x="-0.1">    translateX(scrollY * -0.1)
 *   <div data-tilt="8">       subtle 3D tilt following the pointer
 *   <div data-mouse="0.05">   drifts with the pointer for depth
 */
import { $$ } from '../core/dom';
import { addTick, reducedMotion } from '../core/ticker';

interface PxNode { el: HTMLElement; y: number; x: number; smooth: number; cur: number; target: number }
interface TiltNode { el: HTMLElement; amount: number }
interface MouseNode { el: HTMLElement; amount: number }

let pxNodes: PxNode[] = [];
let tiltNodes: TiltNode[] = [];
let mouseNodes: MouseNode[] = [];
let viewportH = innerHeight;
let maxScroll = 1;

export function bindParallax(root: ParentNode = document): void {
  const scope = root as HTMLElement;
  pxNodes = $$<HTMLElement>('[data-px], [data-px-x]', scope).map((el) => ({
    el,
    y: Number(el.dataset.px ?? 0),
    x: Number(el.dataset.pxX ?? 0),
    smooth: Number(el.dataset.pxSmooth ?? 0),
    cur: 0,
    target: 0,
  }));
  tiltNodes = $$<HTMLElement>('[data-tilt]', scope).map((el) => ({ el, amount: Number(el.dataset.tilt) || 8 }));
  mouseNodes = $$<HTMLElement>('[data-mouse]', scope).map((el) => ({ el, amount: Number(el.dataset.mouse) || 0.04 }));

  tiltNodes.forEach(({ el }) => {
    el.style.transformStyle = 'preserve-3d';
    el.style.transition = 'transform 240ms cubic-bezier(.2,.9,.3,1.4)';
    el.addEventListener('pointermove', (ev) => {
      if (ev.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const nx = (ev.clientX - r.left) / r.width - 0.5;
      const ny = (ev.clientY - r.top) / r.height - 0.5;
      const a = tiltNodes.find((t) => t.el === el)?.amount ?? 8;
      el.style.transform = `perspective(700px) rotateY(${(nx * a).toFixed(2)}deg) rotateX(${(-ny * a).toFixed(2)}deg) translateZ(6px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = '';
    });
  });
}

function measure(): void {
  viewportH = innerHeight;
  maxScroll = Math.max(1, document.documentElement.scrollHeight - viewportH);
}

window.addEventListener('resize', measure);

let pointerX = 0;
let pointerY = 0;
window.addEventListener(
  'pointermove',
  (ev) => {
    pointerX = (ev.clientX / innerWidth - 0.5) * 2;
    pointerY = (ev.clientY / viewportH - 0.5) * 2;
  },
  { passive: true },
);

addTick((_dt, _t, scrollY) => {
  if (!pxNodes.length && !mouseNodes.length) return;
  if (!maxScroll || document.documentElement.scrollHeight - viewportH !== maxScroll) measure();

  for (const n of pxNodes) {
    const target = scrollY * n.y;
    n.cur = n.smooth > 0 ? n.cur + (target - n.cur) * Math.min(1, n.smooth) : target;
    const tx = scrollY * n.x;
    if (n.y !== 0 || n.x !== 0) {
      n.el.style.transform = `translate3d(${tx.toFixed(2)}px, ${(-n.cur).toFixed(2)}px, 0)`;
    }
  }

  if (!reducedMotion) {
    for (const m of mouseNodes) {
      m.el.style.transform = `translate3d(${(pointerX * m.amount * 100).toFixed(2)}px, ${(pointerY * m.amount * 100).toFixed(2)}px, 0)`;
    }
  }
});

/** 0 → 1 progress through the whole document. */
export function pageProgress(scrollY: number): number {
  return Math.max(0, Math.min(1, scrollY / maxScroll));
}
