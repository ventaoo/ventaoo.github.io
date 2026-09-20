# VENTAOO

个人主页：一些随笔，一些旅途。

静态站点，Vite + TypeScript 手搓，没有 UI 框架，没有第三方运行时脚本。推送到 `main` 自动部署到 GitHub Pages。

## 设计

- **气质**：明亮、干净、有体温的个人主页 —— 不是杂志，也不是作品集
- **配色**：近白底 `#fbfaf9` + 墨色字，一个珊瑚红 `#f0532f` 做点缀；首页顶部一层很淡的彩色光晕是唯一的装饰
- **字体**：标题用**霞鹜文楷**（按 unicode-range 分片自托管，浏览器只下载用到的字），正文 Inter + 系统无衬线，日期与元信息 JetBrains Mono
- **版式**：卡片与 Bento 网格，照片直接参与排版；随笔不是"日期 + 标题"的清单
- **动效**：只有一次淡入、悬停微交互，以及文章页顶部那根阅读进度条；`prefers-reduced-motion` 下全部关闭
- **主题**：只有一个亮色主题，没有暗色开关

变量都在 `src/styles/tokens.css`，全站文案在 `site.config.ts`。

## 目录

```
content/posts/     随笔，一篇一个 .md
content/travel/    旅途，一趟一个 .md
public/travel/     旅途照片（现在是占位 SVG，换成自己的）
public/covers/     随笔封面（同上）
src/pages/         首页 / 随笔 / 文章 / 旅途 / 故事 / 关于
src/styles/        tokens · base · chrome · pages · post
src/blog/          front-matter 解析、Markdown 渲染、两个集合
vite.config.ts     构建期静态化：每路由真实 HTML + RSS + sitemap
```

## 写一篇随笔

新建 `content/posts/my-post.md`，文件名就是网址 `/blog/my-post`：

```markdown
---
title: 标题
date: 2025-08-24
tags: [写作, 方法]
cover: /covers/writing.svg   # 可选，卡片和文章顶部用
summary: 列表页和 SEO 用的一句话摘要。
draft: true                  # 可选，写了就不发布
---

正文……
```

## 记一趟旅行

新建 `content/travel/quanzhou-2025.md`，网址是 `/travel/quanzhou-2025`：

```markdown
---
title: 在泉州看石塔
place: 福建 · 泉州
start: 2025-04-05
end: 2025-04-08
cover: /travel/quanzhou-01.jpg
summary: 一句话摘要。
---

正文……

![图片说明](/travel/quanzhou-02.jpg)
```

图片放在 `public/travel/` 下，用 `/travel/文件名` 引用。**连续几张图会自动排成图组**（一张铺满、两三张并排），`![]()` 里的文字会当成图注 —— 图片之间空不空行都行。

## 换成自己的样子

- **头像**：照片丢进 `public/`，然后在 `site.config.ts` 里写 `hero.avatar: '/me.jpg'`；留空就显示一个字母 V。
- **照片**：现在 `public/travel/` 和 `public/covers/` 里是程序生成的占位 SVG，直接删掉换成自己的 JPG 即可（记得同步改 front-matter 里的路径）。
- **文案**：`site.config.ts` 一个文件搞定 —— 站名、首页问候与开场白、状态标签、各页标题与简介、关于页、联系方式、SEO。

## 常用命令

```bash
npm install
npm run dev        # 本地开发 http://127.0.0.1:5173
npm run typecheck  # 类型检查（CI 会跑）
npm run build      # 产出 dist/，含每路由 HTML、rss.xml、sitemap.xml
npm run preview    # 预览构建结果
```
