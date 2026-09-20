/** 文章 / 旅途找不到时的兜底页。 */
import { esc } from '../core/dom';
import { site } from '../../site.config';
import type { View } from '../core/router';

export function missingPage(what: string, backLabel: string, backHref: string): View {
  return {
    title: `没有这一页 · ${site.name}`,
    html: `<div class="page">
  <div class="empty">
    <p class="empty__code">查无此页</p>
    <p class="empty__hint">这个地址上没有${esc(what)}，可能还没写，或者链接抄错了一个字。</p>
    <a class="btn btn--solid" href="${esc(backHref)}" data-link>${esc(backLabel)}</a>
  </div>
</div>`,
  };
}
