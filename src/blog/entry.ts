/** 目录行：编号 · 缩略图（可选）· 标题 · 虚线 · 日期 */
import { esc } from '../core/dom';
import { dotted } from './frontmatter';
import type { Post } from './posts';

export function tocRow(p: Post, index: number): string {
  return `<li>
  <a class="toc__row" href="/blog/${esc(p.slug)}" data-link>
    <span class="toc__no">${String(index + 1).padStart(2, '0')}</span>
    ${
      p.cover
        ? `<span class="toc__thumb"><img src="${esc(p.cover)}" alt="" loading="lazy" decoding="async" /></span>`
        : ''
    }
    <span class="toc__title">${esc(p.title)}</span>
    <span class="toc__leader" aria-hidden="true"></span>
    <time class="toc__date" datetime="${esc(p.date)}">${dotted(p.date)}</time>
  </a>
</li>`;
}

export function tocList(list: Post[], extraClass = ''): string {
  return `<ol class="toc${extraClass ? ' ' + extraClass : ''}">${list.map(tocRow).join('')}</ol>`;
}
