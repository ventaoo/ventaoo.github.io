# VENTAOO · 写作与造物

> 杂志式排版的个人主页 + 博客。宣纸白与墨，朱砂 / 赭石 / 黛青三种颜料，Space Grotesk 配宋体。

**线上地址：<https://ventaoo.github.io/>**

---

## 两个页面

| 路由 | 内容 |
| --- | --- |
| '/' | 首页：正文、联系方式、近作（最多三篇） |
| '/blog' | 日志：搜索 + 标签筛选 |
| '/blog/<slug>' | 文章：栏外目录、代码高亮与复制、上一篇 / 下一篇 |

没有图片、没有设置、没有深色模式 —— 打开就是它该有的样子。

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

  blog: { title: '日志', intro: '……', latestOnHome: 3 },
  seo: { title: '…', description: '…' },
  footerNote: '写作与造物',
  colophon: 'Space Grotesk & EB Garamond 排版',
} as const;
'''

写几段就显示几段，字号完全一样。'latestOnHome' 控制主页「近作」最多列几篇。

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

文件名就是 URL。仓库里目前只有一篇 'hello-world.md'，它同时也是「怎么写文章」的说明，
删掉它就能从零开始。

## 设计

### 纸与颜料

| | 色值 | 用在哪 |
| --- | --- | --- |
| 宣纸 | '#f6f3ea' | 底色 |
| 墨 | '#1b1916' | 正文与标题 |
| 朱砂 | '#a8341f' | 链接、强调、小节前的短线 |
| 黛青 | '#34525e' | 编号 |
| 赭石 | '#8f6520' | 标签 |

### 字体

- **Space Grotesk** 做标题、导航和所有小标签 —— 一款有性格的怪诞体
- **EB Garamond** 做正文的拉丁文，和宋体同属老衬线，混排不打架
- **中文全部落到系统的宋体**（Songti SC / Noto Serif CJK），书卷气来自这里
- **JetBrains Mono** 只用在代码和编号上

字号只有六级，台阶拉开：'58 / 30 / 20 / 17.5 / 15 / 10.5'。主页正文固定在 20px，页面上没有会跳动的大字。

### 版面

- 12 列网格。主页正文占 1–7 列，联系方式挂在右侧 9–12 列；标题与导语一左一右
- 归档是一张真正的表：'№ / 日期 / 标题 / 标签' 四列，表头与表体共用同一套列宽，编号和等宽数字对齐
- 文章正文缩进到第 2 列，栏外目录在第 10–12 列
- 页眉下面是一条 **running head**，左边是当前栏目，右边是坐标

### 细节

所有间距来自一套 4px 的刻度（'--s1' 到 '--s10'），没有临时数字。
线条统一 1px，只有最强的分隔用 2px。中文启用了 'palt' 特性收紧标点。
长 URL 和不可断的长词会强制换行，不会把版面顶破。

### 无障碍

帮助面板是真正的 'role="dialog" aria-modal'：焦点进入、Tab 不逃逸、关闭后归位。
当前栏目带 'aria-current="page"'，筛选按钮暴露 'aria-pressed'，
全部文字在纸色上通过 WCAG AA（最低 4.67:1）。

### 键盘

| 键 | 作用 |
| --- | --- |
| 'G' 'B' | 跳到日志 |
| '/' | 在日志页聚焦搜索框 |
| '?' | 快捷键面板 |
| 'Esc' | 关闭面板 |

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
| CSS | 33 KB |
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
npm run verify     # 截图 + ASCII 构图图 + 42 项断言
npm run shot       # 只截图，输出到 shots/
'''

断言覆盖：字体确实是 Space Grotesk / EB Garamond 且中文落到宋体、页面上没有过大的字、
主页正文段数与内容来自 config 且字号一致、**主页「近作」不超过三篇**、页眉两个入口且
当前项同时有样式和 'aria-current'、帮助面板是真正的 dialog（焦点进入 / Tab 不逃逸 / 关闭归位）、
没有任何设置入口与 toast、筛选按钮的 'aria-pressed' 会同步、归档表列对齐与日期格式、
文章渲染出真正的代码块且带高亮与复制按钮、正文缩进与栏外目录、404、客户端路由、
桌面与手机无横向溢出、以及全部文字在纸色上通过 WCAG AA。

## 目录结构

'''
site.config.ts        ← 全站文案
content/posts/        ← Markdown 文章
src/
  main.ts             启动、chrome 接线、路由注册
  core/               dom / 调度器 / 路由 / 快捷键 / 图标
  fx/                 微动 / 显现
  blog/               Markdown 渲染 + 文章集合 + 归档表
  pages/              home / blog / post
  styles/             tokens · base · components · chrome · pages · blog · fx
scripts/              截图与验证工具
'''

## 部署

推送到 'main' 即自动部署到 GitHub Pages。构建时会为每个路由生成真实的静态 HTML
（正确的 title / description / canonical / Open Graph 以及 '<noscript>' 里的正文），
所以深链接返回 HTTP 200；同时生成 'rss.xml' / 'sitemap.xml' / 'robots.txt'。

## 许可

代码以 [MIT](LICENSE) 发布。文章内容版权归作者所有。
