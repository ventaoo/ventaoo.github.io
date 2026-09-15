/** Front-matter parsing + a tiny in-memory content collection. */
import { plain, renderMarkdown, type Heading } from './markdown';

export interface Post {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  body: string;
  featured: boolean;
  draft: boolean;
  /** estimated reading time in minutes */
  reading: number;
}

const modules = import.meta.glob('/content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) return { data: {}, body: raw };
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx < 1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, body: raw.slice(match[0].length) };
}

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((s) => s.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

/** CJK-aware reading time: ~380 hanzi/min and ~200 latin words/min. */
function readingTime(body: string): number {
  const hanzi = (body.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const words = (body.replace(/[\u4e00-\u9fa5]/g, ' ').match(/\b\w+\b/g) ?? []).length;
  return Math.max(1, Math.round(hanzi / 380 + words / 200));
}

export const posts: Post[] = Object.entries(modules)
  .map(([path, raw]) => {
    const { data, body } = parseFrontmatter(raw);
    const slug = path.split('/').pop()!.replace(/\.md$/, '');
    return {
      slug,
      title: data.title ?? slug,
      date: data.date ?? '2026-01-01',
      tags: parseList(data.tags),
      summary: data.summary ?? plain(body).slice(0, 120) + '…',
      body,
      featured: data.featured === 'true',
      draft: data.draft === 'true',
      reading: readingTime(body),
    };
  })
  .filter((p) => !p.draft)
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

export const tags: { name: string; count: number }[] = Object.entries(
  posts.reduce<Record<string, number>>((acc, p) => {
    for (const t of p.tags) acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {}),
)
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export function neighbours(slug: string): { prev?: Post; next?: Post } {
  const i = posts.findIndex((p) => p.slug === slug);
  if (i < 0) return {};
  return { prev: posts[i + 1], next: posts[i - 1] };
}

export function renderPost(post: Post): { html: string; headings: Heading[] } {
  return renderMarkdown(post.body);
}

export function related(post: Post, limit = 3): Post[] {
  return posts
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({ p, score: p.tags.filter((t) => post.tags.includes(t)).length }))
    .sort((a, b) => b.score - a.score || (a.p.date < b.p.date ? 1 : -1))
    .slice(0, limit)
    .map((x) => x.p);
}
