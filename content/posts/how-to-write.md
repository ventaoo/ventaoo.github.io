---
title: 这个站怎么加内容
date: 2025-09-20
tags: [说明]
summary: 全部流程：新建一个 Markdown、填四行头部信息、推上去。没有后台，没有编辑器，也不用碰代码。
---

这个站是一本随笔集，首页就是目录。加一篇随笔，就是在 `content/posts/` 里新建一个 Markdown 文件，写完推送到 `main`，一两分钟后线上就更新了。

## 新建一篇

文件名就是网址：`content/posts/slow-web.md` 对应 `/blog/slow-web`。文件开头必须有这样一段（前后各三个减号）：

```markdown
---
title: 做一个慢一点的网站
date: 2025-05-11
tags: [网站, 技术]
summary: 目录里不显示，但搜索结果和 RSS 里会用到。
---
```

下面是正文，正常写 Markdown 就行：`##` 是二级标题，`**加粗**`、`> 引用`、列表、代码块都支持。

两个可选字段：

- `cover: /images/xxx.jpg` —— 目录里会在标题左边多出一个缩略图，文章顶部也会显示；
- `draft: true` —— 写了就只存在本地，不会发布。

## 目录的顺序

目录按日期**从新到旧**自动排，编号也是自动生成的，不用手写。想调整顺序，改 `date` 就行。

## 图片

图片丢进 `public/`（可以建子目录，比如 `public/images/`），正文里用 `/images/文件名` 引用：

```markdown
![西街的午后，东西塔在巷子尽头](/images/quanzhou-02.jpg)
```

方括号里的文字会变成图注。**连着放几张图会自动排成图组** —— 一张铺满整栏，两三张并排。图片之间空不空行都行。

## 发布

```bash
git add -A
git commit -m "post: 做一个慢一点的网站"
git push
```

推上去之后 GitHub Actions 会自动构建并部署到 GitHub Pages。想先在本地看效果，跑 `npm run dev`，打开 `http://127.0.0.1:5173`。

## 改站点本身

书名、副标题、关于页、联系方式，全在 `site.config.ts` 一个文件里。配色和字号在 `src/styles/tokens.css`。这两个文件之外，基本不需要动代码。
