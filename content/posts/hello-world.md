---
title: 第一篇日志
date: 2026-09-15
tags: [公告]
summary: 这里是唯一的示例文章。它同时说明了怎么写新文章、front-matter 有哪些字段，顺便把 Markdown 的各种样式都跑一遍。
---

这是站点里**唯一的一篇文章**，用来占位和演示样式。想写自己的内容，把这个文件删掉就行。

## 怎么写一篇新文章

在 `content/posts/` 目录下新建一个 `.md` 文件，开头写上 front-matter：

`@yaml
---
title: 文章标题
date: 2026-09-15
tags: [标签一, 标签二]
summary: 一句话摘要，会显示在列表页和搜索结果里。
---
`@

文件名就是 URL，比如 `content/posts/my-note.md` 会对应 `/blog/my-note`。

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 文章标题 |
| `date` | 是 | 发布日期，格式 `YYYY-MM-DD`，列表按它倒序排列 |
| `tags` | 否 | 方括号包裹，逗号分隔；会自动生成标签筛选按钮 |
| `summary` | 否 | 列表页和 RSS 里的摘要，不写就自动截取正文 |
| `draft` | 否 | 写 `true` 就不会被发布 |

## 样式都在这儿

正文、**加粗**、*斜体*、[链接](https://github.com/ventaoo)、`行内代码` 都长这样。

> 引用块用来放需要强调的补充说明。
> 可以写多行。

列表：

- 无序列表第一项
- 第二项
  - 还可以嵌套
- 第三项

1. 有序列表
2. 第二项
3. 第三项

行内代码和代码块：

`@ts
// 代码块带语法高亮和一键复制
export function greet(name: string): string {
  return `你好，${name}`;
}
`@

`@python
def fib(n: int) -> int:
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
`@

---

## 部署

写完存盘，`git push` 到 main 分支，GitHub Actions 会自动构建并发布到 GitHub Pages。
