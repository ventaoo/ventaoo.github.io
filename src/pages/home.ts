import type { View } from '../core/router';
import { icon } from '../core/icons';
import { esc } from '../core/dom';
import { site, photos } from '../../site.config';
import { posts } from '../blog/posts';
import { renderIndex } from '../blog/entry';
import { rotateLines } from '../fx/typewriter';
import { bindReveals } from '../fx/reveal';

/** The layout rhythm is CSS-driven (see .photo:nth-child in pages.css). */
function photoSection(): string {
  if (!photos.length) return '';
  const figures = photos
    .map(
      (p, i) =>
        '<figure class="photo reveal">' +
        '<img src="' + esc(p.src) + '" alt="' + esc(p.alt ?? p.caption ?? '') + '" loading="lazy" decoding="async">' +
        (p.caption
          ? '<figcaption><span class="label idx">' + String(i + 1).padStart(2, '0') + '</span>' +
            '<span class="label">' + esc(p.caption) + '</span></figcaption>'
          : '') +
        '</figure>',
    )
    .join('');
  return '<section class="photos"><div class="shell"><div class="photos__grid">' + figures + '</div></div></section>';
}

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

  return {
    title: site.seo.title,
    html: [
      '<div class="page">',
      '  <section class="hero">',
      '    <div class="shell mag">',
      '      <h1 class="hero__statement reveal"><span id="hero-line"></span></h1>',
      '      <div class="hero__rail reveal" data-reveal-delay="90">',
      '        <span class="hero__rail-title label">联系</span>',
      '        <span class="tick"></span>',
      '        <div class="hero__links">' + links + '</div>',
      '      </div>',
      '      <p class="hero__lead reveal" data-reveal-delay="150">' + esc(site.bio) + '</p>',
      '    </div>',
      '  </section>',
      photoSection(),
      latest.length
        ? [
            '  <section class="sec">',
            '    <div class="shell">',
            '      <header class="sec-head reveal">',
            '        <span class="num">01</span>',
            '        <h2 class="sec-head__title">近作</h2>',
            '        <span class="sec-head__spacer"></span>',
            '        <a class="sec-head__more" href="/blog" data-link>全部 ' + posts.length + ' 篇 ' + icon('arrowRight', 14) + '</a>',
            '      </header>',
            '      <div class="wtable reveal">' + renderIndex(latest, true) + '</div>',
            '    </div>',
            '  </section>',
          ].join('\n')
        : '',
      '</div>',
    ].join('\n'),

    mount(root) {
      const line = root.querySelector<HTMLElement>('#hero-line');
      const stop = line ? rotateLines(line, [...site.lines]) : () => {};
      bindReveals(root);
      return stop;
    },
  };
}
