# VENTAOO

一本随笔集。首页是目录，点进去是文章。

内容是 Markdown，推送到 `main` 自动部署到 GitHub Pages。

**怎么加内容 → 看 [`content/posts/how-to-write.md`](content/posts/how-to-write.md)**（这篇也发布在站上，打开 `/blog/how-to-write` 就能读）。

## 设计

刻意避开模板长相，所以没有那些标准零件：**没有 masthead、没有吸顶导航、没有卡片、没有圆角、没有阴影、没有渐变、没有按钮**。整站只有随笔，版面靠四样东西组织：

1. **字** —— 标题用霞鹜文楷（自托管、按 unicode-range 分片，只下载用到的字），正文 Inter + 系统无衬线，元信息 JetBrains Mono
2. **细线** —— 1px 横向分隔，撑起"一栏一栏往下读"的节奏
3. **页边注** —— 文章页的日期、时长、标签放在左边 7rem 的窄栏里，正文不被打断
4. **目录** —— 首页就是一份书的目录：书名、副标题、「目录」两字，然后编号 · 标题 · 虚线引导 · 日期一行行排下来

配色只有三样：白纸 `#ffffff`、墨色 `#111214`、一点朱红 `#d8402a`（只用在圆点、编号悬停和链接上）。唯一导航在页脚（目录 / 关于）。动效只剩一次 0.4s 淡入和悬停时细线的伸缩，`prefers-reduced-motion` 下全部关闭。

变量都在 `src/styles/tokens.css`，文案都在 `site.config.ts`。

## 目录结构

```
content/posts/     随笔，一篇一个 .md
public/            图片丢这里，正文用 /文件名 引用
src/pages/         目录（首页）/ 文章 / 关于
src/styles/        tokens · base · chrome · pages · post
src/blog/          front-matter 解析、Markdown 渲染、文章集合
vite.config.ts     构建期静态化：每路由真实 HTML + RSS + sitemap
```

## 常用命令

```bash
npm install
npm run dev        # 本地开发 http://127.0.0.1:5173
npm run typecheck  # 类型检查（CI 会跑）
npm run build      # 产出 dist/，含每路由 HTML、rss.xml、sitemap.xml
npm run preview    # 预览构建结果
```
