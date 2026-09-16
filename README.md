# VENTAOO · 写作与造物

> 杂志式排版的个人主页 + 博客。宣纸白与墨，朱砂 / 赭石 / 黛青三种颜料，Space Grotesk 配宋体。

**线上地址：<https://ventaoo.github.io/>**

---

## 只有两个页面

| 路由 | 内容 |
| --- | --- |
| '/' | 主页：正文、联系方式、近作 |
| '/blog' | 日志归档：搜索 + 标签筛选 |
| '/blog/<slug>' | 文章：栏外目录、代码高亮与复制、上一篇 / 下一篇 |

两个页面右侧都有一条**照片专栏**，照片不进正文。

## 改文案只需要动一个文件

**'site.config.ts'** 是整站文案的唯一来源：

'''ts
export const site = {
  name: 'VENTAOO',
  status: '杭州 · 二〇二六',

  // ★ 主页开头的正文 —— 数组里每一项是一段，字号统一
  intro: [
    '我是 VENTAOO，现在在杭州。这里是我的数字花园 —— 记录做过的项目、踩过的坑，以及那些值得写下来的想法。',
    '白天写代码解决问题，晚上写代码制造问题。喜欢把复杂的东西做简单，把简单的东西做有趣。',
  ],

  links: [
    { label: 'GitHub', value: 'github.com/ventaoo', href: 'https://github.com/ventaoo' },
    { label: 'Email', value: 'ventaoczu@gmail.com', href: 'mailto:ventaoczu@gmail.com' },
    { label: 'RSS', value: '/rss.xml', href: '/rss.xml' },
  ],

  blog: { title: '日志', intro: '……', latestOnHome: 6 },
  seo: { title: '…', description: '…' },
  footerNote: '写作与造物',
  colophon: 'Space Grotesk & EB Garamond 排版',
} as const;
'''

写几段就显示几段，字号完全一样。

## 放照片

照片放在主页和日志右侧的**独立专栏**里，不会插进正文中间。
把图片丢进 'public/images/'，然后在同一个文件底部的 'photos' 里按顺序登记：

'''ts
export const photos: Photo[] = [
  { src: '/images/valley.jpg', alt: '山谷与河', caption: '山谷' },
  { src: '/images/window.jpg', alt: '窗边的光', caption: '窗' },
];
'''

数组留空时整栏隐藏，同时主栏会自动撑满 12 列（不会留下右侧一大片空白）。
窄屏上这一栏会摊成三列（手机两列）排在正文下面。

> 仓库里现在放了六张**占位图**（来自 [Lorem Picsum](https://picsum.photos/) 的 Unsplash 照片），换成你自己的即可。

## 写文章

在 'content/posts/' 放一个 '.md' 文件：

'''markdown
---
title: 文章标题
date: 2026-09-15
tags: [标签一, 标签二]
summary: 一句话摘要，显示在归档和 RSS 里。
---

正文……
'''

文件名就是 URL。仓库里目前只有一篇 'hello-world.md' 作示例。

## 设计

### 纸与颜料

| | 浅色 | 深色 | 用在哪 |
| --- | --- | --- | --- |
| 宣纸 | '#f6f3ea' | '#141311' | 底色 |
| 墨 | '#1b1916' | '#ebe4d5' | 正文与标题 |
| 朱砂 | '#a8341f' | '#d9704f' | 链接、强调、小节前的短线 |
| 黛青 | '#34525e' | '#7fa3b0' | 编号 |
| 赭石 | '#8f6520' | '#c9a05a' | 标签 |

### 字体

- **Space Grotesk** 做标题、导航和所有小标签 —— 一款有性格的怪诞体
- **EB Garamond** 做正文的拉丁文，和宋体同属老衬线，混排不打架
- **中文全部落到系统的宋体**（Songti SC / Noto Serif CJK），书卷气来自这里
- **JetBrains Mono** 只用在代码和编号上

字号只有七级：'76 / 58 / 30 / 20 / 17.5 / 15 / 10.5'。主页正文固定在最舒服的那一级，不再有跳动的大字。

### 版面

- 12 列网格，但**主栏和照片栏是两个不同的列区间**（1–8 与 10–12），中间留一列空白
- 照片栏是 **sticky** 的：它贴住视口跟着正文走，照片比屏幕高时自己在栏内滚动，
  所以再长的照片列表也不会把页面撑成几千像素、把主栏孤零零留在上面
- 照片全部 `loading="lazy"`，栏内滚到底才加载
- 页眉下面是一条 **running head**，左边是当前栏目，右边是坐标
- 归档是一张真正的表：'№ / 日期 / 标题 / 标签' 四列，表头与表体共用同一套列宽，编号和等宽数字对齐
- 文章正文缩进到第 2 列，栏外目录在第 10–12 列

### 细节

所有间距来自一套 4px 的刻度（'--s1' 到 '--s10'），没有临时数字。
线条统一 1px，只有最强的分隔用 2px。中文启用了 'palt' 特性收紧标点。
字号越大字距越紧，小标签则拉开到 .16em。

## 技术栈

Vite 7 + TypeScript，**没有 UI 框架**。运行时依赖三个：

| 库 | 用途 |
| --- | --- |
| [@fontsource-variable](https://fontsource.org/) | 字体自托管 |
| [marked](https://marked.js.org/) | Markdown 解析 |
| [highlight.js](https://highlightjs.org/) | 代码高亮 |

### 体积

| | |
| --- | --- |
| 首屏字体 | **约 151 KB**（只取 latin 子集；中文走系统字库，不下载） |
| CSS | 35 KB |
| JS | 126 KB |

## 本地开发

'''bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run build      # 输出到 dist/
npm run preview    # 预览构建结果（端口 4173）
npm run typecheck  # tsc --noEmit
'''

### 回归验证

'''bash
npm run preview &
npm run verify     # 截图 + ASCII 构图图 + 45 项断言
npm run shot       # 只截图，输出到 shots/
'''

断言覆盖：字体确实是 Space Grotesk / EB Garamond 且中文落到宋体、页面上没有过大的字、
**主页正文段数与内容来自 config 且字号一致**、12 列网格、**主栏与照片栏是两个独立列区间**、
照片栏在主页和日志都存在且全部加载、照片没有落进正文、归档表有表头且列对齐、日期格式、
文案里没有遗留旧关键词、配色选择器已移除、深浅色、帮助面板、搜索与标签筛选、
文章正文缩进与栏外目录、404、客户端路由、桌面与手机无横向溢出，以及浅深两套配色下全部文字通过 WCAG AA。

## 目录结构

'''
site.config.ts        ← 全站文案 + 照片清单
content/posts/        ← Markdown 文章
public/images/        ← 照片
src/
  core/               dom / 调度器 / 偏好 / 路由 / 快捷键 / 图标
  fx/                 微动 / 显现
  blog/               Markdown 渲染 + 文章集合 + 归档表
  pages/              home / blog / post / rail（照片专栏）
  styles/             tokens · base · components · chrome · pages · blog · fx
scripts/              截图与验证工具
'''

## 快捷键

| 键 | 作用 |
| --- | --- |
| 'T' | 切换深色 / 浅色 |
| 'G' 'B' | 跳到日志 |
| '/' | 在日志页聚焦搜索框 |
| '?' | 快捷键面板 |

## 部署

推送到 'main' 即自动部署到 GitHub Pages。构建时会为每个路由生成真实的静态 HTML，
所以深链接返回 HTTP 200；同时生成 'rss.xml' / 'sitemap.xml' / 'robots.txt'。

## 许可

代码以 [MIT](LICENSE) 发布。文章内容版权归作者所有。占位照片来自 Unsplash（Lorem Picsum）。
