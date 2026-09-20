/** 随笔列表：按年份分组，一组卡片。 */
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { cardGrid, essayCard } from '../blog/entry';
import { posts, postsByYear } from '../blog/posts';
import type { View } from '../core/router';

export function blogPage(): View {
  const groups = postsByYear();
  const body = groups.length
    ? groups
        .map(
          (g) => `<section class="yeargroup">
  <h2 class="yeargroup__label rv">${esc(g.year)}</h2>
  ${cardGrid(g.items.map((p) => essayCard(p)))}
</section>`,
        )
        .join('')
    : '<p class="empty">这里还空着。等一个值得写下的下午。</p>';

  return {
    title: `${site.blog.title} · ${site.name}`,
    html: `<article class="page">
  <div class="shell">
    <header class="page__head rv">
      <h1 class="page__title">${esc(site.blog.title)}</h1>
      <p class="page__intro">${esc(site.blog.intro)}</p>
      <p class="page__note">${posts.length} 篇</p>
    </header>
    ${body}
  </div>
</article>`,
  };
}
