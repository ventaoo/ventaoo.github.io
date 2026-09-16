import type { View } from '../core/router';
import { esc } from '../core/dom';
import { site, photos } from '../../site.config';
import { bindReveals } from '../fx/reveal';

export function photosPage(): View {
  const figures = photos
    .map((p, i) => {
      const alt = p.alt ?? p.caption ?? '';
      const caption = p.caption;
      return (
        '<figure class="gallery__fig reveal">' +
        '<img src="' + esc(p.src) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async">' +
        '<figcaption><span class="label gallery__n">' + String(i + 1).padStart(2, '0') + '</span>' +
        (caption ? '<span class="label">' + esc(caption) + '</span>' : '') +
        '</figcaption></figure>'
      );
    })
    .join('');

  return {
    title: site.photosPage.title + ' · ' + site.name,
    html: `
    <div class="page">
      <div class="shell">
        <header class="page-head reveal">
          <h1 class="page-head__title">${esc(site.photosPage.title)}</h1>
          <p class="page-head__sub">${esc(site.photosPage.intro)} 共 <b>${photos.length}</b> 张。</p>
        </header>
        ${
          photos.length
            ? '<div class="gallery">' + figures + '</div>'
            : '<p class="empty-hint">还没有照片。把图片放进 public/images/，在 site.config.ts 里登记即可。</p>'
        }
      </div>
    </div>`,

    mount(root) {
      bindReveals(root);
    },
  };
}
