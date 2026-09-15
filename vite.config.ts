import { defineConfig, type Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://ventaoo.github.io';

interface FeedItem { slug: string; title: string; date: string; summary: string; tags: string[] }

/** Read the markdown posts at build time so the feed and sitemap stay in sync. */
function readPosts(): FeedItem[] {
  const dir = path.resolve(__dirname, 'content/posts');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
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
        tags: (data.tags ?? '')
          .replace(/^\[|\]$/g, '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

const xml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Emit rss.xml, sitemap.xml and robots.txt into the build output. */
function feedPlugin(): Plugin {
  return {
    name: 'pixelverse-feed',
    apply: 'build',
    closeBundle() {
      const out = path.resolve(__dirname, 'dist');
      const items = readPosts();
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

      const urls = ['/', '/blog', '/projects', '/lab', '/about', ...items.map((p) => '/blog/' + p.slug)];
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${SITE}${u}</loc>
    <changefreq>${u === '/' ? 'weekly' : 'monthly'}</changefreq>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

      const robots = 'User-agent: *\nAllow: /\n\nSitemap: ' + SITE + '/sitemap.xml\n';

      fs.writeFileSync(path.join(out, 'rss.xml'), rss);
      fs.writeFileSync(path.join(out, 'sitemap.xml'), sitemap);
      fs.writeFileSync(path.join(out, 'robots.txt'), robots);
      this.info('feed: wrote rss.xml · sitemap.xml · robots.txt (' + items.length + ' posts)');
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [feedPlugin()],
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
  server: { port: 5173, host: '127.0.0.1' },
});
