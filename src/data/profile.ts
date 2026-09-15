/** Everything personal lives here — one file to edit when life changes. */

export const profile = {
  handle: 'ventaoo',
  name: 'VENTAOO',
  title: '像素漫游者',
  location: '杭州',
  email: 'ventaoczu@gmail.com',
  github: 'https://github.com/ventaoo',
  site: 'https://ventaoo.github.io',
  bio: '把想法编译成像素，再让像素动起来。',
  typed: [
    '> 你好，我是 VENTAOO',
    '> 我喜欢把复杂的东西做得简单',
    '> 也喜欢把简单的东西做得有趣',
    '> 正在构建一个小小的像素宇宙',
  ],
  lead:
    '我写代码、做实验、拆解问题。这里是我的数字花园 —— 一个跑在浏览器里的像素空间站，' +
    '记录我做过的项目、踩过的坑，以及那些值得写下来的想法。',
} as const;

export interface Project {
  name: string;
  desc: string;
  lang: string;
  color: string;
  icon: string;
  url: string;
  stars?: number;
  tags: string[];
  year: string;
}

export const projects: Project[] = [
  {
    name: 'zhuanli',
    desc: '面向 3D Gaussian 资产的渲染持久水印：用视角覆盖分组挑选承载视图，再以跨帧纠删码抵抗裁剪与重渲染。',
    lang: 'Python',
    color: 'var(--a4)',
    icon: 'shield',
    url: 'https://github.com/ventaoo/zhuanli',
    tags: ['3DGS', '水印', '纠删码'],
    year: '2026',
  },
  {
    name: 'bilibili_download',
    desc: '交互式 B 站搜索与下载 CLI：搜索、选集、清晰度选择、断点续传，全程键盘流。',
    lang: 'Python',
    color: 'var(--a3)',
    icon: 'arrow-bar-down',
    url: 'https://github.com/ventaoo/bilibili_download',
    stars: 2,
    tags: ['CLI', '爬虫', 'TUI'],
    year: '2026',
  },
  {
    name: 'photocli',
    desc: '轻量级照片管理命令行工具：按时间、地点、相似度整理，重活交给索引，绝不碰你的原图。',
    lang: 'Python',
    color: 'var(--a1)',
    icon: 'image-new',
    url: 'https://github.com/ventaoo/photocli',
    tags: ['CLI', '照片', '索引'],
    year: '2026',
  },
  {
    name: 'CN_teacher',
    desc: '面向中文教学的 Web 应用，用浏览器就能完成一节课的编排与演示。',
    lang: 'TypeScript',
    color: 'var(--a6)',
    icon: 'book-open',
    url: 'https://github.com/ventaoo/CN_teacher',
    tags: ['Web', '教育'],
    year: '2025',
  },
  {
    name: 'SVG-Bert',
    desc: '把 BERT 的序列建模思路搬到矢量图形上：让模型读懂 SVG 的结构与语义。',
    lang: 'Jupyter',
    color: 'var(--a5)',
    icon: 'code',
    url: 'https://github.com/ventaoo/SVG-Bert',
    tags: ['NLP', 'SVG', '研究'],
    year: '2025',
  },
  {
    name: 'VEC_BERT',
    desc: '向量化表示 + BERT 的实验场：探索文本与几何表示之间的对齐方式。',
    lang: 'Jupyter',
    color: 'var(--a2)',
    icon: 'cpu',
    url: 'https://github.com/ventaoo/VEC_BERT',
    tags: ['表征学习', '实验'],
    year: '2026',
  },
];

export const skills = [
  { name: 'Python', level: 88, note: '日常主力' },
  { name: 'TypeScript', level: 78, note: '浏览器里的一切' },
  { name: 'Canvas / WebGL', level: 66, note: '画像素与粒子' },
  { name: 'PyTorch', level: 62, note: '训练与微调' },
  { name: 'CLI 设计', level: 84, note: '键盘流的信徒' },
  { name: '像素美术', level: 58, note: '自学中' },
];

export const timeline = [
  { when: '2026 · NOW', what: '像素空间站上线', desc: '用 Vite + TypeScript + Canvas 从零搭起这个站点，没有框架，没有模板。' },
  { when: '2026', what: '3D Gaussian 水印研究', desc: '设计渲染持久的水印方案，让水印在换视角、裁剪、重渲染之后依然可提取。' },
  { when: '2026', what: 'CLI 工具链', desc: 'bilibili_download 与 photocli —— 两个我每天都在用的命令行工具。' },
  { when: '2025', what: 'SVG-Bert / VEC_BERT', desc: '把语言模型的思路迁移到矢量图形与几何表示上。' },
  { when: '2025', what: 'CN_teacher', desc: '第一个真正意义上「给别人用」的 Web 应用。' },
];

export const uses = [
  { k: '编辑器', v: 'VS Code + Vim 键位，偶尔 Neovim' },
  { k: '终端', v: 'iTerm2 + zsh + 一堆别名' },
  { k: '语言', v: 'Python 写工具，TypeScript 写界面' },
  { k: '字体', v: 'Press Start 2P / Silkscreen / VT323' },
  { k: '配色', v: '自建像素调色板，四个主题随心换' },
  { k: '主机', v: '一台安静的风冷机箱，和它的风扇声' },
];

export const labTiles = [
  { title: '粒子沙盒', desc: '重力、碰撞与像素尘埃', kind: 'particles' },
  { title: '生命游戏', desc: '康威的生命游戏，可交互', kind: 'life' },
  { title: '波形可视化', desc: '把声音画成像素柱', kind: 'wave' },
  { title: '等距地形', desc: '程序化生成的等距地图', kind: 'iso' },
];
