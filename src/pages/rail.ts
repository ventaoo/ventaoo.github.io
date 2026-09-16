/** The photograph column that runs beside both the home page and the archive. */
import { esc } from '../core/dom';
import { photos } from '../../site.config';

export function photoRail(): string {
  if (!photos.length) return '';
  const items = photos
    .map((p, i) => {
      const alt = p.alt ?? p.caption ?? '';
      const caption = p.caption;
      return (
        '<figure class="rail__fig">' +
        '<img src="' + esc(p.src) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async">' +
        '<figcaption><span class="label rail__n">' + String(i + 1).padStart(2, '0') + '</span>' +
        (caption ? '<span class="label">' + esc(caption) + '</span>' : '') +
        '</figcaption></figure>'
      );
    })
    .join('');
  return (
    '<aside class="rail" aria-label="照片">' +
    '<div class="rail__head"><span class="label">照片</span></div>' +
    items +
    '</aside>'
  );
}
