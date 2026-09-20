/** 随笔索引：期号 + 日期 + 大号衬线标题 + 摘要 + 标签。 */
import { esc } from '../core/dom';
import type { Post } from './posts';

function row(p: Post, n: number, mini: boolean): string {
  const tags = p.tags.slice(0, mini ? 1 : 3);
  return `<li class="entry"
    data-tags="${esc(p.tags.join(' '))}"
    data-search="${esc((p.title + ' ' + p.summary + ' ' + p.tags.join(' ')).toLowerCase())}">
    <span class="entry__no">№ ${String(n).padStart(3, '0')}</span>
    <time class="entry__date" datetime="${p.date}">${p.date.replace(/-/g, '.')}</time>
    <span class="entry__body">
      <a class="entry__title" href="/blog/${p.slug}" data-link>${esc(p.title)}</a>
      ${mini ? '' : `<span class="entry__desc">${esc(p.summary)}</span>`}
      ${tags.length ? `<span class="entry__tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</span>` : ''}
    </span>
  </li>`;
}

export function renderIndex(list: Post[], opts: { mini?: boolean } = {}): string {
  let n = 0;
  return '<ol class="index">' + list.map((p) => row(p, ++n, !!opts.mini)).join('') + '</ol>';
}
