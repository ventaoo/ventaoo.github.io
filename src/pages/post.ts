/** 随笔正文：日期在页边，正文在中间。 */
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { dotted } from '../blog/frontmatter';
import { getPost, neighbours } from '../blog/posts';
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
    html: `<article class="article">
  <div class="sheet">
    <div class="article__grid">
      <aside class="article__aside">
        <a class="article__back" href="/" data-link>← ${esc(site.blog.back)}</a>
        <span><time datetime="${esc(post.date)}">${dotted(post.date)}</time></span>
        <span>${post.reading} 分钟</span>
        ${post.tags.map((t) => `<span>${esc(t)}</span>`).join('')}
      </aside>
      <div>
        <h1 class="article__title">${esc(post.title)}</h1>
        <p class="article__lead">${esc(post.summary)}</p>
        ${post.cover ? `<figure class="article__cover"><img src="${esc(post.cover)}" alt="" decoding="async" /></figure>` : ''}
        <div class="article__body prose">${html}</div>
        <div class="article__foot">
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
          <a class="backlink" href="/" data-link>← 回到${esc(site.blog.back)}</a>
        </div>
      </div>
    </div>
  </div>
</article>`,
    mount: (root) => bindCopy(root),
  };
}
