/** Persisted preferences (theme + accent ink) with a tiny pub/sub. */

export type Theme = 'light' | 'dark';
export type Accent = 'vermillion' | 'indigo' | 'moss' | 'ochre';

export const ACCENTS: Accent[] = ['vermillion', 'indigo', 'moss', 'ochre'];
export const ACCENT_LABEL: Record<Accent, string> = {
  vermillion: '朱砂',
  indigo: '靛青',
  moss: '苔绿',
  ochre: '赭石',
};

export interface Settings {
  theme: Theme;
  accent: Accent;
}

const KEY = 'vx:settings';
const DEFAULTS: Settings = { theme: 'light', accent: 'vermillion' };

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
    if (meta) meta.setAttribute('content', value === 'dark' ? '#131210' : '#faf7f1');
  }
  if (key === 'accent') document.documentElement.dataset.ink = value as string;
  listeners.forEach((l) => l());
}

/** Reflect the persisted settings onto <html> before the first paint. */
export function applyBootState(): void {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.dataset.ink = settings.accent;
}
