---
title: 纯 CSS 像素画：不用一张图片
date: 2026-08-22
tags: [CSS, 像素, 前端]
summary: 用 box-shadow、clip-path 和 steps() 手搓像素风 UI——从按钮的按下反馈，到窗口的缺角边框。
---

像素风的难点从来不是"画得像素"，而是**让整个界面都像素**。只要有一个地方用了圆角或者平滑渐变，整体气质就散了。

这个站点没有一个图片资源是像素画，全部由 CSS 和 Canvas 完成。这里记录几个反复用到的技巧。

## 缺角边框：clip-path + drop-shadow

8 位游戏的对话框从来不是方角，而是**四个角各切掉一小块**。用 CSS 实现只需要两段 polygon：

`@css
:root {
  --notch-out: polygon(
    0 6px, 6px 6px, 6px 0,
    calc(100% - 6px) 0, calc(100% - 6px) 6px, 100% 6px,
    100% calc(100% - 6px), calc(100% - 6px) calc(100% - 6px),
    calc(100% - 6px) 100%, 6px 100%, 6px calc(100% - 6px), 0 calc(100% - 6px)
  );
}
.panel--notch::before {
  content: ''; position: absolute; inset: 0;
  background: var(--line);          /* 边框色 */
  clip-path: var(--notch-out);
}
.panel--notch::after {
  content: ''; position: absolute; inset: 4px;   /* 内缩 = 边框粗细 */
  background: var(--panel);
  clip-path: var(--notch-in);
}
`@

`::before` 是边框层，`::after` 是内容层内缩 4px —— 露出来的那一圈就是"边框"。

关键在于阴影。`box-shadow` 会被 `clip-path` 一起裁掉，所以要用 `filter: drop-shadow()`：

`@css
.panel--notch { filter: drop-shadow(8px 8px 0 var(--shadow)); }
`@

`drop-shadow` 作用在**裁剪之后**的形状上，所以阴影也是缺角的。而且第二个参数 `0` 意味着**零模糊** —— 像素风里不允许有羽化。

## 像素阴影：box-shadow 的硬偏移

普通布局用的是硬边阴影，不需要 clip-path：

`@css
.panel {
  border: 4px solid var(--line);
  box-shadow: 8px 8px 0 0 var(--shadow);   /* 第三个参数 0 = 完全不模糊 */
}
`@

那个 `0` 是整个像素风的灵魂。把它改成 `8px`，立刻变成 2010 年的拟物设计。

## 按下反馈：位移而不是变色

真实世界的按钮被按下时会**往下去**。像素风按钮的反馈也应该如此：

`@css
.btn {
  border: 4px solid var(--btn-edge);
  box-shadow: 4px 4px 0 0 var(--shadow);
  transition: transform 90ms steps(4), box-shadow 90ms steps(4);
}
.btn:active {
  transform: translate(4px, 4px);     /* 正好等于阴影的偏移 */
  box-shadow: 0 0 0 0 var(--shadow);  /* 阴影被"压扁" */
}
`@

注意 `translate` 的距离**必须等于**阴影偏移。按下去的时候按钮正好把阴影完全盖住 —— 视觉上就是"贴到地面了"。

如果距离不匹配，按钮要么悬在半空，要么嵌进地里，都不对。

## steps()：让缓动也像素化

默认的 `ease` 曲线是连续的，会产生"半像素"的中间状态。用 `steps()` 把过渡量化成几格：

`@css
.reveal {
  transition: clip-path 620ms steps(6, end);   /* 6 格，像老式卷帘 */
}
.chip {
  transition: all 90ms steps(3, end);          /* 3 格，硬切换 */
}
`@

`steps(6)` 意味着 620ms 被切成 6 段，每段 103ms，值在段末跳变。视觉上就是**逐格推进**，而不是平滑滑入。

> 格数不要给多。3 到 6 格最像老硬件；给到 20 格以上，人眼已经分辨不出和缓动的区别了。

## 用 conic-gradient 做棋盘底纹

`repeating-conic-gradient` 可以画出完美的棋盘格，用来做"透明区域"的装饰底：

`@css
.term-wrap::after {
  background: repeating-conic-gradient(from 0deg, var(--a4) 0% 25%, transparent 0% 50%) 0 0 / 16px 16px;
  opacity: 0.14;
}
`@

`0% 25%` 和 `0% 50%` 两段硬切，就得到一个 2×2 的棋盘单元。

## 像素字体：用对地方比用得多更重要

`Press Start 2P` 很酷，但它**极宽**，一行放不下几个字。整站用它做正文会是一场灾难。

我的分工是：

| 字体 | 用途 | 字号 |
| --- | --- | --- |
| Press Start 2P | 主标题、数字 | 12–62px |
| Silkscreen | 小标题、按钮、标签 | 11–16px |
| VT323 | 正文 | 17–21px |

VT323 是等宽窄体，在正文尺寸下依然清晰，而且保留了锯齿感 —— 这是它能当正文的关键。

再补一句 `-webkit-font-smoothing: none`，关掉次像素平滑，字形边缘就彻底硬了。

## 别关掉无障碍

`prefers-reduced-motion` 打开时，我让所有 `steps()` 和位移动画退化成一帧：

`@css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
}
`@

像素风是一种**视觉主张**，但它不该以牺牲可用性为代价。彩蛋可以关掉，导航必须好使。

---

CSS 是个被低估的绘图工具。它没有 `fillRect`，但它有 `box-shadow` 和 `clip-path` —— 对像素画来说，这已经够了。
