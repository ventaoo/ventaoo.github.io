import type { View } from '../core/router';
import { icon } from '../core/icons';
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { posts } from '../blog/posts';
import { renderIndex } from '../blog/entry';
import { photoRail } from './rail';
import { bindReveals } from '../fx/reveal';

export function homePage(): View {
  const latest = posts.slice(0, site.blog.latestOnHome);

  const links = site.links
    .map(
      (l) =>
        '<a href="' + esc(l.href) + '"' + (/^https?:/.test(l.href) ? ' target="_blank" rel="noopener"' : '') + '>' +
        esc(l.label) +
        '<span>' + (l.value ? esc(l.value) : '↗') + '</span></a>',
    )
    .join('');

  const intro = site.intro.map((p) => '<p>' + esc(p) + '</p>').join('');

  return {
    title: site.seo.title,
    html: [
      '<div class="page">',
      '  <div class="shell mag spread">',
      '    <div class="spread__main">',
      '      <h1 class="sr-only">' + esc(site.name) + ' · ' + esc(site.footerNote) + '</h1>',
      '      <div class="intro reveal">' + intro + '</div>',
      '      <div class="contact reveal" data-reveal-delay="80">',
      '        <span class="contact__t label">联系</span>',
      '        <div class="contact__links">' + links + '</div>',
      '      </div>',
      latest.length
        ? [
            '      <section class="sec">',
            '        <header class="sec-head reveal">',
            '          <span class="num">01</span>',
            '          <h2 class="sec-head__title">近作</h2>',
            '          <span class="sec-head__spacer"></span>',
            '          <a class="sec-head__more" href="/blog" data-link>全部 ' + posts.length + ' 篇 ' + icon('arrowRight', 14) + '</a>',
            '        </header>',
            '        <div class="wtable reveal">' + renderIndex(latest, { mini: true }) + '</div>',
            '      </section>',
          ].join('\n')
        : '',
      '    </div>',
      '    ' + photoRail(),
      '  </div>',
      '</div>',
    ].join('\n'),

    mount(root) {
      bindReveals(root);
    },
  };
}
