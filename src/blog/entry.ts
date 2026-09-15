/** Shared rendering for the writing index (home page + archive). */
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

/** One row of the index. */
export function entryRow(p: Post, mini = false): string {
  const [, month, day] = p.date.split('-');
  const tags = p.tags.slice(0, mini ? 1 : 3);
  return `<li class="entry${mini ? ' entry--mini' : ''}" data-tags="${esc(p.tags.join(' '))}" data-search="${esc(
    (p.title + ' ' + p.summary + ' ' + p.tags.join(' ')).toLowerCase(),
  )}">
    <a href="/blog/${p.slug}" data-link>
      <time class="entry__date" datetime="${p.date}">${month} · ${day}</time>
      <span class="entry__body">
        <span class="entry__title">${esc(p.title)}</span>
        ${mini ? '' : `<span class="entry__desc">${esc(p.summary)}</span>`}
      </span>
      <span class="entry__tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</span>
    </a>
  </li>`;
}

/** A whole index, grouped by year. */
export function renderIndex(list: Post[], mini = false): string {
  return groupByYear(list)
    .map(
      ([year, items]) => `<section class="index__group">
      <h3 class="index__year label">${year}</h3>
      <ol>${items.map((p) => entryRow(p, mini)).join('')}</ol>
    </section>`,
    )
    .join('');
}
