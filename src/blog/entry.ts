/** 随笔条目：日期 · 标题 · 摘要 · 标签，首页与列表页共用同一份标记。 */
import { esc } from '../core/dom';
import { dotted } from './frontmatter';
import type { Post } from './posts';

export function essayItem(p: Post): string {
  const tags = p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('');
  return `<li class="essay rv">
  <a class="essay__link" href="/blog/${esc(p.slug)}" data-link>
    <time class="essay__date" datetime="${esc(p.date)}">${dotted(p.date)}</time>
    <span class="essay__main">
      <span class="essay__title">${esc(p.title)}</span>
      <span class="essay__desc">${esc(p.summary)}</span>
    </span>
    <span class="essay__meta">${tags}<span class="essay__min">${p.reading} 分钟</span></span>
  </a>
</li>`;
}

export function essayList(list: Post[]): string {
  return `<ol class="feed">${list.map(essayItem).join('')}</ol>`;
}
