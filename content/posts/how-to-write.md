---
title: 这个站怎么加内容
date: 2025-09-20
tags: [说明]
summary: 全部流程：新建一个 Markdown、填四行头部信息、推上去。没有后台，没有编辑器，也不用碰代码。
---

这个站没有后台。加一篇随笔，就是在 `content/posts/` 里新建一个 Markdown 文件；记一趟旅行，就是在 `content/travel/` 里新建一个。写完推送到 `main`，一两分钟后线上就更新了。

## 加一篇随笔

新建 `content/posts/我的标题.md`，**文件名就是网址**：`content/posts/slow-web.md` 对应 `/blog/slow-web`。

文件开头必须有这样一段（前后各三个减号）：

```markdown
---
title: 做一个慢一点的网站
date: 2025-05-11
tags: [网站, 技术]
summary: 列表页和搜索结果里显示的一句话摘要。
---
```

下面是正文，正常写 Markdown 就行：`##` 是二级标题，`**加粗**`、`> 引用`、列表、代码块都支持。

另外两个可选字段：

- `cover: /covers/xxx.jpg` —— 列表里的缩略图和文章顶部的大图；
- `draft: true` —— 写了就只存在本地，不会发布。

## 记一趟旅行

新建 `content/travel/quanzhou.md`，头部信息多几个字段：

```markdown
---
title: 在泉州看石塔
place: 福建 · 泉州
start: 2025-04-05
end: 2025-04-08
cover: /travel/quanzhou-01.jpg
summary: 四天里看了三座石塔、淋了两场雨。
---
```

`place` 会显示成地名，`start` 和 `end` 自动算出天数。

## 图片

图片丢进 `public/` 下面的文件夹（比如 `public/travel/`），正文里用 `/travel/文件名` 引用：

```markdown
![西街的午后，东西塔在巷子尽头](/travel/quanzhou-02.jpg)
```

方括号里的文字会变成图注。**连着放几张图会自动排成图组** —— 一张铺满整栏，两三张并排。图片之间空不空行都行。

## 发布

```bash
git add -A
git commit -m "post: 在泉州看石塔"
git push
```

推上去之后 GitHub Actions 会自动构建并部署到 GitHub Pages。想先在本地看效果，跑 `npm run dev`，打开 `http://127.0.0.1:5173`。

## 改站点本身

站名、首页那几行字、关于页、联系方式，全在 `site.config.ts` 一个文件里。配色和字号在 `src/styles/tokens.css`。这两个文件之外，基本不需要动代码。
