# VENTAOO

一本随笔集。整站只有两样东西：**首页是一本书的目录**，每条目录对应一篇随笔；点进去是文章。

内容是 Markdown，推送到 `main` 自动部署到 GitHub Pages。

**怎么加内容 → 看 [`content/posts/how-to-write.md`](content/posts/how-to-write.md)**（这篇也发布在站上，打开 `/blog/how-to-write` 就能读）。

## 设计

刻意避开模板长相，所以没有任何标准零件：**没有 masthead、没有导航条、没有页脚、没有卡片、没有圆角、没有阴影、没有渐变、没有按钮**。版面靠三样东西组织：

1. **字** —— 标题用霞鹜文楷（自托管、按 unicode-range 分片，只下载用到的字），正文 Inter + 系统无衬线，元信息 JetBrains Mono
2. **细线** —— 1px 横向分隔，撑起"一行一行往下读"的节奏
3. **目录** —— 书名居中，然后是「目 录」两字和一行行条目：编号 · 标题 · 虚线引导 · 日期；文章页的日期、时长、标签则挪到左边 7rem 的页边注里

配色只有三样：白纸 `#ffffff`、墨色 `#111214`、一点朱红 `#d8402a`（只用在圆点、编号悬停和链接上）。动效只剩一次 0.4s 淡入和悬停时细线的伸缩，`prefers-reduced-motion` 下全部关闭。

变量都在 `src/styles/tokens.css`，文案都在 `site.config.ts`。

## 页面

| 地址 | 内容 |
| --- | --- |
| `/` | 目录（首页，也是唯一入口） |
| `/blog/<slug>` | 文章 |
| `/blog` | 和首页同一份目录，只为老链接保留 |
| `/about` | 关于页：简介与联系方式。**首页没有任何链接指向它**，只能直接输地址访问 —— 想删掉或者想加入口，改 `src/main.ts` 里的路由即可 |

文章页底部的「← 回到目录」是唯一的返回路径。

## 目录结构

```
content/posts/     随笔，一篇一个 .md
public/            图片丢这里，正文用 /文件名 引用
src/pages/         目录（首页）/ 文章 / 关于
src/styles/        tokens · base · pages · post
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
