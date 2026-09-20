/** 旅途故事页：封面、时间地点、照片与文字。 */
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { dateRange } from '../blog/frontmatter';
import { getTrip, tripNeighbours } from '../blog/travel';
import { bindProgress } from '../core/progress';
import type { Ctx, View } from '../core/router';
import { missingPage } from './missing';

export async function tripPage(ctx: Ctx): Promise<View> {
  const trip = getTrip(ctx.params.slug);
  if (!trip) return missingPage('这趟旅行', '回到旅途', '/travel');

  const { renderMarkdown, bindCopy } = await import('../blog/markdown');
  const { html } = renderMarkdown(trip.body);
  const { newer, older } = tripNeighbours(trip.slug);

  return {
    title: `${trip.title} · ${site.name}`,
    html: `<div class="progress" aria-hidden="true"></div>
<article class="story">
  <header class="story__head rv">
    <p class="eyebrow">${esc(trip.place)}</p>
    <h1 class="story__title">${esc(trip.title)}</h1>
    <p class="story__meta">
      <time datetime="${esc(trip.start)}">${dateRange(trip.start, trip.end)}</time>
      <span class="sep">·</span>${trip.days} 天
      <span class="sep">·</span>${trip.reading} 分钟
    </p>
    <p class="story__lead">${esc(trip.summary)}</p>
  </header>
  ${trip.cover ? `<figure class="story__cover rv"><img src="${esc(trip.cover)}" alt="${esc(trip.title)}" decoding="async" /></figure>` : ''}
  <div class="prose prose--story rv">${html}</div>
  <footer class="story__foot">
    <nav class="pager" aria-label="相邻的旅途">
      ${
        newer
          ? `<a class="pager__item" href="/travel/${esc(newer.slug)}" data-link>
        <span class="pager__label">更近的一趟</span>
        <span class="pager__title">${esc(newer.title)}</span>
      </a>`
          : '<span class="pager__item pager__item--none"></span>'
      }
      ${
        older
          ? `<a class="pager__item pager__item--next" href="/travel/${esc(older.slug)}" data-link>
        <span class="pager__label">更早的一趟</span>
        <span class="pager__title">${esc(older.title)}</span>
      </a>`
          : '<span class="pager__item pager__item--none"></span>'
      }
    </nav>
    <a class="backlink" href="/travel" data-link><span data-icon="arrow" data-icon-size="14"></span>回到旅途</a>
  </footer>
</article>`,
    mount: (root) => {
      bindCopy(root);
      return bindProgress(root);
    },
  };
}
