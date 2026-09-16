/** Persisted preferences (theme + colour system) with a tiny pub/sub. */

export type Theme = 'light' | 'dark';
export type Scheme = 'signal' | 'riso' | 'mono' | 'earth';

export const SCHEMES: Scheme[] = ['signal', 'riso', 'mono', 'earth'];
export const SCHEME_LABEL: Record<Scheme, string> = {
  signal: '信号',
  riso: '丝网印',
  mono: '单色',
  earth: '土色',
};

export interface Settings {
  theme: Theme;
  scheme: Scheme;
}

const KEY = 'gx:settings';
const DEFAULTS: Settings = { theme: 'light', scheme: 'signal' };

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
    if (meta) meta.setAttribute('content', value === 'dark' ? '#111214' : '#f5f4f1');
  }
  if (key === 'scheme') document.documentElement.dataset.scheme = value as string;
  listeners.forEach((l) => l());
}

/** Reflect the persisted settings onto <html> before the first paint. */
export function applyBootState(): void {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.dataset.scheme = settings.scheme;
}
