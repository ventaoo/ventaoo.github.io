# VENTAOO · 写作与造物

> 一个以排版为主的个人主页 + 博客。纸与墨的配色、两款加拉蒙衬线、一层缓慢漂移的墨晕背景 —— 没有框架，没有图片素材。

**线上地址：<https://ventaoo.github.io/>**

---

## 只有两个页面

| 路由 | 内容 |
| --- | --- |
| `/` | 主页：地点／年份、名字、几句话（config 驱动）、简介、联系方式、近作 |
| `/blog` | 日志归档：按年份分组、搜索、标签筛选 |
| `/blog/<slug>` | 文章页：边栏目录、代码高亮与复制、上一篇 / 下一篇 |

## 改文案只需要动一个文件

**`site.config.ts`** 是整站文案的唯一来源：

`@ts
export const site = {
  name: 'VENTAOO',
  suffix: '',
  status: '杭州 · 二〇二六',

  // ★ 主页轮播的几句话（交叉淡入）
  lines: [
    '把想法编译成像素。',
    '白天写代码解决问题，晚上写代码制造问题。',
  ],

  bio: '我是 VENTAOO，现在在杭州……',

  links: [
    { label: 'GitHub', href: 'https://github.com/ventaoo' },
    { label: 'Email', href: 'mailto:ventaoczu@gmail.com' },
    { label: 'RSS', href: '/rss.xml' },
  ],

  blog: { title: '日志', intro: '……', latestOnHome: 3 },
  seo: { title: '…', description: '…' },
  footerNote: '写作与造物',
  colophon: 'Cormorant & EB Garamond 排版',
} as const;
`@

改完刷新即可，不需要碰任何组件代码。

## 写文章

在 `content/posts/` 放一个 `.md` 文件：

`@markdown
---
title: 文章标题
date: 2026-09-15
tags: [标签一, 标签二]
summary: 一句话摘要，显示在归档和 RSS 里。
---

正文……
`@

文件名就是 URL。仓库里目前**只有一篇** `hello-world.md` 作示例，删掉它就能从零开始。

## 设计

### 纸与墨

默认是暖白纸色配深墨，另有一个"墨色"深色模式。右上角四个墨点是四种传统颜料，点一下整站的强调色就换了：

| | 朱砂 | 靛青 | 苔绿 | 赭石 |
| --- | --- | --- | --- | --- |
| 纸色 | `#b0442a` | `#2d4a5e` | `#4a5c33` | `#8b5e12` |
| 墨色 | `#e28a6a` | `#92b6cc` | `#a8c084` | `#deab50` |

### 排版

排版是唯一的装饰：

- **Cormorant Garamond** 做名字、标题和那句自述 —— 高对比度的加拉蒙，字号一大就非常好看
- **EB Garamond** 做正文，同源的加拉蒙，长文耐读
- 中文自动落到系统的宋体（Songti SC / Noto Serif CJK），和拉丁衬线是同一家族的质感
- 正文宽度锁在 33em、1.86 倍行高；中文段落用**两字首行缩进**（标题后的首段不缩进）
- 全大写字距标签、渐隐的发丝分隔线、边栏目录跟随滚动

### 背景与动效

**背景**是一块全分辨率 Canvas：三团极慢漂移的色晕加七条发丝般的墨线，约 30fps，随滚动缓缓上移，上面叠一层 SVG 纸张颗粒和一道顶部暖光。它只是"呼吸"，不动声色。

**动效**统一用 `cubic-bezier(.22,1,.36,1)`：

- 滚动显现是 900ms 的位移加淡入，按顺序错开
- 路由切换是整体上浮淡入
- 首页那句话是**交叉淡入**，不是逐字打印
- 列表行悬停时整行在合成层上右移，并从左侧滑出一道墨线
- 文字链接悬停像马克笔一样扫过一层底色
- 首页的头部会随滚动缓缓上移并淡出

## 技术栈

Vite 7 + TypeScript，**没有 UI 框架**。运行时依赖只有三个：

| 库 | 用途 |
| --- | --- |
| [@fontsource-variable](https://fontsource.org/) | Cormorant Garamond / EB Garamond / JetBrains Mono 自托管 |
| [marked](https://marked.js.org/) | Markdown 解析 |
| [highlight.js](https://highlightjs.org/) | 代码高亮 |

动画共用一个 `requestAnimationFrame` 调度器（`src/core/ticker.ts`）。

### 体积

| | |
| --- | --- |
| 首次加载字体 | **约 205 KB**（只取 latin 子集；中文走系统字体，不下载字库） |
| CSS | 39 KB |
| JS | 130 KB |

## 本地开发

`@bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run build      # 输出到 dist/
npm run preview    # 预览构建结果（端口 4173）
npm run typecheck  # tsc --noEmit
`@

### 回归验证

`@bash
npm run preview &
npm run verify     # 截图 + ASCII 构图图 + 35 项断言
npm run shot       # 只截图，输出到 shots/
`@

断言覆盖：每个路由渲染、墨晕背景确实在画且会随时间变化、字体确实是 Cormorant Garamond / EB Garamond、
config 文案确实生效、滚动显现、深浅色切换、四个墨点切换、帮助面板、归档搜索与标签筛选、
按年份分组、404、客户端路由、桌面与手机无横向溢出、
**8 种墨色 × 深浅组合下全部文字色通过 WCAG AA**，以及首次加载的字体字节数。

## 目录结构

`@
site.config.ts        ← 全站文案
content/posts/        ← Markdown 文章
src/
  main.ts             启动、chrome 接线、路由注册
  core/               dom / 调度器 / 偏好存储 / 路由 / 快捷键 / 图标
  fx/                 墨晕画布 / 指针与滚动微动 / 显现 / 句子轮播
  blog/               Markdown 渲染 + 文章集合 + 归档行
  pages/              home / blog / post
  styles/             tokens · base · components · chrome · pages · blog · fx
scripts/              截图与验证工具
`@

## 快捷键

| 键 | 作用 |
| --- | --- |
| `T` | 切换深色 / 浅色 |
| `A` | 换一种强调色 |
| `G` `B` | 跳到日志 |
| `/` | 在日志页聚焦搜索框 |
| `?` | 快捷键面板 |

## 部署

推送到 `main` 即自动部署到 GitHub Pages（`.github/workflows/deploy.yml`）。

构建时会为每个路由生成真实的静态 HTML（正确的 title / description / canonical / Open Graph，
以及 `<noscript>` 里的正文），所以深链接返回 HTTP 200 而不是 404，搜索引擎能正常收录；
同时生成 `rss.xml` / `sitemap.xml` / `robots.txt`。

## 许可

代码以 [MIT](LICENSE) 发布。文章内容版权归作者所有。
