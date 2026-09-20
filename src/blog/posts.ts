/** 随笔集合：import.meta.glob 收文章，解析规则全部来自 frontmatter.ts。 */
import { toPost, type ParsedPost } from './frontmatter';

export type Post = ParsedPost;

const modules = import.meta.glob('/content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const posts: Post[] = Object.entries(modules)
  .map(([path, raw]) => toPost(path.split('/').pop()!.replace(/\.md$/, ''), raw))
  .filter((p) => !p.draft)
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

/** 按年份分组 —— 随笔列表页按年归档。 */
export function postsByYear(): { year: string; items: Post[] }[] {
  const groups: { year: string; items: Post[] }[] = [];
  for (const p of posts) {
    const year = p.date.slice(0, 4);
    const last = groups[groups.length - 1];
    if (last && last.year === year) last.items.push(p);
    else groups.push({ year, items: [p] });
  }
  return groups;
}

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

/** prev 是更早的一篇，next 是更新的一篇。 */
export function neighbours(slug: string): { prev?: Post; next?: Post } {
  const i = posts.findIndex((p) => p.slug === slug);
  if (i < 0) return {};
  return { prev: posts[i + 1], next: posts[i - 1] };
}
