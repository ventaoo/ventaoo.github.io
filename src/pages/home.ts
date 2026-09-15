import type { View } from '../core/router';
import { icon } from '../core/icons';
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { posts } from '../blog/posts';
import { typewriter } from '../fx/typewriter';
import { bindReveals } from '../fx/reveal';

const shortDate = (iso: string) => iso.slice(5);

function miniRow(p: (typeof posts)[number]): string {
  return `<a class="post-row post-row--mini" href="/blog/${p.slug}" data-link>
    <time class="post-row__date">${shortDate(p.date)}</time>
    <span class="post-row__title">${esc(p.title)}</span>
    <span class="post-row__tags">${p.tags.slice(0, 1).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</span>
    <span class="post-row__arrow">${icon('arrow-bar-right', 12)}</span>
  </a>`;
}

export function homePage(): View {
  const latest = posts.slice(0, site.blog.latestOnHome);

  return {
    title: site.seo.title,
    html: `
    <div class="page">
      <section class="hero">
        <div class="shell">
          <p class="hero__status reveal"><i></i>${esc(site.status)}</p>

          <h1 class="hero__name" data-mouse="0.018">
            <span>${esc(site.name)}</span>${site.suffix ? `<em>${esc(site.suffix)}</em>` : ''}
          </h1>

          <div class="hero__lines reveal" data-reveal-delay="60">
            <span class="hero__caret" aria-hidden="true">▸</span>
            <p class="hero__typed" id="hero-typed" aria-live="polite"></p>
          </div>

          <p class="hero__bio reveal" data-reveal-delay="120">${esc(site.bio)}</p>

          <nav class="hero__links reveal" data-reveal-delay="180" aria-label="联系方式">
            ${site.links
              .map(
                (l) => `<a class="link-btn" href="${esc(l.href)}"${/^https?:/.test(l.href) ? ' target="_blank" rel="noopener"' : ''}>
              ${icon(l.icon, 14)}<span>${esc(l.label)}</span>
            </a>`,
              )
              .join('')}
          </nav>
        </div>
      </section>

      <section class="sec">
        <div class="shell">
          <header class="sec-head reveal">
            <h2 class="sec-head__title">最新日志</h2>
            <span class="sec-head__rule"></span>
            <a class="sec-head__more" href="/blog" data-link>全部 ${posts.length} 篇 ${icon('arrow-bar-right', 11)}</a>
          </header>
          <div class="post-list reveal">${latest.map(miniRow).join('')}</div>
        </div>
      </section>
    </div>`,

    mount(root) {
      const typed = root.querySelector<HTMLElement>('#hero-typed');
      const stop = typed ? typewriter(typed, { phrases: [...site.lines], typeMs: 52, holdMs: 2000 }) : () => {};
      bindReveals(root);
      return stop;
    },
  };
}
