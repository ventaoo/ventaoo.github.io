import { esc } from './dom';

const host = () => document.getElementById('toasts');

/** A quiet bottom-right note. Used only for preference changes. */
export function toast(title: string, desc = '', ms = 2400): void {
  const box = host();
  if (!box) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML =
    '<div class="toast__t">' + esc(title) + '</div>' +
    (desc ? '<div class="toast__d">' + esc(desc) + '</div>' : '');
  box.appendChild(el);

  const kill = () => {
    el.classList.add('is-out');
    window.setTimeout(() => el.remove(), 320);
  };
  const timer = window.setTimeout(kill, ms);
  el.addEventListener('click', () => {
    clearTimeout(timer);
    kill();
  });
}
