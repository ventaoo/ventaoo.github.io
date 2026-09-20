/** 首页：一句话介绍 + 最近写的（一大两小）+ 最近去过的三张照片。 */
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { essayCard, tripCard } from '../blog/entry';
import { posts } from '../blog/posts';
import { trips } from '../blog/travel';
import type { View } from '../core/router';

export function homePage(): View {
  const [feature, ...rest] = posts.slice(0, 3);
  const recent = trips.slice(0, 3);
  const headline = site.hero.title.split('\n').map((line) => esc(line)).join('<br />');

  const actions = site.hero.actions
    .map(
      (a, i) =>
        `<a class="btn${i === 0 ? '' : ' btn--ghost'}" href="${esc(a.href)}" data-link>${esc(a.label)}<span data-icon="arrow" data-icon-size="15"></span></a>`,
    )
    .join('');

  const chips = site.hero.chips
    .map((c, i) => `<span class="chip${i === 0 ? ' chip--accent' : ''}">${esc(c)}</span>`)
    .join('');

  const essays = feature
    ? `<div class="bento">
  ${essayCard(feature, { feature: true })}
  <div class="bento__side">${rest.map((p) => essayCard(p, { compact: true })).join('')}</div>
</div>`
    : '<p class="empty">还没有写下什么，第一篇正在路上。</p>';

  return {
    title: site.seo.title,
    html: `<div class="home">
  <section class="hero">
    <div class="wash" aria-hidden="true"></div>
    <div class="shell">
      <div class="hero__inner">
        <div class="hero__id rv">
          ${
            site.hero.avatar
              ? `<span class="avatar avatar--photo"><img src="${esc(site.hero.avatar)}" alt="" decoding="async" /></span>`
              : '<span class="avatar" aria-hidden="true">V</span>'
          }
          <span class="hero__who">
            <b>${esc(site.hero.intro.greeting)}</b>
            ${esc(site.hero.intro.line)}
          </span>
        </div>
        <h1 class="hero__title rv">${headline}</h1>
        <p class="hero__lead rv">${esc(site.hero.lead)}</p>
        <div class="hero__chips rv">${chips}</div>
        <div class="hero__actions rv">${actions}</div>
      </div>
    </div>
  </section>

  <div class="shell">
    <section class="band">
      <header class="band__head rv">
        <h2 class="band__title">${esc(site.home.latest.title)}</h2>
        <a class="band__more" href="/blog" data-link>${esc(site.home.latest.more)}<span data-icon="arrow" data-icon-size="14"></span></a>
      </header>
      ${essays}
    </section>

    <section class="band">
      <header class="band__head rv">
        <h2 class="band__title">${esc(site.home.trips.title)}</h2>
        <a class="band__more" href="/travel" data-link>${esc(site.home.trips.more)}<span data-icon="arrow" data-icon-size="14"></span></a>
      </header>
      ${recent.length ? `<div class="tripgrid">${recent.map(tripCard).join('')}</div>` : '<p class="empty">还没有出门的记录。</p>'}
    </section>
  </div>
</div>`,
  };
}
