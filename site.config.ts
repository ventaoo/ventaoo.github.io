/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  站点配置                                                            ║
 * ║  改这一个文件就能改掉整站文案 —— 不需要动任何组件代码。               ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

export const site = {
  /* ── 身份 ─────────────────────────────────────────────────────────── */

  /** 站点名，显示在页眉左上角 */
  name: 'VENTAOO',
  /** 名字后面跟的后缀，不想要就写空字符串 '' */
  suffix: '',
  /** 页眉第二行右侧的坐标 */
  status: '杭州 · 二〇二六',

  /* ── ★ 主页那句自述（轮流淡入，直接改这里）─────────────────────────── */

  lines: [
    '把想法编译成像素。',
    '白天写代码解决问题，晚上写代码制造问题。',
    '喜欢把复杂的东西做简单，把简单的东西做有趣。',
    '正在构建一个小小的宇宙。',
  ],

  /** 自述下面的一段介绍 */
  bio: '我是 VENTAOO，现在在杭州。这里是我的数字花园 —— 记录做过的项目、踩过的坑，以及那些值得写下来的想法。',

  /* ── 联系方式（显示在主页左侧栏，想删哪个就整行删掉）──────────────── */

  links: [
    { label: 'GitHub', value: 'github.com/ventaoo', href: 'https://github.com/ventaoo' },
    { label: 'Email', value: 'ventaoczu@gmail.com', href: 'mailto:ventaoczu@gmail.com' },
    { label: 'RSS', value: '/rss.xml', href: '/rss.xml' },
  ],

  /* ── 博客 ─────────────────────────────────────────────────────────── */

  blog: {
    /** 列表页大标题 */
    title: '日志',
    /** 标题右侧的一句话 */
    intro: '写代码时踩过的坑、想明白的道理，以及一些纯粹因为好玩才做的事。',
    /** 主页「近作」区块展示几篇 */
    latestOnHome: 6,
  },

  /* ── SEO ──────────────────────────────────────────────────────────── */

  seo: {
    title: 'VENTAOO · 写作与造物',
    description: 'VENTAOO 的个人主页与博客：代码、实验与想法。',
  },

  footerNote: '写作与造物',
  colophon: 'Archivo & Inter 排版',
} as const;

/* ── 照片 ───────────────────────────────────────────────────────────────
   把图片放进 public/images/，然后在这里登记。留空数组就不显示这个区块。

     { src: '/images/desk.jpg', caption: '书桌', alt: '一张书桌', span: 6 },

   span 是它占几列（12 列网格），可选 4 / 6 / 8 / 12。                        */

export interface Photo {
  src: string;
  caption?: string;
  alt?: string;
  span?: 4 | 6 | 8 | 12;
}

export const photos: Photo[] = [];

/** 站点部署地址（用于 RSS / sitemap / canonical） */
export const SITE_URL = 'https://ventaoo.github.io';

/** 每页 <html lang> 与日期格式 */
export const LOCALE = 'zh-CN';
