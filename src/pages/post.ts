import type { Ctx, View } from '../core/router';
import { icon } from '../core/icons';
import { esc } from '../core/dom';
import { site } from '../../site.config';
import { getPost, neighbours } from '../blog/posts';

export async function postPage(ctx: Ctx): Promise<View> {
  const post = getPost(ctx.params.slug ?? '');

  if (!post) {
    return {
      title: '找不到这篇 · ' + site.name,
      html: `<div class="page"><div class="shell">
        <div class="empty">
          <p class="empty__code">查无此篇</p>
          <p class="empty__hint">这篇随笔不存在。</p>
          <a class="btn" href="/blog" data-link>回到随笔</a>
        </div>
      </div></div>`,
    };
  }

  // 高亮与 Markdown 引擎按需加载
  const { renderMarkdown } = await import('../blog/markdown');
  const { html, headings } = renderMarkdown(post.body);
  const { prev, next } = neighbours(post.slug);

  return {
    title: post.title + ' · ' + site.name,
    html: `
    <div class="page">
      <div class="shell">
        <header class="post-head rv">
          <a class="post-head__back" href="/blog" data-link>${icon('arrowLeft', 13)} 随笔</a>
          <h1 class="post-head__title">${esc(post.title)}</h1>
          <div class="post-head__meta">
            <span class="mono">${post.date.replace(/-/g, '.')}</span>
            <span class="mono">约 ${post.reading} 分钟</span>
            <span class="post-head__tags">${post.tags
              .map((t) => `<a class="tag" href="/blog?tag=${encodeURIComponent(t)}" data-link>${esc(t)}</a>`)
              .join('')}</span>
          </div>
        </header>

        <div class="post-layout">
          <div class="prose post-body rv" id="prose">${html}</div>
          ${
            headings.length
              ? `<aside class="post-toc"><p class="post-toc__t mono">目次</p>
                   <nav class="post-toc__list" id="toc">${headings
                     .map((h) => `<a href="#${h.id}" data-depth="${h.depth}">${esc(h.text)}</a>`)
                     .join('')}</nav></aside>`
              : ''
          }

          <nav class="post-nav">
            ${
              prev
                ? `<a class="post-nav__item" href="/blog/${prev.slug}" data-link>
                    <span class="post-nav__lbl">${icon('arrowLeft', 12)} 前一篇</span>
                    <span class="post-nav__t">${esc(prev.title)}</span></a>`
                : '<span></span>'
            }
            ${
              next
                ? `<a class="post-nav__item post-nav__item--next" href="/blog/${next.slug}" data-link>
                    <span class="post-nav__lbl">后一篇 ${icon('arrowRight', 12)}</span>
                    <span class="post-nav__t">${esc(next.title)}</span></a>`
                : '<span></span>'
            }
          </nav>
        </div>
      </div>
    </div>`,

    mount(root) {
      root.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
        const reset = () => {
          btn.innerHTML = icon('copy', 12) + '<span>复制</span>';
        };
        btn.addEventListener('click', async () => {
          const code = btn.closest('.codeblock')?.querySelector('code')?.textContent ?? '';
          try {
            await navigator.clipboard.writeText(code);
            btn.innerHTML = icon('check', 12) + '<span>已复制</span>';
            window.setTimeout(reset, 1500);
          } catch {
            btn.innerHTML = '<span>复制失败</span>';
            window.setTimeout(reset, 1800);
          }
        });
      });

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
        { rootMargin: '-12% 0px -78% 0px' },
      );
      targets.forEach((t) => spy.observe(t));
      return () => spy.disconnect();
    },
  };
}
