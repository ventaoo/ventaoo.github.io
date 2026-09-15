import { icon } from './icons';
import { esc } from './dom';

const host = () => document.getElementById('toasts');

/** A small bottom-right notice. Used sparingly — for preference changes only. */
export function toast(title: string, desc = '', ms = 2600): void {
  const box = host();
  if (!box) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML =
    '<span class="toast__ico">' + icon('info-box', 16) + '</span>' +
    '<div><div class="toast__t">' + esc(title) + '</div>' +
    (desc ? '<div class="toast__d">' + esc(desc) + '</div>' : '') +
    '</div>';
  box.appendChild(el);

  const kill = () => {
    el.classList.add('is-out');
    window.setTimeout(() => el.remove(), 240);
  };
  const timer = window.setTimeout(kill, ms);
  el.addEventListener('click', () => {
    clearTimeout(timer);
    kill();
  });
}
