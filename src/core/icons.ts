/** A tiny hand-drawn icon set — hairline strokes, `currentColor`, no dependency. */

const S = (body: string, size = 20) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
  `stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

const REGISTRY: Record<string, string> = {
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/>',
  moon: '<path d="M20 14.2A8.4 8.4 0 1 1 9.8 4a6.8 6.8 0 0 0 10.2 10.2Z"/>',
  menu: '<path d="M4 9h16M4 15h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  arrowRight: '<path d="M4 12h15M13.5 6.2 19.6 12l-6.1 5.8"/>',
  arrowLeft: '<path d="M20 12H5M10.5 6.2 4.4 12l6.1 5.8"/>',
  external: '<path d="M14 4h6v6M20 4l-8.5 8.5M18 14.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4.5"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.2"/><path d="M15.4 15.4 20 20"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="1.4"/><path d="M15 5.6A1.6 1.6 0 0 0 13.4 4H5.6A1.6 1.6 0 0 0 4 5.6v7.8A1.6 1.6 0 0 0 5.6 15"/>',
  check: '<path d="M4.5 12.6 9.5 17.5 19.5 6.8"/>',
  rss: '<path d="M5 19h.01M4.8 11.4A8 8 0 0 1 12.6 19M4.8 5.6A14 14 0 0 1 18.4 19"/>',
};

/** Raw SVG markup for an icon, drawn at `size` px and coloured by `currentColor`. */
export function icon(name: string, size = 20): string {
  return S(REGISTRY[name] ?? REGISTRY.external, size);
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
