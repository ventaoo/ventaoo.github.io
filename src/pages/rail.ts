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

/**
 * The rail scrolls inside itself when the photo list is taller than the
 * viewport. Only then should it fade at the bottom — the fade is a "there is
 * more" hint, and applying it unconditionally would clip the last caption.
 */
export function syncRail(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('.rail').forEach((el) => {
    el.classList.toggle('rail--scroll', el.scrollHeight > el.clientHeight + 4);
  });
}
