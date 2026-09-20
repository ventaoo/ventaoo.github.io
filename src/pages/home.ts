/** 首页 = 一本书的目录：书名，然后一篇一篇排下来。 */
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { tocList } from '../blog/entry';
import { posts } from '../blog/posts';
import type { View } from '../core/router';

export function homePage(): View {
  return {
    title: site.seo.title,
    html: `<div class="tocpage">
  <p class="book__by rv">${esc(site.name)}</p>
  <h1 class="book__title rv">${esc(site.book.title)}</h1>
  <p class="book__sub rv">${esc(site.book.subtitle)}</p>
  <div class="tocpage__label rv"><span>${esc(site.book.indexTitle)}</span></div>
  ${
    posts.length
      ? tocList(posts, 'toc--book')
      : `<p class="empty">${esc(site.book.empty)}</p>`
  }
</div>`,
  };
}
