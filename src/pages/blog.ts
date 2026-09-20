/** 随笔列表：按年份归档，一条一条读得下去。 */
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { essayList } from '../blog/entry';
import { posts, postsByYear } from '../blog/posts';
import type { View } from '../core/router';

export function blogPage(): View {
  const groups = postsByYear();
  const body = groups.length
    ? groups
        .map(
          (g) => `<section class="yearblock">
  <h2 class="yearblock__year rv">${esc(g.year)}</h2>
  ${essayList(g.items)}
</section>`,
        )
        .join('')
    : '<p class="empty">这里还空着。等一个值得写下下午。</p>';

  return {
    title: `${site.blog.title} · ${site.name}`,
    html: `<article class="page">
  <header class="page__head rv">
    <p class="kicker">随笔</p>
    <h1 class="page__title">${esc(site.blog.title)}</h1>
    <p class="page__intro">${esc(site.blog.intro)}</p>
    <p class="page__note">${posts.length} 篇</p>
  </header>
  <div class="page__body">${body}</div>
</article>`,
  };
}
