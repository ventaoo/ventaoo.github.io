/** 两种列表形态：随笔是目录行，旅途是图版。 */
import { esc } from '../core/dom';
import { dateRange, dotted } from './frontmatter';
import type { Post } from './posts';
import type { Trip } from './travel';

/** 目录行：编号 · 缩略图（可选）· 标题 · 虚线 · 日期 */
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

export function tocList(list: Post[]): string {
  return `<ol class="toc">${list.map(tocRow).join('')}</ol>`;
}

/** 图版：整幅照片，说明在下面 */
export function plate(t: Trip): string {
  return `<article class="plate rv">
  <a class="plate__link" href="/travel/${esc(t.slug)}" data-link>
    ${
      t.cover
        ? `<img src="${esc(t.cover)}" alt="" loading="lazy" decoding="async" />`
        : '<div class="plate__blank" aria-hidden="true"></div>'
    }
    <div class="plate__cap">
      <span>${esc(t.place)}</span>
      <span>${dateRange(t.start, t.end)} · ${t.days} 天</span>
    </div>
    <h3 class="plate__title">${esc(t.title)}</h3>
    <p class="plate__desc">${esc(t.summary)}</p>
  </a>
</article>`;
}
