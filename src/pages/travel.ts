/** 旅途列表：一个地方一张卡，照片在前。 */
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { cardGrid, tripCard } from '../blog/entry';
import { tripStats, trips } from '../blog/travel';
import type { View } from '../core/router';

export function travelPage(): View {
  const stats = tripStats();

  return {
    title: `${site.travel.title} · ${site.name}`,
    html: `<article class="page">
  <div class="shell">
    <header class="page__head rv">
      <h1 class="page__title">${esc(site.travel.title)}</h1>
      <p class="page__intro">${esc(site.travel.intro)}</p>
      ${stats ? `<p class="page__note">${esc(stats)}</p>` : ''}
    </header>
    ${
      trips.length
        ? cardGrid(trips.map(tripCard), 'tripgrid--page')
        : '<p class="empty">还没有出门的记录。下次回来就写。</p>'
    }
  </div>
</article>`,
  };
}
