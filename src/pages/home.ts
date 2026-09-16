import type { View } from '../core/router';
import { icon } from '../core/icons';
import { esc } from '../core/dom';
import { site, photos } from '../../site.config';
import { posts } from '../blog/posts';
import { renderIndex } from '../blog/entry';
import { rotateLines } from '../fx/typewriter';
import { bindReveals } from '../fx/reveal';

function photoGrid(): string {
  if (!photos.length) return '';
  return (
    '<div class="photos">' +
    photos
      .map((p) => {
        const span = p.span ?? 4;
        return (
          '<figure class="photo photo--' + span + ' reveal">' +
          '<img src="' + esc(p.src) + '" alt="' + esc(p.alt ?? p.caption ?? '') + '" loading="lazy" decoding="async">' +
          (p.caption ? '<figcaption><span class="label">' + esc(p.caption) + '</span></figcaption>' : '') +
          '</figure>'
        );
      })
      .join('') +
    '</div>'
  );
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
      '    <div class="shell hero__grid">',
      '      <div class="hero__meta reveal">',
      '        <div class="hero__meta-block">',
      '          <p class="label">联系</p>',
      '          <div class="hero__links">' + links + '</div>',
      '        </div>',
      '      </div>',
      '      <div class="hero__main">',
      '        <h1 class="hero__statement reveal"><span id="hero-line"></span></h1>',
      '        <p class="hero__lead reveal" data-reveal-delay="90">' + esc(site.bio) + '</p>',
      '      </div>',
      '    </div>',
      '  </section>',
      photoGrid(),
      latest.length
        ? [
            '  <section class="sec">',
            '    <div class="shell">',
            '      <header class="sec-head reveal">',
            '        <span class="num">01</span>',
            '        <h2 class="sec-head__title">近作</h2>',
            '        <span class="sec-head__rule"></span>',
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
