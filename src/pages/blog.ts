import type { Ctx, View } from '../core/router';
import { icon } from '../core/icons';
import { esc } from '../core/dom';
import { posts, tags, type Post } from '../blog/posts';
import { chip } from '../core/audio';
import { unlock, addXp } from '../core/gamification';
import { bindReveals } from '../fx/reveal';

function row(p: Post): string {
  return `<a class="post-row" href="/blog/${p.slug}" data-link data-tags="${esc(p.tags.join(' '))}" data-title="${esc(p.title.toLowerCase())}" data-text="${esc((p.summary + ' ' + p.body).toLowerCase())}">
    <span class="post-row__date">${icon('calendar-2', 11)} ${p.date}</span>
    <span>
      <span class="post-row__t">${esc(p.title)}</span>
      <span class="post-row__d">${esc(p.summary)}</span>
    </span>
    <span class="post-row__tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}
      <span class="post-row__date">${icon('clock', 11)} ${p.reading}′</span>
    </span>
  </a>`;
}

export function blogPage(ctx: Ctx): View {
  const initialTag = ctx.query.get('tag') ?? '';

  return {
    title: '博客 · VENTAOO',
    html: `
    <div class="page">
      <div class="page__inner">
        <header class="post-head">
          <h1 class="post-head__title">日志归档</h1>
          <p class="muted" style="max-width:62ch">
            写代码时踩过的坑、想明白的道理，以及一些纯粹因为好玩才做的事。
            一共 <b style="color:var(--a1)">${posts.length}</b> 篇，约
            <b style="color:var(--a1)">${posts.reduce((n, p) => n + p.reading, 0)}</b> 分钟读完。
          </p>
        </header>

        <div class="filterbar reveal">
          <label class="searchbox">
            <span class="ico">${icon('search', 15)}</span>
            <input type="search" id="post-search" placeholder="搜索标题、摘要或正文 …  ( / 聚焦 )" autocomplete="off" aria-label="搜索文章" />
          </label>
          <button class="chip${initialTag ? '' : ' is-active'}" data-tag="">全部 <span class="chip__count">${posts.length}</span></button>
          ${tags
            .map(
              (t) =>
                `<button class="chip${initialTag === t.name ? ' is-active' : ''}" data-tag="${esc(t.name)}">${esc(t.name)} <span class="chip__count">${t.count}</span></button>`,
            )
            .join('')}
        </div>

        <div class="post-list" id="post-list">${posts.map(row).join('')}</div>

        <p class="center muted" id="post-empty" hidden style="padding:48px 0">
          没有匹配的文章 —— 换个关键词试试？
        </p>

        <div class="panel" style="margin-top:56px">
          <div class="panel__body" style="display:flex;gap:18px;align-items:center;flex-wrap:wrap;justify-content:space-between">
            <div>
              <h3 style="font-size:var(--fs-h3);margin-bottom:4px">${icon('rss', 16)} 订阅更新</h3>
              <p class="muted" style="font-size:var(--fs-sm)">新文章会同步到 RSS，用你喜欢的阅读器订阅即可。</p>
            </div>
            <a class="btn" href="/rss.xml">${icon('rss', 15)} rss.xml</a>
          </div>
        </div>
      </div>
    </div>`,

    mount(root) {
      const list = root.querySelector<HTMLElement>('#post-list');
      const input = root.querySelector<HTMLInputElement>('#post-search');
      const empty = root.querySelector<HTMLElement>('#post-empty');
      const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('.chip[data-tag]'));
      if (!list) return;

      const rows = Array.from(list.querySelectorAll<HTMLElement>('.post-row'));
      let activeTag = initialTag;
      let query = '';

      const apply = () => {
        let visible = 0;
        const q = query.trim().toLowerCase();
        for (const el of rows) {
          const tagOk = !activeTag || (el.dataset.tags ?? '').split(' ').includes(activeTag);
          const textOk = !q || (el.dataset.title ?? '').includes(q) || (el.dataset.text ?? '').includes(q);
          const ok = tagOk && textOk;
          el.hidden = !ok;
          if (ok) visible++;
        }
        if (empty) empty.hidden = visible > 0;
      };

      chips.forEach((c) =>
        c.addEventListener('click', () => {
          activeTag = c.dataset.tag ?? '';
          chips.forEach((x) => x.classList.toggle('is-active', x === c));
          chip.select();
          if (activeTag) {
            unlock('archivist');
            addXp(4, true);
          }
          const url = new URL(location.href);
          if (activeTag) url.searchParams.set('tag', activeTag);
          else url.searchParams.delete('tag');
          history.replaceState({}, '', url);
          apply();
        }),
      );

      let searchTimer: number | undefined;
      input?.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = window.setTimeout(() => {
          query = input.value;
          apply();
        }, 120);
      });

      apply();
      bindReveals(root);
      if (location.hash === '#post-list') list.scrollIntoView({ block: 'start' });
    },
  };
}
