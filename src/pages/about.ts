import type { View } from '../core/router';
import { icon } from '../core/icons';
import { esc } from '../core/dom';
import { profile, skills, timeline, uses, projects } from '../data/profile';
import { posts } from '../blog/posts';
import { xpState, ACHIEVEMENTS } from '../core/gamification';
import { save } from '../core/store';
import { bindReveals } from '../fx/reveal';
import { terminalMarkup, initTerminals } from '../core/terminal';
import { drawAvatar } from '../core/avatar';

export function aboutPage(): View {
  const { level, into, need } = xpState();

  return {
    title: '关于 · VENTAOO',
    html: `
    <div class="page">
      <div class="page__inner">
        <header class="post-head">
          <div class="about__head">
            <div>
              <h1 class="post-head__title">关于我</h1>
              <p class="muted" style="max-width:60ch;font-size:clamp(17px,1.1vw+13px,21px)">
                我是 VENTAOO，现在在${esc(profile.location)}。
                白天写代码解决问题，晚上写代码制造问题 —— 这个站点就是后者的产物。
              </p>
              <p class="muted" style="max-width:60ch;margin-top:12px">
                我相信工具应该被反复打磨到顺手，相信界面应该让人会心一笑，
                也相信「把一件事做到有趣」和「把一件事做对」并不矛盾。
              </p>
              <div class="socials">
                <a class="social" href="${profile.github}" target="_blank" rel="noopener">${icon('github', 15)} GitHub</a>
                <a class="social" href="mailto:${profile.email}">${icon('mail-open', 15)} Email</a>
                <a class="social" href="/rss.xml">${icon('rss', 15)} RSS</a>
                <a class="social" href="/blog" data-link>${icon('book-open', 15)} 博客</a>
              </div>
            </div>
            <canvas class="about__avatar bob" id="about-avatar" width="150" height="150" aria-label="像素头像"></canvas>
          </div>
        </header>

        <section class="sec sec--tight" style="padding-inline:0">
          <div class="grid grid--2" style="align-items:start">
            <div class="panel reveal reveal--left">
              <div class="panel__bar"><span class="dot"></span><span>PLAYER CARD</span></div>
              <div class="panel__body grid" style="gap:14px">
                <div style="display:flex;align-items:center;gap:14px">
                  <div>
                    <div class="hud__name" style="font-size:18px">${profile.name}</div>
                    <div class="muted">${esc(profile.title)}</div>
                  </div>
                </div>
                <div class="meter meter--xp"><i style="width:${Math.round((into / need) * 100)}%"></i></div>
                <div class="card__meta" style="justify-content:space-between">
                  <span>LV ${level}</span><span>${into} / ${need} XP</span><span>总计 ${save.xp} XP</span>
                </div>
                <div class="uses" style="margin-top:6px">
                  <div class="uses__row"><b>日志</b><span>${posts.length} 篇</span></div>
                  <div class="uses__row"><b>项目</b><span>${projects.length} 个</span></div>
                  <div class="uses__row"><b>到访</b><span>第 ${save.visits} 次</span></div>
                  <div class="uses__row"><b>成就</b><span>${save.achievements.length} / ${ACHIEVEMENTS.length}</span></div>
                </div>
              </div>
            </div>

            <div class="reveal reveal--right">
              <h2 style="font-size:var(--fs-h2);margin-bottom:16px">技能点</h2>
              <div class="grid" style="gap:16px">
                ${skills
                  .map(
                    (s) => `<div class="skill" data-skill="${s.level}">
                  <div class="skill__top"><b>${esc(s.name)}</b><span class="skill__lvl">${esc(s.note)}</span></div>
                  <div class="meter"><i></i></div>
                </div>`,
                  )
                  .join('')}
              </div>
            </div>
          </div>
        </section>

        <section class="sec sec--tight" style="padding-inline:0">
          <h2 style="font-size:var(--fs-h2);margin-bottom:22px">时间线</h2>
          <div class="timeline reveal">
            ${timeline
              .map(
                (t) => `<div class="tl">
              <div class="tl__when">${esc(t.when)}</div>
              <h3 class="tl__what">${esc(t.what)}</h3>
              <p class="tl__desc">${esc(t.desc)}</p>
            </div>`,
              )
              .join('')}
          </div>
        </section>

        <section class="sec sec--tight" style="padding-inline:0">
          <h2 style="font-size:var(--fs-h2);margin-bottom:22px">我用的东西</h2>
          <div class="uses reveal">
            ${uses.map((u) => `<div class="uses__row"><b>${esc(u.k)}</b><span>${esc(u.v)}</span></div>`).join('')}
          </div>
        </section>

        <section class="sec sec--tight" style="padding-inline:0">
          <h2 style="font-size:var(--fs-h2);margin-bottom:10px">成就墙</h2>
          <p class="muted" style="margin-bottom:22px;font-size:var(--fs-sm)">在这个站点里探索可以解锁。你已经拿到 ${save.achievements.length} / ${ACHIEVEMENTS.length}。</p>
          <div class="grid grid--4">
            ${ACHIEVEMENTS.map((a) => {
              const got = save.achievements.includes(a.id);
              return `<div class="panel" style="opacity:${got ? 1 : 0.45}">
                <div class="panel__body" style="display:flex;gap:12px;align-items:center;padding:16px">
                  <span style="color:${got ? 'var(--a1)' : 'var(--text-mute)'}">${icon(got ? a.icon : 'lock', 20)}</span>
                  <span>
                    <span style="display:block;font-family:var(--font-head);font-size:13px;color:${got ? 'var(--text)' : 'var(--text-mute)'}">${got ? esc(a.title) : '???'}</span>
                    <span class="muted" style="font-size:13px">${got ? esc(a.desc) : '尚未解锁'}</span>
                  </span>
                </div>
              </div>`;
            }).join('')}
          </div>
        </section>

        <section class="sec sec--tight" style="padding-inline:0">
          <h2 style="font-size:var(--fs-h2);margin-bottom:18px">随便问点什么</h2>
          <div class="term-wrap reveal">${terminalMarkup()}</div>
        </section>
      </div>
    </div>`,

    mount(root) {
      const av = root.querySelector<HTMLCanvasElement>('#about-avatar');
      if (av) drawAvatar(av, 150);
      initTerminals(root);
      bindReveals(root);

      const skillIo = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          skillIo.unobserve(el);
          const bar = el.querySelector<HTMLElement>('.meter > i');
          if (bar) bar.style.width = Number(el.dataset.skill ?? 0) + '%';
        }
      }, { threshold: 0.3 });
      root.querySelectorAll('[data-skill]').forEach((el) => skillIo.observe(el));

      return () => skillIo.disconnect();
    },
  };
}
