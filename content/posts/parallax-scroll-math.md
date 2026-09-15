---
title: 视差滚动的数学：把深度写进滚动里
date: 2026-09-11
tags: [前端, 动画, 数学]
summary: 视差不是"让元素动起来"，而是让每个元素按自己的深度动起来。一篇关于映射、阻尼和性能的笔记。
---

视差滚动（parallax scrolling）这个词来自 2D 游戏：远处的山移动得慢，近处的草移动得快，大脑就自动补出了一个"深度"。

搬到网页上，公式简单到只有一行：

`@js
element.style.transform = translateY(-scrollY * factor);
`@

`factor` 就是这一层的深度。0 表示贴在视口上完全不动，1 表示和内容一起滚（也就是正常文档流），大于 1 表示跑得比内容还快 —— 那是"前景"。

## 深度不是随便挑的

如果你只是给每层随手写个 0.3、0.5、0.8，画面会显得很吵。真正好看的关键是**层与层之间的差值要均匀**。

我的做法是先定最远和最近两端，中间线性插值：

`@js
const NEAR = 0.52;  // 前景剪影
const FAR  = 0.04;  // 天空
const depth = (i, total) => FAR + (NEAR - FAR) * (i / (total - 1));
`@

九层摊下来，每层差 0.06 左右。相邻层的速度差足够小，眼睛就不会觉得"跳"，但累积起来又是完整的纵深。

## 直接用 scrollY 的三个问题

第一版我直接读 `window.scrollY` 写进 `transform`，立刻踩了三个坑。

**坑一：移动端地址栏**。iOS Safari 滚动时地址栏会收起，`innerHeight` 变化会让整个计算抖一下。

**坑二：滚动事件比帧还密**。滚动事件在某些设备上每帧能触发好几次，每次都写 DOM 就是纯粹的浪费。

**坑三：被动滚动时的卡顿**。在主线程里同步读写布局，会强制浏览器反复重排。

解决办法是**把读写分离**：滚动事件什么都不做，只让一个全局的 `requestAnimationFrame` 循环去读 `scrollY` 并批量写样式。

`@js
addTick((dt, _t, scrollY) => {
  for (const n of pxNodes) {
    const target = scrollY * n.y;
    // smooth > 0 时可以加阻尼，做出"追上来"的感觉
    n.cur = n.smooth > 0 ? n.cur + (target - n.cur) * n.smooth : target;
    n.el.style.transform = 'translate3d(0,' + (-n.cur).toFixed(2) + 'px,0)';
  }
});
`@

注意 `toFixed(2)`：不保留小数，浏览器会写出超长浮点数字符串，白白增加样式重算的开销。

## 阻尼：让元素"追"过来

给某层加一点阻尼，它就**永远追不上**目标位置，形成一种滑腻的延迟感：

`@js
n.cur += (target - n.cur) * 0.12; // 每帧走 12% 的差距
`@

这是一阶低通滤波。系数越小追得越慢，"分量感"越重。这个站点里的浮空岛和粒子都用了它，滚动时会感到它们比页面"重"一点。

## 用鼠标做第二轴

滚动只给了垂直方向的深度。再叠加一点鼠标位移，画面立刻就"活"了：

`@js
window.addEventListener('pointermove', (ev) => {
  pointerX = (ev.clientX / innerWidth - 0.5) * 2;   // -1 → 1
  pointerY = (ev.clientY / innerHeight - 0.5) * 2;
}, { passive: true });
`@

系数给到 2～6 像素就够了。给多了会晕，给少了看不出来。

> 前提是 `prefers-reduced-motion` 没有开启。这一点不是可选项 —— 前庭功能敏感的人会因为这种位移真的难受。

## 别忘了无障碍

`@js
export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
`@

我在三个地方查了这个值：

1. **视差**：完全关闭鼠标位移，滚动系数也降到很小
2. **滚动显现**：直接给所有元素加上 `in` 类，跳过动画
3. **打字机**：一次性把文字显示完，不再逐字吐

动画是锦上添花，不是必需品。把它关掉之后，这个站点应该**依然完整可用**。

## 顺手做出来的两个效果

视差引擎写完之后，我发现稍加改造就能白捡两个效果。

一是**滚动进度条**：把整页进度 `scrollY / (docHeight - innerHeight)` 映射成宽度就行。

二是**太阳的弧线**。同一个进度值，映射到一条正弦曲线上：

`@js
const t = clamp(0.06 + progress * 0.86, 0, 1);
const x = W * 0.08 + t * W * 0.8;
const y = horizon * 0.78 - Math.sin(t * Math.PI) * horizon * 0.62;
`@

于是你往下读的时候，太阳会从左到右划过天空，最后落下。**阅读进度变成了时间流逝** —— 这是这个站点里我最喜欢的一个细节。

---

视差滚动的全部秘密就是：一个乘法，一个 `sin`，和一点点对"慢"的耐心。
