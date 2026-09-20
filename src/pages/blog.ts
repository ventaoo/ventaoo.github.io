/** 随笔：按年份分成几份目录。 */
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { tocList } from '../blog/entry';
import { posts, postsByYear } from '../blog/posts';
import type { View } from '../core/router';

export function blogPage(): View {
  const groups = postsByYear();

  return {
    title: `${site.blog.title} · ${site.name}`,
    html: `<article class="page">
  <div class="sheet">
    <header class="intro intro--page rv">
      <p class="intro__kicker">${posts.length} 篇</p>
      <h1 class="intro__title">${esc(site.blog.title)}</h1>
      <p class="intro__lead">${esc(site.blog.intro)}</p>
    </header>
    ${
      groups.length
        ? groups
            .map(
              (g) => `<section class="block">
      <div class="cols">
        <h2 class="cols__label">${esc(g.year)}</h2>
        <div class="cols__main">${tocList(g.items)}</div>
      </div>
    </section>`,
            )
            .join('')
        : '<p class="empty">这里还空着。等一个值得写下的下午。</p>'
    }
  </div>
</article>`,
  };
}
