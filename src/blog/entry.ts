/** The archive table: one header row, then aligned rows. Flat, no year groups. */
import { esc } from '../core/dom';
import type { Post } from './posts';

const HEAD = [
  '<div class="whead" role="presentation">',
  '<span class="label">№</span>',
  '<span class="label">日期</span>',
  '<span class="label">标题</span>',
  '<span class="label">标签</span>',
  '</div>',
].join('');

function row(p: Post, n: number, mini: boolean): string {
  const tags = p.tags.slice(0, mini ? 1 : 3);
  return `<li class="wrow${mini ? ' wrow--mini' : ''}"
    data-tags="${esc(p.tags.join(' '))}"
    data-search="${esc((p.title + ' ' + p.summary + ' ' + p.tags.join(' ')).toLowerCase())}">
    <span class="wrow__n num">${String(n).padStart(2, '0')}</span>
    <time class="wrow__date label" datetime="${p.date}">${p.date.replace(/-/g, '.')}</time>
    <span class="wrow__body">
      <a class="wrow__title" href="/blog/${p.slug}" data-link>${esc(p.title)}</a>
      ${mini ? '' : `<span class="wrow__desc">${esc(p.summary)}</span>`}
    </span>
    <span class="wrow__tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</span>
  </li>`;
}

/** `header` renders the column labels once at the top of the table. */
export function renderIndex(list: Post[], opts: { mini?: boolean; header?: boolean } = {}): string {
  let n = 0;
  return (opts.header ? HEAD : '') + '<ol>' + list.map((p) => row(p, ++n, !!opts.mini)).join('') + '</ol>';
}
