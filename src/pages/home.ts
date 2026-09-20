/**
 * 首页 = 一本书的目录。
 * 页面上只有三样东西：书名、一行行条目、末尾一行联系方式。
 * 没有站点名、没有「目录」二字、没有任何标签 —— 结构本身就是目录。
 */
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { tocList } from '../blog/entry';
import { posts } from '../blog/posts';
import type { View } from '../core/router';

/** 末尾那一行：关于、GitHub、Email、RSS，加一行版权。 */
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
    <p class="tocpage__imprint">© ${new Date().getFullYear()} · ${esc(site.book.imprint)}</p>
  </div>`;
}

export function homePage(): View {
  return {
    title: site.seo.title,
    html: `<div class="tocpage">
  <h1 class="book__title rv">${esc(site.book.title)}</h1>
  ${
    posts.length
      ? tocList(posts, 'toc--book')
      : `<p class="empty">${esc(site.book.empty)}</p>`
  }
  ${imprint()}
</div>`,
  };
}
