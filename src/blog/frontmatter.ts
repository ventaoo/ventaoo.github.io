/**
 * Front-matter 的唯一解析实现 —— 客户端 (posts.ts) 与构建期 (vite.config.ts)
 * 都从这里取，保证「草稿不发布」这类规则只有一处真相。
 * 纯函数、没有 DOM 依赖，Node 和浏览器两边都能跑。
 */

export interface Frontmatter {
  data: Record<string, string>;
  body: string;
}

export function parseFrontmatter(raw: string): Frontmatter {
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

export function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((s) => s.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

/** Strip markdown syntax to plain text (for summaries and search). */
export function plain(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** CJK-aware reading time: ~380 hanzi/min and ~200 latin words/min. */
export function readingTime(body: string): number {
  const hanzi = (body.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const words = (body.replace(/[\u4e00-\u9fa5]/g, ' ').match(/\b\w+\b/g) ?? []).length;
  return Math.max(1, Math.round(hanzi / 380 + words / 200));
}

export interface ParsedPost {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  /** 可选封面，相对 public 的路径 */
  cover: string;
  body: string;
  draft: boolean;
  reading: number;
}

/** One place that turns a raw .md file into a post — draft rule included. */
export function toPost(slug: string, raw: string): ParsedPost {
  const { data, body } = parseFrontmatter(raw);
  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? '1970-01-01',
    tags: parseList(data.tags),
    summary: data.summary ?? plain(body).slice(0, 110) + '…',
    cover: data.cover ?? '',
    body,
    draft: data.draft === 'true',
    reading: readingTime(body),
  };
}

/** 2025-09-20 → 2025.09.20 */
export function dotted(date: string): string {
  return date.replace(/-/g, '.');
}
