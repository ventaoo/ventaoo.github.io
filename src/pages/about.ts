import type { View } from '../core/router';
import { icon } from '../core/icons';
import { esc } from '../core/dom';
import { site } from '../../site.config';

export function aboutPage(): View {
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
    title: site.about.title + ' · ' + site.name,
    html: `
    <div class="page">
      <div class="shell">
        <header class="page-head">
          <p class="page-head__kicker mono mono--amber rv">作者与本刊</p>
          <h1 class="page-head__title rv">${esc(site.about.title)}</h1>
          <p class="page-head__sub rv" data-rv-delay="100">${esc(site.lead)}</p>
        </header>

        <div class="about__grid">
          <div class="about__body rv">
            ${site.about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
          </div>
          <div class="about__side rv" data-rv-delay="120">
            <div class="contact__links">${links}</div>
            <div class="about__colophon">
              <span class="mono">本站纪事</span>
              ${site.about.colophon.map((p) => `<p>${esc(p)}</p>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>`,
  };
}
