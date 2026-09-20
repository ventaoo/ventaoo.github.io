/** 首页 = 一本书的目录：书名，一篇一篇排下来，末尾是版权行。 */
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { tocList } from '../blog/entry';
import { posts } from '../blog/posts';
import type { View } from '../core/router';

/** 目录末尾那一行：关于、GitHub、Email、RSS，加上版权与地名。 */
function imprint(): string {
  const items = [
    { label: site.about.title, href: '/about', external: false },
    ...site.links.map((l) => ({
      label: l.label,
      href: l.href,
      external: l.href.startsWith('http'),
    })),
  ];
  const row = items
    .map(
      (l) =>
        `<a href="${esc(l.href)}"${l.external ? ' target="_blank" rel="noopener noreferrer"' : ' data-link'}>${esc(l.label)}</a>`,
    )
    .join('<span class="sep">·</span>');

  return `<div class="tocpage__foot rv">
    <nav class="tocpage__links" aria-label="关于本站">${row}</nav>
    <p class="tocpage__imprint">© ${new Date().getFullYear()} ${esc(site.name)} · ${esc(site.book.imprint)}</p>
  </div>`;
}

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
  ${imprint()}
</div>`,
  };
}
