/**
 * 显现系统：.rv 整块淡入上移（150–250ms，短促精确）。
 * 渐进而非门槛：没有 JS 时没有任何东西被隐藏。
 */
import { $$, reducedMotion } from './dom';

const observed = new WeakSet<Element>();
let io: IntersectionObserver | null = null;

function observer(): IntersectionObserver {
  if (io) return io;
  io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const delay = Number(el.dataset.rvDelay ?? 0);
        window.setTimeout(() => el.classList.add('in'), delay);
        io!.unobserve(el);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  );
  return io;
}

/** 给 root 内所有 .rv 绑定显现。 */
export function bindReveals(root: ParentNode = document): void {
  const nodes = $$<HTMLElement>('.rv', root as HTMLElement).filter((n) => !observed.has(n));
  if (!nodes.length) return;
  nodes.forEach((n, i) => {
    observed.add(n);
    if (!n.dataset.rvDelay) n.style.setProperty('--rv-delay', `${Math.min(i % 6, 5) * 50}ms`);
  });
  if (reducedMotion) {
    nodes.forEach((n) => n.classList.add('in'));
    return;
  }
  const ob = observer();
  nodes.forEach((n) => ob.observe(n));
}
