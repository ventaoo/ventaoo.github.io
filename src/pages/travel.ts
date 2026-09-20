/** 旅途列表：一条时间轴，从最近的一趟往回排。 */
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { dateRange } from '../blog/frontmatter';
import { tripStats, tripsByYear, type Trip } from '../blog/travel';
import type { View } from '../core/router';

function item(t: Trip): string {
  return `<li class="tl-item rv">
  <a class="tl-item__link" href="/travel/${esc(t.slug)}" data-link>
    <span class="tl-item__when">
      <time datetime="${esc(t.start)}">${dateRange(t.start, t.end)}</time>
      <span class="tl-item__days">${t.days} 天</span>
    </span>
    <span class="tl-item__thumb">
      ${t.cover ? `<img src="${esc(t.cover)}" alt="" loading="lazy" decoding="async" />` : '<span class="ph" aria-hidden="true"></span>'}
    </span>
    <span class="tl-item__body">
      ${t.place ? `<span class="tl-item__place"><span data-icon="pin" data-icon-size="14"></span>${esc(t.place)}</span>` : ''}
      <span class="tl-item__title">${esc(t.title)}</span>
      <span class="tl-item__desc">${esc(t.summary)}</span>
    </span>
  </a>
</li>`;
}

export function travelPage(): View {
  const groups = tripsByYear();
  const body = groups.length
    ? groups
        .map(
          (g) => `<section class="tl-year">
  <h2 class="tl-year__label rv">${esc(g.year)}</h2>
  <ol class="tl-list">${g.items.map(item).join('')}</ol>
</section>`,
        )
        .join('')
    : '<p class="empty">还没有出门的记录。下次回来就写。</p>';

  return {
    title: `${site.travel.title} · ${site.name}`,
    html: `<article class="page">
  <header class="page__head rv">
    <p class="kicker">旅途</p>
    <h1 class="page__title">${esc(site.travel.title)}</h1>
    <p class="page__intro">${esc(site.travel.intro)}</p>
    ${tripStats() ? `<p class="page__note">${esc(tripStats())}</p>` : ''}
  </header>
  <div class="timeline">${body}</div>
</article>`,
  };
}
