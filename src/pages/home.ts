import type { View } from '../core/router';
import { icon } from '../core/icons';
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { posts } from '../blog/posts';
import { renderIndex } from '../blog/entry';
import { rotateLines } from '../fx/typewriter';
import { bindReveals } from '../fx/reveal';

export function homePage(): View {
  const latest = posts.slice(0, site.blog.latestOnHome);

  return {
    title: site.seo.title,
    html: `
    <div class="page">
      <section class="hero">
        <div class="shell">
          <p class="hero__overline label reveal">${esc(site.status)}</p>

          <h1 class="hero__name reveal" data-reveal-delay="60">
            ${esc(site.name)}${site.suffix ? `<em>${esc(site.suffix)}</em>` : ''}
          </h1>

          <p class="hero__statement reveal" data-reveal-delay="120">
            <span id="hero-line"></span><span class="hero__caret" aria-hidden="true"></span>
          </p>

          <p class="hero__bio reveal" data-reveal-delay="180">${esc(site.bio)}</p>

          <nav class="hero__links reveal" data-reveal-delay="240" aria-label="联系方式">
            ${site.links
              .map(
                (l) =>
                  `<a href="${esc(l.href)}"${/^https?:/.test(l.href) ? ' target="_blank" rel="noopener"' : ''}>` +
                  `${esc(l.label)}${/^https?:/.test(l.href) ? '<span class="ext" aria-hidden="true">↗</span>' : ''}</a>`,
              )
              .join('')}
          </nav>
        </div>
      </section>

      ${
        latest.length
          ? `<section class="sec">
        <div class="shell">
          <header class="sec-head reveal">
            <h2 class="sec-head__title">近作</h2>
            <span class="sec-head__rule"></span>
            <a class="sec-head__more" href="/blog" data-link>全部 ${posts.length} 篇 ${icon('arrowRight', 14)}</a>
          </header>
          <div class="index reveal">${renderIndex(latest, true)}</div>
        </div>
      </section>`
          : ''
      }
    </div>`,

    mount(root) {
      const line = root.querySelector<HTMLElement>('#hero-line');
      const stop = line ? rotateLines(line, [...site.lines]) : () => {};
      bindReveals(root);
      return stop;
    },
  };
}
