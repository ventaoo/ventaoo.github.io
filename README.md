# VENTAOO · 夜航

> 一本关于代码、生活与想法的私人刊物。
> 暗夜底色、烛光琥珀、Fraunces 高对比衬线 —— 性格来自字体与尺度，不靠装饰。

**线上地址：<https://ventaoo.github.io/>**

---

## 页面

| 路由 | 内容 |
| --- | --- |
| `/` | 卷首：眉题 + 封面大名 + 卷首语 + 近作（最多三篇）+ 联系 |
| `/blog` | 随笔：期号索引（№ 001 · 日期 · 大号衬线标题）+ 搜索 + 标签筛选 |
| `/blog/<slug>` | 正文：首字下沉、放大引文、栏外目次、代码高亮与复制、前后篇 |
| `/about` | 关于：自述 + 联系 + 本站纪事 |

夜（`#12100E`）/ 昼（暖纸）双主题，默认夜，右上角切换；初始主题在首帧前决定，不闪屏。
移动端导航是全屏衬线大字菜单，逐条浮入。

## 改文案只需要动一个文件

**`site.config.ts`** 是整站文案的唯一来源：眉题、卷首语、联系方式、关于页、SEO。

## 写随笔

在 `content/posts/` 放一个 `.md` 文件，文件名就是 URL：

```markdown
---
title: 文章标题
date: 2026-09-20
tags: [随笔]
summary: 一句话摘要。
draft: true   # 草稿：客户端与构建期统一过滤，不会进 RSS / sitemap
---

正文……
```

front-matter 解析只有一处实现（`src/blog/frontmatter.ts`），客户端与构建期共用。

## 设计

| | 夜（默认） | 昼 | 用在哪 |
| --- | --- | --- | --- |
| 底 | `#12100E` | `#F6F1E7` | 纸面 |
| 墨 | `#ECE4D4` | `#211C14` | 正文与标题 |
| 琥珀 | `#E8A33D` | `#B26A10` | 期号、链接、首字、引号 |

- **Fraunces**（可变光学尺寸）：封面大名、标题、引文 —— 斜体轻字重
- **Noto Serif SC**：一切中文正文，unicode-range 分片加载
- **JetBrains Mono**：期号、日期、代码
- 全部字体自托管（fontsource），不依赖任何 CDN

## 技术

Vite 7 + TypeScript，无 UI 框架。主 bundle 约 24 KB；
marked + highlight.js（18 种语言）拆成独立 chunk，仅打开正文时加载。
构建期为每条路由（含卷首与关于）生成真实静态 HTML（meta + `<noscript>` 正文），
并产出 `rss.xml`（全文）、`sitemap.xml`（真实 lastmod）、`robots.txt`。

## 本地开发

```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run build      # 输出到 dist/
npm run preview    # 预览构建结果（端口 4173）
npm run typecheck
```

## 部署

推送到 `main` 即自动部署到 GitHub Pages。

## 许可

代码以 [MIT](LICENSE) 发布。文章内容版权归作者所有。
