/** Persisted preferences (theme only) with a tiny pub/sub. */

export type Theme = 'light' | 'dark';

export interface Settings {
  theme: Theme;
}

const KEY = 'mx:settings';
const DEFAULTS: Settings = { theme: 'light' };

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as object) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export const settings: Settings = load();

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  settings[key] = value;
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* private mode */
  }
  if (key === 'theme') {
    document.documentElement.dataset.theme = value as string;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', value === 'dark' ? '#141311' : '#f6f3ea');
  }
  listeners.forEach((l) => l());
}

/** Reflect the persisted settings onto <html> before the first paint. */
export function applyBootState(): void {
  document.documentElement.dataset.theme = settings.theme;
}
