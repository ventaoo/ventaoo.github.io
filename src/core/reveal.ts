/**
 * 显现系统：.rv 进入视口时淡入上移（500ms，短促、克制）。
 *
 * 用 rAF 节流的矩形判断，而不是 IntersectionObserver —— 快速滚动、锚点跳转
 * 或从历史记录回来时都不会漏掉元素，读到的东西永远不会卡在透明状态。
 * 没有 JS 时什么都不隐藏。
 */
import { $$, reducedMotion } from './dom';

const pending = new Set<HTMLElement>();
let listening = false;
let queued = false;

function show(el: HTMLElement): void {
  pending.delete(el);
  el.classList.add('in');
}

function sweep(): void {
  if (!pending.size) return;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  for (const el of [...pending]) {
    const r = el.getBoundingClientRect();
    // 已经进入视口，或者已经被滚过头顶 —— 两种都要显示
    if (r.top < vh * 0.94 || r.bottom <= 0) show(el);
  }
}

function schedule(): void {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    sweep();
  });
}

export function bindReveals(root: ParentNode = document): void {
  const nodes = $$<HTMLElement>('.rv', root as HTMLElement);
  if (!nodes.length) return;

  if (reducedMotion) {
    nodes.forEach((n) => n.classList.add('in'));
    return;
  }

  nodes.forEach((n, i) => {
    if (n.classList.contains('in')) return;
    if (!n.dataset.rvDelay) n.style.setProperty('--rv-delay', `${Math.min(i % 6, 5) * 60}ms`);
    pending.add(n);
  });

  if (!listening) {
    listening = true;
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
  }

  sweep(); // 立刻判断一次，之后两帧和图片加载完再各补一次
  requestAnimationFrame(sweep);
  window.setTimeout(sweep, 300);
}
