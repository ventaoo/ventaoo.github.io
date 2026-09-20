/** 极简线性图标集：统一 24 格、currentColor、1.5 描边，不引第三方依赖。 */

const S = (body: string, size = 20) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
  `stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

const REGISTRY: Record<string, string> = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.6v2.1M12 19.3v2.1M2.6 12h2.1M19.3 12h2.1M5.4 5.4l1.5 1.5M17.1 17.1l1.5 1.5M18.6 5.4l-1.5 1.5M6.9 17.1l-1.5 1.5"/>',
  moon: '<path d="M20.2 14.4A8.6 8.6 0 1 1 9.6 3.8a7 7 0 0 0 10.6 10.6Z"/>',
  arrow: '<path d="M4.5 12h14M12.8 6.2 18.6 12l-5.8 5.8"/>',
  pin: '<path d="M12 21s6.4-5.6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15.4 12 21 12 21Z"/><circle cx="12" cy="10.4" r="2.4"/>',
  rss: '<path d="M5 18.6h.01M4.8 11.4A8 8 0 0 1 12.6 19M4.8 5.6A14 14 0 0 1 18.4 19"/>',
  mail: '<rect x="3.4" y="5.4" width="17.2" height="13.2" rx="2"/><path d="m3.8 7 8.2 6 8.2-6"/>',
  github: '<path d="M9.2 20.4c-4 1.1-4-2.2-5.6-2.6m11.2 5v-3.4c0-1 .1-1.7-.5-2.4 2.4-.3 4.5-1.2 4.5-5.2a4 4 0 0 0-1.1-2.8 3.7 3.7 0 0 0-.1-2.8s-.9-.3-3 1.1a10.4 10.4 0 0 0-5.4 0C7 5.9 6.1 6.2 6.1 6.2a3.7 3.7 0 0 0-.1 2.8 4 4 0 0 0-1.1 2.8c0 4 2.1 4.9 4.5 5.2-.6.7-.6 1.4-.5 2.4v3.4"/>',
};

/** Raw SVG markup for an icon, drawn at `size` px and coloured by `currentColor`. */
export function icon(name: string, size = 20): string {
  return S(REGISTRY[name] ?? REGISTRY.arrow, size);
}

/** Replace every `[data-icon]` placeholder inside `root` with its SVG. */
export function hydrateIcons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-icon]').forEach((el) => {
    const name = el.dataset.icon;
    if (!name || el.dataset.iconDone === name) return;
    el.dataset.iconDone = name;
    el.innerHTML = icon(name, Number(el.dataset.iconSize ?? 20));
  });
}
