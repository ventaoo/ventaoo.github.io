// Pixel-art icons from `pixelarticons` (MIT), inlined as raw SVG so they
// inherit `currentColor` and stay crisp at any pixel scale.
import sun from 'pixelarticons/svg/sun.svg?raw';
import moon from 'pixelarticons/svg/moon.svg?raw';
import volume_3 from 'pixelarticons/svg/volume-3.svg?raw';
import volume_x_solid from 'pixelarticons/svg/volume-x-solid.svg?raw';
import menu from 'pixelarticons/svg/menu.svg?raw';
import close from 'pixelarticons/svg/close.svg?raw';
import chevron_down from 'pixelarticons/svg/chevron-down.svg?raw';
import chevron_right from 'pixelarticons/svg/chevron-right.svg?raw';
import arrow_bar_right from 'pixelarticons/svg/arrow-bar-right.svg?raw';
import arrow_bar_left from 'pixelarticons/svg/arrow-bar-left.svg?raw';
import github from 'pixelarticons/svg/github.svg?raw';
import mail_open from 'pixelarticons/svg/mail-open.svg?raw';
import rss from 'pixelarticons/svg/rss.svg?raw';
import search from 'pixelarticons/svg/search.svg?raw';
import clock from 'pixelarticons/svg/clock.svg?raw';
import calendar_2 from 'pixelarticons/svg/calendar-2.svg?raw';
import external_link from 'pixelarticons/svg/external-link.svg?raw';
import copy from 'pixelarticons/svg/copy.svg?raw';
import check from 'pixelarticons/svg/check.svg?raw';
import book_open from 'pixelarticons/svg/book-open.svg?raw';
import home from 'pixelarticons/svg/home.svg?raw';
import sparkles from 'pixelarticons/svg/sparkles.svg?raw';
import heart from 'pixelarticons/svg/heart.svg?raw';
import info_box from 'pixelarticons/svg/info-box.svg?raw';
import bug from 'pixelarticons/svg/bug.svg?raw';
import link from 'pixelarticons/svg/link.svg?raw';
import sliders from 'pixelarticons/svg/sliders.svg?raw';
import zap from 'pixelarticons/svg/zap.svg?raw';
import file_text from 'pixelarticons/svg/file-text.svg?raw';
import star from 'pixelarticons/svg/star.svg?raw';

const REGISTRY: Record<string, string> = {
  'sun': sun,
  'moon': moon,
  'volume-3': volume_3,
  'volume-x-solid': volume_x_solid,
  'menu': menu,
  'close': close,
  'chevron-down': chevron_down,
  'chevron-right': chevron_right,
  'arrow-bar-right': arrow_bar_right,
  'arrow-bar-left': arrow_bar_left,
  'github': github,
  'mail-open': mail_open,
  'rss': rss,
  'search': search,
  'clock': clock,
  'calendar-2': calendar_2,
  'external-link': external_link,
  'copy': copy,
  'check': check,
  'book-open': book_open,
  'home': home,
  'sparkles': sparkles,
  'heart': heart,
  'info-box': info_box,
  'bug': bug,
  'link': link,
  'sliders': sliders,
  'zap': zap,
  'file-text': file_text,
  'star': star,
};

/** Raw SVG markup for a pixel icon, sized and recoloured to `currentColor`. */
export function icon(name: string, size = 16): string {
  const svg = REGISTRY[name] ?? REGISTRY['info-box'];
  return svg
    .replace('<svg ', `<svg width="${size}" height="${size}" aria-hidden="true" focusable="false" `)
    .replace(/fill="[^"]*"/g, 'fill="currentColor"');
}

/** Replace every `[data-icon]` placeholder inside `root` with its SVG. */
export function hydrateIcons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-icon]').forEach((el) => {
    const name = el.dataset.icon;
    if (!name || el.dataset.iconDone === name) return;
    el.dataset.iconDone = name;
    el.innerHTML = icon(name, Number(el.dataset.iconSize ?? 16));
  });
}
