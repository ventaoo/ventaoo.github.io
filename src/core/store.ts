/** Persisted preferences (theme, palette, effects) with a tiny pub/sub. */

export type Theme = 'night' | 'day';
export type Palette = 'dusk' | 'gameboy' | 'vapor' | 'amber';

export const PALETTES: Palette[] = ['dusk', 'gameboy', 'vapor', 'amber'];
export const PALETTE_LABEL: Record<Palette, string> = {
  dusk: '暮色',
  gameboy: '掌机绿',
  vapor: '蒸汽波',
  amber: '琥珀',
};

export interface Settings {
  theme: Theme;
  palette: Palette;
  crt: boolean;
  sound: boolean;
  music: boolean;
}

const KEY = 'pv:settings';
const VISITS_KEY = 'pv:visits';

const DEFAULTS: Settings = { theme: 'night', palette: 'dusk', crt: true, sound: true, music: false };

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as object) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export const settings: Settings = load();

/** How many times this browser has opened the site. */
export let visits = 1;
try {
  visits = Number(localStorage.getItem(VISITS_KEY) ?? '0') + 1;
  localStorage.setItem(VISITS_KEY, String(visits));
} catch {
  /* private mode — run without persistence */
}

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
    /* ignore */
  }
  if (key === 'theme') document.documentElement.dataset.theme = value as string;
  if (key === 'palette') document.documentElement.dataset.palette = value as string;
  if (key === 'crt') document.documentElement.dataset.crt = value ? 'on' : 'off';
  listeners.forEach((l) => l());
}

/** Reflect the persisted settings onto <html> before the first paint. */
export function applyBootState(): void {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.dataset.palette = settings.palette;
  root.dataset.crt = settings.crt ? 'on' : 'off';
}
