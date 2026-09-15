/** Settings + save-file persistence (localStorage), with a tiny pub/sub. */

export type Theme = 'night' | 'day';
export type Palette = 'dusk' | 'gameboy' | 'vapor' | 'amber';

export interface Settings {
  theme: Theme;
  palette: Palette;
  crt: boolean;
  sound: boolean;
  music: boolean;
}

export interface SaveFile {
  xp: number;
  level: number;
  achievements: string[];
  visits: number;
  pagesSeen: string[];
  postsRead: string[];
}

const S_KEY = 'pv:settings';
const F_KEY = 'pv:save';

const defaultSettings: Settings = { theme: 'night', palette: 'dusk', crt: true, sound: true, music: false };
const defaultSave: SaveFile = { xp: 0, level: 1, achievements: [], visits: 0, pagesSeen: [], postsRead: [] };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ...fallback };
    return { ...fallback, ...(JSON.parse(raw) as object) };
  } catch {
    return { ...fallback };
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode — run without persistence */
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();

export const settings: Settings = read(S_KEY, defaultSettings);
export const save: SaveFile = read(F_KEY, defaultSave);

export function notify(): void {
  listeners.forEach((l) => l());
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  settings[key] = value;
  write(S_KEY, settings);
  if (key === 'theme') document.documentElement.dataset.theme = value as string;
  if (key === 'palette') document.documentElement.dataset.palette = value as string;
  if (key === 'crt') document.documentElement.dataset.crt = value ? 'on' : 'off';
  notify();
}

export function saveGame(): void {
  write(F_KEY, save);
}

export function resetSave(): void {
  Object.assign(save, defaultSave);
  saveGame();
  notify();
}

/** Apply the persisted state to the document before the first paint. */
export function applyBootState(): void {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.dataset.palette = settings.palette;
  root.dataset.crt = settings.crt ? 'on' : 'off';
  save.visits += 1;
  saveGame();
}
