/**
 * Cross-fades one phrase into the next. A fade reads as calm and intentional;
 * character-by-character typing reads as a machine warming up.
 */
import { reducedMotion } from '../core/ticker';

export interface RotateOptions {
  holdMs?: number;
  gapMs?: number;
}

export function rotateLines(el: HTMLElement, phrases: string[], opts: RotateOptions = {}): () => void {
  const { holdMs = 4600, gapMs = 1100 } = opts;

  if (!phrases.length) {
    el.textContent = '';
    return () => {};
  }
  el.textContent = phrases[0];

  if (reducedMotion || phrases.length === 1) return () => {};

  let index = 0;
  let timer: number | undefined;
  let dead = false;

  const swap = () => {
    if (dead) return;
    index = (index + 1) % phrases.length;
    el.textContent = phrases[index];
    // restart the entrance animation without a reflow-free hack
    el.classList.remove('line-swap');
    void el.offsetWidth;
    el.classList.add('line-swap');
    timer = window.setTimeout(swap, holdMs);
  };

  el.classList.add('line-swap');
  timer = window.setTimeout(swap, holdMs + 600);

  return () => {
    dead = true;
    clearTimeout(timer);
  };
}
