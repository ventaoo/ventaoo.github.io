# VENTAOO

个人主页：一些随笔，一些旅途。

静态站点，Vite + TypeScript 手搓，没有 UI 框架，没有第三方运行时脚本。推送到 `main` 自动部署到 GitHub Pages。

## 设计

- **气质**：温暖纸感，像一本翻旧了的旅行笔记
- **配色**：低饱和自然色 —— 苔绿（`--moss`）、砂岩（`--sand`）、雾蓝（`--mist`），亮色为默认，可切暗色
- **字体**：Inter + 系统无衬线，代码用 JetBrains Mono
- **动效**：只有滚动淡入和悬停，尊重 `prefers-reduced-motion`

所有设计变量在 `src/styles/tokens.css`，全站文案在 `site.config.ts`。

## 目录

```
content/posts/     随笔，一篇一个 .md
content/travel/    旅途，一趟一个 .md
public/travel/     旅途照片（现在的图是占位用的 SVG，换成自己的就行）
src/pages/         五个页面：首页 / 随笔 / 文章 / 旅途 / 故事 / 关于
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
summary: 列表页和 SEO 用的一句话摘要。
cover: /travel/cover.jpg   # 可选
draft: true                # 可选，写了就不发布
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

图片放在 `public/travel/` 下，用 `/travel/文件名` 引用。**单独一段只有图片时会自动变成图组**：一张铺满，两三张并排。`![]()` 里的文字会当成图注。

## 改文案

`site.config.ts` 一个文件搞定：站名、首页大标题与开场白、各页标题与简介、关于页、联系方式、SEO。

## 常用命令

```bash
npm install
npm run dev        # 本地开发 http://127.0.0.1:5173
npm run typecheck  # 类型检查（CI 会跑）
npm run build      # 产出 dist/，含每路由 HTML、rss.xml、sitemap.xml
npm run preview    # 预览构建结果
```
