/** 首页：一句介绍，然后是一份目录和几幅图版。 */
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { plate, tocList } from '../blog/entry';
import { posts } from '../blog/posts';
import { trips } from '../blog/travel';
import type { View } from '../core/router';

export function homePage(): View {
  const latest = posts.slice(0, site.home.latestCount);
  const recent = trips.slice(0, site.home.tripCount);
  const headline = site.hero.title.split('\n').map((line) => esc(line)).join('<br />');

  return {
    title: site.seo.title,
    html: `<div class="home">
  <div class="sheet">
    <section class="intro rv">
      <p class="intro__kicker">${esc(site.tagline)}</p>
      <h1 class="intro__title">${headline}</h1>
      <p class="intro__lead">${esc(site.hero.lead)}</p>
      ${site.hero.now ? `<p class="intro__now"><span class="dot"></span>${esc(site.hero.now)}</p>` : ''}
    </section>

    <section class="block">
      <div class="cols">
        <h2 class="cols__label">${esc(site.home.latest.title)}</h2>
        <div class="cols__main">
          ${latest.length ? tocList(latest) : '<p class="empty">还没有写下的。第一篇正在路上。</p>'}
          <p class="block__more"><a href="/blog" data-link>${esc(site.home.latest.more)}</a></p>
        </div>
      </div>
    </section>

    <section class="block">
      <div class="cols">
        <h2 class="cols__label">${esc(site.home.trips.title)}</h2>
        <div class="cols__main">
          ${recent.length ? recent.map(plate).join('') : '<p class="empty">还没有出门的记录。<span class="empty__hint">去过的地方会一趟一趟排在这里。</span></p>'}
          <p class="block__more"><a href="/travel" data-link>${esc(site.home.trips.more)}</a></p>
        </div>
      </div>
    </section>
  </div>
</div>`,
  };
}
