/** 夜 / 昼 双主题。初始主题由 index.html 的内联脚本在首帧前写入，默认夜。 */
import { $, on } from './dom';
import { icon } from './icons';

export type Theme = 'night' | 'day';

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'day' ? 'day' : 'night';
}

function apply(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem('vx:theme', theme);
  } catch {
    /* private mode */
  }
  const glyph = $('#theme-glyph');
  if (glyph) glyph.innerHTML = icon(theme === 'night' ? 'sun' : 'moon', 14);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'night' ? '#12100e' : '#f6f1e7');
}

export function initTheme(): void {
  apply(currentTheme()); // sync glyph + meta with the inline-script decision
  on($('#ctl-theme'), 'click', () => apply(currentTheme() === 'night' ? 'day' : 'night'));
}
