# VENTAOO · 像素空间站

> 一个像素风的个人主页与博客 —— 没有框架，没有图片素材，背景是一整块手写的 Canvas 像素世界。

**线上地址：<https://ventaoo.github.io/>**

---

## 它是什么

一个用来写博客的个人站点。设计目标是「有趣但不吵」：像素风的外观、丰富的交互动画、随滚动变化的视差世界，同时保持可读性和无障碍。

## 特性

### 🎮 像素世界

- 固定背景的 **Canvas 像素渲染器**，内部分辨率仅 200–560px 宽，靠 CSS 最近邻放大成硬边像素
- **九层视差**：天空、星空、日月、云、浮空岛、两层山脊、城市天际线、树木、地面、前景剪影
- 全部程序化生成 —— 没有一张图片。带种子的随机数保证每次刷新看到的是同一座山
- 一个像素小人带着一只猫在地平线上走来走去，四帧走路循环
- 滚动时太阳会划过天空，**阅读进度变成时间流逝**

### ✨ 交互

- **昼夜切换** —— 点天上的太阳，或按 `T`
- **四套配色**：暮色 / 掌机绿 / 蒸汽波 / 琥珀终端（按 `P` 循环）
- **CRT 显像管滤镜**：扫描线、暗角、偶发闪烁，可开关
- **像素光标**：十字准星 + 拖尾点，悬停时变形
- **滚动显现**：逐格推进的像素擦除动画
- **打字机**、**滚动进度条**、**硬阴影按钮**、**缺角面板**
- **自定义终端**：`help`、`whoami`、`neofetch`、`ls`、`cat`、`blog`、`goto`、`theme`、`matrix`、`sudo`…
- **实验室**：四个可交互的 Canvas 实验（粒子沙盒 / 生命游戏 / 波形 / 等距地形）

### 🔊 声音

**没有一个音频文件** —— 全部由 Web Audio 现场合成：

- 方波 / 三角波 / 噪声三种音色
- 悬停轻响、点击音、选中音、金币音、升级琶音、错误蜂鸣
- 可开关的背景芯片音乐（五步音序器）

### 🏆 游戏化

- 滚动阅读赚经验，等级从「像素漫游者」升到「像素之神」
- **8 个成就**：全域漫游、阅读者、入侵终端、古老秘技……
- 存档存在 localStorage，可一键重置
- 输入 `↑↑↓↓←→←→BA` 有惊喜

### 📝 博客

- Markdown + 自写 front-matter 解析
- 标签筛选、全文搜索、目录跟随滚动、阅读进度
- 代码块高亮 + 一键复制
- 相关文章、上一篇 / 下一篇
- 构建时生成 `rss.xml` / `sitemap.xml` / `robots.txt`

## 技术栈

| 层 | 选择 |
| --- | --- |
| 构建 | Vite 7 + TypeScript（**没有 UI 框架**） |
| 图形 | 原生 Canvas 2D |
| 动画 | 单个 `requestAnimationFrame` 调度器（`src/core/ticker.ts`） |
| 音频 | Web Audio 实时合成 |
| 样式 | 原生 CSS + 自定义属性（`src/styles/`） |
| 内容 | Markdown |

**用到的开源库**（刻意保持精简）：

- [pixelarticons](https://github.com/halfmage/pixelarticons) — 像素图标集（MIT）
- [@fontsource](https://fontsource.org/) — Press Start 2P / Silkscreen / VT323 自托管字体
- [nes.css](https://nostalgic-css.github.io/NES.css/) — 复古 CSS 组件（仅 core 部分）
- [marked](https://marked.js.org/) — Markdown 解析
- [highlight.js](https://highlightjs.org/) — 代码高亮

## 本地开发

```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run build      # 输出到 dist/
npm run preview    # 预览构建结果
npm run typecheck  # tsc --noEmit
```

### 视觉 / 功能回归

仓库自带一套无头验证脚本，会在真实 Chromium 里跑完所有路由和交互：

```bash
npm run preview &
npm run verify     # 截图 + ASCII 构图图 + 28 项断言
npm run shot       # 只截图，输出到 shots/
```

## 目录结构

```
content/posts/       Markdown 文章（front-matter：title / date / tags / summary）
src/
  core/              路由、状态存档、音频芯片、终端、快捷键、成就
  fx/                像素世界渲染器、视差、显现、光标、打字机、彩带
  blog/              Markdown 渲染 + 文章集合
  pages/             各页面的 HTML 模板与挂载逻辑
  styles/            设计令牌 + 组件 + 布局 + 特效
  data/profile.ts    ← 想改站点内容，改这里
scripts/             截图与验证工具
```

## 快捷键

| 键 | 作用 |
| --- | --- |
| `T` | 切换昼夜 |
| `C` | 显像管滤镜 |
| `M` | 音效 |
| `B` | 背景音乐 |
| `P` | 切换配色 |
| `/` | 聚焦搜索 |
| `?` | 快捷键面板 |
| `G` 然后 `H/B/P/L/A` | 跳转页面 |

## 部署

推送到 `main` 即自动部署到 GitHub Pages（见 `.github/workflows/deploy.yml`）。

## 许可

代码以 [MIT](LICENSE) 发布。文章内容版权归作者所有。
