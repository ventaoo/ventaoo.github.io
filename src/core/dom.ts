/** Tiny DOM helpers — the whole site is rendered from template strings. */

export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T | null =>
  root.querySelector<T>(sel);

export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T[] =>
  Array.from(root.querySelectorAll<T>(sel));

export function on<K extends keyof HTMLElementEventMap>(
  el: EventTarget | null,
  type: K | string,
  fn: (ev: any) => void,
  opts?: AddEventListenerOptions,
): void {
  el?.addEventListener(type, fn as EventListener, opts);
}

/** Escape text destined for an HTML template literal. */
export function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const reducedMotion =
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
