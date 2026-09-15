/** Multi-phrase typewriter with an authentic per-character blip. */
import { chip } from '../core/audio';
import { reducedMotion } from '../core/ticker';

export interface TypedOptions {
  phrases: string[];
  typeMs?: number;
  holdMs?: number;
  deleteMs?: number;
  sound?: boolean;
  cursor?: string;
}

export function typewriter(el: HTMLElement, opts: TypedOptions): () => void {
  const { phrases, typeMs = 55, holdMs = 1900, deleteMs = 26, sound = true } = opts;
  const cursor = `<span class="cur"></span>`;
  let phrase = 0;
  let char = 0;
  let deleting = false;
  let timer: number | undefined;
  let dead = false;

  if (reducedMotion) {
    el.innerHTML = phrases[0] + cursor;
    return () => {};
  }

  const render = () => {
    el.innerHTML = phrases[phrase].slice(0, char).replace(/</g, '&lt;') + cursor;
  };

  const step = () => {
    if (dead) return;
    const text = phrases[phrase];
    if (!deleting) {
      char++;
      if (sound && char % 2 === 0) chip.type();
      render();
      if (char >= text.length) {
        deleting = true;
        timer = window.setTimeout(step, holdMs);
        return;
      }
      timer = window.setTimeout(step, typeMs + Math.random() * 45);
    } else {
      char--;
      render();
      if (char <= 0) {
        deleting = false;
        phrase = (phrase + 1) % phrases.length;
        timer = window.setTimeout(step, 340);
        return;
      }
      timer = window.setTimeout(step, deleteMs);
    }
  };

  timer = window.setTimeout(step, 420);
  return () => {
    dead = true;
    clearTimeout(timer);
  };
}
