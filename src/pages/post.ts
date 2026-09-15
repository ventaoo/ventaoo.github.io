import type { Ctx, View } from '../core/router';
import { icon } from '../core/icons';
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { getPost, neighbours, renderPost } from '../blog/posts';
import { toast } from '../core/toast';
import { bindReveals } from '../fx/reveal';

export function postPage(ctx: Ctx): View {
  const post = getPost(ctx.params.slug ?? '');

  if (!post) {
    return {
      title: `找不到这篇文章 · ${site.name}`,
      html: `<div class="page"><div class="shell">
        <div class="empty">
          <div class="empty__code">404</div>
          <p class="empty__hint">这篇文章不存在。</p>
          <a class="btn btn--primary" href="/blog" data-link>回到日志</a>
        </div>
      </div></div>`,
    };
  }

  const { html, headings } = renderPost(post);
  const { prev, next } = neighbours(post.slug);

  return {
    title: `${post.title} · ${site.name}`,
    html: `
    <div class="page">
      <div class="shell">
        <article class="post">
          <header class="post-head">
            <a class="post-head__back" href="/blog" data-link>${icon('arrow-bar-left', 12)} 日志</a>
            <h1 class="post-head__title">${esc(post.title)}</h1>
            <div class="post-head__meta">
              <span>${icon('calendar-2', 12)} ${post.date}</span>
              <span>${icon('clock', 12)} ${post.reading} 分钟</span>
              <span class="post-head__tags">${post.tags
                .map((t) => `<a class="tag" href="/blog?tag=${encodeURIComponent(t)}" data-link>${esc(t)}</a>`)
                .join('')}</span>
            </div>
          </header>

          <div class="post-layout">
            <div class="prose" id="prose">${html}</div>
            ${
              headings.length
                ? `<aside class="post-toc"><div class="post-toc__t">目录</div>
                     <nav class="post-toc__list" id="toc">${headings
                       .map((h) => `<a href="#${h.id}" data-depth="${h.depth}">${esc(h.text)}</a>`)
                       .join('')}</nav></aside>`
                : ''
            }
          </div>
        </article>

        <nav class="post-nav">
          ${
            prev
              ? `<a class="post-nav__item" href="/blog/${prev.slug}" data-link>
                  <span class="post-nav__lbl">${icon('arrow-bar-left', 11)} 更早</span>
                  <span class="post-nav__t">${esc(prev.title)}</span></a>`
              : '<span></span>'
          }
          ${
            next
              ? `<a class="post-nav__item post-nav__item--next" href="/blog/${next.slug}" data-link>
                  <span class="post-nav__lbl">更新 ${icon('arrow-bar-right', 11)}</span>
                  <span class="post-nav__t">${esc(next.title)}</span></a>`
              : '<span></span>'
          }
        </nav>
      </div>
    </div>`,

    mount(root) {
      root.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const code = btn.closest('.codeblock')?.querySelector('code')?.textContent ?? '';
          try {
            await navigator.clipboard.writeText(code);
            btn.innerHTML = icon('check', 12) + '<span>已复制</span>';
            window.setTimeout(() => {
              btn.innerHTML = icon('copy', 12) + '<span>复制</span>';
            }, 1500);
          } catch {
            toast('复制失败', '浏览器拒绝了剪贴板访问');
          }
        });
      });

      // table-of-contents scroll spy
      const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('#toc a'));
      const targets = links
        .map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))))
        .filter((el): el is HTMLElement => !!el);
      const spy = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const id = (e.target as HTMLElement).id;
            links.forEach((a) => a.classList.toggle('is-active', decodeURIComponent(a.hash.slice(1)) === id));
          }
        },
        { rootMargin: '-18% 0px -72% 0px' },
      );
      targets.forEach((t) => spy.observe(t));
      bindReveals(root);
      return () => spy.disconnect();
    },
  };
}
