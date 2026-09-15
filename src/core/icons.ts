// Pixel-art icon set — powered by `pixelarticons` (MIT), inlined as raw SVG so the
// icons inherit `currentColor` and stay crisp at any pixel scale.
import sun from 'pixelarticons/svg/sun.svg?raw';
import moon from 'pixelarticons/svg/moon.svg?raw';
import monitor from 'pixelarticons/svg/monitor.svg?raw';
import volume_3 from 'pixelarticons/svg/volume-3.svg?raw';
import volume_x_solid from 'pixelarticons/svg/volume-x-solid.svg?raw';
import menu from 'pixelarticons/svg/menu.svg?raw';
import close from 'pixelarticons/svg/close.svg?raw';
import chevron_down from 'pixelarticons/svg/chevron-down.svg?raw';
import chevron_right from 'pixelarticons/svg/chevron-right.svg?raw';
import chevron_up from 'pixelarticons/svg/chevron-up.svg?raw';
import arrow_bar_right from 'pixelarticons/svg/arrow-bar-right.svg?raw';
import arrow_bar_left from 'pixelarticons/svg/arrow-bar-left.svg?raw';
import github from 'pixelarticons/svg/github.svg?raw';
import mail_open from 'pixelarticons/svg/mail-open.svg?raw';
import rss from 'pixelarticons/svg/rss.svg?raw';
import search from 'pixelarticons/svg/search.svg?raw';
import clock from 'pixelarticons/svg/clock.svg?raw';
import external_link from 'pixelarticons/svg/external-link.svg?raw';
import copy from 'pixelarticons/svg/copy.svg?raw';
import check from 'pixelarticons/svg/check.svg?raw';
import terminal from 'pixelarticons/svg/terminal.svg?raw';
import code from 'pixelarticons/svg/code.svg?raw';
import star from 'pixelarticons/svg/star.svg?raw';
import heart from 'pixelarticons/svg/heart.svg?raw';
import home from 'pixelarticons/svg/home.svg?raw';
import book_open from 'pixelarticons/svg/book-open.svg?raw';
import gamepad from 'pixelarticons/svg/gamepad.svg?raw';
import refresh from 'pixelarticons/svg/refresh.svg?raw';
import trash from 'pixelarticons/svg/trash.svg?raw';
import lock from 'pixelarticons/svg/lock.svg?raw';
import wifi from 'pixelarticons/svg/wifi.svg?raw';
import cpu from 'pixelarticons/svg/cpu.svg?raw';
import zap from 'pixelarticons/svg/zap.svg?raw';
import coffee from 'pixelarticons/svg/coffee.svg?raw';
import music from 'pixelarticons/svg/music.svg?raw';
import eye from 'pixelarticons/svg/eye.svg?raw';
import info_box from 'pixelarticons/svg/info-box.svg?raw';
import plus from 'pixelarticons/svg/plus.svg?raw';
import minus from 'pixelarticons/svg/minus.svg?raw';
import settings_cog from 'pixelarticons/svg/settings-cog.svg?raw';
import power from 'pixelarticons/svg/power.svg?raw';
import file_text from 'pixelarticons/svg/file-text.svg?raw';
import folder from 'pixelarticons/svg/folder.svg?raw';
import calendar_2 from 'pixelarticons/svg/calendar-2.svg?raw';
import map_pin from 'pixelarticons/svg/map-pin.svg?raw';
import send from 'pixelarticons/svg/send.svg?raw';
import link from 'pixelarticons/svg/link.svg?raw';
import image_new from 'pixelarticons/svg/image-new.svg?raw';
import bookmark from 'pixelarticons/svg/bookmark.svg?raw';
import sparkles from 'pixelarticons/svg/sparkles.svg?raw';
import smile from 'pixelarticons/svg/smile.svg?raw';
import bug from 'pixelarticons/svg/bug.svg?raw';
import shield from 'pixelarticons/svg/shield.svg?raw';

const REGISTRY: Record<string, string> = {
  'sun': sun,
  'moon': moon,
  'monitor': monitor,
  'volume-3': volume_3,
  'volume-x-solid': volume_x_solid,
  'menu': menu,
  'close': close,
  'chevron-down': chevron_down,
  'chevron-right': chevron_right,
  'chevron-up': chevron_up,
  'arrow-bar-right': arrow_bar_right,
  'arrow-bar-left': arrow_bar_left,
  'github': github,
  'mail-open': mail_open,
  'rss': rss,
  'search': search,
  'clock': clock,
  'external-link': external_link,
  'copy': copy,
  'check': check,
  'terminal': terminal,
  'code': code,
  'star': star,
  'heart': heart,
  'home': home,
  'book-open': book_open,
  'gamepad': gamepad,
  'refresh': refresh,
  'trash': trash,
  'lock': lock,
  'wifi': wifi,
  'cpu': cpu,
  'zap': zap,
  'coffee': coffee,
  'music': music,
  'eye': eye,
  'info-box': info_box,
  'plus': plus,
  'minus': minus,
  'settings-cog': settings_cog,
  'power': power,
  'file-text': file_text,
  'folder': folder,
  'calendar-2': calendar_2,
  'map-pin': map_pin,
  'send': send,
  'link': link,
  'image-new': image_new,
  'bookmark': bookmark,
  'sparkles': sparkles,
  'smile': smile,
  'bug': bug,
  'shield': shield,
};

export type IconName = keyof typeof REGISTRY;

/** Return the raw SVG markup for a pixel icon. */
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
