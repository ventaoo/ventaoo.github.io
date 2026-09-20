# VENTAOO

一本随笔集。整站只有两样东西：**首页是一本书的目录**，每条目录对应一篇随笔；点进去是文章。

内容是 Markdown，推送到 `main` 自动部署到 GitHub Pages。

**怎么加内容 → 看 [`content/posts/how-to-write.md`](content/posts/how-to-write.md)**（这篇也发布在站上，打开 `/blog/how-to-write` 就能读）。

## 设计

整站没有任何标准零件：**没有 masthead、没有导航条、没有页脚、没有卡片、没有圆角、没有阴影、没有渐变、没有按钮**，源码里连一个 `<header>` / `<footer>` 标签都没有。

版面靠三样东西组织：

1. **字** —— 标题用霞鹜文楷（自托管、按 unicode-range 分片，只下载用到的字），正文 Inter + 系统无衬线，元信息 JetBrains Mono
2. **细线** —— 1px 横向分隔，撑起"一行一行往下读"的节奏
3. **目录** —— 书名居中，然后是「目 录」和一行行条目：编号 · 标题 · 虚线引导 · 日期

### 信息都在目录里

需要出现的信息没有被删掉，而是被排进了目录本身（像书末的版权行）：

```
        VENTAOO
   把日子写成可以重读的样子
        在杭州写的字

        目　录

01  这个站怎么加内容 ·················  2025.09.20
──────────────────────────────────────────────
     关于 · GitHub · Email · RSS
        © VENTAOO · 杭州
```

文章页则把日期、阅读时长、标签放在左边 7rem 的**页边注**里，页边注最上面一行是「← 目录」，看完在底部还有一次「回到目录」。

配色只有三样：白纸 `#ffffff`、墨色 `#111214`、一点朱红 `#d8402a`。

### 动效

只有一次 0.4s 的淡入和悬停时细线的伸缩，而且**每个页面只播一次**：浏览器前进/后退、或者再次打开看过的页面时，内容直接就是最终状态，不会重播动画（路由把"看过的路径"记下来，重访时给容器挂 `.no-anim`，过渡直接失效）。`prefers-reduced-motion` 下全部关闭。

变量都在 `src/styles/tokens.css`，文案都在 `site.config.ts`。

## 页面

| 地址 | 内容 |
| --- | --- |
| `/` | 目录：书名 + 全部随笔 + 版权行 |
| `/blog/<slug>` | 文章 |
| `/blog` | 和首页同一份目录，只为老链接保留 |
| `/about` | 关于：简介与联系方式（从目录末尾的版权行进） |

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
