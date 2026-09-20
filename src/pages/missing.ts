/** 找不到时的兜底页。 */
import { esc } from '../core/dom';
import { site } from '../../site.config';
import type { View } from '../core/router';

export function missingPage(what: string, backLabel: string, backHref: string): View {
  return {
    title: `没有这一页 · ${site.name}`,
    html: `<div class="sheet">
  <div class="intro intro--page">
    <p class="intro__kicker">没有这一页</p>
    <h1 class="intro__title">这里什么也没有</h1>
    <p class="intro__lead">这个地址上没有${esc(what)}，可能还没写，或者链接抄错了一个字。</p>
    <p class="block__more"><a href="${esc(backHref)}" data-link>${esc(backLabel)}</a></p>
  </div>
</div>`,
  };
}
