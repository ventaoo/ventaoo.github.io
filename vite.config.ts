import { defineConfig, type Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import { site, SITE_URL } from './site.config';

interface Post { slug: string; title: string; date: string; summary: string; tags: string[]; body: string }

/** Read the markdown posts at build time so the feed, sitemap and prerendered
 *  route files all stay in sync with the content. */
function readPosts(): Post[] {
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
        tags: (data.tags ?? '').replace(/^\[|\]$/g, '').split(',').map((s) => s.trim()).filter(Boolean),
        body: fm ? raw.slice(fm[0].length) : raw,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

const xml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = (s: string) => s.replace(/"/g, '&quot;').replace(/</g, '&lt;');
const today = () => new Date().toISOString().slice(0, 10);

/**
 * GitHub Pages serves a static file per path; a pure SPA would answer every
 * deep link with an HTTP 404, which stops search engines from indexing
 * anything but "/". So we emit a real `index.html` per route with its own
 * title, meta description, canonical and the article body inside <noscript>.
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

/** Fallback styling for the no-JS / crawler view — same paper palette. */
const NOJS_CSS = `<style>
  .nojs{max-width:680px;margin:0 auto;padding:88px 24px 64px;background:#f7f4ed;color:#4f4a3b;
    font-family:Georgia,'Songti SC','Noto Serif CJK SC',serif;line-height:1.78;font-size:17px}
  .nojs a{color:#a83f28}
  .nojs h1{font-size:31px;font-weight:400;color:#191712;margin:0 0 6px;line-height:1.2}
  .nojs h2{font-size:20px;font-weight:500;color:#191712;margin:34px 0 10px;padding-top:14px;
    border-top:1px solid #ddd5c4}
  .nojs h3{font-size:17px;color:#191712;margin:24px 0 8px}
  .nojs p,.nojs li{color:#4f4a3b}
  .nojs small,.nojs .dim{color:#6f6858}
  .nojs ul,.nojs ol{padding-left:22px}
  .nojs blockquote{margin:18px 0;padding-left:18px;border-left:2px solid #a83f28;font-style:italic}
  .nojs code{background:#efeade;border:1px solid #e9e3d6;border-radius:3px;padding:1px 6px;font-size:14px}
  .nojs pre{background:#efeade;border:1px solid #ddd5c4;border-radius:2px;padding:14px;overflow-x:auto}
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
      const page = (route: string, title: string, description: string, content: string, type = 'website') =>
        renderShell(shell, { title, description, content: NOJS_CSS + content, url: url(route), type });

      const write = (route: string, html: string) => {
        const dir = path.join(dist, route);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'index.html'), html);
      };

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

      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(site.seo.title)}</title>
    <link>${SITE_URL}/</link>
    <description>${xml(site.seo.description)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items
  .map(
    (p) => `    <item>
      <title>${xml(p.title)}</title>
      <link>${SITE_URL}/blog/${p.slug}/</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${p.slug}/</guid>
      <pubDate>${new Date(p.date + 'T00:00:00Z').toUTCString()}</pubDate>
      <description>${xml(p.summary)}</description>
${p.tags.map((t) => '      <category>' + xml(t) + '</category>').join('\n')}
    </item>`,
  )
  .join('\n')}
  </channel>
</rss>
`;

      const urls = ['/', '/blog/', ...items.map((p) => `/blog/${p.slug}/`)];
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${SITE_URL}${u}</loc><lastmod>${items.find((p) => u.includes(p.slug))?.date ?? today()}</lastmod><changefreq>${u === '/' ? 'weekly' : 'monthly'}</changefreq></url>`,
  )
  .join('\n')}
</urlset>
`;

      fs.writeFileSync(path.join(dist, 'rss.xml'), rss);
      fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
      fs.writeFileSync(path.join(dist, 'robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: ' + SITE_URL + '/sitemap.xml\n');

      this.info(`static: ${items.length + 1} route files · rss.xml · sitemap.xml · robots.txt`);
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
