/** 关于：几句话，两小节，一条条列出来。 */
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { icon } from '../core/icons';
import type { View } from '../core/router';

function linkIcon(href: string): string {
  if (href.startsWith('mailto:')) return icon('mail', 16);
  if (href.startsWith('http')) return icon('github', 16);
  return icon('rss', 16);
}

export function aboutPage(): View {
  const contact = site.links
    .map(
      (l) => `<li><a class="contact__link" href="${esc(l.href)}"${l.href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''}>
      <span class="contact__icon">${linkIcon(l.href)}</span>
      <span class="contact__label">${esc(l.label)}</span>
      <span class="contact__value">${esc(l.value)}</span>
    </a></li>`,
    )
    .join('');

  return {
    title: `${site.about.title} · ${site.name}`,
    html: `<article class="page">
  <div class="sheet">
    <div class="page__head rv">
      <p class="page__kicker">${esc(site.name)}</p>
      <h1 class="page__title">${esc(site.about.title)}</h1>
    </div>
    <div class="about__text rv">
      ${site.about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
    </div>
    <section class="about__block rv">
      <h2 class="about__label">${esc(site.about.colophon.title)}</h2>
      <ul class="about__list">${site.about.colophon.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
    </section>
    <section class="about__block rv">
      <h2 class="about__label">联系</h2>
      <ul class="contact">${contact}</ul>
    </section>
    <p class="block__more"><a href="/" data-link>← ${esc(site.blog.back)}</a></p>
  </div>
</article>`,
  };
}
