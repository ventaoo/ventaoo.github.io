import type { View } from '../core/router';
import { icon } from '../core/icons';
import { esc } from '../core/dom';
import { profile, projects, skills, timeline } from '../data/profile';
import { posts, tags } from '../blog/posts';
import { typewriter } from '../fx/typewriter';
import { terminalMarkup, initTerminals } from '../core/terminal';
import { bindReveals } from '../fx/reveal';

const MARQUEE = [
  '像素永不褪色',
  'PIXEL PERFECT',
  '没有框架，只有耐心',
  '30 FPS 的浪漫',
  'NO ROUNDED CORNERS',
  '把想法编译成像素',
  'KEEP SHIPPING',
];

function postCard(p: (typeof posts)[number]): string {
  return `<a class="card reveal" href="/blog/${p.slug}" data-link data-tilt="6">
    <div class="card__pad">
      <div class="card__meta">
        <span>${icon('calendar-2', 12)} ${p.date}</span>
        <span>${icon('clock', 12)} ${p.reading} 分钟</span>
      </div>
      <h3 class="card__title">${esc(p.title)}</h3>
      <p class="card__desc">${esc(p.summary)}</p>
      <div class="card__meta">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    </div>
  </a>`;
}

export function homePage(): View {
  const latest = posts.slice(0, 3);
  const topProjects = projects.slice(0, 3);
  const totalWords = posts.reduce((n, p) => n + p.body.length, 0);

  return {
    title: 'VENTAOO · 像素空间站',
    html: `
    <div class="page">
      <!-- ── HERO ─────────────────────────────────────────────── -->
      <section class="hero">
        <div class="hero__inner">
          <div class="hero__status reveal"><i></i> 系统在线 · 信号稳定</div>

          <h1 class="hero__title">
            <span class="line" data-mouse="0.012">我做<span class="accent">像素</span>，</span>
            <span class="line" data-mouse="0.02">也做<span class="accent-2">能跑的东西</span>。</span>
          </h1>

          <p class="hero__typed" id="hero-typed"></p>

          <p class="hero__lead">${profile.lead}</p>

          <div class="hero__cta">
            <a class="btn btn--primary btn--lg" href="/blog" data-link>${icon('book-open', 16)} 进入博客</a>
            <a class="btn btn--lg" href="/projects" data-link>${icon('folder', 16)} 看看项目</a>
            <a class="btn btn--ghost btn--lg" href="${profile.github}" target="_blank" rel="noopener">${icon('github', 16)} GitHub</a>
          </div>

          <div class="hero__stats reveal">
            <div class="hero__stat"><b data-count="${posts.length}">0</b><span>篇日志</span></div>
            <div class="hero__stat"><b data-count="${projects.length}">0</b><span>个项目</span></div>
            <div class="hero__stat"><b data-count="${Math.round(totalWords / 1000)}">0</b><span>千字积累</span></div>
            <div class="hero__stat"><b data-count="${tags.length}">0</b><span>个标签</span></div>
          </div>
        </div>

        <div class="hero__scroll"><span>${icon('chevron-down', 14)}</span>SCROLL</div>
      </section>

      <!-- ── MARQUEE ──────────────────────────────────────────── -->
      <div class="marquee" aria-hidden="true">
        <div class="marquee__track">
          ${[...MARQUEE, ...MARQUEE].map((m, i) => `<span>${m} <i>${i % 3 === 0 ? '◆' : i % 3 === 1 ? '▚' : '●'}</i> <b>·</b></span>`).join('')}
        </div>
      </div>

      <!-- ── LATEST POSTS ─────────────────────────────────────── -->
      <section class="sec" id="latest">
        <div class="sec__inner">
          <header class="sec-head reveal">
            <span class="sec-head__num">01 / LOG</span>
            <h2 class="sec-head__title">最新日志</h2>
            <span class="sec-head__rule"></span>
            <a class="sec-head__sub" href="/blog" data-link>全部 ${posts.length} 篇 →</a>
          </header>
          <div class="grid grid--3">${latest.map(postCard).join('')}</div>
        </div>
      </section>

      <!-- ── PROJECTS ─────────────────────────────────────────── -->
      <section class="sec" id="work">
        <div class="sec__inner">
          <header class="sec-head reveal">
            <span class="sec-head__num">02 / WORK</span>
            <h2 class="sec-head__title">在做的事</h2>
            <span class="sec-head__rule"></span>
            <a class="sec-head__sub" href="/projects" data-link>全部项目 →</a>
          </header>
          <div class="grid grid--3">
            ${topProjects
              .map(
                (p) => `<a class="card reveal" href="${p.url}" target="_blank" rel="noopener" data-tilt="6">
              <div class="card__pad">
                <div class="proj__top">
                  <span class="proj__ico" style="color:${p.color}">${icon(p.icon, 22)}</span>
                  <div style="flex:1;min-width:0">
                    <h3 class="card__title">${esc(p.name)}</h3>
                    <div class="card__meta"><span class="proj__lang"><i style="background:${p.color}"></i>${p.lang}</span></div>
                  </div>
                </div>
                <p class="card__desc">${esc(p.desc)}</p>
                <div class="card__meta">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
              </div>
            </a>`,
              )
              .join('')}
          </div>
        </div>
      </section>

      <!-- ── SKILLS + TIMELINE ────────────────────────────────── -->
      <section class="sec" id="about">
        <div class="sec__inner grid grid--2" style="align-items:start">
          <div class="reveal reveal--left">
            <header class="sec-head" style="margin-bottom:20px">
              <span class="sec-head__num">03 / SKILL</span>
              <h2 class="sec-head__title">技能点</h2>
            </header>
            <div class="grid" style="gap:18px">
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
          <div class="reveal reveal--right">
            <header class="sec-head" style="margin-bottom:20px">
              <span class="sec-head__num">04 / TIME</span>
              <h2 class="sec-head__title">时间线</h2>
            </header>
            <div class="timeline">
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
          </div>
        </div>
      </section>

      <!-- ── TERMINAL ─────────────────────────────────────────── -->
      <section class="sec" id="terminal-sec">
        <div class="sec__inner">
          <header class="sec-head reveal">
            <span class="sec-head__num">05 / SHELL</span>
            <h2 class="sec-head__title">直接问我</h2>
            <span class="sec-head__rule"></span>
            <span class="sec-head__sub">试试 <kbd>whoami</kbd> 或者 <kbd>neofetch</kbd></span>
          </header>
          <div class="term-wrap reveal reveal--zoom">${terminalMarkup()}</div>
        </div>
      </section>

      <!-- ── CONTACT ──────────────────────────────────────────── -->
      <section class="sec sec--tight" id="contact">
        <div class="sec__inner">
          <div class="panel reveal">
            <div class="panel__bar"><span class="dot"></span><span>CONTACT</span></div>
            <div class="panel__body center">
              <h2 style="font-size:var(--fs-h2);margin-bottom:12px">有想法？写给我。</h2>
              <p class="muted" style="max-width:52ch;margin:0 auto 24px">无论是项目合作、技术讨论，还是只想说一句"这个动效不错"，都很欢迎。</p>
              <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
                <a class="btn btn--primary" href="mailto:${profile.email}">${icon('mail-open', 16)} 发邮件</a>
                <a class="btn" href="${profile.github}" target="_blank" rel="noopener">${icon('github', 16)} GitHub</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>`,

    mount(root) {
      const typed = root.querySelector<HTMLElement>('#hero-typed');
      const stop = typed ? typewriter(typed, { phrases: [...profile.typed], typeMs: 52, holdMs: 2100 }) : () => {};

      // count-up numbers
      const counters = Array.from(root.querySelectorAll<HTMLElement>('[data-count]'));
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          io.unobserve(el);
          const target = Number(el.dataset.count ?? 0);
          let n = 0;
          const step = Math.max(1, Math.round(target / 24));
          const timer = window.setInterval(() => {
            n = Math.min(target, n + step);
            el.textContent = String(n);
            if (n >= target) clearInterval(timer);
          }, 34);
        }
      }, { threshold: 0.4 });
      counters.forEach((c) => io.observe(c));

      // skill meters fill on scroll
      const skillIo = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          skillIo.unobserve(el);
          const bar = el.querySelector<HTMLElement>('.meter > i');
          if (bar) bar.style.width = (Number(el.dataset.skill ?? 0)) + '%';
        }
      }, { threshold: 0.3 });
      root.querySelectorAll('[data-skill]').forEach((el) => skillIo.observe(el));

      initTerminals(root);
      bindReveals(root);

      return () => {
        stop();
        io.disconnect();
        skillIo.disconnect();
      };
    },

    after() {
      const terminal = document.getElementById('terminal');
      if (terminal && location.hash === '#terminal') terminal.scrollIntoView({ block: 'center' });
    },
  };
}
