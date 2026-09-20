/** 卡片：随笔与旅途共用同一套卡片标记。 */
import { esc } from '../core/dom';
import { dateRange, dotted } from './frontmatter';
import type { Post } from './posts';
import type { Trip } from './travel';

export function essayCard(p: Post, opts: { feature?: boolean; compact?: boolean } = {}): string {
  const cls = ['card', opts.feature && 'card--feature', opts.compact && 'card--compact']
    .filter(Boolean)
    .join(' ');
  return `<a class="${cls} rv" href="/blog/${esc(p.slug)}" data-link>
  ${
    p.cover
      ? `<span class="card__media"><img src="${esc(p.cover)}" alt="" loading="lazy" decoding="async" /></span>`
      : ''
  }
  <span class="card__body">
    <span class="card__title">${esc(p.title)}</span>
    ${opts.compact ? '' : `<span class="card__desc">${esc(p.summary)}</span>`}
    <span class="card__meta">
      <time datetime="${esc(p.date)}">${dotted(p.date)}</time>
      ${p.tags.slice(0, 2).map((t) => `<span class="chip">${esc(t)}</span>`).join('')}
      <span>${p.reading} 分钟</span>
    </span>
  </span>
</a>`;
}

export function tripCard(t: Trip): string {
  return `<a class="card rv" href="/travel/${esc(t.slug)}" data-link>
  <span class="card__media">
    ${
      t.cover
        ? `<img src="${esc(t.cover)}" alt="" loading="lazy" decoding="async" />`
        : '<span class="ph" aria-hidden="true"></span>'
    }
    ${t.place ? `<span class="media-tag">${esc(t.place)}</span>` : ''}
  </span>
  <span class="card__body">
    <span class="card__title">${esc(t.title)}</span>
    <span class="card__desc">${esc(t.summary)}</span>
    <span class="card__meta">
      <time datetime="${esc(t.start)}">${dateRange(t.start, t.end)}</time>
      <span>${t.days} 天</span>
    </span>
  </span>
</a>`;
}

export function cardGrid(cards: string[], extraClass = ''): string {
  return `<div class="postgrid ${extraClass}">${cards.join('')}</div>`;
}
