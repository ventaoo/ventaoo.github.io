/** The writing table — a numbered, aligned index. */
import { esc } from '../core/dom';
import type { Post } from './posts';

/** Split a list into year groups, newest first. */
export function groupByYear(list: Post[]): [string, Post[]][] {
  const map = new Map<string, Post[]>();
  for (const p of list) {
    const year = p.date.slice(0, 4);
    const bucket = map.get(year);
    if (bucket) bucket.push(p);
    else map.set(year, [p]);
  }
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

/** One row: index number · date · title · tags. */
export function row(p: Post, n: number, mini = false): string {
  const [, month, day] = p.date.split('-');
  const tags = p.tags.slice(0, mini ? 1 : 3);
  return `<li class="wrow${mini ? ' wrow--mini' : ''}"
    data-tags="${esc(p.tags.join(' '))}"
    data-search="${esc((p.title + ' ' + p.summary + ' ' + p.tags.join(' ')).toLowerCase())}">
    <span class="wrow__n num">${String(n).padStart(2, '0')}</span>
    <time class="wrow__date label" datetime="${p.date}">${month} · ${day}</time>
    <span class="wrow__body">
      <a class="wrow__title" href="/blog/${p.slug}" data-link>${esc(p.title)}</a>
      ${mini ? '' : `<span class="wrow__desc">${esc(p.summary)}</span>`}
    </span>
    <span class="wrow__tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</span>
  </li>`;
}

/** The whole table, grouped by year and numbered continuously. */
export function renderIndex(list: Post[], mini = false): string {
  let n = 0;
  return groupByYear(list)
    .map(
      ([year, items]) => `<section class="wgroup">
      <h3 class="wgroup__year label">${year}</h3>
      <ol>${items.map((p) => row(p, ++n, mini)).join('')}</ol>
    </section>`,
    )
    .join('');
}
