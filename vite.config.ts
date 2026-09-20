import { defineConfig, type Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import { site, SITE_URL } from './site.config';
import { toPost, type ParsedPost } from './src/blog/frontmatter';

/**
 * 构建期静态化：
 * 为每条路由生成真实的 index.html（title / description / canonical / OG +
 * <noscript> 里的正文），同时产出 rss.xml（全文）、sitemap.xml、robots.txt。
 *
 * front-matter 解析复用 src/blog/frontmatter.ts —— 与客户端同一处真相，
 * 草稿（draft: true）在这里同样被过滤，不会泄漏到线上。
 */

function readPosts(): ParsedPost[] {
  const dir = path.resolve(__dirname, 'content/posts');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => toPost(file.replace(/\.md$/, ''), fs.readFileSync(path.join(dir, file), 'utf8')))
    .filter((p) => !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

const xml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = (s: string) => s.replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** index.html 里的占位符，用 split/join 替换 —— 不依赖任何属性书写顺序。 */
function renderShell(
  shell: string,
  opts: { title: string; description: string; content: string; url: string; type?: string },
): string {
  const meta =
    `<meta property="og:url" content="${opts.url}" />` +
    `\n    <link rel="canonical" href="${opts.url}" />`;
  return shell
    .split('@@TITLE@@').join(attr(opts.title))
    .split('@@DESC@@').join(attr(opts.description))
    .split('<!--@@META@@-->').join(meta)
    .split('@@CONTENT@@').join(`<noscript><div class="nojs">${opts.content}</div></noscript>`);
}

/** og:type 的占位符在 index.html 里已有一个固定值 website，需要按路由换掉。 */
function fixOgType(html: string, type: string): string {
  return html.replace('<meta property="og:type" content="website" />', `<meta property="og:type" content="${type}" />`);
}

/** no-JS / 爬虫视图的兜底样式 —— 暖纸底、衬线、琥珀链接。 */
const NOJS_CSS = `<style>
  .nojs{max-width:680px;margin:0 auto;padding:88px 24px 64px;background:#f6f1e7;color:#52493a;
    font-family:Georgia,'Songti SC','Noto Serif CJK SC',serif;line-height:1.9;font-size:17px}
  .nojs a{color:#b26a10}
  .nojs h1{font-size:32px;font-weight:500;font-style:italic;color:#211c14;margin:0 0 6px;line-height:1.2}
  .nojs h2{font-size:22px;font-weight:500;color:#211c14;margin:34px 0 10px;padding-top:14px;
    border-top:1px solid #ddd3c0}
  .nojs h3{font-size:18px;color:#211c14;margin:24px 0 8px}
  .nojs p,.nojs li{color:#52493a}
  .nojs small,.nojs .dim{color:#8b7f6a}
  .nojs ul,.nojs ol{padding-left:22px}
  .nojs blockquote{margin:18px 0;padding-left:18px;border-left:2px solid #b26a10;font-style:italic}
  .nojs code{background:#ece5d5;border:1px solid #ddd3c0;border-radius:3px;padding:1px 6px;font-size:14px}
  .nojs pre{background:#ece5d5;border:1px solid #ddd3c0;border-radius:4px;padding:14px;overflow-x:auto}
  .nojs pre code{background:none;border:0;padding:0}
</style>`;

function staticSitePlugin(): Plugin {
  return {
    name: 'vx-static',
    apply: 'build',
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist');
      const shell = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
      const items = readPosts();

      const url = (route: string) => SITE_URL + (route === '/' ? '/' : `/${route}/`);
      const page = (route: string, title: string, description: string, content: string, type = 'website') => {
        let html = renderShell(shell, { title, description, content: NOJS_CSS + content, url: url(route), type });
        if (type !== 'website') html = fixOgType(html, type);
        return html;
      };

      const write = (route: string, html: string) => {
        const dir = path.join(dist, route);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'index.html'), html);
      };

      /* ── 首页：宣言 + 正文 + 联系 + 近作 —— 最重要的页面也有静态内容 ── */
      const homeIntro = `<p>${site.kicker}</p>`;
      const homeLinks = `<ul>${site.links.map((l) => `<li><a href="${attr(l.href)}">${l.label}</a></li>`).join('')}</ul>`;
      const homeLatest = items.length
        ? `<h2>近作</h2><ul>${items
            .slice(0, site.blog.latestOnHome)
            .map((p) => `<li><a href="/blog/${p.slug}/">${p.title}</a> — <small>${p.date}</small><br>${p.summary}</li>`)
            .join('')}</ul>`
        : '';
      write(
        '',
        page(
          '',
          site.seo.title,
          site.seo.description,
          `<h1>${site.name}</h1><p><em>${site.lead}</em></p>${homeIntro}${homeLinks}${homeLatest}`,
        ),
      );

      /* ── 日志列表 ── */
      write(
        'blog',
        page(
          'blog',
          `${site.blog.title} · ${site.name}`,
          site.blog.intro,
          items.length
            ? `<h1>${site.blog.title}</h1><ul>${items
                .map((p) => `<li><a href="/blog/${p.slug}/">${p.title}</a> — <small>${p.date}</small><br>${p.summary}</li>`)
                .join('')}</ul>`
            : `<h1>${site.blog.title}</h1><p>还没有文章。</p>`,
        ),
      );

      /* ── 关于 ── */
      write(
        'about',
        page(
          'about',
          `${site.about.title} · ${site.name}`,
          site.about.paragraphs[0] ?? site.seo.description,
          `<h1>${site.about.title}</h1>${site.about.paragraphs.map((p) => `<p>${p}</p>`).join('')}${homeLinks}`,
        ),
      );

      /* ── 文章 ── */
      for (const p of items) {
        const body = marked.parse(p.body, { async: false, gfm: true }) as string;
        const route = `blog/${p.slug}`;
        write(
          route,
          page(
            route,
            `${p.title} · ${site.name}`,
            p.summary,
            `<h1>${p.title}</h1><p><small>${p.date} · ${p.tags.join(' / ')}</small></p>${body}
             <p><a href="/blog/">← 返回${site.blog.title}</a></p>`,
            'article',
          ),
        );
      }

      /* ── RSS：全文输出（content:encoded）── */
      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${xml(site.seo.title)}</title>
    <link>${SITE_URL}/</link>
    <description>${xml(site.seo.description)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items
  .map((p) => {
    const html = marked.parse(p.body, { async: false, gfm: true }) as string;
    return `    <item>
      <title>${xml(p.title)}</title>
      <link>${SITE_URL}/blog/${p.slug}/</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${p.slug}/</guid>
      <pubDate>${new Date(p.date + 'T00:00:00Z').toUTCString()}</pubDate>
      <description>${xml(p.summary)}</description>
      <content:encoded><![CDATA[${html.replace(/]]>/g, ']]]]><![CDATA[>')}]]></content:encoded>
${p.tags.map((t) => '      <category>' + xml(t) + '</category>').join('\n')}
    </item>`;
  })
  .join('\n')}
  </channel>
</rss>
`;

      /* ── sitemap：lastmod 用真实日期，不拿构建日冒充 ── */
      const latestPostDate = items[0]?.date;
      const urls: { loc: string; lastmod?: string }[] = [
        { loc: '/', lastmod: latestPostDate },
        { loc: '/blog/', lastmod: latestPostDate },
        { loc: '/about/', lastmod: latestPostDate },
        ...items.map((p) => ({ loc: `/blog/${p.slug}/`, lastmod: p.date })),
      ];
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${SITE_URL}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<changefreq>${u.loc === '/' ? 'weekly' : 'monthly'}</changefreq></url>`,
  )
  .join('\n')}
</urlset>
`;

      fs.writeFileSync(path.join(dist, 'rss.xml'), rss);
      fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
      fs.writeFileSync(path.join(dist, 'robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: ' + SITE_URL + '/sitemap.xml\n');

      this.info(`static: ${items.length + 3} route files · rss.xml(full-text) · sitemap.xml · robots.txt`);
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
