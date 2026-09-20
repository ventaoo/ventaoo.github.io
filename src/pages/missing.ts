/** 找不到时的兜底页。 */
import { esc } from '../core/dom';
import { site } from '../../site.config';
import type { View } from '../core/router';

export function missingPage(what: string, backLabel: string, backHref: string): View {
  return {
    title: `没有这一页 · ${site.name}`,
    html: `<div class="tocpage">
  <p class="book__by">没有这一页</p>
  <h1 class="book__title">这个地址上没有东西</h1>
  <p class="book__sub">这里没有${esc(what)}，可能还没写，或者链接抄错了一个字。</p>
  <p class="block__more"><a href="${esc(backHref)}" data-link>← ${esc(backLabel)}</a></p>
</div>`,
  };
}
