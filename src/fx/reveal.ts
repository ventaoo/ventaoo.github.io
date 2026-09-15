/** IntersectionObserver-driven scroll reveals. */
import { $$, clamp } from '../core/dom';
import { reducedMotion } from '../core/ticker';

const observed = new WeakSet<Element>();
let io: IntersectionObserver | null = null;

function observer(): IntersectionObserver {
  if (io) return io;
  io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const delay = clamp(Number(el.dataset.revealDelay ?? 0), 0, 400);
        window.setTimeout(() => el.classList.add('in'), delay);
        io!.unobserve(el);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  return io;
}

/** Attach reveal behaviour to every `.reveal` element inside `root`. */
export function bindReveals(root: ParentNode = document): void {
  const nodes = $$<HTMLElement>('.reveal', root as HTMLElement).filter((n) => !observed.has(n));
  if (!nodes.length) return;
  nodes.forEach((n, i) => {
    observed.add(n);
    if (!n.dataset.revealDelay) n.dataset.revealDelay = String(Math.min(i % 6, 5) * 60);
  });
  if (reducedMotion) {
    nodes.forEach((n) => n.classList.add('in'));
    return;
  }
  const ob = observer();
  nodes.forEach((n) => ob.observe(n));
}
