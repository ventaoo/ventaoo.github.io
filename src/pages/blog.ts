import type { Ctx, View } from '../core/router';
import { icon } from '../core/icons';
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { posts, tags } from '../blog/posts';
import { renderIndex } from '../blog/entry';
import { bindReveals } from '../fx/reveal';

export function blogPage(ctx: Ctx): View {
  const initialTag = ctx.query.get('tag') ?? '';
  const minutes = posts.reduce((n, p) => n + p.reading, 0);

  return {
    title: site.blog.title + ' · ' + site.name,
    html: `
    <div class="page">
      <div class="shell">
        <header class="page-head reveal">
          <h1 class="page-head__title">${esc(site.blog.title)}</h1>
          <p class="page-head__sub">
            ${esc(site.blog.intro)}
            共 <b>${posts.length}</b> 篇 · 约 <b>${minutes}</b> 分钟。
          </p>
        </header>

        <div class="filterbar reveal">
          <label class="searchbox">
            <span class="ico">${icon('search', 14)}</span>
            <input type="search" id="post-search" placeholder="搜索标题、摘要或标签" autocomplete="off" aria-label="搜索文章" />
          </label>
          <button class="chip${initialTag ? '' : ' is-active'}" data-tag="">全部</button>
          ${tags
            .map(
              (t) =>
                `<button class="chip${initialTag === t.name ? ' is-active' : ''}" data-tag="${esc(t.name)}">${esc(
                  t.name,
                )}<span class="chip__n">${t.count}</span></button>`,
            )
            .join('')}
        </div>

        <div class="wtable" id="post-list">${renderIndex(posts, { header: true })}</div>
        <p class="empty-hint" id="post-empty" hidden>没有匹配的文章 —— 换个关键词试试。</p>

        <p class="feed-note">订阅更新 <a class="ulink" href="/rss.xml">/rss.xml ${icon('rss', 13)}</a></p>
      </div>
    </div>`,

    mount(root) {
      const list = root.querySelector<HTMLElement>('#post-list');
      const input = root.querySelector<HTMLInputElement>('#post-search');
      const empty = root.querySelector<HTMLElement>('#post-empty');
      if (!list) return;

      const rows = Array.from(list.querySelectorAll<HTMLElement>('.wrow'));
      const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('.chip[data-tag]'));
      let activeTag = initialTag;
      let query = '';

      const apply = () => {
        const q = query.trim().toLowerCase();
        let visible = 0;
        for (const el of rows) {
          const tagOk = !activeTag || (el.dataset.tags ?? '').split(' ').includes(activeTag);
          const hitOk = !q || (el.dataset.search ?? '').includes(q);
          const ok = tagOk && hitOk;
          el.hidden = !ok;
          if (ok) visible++;
        }
        if (empty) empty.hidden = visible > 0;
      };

      chips.forEach((c) =>
        c.addEventListener('click', () => {
          activeTag = c.dataset.tag ?? '';
          chips.forEach((x) => x.classList.toggle('is-active', x === c));
          const url = new URL(location.href);
          if (activeTag) url.searchParams.set('tag', activeTag);
          else url.searchParams.delete('tag');
          history.replaceState({}, '', url);
          apply();
        }),
      );

      let timer: number | undefined;
      input?.addEventListener('input', () => {
        clearTimeout(timer);
        timer = window.setTimeout(() => {
          query = input.value;
          apply();
        }, 110);
      });

      apply();
      bindReveals(root);
      return () => clearTimeout(timer);
    },
  };
}
