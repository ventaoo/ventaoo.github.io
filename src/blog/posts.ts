/** 文章集合：import.meta.glob 收文章，解析规则全部来自 frontmatter.ts。 */
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
