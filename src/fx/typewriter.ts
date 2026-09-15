/**
 * Types a phrase out, holds it, then backspaces and moves on — the same rhythm
 * a person uses when they are thinking about what to say next.
 */
import { reducedMotion } from '../core/ticker';

export interface RotateOptions {
  typeMs?: number;
  holdMs?: number;
  eraseMs?: number;
}

export function rotateLines(el: HTMLElement, phrases: string[], opts: RotateOptions = {}): () => void {
  const { typeMs = 78, holdMs = 2600, eraseMs = 26 } = opts;

  if (!phrases.length) {
    el.textContent = '';
    return () => {};
  }
  if (reducedMotion || phrases.length === 1) {
    el.textContent = phrases[0];
    return () => {};
  }

  let phrase = 0;
  let char = 0;
  let erasing = false;
  let timer: number | undefined;
  let dead = false;

  const step = () => {
    if (dead) return;
    const text = phrases[phrase];

    if (!erasing) {
      char++;
      el.textContent = text.slice(0, char);
      if (char >= text.length) {
        erasing = true;
        timer = window.setTimeout(step, holdMs);
        return;
      }
      timer = window.setTimeout(step, typeMs + Math.random() * 70);
      return;
    }

    char -= 2;
    if (char <= 0) {
      el.textContent = '';
      erasing = false;
      char = 0;
      phrase = (phrase + 1) % phrases.length;
      timer = window.setTimeout(step, 420);
      return;
    }
    el.textContent = text.slice(0, char);
    timer = window.setTimeout(step, eraseMs);
  };

  timer = window.setTimeout(step, 520);
  return () => {
    dead = true;
    clearTimeout(timer);
  };
}
