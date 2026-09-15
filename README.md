# VENTAOO · 像素空间站

> 一个像素风的极简个人主页 + 博客。没有框架，没有图片素材，背景是一整块手写的 Canvas 像素世界。

**线上地址：<https://ventaoo.github.io/>**

---

## 就两个页面

| 路由 | 内容 |
| --- | --- |
| `/` | 主页：状态、名字、几句话（config 驱动）、简介、联系方式、最新日志 |
| `/blog` | 日志列表：搜索 + 标签筛选 |
| `/blog/<slug>` | 文章页：目录、代码高亮与复制、上一篇 / 下一篇 |

没有项目页、实验室、成就系统、等级、终端 —— 只留下必要的部分。

## 改文案只需要动一个文件

**`site.config.ts`** 是整站文案的唯一来源：

```ts
export const site = {
  name: 'VENTAOO',
  suffix: '.OS',
  status: '系统在线 · 杭州',

  // ★ 主页轮播的几句话
  lines: [
    '把想法编译成像素。',
    '白天写代码解决问题，晚上写代码制造问题。',
  ],

  bio: '我是 VENTAOO，现在在杭州……',

  links: [
    { label: 'GitHub', href: 'https://github.com/ventaoo', icon: 'github' },
    { label: 'Email', href: 'mailto:ventaoczu@gmail.com', icon: 'mail-open' },
    { label: 'RSS', href: '/rss.xml', icon: 'rss' },
  ],

  blog: { title: '日志', intro: '……', latestOnHome: 3 },
  seo: { title: '…', description: '…' },
  footerNote: '用像素与 ♥ 手工搭建',
} as const;
```

改完刷新即可，不需要碰任何组件代码。

## 写文章

在 `content/posts/` 放一个 `.md` 文件：

```markdown
---
title: 文章标题
date: 2026-09-15
tags: [标签一, 标签二]
summary: 一句话摘要，显示在列表和 RSS 里。
---

正文……
```

文件名就是 URL。仓库里目前**只有一篇** `hello-world.md` 作示例，删掉它就能从零开始。

## 有什么好玩的

- **像素世界**：固定背景的 Canvas 渲染器，内部分辨率只有 200–560px 宽，靠 CSS 最近邻放大成硬边像素。九层视差（星空 / 日月 / 云 / 浮空岛 / 两层山脊 / 城市天际线 / 树木地面 / 前景剪影），全部程序化生成。一个小人和一只猫在地平线上走来走去。滚动时**太阳会划过天空**。
- **点太阳就能切换昼夜** —— 整站配色和像素世界一起换。
- **四套配色**：暮色 / 掌机绿 / 蒸汽波 / 琥珀（按 `P` 切换）。
- **CRT 显像管滤镜**：扫描线 + 暗角 + 偶发闪烁。
- **像素光标**：十字准星 + 拖尾，悬停时旋转。
- **8-bit 音效**：全部由 Web Audio 现场合成，**没有一个音频文件**；还有一段可开关的芯片音乐。
- **科乐美秘技** `↑↑↓↓←→←→BA` → PARTY MODE。

## 技术栈

Vite 7 + TypeScript，**没有 UI 框架**。依赖只有四个：

| 库 | 用途 |
| --- | --- |
| [pixelarticons](https://github.com/halfmage/pixelarticons) | 像素图标集（MIT），内联为 SVG |
| [@fontsource](https://fontsource.org/) | Press Start 2P / Silkscreen / VT323 自托管 |
| [marked](https://marked.js.org/) | Markdown 解析 |
| [highlight.js](https://highlightjs.org/) | 代码高亮 |

动画共用一个 `requestAnimationFrame` 调度器（`src/core/ticker.ts`）。

## 本地开发

```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run build      # 输出到 dist/
npm run preview    # 预览构建结果（端口 4173）
npm run typecheck  # tsc --noEmit
```

### 回归验证

```bash
npm run preview &
npm run verify     # 截图 + ASCII 构图图 + 32 项断言
npm run shot       # 只截图，输出到 shots/
```

断言覆盖：每个路由渲染、像素世界确实在画、视差随滚动变化、滚动显现、config 文案确实生效、
主题与配色切换、帮助弹窗、博客搜索与标签筛选、404、科乐美秘技、客户端路由、
桌面与手机无横向溢出、**8 种主题×配色组合下全部文字色通过 WCAG AA**。

## 目录结构

```
site.config.ts        ← 全站文案
content/posts/        ← Markdown 文章
src/
  main.ts             启动、chrome 接线、路由注册
  core/               dom / 调度器 / 设置存储 / 音效芯片 / 路由 / 快捷键 / 图标
  fx/                 像素世界渲染器 / 视差 / 显现 / 光标 / 打字机 / 彩带
  blog/               Markdown 渲染 + 文章集合
  pages/              home / blog / post
  styles/             tokens · base · components · chrome · pages · blog · fx
scripts/              截图与验证工具
```

## 快捷键

| 键 | 作用 |
| --- | --- |
| `T` | 切换昼夜（也可以直接点天上的太阳） |
| `P` | 换配色 |
| `C` | 显像管滤镜 |
| `M` / `B` | 音效 / 背景音乐 |
| `G` `B` | 跳到博客 |
| `/` | 聚焦搜索框 |
| `?` | 快捷键面板 |

## 部署

推送到 `main` 即自动部署到 GitHub Pages（`.github/workflows/deploy.yml`）。

构建时会为每个路由生成真实的静态 HTML（正确的 title / description / canonical / Open Graph，
以及 `<noscript>` 里的正文），所以深链接返回 HTTP 200 而不是 404，搜索引擎能正常收录；
同时生成 `rss.xml` / `sitemap.xml` / `robots.txt`。

## 许可

代码以 [MIT](LICENSE) 发布。文章内容版权归作者所有。
