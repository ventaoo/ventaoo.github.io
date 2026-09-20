/** 昼 / 夜 双主题：默认是明亮的纸色，夜里可以切到暗色。 */
import { $, on } from './dom';
import { icon } from './icons';

export type Theme = 'day' | 'night';

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'night' ? 'night' : 'day';
}

function apply(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem('vx:theme', theme);
  } catch {
    /* private mode */
  }
  const glyph = $('#theme-glyph');
  if (glyph) glyph.innerHTML = icon(theme === 'day' ? 'moon' : 'sun', 16);
  const btn = $('#ctl-theme');
  if (btn) btn.setAttribute('aria-label', theme === 'day' ? '切换到暗色' : '切换到亮色');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'day' ? '#f7f5f0' : '#171a18');
}

export function initTheme(): void {
  apply(currentTheme()); // 与 index.html 内联脚本的首帧决定保持同步
  on($('#ctl-theme'), 'click', () => apply(currentTheme() === 'day' ? 'night' : 'day'));
}
