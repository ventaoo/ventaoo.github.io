import type { View } from '../core/router';
import { icon } from '../core/icons';
import { esc } from '../core/dom';
import { projects } from '../data/profile';
import { bindReveals } from '../fx/reveal';

export function projectsPage(): View {
  const langs = Array.from(new Set(projects.map((p) => p.lang)));

  return {
    title: '项目 · VENTAOO',
    html: `
    <div class="page">
      <div class="page__inner">
        <header class="post-head">
          <h1 class="post-head__title">项目档案</h1>
          <p class="muted" style="max-width:62ch">
            都是我自己会用的东西 —— 一个水印方案、两个命令行工具、若干次模型实验。
            每一个都开源在 GitHub 上。
          </p>
          <div class="post-head__tags">
            <span class="tag">${projects.length} 个仓库</span>
            ${langs.map((l) => `<span class="tag">${esc(l)}</span>`).join('')}
          </div>
        </header>

        <div class="grid grid--2">
          ${projects
            .map(
              (p, i) => `<article class="card reveal" data-tilt="7" style="transition-delay:${i * 40}ms">
            <div class="panel__bar"><span class="dot"></span><span>${esc(p.year)} · ${esc(p.lang)}</span></div>
            <div class="card__pad">
              <div class="proj__top">
                <span class="proj__ico" style="color:${p.color}">${icon(p.icon, 22)}</span>
                <div style="flex:1;min-width:0">
                  <h2 class="card__title">${esc(p.name)}</h2>
                  <div class="card__meta">
                    <span class="proj__lang"><i style="background:${p.color}"></i>${esc(p.lang)}</span>
                    ${p.stars ? `<span>${icon('star', 11)} ${p.stars}</span>` : ''}
                  </div>
                </div>
              </div>
              <p class="card__desc">${esc(p.desc)}</p>
              <div class="card__meta">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
              <div class="proj__links">
                <a href="${p.url}" target="_blank" rel="noopener">${icon('github', 13)} 源码</a>
                <a href="${p.url}#readme" target="_blank" rel="noopener">${icon('file-text', 13)} 文档</a>
              </div>
            </div>
          </article>`,
            )
            .join('')}
        </div>

        <div class="panel reveal" style="margin-top:52px">
          <div class="panel__bar"><span class="dot"></span><span>THIS SITE</span></div>
          <div class="panel__body">
            <h2 style="font-size:var(--fs-h2);margin-bottom:12px">这个站点本身</h2>
            <p class="muted" style="max-width:70ch;margin-bottom:20px">
              它也是开源的，而且刻意保持"没有框架"：Vite + TypeScript + 原生 DOM，
              依赖只有图标集、三款像素字体、markdown 解析器和语法高亮。
              背景那个像素世界是手写的 Canvas 渲染器。
            </p>
            <div class="uses">
              <div class="uses__row"><b>构建</b><span>Vite 7 + TypeScript（无 UI 框架）</span></div>
              <div class="uses__row"><b>图形</b><span>原生 Canvas 2D，低分辨率 + 最近邻放大</span></div>
              <div class="uses__row"><b>动画</b><span>单个 requestAnimationFrame 调度器</span></div>
              <div class="uses__row"><b>音频</b><span>Web Audio 现场合成的 8-bit 音效</span></div>
              <div class="uses__row"><b>内容</b><span>Markdown + 自写 front-matter 解析</span></div>
              <div class="uses__row"><b>部署</b><span>GitHub Actions → GitHub Pages</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>`,

    mount(root) {
      bindReveals(root);
    },
  };
}
