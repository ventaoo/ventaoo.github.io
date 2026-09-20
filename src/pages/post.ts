/** 随笔正文页：读起来舒服，读完能接着读下一篇。 */
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { dotted } from '../blog/frontmatter';
import { getPost, neighbours } from '../blog/posts';
import { bindProgress } from '../core/progress';
import type { Ctx, View } from '../core/router';
import { missingPage } from './missing';

export async function postPage(ctx: Ctx): Promise<View> {
  const post = getPost(ctx.params.slug);
  if (!post) return missingPage('这篇文章', '回到随笔', '/blog');

  // marked 与 highlight.js 只在打开文章时才加载
  const { renderMarkdown, bindCopy } = await import('../blog/markdown');
  const { html } = renderMarkdown(post.body);
  const { prev, next } = neighbours(post.slug);

  return {
    title: `${post.title} · ${site.name}`,
    html: `<div class="progress" aria-hidden="true"></div>
<article class="article">
  <header class="article__head rv">
    <p class="article__meta">
      <time datetime="${esc(post.date)}">${dotted(post.date)}</time>
      <span class="sep">·</span>${post.reading} 分钟
      ${post.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}
    </p>
    <h1 class="article__title">${esc(post.title)}</h1>
    <p class="article__lead">${esc(post.summary)}</p>
  </header>
  ${post.cover ? `<figure class="article__cover rv"><img src="${esc(post.cover)}" alt="" decoding="async" /></figure>` : ''}
  <div class="prose rv">${html}</div>
  <footer class="article__foot">
    <nav class="pager" aria-label="相邻的文章">
      ${
        prev
          ? `<a class="pager__item" href="/blog/${esc(prev.slug)}" data-link>
        <span class="pager__label">更早一篇</span>
        <span class="pager__title">${esc(prev.title)}</span>
      </a>`
          : '<span class="pager__item pager__item--none"></span>'
      }
      ${
        next
          ? `<a class="pager__item pager__item--next" href="/blog/${esc(next.slug)}" data-link>
        <span class="pager__label">更新一篇</span>
        <span class="pager__title">${esc(next.title)}</span>
      </a>`
          : '<span class="pager__item pager__item--none"></span>'
      }
    </nav>
    <a class="backlink" href="/blog" data-link><span data-icon="arrow" data-icon-size="14"></span>回到随笔</a>
  </footer>
</article>`,
    mount: (root) => {
      bindCopy(root);
      return bindProgress(root);
    },
  };
}
