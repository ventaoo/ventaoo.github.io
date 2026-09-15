---
title: photocli：一个照片管理 CLI 的设计取舍
date: 2026-08-26
tags: [CLI, Python, 工具]
summary: 我想要的不是又一个相册应用，而是一个能被脚本调用、绝不碰原图、在十万张照片上依然秒回的命令行工具。
---

市面上的照片管理工具已经够多了。我还是要自己写一个，因为我有三个很具体的要求，它们同时满足的产品我没找到。

## 要求一：绝不修改原图

这是底线。任何"整理"动作都不能碰原始文件，不能改 EXIF，不能重命名。

所以 `photocli` 的全部产出都在一个**旁路目录**里：

`@text
~/Pictures/            ← 原图，只读
└── 2026/08/...
~/.photocli/           ← 全部产出
├── index.db           ← SQLite 索引
├── thumbs/            ← 缩略图缓存
└── albums/            ← 软链接组织
`@

"相册"其实就是一堆软链接。删除相册 = 删一堆链接，原图毫发无伤。这个设计还有一个副作用：**索引可以随时删掉重建**，没有任何不可逆的操作。

## 要求二：交互在索引上，不在文件系统上

十万张照片的目录树，`os.walk` 一次要几十秒。如果把"按日期筛选"、"找相似"这类操作都做成实时遍历，工具就没法用了。

所以第一次运行会建立索引：

`@bash
photocli index ~/Pictures        # 增量扫描，只处理新增和变更
photocli find --from 2026-01 --tag 旅行
photocli similar IMG_4821.jpg    # 找出视觉相似的照片
`@

索引存 SQLite，几个关键决策：

- **用文件的 (路径, mtime, size) 做增量判断** —— 不读内容，快
- **EXIF 只解析一次**，结果落库
- **感知哈希（pHash）在索引阶段就算好**，相似度查询变成一次汉明距离比较，不用重新解码图片

> 用 mtime + size 判断变更有个已知漏洞：有人改了内容但保持了 mtime。这是有意的取舍 —— 换来的是十倍的扫描速度，而且对照片来说这种情况几乎不存在。真要较真，`photocli index --verify` 会强制重新读取。

## 要求三：能被脚本调用

图形界面工具最大的问题是**无法组合**。我想"找出所有 2026 年的横构图照片，压成一份 PDF 发给家人"，GUI 里要点十几次，命令行里就是一行：

`@bash
photocli find --year 2026 --orient landscape --format json \
  | jq -r '.[].path' \
  | xargs -d '\n' img2pdf -o family.pdf
`@

所以每个命令都遵守两条规则：

1. 默认输出**给人看**的表格，带颜色和高亮
2. 加 `--format json` 输出**给程序看**的结构化数据

绝不做"只有人类可读"的输出。

## 一些实现细节

相似照片的查找是最有意思的部分。流程是：

`@python
def phash(path: str, size: int = 8) -> int:
    img = Image.open(path).convert("L").resize((size * 4, size * 4), Image.LANCZOS)
    # 先降到 32x32 再做 DCT，比直接 8x8 稳得多
    pixels = np.asarray(img, dtype=np.float32)
    dct = scipy.fft.dctn(pixels, norm="ortho")[:size, :size]
    # 去掉直流分量，用中位数做阈值
    med = np.median(dct[1:])
    bits = (dct > med).flatten()
    return int("".join("1" if b else "0" for b in bits), 2)
`@

64 位哈希，两张图比较就是一次 XOR + popcount：

`@python
def distance(a: int, b: int) -> int:
    return (a ^ b).bit_count()   # Python 3.10+
`@

经验阈值：`≤ 6` 视觉上几乎一样，`≤ 12` 同一次连拍，`≤ 20` 同一场景。

## 做得不好的地方

诚实地说几点：

- **没有增量索引的并发控制**。两个 terminal 同时跑 `index` 会撞车。目前靠一个文件锁糊过去了事。
- **视频只取了首帧**做哈希。一段视频里镜头会切，首帧并不代表全片。
- **没有撤销栈**。虽然所有操作都在旁路目录、理论上可重建，但一条 `photocli album rm --undo` 还是缺的。

工具嘛，先用起来，再慢慢补。源码在 [GitHub](https://github.com/ventaoo/photocli)。
