import { defineConfig, type Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

const SITE = 'https://ventaoo.github.io';

interface FeedItem {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  body: string;
}

/** Read the markdown posts at build time so the feed, sitemap and prerendered
 *  route files all stay in sync with the content. */
function readPosts(): FeedItem[] {
  const dir = path.resolve(__dirname, 'content/posts');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const fm = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
      const data: Record<string, string> = {};
      if (fm) {
        for (const line of fm[1].split(/\r?\n/)) {
          const i = line.indexOf(':');
          if (i > 0) data[line.slice(0, i).trim()] = line.slice(i + 1).trim();
        }
      }
      return {
        slug: file.replace(/\.md$/, ''),
        title: data.title ?? file,
        date: data.date ?? '2026-01-01',
        summary: data.summary ?? '',
        tags: (data['tags'] ?? '')
          .replace(/^\[|\]$/g, '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        body: fm ? raw.slice(fm[0].length) : raw,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

const xml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = (s: string) => s.replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * GitHub Pages serves a static file per path. A pure SPA would answer every
 * deep link with an HTTP 404 (via 404.html), which stops search engines from
 * indexing anything but "/". So we emit a real `index.html` for every route
 * with its own title, meta description and a <noscript> body containing the
 * actual content — HTTP 200, correct previews, and something readable if JS
 * never runs. The client router replaces #view on load either way.
 */
function renderShell(
  shell: string,
  opts: { title: string; description: string; content: string; url: string; type?: string },
): string {
  let html = shell;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${attr(opts.title)}</title>`);
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${attr(opts.description)}" />`,
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${attr(opts.title)}" />`,
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${attr(opts.description)}" />`,
  );
  html = html.replace(
    /<meta property="og:type" content="[^"]*" \/>/,
    `<meta property="og:type" content="${opts.type ?? 'website'}" />\n    <meta property="og:url" content="${opts.url}" />\n    <link rel="canonical" href="${opts.url}" />`,
  );
  return html.replace(
    '<main id="view" class="view"></main>',
    `<main id="view" class="view"><noscript><div class="nojs">${opts.content}</div></noscript></main>`,
  );
}

const NOJS_CSS = `<style>
  .nojs{max-width:760px;margin:0 auto;padding:88px 20px 64px;font-family:ui-monospace,Menlo,monospace;
    line-height:1.7;color:#e9e7fb;background:#0a0a16}
  .nojs a{color:#8ee9e6}
  .nojs h1{font-size:26px;margin:0 0 8px}
  .nojs h2{font-size:19px;margin:32px 0 10px;border-top:3px solid #3b3b78;padding-top:14px}
  .nojs p,.nojs li{color:#c9c6e6}
  .nojs ul{padding-left:20px}
  .nojs code{background:#20204a;padding:1px 5px}
  .nojs pre{background:#101024;border:3px solid #3b3b78;padding:12px;overflow-x:auto}
</style>`;

function staticSitePlugin(): Plugin {
  return {
    name: 'pixelverse-static',
    apply: 'build',
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist');
      const shell = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
      const items = readPosts();
      const write = (route: string, html: string) => {
        const dir = route === '/' ? dist : path.join(dist, route);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'index.html'), html);
      };
      // GitHub Pages answers the trailing-slash URL with 200 and 301s the bare
      // path, so the canonical form is the one with the slash (root excepted).
      const url = (route: string) => SITE + (route === '/' ? '/' : `/${route}/`);
      const page = (route: string, title: string, description: string, content: string, type = 'website') =>
        renderShell(shell, {
          title,
          description,
          content: NOJS_CSS + content,
          url: url(route),
          type,
        });

      // ── article pages: real content in the HTML source ──
      for (const p of items) {
        const body = marked.parse(p.body, { async: false, gfm: true }) as string;
        const route = `blog/${p.slug}`;
        write(
          route,
          page(
            route,
            `${p.title} · VENTAOO`,
            p.summary,
            `<h1>${p.title}</h1><p><small>${p.date} · ${p.tags.join(' / ')}</small></p>${body}
             <p><a href="/blog/">← 返回日志归档</a></p>`,
            'article',
          ),
        );
      }

      // ── index pages ──
      write(
        'blog',
        page(
          'blog',
          '日志归档 · VENTAOO',
          `共 ${items.length} 篇日志：像素艺术、Canvas 渲染、Web Audio、视差滚动与命令行工具。`,
          `<h1>日志归档</h1><ul>${items
            .map(
              (p) =>
                `<li><a href="/blog/${p.slug}">${p.title}</a> — <small>${p.date}</small><br>${p.summary}</li>`,
            )
            .join('')}</ul>`,
        ),
      );

      const projectList = [
        ['zhuanli', '面向 3D Gaussian 资产的渲染持久水印'],
        ['bilibili_download', '交互式 B 站搜索与下载 CLI'],
        ['photocli', '轻量级照片管理命令行工具'],
        ['CN_teacher', '面向中文教学的 Web 应用'],
        ['SVG-Bert', '把 BERT 的序列建模思路搬到矢量图形上'],
        ['VEC_BERT', '向量化表示与 BERT 的实验场'],
      ];
      write(
        'projects',
        page(
          'projects',
          '项目 · VENTAOO',
          '开源项目：3D Gaussian 水印、命令行工具、模型实验。',
          `<h1>项目档案</h1><ul>${projectList
            .map(([n, d]) => `<li><a href="${SITE.replace(/\/$/, '')}/${n}">${n}</a> — ${d}</li>`)
            .join('')}</ul>`,
        ),
      );

      write(
        'about',
        page(
          'about',
          '关于 · VENTAOO',
          '关于 VENTAOO：杭州，写代码、做实验、拆解问题。这个站点是手工搭建的像素世界。',
          `<h1>关于我</h1><p>我是 VENTAOO，现在在杭州。白天写代码解决问题，晚上写代码制造问题。</p>
           <p>邮箱 <a href="mailto:ventaoczu@gmail.com">ventaoczu@gmail.com</a> ·
              代码在 <a href="https://github.com/ventaoo">GitHub</a>。</p>`,
        ),
      );

      write(
        'lab',
        page(
          'lab',
          '实验室 · VENTAOO',
          '四个跑在原生 Canvas 上的小实验：粒子沙盒、生命游戏、波形可视化、等距地形。',
          `<h1>实验室</h1><p>四个跑在原生 Canvas 上的小玩具，全部可交互：粒子沙盒、生命游戏、波形可视化、等距地形。</p>`,
        ),
      );

      // ── feed + sitemap ──
      const now = new Date().toUTCString();
      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>VENTAOO · 像素空间站</title>
    <link>${SITE}/</link>
    <description>像素风个人主页与博客：代码、实验与想法。</description>
    <language>zh-CN</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
${items
  .map(
    (p) => `    <item>
      <title>${xml(p.title)}</title>
      <link>${SITE}/blog/${p.slug}</link>
      <guid isPermaLink="true">${SITE}/blog/${p.slug}</guid>
      <pubDate>${new Date(p.date + 'T00:00:00Z').toUTCString()}</pubDate>
      <description>${xml(p.summary)}</description>
${p.tags.map((t) => '      <category>' + xml(t) + '</category>').join('\n')}
    </item>`,
  )
  .join('\n')}
  </channel>
</rss>
`;

      const urls = ['/', '/blog/', '/projects/', '/lab/', '/about/', ...items.map((p) => '/blog/' + p.slug + '/')];
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${SITE}${u === '/' ? '/' : u}</loc>${u === '/' ? '' : `<lastmod>${items.find((p) => u.includes(p.slug))?.date ?? new Date().toISOString().slice(0, 10)}</lastmod>`}<changefreq>${u === '/' ? 'weekly' : 'monthly'}</changefreq></url>`,
  )
  .join('\n')}
</urlset>
`;

      fs.writeFileSync(path.join(dist, 'rss.xml'), rss);
      fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
      fs.writeFileSync(
        path.join(dist, 'robots.txt'),
        'User-agent: *\nAllow: /\n\nSitemap: ' + SITE + '/sitemap.xml\n',
      );

      this.info(
        `static: ${items.length + 4} route files · rss.xml · sitemap.xml · robots.txt (${items.length} posts)`,
      );
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [staticSitePlugin()],
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
  server: { port: 5173, host: '127.0.0.1' },
});
