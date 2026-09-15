import type { Ctx, View } from '../core/router';
import { icon } from '../core/icons';
import { esc } from '../core/dom';
import { getPost, neighbours, related, renderPost } from '../blog/posts';
import { addXp, markPostRead } from '../core/gamification';
import { toast } from '../core/toast';
import { bindReveals } from '../fx/reveal';

export function postPage(ctx: Ctx): View {
  const post = getPost(ctx.params.slug ?? '');

  if (!post) {
    return {
      title: '找不到这篇文章 · VENTAOO',
      html: `<div class="page"><div class="page__inner">
        <div class="empty">
          <div class="empty__code">404</div>
          <div class="empty__msg">这篇文章不存在</div>
          <p class="empty__hint">它可能被重命名了，或者你输错了地址。</p>
          <a class="btn btn--primary" href="/blog" data-link>回到归档</a>
        </div>
      </div></div>`,
    };
  }

  const { html, headings } = renderPost(post);
  const { prev, next } = neighbours(post.slug);
  const more = related(post, 3);

  return {
    title: `${post.title} · VENTAOO`,
    html: `
    <div class="page">
      <div class="page__inner">
        <article>
          <header class="post-head">
            <a class="post-head__back" href="/blog" data-link>${icon('arrow-bar-left', 13)} 返回归档</a>
            <h1 class="post-head__title">${esc(post.title)}</h1>
            <div class="post-head__meta">
              <span>${icon('calendar-2', 13)} ${post.date}</span>
              <span>${icon('clock', 13)} 约 ${post.reading} 分钟</span>
              <span>${icon('file-text', 13)} ${post.body.length} 字</span>
            </div>
            <div class="post-head__tags">${post.tags.map((t) => `<a class="tag" href="/blog?tag=${encodeURIComponent(t)}" data-link>${esc(t)}</a>`).join('')}</div>
          </header>

          <div class="post-layout">
            <div class="prose" id="prose">${html}</div>
            <aside class="post-toc">
              <div class="post-toc__t">// 目录</div>
              <nav class="post-toc__list" id="toc">
                ${headings.map((h) => `<a href="#${h.id}" data-depth="${h.depth}">${esc(h.text)}</a>`).join('')}
              </nav>
            </aside>
          </div>
        </article>

        <div class="post-foot">
          <div class="panel__bar" style="margin-bottom:0"><span class="dot"></span><span>READ NEXT</span></div>
          <div class="post-nav">
            ${
              prev
                ? `<a class="post-nav__item" href="/blog/${prev.slug}" data-link>
                    <div class="post-nav__lbl">${icon('arrow-bar-left', 11)} 更早</div>
                    <div class="post-nav__t">${esc(prev.title)}</div>
                  </a>`
                : `<span></span>`
            }
            ${
              next
                ? `<a class="post-nav__item" href="/blog/${next.slug}" data-link>
                    <div class="post-nav__lbl">更新 ${icon('arrow-bar-right', 11)}</div>
                    <div class="post-nav__t">${esc(next.title)}</div>
                  </a>`
                : `<span></span>`
            }
          </div>

          ${
            more.length
              ? `<h3 style="margin:38px 0 14px;font-size:var(--fs-h3)">相关阅读</h3>
                 <div class="grid grid--3">
                   ${more
                     .map(
                       (m) => `<a class="card" href="/blog/${m.slug}" data-link>
                     <div class="card__pad">
                       <div class="card__meta"><span>${m.date}</span><span>${m.reading} 分钟</span></div>
                       <h4 class="card__title" style="font-size:15px">${esc(m.title)}</h4>
                     </div>
                   </a>`,
                     )
                     .join('')}
                 </div>`
              : ''
          }
        </div>
      </div>
    </div>`,

    mount(root) {
      // ── copy-to-clipboard on every code block ──
      root.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const code = btn.closest('.codeblock')?.querySelector('code')?.textContent ?? '';
          try {
            await navigator.clipboard.writeText(code);
            btn.innerHTML = icon('check', 12) + '<span>已复制</span>';
            addXp(1, true);
            window.setTimeout(() => {
              btn.innerHTML = icon('copy', 12) + '<span>复制</span>';
            }, 1600);
          } catch {
            toast('复制失败', '浏览器拒绝了剪贴板访问', 'error');
          }
        });
      });

      // ── TOC scroll-spy ──
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
        { rootMargin: '-20% 0px -70% 0px' },
      );
      targets.forEach((t) => spy.observe(t));

      // ── reading progress → XP, and a "read" flag at 65% ──
      const prose = root.querySelector<HTMLElement>('#prose');
      let awarded = 0;
      let marked = false;
      const onScroll = () => {
        if (!prose) return;
        const rect = prose.getBoundingClientRect();
        const total = rect.height - innerHeight;
        const progress = total <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / total));
        const whole = Math.floor(progress * 10);
        if (whole > awarded) {
          addXp((whole - awarded) * 3, true);
          awarded = whole;
        }
        if (!marked && progress >= 0.65) {
          marked = true;
          markPostRead(post.slug);
          toast('已读完《' + post.title.slice(0, 16) + '…》', '日志已记入你的档案', 'ach', 3200);
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();

      bindReveals(root);

      return () => {
        spy.disconnect();
        window.removeEventListener('scroll', onScroll);
      };
    },
  };
}
