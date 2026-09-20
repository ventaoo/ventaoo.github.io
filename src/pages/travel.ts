/** 旅途：一趟一幅图版。 */
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { plate } from '../blog/entry';
import { tripStats, trips } from '../blog/travel';
import type { View } from '../core/router';

export function travelPage(): View {
  const stats = tripStats();

  return {
    title: `${site.travel.title} · ${site.name}`,
    html: `<article class="page">
  <div class="sheet">
    <header class="intro intro--page rv">
      <p class="intro__kicker">${esc(stats || '还没有记录')}</p>
      <h1 class="intro__title">${esc(site.travel.title)}</h1>
      <p class="intro__lead">${esc(site.travel.intro)}</p>
    </header>
    ${
      trips.length
        ? trips.map(plate).join('')
        : '<p class="empty">还没有出门的记录。<span class="empty__hint">下次回来就写。</span></p>'
    }
  </div>
</article>`,
  };
}
