/** 旅途集合：一趟一行 front-matter，时间轴与故事页都从这里取数据。 */
import { toTrip, type ParsedTrip } from './frontmatter';

export type Trip = ParsedTrip;

const modules = import.meta.glob('/content/travel/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const trips: Trip[] = Object.entries(modules)
  .map(([path, raw]) => toTrip(path.split('/').pop()!.replace(/\.md$/, ''), raw))
  .filter((t) => !t.draft)
  .sort((a, b) => (a.start < b.start ? 1 : a.start > b.start ? -1 : 0));

export function getTrip(slug: string): Trip | undefined {
  return trips.find((t) => t.slug === slug);
}

/** 时间轴：从最近的一年往回排。 */
export function tripsByYear(): { year: string; items: Trip[] }[] {
  const groups: { year: string; items: Trip[] }[] = [];
  for (const t of trips) {
    const year = t.start.slice(0, 4);
    const last = groups[groups.length - 1];
    if (last && last.year === year) last.items.push(t);
    else groups.push({ year, items: [t] });
  }
  return groups;
}

/** newer 是更近的一趟，older 是更早的一趟。 */
export function tripNeighbours(slug: string): { newer?: Trip; older?: Trip } {
  const i = trips.findIndex((t) => t.slug === slug);
  if (i < 0) return {};
  return { newer: trips[i - 1], older: trips[i + 1] };
}

/** 一共去过多少趟、跨了多少年 —— 首页和旅途页的一句小注。 */
export function tripStats(): string {
  if (!trips.length) return '';
  const years = new Set(trips.map((t) => t.start.slice(0, 4)));
  const span = [...years].sort();
  const range = span.length > 1 ? `${span[0]}–${span[span.length - 1]}` : span[0];
  return `${trips.length} 趟 · ${range}`;
}
