import type { View } from '../core/router';
import { icon } from '../core/icons';
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { posts } from '../blog/posts';
import { renderIndex } from '../blog/entry';

export function homePage(): View {
  const latest = posts.slice(0, site.blog.latestOnHome);

  const links = site.links
    .map(
      (l) =>
        '<a href="' + esc(l.href) + '"' + (/^https?:/.test(l.href) ? ' target="_blank" rel="noopener"' : '') + '>' +
        '<span class="contact__k">' + esc(l.label) + '</span>' +
        '<span class="contact__v">' + esc(l.value) + '</span>' +
        '<span class="contact__arrow">' + icon('arrowRight', 14) + '</span></a>',
    )
    .join('');

  return {
    title: site.seo.title,
    html: [
      '<div class="page">',
      '  <div class="shell">',
      '    <section class="cover">',
      '      <p class="cover__kicker mono mono--amber rv">' + esc(site.kicker) + '</p>',
      '      <h1 class="cover__name rv">' + esc(site.name) + '</h1>',
      '      <p class="cover__lead rv">' + esc(site.lead) + '</p>',
      '      <p class="cover__meta rv"><span class="mono">' + esc(site.tagline) + '</span><span class="mono">共 ' + posts.length + ' 篇</span></p>',
      '    </section>',
      latest.length
        ? [
            '    <section class="sec">',
            '      <header class="sec-head rv">',
            '        <h2 class="sec-head__title">近作</h2>',
            '        <span class="sec-head__spacer"></span>',
            '        <a class="sec-head__more" href="/blog" data-link>全部 ' + posts.length + ' 篇 ' + icon('arrowRight', 13) + '</a>',
            '      </header>',
            '      <div class="rv">' + renderIndex(latest, { mini: true }) + '</div>',
            '    </section>',
          ].join('\n')
        : '',
      '    <section class="sec">',
      '      <header class="sec-head rv">',
      '        <h2 class="sec-head__title">联系</h2>',
      '        <span class="sec-head__spacer"></span>',
      '      </header>',
      '      <div class="contact__links rv">' + links + '</div>',
      '    </section>',
      '  </div>',
      '</div>',
    ].join('\n'),
  };
}
