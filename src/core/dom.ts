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

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Deterministic PRNG so the procedural pixel art is identical on every load. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type RGB = [number, number, number];

export function hex2rgb(hex: string): RGB {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h || '000000', 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const rgb2css = (c: RGB, alpha = 1) =>
  alpha >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${alpha})`;

export function mixRGB(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/** Read a CSS custom property off :root as a resolved colour string. */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000000';
}

export function fmtDate(iso: string, lang = 'zh-CN'): string {
  const d = new Date(iso + (iso.length <= 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang, { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function debounce<T extends (...a: any[]) => void>(fn: T, ms: number): T {
  let t: number | undefined;
  return ((...a: any[]) => {
    clearTimeout(t);
    t = window.setTimeout(() => fn(...a), ms);
  }) as T;
}
