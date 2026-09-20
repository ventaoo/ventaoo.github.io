/** 首页：一句主张 + 最近写的 + 最近去过的。 */
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { essayList } from '../blog/entry';
import { dateRange } from '../blog/frontmatter';
import { posts } from '../blog/posts';
import { trips, type Trip } from '../blog/travel';
import type { View } from '../core/router';

function tripCard(t: Trip): string {
  return `<li class="tripcard rv">
  <a class="tripcard__link" href="/travel/${esc(t.slug)}" data-link>
    <span class="tripcard__thumb">
      ${t.cover ? `<img src="${esc(t.cover)}" alt="" loading="lazy" decoding="async" />` : '<span class="ph" aria-hidden="true"></span>'}
    </span>
    <span class="tripcard__body">
      <span class="tripcard__place">${esc(t.place)}</span>
      <span class="tripcard__title">${esc(t.title)}</span>
      <span class="tripcard__when">${dateRange(t.start, t.end)} · ${t.days} 天</span>
    </span>
  </a>
</li>`;
}

export function homePage(): View {
  const latest = posts.slice(0, site.home.latestCount);
  const recent = trips.slice(0, site.home.tripCount);
  const headline = site.hero.title.split('\n').map((line) => esc(line)).join('<br />');
  const actions = site.hero.actions
    .map((a, i) => `<a class="btn${i === 0 ? ' btn--solid' : ''}" href="${esc(a.href)}" data-link>${esc(a.label)}</a>`)
    .join('');

  return {
    title: site.seo.title,
    html: `<div class="home">
  <section class="hero">
    <p class="hero__eyebrow rv">${esc(site.hero.eyebrow)}</p>
    <h1 class="hero__title rv">${headline}</h1>
    <p class="hero__lead rv">${esc(site.hero.lead)}</p>
    <p class="hero__actions rv">${actions}</p>
  </section>

  <section class="band" aria-labelledby="band-latest">
    <header class="band__head rv">
      <h2 class="band__title" id="band-latest">${esc(site.home.latest.title)}</h2>
      <a class="band__more" href="/blog" data-link>${esc(site.home.latest.more)}<span data-icon="arrow" data-icon-size="14"></span></a>
    </header>
    ${latest.length ? essayList(latest) : '<p class="empty">还没有写下什么。第一篇正在路上。</p>'}
  </section>

  <section class="band" aria-labelledby="band-trips">
    <header class="band__head rv">
      <h2 class="band__title" id="band-trips">${esc(site.home.trips.title)}</h2>
      <a class="band__more" href="/travel" data-link>${esc(site.home.trips.more)}<span data-icon="arrow" data-icon-size="14"></span></a>
    </header>
    ${recent.length ? `<ul class="tripcards">${recent.map(tripCard).join('')}</ul>` : '<p class="empty">还没有出门的记录。</p>'}
  </section>
</div>`,
  };
}
