import { defineConfig, type Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import { site, SITE_URL } from './site.config';
import { dateRange, toPost, toTrip, type ParsedPost, type ParsedTrip } from './src/blog/frontmatter';

/** 与 src/blog/markdown.ts 同一套规则：连续的单图段落合成图组。 */
const groupImages = (md: string) => md.replace(/(!\[[^\]]*\]\([^)]*\))[ \t]*\n[ \t]*\n(?=!\[)/g, '$1\n');

/**
 * 构建期静态化：
 * 为每条路由生成真实的 index.html（title / description / canonical / OG +
 * <noscript> 里的正文），同时产出 rss.xml（全文）、sitemap.xml、robots.txt。
 *
 * front-matter 解析复用 src/blog/frontmatter.ts —— 与客户端同一处真相，
 * 草稿（draft: true）在这里同样被过滤，不会泄漏到线上。
 */

function readCollection<T>(
  dir: string,
  make: (slug: string, raw: string) => T,
): T[] {
  const abs = path.resolve(__dirname, dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith('.md'))
    .map((f) => make(f.replace(/\.md$/, ''), fs.readFileSync(path.join(abs, f), 'utf8')))
    .filter((item) => !(item as { draft?: boolean }).draft)
    .sort((a, b) => {
      const ka = ((a as ParsedPost).date ?? (a as ParsedTrip).start) as string;
      const kb = ((b as ParsedPost).date ?? (b as ParsedTrip).start) as string;
      return ka < kb ? 1 : ka > kb ? -1 : 0;
    });
}

const readPosts = () => readCollection('content/posts', toPost);
const readTrips = () => readCollection('content/travel', toTrip);

const xml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = (s: string) => s.replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** index.html 里的占位符，用 split/join 替换 —— 不依赖任何属性书写顺序。 */
function renderShell(
  shell: string,
  opts: { title: string; description: string; content: string; url: string },
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

/** og:type 在 index.html 里已有一个固定值 website，按路由换掉。 */
function fixOgType(html: string, type: string): string {
  return html.replace(
    '<meta property="og:type" content="website" />',
    `<meta property="og:type" content="${type}" />`,
  );
}

/** 没有 JS 的老浏览器 / 爬虫看到的样子：同一套纸色与苔绿。 */
const NOJS_CSS = `<style>
  .nojs{max-width:46rem;margin:0 auto;padding:80px 24px 64px;background:#fbfaf9;color:#17181a;
    font-family:'LXGW WenKai',Inter,-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;line-height:1.85;font-size:17px}
  .nojs a{color:#c33d1c}
  .nojs h1{font-size:34px;font-weight:640;letter-spacing:-.02em;margin:0 0 12px;line-height:1.15;color:#17181a}
  .nojs h2{font-size:20px;font-weight:600;margin:38px 0 10px;padding-top:16px;border-top:1px solid #e8e6e2}
  .nojs h3{font-size:17px;font-weight:600;margin:26px 0 8px}
  .nojs p,.nojs li{color:#575c64}
  .nojs small,.nojs .dim{color:#676c60}
  .nojs ul,.nojs ol{padding-left:22px}
  .nojs blockquote{margin:18px 0;padding-left:16px;border-left:2px solid #8a5f36;color:#575c64}
  .nojs code{background:#f5f4f1;border-radius:4px;padding:1px 6px;font-size:14px}
  .nojs pre{background:#f5f4f1;border-radius:8px;padding:14px;overflow-x:auto}
  .nojs pre code{background:none;padding:0}
  .nojs img{max-width:100%;border-radius:8px}
  .nojs table{border-collapse:collapse}
  .nojs th,.nojs td{border-bottom:1px solid #f0eeea;padding:6px 10px;text-align:left}
</style>`;

function staticSite(): Plugin {
  return {
    name: 'ventaoo-static-site',
    apply: 'build',
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist');
      const shellPath = path.join(dist, 'index.html');
      if (!fs.existsSync(shellPath)) return;
      const shell = fs.readFileSync(shellPath, 'utf8');

      const posts = readPosts();
      const trips = readTrips();
      const latest = posts.slice(0, site.home.latestCount);

      const url = (route: string) => SITE_URL + (route === '' ? '/' : `/${route}/`);
      const page = (
        route: string,
        title: string,
        description: string,
        content: string,
        type = 'website',
      ) => {
        let html = renderShell(shell, { title, description, content: NOJS_CSS + content, url: url(route) });
        if (type !== 'website') html = fixOgType(html, type);
        return html;
      };
      const write = (route: string, html: string) => {
        const dir = path.join(dist, route);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'index.html'), html);
      };

      const postList = (list: ParsedPost[]) =>
        `<ul>${list
          .map(
            (p) =>
              `<li><a href="/blog/${p.slug}/">${p.title}</a> — <small>${p.date}</small><br>${p.summary}</li>`,
          )
          .join('')}</ul>`;

      const tripList = (list: ParsedTrip[]) =>
        `<ul>${list
          .map(
            (t) =>
              `<li><a href="/travel/${t.slug}/">${t.title}</a> — <small>${t.place} · ${dateRange(t.start, t.end)}</small><br>${t.summary}</li>`,
          )
          .join('')}</ul>`;

      const contact = `<ul>${site.links
        .map((l) => `<li><a href="${attr(l.href)}">${l.label}</a> — ${l.value}</li>`)
        .join('')}</ul>`;

      /* ── 首页 ── */
      write(
        '',
        page(
          '',
          site.seo.title,
          site.seo.description,
          `<h1>${site.name}</h1>
           <p><em>${site.hero.title.replace(/\n/g, ' ')}</em></p>
           <p>${site.hero.lead}</p>
           <p>${site.hero.actions.map((a) => `<a href="${attr(a.href)}">${a.label}</a>`).join(' · ')}</p>
           ${latest.length ? `<h2>${site.home.latest.title}</h2>${postList(latest)}` : ''}
           ${trips.length ? `<h2>${site.home.trips.title}</h2>${tripList(trips.slice(0, site.home.tripCount))}` : ''}`,
        ),
      );

      /* ── 随笔列表 ── */
      write(
        'blog',
        page(
          'blog',
          `${site.blog.title} · ${site.name}`,
          site.blog.intro,
          posts.length
            ? `<h1>${site.blog.title}</h1><p>${site.blog.intro}</p>${postList(posts)}`
            : `<h1>${site.blog.title}</h1><p>还没有文章。</p>`,
        ),
      );

      /* ── 旅途列表 ── */
      write(
        'travel',
        page(
          'travel',
          `${site.travel.title} · ${site.name}`,
          site.travel.intro,
          trips.length
            ? `<h1>${site.travel.title}</h1><p>${site.travel.intro}</p>${tripList(trips)}`
            : `<h1>${site.travel.title}</h1><p>还没有出门的记录。</p>`,
        ),
      );

      /* ── 关于 ── */
      write(
        'about',
        page(
          'about',
          `${site.about.title} · ${site.name}`,
          site.about.paragraphs[0] ?? site.seo.description,
          `<h1>${site.about.title}</h1>${site.about.paragraphs.map((p) => `<p>${p}</p>`).join('')}
           <h2>${site.about.colophon.title}</h2>
           <ul>${site.about.colophon.items.map((i) => `<li>${i}</li>`).join('')}</ul>
           <h2>联系</h2>${contact}`,
        ),
      );

      /* ── 随笔正文 ── */
      for (const p of posts) {
        const body = marked.parse(groupImages(p.body), { async: false, gfm: true }) as string;
        write(
          `blog/${p.slug}`,
          page(
            `blog/${p.slug}`,
            `${p.title} · ${site.name}`,
            p.summary,
            `<h1>${p.title}</h1><p><small>${p.date} · ${p.tags.join(' / ')}</small></p>${body}
             <p><a href="/blog/">← 返回${site.blog.title}</a></p>`,
            'article',
          ),
        );
      }

      /* ── 旅途故事 ── */
      for (const t of trips) {
        const body = marked.parse(groupImages(t.body), { async: false, gfm: true }) as string;
        write(
          `travel/${t.slug}`,
          page(
            `travel/${t.slug}`,
            `${t.title} · ${site.name}`,
            t.summary,
            `<h1>${t.title}</h1>
             <p><small>${t.place} · ${dateRange(t.start, t.end)} · ${t.days} 天</small></p>${body}
             <p><a href="/travel/">← 返回${site.travel.title}</a></p>`,
            'article',
          ),
        );
      }

      /* ── RSS：随笔全文输出 ── */
      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${xml(site.seo.title)}</title>
    <link>${SITE_URL}/</link>
    <description>${xml(site.seo.description)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${posts
  .map((p) => {
    const html = marked.parse(groupImages(p.body), { async: false, gfm: true }) as string;
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

      /* ── sitemap：lastmod 用真实日期 ── */
      const latestPost = posts[0]?.date;
      const latestTrip = trips[0]?.start;
      const urls: { loc: string; lastmod?: string }[] = [
        { loc: '/', lastmod: latestPost },
        { loc: '/blog/', lastmod: latestPost },
        { loc: '/travel/', lastmod: latestTrip },
        { loc: '/about/', lastmod: latestPost },
        ...posts.map((p) => ({ loc: `/blog/${p.slug}/`, lastmod: p.date })),
        ...trips.map((t) => ({ loc: `/travel/${t.slug}/`, lastmod: t.start })),
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
      fs.writeFileSync(
        path.join(dist, 'robots.txt'),
        'User-agent: *\nAllow: /\n\nSitemap: ' + SITE_URL + '/sitemap.xml\n',
      );

      console.log(
        `  static: ${posts.length + trips.length + 4} 个路由 · rss.xml（全文）· sitemap.xml · robots.txt`,
      );
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [staticSite()],
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
  server: { port: 5173, host: '127.0.0.1' },
});
