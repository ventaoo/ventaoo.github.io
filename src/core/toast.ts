import { icon } from './icons';
import { esc } from './dom';

const host = () => document.getElementById('toasts');

export function toast(title: string, desc = '', kind: 'info' | 'ach' | 'error' = 'info', ms = 3600): void {
  const box = host();
  if (!box) return;
  const el = document.createElement('div');
  el.className = 'toast' + (kind === 'ach' ? ' toast--ach' : '');
  const ico = kind === 'ach' ? 'star' : kind === 'error' ? 'bug' : 'info-box';
  el.innerHTML = `<span class="toast__ico">${icon(ico, 18)}</span>
    <div><div class="toast__t">${esc(title)}</div>${desc ? `<div class="toast__d">${esc(desc)}</div>` : ''}</div>`;
  box.appendChild(el);
  const kill = () => {
    el.classList.add('is-out');
    setTimeout(() => el.remove(), 280);
  };
  const timer = window.setTimeout(kill, ms);
  el.addEventListener('click', () => {
    clearTimeout(timer);
    kill();
  });
}
